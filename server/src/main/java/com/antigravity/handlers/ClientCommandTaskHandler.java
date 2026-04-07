package com.antigravity.handlers;

import com.antigravity.context.DatabaseContext;
import com.antigravity.converters.ArduinoConfigConverter;
import com.antigravity.proto.InitializeInterfaceRequest;
import com.antigravity.proto.InitializeInterfaceResponse;
import com.antigravity.proto.InitializeRaceRequest;
import com.antigravity.protocols.TestInterfaceListener;
import com.antigravity.protocols.arduino.ArduinoProtocol;
import com.antigravity.service.DatabaseService;
import io.javalin.http.Context;
import com.antigravity.protocols.IProtocol;
import com.antigravity.protocols.ProtocolDelegate;

import com.antigravity.race.ClientSubscriptionManager;
import com.antigravity.race.RaceParticipant;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.HashSet;
import java.io.File;
import java.io.FileWriter;
import java.net.NetworkInterface;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.antigravity.race.RaceSaveData;
import com.antigravity.race.Heat;

public class ClientCommandTaskHandler {

  private final DatabaseContext databaseContext;

  public ClientCommandTaskHandler(DatabaseContext databaseContext, io.javalin.Javalin app) {
    this.databaseContext = databaseContext;
    app.post("/api/initialize-race", this::initializeRace);
    app.post("/api/start-race", this::startRace);
    app.post("/api/pause-race", this::pauseRace);
    app.post("/api/next-heat", this::nextHeat);
    app.post("/api/restart-heat", this::restartHeat);
    app.post("/api/skip-heat", this::skipHeat);
    app.post("/api/defer-heat", this::deferHeat);
    app.post("/api/update-interface-config", this::updateInterfaceConfig);
    app.post("/api/initialize-interface", this::initializeInterface);
    app.post("/api/set-interface-pin-state", this::setInterfacePinState);
    app.post("/api/set-interface-rgb-led-state", this::setInterfaceRgbLedState);
    app.post("/api/close-interface", this::closeInterface);
    app.post("/api/races/current-heat/drivers/{lane}/actual-driver", this::changeActualDriver);
    app.get("/api/serial-ports", this::getSerialPorts);
    app.get("/api/races/current/export-csv", this::exportRaceCsv);
    app.post("/api/save-race", this::saveRace);
    app.get("/api/saved-races", this::getSavedRaces);
    app.post("/api/load-race", this::loadRace);
    app.post("/api/analytics/toggle", this::toggleAnalytics);
    app.get("/api/analytics/config", this::getAnalyticsConfig);
  }

  private void initializeRace(Context ctx) {
    try {
      InitializeRaceRequest request = InitializeRaceRequest.parseFrom(ctx.bodyAsBytes());
      System.out.println("InitializeRaceRequest received: race_id=" + request.getRaceId() + ", driver_ids="
          + request.getDriverIdsList());

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

    } catch (com.google.protobuf.InvalidProtocolBufferException e) {
      System.err.println("Error parsing InitializeRaceRequest: " + e.getMessage());
      ctx.status(400).result("Invalid Protobuf message: " + e.getMessage());
    } catch (Exception e) {
      System.err.println("Error initializing race: " + e.getMessage());
      e.printStackTrace();
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
  TaskResult handleInitializeRace(InitializeRaceRequest request) throws Exception {
    DatabaseService dbService = new DatabaseService();
    com.antigravity.models.Race raceModel = dbService.getRace(databaseContext.getDatabase(),
        request.getRaceId());

    if (raceModel == null) {
      return TaskResult.error(404, "Race not found");
    }

    if (ClientSubscriptionManager.getInstance().hasSubscribers()
        && ClientSubscriptionManager.getInstance().getRace() != null
        && ClientSubscriptionManager.getInstance().getRace().isActive()) {
      return TaskResult.error(409, "Cannot start new race while client is watching an active race");
    }

    // Create the runtime race instance
    List<String> participantIds = request.getDriverIdsList();
    List<String> rawIds = participantIds.stream()
        .map(id -> id.startsWith("d_") || id.startsWith("t_") ? id.substring(2) : id)
        .collect(Collectors.toList());

    List<com.antigravity.models.Driver> drivers = dbService.getDrivers(databaseContext.getDatabase(),
        rawIds);
    List<com.antigravity.models.Team> teams = dbService.getTeams(databaseContext.getDatabase(),
        rawIds);

    // Map IDs back to objects maintaining order
    List<RaceParticipant> participants = new ArrayList<>();
    List<com.antigravity.models.Team> allTeams = dbService.getAllTeams(databaseContext.getDatabase());

    // --- Validation Logic ---
    Map<String, List<String>> driverToTeamNames = new HashMap<>();
    Set<String> individualDriverIds = new HashSet<>();

    for (String pid : participantIds) {
      String rawId = pid.startsWith("d_") || pid.startsWith("t_") ? pid.substring(2) : pid;
      if (pid.startsWith("d_")) {
        individualDriverIds.add(rawId);
      } else if (pid.startsWith("t_")) {
        com.antigravity.models.Team team = teams.stream()
            .filter(t -> t.getEntityId().equals(rawId)).findFirst().orElse(null);
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
        com.antigravity.models.Driver d = drivers.stream()
            .filter(drv -> drv.getEntityId().equals(dId)).findFirst().orElse(null);
        String dName = d != null ? d.getName() : dId;
        com.antigravity.proto.InitializeRaceResponse response = com.antigravity.proto.InitializeRaceResponse
            .newBuilder()
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
        com.antigravity.models.Driver d = drivers.stream()
            .filter(drv -> drv.getEntityId().equals(dId)).findFirst().orElse(null);
        if (d == null) {
          d = dbService.getDriver(databaseContext.getDatabase(), dId);
        }
        String dName = d != null ? d.getName() : dId;
        com.antigravity.proto.InitializeRaceResponse response = com.antigravity.proto.InitializeRaceResponse
            .newBuilder()
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
        com.antigravity.models.Driver driver = drivers.stream().filter(d -> d.getEntityId().equals(rawId))
            .findFirst().orElse(null);
        if (driver != null) {
          // Find if driver belongs to a team (always check, even if explicitly asked for
          // driver)
          com.antigravity.models.Team driverTeam = null;
          if (!isExplicitDriver) {
            driverTeam = allTeams.stream()
                .filter(t -> t.getDriverIds().contains(rawId))
                .findFirst().orElse(null);
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
        com.antigravity.models.Team team = teams.stream().filter(t -> t.getEntityId().equals(rawId))
            .findFirst()
            .orElse(null);
        if (team != null) {
          RaceParticipant rp = new RaceParticipant(team);
          // Populate team drivers
          List<com.antigravity.models.Driver> teamDrivers = dbService
              .getDrivers(databaseContext.getDatabase(), team.getDriverIds());

          logToFile("Hydrating team " + team.getName() + " with IDs: " + team.getDriverIds());
          logToFile("Found " + teamDrivers.size() + " drivers in DB.");

          rp.setTeamDrivers(teamDrivers);
          participants.add(rp);
        }
      }
    }
    com.antigravity.models.Track raceTrack = new com.antigravity.service.DatabaseService()
        .getTrack(databaseContext.getDatabase(), raceModel.getTrackEntityId());

    com.antigravity.race.Race race = new com.antigravity.race.Race.Builder()
        .model(raceModel)
        .drivers(participants)
        .track(raceTrack)
        .isDemoMode(request.getIsDemoMode())
        .build();

    try {
      ClientSubscriptionManager.getInstance().setRace(race);
      race.init();
    } catch (Exception e) {
      System.err.println("Failed to set or initialize race: " + e.getMessage());
      race.stop(); // Ensure protocols are closed
      return TaskResult.error(409, e.getMessage());
    }

    System.out.println("Initialized race: " + race.getRaceModel().getName());
    com.antigravity.service.AnalyticsService.getInstance().trackRaceStart(race);

    // com.antigravity.models.Track track = race.getTrack();

    com.antigravity.proto.RaceData raceData = race.createSnapshot();
    race.broadcast(raceData);

    com.antigravity.proto.InitializeRaceResponse response = com.antigravity.proto.InitializeRaceResponse
        .newBuilder()
        .setSuccess(true)
        .build();
    return TaskResult.success(response.toByteArray());
  }

  private void startRace(Context ctx) {
    try {
      com.antigravity.race.Race race = ClientSubscriptionManager.getInstance().getRace();
      if (race == null) {
        ctx.status(404).result("No active race found");
        return;
      }

      try {
        race.startRace();

        com.antigravity.proto.StartRaceResponse response = com.antigravity.proto.StartRaceResponse.newBuilder()
            .setSuccess(true).setMessage("Race started successfully").build();
        ctx.contentType("application/octet-stream").result(response.toByteArray());
      } catch (IllegalStateException e) {
        com.antigravity.proto.StartRaceResponse response = com.antigravity.proto.StartRaceResponse.newBuilder()
            .setSuccess(false).setMessage(e.getMessage()).build();
        ctx.contentType("application/octet-stream").result(response.toByteArray());
      }

    } catch (Exception e) {
      System.err.println("Error processing startRace: " + e.getMessage());
      e.printStackTrace();
      ctx.status(500).result("Internal Server Error: " + e.getMessage());
    }
  }

  private void pauseRace(Context ctx) {
    try {
      com.antigravity.race.Race race = ClientSubscriptionManager.getInstance().getRace();
      if (race == null) {
        ctx.status(404).result("No active race found");
        return;
      }

      try {
        race.pauseRace();

        com.antigravity.proto.PauseRaceResponse response = com.antigravity.proto.PauseRaceResponse.newBuilder()
            .setSuccess(true).setMessage("Race paused successfully").build();
        ctx.contentType("application/octet-stream").result(response.toByteArray());
      } catch (IllegalStateException e) {
        com.antigravity.proto.PauseRaceResponse response = com.antigravity.proto.PauseRaceResponse.newBuilder()
            .setSuccess(false).setMessage(e.getMessage()).build();
        ctx.contentType("application/octet-stream").result(response.toByteArray());
      }
    } catch (Exception e) {
      System.err.println("Error processing pauseRace: " + e.getMessage());
      e.printStackTrace();
      ctx.status(500).result("Internal Server Error: " + e.getMessage());
    }
  }

  private void nextHeat(Context ctx) {
    try {
      com.antigravity.race.Race race = ClientSubscriptionManager.getInstance().getRace();
      if (race == null) {
        ctx.status(404).result("No active race found");
        return;
      }

      try {
        race.moveToNextHeat();
        ClientSubscriptionManager.getInstance().autoSave(race);

        com.antigravity.proto.NextHeatResponse response = com.antigravity.proto.NextHeatResponse.newBuilder()
            .setSuccess(true).setMessage("Moved to next heat successfully").build();
        ctx.contentType("application/octet-stream").result(response.toByteArray());
      } catch (Exception e) {
        com.antigravity.proto.NextHeatResponse response = com.antigravity.proto.NextHeatResponse.newBuilder()
            .setSuccess(false).setMessage(e.getMessage()).build();
        ctx.contentType("application/octet-stream").result(response.toByteArray());
      }
    } catch (Exception e) {
      System.err.println("Error processing nextHeat: " + e.getMessage());
      e.printStackTrace();
      ctx.status(500).result("Internal Server Error: " + e.getMessage());
    }
  }

  private void restartHeat(Context ctx) {
    try {
      com.antigravity.race.Race race = ClientSubscriptionManager.getInstance().getRace();
      if (race == null) {
        ctx.status(404).result("No active race found");
        return;
      }

      try {
        race.restartHeat();
        ClientSubscriptionManager.getInstance().autoSave(race);

        com.antigravity.proto.RestartHeatResponse response = com.antigravity.proto.RestartHeatResponse
            .newBuilder().setSuccess(true).setMessage("Heat restarted successfully").build();
        ctx.contentType("application/octet-stream").result(response.toByteArray());
      } catch (IllegalStateException e) {
        com.antigravity.proto.RestartHeatResponse response = com.antigravity.proto.RestartHeatResponse
            .newBuilder().setSuccess(false).setMessage(e.getMessage()).build();
        ctx.contentType("application/octet-stream").result(response.toByteArray());
      }
    } catch (Exception e) {
      System.err.println("Error processing restartHeat: " + e.getMessage());
      e.printStackTrace();
      ctx.status(500).result("Internal Server Error: " + e.getMessage());
    }
  }

  private void skipHeat(Context ctx) {
    try {
      com.antigravity.race.Race race = ClientSubscriptionManager.getInstance().getRace();
      if (race == null) {
        ctx.status(404).result("No active race found");
        return;
      }

      try {
        race.skipHeat();
        ClientSubscriptionManager.getInstance().autoSave(race);

        com.antigravity.proto.SkipHeatResponse response = com.antigravity.proto.SkipHeatResponse.newBuilder()
            .setSuccess(true).setMessage("Heat skipped successfully").build();
        ctx.contentType("application/octet-stream").result(response.toByteArray());
      } catch (IllegalStateException e) {
        com.antigravity.proto.SkipHeatResponse response = com.antigravity.proto.SkipHeatResponse.newBuilder()
            .setSuccess(false).setMessage(e.getMessage()).build();
        ctx.contentType("application/octet-stream").result(response.toByteArray());
      }
    } catch (Exception e) {
      System.err.println("Error processing skipHeat: " + e.getMessage());
      e.printStackTrace();
      ctx.status(500).result("Internal Server Error: " + e.getMessage());
    }
  }

  private void deferHeat(Context ctx) {
    try {
      com.antigravity.race.Race race = ClientSubscriptionManager.getInstance().getRace();
      if (race == null) {
        ctx.status(404).result("No active race found");
        return;
      }

      try {
        race.deferHeat();
        ClientSubscriptionManager.getInstance().autoSave(race);

        com.antigravity.proto.DeferHeatResponse response = com.antigravity.proto.DeferHeatResponse.newBuilder()
            .setSuccess(true).build();
        ctx.contentType("application/octet-stream").result(response.toByteArray());
      } catch (IllegalStateException e) {
        com.antigravity.proto.DeferHeatResponse response = com.antigravity.proto.DeferHeatResponse.newBuilder()
            .setSuccess(false).build();
        ctx.contentType("application/octet-stream").result(response.toByteArray());
      }
    } catch (Exception e) {
      System.err.println("Error processing deferHeat: " + e.getMessage());
      e.printStackTrace();
      ctx.status(500).result("Internal Server Error: " + e.getMessage());
    }
  }

  private void updateInterfaceConfig(Context ctx) {
    try {
      com.antigravity.proto.UpdateInterfaceConfigRequest request = com.antigravity.proto.UpdateInterfaceConfigRequest
          .parseFrom(ctx.bodyAsBytes());
      com.antigravity.protocols.arduino.ArduinoConfig config = ArduinoConfigConverter
          .fromProto(request.getConfig());
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

        com.antigravity.proto.UpdateInterfaceConfigResponse response = com.antigravity.proto.UpdateInterfaceConfigResponse
            .newBuilder()
            .setSuccess(true)
            .setMessage("Configuration updated")
            .build();
        ctx.contentType("application/octet-stream").result(response.toByteArray());
      } else {
        com.antigravity.proto.UpdateInterfaceConfigResponse response = com.antigravity.proto.UpdateInterfaceConfigResponse
            .newBuilder()
            .setSuccess(false)
            .setMessage("Target interface index " + interfaceIndex + " is invalid or not an ArduinoProtocol")
            .build();
        ctx.contentType("application/octet-stream").result(response.toByteArray());
      }
    } catch (Exception e) {
      System.err.println("Error updating interface config: " + e.getMessage());
      e.printStackTrace();
      ctx.status(500).result("Internal Server Error: " + e.toString());
    }
  }

  private void initializeInterface(Context ctx) {
    try {
      InitializeInterfaceRequest request = InitializeInterfaceRequest.parseFrom(ctx.bodyAsBytes());

      List<IProtocol> protocols = new ArrayList<>();
      for (com.antigravity.proto.ArduinoConfig protoConfig : request.getConfigsList()) {
        com.antigravity.protocols.arduino.ArduinoConfig config = ArduinoConfigConverter.fromProto(protoConfig);
        ArduinoProtocol arduino = new ArduinoProtocol(config, request.getLaneCount());
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
      com.antigravity.race.ClientSubscriptionManager.getInstance().setProtocol(finalProtocol);

      boolean success = finalProtocol.open();
      InitializeInterfaceResponse response = InitializeInterfaceResponse.newBuilder()
          .setSuccess(success)
          .setMessage(success ? "Interfaces initialized successfully" : "Failed to open one or more interfaces")
          .build();
      ctx.contentType("application/octet-stream").result(response.toByteArray());
    } catch (IllegalStateException e) {
      ctx.status(409).result(e.getMessage());
    } catch (com.google.protobuf.InvalidProtocolBufferException e) {
      ctx.status(400).result("Invalid message: " + e.getMessage());
    } catch (Exception e) {
      System.err.println("Error initializing interface: " + e.getMessage());
      e.printStackTrace();
      ctx.status(500).result("Internal Server Error: " + e.toString());
    }
  }

  private void getSerialPorts(Context ctx) {
    try {
      List<String> ports = com.antigravity.protocols.interfaces.SerialConnection
          .getAvailableSerialPorts();
      ctx.json(ports);
    } catch (Exception e) {
      System.err.println("Error getting serial ports: " + e.getMessage());
      e.printStackTrace();
      ctx.status(500).result("Internal Server Error: " + e.getMessage());
    }
  }

  private void setInterfacePinState(Context ctx) {
    try {
      com.antigravity.proto.SetInterfacePinStateRequest request = com.antigravity.proto.SetInterfacePinStateRequest
          .parseFrom(ctx.bodyAsBytes());
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

        com.antigravity.proto.SetInterfacePinStateResponse response = com.antigravity.proto.SetInterfacePinStateResponse
            .newBuilder()
            .setSuccess(true)
            .setMessage("Pin state command sent")
            .build();
        ctx.contentType("application/octet-stream").result(response.toByteArray());
      } else {
        com.antigravity.proto.SetInterfacePinStateResponse response = com.antigravity.proto.SetInterfacePinStateResponse
            .newBuilder()
            .setSuccess(false)
            .setMessage("Target interface index " + interfaceIndex + " is invalid or not an ArduinoProtocol")
            .build();
        ctx.contentType("application/octet-stream").result(response.toByteArray());
      }
    } catch (Exception e) {
      System.err.println("Error setting interface pin state: " + e.getMessage());
      e.printStackTrace();
      ctx.status(500).result("Internal Server Error: " + e.toString());
    }
  }

  private void setInterfaceRgbLedState(Context ctx) {
    try {
      com.antigravity.proto.SetInterfaceRgbLedStateRequest request = com.antigravity.proto.SetInterfaceRgbLedStateRequest
          .parseFrom(ctx.bodyAsBytes());
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
        target.setStringRgbLedValues(request.getStringIndex(), request.getLedsList());

        com.antigravity.proto.SetInterfaceRgbLedStateResponse response = com.antigravity.proto.SetInterfaceRgbLedStateResponse
            .newBuilder()
            .setSuccess(true)
            .setMessage("RGB LED state command sent")
            .build();
        ctx.contentType("application/octet-stream").result(response.toByteArray());
      } else {
        com.antigravity.proto.SetInterfaceRgbLedStateResponse response = com.antigravity.proto.SetInterfaceRgbLedStateResponse
            .newBuilder()
            .setSuccess(false)
            .setMessage("Target interface index " + interfaceIndex + " is invalid or not an ArduinoProtocol")
            .build();
        ctx.contentType("application/octet-stream").result(response.toByteArray());
      }
    } catch (Exception e) {
      System.err.println("Error setting interface RGB LED state: " + e.getMessage());
      e.printStackTrace();
      ctx.status(500).result("Internal Server Error: " + e.toString());
    }
  }

  private void logToFile(String message) {
    try {
      String tmpDir = System.getProperty("java.io.tmpdir");
      java.nio.file.Path logPath = java.nio.file.Paths.get(tmpDir, "race_debug.log");
      java.nio.file.Files.write(logPath, (message + "\n").getBytes(),
          java.nio.file.StandardOpenOption.CREATE, java.nio.file.StandardOpenOption.APPEND);
    } catch (Exception e) {
      // Ignore
    }
  }

  private void closeInterface(io.javalin.http.Context ctx) {
    try {
      System.out.println("Explicit close-interface requested");
      ClientSubscriptionManager.getInstance().setProtocol(null);
      ctx.status(200).result("OK");
    } catch (Exception e) {
      System.err.println("Error closing interface: " + e.getMessage());
      ctx.status(500).result("Error closing interface: " + e.getMessage());
    }
  }

  @SuppressWarnings("unchecked")
  private void changeActualDriver(io.javalin.http.Context ctx) {
    try {
      int lane = Integer.parseInt(ctx.pathParam("lane"));
      Map<String, String> body = ctx.bodyAsClass(HashMap.class);
      String driverId = body.get("driverId");

      com.antigravity.race.Race race = ClientSubscriptionManager.getInstance().getRace();
      if (race == null) {
        ctx.status(404).result("No active race found");
        return;
      }

      List<com.antigravity.race.DriverHeatData> drivers = race.getCurrentHeat().getDrivers();
      if (lane >= 0 && lane < drivers.size()) {
        com.antigravity.race.DriverHeatData dhd = drivers.get(lane);
        com.antigravity.service.DatabaseService dbService = new com.antigravity.service.DatabaseService();
        List<com.antigravity.models.Driver> driversList = dbService.getDrivers(databaseContext.getDatabase(),
            Collections.singletonList(driverId));
        com.antigravity.models.Driver driver = driversList.isEmpty() ? null : driversList.get(0);

        if (driver != null) {
          com.antigravity.models.TeamOptions options = race.getRaceModel().getTeamOptions();
          if (options != null && options.isRequirePitStopChangeDriver()
              && race.getState() instanceof com.antigravity.race.states.Racing) {
            com.antigravity.protocols.CarLocation loc = dhd.getCurrentLocation();
            boolean inPit = loc == com.antigravity.protocols.CarLocation.PitRow
                || (loc != null && loc.getValue() >= com.antigravity.protocols.CarLocation.PitBayBase.getValue()
                    && loc.getValue() < com.antigravity.protocols.CarLocation.PitBayBase.getValue()
                        + race.getTrack().getLanes().size());
            if (!inPit) {
              ctx.status(403).result("RD_ERR_DRIVER_CHANGE_NOT_IN_PIT");
              return;
            }
          }
          dhd.setActualDriver(driver);
          race.broadcast(race.createSnapshot());
          ctx.status(200).result("Driver updated");
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

  private void exportRaceCsv(io.javalin.http.Context ctx) {
    try {
      com.antigravity.race.Race race = com.antigravity.race.ClientSubscriptionManager.getInstance().getRace();
      if (race == null) {
        ctx.status(404).result("No active race found");
        return;
      }

      String csv;
      synchronized (race) {
        com.antigravity.race.OverallStandings standings = new com.antigravity.race.OverallStandings(
            race.getRaceModel().getHeatScoring(),
            race.getRaceModel().getOverallScoring());
        standings.recalculate(race.getDrivers(), race.getHeats());
        csv = com.antigravity.util.CsvExporter.export(race);
      }

      ctx.contentType("text/csv")
          .header("Content-Disposition", "attachment; filename=\"race_export.csv\"")
          .result(csv);
    } catch (Exception e) {
      System.err.println("Error exporting CSV: " + e.getMessage());
      e.printStackTrace();
      ctx.status(500).result("Internal Server Error: " + e.getMessage());
    }
  }

  void saveRace(Context ctx) {
    try {
      com.antigravity.race.Race race = ClientSubscriptionManager.getInstance().getRace();
      if (race == null) {
        ctx.status(404).result("No active race found");
        return;
      }

      if (race.getState() instanceof com.antigravity.race.states.Racing) {
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

      ObjectMapper mapper = getObjectMapper();
      String json = mapper.writeValueAsString(saveData);

      String dbName = databaseContext.getCurrentDatabaseName();
      String saveDir = databaseContext.getDataRoot() + dbName + File.separator + "saved_races";
      File dir = new File(saveDir);
      if (!dir.exists() && !dir.mkdirs()) {
        ctx.status(500).result("Failed to create save directory");
        return;
      }

      java.time.LocalDateTime now = java.time.LocalDateTime.now();
      java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss");
      String timestamp = now.format(formatter);
      String raceName = race.getRaceModel() != null ? race.getRaceModel().getName() : "Race";
      raceName = raceName.replaceAll("[^a-zA-Z0-9_-]", "_");
      String filename = timestamp + "_" + raceName + ".json";
      File file = new File(dir, filename);
      try (FileWriter writer = new FileWriter(file)) {
        writer.write(json);
      }

      ctx.status(200).result("Race saved successfully: " + filename);
    } catch (Exception e) {
      System.err.println("Error saving race: " + e.getMessage());
      e.printStackTrace();
      ctx.status(500).result("Internal Server Error: " + e.getMessage());
    }
  }

  void getSavedRaces(Context ctx) {
    try {
      String dbName = databaseContext.getCurrentDatabaseName();
      String saveDir = databaseContext.getDataRoot() + dbName + File.separator + "saved_races";
      File dir = new File(saveDir);
      if (!dir.exists()) {
        ctx.json(new ArrayList<String>());
        return;
      }
      String[] files = dir.list((d, name) -> name.endsWith(".json"));
      ctx.json(files != null ? Arrays.asList(files) : new ArrayList<String>());
    } catch (Exception e) {
      System.err.println("Error getting saved races: " + e.getMessage());
      ctx.status(500).result("Error: " + e.getMessage());
    }
  }

  void deleteSavedRace(Context ctx) {
    try {
      String filename = ctx.pathParam("filename");
      String dbName = databaseContext.getCurrentDatabaseName();
      String saveDir = databaseContext.getDataRoot() + dbName + File.separator + "saved_races";
      File saveFile = new File(saveDir, filename);
      if (saveFile.exists() && saveFile.delete()) {
        ctx.status(200).result("File deleted: " + filename);
      } else {
        ctx.status(404).result("File not found or failed to delete: " + filename);
      }
    } catch (Exception e) {
      System.err.println("Error deleting saved race: " + e.getMessage());
      ctx.status(500).result("Error: " + e.getMessage());
    }
  }

  @SuppressWarnings("unchecked")
  private void loadRace(Context ctx) {
    try {
      Map<String, String> body = ctx.bodyAsClass(HashMap.class);
      String filename = body.get("filename");
      if (filename == null) {
        ctx.status(400).result("Filename is required");
        return;
      }

      String dbName = databaseContext.getCurrentDatabaseName();
      String saveDir = databaseContext.getDataRoot() + dbName + File.separator + "saved_races";
      File saveFile = new File(saveDir, filename);

      if (!saveFile.exists()) {
        ctx.status(404).result("Save file not found");
        return;
      }

      ObjectMapper mapper = getObjectMapper();
      RaceSaveData saveData = mapper.readValue(saveFile, RaceSaveData.class);

      // Compare Track
      com.antigravity.models.Track savedTrack = saveData.getTrack();
      com.antigravity.models.Track dbTrack = new DatabaseService().getTrack(databaseContext.getDatabase(),
          saveData.getModel().getTrackEntityId());

      com.antigravity.models.Track trackToUse = savedTrack;
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
      com.antigravity.race.Race race = new com.antigravity.race.Race.Builder()
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
          .build();

      ClientSubscriptionManager.getInstance().setRace(race);
      race.init(); // Open protocols
      com.antigravity.service.AnalyticsService.getInstance().trackRaceStart(race);

      ctx.status(200).result("Race loaded successfully");
    } catch (Exception e) {
      System.err.println("Error loading race: " + e.getMessage());
      e.printStackTrace();
      ctx.status(500).result("Internal Server Error: " + e.getMessage());
    }
  }

  /* package */ void getAnalyticsConfig(Context ctx) {
    Map<String, String> config = new HashMap<>();
    config.put("clientId", com.antigravity.service.AnalyticsService.getInstance().getClientId());
    config.put("measurementId", com.antigravity.service.AnalyticsService.getInstance().getMeasurementId());
    setJson(ctx, config);
  }

  /* package */ void toggleAnalytics(Context ctx) {
    String remoteAddr = getRemoteAddr(ctx);
    String remoteHost = getRemoteHost(ctx);

    boolean isLocalhost = isLocalAddress(remoteAddr, remoteHost);

    if (!isLocalhost) {
      setStatus(ctx, 403);
      setResult(ctx, "Analytics settings can only be changed from a local connection. Detected: " + remoteAddr);
      return;
    }

    try {
      com.fasterxml.jackson.databind.ObjectMapper mapper = getObjectMapper();
      com.antigravity.models.AnalyticsToggleRequest request = mapper.readValue(getBodyBytes(ctx),
          com.antigravity.models.AnalyticsToggleRequest.class);
      if (request == null) {
        setStatus(ctx, 400);
        setResult(ctx, "Invalid request body. Expected JSON with 'enabled' field.");
        return;
      }

      boolean enabled = request.isEnabled();
      com.antigravity.service.AnalyticsService.getInstance().setUserEnabled(enabled);
      setStatus(ctx, 200);
      setResult(ctx, "Analytics status updated to " + enabled);
    } catch (Exception e) {
      setStatus(ctx, 500);
      setResult(ctx, "Internal Error: " + e.getMessage());
    }
  }

  /* package */ String getRemoteAddr(Context ctx) {
    return ctx.req.getRemoteAddr();
  }

  /* package */ String getRemoteHost(Context ctx) {
    return ctx.req.getRemoteHost();
  }

  /* package */ void setStatus(Context ctx, int status) {
    ctx.status(status);
  }

  /* package */ void setResult(Context ctx, String result) {
    ctx.result(result);
  }

  /* package */ void setJson(Context ctx, Object obj) {
    ctx.json(obj);
  }

  /* package */ byte[] getBodyBytes(Context ctx) {
    return ctx.bodyAsBytes();
  }

  /* package */ boolean isLocalAddress(String remoteAddr, String remoteHost) {
    try {
      // Explicitly check for all common localhost IP and hostname variations
      if ("127.0.0.1".equals(remoteAddr) ||
          "0:0:0:0:0:0:0:1".equals(remoteAddr) ||
          "::1".equals(remoteAddr) ||
          "localhost".equals(remoteAddr) ||
          "localhost".equals(remoteHost) ||
          "127.0.0.1".equals(remoteHost) ||
          "::1".equals(remoteHost) ||
          "0:0:0:0:0:0:0:1".equals(remoteHost) ||
          "::ffff:127.0.0.1".equals(remoteAddr) ||
          "0.0.0.0".equals(remoteAddr)) {
        return true;
      }

      java.net.InetAddress addr = java.net.InetAddress.getByName(remoteAddr);
      if (addr.isLoopbackAddress()) {
        return true;
      }

      // Verify if the remote address matches any address on the local network
      // interfaces
      Enumeration<java.net.NetworkInterface> interfaces = NetworkInterface
          .getNetworkInterfaces();
      while (interfaces.hasMoreElements()) {
        Enumeration<java.net.InetAddress> addresses = interfaces.nextElement().getInetAddresses();
        while (addresses.hasMoreElements()) {
          if (addresses.nextElement().getHostAddress().equals(remoteAddr)) {
            return true;
          }
        }
      }
    } catch (Exception e) {
      // If hostname resolution fails, fallback to simple string check
    }

    return "127.0.0.1".equals(remoteAddr) || "::1".equals(remoteAddr) || "localhost".equals(remoteAddr);
  }

  com.fasterxml.jackson.databind.ObjectMapper getObjectMapper() {
    com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
    mapper.enable(com.fasterxml.jackson.databind.SerializationFeature.INDENT_OUTPUT);
    mapper.configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    com.fasterxml.jackson.databind.module.SimpleModule module = new com.fasterxml.jackson.databind.module.SimpleModule();
    module.addSerializer(org.bson.types.ObjectId.class,
        new com.fasterxml.jackson.databind.JsonSerializer<org.bson.types.ObjectId>() {
          @Override
          public void serialize(org.bson.types.ObjectId value, com.fasterxml.jackson.core.JsonGenerator gen,
              com.fasterxml.jackson.databind.SerializerProvider serializers) throws java.io.IOException {
            gen.writeString(value.toHexString());
          }
        });
    module.addDeserializer(org.bson.types.ObjectId.class,
        new com.fasterxml.jackson.databind.JsonDeserializer<org.bson.types.ObjectId>() {
          @Override
          public org.bson.types.ObjectId deserialize(com.fasterxml.jackson.core.JsonParser p,
              com.fasterxml.jackson.databind.DeserializationContext ctxt) throws java.io.IOException {
            String value = p.getValueAsString();
            if (value == null || value.isEmpty()) {
              return null;
            }
            try {
              return new org.bson.types.ObjectId(value);
            } catch (IllegalArgumentException e) {
              return null;
            }
          }
        });
    mapper.registerModule(module);
    return mapper;
  }
}
