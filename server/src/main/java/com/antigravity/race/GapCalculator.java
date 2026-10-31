package com.antigravity.race;

import com.antigravity.models.HeatScoring;
import com.antigravity.models.RankingMethod;
import java.util.List;

public class GapCalculator {

  /**
   * Calculates and sets gaps (gapLeader, gapPosition, F1 gaps, and lap gaps) for a list of
   * participants.
   *
   * @param sortedParticipants The list of participants, sorted from first (index 0) to last.
   * @param finishMethod The finish method (Lap or Timed) used for the scoring.
   * @param rankingMethod The ranking method used to rank participants. When set to FASTEST_LAP, all
   *     gap calculations evaluate the delta between drivers' fastest laps.
   */
  public static void calculateGaps(
      List<? extends GapParticipant> sortedParticipants,
      HeatScoring.FinishMethod finishMethod,
      RankingMethod rankingMethod) {
    if (sortedParticipants == null || sortedParticipants.isEmpty()) {
      return;
    }

    RankingMethod rankMethod = rankingMethod != null ? rankingMethod : RankingMethod.LAP_COUNT;

    GapParticipant leader = sortedParticipants.get(0);
    leader.setGapLeader(0.0);
    leader.setGapPosition(0.0);
    leader.setGapLeaderF1(0.0);
    leader.setGapPositionF1(0.0);
    leader.setGapLeaderLaps(0.0);
    leader.setGapPositionLaps(0.0);
    leader.setLapsDownLeader(0);
    leader.setLapsDownPosition(0);

    for (int i = 1; i < sortedParticipants.size(); i++) {
      GapParticipant current = sortedParticipants.get(i);
      GapParticipant ahead = sortedParticipants.get(i - 1);

      if (current.isEmptyParticipant()) {
        resetParticipantGaps(current);
        continue;
      }

      if (rankMethod == RankingMethod.FASTEST_LAP) {
        calculateFastestLapGaps(leader, ahead, current);
        continue;
      }

      current.setGapLeader(calculateGap(leader, current, finishMethod));
      current.setGapPosition(calculateGap(ahead, current, finishMethod));

      calculateF1Gap(leader, current, true);
      calculateF1Gap(ahead, current, false);

      current.setGapLeaderLaps(
          Math.max(0.0, leader.getEffectiveLapCount() - current.getEffectiveLapCount()));
      current.setGapPositionLaps(
          Math.max(0.0, ahead.getEffectiveLapCount() - current.getEffectiveLapCount()));
    }
  }

  private static void resetParticipantGaps(GapParticipant current) {
    current.setGapLeader(0.0);
    current.setGapPosition(0.0);
    current.setGapLeaderF1(0.0);
    current.setGapPositionF1(0.0);
    current.setGapLeaderLaps(0.0);
    current.setGapPositionLaps(0.0);
    current.setLapsDownLeader(0);
    current.setLapsDownPosition(0);
  }

  private static void calculateFastestLapGaps(
      GapParticipant leader, GapParticipant ahead, GapParticipant current) {
    double gapLead = calculateFastestLapDelta(leader, current);
    double gapPos = calculateFastestLapDelta(ahead, current);

    current.setGapLeader(gapLead);
    current.setGapPosition(gapPos);
    current.setGapLeaderF1(gapLead);
    current.setGapPositionF1(gapPos);
    current.setLapsDownLeader(0);
    current.setLapsDownPosition(0);
    current.setGapLeaderLaps(0.0);
    current.setGapPositionLaps(0.0);
  }

  private static double calculateFastestLapDelta(
      GapParticipant targetParticipant, GapParticipant curParticipant) {
    if (targetParticipant == null
        || curParticipant == null
        || targetParticipant.isEmptyParticipant()
        || curParticipant.isEmptyParticipant()) {
      return 0.0;
    }
    double targetBest = targetParticipant.getBestLapTime();
    double curBest = curParticipant.getBestLapTime();
    if (targetBest <= 0.0 || curBest <= 0.0) {
      return 0.0;
    }
    return Math.max(0.0, curBest - targetBest);
  }

  /**
   * Calculates and sets lap gaps (gapLeaderLaps and gapPositionLaps) for all participants,
   * comparing each driver's effective lap count against the effective lap counts of the leader and
   * ahead.
   */
  public static void calculateLapGaps(List<? extends GapParticipant> sortedParticipants) {
    calculateLapGaps(sortedParticipants, RankingMethod.LAP_COUNT);
  }

  /**
   * Calculates and sets lap gaps (gapLeaderLaps and gapPositionLaps) for all participants,
   * comparing each driver's effective lap count against the effective lap counts of the leader and
   * ahead.
   */
  public static void calculateLapGaps(
      List<? extends GapParticipant> sortedParticipants, RankingMethod rankingMethod) {
    if (sortedParticipants == null || sortedParticipants.isEmpty()) {
      return;
    }
    GapParticipant leader = sortedParticipants.get(0);
    leader.setGapLeaderLaps(0.0);
    leader.setGapPositionLaps(0.0);
    for (int i = 1; i < sortedParticipants.size(); i++) {
      GapParticipant current = sortedParticipants.get(i);
      GapParticipant ahead = sortedParticipants.get(i - 1);
      if (current.isEmptyParticipant() || rankingMethod == RankingMethod.FASTEST_LAP) {
        current.setGapLeaderLaps(0.0);
        current.setGapPositionLaps(0.0);
        continue;
      }
      current.setGapLeaderLaps(
          Math.max(0.0, leader.getEffectiveLapCount() - current.getEffectiveLapCount()));
      current.setGapPositionLaps(
          Math.max(0.0, ahead.getEffectiveLapCount() - current.getEffectiveLapCount()));
    }
  }

  /**
   * Calculates and sets lap gaps (gapLeaderLaps and gapPositionLaps) for a driver who just
   * completed a lap, comparing their effective lap count against the effective lap counts
   * (including running partial laps) of the leader and position immediately ahead.
   */
  public static void calculateLapGapsForDriver(
      GapParticipant completedDriver, List<? extends GapParticipant> sortedParticipants) {
    calculateLapGapsForDriver(completedDriver, sortedParticipants, RankingMethod.LAP_COUNT);
  }

  /**
   * Calculates and sets lap gaps (gapLeaderLaps and gapPositionLaps) for a driver who just
   * completed a lap, comparing their effective lap count against the effective lap counts
   * (including running partial laps) of the leader and position immediately ahead.
   */
  public static void calculateLapGapsForDriver(
      GapParticipant completedDriver,
      List<? extends GapParticipant> sortedParticipants,
      RankingMethod rankingMethod) {
    if (completedDriver == null || sortedParticipants == null || sortedParticipants.isEmpty()) {
      return;
    }
    if (rankingMethod == RankingMethod.FASTEST_LAP) {
      completedDriver.setGapLeaderLaps(0.0);
      completedDriver.setGapPositionLaps(0.0);
      return;
    }
    if (completedDriver.isEmptyParticipant()) {
      completedDriver.setGapLeaderLaps(0.0);
      completedDriver.setGapPositionLaps(0.0);
      return;
    }
    GapParticipant leader = sortedParticipants.get(0);
    if (completedDriver == leader) {
      completedDriver.setGapLeaderLaps(0.0);
      completedDriver.setGapPositionLaps(0.0);
      return;
    }
    int index = sortedParticipants.indexOf(completedDriver);
    if (index <= 0) {
      completedDriver.setGapLeaderLaps(0.0);
      completedDriver.setGapPositionLaps(0.0);
      return;
    }
    GapParticipant ahead = sortedParticipants.get(index - 1);
    double gapLeader =
        Math.max(0.0, leader.getEffectiveLapCount() - completedDriver.getEffectiveLapCount());
    double gapPosition =
        Math.max(0.0, ahead.getEffectiveLapCount() - completedDriver.getEffectiveLapCount());
    completedDriver.setGapLeaderLaps(gapLeader);
    completedDriver.setGapPositionLaps(gapPosition);
  }

  private static double calculateGap(
      GapParticipant leadParticipant,
      GapParticipant curParticipant,
      HeatScoring.FinishMethod finishMethod) {

    if (leadParticipant.getAdjustedLapCount() == curParticipant.getAdjustedLapCount()) {
      return curParticipant.getTotalTime() - leadParticipant.getTotalTime();
    } else if (curParticipant.hasNoFullLaps()) {
      return leadParticipant.getTotalTime();
    } else {
      double avgLapTime = curParticipant.getAverageLapTime();
      double lapDiff = leadParticipant.getAdjustedLapCount() - curParticipant.getAdjustedLapCount();

      if (finishMethod == HeatScoring.FinishMethod.Timed) {
        return avgLapTime * lapDiff;
      } else {
        double timeDiff = curParticipant.getTotalTime() - leadParticipant.getTotalTime();
        double projectedGap = timeDiff + (avgLapTime * lapDiff);
        if (projectedGap < 0) {
          return avgLapTime * lapDiff;
        }
        return projectedGap;
      }
    }
  }

  private static void calculateF1Gap(
      GapParticipant leadParticipant, GapParticipant curParticipant, boolean isLeader) {

    int leadLaps = leadParticipant.getPhysicalLapCount();
    int curLaps = curParticipant.getPhysicalLapCount();
    int lapsDown = (leadLaps - curLaps) - 1;

    double timeGap = 0.0;

    if (lapsDown <= 0) {
      lapsDown = 0;
      if (leadLaps == curLaps) {
        timeGap = curParticipant.getTotalTime() - leadParticipant.getTotalTime();
      } else {
        timeGap = curParticipant.getTotalTime() - leadParticipant.getTimeAtLap(curLaps);
      }
    }

    if (timeGap < 0) {
      timeGap = 0.0;
    }

    if (isLeader) {
      curParticipant.setLapsDownLeader(lapsDown);
      curParticipant.setGapLeaderF1(timeGap);
    } else {
      curParticipant.setLapsDownPosition(lapsDown);
      curParticipant.setGapPositionF1(timeGap);
    }
  }
}
