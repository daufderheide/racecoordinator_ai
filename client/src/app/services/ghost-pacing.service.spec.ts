import { TestBed } from "@angular/core/testing";

import { GhostPacingService } from "./ghost-pacing.service";

describe("GhostPacingService", () => {
  let service: GhostPacingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GhostPacingService);
  });

  describe("calculateGhostGap", () => {
    it("should return zero/default values when ghostLapTime or liveElapsed is 0 or negative", () => {
      const res1 = service.calculateGhostGap(0.5, 0, 10.0);
      expect(res1.deltaSeconds).toBe(0.0);
      expect(res1.isAhead).toBeFalse();
      expect(res1.liveProjectedLapTime).toBe(0.0);

      const res2 = service.calculateGhostGap(0.5, 5.0, 0);
      expect(res2.deltaSeconds).toBe(0.0);
      expect(res2.isAhead).toBeFalse();

      const res3 = service.calculateGhostGap(-0.2, -1, -5);
      expect(res3.progressPct).toBe(0.0);
      expect(res3.deltaSeconds).toBe(0.0);
    });

    it("should correctly identify when live driver is ahead of ghost pace", () => {
      // 50% progress, ghost is 10.0s (expected 5.0s), live elapsed is 4.2s (faster by 0.8s)
      const res = service.calculateGhostGap(0.5, 4.2, 10.0);
      expect(res.isAhead).toBeTrue();
      expect(res.deltaSeconds).toBe(0.8);
      expect(res.progressPct).toBe(0.5);
      expect(res.liveProjectedLapTime).toBe(8.4);
    });

    it("should correctly identify when live driver is behind ghost pace", () => {
      // 60% progress, ghost is 8.0s (expected 4.8s), live elapsed is 5.4s (slower by 0.6s)
      const res = service.calculateGhostGap(0.6, 5.4, 8.0);
      expect(res.isAhead).toBeFalse();
      expect(res.deltaSeconds).toBe(-0.6);
      expect(res.progressPct).toBe(0.6);
      expect(res.liveProjectedLapTime).toBe(9.0);
    });

    it("should clamp progressPct between 0.0 and 1.0", () => {
      const resOver = service.calculateGhostGap(1.5, 9.0, 10.0);
      expect(resOver.progressPct).toBe(1.0);
      expect(resOver.deltaSeconds).toBe(1.0);

      const resSmall = service.calculateGhostGap(0.005, 0.1, 10.0);
      expect(resSmall.liveProjectedLapTime).toBe(10.0);
    });
  });

  describe("resolveGhostBenchmarkTime", () => {
    it("should resolve LANE_RECORD preference with fallbacks", () => {
      expect(
        service.resolveGhostBenchmarkTime("LANE_RECORD", 0, 4.2, 4.5, 4.8),
      ).toBe(4.2);
      expect(
        service.resolveGhostBenchmarkTime("LANE_RECORD", 0, 0, 4.5, 4.8),
      ).toBe(4.5);
      expect(
        service.resolveGhostBenchmarkTime("LANE_RECORD", 0, 0, 0, 4.8),
      ).toBe(4.8);
      expect(
        service.resolveGhostBenchmarkTime(
          "LANE_RECORD",
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          5.0,
        ),
      ).toBe(5.0);
      expect(
        service.resolveGhostBenchmarkTime("LANE_RECORD", 0, 0, 0, 0, 0),
      ).toBe(0.0);
    });

    it("should resolve PERSONAL_BEST preference with fallbacks", () => {
      expect(
        service.resolveGhostBenchmarkTime("PERSONAL_BEST", 0, 4.2, 4.0, 4.8),
      ).toBe(4.0);
      expect(
        service.resolveGhostBenchmarkTime("PERSONAL_BEST", 0, 4.2, 0, 4.8),
      ).toBe(4.2);
      expect(
        service.resolveGhostBenchmarkTime("PERSONAL_BEST", 0, 0, 0, 4.8),
      ).toBe(4.8);
    });

    it("should resolve HEAT_LEADER preference with fallbacks", () => {
      expect(
        service.resolveGhostBenchmarkTime("HEAT_LEADER", 0, 4.2, 4.0, 3.9),
      ).toBe(3.9);
      expect(
        service.resolveGhostBenchmarkTime("HEAT_LEADER", 0, 4.2, 4.0, 0),
      ).toBe(4.2);
    });

    it("should resolve PERSONAL_AVG and PERSONAL_MEDIAN preferences without fallback to best lap", () => {
      expect(
        service.resolveGhostBenchmarkTime(
          "PERSONAL_AVG",
          0,
          4.5,
          4.2,
          4.0,
          0,
          0,
          4.35,
          4.3,
        ),
      ).toBe(4.35);
      expect(
        service.resolveGhostBenchmarkTime(
          "PERSONAL_MEDIAN",
          0,
          4.5,
          4.2,
          4.0,
          0,
          0,
          4.35,
          4.3,
        ),
      ).toBe(4.3);
      expect(
        service.resolveGhostBenchmarkTime(
          "PERSONAL_AVG",
          0,
          4.5,
          4.2,
          4.0,
          0,
          0,
          0,
          0,
        ),
      ).toBe(0.0);
      expect(
        service.resolveGhostBenchmarkTime(
          "PERSONAL_MEDIAN",
          0,
          4.5,
          4.2,
          4.0,
          0,
          0,
          0,
          0,
        ),
      ).toBe(0.0);
    });

    it("should resolve HEAT_LEADER_AVG and HEAT_LEADER_MEDIAN preferences without fallback to best lap", () => {
      expect(
        service.resolveGhostBenchmarkTime(
          "HEAT_LEADER_AVG",
          0,
          4.5,
          4.2,
          4.0,
          4.12,
          4.15,
        ),
      ).toBe(4.12);
      expect(
        service.resolveGhostBenchmarkTime(
          "HEAT_LEADER_MEDIAN",
          0,
          4.5,
          4.2,
          4.0,
          4.12,
          4.15,
        ),
      ).toBe(4.15);
      expect(
        service.resolveGhostBenchmarkTime(
          "HEAT_LEADER_AVG",
          0,
          4.5,
          4.2,
          4.0,
          0,
          0,
        ),
      ).toBe(0.0);
      expect(
        service.resolveGhostBenchmarkTime(
          "HEAT_LEADER_MEDIAN",
          0,
          4.5,
          4.2,
          4.0,
          0,
          0,
        ),
      ).toBe(0.0);
    });

    it("should resolve overall benchmark preferences with fallbacks", () => {
      // OVERALL_RECORD
      expect(
        service.resolveGhostBenchmarkTime(
          "OVERALL_RECORD",
          0,
          4.5,
          4.2,
          4.0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          3.9,
          0,
          0,
          3.8,
        ),
      ).toBe(3.8);
      // OVERALL_RECORD fallback to laneRecord then overallLeaderBest
      expect(
        service.resolveGhostBenchmarkTime(
          "OVERALL_RECORD",
          0,
          4.5,
          4.2,
          4.0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          3.9,
        ),
      ).toBe(4.5);
      expect(
        service.resolveGhostBenchmarkTime(
          "OVERALL_RECORD",
          0,
          0,
          4.2,
          4.0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          3.9,
        ),
      ).toBe(3.9);

      // OVERALL_PERSONAL_BEST
      expect(
        service.resolveGhostBenchmarkTime(
          "OVERALL_PERSONAL_BEST",
          0,
          4.5,
          4.2,
          4.0,
          0,
          0,
          0,
          0,
          0,
          4.1,
        ),
      ).toBe(4.1);
      // OVERALL_PERSONAL_BEST fallback to personalBest
      expect(
        service.resolveGhostBenchmarkTime(
          "OVERALL_PERSONAL_BEST",
          0,
          4.5,
          4.2,
          4.0,
          0,
          0,
          0,
          0,
          0,
          0,
        ),
      ).toBe(4.2);

      // OVERALL_PERSONAL_AVG & MEDIAN (no fallback to best lap)
      expect(
        service.resolveGhostBenchmarkTime(
          "OVERALL_PERSONAL_AVG",
          0,
          4.5,
          4.2,
          4.0,
          0,
          0,
          0,
          0,
          0,
          4.1,
          4.3,
        ),
      ).toBe(4.3);
      expect(
        service.resolveGhostBenchmarkTime(
          "OVERALL_PERSONAL_AVG",
          0,
          4.5,
          4.2,
          4.0,
          0,
          0,
          0,
          0,
          0,
          4.1,
          0,
        ),
      ).toBe(0.0);
      expect(
        service.resolveGhostBenchmarkTime(
          "OVERALL_PERSONAL_MEDIAN",
          0,
          4.5,
          4.2,
          4.0,
          0,
          0,
          0,
          0,
          0,
          4.1,
          0,
          4.25,
        ),
      ).toBe(4.25);
      expect(
        service.resolveGhostBenchmarkTime(
          "OVERALL_PERSONAL_MEDIAN",
          0,
          4.5,
          4.2,
          4.0,
          0,
          0,
          0,
          0,
          0,
          4.1,
          0,
          0,
        ),
      ).toBe(0.0);

      // OVERALL_LEADER & OVERALL_LEADER_BEST
      expect(
        service.resolveGhostBenchmarkTime(
          "OVERALL_LEADER",
          0,
          4.5,
          4.2,
          4.0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          3.85,
        ),
      ).toBe(3.85);
      expect(
        service.resolveGhostBenchmarkTime(
          "OVERALL_LEADER_BEST",
          0,
          4.5,
          4.2,
          4.0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          3.85,
        ),
      ).toBe(3.85);
      // OVERALL_LEADER fallback to overallRecord then heatLeaderBest
      expect(
        service.resolveGhostBenchmarkTime(
          "OVERALL_LEADER_BEST",
          0,
          4.5,
          4.2,
          4.0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          3.75,
        ),
      ).toBe(3.75);
      expect(
        service.resolveGhostBenchmarkTime(
          "OVERALL_LEADER_BEST",
          0,
          4.5,
          4.2,
          4.0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
        ),
      ).toBe(4.0);

      // OVERALL_LEADER_AVG & MEDIAN (no fallback)
      expect(
        service.resolveGhostBenchmarkTime(
          "OVERALL_LEADER_AVG",
          0,
          4.5,
          4.2,
          4.0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          3.85,
          3.95,
        ),
      ).toBe(3.95);
      expect(
        service.resolveGhostBenchmarkTime(
          "OVERALL_LEADER_AVG",
          0,
          4.5,
          4.2,
          4.0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          3.85,
          0,
        ),
      ).toBe(0.0);
      expect(
        service.resolveGhostBenchmarkTime(
          "OVERALL_LEADER_MEDIAN",
          0,
          4.5,
          4.2,
          4.0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          3.85,
          3.95,
          3.92,
        ),
      ).toBe(3.92);
      expect(
        service.resolveGhostBenchmarkTime(
          "OVERALL_LEADER_MEDIAN",
          0,
          4.5,
          4.2,
          4.0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          3.85,
          3.95,
          0,
        ),
      ).toBe(0.0);
    });

    it("should resolve CUSTOM preference", () => {
      expect(
        service.resolveGhostBenchmarkTime(
          "CUSTOM",
          0,
          4.2,
          4.0,
          3.9,
          0,
          0,
          0,
          0,
          5.5,
        ),
      ).toBe(5.5);
      expect(
        service.resolveGhostBenchmarkTime(
          "CUSTOM",
          0,
          4.2,
          4.0,
          3.9,
          0,
          0,
          0,
          0,
          0,
        ),
      ).toBe(0.0);
    });
  });

  describe("compareTrajectories", () => {
    it("should handle empty or null lap arrays", () => {
      const res = service.compareTrajectories([], []);
      expect(res.points.length).toBe(0);
      expect(res.leadChanges).toBe(0);
      expect(res.maxAdvantageLive).toBe(0.0);
    });

    it("should compute cumulative deltas and track lead changes", () => {
      // Driver A: Lap 1=5.0s, Lap 2=5.0s, Lap 3=4.0s (Cum: 5.0, 10.0, 14.0)
      // Driver B: Lap 1=4.8s, Lap 2=5.4s, Lap 3=4.2s (Cum: 4.8, 10.2, 14.4)
      const live = [5.0, 5.0, 4.0];
      const ghost = [4.8, 5.4, 4.2];

      const res = service.compareTrajectories(live, ghost);
      expect(res.points.length).toBe(3);

      // Lap 1: Live cum=5.0, Ghost cum=4.8 -> Delta = -0.2s (Ghost ahead)
      expect(res.points[0].delta).toBe(-0.2);
      expect(res.points[0].isAhead).toBeFalse();

      // Lap 2: Live cum=10.0, Ghost cum=10.2 -> Delta = +0.2s (Live ahead -> Lead change 1)
      expect(res.points[1].delta).toBe(0.2);
      expect(res.points[1].isAhead).toBeTrue();

      // Lap 3: Live cum=14.0, Ghost cum=14.4 -> Delta = +0.4s (Live ahead)
      expect(res.points[2].delta).toBe(0.4);
      expect(res.points[2].isAhead).toBeTrue();

      expect(res.leadChanges).toBe(1);
      expect(res.maxAdvantageLive).toBe(0.4);
      expect(res.maxAdvantageGhost).toBe(0.2);
      expect(res.avgDeltaPerLap).toBe(0.133);
    });
  });
});
