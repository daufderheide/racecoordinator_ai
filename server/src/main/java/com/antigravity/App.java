package com.antigravity;

import static org.bson.codecs.configuration.CodecRegistries.fromProviders;
import static org.bson.codecs.configuration.CodecRegistries.fromRegistries;

import com.antigravity.context.DatabaseContext;
import com.antigravity.handlers.AssetTaskHandler;
import com.antigravity.handlers.ClientCommandTaskHandler;
import com.antigravity.handlers.DatabaseTaskHandler;
import com.antigravity.handlers.SettingsTaskHandler;
import com.antigravity.handlers.ThemeTaskHandler;
import com.antigravity.proto.RaceSubscriptionRequest;
import com.antigravity.race.ClientSubscriptionManager;
import com.antigravity.service.AssetService;
import com.antigravity.service.DatabaseService;
import com.antigravity.service.ServerConfigService;
import com.antigravity.util.RobustBooleanCodec;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoDatabase;
import de.flapdoodle.embed.mongo.commands.MongodArguments;
import de.flapdoodle.embed.mongo.config.Net;
import de.flapdoodle.embed.mongo.distribution.Version;
import de.flapdoodle.embed.mongo.transitions.ImmutableMongod;
import de.flapdoodle.embed.mongo.transitions.Mongod;
import de.flapdoodle.embed.mongo.transitions.RunningMongodProcess;
import de.flapdoodle.embed.mongo.types.DatabaseDir;
import de.flapdoodle.embed.process.io.ProcessOutput;
import de.flapdoodle.embed.process.io.Processors;
import de.flapdoodle.embed.process.io.Slf4jLevel;
import de.flapdoodle.reverse.TransitionWalker;
import de.flapdoodle.reverse.transitions.Start;
import io.javalin.Javalin;
import io.javalin.http.staticfiles.Location;
import io.javalin.plugin.json.JavalinJackson;
import java.awt.Desktop;
import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.Enumeration;
import java.util.List;
import java.util.concurrent.TimeUnit;
import org.bson.codecs.configuration.CodecRegistries;
import org.bson.codecs.configuration.CodecRegistry;
import org.bson.codecs.pojo.PojoCodecProvider;
import org.bson.types.ObjectId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class App {

  private static TransitionWalker.ReachedState<RunningMongodProcess> mongodProcess;
  private static final int MONGO_PORT = 8085; // Default MongoDB port
  private static Javalin app;
  private static MongoClient mongoClient;
  private static boolean flapdoodleRetried = false;

  static {
    // Ensure app.data.dir is set as a system property early for Logback
    String defaultDataDir;
    String os = System.getProperty("os.name").toLowerCase();
    if (os.contains("win")) {
      String programData = System.getenv("ProgramData");
      if (programData != null && !programData.isEmpty()) {
        defaultDataDir = Paths.get(programData, "Race Coordinator AI").toString();
      } else {
        defaultDataDir = Paths.get(System.getProperty("user.home"), ".racecoordinator").toString();
      }
    } else {
      defaultDataDir = Paths.get(System.getProperty("user.dir"), "app_data").toString();
    }

    if (System.getProperty("app.data.dir") == null) {
      System.setProperty("app.data.dir", defaultDataDir);
    }
  }

  private static final Logger logger = LoggerFactory.getLogger(App.class);

  public static final String SERVER_VERSION = "0.0.0.20";

  static boolean shouldUseEmbeddedMongo(String[] args) {
    boolean useEmbeddedMongo = true;

    String envUseEmbedded = System.getenv("USE_EMBEDDED_MONGO");
    if (envUseEmbedded != null && envUseEmbedded.equalsIgnoreCase("false")) {
      useEmbeddedMongo = false;
    }

    for (String arg : args) {
      if ("--no-embedded-mongo".equals(arg)) {
        useEmbeddedMongo = false;
      }
    }

    return useEmbeddedMongo;
  }

  @SuppressWarnings("checkstyle:MethodLength")
  public static void main(String[] args) {
    try {
      logger.info("Race Coordinator AI Server {}", SERVER_VERSION);
      String projectDir = System.getProperty("user.dir");
      String appDataDir =
          System.getProperty("app.data.dir", Paths.get(projectDir, "app_data").toString());
      appDataDir = Paths.get(appDataDir).toAbsolutePath().normalize().toString();
      logger.info("Using app data directory: {}", appDataDir);
      String tmpDir = Paths.get(appDataDir, "server_temp").toString();
      System.setProperty("de.flapdoodle.embed.io.tmpdir", tmpDir);
      logger.info("Set de.flapdoodle.embed.io.tmpdir to: {}", tmpDir);
      try {
        Path tmpPath = Paths.get(tmpDir);
        if (!Files.exists(tmpPath)) {
          Files.createDirectories(tmpPath);
        }
        // System.setProperty("java.io.tmpdir", tmpDir);
        logger.debug("Left java.io.tmpdir as default (commented out custom setter)");
      } catch (Exception e) {
        logger.error("Failed to set java.io.tmpdir", e);
      }

      boolean useEmbeddedMongo = shouldUseEmbeddedMongo(args);
      boolean headless = false;

      for (String arg : args) {
        if ("--headless".equals(arg)) {
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
      Runtime.getRuntime()
          .addShutdownHook(
              new Thread(
                  () -> {
                    logger.info("Shutting down server...");
                    ClientSubscriptionManager.getInstance().setShuttingDown(true);
                    if (app != null) {
                      try {
                        app.stop();
                      } catch (Exception e) {
                        logger.error("Error stopping Javalin: " + e.getMessage());
                      }
                    }
                    if (mongoClient != null) {
                      Thread closeThread =
                          new Thread(
                              () -> {
                                try {
                                  mongoClient.close();
                                } catch (Exception e) {
                                  logger.error("Error closing MongoClient: " + e.getMessage());
                                }
                              });
                      closeThread.start();
                      try {
                        closeThread.join(3000); // Wait up to 3 seconds
                        if (closeThread.isAlive()) {
                          logger.warn("MongoClient.close() timed out. Proceeding with shutdown.");
                        }
                      } catch (InterruptedException e) {
                        logger.warn("Interrupted while waiting for MongoClient to close.");
                      }
                    }
                    if (mongodProcess != null) {
                      logger.info("Stopping embedded MongoDB...");
                      mongodProcess.close();
                      logger.info("Embedded MongoDB stopped.");
                    }
                    if (manualMongoProcess != null) {
                      logger.info("Stopping manual MongoDB process...");
                      manualMongoProcess.destroy();
                      try {
                        if (!manualMongoProcess.waitFor(5, TimeUnit.SECONDS)) {
                          logger.warn(
                              "MongoDB did not shut down gracefully. Forcing termination...");
                          manualMongoProcess.destroyForcibly();
                        }
                      } catch (InterruptedException e) {
                        manualMongoProcess.destroyForcibly();
                      }

                      // Fallback for Windows if process is still alive (often happens on Win7)
                      if (manualMongoProcess.isAlive()
                          && System.getProperty("os.name").toLowerCase().contains("win")) {
                        logger.info("MongoDB still alive on Windows. Using taskkill fallback...");
                        try {
                          // Kill by image name to be sure, targeting the one we started
                          Runtime.getRuntime().exec("taskkill /F /IM mongod.exe /T");
                        } catch (IOException e) {
                          logger.error("Failed to run taskkill: " + e.getMessage());
                        }
                      }
                      logger.info("Manual MongoDB process handling complete.");
                    }
                    logger.info("Server stopped.");
                  }));

      // MongoDB Setup
      CodecRegistry robustBooleanRegistry = CodecRegistries.fromCodecs(new RobustBooleanCodec());
      CodecRegistry pojoCodecRegistry =
          fromRegistries(
              robustBooleanRegistry,
              MongoClientSettings.getDefaultCodecRegistry(),
              fromProviders(PojoCodecProvider.builder().automatic(true).build()));
      String mongoUri = System.getenv("MONGO_URI");
      if (mongoUri == null || mongoUri.trim().isEmpty()) {
        mongoUri = "mongodb://127.0.0.1:" + MONGO_PORT;
      }

      MongoClientSettings settings =
          MongoClientSettings.builder()
              .applyConnectionString(new ConnectionString(mongoUri))
              .codecRegistry(pojoCodecRegistry)
              .applyToClusterSettings(b -> b.serverSelectionTimeout(1000, TimeUnit.MILLISECONDS))
              .build();

      mongoClient = MongoClients.create(settings);

      // Wait for MongoDB to be ready
      boolean mongoReady = false;
      boolean retried = false;
      for (int i = 0; i < 30; i++) {
        try {
          mongoClient.listDatabaseNames().first();
          mongoReady = true;
          logger.info("MongoDB is ready.");
          break;
        } catch (Exception e) {
          logger.debug("Waiting for MongoDB... ({}/30)", i + 1);
          if (manualMongoProcess != null && !manualMongoProcess.isAlive()) {
            int exitCode = manualMongoProcess.exitValue();
            logger.error(
                "Bundled MongoDB process has stopped unexpectedly with exit code: {}", exitCode);
            if (exitCode == 62 && !retried) {
              logger.warn(
                  "MongoDB exited with code 62 (Wrong version / Upgrade compatibility problem).");
              logger.warn(
                  "This usually happens when upgrading the application to a newer MongoDB version.");
              logger.warn(
                  "Attempting to back up incompatible database files and start a fresh database...");

              try {
                String timestamp = String.valueOf(System.currentTimeMillis());
                Path backupPath = backupIncompatibleDatabase(appDataDir, timestamp);
                if (backupPath != null) {
                  // Restart embedded Mongo
                  logger.info("Restarting MongoDB with a clean data directory...");
                  startEmbeddedMongo();

                  // Reset loop variables to wait again
                  retried = true;
                  i = -1; // Next iteration will be 0
                  continue;
                }
              } catch (IOException ioe) {
                logger.error(
                    "Failed to back up incompatible database directory: {}", ioe.getMessage(), ioe);
              }
            }
            break;
          }
          try {
            Thread.sleep(1000);
          } catch (InterruptedException ie) {
            // Ignore
          }
        }
      }

      if (!mongoReady) {
        logger.error("Fatal: MongoDB failed to start correctly within 30 seconds.");
        System.exit(1);
      }
      // Initialize Database

      // Migration: Move legacy assets if they exist
      File legacyAssets = new File("data/assets");
      File newDefaultAssets = new File("data/Race Coordinator AI DB/assets");
      if (legacyAssets.exists() && legacyAssets.isDirectory() && !newDefaultAssets.exists()) {
        logger.info("Migrating legacy assets to default database...");
        if (newDefaultAssets.mkdirs()) {
          // Actually we want to move the CONTENTS, or rename the directory if parent
          // structure allows.
          // Simplest is to rename data/assets to data/Race Coordinator AI DB/assets
          // But Wait, 'data' is the parent.
          // We can rename "data/assets" to a temporary name, then move it into "data/Race
          // Coordinator AI DB/"

          // Better plan:
          // 1. Rename "data/assets" to "data/assets_legacy"
          // 2. Create "data/Race Coordinator AI DB/assets"
          // 3. Move contents.

          // Even better: Rename "data/assets" -> "data/Race Coordinator AI DB/assets"
          // works if "Race Coordinator AI DB" dir exists.
          // But "data/Race Coordinator AI DB" likely doesn't exist yet (created by Mongo
          // later?).
          // Actually Mongo creates DB files in 'db' path (configured in embedded mongo).
          // 'data' is our own app configuration dir.

          try {
            Path legacyPath = legacyAssets.toPath();
            Path newPath = newDefaultAssets.toPath();
            Files.createDirectories(newPath.getParent()); // Ensure parent exists
            Files.move(legacyPath, newPath, StandardCopyOption.REPLACE_EXISTING);
            logger.info("Assets migrated successfully.");
          } catch (IOException e) {
            logger.error("Asset migration failed", e);
          }
        }
      }
      ServerConfigService configService = new ServerConfigService();
      String lastActiveDb = configService.getLastActiveDatabase();

      List<String> databaseNames = new ArrayList<>();
      mongoClient.listDatabaseNames().forEach(databaseNames::add);

      // Filter out system databases
      List<String> userDatabases = new ArrayList<>();
      for (String dbName : databaseNames) {
        if (!dbName.equals("admin") && !dbName.equals("local") && !dbName.equals("config")) {
          userDatabases.add(dbName);
        }
      }

      String initialDbName;
      boolean needsFactoryReset = false;

      if (userDatabases.isEmpty()) {
        initialDbName = "RaceCoordinator_AI_DB";
        needsFactoryReset = true;
        logger.info(
            "No existing databases found. Creating '{}' with factory defaults.", initialDbName);
      } else {
        // Prioritize last active DB if it exists
        if (lastActiveDb != null && userDatabases.contains(lastActiveDb)) {
          initialDbName = lastActiveDb;
          logger.info("Resuming last active database: '{}'.", initialDbName);
        } else if (userDatabases.contains("Race Coordinator AI DB")) {
          initialDbName = "Race Coordinator AI DB";
          logger.info("Found existing 'Race Coordinator AI DB'. Connecting to it.");
        } else {
          initialDbName = userDatabases.get(0);
          logger.info("Connecting to first available database: '{}'.", initialDbName);
        }
      }

      DatabaseContext databaseContext =
          new DatabaseContext(mongoClient, initialDbName, configService, appDataDir);

      ClientSubscriptionManager.getInstance().setDatabaseContext(databaseContext);

      if (needsFactoryReset) {
        MongoDatabase db = databaseContext.getDatabase();
        String dataRoot = databaseContext.getDataRoot();
        new AssetService(db, dataRoot + initialDbName + "/assets").resetAssets();
        DatabaseService.getInstance().resetToFactory(databaseContext, db);
      }

      logger.info("Connected to MongoDB successfully.");

      logger.info("Starting database backfill loop...");
      // Backfill defaults for all databases
      for (String dbName : databaseContext.listDatabases()) {
        if (dbName.equals("admin") || dbName.equals("local") || dbName.equals("config")) {
          continue;
        }
        logger.info("Backfilling default assets for database: {}", dbName);
        MongoDatabase db = mongoClient.getDatabase(dbName);
        new AssetService(db, appDataDir + File.separator + dbName + File.separator + "assets")
            .backfillDefaults();
      }

      // Determine client path once
      String[] possiblePaths = {"web", "server/web", "client/dist/client", "../client/dist/client"};
      String resolvedClientPath = null;
      for (String path : possiblePaths) {
        if (Files.exists(Paths.get(path))) {
          resolvedClientPath = path;
          break;
        }
      }

      final String staticFilePath = resolvedClientPath != null ? resolvedClientPath : "web";
      logger.info("Serving static files from: {}", staticFilePath);

      logger.info("Starting Javalin on port 7070...");
      app =
          Javalin.create(
                  config -> {
                    config.addStaticFiles(staticFilePath, Location.EXTERNAL);
                    config.enableCorsForAllOrigins();
                    config.maxRequestSize = 250_000_000L; // 250MB

                    ObjectMapper mapper = new ObjectMapper();
                    SimpleModule module = new SimpleModule();
                    module.addDeserializer(
                        ObjectId.class,
                        new JsonDeserializer<ObjectId>() {
                          @Override
                          public ObjectId deserialize(JsonParser p, DeserializationContext ctxt)
                              throws IOException {
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
                  })
              .start(7070);
      logger.info("Javalin started successfully.");

      app.exception(
          Exception.class,
          (e, ctx) -> {
            logger.error("Uncaught exception in " + ctx.path(), e);
            ctx.status(500).result("Internal Server Error: " + e.getMessage());
          });

      // SPA Fallback: Serve index.html for 404s on HTML requests
      app.error(
          404,
          ctx -> {
            String accept = ctx.header("Accept");
            if (accept != null && accept.contains("text/html")) {
              Path indexPath = Paths.get(staticFilePath, "index.html");
              if (Files.exists(indexPath)) {
                ctx.contentType("text/html");
                ctx.result(new String(Files.readAllBytes(indexPath)));
              } else {
                logger.error(
                    "SPA Fallback: index.html not found at {}", indexPath.toAbsolutePath());
              }
            }
          });

      app.ws(
          "/api/race-data",
          ws -> {
            ws.onConnect(
                ctx -> {
                  ClientSubscriptionManager.getInstance().addSession(ctx);
                });
            ws.onClose(
                ctx -> {
                  ClientSubscriptionManager.getInstance().removeSession(ctx);
                });
            ws.onBinaryMessage(
                ctx -> {
                  try {
                    RaceSubscriptionRequest request = RaceSubscriptionRequest.parseFrom(ctx.data());
                    ClientSubscriptionManager.getInstance().handleRaceSubscription(ctx, request);
                  } catch (Exception e) {
                    // Ignore non-subscription messages or invalid protos
                  }
                });
          });

      app.ws(
          "/api/interface-data",
          ws -> {
            ws.onConnect(
                ctx -> {
                  ClientSubscriptionManager.getInstance().addInterfaceSession(ctx);
                });
            ws.onClose(
                ctx -> {
                  ClientSubscriptionManager.getInstance().removeInterfaceSession(ctx);
                });
          });

      new ClientCommandTaskHandler(databaseContext, app);
      new DatabaseTaskHandler(databaseContext, app);
      new AssetTaskHandler(databaseContext, app);
      new ThemeTaskHandler(databaseContext, app);
      new SettingsTaskHandler(app);

      app.get("/api/version", ctx -> ctx.result(SERVER_VERSION));
      app.get("/api/server-ip", ctx -> ctx.result(getLocalIpAddress()));

      // Open Browser after successful start
      if (!headless) {
        openBrowser("http://localhost:7070");
      } else {
        logger.info("Headless mode: Browser will not be opened automatically.");
        logger.info("Server is running at http://localhost:7070");
      }
    } catch (Exception e) {
      logger.error("Fatal error during startup", e);
      System.exit(1);
    }
  }

  private static void openBrowser(String url) {
    try {
      if (Desktop.isDesktopSupported() && Desktop.getDesktop().isSupported(Desktop.Action.BROWSE)) {
        Desktop.getDesktop().browse(new URI(url));
      } else {
        // Fallback for systems where Desktop is not supported (print link)
        logger.info("Server started. Open {} in your browser.", url);
      }
    } catch (Exception e) {
      logger.error("Failed to open browser automatically: {}", e.getMessage());
      logger.info("Please open {} manually.", url);
    }
  }

  private static Process manualMongoProcess;

  @SuppressWarnings("checkstyle:MethodLength")
  private static void startEmbeddedMongo() {
    try {
      logger.info("Starting MongoDB...");

      String appDir = System.getProperty("user.dir");
      String appDataDir =
          System.getProperty("app.data.dir", Paths.get(appDir, "app_data").toString());
      String dataDir = Paths.get(appDataDir, "mongodb_data").toString();

      if (!Files.exists(Paths.get(dataDir))) {
        Files.createDirectories(Paths.get(dataDir));
      }

      // Cleanup stale lock file if it exists (prevents boot failure after crash on
      // legacy Windows)
      File lockFile = new File(dataDir, "mongod.lock");
      if (lockFile.exists()) {
        logger.warn("Stale MongoDB lock file detected. Cleaning up...");
        lockFile.delete();
      }

      // Check for Bundled MongoDB (Offline Support)
      String osName = System.getProperty("os.name");
      String osArch = System.getProperty("os.arch");
      String lowerOs = osName != null ? osName.toLowerCase() : "";
      String mongoBinName = lowerOs.contains("win") ? "mongod.exe" : "mongod";

      // Look for bundled mongo in ./mongodb/bin/
      File bundledMongo = new File(appDir, "mongodb/bin/" + mongoBinName);
      if (!bundledMongo.exists()) {
        bundledMongo = new File(new File(appDir).getParentFile(), "mongodb/bin/" + mongoBinName);
      }
      if (bundledMongo.exists()) {
        logger.info("Found bundled MongoDB: {}", bundledMongo.getAbsolutePath());
        List<String> command = new ArrayList<>();
        command.add(bundledMongo.getAbsolutePath());
        command.add("--dbpath");
        command.add(dataDir);
        command.add("--port");
        command.add(String.valueOf(MONGO_PORT));
        command.add("--bind_ip");
        command.add("127.0.0.1");
        if (!lowerOs.contains("win")) {
          command.add("--nounixsocket");
        }

        if (osName != null) {
          String lowerOsName = osName.toLowerCase();
          String lowerArch = (osArch != null) ? osArch.toLowerCase() : "";
          boolean isLegacyWindows =
              lowerOsName.contains("windows")
                  && (lowerOsName.contains("xp")
                      || lowerOsName.contains("2003")
                      || lowerOsName.contains("vista")
                      || lowerOsName.contains("windows 7")
                      || lowerOsName.contains("windows 8"));
          boolean is32Bit =
              !(lowerArch.contains("64")
                  || lowerArch.contains("amd64")
                  || lowerArch.contains("aarch64"));

          if (isLegacyWindows || is32Bit) {
            logger.info(
                "Legacy/32-bit Windows detected. Adding --storageEngine mmapv1 and --journal for bundled MongoDB.");
            command.add("--storageEngine");
            command.add("mmapv1");
            command.add("--journal");
          }
        }

        ProcessBuilder pb = new ProcessBuilder(command);
        pb.redirectErrorStream(true); // Merge stdout and stderr
        manualMongoProcess = pb.start();

        // Print output in a separate thread so it doesn't block the server but stays
        // visible
        new Thread(
                () -> {
                  try (BufferedReader reader =
                      new BufferedReader(
                          new InputStreamReader(manualMongoProcess.getInputStream()))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                      logger.info("[MongoDB] {}", line);
                    }
                  } catch (IOException e) {
                    // Ignore
                  }
                })
            .start();

        logger.info("Bundled MongoDB started. Waiting for initialization...");
        return;
      }

      logger.info("Bundled MongoDB not found. Starting embedded MongoDB via Flapdoodle...");

      String mongoTempDir = Paths.get(appDataDir, "mongo_temp").toString();
      try {
        Files.createDirectories(Paths.get(mongoTempDir));
      } catch (Exception e) {
        // Ignore
      }

      de.flapdoodle.embed.mongo.distribution.IFeatureAwareVersion mongoVersion = Version.Main.V6_0;

      ImmutableMongod mongod =
          Mongod.instance()
              .withInitTempDirectory(
                  de.flapdoodle.embed.process.transitions.InitTempDirectory.with(
                      Paths.get(mongoTempDir)));
      if (osName != null) {
        logger.debug("Detected OS: {} ({})", osName, osArch);
        String lowerArch = (osArch != null) ? osArch.toLowerCase() : "";

        boolean isLegacyWindows =
            lowerOs.contains("windows")
                && (lowerOs.contains("xp")
                    || lowerOs.contains("2003")
                    || lowerOs.contains("vista")
                    || lowerOs.contains("windows 7")
                    || lowerOs.contains("windows 8"));
        boolean is64Bit =
            lowerArch.contains("64")
                || lowerArch.contains("amd64")
                || lowerArch.contains("aarch64");
        boolean is32Bit = !is64Bit;

        if (isLegacyWindows || (lowerOs.contains("windows") && is32Bit)) {
          logger.info(
              "Legacy/32-bit Windows detected ({}). Force-downgrading MongoDB to 3.2 and using mmapv1 storage engine...",
              osArch);
          mongoVersion = Version.Main.V3_2;
          mongod =
              mongod.withMongodArguments(
                  Start.to(MongodArguments.class)
                      .initializedWith(MongodArguments.defaults().withStorageEngine("mmapv1")));
        }
      }

      mongodProcess =
          mongod
              .withDatabaseDir(
                  Start.to(DatabaseDir.class).initializedWith(DatabaseDir.of(Paths.get(dataDir))))
              .withNet(
                  Start.to(Net.class)
                      .initializedWith(Net.of("localhost", MONGO_PORT, false))) // Use IPv4
              .withProcessOutput(
                  Start.to(ProcessOutput.class)
                      .initializedWith(
                          ProcessOutput.builder()
                              .output(Processors.logTo(logger, Slf4jLevel.INFO))
                              .error(Processors.logTo(logger, Slf4jLevel.ERROR))
                              .commands(
                                  Processors.named(
                                      "[console>]", Processors.logTo(logger, Slf4jLevel.DEBUG)))
                              .build()))
              .start(mongoVersion);

      logger.info("Embedded MongoDB started with storage at {}", dataDir);
    } catch (Exception e) {
      logger.error("Error starting MongoDB: {}", e.getMessage(), e);
      if (!flapdoodleRetried) {
        String msg = e.getMessage();
        if (msg != null
            && (msg.contains("62") || msg.contains("compatibility") || msg.contains("exit code"))) {
          logger.warn(
              "Detected possible MongoDB version incompatibility or startup failure. Attempting to back up and start a fresh database...");
          flapdoodleRetried = true;

          String appDir = System.getProperty("user.dir");
          String appDataDir =
              System.getProperty("app.data.dir", Paths.get(appDir, "app_data").toString());
          try {
            String timestamp = String.valueOf(System.currentTimeMillis());
            Path backupPath = backupIncompatibleDatabase(appDataDir, timestamp);
            if (backupPath != null) {
              // Try starting again
              startEmbeddedMongo();
              return;
            }
          } catch (IOException ioe) {
            logger.error(
                "Failed to back up incompatible database directory: {}", ioe.getMessage(), ioe);
          }
        }
      }
      System.exit(1);
    }
  }

  /* package */ static String getLocalIpAddress() {
    try {
      Enumeration<NetworkInterface> interfaces = NetworkInterface.getNetworkInterfaces();
      while (interfaces.hasMoreElements()) {
        NetworkInterface iface = interfaces.nextElement();
        if (iface.isLoopback() || !iface.isUp()) {
          continue;
        }

        Enumeration<InetAddress> addresses = iface.getInetAddresses();
        while (addresses.hasMoreElements()) {
          InetAddress addr = addresses.nextElement();
          if (addr.isLoopbackAddress()) {
            continue;
          }
          if (addr instanceof Inet4Address) {
            return addr.getHostAddress();
          }
        }
      }
    } catch (Exception e) {
      // Fallback
    }
    try {
      return InetAddress.getLocalHost().getHostAddress();
    } catch (Exception e) {
      return "Unknown";
    }
  }

  /* package */ static Path backupIncompatibleDatabase(String appDataDir, String timestamp)
      throws IOException {
    Path dataPath = Paths.get(appDataDir, "mongodb_data");
    if (Files.exists(dataPath)) {
      Path backupPath = Paths.get(appDataDir, "mongodb_data_backup_4.4_" + timestamp);
      logger.info("Moving incompatible database files from {} to {}", dataPath, backupPath);
      Files.move(dataPath, backupPath);
      logger.info("Backup created successfully at {}", backupPath);
      return backupPath;
    }
    return null;
  }
}
