package com.antigravity.protocols.phidget;

import com.antigravity.proto.InterfaceAnalogDataEvent;
import com.antigravity.proto.InterfaceDigitalPinEvent;
import com.antigravity.proto.InterfaceEvent;
import com.antigravity.proto.InterfaceStatus;
import com.antigravity.proto.PinBehavior;
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
import com.phidget22.ErrorCode;
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

  static List<String> getNativeLibraryPaths(String osName, String osArch, String userDir) {
    List<String> paths = new ArrayList<>();
    osName = osName.toLowerCase();
    if (osName.contains("mac")) {
      paths.add(
          java.nio.file.Paths.get(userDir, "lib", "macos", "libphidget22java.jnilib")
              .toAbsolutePath()
              .toString());
    } else if (osName.contains("win")) {
      String archDir = osArch.toLowerCase().contains("64") ? "x64" : "x86";
      java.nio.file.Path baseDir =
          java.nio.file.Paths.get(userDir, "lib", "windows", archDir).toAbsolutePath();
      paths.add(baseDir.resolve("phidget22extra.dll").toString());
      paths.add(baseDir.resolve("phidget22.dll").toString());
      paths.add(baseDir.resolve("phidget22java.dll").toString());
    }
    return paths;
  }

  static {
    try {
      if (!"true".equals(System.getProperty("skip.jni.load"))) {
        List<String> paths =
            getNativeLibraryPaths(
                System.getProperty("os.name"),
                System.getProperty("os.arch"),
                System.getProperty("user.dir"));
        for (String path : paths) {
          logger.info("Loading Phidget native library from absolute path: {}", path);
          System.load(path);
        }
        String version = com.phidget22.Phidget.getLibraryVersion();
        logger.info("Phidget22 native library initialized successfully. Version: {}", version);
      } else {
        logger.info("Skipping Phidget22 JNI library load for test environment.");
      }
    } catch (Throwable e) {
      logger.error("Failed to initialize Phidget22 native library", e);
    }
  }

  private volatile PhidgetConfig config;
  private volatile boolean opened = false;
  private volatile boolean attached = false;
  private final java.util.concurrent.atomic.AtomicInteger attachedChannelCount =
      new java.util.concurrent.atomic.AtomicInteger(0);

  private final List<DigitalInput> digitalInputs = new ArrayList<>();
  private final List<DigitalOutput> digitalOutputs = new ArrayList<>();
  private final List<VoltageRatioInput> analogInputs = new ArrayList<>();

  private final Map<Integer, DigitalOutput> relayOutputs = new HashMap<>();
  private final Map<Integer, DigitalOutput> analogLedOutputs = new HashMap<>();
  private final Map<Integer, DigitalOutput> digitalOutputsByChannel = new HashMap<>();
  private DigitalOutput mainRelayOutput;
  private com.phidget22.Manager keepAliveManager;

  public PhidgetProtocol(PhidgetConfig config, int numLanes, ProtocolListener listener) {
    super(numLanes);
    this.config = config;
    setListener(listener);
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
  public synchronized boolean open() {
    if (opened) {
      return true;
    }
    if (config == null || config.serialNumber <= 0) {
      logger.info(
          "No Phidget device selected for interface index {} (serialNumber: {})",
          getInterfaceIndex(),
          config != null ? config.serialNumber : 0);
      opened = false;
      attached = false;
      if (listener != null) {
        listener.onInterfaceStatus(InterfaceStatus.DISCONNECTED, getInterfaceIndex());
      }
      startStatusScheduler();
      return true;
    }
    try {
      keepAliveManager = new com.phidget22.Manager();
      keepAliveManager.open();
    } catch (Throwable e) {
      logger.warn("Failed to open keepAliveManager for Phidgets", e);
    }

    try {
      openDigitalInputs();
      openDigitalOutputs();
      openAnalogInputs();

      int openedChannelCount = digitalInputs.size() + digitalOutputs.size() + analogInputs.size();
      if (openedChannelCount == 0 && hasConfiguredPins()) {
        logger.warn(
            "No configured Phidget channels could be opened for interface index {}",
            getInterfaceIndex());
        opened = false;
        attached = false;
        return false;
      }

      opened = true;
      checkAttachmentStatus();
      syncPower();
      syncAnalogLeds();
      startStatusScheduler();
      return true;
    } catch (Throwable e) {
      String msg = e.getMessage() != null ? e.getMessage() : e.toString();
      logger.error("Phidget interface index {} could not be opened: {}", getInterfaceIndex(), msg);
      close();
      return false;
    }
  }

  private boolean hasConfiguredPins() {
    if (config == null) return false;
    if (config.digitalInIds != null) {
      for (int behavior : config.digitalInIds) {
        if (behavior != PinBehavior.BEHAVIOR_UNUSED_VALUE) return true;
      }
    }
    if (config.digitalOutIds != null) {
      for (int behavior : config.digitalOutIds) {
        if (behavior != PinBehavior.BEHAVIOR_UNUSED_VALUE) return true;
      }
    }
    if (config.analogIds != null) {
      for (int behavior : config.analogIds) {
        if (behavior != PinBehavior.BEHAVIOR_UNUSED_VALUE) return true;
      }
    }
    return false;
  }

  boolean isAnyChannelAttached() {
    try {
      for (DigitalInput di : digitalInputs) {
        if (di.getAttached()) return true;
      }
      for (DigitalOutput out : digitalOutputs) {
        if (out.getAttached()) return true;
      }
      for (VoltageRatioInput vi : analogInputs) {
        if (vi.getAttached()) return true;
      }
    } catch (PhidgetException e) {
      logger.error("Error querying attachment status", e);
    }
    return false;
  }

  private synchronized void checkAttachmentStatus() {
    if (!hasConfiguredPins()) {
      boolean wasAttached = this.attached;
      this.attached = true;
      if (this.attached != wasAttached && this.opened && listener != null) {
        InterfaceStatus status =
            isHealthy() ? InterfaceStatus.CONNECTED : InterfaceStatus.DISCONNECTED;
        listener.onInterfaceStatus(status, getInterfaceIndex());
      }
      return;
    }

    boolean anyAttached = isAnyChannelAttached();

    boolean wasAttached = this.attached;
    this.attached = anyAttached;

    logger.info(
        "checkAttachmentStatus evaluated anyAttached={} (was={}), opened={}, serialNumber={}, isHealthy={}, inputs={}, outputs={}, analog={}",
        anyAttached,
        wasAttached,
        opened,
        config != null ? config.serialNumber : "null",
        isHealthy(),
        digitalInputs.size(),
        digitalOutputs.size(),
        analogInputs.size());

    if (this.attached != wasAttached && this.opened && listener != null) {
      InterfaceStatus status =
          isHealthy() ? InterfaceStatus.CONNECTED : InterfaceStatus.DISCONNECTED;
      listener.onInterfaceStatus(status, getInterfaceIndex());
    }
  }

  private void openDigitalInputs() {
    if (config.digitalInIds == null) return;
    for (int i = 0; i < config.digitalInIds.size(); i++) {
      Integer behaviorObj = config.digitalInIds.get(i);
      if (behaviorObj == null) continue;
      int behavior = behaviorObj;
      if (behavior != PinBehavior.BEHAVIOR_UNUSED_VALUE) {
        try {
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

          di.addAttachListener(
              new AttachListener() {
                @Override
                public void onAttach(AttachEvent e) {
                  logger.info("Phidget DigitalInput channel {} attached", channel);
                  attachedChannelCount.incrementAndGet();
                  checkAttachmentStatus();
                }
              });

          di.addDetachListener(
              new DetachListener() {
                @Override
                public void onDetach(DetachEvent e) {
                  logger.info("Phidget DigitalInput channel {} detached", channel);
                  attachedChannelCount.decrementAndGet();
                  checkAttachmentStatus();
                }
              });

          digitalInputs.add(di);
          try {
            di.open(500);
          } catch (PhidgetException e) {
            if (e.getErrorCode() == ErrorCode.TIMEOUT) {
              logger.info(
                  "Phidget Digital Input channel {} opened, waiting for device attachment (serialNumber: {})",
                  i,
                  config.serialNumber);
            } else {
              digitalInputs.remove(di);
              throw e;
            }
          }
          logger.info("Opened Phidget Digital Input channel {}", i);
        } catch (PhidgetException e) {
          if (e.getErrorCode() != ErrorCode.TIMEOUT) {
            logger.warn("Phidget Digital Input channel {} could not be opened", i, e);
          }
        } catch (Throwable e) {
          logger.warn("Phidget Digital Input channel {} could not be opened", i, e);
        }
      }
    }
  }

  private void openDigitalOutputs() {
    if (config.digitalOutIds == null) return;
    for (int i = 0; i < config.digitalOutIds.size(); i++) {
      Integer behaviorObj = config.digitalOutIds.get(i);
      if (behaviorObj == null) continue;
      int behavior = behaviorObj;
      if (behavior != PinBehavior.BEHAVIOR_UNUSED_VALUE) {
        try {
          DigitalOutput out = new DigitalOutput();
          if (config.serialNumber > 0) {
            out.setDeviceSerialNumber(config.serialNumber);
          }
          if (config.isHubPort) {
            out.setHubPort(config.hubPort);
            out.setIsHubPortDevice(true);
          }
          out.setChannel(i);

          final int channel = i;
          final int pinBehavior = behavior;

          out.addAttachListener(
              new AttachListener() {
                @Override
                public void onAttach(AttachEvent e) {
                  logger.info("Phidget DigitalOutput channel {} attached", channel);
                  attachedChannelCount.incrementAndGet();
                  checkAttachmentStatus();
                  applyOutputChannelState(out, pinBehavior, channel);
                }
              });

          out.addDetachListener(
              new DetachListener() {
                @Override
                public void onDetach(DetachEvent e) {
                  logger.warn("Phidget DigitalOutput channel {} detached", channel);
                  attachedChannelCount.decrementAndGet();
                  checkAttachmentStatus();
                }
              });

          digitalOutputs.add(out);
          digitalOutputsByChannel.put(i, out);

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

          try {
            out.open(500);
          } catch (PhidgetException e) {
            if (e.getErrorCode() == ErrorCode.TIMEOUT) {
              logger.info(
                  "Phidget Digital Output channel {} opened, waiting for device attachment (serialNumber: {})",
                  i,
                  config.serialNumber);
            } else {
              digitalOutputs.remove(out);
              digitalOutputsByChannel.remove(i);
              if (mainRelayOutput == out) {
                mainRelayOutput = null;
              }
              relayOutputs.values().remove(out);
              analogLedOutputs.values().remove(out);
              throw e;
            }
          }
          logger.info("Opened Phidget Digital Output channel {}", i);
        } catch (PhidgetException e) {
          if (e.getErrorCode() != ErrorCode.TIMEOUT) {
            logger.warn("Phidget Digital Output channel {} could not be opened", i, e);
          }
        } catch (Throwable e) {
          logger.warn("Phidget Digital Output channel {} could not be opened", i, e);
        }
      }
    }
  }

  private void applyOutputChannelState(DigitalOutput out, int behavior, int channel) {
    try {
      if (!out.getAttached()) {
        return;
      }
      if (behavior == PinBehavior.BEHAVIOR_RELAY_VALUE) {
        boolean power = lastMainPower != null ? lastMainPower : false;
        boolean state = isNormallyClosedRelays() ? !power : power;
        out.setState(state);
      } else if (behavior >= PinBehavior.BEHAVIOR_RELAY_BASE_VALUE
          && behavior < PinBehavior.BEHAVIOR_RELAY_BASE_VALUE + 64) {
        int lane = behavior - PinBehavior.BEHAVIOR_RELAY_BASE_VALUE;
        boolean power = lastLanePower.getOrDefault(lane, false);
        boolean state = isNormallyClosedRelays() ? !power : power;
        out.setState(state);
      } else if (behavior == PinBehavior.BEHAVIOR_ANALOG_LED_GREEN_FLAG_VALUE) {
        out.setState(isGreenFlagOn);
      } else if (behavior == PinBehavior.BEHAVIOR_ANALOG_LED_YELLOW_FLAG_VALUE) {
        out.setState(isYellowFlagOn);
      } else if (behavior >= PinBehavior.BEHAVIOR_ANALOG_LED_COUNTDOWN_1_VALUE
          && behavior <= PinBehavior.BEHAVIOR_ANALOG_LED_COUNTDOWN_5_VALUE) {
        int idx = behavior - PinBehavior.BEHAVIOR_ANALOG_LED_COUNTDOWN_1_VALUE;
        out.setState(isCountdownOn[idx]);
      }
    } catch (PhidgetException e) {
      logger.error("Error applying output state to Phidget channel {}", channel, e);
    }
  }

  public void syncPower() {
    if (mainRelayOutput != null) {
      boolean power = lastMainPower != null ? lastMainPower : false;
      try {
        if (mainRelayOutput.getAttached()) {
          boolean state = isNormallyClosedRelays() ? !power : power;
          mainRelayOutput.setState(state);
        }
      } catch (PhidgetException e) {
        logger.error("Error setting main relay state during syncPower", e);
      }
    }
    for (Map.Entry<Integer, DigitalOutput> entry : relayOutputs.entrySet()) {
      int lane = entry.getKey();
      DigitalOutput out = entry.getValue();
      if (out != null) {
        boolean power = lastLanePower.getOrDefault(lane, false);
        try {
          if (out.getAttached()) {
            boolean state = isNormallyClosedRelays() ? !power : power;
            out.setState(state);
          }
        } catch (PhidgetException e) {
          logger.error("Error setting lane relay state for lane {} during syncPower", lane + 1, e);
        }
      }
    }
  }

  public void syncAnalogLeds() {
    onAnalogLedsChanged();
  }

  private void openAnalogInputs() {
    if (config.analogIds == null) return;
    for (int i = 0; i < config.analogIds.size(); i++) {
      Integer behaviorObj = config.analogIds.get(i);
      if (behaviorObj == null) continue;
      int behavior = behaviorObj;
      if (behavior != PinBehavior.BEHAVIOR_UNUSED_VALUE) {
        try {
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

          vi.addAttachListener(
              new AttachListener() {
                @Override
                public void onAttach(AttachEvent e) {
                  logger.info("Phidget VoltageRatioInput channel {} attached", channel);
                  attachedChannelCount.incrementAndGet();
                  checkAttachmentStatus();
                }
              });

          vi.addDetachListener(
              new DetachListener() {
                @Override
                public void onDetach(DetachEvent e) {
                  logger.warn("Phidget VoltageRatioInput channel {} detached", channel);
                  attachedChannelCount.decrementAndGet();
                  checkAttachmentStatus();
                }
              });

          analogInputs.add(vi);
          try {
            vi.open(500);
          } catch (PhidgetException e) {
            if (e.getErrorCode() == ErrorCode.TIMEOUT) {
              logger.info(
                  "Phidget Analog Input channel {} opened, waiting for device attachment (serialNumber: {})",
                  i,
                  config.serialNumber);
            } else {
              analogInputs.remove(vi);
              throw e;
            }
          }
          logger.info("Opened Phidget Analog Input channel {}", i);
        } catch (PhidgetException e) {
          if (e.getErrorCode() != ErrorCode.TIMEOUT) {
            logger.warn("Phidget Analog Input channel {} could not be opened", i, e);
          }
        } catch (Throwable e) {
          logger.warn("Phidget Analog Input channel {} could not be opened", i, e);
        }
      }
    }
  }

  @Override
  public synchronized void close() {
    opened = false;
    attached = false;
    stopStatusScheduler();

    if (keepAliveManager != null) {
      try {
        keepAliveManager.close();
      } catch (Throwable ignored) {
      }
      keepAliveManager = null;
    }

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

  private synchronized void handleDigitalInputStateChange(
      int channel, int behavior, boolean state) {
    if (listener == null) return;

    int sensorState = state ? 0 : 1;
    int wantState = isNormallyClosedLaneSensors() ? 1 : 0;

    if (behavior >= PinBehavior.BEHAVIOR_LAP_BASE_VALUE
        && behavior < PinBehavior.BEHAVIOR_LAP_BASE_VALUE + 64) {
      int lane = behavior - PinBehavior.BEHAVIOR_LAP_BASE_VALUE;
      if (lane >= 0 && lane < getNumLanes()) {
        if (sensorState == wantState) {
          addHardwareTimeDeltaNanos(lane, System.nanoTime());
        }
        handleLapCounter(lane, sensorState, channel);
      }
    } else if (behavior >= PinBehavior.BEHAVIOR_SEGMENT_BASE_VALUE
        && behavior < PinBehavior.BEHAVIOR_SEGMENT_BASE_VALUE + 64) {
      int lane = behavior - PinBehavior.BEHAVIOR_SEGMENT_BASE_VALUE;
      if (lane >= 0 && lane < getNumLanes()) {
        if (sensorState == wantState) {
          addHardwareTimeDeltaNanos(lane, System.nanoTime());
        }
        handleSegmentCounter(lane, sensorState, channel);
      }
    } else if (behavior == PinBehavior.BEHAVIOR_CALL_BUTTON_VALUE) {
      handleCallButton(-1, sensorState, channel);
    } else if (behavior >= PinBehavior.BEHAVIOR_CALL_BUTTON_BASE_VALUE
        && behavior < PinBehavior.BEHAVIOR_CALL_BUTTON_BASE_VALUE + 64) {
      int lane = behavior - PinBehavior.BEHAVIOR_CALL_BUTTON_BASE_VALUE;
      if (lane >= 0 && lane < getNumLanes()) {
        handleCallButton(lane, sensorState, channel);
      }
    } else if (behavior >= PinBehavior.BEHAVIOR_PIT_IN_BASE_VALUE
        && behavior < PinBehavior.BEHAVIOR_PIT_IN_BASE_VALUE + 64) {
      int lane = behavior - PinBehavior.BEHAVIOR_PIT_IN_BASE_VALUE;
      handlePitIn(lane, sensorState);
    } else if (behavior >= PinBehavior.BEHAVIOR_PIT_OUT_BASE_VALUE
        && behavior < PinBehavior.BEHAVIOR_PIT_OUT_BASE_VALUE + 64) {
      int lane = behavior - PinBehavior.BEHAVIOR_PIT_OUT_BASE_VALUE;
      handlePitOut(lane, sensorState);
    } else if (behavior >= PinBehavior.BEHAVIOR_PIT_IN_OUT_BASE_VALUE
        && behavior < PinBehavior.BEHAVIOR_PIT_IN_OUT_BASE_VALUE + 64) {
      int lane = behavior - PinBehavior.BEHAVIOR_PIT_IN_OUT_BASE_VALUE;
      handlePitInOut(lane, sensorState);
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
        if (out.getAttached()) {
          out.setState(isHigh);
        } else {
          logger.warn(
              "Cannot set pin state for Phidget digital output channel {}: Channel not attached",
              pin);
        }
      } catch (PhidgetException e) {
        logger.error("Error setting Phidget digital output channel {} state", pin, e);
      }
    }
  }

  @Override
  protected void onAnalogLedsChanged() {
    super.onAnalogLedsChanged();
    setAnalogLedState(PinBehavior.BEHAVIOR_ANALOG_LED_GREEN_FLAG_VALUE, isGreenFlagOn);
    setAnalogLedState(PinBehavior.BEHAVIOR_ANALOG_LED_YELLOW_FLAG_VALUE, isYellowFlagOn);
    setAnalogLedState(PinBehavior.BEHAVIOR_ANALOG_LED_COUNTDOWN_1_VALUE, isCountdownOn[0]);
    setAnalogLedState(PinBehavior.BEHAVIOR_ANALOG_LED_COUNTDOWN_2_VALUE, isCountdownOn[1]);
    setAnalogLedState(PinBehavior.BEHAVIOR_ANALOG_LED_COUNTDOWN_3_VALUE, isCountdownOn[2]);
    setAnalogLedState(PinBehavior.BEHAVIOR_ANALOG_LED_COUNTDOWN_4_VALUE, isCountdownOn[3]);
    setAnalogLedState(PinBehavior.BEHAVIOR_ANALOG_LED_COUNTDOWN_5_VALUE, isCountdownOn[4]);
  }

  private void setAnalogLedState(int behavior, boolean on) {
    DigitalOutput out = analogLedOutputs.get(behavior);
    if (out != null) {
      try {
        if (out.getAttached()) {
          out.setState(on);
        }
      } catch (PhidgetException e) {
        logger.error("Error setting analog LED pin state for behavior {}", behavior, e);
      }
    }
  }

  @Override
  public void clearLeds() {
    super.clearLeds();
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
  public synchronized List<PartialTime> stopTimer() {
    long now = System.nanoTime();
    for (int i = 0; i < getNumLanes(); i++) {
      addHardwareTimeDeltaNanos(i, now);
    }
    return super.stopTimer();
  }

  @Override
  public void setMainPower(boolean on) {
    super.setMainPower(on);
    if (mainRelayOutput != null) {
      try {
        if (mainRelayOutput.getAttached()) {
          boolean state = isNormallyClosedRelays() ? !on : on;
          mainRelayOutput.setState(state);
        }
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
        if (out.getAttached()) {
          boolean state = isNormallyClosedRelays() ? !on : on;
          out.setState(state);
        }
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
  protected boolean canReconnect() {
    return !opened;
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
}
