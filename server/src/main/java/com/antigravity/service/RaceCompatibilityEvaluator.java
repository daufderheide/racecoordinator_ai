package com.antigravity.service;

import com.antigravity.models.HeatScoring;
import com.antigravity.models.OverallScoring;
import com.antigravity.models.Race;
import com.antigravity.models.RaceCompatibility;
import com.antigravity.models.RaceCompatibility.Status;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class RaceCompatibilityEvaluator {

  private static final Logger logger = LoggerFactory.getLogger(RaceCompatibilityEvaluator.class);
  private static final ObjectMapper objectMapper =
      new ObjectMapper()
          .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
          .configure(DeserializationFeature.READ_UNKNOWN_ENUM_VALUES_AS_NULL, true);

  public static final String CURRENT_VERSION = "1.2.0";
  public static final Set<String> DEFAULT_SUPPORTED_FEATURES =
      Collections.unmodifiableSet(
          new HashSet<>(Arrays.asList("step_up", "points_scoring", "points_overall")));

  public static final Set<String> KNOWN_RACE_FIELDS =
      Collections.unmodifiableSet(
          new HashSet<>(
              Arrays.asList(
                  "name",
                  "track_entity_id",
                  "trackEntityId",
                  "heat_rotation_type",
                  "heatRotationType",
                  "heat_scoring",
                  "heatScoring",
                  "race_scoring",
                  "overall_scoring",
                  "overallScoring",
                  "season_scoring",
                  "seasonScoring",
                  "points_scoring",
                  "pointsScoring",
                  "min_lap_time",
                  "minLapTime",
                  "fuel_options",
                  "fuelOptions",
                  "digital_fuel_options",
                  "digitalFuelOptions",
                  "team_options",
                  "teamOptions",
                  "auto_advance_time",
                  "autoAdvanceTime",
                  "auto_start_time",
                  "autoStartTime",
                  "auto_advance_warmup_time",
                  "autoAdvanceWarmupTime",
                  "auto_start_warmup_time",
                  "autoStartWarmupTime",
                  "drift_time",
                  "driftTime",
                  "start_time",
                  "startTime",
                  "restart_time",
                  "restartTime",
                  "start_randomizer",
                  "startRandomizer",
                  "start_delay",
                  "startDelay",
                  "restart_randomizer",
                  "restartRandomizer",
                  "restart_delay",
                  "restartDelay",
                  "solo_lane_index",
                  "soloLaneIndex",
                  "custom_rotation_sequence",
                  "customRotationSequence",
                  "custom_rotation_asset_id",
                  "customRotationAssetId",
                  "custom_rotation_asset_name",
                  "customRotationAssetName",
                  "custom_rotation_name",
                  "customRotationName",
                  "custom_rotations",
                  "customRotations",
                  "heat_times_through",
                  "heatTimesThrough",
                  "reverse_heats",
                  "reverseHeats",
                  "hot_start",
                  "hotStart",
                  "start_at_current",
                  "startAtCurrent",
                  "restart_on_false_start",
                  "restartOnFalseStart",
                  "start_behind_sensor",
                  "startBehindSensor",
                  "false_start_lap_penalty",
                  "falseStartLapPenalty",
                  "false_start_time_penalty",
                  "falseStartTimePenalty",
                  "group_options",
                  "groupOptions",
                  "practice",
                  "adjust_drift_laps",
                  "adjustDriftLaps",
                  "theme_id",
                  "themeId",
                  "step_up",
                  "stepUp",
                  "entity_id",
                  "entityId",
                  "_id",
                  "id",
                  "objectId",
                  "@id",
                  "_compat_meta",
                  "compatMeta",
                  "compatibility")));

  private final String currentVersion;
  private final Set<String> supportedFeatures;
  private final Set<String> knownFields;

  public RaceCompatibilityEvaluator() {
    this(CURRENT_VERSION, DEFAULT_SUPPORTED_FEATURES, KNOWN_RACE_FIELDS);
  }

  public RaceCompatibilityEvaluator(
      String currentVersion, Set<String> supportedFeatures, Set<String> knownFields) {
    this.currentVersion = currentVersion != null ? currentVersion : CURRENT_VERSION;
    this.supportedFeatures =
        supportedFeatures != null ? supportedFeatures : DEFAULT_SUPPORTED_FEATURES;
    this.knownFields = knownFields != null ? knownFields : KNOWN_RACE_FIELDS;
  }

  public boolean isFeatureSupported(String featureId) {
    if (featureId == null || featureId.isEmpty()) {
      return false;
    }
    return supportedFeatures.contains(featureId);
  }

  public String getCurrentVersion() {
    return currentVersion;
  }

  public Set<String> getSupportedFeatures() {
    return supportedFeatures;
  }

  public Set<String> getKnownFields() {
    return knownFields;
  }

  public RaceCompatibility evaluate(Race race, String rawJson) {
    if (rawJson == null || rawJson.trim().isEmpty()) {
      return RaceCompatibility.compatible();
    }

    try {
      JsonNode root = objectMapper.readTree(rawJson);
      if (!root.isObject()) {
        return RaceCompatibility.compatible();
      }

      List<String> blockingFeatures = new ArrayList<>();
      List<String> ignoredFeatures = new ArrayList<>();

      // 1. Check explicit _compat_meta metadata if present
      if (root.has("_compat_meta")) {
        JsonNode meta = root.get("_compat_meta");
        if (meta.has("features") && meta.get("features").isArray()) {
          for (JsonNode f : meta.get("features")) {
            String featureId = f.has("id") ? f.get("id").asText() : "";
            if (isFeatureSupported(featureId)) {
              continue;
            }
            String crit = f.has("criticality") ? f.get("criticality").asText() : "ADVISORY";
            String desc =
                f.has("description")
                    ? f.get("description").asText()
                    : (!featureId.isEmpty() ? featureId : "Unknown feature");
            if ("REQUIRED".equalsIgnoreCase(crit)) {
              blockingFeatures.add(desc);
            } else {
              ignoredFeatures.add(desc);
            }
          }
        }
      }

      // 2. Check for unmapped top-level fields
      Iterator<String> fieldNames = root.fieldNames();
      while (fieldNames.hasNext()) {
        String field = fieldNames.next();
        if ("_compat_meta".equals(field) || "compatMeta".equals(field)) {
          continue;
        }
        if (!knownFields.contains(field)) {
          // Unrecognized field
          if (field.toLowerCase().contains("scoring") || field.toLowerCase().contains("points")) {
            if (!blockingFeatures.contains(field)) {
              blockingFeatures.add("Unsupported scoring feature: " + field);
            }
          } else {
            if (!ignoredFeatures.contains(field)) {
              ignoredFeatures.add(field);
            }
          }
        }
      }

      // 3. Check for unknown enum values in core scoring
      checkScoringEnums(race, root, blockingFeatures);

      if (!blockingFeatures.isEmpty()) {
        return new RaceCompatibility(
            Status.INCOMPATIBLE, false, true, ignoredFeatures, blockingFeatures);
      } else if (!ignoredFeatures.isEmpty()) {
        return new RaceCompatibility(
            Status.DEGRADED, true, false, ignoredFeatures, blockingFeatures);
      } else {
        return RaceCompatibility.compatible();
      }

    } catch (Exception e) {
      logger.error("Error evaluating race compatibility", e);
      return RaceCompatibility.compatible();
    }
  }

  private void checkScoringEnums(Race race, JsonNode root, List<String> blockingFeatures) {
    if (race == null) {
      return;
    }

    // Check HeatScoring enums
    if (root.has("heat_scoring") || root.has("heatScoring")) {
      JsonNode hsNode =
          root.has("heat_scoring") ? root.get("heat_scoring") : root.get("heatScoring");
      if (hsNode.has("finish_method") || hsNode.has("finishMethod")) {
        HeatScoring hs = race.getHeatScoring();
        if (hs == null || hs.getFinishMethod() == null) {
          String rawVal =
              hsNode.has("finish_method")
                  ? hsNode.get("finish_method").asText()
                  : hsNode.get("finishMethod").asText();
          blockingFeatures.add("Unsupported finish method: " + rawVal);
        }
      }
      if (hsNode.has("heat_ranking") || hsNode.has("heatRanking")) {
        HeatScoring hs = race.getHeatScoring();
        if (hs == null || hs.getHeatRanking() == null) {
          String rawVal =
              hsNode.has("heat_ranking")
                  ? hsNode.get("heat_ranking").asText()
                  : hsNode.get("heatRanking").asText();
          blockingFeatures.add("Unsupported heat ranking method: " + rawVal);
        }
      }
    }

    // Check OverallScoring enums
    if (root.has("overall_scoring") || root.has("overallScoring")) {
      JsonNode osNode =
          root.has("overall_scoring") ? root.get("overall_scoring") : root.get("overallScoring");
      if (osNode.has("ranking_method") || osNode.has("rankingMethod")) {
        OverallScoring os = race.getOverallScoring();
        if (os == null || os.getRankingMethod() == null) {
          String rawVal =
              osNode.has("ranking_method")
                  ? osNode.get("ranking_method").asText()
                  : osNode.get("rankingMethod").asText();
          blockingFeatures.add("Unsupported overall ranking method: " + rawVal);
        }
      }
    }
  }

  /** Applies metadata fallbacks to produce a clean, compatible race JSON for copying. */
  public String createCompatibleCopyJson(String rawJson, String newName, String newEntityId) {
    try {
      JsonNode tree = objectMapper.readTree(rawJson);
      if (!tree.isObject()) {
        return rawJson;
      }
      ObjectNode target = (ObjectNode) tree.deepCopy();

      // Set new name and entity_id
      target.put("name", newName);
      target.put("entity_id", newEntityId);
      target.remove("_id");
      target.remove("id");
      if (!target.has("@id")) {
        target.put("@id", 1);
      }

      // 1. Process _compat_meta fallbacks
      if (target.has("_compat_meta")) {
        JsonNode meta = target.get("_compat_meta");
        if (meta.has("features") && meta.get("features").isArray()) {
          for (JsonNode f : meta.get("features")) {
            if (f.has("fallback")) {
              JsonNode fallback = f.get("fallback");
              String targetPath =
                  fallback.has("target_path") ? fallback.get("target_path").asText() : null;
              if (targetPath != null && fallback.has("value")) {
                applyFallbackValue(target, targetPath, fallback.get("value"));
              }
            }
          }
        }
        target.remove("_compat_meta");
      }

      // If overall_scoring was fallen back to a non-POINTS ranking, also remove points_scoring
      if (target.has("overall_scoring")
          && target.get("overall_scoring").has("ranking_method")
          && !"POINTS"
              .equalsIgnoreCase(target.get("overall_scoring").get("ranking_method").asText())) {
        target.remove("points_scoring");
        target.remove("pointsScoring");
      }

      // 2. Remove unrecognized blocking top-level fields (like points_scoring)
      List<String> toRemove = new ArrayList<>();
      Iterator<String> fieldNames = target.fieldNames();
      while (fieldNames.hasNext()) {
        String field = fieldNames.next();
        if (!knownFields.contains(field)) {
          if (field.toLowerCase().contains("scoring") || field.toLowerCase().contains("points")) {
            toRemove.add(field);
          }
        }
      }
      for (String field : toRemove) {
        target.remove(field);
      }

      // 3. Fall back any invalid/unrecognized scoring enums
      sanitizeScoringEnums(target);

      return objectMapper.writeValueAsString(target);
    } catch (Exception e) {
      logger.error("Error creating compatible copy JSON", e);
      return rawJson;
    }
  }

  private void applyFallbackValue(ObjectNode root, String path, JsonNode value) {
    String[] parts = path.split("\\.");
    ObjectNode current = root;
    for (int i = 0; i < parts.length - 1; i++) {
      if (current.has(parts[i]) && current.get(parts[i]).isObject()) {
        current = (ObjectNode) current.get(parts[i]);
      } else {
        ObjectNode next = objectMapper.createObjectNode();
        current.set(parts[i], next);
        current = next;
      }
    }
    current.set(parts[parts.length - 1], value);
  }

  private void sanitizeScoringEnums(ObjectNode root) {
    // Check heat_scoring
    JsonNode hsNode = root.get("heat_scoring");
    if (hsNode != null && hsNode.isObject()) {
      ObjectNode hs = (ObjectNode) hsNode;
      if (hs.has("finish_method") && !isValidFinishMethod(hs.get("finish_method").asText())) {
        hs.put("finish_method", "Lap");
      }
      if (hs.has("finishMethod") && !isValidFinishMethod(hs.get("finishMethod").asText())) {
        hs.put("finishMethod", "Lap");
      }
      if (hs.has("heat_ranking") && !isValidHeatRanking(hs.get("heat_ranking").asText())) {
        hs.put("heat_ranking", "LAP_COUNT");
      }
      if (hs.has("heatRanking") && !isValidHeatRanking(hs.get("heatRanking").asText())) {
        hs.put("heatRanking", "LAP_COUNT");
      }
    }

    // Check overall_scoring
    JsonNode osNode = root.get("overall_scoring");
    if (osNode != null && osNode.isObject()) {
      ObjectNode os = (ObjectNode) osNode;
      if (os.has("ranking_method") && !isValidRankingMethod(os.get("ranking_method").asText())) {
        os.put("ranking_method", "LAP_COUNT");
      }
      if (os.has("rankingMethod") && !isValidRankingMethod(os.get("rankingMethod").asText())) {
        os.put("rankingMethod", "LAP_COUNT");
      }
    }
  }

  private boolean isValidFinishMethod(String val) {
    for (HeatScoring.FinishMethod m : HeatScoring.FinishMethod.values()) {
      if (m.name().equalsIgnoreCase(val)) {
        return true;
      }
    }
    return false;
  }

  private boolean isValidHeatRanking(String val) {
    for (HeatScoring.HeatRanking r : HeatScoring.HeatRanking.values()) {
      if (r.name().equalsIgnoreCase(val)) {
        return true;
      }
    }
    return false;
  }

  private boolean isValidRankingMethod(String val) {
    for (OverallScoring.OverallRanking m : OverallScoring.OverallRanking.values()) {
      if (m.name().equalsIgnoreCase(val)) {
        return true;
      }
    }
    return false;
  }
}
