import { IHeat } from "@app/proto/antigravity";

import { DriverConverter } from "./driver.converter";
import { HeatConverter } from "./heat.converter";

describe("HeatConverter", () => {
  beforeEach(() => {
    HeatConverter.clearCache();
    DriverConverter.clearCache();
  });

  it("should populate actualDriver when present in proto", () => {
    const proto: IHeat = {
      objectId: "heat1",
      heatNumber: 1,
      heatDrivers: [
        {
          objectId: "hd1",
          driver: {
            objectId: "p1",
            driver: { name: "Participant Driver" },
          },
          driverId: "d1",
          actualDriver: {
            name: "Actual Driver",
          },
        },
      ],
    };

    const heat = HeatConverter.fromProto(proto);
    expect(heat.heatDrivers.length).toBe(1);
    const driverData = heat.heatDrivers[0];

    expect(driverData.actualDriver).toBeDefined();
    expect(driverData.actualDriver?.name).toBe("Actual Driver");
    expect(driverData.driver.name).toBe("Actual Driver");
  });

  it("should fallback to participant driver when actualDriver is missing", () => {
    const proto: IHeat = {
      objectId: "heat1",
      heatNumber: 1,
      heatDrivers: [
        {
          objectId: "hd1",
          driver: {
            objectId: "p1",
            driver: { name: "Participant Driver" },
          },
          driverId: "d1",
          // No actualDriver
        },
      ],
    };

    const heat = HeatConverter.fromProto(proto);
    expect(heat.heatDrivers.length).toBe(1);
    const driverData = heat.heatDrivers[0];

    expect(driverData.actualDriver).toBeUndefined();
    expect(driverData.driver.name).toBe("Participant Driver");
  });
  it("should populate reactionTime and other performance metrics", () => {
    const proto: IHeat = {
      objectId: "heat1",
      heatNumber: 1,
      heatDrivers: [
        {
          objectId: "hd1",
          driver: {
            objectId: "p1",
            driver: { name: "Driver 1" },
          },
          reactionTime: 0.75,
          gapLeader: 1.5,
          gapPosition: 0.5,
          penaltyLaps: 1,
          userLaps: 2,
          autoCalculatedLaps: 0.5,
          adjustedLapCount: 10.5,
          segments: [0.1, 0.2, 0.3],
          isRefueling: true,
          currentLocation: 100,
        } as any,
      ],
    };

    const heat = HeatConverter.fromProto(proto);
    const driverData = heat.heatDrivers[0]!;

    expect(driverData.reactionTime).toBe(0.75);
    expect(driverData.gapLeader).toBe(1.5);
    expect(driverData.gapPosition).toBe(0.5);
    expect(driverData.penaltyLaps).toBe(1);
    expect(driverData.userLaps).toBe(2);
    expect(driverData.autoCalculatedLaps).toBe(0.5);
    expect(driverData.adjustedLapCount).toBe(10.5);
    expect(driverData.currentLapSegments).toEqual([0.1, 0.2, 0.3]);
    expect(driverData.isRefueling).toBe(true);
    expect(driverData.currentLocation).toBe(100);
  });

  it("should preserve currentLapSegments when both laps and segments are present in proto", () => {
    const proto: IHeat = {
      objectId: "heat1",
      heatNumber: 1,
      heatDrivers: [
        {
          objectId: "hd1",
          driver: {
            objectId: "p1",
            driver: { name: "Driver 1" },
          },
          laps: [
            {
              lapTime: 2.5,
              segments: [1.0, 1.5],
            },
          ],
          segments: [0.5, 0.75],
        } as any,
      ],
    };

    const heat = HeatConverter.fromProto(proto);
    const driverData = heat.heatDrivers[0]!;

    expect(driverData.lapTimes.length).toBe(1);
    expect(driverData.lapTimes[0]).toBe(2.5);

    // Because segments are processed after laps, the currentLapSegments should be preserved
    expect(driverData.currentLapSegments).toEqual([0.5, 0.75]);
  });

  it("should populate lapsLed from proto", () => {
    const proto: IHeat = {
      objectId: "heat1",
      heatNumber: 1,
      heatDrivers: [
        {
          objectId: "hd1",
          driver: {
            objectId: "p1",
            driver: { name: "Driver 1" },
          },
          lapsLed: 4,
        } as any,
      ],
    };

    const heat = HeatConverter.fromProto(proto);
    const driverData = heat.heatDrivers[0]!;

    expect(driverData.lapsLed).toBe(4);
  });

  it("should assign driver heat ranks from proto.standings", () => {
    const proto: IHeat = {
      objectId: "heat1",
      heatNumber: 1,
      standings: ["hd2", "hd1"],
      heatDrivers: [
        {
          objectId: "hd1",
          driver: {
            objectId: "p1",
            driver: { name: "Driver 1" },
          },
        } as any,
        {
          objectId: "hd2",
          driver: {
            objectId: "p2",
            driver: { name: "Driver 2" },
          },
        } as any,
      ],
    };

    const heat = HeatConverter.fromProto(proto);
    expect(heat.heatDrivers.length).toBe(2);

    const hd1 = heat.heatDrivers.find((d) => d.objectId === "hd1");
    const hd2 = heat.heatDrivers.find((d) => d.objectId === "hd2");

    expect(hd2?.rank).toBe(1);
    expect(hd1?.rank).toBe(2);
  });

  it("should map isFinished from proto", () => {
    const proto: IHeat = {
      objectId: "heat1",
      heatNumber: 1,
      heatDrivers: [
        {
          objectId: "hd1",
          driver: {
            objectId: "p1",
            driver: { name: "Driver 1" },
          },
          isFinished: true,
        } as any,
      ],
    };

    const heat = HeatConverter.fromProto(proto);
    const driverData = heat.heatDrivers[0]!;

    expect(driverData.isFinished).toBeTrue();
  });
});
