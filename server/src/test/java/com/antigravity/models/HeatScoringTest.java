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

  @Test
  public void testJacksonDeserializationSnakeCase() throws Exception {
    com.fasterxml.jackson.databind.ObjectMapper mapper =
        new com.fasterxml.jackson.databind.ObjectMapper();
    String json =
        "{\"finish_method\":\"Timed\",\"finish_value\":60,\"heat_ranking\":\"LAP_COUNT\",\"heat_ranking_tiebreaker\":\"FASTEST_LAP_TIME\",\"allow_finish\":\"SingleLapAutoSegments\"}";
    HeatScoring scoring = mapper.readValue(json, HeatScoring.class);
    assertEquals(HeatScoring.AllowFinish.SingleLapAutoSegments, scoring.getAllowFinish());
    assertEquals(FinishMethod.Timed, scoring.getFinishMethod());
    assertEquals(60L, scoring.getFinishValue());
  }

  @Test
  public void testJacksonDeserializationCamelCase() throws Exception {
    com.fasterxml.jackson.databind.ObjectMapper mapper =
        new com.fasterxml.jackson.databind.ObjectMapper();
    String json =
        "{\"finishMethod\":\"Timed\",\"finishValue\":45,\"heatRanking\":\"FASTEST_LAP\",\"heatRankingTiebreaker\":\"MEDIAN_LAP_TIME\",\"allowFinish\":\"SingleLapAutoSegments\"}";
    HeatScoring scoring = mapper.readValue(json, HeatScoring.class);
    assertEquals(HeatScoring.AllowFinish.SingleLapAutoSegments, scoring.getAllowFinish());
    assertEquals(FinishMethod.Timed, scoring.getFinishMethod());
    assertEquals(45L, scoring.getFinishValue());
    assertEquals(HeatRanking.FASTEST_LAP, scoring.getHeatRanking());
    assertEquals(HeatRankingTiebreaker.MEDIAN_LAP_TIME, scoring.getHeatRankingTiebreaker());
  }
}
