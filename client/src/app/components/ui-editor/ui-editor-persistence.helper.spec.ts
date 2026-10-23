import { of, throwError } from "rxjs";
import { DataService } from "@app/data.service";
import { CustomUI } from "@app/models/custom-ui";
import { Settings } from "@app/models/settings";
import { Theme } from "@app/models/theme";
import { CustomUiService } from "@app/services/custom-ui.service";
import { SettingsService } from "@app/services/settings.service";
import { ThemeService } from "@app/services/theme.service";

import {
  buildAutoSavePipeline,
  handleAutoSaveState,
} from "./ui-editor-persistence.helper";

describe("ui-editor-persistence.helper", () => {
  it("should return null if not saveable or no changes", () => {
    const ctx: any = {
      isLoading: false,
      isSaving: false,
      hasChanges: false,
      isAnyThemeNameInvalid: false,
      isAnyCustomUiNameInvalid: false,
    };
    expect(buildAutoSavePipeline(ctx)).toBeNull();
  });

  it("should build save pipeline saving changed settings, themes, and UIs", (done) => {
    const theme: Theme = {
      entity_id: "t1",
      name: "Theme 1 Modified",
      is_default: false,
      slots: {},
      audio_slots: {},
    };

    const ui: CustomUI = {
      entity_id: "ui1",
      name: "UI 1 Modified",
      is_default: false,
    };

    const dataServiceSpy = jasmine.createSpyObj<DataService>("DataService", [
      "updateTheme",
      "updateCustomUI",
    ]);
    dataServiceSpy.updateTheme.and.returnValue(of(theme));
    dataServiceSpy.updateCustomUI.and.returnValue(of(ui));

    const settingsServiceSpy = jasmine.createSpyObj<SettingsService>(
      "SettingsService",
      ["saveSettings"],
    );

    const ctx: any = {
      isLoading: false,
      isSaving: false,
      hasChanges: true,
      isAnyThemeNameInvalid: false,
      isAnyCustomUiNameInvalid: false,
      editingSettings: new Settings(),
      displayThemes: [theme],
      displayCustomUIs: [ui],
      initialState: {
        themes: [
          {
            entity_id: "t1",
            name: "Theme 1 Original",
            is_default: false,
            slots: {},
            audio_slots: {},
          },
        ],
        customUIs: [
          { entity_id: "ui1", name: "UI 1 Original", is_default: false },
        ],
      },
      dataService: dataServiceSpy,
      settingsService: settingsServiceSpy,
      themeService: jasmine.createSpyObj<ThemeService>("ThemeService", [
        "refresh",
      ]),
      customUiService: jasmine.createSpyObj<CustomUiService>(
        "CustomUiService",
        ["initialize"],
      ),
    };

    const pipeline = buildAutoSavePipeline(ctx);
    expect(pipeline).not.toBeNull();

    pipeline?.subscribe(() => {
      expect(settingsServiceSpy.saveSettings).toHaveBeenCalled();
      expect(dataServiceSpy.updateTheme).toHaveBeenCalledWith("t1", theme);
      expect(dataServiceSpy.updateCustomUI).toHaveBeenCalledWith("ui1", ui);
      done();
    });
  });

  it("should recreate custom UI and theme via create API when update returns 404", (done) => {
    const theme: Theme = {
      entity_id: "t_restored",
      name: "Restored Theme",
      is_default: false,
      slots: {},
      audio_slots: {},
    };
    const ui: CustomUI = {
      entity_id: "ui_restored",
      name: "Restored Layout",
      is_default: false,
    };

    const dataServiceSpy = jasmine.createSpyObj<DataService>("DataService", [
      "updateTheme",
      "createTheme",
      "updateCustomUI",
      "createCustomUI",
    ]);
    dataServiceSpy.updateTheme.and.returnValue(
      throwError(() => ({ status: 404, message: "Theme not found" })),
    );
    dataServiceSpy.createTheme.and.returnValue(of(theme));
    dataServiceSpy.updateCustomUI.and.returnValue(
      throwError(() => ({ status: 404, message: "Custom UI not found" })),
    );
    dataServiceSpy.createCustomUI.and.returnValue(of(ui));

    const settingsServiceSpy = jasmine.createSpyObj<SettingsService>(
      "SettingsService",
      ["saveSettings"],
    );

    const ctx: any = {
      isLoading: false,
      isSaving: false,
      hasChanges: true,
      isAnyThemeNameInvalid: false,
      isAnyCustomUiNameInvalid: false,
      editingSettings: new Settings(),
      displayThemes: [theme],
      displayCustomUIs: [ui],
      initialState: {
        themes: [],
        customUIs: [],
      },
      dataService: dataServiceSpy,
      settingsService: settingsServiceSpy,
      themeService: jasmine.createSpyObj<ThemeService>("ThemeService", [
        "refresh",
      ]),
      customUiService: jasmine.createSpyObj<CustomUiService>(
        "CustomUiService",
        ["initialize"],
      ),
    };

    const pipeline = buildAutoSavePipeline(ctx);
    expect(pipeline).not.toBeNull();

    pipeline?.subscribe(() => {
      expect(dataServiceSpy.updateTheme).toHaveBeenCalledWith(
        "t_restored",
        theme,
      );
      expect(dataServiceSpy.createTheme).toHaveBeenCalledWith(theme);
      expect(dataServiceSpy.updateCustomUI).toHaveBeenCalledWith(
        "ui_restored",
        ui,
      );
      expect(dataServiceSpy.createCustomUI).toHaveBeenCalledWith(ui);
      done();
    });
  });

  it("should delete themes and custom UIs that existed in initialState but were removed", (done) => {
    const dataServiceSpy = jasmine.createSpyObj<DataService>("DataService", [
      "deleteTheme",
      "deleteCustomUI",
    ]);
    dataServiceSpy.deleteTheme.and.returnValue(of(null));
    dataServiceSpy.deleteCustomUI.and.returnValue(
      throwError(() => ({ status: 404 })),
    );

    const settingsServiceSpy = jasmine.createSpyObj<SettingsService>(
      "SettingsService",
      ["saveSettings"],
    );

    const ctx: any = {
      isLoading: false,
      isSaving: false,
      hasChanges: true,
      isAnyThemeNameInvalid: false,
      isAnyCustomUiNameInvalid: false,
      editingSettings: new Settings(),
      displayThemes: [],
      displayCustomUIs: [],
      initialState: {
        themes: [{ entity_id: "t_old", name: "Old Theme" }],
        customUIs: [{ entity_id: "ui_old", name: "Old Layout" }],
      },
      dataService: dataServiceSpy,
      settingsService: settingsServiceSpy,
      themeService: jasmine.createSpyObj<ThemeService>("ThemeService", [
        "refresh",
      ]),
      customUiService: jasmine.createSpyObj<CustomUiService>(
        "CustomUiService",
        ["initialize"],
      ),
    };

    const pipeline = buildAutoSavePipeline(ctx);
    expect(pipeline).not.toBeNull();

    pipeline?.subscribe(() => {
      expect(dataServiceSpy.deleteTheme).toHaveBeenCalledWith("t_old");
      expect(dataServiceSpy.deleteCustomUI).toHaveBeenCalledWith("ui_old");
      done();
    });
  });

  it("should handleAutoSaveState resolving when no pipeline is generated", async () => {
    const comp: any = {
      isLoading: false,
      isSaving: false,
      hasChanges: () => false,
      isAnyThemeNameInvalid: () => false,
      isAnyCustomUiNameInvalid: () => false,
      editingSettings: new Settings(),
      displayThemes: [],
      displayCustomUIs: [],
      undoManager: { getInitialState: () => undefined },
      editingState: {},
      dataService: {},
      settingsService: {},
      themeService: {},
      customUiService: {},
      logger: {},
      translationService: {},
      getSaveDelay: () => 0,
      cdr: { markForCheck: jasmine.createSpy("markForCheck") },
    };

    await expectAsync(handleAutoSaveState(comp)).toBeResolved();
  });

  it("should await activeAutoSavePromise when a save is already in flight", async () => {
    let resolvedInFlight = false;
    const inFlightPromise = new Promise<void>((resolve) => {
      setTimeout(() => {
        resolvedInFlight = true;
        resolve();
      }, 10);
    });

    const comp: any = {
      activeAutoSavePromise: inFlightPromise,
      hasChanges: jasmine.createSpy("hasChanges").and.returnValue(false),
      isAnyThemeNameInvalid: () => false,
      isAnyCustomUiNameInvalid: () => false,
    };

    await handleAutoSaveState(comp);
    expect(resolvedInFlight).toBeTrue();
    expect(comp.hasChanges).toHaveBeenCalled();
  });

  it("should trigger a follow-up save if changes remain after in-flight save completes", async () => {
    let followUpSaved = false;
    const inFlightPromise = Promise.resolve();

    let dirty = true;
    const comp: any = {
      activeAutoSavePromise: inFlightPromise,
      hasChanges: () => dirty,
      isAnyThemeNameInvalid: () => false,
      isAnyCustomUiNameInvalid: () => false,
      isLoading: false,
      isSaving: false,
      editingSettings: new Settings(),
      displayThemes: [],
      displayCustomUIs: [],
      undoManager: {
        getInitialState: () => undefined,
        resetTracking: jasmine.createSpy("resetTracking").and.callFake(() => {
          dirty = false;
        }),
      },
      editingState: {},
      dataService: {},
      settingsService: {
        saveSettings: jasmine.createSpy("saveSettings").and.callFake(() => {
          followUpSaved = true;
        }),
      },
      themeService: { getActiveTheme: () => null },
      customUiService: { initialize: jasmine.createSpy("initialize") },
      logger: {},
      translationService: {},
      getSaveDelay: () => 0,
      cdr: { markForCheck: jasmine.createSpy("markForCheck") },
    };

    await handleAutoSaveState(comp);
    expect(followUpSaved).toBeTrue();
    expect(comp.undoManager.resetTracking).toHaveBeenCalled();
    expect(comp.activeAutoSavePromise).toBeNull();
  });

  it("should reset isSaving to false immediately on success", async () => {
    const comp: any = {
      activeAutoSavePromise: null,
      hasChanges: () => true,
      isAnyThemeNameInvalid: () => false,
      isAnyCustomUiNameInvalid: () => false,
      isLoading: false,
      isSaving: false,
      editingSettings: new Settings(),
      displayThemes: [],
      displayCustomUIs: [],
      undoManager: {
        getInitialState: () => undefined,
        resetTracking: jasmine.createSpy("resetTracking"),
      },
      editingState: {},
      dataService: {},
      settingsService: { saveSettings: jasmine.createSpy("saveSettings") },
      themeService: { getActiveTheme: () => null },
      customUiService: { initialize: jasmine.createSpy("initialize") },
      logger: {},
      translationService: {},
      getSaveDelay: () => 500,
      cdr: { markForCheck: jasmine.createSpy("markForCheck") },
    };

    await handleAutoSaveState(comp);
    expect(comp.isSaving).toBeFalse();
    expect(comp.isAutoSaving).toBeTrue();
  });
});
