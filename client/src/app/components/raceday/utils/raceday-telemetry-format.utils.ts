import {
  AnchorPoint,
  ColumnDefinition,
} from "@app/components/raceday/column_definition";
import { DriverHeatData } from "@app/race/driver_heat_data";

import { FormatContext } from "./raceday-format.utils";

export class RacedayTelemetryFormatUtils {
  static formatFuelLevels(
    baseKey: string,
    value: any,
    hd: DriverHeatData,
    ctx: FormatContext,
  ): string {
    if (baseKey === "participant.fuelLevel") {
      return value !== undefined ? value.toFixed(1) : "--.-";
    }
    const race = ctx.getRace();
    const track = ctx.getTrack();
    const capacity =
      typeof track?.hasDigitalFuel === "function" && track.hasDigitalFuel()
        ? race?.digital_fuel_options?.capacity
        : race?.fuel_options?.capacity;

    if (baseKey === "fuelCapacity") {
      return capacity !== undefined ? capacity.toFixed(1) : "--.-";
    }
    if (baseKey === "fuelPercentage") {
      const level = hd.participant?.fuelLevel ?? (hd.driver as any)?.fuelLevel;
      if (level !== undefined && capacity !== undefined && capacity > 0) {
        return Math.round((level / capacity) * 100) + "%";
      }
      return "--%";
    }
    return "--.-";
  }

  static formatSegmentTime(
    propertyName: string,
    hd: DriverHeatData,
    column: ColumnDefinition | undefined,
    timeDecimals: number,
    timePlaceholder: string,
  ): string {
    const parts = propertyName.split("_");
    const index = parts.length > 1 ? parseInt(parts[1], 10) : 0;
    let useIndex = true;
    if (column) {
      const segmentCount = Object.values(column.layout).filter((v) =>
        v?.startsWith("segmentTime"),
      ).length;
      if (segmentCount <= 1) useIndex = false;
    } else if (index === 0) {
      useIndex = false;
    }

    if (useIndex) {
      return this.formatIndexedSegment(
        propertyName,
        hd,
        column,
        index,
        timeDecimals,
        timePlaceholder,
      );
    }
    return hd.lastSegmentTime > 0
      ? hd.lastSegmentTime.toFixed(timeDecimals)
      : timePlaceholder;
  }

  private static formatIndexedSegment(
    propertyName: string,
    hd: DriverHeatData,
    column: ColumnDefinition | undefined,
    index: number,
    timeDecimals: number,
    timePlaceholder: string,
  ): string {
    let actualIndex = index;
    if (propertyName === "segmentTime" && column) {
      actualIndex = this.findSegmentTimeIndex(column);
    }
    const segmentVal = hd.currentLapSegments[actualIndex];
    return segmentVal !== undefined && segmentVal > 0
      ? segmentVal.toFixed(timeDecimals)
      : timePlaceholder;
  }

  private static findSegmentTimeIndex(column: ColumnDefinition): number {
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
          return counter;
        }
        counter++;
      }
    }
    return counter;
  }

  static formatSpeed(
    baseKey: string,
    hd: DriverHeatData,
    ctx: FormatContext,
  ): string {
    const lastLapTime = hd.lastLapTime;
    const track = ctx.getTrack();
    const lane = track?.lanes?.[hd.laneIndex];
    const length = lane?.length;
    const scale =
      track?.track_scale && track.track_scale > 0 && track.track_scale <= 1
        ? track.track_scale
        : 1.0;

    if (lastLapTime > 0 && length !== undefined && length > 0) {
      const scaledLength = length / scale;
      const fph = (scaledLength / lastLapTime) * 3600;
      if (baseKey === "fph") return fph.toFixed(0);
      const mph = fph / 5280;
      if (baseKey === "mph") return mph.toFixed(2);
      const kph = mph * 1.609344;
      if (baseKey === "kph") return kph.toFixed(2);
    }
    return "--.--";
  }
}
