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

  /** Gets the time elapsed at the specific physical lap index (1-indexed). */
  double getTimeAtLap(int lapIndex);

  /** Gets the physical full lap count, ignoring penalties or manual segments. */
  int getPhysicalLapCount();

  /** Sets the F1 style time gap to the leader in seconds. */
  void setGapLeaderF1(double gapLeaderF1);

  /** Sets the F1 style time gap to the position immediately ahead in seconds. */
  void setGapPositionF1(double gapPositionF1);

  /** Sets the number of laps down to the leader. */
  void setLapsDownLeader(int lapsDown);

  /** Sets the number of laps down to the position immediately ahead. */
  void setLapsDownPosition(int lapsDown);
}
