package com.antigravity.race;

import com.antigravity.proto.RaceTime;
import com.google.protobuf.GeneratedMessageV3;
import io.javalin.websocket.WsContext;
import java.util.Collections;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

public class RaceManager {
    private static RaceManager instance;
    private Race currentRace;
    private final Set<WsContext> sessions = Collections.newSetFromMap(new ConcurrentHashMap<>());

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
    }

    public synchronized Race getRace() {
        return currentRace;
    }

    public void addSession(WsContext ctx) {
        sessions.add(ctx);
        System.out.println("New WebSocket session added. Total sessions: " + sessions.size());
    }

    public void removeSession(WsContext ctx) {
        sessions.remove(ctx);
        System.out.println("WebSocket session removed. Total sessions: " + sessions.size());
    }

    public void broadcast(GeneratedMessageV3 message) {
        if (sessions.isEmpty()) {
            return;
        }
        // For now, assuming we send byte array or similar.
        // Javalin websockets support send(Object) or send(ByteBuffer).
        // Since it's protobuf, sending bytes is safest.
        byte[] bytes = message.toByteArray();
        System.out.println("RaceManager: Broadcasting " + bytes.length + " bytes.");

        sessions.stream()
                .filter(ctx -> ctx.session.isOpen())
                .forEach(ctx -> {
                    // Reset position to 0 for each send, though wrap() usually creates a new one
                    // actually ByteBuffer.wrap backs the array, so it shares state.
                    // To be safe for concurrent sends or multiple sends, duplicate (unnecessary for
                    // wrap?)
                    // Javalin/Jetty likely reads it.
                    // Safest is to just wrap it fresh or use byte array if we trust it.
                    // But we want to FORCE binary.
                    ctx.send(java.nio.ByteBuffer.wrap(bytes));
                });
    }
}
