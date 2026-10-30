import { CommonModule } from "@angular/common";
import { Component, computed, input, ViewEncapsulation } from "@angular/core";
import { LaneGridLabelHelper } from "@app/components/raceday/utils/lane-grid-label.helper";
import { AbsoluteWidgetNode } from "@app/models/settings";

@Component({
  standalone: true,
  selector: "app-raceday-label",
  templateUrl: "./raceday-label.component.html",
  styleUrls: ["./raceday-label.component.css"],
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule],
})
export class RacedayLabelComponent {
  widget = input<AbsoluteWidgetNode | null>(null);

  isVertical(): boolean {
    const w = this.widget();
    if (!w) return false;
    if (w.customSettings?.["vertical"] !== undefined) {
      return Boolean(w.customSettings["vertical"]);
    }
    return (w.height || 0) > (w.width || 0);
  }

  isScaleAuto(): boolean {
    const w = this.widget();
    return w?.scaleMode === "auto";
  }

  readonly effectiveFont = computed(() => {
    const w = this.widget();
    if (!w) {
      return { fontSize: 18, shouldWrap: false };
    }
    const isVert = this.isVertical();
    const text = (w.customSettings?.["text"] || "").toString();
    const bounds = {
      x: w.x || 0,
      y: w.y || 0,
      width: w.width || 0,
      height: w.height || 0,
    };
    const position = isVert ? "left" : "top";
    const baseFontSize = Number(w.customSettings?.["fontSize"]) || 18;
    const fontFamily = (w.customSettings?.["fontFamily"] || "").toString();
    const fontBold = Boolean(w.customSettings?.["fontBold"]);
    const isScaleAuto = w.scaleMode === "auto";

    return LaneGridLabelHelper.computeEffectiveLabelFont(
      text,
      bounds,
      position,
      baseFontSize,
      fontFamily,
      fontBold,
      isScaleAuto,
    );
  });

  getJustify(alignment?: string): string {
    const isVert = this.isVertical();
    switch (alignment) {
      case "left":
      case "start":
        return isVert ? "flex-end" : "flex-start";
      case "right":
      case "end":
        return isVert ? "flex-start" : "flex-end";
      case "center":
      default:
        return "center";
    }
  }
}
