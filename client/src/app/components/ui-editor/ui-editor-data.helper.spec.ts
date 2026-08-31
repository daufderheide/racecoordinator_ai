import { CustomUI } from "@app/models/custom-ui";
import { Settings } from "@app/models/settings";
import { Theme } from "@app/models/theme";

import {
  ensureDefaultCustomUis,
  processLoadedEditorData,
} from "./ui-editor-data.helper";

describe("ui-editor-data.helper", () => {
  it("should ensure default custom UIs for raceday and practice", () => {
    const uis: CustomUI[] = [];
    const settings = new Settings();

    ensureDefaultCustomUis(uis, settings);
    expect(uis.length).toBe(2);
    expect(
      uis.some((u) => u.entity_id === "default_ui_layout_rc_ai"),
    ).toBeTrue();
    expect(
      uis.some((u) => u.entity_id === "practice_ui_layout_rc_ai"),
    ).toBeTrue();
  });

  it("should process loaded editor data and filter assets", () => {
    const theme: Theme = {
      entity_id: "t1",
      name: "Theme 1",
      is_default: true,
      slots: {},
      audio_slots: {},
    };

    const rawData = {
      assets: [
        { id: "img1", type: "image", name: "Flag" },
        { id: "audio1", type: "audio", name: "Beep" },
        { id: "other", type: "other_type", name: "Other" },
      ],
      dirHandle: { name: "custom-folder" },
      widgetDirHandle: { name: "custom-widgets" },
      themes: [theme],
      tracks: [{ id: "track1" }],
      customUIs: [],
    };

    const currentSettings = new Settings();
    const setActiveThemeSpy = jasmine.createSpy("setActiveTheme");

    const result = processLoadedEditorData(
      rawData as any,
      currentSettings,
      setActiveThemeSpy,
    );

    expect(result.filteredAssets.length).toBe(2);
    expect(result.soundAssets.length).toBe(1);
    expect(result.customDirectoryName).toBe("custom-folder");
    expect(result.customWidgetDirectoryName).toBe("custom-widgets");
    expect(result.track).toEqual({ id: "track1" });
    expect(result.initialState.customUIs?.length).toBe(2);
  });
});
