package com.antigravity.service;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.Driver;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.HeatScoring.FinishMethod;
import com.antigravity.models.HeatScoring.HeatRanking;
import com.antigravity.models.HeatScoring.HeatRankingTiebreaker;
import com.antigravity.models.Lane;
import com.antigravity.models.OverallScoring;
import com.antigravity.models.Race;
import com.antigravity.models.Team;
import com.antigravity.models.Track;
import com.antigravity.proto.AssetMessage;
import com.antigravity.protocols.arduino.ArduinoConfig;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.FindOneAndUpdateOptions;
import com.mongodb.client.model.ReturnDocument;
import com.mongodb.client.model.Updates;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import org.bson.Document;

public class DatabaseService {

  public void resetToFactory(DatabaseContext context, MongoDatabase database) {
    System.out.println("Resetting database to factory settings...");

    resetDrivers(context, database);
    resetTeams(context, database);
    Track track = resetTracks(database);
    // Races must come after tracks because races include tracks
    resetRaces(database, track);
    // Reset screens to default configuration
    resetScreens(database);

    System.out.println("Database reset complete.");
  }

  private void resetDrivers(DatabaseContext context, MongoDatabase database) {
    MongoCollection<Driver> driverCollection = database.getCollection("drivers", Driver.class);
    driverCollection.drop(); // Clear all existing data

    // Reset sequence
    resetSequence(database, "drivers");

    // Fetch assets
    AssetService assetService =
        new AssetService(database, context.getDataRoot() + database.getName() + "/assets");
    List<AssetMessage> allAssets = assetService.getAllAssets();

    List<AssetMessage> helmetAssets =
        allAssets.stream()
            .filter(a -> a.getName().toLowerCase().contains("helmet"))
            .collect(Collectors.toList());

    AssetMessage beepSound =
        allAssets.stream()
            .filter(a -> a.getName().toLowerCase().contains("beep"))
            .findFirst()
            .orElse(null);

    AssetMessage drivebySound =
        allAssets.stream().filter(a -> a.getName().equals("Lap Driveby")).findFirst().orElse(null);

    String lapSoundUrl = beepSound != null ? beepSound.getUrl() : null;
    String bestLapSoundUrl = drivebySound != null ? drivebySound.getUrl() : null;
    Driver.AudioConfig lapAudio = new Driver.AudioConfig("preset", lapSoundUrl, null);
    Driver.AudioConfig bestLapAudio = new Driver.AudioConfig("preset", bestLapSoundUrl, null);

    List<Driver> initialDrivers = new ArrayList<>();
    initialDrivers.add(
        createDriver(
            "Abby",
            "Abs",
            helmetAssets,
            1,
            lapAudio,
            bestLapAudio,
            getNextSequence(database, "drivers")));
    initialDrivers.add(
        createDriver(
            "Andrea",
            "The Pants",
            helmetAssets,
            2,
            lapAudio,
            bestLapAudio,
            getNextSequence(database, "drivers")));
    initialDrivers.add(
        createDriver(
            "Austin",
            "Fart Goblin",
            helmetAssets,
            3,
            lapAudio,
            bestLapAudio,
            getNextSequence(database, "drivers")));
    initialDrivers.add(
        createDriver(
            "Christine",
            "Peo Fuente",
            helmetAssets,
            4,
            lapAudio,
            bestLapAudio,
            getNextSequence(database, "drivers")));
    initialDrivers.add(
        createDriver(
            "Dave",
            "Olden McGroin",
            helmetAssets,
            5,
            lapAudio,
            bestLapAudio,
            getNextSequence(database, "drivers")));
    initialDrivers.add(
        createDriver(
            "Gene",
            "Swamper Gene",
            helmetAssets,
            6,
            lapAudio,
            bestLapAudio,
            getNextSequence(database, "drivers")));
    initialDrivers.add(
        createDriver(
            "Meyer",
            "Bull Dog",
            helmetAssets,
            7,
            lapAudio,
            bestLapAudio,
            getNextSequence(database, "drivers")));
    initialDrivers.add(
        createDriver(
            "Noah Jack",
            "Boy Wonder",
            helmetAssets,
            8,
            lapAudio,
            bestLapAudio,
            getNextSequence(database, "drivers")));

    driverCollection.insertMany(initialDrivers);
    System.out.println("Drivers reset.");
  }

  private Driver createDriver(
      String name,
      String nickname,
      List<AssetMessage> helmetAssets,
      int index,
      Driver.AudioConfig lapAudio,
      Driver.AudioConfig bestLapAudio,
      String sequenceId) {
    String avatarUrl = null;
    if (!helmetAssets.isEmpty()) {
      avatarUrl = helmetAssets.get((index - 1) % helmetAssets.size()).getUrl();
    }
    return new Driver(
        name,
        nickname,
        avatarUrl,
        lapAudio,
        bestLapAudio,
        null,
        null,
        null,
        null,
        null,
        null,
        sequenceId,
        null);
  }

  private Track resetTracks(MongoDatabase database) {
    MongoCollection<Track> trackCollection = database.getCollection("tracks", Track.class);
    if (trackCollection.countDocuments() > 0) {
      return trackCollection.find().first();
    }

    trackCollection.drop(); // Clear all existing data

    // Reset sequence
    resetSequence(database, "tracks");
    resetSequence(database, "lanes");

    List<Lane> lanes = new ArrayList<>();
    // Client expects: background_color=COLOR, foreground_color=BLACK
    Lane l1 = new Lane("#ef4444", "black", 0, getNextSequence(database, "lanes"), null);
    lanes.add(l1);
    Lane l2 = new Lane("#ffffff", "black", 0, getNextSequence(database, "lanes"), null);
    lanes.add(l2);
    Lane l3 = new Lane("#3b82f6", "black", 0, getNextSequence(database, "lanes"), null);
    lanes.add(l3);
    Lane l4 = new Lane("#fbbf24", "black", 0, getNextSequence(database, "lanes"), null);
    lanes.add(l4);

    ArduinoConfig config = new ArduinoConfig();
    List<ArduinoConfig> configs = new ArrayList<>();
    configs.add(config);
    Track track =
        new Track("The Heights", lanes, configs, getNextSequence(database, "tracks"), null);

    trackCollection.insertOne(track);
    System.out.println("Tracks reset.");
    return track;
  }

  private void resetRaces(MongoDatabase database, Track track) {
    MongoCollection<Race> raceCollection = database.getCollection("races", Race.class);
    raceCollection.drop();

    // Reset sequence
    resetSequence(database, "races");

    // Basic Round Robin race
    HeatScoring heatScoring =
        new HeatScoring(
            FinishMethod.Timed, 60, HeatRanking.LAP_COUNT, HeatRankingTiebreaker.FASTEST_LAP_TIME);
    OverallScoring overallScoring = new OverallScoring();

    Race race =
        new Race.Builder()
            .withName("Time Based")
            .withTrackEntityId(track.getEntityId())
            .withHeatRotationType(HeatRotationType.RoundRobin)
            .withHeatScoring(heatScoring)
            .withOverallScoring(overallScoring)
            .withMinLapTime(3.0)
            .withAutoAdvanceTime(0.0)
            .withAutoStartTime(0.0)
            .withAutoAdvanceWarmupTime(0.0)
            .withAutoStartWarmupTime(0.0)
            .withEntityId(getNextSequence(database, "races"))
            .build();

    raceCollection.insertOne(race);

    // Race 2
    heatScoring =
        new HeatScoring(
            FinishMethod.Lap, 15, HeatRanking.LAP_COUNT, HeatRankingTiebreaker.FASTEST_LAP_TIME);

    race =
        new Race.Builder()
            .withName("Lap Based")
            .withTrackEntityId(track.getEntityId())
            .withHeatRotationType(HeatRotationType.FriendlyRoundRobin)
            .withHeatScoring(heatScoring)
            .withOverallScoring(overallScoring)
            .withMinLapTime(3.0)
            .withAutoAdvanceTime(0.0)
            .withAutoStartTime(0.0)
            .withAutoAdvanceWarmupTime(0.0)
            .withAutoStartWarmupTime(0.0)
            .withEntityId(getNextSequence(database, "races"))
            .build();

    raceCollection.insertOne(race);

    System.out.println("Races reset.");
  }

  private void resetScreens(MongoDatabase database) {
    MongoCollection<com.antigravity.models.RaceScreen> screenCollection = 
        database.getCollection("screens", com.antigravity.models.RaceScreen.class);
    screenCollection.drop(); // Clear all existing data

    // Reset sequence
    resetSequence(database, "screens");

    // Create default race screen with same values as client Settings.DEFAULT_COLUMNS
    String entityId = getNextSequence(database, "screens");
    com.antigravity.models.RaceScreen defaultScreen = new com.antigravity.models.RaceScreen(
        "Default Race Screen", entityId, null);
    
    screenCollection.insertOne(defaultScreen);
    System.out.println("Screens reset.");
  }

  private void resetTeams(DatabaseContext context, MongoDatabase database) {
    MongoCollection<Team> teamCollection = database.getCollection("teams", Team.class);
    teamCollection.drop();
    resetSequence(database, "teams");

    MongoCollection<Driver> driverCollection = database.getCollection("drivers", Driver.class);

    List<String> boysNames = Arrays.asList("Austin", "Dave", "Gene");
    List<String> girlsNames = Arrays.asList("Abby", "Andrea", "Christine");

    List<String> boysIds = new ArrayList<>();
    for (String name : boysNames) {
      Driver d = driverCollection.find(Filters.eq("name", name)).first();
      if (d != null) {
        boysIds.add(d.getEntityId());
      }
    }

    List<String> girlsIds = new ArrayList<>();
    for (String name : girlsNames) {
      Driver d = driverCollection.find(Filters.eq("name", name)).first();
      if (d != null) {
        girlsIds.add(d.getEntityId());
      }
    }

    // Fetch assets
    AssetService assetService =
        new AssetService(database, context.getDataRoot() + database.getName() + "/assets");
    List<AssetMessage> allAssets = assetService.getAllAssets();
    List<AssetMessage> helmetAssets =
        allAssets.stream()
            .filter(a -> a.getName().toLowerCase().contains("helmet"))
            .collect(Collectors.toList());

    String boysAvatar = "";
    String girlsAvatar = "";
    if (!helmetAssets.isEmpty()) {
      boysAvatar = helmetAssets.get(0).getUrl();
      if (helmetAssets.size() > 1) {
        girlsAvatar = helmetAssets.get(helmetAssets.size() - 1).getUrl();
      } else {
        girlsAvatar = boysAvatar;
      }
    }

    List<Team> teams = new ArrayList<>();
    teams.add(new Team("The Boys", boysAvatar, boysIds, getNextSequence(database, "teams"), null));
    teams.add(
        new Team("The Girls", girlsAvatar, girlsIds, getNextSequence(database, "teams"), null));

    teamCollection.insertMany(teams);
    System.out.println("Teams reset.");
  }

  private String getNextSequence(MongoDatabase database, String collectionName) {
    MongoCollection<Document> counters = database.getCollection("counters");
    Document counter =
        counters.findOneAndUpdate(
            Filters.eq("_id", collectionName),
            Updates.inc("seq", 1),
            new FindOneAndUpdateOptions().upsert(true).returnDocument(ReturnDocument.AFTER));
    return String.valueOf(counter.getInteger("seq"));
  }

  private void resetSequence(MongoDatabase database, String collectionName) {
    MongoCollection<Document> counters = database.getCollection("counters");
    counters.deleteOne(Filters.eq("_id", collectionName));
  }

  public Race getRace(MongoDatabase database, String entityId) {
    MongoCollection<Race> raceCollection = database.getCollection("races", Race.class);
    return raceCollection.find(Filters.eq("entity_id", entityId)).first();
  }

  public Track getTrack(MongoDatabase database, String entityId) {
    MongoCollection<Track> trackCollection = database.getCollection("tracks", Track.class);
    return trackCollection.find(Filters.eq("entity_id", entityId)).first();
  }

  public Driver getDriver(MongoDatabase database, String entityId) {
    MongoCollection<Driver> driverCollection = database.getCollection("drivers", Driver.class);
    return driverCollection.find(Filters.eq("entity_id", entityId)).first();
  }

  public List<Driver> getDrivers(MongoDatabase database, List<String> entityIds) {
    MongoCollection<Driver> driverCollection = database.getCollection("drivers", Driver.class);
    List<Driver> drivers = new ArrayList<>();
    // Using $in filter would be more efficient, but looping is fine for small
    // numbers
    driverCollection.find(Filters.in("entity_id", entityIds)).into(drivers);
    return drivers;
  }

  public List<Team> getTeams(MongoDatabase database, List<String> entityIds) {
    MongoCollection<Team> teamCollection = database.getCollection("teams", Team.class);
    List<Team> teams = new ArrayList<>();
    teamCollection.find(Filters.in("entity_id", entityIds)).into(teams);
    return teams;
  }

  public List<Team> getAllTeams(MongoDatabase database) {
    MongoCollection<Team> teamCollection = database.getCollection("teams", Team.class);
    List<Team> teams = new ArrayList<>();
    teamCollection.find().into(teams);
    return teams;
  }

  public Track getFactoryTrack() {
    List<Lane> lanes = new ArrayList<>();
    lanes.add(new Lane("#ef4444", "black", 0));
    lanes.add(new Lane("#ffffff", "black", 0));
    lanes.add(new Lane("#3b82f6", "black", 0));
    lanes.add(new Lane("#fbbf24", "black", 0));

    ArduinoConfig config = new ArduinoConfig();
    List<ArduinoConfig> configs = new ArrayList<>();
    configs.add(config);
    return new Track("New Track", lanes, configs, null, null);
  }
}
