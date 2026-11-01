package com.antigravity.service;

import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import com.antigravity.context.DatabaseContext;
import com.antigravity.proto.AssetMessage;
import com.antigravity.service.AssetDefaultsInitializer.DefaultAsset;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.List;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;

public class LegacyAssetCleanupServiceTest {

  @Rule public TemporaryFolder tempFolder = new TemporaryFolder();

  private DatabaseContext databaseContext;
  private AssetService assetService;
  private LegacyAssetCleanupService cleanupService;
  private String assetsDir;

  @Before
  public void setup() throws Exception {
    String rootDir = tempFolder.newFolder("db_root").getAbsolutePath() + File.separator;
    databaseContext = new DatabaseContext("test_db", null, rootDir);
    assetsDir = tempFolder.newFolder("assets").getAbsolutePath();

    assetService = new AssetService(databaseContext, assetsDir);
    cleanupService = new LegacyAssetCleanupService(assetService);
  }

  @After
  public void teardown() {
    if (databaseContext != null && databaseContext.getConnection() != null) {
      try {
        databaseContext.getConnection().close();
      } catch (Exception ignored) {
      }
    }
  }

  private byte[] getBundledResource(String path) throws IOException {
    try (InputStream is = getClass().getResourceAsStream(path)) {
      assertNotNull("Bundled resource must exist: " + path, is);
      java.io.ByteArrayOutputStream buffer = new java.io.ByteArrayOutputStream();
      byte[] data = new byte[8192];
      int nRead;
      while ((nRead = is.read(data, 0, data.length)) != -1) {
        buffer.write(data, 0, nRead);
      }
      return buffer.toByteArray();
    }
  }

  @Test
  public void testCleanupLegacyDuplicates_RemovesExactDuplicateMatchingActiveAsset()
      throws IOException {
    byte[] stockData = getBundledResource("/defaults/black.png");

    File activeFile = new File(assetsDir, "default_black_Helmet_Black");
    Files.write(activeFile.toPath(), stockData);
    assetService.saveAsset("default_black", "Helmet Black", "image", stockData);

    File legacyFile = new File(assetsDir, "default_black_black.png");
    Files.write(legacyFile.toPath(), stockData);
    assertTrue("Legacy file should exist before cleanup", legacyFile.exists());

    int removed = cleanupService.cleanupLegacyDuplicates();

    assertEquals(1, removed);
    assertFalse("Legacy duplicate should be removed", legacyFile.exists());
    assertTrue("Active file must be preserved", activeFile.exists());
  }

  @Test
  public void
      testCleanupLegacyDuplicates_RemovesCandidateMatchingBundledSignatureWhenActiveIsCustomized()
          throws IOException {
    byte[] stockData = getBundledResource("/defaults/black.png");
    byte[] customData = "custom_helmet_texture_v1".getBytes(StandardCharsets.UTF_8);

    File activeFile = new File(assetsDir, "default_black_Helmet_Black");
    Files.write(activeFile.toPath(), customData);
    assetService.saveAsset("default_black", "Helmet Black", "image", customData);

    File legacyFile = new File(assetsDir, "default_black_black.png");
    Files.write(legacyFile.toPath(), stockData);
    assertTrue(legacyFile.exists());

    int removed = cleanupService.cleanupLegacyDuplicates();

    assertEquals(1, removed);
    assertFalse("Legacy stock copy should be removed", legacyFile.exists());
    assertTrue("Customized active file must remain", activeFile.exists());
    assertArrayEquals(customData, Files.readAllBytes(activeFile.toPath()));
  }

  @Test
  public void testCleanupLegacyDuplicates_PromotesCustomizedCandidateWhenActiveIsStock()
      throws IOException {
    byte[] stockData = getBundledResource("/defaults/black.png");
    byte[] customLegacyData = "custom_user_avatar_from_mongodb".getBytes(StandardCharsets.UTF_8);

    File activeFile = new File(assetsDir, "default_black_Helmet_Black");
    Files.write(activeFile.toPath(), stockData);
    assetService.saveAsset("default_black", "Helmet Black", "image", stockData);

    File legacyFile = new File(assetsDir, "default_black_black.png");
    Files.write(legacyFile.toPath(), customLegacyData);

    int removed = cleanupService.cleanupLegacyDuplicates();

    assertEquals(1, removed);
    assertFalse("Legacy file should be removed after promotion", legacyFile.exists());
    assertTrue("Active file must exist", activeFile.exists());
    assertArrayEquals(
        "Active file should now contain the restored user custom data",
        customLegacyData,
        Files.readAllBytes(activeFile.toPath()));

    AssetMessage asset = assetService.getAssetById("default_black");
    assertNotNull(asset);
    assertEquals(AssetService.calculateSha256(customLegacyData), asset.getHash());
  }

  @Test
  public void testCleanupLegacyDuplicates_PreservesBothWhenBothAreCustomizedAndDiffer()
      throws IOException {
    byte[] activeCustom = "active_custom_data".getBytes(StandardCharsets.UTF_8);
    byte[] legacyCustom = "legacy_custom_data".getBytes(StandardCharsets.UTF_8);

    File activeFile = new File(assetsDir, "default_black_Helmet_Black");
    Files.write(activeFile.toPath(), activeCustom);
    assetService.saveAsset("default_black", "Helmet Black", "image", activeCustom);

    File legacyFile = new File(assetsDir, "default_black_black.png");
    Files.write(legacyFile.toPath(), legacyCustom);

    int removed = cleanupService.cleanupLegacyDuplicates();

    assertEquals("Ambiguous custom files should not be deleted", 0, removed);
    assertTrue("Active file must remain", activeFile.exists());
    assertTrue("Legacy custom file must be preserved", legacyFile.exists());
    assertArrayEquals(activeCustom, Files.readAllBytes(activeFile.toPath()));
    assertArrayEquals(legacyCustom, Files.readAllBytes(legacyFile.toPath()));
  }

  @Test
  public void testCleanupLegacyDuplicates_EmptyOrNonExistentDirectory() {
    AssetService mockService = new AssetService(databaseContext, "/non/existent/directory/path");
    LegacyAssetCleanupService service = new LegacyAssetCleanupService(mockService);
    assertEquals(0, service.cleanupLegacyDuplicates());

    File emptyDir = new File(assetsDir, "sub_empty");
    emptyDir.mkdirs();
    AssetService emptyService = new AssetService(databaseContext, emptyDir.getAbsolutePath());
    assertEquals(0, new LegacyAssetCleanupService(emptyService).cleanupLegacyDuplicates());
  }

  @Test
  public void testCleanupLegacyDuplicates_AudioAndFuelAssets() throws IOException {
    byte[] stockAudio = getBundledResource("/defaults/beep.wav");
    File activeAudio = new File(assetsDir, "default_beep_Lap_Beep");
    Files.write(activeAudio.toPath(), stockAudio);
    File legacyAudio = new File(assetsDir, "default_beep_beep.wav");
    Files.write(legacyAudio.toPath(), stockAudio);

    byte[] stockFuel = getBundledResource("/defaults/fuel_100.png");
    File activeFuel = new File(assetsDir, "default_fuel_100_Fuel_Gauge_100_");
    Files.write(activeFuel.toPath(), stockFuel);
    File legacyFuel = new File(assetsDir, "default_fuel_100_fuel_100.png");
    Files.write(legacyFuel.toPath(), stockFuel);

    int removed = cleanupService.cleanupLegacyDuplicates();

    assertEquals(2, removed);
    assertFalse(legacyAudio.exists());
    assertFalse(legacyFuel.exists());
    assertTrue(activeAudio.exists());
    assertTrue(activeFuel.exists());
  }

  @Test
  public void testGetAllDefaultAssetsAndTypeHelper() {
    List<DefaultAsset> all = AssetDefaultsInitializer.getAllDefaultAssets();
    assertTrue("All default assets should include images and audio", all.size() > 40);

    DefaultAsset imageAsset =
        all.stream().filter(a -> a.id.equals("default_black")).findFirst().orElse(null);
    assertNotNull(imageAsset);
    assertEquals("image", AssetDefaultsInitializer.getAssetTypeForDefault(imageAsset));

    DefaultAsset audioAsset =
        all.stream().filter(a -> a.id.equals("default_beep")).findFirst().orElse(null);
    assertNotNull(audioAsset);
    assertEquals("audio", AssetDefaultsInitializer.getAssetTypeForDefault(audioAsset));
    assertEquals("image", AssetDefaultsInitializer.getAssetTypeForDefault(null));
  }

  @Test
  public void testBackfillDefaultsAutomaticallyCleansUpDuplicates() throws IOException {
    byte[] stockData = getBundledResource("/defaults/black.png");
    File legacyFile = new File(assetsDir, "default_black_black.png");
    Files.write(legacyFile.toPath(), stockData);
    assertTrue(legacyFile.exists());

    AssetDefaultsInitializer initializer =
        new AssetDefaultsInitializer(assetService, databaseContext);
    initializer.backfillDefaults();

    assertFalse(
        "backfillDefaults should automatically remove legacy duplicate", legacyFile.exists());
    File activeFile = new File(assetsDir, "default_black_Helmet_Black");
    assertTrue("Active file should exist", activeFile.exists());
  }
}
