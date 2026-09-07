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
  }
}
