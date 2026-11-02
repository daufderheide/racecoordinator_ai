package com.antigravity.models;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

@JsonIgnoreProperties(ignoreUnknown = true)
public class CustomUI extends Model {

  public static final String DEFAULT_UI_ID = "default_ui_layout_rc_ai";
  public static final String PRACTICE_UI_ID = "practice_ui_layout_rc_ai";
  public static final String FUEL_UI_ID = "default_fuel_ui_layout_rc_ai";
  public static final String DRIVER_STATION_UI_ID = "driver_station_ui_layout_rc_ai";

  public static final String DEFAULT_UI_NAME = "RC AI";
  public static final String PRACTICE_UI_NAME = "RC AI (Practice)";
  public static final String FUEL_UI_NAME = "RC AI (Fuel)";
  public static final String DRIVER_STATION_UI_NAME = "RC AI (Driver Station)";

  public static boolean isLegacyDefaultName(String name) {
    if (name == null || name.trim().isEmpty()) {
      return true;
    }
    String n = name.trim().toLowerCase();
    return "default".equals(n)
        || "default ui".equals(n)
        || "default ui layout".equals(n)
        || "raceday ui layout".equals(n)
        || "racecoordinator ai".equals(n)
        || "racecoordinator ai (default)".equals(n)
        || "rc ai".equals(n)
        || "rc ai (default)".equals(n);
  }

  public static boolean isLegacyPracticeName(String name) {
    if (name == null || name.trim().isEmpty()) {
      return true;
    }
    String n = name.trim().toLowerCase();
    return "practice".equals(n)
        || "practice ui".equals(n)
        || "practice ui layout".equals(n)
        || "default practice ui layout".equals(n)
        || "racecoordinator ai (practice)".equals(n)
        || "rc ai (practice)".equals(n);
  }

  public static boolean isLegacyFuelName(String name) {
    if (name == null || name.trim().isEmpty()) {
      return true;
    }
    String n = name.trim().toLowerCase();
    return "fuel".equals(n)
        || "fuel ui".equals(n)
        || "fuel ui layout".equals(n)
        || "default fuel ui layout".equals(n)
        || "racecoordinator ai (fuel)".equals(n)
        || "rc ai (fuel)".equals(n);
  }

  public static boolean isLegacyDriverStationName(String name) {
    if (name == null || name.trim().isEmpty()) {
      return true;
    }
    String n = name.trim().toLowerCase();
    return "driver station".equals(n)
        || "driver station ui".equals(n)
        || "driver station layout".equals(n)
        || "driver station ui layout".equals(n)
        || "default driver station ui layout".equals(n)
        || "racecoordinator ai (driver station)".equals(n)
        || "rc ai (driver station)".equals(n);
  }

  public static final String PRE_MIGRATION_BACKUP_SUFFIX = " (Pre-Migration Backup)";

  public static boolean hasLaneView(String layoutJson) {
    if (layoutJson == null || layoutJson.isEmpty()) {
      return false;
    }
    if (layoutJson.contains("\"preserveLegacyHeatView\":true")
        || layoutJson.contains("\"preserveLegacyHeatView\": true")) {
      return false;
    }
    return layoutJson.contains("\"widgetType\":\"lane-view\"")
        || layoutJson.contains("\"widgetType\": \"lane-view\"");
  }

  private final String name;
  private final boolean isDefault;
  private final String layoutJson;
  private final String columnsJson;
  private final String columnLayoutsJson;
  private final String columnVisibilityJson;
  private final String columnWidthsJson;
  private final String columnAnchorsJson;

  @JsonCreator
  public CustomUI(
      @JsonProperty("name") String name,
      @JsonProperty("is_default") boolean isDefault,
      @JsonProperty("layoutJson") String layoutJson,
      @JsonProperty("columnsJson") String columnsJson,
      @JsonProperty("columnLayoutsJson") String columnLayoutsJson,
      @JsonProperty("columnVisibilityJson") String columnVisibilityJson,
      @JsonProperty("columnWidthsJson") String columnWidthsJson,
      @JsonProperty("columnAnchorsJson") String columnAnchorsJson,
      @JsonProperty("entity_id") String entityId,
      @JsonProperty("_id") String id) {
    super(id, entityId);
    this.name = name;
    this.isDefault = isDefault;
    this.layoutJson = layoutJson;
    this.columnsJson = columnsJson;
    this.columnLayoutsJson = columnLayoutsJson;
    this.columnVisibilityJson = columnVisibilityJson;
    this.columnWidthsJson = columnWidthsJson;
    this.columnAnchorsJson = columnAnchorsJson;
  }

  @JsonProperty("name")
  public String getName() {
    return name;
  }

  @JsonProperty("is_default")
  public boolean isDefault() {
    return isDefault;
  }

  @JsonProperty("layoutJson")
  public String getLayoutJson() {
    return layoutJson;
  }

  @JsonProperty("columnsJson")
  public String getColumnsJson() {
    return columnsJson;
  }

  @JsonProperty("columnLayoutsJson")
  public String getColumnLayoutsJson() {
    return columnLayoutsJson;
  }

  @JsonProperty("columnVisibilityJson")
  public String getColumnVisibilityJson() {
    return columnVisibilityJson;
  }

  @JsonProperty("columnWidthsJson")
  public String getColumnWidthsJson() {
    return columnWidthsJson;
  }

  @JsonProperty("columnAnchorsJson")
  public String getColumnAnchorsJson() {
    return columnAnchorsJson;
  }

  public static String loadResourceLayout(String resourcePath) {
    try (InputStream is = CustomUI.class.getResourceAsStream(resourcePath)) {
      if (is != null) {
        java.io.ByteArrayOutputStream buffer = new java.io.ByteArrayOutputStream();
        int nRead;
        byte[] data = new byte[8192];
        while ((nRead = is.read(data, 0, data.length)) != -1) {
          buffer.write(data, 0, nRead);
        }
        buffer.flush();
        return new String(buffer.toByteArray(), StandardCharsets.UTF_8);
      }
    } catch (Exception e) {
      // ignore
    }
    return "{\"widgets\":[],\"baseWidth\":1920,\"baseHeight\":1080,\"aspectRatio\":\"16:9\",\"scaleMode\":\"stretch\"}";
  }

  public static CustomUI createDefault() {
    String layoutJson = loadResourceLayout("/defaults/default_ui_layout.json");
    String columnsJson =
        "[\"driver.nickname\",\"lapCount\",\"lastLapTime\",\"averageLapTime\",\"gap\","
            + "\"ghostPacingLeaderAvg\"]";
    String columnLayoutsJson =
        "{\"laneNumber\":{\"center-center\":\"laneNumber\"},\"driver.nickname\":{"
            + "\"center-center\":\"driver.nickname\",\"bottom-right\":\"participant.team.name\","
            + "\"bottom-left\":\"driverViewQrCode\"},\"imageset_fuel-gauge-builtin\":{"
            + "\"center-center\":\"imageset_fuel-gauge-builtin\"},\"lapCount\":{"
            + "\"center-center\":\"lapCount\",\"bottom-left\":\"flag\"},\"lastLapTime\":{"
            + "\"center-center\":\"lastLapTime\",\"bottom-right\":\"bestLapTime\"},"
            + "\"gap\":{\"center-center\":\"gap\",\"bottom-right\":\"gapPosition\"}}";
    String columnVisibilityJson = "{\"imageset_fuel-gauge-builtin\":\"FuelRaceOnly\"}";
    String columnWidthsJson = "{\"ghostPacingLeaderAvg\":200,\"averageLapTime\":310}";
    return new CustomUI(
        DEFAULT_UI_NAME,
        true,
        layoutJson,
        columnsJson,
        columnLayoutsJson,
        columnVisibilityJson,
        columnWidthsJson,
        "{}",
        DEFAULT_UI_ID,
        null);
  }

  public static CustomUI createPractice() {
    String layoutJson = loadResourceLayout("/defaults/practice_ui_layout.json");
    String columnsJson =
        "[\"laneNumber\",\"lastLapTime\",\"bestLapTime\",\"lastLaps\",\"lapCount\"]";
    String columnLayoutsJson =
        "{\"laneNumber\":{\"center-center\":\"laneNumber\"},\"driver.nickname\":{\"center-center\":\"driver.nickname\"},\"lastLapTime\":{\"center-center\":\"lastLapTime\"},\"lastLaps\":{\"center-center\":\"lastLaps\"},\"bestLapTime\":{\"center-center\":\"bestLapTime\"},\"lapCount\":{\"center-center\":\"lapCount\"}}";
    String columnVisibilityJson =
        "{\"imageset_fuel-gauge-builtin\":\"FuelRaceOnly\",\"laneNumber\":\"Always\",\"lastLaps\":\"Always\"}";
    return new CustomUI(
        PRACTICE_UI_NAME,
        true,
        layoutJson,
        columnsJson,
        columnLayoutsJson,
        columnVisibilityJson,
        "{}",
        "{}",
        PRACTICE_UI_ID,
        null);
  }

  public static CustomUI createFuel() {
    String layoutJson = loadResourceLayout("/defaults/fuel_ui_layout.json");
    String columnsJson =
        "[\"driver.nickname\",\"imageset_fuel-gauge-builtin\",\"lapCount\",\"lastLapTime\","
            + "\"gap\"]";
    String columnLayoutsJson =
        "{\"laneNumber\":{\"center-center\":\"laneNumber\"},\"driver.nickname\":{"
            + "\"center-center\":\"driver.nickname\",\"bottom-right\":\"participant.team.name\","
            + "\"bottom-left\":\"driverViewQrCode\"},\"imageset_fuel-gauge-builtin\":{"
            + "\"center-center\":\"imageset_fuel-gauge-builtin\"},\"lapCount\":{"
            + "\"center-center\":\"lapCount\",\"bottom-left\":\"flag\"},\"lastLapTime\":{"
            + "\"center-center\":\"lastLapTime\",\"top-right\":\"bestLapTime\","
            + "\"bottom-right\":\"averageLapTime\"},\"gap\":{\"center-center\":\"gap\","
            + "\"bottom-right\":\"gapPosition\"}}";
    String columnVisibilityJson = "{\"imageset_fuel-gauge-builtin\":\"FuelRaceOnly\"}";
    String columnWidthsJson =
        "{\"lapCount\":210,\"imageset_fuel-gauge-builtin\":210,\"lastLapTime\":310,"
            + "\"gap\":310}";
    return new CustomUI(
        FUEL_UI_NAME,
        true,
        layoutJson,
        columnsJson,
        columnLayoutsJson,
        columnVisibilityJson,
        columnWidthsJson,
        "{}",
        FUEL_UI_ID,
        null);
  }

  public static CustomUI createDriverStation() {
    String layoutJson =
        "{\"widgets\":["
            + "{\"id\":\"widget-ds-progress\",\"widgetType\":\"progress-gauge\",\"scaleMode\":\"auto\",\"x\":20,\"y\":20,\"width\":80,\"height\":1880,\"zIndex\":100,\"customSettings\":{\"gaugeType\":\"heat-progress\",\"gaugeStyle\":\"thermometer\",\"orientation\":\"vertical\",\"bindingMode\":\"hostLane\",\"borderColor\":\"#ffffff\",\"textColor\":\"#ffffff\",\"fillColor\":\"#d3d3d3\",\"timeDisplayFormat\":\"dynamic\",\"timeSubsecondMode\":\"threshold\",\"timeSubsecondThreshold\":10,\"timeSubsecondDecimals\":2,\"lapDecimalPlaces\":0,\"highlightRowOnLap\":true,\"highlightLapStyle\":\"full-glow\"}},"
            + "{\"id\":\"widget-ds-nickname\",\"widgetType\":\"lane-column\",\"scaleMode\":\"auto\",\"x\":120,\"y\":20,\"width\":640,\"height\":290,\"zIndex\":100,\"customSettings\":{\"columnKey\":\"driver.nickname\",\"bindingMode\":\"hostLane\",\"showHeader\":true,\"showBorder\":true,\"borderWidth\":2,\"borderRadius\":10,\"borderColor\":\"rgba(0,0,0,0.1)\",\"backgroundColor\":\"rgba(255,255,255,0.1)\",\"useLaneColors\":true,\"highlightRowOnLap\":true,\"highlightLapStyle\":\"full-glow\"}},"
            + "{\"id\":\"widget-ds-lane-number\",\"widgetType\":\"lane-column\",\"scaleMode\":\"auto\",\"x\":780,\"y\":20,\"width\":180,\"height\":290,\"zIndex\":100,\"customSettings\":{\"columnKey\":\"laneNumber\",\"bindingMode\":\"hostLane\",\"showHeader\":true,\"showBorder\":true,\"borderWidth\":2,\"borderRadius\":10,\"borderColor\":\"rgba(0,0,0,0.1)\",\"backgroundColor\":\"rgba(255,255,255,0.1)\",\"useLaneColors\":true,\"highlightRowOnLap\":true,\"highlightLapStyle\":\"full-glow\"}},"
            + "{\"id\":\"widget-ds-rank-heat\",\"widgetType\":\"lane-column\",\"scaleMode\":\"auto\",\"x\":120,\"y\":330,\"width\":410,\"height\":290,\"zIndex\":100,\"customSettings\":{\"columnKey\":\"rankHeat\",\"bindingMode\":\"hostLane\",\"showHeader\":true,\"showBorder\":true,\"borderWidth\":2,\"borderRadius\":10,\"borderColor\":\"rgba(0,0,0,0.1)\",\"backgroundColor\":\"rgba(255,255,255,0.1)\",\"useLaneColors\":true,\"highlightRowOnLap\":true,\"highlightLapStyle\":\"full-glow\"}},"
            + "{\"id\":\"widget-ds-rank-overall\",\"widgetType\":\"lane-column\",\"scaleMode\":\"auto\",\"x\":550,\"y\":330,\"width\":410,\"height\":290,\"zIndex\":100,\"customSettings\":{\"columnKey\":\"rankOverall\",\"bindingMode\":\"hostLane\",\"showHeader\":true,\"showBorder\":true,\"borderWidth\":2,\"borderRadius\":10,\"borderColor\":\"rgba(0,0,0,0.1)\",\"backgroundColor\":\"rgba(255,255,255,0.1)\",\"useLaneColors\":true,\"highlightRowOnLap\":true,\"highlightLapStyle\":\"full-glow\"}},"
            + "{\"id\":\"widget-ds-lap-count\",\"widgetType\":\"lane-column\",\"scaleMode\":\"auto\",\"x\":120,\"y\":640,\"width\":410,\"height\":290,\"zIndex\":100,\"customSettings\":{\"columnKey\":\"lapCount\",\"bindingMode\":\"hostLane\",\"showHeader\":true,\"showBorder\":true,\"borderWidth\":2,\"borderRadius\":10,\"borderColor\":\"rgba(0,0,0,0.1)\",\"backgroundColor\":\"rgba(255,255,255,0.1)\",\"useLaneColors\":true,\"lapDecimalPlaces\":0,\"decimalPlaces\":0,\"highlightRowOnLap\":true,\"highlightLapStyle\":\"full-glow\"}},"
            + "{\"id\":\"widget-ds-last-lap-time\",\"widgetType\":\"lane-column\",\"scaleMode\":\"auto\",\"x\":550,\"y\":640,\"width\":410,\"height\":290,\"zIndex\":100,\"customSettings\":{\"columnKey\":\"lastLapTime\",\"bindingMode\":\"hostLane\",\"showHeader\":true,\"showBorder\":true,\"borderWidth\":2,\"borderRadius\":10,\"borderColor\":\"rgba(0,0,0,0.1)\",\"backgroundColor\":\"rgba(255,255,255,0.1)\",\"useLaneColors\":true,\"highlightRowOnLap\":true,\"highlightLapStyle\":\"full-glow\"}},"
            + "{\"id\":\"widget-ds-gap-leader\",\"widgetType\":\"lane-column\",\"scaleMode\":\"auto\",\"x\":120,\"y\":950,\"width\":840,\"height\":290,\"zIndex\":100,\"customSettings\":{\"columnKey\":\"gapLeader\",\"customLabel\":\"GAP LEADER\",\"bindingMode\":\"hostLane\",\"showHeader\":true,\"showBorder\":true,\"borderWidth\":2,\"borderRadius\":10,\"borderColor\":\"rgba(0,0,0,0.1)\",\"backgroundColor\":\"rgba(255,255,255,0.1)\",\"useLaneColors\":true,\"highlightRowOnLap\":true,\"highlightLapStyle\":\"full-glow\"}},"
            + "{\"id\":\"widget-ds-best-lap-time\",\"widgetType\":\"lane-column\",\"scaleMode\":\"auto\",\"x\":120,\"y\":1260,\"width\":840,\"height\":290,\"zIndex\":100,\"customSettings\":{\"columnKey\":\"bestLapTime\",\"bindingMode\":\"hostLane\",\"showHeader\":true,\"showBorder\":true,\"borderWidth\":2,\"borderRadius\":10,\"borderColor\":\"rgba(0,0,0,0.1)\",\"backgroundColor\":\"rgba(255,255,255,0.1)\",\"useLaneColors\":true,\"highlightRowOnLap\":true,\"highlightLapStyle\":\"full-glow\"}},"
            + "{\"id\":\"widget-ds-flag\",\"widgetType\":\"flag\",\"scaleMode\":\"auto\",\"x\":120,\"y\":1570,\"width\":840,\"height\":330,\"zIndex\":100,\"customSettings\":{\"displayMode\":\"color-bar\",\"highlightRowOnLap\":true,\"highlightLapStyle\":\"full-glow\"}},"
            + "{\"id\":\"widget-ds-fuel\",\"widgetType\":\"progress-gauge\",\"scaleMode\":\"auto\",\"x\":980,\"y\":20,\"width\":80,\"height\":1880,\"zIndex\":100,\"customSettings\":{\"gaugeType\":\"fuel\",\"gaugeStyle\":\"thermometer\",\"orientation\":\"vertical\",\"bindingMode\":\"hostLane\",\"borderColor\":\"#ffffff\",\"textColor\":\"#ffffff\",\"fillColor\":\"#d3d3d3\",\"highlightRowOnLap\":true,\"highlightLapStyle\":\"full-glow\"}}"
            + "],\"baseWidth\":1080,\"baseHeight\":1920,\"aspectRatio\":\"9:16\",\"scaleMode\":\"stretch\"}";
    return new CustomUI(
        DRIVER_STATION_UI_NAME,
        true,
        layoutJson,
        "[]",
        "{}",
        "{}",
        "{}",
        "{}",
        DRIVER_STATION_UI_ID,
        null);
  }

  public CustomUI withLayoutJson(String newLayoutJson) {
    return new CustomUI(
        this.name,
        this.isDefault,
        newLayoutJson,
        this.columnsJson,
        this.columnLayoutsJson,
        this.columnVisibilityJson,
        this.columnWidthsJson,
        this.columnAnchorsJson,
        this.getEntityId(),
        this.getId());
  }

  public static String ensureAspectRatioAndDimensions(String layoutJson) {
    if (layoutJson == null || layoutJson.trim().isEmpty()) {
      return layoutJson;
    }
    try {
      com.fasterxml.jackson.databind.ObjectMapper mapper =
          new com.fasterxml.jackson.databind.ObjectMapper();
      com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(layoutJson);
      if (!root.isObject()) {
        return layoutJson;
      }
      com.fasterxml.jackson.databind.node.ObjectNode rootObj =
          (com.fasterxml.jackson.databind.node.ObjectNode) root;
      boolean modified = false;

      if (!rootObj.has("aspectRatio")
          || rootObj.get("aspectRatio").isNull()
          || "current".equalsIgnoreCase(rootObj.get("aspectRatio").asText())) {
        rootObj.put("aspectRatio", "16:9");
        modified = true;
      }

      int baseWidth = rootObj.has("baseWidth") ? rootObj.get("baseWidth").asInt(0) : 0;
      int baseHeight = rootObj.has("baseHeight") ? rootObj.get("baseHeight").asInt(0) : 0;

      if (baseWidth == 1728 && (baseHeight == 899 || baseHeight == 906)) {
        scaleLayoutWidgets(rootObj, 1920.0 / baseWidth, 1080.0 / baseHeight);
        rootObj.put("baseWidth", 1920);
        rootObj.put("baseHeight", 1080);
        rootObj.put("aspectRatio", "16:9");
        rootObj.put("scaleMode", "stretch");
        modified = true;
      } else {
        if (baseWidth <= 0) {
          rootObj.put("baseWidth", 1920);
          modified = true;
        }
        if (baseHeight <= 0) {
          rootObj.put("baseHeight", 1080);
          modified = true;
        }
      }

      if (!rootObj.has("scaleMode") || rootObj.get("scaleMode").asText().isEmpty()) {
        rootObj.put("scaleMode", "stretch");
        modified = true;
      }

      return modified ? mapper.writeValueAsString(rootObj) : layoutJson;
    } catch (Exception e) {
      // Return original on error
    }
    return layoutJson;
  }

  private static void scaleLayoutWidgets(
      com.fasterxml.jackson.databind.node.ObjectNode rootObj, double scaleX, double scaleY) {
    if (rootObj.has("widgets") && rootObj.get("widgets").isArray()) {
      com.fasterxml.jackson.databind.node.ArrayNode widgets =
          (com.fasterxml.jackson.databind.node.ArrayNode) rootObj.get("widgets");
      for (com.fasterxml.jackson.databind.JsonNode w : widgets) {
        if (w.isObject()) {
          com.fasterxml.jackson.databind.node.ObjectNode wo =
              (com.fasterxml.jackson.databind.node.ObjectNode) w;
          if (wo.has("x")) {
            wo.put("x", (int) Math.round(wo.get("x").asDouble() * scaleX));
          }
          if (wo.has("y")) {
            wo.put("y", (int) Math.round(wo.get("y").asDouble() * scaleY));
          }
          if (wo.has("width")) {
            wo.put("width", (int) Math.round(wo.get("width").asDouble() * scaleX));
          }
          if (wo.has("height")) {
            wo.put("height", (int) Math.round(wo.get("height").asDouble() * scaleY));
          }
        }
      }
    }
  }

  public static String ensureCountdownWidget(String layoutJson) {
    if (layoutJson == null || layoutJson.trim().isEmpty()) {
      return layoutJson;
    }
    try {
      com.fasterxml.jackson.databind.ObjectMapper mapper =
          new com.fasterxml.jackson.databind.ObjectMapper();
      com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(layoutJson);
      if (!root.isObject()) {
        return layoutJson;
      }
      com.fasterxml.jackson.databind.node.ObjectNode rootObj =
          (com.fasterxml.jackson.databind.node.ObjectNode) root;
      com.fasterxml.jackson.databind.JsonNode widgetsNode = rootObj.get("widgets");
      if (widgetsNode != null && widgetsNode.isArray()) {
        com.fasterxml.jackson.databind.node.ArrayNode widgetsArray =
            (com.fasterxml.jackson.databind.node.ArrayNode) widgetsNode;
        for (com.fasterxml.jackson.databind.JsonNode widgetNode : widgetsArray) {
          if (widgetNode.has("widgetType")
              && "countdown".equals(widgetNode.get("widgetType").asText())) {
            boolean modified = false;
            if (widgetNode.isObject()) {
              modified =
                  backfillCountdownSettings(
                      mapper, (com.fasterxml.jackson.databind.node.ObjectNode) widgetNode);
            }
            return modified ? mapper.writeValueAsString(rootObj) : layoutJson;
          }
        }
      }
    } catch (Exception e) {
      // Return original on error
    }
    return layoutJson;
  }

  private static boolean backfillCountdownSettings(
      com.fasterxml.jackson.databind.ObjectMapper mapper,
      com.fasterxml.jackson.databind.node.ObjectNode wObj) {
    boolean modified = false;
    com.fasterxml.jackson.databind.node.ObjectNode cs;
    if (wObj.has("customSettings") && wObj.get("customSettings").isObject()) {
      cs = (com.fasterxml.jackson.databind.node.ObjectNode) wObj.get("customSettings");
    } else {
      cs = mapper.createObjectNode();
      wObj.set("customSettings", cs);
      modified = true;
    }
    if (!cs.has("lampSizingMode")) {
      cs.put("lampSizingMode", "custom");
      modified = true;
    }
    if (!cs.has("previewLampCount") && !cs.has("maxLamps")) {
      cs.put("previewLampCount", 5);
      cs.put("maxLamps", 5);
      modified = true;
    } else if (!cs.has("maxLamps")) {
      cs.put("maxLamps", cs.get("previewLampCount").asInt(5));
      modified = true;
    } else if (!cs.has("previewLampCount")) {
      cs.put("previewLampCount", cs.get("maxLamps").asInt(5));
      modified = true;
    }
    if (!cs.has("fadeIn")) {
      cs.put("fadeIn", true);
      modified = true;
    }
    if (!cs.has("glowEffect")) {
      cs.put("glowEffect", true);
      modified = true;
    }
    if (!cs.has("glowOverlap") || cs.get("glowOverlap").asInt() == 100) {
      cs.put("glowOverlap", 30);
      modified = true;
    }
    if (!cs.has("glowRedOverlap") || cs.get("glowRedOverlap").asInt() == 100) {
      cs.put("glowRedOverlap", 30);
      modified = true;
    }
    if (!cs.has("glowGreenOverlap") || cs.get("glowGreenOverlap").asInt() == 100) {
      cs.put("glowGreenOverlap", 25);
      modified = true;
    }
    return modified;
  }

  public static String ensurePracticeTopRowCoordinates(String layoutJson) {
    if (layoutJson == null || layoutJson.trim().isEmpty()) {
      return layoutJson;
    }
    try {
      com.fasterxml.jackson.databind.ObjectMapper mapper =
          new com.fasterxml.jackson.databind.ObjectMapper();
      com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(layoutJson);
      if (!root.isObject()) {
        return layoutJson;
      }
      com.fasterxml.jackson.databind.node.ObjectNode rootObj =
          (com.fasterxml.jackson.databind.node.ObjectNode) root;
      com.fasterxml.jackson.databind.JsonNode widgetsNode = rootObj.get("widgets");
      if (widgetsNode != null && widgetsNode.isArray()) {
        boolean modified = false;
        com.fasterxml.jackson.databind.node.ArrayNode widgetsArray =
            (com.fasterxml.jackson.databind.node.ArrayNode) widgetsNode;
        for (com.fasterxml.jackson.databind.JsonNode widgetNode : widgetsArray) {
          if (widgetNode.isObject()) {
            com.fasterxml.jackson.databind.node.ObjectNode wObj =
                (com.fasterxml.jackson.databind.node.ObjectNode) widgetNode;
            int y = wObj.has("y") ? wObj.get("y").asInt() : -1;
            int h = wObj.has("height") ? wObj.get("height").asInt() : -1;
            String type = wObj.has("widgetType") ? wObj.get("widgetType").asText() : "";
            if ("menu-bar".equals(type) && h == 55) {
              wObj.put("height", 38);
              modified = true;
            } else if ((y == 49 || y == 50) && (h == 112 || h == 111)) {
              wObj.put("y", 38);
              wObj.put("height", 111);
              modified = true;
            }
          }
        }
        return modified ? mapper.writeValueAsString(rootObj) : layoutJson;
      }
    } catch (Exception e) {
      // Return original on error
    }
    return layoutJson;
  }

  public static String ensureDriverStationLapHighlight(String layoutJson) {
    if (layoutJson == null || layoutJson.trim().isEmpty()) {
      return layoutJson;
    }
    try {
      com.fasterxml.jackson.databind.ObjectMapper mapper =
          new com.fasterxml.jackson.databind.ObjectMapper();
      com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(layoutJson);
      if (!root.isObject()) {
        return layoutJson;
      }
      com.fasterxml.jackson.databind.node.ObjectNode rootObj =
          (com.fasterxml.jackson.databind.node.ObjectNode) root;
      com.fasterxml.jackson.databind.JsonNode widgetsNode = rootObj.get("widgets");
      if (widgetsNode != null && widgetsNode.isArray()) {
        boolean modified = false;
        com.fasterxml.jackson.databind.node.ArrayNode widgetsArray =
            (com.fasterxml.jackson.databind.node.ArrayNode) widgetsNode;
        for (com.fasterxml.jackson.databind.JsonNode widgetNode : widgetsArray) {
          if (widgetNode.isObject()) {
            com.fasterxml.jackson.databind.node.ObjectNode wObj =
                (com.fasterxml.jackson.databind.node.ObjectNode) widgetNode;
            com.fasterxml.jackson.databind.node.ObjectNode cs;
            if (wObj.has("customSettings") && wObj.get("customSettings").isObject()) {
              cs = (com.fasterxml.jackson.databind.node.ObjectNode) wObj.get("customSettings");
            } else {
              cs = mapper.createObjectNode();
              wObj.set("customSettings", cs);
              modified = true;
            }
            if (!cs.has("highlightRowOnLap") || !cs.get("highlightRowOnLap").asBoolean()) {
              cs.put("highlightRowOnLap", true);
              modified = true;
            }
            String currentStyle =
                cs.has("highlightLapStyle") ? cs.get("highlightLapStyle").asText() : "";
            if (currentStyle.isEmpty() || "classic".equalsIgnoreCase(currentStyle)) {
              cs.put("highlightLapStyle", "full-glow");
              modified = true;
            }
          }
        }
        return modified ? mapper.writeValueAsString(rootObj) : layoutJson;
      }
    } catch (Exception e) {
      // Return original on error
    }
    return layoutJson;
  }

  public static String ensureDriverStationProgressGaugeDefaults(String layoutJson) {
    if (layoutJson == null || layoutJson.trim().isEmpty()) {
      return layoutJson;
    }
    try {
      com.fasterxml.jackson.databind.ObjectMapper mapper =
          new com.fasterxml.jackson.databind.ObjectMapper();
      com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(layoutJson);
      if (!root.isObject()) {
        return layoutJson;
      }
      com.fasterxml.jackson.databind.node.ObjectNode rootObj =
          (com.fasterxml.jackson.databind.node.ObjectNode) root;
      com.fasterxml.jackson.databind.JsonNode widgetsNode = rootObj.get("widgets");
      if (widgetsNode != null && widgetsNode.isArray()) {
        boolean modified = false;
        com.fasterxml.jackson.databind.node.ArrayNode widgetsArray =
            (com.fasterxml.jackson.databind.node.ArrayNode) widgetsNode;
        for (com.fasterxml.jackson.databind.JsonNode widgetNode : widgetsArray) {
          if (widgetNode.isObject()) {
            com.fasterxml.jackson.databind.node.ObjectNode wObj =
                (com.fasterxml.jackson.databind.node.ObjectNode) widgetNode;
            String widgetType = wObj.has("widgetType") ? wObj.get("widgetType").asText() : "";
            if ("progress-gauge".equals(widgetType)) {
              com.fasterxml.jackson.databind.node.ObjectNode cs;
              if (wObj.has("customSettings") && wObj.get("customSettings").isObject()) {
                cs = (com.fasterxml.jackson.databind.node.ObjectNode) wObj.get("customSettings");
              } else {
                cs = mapper.createObjectNode();
                wObj.set("customSettings", cs);
                modified = true;
              }
              if (!cs.has("borderColor") || cs.get("borderColor").asText().trim().isEmpty()) {
                cs.put("borderColor", "#ffffff");
                modified = true;
              }
              if (!cs.has("textColor") || cs.get("textColor").asText().trim().isEmpty()) {
                cs.put("textColor", "#ffffff");
                modified = true;
              }
              if (!cs.has("fillColor") || cs.get("fillColor").asText().trim().isEmpty()) {
                cs.put("fillColor", "#d3d3d3");
                modified = true;
              }
            }
          }
        }
        return modified ? mapper.writeValueAsString(rootObj) : layoutJson;
      }
    } catch (Exception e) {
      // Return original on error
    }
    return layoutJson;
  }
}
