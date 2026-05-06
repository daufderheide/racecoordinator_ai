package com.antigravity.service;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.AudioConfig;
import com.antigravity.models.Driver;
import com.antigravity.models.GlobalStatistics;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.HeatScoring.FinishMethod;
import com.antigravity.models.HeatScoring.HeatRanking;
import com.antigravity.models.HeatScoring.HeatRankingTiebreaker;
import com.antigravity.models.Lane;
import com.antigravity.models.OverallScoring;
import com.antigravity.models.Race;
import com.antigravity.models.RaceHistoryRecord;
import com.antigravity.models.Team;
import com.antigravity.models.Track;
import com.antigravity.proto.AssetMessage;
import com.antigravity.protocols.arduino.ArduinoConfig;
import com.antigravity.race.Heat;
import com.antigravity.race.RaceParticipant;
import com.antigravity.race.RaceSaveData;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.FindOneAndUpdateOptions;
import com.mongodb.client.model.ReplaceOptions;
import com.mongodb.client.model.ReturnDocument;
import com.mongodb.client.model.Updates;
import com.mongodb.client.result.DeleteResult;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import org.bson.Document;
import org.bson.types.ObjectId;

public class DatabaseService {
  private static final org.slf4j.Logger logger =
      org.slf4j.LoggerFactory.getLogger(DatabaseService.class);
  private static DatabaseService instance = new DatabaseService();

  public static DatabaseService getInstance() {
    return instance;
  }

  public static void setInstance(DatabaseService service) {
    instance = service;
  }

  public DatabaseService() {}

  public void resetToFactory(DatabaseContext context, MongoDatabase database) {
    logger.info("Resetting database to factory settings...");

    resetDrivers(context, database);
    resetTeams(context, database);
    Track track = resetTracks(database);
    // Races must come after tracks because races include tracks
    resetRaces(database, track);

    logger.info("Database reset complete.");
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

    AssetMessage penaltySound =
        allAssets.stream().filter(a -> a.getName().equals("Penalty")).findFirst().orElse(null);

    String lapSoundUrl = beepSound != null ? beepSound.getUrl() : null;
    String bestLapSoundUrl = drivebySound != null ? drivebySound.getUrl() : null;
    String penaltySoundUrl = penaltySound != null ? penaltySound.getUrl() : null;
    AudioConfig lapAudio = new AudioConfig("preset", lapSoundUrl, null);
    AudioConfig bestLapAudio = new AudioConfig("preset", bestLapSoundUrl, null);
    AudioConfig penaltyAudio = new AudioConfig("preset", penaltySoundUrl, null);

    List<Driver> initialDrivers = new ArrayList<>();
    initialDrivers.add(
        createDriver(
            "Abby",
            "Bank Farter",
            helmetAssets,
            1,
            lapAudio,
            bestLapAudio,
            penaltyAudio,
            getNextSequence(database, "drivers")));
    initialDrivers.add(
        createDriver(
            "Andrea",
            "The Pants",
            helmetAssets,
            2,
            lapAudio,
            bestLapAudio,
            penaltyAudio,
            getNextSequence(database, "drivers")));
    initialDrivers.add(
        createDriver(
            "Austin",
            "Sports Mode",
            helmetAssets,
            3,
            lapAudio,
            bestLapAudio,
            penaltyAudio,
            getNextSequence(database, "drivers")));
    initialDrivers.add(
        createDriver(
            "Christine",
            "Peo Fuente",
            helmetAssets,
            4,
            lapAudio,
            bestLapAudio,
            penaltyAudio,
            getNextSequence(database, "drivers")));
    initialDrivers.add(
        createDriver(
            "Dave",
            "Bad Cheese",
            helmetAssets,
            5,
            lapAudio,
            bestLapAudio,
            penaltyAudio,
            getNextSequence(database, "drivers")));
    initialDrivers.add(
        createDriver(
            "Gene",
            "Swamper Gene",
            helmetAssets,
            6,
            lapAudio,
            bestLapAudio,
            penaltyAudio,
            getNextSequence(database, "drivers")));
    initialDrivers.add(
        createDriver(
            "Meyer",
            "Bull Dog",
            helmetAssets,
            7,
            lapAudio,
            bestLapAudio,
            penaltyAudio,
            getNextSequence(database, "drivers")));
    initialDrivers.add(
        createDriver(
            "Noah Jack",
            "Boy Wonder",
            helmetAssets,
            8,
            lapAudio,
            bestLapAudio,
            penaltyAudio,
            getNextSequence(database, "drivers")));

    driverCollection.insertMany(initialDrivers);
    logger.info("Drivers reset.");
  }

  private Driver createDriver(
      String name,
      String nickname,
      List<AssetMessage> helmetAssets,
      int index,
      AudioConfig lapAudio,
      AudioConfig bestLapAudio,
      AudioConfig penaltyAudio,
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
        penaltyAudio,
        null,
        null,
        null,
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
        new Track("The Heights", 100, lanes, configs, getNextSequence(database, "tracks"), null);

    trackCollection.insertOne(track);
    logger.info("Tracks reset.");
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
            FinishMethod.Timed, 60, HeatRanking.LAP_COUNT, HeatRankingTiebreaker.AVERAGE_LAP_TIME);
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

    logger.info("Races reset.");
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
    logger.info("Teams reset.");
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
    return new Track("New Track", 100, lanes, configs, null, null);
  }

  public void saveRaceHistory(
      MongoDatabase database, com.antigravity.race.Race runtimeRace) { // fqn-collision
    if (runtimeRace == null) {
      return;
    }
    boolean isDemo = runtimeRace.isDemoMode();
    try {
      MongoCollection<RaceHistoryRecord> collection =
          database.getCollection(
              getCollectionName("race_history", isDemo), RaceHistoryRecord.class);
      RaceHistoryRecord record = new RaceHistoryRecord();
      if (runtimeRace.getRaceModel() != null) {
        record.setOriginalEntityId(runtimeRace.getRaceModel().getEntityId());
        record.setModel(runtimeRace.getRaceModel());
      }
      record.setTrack(runtimeRace.getTrack());
      record.setDrivers(runtimeRace.getDrivers());
      record.setHeats(runtimeRace.getHeats());
      record.setAccumulatedRaceTime(runtimeRace.getRaceTime());
      record.setStatistics(runtimeRace.getStatistics());
      if (runtimeRace.getRaceModel() != null) {
        record.setCarClass(runtimeRace.getRaceModel().getCarClass());
      }

      collection.insertOne(record);
      logger.info("Race successfully saved to {}", collection.getNamespace().getCollectionName());
    } catch (Exception e) {
      logger.error("Failed to save race to history", e);
    }
  }

  public void updateGlobalStatistics(
      MongoDatabase database, com.antigravity.race.Race runtimeRace) { // fqn-collision
    if (runtimeRace == null) return;
    boolean isDemo = runtimeRace.isDemoMode();
    String raceId =
        runtimeRace.getRaceModel() != null ? runtimeRace.getRaceModel().getEntityId() : "unknown";
    try {
      MongoCollection<GlobalStatistics> statsCollection =
          database.getCollection(
              getCollectionName("global_statistics", isDemo), GlobalStatistics.class);
      GlobalStatistics stats = statsCollection.find(Filters.eq("race_entity_id", raceId)).first();
      if (stats == null) {
        stats = new GlobalStatistics(raceId);
        statsCollection.insertOne(stats);
      }

      stats.addRaceCount();

      if (runtimeRace.getStatistics() != null) {
        stats.addRaceTimeMs(runtimeRace.getStatistics().getDurationMillis());
      }

      double totalLaps = 0;
      for (RaceParticipant p : runtimeRace.getDrivers()) {
        totalLaps += p.getTotalLaps();
      }
      stats.addLaps(totalLaps);

      // Save overall records from the runtime race object
      stats.setFastestLapTime(runtimeRace.getOverallFastestLap());
      stats.setFastestLapDriverName(runtimeRace.getOverallFastestLapHolder());
      stats.setFastestLapDriverNickname(runtimeRace.getOverallFastestLapHolderNickname());
      stats.setFastestLapTeamName(runtimeRace.getOverallFastestLapHolderTeamName());
      stats.setFastestLapDate(runtimeRace.getOverallFastestLapDate());

      stats.setHighestScore(runtimeRace.getOverallHighestScoreValue());
      stats.setHighestScoreHolderName(runtimeRace.getOverallHighestScoreHolder());
      stats.setHighestScoreHolderNickname(runtimeRace.getOverallHighestScoreHolderNickname());
      stats.setHighestScoreTeamName(runtimeRace.getOverallHighestScoreHolderTeamName());
      stats.setHighestScoreDate(runtimeRace.getOverallHighestScoreDate());

      if (runtimeRace.getTrack() != null) {
        stats.setFastestLapTrackName(runtimeRace.getTrack().getName());
        stats.setHighestScoreTrackName(runtimeRace.getTrack().getName());
      }

      // Save per-lane records
      stats.setLaneFastestLapTimes(new ArrayList<>(runtimeRace.getOverallLaneFastestLapTimes()));
      stats.setLaneFastestLapDriverNames(
          new ArrayList<>(runtimeRace.getOverallLaneFastestLapHolders()));
      stats.setLaneFastestLapDriverNicknames(
          new ArrayList<>(runtimeRace.getOverallLaneFastestLapHolderNicknames()));
      stats.setLaneFastestLapTeamNames(
          new ArrayList<>(runtimeRace.getOverallLaneFastestLapHolderTeamNames()));
      stats.setLaneFastestLapDates(new ArrayList<>(runtimeRace.getOverallLaneFastestLapDates()));
      stats.setLaneHighestScores(new ArrayList<>(runtimeRace.getOverallLaneHighestScores()));
      stats.setLaneHighestScoreHolderNames(
          new ArrayList<>(runtimeRace.getOverallLaneHighestScoreHolders()));
      stats.setLaneHighestScoreHolderNicknames(
          new ArrayList<>(runtimeRace.getOverallLaneHighestScoreHolderNicknames()));
      stats.setLaneHighestScoreTeamNames(
          new ArrayList<>(runtimeRace.getOverallLaneHighestScoreHolderTeamNames()));
      stats.setLaneHighestScoreDates(
          new ArrayList<>(runtimeRace.getOverallLaneHighestScoreDates()));

      statsCollection.replaceOne(
          Filters.eq("race_entity_id", raceId), stats, new ReplaceOptions().upsert(true));
      logger.info("Race statistics updated for race: {}", raceId);
    } catch (Exception e) {
      logger.error("Failed to update global statistics for race {}", raceId, e);
    }
  }

  public GlobalStatistics getGlobalStatistics(
      MongoDatabase database, String raceEntityId, boolean isDemo) {
    if (raceEntityId == null) {
      return new GlobalStatistics();
    }
    MongoCollection<GlobalStatistics> statsCollection =
        database.getCollection(
            getCollectionName("global_statistics", isDemo), GlobalStatistics.class);
    GlobalStatistics stats =
        statsCollection.find(Filters.eq("race_entity_id", raceEntityId)).first();
    if (stats == null) {
      return new GlobalStatistics(raceEntityId);
    }
    return stats;
  }

  public List<RaceHistoryRecord> getRaceHistory(MongoDatabase database, boolean isDemo) {
    MongoCollection<RaceHistoryRecord> collection =
        database.getCollection(getCollectionName("race_history", isDemo), RaceHistoryRecord.class);
    List<RaceHistoryRecord> history = new ArrayList<>();
    // You could sort by _id descending to get newest first natively, but BSON
    // default works for now.
    collection.find().into(history);
    return history;
  }

  public RaceHistoryRecord getRaceHistoryById(MongoDatabase database, String id, boolean isDemo) {
    MongoCollection<RaceHistoryRecord> collection =
        database.getCollection(getCollectionName("race_history", isDemo), RaceHistoryRecord.class);
    return collection.find(Filters.eq("_id", new ObjectId(id))).first();
  }

  public boolean deleteRaceHistoryById(MongoDatabase database, String id, boolean isDemo) {
    try {
      MongoCollection<RaceHistoryRecord> collection =
          database.getCollection(getCollectionName("race_history", isDemo), RaceHistoryRecord.class);
      DeleteResult result = collection.deleteOne(Filters.eq("_id", new ObjectId(id)));
      return result.getDeletedCount() > 0;
    } catch (Exception e) {
      System.err.println("Failed to delete race history record " + id + ": " + e.getMessage());
      return false;
    }
  }

  public void upsertAutoSave(MongoDatabase database, RaceSaveData data) {
    if (data == null) {
      return;
    }
    boolean isDemo = data.isDemoMode();
    try {
      MongoCollection<RaceSaveData> collection =
          database.getCollection(getCollectionName("saved_races", isDemo), RaceSaveData.class);
      ReplaceOptions options = new ReplaceOptions().upsert(true);
      collection.replaceOne(Filters.eq("saveName", data.getSaveName()), data, options);
    } catch (Exception e) {
      logger.error("Failed to auto-save race", e);
    }
  }

  public void saveManualRace(MongoDatabase database, RaceSaveData data) {
    if (data == null) {
      return;
    }
    boolean isDemo = data.isDemoMode();
    try {
      MongoCollection<RaceSaveData> collection =
          database.getCollection(getCollectionName("saved_races", isDemo), RaceSaveData.class);
      collection.insertOne(data);
    } catch (Exception e) {
      logger.error("Failed to save race manually", e);
    }
  }

  public List<RaceSaveData> getSavedRaces(MongoDatabase database, boolean isDemo) {
    long startTime = System.currentTimeMillis();
    String collectionName = getCollectionName("saved_races", isDemo);
    MongoCollection<RaceSaveData> collection =
        database.getCollection(collectionName, RaceSaveData.class);

    long totalDocs = collection.countDocuments();
    logger.info(
        "DIAGNOSTIC: Loading saved races from collection {}. Total documents found: {}",
        collectionName,
        totalDocs);

    List<RaceSaveData> saves = new ArrayList<>();
    try {
      collection
          .find()
          .forEach(
              race -> {
                try {
                  if (race != null) {
                    // Re-initialize transient standings after load
                    if (race.getHeats() != null && race.getModel() != null) {
                      for (Heat heat : race.getHeats()) {
                        heat.initializeStandings(race.getModel().getHeatScoring());
                      }
                    }

                    saves.add(race);
                    logger.info(
                        "DIAGNOSTIC: Successfully loaded and initialized race: {}",
                        (race.getSaveName() != null ? race.getSaveName() : "Unnamed"));
                  } else {
                    logger.error("DIAGNOSTIC: Received null race object from MongoDB iterator.");
                  }
                } catch (Exception e) {
                  logger.error(
                      "DIAGNOSTIC: Error decoding/initializing a single race record, skipping: {}",
                      e.getMessage(),
                      e);
                }
              });
    } catch (Exception e) {
      logger.error("DIAGNOSTIC: Fatal error during race collection iteration", e);
    }

    logger.info(
        "DIAGNOSTIC: Finished loading saved races. Successfully loaded {}/{} records in {}ms",
        saves.size(),
        totalDocs,
        (System.currentTimeMillis() - startTime));
    return saves;
  }

  public RaceSaveData getSavedRace(MongoDatabase database, String saveName, boolean isDemo) {
    if (database == null) {
      return null;
    }
    MongoCollection<RaceSaveData> collection =
        database.getCollection(getCollectionName("saved_races", isDemo), RaceSaveData.class);
    return collection.find(Filters.eq("saveName", saveName)).first();
  }

  public boolean deleteSavedRace(MongoDatabase database, String saveName, boolean isDemo) {
    if (database == null) {
      return false;
    }
    MongoCollection<RaceSaveData> collection =
        database.getCollection(getCollectionName("saved_races", isDemo), RaceSaveData.class);
    DeleteResult result = collection.deleteOne(Filters.eq("saveName", saveName));
    return result.getDeletedCount() > 0;
  }

  public void deleteAllRaceData(MongoDatabase database, String raceEntityId) {
    if (database == null || raceEntityId == null || raceEntityId.isEmpty()) {
      return;
    }

    try {
      // 1. Delete history records
      database
          .getCollection(getCollectionName("race_history", false))
          .deleteMany(Filters.eq("original_entity_id", raceEntityId));
      database
          .getCollection(getCollectionName("race_history", true))
          .deleteMany(Filters.eq("original_entity_id", raceEntityId));

      // 2. Delete global statistics
      database
          .getCollection(getCollectionName("global_statistics", false))
          .deleteMany(Filters.eq("race_entity_id", raceEntityId));
      database
          .getCollection(getCollectionName("global_statistics", true))
          .deleteMany(Filters.eq("race_entity_id", raceEntityId));

      // 3. Delete saved races and auto-saves
      database
          .getCollection(getCollectionName("saved_races", false))
          .deleteMany(Filters.eq("model.entity_id", raceEntityId));
      database
          .getCollection(getCollectionName("saved_races", true))
          .deleteMany(Filters.eq("model.entity_id", raceEntityId));

      logger.info("Cascading deletion complete for race records: {}", raceEntityId);
    } catch (Exception e) {
      logger.error("Failed to perform cascading deletion for race {}", raceEntityId, e);
    }
  }

  private String getCollectionName(String baseName, boolean isDemo) {
    return isDemo ? "demo_" + baseName : baseName;
  }
}
