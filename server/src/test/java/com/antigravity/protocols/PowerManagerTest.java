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

    // Turn Main Power ON
    powerManager.setMainPower(true);

    // Should turn ON main relay
    verify(protocol).setMainPower(true);
    // AND should NEVER touch lane relays
    verify(protocol, never()).setLanePower(anyBoolean(), anyInt());

    // Turn Main Power OFF
    reset(protocol);
    when(protocol.hasMainRelay()).thenReturn(true);
    when(protocol.hasPerLaneRelays()).thenReturn(true);

    powerManager.setMainPower(false);

    // Should turn OFF main relay
    verify(protocol).setMainPower(false);
    // AND should NEVER touch lane relays
    verify(protocol, never()).setLanePower(anyBoolean(), anyInt());
  }

  @Test
  public void testSetMainPowerWithOnlyLaneRelays() {
    // Setup protocol with ONLY per-lane relays
    when(protocol.hasMainRelay()).thenReturn(false);
    when(protocol.hasPerLaneRelays()).thenReturn(true);

    // Turn Main Power ON
    powerManager.setMainPower(true);

    // Should NEVER touch lane relays (that's Race's job now)
    verify(protocol, never()).setLanePower(anyBoolean(), anyInt());

    // Turn Main Power OFF
    reset(protocol);
    when(protocol.hasMainRelay()).thenReturn(false);
    when(protocol.hasPerLaneRelays()).thenReturn(true);

    powerManager.setMainPower(false);

    // Should NEVER touch lane relays
    verify(protocol, never()).setLanePower(anyBoolean(), anyInt());
  }

  @Test
  public void testSetMainPowerWithOnlyMainRelay() {
    // Setup protocol with ONLY main relay
    when(protocol.hasMainRelay()).thenReturn(true);
    when(protocol.hasPerLaneRelays()).thenReturn(false);

    // Turn Main Power ON
    powerManager.setMainPower(true);
    verify(protocol).setMainPower(true);
    verify(protocol, never()).setLanePower(anyBoolean(), anyInt());

    // Turn Main Power OFF
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

    // Initial state: lane power is OFF and main power is OFF
    for (int i = 0; i < numLanes; i++) {
      powerManager.setLanePower(false, i);
    }
    powerManager.setMainPower(false);

    reset(protocol);
    when(protocol.hasMainRelay()).thenReturn(true);
    when(protocol.hasPerLaneRelays()).thenReturn(true);

    // Set warmup to true
    powerManager.setWarmup(true);

    // Set main power to true
    powerManager.setMainPower(true);

    // Main relay should be set to true
    verify(protocol).setMainPower(true);

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

    // Main relay should now go to false (OFF)
    verify(protocol).setMainPower(false);
  }

  @Test
  public void testMultiProtocol_OneMainRelay_OnePerLaneRelays() {
    IProtocol mainProtocol = mock(IProtocol.class);
    when(mainProtocol.hasMainRelay()).thenReturn(true);
    when(mainProtocol.hasPerLaneRelays()).thenReturn(false);
    when(mainProtocol.getNumLanes()).thenReturn(numLanes);

    IProtocol laneProtocol = mock(IProtocol.class);
    when(laneProtocol.hasMainRelay()).thenReturn(false);
    when(laneProtocol.hasPerLaneRelays()).thenReturn(true);
    when(laneProtocol.getNumLanes()).thenReturn(numLanes);

    List<IProtocol> protocols = new ArrayList<>();
    protocols.add(mainProtocol);
    protocols.add(laneProtocol);

    ProtocolDelegate multiDelegate = mock(ProtocolDelegate.class);
    when(multiDelegate.getProtocols()).thenReturn(protocols);
    when(multiDelegate.getNumLanes()).thenReturn(numLanes);

    PowerManager multiPowerManager = new PowerManager(multiDelegate);

    // Turn main power ON
    multiPowerManager.setMainPower(true);

    // mainProtocol should receive setMainPower(true) and never setLanePower
    verify(mainProtocol).setMainPower(true);
    verify(mainProtocol, never()).setLanePower(anyBoolean(), anyInt());

    // laneProtocol should NEVER be touched
    verify(laneProtocol, never()).setMainPower(anyBoolean());
    verify(laneProtocol, never()).setLanePower(anyBoolean(), anyInt());

    // Turn main power OFF
    reset(mainProtocol, laneProtocol);
    when(mainProtocol.hasMainRelay()).thenReturn(true);
    when(mainProtocol.hasPerLaneRelays()).thenReturn(false);
    when(laneProtocol.hasMainRelay()).thenReturn(false);
    when(laneProtocol.hasPerLaneRelays()).thenReturn(true);

    multiPowerManager.setMainPower(false);

    verify(mainProtocol).setMainPower(false);
    verify(laneProtocol, never()).setLanePower(anyBoolean(), anyInt());
  }
}
