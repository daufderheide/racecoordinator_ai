import { expect, type Locator, type Page, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";
import { InspectorKitHarnessE2e } from "@app/components/ui-editor/inspector-kit/testing/inspector-kit.harness.e2e";

/**
 * Layout Editor canvas tools: snapping guides and readout (4a), lock and
 * layer order (4b), selecting several, the selection box and the
 * several-widgets panel (4c), copy / paste style (5a) and duplicate (5c).
 */

const W = (
  id: string,
  widgetType: string,
  x: number,
  y: number,
  width: number,
  height: number,
  zIndex = 100,
  customSettings: Record<string, any> = {},
) => ({
  id,
  widgetType,
  x,
  y,
  width,
  height,
  zIndex,
  // like a widget dropped from the library (the Timer only fits its text in "auto")
  scaleMode: "auto",
  customSettings,
});

const WIDGETS = [
  W("widget-menu-bar", "menu-bar", 0, 0, 1920, 54),
  W("w-a", "label", 200, 200, 320, 130, 100, { backgroundColor: "#1d4ed8" }),
  W("w-d", "label", 380, 260, 320, 130, 101, { backgroundColor: "#b91c1c" }),
  W("w-b", "timer", 900, 200, 320, 170),
  W("w-c", "image", 1400, 200, 320, 220),
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
}

async function selectWidget(page: Page, id: string) {
  await page.locator("#help-raceday-widget-selector app-custom-select").click();
  await page.locator(`.custom-select-option[data-value='${id}']`).click();
  await new InspectorKitHarnessE2e(page).waitForForm();
}

/** The canvas wrapper of one widget, found through its Select Widget id. */
function wrapperOf(page: Page, type: string, nth = 0): Locator {
  return page
    .locator(
      ".raceday-absolute-layout-root-wrapper > app-raceday-absolute-widget .widget-wrapper",
    )
    .filter({ has: page.locator(`app-raceday-${type}`) })
    .nth(nth);
}

function canvas(page: Page): Locator {
  return page.locator(".raceday-absolute-layout-root-wrapper");
}

async function lockSelected(page: Page) {
  const kit = new InspectorKitHarnessE2e(page);
  await kit.openFolder("layout");
  await kit.toggle("locked");
  await kit.settle();
}

/** Draws a selection box on the empty canvas around these widget boxes. */
async function boxSelect(
  page: Page,
  boxes: { x: number; y: number; width: number; height: number }[],
  release = true,
) {
  const x1 = Math.min(...boxes.map((b) => b.x)) - 12;
  const y1 = Math.min(...boxes.map((b) => b.y)) - 12;
  const x2 = Math.max(...boxes.map((b) => b.x + b.width)) + 12;
  const y2 = Math.max(...boxes.map((b) => b.y + b.height)) + 12;
  await page.mouse.move(x2, y2);
  await page.mouse.down();
  await page.mouse.move((x1 + x2) / 2, (y1 + y2) / 2, { steps: 4 });
  await page.mouse.move(x1, y1, { steps: 4 });
  if (release) await page.mouse.up();
}

test.describe("Layout Editor canvas tools", () => {
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

  test("draws snap guides and the size readout while dragging", async ({
    page,
  }) => {
    await openEditor(page);
    await selectWidget(page, "w-b");
    const b = (await wrapperOf(page, "timer").boundingBox())!;
    const sx = b.x + 30;
    const sy = b.y + 40;
    await page.mouse.move(sx, sy);
    await page.mouse.down();
    // a short drag: the nearest edge or centre snaps, with its guide line,
    // and the readout shows the position and size
    await page.mouse.move(sx + 20, sy + 6, { steps: 4 });
    await expect(canvas(page)).toHaveScreenshot("tools-snap-guides.png", {
      animations: "disabled",
    });
    await page.mouse.up();
  });

  test("shows a locked widget with a lock and no resize handles", async ({
    page,
  }) => {
    await openEditor(page);
    await selectWidget(page, "w-b");
    await lockSelected(page);
    const b = (await wrapperOf(page, "timer").boundingBox())!;
    await expect(page).toHaveScreenshot("tools-locked-widget.png", {
      animations: "disabled",
      clip: {
        x: b.x - 20,
        y: b.y - 20,
        width: b.width + 40,
        height: b.height + 40,
      },
    });
  });

  test("brings a widget to the front with the layer buttons", async ({
    page,
  }) => {
    await openEditor(page);
    // w-a (blue) starts behind w-d (red)
    await selectWidget(page, "w-a");
    const kit = new InspectorKitHarnessE2e(page);
    await kit.openFolder("layout");
    await page.locator('[data-field="layer"] [data-button="front"]').click();
    await kit.settle();
    const a = (await wrapperOf(page, "label", 0).boundingBox())!;
    const d = (await wrapperOf(page, "label", 1).boundingBox())!;
    const x = Math.min(a.x, d.x) - 20;
    const y = Math.min(a.y, d.y) - 20;
    await expect(page).toHaveScreenshot("tools-layer-front.png", {
      animations: "disabled",
      clip: {
        x,
        y,
        width: Math.max(a.x + a.width, d.x + d.width) + 20 - x,
        height: Math.max(a.y + a.height, d.y + d.height) + 20 - y,
      },
    });
  });

  test("draws the selection box, then outlines and the several-widgets panel", async ({
    page,
  }) => {
    await openEditor(page);
    // lock the image first: the panel then says it stays where it is
    await selectWidget(page, "w-c");
    await lockSelected(page);
    const boxes = [
      (await wrapperOf(page, "timer").boundingBox())!,
      (await wrapperOf(page, "image").boundingBox())!,
    ];
    await boxSelect(page, boxes, false);
    await expect(canvas(page)).toHaveScreenshot("tools-selection-box.png", {
      animations: "disabled",
    });
    await page.mouse.up();
    await page.mouse.move(0, 0);
    await expect(canvas(page)).toHaveScreenshot("tools-multi-outlines.png", {
      animations: "disabled",
    });
    await expect(
      page.locator("app-inspector-multi .kit-panel"),
    ).toHaveScreenshot("tools-multi-panel.png", { animations: "disabled" });
  });

  test("aligns several widgets to the top", async ({ page }) => {
    await openEditor(page);
    // Shift-click the timer onto the selected red label
    await selectWidget(page, "w-d");
    const b = (await wrapperOf(page, "timer").boundingBox())!;
    await page.keyboard.down("Shift");
    await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2 + 20);
    await page.keyboard.up("Shift");
    await page.locator('app-inspector-multi [data-arrange="top"]').click();
    await page.mouse.move(0, 0);
    await expect(canvas(page)).toHaveScreenshot("tools-align-top.png", {
      animations: "disabled",
    });
  });

  test("copies a style: the paste button gets a dot", async ({ page }) => {
    await openEditor(page);
    await selectWidget(page, "w-a");
    await page.locator("#kit-copy-style").click();
    await new InspectorKitHarnessE2e(page).settle();
    await expect(
      page.locator("app-inspector-shell .kit-head"),
    ).toHaveScreenshot("tools-style-copied-head.png", {
      animations: "disabled",
    });
  });

  test("duplicates a widget with Ctrl+D", async ({ page }) => {
    await openEditor(page);
    await selectWidget(page, "w-b");
    // focus off the Select Widget list, so the key goes to the editor
    await new InspectorKitHarnessE2e(page).settle();
    await page.keyboard.press("Control+d");
    await page.mouse.move(0, 0);
    const b = (await wrapperOf(page, "timer", 0).boundingBox())!;
    await expect(page).toHaveScreenshot("tools-duplicate.png", {
      animations: "disabled",
      clip: {
        x: b.x - 20,
        y: b.y - 20,
        width: b.width + 60,
        height: b.height + 60,
      },
    });
  });
});
