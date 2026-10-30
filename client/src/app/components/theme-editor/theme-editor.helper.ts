import {
  generateUniqueThemeName,
  getThemeDisplayNameKey,
  isThemeDefault,
} from "@app/components/ui-editor/ui-editor-crud.helper";
import { sortThemesForDisplay } from "@app/components/ui-editor/ui-editor-theme.helper";
import { Theme } from "@app/models/theme";
import { NavigationService } from "@app/services/navigation.service";
import { TranslationService } from "@app/services/translation.service";
import { deepCopy } from "@app/utils/clone.utils";
import { isEntityNameUnique, SelectItem } from "@app/utils/editor-utils";

export const THEME_LAST_EDITED_STORAGE_KEY = "theme_editor_last_edited_id";

export function cloneTheme(theme: Theme | null | undefined): Theme | null {
  return theme ? deepCopy(theme) : null;
}

export function areObjectsEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

export function areThemesEqual(
  a: Theme | null | undefined,
  b: Theme | null | undefined,
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  if (
    a.entity_id !== b.entity_id ||
    (a.name || "") !== (b.name || "") ||
    (a.is_default || false) !== (b.is_default || false) ||
    (a.uiId || "") !== (b.uiId || "") ||
    (a.driver_station_theme_id || "") !== (b.driver_station_theme_id || "") ||
    (a.driver_view_theme_id || "") !== (b.driver_view_theme_id || "")
  ) {
    return false;
  }
  if (!areObjectsEqual(a.slots || {}, b.slots || {})) return false;
  if (!areObjectsEqual(a.audio_slots || {}, b.audio_slots || {})) return false;
  if (
    !areObjectsEqual(
      a.driver_audio_overrides || {},
      b.driver_audio_overrides || {},
    )
  ) {
    return false;
  }
  return true;
}

export function buildThemeSelectItems(
  themes: Theme[],
  translationService?: TranslationService,
): SelectItem[] {
  const sorted = sortThemesForDisplay(themes || [], translationService);
  return sorted.map((t) => {
    const key = getThemeDisplayNameKey(t, translationService);
    const translated = translationService?.translate(key);
    return {
      id: t.entity_id,
      name: translated || t.name || "",
    };
  });
}

export function resolveInitialTheme(
  targetId: string | null | undefined,
  themes: Theme[],
  lastEditedId?: string | null,
): Theme | null {
  if (!themes || themes.length === 0) return null;
  if (targetId) {
    const found = themes.find((t) => t.entity_id === targetId);
    if (found) return found;
  }
  if (lastEditedId) {
    const found = themes.find((t) => t.entity_id === lastEditedId);
    if (found) return found;
  }
  const defaultTheme = themes.find((t) => isThemeDefault(t));
  return defaultTheme || themes[0];
}

export function getLastEditedThemeId(
  navigationService?: NavigationService | null,
): string | null {
  const navId = navigationService?.getLastEditedId?.("theme");
  if (navId) {
    return navId;
  }
  if (typeof localStorage !== "undefined") {
    try {
      return localStorage.getItem(THEME_LAST_EDITED_STORAGE_KEY) || null;
    } catch (_e) {
      // Ignore storage errors
    }
  }
  return null;
}

export function setLastEditedThemeId(
  id: string,
  navigationService?: NavigationService | null,
): void {
  navigationService?.setLastEditedId?.("theme", id);
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(THEME_LAST_EDITED_STORAGE_KEY, id);
    } catch (_e) {
      // Ignore storage errors
    }
  }
}

export function clearLastEditedThemeId(
  navigationService?: NavigationService | null,
): void {
  navigationService?.setLastEditedId?.("theme", "");
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(THEME_LAST_EDITED_STORAGE_KEY);
    } catch (_e) {
      // Ignore storage errors
    }
  }
}

export function isThemeNameUnique(
  name: string,
  currentId: string | undefined,
  allThemes: Theme[],
): boolean {
  return isEntityNameUnique(name, currentId, allThemes);
}

export function getThemeUnsavedReasons(
  editingTheme: Theme | null | undefined,
  originalTheme: Theme | null | undefined,
  allThemes: Theme[],
  translationService: TranslationService,
): string[] {
  if (!editingTheme) return [];
  if (!editingTheme.name || !editingTheme.name.trim()) {
    return [
      translationService.translate("THM_ERROR_NAME_INVALID") ||
        "Please enter a valid theme name.",
    ];
  }
  if (
    !isThemeNameUnique(editingTheme.name, originalTheme?.entity_id, allThemes)
  ) {
    return [
      translationService.translate("THM_ERROR_NAME_INVALID") ||
        "Theme name must be unique.",
    ];
  }
  if (!areThemesEqual(editingTheme, originalTheme)) {
    return [
      translationService.translate("GEN_CHANGES_DETECTED") || "Unsaved changes",
    ];
  }
  return [];
}

export function buildNewThemeTemplate(name: string, allThemes: Theme[]): Theme {
  const uniqueName = generateUniqueThemeName(name || "New Theme", allThemes);
  return {
    entity_id: `custom_theme_${Date.now()}`,
    name: uniqueName,
    is_default: false,
    slots: {},
    audio_slots: {},
    driver_audio_overrides: {},
  };
}

export function buildDuplicateThemeTemplate(
  theme: Theme,
  allThemes: Theme[],
): Theme {
  const copyName = `${theme.name || "Theme"} (Copy)`;
  const uniqueName = generateUniqueThemeName(copyName, allThemes);
  return {
    entity_id: `custom_theme_${Date.now()}`,
    name: uniqueName,
    is_default: false,
    uiId: theme.uiId,
    driver_station_theme_id: theme.driver_station_theme_id,
    driver_view_theme_id: theme.driver_view_theme_id,
    slots: deepCopy(theme.slots || {}),
    audio_slots: deepCopy(theme.audio_slots || {}),
    driver_audio_overrides: deepCopy(theme.driver_audio_overrides || {}),
  };
}
