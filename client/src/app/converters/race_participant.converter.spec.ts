import { IRaceParticipant } from "@app/proto/antigravity";

import { DriverConverter } from "./driver.converter";
import { RaceParticipantConverter } from "./race_participant.converter";
import { TeamConverter } from "./team.converter";

describe("RaceParticipantConverter", () => {
  beforeEach(() => {
    RaceParticipantConverter.clearCache();
    DriverConverter.clearCache();
    TeamConverter.clearCache();
  });

  it("should convert proto with team to RaceParticipant", () => {
    const proto: IRaceParticipant = {
      objectId: "p1",
      driver: {
        model: { entityId: "d1" },
        name: "Alice",
      },
      team: {
        model: { entityId: "t1" },
        name: "Team Alpha",
      },
    };

    const participant = RaceParticipantConverter.fromProto(proto);
    expect(participant.objectId).toBe("p1");
    expect(participant.driver.name).toBe("Alice");
    expect(participant.team).toBeDefined();
    expect(participant.team?.name).toBe("Team Alpha");
  });

  it("should handle absence of team", () => {
    const proto: IRaceParticipant = {
      objectId: "p1",
      driver: {
        model: { entityId: "d1" },
        name: "Alice",
      },
    };

    const participant = RaceParticipantConverter.fromProto(proto);
    expect(participant.team).toBeUndefined();
  });

  it("should update existing participant in place", () => {
    const proto1: IRaceParticipant = {
      objectId: "p1",
      driver: { model: { entityId: "d1" }, name: "Alice" },
      fuelLevel: 100,
    };

    const p1 = RaceParticipantConverter.fromProto(proto1);
    expect(p1.fuelLevel).toBe(100);

    const proto2: IRaceParticipant = {
      objectId: "p1",
      driver: { model: { entityId: "d1" }, name: "Alice" },
      fuelLevel: 80,
    };

    const p2 = RaceParticipantConverter.fromProto(proto2);
    expect(p2).toBe(p1); // Reference must be identical
    expect(p1.fuelLevel).toBe(80);
    expect(p2.fuelLevel).toBe(80);
  });

  it("should convert overall stats fields correctly", () => {
    const proto: IRaceParticipant = {
      objectId: "p-stats",
      driver: { model: { entityId: "d1" }, name: "Bob" },
      consistencyScore: 94.5,
      physicalLapCount: 42,
      standardDeviation: 0.123,
      lapsLed: 15,
      trackCalls: 4,
      totalPoints: 120.5,
      averageTop5: 4.56,
      averageTop10: 4.78,
      averageTop15: 4.95,
      top2Consecutive: 9.12,
      top3Consecutive: 13.84,
      hasSegments: true,
    };

    const p = RaceParticipantConverter.fromProto(proto);
    expect(p.consistencyScore).toBe(94.5);
    expect(p.physicalLapCount).toBe(42);
    expect(p.standardDeviation).toBe(0.123);
    expect(p.lapsLed).toBe(15);
    expect(p.trackCalls).toBe(4);
    expect(p.totalPoints).toBe(120.5);
    expect(p.averageTop5).toBe(4.56);
    expect(p.averageTop10).toBe(4.78);
    expect(p.averageTop15).toBe(4.95);
    expect(p.top2Consecutive).toBe(9.12);
    expect(p.top3Consecutive).toBe(13.84);
    expect(p.hasSegments).toBeTrue();
  });

  it("should update hasSegments in place when updating cached participant", () => {
    const proto1: IRaceParticipant = {
      objectId: "p1",
      driver: { model: { entityId: "d1" }, name: "Alice" },
      hasSegments: false,
    };

    const p1 = RaceParticipantConverter.fromProto(proto1);
    expect(p1.hasSegments).toBeFalse();

    const proto2: IRaceParticipant = {
      objectId: "p1",
      driver: { model: { entityId: "d1" }, name: "Alice" },
      hasSegments: true,
    };

    const p2 = RaceParticipantConverter.fromProto(proto2);
    expect(p2).toBe(p1);
    expect(p1.hasSegments).toBeTrue();
  });
});
