import { Driver } from "@app/models/driver";

import { DriverHeatData } from "./driver_heat_data";
import { RaceParticipant } from "./race_participant";

describe("DriverHeatData", () => {
  let participant: RaceParticipant;
  let driver: Driver;
  let heatData: DriverHeatData;

  beforeEach(() => {
    driver = new Driver("Test Driver", "TD", "test-driver", "driver-id" as any);
    participant = new RaceParticipant("participant-id", driver);
    heatData = new DriverHeatData("object-id", participant, 0);
  });

  it("should initialize with empty segments", () => {
    expect(heatData.currentLapSegments).toEqual([]);
    expect(heatData.lastSegmentTime).toBe(0);
  });

  it("should add segment times", () => {
    heatData.addSegmentTime(0, 1.234);
    expect(heatData.currentLapSegments).toEqual([1.234]);
    expect(heatData.lastSegmentTime).toBe(1.234);

    heatData.addSegmentTime(1, 2.345);
    expect(heatData.currentLapSegments).toEqual([1.234, 2.345]);
    expect(heatData.lastSegmentTime).toBe(2.345);
  });

  it("should handle non-sequential segment arrivals", () => {
    // Slot index 2 arrives before 0 or 1
    heatData.addSegmentTime(2, 3.456);
    expect(heatData.currentLapSegments[2]).toBe(3.456);
    expect(heatData.currentLapSegments[0]).toBe(0);
    expect(heatData.currentLapSegments[1]).toBe(0);
    expect(heatData.lastSegmentTime).toBe(3.456);

    // Slot 0 arrives later
    heatData.addSegmentTime(0, 1.111);
    expect(heatData.currentLapSegments[0]).toBe(1.111);
    expect(heatData.currentLapSegments[2]).toBe(3.456);
  });

  it("should update existing segment times", () => {
    heatData.addSegmentTime(0, 1.0);
    heatData.addSegmentTime(0, 1.5);
    expect(heatData.currentLapSegments[0]).toBe(1.5);
  });

  it("should clear segments when a lap is added", () => {
    heatData.addSegmentTime(0, 1.234);
    heatData.addSegmentTime(1, 2.345);
    expect(heatData.currentLapSegments.length).toBe(2);

    heatData.addLapTime(1, 10.0, 10.0, 10.0, 10.0, 1);
    expect(heatData.currentLapSegments).toEqual([]);
    expect(heatData.lastSegmentTime).toBe(0);
  });

  it("should reset segments when reset() is called", () => {
    heatData.addSegmentTime(0, 1.234);
    heatData.reset();
    expect(heatData.currentLapSegments).toEqual([]);
  });

  it("should return 0 for lastSegmentTime if no segments added", () => {
    expect(heatData.lastSegmentTime).toBe(0);
  });

  it("should calculate lapCount correctly with penalties, user, and auto laps", () => {
    heatData.addLapTime(1, 10.0, 10.0, 10.0, 10.0, 1); // 1 lap
    expect(heatData.lapCount).toBe(1);

    heatData.penaltyLaps = -0.5;
    heatData.userLaps = 1.0;
    heatData.autoCalculatedLaps = 0.25;

    // Since _adjustedLapCount is 1 (from addLapTime), it returns 1.
    expect(heatData.lapCount).toBe(1);

    // If we update adjustedLapCount directly
    heatData.adjustedLapCount = 1.75;
    expect(heatData.lapCount).toBe(1.75);

    // If adjustedLapCount is 0, it uses the fallback formula
    heatData.adjustedLapCount = 0;
    expect(heatData.lapCount).toBe(1 + -0.5 + 1.0 + 0.25); // 1.75
  });

  it("should calculate physicalLapCount strictly from physical laps regardless of adjustments", () => {
    expect(heatData.physicalLapCount).toBe(0);

    heatData.addLapTime(1, 10.0, 10.0, 10.0, 10.0, 1);
    expect(heatData.physicalLapCount).toBe(1);

    heatData.addLapTime(2, 9.8, 9.9, 9.9, 9.8, 2);
    expect(heatData.physicalLapCount).toBe(2);

    // Modifying adjustedLapCount, userLaps, penalties, autoCalculatedLaps should NOT affect physicalLapCount
    heatData.adjustedLapCount = 10.5;
    heatData.penaltyLaps = -1.0;
    heatData.userLaps = 2.5;
    heatData.autoCalculatedLaps = 0.5;

    expect(heatData.physicalLapCount).toBe(2);
    expect(heatData.lapCount).toBe(10.5);

    heatData.reset();
    expect(heatData.physicalLapCount).toBe(0);
  });

  it("should update countTowardsRecords using updateLapRecordStatus", () => {
    heatData.addLapTime(1, 10.0, 10.0, 10.0, 10.0, 1);
    expect(heatData.lapsWithDetails[0].countTowardsRecords).toBeTrue();

    heatData.updateLapRecordStatus(0, false);
    expect(heatData.lapsWithDetails[0].countTowardsRecords).toBeFalse();

    heatData.updateLapRecordStatus(0, true);
    expect(heatData.lapsWithDetails[0].countTowardsRecords).toBeTrue();
  });

  describe("Analysis Metrics", () => {
    it("should initialize metrics to null", () => {
      expect(heatData.standardDeviation).toBeNull();
      expect(heatData.consistencyScore).toBeNull();
      expect(heatData.averageTop5).toBeNull();
      expect(heatData.averageTop10).toBeNull();
      expect(heatData.averageTop15).toBeNull();
      expect(heatData.top2Consecutive).toBeNull();
      expect(heatData.top3Consecutive).toBeNull();
    });

    it("should store server-provided metrics and reset them to null on reset()", () => {
      heatData.standardDeviation = 0.123;
      heatData.consistencyScore = 97.5;
      heatData.averageTop5 = 4.15;
      heatData.averageTop10 = 4.25;
      heatData.averageTop15 = 4.35;
      heatData.top2Consecutive = 8.2;
      heatData.top3Consecutive = 12.3;

      expect(heatData.standardDeviation).toBe(0.123);
      expect(heatData.consistencyScore).toBe(97.5);
      expect(heatData.averageTop5).toBe(4.15);
      expect(heatData.averageTop10).toBe(4.25);
      expect(heatData.averageTop15).toBe(4.35);
      expect(heatData.top2Consecutive).toBe(8.2);
      expect(heatData.top3Consecutive).toBe(12.3);

      heatData.reset();

      expect(heatData.standardDeviation).toBeNull();
      expect(heatData.consistencyScore).toBeNull();
      expect(heatData.averageTop5).toBeNull();
      expect(heatData.averageTop10).toBeNull();
      expect(heatData.averageTop15).toBeNull();
      expect(heatData.top2Consecutive).toBeNull();
      expect(heatData.top3Consecutive).toBeNull();
    });
  });
});
