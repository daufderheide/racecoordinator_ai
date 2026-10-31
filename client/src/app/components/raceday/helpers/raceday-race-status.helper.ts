import { RacedayFormatUtils } from "@app/components/raceday/utils/raceday-format.utils";
import { FinishMethod, HeatScoring } from "@app/models/heat_scoring";
import { Role } from "@app/models/role";
import { RaceState } from "@app/proto/antigravity";
import { DriverHeatData } from "@app/race/driver_heat_data";

export class RacedayRaceStatusHelper {
  static isDriverFinished(
    host: any,
    hd: DriverHeatData,
    scoring?: HeatScoring | null | undefined,
  ): boolean {
    if (!hd) return false;
    if (hd.isFinished) return true;
    const sc: any =
      scoring || host.race?.heat_scoring || (host.race as any)?.heatScoring;
    const finishMethod = sc?.finishMethod ?? sc?.finish_method;
    const finishValue = sc?.finishValue ?? sc?.finish_value;
    if (
      (finishMethod === FinishMethod.Lap ||
        finishMethod === "Lap" ||
        finishMethod === 1) &&
      finishValue !== undefined &&
      finishValue > 0
    ) {
      return (hd.lapCount ?? 0) >= finishValue;
    }
    return false;
  }

  static areAllDriversFinished(host: any): boolean {
    if (
      host.raceState === RaceState.HEAT_OVER ||
      host.raceState === RaceState.RACE_OVER
    ) {
      return true;
    }
    if (
      host.raceState === RaceState.NOT_STARTED ||
      host.raceState === RaceState.STARTING
    ) {
      return false;
    }
    const currentHeat: any =
      host.currentHeat || host.raceService.getCurrentHeat() || host.heat;
    const drivers: DriverHeatData[] =
      currentHeat?.heatDrivers || currentHeat?.drivers || [];
    if (!drivers || drivers.length === 0) {
      return false;
    }
    const activeDrivers = drivers.filter(
      (d: any) => d && !RacedayFormatUtils.isEmptyDriver(d),
    );
    if (activeDrivers.length === 0) {
      return false;
    }
    return activeDrivers.every((d: DriverHeatData) => host.isDriverFinished(d));
  }

  static isRaceOver(host: any): boolean {
    return host.raceState === RaceState.RACE_OVER;
  }

  static getFlagUrl(host: any, flag: any): string {
    return host.raceFlagService.getFlagUrl(flag);
  }

  static getCurrentFlagUrl(host: any): string {
    return host.raceFlagService.getCurrentFlagUrl();
  }

  static getFullUrl(host: any, url: string | undefined): string {
    if (!url) return "";

    if (url.startsWith("http") || url.startsWith("data:")) {
      return url;
    }

    if (url.startsWith("assets/images/") || url.startsWith("/assets/images/")) {
      return url.startsWith("/") ? url.slice(1) : url;
    }

    const serverUrl = host.dataService.serverUrl;
    if (!serverUrl || serverUrl.includes("undefined")) return url;

    const base = serverUrl.endsWith("/") ? serverUrl.slice(0, -1) : serverUrl;
    const path = url.startsWith("/") ? url : "/" + url;

    return base + path;
  }

  static isRestartHeatDisabled(host: any): boolean {
    if (host.authService.currentRole === Role.VIEWER) {
      return true;
    }
    const s = host.raceState;
    return (
      s === RaceState.STARTING ||
      s === RaceState.RACING ||
      s === RaceState.NOT_STARTED ||
      s === RaceState.HEAT_OVER ||
      s === RaceState.RACE_OVER
    );
  }

  static isDeferHeatDisabled(host: any): boolean {
    if (host.authService.currentRole === Role.VIEWER) {
      return true;
    }
    const s = host.raceState;
    if (s !== RaceState.NOT_STARTED && s !== RaceState.UNKNOWN_STATE) {
      return true;
    }
    return host.totalHeats <= 1;
  }

  static isSkipHeatDisabled(host: any): boolean {
    if (host.authService.currentRole === Role.VIEWER) {
      return true;
    }
    const s = host.raceState;
    return (
      s === RaceState.STARTING ||
      s === RaceState.RACING ||
      s === RaceState.HEAT_OVER ||
      s === RaceState.RACE_OVER
    );
  }

  static isSkipRaceDisabled(host: any): boolean {
    if (host.authService.currentRole === Role.VIEWER) {
      return true;
    }
    const s = host.raceState;
    return (
      s === RaceState.STARTING ||
      s === RaceState.RACING ||
      s === RaceState.RACE_OVER
    );
  }

  static isAddLapDisabled(host: any): boolean {
    return host.authService.currentRole === Role.VIEWER;
  }

  static isModifyDisabled(host: any): boolean {
    if (host.authService.currentRole === Role.VIEWER) {
      return true;
    }
    return host.raceState === RaceState.RACE_OVER;
  }

  static isSaveDisabled(host: any): boolean {
    return (
      host.authService.currentRole === Role.VIEWER ||
      host.raceState === RaceState.RACING
    );
  }

  static onTrackPowerMainSelect(host: any, on: boolean): void {
    host.dataService.setMainPower(on).subscribe({
      error: (err: any) => host.logger.error("Error setting main power", err),
    });
  }

  static onTrackPowerLaneSelect(
    host: any,
    event: { lane: number; on: boolean },
  ): void {
    host.dataService.setLanePower(event.lane, event.on).subscribe({
      error: (err: any) => host.logger.error("Error setting lane power", err),
    });
  }

  static isMainPowerDisabled(host: any): boolean {
    if (host.authService.currentRole === Role.VIEWER) {
      return true;
    }
    const s = host.dataService.getSystemStateValue();
    const hasRelay = s ? !!s.hasMainRelay || !!s.hasPerLaneRelays : false;
    return !hasRelay;
  }

  static isStartResumeDisabled(host: any): boolean {
    if (host.authService.currentRole === Role.VIEWER) {
      return true;
    }
    const s = host.raceState;
    return (
      (!host.isInterfaceConnected &&
        s !== RaceState.NOT_STARTED &&
        s !== RaceState.UNKNOWN_STATE) ||
      s === RaceState.STARTING ||
      s === RaceState.RACING ||
      s === RaceState.HEAT_OVER ||
      s === RaceState.RACE_OVER
    );
  }

  static isPauseDisabled(host: any): boolean {
    if (host.authService.currentRole === Role.VIEWER) {
      return true;
    }
    const s = host.raceState;
    const RS = RaceState;

    const isAutoTimerActive =
      host.autoStartRemaining > 0 || host.autoAdvanceRemaining > 0;

    if (isAutoTimerActive) {
      return false;
    }

    return (
      !host.isInterfaceConnected ||
      s === RS.NOT_STARTED ||
      s === RS.PAUSED ||
      s === RS.HEAT_OVER ||
      s === RS.RACE_OVER
    );
  }

  static isNextHeatDisabled(host: any): boolean {
    if (host.authService.currentRole === Role.VIEWER) {
      return true;
    }
    const isEventWithNextRace =
      !!(host.race as any)?.is_event &&
      ((host.race as any)?.current_event_race_index ?? 0) + 1 <
        ((host.race as any)?.total_event_races ?? 0);

    return (
      host.raceState !== RaceState.HEAT_OVER &&
      !(host.raceState === RaceState.RACE_OVER && isEventWithNextRace)
    );
  }
}
