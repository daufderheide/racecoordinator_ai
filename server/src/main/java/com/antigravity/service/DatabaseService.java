package com.antigravity.service;

import com.antigravity.context.DatabaseContext;
import com.antigravity.context.RaceScope;
import com.antigravity.models.Driver;
import com.antigravity.models.DriverStatistics;
import com.antigravity.models.DriverTrackStats;
import com.antigravity.models.Event;
import com.antigravity.models.GlobalStatistics;
import com.antigravity.models.PredictionEvaluationRecord;
import com.antigravity.models.Race;
import com.antigravity.models.RaceHistoryRecord;
import com.antigravity.models.RacePredictionRecord;
import com.antigravity.models.Season;
import com.antigravity.models.SeasonRaceRecord;
import com.antigravity.models.SeasonRaceRecord.SeasonDriverResult;
import com.antigravity.models.Team;
import com.antigravity.models.Theme;
import com.antigravity.models.Track;
import com.antigravity.proto.RecordData;
import com.antigravity.race.EventExecutionManager;
import com.antigravity.race.Heat;
import com.antigravity.race.RaceSaveData;
import com.antigravity.repository.SqliteRepository;
import com.antigravity.util.SeasonPointsCalculator;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class DatabaseService {
  private static final Logger logger = LoggerFactory.getLogger(DatabaseService.class);
  private static final ObjectMapper objectMapper =
      new ObjectMapper().configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
  private static DatabaseService instance = new DatabaseService();
  private boolean replayMode = false;

  private final DatabaseInitializer databaseInitializer = new DatabaseInitializer();
  private final DatabaseStatisticsService databaseStatisticsService =
      new DatabaseStatisticsService();

  public void setReplayMode(boolean replayMode) {
    this.replayMode = replayMode;
  }

  public boolean isReplayMode() {
    return replayMode;
  }

  public static DatabaseService getInstance() {
    if (instance == null) {
      instance = new DatabaseService();
    }
    return instance;
  }

  public static void setInstance(DatabaseService service) {
    instance = service;
  }

  public DatabaseService() {}

  public void resetToFactory(DatabaseContext context) {
    databaseInitializer.resetToFactory(context);
  }

  public void backfillRaces(DatabaseContext context) {
    databaseInitializer.backfillRaces(context);
  }

  public Track getFactoryTrack() {
    return databaseInitializer.getFactoryTrack();
  }

  public Race getRace(DatabaseContext context, String entityId) {
    return new SqliteRepository<>(context, "races", Race.class).findByEntityId(entityId);
  }

  public Event getEvent(DatabaseContext context, String entityId) {
    return new SqliteRepository<>(context, "events", Event.class).findByEntityId(entityId);
  }

  public List<Event> getEvents(DatabaseContext context) {
    return new SqliteRepository<>(context, "events", Event.class).findAll();
  }

  public Track getTrack(DatabaseContext context, String entityId) {
    return new SqliteRepository<>(context, "tracks", Track.class).findByEntityId(entityId);
  }

  public Theme getTheme(DatabaseContext context, String entityId) {
    return new SqliteRepository<>(context, "themes", Theme.class).findByEntityId(entityId);
  }

  public Driver getDriver(DatabaseContext context, String entityId) {
    return new SqliteRepository<>(context, "drivers", Driver.class).findByEntityId(entityId);
  }

  public List<Driver> getDrivers(DatabaseContext context, List<String> entityIds) {
    SqliteRepository<Driver> repo = new SqliteRepository<>(context, "drivers", Driver.class);
    List<Driver> orderedDrivers = new ArrayList<>();
    if (entityIds != null) {
      for (String id : entityIds) {
        Driver d = repo.findByEntityId(id);
        if (d != null) orderedDrivers.add(d);
      }
    }
    return orderedDrivers;
  }

  public List<Team> getTeams(DatabaseContext context, List<String> entityIds) {
    SqliteRepository<Team> repo = new SqliteRepository<>(context, "teams", Team.class);
    List<Team> orderedTeams = new ArrayList<>();
    if (entityIds != null) {
      for (String id : entityIds) {
        Team t = repo.findByEntityId(id);
        if (t != null) orderedTeams.add(t);
      }
    }
    return orderedTeams;
  }

  public List<Team> getAllTeams(DatabaseContext context) {
    return new SqliteRepository<>(context, "teams", Team.class).findAll();
  }

  public void saveRaceHistory(
      DatabaseContext context, com.antigravity.race.Race runtimeRace) { // fqn-collision
    if (runtimeRace == null || replayMode) {
      return;
    }
    boolean isDemo = runtimeRace.isDemoMode();
    String tableName = getCollectionName("race_history", isDemo);
    try {
      SqliteRepository<RaceHistoryRecord> repo =
          new SqliteRepository<>(context, tableName, RaceHistoryRecord.class);
      RaceHistoryRecord record = new RaceHistoryRecord();
      record.setId(java.util.UUID.randomUUID().toString());
      record.setDemo(isDemo);
      if (runtimeRace.getRaceModel() != null) {
        record.setOriginalEntityId(runtimeRace.getRaceModel().getEntityId());
        record.setModel(runtimeRace.getRaceModel());
      }
      record.setTrack(runtimeRace.getTrack());
      record.setDrivers(runtimeRace.getDrivers());
      record.setHeats(runtimeRace.getHeats());
      record.setAccumulatedRaceTime(runtimeRace.getRaceTime());
      record.setStatistics(runtimeRace.getStatistics());

      EventExecutionManager eventMgr = EventExecutionManager.getInstance();
      if (eventMgr.isEventActive()) {
        record.setEventRace(true);
        if (eventMgr.getActiveEvent() != null) {
          record.setEventId(eventMgr.getActiveEvent().getEntityId());
          record.setEventName(eventMgr.getActiveEvent().getName());
        }
      }

      try {
        List<SeasonDriverResult> driverResults =
            SeasonPointsCalculator.calculateDriverResultsForRace(runtimeRace);
        record.setDriverResults(driverResults);
      } catch (Exception ex) {
        logger.warn("Could not calculate driver results for race history record", ex);
      }

      repo.save(record);
      logger.info("Race successfully saved to {}", tableName);
    } catch (Exception e) {
      logger.error("Failed to save race to history", e);
    }
  }

  public void saveRawRaceHistoryRecord(DatabaseContext context, RaceHistoryRecord record) {
    if (context == null || record == null) return;
    try {
      boolean isDemo = record.isDemo();
      String tableName = getCollectionName("race_history", isDemo);
      SqliteRepository<RaceHistoryRecord> repo =
          new SqliteRepository<>(context, tableName, RaceHistoryRecord.class);
      repo.save(record);
      logger.info("Raw race history record successfully saved to {}", tableName);
    } catch (Exception e) {
      logger.error("Failed to save raw race history record", e);
    }
  }

  public Season getSeason(DatabaseContext context, String seasonId) {
    if (seasonId == null || seasonId.trim().isEmpty() || context == null) {
      return null;
    }
    return new SqliteRepository<>(context, "seasons", Season.class).findByEntityId(seasonId);
  }

  public void commitRaceToSeason(
      DatabaseContext context,
      String seasonId,
      String raceName,
      long timestamp,
      boolean isDemo,
      List<SeasonDriverResult> driverResults) {
    if (seasonId == null
        || seasonId.trim().isEmpty()
        || driverResults == null
        || driverResults.isEmpty()) {
      return;
    }
    try {
      SqliteRepository<Season> repo = new SqliteRepository<>(context, "seasons", Season.class);
      Season season = repo.findByEntityId(seasonId);
      if (season == null) {
        logger.warn("Season not found for entity_id: {}", seasonId);
        return;
      }
      List<SeasonRaceRecord> races = season.getRaces();
      if (races == null) races = new ArrayList<>();
      String nextRaceId = String.valueOf(races.size() + 1);
      long recordTimestamp = timestamp > 0 ? timestamp : System.currentTimeMillis();
      SeasonRaceRecord newRecord =
          new SeasonRaceRecord(nextRaceId, raceName, recordTimestamp, isDemo, driverResults);
      races.add(newRecord);

      Season updatedSeason =
          new Season(season.getName(), season.getDrops(), races, season.getEntityId(), null);
      repo.save(updatedSeason);
      logger.info(
          "Committed race '{}' results (isDemo={}) to season '{}'",
          raceName,
          isDemo,
          season.getName());
    } catch (Exception e) {
      logger.error("Failed to commit race to season", e);
    }
  }

  public void commitRaceToSeason(
      DatabaseContext context,
      String seasonId,
      String raceName,
      boolean isDemo,
      List<SeasonDriverResult> driverResults) {
    commitRaceToSeason(context, seasonId, raceName, 0L, isDemo, driverResults);
  }

  public void commitRaceToSeason(
      DatabaseContext context,
      String seasonId,
      String raceName,
      List<SeasonDriverResult> driverResults) {
    commitRaceToSeason(context, seasonId, raceName, 0L, false, driverResults);
  }

  public void saveRaceRecords(
      DatabaseContext context, com.antigravity.race.Race runtimeRace) { // fqn-collision
    if (runtimeRace == null || runtimeRace.getRaceModel() == null || replayMode) return;
    boolean isDemo = runtimeRace.isDemoMode();
    String raceId = runtimeRace.getRaceModel().getEntityId();
    String tableName = getCollectionName("race_records", isDemo);
    try {
      context
          .getConnection()
          .createStatement()
          .execute(
              "CREATE TABLE IF NOT EXISTS "
                  + tableName
                  + " (race_id TEXT PRIMARY KEY, records_blob BLOB)");
      String sql =
          "INSERT INTO "
              + tableName
              + " (race_id, records_blob) VALUES (?, ?) "
              + "ON CONFLICT(race_id) DO UPDATE SET records_blob=excluded.records_blob";
      try (PreparedStatement pstmt = context.getConnection().prepareStatement(sql)) {
        pstmt.setString(1, raceId);
        pstmt.setBytes(2, runtimeRace.getRecordData().toByteArray());
        pstmt.executeUpdate();
      }
      logger.info(
          "SAVED RACE RECORDS: race_id={}, isDemo={}, records_size={}",
          raceId,
          isDemo,
          runtimeRace.getRecordData().toByteArray().length);
    } catch (Exception e) {
      logger.error("Failed to save race records", e);
    }
  }

  public RecordData getRaceRecords(DatabaseContext context, String raceId, boolean isDemo) {
    String tableName = getCollectionName("race_records", isDemo);
    try {
      context
          .getConnection()
          .createStatement()
          .execute(
              "CREATE TABLE IF NOT EXISTS "
                  + tableName
                  + " (race_id TEXT PRIMARY KEY, records_blob BLOB)");
      String sql = "SELECT records_blob FROM " + tableName + " WHERE race_id = ?";
      try (PreparedStatement pstmt = context.getConnection().prepareStatement(sql)) {
        pstmt.setString(1, raceId);
        try (ResultSet rs = pstmt.executeQuery()) {
          if (rs.next()) {
            byte[] bytes = rs.getBytes("records_blob");
            if (bytes != null) {
              logger.info(
                  "LOADED RACE RECORDS: race_id={}, isDemo={}, records_size={}",
                  raceId,
                  isDemo,
                  bytes.length);
              return RecordData.parseFrom(bytes);
            }
          }
        }
      }
    } catch (Exception e) {
      logger.error("Failed to load race records", e);
    }
    return null;
  }

  public void updateGlobalStatistics(
      DatabaseContext context, com.antigravity.race.Race runtimeRace) { // fqn-collision
    databaseStatisticsService.updateGlobalStatistics(context, runtimeRace);
  }

  public GlobalStatistics getGlobalStatistics(
      DatabaseContext context, String raceEntityId, RaceScope scope) {
    return databaseStatisticsService.getGlobalStatistics(context, raceEntityId, scope);
  }

  public GlobalStatistics getGlobalStatistics(
      DatabaseContext context, String raceEntityId, boolean isDemo) {
    return databaseStatisticsService.getGlobalStatistics(context, raceEntityId, isDemo);
  }

  public List<RaceHistoryRecord> getRaceHistory(DatabaseContext context, RaceScope scope) {
    String tableName = getCollectionName("race_history", scope);
    return new SqliteRepository<>(context, tableName, RaceHistoryRecord.class).findAll();
  }

  public List<RaceHistoryRecord> getRaceHistory(DatabaseContext context, boolean isDemo) {
    return getRaceHistory(context, RaceScope.fromBoolean(isDemo));
  }

  public RaceHistoryRecord getRaceHistoryById(DatabaseContext context, String id, RaceScope scope) {
    String tableName = getCollectionName("race_history", scope);
    return new SqliteRepository<>(context, tableName, RaceHistoryRecord.class).findByEntityId(id);
  }

  public RaceHistoryRecord getRaceHistoryById(DatabaseContext context, String id, boolean isDemo) {
    return getRaceHistoryById(context, id, RaceScope.fromBoolean(isDemo));
  }

  public void upsertAutoSave(DatabaseContext context, RaceSaveData data) {
    if (data == null) {
      return;
    }
    boolean isDemo = data.isDemoMode();
    String tableName = getCollectionName("saved_races", isDemo);
    try {
      context.ensureTable(tableName);
      String sql =
          "INSERT INTO "
              + tableName
              + " (entity_id, sequence_id, json_data) VALUES (?, ?, ?) "
              + "ON CONFLICT(entity_id) DO UPDATE SET sequence_id=excluded.sequence_id, json_data=excluded.json_data";
      try (PreparedStatement pstmt = context.getConnection().prepareStatement(sql)) {
        String entityId =
            data.getSaveName() != null ? data.getSaveName() : UUID.randomUUID().toString();
        pstmt.setString(1, entityId);
        pstmt.setString(2, data.getSaveName());
        pstmt.setString(3, objectMapper.writeValueAsString(data));
        pstmt.executeUpdate();
      }
    } catch (Exception e) {
      logger.error("Failed to auto-save race", e);
    }
  }

  public void saveManualRace(DatabaseContext context, RaceSaveData data) {
    upsertAutoSave(context, data);
  }

  public List<RaceSaveData> getSavedRaces(DatabaseContext context, RaceScope scope) {
    String tableName = getCollectionName("saved_races", scope);
    context.ensureTable(tableName);
    List<RaceSaveData> saves = new ArrayList<>();
    String sql = "SELECT sequence_id, json_data FROM " + tableName;
    try (PreparedStatement pstmt = context.getConnection().prepareStatement(sql);
        ResultSet rs = pstmt.executeQuery()) {
      while (rs.next()) {
        String sequenceId = rs.getString("sequence_id");
        String json = rs.getString("json_data");
        if (json != null && !json.trim().isEmpty()) {
          try {
            RaceSaveData race = objectMapper.readValue(json, RaceSaveData.class);
            if (race != null) {
              if (race.getHeats() != null && race.getModel() != null) {
                for (Heat heat : race.getHeats()) {
                  heat.initializeStandings(
                      race.getModel().getHeatScoring(), race.getModel().isPractice());
                }
              }
              saves.add(race);
            }
          } catch (Exception e) {
            logger.warn("Failed to parse a saved race record, marking it corrupt.", e);
            RaceSaveData corruptRace = new RaceSaveData();
            corruptRace.setSaveName(sequenceId);
            corruptRace.setCorrupt(true);
            saves.add(corruptRace);
          }
        }
      }
    } catch (Exception e) {
      logger.error("Error reading saved races", e);
    }
    return saves;
  }

  public List<RaceSaveData> getSavedRaces(DatabaseContext context, boolean isDemo) {
    return getSavedRaces(context, RaceScope.fromBoolean(isDemo));
  }

  public RaceSaveData getSavedRace(DatabaseContext context, String saveName, RaceScope scope) {
    if (context == null || saveName == null) return null;
    String tableName = getCollectionName("saved_races", scope);
    context.ensureTable(tableName);
    String sql = "SELECT json_data FROM " + tableName + " WHERE sequence_id = ? OR entity_id = ?";
    try (PreparedStatement pstmt = context.getConnection().prepareStatement(sql)) {
      pstmt.setString(1, saveName);
      pstmt.setString(2, saveName);
      try (ResultSet rs = pstmt.executeQuery()) {
        if (rs.next()) {
          String json = rs.getString("json_data");
          if (json != null && !json.trim().isEmpty()) {
            return objectMapper.readValue(json, RaceSaveData.class);
          }
        }
      }
    } catch (Exception e) {
      logger.error("Error getting saved race {}", saveName, e);
    }
    return null;
  }

  public RaceSaveData getSavedRace(DatabaseContext context, String saveName, boolean isDemo) {
    return getSavedRace(context, saveName, RaceScope.fromBoolean(isDemo));
  }

  public boolean deleteSavedRace(DatabaseContext context, String saveName, RaceScope scope) {
    if (context == null || saveName == null) return false;
    String tableName = getCollectionName("saved_races", scope);
    context.ensureTable(tableName);
    String sql =
        "DELETE FROM "
            + tableName
            + " WHERE sequence_id = ? OR entity_id = ? OR json_extract(json_data, '$.saveName') = ? OR json_extract(json_data, '$.save_name') = ?";
    try (PreparedStatement pstmt = context.getConnection().prepareStatement(sql)) {
      pstmt.setString(1, saveName);
      pstmt.setString(2, saveName);
      pstmt.setString(3, saveName);
      pstmt.setString(4, saveName);
      int rows = pstmt.executeUpdate();
      return rows > 0;
    } catch (Exception e) {
      logger.error("Error deleting saved race {}", saveName, e);
      return false;
    }
  }

  public boolean deleteSavedRace(DatabaseContext context, String saveName, boolean isDemo) {
    return deleteSavedRace(context, saveName, RaceScope.fromBoolean(isDemo));
  }

  public boolean renameSavedRace(
      DatabaseContext context, String oldSaveName, String newSaveName, RaceScope scope) {
    if (context == null
        || oldSaveName == null
        || newSaveName == null
        || newSaveName.trim().isEmpty()) {
      return false;
    }
    String tableName = getCollectionName("saved_races", scope);
    context.ensureTable(tableName);
    RaceSaveData existing = getSavedRace(context, oldSaveName, scope);
    if (existing == null) {
      return false;
    }

    String normalizedNewName = newSaveName.trim();
    if (!normalizedNewName.toLowerCase().endsWith(".json")) {
      normalizedNewName += ".json";
    }
    existing.setSaveName(normalizedNewName);

    String sql =
        "UPDATE "
            + tableName
            + " SET sequence_id = ?, entity_id = ?, json_data = ? "
            + " WHERE sequence_id = ? OR entity_id = ? OR json_extract(json_data, '$.saveName') = ? OR json_extract(json_data, '$.save_name') = ?";
    try (PreparedStatement pstmt = context.getConnection().prepareStatement(sql)) {
      pstmt.setString(1, normalizedNewName);
      pstmt.setString(2, normalizedNewName);
      pstmt.setString(3, objectMapper.writeValueAsString(existing));
      pstmt.setString(4, oldSaveName);
      pstmt.setString(5, oldSaveName);
      pstmt.setString(6, oldSaveName);
      pstmt.setString(7, oldSaveName);
      int rows = pstmt.executeUpdate();
      return rows > 0;
    } catch (Exception e) {
      logger.error("Error renaming saved race from {} to {}", oldSaveName, normalizedNewName, e);
      return false;
    }
  }

  public boolean renameSavedRace(
      DatabaseContext context, String oldSaveName, String newSaveName, boolean isDemo) {
    return renameSavedRace(context, oldSaveName, newSaveName, RaceScope.fromBoolean(isDemo));
  }

  public void resetRaceData(DatabaseContext context, String raceEntityId) {
    deleteAllRaceData(context, raceEntityId);
  }

  public void deleteAllRaceData(DatabaseContext context, String raceEntityId) {
    if (context == null || raceEntityId == null || raceEntityId.isEmpty()) return;
    try {
      deleteFromTableWhere(
          context,
          getCollectionName("race_history", false),
          "json_data LIKE '%\"original_entity_id\":\""
              + raceEntityId
              + "\"%' OR json_data LIKE '%\"entity_id\":\""
              + raceEntityId
              + "\"%'");
      deleteFromTableWhere(
          context,
          getCollectionName("race_history", true),
          "json_data LIKE '%\"original_entity_id\":\""
              + raceEntityId
              + "\"%' OR json_data LIKE '%\"entity_id\":\""
              + raceEntityId
              + "\"%'");
      deleteFromRaceRecords(context, getCollectionName("race_records", false), raceEntityId);
      deleteFromRaceRecords(context, getCollectionName("race_records", true), raceEntityId);
      deleteFromTableWhere(
          context,
          getCollectionName("global_statistics", false),
          "entity_id = '"
              + raceEntityId
              + "' OR json_data LIKE '%\"race_entity_id\":\""
              + raceEntityId
              + "\"%'");
      deleteFromTableWhere(
          context,
          getCollectionName("global_statistics", true),
          "entity_id = '"
              + raceEntityId
              + "' OR json_data LIKE '%\"race_entity_id\":\""
              + raceEntityId
              + "\"%'");
      deleteFromTableWhere(
          context,
          getCollectionName("saved_races", false),
          "json_data LIKE '%\"entity_id\":\"" + raceEntityId + "\"%'");
      deleteFromTableWhere(
          context,
          getCollectionName("saved_races", true),
          "json_data LIKE '%\"entity_id\":\"" + raceEntityId + "\"%'");
      deleteFromTableWhere(
          context,
          getCollectionName("driver_statistics", false),
          "json_data LIKE '%\"race_id\":\"" + raceEntityId + "\"%'");
      deleteFromTableWhere(
          context,
          getCollectionName("driver_statistics", true),
          "json_data LIKE '%\"race_id\":\"" + raceEntityId + "\"%'");
      deleteFromTableWhere(
          context,
          getCollectionName("race_predictions", false),
          "entity_id = '"
              + raceEntityId
              + "' OR json_data LIKE '%\"raceId\":\""
              + raceEntityId
              + "\"%'");
      deleteFromTableWhere(
          context,
          getCollectionName("race_predictions", true),
          "entity_id = '"
              + raceEntityId
              + "' OR json_data LIKE '%\"raceId\":\""
              + raceEntityId
              + "\"%'");
      deleteFromTableWhere(
          context,
          getCollectionName("prediction_evaluations", false),
          "entity_id = '"
              + raceEntityId
              + "' OR json_data LIKE '%\"raceId\":\""
              + raceEntityId
              + "\"%'");
      deleteFromTableWhere(
          context,
          getCollectionName("prediction_evaluations", true),
          "entity_id = '"
              + raceEntityId
              + "' OR json_data LIKE '%\"raceId\":\""
              + raceEntityId
              + "\"%'");
    } catch (Exception e) {
      logger.error("Failed to perform cascading deletion for race {}", raceEntityId, e);
    }
  }

  private void deleteFromRaceRecords(DatabaseContext context, String tableName, String raceId) {
    try {
      context
          .getConnection()
          .createStatement()
          .execute(
              "CREATE TABLE IF NOT EXISTS "
                  + tableName
                  + " (race_id TEXT PRIMARY KEY, records_blob BLOB)");
      String sql = "DELETE FROM " + tableName + " WHERE race_id = ?";
      try (PreparedStatement pstmt = context.getConnection().prepareStatement(sql)) {
        pstmt.setString(1, raceId);
        pstmt.executeUpdate();
      }
    } catch (Exception e) {
      // Ignore
    }
  }

  private void deleteFromTableWhere(DatabaseContext context, String tableName, String whereClause) {
    context.ensureTable(tableName);
    String sql = "DELETE FROM " + tableName + " WHERE " + whereClause;
    try (Statement stmt = context.getConnection().createStatement()) {
      stmt.execute(sql);
    } catch (Exception e) {
      // Ignore
    }
  }

  public void saveDriverStatistics(
      DatabaseContext context, com.antigravity.race.Race race) { // fqn-collision
    databaseStatisticsService.saveDriverStatistics(context, race);
  }

  public DriverStatistics getDriverStatistics(
      DatabaseContext context, String driverId, String raceId, RaceScope scope) {
    return databaseStatisticsService.getDriverStatistics(context, driverId, raceId, scope);
  }

  public DriverStatistics getDriverStatistics(
      DatabaseContext context, String driverId, String raceId, boolean isDemo) {
    return databaseStatisticsService.getDriverStatistics(context, driverId, raceId, isDemo);
  }

  public DriverTrackStats getDriverTrackStats(
      DatabaseContext context, String driverId, String trackId, boolean isDemo) {
    return databaseStatisticsService.getDriverTrackStats(context, driverId, trackId, isDemo);
  }

  public void updateDriverTrackStats(
      DatabaseContext context, com.antigravity.race.Race race, boolean isDemo) { // fqn-collision
    databaseStatisticsService.updateDriverTrackStats(context, race, isDemo);
  }

  public void saveDriverTrackStats(
      DatabaseContext context, DriverTrackStats stats, boolean isDemo) {
    databaseStatisticsService.saveDriverTrackStats(context, stats, isDemo);
  }

  public RacePredictionRecord getRacePredictionRecord(
      DatabaseContext context, String raceId, boolean isDemo) {
    if (context == null || raceId == null) return null;
    String tableName = getCollectionName("race_predictions", isDemo);
    SqliteRepository<RacePredictionRecord> repo =
        new SqliteRepository<>(context, tableName, RacePredictionRecord.class);
    List<RacePredictionRecord> all = repo.findAll();
    for (RacePredictionRecord r : all) {
      if (raceId.equals(r.getRaceId())) return r;
    }
    return null;
  }

  public void saveRacePredictionRecord(
      DatabaseContext context, RacePredictionRecord record, boolean isDemo) {
    if (context == null || record == null || record.getRaceId() == null) return;
    String tableName = getCollectionName("race_predictions", isDemo);
    SqliteRepository<RacePredictionRecord> repo =
        new SqliteRepository<>(context, tableName, RacePredictionRecord.class);
    repo.save(record);
  }

  public PredictionEvaluationRecord getPredictionEvaluationRecord(
      DatabaseContext context, String raceId, boolean isDemo) {
    if (context == null || raceId == null) return null;
    String tableName = getCollectionName("prediction_evaluations", isDemo);
    SqliteRepository<PredictionEvaluationRecord> repo =
        new SqliteRepository<>(context, tableName, PredictionEvaluationRecord.class);
    for (PredictionEvaluationRecord r : repo.findAll()) {
      if (raceId.equals(r.getRaceId())) return r;
    }
    return null;
  }

  public void deletePredictionEvaluationRecord(
      DatabaseContext context, String raceId, boolean isDemo) {
    if (context == null || raceId == null) return;
    String tableName = getCollectionName("prediction_evaluations", isDemo);
    SqliteRepository<PredictionEvaluationRecord> repo =
        new SqliteRepository<>(context, tableName, PredictionEvaluationRecord.class);
    repo.delete(raceId);
  }

  public void savePredictionEvaluationRecord(
      DatabaseContext context, PredictionEvaluationRecord record, boolean isDemo) {
    if (context == null || record == null || record.getRaceId() == null) return;
    String tableName = getCollectionName("prediction_evaluations", isDemo);
    SqliteRepository<PredictionEvaluationRecord> repo =
        new SqliteRepository<>(context, tableName, PredictionEvaluationRecord.class);
    repo.save(record);
  }

  private String getCollectionName(String baseName, RaceScope scope) {
    if (scope == null) {
      scope = RaceScope.PRODUCTION;
    }
    return scope.getCollectionName(baseName);
  }

  private String getCollectionName(String baseName, boolean isDemo) {
    return getCollectionName(baseName, RaceScope.fromBoolean(isDemo));
  }
}
