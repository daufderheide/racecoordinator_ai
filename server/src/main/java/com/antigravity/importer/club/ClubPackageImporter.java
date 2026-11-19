package com.antigravity.importer.club;

import com.antigravity.context.DatabaseContext;
import com.antigravity.importer.club.ClubImport.Item;
import com.antigravity.importer.club.ClubImport.ItemResolution;
import com.antigravity.importer.club.ClubImport.MatchType;
import com.antigravity.importer.club.ClubImport.Night;
import com.antigravity.importer.club.ClubImport.NightResolution;
import com.antigravity.importer.club.ClubImport.NightStatus;
import com.antigravity.importer.club.ClubImport.Option;
import com.antigravity.importer.club.ClubImport.Preview;
import com.antigravity.importer.club.ClubImport.SeasonChoice;
import com.antigravity.importer.club.ClubImport.SeasonResolution;
import com.antigravity.models.Driver;
import com.antigravity.models.DriverLabel;
import com.antigravity.models.Lane;
import com.antigravity.models.RaceHistoryRecord;
import com.antigravity.models.Season;
import com.antigravity.models.Theme;
import com.antigravity.models.Track;
import com.antigravity.repository.SqliteRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Imports a club package: matches its drivers, tracks, race classes and championship to this PC (by
 * club id, then by name), and merges its race nights into the season. Standings need no extra work:
 * they are always calculated from the season's race nights.
 * https://github.com/daufderheide/racecoordinator_ai/issues/972
 */
public class ClubPackageImporter {

  private static final Logger logger = LoggerFactory.getLogger(ClubPackageImporter.class);

  private final DatabaseContext context;
  private final SqliteRepository<Season> seasons;
  private final SqliteRepository<Driver> drivers;
  private final SqliteRepository<DriverLabel> labels;
  private final SqliteRepository<Track> tracks;
  private final SqliteRepository<com.antigravity.models.Race> races; // fqn-collision
  private final SqliteRepository<RaceHistoryRecord> history;
  private final SqliteRepository<Theme> themes;

  public ClubPackageImporter(DatabaseContext context) {
    this.context = context;
    this.seasons = new SqliteRepository<>(context, "seasons", Season.class);
    this.drivers = new SqliteRepository<>(context, "drivers", Driver.class);
    this.labels = new SqliteRepository<>(context, "driver_labels", DriverLabel.class);
    this.tracks = new SqliteRepository<>(context, "tracks", Track.class);
    this.races =
        new SqliteRepository<>(
            context, "races", com.antigravity.models.Race.class); // fqn-collision
    this.history = new SqliteRepository<>(context, "race_history", RaceHistoryRecord.class);
    this.themes = new SqliteRepository<>(context, "themes", Theme.class);
  }

  // ---------------------------------------------------------------------------------------------
  // Preview

  public Preview preview(JsonNode pkg) throws Exception {
    validate(pkg);
    Preview p = new Preview();
    p.formatVersion = pkg.path("format_version").asInt(0);
    p.sourceAppVersion = ClubPackageFormat.text(pkg, "app_version");
    p.exportedAt = pkg.path("exported_at").asLong(0);
    p.packageData = pkg;
    if (p.formatVersion > ClubPackageFormat.FORMAT_VERSION) {
      p.warnings.add("CRI_WARN_NEWER_FORMAT");
    }

    Map<String, JsonNode> localDrivers = rawAll(drivers);
    Map<String, JsonNode> localTracks = rawAll(tracks);
    Map<String, JsonNode> localRaces = rawAll(races);
    Map<String, JsonNode> localSeasons = rawAll(seasons);

    for (JsonNode d : pkg.path("drivers")) {
      Item item = matchItem(d, localDrivers);
      item.detail = ClubPackageFormat.text(d, "nickname");
      if (item.existingId != null) {
        JsonNode local = localDrivers.get(item.existingId);
        if (!ClubPackageFormat.text(d, "nickname")
            .equals(ClubPackageFormat.text(local, "nickname"))) {
          item.differences.add("CRI_DIFF_NICKNAME");
        }
      }
      p.drivers.add(item);
    }
    for (JsonNode t : pkg.path("tracks")) {
      Item item = matchItem(t, localTracks);
      item.detail = String.valueOf(t.path("lanes").size());
      if (item.existingId != null) {
        addTrackDifferences(item, t, localTracks.get(item.existingId));
      }
      p.tracks.add(item);
    }
    for (JsonNode r : pkg.path("race_classes")) {
      Item item = matchItem(r, localRaces);
      if (item.existingId != null
          && !normalizedSettings(r.path("settings"))
              .equals(normalizedSettings(localRaces.get(item.existingId)))) {
        item.differences.add("CRI_DIFF_SETTINGS");
      }
      p.raceClasses.add(item);
    }

    p.season = matchSeason(pkg.path("championship"), localSeasons);
    JsonNode targetSeason =
        p.season.existingId != null ? localSeasons.get(p.season.existingId) : null;
    for (JsonNode n : pkg.path("race_nights")) {
      p.raceNights.add(nightStatus(n, targetSeason));
    }

    p.existing.put("seasons", options(localSeasons));
    p.existing.put("drivers", options(localDrivers));
    p.existing.put("tracks", options(localTracks));
    p.existing.put("raceClasses", options(localRaces));
    return p;
  }

  static void validate(JsonNode pkg) {
    if (pkg == null
        || !pkg.isObject()
        || !ClubPackageFormat.FORMAT.equals(ClubPackageFormat.text(pkg, "format"))) {
      throw new IllegalArgumentException("CRI_ERR_NOT_A_CLUB_PACKAGE");
    }
    if (ClubPackageFormat.text(pkg.path("championship"), "name").isEmpty()) {
      throw new IllegalArgumentException("CRI_ERR_NO_CHAMPIONSHIP");
    }
  }

  private Map<String, JsonNode> rawAll(SqliteRepository<?> repo) throws Exception {
    Map<String, JsonNode> out = new HashMap<>();
    for (Map.Entry<String, String> e : repo.findAllRawJson().entrySet()) {
      out.put(e.getKey(), ClubPackageFormat.MAPPER.readTree(e.getValue()));
    }
    return out;
  }

  private static List<Option> options(Map<String, JsonNode> local) {
    List<Option> out = new ArrayList<>();
    for (Map.Entry<String, JsonNode> e : local.entrySet()) {
      out.add(new Option(e.getKey(), ClubPackageFormat.text(e.getValue(), "name")));
    }
    out.sort((a, b) -> ClubPackageFormat.lower(a.name).compareTo(ClubPackageFormat.lower(b.name)));
    return out;
  }

  /** Matches by club id first, then by name (ignoring case). */
  private static Item matchItem(JsonNode pkgItem, Map<String, JsonNode> local) {
    Item item = new Item();
    item.ref = ClubPackageFormat.text(pkgItem, "ref");
    item.clubId = ClubPackageFormat.text(pkgItem, "club_id");
    item.name = ClubPackageFormat.text(pkgItem, "name");
    String id = findByClubId(local, item.clubId);
    if (id != null) {
      item.matchType = MatchType.CLUB_ID;
    } else {
      id = findByName(local, item.name);
      if (id != null) {
        item.matchType = MatchType.NAME;
      }
    }
    if (id != null) {
      item.existingId = id;
      item.existingName = ClubPackageFormat.text(local.get(id), "name");
      item.resolution = ItemResolution.MATCH;
    }
    return item;
  }

  private static String findByClubId(Map<String, JsonNode> local, String clubId) {
    if (clubId == null || clubId.isEmpty()) {
      return null;
    }
    for (Map.Entry<String, JsonNode> e : local.entrySet()) {
      if (clubId.equals(ClubPackageFormat.text(e.getValue(), ClubPackageFormat.CLUB_ID))) {
        return e.getKey();
      }
    }
    return null;
  }

  private static String findByName(Map<String, JsonNode> local, String name) {
    String wanted = ClubPackageFormat.lower(name);
    if (wanted.isEmpty()) {
      return null;
    }
    for (Map.Entry<String, JsonNode> e : local.entrySet()) {
      if (wanted.equals(ClubPackageFormat.lower(ClubPackageFormat.text(e.getValue(), "name")))) {
        return e.getKey();
      }
    }
    return null;
  }

  private static void addTrackDifferences(Item item, JsonNode pkgTrack, JsonNode local) {
    JsonNode pl = pkgTrack.path("lanes");
    JsonNode ll = local.path("lanes");
    if (pl.size() != ll.size()) {
      item.differences.add("CRI_DIFF_LANE_COUNT");
      return;
    }
    for (int i = 0; i < pl.size(); i++) {
      if (!ClubPackageFormat.text(pl.get(i), "background_color")
          .equalsIgnoreCase(ClubPackageFormat.text(ll.get(i), "background_color"))) {
        item.differences.add("CRI_DIFF_LANE_COLORS");
        return;
      }
    }
  }

  /** Race class settings without ids, so two PCs' copies can be compared. */
  static String normalizedSettings(JsonNode settings) {
    if (settings == null || !settings.isObject()) {
      return "";
    }
    ObjectNode copy = settings.deepCopy();
    copy.remove(
        java.util.Arrays.asList(
            "entity_id",
            "_id",
            "objectId",
            "track_entity_id",
            "compatibility",
            // assets live on each PC, and each PC fills in its own
            "custom_rotation_asset_id",
            "customRotationAssetId",
            ClubPackageFormat.CLUB_ID));
    StringBuilder sb = new StringBuilder();
    canonical(copy, sb);
    return sb.toString();
  }

  /**
   * A canonical text form: keys sorted, numbers by value (2 and 2.0 are the same after a round trip
   * through another PC), and the internal "@id" numbering left out.
   */
  private static void canonical(JsonNode node, StringBuilder sb) {
    if (node == null || node.isNull()) {
      sb.append("null");
    } else if (node.isObject()) {
      sb.append('{');
      List<String> keys = new ArrayList<>();
      node.fieldNames().forEachRemaining(keys::add);
      java.util.Collections.sort(keys);
      for (String k : keys) {
        if ("@id".equals(k)) {
          continue;
        }
        sb.append(k).append(':');
        canonical(node.get(k), sb);
        sb.append(',');
      }
      sb.append('}');
    } else if (node.isArray()) {
      sb.append('[');
      for (JsonNode child : node) {
        canonical(child, sb);
        sb.append(',');
      }
      sb.append(']');
    } else if (node.isNumber()) {
      sb.append(node.decimalValue().stripTrailingZeros().toPlainString());
    } else {
      sb.append(node.toString());
    }
  }

  private static SeasonChoice matchSeason(JsonNode championship, Map<String, JsonNode> local) {
    SeasonChoice s = new SeasonChoice();
    s.clubId = ClubPackageFormat.text(championship, "club_id");
    s.name = ClubPackageFormat.text(championship, "name");
    s.packageDrops = championship.path("drops").asInt(0);
    String id = findByClubId(local, s.clubId);
    if (id != null) {
      s.matchType = MatchType.CLUB_ID;
    } else {
      id = findByName(local, s.name);
      if (id == null) {
        for (Map.Entry<String, JsonNode> e : local.entrySet()) {
          String clubName = ClubPackageFormat.text(e.getValue(), ClubPackageFormat.CLUB_NAME);
          if (!clubName.isEmpty()
              && ClubPackageFormat.lower(clubName).equals(ClubPackageFormat.lower(s.name))) {
            id = e.getKey();
          }
        }
      }
      if (id != null) {
        s.matchType = MatchType.NAME;
      }
    }
    if (id != null) {
      s.existingId = id;
      s.existingName = ClubPackageFormat.text(local.get(id), "name");
      s.existingDrops = local.get(id).path("drops").asInt(0);
      s.resolution = SeasonResolution.MERGE;
    }
    return s;
  }

  static String nightKey(JsonNode rec) {
    String historyId = ClubPackageFormat.text(rec, "history_record_id");
    if (historyId.isEmpty()) {
      historyId = ClubPackageFormat.text(rec, "history_id");
    }
    if (!historyId.isEmpty()) {
      return historyId;
    }
    return "ts:" + rec.path("timestamp").asLong(0) + ":" + ClubPackageFormat.text(rec, "race_name");
  }

  /** The results of a race night as "name=points" pairs, to compare two PCs' copies. */
  static Set<String> resultFingerprint(JsonNode driverResults) {
    Set<String> out = new TreeSet<>();
    for (JsonNode r : driverResults) {
      out.add(
          ClubPackageFormat.lower(ClubPackageFormat.text(r, "driver_name"))
              + "="
              + Math.round(r.path("total_points").asDouble(0) * 100)
              + "#"
              + r.path("overall_rank").asInt(0));
    }
    return out;
  }

  private static Night nightStatus(JsonNode n, JsonNode targetSeason) {
    Night night = new Night();
    night.key = ClubPackageFormat.text(n, "key");
    night.historyId = ClubPackageFormat.text(n, "history_id");
    night.raceName = ClubPackageFormat.text(n, "race_name");
    night.timestamp = n.path("timestamp").asLong(0);
    night.driverCount = n.path("driver_results").size();
    night.hasHistory = n.path("history").isObject();
    if (targetSeason != null) {
      for (JsonNode rec : targetSeason.path("races")) {
        if (nightKey(rec).equals(night.key)) {
          boolean same =
              resultFingerprint(rec.path("driver_results"))
                  .equals(resultFingerprint(n.path("driver_results")));
          night.status = same ? NightStatus.SAME : NightStatus.CHANGED;
          night.resolution = same ? NightResolution.SKIP : NightResolution.UPDATE;
          break;
        }
      }
    }
    return night;
  }

  // ---------------------------------------------------------------------------------------------
  // Commit

  public ClubImport.Result commit(ClubImport.CommitRequest request) throws Exception {
    validate(request.packageData);
    JsonNode pkg = request.packageData.deepCopy();
    ClubImport.CommitRequest req = withDefaults(pkg, request);
    ClubImport.Result result = new ClubImport.Result();
    Map<String, String> tokens = new HashMap<>();

    Map<String, JsonNode> pkgTracks = byRef(pkg.path("tracks"));
    for (Item item : req.tracks) {
      JsonNode t = pkgTracks.get(item.ref);
      if (t != null) {
        tokens.put(ClubPackageFormat.trackToken(item.ref), importTrack(t, item, result));
      }
    }
    Map<String, JsonNode> pkgRaces = byRef(pkg.path("race_classes"));
    for (Item item : req.raceClasses) {
      JsonNode r = pkgRaces.get(item.ref);
      if (r != null) {
        tokens.put(ClubPackageFormat.raceToken(item.ref), importRaceClass(r, item, tokens, result));
      }
    }
    Map<String, JsonNode> pkgDrivers = byRef(pkg.path("drivers"));
    for (Item item : req.drivers) {
      JsonNode d = pkgDrivers.get(item.ref);
      if (d != null) {
        tokens.put(ClubPackageFormat.driverToken(item.ref), importDriver(d, item, result));
      }
    }

    String seasonId = importSeason(pkg.path("championship"), req.season, result);
    tokens.put(ClubPackageFormat.SEASON_TOKEN, seasonId);
    mergeRaceNights(pkg.path("race_nights"), req.raceNights, seasonId, tokens, result);

    result.success = true;
    result.seasonId = seasonId;
    logger.info(
        "Club package imported into season {}: {} nights added, {} updated, {} skipped",
        seasonId,
        result.nightsAdded,
        result.nightsUpdated,
        result.nightsSkipped);
    return result;
  }

  /**
   * The user's choices on top of the preview's defaults, so every item in the package gets a
   * resolution (and every token a local id) even if the request leaves some out.
   */
  private ClubImport.CommitRequest withDefaults(JsonNode pkg, ClubImport.CommitRequest req)
      throws Exception {
    Preview defaults = preview(pkg);
    ClubImport.CommitRequest out = new ClubImport.CommitRequest();
    out.packageData = pkg;
    out.season = req.season != null ? req.season : defaults.season;
    out.drivers = mergeItems(defaults.drivers, req.drivers);
    out.tracks = mergeItems(defaults.tracks, req.tracks);
    out.raceClasses = mergeItems(defaults.raceClasses, req.raceClasses);
    Map<String, Night> chosen = new HashMap<>();
    if (req.raceNights != null) {
      for (Night n : req.raceNights) {
        chosen.put(n.key, n);
      }
    }
    for (Night n : defaults.raceNights) {
      out.raceNights.add(chosen.getOrDefault(n.key, n));
    }
    return out;
  }

  private static List<Item> mergeItems(List<Item> defaults, List<Item> chosen) {
    Map<String, Item> byRef = new HashMap<>();
    if (chosen != null) {
      for (Item i : chosen) {
        byRef.put(i.ref, i);
      }
    }
    List<Item> out = new ArrayList<>();
    for (Item d : defaults) {
      out.add(byRef.getOrDefault(d.ref, d));
    }
    return out;
  }

  private static Map<String, JsonNode> byRef(JsonNode arr) {
    Map<String, JsonNode> out = new HashMap<>();
    for (JsonNode n : arr) {
      out.put(ClubPackageFormat.text(n, "ref"), n);
    }
    return out;
  }

  private JsonNode raw(SqliteRepository<?> repo, String id) throws Exception {
    if (id == null || id.isEmpty()) {
      return null;
    }
    String json = repo.findRawJsonByEntityId(id);
    return json != null ? ClubPackageFormat.MAPPER.readTree(json) : null;
  }

  private void stampClubId(SqliteRepository<?> repo, String id, String clubId) throws Exception {
    if (clubId == null || clubId.isEmpty()) {
      return;
    }
    JsonNode node = raw(repo, id);
    if (node != null && node.isObject()) {
      ((ObjectNode) node).put(ClubPackageFormat.CLUB_ID, clubId);
      repo.saveRawJson(id, ClubPackageFormat.MAPPER.writeValueAsString(node));
    }
  }

  /** A name not yet used by another item, e.g. "Track 1 (2)". */
  private String uniqueName(SqliteRepository<?> repo, String name) throws Exception {
    Set<String> used = new HashSet<>();
    for (JsonNode n : rawAll(repo).values()) {
      used.add(ClubPackageFormat.lower(ClubPackageFormat.text(n, "name")));
    }
    String base = name == null || name.trim().isEmpty() ? "Imported" : name.trim();
    String candidate = base;
    int i = 2;
    while (used.contains(ClubPackageFormat.lower(candidate))) {
      candidate = base + " (" + i++ + ")";
    }
    return candidate;
  }

  private boolean usable(SqliteRepository<?> repo, Item item) throws Exception {
    return item.resolution != ItemResolution.CREATE && raw(repo, item.existingId) != null;
  }

  private String importTrack(JsonNode t, Item item, ClubImport.Result result) throws Exception {
    if (usable(tracks, item)) {
      if (item.resolution == ItemResolution.UPDATE) {
        ObjectNode local = (ObjectNode) raw(tracks, item.existingId);
        JsonNode pl = t.path("lanes");
        JsonNode ll = local.path("lanes");
        for (int i = 0; i < Math.min(pl.size(), ll.size()); i++) {
          ObjectNode lane = (ObjectNode) ll.get(i);
          lane.put("background_color", ClubPackageFormat.text(pl.get(i), "background_color"));
          lane.put("foreground_color", ClubPackageFormat.text(pl.get(i), "foreground_color"));
          lane.put("length", pl.get(i).path("length").asDouble(0));
        }
        if (pl.size() != ll.size()) {
          result.messages.add("CRI_MSG_LANE_COUNT_KEPT:" + item.existingName);
        }
        tracks.saveRawJson(item.existingId, ClubPackageFormat.MAPPER.writeValueAsString(local));
        result.tracksUpdated++;
      } else {
        result.tracksMatched++;
      }
      stampClubId(tracks, item.existingId, item.clubId);
      return item.existingId;
    }
    List<Lane> lanes = new ArrayList<>();
    for (JsonNode l : t.path("lanes")) {
      String laneId = context.getNextSequence("lanes");
      lanes.add(
          new Lane(
              ClubPackageFormat.text(l, "background_color"),
              ClubPackageFormat.text(l, "foreground_color"),
              l.path("length").asDouble(0),
              laneId,
              laneId));
    }
    String id = tracks.getNextSequence();
    Track track =
        new Track.Builder()
            .name(uniqueName(tracks, ClubPackageFormat.text(t, "name")))
            .numTrackSections(
                t.has("num_track_sections") ? t.get("num_track_sections").asInt() : null)
            .trackScale(t.has("track_scale") ? t.get("track_scale").asDouble() : null)
            .lanes(lanes)
            .entityId(id)
            .id(null)
            .build();
    tracks.insert(track);
    stampClubId(tracks, id, item.clubId);
    result.tracksCreated++;
    return id;
  }

  private String importRaceClass(
      JsonNode r, Item item, Map<String, String> tokens, ClubImport.Result result)
      throws Exception {
    boolean keepExisting = usable(races, item) && item.resolution == ItemResolution.MATCH;
    if (keepExisting) {
      stampClubId(races, item.existingId, item.clubId);
      result.raceClassesMatched++;
      return item.existingId;
    }
    ObjectNode settings =
        r.path("settings").isObject()
            ? (ObjectNode) r.get("settings").deepCopy()
            : ClubPackageFormat.MAPPER.createObjectNode();
    ClubPackageFormat.replaceTokens(settings, tokens);
    String trackRef = ClubPackageFormat.text(r, "track_ref");
    String trackId = tokens.get(ClubPackageFormat.trackToken(trackRef));
    if (trackId != null) {
      settings.put("track_entity_id", trackId);
    }
    String themeId = ClubPackageFormat.text(settings, "theme_id");
    if (!themeId.isEmpty() && raw(themes, themeId) == null) {
      settings.put("theme_id", Theme.DEFAULT_THEME_ID);
      result.messages.add("CRI_MSG_THEME_DEFAULT:" + ClubPackageFormat.text(r, "name"));
    }
    settings.remove("custom_rotation_asset_id"); // assets stay on each PC
    settings.put(ClubPackageFormat.CLUB_ID, item.clubId);

    String id;
    if (usable(races, item)) {
      id = item.existingId; // UPDATE: the package's settings, this PC's id
      result.raceClassesUpdated++;
    } else {
      id = races.getNextSequence();
      settings.put("name", uniqueName(races, ClubPackageFormat.text(r, "name")));
      result.raceClassesCreated++;
    }
    settings.put("entity_id", id);
    settings.put("_id", id);
    if (!settings.has("@id")) {
      settings.put("@id", 1); // as RC AI writes its own JSON, so it reads back
    }
    races.saveRawJson(id, ClubPackageFormat.MAPPER.writeValueAsString(settings));
    return id;
  }

  private String importDriver(JsonNode d, Item item, ClubImport.Result result) throws Exception {
    List<String> labelIds = resolveLabels(d.path("labels"));
    if (usable(drivers, item)) {
      if (item.resolution == ItemResolution.UPDATE) {
        Driver existing = drivers.findByEntityId(item.existingId);
        Driver updated =
            Driver.Builder.from(existing)
                .withNickname(ClubPackageFormat.text(d, "nickname"))
                .withLabelIds(labelIds.isEmpty() ? existing.getLabelIds() : labelIds)
                .build();
        drivers.save(updated);
        result.driversUpdated++;
      } else {
        result.driversMatched++;
      }
      stampClubId(drivers, item.existingId, item.clubId);
      return item.existingId;
    }
    String id = context.getNextSequence("drivers");
    String nickname = ClubPackageFormat.text(d, "nickname");
    Driver driver =
        new Driver.Builder()
            .withName(uniqueName(drivers, ClubPackageFormat.text(d, "name")))
            .withNickname(nickname.isEmpty() ? ClubPackageFormat.text(d, "name") : nickname)
            .withLabelIds(labelIds)
            .withEntityId(id)
            .build();
    drivers.insert(driver);
    stampClubId(drivers, id, item.clubId);
    result.driversCreated++;
    return id;
  }

  /** Label names to this PC's label ids, creating labels that don't exist yet. */
  private List<String> resolveLabels(JsonNode names) {
    List<String> ids = new ArrayList<>();
    if (names == null || names.size() == 0) {
      return ids;
    }
    List<DriverLabel> existing = labels.findAll();
    for (JsonNode n : names) {
      String name = n.asText("").trim();
      if (name.isEmpty()) {
        continue;
      }
      DriverLabel found = null;
      for (DriverLabel l : existing) {
        if (ClubPackageFormat.lower(l.getName()).equals(ClubPackageFormat.lower(name))) {
          found = l;
        }
      }
      if (found == null) {
        found = new DriverLabel(name, null, UUID.randomUUID().toString());
        labels.insert(found);
        existing.add(found);
      }
      ids.add(found.getEntityId());
    }
    return ids;
  }

  private String importSeason(JsonNode championship, SeasonChoice choice, ClubImport.Result result)
      throws Exception {
    String name = ClubPackageFormat.text(championship, "name");
    int drops = championship.path("drops").asInt(0);
    String id;
    boolean merge =
        choice != null
            && choice.resolution == SeasonResolution.MERGE
            && raw(seasons, choice.existingId) != null;
    if (merge) {
      id = choice.existingId;
      if (choice.usePackageDrops) {
        ObjectNode s = (ObjectNode) raw(seasons, id);
        s.put("drops", drops);
        seasons.saveRawJson(id, ClubPackageFormat.MAPPER.writeValueAsString(s));
      }
    } else {
      id = seasons.getNextSequence();
      seasons.insert(new Season(uniqueName(seasons, name), drops, new ArrayList<>(), id, null));
    }
    ObjectNode s = (ObjectNode) raw(seasons, id);
    s.put(ClubPackageFormat.CLUB_ID, ClubPackageFormat.text(championship, "club_id"));
    s.put(ClubPackageFormat.CLUB_NAME, name);
    seasons.saveRawJson(id, ClubPackageFormat.MAPPER.writeValueAsString(s));
    result.seasonName = ClubPackageFormat.text(s, "name");
    return id;
  }

  private void mergeRaceNights(
      JsonNode pkgNights,
      List<Night> choices,
      String seasonId,
      Map<String, String> tokens,
      ClubImport.Result result)
      throws Exception {
    Map<String, NightResolution> chosen = new HashMap<>();
    for (Night n : choices) {
      chosen.put(n.key, n.resolution);
    }
    ObjectNode season = (ObjectNode) raw(seasons, seasonId);
    ArrayNode records =
        season.path("races").isArray() ? (ArrayNode) season.get("races") : season.putArray("races");
    for (JsonNode n : pkgNights) {
      String key = ClubPackageFormat.text(n, "key");
      NightResolution res = chosen.getOrDefault(key, NightResolution.SKIP);
      if (res == NightResolution.SKIP) {
        result.nightsSkipped++;
        continue;
      }
      ArrayNode results = n.path("driver_results").deepCopy();
      ClubPackageFormat.replaceTokens(results, tokens);
      ObjectNode existing = null;
      for (JsonNode rec : records) {
        if (nightKey(rec).equals(key)) {
          existing = (ObjectNode) rec;
        }
      }
      if (existing != null) {
        if (res != NightResolution.UPDATE) {
          result.nightsSkipped++;
          continue;
        }
        existing.set("driver_results", results);
        result.nightsUpdated++;
      } else {
        ObjectNode rec = records.addObject();
        rec.put("race_id", String.valueOf(records.size()));
        rec.put("race_name", ClubPackageFormat.text(n, "race_name"));
        rec.put("timestamp", n.path("timestamp").asLong(0));
        rec.put("is_demo", false);
        rec.set("driver_results", results);
        rec.put("history_record_id", ClubPackageFormat.text(n, "history_id"));
        result.nightsAdded++;
      }
      importHistory(n, tokens, res == NightResolution.UPDATE);
    }
    seasons.saveRawJson(seasonId, ClubPackageFormat.MAPPER.writeValueAsString(season));
  }

  private void importHistory(JsonNode night, Map<String, String> tokens, boolean overwrite)
      throws Exception {
    JsonNode h = night.path("history");
    String historyId = ClubPackageFormat.text(night, "history_id");
    if (!h.isObject() || historyId.isEmpty()) {
      return;
    }
    if (!overwrite && history.findRawJsonByEntityId(historyId) != null) {
      return; // already here (e.g. imported before); the season now links to it
    }
    ObjectNode copy = h.deepCopy();
    ClubPackageFormat.replaceTokens(copy, tokens);
    copy.put("_id", historyId);
    copy.put("is_demo", false);
    history.saveRawJson(historyId, ClubPackageFormat.MAPPER.writeValueAsString(copy));
  }
}
