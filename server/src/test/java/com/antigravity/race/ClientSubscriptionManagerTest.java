package com.antigravity.race;

import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import org.junit.Before;
import org.junit.Test;

import com.antigravity.protocols.IProtocol;

import io.javalin.websocket.WsContext;

public class ClientSubscriptionManagerTest {

  private ClientSubscriptionManager manager;

  @Before
  public void setUp() {
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
}
