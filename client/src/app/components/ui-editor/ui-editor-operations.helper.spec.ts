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
  handleOperationError,
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

  it("should create custom UI entity", async () => {
    const dataServiceSpy = jasmine.createSpyObj<DataService>("DataService", [
      "duplicateCustomUI",
    ]);
    dataServiceSpy.duplicateCustomUI.and.returnValue(
      of({
        _id: "new_ui",
        entity_id: "new_ui",
        name: "New UI",
        is_default: false,
      }),
    );

    const defaultUi = {
      _id: "default_ui",
      entity_id: "default_ui_layout_rc_ai",
      name: "Default UI",
      is_default: true,
      layoutJson: "{}",
    };

    const res = await createCustomUiEntity(
      defaultUi as any,
      translationServiceSpy,
      dataServiceSpy,
    );
    expect(res?.name).toBe("New UI");
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

  it("should create theme entity", async () => {
    const themeServiceSpy = jasmine.createSpyObj<ThemeService>("ThemeService", [
      "duplicateTheme",
    ]);
    themeServiceSpy.duplicateTheme.and.returnValue(
      Promise.resolve({
        entity_id: "new_t",
        name: "New Theme",
        is_default: false,
        slots: {},
        audio_slots: {},
      }),
    );

    const defaultTheme = {
      entity_id: "default_classic_rc_ai",
      name: "Classic",
      is_default: true,
      slots: {},
      audio_slots: {},
    };

    const res = await createThemeEntity(
      defaultTheme as any,
      translationServiceSpy,
      themeServiceSpy,
    );
    expect(res.name).toBe("New Theme");
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
});
