package com.antigravity.race;

import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.Track;
import com.antigravity.proto.RaceData;
import com.antigravity.proto.RaceSubscriptionRequest;
import com.antigravity.protocols.ProtocolDelegate;
import com.antigravity.race.states.IRaceState;
import io.javalin.websocket.WsContext;
import java.io.File;
import java.lang.reflect.Field;
import java.util.Collections;
import java.util.Set;
import org.junit.Before;
import org.junit.Test;

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

    // We need to clear sessions, but there is no public method to clear them.
    // However, for unit testing we can assume start fresh or we might need to rely
    // on clear side effects.
    // Since it's a singleton, we have to be careful.
    // Let's rely on removeSession to clear things up if we track them.
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
        .thenReturn(new Track("Track", Collections.emptyList(), "track1", null));
    when(mockRace.getHeats()).thenReturn(Collections.emptyList());
    IRaceState mockState = mock(IRaceState.class);
    when(mockRace.getState()).thenReturn(mockState);

    DatabaseContext mockDbCtx = mock(DatabaseContext.class);
    com.mongodb.client.MongoDatabase mockDatabase = mock(com.mongodb.client.MongoDatabase.class);
    com.mongodb.client.MongoCollection mockCollection =
        mock(com.mongodb.client.MongoCollection.class);
    when(mockDbCtx.getDatabase()).thenReturn(mockDatabase);
    when(mockDatabase.getCollection(
            org.mockito.ArgumentMatchers.eq("saved_races"),
            org.mockito.ArgumentMatchers.eq(com.antigravity.race.RaceSaveData.class)))
        .thenReturn(mockCollection);

    manager.setDatabaseContext(mockDbCtx);
    manager.setShuttingDown(false);
    manager.autoSave(mockRace);

    verify(mockCollection)
        .replaceOne(
            org.mockito.ArgumentMatchers.any(org.bson.conversions.Bson.class),
            org.mockito.ArgumentMatchers.any(com.antigravity.race.RaceSaveData.class),
            org.mockito.ArgumentMatchers.any(com.mongodb.client.model.ReplaceOptions.class));
  }

  @Test
  public void testDeleteAutoSaveRemovesFile() throws Exception {
    DatabaseContext mockDbCtx = mock(DatabaseContext.class);
    com.mongodb.client.MongoDatabase mockDatabase = mock(com.mongodb.client.MongoDatabase.class);
    com.mongodb.client.MongoCollection mockCollection =
        mock(com.mongodb.client.MongoCollection.class);
    when(mockDbCtx.getDatabase()).thenReturn(mockDatabase);
    when(mockDatabase.getCollection(
            org.mockito.ArgumentMatchers.eq("saved_races"),
            org.mockito.ArgumentMatchers.eq(com.antigravity.race.RaceSaveData.class)))
        .thenReturn(mockCollection);
    com.mongodb.client.result.DeleteResult dr =
        com.mongodb.client.result.DeleteResult.acknowledged(1);
    when(mockCollection.deleteOne(
            org.mockito.ArgumentMatchers.any(org.bson.conversions.Bson.class)))
        .thenReturn(dr);

    manager.setDatabaseContext(mockDbCtx);

    manager.deleteAutoSave("testRaceId");

    verify(mockCollection)
        .deleteOne(org.mockito.ArgumentMatchers.any(org.bson.conversions.Bson.class));
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

    DatabaseContext mockDbCtx = mock(DatabaseContext.class);
    com.mongodb.client.MongoDatabase mockDatabase = mock(com.mongodb.client.MongoDatabase.class);
    com.mongodb.client.MongoCollection mockCollection =
        mock(com.mongodb.client.MongoCollection.class);
    when(mockDbCtx.getDatabase()).thenReturn(mockDatabase);
    when(mockDatabase.getCollection(
            org.mockito.ArgumentMatchers.eq("saved_races"),
            org.mockito.ArgumentMatchers.eq(com.antigravity.race.RaceSaveData.class)))
        .thenReturn(mockCollection);
    com.mongodb.client.result.DeleteResult dr =
        com.mongodb.client.result.DeleteResult.acknowledged(1);
    when(mockCollection.deleteOne(
            org.mockito.ArgumentMatchers.any(org.bson.conversions.Bson.class)))
        .thenReturn(dr);

    manager.setDatabaseContext(mockDbCtx);
    manager.setShuttingDown(false);

    manager.setRace(mockRace);

    WsContext mockContext = mock(WsContext.class);
    RaceSubscriptionRequest unsubscribeReq =
        RaceSubscriptionRequest.newBuilder().setSubscribe(false).build();

    Field rdsField = ClientSubscriptionManager.class.getDeclaredField("raceDataSubscribers");
    rdsField.setAccessible(true);
    ((Set<?>) rdsField.get(manager)).clear();

    manager.handleRaceSubscription(mockContext, unsubscribeReq); // Triggers checkAndStopRace()

    verify(mockCollection)
        .deleteOne(org.mockito.ArgumentMatchers.any(org.bson.conversions.Bson.class));
    assertNull("Race should be cleared", manager.getRace());
  }
}
