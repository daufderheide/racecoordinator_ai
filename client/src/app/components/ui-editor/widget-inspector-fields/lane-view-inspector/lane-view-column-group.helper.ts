export interface LaneViewColumnGroup {
  id: string;
  nameKey: string;
  columns: { key: string; label: string }[];
  expanded: boolean;
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
      "rankHeat",
      "rankOverall",
      "rankGroup",
    ],
  },
  {
    id: "lap-times",
    nameKey: "UE_COL_GROUP_LAP_TIMES",
    columnKeys: [
      "lastLapTime",
      "lastLaps",
      "bestLapTime",
      "bestRaceLapTime",
      "recordLapTime",
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

  static buildColumnGroups(
    unusedColumns: { key: string; label: string }[],
    searchTerm: string,
    expandedStates: Map<string, boolean> | Record<string, boolean>,
    translateFn: (key: string) => string,
  ): LaneViewColumnGroup[] {
    const term = searchTerm ? searchTerm.trim().toLowerCase() : "";
    const groupMap = new Map<string, { key: string; label: string }[]>();

    for (const group of LANE_VIEW_COLUMN_GROUPS) {
      groupMap.set(group.id, []);
    }

    for (const col of unusedColumns) {
      const groupId = this.getGroupIdForColumn(col.key);
      const list = groupMap.get(groupId);
      if (list) {
        list.push(col);
      } else {
        groupMap.get("media-custom")?.push(col);
      }
    }

    const result: LaneViewColumnGroup[] = [];

    for (const groupDef of LANE_VIEW_COLUMN_GROUPS) {
      let cols = groupMap.get(groupDef.id) || [];

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
        let isExpanded = true;
        if (term) {
          isExpanded = true;
        } else if (expandedStates instanceof Map) {
          isExpanded = expandedStates.has(groupDef.id)
            ? expandedStates.get(groupDef.id)!
            : true;
        } else if (expandedStates && typeof expandedStates === "object") {
          isExpanded =
            expandedStates[groupDef.id] !== undefined
              ? !!expandedStates[groupDef.id]
              : true;
        }

        result.push({
          id: groupDef.id,
          nameKey: groupDef.nameKey,
          columns: cols,
          expanded: isExpanded,
        });
      }
    }

    return result;
  }
}
