package com.antigravity.race;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.antigravity.models.Driver;
import com.antigravity.proto.OverallRecords;
import com.antigravity.proto.RecordData;
import com.antigravity.proto.RecordEntry;
import java.util.Arrays;
import org.junit.Test;

public class FastestLapsSummaryTest {

  @Test
  public void testDefaultConstructorAndSetters() {
    FastestLapsSummary summary = new FastestLapsSummary();
    assertNotNull(summary.getRecordLapNames());
    assertNotNull(summary.getRecordLapTimes());
    assertNotNull(summary.getRecordLapDates());
    assertNotNull(summary.getBestLapNames());
    assertNotNull(summary.getBestLapTimes());

    summary.setOverallRecordLapName("David");
    summary.setOverallRecordLapTime(5.237);
    summary.setOverallRecordLapDate("2025-06-28T16:15:27");

    assertEquals("David", summary.getOverallRecordLapName());
    assertEquals(5.237, summary.getOverallRecordLapTime(), 0.0001);
    assertEquals("2025-06-28T16:15:27", summary.getOverallRecordLapDate());

    summary.setRecordLapNames(Arrays.asList("Steve A", "David"));
    summary.setRecordLapTimes(Arrays.asList(5.239, 5.237));
    summary.setRecordLapDates(Arrays.asList("2025-04-26T16:00:06", "2025-06-28T16:15:27"));

    assertEquals("Steve A", summary.getRecordLapName(0));
    assertEquals(5.237, summary.getRecordLapTime(1), 0.0001);
    assertEquals("2025-06-28T16:15:27", summary.getRecordLapDate(1));
    assertEquals("", summary.getRecordLapName(99));
    assertNull(summary.getRecordLapTime(99));
    assertEquals("", summary.getRecordLapDate(99));

    summary.setBestLapNames(Arrays.asList("David", "Ben"));
    summary.setBestLapTimes(Arrays.asList(6.737, 6.806));

    assertEquals("David", summary.getBestLapName(0));
    assertEquals(6.806, summary.getBestLapTime(1), 0.0001);
    assertEquals("", summary.getBestLapName(99));
    assertNull(summary.getBestLapTime(99));
  }

  @Test
  public void testFrom_NullRaceAndActiveLanes() {
    FastestLapsSummary summary = FastestLapsSummary.from(null, null, null);
    assertNotNull(summary);
    assertEquals(2, summary.getRecordLapNames().size());
    assertEquals(2, summary.getRecordLapTimes().size());
    assertEquals(2, summary.getRecordLapDates().size());
    assertEquals(2, summary.getBestLapNames().size());
    assertEquals(2, summary.getBestLapTimes().size());
  }

  @Test
  public void testFrom_WithRunHeats() {
    Driver driver1 = new Driver.Builder().withId("d1").withName("David").build();
    Driver driver2 = new Driver.Builder().withId("d2").withName("Ben").build();

    RaceParticipant p1 = new RaceParticipant(driver1);
    RaceParticipant p2 = new RaceParticipant(driver2);

    Heat heat = new Heat();
    heat.setHeatNumber(1);

    DriverHeatData dhd0 = new DriverHeatData();
    dhd0.setDriver(p1);
    dhd0.setActualDriver(driver1);
    dhd0.setLane(0);
    DriverHeatData.LapData lap1 = new DriverHeatData.LapData();
    lap1.setLapTime(6.737);
    DriverHeatData.LapData lap2 = new DriverHeatData.LapData();
    lap2.setLapTime(6.621);
    dhd0.setLaps(Arrays.asList(lap1, lap2));

    DriverHeatData dhd1 = new DriverHeatData();
    dhd1.setDriver(p2);
    dhd1.setActualDriver(driver2);
    dhd1.setLane(1);
    DriverHeatData.LapData lap3 = new DriverHeatData.LapData();
    lap3.setLapTime(6.806);
    dhd1.setLaps(Arrays.asList(lap3));

    heat.setDrivers(Arrays.asList(dhd0, dhd1));

    FastestLapsSummary summary =
        FastestLapsSummary.from(null, Arrays.asList(heat), Arrays.asList(0, 1));
    assertNotNull(summary);
    assertEquals("David", summary.getBestLapName(0));
    assertEquals(6.621, summary.getBestLapTime(0), 0.0001);
    assertEquals("Ben", summary.getBestLapName(1));
    assertEquals(6.806, summary.getBestLapTime(1), 0.0001);
  }

  @Test
  public void testFrom_WithRaceRecords() {
    Race race = mock(Race.class);
    RaceRecords records = mock(RaceRecords.class);
    when(race.getRecordsManager()).thenReturn(records);

    RecordEntry overallLap =
        RecordEntry.newBuilder()
            .setHolderName("David")
            .setValue(5.237)
            .setDate(1719591327000L)
            .build();

    RecordEntry lane0Lap =
        RecordEntry.newBuilder()
            .setHolderName("Steve A")
            .setValue(5.239)
            .setDate(1714147206000L)
            .build();

    RecordEntry lane1Lap =
        RecordEntry.newBuilder()
            .setHolderName("David")
            .setValue(5.237)
            .setDate(1719591327000L)
            .build();

    OverallRecords overall =
        OverallRecords.newBuilder()
            .setFastestLap(overallLap)
            .addLaneFastestLap(lane0Lap)
            .addLaneFastestLap(lane1Lap)
            .build();

    RecordData recordData = RecordData.newBuilder().setOverall(overall).build();
    when(records.getRecordData()).thenReturn(recordData);

    FastestLapsSummary summary = FastestLapsSummary.from(race, null, Arrays.asList(0, 1));
    assertNotNull(summary);
    assertEquals("David", summary.getOverallRecordLapName());
    assertEquals(5.237, summary.getOverallRecordLapTime(), 0.0001);
    assertTrue(summary.getOverallRecordLapDate().length() > 0);

    assertEquals("Steve A", summary.getRecordLapName(0));
    assertEquals(5.239, summary.getRecordLapTime(0), 0.0001);
    assertEquals("David", summary.getRecordLapName(1));
    assertEquals(5.237, summary.getRecordLapTime(1), 0.0001);
  }

  @Test
  public void testFormatEpochMillis() {
    assertEquals("", FastestLapsSummary.formatEpochMillis(0L));
    assertEquals("", FastestLapsSummary.formatEpochMillis(-1L));
    String formatted = FastestLapsSummary.formatEpochMillis(1719591327000L);
    assertTrue(formatted.contains("2024") || formatted.contains("2025"));
  }
}
