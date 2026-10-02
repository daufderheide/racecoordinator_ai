import { AudioConfig } from "./driver";

export type ImportRowStatus = "VALID" | "CONFLICT" | "ERROR";
export type ConflictType =
  | "NONE"
  | "DUPLICATE_NAME"
  | "DUPLICATE_NICKNAME"
  | "DUPLICATE_IN_FILE";
export type ConflictResolution = "SKIP" | "OVERWRITE" | "AUTO_RENAME";

export interface DriverImportRow {
  rowIndex: number;
  rawName: string;
  rawNickname?: string;
  resolvedName: string;
  resolvedNickname: string;
  avatarUrl?: string;
  audioSlots?: Record<string, AudioConfig>;
  defaultAudioMode?: string;
  status: ImportRowStatus;
  conflictType: ConflictType;
  message?: string;
  selectedResolution: ConflictResolution;
  existingDriverId?: string;
}

export interface DriverImportPreview {
  rows: DriverImportRow[];
  totalRows: number;
  validCount: number;
  conflictCount: number;
  errorCount: number;
  importedAssetNames: string[];
  detectedAudioDefault: string;
}

export interface DriverImportCommitRequest {
  rows: DriverImportRow[];
}

export interface DriverImportResult {
  success: boolean;
  importedCount: number;
  updatedCount: number;
  skippedCount: number;
  createdDriverIds: string[];
  messages: string[];
}
