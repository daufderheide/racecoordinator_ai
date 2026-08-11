package com.antigravity.service;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.AudioConfig;
import com.antigravity.models.Theme;
import com.antigravity.proto.AssetMessage;
import com.antigravity.proto.AudioSetEntry;
import com.antigravity.proto.CustomHeat;
import com.antigravity.proto.CustomRotation;
import com.antigravity.proto.ImageSetEntry;
import com.antigravity.proto.Model;
import com.antigravity.proto.SaveAudioSetEntry;
import com.antigravity.proto.SaveImageSetEntry;
import com.antigravity.repository.SqliteRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.text.CharacterIterator;
import java.text.StringCharacterIterator;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@SuppressWarnings("checkstyle:FileLength")
public class AssetService {
  private static final Logger logger = LoggerFactory.getLogger(AssetService.class);
  private static final ObjectMapper objectMapper = new ObjectMapper();

  private final String assetDir;
  private final DatabaseContext databaseContext;

  private static class DefaultAsset {
    final String id;
    final String filename;
    final String displayName;

    DefaultAsset(String id, String filename, String displayName) {
      this.id = id;
      this.filename = filename;
      this.displayName = displayName;
    }
  }

  private static class FuelDefaultAsset extends DefaultAsset {
    final int percentage;

    FuelDefaultAsset(String id, String filename, String displayName, int percentage) {
      super(id, filename, displayName);
      this.percentage = percentage;
    }
  }

  private static final List<DefaultAsset> DEFAULT_IMAGE_ASSETS = new ArrayList<>();

  static {
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset("default_black-blue", "black-blue.png", "Helmet Black-Blue"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset("default_black-grey", "black-grey.png", "Helmet Black-Grey"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset("default_black-purple", "black-purple.png", "Helmet Black-Purple"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset("default_black-white", "black-white.png", "Helmet Black-White"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset("default_black-white2", "black-white2.png", "Helmet Black-White2"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset("default_black-yellow", "black-yellow.png", "Helmet Black-Yellow"));
    DEFAULT_IMAGE_ASSETS.add(new DefaultAsset("default_black", "black.png", "Helmet Black"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset("default_blue-green", "blue-green.png", "Helmet Blue-Green"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset("default_blue-green2", "blue-green2.png", "Helmet Blue-Green2"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset(
            "default_blue-purple-green", "blue-purple-green.png", "Helmet Blue-Purple-Green"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset(
            "default_blue-red-silver", "blue-red-silver.png", "Helmet Blue-Red-Silver"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset("default_blue-white", "blue-white.png", "Helmet Blue-White"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset(
            "default_blue-yellow-red", "blue-yellow-red.png", "Helmet Blue-Yellow-Red"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset("default_blue-yellow", "blue-yellow.png", "Helmet Blue-Yellow"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset("default_green-white", "green-white.png", "Helmet Green-White"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset(
            "default_grey-black-gold", "grey-black-gold.png", "Helmet Grey-Black-Gold"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset("default_grey-red-white", "grey-red-white.png", "Helmet Grey-Red-White"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset("default_orange-blue", "orange-blue.png", "Helmet Orange-Blue"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset("default_red-gold-blue", "red-gold-blue.png", "Helmet Red-Gold-Blue"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset("default_red-orange", "red-orange.png", "Helmet Red-Orange"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset("default_red-yellow", "red-yellow.png", "Helmet Red-Yellow"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset("default_silver-green", "silver-green.png", "Helmet Silver-Green"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset("default_silver-red", "silver-red.png", "Helmet Silver-Red"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset(
            "default_white-blue-yellow", "white-blue-yellow.png", "Helmet White-Blue-Yellow"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset("default_white-blue", "white-blue.png", "Helmet White-Blue"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset(
            "default_white-red-yellow", "white-red-yellow.png", "Helmet White-Red-Yellow"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset("default_flag_green", "flag_green.png", "Green Flag"));
    DEFAULT_IMAGE_ASSETS.add(new DefaultAsset("default_flag_red", "flag_red.png", "Red Flag"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset("default_flag_yellow", "flag_yellow.png", "Yellow Flag"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset(
            "default_flag_green_yellow", "flag_green_yellow.png", "Yellow Green Flag"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset("default_flag_black", "flag_black.png", "Black Flag"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset("default_flag_white", "flag_white.png", "White Flag"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset("default_flag_checkered", "flag_checkered.png", "Checkered Flag"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset("default_start_red_on", "start_red_on.png", "Start Lamp Red"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset("default_start_red_dim", "start_red_dim.png", "Start Lamp Dim"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset("default_start_green", "start_green.png", "Start Lamp Green"));
  }

  private static final List<FuelDefaultAsset> DEFAULT_FUEL_IMAGE_ASSETS = new ArrayList<>();

  static {
    DEFAULT_FUEL_IMAGE_ASSETS.add(
        new FuelDefaultAsset("default_fuel_100", "fuel_100.png", "Fuel Gauge 100%", 100));
    DEFAULT_FUEL_IMAGE_ASSETS.add(
        new FuelDefaultAsset("default_fuel_90", "fuel_90.png", "Fuel Gauge 90%", 90));
    DEFAULT_FUEL_IMAGE_ASSETS.add(
        new FuelDefaultAsset("default_fuel_80", "fuel_80.png", "Fuel Gauge 80%", 80));
    DEFAULT_FUEL_IMAGE_ASSETS.add(
        new FuelDefaultAsset("default_fuel_70", "fuel_70.png", "Fuel Gauge 70%", 70));
    DEFAULT_FUEL_IMAGE_ASSETS.add(
        new FuelDefaultAsset("default_fuel_60", "fuel_60.png", "Fuel Gauge 60%", 60));
    DEFAULT_FUEL_IMAGE_ASSETS.add(
        new FuelDefaultAsset("default_fuel_50", "fuel_50.png", "Fuel Gauge 50%", 50));
    DEFAULT_FUEL_IMAGE_ASSETS.add(
        new FuelDefaultAsset("default_fuel_40", "fuel_40.png", "Fuel Gauge 40%", 40));
    DEFAULT_FUEL_IMAGE_ASSETS.add(
        new FuelDefaultAsset("default_fuel_30", "fuel_30.png", "Fuel Gauge 30%", 30));
    DEFAULT_FUEL_IMAGE_ASSETS.add(
        new FuelDefaultAsset("default_fuel_20", "fuel_20.png", "Fuel Gauge 20%", 20));
    DEFAULT_FUEL_IMAGE_ASSETS.add(
        new FuelDefaultAsset("default_fuel_10", "fuel_10.png", "Fuel Gauge 10%", 10));
    DEFAULT_FUEL_IMAGE_ASSETS.add(
        new FuelDefaultAsset("default_fuel_0", "fuel_0.png", "Fuel Gauge 0%", 0));
  }

  private static final Set<String> EXCLUDED_AUDIO_IDS = new HashSet<>();
  private static final List<DefaultAsset> DEFAULT_AUDIO_ASSETS = new ArrayList<>();

  static {
    DEFAULT_AUDIO_ASSETS.add(new DefaultAsset("default_beep", "beep.wav", "Lap Beep"));
    DEFAULT_AUDIO_ASSETS.add(new DefaultAsset("default_chimes", "chimes.wav", "Lap Chimes"));
    DEFAULT_AUDIO_ASSETS.add(new DefaultAsset("default_driveby", "driveby.wav", "Lap Driveby"));
    DEFAULT_AUDIO_ASSETS.add(new DefaultAsset("default_penalty", "penalty.wav", "Penalty"));
    DEFAULT_AUDIO_ASSETS.add(
        new DefaultAsset(
            "default_yellow_flag", "audio/english/woman/w_yellowflag.wav", "Yellow Flag"));
    DEFAULT_AUDIO_ASSETS.add(
        new DefaultAsset(
            "default_countdown_go", "audio/english/woman/w_countdown_0.wav", "Countdown Go"));
    DEFAULT_AUDIO_ASSETS.add(
        new DefaultAsset(
            "default_countdown_1", "audio/english/woman/w_countdown_1.wav", "Countdown 1"));
    DEFAULT_AUDIO_ASSETS.add(
        new DefaultAsset(
            "default_countdown_2", "audio/english/woman/w_countdown_2.wav", "Countdown 2"));
    DEFAULT_AUDIO_ASSETS.add(
        new DefaultAsset(
            "default_countdown_3", "audio/english/woman/w_countdown_3.wav", "Countdown 3"));
    DEFAULT_AUDIO_ASSETS.add(
        new DefaultAsset(
            "default_countdown_4", "audio/english/woman/w_countdown_4.wav", "Countdown 4"));
    DEFAULT_AUDIO_ASSETS.add(
        new DefaultAsset(
            "default_countdown_5", "audio/english/woman/w_countdown_5.wav", "Countdown 5"));
    DEFAULT_AUDIO_ASSETS.add(
        new DefaultAsset(
            "default_seconds_left_300",
            "audio/english/woman/w_sl300.wav",
            "Seconds Left -- 5 Minutes"));
    DEFAULT_AUDIO_ASSETS.add(
        new DefaultAsset(
            "default_seconds_left_240",
            "audio/english/woman/w_sl240.wav",
            "Seconds Left -- 4 Minutes"));
    DEFAULT_AUDIO_ASSETS.add(
        new DefaultAsset(
            "default_seconds_left_180",
            "audio/english/woman/w_sl180.wav",
            "Seconds Left -- 3 Minutes"));
    DEFAULT_AUDIO_ASSETS.add(
        new DefaultAsset(
            "default_seconds_left_120",
            "audio/english/woman/w_sl120.wav",
            "Seconds Left -- 2 Minutes"));
    DEFAULT_AUDIO_ASSETS.add(
        new DefaultAsset(
            "default_seconds_left_60",
            "audio/english/woman/w_sl60.wav",
            "Seconds Left -- 1 Minute"));
    DEFAULT_AUDIO_ASSETS.add(
        new DefaultAsset(
            "default_seconds_left_30",
            "audio/english/woman/w_sl30.wav",
            "Seconds Left -- 30 Seconds"));
    DEFAULT_AUDIO_ASSETS.add(
        new DefaultAsset(
            "default_seconds_left_25",
            "audio/english/woman/w_sl25.wav",
            "Seconds Left -- 25 Seconds"));
    DEFAULT_AUDIO_ASSETS.add(
        new DefaultAsset(
            "default_seconds_left_20",
            "audio/english/woman/w_sl20.wav",
            "Seconds Left -- 20 Seconds"));
    DEFAULT_AUDIO_ASSETS.add(
        new DefaultAsset(
            "default_seconds_left_15",
            "audio/english/woman/w_sl15.wav",
            "Seconds Left -- 15 Seconds"));
    DEFAULT_AUDIO_ASSETS.add(
        new DefaultAsset(
            "default_seconds_left_10",
            "audio/english/woman/w_sl10.wav",
            "Seconds Left -- 10 Seconds"));
    DEFAULT_AUDIO_ASSETS.add(
        new DefaultAsset(
            "default_seconds_left_5",
            "audio/english/woman/w_sl5.wav",
            "Seconds Left -- 5 Seconds"));
    DEFAULT_AUDIO_ASSETS.add(
        new DefaultAsset(
            "default_heat_half", "audio/english/woman/w_heat_half.wav", "Seconds Left -- Halfway"));
    DEFAULT_AUDIO_ASSETS.add(
        new DefaultAsset("default_heat_over", "audio/english/woman/w_heatover.wav", "Heat Over"));
    DEFAULT_AUDIO_ASSETS.add(
        new DefaultAsset("default_race_over", "audio/english/woman/w_raceover.wav", "Race Over"));
  }

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
    node.put("type", type);
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
            .setType(node.has("type") ? node.get("type").asText() : "")
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

  private byte[] readResource(String path) throws IOException {
    try (InputStream is = getClass().getResourceAsStream(path)) {
      if (is == null) {
        throw new IOException("Resource not found: " + path);
      }
      ByteArrayOutputStream buffer = new ByteArrayOutputStream();
      int nRead;
      byte[] data = new byte[1024];
      while ((nRead = is.read(data, 0, data.length)) != -1) {
        buffer.write(data, 0, nRead);
      }
      buffer.flush();
      return buffer.toByteArray();
    }
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
    for (DefaultAsset asset : DEFAULT_IMAGE_ASSETS) {
      if (getAssetById(asset.id) == null) {
        try {
          byte[] data = readResource("/defaults/" + asset.filename);
          saveAsset(asset.id, asset.displayName, "image", data);
        } catch (Exception e) {
          logger.error("Failed to backfill asset {}", asset.filename, e);
        }
      }
    }
    Map<String, String> audioUrls = new HashMap<>();
    for (DefaultAsset asset : DEFAULT_AUDIO_ASSETS) {
      if (getAssetById(asset.id) == null) {
        try {
          byte[] data = readResource("/defaults/" + asset.filename);
          AssetMessage saved = saveAsset(asset.id, asset.displayName, "audio", data);
          audioUrls.put(asset.id, saved.getUrl());
        } catch (Exception e) {
          logger.error("Failed to backfill asset {}", asset.filename, e);
        }
      } else {
        AssetMessage existing = getAssetById(asset.id);
        audioUrls.put(asset.id, existing.getUrl());
      }
    }

    backfillAudioSetDefaults(audioUrls);
    backfillFuelGaugeDefaults();
    backfillDefaultTheme();
  }

  private void backfillAudioSetDefaults(Map<String, String> audioUrls) {
    String[][] countdownSpec = {
      {"5.0", "Countdown 5", "default_countdown_5"},
      {"4.0", "Countdown 4", "default_countdown_4"},
      {"3.0", "Countdown 3", "default_countdown_3"},
      {"2.0", "Countdown 2", "default_countdown_2"},
      {"1.0", "Countdown 1", "default_countdown_1"},
      {"0.0", "Countdown Go", "default_countdown_go"}
    };
    List<SaveAudioSetEntry> countdownEntries = new ArrayList<>();
    for (String[] spec : countdownSpec) {
      String url = audioUrls.get(spec[2]);
      if (url != null) {
        countdownEntries.add(
            SaveAudioSetEntry.newBuilder()
                .setTimeSeconds(Float.parseFloat(spec[0]))
                .setName(spec[1])
                .setUrl(url)
                .setType("preset")
                .build());
      }
    }
    if (getAssetById("default_countdown") == null && !countdownEntries.isEmpty()) {
      try {
        saveAudioSet("default_countdown", "Default Countdown", countdownEntries);
        logger.info("Backfilled default countdown audio set with ID default_countdown");
      } catch (Exception e) {
        logger.error("Failed to backfill default countdown audio set", e);
      }
    }

    String[][] slSpec = {
      {"300.0", "5 Minutes", "default_seconds_left_300"},
      {"240.0", "4 Minutes", "default_seconds_left_240"},
      {"180.0", "3 Minutes", "default_seconds_left_180"},
      {"120.0", "2 Minutes", "default_seconds_left_120"},
      {"60.0", "1 Minute", "default_seconds_left_60"},
      {"30.0", "30 Seconds", "default_seconds_left_30"},
      {"25.0", "25 Seconds", "default_seconds_left_25"},
      {"20.0", "20 Seconds", "default_seconds_left_20"},
      {"15.0", "15 Seconds", "default_seconds_left_15"},
      {"10.0", "10 Seconds", "default_seconds_left_10"},
      {"5.0", "5 Seconds", "default_seconds_left_5"}
    };
    List<SaveAudioSetEntry> secondsLeftEntries = new ArrayList<>();
    for (String[] spec : slSpec) {
      String url = audioUrls.get(spec[2]);
      if (url != null) {
        secondsLeftEntries.add(
            SaveAudioSetEntry.newBuilder()
                .setTimeSeconds(Float.parseFloat(spec[0]))
                .setName(spec[1])
                .setUrl(url)
                .setType("preset")
                .build());
      }
    }
    if (getAssetById("default_seconds_left") == null && !secondsLeftEntries.isEmpty()) {
      try {
        saveAudioSet("default_seconds_left", "Default Seconds Left", secondsLeftEntries);
        logger.info("Backfilled default seconds left audio set with ID default_seconds_left");
      } catch (Exception e) {
        logger.error("Failed to backfill default seconds left audio set", e);
      }
    }
  }

  private void backfillFuelGaugeDefaults() {
    List<SaveImageSetEntry> fuelSetEntries = new ArrayList<>();
    for (FuelDefaultAsset asset : DEFAULT_FUEL_IMAGE_ASSETS) {
      if (getAssetById(asset.id) == null) {
        try {
          byte[] data = readResource("/defaults/" + asset.filename);
          AssetMessage saved = saveAsset(asset.id, asset.displayName, "image", data);
          fuelSetEntries.add(
              SaveImageSetEntry.newBuilder()
                  .setUrl(saved.getUrl())
                  .setName(asset.displayName)
                  .setPercentage(asset.percentage)
                  .build());
        } catch (Exception e) {
          logger.error("Failed to backfill fuel asset {}", asset.filename, e);
        }
      } else {
        AssetMessage existing = getAssetById(asset.id);
        fuelSetEntries.add(
            SaveImageSetEntry.newBuilder()
                .setUrl(existing.getUrl())
                .setName(asset.displayName)
                .setPercentage(asset.percentage)
                .build());
      }
    }

    if (getAssetById("default_fuel_gauge") == null && !fuelSetEntries.isEmpty()) {
      try {
        saveImageSet("default_fuel_gauge", "Default Fuel Gauge", fuelSetEntries);
        logger.info("Backfilled default fuel gauge image set with ID default_fuel_gauge");
      } catch (Exception e) {
        logger.error("Failed to backfill default fuel gauge image set", e);
      }
    }
  }

  public void backfillDefaultTheme() {
    try {
      databaseContext.ensureTable("themes");
      SqliteRepository<Theme> themeRepo =
          new SqliteRepository<>(databaseContext, "themes", Theme.class);
      List<Theme> themes = themeRepo.findAll();
      boolean hasDefault = false;
      for (Theme t : themes) {
        if (t.isDefault()) {
          hasDefault = true;
          boolean updated = false;
          Map<String, String> s = new HashMap<>(t.getSlots());
          if (!s.containsKey("gauge.fuel")) {
            s.put("gauge.fuel", "default_fuel_gauge");
            updated = true;
          }
          if (!s.containsKey("audio.countdown")) {
            s.put("audio.countdown", "default_countdown");
            updated = true;
          }
          if (!s.containsKey("audio.seconds_left")) {
            s.put("audio.seconds_left", "default_seconds_left");
            updated = true;
          }

          Map<String, AudioConfig> as =
              t.getAudioSlots() != null ? new HashMap<>(t.getAudioSlots()) : new HashMap<>();
          if (populateDefaultAudioSlots(as)) {
            updated = true;
          }

          if (updated) {
            Theme newTheme = new Theme(t.getName(), true, s, as, t.getEntityId(), t.getId());
            themeRepo.save(newTheme);
          }
          break;
        }
      }
      if (!hasDefault) {
        Map<String, String> slots = createDefaultSlots();
        Map<String, AudioConfig> audioSlots = new HashMap<>();
        populateDefaultAudioSlots(audioSlots);

        Theme defaultTheme =
            new Theme("Default Theme", true, slots, audioSlots, Theme.DEFAULT_THEME_ID, null);
        themeRepo.save(defaultTheme);
        logger.info("Backfilled default theme with ID {}", Theme.DEFAULT_THEME_ID);
      }
    } catch (Exception e) {
      logger.error("Failed to backfill default theme", e);
    }
  }

  private boolean populateDefaultAudioSlots(Map<String, AudioConfig> as) {
    boolean updated = false;
    if (!as.containsKey("audio.yellowflag")) {
      as.put("audio.yellowflag", new AudioConfig("preset", "default_yellow_flag", null));
      updated = true;
    }
    if (!as.containsKey("audio.seconds_left.halfway")) {
      as.put("audio.seconds_left.halfway", new AudioConfig("preset", "default_heat_half", null));
      updated = true;
    }
    if (!as.containsKey("audio.heat_over")) {
      as.put("audio.heat_over", new AudioConfig("preset", "default_heat_over", null));
      updated = true;
    }
    if (!as.containsKey("audio.race_over")) {
      as.put("audio.race_over", new AudioConfig("preset", "default_race_over", null));
      updated = true;
    }
    if (!as.containsKey("audio.penalty")) {
      as.put("audio.penalty", new AudioConfig("preset", "default_penalty", null));
      updated = true;
    }
    if (!as.containsKey("audio.min_lap_time")
        || ("preset".equals(as.get("audio.min_lap_time").getType())
            && "default_beep".equals(as.get("audio.min_lap_time").getUrl()))) {
      as.put(
          "audio.min_lap_time",
          new AudioConfig("tts", null, "Min lap time for {{driver.nickname}}"));
      updated = true;
    }
    if (!as.containsKey("audio.drift_lap")
        || ("preset".equals(as.get("audio.drift_lap").getType())
            && "default_beep".equals(as.get("audio.drift_lap").getUrl()))) {
      as.put("audio.drift_lap", new AudioConfig("tts", null, "Drift lap for {{driver.nickname}}"));
      updated = true;
    }
    return updated;
  }

  private Map<String, String> createDefaultSlots() {
    Map<String, String> slots = new HashMap<>();
    slots.put("flag.green", "default_flag_green");
    slots.put("flag.red", "default_flag_red");
    slots.put("flag.yellow", "default_flag_yellow");
    slots.put("flag.white", "default_flag_white");
    slots.put("flag.yellowgreen", "default_flag_green_yellow");
    slots.put("flag.checkered", "default_flag_checkered");
    slots.put("flag.black", "default_flag_black");
    slots.put("lamp.red.on", "default_start_red_on");
    slots.put("lamp.red.dim", "default_start_red_dim");
    slots.put("lamp.green", "default_start_green");
    slots.put("gauge.fuel", "default_fuel_gauge");
    slots.put("audio.countdown", "default_countdown");
    slots.put("audio.seconds_left", "default_seconds_left");
    return slots;
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
