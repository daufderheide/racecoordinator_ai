package com.antigravity.importer;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.Car;
import com.antigravity.models.CarField;
import com.antigravity.service.AssetService;
import com.antigravity.util.LogicalSortComparator;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
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

/**
 * Exports slotcars (#1210, step 6a) as a ZIP: a data file (CSV, XLSX or JSON) and the car pictures
 * under {@code images/}, collected once each by {@link ExportMediaCollector}.
 *
 * <p>The user's own fields go out as one column per field, named by the field's name: field ids
 * differ between databases, names don't. Car ids are left out for the same reason.
 */
public class CarExporter {

  /** The fixed columns, in file order. The importer reads these names back. */
  public static final List<String> FIXED_HEADERS =
      Collections.unmodifiableList(
          Arrays.asList(
              "Name",
              "Picture",
              "Brand",
              "Class",
              "Scale",
              "Motor",
              "Magnet",
              "Chassis",
              "Gears",
              "Tyres",
              "Modified",
              "Notes"));

  static final String YES = "Yes";
  static final String NO = "No";

  private static final ObjectMapper objectMapper = new ObjectMapper();

  private final DatabaseContext databaseContext;
  private final AssetService assetService;

  public CarExporter(DatabaseContext databaseContext, AssetService assetService) {
    this.databaseContext = databaseContext;
    this.assetService = assetService;
  }

  /**
   * @param cars the cars to export
   * @param fields the user's own fields; one column each
   * @param format "csv" (default), "xlsx" or "json"
   */
  public byte[] exportCarsZip(List<Car> cars, List<CarField> fields, String format)
      throws IOException {
    List<Car> sortedCars = sortCars(cars);
    List<CarField> sortedFields = sortFields(fields);

    ExportMediaCollector media = new ExportMediaCollector(databaseContext, assetService);
    for (Car car : sortedCars) {
      media.add(car.getAvatarUrl(), ExportMediaCollector.IMAGE);
    }
    Map<String, String> pictures = media.getUrlToZipEntryMap();

    String dataFileName;
    byte[] data;
    switch (normalizeFormat(format)) {
      case "xlsx":
        dataFileName = "cars.xlsx";
        data = excelBytes(sortedCars, sortedFields, pictures);
        break;
      case "json":
        dataFileName = "cars.json";
        data = jsonBytes(sortedCars, sortedFields, pictures);
        break;
      default:
        dataFileName = "cars.csv";
        data = csvBytes(sortedCars, sortedFields, pictures);
        break;
    }
    return ExportMediaCollector.buildZip(dataFileName, data, media.getFiles());
  }

  /** The header row: the fixed columns, then one per own field. */
  static List<String> headers(List<CarField> fields) {
    List<String> headers = new ArrayList<>(FIXED_HEADERS);
    for (CarField field : fields) {
      headers.add(field.getName());
    }
    return headers;
  }

  /** One row of values, in {@link #headers} order. */
  static List<String> row(Car car, List<CarField> fields, Map<String, String> pictures) {
    List<String> row = new ArrayList<>();
    row.add(text(car.getName()));
    row.add(pictureValue(car.getAvatarUrl(), pictures));
    row.add(text(car.getBrand()));
    row.add(text(car.getCarClass()));
    row.add(text(car.getScale()));
    row.add(text(car.getMotor()));
    row.add(text(car.getMagnet()));
    row.add(text(car.getChassis()));
    row.add(text(car.getGears()));
    row.add(text(car.getTyres()));
    row.add(car.isModified() ? YES : NO);
    row.add(text(car.getNotes()));
    for (CarField field : fields) {
      row.add(text(car.getCustomValues().get(field.getEntityId())));
    }
    return row;
  }

  private static String pictureValue(String url, Map<String, String> pictures) {
    if (url == null || url.trim().isEmpty()) {
      return "";
    }
    String entry = pictures.get(url.trim());
    return entry != null ? entry : url.trim();
  }

  private static String text(String value) {
    return value != null ? value : "";
  }

  private static String normalizeFormat(String format) {
    String clean = format != null ? format.trim().toLowerCase(Locale.ROOT) : "";
    if ("xlsx".equals(clean) || "xls".equals(clean)) return "xlsx";
    if ("json".equals(clean)) return "json";
    return "csv";
  }

  private static List<Car> sortCars(List<Car> cars) {
    List<Car> list = new ArrayList<>();
    if (cars != null) {
      for (Car car : cars) {
        if (car != null) list.add(car);
      }
    }
    list.sort(
        (a, b) -> {
          int cmp = LogicalSortComparator.INSTANCE.compare(text(a.getName()), text(b.getName()));
          return cmp != 0 ? cmp : text(a.getEntityId()).compareTo(text(b.getEntityId()));
        });
    return list;
  }

  private static List<CarField> sortFields(List<CarField> fields) {
    List<CarField> list = new ArrayList<>();
    if (fields != null) {
      for (CarField field : fields) {
        if (field != null && field.getName() != null && !field.getName().trim().isEmpty()) {
          list.add(field);
        }
      }
    }
    list.sort(
        (a, b) ->
            a.getPosition() != b.getPosition()
                ? Integer.compare(a.getPosition(), b.getPosition())
                : LogicalSortComparator.INSTANCE.compare(a.getName(), b.getName()));
    return list;
  }

  private static byte[] csvBytes(
      List<Car> cars, List<CarField> fields, Map<String, String> pictures) {
    StringBuilder sb = new StringBuilder();
    appendCsvLine(sb, headers(fields));
    for (Car car : cars) {
      appendCsvLine(sb, row(car, fields, pictures));
    }
    return sb.toString().getBytes(StandardCharsets.UTF_8);
  }

  private static void appendCsvLine(StringBuilder sb, List<String> values) {
    for (int i = 0; i < values.size(); i++) {
      if (i > 0) sb.append(',');
      sb.append(escapeCsv(values.get(i)));
    }
    sb.append('\n');
  }

  static String escapeCsv(String value) {
    if (value == null) return "";
    if (value.contains(",")
        || value.contains("\"")
        || value.contains("\n")
        || value.contains("\r")) {
      return "\"" + value.replace("\"", "\"\"") + "\"";
    }
    return value;
  }

  private static byte[] excelBytes(
      List<Car> cars, List<CarField> fields, Map<String, String> pictures) throws IOException {
    try (Workbook wb = new XSSFWorkbook();
        ByteArrayOutputStream out = new ByteArrayOutputStream()) {
      Sheet sheet = wb.createSheet("Cars");
      CellStyle headerStyle = wb.createCellStyle();
      Font bold = wb.createFont();
      bold.setBold(true);
      headerStyle.setFont(bold);

      List<String> headers = headers(fields);
      Row headerRow = sheet.createRow(0);
      for (int i = 0; i < headers.size(); i++) {
        Cell cell = headerRow.createCell(i);
        cell.setCellValue(headers.get(i));
        cell.setCellStyle(headerStyle);
      }
      int rowIdx = 1;
      for (Car car : cars) {
        Row row = sheet.createRow(rowIdx++);
        List<String> values = row(car, fields, pictures);
        for (int i = 0; i < values.size(); i++) {
          row.createCell(i).setCellValue(values.get(i));
        }
      }
      for (int i = 0; i < headers.size(); i++) {
        sheet.autoSizeColumn(i);
      }
      wb.write(out);
      return out.toByteArray();
    }
  }

  private static byte[] jsonBytes(
      List<Car> cars, List<CarField> fields, Map<String, String> pictures) throws IOException {
    ObjectNode root = objectMapper.createObjectNode();
    ArrayNode fieldArray = root.putArray("fields");
    for (CarField field : fields) {
      ObjectNode node = fieldArray.addObject();
      node.put("name", field.getName());
      node.put("type", text(field.getType()));
      ArrayNode options = node.putArray("options");
      for (String option : field.getOptions()) {
        options.add(option);
      }
    }
    ArrayNode carArray = root.putArray("cars");
    for (Car car : cars) {
      ObjectNode node = carArray.addObject();
      node.put("name", text(car.getName()));
      node.put("picture", pictureValue(car.getAvatarUrl(), pictures));
      node.put("brand", text(car.getBrand()));
      node.put("carClass", text(car.getCarClass()));
      node.put("scale", text(car.getScale()));
      node.put("motor", text(car.getMotor()));
      node.put("magnet", text(car.getMagnet()));
      node.put("chassis", text(car.getChassis()));
      node.put("gears", text(car.getGears()));
      node.put("tyres", text(car.getTyres()));
      node.put("modified", car.isModified());
      node.put("notes", text(car.getNotes()));
      ObjectNode values = node.putObject("customValues");
      for (CarField field : fields) {
        String value = car.getCustomValues().get(field.getEntityId());
        if (value != null && !value.isEmpty()) {
          values.put(field.getName(), value);
        }
      }
    }
    return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(root);
  }
}
