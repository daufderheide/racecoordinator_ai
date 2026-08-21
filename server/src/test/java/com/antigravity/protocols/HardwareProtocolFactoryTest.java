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

  @Test
  public void testCreateProtocolsForTrack_NullTrack_ReturnsEmpty() {
    List<IProtocol> protocols = HardwareProtocolFactory.createProtocolsForTrack(null, null);
    assertTrue(protocols.isEmpty());
  }

  @Test
  public void testCreateProtocolsForTrack_MultiplePhidgets() {
    List<Lane> lanes = new ArrayList<>();
    lanes.add(new Lane("Lane 1", "#FF0000", 0));
    lanes.add(new Lane("Lane 2", "#00FF00", 1));

    PhidgetConfig phidget1 = new PhidgetConfig();
    phidget1.name = "Phidget 1";
    PhidgetConfig phidget2 = new PhidgetConfig();
    phidget2.name = "Phidget 2";

    Track track =
        new Track.Builder()
            .name("Dual Phidget Track")
            .lanes(lanes)
            .phidgetConfigs(java.util.Arrays.asList(phidget1, phidget2))
            .build();

    List<IProtocol> protocols = HardwareProtocolFactory.createProtocolsForTrack(track, null);
    assertEquals(2, protocols.size());
    assertTrue(protocols.get(0) instanceof PhidgetProtocol);
    assertTrue(protocols.get(1) instanceof PhidgetProtocol);
    assertEquals(0, protocols.get(0).getInterfaceIndex());
    assertEquals(1, protocols.get(1).getInterfaceIndex());
  }

  @Test
  public void testCreateProtocolsForTrack_MultipleArduinos() {
    List<Lane> lanes = new ArrayList<>();
    lanes.add(new Lane("Lane 1", "#FF0000", 0));
    lanes.add(new Lane("Lane 2", "#00FF00", 1));

    ArduinoConfig arduino1 = new ArduinoConfig();
    arduino1.name = "Arduino Mega";
    ArduinoConfig arduino2 = new ArduinoConfig();
    arduino2.name = "Arduino Uno";

    Track track =
        new Track.Builder()
            .name("Dual Arduino Track")
            .lanes(lanes)
            .arduinoConfigs(java.util.Arrays.asList(arduino1, arduino2))
            .build();

    List<IProtocol> protocols = HardwareProtocolFactory.createProtocolsForTrack(track, null);
    assertEquals(2, protocols.size());
    assertTrue(protocols.get(0) instanceof ArduinoProtocol);
    assertTrue(protocols.get(1) instanceof ArduinoProtocol);
    assertEquals(0, protocols.get(0).getInterfaceIndex());
    assertEquals(1, protocols.get(1).getInterfaceIndex());
  }

  @Test
  public void testCreateProtocolsForTrack_MultipleTrackmates() {
    List<Lane> lanes = new ArrayList<>();
    lanes.add(new Lane("Lane 1", "#FF0000", 0));
    lanes.add(new Lane("Lane 2", "#00FF00", 1));

    TrackmateConfig tm1 = new TrackmateConfig();
    tm1.name = "Trackmate 1";
    TrackmateConfig tm2 = new TrackmateConfig();
    tm2.name = "Trackmate 2";

    Track track =
        new Track.Builder()
            .name("Dual Trackmate Track")
            .lanes(lanes)
            .trackmateConfigs(java.util.Arrays.asList(tm1, tm2))
            .build();

    List<IProtocol> protocols = HardwareProtocolFactory.createProtocolsForTrack(track, null);
    assertEquals(2, protocols.size());
    assertTrue(protocols.get(0) instanceof TrackmateProtocol);
    assertTrue(protocols.get(1) instanceof TrackmateProtocol);
    assertEquals(0, protocols.get(0).getInterfaceIndex());
    assertEquals(1, protocols.get(1).getInterfaceIndex());
  }

  @Test
  public void testCreateProtocolsForTrack_MultipleBarts() {
    List<Lane> lanes = new ArrayList<>();
    lanes.add(new Lane("Lane 1", "#FF0000", 0));
    lanes.add(new Lane("Lane 2", "#00FF00", 1));

    com.antigravity.protocols.bart.BartConfig bart1 =
        new com.antigravity.protocols.bart.BartConfig();
    bart1.name = "BART 1";
    com.antigravity.protocols.bart.BartConfig bart2 =
        new com.antigravity.protocols.bart.BartConfig();
    bart2.name = "BART 2";

    Track track =
        new Track.Builder()
            .name("Dual BART Track")
            .lanes(lanes)
            .bartConfigs(java.util.Arrays.asList(bart1, bart2))
            .build();

    List<IProtocol> protocols = HardwareProtocolFactory.createProtocolsForTrack(track, null);
    assertEquals(2, protocols.size());
    assertTrue(protocols.get(0) instanceof com.antigravity.protocols.bart.BartProtocol);
    assertTrue(protocols.get(1) instanceof com.antigravity.protocols.bart.BartProtocol);
    assertEquals(0, protocols.get(0).getInterfaceIndex());
    assertEquals(1, protocols.get(1).getInterfaceIndex());
  }

  @Test
  public void testCreateProtocolsForTrack_MixedBartAndArduino() {
    List<Lane> lanes = new ArrayList<>();
    lanes.add(new Lane("Lane 1", "#FF0000", 0));
    lanes.add(new Lane("Lane 2", "#00FF00", 1));

    com.antigravity.protocols.bart.BartConfig bart =
        new com.antigravity.protocols.bart.BartConfig();
    bart.name = "BART Timing";
    ArduinoConfig arduino = new ArduinoConfig();
    arduino.name = "Arduino Relays";

    Track track =
        new Track.Builder()
            .name("Hybrid BART and Arduino Track")
            .lanes(lanes)
            .bartConfigs(java.util.Collections.singletonList(bart))
            .arduinoConfigs(java.util.Collections.singletonList(arduino))
            .build();

    List<IProtocol> protocols = HardwareProtocolFactory.createProtocolsForTrack(track, null);
    assertEquals(2, protocols.size());
    assertTrue(protocols.get(0) instanceof ArduinoProtocol);
    assertTrue(protocols.get(1) instanceof com.antigravity.protocols.bart.BartProtocol);
    assertEquals(0, protocols.get(0).getInterfaceIndex());
    assertEquals(1, protocols.get(1).getInterfaceIndex());
  }
}
