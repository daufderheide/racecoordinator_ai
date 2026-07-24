package com.antigravity.protocols.phidget;

import com.antigravity.proto.InterfaceAnalogDataEvent;
import com.antigravity.proto.InterfaceDigitalPinEvent;
import com.antigravity.proto.InterfaceEvent;
import com.antigravity.proto.InterfaceStatus;
import com.antigravity.proto.PinBehavior;
import com.antigravity.proto.RaceFlag;
import com.antigravity.proto.RaceState;
import com.antigravity.protocols.CarData;
import com.antigravity.protocols.CarLocation;
import com.antigravity.protocols.IProtocol;
import com.antigravity.protocols.PartialTime;
import com.antigravity.protocols.ProtocolListener;
import com.antigravity.protocols.arduino.ArduinoConfig.LapPinPitBehavior;
import com.phidget22.DigitalInput;
import com.phidget22.DigitalInputStateChangeEvent;
import com.phidget22.DigitalInputStateChangeListener;
import com.phidget22.DigitalOutput;
import com.phidget22.PhidgetException;
import com.phidget22.VoltageRatioInput;
import com.phidget22.VoltageRatioInputVoltageRatioChangeEvent;
import com.phidget22.VoltageRatioInputVoltageRatioChangeListener;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class PhidgetProtocol implements IProtocol {
  private static final Logger logger = LoggerFactory.getLogger(PhidgetProtocol.class);

  private volatile PhidgetConfig config;
  private final int numLanes;
  private ProtocolListener listener;
  private int interfaceIndex;
  private volatile boolean opened = false;
  private ScheduledExecutorService statusScheduler;

  private final List<DigitalInput> digitalInputs = new ArrayList<>();
  private final List<DigitalOutput> digitalOutputs = new ArrayList<>();
  private final List<VoltageRatioInput> analogInputs = new ArrayList<>();

  private final Map<Integer, DigitalOutput> relayOutputs = new HashMap<>();
  private final Map<Integer, DigitalOutput> analogLedOutputs = new HashMap<>();
  private final Map<Integer, DigitalOutput> digitalOutputsByChannel = new HashMap<>();
  private DigitalOutput mainRelayOutput;

  private final long[] lastLapTimeNanos;
  private final long[] lastSegmentTimeNanos;

  // Refueling and pit state tracking
  private final boolean[] laneInPits;
  private final long[] lastRefuelTimeMs;
  private final int[] lastPitOutState;
  private final int[] lastLapPinState;
  private ScheduledFuture<?> refuelFuture;

  public PhidgetProtocol(PhidgetConfig config, int numLanes, ProtocolListener listener) {
    this.config = config;
    this.numLanes = numLanes;
    this.listener = listener;
    this.lastLapTimeNanos = new long[numLanes];
    this.lastSegmentTimeNanos = new long[numLanes];
    this.laneInPits = new boolean[numLanes];
    this.lastRefuelTimeMs = new long[numLanes];
    this.lastPitOutState = new int[numLanes];
    this.lastLapPinState = new int[numLanes];
    for (int i = 0; i < numLanes; i++) {
      this.lastPitOutState[i] = -1;
      this.lastLapPinState[i] = -1;
    }
  }

  public void updateConfig(PhidgetConfig newConfig) {
    this.config = newConfig;
    // Real implementation would reopen connections based on new config
    // but for now we require restart.
  }

  @Override
  public boolean open() {
    try {
      // Open Digital Inputs
      for (int i = 0; i < config.digitalInIds.size(); i++) {
        int behavior = config.digitalInIds.get(i);
        if (behavior != PinBehavior.BEHAVIOR_UNUSED_VALUE) {
          DigitalInput di = new DigitalInput();
          if (config.serialNumber > 0) {
            di.setDeviceSerialNumber(config.serialNumber);
          }
          if (config.isHubPort) {
            di.setHubPort(config.hubPort);
            di.setIsHubPortDevice(true);
          }
          di.setChannel(i);
          final int channel = i;
          final int pinBehavior = behavior;

          di.addStateChangeListener(
              new DigitalInputStateChangeListener() {
                @Override
                public void onStateChange(DigitalInputStateChangeEvent e) {
                  handleDigitalInputStateChange(channel, pinBehavior, e.getState());
                }
              });

          di.open(5000);
          digitalInputs.add(di);
          logger.info("Opened Phidget Digital Input channel {}", i);
        }
      }

      // Open Digital Outputs
      for (int i = 0; i < config.digitalOutIds.size(); i++) {
        int behavior = config.digitalOutIds.get(i);
        if (behavior != PinBehavior.BEHAVIOR_UNUSED_VALUE) {
          DigitalOutput out = new DigitalOutput();
          if (config.serialNumber > 0) {
            out.setDeviceSerialNumber(config.serialNumber);
          }
          if (config.isHubPort) {
            out.setHubPort(config.hubPort);
            out.setIsHubPortDevice(true);
          }
          out.setChannel(i);
          out.open(5000);
          digitalOutputs.add(out);
          digitalOutputsByChannel.put(i, out);
          logger.info("Opened Phidget Digital Output channel {}", i);

          if (behavior == PinBehavior.BEHAVIOR_RELAY_VALUE) {
            mainRelayOutput = out;
          } else if (behavior >= PinBehavior.BEHAVIOR_RELAY_BASE_VALUE
              && behavior < PinBehavior.BEHAVIOR_RELAY_BASE_VALUE + 64) {
            int lane = behavior - PinBehavior.BEHAVIOR_RELAY_BASE_VALUE;
            relayOutputs.put(lane, out);
          } else if (behavior == PinBehavior.BEHAVIOR_ANALOG_LED_GREEN_FLAG_VALUE
              || behavior == PinBehavior.BEHAVIOR_ANALOG_LED_YELLOW_FLAG_VALUE
              || (behavior >= PinBehavior.BEHAVIOR_ANALOG_LED_COUNTDOWN_1_VALUE
                  && behavior <= PinBehavior.BEHAVIOR_ANALOG_LED_COUNTDOWN_5_VALUE)) {
            analogLedOutputs.put(behavior, out);
          }
        }
      }

      // Open Analog Inputs
      for (int i = 0; i < config.analogIds.size(); i++) {
        int behavior = config.analogIds.get(i);
        if (behavior != PinBehavior.BEHAVIOR_UNUSED_VALUE) {
          VoltageRatioInput vi = new VoltageRatioInput();
          if (config.serialNumber > 0) {
            vi.setDeviceSerialNumber(config.serialNumber);
          }
          if (config.isHubPort) {
            vi.setHubPort(config.hubPort);
            vi.setIsHubPortDevice(true);
          }
          vi.setChannel(i);

          final int channel = i;
          final int pinBehavior = behavior;

          vi.addVoltageRatioChangeListener(
              new VoltageRatioInputVoltageRatioChangeListener() {
                @Override
                public void onVoltageRatioChange(VoltageRatioInputVoltageRatioChangeEvent e) {
                  handleAnalogInputStateChange(channel, pinBehavior, e.getVoltageRatio());
                }
              });

          vi.open(5000);
          analogInputs.add(vi);
          logger.info("Opened Phidget Analog Input channel {}", i);
        }
      }

      opened = true;
      startStatusScheduler();
      return true;
    } catch (Throwable e) {
      String msg = e.getMessage() != null ? e.getMessage() : e.toString();
      logger.error("Phidget interface index {} could not be opened: {}", interfaceIndex, msg);
      close();
      return false;
    }
  }

  private synchronized void startStatusScheduler() {
    stopStatusScheduler();
    statusScheduler = Executors.newSingleThreadScheduledExecutor();
    statusScheduler.scheduleAtFixedRate(
        () -> {
          try {
            if (listener != null) {
              InterfaceStatus status =
                  isHealthy() ? InterfaceStatus.CONNECTED : InterfaceStatus.DISCONNECTED;
              listener.onInterfaceStatus(status, interfaceIndex);
            }
          } catch (Exception e) {
            String msg = e.getMessage() != null ? e.getMessage() : e.toString();
            logger.error(
                "Error in status scheduler for Phidget interface index {}: {}",
                interfaceIndex,
                msg);
          }
        },
        0,
        1,
        TimeUnit.SECONDS);

    refuelFuture =
        statusScheduler.scheduleAtFixedRate(
            () -> {
              try {
                if (listener != null) {
                  long currentTime = System.currentTimeMillis();
                  for (int lane = 0; lane < numLanes; lane++) {
                    if (laneInPits[lane]) {
                      double deltaTimeSeconds = 0.0;
                      if (lastRefuelTimeMs[lane] > 0) {
                        deltaTimeSeconds = (currentTime - lastRefuelTimeMs[lane]) / 1000.0;
                      }
                      lastRefuelTimeMs[lane] = currentTime;

                      listener.onCarData(
                          new CarData(
                              lane,
                              deltaTimeSeconds,
                              0,
                              0,
                              true,
                              CarLocation.PitRow,
                              CarLocation.PitRow,
                              -1));
                    }
                  }
                }
              } catch (Exception e) {
                logger.error("Error in Phidget refuel scheduler", e);
              }
            },
            0,
            100,
            TimeUnit.MILLISECONDS);
  }

  private synchronized void stopStatusScheduler() {
    if (refuelFuture != null) {
      refuelFuture.cancel(true);
      refuelFuture = null;
    }
    if (statusScheduler != null) {
      statusScheduler.shutdownNow();
      statusScheduler = null;
    }
  }

  private synchronized void updatePitState(int laneIndex, boolean inPits) {
    if (laneIndex < 0 || laneIndex >= numLanes) return;
    if (laneInPits[laneIndex] != inPits) {
      logger.info(
          "Phidget updatePitState: Lane {} transition to {}",
          laneIndex,
          inPits ? "IN_PITS" : "OUT_PITS");
      laneInPits[laneIndex] = inPits;

      if (inPits) {
        lastRefuelTimeMs[laneIndex] = System.currentTimeMillis();
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

  private boolean hasPitInConfigured(int lane) {
    if (config != null && config.lapPinPitBehavior != null) {
      if (config.lapPinPitBehavior == LapPinPitBehavior.PIT_IN
          || config.lapPinPitBehavior == LapPinPitBehavior.PIT_IN_OUT) {
        return true;
      }
    }
    if (config != null && config.digitalInIds != null) {
      int pitInBehavior = PinBehavior.BEHAVIOR_PIT_IN_BASE_VALUE + lane;
      int pitInOutBehavior = PinBehavior.BEHAVIOR_PIT_IN_OUT_BASE_VALUE + lane;
      for (int behavior : config.digitalInIds) {
        if (behavior == pitInBehavior || behavior == pitInOutBehavior) {
          return true;
        }
      }
    }
    return false;
  }

  private void handleLapPinBehavior(int lane, int channel, boolean active) {
    if (lane < 0 || lane >= numLanes) return;

    if (active) {
      long now = System.nanoTime();
      double lapTimeSeconds =
          (lastLapTimeNanos[lane] > 0) ? (now - lastLapTimeNanos[lane]) / 1_000_000_000.0 : 0.0;
      lastLapTimeNanos[lane] = now;
      lastSegmentTimeNanos[lane] = now;
      listener.onLap(lane, lapTimeSeconds, channel, interfaceIndex);

      LapPinPitBehavior lapPitBehavior = config.lapPinPitBehavior;
      if (lapPitBehavior == LapPinPitBehavior.PIT_IN
          || lapPitBehavior == LapPinPitBehavior.PIT_IN_OUT) {
        updatePitState(lane, true);
      } else if (lapPitBehavior == LapPinPitBehavior.PIT_OUT) {
        if (hasPitInConfigured(lane)) {
          if (lastLapPinState[lane] == 1) {
            updatePitState(lane, false);
          }
        } else {
          updatePitState(lane, false);
        }
      }
    } else {
      LapPinPitBehavior lapPitBehavior = config.lapPinPitBehavior;
      if (lapPitBehavior == LapPinPitBehavior.PIT_IN_OUT) {
        updatePitState(lane, false);
      } else if (lapPitBehavior == LapPinPitBehavior.PIT_OUT) {
        if (hasPitInConfigured(lane) && lastLapPinState[lane] == 1) {
          updatePitState(lane, false);
        }
      }
    }
    lastLapPinState[lane] = active ? 1 : 0;
  }

  private synchronized void handleDigitalInputStateChange(
      int channel, int behavior, boolean state) {
    if (listener == null) return;

    // Invert if needed based on config
    boolean active = config.normallyClosedLaneSensors ? !state : state;

    if (behavior >= PinBehavior.BEHAVIOR_LAP_BASE_VALUE
        && behavior < PinBehavior.BEHAVIOR_LAP_BASE_VALUE + 64) {
      int lane = behavior - PinBehavior.BEHAVIOR_LAP_BASE_VALUE;
      handleLapPinBehavior(lane, channel, active);
    } else if (behavior >= PinBehavior.BEHAVIOR_SEGMENT_BASE_VALUE
        && behavior < PinBehavior.BEHAVIOR_SEGMENT_BASE_VALUE + 64) {
      int lane = behavior - PinBehavior.BEHAVIOR_SEGMENT_BASE_VALUE;
      if (active && lane >= 0 && lane < numLanes) {
        long now = System.nanoTime();
        double segmentTimeSeconds =
            (lastSegmentTimeNanos[lane] > 0)
                ? (now - lastSegmentTimeNanos[lane]) / 1_000_000_000.0
                : 0.0;
        lastSegmentTimeNanos[lane] = now;
        listener.onSegment(lane, segmentTimeSeconds, channel, interfaceIndex);
      }
    } else if (behavior == PinBehavior.BEHAVIOR_CALL_BUTTON_VALUE) {
      if (active) {
        listener.onCallbutton(-1, interfaceIndex);
      }
    } else if (behavior >= PinBehavior.BEHAVIOR_CALL_BUTTON_BASE_VALUE
        && behavior < PinBehavior.BEHAVIOR_CALL_BUTTON_BASE_VALUE + 64) {
      int lane = behavior - PinBehavior.BEHAVIOR_CALL_BUTTON_BASE_VALUE;
      if (active) {
        listener.onCallbutton(lane, interfaceIndex);
      }
    } else if (behavior >= PinBehavior.BEHAVIOR_PIT_IN_BASE_VALUE
        && behavior < PinBehavior.BEHAVIOR_PIT_IN_BASE_VALUE + 64) {
      int lane = behavior - PinBehavior.BEHAVIOR_PIT_IN_BASE_VALUE;
      if (active && lane >= 0 && lane < numLanes) {
        updatePitState(lane, true);
      }
    } else if (behavior >= PinBehavior.BEHAVIOR_PIT_OUT_BASE_VALUE
        && behavior < PinBehavior.BEHAVIOR_PIT_OUT_BASE_VALUE + 64) {
      int lane = behavior - PinBehavior.BEHAVIOR_PIT_OUT_BASE_VALUE;
      if (lane >= 0 && lane < numLanes) {
        int activeState = active ? 1 : 0;
        if (hasPitInConfigured(lane)) {
          if (lastPitOutState[lane] == 1 && activeState == 0) {
            updatePitState(lane, false);
          }
        } else {
          if (activeState == 1) {
            updatePitState(lane, false);
          }
        }
        lastPitOutState[lane] = activeState;
      }
    } else if (behavior >= PinBehavior.BEHAVIOR_PIT_IN_OUT_BASE_VALUE
        && behavior < PinBehavior.BEHAVIOR_PIT_IN_OUT_BASE_VALUE + 64) {
      int lane = behavior - PinBehavior.BEHAVIOR_PIT_IN_OUT_BASE_VALUE;
      if (lane >= 0 && lane < numLanes) {
        updatePitState(lane, active);
      }
    }

    // Emit raw event for UI
    InterfaceEvent event =
        InterfaceEvent.newBuilder()
            .setDigitalPin(
                InterfaceDigitalPinEvent.newBuilder()
                    .setInterfaceIndex(interfaceIndex)
                    .setPin(channel)
                    .setIsDigital(true)
                    .setState(state ? 1 : 0)
                    .build())
            .build();
    listener.onInterfaceEvent(event);
  }

  private void handleAnalogInputStateChange(int channel, int behavior, double voltageRatio) {
    if (listener == null) return;
    if (behavior == -1) return; // PMD fix
    InterfaceEvent event =
        InterfaceEvent.newBuilder()
            .setAnalogData(
                InterfaceAnalogDataEvent.newBuilder()
                    .setInterfaceIndex(interfaceIndex)
                    .setPin(channel)
                    .setValue((int) (voltageRatio * 1023.0))
                    .build())
            .build();
    listener.onInterfaceEvent(event);
  }

  @Override
  public void close() {
    opened = false;
    stopStatusScheduler();
    try {
      for (DigitalInput di : digitalInputs) {
        try {
          di.close();
        } catch (Throwable ignored) {
        }
      }
      for (DigitalOutput out : digitalOutputs) {
        try {
          out.close();
        } catch (Throwable ignored) {
        }
      }
      for (VoltageRatioInput vi : analogInputs) {
        try {
          vi.close();
        } catch (Throwable ignored) {
        }
      }

      digitalInputs.clear();
      digitalOutputs.clear();
      analogInputs.clear();
      relayOutputs.clear();
      analogLedOutputs.clear();
      digitalOutputsByChannel.clear();
      mainRelayOutput = null;

      if (listener != null) {
        listener.onInterfaceStatus(InterfaceStatus.DISCONNECTED, interfaceIndex);
      }
    } catch (Throwable e) {
      String msg = e.getMessage() != null ? e.getMessage() : e.toString();
      logger.error("Error closing Phidget interface index {}: {}", interfaceIndex, msg);
    }
  }

  public void setPinState(boolean isDigital, int pin, boolean isHigh) {
    DigitalOutput out = digitalOutputsByChannel.get(pin);
    if (out != null) {
      try {
        out.setState(isHigh);
      } catch (PhidgetException e) {
        logger.error("Error setting Phidget digital output channel {} state", pin, e);
      }
    }
  }

  @Override
  public void clearLeds() {
    for (DigitalOutput out : analogLedOutputs.values()) {
      try {
        out.setState(false);
      } catch (PhidgetException e) {
        logger.error("Error clearing analog LED", e);
      }
    }
  }

  @Override
  public boolean hasPerLaneRelays() {
    return !relayOutputs.isEmpty();
  }

  @Override
  public boolean hasDigitalFuel() {
    return false; // Implement properly if needed
  }

  @Override
  public boolean hasMainRelay() {
    return mainRelayOutput != null;
  }

  @Override
  public void setListener(ProtocolListener listener) {
    this.listener = listener;
  }

  @Override
  public synchronized void startTimer() {
    long now = System.nanoTime();
    for (int i = 0; i < numLanes; i++) {
      lastLapTimeNanos[i] = now;
      lastSegmentTimeNanos[i] = now;
    }
  }

  @Override
  public synchronized List<PartialTime> stopTimer() {
    long now = System.nanoTime();
    List<PartialTime> partialTimes = new ArrayList<>();
    for (int i = 0; i < numLanes; i++) {
      double lapPartial =
          (lastLapTimeNanos[i] > 0) ? (now - lastLapTimeNanos[i]) / 1_000_000_000.0 : 0.0;
      double segmentPartial =
          (lastSegmentTimeNanos[i] > 0) ? (now - lastSegmentTimeNanos[i]) / 1_000_000_000.0 : 0.0;
      partialTimes.add(new PartialTime(i, lapPartial, segmentPartial));
    }
    return partialTimes;
  }

  @Override
  public void setMainPower(boolean on) {
    if (mainRelayOutput != null) {
      try {
        boolean state = config.normallyClosedRelays ? !on : on;
        mainRelayOutput.setState(state);
      } catch (PhidgetException e) {
        logger.error("Error setting main relay state", e);
      }
    }
  }

  @Override
  public void setLanePower(boolean on, int lane) {
    DigitalOutput out = relayOutputs.get(lane);
    if (out != null) {
      try {
        boolean state = config.normallyClosedRelays ? !on : on;
        out.setState(state);
      } catch (PhidgetException e) {
        logger.error("Error setting lane relay state", e);
      }
    }
  }

  @Override
  public int getNumLanes() {
    return numLanes;
  }

  @Override
  public void setHeatStandings(List<Integer> laneIndices) {}

  @Override
  public void setRefueling(int laneIndex, boolean isRefueling) {}

  @Override
  public void setFuelLevel(int laneIndex, double fuelLevel, double capacity) {}

  @Override
  public void setHeatProgress(double percentage) {}

  @Override
  public void setInterfaceIndex(int index) {
    this.interfaceIndex = index;
  }

  @Override
  public int getInterfaceIndex() {
    return interfaceIndex;
  }

  @Override
  public boolean isHealthy() {
    if (!opened) {
      return false;
    }
    if (digitalInputs.isEmpty() && digitalOutputs.isEmpty() && analogInputs.isEmpty()) {
      return false;
    }
    for (DigitalInput di : digitalInputs) {
      try {
        if (!di.getAttached()) {
          return false;
        }
      } catch (PhidgetException e) {
        return false;
      }
    }
    for (DigitalOutput out : digitalOutputs) {
      try {
        if (!out.getAttached()) {
          return false;
        }
      } catch (PhidgetException e) {
        return false;
      }
    }
    for (VoltageRatioInput vi : analogInputs) {
      try {
        if (!vi.getAttached()) {
          return false;
        }
      } catch (PhidgetException e) {
        return false;
      }
    }
    return true;
  }

  @Override
  public void initializeHardwareState() {
    setMainPower(false);
    for (int i = 0; i < numLanes; i++) {
      setLanePower(false, i);
    }
  }

  @Override
  public void setRaceState(RaceState state, RaceFlag flag, double countdown) {
    // Green flag LED
    DigitalOutput greenOut = analogLedOutputs.get(PinBehavior.BEHAVIOR_ANALOG_LED_GREEN_FLAG_VALUE);
    if (greenOut != null) {
      try {
        greenOut.setState(flag == RaceFlag.GREEN);
      } catch (PhidgetException e) {
        logger.error("Error setting green flag LED", e);
      }
    }

    // Yellow flag LED
    DigitalOutput yellowOut =
        analogLedOutputs.get(PinBehavior.BEHAVIOR_ANALOG_LED_YELLOW_FLAG_VALUE);
    if (yellowOut != null) {
      try {
        yellowOut.setState(flag == RaceFlag.YELLOW);
      } catch (PhidgetException e) {
        logger.error("Error setting yellow flag LED", e);
      }
    }

    // Countdown LEDs 1..5
    int countInt = (int) Math.ceil(countdown);
    for (int i = 1; i <= 5; i++) {
      int behaviorVal = PinBehavior.BEHAVIOR_ANALOG_LED_COUNTDOWN_1_VALUE + (i - 1);
      DigitalOutput cdOut = analogLedOutputs.get(behaviorVal);
      if (cdOut != null) {
        try {
          cdOut.setState(state == RaceState.STARTING && countInt >= i);
        } catch (PhidgetException e) {
          logger.error("Error setting countdown LED " + i, e);
        }
      }
    }
  }
}
