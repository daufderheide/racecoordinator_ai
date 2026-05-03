package com.antigravity.context;

import com.antigravity.service.AssetService;
import com.antigravity.service.DatabaseService;
import com.antigravity.service.ServerConfigService;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.MongoIterable;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;
import org.bson.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class DatabaseContext {
  private static final Logger logger = LoggerFactory.getLogger(DatabaseContext.class);

  private final MongoClient mongoClient;
  private volatile MongoDatabase currentDatabase;
  private volatile String currentDatabaseName;
  private final ServerConfigService configService;
  private final String dataRoot;

  public DatabaseContext(
      MongoClient mongoClient,
      String initialDatabaseName,
      ServerConfigService configService,
      String dataRoot) {
    this.mongoClient = mongoClient;
    this.configService = configService;
    this.dataRoot = dataRoot.endsWith(File.separator) ? dataRoot : dataRoot + File.separator;
    this.switchDatabase(initialDatabaseName);
  }

  public String getDataRoot() {
    return dataRoot;
  }

  public synchronized MongoDatabase getDatabase() {
    if (currentDatabase == null) {
      logger.error("DatabaseContext: currentDatabase is NULL! (Name: {})", currentDatabaseName);
    }
    return currentDatabase;
  }

  public synchronized String getCurrentDatabaseName() {
    return currentDatabaseName;
  }

  public MongoClient getMongoClient() {
    return mongoClient;
  }

  public ServerConfigService getConfigService() {
    return configService;
  }

  public synchronized void switchDatabase(String databaseName) {
    if (databaseName == null) {
      logger.error("DatabaseContext: Attempted to switch to NULL database name");
      return;
    }
    this.currentDatabaseName = databaseName;
    this.currentDatabase = mongoClient.getDatabase(databaseName);
    if (this.currentDatabase == null) {
      logger.error("DatabaseContext: mongoClient.getDatabase({}) returned NULL!", databaseName);
    }
    if (this.configService != null) {
      this.configService.setLastActiveDatabase(databaseName);
    }
    logger.info("Switched context to database: {}", databaseName);
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
    File assetDir = new File(dataRoot + databaseName + "/assets");
    if (!assetDir.exists() && !assetDir.mkdirs()) {
      throw new RuntimeException(
          "Failed to create assets directory: " + assetDir.getAbsolutePath());
    }
    logger.info("Created database: {} at {}", databaseName, assetDir.getAbsolutePath());
  }

  public List<String> listDatabases() {
    List<String> dbs = new ArrayList<>();
    mongoClient.listDatabaseNames().forEach(dbs::add);
    Collections.sort(dbs);
    return dbs;
  }

  public void copyDatabase(String sourceDbName, String targetDbName) {
    MongoDatabase source = mongoClient.getDatabase(sourceDbName);
    MongoDatabase target = mongoClient.getDatabase(targetDbName);

    target.drop();

    for (String collectionName : source.listCollectionNames()) {
      if (collectionName.startsWith("system.")
          || collectionName.equals("global_statistics")
          || collectionName.equals("race_history")
          || collectionName.equals("saved_races")) {
        continue;
      }

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
      File sourceDir = new File(dataRoot + sourceDbName + "/assets");
      File targetDir = new File(dataRoot + targetDbName + "/assets");

      if (sourceDir.exists()) {
        copyDirectory(sourceDir, targetDir);
      }
    } catch (Exception e) {
      logger.error("Failed to copy assets", e);
    }

    // Ensure defaults are backfilled after copy
    MongoDatabase targetDb = mongoClient.getDatabase(targetDbName);
    new AssetService(targetDb, dataRoot + targetDbName + "/assets").backfillDefaults();
  }

  public void deleteDatabase(String dbName) {
    mongoClient.getDatabase(dbName).drop();

    // Delete Assets
    try {
      File assetDir = new File(dataRoot + dbName + "/assets");
      if (assetDir.exists()) {
        deleteDirectory(assetDir);
      }
      // Try to delete the parent 'data/dbName' directory if it exists and is
      // empty/only contains assets
      File dbDir = new File(dataRoot + dbName);
      if (dbDir.exists()) {
        deleteDirectory(dbDir);
      }
    } catch (Exception e) {
      logger.error("Failed to delete assets", e);
    }
    logger.info("Deleted database: {}", dbName);
  }

  private void copyDirectory(File source, File target) throws IOException {
    if (!target.exists()) {
      if (!target.mkdirs()) {
        throw new IOException("Failed to create directory: " + target.getAbsolutePath());
      }
    }
    for (String f : source.list()) {
      File sourceFile = new File(source, f);
      File targetFile = new File(target, f);
      if (sourceFile.isDirectory()) {
        copyDirectory(sourceFile, targetFile);
      } else {
        Files.copy(sourceFile.toPath(), targetFile.toPath(), StandardCopyOption.REPLACE_EXISTING);
      }
    }
  }

  private void deleteDirectory(File dir) {
    if (dir.exists()) {
      File[] files = dir.listFiles();
      if (files != null) {
        for (File file : files) {
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
    new AssetService(db, dataRoot + dbName + "/assets").resetAssets();
    DatabaseService.getInstance().resetToFactory(this, db);
  }

  public DatabaseStats getDatabaseStats(String dbName) {
    MongoDatabase db = mongoClient.getDatabase(dbName);
    long driverCount = db.getCollection("drivers").countDocuments();
    long teamCount = db.getCollection("teams").countDocuments();
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
        File file = new File(dataRoot + dbName + "/assets", filename);
        if (file.exists()) {
          assetSizeBytes += file.length();
        }
      }
    }
    sizeBytes += assetSizeBytes;

    long raceRecordCount = 0;
    double raceRecordSizeBytes = 0;
    try {
      Document collStats = db.runCommand(new Document("collStats", "race_history"));
      raceRecordCount = ((Number) collStats.get("count")).longValue();
      raceRecordSizeBytes = ((Number) collStats.get("size")).doubleValue();
    } catch (Exception e) {
      // Collection might not exist yet
    }

    long savedRaceCount = 0;
    double savedRaceSizeBytes = 0;
    try {
      Document collStats = db.runCommand(new Document("collStats", "saved_races"));
      savedRaceCount = ((Number) collStats.get("count")).longValue();
      savedRaceSizeBytes = ((Number) collStats.get("size")).doubleValue();
    } catch (Exception e) {
      // Collection might not exist yet
    }

    return new DatabaseStats(
        dbName,
        driverCount,
        teamCount,
        trackCount,
        raceCount,
        assetCount,
        sizeBytes,
        raceRecordCount,
        raceRecordSizeBytes,
        savedRaceCount,
        savedRaceSizeBytes);
  }

  public void exportDatabase(String dbName, OutputStream out) throws IOException {
    MongoDatabase db = mongoClient.getDatabase(dbName);
    try (ZipOutputStream zos = new ZipOutputStream(out)) {
      // 1. Export Collections
      for (String collectionName : db.listCollectionNames()) {
        if (collectionName.startsWith("system.")) {
          continue;
        }

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

  private void addDirectoryToZip(ZipOutputStream zos, File dir, String baseName)
      throws IOException {
    File[] files = dir.listFiles();
    if (files == null) {
      return;
    }
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

    // Ensure defaults are backfilled after import
    new AssetService(db, dataRoot + dbName + "/assets").backfillDefaults();
  }

  public static class DatabaseStats {

    public String name;
    public long driverCount;
    public long teamCount;
    public long trackCount;
    public long raceCount;
    public long assetCount;
    public double sizeBytes;
    public long raceRecordCount;
    public double raceRecordSizeBytes;
    public long savedRaceCount;
    public double savedRaceSizeBytes;

    public DatabaseStats(
        String name,
        long driverCount,
        long teamCount,
        long trackCount,
        long raceCount,
        long assetCount,
        double sizeBytes,
        long raceRecordCount,
        double raceRecordSizeBytes,
        long savedRaceCount,
        double savedRaceSizeBytes) {
      this.name = name;
      this.driverCount = driverCount;
      this.teamCount = teamCount;
      this.trackCount = trackCount;
      this.raceCount = raceCount;
      this.assetCount = assetCount;
      this.sizeBytes = sizeBytes;
      this.raceRecordCount = raceRecordCount;
      this.raceRecordSizeBytes = raceRecordSizeBytes;
      this.savedRaceCount = savedRaceCount;
      this.savedRaceSizeBytes = savedRaceSizeBytes;
    }
  }
}
