package com.antigravity.service;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Before;
import org.junit.Test;

public class UpdateServiceTest {

  private ServerConfigService mockConfigService;
  private ObjectMapper mapper = new ObjectMapper();

  @Before
  public void setUp() {
    mockConfigService = mock(ServerConfigService.class);
    when(mockConfigService.getSkippedUpdateVersion()).thenReturn(null);
    when(mockConfigService.getUpdateChannel()).thenReturn("ALPHA");
    when(mockConfigService.getSnoozedUpdateVersion()).thenReturn(null);
    when(mockConfigService.getSnoozedUpdateUntil()).thenReturn(0L);
  }

  @Test
  public void testCheckForUpdates_NewerVersionAvailable() throws Exception {
    UpdateService service = spy(new UpdateService("v0.0.0-alpha.20260701", mockConfigService));

    String json =
        "[\n"
            + "  {\n"
            + "    \"tag_name\": \"v0.0.0-alpha.20260710\",\n"
            + "    \"published_at\": \"2026-07-10T14:00:00Z\",\n"
            + "    \"body\": \"New stuff\",\n"
            + "    \"html_url\": \"https://github.com/test/releases/tag/v0.0.0-alpha.20260710\",\n"
            + "    \"assets\": []\n"
            + "  },\n"
            + "  {\n"
            + "    \"tag_name\": \"v0.0.0-alpha.20260701\",\n"
            + "    \"published_at\": \"2026-07-01T14:00:00Z\",\n"
            + "    \"assets\": []\n"
            + "  }\n"
            + "]";
    JsonNode releases = mapper.readTree(json);
    doReturn(releases).when(service).fetchReleasesNode();

    UpdateService.UpdateCheckResult result = service.checkForUpdates();
    assertTrue("Update should be available", result.updateAvailable);
    assertEquals("v0.0.0-alpha.20260710", result.latestVersion);
    assertEquals("New stuff", result.releaseNotes);
    assertEquals("https://github.com/test/releases/tag/v0.0.0-alpha.20260710", result.releaseUrl);
  }

  @Test
  public void testCheckForUpdates_NewerVersionSkipped() throws Exception {
    when(mockConfigService.getSkippedUpdateVersion()).thenReturn("v0.0.0-alpha.20260710");
    UpdateService service = spy(new UpdateService("v0.0.0-alpha.20260701", mockConfigService));

    String json =
        "[\n"
            + "  {\n"
            + "    \"tag_name\": \"v0.0.0-alpha.20260710\",\n"
            + "    \"published_at\": \"2026-07-10T14:00:00Z\",\n"
            + "    \"assets\": []\n"
            + "  },\n"
            + "  {\n"
            + "    \"tag_name\": \"v0.0.0-alpha.20260701\",\n"
            + "    \"published_at\": \"2026-07-01T14:00:00Z\",\n"
            + "    \"assets\": []\n"
            + "  }\n"
            + "]";
    JsonNode releases = mapper.readTree(json);
    doReturn(releases).when(service).fetchReleasesNode();

    UpdateService.UpdateCheckResult result = service.checkForUpdates();
    assertFalse("Update should NOT be available because it was skipped", result.updateAvailable);
  }

  @Test
  public void testCheckForUpdates_DevVersion() throws Exception {
    UpdateService service = spy(new UpdateService("0.0.0_dev", mockConfigService));

    String json =
        "[\n"
            + "  {\n"
            + "    \"tag_name\": \"v0.0.0-alpha.20260710\",\n"
            + "    \"published_at\": \"2026-07-10T14:00:00Z\",\n"
            + "    \"assets\": []\n"
            + "  }\n"
            + "]";
    JsonNode releases = mapper.readTree(json);
    doReturn(releases).when(service).fetchReleasesNode();

    UpdateService.UpdateCheckResult result = service.checkForUpdates();
    assertTrue("Update should always be available on dev version", result.updateAvailable);
    assertEquals("v0.0.0-alpha.20260710", result.latestVersion);
  }

  @Test
  public void testCheckForUpdates_OldTagButNewerPublishedDate() throws Exception {
    UpdateService service = spy(new UpdateService("v0.0.0-alpha.c6f719d", mockConfigService));

    String json =
        "[\n"
            + "  {\n"
            + "    \"tag_name\": \"v0.0.0-alpha.20260710\",\n"
            + "    \"published_at\": \"2026-07-10T14:00:00Z\",\n"
            + "    \"assets\": []\n"
            + "  },\n"
            + "  {\n"
            + "    \"tag_name\": \"v0.0.0-alpha.c6f719d\",\n"
            + "    \"published_at\": \"2026-07-01T14:00:00Z\",\n"
            + "    \"assets\": []\n"
            + "  }\n"
            + "]";
    JsonNode releases = mapper.readTree(json);
    doReturn(releases).when(service).fetchReleasesNode();

    UpdateService.UpdateCheckResult result = service.checkForUpdates();
    assertTrue(
        "Should detect newer version based on published_at despite tag name alphabetical order",
        result.updateAvailable);
    assertEquals("v0.0.0-alpha.20260710", result.latestVersion);
  }

  @Test
  public void testCheckForUpdates_SameVersionNoVPrefixInApp() throws Exception {
    UpdateService service = spy(new UpdateService("0.0.0-alpha.20260710", mockConfigService));

    String json =
        "[\n"
            + "  {\n"
            + "    \"tag_name\": \"v0.0.0-alpha.20260710\",\n"
            + "    \"published_at\": \"2026-07-10T14:00:00Z\",\n"
            + "    \"assets\": []\n"
            + "  }\n"
            + "]";
    JsonNode releases = mapper.readTree(json);
    doReturn(releases).when(service).fetchReleasesNode();

    UpdateService.UpdateCheckResult result = service.checkForUpdates();
    assertFalse(
        "Update should NOT be available because the versions match exactly despite the 'v' prefix in the tag",
        result.updateAvailable);
  }

  @Test
  public void testCheckForUpdates_FindsDownloadUrlWithVersionedFilenames() throws Exception {
    UpdateService service = spy(new UpdateService("0.0.0", mockConfigService));

    String json =
        "[\n"
            + "  {\n"
            + "    \"tag_name\": \"v1.0.0-alpha.123\",\n"
            + "    \"published_at\": \"2026-07-10T14:00:00Z\",\n"
            + "    \"assets\": [\n"
            + "      {\n"
            + "        \"name\": \"RaceCoordinatorAI_Online_Setup_v1.0.0-alpha.123.exe\",\n"
            + "        \"size\": 50000000,\n"
            + "        \"browser_download_url\": \"https://github.com/win-setup.exe\"\n"
            + "      },\n"
            + "      {\n"
            + "        \"name\": \"RaceCoordinator_Mac_v1.0.0-alpha.123.dmg\",\n"
            + "        \"size\": 25000000,\n"
            + "        \"browser_download_url\": \"https://github.com/mac-setup.dmg\"\n"
            + "      },\n"
            + "      {\n"
            + "        \"name\": \"RaceCoordinatorAI_Linux_v1.0.0-alpha.123.tar.gz\",\n"
            + "        \"size\": 30000000,\n"
            + "        \"browser_download_url\": \"https://github.com/linux-setup.tar.gz\"\n"
            + "      }\n"
            + "    ]\n"
            + "  }\n"
            + "]";
    JsonNode releases = mapper.readTree(json);
    doReturn(releases).when(service).fetchReleasesNode();

    UpdateService.UpdateCheckResult result = service.checkForUpdates();

    assertTrue("Update should be available", result.updateAvailable);

    if (result.isWindows) {
      assertEquals("https://github.com/win-setup.exe", result.downloadUrl);
      assertEquals(50000000L, result.downloadSize);
    } else if (result.isLinux) {
      assertEquals("https://github.com/linux-setup.tar.gz", result.downloadUrl);
      assertEquals(30000000L, result.downloadSize);
    } else {
      assertEquals("https://github.com/mac-setup.dmg", result.downloadUrl);
      assertEquals(25000000L, result.downloadSize);
    }
  }

  @Test
  public void testCheckForUpdates_FindsLinuxArm64Asset() throws Exception {
    UpdateService service = spy(new UpdateService("0.0.0", mockConfigService));

    String json =
        "[\n"
            + "  {\n"
            + "    \"tag_name\": \"v1.0.0-alpha.123\",\n"
            + "    \"published_at\": \"2026-07-10T14:00:00Z\",\n"
            + "    \"assets\": [\n"
            + "      {\n"
            + "        \"name\": \"RaceCoordinatorAI-Linux-ARM64.tar.gz\",\n"
            + "        \"size\": 35000000,\n"
            + "        \"browser_download_url\": \"https://github.com/linux-arm64.tar.gz\"\n"
            + "      }\n"
            + "    ]\n"
            + "  }\n"
            + "]";
    JsonNode releases = mapper.readTree(json);
    doReturn(releases).when(service).fetchReleasesNode();

    UpdateService.UpdateCheckResult result = service.checkForUpdates();

    assertTrue("Update should be available", result.updateAvailable);

    if (result.isLinux) {
      assertEquals("https://github.com/linux-arm64.tar.gz", result.downloadUrl);
      assertEquals(35000000L, result.downloadSize);
    }
  }

  @Test
  public void testCheckForUpdates_NewerVersionThanSkippedAvailable() throws Exception {
    when(mockConfigService.getSkippedUpdateVersion()).thenReturn("v0.0.0-alpha.20260710");
    UpdateService service = spy(new UpdateService("v0.0.0-alpha.20260701", mockConfigService));

    String json =
        "[\n"
            + "  {\n"
            + "    \"tag_name\": \"v0.0.0-alpha.20260715\",\n"
            + "    \"published_at\": \"2026-07-15T14:00:00Z\",\n"
            + "    \"assets\": []\n"
            + "  },\n"
            + "  {\n"
            + "    \"tag_name\": \"v0.0.0-alpha.20260710\",\n"
            + "    \"published_at\": \"2026-07-10T14:00:00Z\",\n"
            + "    \"assets\": []\n"
            + "  },\n"
            + "  {\n"
            + "    \"tag_name\": \"v0.0.0-alpha.20260701\",\n"
            + "    \"published_at\": \"2026-07-01T14:00:00Z\",\n"
            + "    \"assets\": []\n"
            + "  }\n"
            + "]";
    JsonNode releases = mapper.readTree(json);
    doReturn(releases).when(service).fetchReleasesNode();

    UpdateService.UpdateCheckResult result = service.checkForUpdates();
    assertTrue(
        "Update should be available because the latest version is newer than the skipped version",
        result.updateAvailable);
    assertEquals("v0.0.0-alpha.20260715", result.latestVersion);
  }

  @Test
  public void testCheckForUpdates_BaseVersionNotFound() throws Exception {
    // Current version is "v0.0.0-alpha.xyz123" which is NOT in the releases JSON
    UpdateService service = spy(new UpdateService("v0.0.0-alpha.xyz123", mockConfigService));

    String json =
        "[\n"
            + "  {\n"
            + "    \"tag_name\": \"v0.0.0-alpha.20260710\",\n"
            + "    \"published_at\": \"2026-07-10T14:00:00Z\",\n"
            + "    \"assets\": []\n"
            + "  }\n"
            + "]";
    JsonNode releases = mapper.readTree(json);
    doReturn(releases).when(service).fetchReleasesNode();

    UpdateService.UpdateCheckResult result = service.checkForUpdates();
    assertTrue(
        "Update should be available because the base version is completely missing from github releases",
        result.updateAvailable);
    assertEquals("v0.0.0-alpha.20260710", result.latestVersion);
  }

  @Test
  public void testClearCache() throws Exception {
    UpdateService service = spy(new UpdateService("v0.0.0-alpha.20260701", mockConfigService));

    String json =
        "[\n"
            + "  {\n"
            + "    \"tag_name\": \"v0.0.0-alpha.20260710\",\n"
            + "    \"published_at\": \"2026-07-10T14:00:00Z\",\n"
            + "    \"assets\": []\n"
            + "  }\n"
            + "]";
    JsonNode releases = mapper.readTree(json);
    doReturn(releases).when(service).fetchReleasesNode();

    UpdateService.UpdateCheckResult firstResult = service.checkForUpdates();
    assertTrue(firstResult.updateAvailable);

    // Now mock skipping the version
    when(mockConfigService.getSkippedUpdateVersion()).thenReturn("v0.0.0-alpha.20260710");

    // Without clearCache, it should return the cached result (updateAvailable = true)
    UpdateService.UpdateCheckResult secondResult = service.checkForUpdates();
    assertTrue("Should still return cached result", secondResult.updateAvailable);

    // After clearCache, it should re-fetch and see that the latest is now skipped
    service.clearCache();
    UpdateService.UpdateCheckResult thirdResult = service.checkForUpdates();
    assertFalse(
        "Should be false because we cleared cache and skipped the version",
        thirdResult.updateAvailable);
  }

  @Test
  public void testCancelDownload() {
    UpdateService service = new UpdateService("0.0.0", mockConfigService);

    // Call cancel
    service.cancelDownload();

    // State should be updated
    UpdateService.UpdateProgress progress = service.getDownloadProgress();
    assertEquals("RDS_UPDATE_STATUS_CANCELLED", progress.status);
  }

  @Test
  public void testGetDownloadProgress() {
    UpdateService service = new UpdateService("0.0.0", mockConfigService);

    UpdateService.UpdateProgress progress = service.getDownloadProgress();
    assertEquals(0, progress.progress);
    assertEquals("", progress.status);
  }

  @Test
  public void testCalculateDownloadProgressWithContentLength() {
    // 50MB out of 100MB
    int progress = UpdateService.calculateDownloadProgress(50 * 1024 * 1024L, 100 * 1024 * 1024);
    assertEquals(50, progress);

    // 100% complete
    progress = UpdateService.calculateDownloadProgress(100 * 1024 * 1024L, 100 * 1024 * 1024);
    assertEquals(100, progress);
  }

  @Test
  public void testCalculateDownloadProgressWithoutContentLength() {
    // 75MB downloaded, no content length (fallback is 150MB)
    int progress = UpdateService.calculateDownloadProgress(75 * 1024 * 1024L, -1);
    assertEquals(50, progress); // 75MB / 150MB = 50%

    // 150MB downloaded, no content length (fallback is 150MB, capped at 99%)
    progress = UpdateService.calculateDownloadProgress(150 * 1024 * 1024L, -1);
    assertEquals(99, progress); // Should cap at 99%

    // 200MB downloaded, no content length (exceeds fallback, still capped at 99%)
    progress = UpdateService.calculateDownloadProgress(200 * 1024 * 1024L, -1);
    assertEquals(99, progress);
  }

  @Test
  public void testCheckForUpdates_AlphaChannel_SelectsNewestRelease() throws Exception {
    when(mockConfigService.getUpdateChannel()).thenReturn("ALPHA");
    UpdateService service = spy(new UpdateService("v0.0.0-alpha.20260701", mockConfigService));

    String json =
        "[\n"
            + "  {\n"
            + "    \"tag_name\": \"v1.0.0\",\n"
            + "    \"published_at\": \"2026-07-20T14:00:00Z\",\n"
            + "    \"assets\": []\n"
            + "  },\n"
            + "  {\n"
            + "    \"tag_name\": \"v1.0.0-beta.1\",\n"
            + "    \"published_at\": \"2026-07-15T14:00:00Z\",\n"
            + "    \"assets\": []\n"
            + "  },\n"
            + "  {\n"
            + "    \"tag_name\": \"v0.0.0-alpha.20260710\",\n"
            + "    \"published_at\": \"2026-07-10T14:00:00Z\",\n"
            + "    \"assets\": []\n"
            + "  }\n"
            + "]";
    JsonNode releases = mapper.readTree(json);
    doReturn(releases).when(service).fetchReleasesNode();

    UpdateService.UpdateCheckResult result = service.checkForUpdates();
    assertTrue(result.updateAvailable);
    assertEquals("v1.0.0", result.latestVersion);
  }

  @Test
  public void testCheckForUpdates_BetaChannel_FiltersOutAlpha() throws Exception {
    when(mockConfigService.getUpdateChannel()).thenReturn("BETA");
    UpdateService service = spy(new UpdateService("v1.0.0-beta.1", mockConfigService));

    String json =
        "[\n"
            + "  {\n"
            + "    \"tag_name\": \"v0.0.0-alpha.20260720\",\n"
            + "    \"published_at\": \"2026-07-20T14:00:00Z\",\n"
            + "    \"assets\": []\n"
            + "  },\n"
            + "  {\n"
            + "    \"tag_name\": \"v1.0.0-beta.2\",\n"
            + "    \"published_at\": \"2026-07-15T14:00:00Z\",\n"
            + "    \"assets\": []\n"
            + "  }\n"
            + "]";
    JsonNode releases = mapper.readTree(json);
    doReturn(releases).when(service).fetchReleasesNode();

    UpdateService.UpdateCheckResult result = service.checkForUpdates();
    assertTrue(result.updateAvailable);
    assertEquals("v1.0.0-beta.2", result.latestVersion);
  }

  @Test
  public void testCheckForUpdates_ProductionChannel_FiltersOutAlphaAndBeta() throws Exception {
    when(mockConfigService.getUpdateChannel()).thenReturn("PRODUCTION");
    UpdateService service = spy(new UpdateService("v1.0.0", mockConfigService));

    String json =
        "[\n"
            + "  {\n"
            + "    \"tag_name\": \"v0.0.0-alpha.20260720\",\n"
            + "    \"published_at\": \"2026-07-20T14:00:00Z\",\n"
            + "    \"assets\": []\n"
            + "  },\n"
            + "  {\n"
            + "    \"tag_name\": \"v1.1.0-beta.1\",\n"
            + "    \"published_at\": \"2026-07-15T14:00:00Z\",\n"
            + "    \"assets\": []\n"
            + "  },\n"
            + "  {\n"
            + "    \"tag_name\": \"v1.0.1\",\n"
            + "    \"published_at\": \"2026-07-10T14:00:00Z\",\n"
            + "    \"assets\": []\n"
            + "  }\n"
            + "]";
    JsonNode releases = mapper.readTree(json);
    doReturn(releases).when(service).fetchReleasesNode();

    UpdateService.UpdateCheckResult result = service.checkForUpdates();
    assertTrue(result.updateAvailable);
    assertEquals("v1.0.1", result.latestVersion);
  }

  @Test
  public void testCheckForUpdates_DisabledChannel_ReturnsFalseUnlessForced() throws Exception {
    when(mockConfigService.getUpdateChannel()).thenReturn("DISABLED");
    UpdateService service = spy(new UpdateService("v1.0.0", mockConfigService));

    String json =
        "[\n"
            + "  {\n"
            + "    \"tag_name\": \"v1.0.1\",\n"
            + "    \"published_at\": \"2026-07-10T14:00:00Z\",\n"
            + "    \"assets\": []\n"
            + "  }\n"
            + "]";
    JsonNode releases = mapper.readTree(json);
    doReturn(releases).when(service).fetchReleasesNode();

    UpdateService.UpdateCheckResult autoResult = service.checkForUpdates(false);
    assertFalse(autoResult.updateAvailable);

    service.clearCache();
    UpdateService.UpdateCheckResult forceResult = service.checkForUpdates(true);
    assertTrue(forceResult.updateAvailable);
    assertEquals("v1.0.1", forceResult.latestVersion);
  }

  @Test
  public void testCheckForUpdates_SnoozedUpdate_SuppressedUntilExpired() throws Exception {
    when(mockConfigService.getSnoozedUpdateVersion()).thenReturn("v1.0.1");
    // Snooze active for next 7 days
    when(mockConfigService.getSnoozedUpdateUntil())
        .thenReturn(System.currentTimeMillis() + 7 * 86400000L);

    UpdateService service = spy(new UpdateService("v1.0.0", mockConfigService));

    String json =
        "[\n"
            + "  {\n"
            + "    \"tag_name\": \"v1.0.1\",\n"
            + "    \"published_at\": \"2026-07-10T14:00:00Z\",\n"
            + "    \"assets\": []\n"
            + "  }\n"
            + "]";
    JsonNode releases = mapper.readTree(json);
    doReturn(releases).when(service).fetchReleasesNode();

    UpdateService.UpdateCheckResult result = service.checkForUpdates();
    assertFalse("Snoozed version should be suppressed", result.updateAvailable);

    // After snooze expires
    when(mockConfigService.getSnoozedUpdateUntil()).thenReturn(System.currentTimeMillis() - 1000L);
    service.clearCache();
    UpdateService.UpdateCheckResult expiredResult = service.checkForUpdates();
    assertTrue("Expired snooze should allow update", expiredResult.updateAvailable);
  }

  @Test
  public void testCheckForUpdates_SnoozedUpdate_NewerVersionBypassesSnooze() throws Exception {
    when(mockConfigService.getSnoozedUpdateVersion()).thenReturn("v1.0.1");
    when(mockConfigService.getSnoozedUpdateUntil())
        .thenReturn(System.currentTimeMillis() + 7 * 86400000L);

    UpdateService service = spy(new UpdateService("v1.0.0", mockConfigService));

    String json =
        "[\n"
            + "  {\n"
            + "    \"tag_name\": \"v1.0.2\",\n"
            + "    \"published_at\": \"2026-07-15T14:00:00Z\",\n"
            + "    \"assets\": []\n"
            + "  },\n"
            + "  {\n"
            + "    \"tag_name\": \"v1.0.1\",\n"
            + "    \"published_at\": \"2026-07-10T14:00:00Z\",\n"
            + "    \"assets\": []\n"
            + "  }\n"
            + "]";
    JsonNode releases = mapper.readTree(json);
    doReturn(releases).when(service).fetchReleasesNode();

    UpdateService.UpdateCheckResult result = service.checkForUpdates();
    assertTrue("Newer version v1.0.2 should bypass snooze of v1.0.1", result.updateAvailable);
    assertEquals("v1.0.2", result.latestVersion);
  }
}
