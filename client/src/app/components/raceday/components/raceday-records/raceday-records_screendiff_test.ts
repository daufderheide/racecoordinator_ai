import { expect, type Page, test } from "@playwright/test";
import { Settings } from "@app/models/settings";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

const MOCK_RACE_DATA = {
  race: {
    race: {
      model: { entityId: "r1" },
      name: "Screendiff Race",
      track: {
        model: { entityId: "t1" },
        name: "Test Track",
        lanes: [{ objectId: "l1", length: 10 }],
      },
    },
    drivers: [],
    currentHeat: {
      objectId: "h1",
      heatNumber: 1,
      heatDrivers: [],
    },
    recordData: {
      overall: {
        fastestLap: { holderNickname: "Alice", value: 9.876 },
        highestScore: { holderNickname: "Bob", value: 15.4 },
      },
      current: {
        fastestLap: { holderNickname: "Charlie", value: 10.123 },
        heatFastestLap: { holderNickname: "Dave", value: 11.456 },
      },
    },
  },
};

async function setupRecordsTest(
  page: Page,
  customSettings?: {
    showRaceRecordLap?: boolean;
    showRaceRecordScore?: boolean;
    showCurrentRaceBest?: boolean;
    showHeatBest?: boolean;
  },
) {
  if (customSettings) {
    await TestSetupHelper.setupSettings(page, {
      racedayLayout: {
        ...Settings.DEFAULT_LAYOUT,
        widgets: Settings.DEFAULT_LAYOUT.widgets.map((w) =>
          w.id === "widget-records"
            ? {
                ...w,
                customSettings: {
                  ...w.customSettings,
                  ...customSettings,
                },
              }
            : w,
        ),
      },
    });
  }

  await TestSetupHelper.waitForLocalization(
    page,
    "en",
    page.goto("/default-raceday"),
  );

  await page.locator(".dashboard-wrapper").waitFor();
  await TestSetupHelper.mockRaceData(page, MOCK_RACE_DATA);

  const records = page.locator("app-raceday-records");
  await records.waitFor({ state: "visible" });
  return records;
}

test.describe("Raceday Records Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
  });

  test("should display records panel with scores", async ({ page }) => {
    const records = await setupRecordsTest(page);
    await expect(records).toHaveScreenshot("raceday-records-initial.png");
  });

  test("should display records panel with 3 metrics visible", async ({
    page,
  }) => {
    const records = await setupRecordsTest(page, {
      showHeatBest: false,
    });
    await expect(records).toHaveScreenshot("raceday-records-three-metrics.png");
  });

  test("should display records panel with 2 metrics visible", async ({
    page,
  }) => {
    const records = await setupRecordsTest(page, {
      showCurrentRaceBest: false,
      showHeatBest: false,
    });
    await expect(records).toHaveScreenshot("raceday-records-two-metrics.png");
  });

  test("should display records panel with 1 metric visible", async ({
    page,
  }) => {
    const records = await setupRecordsTest(page, {
      showRaceRecordScore: false,
      showCurrentRaceBest: false,
      showHeatBest: false,
    });
    await expect(records).toHaveScreenshot("raceday-records-one-metric.png");
  });
});
