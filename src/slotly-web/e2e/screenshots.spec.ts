import { test } from "@playwright/test";

async function signIn(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Workspace").fill("northstar-health");
  await page.getByLabel("Email address").fill("amira.benali@northstarhealth.ma");
  await page.getByLabel("Password").fill("Password123!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("heading", { name: /Good morning/i }).waitFor();
}

for (const theme of ["light", "dark"] as const) {
  for (const viewport of [
    { name: "mobile", width: 390, height: 844 },
    { name: "desktop", width: 1440, height: 1000 },
  ]) {
    test(`capture public booking ${viewport.name} ${theme}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.addInitScript(
        (selected) => localStorage.setItem("theme", selected),
        theme,
      );
      await page.goto("/book/northstar-health");
      await page.getByText("General Medical Consultation").waitFor();
      await page.screenshot({
        path: `../../docs/screenshots/booking-${viewport.name}-${theme}.png`,
        fullPage: true,
      });
    });

    test(`capture login page ${viewport.name} ${theme}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.addInitScript(
        (selected) => localStorage.setItem("theme", selected),
        theme,
      );
      await page.goto("/login");
      await page.getByLabel("Workspace").waitFor();
      await page.screenshot({
        path: `../../docs/screenshots/login-${viewport.name}-${theme}.png`,
        fullPage: true,
      });
    });

    test(`capture admin dashboard ${viewport.name} ${theme}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.addInitScript(
        (selected) => localStorage.setItem("theme", selected),
        theme,
      );
      await signIn(page);
      await page.screenshot({
        path: `../../docs/screenshots/admin-${viewport.name}-${theme}.png`,
        fullPage: true,
      });
    });
  }
}

for (const viewport of [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 1000 },
]) {
  for (const screen of [
    { name: "calendar", path: "/admin/calendar", heading: "Calendar" },
    { name: "bookings", path: "/admin/bookings", heading: "Bookings" },
    { name: "services", path: "/admin/services", heading: "Services" },
    { name: "staff", path: "/admin/staff", heading: "Team" },
    { name: "availability", path: "/admin/schedule", heading: "Availability" },
    { name: "settings", path: "/admin/settings", heading: "Settings" },
  ]) {
    test(`capture ${screen.name} ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await signIn(page);
      await page.goto(screen.path);
      await page.getByRole("heading", { name: screen.heading, exact: true }).waitFor();
      await page.screenshot({
        path: `../../docs/screenshots/${screen.name}-${viewport.name}.png`,
        fullPage: true,
      });
    });
  }

  test(`capture booking time picker ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/book/northstar-health");
    await page.getByRole("button", { name: /General Medical Consultation/i }).click();
    await page.getByRole("heading", { name: "Select an available time" }).waitFor();
    await page.screenshot({
      path: `../../docs/screenshots/booking-time-${viewport.name}.png`,
      fullPage: true,
    });
  });
}

for (const viewport of [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 1000 },
]) {
  test(`capture landing page ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page.getByRole("heading", { name: /Make time for the work/i }).waitFor();
    await page.screenshot({
      path: `../../docs/screenshots/landing-${viewport.name}.png`,
      fullPage: true,
    });
  });
}
