package com.antigravity.race;

import com.antigravity.models.GroupOptions;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.OverallScoring;
import com.antigravity.models.RankingMethod;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class OverallStandings {

  private final HeatScoring heatScoring;
  private final OverallScoring overallScoring;
  private final GroupOptions groupOptions;
  private final boolean practice;
  private final int stepUp;

  public OverallStandings(
      HeatScoring heatScoring,
      OverallScoring overallScoring,
      GroupOptions groupOptions,
      boolean practice,
      int stepUp) {
    this.heatScoring = heatScoring;
    this.overallScoring = overallScoring;
    this.groupOptions = groupOptions;
    this.practice = practice;
    this.stepUp = stepUp;
  }

  public OverallStandings(
      HeatScoring heatScoring,
      OverallScoring overallScoring,
      GroupOptions groupOptions,
      boolean practice) {
    this(heatScoring, overallScoring, groupOptions, practice, 0);
  }

  public int getDroppedHeats() {
    return overallScoring != null ? overallScoring.getDroppedHeats() : 0;
  }

  public void recalculate(List<RaceParticipant> drivers, List<Heat> heats) {
    recalculate(drivers, heats, null);
  }

  public void recalculate(
      List<RaceParticipant> drivers, List<Heat> heats, HeatRotationType rotationType) {
    recalculate(drivers, heats, rotationType, null);
  }

  public void recalculate(
      List<RaceParticipant> drivers,
      List<Heat> heats,
      HeatRotationType rotationType,
      String completedDriverParticipantId) {
    if (drivers == null) {
      return;
    }
    synchronized (drivers) {
      Map<String, Map<Integer, List<DriverHeatData>>> driverHeatsByNumber = new HashMap<>();
      Map<String, Integer> driverToGroup = new HashMap<>();
      Map<Integer, Boolean> heatStartedByNumber = new HashMap<>();
      Map<Integer, Integer> heatStepByNumber = new HashMap<>();
      Map<String, Integer> driverMaxStep = new HashMap<>();

      // 1. Index heats to drivers by heat number, group, and step
      indexHeats(
          heats,
          driverHeatsByNumber,
          driverToGroup,
          heatStartedByNumber,
          heatStepByNumber,
          driverMaxStep);

      boolean isStepUpRace =
          this.stepUp > 0 || heatStepByNumber.values().stream().anyMatch(s -> s > 0);

      // 2. Aggregate stats for each driver
      for (RaceParticipant driver : new ArrayList<>(drivers)) {
        if (driver != null) {
          Map<Integer, List<DriverHeatData>> heatsByNumber =
              driverHeatsByNumber.getOrDefault(driver.getStableId(), Collections.emptyMap());
          if (isStepUpRace) {
            int maxStep = driverMaxStep.getOrDefault(driver.getStableId(), 0);
            if (maxStep > 0) {
              Map<Integer, List<DriverHeatData>> stepHeatsByNumber = new LinkedHashMap<>();
              for (Map.Entry<Integer, List<DriverHeatData>> entry : heatsByNumber.entrySet()) {
                if (heatStepByNumber.getOrDefault(entry.getKey(), 0) == maxStep) {
                  stepHeatsByNumber.put(entry.getKey(), entry.getValue());
                }
              }
              heatsByNumber = stepHeatsByNumber;
            }
          }
          calculateDriverStats(driver, heatsByNumber, rotationType, heatStartedByNumber);
        }
      }

      // 3. Rank drivers
      if (!practice) {
        if (isStepUpRace) {
          rankStepUpDrivers(drivers, driverToGroup, driverMaxStep);
        } else if (groupOptions != null
            && groupOptions.isEnabled()
            && groupOptions.getMinAdvancing() > 0) {
          rankWithMinAdvancing(drivers, driverToGroup);
        } else {
          drivers.sort(getComparator());
        }
      }

      // 4. Assign ranks
      assignRanks(drivers);

      // 5. Calculate gaps
      if (!practice) {
        HeatScoring.FinishMethod finishMethod =
            heatScoring != null ? heatScoring.getFinishMethod() : HeatScoring.FinishMethod.Lap;
        RankingMethod rankingMethod =
            HeatStandings.resolveOverallRankingMethod(heatScoring, overallScoring);
        GapCalculator.calculateGaps(drivers, finishMethod, rankingMethod);
        if (completedDriverParticipantId != null) {
          RaceParticipant completed =
              drivers.stream()
                  .filter(
                      d ->
                          d != null
                              && (completedDriverParticipantId.equals(d.getParticipantId())
                                  || completedDriverParticipantId.equals(d.getStableId())))
                  .findFirst()
                  .orElse(null);
          if (completed != null) {
            GapCalculator.calculateLapGapsForDriver(completed, drivers, rankingMethod);
          }
        }
      }
    }
  }

  private void indexHeats(
      List<Heat> heats,
      Map<String, Map<Integer, List<DriverHeatData>>> driverHeatsByNumber,
      Map<String, Integer> driverToGroup,
      Map<Integer, Boolean> heatStartedByNumber,
      Map<Integer, Integer> heatStepByNumber,
      Map<String, Integer> driverMaxStep) {
    if (heats == null) {
      return;
    }
    List<Heat> heatsCopy;
    synchronized (heats) {
      heatsCopy = new ArrayList<>(heats);
    }
    for (Heat heat : heatsCopy) {
      int heatNum = heat.getHeatNumber();
      int heatGroup = heat.getGroup();
      int heatStep = heat.getStep();
      heatStepByNumber.put(heatNum, heatStep);
      if (heat.isStarted()) {
        heatStartedByNumber.put(heatNum, true);
      }
      if (heat.getDrivers() != null) {
        List<DriverHeatData> driversCopy;
        synchronized (heat.getDrivers()) {
          driversCopy = new ArrayList<>(heat.getDrivers());
        }
        for (DriverHeatData dhd : driversCopy) {
          if (dhd != null && dhd.getDriver() != null) {
            String stableId = dhd.getDriver().getStableId();
            driverHeatsByNumber
                .computeIfAbsent(stableId, k -> new LinkedHashMap<>())
                .computeIfAbsent(heatNum, k -> new ArrayList<>())
                .add(dhd);
            driverToGroup.put(stableId, heatGroup);
            if (heatStep > 0) {
              int curMax = driverMaxStep.getOrDefault(stableId, 0);
              if (heatStep > curMax) {
                driverMaxStep.put(stableId, heatStep);
              }
            }
          }
        }
      }
    }
  }

  private void assignRanks(List<RaceParticipant> drivers) {
    int currentRank = 1;
    for (int i = 0; i < drivers.size(); i++) {
      RaceParticipant driver = drivers.get(i);
      boolean isEmpty = driver.getDriver() != null && driver.getDriver().isEmpty();
      driver.setRank(isEmpty || practice ? 99 : currentRank++);

      double rankValue = 0;
      if (HeatStandings.isFastestLapScoring(heatScoring, overallScoring)) {
        rankValue = driver.getBestLapTime();
      } else if (overallScoring != null && overallScoring.getRankingMethod() != null) {
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
          comparator = Comparator.comparingDouble(DriverHeatData::getScoredLapCount).reversed();
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
          case FIRST_TO_SET_TIME:
            comparator =
                comparator.thenComparingDouble(
                    d ->
                        d.getBestLapRecordedTime() == 0
                            ? Double.MAX_VALUE
                            : d.getBestLapRecordedTime());
            break;
          case SECOND_BEST_LAP_TIME:
            comparator = comparator.thenComparing(StandingsComparator::compareNthBestLaps);
            break;
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
          Comparator.comparingDouble(DriverHeatData::getScoredLapCount)
              .reversed()
              .thenComparingDouble(
                  d -> d.getTotalTime() == 0 ? Double.MAX_VALUE : d.getTotalTime());
    }
    return comparator;
  }

  private void rankWithMinAdvancing(
      List<RaceParticipant> drivers, Map<String, Integer> driverToGroup) {

    Map<Integer, List<RaceParticipant>> groupedDrivers = new HashMap<>();
    List<RaceParticipant> emptyDrivers = new ArrayList<>();

    for (RaceParticipant driver : new ArrayList<>(drivers)) {
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

  private void rankStepUpDrivers(
      List<RaceParticipant> drivers,
      Map<String, Integer> driverToGroup,
      Map<String, Integer> driverMaxStep) {

    Map<Integer, List<RaceParticipant>> groupedDrivers = new HashMap<>();
    List<RaceParticipant> emptyDrivers = new ArrayList<>();

    for (RaceParticipant driver : new ArrayList<>(drivers)) {
      if (driver.getDriver() != null && driver.getDriver().isEmpty()) {
        emptyDrivers.add(driver);
      } else {
        int group = driverToGroup.getOrDefault(driver.getStableId(), 0);
        groupedDrivers.computeIfAbsent(group, k -> new ArrayList<>()).add(driver);
      }
    }

    Comparator<RaceParticipant> baseComparator = getComparator();
    Comparator<RaceParticipant> stepUpComparator =
        (a, b) -> {
          int stepA = driverMaxStep.getOrDefault(a.getStableId(), 0);
          int stepB = driverMaxStep.getOrDefault(b.getStableId(), 0);
          if (stepA != stepB) {
            return Integer.compare(stepB, stepA); // Higher step ranks ahead
          }
          int comp = baseComparator.compare(a, b);
          if (comp != 0) {
            return comp;
          }
          return Integer.compare(a.getSeed(), b.getSeed());
        };

    List<RaceParticipant> sorted = new ArrayList<>();
    List<Integer> sortedGroups = new ArrayList<>(groupedDrivers.keySet());
    Collections.sort(sortedGroups);

    for (int grp : sortedGroups) {
      List<RaceParticipant> groupList = groupedDrivers.get(grp);
      groupList.sort(stepUpComparator);
      sorted.addAll(groupList);
    }

    drivers.clear();
    drivers.addAll(sorted);
    drivers.addAll(emptyDrivers);
  }

  private Comparator<RaceParticipant> getComparator() {
    return new StandingsComparator(
        HeatStandings.resolveOverallRankingMethod(heatScoring, overallScoring),
        HeatStandings.resolveOverallTiebreakerMethod(overallScoring));
  }

  private void calculateDriverStats(
      RaceParticipant driver,
      Map<Integer, List<DriverHeatData>> heatsByNumber,
      HeatRotationType rotationType,
      Map<Integer, Boolean> heatStartedByNumber) {
    List<DriverHeatData> myHeats = consolidateDriverHeats(heatsByNumber, rotationType);
    List<DriverHeatData> scoringHeats = getScoringHeats(myHeats);

    populateDriverHeatCounts(driver, heatsByNumber, heatStartedByNumber);

    double totalLaps = 0.0;
    double effectiveTotalLaps = 0.0;
    double totalTime = 0.0;
    double bestLap = Double.MAX_VALUE;
    int totalLapsLed = 0;
    int totalTrackCalls = 0;

    double bestTop2Consecutive = Double.MAX_VALUE;
    double bestTop3Consecutive = Double.MAX_VALUE;

    List<Double> allScoringLaps = new ArrayList<>();
    boolean hasSegments = false;
    for (DriverHeatData dhd : scoringHeats) {
      totalLaps += dhd.getScoredLapCount();
      effectiveTotalLaps += dhd.getEffectiveLapCount();
      totalTime += dhd.getTotalTime();
      totalLapsLed += dhd.getLapsLed();
      totalTrackCalls += dhd.getTrackCalls();
      if (dhd.getUserLaps() != 0.0 || (dhd.isFinished() && dhd.getAutoCalculatedLaps() != 0.0)) {
        hasSegments = true;
      }

      if (dhd.getBestLapTime() > 0 && dhd.getBestLapTime() < bestLap) {
        bestLap = dhd.getBestLapTime();
      }
      double top2 = dhd.getTop2Consecutive();
      if (top2 > 0 && top2 < bestTop2Consecutive) {
        bestTop2Consecutive = top2;
      }
      double top3 = dhd.getTop3Consecutive();
      if (top3 > 0 && top3 < bestTop3Consecutive) {
        bestTop3Consecutive = top3;
      }
      for (DriverHeatData.LapData lap : dhd.getLaps()) {
        allScoringLaps.add(lap.getLapTime());
      }
    }

    // Updating driver stats
    if (bestLap == Double.MAX_VALUE) {
      bestLap = 0.0;
    }
    driver.setAllScoringLaps(allScoringLaps);
    driver.setTotalLaps(totalLaps);
    driver.setEffectiveTotalLaps(effectiveTotalLaps);
    driver.setTotalTime(totalTime);
    driver.setBestLapTime(bestLap);
    driver.setLapsLed(totalLapsLed);
    driver.setTrackCalls(totalTrackCalls);
    driver.setTop2Consecutive(bestTop2Consecutive == Double.MAX_VALUE ? 0.0 : bestTop2Consecutive);
    driver.setTop3Consecutive(bestTop3Consecutive == Double.MAX_VALUE ? 0.0 : bestTop3Consecutive);
    driver.setHasSegments(hasSegments);

    if (!allScoringLaps.isEmpty()) {
      driver.setAverageLapTime(totalTime / allScoringLaps.size());

      Collections.sort(allScoringLaps);
      int middle = allScoringLaps.size() / 2;
      if (allScoringLaps.size() % 2 == 1) {
        driver.setMedianLapTime(allScoringLaps.get(middle));
      } else {
        driver.setMedianLapTime(
            (allScoringLaps.get(middle - 1) + allScoringLaps.get(middle)) / 2.0);
      }
      driver.setAverageTop5(RaceStatisticsUtils.calculateAverageTopN(allScoringLaps, 5));
      driver.setAverageTop10(RaceStatisticsUtils.calculateAverageTopN(allScoringLaps, 10));
      driver.setAverageTop15(RaceStatisticsUtils.calculateAverageTopN(allScoringLaps, 15));
    } else {
      driver.setAverageLapTime(0.0);
      driver.setMedianLapTime(0.0);
      driver.setAverageTop5(0.0);
      driver.setAverageTop10(0.0);
      driver.setAverageTop15(0.0);
    }
  }

  private void populateDriverHeatCounts(
      RaceParticipant driver,
      Map<Integer, List<DriverHeatData>> heatsByNumber,
      Map<Integer, Boolean> heatStartedByNumber) {
    int totalHeats = 0;
    int heatsRaced = 0;
    if (driver.getDriver() != null && !driver.getDriver().isEmpty()) {
      totalHeats = heatsByNumber != null ? heatsByNumber.size() : 0;
      if (heatsByNumber != null) {
        for (Map.Entry<Integer, List<DriverHeatData>> entry : heatsByNumber.entrySet()) {
          int heatNum = entry.getKey();
          boolean raced =
              heatStartedByNumber != null && Boolean.TRUE.equals(heatStartedByNumber.get(heatNum));
          if (!raced && entry.getValue() != null) {
            for (DriverHeatData dhd : entry.getValue()) {
              if (dhd != null
                  && (dhd.isFinished()
                      || dhd.getScoredLapCount() > 0
                      || dhd.getTotalTime() > 0
                      || dhd.getUserLaps() > 0
                      || dhd.getUserTime() > 0
                      || (dhd.getLaps() != null && !dhd.getLaps().isEmpty()))) {
                raced = true;
                break;
              }
            }
          }
          if (raced) {
            heatsRaced++;
          }
        }
      }
    }
    int heatsRemaining = Math.max(0, totalHeats - heatsRaced);
    driver.setHeatsRaced(heatsRaced);
    driver.setHeatsRemaining(heatsRemaining);
    driver.setTotalHeats(totalHeats);
  }

  private List<DriverHeatData> consolidateDriverHeats(
      Map<Integer, List<DriverHeatData>> heatsByNumber, HeatRotationType rotationType) {
    if (heatsByNumber == null || heatsByNumber.isEmpty()) {
      return new ArrayList<>();
    }

    List<DriverHeatData> consolidated = new ArrayList<>();
    for (Map.Entry<Integer, List<DriverHeatData>> entry : heatsByNumber.entrySet()) {
      List<DriverHeatData> dhdList = entry.getValue();
      if (dhdList.size() == 1) {
        consolidated.add(dhdList.get(0));
      } else {
        RaceParticipant participant = dhdList.get(0).getDriver();
        boolean accumulate =
            (participant != null && participant.isTeamParticipant())
                || rotationType == HeatRotationType.SingleHeatSoloAllLanesAccumulate;

        if (accumulate) {
          DriverHeatData combined =
              new DriverHeatData(dhdList.get(0).getDriver(), dhdList.get(0).getActualDriver());
          List<DriverHeatData.LapData> combinedLaps = new ArrayList<>();
          double combinedBest = Double.MAX_VALUE;
          for (DriverHeatData dhd : dhdList) {
            combinedLaps.addAll(dhd.getLaps());
            if (dhd.getBestLapTime() > 0 && dhd.getBestLapTime() < combinedBest) {
              combinedBest = dhd.getBestLapTime();
            }
          }
          combined.setLaps(combinedLaps);
          if (combinedBest != Double.MAX_VALUE) {
            combined.setBestLapTime(combinedBest);
          }
          consolidated.add(combined);
        } else {
          DriverHeatData best = dhdList.get(0);
          for (int i = 1; i < dhdList.size(); i++) {
            DriverHeatData candidate = dhdList.get(i);
            if (candidate.getScoredLapCount() > best.getScoredLapCount()) {
              best = candidate;
            } else if (candidate.getScoredLapCount() == best.getScoredLapCount()) {
              if (candidate.getTotalTime() < best.getTotalTime() && candidate.getTotalTime() > 0) {
                best = candidate;
              }
            }
          }
          consolidated.add(best);
        }
      }
    }
    return consolidated;
  }
}
