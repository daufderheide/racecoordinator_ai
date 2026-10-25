import { of } from "rxjs";
import { DataService } from "@app/data.service";
import { LoggerService } from "@app/services/logger.service";
import { ThemeService } from "@app/services/theme.service";
import { TranslationService } from "@app/services/translation.service";

import {
  createCustomUiEntity,
  createThemeEntity,
  deleteCustomUiEntity,
  deleteThemeEntity,
  duplicateCustomUiEntity,
  duplicateThemeEntity,
  getDefaultThemeFactoryData,
  handleConfirmDiscard,
  handleOperationError,
  isCountdownPreviewActiveHelper,
  toggleCountdownPreviewHelper,
} from "./ui-editor-operations.helper";

describe("ui-editor-operations.helper", () => {
  let translationServiceSpy: jasmine.SpyObj<TranslationService>;
  let loggerSpy: jasmine.SpyObj<LoggerService>;

  beforeEach(() => {
    translationServiceSpy = jasmine.createSpyObj<TranslationService>(
      "TranslationService",
      ["translate"],
    );
    translationServiceSpy.translate.and.callFake((key: string) => key);
    loggerSpy = jasmine.createSpyObj<LoggerService>("LoggerService", ["error"]);
  });

  it("should create custom UI entity using factory defaults and unique name", async () => {
    const dataServiceSpy = jasmine.createSpyObj<DataService>("DataService", [
      "createCustomUI",
    ]);
    dataServiceSpy.createCustomUI.and.callFake((payload: any) =>
      of({
        ...payload,
        entity_id: "custom_ui_123",
      }),
    );

    const existingUis = [
      {
        entity_id: "default_ui_layout_rc_ai",
        name: "RaceCoordinator AI",
        is_default: true,
      },
    ];

    const res = await createCustomUiEntity(
      existingUis as any,
      translationServiceSpy,
      dataServiceSpy,
    );

    expect(dataServiceSpy.createCustomUI).toHaveBeenCalled();
    const passedPayload =
      dataServiceSpy.createCustomUI.calls.mostRecent().args[0];
    expect(passedPayload.entity_id).toBe("new");
    expect(passedPayload["@id"]).toBe(1);
    expect(passedPayload.name).toBe("New UI Layout");
    expect(passedPayload.is_default).toBeFalse();
    expect(passedPayload.layoutJson).toBeTruthy();
    expect(passedPayload.columnsJson).toBeTruthy();
    expect(passedPayload.columnLayoutsJson).toBeTruthy();
    expect(res?.entity_id).toBe("custom_ui_123");
    expect(res?.name).toBe("New UI Layout");
  });

  it("should create custom UI entity with incremented name when New UI Layout already exists", async () => {
    const dataServiceSpy = jasmine.createSpyObj<DataService>("DataService", [
      "createCustomUI",
    ]);
    dataServiceSpy.createCustomUI.and.callFake((payload: any) =>
      of({
        ...payload,
        entity_id: "custom_ui_124",
      }),
    );

    const existingUis = [
      {
        entity_id: "u1",
        name: "New UI Layout",
        is_default: false,
      },
    ];

    const res = await createCustomUiEntity(
      existingUis as any,
      translationServiceSpy,
      dataServiceSpy,
    );

    expect(res?.name).toBe("New UI Layout 2");
  });

  it("should duplicate custom UI entity", async () => {
    const dataServiceSpy = jasmine.createSpyObj<DataService>("DataService", [
      "duplicateCustomUI",
    ]);
    dataServiceSpy.duplicateCustomUI.and.returnValue(
      of({
        _id: "dup_ui",
        entity_id: "dup_ui",
        name: "Default UI (Copy)",
        is_default: false,
      }),
    );

    const ui = {
      _id: "u1",
      entity_id: "default_ui_layout_rc_ai",
      name: "Default UI",
      is_default: true,
      layoutJson: "{}",
    };

    const res = await duplicateCustomUiEntity(
      ui as any,
      translationServiceSpy,
      dataServiceSpy,
    );
    expect(res?.name).toContain("Copy");
  });

  it("should delete custom UI entity", async () => {
    const dataServiceSpy = jasmine.createSpyObj<DataService>("DataService", [
      "deleteCustomUI",
    ]);
    dataServiceSpy.deleteCustomUI.and.returnValue(of(undefined));

    await deleteCustomUiEntity("ui_1", dataServiceSpy);
    expect(dataServiceSpy.deleteCustomUI).toHaveBeenCalledWith("ui_1");
  });

  it("should create theme entity using factory defaults and unique name", async () => {
    const themeServiceSpy = jasmine.createSpyObj<ThemeService>("ThemeService", [
      "createTheme",
    ]);
    themeServiceSpy.createTheme.and.callFake((t: any) =>
      Promise.resolve({
        entity_id: "new_t",
        name: t.name,
        is_default: false,
        slots: t.slots || {},
        audio_slots: t.audio_slots || {},
        uiId: t.uiId,
      }),
    );

    const existingThemes = [
      {
        entity_id: "default_classic_rc_ai",
        name: "Classic",
        is_default: true,
        slots: {},
        audio_slots: {},
      },
    ];

    const res = await createThemeEntity(
      existingThemes as any,
      translationServiceSpy,
      themeServiceSpy,
    );
    expect(res.name).toBe("New Theme");
    expect(themeServiceSpy.createTheme).toHaveBeenCalled();
    const passedTheme = themeServiceSpy.createTheme.calls.mostRecent().args[0];
    expect(passedTheme.is_default).toBeFalse();
    expect(passedTheme.slots!["flag.racing"]).toBe("default_flag_green");
    expect(passedTheme.audio_slots!["audio.countdown"].url).toBe(
      "default_countdown",
    );
    expect(passedTheme.uiId).toBe("default_ui_layout_rc_ai");
  });

  it("should return factory defaults from getDefaultThemeFactoryData", () => {
    const factory = getDefaultThemeFactoryData();
    expect(factory.uiId).toBe("default_ui_layout_rc_ai");
    expect(factory.slots["flag.racing"]).toBe("default_flag_green");
    expect(factory.slots["gauge.fuel"]).toBe("default_fuel_gauge");
    expect(factory.audio_slots["audio.countdown"].type).toBe("audio_set");
  });

  it("should duplicate theme entity", async () => {
    const themeServiceSpy = jasmine.createSpyObj<ThemeService>("ThemeService", [
      "duplicateTheme",
    ]);
    themeServiceSpy.duplicateTheme.and.returnValue(
      Promise.resolve({
        entity_id: "dup_t",
        name: "Classic (Copy)",
        is_default: false,
        slots: {},
        audio_slots: {},
      }),
    );

    const theme = {
      entity_id: "default_classic_rc_ai",
      name: "Classic",
      is_default: true,
      slots: {},
      audio_slots: {},
    };

    const res = await duplicateThemeEntity(
      theme as any,
      translationServiceSpy,
      themeServiceSpy,
    );
    expect(res.name).toContain("Copy");
  });

  it("should delete theme entity", async () => {
    const themeServiceSpy = jasmine.createSpyObj<ThemeService>("ThemeService", [
      "deleteTheme",
    ]);
    themeServiceSpy.deleteTheme.and.returnValue(Promise.resolve());

    await deleteThemeEntity("theme_1", themeServiceSpy);
    expect(themeServiceSpy.deleteTheme).toHaveBeenCalledWith("theme_1");
  });

  it("should handle operation error without crashing", () => {
    spyOn(window, "alert");
    handleOperationError(
      { status: 500 },
      "UE_ERROR_CREATE_FAILED",
      loggerSpy,
      translationServiceSpy,
    );
    expect(loggerSpy.error).toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith("UE_ERROR_CREATE_FAILED");
  });

  it("should handle confirm discard directly when no changes exist", async () => {
    const comp: any = {
      undoManager: { commitState: jasmine.createSpy("commitState") },
      hasChanges: () => false,
      isAnyThemeNameInvalid: () => false,
      isAnyCustomUiNameInvalid: () => false,
      autoSaveState: jasmine
        .createSpy("autoSaveState")
        .and.returnValue(Promise.resolve()),
      logger: loggerSpy,
      showDiscardConfirm: false,
      pendingDeactivate: null,
      cdr: { markForCheck: jasmine.createSpy("markForCheck") },
    };

    const result = await handleConfirmDiscard(comp);
    expect(result).toBeTrue();
    expect(comp.undoManager.commitState).toHaveBeenCalled();
  });

  it("should auto-save and approve deactivation when changes exist and autoSaveState clears them", async () => {
    let hasChangesValue = true;
    const comp: any = {
      undoManager: { commitState: jasmine.createSpy("commitState") },
      hasChanges: () => hasChangesValue,
      isAnyThemeNameInvalid: () => false,
      isAnyCustomUiNameInvalid: () => false,
      autoSaveState: jasmine
        .createSpy("autoSaveState")
        .and.callFake(async () => {
          hasChangesValue = false;
        }),
      logger: loggerSpy,
      showDiscardConfirm: false,
      pendingDeactivate: null,
      cdr: { markForCheck: jasmine.createSpy("markForCheck") },
    };

    const result = await handleConfirmDiscard(comp);
    expect(result).toBeTrue();
    expect(comp.autoSaveState).toHaveBeenCalled();
    expect(comp.showDiscardConfirm).toBeFalse();
  });

  describe("countdown preview helpers", () => {
    it("should return false if no id is resolved", () => {
      const comp: any = { activeCustomUiId: null };
      expect(isCountdownPreviewActiveHelper(comp)).toBeFalse();
    });

    it("should return recorded state if present in countdownPreviewActiveByUi", () => {
      const comp: any = {
        activeCustomUiId: "ui1",
        countdownPreviewActiveByUi: { ui1: true },
      };
      expect(isCountdownPreviewActiveHelper(comp)).toBeTrue();
    });

    it("should check widgetType countdown if not recorded", () => {
      const comp: any = {
        activeCustomUiId: "ui1",
        countdownPreviewActiveByUi: {},
        selectedWidgetId: "w1",
        getLayout: () => ({ widgets: [{ id: "w1", widgetType: "countdown" }] }),
      };
      expect(isCountdownPreviewActiveHelper(comp)).toBeTrue();
    });

    it("should toggle countdown preview state and call markForCheck", () => {
      const comp: any = {
        activeCustomUiId: "ui1",
        countdownPreviewActiveByUi: {},
        selectedWidgetId: "w1",
        getLayout: () => ({ widgets: [{ id: "w1", widgetType: "countdown" }] }),
        isCountdownPreviewActive: (ui?: any) =>
          isCountdownPreviewActiveHelper(comp, ui),
        cdr: { markForCheck: jasmine.createSpy("markForCheck") },
      };

      toggleCountdownPreviewHelper(comp);
      expect(comp.countdownPreviewActiveByUi["ui1"]).toBeFalse();
      expect(comp.cdr.markForCheck).toHaveBeenCalled();
    });
  });
});
