import json
import logging
from decimal import Decimal

from django.db.models import Count
from drf_spectacular.utils import OpenApiResponse, extend_schema, inline_serializer
from rest_framework import serializers, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet

from .filters import DrugFilterSet
from .models import AuditLog, Drug
from .serializers import AuditLogSerializer, DrugSerializer

logger = logging.getLogger(__name__)

AUDIT_FIELDS = (
    "ndc",
    "drug_name",
    "manufacturer",
    "dosage_form",
    "strength",
    "package_size",
    "unit_price",
    "dea_schedule",
)


def _serialize_audit_value(value):
    if isinstance(value, Decimal):
        return str(value)
    return value


def _drug_field_values(drug: Drug) -> dict:
    return {field: _serialize_audit_value(getattr(drug, field)) for field in AUDIT_FIELDS}


def _build_create_changes(drug: Drug) -> dict:
    return {
        field: {"before": None, "after": _serialize_audit_value(getattr(drug, field))}
        for field in AUDIT_FIELDS
    }


def _build_update_changes(before: Drug, after: Drug) -> dict:
    changes = {}
    for field in AUDIT_FIELDS:
        old = _serialize_audit_value(getattr(before, field))
        new = _serialize_audit_value(getattr(after, field))
        if old != new:
            changes[field] = {"before": old, "after": new}
    return changes


def _build_delete_changes(drug: Drug) -> dict:
    return {
        field: {"before": _serialize_audit_value(getattr(drug, field)), "after": None}
        for field in AUDIT_FIELDS
    }


def _create_audit_log(
    *,
    drug: Drug | None,
    action: str,
    changes: dict,
    drug_ndc: str | None = None,
    drug_name: str | None = None,
) -> AuditLog:
    return AuditLog.objects.create(
        drug=drug,
        drug_ndc=drug_ndc or (drug.ndc if drug else ""),
        drug_name=drug_name or (drug.drug_name if drug else ""),
        action=action,
        changes=changes,
    )


def _log_schedule_ii_mutation(drug: Drug, mutation: str) -> None:
    if drug.dea_schedule == Drug.DeaSchedule.II:
        logger.warning(
            json.dumps(
                {
                    "event": "controlled_substance_mutation",
                    "mutation": mutation,
                    "ndc": drug.ndc,
                    "drug_id": drug.pk,
                }
            )
        )


class DrugViewSet(ModelViewSet):
    queryset = Drug.objects.all()
    serializer_class = DrugSerializer
    filterset_class = DrugFilterSet

    def create(self, request, *args, **kwargs):
        ndc = request.data.get("ndc")
        if ndc:
            existing = Drug.objects.filter(ndc=ndc).first()
            if existing is not None:
                serializer = self.get_serializer(existing)
                return Response(serializer.data, status=status.HTTP_200_OK)

        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        drug = serializer.save()
        _create_audit_log(
            drug=drug,
            action=AuditLog.Action.CREATE,
            changes=_build_create_changes(drug),
        )

    def perform_update(self, serializer):
        before = Drug.objects.get(pk=serializer.instance.pk)
        _log_schedule_ii_mutation(before, "update")
        drug = serializer.save()
        changes = _build_update_changes(before, drug)
        if changes:
            _create_audit_log(
                drug=drug,
                action=AuditLog.Action.UPDATE,
                changes=changes,
            )

    def perform_destroy(self, instance):
        _log_schedule_ii_mutation(instance, "delete")
        changes = _build_delete_changes(instance)
        _create_audit_log(
            drug=None,
            action=AuditLog.Action.DELETE,
            changes=changes,
            drug_ndc=instance.ndc,
            drug_name=instance.drug_name,
        )
        instance.delete()

    @extend_schema(
        responses={
            200: inline_serializer(
                name="ScheduleSummary",
                fields={
                    "II": serializers.IntegerField(),
                    "III": serializers.IntegerField(),
                    "IV": serializers.IntegerField(),
                    "V": serializers.IntegerField(),
                    "non_controlled": serializers.IntegerField(),
                },
            )
        }
    )
    @action(detail=False, methods=["get"], url_path="schedule-summary")
    def schedule_summary(self, request):
        counts = {schedule: 0 for schedule in ("II", "III", "IV", "V")}
        counts["non_controlled"] = 0

        for row in Drug.objects.values("dea_schedule").annotate(count=Count("id")):
            schedule = row["dea_schedule"]
            if schedule is None:
                counts["non_controlled"] = row["count"]
            else:
                counts[schedule] = row["count"]

        return Response(counts)

    @extend_schema(
        request=inline_serializer(
            name="DrugBatchRequest",
            fields={
                "records": serializers.ListField(child=DrugSerializer()),
            },
        ),
        responses={
            200: inline_serializer(
                name="DrugBatchResponse",
                fields={
                    "created": serializers.IntegerField(),
                    "updated": serializers.IntegerField(),
                    "errors": serializers.IntegerField(),
                    "results": serializers.ListField(
                        child=inline_serializer(
                            name="DrugBatchResult",
                            fields={
                                "ndc": serializers.CharField(),
                                "status": serializers.ChoiceField(
                                    choices=["created", "updated", "error"]
                                ),
                                "error": serializers.CharField(required=False),
                            },
                        )
                    ),
                },
            ),
            400: OpenApiResponse(description="Request body must be a JSON array."),
        },
    )
    @action(detail=False, methods=["post"], url_path="batch")
    def batch(self, request):
        records = request.data
        if not isinstance(records, list):
            return Response(
                {
                    "error": "validation_error",
                    "detail": "Request body must be a JSON array of drug objects.",
                    "field_errors": {},
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        created = 0
        updated = 0
        errors = 0
        results = []

        for record in records:
            if not isinstance(record, dict):
                errors += 1
                results.append(
                    {
                        "ndc": "",
                        "status": "error",
                        "error": "Each batch item must be a JSON object.",
                    }
                )
                continue

            ndc = record.get("ndc", "")
            existing = Drug.objects.filter(ndc=ndc).first() if ndc else None
            serializer = DrugSerializer(instance=existing, data=record)

            if not serializer.is_valid():
                errors += 1
                results.append(
                    {
                        "ndc": ndc,
                        "status": "error",
                        "error": serializer.errors,
                    }
                )
                continue

            validated = serializer.validated_data
            if existing is None:
                drug = Drug.objects.create(**validated)
                _create_audit_log(
                    drug=drug,
                    action=AuditLog.Action.CREATE,
                    changes=_build_create_changes(drug),
                )
                created += 1
                results.append({"ndc": drug.ndc, "status": "created"})
                continue

            before = Drug.objects.get(pk=existing.pk)
            field_snapshot = {field: getattr(before, field) for field in AUDIT_FIELDS}
            changed_fields = {
                field: value
                for field, value in validated.items()
                if _serialize_audit_value(field_snapshot[field]) != _serialize_audit_value(value)
            }

            if not changed_fields:
                results.append({"ndc": before.ndc, "status": "updated"})
                continue

            for field, value in changed_fields.items():
                setattr(before, field, value)
            before.save(update_fields=list(changed_fields.keys()))

            changes = {
                field: {
                    "before": _serialize_audit_value(field_snapshot[field]),
                    "after": _serialize_audit_value(getattr(before, field)),
                }
                for field in changed_fields
            }
            _create_audit_log(
                drug=before,
                action=AuditLog.Action.UPDATE,
                changes=changes,
            )
            updated += 1
            results.append({"ndc": before.ndc, "status": "updated"})

        return Response(
            {
                "created": created,
                "updated": updated,
                "errors": errors,
                "results": results,
            }
        )

    @extend_schema(responses={200: AuditLogSerializer(many=True)})
    @action(detail=True, methods=["get"], url_path="audit")
    def audit(self, request, pk=None):
        drug = self.get_object()
        queryset = AuditLog.objects.filter(drug=drug)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = AuditLogSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = AuditLogSerializer(queryset, many=True)
        return Response(serializer.data)


class AuditLogViewSet(ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    http_method_names = ["get", "head", "options"]
