package com.antigravity.protocols;

import static org.junit.Assert.*;
import static org.mockito.Mockito.*;

import java.util.ArrayList;
import java.util.List;
import org.junit.Before;
import org.junit.Test;

public class PowerManagerTest {

  private ProtocolDelegate delegate;
  private IProtocol protocol;
  private PowerManager powerManager;
  private int numLanes = 4;

  @Before
  public void setUp() {
    delegate = mock(ProtocolDelegate.class);
    protocol = mock(IProtocol.class);

    List<IProtocol> protocols = new ArrayList<>();
    protocols.add(protocol);

    when(delegate.getProtocols()).thenReturn(protocols);
    when(delegate.getNumLanes()).thenReturn(numLanes);
    when(protocol.getNumLanes()).thenReturn(numLanes);

    powerManager = new PowerManager(delegate);
  }

  @Test
  public void testSetMainPowerWithBothRelays() {
    // Setup protocol with both main and per-lane relays
    when(protocol.hasMainRelay()).thenReturn(true);
    when(protocol.hasPerLaneRelays()).thenReturn(true);

    // 1. Initial state: Set Lane Power to ON (desired)
    for (int i = 0; i < numLanes; i++) {
      powerManager.setLanePower(true, i);
    }

    // It might call setLanePower(false, i) to sync initial state because mainPower is false.
    reset(protocol);
    when(protocol.hasMainRelay()).thenReturn(true);
    when(protocol.hasPerLaneRelays()).thenReturn(true);

    // 2. Turn Main Power ON
    powerManager.setMainPower(true);

    // Should turn ON main relay
    verify(protocol).setMainPower(true);
    // AND should turn ON all lane relays because they are desired
    for (int i = 0; i < numLanes; i++) {
      verify(protocol).setLanePower(true, i);
    }

    // 3. Turn Main Power OFF
    reset(protocol);
    when(protocol.hasMainRelay()).thenReturn(true);
    when(protocol.hasPerLaneRelays()).thenReturn(true);

    powerManager.setMainPower(false);

    // Should turn OFF main relay
    verify(protocol).setMainPower(false);
    // AND should turn OFF all lane relays (this was the bug!)
    for (int i = 0; i < numLanes; i++) {
      verify(protocol).setLanePower(false, i);
    }
  }

  @Test
  public void testSetMainPowerWithOnlyLaneRelays() {
    // Setup protocol with ONLY per-lane relays
    when(protocol.hasMainRelay()).thenReturn(false);
    when(protocol.hasPerLaneRelays()).thenReturn(true);

    // 1. Set Lane Power to ON (desired)
    for (int i = 0; i < numLanes; i++) {
      powerManager.setLanePower(true, i);
    }

    reset(protocol);
    when(protocol.hasMainRelay()).thenReturn(false);
    when(protocol.hasPerLaneRelays()).thenReturn(true);

    // 2. Turn Main Power ON
    powerManager.setMainPower(true);

    // Should turn ON all lane relays
    for (int i = 0; i < numLanes; i++) {
      verify(protocol).setLanePower(true, i);
    }

    // 3. Turn Main Power OFF
    reset(protocol);
    when(protocol.hasMainRelay()).thenReturn(false);
    when(protocol.hasPerLaneRelays()).thenReturn(true);

    powerManager.setMainPower(false);

    // Should turn OFF all lane relays
    for (int i = 0; i < numLanes; i++) {
      verify(protocol).setLanePower(false, i);
    }
  }

  @Test
  public void testSetMainPowerWithOnlyMainRelay() {
    // Setup protocol with ONLY main relay
    when(protocol.hasMainRelay()).thenReturn(true);
    when(protocol.hasPerLaneRelays()).thenReturn(false);

    // 1. Turn Main Power ON
    powerManager.setMainPower(true);
    verify(protocol).setMainPower(true);
    verify(protocol, never()).setLanePower(anyBoolean(), anyInt());

    // 2. Turn Main Power OFF
    reset(protocol);
    when(protocol.hasMainRelay()).thenReturn(true);
    when(protocol.hasPerLaneRelays()).thenReturn(false);

    powerManager.setMainPower(false);
    verify(protocol).setMainPower(false);
    verify(protocol, never()).setLanePower(anyBoolean(), anyInt());
  }

  @Test
  public void testWarmupPeriodEnablesAllPower() {
    // Setup protocol with both main and per-lane relays
    when(protocol.hasMainRelay()).thenReturn(true);
    when(protocol.hasPerLaneRelays()).thenReturn(true);

    // Initial state: lane power is OFF (desired) and main power is OFF
    for (int i = 0; i < numLanes; i++) {
      powerManager.setLanePower(false, i);
    }
    powerManager.setMainPower(false);

    reset(protocol);
    when(protocol.hasMainRelay()).thenReturn(true);
    when(protocol.hasPerLaneRelays()).thenReturn(true);

    // Set warmup to true
    powerManager.setWarmup(true);

    // Set main power to true (as done during warmup GREEN_YELLOW flag)
    powerManager.setMainPower(true);

    // Main relay should be set to true
    verify(protocol).setMainPower(true);
    // AND all per-lane relays should be set to true even though desiredLanePower is false
    for (int i = 0; i < numLanes; i++) {
      verify(protocol).setLanePower(true, i);
    }

    // Even if setLanePower(false, i) is called during warmup (e.g. syncLanePowerWithState called
    // with penalty/finished),
    // power should remain ON (so protocol.setLanePower(false, 0) should never be called)
    reset(protocol);
    when(protocol.hasMainRelay()).thenReturn(true);
    when(protocol.hasPerLaneRelays()).thenReturn(true);

    powerManager.setLanePower(false, 0);
    verify(protocol, never()).setLanePower(false, 0);

    // Set warmup back to false
    powerManager.setWarmup(false);

    // Call setMainPower(false) to turn power off when warmup ends
    reset(protocol);
    when(protocol.hasMainRelay()).thenReturn(true);
    when(protocol.hasPerLaneRelays()).thenReturn(true);

    powerManager.setMainPower(false);

    // Main relay and per-lane relays should now go to false (OFF)
    verify(protocol).setMainPower(false);
    for (int i = 0; i < numLanes; i++) {
      verify(protocol).setLanePower(false, i);
    }
  }
}
