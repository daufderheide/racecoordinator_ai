package com.antigravity.handlers;

import com.antigravity.auth.Role;
import com.antigravity.context.DatabaseContext;
import com.antigravity.models.Driver;
import com.antigravity.models.Event;
import com.antigravity.models.Race;
import com.antigravity.models.RacePredictionRecord;
import com.antigravity.models.Season;
import com.antigravity.models.SeasonStandingItem;
import com.antigravity.models.Team;
import com.antigravity.models.Track;
import com.antigravity.race.SeasonStandingsCalculator;
import com.antigravity.repository.SqliteRepository;
import com.antigravity.service.DatabaseService;
import io.javalin.Javalin;
import io.javalin.http.Context;
import java.util.List;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class DatabaseTaskHandler {

  private static final Logger logger = LoggerFactory.getLogger(DatabaseTaskHandler.class);
  private final DatabaseContext databaseContext;
  private final SqliteRepository<Driver> driverRepository;
  private final SqliteRepository<Team> teamRepository;
  private final SqliteRepository<Track> trackRepository;
  private final SqliteRepository<Event> eventRepository;
  private final SqliteRepository<Season> seasonRepository;

  private final HistoryPredictionTaskHandler historyPredictionTaskHandler;
  private final RaceHeatTaskHandler raceHeatTaskHandler;

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
    this.driverRepository = new SqliteRepository<>(databaseContext, "drivers", Driver.class);
    this.teamRepository = new SqliteRepository<>(databaseContext, "teams", Team.class);
    this.trackRepository = new SqliteRepository<>(databaseContext, "tracks", Track.class);
    this.eventRepository = new SqliteRepository<>(databaseContext, "events", Event.class);
    this.seasonRepository = new SqliteRepository<>(databaseContext, "seasons", Season.class);

    // Initialize modular sub-handlers
    new DatabaseManagementTaskHandler(databaseContext, app);
    this.historyPredictionTaskHandler = new HistoryPredictionTaskHandler(databaseContext, app);
    this.raceHeatTaskHandler = new RaceHeatTaskHandler(databaseContext, app);

    // Driver Endpoints
    app.get("/api/drivers", this::getDrivers, Role.VIEWER);
    app.post("/api/drivers", this::createDriver, Role.DIRECTOR);
    app.put("/api/drivers/{id}", this::updateDriver, Role.DIRECTOR);
    app.delete("/api/drivers/{id}", this::deleteDriver, Role.DIRECTOR);

    // Track Endpoints
    app.get("/api/tracks", this::getTracks, Role.VIEWER);
    app.get("/api/tracks/factory-settings", this::getFactoryTrack, Role.VIEWER);
    app.post("/api/tracks", this::createTrack, Role.DIRECTOR);
    app.put("/api/tracks/{id}", this::updateTrack, Role.DIRECTOR);
    app.delete("/api/tracks/{id}", this::deleteTrack, Role.DIRECTOR);

    // Team Endpoints
    app.get("/api/teams", this::getTeams, Role.VIEWER);
    app.post("/api/teams", this::createTeam, Role.DIRECTOR);
    app.put("/api/teams/{id}", this::updateTeam, Role.DIRECTOR);
    app.delete("/api/teams/{id}", this::deleteTeam, Role.DIRECTOR);

    // Event Endpoints
    app.get("/api/events", this::getEvents, Role.VIEWER);
    app.get("/api/events/{id}", this::getEventById, Role.VIEWER);
    app.post("/api/events", this::handleCreateEvent, Role.DIRECTOR);
    app.put("/api/events/{id}", this::handleUpdateEvent, Role.DIRECTOR);
    app.delete("/api/events/{id}", this::handleDeleteEvent, Role.DIRECTOR);

    // Season Endpoints
    app.get("/api/seasons", this::getSeasons, Role.VIEWER);
    app.get("/api/seasons/{id}", this::getSeasonById, Role.VIEWER);
    app.get("/api/seasons/{id}/standings", this::getSeasonStandings, Role.VIEWER);
    app.post("/api/seasons", this::handleCreateSeason, Role.DIRECTOR);
    app.put("/api/seasons/{id}", this::handleUpdateSeason, Role.DIRECTOR);
    app.delete("/api/seasons/{id}", this::handleDeleteSeason, Role.DIRECTOR);
  }

  // --- Driver Handlers ---

  public void getDrivers(Context ctx) {
    ctx.json(driverRepository.findAll());
  }

  private void createDriver(Context ctx) {
    try {
      Driver driver = DatabaseHandlerUtils.bodyAsClassWithId(ctx.body(), Driver.class);

      final String driverName = driver.getName();
      final String driverNick = driver.getNickname();
      List<Driver> allDrivers = driverRepository.findAll();
      boolean existing =
          allDrivers.stream()
              .anyMatch(
                  d ->
                      (driverName != null && driverName.equalsIgnoreCase(d.getName()))
                          || (driverNick != null && driverNick.equalsIgnoreCase(d.getNickname())));

      if (existing) {
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
      Driver driver = DatabaseHandlerUtils.bodyAsClassWithId(ctx.body(), Driver.class);

      List<Driver> allDrivers = driverRepository.findAll();
      boolean existing =
          allDrivers.stream()
              .anyMatch(
                  d ->
                      !id.equals(d.getEntityId())
                          && ((driver.getName() != null
                                  && driver.getName().equalsIgnoreCase(d.getName()))
                              || (driver.getNickname() != null
                                  && driver.getNickname().equalsIgnoreCase(d.getNickname()))));

      if (existing) {
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

    List<Team> teamsToUpdate =
        teamRepository.findAll().stream()
            .filter(t -> t.getDriverIds() != null && t.getDriverIds().contains(id))
            .collect(Collectors.toList());

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

  // --- Team Handlers ---

  private void getTeams(Context ctx) {
    ctx.json(teamRepository.findAll());
  }

  private void createTeam(Context ctx) {
    try {
      Team team = DatabaseHandlerUtils.bodyAsClassWithId(ctx.body(), Team.class);
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
    final String teamName = team.getName();
    boolean existing =
        teamRepository.findAll().stream()
            .anyMatch(
                t ->
                    t.getName() != null
                        && teamName != null
                        && t.getName().trim().equalsIgnoreCase(teamName.trim()));

    if (existing) {
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
      Team team = DatabaseHandlerUtils.bodyAsClassWithId(ctx.body(), Team.class);
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
    final String updateTeamName = team.getName();
    boolean existing =
        teamRepository.findAll().stream()
            .anyMatch(
                t ->
                    !id.equals(t.getEntityId())
                        && t.getName() != null
                        && updateTeamName != null
                        && t.getName().trim().equalsIgnoreCase(updateTeamName.trim()));

    if (existing) {
      throw new IllegalArgumentException("Team name or nickname already exists");
    }

    team = new Team(team.getName(), team.getAvatarUrl(), team.getDriverIds(), id, null);
    teamRepository.replace(id, team);
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

  // --- Track Handlers ---

  public void getTracks(Context ctx) {
    ctx.json(trackRepository.findAll());
  }

  private void getFactoryTrack(Context ctx) {
    ctx.json(DatabaseService.getInstance().getFactoryTrack());
  }

  private void createTrack(Context ctx) {
    try {
      Track track = DatabaseHandlerUtils.bodyAsClassWithId(ctx.body(), Track.class);

      final String trackName = track.getName();
      boolean existing =
          trackRepository.findAll().stream()
              .anyMatch(
                  t ->
                      t.getName() != null
                          && trackName != null
                          && t.getName().trim().equalsIgnoreCase(trackName.trim()));

      if (existing) {
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
                .trackScale(track.getTrackScale())
                .lanes(track.getLanes())
                .arduinoConfigs(track.getArduinoConfigs())
                .trackmateConfigs(track.getTrackmateConfigs())
                .phidgetConfigs(track.getPhidgetConfigs())
                .bartConfigs(track.getBartConfigs())
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
      Track track = DatabaseHandlerUtils.bodyAsClassWithId(ctx.body(), Track.class);

      final String updateTrackName = track.getName();
      boolean existing =
          trackRepository.findAll().stream()
              .anyMatch(
                  t ->
                      !id.equals(t.getEntityId())
                          && t.getName() != null
                          && updateTrackName != null
                          && t.getName().trim().equalsIgnoreCase(updateTrackName.trim()));

      if (existing) {
        ctx.status(409).result("Track name already exists");
        return;
      }

      track =
          new Track.Builder()
              .name(track.getName())
              .numTrackSections(track.getNumTrackSections())
              .trackScale(track.getTrackScale())
              .lanes(track.getLanes())
              .arduinoConfigs(track.getArduinoConfigs())
              .trackmateConfigs(track.getTrackmateConfigs())
              .phidgetConfigs(track.getPhidgetConfigs())
              .bartConfigs(track.getBartConfigs())
              .entityId(id)
              .id((String) null)
              .build();

      trackRepository.replace(id, track);
      ctx.json(track);
    } catch (Exception e) {
      logger.error("Error updating track", e);
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

  // --- Event Handlers ---

  public void getEvents(Context ctx) {
    try {
      List<Event> events = eventRepository.findAll();
      ctx.json(events);
    } catch (Exception e) {
      logger.error("Error getting events", e);
      ctx.status(500).result("Error getting events: " + e.getMessage());
    }
  }

  public void getEventById(Context ctx) {
    try {
      String id = ctx.pathParam("id");
      Event event = eventRepository.findByEntityId(id);
      if (event != null) {
        ctx.json(event);
      } else {
        ctx.status(404).result("Event not found");
      }
    } catch (Exception e) {
      logger.error("Error getting event", e);
      ctx.status(500).result("Error getting event: " + e.getMessage());
    }
  }

  public void handleCreateEvent(Context ctx) {
    try {
      Event event = DatabaseHandlerUtils.bodyAsClassWithId(ctx.body(), Event.class);
      if (event.getName() == null || event.getName().trim().isEmpty()) {
        ctx.status(400).result("Event name cannot be empty");
        return;
      }
      boolean existing =
          eventRepository.findAll().stream()
              .anyMatch(
                  e ->
                      e.getName() != null
                          && e.getName().trim().equalsIgnoreCase(event.getName().trim()));
      if (existing) {
        ctx.status(400).result("Event name already exists");
        return;
      }
      String nextId = eventRepository.getNextSequence();
      Event created =
          new Event(
              event.getName(),
              event.getDescription(),
              event.getAutoAdvanceTime(),
              event.getRaces(),
              nextId,
              null);
      eventRepository.insert(created);
      ctx.status(201).json(created);
    } catch (Exception e) {
      logger.error("Error creating event", e);
      ctx.status(500).result("Error creating event: " + e.getMessage());
    }
  }

  public void handleUpdateEvent(Context ctx) {
    try {
      String id = ctx.pathParam("id");
      Event event = DatabaseHandlerUtils.bodyAsClassWithId(ctx.body(), Event.class);
      if (event.getName() == null || event.getName().trim().isEmpty()) {
        ctx.status(400).result("Event name cannot be empty");
        return;
      }
      List<Event> allEvents = eventRepository.findAll();
      boolean nameExists =
          allEvents.stream()
              .anyMatch(
                  e ->
                      e.getName() != null
                          && e.getName().trim().equalsIgnoreCase(event.getName().trim())
                          && !id.equals(e.getEntityId()));
      if (nameExists) {
        ctx.status(400).result("Event name already exists");
        return;
      }
      Event updated =
          new Event(
              event.getName(),
              event.getDescription(),
              event.getAutoAdvanceTime(),
              event.getRaces(),
              id,
              null);
      eventRepository.replace(id, updated);
      ctx.json(updated);
    } catch (Exception e) {
      logger.error("Error updating event", e);
      ctx.status(500).result("Error updating event: " + e.getMessage());
    }
  }

  public void handleDeleteEvent(Context ctx) {
    try {
      String id = ctx.pathParam("id");
      eventRepository.delete(id);
      ctx.status(204);
    } catch (Exception e) {
      logger.error("Error deleting event", e);
      ctx.status(500).result("Error deleting event: " + e.getMessage());
    }
  }

  // --- Season Handlers ---

  public void getSeasons(Context ctx) {
    try {
      List<Season> seasons = seasonRepository.findAll();
      ctx.json(seasons);
    } catch (Exception e) {
      logger.error("Error getting seasons", e);
      ctx.status(500).result("Error getting seasons: " + e.getMessage());
    }
  }

  public void getSeasonById(Context ctx) {
    try {
      String id = ctx.pathParam("id");
      Season season = seasonRepository.findByEntityId(id);
      if (season != null) {
        ctx.json(season);
      } else {
        ctx.status(404).result("Season not found");
      }
    } catch (Exception e) {
      logger.error("Error getting season", e);
      ctx.status(500).result("Error getting season: " + e.getMessage());
    }
  }

  public void getSeasonStandings(Context ctx) {
    try {
      String id = ctx.pathParam("id");
      Season season = seasonRepository.findByEntityId(id);
      if (season != null) {
        List<SeasonStandingItem> standings = SeasonStandingsCalculator.calculateStandings(season);
        ctx.json(standings);
      } else {
        ctx.status(404).result("Season not found");
      }
    } catch (Exception e) {
      logger.error("Error getting season standings", e);
      ctx.status(500).result("Error getting season standings: " + e.getMessage());
    }
  }

  public void handleCreateSeason(Context ctx) {
    try {
      Season season = DatabaseHandlerUtils.bodyAsClassWithId(ctx.body(), Season.class);
      if (season.getName() == null || season.getName().trim().isEmpty()) {
        ctx.status(400).result("Season name cannot be empty");
        return;
      }
      List<Season> allSeasons = seasonRepository.findAll();
      boolean nameExists =
          allSeasons.stream()
              .anyMatch(
                  s ->
                      s.getName() != null
                          && s.getName().trim().equalsIgnoreCase(season.getName().trim()));
      if (nameExists) {
        ctx.status(400).result("Season name already exists");
        return;
      }
      String nextId = seasonRepository.getNextSequence();
      Season created =
          new Season(season.getName(), season.getDrops(), season.getRaces(), nextId, null);
      seasonRepository.insert(created);
      ctx.status(201).json(created);
    } catch (Exception e) {
      logger.error("Error creating season", e);
      ctx.status(500).result("Error creating season: " + e.getMessage());
    }
  }

  public void handleUpdateSeason(Context ctx) {
    try {
      String id = ctx.pathParam("id");
      Season season = DatabaseHandlerUtils.bodyAsClassWithId(ctx.body(), Season.class);
      if (season.getName() == null || season.getName().trim().isEmpty()) {
        ctx.status(400).result("Season name cannot be empty");
        return;
      }
      List<Season> allSeasons = seasonRepository.findAll();
      boolean nameExists =
          allSeasons.stream()
              .anyMatch(
                  s ->
                      s.getName() != null
                          && s.getName().trim().equalsIgnoreCase(season.getName().trim())
                          && !id.equals(s.getEntityId()));
      if (nameExists) {
        ctx.status(400).result("Season name already exists");
        return;
      }
      Season updated =
          new Season(season.getName(), season.getDrops(), season.getRaces(), id, season.getId());
      seasonRepository.replace(id, updated);
      ctx.json(updated);
    } catch (Exception e) {
      logger.error("Error updating season", e);
      ctx.status(500).result("Error updating season: " + e.getMessage());
    }
  }

  public void handleDeleteSeason(Context ctx) {
    try {
      String id = ctx.pathParam("id");
      seasonRepository.delete(id);
      ctx.status(204);
    } catch (Exception e) {
      logger.error("Error deleting season", e);
      ctx.status(500).result("Error deleting season: " + e.getMessage());
    }
  }

  private String getNextSequence(String collectionName) {
    return databaseContext.getNextSequence(collectionName);
  }

  // --- Delegate Methods for Backward Compatibility & Testing ---

  public void handleCreateRace(Context ctx) {
    raceHeatTaskHandler.handleCreateRace(ctx);
  }

  public Race createRace(Race race) {
    return raceHeatTaskHandler.createRace(race);
  }

  public void handleUpdateRace(Context ctx) {
    raceHeatTaskHandler.handleUpdateRace(ctx);
  }

  public Race updateRace(String id, Race race) {
    return raceHeatTaskHandler.updateRace(id, race);
  }

  public void handleDeleteRace(Context ctx) {
    raceHeatTaskHandler.handleDeleteRace(ctx);
  }

  public void deleteRace(String id) {
    raceHeatTaskHandler.deleteRace(id);
  }

  public void handleResetRace(Context ctx) {
    raceHeatTaskHandler.handleResetRace(ctx);
  }

  public void resetRace(String id) {
    raceHeatTaskHandler.resetRace(id);
  }

  public void getRaces(Context ctx) {
    raceHeatTaskHandler.getRaces(ctx);
  }

  public void generateHeats(Context ctx) {
    raceHeatTaskHandler.generateHeats(ctx);
  }

  public void previewHeats(Context ctx) {
    raceHeatTaskHandler.previewHeats(ctx);
  }

  public boolean isStalePredictionRecord(
      DatabaseContext database,
      RacePredictionRecord record,
      com.antigravity.race.Race activeRace, // fqn-collision
      boolean isDemo) {
    return historyPredictionTaskHandler.isStalePredictionRecord(
        database, record, activeRace, isDemo);
  }

  public void getPredictionEvaluationRecord(Context ctx) {
    historyPredictionTaskHandler.getPredictionEvaluationRecord(ctx);
  }

  public void getRacePredictionRecord(Context ctx) {
    historyPredictionTaskHandler.getRacePredictionRecord(ctx);
  }
}
