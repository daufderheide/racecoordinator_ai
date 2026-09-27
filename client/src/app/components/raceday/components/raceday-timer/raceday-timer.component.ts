import { CommonModule } from "@angular/common";
import {
  AfterViewInit,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  OnDestroy,
  viewChild,
  ViewEncapsulation,
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { of } from "rxjs";
import { AbsoluteWidgetNode } from "@app/models/settings";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { RaceTimeService } from "@app/services/race-time.service";

@Component({
  standalone: true,
  selector: "app-raceday-timer",
  templateUrl: "./raceday-timer.component.html",
  styleUrls: ["./raceday-timer.component.css"],
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, TranslatePipe],
})
export class RacedayTimerComponent implements AfterViewInit, OnDestroy {
  widget = input<AbsoluteWidgetNode | null>(null);
  showCountdownOverlay = input<boolean>(false);

  private raceTimeService = inject(RaceTimeService, { optional: true });

  private serviceFormattedTime = toSignal(
    this.raceTimeService?.formattedTime$ ?? of(""),
    { initialValue: this.raceTimeService?.formattedTime ?? "" },
  );
  private serviceAutoStatusLabel = toSignal(
    this.raceTimeService?.autoStatusLabel$ ?? of(""),
    { initialValue: this.raceTimeService?.autoStatusLabel ?? "" },
  );
  private serviceIsWarmup = toSignal(
    this.raceTimeService?.isWarmup$ ?? of(false),
    { initialValue: this.raceTimeService?.isWarmup ?? false },
  );

  formattedTime = input<string>("");
  autoStatusLabel = input<string>("");
  isWarmup = input<boolean | undefined>(undefined);

  protected displayFormattedTime = computed(() => {
    const custom = this.formattedTime();
    if (custom) return custom;
    return this.serviceFormattedTime() || "";
  });

  protected displayAutoStatusLabel = computed(() => {
    const custom = this.autoStatusLabel();
    if (custom) return custom;
    return this.serviceAutoStatusLabel() || "";
  });

  protected displayIsWarmup = computed(() => {
    const custom = this.isWarmup();
    if (custom !== undefined) return custom;
    return this.serviceIsWarmup() ?? false;
  });

  private timerText = viewChild<ElementRef<HTMLElement>>("timerText");
  private timerPanel = viewChild<ElementRef<HTMLElement>>("timerPanel");
  private resizeObserver?: ResizeObserver;

  constructor() {
    effect(() => {
      // Trigger whenever inputs change
      this.displayFormattedTime();
      this.displayAutoStatusLabel();
      this.displayIsWarmup();
      this.widget();

      // Schedule fit on next microtask
      setTimeout(() => this.fitText(), 0);
    });
  }

  ngAfterViewInit() {
    const panelEl = this.timerPanel()?.nativeElement;
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
    const textEl = this.timerText()?.nativeElement;
    const panelEl = this.timerPanel()?.nativeElement;
    const widgetData = this.widget();

    if (!textEl || !panelEl) return;

    const isAuto = !widgetData || widgetData.scaleMode === "auto";
    if (!isAuto) {
      panelEl.style.removeProperty("--timer-font-size");
      return;
    }

    const textString = textEl.textContent?.trim() || "00:00";
    const style = window.getComputedStyle(textEl);
    const fontFamily = style.fontFamily || "'Courier New', Courier, monospace";
    const fontWeight = style.fontWeight || "bold";

    // Use canvas to measure text width without touching the DOM and causing layout thrashing
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    let textWidth = 100;
    if (context) {
      context.font = `${fontWeight} 100px ${fontFamily}`;
      textWidth = context.measureText(textString).width || 1;
    }

    // Height of text at 100px font-size is roughly 100px (line-height is 1)
    const textHeight = 100;

    // Always reserve space for both labels so timer size stays consistent
    const reservedLabelHeight = 48;

    // Pad container bounds (12% horizontal margin, reserve label height vertically)
    const containerWidth = panelEl.clientWidth * 0.88;
    const containerHeight = Math.max(
      1,
      panelEl.clientHeight - reservedLabelHeight,
    );

    const scaleX = containerWidth / textWidth;
    const scaleY = containerHeight / textHeight;
    const scale = Math.min(scaleX, scaleY);

    const baseScaleFactor = widgetData?.textScaleFactor ?? 1;
    const targetFontSize = Math.floor(100 * scale * baseScaleFactor);

    // Proportional vertical offset so text stays visually centered at any size
    const textOffset = Math.max(0, Math.floor(targetFontSize * 0.05));

    // Apply via CSS custom property so children scale too
    panelEl.style.setProperty("--timer-font-size", `${targetFontSize}px`);
    panelEl.style.setProperty("--timer-text-offset", `-${textOffset}px`);
  }
}
