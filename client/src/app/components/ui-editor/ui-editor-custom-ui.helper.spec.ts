import { CustomUI } from "@app/models/custom-ui";
import { Theme } from "@app/models/theme";

import {
  handleCustomUiStateDeletion,
  sortCustomUisForDisplay,
} from "./ui-editor-custom-ui.helper";

describe("ui-editor-custom-ui.helper", () => {
  it("should sort custom UIs placing default UI first", () => {
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

    const sorted = sortCustomUisForDisplay([u1, u2]);
    expect(sorted[0].entity_id).toBe("default_ui_layout_rc_ai");
    expect(sorted[1].entity_id).toBe("custom_layout");
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
});
