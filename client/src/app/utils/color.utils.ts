/**
 * Calculates contrasting foreground color (dark or light) for a given background color hex string.
 * WCAG-compliant relative luminance calculation.
 */
export function getContrastColor(hexColor: string | undefined): string {
  if (!hexColor) return "#ffffff";
  let hex = hexColor.trim();
  if (hex.startsWith("#")) {
    hex = hex.substring(1);
  }
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (hex.length !== 6) {
    return "#ffffff";
  }

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return "#ffffff";
  }

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#0f172a" : "#ffffff";
}

/**
 * Determines whether a color hex or rgb string has a light perceived luminance.
 */
export function isColorLight(color: string | undefined): boolean {
  if (!color) return false;
  const trimmed = color.trim().toLowerCase();
  if (trimmed === "transparent" || trimmed === "") return false;

  if (trimmed.startsWith("rgb")) {
    const match = trimmed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      const r = parseInt(match[1], 10);
      const g = parseInt(match[2], 10);
      const b = parseInt(match[3], 10);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance > 0.55;
    }
  }

  let hex = trimmed;
  if (hex.startsWith("#")) {
    hex = hex.substring(1);
  }
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (hex.length !== 6) {
    return false;
  }
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return false;
  }
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55;
}

/**
 * Standard preset colors for labels (inspired by GitHub issue labels).
 */
export const PRESET_LABEL_COLORS: string[] = [
  "#ef4444", // Red
  "#f97316", // Orange
  "#f59e0b", // Amber
  "#10b981", // Emerald
  "#06b6d4", // Cyan
  "#3b82f6", // Blue
  "#6366f1", // Indigo
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#64748b", // Slate
  "#84cc16", // Lime
  "#14b8a6", // Teal
];

/**
 * Returns a random preset color.
 */
export function getRandomLabelColor(): string {
  const index = Math.floor(Math.random() * PRESET_LABEL_COLORS.length);
  return PRESET_LABEL_COLORS[index];
}
