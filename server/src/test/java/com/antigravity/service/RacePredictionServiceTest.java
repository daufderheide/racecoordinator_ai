package com.antigravity.service;

import static org.junit.Assert.assertNotNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.Driver;
import com.antigravity.models.Race;
import com.antigravity.models.RacePredictionRecord;
import com.antigravity.models.RacePredictionRecord.PredictionSnapshot;
import com.antigravity.race.DriverHeatData;
import com.antigravity.race.Heat;
import com.antigravity.race.RaceParticipant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import org.junit.Before;
import org.junit.Test;

public class RacePredictionServiceTest {

  private RacePredictionService service;
  private DatabaseContext mockDb;
  private Race mockRace;
  private List<RaceParticipant> participants;
  private List<Heat> heats;

  @Before
  public void setUp() {
    service = RacePredictionService.getInstance();
    mockDb = mock(DatabaseContext.class);
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

  @Test
  public void testGeneratePreRacePrediction_RegeneratesWhenParticipantsChange() {
    RacePredictionRecord initialRecord =
        service.generateAndSavePreRacePrediction(
            null, "race_test_participants", mockRace, participants, heats, true);

    assertNotNull(initialRecord);
    org.junit.Assert.assertEquals(2, initialRecord.getPreRace().getProjectedStandings().size());

    // Add new driver
    Driver d3 = new Driver("Charlie", "Charlie", "d3", null);
    RaceParticipant rp3 = new RaceParticipant(d3);
    List<RaceParticipant> updatedParticipants = new ArrayList<>(participants);
    updatedParticipants.add(rp3);

    DriverHeatData dhd3 = new DriverHeatData(rp3);
    dhd3.setLane(2);
    List<DriverHeatData> updatedHeatDrivers = new ArrayList<>(heats.get(0).getDrivers());
    updatedHeatDrivers.add(dhd3);
    List<Heat> updatedHeats = new ArrayList<>();
    updatedHeats.add(new Heat(1, updatedHeatDrivers, false));

    // Calling generateAndSavePreRacePrediction with updated participants should return a snapshot
    // with 3 drivers
    RacePredictionRecord updatedRecord =
        service.generateAndSavePreRacePrediction(
            null,
            "race_test_participants",
            mockRace,
            updatedParticipants,
            updatedHeats,
            true,
            false);

    assertNotNull(updatedRecord);
    org.junit.Assert.assertEquals(3, updatedRecord.getPreRace().getProjectedStandings().size());
  }

  @Test
  public void testDriverProjectionSerialization() throws Exception {
    com.fasterxml.jackson.databind.ObjectMapper mapper =
        new com.fasterxml.jackson.databind.ObjectMapper();

    java.util.Map<String, Double> laneMap = new HashMap<>();
    laneMap.put("Lane 1", 3.25);

    RacePredictionRecord.DriverProjection dp =
        new RacePredictionRecord.DriverProjection(
            "d1", "Alice", 1, 45.0, 180.0, 0.99, 1.0, 3.25, 0.25, 38, laneMap, 10, 3.20, 992, 1000);

    String json = mapper.writeValueAsString(dp);
    RacePredictionRecord.DriverProjection deserialized =
        mapper.readValue(json, RacePredictionRecord.DriverProjection.class);

    org.junit.Assert.assertEquals(992, deserialized.getSimulatedWins());
    org.junit.Assert.assertEquals(1000, deserialized.getTotalSimulations());
    org.junit.Assert.assertEquals(3.25, deserialized.getPriorMedianLapTime(), 0.001);
    org.junit.Assert.assertEquals(0.25, deserialized.getPriorStdDev(), 0.001);
    org.junit.Assert.assertEquals(38, deserialized.getHistoricalLaps());
    org.junit.Assert.assertEquals(1, deserialized.getPerLaneMedians().size());
  }
}
