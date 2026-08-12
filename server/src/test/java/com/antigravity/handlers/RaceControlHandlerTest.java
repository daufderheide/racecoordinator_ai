package com.antigravity.handlers;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;

import com.antigravity.context.DatabaseContext;
import com.antigravity.handlers.ClientCommandTaskHandler.TaskResult;
import com.antigravity.models.Driver;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.Lane;
import com.antigravity.models.OverallScoring;
import com.antigravity.models.Race;
import com.antigravity.models.Track;
import com.antigravity.proto.InitializeRaceRequest;
import com.antigravity.race.ClientSubscriptionManager;
import com.antigravity.race.RaceParticipant;
import com.antigravity.repository.SqliteRepository;
import java.io.File;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.List;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;

public class RaceControlHandlerTest {

  private DatabaseContext databaseContext;
  private RaceControlHandler handler;
  private Path tempDir;

  @Before
  public void setUp() throws Exception {
    String tmpDir = System.getProperty("java.io.tmpdir");
    File tempFile = new File(tmpDir, "race_control_test_" + System.currentTimeMillis());
    tempFile.mkdirs();
    tempDir = tempFile.toPath();

    databaseContext = new DatabaseContext("testdb", null, tempDir.toString() + File.separator);
    ClientSubscriptionManager.setInstance(null);
    handler = new RaceControlHandler(databaseContext);
  }

  @After
  public void tearDown() {
    ClientSubscriptionManager.setInstance(null);
  }

  @Test
  public void testHandleInitializeRace_ExplicitDriver() throws Exception {
    String raceId = "race-1";
    String driverId = "driver-1";

    HeatScoring heatScoring =
        new HeatScoring(
            HeatScoring.FinishMethod.Timed,
            120,
            HeatScoring.HeatRanking.LAP_COUNT,
            HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME);
    OverallScoring overallScoring = new OverallScoring();

    Race race =
        new Race.Builder()
            .withName("Test Race")
            .withTrackEntityId("track-1")
            .withHeatRotationType(HeatRotationType.RoundRobin)
            .withHeatScoring(heatScoring)
            .withOverallScoring(overallScoring)
            .withEntityId(raceId)
            .build();
    Driver driver = new Driver("Test Driver", "TD", driverId, null);

    Lane lane = new Lane("red", "black", 100);
    Track track =
        new Track.Builder()
            .name("Test Track")
            .lanes(Arrays.asList(lane))
            .entityId("track-1")
            .id(null)
            .build();

    new SqliteRepository<>(databaseContext, "races", Race.class).insert(race);
    new SqliteRepository<>(databaseContext, "drivers", Driver.class).insert(driver);
    new SqliteRepository<>(databaseContext, "tracks", Track.class).insert(track);

    InitializeRaceRequest request =
        InitializeRaceRequest.newBuilder()
            .setRaceId(raceId)
            .addDriverIds("d_" + driverId)
            .setIsDemoMode(true)
            .build();

    TaskResult result = handler.handleInitializeRace(request);
    assertEquals(200, result.status);

    com.antigravity.race.Race activeRace = ClientSubscriptionManager.getInstance().getRace();
    assertNotNull(activeRace);
    List<RaceParticipant> participants = activeRace.getDrivers();
    assertEquals(1, participants.size());
    assertEquals(driverId, participants.get(0).getDriver().getEntityId());
    assertNull(participants.get(0).getTeam());
  }
}
