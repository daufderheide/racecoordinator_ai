package com.antigravity.service;

import com.antigravity.models.DriverTrackStats;
import com.antigravity.models.PredictionEvaluationRecord;
import com.antigravity.models.Race;
import com.antigravity.models.RacePredictionRecord;
import com.antigravity.models.RacePredictionRecord.PredictionSnapshot;
import com.antigravity.race.Heat;
import com.antigravity.race.RaceParticipant;
import com.antigravity.race.prediction.PredictionEngine;
import com.mongodb.client.MongoDatabase;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.bson.types.ObjectId;

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
      MongoDatabase database,
      String raceId,
      Race raceModel,
      List<RaceParticipant> participants,
      List<Heat> heats,
      boolean isDemo) {
    return generateAndSavePreRacePrediction(
        database, raceId, raceModel, participants, heats, isDemo, false);
  }

  public RacePredictionRecord generateAndSavePreRacePrediction(
      MongoDatabase database,
      String raceId,
      Race raceModel,
      List<RaceParticipant> participants,
      List<Heat> heats,
      boolean isDemo,
      boolean force) {

    if (raceId == null || participants == null || heats == null) {
      return null;
    }

    if (!force && database != null) {
      RacePredictionRecord existing =
          DatabaseService.getInstance().getRacePredictionRecord(database, raceId, isDemo);
      if (existing != null && existing.getPreRace() != null) {
        return existing;
      }
    }

    String trackId = raceModel != null ? raceModel.getTrackEntityId() : "";
    Map<String, DriverTrackStats> statsMap = new HashMap<>();

    if (database != null && trackId != null && !trackId.isEmpty()) {
      for (RaceParticipant rp : participants) {
        if (rp != null && rp.getDriver() != null && rp.getDriver().getEntityId() != null) {
          String driverId = rp.getDriver().getEntityId();
          DriverTrackStats dts =
              DatabaseService.getInstance()
                  .getDriverTrackStats(database, driverId, trackId, isDemo);
          if (dts != null) {
            statsMap.put(driverId, dts);
          }
        }
      }
    }

    PredictionSnapshot preRaceSnapshot =
        engine.generatePreRacePrediction(raceModel, participants, heats, statsMap);

    RacePredictionRecord record = new RacePredictionRecord();
    record.setId(new ObjectId());
    record.setRaceId(raceId);
    record.setTimestamp(System.currentTimeMillis());
    record.setPreRace(preRaceSnapshot);

    if (database != null) {
      DatabaseService.getInstance().saveRacePredictionRecord(database, record, isDemo);
    }

    return record;
  }

  public PredictionSnapshot updateRealtimePrediction(
      MongoDatabase database,
      String raceId,
      Race raceModel,
      List<RaceParticipant> participants,
      List<Heat> heats,
      int currentHeatIndex,
      Map<String, Double> actualDriverLapsSoFar,
      boolean isDemo) {

    String trackId = raceModel != null ? raceModel.getTrackEntityId() : "";
    Map<String, DriverTrackStats> statsMap = new HashMap<>();

    if (database != null && trackId != null && !trackId.isEmpty()) {
      for (RaceParticipant rp : participants) {
        if (rp != null && rp.getDriver() != null && rp.getDriver().getEntityId() != null) {
          String driverId = rp.getDriver().getEntityId();
          DriverTrackStats dts =
              DatabaseService.getInstance()
                  .getDriverTrackStats(database, driverId, trackId, isDemo);
          if (dts != null) {
            statsMap.put(driverId, dts);
          }
        }
      }
    }

    PredictionSnapshot snapshot =
        engine.generateRealtimePrediction(
            raceModel, participants, heats, statsMap, currentHeatIndex, actualDriverLapsSoFar);

    if (database != null && raceId != null) {
      RacePredictionRecord record =
          DatabaseService.getInstance().getRacePredictionRecord(database, raceId, isDemo);
      if (record != null) {
        record.getRealtimeSnapshots().add(snapshot);
        DatabaseService.getInstance().saveRacePredictionRecord(database, record, isDemo);
      }
    }

    return snapshot;
  }

  public PredictionEvaluationRecord evaluateAndSavePostRacePrediction(
      MongoDatabase database,
      String raceId,
      List<RacePredictionRecord.DriverProjection> actualStandings,
      boolean isDemo) {

    if (database == null || raceId == null || actualStandings == null) {
      return null;
    }

    RacePredictionRecord record =
        DatabaseService.getInstance().getRacePredictionRecord(database, raceId, isDemo);
    if (record == null || record.getPreRace() == null) {
      return null;
    }

    PredictionEvaluationRecord evalRecord =
        engine.evaluatePredictionAccuracy(raceId, record.getPreRace(), actualStandings);

    DatabaseService.getInstance().savePredictionEvaluationRecord(database, evalRecord, isDemo);

    return evalRecord;
  }
}
