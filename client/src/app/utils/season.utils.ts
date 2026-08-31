import {
  Season,
  SeasonStandingDetail,
  SeasonStandingItem,
} from "@app/models/season";

export function calculateSeasonStandings(
  season?: Season | null,
): SeasonStandingItem[] {
  if (!season || !season.races || season.races.length === 0) {
    return [];
  }

  // Sort races by date run (oldest to most recent)
  const racesCopy = [...season.races].sort(
    (a, b) => (a.timestamp || 0) - (b.timestamp || 0),
  );

  const driverMap = new Map<
    string,
    { driver_name: string; scores: SeasonStandingDetail[] }
  >();

  for (const race of racesCopy) {
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
        overall_points: res.overall_points,
        overall_bonus_points: res.overall_bonus_points,
        overall_bonus_breakdown: res.overall_bonus_breakdown,
        heat_points: res.heat_points,
        heat_bonus_points: res.heat_bonus_points,
        heat_bonus_breakdown: res.heat_bonus_breakdown,
        total_points: res.total_points,
        is_dropped: false,
      });
    }
  }

  const result: SeasonStandingItem[] = [];

  driverMap.forEach((entry, driverId) => {
    const scores = entry.scores;
    const drops = season.drops || 0;
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
      net_points: netPoints,
      gross_points: grossPoints,
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
