import { naturalSortCompare } from "@app/utils/sorting.utils";

export interface LaneViewColumnSubgroup {
  id: string;
  nameKey: string;
  columns: { key: string; label: string }[];
  expanded: boolean;
}

export interface LaneViewColumnGroup {
  id: string;
  nameKey: string;
  columns: { key: string; label: string }[];
  subgroups: LaneViewColumnSubgroup[];
  expanded: boolean;
  totalCount: number;
}

export interface ColumnGroupDefinition {
  id: string;
  nameKey: string;
  columnKeys: readonly string[];
}

export const LANE_VIEW_COLUMN_GROUPS: readonly ColumnGroupDefinition[] = [
  {
    id: "driver-team",
    nameKey: "UE_COL_GROUP_DRIVER_TEAM",
    columnKeys: [
      "driver.name",
      "driver.nickname",
      "driver.avatarUrl",
      "participant.team.name",
      "laneNumber",
      "flag",
      "seed",
    ],
  },
  {
    id: "laps-standings",
    nameKey: "UE_COL_GROUP_LAPS_STANDINGS",
    columnKeys: [
      "lapCount",
      "physicalLapCount",
      "lapsLed",
      "trackCalls",
      "rankHeat",
    ],
  },
  {
    id: "lap-times",
    nameKey: "UE_COL_GROUP_LAP_TIMES",
    columnKeys: [
      "lastLapTime",
      "lastLaps",
      "bestLapTime",
      "segmentTime",
      "reactionTime",
      "totalTime",
    ],
  },
  {
    id: "analysis",
    nameKey: "UE_COL_GROUP_ANALYSIS",
    columnKeys: [
      "standardDeviation",
      "consistencyScore",
      "averageLapTime",
      "medianLapTime",
      "averageTop5",
      "averageTop10",
      "averageTop15",
      "top2Consecutive",
      "top3Consecutive",
    ],
  },
  {
    id: "gaps",
    nameKey: "UE_COL_GROUP_GAPS",
    columnKeys: ["gapLeader", "gapPosition", "gapLeaderF1", "gapPositionF1"],
  },
  {
    id: "overall-standings",
    nameKey: "UE_COL_GROUP_OVERALL_STANDINGS",
    columnKeys: [
      "rankOverall",
      "overallLapCount",
      "overallPhysicalLapCount",
      "rankGroup",
      "overallPoints",
      "overallLapsLed",
      "overallTrackCalls",
    ],
  },
  {
    id: "overall-lap-times",
    nameKey: "UE_COL_GROUP_OVERALL_LAP_TIMES",
    columnKeys: [
      "overallBestLapTime",
      "overallTotalTime",
      "bestRaceLapTime",
      "recordLapTime",
    ],
  },
  {
    id: "overall-analysis",
    nameKey: "UE_COL_GROUP_OVERALL_ANALYSIS",
    columnKeys: [
      "overallAverageLapTime",
      "overallMedianLapTime",
      "overallConsistencyScore",
      "overallStandardDeviation",
      "overallAverageTop5",
      "overallAverageTop10",
      "overallAverageTop15",
      "overallTop2Consecutive",
      "overallTop3Consecutive",
    ],
  },
  {
    id: "overall-gaps",
    nameKey: "UE_COL_GROUP_OVERALL_GAPS",
    columnKeys: [
      "overallGapLeader",
      "overallGapPosition",
      "overallGapLeaderF1",
      "overallGapPositionF1",
    ],
  },
  {
    id: "pacing",
    nameKey: "UE_COL_GROUP_PACING",
    columnKeys: [
      "ghostPacing",
      "ghostPacingPB",
      "ghostPacingPersonalAvg",
      "ghostPacingPersonalMedian",
      "ghostPacingLeaderAvg",
      "ghostPacingLeaderMedian",
      "ghostPacingLeaderBest",
    ],
  },
  {
    id: "telemetry",
    nameKey: "UE_COL_GROUP_TELEMETRY",
    columnKeys: [
      "participant.fuelLevel",
      "fuelCapacity",
      "fuelPercentage",
      "imageset_fuel-gauge-builtin",
      "mph",
      "kph",
      "fph",
    ],
  },
  {
    id: "predictions",
    nameKey: "UE_COL_GROUP_PREDICTIONS",
    columnKeys: ["winProbability", "projectedRank", "projectedLaps"],
  },
  {
    id: "media-custom",
    nameKey: "UE_COL_GROUP_MEDIA_CUSTOM",
    columnKeys: ["qrCode", "driverViewQrCode"],
  },
];

export class LaneViewColumnGroupHelper {
  public static readonly HEAT_DATA_GROUP_ID = "heat-data";
  public static readonly OVERALL_DATA_GROUP_ID = "overall-data";

  public static readonly HEAT_DATA_SUBGROUP_IDS: readonly string[] = [
    "driver-team",
    "laps-standings",
    "lap-times",
    "analysis",
    "gaps",
    "telemetry",
    "pacing",
    "media-custom",
  ];

  public static readonly OVERALL_DATA_SUBGROUP_IDS: readonly string[] = [
    "driver-team",
    "overall-standings",
    "overall-lap-times",
    "overall-analysis",
    "overall-gaps",
    "predictions",
    "media-custom",
  ];

  private static readonly SUBGROUP_FALLBACK_LABELS: Record<string, string> = {
    UE_TOOLBOX_GROUP_HEAT_DATA: "Heat Data",
    UE_TOOLBOX_GROUP_OVERALL_DATA: "Overall Race Data",
    UE_COL_GROUP_ANALYSIS: "Driver Analysis & Consistency",
    UE_COL_GROUP_DRIVER_TEAM: "Driver & Team",
    UE_COL_GROUP_GAPS: "Gaps & Intervals",
    UE_COL_GROUP_LAP_TIMES: "Lap Times & Records",
    UE_COL_GROUP_LAPS_STANDINGS: "Laps & Standings",
    UE_COL_GROUP_MEDIA_CUSTOM: "QR Codes & Media",
    UE_COL_GROUP_OVERALL_ANALYSIS: "Overall Analysis & Consistency",
    UE_COL_GROUP_OVERALL_GAPS: "Overall Gaps & Intervals",
    UE_COL_GROUP_OVERALL_LAP_TIMES: "Overall Lap Times & Records",
    UE_COL_GROUP_OVERALL_STANDINGS: "Overall Standings & Laps",
    UE_COL_GROUP_PACING: "Pacing",
    UE_COL_GROUP_PREDICTIONS: "Predictions",
    UE_COL_GROUP_TELEMETRY: "Telemetry, Fuel & Speed",
  };

  private static readonly KEY_TO_GROUP_ID_MAP =
    LaneViewColumnGroupHelper.createKeyToGroupIdMap();

  private static createKeyToGroupIdMap(): Map<string, string> {
    const map = new Map<string, string>();
    for (const group of LANE_VIEW_COLUMN_GROUPS) {
      for (const key of group.columnKeys) {
        map.set(key, group.id);
      }
    }
    return map;
  }

  static getGroupIdForColumn(key: string): string {
    return this.KEY_TO_GROUP_ID_MAP.get(key) || "media-custom";
  }

  private static compareSubgroups(
    a: LaneViewColumnSubgroup,
    b: LaneViewColumnSubgroup,
    translateFn?: (key: string) => string,
  ): number {
    const labelA = LaneViewColumnGroupHelper.getSubgroupDisplayLabel(
      a,
      translateFn,
    );
    const labelB = LaneViewColumnGroupHelper.getSubgroupDisplayLabel(
      b,
      translateFn,
    );
    const cmp = naturalSortCompare(labelA, labelB);
    if (cmp !== 0) return cmp;
    return naturalSortCompare(a.id, b.id);
  }

  private static getSubgroupDisplayLabel(
    sg: LaneViewColumnSubgroup,
    translateFn?: (key: string) => string,
  ): string {
    if (translateFn) {
      const translated = translateFn(sg.nameKey);
      if (translated && translated !== sg.nameKey) return translated;
    }
    return (
      LaneViewColumnGroupHelper.SUBGROUP_FALLBACK_LABELS[sg.nameKey] ||
      sg.nameKey ||
      sg.id
    );
  }

  private static isSubgroupExpanded(
    expandedStates: Map<string, boolean> | Record<string, boolean> | undefined,
    sgId: string,
    rawGroupId: string,
    term: string,
  ): boolean {
    if (term) return true;
    if (!expandedStates) return false;
    if (expandedStates instanceof Map) {
      if (expandedStates.has(sgId)) return !!expandedStates.get(sgId);
      if (expandedStates.has(rawGroupId))
        return !!expandedStates.get(rawGroupId);
      return false;
    }
    if (typeof expandedStates === "object") {
      if (expandedStates[sgId] !== undefined) return !!expandedStates[sgId];
      if (expandedStates[rawGroupId] !== undefined)
        return !!expandedStates[rawGroupId];
      return false;
    }
    return false;
  }

  private static isGroupExpanded(
    expandedStates: Map<string, boolean> | Record<string, boolean> | undefined,
    groupId: string,
    term: string,
  ): boolean {
    if (term) return true;
    if (!expandedStates) return true;
    if (expandedStates instanceof Map) {
      return expandedStates.has(groupId) ? !!expandedStates.get(groupId) : true;
    }
    if (typeof expandedStates === "object") {
      return expandedStates[groupId] !== undefined
        ? !!expandedStates[groupId]
        : true;
    }
    return true;
  }

  private static buildScopedGroup(
    groupId: string,
    nameKey: string,
    subgroupDefIds: readonly string[],
    unusedColumns: { key: string; label: string }[],
    searchTerm: string,
    expandedStates: Map<string, boolean> | Record<string, boolean>,
    translateFn: (key: string) => string,
  ): LaneViewColumnGroup | null {
    const term = searchTerm ? searchTerm.trim().toLowerCase() : "";
    const subgroups: LaneViewColumnSubgroup[] = [];

    const unusedMap = new Map<string, { key: string; label: string }>();
    for (const col of unusedColumns) {
      unusedMap.set(col.key, col);
    }

    for (const subgroupId of subgroupDefIds) {
      const groupDef = LANE_VIEW_COLUMN_GROUPS.find((g) => g.id === subgroupId);
      if (!groupDef) continue;

      let cols: { key: string; label: string }[] = [];
      if (subgroupId === "media-custom") {
        for (const key of groupDef.columnKeys) {
          const col = unusedMap.get(key);
          if (col) cols.push(col);
        }
        for (const col of unusedColumns) {
          if (
            (col.key.startsWith("imageset_") ||
              LaneViewColumnGroupHelper.getGroupIdForColumn(col.key) ===
                "media-custom") &&
            !groupDef.columnKeys.includes(col.key) &&
            !cols.some((c) => c.key === col.key)
          ) {
            cols.push(col);
          }
        }
      } else {
        for (const key of groupDef.columnKeys) {
          const col = unusedMap.get(key);
          if (col) cols.push(col);
        }
      }

      if (term) {
        cols = cols.filter((col) => {
          const translated = translateFn(col.label).toLowerCase();
          const rawLabel = col.label.toLowerCase();
          const key = col.key.toLowerCase();
          return (
            translated.includes(term) ||
            rawLabel.includes(term) ||
            key.includes(term)
          );
        });
      }

      if (cols.length > 0) {
        const sgId = `${groupId}-sg-${groupDef.id}`;
        const isSgExpanded = LaneViewColumnGroupHelper.isSubgroupExpanded(
          expandedStates,
          sgId,
          groupDef.id,
          term,
        );

        subgroups.push({
          id: sgId,
          nameKey: groupDef.nameKey,
          columns: cols,
          expanded: isSgExpanded,
        });
      }
    }

    subgroups.sort((a, b) =>
      LaneViewColumnGroupHelper.compareSubgroups(a, b, translateFn),
    );

    if (subgroups.length === 0) {
      return null;
    }

    const totalCount = subgroups.reduce(
      (sum, sg) => sum + sg.columns.length,
      0,
    );

    const isGroupExpanded = LaneViewColumnGroupHelper.isGroupExpanded(
      expandedStates,
      groupId,
      term,
    );

    return {
      id: groupId,
      nameKey: nameKey,
      columns: [],
      subgroups: subgroups,
      expanded: isGroupExpanded,
      totalCount: totalCount,
    };
  }

  static buildColumnGroups(
    unusedColumns: { key: string; label: string }[],
    searchTerm: string,
    expandedStates: Map<string, boolean> | Record<string, boolean>,
    translateFn: (key: string) => string,
  ): LaneViewColumnGroup[] {
    const heatDataGroup = LaneViewColumnGroupHelper.buildScopedGroup(
      LaneViewColumnGroupHelper.HEAT_DATA_GROUP_ID,
      "UE_TOOLBOX_GROUP_HEAT_DATA",
      LaneViewColumnGroupHelper.HEAT_DATA_SUBGROUP_IDS,
      unusedColumns,
      searchTerm,
      expandedStates,
      translateFn,
    );

    const overallDataGroup = LaneViewColumnGroupHelper.buildScopedGroup(
      LaneViewColumnGroupHelper.OVERALL_DATA_GROUP_ID,
      "UE_TOOLBOX_GROUP_OVERALL_DATA",
      LaneViewColumnGroupHelper.OVERALL_DATA_SUBGROUP_IDS,
      unusedColumns,
      searchTerm,
      expandedStates,
      translateFn,
    );

    const result: LaneViewColumnGroup[] = [];
    if (heatDataGroup) result.push(heatDataGroup);
    if (overallDataGroup) result.push(overallDataGroup);
    return result;
  }
}
