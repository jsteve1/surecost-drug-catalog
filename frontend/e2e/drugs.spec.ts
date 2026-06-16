import { expect, test } from "@playwright/test";

test.describe("Drug catalog smoke", () => {
  test("list page loads", async ({ page }) => {
    await page.goto("/drugs");
    await expect(page.getByRole("heading", { name: "Drug Catalog" })).toBeVisible();
    await expect(page.getByText("Search and manage pharmacy inventory")).toBeVisible();
  });
});
