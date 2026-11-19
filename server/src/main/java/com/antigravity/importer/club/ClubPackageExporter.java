package com.antigravity.importer.club;

import com.antigravity.App;
import com.antigravity.context.DatabaseContext;
import com.antigravity.models.Driver;
import com.antigravity.models.DriverLabel;
import com.antigravity.models.RaceHistoryRecord;
import com.antigravity.models.Season;
import com.antigravity.models.Track;
import com.antigravity.repository.SqliteRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.node.TextNode;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Exports one season (championship) as a club package: its race nights with the race history (heats
 * and laps), plus the drivers, tracks and race classes they use, scrubbed of everything that ties
 * the data to this PC (local ids, track hardware, avatars, audio).
 * https://github.com/daufderheide/racecoordinator_ai/issues/972
 */
public class ClubPackageExporter {

  private static final Logger logger = LoggerFactory.getLogger(ClubPackageExporter.class);

  private final SqliteRepository<Season> seasons;
  private final SqliteRepository<Driver> drivers;
  private final SqliteRepository<DriverLabel> labels;
  private final SqliteRepository<Track> tracks;
  private final SqliteRepository<com.antigravity.models.Race> races; // fqn-collision
  private final SqliteRepository<RaceHistoryRecord> history;

  /** Source id -> package ref, in the order first seen. */
  private final Map<String, String> driverRefs = new LinkedHashMap<>();

  private final Map<String, String> trackRefs = new LinkedHashMap<>();
  private final Map<String, String> raceRefs = new LinkedHashMap<>();

  /** Fallback names for drivers that are no longer in the database. */
  private final Map<String, ObjectNode> embeddedDrivers = new LinkedHashMap<>();

  private final Map<String, ObjectNode> embeddedTracks = new LinkedHashMap<>();
  private final Map<String, ObjectNode> embeddedRaces = new LinkedHashMap<>();

  public ClubPackageExporter(DatabaseContext context) {
    this.seasons = new SqliteRepository<>(context, "seasons", Season.class);
    this.drivers = new SqliteRepository<>(context, "drivers", Driver.class);
    this.labels = new SqliteRepository<>(context, "driver_labels", DriverLabel.class);
    this.tracks = new SqliteRepository<>(context, "tracks", Track.class);
    this.races =
        new SqliteRepository<>(
            context, "races", com.antigravity.models.Race.class); // fqn-collision
    this.history = new SqliteRepository<>(context, "race_history", RaceHistoryRecord.class);
  }

  /**
   * Builds the package for a season.
   *
   * @param seasonId the season to export
   * @param championshipName the championship name the user gave; the season name if blank
   */
  public ObjectNode export(String seasonId, String championshipName) throws Exception {
    String seasonJson = seasons.findRawJsonByEntityId(seasonId);
    if (seasonJson == null) {
      throw new IllegalArgumentException("CRE_ERR_SEASON_NOT_FOUND");
    }
    ObjectNode season = (ObjectNode) ClubPackageFormat.MAPPER.readTree(seasonJson);
    String name =
        championshipName != null && !championshipName.trim().isEmpty()
            ? championshipName.trim()
            : ClubPackageFormat.text(season, ClubPackageFormat.CLUB_NAME).isEmpty()
                ? ClubPackageFormat.text(season, "name")
                : ClubPackageFormat.text(season, ClubPackageFormat.CLUB_NAME);
    String clubId = ClubPackageFormat.text(season, ClubPackageFormat.CLUB_ID);
    if (clubId.isEmpty()) {
      clubId = UUID.randomUUID().toString();
    }
    season.put(ClubPackageFormat.CLUB_ID, clubId);
    season.put(ClubPackageFormat.CLUB_NAME, name);
    seasons.saveRawJson(seasonId, ClubPackageFormat.MAPPER.writeValueAsString(season));

    ArrayNode nights = exportRaceNights(season);

    ObjectNode pkg = ClubPackageFormat.MAPPER.createObjectNode();
    pkg.put("format", ClubPackageFormat.FORMAT);
    pkg.put("format_version", ClubPackageFormat.FORMAT_VERSION);
    pkg.put("app_version", App.SERVER_VERSION);
    pkg.put("exported_at", System.currentTimeMillis());
    ObjectNode championship = pkg.putObject("championship");
    championship.put("club_id", clubId);
    championship.put("name", name);
    championship.put("drops", season.path("drops").asInt(0));
    pkg.set("drivers", exportDrivers());
    pkg.set("tracks", exportTracks());
    pkg.set("race_classes", exportRaceClasses());
    pkg.set("race_nights", nights);
    logger.info(
        "Club package '{}': {} race nights, {} drivers, {} tracks, {} race classes",
        name,
        nights.size(),
        driverRefs.size(),
        trackRefs.size(),
        raceRefs.size());
    return pkg;
  }

  private ArrayNode exportRaceNights(ObjectNode season) throws Exception {
    ArrayNode out = ClubPackageFormat.MAPPER.createArrayNode();
    for (JsonNode rec : season.path("races")) {
      if (rec.path("is_demo").asBoolean(false)) {
        continue; // demo races never leave the PC
      }
      String historyId = ClubPackageFormat.text(rec, "history_record_id");
      ObjectNode historyNode = null;
      if (!historyId.isEmpty()) {
        String raw = history.findRawJsonByEntityId(historyId);
        if (raw != null) {
          historyNode = (ObjectNode) ClubPackageFormat.MAPPER.readTree(raw);
        }
      }
      ObjectNode night = out.addObject();
      long timestamp = rec.path("timestamp").asLong(0);
      String raceName = ClubPackageFormat.text(rec, "race_name");
      night.put("key", historyId.isEmpty() ? "ts:" + timestamp + ":" + raceName : historyId);
      night.put("history_id", historyId);
      night.put("race_name", raceName);
      night.put("timestamp", timestamp);
      ArrayNode results = night.putArray("driver_results");
      for (JsonNode r : rec.path("driver_results")) {
        ObjectNode copy = r.deepCopy();
        String driverId = ClubPackageFormat.text(r, "driver_id");
        if (!driverId.isEmpty()) {
          copy.put("driver_id", ClubPackageFormat.driverToken(driverRef(driverId)));
          if (!embeddedDrivers.containsKey(driverId)) {
            ObjectNode d = ClubPackageFormat.MAPPER.createObjectNode();
            d.put("name", ClubPackageFormat.text(r, "driver_name"));
            d.put("nickname", "");
            embeddedDrivers.put(driverId, d);
          }
        }
        results.add(copy);
      }
      if (historyNode != null) {
        String raceId = ClubPackageFormat.text(historyNode, "original_entity_id");
        if (!raceId.isEmpty()) {
          night.put("race_class_ref", raceRef(raceId));
          if (historyNode.path("model").isObject()) {
            embeddedRaces.putIfAbsent(raceId, (ObjectNode) historyNode.get("model").deepCopy());
          }
        }
        night.set("history", scrubHistory(historyNode));
      } else {
        night.putNull("history");
      }
    }
    return out;
  }

  private String driverRef(String id) {
    return driverRefs.computeIfAbsent(id, k -> "d" + (driverRefs.size() + 1));
  }

  private String trackRef(String id) {
    return trackRefs.computeIfAbsent(id, k -> "t" + (trackRefs.size() + 1));
  }

  private String raceRef(String id) {
    return raceRefs.computeIfAbsent(id, k -> "r" + (raceRefs.size() + 1));
  }

  /**
   * A history record ready for another PC: local ids become tokens, track hardware and driver
   * avatars/audio are removed. Its UUID stays, so a race night is recognised everywhere.
   */
  ObjectNode scrubHistory(ObjectNode src) {
    ObjectNode h = src.deepCopy();
    h.put("is_demo", false);
    h.put("season_entity_id", ClubPackageFormat.SEASON_TOKEN);
    String raceId = ClubPackageFormat.text(h, "original_entity_id");
    if (!raceId.isEmpty()) {
      h.put("original_entity_id", ClubPackageFormat.raceToken(raceRef(raceId)));
    }
    if (h.path("model").isObject()) {
      scrubRaceIds((ObjectNode) h.get("model"));
    }
    if (h.path("track").isObject()) {
      ObjectNode track = (ObjectNode) h.get("track");
      String trackId = ClubPackageFormat.text(track, "entity_id");
      if (!trackId.isEmpty()) {
        embeddedTracks.putIfAbsent(trackId, track.deepCopy());
        String token = ClubPackageFormat.trackToken(trackRef(trackId));
        track.put("entity_id", token);
        track.put("_id", token);
      }
      ClubPackageFormat.stripTrackHardware(track);
    }
    collectDrivers(h); // register every driver first, so id fields seen earlier are mapped too
    scrubDrivers(h);
    return h;
  }

  private void collectDrivers(JsonNode node) {
    if (node == null) {
      return;
    }
    if (ClubPackageFormat.looksLikeDriver(node)) {
      String id = ClubPackageFormat.text(node, "entity_id");
      if (!id.isEmpty() && !"EMPTY_LANE".equals(id) && !id.startsWith("STEP_UP_")) {
        driverRef(id);
        embeddedDrivers.putIfAbsent(id, (ObjectNode) node.deepCopy());
      }
      return;
    }
    for (JsonNode child : node) {
      collectDrivers(child);
    }
  }

  /** Replaces race class and track ids in an embedded race (class) model with tokens. */
  private void scrubRaceIds(ObjectNode race) {
    String id = ClubPackageFormat.text(race, "entity_id");
    if (!id.isEmpty()) {
      String token = ClubPackageFormat.raceToken(raceRef(id));
      race.put("entity_id", token);
      race.put("_id", token);
    }
    String trackId = ClubPackageFormat.text(race, "track_entity_id");
    if (!trackId.isEmpty()) {
      race.put("track_entity_id", ClubPackageFormat.trackToken(trackRef(trackId)));
    }
    race.remove("compatibility");
  }

  /** Walks the tree: driver objects lose their media and get tokens; driver id fields too. */
  private void scrubDrivers(JsonNode node) {
    if (node == null) {
      return;
    }
    if (node.isObject()) {
      ObjectNode obj = (ObjectNode) node;
      if (ClubPackageFormat.looksLikeDriver(obj)) {
        String id = ClubPackageFormat.text(obj, "entity_id");
        if (!id.isEmpty() && !"EMPTY_LANE".equals(id) && !id.startsWith("STEP_UP_")) {
          embeddedDrivers.putIfAbsent(id, obj.deepCopy());
          String token = ClubPackageFormat.driverToken(driverRef(id));
          obj.put("entity_id", token);
          if (id.equals(ClubPackageFormat.text(obj, "_id"))) {
            obj.put("_id", token);
          }
        }
        ClubPackageFormat.stripDriverMedia(obj);
        return;
      }
      List<String> keys = new ArrayList<>();
      Iterator<String> names = obj.fieldNames();
      while (names.hasNext()) {
        keys.add(names.next());
      }
      for (String key : keys) {
        JsonNode child = obj.get(key);
        if (child != null && child.isTextual() && isDriverIdField(key)) {
          String id = child.asText();
          if (driverRefs.containsKey(id)) {
            obj.set(key, TextNode.valueOf(ClubPackageFormat.driverToken(driverRefs.get(id))));
          }
        } else if (child != null && child.isArray() && isDriverIdListField(key)) {
          ArrayNode arr = (ArrayNode) child;
          for (int i = 0; i < arr.size(); i++) {
            String id = arr.get(i).asText();
            if (driverRefs.containsKey(id)) {
              arr.set(i, TextNode.valueOf(ClubPackageFormat.driverToken(driverRefs.get(id))));
            }
          }
        } else {
          scrubDrivers(child);
        }
      }
    } else if (node.isArray()) {
      for (JsonNode child : node) {
        scrubDrivers(child);
      }
    }
  }

  private static boolean isDriverIdField(String key) {
    return "driver_id".equals(key) || "driverId".equals(key) || "driverEntityId".equals(key);
  }

  private static boolean isDriverIdListField(String key) {
    return "driverIds".equals(key) || "driver_ids".equals(key);
  }

  private ArrayNode exportDrivers() throws Exception {
    Map<String, String> labelNames = new LinkedHashMap<>();
    for (DriverLabel l : labels.findAll()) {
      labelNames.put(l.getEntityId(), l.getName());
    }
    ArrayNode out = ClubPackageFormat.MAPPER.createArrayNode();
    for (Map.Entry<String, String> e : driverRefs.entrySet()) {
      ObjectNode d = out.addObject();
      d.put("ref", e.getValue());
      String raw = drivers.findRawJsonByEntityId(e.getKey());
      JsonNode src = raw != null ? ClubPackageFormat.MAPPER.readTree(raw) : null;
      if (src == null) {
        src = embeddedDrivers.get(e.getKey());
      }
      d.put("club_id", stampClubId(drivers, e.getKey(), raw));
      d.put("name", ClubPackageFormat.text(src, "name"));
      d.put("nickname", ClubPackageFormat.text(src, "nickname"));
      ArrayNode ls = d.putArray("labels");
      if (src != null) {
        JsonNode ids = src.has("labelIds") ? src.get("labelIds") : src.path("label_ids");
        for (JsonNode id : ids) {
          String label = labelNames.get(id.asText());
          if (label != null && !label.isEmpty()) {
            ls.add(label);
          }
        }
      }
    }
    return out;
  }

  private ArrayNode exportTracks() throws Exception {
    // Race classes may point at more tracks; resolve them first.
    for (String raceId : new ArrayList<>(raceRefs.keySet())) {
      JsonNode race = raceJson(raceId);
      String trackId = ClubPackageFormat.text(race, "track_entity_id");
      if (!trackId.isEmpty()) {
        trackRef(trackId);
      }
    }
    ArrayNode out = ClubPackageFormat.MAPPER.createArrayNode();
    for (Map.Entry<String, String> e : trackRefs.entrySet()) {
      String raw = tracks.findRawJsonByEntityId(e.getKey());
      JsonNode src = raw != null ? ClubPackageFormat.MAPPER.readTree(raw) : null;
      if (src == null) {
        src = embeddedTracks.get(e.getKey());
      }
      ObjectNode t = out.addObject();
      t.put("ref", e.getValue());
      t.put("club_id", stampClubId(tracks, e.getKey(), raw));
      t.put("name", ClubPackageFormat.text(src, "name"));
      if (src != null && src.has("num_track_sections")) {
        t.set("num_track_sections", src.get("num_track_sections"));
      }
      if (src != null && src.has("track_scale")) {
        t.set("track_scale", src.get("track_scale"));
      }
      ArrayNode lanes = t.putArray("lanes");
      if (src != null) {
        for (JsonNode lane : src.path("lanes")) {
          ObjectNode l = lanes.addObject();
          l.put("background_color", ClubPackageFormat.text(lane, "background_color"));
          l.put("foreground_color", ClubPackageFormat.text(lane, "foreground_color"));
          l.put("length", lane.path("length").asDouble(0));
        }
      }
    }
    return out;
  }

  private JsonNode raceJson(String raceId) throws Exception {
    String raw = races.findRawJsonByEntityId(raceId);
    if (raw != null) {
      return ClubPackageFormat.MAPPER.readTree(raw);
    }
    return embeddedRaces.get(raceId);
  }

  private ArrayNode exportRaceClasses() throws Exception {
    ArrayNode out = ClubPackageFormat.MAPPER.createArrayNode();
    for (Map.Entry<String, String> e : raceRefs.entrySet()) {
      String raw = races.findRawJsonByEntityId(e.getKey());
      JsonNode src = raw != null ? ClubPackageFormat.MAPPER.readTree(raw) : raceJson(e.getKey());
      ObjectNode settings =
          src != null ? src.deepCopy() : ClubPackageFormat.MAPPER.createObjectNode();
      String trackId = ClubPackageFormat.text(settings, "track_entity_id");
      ObjectNode r = out.addObject();
      r.put("ref", e.getValue());
      r.put("club_id", stampClubId(races, e.getKey(), raw));
      r.put("name", ClubPackageFormat.text(settings, "name"));
      r.put(
          "track_ref",
          trackId.isEmpty() || !trackRefs.containsKey(trackId) ? "" : trackRefs.get(trackId));
      settings.remove(ClubPackageFormat.CLUB_ID);
      scrubRaceIds(settings);
      r.set("settings", settings);
    }
    return out;
  }

  /** Returns the item's club id, creating and storing one on the first export. */
  private String stampClubId(SqliteRepository<?> repo, String id, String raw) throws Exception {
    if (raw == null) {
      return UUID.randomUUID().toString(); // no longer in the database: matched by name instead
    }
    ObjectNode node = (ObjectNode) ClubPackageFormat.MAPPER.readTree(raw);
    String clubId = ClubPackageFormat.text(node, ClubPackageFormat.CLUB_ID);
    if (clubId.isEmpty()) {
      clubId = UUID.randomUUID().toString();
      node.put(ClubPackageFormat.CLUB_ID, clubId);
      repo.saveRawJson(id, ClubPackageFormat.MAPPER.writeValueAsString(node));
    }
    return clubId;
  }
}
