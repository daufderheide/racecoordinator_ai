import { CustomUI } from "@app/models/custom-ui";
import { Settings } from "@app/models/settings";
import { Theme } from "@app/models/theme";

import {
  ensureDefaultCustomUis,
  normalizeLoadedThemes,
  processLoadedEditorData,
} from "./ui-editor-data.helper";

describe("ui-editor-data.helper", () => {
  it("should ensure default custom UIs for raceday, practice, and fuel", () => {
    const uis: CustomUI[] = [];
    const settings = new Settings();

    ensureDefaultCustomUis(uis, settings);
    expect(uis.length).toBe(3);
    expect(
      uis.some((u) => u.entity_id === "default_ui_layout_rc_ai"),
    ).toBeTrue();
    expect(
      uis.some((u) => u.entity_id === "practice_ui_layout_rc_ai"),
    ).toBeTrue();
    expect(
      uis.some((u) => u.entity_id === "default_fuel_ui_layout_rc_ai"),
    ).toBeTrue();
  });

  it("should rename legacy default custom UI names to canonical names and preserve custom UIs", () => {
    const uis: CustomUI[] = [
      {
        entity_id: "default_ui_layout_rc_ai",
        name: "Default UI Layout",
        is_default: true,
      },
      {
        entity_id: "practice_ui_layout_rc_ai",
        name: "Practice UI Layout",
        is_default: true,
      },
      {
        entity_id: "default_fuel_ui_layout_rc_ai",
        name: "Fuel UI",
        is_default: true,
      },
      {
        entity_id: "custom_ui_1",
        name: "My Custom Layout",
        is_default: false,
      },
    ];
    const settings = new Settings();

    ensureDefaultCustomUis(uis, settings);
    expect(
      uis.find((u) => u.entity_id === "default_ui_layout_rc_ai")?.name,
    ).toBe("RaceCoordinator AI");
    expect(
      uis.find((u) => u.entity_id === "practice_ui_layout_rc_ai")?.name,
    ).toBe("RaceCoordinator AI (Practice)");
    expect(
      uis.find((u) => u.entity_id === "default_fuel_ui_layout_rc_ai")?.name,
    ).toBe("RaceCoordinator AI (Fuel)");
    expect(uis.find((u) => u.entity_id === "custom_ui_1")?.name).toBe(
      "My Custom Layout",
    );
  });

  it("should migrate legacy fuel custom UI with entity_id '2'", () => {
    const uis: CustomUI[] = [
      {
        entity_id: "2",
        name: "Fuel UI",
        is_default: true,
      },
    ];
    const settings = new Settings();

    ensureDefaultCustomUis(uis, settings);
    const fuelUi = uis.find(
      (u) => u.entity_id === "default_fuel_ui_layout_rc_ai",
    );
    expect(fuelUi).toBeDefined();
    expect(fuelUi?.name).toBe("RaceCoordinator AI (Fuel)");
    expect(uis.some((u) => u.entity_id === "2")).toBeFalse();
  });

  it("should NOT migrate custom UI with entity_id '2' if it is not default or legacy fuel UI", () => {
    const uis: CustomUI[] = [
      {
        entity_id: "2",
        name: "Custom Leaderboard",
        is_default: false,
      },
    ];
    const settings = new Settings();

    ensureDefaultCustomUis(uis, settings);
    const customUi = uis.find((u) => u.entity_id === "2");
    expect(customUi).toBeDefined();
    expect(customUi?.name).toBe("Custom Leaderboard");
    expect(customUi?.entity_id).toBe("2");
    expect(customUi?.is_default).toBeFalse();

    // Default fuel UI should be created independently
    const fuelUi = uis.find(
      (u) => u.entity_id === "default_fuel_ui_layout_rc_ai",
    );
    expect(fuelUi).toBeDefined();
    expect(fuelUi?.name).toBe("RaceCoordinator AI (Fuel)");
  });

  it("should preserve custom theme uiId when pointing to custom UI '2'", () => {
    const customTheme: Theme = {
      entity_id: "3",
      name: "Custom Leaderboard Theme",
      is_default: false,
      uiId: "2",
      slots: {},
      audio_slots: {},
    };
    normalizeLoadedThemes([customTheme]);
    expect(customTheme.uiId).toBe("2");
    expect(customTheme.name).toBe("Custom Leaderboard Theme");
    expect(customTheme.entity_id).toBe("3");
  });

  it("should process loaded editor data and normalize legacy themes", () => {
    const defaultTheme: Theme = {
      entity_id: "default_classic_rc_ai",
      name: "Classic Theme",
      is_default: true,
      slots: {},
      audio_slots: {},
    };
    const practiceTheme: Theme = {
      entity_id: "practice_theme_rc_ai",
      name: "Practice Theme",
      is_default: true,
      slots: {},
      audio_slots: {},
    };
    const fuelTheme: Theme = {
      entity_id: "default_fuel_theme_rc_ai",
      name: "Fuel Theme",
      is_default: true,
      slots: {},
      audio_slots: {},
    };
    const customTheme: Theme = {
      entity_id: "custom_theme_1",
      name: "My Custom Theme",
      is_default: false,
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
      themes: [defaultTheme, practiceTheme, fuelTheme, customTheme],
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
    expect(result.initialState.customUIs?.length).toBe(3);

    const loadedThemes = result.initialState.themes;
    expect(
      loadedThemes.find((t) => t.entity_id === "default_classic_rc_ai")?.name,
    ).toBe("RaceCoordinator AI");
    expect(
      loadedThemes.find((t) => t.entity_id === "practice_theme_rc_ai")?.name,
    ).toBe("RaceCoordinator AI (Practice)");
    expect(
      loadedThemes.find((t) => t.entity_id === "default_fuel_theme_rc_ai")
        ?.name,
    ).toBe("RaceCoordinator AI (Fuel)");
    expect(
      loadedThemes.find((t) => t.entity_id === "custom_theme_1")?.name,
    ).toBe("My Custom Theme");
  });
});
