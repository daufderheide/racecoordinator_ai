package com.antigravity.handlers;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.LoggerContext;
import com.antigravity.auth.Role;
import com.antigravity.service.ServerConfigService;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.javalin.Javalin;
import io.javalin.http.Context;
import java.io.File;
import java.io.FileInputStream;
import java.nio.file.Paths;
import org.slf4j.LoggerFactory;

/**
 * Handler for system-wide settings that are not persisted in the database but affect the runtime
 * behavior of the server.
 */
public class SettingsTaskHandler {

  private final ServerConfigService configService;

  public SettingsTaskHandler(Javalin app, ServerConfigService configService) {
    this.configService = configService;
    app.post("/api/settings/log-level", this::setLogLevel, Role.ADMIN);
    app.post("/api/settings/director-password", this::setDirectorPassword, Role.ADMIN);
    app.get("/api/settings/auth", this::getAuthSettings, Role.ADMIN);
    app.post("/api/client-logs", this::handleClientLog, Role.VIEWER);
    app.get("/api/logs/download", this::downloadLog, Role.VIEWER);
  }

  /**
   * Sets the log level for the com.antigravity package at runtime.
   *
   * @param ctx Javalin context
   */
  private void setLogLevel(Context ctx) {
    String level = getQueryParam(ctx, "level");
    if (level == null) {
      setStatus(ctx, 400);
      setResult(ctx, "Level parameter is required");
      return;
    }

    try {
      LoggerContext loggerContext = (LoggerContext) LoggerFactory.getILoggerFactory();
      // We target our main package to avoid overwhelming the logs with third-party library output
      ch.qos.logback.classic.Logger logger = loggerContext.getLogger("com.antigravity");
      logger.setLevel(Level.toLevel(level.toUpperCase()));

      setStatus(ctx, 200);
      setResult(ctx, "Server log level updated to " + level);
    } catch (Exception e) {
      setStatus(ctx, 500);
      setResult(ctx, "Error updating log level: " + e.getMessage());
    }
  }

  private void setDirectorPassword(Context ctx) {
    PasswordRequest req = ctx.bodyAsClass(PasswordRequest.class);
    configService.setDirectorPassword(req.password);
    setStatus(ctx, 200);
    setResult(ctx, "Director password updated");
  }

  private void getAuthSettings(Context ctx) {
    boolean hasDirectorPassword =
        configService.getDirectorPassword() != null
            && !configService.getDirectorPassword().isEmpty();
    ctx.json(new AuthSettingsResponse(hasDirectorPassword));
  }

  void handleClientLog(Context ctx) {
    try {
      ClientLogRequest req = ctx.bodyAsClass(ClientLogRequest.class);
      if (req != null && req.message != null && !req.message.isEmpty()) {
        String level = req.level != null ? req.level.toUpperCase() : "WARN";
        String msg = req.message.length() > 1000 ? req.message.substring(0, 1000) : req.message;
        String clientIp = ctx.ip() != null ? ctx.ip() : "unknown";
        String clientTag =
            req.clientId != null && !req.clientId.isEmpty()
                ? clientIp + "#" + req.clientId
                : clientIp;
        String prefix = "[CLIENT " + clientTag + "] ";

        org.slf4j.Logger clientLogger = LoggerFactory.getLogger("com.antigravity.client");
        if ("ERROR".equals(level)) {
          clientLogger.error("{}{}", prefix, msg);
        } else if ("INFO".equals(level)) {
          clientLogger.info("{}{}", prefix, msg);
        } else if ("DEBUG".equals(level)) {
          clientLogger.debug("{}{}", prefix, msg);
        } else {
          clientLogger.warn("{}{}", prefix, msg);
        }
      }
      setStatus(ctx, 200);
      setResult(ctx, "OK");
    } catch (Exception e) {
      setStatus(ctx, 400);
      setResult(ctx, "Failed to parse log: " + e.getMessage());
    }
  }

  File getLogFile() {
    String appDataDir = System.getProperty("app.data.dir");
    if (appDataDir != null && !appDataDir.isEmpty()) {
      return Paths.get(appDataDir, "racecoordinator.log").toFile();
    }
    return new File("racecoordinator.log");
  }

  void downloadLog(Context ctx) {
    try {
      File logFile = getLogFile();
      if (!logFile.exists() || !logFile.canRead()) {
        setStatus(ctx, 404);
        setResult(ctx, "Log file not found");
        return;
      }
      ctx.contentType("text/plain; charset=utf-8");
      ctx.header("Content-Disposition", "attachment; filename=\"racecoordinator.log\"");
      ctx.result(new FileInputStream(logFile));
    } catch (Exception e) {
      setStatus(ctx, 500);
      setResult(ctx, "Error reading log file: " + e.getMessage());
    }
  }

  public static class ClientLogRequest {
    @JsonProperty("level")
    public String level;

    @JsonProperty("message")
    public String message;

    @JsonProperty("clientId")
    public String clientId;
  }

  private static class PasswordRequest {
    @JsonProperty("password")
    public String password;
  }

  private static class AuthSettingsResponse {
    public boolean hasDirectorPassword;

    public AuthSettingsResponse(boolean hasDirectorPassword) {
      this.hasDirectorPassword = hasDirectorPassword;
    }
  }

  void setStatus(Context ctx, int status) {
    ctx.status(status);
  }

  void setResult(Context ctx, String result) {
    ctx.result(result);
  }

  String getQueryParam(Context ctx, String key) {
    return ctx.queryParam(key);
  }
}
