package com.antigravity.service;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import com.antigravity.models.OverallScoring;
import com.antigravity.models.Race;
import com.antigravity.models.RaceCompatibility;
import com.antigravity.models.RaceCompatibility.Status;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Before;
import org.junit.Test;

public class RaceCompatibilityEvaluatorTest {

  private RaceCompatibilityEvaluator evaluator;
  private ObjectMapper objectMapper;

  @Before
  public void setUp() {
    evaluator = new RaceCompatibilityEvaluator();
    objectMapper = new ObjectMapper();
  }

  @Test
  public void testNormalRaceIsCompatible() throws Exception {
    Race race = new Race.Builder().withName("Grand Prix").withEntityId("1").build();
    String rawJson = objectMapper.writeValueAsString(race);

    RaceCompatibility compat = evaluator.evaluate(race, rawJson);
    assertEquals(Status.COMPATIBLE, compat.getStatus());
    assertTrue(compat.isCanRun());
    assertFalse(compat.isReadOnly());
    assertTrue(compat.getIgnoredFeatures().isEmpty());
    assertTrue(compat.getBlockingFeatures().isEmpty());
  }

  @Test
  public void testAdvisoryFeatureMetadataProducesDegraded() {
    Race race = new Race.Builder().withName("Grand Prix").withEntityId("1").build();
    String rawJson =
        "{\"entity_id\":\"1\",\"name\":\"Grand Prix\","
            + "\"_compat_meta\":{\"features\":[{\"id\":\"step_up\",\"criticality\":\"ADVISORY\",\"description\":\"Step-Up ladder progression\"}]}}";

    RaceCompatibility compat = evaluator.evaluate(race, rawJson);
    assertEquals(Status.DEGRADED, compat.getStatus());
    assertTrue(compat.isCanRun());
    assertFalse(compat.isReadOnly());
    assertEquals(1, compat.getIgnoredFeatures().size());
    assertEquals("Step-Up ladder progression", compat.getIgnoredFeatures().get(0));
    assertTrue(compat.getBlockingFeatures().isEmpty());
  }

  @Test
  public void testRequiredFeatureMetadataProducesIncompatible() {
    Race race = new Race.Builder().withName("Grand Prix").withEntityId("1").build();
    String rawJson =
        "{\"entity_id\":\"1\",\"name\":\"Grand Prix\","
            + "\"_compat_meta\":{\"features\":[{\"id\":\"points_scoring\",\"criticality\":\"REQUIRED\",\"description\":\"Points Scoring Engine\"}]}}";

    RaceCompatibility compat = evaluator.evaluate(race, rawJson);
    assertEquals(Status.INCOMPATIBLE, compat.getStatus());
    assertFalse(compat.isCanRun());
    assertTrue(compat.isReadOnly());
    assertEquals(1, compat.getBlockingFeatures().size());
    assertEquals("Points Scoring Engine", compat.getBlockingFeatures().get(0));
  }

  @Test
  public void testUnmappedFieldsWithoutMetadata() {
    Race race = new Race.Builder().withName("Grand Prix").withEntityId("1").build();

    // Advisory unmapped field (e.g. step_up)
    String rawJsonStepUp = "{\"entity_id\":\"1\",\"name\":\"Grand Prix\",\"step_up\":2}";
    RaceCompatibility compat1 = evaluator.evaluate(race, rawJsonStepUp);
    assertEquals(Status.DEGRADED, compat1.getStatus());
    assertTrue(compat1.isCanRun());
    assertTrue(compat1.getIgnoredFeatures().contains("step_up"));

    // Critical unmapped field (e.g. points_scoring)
    String rawJsonPoints =
        "{\"entity_id\":\"1\",\"name\":\"Grand Prix\",\"points_scoring\":{\"enabled\":true}}";
    RaceCompatibility compat2 = evaluator.evaluate(race, rawJsonPoints);
    assertEquals(Status.INCOMPATIBLE, compat2.getStatus());
    assertFalse(compat2.isCanRun());
    assertTrue(compat2.isReadOnly());
  }

  @Test
  public void testUnknownEnumInCoreScoringProducesIncompatible() {
    // When Jackson deserializes an unknown ranking_method enum as null
    OverallScoring osWithNullEnum =
        new OverallScoring(0, null, OverallScoring.OverallRankingTiebreaker.FASTEST_LAP_TIME);
    Race race =
        new Race.Builder()
            .withName("Championship")
            .withEntityId("1")
            .withOverallScoring(osWithNullEnum)
            .build();

    String rawJson =
        "{\"entity_id\":\"1\",\"name\":\"Championship\",\"overall_scoring\":{\"ranking_method\":\"FUTURE_QUANTUM_POINTS\"}}";

    RaceCompatibility compat = evaluator.evaluate(race, rawJson);
    assertEquals(Status.INCOMPATIBLE, compat.getStatus());
    assertFalse(compat.isCanRun());
    assertTrue(compat.isReadOnly());
    assertTrue(compat.getBlockingFeatures().get(0).contains("FUTURE_QUANTUM_POINTS"));
  }

  @Test
  public void testCreateCompatibleCopyJsonWithFallbacks() throws Exception {
    String rawJson =
        "{\"entity_id\":\"orig_1\",\"name\":\"Points Race\","
            + "\"points_scoring\":{\"enabled\":true},"
            + "\"overall_scoring\":{\"ranking_method\":\"POINTS\"},"
            + "\"_compat_meta\":{\"features\":["
            + "{\"id\":\"points_overall\",\"criticality\":\"REQUIRED\",\"fallback\":{\"target_path\":\"overall_scoring.ranking_method\",\"value\":\"LAP_COUNT\"}}"
            + "]}}";

    String copyJson = evaluator.createCompatibleCopyJson(rawJson, "Points Race (Copy)", "copy_2");
    assertNotNull(copyJson);
    assertFalse(copyJson.contains("_compat_meta"));
    assertFalse(copyJson.contains("points_scoring"));

    // Verify fallback value applied
    assertTrue(copyJson.contains("\"ranking_method\":\"LAP_COUNT\""));
    assertTrue(copyJson.contains("\"name\":\"Points Race (Copy)\""));
    assertTrue(copyJson.contains("\"entity_id\":\"copy_2\""));

    // Evaluate compatibility of the copy
    Race copyRace = objectMapper.readValue(copyJson, Race.class);
    RaceCompatibility copyCompat = evaluator.evaluate(copyRace, copyJson);
    assertEquals(Status.COMPATIBLE, copyCompat.getStatus());
    assertTrue(copyCompat.isCanRun());
    assertFalse(copyCompat.isReadOnly());
  }
}
