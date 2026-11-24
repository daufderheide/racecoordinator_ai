import {
  CarFieldChange,
  CarImportCommitRequest,
  CarImportPreview,
  CarImportResult,
  CarImportRow,
} from "@app/models/car-import.model";
import {
  DriverImportPreview,
  DriverImportResult,
  DriverImportRow,
} from "@app/models/driver-import.model";

/** What the import dialog imports: drivers (the default) or slotcars (#1210, step 6b). */
export type ImportKind = "drivers" | "cars";

/** The texts and settings per kind; drivers keep their old texts. */
export const IMPORT_KIND_CONFIG = {
  drivers: {
    accept: ".csv,.xlsx,.xls,.json,.zip,.wav,.mp3,.ogg,.png,.jpg,.jpeg,.webp",
    dropzoneHintKey: "DIM_DROPZONE_HINT",
    pictureColumnKey: "DIM_COL_AVATAR",
    importCountKey: "DIM_BTN_IMPORT_COUNT",
    summaryImportedKey: "DIM_SUMMARY_IMPORTED",
    summaryUpdatedKey: "DIM_SUMMARY_UPDATED",
    summarySkippedKey: "DIM_SUMMARY_SKIPPED",
    createdIcon: "person_add",
    commitErrorKey: "DIM_ERROR_COMMIT_FAILED",
    nameRequiredKey: "DIM_ERROR_NAME_REQUIRED",
    inFileKey: "DIM_CONFLICT_DUPLICATE_IN_FILE",
    nameExistsKey: "DIM_CONFLICT_DUPLICATE_NAME",
    templateName: "drivers_template",
  },
  cars: {
    accept: ".csv,.xlsx,.xls,.json,.zip,.png,.jpg,.jpeg,.webp,.gif",
    dropzoneHintKey: "CIM_DROPZONE_HINT",
    pictureColumnKey: "CIM_COL_PICTURE",
    importCountKey: "CIM_BTN_IMPORT_COUNT",
    summaryImportedKey: "CIM_SUMMARY_IMPORTED",
    summaryUpdatedKey: "CIM_SUMMARY_UPDATED",
    summarySkippedKey: "CIM_SUMMARY_SKIPPED",
    createdIcon: "directions_car",
    commitErrorKey: "CIM_ERROR_COMMIT_FAILED",
    nameRequiredKey: "CIM_ERROR_NAME_REQUIRED",
    inFileKey: "CIM_CONFLICT_DUPLICATE_IN_FILE",
    nameExistsKey: "CIM_CONFLICT_DUPLICATE_NAME",
    templateName: "cars_template",
  },
};

/**
 * A car row in the dialog. It has the driver row's shape, with the nickname always equal to the
 * name, so the dialog's name checks and "Import as copy" work for cars unchanged; the car data
 * rides along.
 */
export interface CarDialogRow extends DriverImportRow {
  car: CarImportRow;
}

/** What the import adds to the own fields, for the notice in the preview. */
export interface CarFieldChanges {
  newFields: CarFieldChange[];
  newOptions: CarFieldChange[];
}

const PICTURE_NOT_FOUND = "Picture not found: ";

/** The server's car preview in the dialog's (driver) shape. */
export function carPreviewToDialog(
  preview: CarImportPreview,
  translate: (key: string, params?: Record<string, unknown>) => string,
): DriverImportPreview {
  const rows: CarDialogRow[] = preview.rows.map((car) => {
    let message = car.message;
    if (message?.startsWith(PICTURE_NOT_FOUND)) {
      message = translate("CIM_PICTURE_NOT_FOUND", {
        file: message.substring(PICTURE_NOT_FOUND.length),
      });
    } else if (car.status === "ERROR") {
      message = translate("CIM_ERROR_NAME_REQUIRED");
    } else if (car.conflictType === "DUPLICATE_NAME") {
      message = translate("CIM_CONFLICT_DUPLICATE_NAME", {
        name: car.resolvedName,
      });
    } else if (car.conflictType === "DUPLICATE_IN_FILE") {
      message = translate("CIM_CONFLICT_DUPLICATE_IN_FILE", {
        name: car.resolvedName,
      });
    }
    return {
      car,
      rowIndex: car.rowIndex,
      rawName: car.rawName,
      rawNickname: "",
      resolvedName: car.resolvedName,
      resolvedNickname: car.resolvedName,
      avatarUrl: car.values?.["picture"] || undefined,
      status: car.status,
      conflictType: car.conflictType,
      message,
      selectedResolution: car.selectedResolution || "SKIP",
      existingDriverId: car.existingCarId,
    };
  });
  return {
    rows,
    totalRows: preview.totalRows,
    validCount: preview.validCount,
    conflictCount: preview.conflictCount,
    errorCount: preview.errorCount,
    importedAssetNames: preview.importedAssetNames || [],
    detectedAudioDefault: "",
    existingDrivers: (preview.existingCars || []).map((c) => ({
      entityId: c.entityId,
      name: c.name,
      nickname: c.name,
    })),
  };
}

/** The dialog's rows back as car rows, with the user's names and choices. */
export function dialogToCarCommit(
  rows: DriverImportRow[],
  changes: CarFieldChanges | null,
): CarImportCommitRequest {
  return {
    rows: rows.map((row) => {
      const car = (row as CarDialogRow).car;
      return {
        ...car,
        resolvedName: row.resolvedName,
        status: row.status,
        conflictType: row.conflictType,
        message: undefined,
        selectedResolution: row.selectedResolution,
        existingCarId: row.existingDriverId,
      };
    }),
    newFields: changes?.newFields || [],
  };
}

/** The car result in the shape the dialog's summary and its host use. */
export function carResultToDialog(result: CarImportResult): DriverImportResult {
  return {
    success: result.success,
    importedCount: result.importedCount,
    updatedCount: result.updatedCount,
    skippedCount: result.skippedCount,
    createdDriverIds: result.createdCarIds || [],
    updatedDriverIds: result.updatedCarIds || [],
    messages: result.messages || [],
  };
}

/** "Carrera · GT3 · 1/32" for the details column. */
export function carDetails(row: DriverImportRow): string {
  const v = (row as CarDialogRow).car?.values || {};
  return [v["brand"], v["carClass"], v["scale"]].filter(Boolean).join(" · ");
}

/** "audi.png" for a saved picture "/assets/<uuid>_audi.png", for the picture column. */
export function carPictureName(url: string | undefined): string {
  const file = (url || "").split("/").pop() || "";
  return file.replace(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_/i,
    "",
  );
}
