package com.antigravity.race;

import static org.junit.Assert.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.timeout;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.List;

import org.bson.types.ObjectId;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.ArgumentCaptor;

import com.antigravity.models.Driver;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.Lane;
import com.antigravity.models.Track;
import com.antigravity.proto.RaceData;
import com.antigravity.proto.RaceState;
import com.antigravity.protocols.arduino.ArduinoConfig;
import com.antigravity.race.states.HeatOver;
import com.antigravity.race.states.RaceOver;
import com.antigravity.race.states.Racing;

import io.javalin.websocket.WsContext;

public class RaceStateTest {

  private Race race;
  private WsContext currentMockWsContext;

  @Before
  public void setUp() throws Exception {
    // Setup Mocks and Real Objects
    ArduinoConfig mockConfig = mock(ArduinoConfig.class);

    List<Lane> lanes = new ArrayList<>();
    lanes.add(new Lane("red", "black", 100));

    Track realTrack = new Track(
        "Test Track",
        lanes,
        mockConfig,
        "track1",
        new ObjectId());

    com.antigravity.models.HeatScoring mockHeatScoring = mock(com.antigravity.models.HeatScoring.class);
    when(mockHeatScoring.getHeatRanking()).thenReturn(com.antigravity.models.HeatScoring.HeatRanking.LAP_COUNT);
    when(mockHeatScoring.getHeatRankingTiebreaker())
        .thenReturn(com.antigravity.models.HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME);
    when(mockHeatScoring.getFinishMethod()).thenReturn(com.antigravity.models.HeatScoring.FinishMethod.Timed);
    when(mockHeatScoring.getFinishValue()).thenReturn(100L); // 100 seconds

    com.antigravity.models.OverallScoring mockOverallScoring = mock(com.antigravity.models.OverallScoring.class);
    when(mockOverallScoring.getRankingMethod())
        .thenReturn(com.antigravity.models.OverallScoring.OverallRanking.LAP_COUNT);
    when(mockOverallScoring.getTiebreaker())
        .thenReturn(com.antigravity.models.OverallScoring.OverallRankingTiebreaker.FASTEST_LAP_TIME);

    com.antigravity.models.Race realRaceModel = new com.antigravity.models.Race(
        "Test Race",
        "track1",
        HeatRotationType.RoundRobin,
        mockHeatScoring,
        mockOverallScoring,
        "race1",
        new ObjectId());

    List<RaceParticipant> drivers = new ArrayList<>();
    Driver realDriver = new Driver("Test Driver", "D1", "driver1", new ObjectId());
    RaceParticipant participant = new RaceParticipant(realDriver, "participant1");
    drivers.add(participant);

    race = new Race(realRaceModel, drivers, realTrack, true); // true for DemoMode
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

    currentMockWsContext = mock(WsContext.class);
    org.eclipse.jetty.websocket.api.Session mockSession = mock(org.eclipse.jetty.websocket.api.Session.class);
    org.eclipse.jetty.websocket.api.RemoteEndpoint mockRemote = mock(
        org.eclipse.jetty.websocket.api.RemoteEndpoint.class);

    when(mockSession.isOpen()).thenReturn(true);
    when(mockSession.getRemote()).thenReturn(mockRemote);

    injectSession(currentMockWsContext, mockSession);

    ClientSubscriptionManager.getInstance().addSession(currentMockWsContext);
    ClientSubscriptionManager.getInstance().handleRaceSubscription(currentMockWsContext,
        com.antigravity.proto.RaceSubscriptionRequest.newBuilder().setSubscribe(true).build());
  }

  private void injectSession(WsContext ctx, org.eclipse.jetty.websocket.api.Session session) throws Exception {
    java.lang.reflect.Field sessionField = null;
    try {
      sessionField = WsContext.class.getDeclaredField("session");
    } catch (NoSuchFieldException e) {
      throw e;
    }
    sessionField.setAccessible(true);
    sessionField.set(ctx, session);
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

  private void verifyBroadcast(RaceState expectedState) {
    try {
      java.lang.reflect.Field sessionField = WsContext.class.getDeclaredField("session");
      sessionField.setAccessible(true);
      org.eclipse.jetty.websocket.api.Session session = (org.eclipse.jetty.websocket.api.Session) sessionField
          .get(currentMockWsContext);
      org.eclipse.jetty.websocket.api.RemoteEndpoint remote = session.getRemote();

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
            if (raceData.getRaceState() == expectedState)
              found = true;
          } else if (raceData.hasRace()) {
            capturedStates.append("Race.State:").append(raceData.getRace().getState()).append(", ");
            if (raceData.getRace().getState() == expectedState)
              found = true;
          } else {
            capturedStates.append("UnknownData, ");
          }

          if (found)
            break;
        } catch (Exception e) {
          capturedStates.append("ParseError, ");
        }
      }
      if (!found) {
        assertEquals("Expected state broadcast not found. Captured: " + capturedStates.toString(), expectedState.name(),
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
}
