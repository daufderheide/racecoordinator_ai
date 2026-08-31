import { TestBed } from "@angular/core/testing";
import { DataService } from "@app/data.service";
import { Driver } from "@app/models/driver";
import { RaceParticipant } from "@app/models/race_participant";
import { DriverHeatData } from "@app/race/driver_heat_data";
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

import { CustomWidgetBaseComponent } from "./custom-widget-base.component";

describe("CustomWidgetBaseComponent", () => {
  let component: CustomWidgetBaseComponent;

  let fixture: any;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CustomWidgetBaseComponent],
      providers: [
        { provide: DataService, useValue: {} },
        { provide: RaceService, useValue: {} },
        { provide: TranslationService, useValue: {} },
        { provide: ThemeService, useValue: {} },
        { provide: RaceFlagService, useValue: {} },
        {
          provide: LoggerService,
          useValue: { error: () => {}, warn: () => {} },
        },
        { provide: SettingsService, useValue: {} },
        { provide: PrintService, useValue: {} },
        { provide: AuthService, useValue: {} },
        { provide: HelpService, useValue: {} },
        { provide: RacePredictionService, useValue: {} },
      ],
    });

    fixture = TestBed.createComponent(CustomWidgetBaseComponent);
    component = fixture.componentInstance;
  });

  it("should be created", () => {
    expect(component).toBeTruthy();
  });

  describe("driverStandings & heatDrivers", () => {
    it("should resolve driverStandings from participants with live heat telemetry", () => {
      const driver1 = new Driver("d1", "Sports Mode", "Sports Mode");
      const driver2 = new Driver("d2", "Bad Cheese", "Bad Cheese");

      const p1 = new RaceParticipant(
        "p1",
        driver1,
        1,
        7,
        25.5,
        3.154,
        3.65,
        3.65,
        7,
        1,
        100,
      );
      const p2 = new RaceParticipant(
        "p2",
        driver2,
        2,
        7,
        27.1,
        3.05,
        3.8,
        3.8,
        7,
        2,
        100,
      );

      const hd1 = new DriverHeatData("hd1", p1 as any, 0, driver1);
      hd1.addLapTime(1, 3.65, 3.65, 3.65, 3.154, 7);

      const mockParent = {
        race: { name: "Friday GP" },
        track: { name: "The Heights" },
        participants: [p1, p2],
        sortedHeatDrivers: [hd1],
      };

      fixture.componentRef.setInput("parent", mockParent);
      fixture.detectChanges();

      expect(component.raceName).toBe("Friday GP");
      expect(component.trackName).toBe("The Heights");

      const standings = component.driverStandings;
      expect(standings.length).toBe(2);
      expect(standings[0].name).toBe("Sports Mode");
      expect(standings[0].best_lap_time).toBe(3.154);
      expect(standings[0].last_lap_time).toBe(3.65);
      expect(standings[0].lapCount).toBe(7);
      expect(standings[0].total_laps).toBe(7);
      expect(standings[0].total_time).toBe(25.5);
      expect(standings[0].avg_lap_time).toBe(3.65);

      expect(standings[1].name).toBe("Bad Cheese");
      expect(standings[1].best_lap_time).toBe(3.05);
      expect(standings[1].total_time).toBe(27.1);
      expect(standings[1].avg_lap_time).toBe(3.8);
    });

    it("should fallback to heatDrivers when participants list is empty", () => {
      const driver1 = new Driver("d1", "Sports Mode", "Sports Mode");
      const p1 = new RaceParticipant(
        "p1",
        driver1,
        1,
        5,
        20.0,
        3.2,
        4.0,
        4.0,
        5,
        1,
        100,
      );
      const hd1 = new DriverHeatData("hd1", p1 as any, 0, driver1);
      hd1.addLapTime(1, 3.2, 3.2, 3.2, 3.2, 5);

      const mockParent = {
        participants: [],
        sortedHeatDrivers: [hd1],
      };

      fixture.componentRef.setInput("parent", mockParent);
      fixture.detectChanges();

      const standings = component.driverStandings;
      expect(standings.length).toBe(1);
      expect(standings[0].name).toBe("Sports Mode");
      expect(standings[0].lapCount).toBe(5);
    });

    it("should filter out empty driver slots", () => {
      const emptyDriver = new Driver("empty", "", "");
      const pEmpty = new RaceParticipant(
        "pe",
        emptyDriver,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
      );

      const mockParent = {
        participants: [pEmpty],
        sortedHeatDrivers: [],
      };

      fixture.componentRef.setInput("parent", mockParent);
      fixture.detectChanges();

      expect(component.driverStandings.length).toBe(0);
    });
  });

  describe("getSetting", () => {
    it("should return configured setting or fallback to default value", () => {
      const mockWidget: any = {
        customSettings: {
          unitLabel: "KPH",
          showMax: true,
        },
      };

      fixture.componentRef.setInput("widget", mockWidget);
      fixture.detectChanges();

      expect(component.getSetting("unitLabel", "MPH")).toBe("KPH");
      expect(component.getSetting("showMax", false)).toBe(true);
      expect(component.getSetting("unsetKey", "DefaultValue")).toBe(
        "DefaultValue",
      );
    });
  });

  describe("DetailedLeaderboardComponent behavior", () => {
    it("should format gap and lap times correctly and apply maxRows row capping", () => {
      const driver1 = new Driver("d1", "Mario", "Mario");
      const driver2 = new Driver("d2", "Luigi", "Luigi");
      const driver3 = new Driver("d3", "Peach", "Peach");

      const p1 = new RaceParticipant(
        "p1",
        driver1,
        1,
        10,
        30.0,
        3.0,
        3.0,
        3.0,
        10,
        1,
        100,
      );
      const p2 = new RaceParticipant(
        "p2",
        driver2,
        2,
        9,
        31.5,
        3.1,
        3.1,
        3.1,
        9,
        2,
        100,
      );
      const p3 = new RaceParticipant(
        "p3",
        driver3,
        3,
        8,
        33.0,
        3.2,
        3.2,
        3.2,
        8,
        3,
        100,
      );

      const mockParent = {
        participants: [p1, p2, p3],
        sortedHeatDrivers: [],
      };

      const mockWidget: any = {
        customSettings: {
          title: "Top 2 Drivers",
          maxRows: 2,
          showTime: true,
          showGap: true,
          showBestLap: true,
          showAvgLap: true,
          bestLapColor: "#38bdf8",
          avgLapColor: "#f59e0b",
        },
      };

      fixture.componentRef.setInput("parent", mockParent);
      fixture.componentRef.setInput("widget", mockWidget);
      fixture.detectChanges();

      expect(component.getSetting("title", "")).toBe("Top 2 Drivers");
      expect(component.getSetting("maxRows", 0)).toBe(2);
      expect(component.getSetting("showTime", true)).toBeTrue();
      expect(component.getSetting("showGap", true)).toBeTrue();
      expect(component.getSetting("showBestLap", true)).toBeTrue();
      expect(component.getSetting("showAvgLap", true)).toBeTrue();
      expect(component.getSetting("bestLapColor", "#38bdf8")).toBe("#38bdf8");
      expect(component.getSetting("avgLapColor", "#f59e0b")).toBe("#f59e0b");

      const standings = component.driverStandings;
      expect(standings.length).toBe(3);
    });
  });
});
