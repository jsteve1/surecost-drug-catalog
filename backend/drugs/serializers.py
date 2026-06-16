import re

from rest_framework import serializers

from .models import Drug

NDC_PATTERN = re.compile(r"^\d{5}-\d{4}-\d{2}$")


class DrugSerializer(serializers.ModelSerializer):
    class Meta:
        model = Drug
        fields = [
            "id",
            "ndc",
            "drug_name",
            "manufacturer",
            "dosage_form",
            "strength",
            "package_size",
            "unit_price",
            "dea_schedule",
        ]
        read_only_fields = ["id"]

    def validate_ndc(self, value: str) -> str:
        if not NDC_PATTERN.match(value):
            raise serializers.ValidationError(
                "NDC must match format #####-####-## (e.g. 00002-1433-02)."
            )
        return value

    def validate_package_size(self, value: int) -> int:
        if value < 1:
            raise serializers.ValidationError("Package size must be at least 1.")
        return value

    def validate_unit_price(self, value) -> object:
        if value < 0:
            raise serializers.ValidationError("Unit price must be non-negative.")
        return value
