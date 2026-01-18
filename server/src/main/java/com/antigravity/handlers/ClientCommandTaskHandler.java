package com.antigravity.handlers;

import com.antigravity.proto.InitializeRaceRequest;
import com.antigravity.proto.InitializeRaceResponse;
import com.antigravity.service.DatabaseService;
import com.mongodb.client.MongoDatabase;
import com.google.protobuf.InvalidProtocolBufferException;
import io.javalin.http.Context;

public class ClientCommandTaskHandler {

    private final MongoDatabase database;

    public ClientCommandTaskHandler(MongoDatabase database, io.javalin.Javalin app) {
        this.database = database;
        app.post("/api/initialize-race", this::initializeRace);
    }

    public void initializeRace(Context ctx) {
        try {
            InitializeRaceRequest request = InitializeRaceRequest.parseFrom(ctx.bodyAsBytes());
            System.out.println("InitializeRaceRequest received: race_id=" + request.getRaceId() + ", driver_ids="
                    + request.getDriverIdsList());

            com.antigravity.models.Race raceModel = new DatabaseService().getRace(database, request.getRaceId());

            if (raceModel == null) {
                ctx.status(404).result("Race not found");
                return;
            }

            // Create the runtime race instance
            com.antigravity.race.Race race = new com.antigravity.race.Race(raceModel, request.getIsDemoMode());
            com.antigravity.race.RaceManager.getInstance().setRace(race);
            System.out.println("Initialized race: " + race.getRaceModel().getName());

            InitializeRaceResponse response = InitializeRaceResponse.newBuilder()
                    .setSuccess(true)
                    .setMessage("Race initialized successfully")
                    .build();
            ctx.contentType("application/octet-stream").result(response.toByteArray());
        } catch (InvalidProtocolBufferException e) {
            System.err.println("Error parsing InitializeRaceRequest: " + e.getMessage());
            ctx.status(400).result("Invalid Protobuf message: " + e.getMessage());
        }
    }
}
