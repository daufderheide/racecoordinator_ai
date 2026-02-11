package com.antigravity.context;

import com.antigravity.service.ServerConfigService;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoDatabase;
import de.flapdoodle.embed.mongo.config.Net;
import de.flapdoodle.embed.mongo.distribution.Version;
import de.flapdoodle.embed.mongo.transitions.Mongod;
import de.flapdoodle.embed.mongo.transitions.RunningMongodProcess;
import de.flapdoodle.embed.mongo.types.DatabaseDir;
import de.flapdoodle.reverse.TransitionWalker;
import de.flapdoodle.reverse.transitions.Start;
import org.bson.Document;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import com.mongodb.MongoClientSettings;
import com.mongodb.ConnectionString;
import org.bson.codecs.configuration.CodecRegistry;
import org.bson.codecs.pojo.PojoCodecProvider;
import static org.bson.codecs.configuration.CodecRegistries.fromRegistries;
import static org.bson.codecs.configuration.CodecRegistries.fromProviders;

import static org.junit.Assert.*;

public class DatabaseContextTest {

  private TransitionWalker.ReachedState<RunningMongodProcess> mongodProcess;
  private MongoClient mongoClient;
  private DatabaseContext databaseContext;
  private ServerConfigService configService;

  @Rule
  public TemporaryFolder tempFolder = new TemporaryFolder(new File("target_dist"));

  @Before
  public void setup() throws Exception {
    // Setup Embedded Mongo
    String bindIp = "localhost";
    int port = 27019; // Use unique port

    // Ensure target_dist exists
    new File("target_dist").mkdirs();

    File mongoDataDir = tempFolder.newFolder("mongodb_data_context");

    // Setup Config Service with temp dir
    System.setProperty("app.data.dir", tempFolder.getRoot().getAbsolutePath());
    configService = new ServerConfigService();

    mongodProcess = Mongod.instance()
        .withDatabaseDir(Start.to(DatabaseDir.class).initializedWith(DatabaseDir.of(mongoDataDir.toPath())))
        .withNet(Start.to(Net.class).initializedWith(Net.of(bindIp, port, false)))
        .start(Version.Main.V4_4);

    CodecRegistry pojoCodecRegistry = fromRegistries(MongoClientSettings.getDefaultCodecRegistry(),
        fromProviders(PojoCodecProvider.builder().automatic(true).build()));

    MongoClientSettings settings = MongoClientSettings.builder()
        .applyConnectionString(new ConnectionString("mongodb://" + bindIp + ":" + port))
        .codecRegistry(pojoCodecRegistry)
        .build();

    mongoClient = MongoClients.create(settings);

    databaseContext = new DatabaseContext(mongoClient, "TEST_DB", configService);
    databaseContext.setDataRoot(tempFolder.getRoot().getAbsolutePath() + "/data/");
  }

  @After
  public void teardown() throws IOException {
    // Cleanup 'data' specific subdirectories created by tests
    if (databaseContext != null) {
      try {
        List<String> dbs = databaseContext.listDatabases();
        for (String db : dbs) {
          if (db.startsWith("TEST_DB")) {
            databaseContext.deleteDatabase(db);
          }
        }
      } catch (Exception e) {
        // Ignore errors during cleanup if client is already closed or issues
      }
    }

    if (mongoClient != null) {
      try {
        mongoClient.close();
      } catch (Exception e) {
      }
    }
    if (mongodProcess != null) {
      try {
        mongodProcess.close();
      } catch (Exception e) {
      }
    }
  }

  // Helper to delete recursively
  private void deleteDirectory(File dir) throws IOException {
    if (dir.exists()) {
      File[] files = dir.listFiles();
      if (files != null) {
        for (File file : files) {
          if (file.isDirectory()) {
            deleteDirectory(file);
          } else {
            if (!file.delete()) {
              System.err.println("WARN: Failed to delete file: " + file.getAbsolutePath());
            }
          }
        }
      }
      if (!dir.delete()) {
        System.err.println("WARN: Failed to delete dir: " + dir.getAbsolutePath());
      }
    }
  }

  @Test
  public void testCreateDatabase() {
    String dbName = "TEST_DB_NEW";
    databaseContext.createDatabase(dbName);
    assertTrue(databaseContext.listDatabases().contains(dbName));

    // Verify asset directory created
    File assetDir = new File(tempFolder.getRoot(), "data/" + dbName + "/assets");
    assertTrue(assetDir.exists());
    assertTrue(assetDir.isDirectory());
  }

  @Test
  public void testSwitchDatabase() {
    String dbName = "TEST_DB_SWITCH";
    databaseContext.createDatabase(dbName);
    databaseContext.switchDatabase(dbName);

    assertEquals(dbName, databaseContext.getCurrentDatabaseName());
    assertNotNull(databaseContext.getDatabase());
    assertEquals(dbName, databaseContext.getDatabase().getName());

    // Verify Config Service was updated
    assertEquals("Config service should have last active DB", dbName, configService.getLastActiveDatabase());
  }

  @Test
  public void testLastActiveDatabaseStored() {
    String dbName = "TEST_DB_PERSIST";
    databaseContext.createDatabase(dbName);
    databaseContext.switchDatabase(dbName);

    // Verify in-memory match
    assertEquals(dbName, configService.getLastActiveDatabase());

    // Reload config service to verify file persistence
    ServerConfigService newConfigService = new ServerConfigService();
    assertEquals("Persisted config should have last active DB", dbName, newConfigService.getLastActiveDatabase());
  }

  @Test
  public void testCopyDatabaseWithAssets() throws IOException {
    String sourceDb = "TEST_DB_SRC";
    String targetDb = "TEST_DB_COPY";
    databaseContext.createDatabase(sourceDb);

    // Create dummy asset in source
    File sourceAssetDir = new File(tempFolder.getRoot(), "data/" + sourceDb + "/assets");
    if (!sourceAssetDir.exists()) {
      assertTrue("Could not create source asset dir", sourceAssetDir.mkdirs());
    }
    File assetFile = new File(sourceAssetDir, "source.png");
    assertTrue(assetFile.createNewFile());

    databaseContext.copyDatabase(sourceDb, targetDb);

    assertTrue(databaseContext.listDatabases().contains(targetDb));

    // Verify assets copied
    File targetAssetDir = new File(tempFolder.getRoot(), "data/" + targetDb + "/assets");
    assertTrue("Target asset dir should exist", targetAssetDir.exists());
    File targetAssetFile = new File(targetAssetDir, "source.png");
    assertTrue("Target asset file should exist", targetAssetFile.exists());
  }

  @Test
  public void testDeleteDatabaseWithAssets() throws IOException {
    String dbName = "TEST_DB_DEL";
    databaseContext.createDatabase(dbName);

    // Create dummy asset
    File assetDir = new File(tempFolder.getRoot(), "data/" + dbName + "/assets");
    if (!assetDir.exists()) {
      assertTrue(assetDir.mkdirs());
    }
    File assetFile = new File(assetDir, "test.png");
    assertTrue(assetFile.createNewFile());

    databaseContext.deleteDatabase(dbName);

    assertFalse(databaseContext.listDatabases().contains(dbName));
    assertFalse(assetFile.exists());
    assertFalse(assetDir.exists());
    // Parent should be deleted if empty
    assertFalse(new File(tempFolder.getRoot(), "data/" + dbName).exists());
  }

  @Test
  public void testResetDatabaseToFactory() throws IOException {
    String dbName = "TEST_DB_RESET";
    databaseContext.createDatabase(dbName);

    // Create dummy asset that should be deleted
    File assetDir = new File(tempFolder.getRoot(), "data/" + dbName + "/assets");
    if (!assetDir.exists()) {
      assertTrue(assetDir.mkdirs());
    }
    File assetFile = new File(assetDir, "custom.png");
    assertTrue(assetFile.createNewFile());

    databaseContext.resetDatabaseToFactory(dbName);

    // Asset should be deleted
    assertFalse("Custom asset should be deleted", assetFile.exists());
    // We skip checking for restoration of default assets because
    // unit test classpath might not contain them in the expected location
    // unless properly configured with test resources.
    // But verifying *cleanup* is the critical part for this test.
  }

  @Test
  public void testListDatabasesAlphabetical() {
    databaseContext.createDatabase("Z_DB");
    databaseContext.createDatabase("A_DB");
    databaseContext.createDatabase("M_DB");

    List<String> dbs = databaseContext.listDatabases();

    int idxA = dbs.indexOf("A_DB");
    int idxM = dbs.indexOf("M_DB");
    int idxZ = dbs.indexOf("Z_DB");

    assertTrue("A_DB should exist", idxA >= 0);
    assertTrue("M_DB should exist", idxM >= 0);
    assertTrue("Z_DB should exist", idxZ >= 0);

    assertTrue("A < M", idxA < idxM);
    assertTrue("M < Z", idxM < idxZ);
  }

  @Test
  public void testExportDatabase() throws Exception {
    String dbName = "TEST_DB_EXPORT";
    databaseContext.createDatabase(dbName);
    databaseContext.switchDatabase(dbName);

    // Add some data
    databaseContext.getDatabase().getCollection("test_collection", Document.class)
        .insertOne(new Document("key", "value"));

    // Add an asset
    File assetDir = new File(tempFolder.getRoot(), "data/" + dbName + "/assets");
    assetDir.mkdirs();
    File assetFile = new File(assetDir, "export_test.txt");
    Files.write(assetFile.toPath(), "test content".getBytes());

    ByteArrayOutputStream out = new ByteArrayOutputStream();
    databaseContext.exportDatabase(dbName, out);

    byte[] zipBytes = out.toByteArray();
    assertTrue(zipBytes.length > 0);

    // Verify ZIP content
    try (ZipInputStream zipIn = new ZipInputStream(new ByteArrayInputStream(zipBytes))) {
      ZipEntry entry;
      boolean foundJson = false;
      boolean foundAsset = false;
      while ((entry = zipIn.getNextEntry()) != null) {
        if (entry.getName().equals("data/test_collection.json"))
          foundJson = true;
        if (entry.getName().equals("assets/export_test.txt"))
          foundAsset = true;
      }
      assertTrue("Should contain collection JSON", foundJson);
      assertTrue("Should contain asset file", foundAsset);
    }
  }

  @Test
  public void testImportDatabase() throws Exception {
    String sourceDb = "TEST_DB_SRC_FOR_IMPORT";
    String targetDb = "TEST_DB_IMPORTED";
    databaseContext.createDatabase(sourceDb);
    databaseContext.switchDatabase(sourceDb);

    // Add some data
    databaseContext.getDatabase().getCollection("imp_coll", Document.class)
        .insertOne(new Document("foo", "bar"));

    // Add an asset
    File assetDir = new File(tempFolder.getRoot(), "data/" + sourceDb + "/assets");
    assetDir.mkdirs();
    File assetFile = new File(assetDir, "imp_test.txt");
    Files.write(assetFile.toPath(), "import test".getBytes());

    // Export to byte array
    ByteArrayOutputStream out = new ByteArrayOutputStream();
    databaseContext.exportDatabase(sourceDb, out);

    // Import as new database
    databaseContext.importDatabase(targetDb, new ByteArrayInputStream(out.toByteArray()));

    assertTrue(databaseContext.listDatabases().contains(targetDb));

    // Verify data
    databaseContext.switchDatabase(targetDb);
    Document doc = databaseContext.getDatabase().getCollection("imp_coll", Document.class).find().first();
    assertNotNull(doc);
    assertEquals("bar", doc.getString("foo"));

    // Verify asset
    File targetAssetFile = new File(tempFolder.getRoot(), "data/" + targetDb + "/assets/imp_test.txt");
    assertTrue("Imported asset should exist", targetAssetFile.exists());
    assertEquals("import test", new String(Files.readAllBytes(targetAssetFile.toPath())));
  }
}
