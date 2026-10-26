import { test } from "@playwright/test";

for (const theme of ["light", "dark"] as const) {
  for (const viewport of [
    { name: "mobile", width: 390, height: 844 },
    { name: "desktop", width: 1440, height: 1000 },
  ]) {
    test(`capture ${viewport.name} ${theme}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.addInitScript(
        (selected) => localStorage.setItem("theme", selected),
        theme,
      );
      await page.goto("/book/northstar-health");
      await page.getByText("General Consultation").waitFor();
      await page.screenshot({
        path: `../../docs/screenshots/booking-${viewport.name}-${theme}.png`,
        fullPage: true,
      });
    });
  }
}
