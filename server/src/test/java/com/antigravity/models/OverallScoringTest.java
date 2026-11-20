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

  @Test
  public void testJacksonDeserializationSnakeCase() throws Exception {
    com.fasterxml.jackson.databind.ObjectMapper mapper =
        new com.fasterxml.jackson.databind.ObjectMapper();
    String json =
        "{\"dropped_heats\":2,\"ranking_method\":\"FASTEST_LAP\",\"tiebreaker\":\"MEDIAN_LAP_TIME\"}";
    OverallScoring scoring = mapper.readValue(json, OverallScoring.class);
    assertEquals(2, scoring.getDroppedHeats());
    assertEquals(OverallRanking.FASTEST_LAP, scoring.getRankingMethod());
    assertEquals(OverallRankingTiebreaker.MEDIAN_LAP_TIME, scoring.getTiebreaker());
  }

  @Test
  public void testJacksonDeserializationCamelCase() throws Exception {
    com.fasterxml.jackson.databind.ObjectMapper mapper =
        new com.fasterxml.jackson.databind.ObjectMapper();
    String json =
        "{\"droppedHeats\":1,\"rankingMethod\":\"TOTAL_TIME\",\"tiebreaker\":\"FASTEST_LAP_TIME\"}";
    OverallScoring scoring = mapper.readValue(json, OverallScoring.class);
    assertEquals(1, scoring.getDroppedHeats());
    assertEquals(OverallRanking.TOTAL_TIME, scoring.getRankingMethod());
    assertEquals(OverallRankingTiebreaker.FASTEST_LAP_TIME, scoring.getTiebreaker());
  }

  @Test
  public void testJacksonDeserializationUnknownEnumFallbacks() throws Exception {
    com.fasterxml.jackson.databind.ObjectMapper mapper =
        new com.fasterxml.jackson.databind.ObjectMapper()
            .configure(
                com.fasterxml.jackson.databind.DeserializationFeature
                    .READ_UNKNOWN_ENUM_VALUES_AS_NULL,
                true);
    String json =
        "{\"dropped_heats\":0,\"ranking_method\":\"FUTURE_RANKING\",\"tiebreaker\":\"LAP_COUNT\"}";
    OverallScoring scoring = mapper.readValue(json, OverallScoring.class);
    assertEquals(OverallRanking.LAP_COUNT, scoring.getRankingMethod());
    assertEquals(OverallRankingTiebreaker.AVERAGE_LAP_TIME, scoring.getTiebreaker());
  }
}
