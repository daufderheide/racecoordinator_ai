package com.antigravity.protocols;

import java.util.List;

public interface IProtocol {
  boolean open();

  void setListener(ProtocolListener listener);

  void startTimer();

  List<PartialTime> stopTimer();

  void close();

  boolean hasPerLaneRelays();

  void setMainPower(boolean on);

  void setLanePower(boolean on, int lane);

  boolean hasMainRelay();

  // TODO(aufderheide): Think about getting rid of this and
  // getting it from somewhere else as needed.
  int getNumLanes();
}
