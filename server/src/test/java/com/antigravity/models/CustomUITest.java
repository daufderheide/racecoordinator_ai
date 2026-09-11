package com.antigravity.models;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public class CustomUITest {

  @Test
  public void testCustomUIProperties() {
    CustomUI ui =
        new CustomUI(
            "Custom Layout",
            false,
            "[{\"type\":\"lane-view\"}]",
            "[\"col1\"]",
            "{\"col1\":[]}",
            "{\"col1\":true}",
            "{\"col1\":\"200px\"}",
            "{\"col1\":\"top\"}",
            "custom-ui-1",
            "db-id-1");

    assertEquals("Custom Layout", ui.getName());
    assertFalse(ui.isDefault());
    assertEquals("[{\"type\":\"lane-view\"}]", ui.getLayoutJson());
    assertEquals("[\"col1\"]", ui.getColumnsJson());
    assertEquals("{\"col1\":[]}", ui.getColumnLayoutsJson());
    assertEquals("{\"col1\":true}", ui.getColumnVisibilityJson());
    assertEquals("{\"col1\":\"200px\"}", ui.getColumnWidthsJson());
    assertEquals("{\"col1\":\"top\"}", ui.getColumnAnchorsJson());
    assertEquals("custom-ui-1", ui.getEntityId());
    assertEquals("db-id-1", ui.getId());
  }

  @Test
  public void testDefaultCustomUIConstants() {
    assertEquals("default_ui_layout_rc_ai", CustomUI.DEFAULT_UI_ID);
    assertEquals("practice_ui_layout_rc_ai", CustomUI.PRACTICE_UI_ID);
    assertEquals("default_fuel_ui_layout_rc_ai", CustomUI.FUEL_UI_ID);

    CustomUI defaultUi = CustomUI.createDefault();
    assertTrue(defaultUi.isDefault());
    assertEquals("RaceCoordinator AI", defaultUi.getName());
    assertEquals(CustomUI.DEFAULT_UI_ID, defaultUi.getEntityId());
    assertTrue(defaultUi.getColumnsJson().contains("averageLapTime"));
    assertTrue(defaultUi.getColumnsJson().contains("ghostPacingLeaderAvg"));
    assertTrue(defaultUi.getColumnWidthsJson().contains("\"ghostPacingLeaderAvg\":200"));
    assertTrue(defaultUi.getColumnWidthsJson().contains("\"averageLapTime\":310"));
    assertTrue(defaultUi.getLayoutJson().contains("widget-lane-view"));

    CustomUI practiceUi = CustomUI.createPractice();
    assertTrue(practiceUi.isDefault());
    assertEquals("RaceCoordinator AI (Practice)", practiceUi.getName());
    assertEquals(CustomUI.PRACTICE_UI_ID, practiceUi.getEntityId());

    CustomUI fuelUi = CustomUI.createFuel();
    assertTrue(fuelUi.isDefault());
    assertEquals("RaceCoordinator AI (Fuel)", fuelUi.getName());
    assertEquals(CustomUI.FUEL_UI_ID, fuelUi.getEntityId());
    assertTrue(fuelUi.getColumnsJson().contains("imageset_fuel-gauge-builtin"));
    assertTrue(fuelUi.getColumnWidthsJson().contains("\"imageset_fuel-gauge-builtin\":210"));
    assertTrue(fuelUi.getColumnWidthsJson().contains("\"lapCount\":210"));
    assertTrue(fuelUi.getColumnWidthsJson().contains("\"lastLapTime\":310"));
    assertTrue(fuelUi.getColumnWidthsJson().contains("\"gapLeader\":310"));
    assertTrue(fuelUi.getLayoutJson().contains("widget-lane-view"));

    assertTrue(defaultUi.getLayoutJson().contains("widget-countdown"));
    assertTrue(defaultUi.getLayoutJson().contains("\"glowEffect\":true"));
    assertTrue(defaultUi.getLayoutJson().contains("\"glowOverlap\":100"));
    assertTrue(defaultUi.getLayoutJson().contains("\"glowRedOverlap\":100"));
    assertTrue(defaultUi.getLayoutJson().contains("\"glowGreenOverlap\":100"));
    assertTrue(practiceUi.getLayoutJson().contains("widget-countdown"));
    assertTrue(practiceUi.getLayoutJson().contains("\"glowEffect\":true"));
    assertTrue(practiceUi.getLayoutJson().contains("\"glowOverlap\":100"));
    assertTrue(practiceUi.getLayoutJson().contains("\"glowRedOverlap\":100"));
    assertTrue(practiceUi.getLayoutJson().contains("\"glowGreenOverlap\":100"));
    assertTrue(fuelUi.getLayoutJson().contains("widget-countdown"));
    assertTrue(fuelUi.getLayoutJson().contains("\"glowEffect\":true"));
    assertTrue(fuelUi.getLayoutJson().contains("\"glowOverlap\":100"));
    assertTrue(fuelUi.getLayoutJson().contains("\"glowRedOverlap\":100"));
    assertTrue(fuelUi.getLayoutJson().contains("\"glowGreenOverlap\":100"));
  }

  @Test
  public void testEnsureCountdownWidget() {
    String layoutWithoutCountdown =
        "{\"widgets\":[{\"id\":\"w1\",\"widgetType\":\"timer\"}],\"baseWidth\":1920,\"baseHeight\":1080}";
    String backfilled = CustomUI.ensureCountdownWidget(layoutWithoutCountdown);
    assertTrue(backfilled.contains("widget-countdown"));
    assertTrue(backfilled.contains("\"widgetType\":\"countdown\""));
    assertTrue(backfilled.contains("\"orientation\":\"horizontal\""));
    assertTrue(backfilled.contains("\"glowEffect\":true"));
    assertTrue(backfilled.contains("\"glowOverlap\":100"));
    assertTrue(backfilled.contains("\"glowRedOverlap\":100"));
    assertTrue(backfilled.contains("\"glowGreenOverlap\":100"));

    // Existing countdown widget without glowEffect backfills glowEffect and glowOverlap
    String layoutWithOldCountdown =
        "{\"widgets\":[{\"id\":\"widget-countdown\",\"widgetType\":\"countdown\",\"customSettings\":{\"lampScale\":1.0}}]}";
    String backfilledExisting = CustomUI.ensureCountdownWidget(layoutWithOldCountdown);
    assertTrue(backfilledExisting.contains("\"glowEffect\":true"));
    assertTrue(backfilledExisting.contains("\"glowOverlap\":100"));
    assertTrue(backfilledExisting.contains("\"glowRedOverlap\":100"));
    assertTrue(backfilledExisting.contains("\"glowGreenOverlap\":100"));

    // Calling again should not duplicate
    String alreadyPresent = CustomUI.ensureCountdownWidget(backfilled);
    assertEquals(backfilled, alreadyPresent);

    // Null or invalid returns input
    assertEquals(null, CustomUI.ensureCountdownWidget(null));
    assertEquals("", CustomUI.ensureCountdownWidget(""));
    assertEquals("invalid json", CustomUI.ensureCountdownWidget("invalid json"));
  }

  @Test
  public void testWithLayoutJson() {
    CustomUI ui = CustomUI.createDefault();
    CustomUI updated = ui.withLayoutJson("{\"widgets\":[]}");
    assertEquals("{\"widgets\":[]}", updated.getLayoutJson());
    assertEquals(ui.getName(), updated.getName());
    assertEquals(ui.getEntityId(), updated.getEntityId());
  }

  @Test
  public void testLegacyNames() {
    assertTrue(CustomUI.isLegacyDefaultName(null));
    assertTrue(CustomUI.isLegacyDefaultName(""));
    assertTrue(CustomUI.isLegacyDefaultName("default"));
    assertTrue(CustomUI.isLegacyDefaultName("Default UI"));
    assertTrue(CustomUI.isLegacyDefaultName("default ui layout"));
    assertTrue(CustomUI.isLegacyDefaultName("raceday ui layout"));
    assertTrue(CustomUI.isLegacyDefaultName("RaceCoordinator AI"));
    assertTrue(CustomUI.isLegacyDefaultName("RaceCoordinator AI (Default)"));
    assertFalse(CustomUI.isLegacyDefaultName("Custom Leaderboard"));

    assertTrue(CustomUI.isLegacyPracticeName(null));
    assertTrue(CustomUI.isLegacyPracticeName(""));
    assertTrue(CustomUI.isLegacyPracticeName("practice"));
    assertTrue(CustomUI.isLegacyPracticeName("Practice UI"));
    assertTrue(CustomUI.isLegacyPracticeName("Practice UI Layout"));
    assertTrue(CustomUI.isLegacyPracticeName("default practice ui layout"));
    assertFalse(CustomUI.isLegacyPracticeName("Custom Leaderboard"));

    assertTrue(CustomUI.isLegacyFuelName(null));
    assertTrue(CustomUI.isLegacyFuelName(""));
    assertTrue(CustomUI.isLegacyFuelName("fuel"));
    assertTrue(CustomUI.isLegacyFuelName("Fuel UI"));
    assertTrue(CustomUI.isLegacyFuelName("Fuel UI Layout"));
    assertTrue(CustomUI.isLegacyFuelName("default fuel ui layout"));
    assertFalse(CustomUI.isLegacyFuelName("Custom Leaderboard"));
  }
}
