import { test } from "@playwright/test";

async function clearAuth(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

async function signIn(page: import("@playwright/test").Page) {
  await clearAuth(page);
  await page.goto("/login");
  await page.locator("#tenantSlug").fill("northstar-health");
  await page.locator("#email").fill("amira.benali@northstarhealth.ma");
  await page.locator("#password").fill("Password123!");
  await page.getByRole("button", { name: /Sign in/i }).click();
  await page.waitForURL("**/admin**");
  await page.getByRole("heading", { name: "Scheduling" }).waitFor();
}

const DESKTOP_VIEWPORT = { width: 1440, height: 1000 };

for (const theme of ["light", "dark"] as const) {
  test(`capture public booking ${theme}`, async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await clearAuth(page);
    await page.addInitScript(
      (selected) => localStorage.setItem("theme", selected),
      theme,
    );
    await page.goto("/book/northstar-health");
    await page.getByText("General Medical Consultation").waitFor();
    await page.screenshot({
      path: `../../docs/screenshots/booking-desktop-${theme}.png`,
      fullPage: true,
    });
  });

  test(`capture login page ${theme}`, async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await clearAuth(page);
    await page.addInitScript(
      (selected) => localStorage.setItem("theme", selected),
      theme,
    );
    await page.goto("/login");
    await page.locator("#tenantSlug").waitFor();
    await page.screenshot({
      path: `../../docs/screenshots/login-desktop-${theme}.png`,
      fullPage: true,
    });
  });

  test(`capture admin dashboard ${theme}`, async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.addInitScript(
      (selected) => localStorage.setItem("theme", selected),
      theme,
    );
    await signIn(page);
    await page.screenshot({
      path: `../../docs/screenshots/admin-desktop-${theme}.png`,
      fullPage: true,
    });
  });
}

for (const screen of [
  { name: "calendar", path: "/admin/calendar", selector: "h1:has-text('Calendar')" },
  { name: "bookings", path: "/admin/bookings", selector: "h1:has-text('Notetaker')" },
  { name: "services", path: "/admin/services", selector: "h1:has-text('Event Types')" },
  { name: "staff", path: "/admin/staff", selector: "h1:has-text('Contacts & Team')" },
  { name: "availability", path: "/admin/schedule", selector: "h1:has-text('Availability')" },
  { name: "settings", path: "/admin/settings", selector: "h2:has-text('Settings')" },
]) {
  test(`capture ${screen.name}`, async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await signIn(page);
    await page.goto(screen.path);
    await page.locator(screen.selector).first().waitFor();
    await page.screenshot({
      path: `../../docs/screenshots/${screen.name}-desktop.png`,
      fullPage: true,
    });
  });
}

test("capture booking time picker", async ({ page }) => {
  await page.setViewportSize(DESKTOP_VIEWPORT);
  await clearAuth(page);
  await page.goto("/book/northstar-health");
  await page.getByRole("button", { name: /General Medical Consultation/i }).click();
  await page.getByRole("heading", { name: /Select a Date & Time|Select/i }).waitFor();
  await page.screenshot({
    path: `../../docs/screenshots/booking-time-desktop.png`,
    fullPage: true,
  });
});

test("capture landing page", async ({ page }) => {
  await page.setViewportSize(DESKTOP_VIEWPORT);
  await clearAuth(page);
  await page.goto("/");
  await page.getByRole("heading", { level: 1 }).first().waitFor();
  await page.screenshot({
    path: `../../docs/screenshots/landing-desktop.png`,
    fullPage: true,
  });
});

test("capture ai chat widget desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await clearAuth(page);
  await page.goto("/");
  const chatTrigger = page.locator('img[alt="Slotly AI Assistant"]');
  await chatTrigger.waitFor();
  await chatTrigger.click();
  const chatDialog = page.locator('aside[aria-label="Slotly AI Assistant Chat"]');
  await chatDialog.getByRole("heading", { name: "Slotly AI" }).waitFor();
  // Wait for typing indicator to finish and welcome message to land
  await chatDialog.getByText("Hello!").waitFor();
  // Slight delay to ensure full message animation settlement
  await page.waitForTimeout(500);
  await page.screenshot({
    path: `../../docs/screenshots/ai-chat-desktop.png`,
    fullPage: false,
  });
});

test("capture admin ai chat desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await signIn(page);
  // Trigger Callie AI in admin
  const askCallie = page.getByRole("button", { name: /Ask Callie/i });
  if (await askCallie.isVisible()) {
    await askCallie.click();
  } else {
    const trigger = page.locator('img[alt="Slotly AI Assistant"]');
    await trigger.click();
  }
  const chatDialog = page.locator('aside[aria-label="Slotly AI Assistant Chat"]');
  await chatDialog.getByRole("heading", { name: "Slotly AI" }).waitFor();
  await chatDialog.getByText("Hello!").waitFor();
  await page.waitForTimeout(500);
  await page.screenshot({
    path: `../../docs/screenshots/admin-ai-chat-desktop.png`,
    fullPage: false,
  });
});
