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
import { PartTextStyleDirective } from "@app/directives/part-text-style.directive";

@Component({
  standalone: true,
  selector: "app-raceday-race-name",
  templateUrl: "./raceday-race-name.component.html",
  styleUrls: ["./raceday-race-name.component.css"],
  encapsulation: ViewEncapsulation.None,
  imports: [PartTextStyleDirective, CommonModule, TranslatePipe],
})
export class RacedayRaceNameComponent implements AfterViewInit, OnDestroy {
  race = input<Race | undefined>(undefined);
  widget = input<AbsoluteWidgetNode | null>(null);

  effectiveBackgroundColor = computed(() => {
    return (
      this.widget()?.customSettings?.["backgroundColor"] ||
      this.widget()?.backgroundColor ||
      null
    );
  });

  private infoPanel = viewChild<ElementRef<HTMLElement>>("infoPanel");
  private labelText = viewChild<ElementRef<HTMLElement>>("labelText");
  private valueText = viewChild<ElementRef<HTMLElement>>("valueText");
  private resizeObserver?: ResizeObserver;

  get isEvent(): boolean {
    return !!(this.race() as any)?.is_event;
  }

  get eventName(): string {
    return (this.race() as any)?.event_name || "";
  }

  get currentEventRaceIndex(): number {
    return ((this.race() as any)?.current_event_race_index || 0) + 1;
  }

  get totalEventRaces(): number {
    return (this.race() as any)?.total_event_races || 0;
  }

  get formattedRaceName(): string {
    const r = this.race();
    if (!r) return "";
    if (this.isEvent) {
      return `${r.name} ${this.currentEventRaceIndex} / ${this.totalEventRaces}`;
    }
    return r.name;
  }

  constructor() {
    effect(() => {
      this.race();
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
