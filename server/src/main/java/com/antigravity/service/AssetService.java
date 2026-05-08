package com.antigravity.service;

import com.antigravity.proto.AssetMessage;
import com.antigravity.proto.AudioSetEntry;
import com.antigravity.proto.CustomHeat;
import com.antigravity.proto.CustomRotation;
import com.antigravity.proto.ImageSetEntry;
import com.antigravity.proto.Model;
import com.antigravity.proto.SaveAudioSetEntry;
import com.antigravity.proto.SaveImageSetEntry;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Updates;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.CharacterIterator;
import java.text.StringCharacterIterator;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.bson.Document;
import org.bson.conversions.Bson;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class AssetService {
  private static final Logger logger = LoggerFactory.getLogger(AssetService.class);

  private final String assetDir;
  private final MongoDatabase database;
  private final MongoCollection<Document> collection;

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
        new DefaultAsset(
            "default_avatar_helmet_4", "default_avatar_helmet_4.png", "Helmet Futuristic 1"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset(
            "default_avatar_helmet_5", "default_avatar_helmet_5.png", "Helmet Futuristic 2"));
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
        new DefaultAsset("default_black-grey", "black-grey.png", "Helmet Black-Grey"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset("default_black-white", "black-white.png", "Helmet Black-White"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset("default_black-white2", "black-white2.png", "Helmet Black-White2"));
    DEFAULT_IMAGE_ASSETS.add(new DefaultAsset("default_black", "black.png", "Helmet Black"));
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
    // TODO(aufderheide): For now the order here controls how it animates
    // in the asset editor. The order shouldn't matter.
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
    EXCLUDED_AUDIO_IDS.add("default_countdown_5");
    EXCLUDED_AUDIO_IDS.add("default_countdown_4");
    EXCLUDED_AUDIO_IDS.add("default_countdown_3");
    EXCLUDED_AUDIO_IDS.add("default_countdown_2");
    EXCLUDED_AUDIO_IDS.add("default_countdown_1");
    EXCLUDED_AUDIO_IDS.add("default_countdown_go");
    EXCLUDED_AUDIO_IDS.add("default_seconds_left_300");
    EXCLUDED_AUDIO_IDS.add("default_seconds_left_240");
    EXCLUDED_AUDIO_IDS.add("default_seconds_left_180");
    EXCLUDED_AUDIO_IDS.add("default_seconds_left_120");
    EXCLUDED_AUDIO_IDS.add("default_seconds_left_60");
    EXCLUDED_AUDIO_IDS.add("default_seconds_left_30");
    EXCLUDED_AUDIO_IDS.add("default_seconds_left_25");
    EXCLUDED_AUDIO_IDS.add("default_seconds_left_20");
    EXCLUDED_AUDIO_IDS.add("default_seconds_left_15");
    EXCLUDED_AUDIO_IDS.add("default_seconds_left_10");
    EXCLUDED_AUDIO_IDS.add("default_seconds_left_5");

    DEFAULT_AUDIO_ASSETS.add(new DefaultAsset("default_beep", "beep.wav", "Lap Beep"));
    DEFAULT_AUDIO_ASSETS.add(new DefaultAsset("default_chimes", "chimes.wav", "Lap Chimes"));
    DEFAULT_AUDIO_ASSETS.add(new DefaultAsset("default_driveby", "driveby.wav", "Lap Driveby"));
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
  }

  public AssetService(MongoDatabase database, String assetDir) {
    this.database = database;
    this.collection = database.getCollection("assets");
    this.assetDir = assetDir;
    File directory = new File(assetDir);
    logger.debug(
        "AssetService initialized. assetDir={} absolute={}", assetDir, directory.getAbsolutePath());
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
    List<AssetMessage> assets = new ArrayList<>();
    for (Document doc : collection.find(Filters.ne("deleted", true))) {
      assets.add(documentToAsset(doc));
    }
    return assets;
  }

  public AssetMessage getAssetById(String id) {
    Document doc = collection.find(Filters.eq("_id", id)).first();
    if (doc == null) {
      return null;
    }
    return documentToAsset(doc);
  }

  public AssetMessage saveAsset(String name, String type, byte[] data) throws IOException {
    return saveAsset(null, name, type, data);
  }

  public AssetMessage saveAsset(String id, String name, String type, byte[] data)
      throws IOException {
    if (id == null) {
      id = UUID.randomUUID().toString();
    }
    // Simple sanitization
    String safeName = name.replaceAll("[^a-zA-Z0-9.-]", "_");
    String filename = id + "_" + safeName;
    Path path = Paths.get(assetDir, filename);

    try (FileOutputStream fos = new FileOutputStream(path.toFile())) {
      fos.write(data);
    }

    String sizeStr = humanReadableByteCountBin(data.length);
    String url =
        "/assets/" + filename; // Assuming static file serving is set up or we add a handler

    boolean isDefault = id.startsWith("default_");
    Document doc =
        new Document("_id", id)
            .append("name", name)
            .append("type", type)
            .append("size", sizeStr)
            .append("filename", filename) // Store internal filename
            .append("url", url);
    if (isDefault) {
      doc.append("is_default", true);
    }

    collection.insertOne(doc);

    return documentToAsset(doc);
  }

  public boolean deleteAsset(String id) {
    Document doc = collection.find(Filters.eq("_id", id)).first();
    if (doc == null) {
      return false;
    }

    // Default assets get soft-deleted to preserve deletion status for backfills
    if (doc.getBoolean("is_default", false) || id.startsWith("default_")) {
      collection.updateOne(Filters.eq("_id", id), Updates.set("deleted", true));
      return true;
    }

    // Non-default assets get physically deleted
    // Delete single file if present
    String filename = doc.getString("filename");
    if (filename != null) {
      deletePhysicalFile(filename);
    }

    // Delete images in set if present
    @SuppressWarnings("unchecked")
    List<Document> imagesList = (List<Document>) doc.get("images");
    if (imagesList != null) {
      for (Document imageDoc : imagesList) {
        String url = imageDoc.getString("url");
        if (url != null && url.startsWith("/assets/")) {
          String setFilename = url.substring("/assets/".length());
          deletePhysicalFile(setFilename);
        }
      }
    }

    // Delete audio items in set if present
    @SuppressWarnings("unchecked")
    List<Document> audioList = (List<Document>) doc.get("audio_entries");
    if (audioList != null) {
      for (Document audioDoc : audioList) {
        String url = audioDoc.getString("url");
        if (url != null && url.startsWith("/assets/")) {
          String setFilename = url.substring("/assets/".length());
          deletePhysicalFile(setFilename);
        }
      }
    }

    collection.deleteOne(Filters.eq("_id", id));
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
    Bson filter = Filters.eq("_id", id);
    Bson update = Updates.set("name", newName);
    long modifiedCount = collection.updateOne(filter, update).getModifiedCount();
    return modifiedCount > 0;
  }

  public AssetMessage saveImageSet(String id, String name, List<SaveImageSetEntry> entries)
      throws IOException {
    boolean isNew = (id == null || id.isEmpty());
    if (isNew) {
      id = UUID.randomUUID().toString();
    }

    List<Document> imageDocs = new ArrayList<>();
    long totalSize = 0;

    for (SaveImageSetEntry entry : entries) {
      String url = entry.getUrl();
      String entryName = entry.getName();
      int percentage = entry.getPercentage();
      String sizeStr = "";

      if (entry.getData() != null && !entry.getData().isEmpty()) {
        // New image data uploaded as part of the set
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
        // Existing image reference
        if (url.startsWith("/assets/")) {
          String filename = url.substring("/assets/".length());
          File file = new File(assetDir, filename);
          if (file.exists()) {
            totalSize += file.length();
            sizeStr = humanReadableByteCountBin(file.length());
          }
        }
      }

      imageDocs.add(
          new Document()
              .append("url", url)
              .append("percentage", percentage)
              .append("name", entryName)
              .append("size", sizeStr));
    }

    Document doc =
        new Document("_id", id)
            .append("name", name)
            .append("type", "image_set")
            .append("is_default", id.startsWith("default_"))
            .append("size", humanReadableByteCountBin(totalSize))
            .append("url", imageDocs.isEmpty() ? "" : imageDocs.get(0).getString("url"))
            .append("images", imageDocs);

    if (isNew) {
      collection.insertOne(doc);
    } else {
      collection.replaceOne(Filters.eq("_id", id), doc);
    }

    return documentToAsset(doc);
  }

  public AssetMessage saveAudioSet(String id, String name, List<SaveAudioSetEntry> entries)
      throws IOException {
    boolean isNew = (id == null || id.isEmpty());
    if (isNew) {
      id = UUID.randomUUID().toString();
    }

    List<Document> audioDocs = new ArrayList<>();
    long totalSize = 0;

    for (SaveAudioSetEntry entry : entries) {
      String url = entry.getUrl();
      String entryName = entry.getName();
      float timeSeconds = entry.getTimeSeconds();
      String sizeStr = "";

      if (entry.getData() != null && !entry.getData().isEmpty()) {
        // New sound data uploaded as part of the set
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
        // Existing sound reference
        if (url.startsWith("/assets/")) {
          String filename = url.substring("/assets/".length());
          File file = new File(assetDir, filename);
          if (file.exists()) {
            totalSize += file.length();
            sizeStr = humanReadableByteCountBin(file.length());
          }
        }
      }

      audioDocs.add(
          new Document()
              .append("url", url)
              .append("time_seconds", timeSeconds)
              .append("name", entryName)
              .append("size", sizeStr));
    }

    Document doc =
        new Document("_id", id)
            .append("name", name)
            .append("type", "audio_set")
            .append("is_default", id.startsWith("default_"))
            .append("size", humanReadableByteCountBin(totalSize))
            .append("url", audioDocs.isEmpty() ? "" : audioDocs.get(0).getString("url"))
            .append("audio_entries", audioDocs);

    if (isNew) {
      collection.insertOne(doc);
    } else {
      collection.replaceOne(Filters.eq("_id", id), doc);
    }

    return documentToAsset(doc);
  }

  public AssetMessage saveCustomRotation(
      String id, String name, int numLanes, List<CustomRotation> rotations) {
    boolean isNew = (id == null || id.isEmpty());
    if (isNew) {
      id = UUID.randomUUID().toString();
    }

    List<Document> rotationDocs = new ArrayList<>();
    for (CustomRotation rot : rotations) {
      List<Document> heatDocs = new ArrayList<>();
      for (CustomHeat heat : rot.getHeatsList()) {
        heatDocs.add(new Document("driver_indices", heat.getDriverIndicesList()));
      }
      rotationDocs.add(new Document("num_drivers", rot.getNumDrivers()).append("heats", heatDocs));
    }

    Document doc =
        new Document("_id", id)
            .append("name", name)
            .append("type", "custom_rotation")
            .append("num_lanes", numLanes)
            .append("custom_rotations", rotationDocs)
            .append("size", "0 B")
            .append("url", "");

    if (isNew) {
      collection.insertOne(doc);
    } else {
      collection.replaceOne(Filters.eq("_id", id), doc);
    }

    return documentToAsset(doc);
  }

  private AssetMessage documentToAsset(Document doc) {
    AssetMessage.Builder builder =
        AssetMessage.newBuilder()
            .setModel(Model.newBuilder().setEntityId(doc.getString("_id")).build())
            .setName(doc.getString("name"))
            .setType(doc.getString("type"))
            .setSize(doc.getString("size"))
            .setUrl(doc.getString("url") != null ? doc.getString("url") : "");

    @SuppressWarnings("unchecked")
    List<Document> imagesList = (List<Document>) doc.get("images");
    if (imagesList != null) {
      for (Document imageDoc : imagesList) {
        builder.addImages(
            ImageSetEntry.newBuilder()
                .setUrl(imageDoc.getString("url"))
                .setPercentage(imageDoc.getInteger("percentage"))
                .setName(imageDoc.getString("name"))
                .setSize(imageDoc.getString("size"))
                .build());
      }
    }

    @SuppressWarnings("unchecked")
    List<Document> audioList = (List<Document>) doc.get("audio_entries");
    if (audioList != null) {
      for (Document audioDoc : audioList) {
        builder.addAudioEntries(
            AudioSetEntry.newBuilder()
                .setUrl(audioDoc.getString("url"))
                .setTimeSeconds(
                    audioDoc.get("time_seconds") instanceof Double
                        ? ((Double) audioDoc.get("time_seconds")).floatValue()
                        : (float) audioDoc.get("time_seconds"))
                .setName(audioDoc.getString("name"))
                .setSize(audioDoc.getString("size"))
                .build());
      }
    }

    if (doc.containsKey("num_lanes")) {
      builder.setNumLanes(doc.getInteger("num_lanes"));
    }

    @SuppressWarnings("unchecked")
    List<Document> rotationList = (List<Document>) doc.get("custom_rotations");
    if (rotationList != null) {
      for (Document rotDoc : rotationList) {
        CustomRotation.Builder rotBuilder =
            CustomRotation.newBuilder().setNumDrivers(rotDoc.getInteger("num_drivers"));

        @SuppressWarnings("unchecked")
        List<Document> heatList = (List<Document>) rotDoc.get("heats");
        if (heatList != null) {
          for (Document heatDoc : heatList) {
            rotBuilder.addHeats(
                CustomHeat.newBuilder()
                    .addAllDriverIndices((List<Integer>) heatDoc.get("driver_indices"))
                    .build());
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

  public void resetAssets() {
    // 1. Clear directory
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

    // 2. Clear DB
    collection.drop();

    // 3. Clear themes collection to remove all user-created themes
    MongoCollection<Document> themes = database.getCollection("themes");
    themes.drop();

    // 3. Restore defaults
    List<ImageSetEntry> fuelImages = new ArrayList<>();
    long fuelTotalSize = 0;

    for (DefaultAsset asset : DEFAULT_IMAGE_ASSETS) {
      try {
        byte[] data = readResource("/defaults/" + asset.filename);
        saveAsset(asset.id, asset.filename, "image", data);
      } catch (IOException | NumberFormatException e) {
        logger.error("Failed to restore default asset {}", asset.filename, e);
      }
    }

    for (DefaultAsset asset : DEFAULT_FUEL_IMAGE_ASSETS) {
      try {
        byte[] data = readResource("/defaults/" + asset.filename);
        // It's a fuel gauge, part of the set
        String safeName = asset.filename.replaceAll("[^a-zA-Z0-9.-]", "_");
        String internalFilename = asset.id + "_" + safeName;
        Path path = Paths.get(assetDir, internalFilename);
        try (FileOutputStream fos = new FileOutputStream(path.toFile())) {
          fos.write(data);
        }
        String url = "/assets/" + internalFilename;
        String sizeStr = humanReadableByteCountBin(data.length);

        fuelImages.add(
            ImageSetEntry.newBuilder()
                .setUrl(url)
                .setPercentage(((FuelDefaultAsset) asset).percentage)
                .setName(asset.displayName)
                .setSize(sizeStr)
                .build());
        fuelTotalSize += data.length;
      } catch (IOException | NumberFormatException e) {
        logger.error("Failed to restore default asset {}", asset.filename, e);
      }
    }

    // Save the Fuel Gauge image set
    if (!fuelImages.isEmpty()) {
      // Images are already in descending order (100 to 0) from
      // DEFAULT_FUEL_IMAGE_ASSETS

      String id = "default_fuel-gauge-builtin";
      List<Document> imageDocs = new ArrayList<>();
      for (ImageSetEntry entry : fuelImages) {
        imageDocs.add(
            new Document()
                .append("url", entry.getUrl())
                .append("percentage", entry.getPercentage())
                .append("name", entry.getName())
                .append("size", entry.getSize()));
      }

      Document doc =
          new Document("_id", id)
              .append("name", "Fuel Gauge")
              .append("type", "image_set")
              .append("is_default", true)
              .append("size", humanReadableByteCountBin(fuelTotalSize))
              .append("url", fuelImages.get(0).getUrl()) // Use 100% (now at index 0) as thumbnail
              .append("images", imageDocs);

      collection.insertOne(doc);
    }

    List<AudioSetEntry> countdownAudio = new ArrayList<>();
    long countdownTotalSize = 0;
    String[] countdownKeys = {
      "default_countdown_5",
      "default_countdown_4",
      "default_countdown_3",
      "default_countdown_2",
      "default_countdown_1",
      "default_countdown_go"
    };
    float[] countdownTimes = {5.0f, 4.0f, 3.0f, 2.0f, 1.0f, 0.0f};

    for (int i = 0; i < countdownKeys.length; i++) {
      String assetId = countdownKeys[i];
      float time = countdownTimes[i];
      for (DefaultAsset asset : DEFAULT_AUDIO_ASSETS) {
        if (asset.id.equals(assetId)) {
          try {
            byte[] data = readResource("/defaults/" + asset.filename);
            String safeName = asset.filename.replaceAll("[^a-zA-Z0-9.-]", "_");
            String internalFilename = asset.id + "_" + safeName;
            Path path = Paths.get(assetDir, internalFilename);
            try (FileOutputStream fos = new FileOutputStream(path.toFile())) {
              fos.write(data);
            }
            String url = "/assets/" + internalFilename;
            String sizeStr = humanReadableByteCountBin(data.length);

            countdownAudio.add(
                AudioSetEntry.newBuilder()
                    .setUrl(url)
                    .setTimeSeconds(time)
                    .setName(asset.displayName)
                    .setSize(sizeStr)
                    .build());
            countdownTotalSize += data.length;
          } catch (IOException e) {
            logger.error("Failed to restore default asset {}", asset.filename, e);
          }
          break;
        }
      }
    }

    if (!countdownAudio.isEmpty()) {
      String id = "default_countdown-set";
      List<Document> audioDocs = new ArrayList<>();
      for (AudioSetEntry entry : countdownAudio) {
        audioDocs.add(
            new Document()
                .append("url", entry.getUrl())
                .append("time_seconds", entry.getTimeSeconds())
                .append("name", entry.getName())
                .append("size", entry.getSize()));
      }
      Document doc =
          new Document("_id", id)
              .append("name", "Countdown")
              .append("type", "audio_set")
              .append("is_default", true)
              .append("size", humanReadableByteCountBin(countdownTotalSize))
              .append("url", countdownAudio.get(0).getUrl())
              .append("audio_entries", audioDocs);
      collection.insertOne(doc);
    }

    List<AudioSetEntry> secondsLeftAudio = new ArrayList<>();
    long secondsLeftTotalSize = 0;
    String[] slKeysList = {
      "default_seconds_left_300",
      "default_seconds_left_240",
      "default_seconds_left_180",
      "default_seconds_left_120",
      "default_seconds_left_60",
      "default_seconds_left_30",
      "default_seconds_left_25",
      "default_seconds_left_20",
      "default_seconds_left_15",
      "default_seconds_left_10",
      "default_seconds_left_5"
    };
    float[] slTimes = {
      300.0f, 240.0f, 180.0f, 120.0f, 60.0f, 30.0f, 25.0f, 20.0f, 15.0f, 10.0f, 5.0f
    };

    for (int i = 0; i < slKeysList.length; i++) {
      String assetId = slKeysList[i];
      float time = slTimes[i];
      for (DefaultAsset asset : DEFAULT_AUDIO_ASSETS) {
        if (asset.id.equals(assetId)) {
          try {
            byte[] data = readResource("/defaults/" + asset.filename);
            String safeName = asset.filename.replaceAll("[^a-zA-Z0-9.-]", "_");
            String internalFilename = asset.id + "_" + safeName;
            Path path = Paths.get(assetDir, internalFilename);
            try (FileOutputStream fos = new FileOutputStream(path.toFile())) {
              fos.write(data);
            }
            String url = "/assets/" + internalFilename;
            String sizeStr = humanReadableByteCountBin(data.length);

            secondsLeftAudio.add(
                AudioSetEntry.newBuilder()
                    .setUrl(url)
                    .setTimeSeconds(time)
                    .setName(asset.displayName)
                    .setSize(sizeStr)
                    .build());
            secondsLeftTotalSize += data.length;
          } catch (IOException e) {
            logger.error("Failed to restore default asset {}", asset.filename, e);
          }
          break;
        }
      }
    }

    if (!secondsLeftAudio.isEmpty()) {
      String id = "default_seconds-left-set";
      List<Document> audioDocs = new ArrayList<>();
      for (AudioSetEntry entry : secondsLeftAudio) {
        audioDocs.add(
            new Document()
                .append("url", entry.getUrl())
                .append("time_seconds", entry.getTimeSeconds())
                .append("name", entry.getName())
                .append("size", entry.getSize()));
      }
      Document doc =
          new Document("_id", id)
              .append("name", "Seconds Left")
              .append("type", "audio_set")
              .append("is_default", true)
              .append("size", humanReadableByteCountBin(secondsLeftTotalSize))
              .append("url", secondsLeftAudio.get(0).getUrl())
              .append("audio_entries", audioDocs);
      collection.insertOne(doc);
    }

    for (DefaultAsset asset : DEFAULT_AUDIO_ASSETS) {
      if (EXCLUDED_AUDIO_IDS.contains(asset.id)) continue;
      try {
        saveAsset(
            asset.id, asset.displayName, "sound", readResource("/defaults/" + asset.filename));
      } catch (IOException e) {
        logger.error("Failed to restore default asset {}", asset.filename, e);
      }
    }

    // 4. Backfill default theme
    backfillDefaultTheme();

    // 5. Ensure all themes have the necessary slots
    backfillThemeSlots();
  }

  public void backfillDefaults() {
    try {
      List<ImageSetEntry> fuelImages = new ArrayList<>();
      long fuelTotalSize = 0;

      for (DefaultAsset asset : DEFAULT_IMAGE_ASSETS) {
        Document existing = collection.find(Filters.eq("_id", asset.id)).first();
        if (existing != null) {
          if (!asset.displayName.equals(existing.getString("name"))) {
            collection.updateOne(
                Filters.eq("_id", asset.id), Updates.set("name", asset.displayName));
          }
          continue;
        }
        try {
          byte[] data = readResource("/defaults/" + asset.filename);
          saveAsset(asset.id, asset.filename, "image", data);
        } catch (IOException | NumberFormatException e) {
          logger.error("Failed to backfill default asset {}", asset.filename, e);
        }
      }

      String fuelId = "default_fuel-gauge-builtin";
      if (collection.find(Filters.eq("_id", fuelId)).first() == null) {
        for (DefaultAsset asset : DEFAULT_FUEL_IMAGE_ASSETS) {
          try {
            byte[] data = readResource("/defaults/" + asset.filename);
            String safeName = asset.filename.replaceAll("[^a-zA-Z0-9.-]", "_");
            String internalFilename = asset.id + "_" + safeName;
            Path path = Paths.get(assetDir, internalFilename);
            try (FileOutputStream fos = new FileOutputStream(path.toFile())) {
              fos.write(data);
            }
            String url = "/assets/" + internalFilename;
            String sizeStr = humanReadableByteCountBin(data.length);

            fuelImages.add(
                ImageSetEntry.newBuilder()
                    .setUrl(url)
                    .setPercentage(((FuelDefaultAsset) asset).percentage)
                    .setName(asset.displayName)
                    .setSize(sizeStr)
                    .build());
            fuelTotalSize += data.length;
          } catch (IOException | NumberFormatException e) {
            logger.error("Failed to backfill default asset {}", asset.filename, e);
          }
        }

        // Save the Fuel Gauge image set
        if (!fuelImages.isEmpty()) {
          List<Document> imageDocs = new ArrayList<>();
          for (ImageSetEntry entry : fuelImages) {
            imageDocs.add(
                new Document()
                    .append("url", entry.getUrl())
                    .append("percentage", entry.getPercentage())
                    .append("name", entry.getName())
                    .append("size", entry.getSize()));
          }

          Document doc =
              new Document("_id", fuelId)
                  .append("name", "Fuel Gauge")
                  .append("type", "image_set")
                  .append("is_default", true)
                  .append("size", humanReadableByteCountBin(fuelTotalSize))
                  .append("url", fuelImages.get(0).getUrl())
                  .append("images", imageDocs);

          collection.insertOne(doc);
        }
      }

      String countdownSetId = "default_countdown-set";
      if (collection.find(Filters.eq("_id", countdownSetId)).first() == null) {
        List<AudioSetEntry> countdownAudio = new ArrayList<>();
        long countdownTotalSize = 0;
        String[] countdownKeys = {
          "default_countdown_5",
          "default_countdown_4",
          "default_countdown_3",
          "default_countdown_2",
          "default_countdown_1",
          "default_countdown_go"
        };
        float[] countdownTimes = {5.0f, 4.0f, 3.0f, 2.0f, 1.0f, 0.0f};

        for (int i = 0; i < countdownKeys.length; i++) {
          String assetId = countdownKeys[i];
          float time = countdownTimes[i];
          for (DefaultAsset asset : DEFAULT_AUDIO_ASSETS) {
            if (asset.id.equals(assetId)) {
              try {
                byte[] data = readResource("/defaults/" + asset.filename);
                String safeName = asset.filename.replaceAll("[^a-zA-Z0-9.-]", "_");
                String internalFilename = asset.id + "_" + safeName;
                Path path = Paths.get(assetDir, internalFilename);
                try (FileOutputStream fos = new FileOutputStream(path.toFile())) {
                  fos.write(data);
                }
                String url = "/assets/" + internalFilename;
                String sizeStr = humanReadableByteCountBin(data.length);

                countdownAudio.add(
                    AudioSetEntry.newBuilder()
                        .setUrl(url)
                        .setTimeSeconds(time)
                        .setName(asset.displayName)
                        .setSize(sizeStr)
                        .build());
                countdownTotalSize += data.length;
              } catch (IOException e) {
                logger.error("Failed to backfill default asset {}", asset.filename, e);
              }
              break;
            }
          }
        }

        if (!countdownAudio.isEmpty()) {
          List<Document> audioDocs = new ArrayList<>();
          for (AudioSetEntry entry : countdownAudio) {
            audioDocs.add(
                new Document()
                    .append("url", entry.getUrl())
                    .append("time_seconds", entry.getTimeSeconds())
                    .append("name", entry.getName())
                    .append("size", entry.getSize()));
          }
          Document doc =
              new Document("_id", countdownSetId)
                  .append("name", "Countdown")
                  .append("type", "audio_set")
                  .append("is_default", true)
                  .append("size", humanReadableByteCountBin(countdownTotalSize))
                  .append("url", countdownAudio.get(0).getUrl())
                  .append("audio_entries", audioDocs);
          collection.insertOne(doc);
        }
      }

      String slSetId = "default_seconds-left-set";
      if (collection.find(Filters.eq("_id", slSetId)).first() == null) {
        List<AudioSetEntry> secondsLeftAudio = new ArrayList<>();
        long secondsLeftTotalSize = 0;
        String[] slKeysList = {
          "default_seconds_left_300",
          "default_seconds_left_240",
          "default_seconds_left_180",
          "default_seconds_left_120",
          "default_seconds_left_60",
          "default_seconds_left_30",
          "default_seconds_left_25",
          "default_seconds_left_20",
          "default_seconds_left_15",
          "default_seconds_left_10",
          "default_seconds_left_5"
        };
        float[] slTimes = {
          300.0f, 240.0f, 180.0f, 120.0f, 60.0f, 30.0f, 25.0f, 20.0f, 15.0f, 10.0f, 5.0f
        };

        for (int i = 0; i < slKeysList.length; i++) {
          String assetId = slKeysList[i];
          float time = slTimes[i];
          for (DefaultAsset asset : DEFAULT_AUDIO_ASSETS) {
            if (asset.id.equals(assetId)) {
              try {
                byte[] data = readResource("/defaults/" + asset.filename);
                String safeName = asset.filename.replaceAll("[^a-zA-Z0-9.-]", "_");
                String internalFilename = asset.id + "_" + safeName;
                Path path = Paths.get(assetDir, internalFilename);
                try (FileOutputStream fos = new FileOutputStream(path.toFile())) {
                  fos.write(data);
                }
                String url = "/assets/" + internalFilename;
                String sizeStr = humanReadableByteCountBin(data.length);

                secondsLeftAudio.add(
                    AudioSetEntry.newBuilder()
                        .setUrl(url)
                        .setTimeSeconds(time)
                        .setName(asset.displayName)
                        .setSize(sizeStr)
                        .build());
                secondsLeftTotalSize += data.length;
              } catch (IOException e) {
                logger.error("Failed to backfill default asset {}", asset.filename, e);
              }
              break;
            }
          }
        }

        if (!secondsLeftAudio.isEmpty()) {
          List<Document> audioDocs = new ArrayList<>();
          for (AudioSetEntry entry : secondsLeftAudio) {
            audioDocs.add(
                new Document()
                    .append("url", entry.getUrl())
                    .append("time_seconds", entry.getTimeSeconds())
                    .append("name", entry.getName())
                    .append("size", entry.getSize()));
          }
          Document doc =
              new Document("_id", slSetId)
                  .append("name", "Seconds Left")
                  .append("type", "audio_set")
                  .append("is_default", true)
                  .append("size", humanReadableByteCountBin(secondsLeftTotalSize))
                  .append("url", secondsLeftAudio.get(0).getUrl())
                  .append("audio_entries", audioDocs);
          collection.insertOne(doc);
        }
      }

      for (DefaultAsset asset : DEFAULT_AUDIO_ASSETS) {
        if (EXCLUDED_AUDIO_IDS.contains(asset.id)) continue;
        Document existing = collection.find(Filters.eq("_id", asset.id)).first();
        if (existing != null) {
          if (!asset.displayName.equals(existing.getString("name"))) {
            collection.updateOne(
                Filters.eq("_id", asset.id), Updates.set("name", asset.displayName));
          }
          continue;
        }
        try {
          saveAsset(
              asset.id, asset.displayName, "sound", readResource("/defaults/" + asset.filename));
        } catch (IOException e) {
          logger.error("Failed to backfill default asset {}", asset.filename, e);
        }
      }

      // Cleanup: Remove individual assets that are now in sets
      for (String id : EXCLUDED_AUDIO_IDS) {
        deleteAsset(id);
      }

      // Backfill default theme
      backfillDefaultTheme();

      // Ensure all themes have the new audio slot
      backfillThemeSlots();
    } catch (Exception e) {
      logger.error("Error in backfillDefaults", e);
    }
  }

  /** Ensures all themes have the 'audio.yellowflag' slot in the audio_slots map. */
  public void backfillThemeSlots() {
    MongoCollection<Document> themes = database.getCollection("themes");
    for (Document theme : themes.find()) {
      Document slots = (Document) theme.get("slots");
      Document audioSlots = (Document) theme.get("audio_slots");
      if (audioSlots == null) {
        audioSlots = new Document();
      }
      if (slots == null) {
        slots = new Document();
      }

      boolean changed = false;

      // 1. Repair and Flatten slots (remove nested Documents caused by dot-notation confusion)
      List<Bson> toUnset = new ArrayList<>();
      Document newSlots = new Document();
      for (String key : slots.keySet()) {
        Object value = slots.get(key);
        if (value instanceof Document) {
          Document nested = (Document) value;
          for (String subKey : nested.keySet()) {
            newSlots.put(key + "." + subKey, nested.get(subKey).toString());
          }
          toUnset.add(Updates.unset("slots." + key));
          changed = true;
        } else if (value != null) {
          newSlots.put(key, value.toString());
        }
      }
      slots = newSlots;

      // To avoid Error 40 (path conflict), we must unset nested documents before setting sub-paths
      // if they are in the same parent path. Splitting into two updates ensures no conflict.
      if (!toUnset.isEmpty()) {
        themes.updateOne(Filters.eq("_id", theme.get("_id")), Updates.combine(toUnset));
      }

      // 2. Migration: Move from slots to audio_slots if present
      if (slots.containsKey("audio.yellowflag")) {
        Object val = slots.get("audio.yellowflag");
        if (val instanceof String) {
          String assetId = (String) val;
          if (!audioSlots.containsKey("audio.yellowflag")) {
            audioSlots.append(
                "audio.yellowflag", new Document("type", "preset").append("url", assetId));
            changed = true;
          }
        }
        slots.remove("audio.yellowflag");
        changed = true;
      }

      // 3. Migration: Replace countdown and seconds_left with audio sets
      String[] oldCountdownKeys = {
        "audio.countdown.5",
        "audio.countdown.4",
        "audio.countdown.3",
        "audio.countdown.2",
        "audio.countdown.1",
        "audio.countdown.go"
      };
      boolean hadOldCountdown = false;
      for (String k : oldCountdownKeys) {
        if (slots.containsKey(k)) {
          slots.remove(k);
          hadOldCountdown = true;
        }
      }
      if (hadOldCountdown || !audioSlots.containsKey("audio.countdown")) {
        audioSlots.put(
            "audio.countdown",
            new Document("type", "audio_set").append("url", "default_countdown-set"));
        changed = true;
      }

      String[] oldSlKeys = {
        "audio.seconds_left.300",
        "audio.seconds_left_240",
        "audio.seconds_left_180",
        "audio.seconds_left_120",
        "audio.seconds_left_60",
        "audio.seconds_left_30",
        "audio.seconds_left_25",
        "audio.seconds_left_20",
        "audio.seconds_left_15",
        "audio.seconds_left_10",
        "audio.seconds_left_5"
      };
      boolean hadOldSl = false;
      for (String k : oldSlKeys) {
        if (slots.containsKey(k)) {
          slots.remove(k);
          hadOldSl = true;
        }
      }
      if (hadOldSl || !audioSlots.containsKey("audio.seconds_left")) {
        audioSlots.put(
            "audio.seconds_left",
            new Document("type", "audio_set").append("url", "default_seconds-left-set"));
        changed = true;
      }

      // 4. Migration: Rename audio.heat.halfway to audio.seconds_left.halfway
      if (audioSlots.containsKey("audio.heat.halfway")) {
        Object val = audioSlots.get("audio.heat.halfway");
        audioSlots.append("audio.seconds_left.halfway", val);
        audioSlots.remove("audio.heat.halfway");
        changed = true;
      }

      // 5. Cleanup individual audio assets that might be lingering in slots
      String[] legacyIdsToRemove = {
        "audio.countdown.5",
        "audio.countdown.4",
        "audio.countdown.3",
        "audio.countdown.2",
        "audio.countdown.1",
        "audio.countdown.go",
        "audio.seconds_left_300",
        "audio.seconds_left_240",
        "audio.seconds_left_180",
        "audio.seconds_left_120",
        "audio.seconds_left_60",
        "audio.seconds_left_30",
        "audio.seconds_left_25",
        "audio.seconds_left_20",
        "audio.seconds_left_15",
        "audio.seconds_left_10",
        "audio.seconds_left_5"
      };
      for (String lid : legacyIdsToRemove) {
        if (slots.containsKey(lid)) {
          slots.remove(lid);
          changed = true;
        }
      }

      // 6. Migration: Ensure gauge.fuel is present
      if (!slots.containsKey("gauge.fuel")) {
        slots.append("gauge.fuel", "default_fuel-gauge-builtin");
        changed = true;
      }

      if (changed) {
        themes.updateOne(
            Filters.eq("_id", theme.get("_id")),
            Updates.combine(Updates.set("slots", slots), Updates.set("audio_slots", audioSlots)));
      }
    }
  }

  /**
   * Creates the "RaceCoordinator AI (default)" default theme if it doesn't already exist. This
   * theme maps all built-in asset slots (flags, start lamps, fuel gauge) to their default asset
   * IDs.
   */
  void backfillDefaultTheme() {
    MongoCollection<Document> themes = database.getCollection("themes");
    String themeId = "default_classic_rc_ai";

    // Migration: Remove any legacy theme document.
    themes.deleteOne(Filters.eq("entity_id", themeId));

    // Check if default theme already exists by name to prevent duplicates
    if (themes.find(Filters.eq("name", "RaceCoordinator AI")).first() != null) {
      return; // Already exists with proper name
    }

    Document slots = new Document();
    // Flags
    slots.append("flag.green", "default_flag_green");
    slots.append("flag.red", "default_flag_red");
    slots.append("flag.yellow", "default_flag_yellow");
    slots.append("flag.yellowgreen", "default_flag_green_yellow");
    slots.append("flag.white", "default_flag_white");
    slots.append("flag.checkered", "default_flag_checkered");
    slots.append("flag.black", "default_flag_black");
    // Start lamps
    slots.append("lamp.red.on", "default_start_red_on");
    slots.append("lamp.red.dim", "default_start_red_dim");
    slots.append("lamp.green", "default_start_green");
    // Fuel gauge
    slots.append("gauge.fuel", "default_fuel-gauge-builtin");

    Document audioSlots = new Document();
    // Audio
    audioSlots.append(
        "audio.yellowflag", new Document("type", "preset").append("url", "default_yellow_flag"));
    audioSlots.append(
        "audio.seconds_left.halfway",
        new Document("type", "preset").append("url", "default_heat_half"));
    audioSlots.append(
        "audio.countdown",
        new Document("type", "audio_set").append("url", "default_countdown-set"));
    audioSlots.append(
        "audio.seconds_left",
        new Document("type", "audio_set").append("url", "default_seconds-left-set"));

    Document theme =
        new Document()
            .append("entity_id", themeId)
            .append("name", "RaceCoordinator AI (default)")
            .append("is_default", true)
            .append("slots", slots)
            .append("audio_slots", audioSlots);

    themes.insertOne(theme);
    logger.info("Default theme 'RaceCoordinator AI (default)' created.");
  }
}
