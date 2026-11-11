package com.antigravity.util;

import com.antigravity.models.BonusScoringConfig;
import com.antigravity.models.RankingMethod;
import com.antigravity.models.TiebreakerMethod;
import com.antigravity.race.DriverHeatData;
import com.antigravity.race.Heat;
import com.antigravity.race.RaceParticipant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class PointsBonusCalculator {

  public static int getLaneForDhd(DriverHeatData dhd, int laneIdx, Heat heat) {
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

  public static void calculateSingleHeatBonuses(
      Heat heat,
      int heatNum,
      BonusScoringConfig scoring,
      RankingMethod hRank,
      TiebreakerMethod hTie,
      List<RaceParticipant> participants,
      Map<String, List<Double>> heatSpecificBonuses,
      Map<String, Map<String, Double>> heatSpecificBreakdown) {
    if (heat == null || heat.getDrivers() == null || scoring == null) return;

    double heatBonusFastestLap = scoring.getHeatBonusFastestLap();
    double heatBonusLedLap = scoring.getHeatBonusLedLap();
    double heatBonusMostLapsLed = scoring.getHeatBonusMostLapsLed();

    if (heatBonusFastestLap > 0) {
      addHeatFastestLapBonus(
          heat, heatNum, heatBonusFastestLap, heatSpecificBonuses, heatSpecificBreakdown);
    }

    if (heatBonusLedLap > 0 || heatBonusMostLapsLed > 0) {
      addHeatLapsLedBonuses(
          heat,
          heatNum,
          heatBonusLedLap,
          heatBonusMostLapsLed,
          hRank,
          hTie,
          participants,
          heatSpecificBonuses,
          heatSpecificBreakdown);
    }
  }

  private static void addHeatFastestLapBonus(
      Heat heat,
      int heatNum,
      double bonus,
      Map<String, List<Double>> bonusesMap,
      Map<String, Map<String, Double>> breakdownMap) {
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
          if (driverId != null) {
            bonusesMap.computeIfAbsent(driverId, k -> new ArrayList<>()).add(bonus);
            if (breakdownMap != null) {
              breakdownMap
                  .computeIfAbsent(driverId, k -> new HashMap<>())
                  .put("fastest_lap_heat_" + heatNum, bonus);
            }
          }
        }
      }
    }
  }

  private static void addHeatLapsLedBonuses(
      Heat heat,
      int heatNum,
      double ledBonus,
      double mostLedBonus,
      RankingMethod hRank,
      TiebreakerMethod hTie,
      List<RaceParticipant> participants,
      Map<String, List<Double>> bonusesMap,
      Map<String, Map<String, Double>> breakdownMap) {
    Map<String, Integer> heatLapsLed =
        GhostRaceSimulator.calculateLapsLed(heat.getDrivers(), hRank, hTie);

    if (ledBonus > 0) {
      for (Map.Entry<String, Integer> entry : heatLapsLed.entrySet()) {
        String driverId = entry.getKey();
        int led = entry.getValue();
        if (led > 0) {
          bonusesMap.computeIfAbsent(driverId, k -> new ArrayList<>()).add(ledBonus);
          if (breakdownMap != null) {
            breakdownMap
                .computeIfAbsent(driverId, k -> new HashMap<>())
                .put("led_lap_heat_" + heatNum, ledBonus);
          }
        }
      }
    }

    if (mostLedBonus > 0) {
      int maxLedInHeat = 0;
      String mostLapsLedDriver = null;

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

      if (maxLedInHeat > 0 && mostLapsLedDriver != null) {
        bonusesMap.computeIfAbsent(mostLapsLedDriver, k -> new ArrayList<>()).add(mostLedBonus);
        if (breakdownMap != null) {
          breakdownMap
              .computeIfAbsent(mostLapsLedDriver, k -> new HashMap<>())
              .put("most_laps_led_heat_" + heatNum, mostLedBonus);
        }
      }
    }
  }

  public static void calculateOverallBonuses(
      List<Heat> heats,
      BonusScoringConfig scoring,
      RankingMethod oRank,
      TiebreakerMethod oTie,
      List<RaceParticipant> participants,
      Map<String, List<Double>> overallBonusesMap,
      Map<String, Map<String, Double>> overallBreakdownMap) {
    if (heats == null || heats.isEmpty() || scoring == null) {
      return;
    }

    calculateOverallFastestLapBonus(
        heats, scoring.getOverallBonusFastestLap(), overallBonusesMap, overallBreakdownMap);
    calculateOverallFastestLapPerLaneBonus(
        heats, scoring.getOverallBonusFastestLapPerLane(), overallBonusesMap, overallBreakdownMap);
    calculateOverallLapsLedBonuses(
        heats,
        oRank,
        oTie,
        participants,
        scoring.getOverallBonusLedLap(),
        scoring.getOverallBonusMostLapsLed(),
        overallBonusesMap,
        overallBreakdownMap);
  }

  public static void calculateOverallFastestLapBonus(
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
      Set<String> fastestWinners = new HashSet<>();
      for (Heat heat : heats) {
        if (heat == null || heat.getDrivers() == null) continue;
        for (DriverHeatData dhd : heat.getDrivers()) {
          if (dhd == null || dhd.isEmptyParticipant()) continue;
          if (Math.abs(dhd.getBestLapTime() - minLap) < 0.0001) {
            String driverId = getDriverIdFromDhd(dhd);
            if (driverId != null && !driverId.isEmpty()) {
              fastestWinners.add(driverId);
            }
          }
        }
      }
      for (String driverId : fastestWinners) {
        overallBonusesMap.computeIfAbsent(driverId, k -> new ArrayList<>()).add(bonus);
        if (overallBreakdownMap != null) {
          overallBreakdownMap
              .computeIfAbsent(driverId, k -> new HashMap<>())
              .put("fastest_lap", bonus);
        }
      }
    }
  }

  public static void calculateOverallFastestLapPerLaneBonus(
      List<Heat> heats,
      double bonus,
      Map<String, List<Double>> overallBonusesMap,
      Map<String, Map<String, Double>> overallBreakdownMap) {
    if (bonus <= 0 || heats == null || heats.isEmpty()) return;

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
        overallBonusesMap.computeIfAbsent(driverId, k -> new ArrayList<>()).add(bonus);
        if (overallBreakdownMap != null) {
          overallBreakdownMap
              .computeIfAbsent(driverId, k -> new HashMap<>())
              .put("fastest_lap_lane_" + (lane + 1), bonus);
        }
      }
    }
  }

  public static void calculateOverallLapsLedBonuses(
      List<Heat> heats,
      RankingMethod oRank,
      TiebreakerMethod oTie,
      List<RaceParticipant> participants,
      double ledLapBonus,
      double mostLapsLedBonus,
      Map<String, List<Double>> overallBonusesMap,
      Map<String, Map<String, Double>> overallBreakdownMap) {
    if (ledLapBonus <= 0 && mostLapsLedBonus <= 0) return;
    if (heats == null || heats.isEmpty()) return;

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

    Map<String, Integer> overallLapsLed =
        GhostRaceSimulator.calculateLapsLed(consolidatedDrivers, oRank, oTie);
    int maxLed = 0;
    String mostLapsLedDriver = null;

    if (participants != null && !participants.isEmpty()) {
      for (RaceParticipant rp : participants) {
        if (rp == null || rp.getDriver() == null || rp.getDriver().getEntityId() == null) {
          continue;
        }
        String driverId = rp.getDriver().getEntityId();
        int led = overallLapsLed.getOrDefault(driverId, 0);
        if (led > 0 && ledLapBonus > 0) {
          overallBonusesMap.computeIfAbsent(driverId, k -> new ArrayList<>()).add(ledLapBonus);
          if (overallBreakdownMap != null) {
            overallBreakdownMap
                .computeIfAbsent(driverId, k -> new HashMap<>())
                .put("led_lap", ledLapBonus);
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
        if (led > 0 && ledLapBonus > 0) {
          overallBonusesMap.computeIfAbsent(driverId, k -> new ArrayList<>()).add(ledLapBonus);
          if (overallBreakdownMap != null) {
            overallBreakdownMap
                .computeIfAbsent(driverId, k -> new HashMap<>())
                .put("led_lap", ledLapBonus);
          }
        }
        if (led > maxLed) {
          maxLed = led;
          mostLapsLedDriver = driverId;
        }
      }
    }

    if (maxLed > 0 && mostLapsLedBonus > 0 && mostLapsLedDriver != null) {
      overallBonusesMap
          .computeIfAbsent(mostLapsLedDriver, k -> new ArrayList<>())
          .add(mostLapsLedBonus);
      if (overallBreakdownMap != null) {
        overallBreakdownMap
            .computeIfAbsent(mostLapsLedDriver, k -> new HashMap<>())
            .put("most_laps_led", mostLapsLedBonus);
      }
    }
  }

  public static void resolveOneBonusPerDriver(
      Map<String, List<Double>> bonusesMap,
      Map<String, Map<String, Double>> breakdownMap,
      boolean oneBonusPerDriver) {
    if (!oneBonusPerDriver || bonusesMap == null) return;
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

  public static Map<String, Double> calculateOverallBonusesSum(
      List<Heat> heats,
      BonusScoringConfig scoring,
      RankingMethod oRank,
      TiebreakerMethod oTie,
      List<RaceParticipant> participants) {
    if (heats == null || heats.isEmpty() || scoring == null) {
      return Collections.emptyMap();
    }
    Map<String, List<Double>> bonusesMap = new HashMap<>();
    calculateOverallBonuses(heats, scoring, oRank, oTie, participants, bonusesMap, null);
    resolveOneBonusPerDriver(bonusesMap, null, scoring.isOverallOneBonusPerDriver());

    Map<String, Double> result = new HashMap<>();
    for (Map.Entry<String, List<Double>> entry : bonusesMap.entrySet()) {
      double sum = 0.0;
      for (Double val : entry.getValue()) {
        if (val != null) sum += val;
      }
      result.put(entry.getKey(), sum);
    }
    return result;
  }
}
