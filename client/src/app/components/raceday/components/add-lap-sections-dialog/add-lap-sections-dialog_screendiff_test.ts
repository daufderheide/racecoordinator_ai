import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Add Lap Sections Dialog Visuals", () => {
  test.beforeEach(async ({ page }) => {
    page.on("console", (msg) =>
      console.log(`BROWSER [${msg.type()}]: ${msg.text()}`),
    );
    page.on("pageerror", (err) =>
      console.error(`BROWSER ERROR: ${err.message}`),
    );

    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.waitForLoadState("networkidle");

    await TestSetupHelper.setupSettings(page, {
      racedayColumns: ["driver.name", "lapCount"],
      columnLayouts: {
        "driver.name": { "center-center": "driver.name" },
        lapCount: { "center-center": "lapCount" },
      },
      columnAnchors: {
        "driver.name": "center-center",
        lapCount: "center-center",
      },
      columnWidths: {
        "driver.name": 200,
        lapCount: 100,
      },
      columnVisibility: {},
    });
  });

  test("should open the dialog and display the current lap sections information on lap cell click", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/default-raceday"),
    );

    const raceData = {
      race: {
        race: {
          model: { entityId: "r1" },
          name: "Screendiff Lap Sections Race",
          track: {
            model: { entityId: "t1" },
            name: "Test Track",
            num_track_sections: 50,
            lanes: [
              {
                objectId: "l1",
                length: 10,
                backgroundColor: "#ff0000",
                foregroundColor: "#ffffff",
              },
            ],
          },
        },
        drivers: [
          {
            objectId: "rp1",
            driver: { name: "Alice", nickname: "Rocket" },
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
              userLaps: 1.5,
              driver: {
                objectId: "rp1",
                driver: { name: "Alice", nickname: "Rocket" },
              },
            },
          ],
        },
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);
    await page.locator(".table-row").first().waitFor({ state: "visible" });
    await page.waitForTimeout(500);

    // Click the lap count cell by its text content "1.50"
    const lapCell = page
      .locator("app-raceday-lane-view .body-cell")
      .filter({ hasText: "1.50" })
      .first();
    await expect(lapCell).toBeVisible();
    await lapCell.click();

    // Verify dialog content is visible
    const dialogContent = page.locator(
      "app-add-lap-sections-dialog .modal-content",
    );
    await expect(dialogContent).toBeVisible();

    // Wait for translations to settle in dialog
    await TestSetupHelper.waitForLocalization(page);

    await expect(dialogContent).toHaveScreenshot(
      "add-lap-sections-dialog-open.png",
      {
        maxDiffPixelRatio: 0.001,
        maxDiffPixels: 0,
      },
    );
  });

  test("should display auto segments line in dialog under auto-segments format", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/default-raceday"),
    );

    const raceData = {
      race: {
        race: {
          model: { entityId: "r1" },
          name: "Screendiff Auto Sections Race",
          heatScoring: {
            allowFinish: 3, // AF_NONE_AUTO_SEGMENTS
          },
          track: {
            model: { entityId: "t1" },
            name: "Test Track",
            num_track_sections: 100,
            lanes: [
              {
                objectId: "l1",
                length: 10,
                backgroundColor: "#0000ff",
                foregroundColor: "#ffffff",
              },
            ],
          },
        },
        drivers: [
          {
            objectId: "rp1",
            driver: { name: "Bob", nickname: "Fast" },
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
              userLaps: 1.5,
              autoCalculatedLaps: 0.35,
              driver: {
                objectId: "rp1",
                driver: { name: "Bob", nickname: "Fast" },
              },
            },
          ],
        },
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);
    await page.locator(".table-row").first().waitFor({ state: "visible" });
    await page.waitForTimeout(500);

    // Click the lap count cell by its text content "1.50" (or 1.85 due to userLaps + autoCalculatedLaps)
    const lapCell = page
      .locator("app-raceday-lane-view .body-cell")
      .filter({ hasText: "1.85" })
      .first();
    await expect(lapCell).toBeVisible();
    await lapCell.click();

    // Verify dialog content is visible
    const dialogContent = page.locator(
      "app-add-lap-sections-dialog .modal-content",
    );
    await expect(dialogContent).toBeVisible();

    // Wait for translations to settle in dialog
    await TestSetupHelper.waitForLocalization(page);

    await expect(dialogContent).toHaveScreenshot(
      "add-lap-sections-dialog-open-auto-segments.png",
      {
        maxDiffPixelRatio: 0.001,
        maxDiffPixels: 0,
      },
    );
  });
});
