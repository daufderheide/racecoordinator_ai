package com.antigravity.util;

import com.antigravity.models.RankingMethod;
import com.antigravity.models.TiebreakerMethod;
import com.antigravity.race.DriverHeatData;
import com.antigravity.race.StandingsComparator;
import com.antigravity.race.StandingsParticipant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class GhostRaceSimulator {

  public static class LapPerformanceSnapshot implements StandingsParticipant {
    private final String participantId;
    private final int lapCount;
    private final double totalTime;
    private final double bestLapTime;
    private final double averageLapTime;
    private final double medianLapTime;
    private final boolean emptyParticipant;
    private final int seed;

    public LapPerformanceSnapshot(
        String participantId,
        int lapCount,
        double totalTime,
        double bestLapTime,
        double averageLapTime,
        double medianLapTime,
        boolean emptyParticipant,
        int seed) {
      this.participantId = participantId;
      this.lapCount = lapCount;
      this.totalTime = totalTime;
      this.bestLapTime = bestLapTime;
      this.averageLapTime = averageLapTime;
      this.medianLapTime = medianLapTime;
      this.emptyParticipant = emptyParticipant;
      this.seed = seed;
    }

    @Override
    public double getAdjustedLapCount() {
      return lapCount;
    }

    @Override
    public double getTotalTime() {
      return totalTime;
    }

    @Override
    public double getBestLapTime() {
      return bestLapTime;
    }

    @Override
    public double getAverageLapTime() {
      return averageLapTime;
    }

    @Override
    public double getMedianLapTime() {
      return medianLapTime;
    }

    @Override
    public boolean isEmptyParticipant() {
      return emptyParticipant;
    }

    @Override
    public int getSeed() {
      return seed;
    }

    @Override
    public String getParticipantId() {
      return participantId;
    }
  }

  public static String getDriverId(DriverHeatData dhd) {
    if (dhd == null) return null;
    return dhd.getParticipantId();
  }

  public static Map<String, Integer> calculateLapsLed(
      List<DriverHeatData> drivers, RankingMethod ranking, TiebreakerMethod tiebreaker) {
    Map<String, Integer> driverLapsLed = new HashMap<>();
    if (drivers == null || drivers.isEmpty()) {
      return driverLapsLed;
    }

    Map<String, DriverHeatData> driverMap = new HashMap<>();
    int maxLaps = 0;
    for (DriverHeatData dhd : drivers) {
      if (dhd == null || dhd.isEmptyParticipant()) continue;
      String driverId = dhd.getParticipantId();
      if (driverId == null || driverId.isEmpty()) continue;
      driverMap.put(driverId, dhd);
      driverLapsLed.put(driverId, 0);
      int lapCount = dhd.getLapCount();
      if (lapCount > maxLaps) {
        maxLaps = lapCount;
      }
    }

    if (maxLaps == 0 || driverMap.isEmpty()) {
      return driverLapsLed;
    }

    StandingsComparator comparator = new StandingsComparator(ranking, tiebreaker);

    for (int lapNum = 1; lapNum <= maxLaps; lapNum++) {
      List<StandingsParticipant> candidates = new ArrayList<>();
      for (Map.Entry<String, DriverHeatData> entry : driverMap.entrySet()) {
        String driverId = entry.getKey();
        DriverHeatData dhd = entry.getValue();
        if (dhd.getLapCount() >= lapNum
            && dhd.getLaps() != null
            && lapNum <= dhd.getLaps().size()) {
          double totalTime = dhd.getTimeAtLap(lapNum);
          double bestLap = Double.MAX_VALUE;
          List<Double> lapTimes = new ArrayList<>();
          for (int i = 0; i < lapNum; i++) {
            double t = dhd.getLaps().get(i).getLapTime();
            lapTimes.add(t);
            if (t > 0 && t < bestLap) {
              bestLap = t;
            }
          }
          if (bestLap == Double.MAX_VALUE) {
            bestLap = 0.0;
          }
          double avgLap = lapNum > 0 ? totalTime / lapNum : 0.0;
          double medLap = calculateMedian(lapTimes);

          candidates.add(
              new LapPerformanceSnapshot(
                  driverId,
                  lapNum,
                  totalTime,
                  bestLap,
                  avgLap,
                  medLap,
                  dhd.isEmptyParticipant(),
                  dhd.getSeed()));
        }
      }

      if (candidates.isEmpty()) continue;

      candidates.sort(comparator);

      String winner = candidates.get(0).getParticipantId();
      driverLapsLed.put(winner, driverLapsLed.getOrDefault(winner, 0) + 1);
    }

    return driverLapsLed;
  }

  private static double calculateMedian(List<Double> list) {
    if (list == null || list.isEmpty()) return 0.0;
    List<Double> sorted = new ArrayList<>(list);
    Collections.sort(sorted);
    int mid = sorted.size() / 2;
    if (sorted.size() % 2 == 1) return sorted.get(mid);
    return (sorted.get(mid - 1) + sorted.get(mid)) / 2.0;
  }
}
