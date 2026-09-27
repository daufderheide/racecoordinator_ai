import { CustomUI } from "@app/models/custom-ui";
import { Theme } from "@app/models/theme";

import {
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
});
