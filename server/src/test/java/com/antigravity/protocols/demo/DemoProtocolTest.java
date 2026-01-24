package com.antigravity.protocols.demo;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotEquals;
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

    public TestableDemo(int numLanes, MockScheduler scheduler, MockRandom random) {
      super(numLanes, random);
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

    demo = new TestableDemo(2, scheduler, random); // 2 lanes
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
}
