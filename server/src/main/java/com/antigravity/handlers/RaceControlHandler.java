package com.antigravity.handlers;

import com.antigravity.context.DatabaseContext;
import com.antigravity.handlers.ClientCommandTaskHandler.TaskResult;
import com.antigravity.models.Driver;
import com.antigravity.models.Race;
import com.antigravity.models.Team;
import com.antigravity.models.Theme;
import com.antigravity.models.Track;
import com.antigravity.proto.DeferHeatResponse;
import com.antigravity.proto.EndRaceRequest;
import com.antigravity.proto.EndRaceResponse;
import com.antigravity.proto.InitializeRaceRequest;
import com.antigravity.proto.InitializeRaceResponse;
import com.antigravity.proto.ModifyHeatsRequest;
import com.antigravity.proto.ModifyHeatsResponse;
import com.antigravity.proto.NextHeatResponse;
import com.antigravity.proto.PauseRaceResponse;
import com.antigravity.proto.RaceData;
import com.antigravity.proto.RegenerateHeatsRequest;
import com.antigravity.proto.RegenerateHeatsResponse;
import com.antigravity.proto.RestartHeatResponse;
import com.antigravity.proto.SkipHeatResponse;
import com.antigravity.proto.SkipRaceResponse;
import com.antigravity.proto.StartRaceResponse;
import com.antigravity.race.ClientSubscriptionManager;
import com.antigravity.race.Heat;
import com.antigravity.race.RaceParticipant;
import com.antigravity.race.states.NotStarted;
import com.antigravity.race.states.RaceOver;
import com.antigravity.repository.SqliteRepository;
import com.antigravity.service.AnalyticsService;
import com.antigravity.service.DatabaseService;
import com.google.protobuf.InvalidProtocolBufferException;
import io.javalin.http.Context;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class RaceControlHandler {

  private static final Logger logger = LoggerFactory.getLogger(RaceControlHandler.class);
  private final DatabaseContext databaseContext;

  public RaceControlHandler(DatabaseContext databaseContext) {
    this.databaseContext = databaseContext;
  }

  public void initializeRace(Context ctx) {
    try {
      InitializeRaceRequest request = InitializeRaceRequest.parseFrom(ctx.bodyAsBytes());
      logger.info(
          "InitializeRaceRequest received: race_id={}, driver_ids={}",
          request.getRaceId(),
          request.getDriverIdsList());

      TaskResult result = handleInitializeRace(request);

      if (result.status != 200) {
        ctx.status(result.status);
      }
      if (result.contentType != null) {
        ctx.contentType(result.contentType);
      }
      if (result.result instanceof byte[]) {
        ctx.result((byte[]) result.result);
      } else if (result.result instanceof String) {
        ctx.result((String) result.result);
      }

    } catch (InvalidProtocolBufferException e) {
      logger.error("Error parsing InitializeRaceRequest", e);
      ctx.status(400).result("Invalid Protobuf message: " + e.getMessage());
    } catch (Exception e) {
      logger.error("Error initializing race", e);
      ctx.status(500).result("Internal Server Error: " + e.toString());
    }
  }

  @SuppressWarnings("checkstyle:MethodLength")
  public TaskResult handleInitializeRace(InitializeRaceRequest request) throws Exception {
    DatabaseService dbService = DatabaseService.getInstance();

    if (request.getEventId() != null && !request.getEventId().isEmpty()) {
      com.antigravity.models.Event event = // fqn-collision
          dbService.getEvent(databaseContext, request.getEventId());
      if (event == null) {
        return TaskResult.error(404, "Event not found: " + request.getEventId());
      }
      if (ClientSubscriptionManager.getInstance().hasDirectorSubscribers()
          && ClientSubscriptionManager.getInstance().getRace() != null
          && ClientSubscriptionManager.getInstance().getRace().isActive()) {
        return TaskResult.error(
            409, "Cannot start new race while client is watching an active race");
      }
      com.antigravity.race.EventExecutionManager.getInstance() // fqn-collision
          .startEvent(
              event,
              request.getDriverIdsList(),
              request.getIsDemoMode(),
              request.getDemoConfig(),
              databaseContext,
              request.getSeasonId());
      InitializeRaceResponse response =
          InitializeRaceResponse.newBuilder().setSuccess(true).build();
      return TaskResult.success(response.toByteArray());
    }

    com.antigravity.race.EventExecutionManager.getInstance().cancelEvent(); // fqn-collision

    Race raceModel = dbService.getRace(databaseContext, request.getRaceId());

    if (raceModel == null) {
      return TaskResult.error(404, "Race not found");
    }

    if (ClientSubscriptionManager.getInstance().hasDirectorSubscribers()
        && ClientSubscriptionManager.getInstance().getRace() != null
        && ClientSubscriptionManager.getInstance().getRace().isActive()) {
      return TaskResult.error(409, "Cannot start new race while client is watching an active race");
    }

    List<String> participantIds = request.getDriverIdsList();
    List<String> rawIds =
        participantIds.stream()
            .map(id -> id.startsWith("d_") || id.startsWith("t_") ? id.substring(2) : id)
            .collect(Collectors.toList());

    List<Driver> drivers = dbService.getDrivers(databaseContext, rawIds);
    List<Team> teams = dbService.getTeams(databaseContext, rawIds);

    List<RaceParticipant> participants = new ArrayList<>();
    List<Team> allTeams = dbService.getAllTeams(databaseContext);

    Map<String, List<String>> driverToTeamNames = new HashMap<>();
    Set<String> individualDriverIds = new HashSet<>();

    for (String pid : participantIds) {
      String rawId = pid.startsWith("d_") || pid.startsWith("t_") ? pid.substring(2) : pid;
      if (pid.startsWith("d_")) {
        individualDriverIds.add(rawId);
      } else if (pid.startsWith("t_")) {
        Team team =
            teams.stream().filter(t -> t.getEntityId().equals(rawId)).findFirst().orElse(null);
        if (team != null) {
          for (String dId : team.getDriverIds()) {
            driverToTeamNames.computeIfAbsent(dId, k -> new ArrayList<>()).add(team.getName());
          }
        }
      }
    }

    for (String dId : individualDriverIds) {
      if (driverToTeamNames.containsKey(dId)) {
        Driver d =
            drivers.stream().filter(drv -> drv.getEntityId().equals(dId)).findFirst().orElse(null);
        String dName = d != null ? d.getName() : dId;
        InitializeRaceResponse response =
            InitializeRaceResponse.newBuilder()
                .setSuccess(false)
                .setErrorCode("DUPE_INDIVIDUAL_TEAM")
                .setDriverName(dName)
                .addAllTeamNames(driverToTeamNames.get(dId))
                .build();
        return TaskResult.success(response.toByteArray());
      }
    }

    for (Map.Entry<String, List<String>> entry : driverToTeamNames.entrySet()) {
      if (entry.getValue().size() > 1) {
        String dId = entry.getKey();
        Driver d =
            drivers.stream().filter(drv -> drv.getEntityId().equals(dId)).findFirst().orElse(null);
        if (d == null) {
          d = dbService.getDriver(databaseContext, dId);
        }
        String dName = d != null ? d.getName() : dId;
        InitializeRaceResponse response =
            InitializeRaceResponse.newBuilder()
                .setSuccess(false)
                .setErrorCode("DUPE_MULTIPLE_TEAMS")
                .setDriverName(dName)
                .addAllTeamNames(entry.getValue())
                .build();
        return TaskResult.success(response.toByteArray());
      }
    }

    for (String pid : participantIds) {
      String rawId = pid.startsWith("d_") || pid.startsWith("t_") ? pid.substring(2) : pid;
      boolean isExplicitDriver = pid.startsWith("d_");
      boolean isExplicitTeam = pid.startsWith("t_");

      if (!isExplicitTeam) {
        Driver driver =
            drivers.stream().filter(d -> d.getEntityId().equals(rawId)).findFirst().orElse(null);
        if (driver != null) {
          Team driverTeam = null;
          if (!isExplicitDriver) {
            driverTeam =
                allTeams.stream()
                    .filter(t -> t.getDriverIds().contains(rawId))
                    .findFirst()
                    .orElse(null);
          }

          if (driverTeam != null) {
            participants.add(new RaceParticipant(driver, driverTeam));
          } else {
            participants.add(new RaceParticipant(driver));
          }
          continue;
        }
      }

      if (!isExplicitDriver) {
        Team team =
            teams.stream().filter(t -> t.getEntityId().equals(rawId)).findFirst().orElse(null);
        if (team != null) {
          RaceParticipant rp = new RaceParticipant(team);
          List<Driver> teamDrivers = dbService.getDrivers(databaseContext, team.getDriverIds());
          rp.setTeamDrivers(teamDrivers);
          participants.add(rp);
        }
      }
    }
    Track raceTrack =
        DatabaseService.getInstance().getTrack(databaseContext, raceModel.getTrackEntityId());

    if (raceTrack == null) {
      InitializeRaceResponse response =
          InitializeRaceResponse.newBuilder()
              .setSuccess(false)
              .setErrorCode("TRACK_DELETED")
              .build();
      return TaskResult.success(response.toByteArray());
    }

    Theme raceTheme = null;
    if (request.getThemeId() != null && !request.getThemeId().trim().isEmpty()) {
      try {
        SqliteRepository<Theme> themeRepo =
            new SqliteRepository<>(databaseContext, "themes", Theme.class);
        raceTheme = themeRepo.findByEntityId(request.getThemeId().trim());
      } catch (Exception e) {
        logger.warn("Could not load requested theme {}: {}", request.getThemeId(), e.getMessage());
      }
    }

    com.antigravity.race.Race runtimeRace = null; // fqn-collision
    try {
      runtimeRace =
          new com.antigravity.race.Race.Builder() // fqn-collision
              .model(raceModel)
              .drivers(participants)
              .track(raceTrack)
              .theme(raceTheme)
              .databaseContext(databaseContext)
              .isDemoMode(request.getIsDemoMode())
              .demoConfig(request.getDemoConfig())
              .seasonEntityId(request.getSeasonId())
              .build();

      ClientSubscriptionManager.getInstance().setRace(runtimeRace);
      runtimeRace.init();

      logger.info("Initialized race: {}", runtimeRace.getRaceModel().getName());
      AnalyticsService.getInstance().trackRaceStart(runtimeRace);

      RaceData raceDataSnapshot = runtimeRace.createSnapshot();
      runtimeRace.broadcast(raceDataSnapshot);
    } catch (IllegalArgumentException e) {
      logger.error("Validation failed during race initialization", e);
      if (runtimeRace != null) {
        runtimeRace.stop();
      }
      String errorCode = "UNKNOWN_ERROR";
      if (e.getMessage() != null && e.getMessage().contains("No custom rotations defined")) {
        errorCode = "NO_CUSTOM_ROTATIONS";
      } else if (e.getMessage() != null) {
        errorCode = e.getMessage();
      }
      InitializeRaceResponse response =
          InitializeRaceResponse.newBuilder().setSuccess(false).setErrorCode(errorCode).build();
      return TaskResult.success(response.toByteArray());
    } catch (Exception e) {
      logger.error("Failed to set or initialize race", e);
      if (runtimeRace != null) {
        runtimeRace.stop();
      }
      String errorCode = "INITIALIZATION_FAILED";
      if (e.getMessage() != null) {
        errorCode = e.getMessage();
      }
      InitializeRaceResponse response =
          InitializeRaceResponse.newBuilder().setSuccess(false).setErrorCode(errorCode).build();
      return TaskResult.success(response.toByteArray());
    }

    InitializeRaceResponse response = InitializeRaceResponse.newBuilder().setSuccess(true).build();
    return TaskResult.success(response.toByteArray());
  }

  public void startRace(Context ctx) {
    logger.info("ClientCommand received: start-race");
    try {
      com.antigravity.race.Race race = // fqn-collision
          ClientSubscriptionManager.getInstance().getRace(); // fqn-collision
      if (race == null) {
        ctx.status(404).result("No active race found");
        return;
      }

      try {
        boolean success = race.startRace();

        StartRaceResponse response =
            StartRaceResponse.newBuilder()
                .setSuccess(success)
                .setMessage(
                    success ? "Race started successfully" : "Track interface not connected.")
                .build();
        if (success) {
          ReplayLogger.logReplayCommand("startRace", null);
        }
        ctx.contentType("application/octet-stream").result(response.toByteArray());
      } catch (IllegalStateException e) {
        StartRaceResponse response =
            StartRaceResponse.newBuilder().setSuccess(false).setMessage(e.getMessage()).build();
        ctx.contentType("application/octet-stream").result(response.toByteArray());
      }

    } catch (Exception e) {
      logger.error("Error processing startRace", e);
      ctx.status(500).result("Internal Server Error: " + e.getMessage());
    }
  }

  public void pauseRace(Context ctx) {
    logger.info("ClientCommand received: pause-race");
    try {
      com.antigravity.race.Race race = // fqn-collision
          ClientSubscriptionManager.getInstance().getRace(); // fqn-collision
      if (race == null) {
        ctx.status(404).result("No active race found");
        return;
      }

      try {
        race.pauseRace();

        PauseRaceResponse response =
            PauseRaceResponse.newBuilder()
                .setSuccess(true)
                .setMessage("Race paused successfully")
                .build();
        ReplayLogger.logReplayCommand("pauseRace", null);
        ctx.contentType("application/octet-stream").result(response.toByteArray());
      } catch (IllegalStateException e) {
        PauseRaceResponse response =
            PauseRaceResponse.newBuilder().setSuccess(false).setMessage(e.getMessage()).build();
        ctx.contentType("application/octet-stream").result(response.toByteArray());
      }
    } catch (Exception e) {
      logger.error("Error processing pauseRace", e);
      ctx.status(500).result("Internal Server Error: " + e.getMessage());
    }
  }

  public void endRace(Context ctx) {
    logger.info("ClientCommand received: end-race");
    try {
      EndRaceRequest.parseFrom(ctx.bodyAsBytes());
      logger.info("End race requested via HTTP API.");
      ClientSubscriptionManager.getInstance().forceStopRace();

      EndRaceResponse response =
          EndRaceResponse.newBuilder()
              .setSuccess(true)
              .setMessage("Race ended successfully")
              .build();
      ReplayLogger.logReplayCommand("endRace", null);
      ctx.contentType("application/octet-stream").result(response.toByteArray());
    } catch (Exception e) {
      logger.error("Error processing endRace", e);
      ctx.status(500).result("Internal Server Error: " + e.getMessage());
    }
  }

  public void abortTimers(Context ctx) {
    logger.info("ClientCommand received: abort-timers");
    try {
      com.antigravity.race.Race race = // fqn-collision
          ClientSubscriptionManager.getInstance().getRace(); // fqn-collision
      if (race == null) {
        ctx.status(404).result("No active race found");
        return;
      }

      race.clearAutoTimers();
      if (race.getState() != null && !(race.getState() instanceof RaceOver)) {
        race.pauseRace();
      } else {
        race.broadcast(race.createSnapshot());
      }

      ctx.status(200);
      PauseRaceResponse response =
          PauseRaceResponse.newBuilder()
              .setSuccess(true)
              .setMessage("Timers aborted successfully")
              .build();
      ctx.contentType("application/octet-stream").result(response.toByteArray());
    } catch (Exception e) {
      logger.error("Error processing abortTimers", e);
      ctx.status(500).result("Internal Server Error: " + e.getMessage());
    }
  }

  public void nextHeat(Context ctx) {
    logger.info("ClientCommand received: next-heat");
    try {
      com.antigravity.race.Race race = // fqn-collision
          ClientSubscriptionManager.getInstance().getRace(); // fqn-collision
      if (race == null) {
        ctx.status(404).result("No active race found");
        return;
      }

      try {
        race.clearAutoTimers();
        race.moveToNextHeat();
        ClientSubscriptionManager.getInstance().autoSave(race);

        NextHeatResponse response =
            NextHeatResponse.newBuilder()
                .setSuccess(true)
                .setMessage("Moved to next heat successfully")
                .build();
        ReplayLogger.logReplayCommand("nextHeat", null);
        ctx.contentType("application/octet-stream").result(response.toByteArray());
      } catch (Exception e) {
        NextHeatResponse response =
            NextHeatResponse.newBuilder().setSuccess(false).setMessage(e.getMessage()).build();
        ctx.contentType("application/octet-stream").result(response.toByteArray());
      }
    } catch (Exception e) {
      logger.error("Error processing nextHeat", e);
      ctx.status(500).result("Internal Server Error: " + e.getMessage());
    }
  }

  public void restartHeat(Context ctx) {
    logger.info("ClientCommand received: restart-heat");
    try {
      com.antigravity.race.Race race = // fqn-collision
          ClientSubscriptionManager.getInstance().getRace(); // fqn-collision
      if (race == null) {
        ctx.status(404).result("No active race found");
        return;
      }

      try {
        race.restartHeat();
        ClientSubscriptionManager.getInstance().autoSave(race);

        RestartHeatResponse response =
            RestartHeatResponse.newBuilder()
                .setSuccess(true)
                .setMessage("Heat restarted successfully")
                .build();
        ReplayLogger.logReplayCommand("restartHeat", null);
        ctx.contentType("application/octet-stream").result(response.toByteArray());
      } catch (IllegalStateException e) {
        RestartHeatResponse response =
            RestartHeatResponse.newBuilder().setSuccess(false).setMessage(e.getMessage()).build();
        ctx.contentType("application/octet-stream").result(response.toByteArray());
      }
    } catch (Exception e) {
      logger.error("Error processing restartHeat", e);
      ctx.status(500).result("Internal Server Error: " + e.getMessage());
    }
  }

  public void skipHeat(Context ctx) {
    logger.info("ClientCommand received: skip-heat");
    try {
      com.antigravity.race.Race race = // fqn-collision
          ClientSubscriptionManager.getInstance().getRace(); // fqn-collision
      if (race == null) {
        ctx.status(404).result("No active race found");
        return;
      }

      try {
        race.skipHeat();
        ClientSubscriptionManager.getInstance().autoSave(race);

        SkipHeatResponse response =
            SkipHeatResponse.newBuilder()
                .setSuccess(true)
                .setMessage("Heat skipped successfully")
                .build();
        ReplayLogger.logReplayCommand("skipHeat", null);
        ctx.contentType("application/octet-stream").result(response.toByteArray());
      } catch (IllegalStateException e) {
        SkipHeatResponse response =
            SkipHeatResponse.newBuilder().setSuccess(false).setMessage(e.getMessage()).build();
        ctx.contentType("application/octet-stream").result(response.toByteArray());
      }
    } catch (Exception e) {
      logger.error("Error processing skipHeat", e);
      ctx.status(500).result("Internal Server Error: " + e.getMessage());
    }
  }

  public void skipRace(Context ctx) {
    logger.info("ClientCommand received: skip-race");
    try {
      com.antigravity.race.Race race = // fqn-collision
          ClientSubscriptionManager.getInstance().getRace(); // fqn-collision
      if (race == null) {
        ctx.status(404).result("No active race found");
        return;
      }

      if (race.getState() instanceof RaceOver) {
        SkipRaceResponse response =
            SkipRaceResponse.newBuilder()
                .setSuccess(false)
                .setMessage("Race is already over")
                .build();
        ctx.contentType("application/octet-stream").result(response.toByteArray());
        return;
      }

      try {
        race.skipRace();
        ClientSubscriptionManager.getInstance().autoSave(race);

        SkipRaceResponse response =
            SkipRaceResponse.newBuilder()
                .setSuccess(true)
                .setMessage("Race skipped successfully")
                .build();
        ReplayLogger.logReplayCommand("skipRace", null);
        ctx.contentType("application/octet-stream").result(response.toByteArray());
      } catch (IllegalStateException e) {
        SkipRaceResponse response =
            SkipRaceResponse.newBuilder().setSuccess(false).setMessage(e.getMessage()).build();
        ctx.contentType("application/octet-stream").result(response.toByteArray());
      }
    } catch (Exception e) {
      logger.error("Error processing skipRace", e);
      ctx.status(500).result("Internal Server Error: " + e.getMessage());
    }
  }

  public void deferHeat(Context ctx) {
    logger.info("ClientCommand received: defer-heat");
    ReplayLogger.logReplayCommand("deferHeat", null);
    try {
      com.antigravity.race.Race race = // fqn-collision
          ClientSubscriptionManager.getInstance().getRace(); // fqn-collision
      if (race == null) {
        ctx.status(404).result("No active race found");
        return;
      }

      try {
        race.deferHeat();
        ClientSubscriptionManager.getInstance().autoSave(race);

        DeferHeatResponse response = DeferHeatResponse.newBuilder().setSuccess(true).build();
        ctx.contentType("application/octet-stream").result(response.toByteArray());
      } catch (IllegalStateException e) {
        DeferHeatResponse response = DeferHeatResponse.newBuilder().setSuccess(false).build();
        ctx.contentType("application/octet-stream").result(response.toByteArray());
      }
    } catch (Exception e) {
      logger.error("Error processing deferHeat", e);
      ctx.status(500).result("Internal Server Error: " + e.getMessage());
    }
  }

  public void modifyHeats(Context ctx) {
    try {
      ModifyHeatsRequest request = ModifyHeatsRequest.parseFrom(ctx.bodyAsBytes());
      com.antigravity.race.Race race = // fqn-collision
          ClientSubscriptionManager.getInstance().getRace(); // fqn-collision
      if (race == null) {
        ctx.status(404).result("No active race found");
        return;
      }

      ModifyHeatsResponse response = race.modifyHeats(request);
      ReplayLogger.logReplayCommand(
          "modifyHeats",
          ReplayLogger.mapOf(
              "requestBase64", Base64.getEncoder().encodeToString(request.toByteArray())));
      ctx.contentType("application/octet-stream").result(response.toByteArray());
    } catch (Exception e) {
      logger.error("Error modifying heats", e);
      ctx.status(500).result("Internal Server Error: " + e.getMessage());
    }
  }

  public void regenerateHeats(Context ctx) {
    try {
      RegenerateHeatsRequest request = RegenerateHeatsRequest.parseFrom(ctx.bodyAsBytes());
      com.antigravity.race.Race race = // fqn-collision
          ClientSubscriptionManager.getInstance().getRace(); // fqn-collision
      if (race == null) {
        ctx.status(404).result("No active race found");
        return;
      }

      RegenerateHeatsResponse response = race.regenerateHeats(request);
      ReplayLogger.logReplayCommand(
          "regenerateHeats",
          ReplayLogger.mapOf(
              "requestBase64", Base64.getEncoder().encodeToString(request.toByteArray())));
      ctx.contentType("application/octet-stream").result(response.toByteArray());
    } catch (Exception e) {
      logger.error("Error regenerating heats", e);
      ctx.status(500).result("Internal Server Error: " + e.getMessage());
    }
  }

  public void finalizeModifyHeats(Context ctx) {
    try {
      com.antigravity.race.Race race = // fqn-collision
          ClientSubscriptionManager.getInstance().getRace(); // fqn-collision
      if (race == null) {
        ctx.status(404).result("No active race found");
        return;
      }

      boolean allStarted = !race.getHeats().isEmpty();
      Heat firstUnstarted = null;
      for (Heat h : race.getHeats()) {
        if (!h.isStarted()) {
          allStarted = false;
          if (firstUnstarted == null) {
            firstUnstarted = h;
          }
        }
      }

      if (allStarted && !(race.getState() instanceof RaceOver)) {
        race.changeState(new RaceOver());
      } else if (race.getCurrentHeat() != null
          && race.getCurrentHeat().isStarted()
          && race.getState() instanceof NotStarted) {
        if (firstUnstarted != null) {
          race.setCurrentHeat(firstUnstarted);
          race.broadcast(race.createSnapshot());
        } else {
          race.changeState(new RaceOver());
        }
      }
      ReplayLogger.logReplayCommand("finalizeModifyHeats", null);
      ctx.status(200).result("OK");
    } catch (Exception e) {
      logger.error("Error finalizing modify heats", e);
      ctx.status(500).result("Internal Server Error: " + e.getMessage());
    }
  }
}
