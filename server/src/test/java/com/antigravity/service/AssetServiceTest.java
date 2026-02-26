package com.antigravity.service;

import com.antigravity.proto.AssetMessage;
import com.antigravity.proto.SaveImageSetEntry;
import com.google.protobuf.ByteString;
import com.mongodb.client.FindIterable;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;
import org.bson.conversions.Bson;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.ArgumentCaptor;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;

import static org.junit.Assert.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class AssetServiceTest {

  private MongoDatabase mongoDatabase;
  private MongoCollection<Document> collection;
  private AssetService assetService;
  private String assetsDir;
  private File testDir;

  @Before
  public void setup() throws Exception {
    mongoDatabase = mock(MongoDatabase.class);
    collection = mock(MongoCollection.class);

    when(mongoDatabase.getCollection("assets")).thenReturn(collection);

    // Manual temp dir management to avoid permission issues in /var/folders/
    testDir = new File("target/test_assets_" + System.currentTimeMillis());
    testDir.mkdirs();
    assetsDir = testDir.getAbsolutePath();

    assetService = new AssetService(mongoDatabase, assetsDir);
  }

  @After
  public void teardown() throws IOException {
    if (testDir != null && testDir.exists()) {
      Files.walk(testDir.toPath())
          .sorted(Comparator.reverseOrder())
          .map(Path::toFile)
          .forEach(File::delete);
    }
  }

  @Test
  public void testSaveAsset() throws IOException {
    String name = "Test Image";
    String type = "image";
    byte[] data = "fake_image_data".getBytes();

    AssetMessage asset = assetService.saveAsset(name, type, data);

    assertNotNull(asset);
    assertEquals(name, asset.getName());
    assertEquals(type, asset.getType());

    // Verify file exists
    File[] files = testDir.listFiles();
    assertNotNull(files);
    assertEquals(1, files.length);

    // Verify DB insertion
    verify(collection).insertOne(any(Document.class));
  }

  @Test
  public void testGetAllAssets() {
    Document doc1 = new Document("_id", "1")
        .append("name", "Asset 1")
        .append("type", "image")
        .append("size", "10 KB")
        .append("url", "/assets/1.png");

    FindIterable<Document> findIterable = mock(FindIterable.class);
    when(collection.find()).thenReturn(findIterable);

    // Support for-each loop which calls iterator()
    com.mongodb.client.MongoCursor<Document> cursor = mock(com.mongodb.client.MongoCursor.class);
    when(findIterable.iterator()).thenReturn(cursor);
    when(cursor.hasNext()).thenReturn(true, false);
    when(cursor.next()).thenReturn(doc1);

    // Support into() as well if used elsewhere
    when(findIterable.into(any())).thenAnswer(invocation -> {
      List<Document> list = invocation.getArgument(0);
      list.add(doc1);
      return list;
    });

    List<AssetMessage> assets = assetService.getAllAssets();
    assertEquals(1, assets.size());
    assertEquals("Asset 1", assets.get(0).getName());
  }

  @Test
  public void testDeleteAsset() throws IOException {
    String id = "asset-123";
    Document doc = new Document("_id", id)
        .append("filename", "test.png");

    FindIterable<Document> iterable = mock(FindIterable.class);
    when(iterable.first()).thenReturn(doc);
    when(collection.find(any(Bson.class))).thenReturn(iterable);
    when(collection.deleteOne(any(Bson.class))).thenReturn(mock(com.mongodb.client.result.DeleteResult.class));

    // Create a fake file
    new File(assetsDir, "test.png").createNewFile();

    boolean deleted = assetService.deleteAsset(id);
    assertTrue(deleted);

    // Verify file deleted
    assertFalse(new File(assetsDir, "test.png").exists());
    verify(collection).deleteOne(any(Bson.class));
  }

  @Test
  public void testResetAssets() throws IOException {
    // This will trigger the actual grouping logic
    assetService.resetAssets();

    // Capture the documents inserted
    ArgumentCaptor<Document> captor = ArgumentCaptor.forClass(Document.class);
    verify(collection, atLeastOnce()).insertOne(captor.capture());

    List<Document> insertedDocs = captor.getAllValues();
    Document fuelSet = insertedDocs.stream()
        .filter(d -> "Fuel Gauge".equals(d.getString("name")))
        .findFirst()
        .orElse(null);

    assertNotNull("Fuel Gauge image set should be created", fuelSet);
    assertEquals("image_set", fuelSet.getString("type"));
    List<Document> images = (List<Document>) fuelSet.get("images");
    assertNotNull(images);
    assertTrue("Should have multiple images in set", images.size() > 0);
  }

  @Test
  public void testDeleteImageSetRecursive() throws IOException {
    String id = "set-123";
    List<Document> imageDocs = Arrays.asList(
        new Document("url", "/assets/img1.png"),
        new Document("url", "/assets/img2.png"));
    Document setDoc = new Document("_id", id)
        .append("type", "image_set")
        .append("images", imageDocs);

    FindIterable<Document> iterable = mock(FindIterable.class);
    when(iterable.first()).thenReturn(setDoc);
    when(collection.find(any(Bson.class))).thenReturn(iterable);

    // Create fake files
    new File(assetsDir, "img1.png").createNewFile();
    new File(assetsDir, "img2.png").createNewFile();

    assetService.deleteAsset(id);

    assertFalse("img1.png should be deleted", new File(assetsDir, "img1.png").exists());
    assertFalse("img2.png should be deleted", new File(assetsDir, "img2.png").exists());
    verify(collection).deleteOne(any(Bson.class));
  }

  @Test
  public void testSaveImageSet() throws IOException {
    String name = "New Image Set";

    // Entry 1: New image data
    SaveImageSetEntry entry1 = SaveImageSetEntry.newBuilder()
        .setName("image1.png")
        .setPercentage(50)
        .setData(ByteString.copyFrom("fake_image_1".getBytes()))
        .build();

    // Entry 2: Existing image reference
    SaveImageSetEntry entry2 = SaveImageSetEntry.newBuilder()
        .setName("existing.png")
        .setPercentage(100)
        .setUrl("/assets/existing_123.png")
        .build();

    // Create the existing file physically
    new File(assetsDir, "existing_123.png").createNewFile();

    AssetMessage result = assetService.saveImageSet(null, name, Arrays.asList(entry1, entry2));

    assertNotNull(result);
    assertEquals(name, result.getName());
    assertEquals("image_set", result.getType());

    // Verify database interaction
    ArgumentCaptor<Document> captor = ArgumentCaptor.forClass(Document.class);
    verify(collection).insertOne(captor.capture());
    Document doc = captor.getValue();

    assertEquals(name, doc.getString("name"));
    List<Document> images = (List<Document>) doc.get("images");
    assertEquals(2, images.size());

    // Check Entry 1 (New) - should have generated a new URL
    assertTrue(images.get(0).getString("url").startsWith("/assets/"));
    assertTrue(images.get(0).getString("url").contains("image1.png"));

    // Check Entry 2 (Existing) - should have preserved the URL
    assertEquals("/assets/existing_123.png", images.get(1).getString("url"));

    // Verify physical file was created for Entry 1
    File[] files = testDir.listFiles();
    boolean foundNewFile = false;
    for (File f : files) {
      if (f.getName().contains("image1.png")) {
        foundNewFile = true;
        break;
      }
    }
    assertTrue("A new physical file should have been created for image1", foundNewFile);
  }

  // Helper removed to avoid nested stubbing issues
}
