import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Lane Grid Auto-Scale to Fit Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
  });

  test("should auto-scale and wrap grid title, column headers, and driver names while keeping numbers single-line", async ({
    page,
  }) => {
    const gridId = "grid-auto-scale";
    const gridBounds = { x: 100, y: 80, width: 1000, height: 460 };
    const labelHeight = 70;
    const headerHeight = 50;
    const rowHeight = 170;

    await TestSetupHelper.setupSettings(page, {
      racedayLayout: {
        baseWidth: 1600,
        baseHeight: 900,
        widgets: [
          // Header Widgets (isHeaderWidget: true)
          {
            id: "hdr-rank",
            widgetType: "lane-column",
            scaleMode: "auto",
            x: 100,
            y: 150,
            width: 180,
            height: headerHeight,
            zIndex: 10,
            customSettings: {
              gridId,
              isHeaderWidget: true,
              gridMasterId: "col-laps",
              columnKey: "lapCount",
              showHeader: true,
              customLabel: "LAPS",
              headerBackgroundColor: "#1e293b",
              headerTextColor: "#ffffff",
              headerFontSize: 20,
              gridBounds,
              gridLabelPosition: "top",
              gridLabelSize: labelHeight,
              gridLabelText:
                "Really Long Championship Grid Title That Wraps And Scales Down Without Truncation",
              gridLabelFontSize: 36,
              gridLabelFontBold: true,
              gridLabelBackgroundColor: "#0f172a",
              gridLabelTextColor: "#ffffff",
              gridLabelShowBorder: true,
              headerPlacement: "top",
              headerHeight,
              gridDirection: "vertical",
              gridTotalLanes: 2,
            },
          },
          {
            id: "hdr-name",
            widgetType: "lane-column",
            scaleMode: "auto",
            x: 280,
            y: 150,
            width: 480,
            height: headerHeight,
            zIndex: 10,
            customSettings: {
              gridId,
              isHeaderWidget: true,
              gridMasterId: "col-name",
              columnKey: "driver.nickname",
              showHeader: true,
              customLabel: "Super long nickname name should scale to fit",
              headerBackgroundColor: "#1e293b",
              headerTextColor: "#ffffff",
              headerFontSize: 20,
              gridBounds,
            },
          },
          {
            id: "hdr-lap",
            widgetType: "lane-column",
            scaleMode: "auto",
            x: 760,
            y: 150,
            width: 240,
            height: headerHeight,
            zIndex: 10,
            customSettings: {
              gridId,
              isHeaderWidget: true,
              gridMasterId: "col-lap",
              columnKey: "lastLapTime",
              showHeader: true,
              customLabel: "LAST LAP",
              headerBackgroundColor: "#1e293b",
              headerTextColor: "#ffffff",
              headerFontSize: 20,
              gridBounds,
            },
          },

          // Row 0 Widgets (gridLane: 0)
          {
            id: "row0-laps",
            widgetType: "lane-column",
            scaleMode: "auto",
            x: 100,
            y: 200,
            width: 180,
            height: rowHeight,
            zIndex: 10,
            customSettings: {
              gridId,
              gridLane: 0,
              targetIndex: 0,
              gridMasterId: "col-laps",
              columnKey: "lapCount",
              showHeader: false,
              backgroundColor: "#ef4444",
              valueTextColor: "#000000",
              valueFontSize: 80,
              valueFontBold: true,
              showBorder: true,
              gridBounds,
            },
          },
          {
            id: "row0-name",
            widgetType: "lane-column",
            scaleMode: "auto",
            x: 280,
            y: 200,
            width: 480,
            height: rowHeight,
            zIndex: 10,
            customSettings: {
              gridId,
              gridLane: 0,
              targetIndex: 0,
              gridMasterId: "col-name",
              columnKey: "driver.nickname",
              showHeader: false,
              backgroundColor: "#ef4444",
              valueTextColor: "#000000",
              valueFontSize: 60,
              valueFontBold: true,
              showBorder: true,
              gridBounds,
            },
          },
          {
            id: "row0-lap",
            widgetType: "lane-column",
            scaleMode: "auto",
            x: 760,
            y: 200,
            width: 240,
            height: rowHeight,
            zIndex: 10,
            customSettings: {
              gridId,
              gridLane: 0,
              targetIndex: 0,
              gridMasterId: "col-lap",
              columnKey: "lastLapTime",
              showHeader: false,
              backgroundColor: "#ef4444",
              valueTextColor: "#000000",
              valueFontSize: 70,
              valueFontBold: true,
              showBorder: true,
              gridBounds,
            },
          },

          // Row 1 Widgets (gridLane: 1)
          {
            id: "row1-laps",
            widgetType: "lane-column",
            scaleMode: "auto",
            x: 100,
            y: 370,
            width: 180,
            height: rowHeight,
            zIndex: 10,
            customSettings: {
              gridId,
              gridLane: 1,
              targetIndex: 1,
              gridMasterId: "col-laps",
              columnKey: "lapCount",
              showHeader: false,
              backgroundColor: "#3b82f6",
              valueTextColor: "#ffffff",
              valueFontSize: 80,
              valueFontBold: true,
              showBorder: true,
              gridBounds,
            },
          },
          {
            id: "row1-name",
            widgetType: "lane-column",
            scaleMode: "auto",
            x: 280,
            y: 370,
            width: 480,
            height: rowHeight,
            zIndex: 10,
            customSettings: {
              gridId,
              gridLane: 1,
              targetIndex: 1,
              gridMasterId: "col-name",
              columnKey: "driver.nickname",
              showHeader: false,
              backgroundColor: "#3b82f6",
              valueTextColor: "#ffffff",
              valueFontSize: 60,
              valueFontBold: true,
              showBorder: true,
              gridBounds,
            },
          },
          {
            id: "row1-lap",
            widgetType: "lane-column",
            scaleMode: "auto",
            x: 760,
            y: 370,
            width: 240,
            height: rowHeight,
            zIndex: 10,
            customSettings: {
              gridId,
              gridLane: 1,
              targetIndex: 1,
              gridMasterId: "col-lap",
              columnKey: "lastLapTime",
              showHeader: false,
              backgroundColor: "#3b82f6",
              valueTextColor: "#ffffff",
              valueFontSize: 70,
              valueFontBold: true,
              showBorder: true,
              gridBounds,
            },
          },
        ],
      },
    });

    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/default-raceday"),
    );

    const raceData = {
      race: {
        race: {
          model: { entityId: "r1" },
          name: "Dopamine",
          track: {
            lanes: [
              {
                objectId: "l1",
                backgroundColor: "#ef4444",
                foregroundColor: "#000000",
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
              name: "Bad Cheese",
              nickname: "Bad Cheese",
            },
          },
          {
            objectId: "rp2",
            driver: {
              name: "Uncle Jon The Lightning Fast Speedster",
              nickname: "Uncle Jon The Lightning Fast Speedster",
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
              lapCount: 15,
              lastLapTime: 11.234,
              driver: {
                objectId: "rp1",
                driver: {
                  name: "Bad Cheese",
                  nickname: "Bad Cheese",
                },
              },
            },
            {
              objectId: "hd2",
              laneIndex: 1,
              lapCount: 14,
              lastLapTime: 12.345,
              driver: {
                objectId: "rp2",
                driver: {
                  name: "Uncle Jon The Lightning Fast Speedster",
                  nickname: "Uncle Jon The Lightning Fast Speedster",
                },
              },
            },
          ],
        },
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);
    await page.locator(".dashboard-wrapper").waitFor();
    await page
      .locator("text=Uncle Jon The Lightning Fast Speedster")
      .first()
      .waitFor({ state: "visible" });

    const gridContainer = page.locator(".raceday-grid-container");
    await gridContainer.waitFor({ state: "visible" });

    await expect(gridContainer).toHaveScreenshot(
      "raceday-grid-auto-scale-to-fit.png",
      {
        maxDiffPixelRatio: 0.05,
        maxDiffPixels: 5000,
        animations: "disabled",
      },
    );
  });
});
