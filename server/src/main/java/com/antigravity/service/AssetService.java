package com.antigravity.service;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.AssetType;
import com.antigravity.proto.AssetMessage;
import com.antigravity.proto.AudioSetEntry;
import com.antigravity.proto.CustomHeat;
import com.antigravity.proto.CustomRotation;
import com.antigravity.proto.ImageSetEntry;
import com.antigravity.proto.Model;
import com.antigravity.proto.SaveAudioSetEntry;
import com.antigravity.proto.SaveImageSetEntry;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.text.CharacterIterator;
import java.text.StringCharacterIterator;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class AssetService {
  private static final Logger logger = LoggerFactory.getLogger(AssetService.class);
  private static final ObjectMapper objectMapper = new ObjectMapper();

  private final String assetDir;
  private final DatabaseContext databaseContext;

  public AssetService(DatabaseContext databaseContext, String assetDir) {
    this.databaseContext = databaseContext;
    this.assetDir = assetDir;
    databaseContext.ensureTable("assets");
    File directory = new File(assetDir);
    if (!directory.exists()) {
      boolean created = directory.mkdirs();
      if (!created) {
        logger.error("CRITICAL: Failed to create asset directory: {}", directory.getAbsolutePath());
      } else {
        logger.info("Created asset directory: {}", directory.getAbsolutePath());
      }
    }
  }

  public String getAssetDir() {
    return assetDir;
  }

  public List<AssetMessage> getAllAssets() {
    databaseContext.ensureTable("assets");
    List<AssetMessage> assets = new ArrayList<>();
    String sql = "SELECT json_data FROM assets";
    try (PreparedStatement pstmt = databaseContext.getConnection().prepareStatement(sql);
        ResultSet rs = pstmt.executeQuery()) {
      while (rs.next()) {
        String json = rs.getString("json_data");
        if (json != null && !json.trim().isEmpty()) {
          JsonNode node = objectMapper.readTree(json);
          if (!node.has("deleted") || !node.get("deleted").asBoolean()) {
            assets.add(jsonToAsset(node));
          }
        }
      }
    } catch (Exception e) {
      logger.error("Error executing getAllAssets", e);
    }
    return assets;
  }

  public AssetMessage getAssetById(String id) {
    if (id == null) return null;
    databaseContext.ensureTable("assets");
    String sql = "SELECT json_data FROM assets WHERE entity_id = ?";
    try (PreparedStatement pstmt = databaseContext.getConnection().prepareStatement(sql)) {
      pstmt.setString(1, id);
      try (ResultSet rs = pstmt.executeQuery()) {
        if (rs.next()) {
          String json = rs.getString("json_data");
          if (json != null && !json.trim().isEmpty()) {
            return jsonToAsset(objectMapper.readTree(json));
          }
        }
      }
    } catch (Exception e) {
      logger.error("Error getting asset by id {}", id, e);
    }
    return null;
  }

  public AssetMessage saveAsset(String name, String type, byte[] data) throws IOException {
    return saveAsset(null, name, type, data);
  }

  public AssetMessage saveAsset(String id, String name, String type, byte[] data)
      throws IOException {
    if (id == null) {
      id = UUID.randomUUID().toString();
    }
    String safeName = name.replaceAll("[^a-zA-Z0-9.-]", "_");
    String filename = id + "_" + safeName;
    Path path = Paths.get(assetDir, filename);

    try (FileOutputStream fos = new FileOutputStream(path.toFile())) {
      fos.write(data);
    }

    String sizeStr = humanReadableByteCountBin(data.length);
    String url = "/assets/" + filename;
    boolean isDefault = id.startsWith("default_");

    ObjectNode node = objectMapper.createObjectNode();
    node.put("_id", id);
    node.put("entity_id", id);
    node.put("name", name);
    node.put("type", AssetType.normalize(type));
    node.put("size", sizeStr);
    node.put("filename", filename);
    node.put("url", url);
    if (isDefault) {
      node.put("is_default", true);
    }

    saveAssetNode(id, node);
    return jsonToAsset(node);
  }

  private void saveAssetNode(String id, JsonNode node) {
    databaseContext.ensureTable("assets");
    String sql =
        "INSERT INTO assets (entity_id, sequence_id, json_data) VALUES (?, NULL, ?) "
            + "ON CONFLICT(entity_id) DO UPDATE SET json_data=excluded.json_data";
    try (PreparedStatement pstmt = databaseContext.getConnection().prepareStatement(sql)) {
      pstmt.setString(1, id);
      pstmt.setString(2, objectMapper.writeValueAsString(node));
      pstmt.executeUpdate();
    } catch (Exception e) {
      logger.error("Error saving asset node {}", id, e);
    }
  }

  public boolean deleteAsset(String id) {
    if (id == null) return false;
    databaseContext.ensureTable("assets");
    JsonNode node = null;
    String sqlSelect = "SELECT json_data FROM assets WHERE entity_id = ?";
    try (PreparedStatement pstmt = databaseContext.getConnection().prepareStatement(sqlSelect)) {
      pstmt.setString(1, id);
      try (ResultSet rs = pstmt.executeQuery()) {
        if (rs.next()) {
          node = objectMapper.readTree(rs.getString("json_data"));
        }
      }
    } catch (Exception e) {
      logger.error("Error fetching asset for deletion {}", id, e);
    }

    if (node == null) {
      return false;
    }

    boolean isDefault =
        node.has("is_default") && node.get("is_default").asBoolean() || id.startsWith("default_");
    if (isDefault) {
      ((ObjectNode) node).put("deleted", true);
      saveAssetNode(id, node);
      return true;
    }

    if (node.has("filename")) {
      deletePhysicalFile(node.get("filename").asText());
    }

    if (node.has("images") && node.get("images").isArray()) {
      for (JsonNode img : node.get("images")) {
        if (img.has("url")) {
          String url = img.get("url").asText();
          if (url.startsWith("/assets/")) {
            deletePhysicalFile(url.substring("/assets/".length()));
          }
        }
      }
    }

    if (node.has("audio_entries") && node.get("audio_entries").isArray()) {
      for (JsonNode audio : node.get("audio_entries")) {
        if (audio.has("url")) {
          String url = audio.get("url").asText();
          if (url.startsWith("/assets/")) {
            deletePhysicalFile(url.substring("/assets/".length()));
          }
        }
      }
    }

    String sqlDelete = "DELETE FROM assets WHERE entity_id = ?";
    try (PreparedStatement pstmt = databaseContext.getConnection().prepareStatement(sqlDelete)) {
      pstmt.setString(1, id);
      pstmt.executeUpdate();
    } catch (Exception e) {
      logger.error("Error deleting asset {}", id, e);
    }
    return true;
  }

  private void deletePhysicalFile(String filename) {
    File file = new File(assetDir, filename);
    if (file.exists()) {
      if (!file.delete()) {
        logger.error("Failed to delete file: {}", file.getAbsolutePath());
      }
    }
  }

  public boolean renameAsset(String id, String newName) {
    if (id == null) return false;
    databaseContext.ensureTable("assets");
    JsonNode node = null;
    String sqlSelect = "SELECT json_data FROM assets WHERE entity_id = ?";
    try (PreparedStatement pstmt = databaseContext.getConnection().prepareStatement(sqlSelect)) {
      pstmt.setString(1, id);
      try (ResultSet rs = pstmt.executeQuery()) {
        if (rs.next()) {
          node = objectMapper.readTree(rs.getString("json_data"));
        }
      }
    } catch (Exception e) {
      logger.error("Error fetching asset for rename {}", id, e);
    }
    if (node != null) {
      ((ObjectNode) node).put("name", newName);
      saveAssetNode(id, node);
      return true;
    }
    return false;
  }

  public AssetMessage saveImageSet(String id, String name, List<SaveImageSetEntry> entries)
      throws IOException {
    boolean isNew = (id == null || id.isEmpty());
    if (isNew) {
      id = UUID.randomUUID().toString();
    }

    ArrayNode imagesArray = objectMapper.createArrayNode();
    long totalSize = 0;

    for (SaveImageSetEntry entry : entries) {
      String url = entry.getUrl();
      String entryName = entry.getName();
      int percentage = entry.getPercentage();
      String sizeStr = "";

      if (entry.getData() != null && !entry.getData().isEmpty()) {
        String entryId = UUID.randomUUID().toString();
        String safeName = entryName.replaceAll("[^a-zA-Z0-9.-]", "_");
        String filename = entryId + "_" + safeName;
        Path path = Paths.get(assetDir, filename);

        try (FileOutputStream fos = new FileOutputStream(path.toFile())) {
          fos.write(entry.getData().toByteArray());
        }

        url = "/assets/" + filename;
        sizeStr = humanReadableByteCountBin(entry.getData().size());
        totalSize += entry.getData().size();
      } else if (url != null && !url.isEmpty()) {
        if (url.startsWith("/assets/")) {
          String filename = url.substring("/assets/".length());
          File file = new File(assetDir, filename);
          if (file.exists()) {
            totalSize += file.length();
            sizeStr = humanReadableByteCountBin(file.length());
          }
        }
      }

      ObjectNode imgNode = objectMapper.createObjectNode();
      imgNode.put("url", url);
      imgNode.put("percentage", percentage);
      imgNode.put("name", entryName);
      imgNode.put("size", sizeStr);
      imagesArray.add(imgNode);
    }

    ObjectNode doc = objectMapper.createObjectNode();
    doc.put("_id", id);
    doc.put("entity_id", id);
    doc.put("name", name);
    doc.put("type", "image_set");
    doc.put("is_default", id.startsWith("default_"));
    doc.put("size", humanReadableByteCountBin(totalSize));
    doc.put("url", imagesArray.size() > 0 ? imagesArray.get(0).get("url").asText() : "");
    doc.set("images", imagesArray);

    saveAssetNode(id, doc);
    return jsonToAsset(doc);
  }

  public AssetMessage saveAudioSet(String id, String name, List<SaveAudioSetEntry> entries)
      throws IOException {
    boolean isNew = (id == null || id.isEmpty());
    if (isNew) {
      id = UUID.randomUUID().toString();
    }

    ArrayNode audioArray = objectMapper.createArrayNode();
    long totalSize = 0;

    for (SaveAudioSetEntry entry : entries) {
      String url = entry.getUrl();
      String entryName = entry.getName();
      float timeSeconds = entry.getTimeSeconds();
      String type = entry.getType();
      String text = entry.getText();
      String sizeStr = "";

      if (entry.getData() != null && !entry.getData().isEmpty()) {
        String entryId = UUID.randomUUID().toString();
        String safeName = entryName.replaceAll("[^a-zA-Z0-9.-]", "_");
        String filename = entryId + "_" + safeName;
        Path path = Paths.get(assetDir, filename);

        try (FileOutputStream fos = new FileOutputStream(path.toFile())) {
          fos.write(entry.getData().toByteArray());
        }

        url = "/assets/" + filename;
        sizeStr = humanReadableByteCountBin(entry.getData().size());
        totalSize += entry.getData().size();
      } else if (url != null && !url.isEmpty()) {
        if (url.startsWith("/assets/")) {
          String filename = url.substring("/assets/".length());
          File file = new File(assetDir, filename);
          if (file.exists()) {
            totalSize += file.length();
            sizeStr = humanReadableByteCountBin(file.length());
          }
        }
      }

      ObjectNode audioNode = objectMapper.createObjectNode();
      audioNode.put("url", url);
      audioNode.put("time_seconds", timeSeconds);
      audioNode.put("name", entryName);
      audioNode.put("size", sizeStr);
      audioNode.put("type", type);
      audioNode.put("text", text);
      audioArray.add(audioNode);
    }

    ObjectNode doc = objectMapper.createObjectNode();
    doc.put("_id", id);
    doc.put("entity_id", id);
    doc.put("name", name);
    doc.put("type", "audio_set");
    doc.put("is_default", id.startsWith("default_"));
    doc.put("size", humanReadableByteCountBin(totalSize));
    doc.put("url", audioArray.size() > 0 ? audioArray.get(0).get("url").asText() : "");
    doc.set("audio_entries", audioArray);

    saveAssetNode(id, doc);
    return jsonToAsset(doc);
  }

  public AssetMessage saveCustomRotation(
      String id, String name, int numLanes, List<CustomRotation> rotations) {
    if (name == null || name.trim().isEmpty()) {
      throw new IllegalArgumentException("Asset name must not be empty.");
    }
    name = name.trim();

    boolean isNew = (id == null || id.isEmpty());
    if (isNew) {
      id = UUID.randomUUID().toString();
    }

    ArrayNode rotationArray = objectMapper.createArrayNode();
    for (CustomRotation rot : rotations) {
      ObjectNode rotNode = objectMapper.createObjectNode();
      rotNode.put("num_drivers", rot.getNumDrivers());
      ArrayNode heatArray = objectMapper.createArrayNode();
      for (CustomHeat heat : rot.getHeatsList()) {
        ObjectNode heatNode = objectMapper.createObjectNode();
        ArrayNode driverArray = objectMapper.createArrayNode();
        for (Integer d : heat.getDriverIndicesList()) {
          driverArray.add(d);
        }
        heatNode.set("driver_indices", driverArray);
        heatNode.put("group", heat.getGroup());
        heatArray.add(heatNode);
      }
      rotNode.set("heats", heatArray);
      rotationArray.add(rotNode);
    }

    ObjectNode doc = objectMapper.createObjectNode();
    doc.put("_id", id);
    doc.put("entity_id", id);
    doc.put("name", name);
    doc.put("type", "custom_rotation");
    doc.put("num_lanes", numLanes);
    doc.set("custom_rotations", rotationArray);
    doc.put("size", "0 B");
    doc.put("url", "");

    saveAssetNode(id, doc);
    return jsonToAsset(doc);
  }

  private AssetMessage jsonToAsset(JsonNode node) {
    String id =
        node.has("_id")
            ? node.get("_id").asText()
            : (node.has("entity_id") ? node.get("entity_id").asText() : "");
    AssetMessage.Builder builder =
        AssetMessage.newBuilder()
            .setModel(Model.newBuilder().setEntityId(id).build())
            .setName(node.has("name") ? node.get("name").asText() : "")
            .setType(node.has("type") ? AssetType.normalize(node.get("type").asText()) : "")
            .setSize(node.has("size") ? node.get("size").asText() : "")
            .setUrl(node.has("url") ? node.get("url").asText() : "");

    if (node.has("images") && node.get("images").isArray()) {
      for (JsonNode img : node.get("images")) {
        builder.addImages(
            ImageSetEntry.newBuilder()
                .setUrl(img.has("url") ? img.get("url").asText() : "")
                .setPercentage(img.has("percentage") ? img.get("percentage").asInt() : 0)
                .setName(img.has("name") ? img.get("name").asText() : "")
                .setSize(img.has("size") ? img.get("size").asText() : "")
                .build());
      }
    }

    if (node.has("audio_entries") && node.get("audio_entries").isArray()) {
      for (JsonNode audio : node.get("audio_entries")) {
        builder.addAudioEntries(
            AudioSetEntry.newBuilder()
                .setUrl(audio.has("url") ? audio.get("url").asText() : "")
                .setTimeSeconds(
                    audio.has("time_seconds") ? (float) audio.get("time_seconds").asDouble() : 0.0f)
                .setName(audio.has("name") ? audio.get("name").asText() : "")
                .setSize(audio.has("size") ? audio.get("size").asText() : "")
                .setType(audio.has("type") ? audio.get("type").asText() : "")
                .setText(audio.has("text") ? audio.get("text").asText() : "")
                .build());
      }
    }

    if (node.has("num_lanes")) {
      builder.setNumLanes(node.get("num_lanes").asInt());
    }

    if (node.has("custom_rotations") && node.get("custom_rotations").isArray()) {
      for (JsonNode rot : node.get("custom_rotations")) {
        CustomRotation.Builder rotBuilder =
            CustomRotation.newBuilder()
                .setNumDrivers(rot.has("num_drivers") ? rot.get("num_drivers").asInt() : 0);

        if (rot.has("heats") && rot.get("heats").isArray()) {
          for (JsonNode heat : rot.get("heats")) {
            CustomHeat.Builder heatBuilder = CustomHeat.newBuilder();
            if (heat.has("driver_indices") && heat.get("driver_indices").isArray()) {
              for (JsonNode d : heat.get("driver_indices")) {
                heatBuilder.addDriverIndices(d.asInt());
              }
            }
            heatBuilder.setGroup(heat.has("group") ? heat.get("group").asInt() : 0);
            rotBuilder.addHeats(heatBuilder.build());
          }
        }
        builder.addCustomRotations(rotBuilder.build());
      }
    }

    return builder.build();
  }

  private static String humanReadableByteCountBin(long bytes) {
    long absB = bytes == Long.MIN_VALUE ? Long.MAX_VALUE : Math.abs(bytes);
    if (absB < 1024) {
      return bytes + " B";
    }
    long value = absB;
    CharacterIterator ci = new StringCharacterIterator("KMGTPE");
    for (int i = 40; i >= 0 && absB > 0xfffccccccccccccL >> i; i -= 10) {
      value >>= 10;
      ci.next();
    }
    value *= Long.signum(bytes);
    return String.format("%.1f %ciB", value / 1024.0, ci.current());
  }

  public void backfillDefaults() {
    new AssetDefaultsInitializer(this, databaseContext).backfillDefaults();
  }

  public void backfillDefaultTheme() {
    new AssetDefaultsInitializer(this, databaseContext).backfillDefaultTheme();
  }

  public void resetAssets() {
    File directory = new File(assetDir);
    if (directory.exists()) {
      File[] files = directory.listFiles();
      if (files != null) {
        for (File file : files) {
          if (!file.delete()) {
            logger.error("Failed to delete file during reset: {}", file.getAbsolutePath());
          }
        }
      }
    }

    databaseContext.ensureTable("assets");
    databaseContext.ensureTable("themes");
    try (Statement stmt = databaseContext.getConnection().createStatement()) {
      stmt.execute("DELETE FROM assets");
      stmt.execute("DELETE FROM themes");
    } catch (Exception e) {
      logger.error("Error clearing assets table during reset", e);
    }

    backfillDefaults();
  }
}
