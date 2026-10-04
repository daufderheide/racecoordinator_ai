package com.antigravity.importer.model;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

import com.antigravity.models.AudioConfig;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.HashMap;
import java.util.Map;
import org.junit.Test;

public class DriverImportRowTest {

  @Test
  public void testConstructorsAndGettersSetters() {
    DriverImportRow row = new DriverImportRow();
    assertEquals(0, row.getRowIndex());
    assertEquals("VALID", row.getStatus());
    assertEquals("NONE", row.getConflictType());
    assertEquals("SKIP", row.getSelectedResolution());
    assertEquals("system", row.getDefaultAudioMode());
    assertNotNull(row.getAudioSlots());

    row.setRowIndex(1);
    row.setRawName("Alice");
    row.setRawNickname("Ali");
    row.setResolvedName("Alice M");
    row.setResolvedNickname("Ali M");
    row.setAvatarUrl("avatar.png");
    row.setDefaultAudioMode("none");
    row.setStatus("CONFLICT");
    row.setConflictType("DUPLICATE_NAME");
    row.setMessage("Name exists");
    row.setSelectedResolution("AUTO_RENAME");
    row.setExistingDriverId("drv-123");

    Map<String, AudioConfig> audioSlots = new HashMap<>();
    audioSlots.put("lap", new AudioConfig("preset", "beep.wav", null));
    row.setAudioSlots(audioSlots);

    assertEquals(1, row.getRowIndex());
    assertEquals("Alice", row.getRawName());
    assertEquals("Ali", row.getRawNickname());
    assertEquals("Alice M", row.getResolvedName());
    assertEquals("Ali M", row.getResolvedNickname());
    assertEquals("avatar.png", row.getAvatarUrl());
    assertEquals("none", row.getDefaultAudioMode());
    assertEquals("CONFLICT", row.getStatus());
    assertEquals("DUPLICATE_NAME", row.getConflictType());
    assertEquals("Name exists", row.getMessage());
    assertEquals("AUTO_RENAME", row.getSelectedResolution());
    assertEquals("drv-123", row.getExistingDriverId());
    assertEquals(1, row.getAudioSlots().size());

    row.setAudioSlots(null);
    assertNotNull(row.getAudioSlots());

    DriverImportRow parameterized =
        new DriverImportRow(
            2,
            "Bob",
            "Bobby",
            "Bob",
            "Bobby",
            "bob.png",
            audioSlots,
            "file",
            "VALID",
            "NONE",
            "",
            "OVERWRITE",
            "drv-999");
    assertEquals(2, parameterized.getRowIndex());
    assertEquals("Bob", parameterized.getRawName());
    assertEquals("Bobby", parameterized.getRawNickname());
    assertEquals("bob.png", parameterized.getAvatarUrl());
    assertEquals("file", parameterized.getDefaultAudioMode());
    assertEquals("OVERWRITE", parameterized.getSelectedResolution());
    assertEquals("drv-999", parameterized.getExistingDriverId());

    DriverImportRow nullParam =
        new DriverImportRow(
            0, null, null, null, null, null, null, null, null, null, null, null, null);
    assertEquals("system", nullParam.getDefaultAudioMode());
    assertEquals("VALID", nullParam.getStatus());
    assertEquals("NONE", nullParam.getConflictType());
    assertEquals("SKIP", nullParam.getSelectedResolution());
    assertEquals("", nullParam.getMessage());
    assertNotNull(nullParam.getAudioSlots());
  }

  @Test
  public void testJsonSerialization() throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    Map<String, AudioConfig> audio = new HashMap<>();
    audio.put("lap", new AudioConfig("tts", null, "Nice lap"));

    DriverImportRow row =
        new DriverImportRow(
            3,
            "Charlie",
            "Chuck",
            "Charlie",
            "Chuck",
            "charlie.png",
            audio,
            "none",
            "VALID",
            "NONE",
            "OK",
            "SKIP",
            null);

    String json = mapper.writeValueAsString(row);
    DriverImportRow deserialized = mapper.readValue(json, DriverImportRow.class);

    assertNotNull(deserialized);
    assertEquals(3, deserialized.getRowIndex());
    assertEquals("Charlie", deserialized.getRawName());
    assertEquals("Chuck", deserialized.getRawNickname());
    assertEquals("charlie.png", deserialized.getAvatarUrl());
    assertEquals(1, deserialized.getAudioSlots().size());
    assertEquals("tts", deserialized.getAudioSlots().get("lap").getType());
    assertEquals("Nice lap", deserialized.getAudioSlots().get("lap").getText());
  }
}
