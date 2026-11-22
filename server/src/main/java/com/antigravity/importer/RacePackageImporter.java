package com.antigravity.importer;

import com.antigravity.App;
import com.antigravity.context.DatabaseContext;
import com.antigravity.context.RaceScope;
import com.antigravity.importer.model.DriverImportMapping;
import com.antigravity.importer.model.DriverResolution;
import com.antigravity.importer.model.RacePackageCommitRequest;
import com.antigravity.importer.model.RacePackageManifest;
import com.antigravity.importer.model.RacePackagePreview;
import com.antigravity.importer.model.RacePackageResult;
import com.antigravity.models.AudioConfig;
import com.antigravity.models.Driver;
import com.antigravity.models.Race;
import com.antigravity.models.RaceHistoryRecord;
import com.antigravity.models.SeasonRaceRecord;
import com.antigravity.models.Team;
import com.antigravity.proto.AssetMessage;
import com.antigravity.race.DriverHeatData;
import com.antigravity.race.Heat;
import com.antigravity.race.RaceParticipant;
import com.antigravity.race.RaceSaveData;
import com.antigravity.repository.SqliteRepository;
import com.antigravity.service.AssetService;
import com.antigravity.service.DatabaseService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class RacePackageImporter {

  private static final Logger logger = LoggerFactory.getLogger(RacePackageImporter.class);
  private static final ObjectMapper objectMapper = new ObjectMapper();

  private final DatabaseContext databaseContext;
  private final AssetService assetService;
  private final SqliteRepository<Driver> driverRepository;
  private final SqliteRepository<RaceHistoryRecord> historyRepository;
  private final SqliteRepository<Race> raceRepository;
  private final SqliteRepository<Team> teamRepository;

  public static class ExtractedContent {
    private RacePackageManifest manifest;
    private RaceHistoryRecord historyRecord;
    private Race raceConfig;
    private CustomRotationExportImportHelper.CustomRotationPackage customRotation;
    private byte[] recordDataBytes;
    private RaceSaveData saveData;
    private List<Driver> drivers = new ArrayList<>();
    private List<Team> teams = new ArrayList<>();
    private final Map<String, byte[]> companionAssets = new LinkedHashMap<>();

    public RacePackageManifest getManifest() {
      return manifest;
    }

    public RaceHistoryRecord getHistoryRecord() {
      return historyRecord;
    }

    public Race getRaceConfig() {
      return raceConfig;
    }

    public CustomRotationExportImportHelper.CustomRotationPackage getCustomRotation() {
      return customRotation;
    }

    public byte[] getRecordDataBytes() {
      return recordDataBytes;
    }

    public RaceSaveData getSaveData() {
      return saveData;
    }

    public List<Driver> getDrivers() {
      return drivers;
    }

    public List<Team> getTeams() {
      return teams;
    }

    public Map<String, byte[]> getCompanionAssets() {
      return companionAssets;
    }
  }

  public static class ResolvedDrivers {
    private final Map<String, String> idMap = new HashMap<>();
    private final Map<String, String> nameMap = new HashMap<>();
    private final Map<String, String> assetLookup = new HashMap<>();
    private int createdCount;
    private int linkedCount;

    public Map<String, String> getIdMap() {
      return idMap;
    }

    public Map<String, String> getNameMap() {
      return nameMap;
    }

    public Map<String, String> getAssetLookup() {
      return assetLookup;
    }

    public int getCreatedCount() {
      return createdCount;
    }

    public int getLinkedCount() {
      return linkedCount;
    }
  }

  public RacePackageImporter(DatabaseContext databaseContext, AssetService assetService) {
    this(databaseContext, assetService, null, null, null, null);
  }

  public RacePackageImporter(
      DatabaseContext databaseContext,
      AssetService assetService,
      SqliteRepository<Driver> driverRepository,
      SqliteRepository<RaceHistoryRecord> historyRepository) {
    this(databaseContext, assetService, driverRepository, historyRepository, null, null);
  }

  public RacePackageImporter(
      DatabaseContext databaseContext,
      AssetService assetService,
      SqliteRepository<Driver> driverRepository,
      SqliteRepository<RaceHistoryRecord> historyRepository,
      SqliteRepository<Race> raceRepository) {
    this(databaseContext, assetService, driverRepository, historyRepository, raceRepository, null);
  }

  public RacePackageImporter(
      DatabaseContext databaseContext,
      AssetService assetService,
      SqliteRepository<Driver> driverRepository,
      SqliteRepository<RaceHistoryRecord> historyRepository,
      SqliteRepository<Race> raceRepository,
      SqliteRepository<Team> teamRepository) {
    this.databaseContext = databaseContext;
    this.assetService = assetService;
    this.driverRepository =
        driverRepository != null
            ? driverRepository
            : new SqliteRepository<>(databaseContext, "drivers", Driver.class);
    this.historyRepository =
        historyRepository != null
            ? historyRepository
            : new SqliteRepository<>(databaseContext, "race_history", RaceHistoryRecord.class);
    this.raceRepository =
        raceRepository != null
            ? raceRepository
            : new SqliteRepository<>(databaseContext, "races", Race.class);
    this.teamRepository =
        teamRepository != null
            ? teamRepository
            : new SqliteRepository<>(databaseContext, "teams", Team.class);
  }

  public RacePackagePreview previewPackage(InputStream zipStream) throws IOException {
    if (zipStream == null) {
      throw new IllegalArgumentException("Package stream cannot be null");
    }

    byte[] zipBytes = readAllBytes(zipStream);
    ExtractedContent content = extractZipContent(new ByteArrayInputStream(zipBytes));

    if (content.getManifest() == null) {
      throw new IllegalArgumentException("Package does not contain a valid manifest.json");
    }

    validateAppVersion(content.getManifest());

    // Check duplicate race
    DuplicateInfo dup = detectDuplicateRace(content.getManifest());

    // Check race configuration conflict
    ConfigConflictInfo configConflict =
        detectConfigConflict(content.getRaceConfig(), content.getManifest());

    // Build driver mappings
    List<DriverImportMapping> mappings = buildDriverMappings(content.getDrivers());

    // Build team mappings
    List<DriverImportMapping> teamMappings =
        TeamExportImportHelper.buildTeamImportMappings(content.getTeams(), teamRepository);
    mappings.addAll(teamMappings);

    // Cache package to temp file
    String token = UUID.randomUUID().toString();
    saveTempPackage(token, zipBytes);

    return new RacePackagePreview(
        content.getManifest(),
        dup.isDuplicate(),
        dup.getRaceId(),
        dup.getRaceName(),
        configConflict.isConflict(),
        configConflict.getExistingName(),
        configConflict.getSuggestedName(),
        mappings,
        token);
  }

  public RacePackageResult commitPackage(RacePackageCommitRequest request) throws IOException {
    return commitPackage(null, request);
  }

  public RacePackageResult commitPackage(
      InputStream optionalZipStream, RacePackageCommitRequest request) throws IOException {
    if (request == null) {
      throw new IllegalArgumentException("Commit request cannot be null");
    }

    byte[] zipBytes = resolveZipBytes(optionalZipStream, request.getTempPackageToken());
    ExtractedContent content = extractZipContent(new ByteArrayInputStream(zipBytes));

    if (content.getManifest() == null || content.getHistoryRecord() == null) {
      throw new IllegalArgumentException("Corrupt package: missing manifest or race history data");
    }

    DuplicateInfo dup = detectDuplicateRace(content.getManifest());
    if ("SKIP".equalsIgnoreCase(request.getDuplicateAction())) {
      cleanupTempPackage(request.getTempPackageToken());
      return new RacePackageResult(
          true,
          dup.getRaceId(),
          content.getManifest().getRaceName(),
          content.getDrivers().size(),
          0,
          0,
          null,
          null,
          null,
          "SKIPPED",
          "Skipped race package import",
          "SKIPPED");
    }

    String unifiedRaceName = resolveUnifiedRaceName(request, content.getManifest());

    ResolvedDrivers resolved =
        resolveDrivers(
            content.getDrivers(), request.getDriverResolutions(), content.getCompanionAssets());

    TeamExportImportHelper.ResolvedTeams resolvedTeams =
        TeamExportImportHelper.resolveTeams(
            content.getTeams(),
            resolved.getIdMap(),
            request.getDriverResolutions(),
            teamRepository,
            resolved.getAssetLookup());

    // Resolve target race ID
    String targetRaceId =
        (dup.isDuplicate()
                && "OVERWRITE".equalsIgnoreCase(request.getDuplicateAction())
                && dup.getRaceId() != null)
            ? dup.getRaceId()
            : UUID.randomUUID().toString();

    // Reconcile and persist race configuration
    Race incomingConfig = content.getRaceConfig();
    if (incomingConfig == null && content.getHistoryRecord() != null) {
      incomingConfig = content.getHistoryRecord().getModel();
    }
    ResolvedRaceConfig resolvedConfig =
        reconcileRaceConfig(
            incomingConfig,
            content.getCustomRotation(),
            request.getConfigAction(),
            unifiedRaceName,
            content.getManifest());

    // Remap and persist race history
    String effectiveRaceName =
        (resolvedConfig != null && resolvedConfig.getConfigName() != null)
            ? resolvedConfig.getConfigName()
            : unifiedRaceName;

    saveImportedHistory(
        content,
        targetRaceId,
        effectiveRaceName,
        resolvedConfig,
        resolved,
        resolvedTeams.getResolvedMap());
    RaceHistoryRecord history = content.getHistoryRecord();

    // Persist raw race records and saved data
    persistRaceDataPayloads(
        content, targetRaceId, history, resolved, resolvedTeams.getResolvedMap());

    // Update global and driver statistics
    updateStatistics(history);

    // Commit to season if requested
    String committedSeasonId = null;
    if (request.getSeasonId() != null && !request.getSeasonId().trim().isEmpty()) {
      committedSeasonId = request.getSeasonId().trim();
      boolean isOverwrite =
          dup.isDuplicate() && "OVERWRITE".equalsIgnoreCase(request.getDuplicateAction());
      commitToSeason(committedSeasonId, history, targetRaceId, isOverwrite);
    }

    cleanupTempPackage(request.getTempPackageToken());

    String action =
        (dup.isDuplicate() && "OVERWRITE".equalsIgnoreCase(request.getDuplicateAction()))
            ? "OVERWRITTEN"
            : "IMPORTED";
    int totalCount =
        content.getDrivers().size() + (content.getTeams() != null ? content.getTeams().size() : 0);
    int totalCreated = resolved.getCreatedCount() + resolvedTeams.getCreatedCount();
    int totalLinked = resolved.getLinkedCount() + resolvedTeams.getLinkedCount();
    return new RacePackageResult(
        true,
        targetRaceId,
        effectiveRaceName,
        totalCount,
        totalCreated,
        totalLinked,
        committedSeasonId,
        resolvedConfig != null ? resolvedConfig.getConfigId() : null,
        resolvedConfig != null ? resolvedConfig.getConfigName() : null,
        resolvedConfig != null ? resolvedConfig.getAction() : "SKIPPED",
        "Race package imported successfully",
        action);
  }

  private String resolveUnifiedRaceName(
      RacePackageCommitRequest request, RacePackageManifest manifest) {
    String name = request.getRaceName();
    if (name == null || name.trim().isEmpty()) {
      name = manifest != null ? manifest.getRaceName() : null;
    }
    if (name == null || name.trim().isEmpty()) {
      name = "Imported Race";
    }
    return name.trim();
  }

  private void saveImportedHistory(
      ExtractedContent content,
      String targetRaceId,
      String effectiveRaceName,
      ResolvedRaceConfig resolvedConfig,
      ResolvedDrivers resolved,
      Map<String, Team> resolvedTeams) {
    RaceHistoryRecord history = content.getHistoryRecord();
    if (history.getModel() != null) {
      history.setModel(
          new Race.Builder().from(history.getModel()).withName(effectiveRaceName).build());
    }
    if (resolvedConfig != null && resolvedConfig.getRace() != null) {
      history.setModel(resolvedConfig.getRace());
      history.setOriginalEntityId(resolvedConfig.getConfigId());
    }
    if (content.getManifest() != null) {
      history.setSourceRaceId(content.getManifest().getRaceId());
      history.setPackageFingerprint(content.getManifest().getFingerprint());
    }
    remapHistoryRecord(
        history, targetRaceId, resolved.getIdMap(), resolved.getNameMap(), resolvedTeams);
    historyRepository.save(history);
  }

  private void persistRaceDataPayloads(
      ExtractedContent content,
      String targetRaceId,
      RaceHistoryRecord history,
      ResolvedDrivers resolved,
      Map<String, Team> resolvedTeams) {
    if (content.getRecordDataBytes() != null && content.getRecordDataBytes().length > 0) {
      DatabaseService.getInstance()
          .saveRaceRecords(
              databaseContext, targetRaceId, content.getRecordDataBytes(), history.isDemo());
    }

    if (content.getSaveData() != null) {
      RaceSaveData saveData = content.getSaveData();
      remapSaveData(saveData, resolved.getIdMap(), resolved.getNameMap(), resolvedTeams);
      DatabaseService.getInstance().saveManualRace(databaseContext, saveData);
    }
  }

  private byte[] resolveZipBytes(InputStream stream, String token) throws IOException {
    if (stream != null) {
      return readAllBytes(stream);
    }
    if (token == null || token.trim().isEmpty()) {
      throw new IllegalArgumentException("No package stream or package token provided");
    }
    Path tempFile = getTempPackagePath(token);
    if (!Files.exists(tempFile)) {
      throw new IllegalArgumentException(
          "Package session expired or file not found. Please upload again.");
    }
    return Files.readAllBytes(tempFile);
  }

  private void validateAppVersion(RacePackageManifest manifest) {
    String minVersion = manifest.getMinCompatibleAppVersion();
    String currentVersion = App.SERVER_VERSION;
    if (currentVersion != null
        && (currentVersion.contains("dev")
            || currentVersion.contains("SNAPSHOT")
            || currentVersion.startsWith("0.0.0"))) {
      return;
    }
    if (minVersion != null && isVersionGreater(minVersion, currentVersion)) {
      throw new IllegalArgumentException(
          "Package requires Race Coordinator AI version "
              + minVersion
              + " or higher, but this server is running "
              + currentVersion);
    }
  }

  public static boolean isVersionGreater(String v1, String v2) {
    if (v1 == null || v2 == null) return false;
    String[] p1 = v1.replaceAll("[^0-9.]", "").split("\\.");
    String[] p2 = v2.replaceAll("[^0-9.]", "").split("\\.");
    int len = Math.max(p1.length, p2.length);
    for (int i = 0; i < len; i++) {
      int num1 = i < p1.length && !p1[i].isEmpty() ? Integer.parseInt(p1[i]) : 0;
      int num2 = i < p2.length && !p2[i].isEmpty() ? Integer.parseInt(p2[i]) : 0;
      if (num1 > num2) return true;
      if (num1 < num2) return false;
    }
    return false;
  }

  private DuplicateInfo detectDuplicateRace(RacePackageManifest manifest) {
    if (manifest == null) {
      return new DuplicateInfo(false, null, null);
    }
    DatabaseService dbService = DatabaseService.getInstance();
    List<RaceHistoryRecord> localHistory =
        dbService.getRaceHistory(databaseContext, RaceScope.PRODUCTION);
    if (localHistory == null || localHistory.isEmpty()) {
      return new DuplicateInfo(false, null, null);
    }

    String packageFingerprint = manifest.getFingerprint();
    String sourceRaceId = manifest.getRaceId();
    long start = manifest.getStartTime() != null ? manifest.getStartTime() : 0L;
    int heatCount = manifest.getHeatCount();
    int driverCount = manifest.getDriverCount();
    String name = manifest.getRaceName();

    for (RaceHistoryRecord rec : localHistory) {
      String localName = rec.getModel() != null ? rec.getModel().getName() : "";
      long localStart = rec.getTimestamp() != null ? rec.getTimestamp() : 0L;
      int localHeatCount = rec.getHeats() != null ? rec.getHeats().size() : 0;
      int localDriverCount = rec.getDrivers() != null ? rec.getDrivers().size() : 0;

      // 1. Direct Source Race ID match (matching original session ID or stored source race ID)
      if (sourceRaceId != null && !sourceRaceId.isEmpty()) {
        if (sourceRaceId.equals(rec.getId()) || sourceRaceId.equals(rec.getSourceRaceId())) {
          return new DuplicateInfo(true, rec.getId(), localName);
        }
      }

      // 2. Persistent package fingerprint match
      if (packageFingerprint != null && !packageFingerprint.isEmpty()) {
        if (packageFingerprint.equalsIgnoreCase(rec.getPackageFingerprint())) {
          return new DuplicateInfo(true, rec.getId(), localName);
        }
      }

      // 3. Invariant session metrics match (start time within 2 seconds + same heat count + same
      // driver count)
      if (start > 0 && localStart > 0 && Math.abs(start - localStart) < 2000) {
        if (heatCount == localHeatCount && driverCount == localDriverCount) {
          return new DuplicateInfo(true, rec.getId(), localName);
        }
      }

      // 4. Invariant fingerprint calculation match
      if (packageFingerprint != null && !packageFingerprint.isEmpty()) {
        String invariantFp =
            RacePackageExporter.calculatePackageFingerprint(
                localStart, localHeatCount, localDriverCount, rec.getAccumulatedRaceTime());
        if (packageFingerprint.equalsIgnoreCase(invariantFp)) {
          return new DuplicateInfo(true, rec.getId(), localName);
        }

        // 5. Legacy fingerprint match (with localName or manifest name)
        List<String> dNames = extractDriverNames(rec);
        String legacyFpLocal =
            RacePackageExporter.calculateLegacyPackageFingerprint(localName, localStart, dNames);
        if (packageFingerprint.equalsIgnoreCase(legacyFpLocal)) {
          return new DuplicateInfo(true, rec.getId(), localName);
        }
        if (name != null) {
          String legacyFpManifest =
              RacePackageExporter.calculateLegacyPackageFingerprint(name, localStart, dNames);
          if (packageFingerprint.equalsIgnoreCase(legacyFpManifest)) {
            return new DuplicateInfo(true, rec.getId(), localName);
          }
        }
      }

      // 6. Fallback name and timestamp match within 60 seconds
      if (name != null
          && name.equalsIgnoreCase(localName)
          && start > 0
          && localStart > 0
          && Math.abs(start - localStart) < 60000) {
        return new DuplicateInfo(true, rec.getId(), localName);
      }
    }
    return new DuplicateInfo(false, null, null);
  }

  private List<String> extractDriverNames(RaceHistoryRecord rec) {
    List<String> dNames = new ArrayList<>();
    if (rec.getDrivers() != null) {
      for (RaceParticipant rp : rec.getDrivers()) {
        if (rp.getDriver() != null && rp.getDriver().getName() != null) {
          dNames.add(rp.getDriver().getName());
        }
      }
    }
    return dNames;
  }

  private ConfigConflictInfo detectConfigConflict(Race raceConfig, RacePackageManifest manifest) {
    if (raceRepository == null) {
      return new ConfigConflictInfo(false, null, null);
    }
    String candName = null;
    if (raceConfig != null
        && raceConfig.getName() != null
        && !raceConfig.getName().trim().isEmpty()) {
      candName = raceConfig.getName().trim();
    } else if (manifest != null
        && manifest.getRaceName() != null
        && !manifest.getRaceName().trim().isEmpty()) {
      candName = manifest.getRaceName().trim();
    }
    if (candName == null) {
      return new ConfigConflictInfo(false, null, null);
    }

    List<Race> existingRaces = raceRepository.findAll();
    if (existingRaces == null || existingRaces.isEmpty()) {
      return new ConfigConflictInfo(false, null, null);
    }

    Set<String> existingNames = new HashSet<>();
    Race matchedExisting = null;
    for (Race r : existingRaces) {
      if (r.getName() != null) {
        existingNames.add(r.getName().trim());
        if (r.getName().trim().equalsIgnoreCase(candName)) {
          matchedExisting = r;
        }
      }
    }

    if (matchedExisting != null) {
      String suggested = DriverImporter.generateUniqueName(candName, existingNames);
      return new ConfigConflictInfo(true, matchedExisting.getName(), suggested);
    }
    return new ConfigConflictInfo(false, null, null);
  }

  private ResolvedRaceConfig reconcileRaceConfig(
      Race incomingConfig,
      CustomRotationExportImportHelper.CustomRotationPackage incomingRotation,
      String configAction,
      String customConfigName,
      RacePackageManifest manifest) {
    if (raceRepository == null) {
      return new ResolvedRaceConfig(null, null, "NONE", incomingConfig);
    }

    Race candidate = incomingConfig;
    if (candidate == null && manifest != null && manifest.getRaceName() != null) {
      candidate = new Race.Builder().withName(manifest.getRaceName().trim()).build();
    }
    if (candidate == null || candidate.getName() == null || candidate.getName().trim().isEmpty()) {
      return new ResolvedRaceConfig(null, null, "NONE", incomingConfig);
    }

    if (incomingRotation != null && assetService != null) {
      candidate =
          CustomRotationExportImportHelper.reconcileCustomRotation(
              candidate, incomingRotation, assetService);
    }

    String candName = candidate.getName().trim();
    List<Race> existingRaces = raceRepository.findAll();
    Set<String> existingNames = new HashSet<>();
    Race matchedExisting = null;

    if (existingRaces != null) {
      for (Race r : existingRaces) {
        if (r.getName() != null) {
          existingNames.add(r.getName().trim());
          if (r.getName().trim().equalsIgnoreCase(candName)) {
            matchedExisting = r;
          }
        }
      }
    }

    String action =
        configAction != null ? configAction.trim().toUpperCase(Locale.ROOT) : "CREATE_NEW";

    if ("SKIP".equals(action)) {
      String existingId = matchedExisting != null ? matchedExisting.getEntityId() : null;
      String existingName = matchedExisting != null ? matchedExisting.getName() : null;
      return new ResolvedRaceConfig(existingId, existingName, "SKIPPED", candidate);
    }

    if ("USE_EXISTING".equals(action)) {
      if (matchedExisting != null) {
        return new ResolvedRaceConfig(
            matchedExisting.getEntityId(),
            matchedExisting.getName(),
            "USE_EXISTING",
            matchedExisting);
      }
      return new ResolvedRaceConfig(null, null, "USE_EXISTING", candidate);
    }

    if (matchedExisting != null && "OVERWRITE".equals(action)) {
      Race updated =
          new Race.Builder()
              .from(candidate)
              .withEntityId(matchedExisting.getEntityId())
              .withId(matchedExisting.getId())
              .withName(candName)
              .build();
      raceRepository.replace(matchedExisting.getEntityId(), updated);
      return new ResolvedRaceConfig(updated.getEntityId(), updated.getName(), "OVERWRITE", updated);
    }

    // CREATE_NEW, AUTO_RENAME or no conflict
    String finalName = candName;
    if (customConfigName != null && !customConfigName.trim().isEmpty()) {
      finalName = customConfigName.trim();
      if (DriverImporter.containsCaseInsensitive(existingNames, finalName)) {
        finalName = DriverImporter.generateUniqueName(finalName, existingNames);
      }
    } else if (matchedExisting != null
        || DriverImporter.containsCaseInsensitive(existingNames, finalName)) {
      finalName = DriverImporter.generateUniqueName(finalName, existingNames);
    }

    String newEntityId = UUID.randomUUID().toString();
    Race newRace =
        new Race.Builder()
            .from(candidate)
            .withEntityId(newEntityId)
            .withId(null)
            .withName(finalName)
            .build();
    raceRepository.save(newRace);

    String resultAction =
        (matchedExisting != null || !finalName.equalsIgnoreCase(candName))
            ? "AUTO_RENAME"
            : "CREATED";
    return new ResolvedRaceConfig(newRace.getEntityId(), newRace.getName(), resultAction, newRace);
  }

  private List<DriverImportMapping> buildDriverMappings(List<Driver> packageDrivers) {
    List<DriverImportMapping> mappings = new ArrayList<>();
    if (packageDrivers == null) return mappings;

    List<Driver> localDrivers = driverRepository.findAll();
    Map<String, Driver> byName = new HashMap<>();
    Map<String, Driver> byNickname = new HashMap<>();

    for (Driver ld : localDrivers) {
      if (ld.getName() != null) {
        byName.put(ld.getName().trim().toLowerCase(Locale.ROOT), ld);
      }
      if (ld.getNickname() != null && !ld.getNickname().trim().isEmpty()) {
        byNickname.put(ld.getNickname().trim().toLowerCase(Locale.ROOT), ld);
      }
    }

    for (Driver pd : packageDrivers) {
      String pName = pd.getName() != null ? pd.getName().trim() : "";
      String pNick = pd.getNickname() != null ? pd.getNickname().trim() : "";

      Driver matched = byName.get(pName.toLowerCase(Locale.ROOT));
      String matchType = "NONE";
      if (matched != null) {
        matchType = "EXACT_NAME";
      } else if (!pNick.isEmpty() && byNickname.containsKey(pNick.toLowerCase(Locale.ROOT))) {
        matched = byNickname.get(pNick.toLowerCase(Locale.ROOT));
        matchType = "EXACT_NICKNAME";
      }

      if (matched != null) {
        mappings.add(
            new DriverImportMapping(
                pd.getEntityId(),
                pName,
                pNick,
                matched.getEntityId(),
                matched.getName(),
                matchType,
                "LINK"));
      } else {
        mappings.add(
            new DriverImportMapping(
                pd.getEntityId(), pName, pNick, null, null, "NONE", "CREATE_NEW"));
      }
    }
    return mappings;
  }

  private ResolvedDrivers resolveDrivers(
      List<Driver> packageDrivers,
      List<DriverResolution> resolutions,
      Map<String, byte[]> companionAssets) {

    ResolvedDrivers res = new ResolvedDrivers();
    Map<String, DriverResolution> resMap = new HashMap<>();
    if (resolutions != null) {
      for (DriverResolution r : resolutions) {
        if (r.getSourceDriverId() != null) {
          resMap.put(r.getSourceDriverId(), r);
        }
      }
    }

    Map<String, String> uploadedAssetLookup = new HashMap<>();
    if (assetService != null && companionAssets != null && !companionAssets.isEmpty()) {
      ingestCompanionAssets(companionAssets, uploadedAssetLookup);
    }
    res.getAssetLookup().putAll(uploadedAssetLookup);

    for (Driver pd : packageDrivers) {
      DriverResolution resolution = resMap.get(pd.getEntityId());
      if (resolution != null
          && "LINK".equalsIgnoreCase(resolution.getAction())
          && resolution.getTargetDriverId() != null) {
        Driver target = driverRepository.findByEntityId(resolution.getTargetDriverId());
        String targetName = target != null ? target.getName() : pd.getName();
        res.getIdMap().put(pd.getEntityId(), resolution.getTargetDriverId());
        res.getNameMap().put(pd.getEntityId(), targetName);
        res.linkedCount++;
      } else {
        // CREATE_NEW
        String newId = UUID.randomUUID().toString();
        String newName =
            (resolution != null
                    && resolution.getNewDriverName() != null
                    && !resolution.getNewDriverName().trim().isEmpty())
                ? resolution.getNewDriverName().trim()
                : pd.getName();

        Driver newDriver = Driver.Builder.from(pd).withEntityId(newId).withName(newName).build();

        newDriver = updateDriverAssetUrls(newDriver, uploadedAssetLookup);
        driverRepository.save(newDriver);

        res.getIdMap().put(pd.getEntityId(), newId);
        res.getNameMap().put(pd.getEntityId(), newName);
        res.createdCount++;
      }
    }
    return res;
  }

  private void ingestCompanionAssets(
      Map<String, byte[]> assets, Map<String, String> uploadedLookup) {
    for (Map.Entry<String, byte[]> entry : assets.entrySet()) {
      String key = entry.getKey();
      byte[] data = entry.getValue();
      if (data == null || data.length == 0) continue;

      String simpleName = new File(key).getName();
      String lower = simpleName.toLowerCase(Locale.ROOT);
      String type =
          (lower.endsWith(".wav") || lower.endsWith(".mp3") || lower.endsWith(".ogg"))
              ? "sound"
              : "image";

      try {
        AssetMessage asset = assetService.saveAsset(simpleName, type, data);
        if (asset != null && asset.getUrl() != null) {
          uploadedLookup.put(key.toLowerCase(Locale.ROOT), asset.getUrl());
          uploadedLookup.put(simpleName.toLowerCase(Locale.ROOT), asset.getUrl());
        }
      } catch (Exception e) {
        logger.warn("Failed to ingest companion asset: {}", key, e);
      }
    }
  }

  private Driver updateDriverAssetUrls(Driver driver, Map<String, String> assetLookup) {
    if (assetLookup == null || assetLookup.isEmpty()) return driver;

    Driver.Builder b = Driver.Builder.from(driver);

    if (driver.getAvatarUrl() != null) {
      String simple = new File(driver.getAvatarUrl()).getName().toLowerCase(Locale.ROOT);
      if (assetLookup.containsKey(simple)) {
        b.withAvatarUrl(assetLookup.get(simple));
      }
    }

    b.withLapAudio(updateAudioUrl(driver.getLapAudio(), assetLookup));
    b.withBestLapAudio(updateAudioUrl(driver.getBestLapAudio(), assetLookup));
    b.withPenaltyAudio(updateAudioUrl(driver.getPenaltyAudio(), assetLookup));
    b.withRaceBestLapAudio(updateAudioUrl(driver.getRaceBestLapAudio(), assetLookup));
    b.withRaceLaneBestLapAudio(updateAudioUrl(driver.getRaceLaneBestLapAudio(), assetLookup));
    b.withHeatBestLapAudio(updateAudioUrl(driver.getHeatBestLapAudio(), assetLookup));
    b.withNewRaceLeaderAudio(updateAudioUrl(driver.getNewRaceLeaderAudio(), assetLookup));
    b.withNewHeatLeaderAudio(updateAudioUrl(driver.getNewHeatLeaderAudio(), assetLookup));
    b.withOverallBestLapAudio(updateAudioUrl(driver.getOverallBestLapAudio(), assetLookup));
    b.withOverallLaneBestLapAudio(updateAudioUrl(driver.getOverallLaneBestLapAudio(), assetLookup));
    b.withPitInAudio(updateAudioUrl(driver.getPitInAudio(), assetLookup));
    b.withFuelAudio(updateAudioUrl(driver.getFuelAudio(), assetLookup));
    b.withDriftLapAudio(updateAudioUrl(driver.getDriftLapAudio(), assetLookup));

    return b.build();
  }

  private AudioConfig updateAudioUrl(AudioConfig config, Map<String, String> assetLookup) {
    if (config == null || config.getUrl() == null) return config;
    String simple = new File(config.getUrl()).getName().toLowerCase(Locale.ROOT);
    if (assetLookup.containsKey(simple)) {
      return new AudioConfig(config.getType(), assetLookup.get(simple), config.getText());
    }
    return config;
  }

  private void remapHistoryRecord(
      RaceHistoryRecord record,
      String targetRaceId,
      Map<String, String> idMap,
      Map<String, String> nameMap,
      Map<String, Team> resolvedTeams) {

    record.setId(targetRaceId);
    remapParticipants(record.getDrivers(), idMap, nameMap, resolvedTeams);
    remapHeats(record.getHeats(), idMap, nameMap, resolvedTeams);
    record.setDriverResults(
        remapDriverResults(record.getDriverResults(), idMap, nameMap, resolvedTeams));
  }

  private void remapParticipants(
      List<RaceParticipant> participants,
      Map<String, String> idMap,
      Map<String, String> nameMap,
      Map<String, Team> resolvedTeams) {
    if (participants == null) return;
    for (RaceParticipant rp : participants) {
      if (rp.isTeamParticipant()
          || rp.getTeam() != null
          || (rp.getObjectId() != null && rp.getObjectId().startsWith("t_"))) {
        TeamExportImportHelper.remapParticipantTeam(rp, resolvedTeams, idMap, nameMap);
      } else {
        remapIndividualParticipant(rp, idMap, nameMap);
      }
    }
  }

  private void remapIndividualParticipant(
      RaceParticipant rp, Map<String, String> idMap, Map<String, String> nameMap) {
    String srcId = rp.getDriver() != null ? rp.getDriver().getEntityId() : rp.getObjectId();
    if (srcId != null && idMap.containsKey(srcId)) {
      String newId = idMap.get(srcId);
      String newName = nameMap.get(srcId);
      rp.setObjectId(newId);
      if (rp.getDriver() != null) {
        Driver updated =
            Driver.Builder.from(rp.getDriver())
                .withEntityId(newId)
                .withName(newName != null ? newName : rp.getDriver().getName())
                .build();
        rp.setDriver(updated);
      }
    }
  }

  private void remapHeats(
      List<Heat> heats,
      Map<String, String> idMap,
      Map<String, String> nameMap,
      Map<String, Team> resolvedTeams) {
    if (heats == null) return;
    for (Heat heat : heats) {
      if (heat.getDrivers() != null) {
        for (DriverHeatData dhd : heat.getDrivers()) {
          if (dhd != null) {
            remapHeatDriverData(dhd, idMap, nameMap, resolvedTeams);
          }
        }
      }
    }
  }

  private void remapHeatDriverData(
      DriverHeatData dhd,
      Map<String, String> idMap,
      Map<String, String> nameMap,
      Map<String, Team> resolvedTeams) {
    if (dhd.getActualDriver() != null && dhd.getActualDriver().getEntityId() != null) {
      String actId = dhd.getActualDriver().getEntityId();
      if (idMap.containsKey(actId)) {
        String newActId = idMap.get(actId);
        String newActName = nameMap.get(actId);
        dhd.setActualDriver(
            Driver.Builder.from(dhd.getActualDriver())
                .withEntityId(newActId)
                .withName(newActName != null ? newActName : dhd.getActualDriver().getName())
                .build());
      }
    }

    if (dhd.getDriver() != null) {
      RaceParticipant rp = dhd.getDriver();
      if (rp.isTeamParticipant()
          || rp.getTeam() != null
          || (rp.getObjectId() != null && rp.getObjectId().startsWith("t_"))) {
        TeamExportImportHelper.remapParticipantTeam(rp, resolvedTeams, idMap, nameMap);
      } else {
        remapIndividualParticipant(rp, idMap, nameMap);
      }
    }
  }

  private List<SeasonRaceRecord.SeasonDriverResult> remapDriverResults(
      List<SeasonRaceRecord.SeasonDriverResult> results,
      Map<String, String> idMap,
      Map<String, String> nameMap,
      Map<String, Team> resolvedTeams) {
    if (results == null) return null;
    List<SeasonRaceRecord.SeasonDriverResult> updatedResults = new ArrayList<>();
    for (SeasonRaceRecord.SeasonDriverResult sdr : results) {
      if (sdr != null) {
        String sdrId = sdr.getDriverId();
        String newId = sdrId;
        String newName = sdr.getDriverName();

        if (resolvedTeams != null && sdrId != null) {
          String teamKey = sdrId.startsWith("t_") ? sdrId.substring(2) : sdrId;
          Team t = resolvedTeams.get(teamKey);
          if (t == null) {
            t = resolvedTeams.get(sdrId);
          }
          if (t != null) {
            newId = "t_" + t.getEntityId();
            newName = t.getName();
          }
        }
        if (newId.equals(sdrId) && idMap.containsKey(sdrId)) {
          newId = idMap.get(sdrId);
          newName = nameMap.get(sdrId);
        }

        updatedResults.add(
            new SeasonRaceRecord.SeasonDriverResult(
                newId,
                newName != null ? newName : sdr.getDriverName(),
                sdr.getOverallRank(),
                sdr.getOverallPoints(),
                sdr.getOverallBonusPoints(),
                sdr.getOverallBonusBreakdown(),
                sdr.getHeatPoints(),
                sdr.getHeatBonusPoints(),
                sdr.getHeatBonusBreakdown(),
                sdr.getTotalPoints()));
      }
    }
    return updatedResults;
  }

  private void remapSaveData(
      RaceSaveData saveData,
      Map<String, String> idMap,
      Map<String, String> nameMap,
      Map<String, Team> resolvedTeams) {
    remapParticipants(saveData.getDrivers(), idMap, nameMap, resolvedTeams);
  }

  private void updateStatistics(RaceHistoryRecord history) {
    try {
      DatabaseService dbService = DatabaseService.getInstance();
      com.antigravity.race.Race runtime = // fqn-collision
          dbService.buildRuntimeRaceFromHistory(databaseContext, history);
      if (runtime != null) {
        dbService.updateGlobalStatistics(databaseContext, runtime);
        dbService.saveDriverStatistics(databaseContext, runtime);
        dbService.updateDriverTrackStats(databaseContext, runtime, history.isDemo());
      }
    } catch (Exception e) {
      logger.error("Failed to update statistics for imported race: {}", history.getId(), e);
    }
  }

  private void commitToSeason(
      String seasonId, RaceHistoryRecord history, String targetRaceId, boolean isOverwrite) {
    try {
      DatabaseService dbService = DatabaseService.getInstance();
      String raceName = history.getModel() != null ? history.getModel().getName() : "Imported Race";
      long timestamp =
          history.getTimestamp() != null ? history.getTimestamp() : System.currentTimeMillis();

      if (isOverwrite) {
        dbService.updateSeasonRaceResults(
            databaseContext,
            seasonId,
            targetRaceId,
            timestamp,
            raceName,
            history.isDemo(),
            history.getDriverResults());
      } else {
        dbService.commitRaceToSeason(
            databaseContext,
            seasonId,
            raceName,
            timestamp,
            history.isDemo(),
            history.getDriverResults(),
            targetRaceId);
      }
    } catch (Exception e) {
      logger.error("Failed to commit imported race to season {}", seasonId, e);
    }
  }

  public ExtractedContent extractZipContent(InputStream zipStream) throws IOException {
    ExtractedContent content = new ExtractedContent();
    byte[] driversJsonBytes = readZipEntries(zipStream, content);

    if (driversJsonBytes != null) {
      content.drivers = parseDriversJson(driversJsonBytes, content.historyRecord);
    }

    if ((content.teams == null || content.teams.isEmpty()) && content.historyRecord != null) {
      content.teams =
          TeamExportImportHelper.collectTeamsAndMemberDrivers(
              content.historyRecord, teamRepository, driverRepository, content.drivers);
    }

    populateFallbackDrivers(content);

    if (content.raceConfig == null
        && content.historyRecord != null
        && content.historyRecord.getModel() != null) {
      content.raceConfig = content.historyRecord.getModel();
    }
    return content;
  }

  private byte[] readZipEntries(InputStream zipStream, ExtractedContent content)
      throws IOException {
    byte[] driversJsonBytes = null;
    try (ZipInputStream zis = new ZipInputStream(zipStream)) {
      ZipEntry entry;
      while ((entry = zis.getNextEntry()) != null) {
        String name = entry.getName();
        if (name.equalsIgnoreCase("manifest.json")) {
          content.manifest = objectMapper.readValue(readEntryBytes(zis), RacePackageManifest.class);
        } else if (name.equalsIgnoreCase("race_history.json")) {
          content.historyRecord =
              objectMapper.readValue(readEntryBytes(zis), RaceHistoryRecord.class);
        } else if (name.equalsIgnoreCase("race_config.json")) {
          content.raceConfig = objectMapper.readValue(readEntryBytes(zis), Race.class);
        } else if (name.equalsIgnoreCase("custom_rotation.json")) {
          content.customRotation =
              objectMapper.readValue(
                  readEntryBytes(zis),
                  CustomRotationExportImportHelper.CustomRotationPackage.class);
        } else if (name.equalsIgnoreCase("teams.json")) {
          content.teams =
              objectMapper.readValue(readEntryBytes(zis), new TypeReference<List<Team>>() {});
        } else if (name.equalsIgnoreCase("race_records.pb")) {
          content.recordDataBytes = readEntryBytes(zis);
        } else if (name.equalsIgnoreCase("saved_race.json")) {
          content.saveData = objectMapper.readValue(readEntryBytes(zis), RaceSaveData.class);
        } else if (name.equalsIgnoreCase("drivers.json")) {
          driversJsonBytes = readEntryBytes(zis);
        } else if (name.startsWith("images/") || name.startsWith("audio/")) {
          content.companionAssets.put(name, readEntryBytes(zis));
        }
        zis.closeEntry();
      }
    }
    return driversJsonBytes;
  }

  private void populateFallbackDrivers(ExtractedContent content) {
    if (content.historyRecord == null) {
      return;
    }
    Map<String, Driver> driverMap = new LinkedHashMap<>();
    Set<String> driverNames = new HashSet<>();
    for (Driver d : content.drivers) {
      if (d.getEntityId() != null && !d.getEntityId().startsWith("t_")) {
        driverMap.put(d.getEntityId(), d);
        if (d.getName() != null) {
          driverNames.add(d.getName().trim().toLowerCase(Locale.ROOT));
        }
      }
    }
    collectDriversFromParticipants(content.historyRecord.getDrivers(), driverMap, driverNames);
    collectDriversFromHeats(content.historyRecord.getHeats(), driverMap, driverNames);
    content.drivers = new ArrayList<>(driverMap.values());
  }

  private void collectDriversFromParticipants(
      List<RaceParticipant> participants, Map<String, Driver> driverMap, Set<String> driverNames) {
    if (participants == null) {
      return;
    }
    for (RaceParticipant rp : participants) {
      collectSingleParticipantDriver(rp, driverMap, driverNames);
      if (rp.getTeamDrivers() != null) {
        for (Driver td : rp.getTeamDrivers()) {
          addDriverIfMissing(td, driverMap, driverNames);
        }
      }
    }
  }

  private void collectSingleParticipantDriver(
      RaceParticipant rp, Map<String, Driver> driverMap, Set<String> driverNames) {
    if (rp.isTeamParticipant() || rp.getDriver() == null) {
      return;
    }
    addDriverIfMissing(rp.getDriver(), driverMap, driverNames);
  }

  private void addDriverIfMissing(
      Driver d, Map<String, Driver> driverMap, Set<String> driverNames) {
    if (d == null) {
      return;
    }
    String dId = d.getEntityId();
    if (dId != null && dId.startsWith("t_")) {
      return;
    }
    String normName = d.getName() != null ? d.getName().trim().toLowerCase(Locale.ROOT) : "";
    if (!normName.isEmpty() && driverNames.contains(normName)) {
      return;
    }
    if (dId == null || dId.isEmpty()) {
      dId = UUID.randomUUID().toString();
      d = Driver.Builder.from(d).withEntityId(dId).build();
    }
    if (!driverMap.containsKey(dId)) {
      driverMap.put(dId, d);
      if (!normName.isEmpty()) {
        driverNames.add(normName);
      }
    }
  }

  private void collectDriversFromHeats(
      List<Heat> heats, Map<String, Driver> driverMap, Set<String> driverNames) {
    if (heats == null) {
      return;
    }
    for (Heat h : heats) {
      if (h.getDrivers() != null) {
        for (DriverHeatData dhd : h.getDrivers()) {
          RaceParticipant heatParticipant = dhd.getDriver();
          Driver d =
              dhd.getActualDriver() != null
                  ? dhd.getActualDriver()
                  : (heatParticipant != null && !heatParticipant.isTeamParticipant()
                      ? heatParticipant.getDriver()
                      : null);
          addDriverIfMissing(d, driverMap, driverNames);
        }
      }
    }
  }

  private Map<String, String> buildNameToEntityIdMap(RaceHistoryRecord historyRecord) {
    Map<String, String> nameToEntityId = new HashMap<>();
    if (historyRecord == null) {
      return nameToEntityId;
    }
    if (historyRecord.getDrivers() != null) {
      for (RaceParticipant rp : historyRecord.getDrivers()) {
        if (rp.getDriver() != null && rp.getDriver().getName() != null) {
          nameToEntityId.put(
              rp.getDriver().getName().trim().toLowerCase(Locale.ROOT),
              rp.getDriver().getEntityId());
        }
        if (rp.getTeamDrivers() != null) {
          for (Driver td : rp.getTeamDrivers()) {
            if (td != null && td.getName() != null && td.getEntityId() != null) {
              nameToEntityId.put(td.getName().trim().toLowerCase(Locale.ROOT), td.getEntityId());
            }
          }
        }
      }
    }
    if (historyRecord.getHeats() != null) {
      for (Heat h : historyRecord.getHeats()) {
        if (h.getDrivers() != null) {
          for (DriverHeatData dhd : h.getDrivers()) {
            Driver ad = dhd.getActualDriver();
            if (ad != null && ad.getName() != null && ad.getEntityId() != null) {
              nameToEntityId.put(ad.getName().trim().toLowerCase(Locale.ROOT), ad.getEntityId());
            }
          }
        }
      }
    }
    return nameToEntityId;
  }

  private List<Driver> parseDriversJson(byte[] bytes, RaceHistoryRecord historyRecord) {
    List<Driver> result = new ArrayList<>();
    try {
      com.fasterxml.jackson.databind.JsonNode rootNode = objectMapper.readTree(bytes);
      com.fasterxml.jackson.databind.JsonNode arrayNode =
          rootNode.isArray()
              ? rootNode
              : (rootNode.has("drivers") ? rootNode.get("drivers") : null);
      if (arrayNode != null && arrayNode.isArray()) {
        Map<String, String> nameToEntityId = buildNameToEntityIdMap(historyRecord);

        for (com.fasterxml.jackson.databind.JsonNode node : arrayNode) {
          String name = node.has("name") ? node.get("name").asText("") : "";
          String nickname = node.has("nickname") ? node.get("nickname").asText("") : "";
          String avatarUrl = node.has("avatarUrl") ? node.get("avatarUrl").asText("") : "";
          String entityId = nameToEntityId.get(name.trim().toLowerCase(Locale.ROOT));
          if (entityId != null && entityId.startsWith("t_")) {
            continue;
          }
          if (entityId == null || entityId.isEmpty()) {
            entityId = UUID.randomUUID().toString();
          }

          Driver.Builder b =
              new Driver.Builder()
                  .withEntityId(entityId)
                  .withName(name)
                  .withNickname(nickname)
                  .withAvatarUrl(avatarUrl);

          result.add(b.build());
        }
      }
    } catch (Exception e) {
      logger.warn("Failed to parse drivers.json, falling back to history drivers", e);
    }
    return result;
  }

  private byte[] readEntryBytes(InputStream is) throws IOException {
    ByteArrayOutputStream baos = new ByteArrayOutputStream();
    byte[] buf = new byte[8192];
    int n;
    while ((n = is.read(buf)) != -1) {
      baos.write(buf, 0, n);
    }
    return baos.toByteArray();
  }

  private byte[] readAllBytes(InputStream is) throws IOException {
    return readEntryBytes(is);
  }

  private Path getTempPackagePath(String token) {
    return Paths.get(System.getProperty("java.io.tmpdir"), "rc_packages", token + ".rcpack");
  }

  private void saveTempPackage(String token, byte[] bytes) throws IOException {
    Path tempFile = getTempPackagePath(token);
    Files.createDirectories(tempFile.getParent());
    Files.write(tempFile, bytes);
  }

  private void cleanupTempPackage(String token) {
    if (token == null || token.trim().isEmpty()) return;
    try {
      Path tempFile = getTempPackagePath(token);
      Files.deleteIfExists(tempFile);
    } catch (Exception e) {
      logger.debug("Failed to delete temp package file: {}", token, e);
    }
  }

  private static class DuplicateInfo {
    private final boolean duplicate;
    private final String raceId;
    private final String raceName;

    public DuplicateInfo(boolean duplicate, String raceId, String raceName) {
      this.duplicate = duplicate;
      this.raceId = raceId;
      this.raceName = raceName;
    }

    public boolean isDuplicate() {
      return duplicate;
    }

    public String getRaceId() {
      return raceId;
    }

    public String getRaceName() {
      return raceName;
    }
  }

  public static class ConfigConflictInfo {
    private final boolean conflict;
    private final String existingName;
    private final String suggestedName;

    public ConfigConflictInfo(boolean conflict, String existingName, String suggestedName) {
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

  public static class ResolvedRaceConfig {
    private final String configId;
    private final String configName;
    private final String action;
    private final Race race;

    public ResolvedRaceConfig(String configId, String configName, String action, Race race) {
      this.configId = configId;
      this.configName = configName;
      this.action = action;
      this.race = race;
    }

    public String getConfigId() {
      return configId;
    }

    public String getConfigName() {
      return configName;
    }

    public String getAction() {
      return action;
    }

    public Race getRace() {
      return race;
    }
  }
}
