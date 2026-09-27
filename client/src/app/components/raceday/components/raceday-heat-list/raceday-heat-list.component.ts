import { CommonModule } from "@angular/common";
import {
  AfterViewInit,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  OnDestroy,
  signal,
  viewChild,
  ViewEncapsulation,
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { of } from "rxjs";
import { AbsoluteWidgetNode } from "@app/models/settings";
import { Track } from "@app/models/track";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { RaceState } from "@app/proto/antigravity";
import { Heat } from "@app/race/heat";
import { RaceFlagService } from "@app/services/race-flag.service";
import { RaceTimeService } from "@app/services/race-time.service";

export interface ProcessedHeatLane {
  laneNumber: number;
  driverNickname: string;
  isTeam: boolean;
  teamName: string;
  backgroundColor: string;
  foregroundColor: string;
  isOccupied: boolean;
  rank: number;
  formattedRank: string;
  lapCount: number;
  formattedLaps: string;
  bestLapTime: number;
  formattedBestLap: string;
  gapLeader: number;
  formattedGap: string;
  averageLapTime: number;
  formattedAvgLap: string;
  medianLapTime: number;
  formattedMedianLap: string;
}

export interface ProcessedHeat {
  heatNumber: number;
  group: number;
  groupName: string;
  isCurrent: boolean;
  isCompleted: boolean;
  showSummary: boolean;
  lanes: ProcessedHeatLane[];
}

@Component({
  standalone: true,
  selector: "app-raceday-heat-list",
  templateUrl: "./raceday-heat-list.component.html",
  styleUrls: ["./raceday-heat-list.component.css"],
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, TranslatePipe],
})
export class RacedayHeatListComponent implements AfterViewInit, OnDestroy {
  widget = input<AbsoluteWidgetNode | null>(null);
  track = input<Track | undefined>(undefined);
  race = input<any>(undefined);
  currentHeat = input<Heat | undefined>(undefined);
  heats = input<any[]>([]);
  parent = input<any>(undefined);
  currentFlagUrl = input<string>("");
  formattedTime = input<string>("");

  private raceFlagService = inject(RaceFlagService, { optional: true });
  private raceTimeService = inject(RaceTimeService, { optional: true });

  private serviceFlagUrl = toSignal(
    this.raceFlagService?.currentFlagUrl$ ?? of(""),
    {
      initialValue:
        typeof this.raceFlagService?.getCurrentFlagUrl === "function"
          ? this.raceFlagService.getCurrentFlagUrl()
          : "",
    },
  );

  private serviceFormattedTime = toSignal(
    this.raceTimeService?.formattedTime$ ?? of(""),
    { initialValue: this.raceTimeService?.formattedTime ?? "" },
  );

  displayFlagUrl = computed(() => {
    return this.currentFlagUrl() || this.serviceFlagUrl() || "";
  });

  displayFormattedTime = computed(() => {
    return this.formattedTime() || this.serviceFormattedTime() || "";
  });

  showCurrentHeatFlag = computed(() => {
    return this.widget()?.customSettings?.["showCurrentHeatFlag"] !== false;
  });

  showCurrentHeatTime = computed(() => {
    return this.widget()?.customSettings?.["showCurrentHeatTime"] !== false;
  });

  scrollContainer = viewChild<ElementRef<HTMLElement>>("scrollContainer");

  containerDimensions = signal<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  private resizeObserver?: ResizeObserver;

  showHeader = computed(() => {
    return this.widget()?.customSettings?.["showHeader"] !== false;
  });

  autoScrollToCurrent = computed(() => {
    return this.widget()?.customSettings?.["autoScrollToCurrent"] !== false;
  });

  highlightCurrentHeat = computed(() => {
    return this.widget()?.customSettings?.["highlightCurrentHeat"] !== false;
  });

  scaleToWindow = computed(() => {
    return this.widget()?.customSettings?.["scaleToWindow"] === true;
  });

  heatColumnsSetting = computed(() => {
    return this.widget()?.customSettings?.["heatColumns"] || "auto";
  });

  laneColumnsSetting = computed(() => {
    return this.widget()?.customSettings?.["laneColumns"] || "auto";
  });

  trackLaneCount = computed(() => {
    return this.track()?.lanes?.length || 4;
  });

  showCompletedSummary = computed(() => {
    return this.widget()?.customSettings?.["showCompletedSummary"] !== false;
  });

  showActiveSummary = computed(() => {
    return this.widget()?.customSettings?.["showActiveSummary"] !== false;
  });

  summaryShowPosition = computed(() => {
    return this.widget()?.customSettings?.["summaryShowPosition"] !== false;
  });

  summaryShowDriver = computed(() => {
    return this.widget()?.customSettings?.["summaryShowDriver"] !== false;
  });

  summaryShowLaps = computed(() => {
    return this.widget()?.customSettings?.["summaryShowLaps"] !== false;
  });

  summaryShowBestLap = computed(() => {
    return this.widget()?.customSettings?.["summaryShowBestLap"] !== false;
  });

  summaryShowGap = computed(() => {
    return this.widget()?.customSettings?.["summaryShowGap"] === true;
  });

  summaryShowAverageLap = computed(() => {
    return this.widget()?.customSettings?.["summaryShowAverageLap"] === true;
  });

  summaryShowMedianLap = computed(() => {
    return this.widget()?.customSettings?.["summaryShowMedianLap"] === true;
  });

  summaryLapDecimalPlaces = computed(() => {
    return this.widget()?.customSettings?.["summaryLapDecimalPlaces"] ?? "auto";
  });

  summaryTimeDecimalPlaces = computed(() => {
    const p = this.widget()?.customSettings?.["summaryTimeDecimalPlaces"];
    return p !== undefined && p !== null && !isNaN(Number(p)) ? Number(p) : 3;
  });

  summaryUseLaneColors = computed(() => {
    return this.widget()?.customSettings?.["summaryUseLaneColors"] !== false;
  });

  processedHeats = computed<ProcessedHeat[]>(() => {
    const rawHeats = this.heats() || [];
    const cur = this.currentHeat();
    const curHeatNum = cur?.heatNumber ?? -1;
    const trackObj = this.track();
    const raceObj = this.race();
    const isRaceOver = this.parent()?.raceState === RaceState.RACE_OVER;

    return rawHeats.map((h, idx) =>
      this.buildProcessedHeat(
        h,
        idx,
        cur,
        curHeatNum,
        trackObj,
        raceObj,
        isRaceOver,
      ),
    );
  });

  private buildProcessedHeat(
    h: any,
    idx: number,
    cur: Heat | undefined,
    curHeatNum: number,
    trackObj: Track | undefined,
    raceObj: any,
    isRaceOver: boolean,
  ): ProcessedHeat {
    const heatNum = h.heatNumber ?? idx + 1;
    const groupNum = h.group ?? 0;
    let groupName = "";
    if (raceObj?.group_options?.enabled) {
      const customName = raceObj.group_options?.names?.[groupNum];
      groupName =
        customName && customName.trim() !== "" ? customName.trim() : "";
    }

    const isCurrentHeat = heatNum === curHeatNum && !isRaceOver;
    const isCurrent = this.highlightCurrentHeat() && isCurrentHeat;
    const isCompleted =
      (curHeatNum > 0 && heatNum < curHeatNum) ||
      (heatNum === curHeatNum && isRaceOver) ||
      !!h.isCompleted;
    const isActive = isCurrentHeat;

    const showSummary =
      (isCompleted && this.showCompletedSummary()) ||
      (isActive && this.showActiveSummary());

    const lanes = this.buildHeatLanes(h, cur, trackObj, isCompleted, isActive);

    return {
      heatNumber: heatNum,
      group: groupNum,
      groupName,
      isCurrent,
      isCompleted,
      showSummary,
      lanes,
    };
  }

  private buildHeatLanes(
    h: any,
    cur: Heat | undefined,
    trackObj: Track | undefined,
    isCompleted: boolean,
    isActive: boolean,
  ): ProcessedHeatLane[] {
    const totalTrackLanes = trackObj?.lanes?.length || 0;
    const driversSource =
      (isActive && cur?.heatDrivers?.length
        ? cur.heatDrivers
        : h.heatDrivers) || [];

    if (
      driversSource.length > 0 ||
      (h.heatDrivers && Array.isArray(h.heatDrivers))
    ) {
      const laneCount = Math.max(totalTrackLanes, driversSource.length);
      const lanes: ProcessedHeatLane[] = [];
      for (let laneIdx = 0; laneIdx < laneCount; laneIdx++) {
        const hd = driversSource.find((d: any) => d.laneIndex === laneIdx);
        lanes.push(
          this.buildSingleLaneFromDriver(
            hd,
            laneIdx,
            trackObj,
            isCompleted,
            isActive,
            h.standings,
          ),
        );
      }
      return lanes;
    }

    if (h.lanes && Array.isArray(h.lanes)) {
      return this.buildLanesFromLegacyLanes(
        h.lanes,
        trackObj,
        isCompleted,
        isActive,
      );
    }

    return [];
  }

  private buildSingleLaneFromDriver(
    hd: any,
    laneIdx: number,
    trackObj: Track | undefined,
    isCompleted: boolean,
    isActive: boolean,
    standings?: string[],
  ): ProcessedHeatLane {
    const trackLane = trackObj?.lanes?.[laneIdx];
    const isTm = this.isTeam(hd);
    const teamName = isTm ? this.getTeamName(hd) : "";
    const driverNickname = this.getDriverNickname(hd);
    const isOccupied = !!(driverNickname || teamName);
    const timeDec = this.summaryTimeDecimalPlaces();
    const lapDecSetting = this.summaryLapDecimalPlaces();

    let rank = 99;
    let formattedRank = "--";
    let lapCount = 0;
    let formattedLaps = "--";
    let bestLapTime = 0;
    let formattedBestLap = "--";
    let gapLeader = 0;
    let formattedGap = "--";
    let averageLapTime = 0;
    let formattedAvgLap = "--";
    let medianLapTime = 0;
    let formattedMedianLap = "--";

    if (isOccupied && hd) {
      if (typeof hd.rank === "number" && hd.rank > 0 && hd.rank < 90) {
        rank = hd.rank;
        formattedRank = String(rank);
      } else if (standings && Array.isArray(standings)) {
        const sidIdx = standings.findIndex(
          (sid: string) =>
            sid && (sid === hd.objectId || sid === hd.participant?.objectId),
        );
        if (sidIdx >= 0) {
          rank = sidIdx + 1;
          formattedRank = String(rank);
        }
      }

      lapCount = this.extractDriverLaps(hd);
      if (isCompleted || isActive) {
        formattedLaps =
          lapDecSetting === "auto"
            ? lapCount % 1 !== 0
              ? lapCount.toFixed(3)
              : String(lapCount)
            : lapCount.toFixed(Number(lapDecSetting));
      }

      if (typeof hd.bestLapTime === "number" && hd.bestLapTime > 0) {
        bestLapTime = hd.bestLapTime;
        formattedBestLap = bestLapTime.toFixed(timeDec);
      }

      if (typeof hd.gapLeader === "number") {
        gapLeader = hd.gapLeader;
        if (gapLeader > 0) {
          formattedGap = "+" + gapLeader.toFixed(timeDec);
        } else if (gapLeader === 0 && rank === 1) {
          formattedGap = "--";
        }
      }

      if (typeof hd.averageLapTime === "number" && hd.averageLapTime > 0) {
        averageLapTime = hd.averageLapTime;
        formattedAvgLap = averageLapTime.toFixed(timeDec);
      }

      if (typeof hd.medianLapTime === "number" && hd.medianLapTime > 0) {
        medianLapTime = hd.medianLapTime;
        formattedMedianLap = medianLapTime.toFixed(timeDec);
      }
    }

    return {
      laneNumber: laneIdx + 1,
      driverNickname,
      isTeam: isTm,
      teamName,
      backgroundColor: trackLane?.background_color || "#333333",
      foregroundColor: trackLane?.foreground_color || "#ffffff",
      isOccupied,
      rank,
      formattedRank,
      lapCount,
      formattedLaps,
      bestLapTime,
      formattedBestLap,
      gapLeader,
      formattedGap,
      averageLapTime,
      formattedAvgLap,
      medianLapTime,
      formattedMedianLap,
    };
  }

  private extractDriverLaps(hd: any): number {
    if (typeof hd.lapCount === "number") {
      return hd.lapCount;
    }
    if (typeof hd.adjustedLapCount === "number" && hd.adjustedLapCount !== 0) {
      return hd.adjustedLapCount;
    }
    if (Array.isArray(hd.laps)) {
      return hd.laps.length;
    }
    if (Array.isArray(hd.lapTimes)) {
      return hd.lapTimes.length;
    }
    return 0;
  }

  private buildLanesFromLegacyLanes(
    rawLanes: any[],
    trackObj: Track | undefined,
    isCompleted: boolean,
    isActive: boolean,
  ): ProcessedHeatLane[] {
    const timeDec = this.summaryTimeDecimalPlaces();
    const lapDecSetting = this.summaryLapDecimalPlaces();

    return rawLanes.map((lane: any, laneIdx: number) => {
      const trackLane = trackObj?.lanes?.[laneIdx];
      const isTm = !!lane.teamName;
      const teamName = lane.teamName || "";
      const driverNickname =
        lane.nickname ||
        lane.driverNickname ||
        (lane.driverNumber ? String(lane.driverNumber) : "");
      const isOccupied = !!(driverNickname || teamName);

      let rank = 99;
      let formattedRank = "--";
      if (
        isOccupied &&
        typeof lane.rank === "number" &&
        lane.rank > 0 &&
        lane.rank < 90
      ) {
        rank = lane.rank;
        formattedRank = String(rank);
      }

      const laps = typeof lane.lapCount === "number" ? lane.lapCount : 0;
      let formattedLaps = "--";
      if (isOccupied && (isCompleted || isActive)) {
        formattedLaps =
          lapDecSetting === "auto"
            ? laps % 1 !== 0
              ? laps.toFixed(3)
              : String(laps)
            : laps.toFixed(Number(lapDecSetting));
      }

      const bestTime =
        typeof lane.bestLapTime === "number" ? lane.bestLapTime : 0;
      const formattedBestLap =
        isOccupied && bestTime > 0 ? bestTime.toFixed(timeDec) : "--";

      return {
        laneNumber: lane.laneNumber ?? laneIdx + 1,
        driverNickname,
        isTeam: isTm,
        teamName,
        backgroundColor:
          lane.backgroundColor || trackLane?.background_color || "#333333",
        foregroundColor:
          lane.foregroundColor || trackLane?.foreground_color || "#ffffff",
        isOccupied,
        rank,
        formattedRank,
        lapCount: laps,
        formattedLaps,
        bestLapTime: bestTime,
        formattedBestLap,
        gapLeader: lane.gapLeader || 0,
        formattedGap:
          lane.gapLeader > 0
            ? "+" + Number(lane.gapLeader).toFixed(timeDec)
            : "--",
        averageLapTime: lane.averageLapTime || 0,
        formattedAvgLap:
          lane.averageLapTime > 0
            ? Number(lane.averageLapTime).toFixed(timeDec)
            : "--",
        medianLapTime: lane.medianLapTime || 0,
        formattedMedianLap:
          lane.medianLapTime > 0
            ? Number(lane.medianLapTime).toFixed(timeDec)
            : "--",
      };
    });
  }

  autoFitLayout = computed(() => {
    const n = this.processedHeats().length;
    if (n <= 0) {
      return { columns: 1, rows: 1, scale: 1 };
    }

    const { width, height } = this.containerDimensions();
    return this.calculateOptimalFit(n, width, height);
  });

  constructor() {
    effect(() => {
      const cur = this.currentHeat();
      const shouldAutoScroll =
        this.autoScrollToCurrent() && !this.scaleToWindow();
      if (!cur || !shouldAutoScroll) return;

      setTimeout(() => {
        const container = this.scrollContainer()?.nativeElement;
        if (!container) return;
        const activeCard = container.querySelector(
          `#heat-card-${cur.heatNumber}`,
        ) as HTMLElement;
        if (activeCard) {
          activeCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }, 50);
    });
  }

  ngAfterViewInit() {
    const el = this.scrollContainer()?.nativeElement;
    if (el && typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) {
            this.containerDimensions.set({ width, height });
          }
        }
      });
      this.resizeObserver.observe(el);
    }
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
  }

  calculateOptimalFit(
    n: number,
    width: number,
    height: number,
  ): { columns: number; rows: number; scale: number } {
    if (n <= 0) return { columns: 1, rows: 1, scale: 1 };

    if (width > 0 && height > 0) {
      const targetAspect = 2.2;
      let bestCols = 1;
      let bestRows = n;
      let bestScore = Infinity;

      const maxCols = Math.min(n, 12);
      for (let c = 1; c <= maxCols; c++) {
        const r = Math.ceil(n / c);
        const cellW = (width - (c - 1) * 6) / c;
        const cellH = (height - (r - 1) * 6) / r;
        if (cellW <= 0 || cellH <= 0) continue;

        const aspect = cellW / cellH;
        const aspectDiff = Math.abs(Math.log(aspect / targetAspect));
        const emptySlots = c * r - n;
        const emptyPenalty = (emptySlots / n) * 0.25;
        const squishPenalty = cellH < 35 ? (35 - cellH) * 0.1 : 0;

        const totalScore = aspectDiff + emptyPenalty + squishPenalty;
        if (totalScore < bestScore) {
          bestScore = totalScore;
          bestCols = c;
          bestRows = r;
        }
      }

      const finalCellW = (width - (bestCols - 1) * 6) / bestCols;
      const finalCellH = (height - (bestRows - 1) * 6) / bestRows;
      const scaleW = finalCellW / 240;
      const scaleH = finalCellH / 110;
      const scale = Math.max(0.4, Math.min(2.0, Math.min(scaleW, scaleH)));

      return { columns: bestCols, rows: bestRows, scale };
    }

    // Default layout purely based on N
    let cols = 1;
    if (n <= 2) cols = n;
    else if (n <= 4) cols = 2;
    else if (n <= 6) cols = 3;
    else if (n <= 8) cols = 4;
    else if (n <= 12) cols = 4;
    else if (n <= 16) cols = 4;
    else if (n <= 20) cols = 5;
    else if (n <= 30) cols = 6;
    else cols = 8;

    const rows = Math.ceil(n / cols);
    const scale = Math.max(0.4, Math.min(1.0, 1.2 / Math.sqrt(rows)));
    return { columns: cols, rows, scale };
  }

  isTeam(hd: any): boolean {
    if (!hd) return false;
    if (hd.isEmpty === true || hd.isEmptyLane === true) return false;
    if (this.parent()?.isTeam) {
      return this.parent().isTeam(hd);
    }
    return !!(hd?.participant?.team || hd?.driver?.team);
  }

  getTeamName(hd: any): string {
    if (!hd) return "";
    if (hd.isEmpty === true || hd.isEmptyLane === true) return "";
    return hd?.participant?.team?.name || hd?.driver?.team?.name || "";
  }

  getDriverNickname(hd: any): string {
    if (!hd) return "";
    if (hd.isEmpty === true || hd.isEmptyLane === true) return "";
    const d = hd.actualDriver || (hd.driver as any)?.driver || hd.driver;
    if (d?.isEmpty === true) return "";
    return d?.nickname || d?.name || "";
  }

  getLaneColumnsStyle(): string {
    const setting = this.laneColumnsSetting();
    if (setting === "auto") {
      const count = Math.min(this.trackLaneCount(), 4);
      return `repeat(${Math.max(count, 1)}, 1fr)`;
    }
    const cols = parseInt(setting, 10);
    return `repeat(${isNaN(cols) ? 2 : cols}, 1fr)`;
  }

  getHeatColumnsStyle(): string {
    if (this.scaleToWindow()) {
      return `repeat(${this.autoFitLayout().columns}, 1fr)`;
    }
    const setting = this.heatColumnsSetting();
    if (setting === "auto") {
      return "repeat(auto-fill, minmax(280px, 1fr))";
    }
    const cols = parseInt(setting, 10);
    return `repeat(${isNaN(cols) ? 1 : cols}, 1fr)`;
  }

  getHeatRowsStyle(): string {
    if (this.scaleToWindow()) {
      return `repeat(${this.autoFitLayout().rows}, 1fr)`;
    }
    return "none";
  }

  trackByHeatNumber(_index: number, heat: ProcessedHeat): number {
    return heat.heatNumber;
  }

  trackByLaneNumber(_index: number, lane: ProcessedHeatLane): number {
    return lane.laneNumber;
  }
}
