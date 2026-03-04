package com.antigravity.service;

import com.antigravity.proto.AssetMessage;
import com.antigravity.proto.ImageSetEntry;
import com.antigravity.proto.SaveImageSetEntry;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Updates;
import org.bson.Document;
import org.bson.conversions.Bson;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class AssetService {

  private final String assetDir;
  private final MongoCollection<Document> collection;

  private static class DefaultAsset {
    final String filename;
    final String displayName;

    DefaultAsset(String filename, String displayName) {
      this.filename = filename;
      this.displayName = displayName;
    }
  }

  private static class FuelDefaultAsset extends DefaultAsset {
    final int percentage;

    FuelDefaultAsset(String filename, String displayName, int percentage) {
      super(filename, displayName);
      this.percentage = percentage;
    }
  }

  private static final List<DefaultAsset> DEFAULT_IMAGE_ASSETS = new ArrayList<>();
  static {
    DEFAULT_IMAGE_ASSETS.add(new DefaultAsset("default_avatar_helmet_4.png", "Helmet Futuristic 1"));
    DEFAULT_IMAGE_ASSETS.add(new DefaultAsset("default_avatar_helmet_5.png", "Helmet Futuristic 2"));
    DEFAULT_IMAGE_ASSETS.add(new DefaultAsset("green-white.png", "Helmet Green-White"));
    DEFAULT_IMAGE_ASSETS.add(new DefaultAsset("grey-black-gold.png", "Helmet Grey-Black-Gold"));
    DEFAULT_IMAGE_ASSETS.add(new DefaultAsset("grey-red-white.png", "Helmet Grey-Red-White"));
    DEFAULT_IMAGE_ASSETS.add(new DefaultAsset("orange-blue.png", "Helmet Orange-Blue"));
    DEFAULT_IMAGE_ASSETS.add(new DefaultAsset("red-gold-blue.png", "Helmet Red-Gold-Blue"));
    DEFAULT_IMAGE_ASSETS.add(new DefaultAsset("red-orange.png", "Helmet Red-Orange"));
    DEFAULT_IMAGE_ASSETS.add(new DefaultAsset("red-yellow.png", "Helmet Red-Yellow"));
    DEFAULT_IMAGE_ASSETS.add(new DefaultAsset("silver-green.png", "Helmet Silver-Green"));
    DEFAULT_IMAGE_ASSETS.add(new DefaultAsset("silver-red.png", "Helmet Silver-Red"));
    DEFAULT_IMAGE_ASSETS.add(new DefaultAsset("white-blue-yellow.png", "Helmet White-Blue-Yellow"));
    DEFAULT_IMAGE_ASSETS.add(new DefaultAsset("white-blue.png", "Helmet White-Blue"));
    DEFAULT_IMAGE_ASSETS.add(new DefaultAsset("white-red-yellow.png", "Helmet White-Red-Yellow"));
    DEFAULT_IMAGE_ASSETS.add(new DefaultAsset("black-grey.png", "Helmet Black-Grey"));
    DEFAULT_IMAGE_ASSETS.add(new DefaultAsset("black-white.png", "Helmet Black-White"));
    DEFAULT_IMAGE_ASSETS.add(new DefaultAsset("black-white2.png", "Helmet Black-White2"));
    DEFAULT_IMAGE_ASSETS.add(new DefaultAsset("black.png", "Helmet Black"));
    DEFAULT_IMAGE_ASSETS.add(new DefaultAsset("flag_green.png", "Green Flag"));
    DEFAULT_IMAGE_ASSETS.add(new DefaultAsset("flag_red.png", "Red Flag"));
    DEFAULT_IMAGE_ASSETS.add(new DefaultAsset("flag_yellow.png", "Yellow Flag"));
    DEFAULT_IMAGE_ASSETS.add(new DefaultAsset("flag_black.png", "Black Flag"));
    DEFAULT_IMAGE_ASSETS.add(new DefaultAsset("flag_white.png", "White Flag"));
    DEFAULT_IMAGE_ASSETS.add(new DefaultAsset("flag_checkered.png", "Checkered Flag"));
  }

  private static final List<FuelDefaultAsset> DEFAULT_FUEL_IMAGE_ASSETS = new ArrayList<>();
  static {
    // TODO(aufderheide): For now the order here controls how it animates
    // in the asset editor. The order shouldn't matter.
    DEFAULT_FUEL_IMAGE_ASSETS.add(new FuelDefaultAsset("fuel_100.png", "Fuel Gauge 100%", 100));
    DEFAULT_FUEL_IMAGE_ASSETS.add(new FuelDefaultAsset("fuel_90.png", "Fuel Gauge 90%", 90));
    DEFAULT_FUEL_IMAGE_ASSETS.add(new FuelDefaultAsset("fuel_80.png", "Fuel Gauge 80%", 80));
    DEFAULT_FUEL_IMAGE_ASSETS.add(new FuelDefaultAsset("fuel_70.png", "Fuel Gauge 70%", 70));
    DEFAULT_FUEL_IMAGE_ASSETS.add(new FuelDefaultAsset("fuel_60.png", "Fuel Gauge 60%", 60));
    DEFAULT_FUEL_IMAGE_ASSETS.add(new FuelDefaultAsset("fuel_50.png", "Fuel Gauge 50%", 50));
    DEFAULT_FUEL_IMAGE_ASSETS.add(new FuelDefaultAsset("fuel_40.png", "Fuel Gauge 40%", 40));
    DEFAULT_FUEL_IMAGE_ASSETS.add(new FuelDefaultAsset("fuel_30.png", "Fuel Gauge 30%", 30));
    DEFAULT_FUEL_IMAGE_ASSETS.add(new FuelDefaultAsset("fuel_20.png", "Fuel Gauge 20%", 20));
    DEFAULT_FUEL_IMAGE_ASSETS.add(new FuelDefaultAsset("fuel_10.png", "Fuel Gauge 10%", 10));
    DEFAULT_FUEL_IMAGE_ASSETS.add(new FuelDefaultAsset("fuel_0.png", "Fuel Gauge 0%", 0));
  }

  private static final List<DefaultAsset> DEFAULT_AUDIO_ASSETS = new ArrayList<>();
  static {
    DEFAULT_AUDIO_ASSETS.add(new DefaultAsset("beep.wav", "Lap Beep"));
    DEFAULT_AUDIO_ASSETS.add(new DefaultAsset("chimes.wav", "Lap Chimes"));
    DEFAULT_AUDIO_ASSETS.add(new DefaultAsset("driveby.wav", "Lap Driveby"));
  }

  public AssetService(MongoDatabase database, String assetDir) {
    this.collection = database.getCollection("assets");
    this.assetDir = assetDir;
    File directory = new File(assetDir);
    System.out.println(
        "Path DEBUG: AssetService constructor. assetDir=" + assetDir + " absolute=" + directory.getAbsolutePath());
    if (!directory.exists()) {
      boolean created = directory.mkdirs();
      if (!created) {
        System.err.println("CRITICAL: Failed to create asset directory: " + directory.getAbsolutePath());
      } else {
        System.out.println("Created asset directory: " + directory.getAbsolutePath());
      }
    }
  }

  public String getAssetDir() {
    return assetDir;
  }

  public List<AssetMessage> getAllAssets() {
    List<AssetMessage> assets = new ArrayList<>();
    for (Document doc : collection.find()) {
      assets.add(documentToAsset(doc));
    }
    return assets;
  }

  public AssetMessage saveAsset(String name, String type, byte[] data) throws IOException {
    String id = UUID.randomUUID().toString();
    // Simple sanitization
    String safeName = name.replaceAll("[^a-zA-Z0-9.-]", "_");
    String filename = id + "_" + safeName;
    Path path = Paths.get(assetDir, filename);

    try (FileOutputStream fos = new FileOutputStream(path.toFile())) {
      fos.write(data);
    }

    String sizeStr = humanReadableByteCountBin(data.length);
    String url = "/assets/" + filename; // Assuming static file serving is set up or we add a handler

    Document doc = new Document("_id", id)
        .append("name", name)
        .append("type", type)
        .append("size", sizeStr)
        .append("filename", filename) // Store internal filename
        .append("url", url);

    collection.insertOne(doc);

    return documentToAsset(doc);
  }

  public boolean deleteAsset(String id) {
    Document doc = collection.find(Filters.eq("_id", id)).first();
    if (doc == null)
      return false;

    // Delete single file if present
    String filename = doc.getString("filename");
    if (filename != null) {
      deletePhysicalFile(filename);
    }

    // Delete images in set if present
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

    collection.deleteOne(Filters.eq("_id", id));
    return true;
  }

  private void deletePhysicalFile(String filename) {
    File file = new File(assetDir, filename);
    if (file.exists()) {
      if (!file.delete()) {
        System.err.println("Failed to delete file: " + file.getAbsolutePath());
      }
    }
  }

  public boolean renameAsset(String id, String newName) {
    Bson filter = Filters.eq("_id", id);
    Bson update = Updates.set("name", newName);
    long modifiedCount = collection.updateOne(filter, update).getModifiedCount();
    return modifiedCount > 0;
  }

  public AssetMessage saveImageSet(String id, String name, List<SaveImageSetEntry> entries) throws IOException {
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

      imageDocs.add(new Document()
          .append("url", url)
          .append("percentage", percentage)
          .append("name", entryName)
          .append("size", sizeStr));
    }

    Document doc = new Document("_id", id)
        .append("name", name)
        .append("type", "image_set")
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

  private AssetMessage documentToAsset(Document doc) {
    AssetMessage.Builder builder = AssetMessage.newBuilder()
        .setModel(com.antigravity.proto.Model.newBuilder().setEntityId(doc.getString("_id")).build())
        .setName(doc.getString("name"))
        .setType(doc.getString("type"))
        .setSize(doc.getString("size"))
        .setUrl(doc.getString("url") != null ? doc.getString("url") : "");

    List<Document> imagesList = (List<Document>) doc.get("images");
    if (imagesList != null) {
      for (Document imageDoc : imagesList) {
        builder.addImages(ImageSetEntry.newBuilder()
            .setUrl(imageDoc.getString("url"))
            .setPercentage(imageDoc.getInteger("percentage"))
            .setName(imageDoc.getString("name"))
            .setSize(imageDoc.getString("size"))
            .build());
      }
    }

    return builder.build();
  }

  private byte[] readResource(String path) throws IOException {
    try (InputStream is = getClass().getResourceAsStream(path)) {
      if (is == null) {
        throw new IOException("Resource not found: " + path);
      }
      java.io.ByteArrayOutputStream buffer = new java.io.ByteArrayOutputStream();
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
    java.text.CharacterIterator ci = new java.text.StringCharacterIterator("KMGTPE");
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
            System.err.println("Failed to delete file during reset: " + file.getAbsolutePath());
          }
        }
      }
    }

    // 2. Clear DB
    collection.drop();

    // 3. Restore defaults
    List<ImageSetEntry> fuelImages = new ArrayList<>();
    long fuelTotalSize = 0;

    for (DefaultAsset asset : DEFAULT_IMAGE_ASSETS) {
      try {
        byte[] data = readResource("/defaults/" + asset.filename);
        saveAsset(asset.displayName, "image", data);
      } catch (IOException | NumberFormatException e) {
        System.err.println("Failed to restore default asset " + asset.filename + ": " + e.getMessage());
      }
    }

    for (FuelDefaultAsset asset : DEFAULT_FUEL_IMAGE_ASSETS) {
      try {
        byte[] data = readResource("/defaults/" + asset.filename);
        // It's a fuel gauge, part of the set
        String id = UUID.randomUUID().toString();
        String safeName = asset.displayName.replaceAll("[^a-zA-Z0-9.-]", "_");
        String internalFilename = id + "_" + safeName;
        Path path = Paths.get(assetDir, internalFilename);
        try (FileOutputStream fos = new FileOutputStream(path.toFile())) {
          fos.write(data);
        }
        String url = "/assets/" + internalFilename;
        String sizeStr = humanReadableByteCountBin(data.length);

        fuelImages.add(ImageSetEntry.newBuilder()
            .setUrl(url)
            .setPercentage(asset.percentage)
            .setName(asset.displayName)
            .setSize(sizeStr)
            .build());
        fuelTotalSize += data.length;
      } catch (IOException | NumberFormatException e) {
        System.err.println("Failed to restore default asset " + asset.filename + ": " + e.getMessage());
      }
    }

    // Save the Fuel Gauge image set
    if (!fuelImages.isEmpty()) {
      // Images are already in descending order (100 to 0) from
      // DEFAULT_FUEL_IMAGE_ASSETS

      String id = "fuel-gauge-builtin";
      List<Document> imageDocs = new ArrayList<>();
      for (ImageSetEntry entry : fuelImages) {
        imageDocs.add(new Document()
            .append("url", entry.getUrl())
            .append("percentage", entry.getPercentage())
            .append("name", entry.getName())
            .append("size", entry.getSize()));
      }

      Document doc = new Document("_id", id)
          .append("name", "Fuel Gauge")
          .append("type", "image_set")
          .append("size", humanReadableByteCountBin(fuelTotalSize))
          .append("url", fuelImages.get(0).getUrl()) // Use 100% (now at index 0) as thumbnail
          .append("images", imageDocs);

      collection.insertOne(doc);
    }

    for (DefaultAsset asset : DEFAULT_AUDIO_ASSETS) {
      try {
        saveAsset(asset.displayName, "sound", readResource("/defaults/" + asset.filename));
      } catch (IOException e) {
        System.err.println("Failed to restore default asset " + asset.filename + ": " + e.getMessage());
      }
    }
  }
}
