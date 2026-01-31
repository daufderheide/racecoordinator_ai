package com.antigravity;

import io.javalin.Javalin;
import io.javalin.http.staticfiles.Location;
import io.javalin.plugin.json.JavalinJackson;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.module.SimpleModule;
import org.bson.types.ObjectId;

import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoDatabase;
import de.flapdoodle.embed.mongo.config.Net;
import de.flapdoodle.embed.mongo.distribution.Version;
import de.flapdoodle.embed.mongo.transitions.Mongod;
import de.flapdoodle.embed.mongo.transitions.RunningMongodProcess;
import de.flapdoodle.embed.mongo.types.DatabaseDir;
import de.flapdoodle.embed.process.io.ProcessOutput;
import de.flapdoodle.embed.process.io.Processors;
import de.flapdoodle.embed.process.io.Slf4jLevel;
import de.flapdoodle.reverse.TransitionWalker;
import de.flapdoodle.reverse.transitions.Start;
import org.bson.codecs.configuration.CodecRegistry;
import org.bson.codecs.pojo.PojoCodecProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

import static org.bson.codecs.configuration.CodecRegistries.fromProviders;
import static org.bson.codecs.configuration.CodecRegistries.fromRegistries;

public class App {
    private static TransitionWalker.ReachedState<RunningMongodProcess> mongodProcess;
    private static final int MONGO_PORT = 27017; // Default MongoDB port
    private static Javalin app;
    private static MongoClient mongoClient;
    private static final Logger logger = LoggerFactory.getLogger(App.class);

    public static void main(String[] args) {
        String projectDir = System.getProperty("user.dir");
        String appDataDir = System.getProperty("app.data.dir",
                Paths.get(projectDir, "app_data").toString());
        String tmpDir = Paths.get(appDataDir, "server_tmp").toString();
        try {
            java.nio.file.Path tmpPath = Paths.get(tmpDir);
            if (!Files.exists(tmpPath)) {
                Files.createDirectories(tmpPath);
            }
            System.setProperty("java.io.tmpdir", tmpDir);
            System.out.println("Set java.io.tmpdir to: " + tmpDir);
        } catch (Exception e) {
            System.err.println("Failed to set java.io.tmpdir: " + e.getMessage());
        }

        boolean useEmbeddedMongo = true;
        boolean headless = false;
        for (String arg : args) {
            if ("--no-embedded-mongo".equals(arg)) {
                useEmbeddedMongo = false;
            } else if ("--headless".equals(arg)) {
                headless = true;
            }
        }

        if (useEmbeddedMongo) {
            startEmbeddedMongo();
        } else {
            logger.info(
                    "Skipping embedded MongoDB start (requested via --no-embedded-mongo). Ensuring external MongoDB is available...");
        }

        // Add a shutdown hook to stop the embedded MongoDB server
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            logger.info("Shutting down server...");
            if (app != null) {
                try {
                    app.stop();
                } catch (Exception e) {
                    logger.error("Error stopping Javalin: " + e.getMessage());
                }
            }
            if (mongoClient != null) {
                try {
                    mongoClient.close();
                } catch (Exception e) {
                    logger.error("Error closing MongoClient: " + e.getMessage());
                }
            }
            if (mongodProcess != null) {
                logger.info("Stopping embedded MongoDB...");
                mongodProcess.close();
                logger.info("Embedded MongoDB stopped.");
            }
            logger.info("Server stopped.");
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

        // Force a connection check - this will throw an exception if MongoDB is not
        // reachable within the timeout

        // Initialize Database (Reset to Factory Settings)
        new com.antigravity.service.AssetService(database).resetAssets();
        new com.antigravity.service.DatabaseService().resetToFactory(database);
        System.out.println("Connected to MongoDB successfully.");

        // Determine client path once
        String[] possiblePaths = { "web", "client/dist/client", "../client/dist/client" };
        String resolvedClientPath = null;
        for (String path : possiblePaths) {
            if (Files.exists(Paths.get(path))) {
                resolvedClientPath = path;
                break;
            }
        }

        final String staticFilePath = resolvedClientPath != null ? resolvedClientPath : "web";
        System.out.println("Serving static files from: " + staticFilePath);

        app = Javalin.create(config -> {
            config.addStaticFiles(staticFilePath, Location.EXTERNAL);
            config.enableCorsForAllOrigins();

            ObjectMapper mapper = new ObjectMapper();
            SimpleModule module = new SimpleModule();
            module.addDeserializer(ObjectId.class, new JsonDeserializer<ObjectId>() {
                @Override
                public ObjectId deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
                    String value = p.getValueAsString();
                    if (value == null || value.isEmpty()) {
                        return null;
                    }
                    try {
                        return new ObjectId(value);
                    } catch (IllegalArgumentException e) {
                        return null;
                    }
                }
            });
            mapper.registerModule(module);
            config.jsonMapper(new JavalinJackson(mapper));
        }).start(7070);

        // SPA Fallback: Serve index.html for 404s on HTML requests
        app.error(404, ctx -> {
            String accept = ctx.header("Accept");
            if (accept != null && accept.contains("text/html")) {
                java.nio.file.Path indexPath = Paths.get(staticFilePath, "index.html");
                if (Files.exists(indexPath)) {
                    ctx.contentType("text/html");
                    ctx.result(new String(Files.readAllBytes(indexPath)));
                } else {
                    System.err.println("SPA Fallback: index.html not found at " + indexPath.toAbsolutePath());
                }
            }
        });

        app.ws("/api/race-data", ws -> {
            ws.onConnect(ctx -> {
                com.antigravity.race.RaceManager.getInstance().addSession(ctx);
            });
            ws.onClose(ctx -> {
                com.antigravity.race.RaceManager.getInstance().removeSession(ctx);
            });
            ws.onBinaryMessage(ctx -> {
                try {
                    com.antigravity.proto.RaceSubscriptionRequest request = com.antigravity.proto.RaceSubscriptionRequest
                            .parseFrom(ctx.data());
                    com.antigravity.race.RaceManager.getInstance().handleRaceSubscription(ctx, request);
                } catch (Exception e) {
                    // Ignore non-subscription messages or invalid protos
                }
            });
        });

        new com.antigravity.handlers.ClientCommandTaskHandler(database, app);
        new com.antigravity.handlers.DatabaseTaskHandler(database, app);
        new com.antigravity.handlers.AssetTaskHandler(database, app);

        // Open Browser after successful start
        if (!headless) {
            openBrowser("http://localhost:7070");
        } else {
            System.out.println("Headless mode: Browser will not be opened automatically.");
            System.out.println("Server is running at http://localhost:7070");
        }
    }

    private static void openBrowser(String url) {
        try {
            if (java.awt.Desktop.isDesktopSupported()
                    && java.awt.Desktop.getDesktop().isSupported(java.awt.Desktop.Action.BROWSE)) {
                java.awt.Desktop.getDesktop().browse(new java.net.URI(url));
            } else {
                // Fallback for systems where Desktop is not supported (print link)
                System.out.println("Server started. Open " + url + " in your browser.");
            }
        } catch (Exception e) {
            System.err.println("Failed to open browser automatically: " + e.getMessage());
            System.out.println("Please open " + url + " manually.");
        }
    }

    private static void startEmbeddedMongo() {
        try {
            System.out.println("Starting embedded MongoDB 4.x...");

            // Use a writable location for database storage
            // Use a writable location for database storage
            String appDataDir = System.getProperty("app.data.dir",
                    Paths.get(System.getProperty("user.dir"), "app_data").toString());
            String dataDir = Paths.get(appDataDir, "mongodb_data").toString();

            // Set temp directory for flapdoodle extraction
            System.setProperty("de.flapdoodle.embed.io.tmpdir", appDataDir);

            System.out.println("Using MongoDB data directory: " + dataDir);

            if (!Files.exists(Paths.get(dataDir))) {
                Files.createDirectories(Paths.get(dataDir));
            }

            de.flapdoodle.embed.mongo.distribution.IFeatureAwareVersion mongoVersion = Version.Main.V4_4;
            String osName = System.getProperty("os.name");
            String osArch = System.getProperty("os.arch");

            if (osName != null) {
                System.out.println("Detected OS: " + osName + " (" + osArch + ")");
                String lowerOs = osName.toLowerCase();
                String lowerArch = (osArch != null) ? osArch.toLowerCase() : "";

                boolean isLegacyWindows = lowerOs.contains("windows")
                        && (lowerOs.contains("xp") || lowerOs.contains("2003"));
                boolean is32Bit = lowerArch.contains("86") && !lowerArch.contains("64");

                if (isLegacyWindows || is32Bit) {
                    System.out
                            .println("Legacy/32-bit Windows detected. Downgrading MongoDB to 3.6 for compatibility...");
                    mongoVersion = Version.Main.V3_6; // V2_6 is deprecated, using V3_6 as fallback
                }
            }

            mongodProcess = Mongod.instance()
                    .withDatabaseDir(Start.to(DatabaseDir.class).initializedWith(DatabaseDir.of(Paths.get(dataDir))))
                    .withNet(Start.to(Net.class)
                            .initializedWith(Net.of("localhost", MONGO_PORT, false))) // Use IPv4
                    .withProcessOutput(Start.to(ProcessOutput.class).initializedWith(ProcessOutput.builder()
                            .output(Processors.logTo(logger, Slf4jLevel.INFO))
                            .error(Processors.logTo(logger, Slf4jLevel.ERROR))
                            .commands(Processors.named("[console>]", Processors.logTo(logger, Slf4jLevel.DEBUG)))
                            .build()))
                    .start(mongoVersion);

            System.out.println("Embedded MongoDB started with storage at " + dataDir);
        } catch (IOException e) {
            System.err.println("Error starting embedded MongoDB: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }
}
