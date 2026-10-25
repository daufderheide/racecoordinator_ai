import { AbsoluteWidgetNode, LayoutConfig } from "@app/models/settings";
import { deepCopy } from "@app/utils/clone.utils";

import { LaneGridCleanupHelper } from "./lane-grid-cleanup.helper";
import {
  LaneGridReplicationHelper,
  LaneGridSession,
} from "./lane-grid-replication.helper";

export interface StackedColumnIssue {
  id: string;
  columnKey: string;
  columnLabel: string;
  laneIndex: number;
  laneDisplay: string;
  isHeader: boolean;
  gridId?: string;
  primaryWidget: AbsoluteWidgetNode;
  duplicateWidgets: AbsoluteWidgetNode[];
  hasInsetsToMerge: boolean;
  insetsToMerge: Record<string, string>;
}

export interface StackedColumnDetectionResult {
  hasIssues: boolean;
  issues: StackedColumnIssue[];
  totalDuplicatesCount: number;
}

export interface StackedColumnRepairResult {
  layout: LayoutConfig;
  repairedCount: number;
  mergedInsetsCount: number;
}

export class LaneGridRepairHelper {
  /**
   * Detects duplicate or stacked lane columns and widgets in a layout.
   */
  public static detectStackedColumns(
    layout: LayoutConfig | null | undefined,
    availableColumns?: Array<{ key: string; label: string }>,
  ): StackedColumnDetectionResult {
    if (!layout?.widgets || layout.widgets.length === 0) {
      return { hasIssues: false, issues: [], totalDuplicatesCount: 0 };
    }

    const widgets = layout.widgets;
    const visitedIds = new Set<string>();

    const grouped = this.buildColumnGroupMap(widgets);
    const issues = this.detectGroupIssues(
      grouped,
      visitedIds,
      availableColumns,
    );
    const nestedIssues = this.detectNestedLineageIssues(
      widgets,
      visitedIds,
      availableColumns,
    );
    issues.push(...nestedIssues);

    let totalDuplicates = 0;
    for (const issue of issues) {
      totalDuplicates += issue.duplicateWidgets.length;
    }

    return {
      hasIssues: issues.length > 0,
      issues,
      totalDuplicatesCount: totalDuplicates,
    };
  }

  private static buildColumnGroupMap(
    widgets: AbsoluteWidgetNode[],
  ): Map<string, AbsoluteWidgetNode[]> {
    const columnWidgets = widgets.filter(
      (w) => w.widgetType === "lane-column" || w.customSettings?.["columnKey"],
    );
    const grouped = new Map<string, AbsoluteWidgetNode[]>();

    for (const w of columnWidgets) {
      const gridId = w.customSettings?.["gridId"] || "__standalone__";
      const colKey = w.customSettings?.["columnKey"] || "default";
      const isHeader = Boolean(
        w.customSettings?.["isHeaderWidget"] || w.id.endsWith("_grid_header"),
      );
      const lane = Number(
        w.customSettings?.["gridLane"] ??
          w.customSettings?.["targetIndex"] ??
          0,
      );

      const gapSuffix =
        colKey === "gap" || colKey === "overallGap"
          ? `::${w.customSettings?.["gapTarget"] || "leader"}::${w.customSettings?.["gapMode"] || "always_time"}`
          : "";
      const groupKey = `${gridId}::${colKey}${gapSuffix}::${isHeader}::${lane}`;
      if (!grouped.has(groupKey)) {
        grouped.set(groupKey, []);
      }
      grouped.get(groupKey)!.push(w);
    }

    return grouped;
  }

  private static detectGroupIssues(
    grouped: Map<string, AbsoluteWidgetNode[]>,
    visitedIds: Set<string>,
    availableColumns?: Array<{ key: string; label: string }>,
  ): StackedColumnIssue[] {
    const issues: StackedColumnIssue[] = [];

    for (const [groupKey, groupWidgets] of grouped.entries()) {
      if (groupWidgets.length <= 1) continue;

      const clusters = this.clusterOverlappingWidgets(groupWidgets);
      for (const cluster of clusters) {
        if (cluster.length <= 1) continue;

        const primary = this.resolvePrimaryWidget(cluster);
        const duplicates = cluster.filter((w) => w.id !== primary.id);
        for (const d of duplicates) {
          visitedIds.add(d.id);
        }

        const insetsToMerge = this.findInsetsToMerge(primary, duplicates);
        const parts = groupKey.split("::");
        const gridId = parts[0];
        const columnKey = parts[1];
        const isHeaderStr = parts[parts.length - 2];
        const laneStr = parts[parts.length - 1];
        const isHeader = isHeaderStr === "true";
        const laneIndex = Number(laneStr);

        issues.push({
          id: `issue_${primary.id}`,
          columnKey,
          columnLabel: this.resolveColumnLabel(
            columnKey,
            primary,
            availableColumns,
          ),
          laneIndex,
          laneDisplay: isHeader ? "Header" : `Lane ${laneIndex + 1}`,
          isHeader,
          gridId: gridId === "__standalone__" ? undefined : gridId,
          primaryWidget: primary,
          duplicateWidgets: duplicates,
          hasInsetsToMerge: Object.keys(insetsToMerge).length > 0,
          insetsToMerge,
        });
      }
    }

    return issues;
  }

  private static detectNestedLineageIssues(
    widgets: AbsoluteWidgetNode[],
    visitedIds: Set<string>,
    availableColumns?: Array<{ key: string; label: string }>,
  ): StackedColumnIssue[] {
    const nestedIssues: StackedColumnIssue[] = [];
    const nestedDuplicates = widgets.filter((w) => {
      if (visitedIds.has(w.id)) return false;
      return Boolean(w.id.match(/_grid_lane_\d+_grid_lane_\d+/));
    });

    for (const nested of nestedDuplicates) {
      visitedIds.add(nested.id);
      const colKey = nested.customSettings?.["columnKey"] || "column";
      const lane = Number(
        nested.customSettings?.["gridLane"] ??
          nested.customSettings?.["targetIndex"] ??
          0,
      );
      nestedIssues.push({
        id: `issue_nested_${nested.id}`,
        columnKey: colKey,
        columnLabel: this.resolveColumnLabel(colKey, nested, availableColumns),
        laneIndex: lane,
        laneDisplay: `Lane ${lane + 1}`,
        isHeader: false,
        gridId: nested.customSettings?.["gridId"],
        primaryWidget: nested,
        duplicateWidgets: [nested],
        hasInsetsToMerge: false,
        insetsToMerge: {},
      });
    }

    return nestedIssues;
  }

  /**
   * Safely repairs stacked/duplicate columns by merging insets onto the primary widget
   * and deleting redundant clone widgets.
   */
  public static repairStackedColumns(
    layout: LayoutConfig,
    session?: LaneGridSession | null,
    availableColumns?: Array<{ key: string; label: string }>,
  ): StackedColumnRepairResult {
    if (!layout?.widgets || layout.widgets.length === 0) {
      return { layout, repairedCount: 0, mergedInsetsCount: 0 };
    }

    const detection = this.detectStackedColumns(layout, availableColumns);
    if (!detection.hasIssues) {
      return { layout, repairedCount: 0, mergedInsetsCount: 0 };
    }

    const workingLayout = deepCopy(layout);
    let workingWidgets = workingLayout.widgets;
    const idsToRemove = new Set<string>();
    let mergedInsetsTotal = 0;

    for (const issue of detection.issues) {
      const primaryInLayout = workingWidgets.find(
        (w: AbsoluteWidgetNode) => w.id === issue.primaryWidget.id,
      );

      if (primaryInLayout && issue.hasInsetsToMerge) {
        if (!primaryInLayout.customSettings) {
          primaryInLayout.customSettings = {};
        }
        if (!primaryInLayout.customSettings["insets"]) {
          primaryInLayout.customSettings["insets"] = {};
        }

        for (const [anchor, key] of Object.entries(issue.insetsToMerge)) {
          primaryInLayout.customSettings["insets"][anchor] = key;
          mergedInsetsTotal++;
        }
      }

      for (const dup of issue.duplicateWidgets) {
        idsToRemove.add(dup.id);
        for (const w of workingWidgets) {
          if (
            w.customSettings?.["gridMasterId"] === dup.id ||
            w.id.startsWith(`${dup.id}_grid_lane_`) ||
            w.id === `${dup.id}_grid_header`
          ) {
            idsToRemove.add(w.id);
          }
        }
      }
    }

    workingWidgets = workingWidgets.filter(
      (w: AbsoluteWidgetNode) => !idsToRemove.has(w.id),
    );

    const gridIdsToSync = new Set<string>();
    if (session?.gridId) {
      gridIdsToSync.add(session.gridId);
    }
    for (const issue of detection.issues) {
      if (issue.gridId) {
        gridIdsToSync.add(issue.gridId);
      }
      const pGridId = issue.primaryWidget?.customSettings?.["gridId"];
      if (pGridId) {
        gridIdsToSync.add(pGridId);
      }
    }
    for (const w of workingWidgets) {
      const gId = w.customSettings?.["gridId"];
      if (gId) {
        gridIdsToSync.add(gId);
      }
    }

    for (const gridId of gridIdsToSync) {
      const gridSession =
        session?.gridId === gridId
          ? session
          : this.buildSessionForGrid(gridId, workingWidgets);
      const isHorizontal =
        gridSession?.direction === "horizontal" ||
        gridSession?.layoutOrientation === "horizontal";
      const isLanesMirrored = isHorizontal
        ? gridSession?.linkColumns !== false
        : gridSession?.mirrorRows !== false;
      if (gridSession && isLanesMirrored) {
        workingWidgets = LaneGridReplicationHelper.syncAllMasterWidgetsToLanes(
          gridSession,
          workingWidgets,
        );
      }
    }

    workingWidgets =
      LaneGridCleanupHelper.cleanOrphanedGridWidgets(workingWidgets);
    workingLayout.widgets = workingWidgets;

    return {
      layout: workingLayout,
      repairedCount: idsToRemove.size,
      mergedInsetsCount: mergedInsetsTotal,
    };
  }

  public static buildSessionForGrid(
    gridId: string,
    widgets: AbsoluteWidgetNode[],
  ): LaneGridSession | null {
    const gridWidgets = (widgets || []).filter(
      (w) => w.customSettings?.["gridId"] === gridId,
    );
    if (gridWidgets.length === 0) return null;

    const bounds = LaneGridReplicationHelper.calculateGridBounds(
      widgets,
      gridId,
    );
    if (!bounds) return null;

    const first = gridWidgets[0];
    const explicitTotalLanes = Number(
      gridWidgets.find((w) => w.customSettings?.["gridTotalLanes"] != null)
        ?.customSettings?.["gridTotalLanes"] ??
        first.customSettings?.["gridTotalLanes"],
    );
    const existingLanes = gridWidgets.map((w) =>
      Number(
        w.customSettings?.["gridLane"] ??
          w.customSettings?.["targetIndex"] ??
          0,
      ),
    );
    const maxExistingLane =
      existingLanes.length > 0 ? Math.max(...existingLanes, 0) : 0;
    const totalLanes =
      explicitTotalLanes > 0 ? explicitTotalLanes : maxExistingLane + 1;
    const direction =
      (first.customSettings?.["gridDirection"] as any) || "vertical";
    const headerPlacement =
      (first.customSettings?.["headerPlacement"] as any) || "individual";
    const headerHeight = Number(first.customSettings?.["headerHeight"]) || 36;
    const positionWidget = gridWidgets.find(
      (w) => w.customSettings?.["bindingMode"] === "position",
    );
    const bindingMode = positionWidget
      ? "position"
      : (first.customSettings?.["bindingMode"] as any) || "lane";
    const anyOverall = gridWidgets.some(
      (w) => w.customSettings?.["gridType"] === "overall",
    );
    const anyHeat = gridWidgets.some(
      (w) => w.customSettings?.["gridType"] === "heat",
    );
    const anyLegacyOverall = gridWidgets.some(
      (w) =>
        !w.customSettings?.["gridType"] &&
        w.customSettings?.["bindingMode"] === "overallPosition",
    );
    let gridType: "heat" | "overall";
    if (anyOverall) {
      gridType = "overall";
    } else if (anyHeat) {
      gridType = "heat";
    } else if (anyLegacyOverall) {
      gridType = "overall";
    } else {
      gridType = (first.customSettings?.["gridType"] as any) || "heat";
    }
    const linkColumns = first.customSettings?.["linkColumns"] !== false;
    const mirrorRows = first.customSettings?.["mirrorRows"] !== false;

    return {
      gridId,
      bounds,
      totalLanes,
      direction,
      sourceLaneIndex: 0,
      gridType,
      bindingMode,
      headerPlacement,
      headerHeight,
      linkColumns,
      mirrorRows,
      layoutOrientation:
        first.customSettings?.["layoutOrientation"] || "vertical",
      gridLabelPosition: first.customSettings?.["gridLabelPosition"] || "none",
      gridLabelText: first.customSettings?.["gridLabelText"] || "",
      gridLabelSize:
        first.customSettings?.["gridLabelSize"] != null
          ? Number(first.customSettings["gridLabelSize"])
          : 40,
    };
  }

  private static clusterOverlappingWidgets(
    widgets: AbsoluteWidgetNode[],
  ): AbsoluteWidgetNode[][] {
    const clusters: AbsoluteWidgetNode[][] = [];
    const assigned = new Set<string>();

    for (let i = 0; i < widgets.length; i++) {
      const w1 = widgets[i];
      if (assigned.has(w1.id)) continue;

      const cluster: AbsoluteWidgetNode[] = [w1];
      assigned.add(w1.id);

      for (let j = i + 1; j < widgets.length; j++) {
        const w2 = widgets[j];
        if (assigned.has(w2.id)) continue;

        if (this.areWidgetsOverlappingOrDuplicate(w1, w2)) {
          cluster.push(w2);
          assigned.add(w2.id);
        }
      }

      clusters.push(cluster);
    }

    return clusters;
  }

  private static areWidgetsOverlappingOrDuplicate(
    w1: AbsoluteWidgetNode,
    w2: AbsoluteWidgetNode,
  ): boolean {
    if (
      w2.id.startsWith(`${w1.id}_grid_`) ||
      w1.id.startsWith(`${w2.id}_grid_`) ||
      w1.customSettings?.["gridMasterId"] === w2.id ||
      w2.customSettings?.["gridMasterId"] === w1.id
    ) {
      return true;
    }

    const dx = Math.abs((w1.x || 0) - (w2.x || 0));
    const dy = Math.abs((w1.y || 0) - (w2.y || 0));
    if (dx <= 10 && dy <= 10) {
      return true;
    }

    const xOverlap = Math.max(
      0,
      Math.min((w1.x || 0) + (w1.width || 0), (w2.x || 0) + (w2.width || 0)) -
        Math.max(w1.x || 0, w2.x || 0),
    );
    const yOverlap = Math.max(
      0,
      Math.min((w1.y || 0) + (w1.height || 0), (w2.y || 0) + (w2.height || 0)) -
        Math.max(w1.y || 0, w2.y || 0),
    );
    const intersectionArea = xOverlap * yOverlap;

    const area1 = (w1.width || 0) * (w1.height || 0);
    const area2 = (w2.width || 0) * (w2.height || 0);
    const minArea = Math.min(area1, area2);

    if (minArea > 0 && intersectionArea / minArea >= 0.7) {
      return true;
    }

    return false;
  }

  private static resolvePrimaryWidget(
    cluster: AbsoluteWidgetNode[],
  ): AbsoluteWidgetNode {
    let best = cluster[0];
    let bestScore = this.scorePrimaryCandidate(best);

    for (let i = 1; i < cluster.length; i++) {
      const candidate = cluster[i];
      const score = this.scorePrimaryCandidate(candidate);
      if (score > bestScore) {
        best = candidate;
        bestScore = score;
      }
    }

    return best;
  }

  private static scorePrimaryCandidate(w: AbsoluteWidgetNode): number {
    let score = 0;

    if (!w.id.includes("_grid_lane_")) {
      score += 50;
    }

    const gridSegments = (w.id.match(/_grid_/g) || []).length;
    score -= gridSegments * 15;

    const insets = w.customSettings?.["insets"];
    if (
      insets &&
      typeof insets === "object" &&
      Object.keys(insets).length > 0
    ) {
      score += 10;
    }

    if (
      w.customSettings?.["textColor"] ||
      w.customSettings?.["backgroundColor"]
    ) {
      score += 5;
    }

    return score;
  }

  private static findInsetsToMerge(
    primary: AbsoluteWidgetNode,
    duplicates: AbsoluteWidgetNode[],
  ): Record<string, string> {
    const toMerge: Record<string, string> = {};
    const primaryInsets =
      (primary.customSettings?.["insets"] as Record<string, string>) || {};

    for (const dup of duplicates) {
      const dupInsets =
        (dup.customSettings?.["insets"] as Record<string, string>) || {};
      for (const [anchor, key] of Object.entries(dupInsets)) {
        if (!key) continue;
        if (!primaryInsets[anchor] && !toMerge[anchor]) {
          toMerge[anchor] = key;
        }
      }
    }

    return toMerge;
  }

  private static resolveColumnLabel(
    columnKey: string,
    widget: AbsoluteWidgetNode,
    availableColumns?: Array<{ key: string; label: string }>,
  ): string {
    if (availableColumns) {
      const match = availableColumns.find((c) => c.key === columnKey);
      if (match?.label) return match.label;
    }

    if (widget.customSettings?.["columnLabel"]) {
      return String(widget.customSettings["columnLabel"]);
    }

    switch (columnKey) {
      case "driver.name":
        return "RD_COL_NAME";
      case "driver.nickname":
        return "RD_COL_NICKNAME";
      case "driver.avatarUrl":
        return "RD_COL_AVATAR";
      case "bestLapTime":
        return "UI_EDITOR_COL_HEAT_BEST_LAP";
      case "lastLapTime":
        return "RD_COL_LAP_TIME";
      case "lapCount":
        return "UI_EDITOR_COL_HEAT_LAPS";
      case "physicalLapCount":
        return "UI_EDITOR_COL_HEAT_RAW_LAPS";
      case "gap":
      case "gapLeader":
        return "UI_EDITOR_COL_HEAT_GAP_LEADER";
      case "gapPosition":
        return "UI_EDITOR_COL_HEAT_GAP_POSITION";
      case "position":
      case "rankHeat":
        return "RD_COL_RANK_HEAT";
      default:
        return columnKey
          .replace(/[._]/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
    }
  }
}
