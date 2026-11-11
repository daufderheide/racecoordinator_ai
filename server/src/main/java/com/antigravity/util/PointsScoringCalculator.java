package com.antigravity.util;

import com.antigravity.models.HeatScoring;
import com.antigravity.models.OverallScoring;
import com.antigravity.models.PointsScoring;
import com.antigravity.models.RankingMethod;
import com.antigravity.models.TiebreakerMethod;
import com.antigravity.race.DriverHeatData;
import com.antigravity.race.Heat;
import com.antigravity.race.HeatStandings;
import com.antigravity.race.RaceParticipant;
import com.antigravity.race.StandingsComparator;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class PointsScoringCalculator {

  public static void calculatePoints(
      List<RaceParticipant> participants,
      List<Heat> heats,
      PointsScoring pointsScoring,
      HeatScoring heatScoring,
      OverallScoring overallScoring,
      int droppedHeats) {
    if (participants == null || participants.isEmpty() || pointsScoring == null) {
      return;
    }

    // Map each driver ID to their list of points scored per heat (for dropped heats evaluation)
    Map<String, List<Double>> driverHeatPointsList = new HashMap<>();
    for (RaceParticipant rp : participants) {
      if (rp != null && !rp.isEmptyParticipant()) {
        String id = getParticipantIdentifier(rp);
        if (!id.isEmpty()) {
          driverHeatPointsList.put(id, new ArrayList<>());
        }
      }
    }

    if (heats != null && !heats.isEmpty()) {
      for (Heat heat : heats) {
        if (heat == null || heat.getDrivers() == null) continue;
        if (!isHeatScorable(heat)) continue;

        processHeat(heat, pointsScoring, heatScoring, overallScoring, driverHeatPointsList);
      }
    }

    // Calculate overall bonuses across all heats using the shared engine
    RankingMethod oRank = RankingMethod.LAP_COUNT;
    TiebreakerMethod oTie = TiebreakerMethod.AVERAGE_LAP_TIME;
    if (overallScoring != null && overallScoring.getRankingMethod() != null) {
      oRank = overallScoring.toRankingMethod();
      oTie = overallScoring.toTiebreakerMethod();
    }
    Map<String, Double> overallBonuses =
        PointsBonusCalculator.calculateOverallBonusesSum(
            heats, pointsScoring, oRank, oTie, participants);

    // Sum up total points for each participant
    for (RaceParticipant rp : participants) {
      if (rp == null || rp.isEmptyParticipant()) {
        if (rp != null) {
          rp.setTotalPoints(0.0);
          rp.setRankValue(0.0);
        }
        continue;
      }
      String id = getParticipantIdentifier(rp);
      List<Double> heatScores = driverHeatPointsList.getOrDefault(id, Collections.emptyList());

      // Evaluate dropped heats: drop the lowest-scoring heat(s)
      double heatPointsSum = 0.0;
      if (!heatScores.isEmpty()) {
        List<Double> sortedScores = new ArrayList<>(heatScores);
        Collections.sort(sortedScores); // Ascending (lowest first)
        int toDrop = Math.min(Math.max(0, droppedHeats), sortedScores.size() - 1);
        for (int i = toDrop; i < sortedScores.size(); i++) {
          heatPointsSum += sortedScores.get(i);
        }
      }

      double overallBonus = overallBonuses.getOrDefault(id, 0.0);
      double totalPoints = Math.round((heatPointsSum + overallBonus) * 100.0) / 100.0;
      rp.setTotalPoints(totalPoints);
      rp.setRankValue(totalPoints);
    }
  }

  private static boolean isHeatScorable(Heat heat) {
    if (heat == null || heat.getDrivers() == null) return false;
    for (DriverHeatData dhd : heat.getDrivers()) {
      if (dhd != null
          && !dhd.isEmptyParticipant()
          && (dhd.isFinished()
              || dhd.getScoredLapCount() > 0
              || dhd.getTotalTime() > 0
              || dhd.getUserLaps() > 0
              || dhd.getUserTime() > 0
              || (dhd.getLaps() != null && !dhd.getLaps().isEmpty()))) {
        return true;
      }
    }
    return heat.isStarted();
  }

  private static void processHeat(
      Heat heat,
      PointsScoring pointsScoring,
      HeatScoring heatScoring,
      OverallScoring overallScoring,
      Map<String, List<Double>> driverHeatPointsList) {
    List<Double> heatPosPoints = pointsScoring.getHeatPositionPoints();
    double carryOverPct = pointsScoring.getHeatCarryOverPct();

    // Sort heat drivers according to heat ranking
    RankingMethod hRank = HeatStandings.resolveHeatRankingMethod(heatScoring, overallScoring);
    TiebreakerMethod hTie = HeatStandings.resolveHeatTiebreakerMethod(heatScoring);
    StandingsComparator<DriverHeatData> comparator = new StandingsComparator<>(hRank, hTie);

    List<DriverHeatData> heatDrivers = new ArrayList<>();
    for (DriverHeatData dhd : heat.getDrivers()) {
      if (dhd != null && !dhd.isEmptyParticipant()) {
        heatDrivers.add(dhd);
      }
    }
    heatDrivers.sort(comparator);

    // Calculate heat bonuses using the shared engine
    Map<String, List<Double>> heatBonusesMap = new HashMap<>();
    PointsBonusCalculator.calculateSingleHeatBonuses(
        heat, 0, pointsScoring, hRank, hTie, null, heatBonusesMap, null);
    PointsBonusCalculator.resolveOneBonusPerDriver(
        heatBonusesMap, null, pointsScoring.isHeatOneBonusPerDriver());

    for (int pos = 0; pos < heatDrivers.size(); pos++) {
      DriverHeatData dhd = heatDrivers.get(pos);
      String driverId = getDriverIdFromDhd(dhd);
      if (driverId == null || driverId.isEmpty()) continue;

      double pts = 0.0;
      if (pos < heatPosPoints.size()) {
        pts += heatPosPoints.get(pos);
      }
      if (carryOverPct > 0) {
        pts += dhd.getScoredLapCount() * (carryOverPct / 100.0);
      }

      List<Double> bonuses = heatBonusesMap.getOrDefault(driverId, Collections.emptyList());
      for (double b : bonuses) {
        pts += b;
      }

      driverHeatPointsList.computeIfAbsent(driverId, k -> new ArrayList<>()).add(pts);
    }
  }

  public static String getParticipantIdentifier(RaceParticipant rp) {
    return PointsBonusCalculator.getParticipantIdentifier(rp);
  }

  public static String getDriverIdFromDhd(DriverHeatData dhd) {
    return PointsBonusCalculator.getDriverIdFromDhd(dhd);
  }
}
