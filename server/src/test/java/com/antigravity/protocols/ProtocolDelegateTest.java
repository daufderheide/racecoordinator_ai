package com.antigravity.protocols;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.antigravity.proto.RaceFlag;
import com.antigravity.proto.RaceState;
import java.util.Arrays;
import java.util.Collections;
import org.junit.Before;
import org.junit.Test;

public class ProtocolDelegateTest {

  private IProtocol proto1;
  private IProtocol proto2;
  private ProtocolDelegate delegate;

  @Before
  public void setUp() {
    proto1 = mock(IProtocol.class);
    proto2 = mock(IProtocol.class);
    delegate = new ProtocolDelegate(Arrays.asList(proto1, proto2));
  }

  @Test
  public void testOpenAndClose() {
    when(proto1.open()).thenReturn(true);
    when(proto2.open()).thenReturn(true);
    assertTrue(delegate.open());

    delegate.close();
    verify(proto1).close();
    verify(proto2).close();
  }

  @Test
  public void testClearLedsAndSetRaceState() {
    delegate.clearLeds();
    verify(proto1).clearLeds();
    verify(proto2).clearLeds();

    delegate.setRaceState(RaceState.RACING, RaceFlag.GREEN, 0.0);
    verify(proto1).setRaceState(RaceState.RACING, RaceFlag.GREEN, 0.0);
    verify(proto2).setRaceState(RaceState.RACING, RaceFlag.GREEN, 0.0);
  }

  @Test
  public void testRelaysAndFuelChecks() {
    when(proto1.hasPerLaneRelays()).thenReturn(false);
    when(proto2.hasPerLaneRelays()).thenReturn(true);
    assertTrue(delegate.hasPerLaneRelays());

    when(proto1.hasDigitalFuel()).thenReturn(true);
    assertTrue(delegate.hasDigitalFuel());

    when(proto1.hasMainRelay()).thenReturn(true);
    assertTrue(delegate.hasMainRelay());
  }

  @Test
  public void testTimerAndLanes() {
    delegate.startTimer();
    verify(proto1).startTimer();
    verify(proto2).startTimer();

    when(proto1.getNumLanes()).thenReturn(4);
    assertEquals(4, delegate.getNumLanes());

    ProtocolDelegate empty = new ProtocolDelegate(Collections.emptyList());
    assertEquals(0, empty.getNumLanes());
    assertFalse(empty.isHealthy());
  }

  @Test
  public void testIsHealthy() {
    when(proto1.isHealthy()).thenReturn(true);
    when(proto2.isHealthy()).thenReturn(true);
    assertTrue(delegate.isHealthy());

    when(proto2.isHealthy()).thenReturn(false);
    assertFalse(delegate.isHealthy());
  }
}
