import { CommonModule } from "@angular/common";
import {
  AfterViewInit,
  Component,
  computed,
  effect,
  ElementRef,
  input,
  OnDestroy,
  viewChild,
  viewChildren,
  ViewEncapsulation,
} from "@angular/core";
import { AbsoluteWidgetNode } from "@app/models/settings";
import { TranslatePipe } from "@app/pipes/translate.pipe";

@Component({
  standalone: true,
  selector: "app-raceday-records",
  templateUrl: "./raceday-records.component.html",
  styleUrls: ["./raceday-records.component.css"],
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, TranslatePipe],
})
export class RacedayRecordsComponent implements AfterViewInit, OnDestroy {
  widget = input<AbsoluteWidgetNode | null>(null);
  raceRecordLapNickname = input<string>("");
  raceRecordLapTime = input<number>(0);
  raceRecordScoreNickname = input<string>("");
  raceRecordScore = input<number>(0);
  currentRaceBestNickname = input<string>("");
  currentRaceBestTime = input<number>(0);
  heatBestNickname = input<string>("");
  heatBestTime = input<number>(0);

  showRaceRecordLap = computed(
    () => this.widget()?.customSettings?.["showRaceRecordLap"] !== false,
  );
  showRaceRecordScore = computed(
    () => this.widget()?.customSettings?.["showRaceRecordScore"] !== false,
  );
  showCurrentRaceBest = computed(
    () => this.widget()?.customSettings?.["showCurrentRaceBest"] !== false,
  );
  showHeatBest = computed(
    () => this.widget()?.customSettings?.["showHeatBest"] !== false,
  );

  private recordPanel = viewChild<ElementRef<HTMLElement>>("recordPanel");
  private recordHeaders = viewChildren<ElementRef<HTMLElement>>("recordHeader");
  private recordNames = viewChildren<ElementRef<HTMLElement>>("recordName");
  private recordValues = viewChildren<ElementRef<HTMLElement>>("recordValue");
  private resizeObserver?: ResizeObserver;

  constructor() {
    effect(() => {
      // Trigger whenever inputs change
      this.raceRecordLapNickname();
      this.raceRecordLapTime();
      this.raceRecordScoreNickname();
      this.raceRecordScore();
      this.currentRaceBestNickname();
      this.currentRaceBestTime();
      this.heatBestNickname();
      this.heatBestTime();
      this.widget();
      this.showRaceRecordLap();
      this.showRaceRecordScore();
      this.showCurrentRaceBest();
      this.showHeatBest();

      // Schedule fit on next microtask
      setTimeout(() => this.fitText(), 0);
    });
  }

  ngAfterViewInit() {
    const panelEl = this.recordPanel()?.nativeElement;
    if (panelEl && typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(() => {
        this.fitText();
      });
      this.resizeObserver.observe(panelEl);
    }
  }

  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  private fitText() {
    const panelEl = this.recordPanel()?.nativeElement;
    const widgetData = this.widget();

    if (!panelEl) return;

    const isAuto = !widgetData || widgetData.scaleMode === "auto";
    if (!isAuto) {
      panelEl.style.removeProperty("--record-value-font-size");
      panelEl.style.removeProperty("--record-header-font-size");
      panelEl.style.removeProperty("--record-count");
      return;
    }

    const headerEls = this.recordHeaders();
    const nameEls = this.recordNames();
    const valueEls = this.recordValues();
    const visibleCount = headerEls.length || 1;

    panelEl.style.setProperty("--record-count", String(visibleCount));

    if (headerEls.length === 0 || valueEls.length === 0) return;

    // Use canvas to measure text sizes under their computed font families
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    let maxHeaderWidthAt100 = 0;
    let maxRowWidthAt100 = 0;

    // 1. Measure Headers
    const firstHeader = headerEls[0]?.nativeElement;
    const headerFontFamily = firstHeader
      ? window.getComputedStyle(firstHeader).fontFamily
      : "sans-serif";
    const headerFontWeight = firstHeader
      ? window.getComputedStyle(firstHeader).fontWeight
      : "bold";

    if (context) {
      context.font = `${headerFontWeight} 100px ${headerFontFamily}`;
      for (const el of headerEls) {
        const rawText = el.nativeElement.textContent?.trim() || "";
        const textTransform = window.getComputedStyle(
          el.nativeElement,
        ).textTransform;
        const text =
          textTransform === "uppercase" ? rawText.toUpperCase() : rawText;
        const width = context.measureText(text).width || 1;
        if (width > maxHeaderWidthAt100) {
          maxHeaderWidthAt100 = width;
        }
      }
    }

    // 2. Measure Rows
    const firstVal = valueEls[0]?.nativeElement;
    const valueFontFamily = firstVal
      ? window.getComputedStyle(firstVal).fontFamily
      : "sans-serif";
    const valueFontWeight = firstVal
      ? window.getComputedStyle(firstVal).fontWeight
      : "normal";

    if (context) {
      context.font = `${valueFontWeight} 100px ${valueFontFamily}`;
      for (let i = 0; i < valueEls.length; i++) {
        const valText = valueEls[i]?.nativeElement.textContent?.trim() || "";
        const nameText = nameEls[i]?.nativeElement.textContent?.trim() || "";

        const valWidth = context.measureText(valText).width || 1;
        const nameWidth = context.measureText(nameText).width || 1;

        // Cap name width to prevent extremely long nicknames from shrinking the font size to microscopic levels
        const cappedNameWidth = Math.min(nameWidth, valWidth * 1.5);
        const rowWidth = cappedNameWidth + valWidth + 12; // 12px gap at 100px base font size

        if (rowWidth > maxRowWidthAt100) {
          maxRowWidthAt100 = rowWidth;
        }
      }
    }

    const containerWidth = panelEl.clientWidth;
    const containerHeight = panelEl.clientHeight;

    const baseScaleFactor = widgetData?.textScaleFactor ?? 1;

    // Height limit: each group occupies its standard share (based on 4 standard slots) of the total height.
    // Keeping the calculation based on 4 slots prevents the font size from blowing up unnaturally
    // when individual metrics are hidden, maintaining visual harmony with surrounding widgets.
    const groupHeight = containerHeight / 4;
    const limitHeight = (groupHeight * 0.75) / 1.98;

    // Width limit for headers (header size = 0.8 * S)
    // Use 85% of container width to safely account for card padding, margins, and borders
    let limitWidthHeader = Infinity;
    if (maxHeaderWidthAt100 > 0) {
      limitWidthHeader =
        (containerWidth * 0.85 * 100) / (0.8 * maxHeaderWidthAt100);
    }

    // Width limit for rows (row size = S)
    let limitWidthRow = Infinity;
    if (maxRowWidthAt100 > 0) {
      limitWidthRow = (containerWidth * 0.85 * 100) / maxRowWidthAt100;
    }

    // Choose the minimum scale and apply the widget scale factor
    const targetValueFontSize = Math.max(
      Math.floor(
        Math.min(limitHeight, limitWidthHeader, limitWidthRow) *
          baseScaleFactor,
      ),
      8,
    );
    const targetHeaderFontSize = Math.max(
      Math.floor(targetValueFontSize * 0.8),
      8,
    );

    panelEl.style.setProperty(
      "--record-value-font-size",
      `${targetValueFontSize}px`,
    );
    panelEl.style.setProperty(
      "--record-header-font-size",
      `${targetHeaderFontSize}px`,
    );
  }
}
