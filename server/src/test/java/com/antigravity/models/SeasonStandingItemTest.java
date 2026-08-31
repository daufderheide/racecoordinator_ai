package com.antigravity.models;

import static org.junit.Assert.assertEquals;

import java.util.Arrays;
import org.junit.Test;

public class SeasonStandingItemTest {

  @Test
  public void testConstructorsAndCalculations() {
    SeasonStandingDetail detail1 =
        new SeasonStandingDetail("r1", "Race 1", 1, 25.0, 1.0, 25.0, 2.0, 53.0);
    SeasonStandingDetail detail2 =
        new SeasonStandingDetail("r2", "Race 2", 2, 18.0, 0.0, 18.0, 1.0, 37.0);
    detail2.setDropped(true);

    SeasonStandingItem item =
        new SeasonStandingItem("d1", "Driver 1", 43.0, 43.0, 2, Arrays.asList(detail1, detail2));

    assertEquals("d1", item.getDriverId());
    assertEquals("Driver 1", item.getDriverName());
    assertEquals(43.0, item.getNetPoints(), 0.001);
    assertEquals(43.0, item.getGrossPoints(), 0.001);
    assertEquals(0.0, item.getDroppedPoints(), 0.001);
    assertEquals(2, item.getRacesRun());
    assertEquals(2, item.getRaceScores().size());

    SeasonStandingItem itemWithDrops =
        new SeasonStandingItem("d2", "Driver 2", 40.0, 55.0, 3, Arrays.asList(detail1, detail2));
    assertEquals(40.0, itemWithDrops.getNetPoints(), 0.001);
    assertEquals(55.0, itemWithDrops.getGrossPoints(), 0.001);
    assertEquals(15.0, itemWithDrops.getDroppedPoints(), 0.001);

    item.setRank(1);
    assertEquals(1, item.getRank());

    // detail2 is dropped, so only detail1 bonus points count
    assertEquals(1.0, item.getOverallBonusPoints(), 0.001);
    assertEquals(2.0, item.getHeatBonusPoints(), 0.001);
    assertEquals(3.0, item.getTotalBonusPoints(), 0.001);
    assertEquals(3.0, item.getBonusPoints(), 0.001);
  }
}
