import { test } from "@playwright/test";
test("debug positions", async ({ page }) => {
  await page.goto("/driver-editor?id=d1");
  await page.locator(".page-container").waitFor();
  await page.locator(".loader-overlay").waitFor({ state: "hidden" });

  const panel = await page
    .locator(".editor-panel")
    .first()
    .evaluate((el) => window.getComputedStyle(el).paddingTop);
  console.log("Editor panel padding top:", panel);

  const rect = await page.locator("#driver-avatar-section").boundingBox();
  console.log("Avatar bounding box:", rect);
});
