import {
  AfterViewInit,
  ChangeDetectorRef,
  Directive,
  ElementRef,
  HostBinding,
  HostListener,
  inject,
  input,
  OnChanges,
  OnDestroy,
  signal,
} from "@angular/core";
import { DriverLabel } from "@app/models/driver-label";

let canvasCtx: CanvasRenderingContext2D | null = null;

export function measureChipWidth(labelName: string, maxChipWidth = 85): number {
  if (typeof document === "undefined") {
    return Math.min(maxChipWidth, labelName.length * 7 + 12);
  }
  if (!canvasCtx) {
    const canvas = document.createElement("canvas");
    canvasCtx = canvas.getContext("2d");
  }
  if (canvasCtx) {
    canvasCtx.font =
      '600 10px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const textWidth = canvasCtx.measureText(labelName).width;
    return Math.min(maxChipWidth, Math.ceil(textWidth + 12));
  }
  return Math.min(maxChipWidth, labelName.length * 7 + 12);
}

export function estimateChipsContainerWidth(
  labels: { name: string }[],
  maxChipWidth = 85,
): number {
  if (!labels || labels.length === 0) return 0;
  let maxWidth = 0;
  for (const label of labels) {
    const w = measureChipWidth(label.name, maxChipWidth);
    if (w > maxWidth) maxWidth = w;
  }
  return maxWidth;
}

@Directive({
  standalone: true,
  selector: "[appDriverLabelsOverflow]",
  exportAs: "appDriverLabelsOverflow",
})
export class DriverLabelsOverflowDirective
  implements AfterViewInit, OnChanges, OnDestroy
{
  labels = input<DriverLabel[] | undefined>([], {
    alias: "appDriverLabelsOverflow",
  });

  isDotsMode = signal<boolean>(false);

  private el = inject(ElementRef);
  private cdr = inject(ChangeDetectorRef);
  private resizeObserver?: ResizeObserver;
  private cachedChipsWidth?: number;
  private lastLabelIdsKey = "";

  @HostBinding("class.dots-mode")
  get dotsModeClass(): boolean {
    return this.isDotsMode();
  }

  ngOnChanges(): void {
    const list = this.labels() || [];
    const newKey = list.map((l) => l.entity_id).join(",");
    if (newKey === this.lastLabelIdsKey) {
      return;
    }
    this.lastLabelIdsKey = newKey;

    if (list.length === 0) {
      this.updateDotsMode(false);
    } else if (list.length > 2) {
      this.updateDotsMode(true);
    } else {
      this.scheduleCheck();
    }
  }

  ngAfterViewInit(): void {
    this.scheduleCheck();

    const parent = this.el.nativeElement.parentElement;
    if (parent && typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(() => {
        this.scheduleCheck();
      });
      this.resizeObserver.observe(parent);
    }
  }

  ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  @HostListener("window:resize")
  onWindowResize(): void {
    this.scheduleCheck();
  }

  scheduleCheck(): void {
    if (typeof queueMicrotask !== "undefined") {
      queueMicrotask(() => this.checkOverflow());
    } else {
      setTimeout(() => this.checkOverflow(), 0);
    }
  }

  private updateDotsMode(val: boolean): void {
    if (this.isDotsMode() !== val) {
      this.isDotsMode.set(val);
      this.cdr.markForCheck();
    }
  }

  checkOverflow(): void {
    const list = this.labels() || [];
    if (list.length === 0) {
      this.updateDotsMode(false);
      return;
    }

    if (list.length > 2) {
      this.updateDotsMode(true);
      return;
    }

    const chipsEl = this.el.nativeElement as HTMLElement;
    const parent = chipsEl.parentElement;
    if (!parent) return;

    const nameEl = parent.querySelector(".driver-name") as HTMLElement | null;
    const metaEl = parent.querySelector(".driver-meta") as HTMLElement | null;
    const detailsEl = (parent.querySelector(".driver-details") ||
      parent.querySelector(".driver-info")) as HTMLElement | null;

    if (!nameEl) return;

    // Skip if not rendered in layout (zero width)
    if (nameEl.clientWidth === 0 && detailsEl && detailsEl.clientWidth === 0) {
      return;
    }

    if (!this.isDotsMode()) {
      // Currently chips mode: check if either name or meta overflows/truncates
      const isNameTruncated = nameEl.scrollWidth > nameEl.clientWidth + 0.5;
      const isMetaTruncated = metaEl
        ? metaEl.scrollWidth > metaEl.clientWidth + 0.5
        : false;

      if (isNameTruncated || isMetaTruncated) {
        if (chipsEl.offsetWidth > 0) {
          this.cachedChipsWidth = chipsEl.offsetWidth;
        }
        this.updateDotsMode(true);
      }
    } else {
      // Currently dots mode: check if it can fit with chips
      const currentDetailsWidth = detailsEl ? detailsEl.clientWidth : 0;
      const currentDotsWidth = chipsEl.offsetWidth || 8;
      const chipsWidth =
        this.cachedChipsWidth || estimateChipsContainerWidth(list);
      const extraWidthNeeded = Math.max(0, chipsWidth - currentDotsWidth);
      const availableWidthWithChips = currentDetailsWidth - extraWidthNeeded;

      const getTextWidth = (elem: HTMLElement | null): number => {
        if (!elem) return 0;
        if (typeof document === "undefined" || !document.createRange) {
          return elem.clientWidth;
        }
        const range = document.createRange();
        range.selectNodeContents(elem);
        return range.getBoundingClientRect().width;
      };

      const nameNaturalWidth = getTextWidth(nameEl);
      const metaNaturalWidth = metaEl ? getTextWidth(metaEl) : 0;

      const nameFits = nameNaturalWidth <= availableWidthWithChips + 0.5;
      const metaFits =
        !metaEl || metaNaturalWidth <= availableWidthWithChips + 0.5;

      if (nameFits && metaFits) {
        this.updateDotsMode(false);
      }
    }
  }
}
