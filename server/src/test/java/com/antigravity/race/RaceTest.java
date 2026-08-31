package com.antigravity.race;

import static org.junit.Assert.*;
import static org.mockito.Mockito.*;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.AnalogFuelOptions;
import com.antigravity.models.Driver;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.Lane;
import com.antigravity.models.OverallScoring;
import com.antigravity.models.Race;
import com.antigravity.models.Team;
import com.antigravity.models.Theme;
import com.antigravity.models.Track;
import com.antigravity.proto.RaceData;
import com.antigravity.proto.RaceFlag;
import com.antigravity.proto.RaceState;
import com.antigravity.proto.RaceSubscriptionRequest;
import com.antigravity.protocols.CarData;
import com.antigravity.protocols.CarLocation;
import com.antigravity.protocols.ProtocolDelegate;
import com.antigravity.protocols.arduino.ArduinoConfig;
import com.antigravity.race.states.Common;
import com.antigravity.race.states.HeatOver;
import com.antigravity.race.states.NotStarted;
import com.antigravity.race.states.Paused;
import com.antigravity.race.states.RaceOver;
import com.antigravity.race.states.Racing;
import com.antigravity.race.states.Starting;
import com.antigravity.service.ServerConfigService;
import com.antigravity.util.CsvExporter;
import io.javalin.websocket.WsContext;
import java.io.File;
import java.lang.reflect.Field;
import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import org.eclipse.jetty.websocket.api.RemoteEndpoint;
import org.eclipse.jetty.websocket.api.Session;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.experimental.runners.Enclosed;
import org.junit.rules.TemporaryFolder;
import org.junit.runner.RunWith;
import org.mockito.ArgumentCaptor;

/**
 * 1:1 Cohesive Test Suite for com.antigravity.race.Race
 *
 * <p>Consolidates all 22 former fragmented test classes into 9 domain sub-suites: 1.
 * ConstructorAndInitialization 2. LifecycleAndStateTransitions 3. RacingAndLapTracking 4.
 * PowerManagement 5. FuelAndRefueling 6. LaneSwaps 7. FlagsAndBroadcasts 8. TimingAndDrift 9.
 * DemoAndHealthEdgeCases
 */
@RunWith(Enclosed.class)
public class RaceTest {

  // =========================================================================
  // 1. Constructor and Initialization
  // =========================================================================
  public static class ConstructorAndInitialization {
    @Rule public TemporaryFolder tempFolder = new TemporaryFolder();
    private DatabaseContext dbContext;

    @Before
    public void setUp() throws Exception {
      String rootDir = tempFolder.newFolder("db_root").getAbsolutePath() + File.separator;
      dbContext = new DatabaseContext("test_db", null, rootDir);
    }

    @After
    public void tearDown() {
      if (dbContext != null && dbContext.getConnection() != null) {
        try {
          dbContext.getConnection().close();
        } catch (Exception ignored) {
        }
      }
    }

    @Test
    public void testCustomRotationsLoadedOnResume() {
      Race model = mock(Race.class);
      when(model.getHeatRotationType()).thenReturn(HeatRotationType.Custom);
      when(model.getCustomRotationAssetId()).thenReturn("asset1");
      List<RaceParticipant> drivers = new ArrayList<>();
      drivers.add(
          new RaceParticipant(
              new Driver(
                  "d1",
                  "Driver 1",
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  "d1",
                  null),
              "p1"));
      Track track = mock(Track.class);

      List<Heat> heats = new ArrayList<>();
      heats.add(mock(Heat.class));

      com.antigravity.race.Race race =
          new com.antigravity.race.Race.Builder()
              .model(model)
              .drivers(drivers)
              .track(track)
              .databaseContext(dbContext)
              .heats(heats)
              .isDemoMode(true)
              .build();

      assertNotNull(race);
    }

    @Test
    public void testSetTheme_UpdatesTheme() {
      Race model = mock(Race.class);
      when(model.getHeatRotationType()).thenReturn(HeatRotationType.RoundRobin);
      Track track = mock(Track.class);
      List<RaceParticipant> drivers = new ArrayList<>();

      java.util.Map<String, String> slots = new java.util.HashMap<>();
      slots.put("flag.heat_paused", "default_flag_checkered");
      Theme theme1 = new Theme("Theme 1", false, slots, null, "theme-1", null);

      List<Heat> heats = new ArrayList<>();
      heats.add(mock(Heat.class));

      com.antigravity.race.Race race =
          new com.antigravity.race.Race.Builder()
              .model(model)
              .drivers(drivers)
              .track(track)
              .theme(theme1)
              .databaseContext(dbContext)
              .heats(heats)
              .isDemoMode(true)
              .build();

      assertEquals(theme1, race.getTheme());

      Theme theme2 = new Theme("Theme 2", false, new java.util.HashMap<>(), null, "theme-2", null);
      race.setTheme(theme2);
      assertEquals(theme2, race.getTheme());
    }
  }

  // =========================================================================
  // 2. Lifecycle and State Transitions
  // =========================================================================
  public static class LifecycleAndStateTransitions {
    private com.antigravity.race.Race race;
    private ProtocolDelegate mockProtocols;
    private WsContext currentMockWsContext;
    private Starting starting;
    private ServerConfigService configService;
    private DatabaseContext mockDbCtx;

    @Before
    public void setUp() throws Exception {
      ServerConfigService configService = mock(ServerConfigService.class);
      when(configService.getStartRandomizer()).thenReturn(0.0);
      when(configService.getRestartRandomizer()).thenReturn(0.0);

      ClientSubscriptionManager.getInstance().setAutoShutdownAction(() -> {});
      ClientSubscriptionManager.getInstance().setAutoShutdownDelaySeconds(999999);

      DatabaseContext mockDbCtx = mock(DatabaseContext.class);
      when(mockDbCtx.getConfigService()).thenReturn(configService);
      ClientSubscriptionManager.getInstance().setDatabaseContext(mockDbCtx);

      List<ArduinoConfig> mockConfig = Collections.singletonList(mock(ArduinoConfig.class));

      List<Lane> lanes = new ArrayList<>();
      lanes.add(new Lane("red", "black", 100));

      Track realTrack =
          new Track.Builder()
              .name("Test Track")
              .lanes(lanes)
              .arduinoConfigs(mockConfig)
              .entityId("track1")
              .id("1")
              .build();

      HeatScoring mockHeatScoring = mock(HeatScoring.class);
      when(mockHeatScoring.getHeatRanking()).thenReturn(HeatScoring.HeatRanking.LAP_COUNT);
      when(mockHeatScoring.getHeatRankingTiebreaker())
          .thenReturn(HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME);
      when(mockHeatScoring.getFinishMethod()).thenReturn(HeatScoring.FinishMethod.Timed);
      when(mockHeatScoring.getFinishValue()).thenReturn(100L);
      when(mockHeatScoring.getAllowFinish()).thenReturn(HeatScoring.AllowFinish.None);

      OverallScoring mockOverallScoring = mock(OverallScoring.class);
      when(mockOverallScoring.getRankingMethod())
          .thenReturn(OverallScoring.OverallRanking.LAP_COUNT);
      when(mockOverallScoring.getTiebreaker())
          .thenReturn(OverallScoring.OverallRankingTiebreaker.FASTEST_LAP_TIME);

      Race realRaceModel =
          new Race.Builder()
              .withName("Test Race")
              .withTrackEntityId("track1")
              .withHeatRotationType(HeatRotationType.RoundRobin)
              .withHeatScoring(mockHeatScoring)
              .withOverallScoring(mockOverallScoring)
              .withStartTime(1.0)
              .withRestartTime(2.0)
              .withEntityId("race1")
              .withId("1")
              .build();

      List<RaceParticipant> drivers = new ArrayList<>();
      drivers.add(
          new RaceParticipant(new Driver("Test Driver", "D1", "driver1", "1"), "participant1"));

      race =
          new com.antigravity.race.Race.Builder()
              .model(realRaceModel)
              .drivers(drivers)
              .track(realTrack)
              .isDemoMode(true)
              .build();

      mockProtocols = mock(ProtocolDelegate.class);
      when(mockProtocols.isHealthy()).thenReturn(true);
      race.injectProtocols(mockProtocols);

      ClientSubscriptionManager.getInstance().setRace(race);
      starting = new Starting();
    }

    @After
    public void tearDown() {
      if (currentMockWsContext != null) {
        ClientSubscriptionManager.getInstance().removeSession(currentMockWsContext);
      }
      if (race != null) {
        race.stop();
      }
      ClientSubscriptionManager.setInstance(null);
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
              currentMockWsContext,
              RaceSubscriptionRequest.newBuilder().setSubscribe(true).build());
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
              capturedStates
                  .append("Race.State:")
                  .append(raceData.getRace().getState())
                  .append(", ");
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
    public void testStopClosesProtocols() {
      race.stop();
      verify(mockProtocols).clearLeds();
      verify(mockProtocols).close();
    }

    @Test
    public void testStopSetsStoppedAndIgnoresHardwareDisconnect() {
      assertFalse(race.isStopped());
      race.changeState(new Racing());
      assertTrue(race.getState() instanceof Racing);

      race.stop();
      assertTrue(race.isStopped());
      verify(mockProtocols).clearLeds();
      verify(mockProtocols).close();

      // Trigger disconnect that occurs during hardware close
      race.onInterfaceStatus(com.antigravity.proto.InterfaceStatus.DISCONNECTED, 0);
      race.stopRaceOperationsOnHardwareDisconnect();

      // Ensure state was not transitioned to Paused or altered
      assertFalse(race.getState() instanceof Paused);

      // Verify that commands are safely no-op when stopped
      assertFalse(race.startRace());
      race.pauseRace();
      race.restartHeat();
      race.skipHeat();
      race.deferHeat();
      race.onCarData(
          new CarData(
              0,
              1.0,
              0.5,
              0.5,
              false,
              com.antigravity.protocols.CarLocation.PitRow,
              com.antigravity.protocols.CarLocation.PitRow,
              -1));
      race.onInterfaceEvent(
          com.antigravity.proto.InterfaceEvent.newBuilder()
              .setStatus(
                  com.antigravity.proto.InterfaceStatusEvent.newBuilder()
                      .setStatus(com.antigravity.proto.InterfaceStatus.DISCONNECTED)
                      .setInterfaceIndex(0)
                      .build())
              .build());
      race.changeState(new Paused());
      assertFalse(race.getState() instanceof Paused);
    }

    @Test
    public void testNotStartedInitialization() throws Exception {
      race.changeState(new NotStarted());
      verify(mockProtocols).setHeatStandings(Arrays.asList(0));
      verify(mockProtocols).setHeatProgress(0);
    }

    @Test
    public void testFailedInitClosesProtocols() throws Exception {
      race.stop();
      verify(mockProtocols).close();
    }

    @Test
    public void testStandingsFilterOutEmptyDrivers() {
      List<Lane> twoLanes = new ArrayList<>();
      twoLanes.add(new Lane("red", "black", 100));
      twoLanes.add(new Lane("blue", "white", 101));

      Track track2 =
          new Track.Builder()
              .name("Test Track")
              .lanes(twoLanes)
              .arduinoConfigs(Collections.singletonList(mock(ArduinoConfig.class)))
              .entityId("track1")
              .id("1")
              .build();

      com.antigravity.race.Race twoLaneRace =
          new com.antigravity.race.Race.Builder()
              .model(race.getRaceModel())
              .drivers(race.getDrivers())
              .track(track2)
              .isDemoMode(true)
              .build();

      RaceData snapshot = twoLaneRace.createSnapshot();
      assertEquals(2, snapshot.getRace().getDriversCount());
      assertEquals("Test Driver", snapshot.getRace().getDrivers(0).getDriver().getName());
      assertEquals(1, snapshot.getRace().getDrivers(0).getRank());
      assertEquals(99, snapshot.getRace().getDrivers(1).getRank());
    }

    @Test
    public void testStartingUsesStartTimeForNewHeat() throws InterruptedException {
      race.setHasRacedInCurrentHeat(false);
      long start = System.currentTimeMillis();
      race.changeState(starting);

      long deadline = System.currentTimeMillis() + 5000;
      while (!(race.getState() instanceof Racing) && System.currentTimeMillis() < deadline) {
        Thread.sleep(100);
      }

      assertTrue(race.getState() instanceof Racing);
      long duration = System.currentTimeMillis() - start;
      assertTrue(
          "Duration should be around 1000ms, was " + duration, duration >= 900 && duration < 3000);
    }

    @Test
    public void testStartingUsesRestartTimeForRestart() throws InterruptedException {
      race.setHasRacedInCurrentHeat(true);
      long start = System.currentTimeMillis();
      race.changeState(starting);

      long deadline = System.currentTimeMillis() + 5000;
      while (!(race.getState() instanceof Racing) && System.currentTimeMillis() < deadline) {
        Thread.sleep(100);
      }

      assertTrue(race.getState() instanceof Racing);
      long duration = System.currentTimeMillis() - start;
      assertTrue(
          "Duration should be around 2000ms, was " + duration, duration >= 1900 && duration < 4000);
    }

    @Test
    public void testStartingWaitRandomDelay() throws InterruptedException {
      Race raceModelWithDelay =
          new Race.Builder()
              .from(race.getRaceModel())
              .withStartTime(1.0)
              .withStartRandomizer(1.0)
              .build();

      com.antigravity.race.Race delayRace =
          new com.antigravity.race.Race.Builder()
              .model(raceModelWithDelay)
              .track(race.getTrack())
              .drivers(race.getDrivers())
              .isDemoMode(true)
              .build();
      ClientSubscriptionManager.getInstance().setRace(delayRace);

      long start = System.currentTimeMillis();
      delayRace.changeState(starting);

      long deadline = System.currentTimeMillis() + 6000;
      while (!(delayRace.getState() instanceof Racing) && System.currentTimeMillis() < deadline) {
        Thread.sleep(100);
      }

      assertTrue(delayRace.getState() instanceof Racing);
      long duration = System.currentTimeMillis() - start;
      assertTrue("Duration should be at least 1000ms, was " + duration, duration >= 900);
      assertTrue("Duration should be around 2000ms max, was " + duration, duration < 4000);
    }

    @Test
    public void testHotStart() throws InterruptedException {
      Race hotStartModel = new Race.Builder().withHotStart(true).build();

      com.antigravity.race.Race hotRace =
          new com.antigravity.race.Race.Builder()
              .model(hotStartModel)
              .track(race.getTrack())
              .drivers(race.getDrivers())
              .databaseContext(mockDbCtx)
              .isDemoMode(true)
              .build();
      ProtocolDelegate hotProtocols = mock(ProtocolDelegate.class);
      when(hotProtocols.isHealthy()).thenReturn(true);
      hotRace.injectProtocols(hotProtocols);
      ClientSubscriptionManager.getInstance().setRace(hotRace);

      hotRace.changeState(starting);

      assertTrue(hotRace.getState() instanceof Starting);
      assertTrue(hotRace.isMainPower());
    }

    @Test
    public void testHotStartDoesNotBypassCountdown() throws InterruptedException {
      Race hotStartModel = new Race.Builder().withHotStart(true).withStartTime(1.0).build();

      com.antigravity.race.Race hotRace =
          new com.antigravity.race.Race.Builder()
              .model(hotStartModel)
              .track(race.getTrack())
              .drivers(race.getDrivers())
              .databaseContext(mockDbCtx)
              .isDemoMode(true)
              .build();
      ProtocolDelegate hotProtocols = mock(ProtocolDelegate.class);
      when(hotProtocols.isHealthy()).thenReturn(true);
      hotRace.injectProtocols(hotProtocols);
      ClientSubscriptionManager.getInstance().setRace(hotRace);

      assertTrue(hotRace.getState() instanceof NotStarted);
      assertFalse(hotRace.isMainPower());

      hotRace.startRace();
      assertTrue(hotRace.getState() instanceof Starting);
      assertTrue(hotRace.isMainPower());

      long deadline = System.currentTimeMillis() + 5000;
      while (!(hotRace.getState() instanceof Racing) && System.currentTimeMillis() < deadline) {
        Thread.sleep(100);
      }

      assertTrue(hotRace.getState() instanceof Racing);
      assertTrue(hotRace.isMainPower());
    }

    @Test
    public void testStartingFalseStartWithRestartOnFalseStart() {
      Race falseStartModel =
          new Race.Builder()
              .from(race.getRaceModel())
              .withRestartOnFalseStart(true)
              .withFalseStartLapPenalty(1.0)
              .withFalseStartTimePenalty(3.0)
              .build();

      com.antigravity.race.Race fsRace =
          new com.antigravity.race.Race.Builder()
              .model(falseStartModel)
              .track(race.getTrack())
              .drivers(race.getDrivers())
              .isDemoMode(true)
              .build();
      ClientSubscriptionManager.getInstance().setRace(fsRace);

      Starting st = new Starting();
      fsRace.changeState(st);
      boolean handled = st.onLap(0, 0.5, 1, false);

      assertTrue("onLap should return true for false start", handled);
      assertTrue(fsRace.getState() instanceof NotStarted);

      DriverHeatData dhd = fsRace.getCurrentHeat().getDrivers().get(0);
      assertEquals(1, dhd.getFalseStarts());
      assertEquals(1.0, dhd.getPenaltyLaps(), 0.001);
      assertEquals(3.0, dhd.getRemainingFalseStartTimePenalty(), 0.001);
    }

    @Test
    public void testStartingFalseStartWithoutRestartOnFalseStart() {
      Race falseStartModel =
          new Race.Builder()
              .from(race.getRaceModel())
              .withRestartOnFalseStart(false)
              .withFalseStartLapPenalty(0.5)
              .withFalseStartTimePenalty(2.0)
              .build();

      com.antigravity.race.Race fsRace =
          new com.antigravity.race.Race.Builder()
              .model(falseStartModel)
              .track(race.getTrack())
              .drivers(race.getDrivers())
              .isDemoMode(true)
              .build();
      ClientSubscriptionManager.getInstance().setRace(fsRace);

      Starting st = new Starting();
      fsRace.changeState(st);
      boolean handled = st.onLap(0, 0.5, 1, false);

      assertTrue("onLap should return true for false start", handled);
      assertTrue(fsRace.getState() instanceof Starting);

      DriverHeatData dhd = fsRace.getCurrentHeat().getDrivers().get(0);
      assertEquals(1, dhd.getFalseStarts());
      assertEquals(0.5, dhd.getPenaltyLaps(), 0.001);
      assertEquals(2.0, dhd.getRemainingFalseStartTimePenalty(), 0.001);
      assertFalse("Lane 0 power should be cut immediately on false start", fsRace.isLanePower(0));
      fsRace.stop();
    }

    @Test
    public void testStartingFalseStartCutsLanePowerImmediatelyInHotStart() {
      List<Lane> twoLanes = new ArrayList<>();
      twoLanes.add(new Lane("red", "black", 100));
      twoLanes.add(new Lane("blue", "black", 100));
      Track twoLaneTrack =
          new Track.Builder()
              .name("Test Track")
              .lanes(twoLanes)
              .arduinoConfigs(Collections.singletonList(mock(ArduinoConfig.class)))
              .entityId("track1")
              .id("1")
              .build();

      List<RaceParticipant> twoDrivers = new ArrayList<>();
      twoDrivers.add(new RaceParticipant(new Driver("Driver 1", "D1", "d1", "1"), "p1"));
      twoDrivers.add(new RaceParticipant(new Driver("Driver 2", "D2", "d2", "2"), "p2"));

      Race falseStartModel =
          new Race.Builder()
              .from(race.getRaceModel())
              .withHotStart(true)
              .withRestartOnFalseStart(false)
              .withFalseStartLapPenalty(0.5)
              .withFalseStartTimePenalty(2.0)
              .build();

      com.antigravity.race.Race fsRace =
          new com.antigravity.race.Race.Builder()
              .model(falseStartModel)
              .track(twoLaneTrack)
              .drivers(twoDrivers)
              .isDemoMode(true)
              .build();
      ClientSubscriptionManager.getInstance().setRace(fsRace);

      Starting st = new Starting();
      fsRace.changeState(st);
      assertTrue("Hot start should enable main power", fsRace.isMainPower());
      assertTrue("Lane 0 should initially be ON", fsRace.isLanePower(0));
      assertTrue("Lane 1 should initially be ON", fsRace.isLanePower(1));

      boolean handled = st.onLap(0, 0.5, 1, false);

      assertTrue("onLap should return true for false start", handled);
      assertTrue(fsRace.getState() instanceof Starting);
      assertFalse(
          "Lane 0 power should be OFF immediately after false start", fsRace.isLanePower(0));
      assertTrue("Lane 1 power should remain ON", fsRace.isLanePower(1));

      DriverHeatData dhd = fsRace.getCurrentHeat().getDrivers().get(0);
      assertEquals(1, dhd.getFalseStarts());
      assertEquals(2.0, dhd.getRemainingFalseStartTimePenalty(), 0.001);
      fsRace.stop();
    }

    @Test
    public void testStartingFalseStartZeroTimePenaltyRestoresAtGreen() {
      Race falseStartModel =
          new Race.Builder()
              .from(race.getRaceModel())
              .withHotStart(true)
              .withRestartOnFalseStart(false)
              .withFalseStartLapPenalty(1.0)
              .withFalseStartTimePenalty(0.0)
              .build();

      com.antigravity.race.Race fsRace =
          new com.antigravity.race.Race.Builder()
              .model(falseStartModel)
              .track(race.getTrack())
              .drivers(race.getDrivers())
              .isDemoMode(true)
              .build();
      ClientSubscriptionManager.getInstance().setRace(fsRace);

      Starting st = new Starting();
      fsRace.changeState(st);
      assertTrue(fsRace.isLanePower(0));

      // False start on lane 0 during starting
      st.onLap(0, 0.5, 1, false);
      assertFalse("Lane 0 power should be cut immediately", fsRace.isLanePower(0));

      // Transition to Racing (Go / Green)
      Racing racing = new Racing();
      fsRace.changeState(racing);
      assertTrue(
          "Lane 0 power should be restored at Green when time penalty is 0", fsRace.isLanePower(0));
      fsRace.stop();
    }

    @Test
    public void testStartingFalseStartTimePenaltyCountdownStartsAtGreen() {
      Race falseStartModel =
          new Race.Builder()
              .from(race.getRaceModel())
              .withHotStart(true)
              .withRestartOnFalseStart(false)
              .withFalseStartTimePenalty(0.2)
              .build();

      com.antigravity.race.Race fsRace =
          new com.antigravity.race.Race.Builder()
              .model(falseStartModel)
              .track(race.getTrack())
              .drivers(race.getDrivers())
              .isDemoMode(true)
              .build();
      ClientSubscriptionManager.getInstance().setRace(fsRace);

      Starting st = new Starting();
      fsRace.changeState(st);
      assertTrue(fsRace.isLanePower(0));

      // False start on lane 0
      st.onLap(0, 0.5, 1, false);
      assertFalse("Lane 0 power should be cut immediately", fsRace.isLanePower(0));

      DriverHeatData dhd = fsRace.getCurrentHeat().getDrivers().get(0);
      assertEquals(0.2, dhd.getRemainingFalseStartTimePenalty(), 0.001);

      // Transition to Racing (Go / Green)
      Racing racing = new Racing();
      fsRace.changeState(racing);
      assertFalse(
          "Lane 0 power should stay OFF at Green while penalty is active", fsRace.isLanePower(0));

      // Wait for penalty to expire
      long start = System.currentTimeMillis();
      while ((dhd.getRemainingFalseStartTimePenalty() > 0 || !fsRace.isLanePower(0))
          && (System.currentTimeMillis() - start) < 5000) {
        try {
          Thread.sleep(50);
        } catch (InterruptedException e) {
          Thread.currentThread().interrupt();
        }
      }

      assertTrue("Lane 0 power should turn back ON after penalty expires", fsRace.isLanePower(0));
      fsRace.stop();
    }

    @Test
    public void testGetFlagType() {
      race.setHasRacedInCurrentHeat(false);
      race.changeState(starting);
      assertEquals(RaceFlag.RED, starting.getFlagType(race));

      race.setHasRacedInCurrentHeat(true);
      race.changeState(starting);
      assertEquals(RaceFlag.YELLOW, starting.getFlagType(race));
    }

    @Test
    public void testExitDoesNotInterruptTickerThread() throws InterruptedException {
      Starting testStarting = new Starting();
      com.antigravity.race.Race mockRace = mock(com.antigravity.race.Race.class);
      when(mockRace.getRaceModel()).thenReturn(new Race.Builder().withStartTime(0.1).build());
      when(mockRace.hasRacedInCurrentHeat()).thenReturn(false);

      AtomicBoolean wasInterrupted = new AtomicBoolean(false);
      CountDownLatch latch = new CountDownLatch(1);

      doAnswer(
              invocation -> {
                testStarting.exit(mockRace);
                wasInterrupted.set(Thread.currentThread().isInterrupted());
                latch.countDown();
                return null;
              })
          .when(mockRace)
          .changeState(any(Racing.class));

      testStarting.enter(mockRace);

      assertTrue("Timer should have triggered transition", latch.await(2, TimeUnit.SECONDS));
      assertFalse("Ticker thread should not be interrupted by exit()", wasInterrupted.get());
    }

    @Test
    public void testStartingWithZeroStartTimeTransitionsImmediately() throws InterruptedException {
      Race zeroStartTimeModel =
          new Race.Builder().from(race.getRaceModel()).withStartTime(0.0).build();

      com.antigravity.race.Race zeroRace =
          new com.antigravity.race.Race.Builder()
              .model(zeroStartTimeModel)
              .track(race.getTrack())
              .drivers(race.getDrivers())
              .isDemoMode(true)
              .build();
      ClientSubscriptionManager.getInstance().setRace(zeroRace);

      zeroRace.setHasRacedInCurrentHeat(false);
      long start = System.currentTimeMillis();
      zeroRace.changeState(new Starting());

      long deadline = System.currentTimeMillis() + 3000;
      while (!(zeroRace.getState() instanceof Racing) && System.currentTimeMillis() < deadline) {
        Thread.sleep(50);
      }

      assertTrue(zeroRace.getState() instanceof Racing);
      long duration = System.currentTimeMillis() - start;
      assertTrue("Duration should be fast (< 500ms), was " + duration, duration < 500);
    }

    @Test
    public void testStartingWithZeroRestartTimeTransitionsImmediately()
        throws InterruptedException {
      Race zeroRestartTimeModel =
          new Race.Builder().from(race.getRaceModel()).withRestartTime(0.0).build();

      com.antigravity.race.Race zeroRace =
          new com.antigravity.race.Race.Builder()
              .model(zeroRestartTimeModel)
              .track(race.getTrack())
              .drivers(race.getDrivers())
              .isDemoMode(true)
              .build();
      ClientSubscriptionManager.getInstance().setRace(zeroRace);

      zeroRace.setHasRacedInCurrentHeat(true);
      long start = System.currentTimeMillis();
      zeroRace.changeState(new Starting());

      long deadline = System.currentTimeMillis() + 3000;
      while (!(zeroRace.getState() instanceof Racing) && System.currentTimeMillis() < deadline) {
        Thread.sleep(50);
      }

      assertTrue(zeroRace.getState() instanceof Racing);
      long duration = System.currentTimeMillis() - start;
      assertTrue("Duration should be fast (< 500ms), was " + duration, duration < 500);
    }

    @Test
    public void testStartAtCurrent_CarryOverTime() {
      HeatScoring heatScoring =
          new HeatScoring(
              HeatScoring.FinishMethod.Lap,
              3L,
              HeatScoring.HeatRanking.LAP_COUNT,
              HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
              HeatScoring.AllowFinish.None);

      Race startAtCurrModel =
          new Race.Builder()
              .withName("Test Race")
              .withTrackEntityId("track1")
              .withHeatRotationType(HeatRotationType.RoundRobin)
              .withHeatScoring(heatScoring)
              .withOverallScoring(new OverallScoring())
              .withStartAtCurrent(true)
              .withStartBehindSensor(true)
              .withEntityId("race1")
              .build();

      List<RaceParticipant> twoDrivers = new ArrayList<>();
      twoDrivers.add(new RaceParticipant(new Driver("Driver 1", "D1", "d1", "1"), "p1"));
      twoDrivers.add(new RaceParticipant(new Driver("Driver 2", "D2", "d2", "1"), "p2"));

      List<Lane> twoLanes = new ArrayList<>();
      twoLanes.add(new Lane("red", "black", 100));
      twoLanes.add(new Lane("blue", "black", 100));
      Track twoLaneTrack =
          new Track.Builder()
              .name("Test Track")
              .lanes(twoLanes)
              .arduinoConfigs(Collections.singletonList(mock(ArduinoConfig.class)))
              .entityId("track1")
              .id("1")
              .build();

      com.antigravity.race.Race currRace =
          new com.antigravity.race.Race.Builder()
              .model(startAtCurrModel)
              .drivers(twoDrivers)
              .track(twoLaneTrack)
              .isDemoMode(true)
              .demoConfig(
                  com.antigravity.proto.DemoConfig.newBuilder()
                      .setMinReactionTimeMs(3600000)
                      .setMaxReactionTimeMs(3600000)
                      .setMinLapTimeMs(3600000)
                      .setMaxLapTimeMs(3600000)
                      .build())
              .build();

      currRace.setCurrentHeat(currRace.getHeats().get(0));
      currRace.prepareHeat();
      currRace.changeState(new Racing());
      HeatExecutionManager executionManager = currRace.getHeatExecutionManager();

      DriverHeatData dhdHeat0_L0 = currRace.getCurrentHeat().getDrivers().get(0);
      String driverId = dhdHeat0_L0.getDriver().getStableId();

      executionManager.onLap(0, 1.0, 1, false, false, false);
      executionManager.processTicker(4.5f);
      assertEquals(4.5, executionManager.getTimeSinceLastLap()[0], 0.001);

      currRace.changeState(new HeatOver());
      assertEquals(4.5, dhdHeat0_L0.getCarryOverTime(), 0.001);

      currRace.setCurrentHeat(currRace.getHeats().get(1));
      currRace.prepareHeat();
      currRace.changeState(new Racing());
      executionManager = currRace.getHeatExecutionManager();

      int driverLaneInHeat1 = -1;
      DriverHeatData dhdHeat1_L = null;
      for (int i = 0; i < currRace.getCurrentHeat().getDrivers().size(); i++) {
        DriverHeatData dhd = currRace.getCurrentHeat().getDrivers().get(i);
        if (dhd != null
            && dhd.getDriver() != null
            && dhd.getDriver().getStableId().equals(driverId)) {
          driverLaneInHeat1 = i;
          dhdHeat1_L = dhd;
          break;
        }
      }

      assertTrue(driverLaneInHeat1 != -1);
      assertEquals(4.5, dhdHeat1_L.getPendingLapTime(), 0.001);
      assertEquals(4.5, executionManager.getTimeSinceLastLap()[driverLaneInHeat1], 0.001);

      executionManager.onLap(driverLaneInHeat1, 1.5, 1, false, false, false);
      assertEquals(1, dhdHeat1_L.getLapCount());
      assertEquals(6.0, dhdHeat1_L.getLaps().get(0).getLapTime(), 0.001);
    }

    @Test
    public void testRaceStateTransitionsAndBroadcast() throws Exception {
      refreshSession();
      race.startRace();
      verifyBroadcast(RaceState.STARTING);

      refreshSession();
      race.changeState(new Racing());
      verifyBroadcast(RaceState.RACING);

      refreshSession();
      race.pauseRace();
      verifyBroadcast(RaceState.PAUSED);

      refreshSession();
      race.startRace();
      verifyBroadcast(RaceState.STARTING);

      refreshSession();
      race.changeState(new HeatOver());
      verifyBroadcast(RaceState.HEAT_OVER);

      refreshSession();
      race.changeState(new RaceOver());
      verifyBroadcast(RaceState.RACE_OVER);
    }

    @Test
    public void testHeatOverBroadcastsFullSnapshot() throws Exception {
      refreshSession();
      race.changeState(new HeatOver());
      verifyFullSnapshotBroadcast(RaceState.HEAT_OVER);
    }

    @Test
    public void testRaceOverBroadcastsFullSnapshot() throws Exception {
      refreshSession();
      race.changeState(new RaceOver());
      verifyFullSnapshotBroadcast(RaceState.RACE_OVER);
    }

    @Test
    public void testRestartHeatFromPaused() throws Exception {
      race.startRace();
      race.changeState(new Racing());
      race.pauseRace();

      refreshSession();
      race.restartHeat();
      verifyBroadcast(RaceState.NOT_STARTED);
    }

    @Test
    public void testRestartHeatResetsOverallStandings() throws Exception {
      race.startRace();
      race.changeState(new Racing());

      race.onLap(0, 1.0, 1, 0);
      race.onLap(0, 5.0, 1, 0);

      assertEquals(1.0, race.getDrivers().get(0).getTotalLaps(), 0.001);

      race.pauseRace();
      race.restartHeat();

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
      List<Heat> heats = race.getHeats();
      Heat h2 = mock(Heat.class);
      when(h2.getDrivers()).thenReturn(new ArrayList<>());
      when(h2.getActiveDriverCount()).thenReturn(1);
      when(h2.getHeatStandings()).thenReturn(mock(HeatStandings.class));
      heats.add(h2);

      assertTrue(race.getState() instanceof NotStarted);

      refreshSession();
      race.skipHeat();

      verifyBroadcast(RaceState.NOT_STARTED);
      assertTrue(race.getState() instanceof NotStarted);
      assertEquals(h2, race.getCurrentHeat());
    }

    @Test
    public void testOnCallbuttonTransitions() throws Exception {
      assertTrue(race.getState() instanceof NotStarted);

      race.onCallbutton(0, 0);
      assertTrue(race.getState() instanceof Starting);

      race.onCallbutton(0, 0);
      assertTrue(race.getState() instanceof NotStarted);

      race.changeState(new Racing());
      assertTrue(race.getState() instanceof Racing);

      race.onCallbutton(0, 0);
      assertTrue(race.getState() instanceof Paused);

      race.onCallbutton(0, 0);
      assertTrue(race.getState() instanceof Starting);

      race.changeState(new HeatOver());
      assertTrue(race.getState() instanceof HeatOver);

      race.onCallbutton(0, 0);
      assertTrue(race.getState() instanceof RaceOver);

      race.onCallbutton(0, 0);
      assertTrue(race.getState() instanceof RaceOver);
    }

    @Test
    public void testOnCallbuttonAbortsAutoAdvance() throws Exception {
      race.changeState(new HeatOver());
      race.setAutoAdvanceRemaining(10.0);
      race.addRaceTime(12.3f);
      assertTrue(race.getState() instanceof HeatOver);

      race.onCallbutton(0, 0);

      assertEquals(0.0, race.getAutoAdvanceRemaining(), 0.001);
      assertEquals(0.0, race.getRaceTime(), 0.001);
      assertTrue(race.getState() instanceof HeatOver);
    }

    @Test
    public void testPauseDuringAutoStartCancelsTimer() throws Exception {
      race.setAutoStartRemaining(10.0);
      race.addRaceTime(5.5f);
      assertTrue(race.getState() instanceof NotStarted);

      refreshSession();
      race.pauseRace();

      assertEquals(0.0, race.getAutoStartRemaining(), 0.001);
      assertEquals(0.0, race.getRaceTime(), 0.001);
      assertTrue(race.getState() instanceof NotStarted);
    }

    @Test
    public void testAutoStartRunsOnFirstHeat() throws Exception {
      injectAutoStartTime(10.0);
      race.changeState(new Paused());
      race.changeState(new NotStarted());
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
      assertTrue(snapshot.hasRecordData());
    }

    @Test
    public void testFalseStartWithRestartOnFalseStartEnabled() throws Exception {
      com.antigravity.models.Race model =
          new com.antigravity.models.Race.Builder()
              .withName("False Start Race")
              .withTrackEntityId("track1")
              .withRestartOnFalseStart(true)
              .withFalseStartLapPenalty(1.0)
              .withFalseStartTimePenalty(3.0)
              .withEntityId("race_fs")
              .withId("race_fs_id")
              .build();

      DriverHeatData dhd = race.getCurrentHeat().getDrivers().get(0);
      assertEquals(0, dhd.getFalseStarts());

      java.lang.reflect.Field modelField =
          com.antigravity.race.Race.class.getDeclaredField("model");
      modelField.setAccessible(true);
      modelField.set(race, model);

      race.startRace();
      assertTrue(race.getState() instanceof Starting);

      // Trigger false start on lane 0
      race.onLap(0, 1.0, 1, 0);

      assertEquals(1, dhd.getFalseStarts());
      assertEquals(3.0, dhd.getRemainingFalseStartTimePenalty(), 0.001);
      assertTrue(
          "Should reset to NotStarted because restart on false start is enabled",
          race.getState() instanceof NotStarted);
    }

    @Test
    public void testAutoStartRunsOnSecondHeat() throws Exception {
      injectAutoStartTime(10.0);

      List<Heat> heats = race.getHeats();
      Heat h2 = mock(Heat.class);
      when(h2.getDrivers()).thenReturn(new ArrayList<>());
      when(h2.getActiveDriverCount()).thenReturn(1);
      when(h2.getHeatStandings()).thenReturn(mock(HeatStandings.class));
      heats.add(h2);

      race.setCurrentHeat(h2);
      race.changeState(new Paused());
      race.changeState(new NotStarted());

      assertEquals(10.0, race.getAutoStartRemaining(), 0.001);
    }

    @Test
    public void testPauseDuringAutoAdvanceCancelsTimer() throws Exception {
      race.changeState(new HeatOver());
      race.setAutoAdvanceRemaining(10.0);
      assertTrue(race.getState() instanceof HeatOver);

      refreshSession();
      race.pauseRace();

      assertEquals(0.0, race.getAutoAdvanceRemaining(), 0.001);
      assertTrue(race.getState() instanceof HeatOver);
    }

    @Test
    public void testDriftLapCountingDuringPause() throws Exception {
      injectDriftTime(2.0);

      race.startRace();
      race.changeState(new Racing());

      race.onLap(0, 1.0, 1, 0);
      assertEquals(0, race.getCurrentHeat().getDrivers().get(0).getLapCount());

      race.pauseRace();
      assertTrue(race.getState() instanceof Paused);

      race.onLap(0, 5.0, 1, 0);
      assertEquals(1, race.getCurrentHeat().getDrivers().get(0).getLapCount());
      assertTrue(race.getCurrentHeat().getDrivers().get(0).getLaps().get(0).isDrift());
    }

    @Test
    public void testLapIgnoredAfterDriftTime() throws Exception {
      injectDriftTime(0.1);

      race.startRace();
      race.changeState(new Racing());

      race.onLap(0, 1.0, 1, 0);
      race.pauseRace();

      Thread.sleep(200);

      race.onLap(0, 5.0, 1, 0);
      assertEquals(0, race.getCurrentHeat().getDrivers().get(0).getLapCount());
    }

    private void injectDriftTime(double driftTime) throws Exception {
      Field modelField = com.antigravity.race.Race.class.getDeclaredField("model");
      modelField.setAccessible(true);
      Race oldModel = (Race) modelField.get(race);
      Race newModel = new Race.Builder().from(oldModel).withDriftTime(driftTime).build();
      modelField.set(race, newModel);
    }

    private void injectAutoStartTime(double autoStartTime) throws Exception {
      Field modelField = com.antigravity.race.Race.class.getDeclaredField("model");
      modelField.setAccessible(true);
      Race oldModel = (Race) modelField.get(race);
      Race newModel = new Race.Builder().from(oldModel).withAutoStartTime(autoStartTime).build();
      modelField.set(race, newModel);
    }

    @Test
    public void testRaceOver_CheckeredFlagWhenLastHeatAndAllowFinishNone() {
      RaceOver raceOver = new RaceOver();
      com.antigravity.race.Race mockRace = mock(com.antigravity.race.Race.class);
      Race mockModel = mock(Race.class);
      when(mockRace.getRaceModel()).thenReturn(mockModel);

      HeatScoring mockHeatScoring = mock(HeatScoring.class);
      when(mockHeatScoring.getAllowFinish()).thenReturn(HeatScoring.AllowFinish.None);
      when(mockModel.getHeatScoring()).thenReturn(mockHeatScoring);
      when(mockRace.isLastHeat()).thenReturn(true);

      RaceFlag flag = raceOver.getFlagType(mockRace);
      assertTrue(flag == RaceFlag.CHECKERED);
    }

    @Test
    public void testRaceOver_RedFlagWhenNotLastHeat() {
      RaceOver raceOver = new RaceOver();
      com.antigravity.race.Race mockRace = mock(com.antigravity.race.Race.class);
      Race mockModel = mock(Race.class);
      when(mockRace.getRaceModel()).thenReturn(mockModel);

      HeatScoring mockHeatScoring = mock(HeatScoring.class);
      when(mockHeatScoring.getAllowFinish()).thenReturn(HeatScoring.AllowFinish.None);
      when(mockModel.getHeatScoring()).thenReturn(mockHeatScoring);
      when(mockRace.isLastHeat()).thenReturn(false);

      RaceFlag flag = raceOver.getFlagType(mockRace);
      assertTrue(flag == RaceFlag.RED);
    }

    @Test
    public void testRaceOver_RedFlagWhenAllowFinishEnabled() {
      RaceOver raceOver = new RaceOver();
      com.antigravity.race.Race mockRace = mock(com.antigravity.race.Race.class);
      Race mockModel = mock(Race.class);
      when(mockRace.getRaceModel()).thenReturn(mockModel);

      HeatScoring mockHeatScoring = mock(HeatScoring.class);
      when(mockHeatScoring.getAllowFinish()).thenReturn(HeatScoring.AllowFinish.Allow);
      when(mockModel.getHeatScoring()).thenReturn(mockHeatScoring);
      when(mockRace.isLastHeat()).thenReturn(true);

      RaceFlag flag = raceOver.getFlagType(mockRace);
      assertTrue(flag == RaceFlag.RED);
    }

    @Test
    public void testChangeStateUpdatesDriverFlags() {
      race.addRaceTime(100.0f);
      race.changeState(new Racing());

      assertEquals(1, race.getCurrentHeat().getDrivers().size());
      assertEquals(RaceFlag.GREEN, race.getState().getFlagType(race));
      assertEquals(RaceFlag.GREEN, race.getCurrentHeat().getDrivers().get(0).getFlag());
      assertFalse(race.getCurrentHeat().getDrivers().get(0).isFinished());

      race.changeState(new HeatOver());
      assertEquals(RaceFlag.RED, race.getState().getFlagType(race));
      assertEquals(RaceFlag.RED, race.getCurrentHeat().getDrivers().get(0).getFlag());
      assertTrue(race.getCurrentHeat().getDrivers().get(0).isFinished());
    }

    @Test
    public void testTimedRaceDriversFinishedFlagsOnHeatOverAndRaceOver() {
      // Set timed scoring with AllowFinish.None
      HeatScoring scoring =
          new HeatScoring(
              HeatScoring.FinishMethod.Timed,
              60,
              HeatScoring.HeatRanking.LAP_COUNT,
              HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
              HeatScoring.AllowFinish.None);
      com.antigravity.models.Race model =
          new com.antigravity.models.Race.Builder()
              .from(race.getRaceModel())
              .withHeatScoring(scoring)
              .build();
      race.setRaceModel(model);

      // Add custom slot in theme for flag.driver_finished to be CHECKERED
      java.util.Map<String, String> slots = new java.util.HashMap<>();
      if (race.getTheme() != null && race.getTheme().getSlots() != null) {
        slots.putAll(race.getTheme().getSlots());
      }
      slots.put("flag.driver_finished", "custom_checkered_flag");
      Theme customTheme =
          new Theme(
              "Custom", false, slots, new java.util.HashMap<>(), "custom_theme", "custom_theme");
      race.setTheme(customTheme);

      race.addRaceTime(60.0f);
      race.changeState(new Racing());

      DriverHeatData dhd = race.getCurrentHeat().getDrivers().get(0);
      assertFalse(dhd.isFinished());
      assertEquals(RaceFlag.GREEN, dhd.getFlag());

      // Transition to HeatOver (time expired or heat finished)
      race.changeState(new HeatOver());
      assertTrue(dhd.isFinished());
      assertEquals(RaceFlag.CHECKERED, dhd.getFlag());

      // Transition to RaceOver
      race.changeState(new RaceOver());
      assertTrue(dhd.isFinished());
      assertEquals(RaceFlag.CHECKERED, dhd.getFlag());
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
      race.skipRace();
    }

    @Test
    public void testSkipRaceWithMultipleHeatsRemaining() throws Exception {
      List<Heat> heats = race.getHeats();
      Heat h2 = mock(Heat.class);
      when(h2.getDrivers()).thenReturn(new ArrayList<>());
      when(h2.getActiveDriverCount()).thenReturn(1);
      when(h2.getHeatStandings()).thenReturn(mock(HeatStandings.class));
      heats.add(h2);

      assertTrue(race.getState() instanceof NotStarted);

      refreshSession();
      race.skipRace();

      verifyBroadcast(RaceState.RACE_OVER);
      assertTrue(race.getState() instanceof RaceOver);
    }

    @Test
    public void testSetCurrentHeatBroadcastsGroupStandings() throws Exception {
      Field modelField = com.antigravity.race.Race.class.getDeclaredField("model");
      modelField.setAccessible(true);
      Race oldModel = (Race) modelField.get(race);
      Race newModel =
          new Race.Builder()
              .from(oldModel)
              .withGroupOptions(
                  new com.antigravity.models.GroupOptions(true, 2, false, true, false, true, 0))
              .build();
      modelField.set(race, newModel);

      List<Heat> heats = race.getHeats();
      Heat h2 = mock(Heat.class);
      when(h2.getDrivers()).thenReturn(new ArrayList<>());
      when(h2.getActiveDriverCount()).thenReturn(1);
      when(h2.getHeatStandings()).thenReturn(mock(HeatStandings.class));
      when(h2.getGroup()).thenReturn(1);
      heats.add(h2);

      refreshSession();
      race.setCurrentHeat(h2);

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
        } catch (Exception ignored) {
        }
      }
      assertTrue("Should have broadcast GroupStandingsUpdate with group = 1", foundGroupUpdate);
    }

    @Test
    public void testBroadcastFlagUpdatesProtocols() throws Exception {
      ProtocolDelegate protocols = mock(ProtocolDelegate.class);
      race.injectProtocols(protocols);

      assertTrue(race.getState() instanceof NotStarted);
      race.broadcastFlag(RaceFlag.WHITE);

      verify(protocols).setRaceState(eq(RaceState.NOT_STARTED), eq(RaceFlag.WHITE), anyDouble());
    }

    @Test
    public void testHeatOverExitDoesNotInterruptTickerThread() throws InterruptedException {
      HeatOver heatOver = new HeatOver();
      com.antigravity.race.Race mockRace = mock(com.antigravity.race.Race.class);
      Race mockModel = mock(Race.class);
      when(mockRace.getRaceModel()).thenReturn(mockModel);
      when(mockModel.getAutoAdvanceTime()).thenReturn(0.1);

      AtomicBoolean wasInterrupted = new AtomicBoolean(false);
      CountDownLatch latch = new CountDownLatch(1);

      doAnswer(
              invocation -> {
                heatOver.exit(mockRace);
                wasInterrupted.set(Thread.currentThread().isInterrupted());
                latch.countDown();
                return null;
              })
          .when(mockRace)
          .broadcastTime();

      heatOver.enter(mockRace);

      assertTrue("Timer should have triggered broadcastTime", latch.await(2, TimeUnit.SECONDS));
      assertFalse("Ticker thread should not be interrupted by exit()", wasInterrupted.get());
    }

    @Test
    public void testImmediateCleanupWhenDirectorExplicitlyUnsubscribes() throws Exception {
      ClientSubscriptionManager mgr = ClientSubscriptionManager.getInstance();

      Session mockSession1 = mock(Session.class);
      Session mockSession2 = mock(Session.class);
      when(mockSession1.isOpen()).thenReturn(true);
      when(mockSession1.getRemote()).thenReturn(mock(RemoteEndpoint.class));
      when(mockSession2.isOpen()).thenReturn(true);
      when(mockSession2.getRemote()).thenReturn(mock(RemoteEndpoint.class));

      java.net.InetSocketAddress localhostAddr = new java.net.InetSocketAddress("127.0.0.1", 8080);
      when(mockSession1.getRemoteAddress()).thenReturn(localhostAddr);
      when(mockSession2.getRemoteAddress()).thenReturn(localhostAddr);

      WsContext ctx1 = new WsContext("s1", mockSession1) {};
      WsContext ctx2 = new WsContext("s2", mockSession2) {};

      mgr.addSession(ctx1);
      mgr.addSession(ctx2);
      mgr.handleRaceSubscription(
          ctx1, RaceSubscriptionRequest.newBuilder().setSubscribe(true).build());
      mgr.handleRaceSubscription(
          ctx2, RaceSubscriptionRequest.newBuilder().setSubscribe(true).build());

      mgr.handleRaceSubscription(
          ctx1, RaceSubscriptionRequest.newBuilder().setSubscribe(false).build());
      mgr.removeSession(ctx2);

      assertNull("Race should be cleaned up immediately", mgr.getRace());
      mgr.removeSession(ctx1);
    }
  }

  // =========================================================================
  // 3. Racing and Lap Tracking
  // =========================================================================
  public static class RacingAndLapTracking {
    private com.antigravity.race.Race race;
    private HeatScoring heatScoring;
    private List<RaceParticipant> participants;
    private Track track;

    @Before
    public void setUp() {
      heatScoring =
          new HeatScoring(
              HeatScoring.FinishMethod.Lap,
              3L,
              HeatScoring.HeatRanking.LAP_COUNT,
              HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
              HeatScoring.AllowFinish.None);

      OverallScoring overallScoring =
          new OverallScoring(
              0,
              OverallScoring.OverallRanking.LAP_COUNT,
              OverallScoring.OverallRankingTiebreaker.FASTEST_LAP_TIME);

      Race raceModel =
          new Race.Builder()
              .withName("Test Race")
              .withTrackEntityId("track1")
              .withHeatRotationType(HeatRotationType.RoundRobin)
              .withHeatScoring(heatScoring)
              .withOverallScoring(overallScoring)
              .withEntityId("race1")
              .withId("1")
              .build();

      participants = new ArrayList<>();
      participants.add(new RaceParticipant(new Driver("Driver 1", "D1", "d1", "1"), "p1"));
      participants.add(new RaceParticipant(new Driver("Driver 2", "D2", "d2", "1"), "p2"));

      List<Lane> lanes = new ArrayList<>();
      lanes.add(new Lane("red", "black", 100));
      lanes.add(new Lane("blue", "black", 100));
      track =
          new Track.Builder()
              .name("Test Track")
              .lanes(lanes)
              .arduinoConfigs(Collections.singletonList(mock(ArduinoConfig.class)))
              .entityId("track1")
              .id("1")
              .build();

      race =
          new com.antigravity.race.Race.Builder()
              .model(raceModel)
              .drivers(participants)
              .track(track)
              .isDemoMode(true)
              .build();
    }

    @After
    public void tearDown() {
      if (race != null && race.getState() != null) {
        try {
          race.getState().exit(race);
        } catch (Exception ignored) {
        }
      }
    }

    @Test
    public void testRacingDelegation_EndsHeatOnLaps() {
      Racing racing = new Racing();
      race.changeState(racing);

      racing.onLap(0, 1.0, 1, false);
      racing.onLap(0, 5.0, 1, false);
      racing.onLap(0, 5.0, 1, false);
      racing.onLap(0, 5.0, 1, false);
      assertTrue(race.getState() instanceof HeatOver);
    }

    @Test
    public void testTimedRace_NoAllowFinish_EndsOnTime() throws InterruptedException {
      heatScoring =
          new HeatScoring(
              HeatScoring.FinishMethod.Timed,
              1L,
              HeatScoring.HeatRanking.LAP_COUNT,
              HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
              HeatScoring.AllowFinish.None);

      race =
          new com.antigravity.race.Race.Builder()
              .model(
                  new Race.Builder()
                      .withName("Test Race")
                      .withTrackEntityId("track1")
                      .withHeatScoring(heatScoring)
                      .withOverallScoring(race.getRaceModel().getOverallScoring())
                      .withEntityId("race1")
                      .build())
              .drivers(participants)
              .track(track)
              .isDemoMode(true)
              .build();

      Racing racing = new Racing();
      race.changeState(racing);

      Thread.sleep(1500);

      assertTrue(
          "Expected state to be HeatOver or RaceOver, but was: "
              + race.getState().getClass().getSimpleName(),
          race.getState() instanceof HeatOver || race.getState() instanceof RaceOver);
    }

    @Test
    public void testPerLanePowerOffOnFinish() {
      Racing racing = new Racing();
      com.antigravity.race.Race mockRace = mock(com.antigravity.race.Race.class);
      Race mockModel = mock(Race.class);
      HeatScoring allowFinishScoring =
          new HeatScoring(
              HeatScoring.FinishMethod.Lap,
              3L,
              HeatScoring.HeatRanking.LAP_COUNT,
              HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
              HeatScoring.AllowFinish.Allow);

      when(mockRace.getRaceModel()).thenReturn(mockModel);
      when(mockModel.getHeatScoring()).thenReturn(allowFinishScoring);
      when(mockRace.getStatistics()).thenReturn(new RaceStatistics());
      when(mockRace.getState()).thenReturn(racing);
      Track mockTrack = mock(Track.class);
      when(mockRace.getTrack()).thenReturn(mockTrack);

      Heat mockHeat = mock(Heat.class);
      when(mockRace.getCurrentHeat()).thenReturn(mockHeat);
      when(mockHeat.getStatistics()).thenReturn(new RaceHeatStatistics());
      HeatStandings mockStandings = mock(HeatStandings.class);
      when(mockHeat.getHeatStandings()).thenReturn(mockStandings);

      HeatExecutionManager realManager = new HeatExecutionManager(mockRace);
      realManager.initialize(2);
      when(mockRace.getHeatExecutionManager()).thenReturn(realManager);

      List<DriverHeatData> drivers = new ArrayList<>();
      drivers.add(new DriverHeatData(participants.get(0)));
      drivers.add(new DriverHeatData(participants.get(1)));
      when(mockHeat.getDrivers()).thenReturn(drivers);
      when(mockHeat.getActiveDriverCount()).thenReturn(2);

      racing.enter(mockRace);

      racing.onLap(0, 1.0, 1, false);
      racing.onLap(0, 5.0, 1, false);
      racing.onLap(0, 5.0, 1, false);
      racing.onLap(0, 5.0, 1, false);

      verify(mockRace).setLanePower(false, 0);
    }

    @Test
    public void testOnCarData_BroadcastsRefuelingState() {
      Racing racing = new Racing();
      race.changeState(racing);

      race.getHeatExecutionManager().getIsRefueling()[0] = true;
      CarData carData =
          new CarData(0, 1.0, 0.5, 0.5, false, CarLocation.PitRow, CarLocation.PitRow, -1);
      racing.onCarData(carData);
    }

    @Test
    public void testRefuelingStateChange_CallsRaceSetRefueling() throws InterruptedException {
      Racing racing = new Racing();
      com.antigravity.race.Race mockRace = mock(com.antigravity.race.Race.class);
      when(mockRace.getStatistics()).thenReturn(new RaceStatistics());
      Race mockModel = mock(Race.class);
      when(mockRace.getRaceModel()).thenReturn(mockModel);
      when(mockModel.getHeatScoring()).thenReturn(new HeatScoring());
      when(mockRace.getState()).thenReturn(racing);

      HeatExecutionManager manager = new HeatExecutionManager(mockRace);
      manager.initialize(2);
      when(mockRace.getHeatExecutionManager()).thenReturn(manager);

      Track mockTrack = mock(Track.class);
      when(mockRace.getTrack()).thenReturn(mockTrack);
      when(mockTrack.getLanes())
          .thenReturn(Arrays.asList(new Lane("red", "black", 100), new Lane("blue", "black", 100)));

      racing.enter(mockRace);
      manager.getIsRefueling()[0] = true;
      Thread.sleep(300);
      verify(mockRace).setRefueling(0, true);

      manager.getIsRefueling()[0] = false;
      Thread.sleep(300);
      verify(mockRace).setRefueling(0, false);

      racing.exit(mockRace);
    }

    @Test
    public void testFuelLevelChange_CallsRaceSetFuelLevel() throws InterruptedException {
      Racing racing = new Racing();
      com.antigravity.race.Race mockRace = mock(com.antigravity.race.Race.class);
      when(mockRace.getStatistics()).thenReturn(new RaceStatistics());
      Race mockModel = mock(Race.class);
      when(mockRace.getRaceModel()).thenReturn(mockModel);
      when(mockModel.getHeatScoring()).thenReturn(new HeatScoring());
      when(mockRace.getState()).thenReturn(racing);

      AnalogFuelOptions fuelOptions =
          new AnalogFuelOptions(
              true,
              false,
              null,
              com.antigravity.models.FuelOptions.OutOfFuelAction.DO_NOT_COUNT_LAPS,
              100.0,
              null,
              4.0,
              100.0,
              10.0,
              2.0,
              6.0);
      when(mockModel.getFuelOptions()).thenReturn(fuelOptions);

      HeatExecutionManager manager = new HeatExecutionManager(mockRace);
      manager.initialize(2);
      when(mockRace.getHeatExecutionManager()).thenReturn(manager);

      Heat mockHeat = mock(Heat.class);
      when(mockRace.getCurrentHeat()).thenReturn(mockHeat);
      when(mockHeat.getStatistics()).thenReturn(new RaceHeatStatistics());

      List<DriverHeatData> drivers = new ArrayList<>();
      drivers.add(new DriverHeatData(participants.get(0)));
      drivers.add(new DriverHeatData(participants.get(1)));
      when(mockHeat.getDrivers()).thenReturn(drivers);

      Track mockTrack = mock(Track.class);
      when(mockRace.getTrack()).thenReturn(mockTrack);
      when(mockTrack.getLanes())
          .thenReturn(Arrays.asList(new Lane("red", "black", 100), new Lane("blue", "black", 100)));
      when(mockTrack.hasDigitalFuel()).thenReturn(false);

      racing.enter(mockRace);
      drivers.get(0).getDriver().setFuelLevel(50.0);
      Thread.sleep(300);
      verify(mockRace).setFuelLevel(0, 50.0, 100.0);

      drivers.get(0).getDriver().setFuelLevel(25.0);
      Thread.sleep(300);
      verify(mockRace).setFuelLevel(0, 25.0, 100.0);

      racing.exit(mockRace);
    }

    @Test
    public void testRacingExitDoesNotInterruptTickerThread() throws InterruptedException {
      Racing racing = new Racing();
      com.antigravity.race.Race mockRace = mock(com.antigravity.race.Race.class);
      when(mockRace.getStatistics()).thenReturn(new RaceStatistics());
      when(mockRace.getRaceModel()).thenReturn(new Race.Builder().build());
      when(mockRace.getState()).thenReturn(racing);
      when(mockRace.getTrack()).thenReturn(mock(Track.class));

      Heat mockHeat = mock(Heat.class);
      when(mockRace.getCurrentHeat()).thenReturn(mockHeat);
      when(mockHeat.getDrivers()).thenReturn(Arrays.asList());
      when(mockHeat.getStatistics()).thenReturn(new RaceHeatStatistics());

      HeatExecutionManager manager = new HeatExecutionManager(mockRace);
      manager.initialize(1);
      when(mockRace.getHeatExecutionManager()).thenReturn(manager);

      AtomicBoolean wasInterrupted = new AtomicBoolean(false);
      CountDownLatch latch = new CountDownLatch(1);

      doAnswer(
              invocation -> {
                racing.exit(mockRace);
                wasInterrupted.set(Thread.currentThread().isInterrupted());
                latch.countDown();
                return null;
              })
          .when(mockRace)
          .broadcastTime();

      racing.enter(mockRace);
      assertTrue("Timer should have triggered broadcastTime", latch.await(2, TimeUnit.SECONDS));
      assertFalse("Ticker thread should not be interrupted by exit()", wasInterrupted.get());
    }

    @Test
    public void testTimedRace_CheckeredFlagAtCounterZero_WithAllowFinish() {
      Racing racing = new Racing();
      com.antigravity.race.Race mockRace = mock(com.antigravity.race.Race.class);
      when(mockRace.getStatistics()).thenReturn(new RaceStatistics());

      Race mockModel = mock(Race.class);
      when(mockRace.getRaceModel()).thenReturn(mockModel);

      HeatScoring scoring =
          new HeatScoring(
              HeatScoring.FinishMethod.Timed,
              60L,
              HeatScoring.HeatRanking.LAP_COUNT,
              HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
              HeatScoring.AllowFinish.Allow);
      when(mockModel.getHeatScoring()).thenReturn(scoring);

      Heat mockHeat = mock(Heat.class);
      when(mockRace.getCurrentHeat()).thenReturn(mockHeat);
      when(mockHeat.getStatistics()).thenReturn(new RaceHeatStatistics());

      DriverHeatData d1 = new DriverHeatData(participants.get(0));
      when(mockHeat.getDrivers()).thenReturn(Collections.singletonList(d1));

      HeatExecutionManager mockExecutionManager = mock(HeatExecutionManager.class);
      when(mockExecutionManager.getFinishedLanes()).thenReturn(new HashSet<>());
      when(mockRace.getHeatExecutionManager()).thenReturn(mockExecutionManager);

      when(mockRace.getRaceTime()).thenReturn(0.0f);
      racing.enter(mockRace);

      RaceFlag flag = racing.getFlagType(mockRace);
      assertTrue(flag == RaceFlag.CHECKERED);
    }

    @Test
    public void testTimedRace_NoCheckeredFlagBeforeCounterZero_WithAllowFinish() {
      Racing racing = new Racing();
      com.antigravity.race.Race mockRace = mock(com.antigravity.race.Race.class);
      when(mockRace.getStatistics()).thenReturn(new RaceStatistics());

      Race mockModel = mock(Race.class);
      when(mockRace.getRaceModel()).thenReturn(mockModel);

      HeatScoring scoring =
          new HeatScoring(
              HeatScoring.FinishMethod.Timed,
              60L,
              HeatScoring.HeatRanking.LAP_COUNT,
              HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
              HeatScoring.AllowFinish.Allow);
      when(mockModel.getHeatScoring()).thenReturn(scoring);

      Heat mockHeat = mock(Heat.class);
      when(mockRace.getCurrentHeat()).thenReturn(mockHeat);
      when(mockHeat.getStatistics()).thenReturn(new RaceHeatStatistics());

      DriverHeatData d1 = new DriverHeatData(participants.get(0));
      when(mockHeat.getDrivers()).thenReturn(Collections.singletonList(d1));

      HeatExecutionManager mockExecutionManager = mock(HeatExecutionManager.class);
      when(mockExecutionManager.getFinishedLanes()).thenReturn(new HashSet<>());
      when(mockRace.getHeatExecutionManager()).thenReturn(mockExecutionManager);

      when(mockRace.getRaceTime()).thenReturn(30.0f);
      racing.enter(mockRace);

      RaceFlag flag = racing.getFlagType(mockRace);
      assertTrue(flag == RaceFlag.GREEN);
    }

    @Test
    public void testTimedRace_NoCheckeredFlagAtCounterZero_WithoutAllowFinish() {
      Racing racing = new Racing();
      com.antigravity.race.Race mockRace = mock(com.antigravity.race.Race.class);
      when(mockRace.getStatistics()).thenReturn(new RaceStatistics());

      Race mockModel = mock(Race.class);
      when(mockRace.getRaceModel()).thenReturn(mockModel);

      HeatScoring scoring =
          new HeatScoring(
              HeatScoring.FinishMethod.Timed,
              60L,
              HeatScoring.HeatRanking.LAP_COUNT,
              HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
              HeatScoring.AllowFinish.None);
      when(mockModel.getHeatScoring()).thenReturn(scoring);

      Heat mockHeat = mock(Heat.class);
      when(mockRace.getCurrentHeat()).thenReturn(mockHeat);
      when(mockHeat.getStatistics()).thenReturn(new RaceHeatStatistics());

      DriverHeatData d1 = new DriverHeatData(participants.get(0));
      when(mockHeat.getDrivers()).thenReturn(Collections.singletonList(d1));

      when(mockRace.getRaceTime()).thenReturn(0.0f);

      RaceFlag flag = racing.getFlagType(mockRace);
      assertTrue(flag == RaceFlag.GREEN);
    }

    @Test
    public void testEnter_TurnsOnMainPower() {
      Racing racing = new Racing();
      com.antigravity.race.Race mockRace = mock(com.antigravity.race.Race.class);
      when(mockRace.getStatistics()).thenReturn(new RaceStatistics());
      Race mockModel = mock(Race.class);
      when(mockRace.getRaceModel()).thenReturn(mockModel);
      when(mockModel.getHeatScoring()).thenReturn(new HeatScoring());
      when(mockRace.getState()).thenReturn(racing);
      when(mockRace.getTrack()).thenReturn(mock(Track.class));

      Heat mockHeat = mock(Heat.class);
      when(mockRace.getCurrentHeat()).thenReturn(mockHeat);
      when(mockHeat.getStatistics()).thenReturn(new RaceHeatStatistics());

      HeatExecutionManager manager = new HeatExecutionManager(mockRace);
      manager.initialize(2);
      when(mockRace.getHeatExecutionManager()).thenReturn(manager);

      racing.enter(mockRace);
      verify(mockRace).broadcastFlag(RaceFlag.GREEN);
    }

    @Test
    public void testFalseStartTimePenaltyProcessing() throws InterruptedException {
      Racing racing = new Racing();
      Race raceModel =
          new Race.Builder().withEntityId("race1").withHeatScoring(new HeatScoring()).build();

      com.antigravity.race.Race realRace =
          new com.antigravity.race.Race.Builder()
              .model(raceModel)
              .track(track)
              .drivers(participants)
              .isDemoMode(true)
              .build();

      DriverHeatData d1 = realRace.getCurrentHeat().getDrivers().get(0);
      d1.setRemainingFalseStartTimePenalty(0.2);

      realRace.changeState(racing);
      assertTrue(!realRace.isLanePower(0));

      long start = System.currentTimeMillis();
      while ((d1.getRemainingFalseStartTimePenalty() > 0 || !realRace.isLanePower(0))
          && (System.currentTimeMillis() - start) < 5000) {
        Thread.sleep(50);
      }

      assertTrue(realRace.isLanePower(0));
      realRace.stop();
    }

    @Test
    public void testLaneFlagDuringPenalty() throws InterruptedException {
      Racing racing = new Racing();
      Race raceModel =
          new Race.Builder().withEntityId("race1").withHeatScoring(new HeatScoring()).build();

      com.antigravity.race.Race realRace =
          new com.antigravity.race.Race.Builder()
              .model(raceModel)
              .track(track)
              .drivers(participants)
              .isDemoMode(true)
              .build();

      DriverHeatData d1 = realRace.getCurrentHeat().getDrivers().get(0);
      d1.setRemainingFalseStartTimePenalty(0.2);

      realRace.changeState(racing);
      racing.enter(realRace);

      assertTrue(racing.getLaneFlagType(realRace, 0) == RaceFlag.BLACK);

      long start = System.currentTimeMillis();
      while (d1.getRemainingFalseStartTimePenalty() > 0
          && (System.currentTimeMillis() - start) < 2000) {
        Thread.sleep(100);
      }

      assertTrue(racing.getLaneFlagType(realRace, 0) == RaceFlag.GREEN);
      realRace.stop();
    }

    @Test
    public void testLaneFlagDuringLowFuel() {
      Racing racing = new Racing();
      AnalogFuelOptions fuelOptions =
          new AnalogFuelOptions(
              true,
              false,
              null,
              com.antigravity.models.FuelOptions.OutOfFuelAction.DO_NOT_COUNT_LAPS,
              100.0,
              null,
              4.0,
              100.0,
              10.0,
              2.0,
              6.0);

      Race raceModel =
          new Race.Builder()
              .withEntityId("race1")
              .withHeatScoring(new HeatScoring())
              .withFuelOptions(fuelOptions)
              .build();

      com.antigravity.race.Race realRace =
          new com.antigravity.race.Race.Builder()
              .model(raceModel)
              .track(track)
              .drivers(participants)
              .isDemoMode(true)
              .build();

      DriverHeatData d1 = realRace.getCurrentHeat().getDrivers().get(0);
      d1.getDriver().setFuelLevel(0.0);

      realRace.changeState(racing);
      assertTrue(racing.getLaneFlagType(realRace, 0) == RaceFlag.BLACK);

      d1.getDriver().setFuelLevel(50.0);
      assertTrue(racing.getLaneFlagType(realRace, 0) == RaceFlag.GREEN);
      realRace.stop();
    }

    @Test
    public void testLapTimesAfterPause() {
      Racing racing = new Racing();
      com.antigravity.race.Race spyRace = spy(race);

      List<com.antigravity.protocols.PartialTime> mockPartials =
          Arrays.asList(
              new com.antigravity.protocols.PartialTime(0, 2.5, 0.0),
              new com.antigravity.protocols.PartialTime(1, 3.1, 0.0));
      doReturn(mockPartials).when(spyRace).stopProtocols();

      spyRace.changeState(racing);
      racing.onLap(0, 1.0, 1, false);
      racing.onLap(1, 1.2, 1, false);

      racing.pause(spyRace);
      assertEquals(2.5, spyRace.getCurrentHeat().getDrivers().get(0).getPendingLapTime(), 0.001);
      assertEquals(3.1, spyRace.getCurrentHeat().getDrivers().get(1).getPendingLapTime(), 0.001);

      spyRace.changeState(racing);
      racing.onLap(0, 1.5, 1, false);
      racing.onLap(1, 2.0, 1, false);

      assertEquals(
          5.0, spyRace.getCurrentHeat().getDrivers().get(0).getLaps().get(0).getLapTime(), 0.001);
      assertEquals(
          6.3, spyRace.getCurrentHeat().getDrivers().get(1).getLaps().get(0).getLapTime(), 0.001);

      assertEquals(0.0, spyRace.getCurrentHeat().getDrivers().get(0).getPendingLapTime(), 0.001);
      assertEquals(0.0, spyRace.getCurrentHeat().getDrivers().get(1).getPendingLapTime(), 0.001);

      racing.onLap(0, 3.0, 1, false);
      racing.onLap(1, 3.5, 1, false);

      assertEquals(
          3.0, spyRace.getCurrentHeat().getDrivers().get(0).getLaps().get(1).getLapTime(), 0.001);
      assertEquals(
          3.5, spyRace.getCurrentHeat().getDrivers().get(1).getLaps().get(1).getLapTime(), 0.001);

      spyRace.stop();
    }

    @Test
    public void testLapTimesAfterPause_DuringReactionTime() {
      Racing racing = new Racing();
      com.antigravity.race.Race spyRace = spy(race);

      List<com.antigravity.protocols.PartialTime> mockPartials =
          Arrays.asList(
              new com.antigravity.protocols.PartialTime(0, 0.5, 0.0),
              new com.antigravity.protocols.PartialTime(1, 0.6, 0.0));
      doReturn(mockPartials).when(spyRace).stopProtocols();

      spyRace.changeState(racing);
      racing.pause(spyRace);

      assertEquals(0.5, spyRace.getCurrentHeat().getDrivers().get(0).getPendingLapTime(), 0.001);
      assertEquals(0.6, spyRace.getCurrentHeat().getDrivers().get(1).getPendingLapTime(), 0.001);

      spyRace.changeState(racing);
      racing.onLap(0, 0.8, 1, false);
      racing.onLap(1, 0.9, 1, false);

      assertEquals(1.3, spyRace.getCurrentHeat().getDrivers().get(0).getReactionTime(), 0.001);
      assertEquals(1.5, spyRace.getCurrentHeat().getDrivers().get(1).getReactionTime(), 0.001);
      assertEquals(0, spyRace.getCurrentHeat().getDrivers().get(0).getLaps().size());
      assertEquals(0, spyRace.getCurrentHeat().getDrivers().get(1).getLaps().size());

      assertEquals(0.0, spyRace.getCurrentHeat().getDrivers().get(0).getPendingLapTime(), 0.001);
      assertEquals(0.0, spyRace.getCurrentHeat().getDrivers().get(1).getPendingLapTime(), 0.001);

      spyRace.stop();
    }

    @Test
    public void testPracticeTimedRace_DoesNotFinishAndTimeGoesUp() throws InterruptedException {
      Racing racing = new Racing();
      com.antigravity.race.Race mockRace = mock(com.antigravity.race.Race.class);
      when(mockRace.getStatistics()).thenReturn(new RaceStatistics());

      Race mockModel = mock(Race.class);
      when(mockRace.getRaceModel()).thenReturn(mockModel);
      when(mockModel.isPractice()).thenReturn(true);

      HeatScoring scoring =
          new HeatScoring(
              HeatScoring.FinishMethod.Timed,
              0L,
              HeatScoring.HeatRanking.LAP_COUNT,
              HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
              HeatScoring.AllowFinish.None);
      when(mockModel.getHeatScoring()).thenReturn(scoring);

      Heat mockHeat = mock(Heat.class);
      when(mockRace.getCurrentHeat()).thenReturn(mockHeat);
      when(mockHeat.getStatistics()).thenReturn(new RaceHeatStatistics());

      DriverHeatData d1 = new DriverHeatData(participants.get(0));
      when(mockHeat.getDrivers()).thenReturn(Collections.singletonList(d1));

      HeatExecutionManager mockExecutionManager = mock(HeatExecutionManager.class);
      when(mockExecutionManager.getFinishedLanes()).thenReturn(new HashSet<>());
      when(mockRace.getHeatExecutionManager()).thenReturn(mockExecutionManager);

      when(mockRace.getRaceTime()).thenReturn(10.0f);

      racing.enter(mockRace);
      Thread.sleep(300);

      ArgumentCaptor<Float> captor = ArgumentCaptor.forClass(Float.class);
      verify(mockRace, atLeastOnce()).addRaceTime(captor.capture());
      for (Float val : captor.getAllValues()) {
        assertTrue(val > 0);
      }

      RaceFlag flag = racing.getFlagType(mockRace);
      assertTrue(flag == RaceFlag.GREEN);

      racing.exit(mockRace);
    }

    @Test
    public void testTeamOnLap_DoesNotCrash() {
      List<String> teamDriverIds = new ArrayList<>();
      teamDriverIds.add("d1");
      teamDriverIds.add("d2");
      Team team = new Team("The Team", "avatar_url", teamDriverIds, "team1", "1");
      RaceParticipant teamParticipant = new RaceParticipant(team);
      List<Driver> teamDrivers = new ArrayList<>();
      teamDrivers.add(new Driver("Driver 1", "D1", "d1", "1"));
      teamDrivers.add(new Driver("Driver 2", "D2", "d2", "1"));
      teamParticipant.setTeamDrivers(teamDrivers);

      List<RaceParticipant> teamParticipants = new ArrayList<>();
      teamParticipants.add(teamParticipant);
      teamParticipants.add(new RaceParticipant(new Driver("Driver 3", "D3", "d3", "1"), "p3"));

      com.antigravity.race.Race teamRace =
          new com.antigravity.race.Race.Builder()
              .model(race.getRaceModel())
              .drivers(teamParticipants)
              .track(track)
              .isDemoMode(false)
              .build();

      ProtocolDelegate delegate = new ProtocolDelegate(new ArrayList<>());
      delegate.setListener(teamRace);
      teamRace.injectProtocols(delegate);

      Racing racing = new Racing();
      teamRace.changeState(racing);

      racing.onLap(0, 1.0, 1, false);
      racing.onLap(0, 5.0, 1, false);

      assertNotNull(teamRace.getCurrentHeat().getDrivers().get(0).getLaps());
    }

    @Test
    public void testTeamDriverRotation_CreditsCorrectDriver() {
      List<String> teamDriverIds = new ArrayList<>();
      teamDriverIds.add("d1");
      teamDriverIds.add("d2");
      Team team = new Team("The Team", "avatar_url", teamDriverIds, "team1", "1");
      RaceParticipant teamParticipant = new RaceParticipant(team);
      List<Driver> teamDrivers = new ArrayList<>();
      teamDrivers.add(new Driver("Driver 1", "D1", "d1", "1"));
      teamDrivers.add(new Driver("Driver 2", "D2", "d2", "1"));
      teamParticipant.setTeamDrivers(teamDrivers);

      List<RaceParticipant> teamParticipants = new ArrayList<>();
      teamParticipants.add(teamParticipant);

      com.antigravity.race.Race teamRace =
          new com.antigravity.race.Race.Builder()
              .model(race.getRaceModel())
              .drivers(teamParticipants)
              .track(track)
              .isDemoMode(false)
              .build();

      ProtocolDelegate delegate = new ProtocolDelegate(new ArrayList<>());
      delegate.setListener(teamRace);
      teamRace.injectProtocols(delegate);

      Racing racing = new Racing();
      teamRace.changeState(racing);

      DriverHeatData teamHeatData = teamRace.getCurrentHeat().getDrivers().get(0);
      racing.onLap(0, 1.0, 1, false);

      Driver driver1 = new Driver("Driver 1", "D1", "d1", "1");
      teamHeatData.setActualDriver(driver1);
      racing.onLap(0, 5.0, 1, false);

      Driver driver2 = new Driver("Driver 2", "D2", "d2", "1");
      teamHeatData.setActualDriver(driver2);
      racing.onLap(0, 6.0, 1, false);

      List<DriverHeatData.LapData> laps = teamHeatData.getLaps();
      assertEquals(2, laps.size());
      assertEquals("d1", laps.get(0).getDriverId());
      assertEquals("d2", laps.get(1).getDriverId());
    }
  }

  // =========================================================================
  // 4. Power Management
  // =========================================================================
  public static class PowerManagement {
    private com.antigravity.race.Race race;
    private ProtocolDelegate mockProtocols;

    @Before
    public void setUp() throws Exception {
      Race raceModel = mock(Race.class);
      HeatScoring heatScoring = mock(HeatScoring.class);
      when(heatScoring.getHeatRanking()).thenReturn(HeatScoring.HeatRanking.LAP_COUNT);
      when(heatScoring.getHeatRankingTiebreaker())
          .thenReturn(HeatScoring.HeatRankingTiebreaker.AVERAGE_LAP_TIME);
      when(raceModel.getName()).thenReturn("Power Test");
      when(raceModel.getHeatRotationType()).thenReturn(HeatRotationType.RoundRobin);
      when(raceModel.getHeatScoring()).thenReturn(heatScoring);
      when(raceModel.getOverallScoring()).thenReturn(new OverallScoring());

      Track track = mock(Track.class);
      ArrayList<Lane> lanes = new ArrayList<>();
      lanes.add(mock(Lane.class));
      lanes.add(mock(Lane.class));
      when(track.getLanes()).thenReturn(lanes);

      List<RaceParticipant> drivers = new ArrayList<>();
      drivers.add(new RaceParticipant(new Driver("Driver 1", "D1", "d1", "1")));
      drivers.add(new RaceParticipant(new Driver("Driver 2", "D2", "d2", "1")));

      race =
          new com.antigravity.race.Race.Builder()
              .model(raceModel)
              .track(track)
              .drivers(drivers)
              .isDemoMode(true)
              .build();
      mockProtocols = mock(ProtocolDelegate.class);
      race.injectProtocols(mockProtocols);
    }

    @Test
    public void testSetMainPowerCallsProtocols() {
      race.setMainPower(true);
      verify(mockProtocols, times(1)).setMainPower(true);

      race.setMainPower(true);
      verify(mockProtocols, times(2)).setMainPower(true);

      race.setMainPower(false);
      verify(mockProtocols, times(1)).setMainPower(false);
    }

    @Test
    public void testSetLanePowerLoopsCorrectly() {
      race.setLanePower(true, -1);
      verify(mockProtocols).setLanePower(true, 0);
      verify(mockProtocols).setLanePower(true, 1);
    }

    @Test
    public void testInitializeHardwareState() {
      race.initializeHardwareState();
      verify(mockProtocols, times(1)).initializeHardwareState();
    }

    @Test
    public void testMasterPowerDuringNotStartedState() {
      assertFalse(race.isMainPower());
    }

    @Test
    public void testMasterPowerDuringStartingState() {
      race.changeState(new Starting());
      assertFalse(race.isMainPower());
    }

    @Test
    public void testMasterPowerDuringGreenFlag() {
      race.updatePowerForFlag(RaceFlag.GREEN);
      assertTrue(race.isMainPower());
    }

    @Test
    public void testMasterPowerAfterWarmupEnds() {
      race.updatePowerForFlag(RaceFlag.GREEN_YELLOW);
      assertTrue(race.isMainPower());

      for (int i = 0; i < race.getTrack().getLanes().size(); i++) {
        verify(mockProtocols).setLanePower(true, i);
      }

      race.updatePowerForFlag(RaceFlag.RED);
      assertFalse(race.isMainPower());
    }

    @Test
    public void testMasterPowerDuringPausedState() {
      race.updatePowerForFlag(RaceFlag.GREEN);
      assertTrue(race.isMainPower());

      race.updatePowerForFlag(RaceFlag.YELLOW);
      assertFalse(race.isMainPower());
    }

    @Test
    public void testMasterPowerDuringStartingStateWithHotStart() {
      Race modelWithHotStart =
          new Race.Builder().from(race.getRaceModel()).withHotStart(true).build();

      com.antigravity.race.Race hotRace =
          new com.antigravity.race.Race.Builder()
              .model(modelWithHotStart)
              .track(race.getTrack())
              .drivers(race.getDrivers())
              .isDemoMode(true)
              .build();
      hotRace.injectProtocols(mockProtocols);

      hotRace.changeState(new Starting());
      assertTrue(hotRace.isMainPower());
    }

    @Test
    public void testMasterPowerDuringStartingStateWithHotStartAfterRestart() {
      Race modelWithHotStart =
          new Race.Builder().from(race.getRaceModel()).withHotStart(true).build();

      com.antigravity.race.Race hotRace =
          new com.antigravity.race.Race.Builder()
              .model(modelWithHotStart)
              .track(race.getTrack())
              .drivers(race.getDrivers())
              .isDemoMode(true)
              .build();
      hotRace.injectProtocols(mockProtocols);

      hotRace.setHasRacedInCurrentHeat(true);
      hotRace.changeState(new Starting());
      assertFalse(hotRace.isMainPower());
    }

    @Test
    public void testMasterPowerDuringCheckeredFlag_AllowFinish() {
      Race model =
          new Race.Builder()
              .withHeatScoring(
                  new HeatScoring(
                      HeatScoring.FinishMethod.Lap,
                      1L,
                      HeatScoring.HeatRanking.LAP_COUNT,
                      HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
                      HeatScoring.AllowFinish.Allow))
              .build();

      com.antigravity.race.Race allowRace =
          new com.antigravity.race.Race.Builder()
              .model(model)
              .track(race.getTrack())
              .drivers(race.getDrivers())
              .isDemoMode(true)
              .build();
      allowRace.injectProtocols(mockProtocols);

      allowRace.updatePowerForFlag(RaceFlag.RED);
      assertFalse(allowRace.isMainPower());

      allowRace.updatePowerForFlag(RaceFlag.GREEN);
      assertTrue(allowRace.isMainPower());

      allowRace.updatePowerForFlag(RaceFlag.CHECKERED);
      assertTrue(allowRace.isMainPower());
    }

    @Test
    public void testMasterPowerDuringCheckeredFlag_NoAllowFinish() {
      Race model =
          new Race.Builder()
              .withHeatScoring(
                  new HeatScoring(
                      HeatScoring.FinishMethod.Lap,
                      1L,
                      HeatScoring.HeatRanking.LAP_COUNT,
                      HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
                      HeatScoring.AllowFinish.None))
              .build();

      com.antigravity.race.Race noAllowRace =
          new com.antigravity.race.Race.Builder()
              .model(model)
              .track(race.getTrack())
              .drivers(race.getDrivers())
              .isDemoMode(true)
              .build();
      noAllowRace.injectProtocols(mockProtocols);

      noAllowRace.updatePowerForFlag(RaceFlag.GREEN);
      assertTrue(noAllowRace.isMainPower());

      noAllowRace.updatePowerForFlag(RaceFlag.CHECKERED);
      assertFalse(noAllowRace.isMainPower());
    }

    @Test
    public void testMasterPowerDuringCheckeredFlag_Resume() {
      Race model =
          new Race.Builder()
              .withHeatScoring(
                  new HeatScoring(
                      HeatScoring.FinishMethod.Lap,
                      3L,
                      HeatScoring.HeatRanking.LAP_COUNT,
                      HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
                      HeatScoring.AllowFinish.Allow))
              .build();

      Lane lane0 = new Lane("red", "white", 100);
      Lane lane1 = new Lane("blue", "white", 100);
      List<Lane> lanes = new ArrayList<>();
      lanes.add(lane0);
      lanes.add(lane1);
      Track track = new Track.Builder().name("Track").lanes(lanes).build();

      com.antigravity.race.Race resumeRace =
          new com.antigravity.race.Race.Builder()
              .model(model)
              .track(track)
              .drivers(race.getDrivers())
              .isDemoMode(true)
              .build();
      resumeRace.injectProtocols(mockProtocols);

      resumeRace.getHeatExecutionManager().getFinishedLanes().add(0);
      resumeRace.updatePowerForFlag(RaceFlag.CHECKERED);

      assertTrue(resumeRace.isMainPower());
      assertFalse(resumeRace.isLanePower(0));
      assertTrue(resumeRace.isLanePower(1));
    }

    @Test
    public void testMasterPowerDuringCheckeredFlag_SingleLap_Timed() {
      Race model =
          new Race.Builder()
              .withHeatScoring(
                  new HeatScoring(
                      HeatScoring.FinishMethod.Timed,
                      60L,
                      HeatScoring.HeatRanking.LAP_COUNT,
                      HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
                      HeatScoring.AllowFinish.SingleLap))
              .build();

      Lane lane0 = new Lane("red", "white", 100);
      Lane lane1 = new Lane("blue", "white", 100);
      List<Lane> lanes = new ArrayList<>();
      lanes.add(lane0);
      lanes.add(lane1);
      Track track = new Track.Builder().name("Track").lanes(lanes).build();

      com.antigravity.race.Race singleLapTimedRace =
          new com.antigravity.race.Race.Builder()
              .model(model)
              .track(track)
              .drivers(race.getDrivers())
              .isDemoMode(true)
              .build();
      singleLapTimedRace.injectProtocols(mockProtocols);

      singleLapTimedRace.updatePowerForFlag(RaceFlag.GREEN);
      assertTrue(singleLapTimedRace.isMainPower());
      assertTrue(singleLapTimedRace.isLanePower(0));
      assertTrue(singleLapTimedRace.isLanePower(1));

      // Checkered flag broadcast
      singleLapTimedRace.updatePowerForFlag(RaceFlag.CHECKERED);
      assertTrue(singleLapTimedRace.isMainPower());
      assertTrue(singleLapTimedRace.isLanePower(0));
      assertTrue(singleLapTimedRace.isLanePower(1));

      // Lane 0 finishes single lap
      singleLapTimedRace.getHeatExecutionManager().getFinishedLanes().add(0);
      singleLapTimedRace.setLanePower(false, 0);
      assertTrue(singleLapTimedRace.isMainPower());
      assertFalse(singleLapTimedRace.isLanePower(0));
      assertTrue(singleLapTimedRace.isLanePower(1));
    }

    @Test
    public void testMasterPowerDuringCheckeredFlag_SingleLap_Lap() {
      Race model =
          new Race.Builder()
              .withHeatScoring(
                  new HeatScoring(
                      HeatScoring.FinishMethod.Lap,
                      5L,
                      HeatScoring.HeatRanking.LAP_COUNT,
                      HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
                      HeatScoring.AllowFinish.SingleLap))
              .build();

      Lane lane0 = new Lane("red", "white", 100);
      Lane lane1 = new Lane("blue", "white", 100);
      List<Lane> lanes = new ArrayList<>();
      lanes.add(lane0);
      lanes.add(lane1);
      Track track = new Track.Builder().name("Track").lanes(lanes).build();

      com.antigravity.race.Race singleLapRace =
          new com.antigravity.race.Race.Builder()
              .model(model)
              .track(track)
              .drivers(race.getDrivers())
              .isDemoMode(true)
              .build();
      singleLapRace.injectProtocols(mockProtocols);

      singleLapRace.updatePowerForFlag(RaceFlag.GREEN);
      assertTrue(singleLapRace.isMainPower());

      singleLapRace.updatePowerForFlag(RaceFlag.CHECKERED);
      assertTrue(singleLapRace.isMainPower());

      singleLapRace.getHeatExecutionManager().getFinishedLanes().add(0);
      singleLapRace.setLanePower(false, 0);
      assertTrue(singleLapRace.isMainPower());
      assertFalse(singleLapRace.isLanePower(0));
      assertTrue(singleLapRace.isLanePower(1));
    }

    @Test
    public void testForceUserMainPower_WithMainRelay() {
      race.forceUserMainPower(true);
      assertTrue(race.isMainPower());
      verify(mockProtocols).setMainPower(true);
      verify(mockProtocols, never()).setLanePower(anyBoolean(), anyInt());
    }

    @Test
    public void testForceUserMainPower_WithoutMainRelay_WithLaneRelays() {
      when(mockProtocols.hasMainRelay()).thenReturn(false);
      when(mockProtocols.hasPerLaneRelays()).thenReturn(true);
      race.forceUserMainPower(true);
      assertTrue(race.isMainPower());
      verify(mockProtocols).setMainPower(true);
      verify(mockProtocols).setLanePower(true, 0);
      verify(mockProtocols).setLanePower(true, 1);
    }
  }

  // =========================================================================
  // 5. Fuel and Refueling
  // =========================================================================
  public static class FuelAndRefueling {
    private com.antigravity.race.Race race;
    private Racing racing;
    private AnalogFuelOptions fuelOptions;

    @Before
    public void setUp() {
      fuelOptions =
          new AnalogFuelOptions(
              true,
              true,
              null,
              com.antigravity.models.FuelOptions.OutOfFuelAction.DO_NOT_COUNT_LAPS,
              100.0,
              AnalogFuelOptions.FuelUsageType.LINEAR,
              4.0,
              100.0,
              20.0,
              1.0,
              6.0);

      HeatScoring heatScoring =
          new HeatScoring(
              HeatScoring.FinishMethod.Lap,
              10L,
              HeatScoring.HeatRanking.LAP_COUNT,
              HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
              HeatScoring.AllowFinish.None);

      Race raceModel =
          new Race.Builder()
              .withName("Fuel Test Race")
              .withTrackEntityId("track1")
              .withHeatRotationType(HeatRotationType.RoundRobin)
              .withHeatScoring(heatScoring)
              .withOverallScoring(new OverallScoring())
              .withFuelOptions(fuelOptions)
              .withAutoStartTime(60.0)
              .withAutoStartWarmupTime(10.0)
              .withEntityId("race1")
              .withId("1")
              .build();

      List<RaceParticipant> participants = new ArrayList<>();
      participants.add(new RaceParticipant(new Driver("Driver 1", "D1", "d1", "1"), "p1"));
      participants.add(new RaceParticipant(new Driver("Driver 2", "D2", "d2", "1"), "p2"));

      List<Lane> lanes = new ArrayList<>();
      lanes.add(new Lane("red", "black", 100));
      lanes.add(new Lane("blue", "black", 100));
      Track track =
          new Track.Builder()
              .name("Test Track")
              .lanes(lanes)
              .arduinoConfigs(Collections.singletonList(mock(ArduinoConfig.class)))
              .entityId("track1")
              .id("1")
              .build();

      race =
          spy(
              new com.antigravity.race.Race.Builder()
                  .model(raceModel)
                  .drivers(participants)
                  .track(track)
                  .isDemoMode(true)
                  .build());

      race.getHeatExecutionManager().setRace(race);
      racing = new Racing();
      race.changeState(racing);
    }

    @After
    public void tearDown() {
      if (racing != null) {
        racing.exit(race);
      }
    }

    @Test
    public void testRefuelingLogic() throws Exception {
      race.getCurrentHeat().getDrivers().get(0).getDriver().setFuelLevel(50.0);
      CarData pitEntry =
          new CarData(0, 0.0, 0.0, 0.0, true, CarLocation.PitRow, CarLocation.Main, 0);
      racing.onCarData(pitEntry);

      assertEquals(
          50.0, race.getCurrentHeat().getDrivers().get(0).getDriver().getFuelLevel(), 0.001);

      race.getHeatExecutionManager().processTicker(0.5f);
      assertEquals(
          50.0, race.getCurrentHeat().getDrivers().get(0).getDriver().getFuelLevel(), 0.001);

      race.getHeatExecutionManager().processTicker(0.6f);
      double fuelAfterRefuelStart =
          race.getCurrentHeat().getDrivers().get(0).getDriver().getFuelLevel();
      assertTrue(fuelAfterRefuelStart > 50.0);

      CarData exitPit =
          new CarData(0, 2.0, 0.5, 0.5, true, CarLocation.Main, CarLocation.PitRow, 0);
      racing.onCarData(exitPit);
      double fuelAtExit = race.getCurrentHeat().getDrivers().get(0).getDriver().getFuelLevel();

      race.getHeatExecutionManager().processTicker(0.5f);
      assertEquals(
          fuelAtExit, race.getCurrentHeat().getDrivers().get(0).getDriver().getFuelLevel(), 0.001);
    }

    @Test
    public void testRefuelingCapAtCapacity() throws Exception {
      race.getCurrentHeat().getDrivers().get(0).getDriver().setFuelLevel(95.0);
      CarData pitEntry =
          new CarData(0, 0.0, 0.0, 0.0, true, CarLocation.PitRow, CarLocation.Main, 0);
      racing.onCarData(pitEntry);

      race.getHeatExecutionManager().processTicker(1.5f);
      assertEquals(
          100.0, race.getCurrentHeat().getDrivers().get(0).getDriver().getFuelLevel(), 0.001);
    }

    @Test
    public void testFuelResetOnAdvanceToNextHeat() {
      for (DriverHeatData driverData : race.getCurrentHeat().getDrivers()) {
        driverData.getDriver().setFuelLevel(50.0);
      }

      Common.advanceToNextHeat(race);

      for (DriverHeatData driverData : race.getCurrentHeat().getDrivers()) {
        RaceParticipant p = driverData.getDriver();
        assertEquals(100.0, p.getFuelLevel(), 0.001);
      }
    }

    @Test
    public void testFuelInitializationInConstructor() {
      RaceParticipant p = race.getDrivers().get(0);
      assertEquals(100.0, p.getFuelLevel(), 0.001);
    }

    @Test
    public void testInitialFuelLevelSetOnNotStartedEnter() {
      DriverHeatData dhd = race.getCurrentHeat().getDrivers().get(0);
      assertEquals(100.0, dhd.getInitialFuelLevel(), 0.001);
    }

    @Test
    public void testFuelRestoreAfterWarmup() {
      RaceParticipant p = race.getDrivers().get(0);
      p.setFuelLevel(85.0);
      race.resetCurrentHeat();
      assertEquals(100.0, p.getFuelLevel(), 0.001);
    }

    @Test
    public void testNoResetIfResetAtStartIsFalse() {
      AnalogFuelOptions noResetOptions =
          new AnalogFuelOptions(
              true,
              false,
              null,
              com.antigravity.models.FuelOptions.OutOfFuelAction.DO_NOT_COUNT_LAPS,
              100.0,
              AnalogFuelOptions.FuelUsageType.LINEAR,
              4.0,
              75.0,
              20.0,
              1.0,
              6.0);

      Race raceModel =
          new Race.Builder()
              .withName("No Reset Test")
              .withFuelOptions(noResetOptions)
              .withAutoStartTime(60.0)
              .withTrackEntityId("track1")
              .withHeatRotationType(HeatRotationType.RoundRobin)
              .withHeatScoring(race.getRaceModel().getHeatScoring())
              .withOverallScoring(new OverallScoring())
              .build();

      List<RaceParticipant> parts = new ArrayList<>();
      parts.add(new RaceParticipant(new Driver("D1", "d1", "1", "1")));
      parts.get(0).setFuelLevel(75.0);

      com.antigravity.race.Race noResetRace =
          new com.antigravity.race.Race.Builder()
              .model(raceModel)
              .drivers(parts)
              .track(race.getTrack())
              .isDemoMode(true)
              .build();

      DriverHeatData dhd = noResetRace.getCurrentHeat().getDrivers().get(0);
      assertEquals(75.0, dhd.getInitialFuelLevel(), 0.001);

      parts.get(0).setFuelLevel(70.0);
      noResetRace.resetCurrentHeat();

      assertEquals(75.0, parts.get(0).getFuelLevel(), 0.001);
    }
  }

  // =========================================================================
  // 6. Lane Swaps
  // =========================================================================
  public static class LaneSwaps {
    private com.antigravity.race.Race race;
    private RaceParticipant p1;
    private RaceParticipant p2;

    @Before
    public void setUp() {
      List<Lane> lanes = new ArrayList<>();
      lanes.add(new Lane("red", "black", 100));
      lanes.add(new Lane("blue", "white", 100));

      Track realTrack =
          new Track.Builder().name("Test Track").lanes(lanes).entityId("track1").id("1").build();

      Race realRaceModel =
          new Race.Builder()
              .withName("Test Race")
              .withTrackEntityId("track1")
              .withHeatRotationType(HeatRotationType.SingleHeatSolo)
              .withHeatScoring(new HeatScoring())
              .withOverallScoring(new OverallScoring())
              .withEntityId("race1")
              .withId("1")
              .build();

      List<RaceParticipant> drivers = new ArrayList<>();
      p1 = new RaceParticipant(new Driver("Driver 1", "D1", "driver1", "1"), "participant1");
      p2 = new RaceParticipant(new Driver("Driver 2", "D2", "driver2", "1"), "participant2");
      drivers.add(p1);
      drivers.add(p2);

      race =
          new com.antigravity.race.Race.Builder()
              .model(realRaceModel)
              .drivers(drivers)
              .track(realTrack)
              .isDemoMode(true)
              .build();
    }

    @Test
    public void testSuccessfulSwap() {
      assertEquals(p1, race.getCurrentHeat().getDrivers().get(0).getDriver());
      assertEquals(
          Driver.EMPTY_DRIVER.getObjectId(),
          race.getCurrentHeat().getDrivers().get(1).getDriver().getDriver().getObjectId());

      race.changeLane(0, 1);

      assertEquals(
          Driver.EMPTY_DRIVER.getObjectId(),
          race.getCurrentHeat().getDrivers().get(0).getDriver().getDriver().getObjectId());
      assertEquals(p1, race.getCurrentHeat().getDrivers().get(1).getDriver());
    }

    @Test
    public void testSwapRejectedIfNotSoloRotation() {
      Race roundRobinModel =
          new Race.Builder()
              .withName("Test Race")
              .withHeatRotationType(HeatRotationType.RoundRobin)
              .build();

      List<RaceParticipant> drivers = new ArrayList<>();
      drivers.add(p1);
      drivers.add(p2);

      com.antigravity.race.Race rrRace =
          new com.antigravity.race.Race.Builder()
              .model(roundRobinModel)
              .drivers(drivers)
              .track(race.getTrack())
              .isDemoMode(true)
              .build();

      assertEquals(p1, rrRace.getCurrentHeat().getDrivers().get(0).getDriver());
      rrRace.changeLane(0, 1);
      assertEquals(p1, rrRace.getCurrentHeat().getDrivers().get(0).getDriver());
    }

    @Test
    public void testSingleHeatSwapAllowedInNotStarted() {
      Race singleHeatModel =
          new Race.Builder()
              .withName("Single Heat Race")
              .withHeatRotationType(HeatRotationType.SingleHeat)
              .build();

      com.antigravity.race.Race shRace =
          new com.antigravity.race.Race.Builder()
              .model(singleHeatModel)
              .drivers(race.getDrivers())
              .track(race.getTrack())
              .isDemoMode(true)
              .build();

      shRace.changeLane(0, 1);
      assertEquals(p2, shRace.getCurrentHeat().getDrivers().get(0).getDriver());
      assertEquals(p1, shRace.getCurrentHeat().getDrivers().get(1).getDriver());
    }

    @Test
    public void testSingleHeatSwapRejectedAfterStart() {
      Race singleHeatModel =
          new Race.Builder()
              .withName("Single Heat Race")
              .withHeatRotationType(HeatRotationType.SingleHeat)
              .build();

      com.antigravity.race.Race shRace =
          new com.antigravity.race.Race.Builder()
              .model(singleHeatModel)
              .drivers(race.getDrivers())
              .track(race.getTrack())
              .isDemoMode(true)
              .build();

      shRace.changeState(new Starting());
      shRace.changeLane(0, 1);

      assertEquals(p1, shRace.getCurrentHeat().getDrivers().get(0).getDriver());
      assertEquals(p2, shRace.getCurrentHeat().getDrivers().get(1).getDriver());
    }

    @Test
    public void testSwapRejectedWithInvalidIndices() {
      race.changeLane(0, 5);
      assertEquals(p1, race.getCurrentHeat().getDrivers().get(0).getDriver());

      race.changeLane(-1, 0);
      assertEquals(p1, race.getCurrentHeat().getDrivers().get(0).getDriver());
    }

    @Test
    public void testTeammateChangeAfterSwap() {
      Race singleHeatModel =
          new Race.Builder()
              .withName("Single Heat Race")
              .withHeatRotationType(HeatRotationType.SingleHeat)
              .build();

      com.antigravity.race.Race shRace =
          new com.antigravity.race.Race.Builder()
              .model(singleHeatModel)
              .drivers(race.getDrivers())
              .track(race.getTrack())
              .isDemoMode(true)
              .build();

      shRace.changeLane(0, 1);

      Driver newDriver = new Driver("New Driver", "ND", "new_driver", "1");
      shRace.getCurrentHeat().getDrivers().get(0).setActualDriver(newDriver);

      assertEquals(
          newDriver.getObjectId(),
          shRace.getCurrentHeat().getDrivers().get(0).getActualDriver().getObjectId());
    }
  }

  // =========================================================================
  // 7. Flags and Broadcasts
  // =========================================================================
  public static class FlagsAndBroadcasts {
    private com.antigravity.race.Race race;
    private Race raceModel;
    private HeatScoring heatScoring;

    @Before
    public void setUp() {
      heatScoring = mock(HeatScoring.class);
      raceModel = mock(Race.class);
      when(raceModel.getHeatScoring()).thenReturn(heatScoring);

      race = mock(com.antigravity.race.Race.class);
      when(race.getRaceModel()).thenReturn(raceModel);
    }

    @Test
    public void testNotStartedFlag() {
      NotStarted state = new NotStarted();

      when(raceModel.getAutoStartTime()).thenReturn(0.0);
      when(raceModel.getAutoStartWarmupTime()).thenReturn(0.0);
      assertEquals(RaceFlag.RED, state.getFlagType(race));

      when(raceModel.getAutoStartTime()).thenReturn(10.0);
      when(raceModel.getAutoStartWarmupTime()).thenReturn(5.0);
      when(race.getAutoStartRemaining()).thenReturn(8.0);
      assertEquals(RaceFlag.GREEN_YELLOW, state.getFlagType(race));

      when(race.getAutoStartRemaining()).thenReturn(3.0);
      assertEquals(RaceFlag.RED, state.getFlagType(race));
    }

    @Test
    public void testStartingFlag() {
      Starting state = new Starting();
      when(race.hasRacedInCurrentHeat()).thenReturn(false);
      assertEquals(RaceFlag.RED, state.getFlagType(race));

      when(race.hasRacedInCurrentHeat()).thenReturn(true);
      assertEquals(RaceFlag.YELLOW, state.getFlagType(race));
    }

    @Test
    public void testLaneFlagBlackFuel() {
      Racing state = new Racing();
      Heat currentHeat = mock(Heat.class);
      when(race.getCurrentHeat()).thenReturn(currentHeat);

      List<DriverHeatData> activeDrivers = new ArrayList<>();
      DriverHeatData dhd = mock(DriverHeatData.class);
      RaceParticipant participant = mock(RaceParticipant.class);
      when(dhd.getDriver()).thenReturn(participant);
      activeDrivers.add(dhd);
      when(currentHeat.getDrivers()).thenReturn(activeDrivers);

      HeatExecutionManager hem = mock(HeatExecutionManager.class);
      when(race.getHeatExecutionManager()).thenReturn(hem);
      when(hem.isAnalogFuelEnabled()).thenReturn(true);

      when(participant.getFuelLevel()).thenReturn(10.0);
      assertEquals(RaceFlag.GREEN, state.getLaneFlagType(race, 0));

      when(participant.getFuelLevel()).thenReturn(0.0);
      assertEquals(RaceFlag.BLACK, state.getLaneFlagType(race, 0));
    }

    @Test
    public void testLaneFlagBlackFalseStart() {
      Starting state = new Starting();
      Heat currentHeat = mock(Heat.class);
      when(race.getCurrentHeat()).thenReturn(currentHeat);

      List<DriverHeatData> activeDrivers = new ArrayList<>();
      DriverHeatData dhd = mock(DriverHeatData.class);
      activeDrivers.add(dhd);
      when(currentHeat.getDrivers()).thenReturn(activeDrivers);

      when(dhd.getRemainingFalseStartTimePenalty()).thenReturn(0.0);
      assertEquals(RaceFlag.RED, state.getLaneFlagType(race, 0));

      when(dhd.getRemainingFalseStartTimePenalty()).thenReturn(5.0);
      assertEquals(RaceFlag.BLACK, state.getLaneFlagType(race, 0));
    }

    @Test
    public void testPausedFlag() {
      Paused state = new Paused();
      assertEquals(RaceFlag.YELLOW, state.getFlagType(race));
    }

    @Test
    public void testRaceOverFlag() {
      RaceOver state = new RaceOver();
      assertEquals(RaceFlag.RED, state.getFlagType(race));
    }

    @Test
    public void testHeatOverFlag() {
      HeatOver state = new HeatOver();
      when(raceModel.getAutoAdvanceWarmupTime()).thenReturn(0.0);
      assertEquals(RaceFlag.RED, state.getFlagType(race));

      when(raceModel.getAutoAdvanceWarmupTime()).thenReturn(5.0);
      when(race.getAutoAdvanceRemaining()).thenReturn(3.0);
      assertEquals(RaceFlag.GREEN_YELLOW, state.getFlagType(race));

      when(race.getAutoAdvanceRemaining()).thenReturn(8.0);
      assertEquals(RaceFlag.RED, state.getFlagType(race));
    }

    @Test
    public void testRacingFlag() {
      Racing state = new Racing();
      Heat currentHeat = mock(Heat.class);
      when(race.getCurrentHeat()).thenReturn(currentHeat);

      List<DriverHeatData> activeDrivers = new ArrayList<>();
      DriverHeatData d = mock(DriverHeatData.class);
      activeDrivers.add(d);
      when(currentHeat.getDrivers()).thenReturn(activeDrivers);

      when(heatScoring.getFinishMethod()).thenReturn(HeatScoring.FinishMethod.Lap);
      when(heatScoring.getFinishValue()).thenReturn(10L);
      when(heatScoring.getAllowFinish()).thenReturn(HeatScoring.AllowFinish.None);
      when(d.getLapCount()).thenReturn(5);
      assertEquals(RaceFlag.GREEN, state.getFlagType(race));

      when(d.getLapCount()).thenReturn(9);
      assertEquals(RaceFlag.WHITE, state.getFlagType(race));

      when(heatScoring.getAllowFinish()).thenReturn(HeatScoring.AllowFinish.Allow);
      when(d.getLapCount()).thenReturn(10);
      assertEquals(RaceFlag.CHECKERED, state.getFlagType(race));
    }

    @Test
    public void testLaneFlagRedAllowFinish() {
      Racing state = new Racing();
      Heat currentHeat = mock(Heat.class);
      when(race.getCurrentHeat()).thenReturn(currentHeat);

      List<DriverHeatData> activeDrivers = new ArrayList<>();
      DriverHeatData d0 = mock(DriverHeatData.class);
      DriverHeatData d1 = mock(DriverHeatData.class);
      activeDrivers.add(d0);
      activeDrivers.add(d1);
      when(currentHeat.getDrivers()).thenReturn(activeDrivers);

      HeatExecutionManager hem = mock(HeatExecutionManager.class);
      when(race.getHeatExecutionManager()).thenReturn(hem);

      when(heatScoring.getFinishMethod()).thenReturn(HeatScoring.FinishMethod.Lap);
      when(heatScoring.getFinishValue()).thenReturn(10L);
      when(heatScoring.getAllowFinish()).thenReturn(HeatScoring.AllowFinish.Allow);

      when(d0.getLapCount()).thenReturn(10);
      when(d1.getLapCount()).thenReturn(5);

      assertEquals(RaceFlag.CHECKERED, state.getFlagType(race));
      assertEquals(RaceFlag.RED, state.getLaneFlagType(race, 0));
      assertEquals(RaceFlag.CHECKERED, state.getLaneFlagType(race, 1));
    }

    @Test
    public void testLaneFlagRedAllowFinishTimed() {
      Racing state = new Racing();
      Heat currentHeat = mock(Heat.class);
      when(race.getCurrentHeat()).thenReturn(currentHeat);

      List<DriverHeatData> activeDrivers = new ArrayList<>();
      DriverHeatData d0 = mock(DriverHeatData.class);
      activeDrivers.add(d0);
      when(currentHeat.getDrivers()).thenReturn(activeDrivers);

      HeatExecutionManager hem = mock(HeatExecutionManager.class);
      when(race.getHeatExecutionManager()).thenReturn(hem);

      when(heatScoring.getFinishMethod()).thenReturn(HeatScoring.FinishMethod.Timed);
      when(heatScoring.getAllowFinish()).thenReturn(HeatScoring.AllowFinish.Allow);

      Set<Integer> finished = new HashSet<>();
      finished.add(0);
      when(hem.getFinishedLanes()).thenReturn(finished);

      when(race.getRaceTime()).thenReturn(0.0f);
      assertEquals(RaceFlag.CHECKERED, state.getFlagType(race));
      assertEquals(RaceFlag.RED, state.getLaneFlagType(race, 0));
    }

    @Test
    public void testAutoStartWarmupBroadcast() throws Exception {
      ProtocolDelegate mockProtocols = mock(ProtocolDelegate.class);
      Track mockTrack = mock(Track.class);
      when(mockTrack.getEntityId()).thenReturn("mockTrackId");
      when(mockTrack.getObjectId()).thenReturn("1");
      when(mockTrack.getName()).thenReturn("Test Track");
      Lane mockLane = new Lane("red", "black", 100);
      when(mockTrack.getLanes()).thenReturn(Collections.singletonList(mockLane));

      Race warmupModel =
          new Race.Builder()
              .withName("Warmup Broadcast Test")
              .withTrackEntityId("track1")
              .withHeatRotationType(HeatRotationType.RoundRobin)
              .withHeatScoring(new HeatScoring())
              .withOverallScoring(new OverallScoring())
              .withAutoStartTime(1.0)
              .withAutoStartWarmupTime(0.5)
              .withAutoAdvanceTime(1.0)
              .withAutoAdvanceWarmupTime(0.5)
              .withEntityId("race1")
              .withId("1")
              .build();

      List<RaceParticipant> warmupDrivers =
          Collections.singletonList(new RaceParticipant(new Driver("Driver 1", "D1", "d1", "1")));

      com.antigravity.race.Race realWarmupRace =
          new com.antigravity.race.Race.Builder()
              .model(warmupModel)
              .drivers(warmupDrivers)
              .track(mockTrack)
              .isDemoMode(true)
              .build();
      realWarmupRace.injectProtocols(mockProtocols);

      NotStarted state = new NotStarted();
      state.enter(realWarmupRace);

      verify(mockProtocols, timeout(1000).atLeastOnce())
          .setRaceState(eq(RaceState.NOT_STARTED), eq(RaceFlag.GREEN_YELLOW), anyDouble());
    }

    @Test
    public void testAutoAdvanceWarmupBroadcast() throws Exception {
      ProtocolDelegate mockProtocols = mock(ProtocolDelegate.class);
      Track mockTrack = mock(Track.class);
      when(mockTrack.getEntityId()).thenReturn("mockTrackId");
      when(mockTrack.getObjectId()).thenReturn("1");
      when(mockTrack.getName()).thenReturn("Test Track");
      Lane mockLane = new Lane("red", "black", 100);
      when(mockTrack.getLanes()).thenReturn(Collections.singletonList(mockLane));

      Race warmupModel =
          new Race.Builder()
              .withName("Warmup Broadcast Test")
              .withTrackEntityId("track1")
              .withHeatRotationType(HeatRotationType.RoundRobin)
              .withHeatScoring(new HeatScoring())
              .withOverallScoring(new OverallScoring())
              .withAutoStartTime(1.0)
              .withAutoStartWarmupTime(0.5)
              .withAutoAdvanceTime(1.0)
              .withAutoAdvanceWarmupTime(0.5)
              .withEntityId("race1")
              .withId("1")
              .build();

      List<RaceParticipant> warmupDrivers =
          Collections.singletonList(new RaceParticipant(new Driver("Driver 1", "D1", "d1", "1")));

      com.antigravity.race.Race realWarmupRace =
          new com.antigravity.race.Race.Builder()
              .model(warmupModel)
              .drivers(warmupDrivers)
              .track(mockTrack)
              .isDemoMode(true)
              .build();
      realWarmupRace.injectProtocols(mockProtocols);

      HeatOver state = new HeatOver();
      state.enter(realWarmupRace);

      long start = System.currentTimeMillis();
      while (realWarmupRace.getAutoAdvanceRemaining() > 0.5
          && (System.currentTimeMillis() - start) < 3000) {
        Thread.sleep(100);
      }

      verify(mockProtocols, timeout(2000).atLeastOnce())
          .setRaceState(eq(RaceState.HEAT_OVER), eq(RaceFlag.GREEN_YELLOW), anyDouble());
    }
  }

  // =========================================================================
  // 8. Timing and Drift
  // =========================================================================
  public static class TimingAndDrift {
    private com.antigravity.race.Race race;
    private Track track;
    private List<RaceParticipant> drivers;

    @Before
    public void setUp() {
      List<Lane> lanes = new ArrayList<>();
      lanes.add(new Lane("red", "black", 100, "l1", null));
      lanes.add(new Lane("blue", "black", 100, "l2", null));
      track =
          new Track.Builder().name("Test Track").lanes(lanes).entityId("track1").id(null).build();

      drivers = new ArrayList<>();
      for (int i = 0; i < 4; i++) {
        Driver d =
            new Driver(
                "D" + i,
                "Nick" + i,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                "id" + i,
                null);
        drivers.add(new RaceParticipant(d));
      }
    }

    @After
    public void tearDown() {
      if (race != null && race.getState() != null) {
        try {
          race.getState().exit(race);
        } catch (Exception ignored) {
        }
      }
      ClientSubscriptionManager.setInstance(null);
    }

    @Test
    public void testLapsCountedWithinDriftTime() throws InterruptedException {
      com.antigravity.race.Race mockRace = mock(com.antigravity.race.Race.class);
      Race mockRaceModel = mock(Race.class);
      HeatExecutionManager mockExecutionManager = mock(HeatExecutionManager.class);
      when(mockRace.getRaceModel()).thenReturn(mockRaceModel);
      when(mockRace.getHeatExecutionManager()).thenReturn(mockExecutionManager);
      when(mockRaceModel.getDriftTime()).thenReturn(1.0);

      Paused pausedState = new Paused();
      pausedState.enter(mockRace);

      pausedState.onLap(1, 10.5, 1, false);
      verify(mockExecutionManager, times(1)).onLap(1, 10.5, 1, false, true, true);

      Thread.sleep(500);
      pausedState.onLap(2, 11.5, 1, false);
      verify(mockExecutionManager, times(1)).onLap(2, 11.5, 1, false, true, true);
    }

    @Test
    public void testLapsIgnoredAfterDriftTime() throws InterruptedException {
      com.antigravity.race.Race mockRace = mock(com.antigravity.race.Race.class);
      Race mockRaceModel = mock(Race.class);
      HeatExecutionManager mockExecutionManager = mock(HeatExecutionManager.class);
      when(mockRace.getRaceModel()).thenReturn(mockRaceModel);
      when(mockRace.getHeatExecutionManager()).thenReturn(mockExecutionManager);
      when(mockRaceModel.getDriftTime()).thenReturn(0.2);

      Paused pausedState = new Paused();
      pausedState.enter(mockRace);

      Thread.sleep(300);
      pausedState.onLap(1, 10.5, 1, false);
      verify(mockExecutionManager, never())
          .onLap(anyInt(), anyDouble(), anyInt(), anyBoolean(), anyBoolean(), anyBoolean());
    }

    @Test
    public void testLapsIgnoredWithZeroDriftTime() {
      com.antigravity.race.Race mockRace = mock(com.antigravity.race.Race.class);
      Race mockRaceModel = mock(Race.class);
      HeatExecutionManager mockExecutionManager = mock(HeatExecutionManager.class);
      when(mockRace.getRaceModel()).thenReturn(mockRaceModel);
      when(mockRace.getHeatExecutionManager()).thenReturn(mockExecutionManager);
      when(mockRaceModel.getDriftTime()).thenReturn(0.0);

      Paused pausedState = new Paused();
      pausedState.enter(mockRace);

      pausedState.onLap(1, 10.5, 1, false);
      verify(mockExecutionManager, never())
          .onLap(anyInt(), anyDouble(), anyInt(), anyBoolean(), anyBoolean(), anyBoolean());
    }

    @Test
    public void testRacingStateAlwaysCountsLapsRegardlessOfDriftTime() {
      com.antigravity.race.Race mockRace = mock(com.antigravity.race.Race.class);
      Race mockRaceModel = mock(Race.class);
      HeatExecutionManager mockExecutionManager = mock(HeatExecutionManager.class);
      when(mockRace.getRaceModel()).thenReturn(mockRaceModel);
      when(mockRace.getHeatExecutionManager()).thenReturn(mockExecutionManager);
      when(mockRaceModel.getDriftTime()).thenReturn(0.0);
      when(mockRace.getStatistics()).thenReturn(mock(RaceStatistics.class));

      Heat mockHeat = mock(Heat.class);
      when(mockRace.getCurrentHeat()).thenReturn(mockHeat);
      when(mockHeat.getStatistics()).thenReturn(mock(RaceHeatStatistics.class));

      Racing racingState = new Racing();
      racingState.enter(mockRace);

      racingState.onLap(1, 10.5, 1, false);
      verify(mockExecutionManager, times(1)).onLap(1, 10.5, 1, false, true, false);

      when(mockRaceModel.getDriftTime()).thenReturn(100.0);
      racingState.onLap(2, 11.5, 1, false);
      verify(mockExecutionManager, times(1)).onLap(2, 11.5, 1, false, true, false);
    }

    @Test
    public void testLapBasedRaceTimeResets() {
      Race raceModel =
          new Race.Builder()
              .withName("Lap Race")
              .withTrackEntityId("track1")
              .withHeatRotationType(HeatRotationType.RoundRobin)
              .withHeatScoring(
                  new HeatScoring(
                      HeatScoring.FinishMethod.Lap,
                      10,
                      HeatScoring.HeatRanking.LAP_COUNT,
                      HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
                      HeatScoring.AllowFinish.None))
              .withOverallScoring(
                  new OverallScoring(
                      0,
                      OverallScoring.OverallRanking.LAP_COUNT,
                      OverallScoring.OverallRankingTiebreaker.FASTEST_LAP_TIME))
              .withEntityId("race1")
              .build();

      race =
          new com.antigravity.race.Race.Builder()
              .model(raceModel)
              .drivers(drivers)
              .track(track)
              .isDemoMode(true)
              .build();
      race.injectProtocols(mock(ProtocolDelegate.class));

      race.changeState(new Racing());
      race.addRaceTime(100.0f);
      assertEquals(100.0f, race.getRaceTime(), 0.001);

      race.changeState(new HeatOver());
      Common.advanceToNextHeat(race);
      assertEquals(0.0f, race.getRaceTime(), 0.001);
    }

    @Test
    public void testTimedRaceTimeResets() {
      long finishValue = 300;
      Race raceModel =
          new Race.Builder()
              .withName("Timed Race")
              .withTrackEntityId("track1")
              .withHeatRotationType(HeatRotationType.RoundRobin)
              .withHeatScoring(
                  new HeatScoring(
                      HeatScoring.FinishMethod.Timed,
                      finishValue,
                      HeatScoring.HeatRanking.LAP_COUNT,
                      HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
                      HeatScoring.AllowFinish.None))
              .withOverallScoring(
                  new OverallScoring(
                      0,
                      OverallScoring.OverallRanking.LAP_COUNT,
                      OverallScoring.OverallRankingTiebreaker.FASTEST_LAP_TIME))
              .withEntityId("race2")
              .build();

      race =
          new com.antigravity.race.Race.Builder()
              .model(raceModel)
              .drivers(drivers)
              .track(track)
              .isDemoMode(true)
              .build();
      race.injectProtocols(mock(ProtocolDelegate.class));

      race.changeState(new Racing());
      assertEquals((float) finishValue, race.getRaceTime(), 0.001);

      race.addRaceTime(-100.0f);
      assertEquals(200.0f, race.getRaceTime(), 0.001);

      race.changeState(new HeatOver());
      Common.advanceToNextHeat(race);
      assertEquals(0.0f, race.getRaceTime(), 0.001);

      race.changeState(new Racing());
      assertEquals((float) finishValue, race.getRaceTime(), 0.001);
    }

    @Test
    public void testRestartHeatResetsTime() {
      Race raceModel =
          new Race.Builder()
              .withName("Restart Test")
              .withTrackEntityId("track1")
              .withHeatScoring(new HeatScoring())
              .withOverallScoring(new OverallScoring())
              .withEntityId("race3")
              .build();

      race =
          new com.antigravity.race.Race.Builder()
              .model(raceModel)
              .drivers(drivers)
              .track(track)
              .isDemoMode(true)
              .build();
      race.injectProtocols(mock(ProtocolDelegate.class));

      race.changeState(new Racing());
      race.addRaceTime(123.45f);
      assertEquals(123.45f, race.getRaceTime(), 0.001);

      race.restartHeat();
      assertEquals(0.0f, race.getRaceTime(), 0.001);
    }
  }

  // =========================================================================
  // 9. Demo and Health Edge Cases
  // =========================================================================
  public static class DemoAndHealthEdgeCases {
    @Test
    public void testDemoModePersistence() {
      com.antigravity.race.Race race =
          new com.antigravity.race.Race.Builder()
              .model(
                  new Race.Builder()
                      .withHeatScoring(new HeatScoring())
                      .withOverallScoring(new OverallScoring())
                      .build())
              .track(
                  new Track.Builder()
                      .name("T")
                      .lanes(Collections.singletonList(new Lane("r", "w", 100)))
                      .build())
              .drivers(
                  Collections.singletonList(new RaceParticipant(new Driver("D", "d", "d1", "1"))))
              .isDemoMode(true)
              .build();

      assertTrue("Race should be in demo mode", race.isDemoMode());
    }

    @Test
    public void testStartRaceBlockedWhenUnhealthy() {
      ProtocolDelegate mockProtocols = mock(ProtocolDelegate.class);
      when(mockProtocols.isHealthy()).thenReturn(false);

      ArduinoConfig cfg = new ArduinoConfig();
      cfg.commPort = "DEMO";

      Track track =
          new Track.Builder()
              .name("T")
              .lanes(Collections.singletonList(new Lane("r", "w", 100)))
              .arduinoConfigs(Collections.singletonList(cfg))
              .build();
      Race model =
          new Race.Builder()
              .withHeatScoring(new HeatScoring())
              .withOverallScoring(new OverallScoring())
              .build();

      com.antigravity.race.Race race =
          new com.antigravity.race.Race.Builder()
              .model(model)
              .track(track)
              .drivers(
                  Collections.singletonList(new RaceParticipant(new Driver("D", "d", "d1", "1"))))
              .isDemoMode(false)
              .build();

      race.injectProtocols(mockProtocols);

      race.startRace();
      assertTrue(race.getState() instanceof NotStarted);
      verify(mockProtocols, never()).startTimer();
    }

    @Test
    public void testStartRaceAllowedWhenHealthy() {
      ProtocolDelegate mockProtocols = mock(ProtocolDelegate.class);
      when(mockProtocols.isHealthy()).thenReturn(true);

      ArduinoConfig cfg = new ArduinoConfig();
      cfg.commPort = "DEMO";

      Track track =
          new Track.Builder()
              .name("T")
              .lanes(Collections.singletonList(new Lane("r", "w", 100)))
              .arduinoConfigs(Collections.singletonList(cfg))
              .build();
      Race model =
          new Race.Builder()
              .withHeatScoring(new HeatScoring())
              .withOverallScoring(new OverallScoring())
              .build();

      com.antigravity.race.Race race =
          new com.antigravity.race.Race.Builder()
              .model(model)
              .track(track)
              .drivers(
                  Collections.singletonList(new RaceParticipant(new Driver("D", "d", "d1", "1"))))
              .isDemoMode(false)
              .build();

      race.injectProtocols(mockProtocols);

      race.startRace();
      assertTrue(race.getState() instanceof Starting);
    }

    @Test
    public void testTeamAndTeammateExport() {
      Driver teammateA = new Driver("Teammate A", "TA", "d1", "1");
      Driver teammateB = new Driver("Teammate B", "TB", "d2", "1");

      List<String> driverIds = new ArrayList<>();
      driverIds.add("d1");
      driverIds.add("d2");
      Team team = new Team("The Team", "team_avatar", driverIds, "t1", "1");

      HeatScoring heatScoring =
          new HeatScoring(
              HeatScoring.FinishMethod.Lap,
              10L,
              HeatScoring.HeatRanking.LAP_COUNT,
              HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
              HeatScoring.AllowFinish.None);

      OverallScoring overallScoring =
          new OverallScoring(
              0,
              OverallScoring.OverallRanking.LAP_COUNT,
              OverallScoring.OverallRankingTiebreaker.FASTEST_LAP_TIME);

      Race raceModel =
          new Race.Builder()
              .withName("Team Race")
              .withTrackEntityId("track1")
              .withHeatRotationType(HeatRotationType.RoundRobin)
              .withHeatScoring(heatScoring)
              .withOverallScoring(overallScoring)
              .withEntityId("race1")
              .build();

      RaceParticipant teamParticipant = new RaceParticipant(team);
      List<Driver> teamDrivers = new ArrayList<>();
      teamDrivers.add(teammateA);
      teamDrivers.add(teammateB);
      teamParticipant.setTeamDrivers(teamDrivers);

      List<RaceParticipant> participants = new ArrayList<>();
      participants.add(teamParticipant);

      List<Lane> lanes = new ArrayList<>();
      lanes.add(new Lane("red", "black", 100));
      Track track =
          new Track.Builder()
              .name("Test Track")
              .lanes(lanes)
              .arduinoConfigs(new ArrayList<>())
              .entityId("track1")
              .id("1")
              .build();

      com.antigravity.race.Race race =
          new com.antigravity.race.Race.Builder()
              .model(raceModel)
              .drivers(participants)
              .track(track)
              .isDemoMode(true)
              .build();
      race.injectProtocols(mock(ProtocolDelegate.class));

      race.changeState(new Racing());
      DriverHeatData dhd = race.getCurrentHeat().getDrivers().get(0);

      dhd.setActualDriver(teammateA);
      dhd.addLap(10.5, false, true);

      dhd.setActualDriver(teammateB);
      dhd.addLap(12.3, false, true);
      dhd.addLap(5.4819876, false, true);

      String csv = CsvExporter.export(race);

      assertTrue("CSV should contain teammate lap time 10.500", csv.contains("10.500"));
      assertTrue("CSV should contain teammate lap time 12.300", csv.contains("12.300"));
      assertTrue("CSV should contain rounded lap time 5.482", csv.contains("5.482"));
      assertFalse(
          "CSV should NOT contain high precision lap time 5.4819876", csv.contains("5.4819876"));

      assertTrue("CSV should contain Team name", csv.contains("The Team"));
      assertTrue("CSV should contain Teammate A", csv.contains("Teammate A"));
      assertTrue("CSV should contain Teammate B", csv.contains("Teammate B"));

      assertFalse("CSV should NOT contain driverId header", csv.contains("driverId"));
      assertTrue("CSV should contain driverName header", csv.contains("driverName"));
      assertTrue("CSV should contain driverNickname header", csv.contains("driverNickname"));
      assertTrue("CSV should contain Teammate A nickname", csv.contains("TA"));
      assertTrue("CSV should contain Teammate B nickname", csv.contains("TB"));

      assertTrue("CSV should contain Heat List section", csv.contains("#Section,Heat List"));
      assertTrue("CSV should contain Heat List table", csv.contains("#Table: Heat List"));
      assertTrue(
          "CSV should contain Heat List headers",
          csv.contains("heatNumber,laneNumber,driverName,driverNickname,teamName"));
      assertTrue(
          "CSV Heat List should contain expected row", csv.contains("1,1,Teammate B,TB,The Team"));

      int predictionsIdx = csv.indexOf("#Section,Race Predictions");
      int standingsIdx = csv.indexOf("#Section,Overall Standings");
      assertTrue("CSV should contain Race Predictions section", predictionsIdx != -1);
      assertTrue("CSV should contain Overall Standings section", standingsIdx != -1);
      assertTrue(
          "Race Predictions section must come before Overall Standings",
          predictionsIdx < standingsIdx);

      race.stop();
    }

    @Test
    public void testPredictionExportWithNoDataFallback() {
      Driver teammateA = new Driver("Teammate A", "TA", "d1", "1");
      List<String> driverIds = new ArrayList<>();
      driverIds.add("d1");
      Team team = new Team("The Team", "team_avatar", driverIds, "t1", "1");

      Race raceModel =
          new Race.Builder()
              .withName("Team Race")
              .withTrackEntityId("track1")
              .withHeatRotationType(HeatRotationType.RoundRobin)
              .withHeatScoring(new HeatScoring())
              .withOverallScoring(new OverallScoring())
              .withEntityId("race1")
              .build();

      RaceParticipant teamParticipant = new RaceParticipant(team);
      teamParticipant.setTeamDrivers(Collections.singletonList(teammateA));

      List<Lane> lanes = Collections.singletonList(new Lane("red", "black", 100));
      Track track = new Track.Builder().name("T").lanes(lanes).build();

      com.antigravity.race.Race race =
          new com.antigravity.race.Race.Builder()
              .model(raceModel)
              .drivers(Collections.singletonList(teamParticipant))
              .track(track)
              .isDemoMode(true)
              .build();
      race.injectProtocols(mock(ProtocolDelegate.class));

      race.changeState(new Racing());
      String csv = CsvExporter.export(race);
      assertTrue(
          "CSV should contain Race Predictions section", csv.contains("#Section,Race Predictions"));
      assertTrue(
          "CSV should contain Pre-Race Projections table header",
          csv.contains("projectedRank,driverName,winProbability,podiumProbability,projectedLaps"));

      int predIdx = csv.indexOf("#Section,Race Predictions");
      int standingsIdx = csv.indexOf("#Section,Overall Standings");
      String predSection = csv.substring(predIdx, standingsIdx);

      assertTrue(
          "CSV prediction row should contain driver name and -- placeholders instead of raw -1",
          predSection.contains("--,The Team,--%,--%,--"));
      assertFalse("CSV prediction section should not output raw -1", predSection.contains("-1"));

      race.stop();
    }

    @Test
    public void testReproduceFewerDriversThanLanes() {
      Race raceModel = mock(Race.class);
      Track track = mock(Track.class);
      List<RaceParticipant> drivers = new ArrayList<>();
      drivers.add(new RaceParticipant(new Driver("D1", "d1", "id1", "1")));
      drivers.add(new RaceParticipant(new Driver("D2", "d2", "id2", "1")));

      List<Lane> lanes = new ArrayList<>();
      lanes.add(new Lane("Red", "red", 1));
      lanes.add(new Lane("Blue", "blue", 2));
      lanes.add(new Lane("White", "white", 3));
      lanes.add(new Lane("Yellow", "yellow", 4));
      when(track.getLanes()).thenReturn(lanes);

      when(raceModel.getHeatRotationType()).thenReturn(HeatRotationType.RoundRobin);
      when(raceModel.getHeatScoring()).thenReturn(new HeatScoring());
      when(raceModel.getOverallScoring()).thenReturn(new OverallScoring());
      when(raceModel.getTrackEntityId()).thenReturn("track1");

      com.antigravity.race.Race race =
          new com.antigravity.race.Race.Builder()
              .model(raceModel)
              .drivers(drivers)
              .track(track)
              .isDemoMode(true)
              .build();

      assertNotNull(race);
      assertEquals(4, race.getHeats().size());

      for (Heat heat : race.getHeats()) {
        assertEquals(4, heat.getDrivers().size());
        int emptyCount = 0;
        int activeCount = 0;
        for (DriverHeatData dhd : heat.getDrivers()) {
          if (dhd.getDriver().getDriver() == Driver.EMPTY_DRIVER) {
            emptyCount++;
          } else {
            activeCount++;
          }
        }
        assertEquals(2, activeCount);
        assertEquals(2, emptyCount);
      }
    }

    @Test
    public void testInitialEmptyHeatAutomaticallySkipped() {
      Track track =
          new Track.Builder()
              .name("T")
              .lanes(Collections.singletonList(new Lane("r", "w", 100)))
              .build();
      Race raceModel =
          new Race.Builder()
              .withName("T1")
              .withHeatScoring(new HeatScoring())
              .withOverallScoring(new OverallScoring())
              .build();

      RaceParticipant emptyPart = new RaceParticipant(Driver.EMPTY_DRIVER);
      DriverHeatData emptyDhd = new DriverHeatData(emptyPart);
      Heat h1 = new Heat(1, Collections.singletonList(emptyDhd), new HeatScoring(), false);

      Driver realDriver = new Driver("Real", "R", "d1", "1");
      RaceParticipant realPart = new RaceParticipant(realDriver);
      DriverHeatData realDhd = new DriverHeatData(realPart);
      Heat h2 = new Heat(2, Collections.singletonList(realDhd), new HeatScoring(), false);

      com.antigravity.race.Race race =
          new com.antigravity.race.Race.Builder()
              .model(raceModel)
              .track(track)
              .drivers(Arrays.asList(emptyPart, realPart))
              .heats(Arrays.asList(h1, h2))
              .isDemoMode(true)
              .build();

      // Heat 1 was empty, so race should have automatically advanced to Heat 2 in NotStarted
      assertEquals(h2, race.getCurrentHeat());
      assertTrue(race.getState() instanceof NotStarted);
    }

    @Test
    public void testEmptyIntermediateAndTrailingHeatsAutomaticallySkipped() {
      Track track =
          new Track.Builder()
              .name("T")
              .lanes(Collections.singletonList(new Lane("r", "w", 100)))
              .build();
      Race raceModel =
          new Race.Builder()
              .withName("T2")
              .withHeatScoring(new HeatScoring())
              .withOverallScoring(new OverallScoring())
              .build();

      Driver realDriver1 = new Driver("Real1", "R1", "d1", "1");
      RaceParticipant realPart1 = new RaceParticipant(realDriver1);
      DriverHeatData realDhd1 = new DriverHeatData(realPart1);
      Heat h1 = new Heat(1, Collections.singletonList(realDhd1), new HeatScoring(), false);

      RaceParticipant emptyPart = new RaceParticipant(Driver.EMPTY_DRIVER);
      DriverHeatData emptyDhd = new DriverHeatData(emptyPart);
      Heat h2 = new Heat(2, Collections.singletonList(emptyDhd), new HeatScoring(), false);

      Driver realDriver2 = new Driver("Real2", "R2", "d2", "1");
      RaceParticipant realPart2 = new RaceParticipant(realDriver2);
      DriverHeatData realDhd2 = new DriverHeatData(realPart2);
      Heat h3 = new Heat(3, Collections.singletonList(realDhd2), new HeatScoring(), false);

      Heat h4 =
          new Heat(
              4,
              Collections.singletonList(new DriverHeatData(emptyPart)),
              new HeatScoring(),
              false);

      com.antigravity.race.Race race =
          new com.antigravity.race.Race.Builder()
              .model(raceModel)
              .track(track)
              .drivers(Arrays.asList(realPart1, emptyPart, realPart2))
              .heats(Arrays.asList(h1, h2, h3, h4))
              .isDemoMode(true)
              .build();

      // Starts on Heat 1
      assertEquals(h1, race.getCurrentHeat());
      assertTrue(race.getState() instanceof NotStarted);

      // Advance past Heat 1 -> skips empty Heat 2 -> lands on Heat 3
      Common.advanceToNextHeat(race);
      assertEquals(h3, race.getCurrentHeat());
      assertTrue(race.getState() instanceof NotStarted);

      // Advance past Heat 3 -> skips empty Heat 4 (last heat) -> transitions to RaceOver
      Common.advanceToNextHeat(race);
      assertTrue(race.getState() instanceof RaceOver);
    }

    @Test
    public void testAllEmptyHeatsTransitionsImmediatelyToRaceOver() {
      Track track =
          new Track.Builder()
              .name("T")
              .lanes(Collections.singletonList(new Lane("r", "w", 100)))
              .build();
      Race raceModel =
          new Race.Builder()
              .withName("T3")
              .withHeatScoring(new HeatScoring())
              .withOverallScoring(new OverallScoring())
              .build();

      RaceParticipant emptyPart = new RaceParticipant(Driver.EMPTY_DRIVER);
      DriverHeatData emptyDhd1 = new DriverHeatData(emptyPart);
      Heat h1 = new Heat(1, Collections.singletonList(emptyDhd1), new HeatScoring(), false);

      DriverHeatData emptyDhd2 = new DriverHeatData(emptyPart);
      Heat h2 = new Heat(2, Collections.singletonList(emptyDhd2), new HeatScoring(), false);

      com.antigravity.race.Race race =
          new com.antigravity.race.Race.Builder()
              .model(raceModel)
              .track(track)
              .drivers(Collections.singletonList(emptyPart))
              .heats(Arrays.asList(h1, h2))
              .isDemoMode(true)
              .build();

      // All heats empty -> should end up in RaceOver
      assertTrue(race.getState() instanceof RaceOver);
    }
  }
}
