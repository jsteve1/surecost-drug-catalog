import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DeaScheduleBadge } from "@/components/DeaScheduleBadge";

describe("DeaScheduleBadge", () => {
  it("renders non-controlled label", () => {
    render(<DeaScheduleBadge schedule={null} />);
    expect(screen.getByText("Non-controlled")).toBeInTheDocument();
  });

  it("renders C-II with red styling", () => {
    render(<DeaScheduleBadge schedule="II" />);
    const badge = screen.getByText("C-II");
    expect(badge).toBeInTheDocument();
    expect(badge.className).toMatch(/red/);
  });

  it("renders C-IV label", () => {
    render(<DeaScheduleBadge schedule="IV" />);
    expect(screen.getByText("C-IV")).toBeInTheDocument();
  });

  it("does not wrap badge text", () => {
    render(<DeaScheduleBadge schedule="III" />);
    expect(screen.getByText("C-III").className).toMatch(/whitespace-nowrap/);
  });
});
