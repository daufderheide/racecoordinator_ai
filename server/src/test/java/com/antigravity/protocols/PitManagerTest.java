package com.antigravity.protocols;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import com.antigravity.mocks.MockProtocolListener;
import com.antigravity.protocols.arduino.ArduinoConfig.LapPinPitBehavior;
import org.junit.Test;

public class PitManagerTest {

  @Test
  public void testPairedPitInAndPitOut() {
    MockProtocolListener listener = new MockProtocolListener();
    PitManager pitManager = new PitManager(2, lane -> lane == 0, () -> listener);

    assertFalse(pitManager.isLaneInPits(0));

    // Pit In active
    pitManager.handlePitIn(0, true);
    assertTrue(pitManager.isLaneInPits(0));
    assertEquals(1, listener.carData.size());
    CarData inEvent = listener.carData.get(0);
    assertEquals(CarLocation.PitRow, inEvent.getLocation());
    assertEquals(CarLocation.Main, inEvent.getLastLocation());
    assertTrue(inEvent.getCanRefuel());

    // Car hits Pit Out (active) -> still in pits until it clears sensor
    pitManager.handlePitOut(0, true);
    assertTrue(pitManager.isLaneInPits(0));
    assertEquals(1, listener.carData.size());

    // Car leaves Pit Out (trailing edge)
    pitManager.handlePitOut(0, false);
    assertFalse(pitManager.isLaneInPits(0));
    assertEquals(2, listener.carData.size());
    CarData outEvent = listener.carData.get(1);
    assertEquals(CarLocation.Main, outEvent.getLocation());
    assertEquals(CarLocation.PitRow, outEvent.getLastLocation());
    assertFalse(outEvent.getCanRefuel());
  }

  @Test
  public void testSingleSensorPitOutOccupancyMode() {
    MockProtocolListener listener = new MockProtocolListener();
    // No pit in configured
    PitManager pitManager = new PitManager(2, lane -> false, () -> listener);

    assertFalse(pitManager.isLaneInPits(0));

    // Car on sensor -> in pits
    pitManager.handlePitOut(0, true);
    assertTrue(pitManager.isLaneInPits(0));
    assertEquals(1, listener.carData.size());
    assertTrue(listener.carData.get(0).getCanRefuel());

    // Car leaves sensor -> out of pits
    pitManager.handlePitOut(0, false);
    assertFalse(pitManager.isLaneInPits(0));
    assertEquals(2, listener.carData.size());
    assertFalse(listener.carData.get(1).getCanRefuel());
  }

  @Test
  public void testPitOutPulse() {
    MockProtocolListener listener = new MockProtocolListener();
    PitManager pitManager = new PitManager(2, lane -> true, () -> listener);

    pitManager.handlePitIn(0, true);
    assertTrue(pitManager.isLaneInPits(0));
    assertEquals(1, listener.carData.size());

    // Pulse should trigger exit
    pitManager.handlePitOutPulse(0);
    assertFalse(pitManager.isLaneInPits(0));
    assertEquals(2, listener.carData.size());
    assertEquals(CarLocation.Main, listener.carData.get(1).getLocation());
  }

  @Test
  public void testPitInOutSensor() {
    MockProtocolListener listener = new MockProtocolListener();
    PitManager pitManager = new PitManager(2, lane -> false, () -> listener);

    pitManager.handlePitInOut(0, true);
    assertTrue(pitManager.isLaneInPits(0));
    assertEquals(1, listener.carData.size());

    pitManager.handlePitInOut(0, false);
    assertFalse(pitManager.isLaneInPits(0));
    assertEquals(2, listener.carData.size());
  }

  @Test
  public void testLapPinPitBehavior() {
    MockProtocolListener listener = new MockProtocolListener();
    PitManager pitManager = new PitManager(2, lane -> lane == 0, () -> listener);

    // Lap pin behavior: PIT_IN
    pitManager.handleLapPinPit(0, LapPinPitBehavior.PIT_IN, true);
    assertTrue(pitManager.isLaneInPits(0));
    assertEquals(1, listener.carData.size());

    // Lap pin behavior: PIT_OUT with paired pit in
    pitManager.handleLapPinPit(0, LapPinPitBehavior.PIT_OUT, true);
    assertTrue(pitManager.isLaneInPits(0)); // Still in pits while active
    pitManager.handleLapPinPit(0, LapPinPitBehavior.PIT_OUT, false);
    assertFalse(pitManager.isLaneInPits(0)); // Exits on trailing edge
    assertEquals(2, listener.carData.size());

    // Lap pin behavior: PIT_IN_OUT
    pitManager.handleLapPinPit(1, LapPinPitBehavior.PIT_IN_OUT, true);
    assertTrue(pitManager.isLaneInPits(1));
    pitManager.handleLapPinPit(1, LapPinPitBehavior.PIT_IN_OUT, false);
    assertFalse(pitManager.isLaneInPits(1));
  }

  @Test
  public void testStartAndStopRefuelTimer() throws Exception {
    MockProtocolListener listener = new MockProtocolListener();
    PitManager pitManager = new PitManager(2, lane -> true, () -> listener);

    pitManager.start();
    pitManager.handlePitIn(0, true);
    assertTrue(pitManager.isLaneInPits(0));

    // Wait slightly more than 100ms for refuel scheduler tick
    Thread.sleep(250);
    assertTrue(listener.carData.size() >= 2);

    pitManager.stop();
    int countAfterStop = listener.carData.size();
    Thread.sleep(150);
    assertEquals(countAfterStop, listener.carData.size());
  }

  @Test
  public void testResetAndInvalidLanes() {
    MockProtocolListener listener = new MockProtocolListener();
    PitManager pitManager = new PitManager(2, lane -> true, () -> listener);

    // Invalid lanes should not throw or change state
    pitManager.handlePitIn(-1, true);
    pitManager.handlePitIn(5, true);
    pitManager.handlePitOut(-1, true);
    pitManager.handlePitInOut(-1, true);
    pitManager.handleLapPinPit(-1, LapPinPitBehavior.PIT_IN, true);
    assertFalse(pitManager.isLaneInPits(-1));
    assertFalse(pitManager.isLaneInPits(5));

    pitManager.handlePitIn(0, true);
    assertTrue(pitManager.isLaneInPits(0));

    pitManager.reset();
    assertFalse(pitManager.isLaneInPits(0));
  }
}
