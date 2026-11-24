package com.antigravity.models;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import com.antigravity.race.DriverHeatData;
import com.antigravity.race.Heat;
import com.antigravity.race.RaceStatistics;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.List;
import org.junit.Test;

public class RaceHistoryRecordTest {

  @Test
  public void testConstructorsAndGetters() {
    RaceHistoryRecord record =
        new RaceHistoryRecord(
            "hist_1",
            "orig_1",
            null,
            null,
            new ArrayList<>(),
            new ArrayList<>(),
            120.5f,
            new RaceStatistics(),
            true);

    assertEquals("hist_1", record.getId());
    assertEquals("orig_1", record.getOriginalEntityId());
    assertEquals(120.5f, record.getAccumulatedRaceTime(), 0.001);
    assertTrue(record.isDemo());
    assertNotNull(record.getStatistics());

    record.setEventId("event_1");
    record.setEventName("Grand Prix");
    record.setEventRace(true);
    record.setEventSummary(false);
    record.setTimestamp(1700000000000L);

    assertEquals("event_1", record.getEventId());
    assertEquals("Grand Prix", record.getEventName());
    assertTrue(record.isEventRace());
    assertEquals(Long.valueOf(1700000000000L), record.getTimestamp());

    // Test fallback to statistics startMillis when timestamp is null
    RaceHistoryRecord recordWithStats = new RaceHistoryRecord();
    RaceStatistics stats = new RaceStatistics();
    stats.setStartMillis(1690000000000L);
    recordWithStats.setStatistics(stats);
    assertEquals(Long.valueOf(1690000000000L), recordWithStats.getTimestamp());
  }

  @Test
  public void testJsonSerialization() throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    RaceHistoryRecord record =
        new RaceHistoryRecord(
            "hist_1", "orig_1", null, null, null, null, 100.0f, null, false, 1720000000000L);

    String json = mapper.writeValueAsString(record);
    RaceHistoryRecord deserialized = mapper.readValue(json, RaceHistoryRecord.class);

    assertNotNull(deserialized);
    assertEquals("hist_1", deserialized.getId());
    assertEquals("orig_1", deserialized.getOriginalEntityId());
    assertEquals(Long.valueOf(1720000000000L), deserialized.getTimestamp());
    assertEquals(0, deserialized.getIneligibleLapCount());
  }

  @Test
  public void testIneligibleLapCount() throws Exception {
    RaceHistoryRecord record = new RaceHistoryRecord();
    assertEquals(0, record.getIneligibleLapCount());

    Heat heat1 = new Heat();
    DriverHeatData dhd1 = new DriverHeatData();
    dhd1.setLane(0);
    dhd1.addLap(4.5, false, true);
    dhd1.addLap(4.2, false, false); // Ineligible

    DriverHeatData dhd2 = new DriverHeatData();
    dhd2.setLane(1);
    dhd2.addLap(4.8, false, true);
    dhd2.addLap(4.3, false, false); // Ineligible
    dhd2.addLap(4.1, false, false); // Ineligible

    List<DriverHeatData> drivers = new ArrayList<>();
    drivers.add(dhd1);
    drivers.add(dhd2);
    heat1.setDrivers(drivers);

    List<Heat> heats = new ArrayList<>();
    heats.add(heat1);
    record.setHeats(heats);

    assertEquals(3, record.getIneligibleLapCount());

    // Explicit override
    record.setIneligibleLapCount(5);
    assertEquals(5, record.getIneligibleLapCount());

    // JSON serialization
    ObjectMapper mapper = new ObjectMapper();
    String json = mapper.writeValueAsString(record);
    assertTrue(json.contains("\"ineligible_lap_count\":5"));

    RaceHistoryRecord deserialized = mapper.readValue(json, RaceHistoryRecord.class);
    assertEquals(5, deserialized.getIneligibleLapCount());
  }

  @Test
  public void testHeatCarSnapshotSurvivesSaveAndLoad() throws Exception {
    // The results pages show each heat's car from the saved race (#1210), so
    // the snapshot must come back from the race_history JSON intact.
    Car car =
        new Car.Builder()
            .withName("Audi R8 LMS")
            .withCarClass("GT3")
            .withMotor("Flat-6 21.5k")
            .withTyres("Ortmann")
            .withEntityId("car-1")
            .build();
    DriverHeatData dhd = new DriverHeatData();
    dhd.setLane(0);
    dhd.setCar(car);
    Heat heat = new Heat();
    List<DriverHeatData> drivers = new ArrayList<>();
    drivers.add(dhd);
    heat.setDrivers(drivers);
    RaceHistoryRecord record = new RaceHistoryRecord();
    List<Heat> heats = new ArrayList<>();
    heats.add(heat);
    record.setHeats(heats);

    // The same settings as SqliteRepository, which stores race_history.
    ObjectMapper mapper =
        new ObjectMapper()
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
            .configure(DeserializationFeature.READ_UNKNOWN_ENUM_VALUES_AS_NULL, true);
    RaceHistoryRecord loaded =
        mapper.readValue(mapper.writeValueAsString(record), RaceHistoryRecord.class);

    Car back = loaded.getHeats().get(0).getDrivers().get(0).getCar();
    assertNotNull(back);
    assertEquals("Audi R8 LMS", back.getName());
    assertEquals("GT3", back.getCarClass());
    assertEquals("Flat-6 21.5k", back.getMotor());
    assertEquals("Ortmann", back.getTyres());
    assertEquals("car-1", back.getEntityId());
  }
}
