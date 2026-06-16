import pytest

from drugs.models import AuditLog, Drug

DRUGS_URL = "/api/drugs/"
AUDIT_URL = "/api/audit/"


@pytest.mark.django_db
class TestAuditCreate:
    def test_create_produces_audit_row(self, api_client, drug_data):
        resp = api_client.post(DRUGS_URL, drug_data, format="json")
        assert resp.status_code == 201

        logs = AuditLog.objects.filter(action=AuditLog.Action.CREATE)
        assert logs.count() == 1

        log = logs.first()
        assert log.drug_ndc == drug_data["ndc"]
        assert log.drug_name == drug_data["drug_name"]
        assert log.actor == "system"
        assert "ndc" in log.changes
        assert log.changes["ndc"]["after"] == drug_data["ndc"]
        assert log.changes["ndc"]["before"] is None

    def test_duplicate_create_does_not_audit(self, api_client, drug_data):
        api_client.post(DRUGS_URL, drug_data, format="json")
        api_client.post(DRUGS_URL, drug_data, format="json")
        assert AuditLog.objects.count() == 1


@pytest.mark.django_db
class TestAuditUpdate:
    def test_update_logs_changed_fields_only(self, api_client, created_drug, drug_data):
        drug_id = created_drug["id"]
        updated = {**drug_data, "drug_name": "Renamed Drug"}
        resp = api_client.put(f"{DRUGS_URL}{drug_id}/", updated, format="json")
        assert resp.status_code == 200

        log = AuditLog.objects.get(action=AuditLog.Action.UPDATE)
        assert set(log.changes.keys()) == {"drug_name"}
        assert log.changes["drug_name"]["before"] == drug_data["drug_name"]
        assert log.changes["drug_name"]["after"] == "Renamed Drug"

    def test_no_op_update_skips_audit(self, api_client, created_drug, drug_data):
        drug_id = created_drug["id"]
        api_client.put(f"{DRUGS_URL}{drug_id}/", drug_data, format="json")
        assert AuditLog.objects.filter(action=AuditLog.Action.UPDATE).count() == 0


@pytest.mark.django_db
class TestAuditDelete:
    def test_delete_logs_snapshot(self, api_client, created_drug, drug_data):
        drug_id = created_drug["id"]
        resp = api_client.delete(f"{DRUGS_URL}{drug_id}/")
        assert resp.status_code == 204

        log = AuditLog.objects.get(action=AuditLog.Action.DELETE)
        assert log.drug is None
        assert log.drug_ndc == drug_data["ndc"]
        assert log.drug_name == drug_data["drug_name"]
        assert log.changes["drug_name"]["before"] == drug_data["drug_name"]
        assert log.changes["drug_name"]["after"] is None


@pytest.mark.django_db
class TestAuditApi:
    def test_global_audit_feed(self, api_client, created_drug, drug_data):
        drug_id = created_drug["id"]
        api_client.patch(
            f"{DRUGS_URL}{drug_id}/",
            {"drug_name": "Audit Feed Test"},
            format="json",
        )

        resp = api_client.get(AUDIT_URL)
        assert resp.status_code == 200
        data = resp.json()
        assert data["count"] >= 2
        assert "results" in data

        entry = data["results"][0]
        assert entry["drug_ndc"] == drug_data["ndc"]
        assert entry["drug_name"] in (drug_data["drug_name"], "Audit Feed Test")
        assert "changes" in entry

    def test_per_drug_audit_endpoint(self, api_client, created_drug, drug_data):
        drug_id = created_drug["id"]
        api_client.patch(
            f"{DRUGS_URL}{drug_id}/",
            {"drug_name": "Per Drug History"},
            format="json",
        )

        resp = api_client.get(f"{DRUGS_URL}{drug_id}/audit/")
        assert resp.status_code == 200
        data = resp.json()
        assert data["count"] == 2
        actions = {row["action"] for row in data["results"]}
        assert actions == {"CREATE", "UPDATE"}

    def test_audit_is_read_only(self, api_client):
        resp = api_client.post(AUDIT_URL, {}, format="json")
        assert resp.status_code == 405


@pytest.mark.django_db
class TestScheduleIiLogging:
    def test_schedule_ii_update_logs_warning(self, api_client, caplog):
        drug = Drug.objects.create(
            ndc="20001-0001-01",
            drug_name="Ritalin",
            manufacturer="Novartis",
            dosage_form="TABLET",
            strength="10mg",
            package_size=100,
            unit_price="12.50",
            dea_schedule="II",
        )

        with caplog.at_level("WARNING"):
            api_client.patch(
                f"{DRUGS_URL}{drug.id}/",
                {"strength": "20mg"},
                format="json",
            )

        assert any("controlled_substance_mutation" in record.message for record in caplog.records)

    def test_schedule_ii_delete_logs_warning(self, api_client, caplog):
        drug = Drug.objects.create(
            ndc="20002-0002-02",
            drug_name="Ritalin",
            manufacturer="Novartis",
            dosage_form="TABLET",
            strength="10mg",
            package_size=100,
            unit_price="12.50",
            dea_schedule="II",
        )

        with caplog.at_level("WARNING"):
            api_client.delete(f"{DRUGS_URL}{drug.id}/")

        assert any("controlled_substance_mutation" in record.message for record in caplog.records)
