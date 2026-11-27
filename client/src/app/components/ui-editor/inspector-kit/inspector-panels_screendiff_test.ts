import { expect, type Page, test } from "@playwright/test";
import { InspectorKitHarnessE2e } from "@app/components/ui-editor/inspector-kit/testing/inspector-kit.harness.e2e";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

/**
 * The redesigned Widget Configuration panel for the widget types that have
 * no inspector screendiff of their own, plus the Layout folder (lock and
 * layer order) and the dark panel theme.
 */

const W = (
  id: string,
  widgetType: string,
  x: number,
  y: number,
  width = 300,
  height = 160,
  customSettings: Record<string, any> = {},
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
  { ...W("widget-menu-bar", "menu-bar", 0, 0, 1920, 54) },
  W("w-countdown", "countdown", 760, 400, 400, 200),
  W("w-flag", "flag", 60, 100, 240, 160),
  W("w-heat-list", "heat-list", 340, 100, 360, 300),
  W("w-label", "label", 740, 100, 300, 120, { text: "Pit lane" }),
  W("w-progress-gauge", "progress-gauge", 1080, 100, 300, 160),
  W("w-qr", "qr", 1420, 100, 160, 160),
  W("w-branding", "branding", 60, 440, 400, 160),
  W("w-season-leaderboard", "season-leaderboard", 500, 440, 400, 300),
  W("w-season-race-leaderboard", "season-race-leaderboard", 940, 640, 400, 300),
];

async function openEditor(page: Page) {
  await TestSetupHelper.waitForLocalization(
    page,
    "en",
    page.goto("/layout-editor?edit=true"),
  );
  await page.locator(".layout-editor-content").waitFor({ state: "visible" });
}

/** Picks a widget from the editor's Select Widget list (works for any widget, also hidden ones). */
async function selectWidget(page: Page, id: string) {
  await page.locator("#help-raceday-widget-selector app-custom-select").click();
  await page.locator(`.custom-select-option[data-value='${id}']`).click();
}

test.describe("Widget Configuration panel: more widget types", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.setupThemeMocks(page);
    await TestSetupHelper.setupCustomUiMocks(page);
    await TestSetupHelper.setupSeasonMocks(page);
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

  for (const type of [
    "countdown",
    "flag",
    "heat-list",
    "label",
    "progress-gauge",
    "qr",
    "branding",
    "season-leaderboard",
    "season-race-leaderboard",
  ]) {
    test(`shows the ${type} panel`, async ({ page }) => {
      await openEditor(page);
      await selectWidget(page, `w-${type}`);
      const kit = new InspectorKitHarnessE2e(page);
      await kit.waitForForm();
      await kit.settle();
      await expect(kit.panel).toHaveScreenshot(`panel-${type}.png`, {
        animations: "disabled",
      });
    });
  }

  test("shows the Layout folder with lock and layer order", async ({
    page,
  }) => {
    await openEditor(page);
    await selectWidget(page, "w-label");
    const kit = new InspectorKitHarnessE2e(page);
    await kit.waitForForm();
    // close Content (open by default) so the Layout folder fits without
    // scrolling: a scrolled panel didn't land on the same spot every run
    await page.locator("#kit-folder-content").click();
    await kit.openFolder("layout");
    await kit.toggle("locked");
    await kit.settle();
    await expect(kit.panel).toHaveScreenshot("panel-layout-locked.png", {
      animations: "disabled",
    });
  });

  test("shows the Heat List table options", async ({ page }) => {
    await openEditor(page);
    await selectWidget(page, "w-heat-list");
    const kit = new InspectorKitHarnessE2e(page);
    await kit.waitForForm();
    await kit.panel
      .locator('[data-field="heatListLayout"]')
      .getByRole("radio", { name: "Table", exact: true })
      .click();
    await kit.panel.locator('[data-field="heatTableShowLaneColors"]').waitFor();
    await kit.settle();
    await expect(kit.panel).toHaveScreenshot("panel-heat-list-table.png", {
      animations: "disabled",
    });
  });

  test("shows the panel in the dark theme", async ({ page }) => {
    await openEditor(page);
    await selectWidget(page, "w-label");
    const kit = new InspectorKitHarnessE2e(page);
    await kit.waitForForm();
    await page.locator("#kit-theme-toggle").click();
    await kit.openFolder("text");
    await kit.settle();
    await expect(kit.panel).toHaveScreenshot("panel-dark-theme.png", {
      animations: "disabled",
    });
  });
});
