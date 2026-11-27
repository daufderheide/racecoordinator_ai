import { CommonModule, formatNumber } from "@angular/common";
import {
  Component,
  computed,
  effect,
  inject,
  Injector,
  input,
  LOCALE_ID,
  signal,
  ViewEncapsulation,
} from "@angular/core";
import { LaneGridLabelHelper } from "@app/components/raceday/utils/lane-grid-label.helper";
import {
  getLabelSource,
  getRecordLabelField,
  RACE_TIMER_LABEL_SOURCE,
} from "@app/models/label-source";
import { AbsoluteWidgetNode } from "@app/models/settings";
import { RaceTimeService } from "@app/services/race-time.service";
import { emptyValue } from "@app/utils/empty-value.utils";
import {
  formatTimerDisplay,
  TIMER_PREVIEW_SECONDS,
} from "@app/utils/timer-format.utils";

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
  recordValue = input<string | number>();
  isEditor = input(false);
  private readonly locale = inject(LOCALE_ID);
  private readonly injector = inject(Injector);
  private readonly timerText = signal("--");
  private readonly source = computed(() =>
    getLabelSource(this.widget()?.customSettings),
  );

  readonly displayText = computed(() => {
    const settings = this.widget()?.customSettings;
    const source = this.source();
    if (source === RACE_TIMER_LABEL_SOURCE) {
      return this.isEditor()
        ? formatTimerDisplay(TIMER_PREVIEW_SECONDS)
        : this.timerText();
    }

    const field = getRecordLabelField(source);
    if (!field) return String(settings?.["text"] || "");

    const value = this.recordValue();
    if (field.kind === "holder") {
      return typeof value === "string" && value.trim() && value !== "---"
        ? value
        : emptyValue(settings, "---");
    }

    if (
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      value <= 0 ||
      (field.kind === "lap" && value >= 1000000)
    ) {
      return emptyValue(settings, field.kind === "lap" ? "--.---" : "--");
    }

    const precision = Number(settings?.["recordDecimals"] ?? 3);
    const decimals =
      Number.isInteger(precision) && precision >= 0 && precision <= 3
        ? precision
        : 3;
    return formatNumber(value, this.locale, `1.${decimals}-${decimals}`);
  });

  constructor() {
    effect((onCleanup) => {
      if (this.source() !== RACE_TIMER_LABEL_SOURCE || this.isEditor()) return;

      // Use the same interpolated stream as the built-in timer.
      const clock = this.injector.get(RaceTimeService, null);
      const subscription = clock?.interpolatedFormattedTime$?.subscribe(
        (value) => this.timerText.set(value),
      );
      onCleanup(() => subscription?.unsubscribe());
    });
  }

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
    const text = this.displayText();
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
