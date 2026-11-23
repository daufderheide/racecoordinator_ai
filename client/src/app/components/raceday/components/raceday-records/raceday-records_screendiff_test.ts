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
    backgroundColor?: string;
    backgroundOpacity?: number;
    shadow?: string;
    headerFontWeight?: string;
    headerLetterSpacing?: number;
    headerTextTransform?: string;
    lapDecimalPlaces?: number;
    scoreDecimalPlaces?: number;
    emptyValueMode?: string;
    emptyValueText?: string;
  },
  raceData: any = MOCK_RACE_DATA,
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
  await TestSetupHelper.mockRaceData(page, raceData);

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

  test("should draw the header text style: bold, letter spacing, uppercase", async ({
    page,
  }) => {
    const records = await setupRecordsTest(page, {
      headerFontWeight: "bold",
      headerLetterSpacing: 2,
      headerTextTransform: "uppercase",
    });
    await expect(records).toHaveScreenshot("raceday-records-header-style.png");
  });

  test("should draw the frame options: background opacity and shadow", async ({
    page,
  }) => {
    await setupRecordsTest(page, {
      backgroundColor: "#c81e1e",
      backgroundOpacity: 60,
      shadow: "raised",
    });
    // the shadow falls outside the widget, so capture a margin around it
    const wrapper = page
      .locator(".widget-wrapper")
      .filter({ has: page.locator("app-raceday-records") })
      .first();
    const box = (await wrapper.boundingBox())!;
    await expect(page).toHaveScreenshot("raceday-records-frame-options.png", {
      clip: {
        x: Math.max(0, box.x - 24),
        y: Math.max(0, box.y - 24),
        width: box.width + 48,
        height: box.height + 48,
      },
    });
  });

  test("should show lap times and the score with the chosen decimals", async ({
    page,
  }) => {
    const records = await setupRecordsTest(page, {
      lapDecimalPlaces: 1,
      scoreDecimalPlaces: 0,
    });
    await expect(records).toHaveScreenshot("raceday-records-decimals.png");
  });

  test("should show own text where a record is missing", async ({ page }) => {
    // no score record and no heat best yet
    const data = JSON.parse(JSON.stringify(MOCK_RACE_DATA));
    delete data.race.recordData.overall.highestScore;
    delete data.race.recordData.current.heatFastestLap;
    const records = await setupRecordsTest(
      page,
      { emptyValueMode: "text", emptyValueText: "n/a" },
      data,
    );
    await expect(records).toHaveScreenshot("raceday-records-empty-text.png");
  });
});
