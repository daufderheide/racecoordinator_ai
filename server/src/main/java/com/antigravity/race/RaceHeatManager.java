package com.antigravity.race;

import com.antigravity.converters.HeatConverter;
import com.antigravity.models.Driver;
import com.antigravity.models.Team;
import com.antigravity.proto.ModifyHeatsRequest;
import com.antigravity.proto.ModifyHeatsResponse;
import com.antigravity.proto.RegenerateHeatsRequest;
import com.antigravity.proto.RegenerateHeatsResponse;
import com.antigravity.race.states.RaceOver;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class RaceHeatManager {
  private static final Logger logger = LoggerFactory.getLogger(RaceHeatManager.class);

  private final Race race;

  public RaceHeatManager(Race race) {
    this.race = race;
  }

  public synchronized ModifyHeatsResponse modifyHeats(ModifyHeatsRequest request) {
    logger.info("Race.modifyHeats() called");

    if (this.race.getState() instanceof RaceOver) {
      return ModifyHeatsResponse.newBuilder()
          .setSuccess(false)
          .setErrorMessage("Cannot modify heats when the race is over.")
          .build();
    }

    // 1. Validation
    String validationError = validateModification(request);
    if (validationError != null) {
      return ModifyHeatsResponse.newBuilder()
          .setSuccess(false)
          .setErrorMessage(validationError)
          .build();
    }

    // 2. Update Participants
    updateParticipants(request);

    // 3. Update Heats
    String heatUpdateError = updateHeats(request);
    if (heatUpdateError != null) {
      return ModifyHeatsResponse.newBuilder()
          .setSuccess(false)
          .setErrorMessage(heatUpdateError)
          .build();
    }

    // 4. Update Current Heat if it was modified
    finalizeModification();

    return ModifyHeatsResponse.newBuilder().setSuccess(true).build();
  }

  private String validateModification(ModifyHeatsRequest request) {
    // 1. Ensure no started heats are deleted
    for (com.antigravity.race.Heat existingHeat : this.race.getHeats()) { // fqn-collision
      if (existingHeat.isStarted()) {
        boolean found = false;
        for (com.antigravity.proto.Heat protoHeat : request.getHeatsList()) { // fqn-collision
          if (existingHeat.getObjectId().equals(protoHeat.getObjectId())) {
            found = true;
            break;
          }
        }
        if (!found) {
          return "Cannot delete a heat that has already been started (Heat "
              + existingHeat.getHeatNumber()
              + ").";
        }
      }
    }

    // 2. Validate Participant Removal
    String participantRemovalError = validateParticipantRemoval(request);
    if (participantRemovalError != null) return participantRemovalError;

    // 3. Validate Duplicate Participants
    String duplicateParticipantError = validateDuplicateParticipants(request);
    if (duplicateParticipantError != null) return duplicateParticipantError;

    // 4. Validate No Duplicate Drivers in a Heat
    return validateHeatDrivers(request);
  }

  private String validateParticipantRemoval(ModifyHeatsRequest request) {
    Set<String> newParticipantIds = new HashSet<>();
    for (com.antigravity.proto.RaceParticipant protoP : // fqn-collision
        request.getParticipantsList()) { // fqn-collision
      newParticipantIds.add(protoP.getObjectId());
    }

    for (RaceParticipant p : this.race.getDrivers()) {
      if (p.getDriver() != null && p.getDriver().isEmpty()) continue;

      if (!newParticipantIds.contains(p.getObjectId())) {
        for (com.antigravity.race.Heat h : this.race.getHeats()) { // fqn-collision
          if (h.isStarted()) {
            for (DriverHeatData dhd : h.getDrivers()) {
              if (dhd.getDriver() != null
                  && dhd.getDriver().getObjectId().equals(p.getObjectId())) {
                return "Participant "
                    + (p.getDriver() != null ? p.getDriver().getName() : "Unknown")
                    + " cannot be removed because they have already participated in a started heat.";
              }
            }
          }
        }
      }
    }
    return null;
  }

  private String validateDuplicateParticipants(ModifyHeatsRequest request) {
    Set<String> usedDriverEntityIds = new HashSet<>();
    Set<String> usedTeamEntityIds = new HashSet<>();
    for (com.antigravity.proto.RaceParticipant protoP : // fqn-collision
        request.getParticipantsList()) { // fqn-collision
      if (protoP.hasDriver()) {
        String driverEntityId = protoP.getDriver().getModel().getEntityId();
        if (driverEntityId != null
            && !driverEntityId.isEmpty()
            && !driverEntityId.equals(Driver.EMPTY_DRIVER_ID)) {
          if (!usedDriverEntityIds.add(driverEntityId)) {
            return "Duplicate participant: Driver "
                + protoP.getDriver().getName()
                + " is added more than once.";
          }
        }
      }
      if (protoP.hasTeam()) {
        String teamEntityId = protoP.getTeam().getModel().getEntityId();
        if (teamEntityId != null && !teamEntityId.isEmpty()) {
          if (!usedTeamEntityIds.add(teamEntityId)) {
            return "Duplicate participant: Team "
                + protoP.getTeam().getName()
                + " is added more than once.";
          }
        }
        for (String driverEntityId : protoP.getTeam().getDriverIdsList()) {
          if (driverEntityId != null
              && !driverEntityId.isEmpty()
              && !driverEntityId.equals(Driver.EMPTY_DRIVER_ID)) {
            if (!usedDriverEntityIds.add(driverEntityId)) {
              return "Overlap detected: Driver in team "
                  + protoP.getTeam().getName()
                  + " is already a participant (either individually or in another team).";
            }
          }
        }
      }
    }
    return null;
  }

  private String validateHeatDrivers(ModifyHeatsRequest request) {
    for (com.antigravity.proto.Heat protoHeat : request.getHeatsList()) { // fqn-collision
      Set<String> driverObjectIds = new HashSet<>();
      for (com.antigravity.proto.DriverHeatData protoDhd : // fqn-collision
          protoHeat.getHeatDriversList()) {
        String driverObjectId = protoDhd.getDriver().getObjectId();
        if (driverObjectId != null && !driverObjectId.isEmpty()) {
          if (!driverObjectIds.add(driverObjectId)) {
            RaceParticipant p = findParticipantByObjectId(driverObjectId);
            if (p == null) {
              p = findParticipantInProtoRequest(request, driverObjectId);
            }
            String name =
                (p != null && p.getDriver() != null) ? p.getDriver().getName() : "Unknown";
            return "Driver "
                + name
                + " is assigned to multiple lanes in Heat "
                + protoHeat.getHeatNumber()
                + ".";
          }
        }
      }
    }
    return null;
  }

  private void updateParticipants(ModifyHeatsRequest request) {
    List<RaceParticipant> newDrivers = new ArrayList<>();
    for (com.antigravity.proto.RaceParticipant protoP : // fqn-collision
        request.getParticipantsList()) {
      RaceParticipant p = findParticipantByObjectId(protoP.getObjectId());
      if (p == null) {
        logger.info("Adding new participant to race: {}", protoP.getObjectId());
        p = findParticipantInProtoRequest(request, protoP.getObjectId());
      }
      if (p != null) {
        newDrivers.add(p);
      }
    }
    this.race.getDrivers().clear();
    this.race.getDrivers().addAll(newDrivers);

    int numLanes = this.race.getTrack().getLanes().size();
    while (this.race.getDrivers().size() < numLanes) {
      this.race.getDrivers().add(new RaceParticipant(Driver.EMPTY_DRIVER));
    }
  }

  private String updateHeats(ModifyHeatsRequest request) {
    List<com.antigravity.race.Heat> newHeats = new ArrayList<>(); // fqn-collision
    for (com.antigravity.proto.Heat protoHeat : request.getHeatsList()) { // fqn-collision
      com.antigravity.race.Heat oldHeat = null; // fqn-collision
      if (protoHeat.getObjectId() != null && !protoHeat.getObjectId().isEmpty()) {
        oldHeat = findHeatByObjectId(protoHeat.getObjectId());
      }

      if (oldHeat != null && oldHeat.isStarted()) {
        String error = validateStartedHeatModification(protoHeat, oldHeat);
        if (error != null) return error;
        newHeats.add(oldHeat);
      } else {
        newHeats.add(createNewHeat(request, protoHeat));
      }
    }
    this.race.setHeats(newHeats);
    return null;
  }

  private String validateStartedHeatModification(
      com.antigravity.proto.Heat protoHeat, com.antigravity.race.Heat oldHeat) { // fqn-collision
    if (protoHeat.getHeatDriversCount() != oldHeat.getDrivers().size()) {
      return "Cannot change number of lanes in a started heat (Heat "
          + oldHeat.getHeatNumber()
          + ").";
    }

    for (int i = 0; i < protoHeat.getHeatDriversCount(); i++) {
      com.antigravity.proto.DriverHeatData protoDhd = protoHeat.getHeatDrivers(i); // fqn-collision
      DriverHeatData oldDhd = oldHeat.getDrivers().get(i);

      String protoDriverObjectId = protoDhd.getDriver().getObjectId();
      String oldDriverObjectId =
          (oldDhd.getDriver() != null) ? oldDhd.getDriver().getObjectId() : "";

      boolean isProtoEmpty = protoDriverObjectId == null || protoDriverObjectId.isEmpty();
      boolean isOldEmpty =
          (oldDhd.getDriver() == null
              || oldDhd.getDriver().getDriver() == null
              || oldDhd.getDriver().getDriver().isEmpty());

      if (!protoDriverObjectId.equals(oldDriverObjectId) && !(isProtoEmpty && isOldEmpty)) {
        return "Cannot change participants in a started heat (Heat "
            + oldHeat.getHeatNumber()
            + ").";
      }
    }
    return null;
  }

  private com.antigravity.race.Heat createNewHeat( // fqn-collision
      ModifyHeatsRequest request, com.antigravity.proto.Heat protoHeat) { // fqn-collision
    List<DriverHeatData> newHeatDrivers = new ArrayList<>();
    for (com.antigravity.proto.DriverHeatData protoDhd : // fqn-collision
        protoHeat.getHeatDriversList()) {
      RaceParticipant p = findParticipantByObjectId(protoDhd.getDriver().getObjectId());
      if (p == null) {
        p = findParticipantInProtoRequest(request, protoDhd.getDriver().getObjectId());
        if (p != null && findParticipantByObjectId(p.getObjectId()) == null) {
          this.race.getDrivers().add(p);
        }
      }
      if (p == null) {
        p = new RaceParticipant(Driver.EMPTY_DRIVER);
      }
      DriverHeatData dhd = new DriverHeatData(p);
      dhd.setObjectId(protoDhd.getObjectId());
      newHeatDrivers.add(dhd);
    }
    com.antigravity.race.Heat newHeat = // fqn-collision
        new com.antigravity.race.Heat( // fqn-collision
            protoHeat.getHeatNumber(), newHeatDrivers, this.race.getRaceModel().getHeatScoring());
    newHeat.setObjectId(protoHeat.getObjectId());
    newHeat.setStarted(protoHeat.getStarted());
    return newHeat;
  }

  private void finalizeModification() {
    if (this.race.getCurrentHeat() != null) {
      int currentHeatNum = this.race.getCurrentHeat().getHeatNumber();
      if (currentHeatNum > 0 && currentHeatNum <= this.race.getHeats().size()) {
        this.race.setCurrentHeat(this.race.getHeats().get(currentHeatNum - 1));
      }
    }

    this.race.updateAndBroadcastOverallStandings();
    this.race.broadcast(this.race.createSnapshot());
  }

  public synchronized RegenerateHeatsResponse regenerateHeats(RegenerateHeatsRequest request) {
    logger.info("Race.regenerateHeats() called");

    if (this.race.getState() instanceof RaceOver) {
      return RegenerateHeatsResponse.newBuilder()
          .setSuccess(false)
          .setErrorMessage("Cannot regenerate heats when the race is over.")
          .build();
    }

    boolean anyHeatStarted = false;
    for (com.antigravity.race.Heat h : this.race.getHeats()) { // fqn-collision
      if (h.isStarted()) {
        anyHeatStarted = true;
        break;
      }
    }

    if (anyHeatStarted) {
      return RegenerateHeatsResponse.newBuilder()
          .setSuccess(false)
          .setErrorMessage(
              "One or more heats have already been started. Regeneration is only allowed before any heats have run.")
          .build();
    }

    List<com.antigravity.race.Heat> preservedHeats = new ArrayList<>(); // fqn-collision
    List<RaceParticipant> driversToUse = new ArrayList<>(this.race.getDrivers());

    if (request.getParticipantsCount() > 0) {
      List<RaceParticipant> newDrivers = new ArrayList<>();
      for (com.antigravity.proto.RaceParticipant protoP : // fqn-collision
          request.getParticipantsList()) {
        RaceParticipant p = findParticipantByObjectId(protoP.getObjectId());
        if (p == null) {
          Driver d =
              new Driver(
                  protoP.getDriver().getName(),
                  protoP.getDriver().getNickname(),
                  protoP.getDriver().getModel().getEntityId(),
                  null);
          p = new RaceParticipant(d, protoP.getObjectId());
          p.setSeed(protoP.getSeed());
        }
        newDrivers.add(p);
      }
      driversToUse = newDrivers;
      int numLanes = this.race.getTrack().getLanes().size();
      while (driversToUse.size() < numLanes) {
        driversToUse.add(new RaceParticipant(Driver.EMPTY_DRIVER));
      }
    }

    List<com.antigravity.race.Heat> regeneratedHeats = // fqn-collision
        HeatBuilder.buildHeats(this.race, driversToUse, this.race.getCustomRotations());

    List<com.antigravity.race.Heat> finalHeats = new ArrayList<>(preservedHeats); // fqn-collision
    for (int i = preservedHeats.size(); i < regeneratedHeats.size(); i++) {
      com.antigravity.race.Heat h = regeneratedHeats.get(i); // fqn-collision
      h.setHeatNumber(i + 1);
      finalHeats.add(h);
    }

    RegenerateHeatsResponse.Builder responseBuilder =
        RegenerateHeatsResponse.newBuilder().setSuccess(true);
    for (com.antigravity.race.Heat h : finalHeats) { // fqn-collision
      responseBuilder.addHeats(HeatConverter.toProto(h, new HashSet<String>()));
    }
    return responseBuilder.build();
  }

  private RaceParticipant findParticipantByObjectId(String objectId) {
    for (RaceParticipant p : this.race.getDrivers()) {
      if (p.getObjectId().equals(objectId)) {
        return p;
      }
    }
    return null;
  }

  private com.antigravity.race.Heat findHeatByObjectId(String objectId) { // fqn-collision
    if (objectId == null || objectId.isEmpty()) return null;
    for (com.antigravity.race.Heat h : this.race.getHeats()) { // fqn-collision
      if (h.getObjectId().equals(objectId)) {
        return h;
      }
    }
    return null;
  }

  private RaceParticipant findParticipantInProtoRequest(
      ModifyHeatsRequest request, String objectId) {
    for (com.antigravity.proto.RaceParticipant protoP : // fqn-collision
        request.getParticipantsList()) {
      if (protoP.getObjectId().equals(objectId)) {
        if (protoP.hasTeam()) {
          Team t = new Team(protoP.getTeam());
          RaceParticipant p = new RaceParticipant(t);
          p.setObjectId(protoP.getObjectId());
          p.setSeed(protoP.getSeed());
          return p;
        } else if (protoP.hasDriver()) {
          Driver d =
              new Driver(
                  protoP.getDriver().getName(),
                  protoP.getDriver().getNickname(),
                  protoP.getDriver().getModel().getEntityId(),
                  null);
          RaceParticipant p = new RaceParticipant(d, protoP.getObjectId());
          p.setSeed(protoP.getSeed());
          return p;
        }
      }
    }
    return null;
  }
}
