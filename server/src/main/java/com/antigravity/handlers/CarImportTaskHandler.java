package com.antigravity.handlers;

import com.antigravity.auth.Role;
import com.antigravity.context.DatabaseContext;
import com.antigravity.importer.CarExporter;
import com.antigravity.importer.CarImporter;
import com.antigravity.importer.DriverImportParserHelper;
import com.antigravity.importer.model.CarImportCommitRequest;
import com.antigravity.models.CarField;
import com.antigravity.repository.SqliteRepository;
import com.antigravity.service.AssetService;
import io.javalin.Javalin;
import io.javalin.http.Context;
import io.javalin.http.UploadedFile;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Slotcar import (#1210, step 6b), like the driver import: a preview of an uploaded file, a commit
 * of the rows the user sends back, and a template to fill in.
 */
public class CarImportTaskHandler {
  private static final Logger logger = LoggerFactory.getLogger(CarImportTaskHandler.class);

  private final DatabaseContext databaseContext;

  public CarImportTaskHandler(DatabaseContext databaseContext, Javalin app) {
    this.databaseContext = databaseContext;
    app.post("/api/cars/import/preview", this::handlePreview, Role.DIRECTOR);
    app.post("/api/cars/import/commit", this::handleCommit, Role.DIRECTOR);
    app.get("/api/cars/import/template", this::handleTemplate, Role.VIEWER);
  }

  CarImporter createImporter() {
    String dbName = databaseContext.getCurrentDatabaseName();
    if (dbName == null || dbName.trim().isEmpty()) {
      dbName = "RaceCoordinator_AI_DB";
    }
    File assetsDir = new File(new File(databaseContext.getDataRoot(), dbName), "assets");
    return new CarImporter(
        databaseContext, new AssetService(databaseContext, assetsDir.getAbsolutePath()));
  }

  /**
   * Multipart upload: the data file in "file" (CSV, Excel, JSON or a ZIP with pictures); other
   * picture files next to it are matched by file name.
   */
  public void handlePreview(Context ctx) {
    try {
      List<UploadedFile> files = ctx.uploadedFiles();
      if (files == null || files.isEmpty()) {
        ctx.status(400).result("No files uploaded for import");
        return;
      }
      UploadedFile primary = ctx.uploadedFile("file");
      if (primary == null) {
        for (UploadedFile f : files) {
          if (isDataFile(f.getFilename())) {
            primary = f;
            break;
          }
        }
      }
      if (primary == null) {
        ctx.status(400).result("No CSV, Excel, JSON or ZIP file found in the upload");
        return;
      }
      Map<String, byte[]> pictures = new HashMap<>();
      for (UploadedFile f : files) {
        if (f != primary && DriverImportParserHelper.isMediaFile(f.getFilename())) {
          pictures.put(
              f.getFilename(), DriverImportParserHelper.readAllBytesFromStream(f.getContent()));
        }
      }
      byte[] data = DriverImportParserHelper.readAllBytesFromStream(primary.getContent());
      ctx.json(createImporter().preview(data, primary.getFilename(), pictures));
    } catch (IllegalArgumentException e) {
      ctx.status(400).result(e.getMessage());
    } catch (Exception e) {
      logger.error("Error previewing a car import", e);
      ctx.status(500).result("Error reading the file: " + e.getMessage());
    }
  }

  public void handleCommit(Context ctx) {
    try {
      CarImportCommitRequest request = ctx.bodyAsClass(CarImportCommitRequest.class);
      ctx.json(createImporter().commit(request));
    } catch (Exception e) {
      logger.error("Error importing cars", e);
      ctx.status(500).result("Error importing cars: " + e.getMessage());
    }
  }

  /** {@code format} csv (default), xlsx or json: the columns with your own fields, one example. */
  public void handleTemplate(Context ctx) {
    try {
      List<CarField> fields =
          new SqliteRepository<>(databaseContext, "car_fields", CarField.class).findAll();
      Map.Entry<String, byte[]> file = CarExporter.templateFile(fields, ctx.queryParam("format"));
      String ext = file.getKey();
      ctx.contentType(
          "xlsx".equals(ext)
              ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              : "json".equals(ext) ? "application/json" : "text/csv");
      ctx.header("Content-Disposition", "attachment; filename=\"cars_template." + ext + "\"");
      ctx.result(new ByteArrayInputStream(file.getValue()));
    } catch (Exception e) {
      logger.error("Error making the car import template", e);
      ctx.status(500).result("Error making the template: " + e.getMessage());
    }
  }

  private static boolean isDataFile(String name) {
    String lower = name == null ? "" : name.toLowerCase(Locale.ROOT);
    return lower.endsWith(".csv")
        || lower.endsWith(".xlsx")
        || lower.endsWith(".xls")
        || lower.endsWith(".json")
        || lower.endsWith(".zip");
  }
}
