package com.antigravity.race;

import com.antigravity.protocols.ProtocolDelegate;
import com.google.protobuf.GeneratedMessageV3;
import io.javalin.websocket.WsContext;
import java.util.Collections;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import com.antigravity.context.DatabaseContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.File;
import java.io.FileWriter;

public class ClientSubscriptionManager {
  private static ClientSubscriptionManager instance;
  private Race currentRace;
  private ProtocolDelegate currentProtocol;
  private DatabaseContext databaseContext;
  private volatile boolean isShuttingDown = false;
  private final Set<WsContext> sessions = Collections.newSetFromMap(new ConcurrentHashMap<>());
  private final Set<WsContext> raceDataSubscribers = Collections.newSetFromMap(new ConcurrentHashMap<>());
  private final Set<WsContext> interfaceSubscribers = Collections.newSetFromMap(new ConcurrentHashMap<>());

  private ClientSubscriptionManager() {
  }

  public static synchronized ClientSubscriptionManager getInstance() {
    if (instance == null) {
      instance = new ClientSubscriptionManager();
    }
    return instance;
  }

  public synchronized void setDatabaseContext(DatabaseContext databaseContext) {
    this.databaseContext = databaseContext;
  }

  public void setShuttingDown(boolean shuttingDown) {
    this.isShuttingDown = shuttingDown;
  }

  public synchronized void setRace(Race race) {
    if (race != null && this.currentProtocol != null) {
      throw new IllegalStateException("Cannot set race while protocol is active");
    }
    if (this.currentRace != null) {
      if (race == null) {
        this.currentRace.setMainPower(true);
        this.currentRace.setLanePower(true, -1);
      }
      this.currentRace.stop();
    }
    this.currentRace = race;

    if (this.currentRace != null) {
      System.out.println("New race set. Clients must explicitly subscribe to race data.");
    }

  }

  public synchronized Race getRace() {
    return currentRace;
  }

  public synchronized void setProtocol(ProtocolDelegate protocol) {
    if (protocol != null && this.currentRace != null) {
      throw new IllegalStateException("Cannot set protocol while race is active");
    }
    if (this.currentProtocol != null) {
      try {
        this.currentProtocol.close();
      } catch (Exception e) {
        System.err.println("Error closing protocol: " + e.getMessage());
        e.printStackTrace();
      }
    }
    this.currentProtocol = protocol;
  }

  public synchronized ProtocolDelegate getProtocol() {
    return currentProtocol;
  }

  public void addSession(WsContext ctx) {
    sessions.add(ctx);
    // Remove auto-subscription: clients must call subscribe() explicitly
    // raceDataSubscribers.add(ctx);
    System.out.println("New WebSocket session added. Total sessions: " + sessions.size());

    if (currentRace != null) {
      com.antigravity.proto.RaceData snapshot = currentRace.createSnapshot();
      ctx.send(java.nio.ByteBuffer.wrap(snapshot.toByteArray()));
    }
  }

  public void removeSession(WsContext ctx) {
    sessions.remove(ctx);
    raceDataSubscribers.remove(ctx);
    System.out.println("WebSocket session removed. Total sessions: " + sessions.size() + ", Subscribers: "
        + raceDataSubscribers.size());

    checkAndStopRace();
  }

  public void addInterfaceSession(WsContext ctx) {
    sessions.add(ctx);
    interfaceSubscribers.add(ctx);
    System.out.println("New Interface WebSocket session added. Total sessions: " + sessions.size()
        + ", Interface Subscribers: "
        + interfaceSubscribers.size());
  }

  public void removeInterfaceSession(WsContext ctx) {
    sessions.remove(ctx);
    interfaceSubscribers.remove(ctx);
    System.out.println(
        "Interface WebSocket session removed. Total sessions: " + sessions.size() + ", Interface Subscribers: "
            + interfaceSubscribers.size());
    checkAndCloseProtocol();
  }

  private void checkAndCloseProtocol() {
    if (interfaceSubscribers.isEmpty() && currentProtocol != null && currentRace == null) {
      System.out.println("Last interested interface client disconnected. Closing current protocol.");
      try {
        currentProtocol.close();
      } catch (Exception e) {
        System.err.println("Error closing protocol: " + e.getMessage());
        e.printStackTrace();
      }
      currentProtocol = null;
    }
  }

  public void handleRaceSubscription(WsContext ctx, com.antigravity.proto.RaceSubscriptionRequest request) {
    if (request.getSubscribe()) {
      raceDataSubscribers.add(ctx);
      System.out.println("Client subscribed to race data. Subscribers: " + raceDataSubscribers.size());
      // Send current state immediately upon subscription if race exists
      if (currentRace != null) {
        com.antigravity.proto.RaceData snapshot = currentRace.createSnapshot();
        ctx.send(java.nio.ByteBuffer.wrap(snapshot.toByteArray()));
      }
    } else {
      raceDataSubscribers.remove(ctx);
      System.out.println("Client unsubscribed from race data. Subscribers: " + raceDataSubscribers.size());
      checkAndStopRace();
    }
  }

  private void checkAndStopRace() {
    if (raceDataSubscribers.isEmpty() && currentRace != null) {
      if (!isShuttingDown) {
        System.out.println("Last interested client disconnected/unsubscribed. Stopping and clearing current race.");
        deleteAutoSave(currentRace.getRaceModel().getEntityId());
        setRace(null);
      } else {
        System.out.println("Server is shutting down, preserving race state and auto-save.");
      }
    }
  }

  public synchronized void autoSave(Race race) {
    if (race == null || databaseContext == null)
      return;
    try {
      RaceSaveData saveData = new RaceSaveData();
      saveData.setModel(race.getRaceModel());
      saveData.setTrack(race.getTrack());
      saveData.setDrivers(race.getDrivers());
      saveData.setHeats(race.getHeats());
      saveData.setStateClassName(race.getState().getClass().getName());
      saveData.setAccumulatedRaceTime(race.getRaceTime());
      saveData.setHasRacedInCurrentHeat(race.hasRacedInCurrentHeat());
      saveData.setCurrentHeatIndex(race.getHeats().indexOf(race.getCurrentHeat()));
      saveData.setDemoMode(race.isDemoMode());

      ObjectMapper mapper = getObjectMapper();
      String json = mapper.writeValueAsString(saveData);

      String dbName = databaseContext.getCurrentDatabaseName();
      String saveDir = databaseContext.getDataRoot() + dbName + File.separator + "saved_races";
      File dir = new File(saveDir);
      if (!dir.exists() && !dir.mkdirs()) {
        System.err.println("Failed to create save directory for auto-save");
        return;
      }

      String filename = "autosave_" + race.getRaceModel().getEntityId() + ".json";
      File file = new File(dir, filename);
      try (FileWriter writer = new FileWriter(file)) {
        writer.write(json);
      }
      System.out.println("Auto-saved race: " + filename);
    } catch (Exception e) {
      System.err.println("Error during auto-save: " + e.getMessage());
    }
  }

  public synchronized void deleteAutoSave(String raceId) {
    if (databaseContext == null || raceId == null)
      return;
    try {
      String dbName = databaseContext.getCurrentDatabaseName();
      String saveDir = databaseContext.getDataRoot() + dbName + File.separator + "saved_races";
      String filename = "autosave_" + raceId + ".json";
      File file = new File(saveDir, filename);
      if (file.exists() && file.delete()) {
        System.out.println("Deleted auto-save: " + filename);
      }
    } catch (Exception e) {
      System.err.println("Error deleting auto-save: " + e.getMessage());
    }
  }

  private ObjectMapper getObjectMapper() {
    ObjectMapper mapper = new ObjectMapper();
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

  public boolean hasSubscribers() {
    return !raceDataSubscribers.isEmpty();
  }

  public void broadcast(GeneratedMessageV3 message) {
    if (raceDataSubscribers.isEmpty()) {
      return;
    }

    byte[] bytes = message.toByteArray();

    raceDataSubscribers.stream()
        .filter(ctx -> ctx.session.isOpen())
        .forEach(ctx -> {
          ctx.send(java.nio.ByteBuffer.wrap(bytes));
        });
  }

  public void broadcastInterfaceEvent(com.antigravity.proto.InterfaceEvent event) {
    if (interfaceSubscribers.isEmpty()) {
      return;
    }

    if (event.hasStatus()) {
      System.out.println("DEBUG: Broadcasting Interface Status: " + event.getStatus().getStatus() + " to "
          + interfaceSubscribers.size() + " subscribers");
    }

    byte[] bytes = event.toByteArray();

    interfaceSubscribers.stream()
        .filter(ctx -> ctx.session.isOpen())
        .forEach(ctx -> {
          ctx.send(java.nio.ByteBuffer.wrap(bytes));
        });
  }
}
