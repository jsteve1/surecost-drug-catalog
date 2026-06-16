import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DrugTable } from "@/components/DrugTable";
import type { Drug } from "@/types/drug";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

const sampleDrug: Drug = {
  id: 1,
  ndc: "00002-1433-02",
  drug_name: "Prozac",
  manufacturer: "Lilly",
  dosage_form: "CAPSULE",
  strength: "20mg",
  package_size: 30,
  unit_price: "45.00",
  dea_schedule: null,
};

describe("DrugTable", () => {
  it("renders column headers", () => {
    render(<DrugTable drugs={[sampleDrug]} />);
    expect(screen.getByText("NDC")).toBeInTheDocument();
    expect(screen.getByText("Drug Name")).toBeInTheDocument();
    expect(screen.getByText("Manufacturer")).toBeInTheDocument();
    expect(screen.getByText("DEA")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
  });

  it("renders drug row data", () => {
    render(<DrugTable drugs={[sampleDrug]} />);
    expect(screen.getAllByText("Prozac")).toHaveLength(1);
    expect(screen.getByText("00002-1433-02")).toBeInTheDocument();
    expect(screen.getByText("Non-controlled")).toBeInTheDocument();
  });

  it("shows empty state when no drugs", () => {
    render(<DrugTable drugs={[]} />);
    expect(screen.getByText("No drugs found")).toBeInTheDocument();
  });
});
