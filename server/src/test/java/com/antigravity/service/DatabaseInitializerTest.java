package com.antigravity.service;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.CustomUI;
import com.antigravity.models.Driver;
import com.antigravity.models.Race;
import com.antigravity.models.Team;
import com.antigravity.models.Theme;
import com.antigravity.models.Track;
import com.antigravity.repository.SqliteRepository;
import java.io.File;
import java.util.List;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;

public class DatabaseInitializerTest {
  @Rule public TemporaryFolder tempFolder = new TemporaryFolder();

  private DatabaseContext context;
  private DatabaseInitializer initializer;

  @Before
  public void setUp() throws Exception {
    String rootDir = tempFolder.newFolder("db_root").getAbsolutePath() + File.separator;
    context = new DatabaseContext("test_db", null, rootDir);
    initializer = new DatabaseInitializer();
  }

  @Test
  public void testResetToFactory() {
    initializer.resetToFactory(context);

    SqliteRepository<Driver> driverRepo = new SqliteRepository<>(context, "drivers", Driver.class);
    List<Driver> drivers = driverRepo.findAll();
    assertTrue("Should initialize drivers", drivers.size() > 0);

    SqliteRepository<Track> trackRepo = new SqliteRepository<>(context, "tracks", Track.class);
    List<Track> tracks = trackRepo.findAll();
    assertEquals(1, tracks.size());
    assertEquals("The Heights", tracks.get(0).getName());

    SqliteRepository<Race> raceRepo = new SqliteRepository<>(context, "races", Race.class);
    List<Race> races = raceRepo.findAll();
    assertEquals("Should initialize 4 default races", 4, races.size());
    assertTrue(races.stream().anyMatch(r -> "Time Based".equals(r.getName())));
    assertTrue(races.stream().anyMatch(r -> "Lap Based".equals(r.getName())));
    assertTrue(races.stream().anyMatch(r -> "Fuel Race".equals(r.getName())));
    assertTrue(races.stream().anyMatch(r -> "Practice".equals(r.getName())));

    SqliteRepository<Team> teamRepo = new SqliteRepository<>(context, "teams", Team.class);
    List<Team> teams = teamRepo.findAll();
    assertEquals(2, teams.size());

    SqliteRepository<CustomUI> uiRepo =
        new SqliteRepository<>(context, "custom_uis", CustomUI.class);
    List<CustomUI> uis = uiRepo.findAll();
    assertEquals(3, uis.size());
    for (CustomUI ui : uis) {
      assertTrue(ui.getLayoutJson().contains("widget-countdown"));
    }

    SqliteRepository<Theme> themeRepo = new SqliteRepository<>(context, "themes", Theme.class);
    List<Theme> themes = themeRepo.findAll();
    assertEquals(3, themes.size());

    AssetService assetService = new AssetService(context, context.getDataRoot() + "test_db/assets");
    assertNotNull(assetService.getAssetById("default_pit_in"));
    assertNotNull(assetService.getAssetById("default_fuel_empty"));
    assertNotNull(assetService.getAssetById("default_fuel_low"));
    assertNotNull(assetService.getAssetById("default_fuel_full"));
    assertNotNull(assetService.getAssetById("default_fuel_level"));

    for (Driver d : drivers) {
      assertNotNull("Driver should have pitInAudio", d.getPitInAudio());
      assertEquals("default_pit_in", d.getPitInAudio().getUrl());
      assertEquals("preset", d.getPitInAudio().getType());
      assertNotNull("Driver should have fuelAudio", d.getFuelAudio());
      assertEquals("default_fuel_level", d.getFuelAudio().getUrl());
      assertEquals("audio_set", d.getFuelAudio().getType());
    }
  }

  @Test
  public void testResetCustomUIsAndThemesDirectly() {
    initializer.resetCustomUIs(context);
    SqliteRepository<CustomUI> uiRepo =
        new SqliteRepository<>(context, "custom_uis", CustomUI.class);
    List<CustomUI> uis = uiRepo.findAll();
    assertEquals(3, uis.size());
    for (CustomUI ui : uis) {
      assertTrue(ui.getLayoutJson().contains("widget-countdown"));
    }

    initializer.resetThemes(context);
    SqliteRepository<Theme> themeRepo = new SqliteRepository<>(context, "themes", Theme.class);
    List<Theme> themes = themeRepo.findAll();
    assertEquals(3, themes.size());
  }

  @Test
  public void testGetFactoryTrack() {
    Track factoryTrack = initializer.getFactoryTrack();
    assertNotNull(factoryTrack);
    assertEquals("New Track", factoryTrack.getName());
    assertEquals(4, factoryTrack.getLanes().size());
  }

  @Test
  public void testBackfillRaces() {
    Track track = initializer.resetTracks(context);
    initializer.resetRaces(context, track);

    // Should already have practice and fuel race
    initializer.backfillRaces(context);
    SqliteRepository<Race> raceRepo = new SqliteRepository<>(context, "races", Race.class);
    List<Race> races = raceRepo.findAll();
    long practiceCount = races.stream().filter(r -> "Practice".equals(r.getName())).count();
    assertEquals(1, practiceCount);
    long fuelCount = races.stream().filter(r -> "Fuel Race".equals(r.getName())).count();
    assertEquals(1, fuelCount);

    // Test backfill when missing
    raceRepo.drop();
    initializer.backfillRaces(context);
    races = raceRepo.findAll();
    assertEquals(2, races.size());
    assertTrue(
        races.stream()
            .anyMatch(
                r ->
                    "Fuel Race".equals(r.getName())
                        && com.antigravity.models.Theme.FUEL_THEME_ID.equals(r.getThemeId())));
    assertTrue(
        races.stream()
            .anyMatch(
                r ->
                    "Practice".equals(r.getName())
                        && com.antigravity.models.Theme.PRACTICE_THEME_ID.equals(r.getThemeId())));

    // Test backfilling existing custom race missing themeId
    Race legacyRace =
        new Race.Builder()
            .withName("Custom Legacy Race")
            .withEntityId("legacy_r1")
            .withThemeId(null)
            .build();
    raceRepo.save(legacyRace);

    initializer.backfillRaces(context);
    Race backfilledLegacy = raceRepo.findByEntityId("legacy_r1");
    assertNotNull(backfilledLegacy);
    assertEquals(com.antigravity.models.Theme.DEFAULT_THEME_ID, backfilledLegacy.getThemeId());
  }

  @Test
  public void testResetDriversAndTeamsDirectly() {
    initializer.resetDrivers(context);
    SqliteRepository<Driver> driverRepo = new SqliteRepository<>(context, "drivers", Driver.class);
    List<Driver> drivers = driverRepo.findAll();
    assertTrue(drivers.size() > 0);

    initializer.resetTeams(context);
    SqliteRepository<Team> teamRepo = new SqliteRepository<>(context, "teams", Team.class);
    List<Team> teams = teamRepo.findAll();
    assertEquals(2, teams.size());
  }

  @Test
  public void testResetTracksAndRacesDirectly() {
    Track track = initializer.resetTracks(context);
    assertNotNull(track);
    assertEquals("The Heights", track.getName());

    initializer.resetRaces(context, track);
    SqliteRepository<Race> raceRepo = new SqliteRepository<>(context, "races", Race.class);
    List<Race> races = raceRepo.findAll();
    assertEquals(4, races.size());
    assertTrue(races.stream().anyMatch(r -> "Fuel Race".equals(r.getName())));
  }

  @Test
  public void testBackfillCustomUIs() {
    SqliteRepository<CustomUI> uiRepo =
        new SqliteRepository<>(context, "custom_uis", CustomUI.class);
    uiRepo.drop();

    CustomUI legacyUi =
        new CustomUI(
            "Legacy UI",
            false,
            "{\"widgets\":[{\"id\":\"w1\",\"widgetType\":\"timer\"}]}",
            "[]",
            "{}",
            "{}",
            "{}",
            "{}",
            "legacy_ui_id",
            null);
    uiRepo.save(legacyUi);

    initializer.backfillCustomUIs(context);

    CustomUI updated = uiRepo.findByEntityId("legacy_ui_id");
    assertNotNull(updated);
    assertTrue(updated.getLayoutJson().contains("widget-countdown"));
    assertTrue(updated.getLayoutJson().contains("\"widgetType\":\"countdown\""));
  }

  @Test
  public void testBackfillCustomUIs_RenamesLegacyDefaultNames() {
    SqliteRepository<CustomUI> uiRepo =
        new SqliteRepository<>(context, "custom_uis", CustomUI.class);
    uiRepo.drop();

    uiRepo.save(
        new CustomUI(
            "Default UI Layout",
            true,
            "{\"widgets\":[]}",
            "[]",
            "{}",
            "{}",
            "{}",
            "{}",
            CustomUI.DEFAULT_UI_ID,
            null));
    uiRepo.save(
        new CustomUI(
            "Default Practice UI Layout",
            true,
            "{\"widgets\":[]}",
            "[]",
            "{}",
            "{}",
            "{}",
            "{}",
            CustomUI.PRACTICE_UI_ID,
            null));
    uiRepo.save(
        new CustomUI(
            "Default Fuel UI Layout",
            true,
            "{\"widgets\":[]}",
            "[]",
            "{}",
            "{}",
            "{}",
            "{}",
            CustomUI.FUEL_UI_ID,
            null));
    uiRepo.save(
        new CustomUI(
            "My Custom Layout",
            false,
            "{\"widgets\":[]}",
            "[]",
            "{}",
            "{}",
            "{}",
            "{}",
            "custom_ui_1",
            null));

    initializer.backfillCustomUIs(context);

    CustomUI defaultUi = uiRepo.findByEntityId(CustomUI.DEFAULT_UI_ID);
    assertNotNull(defaultUi);
    assertEquals(CustomUI.DEFAULT_UI_NAME, defaultUi.getName());

    CustomUI practiceUi = uiRepo.findByEntityId(CustomUI.PRACTICE_UI_ID);
    assertNotNull(practiceUi);
    assertEquals(CustomUI.PRACTICE_UI_NAME, practiceUi.getName());

    CustomUI fuelUi = uiRepo.findByEntityId(CustomUI.FUEL_UI_ID);
    assertNotNull(fuelUi);
    assertEquals(CustomUI.FUEL_UI_NAME, fuelUi.getName());

    CustomUI customUi = uiRepo.findByEntityId("custom_ui_1");
    assertNotNull(customUi);
    assertEquals("My Custom Layout", customUi.getName());
  }

  @Test
  public void testBackfillCustomUIs_MigratesLegacyFuelId2() {
    SqliteRepository<CustomUI> uiRepo =
        new SqliteRepository<>(context, "custom_uis", CustomUI.class);
    uiRepo.drop();

    uiRepo.save(
        new CustomUI(
            "Fuel UI Layout", true, "{\"widgets\":[]}", "[]", "{}", "{}", "{}", "{}", "2", null));

    initializer.backfillCustomUIs(context);

    assertNull(uiRepo.findByEntityId("2"));
    CustomUI fuelUi = uiRepo.findByEntityId(CustomUI.FUEL_UI_ID);
    assertNotNull(fuelUi);
    assertEquals(CustomUI.FUEL_UI_NAME, fuelUi.getName());
  }

  @Test
  public void testBackfillCustomUIs_CreatesMissingDefaultUIs() {
    SqliteRepository<CustomUI> uiRepo =
        new SqliteRepository<>(context, "custom_uis", CustomUI.class);
    uiRepo.drop();

    initializer.backfillCustomUIs(context);

    List<CustomUI> uis = uiRepo.findAll();
    assertEquals(3, uis.size());
    assertNotNull(uiRepo.findByEntityId(CustomUI.DEFAULT_UI_ID));
    assertNotNull(uiRepo.findByEntityId(CustomUI.PRACTICE_UI_ID));
    assertNotNull(uiRepo.findByEntityId(CustomUI.FUEL_UI_ID));
  }

  @Test
  public void testResetDrivers_InitializesPitInAndFuelAudio() {
    initializer.resetDrivers(context);
    SqliteRepository<Driver> driverRepo = new SqliteRepository<>(context, "drivers", Driver.class);
    List<Driver> drivers = driverRepo.findAll();
    assertTrue("Should have initial drivers", drivers.size() > 0);
    for (Driver driver : drivers) {
      assertNotNull("Driver should have pit in audio", driver.getPitInAudio());
      assertEquals("default_pit_in", driver.getPitInAudio().getUrl());
      assertNotNull("Driver should have fuel audio", driver.getFuelAudio());
      assertEquals("default_fuel_level", driver.getFuelAudio().getUrl());
      assertEquals("audio_set", driver.getFuelAudio().getType());
    }
  }

  @Test
  public void testBackfillDrivers_PopulatesMissingPitInAndFuelAudio() {
    SqliteRepository<Driver> driverRepo = new SqliteRepository<>(context, "drivers", Driver.class);
    driverRepo.drop();

    Driver legacyDriver =
        new Driver.Builder()
            .withName("OldDriver")
            .withNickname("OldNick")
            .withEntityId("d_old_1")
            .withPitInAudio(null)
            .withFuelAudio(null)
            .build();
    driverRepo.save(legacyDriver);

    initializer.backfillDrivers(context);

    Driver updated = driverRepo.findByEntityId("d_old_1");
    assertNotNull(updated);
    assertNotNull(updated.getPitInAudio());
    assertEquals("default_pit_in", updated.getPitInAudio().getUrl());
    assertNotNull(updated.getFuelAudio());
    assertEquals("default_fuel_level", updated.getFuelAudio().getUrl());
    assertEquals("audio_set", updated.getFuelAudio().getType());
  }

  @Test
  public void testBackfillDrivers_UpdatesRawLegacyJsonInSqlite() throws Exception {
    SqliteRepository<Driver> driverRepo = new SqliteRepository<>(context, "drivers", Driver.class);
    driverRepo.drop();

    String legacyJson =
        "{\"@id\":1,\"entity_id\":\"d_legacy\",\"name\":\"Legacy\",\"nickname\":\"Leg\"}";
    try (java.sql.PreparedStatement stmt =
        context
            .getConnection()
            .prepareStatement("INSERT INTO drivers (entity_id, json_data) VALUES (?, ?)")) {
      stmt.setString(1, "d_legacy");
      stmt.setString(2, legacyJson);
      stmt.executeUpdate();
    }

    initializer.backfillDrivers(context);

    try (java.sql.Statement stmt = context.getConnection().createStatement();
        java.sql.ResultSet rs =
            stmt.executeQuery("SELECT json_data FROM drivers WHERE entity_id = 'd_legacy'")) {
      assertTrue(rs.next());
      String updatedJson = rs.getString("json_data");
      assertTrue(updatedJson.contains("pitInAudio"));
      assertTrue(updatedJson.contains("fuelAudio"));
      assertTrue(updatedJson.contains("default_pit_in"));
      assertTrue(updatedJson.contains("default_fuel_level"));
    }
  }

  @Test
  public void testBackfillDrivers_UpdatesFuelAudioPresetToAudioSetInSqlite() throws Exception {
    SqliteRepository<Driver> driverRepo = new SqliteRepository<>(context, "drivers", Driver.class);
    driverRepo.drop();

    String corruptedJson =
        "{\"@id\":1,\"entity_id\":\"d_corrupted\",\"name\":\"Corrupted\",\"nickname\":\"Corr\","
            + "\"pitInAudio\":{\"type\":\"preset\",\"url\":\"default_pit_in\",\"text\":\"\"},"
            + "\"overallBestLapAudio\":{\"type\":\"preset\",\"url\":\"default_record_lap\",\"text\":\"\"},"
            + "\"fuelAudio\":{\"type\":\"preset\",\"url\":\"default_fuel_level\",\"text\":\"\"}}";
    try (java.sql.PreparedStatement stmt =
        context
            .getConnection()
            .prepareStatement("INSERT INTO drivers (entity_id, json_data) VALUES (?, ?)")) {
      stmt.setString(1, "d_corrupted");
      stmt.setString(2, corruptedJson);
      stmt.executeUpdate();
    }

    initializer.backfillDrivers(context);

    try (java.sql.Statement stmt = context.getConnection().createStatement();
        java.sql.ResultSet rs =
            stmt.executeQuery("SELECT json_data FROM drivers WHERE entity_id = 'd_corrupted'")) {
      assertTrue(rs.next());
      String updatedJson = rs.getString("json_data");
      assertTrue(updatedJson.contains("\"fuelAudio\":{\"type\":\"audio_set\""));
    }
  }
}
