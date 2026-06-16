import pytest


BASE = "/api/drugs/"


@pytest.mark.django_db
class TestDrugList:
    def test_list_returns_paginated_response(self, api_client, seeded_drugs):
        resp = api_client.get(BASE)
        assert resp.status_code == 200
        data = resp.json()
        assert "count" in data
        assert "results" in data
        assert data["count"] == 5

    def test_list_page_size_default_25(self, api_client, seeded_drugs):
        resp = api_client.get(BASE)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["results"]) <= 25


@pytest.mark.django_db
class TestDrugDetail:
    def test_detail_returns_correct_record(self, api_client, created_drug):
        drug_id = created_drug["id"]
        resp = api_client.get(f"{BASE}{drug_id}/")
        assert resp.status_code == 200
        assert resp.json()["ndc"] == created_drug["ndc"]

    def test_detail_unknown_id_returns_404(self, api_client):
        resp = api_client.get(f"{BASE}999999/")
        assert resp.status_code == 404
        data = resp.json()
        assert data["error"] == "not_found"
        assert "detail" in data
        assert "field_errors" in data


@pytest.mark.django_db
class TestDrugCreate:
    def test_create_returns_201_and_body(self, api_client, drug_data):
        resp = api_client.post(BASE, drug_data, format="json")
        assert resp.status_code == 201
        body = resp.json()
        assert body["ndc"] == drug_data["ndc"]
        assert "id" in body

    def test_duplicate_ndc_returns_200_not_duplicate(self, api_client, drug_data):
        from drugs.models import Drug

        resp1 = api_client.post(BASE, drug_data, format="json")
        assert resp1.status_code == 201

        resp2 = api_client.post(BASE, drug_data, format="json")
        assert resp2.status_code == 200
        assert Drug.objects.filter(ndc=drug_data["ndc"]).count() == 1

    def test_duplicate_ndc_never_500(self, api_client, drug_data):
        api_client.post(BASE, drug_data, format="json")
        resp = api_client.post(BASE, drug_data, format="json")
        assert resp.status_code != 500


@pytest.mark.django_db
class TestDrugUpdate:
    def test_put_updates_record(self, api_client, created_drug, drug_data):
        drug_id = created_drug["id"]
        updated = {**drug_data, "drug_name": "Updated Name"}
        resp = api_client.put(f"{BASE}{drug_id}/", updated, format="json")
        assert resp.status_code == 200
        assert resp.json()["drug_name"] == "Updated Name"

    def test_patch_updates_partial(self, api_client, created_drug):
        drug_id = created_drug["id"]
        resp = api_client.patch(f"{BASE}{drug_id}/", {"drug_name": "Patched"}, format="json")
        assert resp.status_code == 200
        assert resp.json()["drug_name"] == "Patched"


@pytest.mark.django_db
class TestDrugDelete:
    def test_delete_removes_record(self, api_client, created_drug):
        drug_id = created_drug["id"]
        resp = api_client.delete(f"{BASE}{drug_id}/")
        assert resp.status_code == 204
        resp2 = api_client.get(f"{BASE}{drug_id}/")
        assert resp2.status_code == 404
