package com.antigravity.race;

public interface StandingsParticipant {
  /** Gets the total adjusted lap count (including partial laps). */
  double getAdjustedLapCount();

  /** Gets the total time in seconds. */
  double getTotalTime();

  /** Gets the best lap time in seconds. */
  double getBestLapTime();

  /** Gets the average lap time in seconds. */
  double getAverageLapTime();

  /** Gets the median lap time in seconds. */
  double getMedianLapTime();

  /** Returns true if this participant is considered empty (e.g., an empty lane). */
  boolean isEmptyParticipant();

  /** Gets the seed index for tiebreaking. */
  default int getSeed() {
    return 0;
  }

  /** Gets the unique identifier for the participant (driver ID, team ID, or object ID). */
  String getParticipantId();
}
