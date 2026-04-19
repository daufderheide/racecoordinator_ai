package com.antigravity.protocols.arduino;

import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.*;

import com.antigravity.proto.RgbLedBehavior;
import com.antigravity.proto.RgbLedState;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import org.junit.Before;
import org.junit.Test;
import org.mockito.ArgumentCaptor;

public class ArduinoLedHelperTest {

  private ArduinoProtocol protocol;
  private ArduinoLedHelper helper;
  private ArduinoConfig config;

  @Before
  public void setUp() {
    protocol = mock(ArduinoProtocol.class);
    config = new ArduinoConfig();
    when(protocol.getConfig()).thenReturn(config);
    when(protocol.isSerialOpen()).thenReturn(true);
    when(protocol.getLogTime()).thenReturn("12:00:00.000");
    when(protocol.getMaxBufferSize()).thenReturn(128);
    helper = new ArduinoLedHelper(protocol);
  }

  @Test
  public void testSendRgbLedMode() {
    // Configure one LED string with 5 LEDs
    List<Integer> leds =
        new ArrayList<>(Collections.nCopies(5, RgbLedBehavior.RGB_LED_BEHAVIOR_UNUSED_VALUE));
    leds.set(
        4, RgbLedBehavior.RGB_LED_BEHAVIOR_LAP_SENSOR_BASE_VALUE); // Max index 4, so count is 5

    LedString string0 = new LedString(14, leds, 150, 0, 5.0, new ArrayList<>());
    config.ledStrings = new ArrayList<>();
    config.ledStrings.add(string0);

    helper.sendRgbLedMode();

    // Opcode 0x6C (l)
    // pin = 14 (translated to physical 14 for Uno A0)
    // ledCount = 5
    // brightness = 150
    // updateRate = 20 (0x0014)
    // Expected: 0x6C 0x0E 0x05 0x96 0x14 0x00 0x00 0x3B
    byte[] expected = {0x6C, 0x0E, 0x05, (byte) 150, 0x14, 0x00, 0x00, 0x3B};

    ArgumentCaptor<byte[]> captor = ArgumentCaptor.forClass(byte[].class);
    verify(protocol, atLeastOnce()).writeData(captor.capture());

    boolean found = false;
    for (byte[] data : captor.getAllValues()) {
      if (Arrays.equals(expected, data)) {
        found = true;
        break;
      }
    }
    assertTrue("Should have sent RGB_LED_MODE command", found);
  }

  @Test
  public void testSetStringRgbLedValues() {
    // Set LED 2 to Red (255, 0, 0) on pin 14
    List<RgbLedState> leds = new ArrayList<>();
    leds.add(RgbLedState.newBuilder().setIndex(2).setR(255).setG(0).setB(0).build());

    helper.setStringRgbLedValues(14, leds);

    // Opcode 0x4C (L)
    // pin = 14 (physical 14)
    // numUpdates = 1
    // LedIndex = 2
    // R = 255 (0xFF), G = 0, B = 0
    // Expected: 0x4C 0x0E 0x01 0x02 0xFF 0x00 0x00 0x3B
    byte[] expected = {0x4C, 0x0E, 0x01, 0x02, (byte) 0xFF, 0x00, 0x00, 0x3B};

    verify(protocol).writeData(argThat(actual -> Arrays.equals(expected, actual)));
  }

  @Test
  public void testSetHeatStandings() {
    // Configure LED string 1 with 2 leds: Lane 0 leader (2000), Lane 1 leader
    // (2001)
    LedString ledString = new LedString();
    ledString.pin = 1;
    ledString.leds =
        Arrays.asList(
            RgbLedBehavior.RGB_LED_BEHAVIOR_HEAT_LEADER_BASE_VALUE + 0,
            RgbLedBehavior.RGB_LED_BEHAVIOR_HEAT_LEADER_BASE_VALUE + 1);
    ledString.ledLaneColorOverrides = Arrays.asList("#FF0000", "#00FF00");
    config.ledStrings = Collections.singletonList(ledString);

    // Standings: Lane 1 is leader
    helper.setHeatStandings(Arrays.asList(1, 0));

    // Expected SET_RGB_LED_VALUES command for String 1:
    // LED 0: Lane 0 leader -> OFF (0,0,0)
    // LED 1: Lane 1 leader -> ON (0,255,0)
    // Opcode: 0x4C, String: 1, NumLeds: 2, [0, 0, 0, 0, 1, 0, 255, 0], Terminator:
    // 0x3B
    byte[] expected = {
      0x4C,
      0x01,
      0x02,
      0x00,
      0x00,
      0x00,
      0x00, // LED 0
      0x01,
      0x00,
      (byte) 0xFF,
      0x00, // LED 1
      0x3B
    };

    ArgumentCaptor<byte[]> captor = ArgumentCaptor.forClass(byte[].class);
    verify(protocol, atLeastOnce()).writeData(captor.capture());

    byte[] lastLCommand = null;
    for (byte[] data : captor.getAllValues()) {
      if (data.length > 0 && data[0] == 0x4C) {
        lastLCommand = data;
      }
    }

    assertArrayEquals(expected, lastLCommand);
  }

  @Test
  public void testSetHeatStandings_MissingColorMapping() {
    LedString ledString = new LedString();
    ledString.pin = 1;
    ledString.leds =
        Collections.singletonList(RgbLedBehavior.RGB_LED_BEHAVIOR_HEAT_LEADER_BASE_VALUE + 0);
    ledString.ledLaneColorOverrides = new ArrayList<>(); // Empty mapping
    config.ledStrings = Collections.singletonList(ledString);

    helper.setHeatStandings(Arrays.asList(0));

    // Should NOT have sent any 0x4C commands
    verify(protocol, never()).writeData(argThat(data -> data.length > 0 && data[0] == 0x4C));
  }

  @Test
  public void testSetStringRgbLedValues_SplitsPackets_Uno() {
    // Configure for Uno (hardwareType = 0)
    config.hardwareType = 0;
    when(protocol.getMaxBufferSize()).thenReturn(128);

    // Send 40 LEDs.
    // Max LEDs per packet for Uno (limit 128) is (128 - 4) / 4 = 31.
    // 40 LEDs should be split into 2 packets (31 + 9).
    List<RgbLedState> leds = new ArrayList<>();
    for (int i = 0; i < 40; i++) {
      leds.add(RgbLedState.newBuilder().setIndex(i).setR(10).setG(20).setB(30).build());
    }

    helper.setStringRgbLedValues(2, leds);

    ArgumentCaptor<byte[]> captor = ArgumentCaptor.forClass(byte[].class);
    verify(protocol, times(2)).writeData(captor.capture());

    List<byte[]> writtenData = captor.getAllValues();

    // First packet should have 31 LEDs
    byte[] firstPacket = writtenData.get(0);
    assertArrayEquals(new byte[] {0x4C}, new byte[] {firstPacket[0]});
    assertArrayEquals(new byte[] {31}, new byte[] {firstPacket[2]});
    assertArrayEquals(new byte[] {(byte) 128}, new byte[] {(byte) firstPacket.length});

    // Second packet should have 9 LEDs
    byte[] secondPacket = writtenData.get(1);
    assertArrayEquals(new byte[] {0x4C}, new byte[] {secondPacket[0]});
    assertArrayEquals(new byte[] {9}, new byte[] {secondPacket[2]});
    assertArrayEquals(new byte[] {40}, new byte[] {(byte) secondPacket.length});
  }

  @Test
  public void testSetStringRgbLedValues_NoSplit_Mega() {
    // Configure for Mega (hardwareType = 1)
    config.hardwareType = 1;
    when(protocol.getMaxBufferSize()).thenReturn(512);

    // Send 40 LEDs.
    // Max LEDs per packet for Mega (limit 512) is (512 - 4) / 4 = 127.
    // 40 LEDs should fit in 1 packet.
    List<RgbLedState> leds = new ArrayList<>();
    for (int i = 0; i < 40; i++) {
      leds.add(RgbLedState.newBuilder().setIndex(i).setR(10).setG(20).setB(30).build());
    }

    helper.setStringRgbLedValues(2, leds);

    ArgumentCaptor<byte[]> captor = ArgumentCaptor.forClass(byte[].class);
    verify(protocol, times(1)).writeData(captor.capture());
    byte[] packet = captor.getValue();
    assertArrayEquals(new byte[] {40}, new byte[] {packet[2]});
    assertArrayEquals(new byte[] {(byte) 164}, new byte[] {(byte) (packet.length & 0xFF)});
  }

  @Test
  public void testSendRgbLedMode_Optimization() {
    // 1. Initial call
    List<Integer> leds = new ArrayList<>(Arrays.asList(1, 1, 0, 0));
    LedString string0 = new LedString(2, leds, 100, 0, 5.0, new ArrayList<>());
    config.ledStrings = new ArrayList<>(Collections.singletonList(string0));

    helper.sendRgbLedMode();
    // Opcode 0x6C, Pin 2, Count 4 (full list size now), Brightness 100
    verify(protocol, times(1))
        .writeData(
            argThat(data -> data[0] == 0x6C && data[1] == 2 && data[2] == 4 && data[3] == 100));

    // 2. Second call with same config - should NOT send again
    reset(protocol);
    when(protocol.getConfig()).thenReturn(config);
    when(protocol.isSerialOpen()).thenReturn(true);
    when(protocol.getLogTime()).thenReturn("12:00:00.000");

    helper.sendRgbLedMode();
    verify(protocol, never()).writeData(any());

    // 3. Change behavior within "used" range (e.g. index 0 from behavior 1 to
    // behavior 2)
    // addressableLeds remains 4 (size of list).
    reset(protocol);
    leds.set(0, 2);
    LedString stringUpdated = new LedString(2, leds, 100, 0, 5.0, new ArrayList<>());
    config.ledStrings = new ArrayList<>(Collections.singletonList(stringUpdated));
    when(protocol.getConfig()).thenReturn(config);
    when(protocol.isSerialOpen()).thenReturn(true);
    when(protocol.getLogTime()).thenReturn("12:00:00.000");

    helper.sendRgbLedMode();
    verify(protocol, never()).writeData(any());

    // 4. Change brightness - SHOULD send
    reset(protocol);
    stringUpdated.brightness = 200;
    when(protocol.getConfig()).thenReturn(config);
    when(protocol.isSerialOpen()).thenReturn(true);
    when(protocol.getLogTime()).thenReturn("12:00:00.000");

    helper.sendRgbLedMode();
    verify(protocol, times(1)).writeData(argThat(data -> data[0] == 0x6C && data[3] == (byte) 200));

    // 5. Change addressable leds (unused to used) - SHOULD NOT send if size didn't change (as it
    // doesn't anymore)
    // Wait, in this test leds is [2, 1, 1, 0] now? No, [1, 1, 0, 0] then set(0, 2) -> [2, 1, 0, 0].
    // Then set(2, 1) -> [2, 1, 1, 0]. Size remains 4.
    reset(protocol);
    leds.set(2, 1); // index 2 now used
    stringUpdated = new LedString(2, leds, 200, 0, 5.0, new ArrayList<>());
    config.ledStrings = new ArrayList<>(Collections.singletonList(stringUpdated));
    when(protocol.getConfig()).thenReturn(config);
    when(protocol.isSerialOpen()).thenReturn(true);
    when(protocol.getLogTime()).thenReturn("12:00:00.000");

    helper.sendRgbLedMode();
    // numUsedLeds changed from 2 to 3, so it SHOULD send
    verify(protocol, times(1)).writeData(argThat(data -> data[0] == 0x6C && data[2] == 4));
  }

  @Test
  public void testSendRgbLedMode_Removals() {
    // 1. Initial string
    LedString string0 = new LedString(2, Arrays.asList(1), 100, 0, 5.0, new ArrayList<>());
    config.ledStrings = new ArrayList<>(Collections.singletonList(string0));
    helper.sendRgbLedMode();
    verify(protocol, times(1)).writeData(any());

    // 2. Remove all strings
    reset(protocol);
    config.ledStrings = null;
    when(protocol.getConfig()).thenReturn(config);
    when(protocol.isSerialOpen()).thenReturn(true);

    helper.sendRgbLedMode();
    // Should send cleanup message: pin 2, brightness 0 (to turn off previous
    // string)
    verify(protocol).writeData(argThat(data -> data[0] == 0x6C && data[1] == 2 && data[3] == 0));
  }

  @Test
  public void testSetFuelLevel_Full() {
    // 8 LEDs for Lane 0 Fuel
    LedString ledString = new LedString();
    ledString.pin = 2;
    ledString.leds =
        new ArrayList<>(
            Collections.nCopies(8, RgbLedBehavior.RGB_LED_BEHAVIOR_FUEL_LEVEL_BASE_VALUE + 0));
    config.ledStrings = Collections.singletonList(ledString);

    // 100% fuel (p=1.0)
    helper.setFuelLevel(0, 100);

    // Expected: All 8 LEDs ON.
    // thermometerSize=8: numGreen=4, numYellow=2, numRed=2
    // LEDs 0-3: Green (0, 255, 0)
    // LEDs 4-5: Yellow (255, 255, 0)
    // LEDs 6-7: Red (255, 0, 0)

    ArgumentCaptor<byte[]> captor = ArgumentCaptor.forClass(byte[].class);
    verify(protocol).writeData(captor.capture());
    byte[] data = captor.getValue();

    assertEquals(0x4C, data[0]);
    assertEquals(8, data[2]);

    // LED 0 (Green)
    assertEquals(0x00, data[3]);
    assertEquals(0, data[4]);
    assertEquals((byte) 0xFF, data[5]);
    assertEquals(0, data[6]);

    // LED 4 (Yellow)
    assertEquals(0x04, data[19]);
    assertEquals((byte) 0xFF, data[20]);
    assertEquals((byte) 0xFF, data[21]);
    assertEquals(0, data[22]);

    // LED 7 (Red)
    assertEquals(0x07, data[31]);
    assertEquals((byte) 0xFF, data[32]);
    assertEquals(0, data[33]);
    assertEquals(0, data[34]);
  }

  @Test
  public void testSetFuelLevel_SegmentedTurnOffOrder() {
    // 4 LEDs: 2 Green, 1 Yellow, 1 Red
    LedString ledString = new LedString();
    ledString.pin = 2;
    ledString.leds =
        new ArrayList<>(
            Collections.nCopies(4, RgbLedBehavior.RGB_LED_BEHAVIOR_FUEL_LEVEL_BASE_VALUE + 0));
    config.ledStrings = Collections.singletonList(ledString);

    // 1. 100% (p=1.0) -> All ON
    helper.setFuelLevel(0, 100);
    verify(protocol).writeData(argThat(data -> data[2] == 4)); // All 4 updated

    // 2. 75% fuel (p=0.75) -> One Green turns off (Pixel 0)
    reset(protocol);
    when(protocol.isSerialOpen()).thenReturn(true);
    when(protocol.getConfig()).thenReturn(config);
    when(protocol.getMaxBufferSize()).thenReturn(128);
    helper.setFuelLevel(0, 75);

    ArgumentCaptor<byte[]> captor = ArgumentCaptor.forClass(byte[].class);
    verify(protocol).writeData(captor.capture());
    byte[] data = captor.getValue();
    assertEquals(1, data[2]); // One LED updated
    assertEquals(0, data[3]); // Index 0
    assertEquals(0, data[5]); // Pixel 0 G OFF

    // 3. 50% fuel (p=0.5) -> Next Green turn off (Pixel 1)
    reset(protocol);
    when(protocol.isSerialOpen()).thenReturn(true);
    when(protocol.getConfig()).thenReturn(config);
    when(protocol.getMaxBufferSize()).thenReturn(128);
    helper.setFuelLevel(0, 50);
    verify(protocol).writeData(captor.capture());
    data = captor.getValue();
    assertEquals(1, data[2]); // One LED updated
    assertEquals(1, data[3]); // Index 1
    assertEquals(0, data[5]); // Pixel 1 G OFF
  }

  @Test
  public void testSetFuelLevel_Optimization() {
    LedString ledString = new LedString();
    ledString.pin = 2;
    ledString.leds =
        Collections.singletonList(RgbLedBehavior.RGB_LED_BEHAVIOR_FUEL_LEVEL_BASE_VALUE + 0);
    config.ledStrings = Collections.singletonList(ledString);

    // 1. First update
    helper.setFuelLevel(0, 100);
    verify(protocol, times(1)).writeData(any());

    // 2. Same level -> SHOULD NOT SEND (State tracking)
    reset(protocol);
    when(protocol.getConfig()).thenReturn(config);
    when(protocol.isSerialOpen()).thenReturn(true);
    when(protocol.getLogTime()).thenReturn("12:00:00.000");
    when(protocol.getMaxBufferSize()).thenReturn(128);

    helper.setFuelLevel(0, 100);
    verify(protocol, never()).writeData(any());

    // 3. Different level (must change color to trigger update)
    // 100% is Green, 10% is Red
    reset(protocol);
    when(protocol.getConfig()).thenReturn(config);
    when(protocol.isSerialOpen()).thenReturn(true);
    when(protocol.getLogTime()).thenReturn("12:00:00.000");
    when(protocol.getMaxBufferSize()).thenReturn(128);

    helper.setFuelLevel(0, 10);
    verify(protocol, times(1)).writeData(any());
  }

  @Test
  public void testSetHeatProgress_SmallString_GroupTransitions() {
    // 1 LED: transitions through group colors
    LedString ledString = new LedString();
    ledString.pin = 2;
    ledString.leds = Collections.singletonList(RgbLedBehavior.RGB_LED_BEHAVIOR_HEAT_PROGRESS_VALUE);
    config.ledStrings = Collections.singletonList(ledString);

    ArgumentCaptor<byte[]> captor = ArgumentCaptor.forClass(byte[].class);
    when(protocol.isSerialOpen()).thenReturn(true);

    // 0% progress (p=1.0) -> Green
    helper.setHeatProgress(0.0);
    verify(protocol).writeData(captor.capture());
    byte[] data = captor.getValue();
    assertEquals(0, data[4]); // R
    assertEquals((byte) 0xFF, data[5]); // G

    // 60% progress (p=0.4) -> Yellow (0.25 <= 0.4 < 0.5)
    reset(protocol);
    when(protocol.isSerialOpen()).thenReturn(true);
    when(protocol.getConfig()).thenReturn(config);
    when(protocol.getMaxBufferSize()).thenReturn(128);
    helper.setHeatProgress(0.6);
    verify(protocol).writeData(captor.capture());
    data = captor.getValue();
    assertEquals((byte) 0xFF, data[4]); // R
    assertEquals((byte) 0xFF, data[5]); // G

    // 80% progress (p=0.2) -> Red (0 < 0.2 < 0.25)
    reset(protocol);
    when(protocol.isSerialOpen()).thenReturn(true);
    when(protocol.getConfig()).thenReturn(config);
    when(protocol.getMaxBufferSize()).thenReturn(128);
    helper.setHeatProgress(0.8);
    verify(protocol).writeData(captor.capture());
    data = captor.getValue();
    assertEquals((byte) 0xFF, data[4]); // R
    assertEquals(0, data[5]); // G

    // 100% progress (p=0.0) -> OFF
    reset(protocol);
    when(protocol.isSerialOpen()).thenReturn(true);
    when(protocol.getConfig()).thenReturn(config);
    when(protocol.getMaxBufferSize()).thenReturn(128);
    helper.setHeatProgress(1.0);
    verify(protocol).writeData(captor.capture());
    data = captor.getValue();
    assertEquals(0, data[4]); // R
    assertEquals(0, data[5]); // G
  }

  @Test
  public void testThermometer_8Leds_SequentialDraining() {
    // 8 LEDs: 4 Green (0-3), 2 Yellow (4-5), 2 Red (6-7)
    // Spec: numRed = max(1, floor(8*0.25)) = 2
    //       numYellow = max(1, floor(8*0.25)) = 2
    //       numGreen = 8 - 2 - 2 = 4
    LedString ledString = new LedString();
    ledString.pin = 2;
    ledString.leds =
        new ArrayList<>(
            Collections.nCopies(8, RgbLedBehavior.RGB_LED_BEHAVIOR_HEAT_PROGRESS_VALUE));
    config.ledStrings = Collections.singletonList(ledString);

    ArgumentCaptor<byte[]> captor = ArgumentCaptor.forClass(byte[].class);
    when(protocol.isSerialOpen()).thenReturn(true);
    when(protocol.getConfig()).thenReturn(config);
    when(protocol.getMaxBufferSize()).thenReturn(128);
    when(protocol.getLogTime()).thenReturn("12:00:00.000");

    // 1. 0% progress (p=1.0) -> All 8 ON (4G, 2Y, 2R)
    helper.setHeatProgress(0.0);
    verify(protocol).writeData(captor.capture());
    byte[] data = captor.getValue();
    assertEquals(8, data[2]); // 8 LEDs
    // Check first green (Index 0)
    assertEquals(0, data[3]);
    assertEquals(0, data[4]); // R
    assertEquals((byte) 0xFF, data[5]); // G
    // Check last red (Index 7)
    // Pixel 7 is at data[3 + 7*4] = 31
    assertEquals(7, data[31]); // Index
    assertEquals((byte) 0xFF, data[32]); // R
    assertEquals(0, data[33]); // G

    // 2. 12.5% progress (p=0.875) -> 1 Green off (Pixel 0)
    // segmentP = (0.875 - 0.5) / 0.5 = 0.375 / 0.5 = 0.75
    // onGreen = ceil(0.75 * 4) = 3.
    // numGreen - onGreen = 1. Pixel 0 is OFF.
    reset(protocol);
    setupMocks();
    helper.setHeatProgress(0.125);
    verify(protocol).writeData(captor.capture());
    data = captor.getValue();
    assertEquals(1, data[2]); // Only 1 update (Pixel 0)
    assertEquals(0, data[3]); // Index 0
    assertEquals(0, data[5]); // G=0

    // 3. 50% progress (p=0.5) -> All 4 Green OFF
    reset(protocol);
    setupMocks();
    helper.setHeatProgress(0.5);
    // Since we just turned off 1 green in step 2, we expect the remaining 3 green to turn off
    verify(protocol, atLeastOnce()).writeData(captor.capture());
    data = captor.getValue();
    assertEquals(3, data[2]); // 3 updates (Pixels 1, 2, 3)

    // 4. 75% progress (p=0.25) -> All 2 Yellow OFF
    // p=0.25 -> onYellow = ceil(0*2) = 0.
    reset(protocol);
    setupMocks();
    helper.setHeatProgress(0.75);
    verify(protocol, atLeastOnce()).writeData(captor.capture());
    data = captor.getValue();
    assertEquals(2, data[2]); // 2 updates (Pixels 4, 5)
    assertEquals(4, data[3]); // Index 4
    assertEquals(5, data[7]); // Index 5

    // 5. 90% progress (p=0.1) -> 1 Red OFF (Pixel 6)
    // p=0.1 -> onRed = ceil(0.1/0.25 * 2) = ceil(0.8) = 1.
    // numRed - onRed = 2 - 1 = 1. First red (Pixel 6) is OFF.
    reset(protocol);
    setupMocks();
    helper.setHeatProgress(0.9);
    verify(protocol, atLeastOnce()).writeData(captor.capture());
    data = captor.getValue();
    assertEquals(1, data[2]); // 1 update
    assertEquals(6, data[3]); // Index 6
    assertEquals(0, data[4]); // R=0

    // 6. 100% progress (p=0.0) -> Last Red OFF (Pixel 7)
    reset(protocol);
    setupMocks();
    helper.setHeatProgress(1.0);
    verify(protocol, atLeastOnce()).writeData(captor.capture());
    data = captor.getValue();
    assertEquals(1, data[2]);
    assertEquals(7, data[3]);
    assertEquals(0, data[4]); // R=0
  }

  private void setupMocks() {
    when(protocol.isSerialOpen()).thenReturn(true);
    when(protocol.getConfig()).thenReturn(config);
    when(protocol.getMaxBufferSize()).thenReturn(128);
    when(protocol.getLogTime()).thenReturn("12:00:00.000");
  }

  @Test
  public void testStateRefresh_Persistence() {
    LedString ledString = new LedString();
    ledString.pin = 2;
    ledString.leds = Collections.singletonList(RgbLedBehavior.RGB_LED_BEHAVIOR_HEAT_PROGRESS_VALUE);
    config.ledStrings = Collections.singletonList(ledString);

    // Set initial progress
    helper.setHeatProgress(0.0);
    verify(protocol, atLeastOnce()).writeData(argThat(data -> data[5] == (byte) 0xFF));

    // Change state/flag - should trigger refresh of progress
    reset(protocol);
    when(protocol.isSerialOpen()).thenReturn(true);
    when(protocol.getConfig()).thenReturn(config);
    when(protocol.getMaxBufferSize()).thenReturn(128);

    // Simulate a fresh hardware connection that triggered the state refresh
    helper.resetCache();

    helper.setRaceState(
        com.antigravity.proto.RaceState.RACING, com.antigravity.proto.RaceFlag.GREEN, 0);

    // Should have sent the progress update (Green LED) AND state update
    ArgumentCaptor<byte[]> captor = ArgumentCaptor.forClass(byte[].class);
    verify(protocol, atLeastOnce()).writeData(captor.capture());

    boolean progressFound = false;
    for (byte[] data : captor.getAllValues()) {
      if (data.length > 5 && data[5] == (byte) 0xFF) {
        progressFound = true;
        break;
      }
    }
    assertTrue("Progress should have been refreshed during state change", progressFound);
  }

  @Test
  public void testSetHeatStandings_GenericLeader() {
    // Setup an LED string with generic Heat Leader behavior (Value 1)
    LedString ledString = new LedString();
    ledString.pin = 8;
    ledString.leds = Collections.singletonList(RgbLedBehavior.RGB_LED_BEHAVIOR_HEAT_LEADER_VALUE);
    ledString.ledLaneColorOverrides =
        Arrays.asList("#FF0000", "#00FF00"); // Lane 0: Red, Lane 1: Green
    config.ledStrings = Collections.singletonList(ledString);

    ArgumentCaptor<byte[]> captor = ArgumentCaptor.forClass(byte[].class);
    when(protocol.getMaxBufferSize()).thenReturn(128);
    when(protocol.getLogTime()).thenReturn("12:00:00.000");

    // Standing: Lane 1 is leader -> LED should be GREEN
    helper.setHeatStandings(Arrays.asList(1, 0));
    verify(protocol, atLeastOnce()).writeData(captor.capture());
    byte[] data = captor.getValue();
    assertEquals(0, data[4]); // R
    assertEquals((byte) 0xFF, data[5]); // G
    assertEquals(0, data[6]); // B

    // Standing: Lane 0 is leader -> LED should be RED
    reset(protocol);
    when(protocol.isSerialOpen()).thenReturn(true);
    when(protocol.getConfig()).thenReturn(config);
    when(protocol.getMaxBufferSize()).thenReturn(128);
    when(protocol.getLogTime()).thenReturn("12:00:00.000");
    helper.setHeatStandings(Arrays.asList(0, 1));
    verify(protocol, atLeastOnce()).writeData(captor.capture());
    data = captor.getValue();
    assertEquals((byte) 0xFF, data[4]); // R
    assertEquals(0, data[5]); // G
  }

  @Test
  public void testSetHeatProgress_100PercentOff() {
    LedString ledString = new LedString();
    ledString.pin = 2;
    ledString.leds = Collections.singletonList(RgbLedBehavior.RGB_LED_BEHAVIOR_HEAT_PROGRESS_VALUE);
    config.ledStrings = Collections.singletonList(ledString);

    ArgumentCaptor<byte[]> captor = ArgumentCaptor.forClass(byte[].class);
    when(protocol.isSerialOpen()).thenReturn(true);
    when(protocol.getConfig()).thenReturn(config);
    when(protocol.getMaxBufferSize()).thenReturn(128);
    when(protocol.getLogTime()).thenReturn("12:00:00.000");

    // 100% progress (p=0.0) -> Off
    helper.setHeatProgress(1.0);
    verify(protocol).writeData(captor.capture());
    byte[] data = captor.getValue();
    assertEquals(0, data[4]); // R
    assertEquals(0, data[5]); // G
    assertEquals(0, data[6]); // B
  }

  @Test
  public void testSetHeatProgress_NotStarted_Override() {
    LedString ledString = new LedString();
    ledString.pin = 2;
    ledString.leds = Collections.singletonList(RgbLedBehavior.RGB_LED_BEHAVIOR_HEAT_PROGRESS_VALUE);
    config.ledStrings = Collections.singletonList(ledString);

    when(protocol.isSerialOpen()).thenReturn(true);
    when(protocol.getConfig()).thenReturn(config);
    when(protocol.getMaxBufferSize()).thenReturn(128);
    when(protocol.getLogTime()).thenReturn("12:00:00.000");

    helper.setRaceState(
        com.antigravity.proto.RaceState.NOT_STARTED, com.antigravity.proto.RaceFlag.RED, 0);

    ArgumentCaptor<byte[]> captor = ArgumentCaptor.forClass(byte[].class);
    reset(protocol);
    when(protocol.isSerialOpen()).thenReturn(true);
    when(protocol.getConfig()).thenReturn(config);
    when(protocol.getMaxBufferSize()).thenReturn(128);
    when(protocol.getLogTime()).thenReturn("12:00:00.000");

    // Even if we set progress (e.g. if re-entering NOT_STARTED), it should stay GREEN (p=1.0)
    helper.setHeatProgress(0.5);
    verify(protocol).writeData(captor.capture());
    byte[] data = captor.getValue();
    assertEquals(0, data[4]); // R
    assertEquals((byte) 0xFF, data[5]); // G
    assertEquals(0, data[6]); // B
  }

  @Test
  public void testSetRaceState_Solid() {
    LedString ledString = new LedString();
    ledString.pin = 2;
    ledString.leds =
        new ArrayList<>(
            Collections.nCopies(3, RgbLedBehavior.RGB_LED_BEHAVIOR_RACE_STATE_BASE_VALUE));
    config.ledStrings = Collections.singletonList(ledString);

    ArgumentCaptor<byte[]> captor = ArgumentCaptor.forClass(byte[].class);
    when(protocol.getMaxBufferSize()).thenReturn(128);
    when(protocol.getLogTime()).thenReturn("12:00:00.000");

    // GREEN flag
    helper.setRaceState(
        com.antigravity.proto.RaceState.RACING, com.antigravity.proto.RaceFlag.GREEN, 0);
    verify(protocol, atLeastOnce()).writeData(captor.capture());
    byte[] data = captor.getValue();
    assertEquals(0x4C, data[0]);
    assertEquals(3, data[2]); // 3 LEDs
    assertEquals(0, data[4]); // R
    assertEquals((byte) 0xFF, data[5]); // G
    assertEquals(0, data[6]); // B
  }

  @Test
  public void testSetRaceState_Interleaved() {
    LedString ledString = new LedString();
    ledString.pin = 2;
    int base = RgbLedBehavior.RGB_LED_BEHAVIOR_RACE_STATE_BASE_VALUE;
    ledString.leds = Arrays.asList(base, base + 1, base, base + 1);
    ledString.flagFlashRate = 0.0;
    config.ledStrings = Collections.singletonList(ledString);

    ArgumentCaptor<byte[]> captor = ArgumentCaptor.forClass(byte[].class);
    when(protocol.getMaxBufferSize()).thenReturn(128);
    when(protocol.getLogTime()).thenReturn("12:00:00.000");

    // CHECKERED flag (White/Black)
    helper.setRaceState(
        com.antigravity.proto.RaceState.HEAT_OVER, com.antigravity.proto.RaceFlag.CHECKERED, 0);
    verify(protocol, atLeastOnce()).writeData(captor.capture());
    byte[] data = captor.getValue();
    assertEquals(4, data[2]);

    // LED 0: White
    assertEquals((byte) 0xFF, data[4]);
    assertEquals((byte) 0xFF, data[5]);
    assertEquals((byte) 0xFF, data[6]);

    // LED 1: Black
    assertEquals(0, data[8]);
    assertEquals(0, data[9]);
    assertEquals(0, data[10]);

    // LED 2: White
    assertEquals((byte) 0xFF, data[12]);
    assertEquals((byte) 0xFF, data[13]);
    assertEquals((byte) 0xFF, data[14]);
  }

  @Test
  public void testSetRaceState_Yellow_Interleaved() {
    LedString ledString = new LedString();
    ledString.pin = 2;
    int base = RgbLedBehavior.RGB_LED_BEHAVIOR_RACE_STATE_BASE_VALUE;
    ledString.leds = Arrays.asList(base, base + 1, base, base + 1);
    ledString.flagFlashRate = 0.0;
    config.ledStrings = Collections.singletonList(ledString);

    ArgumentCaptor<byte[]> captor = ArgumentCaptor.forClass(byte[].class);
    when(protocol.getMaxBufferSize()).thenReturn(128);

    // YELLOW flag (Yellow/Black)
    helper.setRaceState(
        com.antigravity.proto.RaceState.RACING, com.antigravity.proto.RaceFlag.YELLOW, 0);
    verify(protocol, atLeastOnce()).writeData(captor.capture());
    byte[] data = captor.getValue();

    // LED 0: Yellow (255, 255, 0)
    assertEquals((byte) 0xFF, data[4]); // R
    assertEquals((byte) 0xFF, data[5]); // G
    assertEquals(0, data[6]); // B

    // LED 1: Black
    assertEquals(0, data[8]);
    assertEquals(0, data[9]);
    assertEquals(0, data[10]);
  }

  @Test
  public void testSetRaceState_Flashing_Alternates() {
    // Wrap helper in a spy to control time
    ArduinoLedHelper spyHelper = spy(helper);

    LedString ledString = new LedString();
    ledString.pin = 2;
    ledString.flagFlashRate = 1.0; // 1Hz = 1000ms period, toggle every 500ms
    ledString.leds =
        Collections.singletonList(RgbLedBehavior.RGB_LED_BEHAVIOR_RACE_STATE_BASE_VALUE);
    config.ledStrings = Collections.singletonList(ledString);

    ArgumentCaptor<byte[]> captor = ArgumentCaptor.forClass(byte[].class);
    when(protocol.getMaxBufferSize()).thenReturn(128);

    // Phase 1: t=0ms (Toggle state 1)
    doReturn(0L).when(spyHelper).getCurrentTimeMillis();
    spyHelper.setRaceState(
        com.antigravity.proto.RaceState.RACING, com.antigravity.proto.RaceFlag.YELLOW, 0);

    verify(protocol, atLeastOnce()).writeData(captor.capture());
    byte[] data1 = captor.getValue();
    assertEquals((byte) 0xFF, data1[4]); // Yellow R (assuming toggle=true shows rgb1)

    // Phase 2: t=600ms (Toggle state 2)
    reset(protocol);
    when(protocol.isSerialOpen()).thenReturn(true);
    when(protocol.getConfig()).thenReturn(config);
    when(protocol.getMaxBufferSize()).thenReturn(128);

    doReturn(600L).when(spyHelper).getCurrentTimeMillis();
    spyHelper.refreshRaceState();

    verify(protocol, atLeastOnce()).writeData(captor.capture());
    byte[] data2 = captor.getValue();
    assertEquals(0, data2[4]); // Black R (Yellow turned off)
  }

  @Test
  public void testCountdownBehavior() {
    // Mock time to control Green/Off transition
    ArduinoLedHelper spyHelper = spy(helper);
    doReturn(10000L).when(spyHelper).getCurrentTimeMillis();

    LedString ledString = new LedString();
    ledString.pin = 2;
    int base = RgbLedBehavior.RGB_LED_BEHAVIOR_COUNTDOWN_BASE_VALUE;
    // LEDs for sequence positions 1, 2, 3, 4, 5
    ledString.leds = Arrays.asList(base + 1, base + 2, base + 3, base + 4, base + 5);
    config.ledStrings = Collections.singletonList(ledString);

    ArgumentCaptor<byte[]> captor = ArgumentCaptor.forClass(byte[].class);
    when(protocol.getMaxBufferSize()).thenReturn(128);

    // 1. Initial State: STARTING, Countdown 5.0
    // floor(5.0) = 5. Only LED 5 (Index 4, behavior 3005) is ON (5 <= 5)
    // However, since this is the first update, all 5 LEDs are sent (LED 5 as RED, others as OFF)
    spyHelper.setRaceState(
        com.antigravity.proto.RaceState.STARTING, com.antigravity.proto.RaceFlag.RED, 5.0);
    verify(protocol, atLeastOnce()).writeData(captor.capture());
    byte[] data = captor.getValue();
    assertEquals(5, data[2]); // First sync sends all 5 LEDs
    // Find LED 5 (Index 4) and verify it is Red
    boolean foundRed = false;
    for (int i = 0; i < 5; i++) {
      int idx = data[3 + i * 4] & 0xFF;
      if (idx == 4) {
        assertEquals((byte) 255, data[4 + i * 4]); // R
        assertEquals(0, data[5 + i * 4]); // G
        assertEquals(0, data[6 + i * 4]); // B
        foundRed = true;
      } else {
        assertEquals(0, data[4 + i * 4]); // OFF
      }
    }
    assertTrue("LED 5 should be RED", foundRed);

    // 2. Countdown progresses to 4.0s
    // floor(4.0) = 4. LEDs 5 and 4 turn ON (4 <= 5 and 4 <= 4)
    reset(protocol);
    setupMocks();
    doReturn(10200L).when(spyHelper).getCurrentTimeMillis();
    spyHelper.setRaceState(
        com.antigravity.proto.RaceState.STARTING, com.antigravity.proto.RaceFlag.RED, 4.0);
    verify(protocol, atLeastOnce()).writeData(captor.capture());
    data = captor.getValue();
    assertEquals(1, data[2]); // Index 3 turns ON (Behavior 3004)
    assertEquals(3, data[3]); // Index 3

    // 3. Countdown progresses to 3.9s
    // floor(3.9) = 3. LEDs 5, 4, and 3 turn ON (3 <= 5, 4, 3)
    reset(protocol);
    setupMocks();
    doReturn(10250L).when(spyHelper).getCurrentTimeMillis();
    spyHelper.setRaceState(
        com.antigravity.proto.RaceState.STARTING, com.antigravity.proto.RaceFlag.RED, 3.9);
    verify(protocol, atLeastOnce()).writeData(captor.capture());
    data = captor.getValue();
    assertEquals(1, data[2]); // Index 2 turns ON (Behavior 3003)
    assertEquals(2, data[3]); // Index 2

    // 4. Countdown progresses to 1.0s
    // floor(1.0) = 1. All LEDs 1-5 turn RED
    reset(protocol);
    setupMocks();
    doReturn(10300L).when(spyHelper).getCurrentTimeMillis();
    spyHelper.setRaceState(
        com.antigravity.proto.RaceState.STARTING, com.antigravity.proto.RaceFlag.RED, 1.0);
    verify(protocol, atLeastOnce()).writeData(captor.capture());
    data = captor.getValue();
    // Index 1, 0 were OFF, now turn ON.
    assertEquals(2, data[2]);

    // 5. Race Starts: RACING, Flag GREEN
    reset(protocol);
    setupMocks();
    doReturn(10400L).when(spyHelper).getCurrentTimeMillis();
    spyHelper.setRaceState(
        com.antigravity.proto.RaceState.RACING, com.antigravity.proto.RaceFlag.GREEN, 0.0);
    verify(protocol, atLeastOnce()).writeData(captor.capture());
    data = captor.getValue();
    assertEquals(5, data[2]);
    for (int i = 0; i < 5; i++) {
      assertEquals(0, data[4 + i * 4]); // R=0
      assertEquals((byte) 255, data[5 + i * 4]); // G=255
    }

    // 6. Time passes: 11500ms (> 1s since 10400ms)
    // All countdown LEDs should turn OFF
    reset(protocol);
    setupMocks();
    doReturn(11500L).when(spyHelper).getCurrentTimeMillis();
    spyHelper.refreshRaceState();
    verify(protocol, atLeastOnce()).writeData(captor.capture());
    data = captor.getValue();
    assertEquals(5, data[2]);
    for (int i = 0; i < 5; i++) {
      assertEquals(0, data[4 + i * 4]); // R=0
      assertEquals(0, data[5 + i * 4]); // G=0
    }
  }

  @Test
  public void testSetRaceState_Flashing_RateZero_DoesNotAlternate() {
    ArduinoLedHelper spyHelper = spy(helper);

    LedString ledString = new LedString();
    ledString.pin = 2;
    ledString.flagFlashRate = 0.0; // Rate 0 = No flashing
    ledString.leds =
        Collections.singletonList(RgbLedBehavior.RGB_LED_BEHAVIOR_RACE_STATE_BASE_VALUE);
    config.ledStrings = Collections.singletonList(ledString);

    ArgumentCaptor<byte[]> captor = ArgumentCaptor.forClass(byte[].class);
    when(protocol.getMaxBufferSize()).thenReturn(128);

    // t=0ms
    doReturn(0L).when(spyHelper).getCurrentTimeMillis();
    spyHelper.setRaceState(
        com.antigravity.proto.RaceState.RACING, com.antigravity.proto.RaceFlag.YELLOW, 0);

    verify(protocol, atLeastOnce()).writeData(captor.capture());
    byte[] data1 = captor.getValue();
    assertEquals((byte) 0xFF, data1[4]); // Yellow R

    // t=600ms - should still be Yellow because rate is 0
    reset(protocol);
    when(protocol.isSerialOpen()).thenReturn(true);
    when(protocol.getConfig()).thenReturn(config);
    when(protocol.getMaxBufferSize()).thenReturn(128);

    doReturn(600L).when(spyHelper).getCurrentTimeMillis();
    spyHelper.refreshRaceState();

    // If no data was sent, that also means it didn't change (which is correct for rate 0)
    // But since it's the second call, the state tracking in helper will prevent sending if it
    // hasn't changed.
    verify(protocol, never()).writeData(any());
  }

  @Test
  public void testSetRaceState_Countdown_Thresholds() {
    LedString ledString = new LedString();
    ledString.pin = 2;
    int base = RgbLedBehavior.RGB_LED_BEHAVIOR_RACE_STATE_BASE_VALUE;
    // LED 0: Race State (5) -> Behavior base + 4
    // LED 1: Race State (1) -> Behavior base + 0
    ledString.leds = Arrays.asList(base + 4, base + 0);
    config.ledStrings = Collections.singletonList(ledString);

    ArgumentCaptor<byte[]> captor = ArgumentCaptor.forClass(byte[].class);
    when(protocol.getMaxBufferSize()).thenReturn(128);
    when(protocol.getLogTime()).thenReturn("12:00:00.000");

    // 1. Countdown at 5.0s -> Both should be OFF (floor(5)=5, and 5 > 4 and 5 > 0)
    helper.setRaceState(
        com.antigravity.proto.RaceState.STARTING, com.antigravity.proto.RaceFlag.RED, 5.0);

    // Initial check: if cache was empty, it might not send updates if they are already 0,
    // but usually clearLeds() or resetCache() ensures we start clean.
    // In this case, we check that if it SENT something, it was 0,0,0.
    verify(protocol, never())
        .writeData(
            argThat(data -> data.length > 5 && (data[4] != 0 || data[5] != 0 || data[6] != 0)));

    // 2. Countdown at 4.0s -> LED 0 (base+4) should turn ON (RED)
    reset(protocol);
    setupMocks();
    helper.setRaceState(
        com.antigravity.proto.RaceState.STARTING, com.antigravity.proto.RaceFlag.RED, 4.0);
    verify(protocol, atLeastOnce()).writeData(captor.capture());
    byte[] data = captor.getValue();

    // Check LED 0 (Index 0)
    assertEquals(0, data[3]);
    assertEquals((byte) 0xFF, data[4]); // R=255

    // 3. Countdown at 0.0s -> LED 1 (base+0) should turn ON (RED)
    reset(protocol);
    setupMocks();
    helper.setRaceState(
        com.antigravity.proto.RaceState.STARTING, com.antigravity.proto.RaceFlag.RED, 0.0);
    verify(protocol, atLeastOnce()).writeData(captor.capture());
    data = captor.getValue();

    // Check LED 1 (Index 1)
    assertEquals(1, data[3]);
    assertEquals((byte) 0xFF, data[4]); // R=255
  }

  @Test
  public void testSetRaceState_Starting_NoFlashNoInterleave() {
    LedString ledString = new LedString();
    ledString.pin = 2;
    // Behavior base + 2 corresponds to YELLOW flag
    ledString.leds = Arrays.asList(RgbLedBehavior.RGB_LED_BEHAVIOR_RACE_STATE_BASE_VALUE + 2);
    ledString.flagFlashRate = 1.0;
    config.ledStrings = Collections.singletonList(ledString);

    ArgumentCaptor<byte[]> captor = ArgumentCaptor.forClass(byte[].class);
    when(protocol.getMaxBufferSize()).thenReturn(128);

    // Starting with YELLOW flag (restart)
    helper.setRaceState(
        com.antigravity.proto.RaceState.STARTING, com.antigravity.proto.RaceFlag.YELLOW, 0.0);

    verify(protocol, atLeastOnce()).writeData(captor.capture());
    byte[] data = captor.getValue();

    // Should be solid Yellow (R=255, G=255) and NOT interleaved or flashed (i.e., not black)
    assertEquals(0, data[3]);
    assertEquals(255, data[4] & 0xFF);
    assertEquals(255, data[5] & 0xFF);
  }

  @Test
  public void testSetRaceState_NotStarted_SendsRed() {
    LedString ledString = new LedString();
    ledString.pin = 2;
    ledString.leds =
        Collections.singletonList(RgbLedBehavior.RGB_LED_BEHAVIOR_RACE_STATE_BASE_VALUE);
    config.ledStrings = Collections.singletonList(ledString);

    ArgumentCaptor<byte[]> captor = ArgumentCaptor.forClass(byte[].class);
    when(protocol.getMaxBufferSize()).thenReturn(128);

    // Set to NOT_STARTED
    helper.setRaceState(
        com.antigravity.proto.RaceState.NOT_STARTED, com.antigravity.proto.RaceFlag.RED, 0.0);

    verify(protocol, atLeastOnce()).writeData(captor.capture());
    byte[] data = captor.getValue();
    assertEquals(255, data[4] & 0xFF); // Red
    assertEquals(0, data[5] & 0xFF);
  }

  @Test
  public void testSetRaceState_NoCachingWhenSerialClosed() {
    LedString ledString = new LedString();
    ledString.pin = 2;
    ledString.leds =
        Collections.singletonList(RgbLedBehavior.RGB_LED_BEHAVIOR_RACE_STATE_BASE_VALUE);
    config.ledStrings = Collections.singletonList(ledString);

    // 1. Serial closed -> update should NOT be sent and NOT cached
    when(protocol.isSerialOpen()).thenReturn(false);
    helper.setRaceState(
        com.antigravity.proto.RaceState.NOT_STARTED, com.antigravity.proto.RaceFlag.RED, 0);
    verify(protocol, never()).writeData(any());

    // 2. Serial opened -> should now send the update because it wasn't cached before
    reset(protocol);
    when(protocol.isSerialOpen()).thenReturn(true);
    when(protocol.getConfig()).thenReturn(config);
    when(protocol.getMaxBufferSize()).thenReturn(128);
    when(protocol.getLogTime()).thenReturn("12:00:00.000");

    helper.setRaceState(
        com.antigravity.proto.RaceState.NOT_STARTED, com.antigravity.proto.RaceFlag.RED, 0);
    verify(protocol, atLeastOnce()).writeData(any());
  }

  @Test
  public void testSetRaceState_Starting_NoInterleave() {
    LedString ledString = new LedString();
    ledString.pin = 2;
    int base = RgbLedBehavior.RGB_LED_BEHAVIOR_RACE_STATE_BASE_VALUE;
    // Indices 0 and 1 -> Index 1 would usually be interleaved/off for YELLOW
    ledString.leds = Arrays.asList(base, base + 1);
    config.ledStrings = Collections.singletonList(ledString);

    ArgumentCaptor<byte[]> captor = ArgumentCaptor.forClass(byte[].class);
    when(protocol.getMaxBufferSize()).thenReturn(128);

    // Starting with YELLOW flag (restart)
    helper.setRaceState(
        com.antigravity.proto.RaceState.STARTING, com.antigravity.proto.RaceFlag.YELLOW, 0.0);

    verify(protocol, atLeastOnce()).writeData(captor.capture());
    byte[] data = captor.getValue();
    assertEquals(2, data[2]); // Both LEDs updated

    // LED 1: Yellow (NOT Black/Interleaved)
    assertEquals(1, data[7]);
    assertEquals(255, data[8] & 0xFF);
    assertEquals(255, data[9] & 0xFF);
  }
}
