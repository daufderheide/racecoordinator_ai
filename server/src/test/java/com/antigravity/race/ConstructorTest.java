package com.antigravity.race;

import static org.junit.Assert.assertNotNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.Race;
import com.antigravity.models.Track;
import java.io.File;
import java.util.ArrayList;
import java.util.List;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;

public class ConstructorTest {

  @Rule public TemporaryFolder tempFolder = new TemporaryFolder();
  private DatabaseContext dbContext;

  @Before
  public void setUp() throws Exception {
    String rootDir = tempFolder.newFolder("db_root").getAbsolutePath() + File.separator;
    dbContext = new DatabaseContext("test_db", null, rootDir);
  }

  @After
  public void tearDown() {
    if (dbContext != null && dbContext.getConnection() != null) {
      try {
        dbContext.getConnection().close();
      } catch (Exception ignored) {
      }
    }
  }

  @Test
  public void testCustomRotationsLoadedOnResume() {
    Race model = mock(Race.class);
    when(model.getHeatRotationType()).thenReturn(HeatRotationType.Custom);
    when(model.getCustomRotationAssetId()).thenReturn("asset1");
    List<RaceParticipant> drivers = new ArrayList<>();
    drivers.add(
        new RaceParticipant(
            new com.antigravity.models.Driver(
                "d1", "Driver 1", null, null, null, null, null, null, null, null, null, "d1", null),
            "p1"));
    Track track = mock(Track.class);

    List<Heat> heats = new ArrayList<>();
    heats.add(mock(Heat.class));

    com.antigravity.race.Race race =
        new com.antigravity.race.Race.Builder()
            .model(model)
            .drivers(drivers)
            .track(track)
            .databaseContext(dbContext)
            .heats(heats)
            .isDemoMode(true)
            .build();

    assertNotNull(race);
  }
}
