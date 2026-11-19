package com.antigravity.importer.club;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import com.antigravity.context.DatabaseContext;
import com.antigravity.importer.club.ClubImport.ItemResolution;
import com.antigravity.importer.club.ClubImport.MatchType;
import com.antigravity.importer.club.ClubImport.NightResolution;
import com.antigravity.importer.club.ClubImport.NightStatus;
import com.antigravity.importer.club.ClubImport.SeasonResolution;
import com.antigravity.models.Driver;
import com.antigravity.models.DriverLabel;
import com.antigravity.models.Lane;
import com.antigravity.models.RaceHistoryRecord;
import com.antigravity.models.Season;
import com.antigravity.models.SeasonStandingItem;
import com.antigravity.models.Track;
import com.antigravity.race.SeasonStandingsCalculator;
import com.antigravity.repository.SqliteRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.io.File;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;

/**
 * Two databases standing in for two club members' PCs, passing the club package back and forth.
 * https://github.com/daufderheide/racecoordinator_ai/issues/972
 */
public class ClubPackageRoundTripTest {

  @Rule public TemporaryFolder tempFolder = new TemporaryFolder();

  private DatabaseContext pcA;
  private DatabaseContext pcB;

  /** PC A's ids for the test data. */
  private String seasonA;

  private String raceA;
  private String trackA;
  private final Map<String, String> driverA = new HashMap<>();

  @Before
  public void setUp() throws Exception {
    pcA = newPc("pc_a");
    pcB = newPc("pc_b");
    // Burn a few ids on B, so its ids differ from A's
    for (int i = 0; i < 5; i++) {
      pcB.getNextSequence("drivers");
      pcB.getNextSequence("tracks");
      pcB.getNextSequence("races");
      pcB.getNextSequence("seasons");
    }
    setUpPcA();
  }

  @After
  public void tearDown() throws Exception {
    for (DatabaseContext c : Arrays.asList(pcA, pcB)) {
      if (c != null && c.getConnection() != null) {
        c.getConnection().close();
      }
    }
  }

  private DatabaseContext newPc(String name) throws Exception {
    String root = tempFolder.newFolder(name).getAbsolutePath() + File.separator;
    return new DatabaseContext("club_db", null, root);
  }

  // --- PC A: a season with two race nights --------------------------------------------------

  private void setUpPcA() throws Exception {
    SqliteRepository<DriverLabel> labels =
        new SqliteRepository<>(pcA, "driver_labels", DriverLabel.class);
    DriverLabel pro = new DriverLabel("Pro", "#ff0000", UUID.randomUUID().toString());
    labels.insert(pro);
    SqliteRepository<Driver> drivers = new SqliteRepository<>(pcA, "drivers", Driver.class);
    for (String name : Arrays.asList("Dave Jackson", "Abby", "Gene")) {
      String id = pcA.getNextSequence("drivers");
      drivers.insert(
          new Driver.Builder()
              .withName(name)
              .withNickname(name.split(" ")[0])
              .withAvatarUrl("/api/assets/secret-avatar-" + id)
              .withLabelIds(
                  "Abby".equals(name) ? Collections.singletonList(pro.getEntityId()) : null)
              .withEntityId(id)
              .build());
      driverA.put(name, id);
    }
    trackA = pcA.getNextSequence("tracks");
    ObjectNode track = ClubPackageFormat.MAPPER.createObjectNode();
    track.put("name", "Home Track");
    track.put("entity_id", trackA);
    track.put("_id", trackA);
    ArrayNode lanes = track.putArray("lanes");
    for (String color : Arrays.asList("#ff0000", "#00ff00", "#0000ff")) {
      ObjectNode l = lanes.addObject();
      l.put("background_color", color);
      l.put("foreground_color", "#ffffff");
      l.put("length", 12.5);
    }
    track.putArray("arduino_configs").addObject().put("comm_port", "COM7");
    addObjectIds(track);
    new SqliteRepository<>(pcA, "tracks", Track.class).saveRawJson(trackA, track.toString());

    raceA = pcA.getNextSequence("races");
    ObjectNode race = ClubPackageFormat.MAPPER.createObjectNode();
    race.put("name", "NSR Classics");
    race.put("entity_id", raceA);
    race.put("_id", raceA);
    race.put("track_entity_id", trackA);
    race.put("theme_id", "theme_only_on_a");
    race.put("min_lap_time", 2.5);
    race.putObject("future_feature").put("from", "a newer version");
    new SqliteRepository<>(pcA, "races", com.antigravity.models.Race.class) // fqn-collision
        .saveRawJson(raceA, race.toString());

    seasonA = pcA.getNextSequence("seasons");
    new SqliteRepository<>(pcA, "seasons", Season.class)
        .insert(new Season("Club 2026", 1, new ArrayList<>(), seasonA, null));
    addRaceNight(pcA, seasonA, raceA, trackA, driverA, 1000L, 10, 8, 6);
    addRaceNight(pcA, seasonA, raceA, trackA, driverA, 2000L, 6, 10, 8);
  }

  /** Adds a race night (season record + history) with points for Dave, Abby, Gene. */
  private static String addRaceNight(
      DatabaseContext pc,
      String seasonId,
      String raceId,
      String trackId,
      Map<String, String> ids,
      long timestamp,
      double dave,
      double abby,
      double gene)
      throws Exception {
    String historyId = UUID.randomUUID().toString();
    Map<String, Double> points = new HashMap<>();
    points.put("Dave Jackson", dave);
    points.put("Abby", abby);
    points.put("Gene", gene);

    ObjectNode h = ClubPackageFormat.MAPPER.createObjectNode();
    h.put("_id", historyId);
    h.put("original_entity_id", raceId);
    h.put("season_entity_id", seasonId);
    h.put("timestamp", timestamp);
    ObjectNode model = h.putObject("model");
    model.put("name", "NSR Classics");
    model.put("entity_id", raceId);
    model.put("track_entity_id", trackId);
    ObjectNode track = h.putObject("track");
    track.put("name", "Home Track");
    track.put("entity_id", trackId);
    track.putArray("arduino_configs").addObject().put("comm_port", "COM7");
    ArrayNode participants = h.putArray("drivers");
    ArrayNode heatDrivers = h.putArray("heats").addObject().putArray("heatDrivers");
    ArrayNode results = ClubPackageFormat.MAPPER.createArrayNode();
    int lane = 0;
    for (Map.Entry<String, String> e : ids.entrySet()) {
      ObjectNode p = participants.addObject();
      ObjectNode d = p.putObject("driver");
      d.put("name", e.getKey());
      d.put("nickname", e.getKey().split(" ")[0]);
      d.put("entity_id", e.getValue());
      d.put("_id", e.getValue());
      d.put("avatarUrl", "/api/assets/secret-avatar");
      ObjectNode hd = heatDrivers.addObject();
      hd.put("laneIndex", lane++);
      hd.set("actualDriver", d.deepCopy());
      hd.putArray("laps").addObject().put("driverId", e.getValue()).put("lapTime", 4.2);
      ObjectNode r = results.addObject();
      r.put("driver_id", e.getValue());
      r.put("driver_name", e.getKey());
      r.put("overall_rank", 1);
      r.put("overall_points", points.get(e.getKey()));
      r.put("total_points", points.get(e.getKey()));
    }
    h.set("driver_results", results);
    addObjectIds(h);
    new SqliteRepository<>(pc, "race_history", RaceHistoryRecord.class)
        .saveRawJson(historyId, h.toString());

    SqliteRepository<Season> seasons = new SqliteRepository<>(pc, "seasons", Season.class);
    ObjectNode season =
        (ObjectNode) ClubPackageFormat.MAPPER.readTree(seasons.findRawJsonByEntityId(seasonId));
    ArrayNode races =
        season.path("races").isArray() ? (ArrayNode) season.get("races") : season.putArray("races");
    ObjectNode rec = races.addObject();
    rec.put("race_id", String.valueOf(races.size()));
    rec.put("race_name", "NSR Classics");
    rec.put("timestamp", timestamp);
    rec.put("is_demo", false);
    rec.set("driver_results", results.deepCopy());
    rec.put("history_record_id", historyId);
    seasons.saveRawJson(seasonId, season.toString());
    return historyId;
  }

  // --- helpers ---------------------------------------------------------------------------------

  /** Numbers nested objects with "@id" like RC AI's own JSON does (IntSequenceGenerator). */
  private static void addObjectIds(JsonNode root) {
    int[] next = {2};
    if (root.isObject() && !root.has("@id")) {
      ((ObjectNode) root).put("@id", 1);
    }
    addObjectIds(root, next, true);
  }

  private static void addObjectIds(JsonNode node, int[] next, boolean isRoot) {
    if (node.isObject()) {
      if (!isRoot && !node.has("@id")) {
        ((ObjectNode) node).put("@id", next[0]++);
      }
      node.forEach(child -> addObjectIds(child, next, false));
    } else if (node.isArray()) {
      node.forEach(child -> addObjectIds(child, next, false));
    }
  }

  private static JsonNode export(DatabaseContext pc, String seasonId, String name)
      throws Exception {
    // Through JSON text, like the real file
    String text = new ClubPackageExporter(pc).export(seasonId, name).toString();
    return ClubPackageFormat.MAPPER.readTree(text);
  }

  private static ClubImport.Result importAll(DatabaseContext pc, JsonNode pkg) throws Exception {
    ClubPackageImporter importer = new ClubPackageImporter(pc);
    ClubImport.Preview preview = importer.preview(pkg);
    ClubImport.CommitRequest req = new ClubImport.CommitRequest();
    req.packageData = preview.packageData;
    req.season = preview.season;
    req.drivers = preview.drivers;
    req.tracks = preview.tracks;
    req.raceClasses = preview.raceClasses;
    req.raceNights = preview.raceNights;
    return importer.commit(req);
  }

  private static Map<String, Double> standings(DatabaseContext pc, String seasonId) {
    Season s = new SqliteRepository<>(pc, "seasons", Season.class).findByEntityId(seasonId);
    Map<String, Double> out = new HashMap<>();
    for (SeasonStandingItem i : SeasonStandingsCalculator.calculateStandings(s)) {
      out.put(i.getDriverName(), i.getNetPoints());
    }
    return out;
  }

  private static List<String> standingsOrder(DatabaseContext pc, String seasonId) {
    Season s = new SqliteRepository<>(pc, "seasons", Season.class).findByEntityId(seasonId);
    List<String> out = new ArrayList<>();
    for (SeasonStandingItem i : SeasonStandingsCalculator.calculateStandings(s)) {
      out.add(i.getRank() + ":" + i.getDriverName());
    }
    return out;
  }

  @Test
  public void testComparingRaceClassesIgnoresEachPcsOwnAssets() {
    ObjectNode a = ClubPackageFormat.MAPPER.createObjectNode();
    a.put("name", "Club Sprint").put("min_lap_time", 2.5).put("custom_rotation_asset_id", "x1");
    ObjectNode b = a.deepCopy();
    b.put("custom_rotation_asset_id", "y2").put("entity_id", "9").put("club_id", "c");
    assertEquals(
        ClubPackageImporter.normalizedSettings(a), ClubPackageImporter.normalizedSettings(b));
    b.put("min_lap_time", 3.0);
    assertNotEquals(
        ClubPackageImporter.normalizedSettings(a), ClubPackageImporter.normalizedSettings(b));
  }

  @Test
  public void testComparingRaceClassesIgnoresNumberFormatAndInternalIds() {
    ObjectNode a = ClubPackageFormat.MAPPER.createObjectNode();
    a.put("auto_start_time", 3).put("@id", 1);
    a.putObject("heat_scoring").put("finish_value", 10).put("@id", 2);
    ObjectNode b = ClubPackageFormat.MAPPER.createObjectNode();
    b.putObject("heat_scoring").put("@id", 7).put("finish_value", 10.0);
    b.put("@id", 4).put("auto_start_time", 3.00);
    assertEquals(
        ClubPackageImporter.normalizedSettings(a), ClubPackageImporter.normalizedSettings(b));
  }

  private static String driverIdByName(DatabaseContext pc, String name) {
    for (Driver d : new SqliteRepository<>(pc, "drivers", Driver.class).findAll()) {
      if (name.equals(d.getName())) {
        return d.getEntityId();
      }
    }
    return null;
  }

  private static int count(DatabaseContext pc, String table) {
    return new SqliteRepository<>(pc, table, Driver.class).findAllRawJson().size();
  }

  // --- tests -----------------------------------------------------------------------------------

  @Test
  public void testExportScrubsEverythingTiedToThePc() throws Exception {
    JsonNode pkg = export(pcA, seasonA, "Hobby Club 2026");
    String text = pkg.toString();

    assertEquals(ClubPackageFormat.FORMAT, pkg.path("format").asText());
    assertEquals("Hobby Club 2026", pkg.path("championship").path("name").asText());
    assertEquals(1, pkg.path("championship").path("drops").asInt());
    assertEquals(3, pkg.path("drivers").size());
    assertEquals(1, pkg.path("tracks").size());
    assertEquals(1, pkg.path("race_classes").size());
    assertEquals(2, pkg.path("race_nights").size());
    // No hardware, no avatars, no local ids in results
    assertFalse(text.contains("COM7"));
    assertFalse(text.contains("arduino_configs"));
    assertFalse(text.contains("secret-avatar"));
    for (JsonNode n : pkg.path("race_nights")) {
      for (JsonNode r : n.path("driver_results")) {
        assertTrue(r.path("driver_id").asText().startsWith(ClubPackageFormat.TOKEN_PREFIX));
      }
      assertTrue(n.path("history").path("original_entity_id").asText().startsWith("@club:race:"));
    }
    // Labels travel by name
    boolean abbyIsPro = false;
    for (JsonNode d : pkg.path("drivers")) {
      if ("Abby".equals(d.path("name").asText())) {
        abbyIsPro = d.path("labels").toString().contains("Pro");
      }
    }
    assertTrue(abbyIsPro);
    // Club ids are stamped on PC A, and stay the same on the next export
    JsonNode again = export(pcA, seasonA, null);
    assertEquals(
        pkg.path("drivers").get(0).path("club_id").asText(),
        again.path("drivers").get(0).path("club_id").asText());
    assertEquals("Hobby Club 2026", again.path("championship").path("name").asText());
  }

  @Test
  public void testImportIntoAnEmptyPcCreatesEverythingWithItsOwnIds() throws Exception {
    JsonNode pkg = export(pcA, seasonA, "Hobby Club 2026");
    ClubImport.Preview preview = new ClubPackageImporter(pcB).preview(pkg);
    assertEquals(SeasonResolution.CREATE, preview.season.resolution);
    for (ClubImport.Item d : preview.drivers) {
      assertEquals(ItemResolution.CREATE, d.resolution);
    }
    assertEquals(NightStatus.NEW, preview.raceNights.get(0).status);

    ClubImport.Result result = importAll(pcB, pkg);

    assertTrue(result.success);
    assertEquals(2, result.nightsAdded);
    assertEquals(3, result.driversCreated);
    assertEquals("Hobby Club 2026", result.seasonName);
    // B's own ids, not A's
    String daveB = driverIdByName(pcB, "Dave Jackson");
    assertNotNull(daveB);
    assertNotEquals(driverA.get("Dave Jackson"), daveB);
    // Standings on B equal A's (drops 1: best of 2 nights)
    assertEquals(standings(pcA, seasonA), standings(pcB, result.seasonId));
    // The race class points at B's track and keeps a newer version's field
    JsonNode race = null;
    for (String raw :
        new SqliteRepository<>(pcB, "races", Driver.class).findAllRawJson().values()) {
      race = ClubPackageFormat.MAPPER.readTree(raw);
    }
    assertEquals("NSR Classics", race.path("name").asText());
    assertEquals("a newer version", race.path("future_feature").path("from").asText());
    assertEquals("default_classic_rc_ai", race.path("theme_id").asText());
    Track trackB =
        new SqliteRepository<>(pcB, "tracks", Track.class)
            .findByEntityId(race.path("track_entity_id").asText());
    assertEquals("Home Track", trackB.getName());
    assertEquals(3, trackB.getLanes().size());
    assertEquals("#00ff00", trackB.getLanes().get(1).getBackground_color());
    // The history is readable and points at B's ids everywhere
    for (String raw :
        new SqliteRepository<>(pcB, "race_history", RaceHistoryRecord.class)
            .findAllRawJson()
            .values()) {
      assertFalse(raw, raw.contains(ClubPackageFormat.TOKEN_PREFIX));
      assertTrue(raw.contains("\"driverId\":\"" + daveB + "\""));
      JsonNode h = ClubPackageFormat.MAPPER.readTree(raw);
      assertEquals(result.seasonId, h.path("season_entity_id").asText());
      assertEquals(race.path("entity_id").asText(), h.path("original_entity_id").asText());
    }
    RaceHistoryRecord any =
        new SqliteRepository<>(pcB, "race_history", RaceHistoryRecord.class).findAll().get(0);
    assertEquals(3, any.getDrivers().size());
    // Labels came along by name
    Driver abby =
        new SqliteRepository<>(pcB, "drivers", Driver.class)
            .findByEntityId(driverIdByName(pcB, "Abby"));
    DriverLabel label =
        new SqliteRepository<>(pcB, "driver_labels", DriverLabel.class)
            .findByEntityId(abby.getLabelIds().get(0));
    assertEquals("Pro", label.getName());
  }

  @Test
  public void testImportingTheSamePackageTwiceChangesNothing() throws Exception {
    JsonNode pkg = export(pcA, seasonA, "Hobby Club 2026");
    ClubImport.Result first = importAll(pcB, pkg);
    int drivers = count(pcB, "drivers");
    int races = count(pcB, "races");

    ClubImport.Preview preview = new ClubPackageImporter(pcB).preview(pkg);
    assertEquals(MatchType.CLUB_ID, preview.season.matchType);
    assertEquals(first.seasonId, preview.season.existingId);
    for (ClubImport.Item d : preview.drivers) {
      assertEquals(MatchType.CLUB_ID, d.matchType);
      assertEquals(ItemResolution.MATCH, d.resolution);
    }
    for (ClubImport.Night n : preview.raceNights) {
      assertEquals(NightStatus.SAME, n.status);
      assertEquals(NightResolution.SKIP, n.resolution);
    }
    ClubImport.Result second = importAll(pcB, pkg);

    assertEquals(first.seasonId, second.seasonId);
    assertEquals(0, second.nightsAdded);
    assertEquals(2, second.nightsSkipped);
    assertEquals(drivers, count(pcB, "drivers"));
    assertEquals(races, count(pcB, "races"));
    assertEquals(1, count(pcB, "seasons"));
  }

  @Test
  public void testRaceNightsTravelBothWaysAndStandingsAgree() throws Exception {
    ClubImport.Result onB = importAll(pcB, export(pcA, seasonA, "Hobby Club 2026"));
    // Track 2 (PC B) runs race night 3
    Map<String, String> idsB = new HashMap<>();
    for (String n : Arrays.asList("Dave Jackson", "Abby", "Gene")) {
      idsB.put(n, driverIdByName(pcB, n));
    }
    String raceB = null;
    String trackB = null;
    for (String raw :
        new SqliteRepository<>(pcB, "races", Driver.class).findAllRawJson().values()) {
      JsonNode r = ClubPackageFormat.MAPPER.readTree(raw);
      raceB = r.path("entity_id").asText();
      trackB = r.path("track_entity_id").asText();
    }
    addRaceNight(pcB, onB.seasonId, raceB, trackB, idsB, 3000L, 4, 6, 12);

    JsonNode fromB = export(pcB, onB.seasonId, null);
    assertEquals("Hobby Club 2026", fromB.path("championship").path("name").asText());
    ClubImport.Preview preview = new ClubPackageImporter(pcA).preview(fromB);
    assertEquals(seasonA, preview.season.existingId);
    int fresh = 0;
    for (ClubImport.Night n : preview.raceNights) {
      if (n.status == NightStatus.NEW) {
        fresh++;
      }
    }
    assertEquals(1, fresh);
    for (ClubImport.Item d : preview.drivers) {
      assertEquals(MatchType.CLUB_ID, d.matchType); // A's club ids came back via B
    }

    ClubImport.Result onA = importAll(pcA, fromB);

    assertEquals(1, onA.nightsAdded);
    assertEquals(0, onA.driversCreated);
    assertEquals(3, count(pcA, "drivers"));
    assertEquals(standings(pcB, onB.seasonId), standings(pcA, seasonA));
    assertEquals(standingsOrder(pcB, onB.seasonId), standingsOrder(pcA, seasonA));
    Map<String, Double> expected = new HashMap<>();
    expected.put("Dave Jackson", 10.0 + 6); // drops 1: best two of 10, 6, 4
    expected.put("Abby", 10.0 + 8);
    expected.put("Gene", 12.0 + 8);
    assertEquals(expected, standings(pcA, seasonA));
  }

  @Test
  public void testCorrectedResultsAreOfferedAsAnUpdate() throws Exception {
    ClubImport.Result onB = importAll(pcB, export(pcA, seasonA, "Hobby Club 2026"));
    // A corrects race night 1: Gene gets 9 instead of 6
    SqliteRepository<Season> seasons = new SqliteRepository<>(pcA, "seasons", Season.class);
    ObjectNode s =
        (ObjectNode) ClubPackageFormat.MAPPER.readTree(seasons.findRawJsonByEntityId(seasonA));
    for (JsonNode r : s.path("races").get(0).path("driver_results")) {
      if ("Gene".equals(r.path("driver_name").asText())) {
        ((ObjectNode) r).put("total_points", 9.0).put("overall_points", 9.0);
      }
    }
    seasons.saveRawJson(seasonA, s.toString());

    JsonNode pkg = export(pcA, seasonA, null);
    ClubImport.Preview preview = new ClubPackageImporter(pcB).preview(pkg);
    assertEquals(NightStatus.CHANGED, preview.raceNights.get(0).status);
    assertEquals(NightResolution.UPDATE, preview.raceNights.get(0).resolution);
    assertEquals(NightStatus.SAME, preview.raceNights.get(1).status);

    ClubImport.Result result = importAll(pcB, pkg);

    assertEquals(1, result.nightsUpdated);
    assertEquals(0, result.nightsAdded);
    assertEquals(standings(pcA, seasonA), standings(pcB, onB.seasonId));
  }

  @Test
  public void testExistingDriversWithoutClubIdAreMatchedByName() throws Exception {
    String daveOnB = pcB.getNextSequence("drivers");
    new SqliteRepository<>(pcB, "drivers", Driver.class)
        .insert(
            new Driver.Builder()
                .withName("dave jackson")
                .withNickname("DJ")
                .withEntityId(daveOnB)
                .build());

    ClubImport.Preview preview =
        new ClubPackageImporter(pcB).preview(export(pcA, seasonA, "Hobby Club 2026"));
    ClubImport.Item dave = null;
    for (ClubImport.Item d : preview.drivers) {
      if ("Dave Jackson".equals(d.name)) {
        dave = d;
      }
    }
    assertNotNull(dave);
    assertEquals(MatchType.NAME, dave.matchType);
    assertEquals(daveOnB, dave.existingId);
    assertTrue(dave.differences.contains("CRI_DIFF_NICKNAME"));

    importAll(pcB, preview.packageData);

    // Matched, not duplicated, and the existing driver keeps its nickname (MATCH, not UPDATE)
    assertEquals(3, count(pcB, "drivers"));
    Driver kept = new SqliteRepository<>(pcB, "drivers", Driver.class).findByEntityId(daveOnB);
    assertEquals("DJ", kept.getNickname());
    JsonNode raw =
        ClubPackageFormat.MAPPER.readTree(
            new SqliteRepository<>(pcB, "drivers", Driver.class).findRawJsonByEntityId(daveOnB));
    assertEquals(dave.clubId, raw.path(ClubPackageFormat.CLUB_ID).asText());
  }

  @Test
  public void testAddAsNewDriverGivesAUniqueName() throws Exception {
    new SqliteRepository<>(pcB, "drivers", Driver.class)
        .insert(
            new Driver.Builder()
                .withName("Abby")
                .withNickname("Abby")
                .withEntityId(pcB.getNextSequence("drivers"))
                .build());
    JsonNode pkg = export(pcA, seasonA, "Hobby Club 2026");
    ClubPackageImporter importer = new ClubPackageImporter(pcB);
    ClubImport.Preview preview = importer.preview(pkg);
    ClubImport.CommitRequest req = new ClubImport.CommitRequest();
    req.packageData = preview.packageData;
    for (ClubImport.Item d : preview.drivers) {
      if ("Abby".equals(d.name)) {
        d.resolution = ItemResolution.CREATE; // a different Abby: add as new
        req.drivers.add(d);
      }
    }

    importer.commit(req);

    assertNotNull(driverIdByName(pcB, "Abby"));
    assertNotNull(driverIdByName(pcB, "Abby (2)"));
  }

  @Test
  public void testUpdatingADriverTakesTheNicknameFromThePackage() throws Exception {
    String daveOnB = pcB.getNextSequence("drivers");
    new SqliteRepository<>(pcB, "drivers", Driver.class)
        .insert(
            new Driver.Builder()
                .withName("Dave Jackson")
                .withNickname("DJ")
                .withEntityId(daveOnB)
                .build());
    JsonNode pkg = export(pcA, seasonA, "Hobby Club 2026");
    ClubPackageImporter importer = new ClubPackageImporter(pcB);
    ClubImport.Preview preview = importer.preview(pkg);
    for (ClubImport.Item d : preview.drivers) {
      if ("Dave Jackson".equals(d.name)) {
        d.resolution = ItemResolution.UPDATE;
      }
    }
    ClubImport.CommitRequest req = new ClubImport.CommitRequest();
    req.packageData = preview.packageData;
    req.drivers = preview.drivers;

    importer.commit(req);

    assertEquals(
        "Dave",
        new SqliteRepository<>(pcB, "drivers", Driver.class).findByEntityId(daveOnB).getNickname());
  }

  @Test
  public void testMergingIntoASeasonWithTheSameName() throws Exception {
    String existing = pcB.getNextSequence("seasons");
    new SqliteRepository<>(pcB, "seasons", Season.class)
        .insert(new Season("Hobby Club 2026", 0, new ArrayList<>(), existing, null));

    ClubImport.Preview preview =
        new ClubPackageImporter(pcB).preview(export(pcA, seasonA, "Hobby Club 2026"));

    assertEquals(MatchType.NAME, preview.season.matchType);
    assertEquals(existing, preview.season.existingId);
    assertEquals(SeasonResolution.MERGE, preview.season.resolution);
    assertEquals(Integer.valueOf(0), preview.season.existingDrops);
    assertEquals(1, preview.season.packageDrops);

    ClubImport.Result result = importAll(pcB, preview.packageData);
    assertEquals(existing, result.seasonId);
    assertEquals(
        1,
        new SqliteRepository<>(pcB, "seasons", Season.class).findByEntityId(existing).getDrops());
  }

  @Test
  public void testTrackHardwareOnTheReceivingPcIsKept() throws Exception {
    String trackOnB = pcB.getNextSequence("tracks");
    ObjectNode t = ClubPackageFormat.MAPPER.createObjectNode();
    t.put("name", "Home Track");
    t.put("entity_id", trackOnB);
    t.put("_id", trackOnB);
    ArrayNode lanes = t.putArray("lanes");
    for (int i = 0; i < 3; i++) {
      // Lanes as RC AI stores them, with their own @id
      lanes.addObject().put("background_color", "#999999").put("length", 10);
    }
    t.putArray("arduino_configs").addObject().put("comm_port", "COM3");
    addObjectIds(t);
    SqliteRepository<Track> tracks = new SqliteRepository<>(pcB, "tracks", Track.class);
    tracks.saveRawJson(trackOnB, t.toString());

    JsonNode pkg = export(pcA, seasonA, "Hobby Club 2026");
    ClubPackageImporter importer = new ClubPackageImporter(pcB);
    ClubImport.Preview preview = importer.preview(pkg);
    assertTrue(preview.tracks.get(0).differences.contains("CRI_DIFF_LANE_COLORS"));
    preview.tracks.get(0).resolution = ItemResolution.UPDATE;
    ClubImport.CommitRequest req = new ClubImport.CommitRequest();
    req.packageData = preview.packageData;
    req.tracks = preview.tracks;
    importer.commit(req);

    String raw = tracks.findRawJsonByEntityId(trackOnB);
    assertTrue(raw.contains("COM3")); // B's own interface settings stay
    Lane lane2 = tracks.findByEntityId(trackOnB).getLanes().get(1);
    assertEquals("#00ff00", lane2.getBackground_color()); // colours from the club
  }

  @Test
  public void testNotAClubPackageIsRejected() throws Exception {
    ObjectNode notOurs = ClubPackageFormat.MAPPER.createObjectNode();
    notOurs.put("format", "something-else");
    try {
      new ClubPackageImporter(pcB).preview(notOurs);
      fail("expected an error");
    } catch (IllegalArgumentException e) {
      assertEquals("CRI_ERR_NOT_A_CLUB_PACKAGE", e.getMessage());
    }
  }

  @Test
  public void testDemoRaceNightsAreNotExported() throws Exception {
    SqliteRepository<Season> seasons = new SqliteRepository<>(pcA, "seasons", Season.class);
    ObjectNode s =
        (ObjectNode) ClubPackageFormat.MAPPER.readTree(seasons.findRawJsonByEntityId(seasonA));
    ((ObjectNode) s.path("races").get(1)).put("is_demo", true);
    seasons.saveRawJson(seasonA, s.toString());

    JsonNode pkg = export(pcA, seasonA, "Hobby Club 2026");

    assertEquals(1, pkg.path("race_nights").size());
  }
}
