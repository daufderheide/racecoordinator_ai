import { CommonModule } from "@angular/common";
import { Component, input, ViewEncapsulation } from "@angular/core";
import { RacedayGhostPacingComponent } from "@app/components/raceday/components/raceday-ghost-pacing/raceday-ghost-pacing.component";
import { RacedayFormatUtils } from "@app/components/raceday/utils/raceday-format.utils";
import { RacedayLayoutUtils } from "@app/components/raceday/utils/raceday-layout.utils";
import {
  AbsoluteWidgetNode,
  LaneColumnWidgetSettings,
} from "@app/models/settings";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { GhostBenchmarkType } from "@app/services/ghost-pacing.service";

@Component({
  standalone: true,
  selector: "app-raceday-lane-column",
  templateUrl: "./raceday-lane-column.component.html",
  styleUrls: ["./raceday-lane-column.component.css"],
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, TranslatePipe, RacedayGhostPacingComponent],
})
export class RacedayLaneColumnComponent {
  parent = input<any>(undefined);
  widget = input<AbsoluteWidgetNode | null>(null);

  get settings(): LaneColumnWidgetSettings {
    return (
      (this.widget()?.customSettings as LaneColumnWidgetSettings) ||
      ({} as LaneColumnWidgetSettings)
    );
  }

  get columnKey(): string {
    return this.settings.columnKey || "lastLapTime";
  }

  get bindingMode(): "lane" | "position" {
    return this.settings.bindingMode || "lane";
  }

  get targetIndex(): number {
    return this.settings.targetIndex ?? 0;
  }

  get layoutOrientation(): "vertical" | "horizontal" {
    return this.settings.layoutOrientation || "vertical";
  }

  get targetDriver(): DriverHeatData | undefined {
    const parent = this.parent();
    if (!parent) return undefined;

    const drivers: DriverHeatData[] =
      parent.sortedHeatDrivers ||
      parent.heatDrivers ||
      parent.heat?.heatDrivers ||
      [];

    if (this.bindingMode === "position") {
      if (parent.heat?.standings && parent.heat.standings.length > 0) {
        const targetId = parent.heat.standings[this.targetIndex];
        if (targetId) {
          const found = drivers.find((d) => d.objectId === targetId);
          if (found) return found;
        }
      }
      for (const d of drivers) {
        if (parent.getDriverVisualPosition?.(d) === this.targetIndex) {
          return d;
        }
      }
      return drivers[this.targetIndex];
    } else {
      return (
        drivers.find((d) => d.laneIndex === this.targetIndex) ||
        drivers[this.targetIndex]
      );
    }
  }

  get backgroundColor(): string {
    if (
      this.settings.useLaneColors === false &&
      this.settings.backgroundColor
    ) {
      return this.settings.backgroundColor;
    }
    const hd = this.targetDriver;
    const parent = this.parent();
    if (hd && parent?.getLaneColor) {
      const bg = parent.getLaneColor(hd, "background_color");
      if (bg) return bg;
    }
    const laneIdx =
      hd?.laneIndex ?? (this.bindingMode === "lane" ? this.targetIndex : 0);
    const trackLaneBg = parent?.track?.lanes?.[laneIdx]?.background_color;
    return trackLaneBg || this.settings.backgroundColor || "transparent";
  }

  get foregroundColor(): string {
    if (this.settings.useLaneColors === false && this.settings.textColor) {
      return this.settings.textColor;
    }
    const hd = this.targetDriver;
    const parent = this.parent();
    if (hd && parent?.getLaneColor) {
      const fg = parent.getLaneColor(hd, "foreground_color");
      if (fg) return fg;
    }
    const laneIdx =
      hd?.laneIndex ?? (this.bindingMode === "lane" ? this.targetIndex : 0);
    const trackLaneFg = parent?.track?.lanes?.[laneIdx]?.foreground_color;
    return trackLaneFg || this.settings.textColor || "#ffffff";
  }

  get borderColor(): string {
    if (this.settings.showBorder === false) return "transparent";
    if (this.settings.borderColor) return this.settings.borderColor;
    return this.foregroundColor;
  }

  get headerLabel(): string {
    if (this.settings.customLabel && this.settings.customLabel.trim()) {
      return this.settings.customLabel;
    }
    const key = this.columnKey;
    const parent = this.parent();
    if (parent?.getColumnLabel) {
      const colDef = parent.columns?.find(
        (c: any) => c.propertyName === key,
      ) || {
        propertyName: key,
        labelKey: `RD_COL_${key.toUpperCase()}`,
      };
      return parent.getColumnLabel(colDef);
    }
    return key;
  }

  get formattedValue(): string {
    const hd = this.targetDriver;
    const key = this.columnKey;
    const parent = this.parent();
    if (!hd) return "--";

    if (parent?.formatValue) {
      const colDef = parent.columns?.find((c: any) => c.propertyName === key);
      return parent.formatValue(
        key,
        RacedayFormatUtils.getPropertyValue(hd, key),
        hd,
        colDef,
        "center-center",
      );
    }

    const raw = RacedayFormatUtils.getPropertyValue(hd, key);
    return raw != null ? String(raw) : "--";
  }

  isLastLaps(): boolean {
    return this.columnKey === "lastLaps";
  }

  getLastLaps(): any[] {
    const parent = this.parent();
    const hd = this.targetDriver;
    if (!parent?.getLastLaps || !hd) return [];
    const colDef = parent.columns?.find(
      (c: any) => c.propertyName === "lastLaps",
    );
    return parent.getLastLaps(hd, colDef, "center-center") || [];
  }

  isImageProperty(): boolean {
    const key = this.columnKey;
    return (
      key === "driver.avatarUrl" ||
      key === "flag" ||
      key === "qrCode" ||
      key === "driverViewQrCode" ||
      key.startsWith("imageset_")
    );
  }

  getImageUrl(): string {
    const parent = this.parent();
    const hd = this.targetDriver;
    const key = this.columnKey;
    if (!parent || !hd) return "";

    if (key === "driver.avatarUrl") {
      const avatarUrl =
        hd.driver?.avatarUrl ||
        (hd.driver as any)?.avatar_url ||
        hd.participant?.driver?.avatarUrl ||
        (hd.participant?.driver as any)?.avatar_url;
      return avatarUrl ? parent.getFullUrl(avatarUrl) : "";
    }
    if (key === "flag") {
      return parent.getCurrentFlagUrl ? parent.getCurrentFlagUrl() : "";
    }
    if (key === "qrCode") {
      return parent.getLaneQrCodeUrl
        ? parent.getLaneQrCodeUrl(hd.laneIndex)
        : "";
    }
    if (key === "driverViewQrCode") {
      return parent.getDriverViewQrCodeUrl
        ? parent.getDriverViewQrCodeUrl(hd.laneIndex)
        : "";
    }
    if (key.startsWith("imageset_")) {
      const assetId = key.replace("imageset_", "");
      const asset = parent.findAssetById
        ? parent.findAssetById(assetId)
        : undefined;
      return parent.getSelectedImageFromSet
        ? parent.getSelectedImageFromSet(asset, null, hd)
        : "";
    }
    return "";
  }

  isPacingProperty(): boolean {
    return RacedayLayoutUtils.isPacingProperty(this.columnKey);
  }

  getPacingBenchmarkType(): GhostBenchmarkType {
    switch (this.columnKey) {
      case "ghostPacingPB":
        return "PERSONAL_BEST";
      case "ghostPacingPersonalAvg":
        return "PERSONAL_AVG";
      case "ghostPacingPersonalMedian":
        return "PERSONAL_MEDIAN";
      case "ghostPacingLeaderAvg":
        return "HEAT_LEADER_AVG";
      case "ghostPacingLeaderMedian":
        return "HEAT_LEADER_MEDIAN";
      case "ghostPacingLeaderBest":
        return "HEAT_LEADER";
      case "ghostPacing":
      default:
        return "LANE_RECORD";
    }
  }

  isDriftLap(): boolean {
    const hd = this.targetDriver;
    const parent = this.parent();
    if (!hd || !parent) return false;
    return Boolean(
      hd.isLastLapDrift &&
      (this.columnKey === "lastLapTime" || this.columnKey === "lapTime"),
    );
  }
}
