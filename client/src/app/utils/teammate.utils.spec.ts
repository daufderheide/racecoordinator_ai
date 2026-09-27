import { DriverStatsLabels, TeammateUtils } from "./teammate.utils";

describe("TeammateUtils", () => {
  const labels: DriverStatsLabels = {
    heatAbbr: "H",
    lapAbbr: "L",
    totalAbbr: "T",
  };

  const driver1 = { entity_id: "d1", name: "Alice", nickname: "The Rocket" };
  const driver2 = { entity_id: "d2", name: "Bob", nickname: "Drift King" };
  const driver3 = { entity_id: "d3", name: "Charlie", nickname: "Lightning" };
  const allDrivers = [driver1, driver2, driver3];

  describe("isTeam", () => {
    it("should return true when hd has participant.team", () => {
      const hd = { participant: { team: { name: "Team 1" } } };
      expect(TeammateUtils.isTeam(hd)).toBeTrue();
    });

    it("should return true when hd has driver.team", () => {
      const hd = { driver: { team: { name: "Team 1" } } };
      expect(TeammateUtils.isTeam(hd)).toBeTrue();
    });

    it("should return true when hd has direct team property", () => {
      const hd = { team: { name: "Team 1" } };
      expect(TeammateUtils.isTeam(hd)).toBeTrue();
    });

    it("should return true when isPractice is true even without team", () => {
      const hd = { participant: {} };
      expect(TeammateUtils.isTeam(hd, true)).toBeTrue();
    });

    it("should return false when no team and not practice", () => {
      const hd = { participant: { driver: { name: "Solo" } } };
      expect(TeammateUtils.isTeam(hd, false)).toBeFalse();
      expect(TeammateUtils.isTeam(null)).toBeFalse();
    });
  });

  describe("getTeammates", () => {
    it("should return matching drivers from team.driverIds", () => {
      const hd = {
        participant: {
          team: {
            driverIds: ["d1", "d2"],
          },
        },
      };
      const result = TeammateUtils.getTeammates(hd, allDrivers);
      expect(result).toEqual([driver1, driver2]);
    });

    it("should support snake_case team.driver_ids", () => {
      const hd = {
        driver: {
          team: {
            driver_ids: ["d2", "d3"],
          },
        },
      };
      const result = TeammateUtils.getTeammates(hd, allDrivers);
      expect(result).toEqual([driver2, driver3]);
    });

    it("should filter out non-existent driver IDs", () => {
      const hd = {
        participant: {
          team: {
            driverIds: ["d1", "unknown_id"],
          },
        },
      };
      const result = TeammateUtils.getTeammates(hd, allDrivers);
      expect(result).toEqual([driver1]);
    });

    it("should return empty array if no team is found", () => {
      const hd = { participant: {} };
      expect(TeammateUtils.getTeammates(hd, allDrivers)).toEqual([]);
    });

    it("should handle practice mode returning empty lane and unique race drivers", () => {
      const participants = [
        { driver: { entity_id: "d1" } },
        { team: { driverIds: ["d2", "d3"] } },
      ];
      const result = TeammateUtils.getTeammates({}, allDrivers, {
        isPractice: true,
        participants,
        emptyLaneLabel: "Open Lane",
      });

      expect(result.length).toBe(4);
      expect(result[0].entity_id).toBe("EMPTY_LANE");
      expect(result[0].name).toBe("Open Lane");
      expect(result[1]).toEqual(driver1);
      expect(result[2]).toEqual(driver2);
      expect(result[3]).toEqual(driver3);
    });
  });

  describe("getDriverStats", () => {
    it("should return empty string if hd or driverId is missing", () => {
      expect(TeammateUtils.getDriverStats(null, "d1", [], labels)).toBe("");
      expect(TeammateUtils.getDriverStats({}, "", [], labels)).toBe("");
    });

    it("should calculate heat and total laps and times accurately", () => {
      const hd = {
        lapsWithDetails: [
          { driverId: "d1", time: 10.5 },
          { driverId: "d1", time: 11.2 },
          { driverId: "d2", time: 9.8 },
        ],
      };

      const heats = [
        {
          heatDrivers: [
            {
              lapsWithDetails: [
                { driverId: "d1", time: 12.0 },
                { driverId: "d1", time: 13.0 },
              ],
            },
          ],
        },
        {
          heatDrivers: [
            {
              lapsWithDetails: [
                { driverId: "d1", time: 10.5 },
                { driverId: "d1", time: 11.2 },
              ],
            },
          ],
        },
      ];

      // d1 heat: 2 laps, 21.7s
      // d1 total across heats: 4 laps, 46.7s
      const stats = TeammateUtils.getDriverStats(hd, "d1", heats, labels);
      expect(stats).toBe("(H: 2 L / 21.7s, T: 4 L / 46.7s)");
    });

    it("should format times >= 60 seconds as m:ss.s", () => {
      const hd = {
        lapsWithDetails: [{ driverId: "d1", time: 65.4 }],
      };

      const heats = [
        {
          heatDrivers: [
            {
              lapsWithDetails: [
                { driverId: "d1", time: 65.4 },
                { driverId: "d1", time: 60.0 },
              ],
            },
          ],
        },
      ];

      // 65.4s = 1:05.4
      // 125.4s = 2:05.4
      const stats = TeammateUtils.getDriverStats(hd, "d1", heats, labels);
      expect(stats).toBe("(H: 1 L / 1:05.4, T: 2 L / 2:05.4)");
    });
  });
});
