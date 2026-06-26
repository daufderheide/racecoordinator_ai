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
  }

  private DriverHeatData createMockDriver(String entityId) {
    DriverHeatData mockData = mock(DriverHeatData.class);
    RaceParticipant mockParticipant = mock(RaceParticipant.class);
    Driver mockDriver = mock(Driver.class);

    when(mockData.getDriver()).thenReturn(mockParticipant);
    when(mockParticipant.getDriver()).thenReturn(mockDriver);
    when(mockDriver.getEntityId()).thenReturn(entityId);
    when(mockDriver.isEmpty()).thenReturn(Driver.EMPTY_DRIVER_ID.equals(entityId));
    when(mockData.getObjectId()).thenReturn("obj_" + entityId);

    return mockData;
  }
}
