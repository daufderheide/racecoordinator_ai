import { DragDropModule } from "@angular/cdk/drag-drop";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import {
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
  tick,
} from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { BehaviorSubject, of } from "rxjs";
import { map } from "rxjs/operators";
import { HelpOverlayComponent } from "src/app/components/shared/help-overlay/help-overlay.component";
import { DataService } from "src/app/data.service";
import { Settings } from "src/app/models/settings";
import { TranslatePipe } from "src/app/pipes/translate.pipe";
import { com } from "src/app/proto/message";
import { FileSystemService } from "src/app/services/file-system.service";
import { HelpService } from "src/app/services/help.service";
import { RaceService } from "src/app/services/race.service";
import { SettingsService } from "src/app/services/settings.service";
import { TranslationService } from "src/app/services/translation.service";

import { DefaultRacedaySetupComponent } from "./default-raceday-setup.component";
import { DefaultRacedaySetupHarness } from "./testing/default-raceday-setup.harness";

describe("DefaultRacedaySetupComponent", () => {
  let component: DefaultRacedaySetupComponent;
  let fixture: ComponentFixture<DefaultRacedaySetupComponent>;
  let harness: DefaultRacedaySetupHarness;
  let mockDataService: jasmine.SpyObj<DataService>;
  let mockRaceService: jasmine.SpyObj<RaceService>;
  let mockTranslationService: jasmine.SpyObj<TranslationService>;
  let mockSettingsService: jasmine.SpyObj<SettingsService>;
  let mockFileSystemService: jasmine.SpyObj<FileSystemService>;
  let mockHelpService: any;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(() => {
    mockDataService = jasmine.createSpyObj("DataService", [
      "getDrivers",
      "getTeams",
      "getRaces",
      "initializeRace",
      "getSavedRaces",
      "loadRace",
      "deleteSavedRace",
      "toggleServerAnalytics",
    ]);
    mockRaceService = jasmine.createSpyObj("RaceService", ["startRace"]);
    mockTranslationService = jasmine.createSpyObj("TranslationService", [
      "getTranslationsLoaded",
      "translate",
      "setLanguage",
      "getSupportedLanguages",
      "getBrowserLanguage",
    ]);
    mockTranslationService.translate.and.callFake(
      (key: string, params?: any) => {
        let result = key;
        if (params) {
          Object.keys(params)
            .sort()
            .forEach((k) => {
              const val = params[k];
              if (val) {
                result += ` ${val}`;
              }
            });
        }
        return result;
      },
    );
    mockTranslationService.getTranslationsLoaded.and.returnValue(of(true));
    mockTranslationService.getSupportedLanguages.and.returnValue([]);
    mockTranslationService.getBrowserLanguage.and.returnValue("en");
    mockSettingsService = jasmine.createSpyObj("SettingsService", [
      "getSettings",
      "saveSettings",
    ]);
    mockRouter = jasmine.createSpyObj("Router", ["navigate"]);
    mockFileSystemService = jasmine.createSpyObj("FileSystemService", [
      "selectCustomFolder",
      "clearCustomFolder",
    ]);

    // Mock HelpService using spyObj and observables
    mockHelpService = jasmine.createSpyObj("HelpService", [
      "startGuide",
      "nextStep",
      "previousStep",
      "endGuide",
    ]);
    mockHelpService.isVisible$ = new BehaviorSubject(false);
    mockHelpService.currentStep$ = new BehaviorSubject(null);
    mockHelpService.hasNext$ = new BehaviorSubject(false);
    mockHelpService.hasPrevious$ = new BehaviorSubject(false);

    mockDataService.getDrivers.and.returnValue(
      of([
        { entity_id: "d1", name: "Driver 1", nickname: "D1" },
        { entity_id: "d2", name: "Driver 2", nickname: "D2" },
      ]),
    );
    mockDataService.getTeams.and.returnValue(
      of([{ entity_id: "t1", name: "Team 1", driverIds: ["d1"] }]),
    );
    mockDataService.getRaces.and.returnValue(
      of([
        { entity_id: "r1", name: "Grand Prix" },
        { entity_id: "r2", name: "Time Trial" },
      ]),
    );
    mockDataService.getSavedRaces.and.returnValue(
      of(["race1.json", "race2.json"]),
    );
    mockDataService.loadRace.and.returnValue(of("OK"));
    mockDataService.deleteSavedRace.and.returnValue(of("OK"));
    mockDataService.toggleServerAnalytics.and.returnValue(of("OK"));
    mockTranslationService.getTranslationsLoaded.and.returnValue(of(true));

    mockTranslationService.getBrowserLanguage.and.returnValue("en");
    mockTranslationService.getSupportedLanguages.and.returnValue([
      { code: "en", nameKey: "RDS_LANG_EN" },
      { code: "es", nameKey: "RDS_LANG_ES" },
    ]);
    mockSettingsService.getSettings.and.returnValue(
      Object.assign(new Settings(), {
        recentRaceIds: [],
        selectedDriverIds: [],
        serverIp: "localhost",
        serverPort: 7070,
        language: "",
        racedaySetupWalkthroughSeen: false,
        sortByStandings: true,
      }),
    );

    TestBed.configureTestingModule({
      imports: [FormsModule, DragDropModule],
      declarations: [
        DefaultRacedaySetupComponent,
        TranslatePipe,
        HelpOverlayComponent,
      ],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: RaceService, useValue: mockRaceService },
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: SettingsService, useValue: mockSettingsService },
        { provide: Router, useValue: mockRouter },
        { provide: FileSystemService, useValue: mockFileSystemService },
        { provide: HelpService, useValue: mockHelpService },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DefaultRacedaySetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  beforeEach(async () => {
    harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      DefaultRacedaySetupHarness,
    );
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should toggle driver selection", fakeAsync(() => {
    // Flush the ngOnInit translations and help walkthrough timers
    tick(1000);
    fixture.detectChanges();

    const driverToSelect = component.filteredUnselectedParticipants.find(
      (d: any) => d.entity_id === "d2",
    )!;
    component.toggleParticipantSelection(driverToSelect, false);
    tick(); // updateListWithRefresh
    fixture.detectChanges();

    expect(component.selectedParticipants.length).toBe(1);
    expect(component.selectedParticipants[0].entity_id).toBe("d2");

    const driverToUnselect = component.selectedParticipants[0];
    component.toggleParticipantSelection(driverToUnselect, true);
    tick(); // updateListWithRefresh
    fixture.detectChanges();

    expect(component.selectedParticipants.length).toBe(0);
    expect(component.filteredUnselectedParticipants.length).toBe(3);
  }));

  it("should toggle team selection", fakeAsync(() => {
    // Note: ngOnInit has already run in beforeEach. To test with specific data,
    // we must re-trigger ngOnInit or handle the initialization logic manually.
    // For this test, we verify that the team already exists from the initial setup.

    expect(component.filteredUnselectedParticipants.length).toBe(3);
    const teamToSelect = component.filteredUnselectedParticipants.find(
      (d: any) => d.entity_id === "t1",
    )!;
    component.toggleParticipantSelection(teamToSelect, false);
    tick(); // Wait for updateListWithRefresh setTimeout
    fixture.detectChanges();

    expect(component.selectedParticipants.length).toBe(1);
    expect(component.selectedParticipants[0].entity_id).toBe("t1");

    component.toggleParticipantSelection(
      component.selectedParticipants[0],
      true,
    );
    flush();
    expect(component.selectedParticipants.length).toBe(0);
  }));

  it("should search drivers", () => {
    expect(component.filteredUnselectedParticipants.length).toBe(3);
    component.driverSearchQuery = "Driver 1";
    expect(component.filteredUnselectedParticipants.length).toBe(1);
    expect(component.filteredUnselectedParticipants[0].name).toBe("Driver 1");
  });

  it("should search races", () => {
    expect(component.filteredRaces.length).toBe(2);
    component.raceSearchQuery = "Time Trial";
    expect(component.filteredRaces.length).toBe(1);
    expect(component.filteredRaces[0].name).toBe("Time Trial");
  });

  it("should auto-open race dropdown when searching races", () => {
    expect(component.isDropdownOpen).toBeFalse();
    component.raceSearchQuery = "Grand";
    component.onSearchChange();
    expect(component.isDropdownOpen).toBeTrue();
  });

  it("should select a race without updating quick start races", () => {
    const raceToSelect = component.races.find(
      (r: any) => r.entity_id === "r2",
    )!;
    const initialQuickStart = [...component.quickStartRaces];

    component.selectRace(raceToSelect);

    expect(component.selectedRace?.entity_id).toBe("r2");
    expect(component.isDropdownOpen).toBeFalse();
    // Quick start races should NOT have changed order
    expect(component.quickStartRaces).toEqual(initialQuickStart);
    // Settings should be saved with selectedRaceId
    expect(mockSettingsService.saveSettings).toHaveBeenCalled();
    const savedSettings =
      mockSettingsService.saveSettings.calls.mostRecent().args[0];
    expect(savedSettings.selectedRaceId).toBe("r2");
  });

  it("should update quick start races when starting a race", fakeAsync(() => {
    const raceToSelect = component.races.find(
      (r: any) => r.entity_id === "r2",
    )!;
    component.selectRace(raceToSelect);
    // Must have participants to start a race
    component.selectedParticipants = [component.unselectedParticipants[0]];

    const response = com.antigravity.InitializeRaceResponse.fromObject({
      success: true,
    });
    mockDataService.initializeRace.and.returnValue(of(response));

    component.startRace(false);
    tick(); // startRace calls getSavedRaces and proceedWithStart
    fixture.detectChanges();

    // After starting, r2 should be the first in quickStartRaces
    expect(component.quickStartRaces[0].entity_id).toBe("r2");
    // Settings should be saved with updated recentRaceIds
    const savedSettings =
      mockSettingsService.saveSettings.calls.mostRecent().args[0];
    expect(savedSettings.recentRaceIds[0]).toBe("r2");
  }));

  it("should start race normally without autosave file", fakeAsync(() => {
    component.selectedRace = component.races[0];
    component.selectedParticipants = [component.unselectedParticipants[0]];
    const response = com.antigravity.InitializeRaceResponse.fromObject({
      success: true,
    });
    mockDataService.initializeRace.and.returnValue(of(response));
    mockDataService.getSavedRaces.and.returnValue(of([])); // no autosave

    component.startRace(false);
    tick();
    fixture.detectChanges();

    expect(mockDataService.initializeRace).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(["/raceday"]);
  }));

  it("should prompt to load autosave and load it if confirmed", fakeAsync(() => {
    component.selectedRace = component.races[0]; // entity_id: 'r1'
    component.selectedParticipants = [component.unselectedParticipants[0]];

    mockDataService.getSavedRaces.and.returnValue(of(["autosave_r1.json"]));
    mockDataService.loadRace.and.returnValue(of("OK"));

    component.startRace(false);
    flush();

    expect(component.showAutoSavePrompt).toBeTrue();
    expect(component.autoSaveFileToLoad).toBe("autosave_r1.json");

    component.onConfirmAutoSave();
    flush();

    expect(component.showAutoSavePrompt).toBeFalse();
    expect(mockDataService.loadRace).toHaveBeenCalledWith("autosave_r1.json");
    expect(mockRouter.navigate).toHaveBeenCalledWith(["/raceday"]);
    expect(mockDataService.initializeRace).not.toHaveBeenCalled();
  }));

  it("should prompt to load autosave and delete it if canceled", fakeAsync(() => {
    component.selectedRace = component.races[0]; // entity_id: 'r1'
    component.selectedParticipants = [component.unselectedParticipants[0]];

    mockDataService.getSavedRaces.and.returnValue(of(["autosave_r1.json"]));
    mockDataService.deleteSavedRace.and.returnValue(of("OK"));
    const response = com.antigravity.InitializeRaceResponse.fromObject({
      success: true,
    });
    mockDataService.initializeRace.and.returnValue(of(response));

    component.startRace(false);
    flush();

    expect(component.showAutoSavePrompt).toBeTrue();
    expect(component.autoSaveFileToLoad).toBe("autosave_r1.json");

    component.onCancelAutoSave();
    flush();

    expect(component.showAutoSavePrompt).toBeFalse();
    expect(mockDataService.deleteSavedRace).toHaveBeenCalledWith(
      "autosave_r1.json",
    );
    expect(mockDataService.initializeRace).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(["/raceday"]);
  }));

  it("should start demo race", fakeAsync(() => {
    component.selectedRace = component.races[0];
    component.selectedParticipants = [component.unselectedParticipants[0]];
    const response = com.antigravity.InitializeRaceResponse.fromObject({
      success: true,
    });
    mockDataService.initializeRace.and.returnValue(of(response));

    component.startRace(true);
    tick();
    fixture.detectChanges();

    expect(mockDataService.initializeRace).toHaveBeenCalledWith(
      jasmine.any(String),
      jasmine.any(Array),
      true,
    );
  }));

  it("should add all drivers", fakeAsync(() => {
    expect(component.filteredUnselectedParticipants.length).toBe(3);
    expect(component.selectedParticipants.length).toBe(0);

    component.addAllParticipants();
    flush();

    expect(component.filteredUnselectedParticipants.length).toBe(0);
    expect(component.selectedParticipants.length).toBe(3);
    expect(mockSettingsService.saveSettings).toHaveBeenCalled();
  }));

  it("should remove all drivers", fakeAsync(() => {
    // Setup initial state: select all
    component.addAllParticipants();
    flush();
    expect(component.selectedParticipants.length).toBe(3);

    component.removeAllParticipants();
    flush();

    expect(component.selectedParticipants.length).toBe(0);
    expect(component.filteredUnselectedParticipants.length).toBe(3);
    // Should be sorted alphabetically
    expect(component.filteredUnselectedParticipants[0].name).toBe("Driver 1");
    expect(mockSettingsService.saveSettings).toHaveBeenCalled();
  }));

  it("should randomize drivers", fakeAsync(() => {
    // Setup: add 3 mock drivers to have noticeable shuffle
    component.selectedParticipants = [
      { entity_id: "d1", name: "D1" } as any,
      { entity_id: "d2", name: "D2" } as any,
      { entity_id: "d3", name: "D3" } as any,
    ];
    const initialOrder = component.selectedParticipants
      .map((p) => p.entity_id)
      .join(",");

    // Mock Math.random to ensure a specific shuffle order for deterministic test if needed,
    // or just check that it calls saveSettings and keeps length.
    // Testing true randomness is flaky, so let's verify integration.
    spyOn(Math, "random").and.returnValue(0.5); // Simple mock

    component.randomizeParticipants();
    flush();

    expect(component.selectedParticipants.length).toBe(3);
    // With fixed random, order might change or not depending on impl,
    // but main goal is to ensure it runs without error and saves.
    expect(mockSettingsService.saveSettings).toHaveBeenCalled();
  }));

  it("should toggle options dropdown", () => {
    component.toggleOptionsDropdown(new MouseEvent("click"));
    expect(component.isOptionsDropdownOpen).toBeTrue();

    component.toggleOptionsDropdown(new MouseEvent("click"));
    expect(component.isOptionsDropdownOpen).toBeFalse();
  });

  it("should toggle localization dropdown", () => {
    component.toggleLocalizationDropdown(new MouseEvent("click"));
    expect(component.isLocalizationDropdownOpen).toBeTrue();

    component.toggleLocalizationDropdown(new MouseEvent("click"));
    expect(component.isLocalizationDropdownOpen).toBeFalse();
  });

  it("should select language and save setting", () => {
    component.selectLanguage("es");
    expect(mockTranslationService.setLanguage).toHaveBeenCalledWith("es");
    expect(mockSettingsService.saveSettings).toHaveBeenCalled();
    expect(component.currentLanguage).toBe("es");
    expect(component.isOptionsDropdownOpen).toBeFalse();
  });

  it("should get language display name", () => {
    mockTranslationService.getBrowserLanguage.and.returnValue("en");
    mockTranslationService.translate.and.callFake((key) => {
      if (key === "RDS_LANG_DEFAULT") return "Default";
      if (key === "RDS_LANG_EN") return "English (en)";
      return key;
    });

    expect(component.getLanguageDisplayName("")).toBe("Default (English (en))");
    expect(component.getLanguageDisplayName("en")).toBe("English (en)");
  });

  it("should start help guide with translated strings", () => {
    component.startHelp();
    expect(mockTranslationService.translate).toHaveBeenCalledWith(
      "RDS_HELP_WELCOME_TITLE",
    );
    expect(mockHelpService.startGuide).toHaveBeenCalled();
    const guideSteps = mockHelpService.startGuide.calls.mostRecent().args[0];
    expect(guideSteps[0].title).toBe("RDS_HELP_WELCOME_TITLE");
  });

  it("should not toggle selection on single click in available list", async () => {
    spyOn(component, "toggleParticipantSelection");
    await harness.clickDriverItem();
    expect(component.toggleParticipantSelection).not.toHaveBeenCalled();
  });

  it("should toggle selection on double click in available list", async () => {
    spyOn(component, "toggleParticipantSelection");
    await harness.doubleClickDriverItem();
    expect(component.toggleParticipantSelection).toHaveBeenCalled();
  });

  it("should preserve scroll position during refresh", fakeAsync(() => {
    // We use a mock element that doesn't clamp scrollTop
    const mockElement = { scrollTop: 150 };
    const mockViewChild = { nativeElement: mockElement };

    // Prevent Angular from overwriting our mock by defining it as a getter
    Object.defineProperty(component, "scrollContainer", {
      get: () => mockViewChild,
      set: () => {}, // Ignore Angular trying to set it
      configurable: true,
    });

    let actionCalled = false;
    component["updateListWithRefresh"](() => {
      actionCalled = true;
      // Simulate DOM update resetting scroll or clamping it
      mockElement.scrollTop = 0;
    });

    flush();
    fixture.detectChanges();

    expect(component.isRefreshingList).toBeFalse();
    expect(mockElement.scrollTop).toBe(150);
  }));

  it("should toggle help dropdown", () => {
    component.toggleHelpDropdown(new MouseEvent("click"));
    expect(component.isHelpDropdownOpen).toBeTrue();

    component.toggleHelpDropdown(new MouseEvent("click"));
    expect(component.isHelpDropdownOpen).toBeFalse();
  });

  it("should emit requestAbout when openAbout is called", () => {
    spyOn(component.requestAbout, "emit");
    component.openAbout();
    expect(component.requestAbout.emit).toHaveBeenCalled();
    expect(component.isHelpDropdownOpen).toBeFalse();
  });

  it("should load saved races and open modal", () => {
    component.loadSavedRaces();
    expect(mockDataService.getSavedRaces).toHaveBeenCalled();
    expect(component.showLoadRaceModal).toBeTrue();
    expect(component.savedRaces.length).toBe(2);
  });

  it("should delete saved race after confirmation", () => {
    spyOn(window, "confirm").and.returnValue(true);
    component.savedRaces = ["race1.json", "race2.json"];
    component.selectedSavedRace = "race1.json";

    const event = new MouseEvent("click");
    spyOn(event, "stopPropagation");

    component.deleteSavedRace(event, "race1.json");

    expect(event.stopPropagation).toHaveBeenCalled();
    expect(window.confirm).toHaveBeenCalled();
    expect(mockDataService.deleteSavedRace).toHaveBeenCalledWith("race1.json");
    expect(component.savedRaces).not.toContain("race1.json");
    expect(component.selectedSavedRace).toBeNull();
  });

  it("should show error modal when server returns DUPE_INDIVIDUAL_TEAM", fakeAsync(() => {
    component.selectedRace = { entity_id: "r1", name: "Grand Prix" } as any;
    component.selectedParticipants = [
      { entity_id: "d1", name: "Driver 1" },
    ] as any;

    mockDataService.getSavedRaces.and.returnValue(of([]));
    mockDataService.initializeRace.and.returnValue(
      of({
        success: false,
        errorCode: "DUPE_INDIVIDUAL_TEAM",
        driverName: "Driver 1",
        teamNames: ["Team A"],
      } as any),
    );

    component.startRace();
    tick();

    expect(component.showErrorModal).toBeTrue();
    expect(component.errorTitle).toBe("RDS_ERR_VALIDATION_TITLE");
    expect(component.errorMessage).toContain("Driver 1");
    expect(component.errorMessage).toContain("Team A");
  }));

  it("should show error modal when server returns DUPE_MULTIPLE_TEAMS", fakeAsync(() => {
    component.selectedRace = { entity_id: "r1", name: "Grand Prix" } as any;
    component.selectedParticipants = [
      { entity_id: "t1", name: "Team A" },
    ] as any;

    mockDataService.getSavedRaces.and.returnValue(of([]));
    mockDataService.initializeRace.and.returnValue(
      of({
        success: false,
        errorCode: "DUPE_MULTIPLE_TEAMS",
        driverName: "Driver 1",
        teamNames: ["Team A", "Team B"],
      } as any),
    );

    component.startRace();
    tick();

    expect(component.showErrorModal).toBeTrue();
    expect(component.errorMessage).toContain("Driver 1");
    expect(component.errorMessage).toContain("Team A");
    expect(component.errorMessage).toContain("Team B");
  }));
});
