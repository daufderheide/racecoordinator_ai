package com.antigravity.protocols;

import java.util.Arrays;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class PowerManager {

  private static final Logger logger = LoggerFactory.getLogger(PowerManager.class);

  private static final class ProtocolState {

    boolean currentMainPower = false;
    boolean firstMainPower = true;

    // Per lane
    final boolean[] currentLanePower;
    final boolean[] firstLanePower;
    final boolean[] desiredLanePower;

    public ProtocolState(int numLanes) {
      this.currentLanePower = new boolean[numLanes];
      Arrays.fill(this.currentLanePower, false);
      this.firstLanePower = new boolean[numLanes];
      Arrays.fill(this.firstLanePower, true);
      this.desiredLanePower = new boolean[numLanes];
      Arrays.fill(this.desiredLanePower, false);
    }
  }

  private final ProtocolDelegate delegate;
  private final int numLanes;

  // State of each protocols main and per lane relays.
  private final ProtocolState[] protocolStates;

  public PowerManager(ProtocolDelegate delegate) {
    this.delegate = delegate;
    this.numLanes = delegate.getNumLanes();

    this.protocolStates = new ProtocolState[delegate.getProtocols().size()];
    for (int i = 0; i < this.protocolStates.length; i++) {
      this.protocolStates[i] = new ProtocolState(numLanes);
    }
  }

  public void reset() {
    for (ProtocolState state : protocolStates) {
      state.firstMainPower = true;
      Arrays.fill(state.firstLanePower, true);
    }
  }

  public void setMainPower(boolean on) {
    List<IProtocol> protocols = this.delegate.getProtocols();
    for (int i = 0; i < protocols.size(); i++) {
      IProtocol protocol = protocols.get(i);
      ProtocolState state = this.protocolStates[i];
      if (protocol.hasMainRelay()) {
        if (state.firstMainPower || state.currentMainPower != on) {
          protocol.setMainPower(on);
          state.firstMainPower = false;
          logger.info("Main Power set to {} for protocol {}", on ? "ON" : "OFF", i);
        }
      }
      if (protocol.hasPerLaneRelays()) {
        for (int lane = 0; lane < numLanes; lane++) {
          boolean effectivePower = on && state.desiredLanePower[lane];
          if (state.firstLanePower[lane] || state.currentLanePower[lane] != effectivePower) {
            protocol.setLanePower(effectivePower, lane);
            state.firstLanePower[lane] = false;
            state.currentLanePower[lane] = effectivePower;
            logger.info(
                "Main Power (per-lane) set to {} for protocol {} lane {}",
                effectivePower ? "ON" : "OFF",
                i,
                lane + 1);
          }
        }
      }
      state.currentMainPower = on;
    }
  }

  public void setLanePower(boolean on, int lane) {
    if (lane < 0 || lane >= numLanes) {
      return;
    }

    List<IProtocol> protocols = this.delegate.getProtocols();
    for (int i = 0; i < protocols.size(); i++) {
      IProtocol protocol = protocols.get(i);
      ProtocolState state = this.protocolStates[i];
      if (protocol.hasPerLaneRelays()) {
        boolean effectivePower = state.currentMainPower && on;
        if (state.firstLanePower[lane] || effectivePower != state.currentLanePower[lane]) {
          protocol.setLanePower(effectivePower, lane);
          state.firstLanePower[lane] = false;
          state.currentLanePower[lane] = effectivePower;
          logger.info("Lane Power set to {} for lane {}", effectivePower ? "ON" : "OFF", lane + 1);
        }
        state.desiredLanePower[lane] = on;
      }
    }
  }
}
