import { GAP_MIGRATION_MAP } from "@app/components/raceday/utils/lane-view-migration.helper";
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
    let key: string | undefined;
    try {
      const dataStr = event.dataTransfer.getData("application/json");
      if (dataStr) {
        const data = JSON.parse(dataStr);
        if (data.key) {
          key = data.key;
        } else if (data.type) {
          key = data.type;
        }
      }
    } catch (_) {}

    if (!key) {
      const text = event.dataTransfer.getData("text/plain");
      if (text) {
        key = text;
      }
    }

    if (key && key.startsWith("lane-col:")) {
      key = key.substring("lane-col:".length);
    }
    return key;
  }

  public static getWidgetDisplayName(
    key: string,
    availableColumns: { key: string; label: string }[],
    customWidgetService?: CustomWidgetService | null,
    translationService?: TranslationService,
  ): string {
    if (!key) return "";
    const normalizedKey = key.startsWith("lane-col:")
      ? key.substring("lane-col:".length)
      : key;
    if (normalizedKey.startsWith("custom:")) {
      const def = customWidgetService?.getWidgetDefinition(normalizedKey);
      if (def?.manifest?.name) return def.manifest.name;
      return normalizedKey.substring("custom:".length);
    }
    const colDef = availableColumns.find((c) => c.key === normalizedKey);
    if (colDef && translationService) {
      return translationService.translate(colDef.label);
    }
    return colDef ? colDef.label : normalizedKey;
  }

  public static getWidgetIcon(key: string): string {
    if (!key) return "add_circle_outline";
    const normalizedKey = key.startsWith("lane-col:")
      ? key.substring("lane-col:".length)
      : key;
    if (normalizedKey.startsWith("custom:")) return "extension";
    if (
      normalizedKey.includes("Time") ||
      normalizedKey === "totalTime" ||
      normalizedKey === "segmentTime"
    ) {
      return "schedule";
    }
    if (normalizedKey.includes("lap") || normalizedKey.includes("Lap")) {
      return "flag";
    }
    if (
      normalizedKey.startsWith("imageset_") ||
      normalizedKey === "flag" ||
      normalizedKey === "qrCode" ||
      normalizedKey === "driverViewQrCode" ||
      normalizedKey === "driver.avatarUrl"
    ) {
      return "image";
    }
    if (
      normalizedKey.includes("driver") ||
      normalizedKey.includes("participant")
    ) {
      return "person";
    }
    if (
      normalizedKey.includes("gap") ||
      normalizedKey.includes("rank") ||
      normalizedKey.includes("seed")
    ) {
      return "leaderboard";
    }
    if (normalizedKey.includes("fuel")) return "local_gas_station";
    if (
      normalizedKey.includes("mph") ||
      normalizedKey.includes("kph") ||
      normalizedKey.includes("fph")
    ) {
      return "speed";
    }
    return "widgets";
  }

  public static isCustomWidget(key: string | undefined): boolean {
    if (!key) return false;
    const normalizedKey = key.startsWith("lane-col:")
      ? key.substring("lane-col:".length)
      : key;
    return normalizedKey.startsWith("custom:");
  }

  public static isImageProperty(key: string | undefined): boolean {
    if (!key) return false;
    const normalizedKey = key.startsWith("lane-col:")
      ? key.substring("lane-col:".length)
      : key;
    return (
      normalizedKey.startsWith("imageset_") ||
      normalizedKey === "driver.avatarUrl" ||
      normalizedKey === "flag" ||
      normalizedKey === "qrCode" ||
      normalizedKey === "driverViewQrCode"
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

  public static getInsetDefaultHorizontalAlignment(
    anchor: string,
  ): "left" | "center" | "right" {
    if (
      anchor.endsWith("-left") ||
      anchor.startsWith("left") ||
      anchor.includes("left")
    ) {
      return "left";
    }
    if (
      anchor.endsWith("-right") ||
      anchor.startsWith("right") ||
      anchor.includes("right")
    ) {
      return "right";
    }
    return "center";
  }

  public static getInsetDefaultVerticalAlignment(
    anchor: string,
  ): "top" | "center" | "bottom" {
    if (
      anchor.startsWith("top-") ||
      anchor.startsWith("top") ||
      anchor.includes("top")
    ) {
      return "top";
    }
    if (
      anchor.startsWith("bottom-") ||
      anchor.startsWith("bottom") ||
      anchor.includes("bottom")
    ) {
      return "bottom";
    }
    return "center";
  }

  public static getInsetHorizontalAlignment(
    currentSettings: any,
    anchor: string,
  ): "left" | "center" | "right" {
    const cfg = currentSettings["insetsConfig"]?.[anchor];
    const val = cfg?.horizontalAlignment || cfg?.valueAlignment;
    if (val === "start" || val === "left") return "left";
    if (val === "end" || val === "right") return "right";
    if (val === "center") return "center";
    return this.getInsetDefaultHorizontalAlignment(anchor);
  }

  public static setInsetHorizontalAlignment(
    currentSettings: any,
    anchor: string,
    val: "left" | "center" | "right",
  ): void {
    const cfg = this.getOrCreateInsetConfig(currentSettings, anchor);
    cfg.horizontalAlignment = val;
    cfg.valueAlignment = val;
  }

  public static getInsetVerticalAlignment(
    currentSettings: any,
    anchor: string,
  ): "top" | "center" | "bottom" {
    const cfg = currentSettings["insetsConfig"]?.[anchor];
    const val = cfg?.verticalAlignment;
    if (val === "top" || val === "center" || val === "bottom") return val;
    return this.getInsetDefaultVerticalAlignment(anchor);
  }

  public static setInsetVerticalAlignment(
    currentSettings: any,
    anchor: string,
    val: "top" | "center" | "bottom",
  ): void {
    const cfg = this.getOrCreateInsetConfig(currentSettings, anchor);
    cfg.verticalAlignment = val;
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

  public static isInsetGapColumn(key: string | undefined): boolean {
    if (!key) return false;
    const baseKey = key.split("_")[0];
    return (
      baseKey === "gap" ||
      baseKey === "overallGap" ||
      Boolean(GAP_MIGRATION_MAP[baseKey])
    );
  }

  public static getInsetGapTarget(
    currentSettings: any,
    anchor: string,
  ): "leader" | "position" {
    const cfg = this.getOrCreateInsetConfig(currentSettings, anchor);
    if (cfg.gapTarget) return cfg.gapTarget;
    const insetKey = currentSettings["insets"]?.[anchor];
    if (insetKey && GAP_MIGRATION_MAP[insetKey]) {
      return GAP_MIGRATION_MAP[insetKey].gapTarget;
    }
    return "leader";
  }

  public static setInsetGapTarget(
    currentSettings: any,
    anchor: string,
    val: "leader" | "position",
  ): void {
    const cfg = this.getOrCreateInsetConfig(currentSettings, anchor);
    cfg.gapTarget = val;
  }

  public static getInsetGapMode(
    currentSettings: any,
    anchor: string,
  ): "always_time" | "laps_and_time" | "always_laps" {
    const cfg = this.getOrCreateInsetConfig(currentSettings, anchor);
    if (cfg.gapMode) return cfg.gapMode;
    const insetKey = currentSettings["insets"]?.[anchor];
    if (insetKey && GAP_MIGRATION_MAP[insetKey]) {
      return GAP_MIGRATION_MAP[insetKey].gapMode;
    }
    return "always_time";
  }

  public static setInsetGapMode(
    currentSettings: any,
    anchor: string,
    val: "always_time" | "laps_and_time" | "always_laps",
  ): void {
    const cfg = this.getOrCreateInsetConfig(currentSettings, anchor);
    cfg.gapMode = val;
  }

  public static isInsetTimeColumn(
    key: string | undefined,
    currentSettings?: any,
    anchor?: string,
  ): boolean {
    if (!key) return false;
    if (this.isInsetGapColumn(key)) {
      if (currentSettings && anchor) {
        return this.getInsetGapMode(currentSettings, anchor) !== "always_laps";
      }
      return true;
    }
    return (
      RacedayLayoutUtils.isTimeColumnKey(key) && !this.isInsetTotalTime(key)
    );
  }

  public static isInsetLapColumn(
    key: string | undefined,
    currentSettings?: any,
    anchor?: string,
  ): boolean {
    if (!key || this.isCustomWidget(key)) return false;
    if (this.isInsetGapColumn(key)) {
      if (currentSettings && anchor) {
        return this.getInsetGapMode(currentSettings, anchor) === "always_laps";
      }
      return false;
    }
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
      this.isInsetGapColumn(key) ||
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
    if (!current["bindingMode"]) {
      current["bindingMode"] = "lane";
    }

    const colKey = current["columnKey"];
    if (colKey && GAP_MIGRATION_MAP[colKey]) {
      const mapping = GAP_MIGRATION_MAP[colKey];
      current["columnKey"] = mapping.columnKey;
      if (!current["gapTarget"]) {
        current["gapTarget"] = mapping.gapTarget;
      }
      if (!current["gapMode"]) {
        current["gapMode"] = mapping.gapMode;
      }
    }

    if (current["insets"] && typeof current["insets"] === "object") {
      for (const [anchor, insetVal] of Object.entries(current["insets"])) {
        if (typeof insetVal === "string" && GAP_MIGRATION_MAP[insetVal]) {
          const mapping = GAP_MIGRATION_MAP[insetVal];
          current["insets"][anchor] = mapping.columnKey;
          if (!current["insetsConfig"]) {
            current["insetsConfig"] = {};
          }
          if (!current["insetsConfig"][anchor]) {
            current["insetsConfig"][anchor] = {};
          }
          current["insetsConfig"][anchor].columnKey = mapping.columnKey;
          if (!current["insetsConfig"][anchor].gapTarget) {
            current["insetsConfig"][anchor].gapTarget = mapping.gapTarget;
          }
          if (!current["insetsConfig"][anchor].gapMode) {
            current["insetsConfig"][anchor].gapMode = mapping.gapMode;
          }
        }
      }
    }

    if (
      current["insetsConfig"] &&
      typeof current["insetsConfig"] === "object"
    ) {
      for (const [, cfg] of Object.entries(current["insetsConfig"])) {
        if (
          cfg &&
          (cfg as any).columnKey &&
          GAP_MIGRATION_MAP[(cfg as any).columnKey]
        ) {
          const mapping = GAP_MIGRATION_MAP[(cfg as any).columnKey];
          (cfg as any).columnKey = mapping.columnKey;
          if (!(cfg as any).gapTarget) {
            (cfg as any).gapTarget = mapping.gapTarget;
          }
          if (!(cfg as any).gapMode) {
            (cfg as any).gapMode = mapping.gapMode;
          }
        }
      }
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
    if (currentSettings["lastLapsCount"] !== undefined) {
      const parsed = Number(currentSettings["lastLapsCount"]);
      currentSettings["lastLapsCount"] =
        !isNaN(parsed) && parsed > 0 ? Math.max(1, Math.round(parsed)) : 5;
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

  public static getSelectedMapAnchor(
    activeInspectorAnchor: string | null,
    selectedAnchor: string | null,
  ): string {
    if (activeInspectorAnchor) {
      return activeInspectorAnchor;
    }
    if (selectedAnchor) {
      return selectedAnchor;
    }
    return "center-center";
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
