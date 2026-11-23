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
import { PartTextStyleDirective } from "@app/directives/part-text-style.directive";
import { Race } from "@app/models/race";
import { AbsoluteWidgetNode } from "@app/models/settings";
import { TranslatePipe } from "@app/pipes/translate.pipe";

@Component({
  standalone: true,
  selector: "app-raceday-event-name",
  templateUrl: "./raceday-event-name.component.html",
  styleUrls: ["./raceday-event-name.component.css"],
  encapsulation: ViewEncapsulation.None,
  imports: [PartTextStyleDirective, CommonModule, TranslatePipe],
})
export class RacedayEventNameComponent implements AfterViewInit, OnDestroy {
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

  get eventName(): string {
    return (this.race() as any)?.event_name || "";
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
