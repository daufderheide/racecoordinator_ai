package com.antigravity.util;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import com.antigravity.context.DatabaseContext;
import com.antigravity.proto.CustomHeat;
import com.antigravity.proto.CustomRotation;
import com.antigravity.service.AssetService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;

public class DatabaseRepairUtilsTest {
  private Path tempDir;
  private DatabaseContext databaseContext;
  private ObjectMapper objectMapper;

  @Before
  public void setUp() throws Exception {
    tempDir = Files.createTempDirectory("dbrepair_test_");
    databaseContext = new DatabaseContext("TestRepairDb", null, tempDir.toString());
    objectMapper = new ObjectMapper();
  }

  @After
  public void tearDown() throws Exception {
    if (databaseContext != null && databaseContext.getConnection() != null) {
      try {
        databaseContext.getConnection().close();
      } catch (Exception ignored) {
      }
    }
    if (tempDir != null && Files.exists(tempDir)) {
      Files.walk(tempDir).sorted(Comparator.reverseOrder()).map(Path::toFile).forEach(File::delete);
    }
  }

  @Test
  public void testRepairCustomRotationReferences_HealsOrphanedAssetId_UsingTrackLanes()
      throws Exception {
    databaseContext.ensureTable("tracks");
    databaseContext.ensureTable("assets");
    databaseContext.ensureTable("races");

    // 1) Insert track with 4 lanes
    String trackJson =
        "{\"entity_id\":\"track_4lane\",\"name\":\"4 Lane Track\",\"lanes\":[{},{},{},{}]}";
    String insertTrack =
        "INSERT INTO tracks (entity_id, sequence_id, json_data) VALUES ('track_4lane', NULL, ?)";
    try (PreparedStatement pstmt = databaseContext.getConnection().prepareStatement(insertTrack)) {
      pstmt.setString(1, trackJson);
      pstmt.executeUpdate();
    }

    // 2) Insert custom rotation asset with 4 lanes
    AssetService assetService =
        new AssetService(
            databaseContext,
            Paths.get(
                    databaseContext.getDataRoot(),
                    databaseContext.getCurrentDatabaseName(),
                    "assets")
                .toString());
    CustomHeat heat =
        CustomHeat.newBuilder().addAllDriverIndices(Arrays.asList(1, 2, 3, 4)).setGroup(0).build();
    CustomRotation rot =
        CustomRotation.newBuilder()
            .setNumDrivers(4)
            .addAllHeats(Collections.singletonList(heat))
            .build();
    assetService.saveCustomRotation(
        "asset-llany-123", "Llany Rotations", 4, Collections.singletonList(rot));

    // 3) Insert race with orphaned custom_rotation_asset_id
    String raceJson =
        "{\"entity_id\":\"race_4min\",\"name\":\"4 mins\",\"heat_rotation_type\":\"Custom\","
            + "\"track_entity_id\":\"track_4lane\",\"custom_rotation_asset_id\":\"orphaned-id-456\"}";
    String insertRace =
        "INSERT INTO races (entity_id, sequence_id, json_data) VALUES ('race_4min', NULL, ?)";
    try (PreparedStatement pstmt = databaseContext.getConnection().prepareStatement(insertRace)) {
      pstmt.setString(1, raceJson);
      pstmt.executeUpdate();
    }

    // Run repair
    DatabaseRepairUtils.repairCustomRotationReferences(databaseContext);

    // Verify race was healed
    String selectRace = "SELECT json_data FROM races WHERE entity_id = 'race_4min'";
    try (PreparedStatement pstmt = databaseContext.getConnection().prepareStatement(selectRace);
        ResultSet rs = pstmt.executeQuery()) {
      assertTrue("Race row must exist", rs.next());
      JsonNode node = objectMapper.readTree(rs.getString("json_data"));
      assertEquals("asset-llany-123", node.get("custom_rotation_asset_id").asText());
      assertEquals("Llany Rotations", node.get("custom_rotation_asset_name").asText());
    }
  }

  @Test
  public void testRepairCustomRotationReferences_HealsOrphanedAssetId_UsingAssetName()
      throws Exception {
    databaseContext.ensureTable("tracks");
    databaseContext.ensureTable("assets");
    databaseContext.ensureTable("races");

    // Insert custom rotation asset
    AssetService assetService =
        new AssetService(
            databaseContext,
            Paths.get(
                    databaseContext.getDataRoot(),
                    databaseContext.getCurrentDatabaseName(),
                    "assets")
                .toString());
    CustomHeat heat =
        CustomHeat.newBuilder().addAllDriverIndices(Arrays.asList(1, 2)).setGroup(0).build();
    CustomRotation rot =
        CustomRotation.newBuilder()
            .setNumDrivers(2)
            .addAllHeats(Collections.singletonList(heat))
            .build();
    assetService.saveCustomRotation(
        "asset-sprint-999", "Sprint 2-Lane", 2, Collections.singletonList(rot));

    // Race has mismatched ID but correct custom_rotation_asset_name
    String raceJson =
        "{\"entity_id\":\"race_sprint\",\"name\":\"Sprint Race\",\"heat_rotation_type\":\"Custom\","
            + "\"custom_rotation_asset_id\":\"wrong-id\",\"custom_rotation_asset_name\":\"Sprint 2-Lane\"}";
    String insertRace =
        "INSERT INTO races (entity_id, sequence_id, json_data) VALUES ('race_sprint', NULL, ?)";
    try (PreparedStatement pstmt = databaseContext.getConnection().prepareStatement(insertRace)) {
      pstmt.setString(1, raceJson);
      pstmt.executeUpdate();
    }

    DatabaseRepairUtils.repairCustomRotationReferences(databaseContext);

    String selectRace = "SELECT json_data FROM races WHERE entity_id = 'race_sprint'";
    try (PreparedStatement pstmt = databaseContext.getConnection().prepareStatement(selectRace);
        ResultSet rs = pstmt.executeQuery()) {
      assertTrue("Race row must exist", rs.next());
      JsonNode node = objectMapper.readTree(rs.getString("json_data"));
      assertEquals("asset-sprint-999", node.get("custom_rotation_asset_id").asText());
      assertEquals("Sprint 2-Lane", node.get("custom_rotation_asset_name").asText());
    }
  }

  @Test
  public void testRepairCustomRotationReferences_LeavesValidAssetUntouched() throws Exception {
    databaseContext.ensureTable("tracks");
    databaseContext.ensureTable("assets");
    databaseContext.ensureTable("races");

    AssetService assetService =
        new AssetService(
            databaseContext,
            Paths.get(
                    databaseContext.getDataRoot(),
                    databaseContext.getCurrentDatabaseName(),
                    "assets")
                .toString());
    CustomHeat heat =
        CustomHeat.newBuilder().addAllDriverIndices(Arrays.asList(1, 2)).setGroup(0).build();
    CustomRotation rot =
        CustomRotation.newBuilder()
            .setNumDrivers(2)
            .addAllHeats(Collections.singletonList(heat))
            .build();
    assetService.saveCustomRotation(
        "valid-asset-id", "Valid Rotation", 2, Collections.singletonList(rot));

    String raceJson =
        "{\"entity_id\":\"race_valid\",\"name\":\"Valid Race\",\"heat_rotation_type\":\"Custom\","
            + "\"custom_rotation_asset_id\":\"valid-asset-id\"}";
    String insertRace =
        "INSERT INTO races (entity_id, sequence_id, json_data) VALUES ('race_valid', NULL, ?)";
    try (PreparedStatement pstmt = databaseContext.getConnection().prepareStatement(insertRace)) {
      pstmt.setString(1, raceJson);
      pstmt.executeUpdate();
    }

    DatabaseRepairUtils.repairCustomRotationReferences(databaseContext);

    String selectRace = "SELECT json_data FROM races WHERE entity_id = 'race_valid'";
    try (PreparedStatement pstmt = databaseContext.getConnection().prepareStatement(selectRace);
        ResultSet rs = pstmt.executeQuery()) {
      assertTrue(rs.next());
      JsonNode node = objectMapper.readTree(rs.getString("json_data"));
      assertEquals("valid-asset-id", node.get("custom_rotation_asset_id").asText());
    }
  }

  @Test
  public void testRepairCustomRotationReferences_HandlesNullDatabaseContextGracefully() {
    DatabaseRepairUtils.repairCustomRotationReferences(null);
  }
}
