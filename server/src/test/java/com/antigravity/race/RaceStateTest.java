package com.antigravity.race;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.timeout;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.Driver;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.Lane;
import com.antigravity.models.OverallScoring;
import com.antigravity.models.Race;
import com.antigravity.models.Track;
import com.antigravity.proto.RaceData;
import com.antigravity.proto.RaceState;
import com.antigravity.proto.RaceSubscriptionRequest;
import com.antigravity.protocols.arduino.ArduinoConfig;
import com.antigravity.race.states.HeatOver;
import com.antigravity.race.states.NotStarted;
import com.antigravity.race.states.Paused;
import com.antigravity.race.states.RaceOver;
import com.antigravity.race.states.Racing;
import com.antigravity.race.states.Starting;
import com.antigravity.service.ServerConfigService;
import io.javalin.websocket.WsContext;
import java.lang.reflect.Field;
import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import org.bson.types.ObjectId;
import org.eclipse.jetty.websocket.api.RemoteEndpoint;
import org.eclipse.jetty.websocket.api.Session;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.ArgumentCaptor;

public class RaceStateTest {

  private com.antigravity.race.Race race;
  private WsContext currentMockWsContext;

  @Before
  public void setUp() throws Exception {
    ServerConfigService configService = mock(ServerConfigService.class);
    when(configService.getStartRandomizer()).thenReturn(0.0);
    when(configService.getRestartRandomizer()).thenReturn(0.0);

    DatabaseContext dbContext = mock(DatabaseContext.class);
    when(dbContext.getConfigService()).thenReturn(configService);

    ClientSubscriptionManager.getInstance().setDatabaseContext(dbContext);

    List<ArduinoConfig> mockConfig = Collections.singletonList(mock(ArduinoConfig.class));

    List<Lane> lanes = new ArrayList<>();
    lanes.add(new Lane("red", "black", 100));

    Track realTrack =
        new Track.Builder()
            .name("Test Track")
            .lanes(lanes)
            .arduinoConfigs(mockConfig)
            .entityId("track1")
            .id(new ObjectId())
            .build();

    HeatScoring mockHeatScoring = mock(HeatScoring.class);
    when(mockHeatScoring.getHeatRanking()).thenReturn(HeatScoring.HeatRanking.LAP_COUNT);
    when(mockHeatScoring.getHeatRankingTiebreaker())
        .thenReturn(HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME);
    when(mockHeatScoring.getFinishMethod()).thenReturn(HeatScoring.FinishMethod.Timed);
    when(mockHeatScoring.getFinishValue()).thenReturn(100L); // 100 seconds

    OverallScoring mockOverallScoring = mock(OverallScoring.class);
    when(mockOverallScoring.getRankingMethod()).thenReturn(OverallScoring.OverallRanking.LAP_COUNT);
    when(mockOverallScoring.getTiebreaker())
        .thenReturn(OverallScoring.OverallRankingTiebreaker.FASTEST_LAP_TIME);

    Race realRaceModel =
        new Race.Builder()
            .withName("Test Race")
            .withTrackEntityId("track1")
            .withHeatRotationType(HeatRotationType.RoundRobin)
            .withHeatScoring(mockHeatScoring)
            .withOverallScoring(mockOverallScoring)
            .withEntityId("race1")
            .withId(new ObjectId())
            .build();

    List<RaceParticipant> drivers = new ArrayList<>();
    Driver realDriver = new Driver("Test Driver", "D1", "driver1", new ObjectId());
    RaceParticipant participant = new RaceParticipant(realDriver, "participant1");
    drivers.add(participant);

    race =
        new com.antigravity.race.Race.Builder()
            .model(realRaceModel)
            .drivers(drivers)
            .track(realTrack)
            .isDemoMode(true)
            .build();
    ClientSubscriptionManager.getInstance().setRace(race);
  }

  @After
  public void tearDown() {
    if (currentMockWsContext != null) {
      ClientSubscriptionManager.getInstance().removeSession(currentMockWsContext);
    }
    ClientSubscriptionManager.getInstance().setRace(null);
  }

  private void refreshSession() throws Exception {
    if (currentMockWsContext != null) {
      ClientSubscriptionManager.getInstance().removeSession(currentMockWsContext);
    }

    Session mockSession = mock(Session.class);
    RemoteEndpoint mockRemote = mock(RemoteEndpoint.class);

    when(mockSession.isOpen()).thenReturn(true);
    when(mockSession.getRemote()).thenReturn(mockRemote);

    currentMockWsContext = new WsContext("session1", mockSession) {};

    ClientSubscriptionManager.getInstance().addSession(currentMockWsContext);
    ClientSubscriptionManager.getInstance()
        .handleRaceSubscription(
            currentMockWsContext, RaceSubscriptionRequest.newBuilder().setSubscribe(true).build());
  }

  @Test
  public void testRaceStateTransitionsAndBroadcast() throws Exception {
    // Initial State: NotStarted
    // Note: refreshSession() triggers addSession(), which triggers
    // createSnapshot().
    // We should expect that snapshot or ignore it.
    // We want to verify explicit broadcasts due to state changes.

    // 1. Start Race -> Starting
    refreshSession();
    // When we add session, it sends snapshot (Race, State=NotStarted).
    // Then we start race.
    race.startRace();
    verifyBroadcast(RaceState.STARTING);

    // 2. Protocol countdown finishes -> Racing
    refreshSession();
    race.changeState(new Racing());
    verifyBroadcast(RaceState.RACING);

    // 3. Pause Race -> Paused
    refreshSession();
    race.pauseRace();
    verifyBroadcast(RaceState.PAUSED);

    // 4. Resume Race -> Racing
    refreshSession();
    race.startRace();
    verifyBroadcast(RaceState.STARTING);

    // 5. Heat Over -> HeatOver
    refreshSession();
    race.changeState(new HeatOver());
    verifyBroadcast(RaceState.HEAT_OVER);

    // 6. Next Heat or Race Over
    refreshSession();
    race.changeState(new RaceOver());
    verifyBroadcast(RaceState.RACE_OVER);
  }

  @Test
  public void testHeatOverBroadcastsFullSnapshot() throws Exception {
    refreshSession();
    race.changeState(new HeatOver());

    // We expect the state broadcast AND the snapshot broadcast
    // Verify that a RaceData containing the full Race proto was broadcast
    verifyFullSnapshotBroadcast(RaceState.HEAT_OVER);
  }

  @Test
  public void testRaceOverBroadcastsFullSnapshot() throws Exception {
    refreshSession();
    race.changeState(new RaceOver());

    // We expect the state broadcast AND the snapshot broadcast
    // Verify that a RaceData containing the full Race proto was broadcast
    verifyFullSnapshotBroadcast(RaceState.RACE_OVER);
  }

  private void verifyFullSnapshotBroadcast(RaceState expectedState) throws Exception {
    Field sessionField = WsContext.class.getDeclaredField("session");
    sessionField.setAccessible(true);
    Session session = (Session) sessionField.get(currentMockWsContext);
    RemoteEndpoint remote = session.getRemote();

    ArgumentCaptor<ByteBuffer> captor = ArgumentCaptor.forClass(ByteBuffer.class);
    verify(remote, timeout(200).atLeastOnce()).sendBytesByFuture(captor.capture());

    boolean foundFullSnapshot = false;
    for (ByteBuffer buf : captor.getAllValues()) {
      RaceData raceData = RaceData.parseFrom(buf);
      if (raceData.hasRace()
          && raceData.getRaceState() == expectedState
          && raceData.getRace().hasCurrentHeat()) {
        foundFullSnapshot = true;
        break;
      }
    }
    assertTrue(
        "Should have broadcast full snapshot with currentHeat on entering " + expectedState,
        foundFullSnapshot);
  }

  private void verifyBroadcast(RaceState expectedState) {
    try {
      Field sessionField = WsContext.class.getDeclaredField("session");
      sessionField.setAccessible(true);
      Session session = (Session) sessionField.get(currentMockWsContext);
      RemoteEndpoint remote = session.getRemote();

      ArgumentCaptor<ByteBuffer> captor = ArgumentCaptor.forClass(ByteBuffer.class);

      // Verify sendBytesByFuture with generous timeout/count
      verify(remote, timeout(200).atLeastOnce()).sendBytesByFuture(captor.capture());

      List<ByteBuffer> captured = captor.getAllValues();
      boolean found = false;
      StringBuilder capturedStates = new StringBuilder();

      for (ByteBuffer buf : captured) {
        try {
          RaceData raceData = RaceData.parseFrom(buf);
          if (raceData.hasRaceState()) {
            capturedStates.append("RaceState:").append(raceData.getRaceState()).append(", ");
            if (raceData.getRaceState() == expectedState) {
              found = true;
            }
          } else if (raceData.hasRace()) {
            capturedStates.append("Race.State:").append(raceData.getRace().getState()).append(", ");
            if (raceData.getRace().getState() == expectedState) {
              found = true;
            }
          } else {
            capturedStates.append("UnknownData, ");
          }

          if (found) {
            break;
          }
        } catch (Exception e) {
          capturedStates.append("ParseError, ");
        }
      }
      if (!found) {
        assertEquals(
            "Expected state broadcast not found. Captured: " + capturedStates,
            expectedState.name(),
            "NOT_FOUND");
      }

    } catch (Exception e) {
      throw new RuntimeException("Failed to verify broadcast: " + e.getMessage(), e);
    }
  }

  @Test
  public void testRestartHeatFromPaused() throws Exception {
    // 1. Start -> Starting -> Racing -> Paused
    race.startRace();
    race.changeState(new Racing());
    race.pauseRace();

    refreshSession();
    race.restartHeat();
    verifyBroadcast(RaceState.NOT_STARTED);
  }

  @Test
  public void testRestartHeatResetsOverallStandings() throws Exception {
    // Start -> Racing
    race.startRace();
    race.changeState(new Racing());

    // Record two laps (first is reaction time, second is counted as lap)
    race.onLap(0, 1.0, 1, 0);
    race.onLap(0, 5.0, 1, 0);

    // Verify lap was recorded and overall standings updated
    assertEquals(1.0, race.getDrivers().get(0).getTotalLaps(), 0.001);

    // Pause and restart heat
    race.pauseRace();
    race.restartHeat();

    // Verify overall standings were reset back to 0.0
    assertEquals(0.0, race.getDrivers().get(0).getTotalLaps(), 0.001);
  }

  @Test
  public void testSkipHeatFromNotStarted() throws Exception {
    assertTrue(race.getState() instanceof NotStarted);

    refreshSession();
    race.skipHeat();
    verifyBroadcast(RaceState.RACE_OVER);
    assertTrue(race.getState() instanceof RaceOver);
  }

  @Test
  public void testSkipHeatFromPaused() throws Exception {
    // 1. Start -> Starting -> Racing -> Paused
    race.startRace();
    race.changeState(new Racing());
    race.pauseRace();
    assertTrue(race.getState() instanceof Paused);

    refreshSession();
    race.skipHeat();
    verifyBroadcast(RaceState.RACE_OVER);
    assertTrue(race.getState() instanceof RaceOver);
  }

  @Test
  public void testSkipHeatWithMultipleHeats() throws Exception {
    // Add a second heat to the race
    List<Heat> heats = race.getHeats();
    Heat h2 = mock(Heat.class);
    when(h2.getDrivers()).thenReturn(new ArrayList<>());
    when(h2.getHeatStandings()).thenReturn(mock(HeatStandings.class));
    heats.add(h2);

    assertTrue(race.getState() instanceof NotStarted);

    refreshSession();
    race.skipHeat();

    // Verify it transitioned to NotStarted (for the second heat)
    verifyBroadcast(RaceState.NOT_STARTED);
    assertTrue(race.getState() instanceof NotStarted);
    assertEquals(h2, race.getCurrentHeat());
  }

  @Test
  public void testOnCallbuttonTransitions() throws Exception {
    // Initial State: NotStarted
    assertTrue(race.getState() instanceof NotStarted);

    // Callbutton in NotStarted starts race -> Starting
    race.onCallbutton(0, 0);
    assertTrue(race.getState() instanceof Starting);

    // Callbutton in Starting cancels -> NotStarted (because hasn't raced yet)
    race.onCallbutton(0, 0);
    assertTrue(race.getState() instanceof NotStarted);

    // Move to Racing manually
    race.changeState(new Racing());
    assertTrue(race.getState() instanceof Racing);

    // Callbutton in Racing pauses -> Paused
    race.onCallbutton(0, 0);
    assertTrue(race.getState() instanceof Paused);

    // Callbutton in Paused resumes -> Starting
    race.onCallbutton(0, 0);
    assertTrue(race.getState() instanceof Starting);

    // Move to HeatOver manually
    race.changeState(new HeatOver());
    assertTrue(race.getState() instanceof HeatOver);

    // Callbutton in HeatOver moves to next heat. For this simple race, it ends
    // since there's no more schedule
    race.onCallbutton(0, 0);
    assertTrue(race.getState() instanceof RaceOver);

    // Callbutton in RaceOver does nothing (ignored)
    race.onCallbutton(0, 0);
    assertTrue(race.getState() instanceof RaceOver);
  }

  @Test
  public void testOnCallbuttonAbortsAutoAdvance() throws Exception {
    // 1. Setup Race in HeatOver with Auto-Advance
    race.changeState(new HeatOver());
    race.setAutoAdvanceRemaining(10.0);
    race.addRaceTime(12.3f);
    assertTrue(race.getState() instanceof HeatOver);

    // 2. Press Call button
    race.onCallbutton(0, 0);

    // 3. Verify timer aborted (stay in HeatOver)
    assertEquals(0.0, race.getAutoAdvanceRemaining(), 0.001);
    assertEquals(0.0, race.getRaceTime(), 0.001);
    assertTrue(race.getState() instanceof HeatOver);
  }

  @Test
  public void testPauseDuringAutoStartCancelsTimer() throws Exception {
    // 1. Setup Race with Auto-Start
    race.setAutoStartRemaining(10.0);
    race.addRaceTime(5.5f);
    assertTrue(race.getState() instanceof NotStarted);

    // 2. Pause
    refreshSession();
    race.pauseRace();

    // 3. Verify
    assertEquals(0.0, race.getAutoStartRemaining(), 0.001);
    assertEquals(0.0, race.getRaceTime(), 0.001);
    assertTrue(race.getState() instanceof NotStarted);
    // Note: We don't call verifyBroadcast(RaceState.PAUSED) because state doesn't
    // change.
    // Instead, Race.clearAutoTimers() broadcasts the reset timer.
  }

  @Test
  public void testAutoStartRunsOnFirstHeat() throws Exception {
    // 1. Setup race with auto-start time
    injectAutoStartTime(10.0);

    // 2. State transition to trigger enter()
    // We transition to Paused first to avoid NotStarted.exit() clearing the timer
    // set by NotStarted.enter() due to the order in Race.changeState()
    race.changeState(new Paused());
    race.changeState(new NotStarted());

    // 3. Verify autoStartRemaining is 10.0
    assertEquals(10.0, race.getAutoStartRemaining(), 0.001);
  }

  @Test
  public void testCreateSnapshotIncludesStateAndAutoTimers() throws Exception {
    race.setAutoStartRemaining(5.5);
    race.setAutoAdvanceRemaining(3.3);

    RaceData snapshot = race.createSnapshot();

    assertTrue(snapshot.hasRaceState());
    assertEquals(RaceState.NOT_STARTED, snapshot.getRaceState());
    assertEquals(5.5, snapshot.getRaceTime().getAutoStartRemaining(), 0.001);
    assertEquals(3.3, snapshot.getRaceTime().getAutoAdvanceRemaining(), 0.001);

    // Verify that snapshot includes recordData
    assertTrue(snapshot.hasRecordData());
    org.junit.Assert.assertNotNull(snapshot.getRecordData());
  }

  @Test
  public void testAutoStartRunsOnSecondHeat() throws Exception {
    // 1. Setup race with auto-start time
    injectAutoStartTime(10.0);

    // 2. Advance to second heat
    List<Heat> heats = race.getHeats();
    Heat h2 = mock(Heat.class);
    when(h2.getDrivers()).thenReturn(new ArrayList<>());
    when(h2.getHeatStandings()).thenReturn(mock(HeatStandings.class));
    heats.add(h2);

    race.setCurrentHeat(h2);

    // 3. State transition to trigger enter()
    // We transition to Paused first to avoid NotStarted.exit() clearing the timer
    // set by NotStarted.enter() due to the order in Race.changeState()
    race.changeState(new Paused());
    race.changeState(new NotStarted());

    // 4. Verify autoStartRemaining is 10.0
    assertEquals(10.0, race.getAutoStartRemaining(), 0.001);
  }

  @Test
  public void testPauseDuringAutoAdvanceCancelsTimer() throws Exception {
    // 1. Setup Race in HeatOver with Auto-Advance
    race.changeState(new HeatOver());
    race.setAutoAdvanceRemaining(10.0);
    assertTrue(race.getState() instanceof HeatOver);

    // 2. Pause
    refreshSession();
    race.pauseRace();

    // 3. Verify
    assertEquals(0.0, race.getAutoAdvanceRemaining(), 0.001);
    assertTrue(race.getState() instanceof HeatOver);
  }

  @Test
  public void testDriftLapCountingDuringPause() throws Exception {
    // 1. Setup race with drift time
    injectDriftTime(2.0);

    // 2. Start -> Racing
    race.startRace();
    race.changeState(new Racing());

    // 3. Trigger reaction lap first
    race.onLap(0, 1.0, 1, 0);
    assertEquals(0, race.getCurrentHeat().getDrivers().get(0).getLapCount());

    // 4. Pause
    race.pauseRace();
    assertTrue(race.getState() instanceof Paused);

    // 5. Trigger lap immediately (within drift window)
    race.onLap(0, 5.0, 1, 0);

    // 6. Verify lap was counted
    assertEquals(1, race.getCurrentHeat().getDrivers().get(0).getLapCount());
    assertTrue(race.getCurrentHeat().getDrivers().get(0).getLaps().get(0).isDrift());
  }

  @Test
  public void testLapIgnoredAfterDriftTime() throws Exception {
    // 1. Setup race with VERY short drift time
    injectDriftTime(0.1); // 100ms

    // 2. Start -> Racing
    race.startRace();
    race.changeState(new Racing());

    // 3. Trigger reaction lap first
    race.onLap(0, 1.0, 1, 0);

    // 4. Pause
    race.pauseRace();

    // 5. Wait for drift time to expire
    Thread.sleep(200);

    // 6. Trigger lap
    race.onLap(0, 5.0, 1, 0);

    // 7. Verify lap was NOT counted (it remains 0 because reaction lap is not
    // counted as a full
    // lap)
    assertEquals(0, race.getCurrentHeat().getDrivers().get(0).getLapCount());
  }

  private void injectDriftTime(double driftTime) throws Exception {
    // We need to inject the driftTime into the realRaceModel since it's immutable
    // (Builder)
    Field modelField = com.antigravity.race.Race.class.getDeclaredField("model");
    modelField.setAccessible(true);
    Race oldModel = (Race) modelField.get(race);

    Race newModel =
        new Race.Builder()
            .withName(oldModel.getName())
            .withTrackEntityId(oldModel.getTrackEntityId())
            .withHeatRotationType(oldModel.getHeatRotationType())
            .withHeatScoring(oldModel.getHeatScoring())
            .withOverallScoring(oldModel.getOverallScoring())
            .withMinLapTime(oldModel.getMinLapTime())
            .withFuelOptions(oldModel.getFuelOptions())
            .withDigitalFuelOptions(oldModel.getDigitalFuelOptions())
            .withTeamOptions(oldModel.getTeamOptions())
            .withAutoAdvanceTime(oldModel.getAutoAdvanceTime())
            .withAutoStartTime(oldModel.getAutoStartTime())
            .withAutoAdvanceWarmupTime(oldModel.getAutoAdvanceWarmupTime())
            .withAutoStartWarmupTime(oldModel.getAutoStartWarmupTime())
            .withEntityId(oldModel.getEntityId())
            .withId(oldModel.getId())
            .withDriftTime(driftTime)
            .build();

    modelField.set(race, newModel);
  }

  private void injectAutoStartTime(double autoStartTime) throws Exception {
    Field modelField = com.antigravity.race.Race.class.getDeclaredField("model");
    modelField.setAccessible(true);
    Race oldModel = (Race) modelField.get(race);

    Race newModel =
        new Race.Builder()
            .withName(oldModel.getName())
            .withTrackEntityId(oldModel.getTrackEntityId())
            .withHeatRotationType(oldModel.getHeatRotationType())
            .withHeatScoring(oldModel.getHeatScoring())
            .withOverallScoring(oldModel.getOverallScoring())
            .withMinLapTime(oldModel.getMinLapTime())
            .withFuelOptions(oldModel.getFuelOptions())
            .withDigitalFuelOptions(oldModel.getDigitalFuelOptions())
            .withTeamOptions(oldModel.getTeamOptions())
            .withAutoAdvanceTime(oldModel.getAutoAdvanceTime())
            .withAutoStartTime(autoStartTime)
            .withAutoAdvanceWarmupTime(oldModel.getAutoAdvanceWarmupTime())
            .withAutoStartWarmupTime(oldModel.getAutoStartWarmupTime())
            .withEntityId(oldModel.getEntityId())
            .withId(oldModel.getId())
            .withDriftTime(oldModel.getDriftTime())
            .build();

    modelField.set(race, newModel);
  }

  @Test
  public void testRaceOver_CheckeredFlagWhenLastHeatAndAllowFinishNone() {
    RaceOver raceOver = new RaceOver();
    com.antigravity.race.Race mockRace = mock(com.antigravity.race.Race.class);

    com.antigravity.models.Race mockModel = mock(com.antigravity.models.Race.class);
    when(mockRace.getRaceModel()).thenReturn(mockModel);

    HeatScoring mockHeatScoring = mock(HeatScoring.class);
    when(mockHeatScoring.getAllowFinish()).thenReturn(HeatScoring.AllowFinish.None);
    when(mockModel.getHeatScoring()).thenReturn(mockHeatScoring);

    when(mockRace.isLastHeat()).thenReturn(true);

    com.antigravity.proto.RaceFlag flag = raceOver.getFlagType(mockRace);
    assertTrue(flag == com.antigravity.proto.RaceFlag.CHECKERED);
  }

  @Test
  public void testRaceOver_RedFlagWhenNotLastHeat() {
    RaceOver raceOver = new RaceOver();
    com.antigravity.race.Race mockRace = mock(com.antigravity.race.Race.class);

    com.antigravity.models.Race mockModel = mock(com.antigravity.models.Race.class);
    when(mockRace.getRaceModel()).thenReturn(mockModel);

    HeatScoring mockHeatScoring = mock(HeatScoring.class);
    when(mockHeatScoring.getAllowFinish()).thenReturn(HeatScoring.AllowFinish.None);
    when(mockModel.getHeatScoring()).thenReturn(mockHeatScoring);

    when(mockRace.isLastHeat()).thenReturn(false);

    com.antigravity.proto.RaceFlag flag = raceOver.getFlagType(mockRace);
    assertTrue(flag == com.antigravity.proto.RaceFlag.RED);
  }

  @Test
  public void testRaceOver_RedFlagWhenAllowFinishEnabled() {
    RaceOver raceOver = new RaceOver();
    com.antigravity.race.Race mockRace = mock(com.antigravity.race.Race.class);

    com.antigravity.models.Race mockModel = mock(com.antigravity.models.Race.class);
    when(mockRace.getRaceModel()).thenReturn(mockModel);

    HeatScoring mockHeatScoring = mock(HeatScoring.class);
    when(mockHeatScoring.getAllowFinish()).thenReturn(HeatScoring.AllowFinish.Allow);
    when(mockModel.getHeatScoring()).thenReturn(mockHeatScoring);

    when(mockRace.isLastHeat()).thenReturn(true);

    com.antigravity.proto.RaceFlag flag = raceOver.getFlagType(mockRace);
    assertTrue(flag == com.antigravity.proto.RaceFlag.RED);
  }

  @Test
  public void testChangeStateUpdatesDriverFlags() {
    // Set a positive race time so it doesn't show checkered due to timed race finishing
    race.addRaceTime(100.0f);

    // Transition to Racing manually
    race.changeState(new Racing());

    // We have 1 driver in heat (Drivers list size = 1)
    assertEquals(1, race.getCurrentHeat().getDrivers().size());

    // Global flag for Racing is GREEN
    assertEquals(com.antigravity.proto.RaceFlag.GREEN, race.getState().getFlagType(race));

    // The driver flag should have been updated to GREEN
    assertEquals(
        com.antigravity.proto.RaceFlag.GREEN, race.getCurrentHeat().getDrivers().get(0).getFlag());

    // Transition to HeatOver
    race.changeState(new HeatOver());

    // Global flag for HeatOver is RED
    assertEquals(com.antigravity.proto.RaceFlag.RED, race.getState().getFlagType(race));

    // The driver flag should have been updated to RED
    assertEquals(
        com.antigravity.proto.RaceFlag.RED, race.getCurrentHeat().getDrivers().get(0).getFlag());
  }

  @Test
  public void testSkipRaceFromNotStarted() throws Exception {
    assertTrue(race.getState() instanceof NotStarted);

    refreshSession();
    race.skipRace();
    verifyBroadcast(RaceState.RACE_OVER);
    assertTrue(race.getState() instanceof RaceOver);
  }

  @Test
  public void testSkipRaceFromPaused() throws Exception {
    // 1. Start -> Starting -> Racing -> Paused
    race.startRace();
    race.changeState(new Racing());
    race.pauseRace();
    assertTrue(race.getState() instanceof Paused);

    refreshSession();
    race.skipRace();
    verifyBroadcast(RaceState.RACE_OVER);
    assertTrue(race.getState() instanceof RaceOver);
  }

  @Test
  public void testSkipRaceFromHeatOver() throws Exception {
    race.changeState(new HeatOver());
    assertTrue(race.getState() instanceof HeatOver);

    refreshSession();
    race.skipRace();
    verifyBroadcast(RaceState.RACE_OVER);
    assertTrue(race.getState() instanceof RaceOver);
  }

  @Test(expected = IllegalStateException.class)
  public void testSkipRaceWhenAlreadyOver() throws Exception {
    race.changeState(new RaceOver());
    assertTrue(race.getState() instanceof RaceOver);

    race.skipRace(); // Should throw IllegalStateException
  }

  @Test
  public void testSkipRaceWithMultipleHeatsRemaining() throws Exception {
    // Add a second heat to the race
    List<Heat> heats = race.getHeats();
    Heat h2 = mock(Heat.class);
    when(h2.getDrivers()).thenReturn(new ArrayList<>());
    when(h2.getHeatStandings()).thenReturn(mock(HeatStandings.class));
    heats.add(h2);

    assertTrue(race.getState() instanceof NotStarted);

    refreshSession();
    race.skipRace();

    // Verify it goes directly to RaceOver, skipping remaining heats
    verifyBroadcast(RaceState.RACE_OVER);
    assertTrue(race.getState() instanceof RaceOver);
  }

  @Test
  public void testSetCurrentHeatBroadcastsGroupStandings() throws Exception {
    // Enable group options on model
    Field modelField = com.antigravity.race.Race.class.getDeclaredField("model");
    modelField.setAccessible(true);
    Race oldModel = (Race) modelField.get(race);
    Race newModel =
        new Race.Builder()
            .withName(oldModel.getName())
            .withTrackEntityId(oldModel.getTrackEntityId())
            .withHeatRotationType(oldModel.getHeatRotationType())
            .withHeatScoring(oldModel.getHeatScoring())
            .withOverallScoring(oldModel.getOverallScoring())
            .withMinLapTime(oldModel.getMinLapTime())
            .withFuelOptions(oldModel.getFuelOptions())
            .withDigitalFuelOptions(oldModel.getDigitalFuelOptions())
            .withTeamOptions(oldModel.getTeamOptions())
            .withAutoAdvanceTime(oldModel.getAutoAdvanceTime())
            .withAutoStartTime(oldModel.getAutoStartTime())
            .withAutoAdvanceWarmupTime(oldModel.getAutoAdvanceWarmupTime())
            .withAutoStartWarmupTime(oldModel.getAutoStartWarmupTime())
            .withEntityId(oldModel.getEntityId())
            .withId(oldModel.getId())
            .withDriftTime(oldModel.getDriftTime())
            .withGroupOptions(
                new com.antigravity.models.GroupOptions(true, 2, false, true, false, true, 0))
            .build();
    modelField.set(race, newModel);

    // Add another heat to race
    List<Heat> heats = race.getHeats();
    Heat h2 = mock(Heat.class);
    when(h2.getDrivers()).thenReturn(new ArrayList<>());
    when(h2.getHeatStandings()).thenReturn(mock(HeatStandings.class));
    when(h2.getGroup()).thenReturn(1);
    heats.add(h2);

    refreshSession();
    race.setCurrentHeat(h2);

    // Verify it broadcasts GroupStandingsUpdate
    Field sessionField = WsContext.class.getDeclaredField("session");
    sessionField.setAccessible(true);
    Session session = (Session) sessionField.get(currentMockWsContext);
    RemoteEndpoint remote = session.getRemote();

    ArgumentCaptor<ByteBuffer> captor = ArgumentCaptor.forClass(ByteBuffer.class);
    verify(remote, timeout(200).atLeastOnce()).sendBytesByFuture(captor.capture());

    boolean foundGroupUpdate = false;
    for (ByteBuffer buf : captor.getAllValues()) {
      try {
        RaceData raceData = RaceData.parseFrom(buf);
        if (raceData.hasGroupStandingsUpdate()
            && raceData.getGroupStandingsUpdate().getGroup() == 1) {
          foundGroupUpdate = true;
          break;
        }
      } catch (Exception e) {
      }
    }
    assertTrue("Should have broadcast GroupStandingsUpdate with group = 1", foundGroupUpdate);
  }

  @Test
  public void testBroadcastFlagUpdatesProtocols() throws Exception {
    com.antigravity.protocols.ProtocolDelegate mockProtocols =
        mock(com.antigravity.protocols.ProtocolDelegate.class);
    race.injectProtocols(mockProtocols);

    // Initial state in tests is NotStarted
    assertTrue(race.getState() instanceof NotStarted);

    // Call broadcastFlag with a specific flag, e.g. WHITE
    race.broadcastFlag(com.antigravity.proto.RaceFlag.WHITE);

    // Verify setRaceState was called on the mockProtocols with the appropriate arguments
    verify(mockProtocols)
        .setRaceState(
            eq(com.antigravity.proto.RaceState.NOT_STARTED),
            eq(com.antigravity.proto.RaceFlag.WHITE),
            anyDouble());
  }

  @Test
  public void testHeatOverExitDoesNotInterruptTickerThread() throws InterruptedException {
    HeatOver heatOver = new HeatOver();
    com.antigravity.race.Race mockRace = mock(com.antigravity.race.Race.class);
    com.antigravity.models.Race mockModel = mock(com.antigravity.models.Race.class);
    when(mockRace.getRaceModel()).thenReturn(mockModel);
    when(mockModel.getAutoAdvanceTime()).thenReturn(0.1);

    java.util.concurrent.atomic.AtomicBoolean wasInterrupted =
        new java.util.concurrent.atomic.AtomicBoolean(false);
    java.util.concurrent.CountDownLatch latch = new java.util.concurrent.CountDownLatch(1);

    org.mockito.stubbing.Answer<Void> answer =
        invocation -> {
          heatOver.exit(mockRace);
          wasInterrupted.set(Thread.currentThread().isInterrupted());
          latch.countDown();
          return null;
        };
    org.mockito.Mockito.doAnswer(answer).when(mockRace).broadcastTime();

    heatOver.enter(mockRace);

    assertTrue(
        "Timer should have triggered broadcastTime",
        latch.await(2, java.util.concurrent.TimeUnit.SECONDS));
    assertFalse("Ticker thread should not be interrupted by exit()", wasInterrupted.get());
  }
}
