import { AudioConfig } from "@app/models/driver";
import { FinishMethod } from "@app/models/heat_scoring";
import { THEME_SLOT_KEYS } from "@app/models/theme";
import { RaceState } from "@app/proto/antigravity";
import { AudioAssociation, AudioPriority } from "@app/services/audio.service";
import { resolveAudioUrl } from "@app/utils/audio";

export interface AudioSetResolution {
  status:
    | "no_theme_service"
    | "slot_not_configured"
    | "not_audio_set"
    | "no_asset_id"
    | "asset_not_found"
    | "asset_not_audio_set"
    | "entry_not_found"
    | "entry_disabled"
    | "entry_missing_content"
    | "ready";
  entryItem?: { config: AudioConfig; playableUrl?: string };
  assetName?: string;
  assetId?: string;
}

export class RacedayTimedAudioHelper {
  static resolveAssetPlayableUrl(
    host: any,
    urlOrId: string | undefined,
  ): string | undefined {
    if (!urlOrId) return undefined;
    const asset = (host.assets || []).find(
      (a: any) =>
        a.model?.entityId === urlOrId ||
        a.entity_id === urlOrId ||
        a._id === urlOrId ||
        a.name === urlOrId,
    );
    if (asset?.url) {
      return resolveAudioUrl(asset.url, host.dataService?.serverUrl);
    }
    return resolveAudioUrl(urlOrId, host.dataService?.serverUrl);
  }

  static getAudioSetResolution(
    host: any,
    slotKey: string,
    timeSeconds: number,
    triggerMode: string = "remaining",
  ): AudioSetResolution {
    if (
      !host.themeService ||
      typeof host.themeService.resolveAudioConfig !== "function"
    ) {
      return { status: "no_theme_service" };
    }
    const config = host.themeService.resolveAudioConfig(slotKey);
    if (!config || config.type === "none") {
      return { status: "slot_not_configured" };
    }
    if (config.type !== "audio_set") {
      return { status: "not_audio_set" };
    }

    const assetId = config.url;
    if (!assetId) {
      return { status: "no_asset_id" };
    }

    const asset = (host.assets || []).find(
      (a: any) =>
        a.model?.entityId === assetId ||
        a.entity_id === assetId ||
        a._id === assetId ||
        a.name === assetId,
    );
    if (!asset) {
      return { status: "asset_not_found", assetId };
    }
    if (asset.type !== "audio_set") {
      return { status: "asset_not_audio_set", assetId, assetName: asset.name };
    }

    const entries = asset.audioEntries || (asset as any)?.audio_entries;
    const entry = entries?.find((e: any) => {
      const val =
        e.timeSeconds != null
          ? e.timeSeconds
          : e.time_seconds != null
            ? e.time_seconds
            : e.percentage;
      const mode = e.triggerMode || e.trigger_mode || "remaining";
      return (
        val != null &&
        Math.abs(Number(val) - timeSeconds) < 0.1 &&
        mode === triggerMode
      );
    });
    if (!entry) {
      return {
        status: "entry_not_found",
        assetId,
        assetName: asset.name || assetId,
      };
    }

    const entryType = entry.type || "preset";
    if (entryType === "none") {
      return {
        status: "entry_disabled",
        assetId,
        assetName: asset.name || assetId,
      };
    }

    const playableUrl = entry.url
      ? RacedayTimedAudioHelper.resolveAssetPlayableUrl(host, entry.url)
      : undefined;

    if (entryType === "preset" && !playableUrl) {
      return {
        status: "entry_missing_content",
        assetId,
        assetName: asset.name || assetId,
      };
    }
    if (entryType === "tts" && !entry.text?.trim()) {
      return {
        status: "entry_missing_content",
        assetId,
        assetName: asset.name || assetId,
      };
    }

    return {
      status: "ready",
      assetId,
      assetName: asset.name || assetId,
      entryItem: {
        config: {
          type: entryType,
          url: playableUrl,
          text: entry.text || undefined,
        },
        playableUrl,
      },
    };
  }

  static getAudioFromSetEntry(
    host: any,
    slotKey: string,
    timeSeconds: number,
    triggerMode: string = "remaining",
  ): { config: AudioConfig; playableUrl?: string } | null {
    const res = RacedayTimedAudioHelper.getAudioSetResolution(
      host,
      slotKey,
      timeSeconds,
      triggerMode,
    );
    return res.status === "ready" ? (res.entryItem ?? null) : null;
  }

  static playAudioFromSet(
    host: any,
    slotKey: string,
    timeSeconds: number,
    association?: AudioAssociation,
    triggerMode: string = "remaining",
  ): boolean {
    const defaultAssoc =
      association ??
      (slotKey === THEME_SLOT_KEYS.AUDIO_COUNTDOWN
        ? { widgetType: "countdown" }
        : { widgetType: "timer" });

    const entryItem = RacedayTimedAudioHelper.getAudioFromSetEntry(
      host,
      slotKey,
      timeSeconds,
      triggerMode,
    );
    if (entryItem) {
      if (slotKey === THEME_SLOT_KEYS.AUDIO_COUNTDOWN) {
        if (entryItem.config.type === "tts") {
          return host.audioService?.playCallout(
            { type: "tts", text: entryItem.config.text },
            "urgent",
            undefined,
            undefined,
            defaultAssoc,
          );
        }
        return !!host.audioService?.playSfx(
          entryItem.playableUrl,
          defaultAssoc,
        );
      }
      if (
        slotKey === THEME_SLOT_KEYS.AUDIO_AUTO_START ||
        slotKey === THEME_SLOT_KEYS.AUDIO_AUTO_ADVANCE
      ) {
        host.logger?.info(
          `[AUDIO-SET] Triggering audio set '${slotKey}' at ${timeSeconds}s (${triggerMode}) with priority 'normal'`,
        );
        return host.audioService?.playCallout(
          entryItem.config,
          "normal",
          undefined,
          entryItem.playableUrl,
          defaultAssoc,
        );
      }

      const isTimeCallout = slotKey === THEME_SLOT_KEYS.AUDIO_SECONDS_LEFT;
      const isLapsCallout = slotKey === THEME_SLOT_KEYS.AUDIO_LAPS_LEFT;
      const isUrgent =
        (isTimeCallout && triggerMode === "remaining" && timeSeconds <= 5) ||
        (isLapsCallout && triggerMode === "remaining" && timeSeconds <= 1);
      const priority: AudioPriority = isUrgent
        ? "urgent"
        : isTimeCallout
          ? "high"
          : "normal";
      host.logger?.info(
        `[AUDIO-SET] Triggering audio set '${slotKey}' at ${timeSeconds}s (${triggerMode}) with priority '${priority}'`,
      );
      const calloutFn = host.audioService?.queueCallout
        ? host.audioService.queueCallout.bind(host.audioService)
        : host.audioService?.playCallout.bind(host.audioService);
      return calloutFn(
        entryItem.config,
        priority,
        undefined,
        entryItem.playableUrl,
        defaultAssoc,
      );
    }
    return false;
  }

  static playThemedSound(
    host: any,
    slotKey: string,
    context?: any,
    association?: AudioAssociation,
  ): void {
    const config = host.themeService?.resolveAudioConfig(slotKey);
    if (!config || config.type === "none") return;

    if (config.type === "tts") {
      if (!config.text?.trim()) return;
    } else {
      if (!config.url?.trim()) return;
    }

    let playableUrl: string | undefined = config.url;
    if (config.type === "preset" && playableUrl) {
      playableUrl = RacedayTimedAudioHelper.resolveAssetPlayableUrl(
        host,
        playableUrl,
      );
    }

    const defaultAssoc =
      association ??
      RacedayTimedAudioHelper.resolveThemedAssociation(slotKey, context);

    const priority: AudioPriority =
      slotKey === THEME_SLOT_KEYS.AUDIO_YELLOW_FLAG ||
      slotKey === THEME_SLOT_KEYS.AUDIO_HEAT_OVER ||
      slotKey === THEME_SLOT_KEYS.AUDIO_RACE_OVER ||
      slotKey === THEME_SLOT_KEYS.AUDIO_MIN_LAP_TIME
        ? "urgent"
        : slotKey === THEME_SLOT_KEYS.AUDIO_SECONDS_LEFT_HALFWAY ||
            slotKey === THEME_SLOT_KEYS.AUDIO_SECONDS_LEFT
          ? "high"
          : "normal";

    host.logger?.info(
      `[AUDIO-THEME] Dispatching themed sound '${slotKey}' with priority '${priority}'`,
    );

    if (defaultAssoc) {
      host.audioService?.playCallout(
        config,
        priority,
        context,
        playableUrl,
        defaultAssoc,
      );
    } else {
      host.audioService?.playCallout(config, priority, context, playableUrl);
    }
  }

  private static resolveThemedAssociation(
    slotKey: string,
    context?: any,
  ): AudioAssociation | undefined {
    if (
      slotKey === THEME_SLOT_KEYS.AUDIO_YELLOW_FLAG ||
      slotKey === THEME_SLOT_KEYS.AUDIO_HEAT_OVER ||
      slotKey === THEME_SLOT_KEYS.AUDIO_RACE_OVER
    ) {
      return { widgetType: "flag" };
    }
    if (
      slotKey === THEME_SLOT_KEYS.AUDIO_SECONDS_LEFT ||
      slotKey === THEME_SLOT_KEYS.AUDIO_LAPS_LEFT ||
      slotKey === THEME_SLOT_KEYS.AUDIO_SECONDS_LEFT_HALFWAY ||
      slotKey === THEME_SLOT_KEYS.AUDIO_AUTO_START ||
      slotKey === THEME_SLOT_KEYS.AUDIO_AUTO_ADVANCE
    ) {
      return { widgetType: "timer" };
    }
    if (slotKey === THEME_SLOT_KEYS.AUDIO_MIN_LAP_TIME) {
      return {
        widgetType: "lane-view",
        laneIndex: context?.driver?.lane,
        driverId: context?.driver?.driverId,
      };
    }
    return undefined;
  }

  static getSecondsLeftThresholds(
    host: any,
    triggerMode: "remaining" | "elapsed" = "remaining",
  ): number[] {
    const config = host.themeService?.resolveAudioConfig(
      THEME_SLOT_KEYS.AUDIO_SECONDS_LEFT,
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
    return triggerMode === "remaining"
      ? [300, 240, 180, 120, 60, 30, 25, 20, 15, 10, 5]
      : [];
  }

  static checkAudioCallouts(
    host: any,
    currentTime: number,
    previousTime: number,
  ): void {
    const scoring = host.race?.heat_scoring;
    if (!scoring || scoring.finishMethod !== FinishMethod.Timed) return;

    const totalDuration = scoring.finishValue;
    const previousElapsed = totalDuration - previousTime;
    const currentElapsed = totalDuration - currentTime;

    // Halfway logic
    const halfwayThreshold = totalDuration / 2;
    if (
      previousTime > halfwayThreshold &&
      currentTime <= halfwayThreshold &&
      !host.playedHalfway
    ) {
      host.logger?.info(
        `[AUDIO-TIMED] Halfway threshold reached (currentTime: ${currentTime.toFixed(2)}s, prevTime: ${previousTime.toFixed(2)}s, halfway: ${halfwayThreshold.toFixed(2)}s)`,
      );
      RacedayTimedAudioHelper.playThemedSound(
        host,
        THEME_SLOT_KEYS.AUDIO_SECONDS_LEFT_HALFWAY,
        undefined,
        { widgetType: "timer" },
      );
      host.playedHalfway = true;
    }

    RacedayTimedAudioHelper.checkRemainingSecondsThresholds(
      host,
      totalDuration,
      previousTime,
      currentTime,
    );

    RacedayTimedAudioHelper.checkElapsedSecondsThresholds(
      host,
      totalDuration,
      previousElapsed,
      currentElapsed,
    );
  }

  static playTimedSecondsCallout(
    host: any,
    threshold: number,
    triggerMode: "remaining" | "elapsed" = "remaining",
  ): boolean {
    const res = RacedayTimedAudioHelper.getAudioSetResolution(
      host,
      THEME_SLOT_KEYS.AUDIO_SECONDS_LEFT,
      threshold,
      triggerMode,
    );

    if (res.status === "ready") {
      const played = RacedayTimedAudioHelper.playAudioFromSet(
        host,
        THEME_SLOT_KEYS.AUDIO_SECONDS_LEFT,
        threshold,
        { widgetType: "timer" },
        triggerMode,
      );
      if (!played) {
        host.logger?.warn(
          `[AUDIO-TIMED] Seconds left (${triggerMode}) threshold ${threshold}s was dropped by audio manager (channel busy, cadence spacing, or UI relevance)`,
        );
      }
      return played;
    }

    switch (res.status) {
      case "slot_not_configured":
        host.logger?.debug(
          `[AUDIO-TIMED] Seconds left (${triggerMode}) theme slot '${THEME_SLOT_KEYS.AUDIO_SECONDS_LEFT}' is not configured or disabled`,
        );
        break;
      case "not_audio_set":
        host.logger?.debug(
          `[AUDIO-TIMED] Seconds left (${triggerMode}) theme slot '${THEME_SLOT_KEYS.AUDIO_SECONDS_LEFT}' is configured as single sound, not an audio set`,
        );
        break;
      case "no_asset_id":
        host.logger?.debug(
          `[AUDIO-TIMED] Seconds left (${triggerMode}) theme slot '${THEME_SLOT_KEYS.AUDIO_SECONDS_LEFT}' has no audio set asset selected`,
        );
        break;
      case "asset_not_found":
        host.logger?.warn(
          `[AUDIO-TIMED] Seconds left (${triggerMode}) audio set asset '${res.assetId}' not found in loaded assets`,
        );
        break;
      case "asset_not_audio_set":
        host.logger?.warn(
          `[AUDIO-TIMED] Seconds left (${triggerMode}) asset '${res.assetId}' is not an audio set`,
        );
        break;
      case "entry_not_found":
        host.logger?.debug(
          `[AUDIO-TIMED] Seconds left (${triggerMode}) threshold ${threshold}s has no entry configured in audio set '${res.assetName || res.assetId}'`,
        );
        break;
      case "entry_disabled":
        host.logger?.debug(
          `[AUDIO-TIMED] Seconds left (${triggerMode}) threshold ${threshold}s audio entry is disabled (type: 'none')`,
        );
        break;
      case "entry_missing_content":
        host.logger?.warn(
          `[AUDIO-TIMED] Seconds left (${triggerMode}) threshold ${threshold}s audio entry has missing URL or text content`,
        );
        break;
      default:
        host.logger?.debug(
          `[AUDIO-TIMED] Seconds left (${triggerMode}) threshold ${threshold}s could not be resolved (status: ${res.status})`,
        );
        break;
    }
    return false;
  }

  private static checkRemainingSecondsThresholds(
    host: any,
    totalDuration: number,
    previousTime: number,
    currentTime: number,
  ): void {
    const remainingThresholds =
      RacedayTimedAudioHelper.getSecondsLeftThresholds(host, "remaining");
    const halfwayThreshold = totalDuration / 2;
    const halfwayConfig = host.themeService?.resolveAudioConfig(
      THEME_SLOT_KEYS.AUDIO_SECONDS_LEFT_HALFWAY,
    );
    const hasHalfwayAudio =
      halfwayConfig &&
      halfwayConfig.type !== "none" &&
      (halfwayConfig.type === "tts"
        ? !!halfwayConfig.text?.trim()
        : !!halfwayConfig.url?.trim());

    for (const threshold of remainingThresholds) {
      if (
        previousTime > threshold &&
        currentTime <= threshold &&
        !host.playedSecondsLeft.has(threshold)
      ) {
        if (Math.abs(threshold - totalDuration) < 0.1) continue;

        if (hasHalfwayAudio && Math.abs(threshold - halfwayThreshold) < 0.1) {
          host.playedSecondsLeft.add(threshold);
          continue;
        }

        host.logger?.info(
          `[AUDIO-TIMED] Seconds left (remaining) threshold ${threshold}s triggered (currentTime: ${currentTime.toFixed(2)}s, prevTime: ${previousTime.toFixed(2)}s)`,
        );
        RacedayTimedAudioHelper.playTimedSecondsCallout(
          host,
          threshold,
          "remaining",
        );
        host.playedSecondsLeft.add(threshold);
      }
    }
  }

  private static checkElapsedSecondsThresholds(
    host: any,
    totalDuration: number,
    previousElapsed: number,
    currentElapsed: number,
  ): void {
    const elapsedThresholds = RacedayTimedAudioHelper.getSecondsLeftThresholds(
      host,
      "elapsed",
    );
    const halfwayThreshold = totalDuration / 2;
    const halfwayConfig = host.themeService?.resolveAudioConfig(
      THEME_SLOT_KEYS.AUDIO_SECONDS_LEFT_HALFWAY,
    );
    const hasHalfwayAudio =
      halfwayConfig &&
      halfwayConfig.type !== "none" &&
      (halfwayConfig.type === "tts"
        ? !!halfwayConfig.text?.trim()
        : !!halfwayConfig.url?.trim());

    for (const threshold of elapsedThresholds) {
      if (
        previousElapsed < threshold &&
        currentElapsed >= threshold &&
        !host.playedSecondsElapsed.has(threshold)
      ) {
        if (threshold <= 0 || Math.abs(threshold - totalDuration) < 0.1) {
          continue;
        }

        if (hasHalfwayAudio && Math.abs(threshold - halfwayThreshold) < 0.1) {
          host.playedSecondsElapsed.add(threshold);
          continue;
        }

        host.logger?.info(
          `[AUDIO-TIMED] Seconds left (elapsed) threshold ${threshold}s triggered (currentElapsed: ${currentElapsed.toFixed(2)}s, prevElapsed: ${previousElapsed.toFixed(2)}s)`,
        );
        RacedayTimedAudioHelper.playTimedSecondsCallout(
          host,
          threshold,
          "elapsed",
        );
        host.playedSecondsElapsed.add(threshold);
      }
    }
  }

  static getAutoStartThresholds(
    host: any,
    triggerMode: "remaining" | "elapsed" = "remaining",
  ): number[] {
    const config = host.themeService?.resolveAudioConfig(
      THEME_SLOT_KEYS.AUDIO_AUTO_START,
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
            .filter((t: number) => t > 0)
            .sort((a: number, b: number) =>
              triggerMode === "elapsed" ? a - b : b - a,
            );
        }
      }
    }
    return triggerMode === "remaining" ? [600, 300, 180, 60, 30, 10] : [];
  }

  static checkAutoStartCallouts(
    host: any,
    currentTime: number,
    previousTime: number,
  ): void {
    if (previousTime <= 0) return;
    const totalDuration = host.race?.auto_start_time ?? 0;
    const previousElapsed = totalDuration - previousTime;
    const currentElapsed = totalDuration - currentTime;

    const remainingThresholds = RacedayTimedAudioHelper.getAutoStartThresholds(
      host,
      "remaining",
    );
    for (const threshold of remainingThresholds) {
      if (
        previousTime > threshold &&
        currentTime <= threshold &&
        !host.playedAutoStart.has(threshold)
      ) {
        if (totalDuration > 0 && Math.abs(threshold - totalDuration) < 0.1) {
          continue;
        }

        RacedayTimedAudioHelper.playAudioFromSet(
          host,
          THEME_SLOT_KEYS.AUDIO_AUTO_START,
          threshold,
          { widgetType: "timer" },
          "remaining",
        );
        host.playedAutoStart.add(threshold);
      }
    }

    const elapsedThresholds = RacedayTimedAudioHelper.getAutoStartThresholds(
      host,
      "elapsed",
    );
    for (const threshold of elapsedThresholds) {
      if (
        previousElapsed < threshold &&
        currentElapsed >= threshold &&
        !host.playedAutoStartElapsed.has(threshold)
      ) {
        if (
          threshold <= 0 ||
          (totalDuration > 0 && Math.abs(threshold - totalDuration) < 0.1)
        ) {
          continue;
        }

        RacedayTimedAudioHelper.playAudioFromSet(
          host,
          THEME_SLOT_KEYS.AUDIO_AUTO_START,
          threshold,
          { widgetType: "timer" },
          "elapsed",
        );
        host.playedAutoStartElapsed.add(threshold);
      }
    }
  }

  static getAutoAdvanceThresholds(
    host: any,
    triggerMode: "remaining" | "elapsed" = "remaining",
  ): number[] {
    const config = host.themeService?.resolveAudioConfig(
      THEME_SLOT_KEYS.AUDIO_AUTO_ADVANCE,
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
            .filter((t: number) => t > 0)
            .sort((a: number, b: number) =>
              triggerMode === "elapsed" ? a - b : b - a,
            );
        }
      }
    }
    return triggerMode === "remaining" ? [600, 300, 180, 60, 30, 10] : [];
  }

  static checkAutoAdvanceCallouts(
    host: any,
    currentTime: number,
    previousTime: number,
  ): void {
    if (previousTime <= 0) return;
    const totalDuration =
      (host.race as any)?.auto_advance_time ??
      (host.race as any)?.auto_advance_remaining_seconds ??
      0;
    const previousElapsed = totalDuration - previousTime;
    const currentElapsed = totalDuration - currentTime;

    const remainingThresholds =
      RacedayTimedAudioHelper.getAutoAdvanceThresholds(host, "remaining");
    for (const threshold of remainingThresholds) {
      if (
        previousTime > threshold &&
        currentTime <= threshold &&
        !host.playedAutoAdvance.has(threshold)
      ) {
        if (totalDuration > 0 && Math.abs(threshold - totalDuration) < 0.1) {
          continue;
        }

        RacedayTimedAudioHelper.playAudioFromSet(
          host,
          THEME_SLOT_KEYS.AUDIO_AUTO_ADVANCE,
          threshold,
          { widgetType: "timer" },
          "remaining",
        );
        host.playedAutoAdvance.add(threshold);
      }
    }

    const elapsedThresholds = RacedayTimedAudioHelper.getAutoAdvanceThresholds(
      host,
      "elapsed",
    );
    for (const threshold of elapsedThresholds) {
      if (
        previousElapsed < threshold &&
        currentElapsed >= threshold &&
        !host.playedAutoAdvanceElapsed.has(threshold)
      ) {
        if (
          threshold <= 0 ||
          (totalDuration > 0 && Math.abs(threshold - totalDuration) < 0.1)
        ) {
          continue;
        }

        RacedayTimedAudioHelper.playAudioFromSet(
          host,
          THEME_SLOT_KEYS.AUDIO_AUTO_ADVANCE,
          threshold,
          { widgetType: "timer" },
          "elapsed",
        );
        host.playedAutoAdvanceElapsed.add(threshold);
      }
    }
  }

  static preloadCountdownAudio(host: any): void {
    host.preloadCountdownImages?.();
    if (
      !host.assets ||
      host.assets.length === 0 ||
      !host.audioService ||
      typeof host.audioService.preload !== "function"
    ) {
      return;
    }
    for (let second = 0; second <= 5; second++) {
      const item = RacedayTimedAudioHelper.getAudioFromSetEntry(
        host,
        THEME_SLOT_KEYS.AUDIO_COUNTDOWN,
        second,
      );
      if (item?.playableUrl && item.config.type !== "tts") {
        host.audioService.preload(item.playableUrl);
      }
    }
  }

  static updateAudioRelevance(host: any): void {
    const layout = "layout" in host ? host.layout : host.currentRacedayLayout;
    const widgets = layout?.widgets;
    if (!widgets || widgets.length === 0) {
      host.audioService?.setRelevanceFilter({
        driverAudioMode: "none",
        allowCountdown: false,
        allowTimer: false,
        allowRaceState: false,
      });
      return;
    }

    const hasLaneView = widgets.some(
      (w: any) =>
        w.widgetType === "lane-view" || w.widgetType === "lane-column",
    );
    const hasCountdown = widgets.some((w: any) => w.widgetType === "countdown");
    const hasTimer = widgets.some((w: any) => w.widgetType === "timer");
    const hasFlag = widgets.some((w: any) => w.widgetType === "flag");

    const isStation =
      host.isDriverStation && host.activeLaneIndex !== undefined;
    host.audioService?.setRelevanceFilter({
      driverAudioMode: hasLaneView ? (isStation ? "scoped" : "all") : "none",
      allowedLanes: isStation ? new Set([host.activeLaneIndex!]) : undefined,
      allowCountdown: hasCountdown,
      allowTimer: hasTimer,
      allowRaceState: hasFlag,
    });
  }

  static resetRaceAudioTracking(host: any): void {
    host.playedSecondsLeft?.clear();
    host.playedSecondsElapsed?.clear();
    host.playedLapsLeft?.clear();
    host.playedLapsElapsed?.clear();
    host.playedAutoStart?.clear();
    host.playedAutoStartElapsed?.clear();
    host.playedAutoAdvance?.clear();
    host.playedAutoAdvanceElapsed?.clear();
    host.previousAutoStartRemaining = 0;
    host.previousAutoAdvanceRemaining = 0;
    host.leaderLaps = 0;
    host.playedHalfway = false;
    host.resetFuelAudioTracking?.();
  }

  static handleCarFuelAudio(host: any, carData: any): void {
    if (!carData || carData.lane == null) return;
    const currentFuel =
      carData.fuelLevel != null ? Number(carData.fuelLevel) : null;
    const isRefueling = !!carData.isRefueling;
    if (host.heat?.heatDrivers) {
      const driverData =
        host.heat.heatDrivers.find((d: any) => d.laneIndex === carData.lane) ||
        host.heat.heatDrivers[carData.lane];
      if (driverData?.participant && currentFuel != null) {
        driverData.participant.fuelLevel = currentFuel;
      }
    }
    RacedayTimedAudioHelper.updateLaneFuel(
      host,
      carData.lane,
      currentFuel,
      isRefueling,
    );
  }

  static updateLaneFuel(
    host: any,
    lane: number,
    currentFuel: number | null,
    isRefueling: boolean,
  ): void {
    if (!host.fuelAudioTracker?.isFuelRace(host.race, host.track)) {
      return;
    }
    const canPlayAudio =
      host.raceState === RaceState.RACING ||
      host.raceState === RaceState.PAUSED;
    host.fuelAudioTracker.updateLaneFuel(
      lane,
      currentFuel,
      isRefueling,
      host.heat,
      host.hasRacedInCurrentHeat,
      host.race,
      host.track,
      host.assets,
      canPlayAudio,
      host.themeService?.getActiveTheme?.(),
    );
  }
}
