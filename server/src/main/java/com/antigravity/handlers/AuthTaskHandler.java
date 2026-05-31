package com.antigravity.handlers;

import com.antigravity.auth.AuthService;
import com.antigravity.auth.Role;
import com.antigravity.service.ServerConfigService;
import com.antigravity.util.NetworkUtils;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.javalin.Javalin;
import io.javalin.http.Context;
import java.util.Map;

public class AuthTaskHandler {

  private final ServerConfigService configService;

  public AuthTaskHandler(Javalin app, ServerConfigService configService) {
    this.configService = configService;
    app.post("/api/auth/login", this::handleLogin, Role.VIEWER);
    app.put("/api/auth/password", this::handleChangePassword, Role.ADMIN);
    app.get("/api/auth/password", this::handleGetPassword, Role.ADMIN);
    app.get("/api/auth/role", this::handleGetRole, Role.VIEWER);
  }

  private void handleGetRole(Context ctx) {
    Role role = Role.VIEWER;

    if (NetworkUtils.isLocalhost(ctx.ip(), null)) {
      role = Role.ADMIN;
    } else {
      String authHeader = ctx.header("Authorization");
      if (authHeader != null && authHeader.startsWith("Bearer ")) {
        String token = authHeader.substring(7);
        if (AuthService.getInstance().isValidToken(token)) {
          role = Role.DIRECTOR;
        }
      }
    }

    ctx.json(Map.of("role", role.name()));
  }

  private void handleGetPassword(Context ctx) {
    String password = configService.getDirectorPassword();
    ctx.json(Map.of("password", password != null ? password : ""));
  }

  private void handleChangePassword(Context ctx) {
    ChangePasswordRequest request = ctx.bodyAsClass(ChangePasswordRequest.class);
    configService.setDirectorPassword(request.newPassword);
    ctx.status(200).json(Map.of("success", true));
  }

  private void handleLogin(Context ctx) {
    LoginRequest request = ctx.bodyAsClass(LoginRequest.class);
    String configuredPassword = configService.getDirectorPassword();

    // If no password is set, or password matches
    if (configuredPassword == null || configuredPassword.isEmpty()) {
      // Security decision: if no password configured, do we allow everyone?
      // Probably safest to deny, or require setting it first.
      // Let's assume an empty password means it's not setup, so login fails until setup.
      ctx.status(401).json(new LoginResponse(false, null, "Director password is not configured."));
      return;
    }

    if (configuredPassword.equals(request.password)) {
      String token = AuthService.getInstance().generateDirectorToken();
      ctx.json(new LoginResponse(true, token, null));
    } else {
      ctx.status(401).json(new LoginResponse(false, null, "Invalid password"));
    }
  }

  static class LoginRequest {
    @JsonProperty("password")
    public String password;
  }

  static class LoginResponse {
    public boolean success;
    public String token;
    public String error;

    public LoginResponse(boolean success, String token, String error) {
      this.success = success;
      this.token = token;
      this.error = error;
    }
  }

  static class ChangePasswordRequest {
    @JsonProperty("newPassword")
    public String newPassword;
  }
}
