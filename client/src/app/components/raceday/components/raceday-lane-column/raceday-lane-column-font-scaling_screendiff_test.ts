import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Raceday Lane Column Font Scaling Range Visuals", () => {
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
            id: "w-col-name-wrap",
            widgetType: "lane-column",
            x: 60,
            y: 100,
            width: 240,
            height: 120,
            zIndex: 1,
            minFontSize: 16,
            maxFontSize: 48,
            customSettings: {
              columnKey: "driver.name",
              laneIndex: 0,
              showHeader: true,
              customLabel: "NAME (WRAP)",
              headerBackgroundColor: "#0f172a",
              headerTextColor: "#94a3b8",
              headerFontSize: 14,
              backgroundColor: "#1e293b",
              valueTextColor: "#38bdf8",
              minFontSize: 16,
              maxFontSize: 48,
              showBorder: true,
              borderWidth: 2,
              borderRadius: 8,
            },
          },
          {
            id: "w-col-name-truncate",
            widgetType: "lane-column",
            x: 330,
            y: 100,
            width: 170,
            height: 80,
            zIndex: 1,
            minFontSize: 22,
            maxFontSize: 44,
            customSettings: {
              columnKey: "driver.name",
              laneIndex: 1,
              showHeader: true,
              customLabel: "NAME (TRUNCATE)",
              headerBackgroundColor: "#0f172a",
              headerTextColor: "#94a3b8",
              headerFontSize: 14,
              backgroundColor: "#1e293b",
              valueTextColor: "#a855f7",
              minFontSize: 22,
              maxFontSize: 44,
              showBorder: true,
              borderWidth: 2,
              borderRadius: 8,
            },
          },
          {
            id: "w-col-lap-count-clip",
            widgetType: "lane-column",
            x: 530,
            y: 100,
            width: 120,
            height: 80,
            zIndex: 1,
            minFontSize: 30,
            maxFontSize: 60,
            customSettings: {
              columnKey: "lapCount",
              laneIndex: 0,
              showHeader: true,
              customLabel: "LAP COUNT",
              headerBackgroundColor: "#0f172a",
              headerTextColor: "#94a3b8",
              headerFontSize: 14,
              backgroundColor: "#1e293b",
              valueTextColor: "#f59e0b",
              minFontSize: 30,
              maxFontSize: 60,
              showBorder: true,
              borderWidth: 2,
              borderRadius: 8,
            },
          },
          {
            id: "w-col-lap-time-clip",
            widgetType: "lane-column",
            x: 680,
            y: 100,
            width: 130,
            height: 80,
            zIndex: 1,
            minFontSize: 28,
            maxFontSize: 54,
            customSettings: {
              columnKey: "lastLapTime",
              laneIndex: 0,
              showHeader: true,
              customLabel: "LAP TIME",
              headerBackgroundColor: "#0f172a",
              headerTextColor: "#94a3b8",
              headerFontSize: 14,
              backgroundColor: "#1e293b",
              valueTextColor: "#10b981",
              minFontSize: 28,
              maxFontSize: 54,
              showBorder: true,
              borderWidth: 2,
              borderRadius: 8,
            },
          },
        ],
      },
    });
  });

  async function setupRacedayWithScalingData(page: any): Promise<void> {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/default-raceday"),
    );

    const raceData = {
      race: {
        race: {
          model: { entityId: "r1" },
          name: "Font Scaling Range Test",
          track: {
            lanes: [
              {
                objectId: "l1",
                backgroundColor: "#ef4444",
                foregroundColor: "#ffffff",
                length: 10,
              },
              {
                objectId: "l2",
                backgroundColor: "#3b82f6",
                foregroundColor: "#ffffff",
                length: 10,
              },
            ],
          },
        },
        drivers: [
          {
            objectId: "rp1",
            driver: {
              name: "Alexander Montgomery the Great",
            },
          },
          {
            objectId: "rp2",
            driver: {
              name: "Maximilianus Alexander von Liechtenstein",
            },
          },
        ],
        currentHeat: {
          objectId: "h1",
          heatNumber: 1,
          heatDrivers: [
            {
              objectId: "hd1",
              laneIndex: 0,
              lapCount: 98765,
              lastLapTime: 123.456,
              driver: {
                objectId: "rp1",
                driver: {
                  name: "Alexander Montgomery the Great",
                },
              },
            },
            {
              objectId: "hd2",
              laneIndex: 1,
              lapCount: 12,
              lastLapTime: 5.432,
              driver: {
                objectId: "rp2",
                driver: {
                  name: "Maximilianus Alexander von Liechtenstein",
                },
              },
            },
          ],
        },
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);
    await page.locator(".dashboard-wrapper").waitFor({ state: "visible" });
  }

  test("should wrap multi-line driver name when scaled down towards min font size", async ({
    page,
  }) => {
    await setupRacedayWithScalingData(page);

    const card = page
      .locator("app-raceday-lane-column")
      .filter({ hasText: "NAME (WRAP)" });
    await card.waitFor({ state: "visible" });
    await card.locator(".lane-col-text").waitFor({ state: "visible" });

    await expect(card).toHaveScreenshot(
      "raceday-lane-column-name-wrapping.png",
      {
        maxDiffPixelRatio: 0.05,
        maxDiffPixels: 5000,
        animations: "disabled",
      },
    );
  });

  test("should truncate driver name with ellipsis when exceeding width at min font size", async ({
    page,
  }) => {
    await setupRacedayWithScalingData(page);

    const card = page
      .locator("app-raceday-lane-column")
      .filter({ hasText: "NAME (TRUNCATE)" });
    await card.waitFor({ state: "visible" });
    await card.locator(".lane-col-text").waitFor({ state: "visible" });

    await expect(card).toHaveScreenshot(
      "raceday-lane-column-name-truncating.png",
      {
        maxDiffPixelRatio: 0.05,
        maxDiffPixels: 5000,
        animations: "disabled",
      },
    );
  });

  test("should clip numeric lap count without ellipsis when exceeding width at min font size", async ({
    page,
  }) => {
    await setupRacedayWithScalingData(page);

    const card = page
      .locator("app-raceday-lane-column")
      .filter({ hasText: "LAP COUNT" });
    await card.waitFor({ state: "visible" });
    await card.locator(".lane-col-text").waitFor({ state: "visible" });

    await expect(card).toHaveScreenshot(
      "raceday-lane-column-lap-count-clipping.png",
      {
        maxDiffPixelRatio: 0.05,
        maxDiffPixels: 5000,
        animations: "disabled",
      },
    );
  });

  test("should clip numeric lap time without ellipsis when exceeding width at min font size", async ({
    page,
  }) => {
    await setupRacedayWithScalingData(page);

    const card = page
      .locator("app-raceday-lane-column")
      .filter({ hasText: "LAP TIME" });
    await card.waitFor({ state: "visible" });
    await card.locator(".lane-col-text").waitFor({ state: "visible" });

    await expect(card).toHaveScreenshot(
      "raceday-lane-column-lap-time-clipping.png",
      {
        maxDiffPixelRatio: 0.05,
        maxDiffPixels: 5000,
        animations: "disabled",
      },
    );
  });

  test("should display all font scaling widgets showing wrapping, ellipsis, and numeric clipping in dashboard row", async ({
    page,
  }) => {
    await setupRacedayWithScalingData(page);

    const dashboard = page.locator(".dashboard-wrapper");
    await dashboard.waitFor({ state: "visible" });

    await expect(dashboard).toHaveScreenshot(
      "raceday-lane-column-font-scaling-overview.png",
      {
        maxDiffPixelRatio: 0.05,
        maxDiffPixels: 5000,
        animations: "disabled",
      },
    );
  });
});
