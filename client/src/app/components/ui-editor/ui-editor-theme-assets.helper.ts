import { DataService } from "@app/data.service";
import { AudioConfig } from "@app/models/driver";
import { Theme } from "@app/models/theme";
import { ThemeService } from "@app/services/theme.service";

export function extractAssetId(asset: any): string | null {
  if (typeof asset === "string") return asset;
  return (
    asset?.model?.entityId ||
    asset?.entity_id ||
    asset?.entityId ||
    asset?.id ||
    null
  );
}

export function getThemeUrlForAsset(
  asset: any,
  dataService: DataService,
): string | undefined {
  if (!asset) return undefined;
  const assetId = asset.model?.entityId || asset.entity_id;
  if (assetId) {
    return dataService.getAssetUrl(assetId);
  }
  return asset.url || undefined;
}

export function getThemeAssetForSlot(
  slot: string,
  theme: Theme | undefined,
  fuelGaugeImageSet: string | undefined,
  themeService: ThemeService,
  assets: any[],
): any | undefined {
  let assetId: string | undefined | null;

  if (theme?.slots && theme.slots[slot]) {
    assetId = theme.slots[slot];
  } else {
    assetId =
      (slot === "gauge.fuel" ? fuelGaugeImageSet : undefined) ||
      themeService.resolveAssetId(slot);
  }

  if (!assetId) return undefined;
  return (assets || []).find(
    (a) => a.model?.entityId === assetId || a.entity_id === assetId,
  );
}

export function getThemeFlagUrl(
  slot: string,
  theme: Theme | undefined,
  fuelGaugeImageSet: string | undefined,
  themeService: ThemeService,
  assets: any[],
  dataService: DataService,
): string | undefined {
  const asset = getThemeAssetForSlot(
    slot,
    theme,
    fuelGaugeImageSet,
    themeService,
    assets,
  );
  return getThemeUrlForAsset(asset, dataService);
}

export function getThemeLampUrl(
  slot: string,
  theme: Theme | undefined,
  fuelGaugeImageSet: string | undefined,
  themeService: ThemeService,
  assets: any[],
  dataService: DataService,
): string | undefined {
  const asset = getThemeAssetForSlot(
    slot,
    theme,
    fuelGaugeImageSet,
    themeService,
    assets,
  );
  return getThemeUrlForAsset(asset, dataService);
}

export function getThemeFuelGaugeUrl(
  theme: Theme | undefined,
  fuelGaugeImageSet: string | undefined,
  themeService: ThemeService,
  assets: any[],
  dataService: DataService,
): string | undefined {
  const asset = getThemeAssetForSlot(
    "gauge.fuel",
    theme,
    fuelGaugeImageSet,
    themeService,
    assets,
  );
  return getThemeUrlForAsset(asset, dataService);
}

export function getThemeAudioConfigForSlot(
  slot: string,
  theme: Theme,
): AudioConfig {
  if (!theme.audio_slots) theme.audio_slots = {};
  const config = theme.audio_slots[slot];
  if (config && config.type) return config;

  // Fallback: If it's in the old slots map or missing, convert/default on the fly
  const legacyAssetId = theme.slots?.[slot];
  const isSet = slot === "audio.countdown" || slot === "audio.seconds_left";
  const defaultAssetId = isSet
    ? slot === "audio.countdown"
      ? "default_countdown"
      : "default_seconds_left"
    : undefined;

  const fallbackConfig: AudioConfig = {
    type: isSet ? "audio_set" : "preset",
    url: legacyAssetId || defaultAssetId,
  };

  theme.audio_slots[slot] = fallbackConfig;
  return fallbackConfig;
}

export function getThemeAudioUrl(
  slot: string,
  theme: Theme,
  dataService: DataService,
  assets: any[],
): string | undefined {
  const config = getThemeAudioConfigForSlot(slot, theme);
  if (config.type === "preset" && config.url) {
    const asset = assets.find(
      (a) =>
        a.model?.entityId === config.url ||
        a.entity_id === config.url ||
        a.url === config.url,
    );
    return getThemeUrlForAsset(asset, dataService);
  }
  return config.url;
}

export function resolveThemeFlag(
  comp: any,
  slot: string,
  theme?: Theme,
): string | undefined {
  return getThemeFlagUrl(
    slot,
    theme,
    comp.editingSettings?.fuelGaugeImageSet,
    comp.themeService,
    comp.assets,
    comp.dataService,
  );
}

export function resolveThemeLamp(
  comp: any,
  slot: string,
  theme?: Theme,
): string | undefined {
  return getThemeLampUrl(
    slot,
    theme,
    comp.editingSettings?.fuelGaugeImageSet,
    comp.themeService,
    comp.assets,
    comp.dataService,
  );
}

export function resolveThemeFuelGauge(
  comp: any,
  theme?: Theme,
): string | undefined {
  return getThemeFuelGaugeUrl(
    theme,
    comp.editingSettings?.fuelGaugeImageSet,
    comp.themeService,
    comp.assets,
    comp.dataService,
  );
}

export function resolveThemeAsset(
  comp: any,
  slot: string,
  theme?: Theme,
): any | undefined {
  return getThemeAssetForSlot(
    slot,
    theme,
    comp.editingSettings?.fuelGaugeImageSet,
    comp.themeService,
    comp.assets,
  );
}

export function handleClearCustomTemplate(comp: any): void {
  if (comp.editingSettings) {
    delete comp.editingSettings.customExportTemplateBase64;
    delete comp.editingSettings.customExportTemplateName;
    delete comp.editingSettings.customExportTemplatePath;
    comp.captureState();
    comp.cdr.markForCheck();
  }
}

export function handlePageTransitionChange(
  comp: any,
  transition: string,
): void {
  if (comp.editingSettings) {
    comp.editingSettings.pageTransition = transition;
    comp.captureState();
  }
}

export function handleMasterVolumeChange(
  comp: any,
  volume: number | string,
): void {
  if (comp.editingSettings) {
    comp.editingSettings.masterVolume = Math.round(Number(volume));
    comp.captureState();
  }
}

export function handleUrgentQueueTtlChange(comp: any, ttl: number): void {
  if (comp.editingSettings) {
    comp.editingSettings.urgentQueueTtl = ttl;
    comp.captureState();
  }
}

export function handleCalloutSpacingChange(comp: any, spacing: number): void {
  if (comp.editingSettings) {
    comp.editingSettings.calloutSpacing = spacing;
    comp.captureState();
  }
}

export function handleTtsVoiceChange(comp: any, voice: string): void {
  if (comp.editingSettings) {
    comp.editingSettings.ttsVoice = voice;
    comp.captureState();
  }
}

export function handleTtsRateChange(comp: any, rate: number | string): void {
  if (comp.editingSettings) {
    comp.editingSettings.ttsRate = Math.round(Number(rate) * 100) / 100;
    comp.captureState();
  }
}

export function handleTtsPitchChange(comp: any, pitch: number | string): void {
  if (comp.editingSettings) {
    comp.editingSettings.ttsPitch = Math.round(Number(pitch) * 100) / 100;
    comp.captureState();
  }
}

export function handleTtsVolumeChange(
  comp: any,
  volume: number | string,
): void {
  if (comp.editingSettings) {
    comp.editingSettings.ttsVolume = Math.round(Number(volume));
    comp.captureState();
  }
}

export function initAvailableVoices(comp: any): void {
  if (
    typeof window !== "undefined" &&
    window.speechSynthesis &&
    typeof window.speechSynthesis.getVoices === "function"
  ) {
    const updateVoices = () => {
      try {
        const voices =
          comp.audioService?.getVoices() ||
          window.speechSynthesis.getVoices() ||
          [];
        comp.availableVoices = [...voices].sort((a, b) =>
          (a.name || "").localeCompare(b.name || ""),
        );
        if (!comp.isDestroyed) {
          comp.cdr.markForCheck();
        }
      } catch {
        // Ignored if getVoices fails
      }
    };
    updateVoices();
    if (typeof window.speechSynthesis.addEventListener === "function") {
      window.speechSynthesis.addEventListener("voiceschanged", updateVoices);
    } else if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }
}

export function executeTestTtsVoice(comp: any): void {
  const text = comp.translationService.translate("UE_TTS_SAMPLE_TEXT");
  const voice = comp.editingSettings?.ttsVoice;
  const rate = comp.editingSettings?.ttsRate ?? 1.0;
  const pitch = comp.editingSettings?.ttsPitch ?? 1.0;
  const volume = comp.editingSettings?.ttsVolume ?? 100;
  const masterVolume = comp.editingSettings?.masterVolume ?? 100;

  if (comp.audioService) {
    comp.audioService.previewTTS(
      text,
      voice,
      rate,
      pitch,
      volume,
      masterVolume,
    );
  } else if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (voice && typeof window.speechSynthesis.getVoices === "function") {
      try {
        const voices = window.speechSynthesis.getVoices() || [];
        const trimmed = voice.trim().toLowerCase();
        const match = voices.find(
          (v: any) =>
            v.name === voice ||
            v.voiceURI === voice ||
            (v.name && v.name.trim().toLowerCase() === trimmed) ||
            (v.voiceURI && v.voiceURI.trim().toLowerCase() === trimmed),
        );
        if (match) {
          try {
            utterance.voice = match;
          } catch {
            // Ignored if voice conversion fails
          }
        }
      } catch {
        // Ignored
      }
    }
    utterance.rate = rate;
    utterance.pitch = pitch;
    const masterVol = Math.max(0, Math.min(1, masterVolume / 100));
    const ttsVol = Math.max(0, Math.min(1, volume / 100));
    utterance.volume = masterVol * ttsVol;
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    window.speechSynthesis.speak(utterance);
  }
}
