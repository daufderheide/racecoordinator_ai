package com.antigravity.race;

import com.antigravity.models.RankingMethod;
import com.antigravity.models.TiebreakerMethod;
import java.util.Comparator;

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

    return 0;
  }

  static int comparePrimary(StandingsParticipant a, StandingsParticipant b, RankingMethod method) {
    switch (method) {
      case LAP_COUNT:
        return Double.compare(b.getAdjustedLapCount(), a.getAdjustedLapCount());
      case FASTEST_LAP:
        double aBest = a.getBestLapTime() > 0 ? a.getBestLapTime() : Double.MAX_VALUE;
        double bBest = b.getBestLapTime() > 0 ? b.getBestLapTime() : Double.MAX_VALUE;
        return Double.compare(aBest, bBest);
      case TOTAL_TIME:
        if (a.getAdjustedLapCount() != b.getAdjustedLapCount()) {
          return Double.compare(b.getAdjustedLapCount(), a.getAdjustedLapCount());
        }
        double aTime = a.getTotalTime() > 0 ? a.getTotalTime() : Double.MAX_VALUE;
        double bTime = b.getTotalTime() > 0 ? b.getTotalTime() : Double.MAX_VALUE;
        return Double.compare(aTime, bTime);
      case AVERAGE_LAP:
        double aAvg = a.getAverageLapTime() > 0 ? a.getAverageLapTime() : Double.MAX_VALUE;
        double bAvg = b.getAverageLapTime() > 0 ? b.getAverageLapTime() : Double.MAX_VALUE;
        return Double.compare(aAvg, bAvg);
      default:
        return 0;
    }
  }

  static int compareTiebreaker(
      StandingsParticipant a, StandingsParticipant b, TiebreakerMethod tiebreaker) {
    switch (tiebreaker) {
      case FASTEST_LAP_TIME:
        double aBest = a.getBestLapTime() > 0 ? a.getBestLapTime() : Double.MAX_VALUE;
        double bBest = b.getBestLapTime() > 0 ? b.getBestLapTime() : Double.MAX_VALUE;
        return Double.compare(aBest, bBest);
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
}
