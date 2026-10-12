package com.antigravity.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.awt.GraphicsEnvironment;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.ServerSocket;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import javax.swing.JOptionPane;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Coordinates single-instance lifecycle and conflict resolution when another instance of Race
 * Coordinator AI is already running on the configured port.
 */
public class AppInstanceCoordinator {

  private static final Logger logger = LoggerFactory.getLogger(AppInstanceCoordinator.class);

  public static final int ACTION_OPEN_BROWSER = 0;
  public static final int ACTION_RESTART = 1;
  public static final int ACTION_EXIT = 2;
  public static final int ACTION_TAKE_OVER = 3;

  public static class ServerStatus {
    private final boolean reachable;
    private final String version;
    private final int activeClients;
    private final boolean pendingShutdown;

    public ServerStatus(
        boolean reachable, String version, int activeClients, boolean pendingShutdown) {
      this.reachable = reachable;
      this.version = version;
      this.activeClients = activeClients;
      this.pendingShutdown = pendingShutdown;
    }

    public boolean isReachable() {
      return reachable;
    }

    public String getVersion() {
      return version;
    }

    public int getActiveClients() {
      return activeClients;
    }

    public boolean isPendingShutdown() {
      return pendingShutdown;
    }
  }

  public interface InstanceActionPrompter {
    int promptUser(int port);
  }

  public interface InstanceStopper {
    boolean stopInstance(int port);
  }

  public interface BrowserLauncher {
    void openBrowser(String url);
  }

  public interface ExitHandler {
    void exit(int status);
  }

  public interface InstanceErrorNotifier {
    void showError(String message, String title);
  }

  public interface StatusQuerier {
    ServerStatus queryStatus(int port);
  }

  private static InstanceActionPrompter prompter = new DefaultActionPrompter();
  private static InstanceStopper stopper = new DefaultInstanceStopper();
  private static ExitHandler exitHandler = status -> System.exit(status);
  private static InstanceErrorNotifier errorNotifier =
      (msg, title) -> {
        if (!GraphicsEnvironment.isHeadless()) {
          try {
            JOptionPane.showMessageDialog(null, msg, title, JOptionPane.ERROR_MESSAGE);
          } catch (Exception ignored) {
          }
        }
      };
  private static StatusQuerier statusQuerier = AppInstanceCoordinator::defaultQueryServerStatus;
  private static BrowserLauncher browserLauncher =
      url -> {
        try {
          if (System.getProperty("os.name", "").toLowerCase().contains("win")) {
            new ProcessBuilder("cmd", "/c", "start", url).start();
          } else if (java.awt.Desktop.isDesktopSupported()
              && java.awt.Desktop.getDesktop().isSupported(java.awt.Desktop.Action.BROWSE)) {
            java.awt.Desktop.getDesktop().browse(new java.net.URI(url));
          } else {
            new ProcessBuilder("open", url).start();
          }
        } catch (Exception e) {
          logger.error("Failed to launch browser: {}", e.getMessage());
        }
      };

  public static void setPrompter(InstanceActionPrompter p) {
    prompter = (p != null) ? p : new DefaultActionPrompter();
  }

  public static void setStopper(InstanceStopper s) {
    stopper = (s != null) ? s : new DefaultInstanceStopper();
  }

  public static void setExitHandler(ExitHandler h) {
    exitHandler = (h != null) ? h : status -> System.exit(status);
  }

  public static void setErrorNotifier(InstanceErrorNotifier n) {
    errorNotifier = (n != null) ? n : (msg, title) -> {};
  }

  public static void setBrowserLauncher(BrowserLauncher b) {
    browserLauncher = (b != null) ? b : url -> {};
  }

  public static void setStatusQuerier(StatusQuerier q) {
    statusQuerier = (q != null) ? q : AppInstanceCoordinator::defaultQueryServerStatus;
  }

  public static boolean isRaceCoordinatorRunning(int port) {
    HttpURLConnection conn = null;
    try {
      URL url = new URL("http://localhost:" + port + "/api/version");
      conn = (HttpURLConnection) url.openConnection();
      conn.setRequestMethod("GET");
      conn.setConnectTimeout(1500);
      conn.setReadTimeout(1500);
      int responseCode = conn.getResponseCode();
      if (responseCode == 200) {
        try (BufferedReader reader =
            new BufferedReader(
                new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
          String body = reader.readLine();
          return body != null && !body.trim().isEmpty();
        }
      }
    } catch (Exception ignored) {
    } finally {
      if (conn != null) {
        conn.disconnect();
      }
    }
    return false;
  }

  public static ServerStatus queryServerStatus(int port) {
    return statusQuerier.queryStatus(port);
  }

  public static ServerStatus defaultQueryServerStatus(int port) {
    HttpURLConnection conn = null;
    try {
      URL url = new URL("http://localhost:" + port + "/api/server/status");
      conn = (HttpURLConnection) url.openConnection();
      conn.setRequestMethod("GET");
      conn.setConnectTimeout(1500);
      conn.setReadTimeout(1500);
      int responseCode = conn.getResponseCode();
      if (responseCode == 200) {
        ObjectMapper mapper = new ObjectMapper();
        JsonNode root = mapper.readTree(conn.getInputStream());
        int activeClients = root.path("activeClients").asInt(0);
        boolean pendingShutdown = root.path("pendingShutdown").asBoolean(false);
        String version = root.path("version").asText("");
        return new ServerStatus(true, version, activeClients, pendingShutdown);
      }
    } catch (Exception ignored) {
    } finally {
      if (conn != null) {
        conn.disconnect();
      }
    }

    if (isRaceCoordinatorRunning(port)) {
      return new ServerStatus(true, "unknown", 1, false);
    }

    return new ServerStatus(false, null, 0, false);
  }

  public static boolean isPortAvailable(int port) {
    try (ServerSocket ss = new ServerSocket(port)) {
      return true;
    } catch (Exception ignored) {
      return false;
    }
  }

  public static void handleAlreadyRunning(int port, boolean headless, Runnable onRestart) {
    logger.info("Race Coordinator AI is already running on port {}.", port);

    ServerStatus status = queryServerStatus(port);
    if (!status.isReachable()) {
      logger.info("Port {} was in use, but server is now offline. Starting new instance...", port);
      if (onRestart != null) {
        onRestart.run();
      }
      return;
    }

    // Layer 1: Instant takeover when 0 clients active or already shutting down
    if (status.getActiveClients() <= 0 || status.isPendingShutdown()) {
      logger.info(
          "Existing instance has {} active clients (pendingShutdown={}). Taking over port without prompt...",
          status.getActiveClients(),
          status.isPendingShutdown());
      stopper.stopInstance(port);
      if (onRestart != null) {
        onRestart.run();
      }
      return;
    }

    if (headless
        || (prompter instanceof DefaultActionPrompter && GraphicsEnvironment.isHeadless())) {
      logger.info("Headless environment detected. Exiting new process cleanly.");
      exitHandler.exit(0);
      return;
    }

    int choice = prompter.promptUser(port);
    handleUserChoice(choice, port, onRestart);
  }

  private static void handleUserChoice(int choice, int port, Runnable onRestart) {
    if (choice == ACTION_OPEN_BROWSER) {
      // Layer 3: Check if existing instance is still live before exiting
      if (isRaceCoordinatorRunning(port)) {
        logger.info("User selected 'Open Web Browser'. Opening browser and exiting new process.");
        browserLauncher.openBrowser("http://localhost:" + port);
        exitHandler.exit(0);
      } else {
        logger.info(
            "Existing instance stopped while waiting for selection. Starting this instance instead.");
        if (onRestart != null) {
          onRestart.run();
        }
      }
    } else if (choice == ACTION_TAKE_OVER) {
      // Layer 2: Auto-dismissed because existing instance closed while dialog was displayed
      logger.info(
          "Existing instance stopped while dialog was displayed. Starting this instance instead.");
      if (onRestart != null) {
        onRestart.run();
      }
    } else if (choice == ACTION_RESTART) {
      handleRestartChoice(port, onRestart);
    } else {
      logger.info("User selected 'Exit' (or closed dialog). Exiting new process cleanly.");
      exitHandler.exit(0);
    }
  }

  private static void handleRestartChoice(int port, Runnable onRestart) {
    logger.info("User selected 'Restart Application'. Requesting existing instance to stop...");
    boolean stopped = stopper.stopInstance(port);
    if (stopped) {
      logger.info(
          "Existing instance stopped successfully. Retrying server startup on port {}...", port);
      if (onRestart != null) {
        onRestart.run();
      }
    } else {
      logger.error("Failed to stop existing Race Coordinator AI instance on port {}.", port);
      errorNotifier.showError(
          "Failed to stop the existing Race Coordinator AI instance.\nPlease close it manually.",
          "Race Coordinator AI - Restart Failed");
      exitHandler.exit(1);
    }
  }

  static class DefaultActionPrompter implements InstanceActionPrompter {
    @Override
    public int promptUser(int port) {
      if (GraphicsEnvironment.isHeadless()) {
        return ACTION_EXIT;
      }
      ScheduledExecutorService monitor = null;
      try {
        String message =
            "Race Coordinator AI is already running on port "
                + port
                + ".\n\n"
                + "Another instance of Race Coordinator AI was detected.\n"
                + "How would you like to proceed?";
        Object[] options = new Object[] {"Open Web Browser", "Restart Application", "Exit"};
        JOptionPane pane =
            new JOptionPane(
                message,
                JOptionPane.QUESTION_MESSAGE,
                JOptionPane.YES_NO_CANCEL_OPTION,
                null,
                options,
                options[0]);

        javax.swing.JDialog dialog =
            pane.createDialog(null, "Race Coordinator AI - Already Running");

        AtomicBoolean autoDismissed = new AtomicBoolean(false);
        monitor =
            Executors.newSingleThreadScheduledExecutor(
                r -> {
                  Thread t = new Thread(r, "InstanceCoordinator-DialogMonitor");
                  t.setDaemon(true);
                  return t;
                });

        monitor.scheduleWithFixedDelay(
            () -> {
              if (!isRaceCoordinatorRunning(port)) {
                autoDismissed.set(true);
                javax.swing.SwingUtilities.invokeLater(dialog::dispose);
              }
            },
            500,
            500,
            TimeUnit.MILLISECONDS);

        dialog.setVisible(true);

        if (autoDismissed.get()) {
          return ACTION_TAKE_OVER;
        }

        Object value = pane.getValue();
        if ("Open Web Browser".equals(value)) {
          return ACTION_OPEN_BROWSER;
        } else if ("Restart Application".equals(value)) {
          return ACTION_RESTART;
        }
      } catch (Exception e) {
        logger.error("Failed to display Already Running dialog: {}", e.getMessage());
      } finally {
        if (monitor != null) {
          monitor.shutdownNow();
        }
      }
      return ACTION_EXIT;
    }
  }

  static class DefaultInstanceStopper implements InstanceStopper {
    @Override
    public boolean stopInstance(int port) {
      try {
        URL url = new URL("http://localhost:" + port + "/api/server/shutdown");
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setConnectTimeout(2000);
        conn.setReadTimeout(2000);
        conn.setDoOutput(true);
        try (OutputStream os = conn.getOutputStream()) {
          os.write(new byte[0]);
        }
        conn.getResponseCode();
        conn.disconnect();
      } catch (Exception e) {
        logger.debug("HTTP shutdown request to existing instance returned: {}", e.getMessage());
      }

      for (int i = 0; i < 25; i++) {
        if (isPortAvailable(port)) {
          return true;
        }
        try {
          Thread.sleep(200);
        } catch (InterruptedException ignored) {
          break;
        }
      }

      return isPortAvailable(port);
    }
  }
}
