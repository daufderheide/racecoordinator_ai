package com.antigravity.service;

import static org.junit.Assert.assertEquals;
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
import com.mongodb.client.MongoDatabase;
import java.util.ArrayList;
import java.util.List;
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

    dbService = new DatabaseService();
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
    p1.setTotalLaps(2);
    p1.setBestLapTime(2.1);
    drivers.add(p1);

    Race runtimeRace =
        new Race.Builder().model(model).drivers(drivers).track(dbService.getFactoryTrack()).build();

    runtimeRace.getStatistics().setDurationMillis(10000);

    FindIterable<GlobalStatistics> findIterable = mock(FindIterable.class);
    when(statsCollection.find(any(Bson.class))).thenReturn(findIterable);
    when(findIterable.first()).thenReturn(null); // First time it's null

    dbService.updateGlobalStatistics(mongoDatabase, runtimeRace);

    ArgumentCaptor<GlobalStatistics> captor = ArgumentCaptor.forClass(GlobalStatistics.class);
    verify(statsCollection).replaceOne(any(Bson.class), captor.capture());

    GlobalStatistics updatedStats = captor.getValue();
    assertEquals(1, updatedStats.getTotalRaces());
    assertEquals(10000L, updatedStats.getTotalRaceTimeMs());
    assertEquals(2, updatedStats.getTotalLaps());
    assertEquals(2.1, updatedStats.getFastestLapTime(), 0.001);
    assertEquals("Dave", updatedStats.getFastestLapDriverName());
  }
}
