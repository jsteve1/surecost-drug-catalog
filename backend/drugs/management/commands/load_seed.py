import json
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from drugs.models import Drug
from drugs.serializers import DrugSerializer

DEFAULT_SEED_PATH = Path(__file__).resolve().parents[4] / "seed_drugs.json"


class Command(BaseCommand):
    help = "Load drug seed data from JSON (idempotent upsert by NDC)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            type=str,
            default=str(DEFAULT_SEED_PATH),
            help="Path to seed JSON file (default: repo-root seed_drugs.json)",
        )

    def handle(self, *args, **options):
        seed_path = Path(options["file"])
        if not seed_path.exists():
            raise CommandError(f"Seed file not found: {seed_path}")

        with seed_path.open(encoding="utf-8") as handle:
            records = json.load(handle)

        if not isinstance(records, list):
            raise CommandError("Seed file must contain a JSON array of drug records.")

        created = 0
        updated = 0
        unchanged = 0
        skipped = 0

        for index, record in enumerate(records, start=1):
            try:
                result = self._upsert_record(record)
            except Exception as exc:
                skipped += 1
                self.stderr.write(
                    self.style.WARNING(f"Row {index} skipped ({record.get('ndc', '?')}): {exc}")
                )
                continue

            if result == "created":
                created += 1
            elif result == "updated":
                updated += 1
            elif result == "unchanged":
                unchanged += 1
            else:
                skipped += 1

        self.stdout.write(
            self.style.SUCCESS(
                "Seed load complete: "
                f"created={created}, updated={updated}, unchanged={unchanged}, skipped={skipped}"
            )
        )

    @transaction.atomic
    def _upsert_record(self, record: dict) -> str:
        ndc = record.get("ndc")
        existing = Drug.objects.filter(ndc=ndc).first() if ndc else None

        serializer = DrugSerializer(instance=existing, data=record)
        serializer.is_valid(raise_exception=True)
        validated = serializer.validated_data

        if existing is None:
            Drug.objects.create(**validated)
            return "created"

        changed_fields = {
            field: value
            for field, value in validated.items()
            if getattr(existing, field) != value
        }
        if not changed_fields:
            return "unchanged"

        for field, value in changed_fields.items():
            setattr(existing, field, value)
        existing.save(update_fields=list(changed_fields.keys()))
        return "updated"
