import { IRace, IStandingsUpdate } from "@app/proto/antigravity";
import { DriverMatchingUtils } from "@app/utils/driver-matching.utils";

export class RaceConnectionUtils {
  /**
   * Synchronizes overall standings participants onto the active heat's heat drivers.
   */
  static syncParticipantsToHeatDrivers(
    heatDrivers: any[],
    participants: any[],
  ): void {
    if (!heatDrivers || !participants || participants.length === 0) {
      return;
    }
    heatDrivers.forEach((hd) => {
      const d = hd.actualDriver || hd.driver;
      const driverId = d?.entity_id || d?.name;
      const teamId = hd.participant?.team?.entity_id;
      const match =
        participants.find((p: any) => {
          if (
            hd.participant?.objectId &&
            p.objectId === hd.participant.objectId
          ) {
            return true;
          }
          if (hd.objectId && p.objectId === hd.objectId) {
            return true;
          }
          if (
            driverId &&
            (p.driver?.entity_id === driverId || p.driver?.name === driverId)
          ) {
            return true;
          }
          return false;
        }) ||
        (teamId
          ? participants.find((p: any) => p.team?.entity_id === teamId)
          : undefined);

      if (match) {
        if (hd.participant) {
          Object.assign(hd.participant, match);
        }
        (hd as any).participant = match;
        (hd as any).overallRank = match.rank;
        (hd as any).overallGapLeader = match.gapLeader;
        (hd as any).overallGapPosition = match.gapPosition;
        (hd as any).overallGapLeaderF1 = match.gapLeaderF1;
        (hd as any).overallGapPositionF1 = match.gapPositionF1;
        (hd as any).overallGapLeaderLaps = match.gapLeaderLaps;
        (hd as any).overallGapPositionLaps = match.gapPositionLaps;
        (hd as any).overallLapsDownLeader = match.lapsDownLeader;
        (hd as any).overallLapsDownPosition = match.lapsDownPosition;
        if (match.fuelLevel != null && hd.participant) {
          hd.participant.fuelLevel = match.fuelLevel;
        }
      }
    });
  }

  /**
   * Merges existing and incoming race updates into a composite update.
   */
  static mergeRaceUpdates(existing: IRace | null, incoming: IRace): IRace {
    if (!existing) {
      return incoming;
    }
    return {
      ...existing,
      ...incoming,
      race: incoming.race || existing.race,
      drivers:
        incoming.drivers && incoming.drivers.length > 0
          ? incoming.drivers
          : existing.drivers,
      heats:
        incoming.heats && incoming.heats.length > 0
          ? incoming.heats
          : existing.heats,
      currentHeat: incoming.currentHeat || existing.currentHeat,
      recordData: incoming.recordData || existing.recordData,
      state:
        incoming.state !== undefined && incoming.state !== null
          ? incoming.state
          : existing.state,
      flag:
        incoming.flag !== undefined && incoming.flag !== null
          ? incoming.flag
          : existing.flag,
    };
  }

  /**
   * Decorates a converted race instance with metadata (events, seasons, timing) from proto updates.
   */
  static decorateRaceWithMetadata(race: any, update: IRace): void {
    if (update.isEvent) {
      race.is_event = update.isEvent;
      race.event_id = update.eventId;
      race.event_name = update.eventName;
      race.current_event_race_index = update.currentEventRaceIndex;
      race.total_event_races = update.totalEventRaces;
      race.auto_advance_remaining_seconds = update.autoAdvanceRemainingSeconds;
    }
    if (update.isSeason || update.seasonId || update.seasonName) {
      race.is_season = update.isSeason;
      race.season_id = update.seasonId;
      race.season_name = update.seasonName;
      race.season_standings = update.seasonStandings || [];
    }
    if (update.startTimeMillis || (update as any).start_time_millis) {
      const sm = update.startTimeMillis || (update as any).start_time_millis;
      race.start_time_millis = typeof sm === "number" ? sm : Number(sm);
    }
  }

  /**
   * Applies standings updates to a heat and updates driver rankings map.
   */
  static applyStandingsUpdate(
    update: IStandingsUpdate,
    heat: any,
    driverRankings: Map<string, number>,
  ): void {
    if (heat && update && update.updates) {
      heat.standings = [];
      update.updates.forEach((u: any) => {
        if (u.objectId) {
          heat.standings.push(u.objectId);
          driverRankings.set(u.objectId, u.rank || 0);
          const driverData = heat.heatDrivers.find(
            (d: any) => d.objectId === u.objectId,
          );
          if (driverData) {
            driverData.rank = u.rank || 0;
            driverData.gapLeader = u.gapLeader || 0;
            driverData.gapPosition = u.gapPosition || 0;
            driverData.gapLeaderF1 = u.gapLeaderF1 || 0;
            driverData.gapPositionF1 = u.gapPositionF1 || 0;
            driverData.gapLeaderLaps = u.gapLeaderLaps || 0;
            driverData.gapPositionLaps = u.gapPositionLaps || 0;
            driverData.lapsDownLeader = u.lapsDownLeader || 0;
            driverData.lapsDownPosition = u.lapsDownPosition || 0;
            driverData.lapsLed = u.lapsLed ?? u.laps_led ?? 0;
            if (
              u.trackCalls !== undefined ||
              (u as any).track_calls !== undefined
            ) {
              driverData.trackCalls =
                u.trackCalls ?? (u as any).track_calls ?? 0;
            }
          }
        }
      });
    }
  }

  /**
   * Syncs lap data to a target heat across the collection of all heats.
   */
  static syncTargetHeat(
    heat: any,
    allHeats: any[],
    lap: any,
    driverData: any,
    isFalseStart: boolean,
    segmentsCopy: any[],
    lapTotalTime: any,
  ): void {
    if (!allHeats || allHeats.length === 0) return;

    const targetHeat = allHeats.find(
      (h) =>
        (heat.objectId && h.objectId === heat.objectId) ||
        h.heatNumber === heat.heatNumber,
    );
    if (targetHeat && targetHeat.heatDrivers) {
      const targetHd = DriverMatchingUtils.findDriverForLap(
        targetHeat.heatDrivers,
        lap,
      );
      if (targetHd && targetHd !== driverData) {
        if (isFalseStart) {
          if (
            lap.adjustedLapCount !== undefined &&
            lap.adjustedLapCount !== null &&
            !isNaN(lap.adjustedLapCount)
          ) {
            targetHd.adjustedLapCount = lap.adjustedLapCount;
          }
        } else if (typeof targetHd.addLapTime === "function") {
          targetHd.addLapTime(
            lap.lapNumber!,
            lap.lapTime!,
            lap.averageLapTime!,
            lap.medianLapTime!,
            lap.bestLapTime!,
            lap.adjustedLapCount!,
            lap.driverId ?? undefined,
            lap.isDrift ?? undefined,
            lap.type ?? undefined,
            segmentsCopy,
            lap.countTowardsRecords !== false,
            lapTotalTime,
          );
          if (lap.fuelLevel != null && targetHd.participant) {
            targetHd.participant.fuelLevel = Number(lap.fuelLevel);
          }
        }
        if (lap.flag !== undefined && lap.flag !== null) {
          targetHd.flag = lap.flag;
        }
      }
    }
  }
}
