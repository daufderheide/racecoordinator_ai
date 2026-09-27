import { AudioConfig } from "@app/models/driver";
import { FinishMethod } from "@app/models/heat_scoring";
import { Race } from "@app/models/race";
import { THEME_SLOT_KEYS } from "@app/models/theme";
import { LapType } from "@app/proto/antigravity";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { Heat } from "@app/race/heat";
import { AudioAssociation, AudioService } from "@app/services/audio.service";
import { ThemeService } from "@app/services/theme.service";
import {
  createTTSContext,
  isAudioConfigured,
  resolveLapAudio,
} from "@app/utils/audio";
import {
  arbitrateLapAudioCandidates,
  LapAudioCandidate,
} from "@app/utils/lap-audio-arbitrator";

export interface DriverStationLapAudioDeps {
  audioService: AudioService;
  themeService: ThemeService;
  resolvePlayableUrl: (urlOrId?: string) => string | undefined;
  playThemedSound: (
    slotKey: string,
    context?: any,
    association?: AudioAssociation,
  ) => void;
  getRace: () => Race | undefined;
  getHeat: () => Heat | undefined;
  getAssets: () => any[];
  getDriverData: () => DriverHeatData | undefined;
  getLaneIndex: () => number;
}

export class DriverStationLapAudioHandler {
  public leaderLaps = 0;
  public playedHalfway = false;
  public playedLapsLeft = new Set<number>();
  public playedLapsElapsed = new Set<number>();

  constructor(private deps: DriverStationLapAudioDeps) {}

  public reset(): void {
    this.leaderLaps = 0;
    this.playedHalfway = false;
    this.playedLapsLeft.clear();
    this.playedLapsElapsed.clear();
  }

  public handleLapEvent(lap: any, driverData: DriverHeatData): void {
    const currentDriverData = this.deps.getDriverData();
    const isCurrentStationDriver =
      currentDriverData && currentDriverData.objectId === lap.objectId;
    const driver = driverData.driver;
    const isBestLap = lap.lapTime === lap.bestLapTime;
    const ttsContext = createTTSContext(driver, driverData);
    const association: AudioAssociation = {
      widgetType: "lane-view",
      laneIndex: this.deps.getLaneIndex(),
      driverId:
        driver?.entity_id || (driver as any)?.id || (driver as any)?.objectId,
    };

    if (isCurrentStationDriver) {
      if (lap.type === LapType.FALSE_START) {
        const audio = driver.falseStartAudio || driver.penaltyAudio;
        if (
          audio?.type &&
          audio.type !== "none" &&
          ((audio.type === "tts" && audio.text?.trim()) ||
            (audio.type !== "tts" && audio.url?.trim()))
        ) {
          this.deps.audioService.playCallout(
            audio,
            "urgent",
            ttsContext,
            undefined,
            association,
          );
        }
        return;
      }

      if (lap.type === LapType.MIN_LAP_TIME) {
        if ((lap.lapTime ?? 0) > 0.25) {
          this.playThemedSound(
            THEME_SLOT_KEYS.AUDIO_MIN_LAP_TIME,
            ttsContext,
            association,
          );
        }
        return;
      }

      if (lap.isDrift) {
        this.playThemedSound(
          THEME_SLOT_KEYS.AUDIO_DRIFT_LAP,
          ttsContext,
          association,
        );
        return;
      }
    }

    // 1. Collect candidate callouts for this lap event
    const candidates: (LapAudioCandidate | null)[] = [];

    if (isCurrentStationDriver) {
      const milestoneCandidate = this.resolveLapMilestoneCandidate(
        lap,
        driver,
        isBestLap,
        ttsContext,
        association,
      );
      if (milestoneCandidate) {
        candidates.push(milestoneCandidate);
      }
    }

    const lapsLeftCandidate = this.resolveLapsLeftCandidate(lap, driverData);
    if (lapsLeftCandidate) {
      candidates.push(lapsLeftCandidate);
    }

    const halfwayCandidate = this.resolveHalfwayCandidate(lap, driverData);
    if (halfwayCandidate) {
      candidates.push(halfwayCandidate);
    }

    const lapNum = lap?.lapNumber ?? driverData?.lapCount ?? 0;
    if (lapNum > this.leaderLaps) {
      this.leaderLaps = lapNum;
    }

    // 2. Arbitrate candidates: highest priority wins; lower priorities dropped; equals queued
    const arbitration = arbitrateLapAudioCandidates(candidates);

    let played = false;
    if (arbitration.winner) {
      played = this.dispatchLapCandidate(arbitration.winner, false);
      for (const queued of arbitration.toQueue) {
        this.dispatchLapCandidate(queued, true);
      }
    }

    // 3. Fallback to lap sound if no milestone or verbal candidate played
    if (!played && isCurrentStationDriver) {
      this.dispatchLapFallbackSfx(
        driver,
        isBestLap,
        ttsContext,
        association,
        arbitration.winner?.id === "milestone"
          ? arbitration.winner.config
          : undefined,
      );
    }
  }

  public checkLapsLeftCallouts(lap: any, driverData: DriverHeatData): void {
    const candidate = this.resolveLapsLeftCandidate(lap, driverData);
    const lapNum = lap?.lapNumber ?? driverData?.lapCount ?? 0;
    if (lapNum > this.leaderLaps) {
      this.leaderLaps = lapNum;
    }
    if (candidate) {
      this.dispatchLapCandidate(candidate, false);
    }
  }

  public checkHalfwayPoint(lap: any, driverData?: DriverHeatData): void {
    const candidate = this.resolveHalfwayCandidate(lap, driverData);
    const lapNum = lap?.lapNumber ?? driverData?.lapCount ?? 0;
    if (lapNum > this.leaderLaps) {
      this.leaderLaps = lapNum;
    }
    if (candidate) {
      this.dispatchLapCandidate(candidate, false);
    }
  }

  private dispatchLapCandidate(
    candidate: LapAudioCandidate,
    queue: boolean,
  ): boolean {
    if (candidate.id === "halfway") {
      if (queue) {
        return this.deps.audioService.queueCallout(
          candidate.config,
          candidate.priority,
          candidate.context,
          candidate.resolvedUrl,
          candidate.association,
        );
      } else {
        this.playThemedSound(
          THEME_SLOT_KEYS.AUDIO_SECONDS_LEFT_HALFWAY,
          candidate.context,
          candidate.association,
        );
        return true;
      }
    }

    if (candidate.isVoice) {
      if (queue) {
        return this.deps.audioService.queueCallout(
          candidate.config,
          candidate.priority,
          candidate.context,
          candidate.resolvedUrl,
          candidate.association,
        );
      } else {
        const result = this.deps.audioService.playCallout(
          candidate.config,
          candidate.priority,
          candidate.context,
          candidate.resolvedUrl,
          candidate.association,
        );
        return result !== false;
      }
    } else {
      this.deps.audioService.playSfx(
        candidate.config.url,
        candidate.association,
      );
      return true;
    }
  }

  private dispatchLapFallbackSfx(
    driver: any,
    isBestLap: boolean,
    ttsContext: any,
    association: AudioAssociation,
    specialAudioConfig?: any,
  ): void {
    if (!driver) return;
    let fallbackAudio = isBestLap ? driver.bestLapAudio : driver.lapAudio;
    if (
      specialAudioConfig &&
      specialAudioConfig === fallbackAudio &&
      fallbackAudio === driver.bestLapAudio
    ) {
      fallbackAudio = driver.lapAudio;
    }

    if (
      (!specialAudioConfig || specialAudioConfig !== fallbackAudio) &&
      isAudioConfigured(fallbackAudio)
    ) {
      if (fallbackAudio.type === "tts") {
        this.deps.audioService.playCallout(
          fallbackAudio,
          isBestLap ? "normal" : "low",
          ttsContext,
          undefined,
          association,
        );
      } else {
        this.deps.audioService.playSfx(fallbackAudio.url, association);
      }
    }
  }

  private resolveLapMilestoneCandidate(
    lap: any,
    driver: any,
    isBestLap: boolean,
    ttsContext: any,
    association: AudioAssociation,
  ): LapAudioCandidate | null {
    if (!driver) return null;
    const specialAudio = resolveLapAudio(
      driver,
      lap.recordTier,
      isBestLap,
      lap.isNewRaceLeader,
      lap.isNewHeatLeader,
    );

    if (specialAudio && isAudioConfigured(specialAudio.config)) {
      return {
        id: "milestone",
        config: specialAudio.config,
        priority: specialAudio.priority,
        context: ttsContext,
        resolvedUrl: undefined,
        association,
        isVoice: specialAudio.isVoice,
      };
    }
    return null;
  }

  private resolveHalfwayCandidate(
    lap: any,
    driverData?: DriverHeatData,
  ): LapAudioCandidate | null {
    const scoring = this.deps.getRace()?.heat_scoring;
    const fm: any = scoring?.finishMethod ?? (scoring as any)?.finish_method;
    const isLap = fm === FinishMethod.Lap || fm === "Lap" || fm === 1;
    if (!scoring || !isLap || this.playedHalfway) {
      return null;
    }

    const totalLaps = scoring.finishValue;
    if (!totalLaps || totalLaps <= 1) return null;

    const halfwayLaps = totalLaps / 2;
    const lapNum = lap?.lapNumber ?? driverData?.lapCount ?? 0;
    if (lapNum > this.leaderLaps && lapNum >= halfwayLaps) {
      this.playedHalfway = true;
      const config = this.deps.themeService.resolveAudioConfig(
        THEME_SLOT_KEYS.AUDIO_SECONDS_LEFT_HALFWAY,
      );
      if (config && config.type === "none") {
        return null;
      }
      const playableUrl = this.deps.resolvePlayableUrl(config?.url);
      const ttsContext = driverData
        ? createTTSContext(driverData.driver, driverData)
        : undefined;
      return {
        id: "halfway",
        config: config || { type: "preset" },
        priority: "normal",
        context: ttsContext,
        resolvedUrl: playableUrl,
        association: { widgetType: "timer" },
        isVoice: true,
      };
    }
    return null;
  }

  private resolveLapsLeftCandidate(
    lap: any,
    driverData: DriverHeatData,
  ): LapAudioCandidate | null {
    const scoring = this.deps.getRace()?.heat_scoring;
    const fm: any = scoring?.finishMethod ?? (scoring as any)?.finish_method;
    const isLap = fm === FinishMethod.Lap || fm === "Lap" || fm === 1;
    if (!scoring || !isLap) return null;

    const totalLaps = scoring.finishValue ?? (scoring as any)?.finish_value;
    if (!totalLaps || totalLaps <= 0) return null;

    const lapNum = lap?.lapNumber ?? driverData?.lapCount ?? 0;
    if (lapNum <= this.leaderLaps) {
      return null;
    }

    const previousLeaderLaps = this.leaderLaps;
    const currentLeaderLaps = lapNum;

    const previousLapsLeft = totalLaps - previousLeaderLaps;
    const currentLapsLeft = totalLaps - currentLeaderLaps;

    const remainingThresholds = this.getLapsThresholds("remaining");
    for (const threshold of remainingThresholds) {
      if (
        previousLapsLeft > threshold &&
        currentLapsLeft <= threshold &&
        !this.playedLapsLeft.has(threshold)
      ) {
        this.playedLapsLeft.add(threshold);
        if (Math.abs(threshold - totalLaps) < 0.1) continue;

        const entry = this.getAudioFromSetEntry(
          THEME_SLOT_KEYS.AUDIO_LAPS_LEFT,
          threshold,
          "remaining",
        );
        if (entry) {
          return {
            id: "laps_left",
            config: entry.config,
            priority: "normal",
            context: undefined,
            resolvedUrl: entry.playableUrl,
            association: { widgetType: "timer" },
            isVoice: true,
          };
        }
      }
    }

    const elapsedThresholds = this.getLapsThresholds("elapsed");
    for (const threshold of elapsedThresholds) {
      if (
        previousLeaderLaps < threshold &&
        currentLeaderLaps >= threshold &&
        !this.playedLapsElapsed.has(threshold)
      ) {
        this.playedLapsElapsed.add(threshold);
        if (threshold <= 0) continue;

        const entry = this.getAudioFromSetEntry(
          THEME_SLOT_KEYS.AUDIO_LAPS_LEFT,
          threshold,
          "elapsed",
        );
        if (entry) {
          return {
            id: "laps_elapsed",
            config: entry.config,
            priority: "normal",
            context: undefined,
            resolvedUrl: entry.playableUrl,
            association: { widgetType: "timer" },
            isVoice: true,
          };
        }
      }
    }

    return null;
  }

  private getLapsThresholds(
    triggerMode: "remaining" | "elapsed" = "remaining",
  ): number[] {
    const config = this.deps.themeService.resolveAudioConfig(
      THEME_SLOT_KEYS.AUDIO_LAPS_LEFT,
    );
    if (config?.url) {
      const asset = (this.deps.getAssets() || []).find(
        (a) =>
          a.model?.entityId === config.url ||
          a.entity_id === config.url ||
          a._id === config.url,
      );
      if (asset?.audioEntries && asset.audioEntries.length > 0) {
        const filtered = asset.audioEntries.filter((e: any) => {
          const mode = e.triggerMode || e.trigger_mode || "remaining";
          return mode === triggerMode;
        });
        if (filtered.length > 0) {
          return filtered
            .map((e: any) =>
              Math.round(e.timeSeconds != null ? e.timeSeconds : e.percentage),
            )
            .filter((t: number) => !isNaN(t) && t >= 0)
            .filter(
              (t: number, index: number, self: number[]) =>
                self.indexOf(t) === index,
            )
            .sort((a: number, b: number) =>
              triggerMode === "elapsed" ? a - b : b - a,
            );
        }
      }
    }
    return triggerMode === "remaining" ? [20, 10, 5, 1] : [];
  }

  private getAudioFromSetEntry(
    slotKey: string,
    timeSeconds: number,
    triggerMode: string = "remaining",
  ): { config: AudioConfig; playableUrl?: string } | null {
    const config = this.deps.themeService.resolveAudioConfig(slotKey);
    if (!config || config.type !== "audio_set") return null;

    const assetId = config.url;
    if (!assetId) return null;

    const asset = (this.deps.getAssets() || []).find(
      (a) =>
        a.model?.entityId === assetId ||
        a.entity_id === assetId ||
        a._id === assetId,
    );
    if (!asset || asset.type !== "audio_set") return null;

    const entry = asset.audioEntries?.find((e: any) => {
      const val = e.timeSeconds != null ? e.timeSeconds : e.percentage;
      const mode = e.triggerMode || e.trigger_mode || "remaining";
      return (
        val != null &&
        Math.abs(Number(val) - timeSeconds) < 0.1 &&
        mode === triggerMode
      );
    });
    if (!entry) return null;

    const entryType = entry.type || "preset";
    if (entryType === "none") return null;

    const playableUrl = this.deps.resolvePlayableUrl(entry.url);
    return {
      config: {
        type: entryType,
        url: playableUrl,
        text: entry.text || undefined,
      },
      playableUrl,
    };
  }

  private playThemedSound(
    slotKey: string,
    context?: any,
    association?: AudioAssociation,
  ): void {
    this.deps.playThemedSound(slotKey, context, association);
  }
}
