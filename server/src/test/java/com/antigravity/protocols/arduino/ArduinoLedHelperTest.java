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
    // Opcode 0x6C, Pin 2, Count 2, Brightness 100
    verify(protocol, times(1))
        .writeData(
            argThat(data -> data[0] == 0x6C && data[1] == 2 && data[2] == 2 && data[3] == 100));

    // 2. Second call with same config - should NOT send again
    reset(protocol);
    when(protocol.getConfig()).thenReturn(config);
    when(protocol.isSerialOpen()).thenReturn(true);
    when(protocol.getLogTime()).thenReturn("12:00:00.000");

    helper.sendRgbLedMode();
    verify(protocol, never()).writeData(any());

    // 3. Change behavior within "used" range (e.g. index 0 from behavior 1 to
    // behavior 2)
    // addressableLeds remains 2.
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

    // 5. Change addressable leds (unused to used) - SHOULD send
    reset(protocol);
    leds.set(2, 1); // index 2 now used, addressableLeds becomes 3
    stringUpdated = new LedString(2, leds, 200, 0, 5.0, new ArrayList<>());
    config.ledStrings = new ArrayList<>(Collections.singletonList(stringUpdated));
    when(protocol.getConfig()).thenReturn(config);
    when(protocol.isSerialOpen()).thenReturn(true);
    when(protocol.getLogTime()).thenReturn("12:00:00.000");

    helper.sendRgbLedMode();
    verify(protocol, times(1)).writeData(argThat(data -> data[0] == 0x6C && data[2] == 3));
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
    // 10 LEDs for Lane 0 Fuel
    LedString ledString = new LedString();
    ledString.pin = 2;
    ledString.leds =
        new ArrayList<>(
            Collections.nCopies(10, RgbLedBehavior.RGB_LED_BEHAVIOR_FUEL_LEVEL_BASE_VALUE + 0));
    config.ledStrings = Collections.singletonList(ledString);

    // 100% fuel
    helper.setFuelLevel(0, 100);

    // Expected: All 10 LEDs ON.
    // thermometerSize=10: numGreen=5, numYellow=3, numRed=2
    // LEDs 0-4: Green (0, 255, 0)
    // LEDs 5-7: Yellow (255, 255, 0)
    // LEDs 8-9: Red (255, 0, 0)

    ArgumentCaptor<byte[]> captor = ArgumentCaptor.forClass(byte[].class);
    verify(protocol).writeData(captor.capture());
    byte[] data = captor.getValue();

    assertEquals(0x4C, data[0]);
    assertEquals(10, data[2]);

    // LED 0 (Green)
    assertEquals(0x00, data[3]);
    assertEquals(0, data[4]);
    assertEquals((byte) 0xFF, data[5]);
    assertEquals(0, data[6]);

    // LED 9 (Red)
    assertEquals(0x09, (int) data[39] & 0xFF);
    assertEquals((byte) 0xFF, data[40]);
    assertEquals(0, data[41]);
    assertEquals(0, data[42]);
  }

  @Test
  public void testSetFuelLevel_Partial() {
    // 10 LEDs for Lane 0 Fuel
    LedString ledString = new LedString();
    ledString.pin = 2;
    ledString.leds =
        new ArrayList<>(
            Collections.nCopies(10, RgbLedBehavior.RGB_LED_BEHAVIOR_FUEL_LEVEL_BASE_VALUE + 0));
    config.ledStrings = Collections.singletonList(ledString);

    // 50% fuel
    // reverse = true, percentage = 0.5, thresholdPct = 0.5.
    // ledPct > 0.5 -> ON.
    // ledNum from 1..10.
    // 1/10=0.1, 2/10=0.2, 5/10=0.5 (OFF), 6/10=0.6 (ON)
    // LEDs 6..10 are ON. (ledNum 6, 7, 8, 9, 10 correspond to indices 5, 6, 7, 8,
    // 9)
    helper.setFuelLevel(0, 50);

    ArgumentCaptor<byte[]> captor = ArgumentCaptor.forClass(byte[].class);
    verify(protocol).writeData(captor.capture());
    byte[] data = captor.getValue();

    assertEquals(0x4C, data[0]);
    assertEquals(10, data[2]); // All 10 are sent because it's first update

    // LEDs 0-4 should be OFF
    for (int i = 0; i < 5; i++) {
      assertEquals(0, data[4 + i * 4]);
      assertEquals(0, data[5 + i * 4]);
      assertEquals(0, data[6 + i * 4]);
    }

    // LED 5 (ledNum 6) should be Yellow
    assertEquals(0x05, data[23]);
    assertEquals((byte) 0xFF, data[24]);
    assertEquals((byte) 0xFF, data[25]);
    assertEquals(0, data[26]);
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
  public void testSetHeatProgress_OneLed() {
    LedString ledString = new LedString();
    ledString.pin = 2;
    ledString.leds = Collections.singletonList(RgbLedBehavior.RGB_LED_BEHAVIOR_HEAT_PROGRESS_VALUE);
    config.ledStrings = Collections.singletonList(ledString);

    ArgumentCaptor<byte[]> captor = ArgumentCaptor.forClass(byte[].class);
    when(protocol.getMaxBufferSize()).thenReturn(128);
    when(protocol.getLogTime()).thenReturn("12:00:00.000");

    // 0-50% -> Green
    helper.setHeatProgress(0.1);
    verify(protocol, atLeastOnce()).writeData(captor.capture());
    byte[] data = captor.getValue();
    assertEquals(0, data[4]); // R
    assertEquals((byte) 0xFF, data[5]); // G
    assertEquals(0, data[6]); // B

    // 50-75% -> Yellow (Red + Green)
    reset(protocol);
    when(protocol.isSerialOpen()).thenReturn(true);
    when(protocol.getConfig()).thenReturn(config);
    when(protocol.getMaxBufferSize()).thenReturn(128);
    when(protocol.getLogTime()).thenReturn("12:00:00.000");

    helper.setHeatProgress(0.6);
    verify(protocol, atLeastOnce()).writeData(captor.capture());
    data = captor.getValue();
    assertEquals((byte) 0xFF, data[4]); // R
    assertEquals((byte) 0xFF, data[5]); // G
    assertEquals(0, data[6]); // B

    // 75-100% -> Red
    reset(protocol);
    when(protocol.isSerialOpen()).thenReturn(true);
    when(protocol.getConfig()).thenReturn(config);
    when(protocol.getMaxBufferSize()).thenReturn(128);
    when(protocol.getLogTime()).thenReturn("12:00:00.000");

    helper.setHeatProgress(0.9);
    verify(protocol, atLeastOnce()).writeData(captor.capture());
    data = captor.getValue();
    assertEquals((byte) 0xFF, data[4]); // R
    assertEquals(0, data[5]); // G
    assertEquals(0, data[6]); // B
  }

  @Test
  public void testSetHeatProgress_Thermometer() {
    LedString ledString = new LedString();
    ledString.pin = 2;
    ledString.leds =
        new ArrayList<>(
            Collections.nCopies(5, RgbLedBehavior.RGB_LED_BEHAVIOR_HEAT_PROGRESS_VALUE));
    config.ledStrings = Collections.singletonList(ledString);

    ArgumentCaptor<byte[]> captor = ArgumentCaptor.forClass(byte[].class);

    when(protocol.getMaxBufferSize()).thenReturn(128);
    when(protocol.getLogTime()).thenReturn("12:00:00.000");

    // 20% progress -> 1 LED on out of 5
    // reverse=true in updateThermometer means thresholdPct = 1.0 - 0.2 = 0.8
    // ledPct: 0.2, 0.4, 0.6, 0.8, 1.0
    // ledPct > 0.8 is true for only the last LED (ledNum 5)
    helper.setHeatProgress(0.2);
    verify(protocol, atLeastOnce()).writeData(captor.capture());
    byte[] data = captor.getValue();

    // On the first call, all 5 LEDs are "updated" because they transition from null to color.
    // 1 LED will be Green, 4 will be Black (OFF).
    assertEquals(5, (int) (data[2] & 0xFF)); // Five LEDs updated (first initialization)
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
    assertEquals(0, data2[4]); // Black R (swapped)
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
}
