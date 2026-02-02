package com.antigravity.service;

import com.antigravity.models.Driver;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.Lane;
import com.antigravity.models.Race;
import com.antigravity.models.Track;
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

                List<Driver> initialDrivers = new ArrayList<>();
                // TODO(aufderheide): Add these back in with default avatars and sounds setup.
                // initialDrivers.add(new Driver("Abby", "Angel", getNextSequence(database,
                // "drivers"), null));
                // initialDrivers.add(new Driver("Andrea", "The Pants",
                // getNextSequence(database, "drivers"), null));
                // initialDrivers.add(new Driver("Austin", "Fart Goblin",
                // getNextSequence(database, "drivers"), null));
                // initialDrivers.add(new Driver("Christine", "Peo Fuente",
                // getNextSequence(database, "drivers"), null));
                // initialDrivers.add(new Driver("Dave", "Olden McGroin",
                // getNextSequence(database, "drivers"), null));
                // initialDrivers.add(new Driver("Gene", "Swamper Gene",
                // getNextSequence(database, "drivers"), null));
                // initialDrivers.add(new Driver("Meyer", "Bull Dog", getNextSequence(database,
                // "drivers"), null));
                // initialDrivers.add(new Driver("Noah Jack", "Boy Wonder",
                // getNextSequence(database, "drivers"), null));

                for (int i = 1; i <= 20; i++) {
                        String name = String.format("Driver %02d", i);
                        String avatarUrl = null;
                        if (!helmetAssets.isEmpty()) {
                                avatarUrl = helmetAssets.get((i - 1) % helmetAssets.size()).getUrl();
                        }

                        initialDrivers.add(new Driver(name, name, avatarUrl, lapSoundUrl, bestLapSoundUrl, "preset",
                                        "preset", null,
                                        null, getNextSequence(database, "drivers"), null));
                }

                driverCollection.insertMany(initialDrivers);
                System.out.println("Drivers reset.");
        }

        private Track resetTracks(MongoDatabase database) {
                MongoCollection<Track> trackCollection = database.getCollection("tracks", Track.class);
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

                Track track = new Track("Bright Plume Raceway", lanes, getNextSequence(database, "tracks"), null);

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
                com.antigravity.models.RaceScoring scoring = new com.antigravity.models.RaceScoring(
                                com.antigravity.models.RaceScoring.FinishMethod.Timed,
                                45,
                                com.antigravity.models.RaceScoring.HeatRanking.LAP_COUNT,
                                com.antigravity.models.RaceScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME);

                Race race = new Race("Time Based", track.getEntityId(), HeatRotationType.RoundRobin,
                                scoring, getNextSequence(database, "races"), null);

                raceCollection.insertOne(race);

                // Race 2
                scoring = new com.antigravity.models.RaceScoring(
                                com.antigravity.models.RaceScoring.FinishMethod.Lap,
                                15,
                                com.antigravity.models.RaceScoring.HeatRanking.LAP_COUNT,
                                com.antigravity.models.RaceScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME);

                race = new Race("Lap Based", track.getEntityId(), HeatRotationType.FriendlyRoundRobin,
                                scoring, getNextSequence(database, "races"), null);

                raceCollection.insertOne(race);

                // Race 3
                scoring = new com.antigravity.models.RaceScoring(
                                com.antigravity.models.RaceScoring.FinishMethod.Lap,
                                15,
                                com.antigravity.models.RaceScoring.HeatRanking.LAP_COUNT,
                                com.antigravity.models.RaceScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME);

                race = new Race("Practice", track.getEntityId(), HeatRotationType.RoundRobin,
                                scoring, getNextSequence(database, "races"), null);

                raceCollection.insertOne(race);

                scoring = new com.antigravity.models.RaceScoring(
                                com.antigravity.models.RaceScoring.FinishMethod.Lap,
                                15,
                                com.antigravity.models.RaceScoring.HeatRanking.LAP_COUNT,
                                com.antigravity.models.RaceScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME);

                // Now just a bunch of races to fill the space
                race = new Race("Race 01", track.getEntityId(), HeatRotationType.RoundRobin,
                                scoring, getNextSequence(database, "races"), null);
                raceCollection.insertOne(race);
                race = new Race("Race 02", track.getEntityId(), HeatRotationType.RoundRobin,
                                scoring, getNextSequence(database, "races"), null);
                raceCollection.insertOne(race);
                race = new Race("Race 03", track.getEntityId(), HeatRotationType.RoundRobin,
                                scoring, getNextSequence(database, "races"), null);
                raceCollection.insertOne(race);
                race = new Race("Race 04", track.getEntityId(), HeatRotationType.RoundRobin,
                                scoring, getNextSequence(database, "races"), null);
                raceCollection.insertOne(race);
                race = new Race("Race 05", track.getEntityId(), HeatRotationType.RoundRobin,
                                scoring, getNextSequence(database, "races"), null);
                raceCollection.insertOne(race);
                race = new Race("Race 06", track.getEntityId(), HeatRotationType.RoundRobin,
                                scoring, getNextSequence(database, "races"), null);
                raceCollection.insertOne(race);
                race = new Race("Race 07", track.getEntityId(), HeatRotationType.RoundRobin,
                                scoring, getNextSequence(database, "races"), null);
                raceCollection.insertOne(race);
                race = new Race("Race 08", track.getEntityId(), HeatRotationType.RoundRobin,
                                scoring, getNextSequence(database, "races"), null);
                raceCollection.insertOne(race);
                race = new Race("Race 09", track.getEntityId(), HeatRotationType.RoundRobin,
                                scoring, getNextSequence(database, "races"), null);
                raceCollection.insertOne(race);
                race = new Race("Race 10", track.getEntityId(), HeatRotationType.RoundRobin,
                                scoring, getNextSequence(database, "races"), null);
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
