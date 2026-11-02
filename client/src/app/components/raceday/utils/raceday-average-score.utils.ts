import { ColumnDefinition } from "@app/components/raceday/column_definition";
import { isOverallDataSource } from "@app/components/raceday/components/raceday-lane-column/raceday-lane-column-driver.helper";
import { FinishMethod, HeatRanking } from "@app/models/heat_scoring";
import { RaceState } from "@app/proto/antigravity";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { formatTimerDisplay } from "@app/utils/timer-format.utils";

import { FormatContext, RacedayFormatUtils } from "./raceday-format.utils";

export function getDriverEntityIds(hd: any): Set<string> {
  const ids = new Set<string>();
  if (!hd) return ids;

  const add = (id: any) => {
    if (typeof id === "string" && id.trim()) {
      ids.add(id.trim());
    }
  };

  add(hd.participant?.team?.entity_id);
  add(hd.participant?.team?.id);
  add(hd.team?.entity_id);
  add(hd.team?.id);

  add(hd.participant?.objectId);
  add((hd.participant as any)?.object_id);
  add(hd.participant?.entity_id);
  add(hd.participant?.id);

  add(hd.participant?.driver?.entity_id);
  add(hd.participant?.driver?.driverId);
  add(hd.participant?.driver?.id);
  add(hd.participant?.driver_id);

  add(hd.actualDriver?.entity_id);
  add(hd.actualDriver?.driverId);
  add(hd.actualDriver?.id);

  add(hd.driver?.entity_id);
  add(hd.driver?.driverId);
  add(hd.driver?.id);
  add((hd.driver as any)?.driver?.entity_id);
  add((hd.driver as any)?.driver?.id);

  add(hd.driverId);
  add(hd.entity_id);
  add(hd.objectId);
  add((hd as any)?.object_id);
  add(hd.id);

  return ids;
}

export function getDriverEntityId(hd: any): string | undefined {
  if (!hd) return undefined;
  return (
    hd.participant?.team?.entity_id ||
    hd.participant?.team?.id ||
    hd.team?.entity_id ||
    hd.team?.id ||
    hd.participant?.objectId ||
    hd.driver?.entity_id ||
    hd.driver?.driverId ||
    hd.driver?.id ||
    hd.actualDriver?.entity_id ||
    hd.actualDriver?.id ||
    hd.actualDriver?.driverId ||
    hd.participant?.driver?.entity_id ||
    hd.participant?.driver?.id ||
    hd.participant?.driver?.driverId ||
    hd.participant?.entity_id ||
    hd.participant?.id ||
    hd.driverId ||
    hd.entity_id ||
    hd.objectId ||
    hd.id ||
    hd.participant?.team?.name ||
    hd.actualDriver?.name ||
    hd.driver?.name ||
    hd.participant?.driver?.name
  );
}

export function isSameDriver(hdA: any, hdB: any): boolean {
  if (!hdA || !hdB) return false;
  if (hdA === hdB) return true;

  // 1. Participant object ID matching (unique per competitor in a race)
  const partA =
    hdA.participant?.objectId || (hdA.participant as any)?.object_id;
  const partB =
    hdB.participant?.objectId || (hdB.participant as any)?.object_id;
  if (partA && partB && partA === partB) {
    return true;
  }

  // 2. Team matching: if both entries represent a team, match by team ID or team name
  const teamA = hdA.participant?.team || hdA.driver?.team || hdA.team;
  const teamB = hdB.participant?.team || hdB.driver?.team || hdB.team;
  if (teamA && teamB) {
    const teamIdA = teamA.entity_id || teamA.id;
    const teamIdB = teamB.entity_id || teamB.id;
    if (teamIdA && teamIdB && teamIdA === teamIdB) {
      return true;
    }
    if (teamA.name && teamB.name && teamA.name === teamB.name) {
      return true;
    }
    return false;
  }

  // 3. DriverHeatData object ID matching (same lane/heat data instance)
  const objA = hdA.objectId || (hdA as any)?.object_id;
  const objB = hdB.objectId || (hdB as any)?.object_id;
  if (objA && objB && objA === objB) {
    return true;
  }

  // 4. Set intersection of all driver/participant/team explicit IDs
  const idsA = getDriverEntityIds(hdA);
  const idsB = getDriverEntityIds(hdB);
  for (const id of idsA) {
    if (idsB.has(id)) {
      return true;
    }
  }

  // 5. Driver name fallback when explicit IDs are not present (e.g. mock test data without IDs)
  if (idsA.size === 0 && idsB.size === 0) {
    const nameA =
      hdA.actualDriver?.name ||
      hdA.driver?.name ||
      hdA.participant?.driver?.name ||
      hdA.name;
    const nameB =
      hdB.actualDriver?.name ||
      hdB.driver?.name ||
      hdB.participant?.driver?.name ||
      hdB.name;
    if (nameA && nameB && nameA === nameB) {
      return true;
    }
  }

  return false;
}

export function isFinishMethodTimed(scoring?: any): boolean {
  if (!scoring) return false;
  const fm = scoring.finishMethod ?? scoring.finish_method;
  return (
    fm === FinishMethod.Timed || fm === "Timed" || fm === "TIMED" || fm === 1
  );
}

export function isScoringFastestLap(scoring?: any): boolean {
  if (!scoring) return false;
  const hr = scoring.heatRanking ?? scoring.heat_ranking;
  return (
    hr === HeatRanking.HR_FASTEST_LAP ||
    hr === "HR_FASTEST_LAP" ||
    hr === "FASTEST_LAP" ||
    hr === 1 ||
    hr === 2
  );
}

export function isScoringTotalTime(scoring?: any): boolean {
  if (!scoring) return false;
  const hr = scoring.heatRanking ?? scoring.heat_ranking;
  return (
    hr === HeatRanking.HR_TOTAL_TIME ||
    hr === "HR_TOTAL_TIME" ||
    hr === "TOTAL_TIME" ||
    hr === 2 ||
    hr === 3
  );
}

function isHeatCompleted(
  heat: any,
  currentHeat: any,
  curHeatNum: number,
  hd: DriverHeatData,
  scoring: any,
  isHeatOver: boolean,
  isRaceOver: boolean,
  areAllDriversFinished: boolean,
  ctx?: FormatContext,
): { isCompleted: boolean; isCurHeat: boolean } {
  const isPastHeat = curHeatNum > 0 && heat.heatNumber < curHeatNum;
  const isCurHeat =
    heat === currentHeat || (curHeatNum > 0 && heat.heatNumber === curHeatNum);

  let isCurHeatFinished = false;
  if (isCurHeat) {
    if (heat.isCompleted === false || currentHeat?.isCompleted === false) {
      isCurHeatFinished = false;
    } else {
      const dhdInCur = heat.heatDrivers?.find((d: any) => isSameDriver(hd, d));
      const isExplicitlyFinished =
        dhdInCur?.isFinished === true ||
        (dhdInCur as any)?.finished === true ||
        hd?.isFinished === true ||
        (hd as any)?.finished === true;

      isCurHeatFinished = Boolean(
        isRaceOver ||
        isHeatOver ||
        areAllDriversFinished ||
        isExplicitlyFinished ||
        (ctx?.isDriverFinished &&
          dhdInCur &&
          ctx.isDriverFinished(dhdInCur, scoring)) ||
        (ctx?.isDriverFinished && ctx.isDriverFinished(hd, scoring)) ||
        (heat.heatDrivers?.length > 0 &&
          heat.heatDrivers
            .filter((d: any) => !RacedayFormatUtils.isEmptyDriver(d))
            .every(
              (d: any) => d.isFinished === true || (d as any).finished === true,
            )),
      );
    }
  }

  const isCompleted =
    heat.isCompleted === true ||
    (heat.isCompleted === false
      ? false
      : isPastHeat ||
        isCurHeatFinished ||
        (isRaceOver && heat.heatNumber <= curHeatNum) ||
        (curHeatNum === 0 &&
          Boolean(heat.standings && heat.standings.length > 0)));

  return { isCompleted, isCurHeat };
}

function accumulateHeatScore(
  dhd: any,
  isFastestLap: boolean,
  isTotalTime: boolean,
): { score: number; count: number } {
  if (isFastestLap) {
    const best = Number(dhd.bestLapTime ?? dhd.best_lap_time ?? 0);
    return best > 0 ? { score: best, count: 1.0 } : { score: 0, count: 0 };
  }
  if (isTotalTime) {
    const total = Number(dhd.totalTime ?? dhd.total_time ?? 0);
    return total > 0 ? { score: total, count: 1.0 } : { score: 0, count: 0 };
  }
  const laps = Number(dhd.lapCount ?? dhd.lap_count ?? 0);
  return { score: laps, count: 1.0 };
}

function calculatePartialProgress(
  scoring: any,
  activeDrivers: DriverHeatData[],
  ctx?: FormatContext,
  parent?: any,
): number {
  const finishVal = Number(scoring?.finishValue ?? scoring?.finish_value ?? 0);
  if (finishVal <= 0 || isNaN(finishVal)) return 0;

  if (isFinishMethodTimed(scoring)) {
    const heatTime = ctx?.getHeatTime
      ? ctx.getHeatTime()
      : (parent?.raceTimeService?.time ?? parent?.time ?? 0);
    let maxDriverTime = 0;
    for (const d of activeDrivers) {
      if (!RacedayFormatUtils.isEmptyDriver(d)) {
        const dt = Number(d.totalTime ?? (d as any).total_time ?? 0);
        if (dt > maxDriverTime) maxDriverTime = dt;
      }
    }
    return Math.min(
      1.0,
      Math.max(0.0, Math.max(heatTime, maxDriverTime) / finishVal),
    );
  }

  let leadLaps = 0;
  for (const d of activeDrivers) {
    if (!RacedayFormatUtils.isEmptyDriver(d)) {
      const laps = Number(d.lapCount ?? (d as any).lap_count ?? 0);
      if (laps > leadLaps) leadLaps = laps;
    }
  }
  return Math.min(1.0, Math.max(0.0, leadLaps / finishVal));
}

function calculatePartialHeatScore(
  hd: DriverHeatData,
  currentHeat: any,
  scoring: any,
  isFastestLap: boolean,
  isTotalTime: boolean,
  ctx?: FormatContext,
  parent?: any,
): { score: number; weight: number } {
  const activeDrivers: DriverHeatData[] = [
    ...(ctx?.getSortedHeatDrivers?.() ||
      parent?.sortedHeatDrivers ||
      currentHeat.heatDrivers ||
      []),
  ];
  if (
    hd &&
    !RacedayFormatUtils.isEmptyDriver(hd) &&
    !activeDrivers.some((d) => isSameDriver(hd, d))
  ) {
    activeDrivers.push(hd);
  }

  const progress = calculatePartialProgress(
    scoring,
    activeDrivers,
    ctx,
    parent,
  );
  if (progress <= 0) return { score: 0, weight: 0 };

  const target =
    activeDrivers.find((d: any) => isSameDriver(hd, d)) ||
    currentHeat.heatDrivers?.find((d: any) => isSameDriver(hd, d)) ||
    hd;

  if (!target || RacedayFormatUtils.isEmptyDriver(target)) {
    return { score: 0, weight: 0 };
  }

  if (isFastestLap) {
    const best = Number(
      target.bestLapTime ?? (target as any).best_lap_time ?? 0,
    );
    return best > 0
      ? { score: best * progress, weight: progress }
      : { score: 0, weight: 0 };
  }
  if (isTotalTime) {
    const total = Number(target.totalTime ?? (target as any).total_time ?? 0);
    return total > 0
      ? { score: total, weight: progress }
      : { score: 0, weight: 0 };
  }
  const laps = Number(target.lapCount ?? (target as any).lap_count ?? 0);
  return { score: laps, weight: progress };
}

interface AverageScoreContext {
  scoring: any;
  isFastestLap: boolean;
  isTotalTime: boolean;
  heats: any[];
  currentHeat: any;
  curHeatNum: number;
  isHeatOver: boolean;
  areAllDriversFinished: boolean;
  isRaceOver: boolean;
  showPartialHeats: boolean;
}

function resolveAverageScoreContext(
  settings: any,
  anchor: string | undefined,
  ctx: FormatContext | undefined,
  parent: any,
): AverageScoreContext {
  const race =
    ctx?.getRace?.() || parent?.raceService?.getRace?.() || parent?.race;
  const scoring: any = race?.heat_scoring ?? (race as any)?.heatScoring;
  const isFastestLap = isScoringFastestLap(scoring);
  const isTotalTime = isScoringTotalTime(scoring);

  const heats: any[] = [
    ...(ctx?.getHeats?.() ||
      parent?.heats ||
      parent?.race?.heats ||
      parent?.raceService?.getHeats?.() ||
      race?.heats ||
      []),
  ];

  const currentHeat: any =
    ctx?.getCurrentHeat?.() ||
    parent?.currentHeat ||
    parent?.raceService?.getCurrentHeat?.() ||
    parent?.heat;

  if (
    currentHeat &&
    !heats.some(
      (h) =>
        (h.heatNumber != null &&
          currentHeat.heatNumber != null &&
          h.heatNumber === currentHeat.heatNumber) ||
        h === currentHeat,
    )
  ) {
    heats.push(currentHeat);
  }

  const curHeatNum = currentHeat?.heatNumber ?? 0;
  const raceState =
    ctx?.raceState !== undefined
      ? ctx.raceState
      : ctx?.getRaceState
        ? ctx.getRaceState()
        : parent?.raceState !== undefined
          ? parent.raceState
          : parent?.raceTimeService?.raceState;

  const isHeatOver =
    raceState === RaceState.HEAT_OVER ||
    raceState === (RaceState as any)?.HEAT_OVER ||
    raceState === "HEAT_OVER" ||
    raceState === 5;

  const areAllDriversFinished = Boolean(
    ctx?.areAllDriversFinished?.() ||
    (typeof parent?.areAllDriversFinished === "function" &&
      parent.areAllDriversFinished()),
  );

  const isRaceOver = Boolean(
    ctx?.isRaceOver?.() ||
    (typeof parent?.isRaceOver === "function" && parent.isRaceOver()) ||
    parent?.isRaceOver === true ||
    raceState === RaceState.RACE_OVER ||
    raceState === (RaceState as any)?.RACE_OVER ||
    raceState === "RACE_OVER" ||
    raceState === 6,
  );

  const config =
    anchor && anchor !== "center-center" && settings?.insetsConfig?.[anchor]
      ? settings.insetsConfig[anchor]
      : settings;
  const showPartialHeats = Boolean(
    config?.showPartialHeats ?? settings?.showPartialHeats,
  );

  return {
    scoring,
    isFastestLap,
    isTotalTime,
    heats,
    currentHeat,
    curHeatNum,
    isHeatOver,
    areAllDriversFinished,
    isRaceOver,
    showPartialHeats,
  };
}

function processCompletedHeats(
  heats: any[],
  currentHeat: any,
  curHeatNum: number,
  hd: DriverHeatData,
  scoring: any,
  isFastestLap: boolean,
  isTotalTime: boolean,
  isHeatOver: boolean,
  isRaceOver: boolean,
  areAllDriversFinished: boolean,
  ctx?: FormatContext,
): {
  totalScore: number;
  denominator: number;
  isCurrentHeatAlreadyCompleted: boolean;
} {
  let totalScore = 0;
  let denominator = 0;
  let isCurrentHeatAlreadyCompleted = false;

  for (const heat of heats) {
    const { isCompleted, isCurHeat } = isHeatCompleted(
      heat,
      currentHeat,
      curHeatNum,
      hd,
      scoring,
      isHeatOver,
      isRaceOver,
      areAllDriversFinished,
      ctx,
    );

    if (isCurHeat && isCompleted) {
      isCurrentHeatAlreadyCompleted = true;
    }
    if (!isCompleted) continue;

    const dhd =
      heat.heatDrivers?.find((d: any) => isSameDriver(hd, d)) ||
      (isCurHeat ? hd : undefined);
    if (!dhd || RacedayFormatUtils.isEmptyDriver(dhd)) continue;

    const { score, count } = accumulateHeatScore(
      dhd,
      isFastestLap,
      isTotalTime,
    );
    totalScore += score;
    denominator += count;
  }

  return { totalScore, denominator, isCurrentHeatAlreadyCompleted };
}

export class RacedayAverageScoreUtils {
  static calculateAverageScore(
    hd: DriverHeatData,
    settings?: any,
    anchor?: string,
    ctx?: FormatContext,
    parent?: any,
  ): number | null {
    if (!hd || RacedayFormatUtils.isEmptyDriver(hd)) {
      return null;
    }

    const bindingMode = settings?.bindingMode;
    if (isOverallDataSource(settings, parent, bindingMode)) {
      return null;
    }

    const driverId = getDriverEntityId(hd);
    if (!driverId) {
      return null;
    }

    const scoreCtx = resolveAverageScoreContext(settings, anchor, ctx, parent);
    const completed = processCompletedHeats(
      scoreCtx.heats,
      scoreCtx.currentHeat,
      scoreCtx.curHeatNum,
      hd,
      scoreCtx.scoring,
      scoreCtx.isFastestLap,
      scoreCtx.isTotalTime,
      scoreCtx.isHeatOver,
      scoreCtx.isRaceOver,
      scoreCtx.areAllDriversFinished,
      ctx,
    );

    let totalScore = completed.totalScore;
    let denominator = completed.denominator;

    if (
      scoreCtx.showPartialHeats &&
      scoreCtx.currentHeat &&
      !scoreCtx.isRaceOver &&
      !completed.isCurrentHeatAlreadyCompleted
    ) {
      const partial = calculatePartialHeatScore(
        hd,
        scoreCtx.currentHeat,
        scoreCtx.scoring,
        scoreCtx.isFastestLap,
        scoreCtx.isTotalTime,
        ctx,
        parent,
      );
      totalScore += partial.score;
      denominator += partial.weight;
    }

    if (denominator <= 0) {
      return null;
    }

    return totalScore / denominator;
  }

  static formatAverageScore(
    value: any,
    hd: DriverHeatData,
    column: ColumnDefinition | undefined,
    ctx: FormatContext,
    timeDecimals: number,
    lapDecimals: number,
    timePlaceholder: string,
    lapPlaceholder: string,
    colKey: string,
    isInset: boolean,
    _anchor?: string,
  ): string {
    const race = ctx?.getRace?.();
    const scoring: any = race?.heat_scoring ?? (race as any)?.heatScoring;
    const isFastestLap = isScoringFastestLap(scoring);
    const isTotalTime = isScoringTotalTime(scoring);

    if (
      value === null ||
      value === undefined ||
      value === "" ||
      isNaN(Number(value))
    ) {
      return isFastestLap || isTotalTime ? timePlaceholder : lapPlaceholder;
    }

    const numValue = Number(value);

    if (isFastestLap) {
      return numValue.toFixed(timeDecimals);
    }

    if (isTotalTime) {
      const timerOpts = RacedayFormatUtils.resolveTimerFormatOptions(
        colKey,
        ctx.laneViewWidgetSettings,
        isInset,
        timeDecimals,
        "averageScore",
      );
      if (timerOpts) {
        return formatTimerDisplay(numValue, timerOpts);
      }
      return numValue.toFixed(timeDecimals);
    }

    return numValue.toFixed(lapDecimals);
  }
}
