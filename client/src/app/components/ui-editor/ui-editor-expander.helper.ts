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

export function scrollToUiElement(uiId: string, cdr?: any, delay = 0): void {
  cdr?.detectChanges();
  setTimeout(() => {
    const container = document.querySelector(
      ".sections-wrapper",
    ) as HTMLElement;
    const element = document.querySelector(
      `[data-ui-id="${uiId}"]`,
    ) as HTMLElement;
    if (element && container) {
      const topPos =
        element.getBoundingClientRect().top -
        container.getBoundingClientRect().top +
        container.scrollTop;

      container.scrollTo({
        top: Math.max(0, topPos - 15),
        behavior: "smooth",
      });
    } else if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, delay);
}

export function scrollToThemeElement(themeId: string, cdr?: any): void {
  cdr?.detectChanges();
  setTimeout(() => {
    const container = document.querySelector(
      ".sections-wrapper",
    ) as HTMLElement;
    const element = document.querySelector(
      `[data-theme-id="${themeId}"]`,
    ) as HTMLElement;
    if (element && container) {
      const topPos =
        element.getBoundingClientRect().top -
        container.getBoundingClientRect().top +
        container.scrollTop;

      container.scrollTo({
        top: Math.max(0, topPos - 15),
        behavior: "smooth",
      });
    } else if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
}

/**
 * Sets initial expander states when navigating into the UI Editor,
 * expanding the target layout and theme (e.g. from the current race),
 * collapsing non-target themes and layouts, and saving state.
 */
export function applyInitialExpanderState(
  sectionsExpanded: Record<string, boolean>,
  displayThemes: Theme[],
  displayCustomUIs: CustomUI[],
  targetThemeId?: string | null,
  targetUiId?: string | null,
): { newActiveUiId?: string } {
  if (!targetThemeId && !targetUiId) {
    return {};
  }

  let matchedTheme: Theme | undefined;
  if (targetThemeId) {
    matchedTheme = displayThemes.find(
      (t) => (t.entity_id || (t as any).id || (t as any)._id) === targetThemeId,
    );
  } else if (targetUiId) {
    matchedTheme = displayThemes.find((t) => t.uiId === targetUiId);
  }

  const resolvedThemeId = targetThemeId || matchedTheme?.entity_id;
  let resolvedUiId = targetUiId;
  if (!resolvedUiId && matchedTheme?.uiId) {
    resolvedUiId = matchedTheme.uiId;
  }
  if (!resolvedUiId) {
    resolvedUiId = "default_ui_layout_rc_ai";
  }

  if (resolvedThemeId) {
    sectionsExpanded["themes"] = true;
    displayThemes.forEach((t) => {
      sectionsExpanded[`theme_${t.entity_id}`] =
        t.entity_id === resolvedThemeId;
    });
  }

  let newActiveUiId: string | undefined;
  if (resolvedUiId) {
    sectionsExpanded["customUIs"] = true;
    displayCustomUIs.forEach((u) => {
      sectionsExpanded[`ui_${u.entity_id}`] = u.entity_id === resolvedUiId;
    });
    newActiveUiId = resolvedUiId;
  }

  saveExpanderStateToStorage(sectionsExpanded);
  return { newActiveUiId };
}
