import { Settings } from "@app/models/settings";
import { Theme } from "@app/models/theme";

import {
  areSettingsEqual,
  areUIEditorStatesEqual,
  cloneSettings,
  cloneUIEditorState,
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
});
