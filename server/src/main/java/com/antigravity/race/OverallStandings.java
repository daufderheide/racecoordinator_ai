package com.antigravity.race;

import com.antigravity.models.GroupOptions;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.OverallScoring;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class OverallStandings {

  private final HeatScoring heatScoring;
  private final OverallScoring overallScoring;
  private final GroupOptions groupOptions;
  private final boolean practice;

  public OverallStandings(
      HeatScoring heatScoring,
      OverallScoring overallScoring,
      GroupOptions groupOptions,
      boolean practice) {
    this.heatScoring = heatScoring;
    this.overallScoring = overallScoring;
    this.groupOptions = groupOptions;
    this.practice = practice;
  }

  public int getDroppedHeats() {
    return overallScoring != null ? overallScoring.getDroppedHeats() : 0;
  }

  public void recalculate(List<RaceParticipant> drivers, List<Heat> heats) {
    Map<String, List<DriverHeatData>> driverHeats = new HashMap<>();

    // 1. Strings heats to drivers
    for (Heat heat : heats) {
      for (DriverHeatData dhd : heat.getDrivers()) {
        if (dhd.getDriver() != null) {
          driverHeats
              .computeIfAbsent(dhd.getDriver().getStableId(), k -> new ArrayList<>())
              .add(dhd);
        }
      }
    }

    // 2. Aggregate stats for each driver
    for (RaceParticipant driver : drivers) {
      List<DriverHeatData> myHeats =
          driverHeats.getOrDefault(driver.getStableId(), new ArrayList<>());
      List<DriverHeatData> scoringHeats = getScoringHeats(myHeats);

      double totalLaps = 0.0;
      double totalTime = 0.0;
      double bestLap = Double.MAX_VALUE;

      List<Double> allScoringLaps = new ArrayList<>();
      for (DriverHeatData dhd : scoringHeats) {
        totalLaps += dhd.getAdjustedLapCount();
        totalTime += dhd.getTotalTime();

        if (dhd.getBestLapTime() > 0 && dhd.getBestLapTime() < bestLap) {
          bestLap = dhd.getBestLapTime();
        }
        for (DriverHeatData.LapData lap : dhd.getLaps()) {
          allScoringLaps.add(lap.getLapTime());
        }
      }

      // Updating driver stats
      if (bestLap == Double.MAX_VALUE) {
        bestLap = 0.0;
      }
      driver.setTotalLaps(totalLaps);
      driver.setTotalTime(totalTime);
      driver.setBestLapTime(bestLap);

      if (!allScoringLaps.isEmpty()) {
        double sum = 0;
        for (double lap : allScoringLaps) {
          sum += lap;
        }
        driver.setAverageLapTime(sum / allScoringLaps.size());

        Collections.sort(allScoringLaps);
        int middle = allScoringLaps.size() / 2;
        if (allScoringLaps.size() % 2 == 1) {
          driver.setMedianLapTime(allScoringLaps.get(middle));
        } else {
          driver.setMedianLapTime(
              (allScoringLaps.get(middle - 1) + allScoringLaps.get(middle)) / 2.0);
        }
      } else {
        driver.setAverageLapTime(0.0);
        driver.setMedianLapTime(0.0);
      }
    }

    // 3. Rank drivers
    if (!practice) {
      if (groupOptions != null && groupOptions.isEnabled() && groupOptions.getMinAdvancing() > 0) {
        rankWithMinAdvancing(drivers, heats);
      } else {
        drivers.sort(getComparator());
      }
    }

    // 4. Assign ranks
    int currentRank = 1;
    for (int i = 0; i < drivers.size(); i++) {
      RaceParticipant driver = drivers.get(i);
      boolean isEmpty = driver.getDriver() != null && driver.getDriver().isEmpty();
      driver.setRank(isEmpty || practice ? 99 : currentRank++);

      double rankValue = 0;
      if (overallScoring != null && overallScoring.getRankingMethod() != null) {
        switch (overallScoring.getRankingMethod()) {
          case LAP_COUNT:
            rankValue = driver.getTotalLaps();
            break;
          case FASTEST_LAP:
            rankValue = driver.getBestLapTime();
            break;
          case TOTAL_TIME:
            rankValue = driver.getTotalTime();
            break;
          case AVERAGE_LAP:
            rankValue = driver.getAverageLapTime();
            break;
          default:
            rankValue = 0;
        }
      } else {
        rankValue = driver.getTotalLaps();
      }
      driver.setRankValue(rankValue);
    }

    // 5. Calculate gaps
    if (!practice) {
      HeatScoring.FinishMethod finishMethod =
          heatScoring != null ? heatScoring.getFinishMethod() : HeatScoring.FinishMethod.Lap;
      GapCalculator.calculateGaps(drivers, finishMethod);
    }
  }

  private List<DriverHeatData> getScoringHeats(List<DriverHeatData> allHeats) {
    int dropped = getDroppedHeats();
    if (dropped <= 0 || allHeats.size() <= dropped) {
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
    return allHeats.subList(0, allHeats.size() - dropped);
  }

  private Comparator<DriverHeatData> getHeatComparator() {
    // We need 'Best' first.
    Comparator<DriverHeatData> comparator;
    if (heatScoring != null && heatScoring.getHeatRanking() != null) {
      switch (heatScoring.getHeatRanking()) {
        case LAP_COUNT:
          // More laps = better
          comparator = Comparator.comparingDouble(DriverHeatData::getAdjustedLapCount).reversed();
          break;
        case FASTEST_LAP:
          // Lower time = better
          comparator =
              Comparator.comparingDouble(
                  d -> d.getBestLapTime() == 0 ? Double.MAX_VALUE : d.getBestLapTime());
          break;
        case TOTAL_TIME:
          // Lower time = better
          comparator =
              Comparator.comparingDouble(
                  d -> d.getTotalTime() == 0 ? Double.MAX_VALUE : d.getTotalTime());
          break;
        default:
          comparator = (a, b) -> 0;
      }

      // Add tiebreaker
      if (heatScoring.getHeatRankingTiebreaker() != null) {
        switch (heatScoring.getHeatRankingTiebreaker()) {
          case FASTEST_LAP_TIME:
            comparator =
                comparator.thenComparingDouble(
                    d -> d.getBestLapTime() == 0 ? Double.MAX_VALUE : d.getBestLapTime());
            break;
          case MEDIAN_LAP_TIME:
            comparator =
                comparator.thenComparingDouble(
                    d -> d.getMedianLapTime() == 0 ? Double.MAX_VALUE : d.getMedianLapTime());
            break;
          case AVERAGE_LAP_TIME:
            comparator =
                comparator.thenComparingDouble(
                    d -> d.getAverageLapTime() == 0 ? Double.MAX_VALUE : d.getAverageLapTime());
            break;
          default:
            break;
        }
      }
    } else {
      // Default to Lap Count
      comparator =
          Comparator.comparingDouble(DriverHeatData::getAdjustedLapCount)
              .reversed()
              .thenComparingDouble(
                  d -> d.getTotalTime() == 0 ? Double.MAX_VALUE : d.getTotalTime());
    }
    return comparator;
  }

  private void rankWithMinAdvancing(List<RaceParticipant> drivers, List<Heat> heats) {
    Map<String, Integer> driverToGroup = new HashMap<>();
    for (Heat heat : heats) {
      for (DriverHeatData dhd : heat.getDrivers()) {
        if (dhd.getDriver() != null) {
          driverToGroup.put(dhd.getDriver().getStableId(), heat.getGroup());
        }
      }
    }

    Map<Integer, List<RaceParticipant>> groupedDrivers = new HashMap<>();
    List<RaceParticipant> emptyDrivers = new ArrayList<>();

    for (RaceParticipant driver : drivers) {
      if (driver.getDriver() != null && driver.getDriver().isEmpty()) {
        emptyDrivers.add(driver);
      } else {
        int group = driverToGroup.getOrDefault(driver.getStableId(), 0);
        groupedDrivers.computeIfAbsent(group, k -> new ArrayList<>()).add(driver);
      }
    }

    List<RaceParticipant> forcedTop = new ArrayList<>();
    List<RaceParticipant> theRest = new ArrayList<>();

    Comparator<RaceParticipant> comparator = getComparator();

    for (List<RaceParticipant> group : groupedDrivers.values()) {
      group.sort(comparator);
      int toAdvance = Math.min(group.size(), groupOptions.getMinAdvancing());
      for (int i = 0; i < toAdvance; i++) {
        forcedTop.add(group.get(i));
      }
      for (int i = toAdvance; i < group.size(); i++) {
        theRest.add(group.get(i));
      }
    }

    forcedTop.sort(comparator);
    theRest.sort(comparator);

    drivers.clear();
    drivers.addAll(forcedTop);
    drivers.addAll(theRest);
    drivers.addAll(emptyDrivers);
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
    if (overallScoring != null && overallScoring.getRankingMethod() != null) {
      switch (overallScoring.getRankingMethod()) {
        case LAP_COUNT:
          comparator = Comparator.comparingDouble(RaceParticipant::getTotalLaps).reversed();
          break;
        case FASTEST_LAP:
          comparator =
              Comparator.comparingDouble(
                  p -> p.getBestLapTime() == 0 ? Double.MAX_VALUE : p.getBestLapTime());
          break;
        case TOTAL_TIME:
          comparator =
              Comparator.comparingDouble(
                  p -> p.getTotalTime() == 0 ? Double.MAX_VALUE : p.getTotalTime());
          break;
        case AVERAGE_LAP:
          comparator =
              Comparator.comparingDouble(
                  p -> p.getAverageLapTime() == 0 ? Double.MAX_VALUE : p.getAverageLapTime());
          break;
        default:
          comparator = (a, b) -> 0;
      }
    } else {
      comparator = Comparator.comparingDouble(RaceParticipant::getTotalLaps).reversed();
    }

    return Comparator.<RaceParticipant, Boolean>comparing(
            p -> p.getDriver() != null && p.getDriver().isEmpty())
        .thenComparing(
            comparator
                .thenComparing(getTieBreakerComparator())
                .thenComparingInt(RaceParticipant::getSeed));
  }

  private Comparator<RaceParticipant> getTieBreakerComparator() {
    if (overallScoring == null || overallScoring.getTiebreaker() == null) {
      return (a, b) -> 0;
    }
    switch (overallScoring.getTiebreaker()) {
      case FASTEST_LAP_TIME:
        return Comparator.comparingDouble(
            p -> p.getBestLapTime() == 0 ? Double.MAX_VALUE : p.getBestLapTime());
      case MEDIAN_LAP_TIME:
        return Comparator.comparingDouble(
            p -> p.getMedianLapTime() == 0 ? Double.MAX_VALUE : p.getMedianLapTime());
      case AVERAGE_LAP_TIME:
        return Comparator.comparingDouble(
            p -> p.getAverageLapTime() == 0 ? Double.MAX_VALUE : p.getAverageLapTime());
      case TOTAL_TIME:
        return Comparator.comparingDouble(
            p -> p.getTotalTime() == 0 ? Double.MAX_VALUE : p.getTotalTime());
      default:
        return (a, b) -> 0;
    }
  }
}
