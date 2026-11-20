import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of, throwError } from "rxjs";
import { DataService } from "@app/data.service";
import {
  RacePackageCommitRequest,
  RacePackagePreview,
  RacePackageResult,
} from "@app/models/race-package.model";
import { Season } from "@app/models/season";
import { TranslationService } from "@app/services/translation.service";

import { RacePackageModalComponent } from "./race-package-modal.component";

describe("RacePackageModalComponent", () => {
  let component: RacePackageModalComponent;
  let fixture: ComponentFixture<RacePackageModalComponent>;
  let mockDataService: any;
  let mockTranslationService: any;

  const mockDrivers = [
    { entity_id: "ld-1", name: "Alice Local", nickname: "Ali" },
    { entity_id: "ld-2", name: "Bob Local", nickname: "Bobby" },
  ];

  const mockTeams = [
    { entity_id: "lt-1", name: "Scuderia Local" },
    { entity_id: "lt-2", name: "Apex Racing" },
  ];

  const mockSeasons: Season[] = [
    { entity_id: "season-1", name: "2026 Championship" } as Season,
    { entity_id: "season-2", name: "Winter Cup" } as Season,
  ];

  const mockPreview: RacePackagePreview = {
    temp_package_token: "token-123",
    duplicate_race: false,
    manifest: {
      format_version: 1,
      created_by_app_version: "1.0.0",
      min_compatible_app_version: "1.0.0",
      package_type: "RACE_COORDINATOR_RACE_PACKAGE",
      race_id: "r1",
      fingerprint: "sha256-abc",
      race_name: "Friday Night Grand Prix",
      start_time: 1700000000,
      end_time: 1700003600,
      heat_count: 8,
      driver_count: 2,
    },
    driver_mappings: [
      {
        source_driver_id: "sd-1",
        source_driver_name: "Alice Source",
        source_driver_nickname: "Ali",
        matched_local_driver_id: "ld-1",
        matched_local_driver_name: "Alice Local",
        match_type: "EXACT_NAME",
        suggested_action: "LINK",
      },
      {
        source_driver_id: "sd-2",
        source_driver_name: "Charlie Source",
        source_driver_nickname: "",
        matched_local_driver_id: undefined,
        matched_local_driver_name: undefined,
        match_type: "NONE",
        suggested_action: "CREATE_NEW",
      },
    ],
  };

  beforeEach(async () => {
    mockDataService = jasmine.createSpyObj("DataService", [
      "getDrivers",
      "getTeams",
      "commitRacePackage",
    ]);
    mockDataService.getDrivers.and.returnValue(of(mockDrivers));
    mockDataService.getTeams.and.returnValue(of(mockTeams));
    mockDataService.commitRacePackage.and.returnValue(
      of({
        success: true,
        imported_race_id: "imported-race-1",
        race_name: "Friday Night Grand Prix",
        driver_count: 2,
        drivers_linked: 1,
        drivers_created: 1,
      } as RacePackageResult),
    );

    mockTranslationService = jasmine.createSpyObj("TranslationService", [
      "translate",
    ]);
    mockTranslationService.translate.and.callFake(
      (key: string, params?: any) => {
        if (params?.count !== undefined) {
          return `${key}:${params.count}`;
        }
        if (params?.name !== undefined) {
          return `${key}:${params.name}`;
        }
        return key;
      },
    );

    await TestBed.configureTestingModule({
      imports: [RacePackageModalComponent],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RacePackageModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  const open = (preview: RacePackagePreview = mockPreview): void => {
    fixture.componentRef.setInput("visible", true);
    fixture.componentRef.setInput("preview", preview);
    fixture.detectChanges();
  };

  const lastRequest = (): RacePackageCommitRequest =>
    mockDataService.commitRacePackage.calls.mostRecent().args[0];

  const q = (selector: string): HTMLElement | null =>
    fixture.nativeElement.querySelector(selector);

  const dupPreview: RacePackagePreview = {
    ...mockPreview,
    duplicate_race: true,
    existing_race_id: "existing-1",
    existing_race_name: "Friday Night Grand Prix",
  };

  const conflictPreview: RacePackagePreview = {
    ...mockPreview,
    config_conflict: true,
    existing_config_name: "Friday Night Grand Prix",
    suggested_config_name: "Friday Night Grand Prix (1)",
  };

  const allMatchedPreview: RacePackagePreview = {
    ...mockPreview,
    driver_mappings: [
      mockPreview.driver_mappings[0],
      {
        source_driver_id: "sd-2",
        source_driver_name: "Bob Local",
        source_driver_nickname: "Bobby",
        matched_local_driver_id: "ld-2",
        matched_local_driver_name: "Bob Local",
        match_type: "EXACT_NAME",
        suggested_action: "LINK",
      },
    ],
  };

  it("should create and fetch local drivers and teams on init", () => {
    expect(component).toBeTruthy();
    expect(mockDataService.getDrivers).toHaveBeenCalled();
    expect(mockDataService.getTeams).toHaveBeenCalled();
    expect(component.localDrivers).toEqual(mockDrivers);
    expect(component.localTeams).toEqual(mockTeams);
  });

  it("should handle errors when fetching local drivers gracefully", () => {
    mockDataService.getDrivers.and.returnValue(
      throwError(() => new Error("fail")),
    );
    component.ngOnInit();
    expect(component.localDrivers).toEqual([]);
  });

  it("should not render when visible is false", () => {
    fixture.componentRef.setInput("preview", mockPreview);
    fixture.detectChanges();
    expect(q(".rpm-backdrop")).toBeNull();
  });

  it("should render one screen with the race summary and no stepper", () => {
    open();
    expect(q(".rpm-backdrop")).not.toBeNull();
    expect(q(".rpm-meta-name")?.textContent).toContain(
      "Friday Night Grand Prix",
    );
    expect(q(".rpm-stepper")).toBeNull();
    expect(q(".rpm-duplicate-callout")).toBeNull();
    expect(q("#rpm-save-format")).not.toBeNull();
    expect(component.raceName).toBe("Friday Night Grand Prix");
  });

  it("should preselect matched drivers and New driver for unmatched ones", () => {
    open();
    expect(component.picks["sd-1"]).toBe("ld-1");
    expect(component.picks["sd-2"]).toBe(component.NEW_PARTICIPANT);
    expect(component.newNames["sd-2"]).toBe("Charlie Source");
    expect(component.linkedCount).toBe(1);
    expect(component.newCount).toBe(1);
  });

  it("should open the driver list by itself when a driver is not an exact name match", () => {
    open();
    expect(component.showDrivers).toBeTrue();
    expect(
      fixture.nativeElement.querySelectorAll(".rpm-driver-row").length,
    ).toBe(2);
  });

  it("should keep the driver list closed when every driver matches by name, and toggle it", () => {
    open(allMatchedPreview);
    expect(component.showDrivers).toBeFalse();
    expect(q(".rpm-driver-row")).toBeNull();
    expect(q(".rpm-driver-summary")?.textContent).toContain(
      "RPM_DRIVERS_ALL_KNOWN",
    );

    (q(".btn-toggle-drivers") as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelectorAll(".rpm-driver-row").length,
    ).toBe(2);
  });

  it("should default a duplicate race to Replace my copy (OVERWRITE)", async () => {
    open(dupPreview);
    expect(q(".rpm-duplicate-callout")).not.toBeNull();
    expect(component.duplicateChoice).toBe("REPLACE");

    await component.onCommit();
    expect(lastRequest().duplicate_action).toBe("OVERWRITE");
  });

  it("should send CREATE_COPY when Keep both is chosen", async () => {
    open(dupPreview);
    (q("#rpm-dup-keep") as HTMLInputElement).dispatchEvent(new Event("change"));
    fixture.detectChanges();
    expect(component.duplicateChoice).toBe("KEEP_BOTH");

    await component.onCommit();
    expect(lastRequest().duplicate_action).toBe("CREATE_COPY");
  });

  it("should send CREATE_COPY for a race that is not a duplicate", async () => {
    open();
    await component.onCommit();
    expect(lastRequest().duplicate_action).toBe("CREATE_COPY");
  });

  it("should save the race format by default when there is no name clash", async () => {
    open();
    await component.onCommit();
    expect(lastRequest().config_action).toBe("CREATE_NEW");
    expect(lastRequest().race_name).toBe("Friday Night Grand Prix");
    expect(lastRequest().custom_config_name).toBe("Friday Night Grand Prix");
  });

  it("should skip the race format when the checkbox is cleared", async () => {
    open();
    component.saveFormat = false;
    await component.onCommit();
    expect(lastRequest().config_action).toBe("SKIP");
  });

  it("should show the three race format choices on a name clash, defaulting to Use mine", async () => {
    open(conflictPreview);
    expect(q("#rpm-save-format")).toBeNull();
    expect(q("#rpm-format-mine")).not.toBeNull();
    expect(q("#rpm-format-copy")).not.toBeNull();
    expect(q("#rpm-format-replace")).not.toBeNull();
    expect(component.formatChoice).toBe("USE_MINE");
    expect(component.isNameLocked).toBeTrue();
    expect((q("#rpm-race-name-input") as HTMLInputElement).readOnly).toBeTrue();

    await component.onCommit();
    expect(lastRequest().config_action).toBe("USE_EXISTING");
    expect(lastRequest().race_name).toBe("Friday Night Grand Prix");
  });

  it("should use the suggested name and allow editing for Save as a copy", async () => {
    open(conflictPreview);
    (q("#rpm-format-copy") as HTMLInputElement).dispatchEvent(
      new Event("change"),
    );
    fixture.detectChanges();
    expect(component.formatChoice).toBe("SAVE_COPY");
    expect(component.isNameLocked).toBeFalse();
    expect(component.raceName).toBe("Friday Night Grand Prix (1)");

    component.raceName = "  Club Night Copy  ";
    await component.onCommit();
    expect(lastRequest().config_action).toBe("CREATE_NEW");
    expect(lastRequest().race_name).toBe("Club Night Copy");
    expect(lastRequest().custom_config_name).toBe("Club Night Copy");
  });

  it("should send OVERWRITE for Replace mine", async () => {
    open(conflictPreview);
    component.onFormatChoiceChange("REPLACE_MINE");
    expect(component.raceName).toBe("Friday Night Grand Prix");
    await component.onCommit();
    expect(lastRequest().config_action).toBe("OVERWRITE");
  });

  it("should not let two package drivers use the same local driver", async () => {
    open();
    component.onPickChange("sd-2", "ld-1");

    expect(component.usedBy("ld-1", "sd-2")).toBe("Alice Source");
    expect(component.usedBy("ld-1", "sd-1")).toBe("Charlie Source");
    expect(component.unresolvedCount).toBe(2);
    expect(component.canImport).toBeFalse();

    await component.onCommit();
    expect(mockDataService.commitRacePackage).not.toHaveBeenCalled();
  });

  it("should count a row without a choice as still to pick", () => {
    open();
    component.onPickChange("sd-2", "");
    fixture.detectChanges();
    expect(component.unresolvedCount).toBe(1);
    expect(q(".badge-problem")).not.toBeNull();
    expect(q(".rpm-footer-note")).not.toBeNull();
    expect((q("#rpm-btn-import") as HTMLButtonElement).disabled).toBeTrue();
  });

  it("should block import when a new driver has an empty name", () => {
    open();
    component.onNewNameChange("sd-2", "   ");
    expect(component.unresolvedCount).toBe(1);
    expect(component.canImport).toBeFalse();
  });

  it("should update the counts live when a pick changes", () => {
    open();
    component.onPickChange("sd-2", "ld-2");
    expect(component.linkedCount).toBe(2);
    expect(component.newCount).toBe(0);
    component.onPickChange("sd-1", component.NEW_PARTICIPANT);
    expect(component.linkedCount).toBe(1);
    expect(component.newCount).toBe(1);
  });

  it("should build LINK and CREATE_NEW resolutions from the picks", async () => {
    open();
    component.onNewNameChange("sd-2", "  Charlie New  ");
    await component.onCommit();
    expect(lastRequest().driver_resolutions).toEqual([
      { source_driver_id: "sd-1", action: "LINK", target_driver_id: "ld-1" },
      {
        source_driver_id: "sd-2",
        action: "CREATE_NEW",
        new_driver_name: "Charlie New",
      },
    ]);
  });

  it("should list teams with the t_ prefix for team rows", () => {
    expect(component.isTeam("t_123")).toBeTrue();
    expect(component.isTeam("sd-1")).toBeFalse();
    expect(component.localOptions("t_src").map((o) => o.value)).toEqual([
      "t_lt-1",
      "t_lt-2",
    ]);
    expect(component.localOptions("sd-1")[0]).toEqual({
      value: "ld-1",
      label: "Alice Local (Ali)",
    });
  });

  it("should prefix a matched team id that comes without t_", () => {
    open({
      ...mockPreview,
      driver_mappings: [
        {
          source_driver_id: "t_src-team",
          source_driver_name: "Scuderia",
          source_driver_nickname: "",
          matched_local_driver_id: "lt-1",
          match_type: "EXACT_NAME",
          suggested_action: "LINK",
        },
      ],
    });
    expect(component.picks["t_src-team"]).toBe("t_lt-1");
  });

  it("should map match types to badge keys", () => {
    const [exact, none] = mockPreview.driver_mappings;
    expect(component.matchBadgeKey(exact)).toBe("RPM_MATCH_SAME_NAME");
    expect(component.matchBadgeKey(none)).toBe("RPM_MATCH_NOT_FOUND");
    expect(
      component.matchBadgeKey({ ...exact, match_type: "EXACT_NICKNAME" }),
    ).toBe("RPM_MATCH_SAME_NICKNAME");
  });

  it("should show the season banner and send the target season", async () => {
    fixture.componentRef.setInput("targetSeasonId", "season-1");
    open();
    expect(q(".rpm-season-target")).not.toBeNull();
    expect(q(".rpm-season-select")).toBeNull();
    await component.onCommit();
    expect(lastRequest().season_id).toBe("season-1");
  });

  it("should show the season picker when seasons are given and no target season", async () => {
    fixture.componentRef.setInput("seasons", mockSeasons);
    open();
    expect(q(".rpm-season-select")).not.toBeNull();
    await component.onCommit();
    expect(lastRequest().season_id).toBeUndefined();

    component.selectedSeasonId = "season-2";
    await component.onCommit();
    expect(lastRequest().season_id).toBe("season-2");
  });

  it("should emit the result and close after a successful import", async () => {
    open();
    let result: RacePackageResult | undefined;
    let closed = false;
    component.committed.subscribe((r) => (result = r));
    component.close.subscribe(() => (closed = true));

    await component.onCommit();

    expect(result?.imported_race_id).toBe("imported-race-1");
    expect(closed).toBeTrue();
    expect(component.isCommitting).toBeFalse();
  });

  it("should show the error banner when the import fails", async () => {
    mockDataService.commitRacePackage.and.returnValue(
      throwError(() => ({ error: { message: "Server says no" } })),
    );
    open();
    await component.onCommit();
    fixture.detectChanges();
    expect(component.errorMessage).toBe("Server says no");
    expect(q(".rpm-alert-banner.error")?.textContent).toContain(
      "Server says no",
    );
  });

  it("should return early in onCommit if there is no preview", async () => {
    await component.onCommit();
    expect(mockDataService.commitRacePackage).not.toHaveBeenCalled();
  });

  it("should close from the close button but not while importing", () => {
    open();
    let closed = 0;
    component.close.subscribe(() => closed++);
    (q(".rpm-btn-close") as HTMLButtonElement).click();
    expect(closed).toBe(1);

    component.isCommitting = true;
    component.onClose();
    expect(closed).toBe(1);
  });

  it("should reset all choices when a new preview arrives", () => {
    open(conflictPreview);
    component.onFormatChoiceChange("REPLACE_MINE");
    component.saveFormat = false;
    open(dupPreview);
    expect(component.formatChoice).toBe("USE_MINE");
    expect(component.saveFormat).toBeTrue();
    expect(component.duplicateChoice).toBe("REPLACE");
    expect(component.errorMessage).toBeNull();
  });
});
