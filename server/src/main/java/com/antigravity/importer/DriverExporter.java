package com.antigravity.importer;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.AudioConfig;
import com.antigravity.models.Driver;
import com.antigravity.proto.AssetMessage;
import com.antigravity.repository.SqliteRepository;
import com.antigravity.service.AssetDefaultsInitializer;
import com.antigravity.service.AssetService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class DriverExporter {

  private static final Logger logger = LoggerFactory.getLogger(DriverExporter.class);
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

  private final DatabaseContext databaseContext;
  private final SqliteRepository<Driver> driverRepository;
  private final AssetService assetService;

  public static class ExportedMediaFile {
    private final String zipEntryName;
    private final byte[] data;
    private final String hash;

    public ExportedMediaFile(String zipEntryName, byte[] data, String hash) {
      this.zipEntryName = zipEntryName;
      this.data = data;
      this.hash = hash;
    }

    public String getZipEntryName() {
      return zipEntryName;
    }

    public byte[] getData() {
      return data;
    }

    public String getHash() {
      return hash;
    }
  }

  public DriverExporter(
      DatabaseContext databaseContext,
      SqliteRepository<Driver> driverRepository,
      AssetService assetService) {
    this.databaseContext = databaseContext;
    this.driverRepository = driverRepository;
    this.assetService = assetService;
  }

  public byte[] exportDriversZip(List<Driver> drivers, String format) throws IOException {
    List<Driver> targetDrivers = prepareDrivers(drivers);
    String normalizedFormat = normalizeFormat(format);

    Map<String, ExportedMediaFile> hashToFileMap = new LinkedHashMap<>();
    Map<String, String> urlToZipEntryMap = new HashMap<>();
    Set<String> usedEntryNames = new HashSet<>();

    // Collect and deduplicate companion media assets (sound and avatar)
    for (Driver driver : targetDrivers) {
      collectDriverMedia(driver, hashToFileMap, urlToZipEntryMap, usedEntryNames);
    }

    // Generate primary data file bytes based on requested format
    byte[] dataFileBytes;
    String dataFileName;
    switch (normalizedFormat) {
      case "xlsx":
      case "xls":
        dataFileName = "drivers.xlsx";
        dataFileBytes = generateExcelBytes(targetDrivers, urlToZipEntryMap);
        break;
      case "json":
        dataFileName = "drivers.json";
        dataFileBytes = generateJsonBytes(targetDrivers, urlToZipEntryMap);
        break;
      case "csv":
      default:
        dataFileName = "drivers.csv";
        dataFileBytes = generateCsvBytes(targetDrivers, urlToZipEntryMap);
        break;
    }

    // Bundle data file and companion assets into a ZIP archive
    return buildZipPackage(dataFileName, dataFileBytes, hashToFileMap.values());
  }

  private List<Driver> prepareDrivers(List<Driver> drivers) {
    List<Driver> list = new ArrayList<>();
    if (drivers != null) {
      list.addAll(drivers);
    } else if (driverRepository != null) {
      list.addAll(driverRepository.findAll());
    }

    List<Driver> result = new ArrayList<>();
    for (Driver d : list) {
      if (d == null) continue;
      if (Driver.EMPTY_DRIVER_ID.equals(d.getEntityId())) continue;
      result.add(d);
    }

    result.sort(
        Comparator.comparing(
            d -> d.getName() != null ? d.getName() : "", String.CASE_INSENSITIVE_ORDER));
    return result;
  }

  private String normalizeFormat(String format) {
    if (format == null) return "csv";
    String clean = format.trim().toLowerCase(Locale.ROOT);
    if ("xlsx".equals(clean) || "xls".equals(clean)) return "xlsx";
    if ("json".equals(clean)) return "json";
    return "csv";
  }

  private void collectDriverMedia(
      Driver driver,
      Map<String, ExportedMediaFile> hashToFileMap,
      Map<String, String> urlToZipEntryMap,
      Set<String> usedEntryNames) {

    // Avatar
    if (driver.getAvatarUrl() != null && !driver.getAvatarUrl().trim().isEmpty()) {
      resolveAndRegisterMedia(
          driver.getAvatarUrl().trim(), "image", hashToFileMap, urlToZipEntryMap, usedEntryNames);
    }

    // Audio Slots
    for (String slotKey : AUDIO_SLOT_KEYS) {
      AudioConfig config = getAudioConfigForSlot(driver, slotKey);
      if (config == null) continue;
      String type = config.getType();
      if ("preset".equalsIgnoreCase(type) || type == null || type.trim().isEmpty()) {
        String url = config.getUrl();
        if (url != null && !url.trim().isEmpty()) {
          resolveAndRegisterMedia(
              url.trim(), "sound", hashToFileMap, urlToZipEntryMap, usedEntryNames);
        }
      }
    }
  }

  private void resolveAndRegisterMedia(
      String urlOrId,
      String mediaType,
      Map<String, ExportedMediaFile> hashToFileMap,
      Map<String, String> urlToZipEntryMap,
      Set<String> usedEntryNames) {

    if (urlToZipEntryMap.containsKey(urlOrId)) {
      return;
    }

    // Skip built-in default presets and helmets
    if (isBuiltInDefault(urlOrId)) {
      return;
    }

    ResolvedAsset asset = resolveAssetData(urlOrId);
    if (asset == null || asset.data == null || asset.data.length == 0) {
      return;
    }

    String hash = AssetService.calculateSha256(asset.data);
    if (hashToFileMap.containsKey(hash)) {
      // Audio or image is shared with another driver or slot: reuse existing entry
      ExportedMediaFile existing = hashToFileMap.get(hash);
      urlToZipEntryMap.put(urlOrId, existing.getZipEntryName());
      return;
    }

    String uniqueName = chooseUniqueEntryName(asset.suggestedName, mediaType, usedEntryNames);
    usedEntryNames.add(uniqueName.toLowerCase(Locale.ROOT));

    ExportedMediaFile exported = new ExportedMediaFile(uniqueName, asset.data, hash);
    hashToFileMap.put(hash, exported);
    urlToZipEntryMap.put(urlOrId, uniqueName);
  }

  private boolean isBuiltInDefault(String urlOrId) {
    if (urlOrId == null) return true;
    String lower = urlOrId.toLowerCase(Locale.ROOT);
    if (lower.startsWith("default_")) return true;
    if (lower.startsWith("preset:default_")) return true;
    if (lower.startsWith("assets/defaults/")) return true;
    if (lower.startsWith("/assets/default_")) return true;
    return AssetDefaultsInitializer.getDefaultResourcePath(urlOrId) != null;
  }

  private static class ResolvedAsset {
    final byte[] data;
    final String suggestedName;

    ResolvedAsset(byte[] data, String suggestedName) {
      this.data = data;
      this.suggestedName = suggestedName;
    }
  }

  private ResolvedAsset resolveAssetData(String urlOrId) {
    String currentDbName =
        databaseContext != null && databaseContext.getCurrentDatabaseName() != null
            ? databaseContext.getCurrentDatabaseName()
            : "RaceCoordinator_AI_DB";
    File assetsDir =
        databaseContext != null
            ? new File(new File(databaseContext.getDataRoot(), currentDbName), "assets")
            : new File("assets");

    String cleanUrl = urlOrId.trim();
    String filename =
        cleanUrl.startsWith("/assets/") ? cleanUrl.substring("/assets/".length()) : cleanUrl;

    // Check physical file directly in assets directory
    File directFile = new File(assetsDir, filename);
    if (directFile.exists() && directFile.isFile()) {
      try {
        byte[] bytes = Files.readAllBytes(directFile.toPath());
        return new ResolvedAsset(bytes, extractSimpleName(filename));
      } catch (Exception e) {
        logger.warn("Could not read asset file: {}", directFile.getAbsolutePath(), e);
      }
    }

    // Try finding via AssetService metadata
    if (assetService != null) {
      String id = filename;
      if (id.contains("_")) {
        id = id.substring(0, id.indexOf('_'));
      }
      AssetMessage assetMsg = assetService.getAssetById(id);
      if (assetMsg != null) {
        String realFilename =
            assetMsg.getUrl() != null && assetMsg.getUrl().startsWith("/assets/")
                ? assetMsg.getUrl().substring("/assets/".length())
                : filename;
        File assetFile = new File(assetsDir, realFilename);
        if (assetFile.exists() && assetFile.isFile()) {
          try {
            byte[] bytes = Files.readAllBytes(assetFile.toPath());
            String name =
                assetMsg.getName() != null && !assetMsg.getName().isEmpty()
                    ? assetMsg.getName()
                    : extractSimpleName(realFilename);
            return new ResolvedAsset(bytes, name);
          } catch (Exception e) {
            logger.warn(
                "Could not read asset file from service metadata: {}",
                assetFile.getAbsolutePath(),
                e);
          }
        }
      }
    }

    // Check case-insensitive match in assets directory
    if (assetsDir.exists() && assetsDir.isDirectory()) {
      File[] matching =
          assetsDir.listFiles(
              (d, name) -> name.equalsIgnoreCase(filename) || name.endsWith("_" + filename));
      if (matching != null && matching.length > 0) {
        try {
          byte[] bytes = Files.readAllBytes(matching[0].toPath());
          return new ResolvedAsset(bytes, extractSimpleName(matching[0].getName()));
        } catch (Exception e) {
          logger.warn(
              "Could not read case-matched asset file: {}", matching[0].getAbsolutePath(), e);
        }
      }
    }

    return null;
  }

  private String extractSimpleName(String filename) {
    if (filename == null) return "sound.wav";
    String simple = filename;
    int slashIdx = Math.max(simple.lastIndexOf('/'), simple.lastIndexOf('\\'));
    if (slashIdx >= 0) {
      simple = simple.substring(slashIdx + 1);
    }
    // If UUID prefix (e.g. 12345678-1234-..._beep.wav or uuid_beep.wav), strip it
    int underscoreIdx = simple.indexOf('_');
    if (underscoreIdx > 0 && underscoreIdx < simple.length() - 1) {
      simple = simple.substring(underscoreIdx + 1);
    }
    return simple;
  }

  private String chooseUniqueEntryName(
      String suggestedName, String mediaType, Set<String> usedEntryNames) {
    String baseName =
        suggestedName != null && !suggestedName.trim().isEmpty() ? suggestedName.trim() : "";
    baseName = baseName.replaceAll("[^a-zA-Z0-9.-]", "_");

    if (baseName.isEmpty() || baseName.startsWith(".")) {
      baseName = "image".equals(mediaType) ? "avatar.png" : "audio.wav";
    }

    String name = baseName;
    String nameWithoutExt = name;
    String ext = "";
    int dotIdx = name.lastIndexOf('.');
    if (dotIdx > 0) {
      nameWithoutExt = name.substring(0, dotIdx);
      ext = name.substring(dotIdx);
    }

    int counter = 1;
    while (usedEntryNames.contains(name.toLowerCase(Locale.ROOT))) {
      name = nameWithoutExt + "_" + counter + ext;
      counter++;
    }
    return name;
  }

  private byte[] generateCsvBytes(List<Driver> drivers, Map<String, String> urlToZipEntryMap) {
    StringBuilder sb = new StringBuilder();
    sb.append("# default-audio: system\n");
    sb.append("Name,Nickname,Avatar,Lap,BestLap,Penalty,RaceBestLap,RaceLaneBestLap,")
        .append(
            "HeatBestLap,NewRaceLeader,NewHeatLeader,OverallBestLap,OverallLaneBestLap,PitIn,Fuel\n");

    for (Driver d : drivers) {
      String name = escapeCsv(d.getName());
      String nick = escapeCsv(d.getNickname());
      String avatar = escapeCsv(resolveAvatarExportValue(d.getAvatarUrl(), urlToZipEntryMap));

      sb.append(name).append(",").append(nick).append(",").append(avatar);
      for (String slotKey : AUDIO_SLOT_KEYS) {
        AudioConfig config = getAudioConfigForSlot(d, slotKey);
        String val = formatAudioForExport(config, urlToZipEntryMap);
        sb.append(",").append(escapeCsv(val));
      }
      sb.append("\n");
    }

    return sb.toString().getBytes(StandardCharsets.UTF_8);
  }

  private byte[] generateExcelBytes(List<Driver> drivers, Map<String, String> urlToZipEntryMap)
      throws IOException {
    try (Workbook wb = new XSSFWorkbook();
        ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

      Sheet sheet = wb.createSheet("Drivers");
      CellStyle headerStyle = wb.createCellStyle();
      Font font = wb.createFont();
      font.setBold(true);
      headerStyle.setFont(font);

      Row headerRow = sheet.createRow(0);
      String[] headers = {
        "Name",
        "Nickname",
        "Avatar",
        "Lap",
        "BestLap",
        "Penalty",
        "RaceBestLap",
        "RaceLaneBestLap",
        "HeatBestLap",
        "NewRaceLeader",
        "NewHeatLeader",
        "OverallBestLap",
        "OverallLaneBestLap",
        "PitIn",
        "Fuel"
      };

      for (int i = 0; i < headers.length; i++) {
        Cell c = headerRow.createCell(i);
        c.setCellValue(headers[i]);
        c.setCellStyle(headerStyle);
      }

      int rowIdx = 1;
      for (Driver d : drivers) {
        Row row = sheet.createRow(rowIdx++);
        row.createCell(0).setCellValue(d.getName() != null ? d.getName() : "");
        row.createCell(1).setCellValue(d.getNickname() != null ? d.getNickname() : "");
        row.createCell(2)
            .setCellValue(resolveAvatarExportValue(d.getAvatarUrl(), urlToZipEntryMap));

        int colIdx = 3;
        for (String slotKey : AUDIO_SLOT_KEYS) {
          AudioConfig config = getAudioConfigForSlot(d, slotKey);
          String val = formatAudioForExport(config, urlToZipEntryMap);
          row.createCell(colIdx++).setCellValue(val);
        }
      }

      for (int i = 0; i < headers.length; i++) {
        sheet.autoSizeColumn(i);
      }

      wb.write(baos);
      return baos.toByteArray();
    }
  }

  private byte[] generateJsonBytes(List<Driver> drivers, Map<String, String> urlToZipEntryMap)
      throws IOException {
    ObjectNode root = objectMapper.createObjectNode();
    root.put("defaultAudio", "system");
    ArrayNode array = root.putArray("drivers");

    for (Driver d : drivers) {
      ObjectNode node = array.addObject();
      node.put("name", d.getName() != null ? d.getName() : "");
      node.put("nickname", d.getNickname() != null ? d.getNickname() : "");
      String avatar = resolveAvatarExportValue(d.getAvatarUrl(), urlToZipEntryMap);
      if (!avatar.isEmpty()) {
        node.put("avatarUrl", avatar);
      }

      for (String slotKey : AUDIO_SLOT_KEYS) {
        AudioConfig config = getAudioConfigForSlot(d, slotKey);
        if (config == null) continue;

        String key = slotKey + "Audio";
        String type = config.getType();
        if ("none".equalsIgnoreCase(type)) {
          ObjectNode a = node.putObject(key);
          a.put("type", "none");
        } else if ("tts".equalsIgnoreCase(type)) {
          ObjectNode a = node.putObject(key);
          a.put("type", "tts");
          a.put("text", config.getText() != null ? config.getText() : "");
        } else if ("audio_set".equalsIgnoreCase(type)) {
          ObjectNode a = node.putObject(key);
          a.put("type", "audio_set");
          a.put("url", config.getUrl() != null ? config.getUrl() : "");
        } else {
          String url = config.getUrl();
          String finalUrl = urlToZipEntryMap.getOrDefault(url, url);
          ObjectNode a = node.putObject(key);
          a.put("type", "preset");
          a.put("url", finalUrl != null ? finalUrl : "");
        }
      }
    }

    return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(root);
  }

  private String resolveAvatarExportValue(String avatarUrl, Map<String, String> urlToZipEntryMap) {
    if (avatarUrl == null || avatarUrl.trim().isEmpty()) {
      return "";
    }
    String clean = avatarUrl.trim();
    if (urlToZipEntryMap.containsKey(clean)) {
      return urlToZipEntryMap.get(clean);
    }
    // Clean up default helmet urls like /assets/default_black-yellow_Helmet_Black-Yellow
    if (clean.startsWith("/assets/default_") && clean.contains("_Helmet_")) {
      String helmetSuffix = clean.substring(clean.indexOf("_Helmet_") + 8).toLowerCase(Locale.ROOT);
      return "assets/defaults/helmets/helmet_" + helmetSuffix.replace(" ", "_") + ".png";
    }
    return clean;
  }

  private String formatAudioForExport(AudioConfig config, Map<String, String> urlToZipEntryMap) {
    if (config == null) return "";
    String type = config.getType();
    if ("none".equalsIgnoreCase(type)) {
      return "none";
    }
    if ("tts".equalsIgnoreCase(type)) {
      String text = config.getText() != null ? config.getText() : "";
      return "tts:" + text;
    }
    if ("audio_set".equalsIgnoreCase(type)) {
      String url = config.getUrl() != null ? config.getUrl() : "";
      return "audio_set:" + url;
    }

    String url = config.getUrl();
    if (url == null || url.trim().isEmpty()) {
      return "";
    }
    String cleanUrl = url.trim();
    if (urlToZipEntryMap.containsKey(cleanUrl)) {
      return urlToZipEntryMap.get(cleanUrl);
    }
    if (cleanUrl.startsWith("default_")) {
      return "preset:" + cleanUrl;
    }
    return cleanUrl;
  }

  private AudioConfig getAudioConfigForSlot(Driver driver, String slotKey) {
    if (driver == null) return null;
    switch (slotKey) {
      case "lap":
        return driver.getLapAudio();
      case "bestLap":
        return driver.getBestLapAudio();
      case "penalty":
        return driver.getPenaltyAudio();
      case "raceBestLap":
        return driver.getRaceBestLapAudio();
      case "raceLaneBestLap":
        return driver.getRaceLaneBestLapAudio();
      case "heatBestLap":
        return driver.getHeatBestLapAudio();
      case "newRaceLeader":
        return driver.getNewRaceLeaderAudio();
      case "newHeatLeader":
        return driver.getNewHeatLeaderAudio();
      case "overallBestLap":
        return driver.getOverallBestLapAudio();
      case "overallLaneBestLap":
        return driver.getOverallLaneBestLapAudio();
      case "pitIn":
        return driver.getPitInAudio();
      case "fuel":
        return driver.getFuelAudio();
      case "driftLap":
        return driver.getDriftLapAudio();
      default:
        return null;
    }
  }

  private String escapeCsv(String value) {
    if (value == null) return "";
    if (value.contains(",")
        || value.contains("\"")
        || value.contains("\n")
        || value.contains("\r")) {
      return "\"" + value.replace("\"", "\"\"") + "\"";
    }
    return value;
  }

  private byte[] buildZipPackage(
      String dataFileName, byte[] dataFileBytes, Iterable<ExportedMediaFile> mediaFiles)
      throws IOException {

    ByteArrayOutputStream baos = new ByteArrayOutputStream();
    try (ZipOutputStream zos = new ZipOutputStream(baos)) {
      // Primary data file first
      ZipEntry dataEntry = new ZipEntry(dataFileName);
      zos.putNextEntry(dataEntry);
      zos.write(dataFileBytes);
      zos.closeEntry();

      // Companion media files (deduplicated)
      for (ExportedMediaFile media : mediaFiles) {
        ZipEntry mediaEntry = new ZipEntry(media.getZipEntryName());
        zos.putNextEntry(mediaEntry);
        zos.write(media.getData());
        zos.closeEntry();
      }
    }
    return baos.toByteArray();
  }
}
