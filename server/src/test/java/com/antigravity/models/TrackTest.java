package com.antigravity.models;

import static org.junit.Assert.assertEquals;

import com.antigravity.proto.RgbLedBehavior;
import com.antigravity.protocols.arduino.ArduinoConfig;
import com.antigravity.protocols.arduino.LedString;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import org.junit.Test;

public class TrackTest {

  @Test
  public void testSyncWithLanes_HealsColorsAndCleanupsBehaviors() {
    // 1. Initial State: 2 Lanes (Red and Green)
    Lane lane1 = new Lane("#FF0000", "#FFFFFF", 10);
    Lane lane2 = new Lane("#00FF00", "#FFFFFF", 10);
    List<Lane> lanes = Arrays.asList(lane1, lane2);

    // Initial LED String with behavior for Lane 1 and 2
    LedString ls = new LedString();
    ls.pin = 5;
    ls.leds =
        new ArrayList<>(
            Arrays.asList(
                RgbLedBehavior.RGB_LED_BEHAVIOR_REFUELING_BASE_VALUE + 0, // Lane 1 refueling
                RgbLedBehavior.RGB_LED_BEHAVIOR_REFUELING_BASE_VALUE + 1 // Lane 2 refueling
                ));
    ls.ledLaneColorOverrides = new ArrayList<>(Arrays.asList("#FF0000", "#00FF00"));

    ArduinoConfig config = new ArduinoConfig();
    config.ledStrings = Collections.singletonList(ls);

    Track track =
        new Track.Builder()
            .name("Test Track")
            .lanes(lanes)
            .arduinoConfigs(Collections.singletonList(config))
            .entityId("test-id")
            .id(null)
            .build();

    // 2. ACTION: Remove Lane 2 (Green) and change Lane 1 color to Blue
    Lane lane1Blue = new Lane("#0000FF", "#FFFFFF", 10);
    Track updatedTrack =
        new Track.Builder()
            .name(track.getName())
            .lanes(Collections.singletonList(lane1Blue))
            .arduinoConfigs(track.getArduinoConfigs())
            .entityId(track.getEntityId())
            .id(track.getId())
            .build();

    // 3. EXECUTE SYNC
    Track syncedTrack = updatedTrack.syncWithLanes();

    // 4. VERIFY
    ArduinoConfig syncedConfig = syncedTrack.getArduinoConfigs().get(0);
    LedString syncedLs = syncedConfig.ledStrings.get(0);

    // Verify Lane 2 behavior is reset to UNUSED because it only has 1 lane now
    assertEquals(2, syncedLs.leds.size());
    assertEquals(
        RgbLedBehavior.RGB_LED_BEHAVIOR_REFUELING_BASE_VALUE + 0, (int) syncedLs.leds.get(0));
    assertEquals(RgbLedBehavior.RGB_LED_BEHAVIOR_UNUSED_VALUE, (int) syncedLs.leds.get(1));

    // Verify overrides list is trimmed to 1
    assertEquals(1, syncedLs.ledLaneColorOverrides.size());

    // Verify Lane 1 color is healed to Blue
    assertEquals("#0000FF", syncedLs.ledLaneColorOverrides.get(0));
  }

  @Test
  public void testSyncWithLanes_ComprehensiveBehaviorCleanup() {
    // This test ensures that ALL lane-based behavior types are correctly handled.
    // If we add a new lane-based behavior in the future, it should be added to the list below.
    int[] laneBases = {
      RgbLedBehavior.RGB_LED_BEHAVIOR_HEAT_LEADER_BASE_VALUE,
      RgbLedBehavior.RGB_LED_BEHAVIOR_FUEL_LEVEL_BASE_VALUE,
      RgbLedBehavior.RGB_LED_BEHAVIOR_REFUELING_BASE_VALUE,
      RgbLedBehavior.RGB_LED_BEHAVIOR_LAP_INDICATOR_BASE_VALUE,
      RgbLedBehavior.RGB_LED_BEHAVIOR_LAP_SENSOR_BASE_VALUE
    };

    // 1. Setup: 1 Lane
    Lane lane1 = new Lane("#FF0000", "#FFFFFF", 10);
    List<Lane> lanes = Collections.singletonList(lane1);

    // Create a string with TWO LEDs for each base:
    // - One for Lane 1 (index 0) -> Should stay
    // - One for Lane 2 (index 1) -> Should be cleaned up (0)
    List<Integer> behaviors = new ArrayList<>();
    for (int base : laneBases) {
      behaviors.add(base + 0); // Lane 1
      behaviors.add(base + 1); // Lane 2 (stale)
    }

    // Add some NON-lane behaviors that should NEVER be cleaned up
    behaviors.add(RgbLedBehavior.RGB_LED_BEHAVIOR_RACE_STATE_BASE_VALUE + 2); // Race state
    behaviors.add(RgbLedBehavior.RGB_LED_BEHAVIOR_COUNTDOWN_BASE_VALUE + 3); // Countdown
    behaviors.add(RgbLedBehavior.RGB_LED_BEHAVIOR_HEAT_PROGRESS_VALUE);

    LedString ls =
        new LedString(1, behaviors, 255, 0, 0, 5.0, Collections.singletonList("#FF0000"));
    ArduinoConfig config =
        new ArduinoConfig(
            "Test",
            "COM1",
            115200,
            1000,
            1,
            true,
            true,
            0,
            false,
            true,
            ArduinoConfig.LapPinPitBehavior.PIT_IN_OUT,
            new ArrayList<>(Collections.nCopies(60, 0)),
            new ArrayList<>(Collections.nCopies(16, 0)),
            Collections.singletonList(ls),
            new HashMap<>());

    Track track =
        new Track.Builder()
            .name("Test")
            .lanes(lanes)
            .arduinoConfigs(Collections.singletonList(config))
            .entityId("t1")
            .id(new org.bson.types.ObjectId())
            .build();

    // 2. EXECUTE
    Track syncedTrack = track.syncWithLanes();
    LedString syncedLs = syncedTrack.getArduinoConfigs().get(0).ledStrings.get(0);

    // 3. VERIFY
    int idx = 0;
    for (int base : laneBases) {
      assertEquals(
          "Base " + base + " for Lane 1 should be preserved",
          base + 0,
          (int) syncedLs.leds.get(idx++));
      assertEquals(
          "Base " + base + " for Lane 2 (missing) should be UNUSED",
          0,
          (int) syncedLs.leds.get(idx++));
    }

    // Verify non-lane behaviors are untouched
    assertEquals(
        RgbLedBehavior.RGB_LED_BEHAVIOR_RACE_STATE_BASE_VALUE + 2, (int) syncedLs.leds.get(idx++));
    assertEquals(
        RgbLedBehavior.RGB_LED_BEHAVIOR_COUNTDOWN_BASE_VALUE + 3, (int) syncedLs.leds.get(idx++));
    assertEquals(
        RgbLedBehavior.RGB_LED_BEHAVIOR_HEAT_PROGRESS_VALUE, (int) syncedLs.leds.get(idx++));
  }

  @Test
  public void testSyncWithLanes_AddingLanes() {
    // 1. Initial State: 1 Lane
    Lane lane1 = new Lane("#FF0000", "#FFFFFF", 10);

    LedString ls = new LedString();
    ls.ledLaneColorOverrides = new ArrayList<>(Collections.singletonList("#FF0000"));
    ls.leds =
        new ArrayList<>(Collections.singletonList(RgbLedBehavior.RGB_LED_BEHAVIOR_UNUSED_VALUE));

    ArduinoConfig config = new ArduinoConfig();
    config.ledStrings = Collections.singletonList(ls);

    Track track =
        new Track.Builder()
            .name("Test Track")
            .lanes(Collections.singletonList(lane1))
            .arduinoConfigs(Collections.singletonList(config))
            .entityId("id")
            .id(null)
            .build();

    // 2. ACTION: Add Lane 2 (Yellow)
    Lane lane2 = new Lane("#FFFF00", "#FFFFFF", 10);
    Track updatedTrack =
        new Track.Builder()
            .name(track.getName())
            .lanes(Arrays.asList(lane1, lane2))
            .arduinoConfigs(track.getArduinoConfigs())
            .entityId(track.getEntityId())
            .id(track.getId())
            .build();

    // 3. EXECUTE SYNC
    Track syncedTrack = updatedTrack.syncWithLanes();

    // 4. VERIFY
    LedString syncedLs = syncedTrack.getArduinoConfigs().get(0).ledStrings.get(0);
    assertEquals(2, syncedLs.ledLaneColorOverrides.size());
    assertEquals("#FF0000", syncedLs.ledLaneColorOverrides.get(0));
    assertEquals(
        "#FFFF00", syncedLs.ledLaneColorOverrides.get(1)); // Auto-populated with Lane 2 color
  }

  @Test
  public void testTrackBuilder_WithTrackmateConfig() {
    com.antigravity.protocols.trackmate.TrackmateConfig tmConfig =
        new com.antigravity.protocols.trackmate.TrackmateConfig();
    tmConfig.name = "My TM";
    tmConfig.commPort = "COM5";

    Track track =
        new Track.Builder()
            .name("TM Track")
            .trackmateConfigs(Collections.singletonList(tmConfig))
            .build();

    assertEquals("TM Track", track.getName());
    assertEquals(1, track.getTrackmateConfigs().size());
    assertEquals("My TM", track.getTrackmateConfigs().get(0).name);
    assertEquals("COM5", track.getTrackmateConfigs().get(0).commPort);
  }
}
