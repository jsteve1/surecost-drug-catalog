import pytest
from django.core.management import call_command
from pathlib import Path

SCHEDULE_SUMMARY_URL = "/api/drugs/schedule-summary/"
SEED_FILE = Path(__file__).resolve().parents[3] / "seed_drugs.json"

EXPECTED_SEED_COUNTS = {
    "II": 12,
    "III": 2,
    "IV": 8,
    "V": 3,
    "non_controlled": 84,
}


@pytest.mark.django_db
class TestScheduleSummary:
    def test_empty_database_returns_zeros(self, api_client):
        resp = api_client.get(SCHEDULE_SUMMARY_URL)
        assert resp.status_code == 200
        assert resp.json() == {
            "II": 0,
            "III": 0,
            "IV": 0,
            "V": 0,
            "non_controlled": 0,
        }

    def test_counts_match_seed_data(self, api_client):
        assert SEED_FILE.exists()
        call_command("load_seed", "--file", str(SEED_FILE), verbosity=0)

        resp = api_client.get(SCHEDULE_SUMMARY_URL)
        assert resp.status_code == 200
        assert resp.json() == EXPECTED_SEED_COUNTS

    def test_counts_with_seeded_drugs_fixture(self, api_client, seeded_drugs):
        resp = api_client.get(SCHEDULE_SUMMARY_URL)
        assert resp.status_code == 200
        data = resp.json()
        assert data["II"] == 1
        assert data["III"] == 1
        assert data["non_controlled"] == 3
        assert data["IV"] == 0
        assert data["V"] == 0
        assert sum(data.values()) == 5
