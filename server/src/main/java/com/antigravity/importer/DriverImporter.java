package com.antigravity.importer;

import com.antigravity.context.DatabaseContext;
import com.antigravity.importer.DriverImportParserHelper.ExtractedPackage;
import com.antigravity.importer.DriverImportParserHelper.ParsedDataFile;
import com.antigravity.importer.model.DriverImportCommitRequest;
import com.antigravity.importer.model.DriverImportPreview;
import com.antigravity.importer.model.DriverImportResult;
import com.antigravity.importer.model.DriverImportRow;
import com.antigravity.importer.model.ExistingDriverSummary;
import com.antigravity.models.AudioConfig;
import com.antigravity.models.Driver;
import com.antigravity.models.DriverLabel;
import com.antigravity.proto.AssetMessage;
import com.antigravity.repository.SqliteRepository;
import com.antigravity.service.AssetDefaultsInitializer;
import com.antigravity.service.AssetDefaultsInitializer.DefaultAsset;
import com.antigravity.service.AssetService;
import com.antigravity.util.LogicalSortComparator;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import java.util.UUID;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class DriverImporter {

  private static final Logger logger = LoggerFactory.getLogger(DriverImporter.class);
  private static final ObjectMapper objectMapper = new ObjectMapper();

  private static final String[] AUDIO_SLOT_KEYS = {
    "lap",
    "bestLap",
    "penalty",
    "raceBestLap",
    "raceLaneBestLap",
    "heatBestLap",
    "newRaceLeader",
    "newHeatLeader",
    "overallBestLap",
    "overallLaneBestLap",
    "pitIn",
    "fuel",
    "driftLap"
  };

  public static final List<String> PRESET_LABEL_COLORS =
      Collections.unmodifiableList(
          Arrays.asList(
              "#ef4444", // Red
              "#f97316", // Orange
              "#f59e0b", // Amber
              "#10b981", // Emerald
              "#06b6d4", // Cyan
              "#3b82f6", // Blue
              "#6366f1", // Indigo
              "#8b5cf6", // Purple
              "#ec4899", // Pink
              "#64748b", // Slate
              "#84cc16", // Lime
              "#14b8a6", // Teal
              "#f43f5e", // Rose
              "#d946ef", // Fuchsia
              "#a855f7", // Violet
              "#0ea5e9", // Sky
              "#22c55e", // Green
              "#eab308", // Yellow
              "#e11d48", // Crimson
              "#c026d3", // Magenta
              "#7c3aed", // Deep Purple
              "#2563eb", // Royal Blue
              "#059669", // Dark Emerald
              "#475569" // Dark Slate
              ));

  private final DatabaseContext databaseContext;
  private final SqliteRepository<Driver> driverRepository;
  private final AssetService assetService;
  private final SqliteRepository<DriverLabel> driverLabelRepository;
  private final Random random;
  private final Set<String> sessionLabelColors = new HashSet<>();

  public DriverImporter(
      DatabaseContext databaseContext,
      SqliteRepository<Driver> driverRepository,
      AssetService assetService,
      SqliteRepository<DriverLabel> driverLabelRepository) {
    this(databaseContext, driverRepository, assetService, driverLabelRepository, new Random());
  }

  public DriverImporter(
      DatabaseContext databaseContext,
      SqliteRepository<Driver> driverRepository,
      AssetService assetService,
      SqliteRepository<DriverLabel> driverLabelRepository,
      Random random) {
    this.databaseContext = databaseContext;
    this.driverRepository = driverRepository;
    this.assetService = assetService;
    this.driverLabelRepository =
        driverLabelRepository != null
            ? driverLabelRepository
            : (databaseContext != null
                ? new SqliteRepository<>(databaseContext, "driver_labels", DriverLabel.class)
                : null);
    this.random = random != null ? random : new Random();
  }

  public DriverImporter(
      DatabaseContext databaseContext,
      SqliteRepository<Driver> driverRepository,
      AssetService assetService) {
    this(
        databaseContext,
        driverRepository,
        assetService,
        databaseContext != null
            ? new SqliteRepository<>(databaseContext, "driver_labels", DriverLabel.class)
            : null);
  }

  public DriverImportPreview parseAndValidate(
      InputStream inputStream, String fileName, Map<String, byte[]> companionAssets)
      throws IOException {

    Map<String, byte[]> allAssets = new HashMap<>();
    if (companionAssets != null) {
      allAssets.putAll(companionAssets);
    }

    byte[] fileBytes;
    String effectiveFileName = fileName != null ? fileName : "data.csv";

    if (effectiveFileName.toLowerCase(Locale.ROOT).endsWith(".zip")) {
      ExtractedPackage pkg = DriverImportParserHelper.extractZip(inputStream);
      allAssets.putAll(pkg.getCompanionAssets());
      if (pkg.getPrimaryFileData() == null) {
        throw new IllegalArgumentException(
            "ZIP package does not contain a CSV, Excel, or JSON data file");
      }
      fileBytes = pkg.getPrimaryFileData();
      effectiveFileName = pkg.getPrimaryFileName();
    } else {
      fileBytes = DriverImportParserHelper.readAllBytesFromStream(inputStream);
    }

    Map<String, String> uploadedAssetLookup = new HashMap<>();
    List<String> importedAssetNames = ingestAssets(allAssets, uploadedAssetLookup);
    Map<String, String> assetUrlLookup = buildAssetLookupMap(uploadedAssetLookup);

    ParsedDataFile parsedData = parseDataFile(fileBytes, effectiveFileName);
    List<Driver> existingDrivers = driverRepository.findAll();

    return buildPreview(parsedData, existingDrivers, assetUrlLookup, importedAssetNames);
  }

  private List<String> ingestAssets(Map<String, byte[]> assets, Map<String, String> lookup) {
    List<String> imported = new ArrayList<>();
    if (assets == null || assetService == null) return imported;

    for (Map.Entry<String, byte[]> entry : assets.entrySet()) {
      String name = entry.getKey();
      byte[] data = entry.getValue();
      if (data == null || data.length == 0) continue;
      if (!DriverImportParserHelper.isMediaFile(name)) continue;

      String lower = name.toLowerCase(Locale.ROOT);
      String type =
          (lower.endsWith(".wav") || lower.endsWith(".mp3") || lower.endsWith(".ogg"))
              ? "sound"
              : "image";

      try {
        AssetMessage asset = assetService.saveAsset(name, type, data);
        if (asset != null) {
          lookup.put(lower, asset.getUrl());
          if (lower.contains(".")) {
            lookup.put(lower.substring(0, lower.lastIndexOf('.')), asset.getUrl());
          }
          lookup.put(asset.getName().toLowerCase(Locale.ROOT), asset.getUrl());
          imported.add(asset.getName());

          // Also map matching default asset identifiers so imported drivers can resolve them
          for (DefaultAsset def : AssetDefaultsInitializer.getDefaultAudioAssets()) {
            if (def.filename.equalsIgnoreCase(name)
                || def.filename.toLowerCase(Locale.ROOT).endsWith("/" + lower)) {
              lookup.put(def.id.toLowerCase(Locale.ROOT), asset.getUrl());
              lookup.put("preset:" + def.id.toLowerCase(Locale.ROOT), asset.getUrl());
            }
          }
          for (DefaultAsset def : AssetDefaultsInitializer.getDefaultImageAssets()) {
            if (def.filename.equalsIgnoreCase(name)
                || def.filename.toLowerCase(Locale.ROOT).endsWith("/" + lower)) {
              lookup.put(def.id.toLowerCase(Locale.ROOT), asset.getUrl());
            }
          }
        }
      } catch (Exception e) {
        logger.error("Failed to auto-import asset: {}", name, e);
      }
    }
    return imported;
  }

  private ParsedDataFile parseDataFile(byte[] data, String fileName) throws IOException {
    String lower = fileName.toLowerCase(Locale.ROOT);
    try (InputStream is = new ByteArrayInputStream(data)) {
      if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
        return DriverImportParserHelper.parseExcel(is);
      }
      if (lower.endsWith(".json")) {
        return DriverImportParserHelper.parseJson(is);
      }
      return DriverImportParserHelper.parseCsv(is);
    }
  }

  private DriverImportPreview buildPreview(
      ParsedDataFile parsedData,
      List<Driver> existingDrivers,
      Map<String, String> assetLookup,
      List<String> importedAssets) {

    List<DriverImportRow> resultRows = new ArrayList<>();
    Set<String> seenNames = new HashSet<>();
    Set<String> seenNicknames = new HashSet<>();

    int validCount = 0;
    int conflictCount = 0;
    int errorCount = 0;
    int rowIndex = 1;

    for (Map<String, String> raw : parsedData.getRows()) {
      DriverImportRow row =
          processRow(
              raw,
              rowIndex++,
              parsedData.getDetectedAudioDefault(),
              existingDrivers,
              seenNames,
              seenNicknames,
              assetLookup);

      if ("VALID".equals(row.getStatus())) validCount++;
      else if ("CONFLICT".equals(row.getStatus())) conflictCount++;
      else errorCount++;

      resultRows.add(row);
    }

    List<ExistingDriverSummary> summaries = new ArrayList<>();
    if (existingDrivers != null) {
      for (Driver d : existingDrivers) {
        if (d != null && d.getEntityId() != null) {
          summaries.add(new ExistingDriverSummary(d.getEntityId(), d.getName(), d.getNickname()));
        }
      }
    }

    return new DriverImportPreview(
        resultRows,
        resultRows.size(),
        validCount,
        conflictCount,
        errorCount,
        importedAssets,
        parsedData.getDetectedAudioDefault(),
        summaries);
  }

  private DriverImportRow processRow(
      Map<String, String> raw,
      int rowIndex,
      String detectedAudioDefault,
      List<Driver> existingDrivers,
      Set<String> seenNames,
      Set<String> seenNicknames,
      Map<String, String> assetLookup) {

    String rawName = raw.getOrDefault("name", "").trim();
    String rawNickname = raw.getOrDefault("nickname", "").trim();

    DriverImportRow row = new DriverImportRow();
    row.setRowIndex(rowIndex);
    row.setRawName(rawName);
    row.setRawNickname(rawNickname);

    if (rawName.isEmpty()) {
      row.setStatus("ERROR");
      row.setMessage("Driver name cannot be empty");
      return row;
    }

    String resolvedNickname = rawNickname.isEmpty() ? rawName : rawNickname;
    row.setResolvedName(rawName);
    row.setResolvedNickname(resolvedNickname);

    validateCollisions(row, rawNickname.isEmpty(), existingDrivers, seenNames, seenNicknames);

    // Audio & Avatar
    String rowAudioDefault = raw.getOrDefault("default_audio", detectedAudioDefault).trim();
    if (rowAudioDefault.isEmpty()) rowAudioDefault = detectedAudioDefault;
    row.setDefaultAudioMode(rowAudioDefault);

    Map<String, AudioConfig> audioSlots = new HashMap<>();
    for (String slot : AUDIO_SLOT_KEYS) {
      String cellVal = raw.get(slot);
      audioSlots.put(
          slot,
          DriverAudioParserHelper.parseAudioSlot(slot, cellVal, rowAudioDefault, assetLookup));
    }
    row.setAudioSlots(audioSlots);

    String avatar = raw.get("avatar");
    if (avatar != null && !avatar.trim().isEmpty()) {
      row.setAvatarUrl(resolveAvatarUrl(avatar, assetLookup));
    }

    boolean hasLabelCol = hasAnyLabelColumn(raw);
    row.setHasLabelColumns(hasLabelCol);
    List<String> extractedLabels = extractLabelsFromRow(raw);
    row.setLabels(extractedLabels);

    if (row.getLabels() != null && !row.getLabels().isEmpty() && driverLabelRepository != null) {
      List<DriverLabel> existingDbLabels = driverLabelRepository.findAll();
      if (existingDbLabels != null) {
        List<String> ids = new ArrayList<>();
        for (String lblName : row.getLabels()) {
          for (DriverLabel dbLbl : existingDbLabels) {
            if (dbLbl != null
                && dbLbl.getName() != null
                && dbLbl.getName().equalsIgnoreCase(lblName)) {
              if (dbLbl.getEntityId() != null && !ids.contains(dbLbl.getEntityId())) {
                ids.add(dbLbl.getEntityId());
              }
              break;
            }
          }
        }
        row.setLabelIds(ids);
      }
    }

    return row;
  }

  private boolean hasAnyLabelColumn(Map<String, String> raw) {
    if (raw == null || raw.isEmpty()) return false;
    for (String key : raw.keySet()) {
      String clean = key.trim().toLowerCase(Locale.ROOT).replaceAll("[\\s_-]+", "");
      if ("labels".equals(clean) || "driverlabels".equals(clean) || "driverlabel".equals(clean)) {
        return true;
      }
      if (clean.matches("^label\\d+$")) {
        return true;
      }
    }
    if (driverLabelRepository != null) {
      List<DriverLabel> dbLabels = driverLabelRepository.findAll();
      if (dbLabels != null) {
        for (DriverLabel lbl : dbLabels) {
          if (lbl != null && lbl.getName() != null && !lbl.getName().trim().isEmpty()) {
            for (String key : raw.keySet()) {
              if (key.equalsIgnoreCase(lbl.getName().trim())) {
                return true;
              }
            }
          }
        }
      }
    }
    return false;
  }

  private List<String> extractLabelsFromRow(Map<String, String> raw) {
    List<String> extracted = new ArrayList<>();
    if (raw == null || raw.isEmpty()) {
      return extracted;
    }

    // 1. Check for combined "labels" field (comma/semicolon/newline separated)
    String combined = raw.get("labels");
    if (combined != null && !combined.trim().isEmpty()) {
      String[] parts = combined.split("[,;\\r\\n]+");
      for (String part : parts) {
        String trimmed = part.trim();
        if (!trimmed.isEmpty() && !containsCaseInsensitiveList(extracted, trimmed)) {
          extracted.add(trimmed);
        }
      }
    }

    // 2. Check for numbered label columns: label1, label2, etc. (sorted logically)
    List<String> labelKeys = new ArrayList<>();
    for (String key : raw.keySet()) {
      String cleanKey = key.trim().toLowerCase(Locale.ROOT).replaceAll("[\\s_-]+", "");
      if (cleanKey.matches("^label\\d+$")) {
        labelKeys.add(key);
      }
    }
    labelKeys.sort(
        (k1, k2) -> {
          String c1 = k1.trim().toLowerCase(Locale.ROOT).replaceAll("[\\s_-]+", "");
          String c2 = k2.trim().toLowerCase(Locale.ROOT).replaceAll("[\\s_-]+", "");
          return LogicalSortComparator.INSTANCE.compare(c1, c2);
        });

    for (String key : labelKeys) {
      String val = raw.get(key);
      if (val != null) {
        String trimmed = val.trim();
        if (!trimmed.isEmpty() && !containsCaseInsensitiveList(extracted, trimmed)) {
          extracted.add(trimmed);
        }
      }
    }

    // 3. Check if any key matches a known DriverLabel name in the database
    if (driverLabelRepository != null) {
      List<DriverLabel> dbLabels = driverLabelRepository.findAll();
      if (dbLabels != null) {
        for (DriverLabel lbl : dbLabels) {
          if (lbl != null && lbl.getName() != null && !lbl.getName().trim().isEmpty()) {
            String lblName = lbl.getName().trim();
            for (Map.Entry<String, String> entry : raw.entrySet()) {
              if (entry.getKey().equalsIgnoreCase(lblName)) {
                String val =
                    entry.getValue() != null
                        ? entry.getValue().trim().toLowerCase(Locale.ROOT)
                        : "";
                if ("true".equals(val)
                    || "yes".equals(val)
                    || "1".equals(val)
                    || "x".equals(val)
                    || "check".equals(val)
                    || val.equalsIgnoreCase(lblName)) {
                  if (!containsCaseInsensitiveList(extracted, lblName)) {
                    extracted.add(lblName);
                  }
                }
              }
            }
          }
        }
      }
    }

    return extracted;
  }

  private boolean containsCaseInsensitiveList(List<String> list, String value) {
    if (list == null || value == null) return false;
    for (String item : list) {
      if (value.equalsIgnoreCase(item)) return true;
    }
    return false;
  }

  private void validateCollisions(
      DriverImportRow row,
      boolean nicknameWasDefaulted,
      List<Driver> existingDrivers,
      Set<String> seenNames,
      Set<String> seenNicknames) {

    String candName = row.getResolvedName();
    String candNick = row.getResolvedNickname();

    // Check duplicate in file
    if (containsCaseInsensitive(seenNames, candName)) {
      setConflict(
          row, "DUPLICATE_IN_FILE", "Duplicate driver name in import file: " + candName, null);
      return;
    }
    if (containsCaseInsensitive(seenNicknames, candNick)) {
      setConflict(
          row, "DUPLICATE_IN_FILE", "Duplicate driver nickname in import file: " + candNick, null);
      return;
    }

    // Check existing DB drivers
    for (Driver d : existingDrivers) {
      if (d.getName() != null && candName.equalsIgnoreCase(d.getName().trim())) {
        setConflict(
            row,
            "DUPLICATE_NAME",
            "Driver name already exists in database: " + candName,
            d.getEntityId());
        return;
      }
      if (d.getNickname() != null && candNick.equalsIgnoreCase(d.getNickname().trim())) {
        String msg =
            nicknameWasDefaulted
                ? "Nickname defaulted to Name ('"
                    + candName
                    + "'), but nickname '"
                    + candNick
                    + "' already exists"
                : "Driver nickname already exists in database: " + candNick;
        setConflict(row, "DUPLICATE_NICKNAME", msg, d.getEntityId());
        return;
      }
      if (d.getName() != null && candNick.equalsIgnoreCase(d.getName().trim())) {
        String msg =
            nicknameWasDefaulted
                ? "Nickname defaulted to Name ('"
                    + candName
                    + "'), which collides with existing driver name"
                : "Driver nickname matches an existing driver name: " + candNick;
        setConflict(row, "DUPLICATE_NICKNAME", msg, d.getEntityId());
        return;
      }
      if (!nicknameWasDefaulted
          && d.getNickname() != null
          && candName.equalsIgnoreCase(d.getNickname().trim())) {
        setConflict(
            row,
            "DUPLICATE_NAME",
            "Driver name matches an existing driver nickname: " + candName,
            d.getEntityId());
        return;
      }
    }

    seenNames.add(candName.toLowerCase(Locale.ROOT));
    seenNicknames.add(candNick.toLowerCase(Locale.ROOT));
    row.setStatus("VALID");
    row.setConflictType("NONE");
  }

  private void setConflict(DriverImportRow row, String type, String msg, String existingId) {
    row.setStatus("CONFLICT");
    row.setConflictType(type);
    row.setMessage(msg);
    row.setSelectedResolution("SKIP");
    row.setExistingDriverId(existingId);
  }

  public DriverImportResult commitImport(DriverImportCommitRequest request) {
    DriverImportResult result = new DriverImportResult();
    if (request == null || request.getRows() == null) {
      result.setSuccess(true);
      return result;
    }

    List<Driver> allDrivers = driverRepository.findAll();
    Set<String> existingNames = new HashSet<>();
    Set<String> existingNicknames = new HashSet<>();
    for (Driver d : allDrivers) {
      if (d.getName() != null) existingNames.add(d.getName().trim());
      if (d.getNickname() != null) existingNicknames.add(d.getNickname().trim());
    }

    Map<String, String> assetUrlLookup = buildAssetLookupMap(null);

    for (DriverImportRow row : request.getRows()) {
      if (row.getAvatarUrl() != null && !row.getAvatarUrl().isEmpty()) {
        row.setAvatarUrl(resolveAvatarUrl(row.getAvatarUrl(), assetUrlLookup));
      }
      if ("ERROR".equals(row.getStatus())) continue;

      if ("CONFLICT".equals(row.getStatus())) {
        String resolution = row.getSelectedResolution();
        if ("OVERWRITE".equalsIgnoreCase(resolution) && row.getExistingDriverId() != null) {
          executeOverwrite(row, result);
        } else if ("AUTO_RENAME".equalsIgnoreCase(resolution)) {
          executeAutoRename(row, existingNames, existingNicknames, result);
        } else {
          result.setSkippedCount(result.getSkippedCount() + 1);
        }
      } else {
        if (containsCaseInsensitive(existingNames, row.getResolvedName())
            || containsCaseInsensitive(existingNicknames, row.getResolvedNickname())) {
          executeAutoRename(row, existingNames, existingNicknames, result);
        } else {
          executeInsert(row, existingNames, existingNicknames, result);
        }
      }
    }

    result.setSuccess(true);
    return result;
  }

  private void executeOverwrite(DriverImportRow row, DriverImportResult result) {
    Driver existing = driverRepository.findByEntityId(row.getExistingDriverId());
    if (existing == null) {
      result.setSkippedCount(result.getSkippedCount() + 1);
      return;
    }
    Driver updated = buildDriverFromRow(existing.getEntityId(), row, existing);
    driverRepository.replace(existing.getEntityId(), updated);
    result.getUpdatedDriverIds().add(existing.getEntityId());
    result.setUpdatedCount(result.getUpdatedCount() + 1);
  }

  private void executeAutoRename(
      DriverImportRow row,
      Set<String> existingNames,
      Set<String> existingNicknames,
      DriverImportResult result) {

    String newName = generateUniqueName(row.getResolvedName(), existingNames);
    String newNick = generateUniqueName(row.getResolvedNickname(), existingNicknames);
    row.setResolvedName(newName);
    row.setResolvedNickname(newNick);

    executeInsert(row, existingNames, existingNicknames, result);
  }

  private void executeInsert(
      DriverImportRow row,
      Set<String> existingNames,
      Set<String> existingNicknames,
      DriverImportResult result) {

    String nextId = getNextSequence();
    Driver driver = buildDriverFromRow(nextId, row, null);
    driverRepository.insert(driver);

    existingNames.add(driver.getName());
    existingNicknames.add(driver.getNickname());
    result.getCreatedDriverIds().add(nextId);
    result.setImportedCount(result.getImportedCount() + 1);
  }

  private Driver buildDriverFromRow(String entityId, DriverImportRow row, Driver existing) {
    Map<String, AudioConfig> audio =
        row.getAudioSlots() != null ? row.getAudioSlots() : new HashMap<>();

    List<String> labelIdsToUse;
    if (row.isHasLabelColumns() || !row.getLabels().isEmpty()) {
      labelIdsToUse = resolveOrCreateLabelIds(row.getLabels(), row.getLabelIds());
    } else if (existing != null && existing.getLabelIds() != null) {
      labelIdsToUse = new ArrayList<>(existing.getLabelIds());
    } else if (!row.getLabelIds().isEmpty()) {
      labelIdsToUse = new ArrayList<>(row.getLabelIds());
    } else {
      labelIdsToUse = new ArrayList<>();
    }

    return new Driver.Builder()
        .withEntityId(entityId)
        .withName(row.getResolvedName())
        .withNickname(row.getResolvedNickname())
        .withAvatarUrl(resolveAvatarUrl(row.getAvatarUrl(), null))
        .withLabelIds(labelIdsToUse)
        .withLapAudio(audio.get("lap"))
        .withBestLapAudio(audio.get("bestLap"))
        .withPenaltyAudio(audio.get("penalty"))
        .withRaceBestLapAudio(audio.get("raceBestLap"))
        .withRaceLaneBestLapAudio(audio.get("raceLaneBestLap"))
        .withHeatBestLapAudio(audio.get("heatBestLap"))
        .withNewRaceLeaderAudio(audio.get("newRaceLeader"))
        .withNewHeatLeaderAudio(audio.get("newHeatLeader"))
        .withOverallBestLapAudio(audio.get("overallBestLap"))
        .withOverallLaneBestLapAudio(audio.get("overallLaneBestLap"))
        .withPitInAudio(audio.get("pitIn"))
        .withFuelAudio(audio.get("fuel"))
        .withDriftLapAudio(audio.get("driftLap"))
        .build();
  }

  private List<String> resolveOrCreateLabelIds(
      List<String> labelNames, List<String> explicitLabelIds) {
    Set<String> resultIds = new LinkedHashSet<>();
    if (explicitLabelIds != null) {
      for (String id : explicitLabelIds) {
        if (id != null && !id.trim().isEmpty()) {
          resultIds.add(id.trim());
        }
      }
    }
    if (labelNames != null && driverLabelRepository != null) {
      List<DriverLabel> existingLabels = driverLabelRepository.findAll();
      if (existingLabels == null) {
        existingLabels = new ArrayList<>();
      }
      Set<String> usedColors = collectUsedLabelColors(existingLabels);

      for (String name : labelNames) {
        if (name == null || name.trim().isEmpty()) {
          continue;
        }
        String trimmedName = name.trim();
        DriverLabel matched = null;
        for (DriverLabel dbLbl : existingLabels) {
          if (dbLbl != null
              && dbLbl.getName() != null
              && dbLbl.getName().equalsIgnoreCase(trimmedName)) {
            matched = dbLbl;
            break;
          }
        }
        if (matched != null) {
          resultIds.add(matched.getEntityId());
        } else {
          String newId = UUID.randomUUID().toString();
          String chosenColor = generateUniqueLabelColor(usedColors);
          usedColors.add(chosenColor.toLowerCase(Locale.ROOT));
          sessionLabelColors.add(chosenColor.toLowerCase(Locale.ROOT));

          DriverLabel created =
              new DriverLabel.Builder()
                  .withEntityId(newId)
                  .withName(trimmedName)
                  .withColor(chosenColor)
                  .build();
          driverLabelRepository.insert(created);
          existingLabels.add(created);
          resultIds.add(newId);
        }
      }
    }
    return new ArrayList<>(resultIds);
  }

  private Set<String> collectUsedLabelColors(List<DriverLabel> existingLabels) {
    Set<String> used = new HashSet<>(sessionLabelColors);
    if (existingLabels != null) {
      for (DriverLabel lbl : existingLabels) {
        if (lbl != null && lbl.getColor() != null && !lbl.getColor().trim().isEmpty()) {
          used.add(lbl.getColor().trim().toLowerCase(Locale.ROOT));
        }
      }
    }
    return used;
  }

  String generateUniqueLabelColor(Set<String> usedColors) {
    List<String> availablePresets = new ArrayList<>();
    for (String color : PRESET_LABEL_COLORS) {
      if (!usedColors.contains(color.toLowerCase(Locale.ROOT))) {
        availablePresets.add(color);
      }
    }

    if (!availablePresets.isEmpty()) {
      int idx = random.nextInt(availablePresets.size());
      return availablePresets.get(idx);
    }

    for (int attempt = 0; attempt < 100; attempt++) {
      int r = random.nextInt(256);
      int g = random.nextInt(256);
      int b = random.nextInt(256);
      String candidate = String.format(Locale.ROOT, "#%02x%02x%02x", r, g, b);
      if (!usedColors.contains(candidate.toLowerCase(Locale.ROOT))) {
        return candidate;
      }
    }

    return PRESET_LABEL_COLORS.get(random.nextInt(PRESET_LABEL_COLORS.size()));
  }

  private Map<String, String> buildAssetLookupMap(Map<String, String> uploadedAssets) {
    Map<String, String> lookup = new HashMap<>();

    if (assetService != null) {
      try {
        List<AssetMessage> allAssets = assetService.getAllAssets();
        if (allAssets != null) {
          for (AssetMessage asset : allAssets) {
            registerAssetInLookup(lookup, asset);
          }
        }
      } catch (Exception e) {
        logger.warn("Could not load existing assets for import lookup", e);
      }
    }

    populateDefaultAssetsInLookup(lookup);

    if (uploadedAssets != null) {
      lookup.putAll(uploadedAssets);
    }

    return lookup;
  }

  private void registerAssetInLookup(Map<String, String> lookup, AssetMessage asset) {
    if (asset == null) return;
    String url = asset.getUrl();
    if (url == null || url.trim().isEmpty()) return;

    String id = asset.getModel() != null ? asset.getModel().getEntityId() : null;
    String name = asset.getName();
    String filename = url.startsWith("/assets/") ? url.substring("/assets/".length()) : null;

    if (id != null && !id.isEmpty()) {
      lookup.put(id.toLowerCase(Locale.ROOT), url);
    }
    if (name != null && !name.isEmpty()) {
      String lower = name.toLowerCase(Locale.ROOT);
      lookup.put(lower, url);
      lookup.put(lower.replace(" ", "_"), url);
      lookup.put(lower.replace(" ", "-"), url);
    }
    if (filename != null && !filename.isEmpty()) {
      String lower = filename.toLowerCase(Locale.ROOT);
      lookup.put(lower, url);
      if (lower.contains(".")) {
        lookup.put(lower.substring(0, lower.lastIndexOf('.')), url);
      }
    }
    if (url.startsWith("/")) {
      lookup.put(url.toLowerCase(Locale.ROOT), url);
      lookup.put(url.substring(1).toLowerCase(Locale.ROOT), url);
    }
  }

  private void populateDefaultAssetsInLookup(Map<String, String> lookup) {
    for (DefaultAsset def : AssetDefaultsInitializer.getDefaultImageAssets()) {
      String defFn = AssetDefaultsInitializer.getDefaultFilename(def.id);
      String url = defFn != null ? "/assets/" + defFn : "/assets/" + def.id;
      if (lookup.containsKey(def.id.toLowerCase(Locale.ROOT))) {
        url = lookup.get(def.id.toLowerCase(Locale.ROOT));
      }
      lookup.put(def.id.toLowerCase(Locale.ROOT), url);
      lookup.put(def.filename.toLowerCase(Locale.ROOT), url);
      if (def.filename.contains(".")) {
        lookup.put(
            def.filename.substring(0, def.filename.lastIndexOf('.')).toLowerCase(Locale.ROOT), url);
      }
      String lowerName = def.displayName.toLowerCase(Locale.ROOT);
      lookup.put(lowerName, url);
      lookup.put(lowerName.replace(" ", "_"), url);
      lookup.put(lowerName.replace(" ", "-"), url);
    }

    for (DefaultAsset def : AssetDefaultsInitializer.getDefaultAudioAssets()) {
      lookup.put(def.id.toLowerCase(Locale.ROOT), def.id);
      lookup.put(def.filename.toLowerCase(Locale.ROOT), def.id);
      if (def.filename.contains(".")) {
        lookup.put(
            def.filename.substring(0, def.filename.lastIndexOf('.')).toLowerCase(Locale.ROOT),
            def.id);
      }
      String lowerName = def.displayName.toLowerCase(Locale.ROOT);
      lookup.put(lowerName, def.id);
      lookup.put(lowerName.replace(" ", "_"), def.id);
      lookup.put(lowerName.replace(" ", "-"), def.id);
    }

    String yellowUrl =
        lookup.getOrDefault(
            "default_black-yellow", "/assets/default_black-yellow_Helmet_Black-Yellow");
    lookup.put("assets/defaults/helmets/helmet_yellow.png", yellowUrl);
    lookup.put("helmet_yellow.png", yellowUrl);
    lookup.put("helmet_yellow", yellowUrl);
    lookup.put("helmet-yellow.png", yellowUrl);
    lookup.put("helmet-yellow", yellowUrl);
    lookup.put("yellow-helmet.png", yellowUrl);

    String redUrl =
        lookup.getOrDefault("default_red-yellow", "/assets/default_red-yellow_Helmet_Red-Yellow");
    lookup.put("assets/defaults/helmets/helmet_red.png", redUrl);
    lookup.put("helmet_red.png", redUrl);
    lookup.put("helmet_red", redUrl);
    lookup.put("helmet-red.png", redUrl);
    lookup.put("helmet-red", redUrl);
    lookup.put("red-helmet.png", redUrl);

    String blueUrl =
        lookup.getOrDefault("default_blue-white", "/assets/default_blue-white_Helmet_Blue-White");
    lookup.put("assets/defaults/helmets/helmet_blue.png", blueUrl);
    lookup.put("helmet_blue.png", blueUrl);
    lookup.put("helmet_blue", blueUrl);

    String greenUrl =
        lookup.getOrDefault(
            "default_green-white", "/assets/default_green-white_Helmet_Green-White");
    lookup.put("assets/defaults/helmets/helmet_green.png", greenUrl);
    lookup.put("helmet_green.png", greenUrl);
    lookup.put("helmet_green", greenUrl);

    String blackUrl = lookup.getOrDefault("default_black", "/assets/default_black_Helmet_Black");
    lookup.put("assets/defaults/helmets/helmet_black.png", blackUrl);
    lookup.put("helmet_black.png", blackUrl);
    lookup.put("helmet_black", blackUrl);

    String whiteUrl =
        lookup.getOrDefault("default_white-blue", "/assets/default_white-blue_Helmet_White-Blue");
    lookup.put("assets/defaults/helmets/helmet_white.png", whiteUrl);
    lookup.put("helmet_white.png", whiteUrl);
    lookup.put("helmet_white", whiteUrl);

    String orangeUrl =
        lookup.getOrDefault("default_red-orange", "/assets/default_red-orange_Helmet_Red-Orange");
    lookup.put("assets/defaults/helmets/helmet_orange.png", orangeUrl);
    lookup.put("helmet_orange.png", orangeUrl);
    lookup.put("helmet_orange", orangeUrl);

    String silverUrl =
        lookup.getOrDefault(
            "default_silver-green", "/assets/default_silver-green_Helmet_Silver-Green");
    lookup.put("assets/defaults/helmets/helmet_silver.png", silverUrl);
    lookup.put("helmet_silver.png", silverUrl);
    lookup.put("helmet_silver", silverUrl);
  }

  private String resolveAvatarUrl(String avatar, Map<String, String> lookup) {
    if (avatar == null || avatar.trim().isEmpty()) {
      return null;
    }
    String clean = avatar.trim();
    String lower = clean.toLowerCase(Locale.ROOT);

    if (lookup != null && lookup.containsKey(lower)) {
      return lookup.get(lower);
    }

    String filename = clean;
    if (filename.contains("/")) {
      filename = filename.substring(filename.lastIndexOf('/') + 1);
    }
    if (filename.contains("\\")) {
      filename = filename.substring(filename.lastIndexOf('\\') + 1);
    }
    String lowerFn = filename.toLowerCase(Locale.ROOT);
    if (lookup != null && lookup.containsKey(lowerFn)) {
      return lookup.get(lowerFn);
    }

    if (lowerFn.contains(".")) {
      String noExt = lowerFn.substring(0, lowerFn.lastIndexOf('.'));
      if (lookup != null && lookup.containsKey(noExt)) {
        return lookup.get(noExt);
      }
    }

    String defaultRes = AssetDefaultsInitializer.resolveDefaultAssetUrl(clean);
    if (defaultRes != null && !defaultRes.equals(clean)) {
      return defaultRes;
    }

    return clean;
  }

  public String generateCsvTemplate() {
    return "# default-audio: system\n"
        + "Name,Nickname,Avatar,Label 1,Label 2,Lap Sound,Best Lap Sound,Penalty Sound\n"
        + "Mario Rossi,Mario,,Club 1,Novice,default_beep,default_driveby,default_penalty\n"
        + "Luigi Verdi,Luigi,,Club 2,,none,tts:Great lap by {driver.name}!,none\n";
  }

  public byte[] generateXlsxTemplate() throws IOException {
    try (Workbook wb = new XSSFWorkbook();
        ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
      Sheet sheet = wb.createSheet("Drivers");
      Row headerRow = sheet.createRow(0);
      String[] headers = {
        "Name",
        "Nickname",
        "Avatar",
        "Label 1",
        "Label 2",
        "Default Audio",
        "Lap Sound",
        "Best Lap Sound",
        "Penalty Sound",
        "Race Best Lap Sound"
      };
      for (int i = 0; i < headers.length; i++) {
        headerRow.createCell(i).setCellValue(headers[i]);
      }
      Row row1 = sheet.createRow(1);
      row1.createCell(0).setCellValue("Mario Rossi");
      row1.createCell(1).setCellValue("Mario");
      row1.createCell(2).setCellValue("");
      row1.createCell(3).setCellValue("Club 1");
      row1.createCell(4).setCellValue("Novice");
      row1.createCell(5).setCellValue("system");
      row1.createCell(6).setCellValue("default_beep");
      row1.createCell(7).setCellValue("default_driveby");
      row1.createCell(8).setCellValue("default_penalty");

      Row row2 = sheet.createRow(2);
      row2.createCell(0).setCellValue("Luigi Verdi");
      row2.createCell(1).setCellValue("Luigi");
      row2.createCell(2).setCellValue("");
      row2.createCell(3).setCellValue("Club 2");
      row2.createCell(4).setCellValue("");
      row2.createCell(5).setCellValue("none");
      row2.createCell(6).setCellValue("default_beep");
      row2.createCell(7).setCellValue("tts:Fast lap by {driver.name}!");

      wb.write(baos);
      return baos.toByteArray();
    }
  }

  public String generateJsonTemplate() {
    ObjectNode root = objectMapper.createObjectNode();
    root.put("defaultAudio", "system");
    ArrayNode drivers = root.putArray("drivers");

    ObjectNode d1 = drivers.addObject();
    d1.put("name", "Mario Rossi");
    d1.put("nickname", "Mario");
    ArrayNode d1Labels = d1.putArray("labels");
    d1Labels.add("Club 1");
    d1Labels.add("Novice");
    d1.put("label1", "Club 1");
    d1.put("label2", "Novice");
    ObjectNode lapAudio = d1.putObject("lapAudio");
    lapAudio.put("type", "preset");
    lapAudio.put("url", "default_beep");

    ObjectNode d2 = drivers.addObject();
    d2.put("name", "Luigi Verdi");
    d2.put("nickname", "Luigi");
    ArrayNode d2Labels = d2.putArray("labels");
    d2Labels.add("Club 2");
    d2.put("label1", "Club 2");
    ObjectNode bestLapAudio = d2.putObject("bestLapAudio");
    bestLapAudio.put("type", "tts");
    bestLapAudio.put("text", "Fast lap by {driver.name}!");

    try {
      return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(root);
    } catch (Exception e) {
      return "{}";
    }
  }

  private String getNextSequence() {
    if (driverRepository != null) {
      return driverRepository.getNextSequence();
    }
    if (databaseContext != null) {
      return databaseContext.getNextSequence("drivers");
    }
    return String.valueOf(System.currentTimeMillis());
  }

  public static boolean containsCaseInsensitive(Set<String> set, String value) {
    if (set == null || value == null) return false;
    for (String s : set) {
      if (s.equalsIgnoreCase(value)) return true;
    }
    return false;
  }

  public static String generateUniqueName(String baseName, Set<String> existingNames) {
    if (baseName == null || baseName.trim().isEmpty()) baseName = "Driver";
    String candidate = baseName.trim();
    int count = 1;
    while (containsCaseInsensitive(existingNames, candidate)) {
      candidate = baseName + " (" + count + ")";
      count++;
    }
    return candidate;
  }
}
