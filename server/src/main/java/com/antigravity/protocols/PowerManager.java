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
    boolean[] currentLanePower;
    boolean[] firstLanePower;
    boolean[] desiredLanePower;

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
  private ProtocolState[] protocolStates;

  public PowerManager(ProtocolDelegate delegate) {
    this.delegate = delegate;
    this.numLanes = delegate.getNumLanes();

    this.protocolStates = new ProtocolState[delegate.getProtocols().size()];
    for (int i = 0; i < this.protocolStates.length; i++) {
      this.protocolStates[i] = new ProtocolState(numLanes);
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
        }
      } else if (protocol.hasPerLaneRelays()) {
        for (int lane = 0; lane < numLanes; lane++) {
          boolean effectivePower = on && state.desiredLanePower[lane];
          if (state.firstLanePower[lane] || state.currentLanePower[lane] != effectivePower) {
            protocol.setLanePower(effectivePower, lane);
            state.firstLanePower[lane] = false;
            state.currentLanePower[lane] = effectivePower;
          }
        }
      }
      // Nothing to do with the protocol if it doen't have any relays.
      state.currentMainPower = on;
    }
    logger.info("Main Power set to {}", on ? "ON" : "OFF");
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
        }
        state.desiredLanePower[lane] = on;
      }
    }
    logger.info("Lane Power set to {} for lane {}", on ? "ON" : "OFF", lane + 1);
  }
}
