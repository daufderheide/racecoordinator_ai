package com.antigravity.race.states;

import java.util.concurrent.ThreadLocalRandom;

/** The visible countdown and its optional hidden hold before racing starts. */
final class StartCountdown {
  private final long startedAt;
  private final double duration;
  private final double randomDelay;

  StartCountdown(long startedAt, double seconds, double randomizer) {
    this.startedAt = startedAt;
    duration = Double.isFinite(seconds) ? Math.max(0, seconds) : 0;
    int maxTicks = Double.isFinite(randomizer) ? Math.max(0, (int) (randomizer * 10)) : 0;
    randomDelay = maxTicks == 0 ? 0 : (ThreadLocalRandom.current().nextInt(maxTicks) + 1) / 10.0;
  }

  double duration() {
    return duration;
  }

  double randomDelay() {
    return randomDelay;
  }

  double remaining(long now) {
    return Math.max(0, duration - elapsed(now));
  }

  boolean hasFinished(long now) {
    return elapsed(now) >= duration + randomDelay;
  }

  private double elapsed(long now) {
    return Math.max(0, (now - startedAt) / 1_000_000_000.0);
  }
}
