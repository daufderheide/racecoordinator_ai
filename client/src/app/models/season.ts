export interface SeasonScoring {
  position_points?: number[];
  heat_position_points?: number[];
}

export interface SeasonDriverResult {
  driver_id: string;
  driver_name: string;
  overall_rank: number;
  overall_points: number;
  heat_points: number;
  total_points: number;
}

export interface SeasonRaceRecord {
  race_id: string;
  race_name: string;
  timestamp: number;
  is_demo?: boolean;
  is_event?: boolean;
  driver_results: SeasonDriverResult[];
}

export interface Season {
  _id?: string;
  entity_id?: string;
  name: string;
  drops: number;
  races?: SeasonRaceRecord[];
}

export interface SeasonStandingDetail {
  race_id: string;
  race_name: string;
  overall_rank: number;
  overall_points: number;
  heat_points: number;
  total_points: number;
  is_dropped: boolean;
}

export interface SeasonStandingItem {
  driver_id: string;
  driver_name: string;
  net_points: number;
  gross_points: number;
  races_run: number;
  current_race_points?: number;
  currentRacePoints?: number;
  race_scores?: SeasonStandingDetail[];
}
