package com.antigravity.models;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.HashMap;
import org.junit.Test;

public class RacePredictionRecordTest {

  @Test
  public void testConstructorsAndGetters() {
    RacePredictionRecord.DriverProjection proj =
        new RacePredictionRecord.DriverProjection("d1", "Driver 1", 1, 50.0, 300.0, 0.8, 0.95);
    assertEquals("d1", proj.getDriverId());
    assertEquals("Driver 1", proj.getDriverName());
    assertEquals(1, proj.getProjectedRank());
    assertEquals(50.0, proj.getProjectedLaps(), 0.001);
    assertEquals(0.8, proj.getWinProbability(), 0.001);
    assertEquals(0.95, proj.getPodiumProbability(), 0.001);

    RacePredictionRecord.PredictionSnapshot snapshot =
        new RacePredictionRecord.PredictionSnapshot(
            1, 10, new HashMap<>(), new HashMap<>(), new ArrayList<>(), new ArrayList<>());
    assertEquals(1, snapshot.getHeatIndex());
    assertEquals(10, snapshot.getCompletedLaps());

    RacePredictionRecord record =
        new RacePredictionRecord("p1", "race_1", 12345L, snapshot, new ArrayList<>());
    assertEquals("p1", record.getId());
    assertEquals("race_1", record.getRaceId());
    assertEquals(12345L, record.getTimestamp());
    assertNotNull(record.getPreRace());
  }

  @Test
  public void testJsonSerialization() throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    RacePredictionRecord record =
        new RacePredictionRecord("p1", "race_1", 12345L, null, new ArrayList<>());

    String json = mapper.writeValueAsString(record);
    RacePredictionRecord deserialized = mapper.readValue(json, RacePredictionRecord.class);

    assertNotNull(deserialized);
    assertEquals("race_1", deserialized.getRaceId());
    assertEquals(12345L, deserialized.getTimestamp());
  }
}
