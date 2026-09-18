import {
  Season,
  SeasonRaceRecord,
  SeasonStandingDetail,
  SeasonStandingItem,
} from "@app/models/season";
import { GuideStep } from "@app/services/help.service";
import { TranslationService } from "@app/services/translation.service";

export function cloneSeason(season: Season): Season {
  return JSON.parse(JSON.stringify(season));
}

export function areSeasonsEqual(a: Season, b: Season): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function calculateSeasonStandings(season: Season): SeasonStandingItem[] {
  if (!season || !season.races || season.races.length === 0) {
    return [];
  }

  // Sort races by date run (oldest to most recent)
  season.races.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

  const driverMap = new Map<
    string,
    { driver_name: string; scores: SeasonStandingDetail[] }
  >();

  for (const race of season.races) {
    if (!race.driver_results) continue;
    for (const res of race.driver_results) {
      let entry = driverMap.get(res.driver_id);
      if (!entry) {
        entry = { driver_name: res.driver_name, scores: [] };
        driverMap.set(res.driver_id, entry);
      }
      entry.scores.push({
        race_id: race.race_id,
        race_name: race.race_name,
        overall_rank: res.overall_rank,
        overall_points: res.overall_points || 0,
        overall_bonus_points: res.overall_bonus_points || 0,
        heat_points: res.heat_points || 0,
        heat_bonus_points: res.heat_bonus_points || 0,
        total_points: res.total_points,
        is_dropped: false,
      });
    }
  }

  const result: SeasonStandingItem[] = [];

  driverMap.forEach((entry, driverId) => {
    const scores = entry.scores;
    const drops = Number(season.drops) || 0;
    const racesRun = scores.length;

    if (racesRun > drops && drops > 0) {
      const sortedIndices = scores
        .map((s, idx) => ({ total: s.total_points, idx }))
        .sort((a, b) => a.total - b.total);

      for (let i = 0; i < drops; i++) {
        scores[sortedIndices[i].idx].is_dropped = true;
      }
    }

    let net = 0;
    let gross = 0;
    for (const s of scores) {
      gross += s.total_points;
      if (!s.is_dropped) {
        net += s.total_points;
      }
    }

    const netPoints = Math.round(net * 100) / 100;
    const grossPoints = Math.round(gross * 100) / 100;
    const droppedPoints =
      Math.round(Math.max(0, grossPoints - netPoints) * 100) / 100;

    result.push({
      driver_id: driverId,
      driver_name: entry.driver_name,
      net_points: net,
      gross_points: gross,
      dropped_points: droppedPoints,
      races_run: racesRun,
      race_scores: scores,
    });
  });

  result.sort((a, b) => {
    if (b.net_points !== a.net_points) return b.net_points - a.net_points;
    if (b.gross_points !== a.gross_points)
      return b.gross_points - a.gross_points;
    return b.races_run - a.races_run;
  });

  return result;
}

export function getDroppedPoints(item: SeasonStandingItem): number {
  if (item.dropped_points !== undefined) {
    return item.dropped_points;
  }
  const gross = item.gross_points || 0;
  const net = item.net_points || 0;
  return Math.round(Math.max(0, gross - net) * 100) / 100;
}

export function extractDemoHistorySet(history: any[]): Set<string> {
  const demoHistorySet = new Set<string>();
  if (!Array.isArray(history)) return demoHistorySet;

  for (const item of history) {
    const isDemo = Boolean(
      item.is_demo ||
      item.isDemo ||
      item.demo ||
      item.isDemoMode ||
      (item.model && (item.model.demoMode || item.model.isDemoMode)),
    );
    if (isDemo) {
      const raceId =
        item.original_entity_id || item.model?.entity_id || item._id;
      const timestamp =
        item.statistics?.startMillis ||
        item.timestamp ||
        (item.id?.timestamp ? item.id.timestamp * 1000 : 0);
      if (raceId) demoHistorySet.add(String(raceId));
      if (timestamp) demoHistorySet.add(String(timestamp));
      if (raceId && timestamp) demoHistorySet.add(`${raceId}_${timestamp}`);
    }
  }
  return demoHistorySet;
}

export function tagSeasonRaces(s: Season, demoHistorySet: Set<string>): void {
  if (!s || !s.races) return;
  for (const r of s.races) {
    const raceId = r.race_id;
    const timestamp = r.timestamp;
    const isDemo = Boolean(
      r.is_demo ||
      demoHistorySet.has(String(raceId)) ||
      demoHistorySet.has(String(timestamp)) ||
      demoHistorySet.has(`${raceId}_${timestamp}`) ||
      String(raceId).startsWith("demo_"),
    );
    r.is_demo = isDemo;
  }
}

export function calculateDriverHeatPointsMap(
  heats: any[],
  heatPosPointsList: number[],
): Map<string, number> {
  const driverHeatPointsMap = new Map<string, number>();
  if (!heats || !Array.isArray(heats) || heatPosPointsList.length === 0) {
    return driverHeatPointsMap;
  }
  heats.forEach((heat: any) => {
    if (heat && heat.drivers && Array.isArray(heat.drivers)) {
      const heatDrivers = [...heat.drivers].sort((a: any, b: any) => {
        const aLaps = a.laps ? a.laps.length : 0;
        const bLaps = b.laps ? b.laps.length : 0;
        if (aLaps !== bLaps) return bLaps - aLaps;
        return (a.totalTime || 0) - (b.totalTime || 0);
      });
      heatDrivers.forEach((hd: any, laneIdx: number) => {
        const dId =
          hd.driverId ||
          hd.driver_id ||
          (hd.driver ? hd.driver.entity_id || hd.driver.entityId : "");
        if (dId && laneIdx < heatPosPointsList.length) {
          const pts = Number(heatPosPointsList[laneIdx]) || 0;
          driverHeatPointsMap.set(
            dId,
            (driverHeatPointsMap.get(dId) || 0) + pts,
          );
        }
      });
    }
  });
  return driverHeatPointsMap;
}

export function extractDriverResultsFromHistory(item: any): any[] {
  const driverResults: any[] = [];
  const existingResults = item.driver_results || item.driverResults;
  if (
    existingResults &&
    Array.isArray(existingResults) &&
    existingResults.length > 0
  ) {
    existingResults.forEach((r: any) => {
      driverResults.push({
        driver_id: r.driver_id || r.driverId || "",
        driver_name: r.driver_name || r.driverName || "",
        overall_rank:
          r.overall_rank !== undefined ? r.overall_rank : r.overallRank || 1,
        overall_points:
          r.overall_points !== undefined
            ? r.overall_points
            : r.overallPoints || 0,
        overall_bonus_points:
          r.overall_bonus_points !== undefined
            ? r.overall_bonus_points
            : r.overallBonusPoints || 0,
        heat_points:
          r.heat_points !== undefined ? r.heat_points : r.heatPoints || 0,
        heat_bonus_points:
          r.heat_bonus_points !== undefined
            ? r.heat_bonus_points
            : r.heatBonusPoints || 0,
        total_points:
          r.total_points !== undefined ? r.total_points : r.totalPoints || 0,
      });
    });
    return driverResults;
  }

  if (item.drivers && Array.isArray(item.drivers)) {
    const seasonScoring =
      item.model?.season_scoring || item.model?.seasonScoring || {};
    const posPointsList: number[] = seasonScoring.position_points ||
      seasonScoring.positionPoints || [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
    const heatPosPointsList: number[] =
      seasonScoring.heat_position_points ||
      seasonScoring.heatPositionPoints ||
      [];

    const driverHeatPointsMap = calculateDriverHeatPointsMap(
      item.heats,
      heatPosPointsList,
    );

    item.drivers.forEach((d: any, idx: number) => {
      const driverName =
        d.actualDriver?.name ||
        d.driver?.name ||
        d.driver_name ||
        d.name ||
        `Driver ${idx + 1}`;
      const driverId =
        d.actualDriver?.entity_id ||
        d.driver?.entity_id ||
        d.driver_id ||
        `d_${idx}`;
      const overallRank = d.driver?.rank || d.rank || idx + 1;
      const rankIdx = overallRank - 1;
      const overallPts =
        rankIdx >= 0 && rankIdx < posPointsList.length
          ? Number(posPointsList[rankIdx]) || 0
          : 0;
      const heatPts = driverHeatPointsMap.get(driverId) || 0;
      const totalPts = overallPts + heatPts;

      driverResults.push({
        driver_id: driverId,
        driver_name: driverName,
        overall_rank: overallRank,
        overall_points: overallPts,
        heat_points: heatPts,
        total_points: totalPts,
      });
    });
  }

  return driverResults;
}

export function buildRaceRecordFromHistory(
  item: any,
): SeasonRaceRecord & { is_event_race?: boolean } {
  const raceId =
    item.original_entity_id ||
    item.model?.entity_id ||
    item.event_id ||
    item.eventId ||
    item._id ||
    "hist_race";
  const timestamp =
    item.statistics?.startMillis ||
    (item.statistics?.startTime
      ? new Date(item.statistics.startTime).getTime()
      : 0) ||
    item.timestamp ||
    (item.id?.timestamp ? item.id.timestamp * 1000 : Date.now());
  const isDemo = Boolean(
    item.is_demo ||
    item.isDemo ||
    item.demo ||
    item.isDemoMode ||
    (item.model && (item.model.demoMode || item.model.isDemoMode)) ||
    String(raceId).startsWith("demo_"),
  );

  const isEventSummary = Boolean(
    item.is_event_summary ||
    item.isEventSummary ||
    item.is_event ||
    item.isEvent ||
    String(raceId).startsWith("event_") ||
    (item.original_entity_id &&
      String(item.original_entity_id).startsWith("event_")),
  );

  const isEventRace = Boolean(
    (item.is_event_race || item.isEventRace || item.event_id || item.eventId) &&
    !isEventSummary,
  );

  return {
    race_id: raceId,
    race_name:
      item.model?.name ||
      item.event_name ||
      item.eventName ||
      (isEventSummary ? "Completed Event" : "Completed Race"),
    timestamp: timestamp,
    is_demo: isDemo,
    is_event: isEventSummary,
    is_event_race: isEventRace,
    driver_results: extractDriverResultsFromHistory(item),
  };
}

export function getSeasonEditorHelpSteps(
  hasDemoRaces: boolean,
  translationService: TranslationService,
): GuideStep[] {
  const demoStep: GuideStep = hasDemoRaces
    ? {
        selector: "#season-editor-demo-badge",
        title: translationService.translate("SE_HELP_DEMO_BADGE_TITLE"),
        content: translationService.translate(
          "SE_HELP_DEMO_BADGE_PRESENT_CONTENT",
        ),
        position: "bottom",
      }
    : {
        selector: "#season-editor-meta",
        title: translationService.translate("SE_HELP_DEMO_BADGE_TITLE"),
        content: translationService.translate(
          "SE_HELP_DEMO_BADGE_ABSENT_CONTENT",
        ),
        position: "bottom",
      };

  return [
    {
      title: translationService.translate("SE_HELP_WELCOME_TITLE"),
      content: translationService.translate("SE_HELP_WELCOME_CONTENT"),
      position: "center",
    },
    {
      selector: "#season-name",
      title: translationService.translate("SE_HELP_NAME_TITLE"),
      content: translationService.translate("SE_HELP_NAME_CONTENT"),
      position: "right",
    },
    {
      selector: "#season-drops",
      title: translationService.translate("SE_HELP_DROPS_TITLE"),
      content: translationService.translate("SE_HELP_DROPS_CONTENT"),
      position: "right",
    },
    {
      selector: "#season-editor-races-run",
      title: translationService.translate("SE_HELP_RACES_RUN_TITLE"),
      content: translationService.translate("SE_HELP_RACES_RUN_CONTENT"),
      position: "bottom",
    },
    demoStep,
    {
      selector: "#btn-add-race",
      title: translationService.translate("SE_HELP_ADD_RACE_TITLE"),
      content: translationService.translate("SE_HELP_ADD_RACE_CONTENT"),
      position: "bottom",
    },
    {
      selector: "#season-editor-standings",
      title: translationService.translate("SE_HELP_STANDINGS_TITLE"),
      content: translationService.translate("SE_HELP_STANDINGS_CONTENT"),
      position: "left",
    },
    {
      selector: "#season-editor-breakdown",
      title: translationService.translate("SE_HELP_BREAKDOWN_TITLE"),
      content: translationService.translate("SE_HELP_BREAKDOWN_CONTENT"),
      position: "left",
    },
  ];
}
