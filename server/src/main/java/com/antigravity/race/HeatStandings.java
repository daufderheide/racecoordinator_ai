package com.antigravity.race;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

import com.antigravity.models.RaceScoring.HeatRanking;
import com.antigravity.models.RaceScoring.HeatRankingTiebreaker;
import com.antigravity.proto.HeatPositionUpdate;
import com.antigravity.proto.StandingsUpdate;

public class HeatStandings {

  private final List<DriverHeatData> driverHeatData;
  private final HeatRanking sortType;
  private final HeatRankingTiebreaker tieBreaker;
  private List<String> currentStandings;

  public HeatStandings(List<DriverHeatData> driverHeatData, HeatRanking sortType, HeatRankingTiebreaker tieBreaker) {
    this.driverHeatData = new ArrayList<>(driverHeatData);
    this.sortType = sortType;
    this.tieBreaker = tieBreaker;
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

  public StandingsUpdate onLap(int lane, double lapTime) {
    List<String> newStandings = calculateStandings();
    StandingsUpdate.Builder updateBuilder = StandingsUpdate.newBuilder();
    boolean changed = false;

    // Check for changes and build update only for changed positions
    for (int i = 0; i < newStandings.size(); i++) {
      String objectId = newStandings.get(i);
      // If position i changed (was different objectId or list size grew)
      if (i >= currentStandings.size() || !objectId.equals(currentStandings.get(i))) {
        changed = true;
        updateBuilder.addUpdates(HeatPositionUpdate.newBuilder()
            .setObjectId(objectId)
            .setRank(i + 1)
            .build());
      }
    }

    if (changed) {
      currentStandings = newStandings;
      return updateBuilder.build();
    }
    return null;
  }

  private List<String> calculateStandings() {
    return driverHeatData.stream()
        .sorted(getComparator())
        .map(DriverHeatData::getObjectId)
        .collect(Collectors.toList());
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

    return comparator.thenComparing(getTieBreakerComparator());
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
