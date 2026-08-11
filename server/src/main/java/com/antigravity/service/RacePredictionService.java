package com.antigravity.service;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.DriverTrackStats;
import com.antigravity.models.PredictionEvaluationRecord;
import com.antigravity.models.Race;
import com.antigravity.models.RacePredictionRecord;
import com.antigravity.models.RacePredictionRecord.PredictionSnapshot;
import com.antigravity.race.Heat;
import com.antigravity.race.RaceParticipant;
import com.antigravity.race.prediction.PredictionEngine;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class RacePredictionService {

  private static final RacePredictionService instance = new RacePredictionService();
  private final PredictionEngine engine;

  public static RacePredictionService getInstance() {
    return instance;
  }

  public RacePredictionService() {
    this.engine = new PredictionEngine();
  }

  public RacePredictionService(PredictionEngine engine) {
    this.engine = engine;
  }

  public RacePredictionRecord generateAndSavePreRacePrediction(
      DatabaseContext context,
      String raceId,
      Race raceModel,
      List<RaceParticipant> participants,
      List<Heat> heats,
      boolean isDemo) {
    return generateAndSavePreRacePrediction(
        context, raceId, raceModel, participants, heats, isDemo, false);
  }

  public RacePredictionRecord generateAndSavePreRacePrediction(
      DatabaseContext context,
      String raceId,
      Race raceModel,
      List<RaceParticipant> participants,
      List<Heat> heats,
      boolean isDemo,
      boolean force) {

    if (raceId == null || participants == null || heats == null) {
      return null;
    }

    String trackId = raceModel != null ? raceModel.getTrackEntityId() : "";

    if (!force && context != null) {
      RacePredictionRecord existing =
          DatabaseService.getInstance().getRacePredictionRecord(context, raceId, isDemo);
      if (existing != null && existing.getPreRace() != null) {
        List<RacePredictionRecord.DriverProjection> standings =
            existing.getPreRace().getProjectedStandings();
        if (standings != null && !standings.isEmpty()) {
          Set<String> existingIds = new HashSet<>();
          boolean hasDiagnostics = true;
          for (RacePredictionRecord.DriverProjection dp : standings) {
            if (dp != null
                && dp.getDriverId() != null
                && !"EMPTY_LANE".equalsIgnoreCase(dp.getDriverId())) {
              existingIds.add(dp.getDriverId());
              if (dp.getTotalSimulations() <= 0) {
                hasDiagnostics = false;
              }
            }
          }
          Set<String> currentIds = new HashSet<>();
          for (RaceParticipant rp : participants) {
            if (rp != null && !PredictionEngine.isParticipantEmpty(rp)) {
              String pId = PredictionEngine.getParticipantId(rp);
              if (pId != null && !pId.isEmpty() && !"EMPTY_LANE".equals(pId)) {
                currentIds.add(pId);
              }
            }
          }
          if (existingIds.equals(currentIds) && hasDiagnostics) {
            return existing;
          }
        }
      }
    }
    Map<String, DriverTrackStats> statsMap = new HashMap<>();

    if (context != null && trackId != null && !trackId.isEmpty()) {
      for (RaceParticipant rp : participants) {
        if (rp != null && !PredictionEngine.isParticipantEmpty(rp)) {
          String driverId = PredictionEngine.getParticipantId(rp);
          if (driverId != null && !driverId.isEmpty()) {
            DriverTrackStats dts =
                DatabaseService.getInstance()
                    .getDriverTrackStats(context, driverId, trackId, isDemo);
            if (dts != null) {
              statsMap.put(driverId, dts);
            }
          }
        }
      }
    }

    PredictionSnapshot preRaceSnapshot =
        engine.generatePreRacePrediction(raceModel, participants, heats, statsMap);

    RacePredictionRecord record = null;
    if (context != null) {
      record = DatabaseService.getInstance().getRacePredictionRecord(context, raceId, isDemo);
    }
    if (record == null) {
      record = new RacePredictionRecord();
      record.setRaceId(raceId);
    }
    record.setTimestamp(System.currentTimeMillis());
    record.setPreRace(preRaceSnapshot);
    if (record.getRealtimeSnapshots() == null) {
      record.setRealtimeSnapshots(new ArrayList<>());
    }

    if (context != null) {
      DatabaseService.getInstance().saveRacePredictionRecord(context, record, isDemo);
    }

    return record;
  }

  public PredictionSnapshot updateRealtimePrediction(
      DatabaseContext context,
      String raceId,
      Race raceModel,
      List<RaceParticipant> participants,
      List<Heat> heats,
      int currentHeatIndex,
      Map<String, PredictionEngine.DriverHeatState> driverHeatStates,
      boolean isDemo) {

    String trackId = raceModel != null ? raceModel.getTrackEntityId() : "";
    Map<String, DriverTrackStats> statsMap = new HashMap<>();

    if (context != null && trackId != null && !trackId.isEmpty()) {
      for (RaceParticipant rp : participants) {
        if (rp != null && !PredictionEngine.isParticipantEmpty(rp)) {
          String driverId = PredictionEngine.getParticipantId(rp);
          if (driverId != null && !driverId.isEmpty()) {
            DriverTrackStats dts =
                DatabaseService.getInstance()
                    .getDriverTrackStats(context, driverId, trackId, isDemo);
            if (dts != null) {
              statsMap.put(driverId, dts);
            }
          }
        }
      }
    }

    PredictionSnapshot snapshot =
        engine.generateRealtimePrediction(
            raceModel, participants, heats, statsMap, currentHeatIndex, driverHeatStates);

    if (context != null && raceId != null) {
      RacePredictionRecord record =
          DatabaseService.getInstance().getRacePredictionRecord(context, raceId, isDemo);
      if (record == null) {
        record = new RacePredictionRecord();
        record.setRaceId(raceId);
        record.setTimestamp(System.currentTimeMillis());
        record.setRealtimeSnapshots(new ArrayList<>());
        record.setPreRace(snapshot);
      }
      if (record.getRealtimeSnapshots() == null) {
        record.setRealtimeSnapshots(new ArrayList<>());
      }
      record.getRealtimeSnapshots().add(snapshot);

      if (record.getRealtimeSnapshots().size() > 50) {
        record.getRealtimeSnapshots().remove(0);
      }

      DatabaseService.getInstance().saveRacePredictionRecord(context, record, isDemo);
      DatabaseService.getInstance().deletePredictionEvaluationRecord(context, raceId, isDemo);
    }

    return snapshot;
  }

  public PredictionEvaluationRecord evaluateAndSavePostRacePrediction(
      DatabaseContext context,
      String raceId,
      List<RacePredictionRecord.DriverProjection> actualStandings,
      boolean isDemo) {

    if (context == null || raceId == null || actualStandings == null) {
      return null;
    }

    RacePredictionRecord record =
        DatabaseService.getInstance().getRacePredictionRecord(context, raceId, isDemo);
    if (record == null || record.getPreRace() == null) {
      return null;
    }

    PredictionEvaluationRecord evalRecord =
        engine.evaluatePredictionAccuracy(raceId, record.getPreRace(), actualStandings);

    DatabaseService.getInstance().savePredictionEvaluationRecord(context, evalRecord, isDemo);

    return evalRecord;
  }
}
