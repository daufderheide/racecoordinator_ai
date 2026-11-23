import { RacedayLayoutUtils } from "@app/components/raceday/utils/raceday-layout.utils";

/**
 * Fills in missing Countdown settings and converts an old lampScale (a factor
 * of 120px) to the container-relative scale (scaleVersion 2). Runs whenever the
 * Countdown's settings are opened, by the old inspector and by the redesigned
 * panel. Returns true when it changed something, so the caller can save.
 */
export function ensureCountdownDefaults(
  s: any,
  widget: { width?: number; height?: number } | null | undefined,
): boolean {
  if (!s) return false;
  let modified = false;
  if (!s.orientation) {
    s.orientation = "horizontal";
    modified = true;
  }
  if (!s.lampSizingMode) {
    s.lampSizingMode = "custom";
    modified = true;
  }
  if (!s.maxLamps && !s.previewLampCount) {
    s.maxLamps = 5;
    s.previewLampCount = 5;
    modified = true;
  } else if (!s.maxLamps) {
    s.maxLamps = Number(s.previewLampCount) || 5;
    modified = true;
  } else if (!s.previewLampCount) {
    s.previewLampCount = Number(s.maxLamps) || 5;
    modified = true;
  }
  if (s.fadeIn === undefined || s.fadeIn === null) {
    s.fadeIn = true;
    modified = true;
  }
  if (!s.blurArea) {
    s.blurArea = "fullscreen";
    modified = true;
  }
  if (s.blurAmount === undefined || s.blurAmount === null) {
    s.blurAmount = 50;
    modified = true;
  }
  if (s.lampScale === undefined || s.lampScale === null) {
    s.lampScale = 1.0;
    modified = true;
  }
  if (s.glowEffect === undefined || s.glowEffect === null) {
    s.glowEffect = true;
    modified = true;
  }
  if (s.glowIntensity === undefined || s.glowIntensity === null) {
    s.glowIntensity = 100;
    modified = true;
  }
  if (s.glowOverlap === undefined || s.glowOverlap === null) {
    s.glowOverlap = 30;
    modified = true;
  }
  if (s.glowRedOverlap === undefined || s.glowRedOverlap === null) {
    s.glowRedOverlap = s.glowOverlap ?? 30;
    modified = true;
  }
  if (s.glowGreenOverlap === undefined || s.glowGreenOverlap === null) {
    s.glowGreenOverlap = 25;
    modified = true;
  }
  if (s.scaleVersion !== 2) {
    if (s.lampSizingMode === "custom" && typeof s.lampScale === "number") {
      const ww = widget?.width || 1000;
      const wh = widget?.height || 250;
      const baseFit = RacedayLayoutUtils.calculateCountdownFitSize({
        width: ww,
        height: wh,
        count: s.maxLamps || 5,
        isVertical: s.orientation === "vertical",
        glowEffect: s.glowEffect,
        glowIntensity: s.glowIntensity,
        glowRedOverlap: s.glowRedOverlap,
        glowGreenOverlap: s.glowGreenOverlap,
      });
      if (baseFit > 0) {
        const legacyPixelSize = 120 * s.lampScale;
        s.lampScale = Math.round((legacyPixelSize / baseFit) * 1000) / 1000;
      }
    }
    s.scaleVersion = 2;
    modified = true;
  }
  return modified;
}
