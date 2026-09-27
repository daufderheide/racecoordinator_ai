import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DataService } from "@app/data.service";
import { Driver } from "@app/models/driver";
import { RaceParticipant } from "@app/models/race_participant";
import { AuthService } from "@app/services/auth.service";
import { HelpService } from "@app/services/help.service";
import { LoggerService } from "@app/services/logger.service";
import { PrintService } from "@app/services/print.service";
import { RaceService } from "@app/services/race.service";
import { RaceFlagService } from "@app/services/race-flag.service";
import { RacePredictionService } from "@app/services/race-prediction.service";
import { SettingsService } from "@app/services/settings.service";
import { ThemeService } from "@app/services/theme.service";
import { TranslationService } from "@app/services/translation.service";

import { DetailedLeaderboardComponent } from "./widget";

describe("DetailedLeaderboardComponent (sample-detailed-leaderboard)", () => {
  let component: DetailedLeaderboardComponent;
  let fixture: ComponentFixture<DetailedLeaderboardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DetailedLeaderboardComponent],
      providers: [
        { provide: DataService, useValue: {} },
        { provide: RaceService, useValue: {} },
        { provide: TranslationService, useValue: {} },
        { provide: ThemeService, useValue: {} },
        { provide: RaceFlagService, useValue: {} },
        {
          provide: LoggerService,
          useValue: { error: () => {}, warn: () => {}, debug: () => {} },
        },
        { provide: SettingsService, useValue: {} },
        { provide: PrintService, useValue: {} },
        { provide: AuthService, useValue: {} },
        { provide: HelpService, useValue: {} },
        { provide: RacePredictionService, useValue: {} },
      ],
    });

    fixture = TestBed.createComponent(DetailedLeaderboardComponent);
    component = fixture.componentInstance;
  });

  it("should be created", () => {
    expect(component).toBeTruthy();
  });

  describe("precision and number formatting", () => {
    it("should format laps to 2 decimal places", () => {
      expect(component.formatLaps(15.823485)).toBe("15.82");
      expect(component.formatLaps(10)).toBe("10.00");
      expect(component.formatLaps(0)).toBe("0.00");
      expect(component.formatLaps(undefined)).toBe("0.00");
      expect(component.formatLaps(null as any)).toBe("0.00");
      expect(component.formatLaps(NaN)).toBe("0.00");
    });

    it("should format total time to 3 decimal places", () => {
      expect(component.formatTotalTime(123.45678)).toBe("123.457");
      expect(component.formatTotalTime(45.1)).toBe("45.100");
      expect(component.formatTotalTime(0)).toBe("0.000");
      expect(component.formatTotalTime(undefined)).toBe("0.000");
      expect(component.formatTotalTime(null as any)).toBe("0.000");
      expect(component.formatTotalTime(NaN)).toBe("0.000");
    });

    it("should format lap times to 3 decimal places or placeholder", () => {
      expect(component.formatLapTime(3.4567)).toBe("3.457");
      expect(component.formatLapTime(4.1)).toBe("4.100");
      expect(component.formatLapTime(0)).toBe("--");
      expect(component.formatLapTime(-1)).toBe("--");
      expect(component.formatLapTime(undefined)).toBe("--");
      expect(component.formatLapTime(null as any)).toBe("--");
    });

    it("should format gap to 3 decimal places", () => {
      // Leader (index 0) returns empty string
      expect(component.formatGap({}, 0, [])).toBe("");

      // Gap position
      expect(
        component.formatGap({ gapPosition: 1.2346 }, 1, [{ totalTime: 10 }]),
      ).toBe("+1.235");
      expect(
        component.formatGap({ gap_position: 1.2346 }, 1, [{ total_time: 10 }]),
      ).toBe("+1.235");
      expect(
        component.formatGap({ gapPosition: -0.5678 }, 1, [{ totalTime: 10 }]),
      ).toBe("-0.568");

      // Gap leader fallback
      expect(
        component.formatGap({ gapLeader: 2.3456 }, 1, [{ totalTime: 10 }]),
      ).toBe("+2.346");
      expect(
        component.formatGap({ gap_leader: 2.3456 }, 1, [{ total_time: 10 }]),
      ).toBe("+2.346");

      // Total time delta fallback
      expect(
        component.formatGap({ totalTime: 15.6789 }, 1, [
          { totalTime: 10.1234 },
        ]),
      ).toBe("+5.556");

      // Zero laps or no data
      expect(component.formatGap({ lapCount: 0, totalLaps: 0 }, 1, [{}])).toBe(
        "--",
      );
    });
  });

  describe("displayRows generation", () => {
    it("should format standings rows with 2 decimal laps and 3 decimal times", () => {
      const driver1 = new Driver("d1", "Speedy", "Speedy");
      const driver2 = new Driver("d2", "Racer", "Racer");

      const p1 = new RaceParticipant(
        "p1",
        driver1,
        1,
        12.3456,
        45.6789,
        3.4567,
        3.7012,
        3.7,
        12.3456,
        1,
        100,
      );

      const p2 = new RaceParticipant(
        "p2",
        driver2,
        2,
        11.8765,
        46.8912,
        3.5678,
        3.9456,
        3.9,
        11.8765,
        2,
        100,
        1.2123,
      );

      spyOnProperty(component, "participants", "get").and.returnValue([p1, p2]);

      const rows = component.displayRows;
      expect(rows.length).toBe(2);

      // Leader
      expect(rows[0].position).toBe(1);
      expect(rows[0].name).toBe("Speedy");
      expect(rows[0].laps).toBe("12.35");
      expect(rows[0].timeFormatted).toBe("45.679");
      expect(rows[0].gapFormatted).toBe("");
      expect(rows[0].bestLapFormatted).toBe("3.457");
      expect(rows[0].avgLapFormatted).toBe("3.701");
      expect(rows[0].isEmpty).toBeFalse();

      // P2
      expect(rows[1].position).toBe(2);
      expect(rows[1].name).toBe("Racer");
      expect(rows[1].laps).toBe("11.88");
      expect(rows[1].timeFormatted).toBe("46.891");
      expect(rows[1].gapFormatted).toBe("+1.212");
      expect(rows[1].bestLapFormatted).toBe("3.568");
      expect(rows[1].avgLapFormatted).toBe("3.946");
      expect(rows[1].isEmpty).toBeFalse();
    });

    it("should fill empty rows up to maxRows", () => {
      const driver1 = new Driver("d1", "Solo", "Solo");
      const p1 = new RaceParticipant(
        "p1",
        driver1,
        1,
        5,
        20,
        4.0,
        4.0,
        4.0,
        5,
        1,
        100,
      );

      spyOnProperty(component, "participants", "get").and.returnValue([p1]);
      spyOn(component, "getSetting").and.callFake((key: string, def: any) => {
        if (key === "maxRows") return 3;
        return def;
      });

      const rows = component.displayRows;
      expect(rows.length).toBe(3);
      expect(rows[0].isEmpty).toBeFalse();
      expect(rows[0].laps).toBe("5.00");
      expect(rows[1].isEmpty).toBeTrue();
      expect(rows[1].position).toBe(2);
      expect(rows[2].isEmpty).toBeTrue();
      expect(rows[2].position).toBe(3);
    });
  });

  describe("custom settings getters", () => {
    it("should read settings with correct defaults", () => {
      expect(component.title).toBe("");
      expect(component.maxRows).toBe(0);
      expect(component.showTime).toBeTrue();
      expect(component.showGap).toBeTrue();
      expect(component.showBestLap).toBeTrue();
      expect(component.showAvgLap).toBeTrue();
      expect(component.bestLapColor).toBe("#38bdf8");
      expect(component.avgLapColor).toBe("#f59e0b");
    });
  });

  describe("configuredColumns & dynamic column customization", () => {
    it("should provide default 5 telemetry columns", () => {
      const cols = component.configuredColumns;
      expect(cols.length).toBe(5);
      expect(cols[0].metric).toBe("totalTime");
      expect(cols[0].header).toBe("Time");
      expect(cols[1].metric).toBe("totalLaps");
      expect(cols[1].header).toBe("Laps");
      expect(cols[2].metric).toBe("gapLeader");
      expect(cols[2].header).toBe("Gap");
      expect(cols[3].metric).toBe("bestLapTime");
      expect(cols[3].header).toBe("Best Lap");
      expect(cols[4].metric).toBe("averageLapTime");
      expect(cols[4].header).toBe("Avg Lap");
    });

    it("should customize columns based on colXMetric settings and hide 'none'", () => {
      spyOn(component, "getSetting").and.callFake((key: string, def: any) => {
        if (key === "col3Metric") return "lane";
        if (key === "col4Metric") return "lastLapTime";
        if (key === "col5Metric") return "medianLapTime";
        if (key === "col6Metric") return "gapPosition";
        if (key === "col7Metric") return "none";
        return def;
      });

      const cols = component.configuredColumns;
      expect(cols.length).toBe(4);
      expect(cols[0].metric).toBe("lane");
      expect(cols[0].header).toBe("Lane");
      expect(cols[0].cssClass).toBe("col-lane");

      expect(cols[1].metric).toBe("lastLapTime");
      expect(cols[1].header).toBe("Last Lap");
      expect(cols[1].cssClass).toBe("col-last");

      expect(cols[2].metric).toBe("medianLapTime");
      expect(cols[2].header).toBe("Median Lap");
      expect(cols[2].cssClass).toBe("col-median");

      expect(cols[3].metric).toBe("gapPosition");
      expect(cols[3].header).toBe("Gap Ahead");
      expect(cols[3].cssClass).toBe("col-gap");
    });

    it("should assign default colors to configured columns", () => {
      const cols = component.configuredColumns;
      expect(cols.length).toBe(5);
      expect(cols[0].color).toBe("#ffffff");
      expect(cols[1].color).toBe("#ffffff");
      expect(cols[2].color).toBe("#ffffff");
      expect(cols[3].color).toBe("#38bdf8");
      expect(cols[4].color).toBe("#f59e0b");
    });

    it("should allow custom colors for each column", () => {
      spyOn(component, "getSetting").and.callFake((key: string, def: any) => {
        if (key === "col3Color") return "#10b981";
        if (key === "col4Color") return "#6366f1";
        if (key === "col5Color") return "#ec4899";
        if (key === "col6Color") return "#eab308";
        if (key === "col7Color") return "#14b8a6";
        return def;
      });

      const cols = component.configuredColumns;
      expect(cols[0].color).toBe("#10b981");
      expect(cols[1].color).toBe("#6366f1");
      expect(cols[2].color).toBe("#ec4899");
      expect(cols[3].color).toBe("#eab308");
      expect(cols[4].color).toBe("#14b8a6");
    });

    it("should format all unified metrics in formatMetric and apply columnColor", () => {
      const mockDriver = {
        name: "Test",
        totalTime: 12.345,
        totalLaps: 4,
        gapLeader: 0.123,
        gapPosition: 0.05,
        bestLapTime: 3.123,
        lastLapTime: 3.25,
        averageLapTime: 3.18,
        medianLapTime: 3.15,
        lane: 2,
      };

      expect(
        component.formatMetric("totalTime", mockDriver, 1, [], "#ffffff").text,
      ).toBe("12.345");
      expect(
        component.formatMetric("totalTime", mockDriver, 1, [], "#ffffff").color,
      ).toBe("#ffffff");
      expect(
        component.formatMetric("totalLaps", mockDriver, 1, [], "#10b981").text,
      ).toBe("4.00");
      expect(
        component.formatMetric("totalLaps", mockDriver, 1, [], "#10b981").color,
      ).toBe("#10b981");
      expect(component.formatMetric("gapLeader", mockDriver, 1, []).text).toBe(
        "+0.123",
      );
      expect(
        component.formatMetric("gapPosition", mockDriver, 1, []).text,
      ).toBe("+0.050");
      expect(
        component.formatMetric("bestLapTime", mockDriver, 1, []).text,
      ).toBe("3.123");
      expect(
        component.formatMetric("bestLapTime", mockDriver, 1, []).color,
      ).toBe("#38bdf8");
      expect(
        component.formatMetric("lastLapTime", mockDriver, 1, []).text,
      ).toBe("3.250");
      expect(
        component.formatMetric("averageLapTime", mockDriver, 1, []).text,
      ).toBe("3.180");
      expect(
        component.formatMetric("averageLapTime", mockDriver, 1, []).color,
      ).toBe("#f59e0b");
      expect(
        component.formatMetric("medianLapTime", mockDriver, 1, []).text,
      ).toBe("3.150");
      expect(component.formatMetric("lane", mockDriver, 1, []).text).toBe("2");
      expect(component.formatMetric("unknown", mockDriver, 1, []).text).toBe(
        "--",
      );
      expect(component.formatMetric("totalTime", null, 0, []).text).toBe("");
    });
  });
});
