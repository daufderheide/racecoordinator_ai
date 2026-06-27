import { CdkDrag, CdkDragHandle, CdkDropList } from "@angular/cdk/drag-drop";
import { CommonModule } from "@angular/common";
import {
  AfterViewInit,
  Component,
  effect,
  ElementRef,
  inject,
  input,
  NgZone,
  OnDestroy,
  viewChild,
  viewChildren,
  ViewEncapsulation,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { AbsoluteWidgetNode } from "@app/models/settings";
import { TranslatePipe } from "@app/pipes/translate.pipe";

@Component({
  standalone: true,
  selector: "app-raceday-lane-view",
  templateUrl: "./raceday-lane-view.component.html",
  styleUrls: ["./raceday-lane-view.component.css"],
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    TranslatePipe,
    FormsModule,
  ],
})
export class RacedayLaneViewComponent implements AfterViewInit, OnDestroy {
  parent = input<any>(undefined);
  widget = input<AbsoluteWidgetNode | null>(null);

  private laneViewContainer =
    viewChild<ElementRef<HTMLElement>>("laneViewContainer");
  private fitTextTargets =
    viewChildren<ElementRef<HTMLElement>>("fitTextTarget");

  private resizeObserver?: ResizeObserver;
  private lastWidth = 0;
  private lastHeight = 0;
  private resizeTimeout?: any;
  private zone = inject(NgZone);

  constructor() {
    effect(() => {
      // Trigger whenever inputs change that might affect layout
      this.parent()?.sortedHeatDrivers;
      this.parent()?.columns;
      this.widget();

      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout);
      }
      this.zone.runOutsideAngular(() => {
        this.resizeTimeout = setTimeout(() => this.fitTexts(), 10);
      });
    });
  }

  ngAfterViewInit() {
    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry) {
          const width = entry.contentRect.width;
          const height = entry.contentRect.height;
          if (
            Math.abs(this.lastWidth - width) < 1 &&
            Math.abs(this.lastHeight - height) < 1
          ) {
            return;
          }
          this.lastWidth = width;
          this.lastHeight = height;
        }

        if (this.resizeTimeout) {
          clearTimeout(this.resizeTimeout);
        }
        this.zone.runOutsideAngular(() => {
          this.resizeTimeout = setTimeout(() => this.fitTexts(), 10);
        });
      });
      const container = this.laneViewContainer()?.nativeElement;
      if (container) {
        this.resizeObserver.observe(container);
      }
    }
  }

  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
  }

  private fitTexts() {
    const targets = this.fitTextTargets().map((t) => t.nativeElement);
    if (!targets.length) return;

    // Reset all to natural size
    targets.forEach((el) => {
      el.style.removeProperty("--text-fit-scale");
    });

    // We only scale text containers (they don't contain images usually, but we check for text nodes or span children)
    // Actually, just check if it overflows.
    for (const el of targets) {
      // If it contains an image, scaling font-size won't fix overflow, skip it to avoid thrashing.
      if (el.querySelector("img")) continue;

      const textEl =
        (el.querySelector(".teammate-display-name") as HTMLElement) || el;

      const isOverflowing =
        textEl.scrollHeight > textEl.clientHeight + 1 ||
        textEl.scrollWidth > textEl.clientWidth + 1;

      if (isOverflowing) {
        let minScale = 0.1;
        let maxScale = 1.0;
        let bestScale = 1.0;

        // Binary search for the best scale factor
        for (let i = 0; i < 6; i++) {
          const scale = (minScale + maxScale) / 2;
          el.style.setProperty("--text-fit-scale", scale.toString());

          if (
            textEl.scrollHeight > textEl.clientHeight + 1 ||
            textEl.scrollWidth > textEl.clientWidth + 1
          ) {
            maxScale = scale; // still too big
          } else {
            bestScale = scale; // fits, try bigger
            minScale = scale;
          }
        }
        el.style.setProperty("--text-fit-scale", bestScale.toString());
      }
    }
  }

  getHeaderHeight(): number {
    const columnFontSize = this.widget()?.customSettings?.["columnFontSize"];
    return columnFontSize
      ? Math.max(36, Math.round(Number(columnFontSize) * 1.3 + 8))
      : 36;
  }
}
