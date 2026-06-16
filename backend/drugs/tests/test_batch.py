import json
from pathlib import Path

import pytest

from drugs.models import AuditLog, Drug

BATCH_URL = "/api/drugs/batch/"
SEED_FILE = Path(__file__).resolve().parents[3] / "seed_drugs.json"


def _valid_record(ndc: str, name: str = "Batch Drug") -> dict:
    return {
        "ndc": ndc,
        "drug_name": name,
        "manufacturer": "BatchCo",
        "dosage_form": "TABLET",
        "strength": "10mg",
        "package_size": 30,
        "unit_price": "4.50",
        "dea_schedule": None,
    }


@pytest.mark.django_db
class TestBatchUpsert:
    def test_batch_creates_new_records(self, api_client):
        payload = [_valid_record("30001-0001-01"), _valid_record("30002-0002-02")]
        resp = api_client.post(BATCH_URL, payload, format="json")
        assert resp.status_code == 200

        body = resp.json()
        assert body["created"] == 2
        assert body["updated"] == 0
        assert body["errors"] == 0
        assert len(body["results"]) == 2
        assert all(row["status"] == "created" for row in body["results"])
        assert Drug.objects.filter(ndc__in=["30001-0001-01", "30002-0002-02"]).count() == 2

    def test_batch_updates_existing_records(self, api_client):
        record = _valid_record("30003-0003-03")
        api_client.post("/api/drugs/", record, format="json")

        updated_payload = [{**record, "drug_name": "Updated Batch Name"}]
        resp = api_client.post(BATCH_URL, updated_payload, format="json")
        assert resp.status_code == 200

        body = resp.json()
        assert body["created"] == 0
        assert body["updated"] == 1
        assert body["errors"] == 0
        assert body["results"][0]["status"] == "updated"
        assert Drug.objects.get(ndc=record["ndc"]).drug_name == "Updated Batch Name"

    def test_batch_idempotent_unchanged(self, api_client):
        record = _valid_record("30004-0004-04")
        api_client.post(BATCH_URL, [record], format="json")
        before_count = Drug.objects.count()

        resp = api_client.post(BATCH_URL, [record], format="json")
        assert resp.status_code == 200
        body = resp.json()
        assert body["created"] == 0
        assert body["updated"] == 0
        assert body["errors"] == 0
        assert body["results"][0]["status"] == "updated"
        assert Drug.objects.count() == before_count


@pytest.mark.django_db
class TestBatchMixedErrors:
    def test_invalid_record_does_not_abort_batch(self, api_client):
        payload = [
            _valid_record("30010-0010-10"),
            {"ndc": "bad-ndc", "drug_name": "Bad"},
            _valid_record("30011-0011-11"),
            _valid_record("30012-0012-12"),
            _valid_record("30013-0013-13"),
        ]
        resp = api_client.post(BATCH_URL, payload, format="json")
        assert resp.status_code == 200

        body = resp.json()
        assert body["created"] == 4
        assert body["errors"] == 1
        assert Drug.objects.count() == 4

        error_rows = [row for row in body["results"] if row["status"] == "error"]
        assert len(error_rows) == 1
        assert error_rows[0]["ndc"] == "bad-ndc"
        assert "error" in error_rows[0]

    def test_non_array_body_returns_400(self, api_client):
        resp = api_client.post(BATCH_URL, {"ndc": "30020-0020-20"}, format="json")
        assert resp.status_code == 400
        assert resp.json()["error"] == "validation_error"


@pytest.mark.django_db
class TestBatchSeedPayload:
    def test_full_seed_batch(self, api_client):
        assert SEED_FILE.exists()
        records = json.loads(SEED_FILE.read_text(encoding="utf-8"))
        assert len(records) == 109

        resp = api_client.post(BATCH_URL, records, format="json")
        assert resp.status_code == 200

        body = resp.json()
        assert body["errors"] == 0
        assert body["created"] == 109
        assert Drug.objects.count() == 109

        resp2 = api_client.post(BATCH_URL, records, format="json")
        assert resp2.status_code == 200
        body2 = resp2.json()
        assert body2["created"] == 0
        assert body2["updated"] == 0
        assert body2["errors"] == 0
        assert Drug.objects.count() == 109


@pytest.mark.django_db
class TestBatchAudit:
    def test_batch_create_writes_audit_log(self, api_client):
        record = _valid_record("30030-0030-30")
        api_client.post(BATCH_URL, [record], format="json")
        assert AuditLog.objects.filter(
            action=AuditLog.Action.CREATE, drug_ndc=record["ndc"]
        ).exists()
