package com.antigravity.race;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import java.lang.reflect.Constructor;
import java.lang.reflect.Modifier;
import org.junit.Test;

public class SampleRaceFactoryTest {

  @Test
  public void testConstructorIsPrivate() throws Exception {
    Constructor<SampleRaceFactory> constructor = SampleRaceFactory.class.getDeclaredConstructor();
    assertTrue(Modifier.isPrivate(constructor.getModifiers()));
    constructor.setAccessible(true);
    constructor.newInstance();
  }

  @Test
  public void testCreateSampleRace() {
    Race race = SampleRaceFactory.createSampleRace();
    assertNotNull(race);
    assertNotNull(race.getTrack());
    assertEquals(4, race.getTrack().getLanes().size());
    assertEquals(4, race.getDrivers().size());
    assertEquals(2, race.getHeats().size());

    Heat heat1 = race.getHeats().get(0);
    assertTrue(heat1.isStarted());
    assertEquals(4, heat1.getDrivers().size());

    DriverHeatData dhd = heat1.getDrivers().get(0);
    assertNotNull(dhd.getDriver());
    assertEquals(1, dhd.getLane());
    assertFalse(dhd.getLaps().isEmpty());
    assertTrue(dhd.getTotalTime() > 0);
    assertTrue(dhd.getBestLapTime() > 0);
    assertTrue(dhd.getAverageLapTime() > 0);
    assertTrue(dhd.getMedianLapTime() > 0);
    assertEquals((double) dhd.getLaps().size(), dhd.getAdjustedLapCount(), 0.001);
  }
}
