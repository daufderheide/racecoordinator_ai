import { CommonModule } from "@angular/common";
import { Component, input, ViewEncapsulation } from "@angular/core";
import { AbsoluteWidgetNode } from "@app/models/settings";
import { TranslatePipe } from "@app/pipes/translate.pipe";

@Component({
  standalone: true,
  selector: "app-raceday-label",
  templateUrl: "./raceday-label.component.html",
  styleUrls: ["./raceday-label.component.css"],
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, TranslatePipe],
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
