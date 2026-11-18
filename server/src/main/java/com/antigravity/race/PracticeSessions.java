package com.antigravity.race;

import com.antigravity.models.Driver;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Practice sessions that run all evening
 * (https://github.com/daufderheide/racecoordinator_ai/issues/471).
 *
 * <ul>
 *   <li><b>Unlimited practice:</b> a practice with Heat Times Through 0 never has a last heat.
 *       Another pass is added whenever the heat list runs out.
 *   <li><b>Lane practice:</b> a practice started without drivers. Every lane gets a "Lane N"
 *       placeholder that stays on its own lane, so the track is live and laps count. Each new heat
 *       keeps whoever is on each lane, so drivers assigned on the fly (also during the break) stay.
 * </ul>
 */
public final class PracticeSessions {

  /** Entity id prefix of the "Lane N" placeholder drivers. */
  public static final String LANE_PLACEHOLDER_ID_PREFIX = "practice_lane_";

  private static final Logger logger = LoggerFactory.getLogger(PracticeSessions.class);

  private PracticeSessions() {}

  public static boolean isUnlimited(com.antigravity.models.Race model) { // fqn-collision
    return model != null && model.isPractice() && model.getHeatTimesThrough() <= 0;
  }

  /** True for a "Lane N" placeholder driver. */
  public static boolean isLanePlaceholder(Driver driver) {
    return driver != null
        && driver.getEntityId() != null
        && driver.getEntityId().startsWith(LANE_PLACEHOLDER_ID_PREFIX);
  }

  /** A practice whose participants are all "Lane N" placeholders. */
  public static boolean isLanePractice(
      com.antigravity.models.Race model, List<RaceParticipant> participants) { // fqn-collision
    if (model == null || !model.isPractice() || participants.isEmpty()) {
      return false;
    }
    for (RaceParticipant p : participants) {
      if (p == null || !isLanePlaceholder(p.getDriver())) {
        return false;
      }
    }
    return true;
  }

  /**
   * For a practice started without drivers, replaces the participant list with one "Lane N"
   * placeholder per lane. Leaves the list alone otherwise.
   */
  public static void fillLanePlaceholders(
      com.antigravity.models.Race model, // fqn-collision
      List<RaceParticipant> participants,
      int numLanes) {
    if (model == null || !model.isPractice() || hasRealParticipant(participants)) {
      return;
    }
    participants.clear();
    for (int i = 0; i < numLanes; i++) {
      String name = "Lane " + (i + 1);
      participants.add(
          new RaceParticipant(new Driver(name, name, LANE_PLACEHOLDER_ID_PREFIX + (i + 1), null)));
    }
  }

  private static boolean hasRealParticipant(List<RaceParticipant> participants) {
    for (RaceParticipant p : participants) {
      if (p == null) {
        continue;
      }
      if (p.isTeamParticipant()) {
        return true;
      }
      Driver d = p.getDriver();
      if (d != null && d.getEntityId() != null && !Driver.EMPTY_DRIVER_ID.equals(d.getEntityId())) {
        return true;
      }
    }
    return false;
  }

  /** The placeholder participant with this driver id, or null. */
  public static RaceParticipant findLanePlaceholder(
      List<RaceParticipant> participants, String entityId) {
    if (entityId == null || !entityId.startsWith(LANE_PLACEHOLDER_ID_PREFIX)) {
      return null;
    }
    for (RaceParticipant p : participants) {
      if (p != null && p.getDriver() != null && entityId.equals(p.getDriver().getEntityId())) {
        return p;
      }
    }
    return null;
  }

  /** The heats of a lane practice: one heat per pass, every placeholder on its own lane. */
  public static List<Heat> buildLaneHeats(
      com.antigravity.models.Race model, List<RaceParticipant> participants) { // fqn-collision
    int passes = Math.max(1, model.getHeatTimesThrough());
    List<Heat> result = new ArrayList<>();
    for (int n = 1; n <= passes; n++) {
      List<DriverHeatData> lanes = new ArrayList<>();
      for (int i = 0; i < participants.size(); i++) {
        DriverHeatData dhd = new DriverHeatData(participants.get(i));
        dhd.setLane(i);
        lanes.add(dhd);
      }
      result.add(laneHeat(model, n, lanes));
    }
    return result;
  }

  /** The next lane-practice heat: the same drivers on the same lanes as the given heat. */
  static Heat copyLaneHeat(
      com.antigravity.models.Race model, Heat from, int heatNumber) { // fqn-collision
    List<DriverHeatData> lanes = new ArrayList<>();
    for (DriverHeatData old : from.getDrivers()) {
      DriverHeatData dhd = new DriverHeatData(old.getDriver(), old.getActualDriver());
      dhd.setLane(old.getLane());
      lanes.add(dhd);
    }
    return laneHeat(model, heatNumber, lanes);
  }

  private static Heat laneHeat(
      com.antigravity.models.Race model, // fqn-collision
      int heatNumber,
      List<DriverHeatData> lanes) {
    return new Heat(heatNumber, lanes, 0, model.getHeatScoring(), model.getOverallScoring(), true);
  }

  /**
   * One more pass for an unlimited practice, numbered on from the existing heats. A lane practice
   * repeats its last heat; otherwise the rotation is built again like the first pass.
   */
  static List<Heat> nextPass(Race race) {
    List<Heat> heats = race.getHeats();
    int offset = heats.size();
    List<Heat> pass;
    if (race.isLanePractice() && !heats.isEmpty()) {
      pass =
          new ArrayList<>(
              Collections.singletonList(
                  copyLaneHeat(race.getRaceModel(), heats.get(offset - 1), offset + 1)));
    } else {
      pass = HeatBuilder.buildHeats(race, race.getDrivers(), race.getCustomRotations());
      for (int i = 0; i < pass.size(); i++) {
        pass.get(i).setHeatNumber(offset + i + 1);
      }
    }
    logger.info("Unlimited practice: added heats {}-{}", offset + 1, offset + pass.size());
    return pass;
  }
}
