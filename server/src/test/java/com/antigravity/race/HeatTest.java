package com.antigravity.race;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.antigravity.models.Driver;
import com.antigravity.models.HeatScoring;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import org.junit.Test;

public class HeatTest {

  @Test
  public void testGetActiveDriverCount_AllActive() {
    List<DriverHeatData> drivers = new ArrayList<>();
    drivers.add(createMockDriver("d1"));
    drivers.add(createMockDriver("d2"));

    Heat heat = new Heat(1, drivers, new HeatScoring(), false);
    assertEquals(2, heat.getActiveDriverCount());
  }

  @Test
  public void testGetActiveDriverCount_WithEmptyLane() {
    List<DriverHeatData> drivers = new ArrayList<>();
    drivers.add(createMockDriver("d1"));
    drivers.add(createMockDriver(null)); // Empty driver (no entityId)

    Heat heat = new Heat(1, drivers, new HeatScoring(), false);
    assertEquals(1, heat.getActiveDriverCount());
  }

  @Test
  public void testGetActiveDriverCount_Mixed() {
    List<DriverHeatData> drivers = new ArrayList<>();
    drivers.add(createMockDriver("d1"));
    drivers.add(createMockDriver(null));
    drivers.add(createMockDriver("d3"));

    Heat heat = new Heat(1, drivers, new HeatScoring(), false);
    assertEquals(2, heat.getActiveDriverCount());
  }

  @Test
  public void testGetActiveDriverCount_AllEmpty() {
    List<DriverHeatData> drivers = new ArrayList<>();
    drivers.add(createMockDriver(null));
    drivers.add(createMockDriver(null));

    Heat heat = new Heat(1, drivers, new HeatScoring(), false);
    assertEquals(0, heat.getActiveDriverCount());
  }

  @Test
  public void testGetActiveDriverCount_WithEmptyDriverId() {
    List<DriverHeatData> drivers = new ArrayList<>();
    drivers.add(createMockDriver("d1"));
    drivers.add(createMockDriver(Driver.EMPTY_DRIVER_ID));

    Heat heat = new Heat(1, drivers, new HeatScoring(), false);
    assertEquals(1, heat.getActiveDriverCount());
    org.junit.Assert.assertFalse(heat.isEmpty());
  }

  @Test
  public void testIsEmpty_EmptyHeat() {
    Heat heat = new Heat(1, new ArrayList<>(), new HeatScoring(), false);
    assertEquals(0, heat.getActiveDriverCount());
    org.junit.Assert.assertTrue(heat.isEmpty());

    Heat nullDriversHeat = new Heat();
    nullDriversHeat.setDrivers(null);
    assertEquals(0, nullDriversHeat.getActiveDriverCount());
    org.junit.Assert.assertTrue(nullDriversHeat.isEmpty());
  }

  @Test
  public void testGetActiveDriverCount_WithActualDriverOverride() {
    List<DriverHeatData> drivers = new ArrayList<>();
    DriverHeatData dhd1 = mock(DriverHeatData.class);
    Driver actualDriver = mock(Driver.class);
    when(actualDriver.getEntityId()).thenReturn("actual_d1");
    when(actualDriver.isEmpty()).thenReturn(false);
    when(dhd1.getActualDriver()).thenReturn(actualDriver);
    drivers.add(dhd1);

    DriverHeatData dhd2 = mock(DriverHeatData.class);
    Driver emptyActualDriver = mock(Driver.class);
    when(emptyActualDriver.getEntityId()).thenReturn(Driver.EMPTY_DRIVER_ID);
    when(emptyActualDriver.isEmpty()).thenReturn(true);
    when(dhd2.getActualDriver()).thenReturn(emptyActualDriver);
    drivers.add(dhd2);

    Heat heat = new Heat(1, drivers, new HeatScoring(), false);
    assertEquals(1, heat.getActiveDriverCount());
    org.junit.Assert.assertFalse(heat.isEmpty());
  }

  private DriverHeatData createMockDriver(String entityId) {
    DriverHeatData mockData = mock(DriverHeatData.class);
    RaceParticipant mockParticipant = mock(RaceParticipant.class);
    Driver mockDriver = mock(Driver.class);

    when(mockData.getDriver()).thenReturn(mockParticipant);
    when(mockParticipant.getDriver()).thenReturn(mockDriver);
    when(mockDriver.getEntityId()).thenReturn(entityId);
    when(mockDriver.isEmpty())
        .thenReturn(entityId == null || Driver.EMPTY_DRIVER_ID.equals(entityId));
    when(mockData.getObjectId()).thenReturn("obj_" + entityId);

    return mockData;
  }

  @Test
  public void testGetDriverOnLane_Boundaries() {
    List<DriverHeatData> drivers = new ArrayList<>();
    DriverHeatData dhd0 = mock(DriverHeatData.class);
    drivers.add(dhd0);

    Heat heat = new Heat(1, drivers, false);
    assertEquals(dhd0, heat.getDriverOnLane(0));
    assertNull(heat.getDriverOnLane(-1));
    assertNull(heat.getDriverOnLane(1));

    Heat nullDrivers = new Heat();
    nullDrivers.setDrivers(null);
    assertNull(nullDrivers.getDriverOnLane(0));
  }

  @Test
  public void testGetLaneTotalLaps() {
    List<DriverHeatData> drivers = new ArrayList<>();
    DriverHeatData dhd0 = mock(DriverHeatData.class);
    when(dhd0.isEmptyParticipant()).thenReturn(false);
    when(dhd0.getAdjustedLapCount()).thenReturn(25.5);
    drivers.add(dhd0);

    DriverHeatData emptyDhd = mock(DriverHeatData.class);
    when(emptyDhd.isEmptyParticipant()).thenReturn(true);
    drivers.add(emptyDhd);

    Heat heat = new Heat(1, drivers, false);
    assertEquals(25.5, heat.getLaneTotalLaps(0), 0.001);
    assertNull(heat.getLaneTotalLaps(1));
    assertNull(heat.getLaneTotalLaps(2));
    assertNull(heat.getLaneTotalLaps(-1));
  }

  @Test
  public void testGetLapRows_EmptyOrNull() {
    Heat heat = new Heat();
    heat.setDrivers(null);
    assertTrue(heat.getLapRows().isEmpty());

    heat.setDrivers(new ArrayList<>());
    assertTrue(heat.getLapRows().isEmpty());
  }

  @Test
  public void testGetLapRows_WithLapsAndPadding() {
    DriverHeatData dhd1 = new DriverHeatData();
    dhd1.setLane(0);
    dhd1.addLap(3.5, false, true);
    dhd1.addLap(3.4, false, true);

    DriverHeatData dhd2 = new DriverHeatData();
    dhd2.setLane(1);
    dhd2.addLap(3.8, false, true);

    List<DriverHeatData> drivers = new ArrayList<>();
    drivers.add(dhd1);
    drivers.add(dhd2);

    Heat heat = new Heat(1, drivers, false);
    List<HeatLapRow> rows = heat.getLapRows();

    assertEquals(2, rows.size());

    // Row 1: lap 1
    HeatLapRow row1 = rows.get(0);
    assertEquals(1, row1.getLapNumber());
    // Dynamic lanes: 2 drivers -> 2 lanes
    assertEquals(2, row1.getLaneLaps().size());
    assertEquals(3.5, row1.getLaneLap(0), 0.001);
    assertEquals(3.8, row1.getLaneLap(1), 0.001);
    assertNull(row1.getLaneLap(2));

    // Row 2: lap 2
    HeatLapRow row2 = rows.get(1);
    assertEquals(2, row2.getLapNumber());
    assertEquals(2, row2.getLaneLaps().size());
    assertEquals(3.4, row2.getLaneLap(0), 0.001);
    assertNull(row2.getLaneLap(1));
    assertNull(row2.getLaneLap(2));
  }

  @Test
  public void testHasSegments() {
    Heat heat = new Heat();
    heat.setDrivers(null);
    assertFalse(heat.hasSegments());

    heat.setDrivers(new ArrayList<>());
    assertFalse(heat.hasSegments());

    DriverHeatData dhd = new DriverHeatData();
    dhd.setLane(0);
    heat.getDrivers().add(dhd);
    assertFalse(heat.hasSegments());

    dhd.addLap(3.5, false, true);
    assertFalse(heat.hasSegments());

    dhd.getLaps().get(0).setSegments(new ArrayList<>());
    assertFalse(heat.hasSegments());

    dhd.getLaps().get(0).setSegments(Arrays.asList(1.23, 2.34));
    assertTrue(heat.hasSegments());
  }

  @Test
  public void testGetLapRows_WithSegments() {
    DriverHeatData dhd1 = new DriverHeatData();
    dhd1.setLane(0);
    dhd1.addLap(3.555, false, true);
    dhd1.getLaps().get(0).setSegments(Arrays.asList(1.1234, 2.4567));

    DriverHeatData dhd2 = new DriverHeatData();
    dhd2.setLane(1);
    dhd2.addLap(3.8, false, true);
    dhd2.getLaps().get(0).setSegments(Arrays.asList(3.8001));

    List<DriverHeatData> drivers = new ArrayList<>();
    drivers.add(dhd1);
    drivers.add(dhd2);

    Heat heat = new Heat(1, drivers, false);
    List<HeatLapRow> rows = heat.getLapRows();

    assertEquals(1, rows.size());
    HeatLapRow row = rows.get(0);

    assertEquals(2, row.getLaneSegments(0).size());
    assertEquals(1.123, row.getLaneSegments(0).get(0), 0.0001);
    assertEquals(2.457, row.getLaneSegments(0).get(1), 0.0001);
    assertEquals("1.123, 2.457", row.getLaneSegment(0));
    assertEquals(1.123, (Double) row.getLaneSegment(0, 0), 0.0001);
    assertEquals(2.457, (Double) row.getLaneSegment(0, 1), 0.0001);

    assertEquals(1, row.getLaneSegments(1).size());
    assertEquals(3.8, (Double) row.getLaneSegment(1), 0.0001);

    assertTrue(row.getLaneSegments(2).isEmpty());
    assertNull(row.getLaneSegment(2));
    assertNull(row.getLaneSegment(3));
  }

  @Test
  public void testMaxSegments_Variations() {
    Heat heat = new Heat();
    heat.setDrivers(null);
    assertEquals(0, heat.getMaxSegments());

    heat.setDrivers(new ArrayList<>());
    assertEquals(0, heat.getMaxSegments());

    DriverHeatData dhd1 = new DriverHeatData();
    dhd1.setLane(0);
    heat.getDrivers().add(dhd1);
    assertEquals(0, heat.getMaxSegments());

    dhd1.addLap(3.5, false, true);
    assertEquals(0, heat.getMaxSegments());

    dhd1.getLaps().get(0).setSegments(Collections.singletonList(1.5));
    assertEquals(1, heat.getMaxSegments());

    DriverHeatData dhd2 = new DriverHeatData();
    dhd2.setLane(1);
    dhd2.addLap(3.8, false, true);
    dhd2.getLaps().get(0).setSegments(Arrays.asList(1.2, 2.6));
    heat.getDrivers().add(dhd2);
    assertEquals(2, heat.getMaxSegments());
  }

  @Test
  public void testColumnHeaders_DriverHeaders_TotalLapHeaders_WithoutSegments() {
    Heat heat = new Heat();
    heat.setDrivers(null);
    assertTrue(heat.getColumnHeaders().isEmpty());
    assertTrue(heat.getDriverHeaders().isEmpty());
    assertTrue(heat.getTotalLapHeaders().isEmpty());

    DriverHeatData dhd1 = new DriverHeatData();
    dhd1.setLane(0);
    Driver d1 = new Driver("Alice", "Alice", "d1", "d1");
    dhd1.setDriver(new RaceParticipant(d1));
    dhd1.setActualDriver(d1);
    dhd1.setUserLaps(25.0);

    DriverHeatData dhd2 = new DriverHeatData();
    dhd2.setLane(1);
    Driver d2 = new Driver("Bob", "Bob", "d2", "d2");
    dhd2.setDriver(new RaceParticipant(d2));
    dhd2.setActualDriver(d2);
    dhd2.setUserLaps(24.5);

    heat.setDrivers(Arrays.asList(dhd1, dhd2));

    assertEquals(Arrays.asList("Lane 1", "Lane 2"), heat.getColumnHeaders());
    assertEquals(Arrays.asList("Alice", "Bob"), heat.getDriverHeaders());
    assertEquals(Arrays.asList(25.0, 24.5), heat.getTotalLapHeaders());
  }

  @Test
  public void testColumnHeaders_DriverHeaders_TotalLapHeaders_WithSegments() {
    DriverHeatData dhd1 = new DriverHeatData();
    dhd1.setLane(0);
    Driver d1 = new Driver("Alice", "Alice", "d1", "d1");
    dhd1.setDriver(new RaceParticipant(d1));
    dhd1.setActualDriver(d1);
    dhd1.setUserLaps(10.0);
    dhd1.addLap(3.5, false, true);
    dhd1.getLaps().get(0).setSegments(Arrays.asList(1.1, 2.4));

    DriverHeatData dhd2 = new DriverHeatData();
    dhd2.setLane(1);
    Driver d2 = new Driver("Bob", "Bob", "d2", "d2");
    dhd2.setDriver(new RaceParticipant(d2));
    dhd2.setActualDriver(d2);
    dhd2.setUserLaps(9.0);
    dhd2.addLap(3.8, false, true);
    dhd2.getLaps().get(0).setSegments(Collections.singletonList(3.8));

    Heat heat = new Heat(1, Arrays.asList(dhd1, dhd2), false);

    assertEquals(
        Arrays.asList("Lane 1", "Seg 1", "Seg 2", "Lane 2", "Seg 1", "Seg 2"),
        heat.getColumnHeaders());
    assertEquals(Arrays.asList("Alice", null, null, "Bob", null, null), heat.getDriverHeaders());
    assertEquals(Arrays.asList(11.0, null, null, 10.0, null, null), heat.getTotalLapHeaders());
  }

  @Test
  public void testGetLapRows_DynamicLanesAndValues() {
    List<DriverHeatData> drivers = new ArrayList<>();
    for (int i = 0; i < 6; i++) {
      DriverHeatData dhd = new DriverHeatData();
      dhd.setLane(i);
      Driver d = new Driver("Driver " + (i + 1), "Driver " + (i + 1), "d" + (i + 1), "d" + (i + 1));
      dhd.setDriver(new RaceParticipant(d));
      dhd.setActualDriver(d);
      dhd.addLap(3.0 + i * 0.1, false, true);
      drivers.add(dhd);
    }
    Heat heat = new Heat(1, drivers, false);
    List<HeatLapRow> rows = heat.getLapRows();

    assertEquals(1, rows.size());
    HeatLapRow row = rows.get(0);
    assertEquals(6, row.getLaneLaps().size());
    assertEquals(6, row.getValues().size());
    assertEquals(3.0, row.getLaneLap(0), 0.001);
    assertEquals(3.5, row.getLaneLap(5), 0.001);
  }
}
