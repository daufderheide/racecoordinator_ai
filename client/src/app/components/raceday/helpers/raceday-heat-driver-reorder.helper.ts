import { CdkDragDrop } from "@angular/cdk/drag-drop";
import { Driver } from "@app/models/driver";
import { RaceParticipant } from "@app/models/race_participant";
import { RaceState } from "@app/proto/antigravity";
import { DriverHeatData } from "@app/race/driver_heat_data";

export class RacedayHeatDriverReorderHelper {
  static getDriverVisualPosition(host: any, hd: DriverHeatData): number {
    return host.driverVisualPositions.get(hd.laneIndex) ?? 0;
  }

  static isSingleHeatSolo(host: any): boolean {
    return host.race?.heat_rotation_type === "SingleHeatSolo";
  }

  static isSingleHeat(host: any): boolean {
    return host.race?.heat_rotation_type === "SingleHeat";
  }

  static canSwapLanes(host: any): boolean {
    if (RacedayHeatDriverReorderHelper.isSingleHeatSolo(host)) return true;
    if (RacedayHeatDriverReorderHelper.isSingleHeat(host)) {
      return host.raceState === RaceState.NOT_STARTED;
    }
    return false;
  }

  static onDrop(host: any, event: CdkDragDrop<DriverHeatData[]>): void {
    host.draggingLane = null;
    host.isDragging = false;
    if (
      !RacedayHeatDriverReorderHelper.canSwapLanes(host) ||
      event.previousIndex === event.currentIndex ||
      !host.sortedHeatDrivers
    ) {
      return;
    }

    const fromHd = event.item.data as DriverHeatData;
    const toHd = host.sortedHeatDrivers.find(
      (hd: DriverHeatData) =>
        RacedayHeatDriverReorderHelper.getDriverVisualPosition(host, hd) ===
        event.currentIndex,
    );

    if (!fromHd || !toHd) return;

    host.dataService
      .changeLane(fromHd.laneIndex, toHd.laneIndex)
      .subscribe((success: boolean) => {
        if (!success) {
          host.logger.error("Failed to change lane");
        }
      });
  }

  static onDragStarted(host: any, laneIndex: number): void {
    host.isDragging = true;
    host.draggingLane = laneIndex;
    host.cdr.markForCheck();
  }

  static onDragOver(host: any, laneIndex: number): void {
    if (RacedayHeatDriverReorderHelper.canSwapLanes(host) && host.isDragging) {
      host.draggingLane = laneIndex;
    }
  }

  static onDragEnded(host: any): void {
    host.draggingLane = null;
    host.isDragging = false;
  }

  static isLaneOccupied(hd: DriverHeatData): boolean {
    return !!hd && !!hd.driver && !Driver.isEmpty(hd.driver);
  }

  static detectShortcutKey(host: any): void {
    const isMac =
      navigator.platform.toUpperCase().indexOf("MAC") >= 0 ||
      navigator.userAgent.toUpperCase().indexOf("MAC") >= 0;
    if (isMac) {
      host.startResumeShortcut = "Cmd+S";
      host.pauseShortcut = "Cmd+P";
      host.nextHeatShortcut = "Cmd+N";
      host.restartHeatShortcut = "Cmd+R";
      host.skipHeatShortcut = "Cmd+F5";
      host.deferHeatShortcut = "Cmd+F6";
    }
  }

  static loadRaceData(host: any): void {
    host.logger.debug("RacedayComponent: Loading race data...");

    const race = host.raceService.getRace();
    if (race) {
      host.logger.debug("RacedayComponent: using selected race:", race);
      host.logger.debug(
        "RacedayComponent: Race tracks/lanes:",
        race.track,
        race.track?.lanes,
      );
      const isNewRace =
        !host.race ||
        host.race.entity_id !== race.entity_id ||
        (host.race as any)?.current_event_race_index !==
          (race as any)?.current_event_race_index;

      host.race = race;
      host.track = race.track;
      host.preloadCountdownAudio();

      const state =
        (race as any)?.state ?? (race as any)?.raceState ?? host.raceState;
      const isEnded =
        (race as any)?.is_finished === true ||
        (race as any)?.isFinished === true ||
        state === RaceState.RACE_OVER ||
        (race as any)?.state_class_name?.includes("RaceOver") ||
        (host.raceHasEnded &&
          state !== RaceState.NOT_STARTED &&
          state !== RaceState.STARTING &&
          state !== RaceState.RACING);

      if (isEnded) {
        host.handleRaceEndedState();
      } else {
        host.raceHasEnded = false;
        if (state !== undefined && state !== RaceState.UNKNOWN_STATE) {
          host.raceState = state;
        }
        if (isNewRace) {
          host.syncNewRaceTimers(race);
        } else {
          const remaining = (race as any)?.auto_advance_remaining_seconds;
          if (remaining !== undefined && remaining !== null) {
            host.autoAdvanceRemaining = remaining;
            if (remaining > 0) {
              host.time = remaining;
            }
          }
        }
      }

      if (
        race.entity_id &&
        !host.route.snapshot?.queryParams?.["themeId"] &&
        !host.themeService?.getTransientThemeId?.() &&
        typeof host.themeService?.activateForRace === "function"
      ) {
        host.themeService.activateForRace(race.entity_id, race.theme_id);
      }
      host.latestPredictionRecord = null;
      host.laneQrCodeCache.clear();
      host.generatingLaneQrCodes.clear();

      if (host.currentRacedayLayout && host.currentRacedayLayout.widgets) {
        host.layout = JSON.parse(JSON.stringify(host.currentRacedayLayout));
      } else {
        host.layout = host.getDefaultLayout();
      }

      host.updateScale();
      host.loadColumns();
      host.initializeHeat();

      host.syncStartingCountdownLamps(race);
    } else {
      host.logger.debug("RacedayComponent: Waiting for race data...");
    }
    if (!host.isDestroyed) {
      host.cdr.markForCheck();
    }
  }

  static initializeHeat(host: any): void {
    if (!host.track) {
      host.track = host.race?.track || host.raceService.getRace()?.track;
    }

    const heats = host.raceService.getHeats() || host.heats;
    if (heats && heats.length > 0) {
      host.totalHeats = heats.length;
    }

    if (!host.track) return;

    const currentHeat = host.raceService.getCurrentHeat() || host.heat;
    if (currentHeat) {
      const prevHeatNumber = host.heat?.heatNumber;
      host.heat = currentHeat;

      if (host.heat && host.heat.heatNumber !== prevHeatNumber) {
        host.hasRacedInCurrentHeat = false;
      }

      if (host.heat && host.heat.group !== undefined) {
        host.currentGroup = host.heat.group;
      }

      host.driverRankings.clear();
      if (host.heat) {
        if (host.heat.standings && host.heat.standings.length > 0) {
          host.heat.standings.forEach((sid: string, index: number) =>
            host.driverRankings.set(sid, index + 1),
          );
        } else if (host.heat.heatDrivers) {
          host.heat.heatDrivers.forEach((hd: DriverHeatData, index: number) =>
            host.driverRankings.set(hd.objectId, index + 1),
          );
        }
      }

      host.sortHeatDrivers();
      if (
        host.heat?.heatDrivers &&
        host.fuelAudioTracker.isFuelRace(host.race, host.track)
      ) {
        const hasStarted = !!host.heat?.started || host.hasRacedInCurrentHeat;
        host.heat.heatDrivers.forEach((hd: DriverHeatData, index: number) => {
          const lane = hd.laneIndex ?? index;
          const fuel =
            hd.participant?.fuelLevel != null &&
            (hd.participant.fuelLevel > 0 || hasStarted)
              ? hd.participant.fuelLevel
              : hd.initialFuelLevel != null && hd.initialFuelLevel > 0
                ? hd.initialFuelLevel
                : (hd.participant?.fuelLevel ?? null);
          if (fuel != null) {
            if (hd.participant) {
              hd.participant.fuelLevel = fuel;
            }
            host.updateLaneFuel(lane, fuel, !!hd.isRefueling);
          }
        });
      }
      if (host.isDriverView) {
        host.checkDriverStatus();
      }
      host.cdr.markForCheck();
    } else {
      if (host.isDriverView) {
        host.checkDriverStatus();
      }
    }
  }

  static checkDriverStatus(host: any): void {
    host.isRacingInCurrentHeat = false;
    const currentHeat = host.currentHeat;
    const driverId = host.activeDriverId;
    if (currentHeat && driverId) {
      const targetId = decodeURIComponent(driverId);
      const heatDrivers = currentHeat.heatDrivers || [];
      const driverDataIndex = heatDrivers.findIndex((hd: any) => {
        const actualEntityId =
          hd.actualDriver?.entity_id || hd.actualDriver?.model?.entityId;
        const actualName = hd.actualDriver?.name;
        const driverEntityId =
          hd.driver?.entity_id ||
          hd.driver?.model?.entityId ||
          (hd.driver as any)?.driver?.model?.entityId ||
          (hd.driver as any)?.driver?.entity_id;
        const driverName = (hd.driver as any)?.driver?.name || hd.driver?.name;
        const driverNickname =
          (hd.driver as any)?.driver?.nickname || hd.driver?.nickname;
        const teamEntityId =
          hd.participant?.team?.entity_id ||
          hd.participant?.team?.model?.entityId;
        const teamName = hd.participant?.team?.name;
        const participantId = hd.participant?.objectId;
        const hdObjectId = hd.objectId;

        return (
          (actualEntityId && actualEntityId === targetId) ||
          (actualName && actualName === targetId) ||
          (driverEntityId && driverEntityId === targetId) ||
          (driverName && driverName === targetId) ||
          (driverNickname && driverNickname === targetId) ||
          (teamEntityId && teamEntityId === targetId) ||
          (teamName && teamName === targetId) ||
          (participantId && participantId === targetId) ||
          (hdObjectId && hdObjectId === targetId)
        );
      });

      if (driverDataIndex >= 0) {
        host.isRacingInCurrentHeat = true;
        const matchingHd = heatDrivers[driverDataIndex];
        host.driverViewLaneIndex = matchingHd?.laneIndex ?? driverDataIndex;
      } else {
        host.driverViewLaneIndex = undefined;
      }
    } else {
      host.driverViewLaneIndex = undefined;
    }
  }

  static getDriverParticipant(
    host: any,
    hd: DriverHeatData,
  ): RaceParticipant | undefined {
    if (!hd) return undefined;
    const d = hd.actualDriver || hd.driver;
    const driverId = d?.entity_id || d?.name;
    const teamId = hd.participant?.team?.entity_id;
    return (
      host.participants?.find((p: RaceParticipant) => {
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
        ? host.participants?.find(
            (p: RaceParticipant) => p.team?.entity_id === teamId,
          )
        : undefined) ||
      hd.participant
    );
  }

  static getDriverOverallRanking(
    host: any,
    hd: DriverHeatData,
  ): number | undefined {
    if (!hd) return undefined;
    const d = hd.actualDriver || hd.driver;
    const driverId = d?.entity_id || d?.name;
    const teamId = hd.participant?.team?.entity_id;

    const entry =
      (driverId
        ? host.leaderboardEntries?.find((e: any) => e.entityId === driverId)
        : undefined) ||
      (teamId
        ? host.leaderboardEntries?.find((e: any) => e.entityId === teamId)
        : undefined);
    if (entry && entry.rank > 0) return entry.rank;

    const match =
      host.participants?.find((p: RaceParticipant) => {
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
        ? host.participants?.find(
            (p: RaceParticipant) => p.team?.entity_id === teamId,
          )
        : undefined);
    if (match?.rank && match.rank > 0) return match.rank;

    return (
      (hd as any).overallRank ??
      hd.participant?.rank ??
      (hd.driver as any)?.rank
    );
  }

  static getDriverGroupRanking(
    host: any,
    hd: DriverHeatData,
  ): number | undefined {
    if (!hd) return undefined;
    const d = hd.actualDriver || hd.driver;
    const driverId = d?.entity_id || d?.name;
    const teamId = hd.participant?.team?.entity_id;

    const entry =
      (driverId
        ? host.groupLeaderboardEntries?.find(
            (e: any) => e.entityId === driverId,
          )
        : undefined) ||
      (teamId
        ? host.groupLeaderboardEntries?.find((e: any) => e.entityId === teamId)
        : undefined);
    if (entry && entry.rank > 0) return entry.rank;

    const match =
      host.groupParticipants?.find((p: any) => {
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
        ? host.groupParticipants?.find((p: any) => p.team?.entity_id === teamId)
        : undefined);
    if (match?.groupRank && match.groupRank > 0) return match.groupRank;
    if (match?.rank && match.rank > 0) return match.rank;
    return (hd as any).groupRank ?? (hd.participant as any)?.groupRank;
  }
}
