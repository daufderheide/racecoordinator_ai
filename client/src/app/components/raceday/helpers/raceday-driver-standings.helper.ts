import * as QRCode from "qrcode";
import { ColumnDefinition } from "@app/components/raceday/column_definition";
import { HeatConverter } from "@app/converters/heat.converter";
import { Driver } from "@app/models/driver";
import {
  getOverallScoreFormat,
  OverallRanking,
} from "@app/models/overall_scoring";
import { Role } from "@app/models/role";
import { RaceState } from "@app/proto/antigravity";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { Heat } from "@app/race/heat";
import {
  DriverProjection,
  RacePredictionRecord,
} from "@app/services/race-prediction.service";
import { TeammateUtils } from "@app/utils/teammate.utils";

export class RacedayDriverStandingsHelper {
  static updateLeaderboardEntries(host: any): void {
    const rankingMethod = host.race?.overall_scoring?.rankingMethod;
    const isTime =
      rankingMethod && rankingMethod !== OverallRanking.OR_LAP_COUNT;

    const incoming = (host.participants || [])
      .filter((p: any) => p && p.driver && !Driver.isEmpty(p.driver))
      .map((p: any) => ({
        name: p.team?.name || p.driver?.nickname || p.driver?.name || "Unknown",
        score: p.rankValue || 0,
        rank: p.rank || 0,
        entityId: p.driver?.entity_id || p.driver?.name || "",
        isTime: isTime,
      }));

    const existingIds = new Set(
      host.leaderboardEntries.map((e: any) => e.entityId),
    );

    for (let i = 0; i < host.leaderboardEntries.length; i++) {
      const id = host.leaderboardEntries[i].entityId;
      const updated = incoming.find((e: any) => e.entityId === id);
      if (updated) {
        host.leaderboardEntries[i] = updated;
      }
    }

    for (const entry of incoming) {
      if (!existingIds.has(entry.entityId)) {
        host.leaderboardEntries.push(entry);
        existingIds.add(entry.entityId);
      }
    }

    const incomingIds = new Set(incoming.map((e: any) => e.entityId));
    host.leaderboardEntries = host.leaderboardEntries.filter((e: any) =>
      incomingIds.has(e.entityId),
    );
  }

  static updateGroupLeaderboardEntries(host: any): void {
    const rankingMethod = host.race?.overall_scoring?.rankingMethod;
    const isTime =
      rankingMethod && rankingMethod !== OverallRanking.OR_LAP_COUNT;

    const incoming = (host.groupParticipants || [])
      .filter((p: any) => p && p.driver && !Driver.isEmpty(p.driver))
      .map((p: any) => ({
        name: p.team?.name || p.driver?.nickname || p.driver?.name || "Unknown",
        score: p.rankValue || 0,
        rank: p.rank || 0,
        entityId: p.driver?.entity_id || p.driver?.name || "",
        isTime: isTime,
      }));

    const existingIds = new Set(
      host.groupLeaderboardEntries.map((e: any) => e.entityId),
    );

    for (let i = 0; i < host.groupLeaderboardEntries.length; i++) {
      const id = host.groupLeaderboardEntries[i].entityId;
      const updated = incoming.find((e: any) => e.entityId === id);
      if (updated) {
        host.groupLeaderboardEntries[i] = updated;
      }
    }

    for (const entry of incoming) {
      if (!existingIds.has(entry.entityId)) {
        host.groupLeaderboardEntries.push(entry);
        existingIds.add(entry.entityId);
      }
    }

    const incomingIds = new Set(incoming.map((e: any) => e.entityId));
    host.groupLeaderboardEntries = host.groupLeaderboardEntries.filter(
      (e: any) => incomingIds.has(e.entityId),
    );
  }

  static syncHeatDriversWithParticipants(host: any): void {
    if (!host.heat?.heatDrivers) return;
    host.heat.heatDrivers.forEach((hd: any) => {
      const d = hd.actualDriver || hd.driver;
      const driverId = d?.entity_id || d?.name;
      const teamId = hd.participant?.team?.entity_id;
      const match =
        host.participants?.find((p: any) => {
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
          ? host.participants?.find((p: any) => p.team?.entity_id === teamId)
          : undefined);
      if (match) {
        if (match.rank) {
          hd.overallRank = match.rank;
        }
        if (hd.participant) {
          Object.assign(hd.participant, match);
        }
        hd.participant = match;
        hd.overallGapLeader = match.gapLeader;
        hd.overallGapPosition = match.gapPosition;
        hd.overallGapLeaderF1 = match.gapLeaderF1;
        hd.overallGapPositionF1 = match.gapPositionF1;
        hd.overallGapLeaderLaps = match.gapLeaderLaps;
        hd.overallGapPositionLaps = match.gapPositionLaps;
        hd.overallLapsDownLeader = match.lapsDownLeader;
        hd.overallLapsDownPosition = match.lapsDownPosition;
        if (match.fuelLevel != null) {
          if (hd.participant) {
            hd.participant.fuelLevel = match.fuelLevel;
          }
          if (hd.laneIndex != null) {
            host.updateLaneFuel?.(
              hd.laneIndex,
              match.fuelLevel,
              !!hd.isRefueling,
            );
          }
        }
      }
    });
  }

  static getLeaderboardPosition(host: any, entry: any): number {
    const sorted = [...host.leaderboardEntries].sort((a, b) => {
      if (a.rank !== b.rank) {
        if (a.rank === 0) return 1;
        if (b.rank === 0) return -1;
        return a.rank - b.rank;
      }
      return a.name.localeCompare(b.name);
    });
    const pos = sorted.findIndex((e) => e.entityId === entry.entityId);
    return pos >= 0 ? pos : 0;
  }

  static getLeaderboardScoreFormat(host: any, entry: any): string {
    if (!entry) return "1.0-0";
    if (entry.isTime !== undefined) {
      return entry.isTime ? "1.3-3" : "1.2-2";
    }
    const rankingMethod = host.race?.overall_scoring?.rankingMethod;
    return getOverallScoreFormat(rankingMethod);
  }

  static sortHeatDrivers(host: any): void {
    if (!host.heat) return;

    host.sortedHeatDrivers = [...host.heat.heatDrivers].sort(
      (a: any, b: any) => a.laneIndex - b.laneIndex,
    );

    const laneViewWidget = host.currentRacedayLayout?.widgets?.find(
      (w: any) =>
        w.widgetType === "lane-view" || w.widgetType === "lane-column",
    );
    const sortByStandings =
      laneViewWidget?.customSettings?.["sortByStandings"] !== undefined
        ? laneViewWidget.customSettings["sortByStandings"]
        : laneViewWidget?.customSettings?.["bindingMode"] !== undefined
          ? laneViewWidget.customSettings["bindingMode"] === "position"
          : host.settingsService?.getSettings?.()?.sortByStandings;

    if (sortByStandings && !host.isDragging) {
      const ranked = [...host.heat.heatDrivers].sort((a: any, b: any) => {
        let idxA = host.heat?.standings?.indexOf(a.objectId) ?? -1;
        let idxB = host.heat?.standings?.indexOf(b.objectId) ?? -1;
        if (idxA === -1) idxA = 999;
        if (idxB === -1) idxB = 999;
        return idxA - idxB;
      });
      host.driverVisualPositions.clear();
      ranked.forEach((hd: any, i: number) =>
        host.driverVisualPositions.set(hd.laneIndex, i),
      );
    } else {
      host.driverVisualPositions.clear();
      host.sortedHeatDrivers.forEach((hd: any, i: number) =>
        host.driverVisualPositions.set(hd.laneIndex, i),
      );
    }

    if (host.latestPredictionRecord) {
      if (host.applyPredictionsToDrivers) {
        host.applyPredictionsToDrivers(host.latestPredictionRecord);
      } else {
        RacedayDriverStandingsHelper.applyPredictionsToDrivers(
          host,
          host.latestPredictionRecord,
        );
      }
    } else {
      if (host.loadPredictionsForCurrentRace) {
        host.loadPredictionsForCurrentRace();
      } else {
        RacedayDriverStandingsHelper.loadPredictionsForCurrentRace(host);
      }
    }
    host.cdr?.markForCheck();
  }

  static loadPredictionsForCurrentRace(host: any): void {
    if (host.isUIEditorMode?.() || !host.predictionService) return;
    const raceId = host.race?.entity_id || "current";
    const isDemo = host.race?.practice || false;
    host.predictionService
      .getRacePredictions(raceId, isDemo)
      .subscribe((record: any) => {
        if (record) {
          host.latestPredictionRecord = record;
          if (host.applyPredictionsToDrivers) {
            host.applyPredictionsToDrivers(record);
          } else {
            RacedayDriverStandingsHelper.applyPredictionsToDrivers(
              host,
              record,
            );
          }
          host.cdr?.markForCheck();
        }
      });
  }

  static clearDriverPredictions(allDrivers: any[]): void {
    for (const hd of allDrivers) {
      if (!hd) continue;
      hd.winProbability = undefined;
      hd.projectedRank = undefined;
      hd.projectedLaps = undefined;
      if (hd.driver) {
        hd.driver.winProbability = undefined;
        hd.driver.projectedRank = undefined;
        hd.driver.projectedLaps = undefined;
      }
      if (hd.participant) {
        hd.participant.winProbability = undefined;
        hd.participant.projectedRank = undefined;
        hd.participant.projectedLaps = undefined;
      }
    }
  }

  static applyProjectionToDriver(
    hd: any,
    projectionsMap: Map<string, DriverProjection>,
  ): void {
    const d = hd.actualDriver || hd.driver?.driver || hd.driver;
    const team = hd.participant?.team || hd.driver?.team;
    const teamId = team?.entity_id;
    const syntheticTeamId = teamId ? `t_${teamId}` : undefined;
    const teamName = team?.name;

    const driverId =
      d?.entity_id ||
      hd.participant?.driver?.entity_id ||
      hd.participant?.driver_id ||
      hd.participant?.objectId ||
      hd.objectId;
    const driverName = d?.name || hd.participant?.driver?.name || d?.nickname;

    const keysToTry = [
      syntheticTeamId,
      teamId,
      teamName,
      driverId,
      driverName,
    ].filter(Boolean) as string[];

    let proj: DriverProjection | undefined;
    for (const k of keysToTry) {
      if (projectionsMap.has(k)) {
        proj = projectionsMap.get(k);
        break;
      }
    }

    if (proj) {
      hd.winProbability = proj.win_probability;
      hd.projectedRank = proj.projected_rank;
      hd.projectedLaps = proj.projected_laps;
      if (hd.driver) {
        hd.driver.winProbability = proj.win_probability;
        hd.driver.projectedRank = proj.projected_rank;
        hd.driver.projectedLaps = proj.projected_laps;
      }
      if (hd.participant) {
        hd.participant.winProbability = proj.win_probability;
        hd.participant.projectedRank = proj.projected_rank;
        hd.participant.projectedLaps = proj.projected_laps;
      }
    }
  }

  static applyPredictionsToDrivers(
    host: any,
    record: RacePredictionRecord,
  ): void {
    if (!record) return;
    const allDrivers = [
      ...(host.sortedHeatDrivers || []),
      ...(host.heat?.heatDrivers || []),
    ];

    let actualLapsRun = 0;
    if (host.participants && host.participants.length > 0) {
      for (const p of host.participants) {
        if (p.totalLaps) {
          actualLapsRun += p.totalLaps;
        }
      }
    } else {
      for (const hd of allDrivers) {
        if (hd && hd.totalLaps !== undefined) {
          actualLapsRun += hd.totalLaps;
        } else if (hd && hd.lapTimes) {
          actualLapsRun += hd.lapTimes.length;
        }
      }
    }

    const snapshot =
      actualLapsRun > 0 &&
      record.realtime_snapshots &&
      record.realtime_snapshots.length > 0
        ? record.realtime_snapshots[record.realtime_snapshots.length - 1]
        : record.pre_race;

    if (!snapshot || !snapshot.projected_standings) {
      RacedayDriverStandingsHelper.clearDriverPredictions(allDrivers);
      return;
    }

    const projectionsMap = new Map<string, DriverProjection>();
    for (const proj of snapshot.projected_standings) {
      if (proj.driver_id) {
        projectionsMap.set(proj.driver_id, proj);
      }
      if (proj.driver_name) {
        projectionsMap.set(proj.driver_name, proj);
      }
    }

    for (const hd of allDrivers) {
      if (!hd) continue;
      RacedayDriverStandingsHelper.applyProjectionToDriver(hd, projectionsMap);
    }
    host.cdr?.markForCheck();
  }

  static generateAllLaneQrCodes(host: any): void {
    if (!host.serverUrlBase || !host.track?.lanes) return;
    host.track.lanes.forEach((_: any, index: number) => {
      host.getLaneQrCodeUrl(index);
    });
  }

  static getLaneQrCodeUrl(host: any, laneIndex: number): string {
    const cached = host.laneQrCodeCache?.get(laneIndex);
    if (cached) return cached;
    const isEditor =
      typeof host.isUIEditorMode === "function"
        ? host.isUIEditorMode()
        : Boolean(host.isUIEditorMode);
    if (isEditor) {
      return host.qrCodeUrl || "";
    }
    if (!host.serverUrlBase || host.generatingLaneQrCodes?.has(laneIndex)) {
      return "";
    }
    host.generatingLaneQrCodes?.add(laneIndex);
    const activeTheme = host.themeService?.getActiveTheme?.();
    const targetThemeId =
      activeTheme?.driver_station_theme_id || "driver_station_theme_rc_ai";
    QRCode.toDataURL(
      `${host.serverUrlBase}/driver-station/${laneIndex + 1}?themeId=${encodeURIComponent(targetThemeId)}`,
      {
        margin: 1,
      },
    )
      .then((dataUrl) => {
        host.laneQrCodeCache?.set(laneIndex, dataUrl);
        host.generatingLaneQrCodes?.delete(laneIndex);
        if (!host.isDestroyed) {
          host.cdr?.markForCheck();
        }
      })
      .catch((err) => {
        host.generatingLaneQrCodes?.delete(laneIndex);
        host.logger?.error("Lane QR Code generation failed", err);
      });
    return "";
  }

  static getDriverViewQrCodeUrl(
    host: any,
    hd: DriverHeatData | number,
  ): string {
    const isEditor =
      typeof host.isUIEditorMode === "function"
        ? host.isUIEditorMode()
        : Boolean(host.isUIEditorMode);
    if (isEditor) {
      return host.qrCodeUrl || "";
    }
    if (typeof hd === "number") {
      return host.getLaneQrCodeUrl(hd);
    }
    if (!hd) return "";
    const entityId =
      hd.actualDriver?.entity_id ||
      hd.driver?.entity_id ||
      hd.actualDriver?.name ||
      hd.driver?.name ||
      hd.participant?.team?.entity_id ||
      hd.participant?.team?.name ||
      hd.participant?.objectId ||
      hd.objectId;
    if (!entityId) return "";

    let dataUrl = host.driverViewQrCodeCache?.get(entityId);
    if (!dataUrl) {
      host.driverViewQrCodeCache?.set(entityId, "generating");
      const activeTheme = host.themeService?.getActiveTheme?.();
      const targetThemeId =
        activeTheme?.driver_view_theme_id ||
        activeTheme?.driver_station_theme_id ||
        "driver_station_theme_rc_ai";
      QRCode.toDataURL(
        `${host.serverUrlBase}/driver-view/${encodeURIComponent(entityId)}?themeId=${encodeURIComponent(targetThemeId)}`,
        {
          margin: 1,
        },
      )
        .then((url) => {
          host.driverViewQrCodeCache?.set(entityId, url);
          if (!host.isDestroyed) {
            host.cdr?.markForCheck();
          }
        })
        .catch((err) => {
          host.logger?.error("Driver View QR Code generation failed", err);
          host.driverViewQrCodeCache?.delete(entityId);
        });
    }
    return dataUrl === "generating" ? "" : dataUrl || "";
  }

  static isTeamDriverSwapActive(
    host: any,
    hd: DriverHeatData,
    col: ColumnDefinition,
  ): boolean {
    if (host.isUIEditorMode?.() || host.isLayoutCustomizing) {
      return false;
    }
    const prop = col.propertyName || "";
    const baseKey = prop.split("_")[0];
    const isTeamOrName =
      host.isNameProperty?.(prop) || baseKey === "participant.team.name";
    if (!isTeamOrName) {
      return false;
    }
    const isTeam = host.isTeam
      ? host.isTeam(hd)
      : RacedayDriverStandingsHelper.isTeam(host, hd);
    const isSwapDisabled = host.isDriverSwapDisabled
      ? host.isDriverSwapDisabled(hd)
      : RacedayDriverStandingsHelper.isDriverSwapDisabled(host, hd);
    if (!isTeam || isSwapDisabled) {
      return false;
    }
    if (host.authService?.currentRole === Role.VIEWER) {
      return false;
    }
    return true;
  }

  static isLapCountColumnClickable(host: any, col: ColumnDefinition): boolean {
    if (host.isUIEditorMode?.() || host.isLayoutCustomizing) {
      return false;
    }
    if (
      col.propertyName !== "lapCount" &&
      col.propertyName !== "physicalLapCount" &&
      col.propertyName !== "totalTime" &&
      col.propertyName !== "overallTotalTime"
    ) {
      return false;
    }
    return true;
  }

  static isTeam(host: any, hd: DriverHeatData | any): boolean {
    return TeammateUtils.isTeam(hd, !!host.race?.practice);
  }

  static getTeammates(host: any, hd: DriverHeatData | any): any[] {
    return TeammateUtils.getTeammates(hd, host.allDrivers, {
      isPractice: !!host.race?.practice,
      participants: host.participants,
      emptyLaneLabel: host.translationService?.translate("RD_EMPTY_LANE"),
    });
  }

  static onTeammateChange(host: any, hd: DriverHeatData, event: any): void {
    const driverId =
      typeof event === "string" ? event : (event?.target?.value ?? event);
    const lane = hd.laneIndex;

    host.dataService?.changeActualDriver(lane, driverId).subscribe({
      next: () => {
        host.logger?.debug(`Teammate changed for lane ${lane} to ${driverId}`);
      },
      error: (err: any) => {
        host.logger?.error(`Error changing teammate for lane ${lane}:`, err);
        host.ackModalTitle = "RD_ERR_DRIVER_CHANGE_TITLE";
        host.ackModalMessage = err.error || "RD_ERR_DRIVER_CHANGE_MESSAGE";
        host.showAckModal = true;
      },
    });
  }

  static onNextHeatTeammateChange(
    host: any,
    hd: DriverHeatData,
    event: any,
    heatNumber: number,
  ): void {
    const driverId =
      typeof event === "string" ? event : (event?.target?.value ?? event);
    const lane = hd.laneIndex;
    host.dataService
      ?.changeActualDriverForHeat(heatNumber, lane, driverId)
      .subscribe({
        next: () => {
          host.logger?.debug(
            `Teammate changed for heat ${heatNumber} lane ${lane} to ${driverId}`,
          );
        },
        error: (err: any) => {
          host.logger?.error(
            `Error changing teammate for heat ${heatNumber} lane ${lane}:`,
            err,
          );
          host.ackModalTitle = "RD_ERR_DRIVER_CHANGE_TITLE";
          host.ackModalMessage = err.error || "RD_ERR_DRIVER_CHANGE_MESSAGE";
          host.showAckModal = true;
          if (event?.target) {
            event.target.value =
              hd.actualDriver?.entity_id || hd.driver?.entity_id;
          }
        },
      });
  }

  static isDriverSwapDisabled(host: any, hd: any): boolean {
    if (host.isLayoutCustomizing || host.isUIEditorMode?.()) {
      return true;
    }
    const race = host.raceService?.getRace();
    if (!race?.team_options?.require_pit_stop_change_driver) {
      return false;
    }
    if (
      host.raceState !== RaceState.RACING &&
      host.raceState !== RaceState.STARTING
    ) {
      return false;
    }
    const location = host.carLocations?.get(hd.laneIndex);
    if (location === undefined) return false;
    return location === 1 || location >= 2000;
  }

  static onCellClick(
    host: any,
    hd: DriverHeatData,
    col: ColumnDefinition,
    event: MouseEvent,
  ): void {
    if (host.isLayoutCustomizing || host.isUIEditorMode?.()) {
      return;
    }
    if (
      col.propertyName === "lapCount" ||
      col.propertyName === "physicalLapCount" ||
      col.propertyName === "totalTime" ||
      col.propertyName === "overallTotalTime"
    ) {
      if (
        (col.propertyName === "lapCount" ||
          col.propertyName === "physicalLapCount") &&
        event.shiftKey
      ) {
        event.preventDefault();
        RacedayDriverStandingsHelper.updateUserLaps(
          host,
          hd,
          host.LAP_ADJUSTMENT_AMOUNT,
        );
      } else if (
        (col.propertyName === "lapCount" ||
          col.propertyName === "physicalLapCount") &&
        event.altKey
      ) {
        event.preventDefault();
        RacedayDriverStandingsHelper.updateUserLaps(
          host,
          hd,
          -host.LAP_ADJUSTMENT_AMOUNT,
        );
      } else {
        if (!host.track) {
          host.track = host.race?.track || host.raceService?.getRace()?.track;
        }
        host.selectedHeatDriver = hd;
        host.isMenuModeForAddLap = false;
        host.showAddLapSectionsDialog = true;
        host.cdr?.markForCheck();
      }
    }
  }

  static updateUserLaps(host: any, hd: DriverHeatData, amount: number): void {
    const newUserLaps = (hd.userLaps || 0) + amount;
    host.dataService?.updateUserLaps(hd.laneIndex, newUserLaps).subscribe({
      next: (response: any) => {
        if (response && response.adjustedLapCount !== undefined) {
          hd.adjustedLapCount = response.adjustedLapCount;
          host.cdr?.markForCheck();
        }
      },
      error: (error: any) => {
        host.logger?.error("Error updating user laps:", error);
      },
    });
  }

  static handleNumberLapSections(host: any, event: number): void {
    if (!host.selectedHeatDriver) return;
    const hd = host.selectedHeatDriver;
    host.dataService?.updateUserLaps(hd.laneIndex, event).subscribe({
      next: (response: any) => {
        if (response && response.adjustedLapCount !== undefined) {
          hd.adjustedLapCount = response.adjustedLapCount;
          hd.userLaps = event;
          if (response.totalTime !== undefined) {
            hd.totalTime = response.totalTime;
          }
          host.cdr?.markForCheck();
        }
      },
      error: (error: any) => {
        host.logger?.error("Error updating user laps from dialog:", error);
      },
    });
  }

  static handleBatchLapSections(host: any, updates: any[]): void {
    host.dataService?.updateBatchUserLaps(updates).subscribe({
      next: () => {
        for (const u of updates) {
          const targetHeat = host.heats?.find(
            (h: any) => h.heatNumber === u.heatNumber,
          );
          if (targetHeat && targetHeat.heatDrivers) {
            const hd = targetHeat.heatDrivers[u.laneIndex];
            if (hd) {
              hd.userLaps = u.userLaps;
              if (u.userTime !== undefined) {
                hd.userTime = u.userTime;
              }
              host.cdr?.markForCheck();
            }
          }
        }
      },
      error: (error: any) => {
        host.logger?.error(
          "Error updating batch user laps from dialog:",
          error,
        );
      },
    });
  }

  static handleCurrentHeatDriverLapSections(host: any, event: any): void {
    if (!host.selectedHeatDriver) return;
    const hd = host.selectedHeatDriver;
    const userLaps = event.userLaps;
    const userTime = event.userTime ?? 0;
    host.dataService
      ?.updateUserLaps(hd.laneIndex, userLaps, userTime)
      .subscribe({
        next: (response: any) => {
          if (response && response.adjustedLapCount !== undefined) {
            hd.adjustedLapCount = response.adjustedLapCount;
            hd.userLaps = userLaps;
            hd.userTime = userTime;
            if (response.totalTime !== undefined) {
              hd.totalTime = response.totalTime;
            }
            host.cdr?.markForCheck();
          }
        },
        error: (error: any) => {
          host.logger?.error("Error updating user laps from dialog:", error);
        },
      });
  }

  static handleHeatDriverLapSections(host: any, event: any): void {
    const { heatNumber, laneIndex, userLaps, userTime } = event;
    host.dataService
      ?.updateHeatUserLaps(heatNumber, laneIndex, userLaps, userTime ?? 0)
      .subscribe({
        next: (response: any) => {
          const targetHeat = host.heats?.find(
            (h: any) => h.heatNumber === heatNumber,
          );
          if (targetHeat && targetHeat.heatDrivers) {
            const hd = targetHeat.heatDrivers[laneIndex];
            if (hd && response && response.adjustedLapCount !== undefined) {
              hd.adjustedLapCount = response.adjustedLapCount;
              hd.userLaps = userLaps;
              if (userTime !== undefined) {
                hd.userTime = userTime;
              }
              if (response.totalTime !== undefined) {
                hd.totalTime = response.totalTime;
              }
              host.cdr?.markForCheck();
            }
          }
        },
        error: (error: any) => {
          host.logger?.error(
            "Error updating heat user laps from dialog:",
            error,
          );
        },
      });
  }

  static onAddLapSectionsConfirm(host: any, event: any): void {
    host.showAddLapSectionsDialog = false;
    if (typeof event === "number") {
      RacedayDriverStandingsHelper.handleNumberLapSections(host, event);
    } else if (event && event.isBatch) {
      RacedayDriverStandingsHelper.handleBatchLapSections(host, event.updates);
    } else if (
      event &&
      typeof event === "object" &&
      "userLaps" in event &&
      !("heatNumber" in event)
    ) {
      RacedayDriverStandingsHelper.handleCurrentHeatDriverLapSections(
        host,
        event,
      );
    } else {
      RacedayDriverStandingsHelper.handleHeatDriverLapSections(host, event);
    }
  }

  static resetLane(host: any, lane: number, event: Event): void {
    event.stopPropagation();
    host.dataService?.resetLaneHeatData(lane).subscribe({
      next: () => {
        host.logger?.debug(`Reset lane ${lane}`);
        RacedayDriverStandingsHelper.applyLocalLaneReset(host, lane);
      },
      error: (err: any) => {
        host.logger?.error(`Error resetting lane ${lane}:`, err);
        host.ackModalTitle = "RD_ERR_RESET_LANE_TITLE";
        host.ackModalMessage = err.error || "RD_ERR_RESET_LANE_MESSAGE";
        host.showAckModal = true;
      },
    });
  }

  static resetAllLanes(host: any, event: Event): void {
    event.stopPropagation();
    host.dataService?.resetLaneHeatData("all").subscribe({
      next: () => {
        host.logger?.debug(`Reset all lanes`);
        RacedayDriverStandingsHelper.applyLocalLaneReset(host, "all");
      },
      error: (err: any) => {
        host.logger?.error(`Error resetting all lanes:`, err);
        host.ackModalTitle = "RD_ERR_RESET_ALL_TITLE";
        host.ackModalMessage = err.error || "RD_ERR_RESET_ALL_MESSAGE";
        host.showAckModal = true;
      },
    });
  }

  static applyLocalLaneReset(host: any, lane: number | "all"): void {
    const resetDriver = (dhd: any) => {
      if (typeof dhd?.reset === "function") {
        dhd.reset();
      } else if (dhd) {
        if (Array.isArray(dhd.laps)) dhd.laps = [];
        if (Array.isArray(dhd.lapTimes)) dhd.lapTimes = [];
        if (Array.isArray(dhd.lapsWithDetails)) dhd.lapsWithDetails = [];
        if (Array.isArray(dhd._lapsWithDetails)) dhd._lapsWithDetails = [];
        dhd.lapCount = 0;
        dhd.bestLapTime = 0;
        dhd.lastLapTime = 0;
        dhd.averageLapTime = 0;
        dhd.medianLapTime = 0;
        dhd.adjustedLapCount = 0;
      }
    };

    const heats = [host.heat, host.raceService?.getCurrentHeat()].filter(
      (h): h is Heat => !!h && !!h.heatDrivers,
    );

    for (const h of heats) {
      if (lane === "all") {
        h.heatDrivers.forEach((d: any) => resetDriver(d));
      } else if (lane >= 0) {
        const target = h.heatDrivers.find(
          (d: any) => d && d.laneIndex === lane,
        );
        if (target) {
          resetDriver(target);
        } else if (lane < h.heatDrivers.length && h.heatDrivers[lane]) {
          resetDriver(h.heatDrivers[lane]);
        }
      }
    }

    HeatConverter.clearCache();
    host.cdr?.markForCheck();
  }
}
