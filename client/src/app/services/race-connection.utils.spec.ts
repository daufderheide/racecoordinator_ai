import { IRace, IStandingsUpdate, LapType } from "@app/proto/antigravity";

import { RaceConnectionUtils } from "./race-connection.utils";

describe("RaceConnectionUtils", () => {
  describe("syncParticipantsToHeatDrivers", () => {
    it("should do nothing if heatDrivers or participants is empty/undefined", () => {
      expect(() =>
        RaceConnectionUtils.syncParticipantsToHeatDrivers([], []),
      ).not.toThrow();
      expect(() =>
        RaceConnectionUtils.syncParticipantsToHeatDrivers(undefined as any, []),
      ).not.toThrow();
      expect(() =>
        RaceConnectionUtils.syncParticipantsToHeatDrivers([], undefined as any),
      ).not.toThrow();
    });

    it("should match driver by objectId and update overall gap and rank fields", () => {
      const hd: any = {
        objectId: "obj-1",
        participant: { objectId: "obj-1", fuelLevel: 50 },
      };
      const participant: any = {
        objectId: "obj-1",
        rank: 2,
        gapLeader: 0.5,
        gapPosition: 0.3,
        gapLeaderF1: 0.5,
        gapPositionF1: 0.3,
        gapLeaderLaps: 1.0,
        gapPositionLaps: 0.5,
        lapsDownLeader: 1,
        lapsDownPosition: 0,
        fuelLevel: 80,
      };

      RaceConnectionUtils.syncParticipantsToHeatDrivers([hd], [participant]);

      expect(hd.overallRank).toBe(2);
      expect(hd.overallGapLeader).toBe(0.5);
      expect(hd.overallGapPosition).toBe(0.3);
      expect(hd.participant.fuelLevel).toBe(80);
    });

    it("should fall back to driver entity_id or name matching if objectId is not matched", () => {
      const hd: any = {
        driver: { entity_id: "driver-1", name: "Mario" },
        participant: {},
      };
      const participant: any = {
        driver: { entity_id: "driver-1", name: "Mario" },
        rank: 1,
        gapLeader: 0,
        gapPosition: 0,
      };

      RaceConnectionUtils.syncParticipantsToHeatDrivers([hd], [participant]);

      expect(hd.overallRank).toBe(1);
      expect(hd.overallGapLeader).toBe(0);
    });

    it("should fall back to teamId if driver does not match", () => {
      const hd: any = {
        participant: { team: { entity_id: "team-red" } },
      };
      const participant: any = {
        team: { entity_id: "team-red" },
        rank: 3,
        gapLeader: 1.2,
      };

      RaceConnectionUtils.syncParticipantsToHeatDrivers([hd], [participant]);

      expect(hd.overallRank).toBe(3);
      expect(hd.overallGapLeader).toBe(1.2);
    });
  });

  describe("mergeRaceUpdates", () => {
    it("should return incoming if existing is null", () => {
      const incoming: IRace = { eventId: "race-1" };
      expect(RaceConnectionUtils.mergeRaceUpdates(null, incoming)).toBe(
        incoming,
      );
    });

    it("should merge incoming properties over existing", () => {
      const existing: IRace = {
        eventId: "race-1",
        state: 1,
        drivers: [{ objectId: "d1" } as any],
      };
      const incoming: IRace = {
        eventId: "race-1",
        state: 2,
        currentHeat: { heatNumber: 2 } as any,
      };

      const result = RaceConnectionUtils.mergeRaceUpdates(existing, incoming);
      expect(result.state).toBe(2);
      expect(result.currentHeat?.heatNumber).toBe(2);
      expect(result.drivers?.length).toBe(1);
    });
  });

  describe("decorateRaceWithMetadata", () => {
    it("should attach event metadata if update is an event", () => {
      const race: any = {};
      const update: IRace = {
        isEvent: true,
        eventId: "event-123",
        eventName: "Championship",
        currentEventRaceIndex: 2,
        totalEventRaces: 5,
        autoAdvanceRemainingSeconds: 10,
      };

      RaceConnectionUtils.decorateRaceWithMetadata(race, update);
      expect(race.is_event).toBe(true);
      expect(race.event_name).toBe("Championship");
      expect(race.current_event_race_index).toBe(2);
    });

    it("should attach season metadata and start_time_millis", () => {
      const race: any = {};
      const update: IRace = {
        isSeason: true,
        seasonId: "s-1",
        seasonName: "2026 Season",
        startTimeMillis: 1700000000000,
      };

      RaceConnectionUtils.decorateRaceWithMetadata(race, update);
      expect(race.is_season).toBe(true);
      expect(race.season_name).toBe("2026 Season");
      expect(race.start_time_millis).toBe(1700000000000);
    });
  });

  describe("applyStandingsUpdate", () => {
    it("should update heat.standings and driverRankings map", () => {
      const heat: any = {
        heatDrivers: [
          { objectId: "d1", rank: 0 },
          { objectId: "d2", rank: 0 },
        ],
      };
      const update: IStandingsUpdate = {
        updates: [
          { objectId: "d1", rank: 1, gapLeader: 0, gapPosition: 0 },
          { objectId: "d2", rank: 2, gapLeader: 0.5, gapPosition: 0.5 },
        ],
      };
      const driverRankings = new Map<string, number>();

      RaceConnectionUtils.applyStandingsUpdate(update, heat, driverRankings);

      expect(heat.standings).toEqual(["d1", "d2"]);
      expect(driverRankings.get("d1")).toBe(1);
      expect(driverRankings.get("d2")).toBe(2);
      expect(heat.heatDrivers[0].rank).toBe(1);
      expect(heat.heatDrivers[1].gapLeader).toBe(0.5);
    });
  });

  describe("syncTargetHeat", () => {
    it("should do nothing if allHeats is empty or null", () => {
      expect(() =>
        RaceConnectionUtils.syncTargetHeat(
          {},
          [],
          {},
          {},
          false,
          [],
          undefined,
        ),
      ).not.toThrow();
    });

    it("should sync lap to target driver in allHeats if not already same instance", () => {
      const addLapSpy = jasmine.createSpy("addLapTime");
      const targetDriver: any = {
        objectId: "target-d",
        addLapTime: addLapSpy,
        participant: {},
      };
      const allHeats = [
        {
          heatNumber: 1,
          heatDrivers: [targetDriver],
        },
      ];
      const lap = {
        objectId: "target-d",
        lapNumber: 5,
        lapTime: 4.2,
        averageLapTime: 4.5,
        medianLapTime: 4.4,
        bestLapTime: 4.2,
        adjustedLapCount: 5,
        fuelLevel: 75,
        type: LapType.LAP,
      };

      RaceConnectionUtils.syncTargetHeat(
        { heatNumber: 1 },
        allHeats,
        lap,
        { objectId: "other-d" },
        false,
        [],
        undefined,
      );

      expect(addLapSpy).toHaveBeenCalled();
      expect(targetDriver.participant.fuelLevel).toBe(75);
    });
  });
});
