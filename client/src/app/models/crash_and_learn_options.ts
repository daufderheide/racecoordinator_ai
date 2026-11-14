export class CrashAndLearnOptions {
  enabled: boolean = false;
  automated_crash_time: number = 0.0;
  max_crashes: number = 3;
  pause_heat_on_crash: boolean = true;
  allow_multiple_crashes_per_lap: boolean = true;
  reset_crashes_each_heat: boolean = true;
  reset_dq_each_heat: boolean = true;
  heat_crash_lap_penalty: number = 0.0;
  heat_time_penalty: number = 0.0;
  dq_heat_score_percentage: number = 100.0;

  constructor(
    enabled: boolean = false,
    automated_crash_time: number = 0.0,
    max_crashes: number = 3,
    pause_heat_on_crash: boolean = true,
    allow_multiple_crashes_per_lap: boolean = true,
    reset_crashes_each_heat: boolean = true,
    reset_dq_each_heat: boolean = true,
    heat_crash_lap_penalty: number = 0.0,
    heat_time_penalty: number = 0.0,
    dq_heat_score_percentage: number = 100.0,
  ) {
    this.enabled = enabled;
    this.automated_crash_time = automated_crash_time;
    this.max_crashes = max_crashes;
    this.pause_heat_on_crash = pause_heat_on_crash;
    this.allow_multiple_crashes_per_lap = allow_multiple_crashes_per_lap;
    this.reset_crashes_each_heat = reset_crashes_each_heat;
    this.reset_dq_each_heat = reset_dq_each_heat;
    this.heat_crash_lap_penalty = heat_crash_lap_penalty;
    this.heat_time_penalty = heat_time_penalty;
    this.dq_heat_score_percentage = dq_heat_score_percentage;
  }
}
