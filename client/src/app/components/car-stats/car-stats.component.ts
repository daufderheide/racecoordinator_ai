import { CommonModule } from "@angular/common";
import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { forkJoin, of } from "rxjs";
import { catchError } from "rxjs/operators";
import {
  CustomOptionComponent,
  CustomSelectComponent,
} from "@app/components/shared/custom-select/custom-select.component";
import { EditorTitleComponent } from "@app/components/shared/editor-title/editor-title.component";
import { DataService } from "@app/data.service";
import { Car } from "@app/models/car";
import { CarField, sortCarFields } from "@app/models/car-field";
import {
  CAR_STATS_FIXED_GROUPS,
  CarStatRow,
  CarStatsGroup,
  carStatsGroups,
  CarStatsQuery,
  formatCarStatTime,
} from "@app/models/car-stats";
import { LocalDatePipe } from "@app/pipes/local-date.pipe";
import { TranslatePipe } from "@app/pipes/translate.pipe";

/** A filter choice: an id and the name to show. */
interface Choice {
  id: string;
  name: string;
}

/** The filters on the page, each sent to the server as a query parameter. */
type FilterKey = "carId" | "carClass" | "trackId" | "driverId";

/**
 * Car Stats (step 5 of #1210): results from the saved races, grouped by car,
 * class, a setup field, track or driver, and narrowed by car, class, track or
 * driver. The server works them out from each heat's car as it ran.
 */
@Component({
  standalone: true,
  selector: "app-car-stats",
  templateUrl: "./car-stats.component.html",
  styleUrls: ["./car-stats.component.css"],
  imports: [
    CommonModule,
    TranslatePipe,
    LocalDatePipe,
    EditorTitleComponent,
    CustomSelectComponent,
    CustomOptionComponent,
  ],
})
export class CarStatsComponent implements OnInit {
  private dataService = inject(DataService);
  private route = inject(ActivatedRoute);

  protected readonly groups = signal<CarStatsGroup[]>(CAR_STATS_FIXED_GROUPS);
  protected readonly cars = signal<Choice[]>([]);
  protected readonly classes = signal<string[]>([]);
  protected readonly tracks = signal<Choice[]>([]);
  protected readonly drivers = signal<Choice[]>([]);

  protected readonly query = signal<CarStatsQuery>({ groupBy: "car" });
  protected readonly rows = signal<CarStatRow[]>([]);
  protected readonly loading = signal(true);
  protected readonly failed = signal(false);

  protected readonly formatTime = formatCarStatTime;

  /** The first column's header: the chosen group. */
  protected readonly groupHeader = computed<CarStatsGroup>(
    () =>
      this.groups().find((g) => g.value === this.query().groupBy) ??
      CAR_STATS_FIXED_GROUPS[0],
  );

  ngOnInit(): void {
    const params = this.route.snapshot?.queryParamMap;
    const carId = params?.get("carId") || "";
    if (carId) this.query.update((q) => ({ ...q, carId }));

    const safe = <T>(obs: any) => obs.pipe(catchError(() => of([] as T[])));
    forkJoin({
      cars: safe<any>(this.dataService.getCars()),
      fields: safe<any>(this.dataService.getCarFields()),
      tracks: safe<any>(this.dataService.getTracks()),
      drivers: safe<any>(this.dataService.getDrivers()),
    }).subscribe((res: any) => {
      const cars = ((res.cars as any[]) || []).map((c) => Car.fromJSON(c));
      this.cars.set(
        byName(cars.map((c) => ({ id: c.entity_id, name: c.name }))),
      );
      this.classes.set(uniqueSorted(cars.map((c) => c.carClass)));
      const fields = sortCarFields(
        ((res.fields as any[]) || []).map((f) => CarField.fromJSON(f)),
      );
      this.groups.set(carStatsGroups(fields));
      this.tracks.set(byName((res.tracks || []).map(toChoice)));
      this.drivers.set(byName((res.drivers || []).map(toChoice)));
    });
    this.load();
  }

  protected setGroup(groupBy: string): void {
    if (!groupBy || groupBy === this.query().groupBy) return;
    this.query.update((q) => ({ ...q, groupBy }));
    this.load();
  }

  protected setFilter(key: FilterKey, value: string): void {
    if ((this.query()[key] || "") === (value || "")) return;
    this.query.update((q) => ({ ...q, [key]: value || undefined }));
    this.load();
  }

  protected setDemo(isDemo: boolean): void {
    this.query.update((q) => ({ ...q, isDemo }));
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.failed.set(false);
    this.dataService.getCarStatistics(this.query()).subscribe({
      next: (rows) => {
        this.rows.set(rows || []);
        this.loading.set(false);
      },
      error: () => {
        this.rows.set([]);
        this.failed.set(true);
        this.loading.set(false);
      },
    });
  }
}

function toChoice(raw: any): Choice {
  const id = raw?.entity_id || raw?.entityId || raw?.model?.entityId || "";
  const nickname = (raw?.nickname || "").trim();
  return { id, name: nickname || raw?.name || id };
}

function byName(list: Choice[]): Choice[] {
  return list.filter((c) => c.id).sort((a, b) => a.name.localeCompare(b.name));
}

function uniqueSorted(values: (string | undefined)[]): string[] {
  const seen = new Map<string, string>();
  for (const v of values) {
    const t = (v || "").trim();
    if (t && !seen.has(t.toLowerCase())) seen.set(t.toLowerCase(), t);
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}
