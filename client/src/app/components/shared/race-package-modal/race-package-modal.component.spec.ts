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

  it("should create and fetch local drivers on init", () => {
    expect(component).toBeTruthy();
    expect(mockDataService.getDrivers).toHaveBeenCalled();
    expect(component.localDrivers.length).toBe(2);
    expect(component.isCommitting).toBeFalse();
    expect(component.duplicateAction).toBe("CREATE_COPY");
  });

  it("should handle error when fetching local drivers gracefully", () => {
    mockDataService.getDrivers.and.returnValue(
      throwError(() => new Error("Network error")),
    );
    const newFixture = TestBed.createComponent(RacePackageModalComponent);
    const newComp = newFixture.componentInstance;
    newComp.ngOnInit();
    expect(newComp.localDrivers).toEqual([]);
  });

  it("should not render modal backdrop when visible is false", () => {
    fixture.componentRef.setInput("visible", false);
    fixture.componentRef.setInput("preview", mockPreview);
    fixture.detectChanges();

    const backdrop = fixture.nativeElement.querySelector(".rpm-backdrop");
    expect(backdrop).toBeNull();
  });

  it("should render modal when visible is true and preview is set", () => {
    fixture.componentRef.setInput("visible", true);
    fixture.componentRef.setInput("preview", mockPreview);
    fixture.detectChanges();

    const backdrop = fixture.nativeElement.querySelector(".rpm-backdrop");
    expect(backdrop).not.toBeNull();
    const raceName = fixture.nativeElement.querySelector(".rpm-race-name");
    expect(raceName?.textContent?.trim()).toBe("Friday Night Grand Prix");

    // Resolutions initialized
    expect(component.driverResolutions["sd-1"]).toEqual({
      source_driver_id: "sd-1",
      action: "LINK",
      target_driver_id: "ld-1",
      new_driver_name: "Alice Source",
    });
    expect(component.driverResolutions["sd-2"]).toEqual({
      source_driver_id: "sd-2",
      action: "CREATE_NEW",
      target_driver_id: "",
      new_driver_name: "Charlie Source",
    });
  });

  it("should render duplicate callout and configure new config when duplicate_race is true", () => {
    const dupPreview: RacePackagePreview = {
      ...mockPreview,
      duplicate_race: true,
      existing_race_name: "Existing Grand Prix",
      config_conflict: true,
      existing_config_name: "Friday Night Grand Prix",
      suggested_config_name: "Friday Night Grand Prix (1)",
    };
    fixture.componentRef.setInput("visible", true);
    fixture.componentRef.setInput("preview", dupPreview);
    fixture.detectChanges();

    const dupCallout = fixture.nativeElement.querySelector(
      ".rpm-duplicate-callout",
    );
    expect(dupCallout).not.toBeNull();
    expect(component.duplicateAction).toBe("CREATE_COPY");
    expect(component.configAction).toBe("CREATE_NEW");
    expect(component.customConfigName).toBe("Friday Night Grand Prix (1)");

    const configCard = fixture.nativeElement.querySelector(".rpm-config-card");
    expect(configCard).not.toBeNull();
  });

  it("should allow editing custom config name or setting configAction to SKIP", () => {
    fixture.componentRef.setInput("visible", true);
    fixture.componentRef.setInput("preview", mockPreview);
    fixture.detectChanges();

    expect(component.configAction).toBe("CREATE_NEW");
    expect(component.customConfigName).toBe("Friday Night Grand Prix");

    // Edit config name
    component.customConfigName = "My Custom Cup";
    expect(component.customConfigName).toBe("My Custom Cup");

    // Change action to SKIP
    component.onConfigActionChange("SKIP");
    expect(component.configAction).toBe("SKIP");

    // Change duplicate action to SKIP
    component.onDuplicateActionChange("SKIP");
    expect(component.duplicateAction).toBe("SKIP");
    expect(component.configAction).toBe("SKIP");
  });

  it("should render clean race configuration card when config_conflict is false", () => {
    fixture.componentRef.setInput("visible", true);
    fixture.componentRef.setInput("preview", mockPreview);
    fixture.detectChanges();

    const configCard = fixture.nativeElement.querySelector(".rpm-config-card");
    expect(configCard).not.toBeNull();
    expect(configCard.classList.contains("has-conflict")).toBeFalse();

    const badge = configCard.querySelector(".rpm-config-badge.clean");
    expect(badge).not.toBeNull();
    expect(component.configAction).toBe("CREATE_NEW");
  });

  it("should render race configuration conflict card and allow overwrite when config_conflict is true", () => {
    const configConflictPreview: RacePackagePreview = {
      ...mockPreview,
      config_conflict: true,
      existing_config_name: "Friday Night Grand Prix",
      suggested_config_name: "Friday Night Grand Prix (1)",
    };
    fixture.componentRef.setInput("visible", true);
    fixture.componentRef.setInput("preview", configConflictPreview);
    fixture.detectChanges();

    const configCard = fixture.nativeElement.querySelector(
      ".rpm-config-card.has-conflict",
    );
    expect(configCard).not.toBeNull();
    expect(component.configAction).toBe("CREATE_NEW");
    expect(component.customConfigName).toBe("Friday Night Grand Prix (1)");
    expect(component.raceName).toBe("Friday Night Grand Prix (1)");

    component.onConfigActionChange("OVERWRITE");
    fixture.detectChanges();
    const conflictBadge = configCard.querySelector(
      ".rpm-config-badge.conflict",
    );
    expect(conflictBadge).not.toBeNull();
  });

  it("should render target season banner when targetSeasonId is provided", () => {
    fixture.componentRef.setInput("visible", true);
    fixture.componentRef.setInput("preview", mockPreview);
    fixture.componentRef.setInput("targetSeasonId", "season-1");
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector(
      ".rpm-season-target-banner",
    );
    expect(banner).not.toBeNull();
    expect(component.selectedSeasonId).toBe("season-1");
  });

  it("should render season picker when seasons are provided and no targetSeasonId", () => {
    fixture.componentRef.setInput("visible", true);
    fixture.componentRef.setInput("preview", mockPreview);
    fixture.componentRef.setInput("targetSeasonId", undefined);
    fixture.componentRef.setInput("seasons", mockSeasons);
    fixture.detectChanges();

    const picker = fixture.nativeElement.querySelector(
      ".rpm-season-picker-row",
    );
    expect(picker).not.toBeNull();
  });

  it("should handle driver resolution changes correctly", () => {
    fixture.componentRef.setInput("visible", true);
    fixture.componentRef.setInput("preview", mockPreview);
    fixture.detectChanges();

    // Change action of sd-1 from LINK to CREATE_NEW
    component.onActionChange("sd-1", "CREATE_NEW");
    expect(component.driverResolutions["sd-1"].action).toBe("CREATE_NEW");

    // Change action of sd-2 from CREATE_NEW to LINK (should link to first local driver since no match)
    component.onActionChange("sd-2", "LINK");
    expect(component.driverResolutions["sd-2"].action).toBe("LINK");
    expect(component.driverResolutions["sd-2"].target_driver_id).toBe("ld-1");

    // Change target driver
    component.onTargetDriverChange("sd-2", "ld-2");
    expect(component.driverResolutions["sd-2"].target_driver_id).toBe("ld-2");

    // Change new name
    component.onNewNameChange("sd-1", "Alice Modified");
    expect(component.driverResolutions["sd-1"].new_driver_name).toBe(
      "Alice Modified",
    );

    // getResolution helper
    expect(component.getResolution("sd-1")?.new_driver_name).toBe(
      "Alice Modified",
    );
  });

  it("should close modal when close button or backdrop is clicked", () => {
    fixture.componentRef.setInput("visible", true);
    fixture.componentRef.setInput("preview", mockPreview);
    fixture.detectChanges();

    let closed = false;
    component.close.subscribe(() => (closed = true));

    const closeBtn = fixture.nativeElement.querySelector(".rpm-btn-close");
    closeBtn.click();
    expect(closed).toBeTrue();
  });

  it("should not close modal while committing", () => {
    fixture.componentRef.setInput("visible", true);
    fixture.componentRef.setInput("preview", mockPreview);
    component.isCommitting = true;
    fixture.detectChanges();

    let closed = false;
    component.close.subscribe(() => (closed = true));

    component.onClose();
    expect(closed).toBeFalse();
  });

  it("should commit race package successfully and emit result", async () => {
    fixture.componentRef.setInput("visible", true);
    fixture.componentRef.setInput("preview", mockPreview);
    fixture.componentRef.setInput("targetSeasonId", "season-1");
    fixture.detectChanges();

    let committedResult: RacePackageResult | undefined;
    let closed = false;
    component.committed.subscribe((res) => (committedResult = res));
    component.close.subscribe(() => (closed = true));

    await component.onCommit();

    expect(mockDataService.commitRacePackage).toHaveBeenCalled();
    const reqArg: RacePackageCommitRequest =
      mockDataService.commitRacePackage.calls.mostRecent().args[0];
    expect(reqArg.temp_package_token).toBe("token-123");
    expect(reqArg.duplicate_action).toBe("CREATE_COPY");
    expect(reqArg.config_action).toBe("CREATE_NEW");
    expect(reqArg.custom_config_name).toBe("Friday Night Grand Prix");
    expect(reqArg.season_id).toBe("season-1");
    expect(reqArg.driver_resolutions.length).toBe(2);

    expect(committedResult).toBeDefined();
    expect(committedResult?.imported_race_id).toBe("imported-race-1");
    expect(closed).toBeTrue();
    expect(component.isCommitting).toBeFalse();
  });

  it("should display error banner on commit failure", async () => {
    fixture.componentRef.setInput("visible", true);
    fixture.componentRef.setInput("preview", mockPreview);
    fixture.detectChanges();

    mockDataService.commitRacePackage.and.returnValue(
      throwError(() => ({
        error: { message: "Package corrupted or invalid" },
      })),
    );

    await component.onCommit();

    expect(component.isCommitting).toBeFalse();
    expect(component.errorMessage).toBe("Package corrupted or invalid");

    fixture.detectChanges();
    const errorBanner = fixture.nativeElement.querySelector(
      ".rpm-alert-banner.error",
    );
    expect(errorBanner).not.toBeNull();
  });

  it("should return early in onCommit if preview is null", async () => {
    fixture.componentRef.setInput("visible", true);
    fixture.componentRef.setInput("preview", null);
    fixture.detectChanges();

    await component.onCommit();
    expect(mockDataService.commitRacePackage).not.toHaveBeenCalled();
  });

  it("should navigate to step 2 and render driver mapping table when drivers need review", () => {
    fixture.componentRef.setInput("visible", true);
    fixture.componentRef.setInput("preview", mockPreview);
    fixture.detectChanges();

    expect(component.currentStep).toBe(1);
    expect(component.allDriversMatched).toBeFalse();
    expect(component.matchedDriversCount).toBe(1);
    expect(component.newDriversCount).toBe(1);

    component.goToStep(2);
    fixture.detectChanges();

    expect(component.currentStep).toBe(2);
    const warningSummary = fixture.nativeElement.querySelector(
      ".rpm-drivers-summary.warning",
    );
    expect(warningSummary).not.toBeNull();

    const tableWrapper =
      fixture.nativeElement.querySelector(".rpm-table-wrapper");
    expect(tableWrapper).not.toBeNull();

    const rows = fixture.nativeElement.querySelectorAll(".rpm-table tbody tr");
    expect(rows.length).toBe(2);
  });

  it("should display success summary and toggle driver table when all drivers match", () => {
    const allMatchedPreview: RacePackagePreview = {
      ...mockPreview,
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
      ],
    };

    fixture.componentRef.setInput("visible", true);
    fixture.componentRef.setInput("preview", allMatchedPreview);
    fixture.detectChanges();

    expect(component.allDriversMatched).toBeTrue();

    component.goToStep(2);
    fixture.detectChanges();

    const successSummary = fixture.nativeElement.querySelector(
      ".rpm-drivers-summary.success",
    );
    expect(successSummary).not.toBeNull();
    expect(component.showDriverDetails).toBeFalse();
    expect(
      fixture.nativeElement.querySelector(".rpm-table-wrapper"),
    ).toBeNull();

    component.toggleDriverDetails();
    fixture.detectChanges();

    expect(component.showDriverDetails).toBeTrue();
    expect(
      fixture.nativeElement.querySelector(".rpm-table-wrapper"),
    ).not.toBeNull();
  });

  it("should block step 2 and commit empty driver resolutions when duplicateAction is SKIP", async () => {
    fixture.componentRef.setInput("visible", true);
    fixture.componentRef.setInput("preview", mockPreview);
    fixture.detectChanges();

    component.onDuplicateActionChange("SKIP");
    fixture.detectChanges();

    expect(component.duplicateAction).toBe("SKIP");
    expect(component.configAction).toBe("SKIP");

    // Attempt to navigate to step 2 should be blocked
    component.goToStep(2);
    expect(component.currentStep).toBe(1);

    const skipBanner = fixture.nativeElement.querySelector(".rpm-skip-banner");
    expect(skipBanner).not.toBeNull();

    await component.onCommit();

    expect(mockDataService.commitRacePackage).toHaveBeenCalled();
    const reqArg: RacePackageCommitRequest =
      mockDataService.commitRacePackage.calls.mostRecent().args[0];
    expect(reqArg.duplicate_action).toBe("SKIP");
    expect(reqArg.config_action).toBe("SKIP");
    expect(reqArg.driver_resolutions).toEqual([]);
  });

  it("should allow navigating back from step 2 to step 1", () => {
    fixture.componentRef.setInput("visible", true);
    fixture.componentRef.setInput("preview", mockPreview);
    fixture.detectChanges();

    component.goToStep(2);
    expect(component.currentStep).toBe(2);

    component.goToStep(1);
    expect(component.currentStep).toBe(1);
  });

  it("should update both raceName and customConfigName onRaceNameChange", () => {
    fixture.componentRef.setInput("visible", true);
    fixture.componentRef.setInput("preview", mockPreview);
    fixture.detectChanges();

    component.onRaceNameChange("Custom Race Title");
    expect(component.raceName).toBe("Custom Race Title");
    expect(component.customConfigName).toBe("Custom Race Title");
  });

  it("should correctly identify team source IDs using isTeam()", () => {
    expect(component.isTeam("t_team-1")).toBeTrue();
    expect(component.isTeam("t_12345")).toBeTrue();
    expect(component.isTeam("driver-1")).toBeFalse();
    expect(component.isTeam("")).toBeFalse();
  });

  it("should load local teams along with local drivers on ngOnInit", () => {
    expect(component.localDrivers.length).toBe(2);
    expect(component.localTeams.length).toBe(2);
    expect(component.localTeams[0].name).toBe("Scuderia Local");
  });
});
