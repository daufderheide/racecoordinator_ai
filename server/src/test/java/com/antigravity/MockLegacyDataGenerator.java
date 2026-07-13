package com.antigravity;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoDatabase;
import de.flapdoodle.embed.mongo.config.Net;
import de.flapdoodle.embed.mongo.distribution.Version;
import de.flapdoodle.embed.mongo.transitions.ImmutableMongod;
import de.flapdoodle.embed.mongo.transitions.Mongod;
import de.flapdoodle.embed.mongo.transitions.RunningMongodProcess;
import de.flapdoodle.embed.mongo.types.DatabaseDir;
import de.flapdoodle.embed.process.transitions.InitTempDirectory;
import de.flapdoodle.reverse.transitions.Start;
import java.nio.file.Files;
import java.nio.file.Paths;
import org.bson.Document;

public class MockLegacyDataGenerator {

  public static void main(String[] args) throws Exception {
    String appDir = System.getProperty("user.dir");
    String appDataDir =
        System.getProperty("app.data.dir", Paths.get(appDir, "app_data").toString());
    String dataDir = Paths.get(appDataDir, "mongodb_data").toString();
    String tempDir = Paths.get(appDataDir, "mongo_temp").toString();

    System.out.println("Cleaning up old app_data...");
    deleteDir(Paths.get(appDataDir).toFile());

    Files.createDirectories(Paths.get(dataDir));
    Files.createDirectories(Paths.get(tempDir));

    System.out.println("Starting MongoDB 4.4 via Flapdoodle...");

    ImmutableMongod mongod =
        Mongod.instance()
            .withInitTempDirectory(InitTempDirectory.with(Paths.get(tempDir)))
            .withDatabaseDir(
                Start.to(DatabaseDir.class).initializedWith(DatabaseDir.of(Paths.get(dataDir))))
            .withNet(Start.to(Net.class).initializedWith(Net.of("localhost", 8085, false)));

    try {
      RunningMongodProcess flapdoodleProcess = mongod.start(Version.Main.V4_4).current();
      System.out.println("MongoDB 4.4 is running. Connecting to insert mock data...");
      try (MongoClient client = MongoClients.create("mongodb://localhost:8085")) {
        MongoDatabase db = client.getDatabase("mock_legacy_db");
        db.getCollection("test_collection").insertOne(new Document("name", "Legacy Mock Data 123"));
        System.out.println("Mock data inserted successfully into mock_legacy_db.test_collection!");
      }
      System.out.println("Shutting down MongoDB 4.4...");
      flapdoodleProcess.stop();
    } catch (Exception e) {
      e.printStackTrace();
    }
    System.out.println("Done! Ready for upgrade simulation.");
    System.exit(0);
  }

  private static void deleteDir(java.io.File file) {
    if (file.isDirectory()) {
      for (java.io.File c : file.listFiles()) {
        deleteDir(c);
      }
    }
    file.delete();
  }
}
