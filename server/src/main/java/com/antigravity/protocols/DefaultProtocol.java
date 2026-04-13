package com.antigravity.protocols;

import com.antigravity.proto.RaceFlag;
import com.antigravity.proto.RaceState;
import java.util.Collections;
import java.util.List;

public abstract class DefaultProtocol implements IProtocol {

  @Override
  public void setRaceState(RaceState state, RaceFlag flag, double countdown) {}

  private final int numLanes;
  protected ProtocolListener listener;

  public DefaultProtocol(int numLanes) {
    this.numLanes = numLanes;
  }

  @Override
  public void close() {}

  @Override
  public boolean hasPerLaneRelays() {
    return false;
  }

  @Override
  public boolean hasDigitalFuel() {
    return false;
  }

  @Override
  public boolean hasMainRelay() {
    return false;
  }

  @Override
  public void setListener(ProtocolListener listener) {
    this.listener = listener;
  }

  @Override
  public void startTimer() {}

  @Override
  public List<PartialTime> stopTimer() {
    return Collections.emptyList();
  }

  @Override
  public void setMainPower(boolean on) {}

  @Override
  public void setLanePower(boolean on, int lane) {}

  @Override
  public int getNumLanes() {
    return numLanes;
  }

  @Override
  public void setHeatStandings(List<Integer> laneIndices) {}

  @Override
  public void setRefueling(int laneIndex, boolean isRefueling) {}

  @Override
  public void setFuelLevel(int laneIndex, int fuelLevelPct) {}

  @Override
  public void setHeatProgress(double percentage) {}

  private int interfaceIndex = -1;

  @Override
  public void setInterfaceIndex(int index) {
    this.interfaceIndex = index;
  }

  @Override
  public int getInterfaceIndex() {
    return interfaceIndex;
  }
}
