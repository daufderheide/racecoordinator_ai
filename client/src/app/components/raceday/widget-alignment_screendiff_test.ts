import { expect, type Page, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

/**
 * Alignment per part (phase 3c): a title aligned right, the Timer's time
 * aligned left, and a whole name / info line aligned right. Drawn on the
 * Layout Editor canvas, which shows sample data.
 */

const W = (
  id: string,
  widgetType: string,
  x: number,
  y: number,
  width: number,
  height: number,
  customSettings: Record<string, any>,
) => ({
  id,
  widgetType,
  x,
  y,
  width,
  height,
  zIndex: 100,
  scaleMode: "auto",
  customSettings,
});

const WIDGETS = [
  W("widget-menu-bar", "menu-bar", 0, 0, 1920, 54, {}),
  W("w-next-heat", "next-heat", 80, 120, 520, 240, { titleAlignment: "right" }),
  W("w-timer", "timer", 700, 120, 560, 200, { timeAlignment: "left" }),
  W("w-race-name", "race-name", 300, 440, 1100, 56, {
    lineAlignment: "right",
  }),
];

async function openEditor(page: Page) {
  await TestSetupHelper.waitForLocalization(
    page,
    "en",
    page.goto("/layout-editor?edit=true"),
  );
  await page.locator(".layout-editor-content").waitFor({ state: "visible" });
  // hide the Widget Library, it floats over the left of the canvas
  await page.locator("#toggle-widget-library-btn").click();
  await page.locator(".layout-customizer-toolbox-wrapper").waitFor({
    state: "hidden",
  });
  await page.mouse.move(0, 0);
}

/** A widget on the canvas with a margin, so a shadow outside it shows too. */
async function shotOf(page: Page, type: string, name: string) {
  const wrapper = page
    .locator(".widget-wrapper")
    .filter({ has: page.locator(`app-raceday-${type}`) })
    .first();
  await wrapper.waitFor({ state: "visible" });
  const box = (await wrapper.boundingBox())!;
  await expect(page).toHaveScreenshot(name, {
    animations: "disabled",
    clip: {
      x: Math.max(0, box.x - 20),
      y: Math.max(0, box.y - 20),
      width: box.width + 40,
      height: box.height + 40,
    },
  });
}

test.describe("Alignment per part", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.setupThemeMocks(page);
    await TestSetupHelper.setupCustomUiMocks(page);
    await TestSetupHelper.setupSettings(page, {
      columnEditorMinimized: true,
      columnEditorPositionX: 9999,
      columnEditorPositionY: 9999,
      layoutEditorHelpShown: true,
      uiEditorHelpShown: true,
      racedayLayout: { widgets: WIDGETS },
    });
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
  });

  test("next heat: title aligned right", async ({ page }) => {
    await openEditor(page);
    await shotOf(page, "next-heat", "align-next-heat-title-right.png");
  });

  test("timer: time aligned left", async ({ page }) => {
    await openEditor(page);
    await shotOf(page, "timer", "align-timer-time-left.png");
  });

  test("race name: the whole line aligned right", async ({ page }) => {
    await openEditor(page);
    await shotOf(page, "race-name", "align-race-name-right.png");
  });
});
