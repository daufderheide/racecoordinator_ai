/* eslint-disable max-lines */
/* eslint-disable max-lines-per-function */
import {
  AnchorPoint,
  ColumnDefinition,
} from "@app/components/raceday/column_definition";
import { Driver } from "@app/models/driver";
import { Race } from "@app/models/race";
import { Track } from "@app/models/track";
import { RaceFlag } from "@app/proto/antigravity";
import { DriverHeatData } from "@app/race/driver_heat_data";

export interface FormatContext {
  translate: (key: string) => string;
  getRace: () => Race | undefined;
  getTrack: () => Track | undefined;
  getDriverRanking: (objectId: string) => number | undefined;
  getFlagType: () => any;
  getFlagUrl: (flag: any) => string;
  getFullUrl: (url: string | undefined) => string;
  getImageSetUrl: (hd: DriverHeatData, propertyName: string) => string;
}

export class RacedayFormatUtils {
  static isEmptyDriver(hd: DriverHeatData | any): boolean {
    if (!hd) return true;
    if (hd.actualDriver && !Driver.isEmpty(hd.actualDriver)) return false;
    if (hd.actualDriver && Driver.isEmpty(hd.actualDriver)) return true;

    const nestedDriver = hd.driver?.driver || hd.participant?.driver;
    if (nestedDriver && !Driver.isEmpty(nestedDriver)) return false;
    if (nestedDriver && Driver.isEmpty(nestedDriver)) return true;

    if (hd.driver && !hd.driver.driver) return Driver.isEmpty(hd.driver);
    return true;
  }

  static getPropertyValue(
    heatDriver: DriverHeatData,
    propertyPath: string,
  ): any {
    if (!heatDriver) return undefined;
    const parts = propertyPath.split(".").map((part) => part.split("_")[0]);
    let value: any = heatDriver;
    for (const part of parts) {
      if (value === undefined || value === null) return undefined;
      value = value[part];
    }
    return value;
  }

  static formatValue(
    propertyName: string,
    value: any,
    hd: DriverHeatData,
    column: ColumnDefinition | undefined,
    ctx: FormatContext,
  ): string {
    if (!propertyName) return "";
    const baseKey = propertyName.split("_")[0];

    if (RacedayFormatUtils.isEmptyDriver(hd)) {
      if (
        baseKey === "seed" ||
        baseKey === "rankHeat" ||
        baseKey === "rankOverall"
      ) {
        return "";
      }
      if (baseKey === "gapLeader" || baseKey === "gapPosition") {
        return "--.---";
      }
    }

    if (
      baseKey.includes("LapTime") ||
      baseKey === "reactionTime" ||
      baseKey === "totalTime"
    ) {
      return value > 0 ? value.toFixed(3) : "--.---";
    } else if (baseKey === "gapLeader" || baseKey === "gapPosition") {
      if (value === 0) return "--.---";
      const sign = value > 0 ? "+" : "";
      return sign + value.toFixed(3);
    } else if (baseKey === "lapCount") {
      if (
        value === null ||
        value === undefined ||
        (value === 0 && hd.reactionTime === 0)
      )
        return "--";
      return value.toFixed(2);
    } else if (baseKey === "driver.name") {
      if (RacedayFormatUtils.isEmptyDriver(hd))
        return ctx.translate("RD_EMPTY_LANE");
      const d = hd.actualDriver || (hd.driver as any)?.driver || hd.driver;
      return d?.name || "";
    } else if (baseKey === "driver.nickname") {
      if (RacedayFormatUtils.isEmptyDriver(hd))
        return ctx.translate("RD_EMPTY_LANE");
      const d = hd.actualDriver || (hd.driver as any)?.driver || hd.driver;
      return d?.nickname || d?.name || "";
    } else if (baseKey === "participant.team.name") {
      if (RacedayFormatUtils.isEmptyDriver(hd)) {
        if (
          column &&
          column.layout[AnchorPoint.CenterCenter] === propertyName
        ) {
          return ctx.translate("RD_EMPTY_LANE");
        }
        return "";
      }
      return hd.participant?.team?.name || (hd.driver as any)?.team?.name || "";
    } else if (baseKey === "participant.fuelLevel") {
      return value !== undefined ? value.toFixed(1) : "--.-";
    } else if (baseKey === "fuelCapacity") {
      const race = ctx.getRace();
      const track = ctx.getTrack();
      const capacity = track?.hasDigitalFuel()
        ? race?.digital_fuel_options?.capacity
        : race?.fuel_options?.capacity;
      return capacity !== undefined ? capacity.toFixed(1) : "--.-";
    } else if (baseKey === "fuelPercentage") {
      const level = hd.participant?.fuelLevel ?? (hd.driver as any)?.fuelLevel;
      const race = ctx.getRace();
      const track = ctx.getTrack();
      const capacity = track?.hasDigitalFuel()
        ? race?.digital_fuel_options?.capacity
        : race?.fuel_options?.capacity;
      if (level !== undefined && capacity !== undefined && capacity > 0) {
        const percentage = Math.round((level / capacity) * 100);
        return percentage + "%";
      }
      return "--%";
    } else if (baseKey === "driver.avatarUrl") {
      return ctx.getFullUrl(value);
    } else if (baseKey === "seed") {
      const seed = hd.participant?.seed ?? (hd.driver as any)?.seed;
      return seed ? `(${seed})` : "--";
    } else if (baseKey === "rankHeat") {
      if (RacedayFormatUtils.isEmptyDriver(hd)) return "";
      const rank = ctx.getDriverRanking(hd.objectId);
      return rank ? `${rank}` : "--";
    } else if (baseKey === "rankOverall") {
      if (RacedayFormatUtils.isEmptyDriver(hd)) return "";
      const rank = hd.participant?.rank ?? (hd.driver as any)?.rank;
      return rank ? `${rank}` : "--";
    } else if (baseKey === "flag") {
      const flag =
        value === RaceFlag.UNKNOWN_FLAG || value === 0
          ? ctx.getFlagType()
          : value;
      return ctx.getFlagUrl(flag);
    } else if (baseKey === "segmentTime") {
      const parts = propertyName.split("_");
      const index = parts.length > 1 ? parseInt(parts[1], 10) : 0;

      let useIndex = true;
      let segmentCount = 0;
      if (column) {
        segmentCount = Object.values(column.layout).filter((v) =>
          v?.startsWith("segmentTime"),
        ).length;
        if (segmentCount <= 1) {
          useIndex = false;
        }
      } else if (index === 0) {
        useIndex = false;
      }

      if (useIndex) {
        let actualIndex = index;
        if (propertyName === "segmentTime" && column) {
          const anchorOrder = [
            AnchorPoint.TopLeft,
            AnchorPoint.TopCenter,
            AnchorPoint.TopRight,
            AnchorPoint.CenterLeft,
            AnchorPoint.CenterCenter,
            AnchorPoint.CenterRight,
            AnchorPoint.BottomLeft,
            AnchorPoint.BottomCenter,
            AnchorPoint.BottomRight,
          ];
          let counter = 0;
          for (const anchor of anchorOrder) {
            const p = column.layout[anchor];
            if (p && p.split("_")[0] === "segmentTime") {
              if (p === "segmentTime") {
                actualIndex = counter;
                break;
              }
              counter++;
            }
          }
        }

        const segmentVal = hd.currentLapSegments[actualIndex];
        return segmentVal !== undefined && segmentVal > 0
          ? segmentVal.toFixed(3)
          : "--.---";
      } else {
        return hd.lastSegmentTime > 0
          ? hd.lastSegmentTime.toFixed(3)
          : "--.---";
      }
    } else if (baseKey === "mph" || baseKey === "kph" || baseKey === "fph") {
      const lastLapTime = hd.lastLapTime;
      const track = ctx.getTrack();
      const lane = track?.lanes?.[hd.laneIndex];
      const length = lane?.length;

      if (lastLapTime > 0 && length !== undefined && length > 0) {
        const fph = (length / lastLapTime) * 3600;
        if (baseKey === "fph") return fph.toFixed(0);

        const mph = fph / 5280;
        if (baseKey === "mph") return mph.toFixed(2);

        const kph = mph * 1.609344;
        if (baseKey === "kph") return kph.toFixed(2);
      }
      return "--.--";
    } else if (
      baseKey.startsWith("imageset") ||
      baseKey === "fuel-gauge-builtin"
    ) {
      return ctx.getImageSetUrl(hd, propertyName);
    }

    return value?.toString() ?? "";
  }

  static formatColumnValue(
    heatDriver: DriverHeatData,
    column: ColumnDefinition,
    propertyName: string | undefined,
    ctx: FormatContext,
  ): string {
    const prop = propertyName || column.propertyName;
    if (prop === column.propertyName && column.formatter) {
      return column.formatter(
        RacedayFormatUtils.getPropertyValue(heatDriver, prop),
        heatDriver,
        column,
      );
    }
    const value = RacedayFormatUtils.getPropertyValue(heatDriver, prop);
    return RacedayFormatUtils.formatValue(prop, value, heatDriver, column, ctx);
  }
}
