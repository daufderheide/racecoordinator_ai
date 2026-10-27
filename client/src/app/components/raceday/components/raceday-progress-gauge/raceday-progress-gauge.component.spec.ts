import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FinishMethod } from "@app/models/heat_scoring";
import { DriverHeatData } from "@app/race/driver_heat_data";

import { RacedayProgressGaugeComponent } from "./raceday-progress-gauge.component";

describe("RacedayProgressGaugeComponent", () => {
  let component: RacedayProgressGaugeComponent;
  let fixture: ComponentFixture<RacedayProgressGaugeComponent>;

  let mockDriver: DriverHeatData;
  let mockParent: any;

  beforeEach(async () => {
    mockDriver = new DriverHeatData(
      "d1",
      {
        objectId: "p1",
        fuelLevel: 75,
      } as any,
      0,
      {
        entity_id: "e1",
        name: "Driver 1",
      } as any,
    );
    spyOnProperty(mockDriver, "lapCount", "get").and.returnValue(10);

    mockParent = {
      heatDrivers: [mockDriver],
      driverData: mockDriver,
      laneIndex: 0,
      activeLaneIndex: 0,
      finishValue: 20,
      finishMethod: FinishMethod.Lap,
      time: 15,
      foregroundColor: "#ff0000",
      race: {
        heat_scoring: {
          finishValue: 20,
          finishMethod: FinishMethod.Lap,
        },
      },
    };

    await TestBed.configureTestingModule({
      imports: [RacedayProgressGaugeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RacedayProgressGaugeComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    fixture.componentRef.setInput("parent", mockParent);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe("Heat Progress Mode", () => {
    it("should calculate percentage and label for lap-based race", () => {
      fixture.componentRef.setInput("parent", mockParent);
      fixture.componentRef.setInput("gaugeType", "heat-progress");
      fixture.detectChanges();

      // 10 laps / 20 finishValue = 50%
      expect(component.percentage).toBe(50);
      expect(component.labelText).toBe("10"); // 20 - 10 laps remaining
    });

    it("should calculate percentage and label for timed race", () => {
      mockParent.finishMethod = FinishMethod.Timed;
      mockParent.finishValue = 30;
      mockParent.time = 15;

      fixture.componentRef.setInput("parent", mockParent);
      fixture.componentRef.setInput("gaugeType", "heat-progress");
      fixture.detectChanges();

      // 15s / 30s = 50%
      expect(component.percentage).toBe(50);
      expect(component.labelText).toBe("15");
    });

    it("should format timed race using mm_ss format and subsecond decimals", () => {
      mockParent.finishMethod = FinishMethod.Timed;
      mockParent.finishValue = 120;
      mockParent.time = 69.544;

      const widget = {
        id: "w1",
        widgetType: "progress-gauge",
        customSettings: {
          gaugeType: "heat-progress",
          timeDisplayFormat: "mm_ss",
          timeSubsecondMode: "always",
          timeSubsecondDecimals: 2,
        },
      } as any;

      fixture.componentRef.setInput("parent", mockParent);
      fixture.componentRef.setInput("widget", widget);
      fixture.detectChanges();

      // time = 69.544 -> formatted as mm_ss with 2 decimals is "01:09.54"
      expect(component.labelText).toBe("01:09.54");
    });

    it("should format lap-based race with configured lapDecimalPlaces", () => {
      const driverWithFractionalLaps = new DriverHeatData(
        "d-fractional",
        { objectId: "p-fractional" } as any,
        0,
        { entity_id: "e-fractional", name: "Driver Fractional" } as any,
      );
      spyOnProperty(
        driverWithFractionalLaps,
        "lapCount",
        "get",
      ).and.returnValue(10.35);

      mockParent.heatDrivers = [driverWithFractionalLaps];
      mockParent.driverData = driverWithFractionalLaps;

      const widget = {
        id: "w1",
        widgetType: "progress-gauge",
        customSettings: {
          gaugeType: "heat-progress",
          lapDecimalPlaces: 2,
        },
      } as any;

      fixture.componentRef.setInput("parent", mockParent);
      fixture.componentRef.setInput("widget", widget);
      fixture.detectChanges();

      // 20 - 10.35 = 9.65
      expect(component.labelText).toBe("9.65");
    });

    it("should round fractional laps when lapDecimalPlaces is 0", () => {
      const driverWithFractionalLaps = new DriverHeatData(
        "d-fractional-round",
        { objectId: "p-fractional-round" } as any,
        0,
        {
          entity_id: "e-fractional-round",
          name: "Driver Fractional Round",
        } as any,
      );
      spyOnProperty(
        driverWithFractionalLaps,
        "lapCount",
        "get",
      ).and.returnValue(10.7);

      mockParent.heatDrivers = [driverWithFractionalLaps];
      mockParent.driverData = driverWithFractionalLaps;

      const widget = {
        id: "w1",
        widgetType: "progress-gauge",
        customSettings: {
          gaugeType: "heat-progress",
          lapDecimalPlaces: 0,
        },
      } as any;

      fixture.componentRef.setInput("parent", mockParent);
      fixture.componentRef.setInput("widget", widget);
      fixture.detectChanges();

      // 20 - 10.7 = 9.3 -> toFixed(0) is "9"
      expect(component.labelText).toBe("9");
    });

    it("should return 0 percentage and -- label when driver is empty", () => {
      mockParent.isEmptyDriver = true;
      fixture.componentRef.setInput("parent", mockParent);
      fixture.componentRef.setInput("gaugeType", "heat-progress");
      fixture.detectChanges();

      expect(component.percentage).toBe(0);
      expect(component.labelText).toBe("--");
    });
  });

  describe("Fuel Mode", () => {
    it("should calculate fuel percentage from participant fuelLevel", () => {
      fixture.componentRef.setInput("parent", mockParent);
      fixture.componentRef.setInput("gaugeType", "fuel");
      fixture.detectChanges();

      expect(component.percentage).toBe(75);
      expect(component.labelText).toBe("75%");
    });

    it("should fallback to initialFuelLevel if participant fuelLevel is undefined", () => {
      (mockDriver as any).participant = {} as any;
      mockDriver.initialFuelLevel = 60;

      fixture.componentRef.setInput("parent", mockParent);
      fixture.componentRef.setInput("gaugeType", "fuel");
      fixture.detectChanges();

      expect(component.percentage).toBe(60);
      expect(component.labelText).toBe("60%");
    });

    it("should return 0% and --% when driver is empty", () => {
      mockParent.isEmptyDriver = true;
      fixture.componentRef.setInput("parent", mockParent);
      fixture.componentRef.setInput("gaugeType", "fuel");
      fixture.detectChanges();

      expect(component.percentage).toBe(0);
      expect(component.labelText).toBe("--%");
    });
  });

  describe("Binding Modes", () => {
    it("should resolve driver via hostDriver mode", () => {
      const driver2 = new DriverHeatData("d2", { objectId: "p2" } as any, 1, {
        entity_id: "e2",
        name: "Driver 2",
      } as any);
      spyOnProperty(driver2, "lapCount", "get").and.returnValue(18);
      mockParent.heatDrivers = [mockDriver, driver2];
      mockParent.activeDriverId = "d2";

      fixture.componentRef.setInput("parent", mockParent);
      fixture.componentRef.setInput("bindingMode", "hostDriver");
      fixture.componentRef.setInput("gaugeType", "heat-progress");
      fixture.detectChanges();

      expect(component.targetDriver?.objectId).toBe("d2");
      // 18 / 20 = 90%
      expect(component.percentage).toBe(90);
    });

    it("should resolve driver via standard lane mode", () => {
      const driver2 = new DriverHeatData("d2", { objectId: "p2" } as any, 1, {
        entity_id: "e2",
        name: "Driver 2",
      } as any);
      spyOnProperty(driver2, "lapCount", "get").and.returnValue(5);
      mockParent.heatDrivers = [mockDriver, driver2];

      fixture.componentRef.setInput("parent", mockParent);
      fixture.componentRef.setInput("bindingMode", "lane");
      fixture.componentRef.setInput("targetIndex", 1);
      fixture.componentRef.setInput("gaugeType", "heat-progress");
      fixture.detectChanges();

      expect(component.targetDriver?.objectId).toBe("d2");
      // 5 / 20 = 25%
      expect(component.percentage).toBe(25);
    });
  });

  describe("Styling & Options", () => {
    it("should render fill height for vertical orientation", () => {
      fixture.componentRef.setInput("parent", mockParent);
      fixture.componentRef.setInput("orientation", "vertical");
      fixture.detectChanges();

      const fillEl = fixture.nativeElement.querySelector(".thermometer-fill");
      expect(fillEl).toBeTruthy();
      expect(fillEl.style.height).toBe("50%");
    });

    it("should render fill width for horizontal orientation", () => {
      fixture.componentRef.setInput("parent", mockParent);
      fixture.componentRef.setInput("orientation", "horizontal");
      fixture.detectChanges();

      const fillEl = fixture.nativeElement.querySelector(".thermometer-fill");
      expect(fillEl).toBeTruthy();
      expect(fillEl.style.width).toBe("50%");
    });

    it("should support widget customSettings", () => {
      const widget = {
        id: "w1",
        widgetType: "progress-gauge",
        customSettings: {
          gaugeType: "fuel",
          gaugeStyle: "bar",
          orientation: "horizontal",
          fillColor: "#00ff00",
          textColor: "#ffff00",
          showLabel: false,
        },
      } as any;

      fixture.componentRef.setInput("parent", mockParent);
      fixture.componentRef.setInput("widget", widget);
      fixture.detectChanges();

      expect(component.effectiveGaugeType).toBe("fuel");
      expect(component.effectiveGaugeStyle).toBe("bar");
      expect(component.effectiveOrientation).toBe("horizontal");
      expect(component.effectiveFillColor).toBe("#00ff00");
      expect(component.effectiveForegroundColor).toBe("#ffff00");
      expect(component.showLabel).toBeFalse();

      const labelEl = fixture.nativeElement.querySelector(".thermometer-label");
      expect(labelEl).toBeNull();
    });

    it("should fall back to parent activeLaneForegroundColor when fillColor and textColor are absent", () => {
      mockParent.activeLaneForegroundColor = "#000000";
      const widget = {
        id: "gauge-ds",
        widgetType: "progress-gauge",
        customSettings: {
          gaugeType: "heat-progress",
          gaugeStyle: "thermometer",
          bindingMode: "hostLane",
        },
      } as any;

      fixture.componentRef.setInput("parent", mockParent);
      fixture.componentRef.setInput("widget", widget);
      fixture.detectChanges();

      expect(component.effectiveFillColor).toBe("#000000");
      expect(component.effectiveForegroundColor).toBe("#000000");
    });

    it("should resolve effectiveFontSize and effectiveFontFamily from customSettings", () => {
      const widget = {
        id: "w1",
        widgetType: "progress-gauge",
        customSettings: {
          fontSize: 16,
          fontFamily: "Orbitron",
        },
      } as any;

      fixture.componentRef.setInput("parent", mockParent);
      fixture.componentRef.setInput("widget", widget);
      fixture.detectChanges();

      expect(component.effectiveFontSize).toBe(16);
      expect(component.effectiveFontFamily).toBe("Orbitron");
    });
  });

  describe("Highlighting on Lap", () => {
    it("should return true for isHighlighted when targetDriver.objectId is in parent.highlightedDrivers", () => {
      mockParent.highlightedDrivers = new Set(["d1"]);
      fixture.componentRef.setInput("parent", mockParent);
      fixture.detectChanges();

      expect(component.isHighlighted).toBeTrue();
    });

    it("should return true for isHighlighted when participant.objectId is in parent.highlightedDrivers", () => {
      mockParent.highlightedDrivers = new Set(["p1"]);
      fixture.componentRef.setInput("parent", mockParent);
      fixture.detectChanges();

      expect(component.isHighlighted).toBeTrue();
    });

    it("should return true on driver station when hostDriver is in highlightedDrivers", () => {
      mockParent.isDriverStation = true;
      mockParent.activeLaneIndex = 0;
      mockParent.highlightedDrivers = new Set(["d1"]);
      fixture.componentRef.setInput("parent", mockParent);
      fixture.detectChanges();

      expect(component.isHighlighted).toBeTrue();
    });

    it("should return false for isHighlighted when driver is not in parent.highlightedDrivers", () => {
      mockParent.highlightedDrivers = new Set(["other-driver"]);
      fixture.componentRef.setInput("parent", mockParent);
      fixture.detectChanges();

      expect(component.isHighlighted).toBeFalse();
    });

    it("should return false for isHighlighted when highlightRowOnLap is false", () => {
      mockParent.highlightedDrivers = new Set(["d1"]);
      const widget = {
        id: "w1",
        widgetType: "progress-gauge",
        customSettings: {
          highlightRowOnLap: false,
        },
      } as any;
      fixture.componentRef.setInput("parent", mockParent);
      fixture.componentRef.setInput("widget", widget);
      fixture.detectChanges();

      expect(component.isHighlighted).toBeFalse();
    });

    it("should return false for isHighlighted when highlightLapStyle is none", () => {
      mockParent.highlightedDrivers = new Set(["d1"]);
      const widget = {
        id: "w1",
        widgetType: "progress-gauge",
        customSettings: {
          highlightLapStyle: "none",
        },
      } as any;
      fixture.componentRef.setInput("parent", mockParent);
      fixture.componentRef.setInput("widget", widget);
      fixture.detectChanges();

      expect(component.isHighlighted).toBeFalse();
    });

    it("should resolve highlightLapStyle from customSettings or fallback to parent or classic", () => {
      const widgetWithStyle = {
        id: "w1",
        widgetType: "progress-gauge",
        customSettings: {
          highlightLapStyle: "glow-border",
        },
      } as any;
      fixture.componentRef.setInput("widget", widgetWithStyle);
      fixture.detectChanges();
      expect(component.highlightLapStyle).toBe("glow-border");

      mockParent.highlightLapStyle = "scale-pulse";
      const widgetFallback = {
        id: "w2",
        widgetType: "progress-gauge",
        customSettings: {},
      } as any;
      fixture.componentRef.setInput("parent", mockParent);
      fixture.componentRef.setInput("widget", widgetFallback);
      fixture.detectChanges();
      expect(component.highlightLapStyle).toBe("scale-pulse");

      mockParent.isDriverStation = true;
      mockParent.highlightLapStyle = undefined;
      fixture.componentRef.setInput("parent", mockParent);
      fixture.detectChanges();
      expect(component.highlightLapStyle).toBe("full-glow");
    });

    it("should apply highlight CSS classes to DOM container", () => {
      mockParent.highlightedDrivers = new Set(["d1"]);
      mockParent.highlightLapStyle = "shimmer";
      fixture.componentRef.setInput("parent", mockParent);
      fixture.detectChanges();

      const containerEl = fixture.nativeElement.querySelector(
        ".progress-gauge-container",
      );
      expect(containerEl.classList.contains("highlight")).toBeTrue();
      expect(
        containerEl.classList.contains("highlight-style-shimmer"),
      ).toBeTrue();
    });

    it("should correctly determine isLightBackground", () => {
      const widgetLight = {
        id: "w1",
        widgetType: "progress-gauge",
        customSettings: {
          fillColor: "#ffffff",
        },
      } as any;
      fixture.componentRef.setInput("widget", widgetLight);
      fixture.detectChanges();
      expect(component.isLightBackground).toBeTrue();

      const widgetDark = {
        id: "w2",
        widgetType: "progress-gauge",
        customSettings: {
          fillColor: "#000000",
        },
      } as any;
      fixture.componentRef.setInput("widget", widgetDark);
      fixture.detectChanges();
      expect(component.isLightBackground).toBeFalse();
    });
  });
});
