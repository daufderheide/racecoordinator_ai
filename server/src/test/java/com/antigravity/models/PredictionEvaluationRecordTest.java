package com.antigravity.models;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Arrays;
import org.junit.Test;

public class PredictionEvaluationRecordTest {

  @Test
  public void testConstructorsAndGetters() {
    PredictionEvaluationRecord.DriverEvaluation eval =
        new PredictionEvaluationRecord.DriverEvaluation("d1", "Driver 1", 0.75, 1, 1, 50.0, 51.0);
    assertEquals("d1", eval.getDriverId());
    assertEquals("Driver 1", eval.getDriverName());
    assertEquals(0.75, eval.getPreRaceWinProb(), 0.001);
    assertEquals(1, eval.getProjectedRank());
    assertEquals(1, eval.getActualRank());
    assertEquals(50.0, eval.getProjectedLaps(), 0.001);
    assertEquals(51.0, eval.getActualLaps(), 0.001);

    PredictionEvaluationRecord record =
        new PredictionEvaluationRecord(
            "eval_1", "race_1", 123456789L, 0.05, 0.5, 1.2, Arrays.asList(eval));

    assertEquals("eval_1", record.getId());
    assertEquals("race_1", record.getRaceId());
    assertEquals(123456789L, record.getEvaluatedAt());
    assertEquals(0.05, record.getBrierScore(), 0.001);
    assertEquals(0.5, record.getRankMae(), 0.001);
    assertEquals(1.2, record.getLapProjectionMae(), 0.001);
    assertEquals(1, record.getDriverEvaluations().size());
  }

  @Test
  public void testJsonSerialization() throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    PredictionEvaluationRecord record =
        new PredictionEvaluationRecord("eval_1", "race_1", 1000L, 0.1, 0.2, 0.3, null);

    String json = mapper.writeValueAsString(record);
    PredictionEvaluationRecord deserialized =
        mapper.readValue(json, PredictionEvaluationRecord.class);

    assertNotNull(deserialized);
    assertEquals("race_1", deserialized.getRaceId());
    assertEquals(0.1, deserialized.getBrierScore(), 0.001);
  }
}
