import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import { BehaviorSubject, of, throwError } from "rxjs";
import { DataService } from "@app/data.service";
import { Role } from "@app/models/role";
import { AuthService } from "@app/services/auth.service";
import { TranslationService } from "@app/services/translation.service";

import { RaceHistoryDialogComponent } from "./race-history-dialog.component";

describe("RaceHistoryDialogComponent", () => {
  let component: RaceHistoryDialogComponent;
  let fixture: ComponentFixture<RaceHistoryDialogComponent>;
  let mockDataService: jasmine.SpyObj<DataService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let roleSubject: BehaviorSubject<Role>;
  let mockAuthService: { currentRole$: BehaviorSubject<Role> };

  const mockHistories = [
    {
      _id: "hist_1",
      entity_id: "race_1",
      model: { name: "Grand Prix A" },
      track: { name: "Thunder Track" },
      is_demo: false,
      heats: [
        {
          heatNumber: 1,
          drivers: [
            {
              laps: [{ lapTime: 5.2, countTowardsRecords: true }],
            },
          ],
        },
      ],
      drivers: [{ driver: { name: "Alice" } }],
      timestamp: 1000,
    },
    {
      _id: "hist_2",
      entity_id: "race_2",
      model: { name: "Sprint Cup" },
      track: { name: "Speedway" },
      is_demo: true,
      heats: [
        {
          heatNumber: 1,
          drivers: [
            {
              laps: [{ lapTime: 4.8, countTowardsRecords: true }],
            },
          ],
        },
      ],
      drivers: [{ driver: { name: "Bob" } }],
      timestamp: 2000,
    },
  ];

  beforeEach(async () => {
    mockDataService = jasmine.createSpyObj("DataService", [
      "getAllFinishedRaceHistory",
      "getRaceHistoryById",
      "updateLiveLapRecordStatus",
      "updateHistoryLapRecordStatus",
      "loadRaceHistory",
      "exportRaceHistoryToCsv",
      "updateHistoryLapSections",
    ]);
    mockDataService.getAllFinishedRaceHistory.and.returnValue(
      of(mockHistories),
    );
    mockDataService.getRaceHistoryById.and.returnValue(of(mockHistories[0]));
    mockDataService.loadRaceHistory.and.returnValue(of({} as any));
    mockDataService.exportRaceHistoryToCsv.and.returnValue(of("csv data"));
    mockDataService.updateHistoryLapSections.and.returnValue(of({} as any));

    mockRouter = jasmine.createSpyObj("Router", ["navigate"]);

    roleSubject = new BehaviorSubject<Role>(Role.VIEWER);
    mockAuthService = {
      currentRole$: roleSubject,
    };

    const mockTranslationService = {
      translate: (key: string) => key,
      get: (key: string) => of(key),
    };

    await TestBed.configureTestingModule({
      imports: [RaceHistoryDialogComponent],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RaceHistoryDialogComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();
  });

  it("should create the component", () => {
    expect(component).toBeTruthy();
    expect(component.canEdit).toBeFalse();
  });

  it("should update canEdit when role changes", () => {
    roleSubject.next(Role.DIRECTOR);
    expect(component.canEdit).toBeTrue();
  });

  it("should load race histories on visible change", () => {
    fixture.componentRef.setInput("visible", true);
    component.ngOnChanges({
      visible: {
        currentValue: true,
        previousValue: false,
        firstChange: false,
        isFirstChange: () => false,
      },
    });

    expect(mockDataService.getAllFinishedRaceHistory).toHaveBeenCalled();
    expect(component.raceHistories.length).toBe(2);
    // Should be sorted by timestamp descending
    expect(component.raceHistories[0]._id).toBe("hist_2");
    expect(component.raceHistories[1]._id).toBe("hist_1");
  });

  it("should filter race histories by search term", () => {
    component.raceHistories = [...mockHistories];

    component.searchTerm = "Grand";
    expect(component.filteredHistories.length).toBe(1);
    expect(component.filteredHistories[0].raceName).toBe("Grand Prix A");

    component.searchTerm = "Speedway";
    expect(component.filteredHistories.length).toBe(1);
    expect(component.filteredHistories[0].raceName).toBe("Sprint Cup");

    component.searchTerm = "NonExistent";
    expect(component.filteredHistories.length).toBe(0);
  });

  it("should fetch full details and open disallow dialog on editRaceLaps", () => {
    component.editRaceLaps(mockHistories[0]);

    expect(mockDataService.getRaceHistoryById).toHaveBeenCalledWith(
      "hist_1",
      false,
    );
    expect(component.showDisallowDialog).toBeTrue();
    expect(component.selectedHistoryDetails).toEqual(mockHistories[0]);
  });

  it("should preserve is_demo on selectedHistoryDetails when editing a demo race", () => {
    mockDataService.getRaceHistoryById.and.returnValue(
      of({ ...mockHistories[1] }),
    );
    component.editRaceLaps(mockHistories[1]);

    expect(mockDataService.getRaceHistoryById).toHaveBeenCalledWith(
      "hist_2",
      true,
    );
    expect(component.showDisallowDialog).toBeTrue();
    expect(component.selectedHistoryDetails.is_demo).toBeTrue();
  });

  it("should fall back to summary item if getRaceHistoryById fails", () => {
    mockDataService.getRaceHistoryById.and.returnValue(
      throwError(() => new Error("Not found")),
    );

    component.editRaceLaps(mockHistories[1]);

    expect(component.showDisallowDialog).toBeTrue();
    expect(component.selectedHistoryDetails).toEqual(mockHistories[1]);
  });

  it("should close disallow dialog and reload histories", () => {
    spyOn(component, "loadHistories");
    component.showDisallowDialog = true;
    component.selectedHistoryDetails = mockHistories[0];

    component.closeDisallowDialog();

    expect(component.showDisallowDialog).toBeFalse();
    expect(component.selectedHistoryDetails).toBeNull();
    expect(component.loadHistories).toHaveBeenCalled();
  });

  it("should update ineligible lap count on recordsUpdated event", () => {
    component.raceHistories = [
      {
        _id: "race_test_1",
        heats: [
          {
            heatNumber: 1,
            drivers: [
              {
                lane: 0,
                laps: [
                  { countTowardsRecords: true },
                  { countTowardsRecords: true },
                ],
              },
            ],
          },
        ],
        ineligible_lap_count: 0,
      },
    ];
    component.selectedHistoryDetails = component.raceHistories[0];

    component.onRecordsUpdated({
      heatNumber: 1,
      lane: 0,
      lapIndex: 1,
      countTowardsRecords: false,
    });

    expect(component.raceHistories[0].ineligible_lap_count).toBe(1);
    expect(component.raceHistories[0].ineligibleLapCount).toBe(1);
  });

  it("should calculate ineligible lap count correctly using getIneligibleLapCount", () => {
    expect(component.getIneligibleLapCount(null)).toBe(0);
    expect(component.getIneligibleLapCount({})).toBe(0);

    // Prioritize server property
    expect(component.getIneligibleLapCount({ ineligible_lap_count: 4 })).toBe(
      4,
    );
    expect(component.getIneligibleLapCount({ ineligibleLapCount: 2 })).toBe(2);

    // Calculate from heats when property not preset
    const raceWithHeats = {
      heats: [
        {
          drivers: [
            {
              laps: [
                { countTowardsRecords: true },
                { countTowardsRecords: false },
              ],
            },
            {
              laps: [
                { count_towards_records: false },
                { count_towards_records: true },
              ],
            },
          ],
        },
        {
          drivers: [
            {
              laps: [{ countTowardsRecords: false }],
            },
          ],
        },
      ],
    };

    expect(component.getIneligibleLapCount(raceWithHeats)).toBe(3);
  });

  it("should render ineligible lap count badge in the DOM", () => {
    component.raceHistories = [
      {
        _id: "hist_none",
        model: { name: "Clean Race" },
        track: { name: "Track A" },
        ineligible_lap_count: 0,
        heats: [
          {
            heatNumber: 1,
            drivers: [
              {
                laps: [{ lapTime: 4.0, countTowardsRecords: true }],
              },
            ],
          },
        ],
      },
      {
        _id: "hist_some",
        model: { name: "Flagged Race" },
        track: { name: "Track B" },
        ineligible_lap_count: 2,
        heats: [
          {
            heatNumber: 1,
            drivers: [
              {
                laps: [{ lapTime: 4.0, countTowardsRecords: true }],
              },
            ],
          },
        ],
      },
    ];
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const metaBadges = compiled.querySelectorAll(".meta-ineligible-laps");
    expect(metaBadges.length).toBe(2);

    // First race has 0 ineligible laps: should not have has-ineligible class
    expect(metaBadges[0].classList.contains("has-ineligible")).toBeFalse();
    expect(metaBadges[0].textContent).toContain("RHD_INELIGIBLE_LAPS_COUNT");

    // Second race has 2 ineligible laps: should have has-ineligible class
    expect(metaBadges[1].classList.contains("has-ineligible")).toBeTrue();
    expect(metaBadges[1].textContent).toContain("RHD_INELIGIBLE_LAPS_COUNT");
  });

  it("should use singular translation key when ineligible lap count is 1", () => {
    component.raceHistories = [
      {
        _id: "hist_single",
        model: { name: "Single Ineligible Race" },
        track: { name: "Track C" },
        ineligible_lap_count: 1,
        heats: [
          {
            heatNumber: 1,
            drivers: [
              {
                laps: [{ lapTime: 4.0, countTowardsRecords: true }],
              },
            ],
          },
        ],
      },
    ];
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const metaBadge = compiled.querySelector(".meta-ineligible-laps");
    expect(metaBadge).toBeTruthy();
    expect(metaBadge?.classList.contains("has-ineligible")).toBeTrue();
    expect(metaBadge?.textContent).toContain("RHD_INELIGIBLE_LAP_SINGLE");
  });

  it("should emit close on onDismiss", () => {
    spyOn(component.close, "emit");
    component.onDismiss();
    expect(component.close.emit).toHaveBeenCalled();
  });

  it("should resolve timestamp correctly using getRaceTimestamp", () => {
    expect(component.getRaceTimestamp(null)).toBeNull();
    expect(component.getRaceTimestamp({ timestamp: 123456 })).toBe(123456);
    expect(
      component.getRaceTimestamp({ statistics: { startMillis: 789000 } }),
    ).toBe(789000);
    expect(
      component.getRaceTimestamp({
        statistics: { startTime: "2026-08-30T18:00:00Z" },
      }),
    ).toBe("2026-08-30T18:00:00Z");
    expect(
      component.getRaceTimestamp({
        heats: [{ statistics: { startTime: "2026-08-30T19:00:00Z" } }],
      }),
    ).toBe("2026-08-30T19:00:00Z");
  });

  it("should group multiple runs of the same race entity and compute earliest and latest dates", () => {
    component.raceHistories = [
      {
        _id: "run_1",
        entity_id: "club_race_1",
        model: { name: "Club Championship" },
        timestamp: 10000,
        ineligible_lap_count: 1,
        heats: [
          {
            heatNumber: 1,
            drivers: [{ laps: [{ lapTime: 3.5, countTowardsRecords: true }] }],
          },
        ],
      },
      {
        _id: "run_2",
        entity_id: "club_race_1",
        model: { name: "Club Championship" },
        timestamp: 20000,
        ineligible_lap_count: 2,
        heats: [
          {
            heatNumber: 1,
            drivers: [{ laps: [{ lapTime: 3.2, countTowardsRecords: true }] }],
          },
        ],
      },
      {
        _id: "run_3",
        entity_id: "club_race_1",
        model: { name: "Club Championship" },
        timestamp: 30000,
        ineligible_lap_count: 0,
        heats: [
          {
            heatNumber: 1,
            drivers: [{ laps: [{ lapTime: 3.1, countTowardsRecords: true }] }],
          },
        ],
      },
    ];

    const groups = component.groupedHistories;
    expect(groups.length).toBe(1);
    expect(groups[0].raceName).toBe("Club Championship");
    expect(groups[0].earliestDate).toBe(10000);
    expect(groups[0].latestDate).toBe(30000);
    expect(groups[0].ineligibleLapCount).toBe(3);
    expect(groups[0].races.length).toBe(3);
  });

  it("should distinguish between demo races and real races with the same name", () => {
    component.raceHistories = [
      {
        _id: "real_run",
        entity_id: "test_race_id",
        model: { name: "Test Race" },
        is_demo: false,
        timestamp: 5000,
        heats: [
          {
            heatNumber: 1,
            drivers: [{ laps: [{ lapTime: 4.0 }] }],
          },
        ],
      },
      {
        _id: "demo_run",
        entity_id: "test_race_id",
        model: { name: "Test Race" },
        is_demo: true,
        timestamp: 6000,
        heats: [
          {
            heatNumber: 1,
            drivers: [{ laps: [{ lapTime: 4.1 }] }],
          },
        ],
      },
    ];

    const groups = component.groupedHistories;
    expect(groups.length).toBe(2);

    const demoGroup = groups.find((g) => g.isDemo);
    const prodGroup = groups.find((g) => !g.isDemo);

    expect(demoGroup).toBeDefined();
    expect(demoGroup?.raceName).toBe("Test Race");
    expect(demoGroup?.isDemo).toBeTrue();

    expect(prodGroup).toBeDefined();
    expect(prodGroup?.raceName).toBe("Test Race");
    expect(prodGroup?.isDemo).toBeFalse();
  });

  it("should exclude races that have no record data (empty heats or 0 laps)", () => {
    component.raceHistories = [
      {
        _id: "race_with_records",
        model: { name: "Active Race" },
        heats: [
          {
            heatNumber: 1,
            drivers: [{ laps: [{ lapTime: 3.9 }] }],
          },
        ],
      },
      {
        _id: "race_empty_heats",
        model: { name: "Empty Race 1" },
        heats: [],
      },
      {
        _id: "race_no_laps",
        model: { name: "Empty Race 2" },
        heats: [
          {
            heatNumber: 1,
            drivers: [{ laps: [] }],
          },
        ],
      },
      {
        _id: "race_zero_times",
        model: { name: "Zero Time Race" },
        heats: [
          {
            heatNumber: 1,
            drivers: [{ laps: [{ lapTime: 0 }] }],
          },
        ],
      },
    ];

    const groups = component.groupedHistories;
    expect(groups.length).toBe(1);
    expect(groups[0].raceName).toBe("Active Race");
  });

  it("should open disallow lap records dialog with all races in the selected group", () => {
    const group = {
      id: "prod:::group_1",
      raceName: "Multi Run Race",
      isDemo: false,
      earliestDate: 1000,
      latestDate: 2000,
      ineligibleLapCount: 1,
      races: [
        { _id: "run_a", model: { name: "Multi Run Race" } },
        { _id: "run_b", model: { name: "Multi Run Race" } },
      ],
    };

    component.editRaceLaps(group);

    expect(component.showDisallowDialog).toBeTrue();
    expect(component.selectedRaceGroup).toBe(group);
    expect(component.selectedHistoryDetails).toBe(group.races[0]);
  });

  it("should only pass demo races to disallow dialog when demo group is edited, and only real races when real group is edited", () => {
    component.raceHistories = [
      {
        _id: "real_race_1",
        entity_id: "race_entity_123",
        model: { name: "Thunder 500" },
        is_demo: false,
        timestamp: 1000,
        heats: [
          {
            heatNumber: 1,
            drivers: [{ laps: [{ lapTime: 3.5, countTowardsRecords: true }] }],
          },
        ],
      },
      {
        _id: "demo_race_1",
        entity_id: "race_entity_123",
        model: { name: "Thunder 500" },
        is_demo: true,
        timestamp: 2000,
        heats: [
          {
            heatNumber: 1,
            drivers: [{ laps: [{ lapTime: 3.6, countTowardsRecords: true }] }],
          },
        ],
      },
    ];

    const groups = component.groupedHistories;
    const demoGroup = groups.find((g) => g.isDemo)!;
    const prodGroup = groups.find((g) => !g.isDemo)!;

    // 1. Edit Demo Group
    component.editRaceLaps(demoGroup);
    expect(component.selectedRaceGroup?.isDemo).toBeTrue();
    expect(component.selectedRaceGroup?.races.length).toBe(1);
    expect(component.selectedRaceGroup?.races[0]._id).toBe("demo_race_1");
    expect(
      component.selectedRaceGroup?.races.every((r) => r.is_demo),
    ).toBeTrue();

    // 2. Edit Prod Group
    component.editRaceLaps(prodGroup);
    expect(component.selectedRaceGroup?.isDemo).toBeFalse();
    expect(component.selectedRaceGroup?.races.length).toBe(1);
    expect(component.selectedRaceGroup?.races[0]._id).toBe("real_race_1");
    expect(
      component.selectedRaceGroup?.races.every((r) => !r.is_demo),
    ).toBeTrue();
  });

  describe("race run selection and openRace", () => {
    it("should default getSelectedRaceId to the first race in the group", () => {
      const group = component.groupedHistories[0];
      expect(component.getSelectedRaceId(group)).toBe(group.races[0]._id);
      expect(component.getSelectedRace(group)).toBe(group.races[0]);
    });

    it("should update selected race ID when onSelectRaceForGroup is called", () => {
      const group = {
        id: "prod:::multi_group",
        raceName: "Multi Run Race",
        isDemo: false,
        earliestDate: 1000,
        latestDate: 2000,
        ineligibleLapCount: 0,
        races: [
          { _id: "run_alpha", timestamp: 2000 },
          { _id: "run_beta", timestamp: 1000 },
        ],
      };

      expect(component.getSelectedRaceId(group)).toBe("run_alpha");
      expect(component.getSelectedRace(group)).toBe(group.races[0]);

      component.onSelectRaceForGroup(group.id, "run_beta");
      expect(component.getSelectedRaceId(group)).toBe("run_beta");
      expect(component.getSelectedRace(group)).toBe(group.races[1]);
    });

    it("should call loadRaceHistory and navigate to /raceday on success", () => {
      const closeSpy = spyOn(component.close, "emit");
      const group = component.groupedHistories[0];

      component.openRace(group);

      expect(mockDataService.loadRaceHistory).toHaveBeenCalledWith(
        group.races[0]._id,
        group.isDemo,
      );
      expect(closeSpy).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(["/raceday"]);
    });

    it("should load the specifically selected run when user picks a different run in group", () => {
      const closeSpy = spyOn(component.close, "emit");
      const group = {
        id: "prod:::custom_runs",
        raceName: "Custom Runs",
        isDemo: true,
        earliestDate: 500,
        latestDate: 1500,
        ineligibleLapCount: 0,
        races: [
          { _id: "run_1", timestamp: 1500 },
          { _id: "run_2", timestamp: 500 },
        ],
      };

      component.onSelectRaceForGroup(group.id, "run_2");
      component.openRace(group);

      expect(mockDataService.loadRaceHistory).toHaveBeenCalledWith(
        "run_2",
        true,
      );
      expect(closeSpy).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(["/raceday"]);
    });

    it("should handle loadRaceHistory error gracefully", () => {
      mockDataService.loadRaceHistory.and.returnValue(
        throwError(() => new Error("Network error")),
      );
      const closeSpy = spyOn(component.close, "emit");
      const group = component.groupedHistories[0];

      component.openRace(group);

      expect(mockDataService.loadRaceHistory).toHaveBeenCalled();
      expect(component.isLoadingDetails).toBeFalse();
      expect(closeSpy).not.toHaveBeenCalled();
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it("should use selected race run when editing race laps in a group", () => {
      const group = {
        id: "prod:::edit_group",
        raceName: "Edit Group",
        isDemo: false,
        earliestDate: 100,
        latestDate: 200,
        ineligibleLapCount: 0,
        races: [
          { _id: "run_edit_1", model: { name: "Edit Group" } },
          { _id: "run_edit_2", model: { name: "Edit Group" } },
        ],
      };

      component.onSelectRaceForGroup(group.id, "run_edit_2");
      component.editRaceLaps(group);

      expect(component.showDisallowDialog).toBeTrue();
      expect(component.selectedHistoryDetails).toBe(group.races[1]);
    });

    it("should deduplicate multiple history records with matching run timestamps", () => {
      component.raceHistories = [
        {
          _id: "rec_orig",
          entity_id: "race_same",
          timestamp: 5000,
          heats: [
            {
              heatNumber: 1,
              drivers: [
                {
                  laps: [{ lapTime: 4.0 }],
                  adjustedLapCount: 5,
                  userLaps: 0,
                },
              ],
            },
          ],
        },
        {
          _id: "rec_edited",
          entity_id: "race_same",
          timestamp: 5000,
          heats: [
            {
              heatNumber: 1,
              drivers: [
                {
                  laps: [{ lapTime: 4.0 }],
                  adjustedLapCount: 5,
                  userLaps: 3,
                },
              ],
            },
          ],
        },
      ];

      const groups = component.groupedHistories;
      expect(groups.length).toBe(1);
      expect(groups[0].races.length).toBe(1);
      expect(groups[0].races[0]._id).toBe("rec_edited");
    });
  });
});
