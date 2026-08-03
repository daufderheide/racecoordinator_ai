package com.antigravity.race;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.Driver;
import com.antigravity.models.Event;
import com.antigravity.models.Event.EventRaceItem;
import com.antigravity.models.Team;
import com.antigravity.proto.DemoConfig;
import com.antigravity.service.DatabaseService;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
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

  public synchronized void startEvent(
      Event event,
      List<String> participantIds,
      boolean isDemoMode,
      DemoConfig demoConfig,
      DatabaseContext dbCtx)
      throws Exception {
    cancelAutoAdvanceTimer();
    this.activeEvent = event;
    this.currentRaceIndex = 0;
    this.initialParticipantIds = new ArrayList<>(participantIds);
    this.isDemoMode = isDemoMode;
    this.demoConfig = demoConfig;
    this.databaseContext = dbCtx;
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
    List<RaceParticipant> drivers = completedRace.getDrivers();
    if (drivers != null && !drivers.isEmpty()) {
      List<RaceParticipant> sorted = new ArrayList<>(drivers);
      sorted.sort(Comparator.comparingInt(RaceParticipant::getRank));

      List<String> standingsOrder = new ArrayList<>();
      for (RaceParticipant rp : sorted) {
        String pid = null;
        if (rp.getDriver() != null) {
          pid = "d_" + rp.getDriver().getEntityId();
        } else if (rp.getTeam() != null) {
          pid = "t_" + rp.getTeam().getEntityId();
        } else if (rp.getObjectId() != null) {
          pid = rp.getObjectId();
        }
        if (pid != null) {
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
    }

    // Start auto-advance timer if another race remains in the event
    if (currentRaceIndex + 1 < activeEvent.getRaces().size()) {
      double autoAdvanceSecs = activeEvent.getAutoAdvanceTime();
      if (autoAdvanceSecs > 0) {
        startAutoAdvanceTimer((long) autoAdvanceSecs);
      }
    }
  }

  private synchronized void startAutoAdvanceTimer(long seconds) {
    cancelAutoAdvanceTimer();
    this.autoAdvanceRemainingSeconds = seconds;

    logger.info("Starting Event auto-advance timer for {} seconds", seconds);

    autoAdvanceFuture =
        scheduler.scheduleAtFixedRate(
            () -> {
              synchronized (EventExecutionManager.this) {
                if (autoAdvanceRemainingSeconds > 0) {
                  autoAdvanceRemainingSeconds -= 1.0;
                  Race currentRace = ClientSubscriptionManager.getInstance().getRace();
                  if (currentRace != null) {
                    currentRace.broadcast(currentRace.createSnapshot());
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
            .build();

    ClientSubscriptionManager.getInstance().setRace(runtimeRace);
    runtimeRace.init();
    runtimeRace.startRace();
  }
}
