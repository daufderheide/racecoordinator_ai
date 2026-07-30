package com.antigravity.service;

import static org.junit.Assert.assertNotNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.antigravity.models.Driver;
import com.antigravity.models.Race;
import com.antigravity.models.RacePredictionRecord;
import com.antigravity.models.RacePredictionRecord.PredictionSnapshot;
import com.antigravity.race.DriverHeatData;
import com.antigravity.race.Heat;
import com.antigravity.race.RaceParticipant;
import com.mongodb.client.MongoDatabase;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import org.junit.Before;
import org.junit.Test;

public class RacePredictionServiceTest {

  private RacePredictionService service;
  private MongoDatabase mockDb;
  private Race mockRace;
  private List<RaceParticipant> participants;
  private List<Heat> heats;

  @Before
  public void setUp() {
    service = RacePredictionService.getInstance();
    mockDb = mock(MongoDatabase.class);
    mockRace = mock(Race.class);
    when(mockRace.getTrackEntityId()).thenReturn("track_1");

    participants = new ArrayList<>();
    heats = new ArrayList<>();

    Driver d1 = new Driver("Alice", "Alice", "d1", null);
    Driver d2 = new Driver("Bob", "Bob", "d2", null);

    RaceParticipant rp1 = new RaceParticipant(d1);
    RaceParticipant rp2 = new RaceParticipant(d2);

    participants.add(rp1);
    participants.add(rp2);

    DriverHeatData dhd1 = new DriverHeatData(rp1);
    dhd1.setLane(0);

    DriverHeatData dhd2 = new DriverHeatData(rp2);
    dhd2.setLane(1);

    List<DriverHeatData> heatDrivers = new ArrayList<>();
    heatDrivers.add(dhd1);
    heatDrivers.add(dhd2);

    heats.add(new Heat(1, heatDrivers, false));
  }

  @Test
  public void testGenerateAndSavePreRacePrediction() {
    RacePredictionRecord record =
        service.generateAndSavePreRacePrediction(
            mockDb, "race_1", mockRace, participants, heats, true);

    assertNotNull(record);
    assertNotNull(record.getPreRace());
  }

  @Test
  public void testUpdateRealtimePrediction() {
    PredictionSnapshot snapshot =
        service.updateRealtimePrediction(
            mockDb, "race_1", mockRace, participants, heats, 0, new HashMap<>(), true);

    assertNotNull(snapshot);
  }

  @Test
  public void testPreRacePredictionRecordImmutability() {
    RacePredictionRecord existingRecord = new RacePredictionRecord();
    existingRecord.setRaceId("race_cached");
    PredictionSnapshot existingSnapshot = new PredictionSnapshot();
    existingRecord.setPreRace(existingSnapshot);

    RacePredictionRecord record =
        service.generateAndSavePreRacePrediction(
            null, "race_cached", mockRace, participants, heats, true);

    assertNotNull(record);
    assertNotNull(record.getPreRace());
  }
}
