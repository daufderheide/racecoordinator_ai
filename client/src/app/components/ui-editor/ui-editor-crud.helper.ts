import { CustomUI } from "@app/models/custom-ui";
import { Theme } from "@app/models/theme";
import { TranslationService } from "@app/services/translation.service";

export const DEFAULT_RACEDAY_UI_NAMES = new Set([
  "",
  "default",
  "default ui",
  "racecoordinator ai",
  "racecoordinator ai (default)",
  "default ui layout",
  "raceday ui layout",
]);

export const DEFAULT_PRACTICE_UI_NAMES = new Set([
  "",
  "practice",
  "practice ui",
  "racecoordinator ai (practice)",
  "default practice ui layout",
  "practice ui layout",
]);

export const DEFAULT_FUEL_UI_NAMES = new Set([
  "",
  "fuel",
  "fuel ui",
  "racecoordinator ai (fuel)",
  "default fuel ui layout",
  "fuel ui layout",
]);

export const DEFAULT_THEME_NAMES = new Set([
  "",
  "default",
  "racecoordinator ai",
  "racecoordinator ai (default)",
  "classic",
  "classic theme",
  "default theme",
]);

export const DEFAULT_PRACTICE_THEME_NAMES = new Set([
  "",
  "racecoordinator ai (practice)",
  "practice",
  "practice theme",
]);

export const DEFAULT_FUEL_THEME_NAMES = new Set([
  "",
  "racecoordinator ai (fuel)",
  "fuel",
  "fuel theme",
]);

export function isLegacyRacedayUiName(name?: string): boolean {
  return DEFAULT_RACEDAY_UI_NAMES.has((name || "").trim().toLowerCase());
}

export function isLegacyPracticeUiName(name?: string): boolean {
  return DEFAULT_PRACTICE_UI_NAMES.has((name || "").trim().toLowerCase());
}

export function isLegacyFuelUiName(name?: string): boolean {
  return DEFAULT_FUEL_UI_NAMES.has((name || "").trim().toLowerCase());
}

export function isLegacyDefaultThemeName(name?: string): boolean {
  return DEFAULT_THEME_NAMES.has((name || "").trim().toLowerCase());
}

export function isLegacyPracticeThemeName(name?: string): boolean {
  return DEFAULT_PRACTICE_THEME_NAMES.has((name || "").trim().toLowerCase());
}

export function isLegacyFuelThemeName(name?: string): boolean {
  return DEFAULT_FUEL_THEME_NAMES.has((name || "").trim().toLowerCase());
}

export function getCustomUiDisplayNameKey(
  ui: CustomUI,
  translationService?: TranslationService,
): string {
  const nameNorm = (ui.name || "").trim().toLowerCase();
  if (ui.entity_id === "default_ui_layout_rc_ai") {
    const translated = translationService
      ?.translate("UE_LABEL_DEFAULT_RACEDAY_UI")
      ?.trim()
      .toLowerCase();
    if (
      DEFAULT_RACEDAY_UI_NAMES.has(nameNorm) ||
      (translated && nameNorm === translated)
    ) {
      return "UE_LABEL_DEFAULT_RACEDAY_UI";
    }
    return ui.name;
  }
  if (ui.entity_id === "practice_ui_layout_rc_ai") {
    const translated = translationService
      ?.translate("UE_LABEL_DEFAULT_PRACTICE_UI")
      ?.trim()
      .toLowerCase();
    if (
      DEFAULT_PRACTICE_UI_NAMES.has(nameNorm) ||
      (translated && nameNorm === translated)
    ) {
      return "UE_LABEL_DEFAULT_PRACTICE_UI";
    }
    return ui.name;
  }
  if (ui.entity_id === "default_fuel_ui_layout_rc_ai") {
    const translated = translationService
      ?.translate("UE_LABEL_DEFAULT_FUEL_UI")
      ?.trim()
      .toLowerCase();
    if (
      DEFAULT_FUEL_UI_NAMES.has(nameNorm) ||
      (translated && nameNorm === translated)
    ) {
      return "UE_LABEL_DEFAULT_FUEL_UI";
    }
    return ui.name;
  }
  return ui.name || "UE_LABEL_DEFAULT_UI";
}

export function isCustomUiDefault(ui: CustomUI): boolean {
  return (
    ui.is_default ||
    ui.entity_id === "default_ui_layout_rc_ai" ||
    ui.entity_id === "practice_ui_layout_rc_ai" ||
    ui.entity_id === "default_fuel_ui_layout_rc_ai"
  );
}

export function isCustomUiNameInvalid(
  ui: CustomUI,
  allUis: CustomUI[],
): boolean {
  if (!ui.name || !ui.name.trim()) return true;
  const trimmed = ui.name.trim().toLowerCase();
  return allUis.some(
    (other) =>
      other.entity_id !== ui.entity_id &&
      other.name?.trim().toLowerCase() === trimmed,
  );
}

export function getThemeDisplayNameKey(
  theme: Theme,
  translationService?: TranslationService,
): string {
  const nameNorm = (theme.name || "").trim().toLowerCase();
  if (theme.entity_id === "practice_theme_rc_ai") {
    const translated = translationService
      ?.translate("UE_LABEL_PRACTICE_THEME")
      ?.trim()
      .toLowerCase();
    if (
      DEFAULT_PRACTICE_THEME_NAMES.has(nameNorm) ||
      (translated && nameNorm === translated)
    ) {
      return "UE_LABEL_PRACTICE_THEME";
    }
    return theme.name;
  }
  if (theme.entity_id === "default_fuel_theme_rc_ai") {
    const translated = translationService
      ?.translate("UE_LABEL_FUEL_THEME")
      ?.trim()
      .toLowerCase();
    if (
      DEFAULT_FUEL_THEME_NAMES.has(nameNorm) ||
      (translated && nameNorm === translated)
    ) {
      return "UE_LABEL_FUEL_THEME";
    }
    return theme.name;
  }
  if (theme.is_default || theme.entity_id === "default_classic_rc_ai") {
    const translated = translationService
      ?.translate("UE_LABEL_DEFAULT_THEME")
      ?.trim()
      .toLowerCase();
    if (
      DEFAULT_THEME_NAMES.has(nameNorm) ||
      (translated && nameNorm === translated)
    ) {
      return "UE_LABEL_DEFAULT_THEME";
    }
    return theme.name;
  }
  return theme.name;
}

export function isThemeDefault(theme: Theme): boolean {
  return (
    theme.is_default ||
    theme.entity_id === "default_classic_rc_ai" ||
    theme.entity_id === "practice_theme_rc_ai" ||
    theme.entity_id === "default_fuel_theme_rc_ai"
  );
}

export function isThemeNameDuplicate(
  theme: Theme,
  allThemes: Theme[],
): boolean {
  if (!theme.name) return false;
  const name = theme.name.trim().toLowerCase();
  return allThemes.some(
    (t) =>
      t.entity_id !== theme.entity_id &&
      (t.name || "").trim().toLowerCase() === name,
  );
}

export function isThemeNameInvalid(theme: Theme, allThemes: Theme[]): boolean {
  if (!theme.name?.trim()) return true;
  return isThemeNameDuplicate(theme, allThemes);
}

export function buildDuplicateEntityName(
  currentName: string,
  isDefault: boolean,
  defaultKey: string,
  translationService: TranslationService,
): string {
  const baseName = isDefault
    ? translationService.translate(defaultKey)
    : currentName;
  const copySuffix = translationService.translate("UE_LABEL_COPY_SUFFIX");
  return baseName + copySuffix;
}
