package com.antigravity.handlers;

import com.antigravity.auth.Role;
import com.antigravity.context.DatabaseContext;
import com.antigravity.models.CustomHeat;
import com.antigravity.models.CustomRotation;
import com.antigravity.models.Driver;
import com.antigravity.models.DriverStatistics;
import com.antigravity.models.GlobalStatistics;
import com.antigravity.models.GroupOptions;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.Lane;
import com.antigravity.models.OverallScoring;
import com.antigravity.models.PredictionEvaluationRecord;
import com.antigravity.models.Race;
import com.antigravity.models.RaceHistoryRecord;
import com.antigravity.models.RacePredictionRecord;
import com.antigravity.models.Team;
import com.antigravity.models.Track;
import com.antigravity.race.ClientSubscriptionManager;
import com.antigravity.race.DriverHeatData;
import com.antigravity.race.Heat;
import com.antigravity.race.RaceParticipant;
import com.antigravity.race.prediction.PredictionEngine;
import com.antigravity.repository.MongoRepository;
import com.antigravity.service.DatabaseService;
import com.antigravity.service.RacePredictionService;
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

@SuppressWarnings("checkstyle:FileLength")
public class DatabaseTaskHandler {

  private static final Logger logger = LoggerFactory.getLogger(DatabaseTaskHandler.class);
  private final DatabaseContext databaseContext;
  private final MongoRepository<Driver> driverRepository;
  private final MongoRepository<Team> teamRepository;
  private final MongoRepository<Track> trackRepository;
  private final MongoRepository<Race> raceRepository;

  public static class RaceResponse {
    @com.fasterxml.jackson.annotation.JsonUnwrapped public Race race;

    @com.fasterxml.jackson.annotation.JsonProperty("track")
    public Track track;

    public RaceResponse(Race race, Track track) {
      this.race = race;
      this.track = track;
    }
  }

  public DatabaseTaskHandler(DatabaseContext databaseContext, Javalin app) {
    this.databaseContext = databaseContext;
    this.driverRepository = new MongoRepository<>(databaseContext, "drivers", Driver.class);
    this.teamRepository = new MongoRepository<>(databaseContext, "teams", Team.class);
    this.trackRepository = new MongoRepository<>(databaseContext, "tracks", Track.class);
    this.raceRepository = new MongoRepository<>(databaseContext, "races", Race.class);

    app.get("/api/drivers", this::getDrivers, Role.VIEWER);
    app.post("/api/drivers", this::createDriver, Role.DIRECTOR);
    app.put("/api/drivers/{id}", this::updateDriver, Role.DIRECTOR);
    app.delete("/api/drivers/{id}", this::deleteDriver, Role.DIRECTOR);
    app.get("/api/tracks", this::getTracks, Role.VIEWER);
    app.get("/api/races", this::getRaces, Role.VIEWER);
    app.get("/api/teams", this::getTeams, Role.VIEWER);
    app.post("/api/teams", this::createTeam, Role.DIRECTOR);
    app.put("/api/teams/{id}", this::updateTeam, Role.DIRECTOR);
    app.delete("/api/teams/{id}", this::deleteTeam, Role.DIRECTOR);

    app.get("/api/tracks/factory-settings", this::getFactoryTrack, Role.VIEWER);

    app.post("/api/tracks", this::createTrack, Role.DIRECTOR);
    app.put("/api/tracks/{id}", this::updateTrack, Role.DIRECTOR);
    app.delete("/api/tracks/{id}", this::deleteTrack, Role.DIRECTOR);

    app.post("/api/races", this::handleCreateRace, Role.DIRECTOR);
    app.put("/api/races/{id}", this::handleUpdateRace, Role.DIRECTOR);
    app.delete("/api/races/{id}", this::handleDeleteRace, Role.DIRECTOR);
    app.post("/api/races/{id}/generate-heats", this::generateHeats, Role.DIRECTOR);
    app.post("/api/heats/preview", this::previewHeats, Role.DIRECTOR);

    // Database Management Endpoints
    app.get("/api/databases", this::listDatabases, Role.ADMIN);
    app.post("/api/databases/switch", this::switchDatabase, Role.ADMIN);
    app.post("/api/databases/create", this::createDatabase, Role.ADMIN);
    app.post("/api/databases/copy", this::copyDatabase, Role.ADMIN);
    app.post("/api/databases/reset", this::resetDatabase, Role.ADMIN);
    app.post("/api/databases/delete", this::deleteDatabase, Role.ADMIN);
    app.get("/api/databases/current", this::getCurrentDatabase, Role.ADMIN);
    app.get("/api/databases/{name}/export", this::exportDatabase, Role.ADMIN);
    app.post("/api/databases/import", this::importDatabase, Role.ADMIN);

    // History Data Endpoints
    app.get("/api/history/races", this::getRaceHistoryList, Role.VIEWER);
    app.get("/api/history/races/{id}", this::getRaceHistoryById, Role.VIEWER);
    app.get("/api/history/races/{id}/export", this::exportRaceHistoryCsv, Role.VIEWER);
    app.get("/api/history/stats", this::getGlobalStatistics, Role.VIEWER);
    app.get("/api/history/drivers/{driverId}/stats", this::getDriverStatistics, Role.VIEWER);
    app.get("/api/predictions/races/{id}", this::getRacePredictionRecord, Role.VIEWER);
    app.get("/api/predictions/evaluations/{id}", this::getPredictionEvaluationRecord, Role.VIEWER);
  }

  // Removed collection getters

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

      Driver existing =
          driverRepository.findOne(
              Filters.or(
                  Filters.eq("name", driver.getName()),
                  Filters.eq("nickname", driver.getNickname())));

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
      driverRepository.insert(driver);
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

      Driver existing =
          driverRepository.findOne(
              Filters.and(
                  Filters.ne("entity_id", id),
                  Filters.or(
                      Filters.eq("name", driver.getName()),
                      Filters.eq("nickname", driver.getNickname()))));

      if (existing != null) {
        ctx.status(409).result("Driver name or nickname already exists");
        return;
      }

      driverRepository.replace(id, driver);
      ctx.json(driver);
    } catch (Exception e) {
      logger.error("Error updating driver", e);
      ctx.status(500).result("Error updating driver: " + e.getMessage());
    }
  }

  private void deleteDriver(Context ctx) {
    try {
      String id = ctx.pathParam("id");
      deleteDriver(id);
      ctx.status(204);
    } catch (Exception e) {
      logger.error("Error deleting driver", e);
      ctx.status(500).result("Error deleting driver: " + e.getMessage());
    }
  }

  public void deleteDriver(String id) {
    driverRepository.delete(id);

    List<Team> teamsToUpdate = teamRepository.find(Filters.in("driverIds", id));

    for (Team team : teamsToUpdate) {
      List<String> driverIds = team.getDriverIds();
      driverIds.remove(id);
      if (driverIds.isEmpty()) {
        deleteTeam(team.getEntityId());
      } else {
        Team updatedTeam =
            new Team(
                team.getName(), team.getAvatarUrl(), driverIds, team.getEntityId(), team.getId());
        teamRepository.replace(team.getEntityId(), updatedTeam);
      }
    }
  }

  private void getTeams(Context ctx) {
    ctx.json(teamRepository.findAll());
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
    // Uniqueness check
    Team existing = teamRepository.findOne(Filters.eq("name", team.getName()));

    if (existing != null) {
      throw new IllegalArgumentException("Team name already exists");
    }

    if (team.getEntityId() == null
        || team.getEntityId().isEmpty()
        || "new".equals(team.getEntityId())) {
      String nextId = teamRepository.getNextSequence();
      team = new Team(team.getName(), team.getAvatarUrl(), team.getDriverIds(), nextId, null);
    }
    teamRepository.insert(team);
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
    Team existing =
        teamRepository.findOne(
            Filters.and(Filters.ne("entity_id", id), Filters.eq("name", team.getName())));

    if (existing != null) {
      throw new IllegalArgumentException("Team name or nickname already exists");
    }

    // Preservation of IDs is handled by maintaining original entity_id
    // However, we construct a new object to ensure it has the correct ID
    team = new Team(team.getName(), team.getAvatarUrl(), team.getDriverIds(), id, team.getId());

    UpdateResult result = teamRepository.replace(id, team);
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
    teamRepository.delete(id);
  }

  private void createTrack(Context ctx) {
    try {
      Track track = bodyAsClassWithId(ctx.body(), Track.class);

      Track existing = trackRepository.findOne(Filters.eq("name", track.getName()));

      if (existing != null) {
        ctx.status(409).result("Track name already exists");
        return;
      }

      if (track.getEntityId() == null
          || track.getEntityId().isEmpty()
          || "new".equals(track.getEntityId())) {
        String nextId = trackRepository.getNextSequence();
        track =
            new Track.Builder()
                .name(track.getName())
                .numTrackSections(track.getNumTrackSections())
                .lanes(track.getLanes())
                .arduinoConfigs(track.getArduinoConfigs())
                .trackmateConfigs(track.getTrackmateConfigs())
                .phidgetConfigs(track.getPhidgetConfigs())
                .entityId(nextId)
                .id(null)
                .build();
      }
      trackRepository.insert(track);
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

      Track existing =
          trackRepository.findOne(
              Filters.and(Filters.ne("entity_id", id), Filters.eq("name", track.getName())));

      if (existing != null) {
        ctx.status(409).result("Track name already exists");
        return;
      }

      track =
          new Track.Builder()
              .name(track.getName())
              .numTrackSections(track.getNumTrackSections())
              .lanes(track.getLanes())
              .arduinoConfigs(track.getArduinoConfigs())
              .trackmateConfigs(track.getTrackmateConfigs())
              .phidgetConfigs(track.getPhidgetConfigs())
              .entityId(id)
              .id(track.getId())
              .build();

      logger.debug("updateTrack for {}", id);
      if (track.getArduinoConfigs() != null && !track.getArduinoConfigs().isEmpty()) {
        logger.debug(
            "Saving config with Digitals: {}", track.getArduinoConfigs().get(0).digitalIds);
      } else {
        logger.debug("Saving configs is NULL or empty");
      }

      trackRepository.replace(id, track);
      ctx.json(track);
    } catch (Exception e) {
      e.printStackTrace();
      ctx.status(500).result("Error updating track: " + e.getMessage());
    }
  }

  private void deleteTrack(Context ctx) {
    try {
      String id = ctx.pathParam("id");
      trackRepository.delete(id);
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
    // Uniqueness check
    Race existing = raceRepository.findOne(Filters.eq("name", race.getName()));
    if (existing != null) {
      throw new IllegalArgumentException("Race name already exists");
    }

    if (race.getEntityId() == null
        || race.getEntityId().isEmpty()
        || "new".equals(race.getEntityId())) {
      String nextId = raceRepository.getNextSequence();
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
              .withStartRandomizer(race.getStartRandomizer())
              .withRestartRandomizer(race.getRestartRandomizer())
              .withSoloLaneIndex(race.getSoloLaneIndex())
              .withCustomRotationSequence(race.getCustomRotationSequence())
              .withCustomRotationAssetId(race.getCustomRotationAssetId())
              .withCustomRotations(race.getCustomRotations())
              .withHeatTimesThrough(race.getHeatTimesThrough())
              .withReverseHeats(race.isReverseHeats())
              .withHotStart(race.isHotStart())
              .withStartAtCurrent(race.isStartAtCurrent())
              .withRestartOnFalseStart(race.isRestartOnFalseStart())
              .withStartBehindSensor(race.isStartBehindSensor())
              .withFalseStartLapPenalty(race.getFalseStartLapPenalty())
              .withFalseStartTimePenalty(race.getFalseStartTimePenalty())
              .withGroupOptions(race.getGroupOptions())
              .withPractice(race.isPractice())
              .withAdjustDriftLaps(race.isAdjustDriftLaps())
              .withEntityId(nextId)
              .build();
    }
    raceRepository.insert(race);
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
    Race existing =
        raceRepository.findOne(
            Filters.and(Filters.ne("entity_id", id), Filters.eq("name", race.getName())));

    if (existing != null) {
      throw new IllegalArgumentException("Race name already exists");
    }

    race = new Race.Builder().from(race).withEntityId(id).withId(race.getId()).build();
    UpdateResult result = raceRepository.replace(id, race);
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

    raceRepository.delete(id);
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
    ctx.json(driverRepository.findAll());
  }

  public void getTracks(Context ctx) {
    ctx.json(trackRepository.findAll());
  }

  private void getFactoryTrack(Context ctx) {
    ctx.json(DatabaseService.getInstance().getFactoryTrack());
  }

  public void getRaces(Context ctx) {
    List<Race> races = raceRepository.findAll();

    List<RaceResponse> response = new ArrayList<>();
    for (Race race : races) {
      Track track = trackRepository.findOne(Filters.eq("entity_id", race.getTrackEntityId()));
      response.add(new RaceResponse(race, track));
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
    Race race = raceRepository.findByEntityId(raceId);
    if (race == null) {
      ctx.status(404).result("Race not found");
      return;
    }

    // Find the track to get lane count
    Track track = trackRepository.findByEntityId(race.getTrackEntityId());
    if (track == null) {
      ctx.status(404).result("Track not found for race");
      return;
    }

    // Create mock RaceParticipant list
    List<RaceParticipant> mockDrivers = new ArrayList<>();
    for (int i = 0; i < driverCount; i++) {
      Driver mockDriver = new Driver("Driver " + (i + 1), "Driver " + (i + 1));
      mockDrivers.add(new RaceParticipant(mockDriver));
    }

    // Create a temporary Race object for heat building
    com.antigravity.race.Race tempRace = // fqn-collision
        new com.antigravity.race.Race.Builder() // fqn-collision
            .model(race)
            .drivers(mockDrivers)
            .track(track)
            .databaseContext(databaseContext)
            .isDemoMode(true) // Use demo mode to avoid protocol initialization
            .build();

    // Get the generated heats
    List<Heat> heats = tempRace.getHeats();

    // Convert heats to JSON response
    List<Map<String, Object>> heatList = new ArrayList<>();
    for (Heat heat : heats) {
      Map<String, Object> heatMap = new HashMap<>();
      heatMap.put("heatNumber", heat.getHeatNumber());
      heatMap.put("group", heat.getGroup());

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

  @SuppressWarnings("checkstyle:MethodLength")
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
    Track track = trackRepository.findByEntityId(trackId);
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

    Map<String, Object> groupOptionsMap = (Map<String, Object>) body.get("groupOptions");
    if (groupOptionsMap == null) {
      groupOptionsMap = (Map<String, Object>) body.get("group_options");
    }
    GroupOptions groupOptions = null;
    if (groupOptionsMap != null) {
      Boolean enabled = (Boolean) groupOptionsMap.get("enabled");
      Number maxGroupsNum = (Number) groupOptionsMap.get("max_groups");
      if (maxGroupsNum == null) {
        maxGroupsNum = (Number) groupOptionsMap.get("maxGroups");
      }
      Integer maxGroups = maxGroupsNum != null ? maxGroupsNum.intValue() : null;
      Boolean balance = (Boolean) groupOptionsMap.get("balance");
      Boolean allowEmpty = (Boolean) groupOptionsMap.get("allow_empty_lanes");
      if (allowEmpty == null) {
        allowEmpty = (Boolean) groupOptionsMap.get("allowEmptyLanes");
      }
      Boolean forceMultiple = (Boolean) groupOptionsMap.get("force_multiple_of_max");
      if (forceMultiple == null) {
        forceMultiple = (Boolean) groupOptionsMap.get("forceMultipleOfMax");
      }
      Boolean rotateHeats = (Boolean) groupOptionsMap.get("rotate_group_heats");
      if (rotateHeats == null) {
        rotateHeats = (Boolean) groupOptionsMap.get("rotateGroupHeats");
      }
      Number minAdvancingNum = (Number) groupOptionsMap.get("min_advancing");
      if (minAdvancingNum == null) {
        minAdvancingNum = (Number) groupOptionsMap.get("minAdvancing");
      }
      Integer minAdvancing = minAdvancingNum != null ? minAdvancingNum.intValue() : 0;

      groupOptions =
          new GroupOptions(
              enabled, maxGroups, balance, allowEmpty, forceMultiple, rotateHeats, minAdvancing);
    }

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
            .withGroupOptions(groupOptions)
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
      heatMap.put("group", heat.getGroup());

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
      DatabaseService dbService = DatabaseService.getInstance();
      List<RaceHistoryRecord> history =
          dbService.getRaceHistory(databaseContext.getDatabase(), isDemo);
      ctx.json(history);
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
      boolean isDemo =
          "true".equals(ctx.queryParam("demo")) || "true".equals(ctx.queryParam("isDemo"));
      String raceId = ctx.queryParam("raceId");
      if (raceId == null || raceId.isEmpty()) {
        raceId = "global";
      }
      DatabaseService dbService = DatabaseService.getInstance();
      GlobalStatistics stats =
          dbService.getGlobalStatistics(databaseContext.getDatabase(), raceId, isDemo);
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
      Track track = trackRepository.findByEntityId(race.getTrackEntityId());
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
      Track track = trackRepository.findByEntityId(race.getTrackEntityId());
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
          Object groupObj = heatMap.get("group");
          int group = groupObj != null ? ((Number) groupObj).intValue() : 0;
          heats.add(new CustomHeat(driverIndices, group));
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
          Integer group = heatDoc.getInteger("group");
          heats.add(
              new CustomHeat(
                  (List<Integer>) heatDoc.get("driver_indices"), group != null ? group : 0));
        }
      }
      result.add(new CustomRotation(numDrivers, heats));
    }
    return result;
  }

  private void getDriverStatistics(Context ctx) {
    try {
      String driverId = ctx.pathParam("driverId");
      String raceId = ctx.queryParam("raceId");
      boolean isDemo =
          "true".equals(ctx.queryParam("demo")) || "true".equals(ctx.queryParam("isDemo"));

      // Auto-detect demo mode from the active running race
      if (!isDemo) {
        com.antigravity.race.Race activeRace = // fqn-collision
            ClientSubscriptionManager.getInstance().getRace();
        if (activeRace != null && activeRace.getRaceModel() != null) {
          if (raceId == null
              || raceId.isEmpty()
              || activeRace.getRaceModel().getEntityId().equals(raceId)) {
            isDemo = activeRace.isDemoMode();
          }
        }
      }

      DatabaseService dbService = DatabaseService.getInstance();
      DriverStatistics stats =
          dbService.getDriverStatistics(databaseContext.getDatabase(), driverId, raceId, isDemo);

      if (stats == null) {
        ctx.status(404).result("Driver statistics not found");
        return;
      }
      ctx.json(stats);
    } catch (Exception e) {
      logger.error("Error fetching driver statistics", e);
      ctx.status(500).result("Error fetching driver statistics: " + e.getMessage());
    }
  }

  private boolean isStalePredictionRecord(RacePredictionRecord record) {
    return isStalePredictionRecord(record, null);
  }

  private boolean isStalePredictionRecord(
      RacePredictionRecord record, com.antigravity.race.Race activeRace) { // fqn-collision
    if (record == null || record.getPreRace() == null) {
      logger.info("PREDICTION: Stale because record or preRace is null");
      return true;
    }
    List<RacePredictionRecord.DriverProjection> standings =
        record.getPreRace().getProjectedStandings();
    if (standings == null || standings.isEmpty()) {
      logger.info("PREDICTION: Stale because standings is null or empty");
      return true;
    }

    if (activeRace != null && activeRace.getDrivers() != null) {
      Set<String> activeDriverIds = new HashSet<>();
      for (RaceParticipant rp : activeRace.getDrivers()) {
        if (rp != null && !PredictionEngine.isParticipantEmpty(rp)) {
          String pId = PredictionEngine.getParticipantId(rp);
          if (pId != null && !pId.isEmpty() && !"EMPTY_LANE".equals(pId)) {
            activeDriverIds.add(pId);
          }
        }
      }

      Set<String> standingDriverIds = new HashSet<>();
      for (RacePredictionRecord.DriverProjection dp : standings) {
        if (dp != null
            && dp.getDriverId() != null
            && !"EMPTY_LANE".equalsIgnoreCase(dp.getDriverId())) {
          standingDriverIds.add(dp.getDriverId());
        }
      }

      if (!standingDriverIds.equals(activeDriverIds)) {
        logger.info(
            "PREDICTION: Stale because active race drivers do not match prediction standings (active: {}, prediction: {})",
            activeDriverIds.size(),
            standingDriverIds.size());
        return true;
      }
    }

    double totalWinProb = 0.0;
    Set<Integer> ranks = new HashSet<>();
    for (RacePredictionRecord.DriverProjection dp : standings) {
      if (dp == null || dp.getDriverId() == null) {
        logger.info("PREDICTION: Stale because driver projection is null");
        return true;
      }
      if ("EMPTY_LANE".equalsIgnoreCase(dp.getDriverId())
          || "Empty Lane".equalsIgnoreCase(dp.getDriverName())) {
        logger.info("PREDICTION: Stale because empty lane driver found");
        return true;
      }
      if (dp.getProjectedRank() != -1) {
        if (ranks.contains(dp.getProjectedRank())) {
          logger.info("PREDICTION: Stale because duplicate rank found: " + dp.getProjectedRank());
          return true;
        }
        ranks.add(dp.getProjectedRank());
      } else {
        logger.info("PREDICTION: Stale because rank is -1 (fallback prediction)");
        return true;
      }
      totalWinProb += dp.getWinProbability();
    }

    if (standings.size() > 1 && totalWinProb >= 0.0 && totalWinProb < 0.95) {
      logger.info("PREDICTION: Stale because totalWinProb < 0.95: " + totalWinProb);
      // return true; // Disabled because this causes an infinite loop of overwriting realtime
      // snapshots
    }

    return false;
  }

  private void getRacePredictionRecord(Context ctx) {
    try {
      String raceId = ctx.pathParam("id");
      boolean isDemo =
          "true".equals(ctx.queryParam("demo")) || "true".equals(ctx.queryParam("isDemo"));
      boolean forceRecalc =
          "true".equals(ctx.queryParam("force")) || "true".equals(ctx.queryParam("recalculate"));
      DatabaseService dbService = DatabaseService.getInstance();
      DatabaseContext reqCtx = (DatabaseContext) ctx.attribute(DatabaseContext.class.getName());
      MongoDatabase database =
          reqCtx != null
              ? reqCtx.getDatabase()
              : (databaseContext != null ? databaseContext.getDatabase() : null);

      com.antigravity.race.Race activeRace = // fqn-collision
          ClientSubscriptionManager.getInstance().getRace();

      // Auto-detect demo mode from the active running race
      if (!isDemo && activeRace != null && activeRace.getRaceModel() != null) {
        if ("current".equals(raceId) || activeRace.getRaceModel().getEntityId().equals(raceId)) {
          isDemo = activeRace.isDemoMode();
        }
      }

      String targetRaceId = raceId;
      if ("current".equals(raceId) && activeRace != null && activeRace.getRaceModel() != null) {
        targetRaceId = activeRace.getRaceModel().getEntityId();
      }

      RacePredictionRecord record = null;
      if (!forceRecalc && database != null && targetRaceId != null && !targetRaceId.isEmpty()) {
        record = dbService.getRacePredictionRecord(database, targetRaceId, isDemo);
      }

      boolean isStale = isStalePredictionRecord(record, activeRace);

      if ((record == null || isStale || forceRecalc)
          && activeRace != null
          && activeRace.getRaceModel() != null) {
        String activeRaceId = activeRace.getRaceModel().getEntityId();
        if (activeRaceId != null && !activeRaceId.isEmpty()) {
          record =
              RacePredictionService.getInstance()
                  .generateAndSavePreRacePrediction(
                      database,
                      activeRaceId,
                      activeRace.getRaceModel(),
                      activeRace.getDrivers(),
                      activeRace.getHeats(),
                      isDemo,
                      true);

          int currentHeatIdx =
              activeRace.getHeats() != null && activeRace.getCurrentHeat() != null
                  ? activeRace.getHeats().indexOf(activeRace.getCurrentHeat())
                  : 0;
          if (currentHeatIdx < 0) currentHeatIdx = 0;

          Map<String, PredictionEngine.DriverHeatState> actualLaps = new HashMap<>();
          if (activeRace.getDrivers() != null) {
            for (RaceParticipant rp : activeRace.getDrivers()) {
              if (rp != null) {
                String dId = PredictionEngine.getParticipantId(rp);
                if (dId != null) {
                  PredictionEngine.DriverHeatState state = new PredictionEngine.DriverHeatState();
                  state.totalLapsCompleted = rp.getTotalLaps();
                  actualLaps.put(dId, state);
                }
              }
            }
          }

          RacePredictionService.getInstance()
              .updateRealtimePrediction(
                  database,
                  activeRaceId,
                  activeRace.getRaceModel(),
                  activeRace.getDrivers(),
                  activeRace.getHeats(),
                  currentHeatIdx,
                  actualLaps,
                  isDemo);

          record = dbService.getRacePredictionRecord(database, activeRaceId, isDemo);
        }
      }

      if (record == null) {
        ctx.status(404).result("Race prediction record not found");
        return;
      }
      ctx.json(record);
    } catch (Exception e) {
      logger.error("Error fetching race prediction record", e);
      ctx.status(500).result("Error fetching race prediction record: " + e.getMessage());
    }
  }

  private void getPredictionEvaluationRecord(Context ctx) {
    try {
      String raceId = ctx.pathParam("id");
      boolean isDemo =
          "true".equals(ctx.queryParam("demo")) || "true".equals(ctx.queryParam("isDemo"));
      DatabaseService dbService = DatabaseService.getInstance();

      com.antigravity.race.Race activeRace = // fqn-collision
          ClientSubscriptionManager.getInstance().getRace();

      // Auto-detect demo mode from the active running race
      if (!isDemo && activeRace != null && activeRace.getRaceModel() != null) {
        if ("current".equals(raceId) || activeRace.getRaceModel().getEntityId().equals(raceId)) {
          isDemo = activeRace.isDemoMode();
        }
      }

      String targetRaceId = raceId;
      if ("current".equals(raceId) && activeRace != null && activeRace.getRaceModel() != null) {
        targetRaceId = activeRace.getRaceModel().getEntityId();
      }

      PredictionEvaluationRecord eval =
          dbService.getPredictionEvaluationRecord(
              databaseContext.getDatabase(), targetRaceId, isDemo);
      if (eval == null) {
        ctx.status(404).result("Prediction evaluation record not found");
        return;
      }
      ctx.json(eval);
    } catch (Exception e) {
      logger.error("Error fetching prediction evaluation record", e);
      ctx.status(500).result("Error fetching prediction evaluation record: " + e.getMessage());
    }
  }
}
