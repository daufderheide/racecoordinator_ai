import { CustomUI } from "@app/models/custom-ui";
import { LayoutConfig, Settings } from "@app/models/settings";

import { computeScaledLayout } from "./ui-editor-resolution.helper";

export function downloadJsonFile(data: any, filename: string): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export function buildLayoutExport(
  ui: CustomUI,
  fallbackSettings?: Settings,
): {
  layoutExport: any;
  fileName: string;
} {
  const isPractice = ui.entity_id === "practice_ui_layout_rc_ai";
  let layout: any = undefined;
  if (ui.layoutJson) {
    try {
      layout = JSON.parse(ui.layoutJson);
    } catch {
      // ignore
    }
  }
  if (!layout) {
    layout = isPractice
      ? fallbackSettings?.practiceRacedayLayout ||
        Settings.DEFAULT_PRACTICE_LAYOUT
      : fallbackSettings?.racedayLayout || Settings.DEFAULT_LAYOUT;
  }

  const columns = ui.columnsJson
    ? JSON.parse(ui.columnsJson)
    : isPractice
      ? fallbackSettings?.practiceRacedayColumns ||
        Settings.DEFAULT_PRACTICE_COLUMNS
      : fallbackSettings?.racedayColumns || Settings.DEFAULT_COLUMNS;
  const columnLayouts = ui.columnLayoutsJson
    ? JSON.parse(ui.columnLayoutsJson)
    : isPractice
      ? fallbackSettings?.practiceColumnLayouts || {}
      : fallbackSettings?.columnLayouts || {};
  const columnVisibility = ui.columnVisibilityJson
    ? JSON.parse(ui.columnVisibilityJson)
    : isPractice
      ? fallbackSettings?.practiceColumnVisibility || {}
      : fallbackSettings?.columnVisibility || {};
  const columnAnchors = ui.columnAnchorsJson
    ? JSON.parse(ui.columnAnchorsJson)
    : isPractice
      ? fallbackSettings?.practiceColumnAnchors || {}
      : fallbackSettings?.columnAnchors || {};
  const columnWidths = ui.columnWidthsJson
    ? JSON.parse(ui.columnWidthsJson)
    : isPractice
      ? fallbackSettings?.practiceColumnWidths || {}
      : fallbackSettings?.columnWidths || {};

  const layoutExport = {
    layout,
    columns,
    columnLayouts,
    columnVisibility,
    columnAnchors,
    columnWidths,
  };

  const fileName =
    ui.entity_id === "practice_ui_layout_rc_ai"
      ? "practice-raceday-layout.json"
      : ui.entity_id === "default_ui_layout_rc_ai"
        ? "raceday-layout.json"
        : `${(ui.name || "layout").toLowerCase().replace(/[^a-z0-9_-]+/g, "-")}-layout.json`;

  return { layoutExport, fileName };
}

export function parseLayoutImport(
  jsonContent: string,
  isPractice: boolean,
): {
  layout: LayoutConfig;
  columns: string[];
  columnLayouts: any;
  columnVisibility: any;
  columnAnchors: any;
  columnWidths: any;
} | null {
  try {
    const layoutData = JSON.parse(jsonContent);
    const layout =
      layoutData.layout ||
      layoutData.racedayLayout ||
      layoutData.practiceRacedayLayout ||
      (layoutData.widgets ? layoutData : null);

    if (!layout) return null;

    const columns =
      layoutData.columns ||
      layoutData.racedayColumns ||
      layoutData.practiceRacedayColumns ||
      (isPractice
        ? Settings.DEFAULT_PRACTICE_COLUMNS
        : Settings.DEFAULT_COLUMNS);

    const columnLayouts =
      layoutData.columnLayouts || layoutData.practiceColumnLayouts || {};
    const columnVisibility =
      layoutData.columnVisibility || layoutData.practiceColumnVisibility || {};
    const columnAnchors =
      layoutData.columnAnchors || layoutData.practiceColumnAnchors || {};
    const columnWidths =
      layoutData.columnWidths || layoutData.practiceColumnWidths || {};

    return {
      layout,
      columns,
      columnLayouts,
      columnVisibility,
      columnAnchors,
      columnWidths,
    };
  } catch {
    return null;
  }
}

export function getDefaultLayoutResetData(
  isPractice: boolean,
  windowInnerWidth?: number,
  windowInnerHeight?: number,
): {
  defaultLayout: LayoutConfig;
  columns: string[];
  columnLayouts: any;
  columnVisibility: any;
  columnWidths: any;
  columnAnchors: any;
} {
  const baseLayout = isPractice
    ? Settings.DEFAULT_PRACTICE_LAYOUT
    : Settings.DEFAULT_LAYOUT;
  const defaultLayout =
    windowInnerWidth && windowInnerHeight
      ? computeScaledLayout(baseLayout, windowInnerWidth, windowInnerHeight)
      : JSON.parse(JSON.stringify(baseLayout));

  const defaultSettings = new Settings();

  return {
    defaultLayout,
    columns: isPractice
      ? [...Settings.DEFAULT_PRACTICE_COLUMNS]
      : [...Settings.DEFAULT_COLUMNS],
    columnLayouts: isPractice
      ? JSON.parse(JSON.stringify(defaultSettings.practiceColumnLayouts || {}))
      : JSON.parse(JSON.stringify(defaultSettings.columnLayouts || {})),
    columnVisibility: isPractice
      ? JSON.parse(
          JSON.stringify(defaultSettings.practiceColumnVisibility || {}),
        )
      : JSON.parse(JSON.stringify(defaultSettings.columnVisibility || {})),
    columnWidths: isPractice
      ? JSON.parse(JSON.stringify(defaultSettings.practiceColumnWidths || {}))
      : JSON.parse(JSON.stringify(defaultSettings.columnWidths || {})),
    columnAnchors: isPractice
      ? JSON.parse(JSON.stringify(defaultSettings.practiceColumnAnchors || {}))
      : JSON.parse(JSON.stringify(defaultSettings.columnAnchors || {})),
  };
}

export async function executeSelectFolder(
  fileSystem: any,
): Promise<string | null> {
  if (await fileSystem.selectCustomFolder()) {
    const handle = await fileSystem.getCustomDirectoryHandle();
    return handle?.name || null;
  }
  return null;
}

export async function executeClearFolder(fileSystem: any): Promise<void> {
  await fileSystem.clearCustomFolder();
}

export async function executeSelectWidgetFolder(
  fileSystem: any,
): Promise<string | null> {
  if (await fileSystem.selectCustomWidgetFolder()) {
    const handle = await fileSystem.getCustomWidgetDirectoryHandle();
    return handle?.name || null;
  }
  return null;
}

export async function executeClearWidgetFolder(fileSystem: any): Promise<void> {
  await fileSystem.clearCustomWidgetFolder();
}

export function executeTemplateFileSelected(
  event: Event,
  editingSettings: Settings,
  onLoaded: () => void,
): void {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    const reader = new FileReader();
    reader.onload = () => {
      if (editingSettings) {
        editingSettings.customExportTemplateBase64 = reader.result as string;
        onLoaded();
      }
    };
    reader.readAsDataURL(input.files[0]);
  }
}
