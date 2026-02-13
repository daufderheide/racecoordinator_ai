package com.antigravity.service;

import com.antigravity.models.Driver;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.Lane;
import com.antigravity.models.Race;
import com.antigravity.models.Track;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.OverallScoring;
import com.antigravity.proto.Asset;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class DatabaseService {
        public void resetToFactory(MongoDatabase database) {
                System.out.println("Resetting database to factory settings...");

                resetDrivers(database);
                Track track = resetTracks(database);
                // Races must come after tracks because races include tracks
                resetRaces(database, track);

                System.out.println("Database reset complete.");
        }

        private void resetDrivers(MongoDatabase database) {
                MongoCollection<Driver> driverCollection = database.getCollection("drivers", Driver.class);
                driverCollection.drop(); // Clear all existing data

                // Reset sequence
                resetSequence(database, "drivers");

                // Fetch assets
                AssetService assetService = new AssetService(database);
                List<Asset> allAssets = assetService.getAllAssets();

                List<Asset> helmetAssets = allAssets.stream()
                                .filter(a -> a.getName().toLowerCase().contains("helmet"))
                                .collect(Collectors.toList());

                Asset beepSound = allAssets.stream()
                                .filter(a -> a.getName().equals("Lap Beep"))
                                .findFirst().orElse(null);

                Asset drivebySound = allAssets.stream()
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

        private Driver createDriver(String name, String nickname, List<Asset> helmetAssets, int index,
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
                                45,
                                HeatScoring.HeatRanking.LAP_COUNT,
                                HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME);
                OverallScoring overallScoring = new OverallScoring();

                Race race = new Race("Time Based", track.getEntityId(), HeatRotationType.RoundRobin,
                                heatScoring, overallScoring, getNextSequence(database, "races"), null);

                raceCollection.insertOne(race);

                // Race 2
                heatScoring = new com.antigravity.models.HeatScoring(
                                com.antigravity.models.HeatScoring.FinishMethod.Lap,
                                15,
                                com.antigravity.models.HeatScoring.HeatRanking.LAP_COUNT,
                                com.antigravity.models.HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME);

                race = new Race("Lap Based", track.getEntityId(), HeatRotationType.FriendlyRoundRobin,
                                heatScoring, overallScoring, getNextSequence(database, "races"), null);

                raceCollection.insertOne(race);

                // Race 3
                heatScoring = new com.antigravity.models.HeatScoring(
                                com.antigravity.models.HeatScoring.FinishMethod.Lap,
                                15,
                                com.antigravity.models.HeatScoring.HeatRanking.LAP_COUNT,
                                com.antigravity.models.HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME);

                race = new Race("Practice", track.getEntityId(), HeatRotationType.RoundRobin,
                                heatScoring, overallScoring, getNextSequence(database, "races"), null);

                raceCollection.insertOne(race);

                heatScoring = new com.antigravity.models.HeatScoring(
                                com.antigravity.models.HeatScoring.FinishMethod.Lap,
                                15,
                                com.antigravity.models.HeatScoring.HeatRanking.LAP_COUNT,
                                com.antigravity.models.HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME);

                // Now just a bunch of races to fill the space
                race = new Race("Race 01", track.getEntityId(), HeatRotationType.RoundRobin,
                                heatScoring, overallScoring, getNextSequence(database, "races"), null);
                raceCollection.insertOne(race);
                race = new Race("Race 02", track.getEntityId(), HeatRotationType.RoundRobin,
                                heatScoring, overallScoring, getNextSequence(database, "races"), null);
                raceCollection.insertOne(race);
                race = new Race("Race 03", track.getEntityId(), HeatRotationType.RoundRobin,
                                heatScoring, overallScoring, getNextSequence(database, "races"), null);
                raceCollection.insertOne(race);
                race = new Race("Race 04", track.getEntityId(), HeatRotationType.RoundRobin,
                                heatScoring, overallScoring, getNextSequence(database, "races"), null);
                raceCollection.insertOne(race);
                race = new Race("Race 05", track.getEntityId(), HeatRotationType.RoundRobin,
                                heatScoring, overallScoring, getNextSequence(database, "races"), null);
                raceCollection.insertOne(race);
                race = new Race("Race 06", track.getEntityId(), HeatRotationType.RoundRobin,
                                heatScoring, overallScoring, getNextSequence(database, "races"), null);
                raceCollection.insertOne(race);
                race = new Race("Race 07", track.getEntityId(), HeatRotationType.RoundRobin,
                                heatScoring, overallScoring, getNextSequence(database, "races"), null);
                raceCollection.insertOne(race);
                race = new Race("Race 08", track.getEntityId(), HeatRotationType.RoundRobin,
                                heatScoring, overallScoring, getNextSequence(database, "races"), null);
                raceCollection.insertOne(race);
                race = new Race("Race 09", track.getEntityId(), HeatRotationType.RoundRobin,
                                heatScoring, overallScoring, getNextSequence(database, "races"), null);
                raceCollection.insertOne(race);
                race = new Race("Race 10", track.getEntityId(), HeatRotationType.RoundRobin,
                                heatScoring, overallScoring, getNextSequence(database, "races"), null);
                raceCollection.insertOne(race);

                System.out.println("Races reset.");
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
}
