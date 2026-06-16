from pathlib import Path

import pytest
from django.core.management import call_command

from drugs.models import Drug


# tests/ → drugs/ → backend/ → surecost-drug-catalog/
SEED_FILE = Path(__file__).resolve().parents[3] / "seed_drugs.json"
HEALTH_URL = "/api/health/"


@pytest.mark.django_db
class TestHealthEndpoint:
    def test_health_returns_ok(self, api_client):
        resp = api_client.get(HEALTH_URL)
        assert resp.status_code == 200
        assert resp.json() == {"status": "ok"}


@pytest.mark.django_db
class TestSeedIdempotency:
    def test_load_seed_creates_109_records(self):
        assert SEED_FILE.exists(), f"seed_drugs.json not found at {SEED_FILE}"
        call_command("load_seed", "--file", str(SEED_FILE), verbosity=0)
        assert Drug.objects.count() == 109

    def test_load_seed_is_idempotent(self):
        assert SEED_FILE.exists(), f"seed_drugs.json not found at {SEED_FILE}"
        call_command("load_seed", "--file", str(SEED_FILE), verbosity=0)
        call_command("load_seed", "--file", str(SEED_FILE), verbosity=0)
        assert Drug.objects.count() == 109
