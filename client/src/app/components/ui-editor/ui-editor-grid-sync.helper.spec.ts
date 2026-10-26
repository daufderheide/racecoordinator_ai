import {
  handleColumnGapSettingsSync,
  handleCustomLabelSync,
  handleGridBindingModeSync,
  handleGridColumnStructureChanges,
  handleGridHeaderStructureChanges,
  handleGridSessionWidgetSync,
  handleGridSyncAction,
  handleGridWidgetInspectorSync,
} from "./ui-editor-grid-sync.helper";

describe("ui-editor-grid-sync.helper", () => {
  let mockComp: any;
  let mockLayout: any;
  let masterWidget: any;
  let childWidget: any;

  beforeEach(() => {
    masterWidget = {
      id: "w-master",
      widgetType: "lane-column",
      x: 10,
      y: 10,
      width: 100,
      height: 50,
      customSettings: {
        gridId: "grid-1",
        gridLane: 0,
        bindingMode: "lane",
        emptyRowsMode: "remove",
      },
    };

    childWidget = {
      id: "w-child",
      widgetType: "lane-column",
      x: 120,
      y: 10,
      width: 100,
      height: 50,
      customSettings: {
        gridId: "grid-1",
        gridMasterId: "w-master",
        gridLane: 1,
        bindingMode: "lane",
        emptyRowsMode: "remove",
      },
    };

    mockLayout = {
      widgets: [masterWidget, childWidget],
    };

    mockComp = {
      activeGridSession: {
        gridId: "grid-1",
        emptyRowsMode: "remove",
        bindingMode: "lane",
        sourceLaneIndex: 0,
      },
    };
  });

  describe("handleGridColumnStructureChanges", () => {
    it("should handle _gridEmptyRowsModeChanged and update all widgets in grid and activeGridSession", () => {
      masterWidget.customSettings._gridEmptyRowsModeChanged = true;
      masterWidget.customSettings.emptyRowsMode = "blank";

      handleGridColumnStructureChanges(
        mockComp,
        mockLayout,
        masterWidget,
        "grid-1",
      );

      expect(
        masterWidget.customSettings._gridEmptyRowsModeChanged,
      ).toBeUndefined();
      expect(masterWidget.customSettings.emptyRowsMode).toBe("blank");
      expect(childWidget.customSettings.emptyRowsMode).toBe("blank");
      expect(mockComp.activeGridSession.emptyRowsMode).toBe("blank");
    });

    it("should fallback to remove when emptyRowsMode is undefined during _gridEmptyRowsModeChanged", () => {
      masterWidget.customSettings._gridEmptyRowsModeChanged = true;
      delete masterWidget.customSettings.emptyRowsMode;

      handleGridColumnStructureChanges(
        mockComp,
        mockLayout,
        masterWidget,
        "grid-1",
      );

      expect(
        masterWidget.customSettings._gridEmptyRowsModeChanged,
      ).toBeUndefined();
      expect(masterWidget.customSettings.emptyRowsMode).toBe("remove");
      expect(childWidget.customSettings.emptyRowsMode).toBe("remove");
      expect(mockComp.activeGridSession.emptyRowsMode).toBe("remove");
    });

    it("should handle _linkColumnsChanged", () => {
      masterWidget.customSettings._linkColumnsChanged = true;
      masterWidget.customSettings.linkColumns = false;

      handleGridColumnStructureChanges(
        mockComp,
        mockLayout,
        masterWidget,
        "grid-1",
      );

      expect(masterWidget.customSettings._linkColumnsChanged).toBeUndefined();
      expect(mockComp.activeGridSession.linkColumns).toBeFalse();
    });

    it("should handle _mirrorRowsChanged", () => {
      masterWidget.customSettings._mirrorRowsChanged = true;
      masterWidget.customSettings.mirrorRows = false;

      handleGridColumnStructureChanges(
        mockComp,
        mockLayout,
        masterWidget,
        "grid-1",
      );

      expect(masterWidget.customSettings._mirrorRowsChanged).toBeUndefined();
      expect(childWidget.customSettings.mirrorRows).toBeFalse();
      expect(mockComp.activeGridSession.mirrorRows).toBeFalse();
    });

    it("should handle _gridTypeChanged", () => {
      masterWidget.customSettings._gridTypeChanged = true;
      masterWidget.customSettings.gridType = "overall";

      handleGridColumnStructureChanges(
        mockComp,
        mockLayout,
        masterWidget,
        "grid-1",
      );

      expect(masterWidget.customSettings._gridTypeChanged).toBeUndefined();
      expect(mockComp.activeGridSession.gridType).toBe("overall");
    });

    it("should handle _layoutOrientationChanged", () => {
      masterWidget.customSettings._layoutOrientationChanged = true;
      masterWidget.customSettings.layoutOrientation = "horizontal";

      handleGridColumnStructureChanges(
        mockComp,
        mockLayout,
        masterWidget,
        "grid-1",
      );

      expect(
        masterWidget.customSettings._layoutOrientationChanged,
      ).toBeUndefined();
      expect(mockComp.activeGridSession.layoutOrientation).toBe("horizontal");
    });
  });

  describe("handleGridHeaderStructureChanges", () => {
    it("should handle _headerPlacementChanged, _headerHeightChanged, and _headerWidthChanged", () => {
      masterWidget.customSettings._headerPlacementChanged = true;
      masterWidget.customSettings.headerPlacement = "top";
      masterWidget.customSettings.headerHeight = 40;
      masterWidget.customSettings.headerWidth = 150;

      handleGridHeaderStructureChanges(
        mockComp,
        mockLayout,
        masterWidget,
        "grid-1",
      );

      expect(
        masterWidget.customSettings._headerPlacementChanged,
      ).toBeUndefined();
      expect(mockComp.activeGridSession.headerPlacement).toBe("top");
      expect(mockComp.activeGridSession.headerHeight).toBe(40);
      expect(mockComp.activeGridSession.headerWidth).toBe(150);

      masterWidget.customSettings._headerHeightChanged = true;
      masterWidget.customSettings.headerHeight = 45;
      handleGridHeaderStructureChanges(
        mockComp,
        mockLayout,
        masterWidget,
        "grid-1",
      );
      expect(masterWidget.customSettings._headerHeightChanged).toBeUndefined();
      expect(mockComp.activeGridSession.headerHeight).toBe(45);

      masterWidget.customSettings._headerWidthChanged = true;
      masterWidget.customSettings.headerWidth = 180;
      handleGridHeaderStructureChanges(
        mockComp,
        mockLayout,
        masterWidget,
        "grid-1",
      );
      expect(masterWidget.customSettings._headerWidthChanged).toBeUndefined();
      expect(mockComp.activeGridSession.headerWidth).toBe(180);
    });
  });

  describe("handleGridSyncAction", () => {
    it("should process _syncAction when present", () => {
      masterWidget.customSettings._syncAction = "header";
      handleGridSyncAction(mockLayout, masterWidget, "grid-1");
      expect(masterWidget.customSettings._syncAction).toBeUndefined();
    });

    it("should do nothing if _syncAction is missing", () => {
      handleGridSyncAction(mockLayout, masterWidget, "grid-1");
      expect(masterWidget.customSettings._syncAction).toBeUndefined();
    });
  });

  describe("handleGridSessionWidgetSync", () => {
    it("should sync master widget when activeGridSession is present", () => {
      handleGridSessionWidgetSync(mockComp, mockLayout, masterWidget);
      expect(mockLayout.widgets.length).toBeGreaterThanOrEqual(1);
    });

    it("should sync mirrored child widget back to master and replicate to lanes", () => {
      childWidget.customSettings.columnKey = "gap";
      childWidget.customSettings.gapMode = "laps_and_time";
      childWidget.customSettings.gapTarget = "position";
      childWidget.textColor = "#ff00ff";

      handleGridSessionWidgetSync(mockComp, mockLayout, childWidget);

      expect(masterWidget.customSettings.columnKey).toBe("gap");
      expect(masterWidget.customSettings.gapMode).toBe("laps_and_time");
      expect(masterWidget.customSettings.gapTarget).toBe("position");
      expect(masterWidget.textColor).toBe("#ff00ff");
      expect(masterWidget.customSettings.gridMasterId).toBeUndefined();
      expect(masterWidget.customSettings.gridLane).toBe(0);
    });

    it("should not sync child widget to master if lanes are not mirrored", () => {
      masterWidget.customSettings.mirrorRows = false;
      childWidget.customSettings.gapMode = "laps_and_time";

      handleGridSessionWidgetSync(mockComp, mockLayout, childWidget);

      expect(masterWidget.customSettings.gapMode).toBeUndefined();
    });
  });

  describe("handleColumnGapSettingsSync", () => {
    it("should do nothing if neither gapMode nor gapTarget is set", () => {
      handleColumnGapSettingsSync(mockComp, mockLayout, masterWidget, "grid-1");
      expect(childWidget.customSettings.gapMode).toBeUndefined();
      expect(childWidget.customSettings.gapTarget).toBeUndefined();
    });

    it("should synchronize gapMode and gapTarget across column when target is master", () => {
      masterWidget.customSettings.gapMode = "always_laps";
      masterWidget.customSettings.gapTarget = "position";

      handleColumnGapSettingsSync(mockComp, mockLayout, masterWidget, "grid-1");

      expect(childWidget.customSettings.gapMode).toBe("always_laps");
      expect(childWidget.customSettings.gapTarget).toBe("position");
    });

    it("should synchronize gapMode and gapTarget across column when target is child", () => {
      childWidget.customSettings.gapMode = "laps_and_time";
      childWidget.customSettings.gapTarget = "leader";

      handleColumnGapSettingsSync(mockComp, mockLayout, childWidget, "grid-1");

      expect(masterWidget.customSettings.gapMode).toBe("laps_and_time");
      expect(masterWidget.customSettings.gapTarget).toBe("leader");
    });

    it("should not sync gap settings across column if unmirrored", () => {
      masterWidget.customSettings.mirrorRows = false;
      masterWidget.customSettings.gapMode = "always_laps";

      handleColumnGapSettingsSync(mockComp, mockLayout, masterWidget, "grid-1");

      expect(childWidget.customSettings.gapMode).toBeUndefined();
    });
  });

  describe("handleGridBindingModeSync", () => {
    it("should sync bindingMode to activeGridSession and other widgets in grid", () => {
      masterWidget.customSettings.bindingMode = "overallPosition";

      handleGridBindingModeSync(mockComp, mockLayout, masterWidget, "grid-1");

      expect(mockComp.activeGridSession.bindingMode).toBe("overallPosition");
      expect(childWidget.customSettings.bindingMode).toBe("overallPosition");
    });

    it("should do nothing if bindingMode is not set", () => {
      delete masterWidget.customSettings.bindingMode;

      handleGridBindingModeSync(mockComp, mockLayout, masterWidget, "grid-1");

      expect(mockComp.activeGridSession.bindingMode).toBe("lane");
      expect(childWidget.customSettings.bindingMode).toBe("lane");
    });
  });

  describe("handleCustomLabelSync", () => {
    it("should sync customLabel to matching master and child widgets", () => {
      masterWidget.customSettings.customLabel = "Lap Time";

      handleCustomLabelSync(mockLayout, masterWidget, "grid-1");

      expect(childWidget.customSettings.customLabel).toBe("Lap Time");
    });
  });

  describe("handleGridWidgetInspectorSync", () => {
    it("should clear _reset_ keys and run all synchronizations", () => {
      masterWidget.customSettings._reset_something = true;
      masterWidget.customSettings._gridEmptyRowsModeChanged = true;
      masterWidget.customSettings.emptyRowsMode = "empty";

      handleGridWidgetInspectorSync(
        mockComp,
        mockLayout,
        masterWidget,
        "grid-1",
      );

      expect(masterWidget.customSettings._reset_something).toBeUndefined();
      expect(
        masterWidget.customSettings._gridEmptyRowsModeChanged,
      ).toBeUndefined();
      expect(masterWidget.customSettings.emptyRowsMode).toBe("empty");
      expect(childWidget.customSettings.emptyRowsMode).toBe("empty");
      expect(mockComp.activeGridSession.emptyRowsMode).toBe("empty");
    });

    it("should synchronize gap settings when modified via inspector", () => {
      childWidget.customSettings.gapMode = "laps_and_time";
      childWidget.customSettings.gapTarget = "position";

      handleGridWidgetInspectorSync(
        mockComp,
        mockLayout,
        childWidget,
        "grid-1",
      );

      expect(masterWidget.customSettings.gapMode).toBe("laps_and_time");
      expect(masterWidget.customSettings.gapTarget).toBe("position");
    });
  });
});
