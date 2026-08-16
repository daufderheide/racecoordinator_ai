package com.antigravity.models;

import static org.junit.Assert.assertEquals;

import com.antigravity.models.HeatScoring.FinishMethod;
import com.antigravity.models.HeatScoring.HeatRanking;
import com.antigravity.models.HeatScoring.HeatRankingTiebreaker;
import org.junit.Test;

public class HeatScoringTest {

  @Test
  public void testToRankingMethod() {
    HeatScoring lapCount =
        new HeatScoring(
            FinishMethod.Lap, 10, HeatRanking.LAP_COUNT, HeatRankingTiebreaker.AVERAGE_LAP_TIME);
    assertEquals(RankingMethod.LAP_COUNT, lapCount.toRankingMethod());

    HeatScoring fastestLap =
        new HeatScoring(
            FinishMethod.Lap, 10, HeatRanking.FASTEST_LAP, HeatRankingTiebreaker.AVERAGE_LAP_TIME);
    assertEquals(RankingMethod.FASTEST_LAP, fastestLap.toRankingMethod());

    HeatScoring totalTime =
        new HeatScoring(
            FinishMethod.Lap, 10, HeatRanking.TOTAL_TIME, HeatRankingTiebreaker.AVERAGE_LAP_TIME);
    assertEquals(RankingMethod.TOTAL_TIME, totalTime.toRankingMethod());

    HeatScoring nullRanking = new HeatScoring(FinishMethod.Lap, 10, null, null);
    assertEquals(RankingMethod.LAP_COUNT, nullRanking.toRankingMethod());
  }

  @Test
  public void testToTiebreakerMethod() {
    HeatScoring fastest =
        new HeatScoring(
            FinishMethod.Lap, 10, HeatRanking.LAP_COUNT, HeatRankingTiebreaker.FASTEST_LAP_TIME);
    assertEquals(TiebreakerMethod.FASTEST_LAP_TIME, fastest.toTiebreakerMethod());

    HeatScoring median =
        new HeatScoring(
            FinishMethod.Lap, 10, HeatRanking.LAP_COUNT, HeatRankingTiebreaker.MEDIAN_LAP_TIME);
    assertEquals(TiebreakerMethod.MEDIAN_LAP_TIME, median.toTiebreakerMethod());

    HeatScoring avg =
        new HeatScoring(
            FinishMethod.Lap, 10, HeatRanking.LAP_COUNT, HeatRankingTiebreaker.AVERAGE_LAP_TIME);
    assertEquals(TiebreakerMethod.AVERAGE_LAP_TIME, avg.toTiebreakerMethod());

    HeatScoring nullTiebreaker = new HeatScoring(FinishMethod.Lap, 10, null, null);
    assertEquals(TiebreakerMethod.AVERAGE_LAP_TIME, nullTiebreaker.toTiebreakerMethod());
  }
}
