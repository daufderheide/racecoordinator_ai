package com.antigravity.protocols;

import com.antigravity.models.Lane;
import com.antigravity.models.Track;
import com.antigravity.protocols.arduino.ArduinoConfig;
import com.antigravity.protocols.arduino.ArduinoProtocol;
import com.antigravity.protocols.phidget.PhidgetConfig;
import com.antigravity.protocols.phidget.PhidgetProtocol;
import com.antigravity.protocols.trackmate.TrackmateConfig;
import com.antigravity.protocols.trackmate.TrackmateProtocol;
import java.util.ArrayList;
import java.util.List;

/** Factory and registry for creating hardware protocols from track configurations. */
public class HardwareProtocolFactory {

  public static List<IProtocol> createProtocolsForTrack(Track track, ProtocolListener listener) {
    List<IProtocol> protocols = new ArrayList<>();
    if (track == null) {
      return protocols;
    }

    int numLanes = track.getLanes() != null ? track.getLanes().size() : 0;
    List<String> laneColors = new ArrayList<>();
    if (track.getLanes() != null) {
      for (Lane lane : track.getLanes()) {
        laneColors.add(lane.getBackground_color());
      }
    }

    int interfaceIndex = 0;

    // 1. Arduino Configs
    if (track.getArduinoConfigs() != null) {
      for (ArduinoConfig config : track.getArduinoConfigs()) {
        ArduinoProtocol protocol = new ArduinoProtocol(config, numLanes, laneColors);
        protocol.setInterfaceIndex(interfaceIndex++);
        if (listener != null) {
          protocol.setListener(listener);
        }
        protocols.add(protocol);
      }
    }

    // 2. Trackmate Configs
    if (track.getTrackmateConfigs() != null) {
      for (TrackmateConfig config : track.getTrackmateConfigs()) {
        TrackmateProtocol protocol = new TrackmateProtocol(config, numLanes);
        protocol.setInterfaceIndex(interfaceIndex++);
        if (listener != null) {
          protocol.setListener(listener);
        }
        protocols.add(protocol);
      }
    }

    // 3. Phidget Configs
    if (track.getPhidgetConfigs() != null) {
      for (PhidgetConfig config : track.getPhidgetConfigs()) {
        PhidgetProtocol protocol = new PhidgetProtocol(config, numLanes, listener);
        protocol.setInterfaceIndex(interfaceIndex++);
        protocols.add(protocol);
      }
    }

    return protocols;
  }
}
