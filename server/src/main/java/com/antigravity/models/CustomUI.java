package com.antigravity.models;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class CustomUI extends Model {

  public static final String DEFAULT_UI_ID = "default_ui_layout_rc_ai";
  public static final String PRACTICE_UI_ID = "practice_ui_layout_rc_ai";
  public static final String FUEL_UI_ID = "default_fuel_ui_layout_rc_ai";

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
        "{\"widgets\":[{\"id\":\"widget-menu-bar\",\"widgetType\":\"menu-bar\",\"x\":0,\"y\":0,\"width\":1728,\"height\":45,\"zIndex\":100,\"scaleMode\":\"auto\"},"
            + "{\"id\":\"widget-race-name\",\"widgetType\":\"race-name\",\"x\":0,\"y\":45,\"width\":180,\"height\":15,\"zIndex\":100,\"scaleMode\":\"auto\"},"
            + "{\"id\":\"widget-heat-info\",\"widgetType\":\"heat-info\",\"x\":576,\"y\":45,\"width\":180,\"height\":15,\"zIndex\":100,\"scaleMode\":\"auto\"},"
            + "{\"id\":\"widget-track-name\",\"widgetType\":\"track-name\",\"x\":1152,\"y\":45,\"width\":180,\"height\":15,\"zIndex\":100,\"scaleMode\":\"auto\"},"
            + "{\"id\":\"widget-branding\",\"widgetType\":\"branding\",\"x\":0,\"y\":75,\"width\":346,\"height\":199,\"zIndex\":100,\"scaleMode\":\"auto\"},"
            + "{\"id\":\"widget-qr\",\"widgetType\":\"qr\",\"x\":295,\"y\":227,\"width\":43,\"height\":40,\"zIndex\":110,\"scaleMode\":\"auto\"},"
            + "{\"id\":\"widget-flag\",\"widgetType\":\"flag\",\"x\":346,\"y\":75,\"width\":346,\"height\":199,\"zIndex\":100,\"scaleMode\":\"auto\"},"
            + "{\"id\":\"widget-timer\",\"widgetType\":\"timer\",\"x\":691,\"y\":75,\"width\":346,\"height\":199,\"zIndex\":100,\"scaleMode\":\"auto\",\"customSettings\":{\"timeFontFamily\":\"\",\"timeFontSize\":100,\"timeTextColor\":\"\",\"timeSubsecondThreshold\":10,\"timeSubsecondDecimals\":2}},"
            + "{\"id\":\"widget-records\",\"widgetType\":\"records\",\"x\":1037,\"y\":75,\"width\":346,\"height\":199,\"zIndex\":100,\"scaleMode\":\"auto\"},"
            + "{\"id\":\"widget-leaderboard\",\"widgetType\":\"leaderboard\",\"x\":1382,\"y\":75,\"width\":346,\"height\":199,\"zIndex\":100,\"scaleMode\":\"auto\"},"
            + "{\"id\":\"widget-lane-view\",\"widgetType\":\"lane-view\",\"x\":0,\"y\":274,\"width\":1728,\"height\":625,\"zIndex\":111,\"scaleMode\":\"auto\",\"fontFamily\":\"\",\"textColor\":\"\",\"backgroundColor\":\"\",\"fontSize\":24,\"textScaleFactor\":1,\"customSettings\":{\"isVertical\":false,\"timeDecimalPlaces\":3,\"lapDecimalPlaces\":2,\"columnFontFamily\":\"\",\"columnFontSize\":24,\"columnTextColor\":\"\",\"dataFontFamily\":\"\",\"dataFontSize\":54,\"dataTextColor\":\"\",\"insetTimeDecimalPlaces\":3,\"insetLapDecimalPlaces\":2,\"insetFontFamily\":\"\",\"insetFontSize\":24,\"insetTextColor\":\"\"}}],\"baseWidth\":1728,\"baseHeight\":899}";
    String columnsJson =
        "[\"driver.nickname\",\"lapCount\",\"lastLapTime\",\"gapLeader\",\"ghostPacingLeaderAvg\"]";
    String columnLayoutsJson =
        "{\"laneNumber\":{\"center-center\":\"laneNumber\"},\"driver.nickname\":{\"center-center\":\"driver.nickname\",\"bottom-right\":\"participant.team.name\",\"bottom-left\":\"driverViewQrCode\"},\"imageset_fuel-gauge-builtin\":{\"center-center\":\"imageset_fuel-gauge-builtin\"},\"lapCount\":{\"center-center\":\"lapCount\",\"bottom-left\":\"flag\"},\"lastLapTime\":{\"center-center\":\"lastLapTime\",\"bottom-right\":\"bestLapTime\"},\"gapLeader\":{\"center-center\":\"gapLeader\",\"bottom-right\":\"gapPosition\"}}";
    String columnVisibilityJson = "{\"imageset_fuel-gauge-builtin\":\"FuelRaceOnly\"}";
    String columnWidthsJson =
        "{\"lapCount\":210,\"lastLapTime\":310,\"gapLeader\":310,\"ghostPacingLeaderAvg\":310}";
    return new CustomUI(
        "Default UI Layout",
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
            + "{\"id\":\"widget-1783269787601\",\"widgetType\":\"lane-view\",\"x\":0,\"y\":124,\"width\":1728,\"height\":775,\"zIndex\":221,\"scaleMode\":\"auto\",\"fontFamily\":\"\",\"textColor\":\"\",\"backgroundColor\":\"\",\"fontSize\":24,\"textScaleFactor\":1,\"customSettings\":{\"isVertical\":true,\"timeDecimalPlaces\":3,\"lapDecimalPlaces\":0,\"columnFontFamily\":\"\",\"columnFontSize\":24,\"columnTextColor\":\"\",\"dataFontFamily\":\"\",\"dataFontSize\":54,\"dataTextColor\":\"\",\"insetTimeDecimalPlaces\":3,\"insetLapDecimalPlaces\":2,\"insetFontFamily\":\"\",\"insetFontSize\":24,\"insetTextColor\":\"\"}}],\"baseWidth\":1728,\"baseHeight\":899}";
    String columnsJson =
        "[\"laneNumber\",\"lastLapTime\",\"bestLapTime\",\"lastLaps\",\"lapCount\"]";
    String columnLayoutsJson =
        "{\"laneNumber\":{\"center-center\":\"laneNumber\"},\"driver.nickname\":{\"center-center\":\"driver.nickname\"},\"lastLapTime\":{\"center-center\":\"lastLapTime\"},\"lastLaps\":{\"center-center\":\"lastLaps\"},\"bestLapTime\":{\"center-center\":\"bestLapTime\"},\"lapCount\":{\"center-center\":\"lapCount\"}}";
    String columnVisibilityJson =
        "{\"imageset_fuel-gauge-builtin\":\"FuelRaceOnly\",\"laneNumber\":\"Always\",\"lastLaps\":\"Always\"}";
    return new CustomUI(
        "Practice UI Layout",
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
        "{\"widgets\":[{\"id\":\"widget-menu-bar\",\"widgetType\":\"menu-bar\",\"x\":0,\"y\":0,\"width\":1728,\"height\":45,\"zIndex\":100,\"scaleMode\":\"auto\"},"
            + "{\"id\":\"widget-race-name\",\"widgetType\":\"race-name\",\"x\":0,\"y\":45,\"width\":180,\"height\":15,\"zIndex\":100,\"scaleMode\":\"auto\"},"
            + "{\"id\":\"widget-heat-info\",\"widgetType\":\"heat-info\",\"x\":576,\"y\":45,\"width\":180,\"height\":15,\"zIndex\":100,\"scaleMode\":\"auto\"},"
            + "{\"id\":\"widget-track-name\",\"widgetType\":\"track-name\",\"x\":1152,\"y\":45,\"width\":180,\"height\":15,\"zIndex\":100,\"scaleMode\":\"auto\"},"
            + "{\"id\":\"widget-branding\",\"widgetType\":\"branding\",\"x\":0,\"y\":75,\"width\":346,\"height\":199,\"zIndex\":100,\"scaleMode\":\"auto\"},"
            + "{\"id\":\"widget-qr\",\"widgetType\":\"qr\",\"x\":295,\"y\":227,\"width\":43,\"height\":40,\"zIndex\":110,\"scaleMode\":\"auto\"},"
            + "{\"id\":\"widget-flag\",\"widgetType\":\"flag\",\"x\":346,\"y\":75,\"width\":346,\"height\":199,\"zIndex\":114,\"scaleMode\":\"auto\",\"fontFamily\":\"\",\"textColor\":\"\",\"backgroundColor\":\"\",\"fontSize\":24,\"textScaleFactor\":1},"
            + "{\"id\":\"widget-timer\",\"widgetType\":\"timer\",\"x\":691,\"y\":75,\"width\":346,\"height\":199,\"zIndex\":100,\"scaleMode\":\"auto\",\"customSettings\":{\"timeFontFamily\":\"\",\"timeFontSize\":100,\"timeTextColor\":\"\",\"timeSubsecondThreshold\":10,\"timeSubsecondDecimals\":2}},"
            + "{\"id\":\"widget-records\",\"widgetType\":\"records\",\"x\":1037,\"y\":75,\"width\":346,\"height\":199,\"zIndex\":116,\"scaleMode\":\"auto\",\"fontFamily\":\"\",\"textColor\":\"\",\"backgroundColor\":\"\",\"fontSize\":24,\"textScaleFactor\":1,\"customSettings\":{\"headerFontFamily\":\"\",\"headerFontSize\":17,\"headerTextColor\":\"\",\"valueFontFamily\":\"\",\"valueFontSize\":19,\"valueTextColor\":\"\"}},"
            + "{\"id\":\"widget-leaderboard\",\"widgetType\":\"leaderboard\",\"x\":1382,\"y\":75,\"width\":346,\"height\":199,\"zIndex\":100,\"scaleMode\":\"auto\"},"
            + "{\"id\":\"widget-lane-view\",\"widgetType\":\"lane-view\",\"x\":0,\"y\":274,\"width\":1728,\"height\":625,\"zIndex\":117,\"scaleMode\":\"auto\",\"fontFamily\":\"\",\"textColor\":\"\",\"backgroundColor\":\"\",\"fontSize\":24,\"textScaleFactor\":1,\"customSettings\":{\"isVertical\":false,\"timeDecimalPlaces\":3,\"lapDecimalPlaces\":2,\"columnFontFamily\":\"\",\"columnFontSize\":24,\"columnTextColor\":\"\",\"dataFontFamily\":\"\",\"dataFontSize\":54,\"dataTextColor\":\"\",\"insetTimeDecimalPlaces\":3,\"insetLapDecimalPlaces\":2,\"insetFontFamily\":\"\",\"insetFontSize\":24,\"insetTextColor\":\"\"}}],\"baseWidth\":1728,\"baseHeight\":899}";
    String columnsJson =
        "[\"driver.nickname\",\"imageset_fuel-gauge-builtin\",\"lapCount\",\"lastLapTime\",\"gapLeader\"]";
    String columnLayoutsJson =
        "{\"laneNumber\":{\"center-center\":\"laneNumber\"},\"driver.nickname\":{\"center-center\":\"driver.nickname\",\"bottom-right\":\"participant.team.name\",\"bottom-left\":\"driverViewQrCode\"},\"imageset_fuel-gauge-builtin\":{\"center-center\":\"imageset_fuel-gauge-builtin\"},\"lapCount\":{\"center-center\":\"lapCount\",\"bottom-left\":\"flag\"},\"lastLapTime\":{\"center-center\":\"lastLapTime\",\"top-right\":\"bestLapTime\",\"bottom-right\":\"averageLapTime\"},\"gapLeader\":{\"center-center\":\"gapLeader\",\"bottom-right\":\"gapPosition\"}}";
    String columnVisibilityJson = "{\"imageset_fuel-gauge-builtin\":\"FuelRaceOnly\"}";
    String columnWidthsJson = "{\"imageset_fuel-gauge-builtin\":210}";
    return new CustomUI(
        "Default Fuel UI Layout",
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
}
