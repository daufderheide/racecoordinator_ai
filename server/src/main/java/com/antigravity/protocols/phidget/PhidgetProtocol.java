package com.antigravity.protocols.phidget;

import com.antigravity.proto.InterfaceAnalogDataEvent;
import com.antigravity.proto.InterfaceDigitalPinEvent;
import com.antigravity.proto.InterfaceEvent;
import com.antigravity.proto.InterfaceStatus;
import com.antigravity.proto.InterfaceStatusEvent;
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
import com.phidget22.PhidgetException;
import com.phidget22.VoltageRatioInput;
import com.phidget22.VoltageRatioInputVoltageRatioChangeEvent;
import com.phidget22.VoltageRatioInputVoltageRatioChangeListener;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
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
  private volatile boolean managerDeviceAttached = false;
  private final java.util.concurrent.atomic.AtomicInteger attachedChannelCount =
      new java.util.concurrent.atomic.AtomicInteger(0);

  private final List<DigitalInput> digitalInputs = new ArrayList<>();
  private final List<DigitalOutput> digitalOutputs = new ArrayList<>();
  private final List<VoltageRatioInput> analogInputs = new ArrayList<>();

  private final Map<Integer, DigitalInput> digitalInputsByChannel = new HashMap<>();
  private final Map<Integer, DigitalOutput> digitalOutputsByChannel = new HashMap<>();
  private final Map<Integer, VoltageRatioInput> analogInputsByChannel = new HashMap<>();

  private final Map<Integer, DigitalOutput> relayOutputs = new HashMap<>();
  private final Map<Integer, DigitalOutput> analogLedOutputs = new HashMap<>();
  private DigitalOutput mainRelayOutput;
  private com.phidget22.Manager keepAliveManager;

  public PhidgetProtocol(PhidgetConfig config, int numLanes, ProtocolListener listener) {
    super(numLanes);
    this.config = config;
    setListener(listener);
  }

  public PhidgetConfig getConfig() {
    return config;
  }

  private boolean matchesDevice(com.phidget22.Phidget p) {
    if (config == null || config.serialNumber <= 0 || p == null) return false;
    try {
      if (p.getDeviceSerialNumber() != config.serialNumber) return false;
      if (config.isHubPort) {
        return p.getIsHubPortDevice() && p.getHubPort() == config.hubPort;
      }
      return true;
    } catch (Throwable t) {
      return false;
    }
  }

  public synchronized void updateConfig(PhidgetConfig newConfig) {
    if (newConfig == null) return;
    PhidgetConfig oldConfig = this.config;
    this.config = newConfig;

    if (!opened) {
      if (newConfig.serialNumber > 0) {
        open();
      }
      return;
    }

    if (oldConfig != null
        && (oldConfig.serialNumber != newConfig.serialNumber
            || oldConfig.isHubPort != newConfig.isHubPort
            || oldConfig.hubPort != newConfig.hubPort)) {
      close();
      open();
      return;
    }

    updateChannelMappings();
    syncPower();
    syncAnalogLeds();
    checkAttachmentStatus();
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
    if (config == null || config.lapPinPitBehavior == null) {
      return ArduinoConfig.LapPinPitBehavior.PIT_IN_OUT;
    }
    return config.lapPinPitBehavior;
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
  public boolean hasPitInConfigured(int laneIndex) {
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
        InterfaceStatus status = InterfaceStatus.DISCONNECTED;
        InterfaceStatusEvent statusEvent =
            InterfaceStatusEvent.newBuilder()
                .setStatus(status)
                .setInterfaceIndex(getInterfaceIndex())
                .setDetectedChannels(getDetectedChannels())
                .setSupportsRgbLeds(supportsRgbLeds())
                .setVersion(getVersion() != null ? getVersion() : "")
                .build();
        listener.onInterfaceEvent(InterfaceEvent.newBuilder().setStatus(statusEvent).build());
        listener.onInterfaceStatus(status, getInterfaceIndex());
      }
      startStatusScheduler();
      return true;
    }
    try {
      keepAliveManager = new com.phidget22.Manager();
      keepAliveManager.addAttachListener(
          e -> {
            try {
              com.phidget22.Phidget p = e.getChannel();
              if (matchesDevice(p)) {
                logger.info(
                    "Manager detected attach for Phidget device serial {}",
                    config != null ? config.serialNumber : 0);
                managerDeviceAttached = true;
                checkAttachmentStatus();
              }
            } catch (Throwable t) {
              logger.warn("Error in Phidget manager attach listener", t);
            }
          });
      keepAliveManager.addDetachListener(
          e -> {
            try {
              com.phidget22.Phidget p = e.getChannel();
              if (matchesDevice(p)) {
                logger.info(
                    "Manager detected detach for Phidget device serial {}",
                    config != null ? config.serialNumber : 0);
                managerDeviceAttached = false;
                checkAttachmentStatus();
              }
            } catch (Throwable t) {
              logger.warn("Error in Phidget manager detach listener", t);
            }
          });
      keepAliveManager.open();
    } catch (Throwable e) {
      logger.warn("Failed to open keepAliveManager for Phidgets", e);
    }

    try {
      opened = true;
      updateChannelMappings();

      int openedChannelCount = digitalInputs.size() + digitalOutputs.size() + analogInputs.size();
      if (openedChannelCount == 0 && hasConfiguredPins()) {
        logger.warn(
            "No configured Phidget channels could be opened for interface index {}",
            getInterfaceIndex());
        opened = false;
        attached = false;
        return false;
      }

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
      for (Integer behavior : config.digitalInIds) {
        if (behavior != null && behavior != PinBehavior.BEHAVIOR_UNUSED_VALUE) return true;
      }
    }
    if (config.digitalOutIds != null) {
      for (Integer behavior : config.digitalOutIds) {
        if (behavior != null && behavior != PinBehavior.BEHAVIOR_UNUSED_VALUE) return true;
      }
    }
    if (config.analogIds != null) {
      for (Integer behavior : config.analogIds) {
        if (behavior != null && behavior != PinBehavior.BEHAVIOR_UNUSED_VALUE) return true;
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
    boolean anyAttached =
        attachedChannelCount.get() > 0 || isAnyChannelAttached() || managerDeviceAttached;

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

    if (this.opened && listener != null) {
      InterfaceStatus status =
          isHealthy() ? InterfaceStatus.CONNECTED : InterfaceStatus.DISCONNECTED;
      if (isHealthy() && !wasAttached) {
        syncPower();
        syncAnalogLeds();
      }
      InterfaceStatusEvent statusEvent =
          InterfaceStatusEvent.newBuilder()
              .setStatus(status)
              .setInterfaceIndex(getInterfaceIndex())
              .setDetectedChannels(getDetectedChannels())
              .setSupportsRgbLeds(supportsRgbLeds())
              .setVersion(getVersion() != null ? getVersion() : "")
              .build();
      listener.onInterfaceEvent(InterfaceEvent.newBuilder().setStatus(statusEvent).build());
      listener.onInterfaceStatus(status, getInterfaceIndex());
    }
  }

  private synchronized void updateChannelMappings() {
    relayOutputs.clear();
    analogLedOutputs.clear();
    mainRelayOutput = null;

    if (config != null && config.digitalOutIds != null) {
      for (int i = 0; i < config.digitalOutIds.size(); i++) {
        Integer behaviorObj = config.digitalOutIds.get(i);
        if (behaviorObj == null) continue;
        int behavior = behaviorObj;

        DigitalOutput out = digitalOutputsByChannel.get(i);
        if (out == null && behavior != PinBehavior.BEHAVIOR_UNUSED_VALUE) {
          out = createAndOpenDigitalOutput(i);
        }

        if (out != null) {
          if (behavior == PinBehavior.BEHAVIOR_RELAY_VALUE) {
            mainRelayOutput = out;
          } else if (behavior >= PinBehavior.BEHAVIOR_RELAY_BASE_VALUE
              && behavior < PinBehavior.BEHAVIOR_RELAY_BASE_VALUE + 64) {
            int lane = behavior - PinBehavior.BEHAVIOR_RELAY_BASE_VALUE;
            relayOutputs.put(lane, out);
          } else if (behavior == PinBehavior.BEHAVIOR_ANALOG_LED_GREEN_FLAG_VALUE
              || behavior == PinBehavior.BEHAVIOR_ANALOG_LED_YELLOW_FLAG_VALUE
              || (behavior >= PinBehavior.BEHAVIOR_ANALOG_LED_COUNTDOWN_1_VALUE
                  && behavior <= PinBehavior.BEHAVIOR_ANALOG_LED_COUNTDOWN_5_VALUE)
              || (behavior >= PinBehavior.BEHAVIOR_ANALOG_LED_HEAT_LEADER_BASE_VALUE
                  && behavior < PinBehavior.BEHAVIOR_ANALOG_LED_HEAT_LEADER_BASE_VALUE + 64)) {
            analogLedOutputs.put(behavior, out);
          }
        }
      }
    }

    if (config != null && config.digitalInIds != null) {
      for (int i = 0; i < config.digitalInIds.size(); i++) {
        Integer behaviorObj = config.digitalInIds.get(i);
        if (behaviorObj != null && behaviorObj != PinBehavior.BEHAVIOR_UNUSED_VALUE) {
          if (!digitalInputsByChannel.containsKey(i)) {
            createAndOpenDigitalInput(i);
          }
        }
      }
    }

    if (config != null && config.analogIds != null) {
      for (int i = 0; i < config.analogIds.size(); i++) {
        Integer behaviorObj = config.analogIds.get(i);
        if (behaviorObj != null && behaviorObj != PinBehavior.BEHAVIOR_UNUSED_VALUE) {
          if (!analogInputsByChannel.containsKey(i)) {
            createAndOpenAnalogInput(i);
          }
        }
      }
    }
  }

  private int getDigitalInputBehavior(int channel) {
    if (config != null
        && config.digitalInIds != null
        && channel >= 0
        && channel < config.digitalInIds.size()) {
      Integer b = config.digitalInIds.get(channel);
      return b != null ? b : PinBehavior.BEHAVIOR_UNUSED_VALUE;
    }
    return PinBehavior.BEHAVIOR_UNUSED_VALUE;
  }

  private int getDigitalOutputBehavior(int channel) {
    if (config != null
        && config.digitalOutIds != null
        && channel >= 0
        && channel < config.digitalOutIds.size()) {
      Integer b = config.digitalOutIds.get(channel);
      return b != null ? b : PinBehavior.BEHAVIOR_UNUSED_VALUE;
    }
    return PinBehavior.BEHAVIOR_UNUSED_VALUE;
  }

  private int getAnalogInputBehavior(int channel) {
    if (config != null
        && config.analogIds != null
        && channel >= 0
        && channel < config.analogIds.size()) {
      Integer b = config.analogIds.get(channel);
      return b != null ? b : PinBehavior.BEHAVIOR_UNUSED_VALUE;
    }
    return PinBehavior.BEHAVIOR_UNUSED_VALUE;
  }

  private synchronized DigitalInput createAndOpenDigitalInput(int channel) {
    if (digitalInputsByChannel.containsKey(channel)) {
      return digitalInputsByChannel.get(channel);
    }
    try {
      DigitalInput di = new DigitalInput();
      if (config.serialNumber > 0) {
        di.setDeviceSerialNumber(config.serialNumber);
      }
      if (config.isHubPort) {
        di.setHubPort(config.hubPort);
        di.setIsHubPortDevice(true);
      }
      di.setChannel(channel);

      di.addStateChangeListener(
          new DigitalInputStateChangeListener() {
            @Override
            public void onStateChange(DigitalInputStateChangeEvent e) {
              int pinBehavior = getDigitalInputBehavior(channel);
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
      digitalInputsByChannel.put(channel, di);
      try {
        di.open();
      } catch (PhidgetException e) {
        digitalInputs.remove(di);
        digitalInputsByChannel.remove(channel);
        throw e;
      }
      logger.info("Opened Phidget Digital Input channel {}", channel);
      return di;
    } catch (PhidgetException e) {
      logger.warn("Phidget Digital Input channel {} could not be opened", channel, e);
    } catch (Throwable e) {
      logger.warn("Phidget Digital Input channel {} could not be opened", channel, e);
    }
    return null;
  }

  private synchronized DigitalOutput createAndOpenDigitalOutput(int channel) {
    if (digitalOutputsByChannel.containsKey(channel)) {
      return digitalOutputsByChannel.get(channel);
    }
    try {
      DigitalOutput out = new DigitalOutput();
      if (config.serialNumber > 0) {
        out.setDeviceSerialNumber(config.serialNumber);
      }
      if (config.isHubPort) {
        out.setHubPort(config.hubPort);
        out.setIsHubPortDevice(true);
      }
      out.setChannel(channel);

      out.addAttachListener(
          new AttachListener() {
            @Override
            public void onAttach(AttachEvent e) {
              logger.info("Phidget DigitalOutput channel {} attached", channel);
              attachedChannelCount.incrementAndGet();
              try {
                applyOutputChannelState(channel);
              } catch (PhidgetException ex) {
                logger.error("Error applying output state to Phidget channel {}", channel, ex);
              }
              checkAttachmentStatus();
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
      digitalOutputsByChannel.put(channel, out);

      try {
        out.open();
      } catch (PhidgetException e) {
        digitalOutputs.remove(out);
        digitalOutputsByChannel.remove(channel);
        throw e;
      }
      logger.info("Opened Phidget Digital Output channel {}", channel);
      return out;
    } catch (PhidgetException e) {
      logger.warn("Phidget Digital Output channel {} could not be opened", channel, e);
    } catch (Throwable e) {
      logger.warn("Phidget Digital Output channel {} could not be opened", channel, e);
    }
    return null;
  }

  void applyOutputChannelState(int channel) throws PhidgetException {
    int behavior = getDigitalOutputBehavior(channel);
    if (behavior == PinBehavior.BEHAVIOR_RELAY_VALUE) {
      boolean power = lastMainPower != null ? lastMainPower : false;
      boolean state = isNormallyClosedRelays() ? power : !power;
      setOutputChannelPhysicalState(channel, state);
    } else if (behavior >= PinBehavior.BEHAVIOR_RELAY_BASE_VALUE
        && behavior < PinBehavior.BEHAVIOR_RELAY_BASE_VALUE + 64) {
      int lane = behavior - PinBehavior.BEHAVIOR_RELAY_BASE_VALUE;
      boolean power = lastLanePower.getOrDefault(lane, false);
      boolean state = isNormallyClosedRelays() ? power : !power;
      setOutputChannelPhysicalState(channel, state);
    } else if (behavior == PinBehavior.BEHAVIOR_ANALOG_LED_GREEN_FLAG_VALUE) {
      setOutputChannelPhysicalState(channel, isGreenFlagOn);
    } else if (behavior == PinBehavior.BEHAVIOR_ANALOG_LED_YELLOW_FLAG_VALUE) {
      setOutputChannelPhysicalState(channel, isYellowFlagOn);
    } else if (behavior >= PinBehavior.BEHAVIOR_ANALOG_LED_COUNTDOWN_1_VALUE
        && behavior <= PinBehavior.BEHAVIOR_ANALOG_LED_COUNTDOWN_5_VALUE) {
      int idx = behavior - PinBehavior.BEHAVIOR_ANALOG_LED_COUNTDOWN_1_VALUE;
      setOutputChannelPhysicalState(channel, isCountdownOn[idx]);
    } else if (behavior >= PinBehavior.BEHAVIOR_ANALOG_LED_HEAT_LEADER_BASE_VALUE
        && behavior < PinBehavior.BEHAVIOR_ANALOG_LED_HEAT_LEADER_BASE_VALUE + 64) {
      int lane = behavior - PinBehavior.BEHAVIOR_ANALOG_LED_HEAT_LEADER_BASE_VALUE;
      boolean isLeader = (lastLeaderLane != null && lastLeaderLane == lane);
      setOutputChannelPhysicalState(channel, isLeader);
    }
  }

  public void syncPower() {
    try {
      if (hasMainRelay()) {
        boolean power = lastMainPower != null ? lastMainPower : false;
        boolean state = isNormallyClosedRelays() ? power : !power;
        setMainRelayPhysicalState(state);
      }
    } catch (PhidgetException e) {
      logger.error("Error setting main relay state during syncPower", e);
    }
    for (Integer lane : relayOutputs.keySet()) {
      try {
        boolean power = lastLanePower.getOrDefault(lane, false);
        boolean state = isNormallyClosedRelays() ? power : !power;
        setLaneRelayPhysicalState(lane, state);
      } catch (PhidgetException e) {
        logger.error("Error setting lane relay state for lane {} during syncPower", lane + 1, e);
      }
    }
  }

  public void syncAnalogLeds() {
    onAnalogLedsChanged();
  }

  private synchronized VoltageRatioInput createAndOpenAnalogInput(int channel) {
    if (analogInputsByChannel.containsKey(channel)) {
      return analogInputsByChannel.get(channel);
    }
    try {
      VoltageRatioInput vi = new VoltageRatioInput();
      if (config.serialNumber > 0) {
        vi.setDeviceSerialNumber(config.serialNumber);
      }
      if (config.isHubPort) {
        vi.setHubPort(config.hubPort);
        vi.setIsHubPortDevice(true);
      }
      vi.setChannel(channel);

      vi.addVoltageRatioChangeListener(
          new VoltageRatioInputVoltageRatioChangeListener() {
            @Override
            public void onVoltageRatioChange(VoltageRatioInputVoltageRatioChangeEvent e) {
              int pinBehavior = getAnalogInputBehavior(channel);
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
      analogInputsByChannel.put(channel, vi);
      try {
        vi.open();
      } catch (PhidgetException e) {
        analogInputs.remove(vi);
        analogInputsByChannel.remove(channel);
        throw e;
      }
      logger.info("Opened Phidget Analog Input channel {}", channel);
      return vi;
    } catch (PhidgetException e) {
      logger.warn("Phidget Analog Input channel {} could not be opened", channel, e);
    } catch (Throwable e) {
      logger.warn("Phidget Analog Input channel {} could not be opened", channel, e);
    }
    return null;
  }

  @Override
  public synchronized void close() {
    opened = false;
    attached = false;
    managerDeviceAttached = false;
    attachedChannelCount.set(0);
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
      digitalInputsByChannel.clear();
      digitalOutputsByChannel.clear();
      analogInputsByChannel.clear();
      relayOutputs.clear();
      analogLedOutputs.clear();
      mainRelayOutput = null;

      if (listener != null) {
        InterfaceStatus status = InterfaceStatus.DISCONNECTED;
        InterfaceStatusEvent statusEvent =
            InterfaceStatusEvent.newBuilder()
                .setStatus(status)
                .setInterfaceIndex(getInterfaceIndex())
                .setDetectedChannels(getDetectedChannels())
                .setSupportsRgbLeds(supportsRgbLeds())
                .setVersion(getVersion() != null ? getVersion() : "")
                .build();
        listener.onInterfaceEvent(InterfaceEvent.newBuilder().setStatus(statusEvent).build());
        listener.onInterfaceStatus(status, getInterfaceIndex());
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

  boolean isOutputChannelAttached(int pin) {
    DigitalOutput out = digitalOutputsByChannel.get(pin);
    try {
      return out != null && out.getAttached();
    } catch (Throwable e) {
      return false;
    }
  }

  boolean isMainRelayAttached() {
    try {
      return mainRelayOutput != null && mainRelayOutput.getAttached();
    } catch (Throwable e) {
      return false;
    }
  }

  boolean isLaneRelayAttached(int lane) {
    DigitalOutput out = relayOutputs.get(lane);
    try {
      return out != null && out.getAttached();
    } catch (Throwable e) {
      return false;
    }
  }

  void setOutputChannelPhysicalState(int pin, boolean state) throws PhidgetException {
    DigitalOutput out = digitalOutputsByChannel.get(pin);
    if (out != null) {
      logger.info(
          "Phidget serial {} pin {} set physical state to {}",
          config != null ? config.serialNumber : 0,
          pin,
          state);
      out.setState(state);
    }
  }

  void setMainRelayPhysicalState(boolean state) throws PhidgetException {
    if (mainRelayOutput != null) {
      logger.info(
          "Phidget serial {} main relay set physical state to {}",
          config != null ? config.serialNumber : 0,
          state);
      mainRelayOutput.setState(state);
    }
  }

  void setLaneRelayPhysicalState(int lane, boolean state) throws PhidgetException {
    DigitalOutput out = relayOutputs.get(lane);
    if (out != null) {
      logger.info(
          "Phidget serial {} lane {} relay set physical state to {}",
          config != null ? config.serialNumber : 0,
          lane + 1,
          state);
      out.setState(state);
    }
  }

  public boolean setPinState(boolean isDigital, int pin, boolean isHigh) {
    if (!digitalOutputsByChannel.containsKey(pin)) {
      createAndOpenDigitalOutput(pin);
    }
    try {
      if (isOutputChannelAttached(pin)) {
        int behavior = getDigitalOutputBehavior(pin);
        if (behavior == PinBehavior.BEHAVIOR_RELAY_VALUE) {
          boolean state = isNormallyClosedRelays() ? isHigh : !isHigh;
          setOutputChannelPhysicalState(pin, state);
          lastMainPower = isHigh;
        } else if (behavior >= PinBehavior.BEHAVIOR_RELAY_BASE_VALUE
            && behavior < PinBehavior.BEHAVIOR_RELAY_BASE_VALUE + 64) {
          int lane = behavior - PinBehavior.BEHAVIOR_RELAY_BASE_VALUE;
          boolean state = isNormallyClosedRelays() ? isHigh : !isHigh;
          setOutputChannelPhysicalState(pin, state);
          lastLanePower.put(lane, isHigh);
        } else {
          setOutputChannelPhysicalState(pin, isHigh);
        }
        return true;
      } else {
        logger.warn(
            "Cannot set pin state for Phidget digital output channel {}: Channel not attached",
            pin);
        return false;
      }
    } catch (PhidgetException e) {
      logger.error("Error setting Phidget digital output channel {} state", pin, e);
      return false;
    } catch (Throwable e) {
      logger.error("Error setting Phidget digital output channel {} state", pin, e);
      return false;
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
    for (int lane = 0; lane < 64; lane++) {
      int behavior = PinBehavior.BEHAVIOR_ANALOG_LED_HEAT_LEADER_BASE_VALUE + lane;
      if (analogLedOutputs.containsKey(behavior)) {
        boolean isLeader = (lastLeaderLane != null && lastLeaderLane == lane);
        setAnalogLedState(behavior, isLeader);
      }
    }
  }

  @Override
  public void setHeatStandings(List<Integer> laneIndices) {
    super.setHeatStandings(laneIndices);
    Integer leaderLane =
        (laneIndices != null && !laneIndices.isEmpty()) ? laneIndices.get(0) : null;
    if (Objects.equals(lastLeaderLane, leaderLane)) {
      return;
    }
    lastLeaderLane = leaderLane;
    for (int lane = 0; lane < 64; lane++) {
      int behavior = PinBehavior.BEHAVIOR_ANALOG_LED_HEAT_LEADER_BASE_VALUE + lane;
      if (analogLedOutputs.containsKey(behavior)) {
        boolean isLeader = (lastLeaderLane != null && lastLeaderLane == lane);
        setAnalogLedState(behavior, isLeader);
      }
    }
  }

  protected void setAnalogLedState(int behavior, boolean on) {
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
    if (config != null && config.digitalOutIds != null) {
      int base = PinBehavior.BEHAVIOR_RELAY_BASE.getNumber();
      int max = base + Math.max(1, getNumLanes());
      for (Integer code : config.digitalOutIds) {
        if (code != null && code >= base && code < max) {
          return true;
        }
      }
    }
    return !relayOutputs.isEmpty();
  }

  @Override
  public boolean hasDigitalFuel() {
    if (config != null && config.analogIds != null) {
      int base = PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE.getNumber();
      int max = base + Math.max(1, getNumLanes());
      for (Integer code : config.analogIds) {
        if (code != null && code >= base && code < max) {
          return true;
        }
      }
    }
    return false;
  }

  @Override
  public boolean hasMainRelay() {
    if (config != null && config.digitalOutIds != null) {
      int mainRelay = PinBehavior.BEHAVIOR_RELAY.getNumber();
      for (Integer code : config.digitalOutIds) {
        if (code != null && code == mainRelay) {
          return true;
        }
      }
    }
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
    this.lastMainPower = on;
    try {
      if (isMainRelayAttached()) {
        boolean state = isNormallyClosedRelays() ? on : !on;
        setMainRelayPhysicalState(state);
      }
    } catch (PhidgetException e) {
      logger.error("Error setting main relay state", e);
    }
  }

  @Override
  public void setLanePower(boolean on, int lane) {
    super.setLanePower(on, lane);
    this.lastLanePower.put(lane, on);
    try {
      if (isLaneRelayAttached(lane)) {
        boolean state = isNormallyClosedRelays() ? on : !on;
        setLaneRelayPhysicalState(lane, state);
      }
    } catch (PhidgetException e) {
      logger.error("Error setting lane relay state", e);
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
    onAnalogLedsChanged();
  }
}
