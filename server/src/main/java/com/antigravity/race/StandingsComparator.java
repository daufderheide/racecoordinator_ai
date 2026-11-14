package com.antigravity.race;

import com.antigravity.models.RankingMethod;
import com.antigravity.models.TiebreakerMethod;
import java.util.Comparator;
import java.util.List;

public class StandingsComparator<T extends StandingsParticipant> implements Comparator<T> {

  private final RankingMethod rankingMethod;
  private final TiebreakerMethod tiebreakerMethod;

  public StandingsComparator(RankingMethod rankingMethod, TiebreakerMethod tiebreakerMethod) {
    this.rankingMethod = rankingMethod != null ? rankingMethod : RankingMethod.LAP_COUNT;
    this.tiebreakerMethod =
        tiebreakerMethod != null ? tiebreakerMethod : TiebreakerMethod.AVERAGE_LAP_TIME;
  }

  public RankingMethod getRankingMethod() {
    return rankingMethod;
  }

  public TiebreakerMethod getTiebreakerMethod() {
    return tiebreakerMethod;
  }

  @Override
  public int compare(T a, T b) {
    if (a == null && b == null) return 0;
    if (a == null) return 1;
    if (b == null) return -1;

    // 1. Empty participants sort to bottom
    boolean aEmpty = a.isEmptyParticipant();
    boolean bEmpty = b.isEmptyParticipant();
    if (aEmpty != bEmpty) {
      return aEmpty ? 1 : -1;
    }
    if (aEmpty && bEmpty) {
      return 0;
    }

    // 1b. Disqualified participants sort below non-disqualified participants
    boolean aDq = a.isDisqualified();
    boolean bDq = b.isDisqualified();
    if (aDq != bDq) {
      return aDq ? 1 : -1;
    }

    // 2. Primary ranking comparison
    int cmp = comparePrimary(a, b, rankingMethod);
    if (cmp != 0) {
      return cmp;
    }

    // 3. Configured tiebreaker comparison
    cmp = compareTiebreaker(a, b, tiebreakerMethod);
    if (cmp != 0) {
      return cmp;
    }

    // 4. Fallbacks for deterministic tiebreaking
    // 4a. Seed (if defined / non-zero)
    if (a.getSeed() != b.getSeed()) {
      return Integer.compare(a.getSeed(), b.getSeed());
    }

    // 4b. Fastest lap time (if not already evaluated)
    if (rankingMethod != RankingMethod.FASTEST_LAP
        && tiebreakerMethod != TiebreakerMethod.FASTEST_LAP_TIME) {
      double aBest = a.getBestLapTime() > 0 ? a.getBestLapTime() : Double.MAX_VALUE;
      double bBest = b.getBestLapTime() > 0 ? b.getBestLapTime() : Double.MAX_VALUE;
      cmp = Double.compare(aBest, bBest);
      if (cmp != 0) {
        return cmp;
      }
    }

    // 4c. Total time (if not already evaluated)
    if (rankingMethod != RankingMethod.TOTAL_TIME
        && tiebreakerMethod != TiebreakerMethod.TOTAL_TIME) {
      double aTime = a.getTotalTime() > 0 ? a.getTotalTime() : Double.MAX_VALUE;
      double bTime = b.getTotalTime() > 0 ? b.getTotalTime() : Double.MAX_VALUE;
      cmp = Double.compare(aTime, bTime);
      if (cmp != 0) {
        return cmp;
      }
    }

    return 0;
  }

  private static double getScoredLapCount(StandingsParticipant p) {
    if (p instanceof DriverHeatData) {
      return ((DriverHeatData) p).getScoredLapCount();
    }
    return p.getAdjustedLapCount();
  }

  static int comparePrimary(StandingsParticipant a, StandingsParticipant b, RankingMethod method) {
    switch (method) {
      case LAP_COUNT:
        int lapCmp = Double.compare(getScoredLapCount(b), getScoredLapCount(a));
        if (lapCmp != 0) {
          return lapCmp;
        }
        double aTime = a.getTotalTime() > 0 ? a.getTotalTime() : Double.MAX_VALUE;
        double bTime = b.getTotalTime() > 0 ? b.getTotalTime() : Double.MAX_VALUE;
        return Double.compare(aTime, bTime);
      case FASTEST_LAP:
        double aBest = a.getBestLapTime() > 0 ? a.getBestLapTime() : Double.MAX_VALUE;
        double bBest = b.getBestLapTime() > 0 ? b.getBestLapTime() : Double.MAX_VALUE;
        return Double.compare(aBest, bBest);
      case TOTAL_TIME:
        if (Double.compare(getScoredLapCount(a), getScoredLapCount(b)) != 0) {
          return Double.compare(getScoredLapCount(b), getScoredLapCount(a));
        }
        double aTimeTot = a.getTotalTime() > 0 ? a.getTotalTime() : Double.MAX_VALUE;
        double bTimeTot = b.getTotalTime() > 0 ? b.getTotalTime() : Double.MAX_VALUE;
        return Double.compare(aTimeTot, bTimeTot);
      case AVERAGE_LAP:
        double aAvg = a.getAverageLapTime() > 0 ? a.getAverageLapTime() : Double.MAX_VALUE;
        double bAvg = b.getAverageLapTime() > 0 ? b.getAverageLapTime() : Double.MAX_VALUE;
        return Double.compare(aAvg, bAvg);
      case POINTS:
        return Double.compare(b.getTotalPoints(), a.getTotalPoints());
      default:
        return 0;
    }
  }

  static int compareTiebreaker(
      StandingsParticipant a, StandingsParticipant b, TiebreakerMethod tiebreaker) {
    if (tiebreaker == null) {
      return 0;
    }
    switch (tiebreaker) {
      case LAP_COUNT:
        return Double.compare(getScoredLapCount(b), getScoredLapCount(a));
      case FIRST_TO_SET_TIME:
        double aRec = a.getBestLapRecordedTime();
        double bRec = b.getBestLapRecordedTime();
        return Double.compare(aRec, bRec);
      case SECOND_BEST_LAP_TIME:
        return compareNthBestLaps(a, b);
      case FASTEST_LAP_TIME:
        double aBest = a.getBestLapTime() > 0 ? a.getBestLapTime() : Double.MAX_VALUE;
        double bBest = b.getBestLapTime() > 0 ? b.getBestLapTime() : Double.MAX_VALUE;
        int cmpBest = Double.compare(aBest, bBest);
        if (cmpBest != 0) {
          return cmpBest;
        }
        return Double.compare(a.getBestLapRecordedTime(), b.getBestLapRecordedTime());
      case MEDIAN_LAP_TIME:
        double aMed = a.getMedianLapTime() > 0 ? a.getMedianLapTime() : Double.MAX_VALUE;
        double bMed = b.getMedianLapTime() > 0 ? b.getMedianLapTime() : Double.MAX_VALUE;
        return Double.compare(aMed, bMed);
      case AVERAGE_LAP_TIME:
        double aAvg = a.getAverageLapTime() > 0 ? a.getAverageLapTime() : Double.MAX_VALUE;
        double bAvg = b.getAverageLapTime() > 0 ? b.getAverageLapTime() : Double.MAX_VALUE;
        return Double.compare(aAvg, bAvg);
      case TOTAL_TIME:
        double aTime = a.getTotalTime() > 0 ? a.getTotalTime() : Double.MAX_VALUE;
        double bTime = b.getTotalTime() > 0 ? b.getTotalTime() : Double.MAX_VALUE;
        return Double.compare(aTime, bTime);
      default:
        return 0;
    }
  }

  public static int compareNthBestLaps(StandingsParticipant a, StandingsParticipant b) {
    if (a == null && b == null) return 0;
    if (a == null) return 1;
    if (b == null) return -1;
    List<Double> aLaps = a.getSortedValidLapTimes();
    List<Double> bLaps = b.getSortedValidLapTimes();
    boolean aEmpty = aLaps == null || aLaps.isEmpty();
    boolean bEmpty = bLaps == null || bLaps.isEmpty();
    if (aEmpty && bEmpty) return 0;
    if (aEmpty) return 1;
    if (bEmpty) return -1;

    int maxIdx = Math.max(aLaps.size(), bLaps.size());
    for (int i = 1; i < maxIdx; i++) {
      if (i >= aLaps.size()) {
        return 1;
      }
      if (i >= bLaps.size()) {
        return -1;
      }
      int cmp = Double.compare(aLaps.get(i), bLaps.get(i));
      if (cmp != 0) {
        return cmp;
      }
    }
    return Integer.compare(bLaps.size(), aLaps.size());
  }
}
