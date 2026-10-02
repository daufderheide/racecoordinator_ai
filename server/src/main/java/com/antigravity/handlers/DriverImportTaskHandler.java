package com.antigravity.handlers;

import com.antigravity.auth.Role;
import com.antigravity.context.DatabaseContext;
import com.antigravity.importer.DriverImporter;
import com.antigravity.importer.model.DriverImportCommitRequest;
import com.antigravity.importer.model.DriverImportPreview;
import com.antigravity.importer.model.DriverImportResult;
import com.antigravity.models.Driver;
import com.antigravity.repository.SqliteRepository;
import com.antigravity.service.AssetService;
import io.javalin.Javalin;
import io.javalin.http.Context;
import io.javalin.http.UploadedFile;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class DriverImportTaskHandler {

  private static final Logger logger = LoggerFactory.getLogger(DriverImportTaskHandler.class);

  private final DatabaseContext databaseContext;
  private final SqliteRepository<Driver> driverRepository;

  public DriverImportTaskHandler(
      DatabaseContext databaseContext, SqliteRepository<Driver> driverRepository, Javalin app) {
    this.databaseContext = databaseContext;
    this.driverRepository = driverRepository;

    app.post("/api/drivers/import/preview", this::handlePreview, Role.DIRECTOR);
    app.post("/api/drivers/import/commit", this::handleCommit, Role.DIRECTOR);
    app.get("/api/drivers/import/template", this::handleTemplate, Role.VIEWER);
  }

  private AssetService getAssetService() {
    String currentDbName = databaseContext.getCurrentDatabaseName();
    if (currentDbName == null || currentDbName.trim().isEmpty()) {
      currentDbName = "RaceCoordinator_AI_DB";
    }
    File assetsDir = new File(new File(databaseContext.getDataRoot(), currentDbName), "assets");
    return new AssetService(databaseContext, assetsDir.getAbsolutePath());
  }

  private DriverImporter createImporter() {
    return new DriverImporter(databaseContext, driverRepository, getAssetService());
  }

  public void handlePreview(Context ctx) {
    try {
      List<UploadedFile> files = ctx.uploadedFiles();
      if (files == null || files.isEmpty()) {
        ctx.status(400).result("No files uploaded for import");
        return;
      }

      UploadedFile primaryFile = ctx.uploadedFile("file");
      if (primaryFile == null) {
        // Fallback: find the first file with a spreadsheet/json/zip extension
        for (UploadedFile f : files) {
          String name = f.getFilename().toLowerCase(Locale.ROOT);
          if (name.endsWith(".csv")
              || name.endsWith(".xlsx")
              || name.endsWith(".xls")
              || name.endsWith(".json")
              || name.endsWith(".zip")) {
            primaryFile = f;
            break;
          }
        }
      }

      if (primaryFile == null) {
        ctx.status(400).result("No valid CSV, Excel, JSON, or ZIP data file found in upload");
        return;
      }

      Map<String, byte[]> companionAssets = new HashMap<>();
      for (UploadedFile f : files) {
        if (f != primaryFile) {
          byte[] data = DriverImportTaskHandlerUtils.readBytes(f.getContent());
          companionAssets.put(f.getFilename(), data);
        }
      }

      DriverImporter importer = createImporter();
      DriverImportPreview preview =
          importer.parseAndValidate(
              primaryFile.getContent(), primaryFile.getFilename(), companionAssets);

      ctx.json(preview);
    } catch (IllegalArgumentException e) {
      logger.warn("Validation error during driver import preview: {}", e.getMessage());
      ctx.status(400).result(e.getMessage());
    } catch (Exception e) {
      logger.error("Error generating driver import preview", e);
      ctx.status(500).result("Error generating preview: " + e.getMessage());
    }
  }

  public void handleCommit(Context ctx) {
    try {
      DriverImportCommitRequest request = ctx.bodyAsClass(DriverImportCommitRequest.class);
      DriverImporter importer = createImporter();
      DriverImportResult result = importer.commitImport(request);
      ctx.json(result);
    } catch (Exception e) {
      logger.error("Error committing driver import", e);
      ctx.status(500).result("Error committing import: " + e.getMessage());
    }
  }

  public void handleTemplate(Context ctx) {
    try {
      String format = ctx.queryParam("format");
      if (format == null) format = "csv";
      format = format.trim().toLowerCase(Locale.ROOT);

      DriverImporter importer = createImporter();

      if ("xlsx".equals(format) || "xls".equals(format)) {
        byte[] bytes = importer.generateXlsxTemplate();
        ctx.contentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        ctx.header("Content-Disposition", "attachment; filename=\"drivers_template.xlsx\"");
        ctx.result(new ByteArrayInputStream(bytes));
        return;
      }

      if ("json".equals(format)) {
        String json = importer.generateJsonTemplate();
        ctx.contentType("application/json");
        ctx.header("Content-Disposition", "attachment; filename=\"drivers_template.json\"");
        ctx.result(json);
        return;
      }

      String csv = importer.generateCsvTemplate();
      ctx.contentType("text/csv");
      ctx.header("Content-Disposition", "attachment; filename=\"drivers_template.csv\"");
      ctx.result(csv);
    } catch (Exception e) {
      logger.error("Error generating driver template", e);
      ctx.status(500).result("Error generating template: " + e.getMessage());
    }
  }

  public static class DriverImportTaskHandlerUtils {
    public static byte[] readBytes(InputStream is) throws java.io.IOException {
      java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
      byte[] buf = new byte[8192];
      int len;
      while ((len = is.read(buf)) != -1) {
        baos.write(buf, 0, len);
      }
      return baos.toByteArray();
    }
  }
}
