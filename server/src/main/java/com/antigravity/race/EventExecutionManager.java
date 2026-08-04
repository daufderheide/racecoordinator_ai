package com.antigravity.race;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.Driver;
import com.antigravity.models.Event;
import com.antigravity.models.Event.EventRaceItem;
import com.antigravity.models.SeasonRaceRecord.SeasonDriverResult;
import com.antigravity.models.Team;
import com.antigravity.proto.DemoConfig;
import com.antigravity.service.DatabaseService;
import com.antigravity.util.SeasonPointsCalculator;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class EventExecutionManager {

  private static final Logger logger = LoggerFactory.getLogger(EventExecutionManager.class);
  private static final EventExecutionManager INSTANCE = new EventExecutionManager();

  private Event activeEvent;
  private int currentRaceIndex = -1;
  private List<String> initialParticipantIds = new ArrayList<>();
  private List<String> currentQualifiedParticipantIds = new ArrayList<>();
  private boolean isDemoMode;
  private DemoConfig demoConfig;
  private DatabaseContext databaseContext;
  private String seasonEntityId;
  private Map<String, SeasonDriverResult> eventDriverResultsMap = new HashMap<>();

  private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();
  private ScheduledFuture<?> autoAdvanceFuture;
  private double autoAdvanceRemainingSeconds = 0;

  public static EventExecutionManager getInstance() {
    return INSTANCE;
  }

  private EventExecutionManager() {}

  public synchronized boolean isEventActive() {
    return activeEvent != null
        && currentRaceIndex >= 0
        && currentRaceIndex < activeEvent.getRaces().size();
  }

  public synchronized Event getActiveEvent() {
    return activeEvent;
  }

  public synchronized int getCurrentRaceIndex() {
    return currentRaceIndex;
  }

  public synchronized double getAutoAdvanceRemainingSeconds() {
    return autoAdvanceRemainingSeconds;
  }

  public synchronized List<String> getCurrentQualifiedParticipantIds() {
    return new ArrayList<>(currentQualifiedParticipantIds);
  }

  public synchronized void startEvent(
      Event event,
      List<String> participantIds,
      boolean isDemoMode,
      DemoConfig demoConfig,
      DatabaseContext dbCtx)
      throws Exception {
    startEvent(event, participantIds, isDemoMode, demoConfig, dbCtx, null);
  }

  public synchronized void startEvent(
      Event event,
      List<String> participantIds,
      boolean isDemoMode,
      DemoConfig demoConfig,
      DatabaseContext dbCtx,
      String seasonEntityId)
      throws Exception {
    cancelAutoAdvanceTimer();
    this.activeEvent = event;
    this.currentRaceIndex = 0;
    this.initialParticipantIds = new ArrayList<>(participantIds);
    this.isDemoMode = isDemoMode;
    this.demoConfig = demoConfig;
    this.databaseContext = dbCtx;
    this.seasonEntityId = seasonEntityId;
    this.eventDriverResultsMap = new HashMap<>();
    this.autoAdvanceRemainingSeconds = 0;

    if (event.getRaces().isEmpty()) {
      throw new IllegalArgumentException("Event contains no races");
    }

    EventRaceItem race0 = event.getRaces().get(0);
    List<String> startingParticipants = new ArrayList<>(participantIds);
    if (race0.getMaxDrivers() > 0 && startingParticipants.size() > race0.getMaxDrivers()) {
      logger.warn(
          "Race 0 max drivers limit ({}) exceeded by setup drivers ({}). Restricting to top {}.",
          race0.getMaxDrivers(),
          startingParticipants.size(),
          race0.getMaxDrivers());
      startingParticipants = startingParticipants.subList(0, race0.getMaxDrivers());
    }

    this.currentQualifiedParticipantIds = new ArrayList<>(startingParticipants);
    initializeAndStartRace(race0.getRaceId(), this.currentQualifiedParticipantIds);
  }

  public synchronized void onRaceOver(Race completedRace) {
    if (!isEventActive()) {
      return;
    }

    // Determine standings order for seeding the next race
    List<String> standingsOrder = new ArrayList<>();
    List<RaceParticipant> drivers = completedRace.getDrivers();
    if (drivers != null && !drivers.isEmpty()) {
      List<RaceParticipant> sorted = new ArrayList<>(drivers);
      sorted.sort(Comparator.comparingInt(RaceParticipant::getRank));

      for (RaceParticipant rp : sorted) {
        if (rp.getDriver() != null && Driver.isEmpty(rp.getDriver())) {
          continue;
        }
        String pid = null;
        if (rp.getDriver() != null && !Driver.isEmpty(rp.getDriver())) {
          pid = "d_" + rp.getDriver().getEntityId();
        } else if (rp.getTeam() != null) {
          pid = "t_" + rp.getTeam().getEntityId();
        } else if (rp.getObjectId() != null && !rp.getObjectId().contains("EMPTY")) {
          pid = rp.getObjectId();
        }
        if (pid != null && !standingsOrder.contains(pid)) {
          standingsOrder.add(pid);
        }
      }
    }

    // Preserve any active event participants that were not in completedRace standings
    for (String pid : currentQualifiedParticipantIds) {
      if (!standingsOrder.contains(pid)) {
        standingsOrder.add(pid);
      }
    }

    int nextIndex = currentRaceIndex + 1;
    if (nextIndex < activeEvent.getRaces().size()) {
      EventRaceItem nextRaceItem = activeEvent.getRaces().get(nextIndex);
      if (nextRaceItem.getMaxDrivers() > 0
          && standingsOrder.size() > nextRaceItem.getMaxDrivers()) {
        logger.info(
            "Seeding race {}: Dropping worst seeded drivers (from {} down to {} max drivers)",
            nextIndex + 1,
            standingsOrder.size(),
            nextRaceItem.getMaxDrivers());
        this.currentQualifiedParticipantIds =
            new ArrayList<>(standingsOrder.subList(0, nextRaceItem.getMaxDrivers()));
      } else {
        this.currentQualifiedParticipantIds = new ArrayList<>(standingsOrder);
      }
    }

    // Start auto-advance timer if another race remains in the event
    if (currentRaceIndex + 1 < activeEvent.getRaces().size()) {
      double autoAdvanceSecs = activeEvent.getAutoAdvanceTime();
      if (autoAdvanceSecs > 0) {
        startAutoAdvanceTimer((long) autoAdvanceSecs);
      }
    }

    // Accumulate points if running as part of a season
    if (seasonEntityId != null && !seasonEntityId.isEmpty()) {
      List<SeasonDriverResult> raceResults =
          SeasonPointsCalculator.calculateDriverResultsForRace(completedRace);
      for (SeasonDriverResult r : raceResults) {
        String dId = r.getDriverId();
        SeasonDriverResult existing = eventDriverResultsMap.get(dId);
        if (existing != null) {
          int combinedPosPts = existing.getOverallPoints() + r.getOverallPoints();
          int combinedHeatPts = existing.getHeatPoints() + r.getHeatPoints();
          int combinedTotal = combinedPosPts + combinedHeatPts;
          int bestRank = Math.min(existing.getOverallRank(), r.getOverallRank());
          eventDriverResultsMap.put(
              dId,
              new SeasonDriverResult(
                  dId, r.getDriverName(), bestRank, combinedPosPts, combinedHeatPts, combinedTotal));
        } else {
          eventDriverResultsMap.put(dId, r);
        }
      }

      // If this is the last race in the Event, commit to season
      if (currentRaceIndex == activeEvent.getRaces().size() - 1) {
        List<SeasonDriverResult> finalEventResults =
            new ArrayList<>(eventDriverResultsMap.values());
        finalEventResults.sort(
            Comparator.comparingInt(SeasonDriverResult::getTotalPoints).reversed());
        if (databaseContext != null && databaseContext.getDatabase() != null) {
          DatabaseService.getInstance()
              .commitRaceToSeason(
                  databaseContext.getDatabase(),
                  seasonEntityId,
                  activeEvent.getName(),
                  finalEventResults);
        }
      }
    }
  }

  private synchronized void startAutoAdvanceTimer(long seconds) {
    cancelAutoAdvanceTimer();
    this.autoAdvanceRemainingSeconds = seconds;

    logger.info("Starting Event auto-advance timer for {} seconds", seconds);

    Race currentRace = ClientSubscriptionManager.getInstance().getRace();
    if (currentRace != null) {
      currentRace.broadcast(currentRace.createSnapshot());
    }

    autoAdvanceFuture =
        scheduler.scheduleAtFixedRate(
            () -> {
              synchronized (EventExecutionManager.this) {
                if (autoAdvanceRemainingSeconds > 0) {
                  autoAdvanceRemainingSeconds -= 1.0;
                  Race activeRace = ClientSubscriptionManager.getInstance().getRace();
                  if (activeRace != null) {
                    activeRace.broadcast(activeRace.createSnapshot());
                  }
                }

                if (autoAdvanceRemainingSeconds <= 0) {
                  cancelAutoAdvanceTimer();
                  try {
                    advanceToNextRace();
                  } catch (Exception e) {
                    logger.error("Error auto-advancing to next race in event", e);
                  }
                }
              }
            },
            1,
            1,
            TimeUnit.SECONDS);
  }

  public synchronized void cancelAutoAdvanceTimer() {
    if (autoAdvanceFuture != null && !autoAdvanceFuture.isDone()) {
      autoAdvanceFuture.cancel(false);
      autoAdvanceFuture = null;
    }
    autoAdvanceRemainingSeconds = 0;
  }

  public synchronized boolean advanceToNextRace() throws Exception {
    cancelAutoAdvanceTimer();

    if (activeEvent == null || currentRaceIndex + 1 >= activeEvent.getRaces().size()) {
      logger.info("No next race available to advance in event.");
      return false;
    }

    currentRaceIndex++;
    EventRaceItem nextItem = activeEvent.getRaces().get(currentRaceIndex);
    logger.info(
        "Advancing Event '{}' to race {} of {}: raceId={}",
        activeEvent.getName(),
        currentRaceIndex + 1,
        activeEvent.getRaces().size(),
        nextItem.getRaceId());

    initializeAndStartRace(nextItem.getRaceId(), currentQualifiedParticipantIds);
    return true;
  }

  public synchronized void cancelEvent() {
    cancelAutoAdvanceTimer();
    this.activeEvent = null;
    this.currentRaceIndex = -1;
    this.initialParticipantIds.clear();
    this.currentQualifiedParticipantIds.clear();
    this.autoAdvanceRemainingSeconds = 0;
    this.seasonEntityId = null;
    if (this.eventDriverResultsMap != null) {
      this.eventDriverResultsMap.clear();
    }
  }

  private void initializeAndStartRace(String raceId, List<String> participantIds) throws Exception {
    DatabaseService dbService = DatabaseService.getInstance();
    com.antigravity.models.Race raceModel = // fqn-collision
        dbService.getRace(databaseContext.getDatabase(), raceId);
    if (raceModel == null) {
      throw new IllegalStateException("Race model not found for entityId: " + raceId);
    }

    List<String> rawIds = new ArrayList<>();
    for (String pid : participantIds) {
      rawIds.add(pid.startsWith("d_") || pid.startsWith("t_") ? pid.substring(2) : pid);
    }

    List<Driver> drivers = dbService.getDrivers(databaseContext.getDatabase(), rawIds);
    List<Team> teams = dbService.getTeams(databaseContext.getDatabase(), rawIds);

    List<RaceParticipant> participants = new ArrayList<>();
    for (String pid : participantIds) {
      String rawId = pid.startsWith("d_") || pid.startsWith("t_") ? pid.substring(2) : pid;
      boolean isExplicitDriver = pid.startsWith("d_");

      if (isExplicitDriver || !pid.startsWith("t_")) {
        Driver d =
            drivers.stream()
                .filter(drv -> drv.getEntityId().equals(rawId))
                .findFirst()
                .orElse(null);
        if (d != null) {
          participants.add(new RaceParticipant(d));
          continue;
        }
      }

      if (!isExplicitDriver) {
        Team t =
            teams.stream().filter(tm -> tm.getEntityId().equals(rawId)).findFirst().orElse(null);
        if (t != null) {
          RaceParticipant rp = new RaceParticipant(t);
          List<Driver> teamDrivers =
              dbService.getDrivers(databaseContext.getDatabase(), t.getDriverIds());
          rp.setTeamDrivers(teamDrivers);
          participants.add(rp);
        }
      }
    }

    com.antigravity.models.Track raceTrack = // fqn-collision
        dbService.getTrack(databaseContext.getDatabase(), raceModel.getTrackEntityId());
    if (raceTrack == null) {
      throw new IllegalStateException("Track not found for race: " + raceModel.getName());
    }

    Race runtimeRace =
        new Race.Builder()
            .model(raceModel)
            .drivers(participants)
            .track(raceTrack)
            .databaseContext(databaseContext)
            .isDemoMode(isDemoMode)
            .demoConfig(demoConfig)
            .seasonEntityId(seasonEntityId)
            .build();

    ClientSubscriptionManager.getInstance().setRace(runtimeRace);
    runtimeRace.init();
    com.antigravity.proto.RaceData raceDataSnapshot = runtimeRace.createSnapshot(); // fqn-collision
    runtimeRace.broadcast(raceDataSnapshot);
  }
}
