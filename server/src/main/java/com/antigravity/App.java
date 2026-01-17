package com.antigravity;

import io.javalin.Javalin;
import io.javalin.http.staticfiles.Location;
import com.antigravity.proto.HelloRequest;
import com.antigravity.proto.HelloResponse;
import com.google.protobuf.InvalidProtocolBufferException;

import com.antigravity.models.Driver;
import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import de.flapdoodle.embed.mongo.config.Net;
import de.flapdoodle.embed.mongo.distribution.Version;
import de.flapdoodle.embed.mongo.transitions.Mongod;
import de.flapdoodle.embed.mongo.transitions.RunningMongodProcess;
import de.flapdoodle.embed.mongo.types.DatabaseDir;
import de.flapdoodle.embed.process.runtime.Network;
import de.flapdoodle.reverse.TransitionWalker;
import de.flapdoodle.reverse.transitions.Start;
import org.bson.codecs.configuration.CodecRegistry;
import org.bson.codecs.pojo.PojoCodecProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import de.flapdoodle.embed.process.io.ProcessOutput;
import de.flapdoodle.embed.process.io.Processors;
import de.flapdoodle.embed.process.io.Slf4jLevel;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

import static org.bson.codecs.configuration.CodecRegistries.fromProviders;
import static org.bson.codecs.configuration.CodecRegistries.fromRegistries;

public class App {
    private static TransitionWalker.ReachedState<RunningMongodProcess> mongodProcess;
    private static final int MONGO_PORT = 27017; // Default MongoDB port
    private static Javalin app;
    private static MongoClient mongoClient;
    private static final Logger logger = LoggerFactory.getLogger(App.class);

    public static void main(String[] args) {
        startEmbeddedMongo();

        // Add a shutdown hook to stop the embedded MongoDB server
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            System.out.println("Shutting down server...");
            if (app != null) {
                try {
                    app.stop();
                } catch (Exception e) {
                    System.err.println("Error stopping Javalin: " + e.getMessage());
                }
            }
            if (mongoClient != null) {
                try {
                    mongoClient.close();
                } catch (Exception e) {
                    System.err.println("Error closing MongoClient: " + e.getMessage());
                }
            }
            if (mongodProcess != null) {
                System.out.println("Stopping embedded MongoDB...");
                mongodProcess.close();
                System.out.println("Embedded MongoDB stopped.");
            }
            System.out.println("Server stopped.");
        }));

        // MongoDB Setup
        CodecRegistry pojoCodecRegistry = fromRegistries(MongoClientSettings.getDefaultCodecRegistry(),
                fromProviders(PojoCodecProvider.builder().automatic(true).build()));

        MongoClientSettings settings = MongoClientSettings.builder()
                .applyConnectionString(new ConnectionString("mongodb://localhost:" + MONGO_PORT))
                .codecRegistry(pojoCodecRegistry)
                .applyToClusterSettings(b -> b.serverSelectionTimeout(2000, java.util.concurrent.TimeUnit.MILLISECONDS))
                .build();

        mongoClient = MongoClients.create(settings);
        MongoDatabase database = mongoClient.getDatabase("racecoordinator");
        MongoCollection<Driver> driverCollection = database.getCollection("drivers", Driver.class);
        MongoCollection<com.antigravity.models.Track> trackCollection = database.getCollection("tracks",
                com.antigravity.models.Track.class);

        // Force a connection check - this will throw an exception if MongoDB is not
        // reachable within the timeout
        // Initialize Database (Reset to Factory Settings)
        new com.antigravity.service.DatabaseService().resetToFactory(database);
        System.out.println("Connected to MongoDB successfully.");

        app = Javalin.create(config -> {
            // Check if running from root or server directory
            String clientPath = "client/dist/client";
            if (!Files.exists(Paths.get(clientPath))) {
                clientPath = "../client/dist/client";
            }
            config.addStaticFiles(clientPath, Location.EXTERNAL);
            config.enableCorsForAllOrigins();
        }).start(7070);

        app.get("/api/hello", ctx -> ctx.result("Hello from Java Server"));

        app.get("/api/drivers", ctx -> {
            List<Driver> drivers = new ArrayList<>();
            driverCollection.find().forEach(drivers::add);
            ctx.json(drivers);
        });

        app.get("/api/tracks", ctx -> {
            List<com.antigravity.models.Track> tracks = new ArrayList<>();
            trackCollection.find().forEach(tracks::add);
            ctx.json(tracks);
        });

        app.post("/api/proto-hello", ctx -> {
            try {
                HelloRequest request = HelloRequest.parseFrom(ctx.bodyAsBytes());
                HelloResponse response = HelloResponse.newBuilder()
                        .setGreeting("Hello " + request.getName() + " from Protobuf!")
                        .build();
                ctx.contentType("application/octet-stream").result(response.toByteArray());
            } catch (InvalidProtocolBufferException e) {
                ctx.status(400).result("Invalid Protobuf message: " + e.getMessage());
            }
        });
    }

    private static void startEmbeddedMongo() {
        try {
            System.out.println("Starting embedded MongoDB 4.x...");
            String dataDir = "mongodb_data";
            if (!Files.exists(Paths.get(dataDir))) {
                Files.createDirectories(Paths.get(dataDir));
            }

            mongodProcess = Mongod.instance()
                    .withProcessOutput(Start.to(ProcessOutput.class).initializedWith(ProcessOutput.builder()
                            .output(Processors.logTo(logger, Slf4jLevel.INFO))
                            .error(Processors.logTo(logger, Slf4jLevel.ERROR))
                            .commands(Processors.logTo(logger, Slf4jLevel.DEBUG))
                            .build()))
                    .withDatabaseDir(Start.to(DatabaseDir.class).initializedWith(DatabaseDir.of(Paths.get(dataDir))))
                    .withNet(Start.to(Net.class)
                            .initializedWith(Net.of("localhost", MONGO_PORT, Network.localhostIsIPv6())))
                    .start(Version.Main.V4_4);

            System.out.println("Embedded MongoDB started with storage at " + dataDir);
        } catch (IOException e) {
            System.err.println("Error starting embedded MongoDB: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }
}
