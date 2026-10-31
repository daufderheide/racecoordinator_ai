import { CommonModule } from "@angular/common";
import { Component, input, ViewEncapsulation } from "@angular/core";
import { RacedayFormatUtils } from "@app/components/raceday/utils/raceday-format.utils";
import { FinishMethod } from "@app/models/heat_scoring";
import { AbsoluteWidgetNode, HighlightLapStyle } from "@app/models/settings";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { isColorLight } from "@app/utils/color.utils";
import {
  formatTimerDisplay,
  TimerFormatOptions,
} from "@app/utils/timer-format.utils";

@Component({
  standalone: true,
  selector: "app-raceday-progress-gauge",
  templateUrl: "./raceday-progress-gauge.component.html",
  styleUrls: ["./raceday-progress-gauge.component.css"],
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule],
})
export class RacedayProgressGaugeComponent {
  parent = input<any>(undefined);
  widget = input<AbsoluteWidgetNode | null>(null);

  gaugeType = input<"heat-progress" | "fuel" | undefined>(undefined);
  gaugeStyle = input<"thermometer" | "bar" | undefined>(undefined);
  orientation = input<"vertical" | "horizontal" | undefined>(undefined);
  bindingMode = input<string | undefined>(undefined);
  targetIndex = input<number | undefined>(undefined);

  get effectiveSettings(): Record<string, any> {
    return this.widget()?.customSettings || {};
  }

  get effectiveGaugeType(): "heat-progress" | "fuel" {
    return (
      this.gaugeType() || this.effectiveSettings["gaugeType"] || "heat-progress"
    );
  }

  get effectiveGaugeStyle(): "thermometer" | "bar" {
    return (
      this.gaugeStyle() || this.effectiveSettings["gaugeStyle"] || "thermometer"
    );
  }

  get effectiveOrientation(): "vertical" | "horizontal" {
    return (
      this.orientation() || this.effectiveSettings["orientation"] || "vertical"
    );
  }

  get effectiveBindingMode(): string {
    return (
      this.bindingMode() || this.effectiveSettings["bindingMode"] || "hostLane"
    );
  }

  get effectiveTargetIndex(): number {
    return this.targetIndex() ?? this.effectiveSettings["targetIndex"] ?? 0;
  }

  get targetDriver(): DriverHeatData | undefined {
    const parent = this.parent();
    const mode = this.effectiveBindingMode;
    const targetIdx = this.effectiveTargetIndex;
    const drivers: DriverHeatData[] =
      parent?.sortedHeatDrivers ||
      parent?.heatDrivers ||
      parent?.heat?.heatDrivers ||
      (parent?.driverData ? [parent.driverData] : []);

    if (mode === "hostLane") {
      const effLane = parent?.activeLaneIndex ?? parent?.laneIndex ?? targetIdx;
      if (
        parent?.driverData &&
        (parent?.laneIndex === effLane || parent?.activeLaneIndex === effLane)
      ) {
        return parent.driverData;
      }
      return drivers.find((d) => d.laneIndex === effLane) || drivers[effLane];
    }

    if (mode === "hostDriver") {
      const targetId = parent?.activeDriverId ?? parent?.driverId;
      if (targetId) {
        return drivers.find(
          (d) =>
            d.objectId === targetId ||
            d.participant?.objectId === targetId ||
            d.driver?.entity_id === targetId,
        );
      }
      return drivers[0];
    }

    return drivers.find((d) => d.laneIndex === targetIdx) || drivers[targetIdx];
  }

  get isEmptyDriver(): boolean {
    const d = this.targetDriver;
    if (typeof this.parent()?.isEmptyDriver === "boolean") {
      return this.parent().isEmptyDriver;
    }
    if (typeof this.parent()?.isEmptyDriver === "function") {
      return !d || this.parent().isEmptyDriver(d);
    }
    return !d || RacedayFormatUtils.isEmptyDriver(d);
  }

  get isTimedFinish(): boolean {
    const parent = this.parent();
    const finishMethod =
      parent?.finishMethod ??
      parent?.race?.heat_scoring?.finishMethod ??
      (parent?.race as any)?.heatScoring?.finishMethod ??
      FinishMethod.Lap;
    return (
      finishMethod === FinishMethod.Timed ||
      finishMethod === "Timed" ||
      finishMethod === "TIMED" ||
      finishMethod === 1
    );
  }

  get percentage(): number {
    if (this.effectiveGaugeType === "fuel") {
      if (this.isEmptyDriver) return 0;
      const d = this.targetDriver;
      const fuel = d?.participant?.fuelLevel;
      if (fuel !== null && fuel !== undefined) {
        return Math.min(100, Math.max(0, fuel));
      }
      if (d?.initialFuelLevel != null && d.initialFuelLevel > 0) {
        return Math.min(100, Math.max(0, d.initialFuelLevel));
      }
      return 0;
    }

    // Heat progress
    if (this.isEmptyDriver) return 0;
    const parent = this.parent();
    const finishValue =
      parent?.finishValue ??
      parent?.race?.heat_scoring?.finishValue ??
      (parent?.race as any)?.heatScoring?.finishValue ??
      0;
    if (!finishValue) return 0;

    if (this.isTimedFinish) {
      const time = parent?.time ?? 0;
      return Math.min(100, Math.max(0, (time / finishValue) * 100));
    } else {
      const laps = this.targetDriver?.lapCount || 0;
      return Math.min(100, Math.max(0, (laps / finishValue) * 100));
    }
  }

  get labelText(): string {
    if (this.effectiveGaugeType === "fuel") {
      return this.isEmptyDriver ? "--%" : `${Math.round(this.percentage)}%`;
    }

    if (this.isEmptyDriver) return "--";

    const parent = this.parent();
    const finishValue =
      parent?.finishValue ??
      parent?.race?.heat_scoring?.finishValue ??
      (parent?.race as any)?.heatScoring?.finishValue ??
      0;

    if (this.isTimedFinish) {
      const time = parent?.time ?? 0;
      const timerOpts: TimerFormatOptions = {
        format:
          (this.effectiveSettings["timeDisplayFormat"] as any) || "dynamic",
        subsecondMode:
          (this.effectiveSettings["timeSubsecondMode"] as any) || "threshold",
        subsecondThreshold:
          this.effectiveSettings["timeSubsecondThreshold"] ?? 10,
        subsecondDecimals: this.effectiveSettings["timeSubsecondDecimals"] ?? 2,
      };
      return formatTimerDisplay(time, timerOpts);
    }

    const laps = this.targetDriver?.lapCount || 0;
    const remaining = Math.max(0, finishValue - laps);
    const lapDecimals = Math.max(
      0,
      Math.min(3, this.effectiveSettings["lapDecimalPlaces"] ?? 0),
    );
    return remaining.toFixed(lapDecimals);
  }

  get effectiveFontSize(): number | null {
    const custom = this.effectiveSettings["fontSize"];
    return custom && custom > 0 ? custom : null;
  }

  get effectiveFontFamily(): string | null {
    return this.effectiveSettings["fontFamily"] || null;
  }

  get isDriverStation(): boolean {
    return Boolean(
      this.parent()?.isDriverStation ||
      this.parent()?.isDriverStationLayout ||
      this.widget()?.id?.startsWith("widget-ds-"),
    );
  }

  get effectiveFillColor(): string {
    return (
      this.effectiveSettings["fillColor"] ||
      this.parent()?.activeLaneForegroundColor ||
      this.parent()?.foregroundColor ||
      "currentColor"
    );
  }

  get effectiveForegroundColor(): string {
    if (this.effectiveSettings["textColor"]) {
      return this.effectiveSettings["textColor"];
    }
    if (this.isDriverStation) {
      return "#ffffff";
    }
    return (
      this.parent()?.activeLaneForegroundColor ||
      this.parent()?.foregroundColor ||
      "currentColor"
    );
  }

  get effectiveBorderColor(): string {
    if (this.effectiveSettings["borderColor"]) {
      return this.effectiveSettings["borderColor"];
    }
    return this.effectiveForegroundColor;
  }

  get showLabel(): boolean {
    return this.effectiveSettings["showLabel"] !== false;
  }

  get isHighlighted(): boolean {
    if (
      this.highlightLapStyle === "none" ||
      this.effectiveSettings["highlightRowOnLap"] === false
    ) {
      return false;
    }
    const driverId = this.targetDriver?.objectId;
    const participantId = this.targetDriver?.participant?.objectId;
    const entityDriverId =
      this.targetDriver?.actualDriver?.entity_id ||
      this.targetDriver?.driver?.entity_id;
    const hd = this.parent()?.highlightedDrivers;
    if (hd) {
      if (driverId && hd.has(driverId)) return true;
      if (participantId && hd.has(participantId)) return true;
      if (entityDriverId && hd.has(entityDriverId)) return true;
    }
    if (
      this.parent()?.isDriverStation &&
      this.parent()?.activeLaneIndex !== undefined
    ) {
      const drivers: DriverHeatData[] =
        this.parent()?.sortedHeatDrivers ||
        this.parent()?.heatDrivers ||
        this.parent()?.heat?.heatDrivers ||
        [];
      const hostDriver = drivers.find(
        (d) => d.laneIndex === this.parent()?.activeLaneIndex,
      );
      if (hostDriver) {
        if (hostDriver.objectId && hd?.has(hostDriver.objectId)) return true;
        if (
          hostDriver.participant?.objectId &&
          hd?.has(hostDriver.participant.objectId)
        ) {
          return true;
        }
        const hostEntityDriverId =
          hostDriver.actualDriver?.entity_id || hostDriver.driver?.entity_id;
        if (hostEntityDriverId && hd?.has(hostEntityDriverId)) {
          return true;
        }
      }
    }
    return false;
  }

  get highlightLapStyle(): HighlightLapStyle {
    if (this.effectiveSettings["highlightLapStyle"]) {
      return this.effectiveSettings["highlightLapStyle"];
    }
    if (this.effectiveSettings["highlightRowOnLap"] === false) {
      return "none";
    }
    if (this.parent()?.isDriverStation) {
      return this.parent()?.highlightLapStyle || "full-glow";
    }
    return this.parent()?.highlightLapStyle || "classic";
  }

  get isLightBackground(): boolean {
    return isColorLight(this.effectiveFillColor);
  }
}
