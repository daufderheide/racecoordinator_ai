package com.antigravity.protocols;

import com.antigravity.proto.RaceFlag;
import com.antigravity.proto.RaceState;
import java.util.List;

public interface IProtocol {

  void setRaceState(RaceState state, RaceFlag flag, double countdown);

  boolean open();

  void close();

  void clearLeds();

  boolean hasPerLaneRelays();

  boolean hasDigitalFuel();

  boolean hasMainRelay();

  void setListener(ProtocolListener listener);

  void startTimer(List<PartialTime> partials);

  List<PartialTime> stopTimer();

  void setMainPower(boolean on);

  void setLanePower(boolean on, int lane);

  // TODO(aufderheide): Think about getting rid of this and
  // getting it from somewhere else as needed.
  int getNumLanes();

  // RGB Led and external protocol support.
  void setHeatStandings(List<Integer> laneIndices);

  void setRefueling(int laneIndex, boolean isRefueling);

  void setFuelLevel(int laneIndex, int fuelLevelPct);

  void setHeatProgress(double percentage);

  void setInterfaceIndex(int index);

  int getInterfaceIndex();

  boolean isHealthy();

  void initializeHardwareState();
}
