import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  input,
  OnChanges,
  OnInit,
  output,
  SimpleChanges,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import {
  CustomOptionComponent,
  CustomSelectComponent,
} from "@app/components/shared/custom-select/custom-select.component";
import { DisallowLapRecordsDialogComponent } from "@app/components/shared/disallow-lap-records-dialog/disallow-lap-records-dialog.component";
import { DataService } from "@app/data.service";
import { isAtLeast, Role } from "@app/models/role";
import { LocalDatePipe } from "@app/pipes/local-date.pipe";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { AuthService } from "@app/services/auth.service";

export interface GroupedRaceHistory {
  id: string;
  raceName: string;
  isDemo: boolean;
  earliestDate: number | null;
  latestDate: number | null;
  ineligibleLapCount: number;
  races: any[];
  trackName?: string;
}

@Component({
  standalone: true,
  selector: "app-race-history-dialog",
  templateUrl: "./race-history-dialog.component.html",
  styleUrls: ["./race-history-dialog.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    LocalDatePipe,
    CustomSelectComponent,
    CustomOptionComponent,
    DisallowLapRecordsDialogComponent,
  ],
})
export class RaceHistoryDialogComponent implements OnInit, OnChanges {
  private dataService = inject(DataService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  visible = input<boolean>(false);
  close = output<void>();

  canEdit: boolean = false;
  isLoading: boolean = false;
  raceHistories: any[] = [];
  searchTerm: string = "";

  selectedRaceGroup: GroupedRaceHistory | null = null;
  selectedHistoryDetails: any | null = null;
  showDisallowDialog: boolean = false;
  isLoadingDetails: boolean = false;

  selectedRaceIdByGroup: Map<string, string> = new Map();

  ngOnInit(): void {
    this.authService.currentRole$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((role) => {
        this.canEdit = isAtLeast(role, Role.DIRECTOR);
        this.cdr.markForCheck();
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["visible"] && this.visible()) {
      this.loadHistories();
    }
  }

  loadHistories(): void {
    this.isLoading = true;
    this.raceHistories = [];
    this.cdr.markForCheck();

    this.dataService.getAllFinishedRaceHistory().subscribe({
      next: (histories) => {
        this.raceHistories = [...(histories || [])].sort((a, b) => {
          const timeA = this.getNumericRaceTimestamp(a) || 0;
          const timeB = this.getNumericRaceTimestamp(b) || 0;
          return timeB - timeA;
        });
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  hasRecordData(race: any): boolean {
    if (!race || !Array.isArray(race.heats) || race.heats.length === 0) {
      return false;
    }
    for (const heat of race.heats) {
      const drivers = heat?.drivers || heat?.heatDrivers || heat?.heat_drivers;
      if (!Array.isArray(drivers)) continue;
      for (const driver of drivers) {
        const laps =
          driver?.laps ||
          driver?.lapsWithDetails ||
          driver?._lapsWithDetails ||
          driver?._laps ||
          driver?.lapTimes ||
          driver?._lapTimes;
        if (!Array.isArray(laps)) continue;
        for (const lap of laps) {
          const num =
            typeof lap === "number"
              ? lap
              : parseFloat(lap?.time ?? lap?.lapTime ?? lap?.lap_time ?? 0);
          if (!isNaN(num) && num > 0) {
            return true;
          }
        }
      }
    }
    return false;
  }

  getRaceTimestamp(race: any): number | string | null {
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

  getNumericRaceTimestamp(race: any): number | null {
    const val = this.getRaceTimestamp(race);
    if (val === null || val === undefined) return null;
    if (typeof val === "number") return val;
    const parsed = new Date(val).getTime();
    return isNaN(parsed) ? null : parsed;
  }

  get groupedHistories(): GroupedRaceHistory[] {
    const groupsMap = new Map<string, GroupedRaceHistory>();

    for (const h of this.raceHistories) {
      if (!this.hasRecordData(h)) {
        continue;
      }
      const isDemo = Boolean(h.is_demo);
      const raceName =
        (h.model?.name || h.name || "").trim() || "Completed Race";
      const entityId = (
        h.original_entity_id ||
        h.model?.entity_id ||
        h.entity_id ||
        h.model?.id ||
        h.id ||
        raceName
      ).trim();
      const groupKey = `${isDemo ? "demo" : "prod"}:::${entityId}`;

      let group = groupsMap.get(groupKey);
      if (!group) {
        group = {
          id: groupKey,
          raceName,
          isDemo,
          earliestDate: null,
          latestDate: null,
          ineligibleLapCount: 0,
          races: [],
          trackName: h.track?.name,
        };
        groupsMap.set(groupKey, group);
      }

      const ts = this.getNumericRaceTimestamp(h);
      const existingIndex =
        ts !== null
          ? group.races.findIndex((r) => {
              const rTs = this.getNumericRaceTimestamp(r);
              return rTs !== null && Math.abs(rTs - ts) < 1000;
            })
          : -1;

      if (existingIndex >= 0) {
        const existing = group.races[existingIndex];
        if (
          this.calculateRecordLapWeight(h) >
          this.calculateRecordLapWeight(existing)
        ) {
          group.races[existingIndex] = h;
        }
      } else {
        group.races.push(h);
      }

      if (ts !== null) {
        if (group.earliestDate === null || ts < group.earliestDate) {
          group.earliestDate = ts;
        }
        if (group.latestDate === null || ts > group.latestDate) {
          group.latestDate = ts;
        }
      }

      group.ineligibleLapCount += this.getIneligibleLapCount(h);
    }

    for (const group of groupsMap.values()) {
      group.races.sort((a, b) => {
        const timeA = this.getNumericRaceTimestamp(a) || 0;
        const timeB = this.getNumericRaceTimestamp(b) || 0;
        return timeB - timeA;
      });
    }

    return Array.from(groupsMap.values()).sort((a, b) => {
      const timeA = a.latestDate ?? 0;
      const timeB = b.latestDate ?? 0;
      return timeB - timeA;
    });
  }

  get filteredHistories(): GroupedRaceHistory[] {
    const groups = this.groupedHistories;
    if (!this.searchTerm || !this.searchTerm.trim()) {
      return groups;
    }
    const term = this.searchTerm.toLowerCase().trim();
    return groups.filter((g) => {
      const name = (g.raceName || "").toLowerCase();
      const track = (g.trackName || "").toLowerCase();
      return name.includes(term) || track.includes(term);
    });
  }

  private calculateRecordLapWeight(race: any): number {
    if (!race || !Array.isArray(race.heats)) return 0;
    let total = 0;
    for (const heat of race.heats) {
      const drivers = heat?.drivers || heat?.heatDrivers || heat?.heat_drivers;
      if (!Array.isArray(drivers)) continue;
      for (const d of drivers) {
        const userLaps = Number(d?.userLaps ?? d?.user_laps ?? 0);
        const adj = Number(d?.adjustedLapCount ?? d?.adjusted_lap_count ?? 0);
        const laps = Array.isArray(d?.laps) ? d.laps.length : 0;
        total += userLaps + adj + laps;
      }
    }
    return total;
  }

  getSelectedRaceId(group: GroupedRaceHistory): string {
    if (!group || !group.races || group.races.length === 0) return "";
    const selectedId = this.selectedRaceIdByGroup.get(group.id);
    if (
      selectedId &&
      group.races.some((r) => (r._id || r.id || r.entity_id) === selectedId)
    ) {
      return selectedId;
    }
    return (
      group.races[0]._id || group.races[0].id || group.races[0].entity_id || ""
    );
  }

  onSelectRaceForGroup(groupId: string, raceId: string): void {
    this.selectedRaceIdByGroup.set(groupId, raceId);
    this.cdr.markForCheck();
  }

  getSelectedRace(group: GroupedRaceHistory): any {
    if (!group || !group.races || group.races.length === 0) return null;
    const selectedId = this.getSelectedRaceId(group);
    return (
      group.races.find((r) => (r._id || r.id || r.entity_id) === selectedId) ||
      group.races[0]
    );
  }

  editRaceLaps(target: any): void {
    if (!target) return;

    if (Array.isArray(target.races)) {
      this.selectedRaceGroup = target;
      const selectedRun =
        this.getSelectedRace(target) || target.races[0] || null;
      this.selectedHistoryDetails = selectedRun;
      this.showDisallowDialog = true;
      this.cdr.markForCheck();
      return;
    }

    // Backwards-compatible single-item invocation (e.g. from unit tests)
    const id = target._id || target.id || target.entity_id;
    const isDemo = Boolean(target.is_demo);
    const raceName =
      (target.model?.name || target.name || "").trim() || "Completed Race";
    const ts = this.getNumericRaceTimestamp(target);
    const syntheticGroup: GroupedRaceHistory = {
      id: `${isDemo ? "demo" : "prod"}:::${id || raceName}`,
      raceName,
      isDemo,
      earliestDate: ts,
      latestDate: ts,
      ineligibleLapCount: this.getIneligibleLapCount(target),
      races: [target],
      trackName: target.track?.name,
    };

    if (id && typeof this.dataService?.getRaceHistoryById === "function") {
      this.isLoadingDetails = true;
      this.cdr.markForCheck();
      this.dataService.getRaceHistoryById(id, isDemo).subscribe({
        next: (fullRecord) => {
          this.isLoadingDetails = false;
          const resolved = fullRecord || target;
          resolved.is_demo = isDemo;
          syntheticGroup.races = [resolved];
          syntheticGroup.ineligibleLapCount =
            this.getIneligibleLapCount(resolved);
          this.selectedRaceGroup = syntheticGroup;
          this.selectedHistoryDetails = resolved;
          this.showDisallowDialog = true;
          this.cdr.markForCheck();
        },
        error: () => {
          this.isLoadingDetails = false;
          syntheticGroup.races = [target];
          this.selectedRaceGroup = syntheticGroup;
          this.selectedHistoryDetails = target;
          this.showDisallowDialog = true;
          this.cdr.markForCheck();
        },
      });
    } else {
      this.selectedRaceGroup = syntheticGroup;
      this.selectedHistoryDetails = target;
      this.showDisallowDialog = true;
      this.cdr.markForCheck();
    }
  }

  getIneligibleLapCount(race: any): number {
    if (!race) return 0;
    if (typeof race.ineligible_lap_count === "number") {
      return race.ineligible_lap_count;
    }
    if (typeof race.ineligibleLapCount === "number") {
      return race.ineligibleLapCount;
    }
    return this.calculateIneligibleLapsFromHeats(race);
  }

  calculateIneligibleLapsFromHeats(race: any): number {
    if (!race || !Array.isArray(race.heats)) return 0;
    let count = 0;
    for (const heat of race.heats) {
      const drivers = heat?.drivers || heat?.heatDrivers || heat?.heat_drivers;
      if (!Array.isArray(drivers)) continue;
      for (const driver of drivers) {
        const laps =
          driver?.laps ||
          driver?.lapsWithDetails ||
          driver?._lapsWithDetails ||
          driver?._laps;
        if (!Array.isArray(laps)) continue;
        for (const lap of laps) {
          if (typeof lap === "object" && lap !== null) {
            const countTowardsRecords =
              lap.countTowardsRecords ?? lap.count_towards_records ?? true;
            if (countTowardsRecords === false) {
              count++;
            }
          }
        }
      }
    }
    return count;
  }

  onRecordsUpdated(event: {
    raceId?: string;
    heatNumber: number;
    lane: number;
    lapIndex: number;
    countTowardsRecords: boolean;
  }): void {
    const raceId =
      event.raceId ||
      this.selectedHistoryDetails?._id ||
      this.selectedHistoryDetails?.id ||
      this.selectedHistoryDetails?.entity_id;

    const targetList = this.selectedRaceGroup
      ? this.selectedRaceGroup.races
      : this.raceHistories;

    const target = raceId
      ? targetList.find((h) => (h._id || h.id || h.entity_id) === raceId) ||
        this.raceHistories.find(
          (h) => (h._id || h.id || h.entity_id) === raceId,
        )
      : targetList[0];

    if (target) {
      const heat = (target.heats || []).find(
        (h: any) => (h.heatNumber ?? h.heat_number) === event.heatNumber,
      );
      if (heat) {
        const drivers =
          heat.drivers || heat.heatDrivers || heat.heat_drivers || [];
        const dhd = drivers.find((d: any, idx: number) => {
          const laneVal = d.lane ?? d.laneIndex ?? d.lane_index ?? idx;
          return laneVal === event.lane;
        });
        const laps = dhd?.laps || dhd?.lapsWithDetails || dhd?._lapsWithDetails;
        if (laps && laps[event.lapIndex]) {
          laps[event.lapIndex].countTowardsRecords = event.countTowardsRecords;
        }
      }
      const updatedCount = this.calculateIneligibleLapsFromHeats(target);
      target.ineligible_lap_count = updatedCount;
      target.ineligibleLapCount = updatedCount;

      if (this.selectedRaceGroup) {
        this.selectedRaceGroup.ineligibleLapCount =
          this.selectedRaceGroup.races.reduce(
            (sum, r) => sum + this.getIneligibleLapCount(r),
            0,
          );
      }
      this.cdr.markForCheck();
    }
  }

  closeDisallowDialog(): void {
    this.showDisallowDialog = false;
    this.selectedRaceGroup = null;
    this.selectedHistoryDetails = null;
    this.loadHistories();
    this.cdr.markForCheck();
  }

  openRace(group: GroupedRaceHistory): void {
    if (!group || !group.races || group.races.length === 0) return;
    const selectedRace = this.getSelectedRace(group);
    const id = selectedRace?._id || selectedRace?.id || selectedRace?.entity_id;
    if (!id) return;

    this.isLoadingDetails = true;
    this.cdr.markForCheck();
    this.dataService.loadRaceHistory(id, group.isDemo).subscribe({
      next: () => {
        this.isLoadingDetails = false;
        this.close.emit();
        this.router.navigate(["/raceday"]);
      },
      error: () => {
        this.isLoadingDetails = false;
        this.cdr.markForCheck();
      },
    });
  }

  onDismiss(): void {
    this.close.emit();
  }
}
