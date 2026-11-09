import {
  createMockBestRaceLapEntries,
  createMockEditorData,
  createMockLaneRecordEntries,
  createMockRecordData,
} from "./raceday-mock.utils";

describe("raceday-mock.utils", () => {
  describe("createMockEditorData", () => {
    it("should generate complete mock data for UI editor with overall benchmark statistics", () => {
      const data = createMockEditorData();

      expect(data).toBeDefined();
      expect(data.race).toBeDefined();
      expect(data.track).toBeDefined();
      expect(data.participants.length).toBeGreaterThan(0);
      expect(data.heat).toBeDefined();
      expect(data.heats.length).toBeGreaterThan(1);
      expect(data.recordData).toBeDefined();

      // Verify leader participant (first participant) has populated camelCase overall stats
      const leader = data.participants[0];
      expect(leader.rank).toBe(1);
      expect(leader.bestLapTime).toBeGreaterThan(0);
      expect(leader.averageLapTime).toBeGreaterThan(0);
      expect(leader.medianLapTime).toBeGreaterThan(0);
      expect((leader as any).best_lap_time).toBe(leader.bestLapTime);
      expect((leader as any).average_lap_time).toBe(leader.averageLapTime);
      expect((leader as any).median_lap_time).toBe(leader.medianLapTime);
      expect((leader as any).overallBestLapTime).toBe(leader.bestLapTime);
      expect((leader as any).overallAverageLapTime).toBe(leader.averageLapTime);
      expect((leader as any).overallMedianLapTime).toBe(leader.medianLapTime);

      // Verify heat drivers have overall benchmark properties for ghost pacing widgets
      const heatDrivers = data.heat.heatDrivers;
      expect(heatDrivers.length).toBeGreaterThan(0);
      const firstHd = heatDrivers[0];
      expect((firstHd as any).overallBestLapTime).toBeGreaterThan(0);
      expect((firstHd as any).overallAverageLapTime).toBeGreaterThan(0);
      expect((firstHd as any).overallMedianLapTime).toBeGreaterThan(0);
      expect((firstHd as any).currentLapTime).toBeGreaterThan(0);
      expect((firstHd as any).lapProgress).toBeGreaterThan(0);

      // Verify hd.participant is populated
      expect(firstHd.participant).toBeDefined();
      expect(firstHd.participant.bestLapTime).toBeGreaterThan(0);
      expect(firstHd.participant.averageLapTime).toBeGreaterThan(0);
      expect(firstHd.participant.medianLapTime).toBeGreaterThan(0);
      expect((firstHd.participant as any).overallBestLapTime).toBeGreaterThan(
        0,
      );
      expect(
        (firstHd.participant as any).overallAverageLapTime,
      ).toBeGreaterThan(0);
      expect((firstHd.participant as any).overallMedianLapTime).toBeGreaterThan(
        0,
      );
    });

    it("should populate next heat drivers with overall benchmark data", () => {
      const data = createMockEditorData();
      const nextHeat = data.heats[1];
      expect(nextHeat).toBeDefined();
      expect(nextHeat.heatDrivers.length).toBeGreaterThan(0);

      const nextHd = nextHeat.heatDrivers[0];
      expect((nextHd as any).overallBestLapTime).toBeGreaterThan(0);
      expect((nextHd as any).overallAverageLapTime).toBeGreaterThan(0);
      expect((nextHd as any).overallMedianLapTime).toBeGreaterThan(0);
      expect((nextHd as any).currentLapTime).toBeGreaterThan(0);
      expect(nextHd.participant).toBeDefined();
      expect(nextHd.participant.bestLapTime).toBeGreaterThan(0);
      expect(nextHd.participant.averageLapTime).toBeGreaterThan(0);
      expect(nextHd.participant.medianLapTime).toBeGreaterThan(0);
    });
  });

  describe("createMockRecordData", () => {
    it("should return valid record data with fastest lap entries", () => {
      const records = createMockRecordData();
      expect(records.overall?.fastestLap?.value).toBe(1.842);
      expect(records.overall?.laneFastestLap?.length).toBeGreaterThan(0);
      expect(records.current?.fastestLap?.value).toBe(1.955);
    });
  });

  describe("createMockLaneRecordEntries and createMockBestRaceLapEntries", () => {
    it("should return arrays of mock record entries", () => {
      const laneRecords = createMockLaneRecordEntries();
      expect(laneRecords.length).toBeGreaterThan(0);
      expect(laneRecords[0].value).toBe(1.842);

      const bestRaceLaps = createMockBestRaceLapEntries();
      expect(bestRaceLaps.length).toBeGreaterThan(0);
      expect(bestRaceLaps[0].value).toBe(1.955);
    });
  });
});
