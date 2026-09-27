import { Driver } from "@app/models/driver";
import { ILap } from "@app/proto/antigravity";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { RaceParticipant } from "@app/race/race_participant";

import { DriverMatchingUtils } from "./driver-matching.utils";

describe("DriverMatchingUtils", () => {
  const driverA = new Driver("driver_a", "Alice", "Ally");
  const driverB = new Driver("driver_b", "Bob", "Bobby");

  const participantA = new RaceParticipant("part_a", driverA);
  const participantB = new RaceParticipant("part_b", driverB);

  let dhdLane0: DriverHeatData;
  let dhdLane1: DriverHeatData;

  beforeEach(() => {
    dhdLane0 = new DriverHeatData("dhd_0", participantA, 0, driverA);
    dhdLane1 = new DriverHeatData("dhd_1", participantB, 1, driverB);
  });

  it("should return undefined if drivers array is null, undefined, or empty", () => {
    const lap: ILap = { objectId: "dhd_0" };
    expect(DriverMatchingUtils.findDriverForLap(null, lap)).toBeUndefined();
    expect(
      DriverMatchingUtils.findDriverForLap(undefined, lap),
    ).toBeUndefined();
    expect(DriverMatchingUtils.findDriverForLap([], lap)).toBeUndefined();
  });

  it("should return undefined if lap is null or undefined", () => {
    expect(
      DriverMatchingUtils.findDriverForLap([dhdLane0, dhdLane1], null),
    ).toBeUndefined();
    expect(
      DriverMatchingUtils.findDriverForLap([dhdLane0, dhdLane1], undefined),
    ).toBeUndefined();
  });

  it("should match by exact DriverHeatData objectId (priority 1)", () => {
    const lap: ILap = {
      objectId: "dhd_1",
      interfaceId: 0, // conflicting interfaceId, objectId takes precedence
      driverId: "driver_a", // conflicting driverId, objectId takes precedence
    };
    const result = DriverMatchingUtils.findDriverForLap(
      [dhdLane0, dhdLane1],
      lap,
    );
    expect(result).toBe(dhdLane1);
  });

  it("should match by hardware lane interfaceId (priority 2) when objectId does not match", () => {
    const lap: ILap = {
      objectId: "unknown_id",
      interfaceId: 1,
    };
    const result = DriverMatchingUtils.findDriverForLap(
      [dhdLane0, dhdLane1],
      lap,
    );
    expect(result).toBe(dhdLane1);
  });

  it("should match by unique participant.objectId (priority 3) when objectId and interfaceId are absent", () => {
    const lap: ILap = {
      objectId: "part_b",
    };
    const result = DriverMatchingUtils.findDriverForLap(
      [dhdLane0, dhdLane1],
      lap,
    );
    expect(result).toBe(dhdLane1);
  });

  it("should match by unique driverId (priority 4) when higher priority fields are absent", () => {
    const lap: ILap = {
      driverId: "driver_b",
    };
    const result = DriverMatchingUtils.findDriverForLap(
      [dhdLane0, dhdLane1],
      lap,
    );
    expect(result).toBe(dhdLane1);
  });

  describe("Practice mode SingleHeatSoloAllLanes (same driver across all lanes)", () => {
    let soloLane0: DriverHeatData;
    let soloLane1: DriverHeatData;

    beforeEach(() => {
      // In SingleHeatSoloAllLanes, both lanes wrap the exact same participant and driver
      soloLane0 = new DriverHeatData("solo_dhd_0", participantA, 0, driverA);
      soloLane1 = new DriverHeatData("solo_dhd_1", participantA, 1, driverA);
    });

    it("should correctly resolve Lane 2 when starting in Lane 2 by exact objectId", () => {
      const lap: ILap = {
        objectId: "solo_dhd_1",
        interfaceId: 1,
        driverId: "driver_a",
      };
      const result = DriverMatchingUtils.findDriverForLap(
        [soloLane0, soloLane1],
        lap,
      );
      expect(result).toBe(soloLane1);
      expect(result).not.toBe(soloLane0);
    });

    it("should correctly resolve Lane 2 by interfaceId even if lap.objectId is absent", () => {
      const lap: ILap = {
        interfaceId: 1,
        driverId: "driver_a",
      };
      const result = DriverMatchingUtils.findDriverForLap(
        [soloLane0, soloLane1],
        lap,
      );
      expect(result).toBe(soloLane1);
      expect(result).not.toBe(soloLane0);
    });

    it("should NOT match Lane 1 when driverId matches multiple lanes and higher-priority IDs are missing", () => {
      // Both Lane 0 and Lane 1 have driver_a. Without objectId or interfaceId, it must NOT arbitrarily pick Lane 0.
      const lap: ILap = {
        driverId: "driver_a",
      };
      const result = DriverMatchingUtils.findDriverForLap(
        [soloLane0, soloLane1],
        lap,
      );
      expect(result).toBeUndefined();
    });

    it("should NOT match Lane 1 when participant objectId matches multiple lanes and higher-priority IDs are missing", () => {
      const lap: ILap = {
        objectId: "part_a",
      };
      const result = DriverMatchingUtils.findDriverForLap(
        [soloLane0, soloLane1],
        lap,
      );
      expect(result).toBeUndefined();
    });
  });
});
