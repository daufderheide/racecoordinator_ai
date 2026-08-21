package com.antigravity;

import com.antigravity.auth.AuthService;
import com.antigravity.auth.AuthUtil;
import com.antigravity.auth.Role;
import com.antigravity.context.DatabaseContext;
import com.antigravity.handlers.AssetTaskHandler;
import com.antigravity.handlers.AuthTaskHandler;
import com.antigravity.handlers.ClientCommandTaskHandler;
import com.antigravity.handlers.DatabaseTaskHandler;
import com.antigravity.handlers.SettingsTaskHandler;
import com.antigravity.handlers.ThemeTaskHandler;
import com.antigravity.proto.RaceSubscriptionRequest;
import com.antigravity.race.ClientSubscriptionManager;
import com.antigravity.service.AssetService;
import com.antigravity.service.DatabaseService;
import com.antigravity.service.ServerConfigService;
import com.antigravity.service.UpdateService;
import com.antigravity.util.NetworkUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.javalin.Javalin;
import io.javalin.http.staticfiles.Location;
import io.javalin.plugin.json.JavalinJackson;
import java.awt.Color;
import java.awt.Desktop;
import java.awt.Graphics2D;
import java.awt.Image;
import java.awt.MenuItem;
import java.awt.PopupMenu;
import java.awt.SystemTray;
import java.awt.TrayIcon;
import java.awt.image.BufferedImage;
import java.io.File;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Enumeration;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class App {

  private static int serverPort = 7070;
  private static Javalin app;

  static {
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

  public static final String SERVER_VERSION = "0.0.0_dev";

  static int parseServerPort(String[] args) {
    int port = 7070;
    String envPort = System.getenv("SERVER_PORT");
    if (envPort == null || envPort.trim().isEmpty()) {
      envPort = System.getenv("PORT");
    }
    if (envPort != null && !envPort.trim().isEmpty()) {
      try {
        port = Integer.parseInt(envPort.trim());
      } catch (NumberFormatException e) {
        logger.warn(
            "Invalid SERVER_PORT / PORT environment variable '{}'. Defaulting to 7070.", envPort);
      }
    }
    if (args != null) {
      for (int i = 0; i < args.length; i++) {
        if (("--port".equals(args[i]) || "-p".equals(args[i])) && i + 1 < args.length) {
          try {
            port = Integer.parseInt(args[i + 1].trim());
          } catch (NumberFormatException e) {
            logger.warn("Invalid --port argument '{}'. Defaulting to {}", args[i + 1], port);
          }
        } else if (args[i].startsWith("--port=")) {
          try {
            port = Integer.parseInt(args[i].substring("--port=".length()).trim());
          } catch (NumberFormatException e) {
            logger.warn("Invalid --port argument '{}'. Defaulting to {}", args[i], port);
          }
        }
      }
    }
    return port;
  }

  static void showPortConflictDialog(String title, String message, boolean headless) {
    logger.error("PORT CONFLICT ERROR - {}: {}", title, message.replace("\n", " "));
    if (!java.awt.GraphicsEnvironment.isHeadless()) {
      try {
        javax.swing.JOptionPane.showMessageDialog(
            null, message, title, javax.swing.JOptionPane.ERROR_MESSAGE);
      } catch (Exception ex) {
        logger.error("Failed to display GUI port conflict alert dialog: {}", ex.getMessage());
      }
    }
  }

  private static void deleteDirectory(File dir) {
    if (dir.exists()) {
      File[] files = dir.listFiles();
      if (files != null) {
        for (File file : files) {
          if (file.isDirectory()) {
            deleteDirectory(file);
          } else {
            file.delete();
          }
        }
      }
      dir.delete();
    }
  }

  @SuppressWarnings("checkstyle:MethodLength")
  public static void main(String[] args) {
    triggerLogRollover();
    try {
      logger.info("Race Coordinator AI Server {}", SERVER_VERSION);
      serverPort = parseServerPort(args);
      logger.info("Configured Server Port: {}", serverPort);

      String projectDir = System.getProperty("user.dir");
      String appDataDir =
          System.getProperty("app.data.dir", Paths.get(projectDir, "app_data").toString());
      appDataDir = Paths.get(appDataDir).toAbsolutePath().normalize().toString();
      logger.info("Using app data directory: {}", appDataDir);

      String logReplayFile = System.getProperty("enableLogReplay");
      if (logReplayFile != null && !logReplayFile.trim().isEmpty()) {
        DatabaseService.getInstance().setReplayMode(true);
        com.antigravity.service.LogReplayService.init(logReplayFile); // fqn-collision
        logger.info("Log Replay Mode Enabled. Reading from {}", logReplayFile);
      }

      boolean headless = false;
      for (String arg : args) {
        if ("--headless".equals(arg)) {
          headless = true;
        }
      }

      // TODO(https://github.com/daufderheide/racecoordinator_ai/issues/581):
      // Remove this mongodb code after it's been in a release for awhile.
      // Legacy Mongo Data directory cleanup to reclaim disk space
      File legacyMongoDir = new File(appDataDir, "mongodb_data");
      if (legacyMongoDir.exists()) {
        logger.info(
            "Found legacy MongoDB data directory at {}. Deleting to reclaim disk space...",
            legacyMongoDir.getAbsolutePath());
        deleteDirectory(legacyMongoDir);
        logger.info("Legacy MongoDB data directory deleted.");
      }
      File legacyTempDir = new File(appDataDir, "mongo_temp");
      if (legacyTempDir.exists()) {
        deleteDirectory(legacyTempDir);
      }

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
                    logger.info("Server stopped.");
                    triggerLogRollover();
                  }));

      ServerConfigService configService = new ServerConfigService();
      List<String> existingDatabases = DatabaseContext.listDatabases(appDataDir);

      String activeDb;
      DatabaseContext databaseContext;
      if (!existingDatabases.contains("RaceCoordinator_AI_DB")) {
        logger.info(
            "Default database 'RaceCoordinator_AI_DB' not found. Creating 'RaceCoordinator_AI_DB' with factory defaults.");
        activeDb = "RaceCoordinator_AI_DB";
        databaseContext = new DatabaseContext(activeDb, configService, appDataDir);
        ClientSubscriptionManager.getInstance().setDatabaseContext(databaseContext);
        databaseContext.createDatabase(activeDb);
        databaseContext.resetDatabaseToFactory(activeDb);
      } else {
        String lastActiveDb = configService.getLastActiveDatabase();
        if (lastActiveDb != null && existingDatabases.contains(lastActiveDb)) {
          activeDb = lastActiveDb;
        } else {
          activeDb = "RaceCoordinator_AI_DB";
        }
        databaseContext = new DatabaseContext(activeDb, configService, appDataDir);
        ClientSubscriptionManager.getInstance().setDatabaseContext(databaseContext);

        DatabaseContext.DatabaseStats stats = databaseContext.getDatabaseStats(activeDb);
        if (stats.driverCount == 0 && stats.trackCount == 0 && stats.raceCount == 0) {
          logger.info("Database '{}' is uninitialized. Resetting to factory defaults...", activeDb);
          databaseContext.resetDatabaseToFactory(activeDb);
        }
      }

      // Perform any pending migrations
      File pendingImportDir = new File(appDataDir, "pending_imports");
      if (pendingImportDir.exists() && pendingImportDir.isDirectory()) {
        logger.info("Found pending database migrations. Importing...");
        File[] zipFiles = pendingImportDir.listFiles((dir, name) -> name.endsWith(".zip"));
        if (zipFiles != null) {
          for (File zipFile : zipFiles) {
            String dbName = zipFile.getName().substring(0, zipFile.getName().length() - 4);
            logger.info("Importing migrated database: {}", dbName);
            try (java.io.FileInputStream fis = new java.io.FileInputStream(zipFile)) {
              databaseContext.importDatabase(dbName, fis);
            } catch (Exception e) {
              logger.error("Failed to import database: " + dbName, e);
            }
          }
        }
        for (File f : pendingImportDir.listFiles()) {
          f.delete();
        }
        pendingImportDir.delete();
        logger.info("Migration imports completed.");
      }

      logger.info("Starting database backfill loop...");
      for (String dbName : databaseContext.listDatabases()) {
        logger.info("Backfilling default assets for database: {}", dbName);
        new AssetService(
                databaseContext, appDataDir + File.separator + dbName + File.separator + "assets")
            .backfillDefaults();
        DatabaseService.getInstance().backfillRaces(databaseContext);
      }

      String[] possiblePaths = {"client/dist/client", "../client/dist/client", "web", "server/web"};
      String resolvedClientPath = null;
      for (String path : possiblePaths) {
        if (Files.exists(Paths.get(path))) {
          resolvedClientPath = path;
          break;
        }
      }

      final String staticFilePath = resolvedClientPath != null ? resolvedClientPath : "web";
      logger.info("Serving static files from: {}", staticFilePath);

      logger.info("Starting Javalin on port {}...", serverPort);
      try {
        app =
            Javalin.create(
                    config -> {
                      config.addStaticFiles(staticFilePath, Location.EXTERNAL);
                      config.enableCorsForAllOrigins();
                      config.maxRequestSize = 250_000_000L;

                      config.accessManager(
                          (handler, ctx, permittedRoles) -> {
                            Role userRole = AuthUtil.getRole(ctx);
                            if (permittedRoles.isEmpty()) {
                              handler.handle(ctx);
                              return;
                            }
                            boolean allowed = false;
                            for (io.javalin.core.security.RouteRole role : permittedRoles) {
                              if (userRole.isAtLeast((Role) role)) {
                                allowed = true;
                                break;
                              }
                            }
                            if (allowed) {
                              handler.handle(ctx);
                            } else {
                              if (userRole == Role.VIEWER) {
                                ctx.status(401).result("Authentication required");
                              } else {
                                ctx.status(403).result("Insufficient permissions");
                              }
                            }
                          });

                      config.jsonMapper(new JavalinJackson(new ObjectMapper()));
                      config.server(
                          () -> {
                            org.eclipse.jetty.server.Server server =
                                new org.eclipse.jetty.server.Server();
                            server.setStopTimeout(1000);
                            return server;
                          });
                    })
                .start(serverPort);
        logger.info("Javalin started successfully on port {}.", serverPort);
      } catch (Exception e) {
        logger.error(
            "Fatal error starting Javalin server on port {}: {}", serverPort, e.getMessage(), e);
        showPortConflictDialog(
            "Race Coordinator AI - Web Server Port Conflict",
            "Failed to start Web Server on port "
                + serverPort
                + ".\n"
                + "Port is already in use or unavailable.\n\n"
                + "Please terminate the process using port "
                + serverPort
                + ", or start with '--port <port>' (or set SERVER_PORT / PORT environment variable).",
            headless);
        System.exit(1);
      }

      app.before(
          ctx -> {
            String path = ctx.path();

            if (!path.startsWith("/api/")
                || (path.startsWith("/api/auth/") && !path.startsWith("/api/auth/password"))
                || path.equals("/api/server-ip")
                || path.equals("/api/version")) {
              return;
            }

            if (NetworkUtils.isLocalhost(ctx.ip(), null)) {
              ctx.attribute("role", Role.ADMIN);
              return;
            }

            String authHeader = ctx.header("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
              String token = authHeader.substring(7);
              if (AuthService.getInstance().isValidToken(token)) {
                ctx.attribute("role", Role.DIRECTOR);
                return;
              }
            }

            ctx.attribute("role", Role.VIEWER);
          });

      app.exception(
          Exception.class,
          (e, ctx) -> {
            logger.error("Uncaught exception in " + ctx.path(), e);
            ctx.status(500).result("Internal Server Error: " + e.getMessage());
          });

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
                    // Ignore non-subscription messages
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

      new AuthTaskHandler(app, configService);
      new ClientCommandTaskHandler(databaseContext, app);
      new DatabaseTaskHandler(databaseContext, app);
      new AssetTaskHandler(databaseContext, app);
      new ThemeTaskHandler(databaseContext, app);
      new SettingsTaskHandler(app, configService);

      UpdateService updateService = new UpdateService(SERVER_VERSION, configService);

      app.get(
          "/api/update/config",
          ctx -> {
            java.util.Map<String, Object> configMap = new java.util.HashMap<>();
            configMap.put("channel", configService.getUpdateChannel());
            configMap.put("skippedVersion", configService.getSkippedUpdateVersion());
            configMap.put("snoozedVersion", configService.getSnoozedUpdateVersion());
            configMap.put("snoozedUntil", configService.getSnoozedUpdateUntil());
            ctx.json(configMap);
          });

      app.post(
          "/api/update/channel",
          ctx -> {
            try {
              String body = ctx.body();
              ObjectMapper mapper = new ObjectMapper();
              com.fasterxml.jackson.databind.JsonNode json = mapper.readTree(body);
              if (json.has("channel")) {
                String channel = json.get("channel").asText().toUpperCase();
                configService.setUpdateChannel(channel);
                updateService.clearCache();
                ctx.status(200).result("Channel updated");
              } else {
                ctx.status(400).result("Missing channel");
              }
            } catch (Exception e) {
              logger.error("Failed to set update channel", e);
              ctx.status(500).result("Internal error");
            }
          },
          Role.ADMIN);

      app.post(
          "/api/update/snooze",
          ctx -> {
            try {
              String body = ctx.body();
              ObjectMapper mapper = new ObjectMapper();
              com.fasterxml.jackson.databind.JsonNode json = mapper.readTree(body);
              if (json.has("version")) {
                String version = json.get("version").asText();
                long days = json.has("durationDays") ? json.get("durationDays").asLong() : 7L;
                long untilTimestamp = System.currentTimeMillis() + (days * 24L * 60L * 60L * 1000L);
                configService.setSnoozedUpdate(version, untilTimestamp);
                updateService.clearCache();
                ctx.status(200).result("Update snoozed");
              } else {
                ctx.status(400).result("Missing version");
              }
            } catch (Exception e) {
              logger.error("Failed to snooze update", e);
              ctx.status(500).result("Internal error");
            }
          },
          Role.ADMIN);

      app.get(
          "/api/update/check",
          ctx -> {
            boolean force = Boolean.parseBoolean(ctx.queryParam("force"));
            if (force) {
              updateService.clearCache();
            }
            ctx.json(updateService.checkForUpdates(force));
          });

      app.post(
          "/api/update/skip",
          ctx -> {
            try {
              String body = ctx.body();
              ObjectMapper mapper = new ObjectMapper();
              com.fasterxml.jackson.databind.JsonNode json = mapper.readTree(body);
              if (json.has("version")) {
                String version = json.get("version").asText();
                configService.setSkippedUpdateVersion(version);
                updateService.clearCache();
                ctx.status(200).result("Version skipped");
              } else {
                ctx.status(400).result("Missing version");
              }
            } catch (Exception e) {
              logger.error("Failed to skip update", e);
              ctx.status(500).result("Internal error");
            }
          },
          Role.ADMIN);

      app.post(
          "/api/update/install",
          ctx -> {
            try {
              String body = ctx.body();
              ObjectMapper mapper = new ObjectMapper();
              com.fasterxml.jackson.databind.JsonNode json = mapper.readTree(body);
              if (json.has("downloadUrl")) {
                String downloadUrl = json.get("downloadUrl").asText();
                new Thread(
                        () -> {
                          try {
                            updateService.downloadAndInstallUpdate(downloadUrl);
                          } catch (Exception e) {
                            logger.error("Update failed", e);
                          }
                        })
                    .start();
                ctx.status(200).result("Update started");
              } else {
                ctx.status(400).result("Missing downloadUrl");
              }
            } catch (Exception e) {
              ctx.status(500).result("Error: " + e.getMessage());
            }
          },
          Role.ADMIN);

      app.get(
          "/api/update/progress",
          ctx -> {
            ctx.header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
            ctx.contentType("application/json");
            ctx.result(new ObjectMapper().writeValueAsString(updateService.getDownloadProgress()));
          });

      app.post(
          "/api/update/cancel",
          ctx -> {
            updateService.cancelDownload();
            ctx.status(200).result("Cancelled");
          },
          Role.ADMIN);

      app.get("/api/version", ctx -> ctx.result(SERVER_VERSION));
      app.get("/api/server-ip", ctx -> ctx.result(getLocalIpAddress()));

      if (!headless) {
        openBrowser("http://localhost:" + serverPort);
        setupSystemTray(serverPort);
      } else {
        logger.info("Headless mode: Browser will not be opened automatically.");
        logger.info("Server is running at http://localhost:{}", serverPort);
        setupSystemTray(serverPort);
      }
    } catch (Exception e) {
      logger.error("Fatal error during startup", e);
      System.exit(1);
    }
  }

  private static void setupSystemTray(int port) {
    if (!SystemTray.isSupported()) {
      logger.warn("SystemTray is not supported on this platform.");
      return;
    }
    System.setProperty("java.awt.headless", "false");
    try {
      SystemTray tray = SystemTray.getSystemTray();
      Image image = null;
      try {
        java.io.InputStream is = App.class.getResourceAsStream("/favicon.png");
        if (is != null) {
          Image originalImage = javax.imageio.ImageIO.read(is);
          if (originalImage != null) {
            try {
              Class<?> taskbarClass = Class.forName("java.awt.Taskbar");
              java.lang.reflect.Method getTaskbarMethod = taskbarClass.getMethod("getTaskbar");
              Object taskbarInstance = getTaskbarMethod.invoke(null);
              java.lang.reflect.Method setIconMethod =
                  taskbarClass.getMethod("setIconImage", Image.class);
              setIconMethod.invoke(taskbarInstance, originalImage);
            } catch (Exception e1) {
              try {
                Class<?> appClass = Class.forName("com.apple.eawt.Application");
                java.lang.reflect.Method getAppMethod = appClass.getMethod("getApplication");
                Object appInstance = getAppMethod.invoke(null);
                java.lang.reflect.Method setDockIconMethod =
                    appClass.getMethod("setDockIconImage", Image.class);
                setDockIconMethod.invoke(appInstance, originalImage);
              } catch (Exception e2) {
                // Ignore
              }
            }

            java.awt.Dimension trayIconSize = tray.getTrayIconSize();
            BufferedImage scaledImage =
                new BufferedImage(
                    trayIconSize.width, trayIconSize.height, BufferedImage.TYPE_INT_ARGB);
            Graphics2D g2dScale = scaledImage.createGraphics();
            g2dScale.setRenderingHint(
                java.awt.RenderingHints.KEY_INTERPOLATION,
                java.awt.RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g2dScale.drawImage(originalImage, 0, 0, trayIconSize.width, trayIconSize.height, null);
            g2dScale.dispose();
            image = scaledImage;
          }
        }
      } catch (Exception ex) {
        logger.warn("Could not load favicon.png for system tray, using fallback", ex);
      }
      if (image == null) {
        image = new BufferedImage(16, 16, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g2d = (Graphics2D) image.getGraphics();
        g2d.setColor(Color.RED);
        g2d.fillRect(0, 0, 16, 16);
        g2d.setColor(Color.WHITE);
        g2d.drawString("RC", 1, 12);
        g2d.dispose();
      }

      TrayIcon trayIcon = new TrayIcon(image, "Race Coordinator AI");
      trayIcon.setImageAutoSize(true);

      PopupMenu popup = new PopupMenu();
      MenuItem openItem = new MenuItem("Open RaceCoordinator AI");
      openItem.addActionListener(e -> openBrowser("http://localhost:" + port));

      MenuItem exitItem = new MenuItem("Quit Server");
      exitItem.addActionListener(
          e -> {
            logger.info("Exiting from System Tray");
            System.exit(0);
          });

      popup.add(openItem);
      popup.addSeparator();
      popup.add(exitItem);

      trayIcon.setPopupMenu(popup);
      tray.add(trayIcon);
      logger.info("SystemTray icon added.");
    } catch (Exception e) {
      logger.error("Failed to setup SystemTray", e);
    }
  }

  private static void openBrowser(String url) {
    try {
      if (System.getProperty("os.name").toLowerCase().contains("win")) {
        new ProcessBuilder("cmd", "/c", "start", url).start();
      } else if (Desktop.isDesktopSupported()
          && Desktop.getDesktop().isSupported(Desktop.Action.BROWSE)) {
        Desktop.getDesktop().browse(new URI(url));
      } else {
        logger.info("Server started. Open {} in your browser.", url);
      }
    } catch (Exception e) {
      logger.error("Failed to open browser automatically: {}", e.getMessage());
      logger.info("Please open {} manually.", url);
    }
  }

  /* package */ static String getLocalIpAddress() {
    try {
      Enumeration<NetworkInterface> interfaces = NetworkInterface.getNetworkInterfaces();
      while (interfaces.hasMoreElements()) {
        NetworkInterface iface = interfaces.nextElement();
        if (iface.isLoopback() || !iface.isUp() || iface.isVirtual()) {
          continue;
        }

        String name = iface.getName().toLowerCase();
        if (name.contains("virtual")
            || name.contains("vmnet")
            || name.contains("vbox")
            || name.contains("docker")
            || name.contains("bridge")
            || name.contains("utun")
            || name.contains("gif")
            || name.contains("stf")
            || name.contains("awdl")
            || name.contains("llw")
            || name.contains("ap")
            || name.contains("vpn")
            || name.contains("vmenet")) {
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

      interfaces = NetworkInterface.getNetworkInterfaces();
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

  static void triggerLogRollover() {
    try {
      org.slf4j.ILoggerFactory factory = org.slf4j.LoggerFactory.getILoggerFactory();
      if (factory instanceof ch.qos.logback.classic.LoggerContext) {
        ch.qos.logback.classic.LoggerContext loggerContext =
            (ch.qos.logback.classic.LoggerContext) factory;
        for (ch.qos.logback.classic.Logger logger : loggerContext.getLoggerList()) {
          for (java.util.Iterator<
                      ch.qos.logback.core.Appender<ch.qos.logback.classic.spi.ILoggingEvent>>
                  index = logger.iteratorForAppenders();
              index.hasNext(); ) {
            ch.qos.logback.core.Appender<ch.qos.logback.classic.spi.ILoggingEvent> appender =
                index.next();
            if (appender instanceof ch.qos.logback.core.rolling.RollingFileAppender) {
              ch.qos.logback.core.rolling.RollingFileAppender<
                      ch.qos.logback.classic.spi.ILoggingEvent>
                  rfa =
                      (ch.qos.logback.core.rolling.RollingFileAppender<
                              ch.qos.logback.classic.spi.ILoggingEvent>)
                          appender;
              String activeFileName = rfa.getFile();
              if (activeFileName != null) {
                java.io.File activeLogFile = new java.io.File(activeFileName);
                if (activeLogFile.exists() && activeLogFile.length() > 0) {
                  rfa.stop();

                  String dateStr =
                      new java.text.SimpleDateFormat("yyyy-MM-dd_HH-mm-ss")
                          .format(new java.util.Date());
                  java.io.File parentDir = activeLogFile.getParentFile();
                  java.io.File rolledFile =
                      new java.io.File(parentDir, "racecoordinator." + dateStr + "_session.log");

                  boolean renamed = activeLogFile.renameTo(rolledFile);
                  if (!renamed) {
                    System.err.println("Failed to rename log file during manual rollover.");
                  }

                  rfa.start();
                }
              }
            }
          }
        }
      }
    } catch (Exception e) {
      System.err.println("Failed to trigger log rollover: " + e.getMessage());
      e.printStackTrace();
    }
  }
}
