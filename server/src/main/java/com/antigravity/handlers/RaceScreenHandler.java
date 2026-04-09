package com.antigravity.handlers;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.RaceScreen;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.Filters;
import io.javalin.Javalin;
import io.javalin.http.Context;
import org.bson.types.ObjectId;

import java.util.ArrayList;
import java.util.List;

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
      RaceScreen screen = ctx.bodyAsClass(RaceScreen.class);
      MongoDatabase db = databaseContext.getDatabase();
      MongoCollection<RaceScreen> collection = db.getCollection("screens", RaceScreen.class);
      
      // Generate entity_id using counter
      String entityId = getNextSequence(db, "screens");
      
      // Create new screen with generated ID
      RaceScreen newScreen = new RaceScreen(
          screen.getName(),
          entityId,
          new ObjectId()
      );
      
      collection.insertOne(newScreen);
      ctx.json(newScreen);
    } catch (Exception e) {
      e.printStackTrace();
      ctx.status(500).result("Error creating screen: " + e.getMessage());
    }
  }

  private void updateScreen(Context ctx) {
    try {
      String id = ctx.pathParam("id");
      RaceScreen updates = ctx.bodyAsClass(RaceScreen.class);
      MongoDatabase db = databaseContext.getDatabase();
      MongoCollection<RaceScreen> collection = db.getCollection("screens", RaceScreen.class);
      
      collection.replaceOne(Filters.eq("entity_id", id), updates);
      ctx.json(updates);
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
