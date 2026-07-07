package com.antigravity.race;

import com.antigravity.models.HeatScoring;
import com.antigravity.models.HeatScoring.HeatRanking;
import com.antigravity.models.HeatScoring.HeatRankingTiebreaker;
import com.antigravity.proto.HeatPositionUpdate;
import com.antigravity.proto.StandingsUpdate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class HeatStandings {
  private static final Logger logger = LoggerFactory.getLogger(HeatStandings.class);

  private final HeatScoring scoring;
  private final HeatRanking sortType;
  private final HeatRankingTiebreaker tieBreaker;
  private final List<DriverHeatData> driverHeatData;
  private List<String> currentStandings;
  private final boolean practice;

  public HeatStandings(List<DriverHeatData> driverHeatData, HeatScoring scoring, boolean practice) {
    this.driverHeatData = new ArrayList<>(driverHeatData);
    this.scoring = scoring != null ? scoring : new HeatScoring();
    this.sortType = this.scoring.getHeatRanking();
    this.tieBreaker = this.scoring.getHeatRankingTiebreaker();
    this.practice = practice;
    this.currentStandings = this.calculateStandings();
  }

  public void reset() {
    this.currentStandings = this.calculateStandings();
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
    int currentRank = 1;
    for (int i = 0; i < newStandings.size(); i++) {
      String objectId = newStandings.get(i);
      DriverHeatData dhd =
          driverHeatData.stream()
              .filter(d -> d.getObjectId().equals(objectId))
              .findFirst()
              .orElse(null);
      if (dhd != null) {
        boolean isEmpty = dhd.getActualDriver() == null || dhd.getActualDriver().isEmpty();
        int rank = isEmpty || practice ? 99 : currentRank++;

        updateBuilder.addUpdates(
            HeatPositionUpdate.newBuilder()
                .setObjectId(objectId)
                .setRank(rank)
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
    List<DriverHeatData> sortedDrivers;
    if (practice) {
      sortedDrivers = new ArrayList<>(driverHeatData);
    } else {
      sortedDrivers = driverHeatData.stream().sorted(getComparator()).collect(Collectors.toList());
      calculateGaps(sortedDrivers);
    }

    List<String> standings =
        sortedDrivers.stream().map(DriverHeatData::getObjectId).collect(Collectors.toList());

    if (logger.isDebugEnabled()) {
      logger.debug(
          "Calculated standings: {}",
          standings.stream()
              .map(
                  id -> {
                    DriverHeatData d =
                        driverHeatData.stream()
                            .filter(dhd -> dhd.getObjectId().equals(id))
                            .findFirst()
                            .orElse(null);
                    return (d != null ? d.getDriver().getDriver().getName() : "unknown")
                        + "("
                        + (d != null ? d.getAdjustedLapCount() : 0)
                        + " laps)";
                  })
              .collect(Collectors.joining(", ")));
    }

    return standings;
  }

  private void calculateGaps(List<DriverHeatData> sortedDrivers) {
    GapCalculator.calculateGaps(sortedDrivers, scoring.getFinishMethod());
  }

  private Comparator<DriverHeatData> getComparator() {
    Comparator<DriverHeatData> comparator;

    switch (sortType) {
      case LAP_COUNT:
        comparator =
            Comparator.comparingDouble(DriverHeatData::getAdjustedLapCount)
                .reversed()
                .thenComparing(Comparator.comparingDouble(DriverHeatData::getTotalTime));
        break;
      case FASTEST_LAP:
        comparator =
            Comparator.comparingDouble(
                d -> d.getBestLapTime() == 0 ? Double.MAX_VALUE : d.getBestLapTime());
        break;
      case TOTAL_TIME:
        comparator = Comparator.comparingDouble(DriverHeatData::getTotalTime);
        break;
      default:
        comparator = (d1, d2) -> 0;
    }

    return Comparator.<DriverHeatData, Boolean>comparing(
            d -> d.getActualDriver() == null || d.getActualDriver().isEmpty())
        .thenComparing(comparator)
        .thenComparing(d -> d.getReactionTime() <= 0 ? Double.MAX_VALUE : d.getReactionTime())
        .thenComparing(getTieBreakerComparator());
  }

  private Comparator<DriverHeatData> getTieBreakerComparator() {
    switch (tieBreaker) {
      case FASTEST_LAP_TIME:
        return Comparator.comparingDouble(
            d -> d.getBestLapTime() == 0 ? Double.MAX_VALUE : d.getBestLapTime());
      case MEDIAN_LAP_TIME:
        return Comparator.comparingDouble(
            d -> d.getMedianLapTime() == 0 ? Double.MAX_VALUE : d.getMedianLapTime());
      case AVERAGE_LAP_TIME:
        return Comparator.comparingDouble(
            d -> d.getAverageLapTime() == 0 ? Double.MAX_VALUE : d.getAverageLapTime());
      default:
        return (d1, d2) -> 0;
    }
  }
}
