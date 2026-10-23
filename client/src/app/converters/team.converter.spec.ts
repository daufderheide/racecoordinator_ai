import { ITeamModel } from "@app/proto/antigravity";

import { TeamConverter } from "./team.converter";

describe("TeamConverter", () => {
  beforeEach(() => {
    TeamConverter.clearCache();
  });

  it("should convert proto to Team object", () => {
    const proto: ITeamModel = {
      model: { entityId: "t1" },
      name: "Team Alpha",
      avatarUrl: "avatar_url",
      driverIds: ["d1", "d2"],
      labelIds: ["lbl1", "lbl2"],
    };

    const team = TeamConverter.fromProto(proto);
    expect(team.entity_id).toBe("t1");
    expect(team.name).toBe("Team Alpha");
    expect(team.avatarUrl).toBe("avatar_url");
    expect(team.driverIds).toEqual(["d1", "d2"]);
    expect(team.labelIds).toEqual(["lbl1", "lbl2"]);
  });

  it("should update cached instance with new labelIds", () => {
    const proto1: ITeamModel = {
      model: { entityId: "t1" },
      name: "Team Alpha",
      labelIds: ["lbl1"],
    };
    const team1 = TeamConverter.fromProto(proto1);
    expect(team1.labelIds).toEqual(["lbl1"]);

    const proto2: ITeamModel = {
      model: { entityId: "t1" },
      name: "Team Alpha Updated",
      labelIds: ["lbl1", "lbl2"],
    };
    const team2 = TeamConverter.fromProto(proto2);
    expect(team2).toBe(team1);
    expect(team2.name).toBe("Team Alpha Updated");
    expect(team2.labelIds).toEqual(["lbl1", "lbl2"]);
  });

  it("should handle references from cache", () => {
    const proto: ITeamModel = {
      model: { entityId: "t1" },
      name: "Team Alpha",
    };
    TeamConverter.fromProto(proto);

    const refProto: ITeamModel = {
      model: { entityId: "t1" },
      // No name, so it's a reference
    };

    const team = TeamConverter.fromProto(refProto);
    expect(team.name).toBe("Team Alpha");
  });

  describe("fromJSON", () => {
    it("should convert JSON object to Team with labelIds", () => {
      const json = {
        entity_id: "t1",
        name: "Team Speed",
        avatarUrl: "speed.png",
        driverIds: ["d1", "d2"],
        labelIds: ["lbl-1", "lbl-2"],
      };

      const team = TeamConverter.fromJSON(json);
      expect(team.entity_id).toBe("t1");
      expect(team.name).toBe("Team Speed");
      expect(team.avatarUrl).toBe("speed.png");
      expect(team.driverIds).toEqual(["d1", "d2"]);
      expect(team.labelIds).toEqual(["lbl-1", "lbl-2"]);
    });

    it("should support label_ids and driver_ids in JSON", () => {
      const json = {
        entityId: "t2",
        name: "Team Velocity",
        driver_ids: ["d3"],
        label_ids: ["lbl-3"],
      };

      const team = TeamConverter.fromJSON(json);
      expect(team.entity_id).toBe("t2");
      expect(team.name).toBe("Team Velocity");
      expect(team.driverIds).toEqual(["d3"]);
      expect(team.labelIds).toEqual(["lbl-3"]);
    });

    it("should update existing cached instance on fromJSON", () => {
      const json1 = {
        entity_id: "t3",
        name: "Team Initial",
        driverIds: ["d1"],
        labelIds: ["lbl-1"],
      };
      const team1 = TeamConverter.fromJSON(json1);

      const json2 = {
        entity_id: "t3",
        name: "Team Updated",
        driverIds: ["d1", "d2"],
        labelIds: ["lbl-1", "lbl-2"],
      };
      const team2 = TeamConverter.fromJSON(json2);

      expect(team2).toBe(team1);
      expect(team2.name).toBe("Team Updated");
      expect(team2.driverIds).toEqual(["d1", "d2"]);
      expect(team2.labelIds).toEqual(["lbl-1", "lbl-2"]);
    });
  });

  describe("register", () => {
    it("should update existing cached instance or add new one", () => {
      const team1 = TeamConverter.fromJSON({
        entity_id: "t4",
        name: "Original",
        labelIds: ["lbl-a"],
      });
      expect(team1.name).toBe("Original");

      const updated = TeamConverter.fromJSON({
        entity_id: "t4",
        name: "Updated",
        labelIds: ["lbl-b"],
      });
      TeamConverter.register(updated);

      expect(TeamConverter.get("t4")?.name).toBe("Updated");
      expect(TeamConverter.get("t4")?.labelIds).toEqual(["lbl-b"]);
    });
  });
});
