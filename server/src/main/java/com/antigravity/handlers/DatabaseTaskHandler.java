package com.antigravity.handlers;

import com.antigravity.models.Driver;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.Filters;
import io.javalin.http.Context;
import java.util.ArrayList;
import java.util.List;

public class DatabaseTaskHandler {
    private final MongoCollection<Driver> driverCollection;
    private final MongoCollection<com.antigravity.models.Track> trackCollection;
    private final MongoCollection<com.antigravity.models.Race> raceCollection;
    private final MongoDatabase database;

    public DatabaseTaskHandler(MongoDatabase database, io.javalin.Javalin app) {
        this.database = database;
        this.driverCollection = database.getCollection("drivers", Driver.class);
        this.trackCollection = database.getCollection("tracks", com.antigravity.models.Track.class);
        this.raceCollection = database.getCollection("races", com.antigravity.models.Race.class);

        app.get("/api/drivers", this::getDrivers);
        app.post("/api/drivers", this::createDriver);
        app.put("/api/drivers/{id}", this::updateDriver);
        app.delete("/api/drivers/{id}", this::deleteDriver);
        app.get("/api/tracks", this::getTracks);
        app.get("/api/races", this::getRaces);
    }

    private void createDriver(Context ctx) {
        try {
            Driver driver = ctx.bodyAsClass(Driver.class);

            // Uniqueness check
            Driver existing = driverCollection.find(Filters.or(
                    Filters.eq("name", driver.getName()),
                    Filters.eq("nickname", driver.getNickname()))).first();

            if (existing != null) {
                ctx.status(409).result("Driver name or nickname already exists");
                return;
            }

            // Generate a new entity_id if not provided or if "new"
            if (driver.getEntityId() == null || driver.getEntityId().isEmpty() || "new".equals(driver.getEntityId())) {
                // We need to access the counters collection to get next sequence
                // For now, let's use a UUID or simple increment if we can
                // Ideally we'd use the same sequence as DatabaseService
                String nextId = getNextSequence("drivers");
                driver = new Driver(
                        driver.getName(),
                        driver.getNickname(),
                        driver.getAvatarUrl(),
                        driver.getLapAudio(),
                        driver.getBestLapAudio(),
                        null, null, null, null, null, null,
                        nextId,
                        null);
            }
            driverCollection.insertOne(driver);
            ctx.status(201).json(driver);
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).result("Error creating driver: " + e.getMessage());
        }
    }

    private void updateDriver(Context ctx) {
        try {
            String id = ctx.pathParam("id");
            Driver driver = ctx.bodyAsClass(Driver.class);

            // Uniqueness check (exclude self)
            Driver existing = driverCollection.find(Filters.and(
                    Filters.ne("entity_id", id),
                    Filters.or(
                            Filters.eq("name", driver.getName()),
                            Filters.eq("nickname", driver.getNickname()))))
                    .first();

            if (existing != null) {
                ctx.status(409).result("Driver name or nickname already exists");
                return;
            }

            driverCollection.replaceOne(com.mongodb.client.model.Filters.eq("entity_id", id), driver);
            ctx.json(driver);
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).result("Error updating driver: " + e.getMessage());
        }
    }

    private void deleteDriver(Context ctx) {
        try {
            String id = ctx.pathParam("id");
            driverCollection.deleteOne(com.mongodb.client.model.Filters.eq("entity_id", id));
            ctx.status(204);
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).result("Error deleting driver: " + e.getMessage());
        }
    }

    private String getNextSequence(String collectionName) {
        MongoCollection<org.bson.Document> counters = database.getCollection("counters");
        org.bson.Document counter = counters.findOneAndUpdate(
                com.mongodb.client.model.Filters.eq("_id", collectionName),
                com.mongodb.client.model.Updates.inc("seq", 1),
                new com.mongodb.client.model.FindOneAndUpdateOptions().upsert(true)
                        .returnDocument(com.mongodb.client.model.ReturnDocument.AFTER));
        return String.valueOf(counter.getInteger("seq"));
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
