package com.antigravity.race;

public interface GapParticipant {
  /** Gets the total adjusted lap count (including partial laps). */
  double getAdjustedLapCount();

  /** Gets the total time in seconds. */
  double getTotalTime();

  /** Gets the average lap time in seconds. */
  double getAverageLapTime();

  /** Returns true if the participant has not completed any full laps. */
  boolean hasNoFullLaps();

  /** Sets the gap to the leader in seconds. */
  void setGapLeader(double gapLeader);

  /** Sets the gap to the position immediately ahead in seconds. */
  void setGapPosition(double gapPosition);
}
