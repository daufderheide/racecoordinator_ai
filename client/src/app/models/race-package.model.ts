export interface RacePackageManifest {
  format_version: number;
  created_by_app_version: string;
  min_compatible_app_version: string;
  package_type: string;
  race_id: string;
  race_name: string;
  start_time: number;
  end_time: number;
  heat_count: number;
  driver_count: number;
  fingerprint: string;
}

export interface DriverImportMapping {
  source_driver_id: string;
  source_driver_name: string;
  source_driver_nickname: string;
  matched_local_driver_id?: string;
  matched_local_driver_name?: string;
  match_type: "EXACT_NAME" | "EXACT_NICKNAME" | "NONE";
  suggested_action: "LINK" | "CREATE_NEW";
}

export interface DriverResolution {
  source_driver_id: string;
  action: "LINK" | "CREATE_NEW";
  target_driver_id?: string;
  new_driver_name?: string;
}

export interface RacePackagePreview {
  manifest: RacePackageManifest;
  duplicate_race: boolean;
  existing_race_id?: string;
  existing_race_name?: string;
  config_conflict?: boolean;
  existing_config_name?: string;
  suggested_config_name?: string;
  driver_mappings: DriverImportMapping[];
  temp_package_token: string;
}

export interface RacePackageCommitRequest {
  temp_package_token: string;
  duplicate_action: "OVERWRITE" | "CREATE_COPY" | "SKIP";
  config_action?:
    | "AUTO_RENAME"
    | "OVERWRITE"
    | "USE_EXISTING"
    | "CREATE_NEW"
    | "SKIP";
  race_name?: string;
  custom_config_name?: string;
  driver_resolutions: DriverResolution[];
  season_id?: string;
}

export interface RacePackageResult {
  success: boolean;
  imported_race_id: string;
  race_name: string;
  driver_count: number;
  drivers_created: number;
  drivers_linked: number;
  committed_to_season_id?: string;
  race_config_id?: string;
  race_config_name?: string;
  race_config_action?: string;
  action?: "IMPORTED" | "OVERWRITTEN" | "SKIPPED";
  message?: string;
}
