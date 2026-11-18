package com.antigravity.race;

import com.antigravity.models.Driver;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Practice sessions that run all evening
 * (https://github.com/daufderheide/racecoordinator_ai/issues/471).
 *
 * <ul>
 *   <li><b>Unlimited practice:</b> a practice with Heat Times Through 0 never has a last heat.
 *       Another session is added whenever the heat list runs out.
 *   <li><b>Lane practice:</b> a practice started without drivers, or an unlimited practice. Drivers
 *       sit on fixed lanes instead of following a heat rotation:
 *       <ul>
 *         <li>The drivers picked in setup (the ones present that day) are shuffled onto the lanes.
 *             Lanes left over get a "Lane N" placeholder, so the track is live and laps count.
 *         <li>With more drivers than lanes, each new session gives the lanes to the drivers with
 *             the fewest sessions so far (ties: whoever waited longest). Drivers who stay keep
 *             their lane; only the freed lanes change hands.
 *         <li>Otherwise each new session keeps whoever is on each lane.
 *         <li>A driver change during the break goes to the next session, on top of the rotation.
 *       </ul>
 * </ul>
 */
public final class PracticeSessions {

  /** Entity id prefix of the "Lane N" placeholder drivers. */
  public static final String LANE_PLACEHOLDER_ID_PREFIX = "practice_lane_";

  private static final Logger logger = LoggerFactory.getLogger(PracticeSessions.class);

  private static Random random = new Random();

  private PracticeSessions() {}

  /** Lets tests make the start-of-practice shuffle predictable. */
  static void setRandomForTesting(Random r) {
    random = r != null ? r : new Random();
  }

  public static boolean isUnlimited(com.antigravity.models.Race model) { // fqn-collision
    return model != null && model.isPractice() && model.getHeatTimesThrough() <= 0;
  }

  /** True for a "Lane N" placeholder driver. */
  public static boolean isLanePlaceholder(Driver driver) {
    return driver != null
        && driver.getEntityId() != null
        && driver.getEntityId().startsWith(LANE_PLACEHOLDER_ID_PREFIX);
  }

  /** A real driver: not a placeholder, an empty lane or a team. */
  private static boolean isRealDriver(RaceParticipant p) {
    if (p == null || p.isTeamParticipant()) {
      return false;
    }
    Driver d = p.getDriver();
    return d != null
        && d.getEntityId() != null
        && !Driver.EMPTY_DRIVER_ID.equals(d.getEntityId())
        && !isLanePlaceholder(d);
  }

  private static boolean hasTeam(List<RaceParticipant> participants) {
    for (RaceParticipant p : participants) {
      if (p != null && p.isTeamParticipant()) {
        return true;
      }
    }
    return false;
  }

  private static boolean allPlaceholders(List<RaceParticipant> participants) {
    if (participants.isEmpty()) {
      return false;
    }
    for (RaceParticipant p : participants) {
      if (p == null || !isLanePlaceholder(p.getDriver())) {
        return false;
      }
    }
    return true;
  }

  /** Fixed-lane practice: started without drivers, or unlimited (and not a team practice). */
  public static boolean isLanePractice(
      com.antigravity.models.Race model, List<RaceParticipant> participants) { // fqn-collision
    if (model == null || !model.isPractice() || participants.isEmpty()) {
      return false;
    }
    return allPlaceholders(participants) || (isUnlimited(model) && !hasTeam(participants));
  }

  private static RaceParticipant lanePlaceholder(int laneIndex) {
    String name = "Lane " + (laneIndex + 1);
    return new RaceParticipant(
        new Driver(name, name, LANE_PLACEHOLDER_ID_PREFIX + (laneIndex + 1), null));
  }

  /**
   * Sets up the participants of a lane practice before the heats are built:
   *
   * <ul>
   *   <li>No drivers picked: one "Lane N" placeholder per lane.
   *   <li>Unlimited practice with drivers: the drivers are shuffled, and lanes left over get a
   *       placeholder.
   * </ul>
   *
   * Leaves any other race alone.
   */
  public static void prepareParticipants(
      com.antigravity.models.Race model, // fqn-collision
      List<RaceParticipant> participants,
      int numLanes) {
    if (model == null || !model.isPractice() || hasTeam(participants)) {
      return;
    }
    List<RaceParticipant> real = new ArrayList<>();
    for (RaceParticipant p : participants) {
      if (isRealDriver(p)) {
        real.add(p);
      }
    }
    if (!real.isEmpty() && !isUnlimited(model)) {
      return; // a practice with picked drivers and a fixed length keeps the normal rotation
    }
    Collections.shuffle(real, random);
    participants.clear();
    participants.addAll(real);
    for (int lane = real.size(); lane < numLanes; lane++) {
      participants.add(lanePlaceholder(lane));
    }
  }

  /** Adds a driver to the practice's participants (the rotation pool) unless already in it. */
  static void addToPool(List<RaceParticipant> participants, RaceParticipant participant) {
    if (!isRealDriver(participant)) {
      return;
    }
    String id = participant.getDriver().getEntityId();
    for (RaceParticipant p : participants) {
      if (p != null && p.getDriver() != null && id.equals(p.getDriver().getEntityId())) {
        return;
      }
    }
    participants.add(participant);
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

  /**
   * The heats of a lane practice: one heat per pass, participant N on lane N. Participants beyond
   * the number of lanes wait for a later session.
   */
  public static List<Heat> buildLaneHeats(
      com.antigravity.models.Race model, // fqn-collision
      List<RaceParticipant> participants,
      int numLanes) {
    int passes = Math.max(1, model.getHeatTimesThrough());
    List<Heat> result = new ArrayList<>();
    for (int n = 1; n <= passes; n++) {
      List<DriverHeatData> lanes = new ArrayList<>();
      for (int i = 0; i < numLanes; i++) {
        RaceParticipant p =
            i < participants.size()
                ? participants.get(i)
                : new RaceParticipant(Driver.EMPTY_DRIVER);
        DriverHeatData dhd = new DriverHeatData(p);
        dhd.setLane(i);
        lanes.add(dhd);
      }
      result.add(laneHeat(model, n, lanes));
    }
    return result;
  }

  private static String driverId(DriverHeatData dhd) {
    Driver d = dhd.getActualDriver();
    return d != null ? d.getEntityId() : null;
  }

  private static boolean isRealDriver(DriverHeatData dhd) {
    Driver d = dhd.getActualDriver();
    return d != null
        && d.getEntityId() != null
        && !Driver.EMPTY_DRIVER_ID.equals(d.getEntityId())
        && !isLanePlaceholder(d);
  }

  /**
   * The next lane-practice session after {@code from}. With more drivers than lanes the drivers
   * with the fewest sessions get the lanes; otherwise everyone keeps their lane.
   */
  static Heat nextLaneHeat(Race race, Heat from, int heatNumber) {
    List<DriverHeatData> fromLanes = from.getDrivers();
    int laneCount = fromLanes.size();

    // Who could drive: the drivers picked in setup, plus anyone put on a lane since.
    Map<String, RaceParticipant> candidates = new LinkedHashMap<>();
    for (RaceParticipant p : race.getDrivers()) {
      if (isRealDriver(p)) {
        candidates.putIfAbsent(p.getDriver().getEntityId(), p);
      }
    }
    for (DriverHeatData dhd : fromLanes) {
      if (isRealDriver(dhd)) {
        RaceParticipant p = dhd.getDriver();
        if (p == null || !isRealDriver(p)) {
          p = new RaceParticipant(dhd.getActualDriver());
        }
        candidates.putIfAbsent(driverId(dhd), p);
      }
    }
    if (candidates.size() <= laneCount) {
      return copyLaneHeat(race.getRaceModel(), from, heatNumber);
    }

    // Sessions driven so far, and the last session each driver was on a lane.
    Map<String, Integer> sessions = new HashMap<>();
    Map<String, Integer> lastSession = new HashMap<>();
    List<Heat> heats = race.getHeats();
    for (int h = 0; h < heats.size(); h++) {
      for (DriverHeatData dhd : heats.get(h).getDrivers()) {
        if (isRealDriver(dhd)) {
          sessions.merge(driverId(dhd), 1, Integer::sum);
          lastSession.put(driverId(dhd), h);
        }
      }
    }
    List<String> order = new ArrayList<>(candidates.keySet());
    List<String> ranked = new ArrayList<>(order);
    ranked.sort(
        Comparator.<String>comparingInt(id -> sessions.getOrDefault(id, 0))
            .thenComparingInt(id -> lastSession.getOrDefault(id, -1))
            .thenComparingInt(order::indexOf));
    Set<String> next = new HashSet<>(ranked.subList(0, laneCount));

    // Drivers who stay keep their lane; the freed lanes go to the incoming drivers.
    String[] laneDriver = new String[laneCount];
    Set<String> placed = new HashSet<>();
    for (int i = 0; i < laneCount; i++) {
      String id = driverId(fromLanes.get(i));
      if (id != null && next.contains(id) && placed.add(id)) {
        laneDriver[i] = id;
      }
    }
    List<String> incoming = new ArrayList<>();
    for (String id : ranked) {
      if (next.contains(id) && !placed.contains(id)) {
        incoming.add(id);
      }
    }
    int in = 0;
    for (int i = 0; i < laneCount; i++) {
      if (laneDriver[i] == null && in < incoming.size()) {
        laneDriver[i] = incoming.get(in++);
      }
    }

    List<DriverHeatData> lanes = new ArrayList<>();
    for (int i = 0; i < laneCount; i++) {
      RaceParticipant p = candidates.get(laneDriver[i]);
      DriverHeatData dhd = new DriverHeatData(p, p.getDriver());
      dhd.setLane(fromLanes.get(i).getLane());
      lanes.add(dhd);
    }
    return laneHeat(race.getRaceModel(), heatNumber, lanes);
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
   * One more session for an unlimited practice, numbered on from the existing heats. A lane
   * practice works out the next line-up; otherwise the rotation is built again like the first pass.
   */
  static List<Heat> nextPass(Race race) {
    List<Heat> heats = race.getHeats();
    int offset = heats.size();
    List<Heat> pass;
    if (race.isLanePractice() && !heats.isEmpty()) {
      pass =
          new ArrayList<>(
              Collections.singletonList(nextLaneHeat(race, heats.get(offset - 1), offset + 1)));
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
