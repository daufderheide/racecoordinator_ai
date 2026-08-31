package com.antigravity.handlers;

import com.antigravity.auth.Role;
import com.antigravity.context.DatabaseContext;
import com.antigravity.models.CustomUI;
import com.antigravity.repository.SqliteRepository;
import io.javalin.Javalin;
import io.javalin.http.Context;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class CustomUITaskHandler {
  private static final Logger logger = LoggerFactory.getLogger(CustomUITaskHandler.class);

  private final DatabaseContext databaseContext;
  private final SqliteRepository<CustomUI> customUIRepository;

  public CustomUITaskHandler(DatabaseContext databaseContext, Javalin app) {
    this.databaseContext = databaseContext;
    this.customUIRepository = new SqliteRepository<>(databaseContext, "custom_uis", CustomUI.class);

    app.get("/api/custom-ui", this::listCustomUIs, Role.VIEWER);
    app.get("/api/custom-ui/{id}", this::getCustomUI, Role.VIEWER);
    app.post("/api/custom-ui", this::createCustomUI, Role.VIEWER);
    app.put("/api/custom-ui/{id}", this::updateCustomUI, Role.VIEWER);
    app.delete("/api/custom-ui/{id}", this::deleteCustomUI, Role.VIEWER);
    app.post("/api/custom-ui/{id}/duplicate", this::duplicateCustomUI, Role.VIEWER);
  }

  public synchronized void ensureDefaultCustomUIs() {
    try {
      databaseContext.ensureTable("custom_uis");
      List<CustomUI> uis = customUIRepository.findAll();
      boolean hasDefault = false;
      boolean hasPractice = false;
      boolean hasFuel = false;
      for (CustomUI ui : uis) {
        if (ui.getEntityId() != null && ui.getEntityId().equals(CustomUI.DEFAULT_UI_ID)) {
          hasDefault = true;
        }
        if (ui.getEntityId() != null && ui.getEntityId().equals(CustomUI.PRACTICE_UI_ID)) {
          hasPractice = true;
        }
        if (ui.getEntityId() != null && ui.getEntityId().equals(CustomUI.FUEL_UI_ID)) {
          hasFuel = true;
        } else if ("2".equals(ui.getEntityId())
            && !hasFuel
            && (ui.isDefault() || "Fuel UI".equalsIgnoreCase(ui.getName()))) {
          hasFuel = true;
          customUIRepository.delete("2");
          CustomUI migrated =
              new CustomUI(
                  ui.getName(),
                  true,
                  ui.getLayoutJson(),
                  ui.getColumnsJson(),
                  ui.getColumnLayoutsJson(),
                  ui.getColumnVisibilityJson(),
                  ui.getColumnWidthsJson(),
                  ui.getColumnAnchorsJson(),
                  CustomUI.FUEL_UI_ID,
                  ui.getId());
          customUIRepository.save(migrated);
          logger.info("Migrated custom UI '2' to {}", CustomUI.FUEL_UI_ID);
        }
      }

      if (!hasDefault) {
        CustomUI defaultUi = CustomUI.createDefault();
        customUIRepository.save(defaultUi);
        logger.info("Created default custom UI with ID {}", CustomUI.DEFAULT_UI_ID);
      }

      if (!hasPractice) {
        CustomUI practiceUi = CustomUI.createPractice();
        customUIRepository.save(practiceUi);
        logger.info("Created practice custom UI with ID {}", CustomUI.PRACTICE_UI_ID);
      }

      if (!hasFuel) {
        CustomUI fuelUi = CustomUI.createFuel();
        customUIRepository.save(fuelUi);
        logger.info("Created fuel custom UI with ID {}", CustomUI.FUEL_UI_ID);
      }
    } catch (Exception e) {
      logger.error("Failed to ensure default custom UIs", e);
    }
  }

  <T> T getBody(Context ctx, Class<T> clazz) {
    return ctx.bodyAsClass(clazz);
  }

  void setStatus(Context ctx, int status) {
    ctx.status(status);
  }

  void setResult(Context ctx, String result) {
    ctx.result(result);
  }

  void setJson(Context ctx, Object obj) {
    ctx.json(obj);
  }

  String getPathParam(Context ctx, String key) {
    return ctx.pathParam(key);
  }

  void listCustomUIs(Context ctx) {
    try {
      ensureDefaultCustomUIs();
      List<CustomUI> uis = customUIRepository.findAll();
      setJson(ctx, uis);
    } catch (Exception e) {
      e.printStackTrace();
      setStatus(ctx, 500);
      setResult(ctx, "Error listing custom UIs: " + e.getMessage());
    }
  }

  void getCustomUI(Context ctx) {
    try {
      String id = getPathParam(ctx, "id");
      CustomUI ui = customUIRepository.findByEntityId(id);
      if (ui == null) {
        setStatus(ctx, 404);
        setResult(ctx, "Custom UI not found");
        return;
      }
      setJson(ctx, ui);
    } catch (Exception e) {
      e.printStackTrace();
      setStatus(ctx, 500);
      setResult(ctx, "Error retrieving custom UI: " + e.getMessage());
    }
  }

  void createCustomUI(Context ctx) {
    try {
      CustomUI ui = getBody(ctx, CustomUI.class);
      for (CustomUI existing : customUIRepository.findAll()) {
        if (existing.getName() != null && existing.getName().equalsIgnoreCase(ui.getName())) {
          setStatus(ctx, 409);
          setResult(ctx, "Custom UI name already exists");
          return;
        }
      }

      if (ui.getEntityId() == null
          || ui.getEntityId().isEmpty()
          || "new".equals(ui.getEntityId())) {
        String nextId = getNextSequence("custom_uis");
        ui =
            new CustomUI(
                ui.getName(),
                false,
                ui.getLayoutJson(),
                ui.getColumnsJson(),
                ui.getColumnLayoutsJson(),
                ui.getColumnVisibilityJson(),
                ui.getColumnWidthsJson(),
                ui.getColumnAnchorsJson(),
                nextId,
                null);
      }

      customUIRepository.save(ui);
      setStatus(ctx, 201);
      setJson(ctx, ui);
    } catch (Exception e) {
      e.printStackTrace();
      setStatus(ctx, 500);
      setResult(ctx, "Error creating custom UI: " + e.getMessage());
    }
  }

  void updateCustomUI(Context ctx) {
    try {
      String id = getPathParam(ctx, "id");
      CustomUI ui = getBody(ctx, CustomUI.class);

      for (CustomUI existing : customUIRepository.findAll()) {
        if (!id.equals(existing.getEntityId())
            && existing.getName() != null
            && existing.getName().equalsIgnoreCase(ui.getName())) {
          setStatus(ctx, 409);
          setResult(ctx, "Custom UI name already exists");
          return;
        }
      }

      CustomUI current = customUIRepository.findByEntityId(id);
      if (current == null) {
        setStatus(ctx, 404);
        setResult(ctx, "Custom UI not found");
        return;
      }

      ui =
          new CustomUI(
              ui.getName() != null && !ui.getName().trim().isEmpty()
                  ? ui.getName()
                  : current.getName(),
              current.isDefault(),
              ui.getLayoutJson(),
              ui.getColumnsJson(),
              ui.getColumnLayoutsJson(),
              ui.getColumnVisibilityJson(),
              ui.getColumnWidthsJson(),
              ui.getColumnAnchorsJson(),
              id,
              null);

      customUIRepository.save(ui);
      setJson(ctx, ui);
    } catch (Exception e) {
      e.printStackTrace();
      setStatus(ctx, 500);
      setResult(ctx, "Error updating custom UI: " + e.getMessage());
    }
  }

  void deleteCustomUI(Context ctx) {
    try {
      String id = getPathParam(ctx, "id");
      CustomUI ui = customUIRepository.findByEntityId(id);
      if (ui == null) {
        setStatus(ctx, 404);
        setResult(ctx, "Custom UI not found");
        return;
      }
      customUIRepository.delete(id);
      setStatus(ctx, 204);
    } catch (Exception e) {
      e.printStackTrace();
      setStatus(ctx, 500);
      setResult(ctx, "Error deleting custom UI: " + e.getMessage());
    }
  }

  void duplicateCustomUI(Context ctx) {
    try {
      String id = getPathParam(ctx, "id");
      CustomUI source = customUIRepository.findByEntityId(id);
      if (source == null) {
        setStatus(ctx, 404);
        setResult(ctx, "Custom UI not found");
        return;
      }

      String newName = ctx.queryParam("name");
      if (newName != null) {
        newName = newName.trim();
      }
      if (newName != null && newName.isEmpty()) {
        newName = null;
      }
      if (newName == null || newName.isEmpty()) {
        newName = source.getName() + " (Copy)";
      }

      List<CustomUI> allUIs = customUIRepository.findAll();
      boolean exists = true;
      String testName = newName;
      int suffix = 2;
      while (exists) {
        exists = false;
        for (CustomUI t : allUIs) {
          if (t.getName() != null && t.getName().equalsIgnoreCase(testName)) {
            exists = true;
            testName = newName + " " + suffix;
            suffix++;
            break;
          }
        }
      }
      newName = testName;

      String nextId = getNextSequence("custom_uis");
      CustomUI copy =
          new CustomUI(
              newName,
              false,
              source.getLayoutJson(),
              source.getColumnsJson(),
              source.getColumnLayoutsJson(),
              source.getColumnVisibilityJson(),
              source.getColumnWidthsJson(),
              source.getColumnAnchorsJson(),
              nextId,
              null);
      customUIRepository.save(copy);
      setStatus(ctx, 201);
      setJson(ctx, copy);
    } catch (Exception e) {
      e.printStackTrace();
      setStatus(ctx, 500);
      setResult(ctx, "Error duplicating custom UI: " + e.getMessage());
    }
  }

  private String getNextSequence(String collectionName) {
    return databaseContext.getNextSequence(collectionName);
  }
}
