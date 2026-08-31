import { CustomUI } from "@app/models/custom-ui";
import { Settings } from "@app/models/settings";

import {
  getDefaultLayoutResetData,
  parseLayoutImport,
} from "./ui-editor-io.helper";

export function applyResetLayout(
  ui: CustomUI,
  editingSettings: Settings,
  windowWidth?: number,
  windowHeight?: number,
): void {
  const isPractice = ui.entity_id === "practice_ui_layout_rc_ai";
  const data = getDefaultLayoutResetData(isPractice, windowWidth, windowHeight);

  ui.layoutJson = JSON.stringify(data.defaultLayout);
  ui.columnsJson = JSON.stringify(data.columns);
  ui.columnLayoutsJson = JSON.stringify(data.columnLayouts);
  ui.columnVisibilityJson = JSON.stringify(data.columnVisibility);
  ui.columnWidthsJson = JSON.stringify(data.columnWidths);
  ui.columnAnchorsJson = JSON.stringify(data.columnAnchors);

  if (ui.entity_id === "default_ui_layout_rc_ai" && editingSettings) {
    editingSettings.racedayLayout = data.defaultLayout;
    editingSettings.racedayColumns = data.columns;
    editingSettings.columnLayouts = data.columnLayouts;
    editingSettings.columnVisibility = data.columnVisibility;
    editingSettings.columnWidths = data.columnWidths;
    editingSettings.columnAnchors = data.columnAnchors;
  } else if (ui.entity_id === "practice_ui_layout_rc_ai" && editingSettings) {
    editingSettings.practiceRacedayLayout = data.defaultLayout;
    editingSettings.practiceRacedayColumns = data.columns;
    editingSettings.practiceColumnLayouts = data.columnLayouts;
    editingSettings.practiceColumnVisibility = data.columnVisibility;
    editingSettings.practiceColumnWidths = data.columnWidths;
    editingSettings.practiceColumnAnchors = data.columnAnchors;
  }
}

export function applyImportLayout(
  rawJson: string,
  ui: CustomUI,
  editingSettings: Settings,
): boolean {
  const isPractice = ui.entity_id === "practice_ui_layout_rc_ai";
  const parsed = parseLayoutImport(rawJson, isPractice);
  if (!parsed) return false;

  ui.layoutJson = JSON.stringify(parsed.layout);
  ui.columnsJson = JSON.stringify(parsed.columns);
  ui.columnLayoutsJson = JSON.stringify(parsed.columnLayouts);
  ui.columnVisibilityJson = JSON.stringify(parsed.columnVisibility);
  ui.columnAnchorsJson = JSON.stringify(parsed.columnAnchors);
  ui.columnWidthsJson = JSON.stringify(parsed.columnWidths);

  if (ui.entity_id === "default_ui_layout_rc_ai" && editingSettings) {
    editingSettings.racedayLayout = parsed.layout;
    editingSettings.racedayColumns = parsed.columns;
    editingSettings.columnLayouts = parsed.columnLayouts;
    editingSettings.columnVisibility = parsed.columnVisibility;
    editingSettings.columnAnchors = parsed.columnAnchors;
    editingSettings.columnWidths = parsed.columnWidths;
  } else if (ui.entity_id === "practice_ui_layout_rc_ai" && editingSettings) {
    editingSettings.practiceRacedayLayout = parsed.layout;
    editingSettings.practiceRacedayColumns = parsed.columns;
    editingSettings.practiceColumnLayouts = parsed.columnLayouts;
    editingSettings.practiceColumnVisibility = parsed.columnVisibility;
    editingSettings.practiceColumnAnchors = parsed.columnAnchors;
    editingSettings.practiceColumnWidths = parsed.columnWidths;
  }
  return true;
}

export function executeResetLayout(
  ui: CustomUI,
  editingSettings: Settings,
): void {
  applyResetLayout(ui, editingSettings);
}

export function executeExportLayout(
  ui: CustomUI,
  editingSettings: Settings,
): void {
  const { layoutExport, fileName } = (
    require("./ui-editor-io.helper") as typeof import("./ui-editor-io.helper")
  ).buildLayoutExport(ui, editingSettings);
  (
    require("./ui-editor-io.helper") as typeof import("./ui-editor-io.helper")
  ).downloadJsonFile(layoutExport, fileName);
}

export function executeImportLayout(
  event: Event,
  ui: CustomUI,
  editingSettings: Settings,
  logger: any,
  onSuccess: () => void,
): void {
  const input = event?.target as HTMLInputElement;
  if (!input?.files || input.files.length === 0) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      if (applyImportLayout(e.target?.result as string, ui, editingSettings)) {
        onSuccess();
      }
    } catch (err) {
      logger.error("Failed to parse layout file", err);
    }
  };
  reader.readAsText(input.files[0]);
  input.value = "";
}

export function resolveTargetCustomUi(
  kind: "practice" | "raceday" | "current" | undefined,
  activeCustomUiId: string,
  displayCustomUIs: CustomUI[],
  isCurrentLayoutPractice: boolean,
): CustomUI | undefined {
  if (kind === "practice" || (kind === "current" && isCurrentLayoutPractice)) {
    return displayCustomUIs.find(
      (x) => x.entity_id === "practice_ui_layout_rc_ai",
    );
  }
  if (
    kind === "raceday" ||
    (kind === "current" && activeCustomUiId === "default_ui_layout_rc_ai")
  ) {
    return displayCustomUIs.find(
      (x) => x.entity_id === "default_ui_layout_rc_ai",
    );
  }
  return (
    displayCustomUIs.find((u) => u.entity_id === activeCustomUiId) ||
    displayCustomUIs[0]
  );
}
