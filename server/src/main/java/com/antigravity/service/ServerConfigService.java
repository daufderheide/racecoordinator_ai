package com.antigravity.service;

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

  public double getStartDelay() {
    return config.startDelay;
  }

  public void setStartDelay(double startDelay) {
    config.startDelay = startDelay;
    saveConfig();
  }

  public double getRestartDelay() {
    return config.restartDelay;
  }

  public void setRestartDelay(double restartDelay) {
    config.restartDelay = restartDelay;
    saveConfig();
  }

  private static class Config {

    public String lastActiveDatabase;
    public boolean shareAnalytics = true;
    public String analyticsClientId;
    public double startTime = 5.0;
    public double restartTime = 5.0;
    public double startDelay = 0.0;
    public double restartDelay = 0.0;
    public String directorPassword = "RC AI Director";
  }
}
