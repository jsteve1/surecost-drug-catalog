import pytest
from rest_framework.test import APIClient

from drugs.models import Drug


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def drug_data():
    return {
        "ndc": "12345-6789-01",
        "drug_name": "Test Drug Alpha",
        "manufacturer": "TestCo",
        "dosage_form": "TABLET",
        "strength": "100mg",
        "package_size": 30,
        "unit_price": "9.99",
        "dea_schedule": None,
    }


@pytest.fixture
def created_drug(api_client, drug_data):
    resp = api_client.post("/api/drugs/", drug_data, format="json")
    assert resp.status_code == 201
    return resp.json()


@pytest.fixture
def seeded_drugs(db):
    """Create a small set of drugs for filter/search/pagination tests."""
    records = [
        Drug(
            ndc="10001-0001-01",
            drug_name="Amoxicillin",
            manufacturer="PharmaCo",
            dosage_form="CAPSULE",
            strength="500mg",
            package_size=30,
            unit_price="5.00",
            dea_schedule=None,
        ),
        Drug(
            ndc="10002-0002-02",
            drug_name="Methadone",
            manufacturer="NarcoPharm",
            dosage_form="TABLET",
            strength="10mg",
            package_size=100,
            unit_price="25.00",
            dea_schedule="II",
        ),
        Drug(
            ndc="10003-0003-03",
            drug_name="Acetaminophen",
            manufacturer="PharmaCo",
            dosage_form="TABLET",
            strength="325mg",
            package_size=100,
            unit_price="3.50",
            dea_schedule=None,
        ),
        Drug(
            ndc="10004-0004-04",
            drug_name="Codeine Phosphate",
            manufacturer="BioPharm",
            dosage_form="SOLUTION",
            strength="30mg/5ml",
            package_size=50,
            unit_price="15.00",
            dea_schedule="III",
        ),
        Drug(
            ndc="10005-0005-05",
            drug_name="Lisinopril",
            manufacturer="PharmaCo",
            dosage_form="TABLET",
            strength="10mg",
            package_size=90,
            unit_price="8.75",
            dea_schedule=None,
        ),
    ]
    Drug.objects.bulk_create(records)
    return records
