package com.antigravity.race;

import com.antigravity.models.HeatScoring;
import java.util.List;

public class GapCalculator {

  /**
   * Calculates and sets gaps (gapLeader and gapPosition) for a list of participants.
   *
   * @param sortedParticipants The list of participants, sorted from first (index 0) to last.
   * @param finishMethod The finish method (Lap or Timed) used for the scoring.
   */
  public static void calculateGaps(
      List<? extends GapParticipant> sortedParticipants, HeatScoring.FinishMethod finishMethod) {
    if (sortedParticipants == null || sortedParticipants.isEmpty()) {
      return;
    }

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
        current.setGapLeader(0.0);
        current.setGapPosition(0.0);
        current.setGapLeaderF1(0.0);
        current.setGapPositionF1(0.0);
        current.setGapLeaderLaps(0.0);
        current.setGapPositionLaps(0.0);
        current.setLapsDownLeader(0);
        current.setLapsDownPosition(0);
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

  /**
   * Calculates and sets lap gaps (gapLeaderLaps and gapPositionLaps) for all participants,
   * comparing each driver's effective lap count against the effective lap counts of the leader and
   * ahead.
   */
  public static void calculateLapGaps(List<? extends GapParticipant> sortedParticipants) {
    if (sortedParticipants == null || sortedParticipants.isEmpty()) {
      return;
    }
    GapParticipant leader = sortedParticipants.get(0);
    leader.setGapLeaderLaps(0.0);
    leader.setGapPositionLaps(0.0);
    for (int i = 1; i < sortedParticipants.size(); i++) {
      GapParticipant current = sortedParticipants.get(i);
      GapParticipant ahead = sortedParticipants.get(i - 1);
      if (current.isEmptyParticipant()) {
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
    if (completedDriver == null || sortedParticipants == null || sortedParticipants.isEmpty()) {
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
