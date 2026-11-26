export interface StepDriverResult {
  rank: number;
  driverId: string;
  driver_id?: string;
  driverName: string;
  driver_name?: string;
  totalLaps: number;
  total_laps?: number;
  totalTime: number;
  total_time?: number;
  totalPoints: number;
  total_points?: number;
  bestLapTime: number;
  best_lap_time?: number;
  steppingUp: boolean;
  is_stepping_up?: boolean;
  stepUpIndex: number;
  step_up_index?: number;
}

export interface StepResults {
  step: number;
  group: number;
  nextStep: number;
  next_step?: number;
  stepUpCount: number;
  step_up_count?: number;
  standings: StepDriverResult[];
}
