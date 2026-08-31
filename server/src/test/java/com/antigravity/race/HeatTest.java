package com.antigravity.race;

import static org.junit.Assert.assertEquals;
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
}
