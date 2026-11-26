export interface WidgetBorderConfig {
  showBorder: boolean;
  borderStyle: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
}

export function toValidHexColor(
  color: string | undefined | null,
  fallback: string = "#ffffff",
): string {
  if (!color) return fallback;
  const trimmed = color.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
    return trimmed;
  }
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    return (
      "#" +
      trimmed[1] +
      trimmed[1] +
      trimmed[2] +
      trimmed[2] +
      trimmed[3] +
      trimmed[3]
    );
  }
  return fallback;
}

const ACTION_BUTTON_BORDER_CONFIG: WidgetBorderConfig = {
  showBorder: true,
  borderStyle: "solid",
  borderColor: "#cccccc",
  borderWidth: 1,
  borderRadius: 4,
};

const PANEL_CARD_BORDER_CONFIG: WidgetBorderConfig = {
  showBorder: true,
  borderStyle: "solid",
  borderColor: "#ffffff",
  borderWidth: 1,
  borderRadius: 6,
};

const DEFAULT_BORDER_CONFIG: WidgetBorderConfig = {
  showBorder: false,
  borderStyle: "solid",
  borderColor: "#ffffff",
  borderWidth: 1,
  borderRadius: 4,
};

const WIDGET_BORDER_DEFAULTS_MAP: Record<string, WidgetBorderConfig> = {
  timer: {
    showBorder: true,
    borderStyle: "solid",
    borderColor: "#dddddd",
    borderWidth: 2,
    borderRadius: 8,
  },
  "lane-column": {
    showBorder: true,
    borderStyle: "solid",
    borderColor: "",
    borderWidth: 1,
    borderRadius: 8,
  },
  "average-score": {
    showBorder: true,
    borderStyle: "solid",
    borderColor: "",
    borderWidth: 1,
    borderRadius: 8,
  },
  "drift-indicator": {
    showBorder: true,
    borderStyle: "solid",
    borderColor: "",
    borderWidth: 1,
    borderRadius: 8,
  },
  image: {
    showBorder: true,
    borderStyle: "solid",
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderRadius: 8,
  },
  "action-back": {
    showBorder: true,
    borderStyle: "solid",
    borderColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderRadius: 8,
  },
  "action-forward": {
    showBorder: true,
    borderStyle: "solid",
    borderColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderRadius: 8,
  },
  "action-close": {
    showBorder: true,
    borderStyle: "solid",
    borderColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderRadius: 8,
  },
  "heat-list": {
    showBorder: false,
    borderStyle: "solid",
    borderColor: "#38bdf8",
    borderWidth: 1,
    borderRadius: 6,
  },
  "menu-bar": {
    showBorder: false,
    borderStyle: "solid",
    borderColor: "#38bdf8",
    borderWidth: 1,
    borderRadius: 0,
  },
  "progress-gauge": {
    showBorder: false,
    borderStyle: "solid",
    borderColor: "#ffffff",
    borderWidth: 1,
    borderRadius: 12,
  },
  countdown: {
    showBorder: false,
    borderStyle: "solid",
    borderColor: "#ffffff",
    borderWidth: 1,
    borderRadius: 8,
  },
  label: {
    showBorder: false,
    borderStyle: "solid",
    borderColor: "",
    borderWidth: 1,
    borderRadius: 4,
  },
  "step-badge": {
    showBorder: false,
    borderStyle: "solid",
    borderColor: "",
    borderWidth: 1,
    borderRadius: 4,
  },
};

const PANEL_CARD_WIDGET_TYPES = new Set([
  "records",
  "leaderboard",
  "group-leaderboard",
  "season-leaderboard",
  "season-race-leaderboard",
  "step-results",
  "on-deck",
  "next-heat",
  "flag",
  "branding",
  "qr",
]);

export function getDefaultBorderConfigForWidget(
  widgetType?: string,
): WidgetBorderConfig {
  if (!widgetType) {
    return DEFAULT_BORDER_CONFIG;
  }
  if (WIDGET_BORDER_DEFAULTS_MAP[widgetType]) {
    return WIDGET_BORDER_DEFAULTS_MAP[widgetType];
  }
  if (PANEL_CARD_WIDGET_TYPES.has(widgetType)) {
    return PANEL_CARD_BORDER_CONFIG;
  }
  if (widgetType.startsWith("action-")) {
    return ACTION_BUTTON_BORDER_CONFIG;
  }
  return DEFAULT_BORDER_CONFIG;
}

export function resolveWidgetBorderStyles(
  widgetType?: string,
  customSettings?: Record<string, any>,
): {
  borderStyle: string;
  borderColor: string;
  borderWidth: string;
  borderRadius: string;
  hasBorder: boolean;
} {
  const defaults = getDefaultBorderConfigForWidget(widgetType);
  const showBorder =
    customSettings?.["showBorder"] !== undefined
      ? Boolean(customSettings["showBorder"])
      : defaults.showBorder;

  const borderStyle = showBorder
    ? customSettings?.["borderStyle"] || defaults.borderStyle || "solid"
    : "none";

  const rawColor =
    customSettings?.["borderColor"] !== undefined &&
    customSettings?.["borderColor"] !== ""
      ? customSettings["borderColor"]
      : defaults.borderColor || "#ffffff";

  const borderWidthNum =
    customSettings?.["borderWidth"] !== undefined &&
    customSettings?.["borderWidth"] !== null
      ? Number(customSettings["borderWidth"])
      : defaults.borderWidth;

  const borderRadiusNum =
    customSettings?.["borderRadius"] !== undefined &&
    customSettings?.["borderRadius"] !== null
      ? Number(customSettings["borderRadius"])
      : defaults.borderRadius;

  return {
    borderStyle,
    borderColor: rawColor,
    borderWidth: `${borderWidthNum}px`,
    borderRadius: `${borderRadiusNum}px`,
    hasBorder: showBorder && borderStyle !== "none" && borderWidthNum > 0,
  };
}
