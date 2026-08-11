package com.antigravity.service;

import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;

import com.antigravity.context.DatabaseContext;
import com.antigravity.proto.AssetMessage;
import java.io.File;
import java.io.IOException;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;

public class AssetServiceTest {

  @Rule public TemporaryFolder tempFolder = new TemporaryFolder();

  private DatabaseContext databaseContext;
  private AssetService assetService;
  private String assetsDir;

  @Before
  public void setup() throws Exception {
    String rootDir = tempFolder.newFolder("db_root").getAbsolutePath() + File.separator;
    databaseContext = new DatabaseContext("test_db", null, rootDir);
    assetsDir = tempFolder.newFolder("assets").getAbsolutePath();

    assetService = new AssetService(databaseContext, assetsDir);
  }

  @After
  public void teardown() throws IOException {
    if (databaseContext != null && databaseContext.getConnection() != null) {
      try {
        databaseContext.getConnection().close();
      } catch (Exception ignored) {
      }
    }
  }

  @Test
  public void testGetAssetById_NotFound() {
    AssetMessage asset = assetService.getAssetById("non_existent");
    assertNull(asset);
  }

  @Test
  public void testAssetServiceInitialization() {
    assertNotNull(assetService);
  }

  @Test
  public void testBackfillDefaults() {
    assetService.backfillDefaults();
    assertNotNull(assetService.getAssetById("default_countdown"));
    assertNotNull(assetService.getAssetById("default_seconds_left"));
    assertNotNull(assetService.getAssetById("default_fuel_gauge"));
  }
}
