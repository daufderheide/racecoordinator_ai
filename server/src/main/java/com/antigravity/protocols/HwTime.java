package com.antigravity.protocols;

public class HwTime {

  private long seconds;
  private long us;

  public HwTime() {
    reset();
  }

  public synchronized void reset() {
    seconds = 0;
    us = 0;
  }

  public synchronized void add(long time) {
    us += time;
    long sec = (us / (1000 * 1000));
    us -= (sec * (1000 * 1000));
    seconds += sec;
  }

  public synchronized double time() {
    double ret = seconds;
    ret += (us / (1000.0 * 1000.0));
    reset();

    return ret;
  }

  @Override
  public synchronized String toString() {
    double t = seconds;
    t += (us / (1000.0 * 1000.0));

    return (t + "s, sec: " + seconds + ", us: " + us);
  }
}
