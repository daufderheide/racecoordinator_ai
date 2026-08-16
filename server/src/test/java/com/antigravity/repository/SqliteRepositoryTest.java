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

  @Test
  public void testDropClearsTable() {
    Driver d1 = new Driver("Driver One", "D1", "d1", "d1");
    driverRepository.insert(d1);
    assertEquals(1, driverRepository.findAll().size());

    driverRepository.drop();
    assertEquals(0, driverRepository.findAll().size());
  }

  @Test
  public void testSaveNullEntityIsNoOp() {
    driverRepository.save(null);
    driverRepository.insert(null);
    assertEquals(0, driverRepository.findAll().size());
  }

  @Test
  public void testFindByEntityIdNullOrEmptyReturnsNull() {
    assertNull(driverRepository.findByEntityId(null));
    assertNull(driverRepository.findByEntityId(""));
    assertNull(driverRepository.findByEntityId("   "));
  }

  @Test
  public void testDeleteNullOrEmptyIsNoOp() {
    Driver d1 = new Driver("Driver One", "D1", "d1", "d1");
    driverRepository.insert(d1);

    driverRepository.delete(null);
    driverRepository.delete("");
    driverRepository.delete("   ");
    assertEquals(1, driverRepository.findAll().size());
  }

  public static class RacePojo {
    private String raceId;
    private String title;

    public RacePojo() {}

    public RacePojo(String raceId, String title) {
      this.raceId = raceId;
      this.title = title;
    }

    public String getRaceId() {
      return raceId;
    }

    public void setRaceId(String raceId) {
      this.raceId = raceId;
    }

    public String getTitle() {
      return title;
    }

    public void setTitle(String title) {
      this.title = title;
    }
  }

  public static class IdPojo {
    private String id;
    private String val;

    public IdPojo() {}

    public IdPojo(String id, String val) {
      this.id = id;
      this.val = val;
    }

    public String getId() {
      return id;
    }

    public void setId(String id) {
      this.id = id;
    }

    public String getVal() {
      return val;
    }

    public void setVal(String val) {
      this.val = val;
    }
  }

  public static class FallbackPojo {
    private String description;

    public FallbackPojo() {}

    public FallbackPojo(String description) {
      this.description = description;
    }

    public String getDescription() {
      return description;
    }

    public void setDescription(String description) {
      this.description = description;
    }
  }

  @Test
  public void testExtractEntityIdFromDifferentObjectTypes() {
    SqliteRepository<RacePojo> raceRepo =
        new SqliteRepository<>(databaseContext, "custom_races", RacePojo.class);
    RacePojo race = new RacePojo("r_999", "Grand Prix");
    raceRepo.save(race);
    RacePojo foundRace = raceRepo.findByEntityId("r_999");
    assertNotNull(foundRace);
    assertEquals("Grand Prix", foundRace.getTitle());

    SqliteRepository<IdPojo> idRepo =
        new SqliteRepository<>(databaseContext, "custom_ids", IdPojo.class);
    IdPojo idPojo = new IdPojo("id_888", "Custom Value");
    idRepo.save(idPojo);
    IdPojo foundId = idRepo.findByEntityId("id_888");
    assertNotNull(foundId);
    assertEquals("Custom Value", foundId.getVal());

    SqliteRepository<FallbackPojo> fallbackRepo =
        new SqliteRepository<>(databaseContext, "custom_fallbacks", FallbackPojo.class);
    FallbackPojo fallback = new FallbackPojo("Random Object");
    fallbackRepo.save(fallback);
    List<FallbackPojo> allFallbacks = fallbackRepo.findAll();
    assertEquals(1, allFallbacks.size());
    assertEquals("Random Object", allFallbacks.get(0).getDescription());
  }

  @Test
  public void testOperationsWithClosedConnectionHandleGracefully() throws Exception {
    Driver d1 = new Driver("Driver One", "D1", "d1", "d1");
    driverRepository.insert(d1);

    databaseContext.getConnection().close();

    List<Driver> result = driverRepository.findAll();
    assertNotNull(result);
    assertNull(driverRepository.findByEntityId("d1"));
    driverRepository.delete("d1");
    driverRepository.drop();
  }
}
