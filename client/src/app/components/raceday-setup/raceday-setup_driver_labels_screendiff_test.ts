import { expect, test } from "@playwright/test";
import {
  MOCK_DRIVER_LABELS,
  MOCK_DRIVERS,
} from "@app/testing/data/drivers_data";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Raceday Setup Driver Labels Visuals", () => {
  test.use({ locale: "en" });

  test.beforeEach(async ({ page }) => {
    const driversWithLabels = MOCK_DRIVERS.map((d) => {
      if (d.entity_id === "d1") {
        return { ...d, label_ids: ["lbl-pro"] };
      }
      if (d.entity_id === "d2") {
        return { ...d, label_ids: ["lbl-amateur"] };
      }
      if (d.entity_id === "d3") {
        return { ...d, label_ids: ["lbl-rookie"] };
      }
      return { ...d, label_ids: [] };
    });

    await TestSetupHelper.setupStandardMocks(page, {
      driverLabels: MOCK_DRIVER_LABELS,
    });

    await page.route("**/api/drivers", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(driversWithLabels),
      });
    });

    await TestSetupHelper.setupLocalStorage(page, {
      recentRaceIds: ["r1", "r2"],
      selectedDriverIds: ["d1", "d2"],
      racedaySetupWalkthroughSeen: true,
      language: "en",
    });

    await TestSetupHelper.waitForLocalization(page, "en", page.goto("/"));
    await expect(page.locator(".setup-container")).toBeVisible({
      timeout: 15000,
    });

    const splashScreen = page.locator(".splash-screen");
    if ((await splashScreen.count()) > 0) {
      await expect(splashScreen).not.toBeVisible({ timeout: 10000 });
    }

    await Promise.race([
      page.evaluate(() => document.fonts.ready),
      new Promise<void>((resolve) => setTimeout(resolve, 2000)),
    ]).catch((err) => {
      console.warn("Raceday Setup test: font ready wait failed:", err);
    });

    await TestSetupHelper.disableAnimations(page);
    await expect(page.getByText("Alice")).toBeVisible();
  });

  test("should display driver cards with labels and label filter dropdown", async ({
    page,
  }) => {
    await page.waitForSelector(".driver-panel");
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.mouse.move(0, 0);
    await TestSetupHelper.disableAnimations(page);

    await expect(page).toHaveScreenshot("raceday-setup-labels-overview.png", {
      maxDiffPixelRatio: 0.05,
      animations: "disabled",
      timeout: 10000,
    });
  });

  test("should filter available drivers by label", async ({ page }) => {
    await page.waitForSelector(".driver-panel");

    await page
      .locator("#available-label-filter .custom-select-trigger")
      .click();
    await page
      .locator(
        "#available-label-filter .custom-select-option[data-value='lbl-rookie']",
      )
      .click();
    await page
      .locator("#available-label-filter .custom-select-trigger")
      .click();

    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.mouse.move(0, 0);
    await TestSetupHelper.disableAnimations(page);

    await expect(page).toHaveScreenshot("raceday-setup-labels-filtered.png", {
      maxDiffPixelRatio: 0.05,
      animations: "disabled",
      timeout: 10000,
    });
  });

  test("should filter racing drivers by label", async ({ page }) => {
    await page.waitForSelector(".driver-panel");

    await page.locator("#racing-label-filter .custom-select-trigger").click();
    await page
      .locator(
        "#racing-label-filter .custom-select-option[data-value='lbl-pro']",
      )
      .click();
    await page.locator("#racing-label-filter .custom-select-trigger").click();

    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.mouse.move(0, 0);
    await TestSetupHelper.disableAnimations(page);

    await expect(page).toHaveScreenshot(
      "raceday-setup-racing-labels-filtered.png",
      {
        maxDiffPixelRatio: 0.05,
        animations: "disabled",
        timeout: 10000,
      },
    );
  });

  test("should display open multi-select label dropdown with checkboxes", async ({
    page,
  }) => {
    await page.waitForSelector(".driver-panel");

    await page
      .locator("#available-label-filter .custom-select-trigger")
      .click();

    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.mouse.move(0, 0);
    await TestSetupHelper.disableAnimations(page);

    await expect(page).toHaveScreenshot(
      "raceday-setup-labels-dropdown-open.png",
      {
        maxDiffPixelRatio: 0.05,
        animations: "disabled",
        timeout: 10000,
      },
    );
  });

  test("should display team cards with labels in racing section", async ({
    page,
  }) => {
    await TestSetupHelper.setupLocalStorage(page, {
      recentRaceIds: ["r1", "r2"],
      selectedDriverIds: ["t1"],
      racedaySetupWalkthroughSeen: true,
      language: "en",
    });

    await TestSetupHelper.waitForLocalization(page, "en", page.goto("/"));
    await page.waitForSelector(".driver-panel");
    await expect(page.getByText("Team Alpha")).toBeVisible();
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.mouse.move(0, 0);
    await TestSetupHelper.disableAnimations(page);

    await expect(page).toHaveScreenshot("raceday-setup-teams-with-labels.png", {
      maxDiffPixelRatio: 0.05,
      animations: "disabled",
      timeout: 10000,
    });
  });

  test("should display driver cards with multi-label overflow shrunk to dots", async ({
    page,
  }) => {
    const multiLabels = [
      ...MOCK_DRIVER_LABELS,
      { entity_id: "lbl-vet", name: "Veteran", color: "#d97706" },
      { entity_id: "lbl-champ", name: "Champion", color: "#9333ea" },
    ];

    const overflowDrivers = [
      {
        ...MOCK_DRIVERS[0],
        entity_id: "d1",
        name: "Alice",
        nickname: "The Rocket",
        label_ids: ["lbl-pro"],
      },
      {
        ...MOCK_DRIVERS[1],
        entity_id: "d2",
        name: "Bob",
        nickname: "Drift King",
        label_ids: ["lbl-pro", "lbl-amateur"],
      },
      {
        ...MOCK_DRIVERS[2],
        entity_id: "d3",
        name: "Charlie",
        nickname: "Speedy",
        label_ids: ["lbl-pro", "lbl-amateur", "lbl-rookie"],
      },
      {
        ...MOCK_DRIVERS[3],
        entity_id: "d4",
        name: "Dave",
        nickname: "Apex Hunter",
        label_ids: [
          "lbl-pro",
          "lbl-amateur",
          "lbl-rookie",
          "lbl-vet",
          "lbl-champ",
        ],
      },
    ];

    await page.route("**/api/driver-labels", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(multiLabels),
      });
    });

    await page.route("**/api/drivers", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(overflowDrivers),
      });
    });

    await TestSetupHelper.setupLocalStorage(page, {
      recentRaceIds: ["r1", "r2"],
      selectedDriverIds: ["d1", "d2"],
      racedaySetupWalkthroughSeen: true,
      language: "en",
    });

    await TestSetupHelper.waitForLocalization(page, "en", page.goto("/"));
    await page.waitForSelector(".driver-panel");
    await expect(page.getByText("Alice")).toBeVisible();
    await expect(page.getByText("Dave")).toBeVisible();

    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.mouse.move(0, 0);
    await TestSetupHelper.disableAnimations(page);

    await expect(page).toHaveScreenshot(
      "raceday-setup-labels-overflow-dots.png",
      {
        maxDiffPixelRatio: 0.05,
        animations: "disabled",
        timeout: 10000,
      },
    );
  });

  test("should convert driver label to dot to prevent name and nickname truncation", async ({
    page,
  }) => {
    const customLabels = [
      { entity_id: "lbl-comp", name: "Competition 1", color: "#84cc16" },
      { entity_id: "lbl-club", name: "Club", color: "#ef4444" },
    ];

    const customDrivers = [
      {
        ...MOCK_DRIVERS[0],
        entity_id: "d1",
        name: "Driver 6 With Long Name",
        nickname: "Driver 6",
        label_ids: ["lbl-comp"],
      },
      {
        ...MOCK_DRIVERS[1],
        entity_id: "d2",
        name: "Driver 8",
        nickname: "Driver 8 With Long Nickname",
        label_ids: ["lbl-comp"],
      },
      {
        ...MOCK_DRIVERS[2],
        entity_id: "d3",
        name: "Driver 9",
        nickname: "Driver 9",
        label_ids: ["lbl-club", "lbl-comp"],
      },
      {
        ...MOCK_DRIVERS[3],
        entity_id: "d4",
        name: "Driver 10",
        nickname: "Driver 10",
        label_ids: ["lbl-comp"],
      },
    ];

    await page.route("**/api/driver-labels", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(customLabels),
      });
    });

    await page.route("**/api/drivers", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(customDrivers),
      });
    });

    await TestSetupHelper.setupLocalStorage(page, {
      recentRaceIds: ["r1", "r2"],
      selectedDriverIds: ["d1", "d2"],
      racedaySetupWalkthroughSeen: true,
      language: "en",
    });

    await TestSetupHelper.waitForLocalization(page, "en", page.goto("/"));
    await page.waitForSelector(".driver-panel");
    await expect(page.locator("#racing-item-0")).toBeVisible();
    await expect(page.locator("#avail-item-0")).toBeVisible();

    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.mouse.move(0, 0);
    await TestSetupHelper.disableAnimations(page);

    await expect(page).toHaveScreenshot(
      "raceday-setup-driver-label-dot-prevents-truncation.png",
      {
        maxDiffPixelRatio: 0.05,
        animations: "disabled",
        timeout: 10000,
      },
    );
  });

  test("should convert team label to dot to prevent team name truncation", async ({
    page,
  }) => {
    const customLabels = [
      { entity_id: "lbl-comp", name: "Competition 1", color: "#84cc16" },
    ];

    const teamDrivers = [
      {
        ...MOCK_DRIVERS[0],
        entity_id: "d1",
        name: "Driver 1",
        nickname: "D1",
        label_ids: [],
      },
      {
        ...MOCK_DRIVERS[1],
        entity_id: "d2",
        name: "Driver 2",
        nickname: "D2",
        label_ids: [],
      },
    ];

    const customTeams = [
      {
        entity_id: "t1",
        name: "Team Apex Motorsport",
        avatarUrl: "",
        driverIds: ["d1", "d2"],
        labelIds: ["lbl-comp"],
      },
      {
        entity_id: "t2",
        name: "Scuderia Ferrari",
        avatarUrl: "",
        driverIds: ["d1", "d2"],
        labelIds: ["lbl-comp"],
      },
    ];

    await page.route("**/api/driver-labels", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(customLabels),
      });
    });

    await page.route("**/api/drivers", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(teamDrivers),
      });
    });

    await page.route("**/api/teams", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(customTeams),
      });
    });

    await TestSetupHelper.setupLocalStorage(page, {
      recentRaceIds: ["r1", "r2"],
      selectedDriverIds: ["t1"],
      racedaySetupWalkthroughSeen: true,
      language: "en",
    });

    await TestSetupHelper.waitForLocalization(page, "en", page.goto("/"));
    await page.waitForSelector(".driver-panel");
    await expect(page.locator("#racing-item-0")).toBeVisible();

    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.mouse.move(0, 0);
    await TestSetupHelper.disableAnimations(page);

    await expect(page).toHaveScreenshot(
      "raceday-setup-team-label-dot-prevents-truncation.png",
      {
        maxDiffPixelRatio: 0.05,
        animations: "disabled",
        timeout: 10000,
      },
    );
  });
});
