package com.antigravity.service;

import com.antigravity.models.Driver;
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
        initialDrivers.add(new Driver("Abby", "Angel"));
        initialDrivers.add(new Driver("Andrea", "The Pants"));
        initialDrivers.add(new Driver("Austin", "Fart Goblin"));
        initialDrivers.add(new Driver("Christine", "Peo Fuente"));
        initialDrivers.add(new Driver("Dave", "Olden McGroin"));
        initialDrivers.add(new Driver("Gene", "Swamper Gene"));
        initialDrivers.add(new Driver("Meyer", "Bull Dog"));
        initialDrivers.add(new Driver("Noah Jack", "Boy Wonder"));

        for (Driver driver : initialDrivers) {
            driver.setEntityId(getNextSequence(database, "drivers"));
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
        Lane l1 = new Lane("#ef4444", "black", 100);
        l1.setEntityId(getNextSequence(database, "lanes"));
        lanes.add(l1);

        Lane l2 = new Lane("#ffffff", "black", 100);
        l2.setEntityId(getNextSequence(database, "lanes"));
        lanes.add(l2);

        Lane l3 = new Lane("#3b82f6", "black", 100);
        l3.setEntityId(getNextSequence(database, "lanes"));
        lanes.add(l3);

        Lane l4 = new Lane("#fbbf24", "black", 100);
        l4.setEntityId(getNextSequence(database, "lanes"));
        lanes.add(l4);

        Track track = new Track("Bright Plume Raceway", lanes);
        track.setEntityId(getNextSequence(database, "tracks"));

        trackCollection.insertOne(track);
        System.out.println("Tracks reset.");
        return track;
    }

    private void resetRaces(MongoDatabase database, Track track) {
        MongoCollection<Race> raceCollection = database.getCollection("races", Race.class);
        raceCollection.drop();

        // Reset sequence
        resetSequence(database, "races");

        Race race = new Race("Round Robin", track.getEntityId());
        race.setEntityId(getNextSequence(database, "races"));

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
}
