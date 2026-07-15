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
    // Cache for 24 hours to avoid rate limiting
    if (cachedResult != null && (System.currentTimeMillis() - lastCheckTime) < 86400000) {
      return cachedResult;
    }

    UpdateCheckResult result = new UpdateCheckResult();
    result.updateAvailable = false;

    // Determine OS
    String osName = System.getProperty("os.name").toLowerCase();
    result.isWindows = osName.contains("win");

    try {
      JsonNode releases = fetchReleasesNode();
      if (releases != null) {

        // Find the latest alpha release by published date instead of tag string
        JsonNode latestAlpha =
            StreamSupport.stream(releases.spliterator(), false)
                .filter(
                    node ->
                        node.has("tag_name") && node.get("tag_name").asText().contains("-alpha."))
                .filter(node -> node.has("published_at") && !node.get("published_at").isNull())
                .max(Comparator.comparing(node -> node.get("published_at").asText()))
                .orElse(null);

        if (latestAlpha != null) {
          String tagVersion = latestAlpha.get("tag_name").asText();

          boolean isNewerThanCurrent =
              isVersionNewer(releases, currentVersion, latestAlpha, tagVersion);

          boolean isNewerThanSkipped = true;
          String skipped = configService.getSkippedUpdateVersion();
          if (skipped != null && !skipped.isEmpty()) {
            isNewerThanSkipped = isVersionNewer(releases, skipped, latestAlpha, tagVersion);
          }

          if (isNewerThanCurrent && isNewerThanSkipped) {
            result.updateAvailable = true;
            result.latestVersion = tagVersion;
            result.releaseNotes = latestAlpha.has("body") ? latestAlpha.get("body").asText() : "";
            result.releaseUrl =
                latestAlpha.has("html_url") ? latestAlpha.get("html_url").asText() : "";

            // Find the correct asset
            JsonNode assets = latestAlpha.get("assets");
            if (assets != null && assets.isArray()) {
              for (JsonNode asset : assets) {
                String assetName = asset.get("name").asText().toLowerCase();
                boolean matchesWindows =
                    result.isWindows
                        && assetName.contains("online_setup")
                        && assetName.endsWith(".exe");
                boolean matchesMac = !result.isWindows && assetName.endsWith(".dmg");

                if (matchesWindows || matchesMac) {
                  result.downloadUrl = asset.get("browser_download_url").asText();
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

  private boolean isVersionNewer(
      JsonNode releases, String baseVersion, JsonNode latestAlpha, String tagVersion) {
    if (baseVersion.equals("0.0.0_dev")) {
      return true;
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
      String latestPublishedAt = latestAlpha.get("published_at").asText();
      return latestPublishedAt.compareTo(basePublishedAt) > 0;
    } else {
      String strippedTagVersion = tagVersion.startsWith("v") ? tagVersion.substring(1) : tagVersion;
      String strippedBaseVersion =
          baseVersion.startsWith("v") ? baseVersion.substring(1) : baseVersion;
      return strippedTagVersion.compareTo(strippedBaseVersion) > 0;
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

    if (!isWindows) {
      throw new UnsupportedOperationException(
          "Automatic installation is only supported on Windows.");
    }

    cancelDownload = false;
    downloadProgress = 0;
    downloadStatus = "RDS_UPDATE_STATUS_CONNECTING";

    logger.info("Downloading update from: {}", downloadUrl);

    Path tempDir = Paths.get(System.getProperty("java.io.tmpdir"), "racecoordinator_updates");
    if (!Files.exists(tempDir)) {
      Files.createDirectories(tempDir);
    }

    File installerFile = new File(tempDir.toFile(), "RaceCoordinatorSetup_Update.exe");

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

    downloadStatus = "RDS_UPDATE_STATUS_DOWNLOADING";
    int contentLength = conn.getContentLength();
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
    logger.info("Download complete. Launching installer...");

    // Execute installer with silent and custom restart flag
    ProcessBuilder pb =
        new ProcessBuilder(
            "cmd.exe", "/c", "start", installerFile.getAbsolutePath(), "/SILENT", "/RESTARTAPP");
    pb.start();
  }

  static int calculateDownloadProgress(long downloaded, int contentLength) {
    if (contentLength > 0) {
      return (int) ((downloaded * 100L) / contentLength);
    } else {
      // Fallback if Content-Length is unknown: estimate based on 150MB installer size
      return Math.min(99, (int) ((downloaded * 100L) / (150 * 1024 * 1024)));
    }
  }
}
