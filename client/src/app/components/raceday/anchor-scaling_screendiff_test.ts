import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Anchor Scaling Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
  });

  test("should scale large images correctly in all 4 corners", async ({
    page,
  }) => {
    // Configure 4 columns, each with a different corner anchor for the avatar
    await TestSetupHelper.setupSettings(page, {
      racedayColumns: ["col1", "col2", "col3", "col4"],
      columnLayouts: {
        col1: {
          "top-left": "driver.avatarUrl",
          "center-center": "driver.name",
        },
        col2: {
          "top-right": "driver.avatarUrl",
          "center-center": "driver.name",
        },
        col3: {
          "bottom-left": "driver.avatarUrl",
          "center-center": "driver.name",
        },
        col4: {
          "bottom-right": "driver.avatarUrl",
          "center-center": "driver.name",
        },
      },
      columnAnchors: {
        col1: "Center",
        col2: "Center",
        col3: "Center",
        col4: "Center",
      },
      columnWidths: {
        col1: 250,
        col2: 250,
        col3: 250,
        col4: 250,
      },
    });

    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/default-raceday"),
    );

    const driverModel = {
      model: { entityId: "d1" },
      name: "Corner Test",
      avatarUrl: "/api/assets/download?filename=large-image.png",
    };

    const participant = {
      objectId: "p1",
      driver: driverModel,
    };

    const raceData = {
      race: {
        race: {
          model: { entityId: "r1" },
          name: "Anchor Scaling Test",
          track: {
            model: { entityId: "t1" },
            name: "Test Track",
            lanes: [
              {
                objectId: "l1",
                length: 10,
                backgroundColor: "#333",
                foregroundColor: "#fff",
              },
            ],
          },
        },
        drivers: [participant],
        currentHeat: {
          objectId: "h1",
          heatNumber: 1,
          heatDrivers: [
            {
              objectId: "hd1",
              laneIndex: 0,
              driver: participant,
              actualDriver: driverModel,
            },
          ],
        },
      },
    };

    // Override the mock to provide a "large" image (green square to distinguish from default mock)
    await page.route(
      "**/api/assets/download?filename=large-image.png",
      async (route) => {
        const largeMockImage = `
          <svg width="1000" height="1000" xmlns="http://www.w3.org/2000/svg">
            <rect width="1000" height="1000" fill="#4caf50" />
            <rect width="200" height="200" fill="#ffeb3b" /> <!-- Yellow corner marker to verify orientation -->
            <text x="500" y="500" font-family="Arial" font-size="100" text-anchor="middle" fill="white" dominant-baseline="middle">LARGE IMG</text>
          </svg>
        `.trim();
        await route.fulfill({
          status: 200,
          contentType: "image/svg+xml",
          body: largeMockImage,
        });
      },
    );

    await TestSetupHelper.mockRaceData(page, raceData);
    await page.locator(".table-row").first().waitFor({ state: "visible" });
    await page.waitForTimeout(1000); // Wait for images to load and layout to settle

    await expect(page).toHaveScreenshot("raceday-anchor-scaling-corners.png", {
      maxDiffPixelRatio: 0.1,
    });
  });
});
