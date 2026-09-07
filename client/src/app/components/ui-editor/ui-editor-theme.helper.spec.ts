import { UndoManager } from "@app/components/shared/undo-redo-controls/undo-manager";
import { Theme } from "@app/models/theme";

import {
  applyAudioConfigUpdate,
  applyThemeSlotUpdate,
  removeThemeFromUndoHistory,
  sortThemesForDisplay,
} from "./ui-editor-theme.helper";

describe("ui-editor-theme.helper", () => {
  it("should naturally alphabetize themes by name without pinning defaults", () => {
    const t1: Theme = {
      entity_id: "custom_theme",
      name: "Custom",
      is_default: false,
      slots: {},
      audio_slots: {},
    };
    const t2: Theme = {
      entity_id: "default_classic_rc_ai",
      name: "Default",
      is_default: true,
      slots: {},
      audio_slots: {},
    };

    const sorted = sortThemesForDisplay([t2, t1]);
    expect(sorted[0].entity_id).toBe("custom_theme");
    expect(sorted[1].entity_id).toBe("default_classic_rc_ai");
  });

  it("should naturally alphabetize all themes together including numbers and defaults", () => {
    const zebra: Theme = {
      entity_id: "theme_z",
      name: "Zebra Theme",
      is_default: false,
      slots: {},
      audio_slots: {},
    };
    const alpha: Theme = {
      entity_id: "theme_a",
      name: "Alpha Theme",
      is_default: false,
      slots: {},
      audio_slots: {},
    };
    const mid10: Theme = {
      entity_id: "theme_m10",
      name: "Theme 10",
      is_default: false,
      slots: {},
      audio_slots: {},
    };
    const mid2: Theme = {
      entity_id: "theme_m2",
      name: "Theme 2",
      is_default: false,
      slots: {},
      audio_slots: {},
    };
    const practice: Theme = {
      entity_id: "practice_theme_rc_ai",
      name: "Practice Theme",
      is_default: true,
      slots: {},
      audio_slots: {},
    };
    const def: Theme = {
      entity_id: "default_classic_rc_ai",
      name: "Default Theme",
      is_default: true,
      slots: {},
      audio_slots: {},
    };

    const sorted = sortThemesForDisplay([
      zebra,
      mid10,
      practice,
      alpha,
      def,
      mid2,
    ]);
    expect(sorted.map((t) => t.name)).toEqual([
      "Alpha Theme",
      "Default Theme",
      "Practice Theme",
      "Theme 2",
      "Theme 10",
      "Zebra Theme",
    ]);
  });

  it("should tie-break identical theme names by entity_id and handle empty names", () => {
    const tEmpty: Theme = {
      entity_id: "theme_empty",
      name: "",
      is_default: false,
      slots: {},
      audio_slots: {},
    };
    const tSame2: Theme = {
      entity_id: "theme_b",
      name: "Same Name",
      is_default: false,
      slots: {},
      audio_slots: {},
    };
    const tSame1: Theme = {
      entity_id: "theme_a",
      name: "Same Name",
      is_default: false,
      slots: {},
      audio_slots: {},
    };

    const sorted = sortThemesForDisplay([tSame2, tEmpty, tSame1]);
    expect(sorted[0].entity_id).toBe("theme_empty");
    expect(sorted[1].entity_id).toBe("theme_a");
    expect(sorted[2].entity_id).toBe("theme_b");
  });

  it("should apply theme slot update and append asset if new", () => {
    const theme: Theme = {
      entity_id: "t1",
      name: "Theme",
      is_default: false,
      slots: {},
      audio_slots: {},
    };
    const assets: any[] = [];
    const newAsset = { entityId: "flag_1", name: "Green Flag" };

    const res = applyThemeSlotUpdate(theme, "flags.green", newAsset, assets);
    expect(res.changed).toBeTrue();
    expect(theme.slots?.["flags.green"]).toBe("flag_1");
    expect(res.assets.length).toBe(1);
  });

  it("should apply audio config update on theme", () => {
    const theme: Theme = {
      entity_id: "t1",
      name: "Theme",
      is_default: false,
      slots: {},
      audio_slots: {},
    };
    applyAudioConfigUpdate(theme, "audio.yellowflag", "url", "audio_1");
    expect(theme.audio_slots?.["audio.yellowflag"]?.url).toBe("audio_1");
  });

  it("should remove deleted theme from undo manager history", () => {
    const t1: Theme = {
      entity_id: "theme_1",
      name: "Theme 1",
      is_default: false,
      slots: {},
      audio_slots: {},
    };
    const t2: Theme = {
      entity_id: "default_classic_rc_ai",
      name: "Classic",
      is_default: true,
      slots: {},
      audio_slots: {},
    };

    const undoManager = new UndoManager<any>(
      {
        clonner: (s) => JSON.parse(JSON.stringify(s)),
        equalizer: (a, b) => JSON.stringify(a) === JSON.stringify(b),
        applier: () => {},
      },
      () => ({ settings: { activeThemeId: "theme_1" }, themes: [t1, t2] }),
    );

    undoManager.initialize({
      settings: { activeThemeId: "theme_1" },
      themes: [t1, t2],
    });
    removeThemeFromUndoHistory(undoManager, "theme_1");

    const current = undoManager.getInitialState();
    expect(
      current.themes.some((t: any) => t.entity_id === "theme_1"),
    ).toBeFalse();
    expect(current.settings.activeThemeId).toBe("default_classic_rc_ai");
  });
});
