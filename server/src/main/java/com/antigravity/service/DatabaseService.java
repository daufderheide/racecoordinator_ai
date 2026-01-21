package com.antigravity.service;

import com.antigravity.models.Driver;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.Lane;
import com.antigravity.models.Race;
import com.antigravity.models.Track;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;

import java.util.ArrayList;
import java.util.List;

public class DatabaseService {

    public void resetToFactory(MongoDatabase database) {
        System.out.println("Resetting database to factory settings...");

        resetDrivers(database);
        Track track = resetTracks(database);
        resetRaces(database, track);
        // Must be called last to ensure things like races are
        // properly setup and initialized.

        System.out.println("Database reset complete.");
    }

    private void resetDrivers(MongoDatabase database) {
        MongoCollection<Driver> driverCollection = database.getCollection("drivers", Driver.class);
        driverCollection.drop(); // Clear all existing data

        // Reset sequence
        resetSequence(database, "drivers");

        List<Driver> initialDrivers = new ArrayList<>();
        initialDrivers.add(new Driver("Abby", "Angel", getNextSequence(database, "drivers"), null));
        initialDrivers.add(new Driver("Andrea", "The Pants", getNextSequence(database, "drivers"), null));
        initialDrivers.add(new Driver("Austin", "Fart Goblin", getNextSequence(database, "drivers"), null));
        initialDrivers.add(new Driver("Christine", "Peo Fuente", getNextSequence(database, "drivers"), null));
        initialDrivers.add(new Driver("Dave", "Olden McGroin", getNextSequence(database, "drivers"), null));
        initialDrivers.add(new Driver("Gene", "Swamper Gene", getNextSequence(database, "drivers"), null));
        initialDrivers.add(new Driver("Meyer", "Bull Dog", getNextSequence(database, "drivers"), null));
        initialDrivers.add(new Driver("Noah Jack", "Boy Wonder", getNextSequence(database, "drivers"), null));

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

        com.antigravity.models.RaceScoring scoring = new com.antigravity.models.RaceScoring(
                com.antigravity.models.RaceScoring.FinishMethod.Timed,
                45,
                com.antigravity.models.RaceScoring.HeatRanking.LAP_COUNT,
                com.antigravity.models.RaceScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME);

        Race race = new Race("Round Robin", track.getEntityId(), HeatRotationType.RoundRobin,
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
