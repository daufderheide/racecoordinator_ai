import { RacedayFormatUtils } from "@app/components/raceday/utils/raceday-format.utils";
import { RaceState } from "@app/proto/antigravity";
import { DriverHeatData } from "@app/race/driver_heat_data";

export interface DriverStationFormatContext {
  isEmptyDriver: boolean;
  standingsPosition?: number;
  overallPosition?: number;
  laneIndex: number;
  hasLapData: boolean;
  driverData?: DriverHeatData;
  translationService: { translate: (key: string) => string };
  decimalPipe: {
    transform: (value: any, digitsInfo?: string) => string | null;
  };
  race?: any;
  track?: any;
  raceFlagService: {
    getFlagType: () => any;
    getFlagUrl: (flag: any) => string;
  };
  raceState?: RaceState;
  getDriverRanking: (id: string) => number | undefined;
  getDriverOverallRanking: (d: any) => number | undefined;
}

export function formatDriverStationValue(
  ctx: DriverStationFormatContext,
  propertyName: string,
  value: any,
  hd: DriverHeatData,
  column?: any,
  anchor?: string,
  _widgetSettings?: any,
): string {
  if (!propertyName) return "";
  if (propertyName === "rankHeat") {
    return !ctx.isEmptyDriver && ctx.standingsPosition
      ? String(ctx.standingsPosition)
      : "--";
  }
  if (propertyName === "rankOverall") {
    return !ctx.isEmptyDriver && ctx.overallPosition
      ? String(ctx.overallPosition)
      : "--";
  }
  if (propertyName === "laneNumber") {
    return String(ctx.laneIndex + 1);
  }
  if (propertyName === "driver.nickname" || propertyName === "driver.name") {
    if (ctx.isEmptyDriver) {
      return ctx.translationService.translate("RD_EMPTY_LANE");
    }
    return (
      ctx.driverData?.driver?.nickname || ctx.driverData?.driver?.name || ""
    );
  }
  if (propertyName === "lapCount") {
    return ctx.hasLapData
      ? ctx.decimalPipe.transform(ctx.driverData?.lapCount, "1.0-2") || "--"
      : "--";
  }
  if (propertyName === "lastLapTime") {
    return !ctx.isEmptyDriver && ctx.driverData?.lastLapTime
      ? ctx.decimalPipe.transform(ctx.driverData.lastLapTime, "1.3-3") ||
          "--.---"
      : "--.---";
  }
  if (propertyName === "gapLeader") {
    return !ctx.isEmptyDriver && ctx.driverData?.gapLeader
      ? ctx.decimalPipe.transform(ctx.driverData.gapLeader, "1.3-3") || "--.---"
      : "--.---";
  }
  if (propertyName === "bestLapTime") {
    return !ctx.isEmptyDriver && ctx.driverData?.bestLapTime
      ? ctx.decimalPipe.transform(ctx.driverData.bestLapTime, "1.3-3") ||
          "--.---"
      : "--.---";
  }
  const formatCtx = {
    translate: (k: string) => ctx.translationService.translate(k),
    getRace: () => ctx.race,
    getTrack: () => ctx.track,
    getDriverRanking: (id: string) => ctx.getDriverRanking(id),
    getDriverOverallRanking: (d: any) => ctx.getDriverOverallRanking(d),
    getFlagType: () => ctx.raceFlagService.getFlagType(),
    getFlagUrl: (flag: any) => ctx.raceFlagService.getFlagUrl(flag),
    getFullUrl: (url: any) => url || "",
    getImageSetUrl: () => "",
    isRaceOver: () => ctx.raceState === RaceState.RACE_OVER,
    getRaceState: () => ctx.raceState,
  };
  return RacedayFormatUtils.formatValue(
    propertyName,
    value,
    hd,
    column,
    formatCtx as any,
    anchor,
  );
}
