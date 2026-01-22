package com.antigravity.race;

import com.antigravity.models.RaceScoring;
import com.antigravity.models.RaceScoring.HeatRanking;
import com.antigravity.models.RaceScoring.HeatRankingTiebreaker;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class OverallStandings {

  private int droppedHeats = 0;
  private final RaceScoring raceScoring;

  public OverallStandings(RaceScoring raceScoring) {
    this.raceScoring = raceScoring;
  }

  public int getDroppedHeats() {
    return droppedHeats;
  }

  public void setDroppedHeats(int droppedHeats) {
    this.droppedHeats = droppedHeats;
  }

  public void recalculate(List<RaceParticipant> drivers, List<Heat> heats) {
    Map<String, List<DriverHeatData>> driverHeats = new HashMap<>();

    // 1. Strings heats to drivers
    for (Heat heat : heats) {
      for (DriverHeatData dhd : heat.getDrivers()) {
        driverHeats.computeIfAbsent(dhd.getDriver().getObjectId(), k -> new ArrayList<>()).add(dhd);
      }
    }

    // 2. Aggregate stats for each driver
    for (RaceParticipant driver : drivers) {
      List<DriverHeatData> myHeats = driverHeats.getOrDefault(driver.getObjectId(), new ArrayList<>());
      List<DriverHeatData> scoringHeats = getScoringHeats(myHeats);

      int totalLaps = 0;
      float totalTime = 0.0f;
      float bestLap = 0.0f;
      List<Float> allLaps = new ArrayList<>();

      for (DriverHeatData dhd : scoringHeats) {
        totalLaps += dhd.getLapCount();
        totalTime += dhd.getTotalTime();

        if (dhd.getBestLapTime() > 0 && (bestLap == 0 || dhd.getBestLapTime() < bestLap)) {
          bestLap = dhd.getBestLapTime();
        }

        // For average/median calculation, we might need all individual laps
        // But DriverHeatData stores them, so we can access if needed.
        // Assuming we want average of all laps across all scoring heats.
        // Accessing private/protected fields might be tricky unless DriverHeatData
        // exposes them.
        // DriverHeatData has `laps` but no getter for the list.
        // It has getAverageLapTime() and getMedianLapTime() for the heat.
        // We need to request a getter for `laps` in DriverHeatData if we want true
        // global avg/median.
        // OR we just use the heat averages? No, mathematically that's wrong for
        // different lap counts.
      }

      // NOTE: DriverHeatData needs to expose laps for accurate calculation of overall
      // average/median.
      // For now, I will assume I can get them or add a method to DriverHeatData.
      // Let's modify DriverHeatData to expose getLaps() or similar.

      // Updating driver stats
      driver.setTotalLaps(totalLaps);
      driver.setTotalTime(totalTime);
      driver.setBestLapTime(bestLap);

      // Placeholder for Avg/Median until I can access raw laps
      // driver.setAverageLapTime(...);
      // driver.setMedianLapTime(...);
    }

    // 3. Rank drivers
    drivers.sort(getComparator());

    // 4. Assign ranks
    for (int i = 0; i < drivers.size(); i++) {
      drivers.get(i).setRank(i + 1);
    }
  }

  private List<DriverHeatData> getScoringHeats(List<DriverHeatData> allHeats) {
    if (droppedHeats <= 0 || allHeats.size() <= droppedHeats) {
      return allHeats;
    }

    // Sort heats by specific heat ranking criteria to find "worst"
    // If sorting ASCENDING (Worst to Best), we sip the first N.
    // If sorting DESCENDING (Best to Worst), we keep the first Size - N.

    Comparator<DriverHeatData> comparator = getHeatComparator();
    // We want to KEEP the best heats.
    // So let's sort Best to Worst.
    allHeats.sort(comparator); // This logic depends on what getHeatComparator implementation.

    // Return top (Size - dropped)
    return allHeats.subList(0, allHeats.size() - droppedHeats);
  }

  private Comparator<DriverHeatData> getHeatComparator() {
    // We need 'Best' first.
    Comparator<DriverHeatData> comparator;
    if (raceScoring != null && raceScoring.getHeatRanking() != null) {
      switch (raceScoring.getHeatRanking()) {
        case LAP_COUNT:
          // More laps = better
          comparator = Comparator.comparingInt(DriverHeatData::getLapCount).reversed();
          // Tiebreak with time? Usually yes, less time is better for same laps.
          comparator = comparator.thenComparingDouble(DriverHeatData::getTotalTime);
          break;
        case FASTEST_LAP:
          // Lower time = better
          comparator = Comparator.comparingDouble(d -> d.getBestLapTime() == 0 ? Double.MAX_VALUE : d.getBestLapTime());
          break;
        case TOTAL_TIME:
          // Lower time = better (Assuming fixed laps? Or just time?)
          comparator = Comparator.comparingDouble(DriverHeatData::getTotalTime);
          break;
        default:
          comparator = (a, b) -> 0;
      }
    } else {
      // Default to Lap Count
      comparator = Comparator.comparingInt(DriverHeatData::getLapCount).reversed()
          .thenComparingDouble(DriverHeatData::getTotalTime);
    }
    return comparator;
  }

  private Comparator<RaceParticipant> getComparator() {
    // Overall Ranking Comparator
    // This logic mimics the heat logic but on the aggregated stats in
    // RaceParticipant
    // Assuming same rules apply as HeatRanking?
    // Or does RaceScoring have a separate "OverallRanking" config?
    // The proto has `HeatRanking` and `HeatRankingTiebreaker`.
    // User request says: "The overall standings should use bestLapTime,
    // AverageLapTime, MedianLapTime, or TotalTime as the tiebreaker"
    // And "rank the drivers by accumulating the score calculated by the the
    // driverHeatData heatStandings."

    // "Accumulating the score" -> If HeatRanking is LapCount, we sum Laps.

    Comparator<RaceParticipant> comparator;
    if (raceScoring != null && raceScoring.getHeatRanking() != null) {
      switch (raceScoring.getHeatRanking()) {
        case LAP_COUNT:
          comparator = Comparator.comparingInt(RaceParticipant::getTotalLaps).reversed();
          // Tiebreaker?
          break;
        case FASTEST_LAP:
          // Sum of fastest laps? No, probably overall Fastest Lap?
          // "accumulating the score" implies summing.
          // But for Fastest Lap, you usually take the MIN of all heats.
          // My aggregation logic above took the MIN (Best) of all heats for
          // `bestLapTime`.
          comparator = Comparator.comparingDouble(p -> p.getBestLapTime() == 0 ? Double.MAX_VALUE : p.getBestLapTime());
          break;
        case TOTAL_TIME:
          comparator = Comparator.comparingDouble(RaceParticipant::getTotalTime);
          break;
        default:
          comparator = (a, b) -> 0;
      }
    } else {
      comparator = Comparator.comparingInt(RaceParticipant::getTotalLaps).reversed();
    }

    // Apply Tiebreaker
    comparator = comparator.thenComparing(getTieBreakerComparator());

    return comparator;
  }

  private Comparator<RaceParticipant> getTieBreakerComparator() {
    if (raceScoring == null || raceScoring.getHeatRankingTiebreaker() == null) {
      return (a, b) -> 0;
    }
    switch (raceScoring.getHeatRankingTiebreaker()) {
      case FASTEST_LAP_TIME:
        return Comparator.comparingDouble(p -> p.getBestLapTime() == 0 ? Double.MAX_VALUE : p.getBestLapTime());
      case MEDIAN_LAP_TIME:
        return Comparator.comparingDouble(p -> p.getMedianLapTime() == 0 ? Double.MAX_VALUE : p.getMedianLapTime());
      case AVERAGE_LAP_TIME:
        return Comparator.comparingDouble(p -> p.getAverageLapTime() == 0 ? Double.MAX_VALUE : p.getAverageLapTime());
      default:
        return (a, b) -> 0;
    }
  }
}
