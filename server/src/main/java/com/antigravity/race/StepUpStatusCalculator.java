package com.antigravity.race;

import com.antigravity.models.HeatScoring;
import com.antigravity.models.OverallScoring;
import com.antigravity.race.states.HeatOver;
import com.antigravity.race.states.IRaceState;
import com.antigravity.race.states.NotStarted;
import com.antigravity.race.states.Paused;
import com.antigravity.race.states.RaceOver;
import com.antigravity.race.states.Racing;
import com.antigravity.race.states.Starting;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Calculates step-up status for race participants: - "Active": driver is racing in the current step
 * (and the last heat in the step is not complete), or the race is over and the driver finished in
 * the final step. - "Stepping up": driver is in the current step, the last heat in the step is
 * over, and the driver advances. - "Eliminated": driver is in the current step, the last heat in
 * the step is over, and driver did not advance; or the driver is in an earlier step that completed
 * without them advancing. - "Pending": driver is racing in a step that has not started. - "": not a
 * step-up race, or driver hasn't started/seeded yet, or empty/step-up placeholder.
 */
public final class StepUpStatusCalculator {

  public static final String STATUS_ACTIVE = "Active";
  public static final String STATUS_STEPPING_UP = "Stepping up";
  public static final String STATUS_ELIMINATED = "Eliminated";
  public static final String STATUS_PENDING = "Pending";

  private StepUpStatusCalculator() {
    // Utility class
  }

  public static void calculateStepUpStatuses(Race race) {
    if (race == null) {
      return;
    }
    int stepUp = race.getRaceModel() != null ? race.getRaceModel().getStepUp() : 0;
    HeatScoring heatScoring =
        race.getRaceModel() != null ? race.getRaceModel().getHeatScoring() : null;
    OverallScoring overallScoring =
        race.getRaceModel() != null ? race.getRaceModel().getOverallScoring() : null;
    calculateStepUpStatuses(
        race.getDrivers(),
        race.getHeats(),
        race.getCurrentHeat(),
        race.getState(),
        stepUp,
        heatScoring,
        overallScoring);
  }

  public static void calculateStepUpStatuses(
      List<RaceParticipant> drivers,
      List<Heat> heats,
      Heat currentHeat,
      IRaceState raceState,
      int stepUp,
      HeatScoring heatScoring,
      OverallScoring overallScoring) {

    if (drivers == null) {
      return;
    }

    if (!isStepUpRace(stepUp, heats)) {
      clearStatuses(drivers);
      return;
    }

    Map<Integer, List<Heat>> heatsByGroup = new HashMap<>();
    Map<String, Integer> driverToGroup = new HashMap<>();
    Map<String, Integer> driverMaxStep = new HashMap<>();
    Map<Integer, Integer> maxStepByGroup = new HashMap<>();
    Map<Integer, Integer> heatNumberToStep = new HashMap<>();

    indexHeats(heats, heatsByGroup, driverToGroup, driverMaxStep, maxStepByGroup, heatNumberToStep);

    boolean isRaceOver =
        (raceState instanceof RaceOver)
            || (heats != null
                && !heats.isEmpty()
                && heats.stream().allMatch(StepUpStatusCalculator::isHeatFinished));

    Map<String, String> statusByStableId =
        computeStatuses(
            drivers,
            heatsByGroup,
            driverToGroup,
            driverMaxStep,
            maxStepByGroup,
            heatNumberToStep,
            currentHeat,
            raceState,
            isRaceOver,
            stepUp,
            heatScoring,
            overallScoring);

    applyStatusesToDrivers(drivers, statusByStableId);
    applyStatusesToHeatDrivers(heats, statusByStableId);
  }

  public static boolean isHeatFinished(Heat heat) {
    if (heat == null || heat.getDrivers() == null || heat.getDrivers().isEmpty()) {
      return false;
    }
    boolean hasActive = false;
    for (DriverHeatData dhd : heat.getDrivers()) {
      if (dhd != null
          && dhd.getDriver() != null
          && !dhd.getDriver().isEmptyParticipant()
          && !dhd.getDriver().isStepUpParticipant()) {
        hasActive = true;
        if (!dhd.isFinished()) {
          return false;
        }
      }
    }
    return hasActive;
  }

  private static boolean isStepUpRace(int stepUp, List<Heat> heats) {
    if (stepUp > 0) {
      return true;
    }
    if (heats != null) {
      for (Heat h : heats) {
        if (h.getStep() > 1 || h.isStepUpBoundary()) {
          return true;
        }
      }
    }
    return false;
  }

  private static void clearStatuses(List<RaceParticipant> drivers) {
    for (RaceParticipant p : drivers) {
      if (p != null) {
        p.setStepUpStatus("");
      }
    }
  }

  private static void indexHeats(
      List<Heat> heats,
      Map<Integer, List<Heat>> heatsByGroup,
      Map<String, Integer> driverToGroup,
      Map<String, Integer> driverMaxStep,
      Map<Integer, Integer> maxStepByGroup,
      Map<Integer, Integer> heatNumberToStep) {

    if (heats == null) {
      return;
    }
    List<Heat> heatsCopy;
    synchronized (heats) {
      heatsCopy = new ArrayList<>(heats);
    }
    Map<Integer, Integer> groupCurrentStep = new HashMap<>();
    for (Heat h : heatsCopy) {
      int group = h.getGroup();
      int step = h.getStep();
      if (step <= 0) {
        step = groupCurrentStep.getOrDefault(group, 1);
      }
      if (h.isStepUpBoundary()) {
        groupCurrentStep.put(group, Math.max(groupCurrentStep.getOrDefault(group, 1), step + 1));
      } else {
        groupCurrentStep.put(group, Math.max(groupCurrentStep.getOrDefault(group, 1), step));
      }
      heatNumberToStep.put(h.getHeatNumber(), step);
      heatsByGroup.computeIfAbsent(group, k -> new ArrayList<>()).add(h);
      if (step > maxStepByGroup.getOrDefault(group, 1)) {
        maxStepByGroup.put(group, step);
      }
      if (h.getDrivers() != null) {
        List<DriverHeatData> dhdCopy;
        synchronized (h.getDrivers()) {
          dhdCopy = new ArrayList<>(h.getDrivers());
        }
        for (DriverHeatData dhd : dhdCopy) {
          if (dhd != null
              && dhd.getDriver() != null
              && !dhd.getDriver().isEmptyParticipant()
              && !dhd.getDriver().isStepUpParticipant()) {
            String stableId = dhd.getDriver().getStableId();
            driverToGroup.put(stableId, group);
            if (step > driverMaxStep.getOrDefault(stableId, 0)) {
              driverMaxStep.put(stableId, step);
            }
          }
        }
      }
    }
  }

  private static Map<String, String> computeStatuses(
      List<RaceParticipant> drivers,
      Map<Integer, List<Heat>> heatsByGroup,
      Map<String, Integer> driverToGroup,
      Map<String, Integer> driverMaxStep,
      Map<Integer, Integer> maxStepByGroup,
      Map<Integer, Integer> heatNumberToStep,
      Heat currentHeat,
      IRaceState raceState,
      boolean isRaceOver,
      int stepUp,
      HeatScoring heatScoring,
      OverallScoring overallScoring) {

    Map<String, String> statusByStableId = new HashMap<>();
    Set<Integer> groups = new HashSet<>(heatsByGroup.keySet());
    if (groups.isEmpty()) {
      groups.add(0);
    }

    for (int group : groups) {
      List<Heat> groupHeats = heatsByGroup.getOrDefault(group, Collections.emptyList());
      groupHeats.sort(Comparator.comparingInt(Heat::getHeatNumber));
      int groupMaxStep = maxStepByGroup.getOrDefault(group, 1);

      if (isRaceOver) {
        processRaceOver(
            drivers, driverToGroup, driverMaxStep, group, groupMaxStep, statusByStableId);
      } else {
        processActiveRace(
            drivers,
            groupHeats,
            driverToGroup,
            driverMaxStep,
            group,
            groupMaxStep,
            heatNumberToStep,
            currentHeat,
            raceState,
            stepUp,
            heatScoring,
            overallScoring,
            statusByStableId);
      }
    }
    return statusByStableId;
  }

  private static void processRaceOver(
      List<RaceParticipant> drivers,
      Map<String, Integer> driverToGroup,
      Map<String, Integer> driverMaxStep,
      int group,
      int groupMaxStep,
      Map<String, String> statusByStableId) {

    for (RaceParticipant p : drivers) {
      if (p == null || p.isEmptyParticipant() || p.isStepUpParticipant()) {
        continue;
      }
      String stableId = p.getStableId();
      if (driverToGroup.getOrDefault(stableId, group) != group) {
        continue;
      }
      int myStep = driverMaxStep.getOrDefault(stableId, 0);
      if (myStep == 0) {
        statusByStableId.put(stableId, "");
      } else if (myStep == groupMaxStep) {
        statusByStableId.put(stableId, STATUS_ACTIVE);
      } else {
        statusByStableId.put(stableId, STATUS_ELIMINATED);
      }
    }
  }

  private static void processActiveRace(
      List<RaceParticipant> drivers,
      List<Heat> groupHeats,
      Map<String, Integer> driverToGroup,
      Map<String, Integer> driverMaxStep,
      int group,
      int groupMaxStep,
      Map<Integer, Integer> heatNumberToStep,
      Heat currentHeat,
      IRaceState raceState,
      int stepUp,
      HeatScoring heatScoring,
      OverallScoring overallScoring,
      Map<String, String> statusByStableId) {

    int currentStep =
        determineCurrentStep(groupHeats, group, groupMaxStep, currentHeat, heatNumberToStep);
    Heat lastHeatInStep = findLastHeatInStep(groupHeats, currentStep, heatNumberToStep);
    boolean lastHeatOver =
        isLastHeatOver(lastHeatInStep, currentHeat, group, currentStep, raceState);

    Set<String> advancingIds = Collections.emptySet();
    if (lastHeatOver && currentStep < groupMaxStep) {
      advancingIds =
          computeAdvancingIds(
              groupHeats, currentStep, stepUp, heatScoring, overallScoring, heatNumberToStep);
    }

    assignActiveStatuses(
        drivers,
        driverToGroup,
        driverMaxStep,
        group,
        currentStep,
        groupMaxStep,
        lastHeatOver,
        advancingIds,
        statusByStableId);
  }

  public static boolean isHeatStarted(Heat heat, Heat currentHeat, IRaceState raceState) {
    if (heat == null) {
      return false;
    }
    if (heat.isStarted() || isHeatFinished(heat)) {
      return true;
    }
    if (heat.getDrivers() != null) {
      for (DriverHeatData dhd : heat.getDrivers()) {
        if (dhd != null
            && (dhd.isFinished() || (dhd.getLaps() != null && !dhd.getLaps().isEmpty()))) {
          return true;
        }
      }
    }
    if (currentHeat != null && currentHeat.getHeatNumber() == heat.getHeatNumber()) {
      if (raceState != null && !(raceState instanceof NotStarted)) {
        return true;
      }
    }
    if (currentHeat != null
        && currentHeat.getGroup() == heat.getGroup()
        && currentHeat.getHeatNumber() > heat.getHeatNumber()) {
      return true;
    }
    return false;
  }

  private static int determineCurrentStep(
      List<Heat> groupHeats,
      int group,
      int groupMaxStep,
      Heat currentHeat,
      Map<Integer, Integer> heatNumberToStep) {
    if (currentHeat != null && currentHeat.getGroup() == group) {
      return heatNumberToStep.getOrDefault(
          currentHeat.getHeatNumber(), currentHeat.getStep() > 0 ? currentHeat.getStep() : 1);
    }
    for (Heat h : groupHeats) {
      if (!isHeatFinished(h)) {
        return heatNumberToStep.getOrDefault(h.getHeatNumber(), h.getStep() > 0 ? h.getStep() : 1);
      }
    }
    return !groupHeats.isEmpty() ? groupMaxStep : 1;
  }

  private static Heat findLastHeatInStep(
      List<Heat> groupHeats, int currentStep, Map<Integer, Integer> heatNumberToStep) {
    Heat last = null;
    for (Heat h : groupHeats) {
      int s = heatNumberToStep.getOrDefault(h.getHeatNumber(), h.getStep() > 0 ? h.getStep() : 1);
      if (s == currentStep && (last == null || h.getHeatNumber() > last.getHeatNumber())) {
        last = h;
      }
    }
    return last;
  }

  private static boolean isLastHeatOver(
      Heat lastHeat, Heat currentHeat, int group, int currentStep, IRaceState raceState) {
    if (lastHeat == null) {
      return false;
    }
    if (currentHeat != null && currentHeat.getGroup() == group) {
      if (currentHeat.getHeatNumber() > lastHeat.getHeatNumber()
          || currentHeat.getStep() > currentStep) {
        return true;
      }
      if (currentHeat.getHeatNumber() == lastHeat.getHeatNumber()) {
        if (raceState instanceof NotStarted
            || raceState instanceof Starting
            || raceState instanceof Racing
            || raceState instanceof Paused) {
          return false;
        }
        return (raceState instanceof HeatOver) || isHeatFinished(lastHeat);
      }
    }
    return isHeatFinished(lastHeat);
  }

  private static Set<String> computeAdvancingIds(
      List<Heat> groupHeats,
      int currentStep,
      int stepUp,
      HeatScoring heatScoring,
      OverallScoring overallScoring,
      Map<Integer, Integer> heatNumberToStep) {

    List<RaceParticipant> stepParticipants = new ArrayList<>();
    Set<String> seenIds = new HashSet<>();
    for (Heat h : groupHeats) {
      int s = heatNumberToStep.getOrDefault(h.getHeatNumber(), h.getStep() > 0 ? h.getStep() : 1);
      if (s == currentStep && h.getDrivers() != null) {
        for (DriverHeatData dhd : h.getDrivers()) {
          if (dhd.getDriver() != null
              && !dhd.getDriver().isEmptyParticipant()
              && !dhd.getDriver().isStepUpParticipant()) {
            if (seenIds.add(dhd.getDriver().getStableId())) {
              stepParticipants.add(dhd.getDriver());
            }
          }
        }
      }
    }

    int maxNextStepUpIndex = 0;
    for (Heat h : groupHeats) {
      int s = heatNumberToStep.getOrDefault(h.getHeatNumber(), h.getStep() > 0 ? h.getStep() : 1);
      if (s == currentStep + 1 && h.getDrivers() != null) {
        for (DriverHeatData dhd : h.getDrivers()) {
          if (dhd.isStepUpLane()
              || (dhd.getDriver() != null && dhd.getDriver().isStepUpParticipant())) {
            int sIdx = dhd.getStepUpLaneIndex();
            if (sIdx <= 0 && dhd.getDriver() != null) {
              sIdx = dhd.getDriver().getStepUpIndex();
            }
            if (sIdx > maxNextStepUpIndex) {
              maxNextStepUpIndex = sIdx;
            }
          }
        }
      }
    }

    int effectiveStepUp = maxNextStepUpIndex > 0 ? maxNextStepUpIndex : stepUp;
    int advanceCount = Math.min(effectiveStepUp, stepParticipants.size());

    Comparator<RaceParticipant> comparator =
        new StandingsComparator(
            HeatStandings.resolveOverallRankingMethod(heatScoring, overallScoring),
            HeatStandings.resolveOverallTiebreakerMethod(overallScoring));
    stepParticipants.sort(comparator);

    Set<String> advancingIds = new HashSet<>();
    for (int i = 0; i < advanceCount; i++) {
      advancingIds.add(stepParticipants.get(i).getStableId());
    }
    return advancingIds;
  }

  private static void assignActiveStatuses(
      List<RaceParticipant> drivers,
      Map<String, Integer> driverToGroup,
      Map<String, Integer> driverMaxStep,
      int group,
      int currentStep,
      int groupMaxStep,
      boolean lastHeatOver,
      Set<String> advancingIds,
      Map<String, String> statusByStableId) {

    for (RaceParticipant p : drivers) {
      if (p == null || p.isEmptyParticipant() || p.isStepUpParticipant()) {
        continue;
      }
      String stableId = p.getStableId();
      if (driverToGroup.getOrDefault(stableId, group) != group) {
        continue;
      }
      int myStep = driverMaxStep.getOrDefault(stableId, 0);
      if (myStep == 0) {
        statusByStableId.put(stableId, "");
      } else if (lastHeatOver && advancingIds.contains(stableId)) {
        statusByStableId.put(stableId, STATUS_STEPPING_UP);
      } else if (myStep == currentStep) {
        if (!lastHeatOver) {
          statusByStableId.put(stableId, STATUS_ACTIVE);
        } else if (currentStep == groupMaxStep) {
          statusByStableId.put(stableId, STATUS_ACTIVE);
        } else {
          statusByStableId.put(stableId, STATUS_ELIMINATED);
        }
      } else if (myStep < currentStep) {
        statusByStableId.put(stableId, STATUS_ELIMINATED);
      } else {
        // myStep > currentStep
        statusByStableId.put(stableId, STATUS_PENDING);
      }
    }
  }

  private static void applyStatusesToDrivers(
      List<RaceParticipant> drivers, Map<String, String> statusByStableId) {
    for (RaceParticipant p : drivers) {
      if (p != null) {
        if (p.isEmptyParticipant() || p.isStepUpParticipant()) {
          p.setStepUpStatus("");
        } else {
          p.setStepUpStatus(statusByStableId.getOrDefault(p.getStableId(), ""));
        }
      }
    }
  }

  private static void applyStatusesToHeatDrivers(
      List<Heat> heats, Map<String, String> statusByStableId) {
    if (heats == null) {
      return;
    }
    for (Heat h : heats) {
      if (h.getDrivers() != null) {
        for (DriverHeatData dhd : h.getDrivers()) {
          if (dhd != null && dhd.getDriver() != null) {
            if (dhd.getDriver().isEmptyParticipant() || dhd.getDriver().isStepUpParticipant()) {
              dhd.getDriver().setStepUpStatus("");
            } else {
              dhd.getDriver()
                  .setStepUpStatus(
                      statusByStableId.getOrDefault(dhd.getDriver().getStableId(), ""));
            }
          }
        }
      }
    }
  }
}
