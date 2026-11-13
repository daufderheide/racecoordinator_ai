package com.antigravity.util;

public final class VersionUtils {

  private VersionUtils() {}

  /**
   * Compares two semantic version strings.
   *
   * @param v1 First version string (e.g. "1.1.0", "v1.2.0", "1.1.0-beta.1")
   * @param v2 Second version string
   * @return A negative integer, zero, or a positive integer as v1 is less than, equal to, or
   *     greater than v2.
   */
  public static int compare(String v1, String v2) {
    if (v1 == null && v2 == null) {
      return 0;
    }
    if (v1 == null) {
      return -1;
    }
    if (v2 == null) {
      return 1;
    }

    String clean1 = v1.trim();
    String clean2 = v2.trim();
    if (clean1.startsWith("v") || clean1.startsWith("V")) {
      clean1 = clean1.substring(1).trim();
    }
    if (clean2.startsWith("v") || clean2.startsWith("V")) {
      clean2 = clean2.substring(1).trim();
    }

    String[] parts1 = clean1.split("-", 2);
    String[] parts2 = clean2.split("-", 2);

    String core1 = parts1[0];
    String core2 = parts2[0];

    String[] nums1 = core1.split("\\.");
    String[] nums2 = core2.split("\\.");

    int maxLen = Math.max(nums1.length, nums2.length);
    for (int i = 0; i < maxLen; i++) {
      int n1 = i < nums1.length ? parseSafeInt(nums1[i]) : 0;
      int n2 = i < nums2.length ? parseSafeInt(nums2[i]) : 0;
      if (n1 != n2) {
        return Integer.compare(n1, n2);
      }
    }

    // Both cores are equal, check prerelease
    boolean hasPre1 = parts1.length > 1 && !parts1[1].isEmpty();
    boolean hasPre2 = parts2.length > 1 && !parts2[1].isEmpty();

    if (!hasPre1 && !hasPre2) {
      return 0;
    }
    // Normal release is higher than prerelease with same core version
    if (!hasPre1) {
      return 1;
    }
    if (!hasPre2) {
      return -1;
    }

    return parts1[1].compareTo(parts2[1]);
  }

  private static int parseSafeInt(String s) {
    if (s == null || s.isEmpty()) {
      return 0;
    }
    try {
      return Integer.parseInt(s.replaceAll("[^0-9]", ""));
    } catch (NumberFormatException e) {
      return 0;
    }
  }
}
