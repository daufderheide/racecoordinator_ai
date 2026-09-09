package com.antigravity.service;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
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
}
