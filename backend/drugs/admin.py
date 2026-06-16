from django.contrib import admin

from .models import AuditLog, Drug


@admin.register(Drug)
class DrugAdmin(admin.ModelAdmin):
    list_display = ("ndc", "drug_name", "manufacturer", "dosage_form", "dea_schedule")
    search_fields = ("ndc", "drug_name", "manufacturer")
    list_filter = ("dosage_form", "dea_schedule")


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("timestamp", "action", "drug_ndc", "drug_name", "actor")
    list_filter = ("action",)
    readonly_fields = (
        "drug",
        "drug_ndc",
        "drug_name",
        "action",
        "actor",
        "timestamp",
        "changes",
    )
