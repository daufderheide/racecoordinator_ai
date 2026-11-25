import {
  ConflictResolution,
  ConflictType,
  ImportRowStatus,
} from "./driver-import.model";

/** One car of an import file (#1210, step 6b), as the server sends and takes it. */
export interface CarImportRow {
  rowIndex: number;
  rawName: string;
  resolvedName: string;
  /** Fixed columns the file has: picture, brand, carClass, scale, modified, notes, ... */
  values: Record<string, string>;
  /** Own-field columns by field name. */
  customValues: Record<string, string>;
  status: ImportRowStatus;
  conflictType: ConflictType;
  message?: string;
  selectedResolution?: ConflictResolution;
  existingCarId?: string;
}

/** An own field the import adds, or choice options it adds to a field. */
export interface CarFieldChange {
  name: string;
  type: string;
  options: string[];
}

export interface CarImportPreview {
  rows: CarImportRow[];
  totalRows: number;
  validCount: number;
  conflictCount: number;
  errorCount: number;
  importedAssetNames: string[];
  existingCars: { entityId: string; name: string }[];
  newFields: CarFieldChange[];
  newOptions: CarFieldChange[];
}

export interface CarImportCommitRequest {
  rows: CarImportRow[];
  newFields: CarFieldChange[];
}

export interface CarImportResult {
  success: boolean;
  importedCount: number;
  updatedCount: number;
  skippedCount: number;
  createdCarIds: string[];
  updatedCarIds: string[];
  createdFieldNames: string[];
  messages: string[];
}
