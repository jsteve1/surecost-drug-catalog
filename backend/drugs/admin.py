from django.contrib import admin

from .models import Drug


@admin.register(Drug)
class DrugAdmin(admin.ModelAdmin):
    list_display = ("ndc", "drug_name", "manufacturer", "dosage_form", "dea_schedule")
    search_fields = ("ndc", "drug_name", "manufacturer")
    list_filter = ("dosage_form", "dea_schedule")
