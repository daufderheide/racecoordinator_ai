package com.antigravity.models;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import com.antigravity.proto.RaceFlag;
import java.util.HashMap;
import java.util.Map;
import org.junit.Test;

public class ThemeTest {

  @Test
  public void testResolveFlag_DefaultFlags() {
    Map<String, String> slots = new HashMap<>();
    slots.put("flag.racing", "default_flag_green");
    slots.put("flag.heat_paused", "default_flag_yellow");
    slots.put("flag.heat_over", "default_flag_red");
    slots.put("flag.race_over", "default_flag_checkered");
    slots.put("flag.one_lap_to_go", "default_flag_white");
    slots.put("flag.warmup", "default_flag_green_yellow");
    slots.put("flag.penalty", "default_flag_black");

    Theme theme = new Theme("Custom Theme", true, slots, null, "theme-1", "id-1");

    assertEquals(RaceFlag.GREEN, theme.resolveFlag("flag.racing", RaceFlag.RED));
    assertEquals(RaceFlag.YELLOW, theme.resolveFlag("flag.heat_paused", RaceFlag.RED));
    assertEquals(RaceFlag.RED, theme.resolveFlag("flag.heat_over", RaceFlag.GREEN));
    assertEquals(RaceFlag.CHECKERED, theme.resolveFlag("flag.race_over", RaceFlag.RED));
    assertEquals(RaceFlag.WHITE, theme.resolveFlag("flag.one_lap_to_go", RaceFlag.RED));
    assertEquals(RaceFlag.GREEN_YELLOW, theme.resolveFlag("flag.warmup", RaceFlag.RED));
    assertEquals(RaceFlag.BLACK, theme.resolveFlag("flag.penalty", RaceFlag.RED));
  }

  @Test
  public void testResolveFlag_SubstringVariations() {
    Map<String, String> slots = new HashMap<>();
    slots.put("slot.gy1", "flag_yellowgreen");
    slots.put("slot.gy2", "flag_yellow_green");
    slots.put("slot.gy3", "flag_greenyellow");
    slots.put("slot.chk", "my_custom_checker_flag");
    slots.put("slot.green", "vibrant_green_asset");
    slots.put("slot.red", "dark_red_banner");
    slots.put("slot.yellow", "caution_yellow_flag");
    slots.put("slot.white", "pure_white");
    slots.put("slot.black", "meatball_black_flag");

    Theme theme = new Theme("Variation Theme", false, slots, null, "theme-2", "id-2");

    assertEquals(RaceFlag.GREEN_YELLOW, theme.resolveFlag("slot.gy1", RaceFlag.RED));
    assertEquals(RaceFlag.GREEN_YELLOW, theme.resolveFlag("slot.gy2", RaceFlag.RED));
    assertEquals(RaceFlag.GREEN_YELLOW, theme.resolveFlag("slot.gy3", RaceFlag.RED));
    assertEquals(RaceFlag.CHECKERED, theme.resolveFlag("slot.chk", RaceFlag.RED));
    assertEquals(RaceFlag.GREEN, theme.resolveFlag("slot.green", RaceFlag.RED));
    assertEquals(RaceFlag.RED, theme.resolveFlag("slot.red", RaceFlag.GREEN));
    assertEquals(RaceFlag.YELLOW, theme.resolveFlag("slot.yellow", RaceFlag.RED));
    assertEquals(RaceFlag.WHITE, theme.resolveFlag("slot.white", RaceFlag.RED));
    assertEquals(RaceFlag.BLACK, theme.resolveFlag("slot.black", RaceFlag.RED));
  }

  @Test
  public void testResolveFlag_FallbacksAndNulls() {
    Theme emptyTheme = new Theme("Empty Theme", false, null, null, "theme-3", "id-3");
    assertEquals(RaceFlag.RED, emptyTheme.resolveFlag("any.slot", RaceFlag.RED));
    assertEquals(RaceFlag.GREEN, emptyTheme.resolveFlag(null, RaceFlag.GREEN));

    Map<String, String> slots = new HashMap<>();
    slots.put("slot.empty", "");
    slots.put("slot.unknown", "unknown_asset_without_color");
    Theme theme = new Theme("Fallback Theme", false, slots, null, "theme-4", "id-4");

    assertEquals(RaceFlag.YELLOW, theme.resolveFlag("slot.missing", RaceFlag.YELLOW));
    assertEquals(RaceFlag.WHITE, theme.resolveFlag("slot.empty", RaceFlag.WHITE));
    assertEquals(RaceFlag.CHECKERED, theme.resolveFlag("slot.unknown", RaceFlag.CHECKERED));
  }

  @Test
  public void testGetters() {
    Map<String, String> slots = new HashMap<>();
    slots.put("slot1", "asset1");
    Map<String, AudioConfig> audioSlots = new HashMap<>();
    audioSlots.put("audio1", new AudioConfig("sound", "sound.wav", null));

    Theme theme = new Theme("My Theme", true, slots, audioSlots, "entity-123", "id-123");

    assertEquals("My Theme", theme.getName());
    assertTrue(theme.isDefault());
    assertEquals(1, theme.getSlots().size());
    assertEquals(1, theme.getAudioSlots().size());
    assertEquals("entity-123", theme.getEntityId());
    assertEquals("id-123", theme.getId());

    Theme themeNoId = new Theme("Other", false, null, null, null, null);
    assertFalse(themeNoId.isDefault());
    assertNotNull(themeNoId.getSlots());
    assertNotNull(themeNoId.getAudioSlots());
  }

  @Test
  public void testResolveFlag_DatabaseLookup() throws Exception {
    java.io.File tempDir =
        new java.io.File(
            System.getProperty("java.io.tmpdir"), "theme_test_" + System.currentTimeMillis());
    tempDir.mkdirs();
    String rootDir = tempDir.getAbsolutePath() + java.io.File.separator;
    com.antigravity.context.DatabaseContext dbCtx =
        new com.antigravity.context.DatabaseContext("test_db", null, rootDir);

    try {
      dbCtx.ensureTable("assets");
      String insertSql = "INSERT INTO assets (entity_id, json_data) VALUES (?, ?)";
      try (java.sql.PreparedStatement pstmt = dbCtx.getConnection().prepareStatement(insertSql)) {
        pstmt.setString(1, "custom-asset-uuid-1");
        pstmt.setString(
            2, "{\"name\":\"custom_checker_pattern.png\",\"url\":\"/assets/custom_chk.png\"}");
        pstmt.executeUpdate();
      }

      try (java.sql.PreparedStatement pstmt = dbCtx.getConnection().prepareStatement(insertSql)) {
        pstmt.setString(1, "custom-asset-uuid-2");
        pstmt.setString(2, "{\"name\":\"other.png\",\"url\":\"/assets/yellow_caution.png\"}");
        pstmt.executeUpdate();
      }

      Map<String, String> slots = new HashMap<>();
      slots.put("flag.heat_paused", "custom-asset-uuid-1");
      slots.put("flag.racing", "custom-asset-uuid-2");
      slots.put("flag.not_found", "non-existent-uuid");

      Theme theme = new Theme("Custom DB Theme", false, slots, null, "theme-db", "id-db");

      // Resolves to CHECKERED based on asset name in DB
      assertEquals(
          RaceFlag.CHECKERED, theme.resolveFlag("flag.heat_paused", RaceFlag.YELLOW, dbCtx));
      // Resolves to YELLOW based on asset url in DB
      assertEquals(RaceFlag.YELLOW, theme.resolveFlag("flag.racing", RaceFlag.GREEN, dbCtx));
      // Falls back if asset not in DB
      assertEquals(RaceFlag.RED, theme.resolveFlag("flag.not_found", RaceFlag.RED, dbCtx));
    } finally {
      if (dbCtx.getConnection() != null) {
        dbCtx.getConnection().close();
      }
      tempDir.delete();
    }
  }
}
