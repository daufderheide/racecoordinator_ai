package com.antigravity.protocols;

import com.antigravity.proto.RaceFlag;
import com.antigravity.proto.RaceState;
import java.util.ArrayList;
import java.util.List;

public class ProtocolDelegate implements IProtocol {

  @Override
  public void setRaceState(RaceState state, RaceFlag flag, double countdown) {
    for (IProtocol protocol : protocols) {
      protocol.setRaceState(state, flag, countdown);
    }
  }

  private final List<IProtocol> protocols;
  private final PowerManager powerManager;

  public ProtocolDelegate(List<IProtocol> protocols) {
    this.protocols = protocols;
    this.powerManager = new PowerManager(this);
  }

  public List<IProtocol> getProtocols() {
    return protocols;
  }

  @Override
  public boolean open() {
    boolean allOpened = true;
    for (IProtocol protocol : protocols) {
      if (!protocol.open()) {
        allOpened = false;
      }
    }
    return allOpened;
  }

  @Override
  public void close() {
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
  public void setFuelLevel(int laneIndex, int fuelLevelPct) {
    for (IProtocol protocol : protocols) {
      protocol.setFuelLevel(laneIndex, fuelLevelPct);
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
    for (IProtocol protocol : protocols) {
      protocol.initializeHardwareState();
    }
  }
}
