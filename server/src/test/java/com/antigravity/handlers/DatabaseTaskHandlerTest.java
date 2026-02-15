package com.antigravity.handlers;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.Race;
import com.antigravity.models.Team;
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
    when(mongoDatabase.getCollection(eq("counters"))).thenReturn(countersCollection);

    handler = new DatabaseTaskHandler(databaseContext, app);
  }

  @Test
  public void testCreateRace_Success() {
    Race raceRequest = new Race("New Race", "track-1", null, null, null, "new", null);

    // Mock uniqueness check - no existing race
    FindIterable<Race> findIterable = mock(FindIterable.class);
    when(raceCollection.find(any(Bson.class))).thenReturn(findIterable);
    when(findIterable.first()).thenReturn(null);

    // Mock sequence generation
    Document counterDoc = new Document("seq", 100);
    when(countersCollection.findOneAndUpdate(any(Bson.class), any(Bson.class), any())).thenReturn(counterDoc);

    Race created = handler.createRace(raceRequest);

    assertNotNull(created);
    assertEquals("100", created.getEntityId());
    verify(raceCollection).insertOne(any(Race.class));
  }

  @Test
  public void testCreateRace_DuplicateName() {
    Race raceRequest = new Race("Duplicate Race", "track-1", null, null, null, "new", null);

    // Mock uniqueness check - race exists
    FindIterable<Race> findIterable = mock(FindIterable.class);
    when(raceCollection.find(any(Bson.class))).thenReturn(findIterable);
    when(findIterable.first()).thenReturn(new Race("Duplicate Race", "track-1", null, null, null, "existing-1", null));

    assertThrows(IllegalArgumentException.class, () -> {
      handler.createRace(raceRequest);
    });

    verify(raceCollection, never()).insertOne(any(Race.class));
  }

  @Test
  public void testUpdateRace_Success() {
    String raceId = "race-123";
    Race raceUpdate = new Race("Updated Name", "track-1", null, null, null, raceId, null);

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
    verify(raceCollection).replaceOne(any(Bson.class), any(Race.class));
  }

  @Test
  public void testUpdateRace_NotFound() {
    String raceId = "non-existent-id";
    Race raceUpdate = new Race("Name", "track-1", null, null, null, raceId, null);

    // Mock uniqueness check - no other race with same name
    FindIterable<Race> findIterable = mock(FindIterable.class);
    when(raceCollection.find(any(Bson.class))).thenReturn(findIterable);
    when(findIterable.first()).thenReturn(null);

    UpdateResult updateResult = mock(UpdateResult.class);
    when(updateResult.getMatchedCount()).thenReturn(0L);
    when(raceCollection.replaceOne(any(Bson.class), any(Race.class))).thenReturn(updateResult);

    assertThrows(IllegalArgumentException.class, () -> {
      handler.updateRace(raceId, raceUpdate);
    });
  }

  @Test
  public void testDeleteRace_Success() {
    String raceId = "race-to-delete";

    DeleteResult deleteResult = mock(DeleteResult.class);
    when(deleteResult.getDeletedCount()).thenReturn(1L);
    when(raceCollection.deleteOne(any(Bson.class))).thenReturn(deleteResult);

    handler.deleteRace(raceId);

    verify(raceCollection).deleteOne(any(Bson.class));
  }

  @Test
  public void testDeleteRace_NotFound() {
    String raceId = "non-existent-id";

    DeleteResult deleteResult = mock(DeleteResult.class);
    when(deleteResult.getDeletedCount()).thenReturn(0L);
    when(raceCollection.deleteOne(any(Bson.class))).thenReturn(deleteResult);

    assertThrows(IllegalArgumentException.class, () -> {
      handler.deleteRace(raceId);
    });
  }

  @Test
  public void testCreateTeam_Success() {
    Team teamRequest = new Team("New Team", "url", null, "new", null);

    // Mock uniqueness check - no existing team
    FindIterable<Team> findIterable = mock(FindIterable.class);
    when(teamCollection.find(any(Bson.class))).thenReturn(findIterable);
    when(findIterable.first()).thenReturn(null);

    // Mock sequence generation
    Document counterDoc = new Document("seq", 200);
    when(countersCollection.findOneAndUpdate(any(Bson.class), any(Bson.class), any())).thenReturn(counterDoc);

    Team created = handler.createTeam(teamRequest);

    assertNotNull(created);
    assertEquals("200", created.getEntityId());
    verify(teamCollection).insertOne(any(Team.class));
  }

  @Test
  public void testCreateTeam_Duplicate() {
    Team teamRequest = new Team("Duplicate Team", "url", null, "new", null);

    // Mock uniqueness check - team exists
    FindIterable<Team> findIterable = mock(FindIterable.class);
    when(teamCollection.find(any(Bson.class))).thenReturn(findIterable);
    when(findIterable.first()).thenReturn(new Team("Duplicate Team", "url", null, "existing-1", null));

    assertThrows(IllegalArgumentException.class, () -> {
      handler.createTeam(teamRequest);
    });

    verify(teamCollection, never()).insertOne(any(Team.class));
  }

  @Test
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
