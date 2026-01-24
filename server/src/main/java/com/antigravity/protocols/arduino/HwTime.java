package com.antigravity.protocols.arduino;

public class HwTime {
  private long seconds;
  private long us;

  public HwTime() {
    Reset();
  }

  public synchronized void Reset() {
    seconds = 0;
    us = 0;
  }

  public synchronized void Add(long time) {
    us += time;
    long sec = (us / (1000 * 1000));
    us -= (sec * (1000 * 1000));
    seconds += sec;
  }

  public synchronized double Time() {
    double ret = seconds;
    ret += (us / (1000.0 * 1000.0));
    Reset();

    return ret;
  }

  public synchronized String ToString() {
    double t = seconds;
    t += (us / (1000.0 * 1000.0));

    return (t + "s, sec: " + seconds + ", us: " + us);
  }
}
