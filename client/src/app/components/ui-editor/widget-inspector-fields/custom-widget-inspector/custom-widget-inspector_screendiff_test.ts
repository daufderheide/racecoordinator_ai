import { expect, test } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { InspectorKitHarnessE2e } from "@app/components/ui-editor/inspector-kit/testing/inspector-kit.harness.e2e";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

/** The sample Telemetry Gauge: text, switch, colour and number settings. */
function loadTelemetryGauge(): Record<string, Record<string, string>> {
  const folder = path.resolve(
    __dirname,
    "../../../../../assets/sample-widgets/sample-telemetry-gauge",
  );
  const files: Record<string, string> = {};
  for (const file of fs.readdirSync(folder)) {
    const p = path.join(folder, file);
    if (fs.statSync(p).isFile()) files[file] = fs.readFileSync(p, "utf-8");
  }
  return { "sample-telemetry-gauge": files };
}

test.describe("Custom Widget Panel Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.setupThemeMocks(page);
    await TestSetupHelper.setupCustomUiMocks(page);
    await TestSetupHelper.setupCustomWidgets(page, loadTelemetryGauge());
    await TestSetupHelper.setupSettings(page, {
      layoutEditorHelpShown: true,
      uiEditorHelpShown: true,
      racedayLayout: {
        widgets: [
          {
            id: "w-gauge",
            widgetType: "custom:sample-telemetry-gauge",
            x: 100,
            y: 100,
            width: 420,
            height: 260,
            zIndex: 100,
            customSettings: {
              unitLabel: "MPH",
              showMaxSpeed: true,
              dialColor: "#38bdf8",
              warningThreshold: 80,
            },
          },
        ],
      },
    });
    // no setupFileSystemMock here: it replaces the custom widget folder handle
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
  });

  test("should show a custom widget's manifest settings in the panel", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/layout-editor?edit=true"),
    );
    await page.locator(".layout-editor-content").waitFor({ state: "visible" });

    await page
      .locator(".widget-wrapper")
      .filter({ has: page.locator(".telemetry-gauge-card") })
      .first()
      .dispatchEvent("pointerdown");

    const kit = new InspectorKitHarnessE2e(page);
    await kit.waitForForm();

    // one panel field per manifest setting, with the stored values
    await expect(page.locator("#kit-unitLabel")).toHaveValue("MPH");
    await expect(page.locator("#kit-showMaxSpeed")).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(page.locator("#kit-warningThreshold")).toHaveValue("80");

    // a change is stored under the manifest's key
    await kit.fillText("unitLabel", "KPH");
    await expect(page.locator(".telemetry-gauge-card")).toContainText("KPH");

    await kit.settle('[data-folder="content"]');
    await expect(kit.panel).toHaveScreenshot("custom-widget-panel.png", {
      animations: "disabled",
    });
  });
});
