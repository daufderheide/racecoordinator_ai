import { TranslationService } from "@app/services/translation.service";

export interface LaneEqualityReportItem {
  key: string;
  params?: any;
}

export interface LaneEqualityResult {
  allEqual: boolean;
  reports: LaneEqualityReportItem[];
}

export function checkLaneEquality(
  numLanes: number,
  driverIds: string[],
  heats: (string | null)[][],
  driverNames?: Map<string, string>,
  translationService?: TranslationService,
): LaneEqualityResult {
  const numDrivers = driverIds.length;
  const numHeats = heats.length;

  if (numDrivers <= 0 || numHeats === 0) {
    return {
      allEqual: false,
      reports: [{ key: "AM_REPORT_NO_DRIVERS" }],
    };
  }

  const { driverLaneCounts, laneTotals, reports, initialAllEqual } =
    populateLaneCounts(numLanes, driverIds, heats, driverNames);

  const { allEqual, finalReports } = checkDiffsAndBuildReports(
    numLanes,
    driverIds,
    driverLaneCounts,
    laneTotals,
    driverNames,
    translationService,
    reports,
    initialAllEqual,
  );

  if (allEqual && finalReports.length === 0) {
    return {
      allEqual: true,
      reports: [{ key: "AM_REPORT_ALL_EQUAL" }],
    };
  }

  return {
    allEqual,
    reports: finalReports,
  };
}

function populateLaneCounts(
  numLanes: number,
  driverIds: string[],
  heats: (string | null)[][],
  driverNames?: Map<string, string>,
) {
  const driverLaneCounts = new Map<string, number[]>();
  const laneTotals = new Array(numLanes).fill(0);
  const reports: LaneEqualityReportItem[] = [];
  let initialAllEqual = true;

  for (const dId of driverIds) {
    driverLaneCounts.set(dId, new Array(numLanes).fill(0));
  }

  const driverIdSet = new Set(driverIds);

  heats.forEach((heat, hIdx) => {
    const isHeatEmpty = heat.every((dId) => !dId || dId === "EMPTY_LANE");
    if (isHeatEmpty) {
      initialAllEqual = false;
      reports.push({
        key: "AM_REPORT_EMPTY_HEAT",
        params: { heat: hIdx + 1 },
      });
    }

    heat.forEach((dId, laneIdx) => {
      if (dId && dId !== "EMPTY_LANE") {
        if (driverIdSet.has(dId)) {
          laneTotals[laneIdx]++;
          const counts = driverLaneCounts.get(dId);
          if (counts && laneIdx < numLanes) {
            counts[laneIdx]++;
          }
        } else {
          initialAllEqual = false;
          const displayName = driverNames?.get(dId) || dId;
          reports.push({
            key: "AM_REPORT_INVALID_DRIVER",
            params: { heat: hIdx + 1, driver: displayName },
          });
        }
      }
    });
  });

  return { driverLaneCounts, laneTotals, reports, initialAllEqual };
}

function checkDiffsAndBuildReports(
  numLanes: number,
  driverIds: string[],
  driverLaneCounts: Map<string, number[]>,
  laneTotals: number[],
  driverNames?: Map<string, string>,
  translationService?: TranslationService,
  initialReports: LaneEqualityReportItem[] = [],
  initialAllEqual: boolean = true,
) {
  const finalReports = [...initialReports];
  let allEqual = initialAllEqual;
  let totalAssignments = 0;
  const numDrivers = driverIds.length;

  const getHeatLabel = (count: number): string => {
    if (translationService) {
      return translationService.translate(
        count === 1 ? "AM_LABEL_HEAT_SINGULAR" : "AM_LABEL_HEAT_PLURAL",
      );
    }
    return count === 1 ? "heat" : "heats";
  };

  for (let l = 0; l < numLanes; l++) {
    totalAssignments += laneTotals[l];

    const countsMap = new Map<number, string[]>();
    for (let i = 0; i < numDrivers; i++) {
      const dId = driverIds[i];
      const count = driverLaneCounts.get(dId)![l];
      if (!countsMap.has(count)) {
        countsMap.set(count, []);
      }
      countsMap.get(count)!.push(dId);
    }

    if (countsMap.size <= 1) {
      continue;
    }

    allEqual = false;

    if (numDrivers === 2) {
      finalReports.push(
        buildTwoDriverReport(
          l + 1,
          driverIds,
          driverLaneCounts,
          driverNames,
          getHeatLabel,
        ),
      );
    } else {
      finalReports.push(
        ...buildMultiDriverReports(
          l + 1,
          countsMap,
          laneTotals[l],
          numDrivers,
          driverNames,
          getHeatLabel,
        ),
      );
    }
  }

  if (totalAssignments === 0) {
    allEqual = false;
    finalReports.push({ key: "AM_REPORT_NO_DRIVERS" });
  }

  return { allEqual, finalReports };
}

function determineBaselineCount(
  countsMap: Map<number, string[]>,
  totalAssignmentsInLane: number,
  numDrivers: number,
): number {
  const avgHeats = totalAssignmentsInLane / numDrivers;
  const sortedCounts = Array.from(countsMap.entries()).sort((a, b) => {
    const diffCount = b[1].length - a[1].length;
    if (diffCount !== 0) return diffCount;
    const distA = Math.abs(a[0] - avgHeats);
    const distB = Math.abs(b[0] - avgHeats);
    if (distA !== distB) return distA - distB;
    return b[0] - a[0];
  });
  return sortedCounts[0][0];
}

function buildTwoDriverReport(
  lane: number,
  driverIds: string[],
  driverLaneCounts: Map<string, number[]>,
  driverNames?: Map<string, string>,
  getHeatLabel?: (count: number) => string,
): LaneEqualityReportItem {
  const d1 = driverIds[0];
  const d2 = driverIds[1];
  const count1 = driverLaneCounts.get(d1)![lane - 1];
  const count2 = driverLaneCounts.get(d2)![lane - 1];
  const d1Name = driverNames?.get(d1) || d1;
  const d2Name = driverNames?.get(d2) || d2;
  const heat1 = getHeatLabel
    ? getHeatLabel(count1)
    : count1 === 1
      ? "heat"
      : "heats";
  const heat2 = getHeatLabel
    ? getHeatLabel(count2)
    : count2 === 1
      ? "heat"
      : "heats";

  return {
    key: "AM_REPORT_LANE_DIFF",
    params: {
      lane,
      d1: d1Name,
      count1,
      heat1,
      d2: d2Name,
      count2,
      heat2,
      driver: d1Name,
      count: count1,
      heatLabel: heat1,
      expectedCount: count2,
      expectedHeatLabel: heat2,
    },
  };
}

function buildMultiDriverReports(
  lane: number,
  countsMap: Map<number, string[]>,
  totalAssignmentsInLane: number,
  numDrivers: number,
  driverNames?: Map<string, string>,
  getHeatLabel?: (count: number) => string,
): LaneEqualityReportItem[] {
  const reports: LaneEqualityReportItem[] = [];
  const baselineCount = determineBaselineCount(
    countsMap,
    totalAssignmentsInLane,
    numDrivers,
  );
  const expectedHeatLabel = getHeatLabel
    ? getHeatLabel(baselineCount)
    : baselineCount === 1
      ? "heat"
      : "heats";

  const deviatingCounts = Array.from(countsMap.keys())
    .filter((count) => count !== baselineCount)
    .sort((a, b) => a - b);

  for (const count of deviatingCounts) {
    const deviatingDriverIds = countsMap.get(count)!;
    const countHeatLabel = getHeatLabel
      ? getHeatLabel(count)
      : count === 1
        ? "heat"
        : "heats";
    const names = deviatingDriverIds.map((id) => driverNames?.get(id) || id);

    if (names.length === 1) {
      reports.push({
        key: "AM_REPORT_LANE_DIFF_SINGLE",
        params: {
          lane,
          driver: names[0],
          count,
          heatLabel: countHeatLabel,
          expectedCount: baselineCount,
          expectedHeatLabel,
          d1: names[0],
          count1: count,
          heat1: countHeatLabel,
          d2: "",
          count2: baselineCount,
          heat2: expectedHeatLabel,
        },
      });
    } else {
      reports.push({
        key: "AM_REPORT_LANE_DIFF_MULTIPLE",
        params: {
          lane,
          drivers: names.join(", "),
          count,
          heatLabel: countHeatLabel,
          expectedCount: baselineCount,
          expectedHeatLabel,
          d1: names.join(", "),
          count1: count,
          heat1: countHeatLabel,
          d2: "",
          count2: baselineCount,
          heat2: expectedHeatLabel,
        },
      });
    }
  }

  return reports;
}
