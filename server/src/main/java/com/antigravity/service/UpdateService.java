package com.antigravity.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Comparator;
import java.util.stream.StreamSupport;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class UpdateService {
  private static final Logger logger = LoggerFactory.getLogger(UpdateService.class);
  private static final String RELEASES_API_URL =
      "https://api.github.com/repos/daufderheide/racecoordinator_ai/releases";

  private final ObjectMapper mapper = new ObjectMapper();
  private final String currentVersion;
  private final ServerConfigService configService;
  private UpdateCheckResult cachedResult = null;
  private long lastCheckTime = 0;

  private volatile int downloadProgress = 0;
  private volatile String downloadStatus = "";
  private volatile boolean cancelDownload = false;

  public UpdateService(String currentVersion, ServerConfigService configService) {
    this.currentVersion = currentVersion;
    this.configService = configService;
  }

  public static class UpdateCheckResult {
    public boolean updateAvailable;
    public String latestVersion;
    public String downloadUrl;
    public String releaseNotes;
    public String releaseUrl;
    public boolean isWindows;
    public boolean isLinux;
    public long downloadSize;
  }

  public static class UpdateProgress {
    public int progress;
    public String status;

    public UpdateProgress(int progress, String status) {
      this.progress = progress;
      this.status = status;
    }
  }

  public UpdateProgress getDownloadProgress() {
    return new UpdateProgress(downloadProgress, downloadStatus);
  }

  public void cancelDownload() {
    this.cancelDownload = true;
    this.downloadStatus = "RDS_UPDATE_STATUS_CANCELLED";
  }

  public UpdateCheckResult checkForUpdates() {
    return checkForUpdates(false);
  }

  public UpdateCheckResult checkForUpdates(boolean force) {
    // Cache for 24 hours to avoid rate limiting unless forced
    if (!force && cachedResult != null && (System.currentTimeMillis() - lastCheckTime) < 86400000) {
      return cachedResult;
    }

    UpdateCheckResult result = new UpdateCheckResult();
    result.updateAvailable = false;

    // Determine OS
    String osName = System.getProperty("os.name").toLowerCase();
    result.isWindows = osName.contains("win");
    result.isLinux = osName.contains("linux");

    String channel = configService.getUpdateChannel();
    if (!force && "DISABLED".equalsIgnoreCase(channel)) {
      cachedResult = result;
      lastCheckTime = System.currentTimeMillis();
      return result;
    }

    try {
      JsonNode releases = fetchReleasesNode();
      if (releases != null) {
        // Filter releases by user's update channel and find the newest by published_at
        JsonNode latestTarget =
            StreamSupport.stream(releases.spliterator(), false)
                .filter(node -> node.has("published_at") && !node.get("published_at").isNull())
                .filter(
                    node ->
                        force && "DISABLED".equalsIgnoreCase(channel)
                            ? isProduction(node)
                            : matchesChannel(node, channel))
                .max(Comparator.comparing(node -> node.get("published_at").asText()))
                .orElse(null);

        if (latestTarget != null) {
          String tagVersion = latestTarget.get("tag_name").asText();

          boolean isNewerThanCurrent = isVersionNewer(releases, currentVersion, latestTarget);

          boolean isNewerThanSkipped = true;
          if (!force) {
            String skipped = configService.getSkippedUpdateVersion();
            if (skipped != null && !skipped.isEmpty()) {
              isNewerThanSkipped = isVersionNewer(releases, skipped, latestTarget);
            }
          }

          boolean isNotSnoozed = true;
          if (!force) {
            String snoozedVersion = configService.getSnoozedUpdateVersion();
            long snoozedUntil = configService.getSnoozedUpdateUntil();
            if (snoozedVersion != null
                && !snoozedVersion.isEmpty()
                && System.currentTimeMillis() < snoozedUntil) {
              boolean isNewerThanSnoozed = isVersionNewer(releases, snoozedVersion, latestTarget);
              if (!isNewerThanSnoozed) {
                isNotSnoozed = false;
              }
            }
          }

          if (isNewerThanCurrent && isNewerThanSkipped && isNotSnoozed) {
            result.updateAvailable = true;
            result.latestVersion = tagVersion;
            result.releaseNotes = latestTarget.has("body") ? latestTarget.get("body").asText() : "";
            result.releaseUrl =
                latestTarget.has("html_url") ? latestTarget.get("html_url").asText() : "";

            // Find the correct asset
            JsonNode assets = latestTarget.get("assets");
            if (assets != null && assets.isArray()) {
              for (JsonNode asset : assets) {
                String assetName = asset.get("name").asText().toLowerCase();
                boolean matchesWindows =
                    result.isWindows
                        && assetName.contains("online_setup")
                        && assetName.endsWith(".exe");
                boolean matchesMac =
                    !result.isWindows && !result.isLinux && assetName.endsWith(".dmg");
                boolean matchesLinux =
                    result.isLinux
                        && (assetName.contains("linux") || assetName.endsWith(".tar.gz"));

                if (matchesWindows || matchesMac || matchesLinux) {
                  result.downloadUrl = asset.get("browser_download_url").asText();
                  if (asset.has("size")) {
                    result.downloadSize = asset.get("size").asLong();
                  }
                  break;
                }
              }
            }
          }
        }
      }

      cachedResult = result;
      lastCheckTime = System.currentTimeMillis();

    } catch (Exception e) {
      logger.warn("Failed to check for updates from GitHub: {}", e.getMessage());
    }

    return result;
  }

  public void clearCache() {
    this.cachedResult = null;
    this.lastCheckTime = 0;
  }

  static boolean isAlpha(JsonNode node) {
    if (!node.has("tag_name")) return false;
    String tag = node.get("tag_name").asText().toLowerCase();
    return tag.contains("alpha");
  }

  static boolean isBeta(JsonNode node) {
    if (!node.has("tag_name")) return false;
    String tag = node.get("tag_name").asText().toLowerCase();
    return tag.contains("beta");
  }

  static boolean isProduction(JsonNode node) {
    return !isAlpha(node) && !isBeta(node);
  }

  static boolean matchesChannel(JsonNode node, String channel) {
    if (channel == null || channel.equalsIgnoreCase("ALPHA")) {
      return true;
    } else if (channel.equalsIgnoreCase("BETA")) {
      return isBeta(node) || isProduction(node);
    } else if (channel.equalsIgnoreCase("PRODUCTION")) {
      return isProduction(node);
    }
    return false;
  }

  private boolean isVersionNewer(JsonNode releases, String baseVersion, JsonNode latestTarget) {
    if (baseVersion.equals("0.0.0_dev")) {
      return true;
    }

    String latestTag = latestTarget.has("tag_name") ? latestTarget.get("tag_name").asText() : "";
    if (latestTag.equals(baseVersion)
        || latestTag.equals("v" + baseVersion)
        || ("v" + latestTag).equals(baseVersion)) {
      return false;
    }

    JsonNode baseRelease =
        StreamSupport.stream(releases.spliterator(), false)
            .filter(
                node ->
                    node.has("tag_name")
                        && (node.get("tag_name").asText().equals(baseVersion)
                            || node.get("tag_name").asText().equals("v" + baseVersion)))
            .findFirst()
            .orElse(null);

    if (baseRelease != null
        && baseRelease.has("published_at")
        && !baseRelease.get("published_at").isNull()) {
      String basePublishedAt = baseRelease.get("published_at").asText();
      String latestPublishedAt = latestTarget.get("published_at").asText();
      return latestPublishedAt.compareTo(basePublishedAt) > 0;
    } else {
      // If base release not found in recent releases, assume latest release is newer
      return true;
    }
  }

  // Helper method no longer needed as we do inline date comparison

  // Protected for testing
  protected JsonNode fetchReleasesNode() throws Exception {
    URL url = new URL(RELEASES_API_URL);
    HttpURLConnection conn = (HttpURLConnection) url.openConnection();
    conn.setRequestMethod("GET");
    conn.setRequestProperty("Accept", "application/vnd.github.v3+json");

    if (conn.getResponseCode() == 200) {
      return mapper.readTree(conn.getInputStream());
    }
    return null;
  }

  public void downloadAndInstallUpdate(String downloadUrl) throws Exception {
    String osName = System.getProperty("os.name").toLowerCase();
    boolean isWindows = osName.contains("win");
    boolean isLinux = osName.contains("linux");

    if (!isWindows && !isLinux) {
      throw new UnsupportedOperationException(
          "Automatic installation is supported on Windows and Linux.");
    }

    cancelDownload = false;
    downloadProgress = 0;
    downloadStatus = "RDS_UPDATE_STATUS_DOWNLOADING";

    logger.info("Downloading update from: {}", downloadUrl);

    long expectedSize = -1;
    if (cachedResult != null && downloadUrl.equals(cachedResult.downloadUrl)) {
      expectedSize = cachedResult.downloadSize;
    }

    Path tempDir = Paths.get(System.getProperty("java.io.tmpdir"), "racecoordinator_updates");
    if (!Files.exists(tempDir)) {
      Files.createDirectories(tempDir);
    }

    String fileName =
        isWindows ? "RaceCoordinatorSetup_Update.exe" : "RaceCoordinator_Update.tar.gz";
    File installerFile = new File(tempDir.toFile(), fileName);

    URL url = new URL(downloadUrl);
    HttpURLConnection conn = (HttpURLConnection) url.openConnection();
    conn.setRequestMethod("GET");

    // Follow redirects
    int status = conn.getResponseCode();
    if (status == HttpURLConnection.HTTP_MOVED_TEMP
        || status == HttpURLConnection.HTTP_MOVED_PERM
        || status == HttpURLConnection.HTTP_SEE_OTHER) {
      String newUrl = conn.getHeaderField("Location");
      conn = (HttpURLConnection) new URL(newUrl).openConnection();
    }

    long contentLength = conn.getContentLengthLong();
    if (contentLength <= 0 && expectedSize > 0) {
      contentLength = expectedSize;
    }

    long downloaded = 0;

    try (InputStream in = conn.getInputStream();
        FileOutputStream out = new FileOutputStream(installerFile)) {
      byte[] buffer = new byte[8192];
      int bytesRead;
      while ((bytesRead = in.read(buffer)) != -1) {
        if (cancelDownload) {
          logger.info("Update download cancelled by user.");
          return;
        }
        out.write(buffer, 0, bytesRead);
        downloaded += bytesRead;
        downloadProgress = calculateDownloadProgress(downloaded, contentLength);
      }
    }

    if (cancelDownload) {
      return; // Double check in case it was cancelled exactly at the end
    }

    downloadProgress = 100;
    downloadStatus = "RDS_UPDATE_STATUS_LAUNCHING";
    logger.info("Download complete. Launching update installer...");

    try {
      Thread.sleep(1000);
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
    }

    if (isWindows) {
      ProcessBuilder pb =
          new ProcessBuilder(
              "cmd.exe", "/c", "start", installerFile.getAbsolutePath(), "/SILENT", "/RESTARTAPP");
      pb.start();
    } else if (isLinux) {
      File updateScript = new File("/opt/racecoordinatorai/scripts/update_app.sh");
      ProcessBuilder pb;
      if (updateScript.exists()) {
        pb =
            new ProcessBuilder(
                "bash", updateScript.getAbsolutePath(), installerFile.getAbsolutePath());
      } else {
        pb =
            new ProcessBuilder(
                "bash",
                "-c",
                "tar -xzf "
                    + installerFile.getAbsolutePath()
                    + " -C /opt/racecoordinatorai && sudo systemctl restart racecoordinatorai");
      }
      pb.start();
    }
  }

  static int calculateDownloadProgress(long downloaded, long contentLength) {
    if (contentLength > 0) {
      return (int) ((downloaded * 100L) / contentLength);
    } else {
      // Fallback if Content-Length is unknown: estimate based on 150MB installer size
      return Math.min(99, (int) ((downloaded * 100L) / (150 * 1024 * 1024)));
    }
  }
}
