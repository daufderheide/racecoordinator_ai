package com.antigravity.race;

import com.antigravity.protocols.IProtocol;
import com.google.protobuf.GeneratedMessageV3;
import io.javalin.websocket.WsContext;
import java.util.Collections;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

public class ClientSubscriptionManager {
  private static ClientSubscriptionManager instance;
  private Race currentRace;
  private IProtocol currentProtocol;
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

  public synchronized void setProtocol(IProtocol protocol) {
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

  public synchronized IProtocol getProtocol() {
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
      System.out.println("Last interested client disconnected/unsubscribed. Stopping and clearing current race.");
      setRace(null);
    }
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

    byte[] bytes = event.toByteArray();

    interfaceSubscribers.stream()
        .filter(ctx -> ctx.session.isOpen())
        .forEach(ctx -> {
          ctx.send(java.nio.ByteBuffer.wrap(bytes));
        });
  }
}
