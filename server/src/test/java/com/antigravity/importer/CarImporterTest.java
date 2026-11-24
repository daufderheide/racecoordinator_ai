package com.antigravity.importer;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import com.antigravity.context.DatabaseContext;
import com.antigravity.importer.model.CarImportCommitRequest;
import com.antigravity.importer.model.CarImportPreview;
import com.antigravity.importer.model.CarImportResult;
import com.antigravity.importer.model.CarImportRow;
import com.antigravity.models.Car;
import com.antigravity.models.CarField;
import com.antigravity.proto.AssetMessage;
import com.antigravity.repository.SqliteRepository;
import com.antigravity.service.AssetService;
import java.io.File;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;

public class CarImporterTest {

  @Rule public TemporaryFolder tempFolder = new TemporaryFolder();

  private DatabaseContext source;
  private DatabaseContext target;
  private AssetService sourceAssets;
  private AssetService targetAssets;
  private SqliteRepository<Car> targetCars;
  private SqliteRepository<CarField> targetFields;
  private CarImporter importer;

  private DatabaseContext db(String name) throws Exception {
    String root = tempFolder.newFolder(name).getAbsolutePath() + File.separator;
    return new DatabaseContext("test_db", null, root);
  }

  private static AssetService assets(DatabaseContext ctx) {
    File dir = new File(new File(ctx.getDataRoot(), "test_db"), "assets");
    return new AssetService(ctx, dir.getAbsolutePath());
  }

  @Before
  public void setUp() throws Exception {
    source = db("source");
    target = db("target");
    sourceAssets = assets(source);
    targetAssets = assets(target);
    targetCars = new SqliteRepository<>(target, "cars", Car.class);
    targetFields = new SqliteRepository<>(target, "car_fields", CarField.class);
    importer = new CarImporter(target, targetAssets);
  }

  @After
  public void tearDown() throws Exception {
    for (DatabaseContext ctx : Arrays.asList(source, target)) {
      if (ctx != null && ctx.getConnection() != null) ctx.getConnection().close();
    }
  }

  private static Map<String, String> map(String... kv) {
    Map<String, String> m = new LinkedHashMap<>();
    for (int i = 0; i < kv.length; i += 2) m.put(kv[i], kv[i + 1]);
    return m;
  }

  private static CarImportCommitRequest commitAll(CarImportPreview preview) {
    CarImportCommitRequest request = new CarImportCommitRequest();
    request.setRows(preview.getRows());
    request.setNewFields(preview.getNewFields());
    return request;
  }

  private CarImportPreview previewCsv(String csv) throws Exception {
    return importer.preview(csv.getBytes(StandardCharsets.UTF_8), "cars.csv", null);
  }

  private Car carNamed(String name) {
    for (Car c : targetCars.findAll()) {
      if (name.equals(c.getName())) return c;
    }
    return null;
  }

  private CarField fieldNamed(String name) {
    for (CarField f : targetFields.findAll()) {
      if (name.equals(f.getName())) return f;
    }
    return null;
  }

  /** Exports two cars with a picture and two own fields from one database. */
  private byte[] exportFromSource(String format) throws Exception {
    byte[] png = new byte[] {(byte) 0x89, 'P', 'N', 'G', 7, 7, 7};
    AssetMessage pic = sourceAssets.saveAsset("porsche.png", "image", png);
    CarField weight = new CarField("Weight (g)", CarField.TYPE_NUMBER, null, 0, "w", null);
    CarField compound =
        new CarField("Compound", CarField.TYPE_CHOICE, Arrays.asList("Soft", "Hard"), 1, "c", null);
    Car porsche =
        new Car.Builder()
            .withEntityId("1")
            .withName("Porsche 911 RSR")
            .withAvatarUrl(pic.getUrl())
            .withBrand("Carrera")
            .withCarClass("GT3")
            .withScale("1/32")
            .withModified(true)
            .withNotes("Line one\nline two, with a comma")
            .withCustomValues(map("w", "84", "c", "Soft"))
            .build();
    Car audi = new Car.Builder().withEntityId("2").withName("Audi R8").withCarClass("GT3").build();
    return new CarExporter(source, sourceAssets)
        .exportCarsZip(Arrays.asList(porsche, audi), Arrays.asList(weight, compound), format);
  }

  private void assertRoundTrip(String format) throws Exception {
    CarImportPreview preview = importer.preview(exportFromSource(format), "cars.zip", null);
    assertEquals(2, preview.getValidCount());
    assertEquals(1, preview.getImportedAssetNames().size());

    CarImportResult result = importer.commit(commitAll(preview));
    assertEquals(2, result.getImportedCount());

    Car porsche = carNamed("Porsche 911 RSR");
    assertNotNull(porsche);
    assertEquals("Carrera", porsche.getBrand());
    assertEquals("GT3", porsche.getCarClass());
    assertTrue(porsche.isModified());
    assertEquals("Line one\nline two, with a comma", porsche.getNotes());
    assertTrue(porsche.getAvatarUrl().startsWith("/assets/"));
    assertTrue(new File(targetAssets.getAssetDir(), porsche.getAvatarUrl().substring(8)).isFile());

    CarField weight = fieldNamed("Weight (g)");
    CarField compound = fieldNamed("Compound");
    assertNotNull(weight);
    assertNotNull(compound);
    assertEquals("84", porsche.getCustomValues().get(weight.getEntityId()));
    assertEquals("Soft", porsche.getCustomValues().get(compound.getEntityId()));
    assertFalse(carNamed("Audi R8").isModified());
  }

  @Test
  public void testCsvExportImportsBackIntoAnotherDatabase() throws Exception {
    assertRoundTrip("csv");
    assertEquals(CarField.TYPE_TEXT, fieldNamed("Compound").getType());
  }

  @Test
  public void testExcelExportImportsBack() throws Exception {
    assertRoundTrip("xlsx");
  }

  @Test
  public void testJsonExportKeepsTheFieldTypesAndOptions() throws Exception {
    assertRoundTrip("json");
    assertEquals(CarField.TYPE_NUMBER, fieldNamed("Weight (g)").getType());
    CarField compound = fieldNamed("Compound");
    assertEquals(CarField.TYPE_CHOICE, compound.getType());
    assertEquals(Arrays.asList("Soft", "Hard"), compound.getOptions());
  }

  @Test
  public void testUnknownColumnsBecomeTextFieldsShownInThePreview() throws Exception {
    CarImportPreview preview = previewCsv("Name,Club number\nFerrari,12\n");
    assertEquals(1, preview.getNewFields().size());
    assertEquals("Club number", preview.getNewFields().get(0).getName());
    assertEquals(CarField.TYPE_TEXT, preview.getNewFields().get(0).getType());

    CarImportResult result = importer.commit(commitAll(preview));
    assertEquals(Collections.singletonList("Club number"), result.getCreatedFieldNames());
    CarField field = fieldNamed("Club number");
    assertEquals("12", carNamed("Ferrari").getCustomValues().get(field.getEntityId()));
  }

  @Test
  public void testAChoiceValueThatIsNotAnOptionIsAdded() throws Exception {
    targetFields.insert(
        new CarField("Compound", CarField.TYPE_CHOICE, Arrays.asList("Soft", "Hard"), 0, "c", "c"));
    CarImportPreview preview = previewCsv("Name,compound\nA,Super soft\nB,soft\n");
    assertEquals(1, preview.getNewOptions().size());
    assertEquals(
        Collections.singletonList("Super soft"), preview.getNewOptions().get(0).getOptions());

    importer.commit(commitAll(preview));
    assertEquals(Arrays.asList("Soft", "Hard", "Super soft"), fieldNamed("Compound").getOptions());
    assertEquals("Super soft", carNamed("A").getCustomValues().get("c"));
    assertEquals("Soft", carNamed("B").getCustomValues().get("c"));
  }

  @Test
  public void testYesNoFieldsAndModifiedAcceptCommonSpellings() throws Exception {
    targetFields.insert(new CarField("Lights", CarField.TYPE_BOOLEAN, null, 0, "l", "l"));
    importer.commit(commitAll(previewCsv("Name,Modified,Lights\nA,ja,x\nB,no,No\n")));
    assertTrue(carNamed("A").isModified());
    assertEquals("true", carNamed("A").getCustomValues().get("l"));
    assertFalse(carNamed("B").isModified());
    assertNull(carNamed("B").getCustomValues().get("l"));
  }

  @Test
  public void testAnExistingNameIsAConflictThatSkipsByDefault() throws Exception {
    targetCars.insert(new Car.Builder().withEntityId("7").withName("Audi R8").build());
    CarImportPreview preview = previewCsv("Name\naudi r8\nBMW M1\n");
    CarImportRow audi = preview.getRows().get(0);
    assertEquals(CarImportRow.STATUS_CONFLICT, audi.getStatus());
    assertEquals(CarImportRow.CONFLICT_NAME, audi.getConflictType());
    assertEquals("7", audi.getExistingCarId());
    assertEquals(1, preview.getConflictCount());
    assertEquals(1, preview.getExistingCars().size());

    CarImportResult result = importer.commit(commitAll(preview));
    assertEquals(1, result.getSkippedCount());
    assertEquals(1, result.getImportedCount());
    assertEquals(2, targetCars.findAll().size());
  }

  @Test
  public void testOverwriteChangesWhatTheFileHasAndKeepsTheRest() throws Exception {
    targetFields.insert(new CarField("Weight", CarField.TYPE_NUMBER, null, 0, "w", "w"));
    targetFields.insert(new CarField("Pinion", CarField.TYPE_TEXT, null, 1, "p", "p"));
    targetCars.insert(
        new Car.Builder()
            .withEntityId("7")
            .withName("Audi R8")
            .withBrand("Scalextric")
            .withNotes("keep me")
            .withCustomValues(map("w", "80", "p", "11"))
            .build());
    CarImportPreview preview = previewCsv("Name,Brand,Weight\nAudi R8,Slot.it,79\n");
    preview.getRows().get(0).setSelectedResolution(CarImportRow.RESOLUTION_OVERWRITE);

    CarImportResult result = importer.commit(commitAll(preview));
    assertEquals(1, result.getUpdatedCount());
    assertEquals(Collections.singletonList("7"), result.getUpdatedCarIds());
    Car audi = targetCars.findByEntityId("7");
    assertEquals("Slot.it", audi.getBrand());
    assertEquals("keep me", audi.getNotes());
    assertEquals("79", audi.getCustomValues().get("w"));
    assertEquals("11", audi.getCustomValues().get("p"));
  }

  @Test
  public void testImportAsCopyGetsAFreeName() throws Exception {
    targetCars.insert(new Car.Builder().withEntityId("7").withName("Audi R8").build());
    CarImportPreview preview = previewCsv("Name\nAudi R8\n");
    preview.getRows().get(0).setSelectedResolution(CarImportRow.RESOLUTION_AUTO_RENAME);
    importer.commit(commitAll(preview));
    assertNotNull(carNamed("Audi R8 (2)"));
  }

  @Test
  public void testACarTwiceInTheFileAndAMissingNameAreFlagged() throws Exception {
    CarImportPreview preview = previewCsv("Name,Class\nA,GT3\n,GT3\na,LMP\n");
    assertEquals(CarImportRow.STATUS_VALID, preview.getRows().get(0).getStatus());
    assertEquals(CarImportRow.STATUS_ERROR, preview.getRows().get(1).getStatus());
    assertEquals(CarImportRow.CONFLICT_IN_FILE, preview.getRows().get(2).getConflictType());
    importer.commit(commitAll(preview));
    assertEquals(1, targetCars.findAll().size());
  }

  @Test
  public void testAMissingPictureKeepsTheCarsPictureAndSaysSo() throws Exception {
    CarImportPreview preview = previewCsv("Name,Picture\nA,images/nowhere.png\n");
    CarImportRow row = preview.getRows().get(0);
    assertFalse(row.getValues().containsKey("picture"));
    assertTrue(row.getMessage().contains("nowhere.png"));
  }

  @Test
  public void testPicturesNextToTheFileAreUsed() throws Exception {
    byte[] png = new byte[] {(byte) 0x89, 'P', 'N', 'G', 1};
    CarImportPreview preview =
        importer.preview(
            "Name,Picture\nA,red.png\nB,red.png\n".getBytes(StandardCharsets.UTF_8),
            "cars.csv",
            Collections.singletonMap("red.png", png));
    assertEquals(1, preview.getImportedAssetNames().size());
    String url = preview.getRows().get(0).getValues().get("picture");
    assertTrue(url.startsWith("/assets/"));
    assertEquals(url, preview.getRows().get(1).getValues().get("picture"));
  }

  @Test
  public void testUniqueNameCountsUp() {
    HashSet<String> taken = new HashSet<>(Arrays.asList("a", "a (2)"));
    assertEquals("A (3)", CarImporter.uniqueName("A", taken));
    assertTrue(taken.contains("a (3)"));
  }

  @Test
  public void testNothingToImportIsAnEmptyPreview() throws Exception {
    CarImportPreview preview = previewCsv("Name,Class\n");
    assertEquals(0, preview.getTotalRows());
    List<CarImportRow> rows = preview.getRows();
    assertTrue(rows.isEmpty());
  }
}
