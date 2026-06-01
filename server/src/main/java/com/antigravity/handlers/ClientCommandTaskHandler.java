package com.antigravity.handlers;

import com.antigravity.auth.Role;
import com.antigravity.context.DatabaseContext;
import com.antigravity.converters.ArduinoConfigConverter;
import com.antigravity.models.AnalyticsToggleRequest;
import com.antigravity.models.Driver;
import com.antigravity.models.Race;
import com.antigravity.models.Team;
import com.antigravity.models.TeamOptions;
import com.antigravity.models.Track;
import com.antigravity.proto.DeferHeatResponse;
import com.antigravity.proto.EndRaceRequest;
import com.antigravity.proto.EndRaceResponse;
import com.antigravity.proto.InitializeInterfaceRequest;
import com.antigravity.proto.InitializeInterfaceResponse;
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
import com.antigravity.proto.SetInterfacePinStateRequest;
import com.antigravity.proto.SetInterfacePinStateResponse;
import com.antigravity.proto.SetInterfaceRgbLedStateRequest;
import com.antigravity.proto.SetInterfaceRgbLedStateResponse;
import com.antigravity.proto.SkipHeatResponse;
import com.antigravity.proto.StartRaceResponse;
import com.antigravity.proto.UpdateInterfaceConfigRequest;
import com.antigravity.proto.UpdateInterfaceConfigResponse;
import com.antigravity.protocols.CarLocation;
import com.antigravity.protocols.IProtocol;
import com.antigravity.protocols.ProtocolDelegate;
import com.antigravity.protocols.TestInterfaceListener;
import com.antigravity.protocols.arduino.ArduinoConfig;
import com.antigravity.protocols.arduino.ArduinoProtocol;
import com.antigravity.protocols.interfaces.SerialConnection;
import com.antigravity.race.ClientSubscriptionManager;
import com.antigravity.race.DriverHeatData;
import com.antigravity.race.Heat;
import com.antigravity.race.OverallStandings;
import com.antigravity.race.RaceParticipant;
import com.antigravity.race.RaceSaveData;
import com.antigravity.race.states.RaceOver;
import com.antigravity.race.states.Racing;
import com.antigravity.service.AnalyticsService;
import com.antigravity.service.DatabaseService;
import com.antigravity.util.CsvExporter;
import com.antigravity.util.NetworkUtils;
import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.google.protobuf.InvalidProtocolBufferException;
import io.javalin.Javalin;
import io.javalin.http.Context;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.bson.types.ObjectId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@SuppressWarnings("checkstyle:FileLength")
public class ClientCommandTaskHandler {

  private static final Logger logger = LoggerFactory.getLogger(ClientCommandTaskHandler.class);
  private final DatabaseContext databaseContext;

  public ClientCommandTaskHandler(DatabaseContext databaseContext, Javalin app) {
    this.databaseContext = databaseContext;
    app.post("/api/initialize-race", this::initializeRace, Role.DIRECTOR);
    app.post("/api/start-race", this::startRace, Role.DIRECTOR);
    app.post("/api/pause-race", this::pauseRace, Role.DIRECTOR);
    app.post("/api/end-race", this::endRace, Role.DIRECTOR);
    app.post("/api/next-heat", this::nextHeat, Role.DIRECTOR);
    app.post("/api/restart-heat", this::restartHeat, Role.DIRECTOR);
    app.post("/api/skip-heat", this::skipHeat, Role.DIRECTOR);
    app.post("/api/defer-heat", this::deferHeat, Role.DIRECTOR);
    app.post("/api/abort-timers", this::abortTimers, Role.DIRECTOR);
    app.post("/api/update-interface-config", this::updateInterfaceConfig, Role.DIRECTOR);
    app.post("/api/initialize-interface", this::initializeInterface, Role.DIRECTOR);
    app.post("/api/set-interface-pin-state", this::setInterfacePinState, Role.DIRECTOR);
    app.post("/api/set-interface-rgb-led-state", this::setInterfaceRgbLedState, Role.DIRECTOR);
    app.post("/api/close-interface", this::closeInterface, Role.DIRECTOR);
    app.post(
        "/api/races/current-heat/drivers/{lane}/actual-driver",
        this::changeActualDriver,
        Role.DIRECTOR);
    app.post(
        "/api/races/current-heat/drivers/{lane}/user-laps", this::updateUserLaps, Role.DIRECTOR);
    app.post(
        "/api/races/current-heat/drivers/{fromLane}/change-lane/{toLane}",
        this::changeLane,
        Role.DIRECTOR);
    app.get("/api/serial-ports", this::getSerialPorts, Role.VIEWER);
    app.get("/api/races/current/export-csv", this::exportRaceCsv, Role.VIEWER);
    app.post("/api/save-race", this::saveRace, Role.DIRECTOR);
    app.get("/api/saved-races", this::getSavedRaces, Role.VIEWER);
    app.delete("/api/saved-races/{filename}", this::deleteSavedRace, Role.DIRECTOR);
    app.post("/api/delete-saved-race/{filename}", this::deleteSavedRace, Role.DIRECTOR);
    app.post("/api/load-race", this::loadRace, Role.DIRECTOR);
    app.post("/api/analytics/toggle", this::toggleAnalytics, Role.ADMIN);
    app.get("/api/analytics/config", this::getAnalyticsConfig, Role.VIEWER);
    app.post("/api/modify-heats", this::modifyHeats, Role.DIRECTOR);
    app.post("/api/regenerate-heats", this::regenerateHeats, Role.DIRECTOR);
    app.post("/api/finalize-modify-heats", this::finalizeModifyHeats, Role.DIRECTOR);
  }

  private void initializeRace(Context ctx) {
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

  static class TaskResult {

    int status = 200;
    String contentType;
    Object result;

    static TaskResult success(byte[] data) {
      TaskResult r = new TaskResult();
      r.contentType = "application/octet-stream";
      r.result = data;
      return r;
    }

    static TaskResult error(int status, String message) {
      TaskResult r = new TaskResult();
      r.status = status;
      r.result = message;
      return r;
    }
  }

  // Visible for testing
  @SuppressWarnings("checkstyle:MethodLength")
  TaskResult handleInitializeRace(InitializeRaceRequest request) throws Exception {
    DatabaseService dbService = DatabaseService.getInstance();
    Race raceModel = dbService.getRace(databaseContext.getDatabase(), request.getRaceId());

    if (raceModel == null) {
      return TaskResult.error(404, "Race not found");
    }

    if (ClientSubscriptionManager.getInstance().hasDirectorSubscribers()
        && ClientSubscriptionManager.getInstance().getRace() != null
        && ClientSubscriptionManager.getInstance().getRace().isActive()) {
      return TaskResult.error(409, "Cannot start new race while client is watching an active race");
    }

    // Create the runtime race instance
    List<String> participantIds = request.getDriverIdsList();
    List<String> rawIds =
        participantIds.stream()
            .map(id -> id.startsWith("d_") || id.startsWith("t_") ? id.substring(2) : id)
            .collect(Collectors.toList());

    List<Driver> drivers = dbService.getDrivers(databaseContext.getDatabase(), rawIds);
    List<Team> teams = dbService.getTeams(databaseContext.getDatabase(), rawIds);

    // Map IDs back to objects maintaining order
    List<RaceParticipant> participants = new ArrayList<>();
    List<Team> allTeams = dbService.getAllTeams(databaseContext.getDatabase());

    // --- Validation Logic ---
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

    // Rule 1: Individual vs Team
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

    // Rule 2: Multiple Teams
    for (Map.Entry<String, List<String>> entry : driverToTeamNames.entrySet()) {
      if (entry.getValue().size() > 1) {
        String dId = entry.getKey();
        // Driver might not be in the explicit 'drivers' list if they were only in teams
        Driver d =
            drivers.stream().filter(drv -> drv.getEntityId().equals(dId)).findFirst().orElse(null);
        if (d == null) {
          d = dbService.getDriver(databaseContext.getDatabase(), dId);
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
    // --- End Validation ---

    for (String pid : participantIds) {
      String rawId = pid.startsWith("d_") || pid.startsWith("t_") ? pid.substring(2) : pid;
      boolean isExplicitDriver = pid.startsWith("d_");
      boolean isExplicitTeam = pid.startsWith("t_");

      // Try finding in drivers
      if (!isExplicitTeam) {
        Driver driver =
            drivers.stream().filter(d -> d.getEntityId().equals(rawId)).findFirst().orElse(null);
        if (driver != null) {
          // Find if driver belongs to a team (always check, even if explicitly asked for
          // driver)
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

      // Try finding in teams
      if (!isExplicitDriver) {
        Team team =
            teams.stream().filter(t -> t.getEntityId().equals(rawId)).findFirst().orElse(null);
        if (team != null) {
          RaceParticipant rp = new RaceParticipant(team);
          // Populate team drivers
          List<Driver> teamDrivers =
              dbService.getDrivers(databaseContext.getDatabase(), team.getDriverIds());

          logger.debug("Hydrating team {} with IDs: {}", team.getName(), team.getDriverIds());
          logger.debug("Found {} drivers in DB.", teamDrivers.size());

          rp.setTeamDrivers(teamDrivers);
          participants.add(rp);
        }
      }
    }
    Track raceTrack =
        DatabaseService.getInstance()
            .getTrack(databaseContext.getDatabase(), raceModel.getTrackEntityId());

    com.antigravity.race.Race runtimeRace = null; // fqn-collision
    try {
      runtimeRace =
          new com.antigravity.race.Race.Builder() // fqn-collision
              .model(raceModel)
              .drivers(participants)
              .track(raceTrack)
              .databaseContext(databaseContext)
              .isDemoMode(request.getIsDemoMode())
              .demoConfig(request.getDemoConfig())
              .build();

      ClientSubscriptionManager.getInstance().setRace(runtimeRace);
      runtimeRace.init();
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

    logger.info("Initialized race: {}", runtimeRace.getRaceModel().getName());
    AnalyticsService.getInstance().trackRaceStart(runtimeRace);

    // Track track = race.getTrack();

    RaceData raceDataSnapshot = runtimeRace.createSnapshot();
    runtimeRace.broadcast(raceDataSnapshot);

    InitializeRaceResponse response = InitializeRaceResponse.newBuilder().setSuccess(true).build();
    return TaskResult.success(response.toByteArray());
  }

  private void startRace(Context ctx) {
    try {
      com.antigravity.race.Race race = // fqn-collision
          ClientSubscriptionManager.getInstance().getRace();
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

  private void pauseRace(Context ctx) {
    try {
      com.antigravity.race.Race race = // fqn-collision
          ClientSubscriptionManager.getInstance().getRace();
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

  void endRace(Context ctx) {
    try {
      EndRaceRequest.parseFrom(ctx.bodyAsBytes()); // Validate payload
      logger.info("End race requested via HTTP API.");
      ClientSubscriptionManager.getInstance().forceStopRace();

      EndRaceResponse response =
          EndRaceResponse.newBuilder()
              .setSuccess(true)
              .setMessage("Race ended successfully")
              .build();
      ctx.contentType("application/octet-stream").result(response.toByteArray());
    } catch (Exception e) {
      logger.error("Error processing endRace", e);
      ctx.status(500).result("Internal Server Error: " + e.getMessage());
    }
  }

  void abortTimers(Context ctx) {
    try {
      com.antigravity.race.Race race = // fqn-collision
          ClientSubscriptionManager.getInstance().getRace();
      if (race == null) {
        ctx.status(404).result("No active race found");
        return;
      }

      race.clearAutoTimers();
      // If we're in Starting or HeatOver, a pause is the appropriate state transition
      // for an "abort" action.
      race.pauseRace();

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

  private void nextHeat(Context ctx) {
    try {
      com.antigravity.race.Race race = // fqn-collision
          ClientSubscriptionManager.getInstance().getRace();
      if (race == null) {
        ctx.status(404).result("No active race found");
        return;
      }

      try {
        race.moveToNextHeat();
        ClientSubscriptionManager.getInstance().autoSave(race);

        NextHeatResponse response =
            NextHeatResponse.newBuilder()
                .setSuccess(true)
                .setMessage("Moved to next heat successfully")
                .build();
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

  private void restartHeat(Context ctx) {
    try {
      com.antigravity.race.Race race = // fqn-collision
          ClientSubscriptionManager.getInstance().getRace();
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

  private void skipHeat(Context ctx) {
    try {
      com.antigravity.race.Race race = // fqn-collision
          ClientSubscriptionManager.getInstance().getRace();
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

  private void deferHeat(Context ctx) {
    try {
      com.antigravity.race.Race race = // fqn-collision
          ClientSubscriptionManager.getInstance().getRace();
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

  private void updateInterfaceConfig(Context ctx) {
    try {
      UpdateInterfaceConfigRequest request =
          UpdateInterfaceConfigRequest.parseFrom(ctx.bodyAsBytes());
      ArduinoConfig config = ArduinoConfigConverter.fromProto(request.getConfig());
      int interfaceIndex = request.getInterfaceIndex();

      ProtocolDelegate current = ClientSubscriptionManager.getInstance().getProtocol();
      ArduinoProtocol target = null;

      if (current != null) {
        List<IProtocol> protocols = current.getProtocols();
        if (interfaceIndex >= 0 && interfaceIndex < protocols.size()) {
          IProtocol p = protocols.get(interfaceIndex);
          if (p instanceof ArduinoProtocol) {
            target = (ArduinoProtocol) p;
          }
        }
      }

      if (target != null) {
        target.updateConfig(config);

        UpdateInterfaceConfigResponse response =
            UpdateInterfaceConfigResponse.newBuilder()
                .setSuccess(true)
                .setMessage("Configuration updated")
                .build();
        ctx.contentType("application/octet-stream").result(response.toByteArray());
      } else {
        String errMsg = "Target interface index " + interfaceIndex + " is invalid. ";
        if (current == null) {
          errMsg += "Current protocol delegate is null. ";
        } else {
          errMsg += "Protocol list size is " + current.getProtocols().size() + ". ";
        }
        UpdateInterfaceConfigResponse response =
            UpdateInterfaceConfigResponse.newBuilder().setSuccess(false).setMessage(errMsg).build();
        ctx.contentType("application/octet-stream").result(response.toByteArray());
      }
    } catch (Exception e) {
      logger.error("Error updating interface config", e);
      ctx.status(500).result("Internal Server Error: " + e.toString());
    }
  }

  private void initializeInterface(Context ctx) {
    try {
      InitializeInterfaceRequest request = InitializeInterfaceRequest.parseFrom(ctx.bodyAsBytes());

      List<IProtocol> protocols = new ArrayList<>();
      List<com.antigravity.proto.ArduinoConfig> configsList = // fqn-collision
          request.getConfigsList();
      for (int i = 0; i < configsList.size(); i++) {
        com.antigravity.proto.ArduinoConfig protoConfig = configsList.get(i); // fqn-collision
        ArduinoConfig config = ArduinoConfigConverter.fromProto(protoConfig);
        ArduinoProtocol arduino = new ArduinoProtocol(config, request.getLaneCount(), null);
        arduino.setInterfaceIndex(i);
        arduino.setListener(new TestInterfaceListener());
        protocols.add(arduino);
      }

      ProtocolDelegate finalProtocol;
      if (protocols.size() >= 1) {
        finalProtocol = new ProtocolDelegate(protocols);
      } else {
        throw new IllegalArgumentException("No configurations provided for initialization");
      }

      // ClientSubscriptionManager handles mutual exclusion in setProtocol
      ClientSubscriptionManager.getInstance().setProtocol(finalProtocol);

      boolean success = finalProtocol.open();
      InitializeInterfaceResponse response =
          InitializeInterfaceResponse.newBuilder()
              .setSuccess(success)
              .setMessage(
                  success
                      ? "Interfaces initialized successfully"
                      : "Failed to open one or more interfaces")
              .build();
      ctx.contentType("application/octet-stream").result(response.toByteArray());
    } catch (IllegalStateException e) {
      ctx.status(409).result(e.getMessage());
    } catch (InvalidProtocolBufferException e) {
      ctx.status(400).result("Invalid message: " + e.getMessage());
    } catch (Exception e) {
      logger.error("Error initializing interface", e);
      ctx.status(500).result("Internal Server Error: " + e.toString());
    }
  }

  private void changeLane(Context ctx) {
    try {
      int fromLane = Integer.parseInt(ctx.pathParam("fromLane"));
      int toLane = Integer.parseInt(ctx.pathParam("toLane"));

      com.antigravity.race.Race race = // fqn-collision
          ClientSubscriptionManager.getInstance().getRace();
      if (race == null) {
        ctx.status(404).result("No active race found");
        return;
      }

      race.changeLane(fromLane, toLane);
      ctx.status(200).result("Lane changed");
    } catch (Exception e) {
      logger.error("Error changing lane", e);
      ctx.status(500).result("Internal Server Error: " + e.getMessage());
    }
  }

  private void getSerialPorts(Context ctx) {
    try {
      List<String> ports = SerialConnection.getAvailableSerialPorts();
      ctx.json(ports);
    } catch (Exception e) {
      logger.error("Error getting serial ports", e);
      ctx.status(500).result("Internal Server Error: " + e.getMessage());
    }
  }

  private void setInterfacePinState(Context ctx) {
    try {
      SetInterfacePinStateRequest request =
          SetInterfacePinStateRequest.parseFrom(ctx.bodyAsBytes());
      int interfaceIndex = request.getInterfaceIndex();

      ProtocolDelegate current = ClientSubscriptionManager.getInstance().getProtocol();
      ArduinoProtocol target = null;

      if (current != null) {
        List<IProtocol> protocols = current.getProtocols();
        if (interfaceIndex >= 0 && interfaceIndex < protocols.size()) {
          IProtocol p = protocols.get(interfaceIndex);
          if (p instanceof ArduinoProtocol) {
            target = (ArduinoProtocol) p;
          }
        }
      }

      if (target != null) {
        target.setPinState(request.getIsDigital(), request.getPin(), request.getIsHigh());

        SetInterfacePinStateResponse response =
            SetInterfacePinStateResponse.newBuilder()
                .setSuccess(true)
                .setMessage("Pin state command sent")
                .build();
        ctx.contentType("application/octet-stream").result(response.toByteArray());
      } else {
        SetInterfacePinStateResponse response =
            SetInterfacePinStateResponse.newBuilder()
                .setSuccess(false)
                .setMessage(
                    "Target interface index "
                        + interfaceIndex
                        + " is invalid or not an ArduinoProtocol")
                .build();
        ctx.contentType("application/octet-stream").result(response.toByteArray());
      }
    } catch (Exception e) {
      logger.error("Error setting interface pin state", e);
      ctx.status(500).result("Internal Server Error: " + e.toString());
    }
  }

  private void setInterfaceRgbLedState(Context ctx) {
    try {
      SetInterfaceRgbLedStateRequest request =
          SetInterfaceRgbLedStateRequest.parseFrom(ctx.bodyAsBytes());
      int interfaceIndex = request.getInterfaceIndex();

      ProtocolDelegate current = ClientSubscriptionManager.getInstance().getProtocol();
      ArduinoProtocol target = null;

      if (current != null) {
        List<IProtocol> protocols = current.getProtocols();
        if (interfaceIndex >= 0 && interfaceIndex < protocols.size()) {
          IProtocol p = protocols.get(interfaceIndex);
          if (p instanceof ArduinoProtocol) {
            target = (ArduinoProtocol) p;
          }
        }
      }

      if (target != null) {
        target.setStringRgbLedValues(request.getPin(), request.getLedsList());

        SetInterfaceRgbLedStateResponse response =
            SetInterfaceRgbLedStateResponse.newBuilder()
                .setSuccess(true)
                .setMessage("RGB LED state command sent")
                .build();
        ctx.contentType("application/octet-stream").result(response.toByteArray());
      } else {
        SetInterfaceRgbLedStateResponse response =
            SetInterfaceRgbLedStateResponse.newBuilder()
                .setSuccess(false)
                .setMessage(
                    "Target interface index "
                        + interfaceIndex
                        + " is invalid or not an ArduinoProtocol")
                .build();
        ctx.contentType("application/octet-stream").result(response.toByteArray());
      }
    } catch (Exception e) {
      logger.error("Error setting interface RGB LED state", e);
      ctx.status(500).result("Internal Server Error: " + e.toString());
    }
  }

  private void closeInterface(Context ctx) {
    try {
      logger.info("Explicit close-interface requested");
      ClientSubscriptionManager.getInstance().setProtocol(null);
      ctx.status(200).result("OK");
    } catch (Exception e) {
      logger.error("Error closing interface", e);
      ctx.status(500).result("Error closing interface: " + e.getMessage());
    }
  }

  @SuppressWarnings("unchecked")
  private void changeActualDriver(Context ctx) {
    try {
      int lane = Integer.parseInt(ctx.pathParam("lane"));
      Map<String, String> body = ctx.bodyAsClass(HashMap.class);
      String driverId = body.get("driverId");

      com.antigravity.race.Race race = // fqn-collision
          ClientSubscriptionManager.getInstance().getRace();
      if (race == null) {
        ctx.status(404).result("No active race found");
        return;
      }

      List<DriverHeatData> drivers = race.getCurrentHeat().getDrivers();
      if (lane >= 0 && lane < drivers.size()) {
        DriverHeatData dhd = drivers.get(lane);
        DatabaseService dbService = DatabaseService.getInstance();
        List<Driver> driversList =
            dbService.getDrivers(
                databaseContext.getDatabase(), Collections.singletonList(driverId));
        Driver driver = driversList.isEmpty() ? null : driversList.get(0);

        if (driver != null) {
          TeamOptions options = race.getRaceModel().getTeamOptions();
          if (options != null
              && options.isRequirePitStopChangeDriver()
              && race.getState() instanceof Racing) {
            CarLocation loc = dhd.getCurrentLocation();
            boolean inPit =
                loc == CarLocation.PitRow
                    || (loc != null
                        && loc.getValue() >= CarLocation.PitBayBase.getValue()
                        && loc.getValue()
                            < CarLocation.PitBayBase.getValue()
                                + race.getTrack().getLanes().size());
            if (!inPit) {
              ctx.status(403).result("RD_ERR_DRIVER_CHANGE_NOT_IN_PIT");
              return;
            }
          }
          dhd.setActualDriver(driver);
          race.updateAndBroadcastOverallStandings();
          race.broadcast(race.createSnapshot());
          ctx.status(200);
        } else {
          ctx.status(404).result("RD_ERR_DRIVER_NOT_FOUND");
        }
      } else {
        ctx.status(400).result("Invalid lane index: " + lane);
      }
    } catch (Exception e) {
      ctx.status(500).result("Error: " + e.getMessage());
    }
  }

  @SuppressWarnings("unchecked")
  void updateUserLaps(Context ctx) {
    try {
      updateUserLaps(ctx, getPathParamMap(ctx), getBody(ctx));
    } catch (Exception e) {
      ctx.status(500).result("Error: " + e.getMessage());
    }
  }

  void updateUserLaps(Context ctx, Map<String, String> pathParams, Map<String, Object> body) {
    try {
      int lane = Integer.parseInt(pathParams.get("lane"));
      com.antigravity.race.Race race = // fqn-collision
          ClientSubscriptionManager.getInstance().getRace();
      if (race == null) {
        ctx.status(404).result("No active race found");
        return;
      }

      List<DriverHeatData> drivers = race.getCurrentHeat().getDrivers();
      if (lane >= 0 && lane < drivers.size()) {
        DriverHeatData dhd = drivers.get(lane);
        if (body.containsKey("userLaps")) {
          double value = ((Number) body.get("userLaps")).doubleValue();
          dhd.setUserLaps(value);

          // Recalculate standings because laps changed
          race.getCurrentHeat().initializeStandings(race.getRaceModel().getHeatScoring());
          race.updateAndBroadcastOverallStandings();
          race.updateScoreRecords();
          race.broadcast(race.createSnapshot());

          ctx.status(200)
              .json(Collections.singletonMap("adjustedLapCount", dhd.getAdjustedLapCount()));
        } else {
          ctx.status(400).result("Missing userLaps in body");
        }
      } else {
        ctx.status(400).result("Invalid lane index: " + lane);
      }
    } catch (Exception e) {
      ctx.status(500).result("Error: " + e.getMessage());
    }
  }

  private void exportRaceCsv(Context ctx) {
    try {
      com.antigravity.race.Race race = // fqn-collision
          ClientSubscriptionManager.getInstance().getRace();
      if (race == null) {
        ctx.status(404).result("No active race found");
        return;
      }

      String csv;
      synchronized (race) {
        OverallStandings standings =
            new OverallStandings(
                race.getRaceModel().getHeatScoring(),
                race.getRaceModel().getOverallScoring(),
                race.getRaceModel().getGroupOptions());
        standings.recalculate(race.getDrivers(), race.getHeats());
        csv = CsvExporter.export(race);
      }

      ctx.contentType("text/csv")
          .header("Content-Disposition", "attachment; filename=\"race_export.csv\"")
          .result(csv);
    } catch (Exception e) {
      logger.error("Error exporting CSV", e);
      ctx.status(500).result("Internal Server Error: " + e.getMessage());
    }
  }

  void saveRace(Context ctx) {
    try {
      com.antigravity.race.Race race = // fqn-collision
          ClientSubscriptionManager.getInstance().getRace();
      if (race == null) {
        ctx.status(404).result("No active race found");
        return;
      }

      if (race.getState() instanceof Racing) {
        ctx.status(400).result("Cannot save race while in racing state");
        return;
      }

      RaceSaveData saveData = new RaceSaveData();
      saveData.setModel(race.getRaceModel());
      saveData.setTrack(race.getTrack());
      saveData.setDrivers(race.getDrivers());
      saveData.setHeats(race.getHeats());
      saveData.setStateClassName(race.getState().getClass().getName());
      saveData.setAccumulatedRaceTime(race.getRaceTime());
      saveData.setHasRacedInCurrentHeat(race.hasRacedInCurrentHeat());
      saveData.setCurrentHeatIndex(race.getHeats().indexOf(race.getCurrentHeat()));

      // We need to know if it's demo mode.
      // Protocols list isn't exposed directly with its type, but createProtocols
      // takes isDemoMode.
      // We can check if protocols has Demo protocol or check the parameter passed on
      // init.
      // Currently, it's not saved on the Race object.
      // Let's assume for now, or check if any protocol is Demo.
      saveData.setDemoMode(race.isDemoMode());
      saveData.setStatistics(race.getStatistics());
      saveData.setAutoSave(false);

      LocalDateTime now = LocalDateTime.now();
      DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss");
      String timestamp = now.format(formatter);
      String raceName = race.getRaceModel() != null ? race.getRaceModel().getName() : "Race";
      raceName = raceName.replaceAll("[^a-zA-Z0-9_-]", "_");
      String saveName = timestamp + "_" + raceName + ".json";
      saveData.setSaveName(saveName);

      DatabaseService dbService = DatabaseService.getInstance();
      dbService.saveManualRace(databaseContext.getDatabase(), saveData);

      ctx.status(200).result("Race saved successfully: " + saveName);
    } catch (Exception e) {
      logger.error("Error saving race", e);
      ctx.status(500).result("Internal Server Error: " + e.getMessage());
    }
  }

  void getSavedRaces(Context ctx) {
    try {
      boolean isDemo = "true".equals(ctx.queryParam("demo"));
      DatabaseService dbService = DatabaseService.getInstance();
      List<RaceSaveData> saves = dbService.getSavedRaces(databaseContext.getDatabase(), isDemo);
      List<String> files =
          saves.stream().map(RaceSaveData::getSaveName).collect(Collectors.toList());
      ObjectMapper mapper = getObjectMapper();
      ctx.contentType("application/json").result(mapper.writeValueAsString(files));
    } catch (Exception e) {
      logger.error("Error getting saved races", e);
      ctx.status(500).result("Error: " + e.getMessage());
    }
  }

  void deleteSavedRace(Context ctx) {
    String saveName = ctx.pathParam("filename");
    try {
      boolean isDemo = "true".equals(ctx.queryParam("demo"));
      DatabaseService dbService = DatabaseService.getInstance();
      boolean deleted = dbService.deleteSavedRace(databaseContext.getDatabase(), saveName, isDemo);
      if (deleted) {
        ctx.status(200).result("Save deleted: " + saveName);
      } else {
        ctx.status(404).result("Save not found or failed to delete: " + saveName);
      }
    } catch (Exception e) {
      logger.error("Error deleting saved race: {}", saveName, e);
      ctx.status(500).result("Error: " + e.getMessage());
    }
  }

  @SuppressWarnings("unchecked")
  private void loadRace(Context ctx) {
    try {
      Map<String, Object> body = ctx.bodyAsClass(HashMap.class);
      String saveName = (String) body.get("filename");
      boolean isDemo = Boolean.TRUE.equals(body.get("isDemo"));
      if (saveName == null) {
        ctx.status(400).result("Filename is required");
        return;
      }

      DatabaseService dbService = DatabaseService.getInstance();
      RaceSaveData saveData =
          dbService.getSavedRace(databaseContext.getDatabase(), saveName, isDemo);

      if (saveData == null) {
        ctx.status(404).result("Save file not found");
        return;
      }

      // Compare Track
      Track savedTrack = saveData.getTrack();
      Track dbTrack =
          DatabaseService.getInstance()
              .getTrack(databaseContext.getDatabase(), saveData.getModel().getTrackEntityId());

      Track trackToUse = savedTrack;
      if (dbTrack != null && dbTrack.getLanes().size() == savedTrack.getLanes().size()) {
        trackToUse = dbTrack;
      }

      // Re-initialize Standings
      if (saveData.getHeats() != null) {
        for (Heat heat : saveData.getHeats()) {
          heat.initializeStandings(saveData.getModel().getHeatScoring());
        }
      }

      // Recreate Race
      com.antigravity.race.Race race = // fqn-collision
          new com.antigravity.race.Race.Builder() // fqn-collision
              .model(saveData.getModel())
              .drivers(saveData.getDrivers())
              .track(trackToUse)
              .heats(saveData.getHeats())
              .currentHeatIndex(saveData.getCurrentHeatIndex())
              .accumulatedRaceTime(saveData.getAccumulatedRaceTime())
              .hasRacedInCurrentHeat(saveData.isHasRacedInCurrentHeat())
              .autoStartFired(saveData.isAutoStartFired())
              .autoAdvanceFired(saveData.isAutoAdvanceFired())
              .stateClassName(saveData.getStateClassName())
              .isDemoMode(saveData.isDemoMode())
              .statistics(saveData.getStatistics())
              .databaseContext(databaseContext)
              .build();

      ClientSubscriptionManager.getInstance().setRace(race);
      race.init(); // Open protocols
      AnalyticsService.getInstance().trackRaceStart(race);

      ctx.status(200).result("Race loaded successfully");
    } catch (Exception e) {
      logger.error("Error loading race", e);
      ctx.status(500).result("Internal Server Error: " + e.getMessage());
    }
  }

  void getAnalyticsConfig(Context ctx) {
    Map<String, String> config = new HashMap<>();
    config.put("clientId", AnalyticsService.getInstance().getClientId());
    config.put("measurementId", AnalyticsService.getInstance().getMeasurementId());
    setJson(ctx, config);
  }

  void toggleAnalytics(Context ctx) {
    String remoteAddr = getRemoteAddr(ctx);
    String remoteHost = getRemoteHost(ctx);

    boolean isLocalhost = NetworkUtils.isLocalhost(remoteAddr, remoteHost);

    if (!isLocalhost) {
      setStatus(ctx, 403);
      setResult(
          ctx,
          "Analytics settings can only be changed from a local connection. Detected: "
              + remoteAddr);
      return;
    }

    try {
      ObjectMapper mapper = getObjectMapper();
      AnalyticsToggleRequest request =
          mapper.readValue(getBodyBytes(ctx), AnalyticsToggleRequest.class);
      if (request == null) {
        setStatus(ctx, 400);
        setResult(ctx, "Invalid request body. Expected JSON with 'enabled' field.");
        return;
      }

      boolean enabled = request.isEnabled();
      AnalyticsService.getInstance().setUserEnabled(enabled);
      setStatus(ctx, 200);
      setResult(ctx, "Analytics status updated to " + enabled);
    } catch (Exception e) {
      setStatus(ctx, 500);
      setResult(ctx, "Internal Error: " + e.getMessage());
    }
  }

  String getRemoteAddr(Context ctx) {
    return ctx.req.getRemoteAddr();
  }

  String getRemoteHost(Context ctx) {
    return ctx.req.getRemoteHost();
  }

  void setStatus(Context ctx, int status) {
    ctx.status(status);
  }

  void setResult(Context ctx, String result) {
    ctx.result(result);
  }

  void setJson(Context ctx, Object obj) {
    ctx.json(obj);
  }

  byte[] getBodyBytes(Context ctx) {
    return ctx.bodyAsBytes();
  }

  ObjectMapper getObjectMapper() {
    ObjectMapper mapper = new ObjectMapper();
    mapper.enable(SerializationFeature.INDENT_OUTPUT);
    mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    SimpleModule module = new SimpleModule();
    module.addSerializer(
        ObjectId.class,
        new JsonSerializer<ObjectId>() {
          @Override
          public void serialize(ObjectId value, JsonGenerator gen, SerializerProvider serializers)
              throws IOException {
            gen.writeString(value.toHexString());
          }
        });
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
    return mapper;
  }

  Map<String, String> getPathParamMap(Context ctx) {
    return ctx.pathParamMap();
  }

  Map<String, Object> getBody(Context ctx) {
    return ctx.bodyAsClass(HashMap.class);
  }

  private void modifyHeats(Context ctx) {
    try {
      ModifyHeatsRequest request = ModifyHeatsRequest.parseFrom(ctx.bodyAsBytes());
      com.antigravity.race.Race race = // fqn-collision
          ClientSubscriptionManager.getInstance().getRace();
      if (race == null) {
        ctx.status(404).result("No active race found");
        return;
      }

      ModifyHeatsResponse response = race.modifyHeats(request);
      ctx.contentType("application/octet-stream").result(response.toByteArray());
    } catch (Exception e) {
      logger.error("Error modifying heats", e);
      ctx.status(500).result("Internal Server Error: " + e.getMessage());
    }
  }

  private void regenerateHeats(Context ctx) {
    try {
      RegenerateHeatsRequest request = RegenerateHeatsRequest.parseFrom(ctx.bodyAsBytes());
      com.antigravity.race.Race race = // fqn-collision
          ClientSubscriptionManager.getInstance().getRace();
      if (race == null) {
        ctx.status(404).result("No active race found");
        return;
      }

      RegenerateHeatsResponse response = race.regenerateHeats(request);
      ctx.contentType("application/octet-stream").result(response.toByteArray());
    } catch (Exception e) {
      logger.error("Error regenerating heats", e);
      ctx.status(500).result("Internal Server Error: " + e.getMessage());
    }
  }

  private void finalizeModifyHeats(Context ctx) {
    try {
      com.antigravity.race.Race race = // fqn-collision
          ClientSubscriptionManager.getInstance().getRace();
      if (race == null) {
        ctx.status(404).result("No active race found");
        return;
      }

      boolean allStarted = !race.getHeats().isEmpty();
      for (Heat h : race.getHeats()) {
        if (!h.isStarted()) {
          allStarted = false;
          break;
        }
      }

      if (allStarted && !(race.getState() instanceof RaceOver)) {
        race.changeState(new RaceOver());
      }
      ctx.status(200).result("OK");
    } catch (Exception e) {
      logger.error("Error finalizing modify heats", e);
      ctx.status(500).result("Internal Server Error: " + e.getMessage());
    }
  }
}
