package com.antigravity.handlers;

import com.antigravity.proto.InitializeRaceRequest;

import com.antigravity.proto.InitializeRaceResponse;
import com.antigravity.proto.PauseRaceResponse;
import com.antigravity.service.DatabaseService;
import com.mongodb.client.MongoDatabase;
import com.google.protobuf.InvalidProtocolBufferException;
import io.javalin.http.Context;

public class ClientCommandTaskHandler {

    private final MongoDatabase database;

    public ClientCommandTaskHandler(MongoDatabase database, io.javalin.Javalin app) {
        this.database = database;
        app.post("/api/initialize-race", this::initializeRace);
        app.post("/api/start-race", this::startRace);
        app.post("/api/pause-race", this::pauseRace);
    }

    private void initializeRace(Context ctx) {
        try {
            InitializeRaceRequest request = InitializeRaceRequest.parseFrom(ctx.bodyAsBytes());
            System.out.println("InitializeRaceRequest received: race_id=" + request.getRaceId() + ", driver_ids="
                    + request.getDriverIdsList());

            DatabaseService dbService = new DatabaseService();
            com.antigravity.models.Race raceModel = dbService.getRace(database, request.getRaceId());

            if (raceModel == null) {
                ctx.status(404).result("Race not found");
                return;
            }

            // Create the runtime race instance
            com.antigravity.race.Race race = new com.antigravity.race.Race(database, raceModel,
                    request.getIsDemoMode());
            com.antigravity.race.RaceManager.getInstance().setRace(race);
            System.out.println("Initialized race: " + race.getRaceModel().getName());

            java.util.List<com.antigravity.proto.LaneModel> laneModels = new java.util.ArrayList<>();
            for (com.antigravity.models.Lane lane : race.getTrack().getLanes()) {
                laneModels.add(com.antigravity.proto.LaneModel.newBuilder()
                        .setBackgroundColor(lane.getBackground_color())
                        .setForegroundColor(lane.getForeground_color())
                        .setLength(lane.getLength())
                        .build());
            }

            com.antigravity.models.Track track = race.getTrack();
            com.antigravity.proto.TrackModel trackProto = com.antigravity.proto.TrackModel.newBuilder()
                    .setName(track.getName())
                    .setEntityId(track.getEntityId() != null ? track.getEntityId() : "")
                    .addAllLanes(laneModels)
                    .build();

            com.antigravity.proto.RaceModel raceProto = com.antigravity.proto.RaceModel.newBuilder()
                    .setName(race.getRaceModel().getName())
                    .setEntityId(race.getRaceModel().getEntityId() != null ? race.getRaceModel().getEntityId() : "")
                    .setTrack(trackProto)
                    .build();

            java.util.List<com.antigravity.models.Driver> drivers = dbService.getDrivers(database,
                    request.getDriverIdsList());
            java.util.List<com.antigravity.proto.DriverModel> driverModels = new java.util.ArrayList<>();
            for (com.antigravity.models.Driver driver : drivers) {
                driverModels.add(com.antigravity.proto.DriverModel.newBuilder()
                        .setName(driver.getName())
                        .setNickname(driver.getNickname() != null ? driver.getNickname() : "")
                        .setEntityId(driver.getEntityId() != null ? driver.getEntityId() : "")
                        .build());
            }

            InitializeRaceResponse response = InitializeRaceResponse.newBuilder()
                    .setSuccess(true)
                    .setMessage("Race initialized successfully")
                    .setRace(raceProto)
                    .addAllDrivers(driverModels)
                    .build();
            ctx.contentType("application/octet-stream").result(response.toByteArray());
        } catch (InvalidProtocolBufferException e) {
            System.err.println("Error parsing InitializeRaceRequest: " + e.getMessage());
            ctx.status(400).result("Invalid Protobuf message: " + e.getMessage());
        }
    }

    private void startRace(Context ctx) {
        try {
            com.antigravity.race.Race race = com.antigravity.race.RaceManager.getInstance().getRace();
            if (race == null) {
                ctx.status(404).result("No active race found");
                return;
            }

            try {
                race.startRace();

                com.antigravity.proto.StartRaceResponse response = com.antigravity.proto.StartRaceResponse.newBuilder()
                        .setSuccess(true)
                        .setMessage("Race started successfully")
                        .build();
                ctx.contentType("application/octet-stream").result(response.toByteArray());
            } catch (IllegalStateException e) {
                com.antigravity.proto.StartRaceResponse response = com.antigravity.proto.StartRaceResponse.newBuilder()
                        .setSuccess(false)
                        .setMessage(e.getMessage())
                        .build();
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
            com.antigravity.race.Race race = com.antigravity.race.RaceManager.getInstance().getRace();
            if (race == null) {
                ctx.status(404).result("No active race found");
                return;
            }

            try {
                race.pauseRace();

                PauseRaceResponse response = PauseRaceResponse.newBuilder()
                        .setSuccess(true)
                        .setMessage("Race paused successfully")
                        .build();
                ctx.contentType("application/octet-stream").result(response.toByteArray());
            } catch (IllegalStateException e) {
                PauseRaceResponse response = PauseRaceResponse.newBuilder()
                        .setSuccess(false)
                        .setMessage(e.getMessage())
                        .build();
                ctx.contentType("application/octet-stream").result(response.toByteArray());
            }
        } catch (Exception e) {
            System.err.println("Error processing pauseRace: " + e.getMessage());
            e.printStackTrace();
            ctx.status(500).result("Internal Server Error: " + e.getMessage());
        }
    }
}
