package com.antigravity.protocols;

import java.util.Collections;
import java.util.List;

public abstract class DefaultProtocol implements IProtocol {
  private int numLanes;
  protected ProtocolListener listener;

  public DefaultProtocol(int numLanes) {
    this.numLanes = numLanes;
  }

  @Override
  public void setListener(ProtocolListener listener) {
    this.listener = listener;
  }

  @Override
  public void startTimer() {
  }

  @Override
  public List<PartialTime> stopTimer() {
    return Collections.emptyList();
  }

  @Override
  public void close() {
  }

  @Override
  public boolean hasPerLaneRelays() {
    return false;
  }

  @Override
  public void setMainPower(boolean on) {
  }

  @Override
  public void setLanePower(boolean on, int lane) {
  }

  @Override
  public boolean hasMainRelay() {
    return false;
  }

  @Override
  public int getNumLanes() {
    return numLanes;
  }
}
