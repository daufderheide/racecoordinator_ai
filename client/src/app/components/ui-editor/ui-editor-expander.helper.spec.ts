import { CustomUI } from "@app/models/custom-ui";
import { Theme } from "@app/models/theme";

import {
  loadExpanderStateFromStorage,
  restoreOpenLayoutOnEntry,
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

  it("should execute scrollToUiElement without throwing", (done) => {
    const cdr = { detectChanges: jasmine.createSpy("detectChanges") };
    const { scrollToUiElement } = require("./ui-editor-expander.helper");
    scrollToUiElement("u1", cdr);
    expect(cdr.detectChanges).toHaveBeenCalled();
    setTimeout(() => {
      done();
    }, 10);
  });

  describe("restoreOpenLayoutOnEntry", () => {
    const uis: CustomUI[] = [
      { entity_id: "ui_1", name: "UI 1", is_default: true },
      { entity_id: "ui_2", name: "UI 2", is_default: false },
    ];

    it("should set activeCustomUiId to open layout and scroll when customUIs is expanded", () => {
      const scrollToUiSpy = jasmine.createSpy("scrollToUi");
      const ensureWidgetSelectedSpy = jasmine.createSpy("ensureWidgetSelected");
      const comp: any = {
        displayCustomUIs: uis,
        sectionsExpanded: { customUIs: true, ui_ui_2: true },
        activeCustomUiId: "ui_1",
        ensureWidgetSelected: ensureWidgetSelectedSpy,
        scrollToUi: scrollToUiSpy,
      };

      const res = restoreOpenLayoutOnEntry(comp);

      expect(res.openUiId).toBe("ui_2");
      expect(comp.activeCustomUiId).toBe("ui_2");
      expect(ensureWidgetSelectedSpy).toHaveBeenCalled();
      expect(scrollToUiSpy).toHaveBeenCalledWith("ui_2", 100);
    });

    it("should set activeCustomUiId to open layout but not scroll when customUIs is collapsed", () => {
      const scrollToUiSpy = jasmine.createSpy("scrollToUi");
      const ensureWidgetSelectedSpy = jasmine.createSpy("ensureWidgetSelected");
      const comp: any = {
        displayCustomUIs: uis,
        sectionsExpanded: { customUIs: false, ui_ui_2: true },
        activeCustomUiId: "ui_1",
        ensureWidgetSelected: ensureWidgetSelectedSpy,
        scrollToUi: scrollToUiSpy,
      };

      const res = restoreOpenLayoutOnEntry(comp);

      expect(res.openUiId).toBe("ui_2");
      expect(comp.activeCustomUiId).toBe("ui_2");
      expect(ensureWidgetSelectedSpy).toHaveBeenCalled();
      expect(scrollToUiSpy).not.toHaveBeenCalled();
    });

    it("should return empty object and not modify state or scroll when no layout expander is open", () => {
      const scrollToUiSpy = jasmine.createSpy("scrollToUi");
      const ensureWidgetSelectedSpy = jasmine.createSpy("ensureWidgetSelected");
      const comp: any = {
        displayCustomUIs: uis,
        sectionsExpanded: { customUIs: true, ui_ui_1: false, ui_ui_2: false },
        activeCustomUiId: "ui_1",
        ensureWidgetSelected: ensureWidgetSelectedSpy,
        scrollToUi: scrollToUiSpy,
      };

      const res = restoreOpenLayoutOnEntry(comp);

      expect(res).toEqual({});
      expect(comp.activeCustomUiId).toBe("ui_1");
      expect(ensureWidgetSelectedSpy).not.toHaveBeenCalled();
      expect(scrollToUiSpy).not.toHaveBeenCalled();
    });
  });
});
