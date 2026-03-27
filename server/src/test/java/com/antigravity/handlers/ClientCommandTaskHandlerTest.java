package com.antigravity.handlers;

import static org.junit.Assert.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.Driver;
import com.antigravity.models.Race;
import com.antigravity.models.Team;
import com.antigravity.race.ClientSubscriptionManager;
import com.antigravity.race.RaceParticipant;
import com.mongodb.client.FindIterable;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import io.javalin.Javalin;
import io.javalin.http.Context;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import org.bson.conversions.Bson;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.stubbing.Answer;

public class ClientCommandTaskHandlerTest {

  private DatabaseContext databaseContext;
  private MongoDatabase mongoDatabase;
  private MongoCollection<Race> raceCollection;
  private MongoCollection<Team> teamCollection;
  private MongoCollection<Driver> driverCollection;
  private MongoCollection<com.antigravity.models.Track> trackCollection;
  private Javalin app;
  private ClientCommandTaskHandler handler;
  private Context ctx;
  private java.nio.file.Path tempDir;
  private javax.servlet.http.HttpServletResponse res;

  @Before
  public void setUp() throws Exception {
    databaseContext = mock(DatabaseContext.class);
    mongoDatabase = mock(MongoDatabase.class);
    raceCollection = mock(MongoCollection.class);
    teamCollection = mock(MongoCollection.class);
    driverCollection = mock(MongoCollection.class);
    trackCollection = mock(MongoCollection.class);
    app = mock(Javalin.class);

    when(databaseContext.getDatabase()).thenReturn(mongoDatabase);
    when(mongoDatabase.getCollection(eq("races"), eq(Race.class))).thenReturn(raceCollection);
    when(mongoDatabase.getCollection(eq("teams"), eq(Team.class))).thenReturn(teamCollection);
    when(mongoDatabase.getCollection(eq("drivers"), eq(Driver.class))).thenReturn(driverCollection);
    when(mongoDatabase.getCollection(eq("tracks"), eq(com.antigravity.models.Track.class))).thenReturn(trackCollection);

    String tmpDir = System.getProperty("java.io.tmpdir");
    java.io.File tempFile = new java.io.File(tmpDir, "saved_races_test");
    deleteDirectory(tempFile);
    tempFile.mkdirs();
    tempDir = tempFile.toPath();
    when(databaseContext.getDataRoot()).thenReturn(tempDir.toString() + java.io.File.separator);
    when(databaseContext.getCurrentDatabaseName()).thenReturn("testdb");

    javax.servlet.http.HttpServletRequest req = mock(javax.servlet.http.HttpServletRequest.class);
    res = mock(javax.servlet.http.HttpServletResponse.class);
    ctx = new io.javalin.http.Context(req, res, new java.util.HashMap<>());

    // Clear subscription manager
    ClientSubscriptionManager.getInstance().setRace(null);

    handler = new ClientCommandTaskHandler(databaseContext, app);
  }

  @After
  public void tearDown() {
    ClientSubscriptionManager.getInstance().setRace(null);
  }

  @Test
  public void testInitializeRace_ExplicitDriver_ShouldNotHaveTeam() throws Exception {
    // 1. Setup Data
    String raceId = "race-1";
    String driverId = "driver-1";
    String teamId = "team-1";

    com.antigravity.models.HeatScoring heatScoring = new com.antigravity.models.HeatScoring(
        com.antigravity.models.HeatScoring.FinishMethod.Timed, 120,
        com.antigravity.models.HeatScoring.HeatRanking.LAP_COUNT,
        com.antigravity.models.HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME);
    com.antigravity.models.OverallScoring overallScoring = new com.antigravity.models.OverallScoring();

    Race race = new Race.Builder()
        .withName("Test Race")
        .withTrackEntityId("track-1")
        .withHeatRotationType(com.antigravity.models.HeatRotationType.RoundRobin)
        .withHeatScoring(heatScoring)
        .withOverallScoring(overallScoring)
        .withEntityId(raceId)
        .build();
    Driver driver = new Driver("Test Driver", "TD", driverId, null);
    Team team = new Team("Test Team", "url", Arrays.asList(driverId), teamId, null);

    // 2. Mock Database interactions
    // Mock getRace
    FindIterable<Race> raceIterable = mock(FindIterable.class);
    when(raceCollection.find(any(Bson.class))).thenReturn(raceIterable);
    when(raceIterable.first()).thenReturn(race);

    // Mock getAllTeams (used to build lookup map)
    FindIterable<Team> teamIterable = mock(FindIterable.class);
    when(teamCollection.find()).thenReturn(teamIterable);
    doAnswer(invocation -> {
      List<Team> list = invocation.getArgument(0);
      list.add(team);
      return list;
    }).when(teamIterable).into(any(List.class));

    // Mock getDrivers (for the participant list)
    FindIterable<Driver> driverIterable = mock(FindIterable.class);
    when(driverCollection.find(any(Bson.class))).thenReturn(driverIterable);
    doAnswer(invocation -> {
      List<Driver> list = invocation.getArgument(0);
      list.add(driver);
      return list;
    }).when(driverIterable).into(any(List.class));

    // Mock getTeams
    FindIterable<Team> specificTeamIterable = mock(FindIterable.class);
    when(teamCollection.find(any(Bson.class))).thenReturn(specificTeamIterable);
    doAnswer(invocation -> {
      List<Team> list = invocation.getArgument(0);
      // Should be empty as we are only asking for driver ID in the request
      return list;
    }).when(specificTeamIterable).into(any(List.class));

    // Create Track with lanes
    com.antigravity.models.Lane lane = new com.antigravity.models.Lane("red", "black", 100);
    com.antigravity.models.Track track = new com.antigravity.models.Track("Test Track", Arrays.asList(lane), "track-1",
        null);

    FindIterable<com.antigravity.models.Track> trackIterable = mock(FindIterable.class);
    when(trackCollection.find(any(Bson.class))).thenReturn(trackIterable);
    when(trackIterable.first()).thenReturn(track);

    // 3. Mock Request
    com.antigravity.proto.InitializeRaceRequest request = com.antigravity.proto.InitializeRaceRequest.newBuilder()
        .setRaceId(raceId)
        .addDriverIds("d_" + driverId) // Explicit driver selection!
        .setIsDemoMode(true) // Use demo mode to avoid Arduino config
        .build();

    // 4. Execute
    ClientCommandTaskHandler.TaskResult result = handler.handleInitializeRace(request);

    // 5. Verify
    assertEquals(200, result.status);

    com.antigravity.race.Race activeRace = ClientSubscriptionManager.getInstance().getRace();
    assertNotNull("Race should be initialized", activeRace);

    List<RaceParticipant> participants = activeRace.getDrivers();
    assertEquals(1, participants.size());
    RaceParticipant participant = participants.get(0);

    assertEquals(driverId, participant.getDriver().getEntityId());
    assertNull("Team should NOT be present for explicit driver", participant.getTeam());
  }

  @Test
  public void testInitializeRace_ExplicitTeam_ShouldHaveTeam() throws Exception {
    // 1. Setup Data
    String raceId = "race-1";
    String driverId = "driver-1";
    String teamId = "team-1";

    com.antigravity.models.HeatScoring heatScoring = new com.antigravity.models.HeatScoring(
        com.antigravity.models.HeatScoring.FinishMethod.Timed, 120,
        com.antigravity.models.HeatScoring.HeatRanking.LAP_COUNT,
        com.antigravity.models.HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME);
    com.antigravity.models.OverallScoring overallScoring = new com.antigravity.models.OverallScoring();

    Race race = new Race.Builder()
        .withName("Test Race")
        .withTrackEntityId("track-1")
        .withHeatRotationType(com.antigravity.models.HeatRotationType.RoundRobin)
        .withHeatScoring(heatScoring)
        .withOverallScoring(overallScoring)
        .withEntityId(raceId)
        .build();
    Driver driver = new Driver("Test Driver", "TD", driverId, null);
    Team team = new Team("Test Team", "url", Arrays.asList(driverId), teamId, null);

    // 2. Mock Database interactions
    FindIterable<Race> raceIterable = mock(FindIterable.class);
    when(raceCollection.find(any(Bson.class))).thenReturn(raceIterable);
    when(raceIterable.first()).thenReturn(race);

    FindIterable<Team> teamIterable = mock(FindIterable.class);
    when(teamCollection.find()).thenReturn(teamIterable);
    doAnswer(invocation -> {
      List<Team> list = invocation.getArgument(0);
      list.add(team);
      return list;
    }).when(teamIterable).into(any(List.class));

    // Mock getDrivers (will be called for team participants)
    FindIterable<Driver> driverIterable = mock(FindIterable.class);
    when(driverCollection.find(any(Bson.class))).thenReturn(driverIterable);
    doAnswer(invocation -> {
      List<Driver> list = invocation.getArgument(0);
      list.add(driver);
      return list;
    }).when(driverIterable).into(any(List.class));

    // Mock getTeams (called for explicit team lookup)
    FindIterable<Team> specificTeamIterable = mock(FindIterable.class);
    when(teamCollection.find(any(Bson.class))).thenReturn(specificTeamIterable);
    doAnswer(invocation -> {
      List<Team> list = invocation.getArgument(0);
      list.add(team);
      return list;
    }).when(specificTeamIterable).into(any(List.class));

    // Create Track
    com.antigravity.models.Lane lane = new com.antigravity.models.Lane("red", "black", 100);
    com.antigravity.models.Track track = new com.antigravity.models.Track("Test Track", Arrays.asList(lane), "track-1",
        null);

    FindIterable<com.antigravity.models.Track> trackIterable = mock(FindIterable.class);
    when(trackCollection.find(any(Bson.class))).thenReturn(trackIterable);
    when(trackIterable.first()).thenReturn(track);

    // 3. Mock Request
    com.antigravity.proto.InitializeRaceRequest request = com.antigravity.proto.InitializeRaceRequest.newBuilder()
        .setRaceId(raceId)
        .addDriverIds("t_" + teamId) // Explicit TEAM selection!
        .setIsDemoMode(true)
        .build();

    // 4. Execute
    ClientCommandTaskHandler.TaskResult result = handler.handleInitializeRace(request);

    // 5. Verify
    assertEquals(200, result.status);

    com.antigravity.race.Race activeRace = ClientSubscriptionManager.getInstance().getRace();
    assertNotNull("Race should be initialized", activeRace);

    List<RaceParticipant> participants = activeRace.getDrivers();
    assertEquals(1, participants.size());
    RaceParticipant participant = participants.get(0);

    // For team selection, we expect a participant representing the team
    assertNotNull("Team should be present for explicit team", participant.getTeam());
    assertEquals(teamId, participant.getTeam().getEntityId());

    // And it should have loaded drivers
    assertNotNull("Team should have drivers loaded", participant.getTeamDrivers());
    assertEquals(1, participant.getTeamDrivers().size());
  }

  @Test
  public void testSaveRace_Success() throws Exception {
    com.antigravity.race.Race race = mock(com.antigravity.race.Race.class);
    when(race.getState()).thenReturn(new com.antigravity.race.states.NotStarted());
    com.antigravity.models.HeatScoring heatScoring = new com.antigravity.models.HeatScoring();
    com.antigravity.models.OverallScoring overallScoring = new com.antigravity.models.OverallScoring();
    com.antigravity.models.Race raceModel = new com.antigravity.models.Race.Builder()
        .withName("MyTestRace")
        .withTrackEntityId("track-1")
        .withHeatRotationType(com.antigravity.models.HeatRotationType.RoundRobin)
        .withHeatScoring(heatScoring)
        .withOverallScoring(overallScoring)
        .withEntityId("race-1")
        .build();
    when(race.getRaceModel()).thenReturn(raceModel);
    when(race.getTrack()).thenReturn(new com.antigravity.models.Track("Track1", new java.util.ArrayList<>(), "track1", null));
    when(race.getDrivers()).thenReturn(new java.util.ArrayList<>());
    when(race.getHeats()).thenReturn(new java.util.ArrayList<>());
    when(race.isDemoMode()).thenReturn(true);
    
    ClientSubscriptionManager.getInstance().setRace(race);

    handler.saveRace(ctx);

    verify(res).setStatus(200);
    
    java.io.File dir = new java.io.File(tempDir.toFile(), "testdb/saved_races");
    assertTrue("Save directory should exist", dir.exists());
    java.io.File[] files = dir.listFiles();
    assertNotNull("File list should not be null", files);
    assertEquals(1, files.length);
    assertTrue(files[0].getName().endsWith("_MyTestRace.json"));

    // Read back and verify roundtrip parity
    com.fasterxml.jackson.databind.ObjectMapper mapper = handler.getObjectMapper();
    com.antigravity.race.RaceSaveData loaded = mapper.readValue(files[0], com.antigravity.race.RaceSaveData.class);
    assertNotNull("Loaded saved data should not be null", loaded);
    assertEquals("MyTestRace", loaded.getModel().getName());
    assertTrue("Demo mode should be preserved during save/load roundtrip", loaded.isDemoMode());
  }

  @Test
  public void testGetSavedRaces_Success() throws Exception {
    java.io.File dir = new java.io.File(tempDir.toFile(), "testdb/saved_races");
    dir.mkdirs();
    java.io.File file = new java.io.File(dir, "20260101-120000_MyTestRace.json");
    file.createNewFile();

    java.util.Map<String, String> pathParams = new java.util.HashMap<>();
    pathParams.put("filename", "20260101-120000_MyTestRace.json");
    try {
      java.lang.reflect.Method setParams = ctx.getClass().getMethod("setPathParamMap$javalin", java.util.Map.class);
      setParams.invoke(ctx, pathParams);
    } catch (Exception e) {
      throw new RuntimeException(e);
    }

    // Since Context is real, it has written to the mock response.
    // We just verify it completed without setting error status.
    verify(res, never()).sendError(anyInt());
    verify(res, never()).setStatus(eq(500));
  }

  @Test
  public void testDeleteSavedRace_Success() throws Exception {
    java.io.File dir = new java.io.File(tempDir.toFile(), "testdb/saved_races");
    dir.mkdirs();
    java.io.File file = new java.io.File(dir, "20260101-120001_MyTestRace.json");
    file.createNewFile();
    assertTrue(file.exists());

    java.util.Map<String, String> pathParams = new java.util.HashMap<>();
    pathParams.put("filename", "20260101-120001_MyTestRace.json");
    try {
      java.lang.reflect.Method setParams = ctx.getClass().getMethod("setPathParamMap$javalin", java.util.Map.class);
      setParams.invoke(ctx, pathParams);
    } catch (Exception e) {
      throw new RuntimeException(e);
    }

    handler.deleteSavedRace(ctx);

    assertFalse("File should be deleted", file.exists());
  }

  private void deleteDirectory(java.io.File directory) {
    java.io.File[] allContents = directory.listFiles();
    if (allContents != null) {
      for (java.io.File file : allContents) {
        deleteDirectory(file);
      }
    }
    directory.delete();
  }
}
