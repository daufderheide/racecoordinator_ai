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
