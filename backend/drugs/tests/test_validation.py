import pytest


BASE = "/api/drugs/"


def _base_drug(**kwargs):
    return {
        "ndc": "12345-6789-01",
        "drug_name": "Valid Drug",
        "manufacturer": "TestCo",
        "dosage_form": "TABLET",
        "strength": "100mg",
        "package_size": 30,
        "unit_price": "9.99",
        "dea_schedule": None,
        **kwargs,
    }


@pytest.mark.django_db
class TestNdcValidation:
    def test_invalid_ndc_format_returns_400_with_field_error(self, api_client):
        resp = api_client.post(BASE, _base_drug(ndc="bad-ndc"), format="json")
        assert resp.status_code == 400
        data = resp.json()
        assert data["error"] == "validation_error"
        assert "ndc" in data["field_errors"]

    def test_ndc_too_short_returns_400(self, api_client):
        resp = api_client.post(BASE, _base_drug(ndc="1234-567-0"), format="json")
        assert resp.status_code == 400
        assert "ndc" in resp.json()["field_errors"]

    def test_ndc_missing_returns_400(self, api_client):
        payload = _base_drug()
        payload.pop("ndc")
        resp = api_client.post(BASE, payload, format="json")
        assert resp.status_code == 400
        assert "ndc" in resp.json()["field_errors"]


@pytest.mark.django_db
class TestNumericValidation:
    def test_package_size_zero_returns_400(self, api_client):
        resp = api_client.post(BASE, _base_drug(package_size=0), format="json")
        assert resp.status_code == 400
        assert "package_size" in resp.json()["field_errors"]

    def test_package_size_negative_returns_400(self, api_client):
        resp = api_client.post(BASE, _base_drug(package_size=-5), format="json")
        assert resp.status_code == 400
        assert "package_size" in resp.json()["field_errors"]

    def test_negative_unit_price_returns_400(self, api_client):
        resp = api_client.post(BASE, _base_drug(unit_price="-1.00"), format="json")
        assert resp.status_code == 400
        assert "unit_price" in resp.json()["field_errors"]

    def test_zero_unit_price_is_valid(self, api_client):
        resp = api_client.post(BASE, _base_drug(unit_price="0.00"), format="json")
        assert resp.status_code == 201


@pytest.mark.django_db
class TestRequiredFields:
    def test_missing_drug_name_returns_400(self, api_client):
        payload = _base_drug()
        payload.pop("drug_name")
        resp = api_client.post(BASE, payload, format="json")
        assert resp.status_code == 400
        assert "drug_name" in resp.json()["field_errors"]

    def test_missing_manufacturer_returns_400(self, api_client):
        payload = _base_drug()
        payload.pop("manufacturer")
        resp = api_client.post(BASE, payload, format="json")
        assert resp.status_code == 400
        assert "manufacturer" in resp.json()["field_errors"]

    def test_missing_dosage_form_returns_400(self, api_client):
        payload = _base_drug()
        payload.pop("dosage_form")
        resp = api_client.post(BASE, payload, format="json")
        assert resp.status_code == 400
        assert "dosage_form" in resp.json()["field_errors"]


@pytest.mark.django_db
class TestErrorEnvelope:
    def test_404_response_has_error_envelope(self, api_client):
        resp = api_client.get(f"{BASE}999999/")
        assert resp.status_code == 404
        data = resp.json()
        assert set(data.keys()) >= {"error", "detail", "field_errors"}
        assert data["error"] == "not_found"

    def test_400_response_has_error_envelope(self, api_client):
        resp = api_client.post(BASE, _base_drug(ndc="bad"), format="json")
        assert resp.status_code == 400
        data = resp.json()
        assert set(data.keys()) >= {"error", "detail", "field_errors"}

    def test_malformed_json_returns_400_not_500(self, api_client):
        resp = api_client.post(
            BASE,
            data="not-json{{{",
            content_type="application/json",
        )
        assert resp.status_code == 400
        assert resp.status_code != 500
