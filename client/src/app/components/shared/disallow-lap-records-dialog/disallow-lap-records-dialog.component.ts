import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  OnChanges,
  OnInit,
  output,
  SimpleChanges,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import {
  CustomOptionComponent,
  CustomSelectComponent,
} from "@app/components/shared/custom-select/custom-select.component";
import { DriverConverter } from "@app/converters/driver.converter";
import { DataService } from "@app/data.service";
import { isAtLeast, Role } from "@app/models/role";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { AuthService } from "@app/services/auth.service";
import { RaceService } from "@app/services/race.service";

import {
  compareNormalizedLaps,
  DriverFilterOption,
  extractDriverLaps,
  getDriverLaps,
  hasDuplicateLanes,
  isEmptyLane,
  LaneOption,
  NormalizedLap,
  RaceFilterOption,
  resolveDriverAndTeam,
  SortColumn,
  SortDirection,
} from "./disallow-lap-records.helper";

export type {
  SortColumn,
  SortDirection,
  NormalizedLap,
  RaceFilterOption,
  DriverFilterOption,
  LaneOption,
};

import { LocalDatePipe } from "@app/pipes/local-date.pipe";
import { DateTimeFormatService } from "@app/services/date-time-format.service";

@Component({
  standalone: true,
  selector: "app-disallow-lap-records-dialog",
  templateUrl: "./disallow-lap-records-dialog.component.html",
  styleUrls: ["./disallow-lap-records-dialog.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    LocalDatePipe,
    CustomSelectComponent,
    CustomOptionComponent,
  ],
})
export class DisallowLapRecordsDialogComponent implements OnInit, OnChanges {
  private dataService = inject(DataService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private raceService = inject(RaceService, { optional: true });
  private dateTimeFormatService = inject(DateTimeFormatService);

  visible = input<boolean>(false);
  races = input<any[]>([]);
  heats = input<any[]>([]);
  drivers = input<any[]>([]);
  allDrivers = input<any[]>([]);
  track = input<any>(null);
  currentHeatNumber = input<number>(1);
  raceHistoryId = input<string | null>(null);
  raceName = input<string>("");
  raceDate = input<Date | number | string | null | undefined>(undefined);
  isDemo = input<boolean>(false);

  get effectiveRaceDate(): Date | number | string | null {
    const direct = this.raceDate();
    let val: any = direct;
    if (val === null || val === undefined || val === "") {
      const heatsList = this.effectiveHeats;
      if (heatsList && heatsList.length > 0) {
        for (const h of heatsList) {
          if (h?.statistics?.startMillis) {
            val = h.statistics.startMillis;
            break;
          }
          if (h?.statistics?.startTime) {
            val = h.statistics.startTime;
            break;
          }
        }
      }
    }
    if (!val) return null;
    if (typeof val === "string" && /^\d+$/.test(val.trim())) {
      return parseInt(val.trim(), 10);
    }
    return val;
  }

  get effectiveRaces(): any[] {
    const inputRaces = this.races() || [];
    if (inputRaces.length > 0) {
      return inputRaces;
    }
    const singleRaceId = this.raceHistoryId();
    return [
      {
        id: singleRaceId,
        _id: singleRaceId,
        name: this.raceName(),
        model: { name: this.raceName() },
        timestamp: this.effectiveRaceDate,
        heats: this.effectiveHeats,
        drivers: this.allParticipants,
        track: this.track(),
        is_demo: this.isDemo(),
      },
    ];
  }

  get availableRaceOptions(): RaceFilterOption[] {
    const racesList = this.effectiveRaces;
    if (!racesList || racesList.length === 0) return [];
    return racesList.map((r, idx) => {
      const id = String(r._id || r.id || r.entity_id || idx);
      const name = (
        r.model?.name ||
        r.name ||
        this.raceName() ||
        "Race"
      ).trim();
      const date = this.getRaceTimestamp(r);
      return { id, name, date };
    });
  }

  get bannerDateDisplay(): string | null {
    if (this.selectedRaceId) {
      const found = this.availableRaceOptions.find(
        (r) => r.id === this.selectedRaceId,
      );
      if (found && found.date) {
        return this.dateTimeFormatService.format(found.date, "short");
      }
    }
    const races = this.availableRaceOptions;
    if (races.length > 1) {
      const dates = races
        .map((r) =>
          r.date
            ? typeof r.date === "number"
              ? r.date
              : new Date(r.date).getTime()
            : null,
        )
        .filter((d): d is number => d !== null && !isNaN(d))
        .sort((a, b) => a - b);
      if (dates.length > 0) {
        const earliest = this.dateTimeFormatService.formatDate(
          dates[0],
          "short",
        );
        const latest = this.dateTimeFormatService.formatDate(
          dates[dates.length - 1],
          "short",
        );
        return earliest === latest ? earliest : `${earliest} – ${latest}`;
      }
    }
    const eff = this.effectiveRaceDate;
    if (eff) {
      return this.dateTimeFormatService.format(eff, "short");
    }
    return null;
  }

  getRaceTimestamp(race: any): Date | number | string | null {
    if (!race) return null;
    if (race.timestamp) return race.timestamp;
    if (race.statistics?.startMillis) return race.statistics.startMillis;
    if (race.statistics?.startTime) return race.statistics.startTime;
    if (race.created_at) return race.created_at;
    if (race.model?.created_at) return race.model.created_at;
    if (race.heats && race.heats.length > 0) {
      for (const h of race.heats) {
        if (h.statistics?.startMillis) return h.statistics.startMillis;
        if (h.statistics?.startTime) return h.statistics.startTime;
      }
    }
    return null;
  }

  getRaceHeats(race: any): any[] {
    if (this.races() && this.races().length > 0) {
      return race.heats || [];
    }
    return this.effectiveHeats;
  }

  private get filteredRaces(): any[] {
    const list = this.effectiveRaces;
    if (!this.selectedRaceId) {
      return list;
    }
    return list.filter((r, idx) => {
      const id = String(r._id || r.id || r.entity_id || idx);
      return id === this.selectedRaceId;
    });
  }

  close = output<void>();
  recordsUpdated = output<{
    raceId?: string;
    heatNumber: number;
    lane: number;
    lapIndex: number;
    countTowardsRecords: boolean;
  }>();

  canEdit: boolean = false;
  selectedRaceId: string = "";
  selectedDriverName: string = "";
  selectedHeatNumber: number = -1;
  selectedLaneIndex: number = -1;

  sortColumn: SortColumn = "time";
  sortDirection: SortDirection = "asc";

  isSaving: boolean = false;
  errorMessage: string = "";
  successMessage: string = "";

  private allDriversList: any[] = [];
  private allTeamsList: any[] = [];

  constructor() {
    effect(() => {
      if (this.visible()) {
        this.errorMessage = "";
        this.successMessage = "";
        this.initSelection();
      }
    });
  }

  ngOnInit(): void {
    this.authService.currentRole$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((role) => {
        this.canEdit = isAtLeast(role, Role.DIRECTOR);
        this.cdr.markForCheck();
      });

    if (typeof this.dataService?.getDrivers === "function") {
      this.dataService
        .getDrivers()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (drivers) => {
            this.allDriversList = drivers || [];
            this.allDriversList.forEach((d) => {
              const converted = DriverConverter.fromJSON(d);
              DriverConverter.register(converted);
            });
            this.cdr.markForCheck();
          },
          error: () => {},
        });
    }

    if (typeof this.dataService?.getTeams === "function") {
      this.dataService
        .getTeams()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (teams) => {
            this.allTeamsList = teams || [];
            this.cdr.markForCheck();
          },
          error: () => {},
        });
    }

    if (typeof this.dataService?.getLaps === "function") {
      this.dataService
        .getLaps()
        ?.pipe(takeUntilDestroyed(this.destroyRef))
        ?.subscribe(() => {
          if (this.visible()) {
            this.cdr.markForCheck();
          }
        });
    }

    if (typeof this.dataService?.getRaceUpdate === "function") {
      this.dataService
        .getRaceUpdate()
        ?.pipe(takeUntilDestroyed(this.destroyRef))
        ?.subscribe(() => {
          if (this.visible()) {
            this.cdr.markForCheck();
          }
        });
    }

    if (this.raceService?.currentHeat$) {
      this.raceService.currentHeat$
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          if (this.visible()) {
            this.cdr.markForCheck();
          }
        });
    }

    if (this.raceService?.heats$) {
      this.raceService.heats$
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          if (this.visible()) {
            this.cdr.markForCheck();
          }
        });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["visible"] && this.visible()) {
      this.errorMessage = "";
      this.successMessage = "";
      this.initSelection();
    }
  }

  private initSelection(): void {
    this.selectedRaceId = "";
    this.selectedDriverName = "";
    this.selectedHeatNumber = -1;
    this.selectedLaneIndex = -1;
    this.sortColumn = "time";
    this.sortDirection = "asc";
    this.cdr.markForCheck();
  }

  getHeatNumber(heat: any): number {
    if (!heat) return 1;
    return heat.heatNumber ?? heat.heat_number ?? 1;
  }

  get effectiveHeats(): any[] {
    const inputHeats = this.heats() || [];
    const serviceHeats = this.raceService
      ? this.raceService.getHeats() || []
      : [];
    const currentHeat = this.raceService
      ? this.raceService.getCurrentHeat()
      : undefined;

    const countLapsInHeat = (h: any) => {
      const drivers = this.getHeatDrivers(h);
      return drivers.reduce((acc, d) => acc + this.getDriverLaps(d).length, 0);
    };

    const heatsMap = new Map<number, any>();

    const addOrMergeHeat = (h: any) => {
      if (!h) return;
      const num = this.getHeatNumber(h);
      const existing = heatsMap.get(num);
      if (!existing) {
        heatsMap.set(num, h);
      } else {
        const existingLaps = countLapsInHeat(existing);
        const newLaps = countLapsInHeat(h);
        if (newLaps > existingLaps) {
          heatsMap.set(num, h);
        } else if (
          existingLaps === 0 &&
          newLaps === 0 &&
          h.heatDrivers?.length > 0
        ) {
          heatsMap.set(num, h);
        }
      }
    };

    for (const h of serviceHeats) addOrMergeHeat(h);
    for (const h of inputHeats) addOrMergeHeat(h);
    if (currentHeat) addOrMergeHeat(currentHeat);

    const merged = Array.from(heatsMap.values()).sort(
      (a, b) => this.getHeatNumber(a) - this.getHeatNumber(b),
    );

    return merged.length > 0 ? merged : inputHeats;
  }

  get availableHeats(): number[] {
    const racesList = this.filteredRaces;
    if (!racesList || racesList.length === 0) return [];
    const heatNums = new Set<number>();
    for (const r of racesList) {
      const heatsList = this.getRaceHeats(r);
      for (const h of heatsList) {
        heatNums.add(this.getHeatNumber(h));
      }
    }
    return Array.from(heatNums).sort((a, b) => a - b);
  }

  private get allParticipants(): any[] {
    return [
      ...(this.drivers() || []),
      ...(this.raceService?.getParticipants() || []),
    ];
  }

  private get combinedAllDrivers(): any[] {
    return [...(this.allDrivers() || []), ...this.allDriversList];
  }

  private get combinedAllTeams(): any[] {
    return this.allTeamsList;
  }

  isEmptyLane(driverData: any): boolean {
    return isEmptyLane(driverData);
  }

  resolveDriverAndTeam(
    driverData: any,
    lap?: any,
  ): { driverName: string; teamName?: string } {
    return resolveDriverAndTeam(driverData, lap, this.combinedAllDrivers);
  }

  get availableDrivers(): DriverFilterOption[] {
    const racesList = this.filteredRaces;
    if (!racesList || racesList.length === 0) return [];
    const map = new Map<string, string | undefined>();
    const allDrivers = this.combinedAllDrivers;

    for (const r of racesList) {
      const heatsList = this.getRaceHeats(r);
      for (const heat of heatsList) {
        const drivers = this.getHeatDrivers(heat);
        for (const d of drivers) {
          if (isEmptyLane(d)) continue;
          const laps = getDriverLaps(d);
          if (laps.length > 0) {
            for (const lap of laps) {
              const resolved = resolveDriverAndTeam(d, lap, allDrivers);
              if (resolved.driverName && !map.has(resolved.driverName)) {
                map.set(resolved.driverName, resolved.teamName);
              }
            }
          } else {
            const resolved = resolveDriverAndTeam(d, undefined, allDrivers);
            if (resolved.driverName && !map.has(resolved.driverName)) {
              map.set(resolved.driverName, resolved.teamName);
            }
          }
        }
      }
    }

    return Array.from(map.entries())
      .map(([driverName, teamName]) => ({ driverName, teamName }))
      .sort((a, b) => a.driverName.localeCompare(b.driverName));
  }

  get availableLanes(): LaneOption[] {
    const trackData = this.track();
    const racesList = this.filteredRaces;
    let numLanes = trackData?.lanes?.length || 0;
    for (const r of racesList) {
      const heatsList = this.getRaceHeats(r);
      for (const h of heatsList) {
        const dList = this.getHeatDrivers(h);
        if (dList.length > numLanes) {
          numLanes = dList.length;
        }
        for (let i = 0; i < dList.length; i++) {
          const d = dList[i];
          const l =
            typeof d?.laneIndex === "number" && d.laneIndex >= 0
              ? d.laneIndex
              : typeof d?.lane_index === "number" && d.lane_index >= 0
                ? d.lane_index
                : i;
          if (l + 1 > numLanes) {
            numLanes = l + 1;
          }
        }
      }
    }
    const lanes: LaneOption[] = [];
    for (let i = 0; i < numLanes; i++) {
      const laneConfig =
        trackData?.lanes && trackData.lanes[i] ? trackData.lanes[i] : null;
      lanes.push({
        laneIndex: i,
        laneColor: laneConfig?.background_color || laneConfig?.backgroundColor,
        laneTextColor:
          laneConfig?.foreground_color || laneConfig?.foregroundColor,
      });
    }
    return lanes;
  }

  get selectedHeat(): any | null {
    if (this.selectedHeatNumber === -1) return null;
    const heatsList = this.effectiveHeats;
    if (!heatsList || heatsList.length === 0) return null;
    return (
      heatsList.find(
        (h) => this.getHeatNumber(h) === this.selectedHeatNumber,
      ) || null
    );
  }

  getDriverName(d: any): string {
    if (!d) return "";
    return this.resolveDriverAndTeam(d).driverName;
  }

  getHeatDrivers(heat: any): any[] {
    if (!heat) return [];
    if (Array.isArray(heat.heatDrivers) && heat.heatDrivers.length > 0)
      return heat.heatDrivers;
    if (Array.isArray(heat.drivers) && heat.drivers.length > 0)
      return heat.drivers;
    if (Array.isArray(heat.heat_drivers) && heat.heat_drivers.length > 0)
      return heat.heat_drivers;
    if (Array.isArray(heat.heatDrivers)) return heat.heatDrivers;
    if (Array.isArray(heat.drivers)) return heat.drivers;
    if (Array.isArray(heat.heat_drivers)) return heat.heat_drivers;
    return [];
  }

  getDriverLaps(driverData: any): any[] {
    return getDriverLaps(driverData);
  }

  get normalizedLaps(): NormalizedLap[] {
    const racesList = this.filteredRaces;
    const lapsList: NormalizedLap[] = [];
    const allDrivers = this.combinedAllDrivers;

    for (const race of racesList) {
      if (!race) continue;
      const raceId = race._id || race.id || race.entity_id || "";
      const raceName = (
        race.model?.name ||
        race.name ||
        this.raceName() ||
        "Race"
      ).trim();
      const raceDate = this.getRaceTimestamp(race);
      const trackData = race.track || this.track();
      const heatsList = this.getRaceHeats(race);

      for (const heat of heatsList) {
        if (!heat) continue;
        const heatNum = this.getHeatNumber(heat);
        if (
          this.selectedHeatNumber !== -1 &&
          heatNum !== this.selectedHeatNumber
        ) {
          continue;
        }

        const drivers = this.getHeatDrivers(heat);
        if (!drivers || drivers.length === 0) continue;

        const dupLanes = hasDuplicateLanes(drivers);

        drivers.forEach((driverData: any, dIndex: number) => {
          const driverLaps = extractDriverLaps(
            driverData,
            heatNum,
            dIndex,
            trackData,
            dupLanes,
            raceId,
            raceName,
            raceDate,
            this.selectedLaneIndex,
            this.selectedDriverName,
            allDrivers,
          );
          if (driverLaps.length > 0) {
            lapsList.push(...driverLaps);
          }
        });
      }
    }

    return lapsList.sort((a, b) =>
      compareNormalizedLaps(a, b, this.sortColumn, this.sortDirection),
    );
  }

  formatLapTime(time: any): string {
    const num = typeof time === "number" ? time : parseFloat(time);
    return isNaN(num) ? "0.000" : num.toFixed(3);
  }

  trackByLap(lap: NormalizedLap, index: number): string {
    return `${lap.raceId || "live"}-${lap.heatNumber}-${lap.laneIndex}-${lap.lapIndex}-${index}`;
  }

  onRaceChange(newRaceId: any): void {
    this.selectedRaceId = String(newRaceId ?? "");
    this.selectedHeatNumber = -1;
    this.selectedDriverName = "";
    this.errorMessage = "";
    this.successMessage = "";
    this.cdr.markForCheck();
  }

  onDriverChange(driverName: any): void {
    this.selectedDriverName = String(driverName ?? "");
    this.errorMessage = "";
    this.successMessage = "";
    this.cdr.markForCheck();
  }

  onHeatChange(newHeatNumber: any): void {
    this.selectedHeatNumber = Number(newHeatNumber);
    this.errorMessage = "";
    this.successMessage = "";
    this.cdr.markForCheck();
  }

  onLaneChange(laneIndex: any): void {
    this.selectedLaneIndex = Number(laneIndex);
    this.errorMessage = "";
    this.successMessage = "";
    this.cdr.markForCheck();
  }

  onSort(column: SortColumn): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
    } else {
      this.sortColumn = column;
      this.sortDirection = "asc";
    }
    this.cdr.markForCheck();
  }

  getAriaSort(column: SortColumn): "ascending" | "descending" | "none" {
    if (this.sortColumn !== column) return "none";
    return this.sortDirection === "asc" ? "ascending" : "descending";
  }

  toggleLapRecord(lap: NormalizedLap): void {
    if (!this.canEdit || this.isSaving) return;

    const newStatus = !lap.countTowardsRecords;
    this.isSaving = true;
    this.errorMessage = "";
    this.successMessage = "";
    this.cdr.markForCheck();

    const heatNum = lap.heatNumber;
    const lane = lap.laneIndex;
    const lapIndex = lap.lapIndex;

    const historyId = lap.raceId || this.raceHistoryId();
    const matchingRace = this.effectiveRaces.find((r) => {
      const id = r._id || r.id || r.entity_id;
      return id === historyId;
    });
    const isDemo =
      matchingRace?.is_demo !== undefined
        ? Boolean(matchingRace.is_demo)
        : this.isDemo();

    const request$ = historyId
      ? this.dataService.updateHistoryLapRecordStatus(
          historyId,
          heatNum,
          lane,
          lapIndex,
          newStatus,
          isDemo,
        )
      : this.dataService.updateLiveLapRecordStatus(
          heatNum,
          lane,
          lapIndex,
          newStatus,
        );

    request$.subscribe({
      next: (response) => {
        this.isSaving = false;
        lap.countTowardsRecords = newStatus;
        this.applyLapRecordStatusUpdate(
          historyId,
          heatNum,
          lane,
          lapIndex,
          newStatus,
          response?.bestLapTime,
        );
        this.recordsUpdated.emit({
          raceId: historyId || undefined,
          heatNumber: heatNum,
          lane,
          lapIndex,
          countTowardsRecords: newStatus,
        });
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isSaving = false;
        this.errorMessage =
          err?.error?.message ||
          err?.message ||
          "Failed to update lap record status";
        this.cdr.markForCheck();
      },
    });
  }

  private applyLapRecordStatusUpdate(
    raceId: string | null,
    heatNum: number,
    lane: number,
    lapIndex: number,
    newStatus: boolean,
    bestLapTime?: number,
  ): void {
    // 1. Update in effectiveRaces
    const racesToUpdate = this.effectiveRaces.filter((r) => {
      if (!raceId) return true;
      const id = r._id || r.id || r.entity_id;
      return id === raceId;
    });

    for (const r of racesToUpdate) {
      const heatsList = r.heats || [];
      const heat = heatsList.find(
        (h: any) => this.getHeatNumber(h) === heatNum,
      );
      if (!heat) continue;
      const drivers = this.getHeatDrivers(heat);
      if (drivers.length === 0) continue;

      const driverData =
        drivers.find((d: any, idx: number) => {
          const l =
            typeof d.laneIndex === "number"
              ? d.laneIndex
              : typeof d.lane_index === "number"
                ? d.lane_index
                : idx;
          return l === lane;
        }) || drivers[lane];

      if (driverData) {
        this.updateDriverLapRecord(
          driverData,
          lapIndex,
          newStatus,
          bestLapTime,
        );
      }
    }

    // 2. Also update live heats if live race mode
    const heatListsToUpdate = [
      this.effectiveHeats,
      this.heats() || [],
      this.raceService?.getHeats() || [],
      [this.raceService?.getCurrentHeat()].filter(Boolean),
    ];

    for (const heatsList of heatListsToUpdate) {
      const heat = heatsList.find((h) => this.getHeatNumber(h) === heatNum);
      if (!heat) continue;
      const drivers = this.getHeatDrivers(heat);
      if (drivers.length === 0) continue;

      const driverData =
        drivers.find((d: any, idx: number) => {
          const l =
            typeof d.laneIndex === "number"
              ? d.laneIndex
              : typeof d.lane_index === "number"
                ? d.lane_index
                : idx;
          return l === lane;
        }) || drivers[lane];

      if (driverData) {
        this.updateDriverLapRecord(
          driverData,
          lapIndex,
          newStatus,
          bestLapTime,
        );
      }
    }

    if (this.raceService) {
      const ch = this.raceService.getCurrentHeat();
      if (ch) {
        this.raceService.setCurrentHeat(ch);
      }
      const sh = this.raceService.getHeats();
      if (sh && sh.length > 0) {
        this.raceService.setHeats([...sh]);
      }
    }
  }

  private updateDriverLapRecord(
    driverData: any,
    lapIndex: number,
    newStatus: boolean,
    bestLapTime?: number,
  ): void {
    if (typeof driverData.updateLapRecordStatus === "function") {
      driverData.updateLapRecordStatus(lapIndex, newStatus);
    }
    if (driverData.lapsWithDetails && driverData.lapsWithDetails[lapIndex]) {
      driverData.lapsWithDetails[lapIndex].countTowardsRecords = newStatus;
    }
    if (
      (driverData as any)._lapsWithDetails &&
      (driverData as any)._lapsWithDetails[lapIndex]
    ) {
      (driverData as any)._lapsWithDetails[lapIndex].countTowardsRecords =
        newStatus;
    }
    if (driverData.laps && driverData.laps[lapIndex]) {
      if (typeof driverData.laps[lapIndex] === "object") {
        driverData.laps[lapIndex].countTowardsRecords = newStatus;
        driverData.laps[lapIndex].count_towards_records = newStatus;
      }
    }
    if (bestLapTime !== undefined) {
      if (typeof (driverData as any)._bestLapTime !== "undefined") {
        (driverData as any)._bestLapTime = bestLapTime;
      }
      if (typeof driverData.bestLapTime !== "undefined") {
        driverData.bestLapTime = bestLapTime;
      }
      if (typeof driverData.best_lap_time !== "undefined") {
        driverData.best_lap_time = bestLapTime;
      }
    }
  }

  onDismiss(): void {
    this.close.emit();
  }
}
