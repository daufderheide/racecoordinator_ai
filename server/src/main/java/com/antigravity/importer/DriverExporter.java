package com.antigravity.importer;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.AudioConfig;
import com.antigravity.models.Driver;
import com.antigravity.models.DriverLabel;
import com.antigravity.repository.SqliteRepository;
import com.antigravity.service.AssetService;
import com.antigravity.util.LogicalSortComparator;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

public class DriverExporter {

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
  private final SqliteRepository<DriverLabel> driverLabelRepository;

  public DriverExporter(
      DatabaseContext databaseContext,
      SqliteRepository<Driver> driverRepository,
      AssetService assetService,
      SqliteRepository<DriverLabel> driverLabelRepository) {
    this.databaseContext = databaseContext;
    this.driverRepository = driverRepository;
    this.assetService = assetService;
    this.driverLabelRepository =
        driverLabelRepository != null
            ? driverLabelRepository
            : (databaseContext != null
                ? new SqliteRepository<>(databaseContext, "driver_labels", DriverLabel.class)
                : null);
  }

  public DriverExporter(
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

  public byte[] exportDriversZip(List<Driver> drivers, String format) throws IOException {
    List<Driver> targetDrivers = prepareDrivers(drivers);
    List<DriverLabel> possibleLabels = resolvePossibleLabels(targetDrivers);
    String normalizedFormat = normalizeFormat(format);

    // Collect and deduplicate companion media assets (sound and avatar)
    ExportMediaCollector media = new ExportMediaCollector(databaseContext, assetService);
    for (Driver driver : targetDrivers) {
      collectDriverMedia(driver, media);
    }
    Map<String, String> urlToZipEntryMap = media.getUrlToZipEntryMap();

    // Generate primary data file bytes based on requested format
    byte[] dataFileBytes;
    String dataFileName;
    switch (normalizedFormat) {
      case "xlsx":
      case "xls":
        dataFileName = "drivers.xlsx";
        dataFileBytes = generateExcelBytes(targetDrivers, urlToZipEntryMap, possibleLabels);
        break;
      case "json":
        dataFileName = "drivers.json";
        dataFileBytes = generateJsonBytes(targetDrivers, urlToZipEntryMap, possibleLabels);
        break;
      case "csv":
      default:
        dataFileName = "drivers.csv";
        dataFileBytes = generateCsvBytes(targetDrivers, urlToZipEntryMap, possibleLabels);
        break;
    }

    // Bundle data file and companion assets into a ZIP archive
    return ExportMediaCollector.buildZip(dataFileName, dataFileBytes, media.getFiles());
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
        (d1, d2) -> {
          String n1 = d1 != null && d1.getName() != null ? d1.getName() : "";
          String n2 = d2 != null && d2.getName() != null ? d2.getName() : "";
          int cmp = LogicalSortComparator.INSTANCE.compare(n1, n2);
          if (cmp != 0) return cmp;
          String nick1 = d1 != null && d1.getNickname() != null ? d1.getNickname() : "";
          String nick2 = d2 != null && d2.getNickname() != null ? d2.getNickname() : "";
          cmp = LogicalSortComparator.INSTANCE.compare(nick1, nick2);
          if (cmp != 0) return cmp;
          String id1 = d1 != null && d1.getEntityId() != null ? d1.getEntityId() : "";
          String id2 = d2 != null && d2.getEntityId() != null ? d2.getEntityId() : "";
          return id1.compareTo(id2);
        });
    return result;
  }

  private List<DriverLabel> resolvePossibleLabels(List<Driver> drivers) {
    Map<String, DriverLabel> labelMap = new LinkedHashMap<>();

    if (driverLabelRepository != null) {
      List<DriverLabel> fromDb = driverLabelRepository.findAll();
      if (fromDb != null) {
        for (DriverLabel lbl : fromDb) {
          if (lbl != null && lbl.getName() != null && !lbl.getName().trim().isEmpty()) {
            labelMap.put(lbl.getEntityId() != null ? lbl.getEntityId() : lbl.getName().trim(), lbl);
          }
        }
      }
    }

    // Also check drivers in case any driver references a label not found in DB
    if (drivers != null) {
      for (Driver d : drivers) {
        if (d != null && d.getLabelIds() != null) {
          for (String lblId : d.getLabelIds()) {
            if (lblId != null && !lblId.trim().isEmpty() && !labelMap.containsKey(lblId)) {
              if (driverLabelRepository != null) {
                DriverLabel found = driverLabelRepository.findByEntityId(lblId);
                if (found != null) {
                  labelMap.put(found.getEntityId(), found);
                  continue;
                }
              }
              labelMap.put(lblId, new DriverLabel(lblId, "#3b82f6", lblId, lblId));
            }
          }
        }
      }
    }

    List<DriverLabel> result = new ArrayList<>(labelMap.values());
    result.sort(
        (l1, l2) -> {
          String n1 = l1 != null && l1.getName() != null ? l1.getName() : "";
          String n2 = l2 != null && l2.getName() != null ? l2.getName() : "";
          int cmp = LogicalSortComparator.INSTANCE.compare(n1, n2);
          if (cmp != 0) return cmp;
          String id1 = l1 != null && l1.getEntityId() != null ? l1.getEntityId() : "";
          String id2 = l2 != null && l2.getEntityId() != null ? l2.getEntityId() : "";
          return id1.compareTo(id2);
        });
    return result;
  }

  private boolean driverHasLabel(Driver driver, DriverLabel label) {
    if (driver == null || label == null || driver.getLabelIds() == null) {
      return false;
    }
    String labelId = label.getEntityId();
    String id = label.getId();
    String name = label.getName();
    for (String assigned : driver.getLabelIds()) {
      if (assigned == null) continue;
      if (labelId != null && assigned.equalsIgnoreCase(labelId)) {
        return true;
      }
      if (id != null && assigned.equalsIgnoreCase(id)) {
        return true;
      }
      if (name != null && !name.isEmpty() && assigned.equalsIgnoreCase(name)) {
        return true;
      }
    }
    return false;
  }

  private String normalizeFormat(String format) {
    if (format == null) return "csv";
    String clean = format.trim().toLowerCase(Locale.ROOT);
    if ("xlsx".equals(clean) || "xls".equals(clean)) return "xlsx";
    if ("json".equals(clean)) return "json";
    return "csv";
  }

  private void collectDriverMedia(Driver driver, ExportMediaCollector media) {
    // Avatar
    media.add(driver.getAvatarUrl(), ExportMediaCollector.IMAGE);

    // Audio Slots
    for (String slotKey : AUDIO_SLOT_KEYS) {
      AudioConfig config = getAudioConfigForSlot(driver, slotKey);
      if (config == null) continue;
      String type = config.getType();
      if ("preset".equalsIgnoreCase(type) || type == null || type.trim().isEmpty()) {
        media.add(config.getUrl(), ExportMediaCollector.SOUND);
      }
    }
  }

  /**
   * The audio column headers, one per {@link #AUDIO_SLOT_KEYS} entry and in the same order as the
   * values each row writes ("lap" becomes "Lap", "driftLap" becomes "DriftLap"). Building them from
   * the same list keeps every value under its own header; the importer reads these names back.
   */
  static List<String> audioHeaders() {
    List<String> headers = new ArrayList<>();
    for (String key : AUDIO_SLOT_KEYS) {
      headers.add(Character.toUpperCase(key.charAt(0)) + key.substring(1));
    }
    return headers;
  }

  private byte[] generateCsvBytes(
      List<Driver> drivers,
      Map<String, String> urlToZipEntryMap,
      List<DriverLabel> possibleLabels) {
    StringBuilder sb = new StringBuilder();
    sb.append("# default-audio: system\n");
    sb.append("Name,Nickname,Avatar");
    for (int i = 0; i < possibleLabels.size(); i++) {
      sb.append(",Label ").append(i + 1);
    }
    for (String header : audioHeaders()) {
      sb.append(",").append(header);
    }
    sb.append("\n");

    for (Driver d : drivers) {
      String name = escapeCsv(d.getName());
      String nick = escapeCsv(d.getNickname());
      String avatar = escapeCsv(resolveAvatarExportValue(d.getAvatarUrl(), urlToZipEntryMap));

      sb.append(name).append(",").append(nick).append(",").append(avatar);
      for (DriverLabel lbl : possibleLabels) {
        sb.append(",").append(driverHasLabel(d, lbl) ? escapeCsv(lbl.getName()) : "");
      }
      for (String slotKey : AUDIO_SLOT_KEYS) {
        AudioConfig config = getAudioConfigForSlot(d, slotKey);
        String val = formatAudioForExport(config, urlToZipEntryMap);
        sb.append(",").append(escapeCsv(val));
      }
      sb.append("\n");
    }

    return sb.toString().getBytes(StandardCharsets.UTF_8);
  }

  private byte[] generateExcelBytes(
      List<Driver> drivers, Map<String, String> urlToZipEntryMap, List<DriverLabel> possibleLabels)
      throws IOException {
    try (Workbook wb = new XSSFWorkbook();
        ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

      Sheet sheet = wb.createSheet("Drivers");
      CellStyle headerStyle = wb.createCellStyle();
      Font font = wb.createFont();
      font.setBold(true);
      headerStyle.setFont(font);

      Row headerRow = sheet.createRow(0);
      List<String> headerList = new ArrayList<>();
      headerList.add("Name");
      headerList.add("Nickname");
      headerList.add("Avatar");
      for (int i = 0; i < possibleLabels.size(); i++) {
        headerList.add("Label " + (i + 1));
      }
      headerList.addAll(audioHeaders());

      for (int i = 0; i < headerList.size(); i++) {
        Cell c = headerRow.createCell(i);
        c.setCellValue(headerList.get(i));
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
        for (DriverLabel lbl : possibleLabels) {
          row.createCell(colIdx++).setCellValue(driverHasLabel(d, lbl) ? lbl.getName() : "");
        }
        for (String slotKey : AUDIO_SLOT_KEYS) {
          AudioConfig config = getAudioConfigForSlot(d, slotKey);
          String val = formatAudioForExport(config, urlToZipEntryMap);
          row.createCell(colIdx++).setCellValue(val);
        }
      }

      for (int i = 0; i < headerList.size(); i++) {
        sheet.autoSizeColumn(i);
      }

      wb.write(baos);
      return baos.toByteArray();
    }
  }

  private byte[] generateJsonBytes(
      List<Driver> drivers, Map<String, String> urlToZipEntryMap, List<DriverLabel> possibleLabels)
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

      ArrayNode labelsArray = node.putArray("labels");
      for (int i = 0; i < possibleLabels.size(); i++) {
        DriverLabel lbl = possibleLabels.get(i);
        if (driverHasLabel(d, lbl)) {
          labelsArray.add(lbl.getName());
          node.put("label" + (i + 1), lbl.getName());
        }
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
          String lookupKey = url != null ? url.trim() : "";
          String finalUrl = urlToZipEntryMap.get(lookupKey);
          if (finalUrl == null && lookupKey.toLowerCase(Locale.ROOT).startsWith("preset:")) {
            finalUrl = urlToZipEntryMap.get(lookupKey.substring(7).trim());
          }
          if (finalUrl == null) {
            finalUrl = lookupKey;
          }
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
    if (cleanUrl.toLowerCase(Locale.ROOT).startsWith("preset:")) {
      String without = cleanUrl.substring(7).trim();
      if (urlToZipEntryMap.containsKey(without)) {
        return urlToZipEntryMap.get(without);
      }
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
}
