import { expect, test } from "@playwright/test";
import { DefaultRacedayHarnessE2e } from "@app/components/raceday/testing/default-raceday.harness.e2e";
import { RaceState } from "@app/proto/antigravity";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { ModifyHeatsModalHarnessE2e } from "./testing/modify-heats-modal.harness.e2e";

test.describe("Modify Heats Modal Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);

    await page.setViewportSize({ width: 1600, height: 900 });

    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/default-raceday"),
    );

    await page.locator(".dashboard-wrapper").waitFor();
  });

  test("should show initial state with available and racing drivers, along with a few heats V2", async ({
    page,
  }) => {
    const racedayHarness = new DefaultRacedayHarnessE2e(
      page.locator(".dashboard-wrapper"),
    );

    // Use correct protobuf field names (IRaceData -> IRace -> IRaceModel, ITrackModel, etc.)
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
              {
                objectId: "l3",
                backgroundColor: "#0000ff",
                foregroundColor: "#ffffff",
                length: 10,
              },
              {
                objectId: "l4",
                backgroundColor: "#ffff00",
                foregroundColor: "#000000",
                length: 10,
              },
            ],
          },
        },
        drivers: [
          {
            objectId: "rp1",
            seed: 1,
            driver: { model: { entityId: "d3" }, name: "Charlie" },
          },
          {
            objectId: "rp2",
            seed: 2,
            driver: { model: { entityId: "d4" }, name: "Dave" },
          },
        ],
        heats: [
          {
            objectId: "h1",
            heatNumber: 1,
            heatDrivers: [
              { objectId: "hd1", driverId: "rp1", driver: { objectId: "rp1" } },
              { objectId: "hd2", driverId: "rp2", driver: { objectId: "rp2" } },
            ],
          },
          {
            objectId: "h2",
            heatNumber: 2,
            heatDrivers: [],
          },
        ],
        currentHeat: { objectId: "h1", heatNumber: 1 },
        state: RaceState.NOT_STARTED,
      },
    };

    // Track API responses for debugging
    const apiResponses: string[] = [];
    page.on("response", async (resp) => {
      const url = resp.url();
      if (url.includes("/api/")) {
        const status = resp.status();
        let body = "";
        try {
          body = (await resp.text()).substring(0, 100);
        } catch {
          body = "BODY_ERROR";
        }
        apiResponses.push(`${url} -> ${status}: ${body}`);
      }
    });

    await TestSetupHelper.mockRaceData(page, raceData);

    await racedayHarness.clickMenuButton("Race Director");
    await racedayHarness.clickMenuItem("Modify Heats");

    const modalHarness = new ModifyHeatsModalHarnessE2e(
      page.locator("app-modify-heats-modal"),
    );
    await page.locator("app-modify-heats-modal").waitFor();

    // CRITICAL: Wait for localization to be applied to the newly opened modal
    await TestSetupHelper.waitForLocalization(page);

    // Wait for data to settle
    await page.waitForFunction(
      async () => {
        const dbCount =
          (await (window as any).tempModifyHeats?.databaseDrivers?.length) ?? 0;
        return dbCount > 0;
      },
      { timeout: 15000 },
    );

    // Wait for Charlie to be visible in the racing pool
    await page
      .locator('#driver-pool .driver-item:has-text("Charlie")')
      .waitFor({ state: "visible", timeout: 15000 });

    await modalHarness.waitForLoaderToBeHidden();
    await expect(page).toHaveScreenshot("modify-heats-initial-state.png");
  });

  test("should show when three heats have been started and cannot be edited, along with an editable heat", async ({
    page,
  }) => {
    const racedayHarness = new DefaultRacedayHarnessE2e(
      page.locator(".dashboard-wrapper"),
    );

    const raceData = {
      race: {
        race: {
          model: { entityId: "r1" },
          name: "Started Heats Race",
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
            seed: 1,
            driver: { model: { entityId: "d1" }, name: "Alice" },
          },
          {
            objectId: "rp2",
            seed: 2,
            driver: { model: { entityId: "d2" }, name: "Bob" },
          },
        ],
        heats: [
          {
            objectId: "h1",
            heatNumber: 1,
            started: true,
            heatDrivers: [
              { objectId: "hd1", driverId: "rp1", driver: { objectId: "rp1" } },
            ],
          },
          {
            objectId: "h2",
            heatNumber: 2,
            started: true,
            heatDrivers: [
              { objectId: "hd2", driverId: "rp2", driver: { objectId: "rp2" } },
            ],
          },
          {
            objectId: "h3",
            heatNumber: 3,
            heatDrivers: [],
          },
          {
            objectId: "h4",
            heatNumber: 4,
            heatDrivers: [],
          },
        ],
        currentHeat: { objectId: "h3", heatNumber: 3 },
        state: RaceState.PAUSED,
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);

    await racedayHarness.clickMenuButton("Race Director");
    await racedayHarness.clickMenuItem("Modify Heats");

    const modalHarness = new ModifyHeatsModalHarnessE2e(
      page.locator("app-modify-heats-modal"),
    );
    await page.locator("app-modify-heats-modal").waitFor();

    // CRITICAL: Wait for localization to be applied to the newly opened modal
    await TestSetupHelper.waitForLocalization(page);

    await page.waitForFunction(
      async () => {
        const overlays = document.querySelectorAll(".locked-overlay");
        return overlays.length === 3;
      },
      { timeout: 15000 },
    );

    await modalHarness.waitForLoaderToBeHidden();
    await expect(page).toHaveScreenshot("modify-heats-started-state.png");
  });

  async function setupUndoRedoTest(page: any) {
    const racedayHarness = new DefaultRacedayHarnessE2e(
      page.locator(".dashboard-wrapper"),
    );

    const raceData = {
      race: {
        race: {
          model: { entityId: "r1" },
          name: "Undo/Redo Race",
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
            ],
          },
        },
        drivers: [
          {
            objectId: "rp1",
            seed: 1,
            driver: { model: { entityId: "d1" }, name: "Alice" },
          },
        ],
        heats: [{ objectId: "h1", heatNumber: 1, heatDrivers: [] }],
        currentHeat: { objectId: "h1", heatNumber: 1 },
        state: RaceState.NOT_STARTED,
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);

    await racedayHarness.clickMenuButton("Race Director");
    await racedayHarness.clickMenuItem("Modify Heats");

    const modalHarness = new ModifyHeatsModalHarnessE2e(
      page.locator("app-modify-heats-modal"),
    );
    await page.locator("app-modify-heats-modal").waitFor();

    // CRITICAL: Wait for modal localization
    await TestSetupHelper.waitForLocalization(page);

    const firstHeatCard = page.locator(".heat-card").first();

    return { modalHarness, firstHeatCard };
  }

  test("should show state after moving a driver to a heat", async ({
    page,
  }) => {
    const { modalHarness, firstHeatCard } = await setupUndoRedoTest(page);

    // Move Alice to Heat 1
    await modalHarness.dragDriverToHeat("Alice", 0);

    // Wait for Alice to be in heat
    await firstHeatCard
      .locator('.driver-item:has-text("Alice")')
      .waitFor({ state: "visible" });

    // Screenshot after move
    await modalHarness.waitForLoaderToBeHidden();
    await expect(page).toHaveScreenshot("modify-heats-after-move.png");
  });

  test("should show state after undoing a driver move", async ({ page }) => {
    const { modalHarness, firstHeatCard } = await setupUndoRedoTest(page);

    // Move Alice to Heat 1
    await modalHarness.dragDriverToHeat("Alice", 0);
    await firstHeatCard
      .locator('.driver-item:has-text("Alice")')
      .waitFor({ state: "visible" });

    // Undo
    await modalHarness.clickUndo();

    // Wait for Alice to NOT be in heat anymore
    await firstHeatCard
      .locator('.driver-item:has-text("Alice")')
      .waitFor({ state: "hidden" });

    // Screenshot after undo
    await modalHarness.waitForLoaderToBeHidden();
    await expect(page).toHaveScreenshot("modify-heats-after-undo.png");
  });

  test("should show state after redoing a driver move", async ({ page }) => {
    const { modalHarness, firstHeatCard } = await setupUndoRedoTest(page);

    // Move Alice to Heat 1
    await modalHarness.dragDriverToHeat("Alice", 0);
    await firstHeatCard
      .locator('.driver-item:has-text("Alice")')
      .waitFor({ state: "visible" });

    // Undo
    await modalHarness.clickUndo();
    await firstHeatCard
      .locator('.driver-item:has-text("Alice")')
      .waitFor({ state: "hidden" });

    // Redo
    await modalHarness.clickRedo();

    // Wait for Alice to be in heat again
    await firstHeatCard
      .locator('.driver-item:has-text("Alice")')
      .waitFor({ state: "visible" });

    // Screenshot after redo
    await modalHarness.waitForLoaderToBeHidden();
    await expect(page).toHaveScreenshot("modify-heats-after-redo.png");
  });

  test("should show collapsed available list with scrollbar in racing drivers list when there are many drivers", async ({
    page,
  }) => {
    const racedayHarness = new DefaultRacedayHarnessE2e(
      page.locator(".dashboard-wrapper"),
    );

    // Create 20 drivers to ensure the list is long enough to show a scrollbar
    const drivers = Array.from({ length: 20 }, (_, i) => ({
      objectId: `rp${i + 1}`,
      seed: i + 1,
      driver: {
        model: { entityId: `d_racer_${i + 1}` },
        name: `Racer ${i + 1}`,
      },
    }));

    const raceData = {
      race: {
        race: {
          model: { entityId: "r1" },
          name: "Screendiff Scrollbar Race",
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
        drivers: drivers,
        heats: [
          {
            objectId: "h1",
            heatNumber: 1,
            heatDrivers: [],
          },
        ],
        currentHeat: { objectId: "h1", heatNumber: 1 },
        state: RaceState.NOT_STARTED,
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);

    await racedayHarness.clickMenuButton("Race Director");
    await racedayHarness.clickMenuItem("Modify Heats");

    const modalHarness = new ModifyHeatsModalHarnessE2e(
      page.locator("app-modify-heats-modal"),
    );
    await page.locator("app-modify-heats-modal").waitFor();

    // CRITICAL: Wait for localization to be applied to the newly opened modal
    await TestSetupHelper.waitForLocalization(page);

    // Wait for the first and last Racer to be visible in the racing pool to ensure the list is fully loaded
    await page
      .locator('#driver-pool .driver-item:has-text("Racer 1")')
      .first()
      .waitFor({ state: "visible", timeout: 15000 });
    await page
      .locator('#driver-pool .driver-item:has-text("Racer 20")')
      .first()
      .waitFor({ state: "visible", timeout: 15000 });

    // Collapse the available drivers section by clicking its header title container (second pool section)
    const availableHeader = page
      .locator(".driver-pool-section")
      .nth(1)
      .locator(".header-title-container");
    await availableHeader.click();

    // Wait for the collapsed class to be applied to the second section
    await page
      .locator(".driver-pool-section.collapsed")
      .waitFor({ state: "visible", timeout: 5000 });

    // Wait for loader to be hidden
    await modalHarness.waitForLoaderToBeHidden();

    // Capture screenshot for visual validation
    await expect(page).toHaveScreenshot(
      "modify-heats-collapsed-available-list.png",
    );
  });
});
