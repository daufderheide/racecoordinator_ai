package com.antigravity.importer;

import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import com.antigravity.context.DatabaseContext;
import com.antigravity.proto.AssetMessage;
import com.antigravity.service.AssetService;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;

public class ExportMediaCollectorTest {

  @Rule public TemporaryFolder tempFolder = new TemporaryFolder();

  private DatabaseContext databaseContext;
  private AssetService assetService;
  private ExportMediaCollector collector;

  @Before
  public void setUp() throws Exception {
    String rootDir = tempFolder.newFolder("db_root").getAbsolutePath() + File.separator;
    databaseContext = new DatabaseContext("test_db", null, rootDir);
    File assetsDir = new File(new File(databaseContext.getDataRoot(), "test_db"), "assets");
    assetService = new AssetService(databaseContext, assetsDir.getAbsolutePath());
    collector = new ExportMediaCollector(databaseContext, assetService);
  }

  @After
  public void tearDown() throws Exception {
    if (databaseContext != null && databaseContext.getConnection() != null) {
      try {
        databaseContext.getConnection().close();
      } catch (Exception ignored) {
      }
    }
  }

  @Test
  public void addsAnUploadedPictureUnderImages() throws Exception {
    byte[] bytes = new byte[] {(byte) 0x89, 'P', 'N', 'G', 1, 2, 3};
    AssetMessage asset = assetService.saveAsset("red_car.png", "image", bytes);

    collector.add(asset.getUrl(), ExportMediaCollector.IMAGE);

    assertEquals(1, collector.getFiles().size());
    ExportMediaCollector.MediaFile file = collector.getFiles().iterator().next();
    assertEquals("images/red_car.png", file.getZipEntryName());
    assertArrayEquals(bytes, file.getData());
    assertEquals("images/red_car.png", collector.getUrlToZipEntryMap().get(asset.getUrl()));
  }

  @Test
  public void addsAnUploadedSoundUnderAudio() throws Exception {
    byte[] bytes = "RIFF....WAVEfmt ....horn".getBytes(StandardCharsets.UTF_8);
    AssetMessage asset = assetService.saveAsset("horn.wav", "sound", bytes);

    collector.add(asset.getUrl(), ExportMediaCollector.SOUND);

    assertEquals("audio/horn.wav", collector.getUrlToZipEntryMap().get(asset.getUrl()));
  }

  @Test
  public void storesTheSameContentsOnlyOnce() throws Exception {
    byte[] bytes = new byte[] {(byte) 0x89, 'P', 'N', 'G', 9, 9, 9};
    AssetMessage first = assetService.saveAsset("first.png", "image", bytes);
    AssetMessage second = assetService.saveAsset("second.png", "image", bytes);

    collector.add(first.getUrl(), ExportMediaCollector.IMAGE);
    collector.add(second.getUrl(), ExportMediaCollector.IMAGE);

    assertEquals(1, collector.getFiles().size());
    Map<String, String> map = collector.getUrlToZipEntryMap();
    assertEquals(map.get(first.getUrl()), map.get(second.getUrl()));
  }

  @Test
  public void givesDifferentFilesWithTheSameNameUniqueEntries() throws Exception {
    AssetMessage first =
        assetService.saveAsset("car.png", "image", new byte[] {(byte) 0x89, 'P', 'N', 'G', 1});
    AssetMessage second =
        assetService.saveAsset("car.png", "image", new byte[] {(byte) 0x89, 'P', 'N', 'G', 2});

    collector.add(first.getUrl(), ExportMediaCollector.IMAGE);
    collector.add(second.getUrl(), ExportMediaCollector.IMAGE);

    assertEquals(2, collector.getFiles().size());
    Map<String, String> map = collector.getUrlToZipEntryMap();
    assertEquals("images/car.png", map.get(first.getUrl()));
    assertEquals("images/car_1.png", map.get(second.getUrl()));
  }

  @Test
  public void mapsTheOtherSpellingsOfAUrlToTheSameEntry() throws Exception {
    AssetMessage asset =
        assetService.saveAsset("blue.png", "image", new byte[] {(byte) 0x89, 'P', 'N', 'G', 4});
    String url = asset.getUrl();
    assertTrue(url.startsWith("/assets/"));

    collector.add(url, ExportMediaCollector.IMAGE);

    Map<String, String> map = collector.getUrlToZipEntryMap();
    String entry = map.get(url);
    assertEquals(entry, map.get(url.substring("/assets/".length())));
    assertEquals(entry, map.get("preset:" + url));
  }

  @Test
  public void findsBuiltInDefaultsOnTheClasspath() throws Exception {
    collector.add("assets/defaults/helmets/helmet_yellow.png", ExportMediaCollector.IMAGE);
    collector.add("default_beep", ExportMediaCollector.SOUND);

    Map<String, String> map = collector.getUrlToZipEntryMap();
    assertEquals("images/black-yellow.png", map.get("assets/defaults/helmets/helmet_yellow.png"));
    assertEquals("audio/beep.wav", map.get("default_beep"));
    assertEquals("audio/beep.wav", map.get("preset:default_beep"));
  }

  @Test
  public void skipsEmptyAndMissingFiles() throws Exception {
    collector.add(null, ExportMediaCollector.IMAGE);
    collector.add("  ", ExportMediaCollector.IMAGE);
    collector.add("/assets/does_not_exist.png", ExportMediaCollector.IMAGE);

    assertTrue(collector.getFiles().isEmpty());
    assertNull(collector.getUrlToZipEntryMap().get("/assets/does_not_exist.png"));
  }

  @Test
  public void buildZipPutsTheDataFileFirstThenTheMedia() throws Exception {
    AssetMessage asset =
        assetService.saveAsset("green.png", "image", new byte[] {(byte) 0x89, 'P', 'N', 'G', 5});
    collector.add(asset.getUrl(), ExportMediaCollector.IMAGE);
    byte[] data = "name\nGreen car\n".getBytes(StandardCharsets.UTF_8);

    byte[] zip = ExportMediaCollector.buildZip("cars.csv", data, collector.getFiles());

    Map<String, byte[]> entries = readZip(zip);
    List<String> names = new ArrayList<>(entries.keySet());
    assertEquals("cars.csv", names.get(0));
    assertEquals("images/green.png", names.get(1));
    assertArrayEquals(data, entries.get("cars.csv"));
  }

  private static Map<String, byte[]> readZip(byte[] zip) throws Exception {
    Map<String, byte[]> entries = new LinkedHashMap<>();
    try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(zip))) {
      ZipEntry entry;
      while ((entry = zis.getNextEntry()) != null) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buf = new byte[4096];
        int n;
        while ((n = zis.read(buf)) != -1) {
          out.write(buf, 0, n);
        }
        entries.put(entry.getName(), out.toByteArray());
      }
    }
    return entries;
  }
}
