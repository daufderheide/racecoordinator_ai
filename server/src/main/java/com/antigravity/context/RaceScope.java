package com.antigravity.context;

/**
 * Represents the database scope for race data execution and queries. Distinguishes between
 * production (live) race data and demo race data.
 */
public enum RaceScope {
  PRODUCTION,
  DEMO;

  /**
   * Returns the table name formatted for this scope. Demo tables are prefixed with "demo_", while
   * production tables use the base name.
   */
  public String getCollectionName(String baseName) {
    if (baseName == null) {
      return null;
    }
    return this == DEMO ? "demo_" + baseName : baseName;
  }

  /** Helper to convert a boolean flag (isDemo) into a type-safe RaceScope. */
  public static RaceScope fromBoolean(boolean isDemo) {
    return isDemo ? DEMO : PRODUCTION;
  }

  /** Returns true if this scope represents demo mode. */
  public boolean isDemo() {
    return this == DEMO;
  }
}
