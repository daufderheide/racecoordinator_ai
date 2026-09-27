import { TrajectoryReferenceHelper } from "@app/components/shared/ghost-trajectory-dialog/trajectory-reference.helper";
import { Driver } from "@app/models/driver";
import { RaceParticipant } from "@app/models/race_participant";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { Heat } from "@app/race/heat";

describe("TrajectoryReferenceHelper", () => {
  function createDriver(id: string, name: string, nickname = ""): Driver {
    return new Driver(id, name, nickname);
  }

  function createParticipant(
    id: string,
    driver: Driver,
    rank = 1,
  ): RaceParticipant {
    return new RaceParticipant(id, driver, rank, 0, 0, 0, 0, 0, 0, 1, 100);
  }

  function createHeatWithLaps(
    heatId: string,
    heatNumber: number,
    driversData: { driver: Driver; laps: number[]; rank?: number }[],
    standings: string[] = [],
  ): Heat {
    const heatDrivers: DriverHeatData[] = driversData.map((d, index) => {
      const participant = createParticipant(
        `p_${d.driver.entity_id}`,
        d.driver,
        d.rank ?? index + 1,
      );
      const hd = new DriverHeatData(
        `hd_${d.driver.entity_id}`,
        participant,
        index,
        d.driver,
      );
      if (d.rank !== undefined) {
        hd.rank = d.rank;
      }
      d.laps.forEach((lap, i) => {
        hd.addLapTime(i + 1, lap, lap, lap, lap, i + 1);
      });
      return hd;
    });
    return new Heat(heatId, heatNumber, heatDrivers, standings);
  }

  describe("addHeatDriverEntityIds and isLiveCompetitor", () => {
    it("should extract all driver and participant entity IDs into the set", () => {
      const driver = createDriver("d1", "Alice", "Ally");
      const participant = createParticipant("p1", driver);
      const hd = new DriverHeatData("hd1", participant, 0, driver);
      const ids = new Set<string>();

      TrajectoryReferenceHelper.addHeatDriverEntityIds(hd, ids);

      expect(ids.has("hd1")).toBeTrue();
      expect(ids.has("p1")).toBeTrue();
      expect(ids.has("d1")).toBeTrue();
      expect(
        TrajectoryReferenceHelper.isLiveCompetitor(
          undefined,
          hd,
          participant,
          ids,
        ),
      ).toBeTrue();
    });

    it("should return false when competitor is not in liveIds", () => {
      const driver2 = createDriver("d2", "Bob");
      const participant2 = createParticipant("p2", driver2);
      const hd2 = new DriverHeatData("hd2", participant2, 1, driver2);
      const ids = new Set<string>(["d1", "p1", "hd1"]);

      expect(
        TrajectoryReferenceHelper.isLiveCompetitor(
          undefined,
          hd2,
          participant2,
          ids,
        ),
      ).toBeFalse();
    });
  });

  describe("isValidCompetitorName", () => {
    it("should reject empty or placeholder names", () => {
      expect(TrajectoryReferenceHelper.isValidCompetitorName("")).toBeFalse();
      expect(
        TrajectoryReferenceHelper.isValidCompetitorName("   "),
      ).toBeFalse();
      expect(
        TrajectoryReferenceHelper.isValidCompetitorName("empty"),
      ).toBeFalse();
      expect(
        TrajectoryReferenceHelper.isValidCompetitorName("Empty Lane"),
      ).toBeFalse();
      expect(
        TrajectoryReferenceHelper.isValidCompetitorName("(empty)"),
      ).toBeFalse();
    });

    it("should accept valid competitor names", () => {
      expect(
        TrajectoryReferenceHelper.isValidCompetitorName("Speedy"),
      ).toBeTrue();
      expect(
        TrajectoryReferenceHelper.isValidCompetitorName("Lane 1 Racer"),
      ).toBeTrue();
    });
  });

  describe("sortHeatDrivers", () => {
    it("should sort drivers by standings array if provided", () => {
      const d1 = createDriver("d1", "One");
      const d2 = createDriver("d2", "Two");
      const heat = createHeatWithLaps(
        "h1",
        1,
        [
          { driver: d1, laps: [3.0] },
          { driver: d2, laps: [3.0] },
        ],
        ["hd_d2", "hd_d1"],
      );

      const sorted = TrajectoryReferenceHelper.sortHeatDrivers(heat);
      expect(sorted[0].objectId).toBe("hd_d2");
      expect(sorted[1].objectId).toBe("hd_d1");
    });

    it("should sort drivers by rank when standings are absent", () => {
      const d1 = createDriver("d1", "One");
      const d2 = createDriver("d2", "Two");
      const heat = createHeatWithLaps("h1", 1, [
        { driver: d1, laps: [3.0], rank: 2 },
        { driver: d2, laps: [3.0], rank: 1 },
      ]);

      const sorted = TrajectoryReferenceHelper.sortHeatDrivers(heat);
      expect(sorted[0].objectId).toBe("hd_d2");
      expect(sorted[1].objectId).toBe("hd_d1");
    });

    it("should tiebreak by laps descending and total time ascending", () => {
      const d1 = createDriver("d1", "One");
      const d2 = createDriver("d2", "Two");
      const heat = createHeatWithLaps("h1", 1, [
        { driver: d1, laps: [3.0, 3.2] }, // 2 laps, 6.2s
        { driver: d2, laps: [2.9] }, // 1 lap, 2.9s
      ]);

      const sorted = TrajectoryReferenceHelper.sortHeatDrivers(heat);
      expect(sorted[0].objectId).toBe("hd_d1"); // more laps
      expect(sorted[1].objectId).toBe("hd_d2");
    });
  });

  describe("buildHeatReferenceOptions", () => {
    it("should build reference options excluding the current driver", () => {
      const d1 = createDriver("d1", "Dave", "SpeedyDave");
      const d2 = createDriver("d2", "Abby", "Abs");
      const d3 = createDriver("d3", "Bob", "Bobby");
      const heat = createHeatWithLaps("h1", 1, [
        { driver: d1, laps: [3.8, 4.0] },
        { driver: d2, laps: [3.9, 4.1] },
        { driver: d3, laps: [4.2, 4.3] },
      ]);

      const liveIds = new Set<string>();
      TrajectoryReferenceHelper.addHeatDriverEntityIds(
        heat.heatDrivers[0],
        liveIds,
      );

      const refOptions = TrajectoryReferenceHelper.buildHeatReferenceOptions(
        heat,
        heat.heatDrivers[0],
        liveIds,
      );

      expect(refOptions.length).toBe(2);
      expect(refOptions[0].id).toBe("d2");
      expect(refOptions[0].name).toBe("Abs");
      expect(refOptions[0].lapTimes).toEqual([3.9, 4.1]);
      expect(refOptions[1].id).toBe("d3");
      expect(refOptions[1].name).toBe("Bobby");
    });
  });

  describe("overall reference helpers", () => {
    it("should aggregate lap times for a competitor across heats", () => {
      const d1 = createDriver("d1", "Dave");
      const heat1 = createHeatWithLaps("h1", 1, [
        { driver: d1, laps: [3.5, 3.6] },
      ]);
      const heat2 = createHeatWithLaps("h2", 2, [
        { driver: d1, laps: [3.4, 3.7] },
      ]);

      const laps = TrajectoryReferenceHelper.getOverallDriverLapTimes(
        [heat1, heat2],
        "d1",
      );
      expect(laps).toEqual([3.5, 3.6, 3.4, 3.7]);
    });
  });
});
