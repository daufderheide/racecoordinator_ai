import { CommonModule } from "@angular/common";
import { Component, computed, inject, input } from "@angular/core";
import { RacedayFormatUtils } from "@app/components/raceday/utils/raceday-format.utils";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { DriverHeatData } from "@app/race/driver_heat_data";
import {
  GhostBenchmarkType,
  GhostGapResult,
  GhostPacingService,
} from "@app/services/ghost-pacing.service";
import { TranslationService } from "@app/services/translation.service";

@Component({
  standalone: true,
  selector: "app-raceday-ghost-pacing",
  templateUrl: "./raceday-ghost-pacing.component.html",
  styleUrls: ["./raceday-ghost-pacing.component.css"],
  imports: [CommonModule, TranslatePipe],
})
export class RacedayGhostPacingComponent {
  private ghostPacingService = inject(GhostPacingService);
  private translationService = inject(TranslationService);

  driverHeatData = input<DriverHeatData | null>(null);
  laneRecord = input<number>(0);
  personalBest = input<number>(0);
  heatLeaderBest = input<number>(0);
  heatLeaderAvg = input<number>(0);
  heatLeaderMedian = input<number>(0);
  personalAvg = input<number>(0);
  personalMedian = input<number>(0);
  benchmarkType = input<GhostBenchmarkType>("LANE_RECORD");
  compact = input<boolean>(false);
  stacked = input<boolean>(false);
  lapProgress = input<number | null>(null);

  isEmptyDriver = computed(() => {
    const hd = this.driverHeatData();
    if (!hd) return true;
    return RacedayFormatUtils.isEmptyDriver(hd);
  });

  // Effective benchmark ghost lap time in seconds
  targetGhostLapTime = computed(() => {
    const hd = this.driverHeatData();
    if (!hd || this.isEmptyDriver()) return 0;
    const laneIndex = hd?.laneIndex ?? 0;
    const pAvg =
      this.personalAvg() > 0
        ? this.personalAvg()
        : hd.averageLapTime > 0
          ? hd.averageLapTime
          : 0;
    const pMed =
      this.personalMedian() > 0
        ? this.personalMedian()
        : hd.medianLapTime > 0
          ? hd.medianLapTime
          : 0;
    const pBest =
      this.personalBest() > 0
        ? this.personalBest()
        : hd.bestLapTime > 0
          ? hd.bestLapTime
          : 0;

    return this.ghostPacingService.resolveGhostBenchmarkTime(
      this.benchmarkType(),
      laneIndex,
      this.laneRecord(),
      pBest,
      this.heatLeaderBest(),
      this.heatLeaderAvg(),
      this.heatLeaderMedian(),
      pAvg,
      pMed,
    );
  });

  // Real-time calculated ghost gap delta & progress
  ghostGap = computed<GhostGapResult>(() => {
    const hd = this.driverHeatData();
    const ghostLap = this.targetGhostLapTime();

    if (!hd || ghostLap <= 0) {
      return {
        deltaSeconds: 0,
        isAhead: false,
        progressPct: 0,
        liveProjectedLapTime: 0,
        ghostLapTime: ghostLap,
      };
    }

    const currentLapTime = (hd as any).currentLapTime ?? hd.lastLapTime ?? 0;
    const customProgress = this.lapProgress();
    const progress =
      customProgress !== null
        ? customProgress
        : ((hd as any).lapProgress ??
          (hd.currentLocation >= 0 ? hd.currentLocation / 100 : 1.0));

    return this.ghostPacingService.calculateGhostGap(
      progress,
      currentLapTime,
      ghostLap,
    );
  });

  benchmarkLabelKey = computed(() => {
    switch (this.benchmarkType()) {
      case "PERSONAL_BEST":
        return "RD_GHOST_PERSONAL_BEST";
      case "PERSONAL_AVG":
        return "RD_GHOST_PERSONAL_AVG";
      case "PERSONAL_MEDIAN":
        return "RD_GHOST_PERSONAL_MEDIAN";
      case "HEAT_LEADER":
      case "HEAT_LEADER_BEST":
        return "RD_GHOST_LEADER_BEST";
      case "HEAT_LEADER_AVG":
        return "RD_GHOST_LEADER_AVG";
      case "HEAT_LEADER_MEDIAN":
        return "RD_GHOST_LEADER_MEDIAN";
      case "LANE_RECORD":
      default:
        return "RD_GHOST_LANE_RECORD";
    }
  });

  // Human-readable benchmark label
  benchmarkLabel = computed(() => {
    return this.translationService.translate(this.benchmarkLabelKey());
  });

  // Formatted delta string: e.g. "+0.34s" or "-0.52s"
  formattedDelta = computed(() => {
    if (this.isEmptyDriver()) {
      return "--";
    }
    const gap = this.ghostGap();
    if (gap.ghostLapTime <= 0 || gap.progressPct <= 0.02) {
      return "--";
    }
    const sign = gap.deltaSeconds > 0 ? "+" : "";
    return `${sign}${gap.deltaSeconds.toFixed(2)}s`;
  });
}
