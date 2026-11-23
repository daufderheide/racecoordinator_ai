package com.antigravity.handlers;

import com.antigravity.App;
import com.antigravity.auth.Role;
import com.antigravity.context.DatabaseContext;
import com.antigravity.importer.CustomRotationExportImportHelper;
import com.antigravity.importer.DriverImporter;
import com.antigravity.models.Race;
import com.antigravity.repository.SqliteRepository;
import com.antigravity.service.AssetService;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.javalin.Javalin;
import io.javalin.http.Context;
import io.javalin.http.UploadedFile;
import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class RaceConfigExportImportHandler {

  private static final Logger logger = LoggerFactory.getLogger(RaceConfigExportImportHandler.class);
  private static final ObjectMapper objectMapper =
      new ObjectMapper()
          .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
          .configure(DeserializationFeature.READ_UNKNOWN_ENUM_VALUES_AS_NULL, true);

  private final SqliteRepository<Race> raceRepository;
  private final AssetService assetService;

  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class RaceConfigPackage {
    @JsonProperty("format_version")
    private int formatVersion = 1;

    @JsonProperty("package_type")
    private String packageType = "RACE_CONFIG";

    @JsonProperty("created_by_app_version")
    private String createdByAppVersion;

    @JsonProperty("race")
    private Race race;

    @JsonProperty("custom_rotation")
    private CustomRotationExportImportHelper.CustomRotationPackage customRotation;

    public RaceConfigPackage() {}

    @JsonCreator
    public RaceConfigPackage(
        @JsonProperty("format_version") Integer formatVersion,
        @JsonProperty("package_type") String packageType,
        @JsonProperty("created_by_app_version") String createdByAppVersion,
        @JsonProperty("race") Race race,
        @JsonProperty("custom_rotation")
            CustomRotationExportImportHelper.CustomRotationPackage customRotation) {
      this.formatVersion = formatVersion != null ? formatVersion : 1;
      this.packageType = packageType != null ? packageType : "RACE_CONFIG";
      this.createdByAppVersion = createdByAppVersion != null ? createdByAppVersion : "";
      this.race = race;
      this.customRotation = customRotation;
    }

    public RaceConfigPackage(
        Integer formatVersion, String packageType, String createdByAppVersion, Race race) {
      this(formatVersion, packageType, createdByAppVersion, race, null);
    }

    public int getFormatVersion() {
      return formatVersion;
    }

    public String getPackageType() {
      return packageType;
    }

    public String getCreatedByAppVersion() {
      return createdByAppVersion;
    }

    public Race getRace() {
      return race;
    }

    public void setRace(Race race) {
      this.race = race;
    }

    public CustomRotationExportImportHelper.CustomRotationPackage getCustomRotation() {
      return customRotation;
    }

    public void setCustomRotation(
        CustomRotationExportImportHelper.CustomRotationPackage customRotation) {
      this.customRotation = customRotation;
    }
  }

  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class ConflictResponse {
    @JsonProperty("conflict")
    private boolean conflict;

    @JsonProperty("existing_name")
    private String existingName;

    @JsonProperty("suggested_name")
    private String suggestedName;

    public ConflictResponse() {}

    public ConflictResponse(boolean conflict, String existingName, String suggestedName) {
      this.conflict = conflict;
      this.existingName = existingName;
      this.suggestedName = suggestedName;
    }

    public boolean isConflict() {
      return conflict;
    }

    public String getExistingName() {
      return existingName;
    }

    public String getSuggestedName() {
      return suggestedName;
    }
  }

  public RaceConfigExportImportHandler(
      DatabaseContext databaseContext, SqliteRepository<Race> raceRepository, Javalin app) {
    this(databaseContext, raceRepository, resolveAssetService(databaseContext), app);
  }

  public RaceConfigExportImportHandler(
      DatabaseContext databaseContext,
      SqliteRepository<Race> raceRepository,
      AssetService assetService,
      Javalin app) {
    this.raceRepository = raceRepository;
    this.assetService = assetService != null ? assetService : resolveAssetService(databaseContext);

    app.get("/api/races/{id}/export-config", this::exportConfig, Role.VIEWER);
    app.post("/api/races/import-config", this::importConfig, Role.DIRECTOR);
  }

  private static AssetService resolveAssetService(DatabaseContext databaseContext) {
    if (databaseContext == null) {
      return null;
    }
    String currentDbName = databaseContext.getCurrentDatabaseName();
    if (currentDbName == null || currentDbName.trim().isEmpty()) {
      currentDbName = "RaceCoordinator_AI_DB";
    }
    File assetsDir = new File(new File(databaseContext.getDataRoot(), currentDbName), "assets");
    return new AssetService(databaseContext, assetsDir.getAbsolutePath());
  }

  public void exportConfig(Context ctx) {
    String id = ctx.pathParam("id");
    Race race = raceRepository.findByEntityId(id);
    if (race == null) {
      ctx.status(404).result("Race configuration not found: " + id);
      return;
    }

    try {
      String appVersion = "1.1.0";
      try {
        appVersion = App.SERVER_VERSION;
      } catch (Throwable t) {
        // Fallback
      }

      CustomRotationExportImportHelper.CustomRotationPackage rotationPkg =
          CustomRotationExportImportHelper.resolveCustomRotationPackage(race, assetService);
      RaceConfigPackage pkg =
          new RaceConfigPackage(1, "RACE_CONFIG", appVersion, race, rotationPkg);
      String json = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(pkg);

      String rawName = race.getName() != null ? race.getName().trim() : "Race";
      String sanitized = rawName.replaceAll("[^a-zA-Z0-9_-]", "_");
      String filename = sanitized + ".rccfg.json";

      ctx.header("Content-Disposition", "attachment; filename=\"" + filename + "\"");
      ctx.contentType("application/json; charset=utf-8");
      ctx.result(json);
    } catch (Exception e) {
      logger.error("Error exporting race config", e);
      ctx.status(500).result("Error exporting race config: " + e.getMessage());
    }
  }

  public void importConfig(Context ctx) {
    try {
      String rawJson = extractJsonContent(ctx);
      if (rawJson == null || rawJson.trim().isEmpty()) {
        ctx.status(400).result("No configuration content provided");
        return;
      }

      Race incomingRace = parseIncomingRace(rawJson);
      if (incomingRace == null
          || incomingRace.getName() == null
          || incomingRace.getName().trim().isEmpty()) {
        ctx.status(400).result("Invalid race configuration: missing name");
        return;
      }

      CustomRotationExportImportHelper.CustomRotationPackage rotationPkg =
          parseIncomingRotation(rawJson);
      if (rotationPkg != null && assetService != null) {
        incomingRace =
            CustomRotationExportImportHelper.reconcileCustomRotation(
                incomingRace, rotationPkg, assetService);
      }

      String resolution = ctx.queryParam("resolution");
      if (resolution == null || resolution.trim().isEmpty()) {
        resolution = ctx.formParam("resolution");
      }
      String customName = ctx.queryParam("custom_name");
      if (customName == null || customName.trim().isEmpty()) {
        customName = ctx.formParam("custom_name");
      }

      List<Race> existingRaces = raceRepository.findAll();
      Set<String> existingNames = new HashSet<>();
      Race matchedExisting = null;

      String candName = incomingRace.getName().trim();
      for (Race r : existingRaces) {
        if (r.getName() != null) {
          existingNames.add(r.getName().trim());
          if (r.getName().trim().equalsIgnoreCase(candName)) {
            matchedExisting = r;
          }
        }
      }

      if (matchedExisting != null
          && !"OVERWRITE".equalsIgnoreCase(resolution)
          && !"AUTO_RENAME".equalsIgnoreCase(resolution)
          && (customName == null || customName.trim().isEmpty())) {
        String suggested = DriverImporter.generateUniqueName(candName, existingNames);
        ctx.status(409).json(new ConflictResponse(true, matchedExisting.getName(), suggested));
        return;
      }

      Race savedRace =
          processSave(incomingRace, matchedExisting, resolution, customName, existingNames);
      ctx.status(201).json(savedRace);
    } catch (IllegalArgumentException e) {
      ctx.status(400).result(e.getMessage());
    } catch (Exception e) {
      logger.error("Error importing race config", e);
      ctx.status(500).result("Error importing race config: " + e.getMessage());
    }
  }

  private String extractJsonContent(Context ctx) throws IOException {
    UploadedFile file = ctx.uploadedFile("file");
    if (file != null) {
      byte[] bytes = new byte[(int) file.getSize()];
      int read = file.getContent().read(bytes);
      return new String(bytes, 0, Math.max(0, read), StandardCharsets.UTF_8);
    }
    return ctx.body();
  }

  private Race parseIncomingRace(String rawJson) throws IOException {
    JsonNode node = objectMapper.readTree(rawJson);
    if (node.has("race") && node.get("race").isObject()) {
      return objectMapper.treeToValue(node.get("race"), Race.class);
    }
    return objectMapper.treeToValue(node, Race.class);
  }

  private CustomRotationExportImportHelper.CustomRotationPackage parseIncomingRotation(
      String rawJson) throws IOException {
    JsonNode node = objectMapper.readTree(rawJson);
    if (node.has("custom_rotation") && node.get("custom_rotation").isObject()) {
      return objectMapper.treeToValue(
          node.get("custom_rotation"),
          CustomRotationExportImportHelper.CustomRotationPackage.class);
    }
    return null;
  }

  private Race processSave(
      Race incoming,
      Race existing,
      String resolution,
      String customName,
      Set<String> existingNames) {
    if (existing != null && "OVERWRITE".equalsIgnoreCase(resolution)) {
      Race updated =
          new Race.Builder()
              .from(incoming)
              .withEntityId(existing.getEntityId())
              .withId(existing.getId())
              .withName(existing.getName())
              .build();
      raceRepository.replace(existing.getEntityId(), updated);
      return updated;
    }

    String finalName = incoming.getName().trim();
    if (customName != null && !customName.trim().isEmpty()) {
      finalName = customName.trim();
    } else if (existing != null
        || DriverImporter.containsCaseInsensitive(existingNames, finalName)) {
      finalName = DriverImporter.generateUniqueName(finalName, existingNames);
    }

    String newEntityId = UUID.randomUUID().toString();
    Race newRace =
        new Race.Builder()
            .from(incoming)
            .withEntityId(newEntityId)
            .withId(null)
            .withName(finalName)
            .build();
    raceRepository.save(newRace);
    return newRace;
  }
}
