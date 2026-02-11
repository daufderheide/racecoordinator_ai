package com.antigravity.context;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.MongoIterable;
import java.io.*;
import java.util.ArrayList;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;
import org.bson.Document;

public class DatabaseContext {
  private final MongoClient mongoClient;
  private volatile MongoDatabase currentDatabase;
  private volatile String currentDatabaseName;
  private final com.antigravity.service.ServerConfigService configService;
  private String dataRoot = "data/";

  public void setDataRoot(String dataRoot) {
    this.dataRoot = dataRoot.endsWith("/") ? dataRoot : dataRoot + "/";
  }

  public DatabaseContext(MongoClient mongoClient, String initialDatabaseName,
      com.antigravity.service.ServerConfigService configService) {
    this.mongoClient = mongoClient;
    this.configService = configService;
    this.switchDatabase(initialDatabaseName);
  }

  public synchronized MongoDatabase getDatabase() {
    return currentDatabase;
  }

  public synchronized String getCurrentDatabaseName() {
    return currentDatabaseName;
  }

  public synchronized void switchDatabase(String databaseName) {
    this.currentDatabaseName = databaseName;
    this.currentDatabase = mongoClient.getDatabase(databaseName);
    if (this.configService != null) {
      this.configService.setLastActiveDatabase(databaseName);
    }
    System.out.println("Switched context to database: " + databaseName);
  }

  public void createDatabase(String databaseName) {
    MongoDatabase db = mongoClient.getDatabase(databaseName);
    // Create a dummy collection to ensure the DB file is created by Mongo
    // check if it exists first? No, createCollection ensures it.
    // Actually, just inserting a doc into a collection is enough.
    // Let's create a 'system_info' collection
    try {
      db.createCollection("system_info");
      Document info = new Document("created_at", System.currentTimeMillis());
      db.getCollection("system_info").insertOne(info);
    } catch (Exception e) {
      // Might already exist, ignore
    }
    // Ensure assets directory exists for the new database
    new java.io.File(dataRoot + databaseName + "/assets").mkdirs();
    System.out.println("Created database: " + databaseName);
  }

  public List<String> listDatabases() {
    List<String> dbs = new ArrayList<>();
    mongoClient.listDatabaseNames().forEach(dbs::add);
    java.util.Collections.sort(dbs);
    return dbs;
  }

  public void copyDatabase(String sourceDbName, String targetDbName) {
    MongoDatabase source = mongoClient.getDatabase(sourceDbName);
    MongoDatabase target = mongoClient.getDatabase(targetDbName);

    target.drop();

    for (String collectionName : source.listCollectionNames()) {
      if (collectionName.startsWith("system."))
        continue;

      MongoIterable<Document> documents = source.getCollection(collectionName).find();
      List<Document> batch = new ArrayList<>();
      for (Document doc : documents) {
        batch.add(doc);
      }

      if (!batch.isEmpty()) {
        target.getCollection(collectionName).insertMany(batch);
      }
    }

    // Copy Assets
    try {
      java.io.File sourceDir = new java.io.File(dataRoot + sourceDbName + "/assets");
      java.io.File targetDir = new java.io.File(dataRoot + targetDbName + "/assets");

      if (sourceDir.exists()) {
        copyDirectory(sourceDir, targetDir);
      }
    } catch (Exception e) {
      System.err.println("Failed to copy assets: " + e.getMessage());
      e.printStackTrace();
    }
  }

  public void deleteDatabase(String dbName) {
    mongoClient.getDatabase(dbName).drop();

    // Delete Assets
    try {
      java.io.File assetDir = new java.io.File(dataRoot + dbName + "/assets");
      if (assetDir.exists()) {
        deleteDirectory(assetDir);
      }
      // Try to delete the parent 'data/dbName' directory if it exists and is
      // empty/only contains assets
      java.io.File dbDir = new java.io.File(dataRoot + dbName);
      if (dbDir.exists()) {
        deleteDirectory(dbDir);
      }
    } catch (Exception e) {
      System.err.println("Failed to delete assets: " + e.getMessage());
    }
    System.out.println("Deleted database: " + dbName);
  }

  private void copyDirectory(java.io.File source, java.io.File target) throws java.io.IOException {
    if (!target.exists()) {
      if (!target.mkdirs()) {
        throw new java.io.IOException("Failed to create directory: " + target.getAbsolutePath());
      }
    }
    for (String f : source.list()) {
      java.io.File sourceFile = new java.io.File(source, f);
      java.io.File targetFile = new java.io.File(target, f);
      if (sourceFile.isDirectory()) {
        copyDirectory(sourceFile, targetFile);
      } else {
        java.nio.file.Files.copy(sourceFile.toPath(), targetFile.toPath(),
            java.nio.file.StandardCopyOption.REPLACE_EXISTING);
      }
    }
  }

  private void deleteDirectory(java.io.File dir) {
    if (dir.exists()) {
      java.io.File[] files = dir.listFiles();
      if (files != null) {
        for (java.io.File file : files) {
          if (file.isDirectory()) {
            deleteDirectory(file);
          } else {
            file.delete();
          }
        }
      }
      dir.delete();
    }
  }

  public void resetDatabaseToFactory(String dbName) {
    MongoDatabase db = mongoClient.getDatabase(dbName);
    new com.antigravity.service.AssetService(db, dataRoot + dbName + "/assets").resetAssets();
    new com.antigravity.service.DatabaseService().resetToFactory(db);
  }

  public DatabaseStats getDatabaseStats(String dbName) {
    MongoDatabase db = mongoClient.getDatabase(dbName);
    long driverCount = db.getCollection("drivers").countDocuments();
    long trackCount = db.getCollection("tracks").countDocuments();
    long raceCount = db.getCollection("races").countDocuments();
    long assetCount = db.getCollection("assets").countDocuments();

    Document stats = db.runCommand(new Document("dbStats", 1));
    double sizeBytes = 0;
    Object dataSize = stats.get("dataSize");
    if (dataSize instanceof Number) {
      sizeBytes = ((Number) dataSize).doubleValue();
    }

    // Add asset file sizes
    long assetSizeBytes = 0;
    for (Document doc : db.getCollection("assets").find()) {
      String filename = doc.getString("filename");
      if (filename != null) {
        java.io.File file = new java.io.File(dataRoot + dbName + "/assets", filename);
        if (file.exists()) {
          assetSizeBytes += file.length();
        }
      }
    }
    sizeBytes += assetSizeBytes;

    return new DatabaseStats(dbName, driverCount, trackCount, raceCount, assetCount, sizeBytes);
  }

  public void exportDatabase(String dbName, OutputStream out) throws IOException {
    MongoDatabase db = mongoClient.getDatabase(dbName);
    try (ZipOutputStream zos = new ZipOutputStream(out)) {
      // 1. Export Collections
      for (String collectionName : db.listCollectionNames()) {
        if (collectionName.startsWith("system."))
          continue;

        ZipEntry entry = new ZipEntry("data/" + collectionName + ".json");
        zos.putNextEntry(entry);

        PrintWriter writer = new PrintWriter(new OutputStreamWriter(zos));
        for (Document doc : db.getCollection(collectionName).find()) {
          writer.println(doc.toJson());
        }
        writer.flush();
        zos.closeEntry();
      }

      // 2. Export Assets
      File assetDir = new File(dataRoot + dbName + "/assets");
      if (assetDir.exists()) {
        addDirectoryToZip(zos, assetDir, "assets/");
      }
    }
  }

  private void addDirectoryToZip(ZipOutputStream zos, File dir, String baseName) throws IOException {
    File[] files = dir.listFiles();
    if (files == null)
      return;
    for (File file : files) {
      if (file.isDirectory()) {
        addDirectoryToZip(zos, file, baseName + file.getName() + "/");
      } else {
        ZipEntry entry = new ZipEntry(baseName + file.getName());
        zos.putNextEntry(entry);
        try (FileInputStream fis = new FileInputStream(file)) {
          byte[] buffer = new byte[8192];
          int length;
          while ((length = fis.read(buffer)) >= 0) {
            zos.write(buffer, 0, length);
          }
        }
        zos.closeEntry();
      }
    }
  }

  public void importDatabase(String dbName, InputStream zipIn) throws IOException {
    // 1. Create directory structure
    File dbRoot = new File(dataRoot + dbName);
    File assetDir = new File(dbRoot, "assets");
    if (!assetDir.exists() && !assetDir.mkdirs()) {
      throw new IOException("Failed to create asset directory for " + dbName);
    }

    MongoDatabase db = mongoClient.getDatabase(dbName);
    db.drop(); // Ensure fresh start

    try (ZipInputStream zis = new ZipInputStream(zipIn)) {
      ZipEntry entry;
      while ((entry = zis.getNextEntry()) != null) {
        if (entry.getName().startsWith("data/") && entry.getName().endsWith(".json")) {
          // Import collection
          String colName = entry.getName().substring(5, entry.getName().length() - 5);
          BufferedReader reader = new BufferedReader(new InputStreamReader(zis));
          List<Document> documents = new ArrayList<>();
          String line;
          // We can't use reader.lines() or readLine() easily because ZipInputStream
          // might close or behave oddly with streamers if not careful.
          // But it's generally safe with a Scanner or careful loop.
          while ((line = reader.readLine()) != null) {
            documents.add(Document.parse(line));
          }
          if (!documents.isEmpty()) {
            db.getCollection(colName).insertMany(documents);
          }
        } else if (entry.getName().startsWith("assets/")) {
          // Import asset
          String relativePath = entry.getName().substring(7);
          File assetFile = new File(assetDir, relativePath);
          if (entry.isDirectory()) {
            assetFile.mkdirs();
          } else {
            assetFile.getParentFile().mkdirs();
            try (FileOutputStream fos = new FileOutputStream(assetFile)) {
              byte[] buffer = new byte[8192];
              int length;
              while ((length = zis.read(buffer)) >= 0) {
                fos.write(buffer, 0, length);
              }
            }
          }
        }
        zis.closeEntry();
      }
    }
  }

  public static class DatabaseStats {
    public String name;
    public long driverCount;
    public long trackCount;
    public long raceCount;
    public long assetCount;
    public double sizeBytes;

    public DatabaseStats(String name, long driverCount, long trackCount, long raceCount, long assetCount,
        double sizeBytes) {
      this.name = name;
      this.driverCount = driverCount;
      this.trackCount = trackCount;
      this.raceCount = raceCount;
      this.assetCount = assetCount;
      this.sizeBytes = sizeBytes;
    }
  }
}
