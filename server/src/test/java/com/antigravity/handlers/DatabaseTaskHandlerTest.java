package com.antigravity.handlers;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertThrows;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.DriverStatistics;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.Race;
import com.antigravity.models.Team;
import com.antigravity.models.TeamOptions;
import com.antigravity.models.Track;
import com.antigravity.race.ClientSubscriptionManager;
import com.mongodb.client.FindIterable;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.result.DeleteResult;
import com.mongodb.client.result.UpdateResult;
import io.javalin.Javalin;
import io.javalin.http.Context;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.bson.Document;
import org.bson.conversions.Bson;
import org.junit.Before;
import org.junit.Test;

public class DatabaseTaskHandlerTest {

  private DatabaseContext databaseContext;
  private MongoDatabase mongoDatabase;
  private MongoCollection<Race> raceCollection;
  private MongoCollection<Team> teamCollection;
  private MongoCollection<com.antigravity.models.Driver> driverCollection;
  private MongoCollection<Document> countersCollection;
  private Javalin app;
  private DatabaseTaskHandler handler;
  private ClientSubscriptionManager mockManager;

  @Before
  @SuppressWarnings("unchecked")
  public void setUp() {
    databaseContext = mock(DatabaseContext.class);
    mongoDatabase = mock(MongoDatabase.class);
    raceCollection = mock(MongoCollection.class);
    teamCollection = mock(MongoCollection.class);
    countersCollection = mock(MongoCollection.class);
    app = mock(Javalin.class);

    when(databaseContext.getDatabase()).thenReturn(mongoDatabase);
    when(mongoDatabase.getCollection(any(String.class))).thenReturn(mock(MongoCollection.class));
    when(mongoDatabase.getCollection(eq("races"), eq(Race.class))).thenReturn(raceCollection);
    when(mongoDatabase.getCollection(eq("teams"), eq(Team.class))).thenReturn(teamCollection);
    driverCollection = mock(MongoCollection.class);
    when(mongoDatabase.getCollection(eq("drivers"), eq(com.antigravity.models.Driver.class)))
        .thenReturn(driverCollection);
    when(mongoDatabase.getCollection(eq("tracks"), eq(Track.class)))
        .thenReturn(mock(MongoCollection.class));
    when(mongoDatabase.getCollection(eq("counters"))).thenReturn(countersCollection);

    mockManager = mock(ClientSubscriptionManager.class);
    ClientSubscriptionManager.setInstance(mockManager);

    handler = new DatabaseTaskHandler(databaseContext, app);
  }

  @org.junit.After
  public void tearDown() {
    ClientSubscriptionManager.setInstance(null);
  }

  @Test
  @SuppressWarnings("unchecked")
  public void testCreateRace_Success() {
    TeamOptions teamOptions = new TeamOptions(10, 60.0, 100, 600.0, true);
    Race raceRequest =
        new Race.Builder()
            .withName("New Race")
            .withTrackEntityId("track-1")
            .withMinLapTime(2.5)
            .withTeamOptions(teamOptions)
            .withEntityId("new")
            .build();

    // Mock uniqueness check - no existing race
    FindIterable<Race> findIterable = mock(FindIterable.class);
    when(raceCollection.find(any(Bson.class))).thenReturn(findIterable);
    when(findIterable.first()).thenReturn(null);

    // Mock sequence generation
    Document counterDoc = new Document("seq", 100);
    when(countersCollection.findOneAndUpdate(any(Bson.class), any(Bson.class), any()))
        .thenReturn(counterDoc);

    Race created = handler.createRace(raceRequest);

    assertNotNull(created);
    assertEquals("100", created.getEntityId());
    assertEquals(2.5, created.getMinLapTime(), 0.001);
    assertNotNull(created.getTeamOptions());
    assertEquals(10, created.getTeamOptions().getHeatLapLimit());
    assertEquals(true, created.getTeamOptions().isRequirePitStopChangeDriver());
    verify(raceCollection).insertOne(any(Race.class));
  }

  @Test
  @SuppressWarnings("unchecked")
  public void testCreateRace_SoloRotation() {
    Race raceRequest =
        new Race.Builder()
            .withName("Solo Race")
            .withTrackEntityId("track-1")
            .withHeatRotationType(HeatRotationType.SingleHeatSolo)
            .withSoloLaneIndex(3)
            .withEntityId("new")
            .build();

    // Mock uniqueness check
    FindIterable<Race> findIterable = mock(FindIterable.class);
    when(raceCollection.find(any(Bson.class))).thenReturn(findIterable);
    when(findIterable.first()).thenReturn(null);

    // Mock sequence generation
    Document counterDoc = new Document("seq", 101);
    when(countersCollection.findOneAndUpdate(any(Bson.class), any(Bson.class), any()))
        .thenReturn(counterDoc);

    Race created = handler.createRace(raceRequest);

    assertNotNull(created);
    assertEquals("101", created.getEntityId());
    assertEquals(HeatRotationType.SingleHeatSolo, created.getHeatRotationType());
    assertEquals(3, created.getSoloLaneIndex());
    verify(raceCollection).insertOne(any(Race.class));
  }

  @Test
  @SuppressWarnings("unchecked")
  public void testCreateRace_CustomRotation() {
    Race raceRequest =
        new Race.Builder()
            .withName("Custom Race")
            .withTrackEntityId("track-1")
            .withHeatRotationType(HeatRotationType.CustomRoundRobin)
            .withCustomRotationSequence(java.util.Arrays.asList(1, 2, 3))
            .withCustomRotationAssetId("asset-123")
            .withEntityId("new")
            .build();

    // Mock uniqueness check
    FindIterable<Race> findIterable = mock(FindIterable.class);
    when(raceCollection.find(any(Bson.class))).thenReturn(findIterable);
    when(findIterable.first()).thenReturn(null);

    // Mock sequence generation
    Document counterDoc = new Document("seq", 102);
    when(countersCollection.findOneAndUpdate(any(Bson.class), any(Bson.class), any()))
        .thenReturn(counterDoc);

    Race created = handler.createRace(raceRequest);

    assertNotNull(created);
    assertEquals("102", created.getEntityId());
    assertEquals(HeatRotationType.CustomRoundRobin, created.getHeatRotationType());
    assertEquals(java.util.Arrays.asList(1, 2, 3), created.getCustomRotationSequence());
    assertEquals("asset-123", created.getCustomRotationAssetId());
    verify(raceCollection).insertOne(any(Race.class));
  }

  @Test
  @SuppressWarnings("unchecked")
  public void testCreateRace_WithHeatTimesThroughAndReverse() {
    Race raceRequest =
        new Race.Builder()
            .withName("Repeated Race")
            .withTrackEntityId("track-1")
            .withHeatTimesThrough(3)
            .withReverseHeats(true)
            .withEntityId("new")
            .build();

    // Mock uniqueness check
    FindIterable<Race> findIterable = mock(FindIterable.class);
    when(raceCollection.find(any(Bson.class))).thenReturn(findIterable);
    when(findIterable.first()).thenReturn(null);

    // Mock sequence generation
    Document counterDoc = new Document("seq", 103);
    when(countersCollection.findOneAndUpdate(any(Bson.class), any(Bson.class), any()))
        .thenReturn(counterDoc);

    Race created = handler.createRace(raceRequest);

    assertNotNull(created);
    assertEquals(3, created.getHeatTimesThrough());
    assertTrue(created.isReverseHeats());
    verify(raceCollection).insertOne(any(Race.class));
  }

  @Test
  @SuppressWarnings("unchecked")
  public void testCreateRace_DuplicateName() {
    Race raceRequest =
        new Race.Builder()
            .withName("Duplicate Race")
            .withTrackEntityId("track-1")
            .withEntityId("new")
            .build();

    // Mock uniqueness check - race exists
    FindIterable<Race> findIterable = mock(FindIterable.class);
    when(raceCollection.find(any(Bson.class))).thenReturn(findIterable);
    when(findIterable.first())
        .thenReturn(
            new Race.Builder()
                .withName("Duplicate Race")
                .withTrackEntityId("track-1")
                .withEntityId("existing-1")
                .build());

    assertThrows(
        IllegalArgumentException.class,
        () -> {
          handler.createRace(raceRequest);
        });

    verify(raceCollection, never()).insertOne(any(Race.class));
  }

  @Test
  @SuppressWarnings("unchecked")
  public void testUpdateRace_Success() {
    String raceId = "race-123";
    TeamOptions teamOptions = new TeamOptions(20, 120.0, 200, 1200.0, false);
    Race raceUpdate =
        new Race.Builder()
            .withName("Updated Name")
            .withTrackEntityId("track-1")
            .withMinLapTime(3.5)
            .withTeamOptions(teamOptions)
            .withEntityId(raceId)
            .build();

    // Mock uniqueness check - no OTHER race with same name
    FindIterable<Race> findIterable = mock(FindIterable.class);
    when(raceCollection.find(any(Bson.class))).thenReturn(findIterable);
    when(findIterable.first()).thenReturn(null);

    UpdateResult updateResult = mock(UpdateResult.class);
    when(updateResult.getMatchedCount()).thenReturn(1L);
    when(raceCollection.replaceOne(any(Bson.class), any(Race.class))).thenReturn(updateResult);

    Race updated = handler.updateRace(raceId, raceUpdate);

    assertNotNull(updated);
    assertEquals("Updated Name", updated.getName());
    assertEquals(3.5, updated.getMinLapTime(), 0.001);
    assertNotNull(updated.getTeamOptions());
    assertEquals(20, updated.getTeamOptions().getHeatLapLimit());
    assertEquals(false, updated.getTeamOptions().isRequirePitStopChangeDriver());
    verify(raceCollection).replaceOne(any(Bson.class), any(Race.class));
  }

  @Test
  @SuppressWarnings("unchecked")
  public void testUpdateRace_WithHeatTimesThroughAndReverse() {
    String raceId = "race-456";
    Race raceUpdate =
        new Race.Builder()
            .withName("Updated Repeated Race")
            .withTrackEntityId("track-1")
            .withHeatTimesThrough(2)
            .withReverseHeats(true)
            .withEntityId(raceId)
            .build();

    // Mock uniqueness check
    FindIterable<Race> findIterable = mock(FindIterable.class);
    when(raceCollection.find(any(Bson.class))).thenReturn(findIterable);
    when(findIterable.first()).thenReturn(null);

    UpdateResult updateResult = mock(UpdateResult.class);
    when(updateResult.getMatchedCount()).thenReturn(1L);
    when(raceCollection.replaceOne(any(Bson.class), any(Race.class))).thenReturn(updateResult);

    Race updated = handler.updateRace(raceId, raceUpdate);

    assertNotNull(updated);
    assertEquals(2, updated.getHeatTimesThrough());
    assertTrue(updated.isReverseHeats());
    verify(raceCollection).replaceOne(any(Bson.class), any(Race.class));
  }

  @Test
  @SuppressWarnings("unchecked")
  public void testUpdateRace_NotFound() {
    String raceId = "non-existent-id";
    Race raceUpdate =
        new Race.Builder()
            .withName("Name")
            .withTrackEntityId("track-1")
            .withEntityId(raceId)
            .build();

    // Mock uniqueness check - no other race with same name
    FindIterable<Race> findIterable = mock(FindIterable.class);
    when(raceCollection.find(any(Bson.class))).thenReturn(findIterable);
    when(findIterable.first()).thenReturn(null);

    UpdateResult updateResult = mock(UpdateResult.class);
    when(updateResult.getMatchedCount()).thenReturn(0L);
    when(raceCollection.replaceOne(any(Bson.class), any(Race.class))).thenReturn(updateResult);

    assertThrows(
        IllegalArgumentException.class,
        () -> {
          handler.updateRace(raceId, raceUpdate);
        });
  }

  @Test
  public void testDeleteRace_Success() {
    String raceId = "race-to-delete";

    // Mock other collections for cascading delete
    MongoCollection historyCollection = mock(MongoCollection.class);
    MongoCollection statsCollection = mock(MongoCollection.class);
    MongoCollection savedRacesCollection = mock(MongoCollection.class);
    MongoCollection driverStatsCollection = mock(MongoCollection.class);

    when(mongoDatabase.getCollection("race_history")).thenReturn(historyCollection);
    when(mongoDatabase.getCollection("demo_race_history")).thenReturn(historyCollection);
    when(mongoDatabase.getCollection("global_statistics")).thenReturn(statsCollection);
    when(mongoDatabase.getCollection("demo_global_statistics")).thenReturn(statsCollection);
    when(mongoDatabase.getCollection("saved_races")).thenReturn(savedRacesCollection);
    when(mongoDatabase.getCollection("demo_saved_races")).thenReturn(savedRacesCollection);
    when(mongoDatabase.getCollection("driver_statistics")).thenReturn(driverStatsCollection);
    when(mongoDatabase.getCollection("demo_driver_statistics")).thenReturn(driverStatsCollection);

    DeleteResult deleteResult = mock(DeleteResult.class);
    when(deleteResult.getDeletedCount()).thenReturn(1L);
    when(raceCollection.deleteOne(any(Bson.class))).thenReturn(deleteResult);

    handler.deleteRace(raceId);

    // Verify cascading deletions (both regular and demo collections)
    verify(historyCollection, times(2)).deleteMany(any(Bson.class));
    verify(statsCollection, times(2)).deleteMany(any(Bson.class));
    verify(savedRacesCollection, times(2)).deleteMany(any(Bson.class));
    verify(driverStatsCollection, times(2)).deleteMany(any(Bson.class));

    // Verify race itself was deleted
    verify(raceCollection).deleteOne(any(Bson.class));
  }

  @Test
  public void testDeleteRace_NotFound() {
    String raceId = "non-existent-id";

    DeleteResult deleteResult = mock(DeleteResult.class);
    when(deleteResult.getDeletedCount()).thenReturn(0L);
    when(raceCollection.deleteOne(any(Bson.class))).thenReturn(deleteResult);

    assertThrows(
        IllegalArgumentException.class,
        () -> {
          handler.deleteRace(raceId);
        });
  }

  @Test
  @SuppressWarnings("unchecked")
  public void testCreateTeam_Success() {
    Team teamRequest = new Team("New Team", "url", null, "new", null);

    // Mock uniqueness check - no existing team
    FindIterable<Team> findIterable = mock(FindIterable.class);
    when(teamCollection.find(any(Bson.class))).thenReturn(findIterable);
    when(findIterable.first()).thenReturn(null);

    // Mock sequence generation
    Document counterDoc = new Document("seq", 200);
    when(countersCollection.findOneAndUpdate(any(Bson.class), any(Bson.class), any()))
        .thenReturn(counterDoc);

    Team created = handler.createTeam(teamRequest);

    assertNotNull(created);
    assertEquals("200", created.getEntityId());
    verify(teamCollection).insertOne(any(Team.class));
  }

  @Test
  @SuppressWarnings("unchecked")
  public void testCreateTeam_Duplicate() {
    Team teamRequest = new Team("Duplicate Team", "url", null, "new", null);

    // Mock uniqueness check - team exists
    FindIterable<Team> findIterable = mock(FindIterable.class);
    when(teamCollection.find(any(Bson.class))).thenReturn(findIterable);
    when(findIterable.first())
        .thenReturn(new Team("Duplicate Team", "url", null, "existing-1", null));

    assertThrows(
        IllegalArgumentException.class,
        () -> {
          handler.createTeam(teamRequest);
        });

    verify(teamCollection, never()).insertOne(any(Team.class));
  }

  @Test
  @SuppressWarnings("unchecked")
  public void testUpdateTeam_Success() {
    String teamId = "team-123";
    Team teamUpdate = new Team("Updated Team", "url", null, teamId, null);

    // Mock uniqueness check - no OTHER team with same name/nick
    FindIterable<Team> findIterable = mock(FindIterable.class);
    when(teamCollection.find(any(Bson.class))).thenReturn(findIterable);
    when(findIterable.first()).thenReturn(null);

    UpdateResult updateResult = mock(UpdateResult.class);
    when(updateResult.getMatchedCount()).thenReturn(1L);
    when(teamCollection.replaceOne(any(Bson.class), any(Team.class))).thenReturn(updateResult);

    Team updated = handler.updateTeam(teamId, teamUpdate);

    assertNotNull(updated);
    assertEquals("Updated Team", updated.getName());
    verify(teamCollection).replaceOne(any(Bson.class), any(Team.class));
  }

  @Test
  public void testDeleteTeam_Success() {
    String teamId = "team-to-delete";

    DeleteResult deleteResult = mock(DeleteResult.class);
    when(deleteResult.getDeletedCount()).thenReturn(1L);
    when(teamCollection.deleteOne(any(Bson.class))).thenReturn(deleteResult);

    handler.deleteTeam(teamId);

    verify(teamCollection).deleteOne(any(Bson.class));
  }

  @Test
  @SuppressWarnings("unchecked")
  public void testGetDriverStatistics_AutoDetectDemoMode() throws Exception {
    HttpServletRequest req = mock(HttpServletRequest.class);
    HttpServletResponse res = mock(HttpServletResponse.class);
    when(req.getParameter("raceId")).thenReturn("race-123");
    when(req.getParameter("demo")).thenReturn(null);
    when(req.getQueryString()).thenReturn("raceId=race-123");
    java.util.Map<String, String[]> parameterMap = new java.util.HashMap<>();
    parameterMap.put("raceId", new String[] {"race-123"});
    when(req.getParameterMap()).thenReturn(parameterMap);

    java.util.Map<String, Object> appAttrs = new java.util.HashMap<>();
    appAttrs.put(
        io.javalin.plugin.json.JsonMapperKt.JSON_MAPPER_KEY,
        new io.javalin.plugin.json.JavalinJackson());
    Context ctx = new Context(req, res, appAttrs);

    java.util.Map<String, String> pathParams = new java.util.HashMap<>();
    pathParams.put("driverId", "d1");
    java.lang.reflect.Method setParams =
        ctx.getClass().getMethod("setPathParamMap$javalin", java.util.Map.class);
    setParams.invoke(ctx, pathParams);

    // Mock active demo race
    com.antigravity.race.Race activeRace = mock(com.antigravity.race.Race.class); // fqn-collision
    Race raceModel = new Race.Builder().withEntityId("race-123").build();
    when(activeRace.getRaceModel()).thenReturn(raceModel);
    when(activeRace.isDemoMode()).thenReturn(true);
    when(mockManager.getRace()).thenReturn(activeRace);

    // Mock db collection and result
    MongoCollection<DriverStatistics> statsCollection = mock(MongoCollection.class);
    when(mongoDatabase.getCollection(eq("demo_driver_statistics"), eq(DriverStatistics.class)))
        .thenReturn(statsCollection);
    FindIterable<DriverStatistics> findIterable = mock(FindIterable.class);
    when(statsCollection.find(any(Bson.class))).thenReturn(findIterable);

    DriverStatistics stats =
        new DriverStatistics(
            null,
            "d:d1",
            "race-123",
            5.2,
            2.0,
            java.util.Arrays.asList(5.5, 5.2),
            java.util.Arrays.asList(1.0, 2.0),
            null,
            null,
            null,
            null);
    when(findIterable.first()).thenReturn(stats);

    java.lang.reflect.Method method =
        DatabaseTaskHandler.class.getDeclaredMethod("getDriverStatistics", Context.class);
    method.setAccessible(true);
    method.invoke(handler, ctx);

    // Verify that it auto-detected demo and requested demo collection
    verify(mongoDatabase).getCollection(eq("demo_driver_statistics"), eq(DriverStatistics.class));
    verify(mongoDatabase, never())
        .getCollection(eq("driver_statistics"), eq(DriverStatistics.class));
    verify(res).setContentType("application/json");
  }

  @Test
  @SuppressWarnings("unchecked")
  public void testGetDriverStatistics_RegularMode() throws Exception {
    HttpServletRequest req = mock(HttpServletRequest.class);
    HttpServletResponse res = mock(HttpServletResponse.class);
    when(req.getParameter("raceId")).thenReturn("race-123");
    when(req.getParameter("demo")).thenReturn("false");
    when(req.getQueryString()).thenReturn("raceId=race-123&demo=false");
    java.util.Map<String, String[]> parameterMap = new java.util.HashMap<>();
    parameterMap.put("raceId", new String[] {"race-123"});
    parameterMap.put("demo", new String[] {"false"});
    when(req.getParameterMap()).thenReturn(parameterMap);

    java.util.Map<String, Object> appAttrs = new java.util.HashMap<>();
    appAttrs.put(
        io.javalin.plugin.json.JsonMapperKt.JSON_MAPPER_KEY,
        new io.javalin.plugin.json.JavalinJackson());
    Context ctx = new Context(req, res, appAttrs);

    java.util.Map<String, String> pathParams = new java.util.HashMap<>();
    pathParams.put("driverId", "d1");
    java.lang.reflect.Method setParams =
        ctx.getClass().getMethod("setPathParamMap$javalin", java.util.Map.class);
    setParams.invoke(ctx, pathParams);

    // Mock active race is null
    when(mockManager.getRace()).thenReturn(null);

    // Mock db collection and result
    MongoCollection<DriverStatistics> statsCollection = mock(MongoCollection.class);
    when(mongoDatabase.getCollection(eq("driver_statistics"), eq(DriverStatistics.class)))
        .thenReturn(statsCollection);
    FindIterable<DriverStatistics> findIterable = mock(FindIterable.class);
    when(statsCollection.find(any(Bson.class))).thenReturn(findIterable);

    DriverStatistics stats =
        new DriverStatistics(
            null,
            "d:d1",
            "race-123",
            5.2,
            2.0,
            java.util.Arrays.asList(5.5, 5.2),
            java.util.Arrays.asList(1.0, 2.0),
            null,
            null,
            null,
            null);
    when(findIterable.first()).thenReturn(stats);

    java.lang.reflect.Method method =
        DatabaseTaskHandler.class.getDeclaredMethod("getDriverStatistics", Context.class);
    method.setAccessible(true);
    method.invoke(handler, ctx);

    // Verify that it requested regular collection
    verify(mongoDatabase).getCollection(eq("driver_statistics"), eq(DriverStatistics.class));
    verify(mongoDatabase, never())
        .getCollection(eq("demo_driver_statistics"), eq(DriverStatistics.class));
    verify(res).setContentType("application/json");
  }

  @Test
  public void testDeleteDriver_CascadingDelete_TeamUpdated() {
    String driverId = "driver-123";

    DeleteResult deleteResult = mock(DeleteResult.class);
    when(deleteResult.getDeletedCount()).thenReturn(1L);
    when(driverCollection.deleteOne(any(Bson.class))).thenReturn(deleteResult);

    Team team =
        new Team(
            "Team 1", "url", java.util.Arrays.asList(driverId, "other-driver"), "team-1", null);
    FindIterable<Team> findIterable = mock(FindIterable.class);
    when(teamCollection.find(any(Bson.class))).thenReturn(findIterable);

    // Create an iterable that yields our mock team
    java.util.List<Team> teams = java.util.Arrays.asList(team);
    java.util.Iterator<Team> iterator = teams.iterator();

    // Manually handle the forEach call
    io.javalin.http.Context dummyCtx = mock(io.javalin.http.Context.class);
    doAnswer(
            invocation -> {
              java.util.function.Consumer<Team> consumer = invocation.getArgument(0);
              while (iterator.hasNext()) {
                consumer.accept(iterator.next());
              }
              return null;
            })
        .when(findIterable)
        .forEach(any());

    UpdateResult updateResult = mock(UpdateResult.class);
    when(teamCollection.replaceOne(any(Bson.class), any(Team.class))).thenReturn(updateResult);

    handler.deleteDriver(driverId);

    verify(driverCollection).deleteOne(any(Bson.class));
    verify(teamCollection).replaceOne(any(Bson.class), any(Team.class));
    verify(teamCollection, never()).deleteOne(any(Bson.class));
  }

  @Test
  public void testDeleteDriver_CascadingDelete_TeamDeleted() {
    String driverId = "driver-456";

    DeleteResult deleteResult = mock(DeleteResult.class);
    when(deleteResult.getDeletedCount()).thenReturn(1L);
    when(driverCollection.deleteOne(any(Bson.class))).thenReturn(deleteResult);

    Team team = new Team("Team 2", "url", java.util.Arrays.asList(driverId), "team-2", null);
    FindIterable<Team> findIterable = mock(FindIterable.class);
    when(teamCollection.find(any(Bson.class))).thenReturn(findIterable);

    java.util.List<Team> teams = java.util.Arrays.asList(team);
    java.util.Iterator<Team> iterator = teams.iterator();
    doAnswer(
            invocation -> {
              java.util.function.Consumer<Team> consumer = invocation.getArgument(0);
              while (iterator.hasNext()) {
                consumer.accept(iterator.next());
              }
              return null;
            })
        .when(findIterable)
        .forEach(any());

    when(teamCollection.deleteOne(any(Bson.class))).thenReturn(deleteResult);

    handler.deleteDriver(driverId);

    verify(driverCollection).deleteOne(any(Bson.class));
    verify(teamCollection).deleteOne(any(Bson.class)); // Delete team called
    verify(teamCollection, never()).replaceOne(any(Bson.class), any(Team.class));
  }
}
