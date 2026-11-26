import { DecimalPipe } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
  CustomOptionComponent,
  CustomSelectComponent,
} from "@app/components/shared/custom-select/custom-select.component";
import type { HeatExpanderData } from "@app/components/shared/heat-driver-expander/heat-driver-expander.component";
import { AbsoluteWidgetNode } from "@app/models/settings";
import { TranslatePipe } from "@app/pipes/translate.pipe";

import { HEAT_RESULTS_COLUMNS } from "./heat-results-layout.model";

interface HeatChoice {
  index: number;
  number: number;
  isCurrent: boolean;
}

interface ResultRow {
  id: string;
  driver: string;
  laneColor: string;
  position: number;
  lane: number;
  laps: number;
  bestLap: number;
  averageLap: number;
  gap: number | null;
}

export interface HeatResultsWidgetContext {
  choices: readonly HeatChoice[];
  selectedIndex: number;
  rows: readonly ResultRow[];
  selectHeat: (index: number) => void;
}

const SAMPLE: HeatResultsWidgetContext = {
  choices: [{ index: 0, number: 1, isCurrent: true }],
  selectedIndex: 0,
  rows: [
    {
      id: "sample-1",
      driver: "Alex",
      laneColor: "#d74545",
      position: 1,
      lane: 1,
      laps: 22,
      bestLap: 5.124,
      averageLap: 5.502,
      gap: null,
    },
    {
      id: "sample-2",
      driver: "Jordan",
      laneColor: "#498bd7",
      position: 2,
      lane: 2,
      laps: 21,
      bestLap: 5.361,
      averageLap: 5.612,
      gap: 1.284,
    },
  ],
  selectHeat: () => undefined,
};

export function toHeatResultsRows(
  data: readonly HeatExpanderData[],
): ResultRow[] {
  return data
    .map(({ row, heatDriver, laneColor, driverName }) => ({
      id: row.objectId,
      driver: driverName ?? "",
      laneColor: laneColor.background,
      position: row.rank,
      lane: heatDriver.laneIndex + 1,
      laps: row.laps,
      bestLap: row.bestLapTime,
      averageLap: row.averageLapTime,
      gap: row.rank === 1 ? null : row.gap1st,
    }))
    .sort(
      (a, b) =>
        (a.position || Infinity) - (b.position || Infinity) || a.lane - b.lane,
    );
}

@Component({
  selector: "app-heat-results-widget",
  imports: [
    DecimalPipe,
    FormsModule,
    CustomSelectComponent,
    CustomOptionComponent,
    TranslatePipe,
  ],
  templateUrl: "./heat-results-widget.component.html",
  styleUrls: [
    "../shared/results-layout/results-standings.css",
    "./heat-results-widget.component.css",
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeatResultsWidgetComponent {
  readonly widget = input.required<AbsoluteWidgetNode>();
  readonly context = input<HeatResultsWidgetContext>();
  readonly preview = input(false);

  protected readonly view = computed(
    () => this.context() ?? (this.preview() ? SAMPLE : undefined),
  );
  protected readonly columns = computed(() =>
    HEAT_RESULTS_COLUMNS.filter(
      (column) =>
        !("setting" in column) ||
        this.widget().customSettings?.[column.setting] !== false,
    ),
  );

  protected numericValue(
    row: ResultRow,
    key: Exclude<keyof ResultRow, "id" | "driver" | "laneColor">,
  ): number | null {
    const value = row[key];
    return value != null &&
      Number.isFinite(value) &&
      (value !== 0 || key === "laps")
      ? value
      : null;
  }
}
