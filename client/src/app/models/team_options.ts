export class TeamOptions {
  constructor(
    public heat_lap_limit: number = 0,
    public heat_time_limit: number = 0,
    public overall_lap_limit: number = 0,
    public overall_time_limit: number = 0,
    public require_pit_stop_change_driver: boolean = false
  ) {}
}
