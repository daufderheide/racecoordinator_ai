package com.antigravity.handlers;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.Driver;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Filters;
import io.javalin.http.Context;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class DatabaseTaskHandler {
    private final DatabaseContext databaseContext;

    public DatabaseTaskHandler(DatabaseContext databaseContext, io.javalin.Javalin app) {
        this.databaseContext = databaseContext;

        app.get("/api/drivers", this::getDrivers);
        app.post("/api/drivers", this::createDriver);
        app.put("/api/drivers/{id}", this::updateDriver);
        app.delete("/api/drivers/{id}", this::deleteDriver);
        app.get("/api/tracks", this::getTracks);
        app.get("/api/races", this::getRaces);

        app.post("/api/tracks", this::createTrack);
        app.put("/api/tracks/{id}", this::updateTrack);
        app.delete("/api/tracks/{id}", this::deleteTrack);

        // Database Management Endpoints
        app.get("/api/databases", this::listDatabases);
        app.post("/api/databases/switch", this::switchDatabase);
        app.post("/api/databases/create", this::createDatabase);
        app.post("/api/databases/copy", this::copyDatabase);
        app.post("/api/databases/reset", this::resetDatabase);
        app.post("/api/databases/delete", this::deleteDatabase);
        app.get("/api/databases/current", this::getCurrentDatabase);
        app.get("/api/databases/{name}/export", this::exportDatabase);
        app.post("/api/databases/import", this::importDatabase);
    }

    private MongoCollection<Driver> getDriverCollection() {
        return databaseContext.getDatabase().getCollection("drivers", Driver.class);
    }

    private MongoCollection<com.antigravity.models.Track> getTrackCollection() {
        return databaseContext.getDatabase().getCollection("tracks", com.antigravity.models.Track.class);
    }

    private MongoCollection<com.antigravity.models.Race> getRaceCollection() {
        return databaseContext.getDatabase().getCollection("races", com.antigravity.models.Race.class);
    }

    // --- Database Management Handlers ---

    private void listDatabases(Context ctx) {
        try {
            List<String> dbNames = databaseContext.listDatabases();
            List<DatabaseContext.DatabaseStats> statsList = new ArrayList<>();
            for (String dbName : dbNames) {
                // Filter out minimal system DBs if needed, or just show all
                if ("admin".equals(dbName) || "local".equals(dbName) || "config".equals(dbName))
                    continue;
                statsList.add(databaseContext.getDatabaseStats(dbName));
            }
            ctx.json(statsList);
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).result("Error listing databases: " + e.getMessage());
        }
    }

    private void switchDatabase(Context ctx) {
        try {
            Map body = ctx.bodyAsClass(Map.class);
            String name = (String) body.get("name");
            if (name == null || name.isEmpty()) {
                ctx.status(400).result("Database name is required");
                return;
            }
            databaseContext.switchDatabase(name);
            ctx.json(databaseContext.getDatabaseStats(name));
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).result("Error switching database: " + e.getMessage());
        }
    }

    private void createDatabase(Context ctx) {
        try {
            Map body = ctx.bodyAsClass(Map.class);
            String name = (String) body.get("name");
            if (name == null || name.isEmpty()) {
                ctx.status(400).result("Database name is required");
                return;
            }

            // Check if database already exists
            List<String> existingDbs = databaseContext.listDatabases();
            if (existingDbs.contains(name)) {
                ctx.status(409).result("Database already exists");
                return;
            }

            // Explicitky create the database to ensure it exists in lists
            databaseContext.createDatabase(name);
            databaseContext.switchDatabase(name);

            // Allow the user to start with a fresh factory-default database
            databaseContext.resetDatabaseToFactory(name);

            ctx.json(databaseContext.getDatabaseStats(name));
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).result("Error creating database: " + e.getMessage());
        }
    }

    private void copyDatabase(Context ctx) {
        try {
            Map body = ctx.bodyAsClass(Map.class);
            String newName = (String) body.get("name");
            if (newName == null || newName.isEmpty()) {
                ctx.status(400).result("New database name is required");
                return;
            }

            // Check if database already exists
            List<String> existingDbs = databaseContext.listDatabases();
            if (existingDbs.contains(newName)) {
                ctx.status(409).result("Database already exists");
                return;
            }

            String current = databaseContext.getCurrentDatabaseName();
            databaseContext.copyDatabase(current, newName);

            // Should we switch to it? Let's say yes for user convenience, or just return
            // success?
            // Usually "Copy" implies making a backup or a branch.
            // The user might stay on current or switch.
            // Let's NOT switch automatically, let the UI decide.

            ctx.json(databaseContext.getDatabaseStats(newName));
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).result("Error copying database: " + e.getMessage());
        }
    }

    private void resetDatabase(Context ctx) {
        try {
            // Reset CURRENT database
            String current = databaseContext.getCurrentDatabaseName();
            databaseContext.resetDatabaseToFactory(current);
            ctx.json(databaseContext.getDatabaseStats(current));
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).result("Error resetting database: " + e.getMessage());
        }
    }

    private void deleteDatabase(Context ctx) {
        try {
            Map body = ctx.bodyAsClass(Map.class);
            String name = (String) body.get("name");
            if (name == null || name.isEmpty()) {
                ctx.status(400).result("Database name is required");
                return;
            }

            String current = databaseContext.getCurrentDatabaseName();
            if (name.equals(current)) {
                ctx.status(400).result("Cannot delete the active database");
                return;
            }

            databaseContext.deleteDatabase(name);
            ctx.status(204);
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).result("Error deleting database: " + e.getMessage());
        }
    }

    private void getCurrentDatabase(Context ctx) {
        String current = databaseContext.getCurrentDatabaseName();
        ctx.json(databaseContext.getDatabaseStats(current));
    }

    private void exportDatabase(Context ctx) {
        String name = ctx.pathParam("name");
        ctx.header("Content-Disposition", "attachment; filename=\"" + name + ".zip\"");
        ctx.contentType("application/zip");
        try {
            databaseContext.exportDatabase(name, ctx.res.getOutputStream());
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).result("Error exporting database: " + e.getMessage());
        }
    }

    private void importDatabase(Context ctx) {
        try {
            String name = ctx.formParam("name");
            io.javalin.http.UploadedFile file = ctx.uploadedFile("file");

            if (name == null || name.isEmpty() || file == null) {
                ctx.status(400).result("Name and file are required");
                return;
            }

            // Check if database already exists
            if (databaseContext.listDatabases().contains(name)) {
                ctx.status(409).result("Database already exists");
                return;
            }

            databaseContext.importDatabase(name, file.getContent());
            ctx.json(databaseContext.getDatabaseStats(name));
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).result("Error importing database: " + e.getMessage());
        }
    }

    // --- Existing Handlers Refactored ---

    private void createDriver(Context ctx) {
        try {
            Driver driver = ctx.bodyAsClass(Driver.class);
            MongoCollection<Driver> col = getDriverCollection();

            // Uniqueness check
            Driver existing = col.find(Filters.or(
                    Filters.eq("name", driver.getName()),
                    Filters.eq("nickname", driver.getNickname()))).first();

            if (existing != null) {
                ctx.status(409).result("Driver name or nickname already exists");
                return;
            }

            if (driver.getEntityId() == null || driver.getEntityId().isEmpty() || "new".equals(driver.getEntityId())) {
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
            col.insertOne(driver);
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
            MongoCollection<Driver> col = getDriverCollection();

            Driver existing = col.find(Filters.and(
                    Filters.ne("entity_id", id),
                    Filters.or(
                            Filters.eq("name", driver.getName()),
                            Filters.eq("nickname", driver.getNickname()))))
                    .first();

            if (existing != null) {
                ctx.status(409).result("Driver name or nickname already exists");
                return;
            }

            col.replaceOne(com.mongodb.client.model.Filters.eq("entity_id", id), driver);
            ctx.json(driver);
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).result("Error updating driver: " + e.getMessage());
        }
    }

    private void deleteDriver(Context ctx) {
        try {
            String id = ctx.pathParam("id");
            getDriverCollection().deleteOne(com.mongodb.client.model.Filters.eq("entity_id", id));
            ctx.status(204);
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).result("Error deleting driver: " + e.getMessage());
        }
    }

    private void createTrack(Context ctx) {
        try {
            com.antigravity.models.Track track = ctx.bodyAsClass(com.antigravity.models.Track.class);
            MongoCollection<com.antigravity.models.Track> col = getTrackCollection();

            com.antigravity.models.Track existing = col.find(Filters.eq("name", track.getName())).first();

            if (existing != null) {
                ctx.status(409).result("Track name already exists");
                return;
            }

            if (track.getEntityId() == null || track.getEntityId().isEmpty() || "new".equals(track.getEntityId())) {
                String nextId = getNextSequence("tracks");
                track = new com.antigravity.models.Track(
                        track.getName(),
                        track.getLanes(),
                        track.getArduinoConfig(),
                        nextId,
                        null);
            }
            col.insertOne(track);
            ctx.status(201).json(track);
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).result("Error creating track: " + e.getMessage());
        }
    }

    private void updateTrack(Context ctx) {
        try {
            String id = ctx.pathParam("id");
            com.antigravity.models.Track track = ctx.bodyAsClass(com.antigravity.models.Track.class);
            MongoCollection<com.antigravity.models.Track> col = getTrackCollection();

            com.antigravity.models.Track existing = col.find(Filters.and(
                    Filters.ne("entity_id", id),
                    Filters.eq("name", track.getName())))
                    .first();

            if (existing != null) {
                ctx.status(409).result("Track name already exists");
                return;
            }

            track = new com.antigravity.models.Track(
                    track.getName(),
                    track.getLanes(),
                    track.getArduinoConfig(),
                    id,
                    track.getId());

            System.out.println("DEBUG: updateTrack for " + id);
            if (track.getArduinoConfig() != null) {
                System.out.println("DEBUG: Saving config with Digitals: " + track.getArduinoConfig().digitalIds);
            } else {
                System.out.println("DEBUG: Saving config is NULL");
            }

            col.replaceOne(com.mongodb.client.model.Filters.eq("entity_id", id), track);
            ctx.json(track);
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).result("Error updating track: " + e.getMessage());
        }
    }

    private void deleteTrack(Context ctx) {
        try {
            String id = ctx.pathParam("id");
            getTrackCollection().deleteOne(com.mongodb.client.model.Filters.eq("entity_id", id));
            ctx.status(204);
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).result("Error deleting track: " + e.getMessage());
        }
    }

    private String getNextSequence(String collectionName) {
        MongoCollection<org.bson.Document> counters = databaseContext.getDatabase().getCollection("counters");
        org.bson.Document counter = counters.findOneAndUpdate(
                com.mongodb.client.model.Filters.eq("_id", collectionName),
                com.mongodb.client.model.Updates.inc("seq", 1),
                new com.mongodb.client.model.FindOneAndUpdateOptions().upsert(true)
                        .returnDocument(com.mongodb.client.model.ReturnDocument.AFTER));
        return String.valueOf(counter.getInteger("seq"));
    }

    public void getDrivers(Context ctx) {
        List<Driver> drivers = new ArrayList<>();
        getDriverCollection().find().forEach(drivers::add);
        ctx.json(drivers);
    }

    public void getTracks(Context ctx) {
        List<com.antigravity.models.Track> tracks = new ArrayList<>();
        getTrackCollection().find().forEach(tracks::add);
        ctx.json(tracks);
    }

    public void getRaces(Context ctx) {
        List<com.antigravity.models.Race> races = new ArrayList<>();
        getRaceCollection().find().forEach(races::add);

        List<java.util.Map<String, Object>> response = new ArrayList<>();
        for (com.antigravity.models.Race race : races) {
            com.antigravity.models.Track track = getTrackCollection()
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
