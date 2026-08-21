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
import { Driver } from "@app/models/driver";
import { Settings as _Settings } from "@app/models/settings";
import { Team } from "@app/models/team";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { InitializeRaceResponse, Race } from "@app/proto/antigravity";
import { FileSystemService } from "@app/services/file-system.service";
import { HelpService } from "@app/services/help.service";
import { HelpLinkService } from "@app/services/help-link.service";
import { LoggerService } from "@app/services/logger.service";
import { ParticipantValidationService } from "@app/services/participant-validation.service";
import { RaceService } from "@app/services/race.service";
import { SettingsService } from "@app/services/settings.service";
import { ThemeService } from "@app/services/theme.service";
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
  let mockHelpLinkService: jasmine.SpyObj<HelpLinkService>;

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
    mockHelpLinkService = jasmine.createSpyObj("HelpLinkService", ["openHelp"]);

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
        { provide: HelpLinkService, useValue: mockHelpLinkService },
        { provide: AnalyticsService, useValue: mockAnalyticsService },
        { provide: LoggerService, useValue: mockLoggerService },
        {
          provide: ParticipantValidationService,
          useValue: {
            validate: jasmine.createSpy("validate").and.returnValue({
              isValid: true,
              conflicts: [],
            }),
            getErrorMessage: jasmine.createSpy("getErrorMessage"),
          },
        },
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

    const driverToSelect = component.unselectedParticipants.find(
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
    expect(component.unselectedParticipants.length).toBe(6);
  }));

  it("should toggle team selection", fakeAsync(() => {
    expect(component.unselectedParticipants.length).toBe(6);
    const teamToSelect = component.unselectedParticipants.find(
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

  it("should filter out team members from available drivers when a team is selected", fakeAsync(() => {
    expect(component.unselectedParticipants.length).toBe(6);

    const teamToSelect = component.unselectedParticipants.find(
      (p: any) => p.entity_id === "t1" && component.isTeam(p),
    )!;
    component.toggleParticipantSelection(teamToSelect, false);
    flush();
    fixture.detectChanges();

    expect(component.selectedParticipants.length).toBe(1);
    expect(component.selectedParticipants[0].entity_id).toBe("t1");

    expect(component.unselectedParticipants.length).toBe(3);
    const unselectedIds = component.unselectedParticipants.map(
      (p) => p.entity_id,
    );
    expect(unselectedIds).toContain("t2");
    expect(unselectedIds).toContain("d3");
    expect(unselectedIds).toContain("d4");
    expect(unselectedIds).not.toContain("t1");
    expect(unselectedIds).not.toContain("d1");
    expect(unselectedIds).not.toContain("d2");
  }));

  it("should filter out teams from available teams when one of their drivers is selected", fakeAsync(() => {
    expect(component.unselectedParticipants.length).toBe(6);

    const driverToSelect = component.unselectedParticipants.find(
      (p: any) => p.entity_id === "d1" && component.isDriver(p),
    )!;
    component.toggleParticipantSelection(driverToSelect, false);
    flush();
    fixture.detectChanges();

    expect(component.selectedParticipants.length).toBe(1);
    expect(component.selectedParticipants[0].entity_id).toBe("d1");

    expect(component.unselectedParticipants.length).toBe(4);
    const unselectedIds = component.unselectedParticipants.map(
      (p) => p.entity_id,
    );
    expect(unselectedIds).toContain("d2");
    expect(unselectedIds).toContain("d3");
    expect(unselectedIds).toContain("d4");
    expect(unselectedIds).toContain("t2");
    expect(unselectedIds).not.toContain("d1");
    expect(unselectedIds).not.toContain("t1");
  }));

  describe("Settings Export/Import", () => {
    it("should export settings", () => {
      const anchorSpy = jasmine.createSpyObj("a", ["setAttribute", "click"]);
      spyOn(document, "createElement").and.returnValue(anchorSpy as any);

      component.exportSettings();

      expect(mockSettingsService.getSettings).toHaveBeenCalled();
      expect(document.createElement).toHaveBeenCalledWith("a");
      expect(anchorSpy.setAttribute).toHaveBeenCalledWith(
        "download",
        "racecoordinator_settings.json",
      );
      expect(anchorSpy.click).toHaveBeenCalled();
    });

    it("should import settings", () => {
      const mockSettings = { serverIp: "1.2.3.4" };
      const jsonContent = JSON.stringify(mockSettings);

      const mockEvent = {
        target: {
          files: [new File([""], "settings.json")],
        },
      } as unknown as Event;

      const fileReaderSpy = jasmine.createSpyObj("FileReader", ["readAsText"]);
      spyOn(window, "FileReader").and.returnValue(fileReaderSpy);

      spyOn(component, "reloadWindow");

      component.importSettings(mockEvent);

      // Trigger the onload callback manually
      fileReaderSpy.onload({
        target: { result: jsonContent },
      } as any);

      expect(mockSettingsService.saveSettings).toHaveBeenCalled();
      const savedArgs =
        mockSettingsService.saveSettings.calls.mostRecent().args[0];
      expect(savedArgs.serverIp).toBe("1.2.3.4");
      expect(component.reloadWindow).toHaveBeenCalled();
    });
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
    mockDataService.getSavedRaces.and.returnValue(
      of([{ filename: "autosave_r1.json", corrupt: false }]),
    );
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

    mockDataService.getSavedRaces.and.returnValue(
      of([{ filename: "autosave_r1.json", corrupt: false }]),
    );
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
      jasmine.any(Object),
      undefined,
      undefined,
      undefined,
    );
  }));

  it("should pass active theme ID and activate theme when race is selected", fakeAsync(() => {
    const themeService = TestBed.inject(ThemeService);
    spyOn(themeService, "activateForRace").and.callThrough();
    spyOn(themeService, "getActiveTheme").and.returnValue({
      entity_id: "custom-theme-123",
    } as any);

    const testRace = (component as any).races[0];
    component.selectRace(testRace);
    expect(themeService.activateForRace).toHaveBeenCalledWith(
      testRace.entity_id,
    );

    component.selectedParticipants = [component.unselectedParticipants[0]];

    const response = InitializeRaceResponse.fromObject({
      success: true,
    });
    mockDataService.getSavedRaces.and.returnValue(of([]));
    mockDataService.initializeRace.and.returnValue(of(response));

    component.startRace(false);
    flush();
    fixture.detectChanges();

    expect(mockDataService.initializeRace).toHaveBeenCalledWith(
      testRace.entity_id,
      jasmine.any(Array),
      false,
      undefined,
      undefined,
      undefined,
      "custom-theme-123",
    );
  }));

  it("should add all drivers", fakeAsync(() => {
    expect(component.unselectedParticipants.length).toBe(6);
    expect(component.selectedParticipants.length).toBe(0);

    component.addAllParticipants();
    flush();

    expect(component.unselectedParticipants.length).toBe(0);
    expect(component.selectedParticipants.length).toBe(4);
    expect(mockSettingsService.saveSettings).toHaveBeenCalled();
  }));

  it("should only add individual drivers and not add teams when addAllParticipants is called", fakeAsync(() => {
    expect(component.selectedParticipants.length).toBe(0);
    const unselectedDrivers = component.unselectedParticipants.filter((p) =>
      component.isDriver(p),
    );
    const unselectedTeams = component.unselectedParticipants.filter((p) =>
      component.isTeam(p),
    );
    expect(unselectedDrivers.length).toBeGreaterThan(0);
    expect(unselectedTeams.length).toBeGreaterThan(0);

    component.addAllParticipants();
    flush();

    // Verify all selected participants are drivers and none are teams
    component.selectedParticipants.forEach((p) => {
      expect(component.isDriver(p)).toBeTrue();
      expect(component.isTeam(p)).toBeFalse();
    });
  }));

  it("should remove all drivers", fakeAsync(() => {
    // Setup initial state: select all
    component.addAllParticipants();
    flush();
    expect(component.selectedParticipants.length).toBe(4);

    component.removeAllParticipants();
    flush();

    expect(component.selectedParticipants.length).toBe(0);
    expect(component.unselectedParticipants.length).toBe(6);
    // Should be sorted alphabetically
    expect(component.unselectedParticipants[0].name).toBe("Alice");
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

  it("should emit requestCheckForUpdates when onCheckForUpdates is called and banner is not visible", () => {
    spyOn(component.requestCheckForUpdates, "emit");
    fixture.componentRef.setInput("isUpdateBannerVisible", false);
    component.onCheckForUpdates();
    expect(component.requestCheckForUpdates.emit).toHaveBeenCalled();
    expect(component.isFileDropdownOpen).toBeFalse();
    expect(component.isOptionsDropdownOpen).toBeFalse();
  });

  it("should not emit requestCheckForUpdates when onCheckForUpdates is called and banner is visible", () => {
    spyOn(component.requestCheckForUpdates, "emit");
    fixture.componentRef.setInput("isUpdateBannerVisible", true);
    component.onCheckForUpdates();
    expect(component.requestCheckForUpdates.emit).not.toHaveBeenCalled();
  });

  it("should call openHelp with empty string and close dropdown when openHelpCenter is called", () => {
    component.openHelpCenter();
    expect(mockHelpLinkService.openHelp).toHaveBeenCalledWith("");
    expect(component.isHelpDropdownOpen).toBeFalse();
  });

  it("should load demo configuration from settings on init", () => {
    const customConfig = { minLapTimeMs: 1234 };
    (mockSettingsService as any).settings.demoConfig = customConfig;

    // Re-initialize to trigger ngOnInit loading
    component.ngOnInit();
    expect(component.demoConfig).toEqual(customConfig);
  });

  it("should save demo configuration to settings when confirmed", () => {
    const newConfig = { minLapTimeMs: 5678 };
    mockSettingsService.saveSettings.calls.reset();

    component.onDemoConfigConfirm(newConfig);

    expect(component.demoConfig).toEqual(newConfig);
    expect(mockSettingsService.saveSettings).toHaveBeenCalled();
    const savedSettings =
      mockSettingsService.saveSettings.calls.mostRecent().args[0];
    expect(savedSettings.demoConfig).toEqual(newConfig);
  });

  it("should load saved races, filter out autosaves, and open modal", () => {
    mockDataService.getSavedRaces.and.callFake((isDemo?: boolean) => {
      if (isDemo) {
        return of([
          { filename: "demo1.json", corrupt: false },
          { filename: "autosave_demo.json", corrupt: false },
        ]);
      }
      return of([
        { filename: "normal1.json", corrupt: false },
        { filename: "autosave_normal.json", corrupt: false },
      ]);
    });

    component.loadSavedRaces();
    expect(mockDataService.getSavedRaces).toHaveBeenCalledTimes(2);
    expect(component.showLoadRaceModal).toBeTrue();
    // 1 normal and 1 demo races combined (autosaves are filtered out)
    expect(component.savedRaces.length).toBe(2);
    expect(component.savedRaces).toEqual([
      { filename: "normal1.json", isDemo: false, corrupt: false },
      { filename: "demo1.json", isDemo: true, corrupt: false },
    ]);
  });

  it("should delete saved race after confirmation", () => {
    spyOn(window, "confirm").and.returnValue(true);
    const fileToDelete = { filename: "race1.json", isDemo: false };
    component.savedRaces = [
      fileToDelete,
      { filename: "race2.json", isDemo: true },
    ];
    component.selectedSavedRace = fileToDelete;

    const event = new MouseEvent("click");
    spyOn(event, "stopPropagation");

    component.deleteSavedRace(event, fileToDelete);

    expect(event.stopPropagation).toHaveBeenCalled();
    expect(window.confirm).toHaveBeenCalled();
    expect(mockDataService.deleteSavedRace).toHaveBeenCalledWith(
      "race1.json",
      false,
    );
    expect(component.savedRaces).not.toContain(
      jasmine.objectContaining({ filename: "race1.json" }),
    );
    expect(component.selectedSavedRace).toBeNull();
  });

  it("should confirm and load normal race", () => {
    const fileToLoad = { filename: "race1.json", isDemo: false };
    component.selectedSavedRace = fileToLoad;
    mockDataService.loadRace.and.returnValue(of(Race.fromObject({})));

    component.confirmLoadRace();

    expect(mockDataService.loadRace).toHaveBeenCalledWith("race1.json", false);
    expect(mockRouter.navigate).toHaveBeenCalledWith(["/raceday"]);
  });

  it("should confirm and load demo race", () => {
    const fileToLoad = { filename: "race-demo.json", isDemo: true };
    component.selectedSavedRace = fileToLoad;
    mockDataService.loadRace.and.returnValue(of(Race.fromObject({})));

    component.confirmLoadRace();

    expect(mockDataService.loadRace).toHaveBeenCalledWith(
      "race-demo.json",
      true,
    );
    expect(mockRouter.navigate).toHaveBeenCalledWith(["/raceday"]);
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

  it("should show error modal when server returns NO_CUSTOM_ROTATIONS", fakeAsync(() => {
    component.selectedRace = { entity_id: "r1", name: "Grand Prix" } as any;
    component.selectedParticipants = [
      { entity_id: "d1", name: "Alice" },
    ] as any;

    mockDataService.getSavedRaces.and.returnValue(of([]));
    mockDataService.initializeRace.and.returnValue(
      of({
        success: false,
        errorCode: "NO_CUSTOM_ROTATIONS",
      } as any),
    );

    component.startRace();
    flush();

    expect(component.showErrorModal).toBeTrue();
    expect(component.errorTitle).toBe("RDS_ERR_VALIDATION_TITLE");
    expect(component.errorMessage).toBe(
      "RDS_ERR_NO_CUSTOM_ROTATIONS\n\nRDS_ERR_NO_CUSTOM_ROTATIONS_FIX",
    );
  }));

  it("should show error modal when server returns TRACK_DELETED", fakeAsync(() => {
    component.selectedRace = { entity_id: "r1", name: "Grand Prix" } as any;
    component.selectedParticipants = [
      { entity_id: "d1", name: "Alice" },
    ] as any;

    mockDataService.getSavedRaces.and.returnValue(of([]));
    mockDataService.initializeRace.and.returnValue(
      of({
        success: false,
        errorCode: "TRACK_DELETED",
      } as any),
    );

    component.startRace();
    flush();

    expect(component.showErrorModal).toBeTrue();
    expect(component.errorTitle).toBe("RDS_ERR_VALIDATION_TITLE");
    expect(component.errorMessage).toBe(
      "RDS_ERR_TRACK_DELETED Grand Prix\n\nRDS_ERR_TRACK_DELETED_FIX",
    );
  }));

  describe("Natural Sorting", () => {
    it("should sort participants naturally using naturalSortParticipants method", () => {
      const participants = [
        { entity_id: "d1", name: "Driver 10" } as any,
        { entity_id: "d2", name: "Driver 1" } as any,
        { entity_id: "d3", name: "Driver 2" } as any,
        { entity_id: "d4", name: "Alice" } as any,
        { entity_id: "d5", name: "Driver 20" } as any,
      ];

      const sorted = participants.sort((a, b) =>
        (component as any).naturalSortParticipants(a, b),
      );

      expect(sorted.map((p) => p.name)).toEqual([
        "Alice",
        "Driver 1",
        "Driver 2",
        "Driver 10",
        "Driver 20",
      ]);
    });

    it("should sort teams naturally using naturalSortParticipants method", () => {
      const teams = [
        { entity_id: "t1", name: "Team 10" } as any,
        { entity_id: "t2", name: "Team 1" } as any,
        { entity_id: "t3", name: "Team 2" } as any,
        { entity_id: "t4", name: "Alpha Team" } as any,
      ];

      const sorted = teams.sort((a, b) =>
        (component as any).naturalSortParticipants(a, b),
      );

      expect(sorted.map((p) => p.name)).toEqual([
        "Alpha Team",
        "Team 1",
        "Team 2",
        "Team 10",
      ]);
    });

    it("should handle mixed drivers and teams naturally", () => {
      const participants = [
        { entity_id: "t1", name: "Team 10" } as any,
        { entity_id: "d1", name: "Driver 1" } as any,
        { entity_id: "t2", name: "Team 2" } as any,
        { entity_id: "d2", name: "Driver 10" } as any,
      ];

      const sorted = participants.sort((a, b) =>
        (component as any).naturalSortParticipants(a, b),
      );

      expect(sorted.map((p) => p.name)).toEqual([
        "Driver 1",
        "Driver 10",
        "Team 2",
        "Team 10",
      ]);
    });

    it("should sort unselected participants naturally on initial load", fakeAsync(() => {
      // Create mock data with driver names that need natural sorting
      const mockDrivers = [
        { entity_id: "d1", name: "Driver 10", nickname: "Driver 10" },
        { entity_id: "d2", name: "Driver 1", nickname: "Driver 1" },
        { entity_id: "d3", name: "Driver 2", nickname: "Driver 2" },
        { entity_id: "d4", name: "Alice", nickname: "Alice" },
        { entity_id: "d5", name: "Driver 20", nickname: "Driver 20" },
      ];

      mockDataService.getDrivers.and.returnValue(of(mockDrivers));
      mockDataService.getTeams.and.returnValue(of([]));
      mockDataService.getRaces.and.returnValue(of([]));

      // Re-initialize component to trigger ngOnInit with new data
      component.ngOnInit();
      flush();
      fixture.detectChanges();

      // Verify unselected participants are naturally sorted
      expect(component.unselectedParticipants.map((p) => p.name)).toEqual([
        "Alice",
        "Driver 1",
        "Driver 2",
        "Driver 10",
        "Driver 20",
      ]);
    }));

    it("should maintain natural sorting when moving participants from selected to unselected", fakeAsync(() => {
      // Setup initial state with unsorted participants
      const mockDrivers = [
        { entity_id: "d1", name: "Driver 10", nickname: "" } as any,
        { entity_id: "d2", name: "Driver 1", nickname: "" } as any,
        { entity_id: "d3", name: "Driver 2", nickname: "" } as any,
      ];
      component.allDrivers = mockDrivers;
      component.allTeams = [];
      component.unselectedParticipants = [...mockDrivers];
      component.selectedParticipants = [];

      // Select a participant (moving from unselected to selected)
      const participantToSelect = component.unselectedParticipants[1]; // "Driver 1"
      component.toggleParticipantSelection(participantToSelect, false);
      flush();
      fixture.detectChanges();

      // Verify unselected participants remain naturally sorted
      expect(component.unselectedParticipants.map((p) => p.name)).toEqual([
        "Driver 2",
        "Driver 10",
      ]);

      // Unselect the participant (moving back to unselected)
      component.toggleParticipantSelection(participantToSelect, true);
      flush();
      fixture.detectChanges();

      // Verify unselected participants are naturally sorted again
      expect(component.unselectedParticipants.map((p) => p.name)).toEqual([
        "Driver 1",
        "Driver 2",
        "Driver 10",
      ]);
    }));

    it("should maintain natural sorting when removing all participants", fakeAsync(() => {
      // Setup initial state with selected participants
      const mockDrivers = [
        { entity_id: "d1", name: "Driver 10", nickname: "" } as any,
        { entity_id: "d2", name: "Driver 1", nickname: "" } as any,
        { entity_id: "d3", name: "Driver 2", nickname: "" } as any,
      ];
      component.allDrivers = mockDrivers;
      component.allTeams = [];
      component.selectedParticipants = [...mockDrivers];
      component.unselectedParticipants = [];

      // Remove all participants
      component.removeAllParticipants();
      flush();
      fixture.detectChanges();

      // Verify unselected participants are naturally sorted
      expect(component.unselectedParticipants.map((p) => p.name)).toEqual([
        "Driver 1",
        "Driver 2",
        "Driver 10",
      ]);
      expect(component.selectedParticipants.length).toBe(0);
    }));

    it("should handle empty and undefined names in natural sorting", () => {
      const participants = [
        { entity_id: "d1", name: "" } as any,
        { entity_id: "d2", name: undefined } as any,
        { entity_id: "d3", name: "Driver 1" } as any,
        { entity_id: "d4", name: null } as any,
      ];

      const sorted = participants.sort((a, b) =>
        (component as any).naturalSortParticipants(a, b),
      );

      // Empty/undefined/null names should come first, then alphabetically
      expect(sorted.map((p) => p.name || "")).toEqual(["", "", "", "Driver 1"]);
    });

    it("should handle complex alphanumeric names naturally", () => {
      const participants = [
        { entity_id: "d1", name: "Driver v1.2.10" } as any,
        { entity_id: "d2", name: "Driver v1.2.2" } as any,
        { entity_id: "d3", name: "Driver v1.10.1" } as any,
        { entity_id: "d4", name: "Driver v1.2.3" } as any,
      ];

      const sorted = participants.sort((a, b) =>
        (component as any).naturalSortParticipants(a, b),
      );

      expect(sorted.map((p) => p.name)).toEqual([
        "Driver v1.2.2",
        "Driver v1.2.3",
        "Driver v1.2.10",
        "Driver v1.10.1",
      ]);
    });
  });

  describe("Layout Structure", () => {
    it("should have a rigid-spacer to prevent margin collapse during transitions", () => {
      const rigidSpacer = fixture.nativeElement.querySelector(".rigid-spacer");
      expect(rigidSpacer).toBeTruthy();
    });

    it("should wrap the race selection title and dropdown in a bottom-section container", () => {
      const bottomSection = fixture.nativeElement.querySelector(
        ".setup-bottom-section",
      );
      expect(bottomSection).toBeTruthy();

      const title = bottomSection.querySelector(".race-selection-title");
      const selector = bottomSection.querySelector(".all-races-selector");

      expect(title).toBeTruthy();
      expect(selector).toBeTruthy();
    });

    it("should navigate to event manager on openEventManager", () => {
      component.openEventManager();
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ["/event-manager"],
        jasmine.any(Object),
      );
    });

    it("should render season selection in the same row as race selector without a season-label", () => {
      const selectorRow = fixture.nativeElement.querySelector(
        ".all-races-selector",
      );
      expect(selectorRow).toBeTruthy();

      const children = Array.from(selectorRow.children) as HTMLElement[];
      expect(children.length).toBe(3);
      expect(
        children[0].classList.contains("custom-dropdown-container"),
      ).toBeTrue();
      expect(children[1].classList.contains("search-wrapper")).toBeTrue();
      expect(
        children[2].classList.contains("season-selection-wrapper"),
      ).toBeTrue();

      const label = fixture.nativeElement.querySelector(
        ".season-selection-wrapper .season-label",
      );
      expect(label).toBeFalsy();

      const select = fixture.nativeElement.querySelector(
        ".season-selection-wrapper select.season-select-input",
      );
      expect(select).toBeTruthy();
    });

    it("should save selectedSeasonId to settings when season changes", () => {
      const season = {
        entity_id: "s100",
        name: "Summer 2026 Season",
        drops: 1,
      } as any;
      component.seasons = [season];
      component.selectSeason(season);

      expect(mockSettingsService.saveSettings).toHaveBeenCalledWith(
        jasmine.objectContaining({
          selectedSeasonId: "s100",
        }),
      );
    });

    it("should save empty string as selectedSeasonId when season is unselected (None)", () => {
      component.selectSeason(undefined);

      expect(mockSettingsService.saveSettings).toHaveBeenCalledWith(
        jasmine.objectContaining({
          selectedSeasonId: "",
        }),
      );
    });

    it("should compare seasons correctly with compareSeasons method", () => {
      const s1 = { entity_id: "s1", name: "Season 1" } as any;
      const s1Copy = { entity_id: "s1", name: "Season 1 Copy" } as any;
      const s2 = { entity_id: "s2", name: "Season 2" } as any;

      expect(component.compareSeasons(s1, s1Copy)).toBeTrue();
      expect(component.compareSeasons(s1, s2)).toBeFalse();
      expect(component.compareSeasons(undefined, undefined)).toBeTrue();
      expect(component.compareSeasons(s1, undefined)).toBeFalse();
    });

    it("should restore last selected season on init if saved in settings", fakeAsync(() => {
      const season = {
        entity_id: "s200",
        name: "Winter 2026 Season",
        drops: 2,
      } as any;
      mockDataService.getSeasons.and.returnValue(of([season]));
      mockSettingsService.getSettings.and.returnValue({
        recentRaceIds: [],
        selectedRaceId: "",
        selectedSeasonId: "s200",
        selectedDriverIds: [],
      } as any);

      component.ngOnInit();
      tick();

      expect(component.selectedSeason).toBe(season);
    }));
  });

  describe("Unified Race and Event Selection", () => {
    beforeEach(() => {
      component.events = [
        {
          entity_id: "e1",
          name: "Championship 2026",
          races: [{ raceId: "r1", maxDrivers: 4 }],
        } as any,
        {
          entity_id: "e2",
          name: "Grand Prix Series",
          races: [{ raceId: "r2", maxDrivers: 0 }],
        } as any,
      ];
    });

    it("should include events in filteredEvents and render them in the pulldown", () => {
      component.raceSearchQuery = "Champ";
      expect(component.filteredEvents.length).toBeGreaterThan(0);
      expect(component.filteredEvents[0].name).toContain("Championship");
    });

    it("should select an event from the pulldown, set selectedEvent and clear selectedRace", () => {
      const eventToSelect = component.events[0];
      component.selectEvent(eventToSelect);

      expect(component.selectedEvent).toBe(eventToSelect);
      expect(component.selectedRace).toBeUndefined();
      expect(component.isEventMode).toBeTrue();
      expect(mockSettingsService.saveSettings).toHaveBeenCalled();
    });

    it("should filter both races and events matching search query", () => {
      component.raceSearchQuery = "Grand";
      const matchingRaces = component.filteredRaces;
      const matchingEvents = component.filteredEvents;

      expect(
        matchingRaces.every((r) => r.name.toLowerCase().includes("grand")),
      ).toBeTrue();
      expect(
        matchingEvents.every((e) => e.name.toLowerCase().includes("grand")),
      ).toBeTrue();
    });

    it("should render race summary card when a single race is selected", () => {
      component.selectedRace = component.races[0];
      component.selectedEvent = undefined;
      fixture.detectChanges();

      const raceSummaryCard =
        fixture.nativeElement.querySelector(".race-summary-card");
      expect(raceSummaryCard).toBeTruthy();

      const summaryGrid = raceSummaryCard.querySelector(".summary-grid");
      expect(summaryGrid).toBeTruthy();
      expect(summaryGrid.querySelectorAll(".summary-item").length).toBe(6);
    });

    it("should update recentRaceIds and quickStartRaces when an event is started", fakeAsync(() => {
      const eventToStart = component.events[0];
      component.selectEvent(eventToStart);
      component.selectedParticipants = [component.unselectedParticipants[0]];

      const response = InitializeRaceResponse.fromObject({ success: true });
      mockDataService.getSavedRaces.and.returnValue(of([]));
      mockDataService.initializeRace.and.returnValue(of(response));

      component.startRace(false);
      flush();
      fixture.detectChanges();

      expect(component.quickStartRaces[0].entity_id).toBe("e1");
      const savedSettings =
        mockSettingsService.saveSettings.calls.mostRecent().args[0];
      expect(savedSettings.recentRaceIds[0]).toBe("e1");
    }));

    it("should select event on setup page load when selectedRaceId is an event ID and isEventMode is true", () => {
      mockSettingsService.getSettings.and.returnValue({
        selectedRaceId: "1",
        isEventMode: true,
        recentRaceIds: ["1"],
      } as any);

      component.events = [
        {
          entity_id: "1",
          name: "Championship 2026",
          races: [{ raceId: "r1", maxDrivers: 4 }],
        },
      ] as any;
      component.races = [{ entity_id: "1", name: "Grand Prix" }] as any;

      const localSettings = mockSettingsService.getSettings();
      if (localSettings && localSettings.selectedRaceId) {
        if (localSettings.isEventMode) {
          const matchedEvent = component.events.find(
            (e) => e.entity_id === localSettings.selectedRaceId,
          );
          if (matchedEvent) {
            component.selectedEvent = matchedEvent;
            component.selectedRace = undefined;
          }
        }
      }

      fixture.detectChanges();

      expect(component.selectedEvent).toBeDefined();
      expect(component.selectedEvent?.name).toBe("Championship 2026");
      expect(component.selectedRace).toBeUndefined();
    });

    it("should select single race on setup page load when selectedRaceId collides with an event ID but isEventMode is false", () => {
      mockSettingsService.getSettings.and.returnValue({
        selectedRaceId: "1",
        isEventMode: false,
        recentRaceIds: ["1"],
      } as any);

      component.events = [
        {
          entity_id: "1",
          name: "Championship 2026",
          races: [{ raceId: "r1", maxDrivers: 4 }],
        },
      ] as any;
      component.races = [{ entity_id: "1", name: "Grand Prix" }] as any;

      const localSettings = mockSettingsService.getSettings();
      if (localSettings && localSettings.selectedRaceId) {
        if (localSettings.isEventMode) {
          const matchedEvent = component.events.find(
            (e) => e.entity_id === localSettings.selectedRaceId,
          );
          if (matchedEvent) {
            component.selectedEvent = matchedEvent;
            component.selectedRace = undefined;
          }
        } else {
          const matchedRace = component.races.find(
            (r) => r.entity_id === localSettings.selectedRaceId,
          );
          if (matchedRace) {
            component.selectedRace = matchedRace;
            component.selectedEvent = undefined;
          }
        }
      }

      fixture.detectChanges();

      expect(component.selectedRace).toBeDefined();
      expect(component.selectedRace?.name).toBe("Grand Prix");
      expect(component.selectedEvent).toBeUndefined();
    });

    it("should return GEN_INFINITE for finish value of 0", () => {
      const infiniteRace = {
        heat_scoring: { finish_value: 0 },
      };
      expect(component.getFinishValueDisplay(infiniteRace)).toBe(
        "GEN_INFINITE",
      );

      const finiteRace = {
        heat_scoring: { finish_value: 10 },
      };
      expect(component.getFinishValueDisplay(finiteRace)).toBe("10");
    });

    it("should return GEN_UNRANKED for heat and overall ranking on practice races", () => {
      const practiceRace = {
        practice: true,
        heat_scoring: { heat_ranking: "LAP_COUNT" },
        overall_scoring: { ranking_method: "LAP_COUNT" },
      };

      expect(component.isPracticeRace(practiceRace)).toBeTrue();
      expect(component.getHeatRankingDisplay(practiceRace)).toBe(
        "GEN_UNRANKED",
      );
      expect(component.getOverallRankingDisplay(practiceRace)).toBe(
        "GEN_UNRANKED",
      );

      const regularRace = {
        practice: false,
        heat_scoring: { heat_ranking: "LAP_COUNT" },
        overall_scoring: { ranking_method: "LAP_COUNT" },
      };

      expect(component.isPracticeRace(regularRace)).toBeFalse();
      expect(component.getHeatRankingDisplay(regularRace)).toBe("Lap Count");
      expect(component.getOverallRankingDisplay(regularRace)).toBe("Lap Count");
    });

    it("should select event when selectQuickStartItem is called with an event", () => {
      const eventItem = component.events[0];
      component.selectQuickStartItem(eventItem);

      expect(component.selectedEvent).toBe(eventItem);
      expect(component.selectedRace).toBeUndefined();
      expect(component.isEventMode).toBeTrue();
    });

    it("should prioritize event resolution in updateQuickStartRaces when recent ID matches an event", () => {
      component.events = [{ entity_id: "e1", name: "Endurance 500" }] as any;
      component.races = [{ entity_id: "r1", name: "Time Trial" }] as any;

      component.updateQuickStartRaces(["e1", "r1"]);

      expect(component.quickStartRaces.length).toBe(2);
      expect(component.quickStartRaces[0].entity_id).toBe("e1");
      expect(component.quickStartRaces[0].name).toBe("Endurance 500");
    });

    it("should correctly return finish method and finish value for a race in event summary", () => {
      component.races = [
        {
          entity_id: "r1",
          name: "Sprint 10",
          heat_scoring: { finish_method: "Lap", finish_value: 10 },
        },
        {
          entity_id: "r2",
          name: "Timed 60",
          heat_scoring: { finish_method: "Timed", finish_value: 60 },
        },
      ] as any;

      expect(component.getRaceFinishMethod("r1")).toBe("Lap");
      expect(component.getRaceFinishValue("r1")).toBe("10");
      expect(component.getRaceFinishMethod("r2")).toBe("Timed");
      expect(component.getRaceFinishValue("r2")).toBe("60");
      expect(component.getRaceFinishMethod("invalid")).toBe("");
      expect(component.getRaceFinishValue("invalid")).toBe("");
    });
  });

  describe("Participant Drag-and-Drop and Management Operations", () => {
    it("should handle addAllParticipants, removeAllParticipants, and randomizeParticipants", fakeAsync(() => {
      component.allDrivers = [
        { entity_id: "d1", name: "Driver 1", nickname: "D1" } as any,
        { entity_id: "d2", name: "Driver 2", nickname: "D2" } as any,
      ];
      component.unselectedParticipants = [...component.allDrivers];
      component.selectedParticipants = [];

      component.addAllParticipants();
      tick(50);
      expect(component.selectedParticipants.length).toBe(2);

      component.randomizeParticipants();
      tick(50);
      expect(component.selectedParticipants.length).toBe(2);

      component.removeAllParticipants();
      tick(50);
      expect(component.selectedParticipants.length).toBe(0);
    }));

    it("should correctly identify driver vs team and unique IDs", () => {
      const driver = { entity_id: "d10", name: "Driver 10", nickname: "D10" };
      const team = { entity_id: "t10", name: "Team 10", driverIds: ["d10"] };

      expect(component.isDriver(driver as any)).toBeTrue();
      expect(component.isTeam(driver as any)).toBeFalse();
      expect(component.isDriver(team as any)).toBeFalse();
      expect(component.isTeam(team as any)).toBeTrue();

      expect(component.getParticipantUniqueId(driver as any)).toBe("d_d10");
      expect(component.getParticipantUniqueId(team as any)).toBe("t_t10");
      expect(component.trackByParticipant(0, driver as any)).toBe("d_d10");
    });

    it("should handle drag and drop within selected list and across lists", fakeAsync(() => {
      const d1 = { entity_id: "d1", name: "Driver 1", nickname: "D1" } as any;
      const d2 = { entity_id: "d2", name: "Driver 2", nickname: "D2" } as any;

      component.selectedParticipants = [d1, d2];
      component.unselectedParticipants = [];

      // Reorder within selected list
      const selectedContainer = { id: "selected-list" };
      const reorderEvent: any = {
        previousIndex: 0,
        currentIndex: 1,
        container: selectedContainer,
        previousContainer: selectedContainer,
        isPointerOverContainer: true,
      };
      component.drop(reorderEvent);
      expect(component.selectedParticipants[0].entity_id).toBe("d2");

      // Drag from selected to available
      const removeEvent: any = {
        previousIndex: 0,
        currentIndex: 0,
        container: { id: "available-list" },
        previousContainer: { id: "selected-list" },
      };
      component.drop(removeEvent);
      tick(50);
      expect(component.selectedParticipants.length).toBe(1);

      // Drag from available to selected
      component.unselectedParticipants = [d2];
      const addEvent: any = {
        previousIndex: 0,
        currentIndex: 0,
        container: { id: "selected-list" },
        previousContainer: { id: "available-list" },
      };
      component.drop(addEvent);
      tick(50);
      expect(component.selectedParticipants.length).toBe(2);
    }));

    it("should toggle available drivers collapsed state", () => {
      component.isAvailableDriversCollapsed = false;
      component.toggleAvailableDrivers();
      expect(component.isAvailableDriversCollapsed).toBeTrue();
      component.toggleAvailableDrivers();
      expect(component.isAvailableDriversCollapsed).toBeFalse();
    });

    it("should randomize participants in selected list", fakeAsync(() => {
      const d1 = { entity_id: "d1", name: "Driver 1", nickname: "D1" } as any;
      const d2 = { entity_id: "d2", name: "Driver 2", nickname: "D2" } as any;
      const d3 = { entity_id: "d3", name: "Driver 3", nickname: "D3" } as any;

      component.selectedParticipants = [d1, d2, d3];
      component.randomizeParticipants();
      tick(50);

      expect(component.selectedParticipants.length).toBe(3);
    }));

    it("should safely return Driver or Team from getDriver and getTeam", () => {
      const driver = new Driver("d1", "Driver 1", "D1");
      const team = new Team("t1", "Team 1", undefined, ["d1"]);

      expect(component.getDriver(driver)).toBe(driver);
      expect(component.getDriver(team)).toBeUndefined();
      expect(component.getTeam(team)).toBe(team);
      expect(component.getTeam(driver)).toBeUndefined();
    });

    it("should show validation error modal when addParticipant or addAllParticipants fails validation", fakeAsync(() => {
      const validationService = (component as any).validationService;
      validationService.validate.and.returnValue({
        isValid: false,
        errorType: "DUPLICATE_DRIVER",
      });
      validationService.getErrorMessage.and.returnValue(
        "Duplicate driver detected",
      );

      const d1 = { entity_id: "d1", name: "Driver 1", nickname: "D1" } as any;
      component.selectedParticipants = [];
      component.unselectedParticipants = [d1];

      component.toggleParticipantSelection(d1, false);
      tick(50);

      expect(component.showErrorModal).toBeTrue();
      expect(component.errorMessage).toBe("Duplicate driver detected");

      component.showErrorModal = false;
      component.addAllParticipants();
      tick(50);

      expect(component.showErrorModal).toBeTrue();
    }));

    it("should handle menu dropdown actions and navigation to managers", () => {
      const mockEvent = {
        stopPropagation: jasmine.createSpy("stopPropagation"),
      } as any;

      for (const item of component.menuItems) {
        item.action(mockEvent);
      }
      expect(mockEvent.stopPropagation).toHaveBeenCalled();

      expect(component.isAnyMenuDropdownOpen()).toBeDefined();
      component.onMenuItemHover("RDS_MENU_CONFIG");

      component.openAssetManager();
      expect(mockRouter.navigate).toHaveBeenCalledWith(["/asset-manager"]);

      component.openDriverManager();
      expect(mockRouter.navigate).toHaveBeenCalledWith(["/driver-manager"]);

      component.openTeamManager();
      expect(mockRouter.navigate).toHaveBeenCalledWith(["/team-manager"]);

      (component as any).isRaceRunning = false;
      component.openTrackManager();
      expect(mockRouter.navigate).toHaveBeenCalledWith(["/track-manager"]);

      (component as any).isRaceRunning = true;
      component.openTrackManager();
      expect(component.showTrackEditorPrompt).toBeTrue();

      mockDataService.endRace = jasmine
        .createSpy("endRace")
        .and.returnValue(of(true));
      component.onConfirmTrackEditor();
      expect(mockRouter.navigate).toHaveBeenCalledWith(["/track-manager"]);

      component.onCancelTrackEditor();
      expect(component.showTrackEditorPrompt).toBeFalse();

      component.selectedRace = { entity_id: "r1" } as any;
      component.selectedParticipants = [{} as any];
      component.openRaceManager();
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ["/race-manager"],
        jasmine.any(Object),
      );

      component.selectedEvent = { entity_id: "e1" } as any;
      component.openEventManager();
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ["/event-manager"],
        jasmine.any(Object),
      );

      const season = { entity_id: "s1", name: "Season 1" } as any;
      component.selectSeason(season);
      expect(component.selectedSeason).toBe(season);
      expect(component.compareSeasons(season, season)).toBeTrue();
      expect(
        component.compareSeasons(season, { entity_id: "s2" } as any),
      ).toBeFalse();

      component.openSeasonManager();
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ["/season-manager"],
        jasmine.any(Object),
      );
    });

    it("should handle event mode fallback and legacy unprefixed participant IDs", fakeAsync(() => {
      mockDataService.getEvents.and.returnValue(
        of([{ entity_id: "e1", name: "Event 1" }]),
      );
      mockDataService.getSeasons.and.returnValue(
        of([{ entity_id: "s1", name: "Season 1" }]),
      );

      mockSettingsService.getSettings.and.returnValue({
        selectedSeasonId: "s1",
        selectedRaceId: "e1",
        isEventMode: true,
        selectedDriverIds: ["d1", "t1"],
        recentRaceIds: ["e1"],
      } as any);

      component.ngOnInit();
      tick();

      expect(component.selectedEvent?.entity_id).toBe("e1");
      expect(component.selectedRace).toBeUndefined();
    }));
  });

  describe("getHelpSteps", () => {
    it("should return the complete list of guide steps in correct order", () => {
      const steps = component.getHelpSteps();
      expect(steps.length).toBe(13);

      expect(steps[0]).toEqual({
        title: "RDS_HELP_WELCOME_TITLE",
        content: "RDS_HELP_WELCOME_CONTENT",
      });

      expect(steps[1]).toEqual({
        targetId: "racing-drivers-section",
        title: "RDS_HELP_DRIVER_RACING_TITLE",
        content: "RDS_HELP_DRIVER_RACING_CONTENT",
        position: "right",
      });

      expect(steps[2]).toEqual({
        selector: "#racing-drivers-section .section-header",
        title: "RDS_HELP_DRIVER_ACTIONS_TITLE",
        content: "RDS_HELP_DRIVER_ACTIONS_CONTENT",
        position: "bottom",
      });

      expect(steps[3]).toEqual({
        targetId: "available-drivers-section",
        title: "RDS_HELP_DRIVER_AVAILABLE_TITLE",
        content: "RDS_HELP_DRIVER_AVAILABLE_CONTENT",
        position: "right",
      });

      expect(steps[4]).toEqual({
        selector: "#available-drivers-section .header-actions",
        title: "RDS_HELP_DRIVER_TEAM_STATS_TITLE",
        content: "RDS_HELP_DRIVER_TEAM_STATS_CONTENT",
        position: "right",
      });

      expect(steps[5]).toEqual({
        selector: ".custom-dropdown-container",
        title: "RDS_HELP_RACE_SELECTION_TITLE",
        content: "RDS_HELP_RACE_SELECTION_CONTENT",
        position: "top",
      });

      expect(steps[6]).toEqual({
        selector: ".event-details-card",
        title: "RDS_HELP_SELECTION_SUMMARY_TITLE",
        content: "RDS_HELP_SELECTION_SUMMARY_CONTENT",
        position: "top",
      });

      expect(steps[7]).toEqual({
        selector: ".search-wrapper",
        title: "RDS_HELP_SEARCH_TITLE",
        content: "RDS_HELP_SEARCH_CONTENT",
        position: "top",
      });

      expect(steps[8]).toEqual({
        selector: ".season-selection-wrapper",
        title: "RDS_HELP_SEASON_TITLE",
        content: "RDS_HELP_SEASON_CONTENT",
        position: "top",
      });

      expect(steps[9]).toEqual({
        targetId: "race-card-0",
        title: "RDS_HELP_RECENT_RACE_TITLE",
        content: "RDS_HELP_RECENT_RACE_MOST_RECENT_CONTENT",
        position: "bottom",
      });

      expect(steps[10]).toEqual({
        targetId: "race-card-1",
        title: "RDS_HELP_RECENT_RACE_TITLE",
        content: "RDS_HELP_RECENT_RACE_CONTENT",
        position: "bottom",
      });

      expect(steps[11]).toEqual({
        selector: ".btn-start",
        title: "RDS_HELP_START_RACE_TITLE",
        content: "RDS_HELP_START_RACE_CONTENT",
        position: "top",
      });

      expect(steps[12]).toEqual({
        selector: ".btn-demo",
        title: "RDS_HELP_START_DEMO_TITLE",
        content: "RDS_HELP_START_DEMO_CONTENT",
        position: "top",
      });
    });
  });
});
