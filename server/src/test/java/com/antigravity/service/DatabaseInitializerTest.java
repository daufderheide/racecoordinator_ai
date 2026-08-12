package com.antigravity.service;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.Driver;
import com.antigravity.models.Race;
import com.antigravity.models.Team;
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
    assertTrue("Should initialize default races", races.size() >= 3);

    SqliteRepository<Team> teamRepo = new SqliteRepository<>(context, "teams", Team.class);
    List<Team> teams = teamRepo.findAll();
    assertEquals(2, teams.size());
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

    // Should already have practice race
    initializer.backfillRaces(context);
    SqliteRepository<Race> raceRepo = new SqliteRepository<>(context, "races", Race.class);
    List<Race> races = raceRepo.findAll();
    long practiceCount = races.stream().filter(r -> "Practice".equals(r.getName())).count();
    assertEquals(1, practiceCount);
  }
}
