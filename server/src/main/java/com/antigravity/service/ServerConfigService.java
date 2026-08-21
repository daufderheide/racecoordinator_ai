package com.antigravity.service;

import com.antigravity.App;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.File;
import java.io.IOException;
import java.nio.file.Paths;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ServerConfigService {
  private static final Logger logger = LoggerFactory.getLogger(ServerConfigService.class);

  private static final String CONFIG_FILE = "server_config.json";
  private final File configFile;
  private final ObjectMapper mapper;
  private final Config config;

  public ServerConfigService() {
    String appDataDir =
        System.getProperty(
            "app.data.dir", Paths.get(System.getProperty("user.dir"), "app_data").toString());
    this.configFile = Paths.get(appDataDir, CONFIG_FILE).toFile();
    this.mapper = new ObjectMapper();
    this.config = loadConfig();
  }

  private Config loadConfig() {
    if (configFile.exists()) {
      try {
        return mapper.readValue(configFile, Config.class);
      } catch (IOException e) {
        logger.error("Failed to load server config", e);
      }
    }
    return new Config();
  }

  private void saveConfig() {
    try {
      mapper.writerWithDefaultPrettyPrinter().writeValue(configFile, config);
    } catch (IOException e) {
      logger.error("Failed to save server config", e);
    }
  }

  public String getLastActiveDatabase() {
    return config.lastActiveDatabase;
  }

  public void setLastActiveDatabase(String databaseName) {
    config.lastActiveDatabase = databaseName;
    saveConfig();
  }

  public boolean isShareAnalyticsEnabled() {
    return config.shareAnalytics;
  }

  public void setShareAnalyticsEnabled(boolean enabled) {
    config.shareAnalytics = enabled;
    saveConfig();
  }

  public String getDirectorPassword() {
    if (config.directorPassword == null || config.directorPassword.isEmpty()) {
      return "RC AI Director";
    }
    return config.directorPassword;
  }

  public void setDirectorPassword(String password) {
    config.directorPassword = password;
    saveConfig();
  }

  public String getAnalyticsClientId() {
    if (config.analyticsClientId == null || config.analyticsClientId.isEmpty()) {
      config.analyticsClientId = "rc-desktop-" + UUID.randomUUID().toString();
      saveConfig();
    }
    return config.analyticsClientId;
  }

  public double getStartTime() {
    return config.startTime;
  }

  public void setStartTime(double startTime) {
    config.startTime = startTime;
    saveConfig();
  }

  public double getRestartTime() {
    return config.restartTime;
  }

  public void setRestartTime(double restartTime) {
    config.restartTime = restartTime;
    saveConfig();
  }

  public double getStartRandomizer() {
    return config.startRandomizer;
  }

  public void setStartRandomizer(double startRandomizer) {
    config.startRandomizer = startRandomizer;
    saveConfig();
  }

  public double getRestartRandomizer() {
    return config.restartRandomizer;
  }

  public void setRestartRandomizer(double restartRandomizer) {
    config.restartRandomizer = restartRandomizer;
    saveConfig();
  }

  public String getSkippedUpdateVersion() {
    return config.skippedUpdateVersion;
  }

  public void setSkippedUpdateVersion(String version) {
    config.skippedUpdateVersion = version;
    saveConfig();
  }

  public String getUpdateChannel() {
    if (config.updateChannel == null || config.updateChannel.isEmpty()) {
      return getDefaultUpdateChannel();
    }
    return config.updateChannel;
  }

  public static String getDefaultUpdateChannel() {
    return getDefaultUpdateChannel(App.SERVER_VERSION);
  }

  public static String getDefaultUpdateChannel(String version) {
    if (version == null) {
      return "PRODUCTION";
    }
    String lower = version.toLowerCase();
    if (lower.contains("alpha") || lower.equals("0.0.0_dev")) {
      return "ALPHA";
    } else if (lower.contains("beta")) {
      return "BETA";
    }
    return "PRODUCTION";
  }

  public void setUpdateChannel(String channel) {
    config.updateChannel = channel;
    saveConfig();
  }

  public String getSnoozedUpdateVersion() {
    return config.snoozedUpdateVersion;
  }

  public long getSnoozedUpdateUntil() {
    return config.snoozedUpdateUntil;
  }

  public void setSnoozedUpdate(String version, long untilTimestamp) {
    config.snoozedUpdateVersion = version;
    config.snoozedUpdateUntil = untilTimestamp;
    saveConfig();
  }

  public void clearSnoozedUpdate() {
    config.snoozedUpdateVersion = null;
    config.snoozedUpdateUntil = 0L;
    saveConfig();
  }

  private static class Config {

    public String lastActiveDatabase;
    public boolean shareAnalytics = true;
    public String analyticsClientId;
    public double startTime = 5.0;
    public double restartTime = 5.0;

    @JsonAlias({"startDelay", "start_delay"})
    public double startRandomizer = 0.0;

    @JsonAlias({"restartDelay", "restart_delay"})
    public double restartRandomizer = 0.0;

    public String directorPassword = "RC AI Director";
    public String skippedUpdateVersion;
    public String updateChannel = "ALPHA";
    public String snoozedUpdateVersion;
    public long snoozedUpdateUntil = 0L;
  }
}
