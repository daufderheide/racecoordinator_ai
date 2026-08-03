export interface EventRaceItem {
  raceId: string;
  maxDrivers: number; // 0 = unlimited / all qualifying drivers
}

export interface Event {
  entity_id?: string;
  name: string;
  description?: string;
  auto_advance_time?: number;
  races: EventRaceItem[];
}
