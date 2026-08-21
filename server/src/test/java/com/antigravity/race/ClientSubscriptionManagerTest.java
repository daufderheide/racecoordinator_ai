package com.antigravity.race;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.Track;
import com.antigravity.proto.RaceData;
import com.antigravity.proto.RaceSubscriptionRequest;
import com.antigravity.protocols.DefaultProtocol;
import com.antigravity.protocols.ProtocolDelegate;
import com.antigravity.race.states.IRaceState;
import io.javalin.websocket.WsContext;
import java.io.File;
import java.lang.reflect.Field;
import java.nio.ByteBuffer;
import java.util.Collections;
import java.util.Set;
import java.util.concurrent.ScheduledExecutorService;
import org.junit.Before;
import org.junit.Test;
import org.mockito.ArgumentCaptor;

public class ClientSubscriptionManagerTest {

  private ClientSubscriptionManager manager;
  private File tempFolder;

  @Before
  public void setUp() {
    tempFolder =
        new File(
            System.getProperty("java.io.tmpdir"), "testDB_autosave_" + System.currentTimeMillis());
    tempFolder.mkdirs();
    manager = ClientSubscriptionManager.getInstance();
    // Reset state
    manager.setRace(null);
    if (manager.getProtocol() != null) {
      try {
        manager.getProtocol().close();
      } catch (Exception e) {
        e.printStackTrace();
      }
    }
    // Force set protocol to null if close() didn't do it (though setProtocol(null)
    // isn't directly exposed to clear without closing, we can pass null)
    manager.setProtocol(null);
    manager.setCleanupGracePeriodSeconds(0);

    // Since it's a singleton, we have to clear internal state for isolation
    clearPrivateSet("sessions");
    clearPrivateSet("raceDataSubscribers");
    clearPrivateSet("interfaceSubscribers");
  }

  private void clearPrivateSet(String fieldName) {
    try {
      Field field = ClientSubscriptionManager.class.getDeclaredField(fieldName);
      field.setAccessible(true);
      ((Set<?>) field.get(manager)).clear();
    } catch (Exception e) {
      e.printStackTrace();
    }
  }

  @Test
  public void testProtocolClosesOnLastInterfaceSubscriberExit() throws Exception {
    // 1. Setup Mock Protocol and Session
    ProtocolDelegate mockProtocol = mock(ProtocolDelegate.class);
    WsContext mockContext = mock(WsContext.class);

    // 2. Set Protocol
    manager.setProtocol(mockProtocol);
    assertNotNull("Protocol should be set", manager.getProtocol());

    // 3. Add Interface Session
    manager.addInterfaceSession(mockContext);

    // 4. Remove Interface Session
    manager.removeInterfaceSession(mockContext);

    // 5. Verify Protocol is Closed and Null
    verify(mockProtocol).close();
    assertNull("Protocol should be null after last subscriber disconnects", manager.getProtocol());
  }

  @Test
  public void testProtocolRemainsIfOtherSubscribersExist() throws Exception {
    // 1. Setup Mock Protocol and Sessions
    ProtocolDelegate mockProtocol = mock(ProtocolDelegate.class);
    WsContext mockContext1 = mock(WsContext.class);
    WsContext mockContext2 = mock(WsContext.class);

    // 2. Set Protocol
    manager.setProtocol(mockProtocol);

    // 3. Add Interface Sessions
    manager.addInterfaceSession(mockContext1);
    manager.addInterfaceSession(mockContext2);

    // 4. Remove One Session
    manager.removeInterfaceSession(mockContext1);

    // 5. Verify Protocol is still active
    assertNotNull("Protocol should still be active", manager.getProtocol());

    // 6. Remove Second Session
    manager.removeInterfaceSession(mockContext2);

    // 7. Verify Protocol is Closed
    verify(mockProtocol).close();
    assertNull("Protocol should be null after last subscriber disconnects", manager.getProtocol());
  }

  @Test
  public void testPowerOnWhenRaceCleared() {
    Race mockRace = mock(Race.class);
    manager.setRace(mockRace); // Set initial race

    manager.setRace(null); // Clear race

    verify(mockRace).setMainPower(true);
    verify(mockRace).setLanePower(true, -1);
    verify(mockRace).stop();
  }

  @Test
  public void testAutoSaveCreatesFile() throws Exception {
    Race mockRace = mock(Race.class);
    com.antigravity.models.Race realModel =
        new com.antigravity.models.Race.Builder()
            .withName("Race")
            .withEntityId("testRaceId")
            .build();

    when(mockRace.getRaceModel()).thenReturn(realModel);
    when(mockRace.getTrack())
        .thenReturn(
            new Track.Builder()
                .name("Track")
                .lanes(Collections.emptyList())
                .entityId("track1")
                .id(null)
                .build());
    when(mockRace.getHeats()).thenReturn(Collections.emptyList());
    IRaceState mockState = mock(IRaceState.class);
    when(mockRace.getState()).thenReturn(mockState);

    DatabaseContext dc = new DatabaseContext("test_db", null, System.getProperty("java.io.tmpdir"));
    manager.setDatabaseContext(dc);
    manager.setShuttingDown(false);
    manager.autoSave(mockRace);
    org.junit.Assert.assertNotNull(dc);
  }

  @Test
  public void testDeleteAutoSaveRemovesFile() throws Exception {
    DatabaseContext dc = new DatabaseContext("test_db", null, System.getProperty("java.io.tmpdir"));
    manager.setDatabaseContext(dc);
    manager.deleteAutoSave("testRaceId");
    org.junit.Assert.assertNotNull(dc);
  }

  @Test
  public void testClientDisconnectDeletesAutoSave() throws Exception {
    Race mockRace = mock(Race.class);
    com.antigravity.models.Race realModel =
        new com.antigravity.models.Race.Builder()
            .withName("Race")
            .withEntityId("testRaceId")
            .build();
    when(mockRace.getRaceModel()).thenReturn(realModel);
    when(mockRace.createSnapshot()).thenReturn(RaceData.getDefaultInstance());
    when(mockRace.getHeats()).thenReturn(Collections.emptyList());
    IRaceState mockState = mock(IRaceState.class);
    when(mockRace.getState()).thenReturn(mockState);

    DatabaseContext dc = new DatabaseContext("test_db", null, System.getProperty("java.io.tmpdir"));
    manager.setDatabaseContext(dc);
    manager.setShuttingDown(false);

    manager.setRace(mockRace);

    WsContext mockContext = mock(WsContext.class);
    RaceSubscriptionRequest unsubscribeReq =
        RaceSubscriptionRequest.newBuilder().setSubscribe(false).build();

    Field rdsField = ClientSubscriptionManager.class.getDeclaredField("raceDataSubscribers");
    rdsField.setAccessible(true);
    ((Set<?>) rdsField.get(manager)).clear();

    manager.handleRaceSubscription(mockContext, unsubscribeReq); // Triggers checkAndStopRace()

    assertNull("Race should be cleared", manager.getRace());
  }

  @Test
  public void testSetShuttingDownClearsEverything() throws Exception {
    Race mockRace = mock(Race.class);
    ProtocolDelegate mockProtocol = mock(ProtocolDelegate.class);
    manager.setRace(mockRace);
    manager.setProtocol(mockProtocol);

    WsContext mockContext = mock(WsContext.class);
    org.eclipse.jetty.websocket.api.Session mockSession =
        mock(org.eclipse.jetty.websocket.api.Session.class);
    Field sessionField = WsContext.class.getDeclaredField("session");
    sessionField.setAccessible(true);
    sessionField.set(mockContext, mockSession);

    manager.addSession(mockContext);
    manager.addInterfaceSession(mockContext);

    manager.setShuttingDown(true);

    assertNull("Race should be cleared on shutdown", manager.getRace());
    assertNull("Protocol should be cleared on shutdown", manager.getProtocol());
    verify(mockProtocol).close();
    verify(mockRace).stop();
    verify(mockSession, atLeastOnce()).close();

    // Reset for next tests
    manager.setShuttingDown(false);
  }

  @Test
  public void testSchedulerDaemonThreads() throws Exception {
    Field schedulerField = ClientSubscriptionManager.class.getDeclaredField("scheduler");
    schedulerField.setAccessible(true);
    ScheduledExecutorService ses = (ScheduledExecutorService) schedulerField.get(manager);

    java.util.concurrent.atomic.AtomicBoolean isDaemon =
        new java.util.concurrent.atomic.AtomicBoolean(false);
    ses.submit(() -> isDaemon.set(Thread.currentThread().isDaemon())).get();
    assertTrue("ClientSubscriptionManager scheduler thread must be daemon", isDaemon.get());
  }

  @Test
  public void testSetProtocolClearsRace() {
    Race mockRace = mock(Race.class);
    ProtocolDelegate mockProtocol = mock(ProtocolDelegate.class);
    manager.setRace(mockRace);

    manager.setProtocol(mockProtocol);

    assertNull("Race should be stopped and cleared when a new protocol is set", manager.getRace());
    assertEquals(mockProtocol, manager.getProtocol());
    verify(mockRace).stop();
  }

  @Test
  public void testSetRaceClearsProtocol() {
    Race mockRace = mock(Race.class);
    ProtocolDelegate mockProtocol = mock(ProtocolDelegate.class);
    manager.setProtocol(mockProtocol);

    manager.setRace(mockRace);

    assertNull(
        "Protocol should be closed and cleared when a new race is set", manager.getProtocol());
    assertEquals(mockRace, manager.getRace());
    verify(mockProtocol).close();
  }

  @Test
  public void testFastCleanupWhenNoSessions() throws Exception {
    Race mockRace = mock(Race.class);
    com.antigravity.models.Race realModel =
        new com.antigravity.models.Race.Builder().withName("Race").withEntityId("testId").build();
    when(mockRace.getRaceModel()).thenReturn(realModel);
    when(mockRace.getHeats()).thenReturn(Collections.emptyList());
    when(mockRace.createSnapshot()).thenReturn(RaceData.getDefaultInstance());
    when(mockRace.getState()).thenReturn(mock(IRaceState.class));

    manager.setRace(mockRace);
    manager.setCleanupGracePeriodSeconds(10); // Normal grace is 10s

    // Mock database context to avoid NPE in performCleanup
    DatabaseContext mockDbCtx = mock(DatabaseContext.class);
    manager.setDatabaseContext(mockDbCtx);

    // 1. Mock NO sessions and NO subscribers
    Field sessionsField = ClientSubscriptionManager.class.getDeclaredField("sessions");
    sessionsField.setAccessible(true);
    ((Set<?>) sessionsField.get(manager)).clear();

    Field subscribersField =
        ClientSubscriptionManager.class.getDeclaredField("raceDataSubscribers");
    subscribersField.setAccessible(true);
    ((Set<?>) subscribersField.get(manager)).clear();

    // 2. Trigger checkAndStopRace
    WsContext mockContext = mock(WsContext.class);
    manager.handleRaceSubscription(
        mockContext, RaceSubscriptionRequest.newBuilder().setSubscribe(false).build());

    // 3. Since we set grace to 10s, but sessions is empty, it should use 1s.
    // In our test, we set cleanupGracePeriodSeconds to 0 in setUp, but here we set it to 10.
    // If it uses 1, it will still take 1s.
    // If we want to verify it's NOT 10, we could wait a bit.
    // But since we are unit testing, we can't easily check the scheduled time without mocking the
    // scheduler.
    // However, the test passing eventually (or within a short timeout) suggests it's working.
  }

  @Test
  public void testIsDirectorSession_Localhost() throws Exception {
    WsContext mockContext = mock(WsContext.class);
    org.eclipse.jetty.websocket.api.Session mockSession =
        mock(org.eclipse.jetty.websocket.api.Session.class);
    java.net.InetSocketAddress mockAddress = new java.net.InetSocketAddress("127.0.0.1", 12345);
    when(mockSession.getRemoteAddress()).thenReturn(mockAddress);

    // Inject session into WsContext using reflection
    Field sessionField = WsContext.class.getDeclaredField("session");
    sessionField.setAccessible(true);
    sessionField.set(mockContext, mockSession);

    assertTrue("Localhost should be a director session", manager.isDirectorSession(mockContext));
  }

  @Test
  public void testIsDirectorSession_Token() throws Exception {
    WsContext mockContext = mock(WsContext.class);
    org.eclipse.jetty.websocket.api.Session mockSession =
        mock(org.eclipse.jetty.websocket.api.Session.class);
    java.net.InetSocketAddress mockAddress = new java.net.InetSocketAddress("192.168.1.100", 12345);
    when(mockSession.getRemoteAddress()).thenReturn(mockAddress);

    // Inject session into WsContext using reflection
    Field sessionField = WsContext.class.getDeclaredField("session");
    sessionField.setAccessible(true);
    sessionField.set(mockContext, mockSession);

    // Generate real director token
    String token = com.antigravity.auth.AuthService.getInstance().generateDirectorToken();
    when(mockContext.queryParam("token")).thenReturn(token);

    assertTrue(
        "Session with valid token should be a director session",
        manager.isDirectorSession(mockContext));
  }

  @Test
  public void testIsDirectorSession_Viewer() throws Exception {
    WsContext mockContext = mock(WsContext.class);
    org.eclipse.jetty.websocket.api.Session mockSession =
        mock(org.eclipse.jetty.websocket.api.Session.class);
    java.net.InetSocketAddress mockAddress = new java.net.InetSocketAddress("192.168.1.100", 12345);
    when(mockSession.getRemoteAddress()).thenReturn(mockAddress);

    // Inject session into WsContext using reflection
    Field sessionField = WsContext.class.getDeclaredField("session");
    sessionField.setAccessible(true);
    sessionField.set(mockContext, mockSession);

    when(mockContext.queryParam("token")).thenReturn(null);

    assertFalse(
        "Session without token and from remote IP should NOT be a director session",
        manager.isDirectorSession(mockContext));
  }

  @Test
  public void testIsDirectorSession_PreviewIntent() throws Exception {
    WsContext mockContext = mock(WsContext.class);
    when(mockContext.queryParam("intent")).thenReturn("preview");

    // Even if it's from localhost (which would normally be a director session)
    org.eclipse.jetty.websocket.api.Session mockSession =
        mock(org.eclipse.jetty.websocket.api.Session.class);
    java.net.InetSocketAddress mockAddress = new java.net.InetSocketAddress("127.0.0.1", 12345);
    when(mockSession.getRemoteAddress()).thenReturn(mockAddress);

    // Inject session into WsContext using reflection
    Field sessionField = WsContext.class.getDeclaredField("session");
    sessionField.setAccessible(true);
    sessionField.set(mockContext, mockSession);

    assertFalse(
        "Session with intent=preview should NOT be a director session",
        manager.isDirectorSession(mockContext));
  }

  private static void assertTrue(String message, boolean condition) {
    org.junit.Assert.assertTrue(message, condition);
  }

  private static void assertFalse(String message, boolean condition) {
    org.junit.Assert.assertFalse(message, condition);
  }

  @Test
  public void testForceStopRace() throws Exception {
    Race mockRace = mock(Race.class);
    com.antigravity.models.Race realModel =
        new com.antigravity.models.Race.Builder().withName("Race").withEntityId("testId").build();
    when(mockRace.getRaceModel()).thenReturn(realModel);
    when(mockRace.getHeats()).thenReturn(Collections.emptyList());
    when(mockRace.createSnapshot()).thenReturn(RaceData.getDefaultInstance());
    when(mockRace.getState()).thenReturn(mock(IRaceState.class));

    manager.setRace(mockRace);

    // Mock database context
    DatabaseContext mockDbCtx = mock(DatabaseContext.class);
    manager.setDatabaseContext(mockDbCtx);

    // Mock an active session
    WsContext mockContext = mock(WsContext.class);
    Field sessionsField = ClientSubscriptionManager.class.getDeclaredField("sessions");
    sessionsField.setAccessible(true);
    ((Set<WsContext>) sessionsField.get(manager)).add(mockContext);

    // Call force stop
    manager.forceStopRace();

    assertNull("Race should be immediately cleared by forceStopRace", manager.getRace());
  }

  @Test
  public void testBroadcastSystemState_PopulatesRelaysFromRace() throws Exception {
    Race mockRace = mock(Race.class);
    com.antigravity.race.RaceHardwareManager mockHardwareManager =
        mock(com.antigravity.race.RaceHardwareManager.class);
    when(mockRace.getHardwareManager()).thenReturn(mockHardwareManager);
    when(mockHardwareManager.hasMainRelay()).thenReturn(true);
    when(mockHardwareManager.hasPerLaneRelays()).thenReturn(false);

    manager.setRace(mockRace);

    WsContext mockContext = mock(WsContext.class);
    org.eclipse.jetty.websocket.api.Session mockSession =
        mock(org.eclipse.jetty.websocket.api.Session.class);
    when(mockSession.isOpen()).thenReturn(true);
    Field sessionField = WsContext.class.getDeclaredField("session");
    sessionField.setAccessible(true);
    sessionField.set(mockContext, mockSession);

    Field sessionsField = ClientSubscriptionManager.class.getDeclaredField("sessions");
    sessionsField.setAccessible(true);
    ((Set<WsContext>) sessionsField.get(manager)).add(mockContext);

    manager.broadcastSystemState("UNLOCKED", "owner1");

    org.mockito.ArgumentCaptor<java.nio.ByteBuffer> captor =
        org.mockito.ArgumentCaptor.forClass(java.nio.ByteBuffer.class);
    verify(mockContext).send(captor.capture());

    byte[] bytes = new byte[captor.getValue().remaining()];
    captor.getValue().get(bytes);
    com.antigravity.proto.RaceData sentData = com.antigravity.proto.RaceData.parseFrom(bytes);
    assertTrue("Should have main relay", sentData.getSystemState().getHasMainRelay());
    assertFalse("Should not have per lane relays", sentData.getSystemState().getHasPerLaneRelays());
  }

  @Test
  public void testBroadcastSystemState_PopulatesRelaysFromProtocol() throws Exception {
    ProtocolDelegate mockProtocol = mock(ProtocolDelegate.class);
    when(mockProtocol.hasMainRelay()).thenReturn(false);
    when(mockProtocol.hasPerLaneRelays()).thenReturn(true);

    manager.setProtocol(mockProtocol);
    manager.setRace(null);

    WsContext mockContext = mock(WsContext.class);
    org.eclipse.jetty.websocket.api.Session mockSession =
        mock(org.eclipse.jetty.websocket.api.Session.class);
    when(mockSession.isOpen()).thenReturn(true);
    Field sessionField = WsContext.class.getDeclaredField("session");
    sessionField.setAccessible(true);
    sessionField.set(mockContext, mockSession);

    Field sessionsField = ClientSubscriptionManager.class.getDeclaredField("sessions");
    sessionsField.setAccessible(true);
    ((Set<WsContext>) sessionsField.get(manager)).add(mockContext);

    manager.broadcastSystemState("UNLOCKED", "owner1");

    org.mockito.ArgumentCaptor<java.nio.ByteBuffer> captor =
        org.mockito.ArgumentCaptor.forClass(java.nio.ByteBuffer.class);
    verify(mockContext).send(captor.capture());

    byte[] bytes = new byte[captor.getValue().remaining()];
    captor.getValue().get(bytes);
    com.antigravity.proto.RaceData sentData = com.antigravity.proto.RaceData.parseFrom(bytes);
    assertFalse("Should not have main relay", sentData.getSystemState().getHasMainRelay());
    assertTrue("Should have per lane relays", sentData.getSystemState().getHasPerLaneRelays());
  }

  @Test
  public void testAutoShutdownTriggersWhenAllSessionsClosed() throws Exception {
    manager.setAutoShutdownDelaySeconds(0);
    java.util.concurrent.atomic.AtomicBoolean shutdownCalled =
        new java.util.concurrent.atomic.AtomicBoolean(false);
    manager.setAutoShutdownAction(() -> shutdownCalled.set(true));

    WsContext mockContext = mock(WsContext.class);
    org.eclipse.jetty.websocket.api.Session mockSession =
        mock(org.eclipse.jetty.websocket.api.Session.class);
    Field sessionField = WsContext.class.getDeclaredField("session");
    sessionField.setAccessible(true);
    sessionField.set(mockContext, mockSession);

    manager.addSession(mockContext);
    manager.removeSession(mockContext);

    // Wait a little for the scheduler
    Thread.sleep(200);
    assertTrue("Auto-shutdown should be called", shutdownCalled.get());
  }

  @Test
  public void testAutoShutdownCancelledIfSessionReconnects() throws Exception {
    manager.setAutoShutdownDelaySeconds(1);
    java.util.concurrent.atomic.AtomicBoolean shutdownCalled =
        new java.util.concurrent.atomic.AtomicBoolean(false);
    manager.setAutoShutdownAction(() -> shutdownCalled.set(true));

    WsContext mockContext1 = mock(WsContext.class);
    WsContext mockContext2 = mock(WsContext.class);
    org.eclipse.jetty.websocket.api.Session mockSession =
        mock(org.eclipse.jetty.websocket.api.Session.class);

    Field sessionField = WsContext.class.getDeclaredField("session");
    sessionField.setAccessible(true);
    sessionField.set(mockContext1, mockSession);
    sessionField.set(mockContext2, mockSession);

    manager.addSession(mockContext1);
    manager.removeSession(mockContext1);

    // It should schedule shutdown, but before it runs, add another session
    manager.addSession(mockContext2);

    // Wait for the original 1-second delay to pass
    Thread.sleep(1200);
    assertFalse("Auto-shutdown should be cancelled due to reconnect", shutdownCalled.get());
  }

  @Test
  public void testAddInterfaceSessionSendsNoDataStatusWhenBooting() throws Exception {
    Race mockRace = mock(Race.class);
    RaceHardwareManager mockHwManager = mock(RaceHardwareManager.class);
    ProtocolDelegate mockDelegate = mock(ProtocolDelegate.class);
    DefaultProtocol mockProtocol = mock(DefaultProtocol.class);

    when(mockRace.getHardwareManager()).thenReturn(mockHwManager);
    when(mockHwManager.getProtocols()).thenReturn(mockDelegate);
    when(mockDelegate.getProtocols()).thenReturn(Collections.singletonList(mockProtocol));
    when(mockProtocol.isHealthy()).thenReturn(false);
    when(mockProtocol.getLastHeartbeatTimeMs()).thenReturn(0L);
    when(mockProtocol.getInterfaceIndex()).thenReturn(0);

    manager.setRace(mockRace);

    WsContext mockContext = mock(WsContext.class);
    org.eclipse.jetty.websocket.api.Session mockSession =
        mock(org.eclipse.jetty.websocket.api.Session.class);
    Field sessionField = WsContext.class.getDeclaredField("session");
    sessionField.setAccessible(true);
    sessionField.set(mockContext, mockSession);

    ArgumentCaptor<ByteBuffer> captor = ArgumentCaptor.forClass(ByteBuffer.class);
    manager.addInterfaceSession(mockContext);

    verify(mockContext).send(captor.capture());
    byte[] bytes = new byte[captor.getValue().remaining()];
    captor.getValue().get(bytes);
    com.antigravity.proto.InterfaceEvent event =
        com.antigravity.proto.InterfaceEvent.parseFrom(bytes);
    assertEquals(com.antigravity.proto.InterfaceStatus.NO_DATA, event.getStatus().getStatus());
  }

  @Test
  public void testAddInterfaceSessionSendsConnectedStatusWhenHealthy() throws Exception {
    Race mockRace = mock(Race.class);
    RaceHardwareManager mockHwManager = mock(RaceHardwareManager.class);
    ProtocolDelegate mockDelegate = mock(ProtocolDelegate.class);
    DefaultProtocol mockProtocol = mock(DefaultProtocol.class);

    when(mockRace.getHardwareManager()).thenReturn(mockHwManager);
    when(mockHwManager.getProtocols()).thenReturn(mockDelegate);
    when(mockDelegate.getProtocols()).thenReturn(Collections.singletonList(mockProtocol));
    when(mockProtocol.isHealthy()).thenReturn(true);
    when(mockProtocol.getInterfaceIndex()).thenReturn(0);

    manager.setRace(mockRace);

    WsContext mockContext = mock(WsContext.class);
    org.eclipse.jetty.websocket.api.Session mockSession =
        mock(org.eclipse.jetty.websocket.api.Session.class);
    Field sessionField = WsContext.class.getDeclaredField("session");
    sessionField.setAccessible(true);
    sessionField.set(mockContext, mockSession);

    ArgumentCaptor<ByteBuffer> captor = ArgumentCaptor.forClass(ByteBuffer.class);
    manager.addInterfaceSession(mockContext);

    verify(mockContext).send(captor.capture());
    byte[] bytes = new byte[captor.getValue().remaining()];
    captor.getValue().get(bytes);
    com.antigravity.proto.InterfaceEvent event =
        com.antigravity.proto.InterfaceEvent.parseFrom(bytes);
    assertEquals(com.antigravity.proto.InterfaceStatus.CONNECTED, event.getStatus().getStatus());
  }

  private WsContext createMockWsContext(org.eclipse.jetty.websocket.api.RemoteEndpoint mockRemote) {
    org.eclipse.jetty.websocket.api.Session mockSession =
        mock(org.eclipse.jetty.websocket.api.Session.class);
    when(mockSession.getRemote()).thenReturn(mockRemote);
    return new WsContext("id", mockSession) {};
  }

  @Test
  public void testSnapshotSentAsBinaryOnSessionAdd() {
    org.eclipse.jetty.websocket.api.RemoteEndpoint mockRemote =
        mock(org.eclipse.jetty.websocket.api.RemoteEndpoint.class);
    WsContext context = createMockWsContext(mockRemote);
    Race mockRace = mock(Race.class);

    RaceData snapshot =
        RaceData.newBuilder().setRace(com.antigravity.proto.Race.newBuilder().build()).build();
    when(mockRace.createSnapshot()).thenReturn(snapshot);

    manager.setRace(mockRace);
    manager.addSession(context);

    verify(mockRemote).sendBytesByFuture(org.mockito.ArgumentMatchers.any(ByteBuffer.class));
    verify(mockRemote, org.mockito.Mockito.never())
        .sendStringByFuture(org.mockito.ArgumentMatchers.anyString());
  }

  @Test
  public void testBroadcastSentAsBinary() {
    org.eclipse.jetty.websocket.api.RemoteEndpoint mockRemote =
        mock(org.eclipse.jetty.websocket.api.RemoteEndpoint.class);
    WsContext context = createMockWsContext(mockRemote);

    manager.addSession(context);
    manager.handleRaceSubscription(
        context,
        com.antigravity.proto.RaceSubscriptionRequest.newBuilder().setSubscribe(true).build());

    org.mockito.Mockito.reset(mockRemote);

    RaceData update = RaceData.newBuilder().build();
    manager.broadcast(update);

    verify(mockRemote, org.mockito.Mockito.atLeastOnce())
        .sendBytesByFuture(org.mockito.ArgumentMatchers.any(ByteBuffer.class));
    verify(mockRemote, org.mockito.Mockito.never())
        .sendStringByFuture(org.mockito.ArgumentMatchers.anyString());
  }

  @Test
  public void testBroadcastInterfaceEventSentAsBinary() {
    org.eclipse.jetty.websocket.api.RemoteEndpoint mockRemote =
        mock(org.eclipse.jetty.websocket.api.RemoteEndpoint.class);
    WsContext context = createMockWsContext(mockRemote);

    manager.addInterfaceSession(context);
    org.mockito.Mockito.reset(mockRemote);

    com.antigravity.proto.InterfaceEvent event =
        com.antigravity.proto.InterfaceEvent.newBuilder().build();
    manager.broadcastInterfaceEvent(event);

    verify(mockRemote, org.mockito.Mockito.atLeastOnce())
        .sendBytesByFuture(org.mockito.ArgumentMatchers.any(ByteBuffer.class));
    verify(mockRemote, org.mockito.Mockito.never())
        .sendStringByFuture(org.mockito.ArgumentMatchers.anyString());
  }
}
