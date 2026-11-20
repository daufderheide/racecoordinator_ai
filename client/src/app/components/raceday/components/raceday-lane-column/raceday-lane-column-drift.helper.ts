import {
  AbsoluteWidgetNode,
  LaneColumnWidgetSettings,
} from "@app/models/settings";
import { DriverHeatData } from "@app/race/driver_heat_data";

export function isDriftIndicatorColumn(
  columnKey: string,
  widget: AbsoluteWidgetNode | null | undefined,
): boolean {
  return (
    columnKey === "driftIndicator" || widget?.widgetType === "drift-indicator"
  );
}

export function isDriftIndicatorProperty(key: string | undefined): boolean {
  return Boolean(key && key.split("_")[0] === "driftIndicator");
}

export function isDriftActive(
  isUIEditorMode: boolean,
  targetDriver: DriverHeatData | null | undefined,
): boolean {
  if (isUIEditorMode) return true;
  return Boolean(targetDriver?.isLastLapDrift);
}

export function isDriftImageMode(settings: LaneColumnWidgetSettings): boolean {
  return settings.displayMode === "image";
}

export function resolveAssetUrl(raw: string, serverUrl?: string): string {
  if (!raw) return "";
  if (raw.startsWith("http") || raw.startsWith("data:")) return raw;
  if (!serverUrl || serverUrl.includes("undefined")) return raw;
  const base = serverUrl.endsWith("/") ? serverUrl.slice(0, -1) : serverUrl;
  const path = raw.startsWith("/") ? raw : "/" + raw;
  return base + path;
}

export function getDriftImageUrl(
  settings: LaneColumnWidgetSettings,
  isUIEditorMode: boolean,
  serverUrl?: string,
): string {
  const raw = settings.imageUrl || "";
  if (!raw && isUIEditorMode) {
    return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="384" height="239" viewBox="0 0 384 239"><rect width="384" height="239" fill="%231e293b"/><text x="192" y="120" font-family="sans-serif" font-size="16" fill="%2394a3b8" text-anchor="middle">No Drift Image Selected</text></svg>';
  }
  return resolveAssetUrl(raw, serverUrl);
}

export function getDriftDisplayText(
  settings: LaneColumnWidgetSettings,
  translate: (key: string) => string,
): string {
  return settings.driftText || translate("RD_DRIFT_LAP") || "DRIFT";
}

export function getEffectiveMainDriftFontSize(
  settings: LaneColumnWidgetSettings,
  isScaleAuto: boolean,
): number | null {
  if (isScaleAuto) {
    return null;
  }
  if (settings.minFontSize != null || settings.maxFontSize != null) {
    return null;
  }
  return settings.valueFontSize || null;
}

export function isInsetDriftImageMode(
  settings: LaneColumnWidgetSettings,
  anchor: string,
): boolean {
  const cfg = settings.insetsConfig?.[anchor];
  return cfg?.displayMode === "image";
}

export function getInsetDriftImageUrl(
  settings: LaneColumnWidgetSettings,
  anchor: string,
  isUIEditorMode: boolean,
  serverUrl?: string,
): string {
  const cfg = settings.insetsConfig?.[anchor];
  const raw = cfg?.imageUrl || "";
  if (!raw && isUIEditorMode) {
    return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="60" viewBox="0 0 100 60"><rect width="100" height="60" fill="%231e293b"/><text x="50" y="35" font-family="sans-serif" font-size="10" fill="%2394a3b8" text-anchor="middle">No Image</text></svg>';
  }
  return resolveAssetUrl(raw, serverUrl);
}

export function getInsetDriftDisplayText(
  settings: LaneColumnWidgetSettings,
  anchor: string,
  translate: (key: string) => string,
): string {
  const cfg = settings.insetsConfig?.[anchor];
  return (
    cfg?.driftText || settings.driftText || translate("RD_DRIFT_LAP") || "DRIFT"
  );
}
