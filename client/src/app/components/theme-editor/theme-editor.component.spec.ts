import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { BehaviorSubject, of } from "rxjs";
import { DataService } from "@app/data.service";
import { CustomUI } from "@app/models/custom-ui";
import { Settings } from "@app/models/settings";
import { Theme } from "@app/models/theme";
import { LoggerService } from "@app/services/logger.service";
import { NavigationService } from "@app/services/navigation.service";
import { SettingsService } from "@app/services/settings.service";
import { ThemeService } from "@app/services/theme.service";
import { TranslationService } from "@app/services/translation.service";

import { ThemeEditorComponent } from "./theme-editor.component";

describe("ThemeEditorComponent", () => {
  let component: ThemeEditorComponent;
  let fixture: ComponentFixture<ThemeEditorComponent>;
  let mockDataService: any;
  let mockSettingsService: any;
  let mockThemeService: any;
  let mockTranslationService: any;
  let mockLogger: any;
  let mockRouter: any;
  let mockActivatedRoute: any;
  let mockNavigationService: any;

  let testThemes: Theme[];
  let testCustomUIs: CustomUI[];
  let testAssets: any[];
  let queryParamsSubject: BehaviorSubject<any>;

  beforeEach(async () => {
    testThemes = [
      {
        entity_id: "default_classic_rc_ai",
        name: "Classic",
        is_default: true,
        uiId: "ui1",
        slots: { "flag.racing": "a1", "gauge.fuel": "fuel_asset" },
        audio_slots: {
          yellowflag: { type: "preset" },
          countdown: { type: "tts", text: "Countdown" },
        },
        driver_audio_overrides: {},
      },
      {
        entity_id: "custom_theme_1",
        name: "Custom Theme",
        is_default: false,
        uiId: "ui1",
        slots: { "flag.racing": "a2" },
        audio_slots: {},
        driver_audio_overrides: {},
      },
    ];

    testCustomUIs = [
      {
        entity_id: "ui1",
        name: "Default UI",
        is_default: true,
      },
    ];

    testAssets = [
      {
        id: "a1",
        entity_id: "a1",
        type: "image",
        name: "Flag 1",
        url: "/assets/flag1.png",
      },
      {
        id: "a2",
        entity_id: "a2",
        type: "image",
        name: "Flag 2",
        url: "/assets/flag2.png",
      },
      {
        id: "fuel_asset",
        entity_id: "fuel_asset",
        type: "image_set",
        name: "Fuel Gauge",
        images: ["/assets/fuel1.png"],
      },
      {
        id: "sound1",
        entity_id: "sound1",
        type: "sound",
        name: "Beep",
        url: "/assets/beep.wav",
      },
    ];

    queryParamsSubject = new BehaviorSubject<any>({
      id: "default_classic_rc_ai",
    });

    mockDataService = {
      getThemes: jasmine.createSpy("getThemes").and.returnValue(of(testThemes)),
      getCustomUIs: jasmine
        .createSpy("getCustomUIs")
        .and.returnValue(of(testCustomUIs)),
      listAssets: jasmine
        .createSpy("listAssets")
        .and.returnValue(of(testAssets)),
      createTheme: jasmine.createSpy("createTheme").and.callFake((t) =>
        of({
          ...t,
          entity_id: "created_theme_" + Math.random().toString(36).substring(7),
        }),
      ),
      updateTheme: jasmine
        .createSpy("updateTheme")
        .and.callFake((_id, t) => of(t)),
      deleteTheme: jasmine.createSpy("deleteTheme").and.returnValue(of(true)),
      getAssetUrl: jasmine
        .createSpy("getAssetUrl")
        .and.returnValue("/assets/fuel1.png"),
    };

    mockSettingsService = {
      getSettings: jasmine
        .createSpy("getSettings")
        .and.returnValue(new Settings()),
      saveSettings: jasmine.createSpy("saveSettings"),
    };

    mockThemeService = {
      initialize: jasmine
        .createSpy("initialize")
        .and.returnValue(Promise.resolve()),
      setActiveTheme: jasmine.createSpy("setActiveTheme"),
      resolveAssetId: jasmine.createSpy("resolveAssetId").and.returnValue(null),
    };

    mockTranslationService = {
      translate: jasmine.createSpy("translate").and.callFake((key: string) => {
        if (key === "THM_TITLE") return "Themes";
        if (key === "THM_ERROR_NAME_INVALID") return "Theme name is invalid";
        if (key === "UE_DEFAULT_THEME_NAME") return "New Theme";
        if (key === "UE_LABEL_DEFAULT_THEME") return "Classic";
        return key;
      }),
    };

    mockLogger = {
      info: jasmine.createSpy("info"),
      warn: jasmine.createSpy("warn"),
      error: jasmine.createSpy("error"),
      debug: jasmine.createSpy("debug"),
    };

    mockRouter = {
      navigate: jasmine.createSpy("navigate"),
      navigateByUrl: jasmine.createSpy("navigateByUrl"),
      url: "/theme-editor",
    };

    mockActivatedRoute = {
      queryParams: queryParamsSubject.asObservable(),
      snapshot: {
        queryParamMap: {
          get: jasmine.createSpy("get").and.returnValue(null),
        },
      },
    };

    mockNavigationService = {
      canGoBack: jasmine.createSpy("canGoBack").and.returnValue(false),
      goBack: jasmine.createSpy("goBack"),
      setLastEditedId: jasmine.createSpy("setLastEditedId"),
      getLastEditedId: jasmine
        .createSpy("getLastEditedId")
        .and.returnValue(null),
    };

    await TestBed.configureTestingModule({
      imports: [FormsModule, ThemeEditorComponent],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: SettingsService, useValue: mockSettingsService },
        { provide: ThemeService, useValue: mockThemeService },
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: LoggerService, useValue: mockLogger },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: NavigationService, useValue: mockNavigationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ThemeEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  describe("Initialization & Data Loading", () => {
    it("should load themes, UIs, and assets on init", () => {
      expect(mockDataService.getThemes).toHaveBeenCalled();
      expect(mockDataService.getCustomUIs).toHaveBeenCalled();
      expect(mockDataService.listAssets).toHaveBeenCalled();
      expect(component.allThemes.length).toBe(2);
      expect(component.displayCustomUIs.length).toBe(1);
      expect(component.assets.length).toBe(4);
      expect(component.soundAssets.length).toBe(1);
      expect(component.selectedThemeId).toBe("default_classic_rc_ai");
      expect(component.editingTheme?.name).toBe("Classic");
      expect(component.isLoading).toBeFalse();
    });

    it("should respect edit query parameter", () => {
      queryParamsSubject.next({
        id: "custom_theme_1",
        edit: "true",
      });
      expect(component.selectedThemeId).toBe("custom_theme_1");
      expect(component.isEditMode).toBeTrue();
    });

    it("should provide select items for dropdown", () => {
      const items = component.themeSelectItems;
      expect(items.length).toBe(2);
      expect(items[0].id).toBe("default_classic_rc_ai");
    });
  });

  describe("Theme Selection & Navigation", () => {
    it("selectThemeById should update selectedThemeId, clone themes, and push URL", () => {
      component.selectThemeById("custom_theme_1", true);
      expect(component.selectedThemeId).toBe("custom_theme_1");
      expect(component.editingTheme?.entity_id).toBe("custom_theme_1");
      expect(mockNavigationService.setLastEditedId).toHaveBeenCalledWith(
        "theme",
        "custom_theme_1",
      );
      expect(mockRouter.navigate).toHaveBeenCalledWith([], {
        relativeTo: mockActivatedRoute,
        queryParams: { id: "custom_theme_1" },
        queryParamsHandling: "merge",
        replaceUrl: true,
      });
    });

    it("onSelectThemeById should prompt discard when dirty", fakeAsync(() => {
      component.isEditMode = true;
      if (component.editingTheme) {
        component.editingTheme.name = "Modified Classic";
      }
      expect(component.isDirtyState()).toBeTrue();

      spyOn(component.lifecycle, "confirmDiscard").and.returnValue(
        Promise.resolve(false),
      );

      component.onSelectThemeById("custom_theme_1");
      tick();

      expect(component.lifecycle.confirmDiscard).toHaveBeenCalled();
      expect(component.selectedThemeId).toBe("default_classic_rc_ai");
    }));

    it("onSelectThemeById should switch theme when clean", () => {
      component.onSelectThemeById("custom_theme_1");
      expect(component.selectedThemeId).toBe("custom_theme_1");
      expect(component.isEditMode).toBeFalse();
    });

    it("onBack should navigate to returnUrl if present", () => {
      (
        mockActivatedRoute.snapshot.queryParamMap.get as jasmine.Spy
      ).and.returnValue("/ui-editor");
      component.onBack();
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith("/ui-editor");
    });

    it("onBack should fallback to navigationService.goBack or raceday-setup", () => {
      (
        mockActivatedRoute.snapshot.queryParamMap.get as jasmine.Spy
      ).and.returnValue(null);
      mockNavigationService.canGoBack.and.returnValue(true);
      component.onBack();
      expect(mockNavigationService.goBack).toHaveBeenCalled();

      mockNavigationService.canGoBack.and.returnValue(false);
      component.onBack();
      expect(mockRouter.navigate).toHaveBeenCalledWith(["/raceday-setup"]);
    });
  });

  describe("Edit Mode & Auto-Save", () => {
    it("onToggleEditMode should enter edit mode when off", () => {
      component.isEditMode = false;
      component.onToggleEditMode();
      expect(component.isEditMode).toBeTrue();
    });

    it("onToggleEditMode should exit edit mode if clean", () => {
      component.isEditMode = true;
      component.onToggleEditMode();
      expect(component.isEditMode).toBeFalse();
    });

    it("onToggleEditMode should alert if dirty but name is invalid", () => {
      spyOn(window, "alert");
      component.isEditMode = true;
      if (component.editingTheme) {
        component.editingTheme.name = "   ";
      }
      component.onToggleEditMode();
      expect(window.alert).toHaveBeenCalledWith("Theme name is invalid");
      expect(component.isEditMode).toBeTrue();
    });

    it("saveCurrentTheme should update theme and exit edit mode", async () => {
      component.isEditMode = true;
      if (component.editingTheme) {
        component.editingTheme.name = "Renamed Classic";
      }
      await component.saveCurrentTheme();

      expect(mockDataService.updateTheme).toHaveBeenCalledWith(
        "default_classic_rc_ai",
        jasmine.objectContaining({ name: "Renamed Classic" }),
      );
      expect(component.isEditMode).toBeFalse();
      expect(component.originalTheme?.name).toBe("Renamed Classic");
    });

    it("hasChanges and isDirtyState should correctly report changes", () => {
      expect(component.hasChanges()).toBeFalse();
      component.isEditMode = true;
      if (component.editingTheme) {
        component.editingTheme.name = "Dirty Theme";
      }
      expect(component.hasChanges()).toBeTrue();
      expect(component.isDirtyState()).toBeTrue();
    });

    it("isConfigValid should validate name non-empty and unique", () => {
      if (component.editingTheme) {
        component.editingTheme.name = "Valid Unique";
      }
      expect(component.isConfigValid()).toBeTrue();

      if (component.editingTheme) {
        component.editingTheme.name = "   ";
      }
      expect(component.isConfigValid()).toBeFalse();

      if (component.editingTheme) {
        component.editingTheme.name = "Custom Theme"; // Duplicate of second theme
      }
      expect(component.isConfigValid()).toBeFalse();
    });
  });

  describe("CRUD Actions", () => {
    it("onAddNewTheme should create a new theme and switch to edit mode", async () => {
      await component.onAddNewTheme();
      expect(mockDataService.createTheme).toHaveBeenCalled();
      expect(component.allThemes.length).toBe(3);
      expect(component.isEditMode).toBeTrue();
    });

    it("onCopyTheme should duplicate selected theme and switch to edit mode", async () => {
      await component.onCopyTheme();
      expect(mockDataService.createTheme).toHaveBeenCalledWith(
        jasmine.objectContaining({
          name: "Classic (Copy)",
          is_default: false,
        }),
      );
      expect(component.allThemes.length).toBe(3);
      expect(component.isEditMode).toBeTrue();
    });

    it("onDeleteTheme should block deleting default themes", () => {
      component.selectThemeById("default_classic_rc_ai");
      component.onDeleteTheme();
      expect(component.showDeleteConfirm).toBeFalse();
    });

    it("onDeleteTheme should open delete confirmation for non-default theme", () => {
      component.selectThemeById("custom_theme_1");
      component.onDeleteTheme();
      expect(component.showDeleteConfirm).toBeTrue();

      component.onCancelDeleteTheme();
      expect(component.showDeleteConfirm).toBeFalse();
    });

    it("onConfirmDeleteTheme should delete theme and select next remaining theme", async () => {
      component.selectThemeById("custom_theme_1");
      await component.onConfirmDeleteTheme();

      expect(mockDataService.deleteTheme).toHaveBeenCalledWith(
        "custom_theme_1",
      );
      expect(component.allThemes.length).toBe(1);
      expect(component.selectedThemeId).toBe("default_classic_rc_ai");
    });
  });

  describe("Slot & Audio Modifications", () => {
    it("onThemeSlotChanged should update slot and capture state", () => {
      component.isEditMode = true;
      component.onThemeSlotChanged("flag.racing", { entity_id: "a2" });
      expect(component.editingTheme?.slots["flag.racing"]).toBe("a2");
      expect(component.isDirtyState()).toBeTrue();
    });

    it("onThemeAudioChanged and onAudioAssetSelected should update audio configuration", () => {
      component.isEditMode = true;
      component.onThemeAudioChanged("yellowflag", "type", "tts");
      component.onAudioAssetSelected("yellowflag", { entity_id: "sound1" });

      expect(component.editingTheme?.audio_slots["yellowflag"]?.type).toBe(
        "tts",
      );
      expect(component.editingTheme?.audio_slots["yellowflag"]?.url).toBe(
        "sound1",
      );
      expect(component.isDirtyState()).toBeTrue();
    });

    it("onDriverAudioOverrideChange should set and remove driver overrides", () => {
      component.isEditMode = true;
      component.onDriverAudioOverrideChange({
        key: "driver_1",
        config: { type: "tts", text: "Driver One" },
      });
      expect(
        component.editingTheme?.driver_audio_overrides?.["driver_1"]?.text,
      ).toBe("Driver One");

      component.onDriverAudioOverrideChange({
        key: "driver_1",
        config: null,
      });
      expect(
        component.editingTheme?.driver_audio_overrides?.["driver_1"],
      ).toBeUndefined();
    });

    it("onResetDriverAudioOverrides should clear all driver audio overrides", () => {
      component.isEditMode = true;
      if (component.editingTheme) {
        component.editingTheme.driver_audio_overrides = {
          d1: { type: "preset" },
        };
      }
      component.onResetDriverAudioOverrides();
      expect(component.editingTheme?.driver_audio_overrides).toEqual({});
    });

    it("asset and audio resolvers should resolve URLs and configs", () => {
      expect(component.getFlagUrl("flag.racing")).toBeDefined();
      expect(component.getFuelGaugeUrl()).toBeDefined();
      expect(component.getAudioConfigForSlot("yellowflag")).toEqual({
        type: "preset",
      });
      expect(component.getAssetForSlot("flag.racing")).toBeDefined();
    });
  });

  describe("Expanders & Guided Tour", () => {
    it("toggleSection should toggle sections", () => {
      expect(component.sectionsExpanded.flags).toBeTrue();
      component.toggleSection("flags");
      expect(component.sectionsExpanded.flags).toBeFalse();
    });

    it("toggleAllSections should toggle all sections together", () => {
      component.toggleAllSections();
      expect(component.areAllSectionsExpanded()).toBeTrue();
      component.toggleAllSections();
      expect(component.areAllSectionsExpanded()).toBeFalse();
    });

    it("getHelpSteps should return 11 guide steps and expand target sections", () => {
      const steps = component.getHelpSteps();
      expect(steps.length).toBe(11);

      component.sectionsExpanded.countdown = false;
      const countdownStep = steps.find(
        (s) => s.selector === "#theme-countdown-section",
      );
      countdownStep?.onEnter?.();
      expect(component.sectionsExpanded.countdown).toBeTrue();
    });

    it("canDeactivate should prompt discard when dirty", () => {
      expect(component.canDeactivate()).toBeTrue();
      component.isEditMode = true;
      if (component.editingTheme) {
        component.editingTheme.name = "Dirty Theme";
      }
      spyOn(component.lifecycle, "confirmDiscard").and.returnValue(
        Promise.resolve(false),
      );
      component.canDeactivate();
      expect(component.lifecycle.confirmDiscard).toHaveBeenCalled();
    });
  });
});
