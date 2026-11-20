import { ChangeDetectorRef } from "@angular/core";
import { ICustomHeat } from "@app/proto/antigravity";

export const ROTATION_DRIVER_HIGHLIGHT_PALETTE: readonly string[] = [
  "#f59e0b", // Amber
  "#06b6d4", // Electric Cyan
  "#ec4899", // Neon Pink
  "#10b981", // Emerald Green
  "#a855f7", // Vivid Purple
  "#f97316", // Radiant Orange
  "#3b82f6", // Electric Blue
  "#84cc16", // Lime Green
  "#f43f5e", // Crimson Rose
  "#14b8a6", // Teal
  "#eab308", // Golden Yellow
  "#7c3aed", // Deep Violet
  "#fb7185", // Coral Pink
  "#38bdf8", // Sky Blue
  "#34d399", // Mint Green
  "#d946ef", // Vibrant Magenta
];

export function allocateRotationHighlightColor(
  usedColors: Set<string>,
): string {
  const normalized = new Set(
    Array.from(usedColors).map((c) => c.toLowerCase()),
  );
  for (const color of ROTATION_DRIVER_HIGHLIGHT_PALETTE) {
    if (!normalized.has(color.toLowerCase())) {
      return color;
    }
  }
  let index = usedColors.size;
  while (true) {
    const hue = Math.round((index * 137.508) % 360);
    const generated = `hsl(${hue}, 90%, 55%)`;
    if (!normalized.has(generated.toLowerCase())) {
      return generated;
    }
    index++;
  }
}

export function getContrastTextColor(hexColor: string): string {
  if (!hexColor) return "#0f172a";
  let color = hexColor.trim();
  if (color.startsWith("#")) {
    color = color.substring(1);
    if (color.length === 3) {
      color = color
        .split("")
        .map((c) => c + c)
        .join("");
    }
    const r = parseInt(color.substring(0, 2), 16) || 0;
    const g = parseInt(color.substring(2, 4), 16) || 0;
    const b = parseInt(color.substring(4, 6), 16) || 0;
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? "#0f172a" : "#ffffff";
  }
  const hslMatch = color.match(/hsl\(\s*\d+\s*,\s*\d+%\s*,\s*(\d+)%\s*\)/i);
  if (hslMatch) {
    const lightness = parseInt(hslMatch[1], 10);
    return lightness >= 50 ? "#0f172a" : "#ffffff";
  }
  return "#0f172a";
}

export class RotationHighlightManager {
  readonly highlightedDrivers = new Map<number, string>();

  constructor(private cdr?: ChangeDetectorRef) {}

  isDriverHighlighted(driverId: number | null | undefined): boolean {
    if (driverId === null || driverId === undefined || driverId === 0) {
      return false;
    }
    return this.highlightedDrivers.has(driverId);
  }

  getDriverHighlightColor(driverId: number | null | undefined): string | null {
    if (driverId === null || driverId === undefined || driverId === 0) {
      return null;
    }
    return this.highlightedDrivers.get(driverId) ?? null;
  }

  toggleDriverHighlight(
    driverId: number | null | undefined,
    event?: MouseEvent,
  ): void {
    if (event) {
      event.stopPropagation();
      if (event.button !== 0) return;
    }
    if (driverId === null || driverId === undefined || driverId === 0) {
      return;
    }

    if (this.highlightedDrivers.has(driverId)) {
      this.highlightedDrivers.delete(driverId);
    } else {
      const usedColors = new Set(
        Array.from(this.highlightedDrivers.values()).map((c) =>
          c.toLowerCase(),
        ),
      );
      const color = allocateRotationHighlightColor(usedColors);
      this.highlightedDrivers.set(driverId, color);
    }
    this.cdr?.markForCheck();
  }

  clearDriverHighlights(): void {
    this.highlightedDrivers.clear();
    this.cdr?.markForCheck();
  }

  hasHighlightedDrivers(): boolean {
    return this.highlightedDrivers.size > 0;
  }

  isHeatHighlighted(heat: ICustomHeat | null | undefined): boolean {
    if (this.highlightedDrivers.size === 0 || !heat || !heat.driverIndices) {
      return false;
    }
    return heat.driverIndices.some(
      (driverId) => driverId !== 0 && this.highlightedDrivers.has(driverId),
    );
  }

  getHeatHighlightColors(heat: ICustomHeat | null | undefined): string[] {
    if (this.highlightedDrivers.size === 0 || !heat || !heat.driverIndices) {
      return [];
    }
    const colors: string[] = [];
    const seen = new Set<string>();
    for (const driverId of heat.driverIndices) {
      if (driverId !== 0 && this.highlightedDrivers.has(driverId)) {
        const color = this.highlightedDrivers.get(driverId)!;
        if (!seen.has(color)) {
          seen.add(color);
          colors.push(color);
        }
      }
    }
    return colors;
  }
}
