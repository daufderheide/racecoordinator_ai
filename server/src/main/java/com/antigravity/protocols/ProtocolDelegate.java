package com.antigravity.protocols;

import java.util.ArrayList;
import java.util.List;

public class ProtocolDelegate implements IProtocol {
  private List<IProtocol> protocols;
  private PowerManager powerManager;

  public ProtocolDelegate(List<IProtocol> protocols) {
    this.protocols = protocols;
    this.powerManager = new PowerManager(this);
  }

  public void setListener(ProtocolListener listener) {
    for (IProtocol protocol : protocols) {
      protocol.setListener(listener);
    }
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
  public boolean hasPerLaneRelays() {
    for (IProtocol protocol : protocols) {
      if (protocol.hasPerLaneRelays()) {
        return true;
      }
    }
    return false;
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
  public boolean hasMainRelay() {
    for (IProtocol protocol : protocols) {
      if (protocol.hasMainRelay()) {
        return true;
      }
    }
    return false;
  }

  @Override
  public int getNumLanes() {
    if (protocols.isEmpty()) {
      return 0;
    }
    return protocols.get(0).getNumLanes();
  }
}
