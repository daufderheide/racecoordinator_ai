package com.antigravity.handlers;

import com.antigravity.converters.ArduinoConfigConverter;
import com.antigravity.proto.InitializeInterfaceRequest;
import com.antigravity.proto.InitializeInterfaceResponse;
import com.antigravity.proto.InitializeRaceRequest;
import com.antigravity.protocols.TestInterfaceListener;
import com.antigravity.protocols.arduino.ArduinoProtocol;
import com.antigravity.service.DatabaseService;
import com.mongodb.client.MongoDatabase;
import io.javalin.http.Context;
import com.antigravity.protocols.IProtocol;

import com.antigravity.race.ClientSubscriptionManager;
import com.antigravity.race.RaceParticipant;

import java.util.stream.Collectors;

public class ClientCommandTaskHandler {

    private final MongoDatabase database;

    public ClientCommandTaskHandler(MongoDatabase database, io.javalin.Javalin app) {
        this.database = database;
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
        app.get("/api/serial-ports", this::getSerialPorts);
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

            if (ClientSubscriptionManager.getInstance().hasSubscribers()
                    && ClientSubscriptionManager.getInstance().getRace() != null) {
                ctx.status(409).result("Cannot start new race while client is watching existing race");
                return;
            }

            // Create the runtime race instance
            java.util.List<com.antigravity.models.Driver> drivers = dbService.getDrivers(database,
                    request.getDriverIdsList());

            com.antigravity.race.Race race = new com.antigravity.race.Race(
                    database, raceModel,
                    drivers.stream().map(RaceParticipant::new).collect(Collectors.toList()),
                    request.getIsDemoMode());
            ClientSubscriptionManager.getInstance().setRace(race);
            System.out.println("Initialized race: " + race.getRaceModel().getName());

            // com.antigravity.models.Track track = race.getTrack();

            com.antigravity.proto.RaceData raceData = race.createSnapshot();
            race.broadcast(raceData);

            com.antigravity.proto.InitializeRaceResponse response = com.antigravity.proto.InitializeRaceResponse
                    .newBuilder()
                    .setSuccess(true)
                    .build();
            ctx.contentType("application/octet-stream").result(response.toByteArray());
        } catch (com.google.protobuf.InvalidProtocolBufferException e) {
            System.err.println("Error parsing InitializeRaceRequest: " + e.getMessage());
            ctx.status(400).result("Invalid Protobuf message: " + e.getMessage());
        } catch (Exception e) {
            System.err.println("Error initializing race: " + e.getMessage());
            e.printStackTrace();
            ctx.status(500).result("Internal Server Error: " + e.toString());
        }
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
}
