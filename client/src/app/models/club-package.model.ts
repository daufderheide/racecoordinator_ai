/**
 * Club Race Export & Import: the preview and results of a club package import.
 * Mirrors server/importer/club/ClubImport.java.
 * https://github.com/daufderheide/racecoordinator_ai/issues/972
 */
export type ClubMatchType = "CLUB_ID" | "NAME" | "NONE";
export type ClubItemResolution = "MATCH" | "UPDATE" | "CREATE";
export type ClubSeasonResolution = "MERGE" | "CREATE";
export type ClubNightStatus = "NEW" | "SAME" | "CHANGED";
export type ClubNightResolution = "ADD" | "UPDATE" | "SKIP";

export interface ClubImportItem {
  ref: string;
  clubId: string;
  name: string;
  detail?: string;
  matchType: ClubMatchType;
  existingId?: string | null;
  existingName?: string | null;
  differences: string[];
  resolution: ClubItemResolution;
}

export interface ClubSeasonChoice {
  clubId: string;
  name: string;
  packageDrops: number;
  matchType: ClubMatchType;
  existingId?: string | null;
  existingName?: string | null;
  existingDrops?: number | null;
  resolution: ClubSeasonResolution;
  usePackageDrops: boolean;
}

export interface ClubImportNight {
  key: string;
  historyId: string;
  raceName: string;
  timestamp: number;
  driverCount: number;
  hasHistory: boolean;
  status: ClubNightStatus;
  resolution: ClubNightResolution;
}

export interface ClubImportOption {
  id: string;
  name: string;
}

export interface ClubImportPreview {
  formatVersion: number;
  sourceAppVersion: string;
  exportedAt: number;
  season: ClubSeasonChoice;
  drivers: ClubImportItem[];
  tracks: ClubImportItem[];
  raceClasses: ClubImportItem[];
  raceNights: ClubImportNight[];
  existing: {
    seasons?: ClubImportOption[];
    drivers?: ClubImportOption[];
    tracks?: ClubImportOption[];
    raceClasses?: ClubImportOption[];
  };
  warnings: string[];
  packageData: any;
}

export interface ClubImportCommitRequest {
  packageData: any;
  season: ClubSeasonChoice;
  drivers: ClubImportItem[];
  tracks: ClubImportItem[];
  raceClasses: ClubImportItem[];
  raceNights: ClubImportNight[];
}

export interface ClubImportResult {
  success: boolean;
  seasonId: string;
  seasonName: string;
  nightsAdded: number;
  nightsUpdated: number;
  nightsSkipped: number;
  driversCreated: number;
  driversUpdated: number;
  driversMatched: number;
  tracksCreated: number;
  tracksUpdated: number;
  tracksMatched: number;
  raceClassesCreated: number;
  raceClassesUpdated: number;
  raceClassesMatched: number;
  messages: string[];
}
