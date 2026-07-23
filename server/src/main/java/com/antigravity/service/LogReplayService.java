package com.antigravity.service;

import com.antigravity.models.Driver;
import com.antigravity.models.RaceConfigDump;
import com.antigravity.models.ReplayCommandDump;
import com.antigravity.proto.ModifyHeatsRequest;
import com.antigravity.proto.RecordData;
import com.antigravity.proto.RegenerateHeatsRequest;
import com.antigravity.protocols.interfaces.LogReaderSerialConnection;
import com.antigravity.race.ClientSubscriptionManager;
import com.antigravity.race.DriverHeatData;
import com.antigravity.race.Heat;
import com.antigravity.race.Race;
import com.antigravity.race.RaceParticipant;
import com.antigravity.race.states.NotStarted;
import com.antigravity.race.states.RaceOver;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class LogReplayService {

  private static final Logger logger = LoggerFactory.getLogger(LogReplayService.class);
  private static final DateTimeFormatter TIME_FORMATTER =
      DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS");
  private static final Pattern LOG_LINE_PATTERN =
      Pattern.compile(
          "^(\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}\\.\\d{3})\\s+\\[.*?\\]\\s+(\\w+)\\s+(.+?)\\s+-\\s+(.*)$");
  private static final Pattern RECEIVED_PATTERN = Pattern.compile("\\[(.*)\\] Received: (.*)");

  private static LogReplayService instance;

  private final String logFilePath;
  private final List<LogReaderSerialConnection> serialConnections = new CopyOnWriteArrayList<>();
  private ExecutorService executorService;
  private volatile boolean isRunning = false;

  public static synchronized void init(String logFilePath) {
    if (instance == null) {
      instance = new LogReplayService(logFilePath);
      instance.start();
    }
  }

  public static LogReplayService getInstance() {
    return instance;
  }

  public static synchronized void reset() {
    if (instance != null) {
      instance.stop();
      instance = null;
    }
  }

  private LogReplayService(String logFilePath) {
    this.logFilePath = logFilePath;
  }

  public void registerSerialConnection(LogReaderSerialConnection connection) {
    this.serialConnections.add(connection);
  }

  public void unregisterSerialConnection(LogReaderSerialConnection connection) {
    this.serialConnections.remove(connection);
  }

  public void start() {
    if (isRunning) return;
    isRunning = true;
    executorService = Executors.newSingleThreadExecutor();
    executorService.submit(this::replayLoop);
    logger.info("LogReplayService started for file: {}", logFilePath);
  }

  public void stop() {
    isRunning = false;
    if (executorService != null) {
      executorService.shutdownNow();
    }
  }

  private int totalLines = 0;
  private int linesProcessed = 0;
  private String currentLogTime = "";
  private boolean isFinished = false;

  public com.antigravity.proto.LogReplayStatus getLogReplayStatus() { // fqn-collision
    return com.antigravity.proto.LogReplayStatus.newBuilder() // fqn-collision
        .setLinesProcessed(this.linesProcessed)
        .setTotalLines(this.totalLines)
        .setCurrentLogTime(this.currentLogTime)
        .setIsFinished(this.isFinished)
        .build();
  }

  private void replayLoop() {
    try {
      java.nio.file.Path path = java.nio.file.Paths.get(logFilePath);
      try (java.util.stream.Stream<String> stream = java.nio.file.Files.lines(path)) {
        this.totalLines = (int) stream.count();
      }
    } catch (Exception e) {
      logger.warn("Could not pre-count lines in log file", e);
    }

    long lastReportTime = System.currentTimeMillis();
    this.linesProcessed = 0;
    this.isFinished = false;

    try (BufferedReader reader = new BufferedReader(new FileReader(logFilePath))) {
      String line;
      LocalDateTime lastLogTime = null;

      while (isRunning && (line = reader.readLine()) != null) {
        this.linesProcessed++;
        Matcher matcher = LOG_LINE_PATTERN.matcher(line);
        if (matcher.matches()) {
          String timeStr = matcher.group(1);
          this.currentLogTime = timeStr;
          String message = matcher.group(4);

          LocalDateTime logTime;
          try {
            logTime = LocalDateTime.parse(timeStr, TIME_FORMATTER);
          } catch (DateTimeParseException e) {
            continue;
          }

          if (System.currentTimeMillis() - lastReportTime > 5000) {
            logger.info(
                "Replay Progress: Processed {}/{} lines, current log time: {}",
                this.linesProcessed,
                this.totalLines,
                logTime);
            lastReportTime = System.currentTimeMillis();
          }

          if (lastLogTime != null) {
            long millisToWait = ChronoUnit.MILLIS.between(lastLogTime, logTime);
            Race currentRace = ClientSubscriptionManager.getInstance().getRace();
            boolean isPreRaceIdle =
                (currentRace == null || currentRace.getState() instanceof NotStarted);
            if (!isPreRaceIdle && millisToWait > 0) {
              long actualSleep = Math.min(millisToWait, 60000L);
              Thread.sleep(actualSleep);
            }
          }
          lastLogTime = logTime;

          processLogMessage(message);

          if (this.linesProcessed % 100 == 0) {
            ClientSubscriptionManager.getInstance().broadcastSystemState();
          }
        }
      }
      this.linesProcessed = this.totalLines;
      this.isFinished = true;
      ClientSubscriptionManager.getInstance().broadcastSystemState();
      logger.info("=====================================================");
      logger.info("  LOG REPLAY COMPLETED (Processed {} lines)", this.linesProcessed);
      logger.info("=====================================================");
    } catch (IOException e) {
      logger.error("Error reading log file for replay", e);
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      logger.info("Log replay interrupted.");
    }
  }

  private void processLogMessage(String message) {
    if (message.contains("RaceConfigDump: ")) {
      try {
        String json =
            message.substring(message.indexOf("RaceConfigDump: ") + "RaceConfigDump: ".length());
        ObjectMapper mapper = new ObjectMapper();
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        RaceConfigDump dump = mapper.readValue(json, RaceConfigDump.class);

        RecordData existingRecords = null;
        if (dump.getRecordDataBase64() != null && !dump.getRecordDataBase64().isEmpty()) {
          existingRecords =
              RecordData.parseFrom(Base64.getDecoder().decode(dump.getRecordDataBase64()));
        }

        Race reconstructedRace =
            new Race.Builder()
                .model(dump.getRace())
                .track(dump.getTrack())
                .drivers(dump.getDrivers())
                .customRotations(dump.getCustomRotations())
                .existingRecords(existingRecords)
                .build();

        ClientSubscriptionManager.getInstance().setRace(reconstructedRace);
        reconstructedRace.init();
        logger.info("Successfully reconstructed Race from LogReplay config dump");
        return;
      } catch (Exception e) {
        logger.error("Failed to reconstruct Race from config dump", e);
      }
    }

    if (message.contains("Received: ")) {
      Matcher m = RECEIVED_PATTERN.matcher(message);
      if (m.matches()) {
        String port = m.group(1);
        String hex = m.group(2).trim();
        byte[] bytes = hexStringToByteArray(hex.replace(" ", ""));
        for (LogReaderSerialConnection conn : serialConnections) {
          if (conn.getPortName() != null && conn.getPortName().equals(port)) {
            conn.injectReceivedData(bytes);
          }
        }
        return;
      }
    }

    if (message.startsWith("ReplayCommandDump: ")) {
      try {
        String json = message.substring("ReplayCommandDump: ".length());
        ObjectMapper mapper = new ObjectMapper();
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        ReplayCommandDump dump = mapper.readValue(json, ReplayCommandDump.class);

        Race race = ClientSubscriptionManager.getInstance().getRace();
        if (race == null) return;

        String command = dump.getCommand();
        Object params = dump.getParameters();
        Map<String, Object> mapParams = null;
        if (params instanceof Map) {
          mapParams = (Map<String, Object>) params;
        }
        processClientCommand(command, mapParams, race);
      } catch (Exception e) {
        logger.error("Failed to replay client command dump", e);
      }
    }
  }

  @SuppressWarnings("unchecked")
  private void processClientCommand(String command, Map<String, Object> mapParams, Race race)
      throws Exception {
    switch (command) {
      case "startRace":
        race.startRace();
        break;
      case "pauseRace":
        race.pauseRace();
        break;
      case "endRace":
        ClientSubscriptionManager.getInstance().forceStopRace();
        break;
      case "nextHeat":
        race.moveToNextHeat();
        break;
      case "restartHeat":
        race.restartHeat();
        break;
      case "skipHeat":
        race.skipHeat();
        break;
      case "skipRace":
        race.skipRace();
        break;
      case "deferHeat":
        race.deferHeat();
        break;
      case "abortTimers":
        race.clearAutoTimers();
        race.pauseRace();
        break;
      case "setMainPower":
        if (mapParams != null) race.setMainPower((Boolean) mapParams.get("on"));
        break;
      case "setLanePower":
        if (mapParams != null)
          race.setLanePower((Boolean) mapParams.get("on"), (Integer) mapParams.get("lane"));
        break;
      case "changeLane":
        if (mapParams != null)
          race.changeLane((Integer) mapParams.get("fromLane"), (Integer) mapParams.get("toLane"));
        break;
      case "resetLaneHeatData":
        handleResetLaneHeatData(mapParams, race);
        break;
      case "updateUserLaps":
        handleUpdateUserLaps(mapParams, race);
        break;
      case "updateHeatUserLaps":
        handleUpdateHeatUserLaps(mapParams, race);
        break;
      case "updateBatchUserLaps":
        handleUpdateBatchUserLaps(mapParams, race);
        break;
      case "modifyHeats":
        handleModifyHeats(mapParams, race);
        break;
      case "regenerateHeats":
        handleRegenerateHeats(mapParams, race);
        break;
      case "finalizeModifyHeats":
        handleFinalizeModifyHeats(race);
        break;
      case "changeActualDriver":
        handleChangeActualDriver(mapParams, race);
        break;
      case "changeHeatActualDriver":
        handleChangeHeatActualDriver(mapParams, race);
        break;
    }
  }

  private void handleResetLaneHeatData(Map<String, Object> mapParams, Race race) {
    if (mapParams != null) {
      int lane = (Integer) mapParams.get("lane");
      Heat currentHeat = race.getCurrentHeat();
      if (currentHeat != null) {
        List<DriverHeatData> drivers = currentHeat.getDrivers();
        if (lane == -1) {
          for (DriverHeatData dhd : drivers) dhd.reset();
        } else if (lane >= 0 && lane < drivers.size()) {
          drivers.get(lane).reset();
        }
        race.broadcast(race.createSnapshot());
      }
    }
  }

  @SuppressWarnings("unchecked")
  private void handleUpdateUserLaps(Map<String, Object> mapParams, Race race) {
    if (mapParams != null) {
      int lane = (Integer) mapParams.get("lane");
      Map<String, Object> body = (Map<String, Object>) mapParams.get("body");
      Heat currentHeat = race.getCurrentHeat();
      if (currentHeat != null && currentHeat.isStarted()) {
        List<DriverHeatData> drivers = currentHeat.getDrivers();
        if (lane >= 0 && lane < drivers.size()) {
          DriverHeatData dhd = drivers.get(lane);
          if (body.containsKey("userLaps")) {
            double value = ((Number) body.get("userLaps")).doubleValue();
            dhd.setUserLaps(value);
            currentHeat.initializeStandings(
                race.getRaceModel().getHeatScoring(), race.getRaceModel().isPractice());
            race.updateAndBroadcastOverallStandings();
            race.updateScoreRecords();
            race.broadcast(race.createSnapshot());
          }
        }
      }
      ClientSubscriptionManager.getInstance().autoSave(race);
    }
  }

  @SuppressWarnings("unchecked")
  private void handleUpdateHeatUserLaps(Map<String, Object> mapParams, Race race) {
    if (mapParams != null) {
      int heatNumber = (Integer) mapParams.get("heatNumber");
      int lane = (Integer) mapParams.get("lane");
      Map<String, Object> body = (Map<String, Object>) mapParams.get("body");
      List<Heat> heats = race.getHeats();
      if (heatNumber >= 1 && heatNumber <= heats.size()) {
        Heat heat = heats.get(heatNumber - 1);
        if (heat.isStarted()) {
          List<DriverHeatData> drivers = heat.getDrivers();
          if (lane >= 0 && lane < drivers.size()) {
            DriverHeatData dhd = drivers.get(lane);
            if (body.containsKey("userLaps")) {
              double value = ((Number) body.get("userLaps")).doubleValue();
              dhd.setUserLaps(value);
              heat.initializeStandings(
                  race.getRaceModel().getHeatScoring(), race.getRaceModel().isPractice());
              race.updateAndBroadcastOverallStandings();
              race.updateScoreRecords();
              race.broadcast(race.createSnapshot());
            }
          }
        }
      }
      ClientSubscriptionManager.getInstance().autoSave(race);
    }
  }

  @SuppressWarnings("unchecked")
  private void handleUpdateBatchUserLaps(Map<String, Object> mapParams, Race race) {
    if (mapParams != null) {
      List<Map<String, Object>> updates = (List<Map<String, Object>>) mapParams.get("updates");
      Heat currentHeat = race.getCurrentHeat();
      if (currentHeat != null && currentHeat.isStarted()) {
        List<DriverHeatData> drivers = currentHeat.getDrivers();
        for (Map<String, Object> update : updates) {
          int lane = Integer.parseInt(update.get("lane").toString());
          if (update.containsKey("userLaps")) {
            double value = ((Number) update.get("userLaps")).doubleValue();
            if (lane >= 0 && lane < drivers.size()) {
              drivers.get(lane).setUserLaps(value);
            }
          }
        }
        currentHeat.initializeStandings(
            race.getRaceModel().getHeatScoring(), race.getRaceModel().isPractice());
        race.updateAndBroadcastOverallStandings();
        race.updateScoreRecords();
        race.broadcast(race.createSnapshot());
      }
      ClientSubscriptionManager.getInstance().autoSave(race);
    }
  }

  private void handleModifyHeats(Map<String, Object> mapParams, Race race) throws Exception {
    if (mapParams != null) {
      String base64 = (String) mapParams.get("requestBase64");
      ModifyHeatsRequest request = ModifyHeatsRequest.parseFrom(Base64.getDecoder().decode(base64));
      race.modifyHeats(request);
    }
  }

  private void handleRegenerateHeats(Map<String, Object> mapParams, Race race) throws Exception {
    if (mapParams != null) {
      String base64 = (String) mapParams.get("requestBase64");
      RegenerateHeatsRequest request =
          RegenerateHeatsRequest.parseFrom(Base64.getDecoder().decode(base64));
      race.regenerateHeats(request);
    }
  }

  private void handleFinalizeModifyHeats(Race race) {
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
  }

  private void handleChangeActualDriver(Map<String, Object> mapParams, Race race) {
    if (mapParams != null) {
      int lane = (Integer) mapParams.get("lane");
      String driverId = (String) mapParams.get("driverId");
      Driver driver = null;
      if (Driver.EMPTY_DRIVER_ID.equals(driverId)) {
        driver = Driver.EMPTY_DRIVER;
      } else {
        for (RaceParticipant rp : race.getDrivers()) {
          if (rp.getDriver() != null && rp.getDriver().getEntityId().equals(driverId)) {
            driver = rp.getDriver();
            break;
          }
        }
      }
      if (driver != null) {
        List<DriverHeatData> drivers = race.getCurrentHeat().getDrivers();
        if (lane >= 0 && lane < drivers.size()) {
          DriverHeatData dhd = drivers.get(lane);
          dhd.setActualDriver(driver);
          ClientSubscriptionManager.getInstance().autoSave(race);
        }
      }
    }
  }

  private void handleChangeHeatActualDriver(Map<String, Object> mapParams, Race race) {
    if (mapParams != null) {
      int heatNumber = (Integer) mapParams.get("heatNumber");
      int lane = (Integer) mapParams.get("lane");
      String driverId = (String) mapParams.get("driverId");
      Driver driver = null;
      if (Driver.EMPTY_DRIVER_ID.equals(driverId)) {
        driver = Driver.EMPTY_DRIVER;
      } else {
        for (RaceParticipant rp : race.getDrivers()) {
          if (rp.getDriver() != null && rp.getDriver().getEntityId().equals(driverId)) {
            driver = rp.getDriver();
            break;
          }
        }
      }
      if (driver != null) {
        List<Heat> heats = race.getHeats();
        if (heatNumber >= 1 && heatNumber <= heats.size()) {
          Heat heat = heats.get(heatNumber - 1);
          List<DriverHeatData> drivers = heat.getDrivers();
          if (lane >= 0 && lane < drivers.size()) {
            DriverHeatData dhd = drivers.get(lane);
            dhd.setActualDriver(driver);
            ClientSubscriptionManager.getInstance().autoSave(race);
          }
        }
      }
    }
  }

  private static byte[] hexStringToByteArray(String s) {
    int len = s.length();
    byte[] data = new byte[len / 2];
    for (int i = 0; i < len; i += 2) {
      data[i / 2] =
          (byte) ((Character.digit(s.charAt(i), 16) << 4) + Character.digit(s.charAt(i + 1), 16));
    }
    return data;
  }
}
