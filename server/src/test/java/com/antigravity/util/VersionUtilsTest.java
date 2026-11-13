package com.antigravity.util;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public class VersionUtilsTest {

  @Test
  public void testCompareVersions() {
    assertEquals(0, VersionUtils.compare("1.1.0", "1.1.0"));
    assertEquals(0, VersionUtils.compare("v1.1.0", "1.1.0"));
    assertEquals(0, VersionUtils.compare("1.1.0", "V1.1.0"));
    assertEquals(0, VersionUtils.compare(null, null));

    assertTrue(VersionUtils.compare("1.2.0", "1.1.0") > 0);
    assertTrue(VersionUtils.compare("1.1.0", "1.2.0") < 0);
    assertTrue(VersionUtils.compare("2.0.0", "1.9.9") > 0);
    assertTrue(VersionUtils.compare("1.1.1", "1.1.0") > 0);
    assertTrue(VersionUtils.compare("1.10.0", "1.9.0") > 0);

    // Prerelease comparison
    assertTrue(VersionUtils.compare("1.1.0", "1.1.0-alpha") > 0);
    assertTrue(VersionUtils.compare("1.1.0-alpha", "1.1.0") < 0);
    assertTrue(VersionUtils.compare("1.1.0-beta", "1.1.0-alpha") > 0);

    // Null safety
    assertTrue(VersionUtils.compare("1.0.0", null) > 0);
    assertTrue(VersionUtils.compare(null, "1.0.0") < 0);
  }
}
