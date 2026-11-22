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
        .and.callFake((key: string, params?: any) => {
          if (key === "HL_LANE_TAG" && params) {
            return `L${params.lane}`;
          }
          return key;
        }),
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

  it("should apply custom font sizes even when in auto scale mode", () => {
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
    (component as any).fitText();

    const titleEl = fixture.nativeElement.querySelector(".next-heat-title");
    expect(titleEl).toBeTruthy();
    expect(titleEl.style.fontSize).toBe("30px");

    const itemEl = fixture.nativeElement.querySelector(".next-heat-item");
    expect(itemEl).toBeTruthy();
    expect(itemEl.style.fontSize).toBe("25px");

    const panelEl = fixture.nativeElement.querySelector(".panel-card");
    expect(panelEl.style.getPropertyValue("--custom-lane-size")).toBe("25px");
    expect(panelEl.style.getPropertyValue("--custom-title-size")).toBe("30px");
    expect(panelEl.style.getPropertyValue("--heat-drivers-font-size")).toBe(
      "25px",
    );
    expect(panelEl.style.getPropertyValue("--heat-drivers-title-size")).toBe(
      "30px",
    );
  });

  describe("row depth with a custom lane font size (#1196)", () => {
    const px = (el: HTMLElement, name: string) =>
      parseFloat(el.style.getPropertyValue(name));

    const setupSizedPanel = (customSettings: any) => {
      componentRef.setInput("type", "next-heat");
      componentRef.setInput("currentHeat", { heatNumber: 1, heatDrivers: [] });
      componentRef.setInput("heats", [
        { heatNumber: 1, heatDrivers: [] },
        {
          heatNumber: 2,
          heatDrivers: ["A", "B", "C", "D"].map((name, i) => ({
            driver: { name, isEmpty: () => false },
            laneIndex: i,
          })),
        },
      ]);
      componentRef.setInput("widget", { scaleMode: "auto", customSettings });
      fixture.detectChanges();
      const panelEl = fixture.nativeElement.querySelector(
        ".panel-card",
      ) as HTMLElement;
      panelEl.style.width = "384px";
      panelEl.style.height = "300px";
      (component as any).fitText();
      return panelEl;
    };

    it("keeps the auto-fit row depth and gap when the text is made bigger", () => {
      const auto = setupSizedPanel({});
      const autoSize = px(auto, "--heat-drivers-font-size");
      const autoRow =
        1.1 * autoSize + 2 * px(auto, "--heat-drivers-item-padding-y");
      const autoGap = px(auto, "--heat-drivers-gap");

      const custom = setupSizedPanel({ laneFontSize: autoSize + 4 });
      expect(px(custom, "--heat-drivers-font-size")).toBe(autoSize + 4);
      expect(px(custom, "--heat-drivers-gap")).toBeCloseTo(autoGap, 5);
      const customRow =
        1.1 * (autoSize + 4) + 2 * px(custom, "--heat-drivers-item-padding-y");
      expect(customRow).toBeCloseTo(autoRow, 5);
    });

    it("never lets the row padding drop below 2px", () => {
      const panel = setupSizedPanel({ laneFontSize: 80 });
      expect(px(panel, "--heat-drivers-item-padding-y")).toBe(2);
      expect(px(panel, "--heat-drivers-font-size")).toBe(80);
    });

    it("leaves the spacing unchanged when no custom size is set", () => {
      const panel = setupSizedPanel({});
      const size = px(panel, "--heat-drivers-font-size");
      expect(px(panel, "--heat-drivers-item-padding-y")).toBeCloseTo(
        size * 0.5,
        5,
      );
      expect(px(panel, "--heat-drivers-gap")).toBeCloseTo(size * 0.5, 5);
    });
  });

  it("should apply custom font sizes for on-deck in auto scale mode", () => {
    componentRef.setInput("type", "on-deck");
    componentRef.setInput("currentHeat", { heatNumber: 1, heatDrivers: [] });
    componentRef.setInput("heats", [
      { heatNumber: 1, heatDrivers: [] },
      {
        heatNumber: 2,
        heatDrivers: [
          {
            driver: { name: "B", entity_id: "d2", isEmpty: () => false },
            laneIndex: 0,
          },
        ],
      },
    ]);
    componentRef.setInput("widget", {
      scaleMode: "auto",
      customSettings: {
        titleFontSize: 28,
        laneFontSize: 22,
      },
    });
    fixture.detectChanges();
    (component as any).fitText();

    const titleEl = fixture.nativeElement.querySelector(".on-deck-title");
    expect(titleEl).toBeTruthy();
    expect(titleEl.style.fontSize).toBe("28px");

    const itemEl = fixture.nativeElement.querySelector(".on-deck-item");
    expect(itemEl).toBeTruthy();
    expect(itemEl.style.fontSize).toBe("22px");
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

  it("should apply custom widget background color to panel card", () => {
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
        backgroundColor: "#1e293b",
      },
    });
    fixture.detectChanges();

    const panelEl = fixture.nativeElement.querySelector(".panel-card");
    expect(panelEl.style.backgroundColor).toBe("rgb(30, 41, 59)");
  });

  it("should not set background-color style when backgroundColor is default/empty", () => {
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
        backgroundColor: "",
        alternatingRowContrast: 0,
      },
    });
    fixture.detectChanges();

    const panelEl = fixture.nativeElement.querySelector(".panel-card");
    expect(panelEl.style.backgroundColor).toBeFalsy();
    expect(panelEl.style.getPropertyValue("--row-odd-bg")).toBeFalsy();
  });

  it("should apply alternating row contrast CSS variable on dark background when contrast > 0", () => {
    componentRef.setInput("type", "next-heat");
    componentRef.setInput("currentHeat", { heatNumber: 1, heatDrivers: [] });
    componentRef.setInput("heats", [
      { heatNumber: 1, heatDrivers: [] },
      {
        heatNumber: 2,
        heatDrivers: [
          { driver: { name: "A", isEmpty: () => false }, laneIndex: 0 },
          { driver: { name: "B", isEmpty: () => false }, laneIndex: 1 },
        ],
      },
    ]);
    componentRef.setInput("widget", {
      scaleMode: "fixed",
      customSettings: {
        backgroundColor: "#0f172a",
        alternatingRowContrast: 50,
      },
    });
    fixture.detectChanges();

    const panelEl = fixture.nativeElement.querySelector(".panel-card");
    const rowOddBg = panelEl.style.getPropertyValue("--row-odd-bg");
    expect(rowOddBg).toContain("rgba(255, 255, 255,");
    expect(rowOddBg).toBe("rgba(255, 255, 255, 0.155)");

    const items = panelEl.querySelectorAll(".next-heat-item");
    expect(items.length).toBe(2);
    expect(items[0].classList.contains("row-even")).toBeTrue();
    expect(items[1].classList.contains("row-odd")).toBeTrue();
  });

  it("should apply alternating row contrast CSS variable on light background when contrast > 0", () => {
    componentRef.setInput("type", "next-heat");
    componentRef.setInput("currentHeat", { heatNumber: 1, heatDrivers: [] });
    componentRef.setInput("heats", [
      { heatNumber: 1, heatDrivers: [] },
      {
        heatNumber: 2,
        heatDrivers: [
          { driver: { name: "A", isEmpty: () => false }, laneIndex: 0 },
          { driver: { name: "B", isEmpty: () => false }, laneIndex: 1 },
        ],
      },
    ]);
    componentRef.setInput("widget", {
      scaleMode: "fixed",
      customSettings: {
        backgroundColor: "#ffffff",
        alternatingRowContrast: 80,
      },
    });
    fixture.detectChanges();

    const panelEl = fixture.nativeElement.querySelector(".panel-card");
    const rowOddBg = panelEl.style.getPropertyValue("--row-odd-bg");
    expect(rowOddBg).toContain("rgba(0, 0, 0,");
    expect(rowOddBg).toBe("rgba(0, 0, 0, 0.230)");
  });

  it("should not apply alternating row contrast when type is on-deck", () => {
    componentRef.setInput("type", "on-deck");
    componentRef.setInput("currentHeat", { heatNumber: 1, heatDrivers: [] });
    componentRef.setInput("heats", [
      { heatNumber: 1, heatDrivers: [] },
      { heatNumber: 2, heatDrivers: [] },
      {
        heatNumber: 3,
        heatDrivers: [
          { driver: { name: "A", isEmpty: () => false }, laneIndex: 0 },
          { driver: { name: "B", isEmpty: () => false }, laneIndex: 1 },
        ],
      },
    ]);
    componentRef.setInput("widget", {
      scaleMode: "fixed",
      customSettings: {
        alternatingRowContrast: 60,
      },
    });
    fixture.detectChanges();

    const panelEl = fixture.nativeElement.querySelector(".panel-card");
    expect(panelEl.style.getPropertyValue("--row-odd-bg")).toBeFalsy();
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

  describe("trackByDriver", () => {
    it("should return lane-specific key for assigned driver", () => {
      const hd: any = {
        laneIndex: 0,
        driver: { entity_id: "driver-1", name: "Alice" },
      };
      expect(component.trackByDriver(0, hd)).toBe("0-driver-1");
    });

    it("should return distinct keys for multiple empty lanes", () => {
      const hdLane1: any = {
        laneIndex: 1,
        driver: { entity_id: "EMPTY_LANE", name: "Empty" },
      };
      const hdLane3: any = {
        laneIndex: 3,
        driver: { entity_id: "EMPTY_LANE", name: "Empty" },
      };

      const key1 = component.trackByDriver(1, hdLane1);
      const key3 = component.trackByDriver(3, hdLane3);

      expect(key1).toBe("lane-1");
      expect(key3).toBe("lane-3");
      expect(key1).not.toBe(key3);
    });

    it("should fallback to index when laneIndex is not provided", () => {
      const hd: any = {
        driver: { entity_id: "EMPTY_LANE", name: "Empty" },
      };
      expect(component.trackByDriver(2, hd)).toBe("lane-2");
    });

    it("should handle hd without driver", () => {
      const hd: any = {
        laneIndex: 1,
      };
      expect(component.trackByDriver(1, hd)).toBe("lane-1");
    });

    it("should localize lane badge using HL_LANE_TAG in Dutch (e.g. B1)", () => {
      mockTranslationService.translate.and.callFake(
        (key: string, params?: any) => {
          if (key === "HL_LANE_TAG" && params) {
            return `B${params.lane}`;
          }
          return key;
        },
      );
      componentRef.setInput("type", "next-heat");
      componentRef.setInput("currentHeat", { heatNumber: 1, heatDrivers: [] });
      componentRef.setInput("heats", [
        { heatNumber: 1, heatDrivers: [] },
        {
          heatNumber: 2,
          heatDrivers: [
            { driver: { name: "Speedy", isEmpty: () => false }, laneIndex: 0 },
          ],
        },
      ]);
      fixture.detectChanges();
      const badgeEl = fixture.nativeElement.querySelector(".lane-badge");
      expect(badgeEl).toBeTruthy();
      expect(badgeEl.textContent.trim()).toBe("B1");
    });
  });

  it("should calculate correct font size so all 4 lanes fit without overflow in auto scale mode", (done) => {
    const hostEl = fixture.nativeElement as HTMLElement;
    hostEl.style.display = "block";
    hostEl.style.width = "384px";
    hostEl.style.height = "239px";

    const mockTrack = {
      entity_id: "t1",
      name: "Southwater",
      lanes: [
        {
          lane_number: 1,
          background_color: "#ffff00",
          foreground_color: "#000000",
        },
        {
          lane_number: 2,
          background_color: "#00ffff",
          foreground_color: "#000000",
        },
        {
          lane_number: 3,
          background_color: "#ff69b4",
          foreground_color: "#000000",
        },
        {
          lane_number: 4,
          background_color: "#00ff00",
          foreground_color: "#000000",
        },
      ],
    };

    componentRef.setInput("type", "next-heat");
    componentRef.setInput("track", mockTrack as any);
    componentRef.setInput("currentHeat", { heatNumber: 1, heatDrivers: [] });
    componentRef.setInput("heats", [
      { heatNumber: 1, heatDrivers: [] },
      {
        heatNumber: 2,
        heatDrivers: [
          {
            driver: { name: "Peter", nickname: "Peter", isEmpty: () => false },
            laneIndex: 0,
          },
          {
            driver: { name: "Nick", nickname: "Nick", isEmpty: () => false },
            laneIndex: 1,
          },
          {
            driver: { name: "Ben", nickname: "Ben", isEmpty: () => false },
            laneIndex: 2,
          },
          {
            driver: { name: "Oscar", nickname: "Oscar", isEmpty: () => false },
            laneIndex: 3,
          },
        ],
      },
    ]);
    componentRef.setInput("widget", {
      scaleMode: "auto",
      textScaleFactor: 1,
      customSettings: {},
    });
    fixture.detectChanges();

    setTimeout(() => {
      const panelEl = fixture.nativeElement.querySelector(
        ".panel-card",
      ) as HTMLElement;
      expect(panelEl).toBeTruthy();
      const listEl = panelEl.querySelector(".next-heat-list") as HTMLElement;
      expect(listEl).toBeTruthy();

      const items = panelEl.querySelectorAll(".next-heat-item");
      expect(items.length).toBe(4);

      expect(listEl.scrollHeight).toBeLessThanOrEqual(listEl.clientHeight + 1);
      done();
    }, 50);
  });

  it("should calculate correct font size so stacked team lanes fit without overflow in auto scale mode", (done) => {
    const hostEl = fixture.nativeElement as HTMLElement;
    hostEl.style.display = "block";
    hostEl.style.width = "384px";
    hostEl.style.height = "239px";

    const mockTrack = {
      entity_id: "t1",
      name: "4-Lane Track",
      lanes: [
        {
          lane_number: 1,
          background_color: "#ffff00",
          foreground_color: "#000000",
        },
        {
          lane_number: 2,
          background_color: "#00ffff",
          foreground_color: "#000000",
        },
        {
          lane_number: 3,
          background_color: "#ff69b4",
          foreground_color: "#000000",
        },
        {
          lane_number: 4,
          background_color: "#00ff00",
          foreground_color: "#000000",
        },
      ],
    };

    const mockParent = {
      isEmptyDriver: (_hd: any) => false,
      isTeam: (_hd: any) => true,
      authService: { currentRole: "VIEWER" },
      Role: { VIEWER: "VIEWER" },
      getTeammates: (_hd: any) => [],
      getDropdownIcon: () => "",
      getDriverStats: () => "",
      onNextHeatTeammateChange: jasmine.createSpy("onNextHeatTeammateChange"),
    };

    componentRef.setInput("parent", mockParent as any);
    componentRef.setInput("type", "next-heat");
    componentRef.setInput("track", mockTrack as any);
    componentRef.setInput("currentHeat", { heatNumber: 1, heatDrivers: [] });
    componentRef.setInput("heats", [
      { heatNumber: 1, heatDrivers: [] },
      {
        heatNumber: 2,
        heatDrivers: [
          {
            driver: {
              name: "Mario",
              nickname: "Mario",
              team: { name: "Mushroom Kingdom" },
              isEmpty: () => false,
            },
            participant: { team: { name: "Mushroom Kingdom" } },
            laneIndex: 0,
          },
          {
            driver: {
              name: "Luigi",
              nickname: "Luigi",
              team: { name: "Mushroom Kingdom" },
              isEmpty: () => false,
            },
            participant: { team: { name: "Mushroom Kingdom" } },
            laneIndex: 1,
          },
          {
            driver: {
              name: "Bowser",
              nickname: "Bowser",
              team: { name: "Koopa Troop" },
              isEmpty: () => false,
            },
            participant: { team: { name: "Koopa Troop" } },
            laneIndex: 2,
          },
          {
            driver: {
              name: "Peach",
              nickname: "Peach",
              team: { name: "Mushroom Kingdom" },
              isEmpty: () => false,
            },
            participant: { team: { name: "Mushroom Kingdom" } },
            laneIndex: 3,
          },
        ],
      },
    ]);
    componentRef.setInput("widget", {
      scaleMode: "auto",
      textScaleFactor: 1,
      customSettings: {},
    });
    fixture.detectChanges();

    setTimeout(() => {
      const panelEl = fixture.nativeElement.querySelector(
        ".panel-card",
      ) as HTMLElement;
      expect(panelEl).toBeTruthy();
      const listEl = panelEl.querySelector(".next-heat-list") as HTMLElement;
      expect(listEl).toBeTruthy();

      const items = panelEl.querySelectorAll(".next-heat-item");
      expect(items.length).toBe(4);

      expect(listEl.scrollHeight).toBeLessThanOrEqual(listEl.clientHeight + 1);
      done();
    }, 50);
  });

  describe("title and row style options (#1213)", () => {
    function render(customSettings: any, type = "next-heat") {
      componentRef.setInput("type", type);
      componentRef.setInput("currentHeat", { heatNumber: 1, heatDrivers: [] });
      componentRef.setInput("heats", [
        { heatNumber: 1, heatDrivers: [] },
        {
          heatNumber: 2,
          heatDrivers: [
            { driver: { name: "A", isEmpty: () => false }, laneIndex: 0 },
            { driver: { name: "B", isEmpty: () => false }, laneIndex: 1 },
          ],
        },
      ]);
      componentRef.setInput("widget", { scaleMode: "fixed", customSettings });
      fixture.detectChanges();
      return fixture.nativeElement.querySelector(".panel-card") as HTMLElement;
    }

    it("keeps the title glow and capitals by default", () => {
      const title = render({}).querySelector(".next-heat-title")!;
      expect(title.classList).not.toContain("no-title-glow");
      expect(title.classList).not.toContain("title-as-typed");
      expect(getComputedStyle(title).textTransform).toBe("uppercase");
      expect(getComputedStyle(title).textShadow).not.toBe("none");
    });

    it("can switch off the title glow and capitals", () => {
      const title = render({
        titleGlow: false,
        titleUppercase: false,
      }).querySelector(".next-heat-title")!;
      expect(getComputedStyle(title).textTransform).toBe("none");
      expect(getComputedStyle(title).textShadow).toBe("none");
    });

    it("applies the title options to On Deck too", () => {
      const title = render({ titleUppercase: false }, "on-deck").querySelector(
        ".on-deck-title",
      )!;
      expect(getComputedStyle(title).textTransform).toBe("none");
    });

    it("keeps the row shading by default on a light background", () => {
      const panel = render({ backgroundColor: "#ffffff" });
      expect(panel.style.getPropertyValue("--row-bg")).toBe(
        "rgba(0, 0, 0, 0.03)",
      );
      expect(panel.style.getPropertyValue("--row-odd-bg")).toBe(
        "rgba(0, 0, 0, 0.03)",
      );
    });

    it("shows plain rows with row shading off and no contrast", () => {
      const panel = render({ backgroundColor: "#ffffff", rowShading: false });
      expect(panel.style.getPropertyValue("--row-bg")).toBe("transparent");
      expect(panel.style.getPropertyValue("--row-odd-bg")).toBe("transparent");
      const rows = panel.querySelectorAll(".next-heat-item");
      expect(getComputedStyle(rows[0]).backgroundColor).toBe(
        "rgba(0, 0, 0, 0)",
      );
      expect(getComputedStyle(rows[1]).backgroundColor).toBe(
        "rgba(0, 0, 0, 0)",
      );
    });

    it("still shades alternate rows when contrast is set without row shading", () => {
      const panel = render({
        backgroundColor: "#ffffff",
        rowShading: false,
        alternatingRowContrast: 80,
      });
      expect(panel.style.getPropertyValue("--row-bg")).toBe("transparent");
      expect(panel.style.getPropertyValue("--row-odd-bg")).toBe(
        "rgba(0, 0, 0, 0.230)",
      );
    });
  });
});
