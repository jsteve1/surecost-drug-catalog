import django_filters

from .models import Drug


class DrugFilterSet(django_filters.FilterSet):
    search = django_filters.CharFilter(method="filter_search")
    manufacturer = django_filters.CharFilter(lookup_expr="iexact")
    dosage_form = django_filters.CharFilter(lookup_expr="iexact")
    dea_schedule = django_filters.CharFilter(method="filter_dea_schedule")
    min_price = django_filters.NumberFilter(field_name="unit_price", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="unit_price", lookup_expr="lte")

    class Meta:
        model = Drug
        fields = [
            "search",
            "manufacturer",
            "dosage_form",
            "dea_schedule",
            "min_price",
            "max_price",
        ]

    def filter_search(self, queryset, name, value):
        if not value:
            return queryset
        return queryset.filter(drug_name__icontains=value)

    def filter_dea_schedule(self, queryset, name, value):
        if value == "":
            return queryset.filter(dea_schedule__isnull=True)
        return queryset.filter(dea_schedule=value)
