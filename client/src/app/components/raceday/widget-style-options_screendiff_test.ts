import { expect, type Page, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

/**
 * The new style options (phase 3a / 3b) on more widgets than Records:
 * text weight, letter spacing and case per part, background opacity and
 * shadow. Drawn on the Layout Editor canvas, which shows sample data.
 */

const STYLED = {
  FontWeight: "bold",
  LetterSpacing: 3,
  TextTransform: "uppercase",
};
const styled = (prefix: string) =>
  Object.fromEntries(
    Object.entries(STYLED).map(([k, v]) => [`${prefix}${k}`, v]),
  );

const WIDGETS = [
  {
    id: "widget-menu-bar",
    widgetType: "menu-bar",
    x: 0,
    y: 0,
    width: 1920,
    height: 54,
    zIndex: 100,
    scaleMode: "auto",
  },
  {
    id: "w-next-heat",
    widgetType: "next-heat",
    x: 80,
    y: 120,
    width: 420,
    height: 240,
    zIndex: 100,
    scaleMode: "auto",
    customSettings: { ...styled("title"), ...styled("lane") },
  },
  {
    id: "w-heat-list",
    widgetType: "heat-list",
    x: 520,
    y: 120,
    width: 500,
    height: 360,
    zIndex: 100,
    scaleMode: "auto",
    customSettings: { ...styled("title"), ...styled("heatNumber") },
  },
  {
    id: "w-timer",
    widgetType: "timer",
    x: 1040,
    y: 120,
    width: 380,
    height: 200,
    zIndex: 100,
    scaleMode: "auto",
    customSettings: {
      backgroundColor: "#0e7490",
      backgroundOpacity: 50,
      shadow: "soft",
    },
  },
  {
    id: "w-label",
    widgetType: "label",
    x: 1040,
    y: 440,
    width: 380,
    height: 140,
    zIndex: 100,
    scaleMode: "auto",
    customSettings: { text: "Pit lane", shadow: "raised" },
  },
  {
    id: "w-progress-gauge",
    widgetType: "progress-gauge",
    x: 80,
    y: 560,
    width: 320,
    height: 160,
    zIndex: 100,
    scaleMode: "auto",
    // phase 3c: the colour of the lane it follows (lane 1 in the sample data)
    customSettings: { laneColorBackground: true },
  },
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

test.describe("Widget style options on more widgets", () => {
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

  test("next heat: bold, spaced, uppercase title and lanes", async ({
    page,
  }) => {
    await openEditor(page);
    await shotOf(page, "next-heat", "style-next-heat-text.png");
  });

  test("heat list: bold, spaced, uppercase title and heat numbers", async ({
    page,
  }) => {
    await openEditor(page);
    await shotOf(page, "heat-list", "style-heat-list-text.png");
  });

  test("timer: see-through background and soft shadow", async ({ page }) => {
    await openEditor(page);
    await shotOf(page, "timer", "style-timer-frame-text.png");
  });

  test("label: raised shadow", async ({ page }) => {
    await openEditor(page);
    await shotOf(page, "label", "style-label-shadow.png");
  });

  test("progress gauge: lane-colour background", async ({ page }) => {
    await openEditor(page);
    await shotOf(page, "progress-gauge", "style-gauge-lane-colour.png");
  });
});
