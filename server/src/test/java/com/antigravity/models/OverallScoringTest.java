package com.antigravity.models;

import static org.junit.Assert.assertEquals;

import com.antigravity.models.OverallScoring.OverallRanking;
import com.antigravity.models.OverallScoring.OverallRankingTiebreaker;
import org.junit.Test;

public class OverallScoringTest {

  @Test
  public void testToRankingMethod() {
    OverallScoring lapCount =
        new OverallScoring(0, OverallRanking.LAP_COUNT, OverallRankingTiebreaker.AVERAGE_LAP_TIME);
    assertEquals(RankingMethod.LAP_COUNT, lapCount.toRankingMethod());

    OverallScoring fastestLap =
        new OverallScoring(
            0, OverallRanking.FASTEST_LAP, OverallRankingTiebreaker.AVERAGE_LAP_TIME);
    assertEquals(RankingMethod.FASTEST_LAP, fastestLap.toRankingMethod());

    OverallScoring totalTime =
        new OverallScoring(0, OverallRanking.TOTAL_TIME, OverallRankingTiebreaker.AVERAGE_LAP_TIME);
    assertEquals(RankingMethod.TOTAL_TIME, totalTime.toRankingMethod());

    OverallScoring avgLap =
        new OverallScoring(
            0, OverallRanking.AVERAGE_LAP, OverallRankingTiebreaker.AVERAGE_LAP_TIME);
    assertEquals(RankingMethod.AVERAGE_LAP, avgLap.toRankingMethod());

    OverallScoring nullRanking = new OverallScoring(0, null, null);
    assertEquals(RankingMethod.LAP_COUNT, nullRanking.toRankingMethod());
  }

  @Test
  public void testToTiebreakerMethod() {
    OverallScoring fastest =
        new OverallScoring(0, OverallRanking.LAP_COUNT, OverallRankingTiebreaker.FASTEST_LAP_TIME);
    assertEquals(TiebreakerMethod.FASTEST_LAP_TIME, fastest.toTiebreakerMethod());

    OverallScoring median =
        new OverallScoring(0, OverallRanking.LAP_COUNT, OverallRankingTiebreaker.MEDIAN_LAP_TIME);
    assertEquals(TiebreakerMethod.MEDIAN_LAP_TIME, median.toTiebreakerMethod());

    OverallScoring avg =
        new OverallScoring(0, OverallRanking.LAP_COUNT, OverallRankingTiebreaker.AVERAGE_LAP_TIME);
    assertEquals(TiebreakerMethod.AVERAGE_LAP_TIME, avg.toTiebreakerMethod());

    OverallScoring total =
        new OverallScoring(0, OverallRanking.LAP_COUNT, OverallRankingTiebreaker.TOTAL_TIME);
    assertEquals(TiebreakerMethod.TOTAL_TIME, total.toTiebreakerMethod());

    OverallScoring nullTiebreaker = new OverallScoring(0, null, null);
    assertEquals(TiebreakerMethod.AVERAGE_LAP_TIME, nullTiebreaker.toTiebreakerMethod());
  }
}
