import { CustomUI } from "@app/models/custom-ui";
import { Theme } from "@app/models/theme";

import {
  applyInitialExpanderState,
  loadExpanderStateFromStorage,
  saveExpanderStateToStorage,
  toggleThemeExpander,
  toggleUiExpander,
} from "./ui-editor-expander.helper";

describe("ui-editor-expander.helper", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should save and load expander state from localStorage", () => {
    const state = { customUIs: true, themes: false };
    saveExpanderStateToStorage(state);

    const loaded = loadExpanderStateFromStorage({});
    expect(loaded["customUIs"]).toBeTrue();
    expect(loaded["themes"]).toBeFalse();
  });

  it("should toggle theme expander section and collapse others", () => {
    const t1: Theme = {
      entity_id: "t1",
      name: "T1",
      is_default: false,
      slots: {},
      audio_slots: {},
    };
    const t2: Theme = {
      entity_id: "t2",
      name: "T2",
      is_default: false,
      slots: {},
      audio_slots: {},
    };

    const expanded: Record<string, boolean> = {
      theme_t1: true,
      theme_t2: false,
    };
    toggleThemeExpander("t2", [t1, t2], expanded);

    expect(expanded["theme_t1"]).toBeFalse();
    expect(expanded["theme_t2"]).toBeTrue();
  });

  it("should toggle custom UI expander section and collapse others", () => {
    const u1: CustomUI = {
      entity_id: "u1",
      name: "U1",
      is_default: false,
    };
    const u2: CustomUI = {
      entity_id: "u2",
      name: "U2",
      is_default: false,
    };

    const expanded: Record<string, boolean> = { ui_u1: true, ui_u2: false };
    const selectSpy = jasmine.createSpy("onUiSelected");

    toggleUiExpander("u2", [u1, u2], expanded, selectSpy);
    expect(expanded["ui_u1"]).toBeFalse();
    expect(expanded["ui_u2"]).toBeTrue();
    expect(selectSpy).toHaveBeenCalledWith("u2");
  });

  it("should execute scrollToThemeElement without throwing", (done) => {
    const cdr = { detectChanges: jasmine.createSpy("detectChanges") };
    const { scrollToThemeElement } = require("./ui-editor-expander.helper");
    scrollToThemeElement("t1", cdr);
    expect(cdr.detectChanges).toHaveBeenCalled();
    setTimeout(() => {
      done();
    }, 10);
  });

  describe("applyInitialExpanderState", () => {
    const themes: Theme[] = [
      {
        entity_id: "theme_1",
        name: "Theme 1",
        is_default: true,
        slots: {},
        audio_slots: {},
        uiId: "ui_1",
      },
      {
        entity_id: "theme_2",
        name: "Theme 2",
        is_default: false,
        slots: {},
        audio_slots: {},
        uiId: "ui_2",
      },
    ];

    const uis: CustomUI[] = [
      { entity_id: "ui_1", name: "UI 1", is_default: true },
      { entity_id: "ui_2", name: "UI 2", is_default: false },
    ];

    it("should return empty object and not modify state if no target IDs provided", () => {
      const state: Record<string, boolean> = { theme_theme_1: true };
      const res = applyInitialExpanderState(state, themes, uis, null, null);
      expect(res).toEqual({});
      expect(state["theme_theme_1"]).toBeTrue();
    });

    it("should expand target theme and UI and collapse others", () => {
      const state: Record<string, boolean> = {
        themes: false,
        theme_theme_1: true,
        theme_theme_2: false,
        customUIs: false,
        ui_ui_1: true,
        ui_ui_2: false,
      };

      const res = applyInitialExpanderState(
        state,
        themes,
        uis,
        "theme_2",
        "ui_2",
      );

      expect(res.newActiveUiId).toBe("ui_2");
      expect(state["themes"]).toBeTrue();
      expect(state["theme_theme_1"]).toBeFalse();
      expect(state["theme_theme_2"]).toBeTrue();
      expect(state["customUIs"]).toBeTrue();
      expect(state["ui_ui_1"]).toBeFalse();
      expect(state["ui_ui_2"]).toBeTrue();

      const loaded = loadExpanderStateFromStorage({});
      expect(loaded["theme_theme_2"]).toBeTrue();
      expect(loaded["ui_ui_2"]).toBeTrue();
    });

    it("should resolve UI layout from theme when targetUiId is omitted", () => {
      const state: Record<string, boolean> = {};
      const res = applyInitialExpanderState(
        state,
        themes,
        uis,
        "theme_2",
        undefined,
      );

      expect(res.newActiveUiId).toBe("ui_2");
      expect(state["theme_theme_2"]).toBeTrue();
      expect(state["ui_ui_2"]).toBeTrue();
    });

    it("should resolve theme from UI layout when targetThemeId is omitted", () => {
      const state: Record<string, boolean> = {};
      const res = applyInitialExpanderState(
        state,
        themes,
        uis,
        undefined,
        "ui_2",
      );

      expect(res.newActiveUiId).toBe("ui_2");
      expect(state["theme_theme_2"]).toBeTrue();
      expect(state["ui_ui_2"]).toBeTrue();
    });
  });
});
