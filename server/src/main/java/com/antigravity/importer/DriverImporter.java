package com.antigravity.importer;

import com.antigravity.context.DatabaseContext;
import com.antigravity.importer.DriverImportParserHelper.ExtractedPackage;
import com.antigravity.importer.DriverImportParserHelper.ParsedDataFile;
import com.antigravity.importer.model.DriverImportCommitRequest;
import com.antigravity.importer.model.DriverImportPreview;
import com.antigravity.importer.model.DriverImportResult;
import com.antigravity.importer.model.DriverImportRow;
import com.antigravity.models.AudioConfig;
import com.antigravity.models.Driver;
import com.antigravity.proto.AssetMessage;
import com.antigravity.repository.SqliteRepository;
import com.antigravity.service.AssetService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
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
    "fuel"
  };

  private final DatabaseContext databaseContext;
  private final SqliteRepository<Driver> driverRepository;
  private final AssetService assetService;

  public DriverImporter(
      DatabaseContext databaseContext,
      SqliteRepository<Driver> driverRepository,
      AssetService assetService) {
    this.databaseContext = databaseContext;
    this.driverRepository = driverRepository;
    this.assetService = assetService;
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

    Map<String, String> assetUrlLookup = new HashMap<>();
    List<String> importedAssetNames = ingestAssets(allAssets, assetUrlLookup);

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

      String lower = name.toLowerCase(Locale.ROOT);
      String type =
          (lower.endsWith(".wav") || lower.endsWith(".mp3") || lower.endsWith(".ogg"))
              ? "sound"
              : "image";

      try {
        AssetMessage asset = assetService.saveAsset(name, type, data);
        if (asset != null) {
          lookup.put(lower, asset.getUrl());
          lookup.put(asset.getName().toLowerCase(Locale.ROOT), asset.getUrl());
          imported.add(asset.getName());
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

    return new DriverImportPreview(
        resultRows,
        resultRows.size(),
        validCount,
        conflictCount,
        errorCount,
        importedAssets,
        parsedData.getDetectedAudioDefault());
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
      String cleanAvatar = avatar.trim();
      String lower = cleanAvatar.toLowerCase(Locale.ROOT);
      row.setAvatarUrl(assetLookup.getOrDefault(lower, cleanAvatar));
    }

    return row;
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

    for (DriverImportRow row : request.getRows()) {
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
        executeInsert(row, existingNames, existingNicknames, result);
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
    Driver updated = buildDriverFromRow(existing.getEntityId(), row);
    driverRepository.replace(existing.getEntityId(), updated);
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
    Driver driver = buildDriverFromRow(nextId, row);
    driverRepository.insert(driver);

    existingNames.add(driver.getName());
    existingNicknames.add(driver.getNickname());
    result.getCreatedDriverIds().add(nextId);
    result.setImportedCount(result.getImportedCount() + 1);
  }

  private Driver buildDriverFromRow(String entityId, DriverImportRow row) {
    Map<String, AudioConfig> audio =
        row.getAudioSlots() != null ? row.getAudioSlots() : new HashMap<>();
    return new Driver.Builder()
        .withEntityId(entityId)
        .withName(row.getResolvedName())
        .withNickname(row.getResolvedNickname())
        .withAvatarUrl(row.getAvatarUrl())
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
        .build();
  }

  public String generateCsvTemplate() {
    return "# default-audio: system\n"
        + "Name,Nickname,Avatar,Lap Sound,Best Lap Sound,Penalty Sound\n"
        + "Mario Rossi,Mario,,default_beep,default_driveby,default_penalty\n"
        + "Luigi Verdi,Luigi,,none,tts:Great lap by {driver.name}!,none\n";
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
      row1.createCell(3).setCellValue("system");
      row1.createCell(4).setCellValue("default_beep");
      row1.createCell(5).setCellValue("default_driveby");
      row1.createCell(6).setCellValue("default_penalty");

      Row row2 = sheet.createRow(2);
      row2.createCell(0).setCellValue("Luigi Verdi");
      row2.createCell(1).setCellValue("Luigi");
      row2.createCell(2).setCellValue("");
      row2.createCell(3).setCellValue("none");
      row2.createCell(4).setCellValue("default_beep");
      row2.createCell(5).setCellValue("tts:Fast lap by {driver.name}!");

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
    ObjectNode lapAudio = d1.putObject("lapAudio");
    lapAudio.put("type", "preset");
    lapAudio.put("url", "default_beep");

    ObjectNode d2 = drivers.addObject();
    d2.put("name", "Luigi Verdi");
    d2.put("nickname", "Luigi");
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
