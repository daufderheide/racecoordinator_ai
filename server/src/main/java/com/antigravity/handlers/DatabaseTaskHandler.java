package com.antigravity.handlers;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.CustomHeat;
import com.antigravity.models.CustomRotation;
import com.antigravity.models.Driver;
import com.antigravity.models.GlobalStatistics;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.Lane;
import com.antigravity.models.OverallScoring;
import com.antigravity.models.Race;
import com.antigravity.models.RaceHistoryRecord;
import com.antigravity.models.Team;
import com.antigravity.models.Track;
import com.antigravity.race.DriverHeatData;
import com.antigravity.race.Heat;
import com.antigravity.race.RaceParticipant;
import com.antigravity.service.DatabaseService;
import com.antigravity.util.CsvExporter;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.FindOneAndUpdateOptions;
import com.mongodb.client.model.ReturnDocument;
import com.mongodb.client.model.Updates;
import com.mongodb.client.result.DeleteResult;
import com.mongodb.client.result.UpdateResult;
import io.javalin.Javalin;
import io.javalin.http.Context;
import io.javalin.http.UploadedFile;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class DatabaseTaskHandler {

  private static final Logger logger = LoggerFactory.getLogger(DatabaseTaskHandler.class);
  private final DatabaseContext databaseContext;

  public DatabaseTaskHandler(DatabaseContext databaseContext, Javalin app) {
    this.databaseContext = databaseContext;

    app.get("/api/drivers", this::getDrivers);
    app.post("/api/drivers", this::createDriver);
    app.put("/api/drivers/{id}", this::updateDriver);
    app.delete("/api/drivers/{id}", this::deleteDriver);
    app.get("/api/tracks", this::getTracks);
    app.get("/api/races", this::getRaces);
    app.get("/api/teams", this::getTeams);
    app.post("/api/teams", this::createTeam);
    app.put("/api/teams/{id}", this::updateTeam);
    app.delete("/api/teams/{id}", this::deleteTeam);

    app.get("/api/tracks/factory-settings", this::getFactoryTrack);

    app.post("/api/tracks", this::createTrack);
    app.put("/api/tracks/{id}", this::updateTrack);
    app.delete("/api/tracks/{id}", this::deleteTrack);

    app.post("/api/races", this::handleCreateRace);
    app.put("/api/races/{id}", this::handleUpdateRace);
    app.delete("/api/races/{id}", this::handleDeleteRace);
    app.post("/api/races/{id}/generate-heats", this::generateHeats);
    app.post("/api/heats/preview", this::previewHeats);

    // Database Management Endpoints
    app.get("/api/databases", this::listDatabases);
    app.post("/api/databases/switch", this::switchDatabase);
    app.post("/api/databases/create", this::createDatabase);
    app.post("/api/databases/copy", this::copyDatabase);
    app.post("/api/databases/reset", this::resetDatabase);
    app.post("/api/databases/delete", this::deleteDatabase);
    app.get("/api/databases/current", this::getCurrentDatabase);
    app.get("/api/databases/{name}/export", this::exportDatabase);
    app.post("/api/databases/import", this::importDatabase);

    app.get("/api/history/races", this::getRaceHistoryList);
    app.get("/api/history/races/{id}", this::getRaceHistoryById);
    app.delete("/api/history/races/{id}", this::handleDeleteRaceHistory);
    app.get("/api/history/races/{id}/export", this::exportRaceHistoryCsv);
    app.get("/api/history/stats", this::getGlobalStatistics);
  }

  private MongoCollection<Driver> getDriverCollection() {
    return databaseContext.getDatabase().getCollection("drivers", Driver.class);
  }

  private MongoCollection<Team> getTeamCollection() {
    return databaseContext.getDatabase().getCollection("teams", Team.class);
  }

  private MongoCollection<Track> getTrackCollection() {
    return databaseContext.getDatabase().getCollection("tracks", Track.class);
  }

  private MongoCollection<Race> getRaceCollection() {
    return databaseContext.getDatabase().getCollection("races", Race.class);
  }

  // --- Database Management Handlers ---

  private void listDatabases(Context ctx) {
    try {
      List<String> dbNames = databaseContext.listDatabases();
      List<DatabaseContext.DatabaseStats> statsList = new ArrayList<>();
      for (String dbName : dbNames) {
        // Filter out minimal system DBs if needed, or just show all
        if ("admin".equals(dbName) || "local".equals(dbName) || "config".equals(dbName)) {
          continue;
        }
        statsList.add(databaseContext.getDatabaseStats(dbName));
      }
      ctx.json(statsList);
    } catch (Exception e) {
      logger.error("Error listing databases", e);
      ctx.status(500).result("Error listing databases: " + e.getMessage());
    }
  }

  private void switchDatabase(Context ctx) {
    try {
      Map<String, String> body = ctx.bodyAsClass(Map.class);
      String name = body.get("name");
      if (name == null || name.isEmpty()) {
        ctx.status(400).result("Database name is required");
        return;
      }
      databaseContext.switchDatabase(name);
      ctx.json(databaseContext.getDatabaseStats(name));
    } catch (Exception e) {
      logger.error("Error switching database", e);
      ctx.status(500).result("Error switching database: " + e.getMessage());
    }
  }

  private void createDatabase(Context ctx) {
    try {
      Map<String, String> body = ctx.bodyAsClass(Map.class);
      String name = body.get("name");
      if (name == null || name.isEmpty()) {
        ctx.status(400).result("Database name is required");
        return;
      }

      // Check if database already exists
      List<String> existingDbs = databaseContext.listDatabases();
      if (existingDbs.contains(name)) {
        ctx.status(409).result("Database already exists");
        return;
      }

      // Explicitly create the database to ensure it exists in lists
      databaseContext.createDatabase(name);
      databaseContext.switchDatabase(name);

      // Allow the user to start with a fresh factory-default database
      databaseContext.resetDatabaseToFactory(name);

      ctx.json(databaseContext.getDatabaseStats(name));
    } catch (Exception e) {
      logger.error("Error creating database", e);
      ctx.status(500).result("Error creating database: " + e.getMessage());
    }
  }

  private void copyDatabase(Context ctx) {
    try {
      Map<String, String> body = ctx.bodyAsClass(Map.class);
      String newName = body.get("name");
      String sourceName = body.get("source");

      if (newName == null || newName.isEmpty()) {
        ctx.status(400).result("New database name is required");
        return;
      }

      // Check if target database already exists
      List<String> existingDbs = databaseContext.listDatabases();
      if (existingDbs.contains(newName)) {
        ctx.status(409).result("Database already exists");
        return;
      }

      if (sourceName == null || sourceName.isEmpty()) {
        sourceName = databaseContext.getCurrentDatabaseName();
      } else if (!existingDbs.contains(sourceName)) {
        ctx.status(404).result("Source database not found");
        return;
      }

      databaseContext.copyDatabase(sourceName, newName);

      ctx.json(databaseContext.getDatabaseStats(newName));
    } catch (Exception e) {
      logger.error("Error copying database", e);
      ctx.status(500).result("Error copying database: " + e.getMessage());
    }
  }

  private void resetDatabase(Context ctx) {
    try {
      Map<String, String> body = ctx.bodyAsClass(Map.class);
      String requestedName = body != null ? body.get("name") : null;
      String name = requestedName;

      if (name == null || name.isEmpty()) {
        name = databaseContext.getCurrentDatabaseName();
      }

      logger.info("Resetting database: {} (Requested: {})", name, requestedName);
      databaseContext.resetDatabaseToFactory(name);
      ctx.json(databaseContext.getDatabaseStats(name));
    } catch (Exception e) {
      logger.error("Error resetting database", e);
      ctx.status(500).result("Error resetting database: " + e.getMessage());
    }
  }

  private void deleteDatabase(Context ctx) {
    try {
      Map<String, String> body = ctx.bodyAsClass(Map.class);
      String name = body.get("name");
      if (name == null || name.isEmpty()) {
        ctx.status(400).result("Database name is required");
        return;
      }

      String current = databaseContext.getCurrentDatabaseName();
      if (name.equals(current)) {
        ctx.status(400).result("Cannot delete the active database");
        return;
      }

      databaseContext.deleteDatabase(name);
      ctx.status(204);
    } catch (Exception e) {
      logger.error("Error deleting database", e);
      ctx.status(500).result("Error deleting database: " + e.getMessage());
    }
  }

  private void getCurrentDatabase(Context ctx) {
    String current = databaseContext.getCurrentDatabaseName();
    ctx.json(databaseContext.getDatabaseStats(current));
  }

  private void exportDatabase(Context ctx) {
    String name = ctx.pathParam("name");
    ctx.header("Content-Disposition", "attachment; filename=\"" + name + ".zip\"");
    ctx.contentType("application/zip");
    try {
      databaseContext.exportDatabase(name, ctx.res.getOutputStream());
    } catch (Exception e) {
      logger.error("Error exporting database", e);
      ctx.status(500).result("Error exporting database: " + e.getMessage());
    }
  }

  private void importDatabase(Context ctx) {
    try {
      String name = ctx.formParam("name");
      UploadedFile file = ctx.uploadedFile("file");

      if (name == null || name.isEmpty() || file == null) {
        ctx.status(400).result("Name and file are required");
        return;
      }

      // Check if database already exists
      if (databaseContext.listDatabases().contains(name)) {
        ctx.status(409).result("Database already exists");
        return;
      }

      databaseContext.importDatabase(name, file.getContent());
      ctx.json(databaseContext.getDatabaseStats(name));
    } catch (Exception e) {
      logger.error("Error importing database", e);
      ctx.status(500).result("Error importing database: " + e.getMessage());
    }
  }

  // --- Existing Handlers Refactored ---

  private void createDriver(Context ctx) {
    try {
      Driver driver = bodyAsClassWithId(ctx.body(), Driver.class);
      MongoCollection<Driver> col = getDriverCollection();

      // Uniqueness check
      Driver existing =
          col.find(
                  Filters.or(
                      Filters.eq("name", driver.getName()),
                      Filters.eq("nickname", driver.getNickname())))
              .first();

      if (existing != null) {
        ctx.status(409).result("Driver name or nickname already exists");
        return;
      }

      if (driver.getEntityId() == null
          || driver.getEntityId().isEmpty()
          || "new".equals(driver.getEntityId())) {
        String nextId = getNextSequence("drivers");
        driver =
            new Driver(
                driver.getName(),
                driver.getNickname(),
                driver.getAvatarUrl(),
                driver.getLapAudio(),
                driver.getBestLapAudio(),
                driver.getPenaltyAudio(),
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                nextId,
                null);
      }
      col.insertOne(driver);
      ctx.status(201).json(driver);
    } catch (Exception e) {
      logger.error("Error creating driver", e);
      ctx.status(500).result("Error creating driver: " + e.getMessage());
    }
  }

  private void updateDriver(Context ctx) {
    try {
      String id = ctx.pathParam("id");
      Driver driver = bodyAsClassWithId(ctx.body(), Driver.class);
      MongoCollection<Driver> col = getDriverCollection();

      Driver existing =
          col.find(
                  Filters.and(
                      Filters.ne("entity_id", id),
                      Filters.or(
                          Filters.eq("name", driver.getName()),
                          Filters.eq("nickname", driver.getNickname()))))
              .first();

      if (existing != null) {
        ctx.status(409).result("Driver name or nickname already exists");
        return;
      }

      col.replaceOne(Filters.eq("entity_id", id), driver);
      ctx.json(driver);
    } catch (Exception e) {
      logger.error("Error updating driver", e);
      ctx.status(500).result("Error updating driver: " + e.getMessage());
    }
  }

  private void deleteDriver(Context ctx) {
    try {
      String id = ctx.pathParam("id");
      getDriverCollection().deleteOne(Filters.eq("entity_id", id));
      ctx.status(204);
    } catch (Exception e) {
      logger.error("Error deleting driver", e);
      ctx.status(500).result("Error deleting driver: " + e.getMessage());
    }
  }

  private void getTeams(Context ctx) {
    List<Team> teams = new ArrayList<>();
    getTeamCollection().find().forEach(teams::add);
    ctx.json(teams);
  }

  private void createTeam(Context ctx) {
    try {
      Team team = bodyAsClassWithId(ctx.body(), Team.class);
      team = createTeam(team);
      ctx.status(201).json(team);
    } catch (IllegalArgumentException e) {
      ctx.status(409).result(e.getMessage());
    } catch (Exception e) {
      logger.error("Error creating team", e);
      ctx.status(500).result("Error creating team: " + e.getMessage());
    }
  }

  public Team createTeam(Team team) {
    MongoCollection<Team> col = getTeamCollection();

    // Uniqueness check
    Team existing = col.find(Filters.eq("name", team.getName())).first();

    if (existing != null) {
      throw new IllegalArgumentException("Team name already exists");
    }

    if (team.getEntityId() == null
        || team.getEntityId().isEmpty()
        || "new".equals(team.getEntityId())) {
      String nextId = getNextSequence("teams");
      team = new Team(team.getName(), team.getAvatarUrl(), team.getDriverIds(), nextId, null);
    }
    col.insertOne(team);
    return team;
  }

  private void updateTeam(Context ctx) {
    try {
      String id = ctx.pathParam("id");
      Team team = bodyAsClassWithId(ctx.body(), Team.class);
      updateTeam(id, team);
      ctx.json(team);
    } catch (IllegalArgumentException e) {
      ctx.status(409).result(e.getMessage());
    } catch (Exception e) {
      logger.error("Error updating team", e);
      ctx.status(500).result("Error updating team: " + e.getMessage());
    }
  }

  public Team updateTeam(String id, Team team) {
    MongoCollection<Team> col = getTeamCollection();

    Team existing =
        col.find(Filters.and(Filters.ne("entity_id", id), Filters.eq("name", team.getName())))
            .first();

    if (existing != null) {
      throw new IllegalArgumentException("Team name or nickname already exists");
    }

    // Preservation of IDs is handled by maintaining original entity_id
    // However, we construct a new object to ensure it has the correct ID
    team = new Team(team.getName(), team.getAvatarUrl(), team.getDriverIds(), id, team.getId());

    UpdateResult result = col.replaceOne(Filters.eq("entity_id", id), team);
    if (result.getMatchedCount() == 0) {
      // throw new IllegalArgumentException("Team not found"); // Optional depending
      // on requirement
    }
    return team;
  }

  private void deleteTeam(Context ctx) {
    try {
      String id = ctx.pathParam("id");
      deleteTeam(id);
      ctx.status(204);
    } catch (Exception e) {
      logger.error("Error deleting team", e);
      ctx.status(500).result("Error deleting team: " + e.getMessage());
    }
  }

  public void deleteTeam(String id) {
    getTeamCollection().deleteOne(Filters.eq("entity_id", id));
  }

  private void createTrack(Context ctx) {
    try {
      Track track = bodyAsClassWithId(ctx.body(), Track.class);
      MongoCollection<Track> col = getTrackCollection();

      Track existing = col.find(Filters.eq("name", track.getName())).first();

      if (existing != null) {
        ctx.status(409).result("Track name already exists");
        return;
      }

      if (track.getEntityId() == null
          || track.getEntityId().isEmpty()
          || "new".equals(track.getEntityId())) {
        String nextId = getNextSequence("tracks");
        track =
            new Track(
                track.getName(),
<<<<<<< HEAD
                track.getNumTrackSections(),
                track.getLanes(),
                track.getArduinoConfigs(),
=======
                track.getLanes(),
                track.getArduinoConfigs(),
                track.getGeolocation(),
>>>>>>> a2c1c14a (feat(analytics): add race report metadata and optimize server startup)
                nextId,
                null);
      }
      col.insertOne(track);
      ctx.status(201).json(track);
    } catch (Exception e) {
      logger.error("Error creating track", e);
      ctx.status(500).result("Error creating track: " + e.getMessage());
    }
  }

  private void updateTrack(Context ctx) {
    try {
      String id = ctx.pathParam("id");
      Track track = bodyAsClassWithId(ctx.body(), Track.class);
      MongoCollection<Track> col = getTrackCollection();

      Track existing =
          col.find(Filters.and(Filters.ne("entity_id", id), Filters.eq("name", track.getName())))
              .first();

      if (existing != null) {
        ctx.status(409).result("Track name already exists");
        return;
      }

      track =
          new Track(
              track.getName(),
<<<<<<< HEAD
              track.getNumTrackSections(),
              track.getLanes(),
              track.getArduinoConfigs(),
=======
              track.getLanes(),
              track.getArduinoConfigs(),
              track.getGeolocation(),
>>>>>>> a2c1c14a (feat(analytics): add race report metadata and optimize server startup)
              id,
              track.getId());

      logger.debug("updateTrack for {}", id);
      if (track.getArduinoConfigs() != null && !track.getArduinoConfigs().isEmpty()) {
        logger.debug(
            "Saving config with Digitals: {}", track.getArduinoConfigs().get(0).digitalIds);
      } else {
        logger.debug("Saving configs is NULL or empty");
      }

      col.replaceOne(Filters.eq("entity_id", id), track);
      ctx.json(track);
    } catch (Exception e) {
      e.printStackTrace();
      ctx.status(500).result("Error updating track: " + e.getMessage());
    }
  }

  private void deleteTrack(Context ctx) {
    try {
      String id = ctx.pathParam("id");
      getTrackCollection().deleteOne(Filters.eq("entity_id", id));
      ctx.status(204);
    } catch (Exception e) {
      logger.error("Error deleting track", e);
      ctx.status(500).result("Error deleting track: " + e.getMessage());
    }
  }

  public void handleCreateRace(Context ctx) {
    try {
      Race race = bodyAsClassWithId(ctx.body(), Race.class);
      try {
        validateRace(race);
        Race created = createRace(race);
        ctx.status(201).json(created);
      } catch (IllegalArgumentException e) {
        ctx.status(400).result(e.getMessage());
      }
    } catch (Exception e) {
      logger.error("Error creating race", e);
      ctx.status(500).result("Error creating race: " + e.getMessage());
    }
  }

  public Race createRace(Race race) {
    MongoCollection<Race> col = getRaceCollection();

    // Uniqueness check
    Race existing = col.find(Filters.eq("name", race.getName())).first();
    if (existing != null) {
      throw new IllegalArgumentException("Race name already exists");
    }

    if (race.getEntityId() == null
        || race.getEntityId().isEmpty()
        || "new".equals(race.getEntityId())) {
      String nextId = getNextSequence("races");
      race =
          new Race.Builder()
              .withName(race.getName())
              .withTrackEntityId(race.getTrackEntityId())
              .withHeatRotationType(race.getHeatRotationType())
              .withHeatScoring(race.getHeatScoring())
              .withOverallScoring(race.getOverallScoring())
              .withMinLapTime(race.getMinLapTime())
              .withFuelOptions(race.getFuelOptions())
              .withDigitalFuelOptions(race.getDigitalFuelOptions())
              .withTeamOptions(race.getTeamOptions())
              .withAutoAdvanceTime(race.getAutoAdvanceTime())
              .withAutoStartTime(race.getAutoStartTime())
              .withAutoAdvanceWarmupTime(race.getAutoAdvanceWarmupTime())
              .withAutoStartWarmupTime(race.getAutoStartWarmupTime())
              .withDriftTime(race.getDriftTime())
              .withStartTime(race.getStartTime())
              .withRestartTime(race.getRestartTime())
              .withStartDelay(race.getStartDelay())
              .withRestartDelay(race.getRestartDelay())
              .withSoloLaneIndex(race.getSoloLaneIndex())
              .withCustomRotationSequence(race.getCustomRotationSequence())
              .withCustomRotationAssetId(race.getCustomRotationAssetId())
              .withCustomRotations(race.getCustomRotations())
              .withHeatTimesThrough(race.getHeatTimesThrough())
              .withReverseHeats(race.isReverseHeats())
              .withHotStart(race.isHotStart())
              .withRestartOnFalseStart(race.isRestartOnFalseStart())
              .withFalseStartLapPenalty(race.getFalseStartLapPenalty())
              .withFalseStartTimePenalty(race.getFalseStartTimePenalty())
              .withEntityId(nextId)
              .build();
    }
    col.insertOne(race);
    return race;
  }

  public void handleUpdateRace(Context ctx) {
    try {
      String id = ctx.pathParam("id");
      String body = ctx.body();
      Race race = bodyAsClassWithId(body, Race.class);
      try {
        validateRace(race);
        Race updated = updateRace(id, race);
        ctx.json(updated);
      } catch (IllegalArgumentException e) {
        if ("Race not found".equals(e.getMessage())) {
          ctx.status(404).result(e.getMessage());
        } else {
          ctx.status(400).result(e.getMessage());
        }
      }
    } catch (Exception e) {
      logger.error("Error updating race", e);
      ctx.status(500).result("Error updating race: " + e.getMessage());
    }
  }

  public Race updateRace(String id, Race race) {
    MongoCollection<Race> col = getRaceCollection();

    Race existing =
        col.find(Filters.and(Filters.ne("entity_id", id), Filters.eq("name", race.getName())))
            .first();

    if (existing != null) {
      throw new IllegalArgumentException("Race name already exists");
    }

    race =
        new Race.Builder()
            .withName(race.getName())
            .withTrackEntityId(race.getTrackEntityId())
            .withHeatRotationType(race.getHeatRotationType())
            .withHeatScoring(race.getHeatScoring())
            .withOverallScoring(race.getOverallScoring())
            .withMinLapTime(race.getMinLapTime())
            .withFuelOptions(race.getFuelOptions())
            .withDigitalFuelOptions(race.getDigitalFuelOptions())
            .withTeamOptions(race.getTeamOptions())
            .withAutoAdvanceTime(race.getAutoAdvanceTime())
            .withAutoStartTime(race.getAutoStartTime())
            .withAutoAdvanceWarmupTime(race.getAutoAdvanceWarmupTime())
            .withAutoStartWarmupTime(race.getAutoStartWarmupTime())
            .withDriftTime(race.getDriftTime())
            .withStartTime(race.getStartTime())
            .withRestartTime(race.getRestartTime())
            .withStartDelay(race.getStartDelay())
            .withRestartDelay(race.getRestartDelay())
            .withSoloLaneIndex(race.getSoloLaneIndex())
            .withCustomRotationSequence(race.getCustomRotationSequence())
            .withCustomRotationAssetId(race.getCustomRotationAssetId())
            .withCustomRotations(race.getCustomRotations())
            .withHeatTimesThrough(race.getHeatTimesThrough())
            .withReverseHeats(race.isReverseHeats())
            .withHotStart(race.isHotStart())
            .withRestartOnFalseStart(race.isRestartOnFalseStart())
            .withFalseStartLapPenalty(race.getFalseStartLapPenalty())
            .withFalseStartTimePenalty(race.getFalseStartTimePenalty())
            .withEntityId(id)
            .withId(race.getId())
            .build();
    UpdateResult result = col.replaceOne(Filters.eq("entity_id", id), race);
    if (result.getMatchedCount() == 0) {
      throw new IllegalArgumentException("Race not found");
    }
    return race;
  }

  public void handleDeleteRace(Context ctx) {
    try {
      String id = ctx.pathParam("id");
      try {
        deleteRace(id);
        ctx.status(204);
      } catch (IllegalArgumentException e) {
        ctx.status(404).result(e.getMessage());
      }
    } catch (Exception e) {
      logger.error("Error deleting race", e);
      ctx.status(500).result("Error deleting race: " + e.getMessage());
    }
  }

  public void deleteRace(String id) {
    // Perform cascading deletion of associated data (history, stats, saves)
    DatabaseService.getInstance().deleteAllRaceData(databaseContext.getDatabase(), id);

    DeleteResult result = getRaceCollection().deleteOne(Filters.eq("entity_id", id));
    if (result.getDeletedCount() == 0) {
      throw new IllegalArgumentException("Race not found");
    }
  }

  private String getNextSequence(String collectionName) {
    MongoCollection<Document> counters = databaseContext.getDatabase().getCollection("counters");
    Document counter =
        counters.findOneAndUpdate(
            Filters.eq("_id", collectionName),
            Updates.inc("seq", 1),
            new FindOneAndUpdateOptions().upsert(true).returnDocument(ReturnDocument.AFTER));
    return String.valueOf(counter.getInteger("seq"));
  }

  public void getDrivers(Context ctx) {
    List<Driver> drivers = new ArrayList<>();
    getDriverCollection().find().forEach(drivers::add);
    ctx.json(drivers);
  }

  public void getTracks(Context ctx) {
    List<Track> tracks = new ArrayList<>();
    getTrackCollection().find().forEach(tracks::add);
    ctx.json(tracks);
  }

  private void getFactoryTrack(Context ctx) {
    ctx.json(DatabaseService.getInstance().getFactoryTrack());
  }

  public void getRaces(Context ctx) {
    List<Race> races = new ArrayList<>();
    getRaceCollection().find().forEach(races::add);

    List<Map<String, Object>> response = new ArrayList<>();
    for (Race race : races) {
      Track track =
          getTrackCollection().find(Filters.eq("entity_id", race.getTrackEntityId())).first();
      Map<String, Object> raceMap = new HashMap<>();
      raceMap.put("name", race.getName());
      raceMap.put("entity_id", race.getEntityId());
      raceMap.put("track", track);
      raceMap.put("track_entity_id", race.getTrackEntityId());
      raceMap.put("heat_rotation_type", race.getHeatRotationType());
      raceMap.put("heat_scoring", race.getHeatScoring());
      raceMap.put("overall_scoring", race.getOverallScoring());
      raceMap.put("min_lap_time", race.getMinLapTime());
      raceMap.put("fuel_options", race.getFuelOptions());
      raceMap.put("digital_fuel_options", race.getDigitalFuelOptions());
      raceMap.put("team_options", race.getTeamOptions());
      raceMap.put("auto_advance_time", race.getAutoAdvanceTime());
      raceMap.put("auto_start_time", race.getAutoStartTime());
      raceMap.put("auto_advance_warmup_time", race.getAutoAdvanceWarmupTime());
      raceMap.put("auto_start_warmup_time", race.getAutoStartWarmupTime());
      raceMap.put("drift_time", race.getDriftTime());
      raceMap.put("start_time", race.getStartTime());
      raceMap.put("restart_time", race.getRestartTime());
      raceMap.put("start_delay", race.getStartDelay());
      raceMap.put("restart_delay", race.getRestartDelay());
      raceMap.put("solo_lane_index", race.getSoloLaneIndex());
      raceMap.put("custom_rotation_asset_id", race.getCustomRotationAssetId());
      raceMap.put("custom_rotation_sequence", race.getCustomRotationSequence());
      raceMap.put("custom_rotations", race.getCustomRotations());
      raceMap.put("heat_times_through", race.getHeatTimesThrough());
      raceMap.put("reverse_heats", race.isReverseHeats());
      raceMap.put("hot_start", race.isHotStart());
      raceMap.put("restart_on_false_start", race.isRestartOnFalseStart());
      raceMap.put("false_start_lap_penalty", race.getFalseStartLapPenalty());
      raceMap.put("false_start_time_penalty", race.getFalseStartTimePenalty());

      // Fetch driver_ids directly from the document to avoid modifying the Race POJO
      Document raceDoc = getRaceCollection().find(Filters.eq("entity_id", race.getEntityId()), Document.class).first();
      if (raceDoc != null && raceDoc.containsKey("driver_ids")) {
        raceMap.put("driver_ids", raceDoc.get("driver_ids"));
      }
      response.add(raceMap);
    }
    ctx.json(response);
  }

  public void generateHeats(Context ctx) {
    String raceId = ctx.pathParam("id");
    Map<String, Number> body = ctx.bodyAsClass(Map.class);
    Number driverCountNum = body.get("driverCount");
    int driverCount = driverCountNum != null ? driverCountNum.intValue() : 0;

    if (driverCount <= 0) {
      ctx.status(400).result("driverCount must be greater than 0");
      return;
    }

    // Find the race
    Race race = getRaceCollection().find(Filters.eq("entity_id", raceId)).first();
    if (race == null) {
      ctx.status(404).result("Race not found");
      return;
    }

    // Find the track to get lane count
    Track track =
        getTrackCollection().find(Filters.eq("entity_id", race.getTrackEntityId())).first();
    if (track == null) {
      ctx.status(404).result("Track not found for race");
      return;
    }

    // Get real drivers from the database
    List<Driver> realDrivers = new ArrayList<>();
    getDriverCollection().find().forEach(realDrivers::add);

    // Create RaceParticipant list using real drivers
    List<RaceParticipant> participants = new ArrayList<>();
    for (int i = 0; i < driverCount; i++) {
      Driver driver;
      if (i < realDrivers.size()) {
        driver = realDrivers.get(i);
      } else {
        driver = new Driver("Driver " + (i + 1), "Driver " + (i + 1));
      }
      participants.add(new RaceParticipant(driver));
    }

    // Create a temporary Race object for heat building
    com.antigravity.race.Race tempRace = // fqn-collision
        new com.antigravity.race.Race.Builder() // fqn-collision
            .model(race)
            .drivers(participants)
            .track(track)
            .isDemoMode(true) // Use demo mode to avoid protocol initialization
            .build();

    // Get the generated heats
    List<Heat> heats = tempRace.getHeats();

    // Convert heats to JSON response
    List<Map<String, Object>> heatList = new ArrayList<>();
    for (Heat heat : heats) {
      Map<String, Object> heatMap = new HashMap<>();
      heatMap.put("heatNumber", heat.getHeatNumber());

      List<Map<String, Object>> lanes = new ArrayList<>();
      List<DriverHeatData> drivers = heat.getDrivers();
      for (int laneIdx = 0; laneIdx < drivers.size(); laneIdx++) {
        DriverHeatData driverData = drivers.get(laneIdx);
        Map<String, Object> laneMap = new HashMap<>();
        laneMap.put("laneNumber", laneIdx + 1);
        laneMap.put("driverNumber", driverData.getDriver().getSeed());

        // Add lane colors from track
        if (laneIdx < track.getLanes().size()) {
          Lane lane = track.getLanes().get(laneIdx);
          laneMap.put("backgroundColor", lane.getBackground_color());
          laneMap.put("foregroundColor", lane.getForeground_color());
        }

        lanes.add(laneMap);
      }
      heatMap.put("lanes", lanes);
      heatList.add(heatMap);
    }

    Map<String, Object> response = new HashMap<>();
    response.put("heats", heatList);
    ctx.json(response);

    // Clean up the temporary race object
    tempRace.stop();
  }

  public void previewHeats(Context ctx) {
    Map<String, Object> body = ctx.bodyAsClass(Map.class);
    Number driverCountNum = (Number) body.get("driverCount");
    int driverCount = driverCountNum != null ? driverCountNum.intValue() : 0;
    String trackId = (String) body.get("trackId");
    String rotationType = (String) body.get("rotationType");
    logger.debug("previewHeats: body={}", body);
    Number soloLaneIndexNum = (Number) body.get("soloLaneIndex");
    int soloLaneIndex = soloLaneIndexNum != null ? soloLaneIndexNum.intValue() : 0;
    List<Integer> customRotationSequence = (List<Integer>) body.get("customRotationSequence");
    if (customRotationSequence == null) {
      customRotationSequence = (List<Integer>) body.get("custom_rotation_sequence");
    }

    String customRotationAssetId = (String) body.get("custom_rotation_asset_id");
    if (customRotationAssetId == null) {
      customRotationAssetId = (String) body.get("customRotationAssetId");
    }

    List<CustomRotation> customRotations = null;
    if (customRotationAssetId != null && !customRotationAssetId.isEmpty()) {
      customRotations = resolveCustomRotations(customRotationAssetId);
    } else {
      // Fallback to manual list if provided
      List<Map<String, Object>> customRotationsRaw =
          (List<Map<String, Object>>) body.get("custom_rotations");
      if (customRotationsRaw == null) {
        customRotationsRaw = (List<Map<String, Object>>) body.get("customRotations");
      }
      if (customRotationsRaw != null) {
        customRotations = parseCustomRotations(customRotationsRaw);
      }
    }

    Number heatTimesThroughNum = (Number) body.get("heatTimesThrough");
    if (heatTimesThroughNum == null) {
      heatTimesThroughNum = (Number) body.get("heat_times_through");
    }
    int heatTimesThrough = heatTimesThroughNum != null ? heatTimesThroughNum.intValue() : 1;

    Boolean reverseHeats = (Boolean) body.get("reverseHeats");
    if (reverseHeats == null) {
      reverseHeats = (Boolean) body.get("reverse_heats");
    }
    boolean reverseHeatsBool = reverseHeats != null ? reverseHeats : false;

    if (driverCount <= 0) {
      ctx.status(400).result("driverCount must be greater than 0");
      return;
    }

    if (trackId == null || trackId.isEmpty()) {
      ctx.status(400).result("trackId is required");
      return;
    }

    if (rotationType == null || rotationType.isEmpty()) {
      ctx.status(400).result("rotationType is required");
      return;
    }

    // Find the track to get lane count
    Track track = getTrackCollection().find(Filters.eq("entity_id", trackId)).first();
    if (track == null) {
      ctx.status(404).result("Track not found");
      return;
    }

    // Convert rotation type string to enum
    HeatRotationType rotationTypeEnum;
    try {
      rotationTypeEnum = HeatRotationType.valueOf(rotationType);
      if (rotationTypeEnum == HeatRotationType.CustomRoundRobin) {
        if (customRotationSequence == null || customRotationSequence.isEmpty()) {
          ctx.status(400).result("Custom rotation sequence is required");
          return;
        }
        int numLanes = track.getLanes().size();
        Set<Integer> uniqueLanes = new HashSet<>();
        for (Integer lane : customRotationSequence) {
          if (lane == null || lane < 0) {
            ctx.status(400).result("Lane numbers must be greater than or equal to 0 and not null");
            return;
          }
          if (lane > numLanes) {
            ctx.status(400)
                .result("Lane number " + lane + " exceeds track lane count (" + numLanes + ")");
            return;
          }
          if (lane > 0 && !uniqueLanes.add(lane)) {
            ctx.status(400)
                .result("Lane number " + lane + " appears more than once in rotation sequence");
            return;
          }
        }
      }
    } catch (IllegalArgumentException e) {
      ctx.status(400).result("Invalid rotation type: " + rotationType);
      return;
    }

    // Create a default HeatScoring and OverallScoring for heat generation preview
    HeatScoring defaultHeatScoring =
        new HeatScoring(
            HeatScoring.FinishMethod.Lap,
            10, // default 10 laps
            HeatScoring.HeatRanking.LAP_COUNT,
            HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME);
    OverallScoring defaultOverallScoring = new OverallScoring();

    // Create a temporary race configuration
    Race tempRaceConfig =
        new Race.Builder()
            .withName("Preview")
            .withTrackEntityId(trackId)
            .withHeatRotationType(rotationTypeEnum)
            .withHeatScoring(defaultHeatScoring)
            .withOverallScoring(defaultOverallScoring)
            .withAutoAdvanceTime(0.0)
            .withAutoStartTime(0.0)
            .withAutoAdvanceWarmupTime(0.0)
            .withAutoStartWarmupTime(0.0)
            .withSoloLaneIndex(soloLaneIndex)
            .withCustomRotationSequence(customRotationSequence)
            .withCustomRotationAssetId(customRotationAssetId)
            .withHeatTimesThrough(heatTimesThrough)
            .withReverseHeats(reverseHeatsBool)
            .build();

    // Create mock RaceParticipant list
    List<RaceParticipant> mockDrivers = new ArrayList<>();
    for (int i = 0; i < driverCount; i++) {
      Driver mockDriver = new Driver("Driver " + (i + 1), "Driver " + (i + 1));
      mockDrivers.add(new RaceParticipant(mockDriver));
    }

    // Create a temporary Race object for heat building
    com.antigravity.race.Race tempRace = // fqn-collision
        new com.antigravity.race.Race.Builder() // fqn-collision
            .model(tempRaceConfig)
            .customRotations(customRotations)
            .drivers(mockDrivers)
            .track(track)
            .isDemoMode(true) // Use demo mode to avoid protocol initialization
            .build();

    // Get the generated heats
    List<Heat> heats = tempRace.getHeats();

    // Convert heats to JSON response
    List<Map<String, Object>> heatList = new ArrayList<>();
    for (Heat heat : heats) {
      Map<String, Object> heatMap = new HashMap<>();
      heatMap.put("heatNumber", heat.getHeatNumber());

      List<Map<String, Object>> lanes = new ArrayList<>();
      List<DriverHeatData> drivers = heat.getDrivers();
      for (int laneIdx = 0; laneIdx < drivers.size(); laneIdx++) {
        DriverHeatData driverData = drivers.get(laneIdx);
        Map<String, Object> laneMap = new HashMap<>();
        laneMap.put("laneNumber", laneIdx + 1);
        laneMap.put("driverNumber", driverData.getDriver().getSeed());

        // Add lane colors from track
        if (laneIdx < track.getLanes().size()) {
          Lane lane = track.getLanes().get(laneIdx);
          laneMap.put("backgroundColor", lane.getBackground_color());
          laneMap.put("foregroundColor", lane.getForeground_color());
        }

        lanes.add(laneMap);
      }
      heatMap.put("lanes", lanes);
      heatList.add(heatMap);
    }

    Map<String, Object> response = new HashMap<>();
    response.put("heats", heatList);
    ctx.json(response);

    // Clean up the temporary race object
    tempRace.stop();
  }

  private <T> T bodyAsClassWithId(String body, Class<T> clazz) throws Exception {
    if (body != null && !body.contains("\"@id\"")) {
      body = body.replaceFirst("\\{", "{\"@id\":1,");
    }
    ObjectMapper mapper = new ObjectMapper();
    SimpleModule module = new SimpleModule();
    module.addDeserializer(
        ObjectId.class,
        new JsonDeserializer<ObjectId>() {
          @Override
          public ObjectId deserialize(JsonParser p, DeserializationContext ctxt)
              throws IOException {
            String value = p.getValueAsString();
            if (value == null || value.isEmpty()) {
              return null;
            }
            try {
              return new ObjectId(value);
            } catch (IllegalArgumentException e) {
              return null;
            }
          }
        });
    mapper.registerModule(module);
    return mapper.readValue(body, clazz);
  }

  private void getRaceHistoryList(Context ctx) {
    try {
      boolean isDemo = "true".equals(ctx.queryParam("demo"));
      System.out.println("Fetching race history list. Demo Mode: " + isDemo);
      DatabaseService dbService = DatabaseService.getInstance();
      List<RaceHistoryRecord> allHistory = new ArrayList<>();
      
      List<String> dbs = databaseContext.listDatabases();
      System.out.println("Found databases: " + String.join(", ", dbs));
      for (String dbName : dbs) {
        if ("admin".equals(dbName) || "local".equals(dbName) || "config".equals(dbName)) {
          continue;
        }
        MongoDatabase db = databaseContext.getMongoClient().getDatabase(dbName);
        List<RaceHistoryRecord> history = dbService.getRaceHistory(db, isDemo);
        for (RaceHistoryRecord record : history) {
          record.setDatabaseName(dbName);
        }
        allHistory.addAll(history);
      }
      ctx.json(allHistory);
    } catch (Exception e) {
      e.printStackTrace();
      ctx.status(500).result("Error fetching race history list: " + e.getMessage());
    }
  }

  private void getRaceHistoryById(Context ctx) {
    try {
      String id = ctx.pathParam("id");
      boolean isDemo = "true".equals(ctx.queryParam("demo"));
      DatabaseService dbService = DatabaseService.getInstance();
      RaceHistoryRecord history =
          dbService.getRaceHistoryById(databaseContext.getDatabase(), id, isDemo);
      if (history == null) {
        ctx.status(404).result("Race history not found");
        return;
      }
      ctx.json(history);
    } catch (Exception e) {
      e.printStackTrace();
      ctx.status(500).result("Error fetching race history: " + e.getMessage());
    }
  }

  private void exportRaceHistoryCsv(Context ctx) {
    try {
      String id = ctx.pathParam("id");
      boolean isDemo = "true".equals(ctx.queryParam("demo"));
      DatabaseService dbService = DatabaseService.getInstance();
      RaceHistoryRecord history =
          dbService.getRaceHistoryById(databaseContext.getDatabase(), id, isDemo);
      if (history == null) {
        ctx.status(404).result("Race history not found");
        return;
      }

      com.antigravity.race.Race tempRace = // fqn-collision
          new com.antigravity.race.Race.Builder() // fqn-collision
              .model(history.getModel())
              .track(history.getTrack())
              .drivers(history.getDrivers())
              .heats(history.getHeats())
              .accumulatedRaceTime(history.getAccumulatedRaceTime())
              .statistics(history.getStatistics())
              .build();

      String csvContent = CsvExporter.export(tempRace);

      String raceName =
          history.getModel() != null ? history.getModel().getName() : "Historical_Race";
      String filename =
          raceName.replaceAll("[^a-zA-Z0-9.-]", "_") + "_" + System.currentTimeMillis() + ".csv";
      ctx.header("Content-Disposition", "attachment; filename=\"" + filename + "\"");
      ctx.contentType("text/csv");
      ctx.result(csvContent);

    } catch (Exception e) {
      e.printStackTrace();
      ctx.status(500).result("Error exporting race history: " + e.getMessage());
    }
  }

  private void getGlobalStatistics(Context ctx) {
    try {
      boolean isDemo = "true".equals(ctx.queryParam("demo"));
      DatabaseService dbService = DatabaseService.getInstance();
      GlobalStatistics stats =
          dbService.getGlobalStatistics(databaseContext.getDatabase(), "global", isDemo);
      ctx.json(stats);
    } catch (Exception e) {
      e.printStackTrace();
      ctx.status(500).result("Error fetching global statistics: " + e.getMessage());
    }
  }

  private void validateRace(Race race) {
    if (race.getHeatRotationType() == HeatRotationType.CustomRoundRobin) {
      List<Integer> seq = race.getCustomRotationSequence();
      if (seq == null || seq.isEmpty()) {
        throw new IllegalArgumentException("Custom rotation sequence is required");
      }
      Track track =
          getTrackCollection().find(Filters.eq("entity_id", race.getTrackEntityId())).first();
      int numLanes = track != null ? track.getLanes().size() : Integer.MAX_VALUE;

      Set<Integer> uniqueLanes = new HashSet<>();
      for (Integer lane : seq) {
        if (lane == null || lane < 0) {
          throw new IllegalArgumentException(
              "Lane numbers must be greater than or equal to 0 and not null");
        }
        if (lane > numLanes) {
          throw new IllegalArgumentException(
              "Lane number " + lane + " exceeds track lane count (" + numLanes + ")");
        }
        if (lane > 0 && !uniqueLanes.add(lane)) {
          throw new IllegalArgumentException(
              "Lane number " + lane + " appears more than once in rotation sequence");
        }
      }
    } else if (race.getHeatRotationType() == HeatRotationType.Custom) {
      String assetId = race.getCustomRotationAssetId();
      if (assetId == null || assetId.isEmpty()) {
        throw new IllegalArgumentException("Custom rotation asset is required");
      }
      List<CustomRotation> rotations = resolveCustomRotations(assetId);
      if (rotations == null || rotations.isEmpty()) {
        throw new IllegalArgumentException("Custom rotation asset not found or empty");
      }
      Track track =
          getTrackCollection().find(Filters.eq("entity_id", race.getTrackEntityId())).first();
      int numLanes = track != null ? track.getLanes().size() : 0;

      Set<Integer> driverCounts = new HashSet<>();
      for (CustomRotation rot : rotations) {
        if (rot.getNumDrivers() <= 0) {
          throw new IllegalArgumentException("Driver count must be greater than 0");
        }
        if (!driverCounts.add(rot.getNumDrivers())) {
          throw new IllegalArgumentException(
              "Duplicate driver count in custom rotations: " + rot.getNumDrivers());
        }
        if (rot.getHeats() == null || rot.getHeats().isEmpty()) {
          throw new IllegalArgumentException(
              "At least one heat is required for custom rotation with "
                  + rot.getNumDrivers()
                  + " drivers");
        }
        for (CustomHeat heat : rot.getHeats()) {
          if (heat.getDriverIndices().size() != numLanes) {
            throw new IllegalArgumentException(
                "Heat must specify "
                    + numLanes
                    + " driver indices for a "
                    + numLanes
                    + " lane track");
          }
          for (Integer dIdx : heat.getDriverIndices()) {
            if (dIdx < 0 || dIdx > rot.getNumDrivers()) {
              throw new IllegalArgumentException(
                  "Invalid driver index "
                      + dIdx
                      + " for custom rotation with "
                      + rot.getNumDrivers()
                      + " drivers");
            }
          }
        }
      }
    }
  }

  private List<CustomRotation> resolveCustomRotations(String assetId) {
    if (assetId == null || assetId.isEmpty()) {
      return null;
    }
    Document doc =
        databaseContext
            .getDatabase()
            .getCollection("assets")
            .find(Filters.eq("_id", assetId))
            .first();
    if (doc == null) {
      return null;
    }

    List<Document> rotationList = (List<Document>) doc.get("custom_rotations");
    return parseCustomRotationsFromDocs(rotationList);
  }

  private List<CustomRotation> parseCustomRotations(List<Map<String, Object>> customRotationsRaw) {
    if (customRotationsRaw == null) {
      return null;
    }
    List<CustomRotation> customRotations = new ArrayList<>();
    for (Map<String, Object> rotMap : customRotationsRaw) {
      Object numDriversObj = rotMap.get("numDrivers");
      if (numDriversObj == null) {
        numDriversObj = rotMap.get("num_drivers");
      }
      int numDrivers = ((Number) numDriversObj).intValue();
      List<Map<String, Object>> heatsRaw = (List<Map<String, Object>>) rotMap.get("heats");
      List<CustomHeat> heats = new ArrayList<>();
      if (heatsRaw != null) {
        for (Map<String, Object> heatMap : heatsRaw) {
          Object driverIndicesObj = heatMap.get("driverIndices");
          if (driverIndicesObj == null) {
            driverIndicesObj = heatMap.get("driver_indices");
          }
          List<Integer> driverIndices = (List<Integer>) driverIndicesObj;
          heats.add(new CustomHeat(driverIndices));
        }
      }
      customRotations.add(new CustomRotation(numDrivers, heats));
    }
    return customRotations;
  }

  private List<CustomRotation> parseCustomRotationsFromDocs(List<Document> rotationList) {
    if (rotationList == null) {
      return null;
    }
    List<CustomRotation> result = new ArrayList<>();
    for (Document rotDoc : rotationList) {
      int numDrivers = rotDoc.getInteger("num_drivers");
      List<CustomHeat> heats = new ArrayList<>();
      List<Document> heatList = (List<Document>) rotDoc.get("heats");
      if (heatList != null) {
        for (Document heatDoc : heatList) {
          heats.add(new CustomHeat((List<Integer>) heatDoc.get("driver_indices")));
        }
      }
      result.add(new CustomRotation(numDrivers, heats));
    }
    return result;
  }

  private void handleDeleteRaceHistory(Context ctx) {
    try {
      String id = ctx.pathParam("id");
      boolean isDemo = "true".equals(ctx.queryParam("demo"));
      String dbName = ctx.queryParam("database");
      
      MongoDatabase db = dbName != null ? databaseContext.getMongoClient().getDatabase(dbName) : databaseContext.getDatabase();
      DatabaseService dbService = DatabaseService.getInstance();
      
      boolean deleted = dbService.deleteRaceHistoryById(db, id, isDemo);
      if (deleted) {
        ctx.status(204);
      } else {
        ctx.status(404).result("Race history not found");
      }
    } catch (Exception e) {
      e.printStackTrace();
      ctx.status(500).result("Error deleting race history: " + e.getMessage());
    }
  }
}
