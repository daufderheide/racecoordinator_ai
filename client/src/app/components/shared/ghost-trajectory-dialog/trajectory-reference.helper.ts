import { TrajectoryReferenceOption } from "@app/components/shared/ghost-trajectory-dialog/ghost-trajectory-dialog.component";
import { Driver } from "@app/models/driver";
import { RaceParticipant } from "@app/models/race_participant";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { Heat } from "@app/race/heat";

export class TrajectoryReferenceHelper {
  static addHeatDriverEntityIds(heatDriver: any, ids: Set<string>): void {
    if (!heatDriver) return;
    if (heatDriver.objectId) ids.add(heatDriver.objectId);
    if (heatDriver.participant?.objectId) {
      ids.add(heatDriver.participant.objectId);
    }
    if (heatDriver.participant?.team?.entity_id) {
      ids.add(heatDriver.participant.team.entity_id);
    }
    if (heatDriver.participant?.team?.id) {
      ids.add(heatDriver.participant.team.id);
    }
    if (heatDriver.participant?.driver?.entity_id) {
      ids.add(heatDriver.participant.driver.entity_id);
    }
    if (heatDriver.participant?.driver?.id) {
      ids.add(heatDriver.participant.driver.id);
    }
    if (heatDriver.driver?.entity_id) ids.add(heatDriver.driver.entity_id);
    if (heatDriver.driver?.id) ids.add(heatDriver.driver.id);
    if (heatDriver.actualDriver?.entity_id) {
      ids.add(heatDriver.actualDriver.entity_id);
    }
    if (heatDriver.actualDriver?.id) ids.add(heatDriver.actualDriver.id);
  }

  static isLiveCompetitor(
    competitor?: any,
    hd?: DriverHeatData,
    p?: RaceParticipant,
    liveIds?: Set<string>,
  ): boolean {
    if (!liveIds) return false;

    if (p) {
      if (p.objectId && liveIds.has(p.objectId)) return true;
      if (p.driver?.entity_id && liveIds.has(p.driver.entity_id)) return true;
      if ((p.driver as any)?.id && liveIds.has((p.driver as any).id)) {
        return true;
      }
      if (p.team?.entity_id && liveIds.has(p.team.entity_id)) return true;
      if ((p.team as any)?.id && liveIds.has((p.team as any).id)) return true;
    }

    if (hd) {
      if (hd.objectId && liveIds.has(hd.objectId)) return true;
      if (hd.participant?.objectId && liveIds.has(hd.participant.objectId)) {
        return true;
      }
      if (
        hd.participant?.driver?.entity_id &&
        liveIds.has(hd.participant.driver.entity_id)
      ) {
        return true;
      }
      if (
        (hd.participant?.driver as any)?.id &&
        liveIds.has((hd.participant.driver as any).id)
      ) {
        return true;
      }
      if (
        hd.participant?.team?.entity_id &&
        liveIds.has(hd.participant.team.entity_id)
      ) {
        return true;
      }
      if (
        (hd.participant?.team as any)?.id &&
        liveIds.has((hd.participant.team as any).id)
      ) {
        return true;
      }
      if (hd.driver?.entity_id && liveIds.has(hd.driver.entity_id)) return true;
      if ((hd.driver as any)?.id && liveIds.has((hd.driver as any).id)) {
        return true;
      }
      if (
        hd.actualDriver?.entity_id &&
        liveIds.has(hd.actualDriver.entity_id)
      ) {
        return true;
      }
      if (
        (hd.actualDriver as any)?.id &&
        liveIds.has((hd.actualDriver as any).id)
      ) {
        return true;
      }
    }

    if (competitor) {
      const entityId =
        (competitor as any)?.entity_id ||
        (competitor as any)?.id ||
        (competitor as any)?.objectId;
      if (entityId && liveIds.has(entityId)) return true;
    }

    return false;
  }

  static isValidCompetitorName(name: string): boolean {
    const trimmed = (name || "").trim().toLowerCase();
    return (
      !!trimmed &&
      trimmed !== "empty" &&
      trimmed !== "empty lane" &&
      trimmed !== "(empty)"
    );
  }

  static sortHeatDrivers(heat: any): any[] {
    if (!heat?.heatDrivers) return [];
    return [...heat.heatDrivers].sort((a, b) => {
      if (heat.standings && heat.standings.length > 0) {
        let idxA = heat.standings.indexOf(a.objectId);
        let idxB = heat.standings.indexOf(b.objectId);
        if (idxA === -1) idxA = 999;
        if (idxB === -1) idxB = 999;
        if (idxA !== idxB) return idxA - idxB;
      }
      if (a.rank && b.rank && a.rank !== b.rank) {
        if (a.rank === 0) return 1;
        if (b.rank === 0) return -1;
        return a.rank - b.rank;
      }
      const lapsA = a.adjustedLapCount ?? a.lapCount ?? 0;
      const lapsB = b.adjustedLapCount ?? b.lapCount ?? 0;
      if (lapsB !== lapsA) return lapsB - lapsA;
      const timeA = a.totalTime ?? 0;
      const timeB = b.totalTime ?? 0;
      return timeA - timeB;
    });
  }

  static buildHeatReferenceOptions(
    heat: any,
    heatDriver: any,
    liveIds: Set<string>,
  ): TrajectoryReferenceOption[] {
    const refOptions: TrajectoryReferenceOption[] = [];
    const seenCompetitorIds = new Set<string>();
    const sortedHeatDrivers = TrajectoryReferenceHelper.sortHeatDrivers(heat);

    for (const hd of sortedHeatDrivers) {
      if (hd === heatDriver || hd.objectId === heatDriver?.objectId) continue;
      if (
        TrajectoryReferenceHelper.isLiveCompetitor(
          undefined,
          hd,
          hd.participant,
          liveIds,
        )
      ) {
        continue;
      }

      const competitor =
        hd.participant?.team ||
        hd.driver ||
        hd.actualDriver ||
        hd.participant?.driver;
      if (!competitor || Driver.isEmpty(competitor)) continue;
      if (
        TrajectoryReferenceHelper.isLiveCompetitor(
          competitor,
          hd,
          hd.participant,
          liveIds,
        )
      ) {
        continue;
      }

      const compName = competitor.nickname || competitor.name || "";
      if (!TrajectoryReferenceHelper.isValidCompetitorName(compName)) continue;

      const compId =
        (competitor as any)?.entity_id ||
        (competitor as any)?.id ||
        hd.objectId;
      if (compId && !seenCompetitorIds.has(compId) && !liveIds.has(compId)) {
        seenCompetitorIds.add(compId);
        refOptions.push({
          id: compId,
          name: competitor.nickname || competitor.name || hd.objectId,
          lapTimes: hd.lapTimes || (hd as any)?.laps || [],
        });
      }
    }
    return refOptions;
  }

  static buildOverallReferenceOptions(
    participants: RaceParticipant[],
    heats: Heat[],
    liveIds: Set<string>,
  ): TrajectoryReferenceOption[] {
    const refOptions: TrajectoryReferenceOption[] = [];
    const seenCompetitorIds = new Set<string>();

    const sortedParticipants = [...participants]
      .filter((p) => p && ((p.driver && !Driver.isEmpty(p.driver)) || p.team))
      .sort((a, b) => {
        if (a.rank !== b.rank) {
          if (a.rank === 0) return 1;
          if (b.rank === 0) return -1;
          return a.rank - b.rank;
        }
        if (b.rankValue !== a.rankValue) return b.rankValue - a.rankValue;
        if (b.totalLaps !== a.totalLaps) return b.totalLaps - a.totalLaps;
        return a.totalTime - b.totalTime;
      });

    for (const p of sortedParticipants) {
      if (
        TrajectoryReferenceHelper.isLiveCompetitor(
          undefined,
          undefined,
          p,
          liveIds,
        )
      ) {
        continue;
      }
      const competitor = p.team || p.driver;
      if (!competitor || Driver.isEmpty(competitor)) continue;
      if (
        TrajectoryReferenceHelper.isLiveCompetitor(
          competitor,
          undefined,
          p,
          liveIds,
        )
      ) {
        continue;
      }

      const compName = (competitor as any)?.nickname || competitor.name || "";
      if (!TrajectoryReferenceHelper.isValidCompetitorName(compName)) continue;

      const compId =
        (competitor as any)?.entity_id || (competitor as any)?.id || p.objectId;
      if (compId && !seenCompetitorIds.has(compId) && !liveIds.has(compId)) {
        seenCompetitorIds.add(compId);
        refOptions.push({
          id: compId,
          name: (competitor as any)?.nickname || competitor.name || p.objectId,
          lapTimes: TrajectoryReferenceHelper.getOverallDriverLapTimes(
            heats,
            compId,
          ),
        });
      }
    }

    if (refOptions.length === 0 && heats.length > 0) {
      return TrajectoryReferenceHelper.buildOverallReferenceOptionsFromHeats(
        heats,
        liveIds,
      );
    }
    return refOptions;
  }

  static buildOverallReferenceOptionsFromHeats(
    heats: Heat[],
    liveIds: Set<string>,
  ): TrajectoryReferenceOption[] {
    const competitorMap = new Map<
      string,
      {
        id: string;
        name: string;
        totalLaps: number;
        totalTime: number;
        lapTimes: number[];
      }
    >();

    for (const heat of heats) {
      if (!heat?.heatDrivers) continue;
      for (const hd of heat.heatDrivers) {
        if (
          TrajectoryReferenceHelper.isLiveCompetitor(
            undefined,
            hd,
            hd.participant,
            liveIds,
          )
        ) {
          continue;
        }
        const competitor =
          hd.participant?.team ||
          hd.driver ||
          hd.actualDriver ||
          hd.participant?.driver;
        if (!competitor || Driver.isEmpty(competitor)) continue;
        if (
          TrajectoryReferenceHelper.isLiveCompetitor(
            competitor,
            hd,
            hd.participant,
            liveIds,
          )
        ) {
          continue;
        }

        const compName = (competitor as any)?.nickname || competitor.name || "";
        if (!TrajectoryReferenceHelper.isValidCompetitorName(compName))
          continue;

        const compId =
          (competitor as any)?.entity_id ||
          (competitor as any)?.id ||
          hd.objectId;
        if (compId && !liveIds.has(compId)) {
          const hdLaps = hd.lapTimes || (hd as any)?.laps || [];
          if (!competitorMap.has(compId)) {
            competitorMap.set(compId, {
              id: compId,
              name:
                (competitor as any)?.nickname || competitor.name || hd.objectId,
              totalLaps: 0,
              totalTime: 0,
              lapTimes: [],
            });
          }
          const entry = competitorMap.get(compId)!;
          entry.lapTimes.push(...hdLaps);
          entry.totalLaps +=
            hd.adjustedLapCount || hd.lapCount || hdLaps.length;
          entry.totalTime += hd.totalTime || hdLaps.reduce((a, b) => a + b, 0);
        }
      }
    }

    const sortedFromHeats = Array.from(competitorMap.values()).sort((a, b) => {
      if (b.totalLaps !== a.totalLaps) return b.totalLaps - a.totalLaps;
      return a.totalTime - b.totalTime;
    });

    return sortedFromHeats.map((item) => ({
      id: item.id,
      name: item.name,
      lapTimes: item.lapTimes,
    }));
  }

  static getOverallDriverLapTimes(
    heats: Heat[],
    competitorId: string,
  ): number[] {
    const allLaps: number[] = [];
    for (const heat of heats) {
      if (heat?.heatDrivers) {
        const hd = heat.heatDrivers.find((d) => {
          if (d.objectId === competitorId) return true;
          if (d.participant?.objectId === competitorId) return true;
          const teamId =
            (d.participant?.team as any)?.entity_id ||
            (d.participant?.team as any)?.id;
          if (teamId && teamId === competitorId) {
            return true;
          }
          const driverId =
            (d.driver as any)?.entity_id ||
            (d.driver as any)?.id ||
            (d.actualDriver as any)?.entity_id ||
            (d.actualDriver as any)?.id ||
            (d.participant?.driver as any)?.entity_id ||
            (d.participant?.driver as any)?.id;
          return driverId === competitorId;
        });
        const laps = hd?.lapTimes || (hd as any)?.laps;
        if (laps && Array.isArray(laps)) {
          allLaps.push(...laps);
        }
      }
    }
    return allLaps;
  }

  static getOverallLiveDriverLapTimes(
    heats: Heat[],
    liveIds: Set<string>,
  ): number[] {
    const allLaps: number[] = [];
    for (const heat of heats) {
      if (heat?.heatDrivers) {
        const hd = heat.heatDrivers.find((d) =>
          TrajectoryReferenceHelper.isLiveCompetitor(
            undefined,
            d,
            d.participant,
            liveIds,
          ),
        );
        const laps = hd?.lapTimes || (hd as any)?.laps;
        if (laps && Array.isArray(laps)) {
          allLaps.push(...laps);
        }
      }
    }
    return allLaps;
  }
}
