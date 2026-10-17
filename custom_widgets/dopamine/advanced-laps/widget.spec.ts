import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AdvancedLapsComponent } from "./widget";
import { DataService } from "@app/data.service";
import { AllowFinish, FinishMethod } from "@app/models/heat_scoring";
import { Race } from "@app/models/race";
import { RaceState } from "@app/proto/antigravity";
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

describe("AdvancedLapsComponent Integration & Requirements Verification", () => {
  let component: AdvancedLapsComponent;
  let fixture: ComponentFixture<AdvancedLapsComponent>;
  let mockParent: any;
  let mockRaceFlagService: any;
  let mockTranslationService: any;

  beforeEach(() => {
    mockParent = {
      raceState: RaceState.NOT_STARTED,
      race: {
        entity_id: "race-1",
        name: "Test Grand Prix",
        heat_scoring: {
          allowFinish: AllowFinish.AF_SINGLE_LAP,
          finishMethod: FinishMethod.Lap,
          finishValue: 10,
        },
      } as Race,
      heat: { id: "heat-1" },
      track: {
        name: "Grand Raceway",
        lanes: [
          { index: 0, color: "#ef4444" },
          { index: 1, color: "#3b82f6" },
        ],
      },
      heatDrivers: [],
      driverStandings: [],
      participants: [],
      onCellClick: jasmine.createSpy("onCellClick"),
    };

    mockRaceFlagService = {
      getFlagType: jasmine.createSpy("getFlagType").and.returnValue("flag.racing"),
    };

    mockTranslationService = {
      translate: jasmine.createSpy("translate").and.callFake((key: string) => {
        if (key === "RD_COL_LAP") return "LAP";
        return key;
      }),
    };

    TestBed.configureTestingModule({
      imports: [AdvancedLapsComponent],
      providers: [
        { provide: DataService, useValue: {} },
        { provide: RaceService, useValue: {} },
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: ThemeService, useValue: {} },
        { provide: RaceFlagService, useValue: mockRaceFlagService },
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

    fixture = TestBed.createComponent(AdvancedLapsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("parent", mockParent);
    fixture.componentRef.setInput("widget", {
      id: "widget-1",
      widgetType: "custom:advanced-laps",
      x: 0,
      y: 0,
      width: 200,
      height: 90,
      customSettings: {},
    });
  });

  it("should create component and apply default settings", () => {
    expect(component).toBeTruthy();
    expect(component.mode).toBe("heat");
    expect(component.decimalPlaces).toBe(2);
    expect(component.hideSegmentsForFinishingDrivers).toBeFalse();
    expect(component.bindingMode).toBe("lane");
    expect(component.targetIndex).toBe(1);
    expect(component.headerLabel).toBe("LAP");
  });

  it("should support insetLapDecimalPlaces when decimalPlaces is omitted", () => {
    fixture.componentRef.setInput("widget", {
      id: "widget-inset",
      widgetType: "custom:advanced-laps",
      customSettings: { insetLapDecimalPlaces: 3 },
    });
    expect(component.decimalPlaces).toBe(3);
  });

  it("should respect explicit 0 decimalPlaces", () => {
    fixture.componentRef.setInput("widget", {
      id: "widget-zero",
      widgetType: "custom:advanced-laps",
      customSettings: { decimalPlaces: 0 },
    });
    expect(component.decimalPlaces).toBe(0);
  });

  describe("Requirement 1: Only show auto-segments when the heat is not racing", () => {
    it("should exclude auto-segments when race state is RACING", () => {
      mockParent.raceState = RaceState.RACING;
      fixture.componentRef.setInput("widget", {
        id: "widget-1",
        widgetType: "custom:advanced-laps",
        customSettings: { decimalPlaces: 2 },
      });

      const driver = {
        name: "Driver 1",
        heatData: {
          lapCount: 15,
          userLaps: 0,
          penaltyLaps: 0,
          autoCalculatedLaps: 0.65,
        },
      };

      const laps = component.getEffectiveLaps(driver);
      expect(laps).toBe(15);
      expect(component.formatLaps(laps, driver)).toBe("15.00");
    });

    it("should include auto-segments when race state is PAUSED", () => {
      mockParent.raceState = RaceState.PAUSED;
      fixture.componentRef.setInput("widget", {
        id: "widget-1",
        widgetType: "custom:advanced-laps",
        customSettings: { decimalPlaces: 2 },
      });

      const driver = {
        name: "Driver 1",
        heatData: {
          lapCount: 15,
          userLaps: 0,
          penaltyLaps: 0,
          autoCalculatedLaps: 0.65,
        },
      };

      const laps = component.getEffectiveLaps(driver);
      expect(laps).toBeCloseTo(15.65, 4);
      expect(component.formatLaps(laps, driver)).toBe("15.65");
    });

    it("should include auto-segments when race state is HEAT_OVER", () => {
      mockParent.raceState = RaceState.HEAT_OVER;
      fixture.componentRef.setInput("widget", {
        id: "widget-1",
        widgetType: "custom:advanced-laps",
        customSettings: { decimalPlaces: 2 },
      });

      const driver = {
        name: "Driver 1",
        heatData: {
          lapCount: 20,
          userLaps: 0,
          penaltyLaps: 0,
          autoCalculatedLaps: 0.82,
        },
      };

      const laps = component.getEffectiveLaps(driver);
      expect(laps).toBeCloseTo(20.82, 4);
      expect(component.formatLaps(laps, driver)).toBe("20.82");
    });

    it("should not double count pause auto-segments when adjustedLapCount already includes autoCalculatedLaps", () => {
      mockParent.raceState = RaceState.PAUSED;
      fixture.componentRef.setInput("widget", {
        id: "widget-1",
        widgetType: "custom:advanced-laps",
        customSettings: { decimalPlaces: 2 },
      });

      const driver = {
        name: "Driver 1",
        heatData: {
          physicalLapCount: 15,
          lapCount: 15.65,
          adjustedLapCount: 15.65,
          userLaps: 0,
          penaltyLaps: 0,
          autoCalculatedLaps: 0.65,
        },
      };

      const laps = component.getEffectiveLaps(driver);
      expect(laps).toBeCloseTo(15.65, 4);
      expect(component.formatLaps(laps, driver)).toBe("15.65");
    });

    it("should not double count auto-segments when heat is HEAT_OVER with DriverHeatData", () => {
      mockParent.raceState = RaceState.HEAT_OVER;
      fixture.componentRef.setInput("widget", {
        id: "widget-1",
        widgetType: "custom:advanced-laps",
        customSettings: { decimalPlaces: 2 },
      });

      const driver = {
        name: "Driver 1",
        heatData: {
          physicalLapCount: 20,
          laps: new Array(20).fill({ lapTime: 10 }),
          lapCount: 20.82,
          adjustedLapCount: 20.82,
          userLaps: 0,
          penaltyLaps: 0,
          autoCalculatedLaps: 0.82,
        },
      };

      const laps = component.getEffectiveLaps(driver);
      expect(laps).toBeCloseTo(20.82, 4);
      expect(component.formatLaps(laps, driver)).toBe("20.82");
    });

    it("should include pause auto-segments in overall mode when paused without double counting", () => {
      mockParent.raceState = RaceState.PAUSED;
      fixture.componentRef.setInput("widget", {
        id: "widget-1",
        widgetType: "custom:advanced-laps",
        customSettings: { mode: "overall", decimalPlaces: 2 },
      });

      const driver = {
        name: "Driver 1",
        participant: {
          totalLaps: 35.45,
        },
        heatData: {
          autoCalculatedLaps: 0.45,
        },
      };

      const laps = component.getEffectiveLaps(driver);
      expect(laps).toBeCloseTo(35.45, 4);
      expect(component.formatLaps(laps, driver)).toBe("35.45");
    });

    it("should exclude pause auto-segments in overall mode when racing", () => {
      mockParent.raceState = RaceState.RACING;
      fixture.componentRef.setInput("widget", {
        id: "widget-1",
        widgetType: "custom:advanced-laps",
        customSettings: { mode: "overall", decimalPlaces: 2 },
      });

      const driver = {
        name: "Driver 1",
        participant: {
          totalLaps: 35.45,
        },
        heatData: {
          autoCalculatedLaps: 0.45,
        },
      };

      const laps = component.getEffectiveLaps(driver);
      expect(laps).toBeCloseTo(35.0, 4);
      expect(component.formatLaps(laps, driver)).toBe("35.00");
    });

    it("should support lapDecimalPlaces from lane column inspector settings", () => {
      mockParent.raceState = RaceState.PAUSED;
      fixture.componentRef.setInput("widget", {
        id: "widget-1",
        widgetType: "custom:advanced-laps",
        customSettings: { lapDecimalPlaces: 3 },
      });

      const driver = {
        name: "Driver 1",
        heatData: {
          lapCount: 15,
          autoCalculatedLaps: 0.654,
        },
      };

      const laps = component.getEffectiveLaps(driver);
      expect(laps).toBeCloseTo(15.654, 4);
      expect(component.formatLaps(laps, driver)).toBe("15.654");
    });

    it("should round to configured decimal places when not racing (e.g. 0, 1, 2, 3)", () => {
      mockParent.raceState = RaceState.PAUSED;
      const driver = {
        name: "Driver 1",
        heatData: {
          lapCount: 15,
          autoCalculatedLaps: 0.654,
        },
      };

      fixture.componentRef.setInput("widget", {
        id: "widget-1",
        widgetType: "custom:advanced-laps",
        customSettings: { decimalPlaces: 0 },
      });
      let laps = component.getEffectiveLaps(driver);
      expect(component.formatLaps(laps, driver)).toBe("16");

      fixture.componentRef.setInput("widget", {
        id: "widget-1",
        widgetType: "custom:advanced-laps",
        customSettings: { decimalPlaces: 1 },
      });
      laps = component.getEffectiveLaps(driver);
      expect(component.formatLaps(laps, driver)).toBe("15.7");

      fixture.componentRef.setInput("widget", {
        id: "widget-1",
        widgetType: "custom:advanced-laps",
        customSettings: { decimalPlaces: 2 },
      });
      laps = component.getEffectiveLaps(driver);
      expect(component.formatLaps(laps, driver)).toBe("15.65");
    });
  });

  describe("Requirement 2: Truncation when racing with 0 decimal places", () => {
    it("should truncate count when racing and decimalPlaces is 0 (0.9999999 does not increment)", () => {
      mockParent.raceState = RaceState.RACING;
      fixture.componentRef.setInput("widget", {
        id: "widget-1",
        widgetType: "custom:advanced-laps",
        customSettings: { decimalPlaces: 0 },
      });

      const driver = {
        name: "Driver 1",
        heatData: {
          lapCount: 10,
          userLaps: 0.9999999,
          penaltyLaps: 0,
          autoCalculatedLaps: 0,
        },
      };

      const laps = component.getEffectiveLaps(driver);
      expect(laps).toBeCloseTo(10.9999999, 5);
      // Math.floor(10.9999999) -> 10, NOT rounded to 11
      expect(component.formatLaps(laps, driver)).toBe("10");
    });

    it("should increment count when racing and 1.0 lap worth of segments is added", () => {
      mockParent.raceState = RaceState.RACING;
      fixture.componentRef.setInput("widget", {
        id: "widget-1",
        widgetType: "custom:advanced-laps",
        customSettings: { decimalPlaces: 0 },
      });

      const driver = {
        name: "Driver 1",
        heatData: {
          lapCount: 10,
          userLaps: 1.0,
          penaltyLaps: 0,
          autoCalculatedLaps: 0,
        },
      };

      const laps = component.getEffectiveLaps(driver);
      expect(laps).toBe(11.0);
      expect(component.formatLaps(laps, driver)).toBe("11");
    });

    it("should format with requested decimal places when decimalPlaces > 0", () => {
      mockParent.raceState = RaceState.RACING;
      fixture.componentRef.setInput("widget", {
        id: "widget-1",
        widgetType: "custom:advanced-laps",
        customSettings: { decimalPlaces: 2 },
      });

      const driver = {
        name: "Driver 1",
        heatData: {
          lapCount: 10,
          userLaps: 0.5,
          penaltyLaps: 0,
          autoCalculatedLaps: 0,
        },
      };

      const laps = component.getEffectiveLaps(driver);
      expect(component.formatLaps(laps, driver)).toBe("10.50");
    });
  });

  describe("Requirement 3: Config option to hide auto-segments on pause during allow finish lap for finishing drivers", () => {
    beforeEach(() => {
      mockParent.raceState = RaceState.PAUSED;
      mockParent.race = {
        entity_id: "race-1",
        heat_scoring: {
          allowFinish: AllowFinish.AF_SINGLE_LAP,
        },
      } as Race;
    });

    it("should hide auto-segments for unfinished driver when hideSegmentsForFinishingDrivers is true", () => {
      mockParent.raceState = RaceState.PAUSED;
      fixture.componentRef.setInput("widget", {
        id: "widget-1",
        widgetType: "custom:advanced-laps",
        customSettings: {
          decimalPlaces: 2,
          hideSegmentsForFinishingDrivers: true,
        },
      });

      const finishedDriver = {
        name: "Finished Driver",
        laneIndex: 0,
        isFinished: true,
        heatData: {
          lapCount: 10,
          autoCalculatedLaps: 0.45,
          isFinished: true,
        },
      };

      const finishingDriver = {
        name: "Still Finishing Driver",
        laneIndex: 1,
        isFinished: false,
        heatData: {
          lapCount: 9,
          autoCalculatedLaps: 0.85,
          isFinished: false,
        },
      };

      mockParent.heatDrivers = [finishedDriver, finishingDriver];

      expect(component.isAllowFinishLap()).toBeTrue();

      // Finished driver DOES show auto-segments
      const finishedLaps = component.getEffectiveLaps(finishedDriver);
      expect(finishedLaps).toBeCloseTo(10.45, 4);
      expect(component.formatLaps(finishedLaps, finishedDriver)).toBe("10.45");

      // Finishing driver does NOT show auto-segments
      const finishingLaps = component.getEffectiveLaps(finishingDriver);
      expect(finishingLaps).toBe(9);
      expect(component.formatLaps(finishingLaps, finishingDriver)).toBe("9.00");
    });

    it("should show auto-segments for all drivers when hideSegmentsForFinishingDrivers is false", () => {
      mockParent.raceState = RaceState.PAUSED;
      fixture.componentRef.setInput("widget", {
        id: "widget-1",
        widgetType: "custom:advanced-laps",
        customSettings: {
          decimalPlaces: 2,
          hideSegmentsForFinishingDrivers: false,
        },
      });

      const finishedDriver = {
        name: "Finished Driver",
        laneIndex: 0,
        isFinished: true,
        heatData: {
          lapCount: 10,
          autoCalculatedLaps: 0.45,
          isFinished: true,
        },
      };

      const finishingDriver = {
        name: "Still Finishing Driver",
        laneIndex: 1,
        isFinished: false,
        heatData: {
          lapCount: 9,
          autoCalculatedLaps: 0.85,
          isFinished: false,
        },
      };

      mockParent.heatDrivers = [finishedDriver, finishingDriver];

      const finishingLaps = component.getEffectiveLaps(finishingDriver);
      expect(finishingLaps).toBeCloseTo(9.85, 4);
      expect(component.formatLaps(finishingLaps, finishingDriver)).toBe("9.85");
    });

    it("should show auto-segments for all drivers during mid-race pause (not allow finish lap)", () => {
      fixture.componentRef.setInput("widget", {
        id: "widget-1",
        widgetType: "custom:advanced-laps",
        customSettings: {
          decimalPlaces: 2,
          hideSegmentsForFinishingDrivers: true,
        },
      });

      const d1 = {
        name: "Driver 1",
        isFinished: false,
        heatData: { lapCount: 3, autoCalculatedLaps: 0.5, isFinished: false },
      };
      const d2 = {
        name: "Driver 2",
        isFinished: false,
        heatData: { lapCount: 3, autoCalculatedLaps: 0.6, isFinished: false },
      };

      mockParent.heatDrivers = [d1, d2];
      expect(component.isAllowFinishLap()).toBeFalse();

      expect(component.getEffectiveLaps(d1)).toBeCloseTo(3.5, 4);
      expect(component.getEffectiveLaps(d2)).toBeCloseTo(3.6, 4);
    });
  });

  describe("Requirement 4: Config option for heat or overall race laps and configurable column label", () => {
    it("should default header label to LAP when customLabel is empty", () => {
      fixture.componentRef.setInput("widget", {
        id: "widget-1",
        widgetType: "custom:advanced-laps",
        customSettings: { mode: "heat", customLabel: "" },
      });

      expect(component.headerLabel).toBe("LAP");
      expect(mockTranslationService.translate).toHaveBeenCalledWith("RD_COL_LAP");
    });

    it("should use customLabel when configured", () => {
      fixture.componentRef.setInput("widget", {
        id: "widget-1",
        widgetType: "custom:advanced-laps",
        customSettings: { mode: "heat", customLabel: "HEAT 2 LAPS" },
      });

      expect(component.headerLabel).toBe("HEAT 2 LAPS");
    });

    it("should read heat laps when mode is heat", () => {
      mockParent.raceState = RaceState.PAUSED;
      fixture.componentRef.setInput("widget", {
        id: "widget-1",
        widgetType: "custom:advanced-laps",
        customSettings: { mode: "heat", decimalPlaces: 0 },
      });

      const driver = {
        name: "Driver 1",
        participant: { totalLaps: 50 },
        heatData: { lapCount: 12, autoCalculatedLaps: 0 },
      };

      expect(component.getEffectiveLaps(driver)).toBe(12);
    });

    it("should read overall race laps when mode is overall", () => {
      mockParent.raceState = RaceState.PAUSED;
      fixture.componentRef.setInput("widget", {
        id: "widget-1",
        widgetType: "custom:advanced-laps",
        customSettings: { mode: "overall", decimalPlaces: 0 },
      });

      const driver = {
        name: "Driver 1",
        participant: { totalLaps: 50 },
        heatData: { lapCount: 12, autoCalculatedLaps: 0 },
      };

      expect(component.getEffectiveLaps(driver)).toBe(50);
    });
  });

  describe("Requirement 5: Driver / Lane binding modes & multi-instance placement", () => {
    it("should resolve target driver by lane index", () => {
      const d1 = {
        laneIndex: 0,
        name: "Lane 1 Driver",
        heatData: { lapCount: 10 },
      };
      const d2 = {
        laneIndex: 1,
        name: "Lane 2 Driver",
        heatData: { lapCount: 14 },
      };
      mockParent.heatDrivers = [d1, d2];

      fixture.componentRef.setInput("widget", {
        id: "widget-lane-2",
        widgetType: "custom:advanced-laps",
        customSettings: { bindingMode: "lane", targetIndex: 2 },
      });

      expect(component.targetDriver).toBe(d2);
      expect(component.formattedTargetValue).toBe("14");
    });

    it("should resolve target driver by heat position rank", () => {
      const d1 = { rank: 1, name: "P1 Driver", heatData: { lapCount: 25 } };
      const d2 = { rank: 2, name: "P2 Driver", heatData: { lapCount: 22 } };
      mockParent.heatDrivers = [d1, d2];

      fixture.componentRef.setInput("widget", {
        id: "widget-pos-1",
        widgetType: "custom:advanced-laps",
        customSettings: { bindingMode: "position", targetIndex: 1 },
      });

      expect(component.targetDriver).toBe(d1);
      expect(component.formattedTargetValue).toBe("25");
    });

    it("should resolve target driver by overall position rank", () => {
      const d1 = { rank: 1, name: "Leader", totalLaps: 100 };
      const d2 = { rank: 2, name: "Second", totalLaps: 95 };
      mockParent.driverStandings = [d1, d2];

      fixture.componentRef.setInput("widget", {
        id: "widget-overall-pos-2",
        widgetType: "custom:advanced-laps",
        customSettings: {
          mode: "overall",
          bindingMode: "overallPosition",
          targetIndex: 2,
        },
      });

      expect(component.targetDriver).toBe(d2);
      expect(component.formattedTargetValue).toBe("95");
    });

    it("should handle empty driver with placeholder --", () => {
      mockParent.heatDrivers = [];
      expect(component.formattedTargetValue).toBe("--");
      expect(component.formatLaps(0, null)).toBe("--");
    });

    it("should trigger onCellClick on parent when clicked during raceday", () => {
      const d1 = {
        laneIndex: 0,
        name: "Lane 1 Driver",
        heatData: { lapCount: 10 },
      };
      mockParent.heatDrivers = [d1];

      fixture.componentRef.setInput("widget", {
        id: "widget-1",
        widgetType: "custom:advanced-laps",
        customSettings: { mode: "heat", bindingMode: "lane", targetIndex: 1 },
      });

      const event = new MouseEvent("click");
      component.onLapClick(event, d1);

      expect(mockParent.onCellClick).toHaveBeenCalledWith(
        d1.heatData,
        { propertyName: "lapCount" },
        event,
      );
    });

    it("should render all active drivers when bindingMode is all", () => {
      const d1 = {
        laneIndex: 0,
        lane: 1,
        name: "Driver One",
        heatData: { lapCount: 10 },
      };
      const d2 = {
        laneIndex: 1,
        lane: 2,
        name: "Driver Two",
        heatData: { lapCount: 12 },
      };
      mockParent.heatDrivers = [d1, d2];

      fixture.componentRef.setInput("widget", {
        id: "widget-all-lanes",
        widgetType: "custom:advanced-laps",
        customSettings: { bindingMode: "all", mode: "heat" },
      });

      expect(component.allDisplayDrivers.length).toBe(2);
      expect(component.getDriverLaneLabel(d1)).toBe("L1");
      expect(component.getDriverLaneLabel(d2)).toBe("L2");
      expect(component.getLaneColor(d1)).toBe("#ef4444");
      expect(component.getLaneColor(d2)).toBe("#3b82f6");
    });

    it("should render as header widget with headerLabel and without card body when isHeaderWidget is true", () => {
      fixture.componentRef.setInput("widget", {
        id: "widget-header",
        widgetType: "custom:advanced-laps",
        customSettings: {
          isHeaderWidget: true,
          customLabel: "Heat Laps",
          headerBackgroundColor: "rgba(10, 20, 30, 0.9)",
        },
      });
      fixture.detectChanges();

      expect(component.isHeaderWidget).toBeTrue();
      expect(component.headerLabel).toBe("Heat Laps");
      expect(component.cardBackgroundColor).toBe("rgba(10, 20, 30, 0.9)");

      const compiled = fixture.nativeElement as HTMLElement;
      const headerOnly = compiled.querySelector(
        ".advanced-laps-header.header-widget-only",
      );
      expect(headerOnly).toBeTruthy();
      expect(headerOnly?.textContent?.trim()).toBe("Heat Laps");
      expect(compiled.querySelector(".advanced-laps-body")).toBeNull();
      expect(compiled.querySelector(".advanced-laps-list")).toBeNull();
    });

    it("should resolve target driver by gridLane across replicated lanes in a grid", () => {
      const d1 = {
        laneIndex: 0,
        lane: 1,
        name: "Mario",
        heatData: { lapCount: 10 },
      };
      const d2 = {
        laneIndex: 1,
        lane: 2,
        name: "Luigi",
        heatData: { lapCount: 12 },
      };
      const d3 = {
        laneIndex: 2,
        lane: 3,
        name: "Bowser",
        heatData: { lapCount: 15 },
      };
      const d4 = {
        laneIndex: 3,
        lane: 4,
        name: "Peach",
        heatData: { lapCount: 11 },
      };
      mockParent.heatDrivers = [d1, d2, d3, d4];

      // Lane 1 Master widget (gridLane 0)
      fixture.componentRef.setInput("widget", {
        id: "widget-master",
        widgetType: "custom:advanced-laps",
        customSettings: {
          gridId: "grid-1",
          gridLane: 0,
          targetIndex: 0,
          bindingMode: "lane",
        },
      });
      expect(component.targetDriver).toBe(d1);
      expect(component.formattedTargetValue).toBe("10");

      // Lane 2 Mirrored widget (gridLane 1)
      fixture.componentRef.setInput("widget", {
        id: "widget-lane-1",
        widgetType: "custom:advanced-laps",
        customSettings: {
          gridId: "grid-1",
          gridLane: 1,
          targetIndex: 1,
          bindingMode: "lane",
        },
      });
      expect(component.targetDriver).toBe(d2);
      expect(component.formattedTargetValue).toBe("12");

      // Lane 3 Mirrored widget (gridLane 2)
      fixture.componentRef.setInput("widget", {
        id: "widget-lane-2",
        widgetType: "custom:advanced-laps",
        customSettings: {
          gridId: "grid-1",
          gridLane: 2,
          targetIndex: 2,
          bindingMode: "lane",
        },
      });
      expect(component.targetDriver).toBe(d3);
      expect(component.formattedTargetValue).toBe("15");

      // Lane 4 Mirrored widget (gridLane 3)
      fixture.componentRef.setInput("widget", {
        id: "widget-lane-3",
        widgetType: "custom:advanced-laps",
        customSettings: {
          gridId: "grid-1",
          gridLane: 3,
          targetIndex: 3,
          bindingMode: "lane",
        },
      });
      expect(component.targetDriver).toBe(d4);
      expect(component.formattedTargetValue).toBe("11");
    });
  });

  describe("Requirement 6: Dynamic Lane Colors Support", () => {
    it("should default useLaneColors to true when omitted", () => {
      fixture.componentRef.setInput("widget", {
        id: "widget-1",
        widgetType: "custom:advanced-laps",
        customSettings: {},
      });
      expect(component.useLaneColors).toBeTrue();
    });

    it("should resolve lane background and foreground colors when useLaneColors is true and driver is assigned", () => {
      const d1 = {
        laneIndex: 0,
        laneNumber: 1,
        name: "Lane 1 Driver",
        heatData: { lapCount: 10 },
      };
      mockParent.heatDrivers = [d1];

      fixture.componentRef.setInput("widget", {
        id: "widget-1",
        widgetType: "custom:advanced-laps",
        customSettings: {
          bindingMode: "lane",
          targetIndex: 1,
          useLaneColors: true,
        },
      });

      expect(component.cardBackgroundColor).toBe("#ef4444");
      expect(component.cardTextColor).toBe("#ffffff");
    });

    it("should resolve lane color by gridLane when targetDriver is not yet loaded", () => {
      mockParent.heatDrivers = [];

      fixture.componentRef.setInput("widget", {
        id: "widget-grid-lane-2",
        widgetType: "custom:advanced-laps",
        customSettings: {
          gridId: "grid-1",
          gridLane: 1,
          targetIndex: 1,
          useLaneColors: true,
        },
      });

      expect(component.cardBackgroundColor).toBe("#3b82f6");
      expect(component.cardTextColor).toBe("#ffffff");
    });

    it("should fall back to custom backgroundColor and textColor when useLaneColors is false", () => {
      fixture.componentRef.setInput("widget", {
        id: "widget-custom-colors",
        widgetType: "custom:advanced-laps",
        customSettings: {
          useLaneColors: false,
          backgroundColor: "#112233",
          textColor: "#44dd88",
        },
      });

      expect(component.useLaneColors).toBeFalse();
      expect(component.cardBackgroundColor).toBe("#112233");
      expect(component.cardTextColor).toBe("#44dd88");
      expect(component.cardBorderColor).toBe("#44dd88");
    });

    it("should use explicit borderColor when provided even if useLaneColors is false", () => {
      fixture.componentRef.setInput("widget", {
        id: "widget-border-color",
        widgetType: "custom:advanced-laps",
        customSettings: {
          useLaneColors: false,
          backgroundColor: "#112233",
          textColor: "#44dd88",
          borderColor: "#ff0099",
        },
      });

      expect(component.cardBorderColor).toBe("#ff0099");
    });
  });
});


