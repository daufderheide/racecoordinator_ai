import { Theme } from "@app/models/theme";
import { NavigationService } from "@app/services/navigation.service";
import { TranslationService } from "@app/services/translation.service";

import {
  areThemesEqual,
  buildDuplicateThemeTemplate,
  buildNewThemeTemplate,
  buildThemeSelectItems,
  clearLastEditedThemeId,
  cloneTheme,
  getLastEditedThemeId,
  getThemeUnsavedReasons,
  isThemeNameUnique,
  resolveInitialTheme,
  setLastEditedThemeId,
  THEME_LAST_EDITED_STORAGE_KEY,
} from "./theme-editor.helper";

function makeTheme(partial: Partial<Theme>): Theme {
  return {
    entity_id: "t_test",
    name: "Test Theme",
    is_default: false,
    slots: {},
    audio_slots: {},
    ...partial,
  };
}

describe("theme-editor.helper", () => {
  let mockTranslationService: jasmine.SpyObj<TranslationService>;

  beforeEach(() => {
    mockTranslationService = jasmine.createSpyObj<TranslationService>(
      "TranslationService",
      ["translate"],
    );
    mockTranslationService.translate.and.callFake((key: string) => {
      if (key === "THM_TITLE") return "Themes";
      if (key === "THM_ERROR_NAME_INVALID") return "Theme name is invalid";
      if (key === "GEN_CHANGES_DETECTED") return "Unsaved changes";
      if (key === "UE_LABEL_DEFAULT_THEME") return "Classic";
      return key;
    });
    localStorage.removeItem(THEME_LAST_EDITED_STORAGE_KEY);
  });

  afterEach(() => {
    localStorage.removeItem(THEME_LAST_EDITED_STORAGE_KEY);
  });

  describe("cloneTheme", () => {
    it("should return null for null or undefined", () => {
      expect(cloneTheme(null)).toBeNull();
      expect(cloneTheme(undefined)).toBeNull();
    });

    it("should create an independent deep copy of a theme", () => {
      const theme: Theme = makeTheme({
        entity_id: "t1",
        name: "Theme 1",
        is_default: false,
        slots: { "flag.racing": "a1" },
        audio_slots: { yellowflag: { type: "preset" } },
        driver_audio_overrides: { d1: { type: "tts", text: "hello" } },
      });
      const copy = cloneTheme(theme);
      expect(copy).toEqual(theme);
      expect(copy).not.toBe(theme);
      if (copy) {
        copy.name = "Theme 1 Changed";
        copy.slots["flag.racing"] = "a2";
      }
      expect(theme.name).toBe("Theme 1");
      expect(theme.slots["flag.racing"]).toBe("a1");
    });
  });

  describe("areThemesEqual", () => {
    it("should return true for identical references and deep matches", () => {
      const t1: Theme = makeTheme({
        entity_id: "t1",
        name: "Theme 1",
        is_default: false,
        slots: { "flag.racing": "a1" },
        audio_slots: { yellowflag: { type: "preset" } },
      });
      expect(areThemesEqual(t1, t1)).toBeTrue();
      expect(areThemesEqual(t1, cloneTheme(t1))).toBeTrue();
      expect(areThemesEqual(null, null)).toBeTrue();
    });

    it("should return false if either theme is null or undefined", () => {
      const t1: Theme = makeTheme({ entity_id: "t1", name: "Theme 1" });
      expect(areThemesEqual(t1, null)).toBeFalse();
      expect(areThemesEqual(null, t1)).toBeFalse();
      expect(areThemesEqual(t1, undefined)).toBeFalse();
    });

    it("should return false if basic properties differ", () => {
      const t1: Theme = makeTheme({
        entity_id: "t1",
        name: "Theme 1",
        is_default: false,
        uiId: "ui1",
        driver_station_theme_id: "ds1",
        driver_view_theme_id: "dv1",
      });

      expect(areThemesEqual(t1, { ...t1, entity_id: "t2" })).toBeFalse();
      expect(areThemesEqual(t1, { ...t1, name: "Theme 2" })).toBeFalse();
      expect(areThemesEqual(t1, { ...t1, is_default: true })).toBeFalse();
      expect(areThemesEqual(t1, { ...t1, uiId: "ui2" })).toBeFalse();
      expect(
        areThemesEqual(t1, { ...t1, driver_station_theme_id: "ds2" }),
      ).toBeFalse();
      expect(
        areThemesEqual(t1, { ...t1, driver_view_theme_id: "dv2" }),
      ).toBeFalse();
    });

    it("should return false if slots differ", () => {
      const t1: Theme = makeTheme({
        entity_id: "t1",
        name: "Theme 1",
        slots: { "flag.racing": "a1" },
      });
      expect(
        areThemesEqual(t1, { ...t1, slots: { "flag.racing": "a2" } }),
      ).toBeFalse();
      expect(
        areThemesEqual(t1, {
          ...t1,
          slots: { "flag.racing": "a1", extra: "x" },
        }),
      ).toBeFalse();
    });

    it("should return false if audio_slots differ", () => {
      const t1: Theme = makeTheme({
        entity_id: "t1",
        name: "Theme 1",
        audio_slots: { yellowflag: { type: "preset" } },
      });
      expect(
        areThemesEqual(t1, {
          ...t1,
          audio_slots: { yellowflag: { type: "tts", text: "Caution" } },
        }),
      ).toBeFalse();
    });

    it("should return false if driver_audio_overrides differ", () => {
      const t1: Theme = makeTheme({
        entity_id: "t1",
        name: "Theme 1",
        driver_audio_overrides: { d1: { type: "preset" } },
      });
      expect(
        areThemesEqual(t1, {
          ...t1,
          driver_audio_overrides: {
            d1: { type: "tts" },
          },
        }),
      ).toBeFalse();
    });
  });

  describe("buildThemeSelectItems", () => {
    it("should map themes to select items sorted with default first", () => {
      const themes: Theme[] = [
        makeTheme({ entity_id: "t2", name: "Custom Z", is_default: false }),
        makeTheme({ entity_id: "t1", name: "Classic", is_default: true }),
        makeTheme({ entity_id: "t3", name: "Custom A", is_default: false }),
      ];
      const items = buildThemeSelectItems(themes, mockTranslationService);
      expect(items.length).toBe(3);
      expect(items[0].id).toBe("t1");
      expect(items[1].id).toBe("t3");
      expect(items[2].id).toBe("t2");
    });
  });

  describe("resolveInitialTheme", () => {
    const themes: Theme[] = [
      makeTheme({ entity_id: "t1", name: "Classic", is_default: true }),
      makeTheme({ entity_id: "t2", name: "Modern", is_default: false }),
      makeTheme({ entity_id: "t3", name: "Retro", is_default: false }),
    ];

    it("should return null for empty theme array", () => {
      expect(resolveInitialTheme("t1", [])).toBeNull();
    });

    it("should resolve targetId if found", () => {
      const resolved = resolveInitialTheme("t2", themes);
      expect(resolved?.entity_id).toBe("t2");
    });

    it("should fall back to lastEditedId if targetId not found", () => {
      const resolved = resolveInitialTheme("invalid", themes, "t3");
      expect(resolved?.entity_id).toBe("t3");
    });

    it("should fall back to default theme if neither targetId nor lastEditedId is found", () => {
      const resolved = resolveInitialTheme("invalid", themes, "also_invalid");
      expect(resolved?.entity_id).toBe("t1");
    });

    it("should fall back to first theme if no default theme exists", () => {
      const noDefaultThemes: Theme[] = [
        makeTheme({ entity_id: "t2", name: "Modern", is_default: false }),
        makeTheme({ entity_id: "t3", name: "Retro", is_default: false }),
      ];
      const resolved = resolveInitialTheme(null, noDefaultThemes);
      expect(resolved?.entity_id).toBe("t2");
    });
  });

  describe("Last edited theme ID persistence", () => {
    it("should persist and retrieve last edited theme ID via NavigationService and localStorage", () => {
      const mockNavService = jasmine.createSpyObj<NavigationService>(
        "NavigationService",
        ["getLastEditedId", "setLastEditedId"],
      );
      mockNavService.getLastEditedId.and.returnValue("nav_t2");

      expect(getLastEditedThemeId(mockNavService)).toBe("nav_t2");

      mockNavService.getLastEditedId.and.returnValue(null);
      localStorage.setItem(THEME_LAST_EDITED_STORAGE_KEY, "storage_t3");
      expect(getLastEditedThemeId(mockNavService)).toBe("storage_t3");

      setLastEditedThemeId("t4", mockNavService);
      expect(mockNavService.setLastEditedId).toHaveBeenCalledWith(
        "theme",
        "t4",
      );
      expect(localStorage.getItem(THEME_LAST_EDITED_STORAGE_KEY)).toBe("t4");

      clearLastEditedThemeId(mockNavService);
      expect(mockNavService.setLastEditedId).toHaveBeenCalledWith("theme", "");
      expect(localStorage.getItem(THEME_LAST_EDITED_STORAGE_KEY)).toBeNull();
    });
  });

  describe("isThemeNameUnique", () => {
    const allThemes: Theme[] = [
      makeTheme({ entity_id: "t1", name: "Classic", is_default: true }),
      makeTheme({ entity_id: "t2", name: "Modern", is_default: false }),
    ];

    it("should return true for unused name", () => {
      expect(isThemeNameUnique("Retro", undefined, allThemes)).toBeTrue();
    });

    it("should return true when keeping own existing name", () => {
      expect(isThemeNameUnique("Classic", "t1", allThemes)).toBeTrue();
      expect(isThemeNameUnique("classic", "t1", allThemes)).toBeTrue();
    });

    it("should return false for duplicate name case-insensitively", () => {
      expect(isThemeNameUnique("Modern", "t1", allThemes)).toBeFalse();
      expect(isThemeNameUnique("modern", "t1", allThemes)).toBeFalse();
      expect(isThemeNameUnique("classic", undefined, allThemes)).toBeFalse();
    });
  });

  describe("getThemeUnsavedReasons", () => {
    const allThemes: Theme[] = [
      makeTheme({ entity_id: "t1", name: "Classic", is_default: true }),
      makeTheme({ entity_id: "t2", name: "Modern", is_default: false }),
    ];

    it("should return empty array if no editing theme or no changes", () => {
      expect(
        getThemeUnsavedReasons(null, null, allThemes, mockTranslationService),
      ).toEqual([]);
      const t1 = allThemes[0];
      expect(
        getThemeUnsavedReasons(t1, t1, allThemes, mockTranslationService),
      ).toEqual([]);
    });

    it("should report invalid name if empty or duplicate", () => {
      const emptyNameTheme: Theme = { ...allThemes[1], name: "   " };
      const reasonsEmpty = getThemeUnsavedReasons(
        emptyNameTheme,
        allThemes[1],
        allThemes,
        mockTranslationService,
      );
      expect(reasonsEmpty.length).toBe(1);

      const duplicateTheme: Theme = { ...allThemes[1], name: "Classic" };
      const reasonsDup = getThemeUnsavedReasons(
        duplicateTheme,
        allThemes[1],
        allThemes,
        mockTranslationService,
      );
      expect(reasonsDup.length).toBe(1);
    });

    it("should report unsaved changes when themes differ", () => {
      const changedTheme: Theme = {
        ...allThemes[1],
        slots: { "flag.racing": "new_asset" },
      };
      const reasons = getThemeUnsavedReasons(
        changedTheme,
        allThemes[1],
        allThemes,
        mockTranslationService,
      );
      expect(reasons).toEqual(["Unsaved changes"]);
    });
  });

  describe("Theme template builders", () => {
    const allThemes: Theme[] = [
      makeTheme({ entity_id: "t1", name: "Classic", is_default: true }),
      makeTheme({ entity_id: "t2", name: "New Theme", is_default: false }),
    ];

    it("buildNewThemeTemplate should create unique non-default theme template", () => {
      const newTheme = buildNewThemeTemplate("New Theme", allThemes);
      expect(newTheme.entity_id).toContain("custom_theme_");
      expect(newTheme.is_default).toBeFalse();
      expect(newTheme.name).not.toBe("New Theme"); // Should be unique (e.g. "New Theme 1")
      expect(newTheme.slots).toEqual({});
      expect(newTheme.audio_slots).toEqual({});
    });

    it("buildDuplicateThemeTemplate should copy properties and slots with unique name", () => {
      const source: Theme = makeTheme({
        entity_id: "t1",
        name: "Classic",
        is_default: true,
        uiId: "ui_default",
        driver_station_theme_id: "ds1",
        driver_view_theme_id: "dv1",
        slots: { "flag.racing": "flag1" },
        audio_slots: { yellowflag: { type: "preset" } },
        driver_audio_overrides: { d1: { type: "preset" } },
      });
      const dup = buildDuplicateThemeTemplate(source, allThemes);
      expect(dup.entity_id).toContain("custom_theme_");
      expect(dup.is_default).toBeFalse();
      expect(dup.name).toBe("Classic (Copy)");
      expect(dup.uiId).toBe("ui_default");
      expect(dup.driver_station_theme_id).toBe("ds1");
      expect(dup.driver_view_theme_id).toBe("dv1");
      expect(dup.slots).toEqual({ "flag.racing": "flag1" });
      expect(dup.slots).not.toBe(source.slots);
      expect(dup.audio_slots).toEqual({ yellowflag: { type: "preset" } });
      expect(dup.audio_slots).not.toBe(source.audio_slots);
    });
  });
});
