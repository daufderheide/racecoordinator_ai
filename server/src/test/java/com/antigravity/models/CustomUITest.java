package com.antigravity.models;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
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
    assertEquals("driver_station_ui_layout_rc_ai", CustomUI.DRIVER_STATION_UI_ID);

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
    assertTrue(fuelUi.getColumnWidthsJson().contains("\"gap\":310"));
    assertTrue(fuelUi.getLayoutJson().contains("widget-lane-view"));

    CustomUI driverStationUi = CustomUI.createDriverStation();
    assertTrue(driverStationUi.isDefault());
    assertEquals("RaceCoordinator AI (Driver Station)", driverStationUi.getName());
    assertEquals(CustomUI.DRIVER_STATION_UI_ID, driverStationUi.getEntityId());
    assertTrue(driverStationUi.getLayoutJson().contains("widget-ds-progress"));
    assertTrue(driverStationUi.getLayoutJson().contains("widget-ds-nickname"));
    assertTrue(driverStationUi.getLayoutJson().contains("widget-ds-lane-number"));
    assertTrue(driverStationUi.getLayoutJson().contains("widget-ds-rank-heat"));
    assertTrue(driverStationUi.getLayoutJson().contains("widget-ds-rank-overall"));
    assertTrue(driverStationUi.getLayoutJson().contains("widget-ds-lap-count"));
    assertTrue(driverStationUi.getLayoutJson().contains("widget-ds-last-lap-time"));
    assertTrue(driverStationUi.getLayoutJson().contains("widget-ds-gap-leader"));
    assertTrue(driverStationUi.getLayoutJson().contains("widget-ds-best-lap-time"));
    assertTrue(driverStationUi.getLayoutJson().contains("widget-ds-flag"));
    assertTrue(driverStationUi.getLayoutJson().contains("widget-ds-fuel"));
    assertTrue(driverStationUi.getLayoutJson().contains("\"lapDecimalPlaces\":0"));
    assertTrue(driverStationUi.getLayoutJson().contains("\"customLabel\":\"GAP LEADER\""));
    assertTrue(driverStationUi.getLayoutJson().contains("\"baseWidth\":1080"));
    assertTrue(driverStationUi.getLayoutJson().contains("\"baseHeight\":1920"));
    assertTrue(driverStationUi.getLayoutJson().contains("\"aspectRatio\":\"9:16\""));
    assertTrue(driverStationUi.getLayoutJson().contains("\"scaleMode\":\"stretch\""));
    assertTrue(driverStationUi.getLayoutJson().contains("\"useLaneColors\":true"));

    assertTrue(defaultUi.getLayoutJson().contains("widget-countdown"));
    assertTrue(defaultUi.getLayoutJson().contains("\"glowEffect\":true"));
    assertTrue(defaultUi.getLayoutJson().contains("\"glowOverlap\":30"));
    assertTrue(defaultUi.getLayoutJson().contains("\"glowRedOverlap\":30"));
    assertTrue(defaultUi.getLayoutJson().contains("\"glowGreenOverlap\":25"));
    assertTrue(practiceUi.getLayoutJson().contains("widget-countdown"));
    assertTrue(practiceUi.getLayoutJson().contains("\"glowEffect\":true"));
    assertTrue(practiceUi.getLayoutJson().contains("\"glowOverlap\":30"));
    assertTrue(practiceUi.getLayoutJson().contains("\"glowRedOverlap\":30"));
    assertTrue(practiceUi.getLayoutJson().contains("\"glowGreenOverlap\":25"));
    assertTrue(fuelUi.getLayoutJson().contains("widget-countdown"));
    assertTrue(fuelUi.getLayoutJson().contains("\"glowEffect\":true"));
    assertTrue(fuelUi.getLayoutJson().contains("\"glowOverlap\":30"));
    assertTrue(fuelUi.getLayoutJson().contains("\"glowRedOverlap\":30"));
    assertTrue(fuelUi.getLayoutJson().contains("\"glowGreenOverlap\":25"));

    assertTrue(defaultUi.getLayoutJson().contains("\"baseWidth\":1920"));
    assertTrue(defaultUi.getLayoutJson().contains("\"baseHeight\":1080"));
    assertTrue(defaultUi.getLayoutJson().contains("\"aspectRatio\":\"16:9\""));
    assertTrue(defaultUi.getLayoutJson().contains("\"scaleMode\":\"stretch\""));

    assertTrue(practiceUi.getLayoutJson().contains("\"baseWidth\":1920"));
    assertTrue(practiceUi.getLayoutJson().contains("\"baseHeight\":1080"));
    assertTrue(practiceUi.getLayoutJson().contains("\"aspectRatio\":\"16:9\""));
    assertTrue(practiceUi.getLayoutJson().contains("\"scaleMode\":\"stretch\""));

    assertTrue(fuelUi.getLayoutJson().contains("\"baseWidth\":1920"));
    assertTrue(fuelUi.getLayoutJson().contains("\"baseHeight\":1080"));
    assertTrue(fuelUi.getLayoutJson().contains("\"aspectRatio\":\"16:9\""));
    assertTrue(fuelUi.getLayoutJson().contains("\"scaleMode\":\"stretch\""));
  }

  @Test
  public void testEnsureAspectRatioAndDimensions() {
    String layoutWithCurrent =
        "{\"widgets\":[{\"id\":\"w1\",\"x\":10,\"y\":10,\"width\":100,\"height\":50}],\"aspectRatio\":\"current\"}";
    String fixedCurrent = CustomUI.ensureAspectRatioAndDimensions(layoutWithCurrent);
    assertTrue(fixedCurrent.contains("\"aspectRatio\":\"16:9\""));
    assertTrue(fixedCurrent.contains("\"baseWidth\":1920"));
    assertTrue(fixedCurrent.contains("\"baseHeight\":1080"));
    assertTrue(fixedCurrent.contains("\"scaleMode\":\"stretch\""));

    // Legacy practice layout on MacBook 1728x899
    String legacyMacBook =
        "{\"widgets\":[{\"id\":\"w1\",\"x\":100,\"y\":100,\"width\":200,\"height\":100}],\"baseWidth\":1728,\"baseHeight\":899}";
    String fixedMacBook = CustomUI.ensureAspectRatioAndDimensions(legacyMacBook);
    assertTrue(fixedMacBook.contains("\"baseWidth\":1920"));
    assertTrue(fixedMacBook.contains("\"baseHeight\":1080"));
    assertTrue(fixedMacBook.contains("\"aspectRatio\":\"16:9\""));
    assertTrue(fixedMacBook.contains("\"scaleMode\":\"stretch\""));
    assertTrue(fixedMacBook.contains("\"width\":222"));

    // Already 16:9 layout preserved
    String standard169 =
        "{\"widgets\":[],\"baseWidth\":1920,\"baseHeight\":1080,\"aspectRatio\":\"16:9\",\"scaleMode\":\"stretch\"}";
    assertEquals(standard169, CustomUI.ensureAspectRatioAndDimensions(standard169));

    // Null or invalid handled
    assertEquals(null, CustomUI.ensureAspectRatioAndDimensions(null));
    assertEquals("", CustomUI.ensureAspectRatioAndDimensions(""));
    assertEquals("not-json", CustomUI.ensureAspectRatioAndDimensions("not-json"));
  }

  @Test
  public void testEnsureCountdownWidget() {
    String layoutWithoutCountdown =
        "{\"widgets\":[{\"id\":\"w1\",\"widgetType\":\"timer\"}],\"baseWidth\":1920,\"baseHeight\":1080}";
    String backfilled = CustomUI.ensureCountdownWidget(layoutWithoutCountdown);
    assertFalse(backfilled.contains("widget-countdown"));
    assertFalse(backfilled.contains("\"widgetType\":\"countdown\""));
    assertEquals(layoutWithoutCountdown, backfilled);

    // Existing countdown widget without glowEffect backfills glowEffect, maxLamps, fadeIn and
    // glowOverlap
    String layoutWithOldCountdown =
        "{\"widgets\":[{\"id\":\"widget-countdown\",\"widgetType\":\"countdown\",\"customSettings\":{\"lampScale\":1.0,\"previewLampCount\":7}}]}";
    String backfilledExisting = CustomUI.ensureCountdownWidget(layoutWithOldCountdown);
    assertTrue(backfilledExisting.contains("\"maxLamps\":7"));
    assertTrue(backfilledExisting.contains("\"fadeIn\":true"));
    assertTrue(backfilledExisting.contains("\"glowEffect\":true"));
    assertTrue(backfilledExisting.contains("\"glowOverlap\":30"));
    assertTrue(backfilledExisting.contains("\"glowRedOverlap\":30"));
    assertTrue(backfilledExisting.contains("\"glowGreenOverlap\":25"));

    // Existing countdown widget with old default overlap (100) backfills to 30 and 25
    String layoutWithDefault100 =
        "{\"widgets\":[{\"id\":\"widget-countdown\",\"widgetType\":\"countdown\",\"customSettings\":{\"glowOverlap\":100,\"glowRedOverlap\":100,\"glowGreenOverlap\":100}}]}";
    String backfilled100 = CustomUI.ensureCountdownWidget(layoutWithDefault100);
    assertTrue(backfilled100.contains("\"glowOverlap\":30"));
    assertTrue(backfilled100.contains("\"glowRedOverlap\":30"));
    assertTrue(backfilled100.contains("\"glowGreenOverlap\":25"));

    // Existing countdown widget with custom overlap (e.g. 45 and 55) is preserved
    String layoutWithCustom =
        "{\"widgets\":[{\"id\":\"widget-countdown\",\"widgetType\":\"countdown\",\"customSettings\":{\"glowOverlap\":45,\"glowRedOverlap\":45,\"glowGreenOverlap\":55}}]}";
    String preservedCustom = CustomUI.ensureCountdownWidget(layoutWithCustom);
    assertTrue(preservedCustom.contains("\"glowOverlap\":45"));
    assertTrue(preservedCustom.contains("\"glowRedOverlap\":45"));
    assertTrue(preservedCustom.contains("\"glowGreenOverlap\":55"));

    // Calling again should not duplicate
    String alreadyPresent = CustomUI.ensureCountdownWidget(backfilledExisting);
    assertEquals(backfilledExisting, alreadyPresent);

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

    assertTrue(CustomUI.isLegacyDriverStationName(null));
    assertTrue(CustomUI.isLegacyDriverStationName(""));
    assertTrue(CustomUI.isLegacyDriverStationName("driver station"));
    assertTrue(CustomUI.isLegacyDriverStationName("driver station ui"));
    assertTrue(CustomUI.isLegacyDriverStationName("driver station layout"));
    assertTrue(CustomUI.isLegacyDriverStationName("default driver station ui layout"));
    assertFalse(CustomUI.isLegacyDriverStationName("Custom Leaderboard"));
  }

  @Test
  public void testHasLaneView() {
    assertFalse(CustomUI.hasLaneView(null));
    assertFalse(CustomUI.hasLaneView(""));
    assertFalse(CustomUI.hasLaneView("{\"widgets\":[{\"widgetType\":\"leaderboard\"}]}"));
    assertTrue(CustomUI.hasLaneView("{\"widgets\":[{\"widgetType\":\"lane-view\"}]}"));
    assertTrue(CustomUI.hasLaneView("{\"widgets\":[{\"widgetType\": \"lane-view\"}]}"));
    assertFalse(
        CustomUI.hasLaneView(
            "{\"preserveLegacyHeatView\":true,\"widgets\":[{\"widgetType\":\"lane-view\"}]}"));
    assertEquals(" (Pre-Migration Backup)", CustomUI.PRE_MIGRATION_BACKUP_SUFFIX);
  }

  @Test
  public void testEnsurePracticeTopRowCoordinates() {
    assertNull(CustomUI.ensurePracticeTopRowCoordinates(null));
    assertEquals("", CustomUI.ensurePracticeTopRowCoordinates(""));
    assertEquals("not json", CustomUI.ensurePracticeTopRowCoordinates("not json"));

    String input =
        "{\"widgets\":["
            + "{\"id\":\"widget-menu-bar\",\"widgetType\":\"menu-bar\",\"x\":0,\"y\":0,\"width\":1920,\"height\":55},"
            + "{\"id\":\"widget-timer\",\"widgetType\":\"timer\",\"x\":779,\"y\":49,\"width\":441,\"height\":112},"
            + "{\"id\":\"widget-qr\",\"widgetType\":\"qr\",\"x\":469,\"y\":50,\"width\":132,\"height\":111}"
            + "]}";

    String result = CustomUI.ensurePracticeTopRowCoordinates(input);
    assertTrue(result.contains("\"height\":38"));
    assertTrue(result.contains("\"y\":38"));
    assertTrue(result.contains("\"height\":111"));
    assertFalse(result.contains("\"y\":49"));
    assertFalse(result.contains("\"y\":50"));
  }
}
