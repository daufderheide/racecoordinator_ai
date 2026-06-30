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

    for (int i = 1; i < sortedParticipants.size(); i++) {
      GapParticipant current = sortedParticipants.get(i);
      GapParticipant ahead = sortedParticipants.get(i - 1);

      current.setGapLeader(calculateGap(leader, current, finishMethod));
      current.setGapPosition(calculateGap(ahead, current, finishMethod));
    }
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
}
