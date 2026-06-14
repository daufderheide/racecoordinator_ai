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
    when(protocol.isOpen()).thenReturn(true);

    when(protocol.getMaxBufferSize()).thenReturn(128);
    helper = new ArduinoLedHelper(protocol);
    helper.setLaneColors(
        Arrays.asList("#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#00FFFF", "#FF00FF"));
  }

  @Test
  public void testSendRgbLedMode() {
    // Configure one LED string with 5 LEDs
    List<Integer> leds =
        new ArrayList<>(Collections.nCopies(5, RgbLedBehavior.RGB_LED_BEHAVIOR_UNUSED_VALUE));
    leds.set(
        4, RgbLedBehavior.RGB_LED_BEHAVIOR_LAP_SENSOR_BASE_VALUE); // Max index 4, so count is 5

    LedString string0 = new LedString(14, leds, 150, 0, 0, 5.0, new ArrayList<>());
    config.ledStrings = new ArrayList<>();
    config.ledStrings.add(string0);

    helper.sendRgbLedMode();

    // Opcode 0x6C (l)
    // pin = 14 (translated to physical 14 for Uno A0)
    // ledCount = 5
    // brightness = 150
    // updateRate = 20 (0x0014)
    // ledType = 0
    // colorOrder = 0 (Default)
    // Expected: 0x6C 0x0E 0x05 0x96 0x14 0x00 0x00 0x00 0x3B
    byte[] expected = {0x6C, 0x0E, 0x05, (byte) 150, 0x14, 0x00, 0x00, 0x00, 0x3B};

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
  public void testSendRgbLedMode_WithColorOrder() {
    // Configure one LED string with ColorOrder.GRB (1)
    List<Integer> leds = new ArrayList<>(Collections.singletonList(0));
    LedString string0 = new LedString(14, leds, 200, 2, 1, 10.0, new ArrayList<>());
    config.ledStrings = new ArrayList<>();
    config.ledStrings.add(string0);

    helper.sendRgbLedMode();

    // Expected: 0x6C, Pin: 14, Count: 1, Brightness: 200, Rate: 20 (0x0014), LedType: 2,
    // ColorOrder: 1, Term: 0x3B
    byte[] expected = {0x6C, 0x0E, 0x01, (byte) 200, 0x14, 0x00, 0x02, 0x01, 0x3B};

    ArgumentCaptor<byte[]> captor = ArgumentCaptor.forClass(byte[].class);
    verify(protocol, atLeastOnce()).writeData(captor.capture());

    boolean found = false;
    for (byte[] data : captor.getAllValues()) {
      if (Arrays.equals(expected, data)) {
        found = true;
        break;
      }
    }
    assertTrue("Should have sent RGB_LED_MODE command with color order 1", found);
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
  public void testSetRefueling_FallbackToTrackColor() {
    LedString ledString = new LedString();
    ledString.pin = 1000;
    ledString.leds =
        Collections.singletonList(
            RgbLedBehavior.RGB_LED_BEHAVIOR_REFUELING_BASE_VALUE + 5); // Lane 6
    ledString.ledLaneColorOverrides = new ArrayList<>(); // No override
    config.ledStrings = Collections.singletonList(ledString);

    // Lane 6 track color is Magenta (#FF00FF)
    helper.setRefueling(5, true);

    ArgumentCaptor<byte[]> captor = ArgumentCaptor.forClass(byte[].class);
    verify(protocol, atLeastOnce()).writeData(captor.capture());
    byte[] data = captor.getValue();
    assertEquals((byte) 0xFF, data[4]); // R
    assertEquals(0, data[5]); // G
    assertEquals((byte) 0xFF, data[6]); // B (Magenta)
  }

  @Test
  public void testSetRefueling_FallbackToWhiteOnMissingAll() {
    LedString ledString = new LedString();
    ledString.pin = 1000;
    ledString.leds =
        Collections.singletonList(RgbLedBehavior.RGB_LED_BEHAVIOR_REFUELING_BASE_VALUE + 5);
    ledString.ledLaneColorOverrides = new ArrayList<>();
    config.ledStrings = Collections.singletonList(ledString);

    // Provide empty lane colors to force the final fallback
    helper.setLaneColors(new ArrayList<>());
    helper.setRefueling(5, true);

    ArgumentCaptor<byte[]> captor = ArgumentCaptor.forClass(byte[].class);
    verify(protocol, atLeastOnce()).writeData(captor.capture());
    byte[] data = captor.getValue();
    assertEquals((byte) 0xFF, data[4]); // R
    assertEquals((byte) 0xFF, data[5]); // G
    assertEquals((byte) 0xFF, data[6]); // B (White)
  }

  @Test
  public void testSetRefueling_ColorBlackSafetyFallback() {
    LedString ledString = new LedString();
    ledString.pin = 1000;
    ledString.leds =
        Collections.singletonList(RgbLedBehavior.RGB_LED_BEHAVIOR_REFUELING_BASE_VALUE + 0);
    // Explicitly set override to black
    ledString.ledLaneColorOverrides = Collections.singletonList("#000000");
    config.ledStrings = Collections.singletonList(ledString);

    helper.setRefueling(0, true);

    ArgumentCaptor<byte[]> captor = ArgumentCaptor.forClass(byte[].class);
    verify(protocol, atLeastOnce()).writeData(captor.capture());
    byte[] data = captor.getValue();
    // Should be White (255,255,255) because of the safety fallback for black
    assertEquals((byte) 0xFF, data[4]);
    assertEquals((byte) 0xFF, data[5]);
    assertEquals((byte) 0xFF, data[6]);
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
    LedString string0 = new LedString(2, leds, 100, 0, 0, 5.0, new ArrayList<>());
    config.ledStrings = new ArrayList<>(Collections.singletonList(string0));

    helper.sendRgbLedMode();
    // Opcode 0x6C, Pin 2, Count 4 (full list size now), Brightness 100
    verify(protocol, times(1))
        .writeData(
            argThat(data -> data[0] == 0x6C && data[1] == 2 && data[2] == 4 && data[3] == 100));

    // 2. Second call with same config - should NOT send again
    reset(protocol);
    when(protocol.getConfig()).thenReturn(config);
    when(protocol.isOpen()).thenReturn(true);

    helper.sendRgbLedMode();
    verify(protocol, never()).writeData(any());

    // 3. Change behavior within "used" range (e.g. index 0 from behavior 1 to
    // behavior 2)
    // addressableLeds remains 4 (size of list).
    reset(protocol);
    leds.set(0, 2);
    LedString stringUpdated = new LedString(2, leds, 100, 0, 0, 5.0, new ArrayList<>());
    config.ledStrings = new ArrayList<>(Collections.singletonList(stringUpdated));
    when(protocol.getConfig()).thenReturn(config);
    when(protocol.isOpen()).thenReturn(true);

    helper.sendRgbLedMode();
    verify(protocol, never()).writeData(any());

    // 4. Change brightness - SHOULD send
    reset(protocol);
    stringUpdated.brightness = 200;
    when(protocol.getConfig()).thenReturn(config);
    when(protocol.isOpen()).thenReturn(true);

    helper.sendRgbLedMode();
    verify(protocol, times(1)).writeData(argThat(data -> data[0] == 0x6C && data[3] == (byte) 200));

    // 5. Change addressable leds (unused to used) - SHOULD NOT send if size didn't change (as it
    // doesn't anymore)
    // Wait, in this test leds is [2, 1, 1, 0] now? No, [1, 1, 0, 0] then set(0, 2) -> [2, 1, 0, 0].
    // Then set(2, 1) -> [2, 1, 1, 0]. Size remains 4.
    reset(protocol);
    leds.set(2, 1); // index 2 now used
    stringUpdated = new LedString(2, leds, 200, 0, 0, 5.0, new ArrayList<>());
    config.ledStrings = new ArrayList<>(Collections.singletonList(stringUpdated));
    when(protocol.getConfig()).thenReturn(config);
    when(protocol.isOpen()).thenReturn(true);

    helper.sendRgbLedMode();
    // numUsedLeds changed from 2 to 3, so it SHOULD send
    verify(protocol, times(1)).writeData(argThat(data -> data[0] == 0x6C && data[2] == 4));
  }

  @Test
  public void testSendRgbLedMode_Removals() {
    // 1. Initial string
    LedString string0 = new LedString(2, Arrays.asList(1), 100, 0, 0, 5.0, new ArrayList<>());
    config.ledStrings = new ArrayList<>(Collections.singletonList(string0));
    helper.sendRgbLedMode();
    verify(protocol, times(1)).writeData(any());

    // 2. Remove all strings
    reset(protocol);
    config.ledStrings = null;
    when(protocol.getConfig()).thenReturn(config);
    when(protocol.isOpen()).thenReturn(true);

    helper.sendRgbLedMode();
    // Should send cleanup message: pin 2, brightness 0 (to turn off previous string)
    byte[] expectedCleanup = {0x6C, 0x02, 0x01, 0, 0x14, 0x00, 0x00, 0x00, 0x3B};
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
    when(protocol.isOpen()).thenReturn(true);
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
    when(protocol.isOpen()).thenReturn(true);
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
    when(protocol.isOpen()).thenReturn(true);

    when(protocol.getMaxBufferSize()).thenReturn(128);

    helper.setFuelLevel(0, 100);
    verify(protocol, never()).writeData(any());

    // 3. Different level (must change color to trigger update)
    // 100% is Green, 10% is Red
    reset(protocol);
    when(protocol.getConfig()).thenReturn(config);
    when(protocol.isOpen()).thenReturn(true);

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
    when(protocol.isOpen()).thenReturn(true);

    // 0% progress (p=1.0) -> Green
    helper.setHeatProgress(0.0);
    verify(protocol).writeData(captor.capture());
    byte[] data = captor.getValue();
    assertEquals(0, data[4]); // R
    assertEquals((byte) 0xFF, data[5]); // G

    // 60% progress (p=0.4) -> Yellow (0.25 <= 0.4 < 0.5)
    reset(protocol);
    when(protocol.isOpen()).thenReturn(true);
    when(protocol.getConfig()).thenReturn(config);
    when(protocol.getMaxBufferSize()).thenReturn(128);
    helper.setHeatProgress(0.6);
    verify(protocol).writeData(captor.capture());
    data = captor.getValue();
    assertEquals((byte) 0xFF, data[4]); // R
    assertEquals((byte) 0xFF, data[5]); // G

    // 80% progress (p=0.2) -> Red (0 < 0.2 < 0.25)
    reset(protocol);
    when(protocol.isOpen()).thenReturn(true);
    when(protocol.getConfig()).thenReturn(config);
    when(protocol.getMaxBufferSize()).thenReturn(128);
    helper.setHeatProgress(0.8);
    verify(protocol).writeData(captor.capture());
    data = captor.getValue();
    assertEquals((byte) 0xFF, data[4]); // R
    assertEquals(0, data[5]); // G

    // 100% progress (p=0.0) -> OFF
    reset(protocol);
    when(protocol.isOpen()).thenReturn(true);
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
    when(protocol.isOpen()).thenReturn(true);
    when(protocol.getConfig()).thenReturn(config);
    when(protocol.getMaxBufferSize()).thenReturn(128);

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
    when(protocol.isOpen()).thenReturn(true);
    when(protocol.getConfig()).thenReturn(config);
    when(protocol.getMaxBufferSize()).thenReturn(128);
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
    when(protocol.isOpen()).thenReturn(true);
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

    // Standing: Lane 1 is leader -> LED should be GREEN
    helper.setHeatStandings(Arrays.asList(1, 0));
    verify(protocol, atLeastOnce()).writeData(captor.capture());
    byte[] data = captor.getValue();
    assertEquals(0, data[4]); // R
    assertEquals((byte) 0xFF, data[5]); // G
    assertEquals(0, data[6]); // B

    // Standing: Lane 0 is leader -> LED should be RED
    reset(protocol);
    when(protocol.isOpen()).thenReturn(true);
    when(protocol.getConfig()).thenReturn(config);
    when(protocol.getMaxBufferSize()).thenReturn(128);

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
    when(protocol.isOpen()).thenReturn(true);
    when(protocol.getConfig()).thenReturn(config);
    when(protocol.getMaxBufferSize()).thenReturn(128);

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

    when(protocol.isOpen()).thenReturn(true);
    when(protocol.getConfig()).thenReturn(config);
    when(protocol.getMaxBufferSize()).thenReturn(128);

    helper.setRaceState(
        com.antigravity.proto.RaceState.NOT_STARTED, com.antigravity.proto.RaceFlag.RED, 0);

    ArgumentCaptor<byte[]> captor = ArgumentCaptor.forClass(byte[].class);
    reset(protocol);
    when(protocol.isOpen()).thenReturn(true);
    when(protocol.getConfig()).thenReturn(config);
    when(protocol.getMaxBufferSize()).thenReturn(128);

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
  public void testSetRaceState_RacingGreen_AllLedsOnEvenIfStartingDurationIsLess() {
    LedString ledString = new LedString();
    ledString.pin = 2;
    ledString.leds =
        new ArrayList<>(
            Collections.nCopies(5, RgbLedBehavior.RGB_LED_BEHAVIOR_RACE_STATE_BASE_VALUE));
    config.ledStrings = Collections.singletonList(ledString);

    ArgumentCaptor<byte[]> captor = ArgumentCaptor.forClass(byte[].class);
    when(protocol.getMaxBufferSize()).thenReturn(128);

    // 1. Initial 3s countdown (startingDuration = 3)
    helper.setRaceState(
        com.antigravity.proto.RaceState.STARTING, com.antigravity.proto.RaceFlag.RED, 3.0);

    // 2. Transition to RACING/GREEN.
    reset(protocol);
    setupMocks();
    helper.setRaceState(
        com.antigravity.proto.RaceState.RACING, com.antigravity.proto.RaceFlag.GREEN, 0);

    verify(protocol, atLeastOnce()).writeData(captor.capture());
    byte[] data = captor.getValue();
    assertEquals(0x4C, data[0]);
    assertEquals(5, data[2]); // All 5 LEDs should be updated
    // All of them should be green
    for (int i = 0; i < 5; i++) {
      assertEquals(0, data[4 + i * 4]); // R
      assertEquals((byte) 0xFF, data[5 + i * 4]); // G
      assertEquals(0, data[6 + i * 4]); // B
    }
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
    when(protocol.isOpen()).thenReturn(true);
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
    // LEDs for sequence positions 0, 1, 2, 3, 4
    ledString.leds = Arrays.asList(base, base + 1, base + 2, base + 3, base + 4);
    config.ledStrings = Collections.singletonList(ledString);

    ArgumentCaptor<byte[]> captor = ArgumentCaptor.forClass(byte[].class);
    when(protocol.getMaxBufferSize()).thenReturn(128);

    // 1. Initial State: STARTING, Countdown 5.0
    // onCount = 5 - ceil(5.0) + 1 = 1.
    // n >= 4 turns on. n = 4 is ON. (1 LED)
    spyHelper.setRaceState(
        com.antigravity.proto.RaceState.STARTING, com.antigravity.proto.RaceFlag.RED, 5.0);
    verify(protocol, atLeastOnce()).writeData(captor.capture());
    byte[] data = captor.getValue();
    assertEquals(5, data[2]); // First sync sends all 5 LEDs
    int onCount = 0;
    for (int i = 0; i < 5; i++) {
      if (data[4 + i * 4] == (byte) 255) onCount++;
    }
    assertEquals(1, onCount); // Only n=4 is ON.
    assertEquals(4, data[19]); // Index 4
    assertEquals((byte) 255, data[20]); // ON

    // 2. Countdown progresses to 4.0s
    // onCount = 5 - ceil(4.0) + 1 = 2.
    // n >= 3 turns on. n = 3, 4 are ON.
    reset(protocol);
    setupMocks();
    doReturn(10200L).when(spyHelper).getCurrentTimeMillis();
    spyHelper.setRaceState(
        com.antigravity.proto.RaceState.STARTING, com.antigravity.proto.RaceFlag.RED, 4.0);
    verify(protocol, atLeastOnce()).writeData(captor.capture());
    data = captor.getValue();
    // One more LED turned ON (n=3 at index 3)
    assertEquals(1, data[2]);
    assertEquals(3, data[3]); // Index 3
    assertEquals((byte) 255, data[4]); // ON

    // 3. Countdown progresses to 3.0s
    // onCount = 5 - ceil(3.0) + 1 = 3.
    // n >= 2 turns on. n = 2, 3, 4 are ON.
    reset(protocol);
    setupMocks();
    doReturn(10250L).when(spyHelper).getCurrentTimeMillis();
    spyHelper.setRaceState(
        com.antigravity.proto.RaceState.STARTING, com.antigravity.proto.RaceFlag.RED, 3.0);
    verify(protocol, atLeastOnce()).writeData(captor.capture());
    data = captor.getValue();
    assertEquals(1, data[2]); // One more LED ON (n=2 at index 2)
    assertEquals(2, data[3]); // Index 2
    assertEquals((byte) 255, data[4]); // ON

    // 4. Countdown progresses to 1.0s
    // onCount = 5 - ceil(1.0) + 1 = 5.
    // All LEDs 0-4 are ON
    reset(protocol);
    setupMocks();
    doReturn(10300L).when(spyHelper).getCurrentTimeMillis();
    spyHelper.setRaceState(
        com.antigravity.proto.RaceState.STARTING, com.antigravity.proto.RaceFlag.RED, 1.0);
    verify(protocol, atLeastOnce()).writeData(captor.capture());
    data = captor.getValue();
    // Indices 0, 1 were OFF, now turn ON.
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
    when(protocol.isOpen()).thenReturn(true);
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
    int base = RgbLedBehavior.RGB_LED_BEHAVIOR_COUNTDOWN_BASE_VALUE;
    // LED 0: n=4
    // LED 1: n=0
    ledString.leds = Arrays.asList(base + 4, base + 0);
    config.ledStrings = Collections.singletonList(ledString);

    ArgumentCaptor<byte[]> captor = ArgumentCaptor.forClass(byte[].class);
    when(protocol.getMaxBufferSize()).thenReturn(128);

    // 1. Initial State at 5.0s -> only LED with n >= 4 is ON (n=4)
    helper.setRaceState(
        com.antigravity.proto.RaceState.STARTING, com.antigravity.proto.RaceFlag.RED, 5.0);
    verify(protocol, atLeastOnce()).writeData(captor.capture());
    byte[] data = captor.getValue();

    // Check LED 0 (Index 0, Behavior base+4 -> n=4) should be ON
    assertEquals(0, data[3]);
    assertEquals((byte) 0xFF, data[4]); // R=255

    // Check LED 1 (Index 1, Behavior base+0 -> n=0) should be OFF
    assertEquals(1, data[7]);
    assertEquals(0, data[8]);

    // 3. Countdown at 1.0s -> onCount = 5. Both should be ON.
    reset(protocol);
    setupMocks();
    helper.resetCache();
    helper.setRaceState(
        com.antigravity.proto.RaceState.STARTING, com.antigravity.proto.RaceFlag.RED, 1.0);
    verify(protocol, atLeastOnce()).writeData(captor.capture());
    data = captor.getValue();
    assertEquals(2, data[2]); // Both updated

    // LED 0 (Index 0, Behavior base+4 -> n=4) should be ON
    assertEquals(0, data[3]);
    assertEquals((byte) 0xFF, data[4]);

    // LED 1 (Index 1, Behavior base+0 -> n=0) should be ON
    assertEquals(1, data[7]);
    assertEquals((byte) 0xFF, data[8]);
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

    // Starting with YELLOW flag (restart) at 5.0s
    helper.setRaceState(
        com.antigravity.proto.RaceState.STARTING, com.antigravity.proto.RaceFlag.YELLOW, 5.0);

    verify(protocol, atLeastOnce()).writeData(captor.capture());
    byte[] data = captor.getValue();

    // At 5.0s, onCount = 1. n = 2. 2 < 1 is False -> LED should be OFF
    assertEquals(0, data[3]);
    assertEquals(0, data[4] & 0xFF);
    assertEquals(0, data[5] & 0xFF);
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
    when(protocol.isOpen()).thenReturn(false);
    helper.setRaceState(
        com.antigravity.proto.RaceState.NOT_STARTED, com.antigravity.proto.RaceFlag.RED, 0);
    verify(protocol, never()).writeData(any());

    // 2. Serial opened -> should now send the update because it wasn't cached before
    reset(protocol);
    when(protocol.isOpen()).thenReturn(true);
    when(protocol.getConfig()).thenReturn(config);
    when(protocol.getMaxBufferSize()).thenReturn(128);

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

    // Starting with YELLOW flag (restart) at 5.0s
    helper.setRaceState(
        com.antigravity.proto.RaceState.STARTING, com.antigravity.proto.RaceFlag.YELLOW, 5.0);

    verify(protocol, atLeastOnce()).writeData(captor.capture());
    byte[] data = captor.getValue();
    assertEquals(2, data[2]); // Both LEDs updated

    // At 5.0s, onCount = 1.
    // LED 0: n=0. should be OFF (0 >= 4 is False) -> OFF
    assertEquals(0, data[3]);
    assertEquals(0, data[4] & 0xFF);

    // LED 1: n=1. should be OFF (1 >= 4 is False) -> OFF
    assertEquals(1, data[7]);
    assertEquals(0, data[8] & 0xFF);
    assertEquals(0, data[9] & 0xFF);
  }

  @Test
  public void testSetRaceState_Starting_RaceState_Countdown_F1() {
    LedString ledString = new LedString();
    ledString.pin = 2;
    int base = RgbLedBehavior.RGB_LED_BEHAVIOR_RACE_STATE_BASE_VALUE;
    // 5 LEDs configured (n=0..4)
    ledString.leds = Arrays.asList(base, base + 1, base + 2, base + 3, base + 4);
    config.ledStrings = Collections.singletonList(ledString);

    ArgumentCaptor<byte[]> captor = ArgumentCaptor.forClass(byte[].class);
    when(protocol.getMaxBufferSize()).thenReturn(128);

    // 1. Countdown at 5.0s -> onCount = 1 -> only n=4 (Race State 5) should be ON
    helper.setRaceState(
        com.antigravity.proto.RaceState.STARTING, com.antigravity.proto.RaceFlag.RED, 5.0);

    verify(protocol, atLeastOnce()).writeData(captor.capture());
    byte[] data = captor.getValue();
    assertEquals(5, data[2]); // 5 LEDs updated

    // Check that only index 4 (n=4) is ON (Red)
    assertEquals(0, data[4] & 0xFF); // n=0: OFF
    assertEquals(0, data[8] & 0xFF); // n=1: OFF
    assertEquals(0, data[12] & 0xFF); // n=2: OFF
    assertEquals(0, data[16] & 0xFF); // n=3: OFF
    assertEquals(255, data[20] & 0xFF); // n=4: ON

    // 2. Countdown at 4.0s -> onCount = 2 -> n=3, 4 should be ON
    reset(protocol);
    setupMocks();
    helper.resetCache();
    helper.setRaceState(
        com.antigravity.proto.RaceState.STARTING, com.antigravity.proto.RaceFlag.RED, 4.0);

    verify(protocol, atLeastOnce()).writeData(captor.capture());
    data = captor.getValue();
    assertEquals(5, data[2]);

    assertEquals(0, data[4] & 0xFF); // n=0: OFF
    assertEquals(0, data[8] & 0xFF); // n=1: OFF
    assertEquals(0, data[12] & 0xFF); // n=2: OFF
    assertEquals(255, data[16] & 0xFF); // n=3: ON
    assertEquals(255, data[20] & 0xFF); // n=4: ON

    // 3. Countdown at 1.0s -> onCount = 5 -> all n=0..4 should be ON
    reset(protocol);
    setupMocks();
    helper.resetCache();
    helper.setRaceState(
        com.antigravity.proto.RaceState.STARTING, com.antigravity.proto.RaceFlag.RED, 1.0);

    verify(protocol, atLeastOnce()).writeData(captor.capture());
    data = captor.getValue();
    assertEquals(5, data[2]);

    assertEquals(255, data[4] & 0xFF); // n=0: ON
    assertEquals(255, data[8] & 0xFF); // n=1: ON
    assertEquals(255, data[12] & 0xFF); // n=2: ON
    assertEquals(255, data[16] & 0xFF); // n=3: ON
    assertEquals(255, data[20] & 0xFF); // n=4: ON
  }

  @Test
  public void testSetRaceState_Starting_ZeroInitialCountdown() {
    LedString ledString = new LedString();
    ledString.pin = 2;
    int base = RgbLedBehavior.RGB_LED_BEHAVIOR_RACE_STATE_BASE_VALUE;
    // 5 LEDs configured (n=0..4)
    ledString.leds = Arrays.asList(base, base + 1, base + 2, base + 3, base + 4);
    config.ledStrings = Collections.singletonList(ledString);

    ArgumentCaptor<byte[]> captor = ArgumentCaptor.forClass(byte[].class);
    when(protocol.getMaxBufferSize()).thenReturn(128);

    // 1. Initially transition to STARTING with countdown = 0.0
    helper.setRaceState(
        com.antigravity.proto.RaceState.STARTING, com.antigravity.proto.RaceFlag.RED, 0.0);

    verify(protocol, atLeastOnce()).writeData(captor.capture());
    byte[] data = captor.getValue();
    assertEquals(5, data[2]);

    // Since startingDuration is 0, no LEDs should be ON
    for (int i = 0; i < 5; i++) {
      assertEquals(0, data[4 + i * 4] & 0xFF);
    }

    // 2. Countdown updates to 5.0s (while remaining in STARTING state)
    reset(protocol);
    setupMocks();
    helper.resetCache();
    helper.setRaceState(
        com.antigravity.proto.RaceState.STARTING, com.antigravity.proto.RaceFlag.RED, 5.0);

    verify(protocol, atLeastOnce()).writeData(captor.capture());
    data = captor.getValue();
    assertEquals(5, data[2]);

    // Now startingDuration should be Math.max(0, 5) = 5.
    // At 5.0s remaining, only n=4 (Race State 5) should be ON
    assertEquals(0, data[4] & 0xFF); // n=0: OFF
    assertEquals(0, data[8] & 0xFF); // n=1: OFF
    assertEquals(0, data[12] & 0xFF); // n=2: OFF
    assertEquals(0, data[16] & 0xFF); // n=3: OFF
    assertEquals(255, data[20] & 0xFF); // n=4: ON
  }

  @Test
  public void testLane6Refueling() {
    LedString ledString = new LedString();
    ledString.pin = 2;
    int refuelingL6 = RgbLedBehavior.RGB_LED_BEHAVIOR_REFUELING_BASE_VALUE + 5;
    ledString.leds = Collections.singletonList(refuelingL6);
    // Explicitly provide 6 color mappings
    ledString.ledLaneColorOverrides =
        Arrays.asList("#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#00FFFF", "#FF00FF");
    config.ledStrings = Collections.singletonList(ledString);

    ArgumentCaptor<byte[]> captor = ArgumentCaptor.forClass(byte[].class);
    when(protocol.getMaxBufferSize()).thenReturn(128);

    // Case 1: Refueling is TRUE for Lane 6 (index 5)
    helper.setRefueling(5, true);
    verify(protocol, atLeastOnce()).writeData(captor.capture());
    byte[] data = captor.getValue();
    assertEquals(0x4C, data[0]);
    assertEquals(1, data[2]); // 1 LED update
    assertEquals(0, data[3]); // Index 0 in the string
    assertEquals((byte) 0xFF, data[4]); // R=FF
    assertEquals(0, data[5] & 0xFF); // G=00
    assertEquals((byte) 0xFF, data[6]); // B=FF (Color #FF00FF for index 5)

    // Case 2: Refueling is FALSE for Lane 6 (index 5)
    reset(protocol);
    when(protocol.isOpen()).thenReturn(true);
    when(protocol.getMaxBufferSize()).thenReturn(128);
    when(protocol.getConfig()).thenReturn(config);
    helper.setRefueling(5, false);
    verify(protocol, atLeastOnce()).writeData(captor.capture());
    data = captor.getValue();
    assertEquals(0, data[4] & 0xFF); // R=0
    assertEquals(0, data[5] & 0xFF); // G=0
    assertEquals(0, data[6] & 0xFF); // B=0
  }

  @Test
  public void testLane6RefuelingFallbackToWhite() {
    LedString ledString = new LedString();
    ledString.pin = 2;
    int refuelingL6 = RgbLedBehavior.RGB_LED_BEHAVIOR_REFUELING_BASE_VALUE + 5;
    ledString.leds = Collections.singletonList(refuelingL6);
    // Provide ONLY 2 color mappings (insufficient for Lane 6)
    ledString.ledLaneColorOverrides = Arrays.asList("#FF0000", "#00FF00");
    config.ledStrings = Collections.singletonList(ledString);

    ArgumentCaptor<byte[]> captor = ArgumentCaptor.forClass(byte[].class);
    when(protocol.getMaxBufferSize()).thenReturn(128);

    // Refueling is TRUE for Lane 6 (index 5)
    helper.setRefueling(5, true);
    verify(protocol, atLeastOnce()).writeData(captor.capture());
    byte[] data = captor.getValue();

    // Should fallback to track color #FF00FF (255, 0, 255) because overrides are missing
    assertEquals(255, data[4] & 0xFF);
    assertEquals(0, data[5] & 0xFF);
    assertEquals(255, data[6] & 0xFF);
  }

  @Test
  public void testLane6RefuelingFallbackToTrackColor() {
    LedString ledString = new LedString();
    ledString.pin = 2;
    int refuelingL6 = RgbLedBehavior.RGB_LED_BEHAVIOR_REFUELING_BASE_VALUE + 5;
    ledString.leds = Collections.singletonList(refuelingL6);
    // Provide ONLY 2 color mappings (insufficient for Lane 6)
    ledString.ledLaneColorOverrides = Arrays.asList("#FF0000", "#00FF00");
    config.ledStrings = Collections.singletonList(ledString);

    // Track colors are: ["#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#00FFFF", "#FF00FF"]
    // Lane 6 (index 5) is #FF00FF (Pink: 255, 0, 255)

    ArgumentCaptor<byte[]> captor = ArgumentCaptor.forClass(byte[].class);
    when(protocol.getMaxBufferSize()).thenReturn(128);

    // Refueling is TRUE for Lane 6 (index 5)
    helper.setRefueling(5, true);
    verify(protocol, atLeastOnce()).writeData(captor.capture());
    byte[] data = captor.getValue();

    // Should fallback to track color #FF00FF (255, 0, 255)
    assertEquals(255, data[4] & 0xFF);
    assertEquals(0, data[5] & 0xFF);
    assertEquals(255, data[6] & 0xFF);
  }

  @Test
  public void testSetRaceState_Countdown_ShortDuration() {
    LedString ledString = new LedString();
    ledString.pin = 2;
    int base = RgbLedBehavior.RGB_LED_BEHAVIOR_COUNTDOWN_BASE_VALUE;
    // Configure 5 LEDs (n=0, 1, 2, 3, 4)
    ledString.leds = Arrays.asList(base, base + 1, base + 2, base + 3, base + 4);
    config.ledStrings = Collections.singletonList(ledString);

    ArgumentCaptor<byte[]> captor = ArgumentCaptor.forClass(byte[].class);
    when(protocol.getMaxBufferSize()).thenReturn(128);

    // Start with 3.0s countdown. onCount = 3 - 3 + 1 = 1.
    helper.setRaceState(
        com.antigravity.proto.RaceState.STARTING, com.antigravity.proto.RaceFlag.RED, 3.0);
    verify(protocol, atLeastOnce()).writeData(captor.capture());
    byte[] data = captor.getValue();

    // ceil(3.0) = 3. onCount = 1. n < 1 ON. n=0 is ON.
    int onCount3 = 0;
    for (int i = 0; i < 5; i++) {
      if (data[4 + i * 4] == (byte) 255) onCount3++;
    }
    assertEquals(1, onCount3);

    // Now go to 1.0s. onCount = 3 - 1 + 1 = 3.
    reset(protocol);
    setupMocks();
    helper.resetCache();
    helper.setRaceState(
        com.antigravity.proto.RaceState.STARTING, com.antigravity.proto.RaceFlag.RED, 1.0);
    verify(protocol, atLeastOnce()).writeData(captor.capture());
    data = captor.getValue();

    // ceil(1.0) = 1. onCount = 3. n < 3 ON. n=0, 1, 2 are ON.
    int onCount1 = 0;
    for (int i = 0; i < 5; i++) {
      if (data[4 + i * 4] == (byte) 255) onCount1++;
    }
    assertEquals(3, onCount1);

    // Now go to 0.0s. onCount = 3 - 0 + 1 = 4.
    reset(protocol);
    setupMocks();
    helper.resetCache();
    helper.setRaceState(
        com.antigravity.proto.RaceState.STARTING, com.antigravity.proto.RaceFlag.RED, 0.0);
    verify(protocol, atLeastOnce()).writeData(captor.capture());
    data = captor.getValue();

    // ceil(0.0) = 0. onCount = 4. n >= -1 and n < 3 -> n=0, 1, 2 are ON.
    int onCount0 = 0;
    for (int i = 0; i < 5; i++) {
      if (data[4 + i * 4] == (byte) 255) onCount0++;
    }
    assertEquals(3, onCount0);
  }

  @Test
  public void testSetRaceState_Countdown_Green_MoreLedsThanSeconds() {
    LedString ledString = new LedString();
    ledString.pin = 2;
    int base = RgbLedBehavior.RGB_LED_BEHAVIOR_COUNTDOWN_BASE_VALUE;
    // 5 LEDs defined (n=0..4)
    ledString.leds = Arrays.asList(base, base + 1, base + 2, base + 3, base + 4);
    config.ledStrings = Collections.singletonList(ledString);

    ArgumentCaptor<byte[]> captor = ArgumentCaptor.forClass(byte[].class);
    when(protocol.getMaxBufferSize()).thenReturn(128);

    // 1. Initial 3s countdown
    helper.setRaceState(
        com.antigravity.proto.RaceState.STARTING, com.antigravity.proto.RaceFlag.RED, 3.0);

    // 2. Transition to RACING/GREEN
    reset(protocol);
    setupMocks();
    helper.setRaceState(
        com.antigravity.proto.RaceState.RACING, com.antigravity.proto.RaceFlag.GREEN, 0.0);

    verify(protocol, atLeastOnce()).writeData(captor.capture());
    byte[] data = captor.getValue();

    // The packet should contain 3 LEDs (n=0, 1, 2)
    int numInPacket = data[2] & 0xFF;
    assertEquals(3, numInPacket);

    // Verify all 3 in the packet are green (G=255)
    for (int i = 0; i < numInPacket; i++) {
      assertEquals(255, data[5 + i * 4] & 0xFF);
    }
  }

  @Test
  public void testSetRaceState_Countdown_Green_FewerLedsThanSeconds() {
    LedString ledString = new LedString();
    ledString.pin = 2;
    int base = RgbLedBehavior.RGB_LED_BEHAVIOR_COUNTDOWN_BASE_VALUE;
    // 3 LEDs defined (n=0..2)
    ledString.leds = Arrays.asList(base, base + 1, base + 2);
    config.ledStrings = Collections.singletonList(ledString);

    ArgumentCaptor<byte[]> captor = ArgumentCaptor.forClass(byte[].class);
    when(protocol.getMaxBufferSize()).thenReturn(128);

    // 1. Initial 5s countdown
    helper.setRaceState(
        com.antigravity.proto.RaceState.STARTING, com.antigravity.proto.RaceFlag.RED, 5.0);

    // 2. Transition to RACING/GREEN
    reset(protocol);
    setupMocks();
    helper.setRaceState(
        com.antigravity.proto.RaceState.RACING, com.antigravity.proto.RaceFlag.GREEN, 0.0);

    verify(protocol, atLeastOnce()).writeData(captor.capture());
    byte[] data = captor.getValue();

    // All 3 LEDs should be in the packet and green (min of 3 defined and 5 seconds)
    int numInPacket = data[2] & 0xFF;
    assertEquals(3, numInPacket);

    for (int i = 0; i < numInPacket; i++) {
      assertEquals(255, data[5 + i * 4] & 0xFF);
    }
  }

  @Test
  public void testHeatProgress_CacheDesync_Fix() {
    // 1. Setup a Heat Progress LED
    LedString ledString = new LedString();
    ledString.pin = 2;
    ledString.leds = Collections.singletonList(RgbLedBehavior.RGB_LED_BEHAVIOR_HEAT_PROGRESS_VALUE);
    ledString.addressableLeds = 1;
    config.ledStrings = Collections.singletonList(ledString);

    // Initial state: serial open but version not verified (protocol.isOpen() is false)
    when(protocol.isOpen()).thenReturn(false);
    when(protocol.getMaxBufferSize()).thenReturn(128);

    // 2. Call setHeatProgress.
    // This should NOT call writeData because protocol is not open.
    helper.setHeatProgress(0.0);
    verify(protocol, never()).writeData(any(byte[].class));

    // 3. Call setHeatProgress again with SAME percentage.
    // If the cache was correctly NOT updated, it should send the data AGAIN.
    reset(protocol);
    when(protocol.isOpen()).thenReturn(false);
    when(protocol.getMaxBufferSize()).thenReturn(128);
    when(protocol.getConfig()).thenReturn(config);

    helper.setHeatProgress(0.0);
    verify(protocol, never()).writeData(any(byte[].class));

    // 4. Now "initialize" the pin by calling sendRgbLedMode
    helper.sendRgbLedMode();
    reset(protocol);
    when(protocol.isOpen()).thenReturn(true);
    when(protocol.getMaxBufferSize()).thenReturn(128);
    when(protocol.getConfig()).thenReturn(config);

    // 5. Call setHeatProgress again. Now the cache should be updated.
    helper.setHeatProgress(0.0);
    verify(protocol, atLeastOnce()).writeData(any(byte[].class));

    // 6. Call setHeatProgress one more time with SAME percentage.
    // This time it should NOT send anything because the cache is now locked in.
    reset(protocol);
    when(protocol.isOpen()).thenReturn(true);
    when(protocol.getMaxBufferSize()).thenReturn(128);
    when(protocol.getConfig()).thenReturn(config);

    helper.setHeatProgress(0.0);
    verify(protocol, never()).writeData(any(byte[].class));
  }

  @Test
  public void testSendRgbLedMode_TriggersThermometerRefresh() {
    // 1. Setup a Heat Progress LED
    LedString ledString = new LedString();
    ledString.pin = 2;
    ledString.leds = Collections.singletonList(RgbLedBehavior.RGB_LED_BEHAVIOR_HEAT_PROGRESS_VALUE);
    ledString.addressableLeds = 1;
    ledString.brightness = 100;
    config.ledStrings = new ArrayList<>(Collections.singletonList(ledString));

    // Initialize pin
    helper.sendRgbLedMode();
    reset(protocol);
    when(protocol.isOpen()).thenReturn(true);
    when(protocol.getMaxBufferSize()).thenReturn(128);
    when(protocol.getConfig()).thenReturn(config);

    // 2. Set progress to 0.5 (Yellow-ish)
    helper.setHeatProgress(0.5);
    verify(protocol, atLeastOnce()).writeData(any(byte[].class));

    // 3. Change config (e.g. brightness) to trigger sendRgbLedMode again
    ledString.brightness = 200;
    reset(protocol);
    when(protocol.isOpen()).thenReturn(true);
    when(protocol.getMaxBufferSize()).thenReturn(128);
    when(protocol.getConfig()).thenReturn(config);

    helper.sendRgbLedMode();

    // 4. Verify that it sends both the MODE (0x6C) AND the LED update (0x4C)
    // because sendRgbLedMode should call refreshThermometers()
    ArgumentCaptor<byte[]> captor = ArgumentCaptor.forClass(byte[].class);
    verify(protocol, atLeast(2)).writeData(captor.capture());

    boolean foundMode = false;
    boolean foundLedUpdate = false;
    for (byte[] data : captor.getAllValues()) {
      if (data[0] == 0x6C) foundMode = true;
      if (data[0] == 0x4C) foundLedUpdate = true;
    }

    assertTrue("Should have sent RGB_LED_MODE", foundMode);
    assertTrue("Should have refreshed thermometer LEDs", foundLedUpdate);
  }
}
