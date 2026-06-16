import pytest


BASE = "/api/drugs/"


@pytest.mark.django_db
class TestSearch:
    def test_search_filters_by_drug_name_case_insensitive(self, api_client, seeded_drugs):
        resp = api_client.get(BASE, {"search": "amox"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["count"] == 1
        assert data["results"][0]["drug_name"] == "Amoxicillin"

    def test_search_uppercase_still_matches(self, api_client, seeded_drugs):
        resp = api_client.get(BASE, {"search": "ACETA"})
        assert resp.status_code == 200
        assert resp.json()["count"] == 1

    def test_search_no_match_returns_empty(self, api_client, seeded_drugs):
        resp = api_client.get(BASE, {"search": "zzznomatch"})
        assert resp.status_code == 200
        assert resp.json()["count"] == 0


@pytest.mark.django_db
class TestManufacturerFilter:
    def test_manufacturer_exact_match(self, api_client, seeded_drugs):
        resp = api_client.get(BASE, {"manufacturer": "PharmaCo"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["count"] == 3
        manufacturers = {r["manufacturer"] for r in data["results"]}
        assert manufacturers == {"PharmaCo"}

    def test_manufacturer_case_insensitive(self, api_client, seeded_drugs):
        resp = api_client.get(BASE, {"manufacturer": "pharmaco"})
        assert resp.status_code == 200
        assert resp.json()["count"] == 3


@pytest.mark.django_db
class TestDosageFormFilter:
    def test_dosage_form_filter(self, api_client, seeded_drugs):
        resp = api_client.get(BASE, {"dosage_form": "TABLET"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["count"] == 3
        forms = {r["dosage_form"] for r in data["results"]}
        assert forms == {"TABLET"}

    def test_dosage_form_case_insensitive(self, api_client, seeded_drugs):
        resp = api_client.get(BASE, {"dosage_form": "tablet"})
        assert resp.status_code == 200
        assert resp.json()["count"] == 3


@pytest.mark.django_db
class TestDeaScheduleFilter:
    def test_dea_schedule_II_returns_controlled(self, api_client, seeded_drugs):
        resp = api_client.get(BASE, {"dea_schedule": "II"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["count"] == 1
        assert data["results"][0]["dea_schedule"] == "II"

    def test_dea_schedule_III_returns_correct(self, api_client, seeded_drugs):
        resp = api_client.get(BASE, {"dea_schedule": "III"})
        assert resp.status_code == 200
        assert resp.json()["count"] == 1

    def test_empty_dea_schedule_filters_non_controlled(self, api_client, seeded_drugs):
        resp = api_client.get(BASE + "?dea_schedule=")
        assert resp.status_code == 200
        data = resp.json()
        assert data["count"] == 3
        for r in data["results"]:
            assert r["dea_schedule"] is None


@pytest.mark.django_db
class TestPriceFilter:
    def test_min_price_lower_bound(self, api_client, seeded_drugs):
        resp = api_client.get(BASE, {"min_price": "10.00"})
        assert resp.status_code == 200
        data = resp.json()
        for r in data["results"]:
            assert float(r["unit_price"]) >= 10.00

    def test_max_price_upper_bound(self, api_client, seeded_drugs):
        resp = api_client.get(BASE, {"max_price": "8.00"})
        assert resp.status_code == 200
        data = resp.json()
        for r in data["results"]:
            assert float(r["unit_price"]) <= 8.00

    def test_price_range_combined(self, api_client, seeded_drugs):
        resp = api_client.get(BASE, {"min_price": "5.00", "max_price": "10.00"})
        assert resp.status_code == 200
        data = resp.json()
        for r in data["results"]:
            assert 5.00 <= float(r["unit_price"]) <= 10.00


@pytest.mark.django_db
class TestPagination:
    def test_response_has_pagination_shape(self, api_client, seeded_drugs):
        resp = api_client.get(BASE)
        assert resp.status_code == 200
        data = resp.json()
        assert "count" in data
        assert "results" in data
        assert "next" in data
        assert "previous" in data

    def test_page_1_returns_up_to_25_results(self, api_client, seeded_drugs):
        resp = api_client.get(BASE)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["results"]) <= 25

    def test_pagination_page_param_works(self, api_client):
        from drugs.models import Drug

        Drug.objects.bulk_create(
            [
                Drug(
                    ndc=f"9{i:04d}-0000-00",
                    drug_name=f"Drug {i}",
                    manufacturer="TestCo",
                    dosage_form="TABLET",
                    strength="10mg",
                    package_size=30,
                    unit_price="1.00",
                )
                for i in range(1, 30)
            ]
        )
        resp_p1 = api_client.get(BASE, {"page": 1})
        assert resp_p1.status_code == 200
        data_p1 = resp_p1.json()
        assert data_p1["count"] == 29
        assert len(data_p1["results"]) == 25
        assert data_p1["next"] is not None

        resp_p2 = api_client.get(BASE, {"page": 2})
        assert resp_p2.status_code == 200
        data_p2 = resp_p2.json()
        assert len(data_p2["results"]) == 4
        assert data_p2["next"] is None
