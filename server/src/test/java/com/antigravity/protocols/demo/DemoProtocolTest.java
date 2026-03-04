package com.antigravity.protocols.demo;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import java.util.List;
import java.util.concurrent.ScheduledExecutorService;

import org.junit.Before;
import org.junit.Test;

import com.antigravity.mocks.MockProtocolListener;
import com.antigravity.mocks.MockRandom;
import com.antigravity.mocks.MockScheduler;
import com.antigravity.protocols.PartialTime;

public class DemoProtocolTest {

  private TestableDemo demo;
  private MockScheduler scheduler;
  private MockProtocolListener listener;

  private static class TestableDemo extends Demo {
    long mockedTime = 10000; // Start at arbitrary non-zero time
    MockScheduler mockScheduler;

    public TestableDemo(int numLanes, MockScheduler scheduler, MockRandom random, boolean isFuelRace) {
      super(numLanes, random, isFuelRace);
      this.mockScheduler = scheduler;
    }

    @Override
    protected long now() {
      return mockedTime;
    }

    @Override
    protected ScheduledExecutorService createScheduler() {
      return mockScheduler;
    }

    void advanceTime(long millis) {
      mockedTime += millis;
    }
  }

  @Before
  public void setUp() {
    scheduler = new MockScheduler();
    MockRandom random = new MockRandom();
    // Lane 0 target = 1 + 100 = 101ms
    random.addNextInt(100);
    // Lane 1 target = 1 + 400 = 401ms
    random.addNextInt(400);

    // Future random calls for next targets (not relevant for this specific setup
    // but good to be safe)
    random.addNextInt(1000);
    random.addNextInt(1000);

    demo = new TestableDemo(2, scheduler, random, false); // 2 lanes
    listener = new MockProtocolListener();
    demo.setListener(listener);
  }

  @Test
  public void testOpen() {
    assertTrue(demo.open());
  }

  @Test
  public void testLifecycle() {
    demo.startTimer();
    assertFalse(scheduler.isShutdown());

    // Advance time 200ms.
    // Lane 0 (target 101) should complete a lap and reset start time to T0+200.
    // Lane 1 (target 401) should not complete. Start time remains T0.
    demo.advanceTime(200);
    scheduler.tick();

    List<PartialTime> partials = demo.stopTimer();
    assertTrue(scheduler.isShutdown());
    assertEquals(2, partials.size()); // 2 lanes

    // Check that times are different
    // Lane 0: elapsed since reset (0ms if we stop exactly at update, but here 200ms
    // elapsed total)
    // Lane 1: elapsed since start = 200.

    assertEquals("Lane 0 should have just reset (0.0s elapsed)", 0.0, partials.get(0).getLapTime(), 0.001);
    assertEquals("Lane 1 should have 200ms elapsed (0.2s)", 0.2, partials.get(1).getLapTime(), 0.001);
  }

  @Test
  public void testLapGeneration() {
    demo.startTimer();

    // Initial state: Random target lap duration is set in constructor.
    // LaneState init:
    // First lap target: 1 + random(500) ms. Max 501ms.

    // Advance time by 600ms to guarantee first lap on all lanes
    demo.advanceTime(600);
    scheduler.tick(); // Trigger the lap check

    // Should have laps for both lanes?
    // Logic: if (totalElapsed >= state.targetLapDuration) -> onLap
    // Since max target is 501ms, and we advanced 600ms, yes.

    assertEquals("Should receive 2 laps (init reaction time)", 2, listener.laps.size());

    // Now next target is "Regular lap time: [3s, 5s]" (3000 + random(2001))
    // Max is 5001ms.

    listener.laps.clear();
    demo.advanceTime(2000);
    scheduler.tick();
    assertEquals("Should not have new laps yet (2s elapsed vs 3s min)", 0, listener.laps.size());

    demo.advanceTime(3100); // Total 5100ms since last lap, enough to cover max 5001ms
    scheduler.tick();
    assertEquals("Should receive 2 more laps", 2, listener.laps.size());
  }

  @Test
  public void testPitStopSimulation() {
    MockRandom random = new MockRandom();
    // Lane 0: first lap reaction (100ms)
    random.addNextInt(100);
    // lapsUntilNextPit = 3 + 0 = 3
    random.addNextInt(0);

    // Regular lap 1 (target 4000ms)
    random.addNextInt(1000);
    // lapsUntilNextPit decr to 2

    // Regular lap 2 (target 4000ms)
    random.addNextInt(1000);
    // lapsUntilNextPit decr to 1

    // Regular lap 3 (target 4000ms)
    random.addNextInt(1000);
    // lapsUntilNextPit decr to 0 (pit scheduled for NEXT lap)

    // Pit Lap: lapDuration (4000) + pitDuration (6000) = 10000ms
    random.addNextInt(1000); // lapDuration offset
    random.addNextInt(1000); // pitDuration offset
    random.addNextInt(100); // pitEntryOffset offset
    // lapsUntilNextPit reset to 3 + 1 = 4
    random.addNextInt(1);

    TestableDemo fuelDemo = new TestableDemo(1, scheduler, random, true);
    MockProtocolListener fuelListener = new MockProtocolListener();
    fuelDemo.setListener(fuelListener);
    fuelDemo.startTimer();

    // 1. Reaction lap (100ms)
    fuelDemo.advanceTime(150);
    scheduler.tick();
    assertEquals(1, fuelListener.laps.size());
    fuelListener.laps.clear();

    // 2. Lap 1 (4000ms)
    fuelDemo.advanceTime(4100);
    scheduler.tick();
    assertEquals(1, fuelListener.laps.size());
    fuelListener.laps.clear();

    // 3. Lap 2 (4000ms)
    fuelDemo.advanceTime(4100);
    scheduler.tick();
    assertEquals(1, fuelListener.laps.size());
    fuelListener.laps.clear();

    // 4. Lap 3 (4000ms)
    fuelDemo.advanceTime(4100);
    scheduler.tick();
    assertEquals(1, fuelListener.laps.size());
    fuelListener.laps.clear();

    // 5. Pit Lap (10000ms). Pit scheduled for here.
    // target = 4000 + 6000 = 10000.
    // pitEntryOffset = 500 + 100 = 600.
    // pitExitOffset = 600 + 6000 = 6600.

    // Advance past pitEntryOffset
    fuelDemo.advanceTime(700);
    scheduler.tick();
    assertEquals("Should have sent pit entry CarData", 1, fuelListener.carData.size());
    assertEquals(com.antigravity.protocols.CarLocation.PitRow, fuelListener.carData.get(0).getLocation());
    assertTrue(fuelListener.carData.get(0).getCanRefuel());

    // Advance past pitExitOffset
    fuelDemo.advanceTime(6000); // Total 6700ms since lap start
    scheduler.tick();
    assertEquals("Should have sent pit exit CarData", 2, fuelListener.carData.size());
    assertEquals(com.antigravity.protocols.CarLocation.Main, fuelListener.carData.get(1).getLocation());
    assertFalse(fuelListener.carData.get(1).getCanRefuel());

    // Advance past targetLapDuration (10000)
    fuelDemo.advanceTime(3500); // Total 10200ms
    scheduler.tick();
    assertEquals("Should have completed pit lap", 1, fuelListener.laps.size());
    assertEquals(10.2, fuelListener.laps.get(0), 0.001);
  }
}
