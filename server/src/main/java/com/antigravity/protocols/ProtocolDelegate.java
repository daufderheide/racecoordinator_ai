package com.antigravity.protocols;

import com.antigravity.proto.RaceFlag;
import com.antigravity.proto.RaceState;
import java.util.ArrayList;
import java.util.List;

public class ProtocolDelegate implements IProtocol {

  @Override
  public void setRaceState(RaceState state, RaceFlag flag, double countdown) {
    this.powerManager.setWarmup(flag == RaceFlag.GREEN_YELLOW);
    for (IProtocol protocol : protocols) {
      protocol.setRaceState(state, flag, countdown);
    }
  }

  private final List<IProtocol> protocols;
  private final PowerManager powerManager;
  private final PitManager pitManager;
  private ProtocolListener listener;

  public ProtocolDelegate(List<IProtocol> protocols) {
    this.protocols = protocols;
    this.powerManager = new PowerManager(this);
    this.pitManager = new PitManager(getNumLanes(), this::hasPitInConfigured, () -> this.listener);
    for (IProtocol protocol : protocols) {
      protocol.setPitManager(this.pitManager);
    }
  }

  public List<IProtocol> getProtocols() {
    return protocols;
  }

  public PitManager getPitManager() {
    return pitManager;
  }

  @Override
  public boolean open() {
    boolean allOpened = true;
    for (IProtocol protocol : protocols) {
      if (!protocol.open()) {
        allOpened = false;
      }
    }
    this.pitManager.start();
    return allOpened;
  }

  @Override
  public void close() {
    this.pitManager.stop();
    for (IProtocol protocol : protocols) {
      protocol.close();
    }
  }

  @Override
  public void clearLeds() {
    for (IProtocol protocol : protocols) {
      protocol.clearLeds();
    }
  }

  @Override
  public void setListener(ProtocolListener listener) {
    this.listener = listener;
    for (IProtocol protocol : protocols) {
      protocol.setListener(listener);
    }
  }

  @Override
  public boolean hasPerLaneRelays() {
    for (IProtocol protocol : protocols) {
      if (protocol.hasPerLaneRelays()) {
        return true;
      }
    }
    return false;
  }

  @Override
  public boolean hasDigitalFuel() {
    for (IProtocol protocol : protocols) {
      if (protocol.hasDigitalFuel()) {
        return true;
      }
    }
    return false;
  }

  @Override
  public boolean hasMainRelay() {
    for (IProtocol protocol : protocols) {
      if (protocol.hasMainRelay()) {
        return true;
      }
    }
    return false;
  }

  @Override
  public void startTimer() {
    for (IProtocol protocol : protocols) {
      protocol.startTimer();
    }
  }

  @Override
  public List<PartialTime> stopTimer() {
    List<PartialTime> allPartialTimes = new ArrayList<>();
    for (IProtocol protocol : protocols) {
      allPartialTimes.addAll(protocol.stopTimer());
    }
    return allPartialTimes;
  }

  @Override
  public void setMainPower(boolean on) {
    // Don't go directly to the protocols, use the PowerManager instead.
    this.powerManager.setMainPower(on);
  }

  @Override
  public void setLanePower(boolean on, int lane) {
    // Don't go directly to the protocols, use the PowerManager instead.
    this.powerManager.setLanePower(on, lane);
  }

  @Override
  public int getNumLanes() {
    if (protocols.isEmpty()) {
      return 0;
    }
    return protocols.get(0).getNumLanes();
  }

  @Override
  public void setHeatStandings(List<Integer> laneIndices) {
    for (IProtocol protocol : protocols) {
      protocol.setHeatStandings(laneIndices);
    }
  }

  @Override
  public void setRefueling(int laneIndex, boolean isRefueling) {
    for (IProtocol protocol : protocols) {
      protocol.setRefueling(laneIndex, isRefueling);
    }
  }

  @Override
  public void setFuelLevel(int laneIndex, double fuelLevel, double capacity) {
    for (IProtocol protocol : protocols) {
      protocol.setFuelLevel(laneIndex, fuelLevel, capacity);
    }
  }

  @Override
  public void setHeatProgress(double percentage) {
    for (IProtocol protocol : protocols) {
      protocol.setHeatProgress(percentage);
    }
  }

  @Override
  public void setInterfaceIndex(int index) {
    // Usually we don't set index on the delegate itself, but we can set it on children if needed.
    // However, children are already indexed during creation.
  }

  @Override
  public int getInterfaceIndex() {
    return -1; // Delegate doesn't have a single index
  }

  @Override
  public boolean isHealthy() {
    if (protocols.isEmpty()) {
      return false;
    }
    for (IProtocol protocol : protocols) {
      if (!protocol.isHealthy()) {
        return false;
      }
    }
    return true;
  }

  @Override
  public void initializeHardwareState() {
    this.powerManager.reset();
    this.pitManager.reset();
    for (IProtocol protocol : protocols) {
      protocol.initializeHardwareState();
    }
  }

  @Override
  public boolean hasPitInConfigured(int laneIndex) {
    for (IProtocol protocol : protocols) {
      if (protocol.hasPitInConfigured(laneIndex)) {
        return true;
      }
    }
    return false;
  }

  @Override
  public boolean isLaneInPits(int laneIndex) {
    return pitManager != null && pitManager.isLaneInPits(laneIndex);
  }

  @Override
  public void setPitManager(PitManager pitManager) {
    for (IProtocol protocol : protocols) {
      protocol.setPitManager(pitManager);
    }
  }
}
