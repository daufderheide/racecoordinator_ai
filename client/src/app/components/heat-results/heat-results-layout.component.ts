import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  viewChild,
} from "@angular/core";
import type { HeatExpanderData } from "@app/components/shared/heat-driver-expander/heat-driver-expander.component";
import {
  ResultsLayoutComponent,
  ResultsWidgetContext,
} from "@app/components/shared/results-layout/results-layout.component";
import { Heat } from "@app/race/heat";

import { toHeatResultsRows } from "./heat-results-widget.component";

@Component({
  selector: "app-heat-results-layout",
  imports: [ResultsLayoutComponent],
  template:
    '<app-results-layout purpose="heat-results" [context]="context()" />',
  styles: [":host { display: contents; }"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeatResultsLayoutComponent {
  readonly heats = input.required<readonly Heat[]>();
  readonly selectableHeats = input.required<readonly Heat[]>();
  readonly currentHeat = input<Heat>();
  readonly selectedHeatIndex = input.required<number>();
  readonly data = input.required<readonly HeatExpanderData[]>();
  readonly heatSelected = output<number>();

  private readonly resultsLayout = viewChild(ResultsLayoutComponent);
  readonly activeLayout = computed(() => this.resultsLayout()?.activeLayout());
  protected readonly context = computed<ResultsWidgetContext>(() => ({
    heatResultsWidgetContext: {
      choices: this.selectableHeats().map((heat) => ({
        index: this.heats().indexOf(heat),
        number: heat.heatNumber,
        isCurrent: heat === this.currentHeat(),
      })),
      selectedIndex: this.selectedHeatIndex(),
      rows: toHeatResultsRows(this.data()),
      selectHeat: (index) => this.heatSelected.emit(index),
    },
  }));
}
