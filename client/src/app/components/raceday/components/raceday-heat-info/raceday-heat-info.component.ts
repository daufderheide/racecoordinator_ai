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
  ViewEncapsulation,
} from "@angular/core";
import { Race } from "@app/models/race";
import { AbsoluteWidgetNode } from "@app/models/settings";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { Heat } from "@app/race/heat";

@Component({
  standalone: true,
  selector: "app-raceday-heat-info",
  templateUrl: "./raceday-heat-info.component.html",
  styleUrls: ["./raceday-heat-info.component.css"],
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, TranslatePipe],
})
export class RacedayHeatInfoComponent implements AfterViewInit, OnDestroy {
  heat = input<Heat | undefined>(undefined);
  race = input<Race | undefined>(undefined);
  totalHeats = input<number>(0);
  widget = input<AbsoluteWidgetNode | null>(null);

  customGroupName = computed(() => {
    const r = this.race();
    const h = this.heat();
    if (!r || !h || !r.group_options?.enabled) return "";
    const names = r.group_options.names;
    const groupIdx = h.group;
    if (names && names[groupIdx] && names[groupIdx].trim() !== "") {
      return names[groupIdx].trim();
    }
    return "";
  });

  private infoPanel = viewChild<ElementRef<HTMLElement>>("infoPanel");
  private labelText = viewChild<ElementRef<HTMLElement>>("labelText");
  private valueText = viewChild<ElementRef<HTMLElement>>("valueText");
  private resizeObserver?: ResizeObserver;

  constructor() {
    effect(() => {
      this.heat();
      this.race();
      this.totalHeats();
      this.widget();
      setTimeout(() => this.fitText(), 0);
    });
  }

  ngAfterViewInit() {
    const panelEl = this.infoPanel()?.nativeElement;
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
    const panelEl = this.infoPanel()?.nativeElement;
    const labelEl = this.labelText()?.nativeElement;
    const valueEl = this.valueText()?.nativeElement;
    const widgetData = this.widget();

    if (!panelEl || !labelEl || !valueEl) return;

    const isAuto = !widgetData || widgetData.scaleMode === "auto";
    if (!isAuto) {
      panelEl.style.removeProperty("--header-value-font-size");
      panelEl.style.removeProperty("--header-label-font-size");
      return;
    }

    const labelString = labelEl.textContent?.trim() || "";
    const valueString = valueEl.textContent?.trim() || "";

    const labelStyle = window.getComputedStyle(labelEl);
    const valueStyle = window.getComputedStyle(valueEl);

    const labelRatio = 55 / 80;

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    let totalTextWidth = 100;

    if (context) {
      context.font = `${labelStyle.fontWeight || "600"} ${100 * labelRatio}px ${labelStyle.fontFamily || "sans-serif"}`;
      const labelWidth = context.measureText(labelString).width || 0;

      context.font = `${valueStyle.fontWeight || "700"} 100px ${valueStyle.fontFamily || "sans-serif"}`;
      const valueWidth = context.measureText(valueString).width || 0;

      const marginWidth = (8 / 18) * 100;
      totalTextWidth =
        labelWidth + valueWidth + (labelWidth > 0 ? marginWidth : 0);
    }

    const textHeight = 100;
    const containerWidth = panelEl.clientWidth * 0.9;
    const containerHeight = panelEl.clientHeight * 0.8;

    const scaleX = containerWidth / totalTextWidth;
    const scaleY = containerHeight / textHeight;
    const scale = Math.min(scaleX, scaleY);

    const baseScaleFactor = widgetData?.textScaleFactor ?? 1;
    const targetValueSize = Math.floor(100 * scale * baseScaleFactor);
    const targetLabelSize = Math.floor(targetValueSize * labelRatio);

    panelEl.style.setProperty(
      "--header-value-font-size",
      `${targetValueSize}px`,
    );
    panelEl.style.setProperty(
      "--header-label-font-size",
      `${targetLabelSize}px`,
    );
  }
}
