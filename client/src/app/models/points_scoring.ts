export interface PointsScoring {
  position_points?: number[];
  heat_position_points?: number[];
  heat_carry_over_pct?: number;
  heat_bonus_fastest_lap?: number;
  heat_bonus_led_lap?: number;
  heat_bonus_most_laps_led?: number;
  heat_one_bonus_per_driver?: boolean;
  overall_bonus_fastest_lap?: number;
  overall_bonus_fastest_lap_per_lane?: number;
  overall_bonus_led_lap?: number;
  overall_bonus_most_laps_led?: number;
  overall_one_bonus_per_driver?: boolean;
}
