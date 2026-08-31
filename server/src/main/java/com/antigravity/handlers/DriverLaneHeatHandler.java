package com.antigravity.handlers;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.Driver;
import com.antigravity.models.TeamOptions;
import com.antigravity.protocols.CarLocation;
import com.antigravity.race.ClientSubscriptionManager;
import com.antigravity.race.DriverHeatData;
import com.antigravity.race.Heat;
import com.antigravity.race.Race;
import com.antigravity.race.RaceParticipant;
import com.antigravity.race.states.Racing;
import com.antigravity.service.DatabaseService;
import io.javalin.http.Context;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class DriverLaneHeatHandler {

  private static final Logger logger = LoggerFactory.getLogger(DriverLaneHeatHandler.class);
  private final DatabaseContext databaseContext;

  public DriverLaneHeatHandler(DatabaseContext databaseContext) {
    this.databaseContext = databaseContext;
  }

  public void changeLane(Context ctx) {
    try {
      int fromLane = Integer.parseInt(ctx.pathParam("fromLane"));
      int toLane = Integer.parseInt(ctx.pathParam("toLane"));
      logger.info("ClientCommand received: change-lane from {} to {}", fromLane, toLane);
      ReplayLogger.logReplayCommand(
          "changeLane", ReplayLogger.mapOf("fromLane", fromLane, "toLane", toLane));

      Race race = ClientSubscriptionManager.getInstance().getRace();
      if (race == null) {
        ctx.status(404).result("No active race found");
        return;
      }

      race.changeLane(fromLane, toLane);
      ctx.status(200).result("Lane changed");
    } catch (Exception e) {
      logger.error("Error changing lane", e);
      ctx.status(500).result("Internal Server Error: " + e.getMessage());
    }
  }

  public void resetLaneHeatData(Context ctx) {
    try {
      String laneParam = ctx.pathParam("lane");
      int lane = "all".equalsIgnoreCase(laneParam) ? -1 : Integer.parseInt(laneParam);
      logger.info("ClientCommand received: reset-lane-heat-data lane {}", lane);
      ReplayLogger.logReplayCommand("resetLaneHeatData", ReplayLogger.mapOf("lane", lane));
      Race race = ClientSubscriptionManager.getInstance().getRace();
      if (race == null) {
        ctx.status(404).result("No active race found");
        return;
      }

      Heat currentHeat = race.getCurrentHeat();
      if (currentHeat == null) {
        ctx.status(404).result("No active heat found");
        return;
      }

      List<DriverHeatData> drivers = currentHeat.getDrivers();
      if (lane == -1) {
        for (DriverHeatData dhd : drivers) {
          dhd.reset();
        }
      } else if (lane >= 0 && lane < drivers.size()) {
        if (!race.getRaceModel().isPractice()) {
          ctx.status(403).result("Resetting a specific lane is only allowed in practice races");
          return;
        }
        drivers.get(lane).reset();
      } else {
        ctx.status(400).result("Invalid lane index: " + lane);
        return;
      }

      race.updateAndBroadcastOverallStandings();
      race.broadcast(race.createSnapshot());
      ctx.status(200);
    } catch (Exception e) {
      logger.error("Error resetting heat data", e);
      ctx.status(500).result("Error: " + e.getMessage());
    }
  }

  @SuppressWarnings("unchecked")
  public void changeActualDriver(Context ctx) {
    try {
      int lane = Integer.parseInt(ctx.pathParam("lane"));
      Map<String, String> body = ctx.bodyAsClass(HashMap.class);
      String driverId = body.get("driverId");
      logger.info(
          "ClientCommand received: change-actual-driver lane {} driverId {}", lane, driverId);
      ReplayLogger.logReplayCommand(
          "changeActualDriver", ReplayLogger.mapOf("lane", lane, "driverId", driverId));

      Race race = ClientSubscriptionManager.getInstance().getRace();
      if (race == null) {
        ctx.status(404).result("No active race found");
        return;
      }

      List<DriverHeatData> drivers = race.getCurrentHeat().getDrivers();
      if (lane >= 0 && lane < drivers.size()) {
        DriverHeatData dhd = drivers.get(lane);
        DatabaseService dbService = DatabaseService.getInstance();
        List<Driver> driversList =
            dbService.getDrivers(databaseContext, Collections.singletonList(driverId));
        Driver driver = driversList.isEmpty() ? null : driversList.get(0);
        if (Driver.EMPTY_DRIVER_ID.equals(driverId)) {
          driver = Driver.EMPTY_DRIVER;
        }

        if (driver != null) {
          TeamOptions options = race.getRaceModel().getTeamOptions();
          if (options != null
              && options.isRequirePitStopChangeDriver()
              && race.getState() instanceof Racing) {
            CarLocation loc = dhd.getCurrentLocation();
            boolean inPit =
                loc == CarLocation.PitRow
                    || (loc != null
                        && loc.getValue() >= CarLocation.PitBayBase.getValue()
                        && loc.getValue()
                            < CarLocation.PitBayBase.getValue()
                                + race.getTrack().getLanes().size());
            if (!inPit) {
              ctx.status(403).result("RD_ERR_DRIVER_CHANGE_NOT_IN_PIT");
              return;
            }
          }

          if (race.getRaceModel().isPractice() && driver != null) {
            for (DriverHeatData otherDhd : drivers) {
              if (otherDhd != dhd && !Driver.EMPTY_DRIVER_ID.equals(driverId)) {
                boolean matchesActual =
                    otherDhd.getActualDriver() != null
                        && otherDhd.getActualDriver().getEntityId() != null
                        && otherDhd.getActualDriver().getEntityId().equals(driverId);

                boolean matchesScheduled =
                    otherDhd.getDriver() != null
                        && otherDhd.getDriver().getDriver() != null
                        && otherDhd.getDriver().getDriver().getEntityId() != null
                        && otherDhd.getDriver().getDriver().getEntityId().equals(driverId);

                if (matchesActual || matchesScheduled) {
                  otherDhd.setActualDriver(Driver.EMPTY_DRIVER);
                  otherDhd.setDriver(new RaceParticipant(Driver.EMPTY_DRIVER));
                  otherDhd.reset();
                }
              }
            }
            dhd.reset();
            dhd.setDriver(new RaceParticipant(driver));
          }

          dhd.setActualDriver(driver);
          race.updateAndBroadcastOverallStandings();
          race.broadcast(race.createSnapshot());
          ctx.status(200);
        } else {
          ctx.status(404).result("RD_ERR_DRIVER_NOT_FOUND");
        }
      } else {
        ctx.status(400).result("Invalid lane index: " + lane);
      }
    } catch (Exception e) {
      ctx.status(500).result("Error: " + e.getMessage());
    }
  }

  @SuppressWarnings("unchecked")
  public void changeHeatActualDriver(Context ctx) {
    try {
      int heatNumber = Integer.parseInt(ctx.pathParam("heatNumber"));
      int lane = Integer.parseInt(ctx.pathParam("lane"));
      Map<String, String> body = ctx.bodyAsClass(HashMap.class);
      String driverId = body.get("driverId");
      logger.info(
          "ClientCommand received: change-heat-actual-driver heat {} lane {} driverId {}",
          heatNumber,
          lane,
          driverId);
      ReplayLogger.logReplayCommand(
          "changeHeatActualDriver",
          ReplayLogger.mapOf("heatNumber", heatNumber, "lane", lane, "driverId", driverId));

      Race race = ClientSubscriptionManager.getInstance().getRace();
      if (race == null) {
        ctx.status(404).result("No active race found");
        return;
      }

      Heat targetHeat = null;
      for (Heat h : race.getHeats()) {
        if (h.getHeatNumber() == heatNumber) {
          targetHeat = h;
          break;
        }
      }

      if (targetHeat == null) {
        ctx.status(404).result("Heat not found: " + heatNumber);
        return;
      }

      List<DriverHeatData> drivers = targetHeat.getDrivers();
      if (lane >= 0 && lane < drivers.size()) {
        DriverHeatData dhd = drivers.get(lane);
        DatabaseService dbService = DatabaseService.getInstance();
        List<Driver> driversList =
            dbService.getDrivers(databaseContext, Collections.singletonList(driverId));
        Driver driver = driversList.isEmpty() ? null : driversList.get(0);
        if (Driver.EMPTY_DRIVER_ID.equals(driverId)) {
          driver = Driver.EMPTY_DRIVER;
        }

        if (driver != null) {
          if (heatNumber == race.getCurrentHeat().getHeatNumber()) {
            TeamOptions options = race.getRaceModel().getTeamOptions();
            if (options != null
                && options.isRequirePitStopChangeDriver()
                && race.getState() instanceof Racing) {
              CarLocation loc = dhd.getCurrentLocation();
              boolean inPit =
                  loc == CarLocation.PitRow
                      || (loc != null
                          && loc.getValue() >= CarLocation.PitBayBase.getValue()
                          && loc.getValue()
                              < CarLocation.PitBayBase.getValue()
                                  + race.getTrack().getLanes().size());
              if (!inPit) {
                ctx.status(403).result("RD_ERR_DRIVER_CHANGE_NOT_IN_PIT");
                return;
              }
            }
          }

          if (race.getRaceModel().isPractice() && driver != null) {
            for (DriverHeatData otherDhd : drivers) {
              if (otherDhd != dhd
                  && otherDhd.getActualDriver() != null
                  && otherDhd.getActualDriver().getEntityId() != null
                  && otherDhd.getActualDriver().getEntityId().equals(driverId)
                  && !Driver.EMPTY_DRIVER_ID.equals(driverId)) {
                otherDhd.setActualDriver(Driver.EMPTY_DRIVER);
                otherDhd.reset();
              }
            }
            dhd.reset();
          }

          dhd.setActualDriver(driver);
          race.updateAndBroadcastOverallStandings();
          race.broadcast(race.createSnapshot());
          ctx.status(200);
        } else {
          ctx.status(404).result("RD_ERR_DRIVER_NOT_FOUND");
        }
      } else {
        ctx.status(400).result("Invalid lane index: " + lane);
      }
    } catch (Exception e) {
      ctx.status(500).result("Error: " + e.getMessage());
    }
  }

  @SuppressWarnings("unchecked")
  public void updateUserLaps(Context ctx) {
    logger.info("ClientCommand received: update-user-laps");
    try {
      updateUserLaps(ctx, ctx.pathParamMap(), ctx.bodyAsClass(HashMap.class));
    } catch (Exception e) {
      ctx.status(500).result("Error: " + e.getMessage());
    }
  }

  public void updateUserLaps(
      Context ctx, Map<String, String> pathParams, Map<String, Object> body) {
    try {
      int lane = Integer.parseInt(pathParams.get("lane"));
      ReplayLogger.logReplayCommand(
          "updateUserLaps", ReplayLogger.mapOf("lane", lane, "body", body));
      Race race = ClientSubscriptionManager.getInstance().getRace();
      if (race == null) {
        ctx.status(404).result("No active race found");
        return;
      }

      Heat currentHeat = race.getCurrentHeat();
      if (currentHeat == null) {
        ctx.status(404).result("No current heat found");
        return;
      }

      List<DriverHeatData> drivers = currentHeat.getDrivers();
      if (lane >= 0 && lane < drivers.size()) {
        DriverHeatData dhd = drivers.get(lane);
        if (body.containsKey("userLaps")) {
          double value = ((Number) body.get("userLaps")).doubleValue();
          dhd.setUserLaps(value);

          currentHeat.initializeStandings(
              race.getRaceModel().getHeatScoring(), race.getRaceModel().isPractice());
          race.updateAndBroadcastOverallStandings();
          race.updateScoreRecords();
          race.broadcast(race.createSnapshot());

          ctx.status(200)
              .json(Collections.singletonMap("adjustedLapCount", dhd.getAdjustedLapCount()));
        } else {
          ctx.status(400).result("Missing userLaps in body");
        }
      } else {
        ctx.status(400).result("Invalid lane index: " + lane);
      }
    } catch (Exception e) {
      ctx.status(500).result("Error: " + e.getMessage());
    }
  }

  @SuppressWarnings("unchecked")
  public void updateHeatUserLaps(Context ctx) {
    try {
      int heatNumber = Integer.parseInt(ctx.pathParam("heatNumber"));
      int lane = Integer.parseInt(ctx.pathParam("lane"));
      Map<String, Object> body = ctx.bodyAsClass(HashMap.class);
      logger.info(
          "ClientCommand received: update-heat-user-laps heat {} lane {}", heatNumber, lane);
      ReplayLogger.logReplayCommand(
          "updateHeatUserLaps",
          ReplayLogger.mapOf("heatNumber", heatNumber, "lane", lane, "body", body));

      Race race = ClientSubscriptionManager.getInstance().getRace();
      if (race == null) {
        ctx.status(404).result("No active race found");
        return;
      }

      Heat targetHeat = null;
      for (Heat h : race.getHeats()) {
        if (h.getHeatNumber() == heatNumber) {
          targetHeat = h;
          break;
        }
      }

      if (targetHeat == null) {
        ctx.status(404).result("Heat not found: " + heatNumber);
        return;
      }

      List<DriverHeatData> drivers = targetHeat.getDrivers();
      if (lane >= 0 && lane < drivers.size()) {
        DriverHeatData dhd = drivers.get(lane);
        if (body.containsKey("userLaps")) {
          double value = ((Number) body.get("userLaps")).doubleValue();
          dhd.setUserLaps(value);

          targetHeat.initializeStandings(
              race.getRaceModel().getHeatScoring(), race.getRaceModel().isPractice());
          race.updateAndBroadcastOverallStandings();
          race.updateScoreRecords();
          race.broadcast(race.createSnapshot());

          ctx.status(200)
              .json(Collections.singletonMap("adjustedLapCount", dhd.getAdjustedLapCount()));
        } else {
          ctx.status(400).result("Missing userLaps in body");
        }
      } else {
        ctx.status(400).result("Invalid lane index: " + lane);
      }
    } catch (Exception e) {
      ctx.status(500).result("Error: " + e.getMessage());
    }
  }

  @SuppressWarnings("unchecked")
  public void updateBatchUserLaps(Context ctx) {
    logger.info("ClientCommand received: update-batch-user-laps");
    try {
      List<Map<String, Object>> updates = ctx.bodyAsClass(List.class);
      ReplayLogger.logReplayCommand("updateBatchUserLaps", ReplayLogger.mapOf("updates", updates));
      Race race = ClientSubscriptionManager.getInstance().getRace();
      if (race == null) {
        ctx.status(404).result("No active race found");
        return;
      }

      Set<Heat> heatsToRecalculate = new HashSet<>();

      for (Map<String, Object> update : updates) {
        int heatNumber = ((Number) update.get("heatNumber")).intValue();
        int lane = ((Number) update.get("laneIndex")).intValue();
        double userLaps = ((Number) update.get("userLaps")).doubleValue();

        Heat targetHeat = null;
        for (Heat h : race.getHeats()) {
          if (h.getHeatNumber() == heatNumber) {
            targetHeat = h;
            break;
          }
        }

        if (targetHeat == null) {
          ctx.status(404).result("Heat not found: " + heatNumber);
          return;
        }

        List<DriverHeatData> drivers = targetHeat.getDrivers();
        if (lane >= 0 && lane < drivers.size()) {
          DriverHeatData dhd = drivers.get(lane);
          dhd.setUserLaps(userLaps);
          heatsToRecalculate.add(targetHeat);
        } else {
          ctx.status(400).result("Invalid lane index: " + lane + " for heat " + heatNumber);
          return;
        }
      }

      for (Heat heat : heatsToRecalculate) {
        heat.initializeStandings(
            race.getRaceModel().getHeatScoring(), race.getRaceModel().isPractice());
      }
      race.updateAndBroadcastOverallStandings();
      race.updateScoreRecords();
      race.broadcast(race.createSnapshot());

      ctx.status(200).result("OK");
    } catch (Exception e) {
      ctx.status(500).result("Error: " + e.getMessage());
    }
  }
}
