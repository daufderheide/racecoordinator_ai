package com.antigravity.service;

import com.antigravity.models.Driver;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.Lane;
import com.antigravity.models.Race;
import com.antigravity.models.Track;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.OverallScoring;
import com.antigravity.proto.AssetMessage;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.antigravity.context.DatabaseContext;
import org.bson.Document;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class DatabaseService {
  public void resetToFactory(DatabaseContext context, MongoDatabase database) {
    System.out.println("Resetting database to factory settings...");

    resetDrivers(context, database);
    resetTeams(context, database);
    Track track = resetTracks(database);
    // Races must come after tracks because races include tracks
    resetRaces(database, track);

    System.out.println("Database reset complete.");
  }

  private void resetDrivers(DatabaseContext context, MongoDatabase database) {
    MongoCollection<Driver> driverCollection = database.getCollection("drivers", Driver.class);
    driverCollection.drop(); // Clear all existing data

    // Reset sequence
    resetSequence(database, "drivers");

    // Fetch assets
    AssetService assetService = new AssetService(database,
        context.getDataRoot() + database.getName() + "/assets");
    List<AssetMessage> allAssets = assetService.getAllAssets();

    List<AssetMessage> helmetAssets = allAssets.stream()
        .filter(a -> a.getName().toLowerCase().contains("helmet"))
        .collect(Collectors.toList());

    AssetMessage beepSound = allAssets.stream()
        .filter(a -> a.getName().equals("Lap Beep"))
        .findFirst().orElse(null);

    AssetMessage drivebySound = allAssets.stream()
        .filter(a -> a.getName().equals("Lap Driveby"))
        .findFirst().orElse(null);

    String lapSoundUrl = beepSound != null ? beepSound.getUrl() : null;
    String bestLapSoundUrl = drivebySound != null ? drivebySound.getUrl() : null;
    Driver.AudioConfig lapAudio = new Driver.AudioConfig("preset", lapSoundUrl, null);
    Driver.AudioConfig bestLapAudio = new Driver.AudioConfig("preset", bestLapSoundUrl, null);

    List<Driver> initialDrivers = new ArrayList<>();
    initialDrivers.add(createDriver("Abby", "Abs", helmetAssets, 1, lapAudio, bestLapAudio,
        getNextSequence(database, "drivers")));
    initialDrivers.add(createDriver("Andrea", "The Pants", helmetAssets, 2, lapAudio, bestLapAudio,
        getNextSequence(database, "drivers")));
    initialDrivers.add(createDriver("Austin", "Fart Goblin", helmetAssets, 3, lapAudio, bestLapAudio,
        getNextSequence(database, "drivers")));
    initialDrivers.add(createDriver("Christine", "Peo Fuente", helmetAssets, 4, lapAudio, bestLapAudio,
        getNextSequence(database, "drivers")));
    initialDrivers.add(createDriver("Dave", "Olden McGroin", helmetAssets, 5, lapAudio, bestLapAudio,
        getNextSequence(database, "drivers")));
    initialDrivers.add(createDriver("Gene", "Swamper Gene", helmetAssets, 6, lapAudio, bestLapAudio,
        getNextSequence(database, "drivers")));
    initialDrivers.add(createDriver("Meyer", "Bull Dog", helmetAssets, 7, lapAudio, bestLapAudio,
        getNextSequence(database, "drivers")));
    initialDrivers.add(createDriver("Noah Jack", "Boy Wonder", helmetAssets, 8, lapAudio, bestLapAudio,
        getNextSequence(database, "drivers")));

    driverCollection.insertMany(initialDrivers);
    System.out.println("Drivers reset.");
  }

  private Driver createDriver(String name, String nickname, List<AssetMessage> helmetAssets, int index,
      Driver.AudioConfig lapAudio, Driver.AudioConfig bestLapAudio, String sequenceId) {
    String avatarUrl = null;
    if (!helmetAssets.isEmpty()) {
      avatarUrl = helmetAssets.get((index - 1) % helmetAssets.size()).getUrl();
    }
    return new Driver(name, nickname, avatarUrl, lapAudio, bestLapAudio,
        null, null, null, null, null, null,
        sequenceId, null);
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
    Lane l1 = new Lane("#ef4444", "black", 100, getNextSequence(database, "lanes"), null);
    lanes.add(l1);

    Lane l2 = new Lane("#ffffff", "black", 100, getNextSequence(database, "lanes"), null);
    lanes.add(l2);

    Lane l3 = new Lane("#3b82f6", "black", 100, getNextSequence(database, "lanes"), null);
    lanes.add(l3);

    Lane l4 = new Lane("#fbbf24", "black", 100, getNextSequence(database, "lanes"), null);
    lanes.add(l4);

    com.antigravity.protocols.arduino.ArduinoConfig config = new com.antigravity.protocols.arduino.ArduinoConfig();
    Track track = new Track("Bright Plume Raceway", lanes, config, getNextSequence(database, "tracks"),
        null);

    trackCollection.insertOne(track);
    System.out.println("Tracks reset.");
    return track;
  }

  private void resetRaces(MongoDatabase database, Track track) {
    MongoCollection<Race> raceCollection = database.getCollection("races", Race.class);
    raceCollection.drop();

    // Reset sequence
    resetSequence(database, "races");

    // TODO(aufderheide): Create a proper set of default races.

    // Basic Round Robin race
    HeatScoring heatScoring = new HeatScoring(
        HeatScoring.FinishMethod.Timed,
        60,
        HeatScoring.HeatRanking.LAP_COUNT,
        HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME);
    OverallScoring overallScoring = new OverallScoring();

    Race race = new Race("Time Based", track.getEntityId(), HeatRotationType.RoundRobin,
        heatScoring, overallScoring, 3.0, getNextSequence(database, "races"), null);

    raceCollection.insertOne(race);

    // Race 2
    heatScoring = new com.antigravity.models.HeatScoring(
        com.antigravity.models.HeatScoring.FinishMethod.Lap,
        15,
        com.antigravity.models.HeatScoring.HeatRanking.LAP_COUNT,
        com.antigravity.models.HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME);

    race = new Race("Lap Based", track.getEntityId(), HeatRotationType.FriendlyRoundRobin,
        heatScoring, overallScoring, 3.0, getNextSequence(database, "races"), null);

    raceCollection.insertOne(race);

    System.out.println("Races reset.");
  }

  private void resetTeams(DatabaseContext context, MongoDatabase database) {
    MongoCollection<com.antigravity.models.Team> teamCollection = database.getCollection("teams",
        com.antigravity.models.Team.class);
    teamCollection.drop();
    resetSequence(database, "teams");

    MongoCollection<Driver> driverCollection = database.getCollection("drivers", Driver.class);

    List<String> boysNames = java.util.Arrays.asList("Austin", "Dave", "Gene");
    List<String> girlsNames = java.util.Arrays.asList("Abby", "Andrea", "Christine");

    List<String> boysIds = new ArrayList<>();
    for (String name : boysNames) {
      Driver d = driverCollection.find(com.mongodb.client.model.Filters.eq("name", name)).first();
      if (d != null) {
        boysIds.add(d.getEntityId());
      }
    }

    List<String> girlsIds = new ArrayList<>();
    for (String name : girlsNames) {
      Driver d = driverCollection.find(com.mongodb.client.model.Filters.eq("name", name)).first();
      if (d != null) {
        girlsIds.add(d.getEntityId());
      }
    }

    // Fetch assets
    AssetService assetService = new AssetService(database,
        context.getDataRoot() + database.getName() + "/assets");
    List<AssetMessage> allAssets = assetService.getAllAssets();
    List<AssetMessage> helmetAssets = allAssets.stream()
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

    List<com.antigravity.models.Team> teams = new ArrayList<>();
    teams.add(new com.antigravity.models.Team("The Boys", boysAvatar, boysIds,
        getNextSequence(database, "teams"), null));
    teams.add(new com.antigravity.models.Team("The Girls", girlsAvatar, girlsIds,
        getNextSequence(database, "teams"), null));

    teamCollection.insertMany(teams);
    System.out.println("Teams reset.");
  }

  private String getNextSequence(MongoDatabase database, String collectionName) {
    MongoCollection<Document> counters = database.getCollection("counters");
    Document counter = counters.findOneAndUpdate(
        com.mongodb.client.model.Filters.eq("_id", collectionName),
        com.mongodb.client.model.Updates.inc("seq", 1),
        new com.mongodb.client.model.FindOneAndUpdateOptions().upsert(true)
            .returnDocument(com.mongodb.client.model.ReturnDocument.AFTER));
    return String.valueOf(counter.getInteger("seq"));
  }

  private void resetSequence(MongoDatabase database, String collectionName) {
    MongoCollection<Document> counters = database.getCollection("counters");
    counters.deleteOne(com.mongodb.client.model.Filters.eq("_id", collectionName));
  }

  public Race getRace(MongoDatabase database, String entityId) {
    MongoCollection<Race> raceCollection = database.getCollection("races", Race.class);
    return raceCollection.find(com.mongodb.client.model.Filters.eq("entity_id", entityId)).first();
  }

  public Track getTrack(MongoDatabase database, String entityId) {
    MongoCollection<Track> trackCollection = database.getCollection("tracks", Track.class);
    return trackCollection.find(com.mongodb.client.model.Filters.eq("entity_id", entityId)).first();
  }

  public Driver getDriver(MongoDatabase database, String entityId) {
    MongoCollection<Driver> driverCollection = database.getCollection("drivers", Driver.class);
    return driverCollection.find(com.mongodb.client.model.Filters.eq("entity_id", entityId)).first();
  }

  public List<Driver> getDrivers(MongoDatabase database, List<String> entityIds) {
    MongoCollection<Driver> driverCollection = database.getCollection("drivers", Driver.class);
    List<Driver> drivers = new ArrayList<>();
    // Using $in filter would be more efficient, but looping is fine for small
    // numbers
    driverCollection.find(com.mongodb.client.model.Filters.in("entity_id", entityIds))
        .into(drivers);
    return drivers;
  }

  public List<com.antigravity.models.Team> getTeams(MongoDatabase database, List<String> entityIds) {
    MongoCollection<com.antigravity.models.Team> teamCollection = database.getCollection("teams",
        com.antigravity.models.Team.class);
    List<com.antigravity.models.Team> teams = new ArrayList<>();
    teamCollection.find(com.mongodb.client.model.Filters.in("entity_id", entityIds))
        .into(teams);
    return teams;
  }

  public List<com.antigravity.models.Team> getAllTeams(MongoDatabase database) {
    MongoCollection<com.antigravity.models.Team> teamCollection = database.getCollection("teams",
        com.antigravity.models.Team.class);
    List<com.antigravity.models.Team> teams = new java.util.ArrayList<>();
    teamCollection.find().into(teams);
    return teams;
  }
}
