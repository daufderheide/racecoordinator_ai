import { Settings } from "@app/models/settings";
import { Theme } from "@app/models/theme";

import {
  areSettingsEqual,
  areUIEditorStatesEqual,
  cloneSettings,
  cloneUIEditorState,
  executeCaptureState,
} from "./ui-editor-state.utils";

describe("ui-editor-state.utils", () => {
  it("should clone settings deeply", () => {
    const s = new Settings();
    s.activeThemeId = "theme1";
    s.racedayColumns = ["lapCount", "lastLapTime"];

    const cloned = cloneSettings(s);
    expect(cloned).not.toBe(s);
    expect(cloned.activeThemeId).toBe("theme1");
    expect(cloned.racedayColumns).toEqual(["lapCount", "lastLapTime"]);

    cloned.racedayColumns.push("gapLeader");
    expect(s.racedayColumns).toEqual(["lapCount", "lastLapTime"]);
  });

  it("should compare settings correctly ignoring layout editor coordinates", () => {
    const s1 = new Settings();
    s1.activeThemeId = "theme1";
    s1.layoutEditorPositionX = 100;
    s1.layoutEditorPositionY = 200;

    const s2 = new Settings();
    s2.activeThemeId = "theme1";
    s2.layoutEditorPositionX = 999;
    s2.layoutEditorPositionY = 888;

    expect(areSettingsEqual(s1, s2)).toBeTrue();

    s2.activeThemeId = "theme2";
    expect(areSettingsEqual(s1, s2)).toBeFalse();
  });

  it("should compare UIEditorState correctly", () => {
    const s1 = new Settings();
    const t1: Theme = {
      entity_id: "t1",
      name: "Theme 1",
      is_default: false,
      slots: {},
      audio_slots: {},
    };

    const state1 = {
      settings: s1,
      themes: [t1],
      customUIs: [],
    };

    const state2 = cloneUIEditorState(state1);
    expect(areUIEditorStatesEqual(state1, state2)).toBeTrue();

    state2.themes[0].name = "Updated Theme";
    expect(areUIEditorStatesEqual(state1, state2)).toBeFalse();
  });

  it("should clone customExportTemplateBase64, name, and path properly", () => {
    const s = new Settings();
    s.customExportTemplateBase64 =
      "data:application/vnd.ms-excel;base64,ABC123";
    s.customExportTemplateName = "template.xlsx";
    s.customExportTemplatePath = "/path/to/template.xlsx";

    const cloned = cloneSettings(s);
    expect(cloned.customExportTemplateBase64).toBe(
      "data:application/vnd.ms-excel;base64,ABC123",
    );
    expect(cloned.customExportTemplateName).toBe("template.xlsx");
    expect(cloned.customExportTemplatePath).toBe("/path/to/template.xlsx");
  });

  it("should detect changes in customExportTemplateBase64, name, and path", () => {
    const s1 = new Settings();
    const s2 = new Settings();
    expect(areSettingsEqual(s1, s2)).toBeTrue();

    s2.customExportTemplateBase64 =
      "data:application/vnd.ms-excel;base64,XYZ789";
    expect(areSettingsEqual(s1, s2)).toBeFalse();

    s1.customExportTemplateBase64 =
      "data:application/vnd.ms-excel;base64,XYZ789";
    expect(areSettingsEqual(s1, s2)).toBeTrue();

    s2.customExportTemplateName = "other.xlsx";
    expect(areSettingsEqual(s1, s2)).toBeFalse();

    s1.customExportTemplateName = "other.xlsx";
    expect(areSettingsEqual(s1, s2)).toBeTrue();

    s2.customExportTemplatePath = "/other/path.xlsx";
    expect(areSettingsEqual(s1, s2)).toBeFalse();

    s1.customExportTemplatePath = "/other/path.xlsx";
    expect(areSettingsEqual(s1, s2)).toBeTrue();
  });

  it("should consider undefined and empty string customExportTemplateBase64 as equal", () => {
    const s1 = new Settings();
    s1.customExportTemplateBase64 = undefined;
    s1.customExportTemplateName = undefined;
    s1.customExportTemplatePath = undefined;
    const s2 = new Settings();
    s2.customExportTemplateBase64 = "";
    s2.customExportTemplateName = "";
    s2.customExportTemplatePath = "";
    expect(areSettingsEqual(s1, s2)).toBeTrue();
  });

  it("should executeCaptureState by cloning settings, themes, customUIs and calling captureState", () => {
    const comp: any = {
      editingState: {
        settings: new Settings(),
        themes: [],
        customUIs: [],
      },
      displayCustomUIs: [{ entity_id: "ui_1", name: "UI 1" }],
      displayThemes: [{ entity_id: "th_1", name: "Theme 1" }],
      undoManager: {
        captureState: jasmine.createSpy("captureState"),
      },
    };

    executeCaptureState(comp);
    expect(comp.undoManager.captureState).toHaveBeenCalled();
    expect(comp.editingState.customUIs).toEqual(comp.displayCustomUIs);
    expect(comp.editingState.customUIs).not.toBe(comp.displayCustomUIs);
    expect(comp.editingState.themes).toEqual(comp.displayThemes);
    expect(comp.editingState.themes).not.toBe(comp.displayThemes);
  });
});
