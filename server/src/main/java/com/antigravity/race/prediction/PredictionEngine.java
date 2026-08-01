package com.antigravity.race.prediction;

import com.antigravity.models.Driver;
import com.antigravity.models.DriverTrackStats;
import com.antigravity.models.PredictionEvaluationRecord;
import com.antigravity.models.Race;
import com.antigravity.models.RacePredictionRecord.DriverProjection;
import com.antigravity.models.RacePredictionRecord.HeatForecast;
import com.antigravity.models.RacePredictionRecord.PredictionSnapshot;
import com.antigravity.race.DriverHeatData;
import com.antigravity.race.Heat;
import com.antigravity.race.RaceParticipant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

public class PredictionEngine {

  private static final int DEFAULT_SIMULATION_RUNS = 1000;
  private static final double DEFAULT_LAP_TIME = 5.0; // Seconds fallback
  private static final double DEFAULT_STD_DEV = 0.25;

  private final Random random;

  public PredictionEngine() {
    this.random = new Random();
  }

  public PredictionEngine(long seed) {
    this.random = new Random(seed);
  }

  /** Generates a pre-race prediction snapshot using Monte Carlo simulations. */
  public PredictionSnapshot generatePreRacePrediction(
      Race raceModel,
      List<RaceParticipant> participants,
      List<Heat> scheduledHeats,
      Map<String, DriverTrackStats> driverStatsMap) {
    long seed =
        (raceModel != null && raceModel.getEntityId() != null)
            ? (long) raceModel.getEntityId().hashCode()
            : 12345L;
    PredictionEngine seededEngine = new PredictionEngine(seed);
    return seededEngine.runSimulation(
        raceModel,
        participants,
        scheduledHeats,
        driverStatsMap,
        0,
        new HashMap<>(),
        DEFAULT_SIMULATION_RUNS);
  }

  public static class DriverHeatState {
    public double totalLapsCompleted = 0.0;
    public double totalElapsedSec = 0.0;
    public double currentHeatLapsCompleted = 0.0;
    public List<Double> currentHeatLapTimes = new ArrayList<>();
    public double currentHeatElapsedSec = 0.0;
    public double currentHeatPendingLapTime = 0.0;
  }

  private static class SimulationResult {
    public double laps;
    public double timeSec;
  }

  /**
   * Generates a real-time prediction snapshot blending historical priors with empirical race pace.
   */
  public PredictionSnapshot generateRealtimePrediction(
      Race raceModel,
      List<RaceParticipant> participants,
      List<Heat> scheduledHeats,
      Map<String, DriverTrackStats> driverStatsMap,
      int currentHeatIndex,
      Map<String, DriverHeatState> driverHeatStates) {
    long baseSeed =
        (raceModel != null && raceModel.getEntityId() != null)
            ? (long) raceModel.getEntityId().hashCode()
            : 12345L;
    long stateSeed =
        baseSeed
            + currentHeatIndex * 31L
            + (driverHeatStates != null ? (long) driverHeatStates.hashCode() : 0L);
    PredictionEngine seededEngine = new PredictionEngine(stateSeed);
    return seededEngine.runSimulation(
        raceModel,
        participants,
        scheduledHeats,
        driverStatsMap,
        currentHeatIndex,
        driverHeatStates,
        DEFAULT_SIMULATION_RUNS);
  }

  private boolean checkHasAnyData(
      Map<String, DriverTrackStats> driverStatsMap, Map<String, DriverHeatState> driverHeatStates) {
    if (driverStatsMap != null) {
      for (Map.Entry<String, DriverTrackStats> entry : driverStatsMap.entrySet()) {
        DriverTrackStats stats = entry.getValue();
        if (stats.getOverallMedianLapTime() > 0) {
          System.out.println(
              "PREDICTION_ENGINE: Found data for driver "
                  + entry.getKey()
                  + " (OverallMedianLapTime="
                  + stats.getOverallMedianLapTime()
                  + ")");
          return true;
        }
        if (stats.getLaneStats() != null) {
          for (DriverTrackStats.LanePaceStats lps : stats.getLaneStats()) {
            if (lps.getMedianLapTime() > 0) {
              System.out.println(
                  "PREDICTION_ENGINE: Found data for driver "
                      + entry.getKey()
                      + " (Lane "
                      + lps.getLaneIndex()
                      + " MedianLapTime="
                      + lps.getMedianLapTime()
                      + ")");
              return true;
            }
          }
        }
      }
    }
    if (driverHeatStates != null) {
      for (Map.Entry<String, DriverHeatState> entry : driverHeatStates.entrySet()) {
        DriverHeatState state = entry.getValue();
        if (state.currentHeatLapTimes != null && !state.currentHeatLapTimes.isEmpty()) {
          System.out.println(
              "PREDICTION_ENGINE: Found empirical data for driver " + entry.getKey());
          return true;
        }
      }
    }
    System.out.println("PREDICTION_ENGINE: No data found for any driver. Returning false.");
    return false;
  }

  private PredictionSnapshot runSimulation(
      Race raceModel,
      List<RaceParticipant> participants,
      List<Heat> scheduledHeats,
      Map<String, DriverTrackStats> driverStatsMap,
      int currentHeatIndex,
      Map<String, DriverHeatState> driverHeatStates,
      int numSimulations) {

    if (participants == null
        || participants.isEmpty()
        || scheduledHeats == null
        || scheduledHeats.isEmpty()) {
      return new PredictionSnapshot(
          0, 0, new HashMap<>(), new HashMap<>(), new ArrayList<>(), new ArrayList<>());
    }

    Map<String, Integer> winCounts = new HashMap<>();
    Map<String, Integer> podiumCounts = new HashMap<>();
    Map<String, Double> totalProjectedLaps = new HashMap<>();
    initializeParticipantStats(participants, winCounts, podiumCounts, totalProjectedLaps);

    Map<Integer, Map<String, Integer>> heatWinnerCounts = new HashMap<>();
    Map<Integer, Map<String, Double>> heatProjectedLapsSum = new HashMap<>();
    initializeHeatStats(scheduledHeats, heatWinnerCounts, heatProjectedLapsSum);

    com.antigravity.models.HeatScoring.FinishMethod finishMethod =
        com.antigravity.models.HeatScoring.FinishMethod.Lap; // fqn-collision
    long finishValue = 15;
    if (raceModel != null && raceModel.getHeatScoring() != null) {
      finishMethod = raceModel.getHeatScoring().getFinishMethod();
      finishValue = raceModel.getHeatScoring().getFinishValue();
    }

    Map<String, Double> totalProjectedTime = new HashMap<>();

    boolean hasAnyData = checkHasAnyData(driverStatsMap, driverHeatStates);
    if (!hasAnyData) {
      numSimulations = 0; // Skip simulation loop
    } else {
      for (int sim = 0; sim < numSimulations; sim++) {
        executeSingleSimulationRun(
            scheduledHeats,
            driverStatsMap,
            currentHeatIndex,
            driverHeatStates,
            winCounts,
            podiumCounts,
            totalProjectedLaps,
            totalProjectedTime,
            heatWinnerCounts,
            heatProjectedLapsSum,
            finishMethod,
            finishValue);
      }
    }

    return compileSnapshot(
        participants,
        scheduledHeats,
        winCounts,
        podiumCounts,
        totalProjectedLaps,
        heatWinnerCounts,
        heatProjectedLapsSum,
        currentHeatIndex,
        driverHeatStates,
        numSimulations,
        totalProjectedTime);
  }

  private boolean isParticipantEmpty(RaceParticipant rp) {
    if (rp == null) return true;
    if (rp.getDriver() != null) {
      if (rp.getDriver().isEmpty()) return true;
      if ("EMPTY_LANE".equalsIgnoreCase(rp.getDriver().getEntityId())) return true;
      if ("Empty Lane".equalsIgnoreCase(rp.getDriver().getName())) return true;
    }
    if (rp.getTeam() != null) {
      if ("EMPTY_LANE".equalsIgnoreCase(rp.getTeam().getEntityId())) return true;
      if ("Empty Lane".equalsIgnoreCase(rp.getTeam().getName())) return true;
    }
    if (rp.getDriver() == null && rp.getTeam() == null) return true;
    return false;
  }

  private boolean isHeatDriverEmpty(DriverHeatData dhd) {
    if (dhd == null) return true;
    if (dhd.getDriver() != null && isParticipantEmpty(dhd.getDriver())) return true;
    if (dhd.getActualDriver() != null && dhd.getActualDriver().isEmpty()) return true;
    return false;
  }

  public static String getParticipantId(RaceParticipant rp) {
    if (rp == null) return null;
    if (rp.getTeam() != null
        && rp.getTeam().getEntityId() != null
        && !rp.getTeam().getEntityId().isEmpty()) {
      return rp.getTeam().getEntityId();
    }
    if (rp.getDriver() != null
        && rp.getDriver().getEntityId() != null
        && !rp.getDriver().getEntityId().isEmpty()) {
      String dId = rp.getDriver().getEntityId();
      if (dId.startsWith("t_") && rp.getTeam() != null) {
        return rp.getTeam().getEntityId();
      }
      return dId;
    }
    return rp.getObjectId();
  }

  private String getHeatDriverParticipantId(DriverHeatData dhd) {
    if (dhd == null || isHeatDriverEmpty(dhd)) return null;
    return getParticipantId(dhd.getDriver());
  }

  private void initializeParticipantStats(
      List<RaceParticipant> participants,
      Map<String, Integer> winCounts,
      Map<String, Integer> podiumCounts,
      Map<String, Double> totalProjectedLaps) {
    for (RaceParticipant rp : participants) {
      if (rp == null || isParticipantEmpty(rp)) continue;
      String id = getParticipantId(rp);
      if (id != null && !id.isEmpty() && !"EMPTY_LANE".equals(id)) {
        winCounts.put(id, 0);
        podiumCounts.put(id, 0);
        totalProjectedLaps.put(id, 0.0);
      }
    }
  }

  private void initializeHeatStats(
      List<Heat> scheduledHeats,
      Map<Integer, Map<String, Integer>> heatWinnerCounts,
      Map<Integer, Map<String, Double>> heatProjectedLapsSum) {
    for (int h = 0; h < scheduledHeats.size(); h++) {
      heatWinnerCounts.put(h, new HashMap<>());
      heatProjectedLapsSum.put(h, new HashMap<>());
    }
  }

  private void executeSingleSimulationRun(
      List<Heat> scheduledHeats,
      Map<String, DriverTrackStats> driverStatsMap,
      int currentHeatIndex,
      Map<String, DriverHeatState> driverHeatStates,
      Map<String, Integer> winCounts,
      Map<String, Integer> podiumCounts,
      Map<String, Double> totalProjectedLaps,
      Map<String, Double> totalProjectedTime,
      Map<Integer, Map<String, Integer>> heatWinnerCounts,
      Map<Integer, Map<String, Double>> heatProjectedLapsSum,
      com.antigravity.models.HeatScoring.FinishMethod finishMethod, // fqn-collision
      long finishValue) {

    Map<String, Double> simLapsMap = new HashMap<>();
    Map<String, Double> simTimeMap = new HashMap<>();
    if (driverHeatStates != null) {
      for (Map.Entry<String, DriverHeatState> entry : driverHeatStates.entrySet()) {
        simLapsMap.put(entry.getKey(), entry.getValue().totalLapsCompleted);
        simTimeMap.put(entry.getKey(), entry.getValue().totalElapsedSec);
      }
    }

    for (int h = currentHeatIndex; h < scheduledHeats.size(); h++) {
      Heat heat = scheduledHeats.get(h);
      String heatWinnerId = null;
      double bestHeatLaps = -1.0;

      for (DriverHeatData dhd : heat.getDrivers()) {
        if (dhd == null || isHeatDriverEmpty(dhd)) {
          continue;
        }
        String driverId = getHeatDriverParticipantId(dhd);
        if (driverId == null || driverId.isEmpty() || "EMPTY_LANE".equals(driverId)) {
          continue;
        }

        Driver actualDriver = dhd.getActualDriver();
        String statsDriverId =
            (actualDriver != null
                    && actualDriver.getEntityId() != null
                    && !actualDriver.getEntityId().isEmpty())
                ? actualDriver.getEntityId()
                : driverId;

        int laneIndex = dhd.getLane();

        DriverHeatState state = driverHeatStates != null ? driverHeatStates.get(driverId) : null;
        SimulationResult simRes =
            simulateHeatForDriver(
                statsDriverId,
                laneIndex,
                driverStatsMap,
                state,
                h == currentHeatIndex,
                finishMethod,
                finishValue);

        simLapsMap.put(driverId, simLapsMap.getOrDefault(driverId, 0.0) + simRes.laps);
        simTimeMap.put(driverId, simTimeMap.getOrDefault(driverId, 0.0) + simRes.timeSec);

        Map<String, Double> hLapsMap = heatProjectedLapsSum.get(h);
        hLapsMap.put(driverId, hLapsMap.getOrDefault(driverId, 0.0) + simRes.laps);

        double totalHeatLaps =
            (state != null && h == currentHeatIndex)
                ? state.currentHeatLapsCompleted + simRes.laps
                : simRes.laps;
        double totalHeatTime = simRes.timeSec;

        if (finishMethod == com.antigravity.models.HeatScoring.FinishMethod.Lap) { // fqn-collision
          if (bestHeatLaps < 0 || totalHeatTime < bestHeatLaps) {
            bestHeatLaps = totalHeatTime;
            heatWinnerId = driverId;
          }
        } else {
          if (totalHeatLaps > bestHeatLaps) {
            bestHeatLaps = totalHeatLaps;
            heatWinnerId = driverId;
          }
        }
      }

      if (heatWinnerId != null) {
        Map<String, Integer> hWinners = heatWinnerCounts.get(h);
        hWinners.put(heatWinnerId, hWinners.getOrDefault(heatWinnerId, 0) + 1);
      }
    }

    List<Map.Entry<String, Double>> sortedSimResults = new ArrayList<>(simLapsMap.entrySet());
    sortedSimResults.sort(
        (e1, e2) -> {
          int cmp = Double.compare(e2.getValue(), e1.getValue());
          if (cmp != 0) return cmp;
          double time1 = simTimeMap.getOrDefault(e1.getKey(), 0.0);
          double time2 = simTimeMap.getOrDefault(e2.getKey(), 0.0);
          return Double.compare(time1, time2);
        });

    for (int rank = 0; rank < sortedSimResults.size(); rank++) {
      String driverId = sortedSimResults.get(rank).getKey();
      double laps = sortedSimResults.get(rank).getValue();

      totalProjectedLaps.put(driverId, totalProjectedLaps.getOrDefault(driverId, 0.0) + laps);
      totalProjectedTime.put(
          driverId,
          totalProjectedTime.getOrDefault(driverId, 0.0) + simTimeMap.getOrDefault(driverId, 0.0));

      if (rank == 0) {
        winCounts.put(driverId, winCounts.getOrDefault(driverId, 0) + 1);
      }
      if (rank < 3) {
        podiumCounts.put(driverId, podiumCounts.getOrDefault(driverId, 0) + 1);
      }
    }
  }

  private PredictionSnapshot compileSnapshot(
      List<RaceParticipant> participants,
      List<Heat> scheduledHeats,
      Map<String, Integer> winCounts,
      Map<String, Integer> podiumCounts,
      Map<String, Double> totalProjectedLaps,
      Map<Integer, Map<String, Integer>> heatWinnerCounts,
      Map<Integer, Map<String, Double>> heatProjectedLapsSum,
      int currentHeatIndex,
      Map<String, DriverHeatState> driverHeatStates,
      int numSimulations,
      Map<String, Double> totalProjectedTime) {

    Map<String, Double> winProbabilities = new HashMap<>();
    Map<String, Double> podiumProbabilities = new HashMap<>();
    List<DriverProjection> driverProjections = new ArrayList<>();

    for (RaceParticipant rp : participants) {
      if (rp == null || isParticipantEmpty(rp)) continue;
      String driverId = getParticipantId(rp);
      if (driverId == null || driverId.isEmpty() || "EMPTY_LANE".equals(driverId)) continue;

      String driverName =
          rp.getTeam() != null && rp.getTeam().getName() != null
              ? rp.getTeam().getName()
              : (rp.getDriver() != null && rp.getDriver().getName() != null
                  ? rp.getDriver().getName()
                  : "Participant " + driverId);

      double winProb = -1.0;
      double podiumProb = -1.0;
      double avgLaps = -1.0;

      double avgTime = -1.0;

      if (numSimulations > 0) {
        winProb = (double) winCounts.getOrDefault(driverId, 0) / numSimulations;
        if (winProb > 0.99 && participants.size() > 1) winProb = 0.99;
        podiumProb = (double) podiumCounts.getOrDefault(driverId, 0) / numSimulations;
        avgLaps = totalProjectedLaps.getOrDefault(driverId, 0.0) / numSimulations;
        avgTime = totalProjectedTime.getOrDefault(driverId, 0.0) / numSimulations;
      }

      DriverProjection dp = new DriverProjection();
      dp.setDriverId(driverId);
      dp.setDriverName(driverName);
      dp.setProjectedLaps(numSimulations > 0 ? Math.round(avgLaps * 10.0) / 10.0 : -1.0);
      dp.setProjectedTimeSeconds(numSimulations > 0 ? Math.round(avgTime * 10.0) / 10.0 : -1.0);
      dp.setWinProbability(numSimulations > 0 ? Math.round(winProb * 1000.0) / 1000.0 : -1.0);
      dp.setPodiumProbability(numSimulations > 0 ? Math.round(podiumProb * 1000.0) / 1000.0 : -1.0);

      driverProjections.add(dp);
    }

    driverProjections.sort(
        (p1, p2) -> {
          int cmp = Double.compare(p2.getProjectedLaps(), p1.getProjectedLaps());
          if (cmp != 0) return cmp;
          cmp = Double.compare(p1.getProjectedTimeSeconds(), p2.getProjectedTimeSeconds());
          if (cmp != 0) return cmp;
          return Double.compare(p2.getWinProbability(), p1.getWinProbability());
        });

    for (int r = 0; r < driverProjections.size(); r++) {
      DriverProjection dp = driverProjections.get(r);
      dp.setProjectedRank(numSimulations > 0 ? r + 1 : -1);
      winProbabilities.put(dp.getDriverId(), dp.getWinProbability());
      podiumProbabilities.put(dp.getDriverId(), dp.getPodiumProbability());
    }

    List<HeatForecast> heatForecasts = new ArrayList<>();
    for (int h = 0; h < scheduledHeats.size(); h++) {
      Heat forecastHeat = scheduledHeats.get(h);
      HeatForecast hf = new HeatForecast();
      hf.setHeatNumber(forecastHeat.getHeatNumber());

      if (numSimulations > 0) {
        Map<String, Integer> hWinners = heatWinnerCounts.get(h);
        String topWinnerId =
            hWinners.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("");
        hf.setPredictedWinnerId(topWinnerId);

        Map<String, Double> avgHeatLaps = new HashMap<>();
        Map<String, Double> sums = heatProjectedLapsSum.get(h);
        for (Map.Entry<String, Double> entry : sums.entrySet()) {
          avgHeatLaps.put(
              entry.getKey(), Math.round((entry.getValue() / numSimulations) * 10.0) / 10.0);
        }
        hf.setDriverProjectedLaps(avgHeatLaps);
      } else {
        hf.setPredictedWinnerId("");
        hf.setDriverProjectedLaps(new HashMap<>());
      }
      heatForecasts.add(hf);
    }

    int completedLapsEstimate = 0;
    if (driverHeatStates != null) {
      for (DriverHeatState state : driverHeatStates.values()) {
        completedLapsEstimate += (int) state.totalLapsCompleted;
      }
    }

    return new PredictionSnapshot(
        currentHeatIndex,
        completedLapsEstimate,
        winProbabilities,
        podiumProbabilities,
        driverProjections,
        heatForecasts);
  }

  private SimulationResult simulateHeatForDriver(
      String driverId,
      int laneIndex,
      Map<String, DriverTrackStats> driverStatsMap,
      DriverHeatState state,
      boolean isCurrentHeat,
      com.antigravity.models.HeatScoring.FinishMethod finishMethod, // fqn-collision
      long finishValue) {

    double histMean = DEFAULT_LAP_TIME;
    double histStdDev = DEFAULT_STD_DEV;
    boolean hasHistory = false;

    if (driverStatsMap != null && driverStatsMap.containsKey(driverId)) {
      DriverTrackStats stats = driverStatsMap.get(driverId);
      if (stats.getLaneStats() != null) {
        for (DriverTrackStats.LanePaceStats lps : stats.getLaneStats()) {
          if (lps.getLaneIndex() == laneIndex && lps.getMedianLapTime() > 0) {
            histMean = lps.getMedianLapTime();
            if (lps.getStdDev() > 0) {
              histStdDev = lps.getStdDev();
            }
            hasHistory = true;
            break;
          }
        }
      }
      if (!hasHistory && stats.getOverallMedianLapTime() > 0) {
        histMean = stats.getOverallMedianLapTime();
        hasHistory = true;
      }
    }

    double blendedMean = histMean;
    double blendedStdDev = histStdDev;

    if (state != null
        && state.currentHeatLapTimes != null
        && !state.currentHeatLapTimes.isEmpty()) {
      List<Double> laps = new ArrayList<>(state.currentHeatLapTimes);
      Collections.sort(laps);

      double empMean;
      if (laps.size() % 2 == 0) {
        empMean = (laps.get(laps.size() / 2 - 1) + laps.get(laps.size() / 2)) / 2.0;
      } else {
        empMean = laps.get(laps.size() / 2);
      }

      double sumSq = 0;
      for (double l : laps) {
        sumSq += Math.pow(l - empMean, 2);
      }
      double empStdDev = laps.size() > 1 ? Math.sqrt(sumSq / (laps.size() - 1)) : histStdDev;
      if (empStdDev == 0) empStdDev = 0.05;
      if (empStdDev < 0.15) empStdDev = 0.15; // Inject minimum variance

      int N = laps.size();
      double C = 5.0; // Reduced from 10.0 so we adapt quicker
      double wEmp = N / (N + C);

      if (!hasHistory) {
        wEmp = 1.0;
      }

      blendedMean = (wEmp * empMean) + ((1.0 - wEmp) * histMean);
      blendedStdDev = (wEmp * empStdDev) + ((1.0 - wEmp) * histStdDev);
    } else {
      if (blendedStdDev < 0.15) blendedStdDev = 0.15;
    }

    if (finishMethod == com.antigravity.models.HeatScoring.FinishMethod.Timed) { // fqn-collision
      return simulateTimedHeat(blendedMean, blendedStdDev, finishValue, state, isCurrentHeat);
    } else {
      return simulateLapHeat(blendedMean, blendedStdDev, finishValue, state, isCurrentHeat);
    }
  }

  private SimulationResult simulateTimedHeat(
      double blendedMean,
      double blendedStdDev,
      long finishValue,
      DriverHeatState state,
      boolean isCurrentHeat) {
    double heatDurationSec = (double) finishValue;
    double simulatedLaps = 0;
    double elapsedSec = 0;

    double pending = 0;
    if (isCurrentHeat && state != null) {
      elapsedSec = state.currentHeatElapsedSec;
      pending = state.currentHeatPendingLapTime;
    }

    boolean firstLap = true;
    while (elapsedSec < heatDurationSec) {
      double lapTime = blendedMean + (random.nextGaussian() * blendedStdDev);
      if (lapTime < 1.0) lapTime = 1.0;

      double actualTimeToAdd = lapTime;
      if (firstLap && pending > 0) {
        actualTimeToAdd = lapTime - pending;
        if (actualTimeToAdd < 0.1) actualTimeToAdd = 0.1;
      }

      elapsedSec += actualTimeToAdd;
      if (elapsedSec <= heatDurationSec) {
        simulatedLaps++;
      } else {
        double remainingTime = heatDurationSec - (elapsedSec - actualTimeToAdd);
        if (remainingTime > 0) {
          simulatedLaps += (remainingTime / lapTime);
        }
      }
      firstLap = false;
    }

    SimulationResult res = new SimulationResult();
    res.laps = simulatedLaps;
    res.timeSec = heatDurationSec;
    return res;
  }

  private SimulationResult simulateLapHeat(
      double blendedMean,
      double blendedStdDev,
      long finishValue,
      DriverHeatState state,
      boolean isCurrentHeat) {
    double targetLaps = (double) finishValue;
    double simulatedLaps = 0;
    double elapsedSec = 0;

    double lapsAlreadyDoneThisHeat = 0;
    double pending = 0;
    if (isCurrentHeat && state != null) {
      elapsedSec = state.currentHeatElapsedSec;
      lapsAlreadyDoneThisHeat = state.currentHeatLapsCompleted;
      pending = state.currentHeatPendingLapTime;
    }

    double lapsRemaining = targetLaps - lapsAlreadyDoneThisHeat;
    if (lapsRemaining < 0) lapsRemaining = 0;

    boolean firstLap = true;
    while (simulatedLaps < lapsRemaining) {
      double lapTime = blendedMean + (random.nextGaussian() * blendedStdDev);
      if (lapTime < 1.0) lapTime = 1.0;

      double actualTimeToAdd = lapTime;
      if (firstLap && pending > 0) {
        actualTimeToAdd = lapTime - pending;
        if (actualTimeToAdd < 0.1) actualTimeToAdd = 0.1;
      }

      if (simulatedLaps + 1 <= lapsRemaining) {
        elapsedSec += actualTimeToAdd;
        simulatedLaps++;
      } else {
        double fraction = lapsRemaining - simulatedLaps;
        if (firstLap && pending > 0) {
          double fractionTime = (lapTime * fraction) - pending;
          if (fractionTime < 0.1) fractionTime = 0.1;
          elapsedSec += fractionTime;
        } else {
          elapsedSec += lapTime * fraction;
        }
        simulatedLaps += fraction;
      }
      firstLap = false;
    }

    SimulationResult res = new SimulationResult();
    res.laps = simulatedLaps;
    res.timeSec = elapsedSec;
    return res;
  }

  /** Evaluates post-race prediction accuracy. */
  public PredictionEvaluationRecord evaluatePredictionAccuracy(
      String raceId, PredictionSnapshot preRaceSnapshot, List<DriverProjection> actualStandings) {

    if (preRaceSnapshot == null || actualStandings == null || actualStandings.isEmpty()) {
      return new PredictionEvaluationRecord(
          null, raceId, System.currentTimeMillis(), 0, 0, 0, new ArrayList<>());
    }

    Map<String, Integer> actualRankMap = new HashMap<>();
    Map<String, Double> actualLapsMap = new HashMap<>();

    for (int i = 0; i < actualStandings.size(); i++) {
      DriverProjection dp = actualStandings.get(i);
      actualRankMap.put(dp.getDriverId(), i + 1);
      actualLapsMap.put(dp.getDriverId(), dp.getProjectedLaps());
    }

    List<PredictionEvaluationRecord.DriverEvaluation> driverEvals = new ArrayList<>();
    double sumBrier = 0.0;
    double sumRankError = 0.0;
    double sumLapError = 0.0;
    int count = 0;

    for (DriverProjection preProj : preRaceSnapshot.getProjectedStandings()) {
      String id = preProj.getDriverId();
      if (!actualRankMap.containsKey(id)) {
        continue;
      }

      int actualRank = actualRankMap.get(id);
      double actualLaps = actualLapsMap.get(id);
      double winProb = preRaceSnapshot.getWinProbabilities().getOrDefault(id, 0.0);

      double actualWinOutcome = (actualRank == 1) ? 1.0 : 0.0;
      double brier = Math.pow(winProb - actualWinOutcome, 2);

      double rankErr = Math.abs(preProj.getProjectedRank() - actualRank);
      double lapErr = Math.abs(preProj.getProjectedLaps() - actualLaps);

      sumBrier += brier;
      sumRankError += rankErr;
      sumLapError += lapErr;
      count++;

      PredictionEvaluationRecord.DriverEvaluation de =
          new PredictionEvaluationRecord.DriverEvaluation(
              id,
              preProj.getDriverName(),
              winProb,
              preProj.getProjectedRank(),
              actualRank,
              preProj.getProjectedLaps(),
              actualLaps);
      driverEvals.add(de);
    }

    double brierScore = count > 0 ? sumBrier / count : 0.0;
    double rankMae = count > 0 ? sumRankError / count : 0.0;
    double lapMae = count > 0 ? sumLapError / count : 0.0;

    return new PredictionEvaluationRecord(
        null,
        raceId,
        System.currentTimeMillis(),
        Math.round(brierScore * 1000.0) / 1000.0,
        Math.round(rankMae * 100.0) / 100.0,
        Math.round(lapMae * 100.0) / 100.0,
        driverEvals);
  }
}
