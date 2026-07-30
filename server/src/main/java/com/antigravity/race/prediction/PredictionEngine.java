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
        participants, scheduledHeats, driverStatsMap, 0, new HashMap<>(), DEFAULT_SIMULATION_RUNS);
  }

  public static class DriverHeatState {
    public double totalLapsCompleted = 0.0;
    public List<Double> currentHeatLapTimes = new ArrayList<>();
    public double currentHeatElapsedSec = 0.0;
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
        participants,
        scheduledHeats,
        driverStatsMap,
        currentHeatIndex,
        driverHeatStates,
        DEFAULT_SIMULATION_RUNS);
  }

  private PredictionSnapshot runSimulation(
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

    for (int sim = 0; sim < numSimulations; sim++) {
      executeSingleSimulationRun(
          scheduledHeats,
          driverStatsMap,
          currentHeatIndex,
          driverHeatStates,
          winCounts,
          podiumCounts,
          totalProjectedLaps,
          heatWinnerCounts,
          heatProjectedLapsSum);
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
        numSimulations);
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
      Map<Integer, Map<String, Integer>> heatWinnerCounts,
      Map<Integer, Map<String, Double>> heatProjectedLapsSum) {

    Map<String, Double> simLapsMap = new HashMap<>();
    if (driverHeatStates != null) {
      for (Map.Entry<String, DriverHeatState> entry : driverHeatStates.entrySet()) {
        simLapsMap.put(entry.getKey(), entry.getValue().totalLapsCompleted);
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
        double simulatedHeatLaps =
            simulateHeatForDriver(
                statsDriverId, laneIndex, driverStatsMap, state, h == currentHeatIndex);

        simLapsMap.put(driverId, simLapsMap.getOrDefault(driverId, 0.0) + simulatedHeatLaps);

        Map<String, Double> hLapsMap = heatProjectedLapsSum.get(h);
        hLapsMap.put(driverId, hLapsMap.getOrDefault(driverId, 0.0) + simulatedHeatLaps);

        if (simulatedHeatLaps > bestHeatLaps) {
          bestHeatLaps = simulatedHeatLaps;
          heatWinnerId = driverId;
        }
      }

      if (heatWinnerId != null) {
        Map<String, Integer> hWinners = heatWinnerCounts.get(h);
        hWinners.put(heatWinnerId, hWinners.getOrDefault(heatWinnerId, 0) + 1);
      }
    }

    List<Map.Entry<String, Double>> sortedSimResults = new ArrayList<>(simLapsMap.entrySet());
    sortedSimResults.sort((e1, e2) -> Double.compare(e2.getValue(), e1.getValue()));

    for (int rank = 0; rank < sortedSimResults.size(); rank++) {
      String driverId = sortedSimResults.get(rank).getKey();
      double laps = sortedSimResults.get(rank).getValue();

      totalProjectedLaps.put(driverId, totalProjectedLaps.getOrDefault(driverId, 0.0) + laps);

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
      int numSimulations) {

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

      double winProb = (double) winCounts.getOrDefault(driverId, 0) / numSimulations;
      double podiumProb = (double) podiumCounts.getOrDefault(driverId, 0) / numSimulations;
      double avgLaps = totalProjectedLaps.getOrDefault(driverId, 0.0) / numSimulations;

      DriverProjection dp = new DriverProjection();
      dp.setDriverId(driverId);
      dp.setDriverName(driverName);
      dp.setProjectedLaps(Math.round(avgLaps * 10.0) / 10.0);
      dp.setProjectedTimeSeconds(0.0);
      dp.setWinProbability(Math.round(winProb * 1000.0) / 1000.0);
      dp.setPodiumProbability(Math.round(podiumProb * 1000.0) / 1000.0);

      driverProjections.add(dp);
    }

    driverProjections.sort(
        (p1, p2) -> {
          int cmp = Double.compare(p2.getProjectedLaps(), p1.getProjectedLaps());
          if (cmp != 0) return cmp;
          return Double.compare(p2.getWinProbability(), p1.getWinProbability());
        });

    for (int r = 0; r < driverProjections.size(); r++) {
      DriverProjection dp = driverProjections.get(r);
      dp.setProjectedRank(r + 1);
      winProbabilities.put(dp.getDriverId(), dp.getWinProbability());
      podiumProbabilities.put(dp.getDriverId(), dp.getPodiumProbability());
    }

    List<HeatForecast> heatForecasts = new ArrayList<>();
    for (int h = 0; h < scheduledHeats.size(); h++) {
      Heat forecastHeat = scheduledHeats.get(h);
      HeatForecast hf = new HeatForecast();
      hf.setHeatNumber(forecastHeat.getHeatNumber());

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

  private double simulateHeatForDriver(
      String driverId,
      int laneIndex,
      Map<String, DriverTrackStats> driverStatsMap,
      DriverHeatState state,
      boolean isCurrentHeat) {

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

      int N = laps.size();
      double C = 10.0;
      double wEmp = N / (N + C);

      if (!hasHistory) {
        wEmp = 1.0;
      }

      blendedMean = (wEmp * empMean) + ((1.0 - wEmp) * histMean);
      blendedStdDev = (wEmp * empStdDev) + ((1.0 - wEmp) * histStdDev);
    }

    double heatDurationSec = 180.0;
    double simulatedLaps = 0;
    double elapsedSec = 0;

    if (isCurrentHeat && state != null) {
      elapsedSec = state.currentHeatElapsedSec;
    }

    while (elapsedSec < heatDurationSec) {
      double lapTime = blendedMean + (random.nextGaussian() * blendedStdDev);
      if (lapTime < 1.0) {
        lapTime = 1.0;
      }
      elapsedSec += lapTime;
      if (elapsedSec <= heatDurationSec) {
        simulatedLaps++;
      } else {
        double remainingTime = heatDurationSec - (elapsedSec - lapTime);
        if (remainingTime > 0) {
          simulatedLaps += (remainingTime / lapTime);
        }
      }
    }

    return simulatedLaps;
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
