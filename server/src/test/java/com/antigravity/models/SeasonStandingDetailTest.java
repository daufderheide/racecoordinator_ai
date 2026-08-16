package com.antigravity.models;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public class SeasonStandingDetailTest {

  @Test
  public void testConstructorWithBonusPoints() {
    SeasonStandingDetail detail =
        new SeasonStandingDetail("r1", "Race 1", 1, 25.0, 5.0, 10.0, 3.0, 43.0);

    assertEquals("r1", detail.getRaceId());
    assertEquals("Race 1", detail.getRaceName());
    assertEquals(1, detail.getOverallRank());
    assertEquals(25.0, detail.getOverallPoints(), 0.001);
    assertEquals(5.0, detail.getOverallBonusPoints(), 0.001);
    assertEquals(10.0, detail.getHeatPoints(), 0.001);
    assertEquals(3.0, detail.getHeatBonusPoints(), 0.001);
    assertEquals(43.0, detail.getTotalPoints(), 0.001);
    assertFalse(detail.isDropped());

    detail.setDropped(true);
    assertTrue(detail.isDropped());
  }

  @Test
  public void testLegacyConstructorWithoutBonusPoints() {
    SeasonStandingDetail detail = new SeasonStandingDetail("r2", "Race 2", 2, 18.0, 6.0, 24.0);

    assertEquals("r2", detail.getRaceId());
    assertEquals("Race 2", detail.getRaceName());
    assertEquals(2, detail.getOverallRank());
    assertEquals(18.0, detail.getOverallPoints(), 0.001);
    assertEquals(0.0, detail.getOverallBonusPoints(), 0.001);
    assertEquals(6.0, detail.getHeatPoints(), 0.001);
    assertEquals(0.0, detail.getHeatBonusPoints(), 0.001);
    assertEquals(24.0, detail.getTotalPoints(), 0.001);
    assertFalse(detail.isDropped());
  }
}
