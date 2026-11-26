import { CommonModule } from "@angular/common";
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  NgZone,
  OnDestroy,
  untracked,
  viewChild,
  ViewEncapsulation,
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { of, Subscription } from "rxjs";
import { PartTextStyleDirective } from "@app/directives/part-text-style.directive";
import { AbsoluteWidgetNode } from "@app/models/settings";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { RaceTimeService } from "@app/services/race-time.service";
import {
  formatTimerDisplay,
  TIMER_PREVIEW_SECONDS,
} from "@app/utils/timer-format.utils";

@Component({
  standalone: true,
  selector: "app-raceday-timer",
  templateUrl: "./raceday-timer.component.html",
  styleUrls: ["./raceday-timer.component.css"],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PartTextStyleDirective, CommonModule, TranslatePipe],
})
export class RacedayTimerComponent implements AfterViewInit, OnDestroy {
  widget = input<AbsoluteWidgetNode | null>(null);
  showCountdownOverlay = input<boolean>(false);
  isEditor = input<boolean>(false);

  private raceTimeService = inject(RaceTimeService, { optional: true });
  private ngZone = inject(NgZone);
  private timeSub?: Subscription;

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
  private serviceIsCooldown = toSignal(
    this.raceTimeService?.isCooldown$ ?? of(false),
    { initialValue: this.raceTimeService?.isCooldown ?? false },
  );

  formattedTime = input<string>("");
  autoStatusLabel = input<string>("");
  isWarmup = input<boolean | undefined>(undefined);
  isCooldown = input<boolean | undefined>(undefined);

  protected displayFormattedTime = computed(() => {
    const custom = this.formattedTime();
    if (custom) return custom;
    if (this.isEditor()) {
      const s = this.widget()?.customSettings;
      return formatTimerDisplay(TIMER_PREVIEW_SECONDS, {
        format: s?.["timeDisplayFormat"] || "dynamic",
        subsecondMode: s?.["timeSubsecondMode"] || "threshold",
        subsecondThreshold: s?.["timeSubsecondThreshold"] ?? 10,
        subsecondDecimals: s?.["timeSubsecondDecimals"] ?? 2,
      });
    }
    return this.serviceFormattedTime() || "";
  });

  protected formattedTimeLength = computed(() => {
    return this.displayFormattedTime().length;
  });

  protected displayAutoStatusLabel = computed(() => {
    const custom = this.autoStatusLabel();
    if (custom) return custom;
    return this.serviceAutoStatusLabel() || "";
  });

  /** Auto-Starting / Auto-Advancing text is shown unless switched off (#1197). */
  protected showStatusText = computed(
    () => this.widget()?.customSettings?.["showStatusText"] !== false,
  );

  /** Glow around the digits: the original look and the default (#1212). */
  protected digitGlow = computed(
    () => this.widget()?.customSettings?.["timerGlow"] !== false,
  );

  /** Inner shadow on the panel edge: the original look and the default (#1212). */
  protected innerShadow = computed(
    () => this.widget()?.customSettings?.["timerInnerShadow"] !== false,
  );

  /** Uppercase is the original look and stays the default. */
  protected statusUppercase = computed(
    () => this.widget()?.customSettings?.["statusUppercase"] !== false,
  );

  /** Room for the status text: 24px as before, or more for a bigger custom size. */
  protected statusLabelHeight = computed(() => {
    const size = Number(this.widget()?.customSettings?.["statusFontSize"]);
    return size > 0 ? Math.max(24, Math.ceil(size * 1.4)) : 24;
  });

  /** The user's own text for a status key, or "" to use the translated default. */
  protected customStatusText(key: string): string {
    const settings = this.widget()?.customSettings;
    const custom =
      key === "RD_AUTO_STARTING"
        ? settings?.["autoStartingText"]
        : key === "RD_AUTO_ADVANCING"
          ? settings?.["autoAdvancingText"]
          : "";
    return typeof custom === "string" ? custom.trim() : "";
  }

  protected displayIsWarmup = computed(() => {
    const custom = this.isWarmup();
    if (custom !== undefined) return custom;
    return this.serviceIsWarmup() ?? false;
  });

  protected displayIsCooldown = computed(() => {
    const custom = this.isCooldown();
    if (custom !== undefined) return custom;
    return this.serviceIsCooldown() ?? false;
  });

  protected effectiveBackgroundColor = computed(() => {
    return (
      this.widget()?.customSettings?.["backgroundColor"] ||
      this.widget()?.backgroundColor ||
      null
    );
  });

  private timerText = viewChild<ElementRef<HTMLElement>>("timerText");
  private timerPanel = viewChild<ElementRef<HTMLElement>>("timerPanel");
  private resizeObserver?: ResizeObserver;

  private lastFittedTextLength = 0;
  private lastFittedScaleMode: string | null = null;
  private lastFittedCustomSize = 0;
  private lastFittedWidth = 0;
  private lastFittedHeight = 0;
  private lastFittedStatusHeight = 24;

  constructor() {
    effect(() => {
      // Trigger fit only when text character count, labels, or widget configuration change.
      // Crucial: We depend on formattedTimeLength (computed), NOT displayFormattedTime directly,
      // so high-frequency subsecond ticks with identical string lengths do NOT trigger reflows.
      this.formattedTimeLength();
      this.displayAutoStatusLabel();
      this.displayIsWarmup();
      this.displayIsCooldown();
      this.widget();

      // Schedule layout and font fitting outside Angular zone without Zone.js macrotasks.
      this.ngZone.runOutsideAngular(() => {
        queueMicrotask(() => this.fitText());
      });
    });

    // Subscribe to high-frequency timer ticks outside Angular zone to update textContent
    // directly without triggering Angular change detection passes.
    const timeStream$ =
      this.raceTimeService?.interpolatedFormattedTime$ ??
      this.raceTimeService?.formattedTime$;

    if (timeStream$) {
      this.ngZone.runOutsideAngular(() => {
        this.timeSub = timeStream$.subscribe((time) => {
          const textEl = this.timerText()?.nativeElement;
          if (textEl && !this.formattedTime() && !this.isEditor()) {
            const prevLen = textEl.textContent?.length ?? 0;
            textEl.textContent = time;
            if (time.length !== prevLen) {
              this.fitText();
            }
          }
        });
      });
    }
  }

  ngAfterViewInit() {
    const panelEl = this.timerPanel()?.nativeElement;
    if (panelEl && typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(() => {
        this.ngZone.runOutsideAngular(() => {
          this.fitText();
        });
      });
      this.resizeObserver.observe(panelEl);
    }
    this.ngZone.runOutsideAngular(() => {
      this.fitText();
    });
  }

  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.timeSub) {
      this.timeSub.unsubscribe();
    }
  }

  private fitText() {
    const textEl = this.timerText()?.nativeElement;
    const panelEl = this.timerPanel()?.nativeElement;
    const widgetData = this.widget();

    if (!textEl || !panelEl) return;

    const rawCustomSize = Number(widgetData?.customSettings?.["timeFontSize"]);
    const customFontSize = rawCustomSize > 0 ? rawCustomSize : 0;
    const hasCustomSize = customFontSize > 0;
    const isAuto = !widgetData || widgetData.scaleMode === "auto";
    if (hasCustomSize && !isAuto) {
      this.applyTimerFontSize(panelEl, customFontSize);
      return;
    }
    if (!isAuto) {
      panelEl.style.removeProperty("--timer-font-size");
      return;
    }

    const textString =
      textEl.textContent?.trim() ||
      untracked(() => this.displayFormattedTime().trim()) ||
      "00:00";
    const panelWidth = panelEl.clientWidth;
    const panelHeight = panelEl.clientHeight;
    const scaleMode = widgetData?.scaleMode || "auto";

    if (
      this.lastFittedTextLength === textString.length &&
      this.lastFittedScaleMode === scaleMode &&
      this.lastFittedCustomSize === customFontSize &&
      Math.abs(this.lastFittedWidth - panelWidth) < 1 &&
      Math.abs(this.lastFittedHeight - panelHeight) < 1 &&
      this.lastFittedStatusHeight === this.statusLabelHeight()
    ) {
      return;
    }

    this.lastFittedTextLength = textString.length;
    this.lastFittedScaleMode = scaleMode;
    this.lastFittedCustomSize = customFontSize;
    this.lastFittedWidth = panelWidth;
    this.lastFittedHeight = panelHeight;
    this.lastFittedStatusHeight = this.statusLabelHeight();

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
    // (the top one grows with a bigger custom status text size).
    const reservedLabelHeight = this.statusLabelHeight() + 24;

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
    const fittedFontSize = Math.floor(100 * scale * baseScaleFactor);
    // In auto-scale mode a Time Font Size setting is the largest size; the text
    // still shrinks when it would not fit (e.g. "02:03.45" in a small box).
    const targetFontSize = hasCustomSize
      ? Math.min(customFontSize, Math.floor(100 * scale))
      : fittedFontSize;

    this.applyTimerFontSize(panelEl, targetFontSize);
  }

  private applyTimerFontSize(panelEl: HTMLElement, fontSize: number): void {
    // Proportional vertical offset so text stays visually centered at any size
    const textOffset = Math.max(0, Math.floor(fontSize * 0.05));
    // Apply via CSS custom property so children scale too
    panelEl.style.setProperty("--timer-font-size", `${fontSize}px`);
    panelEl.style.setProperty("--timer-text-offset", `-${textOffset}px`);
  }
}
