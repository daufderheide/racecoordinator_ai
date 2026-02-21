package com.antigravity.race;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

import com.antigravity.models.HeatScoring;
import com.antigravity.models.HeatScoring.HeatRanking;
import com.antigravity.models.HeatScoring.HeatRankingTiebreaker;
import com.antigravity.proto.HeatPositionUpdate;
import com.antigravity.proto.StandingsUpdate;

public class HeatStandings {

  private final HeatScoring scoring;
  private final HeatRanking sortType;
  private final HeatRankingTiebreaker tieBreaker;
  private final List<DriverHeatData> driverHeatData;
  private List<String> currentStandings;

  public HeatStandings(List<DriverHeatData> driverHeatData, HeatScoring scoring) {
    this.driverHeatData = new ArrayList<>(driverHeatData);
    this.scoring = scoring != null ? scoring : new HeatScoring();
    this.sortType = this.scoring.getHeatRanking();
    this.tieBreaker = this.scoring.getHeatRankingTiebreaker();
    this.currentStandings = this.calculateStandings();
  }

  public void reset() {
    this.currentStandings = this.driverHeatData.stream()
        .map(DriverHeatData::getObjectId)
        .collect(Collectors.toList());
  }

  public List<String> getStandings() {
    return currentStandings;
  }

  public HeatRanking getSortType() {
    return sortType;
  }

  public HeatRankingTiebreaker getTieBreaker() {
    return tieBreaker;
  }

  public StandingsUpdate updateStandings() {
    List<String> newStandings = calculateStandings();
    StandingsUpdate.Builder updateBuilder = StandingsUpdate.newBuilder();

    // Always send an update for all drivers to ensure gaps are refreshed on the
    // client
    for (int i = 0; i < newStandings.size(); i++) {
      String objectId = newStandings.get(i);
      DriverHeatData dhd = driverHeatData.stream().filter(d -> d.getObjectId().equals(objectId)).findFirst()
          .orElse(null);
      if (dhd != null) {
        updateBuilder.addUpdates(HeatPositionUpdate.newBuilder()
            .setObjectId(objectId)
            .setRank(i + 1)
            .setGapLeader(dhd.getGapLeader())
            .setGapPosition(dhd.getGapPosition())
            .build());
      }
    }

    currentStandings = newStandings;
    return updateBuilder.build();
  }

  public StandingsUpdate onLap(int lane, double lapTime) {
    return updateStandings();
  }

  private List<String> calculateStandings() {
    List<DriverHeatData> sortedDrivers = driverHeatData.stream()
        .sorted(getComparator())
        .collect(Collectors.toList());

    calculateGaps(sortedDrivers);

    List<String> standings = sortedDrivers.stream()
        .map(DriverHeatData::getObjectId)
        .collect(Collectors.toList());

    System.out.println("HeatStandings: Calculated standings: " + standings.stream()
        .map(id -> {
          DriverHeatData d = driverHeatData.stream().filter(dhd -> dhd.getObjectId().equals(id)).findFirst()
              .orElse(null);
          return (d != null ? d.getDriver().getDriver().getName() : "unknown") + "(" + (d != null ? d.getLapCount() : 0)
              + " laps)";
        })
        .collect(Collectors.joining(", ")));

    return standings;
  }

  private void calculateGaps(List<DriverHeatData> sortedDrivers) {
    if (sortedDrivers.isEmpty()) {
      return;
    }

    DriverHeatData leader = sortedDrivers.get(0);
    leader.setGapLeader(0.0);
    leader.setGapPosition(0.0);

    for (int i = 1; i < sortedDrivers.size(); i++) {
      DriverHeatData current = sortedDrivers.get(i);
      DriverHeatData ahead = sortedDrivers.get(i - 1);

      current.setGapLeader(calculateGap(leader, current));
      current.setGapPosition(calculateGap(ahead, current));
    }
  }

  private double calculateGap(DriverHeatData leadDriver, DriverHeatData curDriver) {
    switch (sortType) {
      case LAP_COUNT:
        return calculateGapForLapCount(leadDriver, curDriver);
      case TOTAL_TIME:
        return curDriver.getTotalTime() - leadDriver.getTotalTime();
      case FASTEST_LAP:
        return curDriver.getBestLapTime() - leadDriver.getBestLapTime();
      default:
        throw new IllegalArgumentException("Invalid sort type for gap calculation: " + sortType);
    }
  }

  private double calculateGapForLapCount(DriverHeatData leadDriver, DriverHeatData curDriver) {
    if (leadDriver.getLapCount() == curDriver.getLapCount()) {
      return curDriver.getTotalTime() - leadDriver.getTotalTime();
    } else if (curDriver.getLapCount() == 0) {
      return (double) leadDriver.getTotalTime();
    } else {
      double avgLapTime = curDriver.getAverageLapTime();
      double lapDiff = (double) leadDriver.getLapCount() - (double) curDriver.getLapCount();
      if (avgLapTime < leadDriver.getAverageLapTime()) {
        return avgLapTime * lapDiff;
      } else {
        double timeDiff = curDriver.getTotalTime() - leadDriver.getTotalTime();
        return Math.min(avgLapTime, timeDiff) + (avgLapTime * lapDiff);
      }
    }
  }

  private Comparator<DriverHeatData> getComparator() {
    Comparator<DriverHeatData> comparator;

    switch (sortType) {
      case LAP_COUNT:
        comparator = Comparator.comparingInt(DriverHeatData::getLapCount).reversed()
            .thenComparing(Comparator.comparingDouble(DriverHeatData::getTotalTime));
        break;
      case FASTEST_LAP:
        comparator = Comparator.comparingDouble(d -> d.getBestLapTime() == 0 ? Double.MAX_VALUE : d.getBestLapTime());
        break;
      case TOTAL_TIME:
        comparator = Comparator.comparingDouble(DriverHeatData::getTotalTime);
        break;
      default:
        comparator = (d1, d2) -> 0;
    }

    return comparator
        .thenComparing(d -> d.getReactionTime() == 0 ? Double.MAX_VALUE : d.getReactionTime())
        .thenComparing(getTieBreakerComparator());
  }

  private Comparator<DriverHeatData> getTieBreakerComparator() {
    switch (tieBreaker) {
      case FASTEST_LAP_TIME:
        return Comparator.comparingDouble(d -> d.getBestLapTime() == 0 ? Double.MAX_VALUE : d.getBestLapTime());
      case MEDIAN_LAP_TIME:
        return Comparator.comparingDouble(d -> d.getMedianLapTime() == 0 ? Double.MAX_VALUE : d.getMedianLapTime());
      case AVERAGE_LAP_TIME:
        return Comparator.comparingDouble(d -> d.getAverageLapTime() == 0 ? Double.MAX_VALUE : d.getAverageLapTime());
      default:
        return (d1, d2) -> 0;
    }
  }
}
