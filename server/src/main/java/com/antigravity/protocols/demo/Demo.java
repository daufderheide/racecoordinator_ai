package com.antigravity.protocols.demo;

import java.util.ArrayList;
import java.util.List;

import com.antigravity.protocols.DefaultProtocol;
import com.antigravity.protocols.PartialTime;

public class Demo extends DefaultProtocol {
    private java.util.concurrent.ScheduledExecutorService scheduler;
    private java.util.concurrent.ScheduledFuture<?> timerHandle;
    private java.util.Random random = new java.util.Random();

    private class LaneState {
        long currentLapElapsedTime = 0;
        long targetLapDuration;
        long currentLapStartTime = 0;
        boolean isFirstLap = true;

        LaneState() {
            setNextTarget();
        }

        void setNextTarget() {
            if (isFirstLap) {
                // First lap is reaction time: (0, 0.5]s
                targetLapDuration = 1 + random.nextInt(500);
                isFirstLap = false;
            } else {
                // Regular lap time: [3s, 5s]
                targetLapDuration = 3000 + random.nextInt(2001);
            }
        }
    }

    private LaneState[] laneStates;

    public Demo(int numLanes) {
        super(numLanes);
        laneStates = new LaneState[numLanes];
        for (int i = 0; i < numLanes; i++) {
            laneStates[i] = new LaneState();
        }
    }

    @Override
    public boolean open() {
        return true;
    }

    @Override
    public void startTimer() {
        if (scheduler != null && !scheduler.isShutdown()) {
            return;
        }
        scheduler = java.util.concurrent.Executors.newScheduledThreadPool(1);

        // Restore start times based on elapsed time
        long nowMs = System.currentTimeMillis();
        for (LaneState state : laneStates) {
            state.currentLapStartTime = nowMs - state.currentLapElapsedTime;
        }

        Runnable lapGenerator = new Runnable() {
            public void run() {
                try {
                    long nowMs = System.currentTimeMillis();
                    for (int i = 0; i < laneStates.length; i++) {
                        LaneState state = laneStates[i];
                        long totalElapsed = nowMs - state.currentLapStartTime;

                        if (totalElapsed >= state.targetLapDuration) {
                            double lapTime = totalElapsed / 1000.0;

                            if (listener != null) {
                                listener.onLap(i, lapTime);
                            }

                            // Reset for next lap
                            state.currentLapElapsedTime = 0;
                            // The start time for the next lap is effectively "now"
                            // but closely aligned to when the previous one finished to avoid drift?
                            // For simplicity in this demo, just resetting to now is fine,
                            // or we could add the overshoot to the next lap if we wanted perfect precision.
                            // Let's stick to "now" for simple restart logic.
                            state.currentLapStartTime = nowMs;
                            state.setNextTarget();
                        }
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        };

        timerHandle = scheduler.scheduleAtFixedRate(lapGenerator, 0, 50, java.util.concurrent.TimeUnit.MILLISECONDS);
    }

    @Override
    public List<PartialTime> stopTimer() {
        if (timerHandle != null) {
            timerHandle.cancel(true);
        }
        if (scheduler != null) {
            scheduler.shutdown();
        }
        scheduler = null; // Ensure we can restart it

        // Save state
        long nowMs = System.currentTimeMillis();
        List<PartialTime> partialTimes = new ArrayList<>();
        for (int i = 0; i < laneStates.length; i++) {
            LaneState state = laneStates[i];
            state.currentLapElapsedTime = nowMs - state.currentLapStartTime;
            partialTimes.add(new PartialTime(i, state.currentLapElapsedTime / 1000.0, 0.0));
        }

        return partialTimes;
    }
}
