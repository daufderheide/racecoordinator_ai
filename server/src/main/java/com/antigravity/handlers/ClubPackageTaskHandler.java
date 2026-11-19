package com.antigravity.handlers;

import com.antigravity.auth.Role;
import com.antigravity.context.DatabaseContext;
import com.antigravity.importer.club.ClubImport;
import com.antigravity.importer.club.ClubPackageExporter;
import com.antigravity.importer.club.ClubPackageImporter;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.javalin.Javalin;
import io.javalin.http.Context;
import io.javalin.http.UploadedFile;
import java.io.InputStream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Club Race Export &amp; Import: move a championship (season) with its race nights between PCs.
 * https://github.com/daufderheide/racecoordinator_ai/issues/972
 *
 * <ul>
 *   <li>{@code GET /api/club/export?seasonId=&name=} downloads the club package.
 *   <li>{@code POST /api/club/import/preview} (a file upload or the JSON as the body) shows what
 *       the import would do.
 *   <li>{@code POST /api/club/import/commit} applies it with the chosen resolutions.
 * </ul>
 */
public class ClubPackageTaskHandler {

  private static final Logger logger = LoggerFactory.getLogger(ClubPackageTaskHandler.class);

  private static final ObjectMapper MAPPER =
      new ObjectMapper().configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

  private final DatabaseContext databaseContext;

  public ClubPackageTaskHandler(DatabaseContext databaseContext, Javalin app) {
    this.databaseContext = databaseContext;
    app.get("/api/club/export", this::handleExport, Role.DIRECTOR);
    app.post("/api/club/import/preview", this::handlePreview, Role.DIRECTOR);
    app.post("/api/club/import/commit", this::handleCommit, Role.DIRECTOR);
  }

  void handleExport(Context ctx) {
    String seasonId = ctx.queryParam("seasonId");
    if (seasonId == null || seasonId.trim().isEmpty()) {
      ctx.status(400).result("CRE_ERR_SEASON_NOT_FOUND");
      return;
    }
    try {
      ObjectNode pkg =
          new ClubPackageExporter(databaseContext).export(seasonId, ctx.queryParam("name"));
      String name = pkg.path("championship").path("name").asText("championship");
      String fileName = name.replaceAll("[^A-Za-z0-9._ -]", "_").trim() + ".rcclub.json";
      ctx.header("Content-Disposition", "attachment; filename=\"" + fileName + "\"");
      ctx.contentType("application/json")
          .result(MAPPER.writerWithDefaultPrettyPrinter().writeValueAsString(pkg));
    } catch (IllegalArgumentException e) {
      ctx.status(404).result(e.getMessage());
    } catch (Exception e) {
      logger.error("Club package export failed", e);
      ctx.status(500).result("CRE_ERR_EXPORT_FAILED");
    }
  }

  void handlePreview(Context ctx) {
    try {
      JsonNode pkg = readPackage(ctx);
      ClubImport.Preview preview = new ClubPackageImporter(databaseContext).preview(pkg);
      ctx.contentType("application/json").result(MAPPER.writeValueAsString(preview));
    } catch (IllegalArgumentException e) {
      ctx.status(400).result(e.getMessage());
    } catch (Exception e) {
      logger.error("Club package preview failed", e);
      ctx.status(400).result("CRI_ERR_NOT_A_CLUB_PACKAGE");
    }
  }

  void handleCommit(Context ctx) {
    try {
      ClubImport.CommitRequest req = MAPPER.readValue(ctx.body(), ClubImport.CommitRequest.class);
      ClubImport.Result result = new ClubPackageImporter(databaseContext).commit(req);
      ctx.contentType("application/json").result(MAPPER.writeValueAsString(result));
    } catch (IllegalArgumentException e) {
      ctx.status(400).result(e.getMessage());
    } catch (Exception e) {
      logger.error("Club package import failed", e);
      ctx.status(500).result("CRI_ERR_COMMIT_FAILED");
    }
  }

  private static JsonNode readPackage(Context ctx) throws Exception {
    UploadedFile file = null;
    try {
      file = ctx.uploadedFile("file");
    } catch (Exception ignored) {
      // not a multipart request: the JSON is the body
    }
    if (file != null) {
      try (InputStream in = file.getContent()) {
        return MAPPER.readTree(in);
      }
    }
    return MAPPER.readTree(ctx.body());
  }
}
