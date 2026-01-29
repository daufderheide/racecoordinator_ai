package com.antigravity.service;

import com.antigravity.proto.Asset;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoDatabase;
import de.flapdoodle.embed.mongo.MongodExecutable;
import de.flapdoodle.embed.mongo.MongodStarter;
import de.flapdoodle.embed.mongo.config.MongodConfig;
import de.flapdoodle.embed.mongo.config.Net;
import de.flapdoodle.embed.mongo.distribution.Version;
import de.flapdoodle.embed.process.runtime.Network;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.List;

import static org.junit.Assert.*;

public class AssetServiceTest {

  private MongodExecutable mongodExecutable;
  private MongoClient mongoClient;
  private AssetService assetService;

  @Rule
  public TemporaryFolder tempFolder = new TemporaryFolder();

  @Before
  public void setup() throws Exception {
    // Setup Embedded Mongo
    String bindIp = "localhost";
    int port = 27018; // Use a different port than default 27017 to avoid conflicts

    MongodConfig mongodConfig = MongodConfig.builder()
        .version(Version.Main.PRODUCTION)
        .net(new Net(bindIp, port, Network.localhostIsIPv6()))
        .build();

    MongodStarter starter = MongodStarter.getDefaultInstance();
    mongodExecutable = starter.prepare(mongodConfig);
    mongodExecutable.start();

    mongoClient = MongoClients.create("mongodb://" + bindIp + ":" + port);
    MongoDatabase database = mongoClient.getDatabase("test_db");

    // Setup AssetService with temp directory
    assetService = new AssetService(database, tempFolder.getRoot().getAbsolutePath());
  }

  @After
  public void teardown() {
    if (mongoClient != null) {
      mongoClient.close();
    }
    if (mongodExecutable != null) {
      mongodExecutable.stop();
    }
  }

  @Test
  public void testSaveAndGetAsset() throws IOException {
    String name = "Test Image";
    String type = "image";
    byte[] data = "fake_image_data".getBytes();

    Asset asset = assetService.saveAsset(name, type, data);

    assertNotNull(asset);
    assertEquals(name, asset.getName());
    assertEquals(type, asset.getType());
    assertNotNull(asset.getModel().getEntityId());

    // Verify list
    List<Asset> assets = assetService.getAllAssets();
    assertEquals(1, assets.size());
    assertEquals(asset.getModel().getEntityId(), assets.get(0).getModel().getEntityId());
  }

  @Test
  public void testDeleteAsset() throws IOException {
    Asset asset = assetService.saveAsset("Delete Me", "sound", new byte[] { 1, 2, 3 });
    String id = asset.getModel().getEntityId();

    boolean deleted = assetService.deleteAsset(id);
    assertTrue("Asset should be deleted", deleted);

    List<Asset> assets = assetService.getAllAssets();
    assertEquals(0, assets.size());

    // Verify folder is empty (ignoring hidden files if any, but should be empty)
    String[] files = tempFolder.getRoot().list();
    assertNotNull(files);
    assertEquals(0, files.length);
  }

  @Test
  public void testRenameAsset() throws IOException {
    Asset asset = assetService.saveAsset("Old Name", "image", new byte[] { 1 });
    String id = asset.getModel().getEntityId();

    boolean renamed = assetService.renameAsset(id, "New Name");
    assertTrue("Rename should succeed", renamed);

    List<Asset> assets = assetService.getAllAssets();
    assertEquals(1, assets.size());
    assertEquals("New Name", assets.get(0).getName());
  }

  @Test
  public void testDeleteNonExistent() {
    boolean deleted = assetService.deleteAsset("non-existent-id");
    assertFalse("Should return false for non-existent asset", deleted);
  }
}
