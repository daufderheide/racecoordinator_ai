import { CustomUI } from "@app/models/custom-ui";
import { Theme } from "@app/models/theme";
import { LoggerService } from "@app/services/logger.service";

const STORAGE_KEY = "ui_editor_expanders";

export function saveExpanderStateToStorage(
  sectionsExpanded: Record<string, boolean>,
  logger?: LoggerService,
): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sectionsExpanded));
  } catch (e) {
    logger?.error("Failed to save expander state to storage", e);
  }
}

export function loadExpanderStateFromStorage(
  currentExpanded: Record<string, boolean>,
): Record<string, boolean> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return {
        ...currentExpanded,
        ...JSON.parse(saved),
      };
    }
  } catch {
    // Ignore storage parse errors
  }
  return currentExpanded;
}

export function toggleThemeExpander(
  themeId: string,
  displayThemes: Theme[],
  sectionsExpanded: Record<string, boolean>,
  activate = false,
  activeThemeId?: string,
  onThemeSelected?: (themeId: string) => void,
): void {
  const key = `theme_${themeId}`;
  const wasExpanded = !!sectionsExpanded[key];

  displayThemes.forEach(
    (t) => (sectionsExpanded[`theme_${t.entity_id}`] = false),
  );

  if (!wasExpanded) {
    sectionsExpanded[key] = true;
    if (activate && activeThemeId !== themeId && onThemeSelected) {
      onThemeSelected(themeId);
    }
  }
  saveExpanderStateToStorage(sectionsExpanded);
}

export function toggleUiExpander(
  uiId: string,
  displayCustomUIs: CustomUI[],
  sectionsExpanded: Record<string, boolean>,
  onUiSelected?: (uiId: string) => void,
): void {
  const key = `ui_${uiId}`;
  const wasExpanded = !!sectionsExpanded[key];

  displayCustomUIs.forEach(
    (u) => (sectionsExpanded[`ui_${u.entity_id}`] = false),
  );

  if (!wasExpanded) {
    sectionsExpanded[key] = true;
    if (onUiSelected) {
      onUiSelected(uiId);
    }
  }
  saveExpanderStateToStorage(sectionsExpanded);
}
