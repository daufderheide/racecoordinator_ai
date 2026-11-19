package com.antigravity.importer.club;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Request and response shapes of the club package import. The preview is stateless: the client
 * sends the package and the chosen resolutions back to commit.
 * https://github.com/daufderheide/racecoordinator_ai/issues/972
 */
public final class ClubImport {

  private ClubImport() {}

  /** How an item in the package was matched to this PC. */
  public enum MatchType {
    CLUB_ID,
    NAME,
    NONE
  }

  /** What to do with a driver, track or race class. */
  public enum ItemResolution {
    /** Use the existing item as it is. */
    MATCH,
    /** Use the existing item and update it from the package. */
    UPDATE,
    /** Add the item as a new one. */
    CREATE
  }

  /** What to do with the championship. */
  public enum SeasonResolution {
    MERGE,
    CREATE
  }

  /** Whether a race night is already here. */
  public enum NightStatus {
    NEW,
    SAME,
    CHANGED
  }

  /** What to do with a race night. */
  public enum NightResolution {
    ADD,
    UPDATE,
    SKIP
  }

  /** A driver, track or race class from the package. */
  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class Item {
    public String ref;
    public String clubId;
    public String name;
    public String detail;
    public MatchType matchType = MatchType.NONE;
    public String existingId;
    public String existingName;
    public List<String> differences = new ArrayList<>();
    public ItemResolution resolution = ItemResolution.CREATE;
  }

  /** The championship (season) from the package. */
  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class SeasonChoice {
    public String clubId;
    public String name;
    public int packageDrops;
    public MatchType matchType = MatchType.NONE;
    public String existingId;
    public String existingName;
    public Integer existingDrops;
    public SeasonResolution resolution = SeasonResolution.CREATE;

    /** Take the package's number of dropped races when merging. */
    public boolean usePackageDrops = true;
  }

  /** One race night from the package. */
  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class Night {
    public String key;
    public String historyId;
    public String raceName;
    public long timestamp;
    public int driverCount;
    public boolean hasHistory;
    public NightStatus status = NightStatus.NEW;
    public NightResolution resolution = NightResolution.ADD;
  }

  /** An existing item on this PC, for the "match to" choice. */
  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class Option {
    public String id;
    public String name;

    public Option() {}

    public Option(String id, String name) {
      this.id = id;
      this.name = name;
    }
  }

  /** The preview of a package: what would happen, with defaults the user can change. */
  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class Preview {
    public int formatVersion;
    public String sourceAppVersion;
    public long exportedAt;
    public SeasonChoice season;
    public List<Item> drivers = new ArrayList<>();
    public List<Item> tracks = new ArrayList<>();
    public List<Item> raceClasses = new ArrayList<>();
    public List<Night> raceNights = new ArrayList<>();
    public Map<String, List<Option>> existing = new LinkedHashMap<>();
    public List<String> warnings = new ArrayList<>();

    /** The package itself, sent back unchanged on commit. */
    public JsonNode packageData;
  }

  /** The commit: the package plus the chosen resolutions. */
  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class CommitRequest {
    public JsonNode packageData;
    public SeasonChoice season;
    public List<Item> drivers = new ArrayList<>();
    public List<Item> tracks = new ArrayList<>();
    public List<Item> raceClasses = new ArrayList<>();
    public List<Night> raceNights = new ArrayList<>();
  }

  /** What the import did. */
  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class Result {
    public boolean success;
    public String seasonId;
    public String seasonName;
    public int nightsAdded;
    public int nightsUpdated;
    public int nightsSkipped;
    public int driversCreated;
    public int driversUpdated;
    public int driversMatched;
    public int tracksCreated;
    public int tracksUpdated;
    public int tracksMatched;
    public int raceClassesCreated;
    public int raceClassesUpdated;
    public int raceClassesMatched;
    public List<String> messages = new ArrayList<>();
  }
}
