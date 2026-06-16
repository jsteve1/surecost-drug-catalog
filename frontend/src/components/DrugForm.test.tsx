import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DrugForm } from "@/components/DrugForm";

describe("DrugForm", () => {
  it("shows NDC validation error for invalid format", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<DrugForm submitLabel="Create" onSubmit={onSubmit} />);

    await user.type(screen.getByRole("textbox", { name: /^NDC$/i }), "INVALID");
    await user.type(screen.getByRole("textbox", { name: /Drug name/i }), "Test Drug");
    await user.type(screen.getByRole("textbox", { name: /Manufacturer/i }), "Acme");
    await user.type(screen.getByRole("textbox", { name: /Strength/i }), "10mg");
    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(
        screen.getByText("NDC must match format #####-####-##"),
      ).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("accepts valid NDC format", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<DrugForm submitLabel="Create" onSubmit={onSubmit} />);

    await user.type(screen.getByRole("textbox", { name: /^NDC$/i }), "12345-6789-01");
    await user.type(screen.getByRole("textbox", { name: /Drug name/i }), "Test Drug");
    await user.type(screen.getByRole("textbox", { name: /Manufacturer/i }), "Acme");
    await user.type(screen.getByRole("textbox", { name: /Strength/i }), "10mg");
    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
  });
});
