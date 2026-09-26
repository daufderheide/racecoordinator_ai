package com.antigravity.service;

import com.antigravity.App;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.javalin.Javalin;
import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Service to manage automated secure HTTPS tunnels for remote mobile camera pairing. Allows mobile
 * devices on iOS/Android to access camera permissions without browser HTTPS errors.
 */
public class CameraTunnelService {
  private static final Logger logger = LoggerFactory.getLogger(CameraTunnelService.class);
  private static final ObjectMapper mapper = new ObjectMapper();

  private static final Pattern URL_PATTERN =
      Pattern.compile("(https://[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}(?::[0-9]+)?(?:/[^\\s]*)?)");

  private static CameraTunnelService instance;

  private final ProcessRunner processRunner;
  private Process activeProcess;
  private String currentUrl;
  private String currentProvider = "none";
  private int currentPort = 7070;
  private String lastError;

  public static class TunnelStatus {
    public boolean active;
    public String url;
    public String localIp;
    public int port;
    public String provider;
    public String error;

    public TunnelStatus() {}

    public TunnelStatus(
        boolean active, String url, String localIp, int port, String provider, String error) {
      this.active = active;
      this.url = url;
      this.localIp = localIp;
      this.port = port;
      this.provider = provider;
      this.error = error;
    }
  }

  public interface ProcessRunner {
    Process startProcess(List<String> command) throws Exception;

    String findExecutable(String name);
  }

  private static class SystemProcessRunner implements ProcessRunner {
    @Override
    public Process startProcess(List<String> command) throws Exception {
      ProcessBuilder pb = new ProcessBuilder(command);
      pb.redirectErrorStream(true);
      return pb.start();
    }

    @Override
    public String findExecutable(String name) {
      return CameraTunnelService.locateExecutable(name);
    }
  }

  public CameraTunnelService() {
    this(new SystemProcessRunner());
  }

  public CameraTunnelService(ProcessRunner processRunner) {
    this.processRunner = processRunner;
    Runtime.getRuntime().addShutdownHook(new Thread(this::stopTunnel));
  }

  public static synchronized CameraTunnelService getInstance() {
    if (instance == null) {
      instance = new CameraTunnelService();
    }
    return instance;
  }

  public static synchronized void setInstance(CameraTunnelService testInstance) {
    instance = testInstance;
  }

  public synchronized TunnelStatus getStatus() {
    boolean isAlive = activeProcess != null && activeProcess.isAlive();
    if (!isAlive && activeProcess != null) {
      currentUrl = null;
      activeProcess = null;
      if (lastError == null) {
        lastError = "Tunnel process terminated unexpectedly";
      }
    }
    return new TunnelStatus(
        isAlive && currentUrl != null,
        currentUrl,
        App.getLocalIpAddress(),
        currentPort,
        currentProvider,
        lastError);
  }

  public synchronized TunnelStatus startTunnel(int targetPort) {
    if (activeProcess != null && activeProcess.isAlive() && currentUrl != null) {
      if (currentPort == targetPort) {
        return getStatus();
      }
      stopTunnel();
    }

    this.currentPort = targetPort > 0 ? targetPort : App.getServerPort();
    this.lastError = null;
    this.currentUrl = null;

    TunnelCommand tunnelCmd = selectTunnelCommand(this.currentPort);
    if (tunnelCmd == null) {
      this.currentProvider = "none";
      this.lastError = "No tunnel utility (cloudflared, npx, ssh) found on host system";
      logger.warn("Could not start camera tunnel: {}", this.lastError);
      return getStatus();
    }

    this.currentProvider = tunnelCmd.provider;
    try {
      logger.info(
          "Starting camera tunnel [{}] for port {} with command: {}",
          tunnelCmd.provider,
          this.currentPort,
          tunnelCmd.command);

      activeProcess = processRunner.startProcess(tunnelCmd.command);
      CompletableFuture<String> urlFuture = new CompletableFuture<>();

      Thread readerThread =
          new Thread(
              () -> readProcessOutput(activeProcess, urlFuture),
              "camera-tunnel-reader-" + tunnelCmd.provider);
      readerThread.setDaemon(true);
      readerThread.start();

      try {
        String resolvedUrl = urlFuture.get(18, TimeUnit.SECONDS);
        this.currentUrl = resolvedUrl;
        logger.info("Camera tunnel established successfully: {}", resolvedUrl);
      } catch (Exception timeoutEx) {
        logger.warn(
            "Timed out waiting for tunnel URL from {} (process alive: {})",
            tunnelCmd.provider,
            activeProcess.isAlive());
        this.lastError = "Timed out establishing secure tunnel via " + tunnelCmd.provider;
        stopTunnel();
      }
    } catch (Exception ex) {
      logger.error("Failed to spawn tunnel process", ex);
      this.lastError = "Failed to start tunnel: " + ex.getMessage();
      stopTunnel();
    }

    return getStatus();
  }

  public synchronized TunnelStatus stopTunnel() {
    if (activeProcess != null) {
      try {
        activeProcess.destroyForcibly();
        activeProcess.waitFor(2, TimeUnit.SECONDS);
      } catch (Exception ex) {
        logger.debug("Error while stopping tunnel process: {}", ex.getMessage());
      }
      activeProcess = null;
    }
    currentUrl = null;
    return getStatus();
  }

  private void readProcessOutput(Process process, CompletableFuture<String> urlFuture) {
    try (BufferedReader reader =
        new BufferedReader(
            new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
      String line;
      while ((line = reader.readLine()) != null) {
        logger.debug("[Tunnel] {}", line);
        if (!urlFuture.isDone()) {
          Matcher matcher = URL_PATTERN.matcher(line);
          while (matcher.find()) {
            String extracted = matcher.group(1);
            if (isValidTunnelUrl(extracted)) {
              urlFuture.complete(extracted);
              break;
            }
          }
        }
      }
    } catch (Exception ex) {
      logger.debug("Tunnel output reader finished: {}", ex.getMessage());
    } finally {
      if (!urlFuture.isDone()) {
        urlFuture.completeExceptionally(
            new IllegalStateException("Tunnel output ended without URL"));
      }
    }
  }

  private static boolean isValidTunnelUrl(String url) {
    if (url == null) {
      return false;
    }
    if (url.contains("localhost") || url.contains("127.0.0.1")) {
      return false;
    }
    if (url.contains("cloudflare.com/website-terms")
        || url.contains("developers.cloudflare.com")
        || url.contains("github.com")
        || url.contains("npm")
        || url.contains("localtunnel.me")) {
      return false;
    }
    return url.contains(".trycloudflare.com")
        || url.contains(".loca.lt")
        || url.contains(".lhr.life")
        || url.contains(".lhrtunnel.link")
        || url.matches("https://[a-zA-Z0-9-]+\\.[a-zA-Z0-9.-]+");
  }

  private static class TunnelCommand {
    final String provider;
    final List<String> command;

    TunnelCommand(String provider, List<String> command) {
      this.provider = provider;
      this.command = command;
    }
  }

  private TunnelCommand selectTunnelCommand(int port) {
    String cloudflaredPath = processRunner.findExecutable("cloudflared");
    if (cloudflaredPath != null) {
      List<String> cmd =
          java.util.Arrays.asList(cloudflaredPath, "tunnel", "--url", "http://127.0.0.1:" + port);
      return new TunnelCommand("cloudflared", cmd);
    }

    String npxPath = processRunner.findExecutable("npx");
    if (npxPath != null) {
      List<String> cmd =
          java.util.Arrays.asList(
              npxPath, "-y", "cloudflared", "tunnel", "--url", "http://127.0.0.1:" + port);
      return new TunnelCommand("cloudflared", cmd);
    }

    String sshPath = processRunner.findExecutable("ssh");
    if (sshPath != null) {
      List<String> cmd =
          java.util.Arrays.asList(
              sshPath,
              "-T",
              "-o",
              "StrictHostKeyChecking=no",
              "-o",
              "UserKnownHostsFile=/dev/null",
              "-o",
              "ServerAliveInterval=30",
              "-R",
              "80:localhost:" + port,
              "nokey@localhost.run");
      return new TunnelCommand("ssh", cmd);
    }

    return null;
  }

  public static String locateExecutable(String name) {
    boolean isWindows = System.getProperty("os.name", "").toLowerCase().contains("win");
    String[] extensions = isWindows ? new String[] {".cmd", ".exe", ".bat", ""} : new String[] {""};
    String pathEnv = System.getenv("PATH");

    List<String> searchDirs = new ArrayList<>();
    if (pathEnv != null) {
      for (String dir : pathEnv.split(Pattern.quote(File.pathSeparator))) {
        if (!dir.trim().isEmpty()) {
          searchDirs.add(dir.trim());
        }
      }
    }

    if (!isWindows) {
      List<String> unixDefaults =
          java.util.Arrays.asList(
              "/opt/homebrew/bin", "/usr/local/bin", "/usr/bin", "/bin", "/snap/bin");
      for (String dir : unixDefaults) {
        if (!searchDirs.contains(dir)) {
          searchDirs.add(dir);
        }
      }
    }

    for (String dir : searchDirs) {
      for (String ext : extensions) {
        File file = new File(dir, name + ext);
        if (file.isFile() && file.canExecute()) {
          return file.getAbsolutePath();
        }
      }
    }

    return null;
  }

  public static void registerRoutes(Javalin app, CameraTunnelService service) {
    app.get(
        "/api/camera-tunnel/status",
        ctx -> {
          ctx.json(service.getStatus());
        });

    app.post(
        "/api/camera-tunnel/start",
        ctx -> {
          int port = App.getServerPort();
          try {
            String body = ctx.body();
            if (body != null && !body.trim().isEmpty()) {
              JsonNode json = mapper.readTree(body);
              if (json.has("port") && json.get("port").isNumber()) {
                port = json.get("port").asInt();
              }
            }
          } catch (Exception ignored) {
            // Keep default port
          }
          ctx.json(service.startTunnel(port));
        });

    app.post(
        "/api/camera-tunnel/stop",
        ctx -> {
          ctx.json(service.stopTunnel());
        });
  }
}
