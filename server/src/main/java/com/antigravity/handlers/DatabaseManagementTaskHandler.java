package com.antigravity.handlers;

import com.antigravity.auth.Role;
import com.antigravity.context.DatabaseContext;
import io.javalin.Javalin;
import io.javalin.http.Context;
import io.javalin.http.UploadedFile;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class DatabaseManagementTaskHandler {

  private static final Logger logger = LoggerFactory.getLogger(DatabaseManagementTaskHandler.class);
  private final DatabaseContext databaseContext;

  public DatabaseManagementTaskHandler(DatabaseContext databaseContext, Javalin app) {
    this.databaseContext = databaseContext;

    app.get("/api/databases", this::listDatabases, Role.ADMIN);
    app.post("/api/databases/switch", this::switchDatabase, Role.ADMIN);
    app.post("/api/databases/create", this::createDatabase, Role.ADMIN);
    app.post("/api/databases/copy", this::copyDatabase, Role.ADMIN);
    app.post("/api/databases/reset", this::resetDatabase, Role.ADMIN);
    app.post("/api/databases/delete", this::deleteDatabase, Role.ADMIN);
    app.get("/api/databases/current", this::getCurrentDatabase, Role.ADMIN);
    app.get("/api/databases/{name}/export", this::exportDatabase, Role.ADMIN);
    app.post("/api/databases/import", this::importDatabase, Role.ADMIN);
  }

  public void listDatabases(Context ctx) {
    try {
      List<String> dbNames = databaseContext.listDatabases();
      List<DatabaseContext.DatabaseStats> statsList = new ArrayList<>();
      for (String dbName : dbNames) {
        if ("admin".equals(dbName) || "local".equals(dbName) || "config".equals(dbName)) {
          continue;
        }
        statsList.add(databaseContext.getDatabaseStats(dbName));
      }
      ctx.json(statsList);
    } catch (Exception e) {
      logger.error("Error listing databases", e);
      ctx.status(500).result("Error listing databases: " + e.getMessage());
    }
  }

  public void switchDatabase(Context ctx) {
    try {
      Map<String, String> body = ctx.bodyAsClass(Map.class);
      String name = body.get("name");
      if (name == null || name.isEmpty()) {
        ctx.status(400).result("Database name is required");
        return;
      }
      databaseContext.switchDatabase(name);
      ctx.json(databaseContext.getDatabaseStats(name));
    } catch (Exception e) {
      logger.error("Error switching database", e);
      ctx.status(500).result("Error switching database: " + e.getMessage());
    }
  }

  public void createDatabase(Context ctx) {
    try {
      Map<String, String> body = ctx.bodyAsClass(Map.class);
      String name = body.get("name");
      if (name == null || name.isEmpty()) {
        ctx.status(400).result("Database name is required");
        return;
      }

      List<String> existingDbs = databaseContext.listDatabases();
      if (existingDbs.contains(name)) {
        ctx.status(409).result("Database already exists");
        return;
      }

      databaseContext.createDatabase(name);
      databaseContext.switchDatabase(name);
      databaseContext.resetDatabaseToFactory(name);

      ctx.json(databaseContext.getDatabaseStats(name));
    } catch (Exception e) {
      logger.error("Error creating database", e);
      ctx.status(500).result("Error creating database: " + e.getMessage());
    }
  }

  public void copyDatabase(Context ctx) {
    try {
      Map<String, String> body = ctx.bodyAsClass(Map.class);
      String newName = body.get("name");
      String sourceName = body.get("source");

      if (newName == null || newName.isEmpty()) {
        ctx.status(400).result("New database name is required");
        return;
      }

      List<String> existingDbs = databaseContext.listDatabases();
      if (existingDbs.contains(newName)) {
        ctx.status(409).result("Database already exists");
        return;
      }

      if (sourceName == null || sourceName.isEmpty()) {
        sourceName = databaseContext.getCurrentDatabaseName();
      } else if (!existingDbs.contains(sourceName)) {
        ctx.status(404).result("Source database not found");
        return;
      }

      databaseContext.copyDatabase(sourceName, newName);

      ctx.json(databaseContext.getDatabaseStats(newName));
    } catch (Exception e) {
      logger.error("Error copying database", e);
      ctx.status(500).result("Error copying database: " + e.getMessage());
    }
  }

  public void resetDatabase(Context ctx) {
    try {
      Map<String, String> body = ctx.bodyAsClass(Map.class);
      String requestedName = body != null ? body.get("name") : null;
      String name = requestedName;

      if (name == null || name.isEmpty()) {
        name = databaseContext.getCurrentDatabaseName();
      }

      logger.info("Resetting database: {} (Requested: {})", name, requestedName);
      databaseContext.resetDatabaseToFactory(name);
      ctx.json(databaseContext.getDatabaseStats(name));
    } catch (Exception e) {
      logger.error("Error resetting database", e);
      ctx.status(500).result("Error resetting database: " + e.getMessage());
    }
  }

  public void deleteDatabase(Context ctx) {
    try {
      Map<String, String> body = ctx.bodyAsClass(Map.class);
      String name = body.get("name");
      if (name == null || name.isEmpty()) {
        ctx.status(400).result("Database name is required");
        return;
      }

      String current = databaseContext.getCurrentDatabaseName();
      if (name.equals(current)) {
        ctx.status(400).result("Cannot delete the active database");
        return;
      }

      databaseContext.deleteDatabase(name);
      ctx.status(204);
    } catch (Exception e) {
      logger.error("Error deleting database", e);
      ctx.status(500).result("Error deleting database: " + e.getMessage());
    }
  }

  public void getCurrentDatabase(Context ctx) {
    String current = databaseContext.getCurrentDatabaseName();
    ctx.json(databaseContext.getDatabaseStats(current));
  }

  public void exportDatabase(Context ctx) {
    String name = ctx.pathParam("name");
    ctx.header("Content-Disposition", "attachment; filename=\"" + name + ".zip\"");
    ctx.contentType("application/zip");
    try {
      databaseContext.exportDatabase(name, ctx.res.getOutputStream());
    } catch (Exception e) {
      logger.error("Error exporting database", e);
      ctx.status(500).result("Error exporting database: " + e.getMessage());
    }
  }

  public void importDatabase(Context ctx) {
    try {
      String name = ctx.formParam("name");
      UploadedFile file = ctx.uploadedFile("file");

      if (name == null || name.isEmpty() || file == null) {
        ctx.status(400).result("Name and file are required");
        return;
      }

      if (databaseContext.listDatabases().contains(name)) {
        ctx.status(409).result("Database already exists");
        return;
      }

      databaseContext.importDatabase(name, file.getContent());
      ctx.json(databaseContext.getDatabaseStats(name));
    } catch (Exception e) {
      logger.error("Error importing database", e);
      ctx.status(500).result("Error importing database: " + e.getMessage());
    }
  }
}
