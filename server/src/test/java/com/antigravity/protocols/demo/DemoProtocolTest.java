package com.antigravity.protocols.demo;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import com.antigravity.mocks.MockProtocolListener;
import com.antigravity.mocks.MockRandom;
import com.antigravity.mocks.MockScheduler;
import com.antigravity.proto.DemoConfig;
import com.antigravity.protocols.CarLocation;
import com.antigravity.protocols.PartialTime;
import java.util.List;
import java.util.concurrent.ScheduledExecutorService;
import org.junit.Before;
import org.junit.Test;

public class DemoProtocolTest {

  private TestableDemo demo;
  private MockScheduler scheduler;
  private MockProtocolListener listener;

  private static class TestableDemo extends Demo {

    long mockedTime = 10000; // Start at arbitrary non-zero time
    MockScheduler mockScheduler;

    public TestableDemo(
        int numLanes, MockScheduler scheduler, MockRandom random, boolean isFuelRace) {
      this(numLanes, scheduler, random, isFuelRace, null);
    }

    public TestableDemo(
        int numLanes,
        MockScheduler scheduler,
        MockRandom random,
        boolean isFuelRace,
        DemoConfig config) {
      super(numLanes, random, isFuelRace, config);
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

    assertEquals(
        "Lane 0 should have just reset (0.0s elapsed)", 0.0, partials.get(0).getLapTime(), 0.001);
    assertEquals(
        "Lane 1 should have 200ms elapsed (0.2s)", 0.2, partials.get(1).getLapTime(), 0.001);
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
    assertEquals(CarLocation.PitRow, fuelListener.carData.get(0).getLocation());
    assertTrue(fuelListener.carData.get(0).getCanRefuel());

    // Advance past pitExitOffset
    fuelDemo.advanceTime(6000); // Total 6700ms since lap start
    scheduler.tick();
    assertEquals("Should have sent pit exit CarData", 2, fuelListener.carData.size());
    assertEquals(CarLocation.Main, fuelListener.carData.get(1).getLocation());
    assertFalse(fuelListener.carData.get(1).getCanRefuel());

    // Advance past targetLapDuration (10000)
    fuelDemo.advanceTime(3500); // Total 10200ms
    scheduler.tick();
    assertEquals("Should have completed pit lap", 1, fuelListener.laps.size());
    assertEquals(10.2, fuelListener.laps.get(0), 0.001);
  }

  @Test
  public void testSegmentGeneration() {
    MockRandom random = new MockRandom();
    // Lane 0: first lap reaction (100ms)
    random.addNextInt(100);
    // Regular lap 1 (target 5000ms)
    random.addNextInt(2000);

    TestableDemo segmentDemo = new TestableDemo(1, scheduler, random, false);
    MockProtocolListener segmentListener = new MockProtocolListener();
    segmentDemo.setListener(segmentListener);
    segmentDemo.startTimer();

    // 1. Reaction lap (100ms)
    segmentDemo.advanceTime(150);
    scheduler.tick();
    assertEquals("Should have 1 lap (reaction)", 1, segmentListener.laps.size());
    assertEquals("Should have 0 segments during reaction lap", 0, segmentListener.segments.size());
    segmentListener.laps.clear();

    // 2. Regular Lap (5000ms)
    // target = 5000.
    // offsets = [750, 2000, 3000, 4250]

    // Advance to Segment 1 (750ms)
    segmentDemo.advanceTime(800);
    scheduler.tick();
    assertEquals("Should have 1 segment hit", 1, segmentListener.segments.size());
    assertEquals(0.75, segmentListener.segments.get(0).time, 0.001);

    // Advance to Segment 2 (2000ms total)
    segmentDemo.advanceTime(1300); // 2100 total
    scheduler.tick();
    assertEquals("Should have 2 segment hits", 2, segmentListener.segments.size());
    assertEquals(1.25, segmentListener.segments.get(1).time, 0.001);

    // Advance to Segment 3 (3000ms total)
    segmentDemo.advanceTime(1000); // 3100 total
    scheduler.tick();
    assertEquals("Should have 3 segment hits", 3, segmentListener.segments.size());
    assertEquals(1.0, segmentListener.segments.get(2).time, 0.001);

    // Advance to Segment 4 (4250ms total)
    segmentDemo.advanceTime(1300); // 4400 total
    scheduler.tick();
    assertEquals("Should have 4 segment hits", 4, segmentListener.segments.size());
    assertEquals(1.25, segmentListener.segments.get(3).time, 0.001);

    // Advance to Lap Complete
    segmentDemo.advanceTime(1000); // 5400 total
    scheduler.tick();
    assertEquals("Should have completed the lap", 1, segmentListener.laps.size());
    assertEquals(5.4, segmentListener.laps.get(0), 0.001);
  }

  @Test
  public void testInterfaceIndexReporting() {
    // Create a listener that also tracks interfaceIndex
    final int[] lastStatusIndex = {-1};
    final int[] lastLapIndex = {-1};
    MockProtocolListener indexListener =
        new MockProtocolListener() {
          @Override
          public void onInterfaceStatus(
              com.antigravity.proto.InterfaceStatus status, int interfaceIndex) {
            super.onInterfaceStatus(status, interfaceIndex);
            lastStatusIndex[0] = interfaceIndex;
          }

          @Override
          public void onLap(int lane, double lapTime, int interfaceId, int interfaceIndex) {
            super.onLap(lane, lapTime, interfaceId, interfaceIndex);
            lastLapIndex[0] = interfaceIndex;
          }
        };

    TestableDemo indexDemo = new TestableDemo(2, scheduler, new MockRandom(), false);
    indexDemo.setListener(indexListener);
    indexDemo.setInterfaceIndex(12);
    indexDemo.open();

    // Trigger status report (Demo sends it on open via statusScheduler)
    scheduler.tick();
    assertEquals("Status interfaceIndex should be 12", 12, lastStatusIndex[0]);

    // Start timer and generate a lap
    indexDemo.startTimer();
    indexDemo.advanceTime(1000);
    scheduler.tick();
    assertEquals("Lap interfaceIndex should be 12", 12, lastLapIndex[0]);
  }

  @Test
  public void testResetEveryHeat() {
    MockRandom random = new MockRandom();
    // Heat 1:
    // Reaction hit (target 100ms)
    random.addNextInt(100);
    // Regular lap hit (target 3000ms)
    random.addNextInt(0);
    // Setup for Heat 1's 3rd lap (consumed but not hit)
    random.addNextInt(999);

    // Heat 2 (after reset):
    // Reaction hit (target 200ms)
    random.addNextInt(200);
    // Setup for Heat 2's 2nd lap
    random.addNextInt(888);

    TestableDemo resetDemo = new TestableDemo(1, scheduler, random, false);
    MockProtocolListener resetListener = new MockProtocolListener();
    resetDemo.setListener(resetListener);
    resetDemo.startTimer();

    // 1. First heat, first hit (Reaction)
    resetDemo.advanceTime(150);
    scheduler.tick();
    assertEquals("First hit should be reaction", 1, resetListener.laps.size());
    assertEquals(0.15, resetListener.laps.get(0), 0.001);
    resetListener.laps.clear();

    // 2. First heat, second hit (Regular Lap)
    resetDemo.advanceTime(3100);
    scheduler.tick();
    assertEquals("Second hit should be regular lap", 1, resetListener.laps.size());
    assertEquals(3.1, resetListener.laps.get(0), 0.001);
    resetListener.laps.clear();

    // Now if we start Heat 2 WITHOUT reset, the first hit would be a regular lap (3s+)
    // But we will reset.
    resetDemo.stopTimer();
    scheduler.reset(); // Crucial to allow MockScheduler to run again
    resetDemo.setRaceState(com.antigravity.proto.RaceState.NOT_STARTED, null, 0);
    resetDemo.startTimer();

    // 3. Second heat, first hit should be Reaction again (target 200ms)
    resetDemo.advanceTime(250);
    scheduler.tick();
    assertEquals("After reset, first hit should be reaction again", 1, resetListener.laps.size());
    assertEquals(0.25, resetListener.laps.get(0), 0.001);
  }

  @Test
  public void testCustomConfig() {
    DemoConfig customConfig =
        DemoConfig.newBuilder()
            .setMinLapTimeMs(1000)
            .setMaxLapTimeMs(1000)
            .setMinReactionTimeMs(500)
            .setMaxReactionTimeMs(500)
            .setNumSegments(2)
            .build();

    MockRandom random = new MockRandom();
    TestableDemo customDemo = new TestableDemo(1, scheduler, random, false, customConfig);
    MockProtocolListener customListener = new MockProtocolListener();
    customDemo.setListener(customListener);
    customDemo.startTimer();

    // 1. Reaction lap (fixed 500ms)
    customDemo.advanceTime(600);
    scheduler.tick();
    assertEquals(1, customListener.laps.size());
    assertEquals(0.6, customListener.laps.get(0), 0.001);
    customListener.laps.clear();

    // 2. Regular lap (fixed 1000ms)
    // 2 segments should be at 1/3 and 2/3 of 1000ms
    // offsets = [333, 666]

    // Advance to Segment 1 (333ms)
    customDemo.advanceTime(400); // 400ms since lap start
    scheduler.tick();
    assertEquals("Should have 1 segment hit", 1, customListener.segments.size());
    assertEquals(0.333, customListener.segments.get(0).time, 0.001);

    // Advance to Segment 2 (666ms)
    customDemo.advanceTime(300); // 700ms since lap start
    scheduler.tick();
    assertEquals("Should have 2 segment hits", 2, customListener.segments.size());
    assertEquals(0.333, customListener.segments.get(1).time, 0.001);

    // Advance to Lap Complete (1000ms)
    customDemo.advanceTime(400); // 1100ms since lap start
    scheduler.tick();
    assertEquals("Should have completed the lap", 1, customListener.laps.size());
    assertEquals(1.1, customListener.laps.get(0), 0.001);
  }

  @Test
  public void testResumeTimerAdjustsTargets() {
    MockRandom random = new MockRandom();
    // First lap reaction (100ms target)
    random.addNextInt(100);
    // Regular lap 1 (target 5000ms)
    random.addNextInt(2000);

    TestableDemo resumeDemo = new TestableDemo(1, scheduler, random, false);
    MockProtocolListener resumeListener = new MockProtocolListener();
    resumeDemo.setListener(resumeListener);
    resumeDemo.startTimer();

    // 1. Complete reaction lap (100ms target)
    resumeDemo.advanceTime(150);
    scheduler.tick();
    resumeListener.laps.clear();

    // Now on regular lap 1 (target 5000ms)
    assertEquals(5000, resumeDemo.laneStates[0].targetLapDuration);

    // Advance 2000ms
    resumeDemo.advanceTime(2000);

    // Pause the race
    List<PartialTime> partials = resumeDemo.stopTimer();
    assertEquals(2.0, partials.get(0).getLapTime(), 0.001);
    assertEquals(2000, resumeDemo.laneStates[0].currentLapElapsedTime);

    // Resume the race
    scheduler.reset();
    resumeDemo.startTimer();

    // Verify adjusted target duration and reset elapsed/start times
    assertEquals(3000, resumeDemo.laneStates[0].targetLapDuration);
    assertEquals(0, resumeDemo.laneStates[0].currentLapElapsedTime);
    assertEquals(resumeDemo.now(), resumeDemo.laneStates[0].currentLapStartTime);

    // Advance 3100ms (total since resume = 3100ms)
    resumeDemo.advanceTime(3100);
    scheduler.tick();

    // Verify lap completed and recorded time since resume
    assertEquals(1, resumeListener.laps.size());
    assertEquals(3.1, resumeListener.laps.get(0), 0.001);
  }

  @Test
  public void testResumeTimerAdjustsPitOffsets() {
    MockRandom random = new MockRandom();
    // 1. Constructor: Reaction lap (100ms target)
    random.addNextInt(100);
    // 2. Constructor: lapsUntilNextPit reset to 3 + 0 = 3
    random.addNextInt(0);

    // 3. Lap 1 regular duration (minLap + 1000 = 4000ms)
    random.addNextInt(1000);
    // 4. Lap 2 regular duration (minLap + 1000 = 4000ms)
    random.addNextInt(1000);
    // 5. Lap 3 regular duration (minLap + 1000 = 4000ms)
    random.addNextInt(1000);

    // 6. Pit Lap: regular duration offset (1000) -> 4000ms
    random.addNextInt(1000);
    // 7. Pit Lap: pitDuration offset (1000) -> 6000ms (Total target 10000ms)
    random.addNextInt(1000);
    // 8. Pit Lap: pitEntryOffset offset (100) -> 600ms
    random.addNextInt(100);
    // 9. Pit Lap: lapsUntilNextPit reset offset (1) -> 4 laps
    random.addNextInt(1);

    TestableDemo fuelDemo = new TestableDemo(1, scheduler, random, true);
    MockProtocolListener fuelListener = new MockProtocolListener();
    fuelDemo.setListener(fuelListener);
    fuelDemo.startTimer();

    // 1. Reaction lap (100ms)
    fuelDemo.advanceTime(150);
    scheduler.tick();
    fuelListener.laps.clear();

    // 2. Lap 1 (4000ms)
    fuelDemo.advanceTime(4100);
    scheduler.tick();
    fuelListener.laps.clear();

    // 3. Lap 2 (4000ms)
    fuelDemo.advanceTime(4100);
    scheduler.tick();
    fuelListener.laps.clear();

    // 4. Lap 3 (4000ms)
    fuelDemo.advanceTime(4100);
    scheduler.tick();
    fuelListener.laps.clear();

    // Now we are on Pit Lap:
    // target = 10000ms.
    // pitEntryOffset = 600ms.
    // pitExitOffset = 6600ms.
    assertTrue(fuelDemo.laneStates[0].isPitLap);
    assertEquals(10000, fuelDemo.laneStates[0].targetLapDuration);
    assertEquals(600, fuelDemo.laneStates[0].pitEntryOffset);
    assertEquals(6600, fuelDemo.laneStates[0].pitExitOffset);

    // Advance 400ms (before pitEntryOffset)
    fuelDemo.advanceTime(400);

    // Pause the race
    fuelDemo.stopTimer();
    assertEquals(400, fuelDemo.laneStates[0].currentLapElapsedTime);

    // Resume the race
    scheduler.reset();
    fuelDemo.startTimer();

    // Verify adjusted offsets
    assertEquals(9600, fuelDemo.laneStates[0].targetLapDuration);
    assertEquals(200, fuelDemo.laneStates[0].pitEntryOffset);
    assertEquals(6200, fuelDemo.laneStates[0].pitExitOffset);

    // Advance past pitEntryOffset (200ms target since resume)
    fuelDemo.advanceTime(250);
    scheduler.tick();
    assertEquals("Should have sent pit entry CarData", 1, fuelListener.carData.size());
    assertEquals(CarLocation.PitRow, fuelListener.carData.get(0).getLocation());

    // Advance past pitExitOffset (6200ms target since resume, total 6250ms)
    fuelDemo.advanceTime(6000);
    scheduler.tick();
    assertEquals("Should have sent pit exit CarData", 2, fuelListener.carData.size());
    assertEquals(CarLocation.Main, fuelListener.carData.get(1).getLocation());

    // Advance past targetLapDuration (9600ms target since resume, total 9750ms)
    fuelDemo.advanceTime(3500);
    scheduler.tick();
    assertEquals("Should have completed pit lap", 1, fuelListener.laps.size());
    assertEquals(9.75, fuelListener.laps.get(0), 0.001);
  }

  @Test
  public void testResumeTimerAdjustsSegmentOffsets() {
    MockRandom random = new MockRandom();
    // Reaction lap (100ms)
    random.addNextInt(100);
    // Regular lap 1 (target 5000ms)
    random.addNextInt(2000);

    TestableDemo segmentDemo = new TestableDemo(1, scheduler, random, false);
    MockProtocolListener segmentListener = new MockProtocolListener();
    segmentDemo.setListener(segmentListener);
    segmentDemo.startTimer();

    // 1. Reaction lap (100ms)
    segmentDemo.advanceTime(150);
    scheduler.tick();
    segmentListener.laps.clear();

    // Now on regular lap 1 (target 5000ms)
    // offsets = [750, 2000, 3000, 4250]
    assertEquals(5000, segmentDemo.laneStates[0].targetLapDuration);
    assertEquals(750, segmentDemo.laneStates[0].segmentOffsets[0]);
    assertEquals(2000, segmentDemo.laneStates[0].segmentOffsets[1]);

    // Advance past first segment hit (1000ms total elapsed)
    segmentDemo.advanceTime(1000);
    scheduler.tick();
    assertEquals("Should have 1 segment hit", 1, segmentListener.segments.size());
    assertEquals(0.75, segmentListener.segments.get(0).time, 0.001);

    // Pause the race
    segmentDemo.stopTimer();
    assertEquals(1000, segmentDemo.laneStates[0].currentLapElapsedTime);

    // Resume the race
    scheduler.reset();
    segmentDemo.startTimer();

    // Verify adjusted segment offsets
    assertEquals(4000, segmentDemo.laneStates[0].targetLapDuration);
    assertEquals(0, segmentDemo.laneStates[0].segmentOffsets[0]); // was 750 - 1000 -> 0
    assertEquals(1000, segmentDemo.laneStates[0].segmentOffsets[1]); // was 2000 - 1000 -> 1000
    assertEquals(2000, segmentDemo.laneStates[0].segmentOffsets[2]); // was 3000 - 1000 -> 2000
    assertEquals(3250, segmentDemo.laneStates[0].segmentOffsets[3]); // was 4250 - 1000 -> 3250

    // Advance 1100ms since resume (total 1100ms)
    segmentDemo.advanceTime(1100);
    scheduler.tick();

    // Verify Segment 2 (index 1) is sent
    assertEquals("Should have 2 segment hits total", 2, segmentListener.segments.size());
    assertEquals(
        1.0, segmentListener.segments.get(1).time, 0.001); // 2000 - 1000 = 1000ms offset trigger
  }
}
