package com.antigravity.race;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.antigravity.models.Driver;
import com.antigravity.models.HeatScoring;
import java.util.ArrayList;
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
    // Should pad to at least 4 lanes
    assertEquals(4, row1.getLaneLaps().size());
    assertEquals(3.5, row1.getLaneLap(0), 0.001);
    assertEquals(3.8, row1.getLaneLap(1), 0.001);
    assertNull(row1.getLaneLap(2));
    assertNull(row1.getLaneLap(3));

    // Row 2: lap 2
    HeatLapRow row2 = rows.get(1);
    assertEquals(2, row2.getLapNumber());
    assertEquals(4, row2.getLaneLaps().size());
    assertEquals(3.4, row2.getLaneLap(0), 0.001);
    assertNull(row2.getLaneLap(1));
    assertNull(row2.getLaneLap(2));
    assertNull(row2.getLaneLap(3));
  }
}
