import { FinishMethod } from "@app/models/heat_scoring";
import { Race } from "@app/models/race";
import { THEME_SLOT_KEYS } from "@app/models/theme";
import { AudioAssociation } from "@app/services/audio.service";
import { ThemeService } from "@app/services/theme.service";

export interface DriverStationTimeAudioDeps {
  themeService: ThemeService;
  getRace: () => Race | undefined;
  getAssets: () => any[];
  playThemedSound: (
    slotKey: string,
    context?: any,
    association?: AudioAssociation,
  ) => void;
  playAudioFromSet: (
    slotKey: string,
    timeSeconds: number,
    association?: AudioAssociation,
    triggerMode?: string,
  ) => boolean;
}

export class DriverStationTimeAudioHandler {
  public playedHalfway = false;
  public playedSecondsLeft = new Set<number>();
  public playedSecondsElapsed = new Set<number>();
  public playedAutoStart = new Set<number>();
  public playedAutoStartElapsed = new Set<number>();
  public playedAutoAdvance = new Set<number>();
  public playedAutoAdvanceElapsed = new Set<number>();

  constructor(private deps: DriverStationTimeAudioDeps) {}

  public reset(): void {
    this.playedHalfway = false;
    this.playedSecondsLeft.clear();
    this.playedSecondsElapsed.clear();
    this.playedAutoStart.clear();
    this.playedAutoStartElapsed.clear();
    this.playedAutoAdvance.clear();
    this.playedAutoAdvanceElapsed.clear();
  }

  public getSecondsLeftThresholds(
    triggerMode: "remaining" | "elapsed" = "remaining",
  ): number[] {
    const config = this.deps.themeService?.resolveAudioConfig?.(
      THEME_SLOT_KEYS.AUDIO_SECONDS_LEFT,
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
    return triggerMode === "remaining"
      ? [300, 240, 180, 120, 60, 30, 25, 20, 15, 10, 5]
      : [];
  }

  public checkRaceTimeAnnouncements(currentTime: number): void {
    const race = this.deps.getRace();
    const scoring = race?.heat_scoring;
    if (!scoring || scoring.finishMethod !== FinishMethod.Timed) return;

    const totalDuration = scoring.finishValue;
    if (totalDuration <= 0) return;

    const halfwayThreshold = totalDuration / 2;
    if (currentTime <= halfwayThreshold && !this.playedHalfway) {
      this.deps.playThemedSound(
        THEME_SLOT_KEYS.AUDIO_SECONDS_LEFT_HALFWAY,
        undefined,
        { widgetType: "timer" },
      );
      this.playedHalfway = true;
    }

    // Remaining thresholds
    const remainingThresholds = this.getSecondsLeftThresholds("remaining");
    for (const threshold of remainingThresholds) {
      if (currentTime <= threshold && !this.playedSecondsLeft.has(threshold)) {
        if (Math.abs(threshold - totalDuration) < 0.1) continue;

        this.deps.playAudioFromSet(
          THEME_SLOT_KEYS.AUDIO_SECONDS_LEFT,
          threshold,
          { widgetType: "timer" },
          "remaining",
        );
        this.playedSecondsLeft.add(threshold);
      }
    }

    // Elapsed thresholds
    const elapsed = totalDuration - currentTime;
    const elapsedThresholds = this.getSecondsLeftThresholds("elapsed");
    for (const threshold of elapsedThresholds) {
      if (elapsed >= threshold && !this.playedSecondsElapsed.has(threshold)) {
        if (threshold <= 0 || Math.abs(threshold - totalDuration) < 0.1) {
          continue;
        }

        this.deps.playAudioFromSet(
          THEME_SLOT_KEYS.AUDIO_SECONDS_LEFT,
          threshold,
          { widgetType: "timer" },
          "elapsed",
        );
        this.playedSecondsElapsed.add(threshold);
      }
    }
  }

  public getAutoStartThresholds(
    triggerMode: "remaining" | "elapsed" = "remaining",
  ): number[] {
    const config = this.deps.themeService?.resolveAudioConfig?.(
      THEME_SLOT_KEYS.AUDIO_AUTO_START,
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
            .map((e: any) => Math.round(e.timeSeconds))
            .filter((t: number) => t > 0)
            .sort((a: number, b: number) =>
              triggerMode === "elapsed" ? a - b : b - a,
            );
        }
      }
    }
    return triggerMode === "remaining" ? [600, 300, 180, 60, 30, 10] : [];
  }

  public checkAutoStartAnnouncements(
    currentTime: number,
    previousTime: number,
  ): void {
    if (previousTime <= 0) return;
    const race = this.deps.getRace();
    const totalDuration = race?.auto_start_time ?? 0;
    const previousElapsed = totalDuration - previousTime;
    const currentElapsed = totalDuration - currentTime;

    // Remaining thresholds
    const remainingThresholds = this.getAutoStartThresholds("remaining");
    for (const threshold of remainingThresholds) {
      if (
        previousTime > threshold &&
        currentTime <= threshold &&
        !this.playedAutoStart.has(threshold)
      ) {
        if (totalDuration > 0 && Math.abs(threshold - totalDuration) < 0.1) {
          continue;
        }

        this.deps.playAudioFromSet(
          THEME_SLOT_KEYS.AUDIO_AUTO_START,
          threshold,
          { widgetType: "timer" },
          "remaining",
        );
        this.playedAutoStart.add(threshold);
      }
    }

    // Elapsed thresholds
    const elapsedThresholds = this.getAutoStartThresholds("elapsed");
    for (const threshold of elapsedThresholds) {
      if (
        previousElapsed < threshold &&
        currentElapsed >= threshold &&
        !this.playedAutoStartElapsed.has(threshold)
      ) {
        if (
          threshold <= 0 ||
          (totalDuration > 0 && Math.abs(threshold - totalDuration) < 0.1)
        ) {
          continue;
        }

        this.deps.playAudioFromSet(
          THEME_SLOT_KEYS.AUDIO_AUTO_START,
          threshold,
          { widgetType: "timer" },
          "elapsed",
        );
        this.playedAutoStartElapsed.add(threshold);
      }
    }
  }

  public getAutoAdvanceThresholds(
    triggerMode: "remaining" | "elapsed" = "remaining",
  ): number[] {
    const config = this.deps.themeService?.resolveAudioConfig?.(
      THEME_SLOT_KEYS.AUDIO_AUTO_ADVANCE,
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
            .map((e: any) => Math.round(e.timeSeconds))
            .filter((t: number) => t > 0)
            .sort((a: number, b: number) =>
              triggerMode === "elapsed" ? a - b : b - a,
            );
        }
      }
    }
    return triggerMode === "remaining" ? [600, 300, 180, 60, 30, 10] : [];
  }

  public checkAutoAdvanceAnnouncements(
    currentTime: number,
    previousTime: number,
  ): void {
    if (previousTime <= 0) return;
    const race = this.deps.getRace();
    const totalDuration =
      (race as any)?.auto_advance_time ??
      (race as any)?.auto_advance_remaining_seconds ??
      0;
    const previousElapsed = totalDuration - previousTime;
    const currentElapsed = totalDuration - currentTime;

    // Remaining thresholds
    const remainingThresholds = this.getAutoAdvanceThresholds("remaining");
    for (const threshold of remainingThresholds) {
      if (
        previousTime > threshold &&
        currentTime <= threshold &&
        !this.playedAutoAdvance.has(threshold)
      ) {
        if (totalDuration > 0 && Math.abs(threshold - totalDuration) < 0.1) {
          continue;
        }

        this.deps.playAudioFromSet(
          THEME_SLOT_KEYS.AUDIO_AUTO_ADVANCE,
          threshold,
          { widgetType: "timer" },
          "remaining",
        );
        this.playedAutoAdvance.add(threshold);
      }
    }

    // Elapsed thresholds
    const elapsedThresholds = this.getAutoAdvanceThresholds("elapsed");
    for (const threshold of elapsedThresholds) {
      if (
        previousElapsed < threshold &&
        currentElapsed >= threshold &&
        !this.playedAutoAdvanceElapsed.has(threshold)
      ) {
        if (
          threshold <= 0 ||
          (totalDuration > 0 && Math.abs(threshold - totalDuration) < 0.1)
        ) {
          continue;
        }

        this.deps.playAudioFromSet(
          THEME_SLOT_KEYS.AUDIO_AUTO_ADVANCE,
          threshold,
          { widgetType: "timer" },
          "elapsed",
        );
        this.playedAutoAdvanceElapsed.add(threshold);
      }
    }
  }
}
