import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BehaviorSubject, of, throwError } from "rxjs";
import { DataService } from "@app/data.service";
import { Driver } from "@app/models/driver";
import { RaceParticipant } from "@app/models/race_participant";
import { Role } from "@app/models/role";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { Heat } from "@app/race/heat";
import { AuthService } from "@app/services/auth.service";
import { TranslationService } from "@app/services/translation.service";

import { DisallowLapRecordsDialogComponent } from "./disallow-lap-records-dialog.component";

describe("DisallowLapRecordsDialogComponent", () => {
  let component: DisallowLapRecordsDialogComponent;
  let fixture: ComponentFixture<DisallowLapRecordsDialogComponent>;
  let mockDataService: jasmine.SpyObj<DataService>;
  let roleSubject: BehaviorSubject<Role>;
  let mockAuthService: { currentRole$: BehaviorSubject<Role> };

  const mockHeats = [
    {
      heatNumber: 1,
      drivers: [
        {
          laneIndex: 0,
          driver: { name: "Alice" },
          lapsWithDetails: [
            {
              time: 2.5,
              driverId: "d1",
              isDrift: false,
              countTowardsRecords: true,
            },
            {
              time: 1.2,
              driverId: "d1",
              isDrift: false,
              countTowardsRecords: true,
            },
            {
              time: 3.0,
              driverId: "d1",
              isDrift: false,
              countTowardsRecords: false,
            },
          ],
        },
        {
          laneIndex: 1,
          driver: { name: "Bob" },
          lapsWithDetails: [
            {
              time: 2.8,
              driverId: "d2",
              isDrift: false,
              countTowardsRecords: true,
            },
          ],
        },
      ],
    },
    {
      heatNumber: 2,
      drivers: [
        {
          laneIndex: 0,
          driver: { name: "Charlie" },
          lapsWithDetails: [],
        },
      ],
    },
  ];

  const mockTrack = {
    name: "Speedway",
    lanes: [
      { background_color: "#ff0000", foreground_color: "#ffffff" },
      { background_color: "#0000ff", foreground_color: "#ffffff" },
    ],
  };

  beforeEach(async () => {
    mockDataService = jasmine.createSpyObj("DataService", [
      "updateLiveLapRecordStatus",
      "updateHistoryLapRecordStatus",
      "getLaps",
      "getRaceUpdate",
    ]);
    mockDataService.updateLiveLapRecordStatus.and.returnValue(
      of({ bestLapTime: 2.5 }),
    );
    mockDataService.updateHistoryLapRecordStatus.and.returnValue(
      of({ bestLapTime: 2.5 }),
    );
    mockDataService.getLaps.and.returnValue(of());
    mockDataService.getRaceUpdate.and.returnValue(of());

    roleSubject = new BehaviorSubject<Role>(Role.VIEWER);
    mockAuthService = {
      currentRole$: roleSubject,
    };

    const mockTranslationService = {
      translate: (key: string) => key,
      get: (key: string) => of(key),
    };

    await TestBed.configureTestingModule({
      imports: [DisallowLapRecordsDialogComponent],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DisallowLapRecordsDialogComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("heats", mockHeats);
    fixture.componentRef.setInput("track", mockTrack);
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();
  });

  it("should create the component with default selection of All Drivers, All Heats, All Lanes, and sort by time asc", () => {
    expect(component).toBeTruthy();
    expect(component.canEdit).toBeFalse();
    expect(component.selectedRaceId).toBe("");
    expect(component.selectedDriverName).toBe("");
    expect(component.selectedHeatNumber).toBe(-1);
    expect(component.selectedLaneIndex).toBe(-1);
    expect(component.sortColumn).toBe("time");
    expect(component.sortDirection).toBe("asc");
  });

  it("should reset selection and sort when visible changes to true", () => {
    component.selectedRaceId = "race_1";
    component.selectedDriverName = "Alice";
    component.selectedHeatNumber = 2;
    component.selectedLaneIndex = 1;
    component.sortColumn = "driver";
    component.sortDirection = "desc";
    component.errorMessage = "Some error";

    fixture.componentRef.setInput("visible", true);
    component.ngOnChanges({
      visible: {
        currentValue: true,
        previousValue: false,
        firstChange: false,
        isFirstChange: () => false,
      },
    });

    expect(component.selectedRaceId).toBe("");
    expect(component.selectedDriverName).toBe("");
    expect(component.selectedHeatNumber).toBe(-1);
    expect(component.selectedLaneIndex).toBe(-1);
    expect(component.sortColumn).toBe("time");
    expect(component.sortDirection).toBe("asc");
    expect(component.errorMessage).toBe("");
  });

  it("should update canEdit when role changes to DIRECTOR or ADMIN", () => {
    roleSubject.next(Role.DIRECTOR);
    expect(component.canEdit).toBeTrue();

    roleSubject.next(Role.ADMIN);
    expect(component.canEdit).toBeTrue();

    roleSubject.next(Role.VIEWER);
    expect(component.canEdit).toBeFalse();
  });

  it("should calculate availableDrivers, availableHeats, and availableLanes correctly", () => {
    expect(component.availableDrivers).toEqual([
      { driverName: "Alice", teamName: undefined },
      { driverName: "Bob", teamName: undefined },
      { driverName: "Charlie", teamName: undefined },
    ]);
    expect(component.availableHeats).toEqual([1, 2]);

    const lanes = component.availableLanes;
    expect(lanes.length).toBe(2);
    expect(lanes[0].laneIndex).toBe(0);
    expect(lanes[0].laneColor).toBe("#ff0000");
    expect(lanes[1].laneIndex).toBe(1);
    expect(lanes[1].laneColor).toBe("#0000ff");
  });

  it("should return empty driver name when driver is an explicit empty lane", () => {
    expect(
      component.getDriverName({ driver: { entity_id: "EMPTY_LANE" } }),
    ).toBe("");
    expect(
      component.getDriverName({ actualDriver: { entityId: "EMPTY_LANE" } }),
    ).toBe("");
    expect(component.getDriverName({ isEmptyLane: true })).toBe("");
    expect(component.getDriverName({ driver: { name: "Dave" } })).toBe("Dave");
    expect(component.getDriverName(null)).toBe("");
  });

  it("should normalize laps and sort by time in ascending order (fastest time first) by default", () => {
    const laps = component.normalizedLaps;
    expect(laps.length).toBe(4);

    // Sorted by time ASC: 1.2s, 2.5s, 2.8s, 3.0s
    expect(laps[0].lapTime).toBe(1.2);
    expect(laps[0].driverName).toBe("Alice");
    expect(laps[0].lapNumber).toBe(2);
    expect(laps[0].isFastest).toBeTrue();
    expect(laps[0].countTowardsRecords).toBeTrue();

    expect(laps[1].lapTime).toBe(2.5);
    expect(laps[1].driverName).toBe("Alice");
    expect(laps[1].lapNumber).toBe(1);
    expect(laps[1].isFastest).toBeFalse();
    expect(laps[1].countTowardsRecords).toBeTrue();

    expect(laps[2].lapTime).toBe(2.8);
    expect(laps[2].driverName).toBe("Bob");
    expect(laps[2].lapNumber).toBe(1);
    expect(laps[2].isFastest).toBeTrue();
    expect(laps[2].countTowardsRecords).toBeTrue();

    expect(laps[3].lapTime).toBe(3.0);
    expect(laps[3].driverName).toBe("Alice");
    expect(laps[3].lapNumber).toBe(3);
    expect(laps[3].isFastest).toBeFalse();
    expect(laps[3].countTowardsRecords).toBeFalse();
  });

  it("should support independent filters: heat, driver, and lane changes do not reset each other", () => {
    component.onHeatChange(1);
    expect(component.selectedHeatNumber).toBe(1);
    expect(component.selectedDriverName).toBe("");
    expect(component.selectedLaneIndex).toBe(-1);

    component.onDriverChange("Alice");
    expect(component.selectedHeatNumber).toBe(1);
    expect(component.selectedDriverName).toBe("Alice");
    expect(component.selectedLaneIndex).toBe(-1);

    component.onLaneChange(0);
    expect(component.selectedHeatNumber).toBe(1);
    expect(component.selectedDriverName).toBe("Alice");
    expect(component.selectedLaneIndex).toBe(0);

    // Changing heat does NOT reset driver or lane
    component.onHeatChange(-1);
    expect(component.selectedHeatNumber).toBe(-1);
    expect(component.selectedDriverName).toBe("Alice");
    expect(component.selectedLaneIndex).toBe(0);

    // Laps should match Alice on lane 0 across all heats
    const laps = component.normalizedLaps;
    expect(laps.length).toBe(3);
    expect(
      laps.every((l) => l.driverName === "Alice" && l.laneIndex === 0),
    ).toBeTrue();
  });

  it("should filter by driver name and unassigned drivers correctly", () => {
    component.onDriverChange("Bob");
    let laps = component.normalizedLaps;
    expect(laps.length).toBe(1);
    expect(laps[0].driverName).toBe("Bob");

    component.onDriverChange("Charlie");
    laps = component.normalizedLaps;
    expect(laps.length).toBe(0);

    component.onDriverChange("");
    laps = component.normalizedLaps;
    expect(laps.length).toBe(4);
  });

  it("should sort table by primary column and use time ascending as secondary sort", () => {
    // 1. Sort by Driver ascending: Alice (3 laps: 1.2, 2.5, 3.0), Bob (1 lap: 2.8)
    component.onSort("driver");
    expect(component.sortColumn).toBe("driver");
    expect(component.sortDirection).toBe("asc");
    let laps = component.normalizedLaps;
    expect(laps[0].driverName).toBe("Alice");
    expect(laps[0].lapTime).toBe(1.2);
    expect(laps[1].driverName).toBe("Alice");
    expect(laps[1].lapTime).toBe(2.5);
    expect(laps[2].driverName).toBe("Alice");
    expect(laps[2].lapTime).toBe(3.0);
    expect(laps[3].driverName).toBe("Bob");
    expect(laps[3].lapTime).toBe(2.8);

    // 2. Sort by Driver descending: Bob first (2.8), then Alice with secondary sort Time ASC (1.2, 2.5, 3.0)
    component.onSort("driver");
    expect(component.sortColumn).toBe("driver");
    expect(component.sortDirection).toBe("desc");
    laps = component.normalizedLaps;
    expect(laps[0].driverName).toBe("Bob");
    expect(laps[1].driverName).toBe("Alice");
    expect(laps[1].lapTime).toBe(1.2);
    expect(laps[2].driverName).toBe("Alice");
    expect(laps[2].lapTime).toBe(2.5);
    expect(laps[3].driverName).toBe("Alice");
    expect(laps[3].lapTime).toBe(3.0);

    // 3. Sort by Heat ascending: all in Heat 1, secondary sort Time ASC
    component.onSort("heat");
    expect(component.sortColumn).toBe("heat");
    expect(component.sortDirection).toBe("asc");
    laps = component.normalizedLaps;
    expect(laps[0].lapTime).toBe(1.2);
    expect(laps[1].lapTime).toBe(2.5);
    expect(laps[2].lapTime).toBe(2.8);
    expect(laps[3].lapTime).toBe(3.0);

    // 4. Sort by Lane ascending: Lane 0 (Alice: 1.2, 2.5, 3.0), Lane 1 (Bob: 2.8)
    component.onSort("lane");
    expect(component.sortColumn).toBe("lane");
    expect(component.sortDirection).toBe("asc");
    laps = component.normalizedLaps;
    expect(laps[0].laneIndex).toBe(0);
    expect(laps[0].lapTime).toBe(1.2);
    expect(laps[1].laneIndex).toBe(0);
    expect(laps[1].lapTime).toBe(2.5);
    expect(laps[2].laneIndex).toBe(0);
    expect(laps[2].lapTime).toBe(3.0);
    expect(laps[3].laneIndex).toBe(1);
    expect(laps[3].lapTime).toBe(2.8);

    // 5. Sort by Lap # ascending:
    // Lap 1s: Alice Lap 1 (2.5), Bob Lap 1 (2.8) -> secondary Time ASC
    // Lap 2: Alice Lap 2 (1.2)
    // Lap 3: Alice Lap 3 (3.0)
    component.onSort("lap");
    expect(component.sortColumn).toBe("lap");
    expect(component.sortDirection).toBe("asc");
    laps = component.normalizedLaps;
    expect(laps[0].lapNumber).toBe(1);
    expect(laps[0].lapTime).toBe(2.5);
    expect(laps[1].lapNumber).toBe(1);
    expect(laps[1].lapTime).toBe(2.8);
    expect(laps[2].lapNumber).toBe(2);
    expect(laps[2].lapTime).toBe(1.2);
    expect(laps[3].lapNumber).toBe(3);
    expect(laps[3].lapTime).toBe(3.0);

    // 6. Sort by Status: Disallowed (0) first, then Eligible (1), then Fastest (2)
    component.onSort("status");
    expect(component.sortColumn).toBe("status");
    expect(component.sortDirection).toBe("asc");
    laps = component.normalizedLaps;
    expect(laps[0].countTowardsRecords).toBeFalse(); // 3.0s Disallowed
    expect(laps[0].lapTime).toBe(3.0);
    expect(laps[1].lapTime).toBe(2.5); // Eligible (1)
    expect(laps[2].isFastest).toBeTrue(); // Fastest (2) (1.2s vs 2.8s -> Time ASC: 1.2s first)
    expect(laps[2].lapTime).toBe(1.2);
    expect(laps[3].isFastest).toBeTrue();
    expect(laps[3].lapTime).toBe(2.8);

    // 7. Sort by Time descending
    component.onSort("time");
    expect(component.sortColumn).toBe("time");
    expect(component.sortDirection).toBe("asc");
    component.onSort("time");
    expect(component.sortDirection).toBe("desc");
    laps = component.normalizedLaps;
    expect(laps[0].lapTime).toBe(3.0);
    expect(laps[1].lapTime).toBe(2.8);
    expect(laps[2].lapTime).toBe(2.5);
    expect(laps[3].lapTime).toBe(1.2);

    // 8. Sort by Action
    component.onSort("action");
    expect(component.sortColumn).toBe("action");
    expect(component.sortDirection).toBe("asc");
    expect(component.getAriaSort("action")).toBe("ascending");
    expect(component.getAriaSort("time")).toBe("none");

    // 9. Sort by Date
    component.onSort("date");
    expect(component.sortColumn).toBe("date");
    expect(component.sortDirection).toBe("asc");
  });

  it("should not toggle lap when canEdit is false", () => {
    roleSubject.next(Role.VIEWER);
    const lap = component.normalizedLaps[0];

    component.toggleLapRecord(lap);
    expect(mockDataService.updateLiveLapRecordStatus).not.toHaveBeenCalled();
    expect(mockDataService.updateHistoryLapRecordStatus).not.toHaveBeenCalled();
  });

  it("should toggle live lap record when canEdit is true and raceHistoryId is null", () => {
    roleSubject.next(Role.DIRECTOR);
    spyOn(component.recordsUpdated, "emit");

    // Alice lap 2: lapIndex 1, current countTowardsRecords true
    const lap = component.normalizedLaps.find(
      (l) => l.driverName === "Alice" && l.lapNumber === 2,
    )!;
    component.toggleLapRecord(lap);

    expect(mockDataService.updateLiveLapRecordStatus).toHaveBeenCalledWith(
      1,
      0,
      1,
      false,
    );
    expect(component.recordsUpdated.emit).toHaveBeenCalledWith({
      raceId: undefined,
      heatNumber: 1,
      lane: 0,
      lapIndex: 1,
      countTowardsRecords: false,
    });
  });

  it("should toggle historical lap record when raceHistoryId is present", () => {
    roleSubject.next(Role.DIRECTOR);
    fixture.componentRef.setInput("raceHistoryId", "hist_999");
    spyOn(component.recordsUpdated, "emit");

    // Alice lap 3: lapIndex 2, current countTowardsRecords false
    const lap = component.normalizedLaps.find(
      (l) => l.driverName === "Alice" && l.lapNumber === 3,
    )!;
    component.toggleLapRecord(lap);

    expect(mockDataService.updateHistoryLapRecordStatus).toHaveBeenCalledWith(
      "hist_999",
      1,
      0,
      2,
      true,
      false,
    );
    expect(component.recordsUpdated.emit).toHaveBeenCalledWith({
      raceId: "hist_999",
      heatNumber: 1,
      lane: 0,
      lapIndex: 2,
      countTowardsRecords: true,
    });
  });

  it("should pass isDemo to updateHistoryLapRecordStatus when isDemo is true", () => {
    roleSubject.next(Role.DIRECTOR);
    fixture.componentRef.setInput("raceHistoryId", "hist_999");
    fixture.componentRef.setInput("isDemo", true);

    const lap = component.normalizedLaps.find(
      (l) => l.driverName === "Alice" && l.lapNumber === 1,
    )!;
    component.toggleLapRecord(lap);

    expect(mockDataService.updateHistoryLapRecordStatus).toHaveBeenCalledWith(
      "hist_999",
      1,
      0,
      0,
      false,
      true,
    );
  });

  it("should handle error when toggle fails", () => {
    roleSubject.next(Role.DIRECTOR);
    mockDataService.updateLiveLapRecordStatus.and.returnValue(
      throwError(() => ({ error: { message: "Server error" } })),
    );

    const lap = component.normalizedLaps[0];
    component.toggleLapRecord(lap);

    expect(component.errorMessage).toBe("Server error");
  });

  it("should emit close on onDismiss", () => {
    spyOn(component.close, "emit");
    component.onDismiss();
    expect(component.close.emit).toHaveBeenCalled();
  });

  it("should support live Heat objects with heatDrivers and DriverHeatData instances", () => {
    const liveDriver = {
      laneIndex: 0,
      driver: { name: "Live Driver" },
      lapsWithDetails: [
        {
          time: 3.123,
          driverId: "ld1",
          isDrift: false,
          countTowardsRecords: true,
        },
        {
          time: 2.89,
          driverId: "ld1",
          isDrift: false,
          countTowardsRecords: true,
        },
      ],
      updateLapRecordStatus: jasmine.createSpy("updateLapRecordStatus"),
    };

    const liveHeats = [
      {
        heatNumber: 1,
        heatDrivers: [liveDriver],
      },
    ];

    fixture.componentRef.setInput("heats", liveHeats);
    fixture.detectChanges();

    // Default sort is time ASC -> 2.890 first, then 3.123
    const laps = component.normalizedLaps;
    expect(laps.length).toBe(2);
    expect(laps[0].lapTime).toBe(2.89);
    expect(laps[0].isFastest).toBeTrue();
    expect(laps[1].lapTime).toBe(3.123);
    expect(laps[1].isFastest).toBeFalse();

    // Toggle lap 1 (time 2.890, lapIndex 1)
    roleSubject.next(Role.DIRECTOR);
    component.toggleLapRecord(laps[0]);
    expect(liveDriver.updateLapRecordStatus).toHaveBeenCalledWith(1, false);
  });

  it("should format lap times safely with formatLapTime", () => {
    expect(component.formatLapTime(2.5)).toBe("2.500");
    expect(component.formatLapTime("3.14159")).toBe("3.142");
    expect(component.formatLapTime(NaN)).toBe("0.000");
    expect(component.formatLapTime(null)).toBe("0.000");
    expect(component.formatLapTime(undefined)).toBe("0.000");
    expect(component.formatLapTime("invalid")).toBe("0.000");
  });

  it("should generate a stable tracking key with trackByLap", () => {
    const lap = {
      raceName: "Sprint",
      raceId: "r1",
      heatNumber: 1,
      laneIndex: 2,
      driverName: "Speedy",
      lapIndex: 3,
      lapNumber: 4,
      lapTime: 5.123,
      countTowardsRecords: true,
      isFastest: false,
    };
    expect(component.trackByLap(lap, 0)).toBe("r1-1-2-3-0");
  });

  it("should handle real Heat and DriverHeatData instances with empty lanes without throwing", () => {
    const driver1 = new Driver("drv1", "Bank Farter", "BF");
    const part1 = new RaceParticipant(
      "part1",
      driver1,
      1,
      1,
      7.99,
      7.99,
      7.99,
      7.99,
      1,
      1,
      100,
    );
    const dhd1 = new DriverHeatData("dhd1", part1, 0);
    dhd1.addLapTime(
      1,
      7.99,
      7.99,
      7.99,
      7.99,
      1,
      "drv1",
      false,
      undefined,
      undefined,
      true,
    );

    // Empty lane 1: no driver / empty participant
    const emptyPart = new RaceParticipant(
      "part_empty",
      new Driver("empty", "Empty", ""),
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
    const dhd2 = new DriverHeatData("dhd2", emptyPart, 1);

    // Lane 2: Sports Mode
    const driver3 = new Driver("drv3", "Sports Mode", "SM");
    const part3 = new RaceParticipant(
      "part3",
      driver3,
      2,
      1,
      7.53,
      7.53,
      7.53,
      7.53,
      2,
      2,
      100,
    );
    const dhd3 = new DriverHeatData("dhd3", part3, 2);
    dhd3.addLapTime(
      1,
      7.53,
      7.53,
      7.53,
      7.53,
      1,
      "drv3",
      false,
      undefined,
      undefined,
      true,
    );

    // Lane 3: Bad Cheese with multiple laps
    const driver4 = new Driver("drv4", "Bad Cheese", "BC");
    const part4 = new RaceParticipant(
      "part4",
      driver4,
      3,
      3,
      16.033,
      4.293,
      5.344,
      4.75,
      3,
      3,
      100,
    );
    const dhd4 = new DriverHeatData("dhd4", part4, 3);
    dhd4.addLapTime(
      1,
      6.99,
      6.99,
      6.99,
      6.99,
      1,
      "drv4",
      false,
      undefined,
      undefined,
      true,
    );
    dhd4.addLapTime(
      2,
      4.75,
      5.87,
      5.87,
      4.75,
      2,
      "drv4",
      false,
      undefined,
      undefined,
      true,
    );
    dhd4.addLapTime(
      3,
      4.293,
      5.344,
      4.75,
      4.293,
      3,
      "drv4",
      false,
      undefined,
      undefined,
      true,
    );

    const heat1 = new Heat("heat1", 1, [dhd1, dhd2, dhd3, dhd4], [], true);

    fixture.componentRef.setInput("heats", [heat1]);
    fixture.detectChanges();

    expect(component.normalizedLaps.length).toBe(5);
    const compiled = fixture.nativeElement as HTMLElement;
    const rows = compiled.querySelectorAll(".table-row");
    expect(rows.length).toBe(5);

    // Filter by Lane 3 (Bad Cheese)
    component.onLaneChange(3);
    fixture.detectChanges();
    expect(component.normalizedLaps.length).toBe(3);
    // Fastest lap (4.293) is first because default sort is time ASC
    expect(component.normalizedLaps[0].lapTime).toBe(4.293);
    expect(component.normalizedLaps[0].isFastest).toBeTrue();
  });

  it("should render empty state when no heats or laps are available", () => {
    fixture.componentRef.setInput("heats", []);
    fixture.detectChanges();

    expect(component.normalizedLaps.length).toBe(0);
    const compiled = fixture.nativeElement as HTMLElement;
    const emptyState = compiled.querySelector(".empty-state");
    expect(emptyState).toBeTruthy();
  });

  it("should render 8 column headers in exact order: Date, Driver, Heat, Lane, Lap #, Time, Record Status, Action", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const headerRow = compiled.querySelector(".table-header-row");
    expect(headerRow).toBeTruthy();

    const headers = headerRow!.querySelectorAll(".sortable-header");
    expect(headers.length).toBe(8);

    // Assert exact order of classes
    expect(headers[0].classList.contains("col-date")).toBeTrue();
    expect(headers[1].classList.contains("col-driver")).toBeTrue();
    expect(headers[2].classList.contains("col-heat")).toBeTrue();
    expect(headers[3].classList.contains("col-lane")).toBeTrue();
    expect(headers[4].classList.contains("col-lap")).toBeTrue();
    expect(headers[5].classList.contains("col-time")).toBeTrue();
    expect(headers[6].classList.contains("col-status")).toBeTrue();
    expect(headers[7].classList.contains("col-action")).toBeTrue();

    // Clicking header triggers sort
    (headers[1] as HTMLElement).click();
    fixture.detectChanges();
    expect(component.sortColumn).toBe("driver");
    expect(component.sortDirection).toBe("asc");
    expect(headers[1].classList.contains("is-sorted")).toBeTrue();
  });

  it("should display team subtitle under driver nickname when driver is part of a team", () => {
    const teamDriver = {
      laneIndex: 0,
      participant: {
        driver: { name: "Max Verstappen", nickname: "Max" },
        team: { name: "Red Bull Racing" },
      },
      lapsWithDetails: [
        { time: 1.85, driverId: "mv1", countTowardsRecords: true },
      ],
    };

    fixture.componentRef.setInput("heats", [
      { heatNumber: 1, heatDrivers: [teamDriver] },
    ]);
    fixture.detectChanges();

    const laps = component.normalizedLaps;
    expect(laps.length).toBe(1);
    expect(laps[0].driverName).toBe("Max");
    expect(laps[0].teamName).toBe("Red Bull Racing");

    const compiled = fixture.nativeElement as HTMLElement;
    const driverCell = compiled.querySelector(".driver-cell");
    expect(driverCell).toBeTruthy();

    const nicknameEl = driverCell!.querySelector(".driver-name-text");
    expect(nicknameEl?.textContent?.trim()).toBe("Max");

    const teamSubtitleEl = driverCell!.querySelector(".driver-team-text");
    expect(teamSubtitleEl).toBeTruthy();
    expect(teamSubtitleEl?.textContent?.trim()).toBe("Red Bull Racing");
  });

  it("should resolve driver nickname and team from Java DriverHeatData JSON structure", () => {
    // In Java DriverHeatData serialized JSON, driver is RaceParticipant
    const javaDriverHeatData = {
      lane: 1,
      driver: {
        driver: {
          entityId: "drv_lh",
          name: "Lewis Hamilton",
          nickname: "Lewis",
        },
        team: { entityId: "tm_merc", name: "Mercedes AMG" },
      },
      laps: [{ lapTime: 1.92, driverId: "drv_lh", countTowardsRecords: true }],
    };

    fixture.componentRef.setInput("heats", [
      { heatNumber: 1, drivers: [javaDriverHeatData] },
    ]);
    fixture.detectChanges();

    const laps = component.normalizedLaps;
    expect(laps.length).toBe(1);
    expect(laps[0].driverName).toBe("Lewis");
    expect(laps[0].teamName).toBe("Mercedes AMG");
    expect(laps[0].laneIndex).toBe(1);
  });

  it("should ignore empty lanes when no laps are recorded, but include lanes if laps are recorded", () => {
    const emptyLaneWithoutLaps = {
      laneIndex: 2,
      isEmptyLane: true,
      actualDriver: { entityId: "EMPTY_LANE", name: "Empty", nickname: "" },
      lapsWithDetails: [],
    };

    const emptyLaneWithLaps = {
      laneIndex: 1,
      isEmptyLane: true,
      actualDriver: { entityId: "EMPTY_LANE", name: "Empty", nickname: "" },
      lapsWithDetails: [
        { time: 1.0, driverId: "empty", countTowardsRecords: true },
      ],
    };

    const validDriver = {
      laneIndex: 0,
      actualDriver: { entityId: "drv1", name: "Valid Driver", nickname: "Val" },
      lapsWithDetails: [
        { time: 2.0, driverId: "drv1", countTowardsRecords: true },
      ],
    };

    fixture.componentRef.setInput("heats", [
      {
        heatNumber: 1,
        heatDrivers: [validDriver, emptyLaneWithLaps, emptyLaneWithoutLaps],
      },
    ]);
    fixture.detectChanges();

    const laps = component.normalizedLaps;
    // Lane 0 (Val) and Lane 1 (Driver 2 with laps) should be present; Lane 2 (no laps) ignored
    expect(laps.length).toBe(2);
    expect(laps.some((l) => l.laneIndex === 0)).toBeTrue();
    expect(laps.some((l) => l.laneIndex === 1)).toBeTrue();
    expect(laps.some((l) => l.laneIndex === 2)).toBeFalse();
  });

  it("should display just nickname in table row for individual driver without team", () => {
    const individualDriver = {
      laneIndex: 0,
      actualDriver: { entityId: "drv5", name: "David", nickname: "Bad Cheese" },
      lapsWithDetails: [
        { time: 3.456, driverId: "drv5", countTowardsRecords: true },
      ],
    };

    fixture.componentRef.setInput("heats", [
      { heatNumber: 1, heatDrivers: [individualDriver] },
    ]);
    fixture.detectChanges();

    const laps = component.normalizedLaps;
    expect(laps.length).toBe(1);
    expect(laps[0].driverName).toBe("Bad Cheese");
    expect(laps[0].teamName).toBeUndefined();

    const compiled = fixture.nativeElement as HTMLElement;
    const driverCell = compiled.querySelector(".driver-cell");
    expect(driverCell).toBeTruthy();

    const nicknameEl = driverCell!.querySelector(".driver-name-text");
    expect(nicknameEl?.textContent?.trim()).toBe("Bad Cheese");

    const teamSubtitleEl = driverCell!.querySelector(".driver-team-text");
    expect(teamSubtitleEl).toBeNull();
  });

  it("should fall back to driver name in table row when individual driver has no nickname", () => {
    const individualDriverNoNick = {
      laneIndex: 0,
      actualDriver: { entityId: "drv10", name: "Alice Smith", nickname: "" },
      lapsWithDetails: [
        { time: 4.123, driverId: "drv10", countTowardsRecords: true },
      ],
    };

    fixture.componentRef.setInput("heats", [
      { heatNumber: 1, heatDrivers: [individualDriverNoNick] },
    ]);
    fixture.detectChanges();

    const laps = component.normalizedLaps;
    expect(laps.length).toBe(1);
    expect(laps[0].driverName).toBe("Alice Smith");
    expect(laps[0].teamName).toBeUndefined();

    const compiled = fixture.nativeElement as HTMLElement;
    const driverCell = compiled.querySelector(".driver-cell");
    expect(driverCell).toBeTruthy();

    const nameEl = driverCell!.querySelector(".driver-name-text");
    expect(nameEl?.textContent?.trim()).toBe("Alice Smith");

    const teamSubtitleEl = driverCell!.querySelector(".driver-team-text");
    expect(teamSubtitleEl).toBeNull();
  });

  it("should resolve driver nickname when driver is stored in participant.driver without actualDriver", () => {
    const regularDriver = {
      laneIndex: 0,
      participant: {
        driver: {
          entityId: "drv99",
          name: "David Aufderheide",
          nickname: "Super Dave",
        },
      },
      lapsWithDetails: [
        { time: 3.123, driverId: "", countTowardsRecords: true },
      ],
    };

    fixture.componentRef.setInput("heats", [
      { heatNumber: 1, heatDrivers: [regularDriver] },
    ]);
    fixture.detectChanges();

    const laps = component.normalizedLaps;
    expect(laps.length).toBe(1);
    expect(laps[0].driverName).toBe("Super Dave");
    expect(laps[0].teamName).toBeUndefined();
  });

  it("should render prominent race name and date/time in the header banner", () => {
    const testDate = new Date("2026-09-04T16:45:00Z");
    fixture.componentRef.setInput("raceName", "Records Test #2");
    fixture.componentRef.setInput("raceDate", testDate);
    fixture.componentRef.setInput("isDemo", true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const banner = compiled.querySelector(".race-banner-card");
    expect(banner).toBeTruthy();

    const raceNameEl = banner!.querySelector(".race-name-text");
    expect(raceNameEl?.textContent?.trim()).toBe("Records Test #2");

    const demoBadge = banner!.querySelector(".badge-demo");
    expect(demoBadge).toBeTruthy();

    const dateEl = banner!.querySelector(".race-date-text");
    expect(dateEl).toBeTruthy();
    expect(dateEl?.textContent?.trim().length).toBeGreaterThan(0);

    const trackEl = banner!.querySelector(".race-track-text");
    expect(trackEl?.textContent?.trim()).toBe("Speedway");
  });

  it("should fallback to default race name when raceName is empty", () => {
    fixture.componentRef.setInput("raceName", "");
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const raceNameEl = compiled.querySelector(
      ".race-banner-card .race-name-text",
    );
    expect(raceNameEl?.textContent?.trim()).toBe("RHD_DEFAULT_RACE_NAME");
  });

  it("should derive effectiveRaceDate from heats statistics if raceDate input is not provided", () => {
    fixture.componentRef.setInput("raceDate", undefined);
    const heatWithStats = {
      heatNumber: 1,
      statistics: { startMillis: 1725468300000 },
      drivers: [],
    };
    fixture.componentRef.setInput("heats", [heatWithStats]);
    fixture.detectChanges();

    expect(component.effectiveRaceDate).toBe(1725468300000);

    const compiled = fixture.nativeElement as HTMLElement;
    const dateEl = compiled.querySelector(".race-banner-card .race-date-text");
    expect(dateEl).toBeTruthy();
  });

  it("should parse numeric string timestamp in effectiveRaceDate", () => {
    fixture.componentRef.setInput("raceDate", "1725468300000");
    fixture.detectChanges();

    expect(component.effectiveRaceDate).toBe(1725468300000);
  });

  it("should return null for effectiveRaceDate when no date or stats are present", () => {
    fixture.componentRef.setInput("raceDate", null);
    fixture.componentRef.setInput("heats", [{ heatNumber: 1, drivers: [] }]);
    fixture.detectChanges();

    expect(component.effectiveRaceDate).toBeNull();
    const compiled = fixture.nativeElement as HTMLElement;
    const dateBlock = compiled.querySelector(
      ".race-banner-card .race-date-block",
    );
    expect(dateBlock).toBeNull();
  });

  it("should correctly resolve lane indices and send correct lane in PUT request when driver objects have lane: 0", () => {
    fixture.componentRef.setInput("raceHistoryId", "hist-123");
    fixture.componentRef.setInput("heats", [
      {
        heatNumber: 1,
        drivers: [
          {
            lane: 0, // driver 0 on lane 0
            driver: { name: "Bank Farter" },
            laps: [{ time: 3.1, countTowardsRecords: true }],
          },
          {
            lane: 0, // driver 1 with legacy uninitialized lane 0 -> must resolve to laneIndex 1
            driver: { name: "Sports Mode" },
            laps: [{ time: 3.25, countTowardsRecords: true }],
          },
          {
            lane: 0, // driver 2 with legacy uninitialized lane 0 -> must resolve to laneIndex 2
            driver: { name: "Bad Cheese" },
            laps: [{ time: 3.4, countTowardsRecords: true }],
          },
        ],
      },
    ]);
    fixture.detectChanges();

    const laps = component.normalizedLaps;
    expect(laps.length).toBe(3);
    const bankFarter = laps.find((l) => l.driverName === "Bank Farter");
    const sportsMode = laps.find((l) => l.driverName === "Sports Mode");
    const badCheese = laps.find((l) => l.driverName === "Bad Cheese");

    expect(bankFarter?.laneIndex).toBe(0);
    expect(sportsMode?.laneIndex).toBe(1);
    expect(badCheese?.laneIndex).toBe(2);

    mockDataService.updateHistoryLapRecordStatus.and.returnValue(
      of({ bestLapTime: 3.25 }),
    );

    roleSubject.next(Role.DIRECTOR);

    // Toggle lap for Sports Mode (lane index 1)
    component.toggleLapRecord(sportsMode!);

    expect(mockDataService.updateHistoryLapRecordStatus).toHaveBeenCalledWith(
      "hist-123",
      1, // heatNumber
      1, // laneIndex (NOT 0!)
      0, // lapIndex
      false,
      false,
    );
  });

  it("should support multi-race input, filter by specific race or all races, and display race name and date", () => {
    const multiRaces = [
      {
        _id: "race_run_1",
        name: "Sprint 2026",
        timestamp: new Date("2026-05-01T10:00:00Z").getTime(),
        heats: [
          {
            heatNumber: 1,
            drivers: [
              {
                laneIndex: 0,
                driver: { name: "Racer One" },
                lapsWithDetails: [{ time: 2.1, countTowardsRecords: true }],
              },
            ],
          },
        ],
      },
      {
        _id: "race_run_2",
        name: "Sprint 2026",
        timestamp: new Date("2026-06-01T10:00:00Z").getTime(),
        heats: [
          {
            heatNumber: 1,
            drivers: [
              {
                laneIndex: 1,
                driver: { name: "Racer Two" },
                lapsWithDetails: [{ time: 1.9, countTowardsRecords: true }],
              },
            ],
          },
        ],
      },
    ];

    fixture.componentRef.setInput("races", multiRaces);
    fixture.detectChanges();

    // 1. Available race options
    expect(component.availableRaceOptions.length).toBe(2);
    expect(component.availableRaceOptions[0].id).toBe("race_run_1");
    expect(component.availableRaceOptions[1].id).toBe("race_run_2");

    // Verify date select dropdown is rendered and options only display dates (no race names)
    const compiled = fixture.nativeElement as HTMLElement;
    const dateSelect = compiled.querySelector("#dlr-date-select");
    expect(dateSelect).toBeTruthy();
    const dateOptions = compiled.querySelectorAll(".date-option-item");
    expect(dateOptions.length).toBe(2);
    for (let i = 0; i < dateOptions.length; i++) {
      expect(dateOptions[i].textContent).not.toContain("Sprint Race");
      expect(dateOptions[i].textContent).not.toContain("Endurance Race");
    }

    // 2. Default: All Races (selectedRaceId === "")
    expect(component.selectedRaceId).toBe("");
    expect(component.normalizedLaps.length).toBe(2);
    expect(component.bannerDateDisplay).toContain("–");

    // 3. Filter down to race_run_1
    component.onRaceChange("race_run_1");
    expect(component.selectedRaceId).toBe("race_run_1");
    expect(component.normalizedLaps.length).toBe(1);
    expect(component.normalizedLaps[0].driverName).toBe("Racer One");
    expect(component.normalizedLaps[0].raceId).toBe("race_run_1");

    // 4. Filter down to race_run_2
    component.onRaceChange("race_run_2");
    expect(component.normalizedLaps.length).toBe(1);
    expect(component.normalizedLaps[0].driverName).toBe("Racer Two");
    expect(component.normalizedLaps[0].raceId).toBe("race_run_2");

    // 5. Back to all races
    component.onRaceChange("");
    expect(component.normalizedLaps.length).toBe(2);

    // 6. Toggling lap record uses lap.raceId
    roleSubject.next(Role.DIRECTOR);
    const lapToToggle = component.normalizedLaps[0];
    component.toggleLapRecord(lapToToggle);
    expect(mockDataService.updateHistoryLapRecordStatus).toHaveBeenCalledWith(
      lapToToggle.raceId!,
      lapToToggle.heatNumber,
      lapToToggle.laneIndex,
      lapToToggle.lapIndex,
      false,
      false,
    );
  });

  it("should show only demo mode lap times when opened with demo races, and only real lap times when opened with real races", () => {
    const demoRaces = [
      {
        _id: "demo_race_run",
        name: "Test Race",
        is_demo: true,
        timestamp: 1000,
        heats: [
          {
            heatNumber: 1,
            drivers: [
              {
                laneIndex: 0,
                driver: { name: "Demo Driver" },
                lapsWithDetails: [{ time: 4.5, countTowardsRecords: true }],
              },
            ],
          },
        ],
      },
    ];

    const prodRaces = [
      {
        _id: "real_race_run",
        name: "Test Race",
        is_demo: false,
        timestamp: 2000,
        heats: [
          {
            heatNumber: 1,
            drivers: [
              {
                laneIndex: 0,
                driver: { name: "Real Driver" },
                lapsWithDetails: [{ time: 3.8, countTowardsRecords: true }],
              },
            ],
          },
        ],
      },
    ];

    // 1. When opened with demo race
    fixture.componentRef.setInput("races", demoRaces);
    fixture.componentRef.setInput("isDemo", true);
    fixture.detectChanges();

    expect(component.isDemo()).toBeTrue();
    expect(component.normalizedLaps.length).toBe(1);
    expect(component.normalizedLaps[0].driverName).toBe("Demo Driver");
    expect(component.normalizedLaps[0].raceId).toBe("demo_race_run");

    // 2. When opened with real race
    fixture.componentRef.setInput("races", prodRaces);
    fixture.componentRef.setInput("isDemo", false);
    fixture.detectChanges();

    expect(component.isDemo()).toBeFalse();
    expect(component.normalizedLaps.length).toBe(1);
    expect(component.normalizedLaps[0].driverName).toBe("Real Driver");
    expect(component.normalizedLaps[0].raceId).toBe("real_race_run");
  });

  describe("Colour Coded Fastest Lap Records (Gold, Silver, Bronze)", () => {
    it("should correctly classify Gold (Overall Lane Record), Silver (Race Lane Record), and Bronze (Driver Best)", () => {
      const testHeats = [
        {
          heatNumber: 1,
          drivers: [
            {
              laneIndex: 0,
              driver: { name: "Alice" },
              lapsWithDetails: [
                { time: 1.2, countTowardsRecords: true },
                { time: 1.5, countTowardsRecords: true },
              ],
            },
            {
              laneIndex: 1,
              driver: { name: "Bob" },
              lapsWithDetails: [{ time: 2.0, countTowardsRecords: true }],
            },
          ],
        },
        {
          heatNumber: 2,
          drivers: [
            {
              laneIndex: 0,
              driver: { name: "Charlie" },
              lapsWithDetails: [{ time: 1.4, countTowardsRecords: true }],
            },
            {
              laneIndex: 1,
              driver: { name: "Dave" },
              lapsWithDetails: [{ time: 2.2, countTowardsRecords: true }],
            },
          ],
        },
      ];

      const mockRecordData = {
        overall: {
          laneFastestLap: [
            { value: 1.3 }, // Lane 0 baseline
            { value: 1.8 }, // Lane 1 baseline
          ],
        },
      };

      fixture.componentRef.setInput("heats", testHeats);
      fixture.componentRef.setInput("recordData", mockRecordData);
      fixture.detectChanges();

      const laps = component.normalizedLaps;
      expect(laps.length).toBe(5);

      // 1. Alice 1.2s on Lane 0 (Faster than 1.3s baseline -> Gold)
      const lapAliceGold = laps.find(
        (l) => l.driverName === "Alice" && l.lapTime === 1.2,
      )!;
      expect(lapAliceGold.recordTier).toBe("gold");
      expect(lapAliceGold.isOverallLaneRecord).toBeTrue();
      expect(lapAliceGold.isRaceLaneRecord).toBeTrue();
      expect(lapAliceGold.isDriverBest).toBeTrue();
      expect(lapAliceGold.isFastest).toBeTrue();

      // 2. Bob 2.0s on Lane 1 (Fastest on Lane 1 in race, but slower than 1.8s overall baseline -> Silver)
      const lapBobSilver = laps.find(
        (l) => l.driverName === "Bob" && l.lapTime === 2.0,
      )!;
      expect(lapBobSilver.recordTier).toBe("silver");
      expect(lapBobSilver.isOverallLaneRecord).toBeFalse();
      expect(lapBobSilver.isRaceLaneRecord).toBeTrue();
      expect(lapBobSilver.isDriverBest).toBeTrue();
      expect(lapBobSilver.isFastest).toBeTrue();

      // 3. Charlie 1.4s on Lane 0 (Charlie's best in race, but Alice was faster on Lane 0 -> Bronze)
      const lapCharlieBronze = laps.find(
        (l) => l.driverName === "Charlie" && l.lapTime === 1.4,
      )!;
      expect(lapCharlieBronze.recordTier).toBe("bronze");
      expect(lapCharlieBronze.isOverallLaneRecord).toBeFalse();
      expect(lapCharlieBronze.isRaceLaneRecord).toBeFalse();
      expect(lapCharlieBronze.isDriverBest).toBeTrue();
      expect(lapCharlieBronze.isFastest).toBeTrue();

      // 4. Dave 2.2s on Lane 1 (Dave's best in race -> Bronze)
      const lapDaveBronze = laps.find(
        (l) => l.driverName === "Dave" && l.lapTime === 2.2,
      )!;
      expect(lapDaveBronze.recordTier).toBe("bronze");
      expect(lapDaveBronze.isOverallLaneRecord).toBeFalse();
      expect(lapDaveBronze.isRaceLaneRecord).toBeFalse();
      expect(lapDaveBronze.isDriverBest).toBeTrue();
      expect(lapDaveBronze.isFastest).toBeTrue();

      // 5. Alice 1.5s on Lane 0 (Not personal best, not lane best -> Eligible)
      const lapAliceEligible = laps.find(
        (l) => l.driverName === "Alice" && l.lapTime === 1.5,
      )!;
      expect(lapAliceEligible.recordTier).toBeNull();
      expect(lapAliceEligible.isOverallLaneRecord).toBeFalse();
      expect(lapAliceEligible.isRaceLaneRecord).toBeFalse();
      expect(lapAliceEligible.isDriverBest).toBeFalse();
      expect(lapAliceEligible.isFastest).toBeFalse();
      expect(lapAliceEligible.countTowardsRecords).toBeTrue();

      // Verify DOM classes and badges render accurately
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector(".badge-gold")).toBeTruthy();
      expect(compiled.querySelector(".badge-silver")).toBeTruthy();
      expect(compiled.querySelector(".badge-bronze")).toBeTruthy();
      expect(compiled.querySelector(".badge-eligible")).toBeTruthy();
      expect(compiled.querySelector(".row-gold")).toBeTruthy();
      expect(compiled.querySelector(".row-silver")).toBeTruthy();
      expect(compiled.querySelector(".row-bronze")).toBeTruthy();
    });

    it("should dynamically recalculate tiers when a Gold lap is disallowed", () => {
      const testHeats = [
        {
          heatNumber: 1,
          drivers: [
            {
              laneIndex: 0,
              driver: { name: "Alice" },
              lapsWithDetails: [{ time: 1.2, countTowardsRecords: true }],
            },
          ],
        },
        {
          heatNumber: 2,
          drivers: [
            {
              laneIndex: 0,
              driver: { name: "Charlie" },
              lapsWithDetails: [{ time: 1.4, countTowardsRecords: true }],
            },
          ],
        },
      ];

      fixture.componentRef.setInput("heats", testHeats);
      fixture.componentRef.setInput("recordData", null);
      fixture.detectChanges();

      let laps = component.normalizedLaps;
      expect(laps[0].lapTime).toBe(1.2);
      expect(laps[0].recordTier).toBe("gold");
      expect(laps[1].lapTime).toBe(1.4);
      expect(laps[1].recordTier).toBe("bronze");

      // Disallow the Gold lap
      testHeats[0].drivers[0].lapsWithDetails[0].countTowardsRecords = false;
      fixture.detectChanges();

      laps = component.normalizedLaps;
      const disallowedLap = laps.find((l) => l.lapTime === 1.2)!;
      const promotedLap = laps.find((l) => l.lapTime === 1.4)!;

      expect(disallowedLap.countTowardsRecords).toBeFalse();
      expect(disallowedLap.recordTier).toBeNull();
      expect(disallowedLap.isFastest).toBeFalse();

      // Charlie's 1.4s is now the fastest eligible lap on Lane 0 -> Gold!
      expect(promotedLap.countTowardsRecords).toBeTrue();
      expect(promotedLap.recordTier).toBe("gold");
      expect(promotedLap.isOverallLaneRecord).toBeTrue();
    });

    it("should sort correctly by status through all tiers: Disallowed (0) -> Eligible (1) -> Bronze (2) -> Silver (3) -> Gold (4)", () => {
      const testHeats = [
        {
          heatNumber: 1,
          drivers: [
            {
              laneIndex: 0,
              driver: { name: "Racer" },
              lapsWithDetails: [
                { time: 1.0, countTowardsRecords: true }, // Gold (Lane 0 best)
                { time: 2.0, countTowardsRecords: true }, // Eligible
                { time: 3.0, countTowardsRecords: false }, // Disallowed
              ],
            },
            {
              laneIndex: 1,
              driver: { name: "DriverB" },
              lapsWithDetails: [
                { time: 1.5, countTowardsRecords: true }, // Silver (Lane 1 best in race, but slower than baseline 1.1s)
              ],
            },
            {
              laneIndex: 0,
              driver: { name: "DriverC" },
              lapsWithDetails: [
                { time: 1.2, countTowardsRecords: true }, // Bronze (DriverC best)
              ],
            },
          ],
        },
      ];

      const mockRecordData = {
        overall: {
          laneFastestLap: [
            { value: 1.0 }, // Lane 0 baseline
            { value: 1.1 }, // Lane 1 baseline (so 1.5s is Silver, not Gold)
          ],
        },
      };

      fixture.componentRef.setInput("heats", testHeats);
      fixture.componentRef.setInput("recordData", mockRecordData);
      fixture.detectChanges();

      // Sort by status ascending: Disallowed (0) -> Eligible (1) -> Bronze (2) -> Silver (3) -> Gold (4)
      component.onSort("status");
      fixture.detectChanges();

      const lapsAsc = component.normalizedLaps;
      expect(lapsAsc[0].countTowardsRecords).toBeFalse(); // Disallowed
      expect(lapsAsc[1].recordTier).toBeNull(); // Eligible
      expect(lapsAsc[2].recordTier).toBe("bronze"); // Bronze
      expect(lapsAsc[3].recordTier).toBe("silver"); // Silver
      expect(lapsAsc[4].recordTier).toBe("gold"); // Gold

      // Sort by status descending: Gold (4) -> Silver (3) -> Bronze (2) -> Eligible (1) -> Disallowed (0)
      component.onSort("status");
      fixture.detectChanges();

      const lapsDesc = component.normalizedLaps;
      expect(lapsDesc[0].recordTier).toBe("gold"); // Gold
      expect(lapsDesc[1].recordTier).toBe("silver"); // Silver
      expect(lapsDesc[2].recordTier).toBe("bronze"); // Bronze
      expect(lapsDesc[3].recordTier).toBeNull(); // Eligible
      expect(lapsDesc[4].countTowardsRecords).toBeFalse(); // Disallowed
    });
  });
});
