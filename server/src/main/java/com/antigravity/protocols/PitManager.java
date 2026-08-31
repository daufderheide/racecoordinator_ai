package com.antigravity.protocols;

import com.antigravity.protocols.arduino.ArduinoConfig.LapPinPitBehavior;
import java.util.concurrent.Executors;
import java.util.concurrent.RejectedExecutionException;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import java.util.function.Function;
import java.util.function.LongSupplier;
import java.util.function.Supplier;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Manages pit in, pit out, and pit in/out state transitions and periodic refueling telemetry.
 * Supports sharing across multiple track interfaces.
 */
public class PitManager {

  private static final Logger logger = LoggerFactory.getLogger(PitManager.class);
  private static final int REFUEL_INTERVAL_MS = 100;

  private final int numLanes;
  private final boolean[] laneInPits;
  private final boolean[] lastPitOutActive;
  private final boolean[] lastLapPinActive;
  private final long[] lastRefuelTimeMs;

  private final Function<Integer, Boolean> hasPitInConfiguredSupplier;
  private final Supplier<ProtocolListener> listenerSupplier;
  private final LongSupplier timeSupplier;
  private final Supplier<ScheduledExecutorService> schedulerSupplier;

  private ScheduledExecutorService internalScheduler;
  private ScheduledFuture<?> refuelFuture;
  private boolean isStarted = false;

  public PitManager(
      int numLanes,
      Function<Integer, Boolean> hasPitInConfiguredSupplier,
      Supplier<ProtocolListener> listenerSupplier) {
    this(numLanes, hasPitInConfiguredSupplier, listenerSupplier, System::currentTimeMillis, null);
  }

  public PitManager(
      int numLanes,
      Function<Integer, Boolean> hasPitInConfiguredSupplier,
      Supplier<ProtocolListener> listenerSupplier,
      LongSupplier timeSupplier,
      Supplier<ScheduledExecutorService> schedulerSupplier) {
    this.numLanes = Math.max(0, numLanes);
    this.laneInPits = new boolean[this.numLanes];
    this.lastPitOutActive = new boolean[this.numLanes];
    this.lastLapPinActive = new boolean[this.numLanes];
    this.lastRefuelTimeMs = new long[this.numLanes];
    this.hasPitInConfiguredSupplier =
        hasPitInConfiguredSupplier != null ? hasPitInConfiguredSupplier : lane -> false;
    this.listenerSupplier = listenerSupplier != null ? listenerSupplier : () -> null;
    this.timeSupplier = timeSupplier != null ? timeSupplier : System::currentTimeMillis;
    this.schedulerSupplier = schedulerSupplier;
  }

  public synchronized void start() {
    if (isStarted) {
      return;
    }
    isStarted = true;

    ScheduledExecutorService execToUse;
    if (schedulerSupplier != null && schedulerSupplier.get() != null) {
      execToUse = schedulerSupplier.get();
    } else {
      internalScheduler =
          Executors.newSingleThreadScheduledExecutor(
              r -> {
                Thread t = new Thread(r, "PitManager-RefuelScheduler");
                t.setDaemon(true);
                return t;
              });
      execToUse = internalScheduler;
    }

    try {
      refuelFuture =
          execToUse.scheduleAtFixedRate(
              this::onRefuelTick, 0, REFUEL_INTERVAL_MS, TimeUnit.MILLISECONDS);
    } catch (RejectedExecutionException e) {
      logger.warn("PitManager refuel scheduler task rejected during startup: {}", e.getMessage());
    }
  }

  public synchronized void stop() {
    isStarted = false;
    if (refuelFuture != null) {
      refuelFuture.cancel(true);
      refuelFuture = null;
    }
    if (internalScheduler != null) {
      internalScheduler.shutdownNow();
      internalScheduler = null;
    }
  }

  public void onRefuelTick() {
    try {
      ProtocolListener listener = listenerSupplier.get();
      if (listener == null) {
        return;
      }
      long currentTime = timeSupplier.getAsLong();
      synchronized (this) {
        for (int laneIndex = 0; laneIndex < numLanes; laneIndex++) {
          if (laneInPits[laneIndex]) {
            double deltaTimeSeconds = 0.0;
            if (lastRefuelTimeMs[laneIndex] > 0) {
              deltaTimeSeconds = (currentTime - lastRefuelTimeMs[laneIndex]) / 1000.0;
            }
            lastRefuelTimeMs[laneIndex] = currentTime;

            listener.onCarData(
                new CarData(
                    laneIndex,
                    deltaTimeSeconds,
                    0.0,
                    0.0,
                    true,
                    CarLocation.PitRow,
                    CarLocation.PitRow,
                    -1));
          }
        }
      }
    } catch (Exception e) {
      logger.error("Error in PitManager refuel scheduler tick", e);
    }
  }

  public synchronized boolean isLaneInPits(int laneIndex) {
    if (laneIndex < 0 || laneIndex >= numLanes) {
      return false;
    }
    return laneInPits[laneIndex];
  }

  public synchronized void handlePitIn(int laneIndex, boolean active) {
    if (laneIndex < 0 || laneIndex >= numLanes) {
      return;
    }
    if (active) {
      updatePitState(laneIndex, true);
    }
  }

  public synchronized void handlePitOut(int laneIndex, boolean active) {
    if (laneIndex < 0 || laneIndex >= numLanes) {
      return;
    }
    boolean pairedPitIn = Boolean.TRUE.equals(hasPitInConfiguredSupplier.apply(laneIndex));
    if (pairedPitIn) {
      if (lastPitOutActive[laneIndex] && !active) {
        updatePitState(laneIndex, false);
      }
    } else {
      updatePitState(laneIndex, active);
    }
    lastPitOutActive[laneIndex] = active;
  }

  public synchronized void handlePitOutPulse(int laneIndex) {
    handlePitOut(laneIndex, true);
    handlePitOut(laneIndex, false);
  }

  public synchronized void handlePitInOut(int laneIndex, boolean active) {
    if (laneIndex < 0 || laneIndex >= numLanes) {
      return;
    }
    updatePitState(laneIndex, active);
  }

  public synchronized void handleLapPinPit(
      int laneIndex, LapPinPitBehavior behavior, boolean active) {
    if (laneIndex < 0 || laneIndex >= numLanes || behavior == null) {
      return;
    }

    boolean pairedPitIn = Boolean.TRUE.equals(hasPitInConfiguredSupplier.apply(laneIndex));
    boolean wasActive = lastLapPinActive[laneIndex];

    if (active) {
      if (behavior == LapPinPitBehavior.PIT_IN || behavior == LapPinPitBehavior.PIT_IN_OUT) {
        updatePitState(laneIndex, true);
      } else if (behavior == LapPinPitBehavior.PIT_OUT) {
        if (!pairedPitIn) {
          updatePitState(laneIndex, false);
        }
      }
    } else {
      if (behavior == LapPinPitBehavior.PIT_IN_OUT) {
        updatePitState(laneIndex, false);
      } else if (behavior == LapPinPitBehavior.PIT_OUT) {
        if (pairedPitIn && wasActive) {
          updatePitState(laneIndex, false);
        }
      }
    }
    lastLapPinActive[laneIndex] = active;
  }

  public synchronized void updatePitState(int laneIndex, boolean inPits) {
    if (laneIndex < 0 || laneIndex >= numLanes) {
      return;
    }
    if (laneInPits[laneIndex] != inPits) {
      logger.info(
          "updatePitState: Lane {} transition to {}", laneIndex, inPits ? "IN_PITS" : "OUT_PITS");
      laneInPits[laneIndex] = inPits;

      ProtocolListener listener = listenerSupplier.get();
      if (inPits) {
        lastRefuelTimeMs[laneIndex] = timeSupplier.getAsLong();
        if (listener != null) {
          listener.onCarData(
              new CarData(laneIndex, 0.0, 0, 0, true, CarLocation.PitRow, CarLocation.Main, -1));
        }
      } else {
        lastRefuelTimeMs[laneIndex] = 0;
        if (listener != null) {
          listener.onCarData(
              new CarData(laneIndex, 0.0, 0, 0, false, CarLocation.Main, CarLocation.PitRow, -1));
        }
      }
    }
  }

  public synchronized void reset() {
    for (int i = 0; i < numLanes; i++) {
      laneInPits[i] = false;
      lastPitOutActive[i] = false;
      lastLapPinActive[i] = false;
      lastRefuelTimeMs[i] = 0;
    }
  }
}
