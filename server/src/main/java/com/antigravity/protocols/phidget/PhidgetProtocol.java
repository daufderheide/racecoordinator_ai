package com.antigravity.protocols.phidget;

import com.antigravity.proto.InterfaceAnalogDataEvent;
import com.antigravity.proto.InterfaceDigitalPinEvent;
import com.antigravity.proto.InterfaceEvent;
import com.antigravity.proto.InterfaceStatus;
import com.antigravity.proto.PinBehavior;
import com.antigravity.proto.RaceFlag;
import com.antigravity.proto.RaceState;
import com.antigravity.protocols.DefaultProtocol;
import com.antigravity.protocols.PartialTime;
import com.antigravity.protocols.ProtocolListener;
import com.antigravity.protocols.arduino.ArduinoConfig;
import com.antigravity.protocols.arduino.ArduinoConfig.LapPinPitBehavior;
import com.phidget22.AttachEvent;
import com.phidget22.AttachListener;
import com.phidget22.DetachEvent;
import com.phidget22.DetachListener;
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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class PhidgetProtocol extends DefaultProtocol {
  private static final Logger logger = LoggerFactory.getLogger(PhidgetProtocol.class);

  private volatile PhidgetConfig config;
  private volatile boolean opened = false;
  private volatile boolean attached = false;

  private final List<DigitalInput> digitalInputs = new ArrayList<>();
  private final List<DigitalOutput> digitalOutputs = new ArrayList<>();
  private final List<VoltageRatioInput> analogInputs = new ArrayList<>();

  private final Map<Integer, DigitalOutput> relayOutputs = new HashMap<>();
  private final Map<Integer, DigitalOutput> analogLedOutputs = new HashMap<>();
  private final Map<Integer, DigitalOutput> digitalOutputsByChannel = new HashMap<>();
  private DigitalOutput mainRelayOutput;

  private final long[] lastLapTimeNanos;
  private final long[] lastSegmentTimeNanos;

  public PhidgetProtocol(PhidgetConfig config, int numLanes, ProtocolListener listener) {
    super(numLanes);
    this.config = config;
    setListener(listener);
    this.lastLapTimeNanos = new long[numLanes];
    this.lastSegmentTimeNanos = new long[numLanes];
  }

  public void updateConfig(PhidgetConfig newConfig) {
    this.config = newConfig;
  }

  // --- Abstract Configuration Hooks for DefaultProtocol ---

  @Override
  protected boolean isNormallyClosedLaneSensors() {
    return config != null && config.normallyClosedLaneSensors;
  }

  @Override
  protected boolean isNormallyClosedRelays() {
    return config != null && config.normallyClosedRelays;
  }

  @Override
  protected ArduinoConfig.LapPinPitBehavior getLapPinPitBehavior() {
    if (config != null && config.lapPinPitBehavior != null) {
      return config.lapPinPitBehavior;
    }
    return ArduinoConfig.LapPinPitBehavior.NONE;
  }

  @Override
  protected boolean useLapsForSegments() {
    return config != null && config.useLapsForSegments && hasSegmentSensors();
  }

  @Override
  protected double getHardwareDebounceUs() {
    return 0.0;
  }

  @Override
  protected boolean hasPitInConfigured(int laneIndex) {
    if (config != null && config.lapPinPitBehavior != null) {
      if (config.lapPinPitBehavior == LapPinPitBehavior.PIT_IN
          || config.lapPinPitBehavior == LapPinPitBehavior.PIT_IN_OUT) {
        return true;
      }
    }
    if (config != null && config.digitalInIds != null) {
      int pitInBehavior = PinBehavior.BEHAVIOR_PIT_IN_BASE_VALUE + laneIndex;
      int pitInOutBehavior = PinBehavior.BEHAVIOR_PIT_IN_OUT_BASE_VALUE + laneIndex;
      for (int behavior : config.digitalInIds) {
        if (behavior == pitInBehavior || behavior == pitInOutBehavior) {
          return true;
        }
      }
    }
    return false;
  }

  private boolean hasSegmentSensors() {
    if (config != null && config.digitalInIds != null) {
      for (int behavior : config.digitalInIds) {
        if (behavior >= PinBehavior.BEHAVIOR_SEGMENT_BASE_VALUE
            && behavior < PinBehavior.BEHAVIOR_SEGMENT_BASE_VALUE + 64) {
          return true;
        }
      }
    }
    return false;
  }

  // --- Protocol Lifecycle ---

  @Override
  public boolean open() {
    if (config == null || config.serialNumber <= 0) {
      logger.info(
          "No Phidget device selected for interface index {} (serialNumber: {})",
          getInterfaceIndex(),
          config != null ? config.serialNumber : 0);
      opened = false;
      attached = false;
      return false;
    }
    try {
      openDigitalInputs();
      openDigitalOutputs();
      openAnalogInputs();

      opened = true;
      attached = true;
      startStatusScheduler();
      return true;
    } catch (Throwable e) {
      String msg = e.getMessage() != null ? e.getMessage() : e.toString();
      logger.error("Phidget interface index {} could not be opened: {}", getInterfaceIndex(), msg);
      close();
      return false;
    }
  }

  private void openDigitalInputs() throws PhidgetException {
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

        di.addDetachListener(
            new DetachListener() {
              @Override
              public void onDetach(DetachEvent e) {
                logger.warn("Phidget DigitalInput channel detached");
                attached = false;
              }
            });

        di.addAttachListener(
            new AttachListener() {
              @Override
              public void onAttach(AttachEvent e) {
                logger.info("Phidget DigitalInput channel attached");
                attached = true;
              }
            });

        di.open(5000);
        digitalInputs.add(di);
        logger.info("Opened Phidget Digital Input channel {}", i);
      }
    }
  }

  private void openDigitalOutputs() throws PhidgetException {
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

        out.addDetachListener(
            new DetachListener() {
              @Override
              public void onDetach(DetachEvent e) {
                logger.warn("Phidget DigitalOutput channel detached");
                attached = false;
              }
            });

        out.addAttachListener(
            new AttachListener() {
              @Override
              public void onAttach(AttachEvent e) {
                logger.info("Phidget DigitalOutput channel attached");
                attached = true;
              }
            });

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
  }

  private void openAnalogInputs() throws PhidgetException {
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

        vi.addDetachListener(
            new DetachListener() {
              @Override
              public void onDetach(DetachEvent e) {
                logger.warn("Phidget VoltageRatioInput channel detached");
                attached = false;
              }
            });

        vi.addAttachListener(
            new AttachListener() {
              @Override
              public void onAttach(AttachEvent e) {
                logger.info("Phidget VoltageRatioInput channel attached");
                attached = true;
              }
            });

        vi.open(5000);
        analogInputs.add(vi);
        logger.info("Opened Phidget Analog Input channel {}", i);
      }
    }
  }

  @Override
  public void close() {
    opened = false;
    attached = false;
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
        listener.onInterfaceStatus(InterfaceStatus.DISCONNECTED, getInterfaceIndex());
      }
    } catch (Throwable e) {
      String msg = e.getMessage() != null ? e.getMessage() : e.toString();
      logger.error("Error closing Phidget interface index {}: {}", getInterfaceIndex(), msg);
    }
  }

  // --- Input Event Dispatching ---

  private void handleLapPinBehavior(int lane, int channel, boolean active) {
    if (lane < 0 || lane >= getNumLanes()) return;

    if (active) {
      long now = System.nanoTime();
      double lapTimeSeconds =
          (lastLapTimeNanos[lane] > 0) ? (now - lastLapTimeNanos[lane]) / 1_000_000_000.0 : 0.0;
      lastLapTimeNanos[lane] = now;

      if (useLapsForSegments()) {
        double segmentTimeSeconds =
            (lastSegmentTimeNanos[lane] > 0)
                ? (now - lastSegmentTimeNanos[lane]) / 1_000_000_000.0
                : 0.0;
        if (listener != null) {
          listener.onSegment(lane, segmentTimeSeconds, channel, getInterfaceIndex());
        }
      }
      lastSegmentTimeNanos[lane] = now;

      if (listener != null) {
        listener.onLap(lane, lapTimeSeconds, channel, getInterfaceIndex());
      }

      LapPinPitBehavior lapPitBehavior = getLapPinPitBehavior();
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
      LapPinPitBehavior lapPitBehavior = getLapPinPitBehavior();
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

    boolean active = isNormallyClosedLaneSensors() ? !state : state;

    if (behavior >= PinBehavior.BEHAVIOR_LAP_BASE_VALUE
        && behavior < PinBehavior.BEHAVIOR_LAP_BASE_VALUE + 64) {
      int lane = behavior - PinBehavior.BEHAVIOR_LAP_BASE_VALUE;
      handleLapPinBehavior(lane, channel, active);
    } else if (behavior >= PinBehavior.BEHAVIOR_SEGMENT_BASE_VALUE
        && behavior < PinBehavior.BEHAVIOR_SEGMENT_BASE_VALUE + 64) {
      int lane = behavior - PinBehavior.BEHAVIOR_SEGMENT_BASE_VALUE;
      if (active && lane >= 0 && lane < getNumLanes()) {
        long now = System.nanoTime();
        double segmentTimeSeconds =
            (lastSegmentTimeNanos[lane] > 0)
                ? (now - lastSegmentTimeNanos[lane]) / 1_000_000_000.0
                : 0.0;
        lastSegmentTimeNanos[lane] = now;
        listener.onSegment(lane, segmentTimeSeconds, channel, getInterfaceIndex());
      }
    } else if (behavior == PinBehavior.BEHAVIOR_CALL_BUTTON_VALUE) {
      if (active) {
        listener.onCallbutton(-1, getInterfaceIndex());
      }
    } else if (behavior >= PinBehavior.BEHAVIOR_CALL_BUTTON_BASE_VALUE
        && behavior < PinBehavior.BEHAVIOR_CALL_BUTTON_BASE_VALUE + 64) {
      int lane = behavior - PinBehavior.BEHAVIOR_CALL_BUTTON_BASE_VALUE;
      if (active) {
        listener.onCallbutton(lane, getInterfaceIndex());
      }
    } else if (behavior >= PinBehavior.BEHAVIOR_PIT_IN_BASE_VALUE
        && behavior < PinBehavior.BEHAVIOR_PIT_IN_BASE_VALUE + 64) {
      int lane = behavior - PinBehavior.BEHAVIOR_PIT_IN_BASE_VALUE;
      if (active && lane >= 0 && lane < getNumLanes()) {
        updatePitState(lane, true);
      }
    } else if (behavior >= PinBehavior.BEHAVIOR_PIT_OUT_BASE_VALUE
        && behavior < PinBehavior.BEHAVIOR_PIT_OUT_BASE_VALUE + 64) {
      int lane = behavior - PinBehavior.BEHAVIOR_PIT_OUT_BASE_VALUE;
      if (lane >= 0 && lane < getNumLanes()) {
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
      if (lane >= 0 && lane < getNumLanes()) {
        updatePitState(lane, active);
      }
    }

    InterfaceEvent event =
        InterfaceEvent.newBuilder()
            .setDigitalPin(
                InterfaceDigitalPinEvent.newBuilder()
                    .setInterfaceIndex(getInterfaceIndex())
                    .setPin(channel)
                    .setIsDigital(true)
                    .setState(state ? 1 : 0)
                    .build())
            .build();
    listener.onInterfaceEvent(event);
  }

  private void handleAnalogInputStateChange(int channel, int behavior, double voltageRatio) {
    if (listener == null) return;
    if (behavior == -1) return;
    InterfaceEvent event =
        InterfaceEvent.newBuilder()
            .setAnalogData(
                InterfaceAnalogDataEvent.newBuilder()
                    .setInterfaceIndex(getInterfaceIndex())
                    .setPin(channel)
                    .setValue((int) (voltageRatio * 1023.0))
                    .build())
            .build();
    listener.onInterfaceEvent(event);
  }

  // --- Hardware Control & Timing ---

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
    return false;
  }

  @Override
  public boolean hasMainRelay() {
    return mainRelayOutput != null;
  }

  @Override
  public synchronized void startTimer() {
    long now = System.nanoTime();
    for (int i = 0; i < getNumLanes(); i++) {
      lastLapTimeNanos[i] = now;
      lastSegmentTimeNanos[i] = now;
    }
  }

  @Override
  public synchronized List<PartialTime> stopTimer() {
    long now = System.nanoTime();
    List<PartialTime> partialTimes = new ArrayList<>();
    for (int i = 0; i < getNumLanes(); i++) {
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
    super.setMainPower(on);
    if (mainRelayOutput != null) {
      try {
        boolean state = isNormallyClosedRelays() ? !on : on;
        mainRelayOutput.setState(state);
      } catch (PhidgetException e) {
        logger.error("Error setting main relay state", e);
      }
    }
  }

  @Override
  public void setLanePower(boolean on, int lane) {
    super.setLanePower(on, lane);
    DigitalOutput out = relayOutputs.get(lane);
    if (out != null) {
      try {
        boolean state = isNormallyClosedRelays() ? !on : on;
        out.setState(state);
      } catch (PhidgetException e) {
        logger.error("Error setting lane relay state", e);
      }
    }
  }

  @Override
  protected boolean requiresHeartbeat() {
    return false;
  }

  @Override
  public boolean isConnected() {
    return opened && attached && config != null && config.serialNumber > 0;
  }

  @Override
  public boolean isHealthy() {
    return opened && attached && config != null && config.serialNumber > 0;
  }

  @Override
  public void initializeHardwareState() {
    super.initializeHardwareState();
    setMainPower(false);
    for (int i = 0; i < getNumLanes(); i++) {
      setLanePower(false, i);
    }
  }

  @Override
  public void setRaceState(RaceState state, RaceFlag flag, double countdown) {
    super.setRaceState(state, flag, countdown);
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
