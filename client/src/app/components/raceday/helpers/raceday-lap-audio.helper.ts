import { FinishMethod } from "@app/models/heat_scoring";
import { THEME_SLOT_KEYS } from "@app/models/theme";
import { LapType } from "@app/proto/antigravity";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { AudioAssociation } from "@app/services/audio.service";
import {
  dispatchLapAudio,
  getEffectiveDriver,
  isAudioConfigured,
  resolveLapAudio,
} from "@app/utils/audio";
import { LapAudioCandidate } from "@app/utils/lap-audio-arbitrator";

import { RacedayTimedAudioHelper } from "./raceday-timed-audio.helper";

export class RacedayLapAudioHelper {
  static getLapsThresholds(
    host: any,
    triggerMode: "remaining" | "elapsed" = "remaining",
  ): number[] {
    const config = host.themeService?.resolveAudioConfig(
      THEME_SLOT_KEYS.AUDIO_LAPS_LEFT,
    );
    if (config?.url) {
      const asset = (host.assets || []).find(
        (a: any) =>
          a.model?.entityId === config.url ||
          a.entity_id === config.url ||
          a._id === config.url ||
          a.name === config.url,
      );
      const entries = asset?.audioEntries || (asset as any)?.audio_entries;
      if (entries && entries.length > 0) {
        const filtered = entries.filter((e: any) => {
          const mode = e.triggerMode || e.trigger_mode || "remaining";
          return mode === triggerMode;
        });
        if (filtered.length > 0) {
          return filtered
            .map((e: any) =>
              Math.round(
                e.timeSeconds != null
                  ? e.timeSeconds
                  : e.time_seconds != null
                    ? e.time_seconds
                    : e.percentage,
              ),
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

  static resolveLapsLeftCandidate(
    host: any,
    lap: any,
    driverData: DriverHeatData,
  ): LapAudioCandidate | null {
    const scoring = host.race?.heat_scoring;
    const fm: any = scoring?.finishMethod ?? (scoring as any)?.finish_method;
    const isLap = fm === FinishMethod.Lap || fm === "Lap" || fm === 1;
    if (!scoring || !isLap) return null;

    const totalLaps = scoring.finishValue ?? (scoring as any)?.finish_value;
    if (!totalLaps || totalLaps <= 0) return null;

    const lapNum = lap?.lapNumber ?? driverData?.lapCount ?? 0;
    if (lapNum <= host.leaderLaps) return null;

    const previousLeaderLaps = host.leaderLaps;
    const currentLeaderLaps = lapNum;
    const previousLapsLeft = totalLaps - previousLeaderLaps;
    const currentLapsLeft = totalLaps - currentLeaderLaps;

    const remainingCandidate =
      RacedayLapAudioHelper.checkRemainingLapsCandidate(
        host,
        totalLaps,
        previousLapsLeft,
        currentLapsLeft,
      );
    if (remainingCandidate) return remainingCandidate;

    return RacedayLapAudioHelper.checkElapsedLapsCandidate(
      host,
      previousLeaderLaps,
      currentLeaderLaps,
    );
  }

  private static checkRemainingLapsCandidate(
    host: any,
    totalLaps: number,
    previousLapsLeft: number,
    currentLapsLeft: number,
  ): LapAudioCandidate | null {
    const thresholds = RacedayLapAudioHelper.getLapsThresholds(
      host,
      "remaining",
    );
    for (const threshold of thresholds) {
      if (
        previousLapsLeft > threshold &&
        currentLapsLeft <= threshold &&
        !host.playedLapsLeft.has(threshold)
      ) {
        host.playedLapsLeft.add(threshold);
        if (Math.abs(threshold - totalLaps) < 0.1) continue;

        const entry = RacedayTimedAudioHelper.getAudioFromSetEntry(
          host,
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
    return null;
  }

  private static checkElapsedLapsCandidate(
    host: any,
    previousLeaderLaps: number,
    currentLeaderLaps: number,
  ): LapAudioCandidate | null {
    const thresholds = RacedayLapAudioHelper.getLapsThresholds(host, "elapsed");
    for (const threshold of thresholds) {
      if (
        previousLeaderLaps < threshold &&
        currentLeaderLaps >= threshold &&
        !host.playedLapsElapsed.has(threshold)
      ) {
        host.playedLapsElapsed.add(threshold);
        if (threshold <= 0) continue;

        const entry = RacedayTimedAudioHelper.getAudioFromSetEntry(
          host,
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

  static resolveHalfwayCandidate(
    host: any,
    lap: any,
    driverData?: DriverHeatData,
  ): LapAudioCandidate | null {
    const scoring = host.race?.heat_scoring;
    const fm: any = scoring?.finishMethod ?? (scoring as any)?.finish_method;
    const isLap = fm === FinishMethod.Lap || fm === "Lap" || fm === 1;
    if (!scoring || !isLap || host.playedHalfway) return null;

    const totalLaps = scoring.finishValue;
    if (!totalLaps || totalLaps <= 1) return null;

    const halfwayLaps = totalLaps / 2;
    const lapNum = lap?.lapNumber ?? driverData?.lapCount ?? 0;
    if (lapNum > host.leaderLaps && lapNum >= halfwayLaps) {
      host.playedHalfway = true;
      const config = host.themeService?.resolveAudioConfig(
        THEME_SLOT_KEYS.AUDIO_SECONDS_LEFT_HALFWAY,
      );
      if (config && config.type === "none") return null;

      const playableUrl = config?.url
        ? RacedayTimedAudioHelper.resolveAssetPlayableUrl(host, config.url)
        : undefined;
      return {
        id: "halfway",
        config: config || { type: "preset" },
        priority: "normal",
        context: undefined,
        resolvedUrl: playableUrl,
        association: { widgetType: "timer" },
        isVoice: true,
      };
    }
    return null;
  }

  static resolveLapMilestoneCandidate(
    host: any,
    lap: any,
    driver: any,
    isBestLap: boolean,
    ttsContext: any,
    association: AudioAssociation,
  ): LapAudioCandidate | null {
    if (!driver) return null;
    const activeTheme = host.themeService?.getActiveTheme?.();
    const specialAudio = resolveLapAudio(
      driver,
      lap.recordTier,
      isBestLap,
      lap.isNewRaceLeader,
      lap.isNewHeatLeader,
      lap.isDrift,
      activeTheme,
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

  static dispatchLapCandidate(
    host: any,
    candidate: LapAudioCandidate,
    queue: boolean,
  ): boolean {
    if (candidate.id === "halfway") {
      if (queue) {
        return host.audioService?.queueCallout(
          candidate.config,
          candidate.priority,
          candidate.context,
          candidate.resolvedUrl,
          candidate.association,
        );
      }
      RacedayTimedAudioHelper.playThemedSound(
        host,
        THEME_SLOT_KEYS.AUDIO_SECONDS_LEFT_HALFWAY,
        candidate.context,
        candidate.association,
      );
      return true;
    }

    if (candidate.isVoice) {
      if (queue) {
        return host.audioService?.queueCallout(
          candidate.config,
          candidate.priority,
          candidate.context,
          candidate.resolvedUrl,
          candidate.association,
        );
      }
      const result = host.audioService?.playCallout(
        candidate.config,
        candidate.priority,
        candidate.context,
        candidate.resolvedUrl,
        candidate.association,
      );
      return result !== false;
    }

    host.audioService?.playSfx(candidate.config.url, candidate.association);
    return true;
  }

  static dispatchLapFallbackSfx(
    host: any,
    driver: any,
    isBestLap: boolean,
    ttsContext: any,
    association: AudioAssociation,
    specialAudioConfig?: any,
  ): void {
    if (!driver) return;
    const activeTheme = host.themeService?.getActiveTheme?.();
    const effectiveDriver = getEffectiveDriver(driver, activeTheme);

    let fallbackAudio: any;
    if (
      isBestLap &&
      isAudioConfigured(effectiveDriver.bestLapAudio) &&
      (!specialAudioConfig ||
        specialAudioConfig !== effectiveDriver.bestLapAudio)
    ) {
      fallbackAudio = effectiveDriver.bestLapAudio;
    } else {
      fallbackAudio = effectiveDriver.lapAudio;
    }

    if (
      (!specialAudioConfig || specialAudioConfig !== fallbackAudio) &&
      isAudioConfigured(fallbackAudio)
    ) {
      if (fallbackAudio.type === "tts") {
        if (host.audioService?.queueCallout) {
          host.audioService.queueCallout(
            fallbackAudio,
            isBestLap ? "normal" : "low",
            ttsContext,
            undefined,
            association,
          );
        } else {
          host.audioService?.playCallout(
            fallbackAudio,
            isBestLap ? "normal" : "low",
            ttsContext,
            undefined,
            association,
          );
        }
      } else {
        host.audioService?.playSfx(fallbackAudio.url, association);
      }
    }
  }

  static handleSpecialLapAudio(
    host: any,
    lap: any,
    driverData: DriverHeatData,
    driver: any,
    ttsContext: any,
    association: AudioAssociation,
  ): boolean {
    if (lap.type === LapType.FALSE_START) {
      const audio = driver?.falseStartAudio || driver?.penaltyAudio;
      if (
        audio?.type &&
        audio.type !== "none" &&
        ((audio.type === "tts" && audio.text?.trim()) ||
          (audio.type !== "tts" && audio.url?.trim()))
      ) {
        const playableUrl = audio.url
          ? RacedayTimedAudioHelper.resolveAssetPlayableUrl(host, audio.url)
          : undefined;
        host.audioService?.playCallout(
          audio,
          "urgent",
          ttsContext,
          playableUrl,
          association,
        );
      }
      host.handleLapHighlight(lap, driverData);
      return true;
    }

    if (lap.type === LapType.MIN_LAP_TIME) {
      if ((lap.lapTime ?? 0) > 0.25) {
        if (host.playThemedSound) {
          host.playThemedSound(THEME_SLOT_KEYS.AUDIO_MIN_LAP_TIME, ttsContext);
        } else {
          RacedayTimedAudioHelper.playThemedSound(
            host,
            THEME_SLOT_KEYS.AUDIO_MIN_LAP_TIME,
            ttsContext,
          );
        }
      }
      host.handleLapHighlight(lap, driverData);
      return true;
    }

    if (lap.isDrift) {
      const audio = driver?.driftLapAudio;
      if (
        audio?.type &&
        audio.type !== "none" &&
        ((audio.type === "tts" && audio.text?.trim()) ||
          (audio.type !== "tts" && audio.url?.trim()))
      ) {
        const playableUrl = audio.url
          ? RacedayTimedAudioHelper.resolveAssetPlayableUrl(host, audio.url)
          : undefined;
        host.audioService?.playCallout(
          audio,
          "urgent",
          ttsContext,
          playableUrl,
          { ...association, eventType: "drift_lap" },
        );
      }
      host.handleLapHighlight(lap, driverData);
      return true;
    }

    return false;
  }

  static handleLapAudio(
    host: any,
    lap: any,
    driverOrData: any,
    isBestLap: boolean,
    ttsContext: any,
    explicitDriverData?: DriverHeatData,
  ): void {
    const isDriverHeatData =
      driverOrData &&
      typeof driverOrData === "object" &&
      "laneIndex" in driverOrData;
    const driverData =
      explicitDriverData || (isDriverHeatData ? driverOrData : undefined);
    const driver = isDriverHeatData ? driverOrData.driver : driverOrData;
    const hd =
      driverData ||
      host.heat?.heatDrivers?.find(
        (d: any) =>
          d.objectId === lap.objectId ||
          d.driver?.entity_id === driver?.entity_id ||
          d.laneIndex === lap.lane,
      );
    const activeTheme = host.themeService?.getActiveTheme?.();
    const effectiveDriver = getEffectiveDriver(driver, activeTheme);

    const association: AudioAssociation = {
      widgetType: "lane-view",
      laneIndex: hd?.laneIndex,
      driverId:
        driver?.entity_id || (driver as any)?.id || (driver as any)?.objectId,
    };

    if (
      RacedayLapAudioHelper.handleLapSpecialDirectAudio(
        host,
        lap,
        effectiveDriver,
        ttsContext,
        association,
      )
    ) {
      return;
    }

    if (effectiveDriver) {
      dispatchLapAudio(
        host.audioService,
        effectiveDriver,
        lap.recordTier,
        isBestLap,
        lap.isNewRaceLeader,
        lap.isNewHeatLeader,
        ttsContext,
        association,
        lap.isDrift,
        activeTheme,
      );
    }
  }

  private static handleLapSpecialDirectAudio(
    host: any,
    lap: any,
    effectiveDriver: any,
    ttsContext: any,
    association: AudioAssociation,
  ): boolean {
    if (lap.type === LapType.FALSE_START) {
      const audio =
        effectiveDriver?.falseStartAudio || effectiveDriver?.penaltyAudio;
      if (
        audio?.type &&
        audio.type !== "none" &&
        ((audio.type === "tts" && audio.text?.trim()) ||
          (audio.type !== "tts" && audio.url?.trim()))
      ) {
        const playableUrl = audio.url
          ? RacedayTimedAudioHelper.resolveAssetPlayableUrl(host, audio.url)
          : undefined;
        host.audioService?.playCallout(
          audio,
          "urgent",
          ttsContext,
          playableUrl,
          association,
        );
      }
      return true;
    }

    if (lap.type === LapType.MIN_LAP_TIME) {
      if ((lap.lapTime ?? 0) > 0.25) {
        if (host.playThemedSound) {
          host.playThemedSound(THEME_SLOT_KEYS.AUDIO_MIN_LAP_TIME, ttsContext);
        } else {
          RacedayTimedAudioHelper.playThemedSound(
            host,
            THEME_SLOT_KEYS.AUDIO_MIN_LAP_TIME,
            ttsContext,
          );
        }
      }
      return true;
    }

    if (lap.isDrift) {
      const audio = effectiveDriver?.driftLapAudio;
      if (
        audio?.type &&
        audio.type !== "none" &&
        ((audio.type === "tts" && audio.text?.trim()) ||
          (audio.type !== "tts" && audio.url?.trim()))
      ) {
        const playableUrl = audio.url
          ? RacedayTimedAudioHelper.resolveAssetPlayableUrl(host, audio.url)
          : undefined;
        host.audioService?.playCallout(
          audio,
          "urgent",
          ttsContext,
          playableUrl,
          { ...association, eventType: "drift_lap" },
        );
      }
      return true;
    }

    return false;
  }
}
