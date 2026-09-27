import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { ComponentRef } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TranslationService } from "@app/services/translation.service";

import { RacedayHeatDriversComponent } from "./raceday-heat-drivers.component";
import { RacedayHeatDriversHarness } from "./testing/raceday-heat-drivers.harness";

describe("RacedayHeatDriversComponent", () => {
  let component: RacedayHeatDriversComponent;
  let componentRef: ComponentRef<RacedayHeatDriversComponent>;
  let fixture: ComponentFixture<RacedayHeatDriversComponent>;
  let harness: RacedayHeatDriversHarness;
  let mockTranslationService: any;

  beforeEach(async () => {
    mockTranslationService = {
      translate: jasmine
        .createSpy("translate")
        .and.callFake((key: string) => key),
    };

    await TestBed.configureTestingModule({
      imports: [RacedayHeatDriversComponent],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    }).compileComponents();

    const mockParent = {
      isEmptyDriver: (hd: any) => hd?.driver?.isEmpty?.() ?? false,
      isTeam: (_hd: any) => false,
    };

    fixture = TestBed.createComponent(RacedayHeatDriversComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    componentRef.setInput("parent", mockParent as any);
    harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      RacedayHeatDriversHarness,
    );
  });

  it("should create", async () => {
    expect(component).toBeTruthy();
    expect(await harness.isVisible()).toBeTrue();
  });

  it("should calculate correct number of drivers for next heat", async () => {
    componentRef.setInput("type", "next-heat");
    componentRef.setInput("currentHeat", { heatNumber: 1, heatDrivers: [] });
    componentRef.setInput("heats", [
      { heatNumber: 1, heatDrivers: [] },
      {
        heatNumber: 2,
        heatDrivers: [
          { driver: { name: "A", isEmpty: () => false }, laneIndex: 0 },
          { driver: { name: "B", isEmpty: () => false }, laneIndex: 1 },
          { driver: { isEmpty: () => true }, laneIndex: 2 },
        ],
      },
    ]);
    fixture.detectChanges();
    expect(component.drivers().length).toBe(3); // Should not filter empty for next heat
    expect(await harness.getDriverCount()).toBe(3);
    expect(await harness.getTitle()).toBe("RD_WIN_NEXT_HEAT");
  });

  it("should calculate correct number of drivers for on-deck", async () => {
    componentRef.setInput("type", "on-deck");
    componentRef.setInput("currentHeat", {
      heatNumber: 1,
      heatDrivers: [
        {
          driver: { entity_id: "d1", name: "A", isEmpty: () => false },
          laneIndex: 0,
        },
      ],
    });
    componentRef.setInput("heats", [
      {
        heatNumber: 1,
        heatDrivers: [
          {
            driver: { entity_id: "d1", name: "A", isEmpty: () => false },
            laneIndex: 0,
          },
        ],
      },
      {
        heatNumber: 2,
        heatDrivers: [
          {
            driver: { entity_id: "d1", name: "A", isEmpty: () => false },
            laneIndex: 0,
          },
          {
            driver: { entity_id: "d2", name: "B", isEmpty: () => false },
            laneIndex: 1,
          },
          { driver: { isEmpty: () => true }, laneIndex: 2 },
        ],
      },
    ]);
    fixture.detectChanges();

    // For on-deck, it filters out empty and current drivers
    const drivers = component.drivers();
    expect(drivers.length).toBe(1);
    expect(drivers[0].driver.entity_id).toBe("d2");
    expect(await harness.getDriverCount()).toBe(1);
    expect(await harness.getTitle()).toBe("RD_WIN_ON_DECK");
    expect(await harness.getDriverName(0)).toBe("B");
  });

  it("should apply custom font sizes when in fixed scale mode", () => {
    componentRef.setInput("type", "next-heat");
    componentRef.setInput("currentHeat", { heatNumber: 1, heatDrivers: [] });
    componentRef.setInput("heats", [
      { heatNumber: 1, heatDrivers: [] },
      {
        heatNumber: 2,
        heatDrivers: [{ driver: { name: "A", isEmpty: () => false } }],
      },
    ]);
    componentRef.setInput("widget", {
      scaleMode: "fixed",
      customSettings: {
        titleFontSize: 30,
        laneFontSize: 25,
      },
    });
    fixture.detectChanges();

    const titleEl = fixture.nativeElement.querySelector(".next-heat-title");
    expect(titleEl).toBeTruthy();
    expect(titleEl.style.fontSize).toBe("30px");

    const itemEl = fixture.nativeElement.querySelector(".next-heat-item");
    expect(itemEl).toBeTruthy();
    expect(itemEl.style.fontSize).toBe("25px");
  });

  it("should NOT apply custom font sizes when in auto scale mode", () => {
    componentRef.setInput("type", "next-heat");
    componentRef.setInput("currentHeat", { heatNumber: 1, heatDrivers: [] });
    componentRef.setInput("heats", [
      { heatNumber: 1, heatDrivers: [] },
      {
        heatNumber: 2,
        heatDrivers: [{ driver: { name: "A", isEmpty: () => false } }],
      },
    ]);
    componentRef.setInput("widget", {
      scaleMode: "auto",
      customSettings: {
        titleFontSize: 30,
        laneFontSize: 25,
      },
    });
    fixture.detectChanges();

    const itemEl = fixture.nativeElement.querySelector(".next-heat-item");
    expect(itemEl).toBeTruthy();
    expect(itemEl.style.fontSize).toBeFalsy();
  });

  it("should set custom lane size and title size custom properties when in fixed scale mode", () => {
    componentRef.setInput("type", "next-heat");
    componentRef.setInput("currentHeat", { heatNumber: 1, heatDrivers: [] });
    componentRef.setInput("heats", [
      { heatNumber: 1, heatDrivers: [] },
      {
        heatNumber: 2,
        heatDrivers: [
          { driver: { name: "A", isEmpty: () => false }, laneIndex: 0 },
        ],
      },
    ]);
    componentRef.setInput("widget", {
      scaleMode: "fixed",
      customSettings: {
        titleFontSize: 28,
        laneFontSize: 14,
      },
    });
    fixture.detectChanges();

    const panelEl = fixture.nativeElement.querySelector(".panel-card");
    expect(panelEl.style.getPropertyValue("--custom-lane-size")).toBe("14px");
    expect(panelEl.style.getPropertyValue("--custom-title-size")).toBe("28px");

    const badgeEl = fixture.nativeElement.querySelector(".lane-badge");
    expect(badgeEl).toBeTruthy();
    expect(badgeEl.textContent.trim()).toBe("L1");
  });

  it("should render teammate select and open dropdown with options when team is active", () => {
    const mockParent = {
      isEmptyDriver: (_hd: any) => false,
      isTeam: (_hd: any) => true,
      authService: { currentRole: "ADMIN" },
      Role: { VIEWER: "VIEWER" },
      getTeammates: (_hd: any) => [
        { entity_id: "d1", name: "Driver 1", nickname: "Rocket" },
        { entity_id: "d2", name: "Driver 2", nickname: "Chuck" },
      ],
      getDriverStats: (_hd: any, _id: string) => " (Heat: 0 Laps)",
      getDropdownIcon: () => 'url("data:image/svg+xml;utf8,<svg></svg>")',
      onNextHeatTeammateChange: jasmine.createSpy("onNextHeatTeammateChange"),
    };

    componentRef.setInput("parent", mockParent as any);
    componentRef.setInput("type", "next-heat");
    componentRef.setInput("currentHeat", { heatNumber: 1, heatDrivers: [] });
    componentRef.setInput("heats", [
      { heatNumber: 1, heatDrivers: [] },
      {
        heatNumber: 2,
        heatDrivers: [
          {
            driver: { entity_id: "d1", name: "Driver 1", nickname: "Rocket" },
            laneIndex: 0,
            participant: { team: { name: "Team 1" } },
          },
        ],
      },
    ]);
    fixture.detectChanges();

    const nameEl = fixture.nativeElement.querySelector(
      ".teammate-display-name",
    ) as HTMLElement;
    expect(nameEl).toBeTruthy();
    expect(nameEl.style.backgroundImage).toContain("url(");

    const selectEl = fixture.nativeElement.querySelector(
      "app-custom-select.teammate-select",
    ) as HTMLElement;
    expect(selectEl).toBeTruthy();
    expect(selectEl.style.backgroundImage).toBeFalsy();

    const trigger = selectEl.querySelector(
      ".custom-select-trigger",
    ) as HTMLElement;
    trigger.click();
    fixture.detectChanges();

    expect(selectEl.classList.contains("open")).toBeTrue();
    const options = selectEl.querySelectorAll(".custom-select-option");
    expect(options.length).toBe(2);
    expect(options[0].textContent).toContain("Rocket");
    expect(options[1].textContent).toContain("Chuck");

    (options[1] as HTMLElement).click();
    fixture.detectChanges();
    expect(mockParent.onNextHeatTeammateChange).toHaveBeenCalled();
  });
});
