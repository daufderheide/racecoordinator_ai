import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "src/app/testing/test-setup_helper";

test.describe("Cumulative Results Visuals", () => {
  const mockRaceHistory = [
    {
      _id: "race1",
      model: { name: "Thunder Road Dash" },
      track: { name: "Thunder Road" },
      car_class: "GT12",
      database_name: "Default.db",
      statistics: { startMillis: 1714982400000 }, // May 6, 2024
      drivers: [
        {
          driver: {
            entity_id: "d1",
            name: "Steve",
            nickname: "The Flash",
            avatarUrl: "assets/default-avatar.png",
          },
          totalLaps: 50,
          rankValue: 500,
          totalTime: 450.5,
          bestLapTime: 8.5,
          rank: 1,
        },
        {
          driver: {
            entity_id: "d2",
            name: "John",
            nickname: "Nitro",
            avatarUrl: "assets/default-avatar.png",
          },
          totalLaps: 48,
          rankValue: 480,
          totalTime: 460.2,
          bestLapTime: 8.7,
          rank: 2,
        },
      ],
      heats: [
        {
          drivers: [
            {
              driver: {
                totalLaps: 25,
                rankValue: 250,
                totalTime: 225.2,
                driver: { entity_id: "d1", name: "Steve" },
                averageLapTime: 9.0,
                bestLapTime: 8.6,
                medianLapTime: 8.9,
              },
            },
            {
              driver: {
                totalLaps: 24,
                rankValue: 240,
                totalTime: 230.1,
                driver: { entity_id: "d2", name: "John" },
                averageLapTime: 9.5,
                bestLapTime: 8.8,
                medianLapTime: 9.4,
              },
            },
          ],
        },
        {
          drivers: [
            {
              driver: {
                totalLaps: 25,
                rankValue: 250,
                totalTime: 225.3,
                driver: { entity_id: "d1", name: "Steve" },
                averageLapTime: 9.0,
                bestLapTime: 8.5,
                medianLapTime: 8.8,
              },
            },
            // Driver 2 sits out in heat 2
          ],
        },
      ],
    },
  ];

  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.disableAnimations(page);

    // Mock the race history list API
    await page.route("**/api/race-history*", async (route) => {
      await route.fulfill({ json: mockRaceHistory });
    });

    // Mock the single race detail API
    await page.route("**/api/race-history/race1*", async (route) => {
      await route.fulfill({ json: mockRaceHistory[0] });
    });

    // Add CSS to hide elements that cause flakiness
    await page.addInitScript(() => {
      window.addEventListener("DOMContentLoaded", () => {
        const style = document.createElement("style");
        style.textContent =
          ".connection-lost-overlay { display: none !important; }";
        document.head.appendChild(style);
      });
    });
  });

  test("should display cumulative results dashboard", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/analytics"),
    );

    // Wait for the history list to load
    await page.locator(".race-item").first().waitFor({ state: "visible" });

    // Select the race
    await page.locator(".race-item").first().click();

    // Wait for standings to calculate
    await page
      .locator(".standings-table tr")
      .nth(1)
      .waitFor({ state: "visible" });

    await expect(page).toHaveScreenshot("cumulative-results-main.png");
  });

  test("should display race detail with segments and sitouts", async ({
    page,
  }) => {
    // Navigate directly to race detail
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/analytics/race/race1"),
    );

    // Wait for race info to load
    await page.locator(".results-table").waitFor({ state: "visible" });

    // Check Segment 1 (initial)
    await expect(page).toHaveScreenshot("race-detail-segment-1.png");

    // Switch to second segment using the dropdown
    await page.locator(".heat-dropdown").selectOption({ index: 1 });

    // Wait for "SITOUT" text to appear for the second driver
    await page.locator(".sitout-text").waitFor({ state: "visible" });

    await expect(page).toHaveScreenshot("race-detail-segment-2-sitout.png");
  });
});
