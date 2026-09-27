import { CustomUI } from "@app/models/custom-ui";
import { LayoutConfig, Settings } from "@app/models/settings";
import { saveFileAs } from "@app/utils/file-download.utils";

import { computeScaledLayout } from "./ui-editor-resolution.helper";

export function downloadJsonFile(data: any, filename: string): void {
  const jsonContent =
    typeof data === "string" ? data : JSON.stringify(data, null, 2);
  saveFileAs({
    suggestedName: filename,
    data: jsonContent,
    mimeType: "application/json",
    description: "JSON Files",
    extension: ".json",
  });
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
  if (input?.files && input.files.length > 0) {
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      if (editingSettings) {
        editingSettings.customExportTemplateBase64 = reader.result as string;
        const fullPath =
          (file as any).path || (file as any).webkitRelativePath || file.name;
        const fileName =
          file.name || (fullPath ? fullPath.replace(/^.*[\\/]/, "") : "");
        editingSettings.customExportTemplateName = fileName;
        editingSettings.customExportTemplatePath = fullPath;
        onLoaded();
      }
    };
    reader.readAsDataURL(file);
    input.value = "";
  }
}

export function handleDownloadTemplate(comp: any): void {
  const customBase64 = comp.editingSettings?.customExportTemplateBase64;
  if (customBase64) {
    try {
      const parts = customBase64.split(",");
      const base64Data = parts.length > 1 ? parts[1] : parts[0];
      const mimeMatch = parts.length > 1 ? parts[0].match(/:(.*?);/) : null;
      const mimeType =
        mimeMatch && mimeMatch[1]
          ? mimeMatch[1]
          : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: mimeType });
      const rawName =
        comp.editingSettings?.customExportTemplateName ||
        (comp.editingSettings?.customExportTemplatePath
          ? comp.editingSettings.customExportTemplatePath.replace(
              /^.*[\\/]/,
              "",
            )
          : "custom_export_template.xlsx");
      const filename = rawName.endsWith(".xlsx") ? rawName : `${rawName}.xlsx`;
      saveFileAs({
        suggestedName: filename,
        data: blob,
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        description: "Excel Export Template",
        extension: ".xlsx",
      });
    } catch (err) {
      comp.logger.error("Error downloading custom export template", err);
    }
  } else {
    comp.dataService.downloadDefaultExportTemplate().subscribe({
      next: (blob: Blob) => {
        saveFileAs({
          suggestedName: "race_export_template.xlsx",
          data: blob,
          mimeType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          description: "Excel Export Template",
          extension: ".xlsx",
        });
      },
      error: (err: any) => {
        comp.logger.error("Error downloading default export template", err);
      },
    });
  }
}

export const handleDownloadDefaultTemplate = handleDownloadTemplate;

export function handleTestExport(comp: any): void {
  comp.dataService
    .testExportXls(comp.editingSettings?.customExportTemplateBase64)
    .subscribe({
      next: (blob: Blob) => {
        saveFileAs({
          suggestedName: "sample_race_export.xlsx",
          data: blob,
          mimeType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          description: "Excel Race Export",
          extension: ".xlsx",
        });
      },
      error: (err: any) => {
        comp.logger.error("Error generating test Excel export", err);
      },
    });
}
