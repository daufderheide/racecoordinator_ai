import { expect, test } from "@playwright/test";
import { RaceState } from "@app/proto/antigravity";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Raceday Start Sequence Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Mock specific colors for start lamps to make diffs clear
    await page.route("**/start_*.png", async (route) => {
      const url = route.request().url();
      let color = "silver"; // Dim
      let label = "DIM";
      if (url.includes("red_on")) {
        color = "red";
        label = "ON";
      }
      if (url.includes("green")) {
        color = "lime";
        label = "GO";
      }

      const svg = `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="40" fill="${color}" stroke="white" stroke-width="5"/>
        <text x="50" y="55" font-family="Arial" font-size="20" font-weight="bold" fill="black" text-anchor="middle">${label}</text>
      </svg>`;

      await route.fulfill({
        status: 200,
        contentType: "image/svg+xml",
        body: svg,
      });
    });

    await page.waitForLoadState("networkidle");
  });

  test("should show 5 dim lamps when starting a new race", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/default-raceday"),
    );

    const raceData = {
      race: {
        race: {
          model: { entityId: "r1" },
          name: "Test Race",
          startTime: 5.0,
          track: {
            lanes: [
              {
                objectId: "l1",
                backgroundColor: "#333",
                foregroundColor: "#fff",
              },
            ],
          },
        },
        currentHeat: {
          objectId: "h1",
          heatNumber: 1,
          heatDrivers: [{ laneIndex: 0, driver: { name: "Racer" } }],
        },
      },
    };
    await TestSetupHelper.mockRaceData(page, raceData);
    await page.waitForTimeout(200);

    // Transition to STARTING state
    await TestSetupHelper.sendRaceState(page, RaceState.STARTING);
    await TestSetupHelper.sendRaceTime(page, {
      time: 5.0,
      autoStartRemaining: 5.0,
    });

    // Wait for the component to process the WebSocket messages and fetch assets if needed
    await page.waitForTimeout(500);

    await page.locator(".countdown-overlay").waitFor({ state: "visible" });

    // All 5 lamps should be dim initially (time=5.0)
    await expect(page).toHaveScreenshot("start-sequence-5-dim.png");
  });

  test("should show 3 red lamps when countdown is at 2.5s", async ({
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
          name: "Test Race",
          startTime: 5.0,
          track: {
            lanes: [
              {
                objectId: "l1",
                backgroundColor: "#333",
                foregroundColor: "#fff",
              },
            ],
          },
        },
        currentHeat: {
          objectId: "h1",
          heatNumber: 1,
          heatDrivers: [{ laneIndex: 0, driver: { name: "Racer" } }],
        },
      },
    };
    await TestSetupHelper.mockRaceData(page, raceData);
    await page.waitForTimeout(200);

    // Transition to STARTING state and tick down
    // At T=2.5, 5 - floor(2.5) = 5 - 2 = 3 lamps should be ON
    await TestSetupHelper.sendRaceState(page, RaceState.STARTING);
    await TestSetupHelper.sendRaceTime(page, {
      time: 2.5,
      autoStartRemaining: 2.5,
    });

    // Wait for the component to process the WebSocket messages and fetch assets if needed
    await page.waitForTimeout(500);

    await page.locator(".countdown-overlay").waitFor({ state: "visible" });
    await expect(page).toHaveScreenshot("start-sequence-3-red.png");
  });

  test("should show all green lamps when race starts", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/default-raceday"),
    );

    const raceData = {
      race: {
        race: {
          model: { entityId: "r1" },
          name: "Test Race",
          startTime: 5.0,
          track: {
            lanes: [
              {
                objectId: "l1",
                backgroundColor: "#333",
                foregroundColor: "#fff",
              },
            ],
          },
        },
        currentHeat: {
          objectId: "h1",
          heatNumber: 1,
          heatDrivers: [{ laneIndex: 0, driver: { name: "Racer" } }],
        },
      },
    };
    await TestSetupHelper.mockRaceData(page, raceData);
    await page.waitForTimeout(200);

    // Transition to STARTING then RACING
    await TestSetupHelper.sendRaceState(page, RaceState.STARTING);
    await TestSetupHelper.sendRaceTime(page, {
      time: 0.1,
      autoStartRemaining: 0.1,
    });
    await TestSetupHelper.sendRaceState(page, RaceState.RACING);

    // Wait for the component to process the WebSocket messages and fetch assets if needed
    await page.waitForTimeout(500);

    await page.locator(".countdown-overlay").waitFor({ state: "visible" });
    await expect(page).toHaveScreenshot("start-sequence-all-green.png");
  });

  test("should stay green if a late countdown message arrives after race start", async ({
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
          name: "Test Race",
          startTime: 5.0,
          track: {
            lanes: [
              {
                objectId: "l1",
                backgroundColor: "#333",
                foregroundColor: "#fff",
              },
            ],
          },
        },
        currentHeat: {
          objectId: "h1",
          heatNumber: 1,
          heatDrivers: [{ laneIndex: 0, driver: { name: "Racer" } }],
        },
      },
    };
    await TestSetupHelper.mockRaceData(page, raceData);
    await page.waitForTimeout(200);

    // 1. Transition to STARTING then RACING
    await TestSetupHelper.sendRaceState(page, RaceState.STARTING);
    await TestSetupHelper.sendRaceTime(page, {
      time: 0.1,
      autoStartRemaining: 0.1,
    });
    await TestSetupHelper.sendRaceState(page, RaceState.RACING);

    // 2. Wait a tiny bit, but less than 1s (overlay still visible)
    await page.waitForTimeout(200);

    // 3. Send a late RACETIME message that would normally show red lamps if the state check wasn't there
    // For example, if we were back in STARTING at 2.5s
    await TestSetupHelper.sendRaceTime(page, {
      time: 2.5,
      autoStartRemaining: 2.5,
    });

    // 4. Verify it's STILL ALL GREEN
    // Wait for the component to process the WebSocket messages and fetch assets if needed
    await page.waitForTimeout(500);

    await page.locator(".countdown-overlay").waitFor({ state: "visible" });
    await expect(page).toHaveScreenshot(
      "start-sequence-stay-green-late-msg.png",
    );
  });

  test("should show only 3 lamps when start_time is set to 3s", async ({
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
          model: { entityId: "r-3s" },
          name: "Test Race",
          startTime: 3.0,
          track: {
            lanes: [
              {
                objectId: "l1",
                backgroundColor: "#333",
                foregroundColor: "#fff",
              },
            ],
          },
        },
        currentHeat: {
          objectId: "h1",
          heatNumber: 1,
          heatDrivers: [{ laneIndex: 0, driver: { name: "Racer" } }],
        },
      },
    };
    await TestSetupHelper.mockRaceData(page, raceData);
    // Ensure the app has processed the new race data before we trigger the state change
    await page.waitForTimeout(200);

    // Transition to STARTING state
    await TestSetupHelper.sendRaceState(page, RaceState.STARTING);
    await TestSetupHelper.sendRaceTime(page, {
      time: 3.0,
      autoStartRemaining: 3.0,
    });

    await page.waitForTimeout(500);
    await page.locator(".countdown-overlay").waitFor({ state: "visible" });

    // Verify the visual state with exactly 3 lamps
    await expect(page).toHaveScreenshot("start-sequence-3-lamps-total.png");
  });

  test("should show restart duration when resuming from pause", async ({
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
          model: { entityId: "r-restart-2s" },
          name: "Test Race",
          startTime: 5.0,
          restartTime: 2.0,
          track: {
            lanes: [
              {
                objectId: "l1",
                backgroundColor: "#333",
                foregroundColor: "#fff",
              },
            ],
          },
        },
        currentHeat: {
          objectId: "h1",
          heatNumber: 1,
          heatDrivers: [{ laneIndex: 0, driver: { name: "Racer" } }],
        },
      },
    };
    await TestSetupHelper.mockRaceData(page, raceData);
    // Ensure the app has processed the new race data before we trigger the state change
    await page.waitForTimeout(200);

    // 1. Initial State: RACING
    await TestSetupHelper.sendRaceState(page, RaceState.RACING);

    // 2. PAUSE
    await TestSetupHelper.sendRaceState(page, RaceState.PAUSED);

    // 3. Resume -> STARTING
    await TestSetupHelper.sendRaceState(page, RaceState.STARTING);
    await TestSetupHelper.sendRaceTime(page, {
      time: 2.0,
      autoStartRemaining: 2.0,
    });

    await page.waitForTimeout(500);
    await page.locator(".countdown-overlay").waitFor({ state: "visible" });

    // Verify the visual state with exactly 2 lamps (restart_time = 2.0)
    await expect(page).toHaveScreenshot("start-sequence-restart-2-lamps.png");
  });
});
