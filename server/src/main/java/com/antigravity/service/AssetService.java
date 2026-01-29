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
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class AssetService {

  private final String assetDir;
  private final MongoCollection<Document> collection;

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
    for (int i = 1; i <= 6; i++) {
      String filename = "default_avatar_helmet_" + i + ".png";
      try (InputStream is = getClass().getResourceAsStream("/defaults/" + filename)) {
        if (is != null) {
          // Read all bytes
          java.io.ByteArrayOutputStream buffer = new java.io.ByteArrayOutputStream();
          int nRead;
          byte[] data = new byte[1024];
          while ((nRead = is.read(data, 0, data.length)) != -1) {
            buffer.write(data, 0, nRead);
          }
          buffer.flush();
          saveAsset("Helmet " + i, "image", buffer.toByteArray());
          System.out.println("Restored default asset: " + filename);
        } else {
          System.err.println("Default asset validation failed: Resource not found for " + filename);
        }
      } catch (IOException e) {
        System.err.println("Failed to restore default asset " + filename + ": " + e.getMessage());
        e.printStackTrace();
      }
    }
  }
}
