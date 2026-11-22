package com.antigravity.handlers;

import com.antigravity.auth.Role;
import com.antigravity.context.DatabaseContext;
import com.antigravity.context.RaceScope;
import com.antigravity.importer.RacePackageExporter;
import com.antigravity.importer.RacePackageImporter;
import com.antigravity.importer.model.RacePackageCommitRequest;
import com.antigravity.importer.model.RacePackagePreview;
import com.antigravity.importer.model.RacePackageResult;
import com.antigravity.models.RaceHistoryRecord;
import com.antigravity.service.AssetService;
import com.antigravity.service.DatabaseService;
import com.antigravity.util.RequestContextUtils;
import io.javalin.Javalin;
import io.javalin.http.Context;
import io.javalin.http.UploadedFile;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.InputStream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class RacePackageTaskHandler {

  private static final Logger logger = LoggerFactory.getLogger(RacePackageTaskHandler.class);

  private final DatabaseContext databaseContext;

  public RacePackageTaskHandler(DatabaseContext databaseContext, Javalin app) {
    this.databaseContext = databaseContext;

    app.get("/api/history/races/{id}/export-package", this::handleExportPackage, Role.VIEWER);
    app.post("/api/history/races/preview-package", this::handlePreviewPackage, Role.DIRECTOR);
    app.post("/api/history/races/commit-package", this::handleCommitPackage, Role.DIRECTOR);
  }

  private AssetService getAssetService() {
    String currentDbName = databaseContext.getCurrentDatabaseName();
    if (currentDbName == null || currentDbName.trim().isEmpty()) {
      currentDbName = "RaceCoordinator_AI_DB";
    }
    File assetsDir = new File(new File(databaseContext.getDataRoot(), currentDbName), "assets");
    return new AssetService(databaseContext, assetsDir.getAbsolutePath());
  }

  public void handleExportPackage(Context ctx) {
    try {
      String id = ctx.pathParam("id");
      RaceScope scope = RequestContextUtils.getRaceScope(ctx);
      boolean isDemo = scope == RaceScope.DEMO;

      RacePackageExporter exporter = new RacePackageExporter(databaseContext, getAssetService());
      byte[] packageBytes = exporter.exportRacePackage(id, isDemo);

      DatabaseService dbService = DatabaseService.getInstance();
      RaceHistoryRecord rec = dbService.getRaceHistoryById(databaseContext, id, scope);
      String raceName =
          (rec != null && rec.getModel() != null && rec.getModel().getName() != null)
              ? rec.getModel().getName().trim()
              : "Race";
      String sanitized = raceName.replaceAll("[^a-zA-Z0-9_-]", "_");
      String filename = sanitized + ".rcpack";

      ctx.contentType("application/octet-stream");
      ctx.header("Content-Disposition", "attachment; filename=\"" + filename + "\"");
      ctx.result(new ByteArrayInputStream(packageBytes));
    } catch (IllegalArgumentException e) {
      logger.warn("Invalid race history ID for package export: {}", e.getMessage());
      ctx.status(404).result(e.getMessage());
    } catch (Exception e) {
      logger.error("Failed to export race package", e);
      ctx.status(500).result("Error exporting race package: " + e.getMessage());
    }
  }

  public void handlePreviewPackage(Context ctx) {
    try {
      UploadedFile file = ctx.uploadedFile("file");
      InputStream inStream;
      byte[] bodyBytes = ctx.bodyAsBytes();
      if (file != null) {
        inStream = file.getContent();
      } else if (bodyBytes != null && bodyBytes.length > 0) {
        inStream = new ByteArrayInputStream(bodyBytes);
      } else {
        ctx.status(400).result("No race package file uploaded");
        return;
      }

      RacePackageImporter importer = new RacePackageImporter(databaseContext, getAssetService());
      RacePackagePreview preview = importer.previewPackage(inStream);
      ctx.json(preview);
    } catch (IllegalArgumentException e) {
      logger.warn("Validation error during race package preview: {}", e.getMessage());
      ctx.status(400).result(e.getMessage());
    } catch (Exception e) {
      logger.error("Failed to preview race package", e);
      ctx.status(500).result("Error previewing race package: " + e.getMessage());
    }
  }

  public void handleCommitPackage(Context ctx) {
    try {
      RacePackageCommitRequest request = ctx.bodyAsClass(RacePackageCommitRequest.class);
      RacePackageImporter importer = new RacePackageImporter(databaseContext, getAssetService());
      RacePackageResult result = importer.commitPackage(request);
      ctx.json(result);
    } catch (IllegalArgumentException e) {
      logger.warn("Validation error during race package commit: {}", e.getMessage());
      ctx.status(400).result(e.getMessage());
    } catch (Exception e) {
      logger.error("Failed to commit race package", e);
      ctx.status(500).result("Error committing race package: " + e.getMessage());
    }
  }
}
