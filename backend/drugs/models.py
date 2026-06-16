from django.core.validators import MinValueValidator, RegexValidator
from django.db import models


NDC_VALIDATOR = RegexValidator(
    regex=r"^\d{5}-\d{4}-\d{2}$",
    message="NDC must match format #####-####-## (e.g. 00002-1433-02).",
)


class Drug(models.Model):
    class DeaSchedule(models.TextChoices):
        II = "II", "Schedule II"
        III = "III", "Schedule III"
        IV = "IV", "Schedule IV"
        V = "V", "Schedule V"

    ndc = models.CharField(
        max_length=13,
        unique=True,
        db_index=True,
        validators=[NDC_VALIDATOR],
    )
    drug_name = models.CharField(max_length=255)
    manufacturer = models.CharField(max_length=255)
    dosage_form = models.CharField(max_length=50)
    strength = models.CharField(max_length=100)
    package_size = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    unit_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)],
    )
    dea_schedule = models.CharField(
        max_length=3,
        choices=DeaSchedule.choices,
        null=True,
        blank=True,
    )

    class Meta:
        ordering = ["drug_name"]

    def __str__(self) -> str:
        return f"{self.ndc} — {self.drug_name}"
