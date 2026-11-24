package com.antigravity.importer;

import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.Car;
import com.antigravity.models.CarField;
import com.antigravity.proto.AssetMessage;
import com.antigravity.service.AssetService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;

public class CarExporterTest {

  @Rule public TemporaryFolder tempFolder = new TemporaryFolder();

  private DatabaseContext databaseContext;
  private AssetService assetService;
  private CarExporter exporter;

  private final CarField weight =
      new CarField("Weight (g)", CarField.TYPE_NUMBER, null, 1, "f-weight", null);
  private final CarField compound =
      new CarField(
          "Compound", CarField.TYPE_CHOICE, Arrays.asList("Soft", "Hard"), 0, "f-compound", null);

  @Before
  public void setUp() throws Exception {
    String rootDir = tempFolder.newFolder("db_root").getAbsolutePath() + File.separator;
    databaseContext = new DatabaseContext("test_db", null, rootDir);
    File assetsDir = new File(new File(databaseContext.getDataRoot(), "test_db"), "assets");
    assetService = new AssetService(databaseContext, assetsDir.getAbsolutePath());
    exporter = new CarExporter(databaseContext, assetService);
  }

  @After
  public void tearDown() {
    if (databaseContext != null && databaseContext.getConnection() != null) {
      try {
        databaseContext.getConnection().close();
      } catch (Exception ignored) {
      }
    }
  }

  private static Map<String, String> values(String... keyValues) {
    Map<String, String> map = new LinkedHashMap<>();
    for (int i = 0; i < keyValues.length; i += 2) {
      map.put(keyValues[i], keyValues[i + 1]);
    }
    return map;
  }

  private Car porsche(String pictureUrl) {
    return new Car.Builder()
        .withEntityId("c1")
        .withName("Porsche 911 RSR")
        .withAvatarUrl(pictureUrl)
        .withBrand("Carrera")
        .withCarClass("GT3")
        .withScale("1/32")
        .withMotor("Flat-6")
        .withMagnet("Strong")
        .withChassis("Plastic")
        .withGears("9/27")
        .withTyres("Urethane")
        .withModified(true)
        .withNotes("Fast, \"really\" fast")
        .withCustomValues(values("f-weight", "84", "f-compound", "Soft", "f-gone", "lost"))
        .build();
  }

  private static Car plain(String id, String name) {
    return new Car.Builder().withEntityId(id).withName(name).build();
  }

  private static Map<String, byte[]> unzip(byte[] zip) throws Exception {
    Map<String, byte[]> entries = new LinkedHashMap<>();
    try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(zip))) {
      ZipEntry entry;
      while ((entry = zis.getNextEntry()) != null) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buf = new byte[4096];
        int n;
        while ((n = zis.read(buf)) != -1) {
          out.write(buf, 0, n);
        }
        entries.put(entry.getName(), out.toByteArray());
      }
    }
    return entries;
  }

  @Test
  public void testHeadersAreTheFixedColumnsThenOwnFieldsByPosition() {
    List<String> headers =
        CarExporter.headers(Arrays.asList(compound, weight)); // already in position order
    assertEquals("Name", headers.get(0));
    assertEquals("Picture", headers.get(1));
    assertEquals("Notes", headers.get(11));
    assertEquals(Arrays.asList("Compound", "Weight (g)"), headers.subList(12, 14));
  }

  @Test
  public void testCsvHasEveryColumnAndOwnFieldsByName() throws Exception {
    byte[] zip =
        exporter.exportCarsZip(
            Collections.singletonList(porsche("")), Arrays.asList(weight, compound), "csv");
    Map<String, byte[]> entries = unzip(zip);
    assertEquals(Collections.singletonList("cars.csv"), new ArrayList<>(entries.keySet()));

    String[] lines = new String(entries.get("cars.csv"), StandardCharsets.UTF_8).split("\n");
    assertEquals(
        "Name,Picture,Brand,Class,Scale,Motor,Magnet,Chassis,Gears,Tyres,Modified,Notes,"
            + "Compound,Weight (g)",
        lines[0]);
    assertEquals(
        "Porsche 911 RSR,,Carrera,GT3,1/32,Flat-6,Strong,Plastic,9/27,Urethane,Yes,"
            + "\"Fast, \"\"really\"\" fast\",Soft,84",
        lines[1]);
    assertEquals(lines[0].split(",").length, 14);
  }

  @Test
  public void testPicturesGoIntoTheZipOnceAndTheFileNamesThem() throws Exception {
    byte[] png = new byte[] {(byte) 0x89, 'P', 'N', 'G', 1, 2, 3};
    AssetMessage pic = assetService.saveAsset("red_car.png", "image", png);
    AssetMessage same = assetService.saveAsset("copy.png", "image", png);
    Car a = porsche(pic.getUrl());
    Car b =
        new Car.Builder().withEntityId("c2").withName("Audi").withAvatarUrl(same.getUrl()).build();

    Map<String, byte[]> entries =
        unzip(exporter.exportCarsZip(Arrays.asList(a, b), Collections.emptyList(), "csv"));

    assertEquals(
        Arrays.asList("cars.csv", "images/red_car.png"), new ArrayList<>(entries.keySet()));
    assertArrayEquals(png, entries.get("images/red_car.png"));
    String csv = new String(entries.get("cars.csv"), StandardCharsets.UTF_8);
    assertTrue(csv.contains("Audi,images/red_car.png,"));
    assertTrue(csv.contains("Porsche 911 RSR,images/red_car.png,"));
  }

  @Test
  public void testAPictureThatCannotBeFoundKeepsItsUrl() throws Exception {
    Map<String, byte[]> entries =
        unzip(
            exporter.exportCarsZip(
                Collections.singletonList(porsche("/assets/missing.png")),
                Collections.emptyList(),
                "csv"));
    assertEquals(1, entries.size());
    assertTrue(
        new String(entries.get("cars.csv"), StandardCharsets.UTF_8)
            .contains("Porsche 911 RSR,/assets/missing.png,"));
  }

  @Test
  public void testCarsAreSortedByNameAndNotModifiedIsNo() throws Exception {
    List<Car> cars = Arrays.asList(plain("3", "car 10"), plain("1", "Car 2"), plain("2", "audi"));
    String csv =
        new String(
            unzip(exporter.exportCarsZip(cars, Collections.emptyList(), null)).get("cars.csv"),
            StandardCharsets.UTF_8);
    String[] lines = csv.split("\n");
    assertTrue(lines[1].startsWith("audi,"));
    assertTrue(lines[2].startsWith("Car 2,"));
    assertTrue(lines[3].startsWith("car 10,"));
    assertTrue(lines[1].contains(",No,"));
  }

  @Test
  public void testExcelHasTheSameColumns() throws Exception {
    Map<String, byte[]> entries =
        unzip(
            exporter.exportCarsZip(
                Collections.singletonList(porsche("")), Arrays.asList(weight, compound), "xlsx"));
    try (Workbook wb = new XSSFWorkbook(new ByteArrayInputStream(entries.get("cars.xlsx")))) {
      Sheet sheet = wb.getSheet("Cars");
      Row header = sheet.getRow(0);
      Row row = sheet.getRow(1);
      assertEquals(14, header.getLastCellNum());
      assertEquals("Compound", header.getCell(12).getStringCellValue());
      assertEquals("Weight (g)", header.getCell(13).getStringCellValue());
      assertEquals("Porsche 911 RSR", row.getCell(0).getStringCellValue());
      assertEquals("Yes", row.getCell(10).getStringCellValue());
      assertEquals("84", row.getCell(13).getStringCellValue());
    }
  }

  @Test
  public void testJsonHasTheFieldsAndValuesByFieldName() throws Exception {
    Map<String, byte[]> entries =
        unzip(
            exporter.exportCarsZip(
                Collections.singletonList(porsche("")), Arrays.asList(weight, compound), "json"));
    JsonNode root = new ObjectMapper().readTree(entries.get("cars.json"));

    JsonNode fields = root.get("fields");
    assertEquals("Compound", fields.get(0).get("name").asText());
    assertEquals("choice", fields.get(0).get("type").asText());
    assertEquals("Hard", fields.get(0).get("options").get(1).asText());

    JsonNode car = root.get("cars").get(0);
    assertEquals("Porsche 911 RSR", car.get("name").asText());
    assertEquals("GT3", car.get("carClass").asText());
    assertTrue(car.get("modified").asBoolean());
    assertEquals("Soft", car.get("customValues").get("Compound").asText());
    assertEquals("84", car.get("customValues").get("Weight (g)").asText());
    assertFalse("a value of a deleted field stays out", car.get("customValues").has("f-gone"));
    assertFalse("ids stay out", car.has("entity_id"));
  }

  @Test
  public void testNoCarsGivesJustTheHeader() throws Exception {
    String csv =
        new String(
            unzip(exporter.exportCarsZip(null, null, "csv")).get("cars.csv"),
            StandardCharsets.UTF_8);
    assertEquals(String.join(",", CarExporter.FIXED_HEADERS) + "\n", csv);
  }
}
