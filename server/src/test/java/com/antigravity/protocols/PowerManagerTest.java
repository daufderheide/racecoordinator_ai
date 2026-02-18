package com.antigravity.protocols;

import static org.mockito.Mockito.*;

import java.util.Arrays;
import java.util.List;

import org.junit.Before;
import org.junit.Test;

public class PowerManagerTest {

  private ProtocolDelegate delegate;
  private PowerManager powerManager;
  private IProtocol mainOnlyProtocol;
  private IProtocol laneOnlyProtocol;
  private IProtocol bothProtocol;
  private IProtocol neitherProtocol;

  @Before
  public void setUp() {
    mainOnlyProtocol = mock(IProtocol.class);
    when(mainOnlyProtocol.hasMainRelay()).thenReturn(true);
    when(mainOnlyProtocol.hasPerLaneRelays()).thenReturn(false);
    when(mainOnlyProtocol.getNumLanes()).thenReturn(2);

    laneOnlyProtocol = mock(IProtocol.class);
    when(laneOnlyProtocol.hasMainRelay()).thenReturn(false);
    when(laneOnlyProtocol.hasPerLaneRelays()).thenReturn(true);
    when(laneOnlyProtocol.getNumLanes()).thenReturn(2);

    bothProtocol = mock(IProtocol.class);
    when(bothProtocol.hasMainRelay()).thenReturn(true);
    when(bothProtocol.hasPerLaneRelays()).thenReturn(true);
    when(bothProtocol.getNumLanes()).thenReturn(2);

    neitherProtocol = mock(IProtocol.class);
    when(neitherProtocol.hasMainRelay()).thenReturn(false);
    when(neitherProtocol.hasPerLaneRelays()).thenReturn(false);
    when(neitherProtocol.getNumLanes()).thenReturn(2);
  }

  @Test
  public void testSetMainPower() {
    // Setup delegate with all types
    List<IProtocol> protocols = Arrays.asList(mainOnlyProtocol, laneOnlyProtocol, bothProtocol, neitherProtocol);
    delegate = new ProtocolDelegate(protocols);
    powerManager = new PowerManager(delegate);

    // Turn Main Power ON
    powerManager.setMainPower(true);

    verify(mainOnlyProtocol).setMainPower(true);
    // laneOnlyProtocol has no main relay, so it should simulate via lane relays.
    // Initially desiredLanePower is false, so ON && false = false
    verify(laneOnlyProtocol).setLanePower(false, 0);
    verify(laneOnlyProtocol).setLanePower(false, 1);

    verify(bothProtocol).setMainPower(true);
    // "If the protocol has both main and lane power, the PowerManager simply
    // prevents redundant calls."
    // Meaning we should NOT call setLanePower on bothProtocol?
    verify(bothProtocol, never()).setLanePower(anyBoolean(), anyInt());

    verify(neitherProtocol, never()).setMainPower(anyBoolean());
    verify(neitherProtocol, never()).setLanePower(anyBoolean(), anyInt());

    // Now set lane power to true for lane 0
    powerManager.setLanePower(true, 0);

    // Turn Main Power OFF
    powerManager.setMainPower(false);

    verify(mainOnlyProtocol).setMainPower(false);
    // laneOnlyProtocol: effective = OFF && anything = OFF
    verify(laneOnlyProtocol, atLeastOnce()).setLanePower(false, 0);
    verify(bothProtocol).setMainPower(false);
  }

  @Test
  public void testSetLanePower() {
    List<IProtocol> protocols = Arrays.asList(mainOnlyProtocol, laneOnlyProtocol, bothProtocol);
    delegate = new ProtocolDelegate(protocols);
    powerManager = new PowerManager(delegate);

    // Required: Main Power must be ON for lane power to take effect on
    // laneOnlyProtocol
    powerManager.setMainPower(true);
    // Clearing invocations but keeping stubs
    clearInvocations(mainOnlyProtocol, laneOnlyProtocol, bothProtocol);

    // Turn Lane 0 ON
    powerManager.setLanePower(true, 0);

    // mainOnlyProtocol: "ignores setLanePower"
    verify(mainOnlyProtocol, never()).setLanePower(anyBoolean(), anyInt());

    // laneOnlyProtocol: effective = true && true = true
    verify(laneOnlyProtocol).setLanePower(true, 0);

    // bothProtocol: "prevents redundant calls" -> but wait, if we are setting lane
    // power,
    // implies we want to control that lane specifically.
    // "If a protocol has both main and lane power, the PowerManager simply prevents
    // redundant calls to the protocol."
    // This is vague. Does it mean redundancy between main and lane?
    // Or does it mean "don't call setLanePower if you already called setMainPower"?
    // But setLanePower is fine.
    // Re-reading: "If the protocol has both main and lane power, the PowerManager
    // simply prevents redundant calls to the protocol."
    // Maybe it means "If main power is handled by main relay, don't ALSO set lane
    // relays for main power simulation"?
    // Yes.
    // But here we are EXPLICITLY setting lane power.
    // "If the protocol has both main and lane power... "
    // "If the protocol only has per lane relays..."
    //
    // Actually, looking at my implementation:
    // if (protocol.hasPerLaneRelays()) { ... setLanePower ... }
    // This will call setLanePower on bothProtocol as well.
    // Is that redundancy?
    // If main relay handles main power, lane relay handles lane power.
    // So we SHOULD call setLanePower on bothProtocol if we want that lane on/off.
    // The "redundant calls" might refer to the simulation logic in setMainPower.
    // In setMainPower, I have: if (hasMainRelay) setMainPower else if
    // (hasPerLaneRelays) setLanePower loop.
    // So that avoids redundancy there.
    // In setLanePower logic:
    // if (hasPerLaneRelays) setLanePower.
    // This seems correct for bothProtocol too.

    verify(bothProtocol).setLanePower(true, 0);

    // Turn Lane 0 OFF
    powerManager.setLanePower(false, 0);
    verify(laneOnlyProtocol).setLanePower(false, 0);
    verify(bothProtocol).setLanePower(false, 0);
  }

  @Test
  public void testSetMainPowerRedundant() {
    List<IProtocol> protocols = Arrays.asList(mainOnlyProtocol);
    delegate = new ProtocolDelegate(protocols);
    powerManager = new PowerManager(delegate);

    // First call - should trigger interaction
    powerManager.setMainPower(true);
    verify(mainOnlyProtocol, times(1)).setMainPower(true);

    // Clear invocations to simplify check for subsequent calls
    clearInvocations(mainOnlyProtocol);

    // Second call - should be redundant
    powerManager.setMainPower(true);
    verify(mainOnlyProtocol, never()).setMainPower(anyBoolean());

    // Changing state should trigger again
    powerManager.setMainPower(false);
    verify(mainOnlyProtocol, times(1)).setMainPower(false);
  }

  @Test
  public void testSetLanePowerRedundant() {
    List<IProtocol> protocols = Arrays.asList(laneOnlyProtocol);
    delegate = new ProtocolDelegate(protocols);
    powerManager = new PowerManager(delegate);

    // Set main power ON so lane power is effective
    powerManager.setMainPower(true);
    clearInvocations(laneOnlyProtocol);

    // First call - should trigger interaction
    powerManager.setLanePower(true, 0);
    verify(laneOnlyProtocol, times(1)).setLanePower(true, 0);

    clearInvocations(laneOnlyProtocol);

    // Second call - should be redundant
    powerManager.setLanePower(true, 0);
    verify(laneOnlyProtocol, never()).setLanePower(anyBoolean(), anyInt());

    // Main power OFF - effectively turns lanes off
    powerManager.setMainPower(false);
    verify(laneOnlyProtocol, times(1)).setLanePower(false, 0); // Lane 0 goes off
    // Lane 1 was already off, so verify it's not set again?
    // Wait, initial state of firstLanePower is true, so logic might force update on
    // first run.
    // Here we already ran setMainPower(true).
    // When main goes false, effective power becomes false.
    // currentLanePower[0] was true. New effective is false. So setLanePower(false,
    // 0) called.
    // currentLanePower[1] was false. New effective is false. So NO check?
    // Let's verify lane 1 is NOT touched.
    verify(laneOnlyProtocol, never()).setLanePower(anyBoolean(), eq(1));

    clearInvocations(laneOnlyProtocol);

    // Now with Main OFF, toggle Lane Power. Effective remains OFF.
    // desiredLanePower[0] is true. setLanePower(false, 0)
    // effective = false && false = false.
    // currentLanePower[0] is false (from master off step).
    // So NO change.
    powerManager.setLanePower(false, 0);
    verify(laneOnlyProtocol, never()).setLanePower(anyBoolean(), anyInt());

    // Set back to true. Effective = false. Current = false. No change.
    powerManager.setLanePower(true, 0);
    verify(laneOnlyProtocol, never()).setLanePower(anyBoolean(), anyInt());
  }
}
