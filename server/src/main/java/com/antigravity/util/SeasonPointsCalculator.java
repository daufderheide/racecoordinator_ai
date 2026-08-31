package com.antigravity.util;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.Driver;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.OverallScoring;
import com.antigravity.models.RankingMethod;
import com.antigravity.models.Season;
import com.antigravity.models.SeasonRaceRecord;
import com.antigravity.models.SeasonRaceRecord.SeasonDriverResult;
import com.antigravity.models.SeasonScoring;
import com.antigravity.models.TiebreakerMethod;
import com.antigravity.race.ClientSubscriptionManager;
import com.antigravity.race.DriverHeatData;
import com.antigravity.race.EventExecutionManager;
import com.antigravity.race.Heat;
import com.antigravity.race.Race;
import com.antigravity.race.RaceParticipant;
import com.antigravity.race.states.HeatOver;
import com.antigravity.race.states.IRaceState;
import com.antigravity.race.states.Paused;
import com.antigravity.race.states.RaceOver;
import com.antigravity.race.states.Racing;
import com.antigravity.service.DatabaseService;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.AbstractMap;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class SeasonPointsCalculator {

  private static boolean hasAnyLaps(Heat heat) {
    if (heat == null || heat.getDrivers() == null) {
      return false;
    }
    for (DriverHeatData dhd : heat.getDrivers()) {
      if (dhd != null && dhd.getLaps() != null && !dhd.getLaps().isEmpty()) {
        return true;
      }
    }
    return false;
  }

  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class DriverSeasonStanding {
    @JsonProperty("driver_id")
    private final String driverId;

    @JsonProperty("driver_name")
    private final String driverName;

    @JsonProperty("net_points")
    private final double netPoints;

    @JsonProperty("gross_points")
    private final double grossPoints;

    @JsonProperty("races_run")
    private final int racesRun;

    @JsonProperty("race_scores")
    private final List<DriverRaceScoreDetail> raceScores;

    @JsonCreator
    public DriverSeasonStanding(
        @JsonProperty("driver_id") String driverId,
        @JsonProperty("driver_name") String driverName,
        @JsonProperty("net_points") Double netPoints,
        @JsonProperty("gross_points") Double grossPoints,
        @JsonProperty("races_run") Integer racesRun,
        @JsonProperty("race_scores") List<DriverRaceScoreDetail> raceScores) {
      this.driverId = driverId != null ? driverId : "";
      this.driverName = driverName != null ? driverName : "";
      this.netPoints = netPoints != null ? netPoints : 0.0;
      this.grossPoints = grossPoints != null ? grossPoints : 0.0;
      this.racesRun = racesRun != null ? racesRun : 0;
      this.raceScores = raceScores != null ? raceScores : new ArrayList<>();
    }

    public String getDriverId() {
      return driverId;
    }

    public String getDriverName() {
      return driverName;
    }

    public double getNetPoints() {
      return netPoints;
    }

    public double getGrossPoints() {
      return grossPoints;
    }

    public double getDroppedPoints() {
      return Math.round(Math.max(0.0, grossPoints - netPoints) * 100.0) / 100.0;
    }

    public int getRacesRun() {
      return racesRun;
    }

    public List<DriverRaceScoreDetail> getRaceScores() {
      return raceScores;
    }

    public double getCurrentRacePoints() {
      if (raceScores != null) {
        for (DriverRaceScoreDetail detail : raceScores) {
          if ("live_race".equals(detail.getRaceId()) || "live_event".equals(detail.getRaceId())) {
            return detail.getTotalPoints();
          }
        }
      }
      return 0;
    }

    public DriverRaceScoreDetail getCurrentRaceScoreDetail() {
      if (raceScores != null) {
        for (DriverRaceScoreDetail detail : raceScores) {
          if ("live_race".equals(detail.getRaceId()) || "live_event".equals(detail.getRaceId())) {
            return detail;
          }
        }
      }
      return null;
    }
  }

  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class DriverRaceScoreDetail {
    @JsonProperty("race_id")
    private final String raceId;

    @JsonProperty("race_name")
    private final String raceName;

    @JsonProperty("overall_rank")
    private final int overallRank;

    @JsonProperty("overall_points")
    private final double overallPoints;

    @JsonProperty("overall_bonus_points")
    private final double overallBonusPoints;

    @JsonProperty("overall_bonus_breakdown")
    private final Map<String, Double> overallBonusBreakdown;

    @JsonProperty("heat_points")
    private final double heatPoints;

    @JsonProperty("heat_bonus_points")
    private final double heatBonusPoints;

    @JsonProperty("heat_bonus_breakdown")
    private final Map<String, Double> heatBonusBreakdown;

    @JsonProperty("total_points")
    private final double totalPoints;

    @JsonProperty("is_dropped")
    private boolean isDropped;

    @JsonCreator
    public DriverRaceScoreDetail(
        @JsonProperty("race_id") String raceId,
        @JsonProperty("race_name") String raceName,
        @JsonProperty("overall_rank") Integer overallRank,
        @JsonProperty("overall_points") Double overallPoints,
        @JsonProperty("overall_bonus_points") Double overallBonusPoints,
        @JsonProperty("overall_bonus_breakdown") Map<String, Double> overallBonusBreakdown,
        @JsonProperty("heat_points") Double heatPoints,
        @JsonProperty("heat_bonus_points") Double heatBonusPoints,
        @JsonProperty("heat_bonus_breakdown") Map<String, Double> heatBonusBreakdown,
        @JsonProperty("total_points") Double totalPoints) {
      this.raceId = raceId;
      this.raceName = raceName;
      this.overallRank = overallRank != null ? overallRank : 0;
      this.overallPoints = overallPoints != null ? overallPoints : 0.0;
      this.overallBonusPoints = overallBonusPoints != null ? overallBonusPoints : 0.0;
      this.overallBonusBreakdown =
          overallBonusBreakdown != null ? overallBonusBreakdown : new HashMap<>();
      this.heatPoints = heatPoints != null ? heatPoints : 0.0;
      this.heatBonusPoints = heatBonusPoints != null ? heatBonusPoints : 0.0;
      this.heatBonusBreakdown = heatBonusBreakdown != null ? heatBonusBreakdown : new HashMap<>();
      this.totalPoints = totalPoints != null ? totalPoints : 0.0;
      this.isDropped = false;
    }

    public DriverRaceScoreDetail(
        String raceId,
        String raceName,
        int overallRank,
        double overallPoints,
        double overallBonusPoints,
        double heatPoints,
        double heatBonusPoints,
        double totalPoints) {
      this(
          raceId,
          raceName,
          overallRank,
          overallPoints,
          overallBonusPoints,
          null,
          heatPoints,
          heatBonusPoints,
          null,
          totalPoints);
    }

    public DriverRaceScoreDetail(
        String raceId,
        String raceName,
        int overallRank,
        double overallPoints,
        double heatPoints,
        double totalPoints) {
      this(
          raceId,
          raceName,
          overallRank,
          overallPoints,
          0.0,
          null,
          heatPoints,
          0.0,
          null,
          totalPoints);
    }

    public String getRaceId() {
      return raceId;
    }

    public String getRaceName() {
      return raceName;
    }

    public int getOverallRank() {
      return overallRank;
    }

    public double getOverallPoints() {
      return overallPoints;
    }

    public double getOverallBonusPoints() {
      return overallBonusPoints;
    }

    public Map<String, Double> getOverallBonusBreakdown() {
      return overallBonusBreakdown;
    }

    public double getHeatPoints() {
      return heatPoints;
    }

    public double getHeatBonusPoints() {
      return heatBonusPoints;
    }

    public Map<String, Double> getHeatBonusBreakdown() {
      return heatBonusBreakdown;
    }

    public double getTotalPoints() {
      return totalPoints;
    }

    public boolean isDropped() {
      return isDropped;
    }

    public void setDropped(boolean isDropped) {
      this.isDropped = isDropped;
    }
  }

  private static boolean isHeatCompleted(
      Heat heat, int hIdx, int currentHeatIdx, IRaceState raceState) {
    if (raceState instanceof RaceOver) {
      return true;
    }
    if (currentHeatIdx >= 0) {
      if (hIdx < currentHeatIdx) {
        return true;
      }
      if (hIdx == currentHeatIdx) {
        if (raceState instanceof HeatOver) {
          return true;
        }
        if ((raceState instanceof Racing || raceState instanceof Paused) && hasAnyLaps(heat)) {
          return true;
        }
      }
    } else {
      if (heat.getStatistics() != null && heat.getStatistics().getEndTime() != null) {
        return true;
      }
      if (heat.isStarted() && hasAnyLaps(heat)) {
        return true;
      }
    }
    return false;
  }

  public static List<SeasonDriverResult> calculateDriverResultsForRace(Race runtimeRace) {
    if (runtimeRace == null || runtimeRace.getDrivers() == null) {
      return new ArrayList<>();
    }

    SeasonScoring scoring =
        runtimeRace.getRaceModel() != null && runtimeRace.getRaceModel().getSeasonScoring() != null
            ? runtimeRace.getRaceModel().getSeasonScoring()
            : new SeasonScoring();

    Map<String, Double> driverOverallPoints = new HashMap<>();
    Map<String, Integer> driverOverallRanks = new HashMap<>();
    Map<String, String> driverNames = new HashMap<>();
    Map<String, List<Double>> overallBonusesMap = new HashMap<>();
    Map<String, Map<String, Double>> overallBreakdownMap = new HashMap<>();
    Map<String, List<Double>> heatBonusesMap = new HashMap<>();
    Map<String, Map<String, Double>> heatBreakdownMap = new HashMap<>();

    initDriverOverallData(
        runtimeRace,
        scoring,
        driverOverallPoints,
        driverOverallRanks,
        driverNames,
        overallBonusesMap,
        overallBreakdownMap,
        heatBonusesMap,
        heatBreakdownMap);

    calculateOverallBonuses(runtimeRace, scoring, overallBonusesMap, overallBreakdownMap);

    Map<String, Double> driverHeatPoints = new HashMap<>();
    calculateHeatPointsAndBonuses(
        runtimeRace, scoring, driverHeatPoints, heatBonusesMap, heatBreakdownMap);

    resolveOneBonusPerDriver(
        overallBonusesMap, overallBreakdownMap, scoring.isOverallOneBonusPerDriver());

    return buildFinalDriverResults(
        driverNames,
        driverOverallRanks,
        driverOverallPoints,
        overallBonusesMap,
        overallBreakdownMap,
        driverHeatPoints,
        heatBonusesMap,
        heatBreakdownMap);
  }

  private static void initDriverOverallData(
      Race runtimeRace,
      SeasonScoring scoring,
      Map<String, Double> driverOverallPoints,
      Map<String, Integer> driverOverallRanks,
      Map<String, String> driverNames,
      Map<String, List<Double>> overallBonusesMap,
      Map<String, Map<String, Double>> overallBreakdownMap,
      Map<String, List<Double>> heatBonusesMap,
      Map<String, Map<String, Double>> heatBreakdownMap) {
    List<Double> posPointsList = scoring.getPositionPoints();
    double overallCarryOverPct = scoring.getOverallCarryOverPct();

    List<RaceParticipant> sortedParticipants = new ArrayList<>(runtimeRace.getDrivers());
    sortedParticipants.sort(Comparator.comparingInt(RaceParticipant::getRank));

    for (int i = 0; i < sortedParticipants.size(); i++) {
      RaceParticipant rp = sortedParticipants.get(i);
      if (rp == null || rp.getDriver() == null || Driver.isEmpty(rp.getDriver())) {
        continue;
      }
      String driverId = rp.getDriver().getEntityId();
      String driverName = rp.getDriver().getDisplayName();
      int rank = rp.getRank() > 0 ? rp.getRank() : (i + 1);

      double posPoints = 0.0;
      int pointIdx = rank - 1;
      if (pointIdx >= 0 && pointIdx < posPointsList.size()) {
        posPoints = posPointsList.get(pointIdx);
      }

      if (overallCarryOverPct > 0) {
        posPoints += calculateOverallCarryOver(runtimeRace, driverId, overallCarryOverPct);
      }

      driverOverallPoints.put(driverId, posPoints);
      driverOverallRanks.put(driverId, rank);
      driverNames.put(driverId, driverName);
      overallBonusesMap.put(driverId, new ArrayList<>());
      overallBreakdownMap.put(driverId, new HashMap<>());
      heatBonusesMap.put(driverId, new ArrayList<>());
      heatBreakdownMap.put(driverId, new HashMap<>());
    }
  }

  private static double calculateOverallCarryOver(
      Race runtimeRace, String driverId, double overallCarryOverPct) {
    if (runtimeRace.getRaceModel() == null
        || runtimeRace.getRaceModel().getOverallScoring() == null) {
      return 0.0;
    }
    if (runtimeRace.getRaceModel().getOverallScoring().getRankingMethod()
        != OverallScoring.OverallRanking.LAP_COUNT) {
      return 0.0;
    }
    double totalLaps = 0;
    if (runtimeRace.getHeats() != null) {
      for (Heat h : runtimeRace.getHeats()) {
        if (h.getDrivers() != null) {
          for (DriverHeatData dhd : h.getDrivers()) {
            if (!dhd.isEmptyParticipant()
                && ((dhd.getActualDriver() != null
                        && dhd.getActualDriver().getEntityId().equals(driverId))
                    || (dhd.getDriver() != null
                        && dhd.getDriver().getDriver().getEntityId().equals(driverId)))) {
              totalLaps += dhd.getAdjustedLapCount();
            }
          }
        }
      }
    }
    return totalLaps * (overallCarryOverPct / 100.0);
  }

  private static void calculateOverallBonuses(
      Race runtimeRace,
      SeasonScoring scoring,
      Map<String, List<Double>> overallBonusesMap,
      Map<String, Map<String, Double>> overallBreakdownMap) {
    List<Heat> heats = runtimeRace.getHeats();
    if (heats == null || heats.isEmpty()) {
      return;
    }

    calculateOverallFastestLapBonus(
        heats, scoring.getOverallBonusFastestLap(), overallBonusesMap, overallBreakdownMap);
    calculateOverallFastestLapPerLaneBonus(
        heats, scoring.getOverallBonusFastestLapPerLane(), overallBonusesMap, overallBreakdownMap);
    calculateOverallLapsLedBonuses(
        runtimeRace,
        heats,
        scoring.getOverallBonusLedLap(),
        scoring.getOverallBonusMostLapsLed(),
        overallBonusesMap,
        overallBreakdownMap);
  }

  private static void calculateOverallFastestLapBonus(
      List<Heat> heats,
      double bonus,
      Map<String, List<Double>> overallBonusesMap,
      Map<String, Map<String, Double>> overallBreakdownMap) {
    if (bonus <= 0 || heats == null || heats.isEmpty()) return;
    double minLap = Double.MAX_VALUE;
    for (Heat heat : heats) {
      if (heat == null || heat.getDrivers() == null) continue;
      for (DriverHeatData dhd : heat.getDrivers()) {
        if (dhd == null || dhd.isEmptyParticipant()) continue;
        double best = dhd.getBestLapTime();
        if (best > 0 && best < minLap) {
          minLap = best;
        }
      }
    }
    if (minLap < Double.MAX_VALUE) {
      for (Heat heat : heats) {
        if (heat == null || heat.getDrivers() == null) continue;
        for (DriverHeatData dhd : heat.getDrivers()) {
          if (dhd == null || dhd.isEmptyParticipant()) continue;
          if (Math.abs(dhd.getBestLapTime() - minLap) < 0.0001) {
            String driverId = getDriverIdFromDhd(dhd);
            if (driverId != null
                && !driverId.isEmpty()
                && overallBonusesMap.containsKey(driverId)
                && !overallBonusesMap.get(driverId).contains(bonus)) {
              overallBonusesMap.get(driverId).add(bonus);
              if (overallBreakdownMap.containsKey(driverId)) {
                overallBreakdownMap.get(driverId).put("fastest_lap", bonus);
              }
            }
          }
        }
      }
    }
  }

  private static void calculateOverallFastestLapPerLaneBonus(
      List<Heat> heats,
      double bonus,
      Map<String, List<Double>> overallBonusesMap,
      Map<String, Map<String, Double>> overallBreakdownMap) {
    if (bonus <= 0 || heats == null || heats.isEmpty()) return;

    // Find the minimum lap time per lane across all heats
    Map<Integer, Double> laneMinLap = new HashMap<>();
    for (Heat heat : heats) {
      if (heat == null || heat.getDrivers() == null) continue;
      for (int laneIdx = 0; laneIdx < heat.getDrivers().size(); laneIdx++) {
        DriverHeatData dhd = heat.getDrivers().get(laneIdx);
        if (dhd == null || dhd.isEmptyParticipant()) continue;
        int lane = getLaneForDhd(dhd, laneIdx, heat);
        double best = dhd.getBestLapTime();
        if (best > 0) {
          double currentMin = laneMinLap.getOrDefault(lane, Double.MAX_VALUE);
          if (best < currentMin) {
            laneMinLap.put(lane, best);
          }
        }
      }
    }

    // For each lane, find the unique driver(s) who got the fastest lap in that lane
    for (Map.Entry<Integer, Double> entry : laneMinLap.entrySet()) {
      int lane = entry.getKey();
      double minForLane = entry.getValue();
      Set<String> laneWinners = new HashSet<>();

      for (Heat heat : heats) {
        if (heat == null || heat.getDrivers() == null) continue;
        for (int laneIdx = 0; laneIdx < heat.getDrivers().size(); laneIdx++) {
          DriverHeatData dhd = heat.getDrivers().get(laneIdx);
          if (dhd == null || dhd.isEmptyParticipant()) continue;
          int currentLane = getLaneForDhd(dhd, laneIdx, heat);
          if (currentLane == lane) {
            double best = dhd.getBestLapTime();
            if (best > 0 && Math.abs(best - minForLane) < 0.0001) {
              String driverId = getDriverIdFromDhd(dhd);
              if (driverId != null && !driverId.isEmpty()) {
                laneWinners.add(driverId);
              }
            }
          }
        }
      }

      for (String driverId : laneWinners) {
        if (overallBonusesMap.containsKey(driverId)) {
          overallBonusesMap.get(driverId).add(bonus);
          if (overallBreakdownMap.containsKey(driverId)) {
            overallBreakdownMap.get(driverId).put("fastest_lap_lane_" + (lane + 1), bonus);
          }
        }
      }
    }
  }

  private static int getLaneForDhd(DriverHeatData dhd, int laneIdx, Heat heat) {
    if (dhd == null) return laneIdx;
    if (dhd.getLane() >= 0) {
      if (heat != null && heat.getDrivers() != null && heat.getDrivers().size() > 1) {
        int dupCount = 0;
        for (DriverHeatData other : heat.getDrivers()) {
          if (other != null && !other.isEmptyParticipant() && other.getLane() == dhd.getLane()) {
            dupCount++;
          }
        }
        if (dupCount > 1) {
          return laneIdx;
        }
      }
      return dhd.getLane();
    }
    return laneIdx;
  }

  private static String getDriverIdFromDhd(DriverHeatData dhd) {
    if (dhd == null) return null;
    if (dhd.getDriver() != null && dhd.getDriver().getDriver() != null) {
      String id = dhd.getDriver().getDriver().getEntityId();
      if (id != null && !id.isEmpty()) return id;
    }
    if (dhd.getActualDriver() != null) {
      String id = dhd.getActualDriver().getEntityId();
      if (id != null && !id.isEmpty()) return id;
    }
    String id = dhd.getParticipantId();
    if (id != null && !id.isEmpty()) return id;
    return null;
  }

  private static void calculateOverallLapsLedBonuses(
      Race runtimeRace,
      List<Heat> heats,
      double ledLapBonus,
      double mostLapsLedBonus,
      Map<String, List<Double>> overallBonusesMap,
      Map<String, Map<String, Double>> overallBreakdownMap) {
    if (ledLapBonus <= 0 && mostLapsLedBonus <= 0) return;

    Map<String, List<DriverHeatData.LapData>> driverLaps = new HashMap<>();
    Map<String, DriverHeatData> driverFirstDhd = new HashMap<>();

    for (Heat heat : heats) {
      if (heat == null || heat.getDrivers() == null) continue;
      for (DriverHeatData dhd : heat.getDrivers()) {
        if (dhd == null || dhd.isEmptyParticipant()) continue;
        String driverId =
            dhd.getDriver() != null && dhd.getDriver().getDriver() != null
                ? dhd.getDriver().getDriver().getEntityId()
                : dhd.getParticipantId();
        if (driverId == null || driverId.isEmpty()) continue;
        driverFirstDhd.putIfAbsent(driverId, dhd);

        if (dhd.getLaps() != null && !dhd.getLaps().isEmpty()) {
          driverLaps.computeIfAbsent(driverId, k -> new ArrayList<>()).addAll(dhd.getLaps());
        }
      }
    }

    List<DriverHeatData> consolidatedDrivers = new ArrayList<>();
    for (Map.Entry<String, DriverHeatData> entry : driverFirstDhd.entrySet()) {
      String driverId = entry.getKey();
      DriverHeatData templateDhd = entry.getValue();
      List<DriverHeatData.LapData> laps = driverLaps.getOrDefault(driverId, new ArrayList<>());
      DriverHeatData consolidated =
          new DriverHeatData(templateDhd.getDriver(), templateDhd.getActualDriver());
      consolidated.setLaps(laps);
      consolidatedDrivers.add(consolidated);
    }

    RankingMethod oRank = RankingMethod.LAP_COUNT;
    TiebreakerMethod oTie = TiebreakerMethod.AVERAGE_LAP_TIME;
    if (runtimeRace.getRaceModel() != null
        && runtimeRace.getRaceModel().getOverallScoring() != null) {
      oRank = runtimeRace.getRaceModel().getOverallScoring().toRankingMethod();
      oTie = runtimeRace.getRaceModel().getOverallScoring().toTiebreakerMethod();
    }

    Map<String, Integer> overallLapsLed =
        GhostRaceSimulator.calculateLapsLed(consolidatedDrivers, oRank, oTie);
    int maxLed = 0;
    String mostLapsLedDriver = null;

    List<RaceParticipant> participants = runtimeRace.getDrivers();
    if (participants != null && !participants.isEmpty()) {
      for (RaceParticipant rp : participants) {
        if (rp == null || rp.getDriver() == null || rp.getDriver().getEntityId() == null) continue;
        String driverId = rp.getDriver().getEntityId();
        int led = overallLapsLed.getOrDefault(driverId, 0);
        if (led > 0 && ledLapBonus > 0 && overallBonusesMap.containsKey(driverId)) {
          overallBonusesMap.get(driverId).add(ledLapBonus);
          if (overallBreakdownMap.containsKey(driverId)) {
            overallBreakdownMap.get(driverId).put("led_lap", ledLapBonus);
          }
        }
        if (led > maxLed) {
          maxLed = led;
          mostLapsLedDriver = driverId;
        }
      }
    } else {
      for (DriverHeatData dhd : consolidatedDrivers) {
        String driverId = dhd.getParticipantId();
        int led = overallLapsLed.getOrDefault(driverId, 0);
        if (led > 0 && ledLapBonus > 0 && overallBonusesMap.containsKey(driverId)) {
          overallBonusesMap.get(driverId).add(ledLapBonus);
          if (overallBreakdownMap.containsKey(driverId)) {
            overallBreakdownMap.get(driverId).put("led_lap", ledLapBonus);
          }
        }
        if (led > maxLed) {
          maxLed = led;
          mostLapsLedDriver = driverId;
        }
      }
    }

    if (maxLed > 0 && mostLapsLedBonus > 0 && mostLapsLedDriver != null) {
      if (overallBonusesMap.containsKey(mostLapsLedDriver)) {
        overallBonusesMap.get(mostLapsLedDriver).add(mostLapsLedBonus);
        if (overallBreakdownMap.containsKey(mostLapsLedDriver)) {
          overallBreakdownMap.get(mostLapsLedDriver).put("most_laps_led", mostLapsLedBonus);
        }
      }
    }
  }

  private static void calculateHeatPointsAndBonuses(
      Race runtimeRace,
      SeasonScoring scoring,
      Map<String, Double> driverHeatPoints,
      Map<String, List<Double>> heatBonusesMap,
      Map<String, Map<String, Double>> heatBreakdownMap) {
    List<Heat> heats = runtimeRace.getHeats();
    if (heats == null) return;
    Heat currentHeat = runtimeRace.getCurrentHeat();
    int currentHeatIdx = currentHeat != null ? heats.indexOf(currentHeat) : -1;
    IRaceState raceState = runtimeRace.getState();

    for (int hIdx = 0; hIdx < heats.size(); hIdx++) {
      Heat heat = heats.get(hIdx);
      if (heat == null || heat.getDrivers() == null) continue;
      if (!isHeatCompleted(heat, hIdx, currentHeatIdx, raceState)) continue;

      int heatNum = heat.getHeatNumber() > 0 ? heat.getHeatNumber() : (hIdx + 1);
      processSingleHeat(
          runtimeRace, heat, heatNum, scoring, driverHeatPoints, heatBonusesMap, heatBreakdownMap);
    }
  }

  private static void processSingleHeat(
      Race runtimeRace,
      Heat heat,
      int heatNum,
      SeasonScoring scoring,
      Map<String, Double> driverHeatPoints,
      Map<String, List<Double>> heatBonusesMap,
      Map<String, Map<String, Double>> heatBreakdownMap) {
    List<Double> heatPosPointsList = scoring.getHeatPositionPoints();
    double heatCarryOverPct = scoring.getHeatCarryOverPct();
    Map<String, List<Double>> heatSpecificBonuses = new HashMap<>();
    Map<String, Map<String, Double>> heatSpecificBreakdown = new HashMap<>();

    List<DriverHeatData> heatDrivers = new ArrayList<>(heat.getDrivers());
    heatDrivers.sort(
        (a, b) -> {
          int aLaps = a.getLaps() != null ? a.getLaps().size() : 0;
          int bLaps = b.getLaps() != null ? b.getLaps().size() : 0;
          if (aLaps != bLaps) {
            return Integer.compare(bLaps, aLaps);
          }
          return Double.compare(a.getTotalTime(), b.getTotalTime());
        });

    for (int laneIdx = 0; laneIdx < heatDrivers.size(); laneIdx++) {
      DriverHeatData dhd = heatDrivers.get(laneIdx);
      if (dhd.isEmptyParticipant()) continue;
      String driverId = getDriverIdFromDhd(dhd);
      if (driverId == null || driverId.isEmpty()) continue;

      double heatPoints = 0;
      if (laneIdx < heatPosPointsList.size()) {
        heatPoints = heatPosPointsList.get(laneIdx);
      }

      if (heatCarryOverPct > 0) {
        if (runtimeRace.getRaceModel() != null
            && runtimeRace.getRaceModel().getHeatScoring() != null) {
          if (runtimeRace.getRaceModel().getHeatScoring().getHeatRanking()
              == HeatScoring.HeatRanking.LAP_COUNT) {
            heatPoints += dhd.getAdjustedLapCount() * (heatCarryOverPct / 100.0);
          }
        }
      }

      driverHeatPoints.put(driverId, driverHeatPoints.getOrDefault(driverId, 0.0) + heatPoints);
      heatSpecificBonuses.put(driverId, new ArrayList<>());
      heatSpecificBreakdown.put(driverId, new HashMap<>());
    }

    calculateSingleHeatBonuses(
        runtimeRace, heat, heatNum, scoring, heatSpecificBonuses, heatSpecificBreakdown);

    boolean heatOneBonusPerDriver = scoring.isHeatOneBonusPerDriver();
    for (Map.Entry<String, List<Double>> entry : heatSpecificBonuses.entrySet()) {
      String driverId = entry.getKey();
      Map<String, Double> thisHeatBreakdown =
          heatSpecificBreakdown.getOrDefault(driverId, new HashMap<>());
      if (heatOneBonusPerDriver) {
        if (!entry.getValue().isEmpty()) {
          List<Double> sortedBonuses = new ArrayList<>(entry.getValue());
          Collections.sort(sortedBonuses, Collections.reverseOrder());
          double topBonus = sortedBonuses.get(0);
          heatBonusesMap.computeIfAbsent(driverId, k -> new ArrayList<>()).add(topBonus);

          String winningCategory = null;
          for (Map.Entry<String, Double> bEntry : thisHeatBreakdown.entrySet()) {
            if (Math.abs(bEntry.getValue() - topBonus) < 0.0001) {
              winningCategory = bEntry.getKey();
              break;
            }
          }
          if (winningCategory != null) {
            Map<String, Double> totalDriverHeatBreakdown =
                heatBreakdownMap.computeIfAbsent(driverId, k -> new HashMap<>());
            totalDriverHeatBreakdown.put(
                winningCategory,
                totalDriverHeatBreakdown.getOrDefault(winningCategory, 0.0) + topBonus);
          }
        }
      } else {
        heatBonusesMap.computeIfAbsent(driverId, k -> new ArrayList<>()).addAll(entry.getValue());
        Map<String, Double> totalDriverHeatBreakdown =
            heatBreakdownMap.computeIfAbsent(driverId, k -> new HashMap<>());
        for (Map.Entry<String, Double> bEntry : thisHeatBreakdown.entrySet()) {
          totalDriverHeatBreakdown.put(
              bEntry.getKey(),
              totalDriverHeatBreakdown.getOrDefault(bEntry.getKey(), 0.0) + bEntry.getValue());
        }
      }
    }
  }

  private static void calculateSingleHeatBonuses(
      Race runtimeRace,
      Heat heat,
      int heatNum,
      SeasonScoring scoring,
      Map<String, List<Double>> heatSpecificBonuses,
      Map<String, Map<String, Double>> heatSpecificBreakdown) {
    double heatBonusFastestLap = scoring.getHeatBonusFastestLap();
    double heatBonusLedLap = scoring.getHeatBonusLedLap();
    double heatBonusMostLapsLed = scoring.getHeatBonusMostLapsLed();

    if (heatBonusFastestLap > 0) {
      double minLap = Double.MAX_VALUE;
      for (DriverHeatData dhd : heat.getDrivers()) {
        if (dhd.isEmptyParticipant()) continue;
        double best = dhd.getBestLapTime();
        if (best > 0 && best < minLap) {
          minLap = best;
        }
      }
      if (minLap < Double.MAX_VALUE) {
        for (DriverHeatData dhd : heat.getDrivers()) {
          if (dhd.isEmptyParticipant()) continue;
          if (Math.abs(dhd.getBestLapTime() - minLap) < 0.0001) {
            String driverId = getDriverIdFromDhd(dhd);
            if (driverId != null && heatSpecificBonuses.containsKey(driverId)) {
              heatSpecificBonuses.get(driverId).add(heatBonusFastestLap);
              heatSpecificBreakdown
                  .computeIfAbsent(driverId, k -> new HashMap<>())
                  .put("fastest_lap_heat_" + heatNum, heatBonusFastestLap);
            }
          }
        }
      }
    }

    if (heatBonusLedLap > 0 || heatBonusMostLapsLed > 0) {
      RankingMethod hRank = RankingMethod.LAP_COUNT;
      TiebreakerMethod hTie = TiebreakerMethod.AVERAGE_LAP_TIME;
      if (runtimeRace.getRaceModel() != null
          && runtimeRace.getRaceModel().getHeatScoring() != null) {
        hRank = runtimeRace.getRaceModel().getHeatScoring().toRankingMethod();
        hTie = runtimeRace.getRaceModel().getHeatScoring().toTiebreakerMethod();
      }

      Map<String, Integer> heatLapsLed =
          GhostRaceSimulator.calculateLapsLed(heat.getDrivers(), hRank, hTie);

      if (heatBonusLedLap > 0) {
        for (Map.Entry<String, Integer> entry : heatLapsLed.entrySet()) {
          String driverId = entry.getKey();
          int led = entry.getValue();
          if (led > 0 && heatSpecificBonuses.containsKey(driverId)) {
            heatSpecificBonuses.get(driverId).add(heatBonusLedLap);
            heatSpecificBreakdown
                .computeIfAbsent(driverId, k -> new HashMap<>())
                .put("led_lap_heat_" + heatNum, heatBonusLedLap);
          }
        }
      }

      if (heatBonusMostLapsLed > 0) {
        int maxLedInHeat = 0;
        String mostLapsLedDriver = null;

        List<RaceParticipant> participants = runtimeRace.getDrivers();
        if (participants != null && !participants.isEmpty()) {
          for (RaceParticipant rp : participants) {
            if (rp == null || rp.getDriver() == null || rp.getDriver().getEntityId() == null) {
              continue;
            }
            String driverId = rp.getDriver().getEntityId();
            int led = heatLapsLed.getOrDefault(driverId, 0);
            if (led > maxLedInHeat) {
              maxLedInHeat = led;
              mostLapsLedDriver = driverId;
            }
          }
        } else {
          for (DriverHeatData dhd : heat.getDrivers()) {
            if (dhd.isEmptyParticipant()) continue;
            String driverId = getDriverIdFromDhd(dhd);
            if (driverId == null) continue;
            int led = heatLapsLed.getOrDefault(driverId, 0);
            if (led > maxLedInHeat) {
              maxLedInHeat = led;
              mostLapsLedDriver = driverId;
            }
          }
        }

        if (maxLedInHeat > 0
            && mostLapsLedDriver != null
            && heatSpecificBonuses.containsKey(mostLapsLedDriver)) {
          heatSpecificBonuses.get(mostLapsLedDriver).add(heatBonusMostLapsLed);
          heatSpecificBreakdown
              .computeIfAbsent(mostLapsLedDriver, k -> new HashMap<>())
              .put("most_laps_led_heat_" + heatNum, heatBonusMostLapsLed);
        }
      }
    }
  }

  private static void resolveOneBonusPerDriver(
      Map<String, List<Double>> bonusesMap,
      Map<String, Map<String, Double>> breakdownMap,
      boolean oneBonusPerDriver) {
    if (!oneBonusPerDriver) return;
    for (Map.Entry<String, List<Double>> entry : bonusesMap.entrySet()) {
      String driverId = entry.getKey();
      if (!entry.getValue().isEmpty()) {
        List<Double> sortedBonuses = new ArrayList<>(entry.getValue());
        Collections.sort(sortedBonuses, Collections.reverseOrder());
        double bestBonus = sortedBonuses.get(0);
        entry.getValue().clear();
        entry.getValue().add(bestBonus);

        if (breakdownMap != null && breakdownMap.containsKey(driverId)) {
          Map<String, Double> driverBreakdown = breakdownMap.get(driverId);
          String bestCategory = null;
          for (Map.Entry<String, Double> bEntry : driverBreakdown.entrySet()) {
            if (Math.abs(bEntry.getValue() - bestBonus) < 0.0001) {
              bestCategory = bEntry.getKey();
              break;
            }
          }
          driverBreakdown.clear();
          if (bestCategory != null) {
            driverBreakdown.put(bestCategory, bestBonus);
          }
        }
      }
    }
  }

  private static List<SeasonDriverResult> buildFinalDriverResults(
      Map<String, String> driverNames,
      Map<String, Integer> driverOverallRanks,
      Map<String, Double> driverOverallPoints,
      Map<String, List<Double>> overallBonusesMap,
      Map<String, Map<String, Double>> overallBreakdownMap,
      Map<String, Double> driverHeatPoints,
      Map<String, List<Double>> heatBonusesMap,
      Map<String, Map<String, Double>> heatBreakdownMap) {
    List<SeasonDriverResult> results = new ArrayList<>();
    for (String driverId : driverNames.keySet()) {
      String name = driverNames.get(driverId);
      int rank = driverOverallRanks.getOrDefault(driverId, 0);
      double overallPts = driverOverallPoints.getOrDefault(driverId, 0.0);
      List<Double> oBonuses = overallBonusesMap.getOrDefault(driverId, new ArrayList<>());
      double overallBonusPts = 0.0;
      for (Double b : oBonuses) {
        overallBonusPts += b;
      }

      double heatPts = driverHeatPoints.getOrDefault(driverId, 0.0);
      List<Double> hBonuses = heatBonusesMap.getOrDefault(driverId, new ArrayList<>());
      double heatBonusPts = 0.0;
      for (Double b : hBonuses) {
        heatBonusPts += b;
      }

      double totalPts = overallPts + overallBonusPts + heatPts + heatBonusPts;
      Map<String, Double> oBreakdown =
          overallBreakdownMap != null
              ? overallBreakdownMap.getOrDefault(driverId, new HashMap<>())
              : new HashMap<>();
      Map<String, Double> hBreakdown =
          heatBreakdownMap != null
              ? heatBreakdownMap.getOrDefault(driverId, new HashMap<>())
              : new HashMap<>();

      results.add(
          new SeasonDriverResult(
              driverId,
              name,
              rank,
              overallPts,
              overallBonusPts,
              oBreakdown,
              heatPts,
              heatBonusPts,
              hBreakdown,
              totalPts));
    }
    results.sort(Comparator.comparingInt(SeasonDriverResult::getOverallRank));
    return results;
  }

  public static List<DriverSeasonStanding> calculateLiveStandings(
      Season dbSeason, Race runtimeRace) {
    Season baseSeason = dbSeason != null ? dbSeason : new Season("", 0);
    List<SeasonRaceRecord> races = new ArrayList<>(baseSeason.getRaces());

    if (runtimeRace != null
        && runtimeRace.getDrivers() != null
        && !runtimeRace.getDrivers().isEmpty()) {
      EventExecutionManager eventMgr = EventExecutionManager.getInstance();
      if (eventMgr.isEventActive()) {
        Map<String, SeasonDriverResult> eventLiveMap = new HashMap<>();
        Map<String, SeasonDriverResult> accumulated = eventMgr.getEventDriverResultsMap();
        if (accumulated != null) {
          eventLiveMap.putAll(accumulated);
        }

        List<SeasonDriverResult> activeRaceResults = calculateDriverResultsForRace(runtimeRace);
        for (SeasonDriverResult r : activeRaceResults) {
          String dId = r.getDriverId();
          SeasonDriverResult existing = eventLiveMap.get(dId);
          if (existing != null) {
            double combinedPosPts = existing.getOverallPoints() + r.getOverallPoints();
            double combinedOverallBonus =
                existing.getOverallBonusPoints() + r.getOverallBonusPoints();
            double combinedHeatPts = existing.getHeatPoints() + r.getHeatPoints();
            double combinedHeatBonus = existing.getHeatBonusPoints() + r.getHeatBonusPoints();
            double combinedTotal =
                combinedPosPts + combinedOverallBonus + combinedHeatPts + combinedHeatBonus;
            int bestRank = Math.min(existing.getOverallRank(), r.getOverallRank());

            Map<String, Double> mergedOverallBreakdown =
                new HashMap<>(existing.getOverallBonusBreakdown());
            r.getOverallBonusBreakdown()
                .forEach(
                    (k, v) ->
                        mergedOverallBreakdown.put(
                            k, mergedOverallBreakdown.getOrDefault(k, 0.0) + v));

            Map<String, Double> mergedHeatBreakdown =
                new HashMap<>(existing.getHeatBonusBreakdown());
            r.getHeatBonusBreakdown()
                .forEach(
                    (k, v) ->
                        mergedHeatBreakdown.put(k, mergedHeatBreakdown.getOrDefault(k, 0.0) + v));

            eventLiveMap.put(
                dId,
                new SeasonDriverResult(
                    dId,
                    r.getDriverName(),
                    bestRank,
                    combinedPosPts,
                    combinedOverallBonus,
                    mergedOverallBreakdown,
                    combinedHeatPts,
                    combinedHeatBonus,
                    mergedHeatBreakdown,
                    combinedTotal));
          } else {
            eventLiveMap.put(dId, r);
          }
        }

        List<SeasonDriverResult> liveEventResults = new ArrayList<>(eventLiveMap.values());
        String eventName =
            eventMgr.getActiveEvent() != null ? eventMgr.getActiveEvent().getName() : "Event";
        long liveStart =
            runtimeRace != null && runtimeRace.getStatistics() != null
                ? runtimeRace.getStatistics().getStartMillis()
                : 0L;
        long recordTimestamp = liveStart > 0 ? liveStart : System.currentTimeMillis();
        SeasonRaceRecord liveRecord =
            new SeasonRaceRecord("live_event", eventName, recordTimestamp, liveEventResults);
        races.add(liveRecord);
      } else {
        List<SeasonDriverResult> liveResults = calculateDriverResultsForRace(runtimeRace);
        if (liveResults != null && !liveResults.isEmpty()) {
          String raceName =
              runtimeRace.getRaceModel() != null ? runtimeRace.getRaceModel().getName() : "Race";
          long liveStart =
              runtimeRace != null && runtimeRace.getStatistics() != null
                  ? runtimeRace.getStatistics().getStartMillis()
                  : 0L;
          long recordTimestamp = liveStart > 0 ? liveStart : System.currentTimeMillis();
          SeasonRaceRecord liveRecord =
              new SeasonRaceRecord("live_race", raceName, recordTimestamp, liveResults);
          races.add(liveRecord);
        }
      }
    }

    Season transientSeason =
        new Season(
            baseSeason.getName(),
            baseSeason.getDrops(),
            races,
            baseSeason.getEntityId(),
            baseSeason.getId());

    return calculateStandings(transientSeason);
  }

  public static List<DriverSeasonStanding> calculateStandings(Season season) {
    DatabaseContext dbCtx = null;
    try {
      dbCtx = ClientSubscriptionManager.getInstance().getDatabaseContext();
    } catch (Exception ignored) {
    }
    return calculateStandings(season, dbCtx);
  }

  public static List<DriverSeasonStanding> calculateStandings(
      Season season, DatabaseContext databaseContext) {
    if (season == null || season.getRaces() == null) {
      return new ArrayList<>();
    }

    int dropsConfigured = Math.max(0, season.getDrops());
    List<SeasonRaceRecord> raceRecords = season.getRaces();

    Map<String, String> driverNames = new HashMap<>();
    Map<String, List<Map.Entry<SeasonRaceRecord, SeasonDriverResult>>> driverRaceMap =
        new HashMap<>();

    for (SeasonRaceRecord raceRecord : raceRecords) {
      if (raceRecord == null || raceRecord.getDriverResults() == null) continue;
      for (SeasonDriverResult result : raceRecord.getDriverResults()) {
        if (result == null || result.getDriverId() == null || result.getDriverId().isEmpty()) {
          continue;
        }
        String driverId = result.getDriverId();
        driverNames.put(driverId, result.getDriverName());
        driverRaceMap
            .computeIfAbsent(driverId, k -> new ArrayList<>())
            .add(new AbstractMap.SimpleEntry<>(raceRecord, result));
      }
    }

    if (databaseContext != null && DatabaseService.getInstance() != null) {
      for (String dId : driverRaceMap.keySet()) {
        Driver d = DatabaseService.getInstance().getDriver(databaseContext, dId);
        if (d != null && d.getDisplayName() != null && !d.getDisplayName().trim().isEmpty()) {
          driverNames.put(dId, d.getDisplayName());
        }
      }
    }

    List<DriverSeasonStanding> standings = new ArrayList<>();

    for (Map.Entry<String, List<Map.Entry<SeasonRaceRecord, SeasonDriverResult>>> entry :
        driverRaceMap.entrySet()) {
      String driverId = entry.getKey();
      String driverName = driverNames.getOrDefault(driverId, "Driver " + driverId);
      List<Map.Entry<SeasonRaceRecord, SeasonDriverResult>> raceEntries = entry.getValue();

      int count = raceEntries.size();
      int numDrops = (count > dropsConfigured) ? dropsConfigured : 0;

      Set<Integer> droppedIndices = new HashSet<>();
      if (numDrops > 0) {
        List<Integer> indices = new ArrayList<>();
        for (int i = 0; i < count; i++) {
          indices.add(i);
        }
        indices.sort(
            Comparator.comparingDouble(i -> raceEntries.get(i).getValue().getTotalPoints()));
        for (int i = 0; i < numDrops; i++) {
          droppedIndices.add(indices.get(i));
        }
      }

      double grossPoints = 0.0;
      double netPoints = 0.0;
      List<DriverRaceScoreDetail> scoreDetails = new ArrayList<>();

      for (int i = 0; i < count; i++) {
        SeasonRaceRecord raceRec = raceEntries.get(i).getKey();
        SeasonDriverResult res = raceEntries.get(i).getValue();
        boolean isDropped = droppedIndices.contains(i);

        grossPoints += res.getTotalPoints();
        if (!isDropped) {
          netPoints += res.getTotalPoints();
        }

        DriverRaceScoreDetail detail =
            new DriverRaceScoreDetail(
                raceRec.getRaceId(),
                raceRec.getRaceName(),
                res.getOverallRank(),
                res.getOverallPoints(),
                res.getOverallBonusPoints(),
                res.getOverallBonusBreakdown(),
                res.getHeatPoints(),
                res.getHeatBonusPoints(),
                res.getHeatBonusBreakdown(),
                res.getTotalPoints());
        if (isDropped) {
          detail.setDropped(true);
        }
        scoreDetails.add(detail);
      }

      standings.add(
          new DriverSeasonStanding(
              driverId, driverName, netPoints, grossPoints, count, scoreDetails));
    }

    standings.sort(
        (a, b) -> {
          if (a.getNetPoints() != b.getNetPoints()) {
            return Double.compare(b.getNetPoints(), a.getNetPoints());
          }
          return Double.compare(b.getGrossPoints(), a.getGrossPoints());
        });

    return standings;
  }
}
