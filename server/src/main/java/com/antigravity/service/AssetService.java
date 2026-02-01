package com.antigravity.service;

import com.antigravity.proto.Asset;
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
  }

  private static final List<DefaultAsset> DEFAULT_AUDIO_ASSETS = new ArrayList<>();
  static {
    DEFAULT_AUDIO_ASSETS.add(new DefaultAsset("beep.wav", "Lap Beep"));
    DEFAULT_AUDIO_ASSETS.add(new DefaultAsset("chimes.wav", "Lap Chimes"));
    DEFAULT_AUDIO_ASSETS.add(new DefaultAsset("driveby.wav", "Lap Driveby"));
  }

  public AssetService(MongoDatabase database) {
    this(database, "data/assets");
  }

  public AssetService(MongoDatabase database, String assetDir) {
    this.collection = database.getCollection("assets");
    this.assetDir = assetDir;
    File directory = new File(assetDir);
    if (!directory.exists()) {
      boolean created = directory.mkdirs();
      if (!created) {
        System.err.println("Failed to create asset directory: " + assetDir);
      }
    }
  }

  public String getAssetDir() {
    return assetDir;
  }

  public List<Asset> getAllAssets() {
    List<Asset> assets = new ArrayList<>();
    for (Document doc : collection.find()) {
      assets.add(documentToAsset(doc));
    }
    return assets;
  }

  public Asset saveAsset(String name, String type, byte[] data) throws IOException {
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

    String filename = doc.getString("filename");
    if (filename != null) {
      File file = new File(assetDir, filename);
      if (file.exists()) {
        if (!file.delete()) {
          System.err.println("Failed to delete file: " + file.getAbsolutePath());
          // Continue to delete metadata? Yes.
        }
      }
    }

    collection.deleteOne(Filters.eq("_id", id));
    return true;
  }

  public boolean renameAsset(String id, String newName) {
    Bson filter = Filters.eq("_id", id);
    Bson update = Updates.set("name", newName);
    long modifiedCount = collection.updateOne(filter, update).getModifiedCount();
    return modifiedCount > 0;
  }

  private Asset documentToAsset(Document doc) {
    return Asset.newBuilder()
        .setModel(com.antigravity.proto.Model.newBuilder().setEntityId(doc.getString("_id")).build())
        .setName(doc.getString("name"))
        .setType(doc.getString("type"))
        .setSize(doc.getString("size"))
        .setUrl(doc.getString("url"))
        .build();
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
    for (DefaultAsset asset : DEFAULT_IMAGE_ASSETS) {
      try {
        saveAsset(asset.displayName, "image", readResource("/defaults/" + asset.filename));
      } catch (IOException e) {
        System.err.println("Failed to restore default asset " + asset.filename + ": " + e.getMessage());
      }
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
