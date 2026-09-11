package com.antigravity.models;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class CustomUI extends Model {

  public static final String DEFAULT_UI_ID = "default_ui_layout_rc_ai";
  public static final String PRACTICE_UI_ID = "practice_ui_layout_rc_ai";
  public static final String FUEL_UI_ID = "default_fuel_ui_layout_rc_ai";

  public static final String DEFAULT_UI_NAME = "RaceCoordinator AI";
  public static final String PRACTICE_UI_NAME = "RaceCoordinator AI (Practice)";
  public static final String FUEL_UI_NAME = "RaceCoordinator AI (Fuel)";

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
        || "racecoordinator ai (default)".equals(n);
  }

  public static boolean isLegacyPracticeName(String name) {
    if (name == null || name.trim().isEmpty()) {
      return true;
    }
    String n = name.trim().toLowerCase();
    return "practice".equals(n)
        || "practice ui".equals(n)
        || "practice ui layout".equals(n)
        || "default practice ui layout".equals(n);
  }

  public static boolean isLegacyFuelName(String name) {
    if (name == null || name.trim().isEmpty()) {
      return true;
    }
    String n = name.trim().toLowerCase();
    return "fuel".equals(n)
        || "fuel ui".equals(n)
        || "fuel ui layout".equals(n)
        || "default fuel ui layout".equals(n);
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

  public static CustomUI createDefault() {
    String layoutJson =
        "{\"widgets\":[{\"id\":\"widget-menu-bar\",\"widgetType\":\"menu-bar\",\"x\":0,\"y\":0,"
            + "\"width\":1920,\"height\":54,\"zIndex\":100,\"scaleMode\":\"auto\"},"
            + "{\"id\":\"widget-race-name\",\"widgetType\":\"race-name\",\"x\":0,\"y\":54,"
            + "\"width\":200,\"height\":18,\"zIndex\":100,\"scaleMode\":\"auto\"},"
            + "{\"id\":\"widget-heat-info\",\"widgetType\":\"heat-info\",\"x\":640,\"y\":54,"
            + "\"width\":200,\"height\":18,\"zIndex\":100,\"scaleMode\":\"auto\"},"
            + "{\"id\":\"widget-track-name\",\"widgetType\":\"track-name\",\"x\":1280,\"y\":54,"
            + "\"width\":200,\"height\":18,\"zIndex\":100,\"scaleMode\":\"auto\"},"
            + "{\"id\":\"widget-branding\",\"widgetType\":\"branding\",\"x\":0,\"y\":90,"
            + "\"width\":384,\"height\":239,\"zIndex\":100,\"scaleMode\":\"auto\"},"
            + "{\"id\":\"widget-qr\",\"widgetType\":\"qr\",\"x\":328,\"y\":273,\"width\":48,"
            + "\"height\":48,\"zIndex\":110,\"scaleMode\":\"auto\"},"
            + "{\"id\":\"widget-flag\",\"widgetType\":\"flag\",\"x\":384,\"y\":90,\"width\":384,"
            + "\"height\":239,\"zIndex\":100,\"scaleMode\":\"auto\"},"
            + "{\"id\":\"widget-timer\",\"widgetType\":\"timer\",\"x\":768,\"y\":90,\"width\":384,"
            + "\"height\":239,\"zIndex\":100,\"scaleMode\":\"auto\",\"customSettings\":{"
            + "\"timeFontFamily\":\"\",\"timeFontSize\":100,\"timeTextColor\":\"\","
            + "\"timeSubsecondThreshold\":10,\"timeSubsecondDecimals\":2}},"
            + "{\"id\":\"widget-records\",\"widgetType\":\"records\",\"x\":1152,\"y\":90,"
            + "\"width\":384,\"height\":239,\"zIndex\":100,\"scaleMode\":\"auto\"},"
            + "{\"id\":\"widget-leaderboard\",\"widgetType\":\"leaderboard\",\"x\":1536,\"y\":90,"
            + "\"width\":384,\"height\":239,\"zIndex\":100,\"scaleMode\":\"auto\"},"
            + "{\"id\":\"widget-lane-view\",\"widgetType\":\"lane-view\",\"x\":0,\"y\":329,"
            + "\"width\":1920,\"height\":751,\"zIndex\":111,\"scaleMode\":\"auto\","
            + "\"fontFamily\":\"\",\"textColor\":\"\",\"backgroundColor\":\"\","
            + "\"fontSize\":24,\"textScaleFactor\":1,\"customSettings\":{"
            + "\"isVertical\":false,\"timeDecimalPlaces\":3,\"lapDecimalPlaces\":2,"
            + "\"columnFontFamily\":\"\",\"columnFontSize\":24,\"columnTextColor\":\"\","
            + "\"dataFontFamily\":\"\",\"dataFontSize\":54,\"dataTextColor\":\"\","
            + "\"insetTimeDecimalPlaces\":3,\"insetLapDecimalPlaces\":2,"
            + "\"insetFontFamily\":\"\",\"insetFontSize\":24,\"insetTextColor\":\"\","
            + "\"columnWidths\":{\"ghostPacingLeaderAvg\":200,\"averageLapTime\":310}},"
            + "{\"id\":\"widget-countdown\",\"widgetType\":\"countdown\",\"x\":460,\"y\":390,"
            + "\"width\":1000,\"height\":250,\"zIndex\":2000,\"scaleMode\":\"auto\","
            + "\"customSettings\":{\"orientation\":\"horizontal\",\"lampScale\":1.0,"
            + "\"blurArea\":\"fullscreen\",\"blurAmount\":50,\"lampSizingMode\":\"custom\","
            + "\"previewLampCount\":5,\"glowEffect\":true,\"glowOverlap\":100,"
            + "\"glowRedOverlap\":100,\"glowGreenOverlap\":100}}]}";
    String columnsJson =
        "[\"driver.nickname\",\"lapCount\",\"lastLapTime\",\"averageLapTime\",\"gapLeader\","
            + "\"ghostPacingLeaderAvg\"]";
    String columnLayoutsJson =
        "{\"laneNumber\":{\"center-center\":\"laneNumber\"},\"driver.nickname\":{"
            + "\"center-center\":\"driver.nickname\",\"bottom-right\":\"participant.team.name\","
            + "\"bottom-left\":\"driverViewQrCode\"},\"imageset_fuel-gauge-builtin\":{"
            + "\"center-center\":\"imageset_fuel-gauge-builtin\"},\"lapCount\":{"
            + "\"center-center\":\"lapCount\",\"bottom-left\":\"flag\"},\"lastLapTime\":{"
            + "\"center-center\":\"lastLapTime\",\"bottom-right\":\"bestLapTime\"},"
            + "\"gapLeader\":{\"center-center\":\"gapLeader\",\"bottom-right\":\"gapPosition\"}}";
    String columnVisibilityJson = "{\"imageset_fuel-gauge-builtin\":\"FuelRaceOnly\"}";
    String columnWidthsJson = "{\"ghostPacingLeaderAvg\":200,\"averageLapTime\":310}";
    return new CustomUI(
        "RaceCoordinator AI",
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
    String layoutJson =
        "{\"widgets\":[{\"id\":\"widget-menu-bar\",\"widgetType\":\"menu-bar\",\"x\":0,\"y\":0,\"width\":1728,\"height\":46,\"zIndex\":216,\"scaleMode\":\"auto\",\"fontFamily\":\"\",\"textColor\":\"\",\"backgroundColor\":\"\",\"fontSize\":24,\"textScaleFactor\":1},"
            + "{\"id\":\"widget-timer\",\"widgetType\":\"timer\",\"x\":701,\"y\":41,\"width\":397,\"height\":93,\"zIndex\":222,\"scaleMode\":\"auto\",\"fontFamily\":\"\",\"textColor\":\"\",\"backgroundColor\":\"\",\"fontSize\":24,\"textScaleFactor\":1,\"customSettings\":{\"timeFontFamily\":\"\",\"timeFontSize\":100,\"timeTextColor\":\"\"}},"
            + "{\"id\":\"widget-branding\",\"widgetType\":\"branding\",\"x\":0,\"y\":41,\"width\":422,\"height\":93,\"zIndex\":206,\"scaleMode\":\"auto\",\"fontFamily\":\"\",\"fontSize\":24,\"textColor\":\"\",\"textScaleFactor\":1,\"backgroundColor\":\"\"},"
            + "{\"backgroundColor\":\"\",\"fontFamily\":\"\",\"fontSize\":24,\"height\":92,\"id\":\"widget-qr\",\"scaleMode\":\"auto\",\"textColor\":\"\",\"textScaleFactor\":1,\"widgetType\":\"qr\",\"width\":119,\"x\":422,\"y\":42,\"zIndex\":217},"
            + "{\"id\":\"widget-1783269768449\",\"widgetType\":\"flag\",\"x\":541,\"y\":41,\"width\":160,\"height\":93,\"zIndex\":212,\"scaleMode\":\"auto\",\"fontFamily\":\"\",\"textColor\":\"\",\"backgroundColor\":\"\",\"fontSize\":24,\"textScaleFactor\":1},"
            + "{\"id\":\"widget-1783269787601\",\"widgetType\":\"lane-view\",\"x\":0,\"y\":124,\"width\":1728,\"height\":775,\"zIndex\":221,\"scaleMode\":\"auto\",\"fontFamily\":\"\",\"textColor\":\"\",\"backgroundColor\":\"\",\"fontSize\":24,\"textScaleFactor\":1,\"customSettings\":{\"isVertical\":true,\"timeDecimalPlaces\":3,\"lapDecimalPlaces\":0,\"columnFontFamily\":\"\",\"columnFontSize\":24,\"columnTextColor\":\"\",\"dataFontFamily\":\"\",\"dataFontSize\":54,\"dataTextColor\":\"\",\"insetTimeDecimalPlaces\":3,\"insetLapDecimalPlaces\":2,\"insetFontFamily\":\"\",\"insetFontSize\":24,\"insetTextColor\":\"\"}},"
            + "{\"id\":\"widget-countdown\",\"widgetType\":\"countdown\",\"x\":364,\"y\":324,\"width\":1000,\"height\":250,\"zIndex\":2000,\"scaleMode\":\"auto\",\"customSettings\":{\"orientation\":\"horizontal\",\"lampScale\":1.0,\"blurArea\":\"fullscreen\",\"blurAmount\":50,\"lampSizingMode\":\"custom\",\"previewLampCount\":5,\"glowEffect\":true,\"glowOverlap\":100,\"glowRedOverlap\":100,\"glowGreenOverlap\":100}}],\"baseWidth\":1728,\"baseHeight\":899}";
    String columnsJson =
        "[\"laneNumber\",\"lastLapTime\",\"bestLapTime\",\"lastLaps\",\"lapCount\"]";
    String columnLayoutsJson =
        "{\"laneNumber\":{\"center-center\":\"laneNumber\"},\"driver.nickname\":{\"center-center\":\"driver.nickname\"},\"lastLapTime\":{\"center-center\":\"lastLapTime\"},\"lastLaps\":{\"center-center\":\"lastLaps\"},\"bestLapTime\":{\"center-center\":\"bestLapTime\"},\"lapCount\":{\"center-center\":\"lapCount\"}}";
    String columnVisibilityJson =
        "{\"imageset_fuel-gauge-builtin\":\"FuelRaceOnly\",\"laneNumber\":\"Always\",\"lastLaps\":\"Always\"}";
    return new CustomUI(
        "RaceCoordinator AI (Practice)",
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
    String layoutJson =
        "{\"widgets\":[{\"id\":\"widget-menu-bar\",\"widgetType\":\"menu-bar\",\"x\":0,\"y\":0,"
            + "\"width\":1920,\"height\":54,\"zIndex\":100,\"scaleMode\":\"auto\"},"
            + "{\"id\":\"widget-race-name\",\"widgetType\":\"race-name\",\"x\":0,\"y\":54,"
            + "\"width\":200,\"height\":18,\"zIndex\":100,\"scaleMode\":\"auto\"},"
            + "{\"id\":\"widget-heat-info\",\"widgetType\":\"heat-info\",\"x\":640,\"y\":54,"
            + "\"width\":200,\"height\":18,\"zIndex\":100,\"scaleMode\":\"auto\"},"
            + "{\"id\":\"widget-track-name\",\"widgetType\":\"track-name\",\"x\":1280,\"y\":54,"
            + "\"width\":200,\"height\":18,\"zIndex\":100,\"scaleMode\":\"auto\"},"
            + "{\"id\":\"widget-branding\",\"widgetType\":\"branding\",\"x\":0,\"y\":90,"
            + "\"width\":384,\"height\":239,\"zIndex\":100,\"scaleMode\":\"auto\"},"
            + "{\"id\":\"widget-qr\",\"widgetType\":\"qr\",\"x\":328,\"y\":273,\"width\":48,"
            + "\"height\":48,\"zIndex\":110,\"scaleMode\":\"auto\"},"
            + "{\"id\":\"widget-flag\",\"widgetType\":\"flag\",\"x\":384,\"y\":90,\"width\":384,"
            + "\"height\":239,\"zIndex\":100,\"scaleMode\":\"auto\"},"
            + "{\"id\":\"widget-timer\",\"widgetType\":\"timer\",\"x\":768,\"y\":90,\"width\":384,"
            + "\"height\":239,\"zIndex\":100,\"scaleMode\":\"auto\",\"customSettings\":{"
            + "\"timeFontFamily\":\"\",\"timeFontSize\":100,\"timeTextColor\":\"\","
            + "\"timeSubsecondThreshold\":10,\"timeSubsecondDecimals\":2}},"
            + "{\"id\":\"widget-records\",\"widgetType\":\"records\",\"x\":1152,\"y\":90,"
            + "\"width\":384,\"height\":239,\"zIndex\":100,\"scaleMode\":\"auto\"},"
            + "{\"id\":\"widget-leaderboard\",\"widgetType\":\"leaderboard\",\"x\":1536,\"y\":90,"
            + "\"width\":384,\"height\":239,\"zIndex\":100,\"scaleMode\":\"auto\"},"
            + "{\"id\":\"widget-lane-view\",\"widgetType\":\"lane-view\",\"x\":0,\"y\":329,"
            + "\"width\":1920,\"height\":751,\"zIndex\":111,\"scaleMode\":\"auto\","
            + "\"fontFamily\":\"\",\"textColor\":\"\",\"backgroundColor\":\"\","
            + "\"fontSize\":24,\"textScaleFactor\":1,\"customSettings\":{"
            + "\"isVertical\":false,\"timeDecimalPlaces\":3,\"lapDecimalPlaces\":2,"
            + "\"columnFontFamily\":\"\",\"columnFontSize\":24,\"columnTextColor\":\"\","
            + "\"dataFontFamily\":\"\",\"dataFontSize\":54,\"dataTextColor\":\"\","
            + "\"insetTimeDecimalPlaces\":3,\"insetLapDecimalPlaces\":2,"
            + "\"insetFontFamily\":\"\",\"insetFontSize\":24,\"insetTextColor\":\"\","
            + "\"columnWidths\":{\"lapCount\":210,\"imageset_fuel-gauge-builtin\":210,"
            + "\"lastLapTime\":310,\"gapLeader\":310}}},"
            + "{\"id\":\"widget-countdown\",\"widgetType\":\"countdown\",\"x\":460,\"y\":390,"
            + "\"width\":1000,\"height\":250,\"zIndex\":2000,\"scaleMode\":\"auto\","
            + "\"customSettings\":{\"orientation\":\"horizontal\",\"lampScale\":1.0,"
            + "\"blurArea\":\"fullscreen\",\"blurAmount\":50,\"lampSizingMode\":\"custom\","
            + "\"previewLampCount\":5,\"glowEffect\":true,\"glowOverlap\":100,"
            + "\"glowRedOverlap\":100,\"glowGreenOverlap\":100}}]}";
    String columnsJson =
        "[\"driver.nickname\",\"imageset_fuel-gauge-builtin\",\"lapCount\",\"lastLapTime\","
            + "\"gapLeader\"]";
    String columnLayoutsJson =
        "{\"laneNumber\":{\"center-center\":\"laneNumber\"},\"driver.nickname\":{"
            + "\"center-center\":\"driver.nickname\",\"bottom-right\":\"participant.team.name\","
            + "\"bottom-left\":\"driverViewQrCode\"},\"imageset_fuel-gauge-builtin\":{"
            + "\"center-center\":\"imageset_fuel-gauge-builtin\"},\"lapCount\":{"
            + "\"center-center\":\"lapCount\",\"bottom-left\":\"flag\"},\"lastLapTime\":{"
            + "\"center-center\":\"lastLapTime\",\"top-right\":\"bestLapTime\","
            + "\"bottom-right\":\"averageLapTime\"},\"gapLeader\":{\"center-center\":\"gapLeader\","
            + "\"bottom-right\":\"gapPosition\"}}";
    String columnVisibilityJson = "{\"imageset_fuel-gauge-builtin\":\"FuelRaceOnly\"}";
    String columnWidthsJson =
        "{\"lapCount\":210,\"imageset_fuel-gauge-builtin\":210,\"lastLapTime\":310,"
            + "\"gapLeader\":310}";
    return new CustomUI(
        "RaceCoordinator AI (Fuel)",
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
              if (!cs.has("lampSizingMode")) {
                cs.put("lampSizingMode", "custom");
                modified = true;
              }
              if (!cs.has("previewLampCount")) {
                cs.put("previewLampCount", 5);
                modified = true;
              }
              if (!cs.has("glowEffect")) {
                cs.put("glowEffect", true);
                modified = true;
              }
              if (!cs.has("glowOverlap")) {
                cs.put("glowOverlap", 100);
                modified = true;
              }
              if (!cs.has("glowRedOverlap")) {
                cs.put("glowRedOverlap", 100);
                modified = true;
              }
              if (!cs.has("glowGreenOverlap")) {
                cs.put("glowGreenOverlap", 100);
                modified = true;
              }
            }
            return modified ? mapper.writeValueAsString(rootObj) : layoutJson;
          }
        }
        int baseWidth = rootObj.has("baseWidth") ? rootObj.get("baseWidth").asInt(1920) : 1920;
        int baseHeight = rootObj.has("baseHeight") ? rootObj.get("baseHeight").asInt(1080) : 1080;
        int widgetWidth = 1000;
        int widgetHeight = 250;
        int x = Math.max(0, (baseWidth - widgetWidth) / 2);
        int y = Math.max(0, (baseHeight - widgetHeight) / 2);

        com.fasterxml.jackson.databind.node.ObjectNode countdownWidget = mapper.createObjectNode();
        countdownWidget.put("id", "widget-countdown");
        countdownWidget.put("widgetType", "countdown");
        countdownWidget.put("x", x);
        countdownWidget.put("y", y);
        countdownWidget.put("width", widgetWidth);
        countdownWidget.put("height", widgetHeight);
        countdownWidget.put("zIndex", 2000);
        countdownWidget.put("scaleMode", "auto");

        com.fasterxml.jackson.databind.node.ObjectNode customSettings = mapper.createObjectNode();
        customSettings.put("orientation", "horizontal");
        customSettings.put("lampScale", 1.0);
        customSettings.put("blurArea", "fullscreen");
        customSettings.put("blurAmount", 50);
        customSettings.put("lampSizingMode", "custom");
        customSettings.put("previewLampCount", 5);
        customSettings.put("glowEffect", true);
        customSettings.put("glowOverlap", 100);
        customSettings.put("glowRedOverlap", 100);
        customSettings.put("glowGreenOverlap", 100);
        countdownWidget.set("customSettings", customSettings);

        widgetsArray.add(countdownWidget);
        return mapper.writeValueAsString(rootObj);
      }
    } catch (Exception e) {
      // Return original on error
    }
    return layoutJson;
  }
}
