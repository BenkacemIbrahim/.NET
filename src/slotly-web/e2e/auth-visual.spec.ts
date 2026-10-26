import { test } from "@playwright/test";

test("capture authentication artwork", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/login");
  await page.locator('img[src="/slotly-auth-illustration.png"]').waitFor();
  await page.screenshot({ path: "auth-visual-check.png", fullPage: true });
});
