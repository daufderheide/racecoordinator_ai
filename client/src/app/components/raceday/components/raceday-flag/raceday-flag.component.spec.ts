import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { RaceFlagService } from "@app/services/race-flag.service";

import { RacedayFlagComponent } from "./raceday-flag.component";
import { RacedayFlagHarness } from "./testing/raceday-flag.harness";

describe("RacedayFlagComponent", () => {
  let component: RacedayFlagComponent;
  let fixture: ComponentFixture<RacedayFlagComponent>;
  let harness: RacedayFlagHarness;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RacedayFlagComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RacedayFlagComponent);
    component = fixture.componentInstance;
    harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      RacedayFlagHarness,
    );
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should display flag image URL via harness", async () => {
    fixture.componentRef.setInput(
      "currentFlagUrl",
      "assets/images/flags/green.png",
    );
    fixture.detectChanges();

    expect(await harness.getFlagUrl()).toBe("assets/images/flags/green.png");
  });

  it("should fallback to RaceFlagService when currentFlagUrl input is empty", async () => {
    const mockRaceFlagService = {
      getCurrentFlagUrl: jasmine
        .createSpy("getCurrentFlagUrl")
        .and.returnValue("assets/flags/fallback.png"),
      currentFlagUrl$: of("assets/flags/fallback.png"),
    };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [RacedayFlagComponent],
      providers: [{ provide: RaceFlagService, useValue: mockRaceFlagService }],
    }).compileComponents();

    const flagFixture = TestBed.createComponent(RacedayFlagComponent);
    const flagHarness = await TestbedHarnessEnvironment.harnessForFixture(
      flagFixture,
      RacedayFlagHarness,
    );
    flagFixture.detectChanges();

    expect(await flagHarness.getFlagUrl()).toBe("assets/flags/fallback.png");
  });

  it("should render container with panel-card and flag-panel classes", () => {
    const cardEl = fixture.nativeElement.querySelector(
      ".panel-card.flag-panel",
    );
    expect(cardEl).toBeTruthy();
  });

  it("should apply custom background color from customSettings", () => {
    fixture.componentRef.setInput("widget", {
      id: "flag-1",
      widgetType: "flag",
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      zIndex: 1,
      customSettings: {
        backgroundColor: "#112233",
      },
    });
    fixture.detectChanges();

    const cardEl = fixture.nativeElement.querySelector(
      ".panel-card.flag-panel",
    );
    expect(cardEl.style.backgroundColor).toBe("rgb(17, 34, 51)");
  });

  it("should apply custom background color from widget.backgroundColor as fallback", () => {
    fixture.componentRef.setInput("widget", {
      id: "flag-2",
      widgetType: "flag",
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      zIndex: 1,
      backgroundColor: "#445566",
      customSettings: {},
    });
    fixture.detectChanges();

    const cardEl = fixture.nativeElement.querySelector(
      ".panel-card.flag-panel",
    );
    expect(cardEl.style.backgroundColor).toBe("rgb(68, 85, 102)");
  });

  it("should not apply custom background color when displayMode is color-bar only", () => {
    fixture.componentRef.setInput("displayMode", "color-bar");
    fixture.componentRef.setInput("widget", {
      id: "flag-3",
      widgetType: "flag",
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      zIndex: 1,
      customSettings: {
        backgroundColor: "#112233",
      },
    });
    fixture.detectChanges();

    const cardEl = fixture.nativeElement.querySelector(
      ".panel-card.flag-panel",
    );
    expect(cardEl.style.backgroundColor).toBe("");
  });

  it("should recognize light custom background color in isLightBackground", () => {
    fixture.componentRef.setInput("widget", {
      id: "flag-4",
      widgetType: "flag",
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      zIndex: 1,
      customSettings: {
        backgroundColor: "#ffffff",
      },
    });
    fixture.detectChanges();

    expect(component.isLightBackground).toBeTrue();
  });

  it("should render race state indicator when displayMode is color-bar", async () => {
    fixture.componentRef.setInput("displayMode", "color-bar");
    fixture.componentRef.setInput("raceStateColor", "green");
    fixture.detectChanges();

    const indicatorClass = await harness.getRaceStateColorClass();
    expect(indicatorClass).toContain("race-state-green");
    expect(await harness.getFlagUrl()).toBeNull();
  });

  it("should use parent raceStateColor when input is not provided", async () => {
    fixture.componentRef.setInput("displayMode", "color-bar");
    fixture.componentRef.setInput("parent", { raceStateColor: "yellow" });
    fixture.detectChanges();

    const indicatorClass = await harness.getRaceStateColorClass();
    expect(indicatorClass).toContain("race-state-yellow");
  });

  it("should support both displayMode rendering image and indicator", async () => {
    fixture.componentRef.setInput("displayMode", "both");
    fixture.componentRef.setInput("currentFlagUrl", "assets/flags/green.png");
    fixture.componentRef.setInput("raceStateColor", "checkered");
    fixture.detectChanges();

    expect(await harness.getFlagUrl()).toBe("assets/flags/green.png");
    const indicatorClass = await harness.getRaceStateColorClass();
    expect(indicatorClass).toContain("race-state-checkered");
  });

  describe("Highlighting on Lap", () => {
    let mockDriver: any;
    let mockParent: any;

    beforeEach(() => {
      mockDriver = {
        objectId: "d1",
        laneIndex: 0,
        participant: { objectId: "p1" },
      };
      mockParent = {
        heatDrivers: [mockDriver],
        driverData: mockDriver,
        laneIndex: 0,
        activeLaneIndex: 0,
        isDriverStation: true,
        highlightedDrivers: new Set(["d1"]),
        highlightLapStyle: "classic",
      };
    });

    it("should return true for isHighlighted when targetDriver.objectId is in parent.highlightedDrivers", () => {
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

    it("should return false for isHighlighted when driver is not in parent.highlightedDrivers", () => {
      mockParent.highlightedDrivers = new Set(["other-driver"]);
      fixture.componentRef.setInput("parent", mockParent);
      fixture.detectChanges();

      expect(component.isHighlighted).toBeFalse();
    });

    it("should return false for isHighlighted when highlightRowOnLap is false", () => {
      const widget = {
        id: "w1",
        widgetType: "flag",
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
      const widget = {
        id: "w1",
        widgetType: "flag",
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
        widgetType: "flag",
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
        widgetType: "flag",
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

    it("should apply highlight CSS classes to DOM element", () => {
      fixture.componentRef.setInput("parent", mockParent);
      fixture.detectChanges();

      const flagEl = fixture.nativeElement.querySelector(".flag-panel");
      expect(flagEl.classList.contains("highlight")).toBeTrue();
      expect(flagEl.classList.contains("highlight-style-classic")).toBeTrue();
    });

    it("should correctly determine isLightBackground", () => {
      fixture.componentRef.setInput("raceStateColor", "white");
      fixture.detectChanges();
      expect(component.isLightBackground).toBeTrue();

      fixture.componentRef.setInput("raceStateColor", "black");
      fixture.detectChanges();
      expect(component.isLightBackground).toBeFalse();
    });
  });

  it("uses the lane's colour as background when asked and bound to a lane (phase 3c)", () => {
    const driver: any = { laneIndex: 1, objectId: "d2" };
    const parent: any = {
      heatDrivers: [{ laneIndex: 0, objectId: "d1" }, driver],
      getLaneColor: (d: any, p: string) =>
        p === "background_color" && d.laneIndex === 1 ? "#00ff00" : "",
    };
    fixture.componentRef.setInput("parent", parent);
    fixture.componentRef.setInput("widget", {
      id: "w",
      widgetType: "flag",
      x: 0,
      y: 0,
      width: 200,
      height: 100,
      customSettings: { targetIndex: 1, laneColorBackground: true },
    } as any);
    expect(component.effectiveBackgroundColor).toBe("#00ff00");
    fixture.componentRef.setInput("widget", {
      id: "w",
      widgetType: "flag",
      x: 0,
      y: 0,
      width: 200,
      height: 100,
      customSettings: { targetIndex: 1 },
    } as any);
    expect(component.effectiveBackgroundColor).not.toBe("#00ff00");
  });
});
