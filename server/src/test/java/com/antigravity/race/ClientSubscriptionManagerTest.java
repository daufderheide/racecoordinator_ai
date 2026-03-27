package com.antigravity.race;

import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.assertFalse;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.io.File;
import java.util.Collections;

import org.junit.Before;
import org.junit.Test;

import com.antigravity.context.DatabaseContext;
import com.antigravity.protocols.IProtocol;

import io.javalin.websocket.WsContext;

public class ClientSubscriptionManagerTest {

  private ClientSubscriptionManager manager;
  private File tempFolder;

  @Before
  public void setUp() {
    tempFolder = new File(System.getProperty("java.io.tmpdir"), "testDB_autosave_" + System.currentTimeMillis());
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

    // We need to clear sessions, but there is no public method to clear them.
    // However, for unit testing we can assume start fresh or we might need to rely
    // on clear side effects.
    // Since it's a singleton, we have to be careful.
    // Let's rely on removeSession to clear things up if we track them.
  }

  @Test
  public void testProtocolClosesOnLastInterfaceSubscriberExit() throws Exception {
    // 1. Setup Mock Protocol and Session
    IProtocol mockProtocol = mock(IProtocol.class);
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
    IProtocol mockProtocol = mock(IProtocol.class);
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
    com.antigravity.models.Race realModel = new com.antigravity.models.Race.Builder().withName("Race").withTrackEntityId("track1").withEntityId("testRaceId").build();

    when(mockRace.getRaceModel()).thenReturn(realModel);
    when(mockRace.getTrack())
        .thenReturn(new com.antigravity.models.Track("Track", Collections.emptyList(), "track1", null));
    when(mockRace.getDrivers()).thenReturn(Collections.emptyList());
    when(mockRace.getHeats()).thenReturn(Collections.emptyList());
    com.antigravity.race.states.IRaceState mockState = mock(com.antigravity.race.states.IRaceState.class);
    when(mockRace.getState()).thenReturn(mockState);

    DatabaseContext mockDbCtx = mock(DatabaseContext.class);
    when(mockDbCtx.getCurrentDatabaseName()).thenReturn("testDB");
    when(mockDbCtx.getDataRoot()).thenReturn(tempFolder.getAbsolutePath() + File.separator);

    manager.setDatabaseContext(mockDbCtx);
    manager.setShuttingDown(false);
    manager.autoSave(mockRace);

    File saveDir = new File(tempFolder.getAbsolutePath() + File.separator + "testDB" + File.separator + "saved_races");
    File expectedFile = new File(saveDir, "autosave_testRaceId.json");
    assertTrue("Auto-save file should be created", expectedFile.exists());
  }

  @Test
  public void testDeleteAutoSaveRemovesFile() throws Exception {
    DatabaseContext mockDbCtx = mock(DatabaseContext.class);
    when(mockDbCtx.getCurrentDatabaseName()).thenReturn("testDB");
    when(mockDbCtx.getDataRoot()).thenReturn(tempFolder.getAbsolutePath() + File.separator);

    manager.setDatabaseContext(mockDbCtx);

    File saveDir = new File(tempFolder.getAbsolutePath() + File.separator + "testDB" + File.separator + "saved_races");
    saveDir.mkdirs();
    File expectedFile = new File(saveDir, "autosave_testRaceId.json");
    expectedFile.createNewFile();
    assertTrue(expectedFile.exists());

    manager.deleteAutoSave("testRaceId");

    assertFalse("Auto-save file should be deleted", expectedFile.exists());
  }

  @Test
  public void testClientDisconnectDeletesAutoSave() throws Exception {
    Race mockRace = mock(Race.class);
    com.antigravity.models.Race realModel = new com.antigravity.models.Race.Builder().withName("Race").withTrackEntityId("track1").withEntityId("testRaceId").build();
    when(mockRace.getRaceModel()).thenReturn(realModel);
    when(mockRace.createSnapshot()).thenReturn(com.antigravity.proto.RaceData.getDefaultInstance());
    when(mockRace.getHeats()).thenReturn(Collections.emptyList());
    com.antigravity.race.states.IRaceState mockState = mock(com.antigravity.race.states.IRaceState.class);
    when(mockRace.getState()).thenReturn(mockState);

    DatabaseContext mockDbCtx = mock(DatabaseContext.class);
    when(mockDbCtx.getCurrentDatabaseName()).thenReturn("testDB");
    when(mockDbCtx.getDataRoot()).thenReturn(tempFolder.getAbsolutePath() + File.separator);
    manager.setDatabaseContext(mockDbCtx);
    manager.setShuttingDown(false);

    File saveDir = new File(tempFolder.getAbsolutePath() + File.separator + "testDB" + File.separator + "saved_races");
    saveDir.mkdirs();
    File expectedFile = new File(saveDir, "autosave_testRaceId.json");
    expectedFile.createNewFile();
    assertTrue(expectedFile.exists());

    manager.setRace(mockRace);

    WsContext mockContext = mock(WsContext.class);
    com.antigravity.proto.RaceSubscriptionRequest unsubscribeReq = com.antigravity.proto.RaceSubscriptionRequest
        .newBuilder().setSubscribe(false).build();

    java.lang.reflect.Field rdsField = ClientSubscriptionManager.class.getDeclaredField("raceDataSubscribers");
    rdsField.setAccessible(true);
    ((java.util.Set<?>) rdsField.get(manager)).clear();

    manager.handleRaceSubscription(mockContext, unsubscribeReq); // Triggers checkAndStopRace()

    assertFalse("Auto-save file should be deleted upon last client disconnect", expectedFile.exists());
    assertNull("Race should be cleared", manager.getRace());
  }
}
