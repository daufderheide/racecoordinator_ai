import { Driver } from "@app/models/driver";
import { FinishMethod } from "@app/models/heat_scoring";
import { OverallRanking } from "@app/models/overall_scoring";
import { Race } from "@app/models/race";
import { RaceParticipant } from "@app/models/race_participant";
import { Track } from "@app/models/track";
import { RaceState } from "@app/proto/antigravity";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { Heat } from "@app/race/heat";

export interface MockEditorData {
  raceState: RaceState;
  time: number;
  race: Race;
  track: Track;
  participants: RaceParticipant[];
  heat: Heat;
}

export function createMockEditorData(): MockEditorData {
  const raceState = RaceState.RACING;
  const time = 3600;
  const race = {
    name: "Mock Editor Race",
    track_id: "mock_track_1",
    heats_run: 1,
    overall_scoring: {
      rankingMethod: OverallRanking.OR_LAP_COUNT,
      finishMethod: FinishMethod.Timed,
      points: [],
    },
  } as unknown as Race;

  const track = createMockTrack();
  const participants = createMockRaceParticipants();

  const heatDrivers = participants.map((p: any, index) => {
    const hd = new DriverHeatData(`mock_hd_${index}`, p, p.lane);
    hd.addLapTime(
      p.lap_count,
      p.last_lap_time,
      p.average_lap_time,
      p.median_lap_time,
      p.best_lap_time,
      p.lap_count,
    );
    hd.reactionTime = p.reaction_time || 0.123;
    hd.gapLeader = p.gap_leader || 0;
    hd.gapPosition = p.gap_position || 0;

    // Add mock fuel and seed to participant if missing
    if (hd.participant) {
      (hd.participant as any).fuelLevel = p.fuelLevel || 50;
      (hd.participant as any).seed = p.seed || index + 1;
      (hd.participant as any).team = p.team || { name: `Team ${index + 1}` };
    }

    // Add mock segment times
    hd.addSegmentTime(0, 0.5);
    hd.addSegmentTime(1, 0.6);
    hd.addSegmentTime(2, 0.7);

    // Inject custom column attributes that may be dynamically accessed
    (hd as any).rankHeat = p.rank;
    (hd as any).rankOverall = p.rank + 1;
    (hd as any).speedMph = 15.5;
    (hd as any).speedKph = 25.0;
    (hd as any).speedFph = 80000;
    (hd as any).fuelPercentage = p.fuelLevel;
    (hd as any).fuelCapacity = 100;

    return hd;
  });

  const heat = {
    id: "mock_heat_1",
    race_id: "mock_race_1",
    start_time: "2026-06-05T12:00:00Z",
    end_time: "2026-06-05T12:03:00Z",
    heatDrivers: heatDrivers,
  } as unknown as Heat;

  return {
    raceState,
    time,
    race,
    track,
    participants,
    heat,
  };
}

function createMockTrack(): Track {
  return {
    name: "Mock Editor Track",
    hasDigitalFuel: () => true,
    lanes: [
      { id: 1, color: "#FF0000" },
      { id: 2, color: "#0000FF" },
      { id: 3, color: "#FFFF00" },
      { id: 4, color: "#00FF00" },
    ],
  } as unknown as Track;
}

function createMockRaceParticipants(): RaceParticipant[] {
  return [
    {
      id: "p1",
      driver: {
        id: "d1",
        name: "Mario",
        nickname: "Jumpman",
        avatarUrl: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Mario",
      } as unknown as Driver,
      lane: 1,
      total_time: 120,
      lap_count: 5,
      last_lap_time: 2.1,
      best_lap_time: 2.0,
      average_lap_time: 2.5,
      median_lap_time: 2.4,
      rank: 1,
      reaction_time: 0.05,
      gap_leader: 0,
      gap_position: 0,
      fuelLevel: 100,
      seed: 1,
      team: { name: "Mushroom Kingdom", driverIds: ["d1", "d2", "d4"] },
    } as unknown as RaceParticipant,
    {
      id: "p2",
      driver: {
        id: "d2",
        name: "Luigi",
        nickname: "Green Mario",
        avatarUrl: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Luigi",
      } as unknown as Driver,
      lane: 2,
      total_time: 125,
      lap_count: 4,
      last_lap_time: 2.8,
      best_lap_time: 2.5,
      average_lap_time: 3.0,
      median_lap_time: 2.9,
      rank: 2,
      reaction_time: 0.15,
      gap_leader: 5,
      gap_position: 5,
      fuelLevel: 80,
      seed: 2,
      team: { name: "Mushroom Kingdom", driverIds: ["d1", "d2", "d4"] },
    } as unknown as RaceParticipant,
    {
      id: "p3",
      driver: {
        id: "d3",
        name: "Bowser",
        nickname: "King Koopa",
        avatarUrl: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Bowser",
      } as unknown as Driver,
      lane: 3,
      total_time: 130,
      lap_count: 4,
      last_lap_time: 3.1,
      best_lap_time: 2.9,
      average_lap_time: 3.2,
      median_lap_time: 3.1,
      rank: 3,
      reaction_time: 0.223,
      gap_leader: 10,
      gap_position: 5,
      fuelLevel: 60,
      seed: 3,
      team: { name: "Koopa Troop", driverIds: ["d3"] },
    } as unknown as RaceParticipant,
    {
      id: "p4",
      driver: {
        id: "d4",
        name: "Peach",
        nickname: "Princess",
        avatarUrl: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Peach",
      } as unknown as Driver,
      lane: 4,
      total_time: 140,
      lap_count: 3,
      last_lap_time: 3.5,
      best_lap_time: 3.2,
      average_lap_time: 3.6,
      median_lap_time: 3.5,
      rank: 4,
      reaction_time: 0.101,
      gap_leader: 20,
      gap_position: 10,
      fuelLevel: 40,
      seed: 4,
      team: { name: "Mushroom Kingdom", driverIds: ["d1", "d2", "d4"] },
    } as unknown as RaceParticipant,
  ];
}
