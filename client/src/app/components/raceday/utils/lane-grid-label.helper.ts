import { AbsoluteWidgetNode } from "@app/models/settings";

import {
  LaneGridBounds,
  LaneGridSession,
} from "./lane-grid-replication.helper";

export type GridLabelPosition = "none" | "top" | "bottom" | "left" | "right";

export interface GridLabelConfig {
  gridLabelPosition?: GridLabelPosition;
  gridLabelText?: string;
  gridLabelSize?: number;
  gridLabelFontFamily?: string;
  gridLabelFontSize?: number;
  gridLabelTextColor?: string;
  gridLabelBackgroundColor?: string;
  gridLabelFontBold?: boolean;
  gridLabelFontItalic?: boolean;
  gridLabelAlignment?: "left" | "center" | "right";
}

export class LaneGridLabelHelper {
  public static getEffectiveLabelSize(session: LaneGridSession): number {
    const raw = Number(session.gridLabelSize);
    const pos = session.gridLabelPosition || "none";
    const defaultSize = 40;
    const size = isNaN(raw) || raw <= 0 ? defaultSize : raw;

    const maxAllowed =
      pos === "left" || pos === "right"
        ? Math.max(20, session.bounds.width - 20)
        : Math.max(20, session.bounds.height - 20);

    return Math.max(20, Math.min(maxAllowed, Math.round(size)));
  }

  public static computeGridDataBounds(
    session: LaneGridSession,
  ): LaneGridBounds {
    if (!session || !session.bounds) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }
    const pos = session.gridLabelPosition || "none";
    if (pos === "none") {
      return { ...session.bounds };
    }

    const labelSize = this.getEffectiveLabelSize(session);
    switch (pos) {
      case "top":
        return {
          x: session.bounds.x,
          y: session.bounds.y + labelSize,
          width: session.bounds.width,
          height: Math.max(0, session.bounds.height - labelSize),
        };
      case "bottom":
        return {
          x: session.bounds.x,
          y: session.bounds.y,
          width: session.bounds.width,
          height: Math.max(0, session.bounds.height - labelSize),
        };
      case "left":
        return {
          x: session.bounds.x + labelSize,
          y: session.bounds.y,
          width: Math.max(0, session.bounds.width - labelSize),
          height: session.bounds.height,
        };
      case "right":
        return {
          x: session.bounds.x,
          y: session.bounds.y,
          width: Math.max(0, session.bounds.width - labelSize),
          height: session.bounds.height,
        };
      default:
        return { ...session.bounds };
    }
  }

  public static computeGridLabelBounds(
    session: LaneGridSession,
  ): LaneGridBounds | null {
    if (!session || !session.bounds) return null;
    const pos = session.gridLabelPosition || "none";
    if (pos === "none") return null;

    const labelSize = this.getEffectiveLabelSize(session);
    switch (pos) {
      case "top":
        return {
          x: session.bounds.x,
          y: session.bounds.y,
          width: session.bounds.width,
          height: labelSize,
        };
      case "bottom":
        return {
          x: session.bounds.x,
          y: session.bounds.y + session.bounds.height - labelSize,
          width: session.bounds.width,
          height: labelSize,
        };
      case "left":
        return {
          x: session.bounds.x,
          y: session.bounds.y,
          width: labelSize,
          height: session.bounds.height,
        };
      case "right":
        return {
          x: session.bounds.x + session.bounds.width - labelSize,
          y: session.bounds.y,
          width: labelSize,
          height: session.bounds.height,
        };
      default:
        return null;
    }
  }

  public static updateGridLabelSettings(
    allWidgets: AbsoluteWidgetNode[],
    gridId: string,
    config: GridLabelConfig,
  ): AbsoluteWidgetNode[] {
    if (!allWidgets || !gridId) return allWidgets || [];

    return allWidgets.map((w) => {
      if (w.customSettings?.["gridId"] !== gridId) return w;

      return {
        ...w,
        customSettings: {
          ...(w.customSettings || {}),
          gridLabelPosition: config.gridLabelPosition ?? "none",
          gridLabelText: config.gridLabelText ?? "",
          gridLabelSize: config.gridLabelSize ?? 40,
          gridLabelFontFamily: config.gridLabelFontFamily ?? "",
          gridLabelFontSize: config.gridLabelFontSize ?? 18,
          gridLabelTextColor: config.gridLabelTextColor ?? "#ffffff",
          gridLabelBackgroundColor:
            config.gridLabelBackgroundColor ?? "rgba(15, 23, 42, 0.85)",
          gridLabelFontBold: config.gridLabelFontBold !== false,
          gridLabelFontItalic: Boolean(config.gridLabelFontItalic),
          gridLabelAlignment: config.gridLabelAlignment ?? "center",
        },
      };
    });
  }

  public static getLabelJustifyContent(
    position?: string,
    alignment?: string,
  ): string {
    const align = alignment || "center";
    const pos = position || "top";

    if (pos === "top" || pos === "bottom") {
      if (align === "left") return "flex-start";
      if (align === "right") return "flex-end";
      return "center";
    }

    // Vertical text with writing-mode: vertical-rl; transform: rotate(180deg);
    if (align === "left") return "flex-end";
    if (align === "right") return "flex-start";
    return "center";
  }
}
