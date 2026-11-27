import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import { PartTextStyleDirective } from "@app/directives/part-text-style.directive";
import { AbsoluteWidgetNode } from "@app/models/settings";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { emptyLaneLabel, emptyValue } from "@app/utils/empty-value.utils";

import type { ProcessedHeat } from "./raceday-heat-list.component";

@Component({
  selector: "app-raceday-heat-details",
  imports: [PartTextStyleDirective, TranslatePipe],
  templateUrl: "./raceday-heat-details.component.html",
  styleUrl: "./raceday-heat-details.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RacedayHeatDetailsComponent {
  readonly heat = input.required<ProcessedHeat>();
  readonly laneCount = input.required<number>();
  readonly settings = input<AbsoluteWidgetNode["customSettings"]>();
  readonly useLaneColors = input(true);

  protected readonly showTiming = computed(
    () => this.heat().isActive || this.heat().isCompleted,
  );
  protected readonly titleKey = computed(() => {
    const heat = this.heat();
    if (heat.isCompleted) return "RD_WIN_HEAT_RESULTS";
    return heat.isActive ? "HL_TABLE_LIVE_TIMING" : "HL_TABLE_LINEUP";
  });
  protected readonly laneIndexes = computed(() =>
    Array.from({ length: this.laneCount() }, (_, index) => index),
  );
  protected readonly emptyMetric = computed(() =>
    emptyValue(this.settings(), "--"),
  );

  protected emptyLane(label: string): string {
    return emptyLaneLabel(this.settings(), label);
  }
}
