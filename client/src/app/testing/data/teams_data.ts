import { Team } from "../../models/team";

export const MOCK_TEAMS = [
  {
    entity_id: "t1",
    name: "Team Alpha",
    avatarUrl: "",
    driverIds: ["d1", "d2"],
  },
  {
    entity_id: "t2",
    name: "Team Beta",
    avatarUrl: "",
    driverIds: ["d3", "d4"],
  },
];

export const MOCK_TEAM_INSTANCES = MOCK_TEAMS.map(
  (t: any) =>
    new Team(t.entity_id, t.name, t.avatarUrl, t.driverIds, t.labelIds || []),
);
