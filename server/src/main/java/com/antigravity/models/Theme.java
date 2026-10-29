package com.antigravity.models;

import com.antigravity.context.DatabaseContext;
import com.antigravity.proto.RaceFlag;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@JsonIgnoreProperties(ignoreUnknown = true)
public class Theme extends Model {

  public static final String DEFAULT_THEME_ID = "default_classic_rc_ai";
  public static final String PRACTICE_THEME_ID = "practice_theme_rc_ai";
  public static final String FUEL_THEME_ID = "default_fuel_theme_rc_ai";
  public static final String DRIVER_STATION_THEME_ID = "driver_station_theme_rc_ai";

  public static final String DEFAULT_THEME_NAME = "RaceCoordinator AI";
  public static final String PRACTICE_THEME_NAME = "RaceCoordinator AI (Practice)";
  public static final String FUEL_THEME_NAME = "RaceCoordinator AI (Fuel)";
  public static final String DRIVER_STATION_THEME_NAME = "RaceCoordinator AI (Driver Station)";

  // TODO(aufderheide): Remove the legacy name checks after a few versions.
  public static boolean isLegacyDefaultName(String name) {
    if (name == null || name.trim().isEmpty()) {
      return true;
    }
    String n = name.trim().toLowerCase();
    return "default".equals(n)
        || "classic".equals(n)
        || "classic theme".equals(n)
        || "default theme".equals(n)
        || "racecoordinator ai".equals(n)
        || "racecoordinator ai (default)".equals(n);
  }

  // TODO(aufderheide): Remove the legacy name checks after a few versions.
  public static boolean isLegacyPracticeName(String name) {
    if (name == null || name.trim().isEmpty()) {
      return true;
    }
    String n = name.trim().toLowerCase();
    return "practice".equals(n) || "practice theme".equals(n);
  }

  // TODO(aufderheide): Remove the legacy name checks after a few versions.
  public static boolean isLegacyFuelName(String name) {
    if (name == null || name.trim().isEmpty()) {
      return true;
    }
    String n = name.trim().toLowerCase();
    return "fuel".equals(n) || "fuel theme".equals(n);
  }

  public static boolean isLegacyDriverStationName(String name) {
    if (name == null || name.trim().isEmpty()) {
      return true;
    }
    String n = name.trim().toLowerCase();
    return "driver station".equals(n)
        || "driver station theme".equals(n)
        || "racecoordinator ai (driver station)".equals(n);
  }

  private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

  private final String name;
  private final boolean isDefault;
  private final Map<String, String> slots;
  private final Map<String, AudioConfig> audioSlots;
  private final Map<String, AudioConfig> driverAudioOverrides;
  private final String uiId;
  private final String driverStationThemeId;
  private final String driverViewThemeId;
  private final Map<String, RaceFlag> resolvedFlagCache = new ConcurrentHashMap<>();

  @JsonCreator
  public Theme(
      @JsonProperty("name") String name,
      @JsonProperty("is_default") boolean isDefault,
      @JsonProperty("slots") Map<String, String> slots,
      @JsonProperty("audio_slots") Map<String, AudioConfig> audioSlots,
      @JsonProperty("driver_audio_overrides") @JsonAlias({"driverAudioOverrides"})
          Map<String, AudioConfig> driverAudioOverrides,
      @JsonProperty("uiId") @JsonAlias({"ui_id", "ui_layout_id", "custom_ui_id"}) String uiId,
      @JsonProperty("driver_station_theme_id") @JsonAlias({"driverStationThemeId"})
          String driverStationThemeId,
      @JsonProperty("driver_view_theme_id") @JsonAlias({"driverViewThemeId"})
          String driverViewThemeId,
      @JsonProperty("entity_id") String entityId,
      @JsonProperty("_id") String id) {
    super(id, entityId);
    this.name = name;
    this.isDefault = isDefault;
    this.slots = slots != null ? slots : new HashMap<>();
    this.audioSlots = audioSlots != null ? audioSlots : new HashMap<>();
    this.driverAudioOverrides =
        driverAudioOverrides != null ? new HashMap<>(driverAudioOverrides) : new HashMap<>();
    this.uiId = uiId;
    this.driverStationThemeId =
        (driverStationThemeId != null && !driverStationThemeId.trim().isEmpty())
            ? driverStationThemeId
            : DRIVER_STATION_THEME_ID;
    this.driverViewThemeId =
        (driverViewThemeId != null && !driverViewThemeId.trim().isEmpty())
            ? driverViewThemeId
            : DRIVER_STATION_THEME_ID;
  }

  public Theme(
      String name,
      boolean isDefault,
      Map<String, String> slots,
      Map<String, AudioConfig> audioSlots,
      String uiId,
      String driverStationThemeId,
      String driverViewThemeId,
      String entityId,
      String id) {
    this(
        name,
        isDefault,
        slots,
        audioSlots,
        new HashMap<>(),
        uiId,
        driverStationThemeId,
        driverViewThemeId,
        entityId,
        id);
  }

  public Theme(
      String name,
      boolean isDefault,
      Map<String, String> slots,
      Map<String, AudioConfig> audioSlots,
      String uiId,
      String entityId,
      String id) {
    this(
        name,
        isDefault,
        slots,
        audioSlots,
        uiId,
        DRIVER_STATION_THEME_ID,
        DRIVER_STATION_THEME_ID,
        entityId,
        id);
  }

  public Theme(
      String name,
      boolean isDefault,
      Map<String, String> slots,
      Map<String, AudioConfig> audioSlots,
      String entityId,
      String id) {
    this(
        name,
        isDefault,
        slots,
        audioSlots,
        null,
        DRIVER_STATION_THEME_ID,
        DRIVER_STATION_THEME_ID,
        entityId,
        id);
  }

  public String getName() {
    return name;
  }

  @JsonProperty("is_default")
  public boolean isDefault() {
    return isDefault;
  }

  public Map<String, String> getSlots() {
    return slots;
  }

  @JsonProperty("audio_slots")
  public Map<String, AudioConfig> getAudioSlots() {
    return audioSlots;
  }

  @JsonProperty("uiId")
  @JsonAlias({"ui_id", "ui_layout_id", "custom_ui_id"})
  public String getUiId() {
    return uiId;
  }

  @JsonProperty("driver_station_theme_id")
  public String getDriverStationThemeId() {
    return driverStationThemeId;
  }

  @JsonProperty("driver_view_theme_id")
  public String getDriverViewThemeId() {
    return driverViewThemeId;
  }

  @JsonProperty("driver_audio_overrides")
  public Map<String, AudioConfig> getDriverAudioOverrides() {
    return driverAudioOverrides;
  }

  public static class Builder {
    private String id;
    private String entityId;
    private String name;
    private boolean isDefault;
    private Map<String, String> slots = new HashMap<>();
    private Map<String, AudioConfig> audioSlots = new HashMap<>();
    private Map<String, AudioConfig> driverAudioOverrides = new HashMap<>();
    private String uiId;
    private String driverStationThemeId = DRIVER_STATION_THEME_ID;
    private String driverViewThemeId = DRIVER_STATION_THEME_ID;

    public static Builder from(Theme other) {
      Builder b = new Builder();
      if (other != null) {
        b.id = other.getId();
        b.entityId = other.getEntityId();
        b.name = other.getName();
        b.isDefault = other.isDefault();
        b.slots = other.getSlots() != null ? new HashMap<>(other.getSlots()) : new HashMap<>();
        b.audioSlots =
            other.getAudioSlots() != null ? new HashMap<>(other.getAudioSlots()) : new HashMap<>();
        b.driverAudioOverrides =
            other.getDriverAudioOverrides() != null
                ? new HashMap<>(other.getDriverAudioOverrides())
                : new HashMap<>();
        b.uiId = other.getUiId();
        b.driverStationThemeId = other.getDriverStationThemeId();
        b.driverViewThemeId = other.getDriverViewThemeId();
      }
      return b;
    }

    public Builder withId(String id) {
      this.id = id;
      return this;
    }

    public Builder withEntityId(String entityId) {
      this.entityId = entityId;
      return this;
    }

    public Builder withName(String name) {
      this.name = name;
      return this;
    }

    public Builder withDefault(boolean isDefault) {
      this.isDefault = isDefault;
      return this;
    }

    public Builder withSlots(Map<String, String> slots) {
      this.slots = slots;
      return this;
    }

    public Builder withAudioSlots(Map<String, AudioConfig> audioSlots) {
      this.audioSlots = audioSlots;
      return this;
    }

    public Builder withDriverAudioOverrides(Map<String, AudioConfig> driverAudioOverrides) {
      this.driverAudioOverrides = driverAudioOverrides;
      return this;
    }

    public Builder withUiId(String uiId) {
      this.uiId = uiId;
      return this;
    }

    public Builder withDriverStationThemeId(String driverStationThemeId) {
      this.driverStationThemeId = driverStationThemeId;
      return this;
    }

    public Builder withDriverViewThemeId(String driverViewThemeId) {
      this.driverViewThemeId = driverViewThemeId;
      return this;
    }

    public Theme build() {
      return new Theme(
          name,
          isDefault,
          slots,
          audioSlots,
          driverAudioOverrides,
          uiId,
          driverStationThemeId,
          driverViewThemeId,
          entityId,
          id);
    }
  }

  public RaceFlag resolveFlag(String slotKey, RaceFlag fallback) {
    return resolveFlag(slotKey, fallback, null);
  }

  public RaceFlag resolveFlag(String slotKey, RaceFlag fallback, DatabaseContext dbCtx) {
    if (slots == null || slotKey == null) {
      return fallback;
    }
    RaceFlag slotFlag = resolvedFlagCache.get(slotKey);
    if (slotFlag != null) {
      return slotFlag;
    }
    String cacheKey = slotKey + ":" + (fallback != null ? fallback.name() : "NONE");
    RaceFlag cached = resolvedFlagCache.get(cacheKey);
    if (cached != null) {
      return cached;
    }

    RaceFlag resolved = findSlotFlag(slotKey, dbCtx);
    if (resolved != null) {
      resolvedFlagCache.put(slotKey, resolved);
      resolvedFlagCache.put(cacheKey, resolved);
      return resolved;
    }

    resolvedFlagCache.put(cacheKey, fallback);
    return fallback;
  }

  public void prewarmFlagCache(DatabaseContext dbCtx) {
    if (slots == null || slots.isEmpty()) {
      return;
    }
    resolveFlag("flag.warmup", RaceFlag.GREEN_YELLOW, dbCtx);
    resolveFlag("flag.not_started", RaceFlag.RED, dbCtx);
    resolveFlag("flag.starting", RaceFlag.RED, dbCtx);
    resolveFlag("flag.restarting", RaceFlag.YELLOW, dbCtx);
    resolveFlag("flag.racing", RaceFlag.GREEN, dbCtx);
    resolveFlag("flag.heat_paused", RaceFlag.YELLOW, dbCtx);
    resolveFlag("flag.heat_finishing", RaceFlag.CHECKERED, dbCtx);
    resolveFlag("flag.heat_over", RaceFlag.RED, dbCtx);
    resolveFlag("flag.driver_finished", RaceFlag.RED, dbCtx);
    resolveFlag("flag.one_lap_to_go", RaceFlag.WHITE, dbCtx);
    resolveFlag("flag.race_over", RaceFlag.CHECKERED, dbCtx);
    resolveFlag("flag.penalty", RaceFlag.BLACK, dbCtx);
  }

  private RaceFlag findSlotFlag(String slotKey, DatabaseContext dbCtx) {
    String assetId = slots.get(slotKey);
    if (assetId == null || assetId.isEmpty()) {
      return null;
    }
    RaceFlag matched = matchFlagString(assetId);
    if (matched != null) {
      return isFlagCollision(slotKey, matched) ? null : matched;
    }
    if (dbCtx != null) {
      RaceFlag fromDb = lookupFlagFromDatabase(dbCtx, assetId);
      if (fromDb != null) {
        return isFlagCollision(slotKey, fromDb) ? null : fromDb;
      }
    }
    return null;
  }

  private boolean isFlagCollision(String slotKey, RaceFlag flag) {
    if ("flag.driver_finished".equals(slotKey) && flag == RaceFlag.BLACK) {
      return true;
    }
    if ("flag.heat_finishing".equals(slotKey) && flag == RaceFlag.GREEN_YELLOW) {
      return true;
    }
    return false;
  }

  private RaceFlag lookupFlagFromDatabase(DatabaseContext dbCtx, String assetId) {
    try {
      dbCtx.ensureTable("assets");
      String sql = "SELECT json_data FROM assets WHERE entity_id = ?";
      try (PreparedStatement pstmt = dbCtx.getConnection().prepareStatement(sql)) {
        pstmt.setString(1, assetId);
        try (ResultSet rs = pstmt.executeQuery()) {
          if (rs.next()) {
            String json = rs.getString("json_data");
            if (json != null && !json.trim().isEmpty()) {
              JsonNode node = OBJECT_MAPPER.readTree(json);
              if (node.has("name")) {
                RaceFlag fromName = matchFlagString(node.get("name").asText());
                if (fromName != null) {
                  return fromName;
                }
              }
              if (node.has("url")) {
                RaceFlag fromUrl = matchFlagString(node.get("url").asText());
                if (fromUrl != null) {
                  return fromUrl;
                }
              }
            }
          }
        }
      }
    } catch (Exception e) {
      // Gracefully continue to fallback
    }
    return null;
  }

  private static RaceFlag matchFlagString(String str) {
    if (str == null) {
      return null;
    }
    String lower = str.toLowerCase();
    if (lower.contains("green_yellow")
        || lower.contains("yellowgreen")
        || lower.contains("yellow_green")
        || lower.contains("greenyellow")) {
      return RaceFlag.GREEN_YELLOW;
    }
    if (lower.contains("checkered") || lower.contains("checker")) {
      return RaceFlag.CHECKERED;
    }
    if (lower.contains("green")) {
      return RaceFlag.GREEN;
    }
    if (lower.contains("red")) {
      return RaceFlag.RED;
    }
    if (lower.contains("yellow")) {
      return RaceFlag.YELLOW;
    }
    if (lower.contains("white")) {
      return RaceFlag.WHITE;
    }
    if (lower.contains("black")) {
      return RaceFlag.BLACK;
    }
    return null;
  }
}
