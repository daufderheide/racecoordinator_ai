import { TestBed } from "@angular/core/testing";
import { of, Subject, throwError } from "rxjs";
import { DataService } from "@app/data.service";
import { Settings } from "@app/models/settings";
import { Theme } from "@app/models/theme";
import { LoggerService } from "@app/services/logger.service";
import { SettingsService } from "@app/services/settings.service";

import { ThemeService } from "./theme.service";

describe("ThemeService", () => {
  let service: ThemeService;
  let dataServiceSpy: jasmine.SpyObj<DataService>;
  let settingsServiceSpy: jasmine.SpyObj<SettingsService>;
  let loggerSpy: jasmine.SpyObj<LoggerService>;

  const mockThemes: Theme[] = [
    {
      entity_id: "default_theme",
      name: "Default",
      is_default: true,
      slots: {},
      audio_slots: {},
    },
    {
      entity_id: "theme-1",
      name: "Theme 1",
      is_default: false,
      slots: { "flag.racing": "asset-1" },
      audio_slots: {},
    },
    {
      entity_id: "theme-2",
      name: "Theme 2",
      is_default: false,
      slots: {},
      audio_slots: {},
    },
  ];

  beforeEach(() => {
    const dataSpy = jasmine.createSpyObj("DataService", [
      "getThemes",
      "createTheme",
      "updateTheme",
      "duplicateTheme",
      "deleteTheme",
    ]);
    dataSpy.socketConnected$ = of(true);
    const settingsSpy = jasmine.createSpyObj("SettingsService", [
      "getSettings",
      "saveSettings",
    ]);
    const lSpy = jasmine.createSpyObj("LoggerService", [
      "info",
      "warn",
      "error",
      "debug",
      ,
      "log",
    ]);

    TestBed.configureTestingModule({
      providers: [
        ThemeService,
        { provide: DataService, useValue: dataSpy },
        { provide: SettingsService, useValue: settingsSpy },
        { provide: LoggerService, useValue: lSpy },
      ],
    });

    service = TestBed.inject(ThemeService);
    dataServiceSpy = TestBed.inject(DataService) as jasmine.SpyObj<DataService>;
    settingsServiceSpy = TestBed.inject(
      SettingsService,
    ) as jasmine.SpyObj<SettingsService>;
    loggerSpy = TestBed.inject(LoggerService) as jasmine.SpyObj<LoggerService>;

    dataServiceSpy.getThemes.and.returnValue(of(mockThemes));
    settingsServiceSpy.getSettings.and.returnValue(new Settings());
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should initialize and set default theme if no active theme is saved", async () => {
    await service.initialize();
    expect(service.isInitialized()).toBeTrue();
    expect(service.getActiveTheme()?.entity_id).toBe("default_theme");
    expect(settingsServiceSpy.saveSettings).toHaveBeenCalled();
  });

  it("should emit on activeTheme$ when active theme changes", async () => {
    let emittedTheme: any = null;
    service.activeTheme$.subscribe((theme) => {
      emittedTheme = theme;
    });

    await service.initialize();
    expect(emittedTheme?.entity_id).toBe("default_theme");

    service.setActiveTheme("theme-1");
    expect(emittedTheme?.entity_id).toBe("theme-1");

    await service.setTransientActiveTheme("theme-2");
    expect(emittedTheme?.entity_id).toBe("theme-2");

    service.setActiveTheme(null);
    expect(emittedTheme).toBeNull();
  });

  it("should resolve asset ID correctly", async () => {
    await service.initialize();
    service.setActiveTheme("theme-1");
    expect(service.resolveAssetId("flag.racing")).toBe("asset-1");
    expect(service.resolveAssetId("non-existent")).toBeNull();
  });

  it("should activate race override when available", async () => {
    const settings = new Settings();
    settings.activeThemeId = "default_theme";
    settings.raceThemeOverrides = { "race-1": "theme-1" };
    settingsServiceSpy.getSettings.and.returnValue(settings);

    await service.initialize();
    service.activateForRace("race-1");
    expect(service.getActiveTheme()?.entity_id).toBe("theme-1");
  });

  it("should respect transient active theme over race theme in activateForRace", async () => {
    const settings = new Settings();
    settings.activeThemeId = "default_theme";
    settings.raceThemeOverrides = { "race-1": "theme-1" };
    settingsServiceSpy.getSettings.and.returnValue(settings);

    await service.initialize();
    await service.setTransientActiveTheme("theme-2");
    expect(service.getTransientThemeId()).toBe("theme-2");
    expect(service.getActiveTheme()?.entity_id).toBe("theme-2");

    await service.activateForRace("race-1");
    expect(service.getActiveTheme()?.entity_id).toBe("theme-2");

    service.clearTransientActiveTheme();
    expect(service.getTransientThemeId()).toBeNull();
  });

  it("should preserve transient active theme across refresh", async () => {
    await service.initialize();
    await service.setTransientActiveTheme("theme-2");

    await service.refresh();
    expect(service.getActiveTheme()?.entity_id).toBe("theme-2");
  });

  it("should auto-fetch themes when setTransientActiveTheme is called for uncached theme", async () => {
    const newTheme = {
      name: "Late Created Theme",
      is_default: false,
      slots: {},
      audio_slots: {},
      uiId: "custom_ui_1",
      entity_id: "theme-late",
    };
    dataServiceSpy.getThemes.and.returnValue(of([...mockThemes, newTheme]));

    await service.setTransientActiveTheme("theme-late");
    expect(service.getActiveTheme()?.entity_id).toBe("theme-late");
    expect(service.getActiveTheme()?.uiId).toBe("custom_ui_1");
  });

  it("should fall back to global theme if race override points to deleted theme", async () => {
    const settings = new Settings();
    settings.activeThemeId = "default_theme";
    settings.raceThemeOverrides = { "race-1": "non_existent" };
    settingsServiceSpy.getSettings.and.returnValue(settings);

    await service.initialize();
    service.activateForRace("race-1");
    expect(service.getActiveTheme()?.entity_id).toBe("default_theme");
    expect(settings.raceThemeOverrides?.["race-1"]).toBeUndefined();
  });

  it("should handle initialization failure", async () => {
    dataServiceSpy.getThemes.and.returnValue(
      throwError(() => new Error("Failed")),
    );
    await service.initialize();
    expect(service.isInitialized()).toBeTrue(); // Still marked as initialized but with empty themes
    expect(service.getThemes().length).toBe(0);
    expect(loggerSpy.error).toHaveBeenCalled();
  });

  it("should handle refresh failure", async () => {
    dataServiceSpy.getThemes.and.returnValue(
      throwError(() => new Error("Refresh Failed")),
    );
    await service.refresh();
    expect(loggerSpy.error).toHaveBeenCalled();
  });

  it("should duplicate theme and refresh", async () => {
    const newTheme = { ...mockThemes[0], entity_id: "new-theme" };
    dataServiceSpy.duplicateTheme.and.returnValue(of(newTheme));

    const result = await service.duplicateTheme("default_theme", "New Name");

    expect(dataServiceSpy.duplicateTheme).toHaveBeenCalledWith(
      "default_theme",
      "New Name",
    );
    expect(dataServiceSpy.getThemes).toHaveBeenCalled();
    expect(result.entity_id).toBe("new-theme");
  });

  it("should delete theme and refresh", async () => {
    dataServiceSpy.deleteTheme.and.returnValue(of(undefined));

    await service.deleteTheme("theme-1");

    expect(dataServiceSpy.deleteTheme).toHaveBeenCalledWith("theme-1");
    expect(dataServiceSpy.getThemes).toHaveBeenCalled();
  });

  it("should auto-initialize themes when socketConnected$ emits true", () => {
    const socketSubject = new Subject<boolean>();
    const customDataSpy = jasmine.createSpyObj("DataService", ["getThemes"]);
    customDataSpy.socketConnected$ = socketSubject.asObservable();
    customDataSpy.getThemes.and.returnValue(of(mockThemes));

    const customSettingsSpy = jasmine.createSpyObj("SettingsService", [
      "getSettings",
      "saveSettings",
    ]);
    customSettingsSpy.getSettings.and.returnValue(new Settings());

    const customLoggerSpy = jasmine.createSpyObj("LoggerService", [
      "info",
      "error",
      ,
      "debug",
      "log",
    ]);

    spyOn(ThemeService.prototype, "initialize").and.callThrough();

    new ThemeService(
      customDataSpy as any,
      customSettingsSpy as any,
      customLoggerSpy as any,
    );

    expect(ThemeService.prototype.initialize).not.toHaveBeenCalled();

    socketSubject.next(true);

    expect(ThemeService.prototype.initialize).toHaveBeenCalled();
  });

  describe("resolveAudioConfig", () => {
    it("should resolve configured audio_slots entry", async () => {
      mockThemes[0].audio_slots = {
        "audio.countdown": { type: "audio_set", url: "custom_countdown" },
      };
      await service.initialize();
      const config = service.resolveAudioConfig("audio.countdown");
      expect(config).toEqual({ type: "audio_set", url: "custom_countdown" });
    });

    it("should resolve legacy slots entry for audio.countdown with type audio_set", async () => {
      mockThemes[0].audio_slots = {};
      mockThemes[0].slots = { "audio.countdown": "legacy_countdown" };
      await service.initialize();
      const config = service.resolveAudioConfig("audio.countdown");
      expect(config).toEqual({ type: "audio_set", url: "legacy_countdown" });
    });

    it("should provide default fallback for audio.countdown and audio.seconds_left when missing", async () => {
      mockThemes[0].audio_slots = {};
      mockThemes[0].slots = {};
      await service.initialize();
      expect(service.resolveAudioConfig("audio.countdown")).toEqual({
        type: "audio_set",
        url: "default_countdown",
      });
      expect(service.resolveAudioConfig("audio.seconds_left")).toEqual({
        type: "audio_set",
        url: "default_seconds_left",
      });
    });
  });

  describe("Theme Settings and Overrides", () => {
    it("should set and get per-race theme overrides", async () => {
      await service.initialize();
      service.setRaceThemeOverride("race-100", "theme-1");
      expect(service.getRaceThemeOverride("race-100")).toBe("theme-1");
      expect(service.getActiveTheme()?.entity_id).toBe("theme-1");

      service.setRaceThemeOverride("race-100", null);
      expect(service.getRaceThemeOverride("race-100")).toBeNull();
    });

    it("should clear active theme when setActiveTheme(null) is called", async () => {
      await service.initialize();
      expect(service.isThemeActive()).toBeTrue();

      service.setActiveTheme(null);
      expect(service.isThemeActive()).toBeFalse();
      expect(service.getActiveTheme()).toBeNull();
      expect(service.resolveAssetId("flag.racing")).toBeNull();
      expect(service.resolveAudioConfig("audio.countdown")).toBeNull();
    });

    it("should detach active theme slots into settings", async () => {
      await service.initialize();
      service.setActiveTheme("theme-1");

      const assets = [
        {
          model: { entityId: "asset-1" },
          url: "http://example.com/racing.png",
        },
      ];

      service.detachToSettings(assets);
      expect(service.isThemeActive()).toBeFalse();
      expect(settingsServiceSpy.saveSettings).toHaveBeenCalled();
    });
  });
});
