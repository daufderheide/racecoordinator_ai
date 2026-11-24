package com.antigravity.importer;

import com.antigravity.importer.model.CarImportPreview.FieldChange;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;

/**
 * Reads a slotcar import file (#1210, step 6b): CSV, Excel or JSON, alone or in a ZIP with the car
 * pictures. The fixed columns are recognised by name (with a few aliases, ignoring case, spaces,
 * "_" and "-"); every other column is an own field, named by its header.
 */
public final class CarImportParser {

  public static final String KEY_NAME = "name";
  public static final String KEY_PICTURE = "picture";
  public static final String KEY_MODIFIED = "modified";

  /** The fixed car keys in {@link com.antigravity.importer.model.CarImportRow#getValues}. */
  public static final List<String> VALUE_KEYS =
      Collections.unmodifiableList(
          Arrays.asList(
              KEY_PICTURE,
              "brand",
              "carClass",
              "scale",
              "motor",
              "magnet",
              "chassis",
              "gears",
              "tyres",
              KEY_MODIFIED,
              "notes"));

  private static final Map<String, String> ALIASES = new HashMap<>();

  static {
    alias(KEY_NAME, "name", "car", "carname", "slotcar");
    alias(KEY_PICTURE, "picture", "image", "photo", "avatar", "avatarurl", "pictureurl");
    alias("brand", "brand", "maker", "manufacturer", "brandmaker");
    alias("carClass", "class", "carclass");
    alias("scale", "scale");
    alias("motor", "motor", "engine");
    alias("magnet", "magnet");
    alias("chassis", "chassis");
    alias("gears", "gears", "gearing", "gear");
    alias("tyres", "tyres", "tires", "tyre", "tire");
    alias(KEY_MODIFIED, "modified");
    alias("notes", "notes", "note", "comments");
  }

  private static void alias(String key, String... names) {
    for (String name : names) {
      ALIASES.put(name, key);
    }
  }

  private static final ObjectMapper objectMapper = new ObjectMapper();

  /** One car from the file: the fixed columns by key, the own fields by their header. */
  public static class ParsedCar {
    public final Map<String, String> values = new LinkedHashMap<>();
    public final Map<String, String> customValues = new LinkedHashMap<>();
  }

  /** A parsed file: the cars, the pictures that came with it, and JSON field definitions. */
  public static class ParsedFile {
    public final List<ParsedCar> cars = new ArrayList<>();
    public final Map<String, byte[]> pictures = new HashMap<>();
    public final List<FieldChange> fields = new ArrayList<>();
  }

  private CarImportParser() {}

  /** The car key for a column header, or null when the column is an own field. */
  static String fixedKey(String header) {
    String norm =
        header == null ? "" : header.toLowerCase(Locale.ROOT).replaceAll("[\\s_\\-/]", "");
    return ALIASES.get(norm);
  }

  /**
   * @param data the uploaded file
   * @param fileName its name, for the format (csv, xlsx, xls, json or zip)
   * @param companions pictures uploaded next to it (file name → bytes), may be empty
   */
  public static ParsedFile parse(byte[] data, String fileName, Map<String, byte[]> companions)
      throws IOException {
    String lower = fileName == null ? "" : fileName.toLowerCase(Locale.ROOT);
    ParsedFile result;
    if (lower.endsWith(".zip")) {
      DriverImportParserHelper.ExtractedPackage pkg =
          DriverImportParserHelper.extractZip(new ByteArrayInputStream(data));
      if (pkg.getPrimaryFileData() == null) {
        throw new IllegalArgumentException("The ZIP has no CSV, Excel or JSON file");
      }
      result = parse(pkg.getPrimaryFileData(), pkg.getPrimaryFileName(), null);
      result.pictures.putAll(pkg.getCompanionAssets());
    } else if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
      result = fromTable(readExcel(data));
    } else if (lower.endsWith(".json")) {
      result = parseJson(data);
    } else if (lower.endsWith(".csv") || lower.endsWith(".txt")) {
      result = fromTable(readCsv(new String(data, StandardCharsets.UTF_8)));
    } else {
      throw new IllegalArgumentException("Use a CSV, Excel, JSON or ZIP file");
    }
    if (companions != null) {
      for (Map.Entry<String, byte[]> e : companions.entrySet()) {
        result.pictures.putIfAbsent(e.getKey().toLowerCase(Locale.ROOT), e.getValue());
      }
    }
    return result;
  }

  /** Turns a table (header row first) into cars; rows without any value are left out. */
  static ParsedFile fromTable(List<List<String>> table) {
    ParsedFile result = new ParsedFile();
    int headerIdx = 0;
    while (headerIdx < table.size() && isBlank(table.get(headerIdx))) {
      headerIdx++;
    }
    if (headerIdx >= table.size()) {
      return result;
    }
    List<String> headers = table.get(headerIdx);
    for (int r = headerIdx + 1; r < table.size(); r++) {
      List<String> row = table.get(r);
      if (isBlank(row)) continue;
      ParsedCar car = new ParsedCar();
      for (int c = 0; c < headers.size(); c++) {
        String header = headers.get(c) == null ? "" : headers.get(c).trim();
        if (header.isEmpty()) continue;
        String value = c < row.size() && row.get(c) != null ? row.get(c).trim() : "";
        String key = fixedKey(header);
        if (key != null) {
          car.values.put(key, value);
        } else {
          car.customValues.put(header, value);
        }
      }
      result.cars.add(car);
    }
    return result;
  }

  private static boolean isBlank(List<String> row) {
    for (String v : row) {
      if (v != null && !v.trim().isEmpty()) return false;
    }
    return true;
  }

  /**
   * CSV as written by spreadsheets: quoted values may hold the delimiter, quotes ("") and line
   * breaks. The delimiter (comma, semicolon or tab) is the most frequent one in the header line.
   */
  static List<List<String>> readCsv(String text) {
    if (text.startsWith("﻿")) text = text.substring(1);
    String firstLine = text.split("\r?\n", 2)[0];
    char delimiter = DriverImportParserHelper.detectDelimiter(firstLine);
    List<List<String>> rows = new ArrayList<>();
    List<String> row = new ArrayList<>();
    StringBuilder cell = new StringBuilder();
    boolean quoted = false;
    for (int i = 0; i < text.length(); i++) {
      char ch = text.charAt(i);
      if (quoted) {
        if (ch == '"' && i + 1 < text.length() && text.charAt(i + 1) == '"') {
          cell.append('"');
          i++;
        } else if (ch == '"') {
          quoted = false;
        } else {
          cell.append(ch);
        }
      } else if (ch == '"') {
        quoted = true;
      } else if (ch == delimiter) {
        row.add(cell.toString());
        cell.setLength(0);
      } else if (ch == '\n' || ch == '\r') {
        if (ch == '\r' && i + 1 < text.length() && text.charAt(i + 1) == '\n') i++;
        row.add(cell.toString());
        cell.setLength(0);
        rows.add(row);
        row = new ArrayList<>();
      } else {
        cell.append(ch);
      }
    }
    if (cell.length() > 0 || !row.isEmpty()) {
      row.add(cell.toString());
      rows.add(row);
    }
    return rows;
  }

  /** The first sheet, every cell as text (whole numbers without ".0"). */
  static List<List<String>> readExcel(byte[] data) throws IOException {
    List<List<String>> rows = new ArrayList<>();
    try (Workbook wb = WorkbookFactory.create(new ByteArrayInputStream(data))) {
      if (wb.getNumberOfSheets() == 0) return rows;
      Sheet sheet = wb.getSheetAt(0);
      int width = 0;
      for (Row row : sheet) {
        width = Math.max(width, row.getLastCellNum());
      }
      for (int r = 0; r <= sheet.getLastRowNum(); r++) {
        Row row = sheet.getRow(r);
        List<String> values = new ArrayList<>();
        for (int c = 0; c < width; c++) {
          values.add(row == null ? "" : cellText(row.getCell(c)));
        }
        rows.add(values);
      }
    }
    return rows;
  }

  private static String cellText(Cell cell) {
    if (cell == null) return "";
    CellType type = cell.getCellType();
    if (type == CellType.FORMULA) type = cell.getCachedFormulaResultType();
    switch (type) {
      case STRING:
        return cell.getStringCellValue();
      case NUMERIC:
        double num = cell.getNumericCellValue();
        return num == (long) num ? String.valueOf((long) num) : String.valueOf(num);
      case BOOLEAN:
        return cell.getBooleanCellValue() ? "Yes" : "No";
      default:
        return "";
    }
  }

  /**
   * JSON as the car export writes it: {@code {fields: [...], cars: [...]}}, or just the array of
   * cars. A car's {@code customValues} is an object keyed by field name.
   */
  static ParsedFile parseJson(byte[] data) throws IOException {
    JsonNode root = objectMapper.readTree(data);
    ParsedFile result = new ParsedFile();
    JsonNode cars = root.isArray() ? root : root.path("cars");
    JsonNode fields = root.isObject() ? root.path("fields") : null;
    if (fields != null && fields.isArray()) {
      for (JsonNode f : fields) {
        String name = f.path("name").asText("").trim();
        if (name.isEmpty()) continue;
        List<String> options = new ArrayList<>();
        for (JsonNode o : f.path("options")) {
          options.add(o.asText());
        }
        result.fields.add(new FieldChange(name, f.path("type").asText("text"), options));
      }
    }
    if (!cars.isArray()) {
      throw new IllegalArgumentException("The JSON file has no list of cars");
    }
    for (JsonNode node : cars) {
      ParsedCar car = new ParsedCar();
      Iterator<Map.Entry<String, JsonNode>> it = node.fields();
      while (it.hasNext()) {
        Map.Entry<String, JsonNode> e = it.next();
        if ("customValues".equals(e.getKey()) && e.getValue().isObject()) {
          Iterator<Map.Entry<String, JsonNode>> cv = e.getValue().fields();
          while (cv.hasNext()) {
            Map.Entry<String, JsonNode> v = cv.next();
            car.customValues.put(v.getKey().trim(), jsonText(v.getValue()));
          }
          continue;
        }
        String key = fixedKey(e.getKey());
        if (key != null) {
          car.values.put(key, jsonText(e.getValue()));
        }
      }
      result.cars.add(car);
    }
    return result;
  }

  private static String jsonText(JsonNode value) {
    if (value == null || value.isNull()) return "";
    if (value.isBoolean()) return value.asBoolean() ? "Yes" : "No";
    return value.asText("").trim();
  }
}
