import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from "@angular/core";
import { PartTextStyleDirective } from "@app/directives/part-text-style.directive";
import { AbsoluteWidgetNode } from "@app/models/settings";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { emptyLaneLabel } from "@app/utils/empty-value.utils";

import { RacedayHeatDetailsComponent } from "./raceday-heat-details.component";
import type { ProcessedHeat } from "./raceday-heat-list.component";

@Component({
  selector: "app-raceday-heat-table",
  imports: [PartTextStyleDirective, RacedayHeatDetailsComponent, TranslatePipe],
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
  protected readonly showDetails = computed(
    () => this.settings()?.["heatTableShowDetails"] === true,
  );
  private readonly expandedHeat = signal<string | number | null>(null);
  protected readonly laneCount = computed(() =>
    this.heats().reduce(
      (count, heat) => Math.max(count, heat.lanes.length),
      this.trackLaneCount(),
    ),
  );
  protected readonly laneIndexes = computed(() =>
    this.settings()?.["heatTableShowLanes"] === false
      ? []
      : Array.from({ length: this.laneCount() }, (_, index) => index),
  );
  protected readonly columnCount = computed(
    () =>
      1 +
      Number(this.showStatus()) +
      Number(this.showGroup()) +
      this.laneIndexes().length,
  );

  protected isExpanded(heat: ProcessedHeat): boolean {
    return this.expandedHeat() === (heat.objectId || heat.heatNumber);
  }

  protected toggleDetails(heat: ProcessedHeat): void {
    this.expandedHeat.set(
      this.isExpanded(heat) ? null : heat.objectId || heat.heatNumber,
    );
  }

  protected statusKey(heat: ProcessedHeat): string {
    if (heat.isCompleted) return "HL_TABLE_COMPLETED";
    return heat.isActive ? "HR_CURRENT_HEAT_BADGE" : "HL_TABLE_UPCOMING";
  }

  protected emptyLane(fallback: string): string {
    return emptyLaneLabel(this.settings(), fallback);
  }
}
