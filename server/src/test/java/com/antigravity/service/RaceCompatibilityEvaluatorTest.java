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
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
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
  public void testStepUpRaceIsCompatibleInV120_AndAttachesAdvisoryMetadata() throws Exception {
    Race race = new Race.Builder().withName("Grand Prix").withStepUp(2).withEntityId("1").build();
    String rawJson = objectMapper.writeValueAsString(race);

    assertTrue(rawJson.contains("_compat_meta"));
    assertTrue(rawJson.contains("step_up"));
    assertTrue(rawJson.contains("ADVISORY"));

    RaceCompatibility compat = evaluator.evaluate(race, rawJson);
    assertEquals(Status.COMPATIBLE, compat.getStatus());
    assertTrue(compat.isCanRun());
    assertFalse(compat.isReadOnly());
  }

  @Test
  public void testPointsScoringRaceIsCompatibleInV120_AndAttachesRequiredMetadataWithFallback()
      throws Exception {
    Race race =
        new Race.Builder()
            .withName("Points GP")
            .withEntityId("1")
            .withOverallScoring(
                new OverallScoring(
                    0,
                    OverallScoring.OverallRanking.POINTS,
                    OverallScoring.OverallRankingTiebreaker.FASTEST_LAP_TIME))
            .build();
    String rawJson = objectMapper.writeValueAsString(race);

    assertTrue(rawJson.contains("_compat_meta"));
    assertTrue(rawJson.contains("points_overall"));
    assertTrue(rawJson.contains("REQUIRED"));
    assertTrue(rawJson.contains("LAP_COUNT"));

    RaceCompatibility compat = evaluator.evaluate(race, rawJson);
    assertEquals(Status.COMPATIBLE, compat.getStatus());
    assertTrue(compat.isCanRun());
    assertFalse(compat.isReadOnly());
  }

  @Test
  public void testDowngradeToV110Evaluator_DegradesStepUp_AndBlocksPointsScoring()
      throws Exception {
    // Simulate v1.1.0 receiver which has no step_up/points_scoring support
    Set<String> v110KnownFields = new HashSet<>(RaceCompatibilityEvaluator.KNOWN_RACE_FIELDS);
    v110KnownFields.remove("step_up");
    v110KnownFields.remove("stepUp");
    v110KnownFields.remove("points_scoring");
    v110KnownFields.remove("pointsScoring");
    RaceCompatibilityEvaluator v110Evaluator =
        new RaceCompatibilityEvaluator("1.1.0", Collections.emptySet(), v110KnownFields);

    Race stepUpRace =
        new Race.Builder().withName("StepUp GP").withStepUp(2).withEntityId("1").build();
    String stepUpJson = objectMapper.writeValueAsString(stepUpRace);
    RaceCompatibility stepUpCompat = v110Evaluator.evaluate(stepUpRace, stepUpJson);
    assertEquals(Status.DEGRADED, stepUpCompat.getStatus());
    assertTrue(stepUpCompat.isCanRun());
    assertFalse(stepUpCompat.isReadOnly());
    assertTrue(
        stepUpCompat.getIgnoredFeatures().stream()
            .anyMatch(f -> f.contains("step_up") || f.contains("Step-Up")));

    Race pointsRace =
        new Race.Builder()
            .withName("Points GP")
            .withEntityId("2")
            .withOverallScoring(
                new OverallScoring(
                    0,
                    OverallScoring.OverallRanking.POINTS,
                    OverallScoring.OverallRankingTiebreaker.FASTEST_LAP_TIME))
            .build();
    String pointsJson = objectMapper.writeValueAsString(pointsRace);
    RaceCompatibility pointsCompat = v110Evaluator.evaluate(pointsRace, pointsJson);
    assertEquals(Status.INCOMPATIBLE, pointsCompat.getStatus());
    assertFalse(pointsCompat.isCanRun());
    assertTrue(pointsCompat.isReadOnly());
    assertTrue(
        pointsCompat.getBlockingFeatures().stream()
            .anyMatch(f -> f.contains("points_overall") || f.contains("Points")));
  }

  @Test
  public void testAdvisoryFutureFeatureProducesDegraded() {
    Race race = new Race.Builder().withName("Grand Prix").withEntityId("1").build();
    String rawJson =
        "{\"entity_id\":\"1\",\"name\":\"Grand Prix\","
            + "\"_compat_meta\":{\"features\":[{\"id\":\"future_weather\",\"criticality\":\"ADVISORY\",\"description\":\"Weather simulation\"}]}}";

    RaceCompatibility compat = evaluator.evaluate(race, rawJson);
    assertEquals(Status.DEGRADED, compat.getStatus());
    assertTrue(compat.isCanRun());
    assertFalse(compat.isReadOnly());
    assertEquals(1, compat.getIgnoredFeatures().size());
    assertEquals("Weather simulation", compat.getIgnoredFeatures().get(0));
    assertTrue(compat.getBlockingFeatures().isEmpty());
  }

  @Test
  public void testRequiredFutureFeatureProducesIncompatible() {
    Race race = new Race.Builder().withName("Grand Prix").withEntityId("1").build();
    String rawJson =
        "{\"entity_id\":\"1\",\"name\":\"Grand Prix\","
            + "\"_compat_meta\":{\"features\":[{\"id\":\"future_ai_scoring\",\"criticality\":\"REQUIRED\",\"description\":\"AI Scoring Engine\"}]}}";

    RaceCompatibility compat = evaluator.evaluate(race, rawJson);
    assertEquals(Status.INCOMPATIBLE, compat.getStatus());
    assertFalse(compat.isCanRun());
    assertTrue(compat.isReadOnly());
    assertEquals(1, compat.getBlockingFeatures().size());
    assertEquals("AI Scoring Engine", compat.getBlockingFeatures().get(0));
  }

  @Test
  public void testUnmappedFieldsWithoutMetadata() {
    Race race = new Race.Builder().withName("Grand Prix").withEntityId("1").build();

    // Advisory unmapped field from future version
    String rawJsonFuture = "{\"entity_id\":\"1\",\"name\":\"Grand Prix\",\"future_flag\":true}";
    RaceCompatibility compat1 = evaluator.evaluate(race, rawJsonFuture);
    assertEquals(Status.DEGRADED, compat1.getStatus());
    assertTrue(compat1.isCanRun());
    assertTrue(compat1.getIgnoredFeatures().contains("future_flag"));

    // Critical unmapped scoring field from future version
    String rawJsonScoring =
        "{\"entity_id\":\"1\",\"name\":\"Grand Prix\",\"future_quantum_scoring\":{\"enabled\":true}}";
    RaceCompatibility compat2 = evaluator.evaluate(race, rawJsonScoring);
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
