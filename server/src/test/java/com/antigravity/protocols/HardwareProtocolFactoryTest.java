package com.antigravity.protocols;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import com.antigravity.models.Lane;
import com.antigravity.models.Track;
import com.antigravity.protocols.arduino.ArduinoConfig;
import com.antigravity.protocols.arduino.ArduinoProtocol;
import com.antigravity.protocols.phidget.PhidgetConfig;
import com.antigravity.protocols.phidget.PhidgetProtocol;
import com.antigravity.protocols.trackmate.TrackmateConfig;
import com.antigravity.protocols.trackmate.TrackmateProtocol;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import org.junit.Test;

public class HardwareProtocolFactoryTest {

  @Test
  public void testCreateProtocolsForTrackWithAllInterfaces() {
    List<Lane> lanes = new ArrayList<>();
    lanes.add(new Lane("Lane 1", "#FF0000", 0));
    lanes.add(new Lane("Lane 2", "#00FF00", 1));

    ArduinoConfig arduinoConfig = new ArduinoConfig();
    TrackmateConfig tmConfig = new TrackmateConfig();
    PhidgetConfig phidgetConfig = new PhidgetConfig();

    Track track =
        new Track.Builder()
            .name("Multi-Interface Track")
            .lanes(lanes)
            .arduinoConfigs(Collections.singletonList(arduinoConfig))
            .trackmateConfigs(Collections.singletonList(tmConfig))
            .phidgetConfigs(Collections.singletonList(phidgetConfig))
            .build();

    List<IProtocol> protocols = HardwareProtocolFactory.createProtocolsForTrack(track, null);

    assertEquals(3, protocols.size());
    assertTrue(protocols.get(0) instanceof ArduinoProtocol);
    assertTrue(protocols.get(1) instanceof TrackmateProtocol);
    assertTrue(protocols.get(2) instanceof PhidgetProtocol);

    assertEquals(0, protocols.get(0).getInterfaceIndex());
    assertEquals(1, protocols.get(1).getInterfaceIndex());
    assertEquals(2, protocols.get(2).getInterfaceIndex());
  }
}
