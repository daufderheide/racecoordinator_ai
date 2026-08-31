export interface SeasonScoring {
  position_points?: number[];
  heat_position_points?: number[];
  heat_carry_over_pct?: number;
  heat_bonus_fastest_lap?: number;
  heat_bonus_led_lap?: number;
  heat_bonus_most_laps_led?: number;
  heat_one_bonus_per_driver?: boolean;
  overall_carry_over_pct?: number;
  overall_bonus_fastest_lap?: number;
  overall_bonus_fastest_lap_per_lane?: number;
  overall_bonus_led_lap?: number;
  overall_bonus_most_laps_led?: number;
  overall_one_bonus_per_driver?: boolean;
}

export interface SeasonDriverResult {
  driver_id: string;
  driver_name: string;
  overall_rank: number;
  overall_points: number;
  overall_bonus_points?: number;
  overall_bonus_breakdown?: Record<string, number>;
  heat_points: number;
  heat_bonus_points?: number;
  heat_bonus_breakdown?: Record<string, number>;
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
  overall_bonus_points?: number;
  overall_bonus_breakdown?: Record<string, number>;
  heat_points: number;
  heat_bonus_points?: number;
  heat_bonus_breakdown?: Record<string, number>;
  total_points: number;
  is_dropped: boolean;
}

export interface SeasonStandingItem {
  driver_id: string;
  driver_name: string;
  net_points: number;
  gross_points: number;
  dropped_points?: number;
  races_run: number;
  current_race_points?: number;
  currentRacePoints?: number;
  race_scores?: SeasonStandingDetail[];
}
