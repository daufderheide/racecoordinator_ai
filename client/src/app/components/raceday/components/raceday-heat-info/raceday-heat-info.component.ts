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
import { TextInfoFitHelper } from "@app/components/raceday/utils/text-info-fit.helper";
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
    TextInfoFitHelper.fitText(this.infoPanel()?.nativeElement, this.widget());
  }
}
