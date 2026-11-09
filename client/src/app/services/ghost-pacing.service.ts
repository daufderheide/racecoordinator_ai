import { Injectable } from "@angular/core";

export type GhostBenchmarkType =
  | "LANE_RECORD"
  | "PERSONAL_BEST"
  | "PERSONAL_AVG"
  | "PERSONAL_MEDIAN"
  | "HEAT_LEADER"
  | "HEAT_LEADER_BEST"
  | "HEAT_LEADER_AVG"
  | "HEAT_LEADER_MEDIAN"
  | "OVERALL_RECORD"
  | "OVERALL_PERSONAL_BEST"
  | "OVERALL_PERSONAL_AVG"
  | "OVERALL_PERSONAL_MEDIAN"
  | "OVERALL_LEADER"
  | "OVERALL_LEADER_BEST"
  | "OVERALL_LEADER_AVG"
  | "OVERALL_LEADER_MEDIAN"
  | "CUSTOM";

export interface GhostGapResult {
  deltaSeconds: number;
  isAhead: boolean;
  progressPct: number;
  liveProjectedLapTime: number;
  ghostLapTime: number;
}

export interface TrajectoryPoint {
  lapNumber: number;
  liveCumulative: number;
  ghostCumulative: number;
  delta: number;
  isAhead: boolean;
}

export interface HeatTrajectoryComparison {
  points: TrajectoryPoint[];
  leadChanges: number;
  maxAdvantageLive: number;
  maxAdvantageGhost: number;
  avgDeltaPerLap: number;
}

@Injectable({
  providedIn: "root",
})
export class GhostPacingService {
  /**
   * Calculates the real-time gap delta in seconds and progress percentage
   * between the live driver and a ghost benchmark lap.
   */
  calculateGhostGap(
    progressPct: number,
    liveDriverElapsedSeconds: number,
    ghostLapTime: number,
  ): GhostGapResult {
    const clampedProgress = Math.max(0.0, Math.min(1.0, progressPct || 0.0));
    const safeGhostLap = ghostLapTime > 0 ? ghostLapTime : 0.0;
    const safeLiveElapsed = Math.max(0.0, liveDriverElapsedSeconds || 0.0);

    if (safeGhostLap <= 0 || safeLiveElapsed <= 0) {
      return {
        deltaSeconds: 0.0,
        isAhead: false,
        progressPct: clampedProgress,
        liveProjectedLapTime: 0.0,
        ghostLapTime: safeGhostLap,
      };
    }

    const expectedGhostElapsed = safeGhostLap * clampedProgress;
    // Delta: positive if live driver has completed the segment in less time (ahead of ghost pace)
    const deltaSeconds = expectedGhostElapsed - safeLiveElapsed;
    const isAhead = deltaSeconds > 0.001;

    const liveProjectedLapTime =
      clampedProgress > 0.01
        ? Number((safeLiveElapsed / clampedProgress).toFixed(3))
        : safeGhostLap;

    return {
      deltaSeconds: Number(deltaSeconds.toFixed(3)),
      isAhead,
      progressPct: clampedProgress,
      liveProjectedLapTime,
      ghostLapTime: safeGhostLap,
    };
  }

  /**
   * Resolves the effective target ghost benchmark time based on preference and available records.
   */
  resolveGhostBenchmarkTime(
    benchmarkType: GhostBenchmarkType,
    laneIndex: number,
    laneRecord?: number,
    personalBest?: number,
    heatLeaderBest?: number,
    heatLeaderAvg?: number,
    heatLeaderMedian?: number,
    personalAvg?: number,
    personalMedian?: number,
    customPace?: number,
    overallPersonalBest?: number,
    overallPersonalAvg?: number,
    overallPersonalMedian?: number,
    overallLeaderBest?: number,
    overallLeaderAvg?: number,
    overallLeaderMedian?: number,
    overallRecord?: number,
  ): number {
    switch (benchmarkType) {
      case "OVERALL_PERSONAL_BEST":
        if (overallPersonalBest && overallPersonalBest > 0)
          return overallPersonalBest;
        if (personalBest && personalBest > 0) return personalBest;
        if (overallRecord && overallRecord > 0) return overallRecord;
        if (overallLeaderBest && overallLeaderBest > 0)
          return overallLeaderBest;
        break;
      case "OVERALL_PERSONAL_AVG":
        if (overallPersonalAvg && overallPersonalAvg > 0)
          return overallPersonalAvg;
        break;
      case "OVERALL_PERSONAL_MEDIAN":
        if (overallPersonalMedian && overallPersonalMedian > 0)
          return overallPersonalMedian;
        break;
      case "OVERALL_LEADER":
      case "OVERALL_LEADER_BEST":
        if (overallLeaderBest && overallLeaderBest > 0)
          return overallLeaderBest;
        if (overallRecord && overallRecord > 0) return overallRecord;
        if (heatLeaderBest && heatLeaderBest > 0) return heatLeaderBest;
        break;
      case "OVERALL_LEADER_AVG":
        if (overallLeaderAvg && overallLeaderAvg > 0) return overallLeaderAvg;
        break;
      case "OVERALL_LEADER_MEDIAN":
        if (overallLeaderMedian && overallLeaderMedian > 0)
          return overallLeaderMedian;
        break;
      case "OVERALL_RECORD":
        if (overallRecord && overallRecord > 0) return overallRecord;
        if (laneRecord && laneRecord > 0) return laneRecord;
        if (overallLeaderBest && overallLeaderBest > 0)
          return overallLeaderBest;
        if (overallPersonalBest && overallPersonalBest > 0)
          return overallPersonalBest;
        break;
      case "PERSONAL_BEST":
        if (personalBest && personalBest > 0) return personalBest;
        if (laneRecord && laneRecord > 0) return laneRecord;
        if (heatLeaderBest && heatLeaderBest > 0) return heatLeaderBest;
        break;
      case "PERSONAL_AVG":
        if (personalAvg && personalAvg > 0) return personalAvg;
        break;
      case "PERSONAL_MEDIAN":
        if (personalMedian && personalMedian > 0) return personalMedian;
        break;
      case "HEAT_LEADER":
      case "HEAT_LEADER_BEST":
        if (heatLeaderBest && heatLeaderBest > 0) return heatLeaderBest;
        if (laneRecord && laneRecord > 0) return laneRecord;
        break;
      case "HEAT_LEADER_AVG":
        if (heatLeaderAvg && heatLeaderAvg > 0) return heatLeaderAvg;
        break;
      case "HEAT_LEADER_MEDIAN":
        if (heatLeaderMedian && heatLeaderMedian > 0) return heatLeaderMedian;
        break;
      case "CUSTOM":
        if (customPace && customPace > 0) return customPace;
        break;
      case "LANE_RECORD":
      default:
        if (laneRecord && laneRecord > 0) return laneRecord;
        if (personalBest && personalBest > 0) return personalBest;
        if (heatLeaderBest && heatLeaderBest > 0) return heatLeaderBest;
        if (heatLeaderAvg && heatLeaderAvg > 0) return heatLeaderAvg;
        if (personalAvg && personalAvg > 0) return personalAvg;
        break;
    }
    return customPace && customPace > 0 ? customPace : 0.0;
  }

  /**
   * Compares two lap series (live driver vs ghost/benchmark driver) to produce
   * point-by-point cumulative trajectory analysis.
   */
  compareTrajectories(
    liveLaps: number[],
    ghostLaps: number[],
  ): HeatTrajectoryComparison {
    const validLive = (liveLaps || []).filter((l) => l > 0);
    const validGhost = (ghostLaps || []).filter((l) => l > 0);
    const lapCount = Math.min(validLive.length, validGhost.length);

    if (lapCount === 0) {
      return {
        points: [],
        leadChanges: 0,
        maxAdvantageLive: 0.0,
        maxAdvantageGhost: 0.0,
        avgDeltaPerLap: 0.0,
      };
    }

    const points: TrajectoryPoint[] = [];
    let liveCum = 0.0;
    let ghostCum = 0.0;
    let leadChanges = 0;
    let prevLead: "live" | "ghost" | "tied" = "tied";
    let maxAdvantageLive = 0.0;
    let maxAdvantageGhost = 0.0;
    let totalDelta = 0.0;

    for (let i = 0; i < lapCount; i++) {
      liveCum += validLive[i];
      ghostCum += validGhost[i];

      // Delta: positive if live driver cumulative time is lower (ahead)
      const delta = ghostCum - liveCum;
      totalDelta += delta;

      const currentLead: "live" | "ghost" | "tied" =
        delta > 0.005 ? "live" : delta < -0.005 ? "ghost" : "tied";

      if (
        prevLead !== "tied" &&
        currentLead !== "tied" &&
        prevLead !== currentLead
      ) {
        leadChanges++;
      }
      if (currentLead !== "tied") {
        prevLead = currentLead;
      }

      if (delta > maxAdvantageLive) {
        maxAdvantageLive = delta;
      }
      if (-delta > maxAdvantageGhost) {
        maxAdvantageGhost = -delta;
      }

      points.push({
        lapNumber: i + 1,
        liveCumulative: Number(liveCum.toFixed(3)),
        ghostCumulative: Number(ghostCum.toFixed(3)),
        delta: Number(delta.toFixed(3)),
        isAhead: delta > 0.001,
      });
    }

    return {
      points,
      leadChanges,
      maxAdvantageLive: Number(maxAdvantageLive.toFixed(3)),
      maxAdvantageGhost: Number(maxAdvantageGhost.toFixed(3)),
      avgDeltaPerLap: Number((totalDelta / lapCount).toFixed(3)),
    };
  }
}
