package com.antigravity.service;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.CustomUI;
import com.antigravity.models.Theme;
import com.antigravity.proto.AssetMessage;
import com.antigravity.repository.SqliteRepository;
import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;

public class AssetDefaultsInitializerTest {

  @Rule public TemporaryFolder tempFolder = new TemporaryFolder();

  private DatabaseContext databaseContext;
  private AssetService assetService;
  private AssetDefaultsInitializer initializer;
  private String assetsDir;

  @Before
  public void setup() throws Exception {
    String rootDir = tempFolder.newFolder("db_root").getAbsolutePath() + File.separator;
    databaseContext = new DatabaseContext("test_db", null, rootDir);
    assetsDir = tempFolder.newFolder("assets").getAbsolutePath();

    assetService = new AssetService(databaseContext, assetsDir);
    initializer = new AssetDefaultsInitializer(assetService, databaseContext);
  }

  @After
  public void teardown() throws IOException {
    if (databaseContext != null && databaseContext.getConnection() != null) {
      try {
        databaseContext.getConnection().close();
      } catch (Exception ignored) {
      }
    }
  }

  @Test
  public void testBackfillDefaults() {
    initializer.backfillDefaults();

    AssetMessage countdown = assetService.getAssetById("default_countdown");
    assertNotNull("Default countdown audio set should be backfilled", countdown);

    AssetMessage secondsLeft = assetService.getAssetById("default_seconds_left");
    assertNotNull("Default seconds left audio set should be backfilled", secondsLeft);

    AssetMessage fuelGauge = assetService.getAssetById("default_fuel_gauge");
    assertNotNull("Default fuel gauge image set should be backfilled", fuelGauge);

    SqliteRepository<Theme> themeRepo =
        new SqliteRepository<>(databaseContext, "themes", Theme.class);
    List<Theme> themes = themeRepo.findAll();
    assertTrue("Default theme should be created", themes.stream().anyMatch(Theme::isDefault));
  }

  @Test
  public void testBackfillDefaultsIdempotent() {
    initializer.backfillDefaults();
    initializer.backfillDefaults();

    AssetMessage countdown = assetService.getAssetById("default_countdown");
    assertNotNull("Default countdown audio set should still exist", countdown);
  }

  @Test
  public void testBackfillDefaults_RecreatesMissingPhysicalFiles() {
    initializer.backfillDefaults();

    File helmetFile = new File(assetsDir, "default_black-blue_Helmet_Black-Blue");
    assertTrue("Default helmet file should exist on disk", helmetFile.exists());

    // Simulate accidental deletion / missing physical file on disk
    assertTrue("Should successfully delete physical file", helmetFile.delete());
    assertTrue("Physical file should now be deleted", !helmetFile.exists());

    // Running backfillDefaults again should self-heal and restore the physical file
    initializer.backfillDefaults();
    assertTrue("Physical file should be recreated by backfillDefaults", helmetFile.exists());
    assertTrue("Recreated file should have non-zero size", helmetFile.length() > 0);
  }

  @Test
  public void testDefaultResourcePathHelper() {
    String path1 = AssetDefaultsInitializer.getDefaultResourcePath("default_black-blue");
    assertNotNull("Should find resource for default_black-blue", path1);

    String path2 =
        AssetDefaultsInitializer.getDefaultResourcePath("default_black-blue_Helmet_Black-Blue");
    assertNotNull("Should find resource for default_black-blue_Helmet_Black-Blue", path2);

    String path3 = AssetDefaultsInitializer.getDefaultResourcePath("beep.wav");
    assertNotNull("Should find direct resource beep.wav", path3);
  }

  @Test
  public void testBackfillDefaultTheme() {
    initializer.backfillDefaultTheme();

    SqliteRepository<Theme> themeRepo =
        new SqliteRepository<>(databaseContext, "themes", Theme.class);
    List<Theme> themes = themeRepo.findAll();
    assertTrue("Default theme should exist", themes.stream().anyMatch(Theme::isDefault));
  }

  @Test
  public void testBackfillDefaultTheme_RenamesLegacyDefaultNames() {
    SqliteRepository<Theme> themeRepo =
        new SqliteRepository<>(databaseContext, "themes", Theme.class);
    themeRepo.drop();

    themeRepo.save(
        new Theme(
            "Default Theme",
            true,
            new HashMap<>(),
            new HashMap<>(),
            null,
            Theme.DEFAULT_THEME_ID,
            null));
    themeRepo.save(
        new Theme(
            "Practice Theme",
            true,
            new HashMap<>(),
            new HashMap<>(),
            null,
            Theme.PRACTICE_THEME_ID,
            null));
    themeRepo.save(
        new Theme(
            "Fuel Theme", true, new HashMap<>(), new HashMap<>(), null, Theme.FUEL_THEME_ID, null));
    themeRepo.save(
        new Theme(
            "My Custom Theme",
            false,
            new HashMap<>(),
            new HashMap<>(),
            "custom_ui",
            "custom_1",
            null));

    initializer.backfillDefaultTheme();

    Theme defaultTheme = themeRepo.findByEntityId(Theme.DEFAULT_THEME_ID);
    assertNotNull(defaultTheme);
    assertEquals(Theme.DEFAULT_THEME_NAME, defaultTheme.getName());
    assertEquals(CustomUI.DEFAULT_UI_ID, defaultTheme.getUiId());

    Theme practiceTheme = themeRepo.findByEntityId(Theme.PRACTICE_THEME_ID);
    assertNotNull(practiceTheme);
    assertEquals(Theme.PRACTICE_THEME_NAME, practiceTheme.getName());
    assertEquals(CustomUI.PRACTICE_UI_ID, practiceTheme.getUiId());

    Theme fuelTheme = themeRepo.findByEntityId(Theme.FUEL_THEME_ID);
    assertNotNull(fuelTheme);
    assertEquals(Theme.FUEL_THEME_NAME, fuelTheme.getName());
    assertEquals(CustomUI.FUEL_UI_ID, fuelTheme.getUiId());

    Theme customTheme = themeRepo.findByEntityId("custom_1");
    assertNotNull(customTheme);
    assertEquals("My Custom Theme", customTheme.getName());
    assertEquals("custom_ui", customTheme.getUiId());
  }

  @Test
  public void testBackfillDefaultTheme_MigratesLegacyFuelId2() {
    SqliteRepository<Theme> themeRepo =
        new SqliteRepository<>(databaseContext, "themes", Theme.class);
    themeRepo.drop();

    themeRepo.save(new Theme("Fuel Theme", true, new HashMap<>(), new HashMap<>(), "2", "2", null));

    initializer.backfillDefaultTheme();

    assertNull(themeRepo.findByEntityId("2"));
    Theme fuelTheme = themeRepo.findByEntityId(Theme.FUEL_THEME_ID);
    assertNotNull(fuelTheme);
    assertEquals(Theme.FUEL_THEME_NAME, fuelTheme.getName());
    assertEquals(CustomUI.FUEL_UI_ID, fuelTheme.getUiId());
  }

  @Test
  public void testBackfillDefaultTheme_CreatesMissingThemes() {
    SqliteRepository<Theme> themeRepo =
        new SqliteRepository<>(databaseContext, "themes", Theme.class);
    themeRepo.drop();

    initializer.backfillDefaultTheme();

    List<Theme> themes = themeRepo.findAll();
    assertEquals(3, themes.size());
    assertNotNull(themeRepo.findByEntityId(Theme.DEFAULT_THEME_ID));
    assertNotNull(themeRepo.findByEntityId(Theme.PRACTICE_THEME_ID));
    assertNotNull(themeRepo.findByEntityId(Theme.FUEL_THEME_ID));
  }
}
