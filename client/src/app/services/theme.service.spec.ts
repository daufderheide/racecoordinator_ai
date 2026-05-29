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
      slots: { "flag.green": "asset-1" },
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

  it("should use saved active theme on initialization", async () => {
    const settings = new Settings();
    settings.activeThemeId = "theme-1";
    settingsServiceSpy.getSettings.and.returnValue(settings);

    await service.initialize();
    expect(service.getActiveTheme()?.entity_id).toBe("theme-1");
  });

  it("should resolve asset ID correctly", async () => {
    await service.initialize();
    service.setActiveTheme("theme-1");
    expect(service.resolveAssetId("flag.green")).toBe("asset-1");
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
});
