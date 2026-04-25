package com.antigravity.race;

import com.antigravity.models.Driver;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.HeatScoring;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.ArrayList;
import java.util.List;

public class HeatBuilder {

  public static List<Heat> buildHeats(Race race, List<RaceParticipant> drivers) {
    int numLanes = race.getTrack().getLanes().size();
    HeatRotationType rotationType = race.getRaceModel().getHeatRotationType();
    switch (rotationType) {
      case RoundRobin:
        return getRoundRobinHeats(
            drivers,
            numLanes,
            getRoundRobinRotationSequence(numLanes),
            false,
            race.getRaceModel().getHeatScoring());
      case FriendlyRoundRobin:
        return getRoundRobinHeats(
            drivers,
            numLanes,
            getRoundRobinRotationSequence(numLanes),
            true,
            race.getRaceModel().getHeatScoring());
      case EuropeanRoundRobin:
        return getRoundRobinHeats(
            drivers,
            numLanes,
            getEuroRoundRobinRotationSequence(numLanes),
            false,
            race.getRaceModel().getHeatScoring());
      case SingleHeat:
        return getSingleHeatHeats(drivers, numLanes, race.getRaceModel().getHeatScoring());
      case SingleHeatSolo:
        return getSingleHeatSoloHeats(
            drivers,
            numLanes,
            race.getRaceModel().getHeatScoring(),
            race.getRaceModel().getSoloLaneIndex());
      default:
        throw new IllegalArgumentException("Unknown HeatRotationType: " + rotationType);
    }
  }

  private static List<Integer> getRoundRobinRotationSequence(int numLanes) {
    List<Integer> rotationSequence = new ArrayList<>();
    for (int i = 0; i < numLanes; i++) {
      rotationSequence.add((i + 1));
    }
    return rotationSequence;
  }

  private static List<Integer> getEuroRoundRobinRotationSequence(int numLanes) {
    List<Integer> rotationSequence = new ArrayList<>();

    // Odd lanes first (0 based) in incrementing order
    // [1, 3, 5, 7, ..]
    for (int i = 0; i < numLanes; i += 2) {
      rotationSequence.add((i + 1));
    }

    // Even lanes next, in decrementing order
    // [.., 8, 6, 4, 2]
    int evenLane = numLanes;
    if (numLanes % 2 != 0) {
      evenLane = numLanes - 1;
    }
    for (int i = numLanes; i > 1; i -= 2) {
      rotationSequence.add(evenLane);
      evenLane -= 2;
    }
    return rotationSequence;
  }

  private static List<Heat> getRoundRobinHeats(
      List<RaceParticipant> drivers,
      int numLanes,
      List<Integer> rotationSequence,
      boolean friendly,
      HeatScoring scoring) {
    List<Heat> heatList = new ArrayList<>();

    int numHeats;
    if (drivers.size() > rotationSequence.size()) {
      numHeats = drivers.size();
    } else {
      numHeats = rotationSequence.size();
    }

    for (int h = 0; h < numHeats; h++) {
      List<DriverHeatData> heatDrivers = new ArrayList<>();

      // First put an empty lane everywhere
      for (long laneIdx = 0; laneIdx < numLanes; laneIdx++) {
        heatDrivers.add(new DriverHeatData(new RaceParticipant(Driver.EMPTY_DRIVER)));
      }

      // Now use the rotation sequence to fill in the drivers
      for (int d = 0; d < drivers.size(); d++) {
        int v = (h + d) % numHeats;
        if (v < rotationSequence.size()) {
          int lane = rotationSequence.get(v);
          if (lane > 0) {
            lane--;
            if (lane < numLanes) {
              int idx = d;
              if (friendly) {
                // Swap the order of the initial group of sitouts so that the
                // first sit out rotated in is the lowest seed.
                if (d >= numLanes) {
                  idx = drivers.size() - (d - numLanes) - 1;
                }
              }
              RaceParticipant participant = drivers.get(idx);
              DriverHeatData data = new DriverHeatData(participant);
              if (participant.isTeamParticipant()
                  && participant.getTeam() != null
                  && participant.getTeamDrivers() != null
                  && !participant.getTeamDrivers().isEmpty()) {
                // Rotate drivers based on heat number
                int driverIdx = h % participant.getTeamDrivers().size();
                Driver assignedDriver = participant.getTeamDrivers().get(driverIdx);
                logToFile(
                    "HeatBuilder: Heat "
                        + h
                        + ", Team "
                        + participant.getTeam().getName()
                        + " -> Assigning driver: "
                        + assignedDriver.getName()
                        + " (Index: "
                        + driverIdx
                        + ")");
                data.setActualDriver(assignedDriver);
              } else {
                if (participant.getTeam() != null) {
                  logToFile(
                      "HeatBuilder: Heat "
                          + h
                          + ", Team "
                          + participant.getTeam().getName()
                          + " -> No team drivers found!");
                }
              }
              heatDrivers.set(lane, data);
            }
          }
        }
      }
      heatList.add(new Heat(h + 1, heatDrivers, scoring));
    }
    return heatList;
  }

  private static List<Heat> getSingleHeatHeats(
      List<RaceParticipant> drivers, int numLanes, HeatScoring scoring) {
    List<Heat> heatList = new ArrayList<>();
    if (drivers.isEmpty()) {
      return heatList;
    }

    int numDrivers = drivers.size();
    int numHeats = (int) Math.ceil((double) numDrivers / numLanes);

    int driversPerHeat = numDrivers / numHeats;
    int extraDrivers = numDrivers % numHeats;

    int driverIndex = 0;
    for (int h = 0; h < numHeats; h++) {
      List<DriverHeatData> heatDrivers = new ArrayList<>();
      int driversInThisHeat = driversPerHeat + (h < extraDrivers ? 1 : 0);

      for (int l = 0; l < numLanes; l++) {
        if (l < driversInThisHeat && driverIndex < numDrivers) {
          RaceParticipant participant = drivers.get(driverIndex++);
          DriverHeatData data = new DriverHeatData(participant);

          if (participant.isTeamParticipant()
              && participant.getTeam() != null
              && participant.getTeamDrivers() != null
              && !participant.getTeamDrivers().isEmpty()) {
            int dIdx = h % participant.getTeamDrivers().size();
            Driver assignedDriver = participant.getTeamDrivers().get(dIdx);
            data.setActualDriver(assignedDriver);
          }
          heatDrivers.add(data);
        } else {
          heatDrivers.add(new DriverHeatData(new RaceParticipant(Driver.EMPTY_DRIVER)));
        }
      }
      heatList.add(new Heat(h + 1, heatDrivers, scoring));
    }
    return heatList;
  }

  private static List<Heat> getSingleHeatSoloHeats(
      List<RaceParticipant> drivers, int numLanes, HeatScoring scoring, int soloLaneIndex) {
    List<Heat> heatList = new ArrayList<>();
    if (drivers.isEmpty()) {
      return heatList;
    }

    // Ensure soloLaneIndex is within bounds
    int effectiveSoloLaneIndex = Math.max(0, Math.min(soloLaneIndex, numLanes - 1));

    for (int h = 0; h < drivers.size(); h++) {
      List<DriverHeatData> heatDrivers = new ArrayList<>();
      RaceParticipant participant = drivers.get(h);
      DriverHeatData data = new DriverHeatData(participant);

      if (participant.isTeamParticipant()
          && participant.getTeam() != null
          && participant.getTeamDrivers() != null
          && !participant.getTeamDrivers().isEmpty()) {
        int dIdx = h % participant.getTeamDrivers().size();
        Driver assignedDriver = participant.getTeamDrivers().get(dIdx);
        data.setActualDriver(assignedDriver);
      }

      // Fill all lanes, placing the driver in the effectiveSoloLaneIndex
      for (int l = 0; l < numLanes; l++) {
        if (l == effectiveSoloLaneIndex) {
          heatDrivers.add(data);
        } else {
          heatDrivers.add(new DriverHeatData(new RaceParticipant(Driver.EMPTY_DRIVER)));
        }
      }

      heatList.add(new Heat(h + 1, heatDrivers, scoring));
    }
    return heatList;
  }

  private static void logToFile(String message) {
    try {
      String tmpDir = System.getProperty("java.io.tmpdir");
      Path logPath = Paths.get(tmpDir, "race_debug.log");
      Files.write(
          logPath,
          (message + "\n").getBytes(),
          StandardOpenOption.CREATE,
          StandardOpenOption.APPEND);
    } catch (Exception e) {
      // Ignore
    }
  }
}
