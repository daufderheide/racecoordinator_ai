import { LaneGridHeaderHelper } from "@app/components/raceday/utils/lane-grid-header.helper";
import { LaneGridReplicationHelper } from "@app/components/raceday/utils/lane-grid-replication.helper";

export function handleGridBindingModeSync(
  comp: any,
  layout: any,
  targetWidget: any,
  gridId: string,
): void {
  const newBindingMode = targetWidget.customSettings?.["bindingMode"];
  if (!newBindingMode) return;

  if (comp.activeGridSession && comp.activeGridSession.gridId === gridId) {
    comp.activeGridSession.bindingMode = newBindingMode;
  }
  for (const w of layout.widgets) {
    if (w.customSettings?.["gridId"] === gridId && w.id !== targetWidget.id) {
      if (!w.customSettings) w.customSettings = {};
      w.customSettings["bindingMode"] = newBindingMode;
    }
  }
}

export function handleGridSyncAction(
  layout: any,
  targetWidget: any,
  gridId: string,
): void {
  if (!targetWidget.customSettings?.["_syncAction"]) return;
  const syncAction = targetWidget.customSettings["_syncAction"];
  delete targetWidget.customSettings["_syncAction"];
  layout.widgets = LaneGridReplicationHelper.syncCrossColumnProperty(
    gridId,
    syncAction,
    targetWidget.customSettings,
    layout.widgets,
    targetWidget.id,
    targetWidget.scaleMode,
  );
  delete targetWidget.customSettings?.["_forceAllColumns"];
}

export function handleGridHeaderStructureChanges(
  comp: any,
  layout: any,
  targetWidget: any,
  gridId: string,
): void {
  if (targetWidget.customSettings?.["_headerPlacementChanged"]) {
    delete targetWidget.customSettings["_headerPlacementChanged"];
    const newPlacement =
      targetWidget.customSettings?.["headerPlacement"] || "individual";
    const headerH = targetWidget.customSettings?.["headerHeight"] || 36;
    const headerW = targetWidget.customSettings?.["headerWidth"] || 200;
    layout.widgets = LaneGridReplicationHelper.updateGridHeaderPlacement(
      layout.widgets,
      gridId,
      newPlacement,
      headerH,
      headerW,
    );
    if (comp.activeGridSession && comp.activeGridSession.gridId === gridId) {
      comp.activeGridSession.headerPlacement = newPlacement;
      comp.activeGridSession.headerHeight = headerH;
      comp.activeGridSession.headerWidth = headerW;
    }
  }

  if (targetWidget.customSettings?.["_headerHeightChanged"]) {
    delete targetWidget.customSettings["_headerHeightChanged"];
    const newH = targetWidget.customSettings?.["headerHeight"] || 36;
    layout.widgets = LaneGridReplicationHelper.updateGridHeaderHeight(
      layout.widgets,
      gridId,
      newH,
    );
    if (comp.activeGridSession && comp.activeGridSession.gridId === gridId) {
      comp.activeGridSession.headerHeight = newH;
    }
  }

  if (targetWidget.customSettings?.["_headerWidthChanged"]) {
    delete targetWidget.customSettings["_headerWidthChanged"];
    const newW = targetWidget.customSettings?.["headerWidth"] || 200;
    layout.widgets = LaneGridReplicationHelper.updateGridHeaderWidth(
      layout.widgets,
      gridId,
      newW,
    );
    if (comp.activeGridSession && comp.activeGridSession.gridId === gridId) {
      comp.activeGridSession.headerWidth = newW;
    }
  }
}

export function handleGridTotalLanesStructureChange(
  comp: any,
  layout: any,
  targetWidget: any,
  gridId: string,
): void {
  delete targetWidget.customSettings["_gridTotalLanesChanged"];
  const newTotal = Math.max(
    1,
    Math.min(32, Number(targetWidget.customSettings?.["gridTotalLanes"]) || 4),
  );
  const existingBounds =
    comp.activeGridSession && comp.activeGridSession.gridId === gridId
      ? comp.activeGridSession.bounds
      : null;
  layout.widgets = LaneGridReplicationHelper.updateGridTotalLanes(
    layout.widgets,
    gridId,
    newTotal,
    existingBounds,
  );
  if (comp.activeGridSession && comp.activeGridSession.gridId === gridId) {
    comp.activeGridSession.totalLanes = newTotal;
    if (comp.activeGridSession.bounds) {
      layout.widgets = LaneGridReplicationHelper.syncAllMasterWidgetsToLanes(
        comp.activeGridSession,
        layout.widgets,
      );
    }
  }
}

export function handleGridLabelStructureChange(
  comp: any,
  layout: any,
  targetWidget: any,
  gridId: string,
): void {
  delete targetWidget.customSettings["_gridLabelChanged"];
  const labelConfig = {
    gridLabelPosition: targetWidget.customSettings?.["gridLabelPosition"],
    gridLabelText: targetWidget.customSettings?.["gridLabelText"],
    gridLabelSize: targetWidget.customSettings?.["gridLabelSize"],
    gridLabelFontFamily: targetWidget.customSettings?.["gridLabelFontFamily"],
    gridLabelFontSize: targetWidget.customSettings?.["gridLabelFontSize"],
    gridLabelTextColor: targetWidget.customSettings?.["gridLabelTextColor"],
    gridLabelBackgroundColor:
      targetWidget.customSettings?.["gridLabelBackgroundColor"],
    gridLabelFontBold: targetWidget.customSettings?.["gridLabelFontBold"],
    gridLabelFontItalic: targetWidget.customSettings?.["gridLabelFontItalic"],
    gridLabelAlignment: targetWidget.customSettings?.["gridLabelAlignment"],
    gridLabelShowBorder: targetWidget.customSettings?.["gridLabelShowBorder"],
    gridLabelBorderColor: targetWidget.customSettings?.["gridLabelBorderColor"],
    gridLabelBorderWidth: targetWidget.customSettings?.["gridLabelBorderWidth"],
    gridLabelBorderRadius:
      targetWidget.customSettings?.["gridLabelBorderRadius"],
  };
  const existingBounds =
    comp.activeGridSession && comp.activeGridSession.gridId === gridId
      ? comp.activeGridSession.bounds
      : LaneGridReplicationHelper.calculateGridBounds(layout.widgets, gridId);

  layout.widgets = LaneGridReplicationHelper.updateGridLabel(
    layout.widgets,
    gridId,
    labelConfig,
    existingBounds,
  );
  if (comp.activeGridSession && comp.activeGridSession.gridId === gridId) {
    Object.assign(comp.activeGridSession, labelConfig);
  }
}

function handleGridModeStructureChanges(
  comp: any,
  layout: any,
  targetWidget: any,
  gridId: string,
): void {
  if (targetWidget.customSettings?.["_gridTypeChanged"]) {
    delete targetWidget.customSettings["_gridTypeChanged"];
    const gridType = targetWidget.customSettings?.["gridType"] || "heat";
    layout.widgets = LaneGridReplicationHelper.updateGridType(
      layout.widgets,
      gridId,
      gridType,
    );
    if (comp.activeGridSession && comp.activeGridSession.gridId === gridId) {
      comp.activeGridSession.gridType = gridType;
    }
  }

  if (targetWidget.customSettings?.["_gridEmptyRowsModeChanged"]) {
    delete targetWidget.customSettings["_gridEmptyRowsModeChanged"];
    const mode = targetWidget.customSettings?.["emptyRowsMode"] || "remove";
    layout.widgets = LaneGridReplicationHelper.updateGridEmptyRowsMode(
      layout.widgets,
      gridId,
      mode,
    );
    if (comp.activeGridSession && comp.activeGridSession.gridId === gridId) {
      comp.activeGridSession.emptyRowsMode = mode;
    }
  }

  if (targetWidget.customSettings?.["_sortByBindingModeChanged"]) {
    delete targetWidget.customSettings["_sortByBindingModeChanged"];
    const sort = targetWidget.customSettings?.["sortByBindingMode"] !== false;
    layout.widgets = LaneGridReplicationHelper.updateGridSortByBindingMode(
      layout.widgets,
      gridId,
      sort,
    );
    if (comp.activeGridSession && comp.activeGridSession.gridId === gridId) {
      comp.activeGridSession.sortByBindingMode = sort;
    }
  }
}

export function handleGridColumnStructureChanges(
  comp: any,
  layout: any,
  targetWidget: any,
  gridId: string,
): void {
  if (targetWidget.customSettings?.["_linkColumnsChanged"]) {
    delete targetWidget.customSettings["_linkColumnsChanged"];
    const isLinked = targetWidget.customSettings?.["linkColumns"] !== false;
    layout.widgets = LaneGridReplicationHelper.updateGridLinkColumns(
      layout.widgets,
      gridId,
      isLinked,
    );
    if (comp.activeGridSession && comp.activeGridSession.gridId === gridId) {
      comp.activeGridSession.linkColumns = isLinked;
    }
  }

  if (targetWidget.customSettings?.["_mirrorRowsChanged"]) {
    delete targetWidget.customSettings["_mirrorRowsChanged"];
    const isMirrored = targetWidget.customSettings?.["mirrorRows"] !== false;
    for (const w of layout.widgets) {
      if (w.customSettings?.["gridId"] === gridId) {
        if (!w.customSettings) w.customSettings = {};
        w.customSettings["mirrorRows"] = isMirrored;
      }
    }
    if (comp.activeGridSession && comp.activeGridSession.gridId === gridId) {
      comp.activeGridSession.mirrorRows = isMirrored;
    }
  }

  if (targetWidget.customSettings?.["_gridSortOrderChanged"]) {
    delete targetWidget.customSettings["_gridSortOrderChanged"];
    const sortOrder = targetWidget.customSettings?.["bindingMode"] || "lane";
    layout.widgets = LaneGridReplicationHelper.updateGridSortOrder(
      layout.widgets,
      gridId,
      sortOrder,
    );
    if (comp.activeGridSession && comp.activeGridSession.gridId === gridId) {
      comp.activeGridSession.bindingMode = sortOrder;
    }
  }

  handleGridModeStructureChanges(comp, layout, targetWidget, gridId);

  if (targetWidget.customSettings?.["_layoutOrientationChanged"]) {
    delete targetWidget.customSettings["_layoutOrientationChanged"];
    const orientation =
      targetWidget.customSettings?.["layoutOrientation"] || "vertical";
    layout.widgets = LaneGridReplicationHelper.updateGridLayoutOrientation(
      layout.widgets,
      gridId,
      orientation,
    );
    if (comp.activeGridSession && comp.activeGridSession.gridId === gridId) {
      comp.activeGridSession.layoutOrientation = orientation;
      comp.activeGridSession.direction = orientation;
    }
  }

  if (targetWidget.customSettings?.["_gridTotalLanesChanged"]) {
    handleGridTotalLanesStructureChange(comp, layout, targetWidget, gridId);
  }

  if (targetWidget.customSettings?.["_gridLabelChanged"]) {
    handleGridLabelStructureChange(comp, layout, targetWidget, gridId);
  }
}

export function handleGridStructureChanges(
  comp: any,
  layout: any,
  targetWidget: any,
  gridId: string,
): void {
  handleGridHeaderStructureChanges(comp, layout, targetWidget, gridId);
  handleGridColumnStructureChanges(comp, layout, targetWidget, gridId);
}

export function handleCrossColumnLiveSync(
  layout: any,
  targetWidget: any,
  gridId: string,
): void {
  if (
    targetWidget.customSettings?.["linkColumns"] === false &&
    targetWidget.customSettings?.["mirrorRows"] === false
  ) {
    return;
  }

  if (targetWidget.customSettings?.["isHeaderWidget"]) {
    layout.widgets = LaneGridReplicationHelper.syncCrossColumnProperty(
      gridId,
      "header",
      targetWidget.customSettings,
      layout.widgets,
      targetWidget.id,
      targetWidget.scaleMode,
    );
    layout.widgets = LaneGridReplicationHelper.syncCrossColumnProperty(
      gridId,
      "border",
      targetWidget.customSettings,
      layout.widgets,
      targetWidget.id,
      targetWidget.scaleMode,
    );
  } else {
    layout.widgets = LaneGridReplicationHelper.syncCrossColumnProperty(
      gridId,
      "value",
      targetWidget.customSettings,
      layout.widgets,
      targetWidget.id,
      targetWidget.scaleMode,
    );
    layout.widgets = LaneGridReplicationHelper.syncCrossColumnProperty(
      gridId,
      "border",
      targetWidget.customSettings,
      layout.widgets,
      targetWidget.id,
      targetWidget.scaleMode,
    );
    layout.widgets = LaneGridReplicationHelper.syncCrossColumnProperty(
      gridId,
      "highlight",
      targetWidget.customSettings,
      layout.widgets,
      targetWidget.id,
      targetWidget.scaleMode,
    );
    layout.widgets = LaneGridReplicationHelper.syncCrossColumnProperty(
      gridId,
      "header",
      targetWidget.customSettings,
      layout.widgets,
      targetWidget.id,
      targetWidget.scaleMode,
    );
  }
}

export function handleGridSessionWidgetSync(
  comp: any,
  layout: any,
  targetWidget: any,
): void {
  if (
    comp.activeGridSession &&
    LaneGridReplicationHelper.isMasterWidget(
      targetWidget,
      comp.activeGridSession,
    )
  ) {
    LaneGridReplicationHelper.updateWidgetCellRatios(
      targetWidget,
      comp.activeGridSession,
    );
    const isHoriz =
      comp.activeGridSession.direction === "horizontal" ||
      comp.activeGridSession.layoutOrientation === "horizontal" ||
      targetWidget.customSettings?.["gridDirection"] === "horizontal" ||
      targetWidget.customSettings?.["layoutOrientation"] === "horizontal";
    const isLanesMirrored = isHoriz
      ? targetWidget.customSettings?.["linkColumns"] !== false
      : targetWidget.customSettings?.["mirrorRows"] !== false;
    if (isLanesMirrored) {
      layout.widgets = LaneGridReplicationHelper.syncMasterWidgetToLanes(
        targetWidget,
        comp.activeGridSession,
        layout.widgets,
      );
    } else {
      const headerHeight =
        comp.activeGridSession.headerHeight != null
          ? Math.max(20, comp.activeGridSession.headerHeight)
          : 36;
      LaneGridHeaderHelper.syncPlacementHeaderWidget(
        targetWidget,
        targetWidget,
        comp.activeGridSession,
        headerHeight,
        layout.widgets,
      );
    }
  } else if (
    comp.activeGridSession &&
    targetWidget.customSettings?.["isHeaderWidget"]
  ) {
    const masterId = targetWidget.customSettings?.["gridMasterId"];
    const masterWidget = masterId
      ? layout.widgets.find((w: any) => w.id === masterId)
      : null;
    if (masterWidget) {
      const isHoriz =
        comp.activeGridSession.direction === "horizontal" ||
        comp.activeGridSession.layoutOrientation === "horizontal" ||
        targetWidget.customSettings?.["gridDirection"] === "horizontal" ||
        targetWidget.customSettings?.["layoutOrientation"] === "horizontal";
      if (isHoriz) {
        masterWidget.y = targetWidget.y;
        masterWidget.height = targetWidget.height;
      } else {
        masterWidget.x = targetWidget.x;
        masterWidget.width = targetWidget.width;
      }
      LaneGridReplicationHelper.updateWidgetCellRatios(
        masterWidget,
        comp.activeGridSession,
      );
      const isMasterLanesMirrored = isHoriz
        ? masterWidget.customSettings?.["linkColumns"] !== false
        : masterWidget.customSettings?.["mirrorRows"] !== false;
      if (isMasterLanesMirrored) {
        layout.widgets = LaneGridReplicationHelper.syncMasterWidgetToLanes(
          masterWidget,
          comp.activeGridSession,
          layout.widgets,
        );
      } else {
        const headerHeight =
          comp.activeGridSession.headerHeight != null
            ? Math.max(20, comp.activeGridSession.headerHeight)
            : 36;
        LaneGridHeaderHelper.syncPlacementHeaderWidget(
          masterWidget,
          masterWidget,
          comp.activeGridSession,
          headerHeight,
          layout.widgets,
        );
      }
    }
  }
}

export function handleCustomLabelSync(
  layout: any,
  targetWidget: any,
  gridId: string,
): void {
  if (targetWidget.customSettings?.["customLabel"] !== undefined) {
    const masterId =
      targetWidget.customSettings?.["gridMasterId"] || targetWidget.id;
    for (const w of layout.widgets) {
      if (
        w.customSettings?.["gridId"] === gridId &&
        (w.id === masterId || w.customSettings?.["gridMasterId"] === masterId)
      ) {
        if (!w.customSettings) w.customSettings = {};
        w.customSettings["customLabel"] =
          targetWidget.customSettings["customLabel"];
      }
    }
  }
}

export function handleGridWidgetInspectorSync(
  comp: any,
  layout: any,
  targetWidget: any,
  gridId: string,
): void {
  handleGridBindingModeSync(comp, layout, targetWidget, gridId);
  handleGridSyncAction(layout, targetWidget, gridId);
  handleGridStructureChanges(comp, layout, targetWidget, gridId);
  handleGridSessionWidgetSync(comp, layout, targetWidget);
  handleCrossColumnLiveSync(layout, targetWidget, gridId);
  handleCustomLabelSync(layout, targetWidget, gridId);

  if (targetWidget.customSettings) {
    for (const k of Object.keys(targetWidget.customSettings)) {
      if (k.startsWith("_reset_")) {
        delete targetWidget.customSettings[k];
      }
    }
  }
}
