package com.antigravity.handlers;

import com.antigravity.models.Driver;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import io.javalin.http.Context;
import java.util.ArrayList;
import java.util.List;

public class DatabaseTaskHandler {
    private final MongoCollection<Driver> driverCollection;
    private final MongoCollection<com.antigravity.models.Track> trackCollection;
    private final MongoCollection<com.antigravity.models.Race> raceCollection;

    public DatabaseTaskHandler(MongoDatabase database, io.javalin.Javalin app) {
        this.driverCollection = database.getCollection("drivers", Driver.class);
        this.trackCollection = database.getCollection("tracks", com.antigravity.models.Track.class);
        this.raceCollection = database.getCollection("races", com.antigravity.models.Race.class);

        app.get("/api/drivers", this::getDrivers);
        app.get("/api/tracks", this::getTracks);
        app.get("/api/races", this::getRaces);
    }

    public void getDrivers(Context ctx) {
        List<Driver> drivers = new ArrayList<>();
        driverCollection.find().forEach(drivers::add);
        ctx.json(drivers);
    }

    public void getTracks(Context ctx) {
        List<com.antigravity.models.Track> tracks = new ArrayList<>();
        trackCollection.find().forEach(tracks::add);
        ctx.json(tracks);
    }

    public void getRaces(Context ctx) {
        List<com.antigravity.models.Race> races = new ArrayList<>();
        raceCollection.find().forEach(races::add);

        List<java.util.Map<String, Object>> response = new ArrayList<>();
        for (com.antigravity.models.Race race : races) {
            com.antigravity.models.Track track = trackCollection
                    .find(com.mongodb.client.model.Filters.eq("entity_id", race.getTrackEntityId())).first();
            java.util.Map<String, Object> raceMap = new java.util.HashMap<>();
            raceMap.put("name", race.getName());
            raceMap.put("entity_id", race.getEntityId());
            raceMap.put("track", track);
            response.add(raceMap);
        }
        ctx.json(response);
    }
}
