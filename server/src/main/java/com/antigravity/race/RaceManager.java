package com.antigravity.race;

import com.google.protobuf.GeneratedMessageV3;
import io.javalin.websocket.WsContext;
import java.util.Collections;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

public class RaceManager {
    private static RaceManager instance;
    private Race currentRace;
    private final Set<WsContext> sessions = Collections.newSetFromMap(new ConcurrentHashMap<>());
    private final Set<WsContext> raceDataSubscribers = Collections.newSetFromMap(new ConcurrentHashMap<>());

    private RaceManager() {
    }

    public static synchronized RaceManager getInstance() {
        if (instance == null) {
            instance = new RaceManager();
        }
        return instance;
    }

    public synchronized void setRace(Race race) {
        if (this.currentRace != null) {
            this.currentRace.stop();
        }
        this.currentRace = race;

        if (this.currentRace != null) {
            System.out.println("New race set. Resubscribing all " + sessions.size() + " connected sessions.");
            raceDataSubscribers.addAll(sessions);

            // Note: ClientCommandTaskHandler usually calls broadcast(snapshot) immediately
            // after this.
            // But to be safe and ensure correct state synchronization even if called from
            // elsewhere:
            // logic here is superfluous if broadcast is called, but harmless.
            // Actually, ClientCommandTaskHandler calls createSnapshot() -> broadcast().
            // If we add everyone to subscribers here, the subsequent broadcast will reach
            // them.
        }
    }

    public synchronized Race getRace() {
        return currentRace;
    }

    public void addSession(WsContext ctx) {
        sessions.add(ctx);
        // Default to subscribed for backward compatibility and initial connection
        raceDataSubscribers.add(ctx);
        System.out.println("New WebSocket session added. Total sessions: " + sessions.size() + ", Subscribers: "
                + raceDataSubscribers.size());

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
}
