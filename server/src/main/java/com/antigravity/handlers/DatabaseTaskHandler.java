package com.antigravity.handlers;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.Driver;
import com.antigravity.models.Race;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Filters;
import com.mongodb.client.result.DeleteResult;
import com.mongodb.client.result.UpdateResult;
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
        app.get("/api/teams", this::getTeams);
        app.post("/api/teams", this::createTeam);
        app.put("/api/teams/{id}", this::updateTeam);
        app.delete("/api/teams/{id}", this::deleteTeam);

        app.post("/api/tracks", this::createTrack);
        app.put("/api/tracks/{id}", this::updateTrack);
        app.delete("/api/tracks/{id}", this::deleteTrack);

        app.post("/api/races", this::handleCreateRace);
        app.put("/api/races/{id}", this::handleUpdateRace);
        app.delete("/api/races/{id}", this::handleDeleteRace);
        app.post("/api/races/{id}/generate-heats", this::generateHeats);
        app.post("/api/heats/preview", this::previewHeats);

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

    private MongoCollection<com.antigravity.models.Team> getTeamCollection() {
        return databaseContext.getDatabase().getCollection("teams", com.antigravity.models.Team.class);
    }

    private MongoCollection<com.antigravity.models.Track> getTrackCollection() {
        return databaseContext.getDatabase().getCollection("tracks", com.antigravity.models.Track.class);
    }

    private MongoCollection<Race> getRaceCollection() {
        return databaseContext.getDatabase().getCollection("races", Race.class);
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

    private void getTeams(Context ctx) {
        List<com.antigravity.models.Team> teams = new ArrayList<>();
        getTeamCollection().find().forEach(teams::add);
        ctx.json(teams);
    }

    private void createTeam(Context ctx) {
        try {
            com.antigravity.models.Team team = ctx.bodyAsClass(com.antigravity.models.Team.class);
            team = createTeam(team);
            ctx.status(201).json(team);
        } catch (IllegalArgumentException e) {
            ctx.status(409).result(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).result("Error creating team: " + e.getMessage());
        }
    }

    public com.antigravity.models.Team createTeam(com.antigravity.models.Team team) {
        MongoCollection<com.antigravity.models.Team> col = getTeamCollection();

        // Uniqueness check
        com.antigravity.models.Team existing = col.find(
                Filters.eq("name", team.getName())).first();

        if (existing != null) {
            throw new IllegalArgumentException("Team name already exists");
        }

        if (team.getEntityId() == null || team.getEntityId().isEmpty() || "new".equals(team.getEntityId())) {
            String nextId = getNextSequence("teams");
            team = new com.antigravity.models.Team(
                    team.getName(),
                    team.getAvatarUrl(),
                    team.getDriverIds(),
                    nextId,
                    null);
        }
        col.insertOne(team);
        return team;
    }

    private void updateTeam(Context ctx) {
        try {
            String id = ctx.pathParam("id");
            com.antigravity.models.Team team = ctx.bodyAsClass(com.antigravity.models.Team.class);
            updateTeam(id, team);
            ctx.json(team); // Note: updateTeam returns new object but we can return input if valid or
                            // return result
        } catch (IllegalArgumentException e) {
            ctx.status(409).result(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).result("Error updating team: " + e.getMessage());
        }
    }

    public com.antigravity.models.Team updateTeam(String id, com.antigravity.models.Team team) {
        MongoCollection<com.antigravity.models.Team> col = getTeamCollection();

        com.antigravity.models.Team existing = col.find(Filters.and(
                Filters.ne("entity_id", id),
                Filters.eq("name", team.getName())))
                .first();

        if (existing != null) {
            throw new IllegalArgumentException("Team name or nickname already exists");
        }

        // Preservation of IDs is handled by maintaining original entity_id
        // However, we construct a new object to ensure it has the correct ID
        team = new com.antigravity.models.Team(
                team.getName(),
                team.getAvatarUrl(),
                team.getDriverIds(),
                id,
                team.getId());

        UpdateResult result = col.replaceOne(com.mongodb.client.model.Filters.eq("entity_id", id), team);
        if (result.getMatchedCount() == 0) {
            // throw new IllegalArgumentException("Team not found"); // Optional depending
            // on requirement
        }
        return team;
    }

    private void deleteTeam(Context ctx) {
        try {
            String id = ctx.pathParam("id");
            deleteTeam(id);
            ctx.status(204);
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).result("Error deleting team: " + e.getMessage());
        }
    }

    public void deleteTeam(String id) {
        getTeamCollection().deleteOne(com.mongodb.client.model.Filters.eq("entity_id", id));
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

    public void handleCreateRace(Context ctx) {
        try {
            com.antigravity.models.Race race = ctx.bodyAsClass(com.antigravity.models.Race.class);
            try {
                com.antigravity.models.Race created = createRace(race);
                ctx.status(201).json(created);
            } catch (IllegalArgumentException e) {
                ctx.status(409).result(e.getMessage());
            }
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).result("Error creating race: " + e.getMessage());
        }
    }

    public com.antigravity.models.Race createRace(com.antigravity.models.Race race) {
        MongoCollection<com.antigravity.models.Race> col = getRaceCollection();

        // Uniqueness check
        com.antigravity.models.Race existing = col.find(Filters.eq("name", race.getName())).first();
        if (existing != null) {
            throw new IllegalArgumentException("Race name already exists");
        }

        if (race.getEntityId() == null || race.getEntityId().isEmpty() || "new".equals(race.getEntityId())) {
            String nextId = getNextSequence("races");
            race = new com.antigravity.models.Race(
                    race.getName(),
                    race.getTrackEntityId(),
                    race.getHeatRotationType(),
                    race.getHeatScoring(),
                    race.getOverallScoring(),
                    race.getMinLapTime(),
                    race.getFuelOptions(),
                    nextId,
                    null);
        }
        col.insertOne(race);
        return race;
    }

    public void handleUpdateRace(Context ctx) {
        try {
            String id = ctx.pathParam("id");
            com.antigravity.models.Race race = ctx.bodyAsClass(com.antigravity.models.Race.class);
            try {
                com.antigravity.models.Race updated = updateRace(id, race);
                ctx.json(updated);
            } catch (IllegalArgumentException e) {
                if ("Race not found".equals(e.getMessage())) {
                    ctx.status(404).result(e.getMessage());
                } else {
                    ctx.status(409).result(e.getMessage());
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).result("Error updating race: " + e.getMessage());
        }
    }

    public com.antigravity.models.Race updateRace(String id, com.antigravity.models.Race race) {
        MongoCollection<com.antigravity.models.Race> col = getRaceCollection();

        com.antigravity.models.Race existing = col.find(Filters.and(
                Filters.ne("entity_id", id),
                Filters.eq("name", race.getName())))
                .first();

        if (existing != null) {
            throw new IllegalArgumentException("Race name already exists");
        }

        race = new com.antigravity.models.Race(
                race.getName(),
                race.getTrackEntityId(),
                race.getHeatRotationType(),
                race.getHeatScoring(),
                race.getOverallScoring(),
                race.getMinLapTime(),
                race.getFuelOptions(),
                id,
                race.getId());

        UpdateResult result = col.replaceOne(Filters.eq("entity_id", id), race);
        if (result.getMatchedCount() == 0) {
            throw new IllegalArgumentException("Race not found");
        }
        return race;
    }

    public void handleDeleteRace(Context ctx) {
        try {
            String id = ctx.pathParam("id");
            try {
                deleteRace(id);
                ctx.status(204);
            } catch (IllegalArgumentException e) {
                ctx.status(404).result(e.getMessage());
            }
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).result("Error deleting race: " + e.getMessage());
        }
    }

    public void deleteRace(String id) {
        DeleteResult result = getRaceCollection().deleteOne(Filters.eq("entity_id", id));
        if (result.getDeletedCount() == 0) {
            throw new IllegalArgumentException("Race not found");
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
            raceMap.put("track_entity_id", race.getTrackEntityId());
            raceMap.put("heat_rotation_type", race.getHeatRotationType());
            raceMap.put("heat_scoring", race.getHeatScoring());
            raceMap.put("overall_scoring", race.getOverallScoring());
            raceMap.put("min_lap_time", race.getMinLapTime());
            raceMap.put("fuel_options", race.getFuelOptions());
            response.add(raceMap);
        }
        ctx.json(response);
    }

    public void generateHeats(Context ctx) {
        String raceId = ctx.pathParam("id");
        java.util.Map body = ctx.bodyAsClass(java.util.Map.class);
        Number driverCountNum = (Number) body.get("driverCount");
        int driverCount = driverCountNum != null ? driverCountNum.intValue() : 0;

        if (driverCount <= 0) {
            ctx.status(400).result("driverCount must be greater than 0");
            return;
        }

        // Find the race
        com.antigravity.models.Race race = getRaceCollection()
                .find(com.mongodb.client.model.Filters.eq("entity_id", raceId)).first();
        if (race == null) {
            ctx.status(404).result("Race not found");
            return;
        }

        // Find the track to get lane count
        com.antigravity.models.Track track = getTrackCollection()
                .find(com.mongodb.client.model.Filters.eq("entity_id", race.getTrackEntityId())).first();
        if (track == null) {
            ctx.status(404).result("Track not found for race");
            return;
        }

        // Create mock RaceParticipant list
        List<com.antigravity.race.RaceParticipant> mockDrivers = new ArrayList<>();
        for (int i = 0; i < driverCount; i++) {
            com.antigravity.models.Driver mockDriver = new com.antigravity.models.Driver(
                    "Driver " + (i + 1),
                    "Driver " + (i + 1));
            mockDrivers.add(new com.antigravity.race.RaceParticipant(mockDriver));
        }

        // Create a temporary Race object for heat building
        com.antigravity.race.Race tempRace = new com.antigravity.race.Race(
                race,
                mockDrivers,
                track,
                true); // Use demo mode to avoid protocol initialization

        // Get the generated heats
        List<com.antigravity.race.Heat> heats = tempRace.getHeats();

        // Convert heats to JSON response
        List<java.util.Map<String, Object>> heatList = new ArrayList<>();
        for (com.antigravity.race.Heat heat : heats) {
            java.util.Map<String, Object> heatMap = new java.util.HashMap<>();
            heatMap.put("heatNumber", heat.getHeatNumber());

            List<java.util.Map<String, Object>> lanes = new ArrayList<>();
            List<com.antigravity.race.DriverHeatData> drivers = heat.getDrivers();
            for (int laneIdx = 0; laneIdx < drivers.size(); laneIdx++) {
                com.antigravity.race.DriverHeatData driverData = drivers.get(laneIdx);
                java.util.Map<String, Object> laneMap = new java.util.HashMap<>();
                laneMap.put("laneNumber", laneIdx + 1);
                laneMap.put("driverNumber", driverData.getDriver().getSeed());

                // Add lane colors from track
                if (laneIdx < track.getLanes().size()) {
                    com.antigravity.models.Lane lane = track.getLanes().get(laneIdx);
                    laneMap.put("backgroundColor", lane.getBackground_color());
                    laneMap.put("foregroundColor", lane.getForeground_color());
                }

                lanes.add(laneMap);
            }
            heatMap.put("lanes", lanes);
            heatList.add(heatMap);
        }

        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("heats", heatList);
        ctx.json(response);

        // Clean up the temporary race object
        tempRace.stop();
    }

    public void previewHeats(Context ctx) {
        java.util.Map body = ctx.bodyAsClass(java.util.Map.class);
        Number driverCountNum = (Number) body.get("driverCount");
        int driverCount = driverCountNum != null ? driverCountNum.intValue() : 0;
        String trackId = (String) body.get("trackId");
        String rotationType = (String) body.get("rotationType");

        if (driverCount <= 0) {
            ctx.status(400).result("driverCount must be greater than 0");
            return;
        }

        if (trackId == null || trackId.isEmpty()) {
            ctx.status(400).result("trackId is required");
            return;
        }

        if (rotationType == null || rotationType.isEmpty()) {
            ctx.status(400).result("rotationType is required");
            return;
        }

        // Find the track to get lane count
        com.antigravity.models.Track track = getTrackCollection()
                .find(com.mongodb.client.model.Filters.eq("entity_id", trackId)).first();
        if (track == null) {
            ctx.status(404).result("Track not found");
            return;
        }

        // Convert rotation type string to enum
        com.antigravity.models.HeatRotationType rotationTypeEnum;
        try {
            rotationTypeEnum = com.antigravity.models.HeatRotationType.valueOf(rotationType);
        } catch (IllegalArgumentException e) {
            ctx.status(400).result("Invalid rotation type: " + rotationType);
            return;
        }

        // Create a default HeatScoring and OverallScoring for heat generation preview
        com.antigravity.models.HeatScoring defaultHeatScoring = new com.antigravity.models.HeatScoring(
                com.antigravity.models.HeatScoring.FinishMethod.Lap,
                10, // default 10 laps
                com.antigravity.models.HeatScoring.HeatRanking.LAP_COUNT,
                com.antigravity.models.HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME);
        com.antigravity.models.OverallScoring defaultOverallScoring = new com.antigravity.models.OverallScoring();

        // Create a temporary race configuration
        com.antigravity.models.Race tempRaceConfig = new com.antigravity.models.Race(
                "Preview",
                trackId,
                rotationTypeEnum,
                defaultHeatScoring,
                defaultOverallScoring,
                null, // entity_id - not needed for preview
                null // mongo id - not needed for preview
        );

        // Create mock RaceParticipant list
        List<com.antigravity.race.RaceParticipant> mockDrivers = new ArrayList<>();
        for (int i = 0; i < driverCount; i++) {
            com.antigravity.models.Driver mockDriver = new com.antigravity.models.Driver(
                    "Driver " + (i + 1),
                    "Driver " + (i + 1));
            mockDrivers.add(new com.antigravity.race.RaceParticipant(mockDriver));
        }

        // Create a temporary Race object for heat building
        com.antigravity.race.Race tempRace = new com.antigravity.race.Race(
                tempRaceConfig,
                mockDrivers,
                track,
                true); // Use demo mode to avoid protocol initialization

        // Get the generated heats
        List<com.antigravity.race.Heat> heats = tempRace.getHeats();

        // Convert heats to JSON response
        List<java.util.Map<String, Object>> heatList = new ArrayList<>();
        for (com.antigravity.race.Heat heat : heats) {
            java.util.Map<String, Object> heatMap = new java.util.HashMap<>();
            heatMap.put("heatNumber", heat.getHeatNumber());

            List<java.util.Map<String, Object>> lanes = new ArrayList<>();
            List<com.antigravity.race.DriverHeatData> drivers = heat.getDrivers();
            for (int laneIdx = 0; laneIdx < drivers.size(); laneIdx++) {
                com.antigravity.race.DriverHeatData driverData = drivers.get(laneIdx);
                java.util.Map<String, Object> laneMap = new java.util.HashMap<>();
                laneMap.put("laneNumber", laneIdx + 1);
                laneMap.put("driverNumber", driverData.getDriver().getSeed());

                // Add lane colors from track
                if (laneIdx < track.getLanes().size()) {
                    com.antigravity.models.Lane lane = track.getLanes().get(laneIdx);
                    laneMap.put("backgroundColor", lane.getBackground_color());
                    laneMap.put("foregroundColor", lane.getForeground_color());
                }

                lanes.add(laneMap);
            }
            heatMap.put("lanes", lanes);
            heatList.add(heatMap);
        }

        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("heats", heatList);
        ctx.json(response);

        // Clean up the temporary race object
        tempRace.stop();
    }
}
