import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Raceday Lane View Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
  });

  test("should display lane grid with multiple lanes configured", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/default-raceday"),
    );

    await page.locator(".dashboard-wrapper").waitFor();

    const raceData = {
      race: {
        race: {
          model: { entityId: "r1" },
          name: "Screendiff Race",
          track: {
            model: { entityId: "t1" },
            name: "Test Track",
            lanes: [
              {
                objectId: "l1",
                backgroundColor: "#ff0000",
                foregroundColor: "#ffffff",
                length: 10,
              },
              {
                objectId: "l2",
                backgroundColor: "#00ff00",
                foregroundColor: "#000000",
                length: 10,
              },
            ],
          },
        },
        drivers: [
          { objectId: "rp1", driver: { name: "Alice", nickname: "Rocket" } },
          { objectId: "rp2", driver: { name: "Bob", nickname: "Drifter" } },
        ],
        currentHeat: {
          objectId: "h1",
          heatNumber: 1,
          heatDrivers: [
            {
              objectId: "hd1",
              laneIndex: 0,
              lapCount: 3,
              lastLapTime: 12.345,
              driver: {
                objectId: "rp1",
                driver: { name: "Alice", nickname: "Rocket" },
              },
            },
            {
              objectId: "hd2",
              laneIndex: 1,
              lapCount: 2,
              lastLapTime: 14.567,
              driver: {
                objectId: "rp2",
                driver: { name: "Bob", nickname: "Drifter" },
              },
            },
          ],
        },
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);
    await page.locator(".table-row").first().waitFor({ state: "visible" });

    const laneView = page.locator("app-raceday-lane-view");
    await expect(laneView).toBeVisible();

    await expect(laneView).toHaveScreenshot("raceday-lane-view-initial.png");
  });
  test("should scale long names to fit in lane grid", async ({ page }) => {
    // Setup specific columns and width to force the long name to scale down
    // Use 450px width so "Bob" won't scale but the long name will have to scale heavily.
    await TestSetupHelper.setupSettings(page, {
      racedayColumns: ["driver.nickname", "lapCount"],
      columnLayouts: {
        "driver.nickname": { "center-center": "driver.nickname" },
        lapCount: { "center-center": "lapCount" },
      },
      columnAnchors: {
        "driver.nickname": "center-center",
        lapCount: "center-center",
      },
      columnWidths: {
        "driver.nickname": 450,
      },
    });

    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/default-raceday"),
    );

    await page.locator(".dashboard-wrapper").waitFor();

    const raceData = {
      race: {
        race: {
          model: { entityId: "r1" },
          name: "Screendiff Long Name Race",
          track: {
            model: { entityId: "t1" },
            name: "Test Track",
            lanes: [
              {
                objectId: "l1",
                backgroundColor: "#ff0000",
                foregroundColor: "#ffffff",
                length: 10,
              },
              {
                objectId: "l2",
                backgroundColor: "#00ff00",
                foregroundColor: "#000000",
                length: 10,
              },
            ],
          },
        },
        drivers: [
          {
            objectId: "rp1",
            driver: {
              name: "Driver1 WithAnAbsurdlyLongNameThatWillNeverEverFitInThisSpaceNoMatterWhat",
              nickname:
                "Driver1 WithAnAbsurdlyLongNameThatWillNeverEverFitInThisSpaceNoMatterWhat",
            },
          },
          {
            objectId: "rp2",
            driver: {
              name: "Bob",
              nickname: "Bob",
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
              lapCount: 3,
              lastLapTime: 12.345,
              driver: {
                objectId: "rp1",
                driver: {
                  name: "Driver1 WithAnAbsurdlyLongNameThatWillNeverEverFitInThisSpaceNoMatterWhat",
                  nickname:
                    "Driver1 WithAnAbsurdlyLongNameThatWillNeverEverFitInThisSpaceNoMatterWhat",
                },
              },
            },
            {
              objectId: "hd2",
              laneIndex: 1,
              lapCount: 2,
              lastLapTime: 14.567,
              driver: {
                objectId: "rp2",
                driver: { name: "Bob", nickname: "Bob" },
              },
            },
          ],
        },
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);
    await page.locator(".table-row").first().waitFor({ state: "visible" });

    const laneView = page.locator("app-raceday-lane-view");
    await expect(laneView).toBeVisible();

    // Disable blinking cursor to prevent flaky screenshots
    await page.addStyleTag({
      content:
        "*, *::before, *::after { caret-color: transparent !important; }",
    });

    await expect(laneView).toHaveScreenshot("raceday-lane-view-long-names.png");
  });

  test("should scale header row dynamically when a large custom column font size is configured", async ({
    page,
  }) => {
    // Navigate and set settings
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/default-raceday"),
    );

    await TestSetupHelper.setupSettings(page, {
      racedayColumns: [
        "driver.name",
        "driver.nickname",
        "seed",
        "rankHeat",
        "rankOverall",
        "lapCount",
        "participant.fuelLevel",
      ],
      columnLayouts: {
        "driver.name": { CenterCenter: "driver.name" },
        "driver.nickname": { CenterCenter: "driver.nickname" },
        seed: { CenterCenter: "seed" },
        rankHeat: { CenterCenter: "rankHeat" },
        rankOverall: { CenterCenter: "rankOverall" },
        lapCount: { CenterCenter: "lapCount" },
        "participant.fuelLevel": { CenterCenter: "participant.fuelLevel" },
      },
      columnAnchors: {
        CenterCenter: "center-center",
      },
      customLayouts: [
        {
          id: "widget-lane-view",
          widgetType: "lane-view",
          x: 0,
          y: 0,
          width: 1600,
          height: 900,
          zIndex: 157,
          scaleMode: "auto",
          customSettings: {
            isVertical: true,
            columnFontSize: 80,
          },
        },
      ],
      columnVisibility: {},
    });

    const container = page.locator(".dashboard-wrapper");
    await container.waitFor();

    const raceData = {
      race: {
        race: {
          heat: 1,
        },
      },
      drivers: [
        {
          lane: 1,
          name: "Driver 1",
          nickname: "D1",
        },
        {
          lane: 2,
          name: "Driver 2",
          nickname: "D2",
        },
      ],
      lanes: [
        {
          lane: 1,
          lapCount: 10,
        },
        {
          lane: 2,
          lapCount: 15,
        },
      ],
    };

    await TestSetupHelper.mockRaceData(page, raceData);
    await page.locator(".table-row").first().waitFor({ state: "visible" });

    const laneView = page.locator("app-raceday-lane-view");
    await expect(laneView).toBeVisible();

    // Disable blinking cursor to prevent flaky screenshots
    await page.addStyleTag({
      content:
        "* { caret-color: transparent !important; } .blink { animation: none !important; }",
    });

    await expect(laneView).toHaveScreenshot(
      "raceday-lane-view-large-header.png",
    );
  });
});
