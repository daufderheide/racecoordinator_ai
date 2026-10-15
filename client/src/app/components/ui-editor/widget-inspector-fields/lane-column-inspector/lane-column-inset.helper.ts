import { InsetConfig } from "@app/models/settings";
import { CustomWidgetService } from "@app/services/custom-widget.service";
import { TranslationService } from "@app/services/translation.service";
import {
  formatTimerDisplay,
  TimerDisplayFormat,
  TimerSubsecondMode,
} from "@app/utils/timer-format.utils";

export interface InsetAnchorDef {
  key: string;
  labelKey: string;
  shortLabel: string;
}

export const INSET_ANCHOR_POSITIONS: readonly InsetAnchorDef[] = [
  { key: "top-left", labelKey: "UE_ANCHOR_top-left", shortLabel: "TL" },
  { key: "top-center", labelKey: "UE_ANCHOR_top-center", shortLabel: "TC" },
  { key: "top-right", labelKey: "UE_ANCHOR_top-right", shortLabel: "TR" },
  { key: "center-left", labelKey: "UE_ANCHOR_center-left", shortLabel: "CL" },
  { key: "center-right", labelKey: "UE_ANCHOR_center-right", shortLabel: "CR" },
  { key: "bottom-left", labelKey: "UE_ANCHOR_bottom-left", shortLabel: "BL" },
  {
    key: "bottom-center",
    labelKey: "UE_ANCHOR_bottom-center",
    shortLabel: "BC",
  },
  { key: "bottom-right", labelKey: "UE_ANCHOR_bottom-right", shortLabel: "BR" },
];

export class LaneColumnInsetHelper {
  public static extractDroppedWidgetKey(event: DragEvent): string | undefined {
    if (!event.dataTransfer) return undefined;
    try {
      const dataStr = event.dataTransfer.getData("application/json");
      if (dataStr) {
        const data = JSON.parse(dataStr);
        if (data.key) return data.key;
        if (data.type) {
          return data.type.startsWith("lane-col:")
            ? data.type.substring("lane-col:".length)
            : data.type;
        }
      }
    } catch (_) {}

    const text = event.dataTransfer.getData("text/plain");
    if (text) {
      return text.startsWith("lane-col:")
        ? text.substring("lane-col:".length)
        : text;
    }
    return undefined;
  }

  public static getWidgetDisplayName(
    key: string,
    availableColumns: { key: string; label: string }[],
    customWidgetService?: CustomWidgetService | null,
    translationService?: TranslationService,
  ): string {
    if (!key) return "";
    if (key.startsWith("custom:")) {
      const def = customWidgetService?.getWidgetDefinition(key);
      if (def?.manifest?.name) return def.manifest.name;
      return key.substring("custom:".length);
    }
    const colDef = availableColumns.find((c) => c.key === key);
    if (colDef && translationService) {
      return translationService.translate(colDef.label);
    }
    return colDef ? colDef.label : key;
  }

  public static getWidgetIcon(key: string): string {
    if (!key) return "add_circle_outline";
    if (key.startsWith("custom:")) return "extension";
    if (key.includes("Time") || key === "totalTime" || key === "segmentTime") {
      return "schedule";
    }
    if (key.includes("lap") || key.includes("Lap")) return "flag";
    if (key.includes("driver") || key.includes("participant")) return "person";
    if (key.includes("gap") || key.includes("rank") || key.includes("seed")) {
      return "leaderboard";
    }
    if (key.includes("fuel")) return "local_gas_station";
    if (key.includes("mph") || key.includes("kph") || key.includes("fph")) {
      return "speed";
    }
    if (key.startsWith("imageset_") || key === "flag" || key === "qrCode") {
      return "image";
    }
    return "widgets";
  }

  public static isCustomWidget(key: string | undefined): boolean {
    return Boolean(key && key.startsWith("custom:"));
  }

  public static isImageProperty(key: string | undefined): boolean {
    if (!key) return false;
    return (
      key.startsWith("imageset_") ||
      key === "driver.avatarUrl" ||
      key === "flag" ||
      key === "qrCode" ||
      key === "driverViewQrCode"
    );
  }

  public static getOrCreateInsetConfig(
    currentSettings: any,
    anchor: string,
  ): InsetConfig {
    if (!currentSettings["insetsConfig"]) {
      currentSettings["insetsConfig"] = {};
    }
    if (!currentSettings["insetsConfig"][anchor]) {
      currentSettings["insetsConfig"][anchor] = {};
    }
    return currentSettings["insetsConfig"][anchor];
  }

  public static getInsetTimeDisplayFormat(
    currentSettings: any,
    anchor: string,
  ): string {
    return (
      this.getOrCreateInsetConfig(currentSettings, anchor).timeDisplayFormat ||
      "dynamic"
    );
  }

  public static setInsetTimeDisplayFormat(
    currentSettings: any,
    anchor: string,
    val: string,
  ): void {
    this.getOrCreateInsetConfig(currentSettings, anchor).timeDisplayFormat =
      val as TimerDisplayFormat;
  }

  public static getInsetTimeSubsecondMode(
    currentSettings: any,
    anchor: string,
  ): string {
    return (
      this.getOrCreateInsetConfig(currentSettings, anchor).timeSubsecondMode ||
      "never"
    );
  }

  public static setInsetTimeSubsecondMode(
    currentSettings: any,
    anchor: string,
    val: string,
  ): void {
    this.getOrCreateInsetConfig(currentSettings, anchor).timeSubsecondMode =
      val as TimerSubsecondMode;
  }

  public static getInsetTimeSubsecondThreshold(
    currentSettings: any,
    anchor: string,
  ): number {
    return (
      this.getOrCreateInsetConfig(currentSettings, anchor)
        .timeSubsecondThreshold ?? 10
    );
  }

  public static setInsetTimeSubsecondThreshold(
    currentSettings: any,
    anchor: string,
    val: number,
  ): void {
    this.getOrCreateInsetConfig(
      currentSettings,
      anchor,
    ).timeSubsecondThreshold = Math.max(0, Number(val) || 0);
  }

  public static getInsetTimeSubsecondDecimals(
    currentSettings: any,
    anchor: string,
  ): number {
    return (
      this.getOrCreateInsetConfig(currentSettings, anchor)
        .timeSubsecondDecimals ?? 2
    );
  }

  public static setInsetTimeSubsecondDecimals(
    currentSettings: any,
    anchor: string,
    val: number,
  ): void {
    this.getOrCreateInsetConfig(currentSettings, anchor).timeSubsecondDecimals =
      Math.min(3, Math.max(0, Number(val) || 0));
  }

  public static getInsetTimeDecimalPlaces(
    currentSettings: any,
    anchor: string,
  ): number {
    return (
      this.getOrCreateInsetConfig(currentSettings, anchor).timeDecimalPlaces ??
      3
    );
  }

  public static setInsetTimeDecimalPlaces(
    currentSettings: any,
    anchor: string,
    val: number,
  ): void {
    this.getOrCreateInsetConfig(currentSettings, anchor).timeDecimalPlaces =
      Math.min(3, Math.max(0, Number(val) || 0));
  }

  public static getInsetLapDecimalPlaces(
    currentSettings: any,
    anchor: string,
  ): number {
    return (
      this.getOrCreateInsetConfig(currentSettings, anchor).lapDecimalPlaces ?? 2
    );
  }

  public static setInsetLapDecimalPlaces(
    currentSettings: any,
    anchor: string,
    val: number,
  ): void {
    this.getOrCreateInsetConfig(currentSettings, anchor).lapDecimalPlaces =
      Math.min(3, Math.max(0, Number(val) || 0));
  }

  public static getInsetDecimalPlaces(
    currentSettings: any,
    anchor: string,
  ): number {
    return (
      this.getOrCreateInsetConfig(currentSettings, anchor).decimalPlaces ?? 2
    );
  }

  public static setInsetDecimalPlaces(
    currentSettings: any,
    anchor: string,
    val: number,
  ): void {
    this.getOrCreateInsetConfig(currentSettings, anchor).decimalPlaces =
      Math.min(3, Math.max(0, Number(val) || 0));
  }

  public static getInsetFontFamily(
    currentSettings: any,
    anchor: string,
  ): string {
    return (
      this.getOrCreateInsetConfig(currentSettings, anchor).fontFamily ||
      currentSettings["insetFontFamily"] ||
      ""
    );
  }

  public static setInsetFontFamily(
    currentSettings: any,
    anchor: string,
    val: string,
  ): void {
    this.getOrCreateInsetConfig(currentSettings, anchor).fontFamily = val;
  }

  public static getInsetFontSize(currentSettings: any, anchor: string): number {
    return (
      this.getOrCreateInsetConfig(currentSettings, anchor).fontSize ??
      currentSettings["insetFontSize"] ??
      18
    );
  }

  public static setInsetFontSize(
    currentSettings: any,
    anchor: string,
    val: number,
  ): void {
    this.getOrCreateInsetConfig(currentSettings, anchor).fontSize = Math.min(
      36,
      Math.max(8, Number(val) || 18),
    );
  }

  public static getInsetTextColor(
    currentSettings: any,
    anchor: string,
  ): string {
    return (
      this.getOrCreateInsetConfig(currentSettings, anchor).textColor ||
      currentSettings["insetTextColor"] ||
      "#ffffff"
    );
  }

  public static setInsetTextColor(
    currentSettings: any,
    anchor: string,
    val: string,
  ): void {
    this.getOrCreateInsetConfig(currentSettings, anchor).textColor = val;
  }

  public static getInsetPreview(
    currentSettings: any,
    anchor: string,
    seconds: number,
  ): string {
    const cfg = this.getOrCreateInsetConfig(currentSettings, anchor);
    return formatTimerDisplay(seconds, {
      format: cfg.timeDisplayFormat || "dynamic",
      subsecondMode: cfg.timeSubsecondMode || "never",
      subsecondThreshold: cfg.timeSubsecondThreshold ?? 10,
      subsecondDecimals: cfg.timeSubsecondDecimals ?? 2,
    });
  }
}
