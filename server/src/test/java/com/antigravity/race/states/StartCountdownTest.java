package com.antigravity.race.states;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public class StartCountdownTest {
  @Test
  public void keepsTheRandomHoldOutOfTheVisibleCountdown() {
    StartCountdown countdown = new StartCountdown(0, 2, 0.1);

    assertEquals(2, countdown.duration(), 0);
    assertEquals(1, countdown.remaining(1_000_000_000L), 0);
    assertEquals(0, countdown.remaining(2_000_000_000L), 0);
    assertFalse(countdown.hasFinished(2_000_000_000L));
    assertTrue(countdown.hasFinished(2_100_000_000L));
  }

  @Test
  public void completesImmediatelyForZeroDurationAndSubTickRandomizer() {
    StartCountdown countdown = new StartCountdown(10, 0, 0.05);

    assertEquals(0, countdown.remaining(10), 0);
    assertTrue(countdown.hasFinished(10));
  }
}
