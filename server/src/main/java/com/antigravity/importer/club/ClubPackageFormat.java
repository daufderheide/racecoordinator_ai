package com.antigravity.importer.club;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.node.TextNode;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * The club package: a version independent JSON file with one championship (season), its race nights
 * and the drivers, tracks and race classes they use. It is exported on one PC and imported on
 * another, where it is merged into the local database.
 * https://github.com/daufderheide/racecoordinator_ai/issues/972
 *
 * <p>Local ids differ on every PC, so inside the package every reference to a driver, track, race
 * class or the season is a token such as {@code @club:driver:d1}. The importer replaces each token
 * with the id the item has on the receiving PC.
 */
public final class ClubPackageFormat {

  public static final String FORMAT = "rc-ai-club-package";
  public static final int FORMAT_VERSION = 1;

  /** Hidden field stamped on drivers, tracks, race classes and seasons to match them next time. */
  public static final String CLUB_ID = "club_id";

  /** Championship name stored on the season after the first export or import. */
  public static final String CLUB_NAME = "club_name";

  public static final String TOKEN_PREFIX = "@club:";
  public static final String SEASON_TOKEN = TOKEN_PREFIX + "season";

  /** Track hardware and interface settings belong to each PC and are never exported. */
  static final Set<String> TRACK_HARDWARE_FIELDS =
      new HashSet<>(
          Arrays.asList(
              "arduino_configs",
              "arduinoConfigs",
              "trackmate_configs",
              "trackmateConfigs",
              "phidget_configs",
              "phidgetConfigs",
              "bart_configs",
              "bartConfigs",
              "ds_configs",
              "dsConfigs"));

  /** Driver fields that are exported; avatars, audio and the rest stay on each PC. */
  static final Set<String> DRIVER_KEEP_FIELDS =
      new HashSet<>(
          Arrays.asList("name", "nickname", "entity_id", "_id", "@id", "objectId", "empty"));

  static final ObjectMapper MAPPER =
      new ObjectMapper()
          .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
          .configure(DeserializationFeature.READ_UNKNOWN_ENUM_VALUES_AS_NULL, true);

  private ClubPackageFormat() {}

  public static String driverToken(String ref) {
    return TOKEN_PREFIX + "driver:" + ref;
  }

  public static String trackToken(String ref) {
    return TOKEN_PREFIX + "track:" + ref;
  }

  public static String raceToken(String ref) {
    return TOKEN_PREFIX + "race:" + ref;
  }

  static String text(JsonNode node, String field) {
    if (node == null) {
      return "";
    }
    JsonNode v = node.get(field);
    return v != null && !v.isNull() ? v.asText("") : "";
  }

  static String lower(String s) {
    return s == null ? "" : s.trim().toLowerCase(Locale.ROOT);
  }

  /** A driver object embedded in a race history record: it has a name and a nickname. */
  static boolean looksLikeDriver(JsonNode node) {
    return node != null
        && node.isObject()
        && node.has("nickname")
        && node.has("name")
        && node.has("entity_id");
  }

  /** Removes the track hardware and interface settings from a track object. */
  static void stripTrackHardware(ObjectNode track) {
    track.remove(TRACK_HARDWARE_FIELDS);
  }

  /** Keeps only the exported driver fields (no avatar or audio). */
  static void stripDriverMedia(ObjectNode driver) {
    List<String> remove = new java.util.ArrayList<>();
    Iterator<String> names = driver.fieldNames();
    while (names.hasNext()) {
      String n = names.next();
      if (!DRIVER_KEEP_FIELDS.contains(n)) {
        remove.add(n);
      }
    }
    driver.remove(remove);
  }

  /**
   * Replaces every string in the tree that is a token found in {@code tokens} with its value, in
   * place. Strings that aren't tokens are left alone.
   */
  public static void replaceTokens(JsonNode node, Map<String, String> tokens) {
    if (node == null) {
      return;
    }
    if (node.isObject()) {
      ObjectNode obj = (ObjectNode) node;
      Iterator<Map.Entry<String, JsonNode>> fields = obj.fields();
      List<String> keys = new java.util.ArrayList<>();
      while (fields.hasNext()) {
        keys.add(fields.next().getKey());
      }
      for (String key : keys) {
        JsonNode child = obj.get(key);
        if (child != null && child.isTextual() && tokens.containsKey(child.asText())) {
          obj.set(key, TextNode.valueOf(tokens.get(child.asText())));
        } else {
          replaceTokens(child, tokens);
        }
      }
    } else if (node.isArray()) {
      ArrayNode arr = (ArrayNode) node;
      for (int i = 0; i < arr.size(); i++) {
        JsonNode child = arr.get(i);
        if (child != null && child.isTextual() && tokens.containsKey(child.asText())) {
          arr.set(i, TextNode.valueOf(tokens.get(child.asText())));
        } else {
          replaceTokens(child, tokens);
        }
      }
    }
  }
}
