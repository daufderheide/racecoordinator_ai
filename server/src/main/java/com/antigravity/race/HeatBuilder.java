package com.antigravity.race;

import com.antigravity.models.CustomHeat;
import com.antigravity.models.CustomRotation;
import com.antigravity.models.Driver;
import com.antigravity.models.GroupOptions;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.HeatScoring;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class HeatBuilder {
  private static final Logger logger = LoggerFactory.getLogger(HeatBuilder.class);

  public static List<Heat> buildHeats(
      Race race, List<RaceParticipant> drivers, List<CustomRotation> customRotations) {
    int numLanes = race.getTrack().getLanes().size();
    GroupOptions groupOptions = race.getRaceModel().getGroupOptions();
    List<Heat> heatList = new ArrayList<>();

    boolean isCustom = race.getRaceModel().getHeatRotationType() == HeatRotationType.Custom;

    if (groupOptions != null && groupOptions.isEnabled() && !isCustom) {
      List<Integer> driverGroups =
          getGroups(
              drivers,
              numLanes,
              groupOptions.getMaxGroups(),
              groupOptions.isBalance(),
              groupOptions.isAllowEmptyLanes(),
              groupOptions.isForceMultipleOfMax());

      int numGroups = 0;
      for (int g : driverGroups) {
        if (g >= numGroups) {
          numGroups = g + 1;
        }
      }

      for (int g = 0; g < numGroups; g++) {
        List<RaceParticipant> groupDrivers = new ArrayList<>();
        for (int i = 0; i < drivers.size(); i++) {
          if (driverGroups.get(i) == g) {
            groupDrivers.add(drivers.get(i));
          }
        }

        if (groupDrivers.isEmpty()) {
          continue;
        }

        List<Heat> groupHeats = buildHeatsForGroup(race, groupDrivers, g, customRotations);
        heatList.addAll(groupHeats);
      }

      if (groupOptions.isRotateGroupHeats()) {
        heatList = resortGroupHeats(heatList);
      }
    } else {
      heatList = buildHeatsForGroup(race, drivers, 0, customRotations);
    }

    // Heat Times Through
    int timesThrough = race.getRaceModel().getHeatTimesThrough();
    logger.debug(
        "buildHeats: timesThrough={}, reverseHeats={}",
        timesThrough,
        race.getRaceModel().isReverseHeats());
    if (timesThrough > 1) {
      List<Heat> baseHeats = new ArrayList<>(heatList);
      for (int i = 1; i < timesThrough; i++) {
        for (int hIdx = 0; hIdx < baseHeats.size(); hIdx++) {
          Heat h = baseHeats.get(hIdx);
          int totalHeatIdx = i * baseHeats.size() + hIdx;
          List<DriverHeatData> clonedDrivers = new ArrayList<>();
          for (DriverHeatData dhd : h.getDrivers()) {
            RaceParticipant participant = dhd.getDriver();
            DriverHeatData newDhd = new DriverHeatData(participant);
            if (participant != null
                && participant.isTeamParticipant()
                && participant.getTeam() != null
                && participant.getTeamDrivers() != null
                && !participant.getTeamDrivers().isEmpty()) {
              int teamDriverIdx = totalHeatIdx % participant.getTeamDrivers().size();
              newDhd.setActualDriver(participant.getTeamDrivers().get(teamDriverIdx));
            } else {
              newDhd.setActualDriver(dhd.getActualDriver());
            }
            clonedDrivers.add(newDhd);
          }
          heatList.add(
              new Heat(
                  totalHeatIdx + 1,
                  clonedDrivers,
                  h.getGroup(),
                  race.getRaceModel().getHeatScoring()));
        }
      }
    }

    // Reverse Heats
    if (race.getRaceModel().isReverseHeats()) {
      Collections.reverse(heatList);
    }

    // Renumber heats to ensure they are sequential after reversal or duplication
    for (int i = 0; i < heatList.size(); i++) {
      heatList.get(i).setHeatNumber(i + 1);
    }

    return heatList;
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
    if (rotationSequence != null) {
      Set<Integer> uniqueLanes = new HashSet<>();
      for (Integer lane : rotationSequence) {
        if (lane == null) {
          throw new IllegalArgumentException("Lane number in rotationSequence cannot be null");
        }
        if (lane > 0 && !uniqueLanes.add(lane)) {
          throw new IllegalArgumentException(
              "Lane number " + lane + " appears more than once in rotationSequence");
        }
      }
    }

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
                logger.debug(
                    "HeatBuilder: Heat {}, Team {} -> Assigning driver: {} (Index: {})",
                    h,
                    participant.getTeam().getName(),
                    assignedDriver.getName(),
                    driverIdx);
                data.setActualDriver(assignedDriver);
              } else {
                if (participant.getTeam() != null) {
                  logger.warn(
                      "HeatBuilder: Heat {}, Team {} -> No team drivers found!",
                      h,
                      participant.getTeam().getName());
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

  private static List<Heat> getCustomHeats(
      List<RaceParticipant> drivers,
      int numLanes,
      List<CustomRotation> customRotations,
      HeatScoring scoring) {
    if (customRotations == null || customRotations.isEmpty()) {
      throw new IllegalArgumentException("No custom rotations defined");
    }

    int driverCount = drivers.size();
    CustomRotation selectedRotation = null;

    // 1) Exact match
    for (CustomRotation rot : customRotations) {
      if (rot.getNumDrivers() == driverCount) {
        selectedRotation = rot;
        break;
      }
    }

    // 2) Closest above
    if (selectedRotation == null) {
      int minDiff = Integer.MAX_VALUE;
      for (CustomRotation rot : customRotations) {
        if (rot.getNumDrivers() > driverCount) {
          int diff = rot.getNumDrivers() - driverCount;
          if (diff < minDiff) {
            minDiff = diff;
            selectedRotation = rot;
          }
        }
      }
    }

    // 3) Closest below
    if (selectedRotation == null) {
      int minDiff = Integer.MAX_VALUE;
      for (CustomRotation rot : customRotations) {
        int diff = driverCount - rot.getNumDrivers();
        if (diff < minDiff) {
          minDiff = diff;
          selectedRotation = rot;
        }
      }
    }

    if (selectedRotation == null) {
      throw new IllegalStateException("Could not select a custom rotation");
    }

    List<Heat> heatList = new ArrayList<>();
    for (int h = 0; h < selectedRotation.getHeats().size(); h++) {
      CustomHeat customHeat = selectedRotation.getHeats().get(h);
      List<DriverHeatData> heatDrivers = new ArrayList<>();

      for (int l = 0; l < numLanes; l++) {
        int driverIdx = 0;
        if (l < customHeat.getDriverIndices().size()) {
          driverIdx = customHeat.getDriverIndices().get(l);
        }

        if (driverIdx > 0 && driverIdx <= drivers.size()) {
          RaceParticipant participant = drivers.get(driverIdx - 1);
          DriverHeatData data = new DriverHeatData(participant);

          if (participant.isTeamParticipant()
              && participant.getTeam() != null
              && participant.getTeamDrivers() != null
              && !participant.getTeamDrivers().isEmpty()) {
            // Rotate drivers based on heat number
            int teamDriverIdx = h % participant.getTeamDrivers().size();
            Driver assignedDriver = participant.getTeamDrivers().get(teamDriverIdx);
            data.setActualDriver(assignedDriver);
          }

          heatDrivers.add(data);
        } else {
          heatDrivers.add(new DriverHeatData(new RaceParticipant(Driver.EMPTY_DRIVER)));
        }
      }
      heatList.add(new Heat(h + 1, heatDrivers, customHeat.getGroup(), scoring));
    }

    return heatList;
  }

  private static List<Heat> buildHeatsForGroup(
      Race race,
      List<RaceParticipant> drivers,
      int groupNumber,
      List<CustomRotation> customRotations) {
    int numLanes = race.getTrack().getLanes().size();
    HeatRotationType rotationType = race.getRaceModel().getHeatRotationType();
    List<Heat> heatList;
    switch (rotationType) {
      case RoundRobin:
        heatList =
            getRoundRobinHeats(
                drivers,
                numLanes,
                getRoundRobinRotationSequence(numLanes),
                false,
                race.getRaceModel().getHeatScoring());
        break;
      case FriendlyRoundRobin:
        heatList =
            getRoundRobinHeats(
                drivers,
                numLanes,
                getRoundRobinRotationSequence(numLanes),
                true,
                race.getRaceModel().getHeatScoring());
        break;
      case EuropeanRoundRobin:
        heatList =
            getRoundRobinHeats(
                drivers,
                numLanes,
                getEuroRoundRobinRotationSequence(numLanes),
                false,
                race.getRaceModel().getHeatScoring());
        break;
      case SingleHeat:
        heatList = getSingleHeatHeats(drivers, numLanes, race.getRaceModel().getHeatScoring());
        break;
      case SingleHeatSolo:
        heatList =
            getSingleHeatSoloHeats(
                drivers,
                numLanes,
                race.getRaceModel().getHeatScoring(),
                race.getRaceModel().getSoloLaneIndex());
        break;
      case CustomRoundRobin:
        heatList =
            getRoundRobinHeats(
                drivers,
                numLanes,
                race.getRaceModel().getCustomRotationSequence(),
                false,
                race.getRaceModel().getHeatScoring());
        break;
      case Custom:
        heatList =
            getCustomHeats(
                drivers, numLanes, customRotations, race.getRaceModel().getHeatScoring());
        break;
      default:
        throw new IllegalArgumentException("Unknown HeatRotationType: " + rotationType);
    }

    for (Heat heat : heatList) {
      if (rotationType != HeatRotationType.Custom) {
        heat.setGroup(groupNumber);
      }
    }

    return heatList;
  }

  public static List<Integer> getGroups(
      List<RaceParticipant> drivers,
      int numLanes,
      int groupMaxGroups,
      boolean groupBalanceSeeds,
      boolean groupEmptyLanes,
      boolean groupForceMultiple) {
    List<Integer> groups = new ArrayList<>();
    int numGroups = (int) Math.ceil((double) drivers.size() / (double) numLanes);
    if (numGroups <= 0) {
      numGroups = 1;
    }

    if (numGroups > groupMaxGroups) {
      numGroups = groupMaxGroups;
    }

    if (numGroups > 1) {
      if (!groupEmptyLanes) {
        while ((int) (drivers.size() / numGroups) < numLanes) {
          numGroups--;
        }
      }
    }

    if (groupForceMultiple) {
      while (numGroups > 0 && (groupMaxGroups % numGroups) != 0) {
        numGroups--;
      }
    }

    if (numGroups <= 0) {
      numGroups = 1;
    }

    int extraDrivers = drivers.size() % numGroups;

    if (groupBalanceSeeds) {
      int groupNum = 0;
      for (int i = 0; i < drivers.size() - extraDrivers; i++) {
        groups.add(groupNum);
        groupNum++;
        if (groupNum % numGroups == 0) {
          groupNum = 0;
        }
      }
      groupNum = 0;
      for (int i = 0; i < extraDrivers; i++) {
        groups.add(groupNum);
        groupNum++;
      }
    } else {
      int numInGroup = drivers.size() / numGroups;
      int groupNum = 0;
      int count = 0;
      for (int i = 0; i < drivers.size(); i++) {
        groups.add(groupNum);
        count++;
        if (count >= numInGroup) {
          if (groupNum >= extraDrivers || count > numInGroup) {
            count = 0;
            groupNum++;
          }
        }
      }
    }
    return groups;
  }

  private static List<Heat> resortGroupHeats(List<Heat> heats) {
    List<Heat> newHeats = new ArrayList<>();
    for (Heat heat : heats) {
      int insertion = -1;
      for (int i = newHeats.size() - 1; i >= 0; i--) {
        if ((newHeats.get(i).getGroup() == heat.getGroup() + 1)
            || (newHeats.get(i).getGroup() == heat.getGroup() - 1)) {
          insertion = i;
        } else if (newHeats.get(i).getGroup() == heat.getGroup()) {
          break;
        }
      }

      if (insertion >= 0 && insertion < newHeats.size() - 1) {
        newHeats.add(insertion + 1, heat);
      } else {
        newHeats.add(heat);
      }
    }
    return newHeats;
  }
}
