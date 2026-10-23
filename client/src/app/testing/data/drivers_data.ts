import { Driver } from "../../models/driver";

export const MOCK_DRIVERS = [
  {
    entity_id: "d1",
    name: "Alice",
    nickname: "The Rocket",
    avatarUrl: "assets/images/default_avatar.svg",
    lapSoundUrl: "",
    bestLapSoundUrl: "",
    lapSoundType: "preset",
    bestLapSoundType: "preset",
    lapSoundText: "",
    bestLapSoundText: "",
  },
  {
    entity_id: "d2",
    name: "Bob",
    nickname: "Drift King",
    avatarUrl: "assets/images/default_avatar.svg",
    lapSoundUrl: "",
    bestLapSoundUrl: "",
  },
  {
    entity_id: "d3",
    name: "Charlie",
    nickname: "Speedy",
    avatarUrl: "assets/images/default_avatar.svg",
  },
  {
    entity_id: "d4",
    name: "Dave",
    nickname: "Noob",
    avatarUrl: "assets/images/default_avatar.svg",
  },
];

export const MOCK_DRIVER_INSTANCES = MOCK_DRIVERS.map(
  (d: any) =>
    new Driver(
      d.entity_id,
      d.name,
      d.nickname || "",
      d.avatarUrl,
      d.lapSoundUrl,
    ),
);

export const MOCK_DRIVER_LABELS = [
  {
    entity_id: "lbl-pro",
    name: "Pro",
    color: "#e11d48",
  },
  {
    entity_id: "lbl-amateur",
    name: "Amateur",
    color: "#2563eb",
  },
  {
    entity_id: "lbl-rookie",
    name: "Rookie",
    color: "#16a34a",
  },
];
