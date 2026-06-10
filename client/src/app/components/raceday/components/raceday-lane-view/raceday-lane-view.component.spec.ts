import { DragDropModule } from "@angular/cdk/drag-drop";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BehaviorSubject } from "rxjs";
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
          driver: { name: "Alice", nickname: "Rocket" },
          actualDriver: { name: "Alice", nickname: "Rocket" },
          laps: [],
        },
        {
          objectId: "hd2",
          laneIndex: 1,
          isLastLapDrift: true,
          driver: { name: "Bob", nickname: "Drifter" },
          actualDriver: { name: "Bob", nickname: "Drifter" },
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
      highlightedDrivers: new Set(),
      draggingLane: null,
      onDragOver: jasmine.createSpy("onDragOver"),
      getRowHeight: () => 48,
      getDriverVisualPosition: (hd: any) => hd.laneIndex,
      isDragging: false,
      onCellClick: jasmine.createSpy("onCellClick"),
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
      getDropdownArrowBg: (_hd: any) => "",
      getDriverStats: (_hd: any, _id: string) => " (Heat: 0 Laps)",
      formatColumnValue: (hd: any, col: any, prop: string) => {
        if (prop === "driver.nickname") return hd.driver.nickname;
        if (prop === "lapCount") return "5";
        return "";
      },
      isAvatarProperty: (_prop: string) => false,
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

  it("should trigger parent onCellClick on cell click", async () => {
    await harness.clickCell(0, 1);
    expect(mockParent.onCellClick).toHaveBeenCalled();
  });
});
