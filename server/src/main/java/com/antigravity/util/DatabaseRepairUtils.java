package com.antigravity.util;

import com.antigravity.context.DatabaseContext;
import com.antigravity.proto.AssetMessage;
import com.antigravity.service.AssetService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.nio.file.Paths;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.AbstractMap;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public final class DatabaseRepairUtils {
  private static final Logger logger = LoggerFactory.getLogger(DatabaseRepairUtils.class);
  private static final ObjectMapper objectMapper = new ObjectMapper();

  private DatabaseRepairUtils() {
    // Utility class
  }

  public static void repairCustomRotationReferences(DatabaseContext dbContext) {
    if (dbContext == null) {
      return;
    }
    dbContext.ensureTable("races");
    dbContext.ensureTable("assets");
    dbContext.ensureTable("tracks");

    List<Map.Entry<String, String>> toUpdate = new ArrayList<>();
    String selectRaces = "SELECT entity_id, json_data FROM races";
    try (Statement stmt = dbContext.getConnection().createStatement();
        ResultSet rs = stmt.executeQuery(selectRaces)) {
      while (rs.next()) {
        String entityId = rs.getString("entity_id");
        String json = rs.getString("json_data");
        if (json == null || json.trim().isEmpty()) {
          continue;
        }
        JsonNode node = objectMapper.readTree(json);
        if (!node.has("heat_rotation_type")
            || !"Custom".equalsIgnoreCase(node.get("heat_rotation_type").asText())) {
          continue;
        }

        String assetId =
            node.has("custom_rotation_asset_id")
                ? node.get("custom_rotation_asset_id").asText()
                : null;
        String assetName =
            node.has("custom_rotation_asset_name")
                ? node.get("custom_rotation_asset_name").asText()
                : null;

        if (isAssetPresent(dbContext, assetId)) {
          continue;
        }

        int numLanes = extractTrackLaneCount(dbContext, node);
        AssetMessage matched = resolveFallbackAsset(dbContext, assetName, numLanes);
        if (matched != null) {
          String matchedId =
              matched.getModel() != null && matched.getModel().getEntityId() != null
                  ? matched.getModel().getEntityId()
                  : "";
          ObjectNode raceObj = (ObjectNode) node;
          raceObj.put("custom_rotation_asset_id", matchedId);
          raceObj.put("custom_rotation_asset_name", matched.getName());
          toUpdate.add(
              new AbstractMap.SimpleEntry<>(entityId, objectMapper.writeValueAsString(raceObj)));
          logger.info(
              "Repaired race '{}' custom rotation reference: id={}, name={}",
              node.has("name") ? node.get("name").asText() : entityId,
              matchedId,
              matched.getName());
        }
      }
    } catch (Exception e) {
      logger.error("Error inspecting races for custom rotation repair", e);
    }

    persistRepairedRaces(dbContext, toUpdate);
  }

  private static boolean isAssetPresent(DatabaseContext dbContext, String assetId) {
    if (assetId == null || assetId.isEmpty()) {
      return false;
    }
    String checkSql = "SELECT count(*) FROM assets WHERE entity_id = ?";
    try (PreparedStatement checkStmt = dbContext.getConnection().prepareStatement(checkSql)) {
      checkStmt.setString(1, assetId);
      try (ResultSet checkRs = checkStmt.executeQuery()) {
        if (checkRs.next() && checkRs.getInt(1) > 0) {
          return true;
        }
      }
    } catch (Exception e) {
      logger.error("Error checking asset existence for ID {}", assetId, e);
    }
    return false;
  }

  private static int extractTrackLaneCount(DatabaseContext dbContext, JsonNode raceNode) {
    if (!raceNode.has("track_entity_id")) {
      return 0;
    }
    String trackId = raceNode.get("track_entity_id").asText();
    String trackSql = "SELECT json_data FROM tracks WHERE entity_id = ?";
    try (PreparedStatement trackStmt = dbContext.getConnection().prepareStatement(trackSql)) {
      trackStmt.setString(1, trackId);
      try (ResultSet trackRs = trackStmt.executeQuery()) {
        if (trackRs.next()) {
          String trackJson = trackRs.getString("json_data");
          if (trackJson != null) {
            JsonNode trackNode = objectMapper.readTree(trackJson);
            if (trackNode.has("lanes") && trackNode.get("lanes").isArray()) {
              return trackNode.get("lanes").size();
            }
          }
        }
      }
    } catch (Exception e) {
      logger.error("Error reading track lane count for track ID {}", trackId, e);
    }
    return 0;
  }

  private static AssetMessage resolveFallbackAsset(
      DatabaseContext dbContext, String assetName, int numLanes) {
    AssetService assetService =
        new AssetService(
            dbContext,
            Paths.get(dbContext.getDataRoot(), dbContext.getCurrentDatabaseName(), "assets")
                .toString());
    AssetMessage matched = null;
    if (assetName != null && !assetName.isEmpty()) {
      matched = assetService.getAssetByNameAndType(assetName, "custom_rotation");
      if (matched == null) {
        matched = assetService.getAssetByName(assetName);
      }
    }
    if (matched == null && numLanes > 0) {
      matched = assetService.getCustomRotationAssetForLanes(numLanes);
    }
    return matched;
  }

  private static void persistRepairedRaces(
      DatabaseContext dbContext, List<Map.Entry<String, String>> toUpdate) {
    for (Map.Entry<String, String> item : toUpdate) {
      String updateSql = "UPDATE races SET json_data = ? WHERE entity_id = ?";
      try (PreparedStatement updateStmt = dbContext.getConnection().prepareStatement(updateSql)) {
        updateStmt.setString(1, item.getValue());
        updateStmt.setString(2, item.getKey());
        updateStmt.executeUpdate();
      } catch (Exception e) {
        logger.error("Failed to update repaired race {}", item.getKey(), e);
      }
    }
  }
}
