import { expect, test } from "@playwright/test";

function nextWeekday() {
  const value = new Date(Date.now() + 86_400_000);
  while (value.getDay() === 0 || value.getDay() === 6)
    value.setDate(value.getDate() + 1);
  return value.toISOString().slice(0, 10);
}

test("customer books an available appointment", async ({ page }) => {
  await page.goto("/book/northstar-health");
  await page.getByRole("button", { name: /General Medical Consultation/i }).click();
  await page.getByRole("button", { name: `Choose ${nextWeekday()}` }).click();
  const slots = page.getByRole("button", { name: /Select time/i });
  await expect(slots.first()).toBeVisible();
  await slots.first().click();
  await page.getByLabel("Full name").fill("Playwright Customer");
  await page
    .getByLabel("Email address")
    .fill(`playwright-${Date.now()}@example.com`);
  await page.getByLabel("Phone number").fill("+212600000001");
  await page.getByRole("button", { name: "Confirm appointment" }).click();
  await expect(
    page.getByRole("heading", { name: "You're all set." }),
  ).toBeVisible();
});

test("tenant owner signs in and opens booking management", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Workspace").fill("northstar-health");
  await page.getByLabel("Email address").fill("amira.benali@northstarhealth.ma");
  await page.getByLabel("Password").fill("Password123!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(
    page.getByRole("heading", { name: "Good morning" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Bookings" }).click();
  await expect(page.getByRole("heading", { name: "Bookings" })).toBeVisible();
});
