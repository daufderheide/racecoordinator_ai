package com.antigravity.service;

import com.antigravity.models.Driver;
import com.antigravity.models.Lane;
import com.antigravity.models.Track;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;

import java.util.ArrayList;
import java.util.List;

public class DatabaseService {

    public void resetToFactory(MongoDatabase database) {
        System.out.println("Resetting database to factory settings...");

        resetDrivers(database);
        resetTracks(database);

        System.out.println("Database reset complete.");
    }

    private void resetDrivers(MongoDatabase database) {
        MongoCollection<Driver> driverCollection = database.getCollection("drivers", Driver.class);
        driverCollection.drop(); // Clear all existing data

        List<Driver> initialDrivers = new ArrayList<>();
        initialDrivers.add(new Driver("Abby", "Angel"));
        initialDrivers.add(new Driver("Andrea", "The Pants"));
        initialDrivers.add(new Driver("Austin", "Fart Goblin"));
        initialDrivers.add(new Driver("Christine", "Peo Fuente"));
        initialDrivers.add(new Driver("Dave", "Olden McGroin"));
        initialDrivers.add(new Driver("Gene", "Swamper Gene"));
        initialDrivers.add(new Driver("Meyer", "Bull Dog"));
        initialDrivers.add(new Driver("Noah Jack", "Boy Wonder"));
        driverCollection.insertMany(initialDrivers);
        System.out.println("Drivers reset.");
    }

    private void resetTracks(MongoDatabase database) {
        MongoCollection<Track> trackCollection = database.getCollection("tracks", Track.class);
        trackCollection.drop(); // Clear all existing data

        List<Lane> lanes = new ArrayList<>();
        // Client expects: background_color=COLOR, foreground_color=BLACK
        lanes.add(new Lane("#ef4444", "black", 100)); // Red
        lanes.add(new Lane("#ffffff", "black", 100)); // White
        lanes.add(new Lane("#3b82f6", "black", 100)); // Blue
        lanes.add(new Lane("#fbbf24", "black", 100)); // Yellow

        Track track = new Track("Bright Plume Raceway", lanes);
        trackCollection.insertOne(track);
        System.out.println("Tracks reset.");
    }
}
