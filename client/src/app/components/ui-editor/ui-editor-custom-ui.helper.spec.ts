import { of } from "rxjs";
import { CustomUI } from "@app/models/custom-ui";
import { Theme } from "@app/models/theme";

import {
  handleCreateCustomUi,
  handleCustomUiStateDeletion,
  handleDuplicateCustomUi,
  sortCustomUisForDisplay,
} from "./ui-editor-custom-ui.helper";

describe("ui-editor-custom-ui.helper", () => {
  it("should naturally alphabetize custom UIs by name without pinning defaults", () => {
    const u1: CustomUI = {
      entity_id: "custom_layout",
      name: "Custom",
      is_default: false,
    };
    const u2: CustomUI = {
      entity_id: "default_ui_layout_rc_ai",
      name: "Default",
      is_default: true,
    };

    const sorted = sortCustomUisForDisplay([u2, u1]);
    expect(sorted[0].entity_id).toBe("custom_layout");
    expect(sorted[1].entity_id).toBe("default_ui_layout_rc_ai");
  });

  it("should naturally alphabetize all custom UIs together", () => {
    const zebra: CustomUI = {
      entity_id: "ui_z",
      name: "Zebra Layout",
      is_default: false,
    };
    const alpha: CustomUI = {
      entity_id: "ui_a",
      name: "Alpha Layout",
      is_default: false,
    };
    const mid10: CustomUI = {
      entity_id: "ui_m10",
      name: "Layout 10",
      is_default: false,
    };
    const mid2: CustomUI = {
      entity_id: "ui_m2",
      name: "Layout 2",
      is_default: false,
    };
    const practice: CustomUI = {
      entity_id: "practice_ui_layout_rc_ai",
      name: "Practice UI Layout",
      is_default: true,
    };
    const def: CustomUI = {
      entity_id: "default_ui_layout_rc_ai",
      name: "Default UI Layout",
      is_default: true,
    };

    const sorted = sortCustomUisForDisplay([
      zebra,
      mid10,
      practice,
      alpha,
      def,
      mid2,
    ]);
    expect(sorted.map((u) => u.name)).toEqual([
      "Alpha Layout",
      "Default UI Layout",
      "Layout 2",
      "Layout 10",
      "Practice UI Layout",
      "Zebra Layout",
    ]);
  });

  it("should handle custom UI state deletion updating active ID and themes", () => {
    const u1: CustomUI = {
      entity_id: "ui_1",
      name: "UI 1",
      is_default: false,
    };
    const u2: CustomUI = {
      entity_id: "default_ui_layout_rc_ai",
      name: "Default UI",
      is_default: true,
    };

    const theme: Theme = {
      entity_id: "t1",
      name: "Theme 1",
      is_default: true,
      slots: {},
      audio_slots: {},
      uiId: "ui_1",
    };

    const state: any = {
      customUIs: [u1, u2],
      themes: [theme],
    };

    const res = handleCustomUiStateDeletion(state, "ui_1", "ui_1");
    expect(state.customUIs.length).toBe(1);
    expect(theme.uiId).toBe("default_ui_layout_rc_ai");
    expect(res.newActiveUiId).toBe("default_ui_layout_rc_ai");
  });

  it("should track defaultUiNames and focus name input on create", async () => {
    const defaultUi: CustomUI = {
      entity_id: "default_ui_layout_rc_ai",
      name: "Default UI",
      is_default: true,
      layoutJson: "{}",
    };
    const comp: any = {
      displayCustomUIs: [defaultUi],
      editingState: { customUIs: [defaultUi] },
      defaultUiNames: {},
      translationService: { translate: (k: string) => k },
      dataService: {
        duplicateCustomUI: jasmine
          .createSpy("duplicateCustomUI")
          .and.returnValue(
            of({
              entity_id: "new_ui_1",
              name: "New Layout",
            }),
          ),
      },
      logger: { error: jasmine.createSpy("error") },
      refreshDisplayProperties: jasmine.createSpy("refreshDisplayProperties"),
      undoManager: { captureState: jasmine.createSpy("captureState") },
      toggleUiSection: jasmine.createSpy("toggleUiSection"),
      focusUiNameInput: jasmine.createSpy("focusUiNameInput"),
      cdr: { markForCheck: jasmine.createSpy("markForCheck") },
    };

    await handleCreateCustomUi(comp);

    expect(comp.defaultUiNames["new_ui_1"]).toBe("New Layout");
    expect(comp.focusUiNameInput).toHaveBeenCalledWith("new_ui_1");
  });

  it("should track defaultUiNames and focus name input on duplicate", async () => {
    const existingUi: CustomUI = {
      entity_id: "ui_1",
      name: "My Layout",
      is_default: false,
      layoutJson: "{}",
    };
    const comp: any = {
      editingState: { customUIs: [existingUi] },
      defaultUiNames: {},
      translationService: { translate: (k: string) => k },
      dataService: {
        duplicateCustomUI: jasmine
          .createSpy("duplicateCustomUI")
          .and.returnValue(
            of({
              entity_id: "ui_1_copy",
              name: "My Layout (1)",
            }),
          ),
      },
      logger: { error: jasmine.createSpy("error") },
      refreshDisplayProperties: jasmine.createSpy("refreshDisplayProperties"),
      undoManager: { captureState: jasmine.createSpy("captureState") },
      toggleUiSection: jasmine.createSpy("toggleUiSection"),
      focusUiNameInput: jasmine.createSpy("focusUiNameInput"),
      cdr: { markForCheck: jasmine.createSpy("markForCheck") },
    };

    await handleDuplicateCustomUi(comp, existingUi);

    expect(comp.defaultUiNames["ui_1_copy"]).toBe("My Layout (1)");
    expect(comp.focusUiNameInput).toHaveBeenCalledWith("ui_1_copy");
  });
});
