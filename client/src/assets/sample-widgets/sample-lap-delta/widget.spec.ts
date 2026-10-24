import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DataService } from "@app/data.service";
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

import { LapDeltaComponent } from "./widget";

describe("LapDeltaComponent (sample-lap-delta)", () => {
  let component: LapDeltaComponent;
  let fixture: ComponentFixture<LapDeltaComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [LapDeltaComponent],
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

    fixture = TestBed.createComponent(LapDeltaComponent);
    component = fixture.componentInstance;
  });

  it("should be created", () => {
    expect(component).toBeTruthy();
  });

  describe("deltaSeconds and deltaFormatted", () => {
    it("should return null and placeholder when no driver standings exist", () => {
      spyOnProperty(component, "driverStandings", "get").and.returnValue([]);
      expect(component.deltaSeconds).toBeNull();
      expect(component.deltaFormatted).toBe("--.---");
    });

    it("should return null and placeholder when only leader exists", () => {
      spyOnProperty(component, "driverStandings", "get").and.returnValue([
        { bestLapTime: 5.2 },
      ]);
      expect(component.deltaSeconds).toBeNull();
      expect(component.deltaFormatted).toBe("--.---");
    });

    it("should return null and placeholder when bestLapTimes are zero or missing", () => {
      spyOnProperty(component, "driverStandings", "get").and.returnValue([
        { bestLapTime: 0 },
        { bestLapTime: 0 },
      ]);
      expect(component.deltaSeconds).toBeNull();
      expect(component.deltaFormatted).toBe("--.---");
    });

    it("should return +0.000s when delta is exactly 0 and data exists", () => {
      spyOnProperty(component, "driverStandings", "get").and.returnValue([
        { bestLapTime: 5.123 },
        { bestLapTime: 5.123 },
      ]);
      expect(component.deltaSeconds).toBe(0);
      expect(component.deltaFormatted).toBe("+0.000s");
    });

    it("should return +0.000s when delta is tiny (< 0.001) and data exists", () => {
      spyOnProperty(component, "driverStandings", "get").and.returnValue([
        { bestLapTime: 5.1234 },
        { bestLapTime: 5.1235 },
      ]);
      expect(component.deltaFormatted).toBe("+0.000s");
    });

    it("should return positive delta formatted correctly", () => {
      spyOnProperty(component, "driverStandings", "get").and.returnValue([
        { bestLapTime: 5.0 },
        { bestLapTime: 5.25 },
      ]);
      expect(component.deltaSeconds).toBeCloseTo(0.25, 4);
      expect(component.deltaFormatted).toBe("+0.250s");
    });

    it("should return negative delta formatted correctly", () => {
      spyOnProperty(component, "driverStandings", "get").and.returnValue([
        { bestLapTime: 5.5 },
        { bestLapTime: 5.2 },
      ]);
      expect(component.deltaSeconds).toBeCloseTo(-0.3, 4);
      expect(component.deltaFormatted).toBe("-0.300s");
    });

    it("should respect showMilliseconds setting", () => {
      spyOn(component, "getSetting").and.callFake((key: string, def: any) => {
        if (key === "showMilliseconds") return false;
        return def;
      });

      const standingsProp = spyOnProperty(
        component,
        "driverStandings",
        "get",
      ).and.returnValue([]);
      expect(component.deltaFormatted).toBe("--.--");

      standingsProp.and.returnValue([
        { bestLapTime: 5.123 },
        { bestLapTime: 5.123 },
      ]);
      expect(component.deltaFormatted).toBe("+0.00s");
    });
  });

  describe("formatTime and deltaColor", () => {
    it("should format time correctly", () => {
      expect(component.formatTime(null)).toBe("--.---");
      expect(component.formatTime(0)).toBe("--.---");
      expect(component.formatTime(5.4321)).toBe("5.432s");
    });

    it("should return correct delta colors", () => {
      const standingsProp = spyOnProperty(
        component,
        "driverStandings",
        "get",
      ).and.returnValue([]);
      expect(component.deltaColor).toBe("#94a3b8");

      standingsProp.and.returnValue([
        { bestLapTime: 5.0 },
        { bestLapTime: 5.5 },
      ]);
      expect(component.deltaColor).toBe("#22c55e");

      standingsProp.and.returnValue([
        { bestLapTime: 5.5 },
        { bestLapTime: 5.0 },
      ]);
      expect(component.deltaColor).toBe("#ef4444");
    });
  });
});
