import { Race } from "./race";
import { RaceParticipant } from "./race_participant";
import { Track } from "./track";

export interface RaceHistoryRecord {
  _id: string;
  original_entity_id: string;
  model: Race;
  track: Track;
  drivers: RaceParticipant[];
  heats: any[];
  accumulatedRaceTime: number;
  statistics: {
    startTime: string;
    endTime: string;
    startMillis: number;
    durationMillis: number;
    totalPausedTimeMillis: number;
    yellowFlagCount: number;
    restartCount: number;
  };
  database_name?: string;
  car_class?: string;
  geolocation?: string;
}
