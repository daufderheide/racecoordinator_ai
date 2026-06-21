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
  heats: Heat[];
  groupParticipants: RaceParticipant[];
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
    group_options: {
      enabled: true,
    },
  } as unknown as Race;

  const track = createMockTrack();
  const participants = createMockRaceParticipants();

  const heatDrivers = participants.slice(0, 4).map((p: any, index) => {
    const hd = new DriverHeatData(`mock_hd_${index}`, p, p.lane - 1);
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
    objectId: "mock_heat_1",
    race_id: "mock_race_1",
    heatNumber: 1,
    start_time: "2026-06-05T12:00:00Z",
    end_time: "2026-06-05T12:03:00Z",
    heatDrivers: heatDrivers,
  } as unknown as Heat;

  const nextHeatDrivers = createMockNextHeatParticipants().map(
    (p: any, index) => {
      const hd = new DriverHeatData(`mock_hd_next_${index}`, p, p.lane - 1);
      hd.reactionTime = 0.15;
      if (hd.participant) {
        (hd.participant as any).fuelLevel = p.fuelLevel || 100;
        (hd.participant as any).seed = p.seed || index + 5;
        (hd.participant as any).team = p.team;
      }
      return hd;
    },
  );

  const nextHeat = {
    id: "mock_heat_2",
    objectId: "mock_heat_2",
    race_id: "mock_race_1",
    heatNumber: 2,
    started: false,
    heatDrivers: nextHeatDrivers,
  } as unknown as Heat;

  const heats = [heat, nextHeat];
  const groupParticipants = participants;

  return {
    raceState,
    time,
    race,
    track,
    participants,
    heat,
    heats,
    groupParticipants,
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

const MOCK_CHARACTERS = [
  {
    name: "Mario",
    nickname: "Jumpman",
    team: "Mushroom Kingdom",
    avatar: "Mario",
  },
  {
    name: "Luigi",
    nickname: "Green Mario",
    team: "Mushroom Kingdom",
    avatar: "Luigi",
  },
  {
    name: "Bowser",
    nickname: "King Koopa",
    team: "Koopa Troop",
    avatar: "Bowser",
  },
  {
    name: "Peach",
    nickname: "Princess",
    team: "Mushroom Kingdom",
    avatar: "Peach",
  },
  {
    name: "Yoshi",
    nickname: "Green Dino",
    team: "Yoshi Island",
    avatar: "Yoshi",
  },
  { name: "Donkey Kong", nickname: "DK", team: "DK Crew", avatar: "DK" },
  { name: "Wario", nickname: "Greedy", team: "Wario Land", avatar: "Wario" },
  {
    name: "Waluigi",
    nickname: "Purple",
    team: "Waluigi Pinball",
    avatar: "Waluigi",
  },
  {
    name: "Toad",
    nickname: "Mushroom",
    team: "Mushroom Kingdom",
    avatar: "Toad",
  },
  {
    name: "Toadette",
    nickname: "Pink Toad",
    team: "Mushroom Kingdom",
    avatar: "Toadette",
  },
  {
    name: "Rosalina",
    nickname: "Star Princess",
    team: "Comet Observatory",
    avatar: "Rosalina",
  },
  {
    name: "Bowser Jr.",
    nickname: "Junior",
    team: "Koopa Troop",
    avatar: "BowserJr",
  },
  {
    name: "Daisy",
    nickname: "Flower Princess",
    team: "Sarasaland",
    avatar: "Daisy",
  },
  {
    name: "Koopa Troopa",
    nickname: "Shell Slider",
    team: "Koopa Troop",
    avatar: "Koopa",
  },
  {
    name: "Shy Guy",
    nickname: "Masked",
    team: "Shy Guy Guild",
    avatar: "ShyGuy",
  },
  {
    name: "Dry Bones",
    nickname: "Bony",
    team: "Koopa Troop",
    avatar: "DryBones",
  },
  {
    name: "King Boo",
    nickname: "Ghost King",
    team: "Paranormal",
    avatar: "KingBoo",
  },
  {
    name: "Petey Piranha",
    nickname: "Plant",
    team: "Flora",
    avatar: "Petey",
  },
  {
    name: "Funky Kong",
    nickname: "Surfer Kong",
    team: "DK Crew",
    avatar: "Funky",
  },
  {
    name: "Diddy Kong",
    nickname: "Chimpy",
    team: "DK Crew",
    avatar: "Diddy",
  },
  { name: "Link", nickname: "Hero of Time", team: "Hyrule", avatar: "Link" },
  {
    name: "Zelda",
    nickname: "Princess Zelda",
    team: "Hyrule",
    avatar: "Zelda",
  },
  {
    name: "Isabelle",
    nickname: "Secretary",
    team: "Animal Crossing",
    avatar: "Isabelle",
  },
  {
    name: "Villager",
    nickname: "Mayor",
    team: "Animal Crossing",
    avatar: "Villager",
  },
  {
    name: "Inkling",
    nickname: "Kid-Squid",
    team: "Inkopolis",
    avatar: "Inkling",
  },
];

function createMockRaceParticipants(): RaceParticipant[] {
  return MOCK_CHARACTERS.map((char, index) => {
    const rank = index + 1;
    const lapCount = Math.max(1, 10 - Math.floor(index / 2));
    const bestLap = 2.0 + index * 0.1;
    const lastLap = bestLap + 0.1 + (index % 3) * 0.05;
    const avgLap = bestLap + 0.3;
    const medianLap = bestLap + 0.2;
    const totalTime = 100 + index * 5;

    return {
      id: `p${rank}`,
      objectId: `p${rank}`,
      driver: new Driver(
        `d${rank}`,
        char.name,
        char.nickname,
        `https://api.dicebear.com/7.x/pixel-art/svg?seed=${char.avatar}`,
      ),
      lane: rank <= 4 ? rank : 0,
      total_time: totalTime,
      lap_count: lapCount,
      last_lap_time: lastLap,
      best_lap_time: bestLap,
      average_lap_time: avgLap,
      median_lap_time: medianLap,
      rank: rank,
      reaction_time: 0.05 + index * 0.01,
      gap_leader: index === 0 ? 0 : index * 1.5,
      gap_position: index === 0 ? 0 : 1.5,
      fuelLevel: Math.max(0, 100 - index * 4),
      seed: rank,
      team: { name: char.team, driverIds: [`d${rank}`] },
    } as unknown as RaceParticipant;
  });
}

function createMockNextHeatParticipants(): RaceParticipant[] {
  return [
    {
      id: "p5",
      objectId: "p5",
      driver: new Driver(
        "d5",
        "Yoshi",
        "Green Dino",
        "https://api.dicebear.com/7.x/pixel-art/svg?seed=Yoshi",
      ),
      lane: 1,
      total_time: 0,
      lap_count: 0,
      last_lap_time: 0,
      best_lap_time: 0,
      average_lap_time: 0,
      median_lap_time: 0,
      rank: 5,
      reaction_time: 0,
      gap_leader: 0,
      gap_position: 0,
      fuelLevel: 100,
      seed: 5,
      team: { name: "Yoshi Island", driverIds: ["d5"] },
    } as unknown as RaceParticipant,
    {
      id: "p6",
      objectId: "p6",
      driver: new Driver(
        "d6",
        "Donkey Kong",
        "DK",
        "https://api.dicebear.com/7.x/pixel-art/svg?seed=DK",
      ),
      lane: 2,
      total_time: 0,
      lap_count: 0,
      last_lap_time: 0,
      best_lap_time: 0,
      average_lap_time: 0,
      median_lap_time: 0,
      rank: 6,
      reaction_time: 0,
      gap_leader: 0,
      gap_position: 0,
      fuelLevel: 100,
      seed: 6,
      team: { name: "DK Crew", driverIds: ["d6"] },
    } as unknown as RaceParticipant,
    {
      id: "p7",
      objectId: "p7",
      driver: new Driver(
        "d7",
        "Wario",
        "Greedy",
        "https://api.dicebear.com/7.x/pixel-art/svg?seed=Wario",
      ),
      lane: 3,
      total_time: 0,
      lap_count: 0,
      last_lap_time: 0,
      best_lap_time: 0,
      average_lap_time: 0,
      median_lap_time: 0,
      rank: 7,
      reaction_time: 0,
      gap_leader: 0,
      gap_position: 0,
      fuelLevel: 100,
      seed: 7,
      team: { name: "Wario Land", driverIds: ["d7"] },
    } as unknown as RaceParticipant,
    {
      id: "p8",
      objectId: "p8",
      driver: new Driver(
        "d8",
        "Waluigi",
        "Purple",
        "https://api.dicebear.com/7.x/pixel-art/svg?seed=Waluigi",
      ),
      lane: 4,
      total_time: 0,
      lap_count: 0,
      last_lap_time: 0,
      best_lap_time: 0,
      average_lap_time: 0,
      median_lap_time: 0,
      rank: 8,
      reaction_time: 0,
      gap_leader: 0,
      gap_position: 0,
      fuelLevel: 100,
      seed: 8,
      team: { name: "Waluigi Pinball", driverIds: ["d8"] },
    } as unknown as RaceParticipant,
  ];
}
