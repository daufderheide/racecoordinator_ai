import { LaneColumnGridHelper } from "./lane-column-grid.helper";

describe("LaneColumnGridHelper", () => {
  let settings: any;
  let changed: boolean;
  const onChange = () => {
    changed = true;
  };

  beforeEach(() => {
    settings = {};
    changed = false;
  });

  describe("Grid Header settings", () => {
    it("should get and set header placement", () => {
      expect(LaneColumnGridHelper.getGridHeaderPlacement(settings)).toBe(
        "individual",
      );
      LaneColumnGridHelper.setGridHeaderPlacement(settings, "top", onChange);
      expect(LaneColumnGridHelper.getGridHeaderPlacement(settings)).toBe("top");
      expect(settings._headerPlacementChanged).toBeTrue();
      expect(changed).toBeTrue();
    });

    it("should get and set header height", () => {
      expect(LaneColumnGridHelper.getGridHeaderHeight(settings)).toBe(36);
      LaneColumnGridHelper.setGridHeaderHeight(settings, 50, onChange);
      expect(LaneColumnGridHelper.getGridHeaderHeight(settings)).toBe(50);
      expect(settings._headerHeightChanged).toBeTrue();
      expect(changed).toBeTrue();
    });

    it("should clamp header height within [20, 200]", () => {
      LaneColumnGridHelper.setGridHeaderHeight(settings, 5, onChange);
      expect(LaneColumnGridHelper.getGridHeaderHeight(settings)).toBe(20);
      LaneColumnGridHelper.setGridHeaderHeight(settings, 500, onChange);
      expect(LaneColumnGridHelper.getGridHeaderHeight(settings)).toBe(200);
    });

    it("should get and set header typography and colors", () => {
      expect(LaneColumnGridHelper.getGridHeaderFontFamily(settings)).toBe("");
      LaneColumnGridHelper.setGridHeaderFontFamily(settings, "Arial", onChange);
      expect(LaneColumnGridHelper.getGridHeaderFontFamily(settings)).toBe(
        "Arial",
      );

      expect(LaneColumnGridHelper.getGridHeaderFontSize(settings)).toBe(14);
      LaneColumnGridHelper.setGridHeaderFontSize(settings, 18, onChange);
      expect(LaneColumnGridHelper.getGridHeaderFontSize(settings)).toBe(18);

      LaneColumnGridHelper.setGridHeaderTextColor(
        settings,
        "#ff0000",
        onChange,
      );
      expect(LaneColumnGridHelper.getGridHeaderTextColor(settings)).toBe(
        "#ff0000",
      );

      LaneColumnGridHelper.setGridHeaderBackgroundColor(
        settings,
        "#000000",
        onChange,
      );
      expect(LaneColumnGridHelper.getGridHeaderBackgroundColor(settings)).toBe(
        "#000000",
      );

      expect(LaneColumnGridHelper.getGridHeaderAlignment(settings)).toBe(
        "center",
      );
      LaneColumnGridHelper.setGridHeaderAlignment(settings, "start", onChange);
      expect(LaneColumnGridHelper.getGridHeaderAlignment(settings)).toBe(
        "start",
      );
    });
  });

  describe("Grid Label settings", () => {
    it("should get and set grid label position and text", () => {
      expect(LaneColumnGridHelper.getGridLabelPosition(settings)).toBe("none");
      LaneColumnGridHelper.setGridLabelPosition(settings, "top", onChange);
      expect(LaneColumnGridHelper.getGridLabelPosition(settings)).toBe("top");
      expect(settings._gridLabelChanged).toBeTrue();

      expect(LaneColumnGridHelper.getGridLabelText(settings)).toBe("");
      LaneColumnGridHelper.setGridLabelText(settings, "Lane 1", onChange);
      expect(LaneColumnGridHelper.getGridLabelText(settings)).toBe("Lane 1");
    });

    it("should get and set grid label size and font properties", () => {
      expect(LaneColumnGridHelper.getGridLabelSize(settings)).toBe(40);
      LaneColumnGridHelper.setGridLabelSize(settings, 60, onChange);
      expect(LaneColumnGridHelper.getGridLabelSize(settings)).toBe(60);

      expect(LaneColumnGridHelper.getGridLabelFontFamily(settings)).toBe("");
      LaneColumnGridHelper.setGridLabelFontFamily(settings, "Roboto", onChange);
      expect(LaneColumnGridHelper.getGridLabelFontFamily(settings)).toBe(
        "Roboto",
      );

      expect(LaneColumnGridHelper.getGridLabelFontSize(settings)).toBe(18);
      LaneColumnGridHelper.setGridLabelFontSize(settings, 24, onChange);
      expect(LaneColumnGridHelper.getGridLabelFontSize(settings)).toBe(24);

      expect(LaneColumnGridHelper.getGridLabelFontBold(settings)).toBeTrue();
      LaneColumnGridHelper.setGridLabelFontBold(settings, false, onChange);
      expect(LaneColumnGridHelper.getGridLabelFontBold(settings)).toBeFalse();

      expect(LaneColumnGridHelper.getGridLabelFontItalic(settings)).toBeFalse();
      LaneColumnGridHelper.setGridLabelFontItalic(settings, true, onChange);
      expect(LaneColumnGridHelper.getGridLabelFontItalic(settings)).toBeTrue();

      expect(LaneColumnGridHelper.getGridLabelAlignment(settings)).toBe(
        "center",
      );
      LaneColumnGridHelper.setGridLabelAlignment(settings, "end", onChange);
      expect(LaneColumnGridHelper.getGridLabelAlignment(settings)).toBe("end");
    });

    it("should get, set and reset grid label colors and borders", () => {
      expect(LaneColumnGridHelper.getGridLabelTextColor(settings)).toBe(
        "#ffffff",
      );
      LaneColumnGridHelper.setGridLabelTextColor(settings, "#00ff00", onChange);
      expect(LaneColumnGridHelper.getGridLabelTextColor(settings)).toBe(
        "#00ff00",
      );
      LaneColumnGridHelper.resetGridLabelTextColor(settings, onChange);
      expect(LaneColumnGridHelper.getGridLabelTextColor(settings)).toBe(
        "#ffffff",
      );

      expect(LaneColumnGridHelper.getGridLabelBackgroundColor(settings)).toBe(
        "rgba(15, 23, 42, 0.85)",
      );
      LaneColumnGridHelper.setGridLabelBackgroundColor(
        settings,
        "#123456",
        onChange,
      );
      expect(LaneColumnGridHelper.getGridLabelBackgroundColor(settings)).toBe(
        "#123456",
      );
      LaneColumnGridHelper.resetGridLabelBackgroundColor(settings, onChange);
      expect(LaneColumnGridHelper.getGridLabelBackgroundColor(settings)).toBe(
        "rgba(15, 23, 42, 0.85)",
      );

      expect(LaneColumnGridHelper.getGridLabelShowBorder(settings)).toBeTrue();
      LaneColumnGridHelper.setGridLabelShowBorder(settings, false, onChange);
      expect(LaneColumnGridHelper.getGridLabelShowBorder(settings)).toBeFalse();

      LaneColumnGridHelper.setGridLabelBorderColor(
        settings,
        "#abcdef",
        onChange,
      );
      expect(LaneColumnGridHelper.getGridLabelBorderColor(settings)).toBe(
        "#abcdef",
      );
      LaneColumnGridHelper.resetGridLabelBorderColor(settings, onChange);
      expect(LaneColumnGridHelper.getGridLabelBorderColor(settings)).toBe(
        "#ffffff",
      );

      expect(LaneColumnGridHelper.getGridLabelBorderWidth(settings)).toBe(1);
      LaneColumnGridHelper.setGridLabelBorderWidth(settings, 3, onChange);
      expect(LaneColumnGridHelper.getGridLabelBorderWidth(settings)).toBe(3);

      expect(LaneColumnGridHelper.getGridLabelBorderRadius(settings)).toBe(4);
      LaneColumnGridHelper.setGridLabelBorderRadius(settings, 8, onChange);
      expect(LaneColumnGridHelper.getGridLabelBorderRadius(settings)).toBe(8);
    });
  });

  describe("Grid Row and Layout settings", () => {
    it("should get and set highlightRowOnLap, linkColumns, mirrorRows, sortByBindingMode", () => {
      expect(LaneColumnGridHelper.getHighlightRowOnLap(settings)).toBeTrue();
      LaneColumnGridHelper.setHighlightRowOnLap(settings, false, onChange);
      expect(LaneColumnGridHelper.getHighlightRowOnLap(settings)).toBeFalse();

      expect(LaneColumnGridHelper.getLinkColumns(settings)).toBeTrue();
      LaneColumnGridHelper.setLinkColumns(settings, false, onChange);
      expect(LaneColumnGridHelper.getLinkColumns(settings)).toBeFalse();
      expect(settings._linkColumnsChanged).toBeTrue();

      expect(LaneColumnGridHelper.getMirrorRows(settings)).toBeTrue();
      LaneColumnGridHelper.setMirrorRows(settings, false, onChange);
      expect(LaneColumnGridHelper.getMirrorRows(settings)).toBeFalse();
      expect(settings._mirrorRowsChanged).toBeTrue();

      expect(LaneColumnGridHelper.getSortByBindingMode(settings)).toBeTrue();
      LaneColumnGridHelper.setSortByBindingMode(settings, false, onChange);
      expect(LaneColumnGridHelper.getSortByBindingMode(settings)).toBeFalse();
      expect(settings._sortByBindingModeChanged).toBeTrue();

      expect(LaneColumnGridHelper.getGridSortOrder(settings)).toBe("lane");
      LaneColumnGridHelper.setGridSortOrder(settings, "position", onChange);
      expect(LaneColumnGridHelper.getGridSortOrder(settings)).toBe("position");
      expect(settings.gridType).toBe("heat");
      expect(settings._gridSortOrderChanged).toBeTrue();
    });

    it("should get and set total lanes and layout orientation", () => {
      expect(LaneColumnGridHelper.getGridTotalLanes(settings, 6)).toBe(6);
      LaneColumnGridHelper.setGridTotalLanes(settings, 8, onChange);
      expect(LaneColumnGridHelper.getGridTotalLanes(settings, 6)).toBe(8);
      expect(settings._gridTotalLanesChanged).toBeTrue();

      expect(LaneColumnGridHelper.getGridDirection(settings)).toBe("vertical");
      settings.gridDirection = "horizontal";
      expect(LaneColumnGridHelper.getGridDirection(settings)).toBe(
        "horizontal",
      );

      expect(LaneColumnGridHelper.getGridLayoutOrientation(settings)).toBe(
        "vertical",
      );
      LaneColumnGridHelper.setGridLayoutOrientation(
        settings,
        "horizontal",
        onChange,
      );
      expect(LaneColumnGridHelper.getGridLayoutOrientation(settings)).toBe(
        "horizontal",
      );
      expect(settings._layoutOrientationChanged).toBeTrue();
    });

    it("should check isMasterCell correctly", () => {
      expect(LaneColumnGridHelper.isMasterCell(settings, true)).toBeFalse();
      expect(LaneColumnGridHelper.isMasterCell(settings, false)).toBeTrue();
      settings.gridLane = 1;
      expect(LaneColumnGridHelper.isMasterCell(settings, false)).toBeFalse();
      delete settings.gridLane;
      settings.targetIndex = 0;
      expect(LaneColumnGridHelper.isMasterCell(settings, false)).toBeTrue();
    });

    it("should generate breadcrumb labels", () => {
      expect(LaneColumnGridHelper.getGridBreadcrumbLabel(settings, 4)).toBe(
        "Grid (4 Lanes)",
      );
      settings.bindingMode = "position";
      expect(LaneColumnGridHelper.getGridBreadcrumbLabel(settings, 6)).toBe(
        "Grid (6 Pos)",
      );

      expect(LaneColumnGridHelper.getCellBreadcrumbLabel(settings, true)).toBe(
        "Header",
      );
      expect(LaneColumnGridHelper.getCellBreadcrumbLabel(settings, false)).toBe(
        "Pos 1",
      );
      settings.bindingMode = "overallPosition";
      expect(LaneColumnGridHelper.getCellBreadcrumbLabel(settings, false)).toBe(
        "Overall Pos 1",
      );
      settings.bindingMode = "seed";
      expect(LaneColumnGridHelper.getCellBreadcrumbLabel(settings, false)).toBe(
        "Seed 1",
      );
      settings.bindingMode = "lane";
      expect(LaneColumnGridHelper.getCellBreadcrumbLabel(settings, false)).toBe(
        "Lane 1",
      );
    });

    it("should return available indices based on bindingMode", () => {
      settings.bindingMode = "lane";
      const laneIndices = LaneColumnGridHelper.getAvailableIndices(settings, 4);
      expect(laneIndices.length).toBe(8);

      settings.bindingMode = "overallPosition";
      const overallIndices = LaneColumnGridHelper.getAvailableIndices(
        settings,
        4,
      );
      expect(overallIndices.length).toBe(16);
    });

    it("should get and set gridType correctly", () => {
      expect(LaneColumnGridHelper.getGridType(settings)).toBe("heat");
      LaneColumnGridHelper.setGridType(settings, "overall", onChange);
      expect(LaneColumnGridHelper.getGridType(settings)).toBe("overall");
      expect(settings._gridTypeChanged).toBeTrue();
      expect(changed).toBeTrue();

      // Overall column keys default to "heat" when gridType is not explicitly overall
      const fallbackSettings: any = { columnKey: "overallLapCount" };
      expect(LaneColumnGridHelper.getGridType(fallbackSettings)).toBe("heat");

      const heatFallbackSettings: any = { columnKey: "lapCount" };
      expect(LaneColumnGridHelper.getGridType(heatFallbackSettings)).toBe(
        "heat",
      );
    });

    it("should set gridType to overall when sort order is overallPosition and gridType is unset", () => {
      const unsetSettings: any = {};
      let orderChanged = false;
      LaneColumnGridHelper.setGridSortOrder(
        unsetSettings,
        "overallPosition",
        () => {
          orderChanged = true;
        },
      );
      expect(unsetSettings.bindingMode).toBe("overallPosition");
      expect(unsetSettings.gridType).toBe("overall");
      expect(unsetSettings._gridSortOrderChanged).toBeTrue();
      expect(orderChanged).toBeTrue();
    });

    it("should get and set gridEmptyRowsMode with appropriate defaults", () => {
      const heatSettings: any = { gridType: "heat", bindingMode: "lane" };
      expect(LaneColumnGridHelper.getGridEmptyRowsMode(heatSettings)).toBe(
        "empty",
      );

      const overallSettings: any = { gridType: "overall" };
      expect(LaneColumnGridHelper.getGridEmptyRowsMode(overallSettings)).toBe(
        "remove",
      );

      const seedSettings: any = { bindingMode: "seed" };
      expect(LaneColumnGridHelper.getGridEmptyRowsMode(seedSettings)).toBe(
        "remove",
      );

      let emptyRowsChanged = false;
      LaneColumnGridHelper.setGridEmptyRowsMode(heatSettings, "blank", () => {
        emptyRowsChanged = true;
      });
      expect(LaneColumnGridHelper.getGridEmptyRowsMode(heatSettings)).toBe(
        "blank",
      );
      expect(heatSettings.emptyRowsMode).toBe("blank");
      expect(heatSettings._gridEmptyRowsModeChanged).toBeTrue();
      expect(emptyRowsChanged).toBeTrue();

      LaneColumnGridHelper.setGridEmptyRowsMode(
        heatSettings,
        "remove",
        () => {},
      );
      expect(LaneColumnGridHelper.getGridEmptyRowsMode(heatSettings)).toBe(
        "remove",
      );

      LaneColumnGridHelper.setGridEmptyRowsMode(
        heatSettings,
        "empty",
        () => {},
      );
      expect(LaneColumnGridHelper.getGridEmptyRowsMode(heatSettings)).toBe(
        "empty",
      );
    });
  });
});
