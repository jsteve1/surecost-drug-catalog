import { describe, expect, it } from "vitest";

import { drugSchema } from "@/lib/validations/drug";

describe("drugSchema", () => {
  it("rejects invalid NDC format", () => {
    const result = drugSchema.safeParse({
      ndc: "invalid",
      drug_name: "Test",
      manufacturer: "Mfg",
      dosage_form: "TABLET",
      strength: "10mg",
      package_size: 1,
      unit_price: 1,
      dea_schedule: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid NDC format", () => {
    const result = drugSchema.safeParse({
      ndc: "00002-1433-02",
      drug_name: "Test",
      manufacturer: "Mfg",
      dosage_form: "TABLET",
      strength: "10mg",
      package_size: 1,
      unit_price: 1,
      dea_schedule: "",
    });
    expect(result.success).toBe(true);
  });
});
