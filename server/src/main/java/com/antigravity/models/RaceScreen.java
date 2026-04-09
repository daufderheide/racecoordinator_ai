package com.antigravity.models;

import org.bson.codecs.pojo.annotations.BsonCreator;
import org.bson.codecs.pojo.annotations.BsonId;
import org.bson.codecs.pojo.annotations.BsonProperty;
import org.bson.types.ObjectId;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.Map;

public class RaceScreen extends Model {

  private final String name;
  private final List<String> columns;
  private final Map<String, Map<String, String>> columnLayouts;
  private final Map<String, String> columnVisibility;
  private final Map<String, String> columnAnchors;
  private final Boolean sortByStandings;
  private final Boolean highlightRowOnLap;
  @BsonProperty("default") @JsonProperty("isDefault")
  private final Boolean isDefault;
  @BsonProperty("enabled") @JsonProperty("isEnabled")
  private final Boolean isEnabled;
  private final Long createdAt;
  private final Long updatedAt;

  @BsonCreator
  public RaceScreen(
      @BsonProperty("name") @JsonProperty("name") String name,
      @BsonProperty("columns") @JsonProperty("columns") List<String> columns,
      @BsonProperty("columnLayouts") @JsonProperty("columnLayouts") Map<String, Map<String, String>> columnLayouts,
      @BsonProperty("columnVisibility") @JsonProperty("columnVisibility") Map<String, String> columnVisibility,
      @BsonProperty("columnAnchors") @JsonProperty("columnAnchors") Map<String, String> columnAnchors,
      @BsonProperty("sortByStandings") @JsonProperty("sortByStandings") Boolean sortByStandings,
      @BsonProperty("highlightRowOnLap") @JsonProperty("highlightRowOnLap") Boolean highlightRowOnLap,
      @BsonProperty("default") @JsonProperty("isDefault") Boolean isDefault,
      @BsonProperty("enabled") @JsonProperty("isEnabled") Boolean isEnabled,
      @BsonProperty("createdAt") @JsonProperty("createdAt") Long createdAt,
      @BsonProperty("updatedAt") @JsonProperty("updatedAt") Long updatedAt,
      @BsonProperty("entity_id") @JsonProperty("entity_id") String entityId,
      @BsonId @BsonProperty("_id") @JsonProperty("_id") ObjectId id) {
    super(id, entityId);
    this.name = name != null ? name : "Unnamed Screen";
    this.columns = columns;
    this.columnLayouts = columnLayouts;
    this.columnVisibility = columnVisibility;
    this.columnAnchors = columnAnchors;
    this.sortByStandings = sortByStandings != null ? sortByStandings : true;
    this.highlightRowOnLap = highlightRowOnLap != null ? highlightRowOnLap : true;
    this.isDefault = isDefault != null ? isDefault : false;
    this.isEnabled = isEnabled != null ? isEnabled : true;
    this.createdAt = createdAt != null ? createdAt : System.currentTimeMillis();
    this.updatedAt = updatedAt != null ? updatedAt : System.currentTimeMillis();
  }

  // Constructor for creating new screens
  public RaceScreen(String name, List<String> columns,
      Map<String, Map<String, String>> columnLayouts, Map<String, String> columnVisibility,
      Map<String, String> columnAnchors, boolean sortByStandings, boolean highlightRowOnLap,
      boolean isDefault, boolean isEnabled, String entityId, ObjectId id) {
    this(name, columns, columnLayouts, columnVisibility, columnAnchors,
        sortByStandings, highlightRowOnLap, isDefault, isEnabled,
        System.currentTimeMillis(), System.currentTimeMillis(), entityId, id);
  }

  // Default constructor for factory reset
  public RaceScreen(String name, String entityId, ObjectId id) {
    this(name,
        java.util.Arrays.asList("driver.nickname", "imageset_fuel-gauge-builtin", "lapCount", "lastLapTime", "gapLeader"),
        createDefaultColumnLayouts(),
        createDefaultColumnVisibility(),
        java.util.Collections.emptyMap(),
        true, true, true, true,
        System.currentTimeMillis(), System.currentTimeMillis(), entityId, id);
  }

  private static Map<String, Map<String, String>> createDefaultColumnLayouts() {
    Map<String, Map<String, String>> layouts = new java.util.HashMap<>();
    
    Map<String, String> nicknameLayout = new java.util.HashMap<>();
    nicknameLayout.put("CenterCenter", "driver.nickname");
    nicknameLayout.put("BottomRight", "participant.team.name");
    layouts.put("driver.nickname", nicknameLayout);
    
    Map<String, String> fuelLayout = new java.util.HashMap<>();
    fuelLayout.put("CenterCenter", "imageset_fuel-gauge-builtin");
    layouts.put("imageset_fuel-gauge-builtin", fuelLayout);
    
    Map<String, String> lapCountLayout = new java.util.HashMap<>();
    lapCountLayout.put("CenterCenter", "lapCount");
    layouts.put("lapCount", lapCountLayout);
    
    Map<String, String> lastLapLayout = new java.util.HashMap<>();
    lastLapLayout.put("CenterCenter", "lastLapTime");
    lastLapLayout.put("TopRight", "bestLapTime");
    lastLapLayout.put("BottomRight", "averageLapTime");
    layouts.put("lastLapTime", lastLapLayout);
    
    Map<String, String> gapLayout = new java.util.HashMap<>();
    gapLayout.put("CenterCenter", "gapLeader");
    gapLayout.put("BottomRight", "gapPosition");
    layouts.put("gapLeader", gapLayout);
    
    return layouts;
  }

  private static Map<String, String> createDefaultColumnVisibility() {
    Map<String, String> visibility = new java.util.HashMap<>();
    visibility.put("imageset_fuel-gauge-builtin", "FuelRaceOnly");
    return visibility;
  }

  public String getName() {
    return name;
  }

  public List<String> getColumns() {
    return columns;
  }

  public Map<String, Map<String, String>> getColumnLayouts() {
    return columnLayouts;
  }

  public Map<String, String> getColumnVisibility() {
    return columnVisibility;
  }

  public Map<String, String> getColumnAnchors() {
    return columnAnchors;
  }

  public boolean isSortByStandings() {
    return sortByStandings;
  }

  public boolean isHighlightRowOnLap() {
    return highlightRowOnLap;
  }

  @JsonProperty("isDefault")
  public boolean isDefault() {
    return isDefault;
  }

  @JsonProperty("isEnabled")
  public boolean isEnabled() {
    return isEnabled;
  }

  public long getCreatedAt() {
    return createdAt;
  }

  public long getUpdatedAt() {
    return updatedAt;
  }
}
