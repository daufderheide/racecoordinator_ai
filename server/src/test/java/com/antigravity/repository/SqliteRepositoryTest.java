package com.antigravity.repository;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.Driver;
import com.antigravity.models.Lane;
import com.antigravity.models.Track;
import java.io.File;
import java.util.Arrays;
import java.util.List;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;

@RunWith(JUnit4.class)
public class SqliteRepositoryTest {

  @Rule public TemporaryFolder tempFolder = new TemporaryFolder();

  private DatabaseContext databaseContext;
  private SqliteRepository<Driver> driverRepository;
  private SqliteRepository<Track> trackRepository;

  @Before
  public void setUp() throws Exception {
    String rootDir = tempFolder.newFolder("db_root").getAbsolutePath() + File.separator;
    databaseContext = new DatabaseContext("test_db", null, rootDir);
    driverRepository = new SqliteRepository<>(databaseContext, "drivers", Driver.class);
    trackRepository = new SqliteRepository<>(databaseContext, "tracks", Track.class);
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

  @Test
  public void testInsertAndFindById() {
    Driver driver = new Driver("Lewis Hamilton", "Lewis", "d44", "d44");
    driverRepository.insert(driver);

    Driver found = driverRepository.findByEntityId("d44");
    assertNotNull(found);
    assertEquals("Lewis Hamilton", found.getName());
    assertEquals("Lewis", found.getNickname());
  }

  @Test
  public void testReplace() {
    Driver driver = new Driver("Max Verstappen", "Max", "d33", "d33");
    driverRepository.insert(driver);

    Driver updatedDriver = new Driver("Max Verstappen", "SuperMax", "d33", "d33");
    driverRepository.replace("d33", updatedDriver);

    Driver found = driverRepository.findByEntityId("d33");
    assertNotNull(found);
    assertEquals("SuperMax", found.getNickname());
  }

  @Test
  public void testDelete() {
    Driver driver = new Driver("Charles Leclerc", "Charles", "d16", "d16");
    driverRepository.insert(driver);

    assertNotNull(driverRepository.findByEntityId("d16"));

    driverRepository.delete("d16");
    assertNull(driverRepository.findByEntityId("d16"));
  }

  @Test
  public void testFindAll() {
    Driver d1 = new Driver("Driver One", "D1", "d1", "d1");
    Driver d2 = new Driver("Driver Two", "D2", "d2", "d2");
    driverRepository.insert(d1);
    driverRepository.insert(d2);

    List<Driver> drivers = driverRepository.findAll();
    assertEquals(2, drivers.size());
  }

  @Test
  public void testComplexNestedModelPersistence() {
    Lane lane1 = new Lane("#ff0000", "#ffffff", 100, "l1", null);
    Lane lane2 = new Lane("#00ff00", "#000000", 100, "l2", null);
    Track track =
        new Track.Builder()
            .name("Monza")
            .numTrackSections(50)
            .lanes(Arrays.asList(lane1, lane2))
            .entityId("t_monza")
            .build();

    trackRepository.insert(track);

    Track found = trackRepository.findByEntityId("t_monza");
    assertNotNull(found);
    assertEquals("Monza", found.getName());
    assertEquals(50, found.getNumTrackSections());
    assertEquals(2, found.getLanes().size());
  }

  @Test
  public void testNextSequence() {
    String seq1 = driverRepository.getNextSequence();
    String seq2 = driverRepository.getNextSequence();

    assertEquals("1", seq1);
    assertEquals("2", seq2);
  }
}
