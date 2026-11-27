import { expect, test } from "@playwright/test";
import type { CustomUI } from "@app/models/custom-ui";
import type { LayoutConfig } from "@app/models/settings";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Layout Editor Visuals", () => {
  test.use({ viewport: { width: 1600, height: 900 } });

  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.setupThemeMocks(page);
    await TestSetupHelper.setupCustomUiMocks(page);

    await TestSetupHelper.setupSettings(page, {
      layoutEditorHelpShown: true,
      uiEditorHelpShown: true,
    });

    await page.addInitScript(() => {
      localStorage.removeItem("layout_editor_zoom");
    });

    await TestSetupHelper.setupFileSystemMock(page, {});
    await TestSetupHelper.disableAnimations(page);
  });

  for (const kind of [
    {
      purpose: "heat-results",
      label: "Heat Results",
      table: "heat-standings-widget",
    },
    {
      purpose: "race-results",
      label: "Race Results",
      table: "race-standings-widget",
    },
    {
      purpose: "driver-results",
      label: "Driver Results",
      table: "",
    },
  ]) {
    test(
      "should create and reopen a saved " +
        kind.label +
        " layout in the editor",
      async ({ page }) => {
        const savedId = "club-" + kind.purpose;
        let saved: CustomUI | undefined;
        await page.route("**/api/custom-ui", async (route) => {
          if (route.request().method() === "POST") {
            saved = { ...route.request().postDataJSON(), entity_id: savedId };
            await route.fulfill({ json: saved });
          } else if (saved) {
            await route.fulfill({ json: [saved] });
          } else {
            await route.fallback();
          }
        });
        await page.route("**/api/custom-ui/" + savedId, async (route) => {
          if (route.request().method() === "PUT")
            saved = route.request().postDataJSON();
          await route.fulfill({ json: saved });
        });
        await TestSetupHelper.waitForLocalization(
          page,
          "en",
          page.goto("/layout-editor"),
        );
        await page.locator("#add-item-btn").click();
        await page
          .locator(
            '.template-option-btn[data-template-id="' +
              kind.purpose +
              '-template"]',
          )
          .click();

        const standings = page.locator(
          ".raceday-preview-container ." +
            (kind.table || "driver-results-preview"),
        );
        const standingsHeader = standings.getByRole("columnheader").last();
        const driverStats = standings.getByRole("heading", {
          name: "Driver Statistics",
        });
        if (kind.purpose === "driver-results") {
          await driverStats.click();
          const resize = page.locator(
            ".widget-wrapper.selected .resize-handle.e",
          );
          await resize.scrollIntoViewIfNeeded();
          const edge = await resize.boundingBox();
          if (!edge)
            throw new Error("Driver Statistics resize handle is unavailable");
          await page.mouse.move(
            edge.x + edge.width / 2,
            edge.y + edge.height / 2,
          );
          await page.mouse.down();
          await page.mouse.move(edge.x - 75, edge.y + edge.height / 2, {
            steps: 5,
          });
          await page.mouse.up();
        } else {
          await standingsHeader.click();
          await page
            .locator(
              'app-inspector-shell [data-field="showAverageLap"] [role="switch"]',
            )
            .click();
        }
        const saveRequest = page.waitForResponse(
          (response) =>
            response.url().endsWith("/api/custom-ui/" + savedId) &&
            response.request().method() === "PUT" &&
            response.ok(),
        );
        await page.locator("#edit-track-btn").click();
        const savedResponse = await saveRequest;
        if (kind.purpose === "driver-results") {
          const posted = savedResponse.request().postDataJSON() as CustomUI;
          const layout = JSON.parse(posted.layoutJson || "{}") as LayoutConfig;
          const stats = layout.widgets?.find(({ id }) => id === "driver-stats");
          if (!stats || stats.width >= 1140) {
            throw new Error(
              "The resized Driver Statistics width was not saved",
            );
          }
        }
        await TestSetupHelper.waitForLocalization(
          page,
          "en",
          page.goto("/layout-editor?id=" + savedId + "&edit=true"),
        );
        if (kind.purpose === "driver-results") {
          await driverStats.click();
        } else {
          await standingsHeader.click();
          await page
            .locator(
              'app-inspector-shell [data-field="showAverageLap"] [aria-checked="false"]',
            )
            .waitFor();
        }

        if (kind.purpose === "heat-results") {
          await page
            .locator(
              'app-inspector-shell [data-field="useLaneColors"] [aria-checked="true"]',
            )
            .waitFor();
        }
        await page.mouse.move(0, 0);
        await expect(page).toHaveScreenshot(
          "layout-editor-" + kind.purpose + ".png",
        );
      },
    );
  }

  test("should display default race layout in view mode", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/layout-editor"),
    );
    const container = page.locator(".layout-editor-content");
    await container.waitFor({ state: "visible" });

    const preview = page.locator(".raceday-preview-container");
    await preview.waitFor({ state: "visible" });

    await TestSetupHelper.waitForImagesLoaded(container);
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.evaluate(() => new Promise(requestAnimationFrame));
    await page.mouse.move(0, 0);

    await expect(page).toHaveScreenshot("layout-editor-default-view.png", {
      maxDiffPixelRatio: 0.05,
      maxDiffPixels: 15000,
      animations: "disabled",
    });
  });

  test("should display layout editor in edit mode with toolbox", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/layout-editor"),
    );
    const container = page.locator(".layout-editor-content");
    await container.waitFor({ state: "visible" });

    const editBtn = page.locator("#edit-track-btn");
    await editBtn.waitFor({ state: "visible" });
    await editBtn.click();

    const toolbox = page.locator(".layout-customizer-toolbox");
    await toolbox.waitFor({ state: "visible" });

    await TestSetupHelper.waitForImagesLoaded(container);
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.evaluate(() => new Promise(requestAnimationFrame));
    await page.mouse.move(0, 0);

    await expect(page).toHaveScreenshot("layout-editor-edit-mode.png", {
      maxDiffPixelRatio: 0.05,
      maxDiffPixels: 15000,
      animations: "disabled",
    });
  });

  test("should display practice layout in view mode", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/layout-editor?id=practice_ui_layout_rc_ai"),
    );
    const container = page.locator(".layout-editor-content");
    await container.waitFor({ state: "visible" });

    const preview = page.locator(".raceday-preview-container");
    await preview.waitFor({ state: "visible" });

    await TestSetupHelper.waitForImagesLoaded(container);
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.evaluate(() => new Promise(requestAnimationFrame));
    await page.mouse.move(0, 0);

    await expect(page).toHaveScreenshot("layout-editor-practice-layout.png", {
      maxDiffPixelRatio: 0.05,
      maxDiffPixels: 15000,
      animations: "disabled",
    });
  });

  test("should display driver station layout in view mode", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/layout-editor?id=driver_station_ui_layout_rc_ai"),
    );
    const container = page.locator(".layout-editor-content");
    await container.waitFor({ state: "visible" });

    const preview = page.locator(".raceday-preview-container");
    await preview.waitFor({ state: "visible" });

    await TestSetupHelper.waitForImagesLoaded(container);
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.evaluate(() => new Promise(requestAnimationFrame));
    await page.mouse.move(0, 0);

    await expect(page).toHaveScreenshot(
      "layout-editor-driver-station-layout.png",
      {
        maxDiffPixelRatio: 0.05,
        maxDiffPixels: 15000,
        animations: "disabled",
      },
    );
  });

  test("should display widget inspector when widget is selected in edit mode", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/layout-editor"),
    );
    const container = page.locator(".layout-editor-content");
    await container.waitFor({ state: "visible" });

    const editBtn = page.locator("#edit-track-btn");
    await editBtn.waitFor({ state: "visible" });
    await editBtn.click();

    const widget = page
      .locator(".raceday-preview-container .widget-wrapper")
      .first();
    await widget.waitFor({ state: "visible" });
    await widget.dispatchEvent("pointerdown");

    const inspector = page.locator(".widget-inspector-panel");
    await inspector.waitFor({ state: "visible" });

    await TestSetupHelper.waitForImagesLoaded(container);
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.evaluate(() => new Promise(requestAnimationFrame));
    await page.mouse.move(0, 0);

    await expect(page).toHaveScreenshot("layout-editor-widget-inspector.png", {
      maxDiffPixelRatio: 0.05,
      maxDiffPixels: 15000,
      animations: "disabled",
    });
  });

  test("should display Record options for a bound Label", async ({ page }) => {
    const layout = {
      entity_id: "record-label-layout",
      name: "Record Label Preview",
      is_default: false,
      layoutJson: JSON.stringify({
        baseWidth: 1600,
        baseHeight: 900,
        widgets: [
          {
            id: "record-value",
            widgetType: "label",
            x: 180,
            y: 180,
            width: 200,
            height: 60,
            customSettings: {
              recordField: "heatBestTime",
              recordDecimals: 2,
              emptyValueMode: "text",
              emptyValueText: "Awaiting lap",
            },
          },
        ],
      }),
    };
    await TestSetupHelper.setupCustomUiMocks(page, [layout]);
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/layout-editor?id=record-label-layout"),
    );
    await page.locator("#edit-track-btn").click();
    await page
      .locator(".raceday-preview-container .widget-wrapper")
      .first()
      .dispatchEvent("pointerdown");
    const inspector = page.locator(
      ".widget-inspector-panel [data-folder='content']",
    );
    await inspector.locator("[data-field='emptyValueText'] input").waitFor();
    await TestSetupHelper.blurActiveElement(page);
    await page.mouse.move(0, 0);
    await expect(inspector).toHaveScreenshot(
      "layout-editor-record-label-inspector.png",
    );
  });
});
