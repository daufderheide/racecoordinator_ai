import { DataService } from "@app/data.service";
import { AudioConfig } from "@app/models/driver";
import { THEME_SLOT_KEYS } from "@app/models/theme";
import {
  AudioAssociation,
  AudioPriority,
  AudioService,
} from "@app/services/audio.service";
import { ThemeService } from "@app/services/theme.service";
import { resolveAudioUrl } from "@app/utils/audio";

export interface DriverStationThemeAudioDeps {
  themeService: ThemeService;
  audioService: AudioService;
  dataService: DataService;
  getAssets: () => any[];
}

export class DriverStationThemeAudioHandler {
  constructor(private deps: DriverStationThemeAudioDeps) {}

  public playThemedSound(
    slotKey: string,
    context?: any,
    association?: AudioAssociation,
  ): void {
    const config = this.deps.themeService.resolveAudioConfig(slotKey);
    if (!config || config.type === "none") return;

    if (config.type === "tts") {
      if (!config.text?.trim()) return;
    } else {
      if (!config.url?.trim()) return;
    }

    let playableUrl: string | undefined = config.url;
    if (config.type === "preset" && playableUrl) {
      playableUrl = this.resolveAssetPlayableUrl(playableUrl);
    }

    let priority: AudioPriority = "normal";
    if (
      slotKey === THEME_SLOT_KEYS.AUDIO_YELLOW_FLAG ||
      slotKey === THEME_SLOT_KEYS.AUDIO_HEAT_OVER ||
      slotKey === THEME_SLOT_KEYS.AUDIO_RACE_OVER ||
      slotKey === THEME_SLOT_KEYS.AUDIO_MIN_LAP_TIME
    ) {
      priority = "urgent";
    }

    let defaultAssoc = association;
    if (!defaultAssoc) {
      if (
        slotKey === THEME_SLOT_KEYS.AUDIO_YELLOW_FLAG ||
        slotKey === THEME_SLOT_KEYS.AUDIO_HEAT_OVER ||
        slotKey === THEME_SLOT_KEYS.AUDIO_RACE_OVER
      ) {
        defaultAssoc = { widgetType: "flag" };
      } else if (
        slotKey === THEME_SLOT_KEYS.AUDIO_SECONDS_LEFT ||
        slotKey === THEME_SLOT_KEYS.AUDIO_LAPS_LEFT ||
        slotKey === THEME_SLOT_KEYS.AUDIO_SECONDS_LEFT_HALFWAY ||
        slotKey === THEME_SLOT_KEYS.AUDIO_AUTO_START ||
        slotKey === THEME_SLOT_KEYS.AUDIO_AUTO_ADVANCE
      ) {
        defaultAssoc = { widgetType: "timer" };
      }
    }

    this.deps.audioService.playCallout(
      config,
      priority,
      context,
      playableUrl,
      defaultAssoc,
    );
  }

  public getAudioFromSetEntry(
    slotKey: string,
    timeSeconds: number,
    triggerMode: string = "remaining",
  ): { config: AudioConfig; playableUrl?: string } | null {
    if (
      !this.deps.themeService ||
      typeof this.deps.themeService.resolveAudioConfig !== "function"
    ) {
      return null;
    }
    const config = this.deps.themeService.resolveAudioConfig(slotKey);
    if (!config || config.type !== "audio_set") return null;

    const assetId = config.url;
    if (!assetId) return null;

    const assets = this.deps.getAssets() || [];
    const asset = assets.find(
      (a) =>
        a.model?.entityId === assetId ||
        a.entity_id === assetId ||
        a._id === assetId ||
        a.name === assetId,
    );
    if (!asset || asset.type !== "audio_set") return null;

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
    if (!entry) return null;

    const entryType = entry.type || "preset";
    if (entryType === "none") return null;

    const playableUrl = entry.url
      ? this.resolveAssetPlayableUrl(entry.url)
      : undefined;
    return {
      config: {
        type: entryType,
        url: playableUrl,
        text: entry.text || undefined,
      },
      playableUrl,
    };
  }

  public playAudioFromSet(
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

    const entryItem = this.getAudioFromSetEntry(
      slotKey,
      timeSeconds,
      triggerMode,
    );
    if (entryItem) {
      if (slotKey === THEME_SLOT_KEYS.AUDIO_COUNTDOWN) {
        if (entryItem.config.type === "tts") {
          return this.deps.audioService.playCallout(
            { type: "tts", text: entryItem.config.text },
            "normal",
            undefined,
            undefined,
            defaultAssoc,
          );
        } else {
          return !!this.deps.audioService.playSfx(
            entryItem.playableUrl,
            defaultAssoc,
          );
        }
      } else {
        return this.deps.audioService.playCallout(
          entryItem.config,
          "normal",
          undefined,
          entryItem.playableUrl,
          defaultAssoc,
        );
      }
    }
    return false;
  }

  public preloadCountdownAudio(): void {
    const assets = this.deps.getAssets();
    if (
      !assets ||
      assets.length === 0 ||
      !this.deps.audioService ||
      typeof this.deps.audioService.preload !== "function"
    ) {
      return;
    }
    for (let second = 0; second <= 5; second++) {
      const item = this.getAudioFromSetEntry(
        THEME_SLOT_KEYS.AUDIO_COUNTDOWN,
        second,
      );
      if (item?.playableUrl && item.config.type !== "tts") {
        this.deps.audioService.preload(item.playableUrl);
      }
    }
  }

  public resolveAssetPlayableUrl(
    urlOrId: string | undefined,
  ): string | undefined {
    if (!urlOrId) return undefined;
    const assets = this.deps.getAssets() || [];
    const asset = assets.find(
      (a: any) =>
        a.model?.entityId === urlOrId ||
        a.entity_id === urlOrId ||
        a._id === urlOrId ||
        a.name === urlOrId,
    );
    if (asset?.url) {
      return resolveAudioUrl(asset.url, this.deps.dataService.serverUrl);
    }
    return resolveAudioUrl(urlOrId, this.deps.dataService.serverUrl);
  }
}
