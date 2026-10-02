package com.antigravity.importer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;

public final class DriverImportParserHelper {

  private static final ObjectMapper objectMapper = new ObjectMapper();

  public static class ParsedDataFile {
    private String detectedAudioDefault = "system";
    private List<Map<String, String>> rows = new ArrayList<>();

    public String getDetectedAudioDefault() {
      return detectedAudioDefault;
    }

    public void setDetectedAudioDefault(String detectedAudioDefault) {
      this.detectedAudioDefault = detectedAudioDefault;
    }

    public List<Map<String, String>> getRows() {
      return rows;
    }
  }

  public static class ExtractedPackage {
    private String primaryFileName;
    private byte[] primaryFileData;
    private final Map<String, byte[]> companionAssets = new HashMap<>();

    public String getPrimaryFileName() {
      return primaryFileName;
    }

    public void setPrimaryFileName(String primaryFileName) {
      this.primaryFileName = primaryFileName;
    }

    public byte[] getPrimaryFileData() {
      return primaryFileData;
    }

    public void setPrimaryFileData(byte[] primaryFileData) {
      this.primaryFileData = primaryFileData;
    }

    public Map<String, byte[]> getCompanionAssets() {
      return companionAssets;
    }
  }

  private DriverImportParserHelper() {}

  public static String normalizeHeader(String header) {
    if (header == null) return "";
    String clean = header.trim().toLowerCase(Locale.ROOT).replaceAll("[\\s_-]+", "");
    switch (clean) {
      case "name":
      case "driver":
      case "drivername":
      case "fullname":
        return "name";
      case "nickname":
      case "nick":
      case "callsign":
      case "alias":
      case "shortname":
        return "nickname";
      case "avatar":
      case "avatarurl":
      case "image":
      case "photo":
      case "picture":
        return "avatar";
      case "defaultaudio":
      case "audiodefault":
      case "defaultsound":
      case "sounddefault":
        return "default_audio";
      case "lap":
      case "lapsound":
      case "lapaudio":
        return "lap";
      case "bestlap":
      case "bestlapsound":
      case "personalbest":
      case "personalbestsound":
        return "bestLap";
      case "penalty":
      case "penaltysound":
      case "falsestart":
      case "falsestartsound":
        return "penalty";
      case "racebestlap":
      case "racebestlapsound":
        return "raceBestLap";
      case "racelanebestlap":
      case "racelanebestlapsound":
        return "raceLaneBestLap";
      case "heatbestlap":
      case "heatbestlapsound":
        return "heatBestLap";
      case "newraceleader":
      case "newraceleadersound":
        return "newRaceLeader";
      case "newheatleader":
      case "newheatleadersound":
        return "newHeatLeader";
      case "overallbestlap":
      case "overallbestlapsound":
        return "overallBestLap";
      case "overalllanebestlap":
      case "overalllanebestlapsound":
        return "overallLaneBestLap";
      case "pitin":
      case "pitinsound":
        return "pitIn";
      case "fuel":
      case "fuelsound":
        return "fuel";
      default:
        return header.trim();
    }
  }

  public static ParsedDataFile parseCsv(InputStream is) throws IOException {
    ParsedDataFile result = new ParsedDataFile();
    BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8));
    String line;
    List<String> headers = null;
    char delimiter = ',';

    while ((line = reader.readLine()) != null) {
      String trimmed = line.trim();
      if (trimmed.isEmpty()) continue;

      if (trimmed.startsWith("#")) {
        parseDirective(trimmed, result);
        continue;
      }

      if (headers == null) {
        delimiter = detectDelimiter(line);
        headers = parseCsvLine(line, delimiter);
        continue;
      }

      List<String> values = parseCsvLine(line, delimiter);
      Map<String, String> row = mapHeadersToValues(headers, values);
      if (!row.isEmpty()) {
        result.getRows().add(row);
      }
    }
    return result;
  }

  private static void parseDirective(String line, ParsedDataFile result) {
    String lower = line.toLowerCase(Locale.ROOT);
    if (lower.contains("default-audio:") || lower.contains("default_audio:")) {
      int idx = line.indexOf(':');
      if (idx >= 0) {
        String val = line.substring(idx + 1).trim().toLowerCase(Locale.ROOT);
        if ("none".equals(val) || "mute".equals(val)) {
          result.setDetectedAudioDefault("none");
        } else if ("system".equals(val) || "default".equals(val)) {
          result.setDetectedAudioDefault("system");
        }
      }
    }
  }

  public static char detectDelimiter(String line) {
    int commas = countOccurrences(line, ',');
    int semicolons = countOccurrences(line, ';');
    int tabs = countOccurrences(line, '\t');
    if (semicolons > commas && semicolons > tabs) return ';';
    if (tabs > commas && tabs > semicolons) return '\t';
    return ',';
  }

  private static int countOccurrences(String str, char c) {
    int count = 0;
    for (int i = 0; i < str.length(); i++) {
      if (str.charAt(i) == c) count++;
    }
    return count;
  }

  public static List<String> parseCsvLine(String line, char delimiter) {
    List<String> tokens = new ArrayList<>();
    StringBuilder sb = new StringBuilder();
    boolean inQuotes = false;
    for (int i = 0; i < line.length(); i++) {
      char c = line.charAt(i);
      if (c == '"') {
        if (inQuotes && i + 1 < line.length() && line.charAt(i + 1) == '"') {
          sb.append('"');
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c == delimiter && !inQuotes) {
        tokens.add(sb.toString().trim());
        sb.setLength(0);
      } else {
        sb.append(c);
      }
    }
    tokens.add(sb.toString().trim());
    return tokens;
  }

  public static ParsedDataFile parseExcel(InputStream is) throws IOException {
    ParsedDataFile result = new ParsedDataFile();
    try (Workbook wb = WorkbookFactory.create(is)) {
      Sheet sheet = wb.getNumberOfSheets() > 0 ? wb.getSheetAt(0) : null;
      if (sheet == null) return result;

      List<String> headers = null;
      for (Row row : sheet) {
        if (headers == null) {
          headers = new ArrayList<>();
          for (Cell cell : row) {
            String val = getCellValueAsString(cell);
            if (val.startsWith("#")) {
              parseDirective(val, result);
            } else {
              headers.add(val);
            }
          }
          if (headers.isEmpty() || headers.stream().allMatch(String::isEmpty)) {
            headers = null;
          }
          continue;
        }

        List<String> values = new ArrayList<>();
        boolean hasContent = false;
        for (int c = 0; c < headers.size(); c++) {
          Cell cell = row.getCell(c, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
          String val = getCellValueAsString(cell);
          if (!val.isEmpty()) hasContent = true;
          values.add(val);
        }
        if (hasContent) {
          Map<String, String> mapped = mapHeadersToValues(headers, values);
          if (!mapped.isEmpty()) {
            result.getRows().add(mapped);
          }
        }
      }
    }
    return result;
  }

  private static String getCellValueAsString(Cell cell) {
    if (cell == null) return "";
    CellType type = cell.getCellType();
    if (type == CellType.FORMULA) {
      type = cell.getCachedFormulaResultType();
    }
    switch (type) {
      case STRING:
        return cell.getStringCellValue().trim();
      case NUMERIC:
        double num = cell.getNumericCellValue();
        if (num == (long) num) {
          return String.valueOf((long) num);
        }
        return String.valueOf(num);
      case BOOLEAN:
        return String.valueOf(cell.getBooleanCellValue());
      default:
        return "";
    }
  }

  public static ParsedDataFile parseJson(InputStream is) throws IOException {
    ParsedDataFile result = new ParsedDataFile();
    JsonNode root = objectMapper.readTree(is);

    if (root.has("defaultAudio")) {
      String def = root.get("defaultAudio").asText("system").toLowerCase(Locale.ROOT);
      if ("none".equals(def) || "mute".equals(def)) {
        result.setDetectedAudioDefault("none");
      }
    }

    JsonNode array = root.isArray() ? root : (root.has("drivers") ? root.get("drivers") : null);
    if (array != null && array.isArray()) {
      for (JsonNode item : array) {
        Map<String, String> row = new HashMap<>();
        if (item.has("name")) row.put("name", item.get("name").asText(""));
        if (item.has("nickname")) row.put("nickname", item.get("nickname").asText(""));
        if (item.has("avatarUrl")) row.put("avatar", item.get("avatarUrl").asText(""));
        if (item.has("defaultAudio")) row.put("default_audio", item.get("defaultAudio").asText(""));

        // Audio configs
        String[] slots = {
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
        for (String slot : slots) {
          String key = slot + "Audio";
          if (item.has(key)) {
            JsonNode aNode = item.get(key);
            if (aNode.isTextual()) {
              row.put(slot, aNode.asText());
            } else if (aNode.isObject()) {
              String type = aNode.has("type") ? aNode.get("type").asText() : "preset";
              String url = aNode.has("url") ? aNode.get("url").asText() : "";
              String text = aNode.has("text") ? aNode.get("text").asText() : "";
              if ("none".equalsIgnoreCase(type)) {
                row.put(slot, "none");
              } else if ("tts".equalsIgnoreCase(type)) {
                row.put(slot, "tts:" + text);
              } else {
                row.put(slot, url);
              }
            }
          }
        }
        if (!row.isEmpty()) {
          result.getRows().add(row);
        }
      }
    }
    return result;
  }

  public static ExtractedPackage extractZip(InputStream is) throws IOException {
    ExtractedPackage pkg = new ExtractedPackage();
    try (ZipInputStream zis = new ZipInputStream(is)) {
      ZipEntry entry;
      while ((entry = zis.getNextEntry()) != null) {
        if (entry.isDirectory()) continue;
        String name = entry.getName();
        // Ignore OS X metadata
        if (name.startsWith("__MACOSX") || name.endsWith(".DS_Store")) continue;

        byte[] data = readAllBytesFromStream(zis);
        String lowerName = name.toLowerCase(Locale.ROOT);
        String simpleName = getSimpleFileName(name);

        if (lowerName.endsWith(".csv")
            || lowerName.endsWith(".xlsx")
            || lowerName.endsWith(".xls")
            || lowerName.endsWith(".json")) {
          if (pkg.getPrimaryFileData() == null) {
            pkg.setPrimaryFileName(simpleName);
            pkg.setPrimaryFileData(data);
          }
        } else if (isMediaFile(lowerName)) {
          pkg.getCompanionAssets().put(simpleName.toLowerCase(Locale.ROOT), data);
        }
      }
    }
    return pkg;
  }

  private static boolean isMediaFile(String name) {
    return name.endsWith(".wav")
        || name.endsWith(".mp3")
        || name.endsWith(".ogg")
        || name.endsWith(".png")
        || name.endsWith(".jpg")
        || name.endsWith(".jpeg")
        || name.endsWith(".webp")
        || name.endsWith(".gif");
  }

  private static String getSimpleFileName(String path) {
    int idx = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
    return idx >= 0 ? path.substring(idx + 1) : path;
  }

  public static byte[] readAllBytesFromStream(InputStream is) throws IOException {
    ByteArrayOutputStream baos = new ByteArrayOutputStream();
    byte[] buf = new byte[8192];
    int len;
    while ((len = is.read(buf)) != -1) {
      baos.write(buf, 0, len);
    }
    return baos.toByteArray();
  }

  private static Map<String, String> mapHeadersToValues(List<String> headers, List<String> values) {
    Map<String, String> row = new HashMap<>();
    for (int i = 0; i < headers.size() && i < values.size(); i++) {
      String norm = normalizeHeader(headers.get(i));
      String val = values.get(i).trim();
      if (!norm.isEmpty() && !val.isEmpty()) {
        row.put(norm, val);
      }
    }
    return row;
  }
}
