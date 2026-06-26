package com.antigravity.service;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.antigravity.proto.AssetMessage;
import com.antigravity.proto.SaveImageSetEntry;
import com.google.protobuf.ByteString;
import com.mongodb.client.FindIterable;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoCursor;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.Filters;
import com.mongodb.client.result.DeleteResult;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import org.bson.Document;
import org.bson.conversions.Bson;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.ArgumentCaptor;

public class AssetServiceTest {

  private MongoDatabase mongoDatabase;
  private MongoCollection<Document> collection;
  private MongoCollection<Document> themesCollection;
  private AssetService assetService;
  private String assetsDir;
  private File testDir;

  @Before
  public void setup() throws Exception {
    mongoDatabase = mock(MongoDatabase.class);
    collection = mock(MongoCollection.class);
    themesCollection = mock(MongoCollection.class);

    when(mongoDatabase.getCollection("assets")).thenReturn(collection);
    when(mongoDatabase.getCollection("themes")).thenReturn(themesCollection);

    // Default to return an empty FindIterable for any find() call
    FindIterable<Document> emptyIterable = mock(FindIterable.class);
    MongoCursor<Document> emptyCursor = mock(MongoCursor.class);
    when(emptyCursor.hasNext()).thenReturn(false);
    when(emptyIterable.iterator()).thenReturn(emptyCursor);

    when(collection.find(any(Bson.class))).thenReturn(emptyIterable);
    when(collection.find()).thenReturn(emptyIterable);

    when(themesCollection.find(any(Bson.class))).thenReturn(emptyIterable);
    when(themesCollection.find()).thenReturn(emptyIterable);

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
    Document doc1 =
        new Document("_id", "1")
            .append("name", "Asset 1")
            .append("type", "image")
            .append("size", "10 KB")
            .append("url", "/assets/1.png");

    FindIterable<Document> findIterable = mock(FindIterable.class);
    when(collection.find(any(Bson.class))).thenReturn(findIterable);

    // Support for-each loop which calls iterator()
    MongoCursor<Document> cursor = mock(MongoCursor.class);
    when(findIterable.iterator()).thenReturn(cursor);
    when(cursor.hasNext()).thenReturn(true, false);
    when(cursor.next()).thenReturn(doc1);

    // Support into() as well if used elsewhere
    when(findIterable.into(any()))
        .thenAnswer(
            invocation -> {
              List<Document> list = invocation.getArgument(0);
              list.add(doc1);
              return list;
            });

    List<AssetMessage> assets = assetService.getAllAssets();
    assertEquals(1, assets.size());
    assertEquals("Asset 1", assets.get(0).getName());
  }

  @Test
  public void testDeleteAssetUserAsset() throws IOException {
    String id = "user-asset-123";
    Document doc = new Document("_id", id).append("filename", "test.png");

    FindIterable<Document> iterable = mock(FindIterable.class);
    when(iterable.first()).thenReturn(doc);
    when(collection.find(any(Bson.class))).thenReturn(iterable);
    when(collection.deleteOne(any(Bson.class))).thenReturn(mock(DeleteResult.class));

    // Create a fake file
    new File(assetsDir, "test.png").createNewFile();

    boolean deleted = assetService.deleteAsset(id);
    assertTrue(deleted);

    // Verify file deleted (hard delete for user assets)
    assertFalse(new File(assetsDir, "test.png").exists());
    verify(collection).deleteOne(any(Bson.class));
  }

  @Test
  public void testDeleteAssetDefaultAsset() throws IOException {
    String id = "default_helmet_1";
    Document doc =
        new Document("_id", id).append("filename", "test.png").append("is_default", true);

    FindIterable<Document> iterable = mock(FindIterable.class);
    when(iterable.first()).thenReturn(doc);
    when(collection.find(any(Bson.class))).thenReturn(iterable);

    // Create a fake file
    new File(assetsDir, "test.png").createNewFile();

    boolean deleted = assetService.deleteAsset(id);
    assertTrue(deleted);

    // Verify file remains (soft delete for default assets)
    assertTrue(new File(assetsDir, "test.png").exists());
    // Verify update instead of delete
    verify(collection).updateOne(any(Bson.class), any(Bson.class));
  }

  @Test
  public void testResetAssets() throws IOException {
    // This will trigger the actual grouping logic
    assetService.resetAssets();

    // Capture the documents inserted
    ArgumentCaptor<Document> captor = ArgumentCaptor.forClass(Document.class);
    verify(collection, atLeastOnce()).insertOne(captor.capture());

    List<Document> insertedDocs = captor.getAllValues();
    Document fuelSet =
        insertedDocs.stream()
            .filter(d -> "Fuel Gauge".equals(d.getString("name")))
            .findFirst()
            .orElse(null);

    assertNotNull("Fuel Gauge image set should be created", fuelSet);
    assertEquals("image_set", fuelSet.getString("type"));
    assertEquals("default_fuel-gauge-builtin", fuelSet.getString("_id"));
    @SuppressWarnings("unchecked")
    List<Document> images = (List<Document>) fuelSet.get("images");
    assertNotNull(images);
    assertTrue("Should have multiple images in set", images.size() > 0);

    ArgumentCaptor<Document> updateCaptor = ArgumentCaptor.forClass(Document.class);
    verify(collection, atLeastOnce())
        .replaceOne(
            any(Bson.class),
            updateCaptor.capture(),
            any(com.mongodb.client.model.ReplaceOptions.class));

    List<Document> updatedDocs = updateCaptor.getAllValues();
    Document practiceRotation =
        updatedDocs.stream()
            .filter(d -> "Practice -- Single Heat".equals(d.getString("name")))
            .findFirst()
            .orElse(null);

    assertNotNull("Practice rotation should be created", practiceRotation);
    assertEquals("custom_rotation", practiceRotation.getString("type"));
    assertEquals("default_practice_single_heat", practiceRotation.getString("_id"));
  }

  @Test
  public void testDeleteImageSetRecursive() throws IOException {
    String id = "set-123";
    List<Document> imageDocs =
        Arrays.asList(
            new Document("url", "/assets/img1.png"), new Document("url", "/assets/img2.png"));
    Document setDoc =
        new Document("_id", id).append("type", "image_set").append("images", imageDocs);

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
    SaveImageSetEntry entry1 =
        SaveImageSetEntry.newBuilder()
            .setName("image1.png")
            .setPercentage(50)
            .setData(ByteString.copyFrom("fake_image_1".getBytes()))
            .build();

    // Entry 2: Existing image reference
    SaveImageSetEntry entry2 =
        SaveImageSetEntry.newBuilder()
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
    @SuppressWarnings("unchecked")
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
    if (files != null) {
      for (File f : files) {
        if (f.getName().contains("image1.png")) {
          foundNewFile = true;
          break;
        }
      }
    }
    assertTrue("A new physical file should have been created for image1", foundNewFile);
  }

  @Test
  public void testBackfillDefaults() throws IOException {
    // 1. Initial backfill (empty DB)
    FindIterable<Document> emptyIterable = mock(FindIterable.class);
    when(emptyIterable.first()).thenReturn(null);
    when(collection.find(any(Bson.class))).thenReturn(emptyIterable);

    assetService.backfillDefaults();

    // Capture the documents inserted
    ArgumentCaptor<Document> captor = ArgumentCaptor.forClass(Document.class);
    verify(collection, atLeastOnce()).insertOne(captor.capture());

    List<Document> insertedDocs = captor.getAllValues();
    assertTrue("Should have inserted many default assets", insertedDocs.size() > 10);

    ArgumentCaptor<Document> updateCaptor = ArgumentCaptor.forClass(Document.class);
    verify(collection, atLeastOnce())
        .replaceOne(
            any(Bson.class),
            updateCaptor.capture(),
            any(com.mongodb.client.model.ReplaceOptions.class));

    List<Document> updatedDocs = updateCaptor.getAllValues();
    Document practiceRotation =
        updatedDocs.stream()
            .filter(d -> "Practice -- Single Heat".equals(d.getString("name")))
            .findFirst()
            .orElse(null);

    assertNotNull("Practice rotation should be created", practiceRotation);
    assertEquals("custom_rotation", practiceRotation.getString("type"));
    assertEquals("default_practice_single_heat", practiceRotation.getString("_id"));

    // 2. Second backfill (should do nothing as they exist)
    // We need to mock the find calls for the subsequent backfill
    for (Document doc : insertedDocs) {
      FindIterable<Document> iterable = mock(FindIterable.class);
      when(iterable.first()).thenReturn(doc);
      when(collection.find(Filters.eq("_id", doc.getString("_id")))).thenReturn(iterable);
    }

    assetService.backfillDefaults();

    // verify no additional insertOne calls happened for the same IDs
    // (This is a bit hard with mockito without resetting, but we can check the count of calls if we
    // wanted)
  }

  @Test
  public void testBackfillDoesNotOverwriteRenamedAsset() throws IOException {
    String id = "default_avatar_helmet_4";
    Document renamedDoc =
        new Document("_id", id).append("name", "My Custom Helmet Name").append("is_default", true);

    FindIterable<Document> iterable = mock(FindIterable.class);
    when(iterable.first()).thenReturn(renamedDoc);
    // Mock for THIS specific ID check
    when(collection.find(Filters.eq("_id", id))).thenReturn(iterable);

    // Also need to ignore other defaults for this test to be clean,
    // otherwise backfill will try to add ALL other defaults.
    // For simplicity, let's just check that insertOne was NOT called with this ID.

    assetService.backfillDefaults();

    // Verify insertOne was never called for this ID
    ArgumentCaptor<Document> captor = ArgumentCaptor.forClass(Document.class);
    verify(collection, atLeastOnce()).insertOne(captor.capture());

    boolean readded = captor.getAllValues().stream().anyMatch(d -> id.equals(d.getString("_id")));

    assertFalse(
        "Default asset should NOT be re-added if it already exists (even if renamed)", readded);
  }

  @Test
  public void testBackfillDoesNotOverwriteDeletedAsset() throws IOException {
    String id = "default_avatar_helmet_4";
    Document deletedDoc =
        new Document("_id", id)
            .append("name", "Helmet Futuristic 1")
            .append("is_default", true)
            .append("deleted", true);

    FindIterable<Document> iterable = mock(FindIterable.class);
    when(iterable.first()).thenReturn(deletedDoc);
    when(collection.find(Filters.eq("_id", id))).thenReturn(iterable);

    assetService.backfillDefaults();

    ArgumentCaptor<Document> captor = ArgumentCaptor.forClass(Document.class);
    verify(collection, atLeastOnce()).insertOne(captor.capture());

    boolean readded = captor.getAllValues().stream().anyMatch(d -> id.equals(d.getString("_id")));

    assertFalse("Default asset should NOT be re-added if it already exists as 'deleted'", readded);
  }

  @Test
  public void testBackfillDefaultTheme() {
    // 1. Mock theme not found
    FindIterable<Document> emptyIterable = mock(FindIterable.class);
    when(emptyIterable.first()).thenReturn(null);
    when(themesCollection.find(any(Bson.class))).thenReturn(emptyIterable);

    assetService.backfillDefaultTheme();

    // Verify insertion of default theme
    verify(themesCollection, atLeastOnce()).insertOne(any(Document.class));
  }

  @Test
  public void testBackfillThemeSlotsMigration() {
    // Mock an existing theme with legacy audio.yellowflag in slots
    Document legacyTheme =
        new Document("_id", "theme_1")
            .append("name", "Legacy Theme")
            .append("is_default", false)
            .append("slots", new Document("audio.yellowflag", "default_yellow_flag"));

    FindIterable<Document> findIterable = mock(FindIterable.class);
    MongoCursor<Document> cursor = mock(MongoCursor.class);
    when(themesCollection.find()).thenReturn(findIterable);
    when(findIterable.iterator()).thenReturn(cursor);
    when(cursor.hasNext()).thenReturn(true, false);
    when(cursor.next()).thenReturn(legacyTheme);

    assetService.backfillDefaults();

    // Verify update was called to move the slot
    ArgumentCaptor<Bson> filterCaptor = ArgumentCaptor.forClass(Bson.class);
    ArgumentCaptor<Bson> updateCaptor = ArgumentCaptor.forClass(Bson.class);
    verify(themesCollection, atLeastOnce())
        .updateOne(filterCaptor.capture(), updateCaptor.capture());

    String updateStr = updateCaptor.getValue().toString();
    assertTrue("Should include audio.yellowflag in update", updateStr.contains("audio.yellowflag"));
    assertTrue("Should include preset type", updateStr.contains("preset"));
    assertTrue("Should include default_yellow_flag", updateStr.contains("default_yellow_flag"));

    // Check for slots and audio_slots keys
    assertTrue("Should contain slots key", updateStr.contains("slots"));
    assertTrue("Should contain audio_slots key", updateStr.contains("audio_slots"));
  }

  @Test
  public void testBackfillAudioSets() {
    // Mock an existing theme without audio sets
    Document theme =
        new Document("_id", "theme_audio_sets")
            .append("name", "Audio Sets Theme")
            .append("is_default", false)
            .append("audio_slots", new Document());

    FindIterable<Document> findIterable = mock(FindIterable.class);
    MongoCursor<Document> cursor = mock(MongoCursor.class);
    when(themesCollection.find()).thenReturn(findIterable);
    when(findIterable.iterator()).thenReturn(cursor);
    when(cursor.hasNext()).thenReturn(true, false);
    when(cursor.next()).thenReturn(theme);

    assetService.backfillDefaults();

    // Verify update was called to add audio set slots
    ArgumentCaptor<Bson> filterCaptor = ArgumentCaptor.forClass(Bson.class);
    ArgumentCaptor<Bson> updateCaptor = ArgumentCaptor.forClass(Bson.class);
    verify(themesCollection, atLeastOnce())
        .updateOne(filterCaptor.capture(), updateCaptor.capture());

    // Find the update that sets audio_slots
    String updateStr =
        updateCaptor.getAllValues().stream()
            .map(Object::toString)
            .filter(s -> s.contains("audio_slots"))
            .findFirst()
            .orElse("");

    assertTrue("Should include audio.countdown", updateStr.contains("audio.countdown"));
    assertTrue("Should include audio.seconds_left", updateStr.contains("audio.seconds_left"));
    assertTrue(
        "Should include default countdown set ID", updateStr.contains("default_countdown-set"));
    assertTrue(
        "Should include default seconds left set ID",
        updateStr.contains("default_seconds-left-set"));
  }

  @Test
  public void testSaveAudioSet() throws IOException {
    String name = "New Audio Set";
    com.antigravity.proto.SaveAudioSetEntry entry1 =
        com.antigravity.proto.SaveAudioSetEntry.newBuilder()
            .setName("countdown_5.wav")
            .setTimeSeconds(5.0f)
            .setData(ByteString.copyFrom("fake_audio_1".getBytes()))
            .build();
    com.antigravity.proto.SaveAudioSetEntry entry2 =
        com.antigravity.proto.SaveAudioSetEntry.newBuilder()
            .setName("existing_audio.wav")
            .setTimeSeconds(0.0f)
            .setUrl("/assets/existing_123.wav")
            .build();

    new File(assetsDir, "existing_123.wav").createNewFile();

    AssetMessage result = assetService.saveAudioSet(null, name, Arrays.asList(entry1, entry2));

    assertNotNull(result);
    assertEquals(name, result.getName());
    assertEquals("audio_set", result.getType());

    ArgumentCaptor<Document> captor = ArgumentCaptor.forClass(Document.class);
    verify(collection).insertOne(captor.capture());
    Document doc = captor.getValue();

    assertEquals(name, doc.getString("name"));
    @SuppressWarnings("unchecked")
    List<Document> entries = (List<Document>) doc.get("audio_entries");
    assertEquals(2, entries.size());

    assertTrue(entries.get(0).getString("url").startsWith("/assets/"));
    assertEquals("/assets/existing_123.wav", entries.get(1).getString("url"));
  }

  @Test
  public void testBackfillDefaultThemeIncludesFuelGauge() {
    // 1. Mock theme not found
    FindIterable<Document> emptyIterable = mock(FindIterable.class);
    when(emptyIterable.first()).thenReturn(null);
    when(themesCollection.find(any(Bson.class))).thenReturn(emptyIterable);

    assetService.backfillDefaultTheme();

    // Verify insertion of default theme
    ArgumentCaptor<Document> captor = ArgumentCaptor.forClass(Document.class);
    verify(themesCollection, atLeastOnce()).insertOne(captor.capture());

    Document theme = captor.getValue();
    Document slots = (Document) theme.get("slots");
    assertNotNull("Slots should not be null", slots);
    assertEquals("default_fuel-gauge-builtin", slots.getString("gauge.fuel"));
  }

  @Test
  public void testBackfillThemeSlotsMigrationAddsFuelGauge() {
    // Mock an existing theme without gauge.fuel in slots
    Document legacyTheme =
        new Document("_id", "theme_1")
            .append("name", "Legacy Theme")
            .append("is_default", false)
            .append("slots", new Document("flag.green", "some_asset"));

    FindIterable<Document> findIterable = mock(FindIterable.class);
    MongoCursor<Document> cursor = mock(MongoCursor.class);
    when(themesCollection.find()).thenReturn(findIterable);
    when(findIterable.iterator()).thenReturn(cursor);
    when(cursor.hasNext()).thenReturn(true, false);
    when(cursor.next()).thenReturn(legacyTheme);

    assetService.backfillDefaults();

    // Verify update was called to add the fuel gauge slot
    ArgumentCaptor<Bson> filterCaptor = ArgumentCaptor.forClass(Bson.class);
    ArgumentCaptor<Bson> updateCaptor = ArgumentCaptor.forClass(Bson.class);
    verify(themesCollection, atLeastOnce())
        .updateOne(filterCaptor.capture(), updateCaptor.capture());

    String updateStr = updateCaptor.getValue().toString();
    assertTrue("Should include gauge.fuel in update", updateStr.contains("gauge.fuel"));
    assertTrue(
        "Should include default_fuel-gauge-builtin",
        updateStr.contains("default_fuel-gauge-builtin"));
  }

  @Test
  public void testBackfillThemeSlots_HandlesNestedDocumentPaths() {
    // Mock an existing theme with corrupted nested slots
    // e.g. slots: { "flag": { "green": "id1", "red": "id2" } }
    Document corruptedTheme =
        new Document("_id", "theme_corrupted")
            .append("name", "Corrupted Theme")
            .append("is_default", false)
            .append(
                "slots", new Document("flag", new Document("green", "id1").append("red", "id2")));

    FindIterable<Document> findIterable = mock(FindIterable.class);
    MongoCursor<Document> cursor = mock(MongoCursor.class);
    when(themesCollection.find()).thenReturn(findIterable);
    when(findIterable.iterator()).thenReturn(cursor);
    when(cursor.hasNext()).thenReturn(true, false);
    when(cursor.next()).thenReturn(corruptedTheme);

    assetService.backfillThemeSlots();

    // Verify update was called TWICE for this theme
    ArgumentCaptor<Bson> updateCaptor = ArgumentCaptor.forClass(Bson.class);
    verify(themesCollection, times(2)).updateOne(any(Bson.class), updateCaptor.capture());

    List<Bson> updates = updateCaptor.getAllValues();

    // First update should be an $unset of "slots.flag"
    String firstUpdate = updates.get(0).toString();
    assertTrue("First update should be an unset", firstUpdate.contains("$unset"));
    assertTrue("Should unset slots.flag", firstUpdate.contains("slots.flag"));

    // Second update should be a $set of "slots" with flattened keys
    String secondUpdate = updates.get(1).toString();
    assertTrue("Second update should be a set", secondUpdate.contains("$set"));
    assertTrue("Should set slots.flag.green", secondUpdate.contains("flag.green"));
    assertTrue("Should set slots.flag.red", secondUpdate.contains("flag.red"));
  }

  @Test
  public void testBackfillThemeSlots_AddsNewAudioSlots() {
    // Mock an existing theme without the new audio slots
    Document existingTheme =
        new Document("_id", "theme_1")
            .append("name", "Test Theme")
            .append("is_default", false)
            .append(
                "audio_slots", new Document("audio.yellowflag", new Document("type", "preset")));

    FindIterable<Document> findIterable = mock(FindIterable.class);
    MongoCursor<Document> cursor = mock(MongoCursor.class);
    when(themesCollection.find()).thenReturn(findIterable);
    when(findIterable.iterator()).thenReturn(cursor);
    when(cursor.hasNext()).thenReturn(true, false);
    when(cursor.next()).thenReturn(existingTheme);

    assetService.backfillThemeSlots();

    // Verify update was called to add the new audio slots
    ArgumentCaptor<Bson> updateCaptor = ArgumentCaptor.forClass(Bson.class);
    verify(themesCollection, atLeastOnce()).updateOne(any(Bson.class), updateCaptor.capture());

    String lastUpdate = updateCaptor.getValue().toString();
    assertTrue("Should include audio.min_lap_time", lastUpdate.contains("audio.min_lap_time"));
    assertTrue("Should include audio.drift_lap", lastUpdate.contains("audio.drift_lap"));
    assertTrue("Should include default TTS text", lastUpdate.contains("min lap time"));
    assertTrue("Should include default TTS text", lastUpdate.contains("drift lap"));
  }

  @Test
  public void testBackfillThemeSlots_AddsHeatOverAndRaceOverAudioSlots() {
    Document existingTheme =
        new Document("_id", "theme_2")
            .append("name", "Test Theme 2")
            .append("is_default", false)
            .append(
                "audio_slots", new Document("audio.yellowflag", new Document("type", "preset")));

    FindIterable<Document> findIterable = mock(FindIterable.class);
    MongoCursor<Document> cursor = mock(MongoCursor.class);
    when(themesCollection.find()).thenReturn(findIterable);
    when(findIterable.iterator()).thenReturn(cursor);
    when(cursor.hasNext()).thenReturn(true, false);
    when(cursor.next()).thenReturn(existingTheme);

    assetService.backfillThemeSlots();

    ArgumentCaptor<Bson> updateCaptor = ArgumentCaptor.forClass(Bson.class);
    verify(themesCollection, atLeastOnce()).updateOne(any(Bson.class), updateCaptor.capture());

    String lastUpdate = updateCaptor.getValue().toString();
    assertTrue("Should include audio.heat_over", lastUpdate.contains("audio.heat_over"));
    assertTrue("Should include audio.race_over", lastUpdate.contains("audio.race_over"));
  }

  @Test
  public void testSaveCustomRotation_Valid() {
    com.antigravity.proto.CustomHeat heat1 =
        com.antigravity.proto.CustomHeat.newBuilder()
            .addAllDriverIndices(Arrays.asList(1, 2, 0, 0))
            .setGroup(0)
            .build();
    com.antigravity.proto.CustomHeat heat2 =
        com.antigravity.proto.CustomHeat.newBuilder()
            .addAllDriverIndices(Arrays.asList(3, 4, 0, 0))
            .setGroup(0)
            .build();
    com.antigravity.proto.CustomRotation rotation =
        com.antigravity.proto.CustomRotation.newBuilder()
            .setNumDrivers(4)
            .addHeats(heat1)
            .addHeats(heat2)
            .build();

    AssetMessage result =
        assetService.saveCustomRotation(null, "Valid Rotation", 4, Arrays.asList(rotation));
    assertNotNull(result);
    assertEquals("Valid Rotation", result.getName());
    assertEquals("custom_rotation", result.getType());
  }

  @Test(expected = IllegalArgumentException.class)
  public void testSaveCustomRotation_DuplicateDriversInHeat() {
    com.antigravity.proto.CustomHeat heat1 =
        com.antigravity.proto.CustomHeat.newBuilder()
            .addAllDriverIndices(Arrays.asList(1, 1, 0, 0))
            .setGroup(0)
            .build();
    com.antigravity.proto.CustomRotation rotation =
        com.antigravity.proto.CustomRotation.newBuilder().setNumDrivers(4).addHeats(heat1).build();

    assetService.saveCustomRotation(null, "Invalid Duplicate Rotation", 4, Arrays.asList(rotation));
  }

  @Test(expected = IllegalArgumentException.class)
  public void testSaveCustomRotation_DriverInMultipleGroups() {
    com.antigravity.proto.CustomHeat heat1 =
        com.antigravity.proto.CustomHeat.newBuilder()
            .addAllDriverIndices(Arrays.asList(1, 2, 0, 0))
            .setGroup(0)
            .build();
    com.antigravity.proto.CustomHeat heat2 =
        com.antigravity.proto.CustomHeat.newBuilder()
            .addAllDriverIndices(Arrays.asList(1, 3, 0, 0))
            .setGroup(1)
            .build();
    com.antigravity.proto.CustomRotation rotation =
        com.antigravity.proto.CustomRotation.newBuilder()
            .setNumDrivers(4)
            .addHeats(heat1)
            .addHeats(heat2)
            .build();

    assetService.saveCustomRotation(null, "Invalid Group Rotation", 4, Arrays.asList(rotation));
  }

  private com.antigravity.proto.CustomRotation createValidRotation() {
    com.antigravity.proto.CustomHeat heat =
        com.antigravity.proto.CustomHeat.newBuilder()
            .addAllDriverIndices(Arrays.asList(1, 2, 0, 0))
            .setGroup(0)
            .build();
    return com.antigravity.proto.CustomRotation.newBuilder()
        .setNumDrivers(4)
        .addHeats(heat)
        .build();
  }

  @Test(expected = IllegalArgumentException.class)
  public void testSaveCustomRotation_EmptyName() {
    assetService.saveCustomRotation(null, "", 4, Arrays.asList(createValidRotation()));
  }

  @Test(expected = IllegalArgumentException.class)
  public void testSaveCustomRotation_NullName() {
    assetService.saveCustomRotation(null, null, 4, Arrays.asList(createValidRotation()));
  }

  @Test(expected = IllegalArgumentException.class)
  public void testSaveCustomRotation_EmptyRotations() {
    assetService.saveCustomRotation(null, "Valid Name", 4, Arrays.asList());
  }

  @Test(expected = IllegalArgumentException.class)
  public void testSaveCustomRotation_NullRotations() {
    assetService.saveCustomRotation(null, "Valid Name", 4, null);
  }

  @Test(expected = IllegalArgumentException.class)
  public void testSaveCustomRotation_DuplicateName() {
    FindIterable<Document> duplicateIterable = mock(FindIterable.class);
    when(duplicateIterable.first()).thenReturn(new Document("name", "Duplicate Name"));
    when(collection.find(any(Bson.class))).thenReturn(duplicateIterable);

    assetService.saveCustomRotation(
        null, "Duplicate Name", 4, Arrays.asList(createValidRotation()));
  }
}
