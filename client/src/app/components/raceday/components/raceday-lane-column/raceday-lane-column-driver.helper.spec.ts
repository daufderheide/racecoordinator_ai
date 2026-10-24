import { DriverHeatData } from "@app/race/driver_heat_data";

import {
  getCachedOverallParticipants,
  getCachedSortedHeatDriversByOverallRank,
  getCachedSortedHeatDriversByRank,
  getCachedSortedHeatDriversBySeed,
  getDriverOverallRank,
  getParticipantHeatLane,
  getParticipantHeatRank,
  isOverallDataSource,
  isOverallOrSeedDataSource,
  isParentGridOverall,
  isParentGridSeed,
  isParentRaceOver,
  resolveHeatDriverByPosition,
  resolveHeatGridDriver,
  resolveOverallGridDriver,
  resolveStandaloneDriver,
  resolveTargetDriver,
} from "./raceday-lane-column-driver.helper";

describe("raceday-lane-column-driver.helper", () => {
  let mockDrivers: DriverHeatData[];
  let mockParticipants: any[];
  let mockParent: any;

  beforeEach(() => {
    mockDrivers = [
      new DriverHeatData("d1", { objectId: "p1", rank: 3, seed: 2 } as any, 0, {
        entity_id: "e1",
        name: "Driver 1",
      } as any),
      new DriverHeatData("d2", { objectId: "p2", rank: 1, seed: 1 } as any, 1, {
        entity_id: "e2",
        name: "Driver 2",
      } as any),
      new DriverHeatData("d3", { objectId: "p3", rank: 2, seed: 3 } as any, 2, {
        entity_id: "e3",
        name: "Driver 3",
      } as any),
    ];

    mockParticipants = [
      {
        objectId: "p1",
        rank: 3,
        seed: 2,
        driver: { entity_id: "e1", name: "Driver 1" },
      },
      {
        objectId: "p2",
        rank: 1,
        seed: 1,
        driver: { entity_id: "e2", name: "Driver 2" },
      },
      {
        objectId: "p3",
        rank: 2,
        seed: 3,
        driver: { entity_id: "e3", name: "Driver 3" },
      },
    ];

    mockParent = {
      participants: mockParticipants,
      heatDrivers: mockDrivers,
      driverRankings: new Map<string, number>([
        ["d1", 2],
        ["d2", 1],
        ["d3", 3],
      ]),
      heat: {
        objectId: "h1",
        standings: ["d2", "d1", "d3"],
      },
    };
  });

  describe("getCachedOverallParticipants", () => {
    it("should return participants as-is for overallPosition", () => {
      const result = getCachedOverallParticipants(
        mockParent,
        mockDrivers,
        "overallPosition",
      );
      expect(result).toBe(mockParticipants);
    });

    it("should sort participants by seed for seed mode", () => {
      const result = getCachedOverallParticipants(
        mockParent,
        mockDrivers,
        "seed",
      );
      expect(result.map((p) => p.seed)).toEqual([1, 2, 3]);
    });

    it("should sort participants by heat position for position mode", () => {
      const result = getCachedOverallParticipants(
        mockParent,
        mockDrivers,
        "position",
      );
      // driverRankings: d2=1 (p2), d1=2 (p1), d3=3 (p3)
      expect(result.map((p) => p.objectId)).toEqual(["p2", "p1", "p3"]);
    });

    it("should sort participants by heat lane for default lane mode", () => {
      const result = getCachedOverallParticipants(
        mockParent,
        mockDrivers,
        "lane",
      );
      // laneIndex: d1=0 (p1), d2=1 (p2), d3=2 (p3)
      expect(result.map((p) => p.objectId)).toEqual(["p1", "p2", "p3"]);
    });

    it("should memoize sorted results on repeated calls with identical references", () => {
      const first = getCachedOverallParticipants(
        mockParent,
        mockDrivers,
        "seed",
      );
      const second = getCachedOverallParticipants(
        mockParent,
        mockDrivers,
        "seed",
      );
      expect(first).toBe(second);
    });

    it("should re-sort when participants reference changes", () => {
      const first = getCachedOverallParticipants(
        mockParent,
        mockDrivers,
        "seed",
      );
      mockParent.participants = [...mockParticipants];
      const second = getCachedOverallParticipants(
        mockParent,
        mockDrivers,
        "seed",
      );
      expect(first).not.toBe(second);
      expect(second.map((p: any) => p.seed)).toEqual([1, 2, 3]);
    });

    it("should return empty array gracefully when parent is null or empty", () => {
      expect(getCachedOverallParticipants(null, mockDrivers, "lane")).toEqual(
        [],
      );
      expect(
        getCachedOverallParticipants({ participants: [] }, mockDrivers, "lane"),
      ).toEqual([]);
    });
  });

  describe("getCachedSortedHeatDriversByRank", () => {
    it("should sort heat drivers by parent.driverRankings", () => {
      const sorted = getCachedSortedHeatDriversByRank(mockDrivers, mockParent);
      expect(sorted.map((d) => d.objectId)).toEqual(["d2", "d1", "d3"]);
    });

    it("should sort heat drivers by heat.standings when driverRankings are absent", () => {
      const parentWithoutRankings = {
        heat: { standings: ["d3", "d2", "d1"] },
      };
      const sorted = getCachedSortedHeatDriversByRank(
        mockDrivers,
        parentWithoutRankings,
      );
      expect(sorted.map((d) => d.objectId)).toEqual(["d3", "d2", "d1"]);
      expect(
        resolveHeatDriverByPosition(mockDrivers, parentWithoutRankings, 0)
          ?.objectId,
      ).toBe("d3");
    });

    it("should sort heat drivers by lapCount and totalTime when neither rankings nor standings exist", () => {
      const dA = new DriverHeatData("da", null as any, 0, null as any);
      dA.adjustedLapCount = 10;
      dA.totalTime = 5000;
      const dB = new DriverHeatData("db", null as any, 1, null as any);
      dB.adjustedLapCount = 10;
      dB.totalTime = 4500;
      const dC = new DriverHeatData("dc", null as any, 2, null as any);
      dC.adjustedLapCount = 8;
      dC.totalTime = 4000;

      const sorted = getCachedSortedHeatDriversByRank([dA, dB, dC], {});
      expect(sorted.map((d) => d.objectId)).toEqual(["db", "da", "dc"]);
    });

    it("should memoize sorted heat drivers across calls", () => {
      const first = getCachedSortedHeatDriversByRank(mockDrivers, mockParent);
      const second = getCachedSortedHeatDriversByRank(mockDrivers, mockParent);
      expect(first).toBe(second);
    });
  });

  describe("getCachedSortedHeatDriversByOverallRank", () => {
    it("should sort heat drivers by driver overall rank and lane index", () => {
      const sorted = getCachedSortedHeatDriversByOverallRank(
        mockDrivers,
        mockParent,
      );
      // Overall rank: d2=p2(1), d3=p3(2), d1=p1(3)
      expect(sorted.map((d) => d.objectId)).toEqual(["d2", "d3", "d1"]);
    });
  });

  describe("getCachedSortedHeatDriversBySeed", () => {
    it("should sort heat drivers by seed and lane index", () => {
      const sorted = getCachedSortedHeatDriversBySeed(mockDrivers, mockParent);
      // Seed: d2=p2(1), d1=p1(2), d3=p3(3)
      expect(sorted.map((d) => d.objectId)).toEqual(["d2", "d1", "d3"]);
    });
  });

  describe("isParentGridOverall", () => {
    it("should return false if gridId is missing", () => {
      expect(isParentGridOverall(mockParent, undefined)).toBeFalse();
      expect(isParentGridOverall(mockParent, "")).toBeFalse();
    });

    it("should call parent.isGridOverall if available", () => {
      mockParent.isGridOverall = jasmine
        .createSpy("isGridOverall")
        .and.returnValue(true);
      expect(isParentGridOverall(mockParent, "grid-1")).toBeTrue();
      expect(mockParent.isGridOverall).toHaveBeenCalledWith("grid-1");
    });

    it("should return true if gridSession declared overall", () => {
      const parent = { gridSession: () => ({ gridType: "overall" }) };
      expect(isParentGridOverall(parent, "grid-1")).toBeTrue();
    });

    it("should return false if gridSession declared heat", () => {
      const parent = { gridSession: () => ({ gridType: "heat" }) };
      expect(isParentGridOverall(parent, "grid-1")).toBeFalse();
    });

    it("should return false if layout widgets declare heat grid even with overall columnKey", () => {
      const parent = {
        layout: {
          widgets: [
            {
              customSettings: {
                gridId: "grid-1",
                gridType: "heat",
                columnKey: "overallLapCount",
              },
            },
          ],
        },
      };
      expect(isParentGridOverall(parent, "grid-1")).toBeFalse();
    });

    it("should return true if layout widgets declare overall grid", () => {
      const parent = {
        layout: {
          widgets: [
            { customSettings: { gridId: "grid-1", gridType: "overall" } },
          ],
        },
      };
      expect(isParentGridOverall(parent, "grid-1")).toBeTrue();
      expect(isParentGridOverall(parent, "grid-2")).toBeFalse();
    });
  });

  describe("getDriverOverallRank", () => {
    it("should use parent.getDriverOverallRanking if defined", () => {
      mockParent.getDriverOverallRanking = jasmine
        .createSpy("getRank")
        .and.returnValue(4);
      expect(getDriverOverallRank(mockDrivers[0], mockParent)).toBe(4);
    });

    it("should find rank from participants if match exists", () => {
      expect(getDriverOverallRank(mockDrivers[0], mockParent)).toBe(3);
      expect(getDriverOverallRank(mockDrivers[1], mockParent)).toBe(1);
    });

    it("should return 999 if driver is null", () => {
      expect(getDriverOverallRank(null as any, mockParent)).toBe(999);
    });
  });

  describe("getParticipantHeatRank & getParticipantHeatLane", () => {
    it("should return participant's heat rank and lane", () => {
      expect(
        getParticipantHeatRank(mockParticipants[0], mockDrivers, mockParent),
      ).toBe(2);
      expect(getParticipantHeatLane(mockParticipants[0], mockDrivers)).toBe(0);

      expect(
        getParticipantHeatRank(
          { objectId: "unknown" },
          mockDrivers,
          mockParent,
        ),
      ).toBe(999);
      expect(getParticipantHeatLane({ objectId: "unknown" }, mockDrivers)).toBe(
        999,
      );
    });
  });

  describe("resolveOverallGridDriver", () => {
    it("should resolve overall position using cached rankMap", () => {
      const dRank1 = resolveOverallGridDriver(
        mockDrivers,
        mockParent,
        "overallPosition",
        0,
        (p) => new DriverHeatData(p.objectId, p, -1, p.driver),
      );
      expect(dRank1?.objectId).toBe("d2"); // p2 has rank 1

      const dRank2 = resolveOverallGridDriver(
        mockDrivers,
        mockParent,
        "overallPosition",
        1,
        (p) => new DriverHeatData(p.objectId, p, -1, p.driver),
      );
      expect(dRank2?.objectId).toBe("d3"); // p3 has rank 2
    });

    it("should resolve seed position using cached seedMap", () => {
      const dSeed1 = resolveOverallGridDriver(
        mockDrivers,
        mockParent,
        "seed",
        0,
        (p) => new DriverHeatData(p.objectId, p, -1, p.driver),
      );
      expect(dSeed1?.objectId).toBe("d2"); // p2 has seed 1
    });

    it("should return synthetic driver when race is over", () => {
      mockParent.isRaceOver = () => true;
      const synthDriver = resolveOverallGridDriver(
        [],
        mockParent,
        "overallPosition",
        0,
        (p) => new DriverHeatData("synth-" + p.objectId, p, -1, p.driver),
      );
      expect(synthDriver?.objectId).toBe("synth-p2");
    });
  });

  describe("resolveHeatGridDriver", () => {
    it("should resolve lane, position, overallPosition, and seed in heat grid", () => {
      expect(
        resolveHeatGridDriver(mockDrivers, mockParent, "lane", 0)?.objectId,
      ).toBe("d1");
      expect(
        resolveHeatGridDriver(mockDrivers, mockParent, "position", 0)?.objectId,
      ).toBe("d2");
      expect(
        resolveHeatGridDriver(mockDrivers, mockParent, "overallPosition", 0)
          ?.objectId,
      ).toBe("d2");
      expect(
        resolveHeatGridDriver(mockDrivers, mockParent, "seed", 0)?.objectId,
      ).toBe("d2");
    });
  });

  describe("resolveStandaloneDriver", () => {
    it("should resolve standalone driver for lane, position, overallPosition, and seed", () => {
      expect(
        resolveStandaloneDriver(mockDrivers, mockParent, "lane", 0, (p) => p)
          ?.objectId,
      ).toBe("d1");
      expect(
        resolveStandaloneDriver(
          mockDrivers,
          mockParent,
          "position",
          0,
          (p) => p,
        )?.objectId,
      ).toBe("d2");
      expect(
        resolveStandaloneDriver(
          mockDrivers,
          mockParent,
          "overallPosition",
          0,
          (p) => p,
        )?.objectId,
      ).toBe("d2");
      expect(
        resolveStandaloneDriver(mockDrivers, mockParent, "seed", 0, (p) => p)
          ?.objectId,
      ).toBe("d2");
    });
  });

  describe("resolveTargetDriver", () => {
    it("should route to resolveStandaloneDriver when not a grid", () => {
      const settings = { bindingMode: "lane", targetIndex: 1 } as any;
      const d = resolveTargetDriver(
        settings,
        "lastLapTime",
        mockParent,
        (p) => p,
      );
      expect(d?.objectId).toBe("d2");
    });

    it("should route to resolveOverallGridDriver when grid is overall", () => {
      mockParent.isGridOverall = () => true;
      const settings = {
        gridId: "grid-1",
        bindingMode: "overallPosition",
        targetIndex: 0,
      } as any;
      const d = resolveTargetDriver(
        settings,
        "lastLapTime",
        mockParent,
        (p) => p,
      );
      expect(d?.objectId).toBe("d2");
    });

    it("should route to resolveHeatGridDriver when grid is heat", () => {
      mockParent.isGridOverall = () => false;
      const settings = {
        gridId: "grid-1",
        bindingMode: "lane",
        targetIndex: 2,
      } as any;
      const d = resolveTargetDriver(
        settings,
        "lastLapTime",
        mockParent,
        (p) => p,
      );
      expect(d?.objectId).toBe("d3");
    });
  });

  describe("isOverallDataSource & isParentRaceOver", () => {
    it("should evaluate isOverallDataSource correctly", () => {
      expect(isOverallDataSource(undefined)).toBeFalse();
      expect(isOverallDataSource({ gridType: "overall" } as any)).toBeTrue();
      expect(isOverallDataSource({ gridType: "heat" } as any)).toBeFalse();
    });

    it("should evaluate isParentRaceOver correctly", () => {
      expect(isParentRaceOver(null)).toBeFalse();
      expect(isParentRaceOver({ isRaceOver: () => true })).toBeTrue();
    });

    it("should evaluate isParentGridSeed correctly", () => {
      expect(isParentGridSeed(null, "grid-1")).toBeFalse();
      expect(isParentGridSeed({}, undefined)).toBeFalse();
      expect(isParentGridSeed({ isGridSeed: () => true }, "grid-1")).toBeTrue();
      expect(
        isParentGridSeed(
          { gridSession: () => ({ bindingMode: "seed" }) },
          "grid-1",
        ),
      ).toBeTrue();
      expect(
        isParentGridSeed(
          { activeGridSession: { bindingMode: "seed" } },
          "grid-1",
        ),
      ).toBeTrue();
      expect(
        isParentGridSeed(
          {
            layout: {
              widgets: [
                { customSettings: { gridId: "grid-1", bindingMode: "seed" } },
              ],
            },
          },
          "grid-1",
        ),
      ).toBeTrue();
      expect(
        isParentGridSeed(
          {
            layout: {
              widgets: [
                { customSettings: { gridId: "grid-1", bindingMode: "lane" } },
              ],
            },
          },
          "grid-1",
        ),
      ).toBeFalse();
    });

    it("should evaluate isOverallOrSeedDataSource correctly", () => {
      expect(isOverallOrSeedDataSource(undefined)).toBeFalse();
      expect(
        isOverallOrSeedDataSource({ bindingMode: "seed" } as any),
      ).toBeTrue();
      expect(
        isOverallOrSeedDataSource({} as any, undefined, "seed"),
      ).toBeTrue();
      expect(
        isOverallOrSeedDataSource({ gridId: "grid-seed" } as any, {
          isGridSeed: (id: string) => id === "grid-seed",
        }),
      ).toBeTrue();
      expect(
        isOverallOrSeedDataSource({ gridType: "overall" } as any),
      ).toBeTrue();
      expect(
        isOverallOrSeedDataSource({ gridType: "heat" } as any),
      ).toBeFalse();
    });
  });
});
