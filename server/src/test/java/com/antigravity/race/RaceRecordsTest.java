package com.antigravity.race;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.Track;
import com.antigravity.proto.CurrentRecords;
import com.antigravity.proto.RecordData;
import com.antigravity.service.DatabaseService;
import com.mongodb.client.MongoDatabase;
import java.util.ArrayList;
import java.util.Arrays;
import org.junit.Before;
import org.junit.Test;

public class RaceRecordsTest {

  private DatabaseService dbService;
  private DatabaseContext dbContext;
  private MongoDatabase mongoDatabase;

  @Before
  public void setUp() {
    dbService = mock(DatabaseService.class);
    DatabaseService.setInstance(dbService);

    dbContext = mock(DatabaseContext.class);
    mongoDatabase = mock(MongoDatabase.class);
    when(dbContext.getDatabase()).thenReturn(mongoDatabase);
  }

  @org.junit.After
  public void tearDown() {
    DatabaseService.setInstance(new DatabaseService());
  }

  @Test
  public void testRaceRecordsHydration() {
    // 1. Create fake existing records
    com.antigravity.proto.CurrentRecords currentRecords =
        com.antigravity.proto.CurrentRecords.newBuilder()
            .setFastestLap(
                com.antigravity.proto.RecordEntry.newBuilder()
                    .setValue(4.567)
                    .setHolderName("Flash")
                    .setHolderNickname("Speedy")
                    .setHolderTeamName("Red")
                    .build())
            .build();

    com.antigravity.proto.OverallRecords overallRecords =
        com.antigravity.proto.OverallRecords.newBuilder()
            .setFastestLap(
                com.antigravity.proto.RecordEntry.newBuilder()
                    .setValue(4.123)
                    .setHolderName("Sonic")
                    .setHolderNickname("BlueBlur")
                    .setHolderTeamName("Sega")
                    .setDate(123456789L)
                    .build())
            .build();

    com.antigravity.proto.RecordData mockedRecords =
        com.antigravity.proto.RecordData.newBuilder()
            .setCurrent(currentRecords)
            .setOverall(overallRecords)
            .build();

    when(dbService.getRaceRecords(any(MongoDatabase.class), anyString(), anyBoolean()))
        .thenReturn(mockedRecords);

    // 2. Build the race
    com.antigravity.models.Race model =
        new com.antigravity.models.Race.Builder()
            .withName("Hydration Race")
            .withEntityId("HYD_RACE_123")
            .build();

    Track track =
        new Track.Builder()
            .name("Track")
            .lanes(
                Arrays.asList(
                    new com.antigravity.models.Lane("#ff0000", "#ffffff", 100),
                    new com.antigravity.models.Lane("#00ff00", "#000000", 100)))
            .build();

    Race runtimeRace =
        new Race.Builder()
            .model(model)
            .databaseContext(dbContext)
            .track(track)
            .drivers(new ArrayList<>())
            .isDemoMode(true)
            .build();

    // 3. Verify that RaceRecords was properly hydrated
    RaceRecords records = runtimeRace.getRecordsManager();
    assertNotNull("RaceRecords should be initialized", records);

    RecordData exported = records.getRecordData();
    assertNotNull(exported);

    // Check Current Records (these will be 0/empty because recalculateScoreRecords clears them
    // before start!)
    CurrentRecords current = exported.getCurrent();
    assertEquals(0.0, current.getFastestLap().getValue(), 0.001);

    // Check Overall Records (these should persist)
    com.antigravity.proto.OverallRecords overall = exported.getOverall();
    assertEquals(4.123, overall.getFastestLap().getValue(), 0.001);
    assertEquals("Sonic", overall.getFastestLap().getHolderName());
    assertEquals("BlueBlur", overall.getFastestLap().getHolderNickname());
    assertEquals("Sega", overall.getFastestLap().getHolderTeamName());
    assertEquals(123456789L, overall.getFastestLap().getDate());
  }
}
