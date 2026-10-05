import { DragDropModule } from "@angular/cdk/drag-drop";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BehaviorSubject } from "rxjs";
import { AnchorPoint } from "@app/components/raceday/column_definition";
import { Role } from "@app/models/role";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { TranslationService } from "@app/services/translation.service";
import { mockTranslationService } from "@app/testing/unit-test-mocks";

import { RacedayLaneViewComponent } from "./raceday-lane-view.component";
import { RacedayLaneViewHarness } from "./testing/raceday-lane-view.harness";

describe("RacedayLaneViewComponent", () => {
  let component: RacedayLaneViewComponent;
  let fixture: ComponentFixture<RacedayLaneViewComponent>;
  let harness: RacedayLaneViewHarness;
  let mockParent: any;
  let roleSubject: BehaviorSubject<Role>;

  beforeEach(async () => {
    mockTranslationService.translate.and.callFake((key: string) => key);
    roleSubject = new BehaviorSubject<Role>(Role.DIRECTOR);

    const teammates = [
      { entity_id: "d1", name: "Alice", nickname: "Rocket" },
      { entity_id: "d2", name: "Charlie", nickname: "Chuck" },
    ];
    const layoutEntriesMap = new Map<string, any[]>();

    mockParent = {
      columns: [
        { labelKey: "RD_COL_DRIVER", propertyName: "driver.nickname" },
        { labelKey: "RD_COL_LAPS", propertyName: "lapCount" },
      ],
      gridTemplateColumns: "150px 100px",
      trackByColumn: (idx: number, col: any) => col.propertyName,
      getColumnLabel: (col: any) => col.labelKey,
      getTableBodyHeight: () => 100,
      sortedHeatDrivers: [
        {
          objectId: "hd1",
          laneIndex: 0,
          isLastLapDrift: false,
          driver: { entity_id: "d1", name: "Alice", nickname: "Rocket" },
          actualDriver: { entity_id: "d1", name: "Alice", nickname: "Rocket" },
          laps: [],
        },
        {
          objectId: "hd2",
          laneIndex: 1,
          isLastLapDrift: true,
          driver: { entity_id: "d2", name: "Bob", nickname: "Drifter" },
          actualDriver: { entity_id: "d2", name: "Bob", nickname: "Drifter" },
          laps: [],
        },
      ],
      onDrop: jasmine.createSpy("onDrop"),
      canSwapLanes: true,
      trackByDriverId: (idx: number, hd: any) => hd.objectId,
      getLaneColor: (hd: any, prop: string) =>
        prop === "background_color" ? "#550000" : "#ffffff",
      isLaneOccupied: (_hd: any) => true,
      onDragStarted: jasmine.createSpy("onDragStarted"),
      onDragEnded: jasmine.createSpy("onDragEnded"),
      isUIEditorMode: () => false,
      onColumnDragOver: jasmine.createSpy("onColumnDragOver"),
      onColumnDragLeave: jasmine.createSpy("onColumnDragLeave"),
      onColumnHeaderRowDrop: jasmine.createSpy("onColumnHeaderRowDrop"),
      onColumnHeaderDrop: jasmine.createSpy("onColumnHeaderDrop"),
      highlightedDrivers: new Set(),
      draggingLane: null,
      onDragOver: jasmine.createSpy("onDragOver"),
      getRowHeight: () => 48,
      getDriverVisualPosition: (hd: any) => hd.laneIndex,
      isDragging: false,
      onCellClick: jasmine.createSpy("onCellClick"),
      isTeamDriverSwapActive: (hd: any, col: any) =>
        col.propertyName === "driver.nickname",
      isLapCountColumnClickable: (hd: any, col: any) =>
        col.propertyName === "lapCount",
      isLapTimeColumn: (col: any) => col.propertyName === "lapCount",
      getLayoutEntries: (col: any) => {
        if (!layoutEntriesMap.has(col.propertyName)) {
          layoutEntriesMap.set(col.propertyName, [
            { anchor: "center-center", property: col.propertyName },
          ]);
        }
        return layoutEntriesMap.get(col.propertyName)!;
      },
      isImageProperty: (_prop: string) => false,
      getAnchorClass: (anchor: string) => "anchor-" + anchor,
      isNameProperty: (prop: string) =>
        prop.startsWith("driver.name") || prop.startsWith("driver.nickname"),
      isTeam: (_hd: any) => true,
      authService: {
        currentRole$: roleSubject.asObservable(),
      },
      Role: Role,
      isDriverSwapDisabled: (_hd: any) => false,
      onTeammateChange: jasmine.createSpy("onTeammateChange"),
      getTeammates: (_hd: any) => teammates,
      getDropdownArrowBg: (_hd: any) =>
        'url("data:image/svg+xml;utf8,<svg></svg>")',
      getDriverStats: (_hd: any, _id: string) => " (Heat: 0 Laps)",
      formatColumnValue: (hd: any, col: any, prop: string) => {
        if (prop === "driver.nickname") return hd.driver.nickname;
        if (prop === "lapCount") return "5";
        return "";
      },
      isEmptyDriver: (hd: any) => hd?.isEmpty === true,
      getLaneRecord: (_hd: any) => 5.2,
      getLaneRecordTime: (hd: any) => (hd.laneIndex === 0 ? "5.200" : "--.---"),
      getLaneRecordHolder: (hd: any) => (hd.laneIndex === 0 ? "Speedy" : "---"),
      getLaneRecordDate: (hd: any) =>
        hd.laneIndex === 0 ? "2026-08-21" : "---",
      getBestRaceLapTime: (hd: any) =>
        hd.laneIndex === 0 ? "4.950" : "--.---",
      getBestRaceLapHolder: (hd: any) => (hd.laneIndex === 0 ? "Flash" : "---"),
      getBestRaceLapHeat: (hd: any) => (hd.laneIndex === 0 ? "Heat 2" : "---"),
      heatBestTime: 4.9,
      trackByLayout: (idx: number, entry: any) => entry.property,
    };

    await TestBed.configureTestingModule({
      imports: [RacedayLaneViewComponent, DragDropModule, TranslatePipe],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RacedayLaneViewComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("parent", mockParent);
    harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      RacedayLaneViewHarness,
    );
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should render table headers and rows via harness", async () => {
    expect(await harness.getHeaderCells()).toEqual([
      "RD_COL_DRIVER",
      "RD_COL_LAPS",
    ]);
    expect(await harness.getRowCount()).toBe(2);
  });

  it("should display drift indicator on drift row", async () => {
    expect(await harness.hasDriftIndicator(0)).toBeFalse();
    expect(await harness.hasDriftIndicator(1)).toBeTrue();
  });

  it("should display teammate select dropdown and trigger parent method on change", async () => {
    expect(await harness.getTeammateSelectValue(0)).toBe("d1");

    await harness.setTeammateSelectValue(0, "d2");
    expect(mockParent.onTeammateChange).toHaveBeenCalled();
  });

  it("should open teammate dropdown and display options with driver stats", () => {
    const rowEl = fixture.nativeElement.querySelector(".table-row");
    const selectEl = rowEl.querySelector(
      "app-custom-select.teammate-select",
    ) as HTMLElement;
    expect(selectEl).toBeTruthy();

    const trigger = selectEl.querySelector(
      ".custom-select-trigger",
    ) as HTMLElement;
    trigger.click();
    fixture.detectChanges();

    expect(selectEl.classList.contains("open")).toBeTrue();
    const dropdown = selectEl.querySelector(
      ".custom-select-dropdown",
    ) as HTMLElement;
    expect(dropdown).toBeTruthy();

    const options = selectEl.querySelectorAll(".custom-select-option");
    expect(options.length).toBe(2);
    expect(options[0].textContent).toContain("Rocket");
    expect(options[0].textContent).toContain("(Heat: 0 Laps)");
    expect(options[1].textContent).toContain("Chuck");
    expect(options[1].textContent).toContain("(Heat: 0 Laps)");

    (options[1] as HTMLElement).click();
    fixture.detectChanges();
    expect(mockParent.onTeammateChange).toHaveBeenCalled();
    expect(selectEl.classList.contains("open")).toBeFalse();
  });

  it("should display pulldown marker background image on teammate display name in resting state", () => {
    const rowEl = fixture.nativeElement.querySelector(".table-row");
    const nameEl = rowEl.querySelector(".teammate-display-name") as HTMLElement;
    expect(nameEl).toBeTruthy();
    expect(nameEl.style.backgroundImage).toContain("url(");

    const selectEl = rowEl.querySelector(
      "app-custom-select.teammate-select",
    ) as HTMLElement;
    expect(selectEl.style.backgroundImage).toBeFalsy();
  });

  it("should trigger parent onCellClick on cell click", async () => {
    await harness.clickCell(0, 1);
    expect(mockParent.onCellClick).toHaveBeenCalled();
  });

  it("should apply clickable-team-cell class and driver tooltip to the name column cell", () => {
    const rowEl = fixture.nativeElement.querySelector(".table-row");
    const cells = rowEl.querySelectorAll(".body-cell");
    expect(cells[0].classList.contains("clickable-team-cell")).toBeTrue();
    expect(cells[0].getAttribute("title")).toBe("RD_TEAM_DRIVER_TOOLTIP");
  });

  it("should display team name once and teammate select when column is participant.team.name in team race", () => {
    (mockParent.sortedHeatDrivers[0] as any).participant = {
      team: { name: "Team Fast" },
    };
    mockParent.getLayoutEntries = (_col: any) => [
      { property: "participant.team.name", anchor: "center-center" },
    ];
    mockParent.formatColumnValue = (_hd: any, _col: any, prop: string) => {
      if (prop === "participant.team.name") return "Team Fast";
      return "";
    };
    fixture.detectChanges();

    const rowEl = fixture.nativeElement.querySelector(".table-row");
    const nameEl = rowEl.querySelector(".teammate-display-name") as HTMLElement;
    expect(nameEl).toBeTruthy();
    expect(nameEl.textContent?.trim()).toBe("Team Fast");

    const selectEl = rowEl.querySelector("app-custom-select.teammate-select");
    expect(selectEl).toBeTruthy();

    // Verify team name is not displayed twice
    const cellEl = rowEl.querySelector(
      ".body-cell .anchor-center-center",
    ) as HTMLElement;
    const textMatches = Array.from(cellEl.querySelectorAll("span")).filter(
      (s) => s.textContent?.trim() === "Team Fast",
    );
    expect(textMatches.length).toBe(1);
  });

  it("should display team name once without teammate select when participant.team.name in non-team race", () => {
    mockParent.isTeam = () => false;
    (mockParent.sortedHeatDrivers[0] as any).participant = {
      team: { name: "Team Solo" },
    };
    mockParent.getLayoutEntries = (_col: any) => [
      { property: "participant.team.name", anchor: "center-center" },
    ];
    mockParent.formatColumnValue = (_hd: any, _col: any, prop: string) => {
      if (prop === "participant.team.name") return "Team Solo";
      return "";
    };
    fixture.detectChanges();

    const rowEl = fixture.nativeElement.querySelector(".table-row");
    const nameEl = rowEl.querySelector(".teammate-display-name");
    expect(nameEl).toBeNull();

    const selectEl = rowEl.querySelector("app-custom-select.teammate-select");
    expect(selectEl).toBeNull();

    const cellEl = rowEl.querySelector(
      ".body-cell .anchor-center-center",
    ) as HTMLElement;
    const textMatches = Array.from(cellEl.querySelectorAll("span")).filter(
      (s) => s.textContent?.trim() === "Team Solo",
    );
    expect(textMatches.length).toBe(1);
  });

  it("should not show teammate select for team name when it is an inset of a driver name column", () => {
    (mockParent.sortedHeatDrivers[0] as any).participant = {
      team: { name: "Team Fast" },
    };
    (mockParent.sortedHeatDrivers[0] as any).actualDriver = {
      entity_id: "d1",
      name: "Alice",
      nickname: "Ace",
    };
    mockParent.columns = [
      {
        propertyName: "driver.name",
        labelKey: "RD_COL_NAME",
        layout: {
          "center-center": "driver.name",
          "bottom-right": "participant.team.name",
        },
      },
    ];
    mockParent.getLayoutEntries = (_col: any) => [
      { property: "driver.name", anchor: "center-center" },
      { property: "participant.team.name", anchor: "bottom-right" },
    ];
    mockParent.formatColumnValue = (_hd: any, _col: any, prop: string) => {
      if (prop === "participant.team.name") return "Team Fast";
      if (prop === "driver.name") return "Alice";
      return "";
    };
    fixture.detectChanges();

    const rowEl = fixture.nativeElement.querySelector(".table-row");
    // Center-center (driver.name) should have teammate selector
    const centerEl = rowEl.querySelector(
      ".body-cell .anchor-center-center",
    ) as HTMLElement;
    expect(centerEl.querySelector(".teammate-display-name")).toBeTruthy();
    expect(
      centerEl.querySelector("app-custom-select.teammate-select"),
    ).toBeTruthy();

    // Bottom-right (participant.team.name inset) should NOT have teammate selector
    const insetEl = rowEl.querySelector(
      ".body-cell .anchor-bottom-right",
    ) as HTMLElement;
    expect(insetEl.querySelector(".teammate-display-name")).toBeNull();
    expect(
      insetEl.querySelector("app-custom-select.teammate-select"),
    ).toBeNull();
    expect(insetEl.textContent?.trim()).toBe("Team Fast");

    // Only 1 teammate select dropdown exists in this row
    const selects = rowEl.querySelectorAll("app-custom-select.teammate-select");
    expect(selects.length).toBe(1);
  });

  describe("isNameProperty", () => {
    it("should return true for driver name and nickname properties", () => {
      expect(component.isNameProperty("driver.name")).toBeTrue();
      expect(component.isNameProperty("driver.name_0")).toBeTrue();
      expect(component.isNameProperty("driver.nickname")).toBeTrue();
      expect(component.isNameProperty("driver.nickname_1")).toBeTrue();
    });

    it("should return false for other properties or undefined", () => {
      expect(component.isNameProperty("participant.team.name")).toBeFalse();
      expect(component.isNameProperty("lapCount")).toBeFalse();
      expect(component.isNameProperty("")).toBeFalse();
      expect(component.isNameProperty(undefined)).toBeFalse();
    });
  });

  describe("isTeamProperty", () => {
    it("should return true for participant.team.name properties", () => {
      expect(component.isTeamProperty("participant.team.name")).toBeTrue();
      expect(component.isTeamProperty("participant.team.name_0")).toBeTrue();
    });

    it("should return false for other properties or undefined", () => {
      expect(component.isTeamProperty("driver.name")).toBeFalse();
      expect(component.isTeamProperty("driver.nickname")).toBeFalse();
      expect(component.isTeamProperty("lapCount")).toBeFalse();
      expect(component.isTeamProperty("")).toBeFalse();
      expect(component.isTeamProperty(undefined)).toBeFalse();
    });
  });

  describe("hasNameProperty", () => {
    it("should return true when column propertyName is a name property", () => {
      expect(
        component.hasNameProperty({ propertyName: "driver.name" }),
      ).toBeTrue();
      expect(
        component.hasNameProperty({ propertyName: "driver.nickname" }),
      ).toBeTrue();
    });

    it("should return true when column layout contains a name property", () => {
      const col = {
        propertyName: "custom",
        layout: {
          "center-center": "participant.team.name",
          "top-left": "driver.name",
        },
      };
      expect(component.hasNameProperty(col)).toBeTrue();
    });

    it("should return false when column has no name property", () => {
      const col = {
        propertyName: "participant.team.name",
        layout: {
          "center-center": "participant.team.name",
          "bottom-right": "lapCount",
        },
      };
      expect(component.hasNameProperty(col)).toBeFalse();
    });

    it("should return false for null or undefined column", () => {
      expect(component.hasNameProperty(null)).toBeFalse();
      expect(component.hasNameProperty(undefined)).toBeFalse();
    });
  });

  describe("shouldShowTeammateSelect", () => {
    const mockHd = {
      objectId: "hd1",
      laneIndex: 0,
      driver: { entity_id: "d1", name: "Alice" },
      participant: { team: { name: "Team Fast" } },
    };

    it("should return true for driver name in a team race", () => {
      const col = { propertyName: "driver.name" };
      const entry = { property: "driver.name", anchor: "center-center" };
      expect(component.shouldShowTeammateSelect(col, entry, mockHd)).toBeTrue();
    });

    it("should return true for driver nickname in a team race", () => {
      const col = { propertyName: "driver.nickname" };
      const entry = { property: "driver.nickname", anchor: "center-center" };
      expect(component.shouldShowTeammateSelect(col, entry, mockHd)).toBeTrue();
    });

    it("should return true for standalone team column in center-center", () => {
      const col = { propertyName: "participant.team.name" };
      const entry = {
        property: "participant.team.name",
        anchor: "center-center",
      };
      expect(component.shouldShowTeammateSelect(col, entry, mockHd)).toBeTrue();
    });

    it("should return false for team name when column contains driver name", () => {
      const col = {
        propertyName: "driver.name",
        layout: {
          "center-center": "driver.name",
          "bottom-right": "participant.team.name",
        },
      };
      const entry = {
        property: "participant.team.name",
        anchor: "bottom-right",
      };
      expect(
        component.shouldShowTeammateSelect(col, entry, mockHd),
      ).toBeFalse();
    });

    it("should return false for team name when it is an inset (not center-center)", () => {
      const col = {
        propertyName: "lapCount",
        layout: {
          "center-center": "lapCount",
          "bottom-right": "participant.team.name",
        },
      };
      const entry = {
        property: "participant.team.name",
        anchor: "bottom-right",
      };
      expect(
        component.shouldShowTeammateSelect(col, entry, mockHd),
      ).toBeFalse();
    });

    it("should return false when race is not a team race", () => {
      mockParent.isTeam = () => false;
      const col = { propertyName: "driver.name" };
      const entry = { property: "driver.name", anchor: "center-center" };
      expect(
        component.shouldShowTeammateSelect(col, entry, mockHd),
      ).toBeFalse();
    });

    it("should return false for non-name and non-team properties", () => {
      const col = { propertyName: "lapCount" };
      const entry = { property: "lapCount", anchor: "center-center" };
      expect(
        component.shouldShowTeammateSelect(col, entry, mockHd),
      ).toBeFalse();
    });

    it("should return false when hd or entry is null/undefined", () => {
      expect(component.shouldShowTeammateSelect(null, null, null)).toBeFalse();
      expect(
        component.shouldShowTeammateSelect({}, { property: "" }, mockHd),
      ).toBeFalse();
    });
  });

  describe("isTeamOrNameProperty", () => {
    it("should return true for driver names, nicknames, and team names including suffixes", () => {
      expect(component.isTeamOrNameProperty("driver.name")).toBeTrue();
      expect(component.isTeamOrNameProperty("driver.name_0")).toBeTrue();
      expect(component.isTeamOrNameProperty("driver.nickname")).toBeTrue();
      expect(component.isTeamOrNameProperty("driver.nickname_1")).toBeTrue();
      expect(
        component.isTeamOrNameProperty("participant.team.name"),
      ).toBeTrue();
      expect(
        component.isTeamOrNameProperty("participant.team.name_0"),
      ).toBeTrue();
    });

    it("should return false for non-name properties or empty values", () => {
      expect(component.isTeamOrNameProperty("lapCount")).toBeFalse();
      expect(component.isTeamOrNameProperty("totalLaps")).toBeFalse();
      expect(component.isTeamOrNameProperty("bestLapTime")).toBeFalse();
      expect(component.isTeamOrNameProperty("")).toBeFalse();
      expect(component.isTeamOrNameProperty(undefined)).toBeFalse();
    });
  });

  describe("getTeammateDisplayName", () => {
    it("should return driver nickname or fallback to name for driver.nickname", () => {
      const hd = {
        actualDriver: { nickname: "Rocket", name: "John Doe" },
        driver: { nickname: "R", name: "J" },
      };
      expect(component.getTeammateDisplayName(hd, "driver.nickname")).toBe(
        "Rocket",
      );
      expect(
        component.getTeammateDisplayName(
          { actualDriver: { name: "John Doe" } },
          "driver.nickname",
        ),
      ).toBe("John Doe");
    });

    it("should return team name for participant.team.name", () => {
      const hd = {
        participant: { team: { name: "Apex Racing" } },
        driver: { name: "Driver 1" },
      };
      expect(
        component.getTeammateDisplayName(hd, "participant.team.name"),
      ).toBe("Apex Racing");
      expect(
        component.getTeammateDisplayName(hd, "participant.team.name_0"),
      ).toBe("Apex Racing");
    });

    it("should return actualDriver or driver name for driver.name", () => {
      const hd = {
        actualDriver: { name: "Jane Smith" },
        driver: { name: "Other" },
      };
      expect(component.getTeammateDisplayName(hd, "driver.name")).toBe(
        "Jane Smith",
      );
    });

    it("should handle null or undefined gracefully", () => {
      expect(component.getTeammateDisplayName(null, "driver.name")).toBe("");
      expect(component.getTeammateDisplayName({}, "")).toBe("");
    });
  });

  it("should apply clickable-lap-cell class and lap tooltip to the lap column cell", () => {
    const rowEl = fixture.nativeElement.querySelector(".table-row");
    const cells = rowEl.querySelectorAll(".body-cell");
    expect(cells[1].classList.contains("clickable-lap-cell")).toBeTrue();
    expect(cells[1].getAttribute("title")).toBe("RD_LAP_COLUMN_TOOLTIP");
  });

  it("should scale down text that overflows the container", async () => {
    const rowEl = fixture.nativeElement.querySelector(".table-row");
    const targetCell = rowEl.querySelector(
      ".anchor-center-center",
    ) as HTMLElement;

    const textEl =
      (targetCell.querySelector(".teammate-display-name") as HTMLElement) ||
      targetCell;

    // Force overflow for test, but make it respect the scale so the binary search works
    Object.defineProperty(textEl, "scrollWidth", {
      get: () => {
        const scale = Number(
          targetCell.style.getPropertyValue("--text-fit-scale") || 1,
        );
        return 200 * scale;
      },
      configurable: true,
    });
    Object.defineProperty(textEl, "clientWidth", {
      get: () => 100,
      configurable: true,
    });

    // Mock parent to not overflow
    Object.defineProperty(textEl, "scrollHeight", {
      get: () => 20,
      configurable: true,
    });
    Object.defineProperty(textEl, "clientHeight", {
      get: () => 20,
      configurable: true,
    });

    // Mock targetCell to pass the filter
    Object.defineProperty(targetCell, "clientHeight", {
      get: () => 20,
      configurable: true,
    });
    Object.defineProperty(targetCell, "clientWidth", {
      get: () => 100,
      configurable: true,
    });

    // Force fitTexts to run again now that we mocked the size
    (component as any).fitTexts();

    // Wait for the setTimeout in fitTexts
    await new Promise((resolve) => setTimeout(resolve, 50));

    const targets = (component as any).fitTextTargets();
    if (targets.length === 0) {
      throw new Error("No fitTextTargets found!");
    }
    const targetNodes = targets.map((t: any) => t.nativeElement);
    if (!targetNodes.includes(targetCell)) {
      throw new Error(
        `targetCell is NOT in targets! targetCell classes: ${targetCell.className}, targets: ${targetNodes.map((n: any) => n.className).join(", ")}`,
      );
    }

    const scale = targetCell.style.getPropertyValue("--text-fit-scale");
    if (scale === "1" || scale === "") {
      throw new Error(
        `Scale was not updated! It is ${scale}. scrollWidth=${targetCell.scrollWidth}, clientWidth=${targetCell.clientWidth}`,
      );
    }

    expect(scale).toBeTruthy();
    expect(Number(scale)).toBeLessThan(1.0);
    expect(Number(scale)).toBeGreaterThan(0.0);
  });

  it("should scale down text if child element overflows the container", async () => {
    const rowEl = fixture.nativeElement.querySelector(".table-row");
    const targetCell = rowEl.querySelector(
      ".anchor-center-center",
    ) as HTMLElement;

    const textEl =
      (targetCell.querySelector(".teammate-display-name") as HTMLElement) ||
      targetCell;

    const mockChild = document.createElement("span");

    // Force overflow on child, but respect scale
    Object.defineProperty(mockChild, "scrollWidth", {
      get: () => {
        const scale = Number(
          targetCell.style.getPropertyValue("--text-fit-scale") || 1,
        );
        return 200 * scale;
      },
      configurable: true,
    });
    Object.defineProperty(mockChild, "scrollHeight", {
      get: () => 20,
      configurable: true,
    });

    Object.defineProperty(textEl, "firstElementChild", {
      get: () => mockChild,
      configurable: true,
    });

    // Mock parent to not overflow
    Object.defineProperty(textEl, "scrollWidth", {
      get: () => 100,
      configurable: true,
    });
    Object.defineProperty(textEl, "clientWidth", {
      get: () => 100,
      configurable: true,
    });
    Object.defineProperty(textEl, "scrollHeight", {
      get: () => 20,
      configurable: true,
    });
    Object.defineProperty(textEl, "clientHeight", {
      get: () => 20,
      configurable: true,
    });

    // Mock targetCell to pass the filter
    Object.defineProperty(targetCell, "clientHeight", {
      get: () => 20,
      configurable: true,
    });
    Object.defineProperty(targetCell, "clientWidth", {
      get: () => 100,
      configurable: true,
    });

    (component as any).fitTexts();
    await new Promise((resolve) => setTimeout(resolve, 50));

    const scale = targetCell.style.getPropertyValue("--text-fit-scale");
    expect(scale).toBeTruthy();
    expect(Number(scale)).toBeLessThan(1.0);
    expect(Number(scale)).toBeGreaterThan(0.0);
  });

  it("should call fitTexts when a mutation occurs", async () => {
    const fitTextsSpy = spyOn<any>(component, "fitTexts").and.callThrough();
    const container = fixture.nativeElement.querySelector(".table-row");

    // trigger mutation
    const div = document.createElement("div");
    container.appendChild(div);

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(fitTextsSpy).toHaveBeenCalled();
  });

  it("should apply custom font sizes as CSS variables when configured and scaleMode is not auto", () => {
    fixture.componentRef.setInput("widget", {
      scaleMode: "",
      customSettings: {
        columnFontSize: 24,
        dataFontSize: 32,
        insetFontSize: 16,
      },
    });
    fixture.detectChanges();

    const container = fixture.nativeElement.querySelector(".bottom-section");
    expect(container.style.getPropertyValue("--custom-column-font-size")).toBe(
      "24px",
    );

    // The mock getLayoutEntries maps to "center-center" which uses dataFontSize
    const centerCell = fixture.nativeElement.querySelector(
      ".anchor-center-center",
    );
    expect(centerCell.style.getPropertyValue("--custom-font-size")).toBe(
      "32px",
    );
  });

  it("should not apply custom font sizes as CSS variables when scaleMode is auto", () => {
    fixture.componentRef.setInput("widget", {
      scaleMode: "auto",
      customSettings: {
        columnFontSize: 24,
        dataFontSize: 32,
        insetFontSize: 16,
      },
    });
    fixture.detectChanges();

    const container = fixture.nativeElement.querySelector(".bottom-section");
    expect(container.style.getPropertyValue("--custom-column-font-size")).toBe(
      "",
    );

    const centerCell = fixture.nativeElement.querySelector(
      ".anchor-center-center",
    );
    expect(centerCell.style.getPropertyValue("--custom-font-size")).toBe("");
  });

  it("should return custom column label if provided, else fallback to parent", () => {
    const col = { propertyName: "driver.nickname", labelKey: "RD_COL_DRIVER" };
    expect(component.getColumnLabel(col)).toBe("RD_COL_DRIVER");

    fixture.componentRef.setInput("widget", {
      customSettings: { columnLabels: { "driver.nickname": "Custom Name" } },
    });
    expect(component.getColumnLabel(col)).toBe("Custom Name");
  });

  it("should render ghost pacing widget for occupied lane and -- for empty lane", () => {
    mockParent.columns = [
      {
        propertyName: "ghostPacing",
        labelKey: "RD_COL_GHOST_PACING",
        layout: {
          [AnchorPoint.CenterCenter]: "ghostPacing",
        },
      } as any,
    ];
    mockParent.sortedHeatDrivers = [
      {
        objectId: "1",
        laneIndex: 0,
        driver: { name: "Alice" },
        isEmpty: false,
      },
      {
        objectId: "2",
        laneIndex: 1,
        driver: { name: "Empty" },
        isEmpty: true,
      },
    ];
    fixture.detectChanges();

    const pacingWidgets = fixture.nativeElement.querySelectorAll(
      "app-raceday-ghost-pacing",
    );
    expect(pacingWidgets.length).toBe(1);

    const rows = fixture.nativeElement.querySelectorAll(".table-row");
    expect(rows.length).toBe(2);
    // Row 2 is empty driver, so it renders --
    expect(rows[1].textContent).toContain("--");
  });

  it("should map pacing property names to correct GhostBenchmarkType", () => {
    expect(component.getPacingBenchmarkType("ghostPacing")).toBe("LANE_RECORD");
    expect(component.getPacingBenchmarkType("ghostPacingPB")).toBe(
      "PERSONAL_BEST",
    );
    expect(component.getPacingBenchmarkType("ghostPacingPersonalAvg")).toBe(
      "PERSONAL_AVG",
    );
    expect(component.getPacingBenchmarkType("ghostPacingPersonalMedian")).toBe(
      "PERSONAL_MEDIAN",
    );
    expect(component.getPacingBenchmarkType("ghostPacingLeaderAvg")).toBe(
      "HEAT_LEADER_AVG",
    );
    expect(component.getPacingBenchmarkType("ghostPacingLeaderMedian")).toBe(
      "HEAT_LEADER_MEDIAN",
    );
    expect(component.getPacingBenchmarkType("ghostPacingLeaderBest")).toBe(
      "HEAT_LEADER",
    );
    expect(component.getPacingBenchmarkType(undefined)).toBe("LANE_RECORD");
  });

  it("should check if property is a pacing property", () => {
    expect(component.isPacingProperty("ghostPacing")).toBe(true);
    expect(component.isPacingProperty("ghostPacingPB")).toBe(true);
    expect(component.isPacingProperty("driver.name")).toBe(false);
    expect(component.isPacingProperty(undefined)).toBe(false);
  });

  it("should render recordLapTime column with time, nickname, and date on separate lines", () => {
    mockParent.columns = [
      {
        propertyName: "recordLapTime",
        labelKey: "RD_COL_RECORD_LAP_TIME",
        layout: {
          [AnchorPoint.CenterCenter]: "recordLapTime",
        },
      } as any,
    ];
    fixture.detectChanges();

    const recordContentEls = fixture.nativeElement.querySelectorAll(
      ".record-lap-content",
    );
    expect(recordContentEls.length).toBe(2);

    const firstRowSub = recordContentEls[0].querySelector(".record-lap-sub");
    expect(firstRowSub).toBeTruthy();

    const firstRowTime = recordContentEls[0].querySelector(".record-lap-time");
    const firstRowHolder =
      recordContentEls[0].querySelector(".record-lap-holder");
    const firstRowDate = recordContentEls[0].querySelector(".record-lap-date");

    expect(firstRowTime.textContent.trim()).toBe("5.200");
    expect(firstRowHolder.textContent.trim()).toBe("Speedy");
    expect(firstRowDate.textContent.trim()).toBe("2026-08-21");
    // Ensure date is after holder within record-lap-sub
    expect(firstRowHolder.compareDocumentPosition(firstRowDate)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );

    const secondRowTime = recordContentEls[1].querySelector(".record-lap-time");
    const secondRowHolder =
      recordContentEls[1].querySelector(".record-lap-holder");
    const secondRowDate = recordContentEls[1].querySelector(".record-lap-date");

    expect(secondRowTime.textContent.trim()).toBe("--.---");
    expect(secondRowHolder.textContent.trim()).toBe("---");
    expect(secondRowDate.textContent.trim()).toBe("---");
  });

  it("should render -- for empty lanes when recordLapTime column is configured", () => {
    mockParent.sortedHeatDrivers = [
      {
        objectId: "hd1",
        laneIndex: 0,
        driver: { name: "Alice", nickname: "Rocket" },
        actualDriver: { name: "Alice", nickname: "Rocket" },
        isEmpty: false,
        laps: [],
      },
      {
        objectId: "hd2",
        laneIndex: 1,
        driver: { name: "", nickname: "" },
        isEmpty: true,
        laps: [],
      },
    ];
    mockParent.columns = [
      {
        propertyName: "recordLapTime",
        labelKey: "RD_COL_RECORD_LAP_TIME",
        layout: {
          [AnchorPoint.CenterCenter]: "recordLapTime",
        },
      } as any,
    ];
    fixture.detectChanges();

    const recordContentEls = fixture.nativeElement.querySelectorAll(
      ".record-lap-content",
    );
    expect(recordContentEls.length).toBe(1);

    const cells = fixture.nativeElement.querySelectorAll(".body-cell");
    expect(cells.length).toBe(2);
    expect(cells[0].querySelector(".record-lap-content")).toBeTruthy();
    expect(cells[1].querySelector(".record-lap-content")).toBeFalsy();
    expect(cells[1].textContent.trim()).toBe("--");
  });

  it("should render bestRaceLapTime column with time, nickname, and heat on separate lines", () => {
    mockParent.columns = [
      {
        propertyName: "bestRaceLapTime",
        labelKey: "RD_COL_BEST_RACE_LAP_TIME",
        layout: {
          [AnchorPoint.CenterCenter]: "bestRaceLapTime",
        },
      } as any,
    ];
    fixture.detectChanges();

    const recordContentEls = fixture.nativeElement.querySelectorAll(
      ".best-race-lap-content",
    );
    expect(recordContentEls.length).toBe(2);

    const firstRowSub = recordContentEls[0].querySelector(".best-race-lap-sub");
    expect(firstRowSub).toBeTruthy();

    const firstRowTime = recordContentEls[0].querySelector(
      ".best-race-lap-time",
    );
    const firstRowHolder = recordContentEls[0].querySelector(
      ".best-race-lap-holder",
    );
    const firstRowHeat = recordContentEls[0].querySelector(
      ".best-race-lap-heat",
    );

    expect(firstRowTime.textContent.trim()).toBe("4.950");
    expect(firstRowHolder.textContent.trim()).toBe("Flash");
    expect(firstRowHeat.textContent.trim()).toBe("Heat 2");
    expect(firstRowHolder.compareDocumentPosition(firstRowHeat)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );

    const secondRowTime = recordContentEls[1].querySelector(
      ".best-race-lap-time",
    );
    const secondRowHolder = recordContentEls[1].querySelector(
      ".best-race-lap-holder",
    );
    const secondRowHeat = recordContentEls[1].querySelector(
      ".best-race-lap-heat",
    );

    expect(secondRowTime.textContent.trim()).toBe("--.---");
    expect(secondRowHolder.textContent.trim()).toBe("---");
    expect(secondRowHeat.textContent.trim()).toBe("---");
  });

  it("should render -- for empty lanes when bestRaceLapTime column is configured", () => {
    mockParent.sortedHeatDrivers = [
      {
        objectId: "hd1",
        laneIndex: 0,
        driver: { name: "Alice", nickname: "Rocket" },
        actualDriver: { name: "Alice", nickname: "Rocket" },
        isEmpty: false,
        laps: [],
      },
      {
        objectId: "hd2",
        laneIndex: 1,
        driver: { name: "", nickname: "" },
        isEmpty: true,
        laps: [],
      },
    ];
    mockParent.columns = [
      {
        propertyName: "bestRaceLapTime",
        labelKey: "RD_COL_BEST_RACE_LAP_TIME",
        layout: {
          [AnchorPoint.CenterCenter]: "bestRaceLapTime",
        },
      } as any,
    ];
    fixture.detectChanges();

    const recordContentEls = fixture.nativeElement.querySelectorAll(
      ".best-race-lap-content",
    );
    expect(recordContentEls.length).toBe(1);

    const cells = fixture.nativeElement.querySelectorAll(".body-cell");
    expect(cells.length).toBe(2);
    expect(cells[0].querySelector(".best-race-lap-content")).toBeTruthy();
    expect(cells[1].querySelector(".best-race-lap-content")).toBeFalsy();
    expect(cells[1].textContent.trim()).toBe("--");
  });

  it("should render laneNumber column in practice race with centered span and reset buttons", () => {
    mockParent.race = { practice: true };
    mockParent.isNameProperty = (prop: string) =>
      prop.startsWith("driver.name") || prop.startsWith("driver.nickname");
    mockParent.isTeam = () => false;
    mockParent.formatColumnValue = (
      hd: any,
      _col: any,
      prop: string,
      _anchor: string,
    ) => (prop === "laneNumber" ? String(hd.laneIndex + 1) : hd.driver?.name);

    mockParent.columns = [
      {
        propertyName: "laneNumber",
        labelKey: "RD_COL_LANE",
        layout: {
          [AnchorPoint.CenterCenter]: "laneNumber",
        },
      } as any,
    ];
    fixture.detectChanges();

    // Header should have reset-all-btn
    const resetAllBtn = fixture.nativeElement.querySelector(".reset-all-btn");
    expect(resetAllBtn).toBeTruthy();

    // Body rows should have reset-lane-btn and span with 0px padding-right
    const resetLaneBtns =
      fixture.nativeElement.querySelectorAll(".reset-lane-btn");
    expect(resetLaneBtns.length).toBe(2);

    const spans = fixture.nativeElement.querySelectorAll(
      ".body-cell .anchor-center-center span",
    );
    expect(spans.length).toBe(2);
    expect(spans[0].textContent.trim()).toBe("1");
    expect(spans[0].style.paddingRight).toBe("0px");
    expect(spans[1].textContent.trim()).toBe("2");
    expect(spans[1].style.paddingRight).toBe("0px");
  });

  it("should apply 0px inline padding to pacing entry even when not in center-center anchor", () => {
    mockParent.columns = [
      {
        propertyName: "ghostPacing",
        labelKey: "RD_COL_GHOST_PACING",
        layout: {
          [AnchorPoint.TopCenter]: "ghostPacing",
        },
      } as any,
    ];
    mockParent.getLayoutEntries = (_col: any) => [
      { anchor: "top-center", property: "ghostPacing" },
    ];
    fixture.detectChanges();

    const pacingEl = fixture.nativeElement.querySelector(".pacing-entry");
    expect(pacingEl).toBeTruthy();
    expect(pacingEl.style.padding).toBe("0px");
  });

  it("should correctly identify solo center pacing and apply solo-pacing class", () => {
    const colSingle = {
      propertyName: "ghostPacing",
      labelKey: "RD_COL_GHOST_PACING",
      layout: { [AnchorPoint.CenterCenter]: "ghostPacing" },
    };
    mockParent.getLayoutEntries = (_c: any) => [
      { anchor: "center-center", property: "ghostPacing" },
    ];
    expect(
      component.isSoloCenterPacing(colSingle, {
        anchor: "center-center",
        property: "ghostPacing",
      }),
    ).toBeTrue();

    // Multi-entry column
    mockParent.getLayoutEntries = (_c: any) => [
      { anchor: "center-center", property: "ghostPacing" },
      { anchor: "top-left", property: "lapCount" },
    ];
    expect(
      component.isSoloCenterPacing(colSingle, {
        anchor: "center-center",
        property: "ghostPacing",
      }),
    ).toBeFalse();

    // Non-center anchor
    expect(
      component.isSoloCenterPacing(colSingle, {
        anchor: "top-center",
        property: "ghostPacing",
      }),
    ).toBeFalse();

    // Non-pacing property
    expect(
      component.isSoloCenterPacing(colSingle, {
        anchor: "center-center",
        property: "lapCount",
      }),
    ).toBeFalse();

    // Verify DOM receives solo-pacing class when single center pacing configured
    mockParent.columns = [colSingle as any];
    mockParent.getLayoutEntries = (_c: any) => [
      { anchor: "center-center", property: "ghostPacing" },
    ];
    fixture.detectChanges();

    const pacingEl = fixture.nativeElement.querySelector(".solo-pacing");
    expect(pacingEl).toBeTruthy();
  });

  it("should render -- at assigned anchor for empty lanes without pacing-entry classes", () => {
    mockParent.sortedHeatDrivers = [
      {
        objectId: "hd1",
        laneIndex: 0,
        driver: { name: "Alice" },
        actualDriver: { name: "Alice" },
        isEmpty: false,
        laps: [],
      },
      {
        objectId: "hd2",
        laneIndex: 1,
        driver: { name: "" },
        isEmpty: true,
        laps: [],
      },
    ];
    mockParent.columns = [
      {
        propertyName: "ghostPacing",
        labelKey: "RD_COL_GHOST_PACING",
        layout: {
          [AnchorPoint.TopRight]: "ghostPacing",
        },
      } as any,
    ];
    mockParent.getLayoutEntries = (_c: any) => [
      { anchor: "top-right", property: "ghostPacing" },
    ];
    fixture.detectChanges();

    const cells = fixture.nativeElement.querySelectorAll(".body-cell");
    expect(cells.length).toBe(2);

    // Occupied lane has pacing widget and pacing-entry class
    const firstCellFit = cells[0].querySelector(".anchor-top-right");
    expect(firstCellFit.classList.contains("pacing-entry")).toBeTrue();
    expect(firstCellFit.querySelector("app-raceday-ghost-pacing")).toBeTruthy();

    // Empty lane does not have pacing widget or pacing-entry class, but has anchor-top-right and 10px padding
    const secondCellFit = cells[1].querySelector(".anchor-top-right");
    expect(secondCellFit.classList.contains("pacing-entry")).toBeFalse();
    expect(secondCellFit.classList.contains("anchor-top-right")).toBeTrue();
    expect(secondCellFit.querySelector("app-raceday-ghost-pacing")).toBeFalsy();
    expect(secondCellFit.textContent.trim()).toBe("--");
    expect(secondCellFit.style.padding).toBe("10px");
  });

  it("should render header cells with fit-text containers and nowrap spans", () => {
    mockParent.columns = [
      {
        propertyName: "driver.nickname",
        labelKey: "RD_COL_NICKNAME",
        width: 300,
      },
      { propertyName: "lapCount", labelKey: "RD_COL_LAP", width: 100 },
      { propertyName: "lastLapTime", labelKey: "RD_COL_LAP_TIME", width: 150 },
    ];
    fixture.detectChanges();

    const headerCells = fixture.nativeElement.querySelectorAll(".header-cell");
    expect(headerCells.length).toBe(3);

    headerCells.forEach((hc: HTMLElement) => {
      const fitTextSpan = hc.querySelector("span");
      expect(fitTextSpan).toBeTruthy();
      expect(fitTextSpan?.style.whiteSpace).toBe("nowrap");
    });
  });

  it("should apply nowrap to numeric and lap body cell data", () => {
    mockParent.columns = [
      {
        propertyName: "lapCount",
        labelKey: "RD_COL_LAP",
        layout: { [AnchorPoint.CenterCenter]: "lapCount" },
      },
    ];
    mockParent.getLayoutEntries = (_c: any) => [
      { anchor: "center-center", property: "lapCount" },
    ];
    mockParent.isNameProperty = () => false;
    fixture.detectChanges();

    const dataSpan = fixture.nativeElement.querySelector(".body-cell span");
    expect(dataSpan).toBeTruthy();
    expect(dataSpan.style.whiteSpace).toBe("nowrap");
  });

  it("should render driver analysis columns and format their values", () => {
    mockParent.columns = [
      {
        propertyName: "standardDeviation",
        labelKey: "RD_COL_STD_DEV",
      },
      {
        propertyName: "consistencyScore",
        labelKey: "RD_COL_CONSISTENCY",
      },
      {
        propertyName: "averageTop5",
        labelKey: "RD_COL_AVG_TOP_5",
      },
    ];
    mockParent.formatColumnValue = (_hd: any, _col: any, prop: string) => {
      if (prop === "standardDeviation") return "0.145";
      if (prop === "consistencyScore") return "97.8%";
      if (prop === "averageTop5") return "5.120";
      return "";
    };
    mockParent.isNameProperty = () => false;
    fixture.detectChanges();

    const headerCells = fixture.nativeElement.querySelectorAll(".header-cell");
    expect(headerCells.length).toBe(3);
    expect(headerCells[0].textContent.trim()).toBe("RD_COL_STD_DEV");
    expect(headerCells[1].textContent.trim()).toBe("RD_COL_CONSISTENCY");
    expect(headerCells[2].textContent.trim()).toBe("RD_COL_AVG_TOP_5");

    const firstRowCells = fixture.nativeElement.querySelectorAll(
      ".table-row:first-of-type .body-cell",
    );
    expect(firstRowCells.length).toBe(3);
    expect(firstRowCells[0].textContent.trim()).toBe("0.145");
    expect(firstRowCells[1].textContent.trim()).toBe("97.8%");
    expect(firstRowCells[2].textContent.trim()).toBe("5.120");
  });

  it("should render trackCalls column header and formatted value", () => {
    mockParent.columns = [
      {
        propertyName: "trackCalls",
        labelKey: "RD_COL_TRACK_CALLS",
      },
    ];
    mockParent.formatColumnValue = (hd: any, _col: any, prop: string) => {
      if (prop === "trackCalls") return hd.objectId === "hd1" ? "3" : "0";
      return "";
    };
    mockParent.isNameProperty = () => false;
    fixture.detectChanges();

    const headerCells = fixture.nativeElement.querySelectorAll(".header-cell");
    expect(headerCells.length).toBe(1);
    expect(headerCells[0].textContent.trim()).toBe("RD_COL_TRACK_CALLS");

    const firstRowCells = fixture.nativeElement.querySelectorAll(
      ".table-row:first-of-type .body-cell",
    );
    expect(firstRowCells.length).toBe(1);
    expect(firstRowCells[0].textContent.trim()).toBe("3");
  });

  describe("getPacingDecimalPlaces", () => {
    it("should resolve decimal places from widget customSettings columnDecimals for direct columnKey", () => {
      fixture.componentRef.setInput("widget", {
        id: "w1",
        widgetType: "lane-view",
        customSettings: {
          columnDecimals: { ghostPacing: 1 },
        },
      } as any);

      expect(
        component.getPacingDecimalPlaces({ propertyName: "ghostPacing" }),
      ).toBe(1);
    });

    it("should resolve decimal places from widget customSettings columnDecimals for entry property", () => {
      fixture.componentRef.setInput("widget", {
        id: "w1",
        widgetType: "lane-view",
        customSettings: {
          columnDecimals: { ghostPacingPB: 0 },
        },
      } as any);

      expect(
        component.getPacingDecimalPlaces(
          { propertyName: "compound" },
          { property: "ghostPacingPB" },
        ),
      ).toBe(0);
    });

    it("should resolve decimal places for compound columnKey", () => {
      fixture.componentRef.setInput("widget", {
        id: "w1",
        widgetType: "lane-view",
        customSettings: {
          columnDecimals: { ghostPacing: 2 },
        },
      } as any);

      expect(
        component.getPacingDecimalPlaces({
          propertyName: "lapCount_ghostPacing",
        }),
      ).toBe(2);
    });

    it("should resolve decimal places via prefix matching ghostPacing", () => {
      fixture.componentRef.setInput("widget", {
        id: "w1",
        widgetType: "lane-view",
        customSettings: {
          columnDecimals: { ghostPacing: 1 },
        },
      } as any);

      expect(
        component.getPacingDecimalPlaces({
          propertyName: "ghostPacingPersonalMedian",
        }),
      ).toBe(1);
    });

    it("should fall back to insetTimeDecimalPlaces when entry is an inset", () => {
      fixture.componentRef.setInput("widget", {
        id: "w1",
        widgetType: "lane-view",
        customSettings: {
          insetTimeDecimalPlaces: 1,
          timeDecimalPlaces: 2,
        },
      } as any);

      expect(
        component.getPacingDecimalPlaces(
          { propertyName: "other" },
          { anchor: "top-left", property: "ghostPacing" },
        ),
      ).toBe(1);
    });

    it("should fall back to timeDecimalPlaces when center entry and no override", () => {
      fixture.componentRef.setInput("widget", {
        id: "w1",
        widgetType: "lane-view",
        customSettings: {
          timeDecimalPlaces: 2,
        },
      } as any);

      expect(
        component.getPacingDecimalPlaces(
          { propertyName: "other" },
          { anchor: "center-center", property: "ghostPacing" },
        ),
      ).toBe(2);
    });

    it("should clamp resolved decimal values into [0, 3]", () => {
      fixture.componentRef.setInput("widget", {
        id: "w1",
        widgetType: "lane-view",
        customSettings: {
          columnDecimals: { ghostPacing: 5 },
          timeDecimalPlaces: -2,
        },
      } as any);

      expect(
        component.getPacingDecimalPlaces({ propertyName: "ghostPacing" }),
      ).toBe(3);

      expect(
        component.getPacingDecimalPlaces({ propertyName: "unknown" }),
      ).toBe(0);
    });

    it("should default to 3 when no custom settings exist", () => {
      fixture.componentRef.setInput("widget", {
        id: "w1",
        widgetType: "lane-view",
      } as any);

      expect(
        component.getPacingDecimalPlaces({ propertyName: "ghostPacing" }),
      ).toBe(3);
    });
  });
});
