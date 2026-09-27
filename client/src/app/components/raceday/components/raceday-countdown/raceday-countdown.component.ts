import { CommonModule } from "@angular/common";
import { Component, inject, input, ViewEncapsulation } from "@angular/core";
import { AbsoluteWidgetNode } from "@app/models/settings";
import { THEME_SLOT_KEYS } from "@app/models/theme";
import { ThemeService } from "@app/services/theme.service";

export interface LampState {
  url: string;
  state: string;
}

@Component({
  selector: "app-raceday-countdown",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./raceday-countdown.component.html",
  styleUrls: ["./raceday-countdown.component.css"],
  encapsulation: ViewEncapsulation.None,
})
export class RacedayCountdownComponent {
  private themeService = inject(ThemeService, { optional: true });

  widget = input.required<AbsoluteWidgetNode>();
  parent = input<any>(null);
  isCustomizing = input<boolean>(false);
  showCountdownOverlay = input<boolean>(false);
  countdownLamps = input<any[]>([]);

  get orientation(): string {
    const custom = this.widget()?.customSettings?.["orientation"];
    if (custom) return custom;
    const isPortrait = this.parent()?.isPortraitLayout?.() ?? false;
    return isPortrait ? "vertical" : "horizontal";
  }

  get isVertical(): boolean {
    return this.orientation === "vertical";
  }

  get lampScale(): number {
    const s = this.widget()?.customSettings?.["lampScale"];
    return typeof s === "number" && s > 0 ? s : 1.0;
  }

  get glowEffect(): boolean {
    return this.widget()?.customSettings?.["glowEffect"] !== false;
  }

  get glowIntensity(): number {
    const val = this.widget()?.customSettings?.["glowIntensity"];
    return typeof val === "number" ? Math.max(10, Math.min(100, val)) : 100;
  }

  get glowRedOverlap(): number {
    const val =
      this.widget()?.customSettings?.["glowRedOverlap"] ??
      this.widget()?.customSettings?.["glowOverlap"];
    return typeof val === "number" ? Math.max(0, Math.min(100, val)) : 100;
  }

  get glowGreenOverlap(): number {
    const val = this.widget()?.customSettings?.["glowGreenOverlap"];
    return typeof val === "number" ? Math.max(0, Math.min(100, val)) : 100;
  }

  get glowOverlap(): number {
    return this.glowRedOverlap;
  }

  get blurArea(): string {
    return this.widget()?.customSettings?.["blurArea"] || "fullscreen";
  }

  get blurAmount(): number {
    const a = this.widget()?.customSettings?.["blurAmount"];
    return typeof a === "number" ? Math.max(0, Math.min(100, a)) : 50;
  }

  get isVisible(): boolean {
    if (this.isCustomizing()) return true;
    return this.showCountdownOverlay() || !!this.parent()?.showCountdownOverlay;
  }

  get displayLamps(): LampState[] {
    const lamps = this.countdownLamps()?.length
      ? this.countdownLamps()
      : this.parent()?.countdownLamps;
    if (lamps && lamps.length > 0) {
      return lamps;
    }
    if (this.isCustomizing()) {
      return this.getPreviewLamps();
    }
    return [];
  }

  get blurBackdropStyles(): Record<string, string> {
    const area = this.blurArea;
    if (area === "none" || this.blurAmount <= 0) {
      return { display: "none" };
    }

    const amount = this.blurAmount;
    const blurRadius = (amount / 50) * 8;
    const factor = amount / 50;
    const innerAlpha = Math.min(1.0, 0.4 * factor);
    const outerAlpha = Math.min(1.0, 0.8 * factor);

    const baseStyles: Record<string, string> = {
      "backdrop-filter": `blur(${blurRadius}px)`,
      "-webkit-backdrop-filter": `blur(${blurRadius}px)`,
      background:
        amount >= 100
          ? "rgba(0, 0, 0, 0.95)"
          : `radial-gradient(circle, rgba(0, 0, 0, ${innerAlpha.toFixed(2)}) 0%, rgba(0, 0, 0, ${outerAlpha.toFixed(2)}) 100%)`,
    };

    const bw = this.parent()?.layout?.baseWidth || 1920;
    const bh = this.parent()?.layout?.baseHeight || 1080;
    const wx = this.widget()?.x || 0;
    const wy = this.widget()?.y || 0;
    const ww = this.widget()?.width || bw;
    const wh = this.widget()?.height || bh;

    if (area === "fullscreen") {
      baseStyles["left"] = `${(-wx / ww) * 100}%`;
      baseStyles["top"] = `${(-wy / wh) * 100}%`;
      baseStyles["width"] = `${(bw / ww) * 100}%`;
      baseStyles["height"] = `${(bh / wh) * 100}%`;
    } else if (area === "custom") {
      const cx = this.widget()?.customSettings?.["blurCustomX"] ?? 0;
      const cy = this.widget()?.customSettings?.["blurCustomY"] ?? 0;
      const cw = this.widget()?.customSettings?.["blurCustomWidth"] ?? bw;
      const ch = this.widget()?.customSettings?.["blurCustomHeight"] ?? bh;
      baseStyles["left"] = `${((cx - wx) / ww) * 100}%`;
      baseStyles["top"] = `${((cy - wy) / wh) * 100}%`;
      baseStyles["width"] = `${(cw / ww) * 100}%`;
      baseStyles["height"] = `${(ch / wh) * 100}%`;
    } else {
      // "widget"
      baseStyles["left"] = "0";
      baseStyles["top"] = "0";
      baseStyles["width"] = "100%";
      baseStyles["height"] = "100%";
    }

    return baseStyles;
  }

  get lampSizingMode(): "fit" | "custom" {
    return this.widget()?.customSettings?.["lampSizingMode"] === "fit"
      ? "fit"
      : "custom";
  }

  get previewLampCount(): number {
    const c = this.widget()?.customSettings?.["previewLampCount"];
    return typeof c === "number" && c >= 1
      ? Math.min(10, Math.max(1, Math.round(c)))
      : 5;
  }

  private getLampGap(size: number): number {
    return Math.max(6, Math.min(24, Math.round(size * 0.08)));
  }

  private get fitLampSize(): number {
    if (this.lampSizingMode !== "fit") {
      const scale = this.lampScale;
      return Math.round(120 * scale);
    }

    const lamps = this.displayLamps;
    const count = lamps && lamps.length > 0 ? lamps.length : 5;
    const isVert = this.isVertical;

    const ww = this.widget()?.width || 1000;
    const wh = this.widget()?.height || 250;

    const primaryDim = isVert ? wh : ww;
    const crossDim = isVert ? ww : wh;
    const pad = Math.max(10, Math.min(40, Math.round(primaryDim * 0.04)));

    if (this.glowEffect) {
      const redScale = 1.0 + 0.25 * (this.glowRedOverlap / 100);
      const greenScale = 1.0 + 0.4 * (this.glowGreenOverlap / 100);
      const maxScale = Math.max(redScale, greenScale);
      const glowRadius = Math.round(20 * (this.glowIntensity / 100));
      const extraPad = Math.max(pad, glowRadius + 10);

      const availablePrimary = Math.max(20, primaryDim - extraPad * 2);
      const availableCross = Math.max(20, crossDim - extraPad * 2);

      const effPrimaryUnits = count + (count - 1) * 0.08 + (maxScale - 1);
      const maxPrimary = availablePrimary / effPrimaryUnits;
      const maxCross = availableCross / maxScale;

      return Math.max(20, Math.round(Math.min(maxPrimary, maxCross)));
    } else {
      const availablePrimary = Math.max(20, primaryDim - pad * 2);
      const availableCross = Math.max(20, crossDim - pad * 2);

      const effPrimaryUnits = count + (count - 1) * 0.08;
      const maxPrimary = availablePrimary / effPrimaryUnits;
      const maxCross = availableCross;

      return Math.max(20, Math.round(Math.min(maxPrimary, maxCross)));
    }
  }

  get startLampStyles(): Record<string, string> {
    const size = this.fitLampSize;
    return {
      width: `${size}px`,
      height: `${size}px`,
      "max-width": "100%",
      "max-height": "100%",
    };
  }

  get lampsContainerStyles(): Record<string, string> {
    const size = this.fitLampSize;
    const gap = this.getLampGap(size);
    const ww = this.widget()?.width || 1000;
    const wh = this.widget()?.height || 250;
    const primaryDim = this.isVertical ? wh : ww;

    if (this.lampSizingMode === "fit") {
      const pad = Math.max(10, Math.min(40, Math.round(primaryDim * 0.04)));
      if (this.glowEffect) {
        const glowRadius = Math.round(20 * (this.glowIntensity / 100));
        const extraPad = Math.max(pad, glowRadius + 10);
        return {
          gap: `${gap}px`,
          padding: `${extraPad}px`,
        };
      }
      return {
        gap: `${gap}px`,
        padding: `${pad}px`,
      };
    }

    if (this.glowEffect) {
      const glowRadius = Math.round(20 * (this.glowIntensity / 100));
      return {
        gap: `${gap}px`,
        padding: `${glowRadius + 10}px`,
      };
    }

    return {
      gap: `${gap}px`,
      padding: "10px",
    };
  }

  getLampStyles(lamp: LampState): Record<string, string> {
    const styles: Record<string, string> = { ...this.startLampStyles };
    if (!this.glowEffect) {
      return styles;
    }
    const factor = this.glowIntensity / 100;
    const redOverlapFactor = this.glowRedOverlap / 100;
    const greenOverlapFactor = this.glowGreenOverlap / 100;

    if (lamp.state === "on") {
      const scale = 1.0 + 0.25 * redOverlapFactor;
      styles["transform"] = `scale(${scale.toFixed(3)})`;
      styles["z-index"] = "2";
      const r1 = Math.round(16 * factor);
      const r2 = Math.round(30 * factor);
      styles["filter"] =
        `drop-shadow(0 0 ${r1}px rgba(255, 30, 30, 0.85)) drop-shadow(0 0 ${r2}px rgba(255, 0, 0, 0.5))`;
    } else if (lamp.state === "go") {
      const scale = 1.0 + 0.4 * greenOverlapFactor;
      styles["transform"] = `scale(${scale.toFixed(3)})`;
      styles["z-index"] = "3";
      const r1 = Math.round(20 * factor);
      const r2 = Math.round(40 * factor);
      styles["filter"] =
        `drop-shadow(0 0 ${r1}px rgba(0, 255, 70, 0.9)) drop-shadow(0 0 ${r2}px rgba(0, 255, 50, 0.6))`;
    }
    return styles;
  }

  private getPreviewLamps(): LampState[] {
    const redOnUrl = this.resolveLampUrl(
      THEME_SLOT_KEYS.LAMP_RED_ON,
      "Start Lamp Red",
    );
    const greenUrl = this.resolveLampUrl(
      THEME_SLOT_KEYS.LAMP_GREEN,
      "Start Lamp Green",
    );
    const count = this.previewLampCount;
    const redCount = Math.ceil(count / 2);
    const lamps: LampState[] = [];
    for (let i = 0; i < count; i++) {
      if (i < redCount) {
        lamps.push({
          url: redOnUrl,
          state: "on",
        });
      } else {
        lamps.push({
          url: greenUrl,
          state: "go",
        });
      }
    }
    return lamps;
  }

  private resolveLampUrl(slotKey: string, fallbackName: string): string {
    if (
      this.parent() &&
      typeof this.parent().resolveAssetUrlBySlot === "function"
    ) {
      const url = this.parent().resolveAssetUrlBySlot(slotKey);
      if (url) return url;
    }
    if (this.parent() && typeof this.parent().getAssetUrl === "function") {
      const url = this.parent().getAssetUrl(fallbackName);
      if (url) return url;
    }
    if (this.themeService) {
      const slotAssetId = this.themeService.resolveAssetId(slotKey);
      if (slotAssetId && this.parent()?.assets) {
        const asset = this.parent().assets.find(
          (a: any) => a.entity_id === slotAssetId,
        );
        if (asset?.url) {
          return typeof this.parent().getFullUrl === "function"
            ? this.parent().getFullUrl(asset.url)
            : asset.url;
        }
      }
    }
    return "";
  }
}
