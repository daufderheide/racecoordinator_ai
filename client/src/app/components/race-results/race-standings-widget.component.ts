import { DecimalPipe } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import { AbsoluteWidgetNode } from "@app/models/settings";
import { TranslatePipe } from "@app/pipes/translate.pipe";

import type { StandingsRow } from "./race-results.types";
import { formatRaceResultsGap } from "./race-results-format";
import { RACE_STANDINGS_COLUMNS } from "./race-standings-columns";

type TableRow = Pick<
  StandingsRow,
  | "rank"
  | "visualIndex"
  | "score"
  | "laps"
  | "averageLapTime"
  | "bestLapTime"
  | "gap1st"
> & {
  driver: Pick<StandingsRow["driver"], "entity_id" | "name" | "nickname">;
};

export interface RaceStandingsWidgetContext {
  rows: readonly TableRow[];
  scoreFormat: string;
  driverNavigation?: {
    getId: (driver: TableRow["driver"]) => string;
    open: (driverId: string, event: MouseEvent) => void;
  };
}

const SAMPLE: RaceStandingsWidgetContext = {
  rows: [
    {
      rank: 1,
      visualIndex: 0,
      driver: { entity_id: "sample-1", name: "Alex", nickname: "" },
      score: 25,
      laps: 72,
      averageLapTime: 5.502,
      bestLapTime: 5.124,
      gap1st: null,
    },
    {
      rank: 2,
      visualIndex: 1,
      driver: { entity_id: "sample-2", name: "Jordan", nickname: "" },
      score: 18,
      laps: 71,
      averageLapTime: 5.612,
      bestLapTime: 5.361,
      gap1st: 1.284,
    },
  ],
  scoreFormat: "1.0-0",
};

@Component({
  selector: "app-race-standings-widget",
  imports: [DecimalPipe, TranslatePipe],
  templateUrl: "./race-standings-widget.component.html",
  styleUrl: "../shared/results-layout/results-standings.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RaceStandingsWidgetComponent {
  readonly widget = input.required<AbsoluteWidgetNode>();
  readonly context = input<RaceStandingsWidgetContext>();
  readonly preview = input(false);

  protected readonly view = computed(
    () => this.context() ?? (this.preview() ? SAMPLE : undefined),
  );
  protected readonly rows = computed(() =>
    [...(this.view()?.rows ?? [])].sort(
      (a, b) => a.visualIndex - b.visualIndex,
    ),
  );
  protected readonly columns = computed(() =>
    RACE_STANDINGS_COLUMNS.filter(
      (column) =>
        !("setting" in column) ||
        this.widget().customSettings?.[column.setting] !== false,
    ),
  );
  protected readonly formatGap = formatRaceResultsGap;
}
