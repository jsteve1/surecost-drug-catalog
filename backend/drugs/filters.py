import django_filters

from .models import Drug


class _DeaScheduleFilter(django_filters.CharFilter):
    """Filter ?dea_schedule= (empty) to mean 'null' (non-controlled drugs).

    The challenge: Django's CharField.clean() maps both absent params and
    explicit empty-string params to '' (empty_value), so the cleaned value
    alone cannot distinguish "not in request" vs "explicitly empty". We
    check self.parent.data (the raw QueryDict) to make that distinction.

    django_filters also sets self.filter = FilterMethod(...) as an instance
    attr when method= is used, which shadows any subclass override. By NOT
    using method= we keep the class-level filter() callable.
    """

    def filter(self, qs, value):
        # Check raw request data to distinguish absent vs explicit empty.
        if self.parent is not None and self.field_name not in self.parent.data:
            return qs  # param absent — no filter
        if value == "" or value is None:
            return qs.filter(dea_schedule__isnull=True)
        return qs.filter(dea_schedule=value)


class DrugFilterSet(django_filters.FilterSet):
    search = django_filters.CharFilter(method="filter_search")
    manufacturer = django_filters.CharFilter(lookup_expr="icontains")
    dosage_form = django_filters.CharFilter(lookup_expr="iexact")
    dea_schedule = _DeaScheduleFilter()
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

