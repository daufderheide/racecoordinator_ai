package com.antigravity.handlers;

import com.antigravity.auth.Role;
import com.antigravity.context.DatabaseContext;
import com.antigravity.models.Driver;
import com.antigravity.models.DriverLabel;
import com.antigravity.models.Team;
import com.antigravity.race.ClientSubscriptionManager;
import com.antigravity.race.Race;
import com.antigravity.repository.SqliteRepository;
import io.javalin.Javalin;
import io.javalin.http.Context;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class DriverLabelTaskHandler {
  private static final Logger logger = LoggerFactory.getLogger(DriverLabelTaskHandler.class);

  private final SqliteRepository<DriverLabel> driverLabelRepository;
  private final SqliteRepository<Driver> driverRepository;
  private final SqliteRepository<Team> teamRepository;

  public DriverLabelTaskHandler(
      DatabaseContext databaseContext,
      SqliteRepository<Driver> driverRepository,
      SqliteRepository<Team> teamRepository,
      Javalin app) {
    this.driverLabelRepository =
        new SqliteRepository<>(databaseContext, "driver_labels", DriverLabel.class);
    this.driverRepository = driverRepository;
    this.teamRepository = teamRepository;

    app.get("/api/driver-labels", this::getLabels, Role.VIEWER);
    app.get("/api/driver-labels/{id}", this::getLabelById, Role.VIEWER);
    app.post("/api/driver-labels", this::createLabel, Role.DIRECTOR);
    app.put("/api/driver-labels/{id}", this::updateLabel, Role.DIRECTOR);
    app.delete("/api/driver-labels/{id}", this::deleteLabel, Role.DIRECTOR);
  }

  public DriverLabelTaskHandler(
      DatabaseContext databaseContext, SqliteRepository<Driver> driverRepository, Javalin app) {
    this(databaseContext, driverRepository, null, app);
  }

  public void getLabels(Context ctx) {
    ctx.json(driverLabelRepository.findAll());
  }

  public void getLabelById(Context ctx) {
    String id = ctx.pathParam("id");
    DriverLabel label = driverLabelRepository.findByEntityId(id);
    if (label == null) {
      ctx.status(404).result("Driver label not found");
      return;
    }
    ctx.json(label);
  }

  public void createLabel(Context ctx) {
    try {
      DriverLabel label = DatabaseHandlerUtils.bodyAsClassWithId(ctx.body(), DriverLabel.class);

      if (label.getName() == null || label.getName().trim().isEmpty()) {
        ctx.status(400).result("Label name cannot be empty");
        return;
      }

      final String labelName = label.getName().trim();
      List<DriverLabel> allLabels = driverLabelRepository.findAll();
      boolean existing =
          allLabels.stream()
              .anyMatch(l -> l.getName() != null && labelName.equalsIgnoreCase(l.getName().trim()));

      if (existing) {
        ctx.status(409).result("A label with this name already exists");
        return;
      }

      String entityId = label.getEntityId();
      if (entityId == null || entityId.trim().isEmpty() || "new".equalsIgnoreCase(entityId)) {
        entityId = UUID.randomUUID().toString();
      }

      String color = label.getColor();
      if (color == null || color.trim().isEmpty()) {
        color = "#3b82f6";
      }

      DriverLabel toSave =
          new DriverLabel.Builder()
              .withEntityId(entityId)
              .withId(entityId)
              .withName(labelName)
              .withColor(color.trim())
              .build();

      driverLabelRepository.insert(toSave);
      ctx.status(201).json(toSave);
    } catch (Exception e) {
      logger.error("Error creating driver label", e);
      ctx.status(500).result("Error creating driver label: " + e.getMessage());
    }
  }

  public void updateLabel(Context ctx) {
    try {
      String id = ctx.pathParam("id");
      DriverLabel label = DatabaseHandlerUtils.bodyAsClassWithId(ctx.body(), DriverLabel.class);

      if (label.getName() == null || label.getName().trim().isEmpty()) {
        ctx.status(400).result("Label name cannot be empty");
        return;
      }

      final String labelName = label.getName().trim();
      List<DriverLabel> allLabels = driverLabelRepository.findAll();
      boolean existing =
          allLabels.stream()
              .anyMatch(
                  l ->
                      !id.equals(l.getEntityId())
                          && l.getName() != null
                          && labelName.equalsIgnoreCase(l.getName().trim()));

      if (existing) {
        ctx.status(409).result("A label with this name already exists");
        return;
      }

      String color = label.getColor();
      if (color == null || color.trim().isEmpty()) {
        color = "#3b82f6";
      }

      DriverLabel toSave =
          new DriverLabel.Builder()
              .withEntityId(id)
              .withId(id)
              .withName(labelName)
              .withColor(color.trim())
              .build();

      driverLabelRepository.replace(id, toSave);
      ctx.json(toSave);
    } catch (Exception e) {
      logger.error("Error updating driver label", e);
      ctx.status(500).result("Error updating driver label: " + e.getMessage());
    }
  }

  public void deleteLabel(Context ctx) {
    try {
      String id = ctx.pathParam("id");
      driverLabelRepository.delete(id);

      // Remove this label ID from any drivers that reference it
      List<Driver> allDrivers = driverRepository.findAll();
      Race activeRace = ClientSubscriptionManager.getInstance().getRace();

      for (Driver driver : allDrivers) {
        if (driver.getLabelIds() != null && driver.getLabelIds().contains(id)) {
          List<String> updatedLabelIds = new ArrayList<>(driver.getLabelIds());
          updatedLabelIds.remove(id);
          Driver updatedDriver = Driver.Builder.from(driver).withLabelIds(updatedLabelIds).build();
          driverRepository.replace(driver.getEntityId(), updatedDriver);
          if (activeRace != null) {
            activeRace.updateDriver(updatedDriver);
          }
        }
      }

      // Remove this label ID from any teams that reference it
      if (teamRepository != null) {
        List<Team> allTeams = teamRepository.findAll();
        for (Team team : allTeams) {
          if (team.getLabelIds() != null && team.getLabelIds().contains(id)) {
            List<String> updatedLabelIds = new ArrayList<>(team.getLabelIds());
            updatedLabelIds.remove(id);
            Team updatedTeam = Team.Builder.from(team).withLabelIds(updatedLabelIds).build();
            teamRepository.replace(team.getEntityId(), updatedTeam);
          }
        }
      }

      ctx.status(204);
    } catch (Exception e) {
      logger.error("Error deleting driver label", e);
      ctx.status(500).result("Error deleting driver label: " + e.getMessage());
    }
  }
}
