import { getSharedCanvasContext } from "@app/components/raceday/components/raceday-lane-column/raceday-lane-column.utils";
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
  gridLabelShowBorder?: boolean;
  gridLabelBorderColor?: string;
  gridLabelBorderWidth?: number;
  gridLabelBorderRadius?: number;
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

  public static resolveSessionBounds(
    gridWidgets: AbsoluteWidgetNode[],
    existingBounds?: LaneGridBounds | null,
  ): LaneGridBounds {
    if (existingBounds) return existingBounds;
    for (const w of gridWidgets) {
      const saved = w.customSettings?.["gridBounds"];
      if (
        saved &&
        typeof saved.x === "number" &&
        typeof saved.y === "number" &&
        typeof saved.width === "number" &&
        typeof saved.height === "number"
      ) {
        return {
          x: saved.x,
          y: saved.y,
          width: Math.max(100, saved.width),
          height: Math.max(50, saved.height),
        };
      }
    }
    const minX = Math.min(...gridWidgets.map((w) => w.x));
    const maxX = Math.max(...gridWidgets.map((w) => w.x + w.width));
    const minY = Math.min(...gridWidgets.map((w) => w.y));
    const maxY = Math.max(...gridWidgets.map((w) => w.y + w.height));
    return {
      x: minX,
      y: minY,
      width: Math.max(100, maxX - minX),
      height: Math.max(50, maxY - minY),
    };
  }

  public static resolveLabelConfigFromSource(
    first: AbsoluteWidgetNode | undefined,
    config: GridLabelConfig,
  ): GridLabelConfig {
    const s = first?.customSettings || {};
    return {
      gridLabelPosition:
        config.gridLabelPosition ?? (s["gridLabelPosition"] as any) ?? "none",
      gridLabelText: config.gridLabelText ?? s["gridLabelText"] ?? "",
      gridLabelSize: config.gridLabelSize ?? (Number(s["gridLabelSize"]) || 40),
      gridLabelFontFamily:
        config.gridLabelFontFamily ?? s["gridLabelFontFamily"] ?? "",
      gridLabelFontSize:
        config.gridLabelFontSize ?? (Number(s["gridLabelFontSize"]) || 18),
      gridLabelTextColor:
        config.gridLabelTextColor ?? s["gridLabelTextColor"] ?? "#ffffff",
      gridLabelBackgroundColor:
        config.gridLabelBackgroundColor ??
        s["gridLabelBackgroundColor"] ??
        "rgba(15, 23, 42, 0.85)",
      gridLabelFontBold:
        config.gridLabelFontBold != null
          ? config.gridLabelFontBold
          : s["gridLabelFontBold"] !== false,
      gridLabelFontItalic:
        config.gridLabelFontItalic != null
          ? Boolean(config.gridLabelFontItalic)
          : Boolean(s["gridLabelFontItalic"]),
      gridLabelAlignment:
        config.gridLabelAlignment ?? s["gridLabelAlignment"] ?? "center",
      gridLabelShowBorder:
        config.gridLabelShowBorder != null
          ? config.gridLabelShowBorder
          : s["gridLabelShowBorder"] !== false,
      gridLabelBorderColor:
        config.gridLabelBorderColor ?? s["gridLabelBorderColor"] ?? "",
      gridLabelBorderWidth:
        config.gridLabelBorderWidth != null
          ? Number(config.gridLabelBorderWidth)
          : Number(s["gridLabelBorderWidth"] ?? 1),
      gridLabelBorderRadius:
        config.gridLabelBorderRadius != null
          ? Number(config.gridLabelBorderRadius)
          : Number(s["gridLabelBorderRadius"] ?? 4),
    };
  }

  public static buildGridLabelSession(
    allWidgets: AbsoluteWidgetNode[],
    gridId: string,
    config: GridLabelConfig,
    existingBounds?: LaneGridBounds | null,
  ): LaneGridSession | null {
    if (!allWidgets || !gridId) return null;
    const gridWidgets = allWidgets.filter(
      (w) => w.customSettings?.["gridId"] === gridId,
    );
    if (gridWidgets.length === 0) return null;

    const bounds = this.resolveSessionBounds(gridWidgets, existingBounds);
    const first = gridWidgets[0];
    const resolvedLabel = this.resolveLabelConfigFromSource(first, config);

    return {
      gridId,
      bounds,
      totalLanes: Number(first?.customSettings?.["gridTotalLanes"]) || 4,
      direction: first?.customSettings?.["gridDirection"] || "vertical",
      sourceLaneIndex: Number(first?.customSettings?.["gridLane"] ?? 0),
      bindingMode: first?.customSettings?.["bindingMode"] || "lane",
      headerPlacement:
        first?.customSettings?.["headerPlacement"] || "individual",
      headerHeight: Number(first?.customSettings?.["headerHeight"]) || 36,
      linkColumns: first?.customSettings?.["linkColumns"] !== false,
      mirrorRows: first?.customSettings?.["mirrorRows"] !== false,
      sortByBindingMode: first?.customSettings?.["sortByBindingMode"] !== false,
      layoutOrientation:
        first?.customSettings?.["layoutOrientation"] || "vertical",
      ...resolvedLabel,
    };
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
          gridLabelShowBorder: config.gridLabelShowBorder !== false,
          gridLabelBorderColor: config.gridLabelBorderColor ?? "",
          gridLabelBorderWidth:
            config.gridLabelBorderWidth != null
              ? Number(config.gridLabelBorderWidth)
              : 1,
          gridLabelBorderRadius:
            config.gridLabelBorderRadius != null
              ? Number(config.gridLabelBorderRadius)
              : 4,
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
      if (align === "left" || align === "start") return "flex-start";
      if (align === "right" || align === "end") return "flex-end";
      return "center";
    }

    // Vertical text with writing-mode: vertical-rl; transform: rotate(180deg);
    if (align === "left" || align === "start") return "flex-end";
    if (align === "right" || align === "end") return "flex-start";
    return "center";
  }

  public static shouldResyncForGridLabel(
    gridWidgets: AbsoluteWidgetNode[],
    session: LaneGridSession,
    config: GridLabelConfig,
  ): boolean {
    const first = gridWidgets[0];
    const prevPos = first?.customSettings?.["gridLabelPosition"] || "none";
    const prevSize = Number(first?.customSettings?.["gridLabelSize"]) || 40;
    const newPos = config.gridLabelPosition ?? prevPos;
    const newSize = config.gridLabelSize ?? prevSize;

    const labelGeometryChanged =
      prevPos !== newPos || (newPos !== "none" && prevSize !== newSize);

    const isAnyUnderLabel = gridWidgets.some((w) => {
      if (w.customSettings?.["isHeaderWidget"]) return false;
      const dataBounds = this.computeGridDataBounds(session);
      return (
        (newPos === "top" && w.y < dataBounds.y) ||
        (newPos === "left" && w.x < dataBounds.x)
      );
    });

    return labelGeometryChanged || isAnyUnderLabel;
  }

  public static computeEffectiveLabelFont(
    text: string,
    bounds: LaneGridBounds | null,
    position?: GridLabelPosition,
    baseFontSize?: number,
    fontFamily?: string,
    fontBold?: boolean,
    isScaleAuto: boolean = true,
  ): { fontSize: number; shouldWrap: boolean } {
    const defaultRes = {
      fontSize: baseFontSize && baseFontSize > 0 ? baseFontSize : 18,
      shouldWrap: false,
    };
    const cleanText = text?.trim();
    if (!bounds || bounds.width <= 0 || bounds.height <= 0 || !cleanText) {
      return defaultRes;
    }
    const isVertical = position === "left" || position === "right";
    const userOrDefSize =
      baseFontSize && baseFontSize > 0
        ? baseFontSize
        : Math.round(isVertical ? bounds.width * 0.55 : bounds.height * 0.55);

    if (isScaleAuto === false) {
      return { fontSize: userOrDefSize, shouldWrap: false };
    }

    const availW = Math.max(
      10,
      isVertical ? bounds.height - 24 : bounds.width - 24,
    );
    const availH = Math.max(
      10,
      isVertical ? bounds.width - 8 : bounds.height - 8,
    );

    const ctx = getSharedCanvasContext();
    if (!ctx) {
      return { fontSize: userOrDefSize, shouldWrap: false };
    }

    const weight = fontBold ? "bold" : "normal";
    const rawFamily = fontFamily?.trim() || "Inter, sans-serif";
    const family =
      rawFamily
        .replace(/-apple-system|BlinkMacSystemFont/gi, "")
        .replace(/,\s*,/g, ",")
        .replace(/^[\s,]+|[\s,]+$/g, "")
        .trim() || "sans-serif";

    // 1. Test single line at userOrDefSize
    ctx.font = `${weight} ${userOrDefSize}px ${family}`;
    const initialWidth = ctx.measureText(cleanText).width || 1;

    if (initialWidth <= availW && userOrDefSize <= availH) {
      return { fontSize: userOrDefSize, shouldWrap: false };
    }

    // 2. Single-line scaled down size
    const scale = Math.min(availW / initialWidth, availH / userOrDefSize);
    const singleLineSize = Math.max(8, Math.floor(userOrDefSize * scale));

    // 3. If horizontal and text contains spaces, test multi-line wrapping
    let bestWrapSize = 0;
    if (!isVertical && cleanText.includes(" ") && availH >= 20) {
      const words = cleanText.split(/\s+/).filter(Boolean);
      for (
        let testSize = userOrDefSize;
        testSize > singleLineSize;
        testSize--
      ) {
        const lineHeight = Math.ceil(testSize * 1.15);
        const maxLines = Math.floor(availH / lineHeight);
        if (maxLines < 2) continue;

        ctx.font = `${weight} ${testSize}px ${family}`;
        let linesCount = 1;
        let currentLineWidth = 0;
        let possible = true;

        for (const word of words) {
          const wordW = ctx.measureText(word).width;
          if (wordW > availW) {
            possible = false;
            break;
          }
          const spaceW = currentLineWidth > 0 ? ctx.measureText(" ").width : 0;
          if (currentLineWidth + spaceW + wordW <= availW) {
            currentLineWidth += spaceW + wordW;
          } else {
            linesCount++;
            currentLineWidth = wordW;
            if (linesCount > maxLines) {
              possible = false;
              break;
            }
          }
        }

        if (possible && linesCount <= maxLines) {
          bestWrapSize = testSize;
          break;
        }
      }
    }

    if (bestWrapSize > singleLineSize) {
      return { fontSize: bestWrapSize, shouldWrap: true };
    }

    return { fontSize: singleLineSize, shouldWrap: false };
  }
}
