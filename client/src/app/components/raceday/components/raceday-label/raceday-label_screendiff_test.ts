import { expect, test } from "@playwright/test";
import { RaceState } from "@app/proto/antigravity";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Raceday Label Widget Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });

    await TestSetupHelper.setupSettings(page, {
      racedayLayout: {
        baseWidth: 1600,
        baseHeight: 900,
        widgets: [
          {
            id: "w-label-horizontal",
            widgetType: "label",
            x: 100,
            y: 100,
            width: 400,
            height: 60,
            zIndex: 1,
            customSettings: {
              text: "SPEEDWAY GRAND PRIX",
              fontSize: 22,
              fontBold: true,
              textColor: "#38bdf8",
              backgroundColor: "rgba(15, 23, 42, 0.9)",
              alignment: "center",
              showBorder: true,
              borderColor: "#0284c7",
              borderWidth: 2,
              borderRadius: 8,
            },
          },
          {
            id: "w-label-vertical",
            widgetType: "label",
            x: 550,
            y: 100,
            width: 60,
            height: 300,
            zIndex: 1,
            customSettings: {
              text: "STANDINGS",
              vertical: true,
              fontSize: 18,
              fontBold: true,
              textColor: "#f59e0b",
              backgroundColor: "rgba(30, 41, 59, 0.9)",
              alignment: "center",
              showBorder: true,
              borderColor: "#d97706",
              borderWidth: 2,
              borderRadius: 6,
            },
          },
          {
            id: "w-label-record",
            widgetType: "label",
            x: 100,
            y: 225,
            width: 220,
            height: 62,
            zIndex: 1,
            customSettings: {
              recordField: "heatBestTime",
              recordDecimals: 2,
              fontBold: true,
              fontSize: 28,
              textColor: "#38bdf8",
              backgroundColor: "#0f172a",
            },
          },
          {
            id: "w-label-timer",
            widgetType: "label",
            x: 100,
            y: 300,
            width: 240,
            height: 70,
            zIndex: 1,
            customSettings: {
              labelSource: "raceTimer",
              fontFamily: "monospace",
              fontBold: true,
              fontSize: 42,
              backgroundColor: "#0f172a",
              textColor: "#38bdf8",
            },
          },
        ],
      },
    });
  });

  test("should display styled horizontal label widget", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/default-raceday"),
    );
    await page.locator(".dashboard-wrapper").waitFor();

    const labelWidget = page.locator("app-raceday-label").first();
    await labelWidget.waitFor({ state: "visible" });

    await expect(labelWidget).toHaveScreenshot("raceday-label-horizontal.png", {
      maxDiffPixelRatio: 0.05,
      maxDiffPixels: 5000,
      animations: "disabled",
    });
  });

  test("should display a live lap record in a Label", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/default-raceday"),
    );
    const liveLabel = page.locator("app-raceday-label").nth(2);
    await liveLabel
      .locator(".label-widget-text", { hasText: "--.---" })
      .waitFor();
    await TestSetupHelper.mockRaceData(page, {
      recordData: {
        current: { heatFastestLap: { value: 4.127, holderNickname: "Mario" } },
      },
    });
    await liveLabel
      .locator(".label-widget-text", { hasText: "4.13" })
      .waitFor();
    await expect(liveLabel).toHaveScreenshot("raceday-label-record.png");
  });

  test("should display vertical orientation label widget", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/default-raceday"),
    );
    await page.locator(".dashboard-wrapper").waitFor();

    const verticalWidget = page.locator("app-raceday-label").nth(1);
    await verticalWidget.waitFor({ state: "visible" });

    await expect(verticalWidget).toHaveScreenshot(
      "raceday-label-vertical.png",
      {
        maxDiffPixelRatio: 0.05,
        maxDiffPixels: 5000,
        animations: "disabled",
      },
    );
  });

  test("should display the live race timer in a Label", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/default-raceday"),
    );
    const timerLabel = page.locator("app-raceday-label").nth(3);
    await timerLabel.waitFor();
    await TestSetupHelper.mockRaceData(page, { raceState: RaceState.PAUSED });
    await TestSetupHelper.mockRaceData(page, { raceTime: { time: 83.25 } });
    await timerLabel.getByText("1:23", { exact: true }).waitFor();
    await expect(timerLabel).toHaveScreenshot("raceday-label-race-timer.png");
  });
});
