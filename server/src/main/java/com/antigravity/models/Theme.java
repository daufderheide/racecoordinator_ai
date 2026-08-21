package com.antigravity.models;

import com.antigravity.context.DatabaseContext;
import com.antigravity.proto.RaceFlag;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.HashMap;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public class Theme extends Model {

  public static final String DEFAULT_THEME_ID = "default_classic_rc_ai";
  private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

  private final String name;
  private final boolean isDefault;
  private final Map<String, String> slots;
  private final Map<String, AudioConfig> audioSlots;

  @JsonCreator
  public Theme(
      @JsonProperty("name") String name,
      @JsonProperty("is_default") boolean isDefault,
      @JsonProperty("slots") Map<String, String> slots,
      @JsonProperty("audio_slots") Map<String, AudioConfig> audioSlots,
      @JsonProperty("entity_id") String entityId,
      @JsonProperty("_id") String id) {
    super(id, entityId);
    this.name = name;
    this.isDefault = isDefault;
    this.slots = slots != null ? slots : new HashMap<>();
    this.audioSlots = audioSlots != null ? audioSlots : new HashMap<>();
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

  public RaceFlag resolveFlag(String slotKey, RaceFlag fallback) {
    return resolveFlag(slotKey, fallback, null);
  }

  public RaceFlag resolveFlag(String slotKey, RaceFlag fallback, DatabaseContext dbCtx) {
    if (slots == null || slotKey == null) {
      return fallback;
    }
    String assetId = slots.get(slotKey);
    if (assetId == null || assetId.isEmpty()) {
      return fallback;
    }
    RaceFlag matched = matchFlagString(assetId);
    if (matched != null) {
      return matched;
    }
    if (dbCtx != null) {
      RaceFlag fromDb = lookupFlagFromDatabase(dbCtx, assetId);
      if (fromDb != null) {
        return fromDb;
      }
    }
    return fallback;
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
