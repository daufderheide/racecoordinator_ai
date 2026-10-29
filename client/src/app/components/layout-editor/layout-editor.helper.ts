import { BASE_AVAILABLE_COLUMNS } from "@app/components/ui-editor/ui-editor-constants";
import {
  generateUniqueCustomUiName,
  getCustomUiDisplayNameKey,
  isCustomUiDefault,
} from "@app/components/ui-editor/ui-editor-crud.helper";
import { getDefaultLayoutResetData } from "@app/components/ui-editor/ui-editor-io.helper";
import { CustomUI } from "@app/models/custom-ui";
import { Settings } from "@app/models/settings";
import { NavigationService } from "@app/services/navigation.service";
import { TranslationService } from "@app/services/translation.service";
import { deepCopy } from "@app/utils/clone.utils";
import { isEntityNameUnique, SelectItem } from "@app/utils/editor-utils";
import { naturalSortCompare } from "@app/utils/sorting.utils";

export const LAYOUT_AVAILABLE_COLUMNS: { key: string; label: string }[] = [
  ...BASE_AVAILABLE_COLUMNS,
];

export function createFallbackDefaultLayouts(
  racedayLayout?: any,
  practiceRacedayLayout?: any,
): CustomUI[] {
  const defaultSettings = new Settings();
  return [
    {
      entity_id: "default_ui_layout_rc_ai",
      name: "RaceCoordinator AI",
      is_default: true,
      layoutJson: JSON.stringify(racedayLayout || Settings.DEFAULT_LAYOUT),
      columnsJson: JSON.stringify(Settings.DEFAULT_COLUMNS),
      columnLayoutsJson: JSON.stringify(defaultSettings.columnLayouts),
      columnVisibilityJson: JSON.stringify(defaultSettings.columnVisibility),
      columnWidthsJson: JSON.stringify(defaultSettings.columnWidths),
      columnAnchorsJson: JSON.stringify(defaultSettings.columnAnchors),
    },
    {
      entity_id: "practice_ui_layout_rc_ai",
      name: "RaceCoordinator AI (Practice)",
      is_default: true,
      layoutJson: JSON.stringify(
        practiceRacedayLayout || Settings.DEFAULT_PRACTICE_LAYOUT,
      ),
      columnsJson: JSON.stringify(Settings.DEFAULT_PRACTICE_COLUMNS),
      columnLayoutsJson: JSON.stringify(defaultSettings.practiceColumnLayouts),
      columnVisibilityJson: JSON.stringify(
        defaultSettings.practiceColumnVisibility,
      ),
      columnWidthsJson: JSON.stringify(defaultSettings.practiceColumnWidths),
      columnAnchorsJson: JSON.stringify(defaultSettings.practiceColumnAnchors),
    },
    {
      entity_id: "driver_station_ui_layout_rc_ai",
      name: "Driver Station",
      is_default: true,
      layoutJson: JSON.stringify(Settings.DEFAULT_DRIVER_STATION_LAYOUT),
      columnsJson: JSON.stringify(Settings.DEFAULT_COLUMNS),
      columnLayoutsJson: JSON.stringify(defaultSettings.columnLayouts),
      columnVisibilityJson: JSON.stringify(defaultSettings.columnVisibility),
      columnWidthsJson: JSON.stringify(defaultSettings.columnWidths),
      columnAnchorsJson: JSON.stringify(defaultSettings.columnAnchors),
    },
  ];
}

export function syncLayoutSettingsWithDefaults(
  layouts: CustomUI[],
  racedayLayout?: any,
  practiceRacedayLayout?: any,
): void {
  const defaultSettings = new Settings();
  for (const ui of layouts) {
    const isPractice = ui.entity_id === "practice_ui_layout_rc_ai";
    if (!ui.columnLayoutsJson) {
      ui.columnLayoutsJson = JSON.stringify(
        isPractice
          ? defaultSettings.practiceColumnLayouts
          : defaultSettings.columnLayouts,
      );
    }
    if (!ui.columnVisibilityJson) {
      ui.columnVisibilityJson = JSON.stringify(
        isPractice
          ? defaultSettings.practiceColumnVisibility
          : defaultSettings.columnVisibility,
      );
    }
    if (!ui.columnWidthsJson) {
      ui.columnWidthsJson = JSON.stringify(
        isPractice
          ? defaultSettings.practiceColumnWidths
          : defaultSettings.columnWidths,
      );
    }
    if (!ui.columnAnchorsJson) {
      ui.columnAnchorsJson = JSON.stringify(
        isPractice
          ? defaultSettings.practiceColumnAnchors
          : defaultSettings.columnAnchors,
      );
    }
  }
  if (racedayLayout?.widgets?.length) {
    const defaultUi = layouts.find(
      (u) => u.entity_id === "default_ui_layout_rc_ai",
    );
    if (
      defaultUi &&
      (!defaultUi.layoutJson ||
        defaultUi.layoutJson === "{}" ||
        defaultUi.layoutJson === "[]" ||
        defaultUi.layoutJson === JSON.stringify(Settings.DEFAULT_LAYOUT))
    ) {
      defaultUi.layoutJson = JSON.stringify(racedayLayout);
    }
  }
  if (practiceRacedayLayout?.widgets?.length) {
    const practiceUi = layouts.find(
      (u) => u.entity_id === "practice_ui_layout_rc_ai",
    );
    if (
      practiceUi &&
      (!practiceUi.layoutJson ||
        practiceUi.layoutJson === "{}" ||
        practiceUi.layoutJson === "[]" ||
        practiceUi.layoutJson ===
          JSON.stringify(Settings.DEFAULT_PRACTICE_LAYOUT))
    ) {
      practiceUi.layoutJson = JSON.stringify(practiceRacedayLayout);
    }
  }
}

export function areLayoutsEqual(
  a: CustomUI | null | undefined,
  b: CustomUI | null | undefined,
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.entity_id === b.entity_id &&
    (a.name || "") === (b.name || "") &&
    (a.is_default || false) === (b.is_default || false) &&
    (a.layoutJson || "") === (b.layoutJson || "") &&
    (a.columnsJson || "") === (b.columnsJson || "") &&
    (a.columnLayoutsJson || "") === (b.columnLayoutsJson || "") &&
    (a.columnVisibilityJson || "") === (b.columnVisibilityJson || "") &&
    (a.columnWidthsJson || "") === (b.columnWidthsJson || "") &&
    (a.columnAnchorsJson || "") === (b.columnAnchorsJson || "")
  );
}

export function cloneLayout(ui: CustomUI): CustomUI {
  return deepCopy(ui);
}

export function isLayoutNameUnique(
  name: string | null | undefined,
  currentId: string | undefined,
  allLayouts: CustomUI[],
): boolean {
  return isEntityNameUnique(name, currentId, allLayouts);
}

export function getLayoutDisplayName(
  ui: CustomUI,
  translationService?: TranslationService,
): string {
  if (!ui) return "";
  const key = getCustomUiDisplayNameKey(ui, translationService);
  if (key && translationService) {
    const translated = translationService.translate(key);
    if (translated && translated !== key) {
      return translated;
    }
  }
  return ui.name || "";
}

export function buildLayoutSelectItems(
  layouts: CustomUI[] | null | undefined,
  translationService?: TranslationService,
): SelectItem[] {
  if (!layouts || layouts.length === 0) {
    return [];
  }
  return layouts
    .map((ui) => ({
      id: ui.entity_id,
      name: getLayoutDisplayName(ui, translationService),
    }))
    .sort((a, b) => naturalSortCompare(a.name, b.name));
}

export function buildNewLayoutTemplate(
  baseName: string,
  existingLayouts: CustomUI[],
): CustomUI {
  const newName = generateUniqueCustomUiName(baseName, existingLayouts);
  const resetData = getDefaultLayoutResetData(false);
  return {
    "@id": 1,
    entity_id: "new",
    name: newName,
    is_default: false,
    layoutJson: JSON.stringify(resetData.defaultLayout),
    columnsJson: JSON.stringify(resetData.columns),
    columnLayoutsJson: JSON.stringify(resetData.columnLayouts),
    columnVisibilityJson: JSON.stringify(resetData.columnVisibility),
    columnWidthsJson: JSON.stringify(resetData.columnWidths),
    columnAnchorsJson: JSON.stringify(resetData.columnAnchors),
  };
}

export function buildDuplicateLayoutTemplate(
  source: CustomUI,
  existingLayouts: CustomUI[],
): CustomUI {
  const baseName = `${source.name || "Layout"} Copy`;
  const newName = generateUniqueCustomUiName(baseName, existingLayouts);
  const cloned = cloneLayout(source);
  cloned.entity_id = "new";
  delete (cloned as any)._id;
  delete cloned["@id"];
  cloned.name = newName;
  cloned.is_default = false;
  return cloned;
}

export function getLayoutUnsavedReasons(
  editing: CustomUI | null,
  original: CustomUI | null,
  allLayouts: CustomUI[],
  translationService: TranslationService,
): string[] {
  if (!editing || !original) return [];
  const reasons: string[] = [];

  if (!editing.name || !editing.name.trim()) {
    reasons.push(
      translationService.translate("LE_ERROR_NAME_INVALID") ||
        "Layout name cannot be empty",
    );
  } else if (
    !isLayoutNameUnique(editing.name, original.entity_id, allLayouts)
  ) {
    reasons.push(
      translationService.translate("LE_ERROR_NAME_INVALID") ||
        "Layout name must be unique",
    );
  }

  if (editing.name !== original.name) {
    reasons.push(
      translationService.translate("LE_LAYOUT_NAME") || "Layout Name",
    );
  }

  if (
    editing.layoutJson !== original.layoutJson ||
    editing.columnsJson !== original.columnsJson ||
    editing.columnLayoutsJson !== original.columnLayoutsJson ||
    editing.columnVisibilityJson !== original.columnVisibilityJson ||
    editing.columnWidthsJson !== original.columnWidthsJson ||
    editing.columnAnchorsJson !== original.columnAnchorsJson
  ) {
    reasons.push(
      translationService.translate("UE_HEADER_CUSTOM_UI_LAYOUTS") ||
        "Widget Layout Configuration",
    );
  }

  return reasons;
}

export const LAYOUT_LAST_EDITED_STORAGE_KEY = "rc.last_edited_layout_id";

export function getLastEditedLayoutId(
  navigationService?: NavigationService | null,
): string | null {
  const navId = navigationService?.getLastEditedId?.("layout");
  if (navId) {
    return navId;
  }
  if (typeof localStorage !== "undefined") {
    try {
      return localStorage.getItem(LAYOUT_LAST_EDITED_STORAGE_KEY) || null;
    } catch (_e) {
      // Ignore storage errors
    }
  }
  return null;
}

export function setLastEditedLayoutId(
  id: string,
  navigationService?: NavigationService | null,
): void {
  if (!id) return;
  navigationService?.setLastEditedId?.("layout", id);
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(LAYOUT_LAST_EDITED_STORAGE_KEY, id);
    } catch (_e) {
      // Ignore storage errors
    }
  }
}

export function clearLastEditedLayoutId(
  navigationService?: NavigationService | null,
): void {
  navigationService?.clearLastEditedId?.("layout");
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(LAYOUT_LAST_EDITED_STORAGE_KEY);
    } catch (_e) {
      // Ignore storage errors
    }
  }
}

export function resolveInitialLayout(
  paramsId: string | null | undefined,
  allLayouts: CustomUI[],
  lastEditedId?: string | null,
): CustomUI | null {
  if (!allLayouts || allLayouts.length === 0) {
    return null;
  }
  if (paramsId) {
    const found = allLayouts.find((u) => u.entity_id === paramsId);
    if (found) {
      return found;
    }
  }
  if (lastEditedId) {
    const foundLast = allLayouts.find((u) => u.entity_id === lastEditedId);
    if (foundLast) {
      return foundLast;
    }
  }
  return allLayouts[0];
}

export { isCustomUiDefault };
