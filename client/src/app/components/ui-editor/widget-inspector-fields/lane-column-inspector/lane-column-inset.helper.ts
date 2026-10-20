import { RacedayLayoutUtils } from "@app/components/raceday/utils/raceday-layout.utils";
import { AbsoluteWidgetNode, InsetConfig } from "@app/models/settings";
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
    const cfg = this.getOrCreateInsetConfig(currentSettings, anchor);
    cfg.lapDecimalPlaces = Math.min(3, Math.max(0, Number(val) || 0));
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
    const cfg = this.getOrCreateInsetConfig(currentSettings, anchor);
    cfg.decimalPlaces = Math.min(3, Math.max(0, Number(val) || 0));
  }

  public static getInsetHeatsDisplayMode(
    currentSettings: any,
    anchor: string,
  ): "raced" | "remaining" {
    return (
      this.getOrCreateInsetConfig(currentSettings, anchor).heatsDisplayMode ||
      "raced"
    );
  }

  public static setInsetHeatsDisplayMode(
    currentSettings: any,
    anchor: string,
    val: "raced" | "remaining",
  ): void {
    const cfg = this.getOrCreateInsetConfig(currentSettings, anchor);
    cfg.heatsDisplayMode = val;
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

  public static isInsetTotalTime(key: string | undefined): boolean {
    if (!key) return false;
    const baseKey = key.split("_")[0];
    return baseKey === "totalTime" || baseKey === "overallTotalTime";
  }

  public static isInsetTimeColumn(key: string | undefined): boolean {
    if (!key) return false;
    return (
      RacedayLayoutUtils.isTimeColumnKey(key) && !this.isInsetTotalTime(key)
    );
  }

  public static isInsetLapColumn(key: string | undefined): boolean {
    if (!key || this.isCustomWidget(key)) return false;
    return RacedayLayoutUtils.isLapColumnKey(key);
  }

  public static isInsetHeatsCountColumn(key: string | undefined): boolean {
    if (!key) return false;
    const baseKey = key.split("_")[0];
    return baseKey === "heatsRaced" || baseKey === "heatsRemaining";
  }

  public static isInsetNumericColumn(key: string | undefined): boolean {
    if (!key) return false;
    if (
      this.isInsetTotalTime(key) ||
      this.isInsetTimeColumn(key) ||
      this.isInsetLapColumn(key) ||
      this.isInsetHeatsCountColumn(key)
    ) {
      return false;
    }
    return [
      "points",
      "overallPoints",
      "trackCalls",
      "overallTrackCalls",
      "lapsLed",
      "overallLapsLed",
      "speed",
      "topSpeed",
      "averageSpeed",
      "physicalLapCount",
      "overallPhysicalLapCount",
    ].includes(key.split("_")[0]);
  }

  public static buildSyntheticInsetCustomWidgetNode(
    widget: AbsoluteWidgetNode | undefined,
    anchor: string,
    key: string,
    config: InsetConfig,
  ): AbsoluteWidgetNode {
    const customSettings: Record<string, any> = {
      ...(config as any),
    };
    if (customSettings["decimalPlaces"] === undefined) {
      const parentInsetLapDec =
        widget?.customSettings?.["insetLapDecimalPlaces"];
      if (parentInsetLapDec !== undefined) {
        customSettings["decimalPlaces"] = parentInsetLapDec;
      }
    }
    return {
      ...(widget || ({} as AbsoluteWidgetNode)),
      id: `${widget?.id || "lane-col"}-inset-${anchor}`,
      widgetType: key as any,
      customSettings,
      scaleMode: "fixed",
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      zIndex: 1,
    };
  }

  public static normalizeSettings(s: any): any {
    const current = s || {};
    if (!current["layoutOrientation"]) {
      current["layoutOrientation"] = "vertical";
    }
    if (!current["backgroundColor"]) {
      current["backgroundColor"] = "#000000";
    }
    if (
      !current["textColor"] ||
      (current["textColor"] === "#000000" &&
        current["backgroundColor"] === "#000000")
    ) {
      current["textColor"] = "#ffffff";
    }
    return current;
  }

  public static sanitizeSettings(
    currentSettings: any,
    isCustomWidget: boolean,
  ): void {
    if (currentSettings["timeDecimalPlaces"] !== undefined) {
      currentSettings["timeDecimalPlaces"] = Math.min(
        3,
        Math.max(0, Number(currentSettings["timeDecimalPlaces"])),
      );
    }
    if (currentSettings["decimalPlaces"] !== undefined) {
      currentSettings["decimalPlaces"] = Math.min(
        3,
        Math.max(0, Number(currentSettings["decimalPlaces"])),
      );
      if (isCustomWidget) {
        currentSettings["lapDecimalPlaces"] = currentSettings["decimalPlaces"];
      }
    } else if (
      isCustomWidget &&
      currentSettings["lapDecimalPlaces"] !== undefined
    ) {
      currentSettings["lapDecimalPlaces"] = Math.min(
        3,
        Math.max(0, Number(currentSettings["lapDecimalPlaces"])),
      );
      currentSettings["decimalPlaces"] = currentSettings["lapDecimalPlaces"];
    } else if (currentSettings["lapDecimalPlaces"] !== undefined) {
      currentSettings["lapDecimalPlaces"] = Math.min(
        3,
        Math.max(0, Number(currentSettings["lapDecimalPlaces"])),
      );
    }
    if (currentSettings["insetTimeDecimalPlaces"] !== undefined) {
      currentSettings["insetTimeDecimalPlaces"] = Math.min(
        3,
        Math.max(0, Number(currentSettings["insetTimeDecimalPlaces"])),
      );
    }
    if (currentSettings["insetLapDecimalPlaces"] !== undefined) {
      currentSettings["insetLapDecimalPlaces"] = Math.min(
        3,
        Math.max(0, Number(currentSettings["insetLapDecimalPlaces"])),
      );
    }
    if (currentSettings["timeSubsecondThreshold"] !== undefined) {
      currentSettings["timeSubsecondThreshold"] = Math.max(
        0,
        Number(currentSettings["timeSubsecondThreshold"]),
      );
    }
    if (currentSettings["timeSubsecondDecimals"] !== undefined) {
      currentSettings["timeSubsecondDecimals"] = Math.min(
        3,
        Math.max(0, Number(currentSettings["timeSubsecondDecimals"])),
      );
    }
  }

  public static getPlacedInsetAnchors(
    insets: Record<string, any> | undefined,
  ): string[] {
    if (!insets) return [];
    return Object.keys(insets).filter(
      (k) => k !== "center-center" && Boolean(insets[k]),
    );
  }

  public static getEffectiveSelectedAnchor(
    activeInspectorAnchor: string | null,
    selectedAnchor: string | null,
    insets: Record<string, any> | undefined,
  ): string {
    if (activeInspectorAnchor && activeInspectorAnchor !== "center-center") {
      return activeInspectorAnchor;
    }
    if (selectedAnchor && selectedAnchor !== "center-center") {
      return selectedAnchor;
    }
    const placed = this.getPlacedInsetAnchors(insets);
    if (placed.length > 0) {
      return placed[0];
    }
    return "top-right";
  }

  public static handleDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "copy";
    }
  }

  public static handleDragEnter(event: DragEvent): void {
    event.preventDefault();
    ((event.currentTarget || event.target) as HTMLElement)?.classList.add(
      "drag-over",
    );
  }

  public static handleDragLeave(event: DragEvent): void {
    event.preventDefault();
    ((event.currentTarget || event.target) as HTMLElement)?.classList.remove(
      "drag-over",
    );
  }

  public static getAnchorValue(
    currentSettings: any,
    widget: AbsoluteWidgetNode | undefined,
    anchor: string,
  ): string {
    if (anchor === "center-center") {
      return (
        currentSettings["columnKey"] ||
        (widget?.widgetType?.startsWith("custom:") ? widget.widgetType : "")
      );
    }
    return currentSettings["insets"]?.[anchor] || "";
  }

  public static setAnchorValue(
    currentSettings: any,
    anchor: string,
    val: string,
    onFieldChange: () => void,
  ): void {
    if (anchor === "center-center") {
      currentSettings["columnKey"] = val;
      onFieldChange();
      return;
    }
    if (!currentSettings["insets"]) {
      currentSettings["insets"] = {};
    }
    if (!val) {
      delete currentSettings["insets"][anchor];
      if (currentSettings["insetsConfig"]?.[anchor]) {
        delete currentSettings["insetsConfig"][anchor];
      }
    } else {
      currentSettings["insets"][anchor] = val;
    }
    onFieldChange();
  }

  public static hasCustomInsetTextColor(
    currentSettings: any,
    anchor: string,
  ): boolean {
    return Boolean(currentSettings["insetsConfig"]?.[anchor]?.textColor);
  }

  public static resetInsetCustomColor(
    currentSettings: any,
    anchor: string,
    onFieldChange: () => void,
  ): void {
    if (currentSettings["insetsConfig"]?.[anchor]) {
      delete currentSettings["insetsConfig"][anchor].textColor;
    }
    onFieldChange();
  }
}
