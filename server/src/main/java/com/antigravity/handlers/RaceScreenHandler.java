package com.antigravity.handlers;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.RaceScreen;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.Filters;
import io.javalin.Javalin;
import io.javalin.http.Context;
import org.bson.types.ObjectId;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class RaceScreenHandler {
  private final DatabaseContext databaseContext;

  public RaceScreenHandler(DatabaseContext databaseContext, Javalin app) {
    this.databaseContext = databaseContext;
    setupRoutes(app);
  }

  private void setupRoutes(Javalin app) {
    app.get("/api/screens", this::getAllScreens);
    app.get("/api/screens/{id}", this::getScreenById);
    app.post("/api/screens", this::createScreen);
    app.put("/api/screens/{id}", this::updateScreen);
    app.delete("/api/screens/{id}", this::deleteScreen);
  }

  private void getAllScreens(Context ctx) {
    try {
      MongoDatabase db = databaseContext.getDatabase();
      MongoCollection<RaceScreen> collection = db.getCollection("screens", RaceScreen.class);
      List<RaceScreen> screens = new ArrayList<>();
      collection.find().into(screens);
      ctx.json(screens);
    } catch (Exception e) {
      e.printStackTrace();
      ctx.status(500).result("Error getting screens: " + e.getMessage());
    }
  }

  private void getScreenById(Context ctx) {
    try {
      String id = ctx.pathParam("id");
      MongoDatabase db = databaseContext.getDatabase();
      MongoCollection<RaceScreen> collection = db.getCollection("screens", RaceScreen.class);
      RaceScreen screen = collection.find(Filters.eq("entity_id", id)).first();
      if (screen != null) {
        ctx.json(screen);
      } else {
        ctx.status(404).result("Screen not found");
      }
    } catch (Exception e) {
      e.printStackTrace();
      ctx.status(500).result("Error getting screen: " + e.getMessage());
    }
  }

  private void createScreen(Context ctx) {
    try {
      // Parse JSON manually to avoid Jackson @JsonIdentityInfo issues with RaceScreen
      ObjectMapper mapper = new ObjectMapper();
      JsonNode json = mapper.readTree(ctx.body());
      
      String name = json.get("name").asText();
      System.out.println("Creating screen: " + name);
      
      MongoDatabase db = databaseContext.getDatabase();
      MongoCollection<RaceScreen> collection = db.getCollection("screens", RaceScreen.class);
      
      // Generate entity_id using counter
      String entityId = getNextSequence(db, "screens");
      System.out.println("Generated entity_id: " + entityId);
      
      // Extract fields from JSON
      List<String> columns = extractList(json, "columns");
      Map<String, Map<String, String>> columnLayouts = extractNestedMap(json, "columnLayouts");
      Map<String, String> columnVisibility = extractStringMap(json, "columnVisibility");
      Map<String, String> columnAnchors = extractStringMap(json, "columnAnchors");
      boolean sortByStandings = json.has("sortByStandings") ? json.get("sortByStandings").asBoolean() : true;
      boolean highlightRowOnLap = json.has("highlightRowOnLap") ? json.get("highlightRowOnLap").asBoolean() : true;
      boolean isDefault = json.has("isDefault") ? json.get("isDefault").asBoolean() : false;
      boolean isEnabled = json.has("isEnabled") ? json.get("isEnabled").asBoolean() : true;
      
      // Create new screen with all fields from JSON and generated ID
      RaceScreen newScreen = new RaceScreen(
          name,
          columns,
          columnLayouts,
          columnVisibility,
          columnAnchors,
          sortByStandings,
          highlightRowOnLap,
          isDefault,
          isEnabled,
          entityId,
          new ObjectId()
      );
      
      collection.insertOne(newScreen);
      System.out.println("Screen inserted successfully: " + entityId);
      ctx.json(newScreen);
    } catch (Exception e) {
      System.err.println("Error creating screen: " + e.getMessage());
      e.printStackTrace();
      ctx.status(500).result("Error creating screen: " + e.getMessage());
    }
  }
  
  private List<String> extractList(JsonNode json, String field) {
    List<String> result = new ArrayList<>();
    if (json.has(field) && json.get(field).isArray()) {
      for (JsonNode node : json.get(field)) {
        result.add(node.asText());
      }
    }
    return result;
  }
  
  @SuppressWarnings("unchecked")
  private Map<String, Map<String, String>> extractNestedMap(JsonNode json, String field) {
    if (json.has(field) && json.get(field).isObject()) {
      return new ObjectMapper().convertValue(json.get(field), Map.class);
    }
    return new java.util.HashMap<>();
  }
  
  @SuppressWarnings("unchecked")
  private Map<String, String> extractStringMap(JsonNode json, String field) {
    if (json.has(field) && json.get(field).isObject()) {
      return new ObjectMapper().convertValue(json.get(field), Map.class);
    }
    return new java.util.HashMap<>();
  }

  private void updateScreen(Context ctx) {
    try {
      String id = ctx.pathParam("id");
      
      // Parse JSON manually to avoid Jackson @JsonIdentityInfo issues with RaceScreen
      ObjectMapper mapper = new ObjectMapper();
      JsonNode json = mapper.readTree(ctx.body());
      
      MongoDatabase db = databaseContext.getDatabase();
      MongoCollection<RaceScreen> collection = db.getCollection("screens", RaceScreen.class);
      
      // Get existing screen to preserve ID and createdAt
      RaceScreen existing = collection.find(Filters.eq("entity_id", id)).first();
      if (existing == null) {
        ctx.status(404).result("Screen not found");
        return;
      }
      
      // Extract fields from JSON
      String name = json.has("name") ? json.get("name").asText() : existing.getName();
      List<String> columns = json.has("columns") ? extractList(json, "columns") : existing.getColumns();
      Map<String, Map<String, String>> columnLayouts = json.has("columnLayouts") 
          ? extractNestedMap(json, "columnLayouts") : existing.getColumnLayouts();
      Map<String, String> columnVisibility = json.has("columnVisibility") 
          ? extractStringMap(json, "columnVisibility") : existing.getColumnVisibility();
      Map<String, String> columnAnchors = json.has("columnAnchors") 
          ? extractStringMap(json, "columnAnchors") : existing.getColumnAnchors();
      boolean sortByStandings = json.has("sortByStandings") 
          ? json.get("sortByStandings").asBoolean() : existing.isSortByStandings();
      boolean highlightRowOnLap = json.has("highlightRowOnLap") 
          ? json.get("highlightRowOnLap").asBoolean() : existing.isHighlightRowOnLap();
      boolean isDefault = json.has("isDefault") ? json.get("isDefault").asBoolean() : existing.isDefault();
      boolean isEnabled = json.has("isEnabled") ? json.get("isEnabled").asBoolean() : existing.isEnabled();
      
      // Create updated screen preserving original ID and created timestamp
      RaceScreen updated = new RaceScreen(
          name,
          columns,
          columnLayouts,
          columnVisibility,
          columnAnchors,
          sortByStandings,
          highlightRowOnLap,
          isDefault,
          isEnabled,
          existing.getEntityId(),
          existing.getId()
      );
      
      collection.replaceOne(Filters.eq("entity_id", id), updated);
      ctx.json(updated);
    } catch (Exception e) {
      e.printStackTrace();
      ctx.status(500).result("Error updating screen: " + e.getMessage());
    }
  }

  private void deleteScreen(Context ctx) {
    try {
      String id = ctx.pathParam("id");
      MongoDatabase db = databaseContext.getDatabase();
      MongoCollection<RaceScreen> collection = db.getCollection("screens", RaceScreen.class);
      
      collection.deleteOne(Filters.eq("entity_id", id));
      ctx.result("Screen deleted");
    } catch (Exception e) {
      e.printStackTrace();
      ctx.status(500).result("Error deleting screen: " + e.getMessage());
    }
  }

  private String getNextSequence(MongoDatabase db, String sequenceName) {
    MongoCollection<com.antigravity.models.Counter> counterCollection = 
        db.getCollection("counters", com.antigravity.models.Counter.class);
    
    com.antigravity.models.Counter counter = counterCollection.find(
        Filters.eq("_id", sequenceName)
    ).first();
    
    if (counter == null) {
      counter = new com.antigravity.models.Counter(sequenceName, 1);
      counterCollection.insertOne(counter);
      return "1";
    } else {
      int nextValue = counter.getSeq() + 1;
      counterCollection.replaceOne(
          Filters.eq("_id", sequenceName),
          new com.antigravity.models.Counter(sequenceName, nextValue)
      );
      return String.valueOf(nextValue);
    }
  }
}
