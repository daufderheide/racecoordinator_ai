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
import { AbsoluteWidgetNode } from "@app/models/settings";
import { Track } from "@app/models/track";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { PartTextStyleDirective } from "@app/directives/part-text-style.directive";

@Component({
  standalone: true,
  selector: "app-raceday-track-name",
  templateUrl: "./raceday-track-name.component.html",
  styleUrls: ["./raceday-track-name.component.css"],
  encapsulation: ViewEncapsulation.None,
  imports: [PartTextStyleDirective, CommonModule, TranslatePipe],
})
export class RacedayTrackNameComponent implements AfterViewInit, OnDestroy {
  track = input<Track | undefined>(undefined);
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

  constructor() {
    effect(() => {
      this.track();
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
