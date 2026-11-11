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
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

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
      for (int hIdx = 0; hIdx < heats.size(); hIdx++) {
        Heat heat = heats.get(hIdx);
        if (heat == null || heat.getDrivers() == null) continue;
        if (!isHeatScorable(heat)) continue;

        int heatNum = heat.getHeatNumber() > 0 ? heat.getHeatNumber() : (hIdx + 1);
        processHeat(
            heat, heatNum, pointsScoring, heatScoring, overallScoring, driverHeatPointsList);
      }
    }

    // Calculate overall bonuses across all heats
    Map<String, Double> overallBonuses =
        calculateOverallBonuses(participants, heats, pointsScoring, heatScoring, overallScoring);

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
      int heatNum,
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

    // Calculate heat bonuses
    Map<String, List<Double>> heatBonusesMap = new HashMap<>();
    calculateHeatBonuses(heat, heatNum, pointsScoring, hRank, hTie, heatBonusesMap);

    boolean oneBonus = pointsScoring.isHeatOneBonusPerDriver();

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
      if (!bonuses.isEmpty()) {
        if (oneBonus) {
          pts += Collections.max(bonuses);
        } else {
          for (double b : bonuses) {
            pts += b;
          }
        }
      }

      driverHeatPointsList.computeIfAbsent(driverId, k -> new ArrayList<>()).add(pts);
    }
  }

  private static void calculateHeatBonuses(
      Heat heat,
      int heatNum,
      PointsScoring pointsScoring,
      RankingMethod hRank,
      TiebreakerMethod hTie,
      Map<String, List<Double>> heatBonusesMap) {
    double fastestBonus = pointsScoring.getHeatBonusFastestLap();
    double ledBonus = pointsScoring.getHeatBonusLedLap();
    double mostLedBonus = pointsScoring.getHeatBonusMostLapsLed();

    if (fastestBonus > 0) {
      double bestLap = Double.MAX_VALUE;
      for (DriverHeatData dhd : heat.getDrivers()) {
        if (dhd == null || dhd.isEmptyParticipant()) continue;
        double bl = dhd.getBestLapTime();
        if (bl > 0 && bl < bestLap) {
          bestLap = bl;
        }
      }
      if (bestLap < Double.MAX_VALUE) {
        for (DriverHeatData dhd : heat.getDrivers()) {
          if (dhd == null || dhd.isEmptyParticipant()) continue;
          if (Math.abs(dhd.getBestLapTime() - bestLap) < 0.0001) {
            String id = getDriverIdFromDhd(dhd);
            if (id != null && !id.isEmpty()) {
              heatBonusesMap.computeIfAbsent(id, k -> new ArrayList<>()).add(fastestBonus);
            }
          }
        }
      }
    }

    if (ledBonus > 0 || mostLedBonus > 0) {
      Map<String, Integer> heatLapsLed =
          GhostRaceSimulator.calculateLapsLed(heat.getDrivers(), hRank, hTie);
      int maxLed = 0;
      String maxLedDriver = null;

      for (Map.Entry<String, Integer> entry : heatLapsLed.entrySet()) {
        String driverId = entry.getKey();
        int led = entry.getValue();
        if (led > 0 && ledBonus > 0) {
          heatBonusesMap.computeIfAbsent(driverId, k -> new ArrayList<>()).add(ledBonus);
        }
        if (led > maxLed) {
          maxLed = led;
          maxLedDriver = driverId;
        }
      }

      if (maxLed > 0 && mostLedBonus > 0 && maxLedDriver != null) {
        heatBonusesMap.computeIfAbsent(maxLedDriver, k -> new ArrayList<>()).add(mostLedBonus);
      }
    }
  }

  private static Map<String, Double> calculateOverallBonuses(
      List<RaceParticipant> participants,
      List<Heat> heats,
      PointsScoring pointsScoring,
      HeatScoring heatScoring,
      OverallScoring overallScoring) {
    Map<String, List<Double>> bonusesMap = new HashMap<>();
    if (heats == null || heats.isEmpty()) {
      return Collections.emptyMap();
    }

    addOverallFastestLapBonus(heats, pointsScoring.getOverallBonusFastestLap(), bonusesMap);
    addOverallFastestLapPerLaneBonus(
        heats, pointsScoring.getOverallBonusFastestLapPerLane(), bonusesMap);
    addOverallLapsLedBonuses(
        heats,
        pointsScoring.getOverallBonusLedLap(),
        pointsScoring.getOverallBonusMostLapsLed(),
        overallScoring,
        bonusesMap);

    boolean oneBonus = pointsScoring.isOverallOneBonusPerDriver();
    Map<String, Double> result = new HashMap<>();
    for (Map.Entry<String, List<Double>> entry : bonusesMap.entrySet()) {
      String id = entry.getKey();
      List<Double> bList = entry.getValue();
      if (bList != null && !bList.isEmpty()) {
        if (oneBonus) {
          result.put(id, Collections.max(bList));
        } else {
          double sum = 0.0;
          for (double b : bList) {
            sum += b;
          }
          result.put(id, sum);
        }
      }
    }
    return result;
  }

  private static void addOverallFastestLapBonus(
      List<Heat> heats, double fastestLapBonus, Map<String, List<Double>> bonusesMap) {
    if (fastestLapBonus <= 0) return;
    double minLap = Double.MAX_VALUE;
    for (Heat heat : heats) {
      if (heat == null || heat.getDrivers() == null) continue;
      for (DriverHeatData dhd : heat.getDrivers()) {
        if (dhd == null || dhd.isEmptyParticipant()) continue;
        double bl = dhd.getBestLapTime();
        if (bl > 0 && bl < minLap) {
          minLap = bl;
        }
      }
    }
    if (minLap < Double.MAX_VALUE) {
      Set<String> fastestWinners = new HashSet<>();
      for (Heat heat : heats) {
        if (heat == null || heat.getDrivers() == null) continue;
        for (DriverHeatData dhd : heat.getDrivers()) {
          if (dhd == null || dhd.isEmptyParticipant()) continue;
          if (Math.abs(dhd.getBestLapTime() - minLap) < 0.0001) {
            String id = getDriverIdFromDhd(dhd);
            if (id != null && !id.isEmpty()) {
              fastestWinners.add(id);
            }
          }
        }
      }
      for (String id : fastestWinners) {
        bonusesMap.computeIfAbsent(id, k -> new ArrayList<>()).add(fastestLapBonus);
      }
    }
  }

  private static void addOverallFastestLapPerLaneBonus(
      List<Heat> heats, double fastestLapPerLaneBonus, Map<String, List<Double>> bonusesMap) {
    if (fastestLapPerLaneBonus <= 0) return;
    Map<Integer, Double> laneMinLap = new HashMap<>();
    for (Heat heat : heats) {
      if (heat == null || heat.getDrivers() == null) continue;
      for (int laneIdx = 0; laneIdx < heat.getDrivers().size(); laneIdx++) {
        DriverHeatData dhd = heat.getDrivers().get(laneIdx);
        if (dhd == null || dhd.isEmptyParticipant()) continue;
        int lane = getLaneForDhd(dhd, laneIdx, heat);
        double bl = dhd.getBestLapTime();
        if (bl > 0) {
          double currentMin = laneMinLap.getOrDefault(lane, Double.MAX_VALUE);
          if (bl < currentMin) {
            laneMinLap.put(lane, bl);
          }
        }
      }
    }

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
          if (currentLane == lane
              && dhd.getBestLapTime() > 0
              && Math.abs(dhd.getBestLapTime() - minForLane) < 0.0001) {
            String id = getDriverIdFromDhd(dhd);
            if (id != null && !id.isEmpty()) {
              laneWinners.add(id);
            }
          }
        }
      }
      for (String id : laneWinners) {
        bonusesMap.computeIfAbsent(id, k -> new ArrayList<>()).add(fastestLapPerLaneBonus);
      }
    }
  }

  private static void addOverallLapsLedBonuses(
      List<Heat> heats,
      double ledLapBonus,
      double mostLapsLedBonus,
      OverallScoring overallScoring,
      Map<String, List<Double>> bonusesMap) {
    if (ledLapBonus <= 0 && mostLapsLedBonus <= 0) return;
    Map<String, List<DriverHeatData.LapData>> driverLaps = new HashMap<>();
    Map<String, DriverHeatData> driverFirstDhd = new HashMap<>();

    for (Heat heat : heats) {
      if (heat == null || heat.getDrivers() == null) continue;
      for (DriverHeatData dhd : heat.getDrivers()) {
        if (dhd == null || dhd.isEmptyParticipant()) continue;
        String id = getDriverIdFromDhd(dhd);
        if (id == null || id.isEmpty()) continue;
        driverFirstDhd.putIfAbsent(id, dhd);
        if (dhd.getLaps() != null && !dhd.getLaps().isEmpty()) {
          driverLaps.computeIfAbsent(id, k -> new ArrayList<>()).addAll(dhd.getLaps());
        }
      }
    }

    List<DriverHeatData> consolidated = new ArrayList<>();
    for (Map.Entry<String, DriverHeatData> entry : driverFirstDhd.entrySet()) {
      String id = entry.getKey();
      DriverHeatData tmpl = entry.getValue();
      List<DriverHeatData.LapData> laps = driverLaps.getOrDefault(id, new ArrayList<>());
      DriverHeatData cd = new DriverHeatData(tmpl.getDriver(), tmpl.getActualDriver());
      cd.setLaps(laps);
      consolidated.add(cd);
    }

    RankingMethod oRank = RankingMethod.LAP_COUNT;
    TiebreakerMethod oTie = TiebreakerMethod.AVERAGE_LAP_TIME;
    if (overallScoring != null && overallScoring.getRankingMethod() != null) {
      oRank = overallScoring.toRankingMethod();
      oTie = overallScoring.toTiebreakerMethod();
    }

    Map<String, Integer> overallLapsLed =
        GhostRaceSimulator.calculateLapsLed(consolidated, oRank, oTie);
    int maxLed = 0;
    String mostLapsLedDriver = null;

    for (Map.Entry<String, Integer> entry : overallLapsLed.entrySet()) {
      String id = entry.getKey();
      int led = entry.getValue();
      if (led > 0 && ledLapBonus > 0) {
        bonusesMap.computeIfAbsent(id, k -> new ArrayList<>()).add(ledLapBonus);
      }
      if (led > maxLed) {
        maxLed = led;
        mostLapsLedDriver = id;
      }
    }

    if (maxLed > 0 && mostLapsLedBonus > 0 && mostLapsLedDriver != null) {
      bonusesMap.computeIfAbsent(mostLapsLedDriver, k -> new ArrayList<>()).add(mostLapsLedBonus);
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

  public static String getParticipantIdentifier(RaceParticipant rp) {
    if (rp == null) return "";
    if (rp.getDriver() != null
        && rp.getDriver().getEntityId() != null
        && !rp.getDriver().getEntityId().isEmpty()) {
      return rp.getDriver().getEntityId();
    }
    if (rp.getParticipantId() != null && !rp.getParticipantId().isEmpty()) {
      return rp.getParticipantId();
    }
    return rp.getStableId() != null ? rp.getStableId() : "";
  }

  public static String getDriverIdFromDhd(DriverHeatData dhd) {
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
}
