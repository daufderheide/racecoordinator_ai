import { expect, test } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

function loadSampleWidgetFiles(): Record<string, Record<string, string>> {
  const baseDir = path.resolve(__dirname, "../../../assets/sample-widgets");
  const folders = [
    "sample-telemetry-gauge",
    "sample-lap-delta",
    "sample-sponsor-banner",
    "sample-detailed-leaderboard",
  ];
  const result: Record<string, Record<string, string>> = {};

  for (const folder of folders) {
    result[folder] = {};
    const folderPath = path.join(baseDir, folder);
    if (fs.existsSync(folderPath)) {
      const files = fs.readdirSync(folderPath);
      for (const file of files) {
        const filePath = path.join(folderPath, file);
        if (fs.statSync(filePath).isFile()) {
          result[folder][file] = fs.readFileSync(filePath, "utf-8");
        }
      }
    }
  }
  return result;
}

const SAMPLE_WIDGET_FILES = loadSampleWidgetFiles();

const MOCK_RACE_DATA = {
  race: {
    race: {
      model: { entityId: "r1" },
      name: "Custom Widgets Grand Prix",
      track: {
        model: { entityId: "t1" },
        name: "The Heights Speed Circuit",
        lanes: [
          { objectId: "l1", length: 10 },
          { objectId: "l2", length: 10 },
          { objectId: "l3", length: 10 },
        ],
      },
    },
    drivers: [
      {
        objectId: "rp1",
        driver: {
          model: { entityId: "d1" },
          name: "Sports Mode",
          nickname: "Sports Mode",
        },
        bestLapTime: 3.154,
        averageLapTime: 3.643,
        totalTime: 25.5,
        totalLaps: 7,
        rank: 1,
        rankValue: 7,
        gapLeader: 0,
        gapPosition: 0,
      },
      {
        objectId: "rp2",
        driver: {
          model: { entityId: "d2" },
          name: "Bad Cheese",
          nickname: "Bad Cheese",
        },
        bestLapTime: 3.258,
        averageLapTime: 3.871,
        totalTime: 27.1,
        totalLaps: 7,
        rank: 2,
        rankValue: 7,
        gapLeader: 1.6,
        gapPosition: 1.6,
      },
      {
        objectId: "rp3",
        driver: {
          model: { entityId: "d3" },
          name: "Bank Farter",
          nickname: "The Girls",
        },
        bestLapTime: 3.754,
        averageLapTime: 4.967,
        totalTime: 29.8,
        totalLaps: 6,
        rank: 3,
        rankValue: 6,
        gapLeader: 4.3,
        gapPosition: 2.7,
      },
      {
        objectId: "rp4",
        driver: {
          model: { entityId: "d4" },
          name: "Dead",
          nickname: "Dead",
        },
        bestLapTime: 3.82,
        averageLapTime: 5.2,
        totalTime: 31.2,
        totalLaps: 6,
        rank: 4,
        rankValue: 6,
        gapLeader: 5.7,
        gapPosition: 1.4,
      },
      {
        objectId: "rp5",
        driver: {
          model: { entityId: "d5" },
          name: "Moron",
          nickname: "Moron",
        },
        bestLapTime: 3.91,
        averageLapTime: 5.4,
        totalTime: 32.4,
        totalLaps: 6,
        rank: 5,
        rankValue: 6,
        gapLeader: 6.9,
        gapPosition: 1.2,
      },
    ],
    currentHeat: {
      objectId: "h1",
      heatNumber: 1,
      heatDrivers: [
        {
          objectId: "hd1",
          driver: {
            objectId: "rp1",
            driver: {
              model: { entityId: "d1" },
              name: "Sports Mode",
              nickname: "Sports Mode",
            },
            bestLapTime: 3.154,
            averageLapTime: 3.643,
            totalTime: 25.5,
            totalLaps: 7,
            rank: 1,
          },
          laps: [{ lapTime: 3.82 }, { lapTime: 3.65 }],
          bestLapTime: 3.154,
          averageLapTime: 3.643,
          adjustedLapCount: 7,
          gapLeader: 0,
          gapPosition: 0,
          laneIndex: 0,
        },
        {
          objectId: "hd2",
          driver: {
            objectId: "rp2",
            driver: {
              model: { entityId: "d2" },
              name: "Bad Cheese",
              nickname: "Bad Cheese",
            },
            bestLapTime: 3.258,
            averageLapTime: 3.871,
            totalTime: 27.1,
            totalLaps: 7,
            rank: 2,
          },
          laps: [{ lapTime: 3.55 }, { lapTime: 3.258 }],
          bestLapTime: 3.258,
          averageLapTime: 3.871,
          adjustedLapCount: 7,
          gapLeader: 1.6,
          gapPosition: 1.6,
          laneIndex: 1,
        },
        {
          objectId: "hd3",
          driver: {
            objectId: "rp3",
            driver: {
              model: { entityId: "d3" },
              name: "Bank Farter",
              nickname: "The Girls",
            },
            bestLapTime: 3.754,
            averageLapTime: 4.967,
            totalTime: 29.8,
            totalLaps: 6,
            rank: 3,
          },
          laps: [{ lapTime: 3.754 }],
          bestLapTime: 3.754,
          averageLapTime: 4.967,
          adjustedLapCount: 6,
          gapLeader: 4.3,
          gapPosition: 2.7,
          laneIndex: 2,
        },
      ],
    },
    heats: [
      {
        objectId: "h1",
        heatNumber: 1,
        heatDrivers: [
          {
            objectId: "hd1",
            driver: {
              objectId: "rp1",
              driver: {
                model: { entityId: "d1" },
                name: "Sports Mode",
                nickname: "Sports Mode",
              },
              bestLapTime: 3.154,
              totalLaps: 7,
              rank: 1,
            },
            laps: [{ lapTime: 3.65 }],
            bestLapTime: 3.154,
            laneIndex: 0,
          },
          {
            objectId: "hd2",
            driver: {
              objectId: "rp2",
              driver: {
                model: { entityId: "d2" },
                name: "Bad Cheese",
                nickname: "Bad Cheese",
              },
              bestLapTime: 3.258,
              totalLaps: 7,
              rank: 2,
            },
            laps: [{ lapTime: 3.258 }],
            bestLapTime: 3.258,
            laneIndex: 1,
          },
        ],
      },
    ],
  },
  overallStandingsUpdate: {
    participants: [
      {
        objectId: "rp1",
        driver: {
          model: { entityId: "d1" },
          name: "Sports Mode",
          nickname: "Sports Mode",
        },
        bestLapTime: 3.154,
        averageLapTime: 3.643,
        totalTime: 25.5,
        totalLaps: 7,
        rank: 1,
        rankValue: 7,
        gapLeader: 0,
        gapPosition: 0,
      },
      {
        objectId: "rp2",
        driver: {
          model: { entityId: "d2" },
          name: "Bad Cheese",
          nickname: "Bad Cheese",
        },
        bestLapTime: 3.258,
        averageLapTime: 3.871,
        totalTime: 27.1,
        totalLaps: 7,
        rank: 2,
        rankValue: 7,
        gapLeader: 1.6,
        gapPosition: 1.6,
      },
      {
        objectId: "rp3",
        driver: {
          model: { entityId: "d3" },
          name: "Bank Farter",
          nickname: "The Girls",
        },
        bestLapTime: 3.754,
        averageLapTime: 4.967,
        totalTime: 29.8,
        totalLaps: 6,
        rank: 3,
        rankValue: 6,
        gapLeader: 4.3,
        gapPosition: 2.7,
      },
      {
        objectId: "rp4",
        driver: {
          model: { entityId: "d4" },
          name: "Dead",
          nickname: "Dead",
        },
        bestLapTime: 3.82,
        averageLapTime: 5.2,
        totalTime: 31.2,
        totalLaps: 6,
        rank: 4,
        rankValue: 6,
        gapLeader: 5.7,
        gapPosition: 1.4,
      },
      {
        objectId: "rp5",
        driver: {
          model: { entityId: "d5" },
          name: "Moron",
          nickname: "Moron",
        },
        bestLapTime: 3.91,
        averageLapTime: 5.4,
        totalTime: 32.4,
        totalLaps: 6,
        rank: 5,
        rankValue: 6,
        gapLeader: 6.9,
        gapPosition: 1.2,
      },
    ],
  },
};

test.describe("Custom Widgets Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.setupCustomWidgets(page, SAMPLE_WIDGET_FILES);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
  });

  test("should render sample-telemetry-gauge custom widget", async ({
    page,
  }) => {
    await TestSetupHelper.setupSettings(page, {
      racedayLayout: {
        baseWidth: 1600,
        baseHeight: 900,
        widgets: [
          {
            id: "w1",
            widgetType: "custom:sample-telemetry-gauge",
            x: 50,
            y: 50,
            width: 420,
            height: 260,
            zIndex: 1,
            scaleMode: "auto",
            customSettings: {
              unitLabel: "MPH",
              showMaxSpeed: true,
              dialColor: "#38bdf8",
              warningThreshold: 80,
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

    await page.locator(".dashboard-wrapper").waitFor();
    await TestSetupHelper.mockRaceData(page, MOCK_RACE_DATA);

    const widget = page.locator(".telemetry-gauge-card");
    await widget.waitFor({ state: "visible" });

    await expect(page).toHaveScreenshot("custom-widget-telemetry-gauge.png");
  });

  test("should render sample-lap-delta custom widget", async ({ page }) => {
    await TestSetupHelper.setupSettings(page, {
      racedayLayout: {
        baseWidth: 1600,
        baseHeight: 900,
        widgets: [
          {
            id: "w2",
            widgetType: "custom:sample-lap-delta",
            x: 50,
            y: 50,
            width: 380,
            height: 220,
            zIndex: 1,
            scaleMode: "auto",
            customSettings: {
              showMilliseconds: true,
              positiveColor: "#22c55e",
              negativeColor: "#ef4444",
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

    await page.locator(".dashboard-wrapper").waitFor();
    await TestSetupHelper.mockRaceData(page, MOCK_RACE_DATA);

    const widget = page.locator(".lap-delta-card");
    await widget.waitFor({ state: "visible" });

    await expect(page).toHaveScreenshot("custom-widget-lap-delta.png");
  });

  test("should render sample-sponsor-banner custom widget", async ({
    page,
  }) => {
    await TestSetupHelper.setupSettings(page, {
      racedayLayout: {
        baseWidth: 1600,
        baseHeight: 900,
        widgets: [
          {
            id: "w3",
            widgetType: "custom:sample-sponsor-banner",
            x: 50,
            y: 50,
            width: 900,
            height: 60,
            zIndex: 1,
            scaleMode: "auto",
            customSettings: {
              accentColor: "#f59e0b",
              sponsorText: "Official Event Sponsor • Precision Slot Car Racing",
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

    await page.locator(".dashboard-wrapper").waitFor();
    await TestSetupHelper.mockRaceData(page, MOCK_RACE_DATA);

    const widget = page.locator(".sponsor-banner-card");
    await widget.waitFor({ state: "visible" });

    await expect(page).toHaveScreenshot("custom-widget-sponsor-banner.png");
  });

  test("should render sample-detailed-leaderboard custom widget", async ({
    page,
  }) => {
    await TestSetupHelper.setupSettings(page, {
      racedayLayout: {
        baseWidth: 1600,
        baseHeight: 900,
        widgets: [
          {
            id: "w4",
            widgetType: "custom:sample-detailed-leaderboard",
            x: 50,
            y: 50,
            width: 620,
            height: 420,
            zIndex: 1,
            scaleMode: "auto",
            customSettings: {
              title: "Race Standings",
              maxRows: 10,
              avgLapColor: "#f59e0b",
              showGap: true,
              showAvgLap: true,
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

    await page.locator(".dashboard-wrapper").waitFor();
    await TestSetupHelper.mockRaceData(page, MOCK_RACE_DATA);

    const widget = page.locator(".detailed-leaderboard-container");
    await widget.waitFor({ state: "visible" });

    await expect(page).toHaveScreenshot(
      "custom-widget-detailed-leaderboard.png",
    );
  });

  test("should render all sample custom widgets in composite layout", async ({
    page,
  }) => {
    await TestSetupHelper.setupSettings(page, {
      racedayLayout: {
        baseWidth: 1600,
        baseHeight: 900,
        widgets: [
          {
            id: "w-sponsor",
            widgetType: "custom:sample-sponsor-banner",
            x: 50,
            y: 40,
            width: 900,
            height: 60,
            zIndex: 1,
            scaleMode: "auto",
            customSettings: {
              accentColor: "#f59e0b",
              sponsorText: "Official Event Sponsor • Precision Slot Car Racing",
            },
          },
          {
            id: "w-telemetry",
            widgetType: "custom:sample-telemetry-gauge",
            x: 50,
            y: 120,
            width: 440,
            height: 260,
            zIndex: 1,
            scaleMode: "auto",
            customSettings: {
              unitLabel: "MPH",
              showMaxSpeed: true,
              dialColor: "#38bdf8",
              warningThreshold: 80,
            },
          },
          {
            id: "w-delta",
            widgetType: "custom:sample-lap-delta",
            x: 510,
            y: 120,
            width: 440,
            height: 260,
            zIndex: 1,
            scaleMode: "auto",
            customSettings: {
              showMilliseconds: true,
              positiveColor: "#22c55e",
              negativeColor: "#ef4444",
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

    await page.locator(".dashboard-wrapper").waitFor();
    await TestSetupHelper.mockRaceData(page, MOCK_RACE_DATA);

    const telemetry = page.locator(".telemetry-gauge-card");
    const delta = page.locator(".lap-delta-card");
    const sponsor = page.locator(".sponsor-banner-card");

    await telemetry.waitFor({ state: "visible" });
    await delta.waitFor({ state: "visible" });
    await sponsor.waitFor({ state: "visible" });

    await expect(page).toHaveScreenshot("custom-widgets-composite-layout.png");
  });
});
