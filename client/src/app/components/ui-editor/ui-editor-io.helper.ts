import { firstValueFrom } from "rxjs";
import { LaneViewMigrationHelper } from "@app/components/raceday/utils/lane-view-migration.helper";
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
  const isDriverStation = ui.entity_id === "driver_station_ui_layout_rc_ai";
  let layout: any = undefined;
  if (ui.layoutJson) {
    try {
      layout = JSON.parse(ui.layoutJson);
    } catch {
      // ignore
    }
  }
  if (!layout) {
    layout = isDriverStation
      ? Settings.DEFAULT_DRIVER_STATION_LAYOUT
      : isPractice
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
    ui.entity_id === "driver_station_ui_layout_rc_ai"
      ? "driver-station-layout.json"
      : ui.entity_id === "practice_ui_layout_rc_ai"
        ? "practice-raceday-layout.json"
        : ui.entity_id === "default_ui_layout_rc_ai"
          ? "raceday-layout.json"
          : `${(ui.name || "layout").toLowerCase().replace(/[^a-z0-9_-]+/g, "-")}-layout.json`;

  return { layoutExport, fileName };
}

export interface LayoutImportResult {
  success: boolean;
  errorKey?: string;
  reasonKey?: string;
  errorDetail?: string;
  data?: {
    layout: LayoutConfig;
    columns: string[];
    columnLayouts: any;
    columnVisibility: any;
    columnAnchors: any;
    columnWidths: any;
  };
}

export function formatImportErrorMessage(
  translationService: any,
  errorKey: string,
  reasonKey?: string,
  errorDetail?: string,
): string {
  const baseMessage =
    translationService?.translate(errorKey) ||
    "Failed to import layout: The selected file does not contain a valid layout configuration.";

  const reasonContent = reasonKey
    ? translationService?.translate(reasonKey) || reasonKey
    : errorDetail;

  if (reasonContent) {
    const translatedReasonTemplate = translationService?.translate(
      "UE_ERROR_IMPORT_REASON",
      {
        reason: reasonContent,
      },
    );
    const formattedReason =
      translatedReasonTemplate &&
      translatedReasonTemplate !== "UE_ERROR_IMPORT_REASON"
        ? translatedReasonTemplate
        : `Reason: ${reasonContent}`;
    return `${baseMessage}\n\n${formattedReason}`;
  }

  return baseMessage;
}

function extractImportedLayoutDetailed(layoutData: any): {
  layout: LayoutConfig | null;
  reasonKey?: string;
} {
  const target =
    layoutData?.layoutExport && typeof layoutData.layoutExport === "object"
      ? layoutData.layoutExport
      : layoutData;

  let rawLayout =
    target.layout ??
    target.racedayLayout ??
    target.practiceRacedayLayout ??
    target.layoutJson ??
    (target.widgets ? target : null);

  if (typeof rawLayout === "string") {
    try {
      rawLayout = JSON.parse(rawLayout);
    } catch {
      return {
        layout: null,
        reasonKey: "UE_ERROR_IMPORT_REASON_INVALID_LAYOUT",
      };
    }
  }

  if (!rawLayout) {
    return {
      layout: null,
      reasonKey: "UE_ERROR_IMPORT_REASON_MISSING_LAYOUT",
    };
  }

  if (typeof rawLayout !== "object" || Array.isArray(rawLayout)) {
    return {
      layout: null,
      reasonKey: "UE_ERROR_IMPORT_REASON_INVALID_LAYOUT",
    };
  }

  if (!Array.isArray(rawLayout.widgets)) {
    if (
      typeof rawLayout.baseWidth === "number" ||
      typeof rawLayout.baseHeight === "number"
    ) {
      rawLayout.widgets = [];
    } else {
      return {
        layout: null,
        reasonKey: "UE_ERROR_IMPORT_REASON_INVALID_WIDGETS",
      };
    }
  }
  return { layout: rawLayout };
}

function extractImportedColumns(
  layoutData: any,
  isPractice: boolean,
): string[] {
  const target =
    layoutData?.layoutExport && typeof layoutData.layoutExport === "object"
      ? layoutData.layoutExport
      : layoutData;

  let rawColumns =
    target.columns ??
    target.racedayColumns ??
    target.practiceRacedayColumns ??
    target.columnsJson;
  if (typeof rawColumns === "string") {
    try {
      rawColumns = JSON.parse(rawColumns);
    } catch {
      rawColumns = null;
    }
  }
  return Array.isArray(rawColumns)
    ? rawColumns
    : isPractice
      ? Settings.DEFAULT_PRACTICE_COLUMNS
      : Settings.DEFAULT_COLUMNS;
}

function extractImportedRecordMap(
  data: any,
  ...keys: string[]
): Record<string, any> {
  const target =
    data?.layoutExport && typeof data.layoutExport === "object"
      ? data.layoutExport
      : data;

  for (const key of keys) {
    let val = target[key];
    if (val !== undefined && val !== null) {
      if (typeof val === "string") {
        try {
          val = JSON.parse(val);
        } catch {
          val = {};
        }
      }
      if (typeof val === "object" && !Array.isArray(val)) {
        return val;
      }
    }
  }
  return {};
}

export function parseLayoutImportDetailed(
  jsonContent: string,
  isPractice: boolean,
): LayoutImportResult {
  if (!jsonContent || typeof jsonContent !== "string") {
    return {
      success: false,
      errorKey: "UE_ERROR_IMPORT_INVALID_JSON",
      reasonKey: "UE_ERROR_IMPORT_REASON_EMPTY",
    };
  }

  const trimmed = jsonContent.trim().replace(/^\uFEFF/, "");
  if (!trimmed) {
    return {
      success: false,
      errorKey: "UE_ERROR_IMPORT_INVALID_JSON",
      reasonKey: "UE_ERROR_IMPORT_REASON_EMPTY",
    };
  }

  let layoutData: any;
  try {
    layoutData = JSON.parse(trimmed);
  } catch (parseErr: any) {
    return {
      success: false,
      errorKey: "UE_ERROR_IMPORT_INVALID_JSON",
      errorDetail: parseErr?.message,
    };
  }

  if (
    !layoutData ||
    typeof layoutData !== "object" ||
    Array.isArray(layoutData)
  ) {
    return {
      success: false,
      errorKey: "UE_ERROR_IMPORT_NO_LAYOUT",
      reasonKey: "UE_ERROR_IMPORT_REASON_NOT_OBJECT",
    };
  }

  const { layout, reasonKey } = extractImportedLayoutDetailed(layoutData);
  if (!layout) {
    return {
      success: false,
      errorKey: "UE_ERROR_IMPORT_NO_LAYOUT",
      reasonKey,
    };
  }

  const columns = extractImportedColumns(layoutData, isPractice);
  const columnLayouts = extractImportedRecordMap(
    layoutData,
    "columnLayouts",
    "practiceColumnLayouts",
    "columnLayoutsJson",
  );
  const columnVisibility = extractImportedRecordMap(
    layoutData,
    "columnVisibility",
    "practiceColumnVisibility",
    "columnVisibilityJson",
  );
  const columnAnchors = extractImportedRecordMap(
    layoutData,
    "columnAnchors",
    "practiceColumnAnchors",
    "columnAnchorsJson",
  );
  const columnWidths = extractImportedRecordMap(
    layoutData,
    "columnWidths",
    "practiceColumnWidths",
    "columnWidthsJson",
  );

  LaneViewMigrationHelper.migrateGapWidgets(layout);
  LaneViewMigrationHelper.migrateLayoutColumns(
    layout,
    columns,
    columnLayouts,
    columnWidths,
  );

  return {
    success: true,
    data: {
      layout,
      columns,
      columnLayouts,
      columnVisibility,
      columnAnchors,
      columnWidths,
    },
  };
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
  const result = parseLayoutImportDetailed(jsonContent, isPractice);
  return result.success && result.data ? result.data : null;
}

interface LayoutResetColumnConfig {
  columns: string[];
  columnLayouts: any;
  columnVisibility: any;
  columnWidths: any;
  columnAnchors: any;
}

function getFuelDefaultColumnConfig(): LayoutResetColumnConfig {
  return {
    columns: [...Settings.DEFAULT_FUEL_COLUMNS],
    columnLayouts: {
      laneNumber: { "center-center": "laneNumber" },
      "driver.nickname": {
        "center-center": "driver.nickname",
        "bottom-right": "participant.team.name",
        "bottom-left": "driverViewQrCode",
      },
      "imageset_fuel-gauge-builtin": {
        "center-center": "imageset_fuel-gauge-builtin",
      },
      lapCount: {
        "center-center": "lapCount",
        "bottom-left": "flag",
      },
      lastLapTime: {
        "center-center": "lastLapTime",
        "top-right": "bestLapTime",
        "bottom-right": "averageLapTime",
      },
      gap: {
        "center-center": "gap",
        "bottom-right": "gapPosition",
      },
    },
    columnVisibility: {
      "imageset_fuel-gauge-builtin": "FuelRaceOnly",
    },
    columnWidths: {
      lapCount: 210,
      "imageset_fuel-gauge-builtin": 210,
      lastLapTime: 310,
      gap: 310,
    },
    columnAnchors: {},
  };
}

function getStandardDefaultColumnConfig(
  isPractice: boolean,
): LayoutResetColumnConfig {
  const defaultSettings = new Settings();
  if (isPractice) {
    return {
      columns: [...Settings.DEFAULT_PRACTICE_COLUMNS],
      columnLayouts: JSON.parse(
        JSON.stringify(defaultSettings.practiceColumnLayouts || {}),
      ),
      columnVisibility: JSON.parse(
        JSON.stringify(defaultSettings.practiceColumnVisibility || {}),
      ),
      columnWidths: JSON.parse(
        JSON.stringify(defaultSettings.practiceColumnWidths || {}),
      ),
      columnAnchors: JSON.parse(
        JSON.stringify(defaultSettings.practiceColumnAnchors || {}),
      ),
    };
  }
  return {
    columns: [...Settings.DEFAULT_COLUMNS],
    columnLayouts: JSON.parse(
      JSON.stringify(defaultSettings.columnLayouts || {}),
    ),
    columnVisibility: JSON.parse(
      JSON.stringify(defaultSettings.columnVisibility || {}),
    ),
    columnWidths: JSON.parse(
      JSON.stringify(defaultSettings.columnWidths || {}),
    ),
    columnAnchors: JSON.parse(
      JSON.stringify(defaultSettings.columnAnchors || {}),
    ),
  };
}

export function getDefaultLayoutResetData(
  isPractice: boolean,
  windowInnerWidth?: number,
  windowInnerHeight?: number,
  isDriverStation?: boolean,
  isFuel?: boolean,
): {
  defaultLayout: LayoutConfig;
  columns: string[];
  columnLayouts: any;
  columnVisibility: any;
  columnWidths: any;
  columnAnchors: any;
} {
  const baseLayout = isDriverStation
    ? Settings.DEFAULT_DRIVER_STATION_LAYOUT
    : isPractice
      ? Settings.DEFAULT_PRACTICE_LAYOUT
      : isFuel
        ? Settings.DEFAULT_FUEL_LAYOUT
        : Settings.DEFAULT_LAYOUT;
  const defaultLayout =
    windowInnerWidth && windowInnerHeight
      ? computeScaledLayout(baseLayout, windowInnerWidth, windowInnerHeight)
      : JSON.parse(JSON.stringify(baseLayout));

  if (isDriverStation) {
    return {
      defaultLayout,
      columns: [],
      columnLayouts: {},
      columnVisibility: {},
      columnWidths: {},
      columnAnchors: {},
    };
  }

  const colConfig = isFuel
    ? getFuelDefaultColumnConfig()
    : getStandardDefaultColumnConfig(isPractice);
  const {
    columns,
    columnLayouts,
    columnVisibility,
    columnWidths,
    columnAnchors,
  } = colConfig;

  LaneViewMigrationHelper.migrateGapWidgets(defaultLayout);
  LaneViewMigrationHelper.migrateLayoutColumns(
    defaultLayout,
    columns,
    columnLayouts,
    columnWidths,
  );

  return {
    defaultLayout,
    columns,
    columnLayouts,
    columnVisibility,
    columnWidths,
    columnAnchors,
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
  saveFileAs({
    suggestedName: "sample_race_export.xlsx",
    data: () =>
      firstValueFrom(
        comp.dataService.testExportXls(
          comp.editingSettings?.customExportTemplateBase64,
        ),
      ),
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    description: "Excel Race Export",
    extension: ".xlsx",
  }).catch((err: any) => {
    comp.logger.error("Error generating test Excel export", err);
  });
}
