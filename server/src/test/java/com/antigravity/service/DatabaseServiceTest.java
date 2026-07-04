package com.antigravity.service;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.antigravity.models.Driver;
import com.antigravity.models.GlobalStatistics;
import com.antigravity.models.RaceHistoryRecord;
import com.antigravity.race.Race;
import com.antigravity.race.RaceParticipant;
import com.mongodb.client.FindIterable;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoCursor;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.ReplaceOptions;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.bson.Document;
import org.bson.conversions.Bson;
import org.junit.Before;
import org.junit.Test;
import org.mockito.ArgumentCaptor;

public class DatabaseServiceTest {

  private MongoDatabase mongoDatabase;
  private MongoCollection<RaceHistoryRecord> historyCollection;
  private MongoCollection<GlobalStatistics> statsCollection;
  private DatabaseService dbService;

  @Before
  @SuppressWarnings("unchecked")
  public void setUp() {
    mongoDatabase = mock(MongoDatabase.class);
    historyCollection = mock(MongoCollection.class);
    statsCollection = mock(MongoCollection.class);

    when(mongoDatabase.getCollection(eq("race_history"), eq(RaceHistoryRecord.class)))
        .thenReturn(historyCollection);
    when(mongoDatabase.getCollection(eq("global_statistics"), eq(GlobalStatistics.class)))
        .thenReturn(statsCollection);

    dbService = DatabaseService.getInstance();
  }

  @Test
  public void testSaveAndGetRaceHistory() {
    com.antigravity.models.Race model =
        new com.antigravity.models.Race.Builder().withName("Test Race").withEntityId("ID1").build();
    List<RaceParticipant> drivers = new ArrayList<>();
    drivers.add(new RaceParticipant(new Driver("Dave", "DB")));

    Race runtimeRace =
        new Race.Builder()
            .model(model)
            .drivers(drivers)
            .track(dbService.getFactoryTrack())
            .accumulatedRaceTime(12.5f)
            .build();

    runtimeRace.getStatistics().setDurationMillis(5000);

    dbService.saveRaceHistory(mongoDatabase, runtimeRace);

    ArgumentCaptor<RaceHistoryRecord> captor = ArgumentCaptor.forClass(RaceHistoryRecord.class);
    verify(historyCollection).insertOne(captor.capture());

    RaceHistoryRecord record = captor.getValue();
    assertEquals("ID1", record.getOriginalEntityId());
    assertEquals("Test Race", record.getModel().getName());
    assertEquals(12.5f, record.getAccumulatedRaceTime(), 0.001f);
    assertEquals(4, record.getDrivers().size());
  }

  @Test
  @SuppressWarnings("unchecked")
  public void testUpdateGlobalStatistics() {
    com.antigravity.models.Race model =
        new com.antigravity.models.Race.Builder().withName("Test Race").withEntityId("ID2").build();
    List<RaceParticipant> drivers = new ArrayList<>();

    RaceParticipant p1 = new RaceParticipant(new Driver("Dave", "DB"));
    drivers.add(p1);

    Race runtimeRace =
        new Race.Builder().model(model).drivers(drivers).track(dbService.getFactoryTrack()).build();

    // Set laps AFTER construction, as constructor calls recalculate() which would overwrite them
    p1.setTotalLaps(2);
    p1.setBestLapTime(2.1);

    runtimeRace.getStatistics().setDurationMillis(10000);

    FindIterable<GlobalStatistics> findIterable = mock(FindIterable.class);
    when(statsCollection.find(any(Bson.class))).thenReturn(findIterable);
    when(findIterable.first()).thenReturn(null); // First time it's null

    dbService.updateGlobalStatistics(mongoDatabase, runtimeRace);

    ArgumentCaptor<Bson> captor = ArgumentCaptor.forClass(Bson.class);
    verify(statsCollection)
        .replaceOne(captor.capture(), any(GlobalStatistics.class), any(ReplaceOptions.class));

    Bson filter = captor.getValue();
    assertTrue(
        "Filter should contain race_entity_id",
        filter.toString().contains("race_entity_id") && filter.toString().contains("ID2"));

    ArgumentCaptor<com.antigravity.models.GlobalStatistics> recordCaptor =
        ArgumentCaptor.forClass(com.antigravity.models.GlobalStatistics.class);
    verify(statsCollection)
        .replaceOne(any(Bson.class), recordCaptor.capture(), any(ReplaceOptions.class));
    com.antigravity.models.GlobalStatistics updatedStats = recordCaptor.getValue();
    assertEquals("ID2", updatedStats.getRaceEntityId());
    assertEquals(1, updatedStats.getTotalRaces());
    assertEquals(
        10550L, updatedStats.getTotalRaceTimeMs(), 1000L); // Allow some drift for processing time
    assertEquals(2.0, updatedStats.getTotalLaps(), 0.001); // Participant p1 had 2 laps
  }

  @Test
  @SuppressWarnings("unchecked")
  public void testUpdateGlobalStatisticsMerging() {
    com.antigravity.models.Race model =
        new com.antigravity.models.Race.Builder()
            .withName("Test Race")
            .withEntityId("ID_MERGE")
            .build();

    Race runtimeRace = mock(Race.class);
    when(runtimeRace.getRaceModel()).thenReturn(model);
    when(runtimeRace.getDrivers()).thenReturn(new ArrayList<>());
    when(runtimeRace.getTrack()).thenReturn(dbService.getFactoryTrack());
    when(runtimeRace.getStatistics()).thenReturn(new com.antigravity.race.RaceStatistics());

    // Set some new records in the runtime race that are a mix of better/worse than existing
    com.antigravity.proto.RecordData recordData =
        com.antigravity.proto.RecordData.newBuilder()
            .setOverall(
                com.antigravity.proto.OverallRecords.newBuilder()
                    .setFastestLap(
                        com.antigravity.proto.RecordEntry.newBuilder()
                            .setValue(4.5)
                            .setHolderName("NewFast"))
                    .setHighestScore(
                        com.antigravity.proto.RecordEntry.newBuilder()
                            .setValue(150.0)
                            .setHolderName("NewHigh"))
                    // Lane 0: New time is worse (5.0 vs 4.0), New score is better (20 vs 10)
                    .addLaneFastestLap(
                        com.antigravity.proto.RecordEntry.newBuilder()
                            .setValue(5.0)
                            .setHolderName("NewLane0Time"))
                    .addLaneHighestScore(
                        com.antigravity.proto.RecordEntry.newBuilder()
                            .setValue(20.0)
                            .setHolderName("NewLane0Score"))
                    // Lane 1: New time is better (3.0 vs 4.0), New score is worse (5 vs 10)
                    .addLaneFastestLap(
                        com.antigravity.proto.RecordEntry.newBuilder()
                            .setValue(3.0)
                            .setHolderName("NewLane1Time"))
                    .addLaneHighestScore(
                        com.antigravity.proto.RecordEntry.newBuilder()
                            .setValue(5.0)
                            .setHolderName("NewLane1Score"))
                    .build())
            .build();
    when(runtimeRace.getRecordData()).thenReturn(recordData);

    FindIterable<GlobalStatistics> findIterable = mock(FindIterable.class);
    when(statsCollection.find(any(Bson.class))).thenReturn(findIterable);

    GlobalStatistics existingStats = new GlobalStatistics("ID_MERGE");
    existingStats.setFastestLapTime(4.0); // New (4.5) is worse
    existingStats.setHighestScore(100.0); // New (150.0) is better
    existingStats.setLaneFastestLapTimes(new ArrayList<>(Arrays.asList(4.0, 4.0)));
    existingStats.setLaneFastestLapDriverNames(
        new ArrayList<>(Arrays.asList("OldLane0Time", "OldLane1Time")));
    existingStats.setLaneFastestLapDriverNicknames(new ArrayList<>(Arrays.asList("", "")));
    existingStats.setLaneFastestLapTeamNames(new ArrayList<>(Arrays.asList("", "")));
    existingStats.setLaneFastestLapDates(new ArrayList<>(Arrays.asList(0L, 0L)));

    existingStats.setLaneHighestScores(new ArrayList<>(Arrays.asList(10.0, 10.0)));
    existingStats.setLaneHighestScoreHolderNames(
        new ArrayList<>(Arrays.asList("OldLane0Score", "OldLane1Score")));
    existingStats.setLaneHighestScoreHolderNicknames(new ArrayList<>(Arrays.asList("", "")));
    existingStats.setLaneHighestScoreTeamNames(new ArrayList<>(Arrays.asList("", "")));
    existingStats.setLaneHighestScoreDates(new ArrayList<>(Arrays.asList(0L, 0L)));

    when(findIterable.first()).thenReturn(existingStats);

    dbService.updateGlobalStatistics(mongoDatabase, runtimeRace);

    ArgumentCaptor<com.antigravity.models.GlobalStatistics> recordCaptor =
        ArgumentCaptor.forClass(com.antigravity.models.GlobalStatistics.class);
    verify(statsCollection)
        .replaceOne(any(Bson.class), recordCaptor.capture(), any(ReplaceOptions.class));

    com.antigravity.models.GlobalStatistics updatedStats = recordCaptor.getValue();

    // Check Overall
    assertEquals(4.0, updatedStats.getFastestLapTime(), 0.001); // Keeps old
    assertEquals(150.0, updatedStats.getHighestScore(), 0.001); // Updates to new

    // Check Lane 0
    assertEquals(4.0, updatedStats.getLaneFastestLapTimes().get(0), 0.001); // Keeps old time
    assertEquals("OldLane0Time", updatedStats.getLaneFastestLapDriverNames().get(0));
    assertEquals(20.0, updatedStats.getLaneHighestScores().get(0), 0.001); // Updates to new score
    assertEquals("NewLane0Score", updatedStats.getLaneHighestScoreHolderNames().get(0));

    // Check Lane 1
    assertEquals(3.0, updatedStats.getLaneFastestLapTimes().get(1), 0.001); // Updates to new time
    assertEquals("NewLane1Time", updatedStats.getLaneFastestLapDriverNames().get(1));
    assertEquals(10.0, updatedStats.getLaneHighestScores().get(1), 0.001); // Keeps old score
    assertEquals("OldLane1Score", updatedStats.getLaneHighestScoreHolderNames().get(1));
  }

  @Test
  @SuppressWarnings("unchecked")
  public void testGetGlobalStatistics() {
    String raceId = "RACE_ABC";
    FindIterable<GlobalStatistics> findIterable = mock(FindIterable.class);
    when(statsCollection.find(any(Bson.class))).thenReturn(findIterable);

    GlobalStatistics existing = new GlobalStatistics(raceId);
    existing.setFastestLapTime(3.5);
    when(findIterable.first()).thenReturn(existing);

    GlobalStatistics result = dbService.getGlobalStatistics(mongoDatabase, raceId, false);

    ArgumentCaptor<Bson> captor = ArgumentCaptor.forClass(Bson.class);
    verify(statsCollection).find(captor.capture());

    Bson filter = captor.getValue();
    assertTrue(
        "Filter should match race_entity_id",
        filter.toString().contains("race_entity_id") && filter.toString().contains(raceId));
    assertEquals(3.5, result.getFastestLapTime(), 0.001);
  }

  @Test
  @SuppressWarnings("unchecked")
  public void testGetDriversPreservesOrder() {
    MongoCollection<Driver> driverCollection = mock(MongoCollection.class);
    when(mongoDatabase.getCollection("drivers", Driver.class)).thenReturn(driverCollection);

    FindIterable<Driver> findIterable = mock(FindIterable.class);
    when(driverCollection.find(any(Bson.class))).thenReturn(findIterable);

    Driver d1 = new Driver("Abby", "Nickname1", "D1", null);
    Driver d2 = new Driver("Andrea", "Nickname2", "D2", null);
    Driver d3 = new Driver("Austin", "Nickname3", "D3", null);

    // MongoDB returns them in a different order (e.g. d1, d2, d3)
    List<Driver> dbDrivers = Arrays.asList(d1, d2, d3);
    org.mockito.stubbing.Answer<Object> answer =
        invocation -> {
          List<Driver> target = invocation.getArgument(0);
          target.addAll(dbDrivers);
          return target;
        };
    when(findIterable.into(any(List.class))).thenAnswer(answer);

    // We request order: D2, D3, D1
    List<String> requestedIds = Arrays.asList("D2", "D3", "D1");
    List<Driver> result = dbService.getDrivers(mongoDatabase, requestedIds);

    assertEquals(3, result.size());
    assertEquals("Andrea", result.get(0).getName());
    assertEquals("Austin", result.get(1).getName());
    assertEquals("Abby", result.get(2).getName());
  }

  @Test
  @SuppressWarnings("unchecked")
  public void testGetTeamsPreservesOrder() {
    MongoCollection<com.antigravity.models.Team> teamCollection = mock(MongoCollection.class);
    when(mongoDatabase.getCollection("teams", com.antigravity.models.Team.class))
        .thenReturn(teamCollection);

    FindIterable<com.antigravity.models.Team> findIterable = mock(FindIterable.class);
    when(teamCollection.find(any(Bson.class))).thenReturn(findIterable);

    com.antigravity.models.Team t1 =
        new com.antigravity.models.Team("Team1", "", new ArrayList<>(), "T1", null);
    com.antigravity.models.Team t2 =
        new com.antigravity.models.Team("Team2", "", new ArrayList<>(), "T2", null);

    List<com.antigravity.models.Team> dbTeams = Arrays.asList(t1, t2);
    org.mockito.stubbing.Answer<Object> answer =
        invocation -> {
          List<com.antigravity.models.Team> target = invocation.getArgument(0);
          target.addAll(dbTeams);
          return target;
        };
    when(findIterable.into(any(List.class))).thenAnswer(answer);

    List<String> requestedIds = Arrays.asList("T2", "T1");
    List<com.antigravity.models.Team> result = dbService.getTeams(mongoDatabase, requestedIds);

    assertEquals(2, result.size());
    assertEquals("Team2", result.get(0).getName());
    assertEquals("Team1", result.get(1).getName());
  }

  @Test
  @SuppressWarnings("unchecked")
  public void testBackfillRacesAddsPracticeRace() {
    MongoCollection<Document> raceDocs = mock(MongoCollection.class);
    when(mongoDatabase.getCollection("races")).thenReturn(raceDocs);

    MongoCollection<Document> counters = mock(MongoCollection.class);
    when(mongoDatabase.getCollection("counters")).thenReturn(counters);
    Document counterDoc = new Document("seq", 1);
    when(counters.findOneAndUpdate(
            any(Bson.class),
            any(Bson.class),
            any(com.mongodb.client.model.FindOneAndUpdateOptions.class)))
        .thenReturn(counterDoc);

    MongoCollection<com.antigravity.models.Track> trackCollection = mock(MongoCollection.class);
    when(mongoDatabase.getCollection("tracks", com.antigravity.models.Track.class))
        .thenReturn(trackCollection);

    MongoCollection<com.antigravity.models.Race> raceCollection = mock(MongoCollection.class);
    when(mongoDatabase.getCollection("races", com.antigravity.models.Race.class))
        .thenReturn(raceCollection);

    FindIterable<Document> emptyIterable = mock(FindIterable.class);
    MongoCursor<Document> emptyCursor = mock(MongoCursor.class);
    when(emptyCursor.hasNext()).thenReturn(false);
    when(emptyIterable.iterator()).thenReturn(emptyCursor);
    when(emptyIterable.first()).thenReturn(null);

    when(raceDocs.find()).thenReturn(emptyIterable);
    when(raceDocs.find(any(Bson.class))).thenReturn(emptyIterable);

    FindIterable<com.antigravity.models.Track> trackIterable = mock(FindIterable.class);
    com.antigravity.models.Track track =
        new com.antigravity.models.Track.Builder()
            .name("Track")
            .numTrackSections(100)
            .lanes(new ArrayList<>())
            .arduinoConfigs(new ArrayList<>())
            .entityId("T1")
            .id(null)
            .build();
    when(trackIterable.first()).thenReturn(track);
    when(trackCollection.find()).thenReturn(trackIterable);

    dbService.backfillRaces(mongoDatabase);

    ArgumentCaptor<com.antigravity.models.Race> raceCaptor =
        ArgumentCaptor.forClass(com.antigravity.models.Race.class);
    verify(raceCollection).insertOne(raceCaptor.capture());

    com.antigravity.models.Race practiceRace = raceCaptor.getValue();
    assertEquals("Practice", practiceRace.getName());
    assertEquals("T1", practiceRace.getTrackEntityId());
    assertEquals(
        com.antigravity.models.HeatRotationType.Custom, practiceRace.getHeatRotationType());
    assertTrue(practiceRace.isPractice());
    assertEquals(0, practiceRace.getHeatScoring().getFinishValue());
  }
}
