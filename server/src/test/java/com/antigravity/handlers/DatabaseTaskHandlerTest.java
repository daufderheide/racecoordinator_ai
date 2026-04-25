package com.antigravity.handlers;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.Race;
import com.antigravity.models.Team;
import com.antigravity.models.TeamOptions;
import com.antigravity.models.Track;
import com.mongodb.client.FindIterable;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.result.DeleteResult;
import com.mongodb.client.result.UpdateResult;
import io.javalin.Javalin;
import org.bson.Document;
import org.bson.conversions.Bson;
import org.junit.Before;
import org.junit.Test;

public class DatabaseTaskHandlerTest {

  private DatabaseContext databaseContext;
  private MongoDatabase mongoDatabase;
  private MongoCollection<Race> raceCollection;
  private MongoCollection<Team> teamCollection;
  private MongoCollection<Document> countersCollection;
  private Javalin app;
  private DatabaseTaskHandler handler;

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
    when(mongoDatabase.getCollection(eq("races"), eq(Race.class))).thenReturn(raceCollection);
    when(mongoDatabase.getCollection(eq("teams"), eq(Team.class))).thenReturn(teamCollection);
    when(mongoDatabase.getCollection(eq("tracks"), eq(Track.class)))
        .thenReturn(mock(MongoCollection.class));
    when(mongoDatabase.getCollection(eq("counters"))).thenReturn(countersCollection);

    handler = new DatabaseTaskHandler(databaseContext, app);
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

    when(mongoDatabase.getCollection("race_history")).thenReturn(historyCollection);
    when(mongoDatabase.getCollection("demo_race_history")).thenReturn(historyCollection);
    when(mongoDatabase.getCollection("global_statistics")).thenReturn(statsCollection);
    when(mongoDatabase.getCollection("demo_global_statistics")).thenReturn(statsCollection);
    when(mongoDatabase.getCollection("saved_races")).thenReturn(savedRacesCollection);
    when(mongoDatabase.getCollection("demo_saved_races")).thenReturn(savedRacesCollection);

    DeleteResult deleteResult = mock(DeleteResult.class);
    when(deleteResult.getDeletedCount()).thenReturn(1L);
    when(raceCollection.deleteOne(any(Bson.class))).thenReturn(deleteResult);

    handler.deleteRace(raceId);

    // Verify cascading deletions (both regular and demo collections)
    verify(historyCollection, times(2)).deleteMany(any(Bson.class));
    verify(statsCollection, times(2)).deleteMany(any(Bson.class));
    verify(savedRacesCollection, times(2)).deleteMany(any(Bson.class));

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
}
