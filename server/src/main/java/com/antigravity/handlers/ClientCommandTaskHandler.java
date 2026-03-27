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

import com.antigravity.race.ClientSubscriptionManager;
import com.antigravity.race.RaceParticipant;

import java.util.List;
import java.util.ArrayList;
import java.util.Arrays;
import java.io.File;
import java.io.FileWriter;
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
    app.post("/api/close-interface", this::closeInterface);
    app.post("/api/races/current-heat/drivers/{lane}/actual-driver", this::changeActualDriver);
    app.get("/api/serial-ports", this::getSerialPorts);
    app.get("/api/races/current/export-csv", this::exportRaceCsv);
    app.post("/api/save-race", this::saveRace);
    app.get("/api/saved-races", this::getSavedRaces);
    app.post("/api/load-race", this::loadRace);
    app.delete("/api/saved-races/{filename}", this::deleteSavedRace);
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
    java.util.List<String> rawIds = participantIds.stream()
        .map(id -> id.startsWith("d_") || id.startsWith("t_") ? id.substring(2) : id)
        .collect(java.util.stream.Collectors.toList());

    java.util.List<com.antigravity.models.Driver> drivers = dbService.getDrivers(databaseContext.getDatabase(),
        rawIds);
    java.util.List<com.antigravity.models.Team> teams = dbService.getTeams(databaseContext.getDatabase(),
        rawIds);

    // Map IDs back to objects maintaining order
    List<RaceParticipant> participants = new java.util.ArrayList<>();
    java.util.List<com.antigravity.models.Team> allTeams = dbService.getAllTeams(databaseContext.getDatabase());

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

    com.antigravity.race.Race race = new com.antigravity.race.Race(
        raceModel,
        participants,
        raceTrack,
        request.getIsDemoMode(),
        raceModel.getAutoAdvanceTime(),
        raceModel.getAutoStartTime());

    try {
      ClientSubscriptionManager.getInstance().setRace(race);
      race.init();
    } catch (Exception e) {
      System.err.println("Failed to set or initialize race: " + e.getMessage());
      race.stop(); // Ensure protocols are closed
      return TaskResult.error(409, e.getMessage());
    }

    System.out.println("Initialized race: " + race.getRaceModel().getName());

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

      IProtocol current = ClientSubscriptionManager.getInstance().getProtocol();
      if (current instanceof ArduinoProtocol) {
        ((ArduinoProtocol) current).updateConfig(config);

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
            .setMessage("Current protocol is not ArduinoProtocol or not set")
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
      com.antigravity.protocols.arduino.ArduinoConfig config = ArduinoConfigConverter
          .fromProto(request.getConfig());

      ArduinoProtocol protocol = new ArduinoProtocol(config, request.getLaneCount());
      protocol.setListener(new TestInterfaceListener());

      // ClientSubscriptionManager handles mutual exclusion in setProtocol
      com.antigravity.race.ClientSubscriptionManager.getInstance().setProtocol(protocol);

      boolean success = protocol.open();
      InitializeInterfaceResponse response = InitializeInterfaceResponse.newBuilder()
          .setSuccess(success)
          .setMessage(success ? "Interface initialized successfully"
              : "Failed to open serial connection on port: " + config.commPort)
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
      java.util.List<String> ports = com.antigravity.protocols.interfaces.SerialConnection
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

      IProtocol current = ClientSubscriptionManager.getInstance().getProtocol();
      if (current instanceof ArduinoProtocol) {
        ((ArduinoProtocol) current).setPinState(request.getIsDigital(), request.getPin(), request.getIsHigh());

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
            .setMessage("Current protocol is not ArduinoProtocol or not set")
            .build();
        ctx.contentType("application/octet-stream").result(response.toByteArray());
      }
    } catch (Exception e) {
      System.err.println("Error setting interface pin state: " + e.getMessage());
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

  private void changeActualDriver(io.javalin.http.Context ctx) {
    try {
      int lane = Integer.parseInt(ctx.pathParam("lane"));
      java.util.Map<String, String> body = ctx.bodyAsClass(java.util.Map.class);
      String driverId = body.get("driverId");

      com.antigravity.race.Race race = ClientSubscriptionManager.getInstance().getRace();
      if (race == null) {
        ctx.status(404).result("No active race found");
        return;
      }

      java.util.List<com.antigravity.race.DriverHeatData> drivers = race.getCurrentHeat().getDrivers();
      if (lane >= 0 && lane < drivers.size()) {
        com.antigravity.race.DriverHeatData dhd = drivers.get(lane);
        com.antigravity.service.DatabaseService dbService = new com.antigravity.service.DatabaseService();
        java.util.List<com.antigravity.models.Driver> driversList = dbService.getDrivers(databaseContext.getDatabase(), java.util.Collections.singletonList(driverId));
        com.antigravity.models.Driver driver = driversList.isEmpty() ? null : driversList.get(0);
        
        if (driver != null) {
          com.antigravity.models.TeamOptions options = race.getRaceModel().getTeamOptions();
          if (options != null && options.isRequirePitStopChangeDriver() && race.getState() instanceof com.antigravity.race.states.Racing) {
            com.antigravity.protocols.CarLocation loc = dhd.getCurrentLocation();
            boolean inPit = loc == com.antigravity.protocols.CarLocation.PitRow
                || (loc != null && loc.getValue() >= com.antigravity.protocols.CarLocation.PitBayBase.getValue()
                    && loc.getValue() < com.antigravity.protocols.CarLocation.PitBayBase.getValue() + race.getTrack().getLanes().size());
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
      // Protocols list isn't exposed directly with its type, but createProtocols takes isDemoMode.
      // We can check if protocols has Demo protocol or check the parameter passed on init.
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

  private void loadRace(Context ctx) {
    try {
      java.util.Map<String, String> body = ctx.bodyAsClass(java.util.Map.class);
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
      com.antigravity.models.Track dbTrack = new DatabaseService().getTrack(databaseContext.getDatabase(), saveData.getModel().getTrackEntityId());

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
      com.antigravity.race.Race race = new com.antigravity.race.Race(
          saveData.getModel(),
          saveData.getDrivers(),
          trackToUse,
          saveData.getHeats(),
          saveData.getCurrentHeatIndex(),
          saveData.getAccumulatedRaceTime(),
          saveData.isHasRacedInCurrentHeat(),
          saveData.isAutoStartFired(),
          saveData.isAutoAdvanceFired(),
          saveData.getStateClassName(),
          saveData.isDemoMode()
      );

      ClientSubscriptionManager.getInstance().setRace(race);
      race.init(); // Open protocols

      ctx.status(200).result("Race loaded successfully");
    } catch (Exception e) {
      System.err.println("Error loading race: " + e.getMessage());
      e.printStackTrace();
      ctx.status(500).result("Internal Server Error: " + e.getMessage());
    }
  }

  com.fasterxml.jackson.databind.ObjectMapper getObjectMapper() {
    com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
    mapper.enable(com.fasterxml.jackson.databind.SerializationFeature.INDENT_OUTPUT);
    mapper.configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    
    com.fasterxml.jackson.databind.module.SimpleModule module = new com.fasterxml.jackson.databind.module.SimpleModule();
    module.addSerializer(org.bson.types.ObjectId.class, new com.fasterxml.jackson.databind.JsonSerializer<org.bson.types.ObjectId>() {
      @Override
      public void serialize(org.bson.types.ObjectId value, com.fasterxml.jackson.core.JsonGenerator gen, com.fasterxml.jackson.databind.SerializerProvider serializers) throws java.io.IOException {
        gen.writeString(value.toHexString());
      }
    });
    module.addDeserializer(org.bson.types.ObjectId.class, new com.fasterxml.jackson.databind.JsonDeserializer<org.bson.types.ObjectId>() {
      @Override
      public org.bson.types.ObjectId deserialize(com.fasterxml.jackson.core.JsonParser p, com.fasterxml.jackson.databind.DeserializationContext ctxt) throws java.io.IOException {
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
