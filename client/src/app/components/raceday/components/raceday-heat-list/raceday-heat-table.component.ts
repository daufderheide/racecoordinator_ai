import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import { PartTextStyleDirective } from "@app/directives/part-text-style.directive";
import { AbsoluteWidgetNode } from "@app/models/settings";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { emptyLaneLabel } from "@app/utils/empty-value.utils";

import type { ProcessedHeat } from "./raceday-heat-list.component";

@Component({
  selector: "app-raceday-heat-table",
  imports: [PartTextStyleDirective, TranslatePipe],
  templateUrl: "./raceday-heat-table.component.html",
  styleUrl: "./raceday-heat-table.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RacedayHeatTableComponent {
  readonly heats = input.required<ProcessedHeat[]>();
  readonly trackLaneCount = input(0);
  readonly settings = input<AbsoluteWidgetNode["customSettings"]>();
  protected readonly showStatus = computed(
    () => this.settings()?.["heatTableShowStatus"] !== false,
  );
  protected readonly showGroup = computed(
    () =>
      this.settings()?.["heatTableShowGroup"] !== false &&
      this.heats().some((heat) => heat.hasGroup || heat.groupName),
  );
  protected readonly showLaneColors = computed(
    () => this.settings()?.["heatTableShowLaneColors"] !== false,
  );
  protected readonly laneIndexes = computed(() => {
    if (this.settings()?.["heatTableShowLanes"] === false) return [];
    const laneCount = this.heats().reduce(
      (count, heat) => Math.max(count, heat.lanes.length),
      this.trackLaneCount(),
    );
    return Array.from({ length: laneCount }, (_, index) => index);
  });

  protected statusKey(heat: ProcessedHeat): string {
    if (heat.isActive) return "HR_CURRENT_HEAT_BADGE";
    return heat.isCompleted ? "HL_TABLE_COMPLETED" : "HL_TABLE_UPCOMING";
  }

  protected emptyLane(fallback: string): string {
    return emptyLaneLabel(this.settings(), fallback);
  }
}
