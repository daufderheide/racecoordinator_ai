import { DragDropModule } from "@angular/cdk/drag-drop";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { Component, CUSTOM_ELEMENTS_SCHEMA, input } from "@angular/core";
import {
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
  tick,
} from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { BehaviorSubject as _BehaviorSubject, of } from "rxjs";
import { AnalyticsService } from "@app/analytics.service";
import { HelpOverlayComponent } from "@app/components/shared/help-overlay/help-overlay.component";
import { DataService } from "@app/data.service";
import { Settings as _Settings } from "@app/models/settings";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { InitializeRaceResponse, Race } from "@app/proto/antigravity";
import { FileSystemService } from "@app/services/file-system.service";
import { HelpService } from "@app/services/help.service";
import { LoggerService } from "@app/services/logger.service";
import { RaceService } from "@app/services/race.service";
import { SettingsService } from "@app/services/settings.service";
import { TranslationService } from "@app/services/translation.service";
import { MOCK_DRIVERS as _MOCK_DRIVERS } from "@app/testing/data/drivers_data";
import { MOCK_RACES as _MOCK_RACES } from "@app/testing/data/races_data";
import { createDefaultSettings } from "@app/testing/data/settings_data";
import { MOCK_TEAMS as _MOCK_TEAMS } from "@app/testing/data/teams_data";
import {
  mockAnalyticsService,
  mockLoggerService,
  mockRouter,
  mockSettingsService,
  mockTranslationService,
  resetMocks,
} from "@app/testing/unit-test-mocks";

import { DefaultRacedaySetupComponent } from "./default-raceday-setup.component";
import { DefaultRacedaySetupHarness } from "./testing/default-raceday-setup.harness";
import {
  createRacedaySetupDataServiceMock,
  createRacedaySetupHelpServiceMock,
  MOCK_AUTOSAVE_RACES as _MOCK_AUTOSAVE_RACES,
} from "./testing/raceday-setup_helper";

@Component({
  selector: "app-toolbar",
  standalone: true,
  template: "",
  imports: [FormsModule, DragDropModule],
})
class MockToolbarComponent {
  showAdd = input(false);
  showEdit = input(false);
  showHelp = input(false);
  showDelete = input(false);
  showCopy = input(false);
  showUndo = input(false);
  showRedo = input(false);
  isSaving = input(false);
  undoManager = input<any>();
  helpSteps = input<any[]>([]);
  helpTitle = input<string>("");
  helpRecordName = input<string | undefined>();
}

describe("DefaultRacedaySetupComponent", () => {
  let component: DefaultRacedaySetupComponent;
  let fixture: ComponentFixture<DefaultRacedaySetupComponent>;
  let harness: DefaultRacedaySetupHarness;
  let mockDataService: any;
  let mockRaceService: jasmine.SpyObj<RaceService>;
  let mockFileSystemService: jasmine.SpyObj<FileSystemService>;
  let mockHelpService: any;

  beforeEach(() => {
    mockDataService = createRacedaySetupDataServiceMock();
    mockRaceService = jasmine.createSpyObj("RaceService", ["startRace"]);

    // Configure shared mocks from unit-test-mocks or provide specific overrides
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
    (mockTranslationService as any).getSupportedLanguages = jasmine
      .createSpy()
      .and.returnValue([
        { code: "en", nameKey: "RDS_LANG_EN" },
        { code: "es", nameKey: "RDS_LANG_ES" },
      ]);
    (mockTranslationService as any).getBrowserLanguage = jasmine
      .createSpy()
      .and.returnValue("en");
    (mockTranslationService as any).setLanguage = jasmine.createSpy();

    // Robust SettingsService mock that maintains state for tests
    let currentSettings = createDefaultSettings({
      recentRaceIds: ["r1"],
      selectedDriverIds: [],
      serverIp: "localhost",
      serverPort: 7070,
      language: "",
      racedaySetupWalkthroughSeen: true,
      sortByStandings: true,
    });
    mockSettingsService.getSettings.and.callFake(() => currentSettings);
    (mockSettingsService as any).settings = currentSettings; // For direct property access
    (mockSettingsService as any).updateSettings = jasmine
      .createSpy("updateSettings")
      .and.callFake((update: any) => {
        currentSettings = { ...currentSettings, ...update };
        (mockSettingsService as any).settings = currentSettings;
        mockSettingsService.saveSettings(currentSettings);
      });

    mockFileSystemService = jasmine.createSpyObj("FileSystemService", [
      "selectCustomFolder",
      "clearCustomFolder",
    ]);

    mockHelpService = createRacedaySetupHelpServiceMock();

    const mockActivatedRoute = {
      queryParams: of({}),
      snapshot: {
        queryParamMap: {
          get: jasmine.createSpy("get").and.returnValue(null),
        },
      },
    };

    TestBed.configureTestingModule({
      imports: [
        FormsModule,
        DragDropModule,
        DefaultRacedaySetupComponent,
        TranslatePipe,
        HelpOverlayComponent,
        MockToolbarComponent,
      ],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: RaceService, useValue: mockRaceService },
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: SettingsService, useValue: mockSettingsService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: FileSystemService, useValue: mockFileSystemService },
        { provide: HelpService, useValue: mockHelpService },
        { provide: AnalyticsService, useValue: mockAnalyticsService },
        { provide: LoggerService, useValue: mockLoggerService },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DefaultRacedaySetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    resetMocks();
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
    flush();
    fixture.detectChanges();

    const driverToSelect = component.filteredUnselectedParticipants.find(
      (d: any) => d.entity_id === "d2",
    )!;
    component.toggleParticipantSelection(driverToSelect, false);
    flush(); // updateListWithRefresh
    fixture.detectChanges();

    expect(component.selectedParticipants.length).toBe(1);
    expect(component.selectedParticipants[0].entity_id).toBe("d2");

    const driverToUnselect = component.selectedParticipants[0];
    component.toggleParticipantSelection(driverToUnselect, true);
    flush(); // updateListWithRefresh
    fixture.detectChanges();

    expect(component.selectedParticipants.length).toBe(0);
    expect(component.filteredUnselectedParticipants.length).toBe(6);
  }));

  it("should toggle team selection", fakeAsync(() => {
    expect(component.filteredUnselectedParticipants.length).toBe(6);
    const teamToSelect = component.filteredUnselectedParticipants.find(
      (d: any) => d.entity_id === "t1",
    )!;
    component.toggleParticipantSelection(teamToSelect, false);
    flush(); // Wait for updateListWithRefresh setTimeout
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
    expect(component.filteredUnselectedParticipants.length).toBe(6);
    component.driverSearchQuery = "Alice";
    expect(component.filteredUnselectedParticipants.length).toBe(1);
    expect(component.filteredUnselectedParticipants[0].name).toBe("Alice");
  });

  it("should search races", () => {
    expect(component.filteredRaces.length).toBe(3);
    component.raceSearchQuery = "Endurance";
    expect(component.filteredRaces.length).toBe(1);
    expect(component.filteredRaces[0].name).toBe("Endurance Challenge");
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

    const response = InitializeRaceResponse.fromObject({
      success: true,
    });
    mockDataService.getSavedRaces.and.returnValue(of([])); // no autosave
    mockDataService.initializeRace.and.returnValue(of(response));

    component.startRace(false);
    flush(); // startRace calls getSavedRaces and proceedWithStart
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
    const response = InitializeRaceResponse.fromObject({
      success: true,
    });
    mockDataService.initializeRace.and.returnValue(of(response));
    mockDataService.getSavedRaces.and.returnValue(of([])); // no autosave

    component.startRace(false);
    flush();
    fixture.detectChanges();

    expect(mockDataService.initializeRace).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(["/raceday"]);
  }));

  it("should prompt to load autosave and load it if confirmed", fakeAsync(() => {
    component.selectedRace = component.races.find((r) => r.entity_id === "r1");
    component.selectedParticipants = [component.unselectedParticipants[0]];
    mockDataService.getSavedRaces.and.returnValue(of(["autosave_r1.json"]));
    mockDataService.loadRace.and.returnValue(of(Race.fromObject({})));

    component.startRace(false);
    tick();

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
    component.selectedRace = component.races.find((r) => r.entity_id === "r1");
    component.selectedParticipants = [component.unselectedParticipants[0]];

    mockDataService.getSavedRaces.and.returnValue(of(["autosave_r1.json"]));
    mockDataService.deleteSavedRace.and.returnValue(of("OK"));
    const response = InitializeRaceResponse.fromObject({
      success: true,
    });
    mockDataService.initializeRace.and.returnValue(of(response));

    component.startRace(false);
    tick();

    expect(component.showAutoSavePrompt).toBeTrue();
    expect(component.autoSaveFileToLoad).toBe("autosave_r1.json");

    component.onCancelAutoSave();
    tick();

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
    const response = InitializeRaceResponse.fromObject({
      success: true,
    });
    mockDataService.getSavedRaces.and.returnValue(of([])); // Bypass auto-save prompt
    mockDataService.initializeRace.and.returnValue(of(response));

    component.startRace(true);
    flush();
    fixture.detectChanges();

    expect(mockDataService.initializeRace).toHaveBeenCalledWith(
      jasmine.any(String),
      jasmine.any(Array),
      true,
    );
  }));

  it("should add all drivers", fakeAsync(() => {
    expect(component.filteredUnselectedParticipants.length).toBe(6);
    expect(component.selectedParticipants.length).toBe(0);

    component.addAllParticipants();
    flush();

    expect(component.filteredUnselectedParticipants.length).toBe(0);
    expect(component.selectedParticipants.length).toBe(6);
    expect(mockSettingsService.saveSettings).toHaveBeenCalled();
  }));

  it("should remove all drivers", fakeAsync(() => {
    // Setup initial state: select all
    component.addAllParticipants();
    flush();
    expect(component.selectedParticipants.length).toBe(6);

    component.removeAllParticipants();
    flush();

    expect(component.selectedParticipants.length).toBe(0);
    expect(component.filteredUnselectedParticipants.length).toBe(6);
    // Should be sorted alphabetically
    expect(component.filteredUnselectedParticipants[0].name).toBe("Alice");
    expect(mockSettingsService.saveSettings).toHaveBeenCalled();
  }));

  it("should randomize drivers", fakeAsync(() => {
    // Setup: add 3 mock drivers to have noticeable shuffle
    component.selectedParticipants = [
      { entity_id: "d1", name: "D1" } as any,
      { entity_id: "d2", name: "D2" } as any,
      { entity_id: "d3", name: "D3" } as any,
    ];
    const _initialOrder = component.selectedParticipants
      .map((p) => p.entity_id)
      .join(",");

    spyOn(Math, "random").and.returnValue(0.5); // Simple mock

    component.randomizeParticipants();
    flush();

    expect(component.selectedParticipants.length).toBe(3);
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
    const mockElement = { scrollTop: 150 };
    const mockViewChild = { nativeElement: mockElement };

    Object.defineProperty(component, "scrollContainer", {
      get: () => mockViewChild,
      set: () => {},
      configurable: true,
    });

    let _actionCalled = false;
    component["updateListWithRefresh"](() => {
      _actionCalled = true;
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
    // In this spec, we mock 2 saved races in the helper
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
      { entity_id: "d1", name: "Alice" },
    ] as any;

    mockDataService.getSavedRaces.and.returnValue(of([]));
    mockDataService.initializeRace.and.returnValue(
      of({
        success: false,
        errorCode: "DUPE_INDIVIDUAL_TEAM",
        driverName: "Alice",
        teamNames: ["Team Alpha"],
      } as any),
    );

    component.startRace();
    flush();

    expect(component.showErrorModal).toBeTrue();
    expect(component.errorTitle).toBe("RDS_ERR_VALIDATION_TITLE");
    expect(component.errorMessage).toContain("Alice");
    expect(component.errorMessage).toContain("Team Alpha");
  }));

  it("should show error modal when server returns DUPE_MULTIPLE_TEAMS", fakeAsync(() => {
    component.selectedRace = { entity_id: "r1", name: "Grand Prix" } as any;
    component.selectedParticipants = [
      { entity_id: "t1", name: "Team Alpha" },
    ] as any;

    mockDataService.getSavedRaces.and.returnValue(of([]));
    mockDataService.initializeRace.and.returnValue(
      of({
        success: false,
        errorCode: "DUPE_MULTIPLE_TEAMS",
        driverName: "Alice",
        teamNames: ["Team Alpha", "Team Beta"],
      } as any),
    );

    component.startRace();
    flush();

    expect(component.showErrorModal).toBeTrue();
    expect(component.errorMessage).toContain("Alice");
    expect(component.errorMessage).toContain("Team Alpha");
    expect(component.errorMessage).toContain("Team Beta");
  }));
});
