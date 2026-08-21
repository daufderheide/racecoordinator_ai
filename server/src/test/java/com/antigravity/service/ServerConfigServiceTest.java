package com.antigravity.service;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import java.io.File;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;

public class ServerConfigServiceTest {

  @Rule public TemporaryFolder tempFolder = new TemporaryFolder();

  @Before
  public void setUp() throws Exception {
    File appDataDir = tempFolder.newFolder("app_data_test");
    System.setProperty("app.data.dir", appDataDir.getAbsolutePath());
  }

  @Test
  public void testConfigGettersAndSetters() {
    ServerConfigService service = new ServerConfigService();

    assertEquals("RC AI Director", service.getDirectorPassword());
    assertTrue(service.isShareAnalyticsEnabled());
    assertNotNull(service.getAnalyticsClientId());

    service.setLastActiveDatabase("test_db");
    assertEquals("test_db", service.getLastActiveDatabase());

    service.setDirectorPassword("new_password");
    assertEquals("new_password", service.getDirectorPassword());

    service.setStartTime(10.0);
    assertEquals(10.0, service.getStartTime(), 0.001);

    service.setRestartTime(4.0);
    assertEquals(4.0, service.getRestartTime(), 0.001);

    service.setStartRandomizer(2.0);
    assertEquals(2.0, service.getStartRandomizer(), 0.001);

    service.setRestartRandomizer(1.5);
    assertEquals(1.5, service.getRestartRandomizer(), 0.001);

    service.setSkippedUpdateVersion("2.0.0");
    assertEquals("2.0.0", service.getSkippedUpdateVersion());

    assertEquals("ALPHA", service.getUpdateChannel());
    service.setUpdateChannel("PRODUCTION");
    assertEquals("PRODUCTION", service.getUpdateChannel());

    service.setSnoozedUpdate("2.0.0", 1234567890L);
    assertEquals("2.0.0", service.getSnoozedUpdateVersion());
    assertEquals(1234567890L, service.getSnoozedUpdateUntil());

    service.clearSnoozedUpdate();
    assertEquals(null, service.getSnoozedUpdateVersion());
    assertEquals(0L, service.getSnoozedUpdateUntil());

    assertEquals("ALPHA", ServerConfigService.getDefaultUpdateChannel("0.0.0_dev"));
    assertEquals("ALPHA", ServerConfigService.getDefaultUpdateChannel("1.0.0-alpha.20260819"));
    assertEquals("ALPHA", ServerConfigService.getDefaultUpdateChannel("v0.0.0-alpha.20260815"));
    assertEquals("BETA", ServerConfigService.getDefaultUpdateChannel("1.0.0-beta.1"));
    assertEquals("BETA", ServerConfigService.getDefaultUpdateChannel("v1.0.0-beta.6"));
    assertEquals("PRODUCTION", ServerConfigService.getDefaultUpdateChannel("1.0.0"));
    assertEquals("PRODUCTION", ServerConfigService.getDefaultUpdateChannel("v1.0.1"));
    assertEquals("PRODUCTION", ServerConfigService.getDefaultUpdateChannel(null));
  }
}
