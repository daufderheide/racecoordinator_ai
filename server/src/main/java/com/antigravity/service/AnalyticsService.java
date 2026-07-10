package com.antigravity.service;

import com.antigravity.App;
import com.antigravity.race.Race;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Properties;
import java.util.concurrent.CompletableFuture;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class AnalyticsService {

  private static final Logger logger = LoggerFactory.getLogger(AnalyticsService.class);
  private static AnalyticsService instance;

  private String measurementId;
  private String apiSecret;
  private final boolean enabled;
  private boolean userEnabled = true;
  private final ObjectMapper mapper;
  private final ServerConfigService configService;

  private AnalyticsService() {
    this.mapper = new ObjectMapper();

    Properties props = new Properties();
    try (InputStream input =
        getClass().getClassLoader().getResourceAsStream("analytics.properties")) {
      if (input != null) {
        props.load(input);
        this.measurementId = props.getProperty("ga.measurement.id");
        this.apiSecret = props.getProperty("ga.api.secret");
      } else {
        logger.error("Analytics Error: analytics.properties file not found in resources");
      }
    } catch (Exception ex) {
      logger.error("Analytics Error: Could not load analytics.properties", ex);
    }

    this.configService = new ServerConfigService();
    this.userEnabled = configService.isShareAnalyticsEnabled();

    boolean hasMeasurementId =
        this.measurementId != null
            && !this.measurementId.isEmpty()
            && !this.measurementId.contains("XXXXX");
    boolean hasApiSecret =
        this.apiSecret != null
            && !this.apiSecret.isEmpty()
            && !this.apiSecret.contains("your_api_secret");

    if (!hasMeasurementId) {
      logger.error(
          "Analytics Error: 'ga.measurement.id' is missing or invalid in analytics.properties");
    }
    if (!hasApiSecret) {
      logger.error(
          "Analytics Error: 'ga.api.secret' is missing or invalid in analytics.properties");
    }

    if (hasMeasurementId && hasApiSecret) {
      this.enabled = true;
      logger.info("Google Analytics Measurement Protocol configured and enabled.");
    } else {
      this.enabled = false;
      logger.info("Google Analytics Measurement Protocol disabled (no valid credentials found).");
    }
  }

  public void setUserEnabled(boolean enabled) {
    this.userEnabled = enabled;
    this.configService.setShareAnalyticsEnabled(enabled);
    logger.info("Analytics sharing {}", enabled ? "enabled" : "disabled");
    trackAnalyticsToggle(enabled);
  }

  public void trackAnalyticsToggle(boolean newStatus) {
    if (!enabled) {
      return;
    }

    Map<String, Object> params = new HashMap<>();
    params.put("analytics_enabled", newStatus);
    params.put("engagement_time_msec", 1L);
    params.put("session_id", System.currentTimeMillis());

    sendPayload(createPayload("analytics_toggled", params));
  }

  public boolean isUserEnabled() {
    return this.userEnabled;
  }

  public static synchronized AnalyticsService getInstance() {
    if (instance == null) {
      instance = new AnalyticsService();
    }
    return instance;
  }

  public String getClientId() {
    return this.configService.getAnalyticsClientId();
  }

  public String getMeasurementId() {
    return this.measurementId;
  }

  public void trackRaceStart(Race race) {
    if (!enabled || !userEnabled || race == null) {
      return;
    }

    sendPayload(createPayload("backend_race_started", buildRaceStartParams(race)));
  }

  /* package */ Map<String, Object> buildRaceStartParams(Race race) {
    Map<String, Object> params = new HashMap<>();
    params.put(
        "number_of_lanes",
        race.getTrack() != null && race.getTrack().getLanes() != null
            ? race.getTrack().getLanes().size()
            : 0);
    params.put("driver_count", race.getDrivers() != null ? race.getDrivers().size() : 0);
    params.put("is_demo", race.isDemoMode());
    params.put("heat_rotation_type", race.getRaceModel().getHeatRotationType().name());
    params.put("heat_scoring_method", race.getRaceModel().getHeatScoring().getHeatRanking().name());
    params.put(
        "overall_scoring_method",
        race.getRaceModel().getOverallScoring().getRankingMethod().name());
    params.put(
        "fuel_system",
        race.getFuelOptions() != null && race.getFuelOptions().isEnabled()
            ? (race.getTrack() != null && race.getTrack().hasDigitalFuel() ? "Digital" : "Analog")
            : "None");
    boolean hasArduino =
        race.getTrack() != null
            && race.getTrack().getArduinoConfigs() != null
            && !race.getTrack().getArduinoConfigs().isEmpty();
    boolean hasTrackmate =
        race.getTrack() != null
            && race.getTrack().getTrackmateConfigs() != null
            && !race.getTrack().getTrackmateConfigs().isEmpty();

    String hardwareInterface = "None";
    if (hasArduino && hasTrackmate) {
      hardwareInterface = "Multiple";
    } else if (hasArduino) {
      hardwareInterface = "Arduino";
    } else if (hasTrackmate) {
      hardwareInterface = "Trackmate";
    }
    params.put("hardware_interface", hardwareInterface);

    params.put("engagement_time_msec", 1L);
    params.put("session_id", System.currentTimeMillis());
    return params;
  }

  /* package */ Map<String, Object> createPayload(String eventName, Map<String, Object> params) {
    Map<String, Object> event = new HashMap<>();
    event.put("name", eventName);

    // Append server version to all backend tracking events
    params.put("server_version", App.SERVER_VERSION);

    event.put("params", params);

    Map<String, Object> payload = new HashMap<>();
    payload.put("client_id", getClientId());
    payload.put("events", Collections.singletonList(event));
    return payload;
  }

  private void sendPayload(Map<String, Object> payload) {
    CompletableFuture.runAsync(
        () -> {
          try {
            String jsonPayload = mapper.writeValueAsString(payload);
            logger.debug("Sending GA telemetry payload: {}", jsonPayload);

            // Use production endpoint
            String urlString =
                String.format(
                    "https://www.google-analytics.com/mp/collect?measurement_id=%s&api_secret=%s",
                    measurementId, apiSecret);

            URL url = new URL(urlString);
            HttpURLConnection conn = createConnection(url);
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setDoOutput(true);

            try (OutputStream os = conn.getOutputStream()) {
              byte[] input = jsonPayload.getBytes("utf-8");
              os.write(input, 0, input.length);
            }

            int statusCode = conn.getResponseCode();
            StringBuilder responseBody = new StringBuilder();
            try (InputStream is =
                (statusCode >= 400) ? conn.getErrorStream() : conn.getInputStream()) {
              if (is != null) {
                byte[] buffer = new byte[1024];
                int bytesRead;
                while ((bytesRead = is.read(buffer)) != -1) {
                  responseBody.append(new String(buffer, 0, bytesRead, "utf-8"));
                }
              }
            } catch (Exception bodyEx) {
              responseBody
                  .append("(could not read response body: ")
                  .append(bodyEx.getMessage())
                  .append(")");
            }

            if (statusCode >= 400) {
              logger.warn(
                  "Failed to send GA telemetry. Status: {}. Response: {}",
                  statusCode,
                  responseBody);
            } else {
              logger.debug(
                  "Successfully sent GA telemetry. Status: {}. Response: {}",
                  statusCode,
                  responseBody);
            }
          } catch (Exception e) {
            logger.warn("Error sending GA telemetry: {}", e.getMessage());
          }
        });
  }

  protected HttpURLConnection createConnection(URL url) throws Exception {
    return (HttpURLConnection) url.openConnection();
  }
}
