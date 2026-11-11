import { AssetLayoutMode } from "@app/models/asset";

export const ASSET_MANAGER_FILTER_STORAGE_KEY = "am_filter_tab";
export const ASSET_MANAGER_FILTER_FALLBACK_STORAGE_KEY = "am_filter_type";
export const ASSET_MANAGER_LAYOUT_STORAGE_KEY = "am_layout_mode";

export type AssetFilterType =
  | "all"
  | "image"
  | "sound"
  | "audio"
  | "image_set"
  | "audio_set"
  | "custom_rotation";

const VALID_FILTER_TYPES: ReadonlySet<string> = new Set([
  "all",
  "image",
  "sound",
  "audio",
  "image_set",
  "audio_set",
  "custom_rotation",
]);

export function loadSavedAssetFilterType(
  fallback: AssetFilterType = "all",
): AssetFilterType {
  try {
    const saved = (localStorage.getItem(ASSET_MANAGER_FILTER_STORAGE_KEY) ||
      localStorage.getItem(
        ASSET_MANAGER_FILTER_FALLBACK_STORAGE_KEY,
      )) as AssetFilterType;
    if (saved && VALID_FILTER_TYPES.has(saved)) {
      return saved;
    }
  } catch {
    // Ignore localStorage errors
  }
  return fallback;
}

export function saveAssetFilterType(type: AssetFilterType): void {
  try {
    localStorage.setItem(ASSET_MANAGER_FILTER_STORAGE_KEY, type);
  } catch {
    // Ignore localStorage errors
  }
}

export function loadSavedAssetLayoutMode(
  fallback: AssetLayoutMode = "medium",
): AssetLayoutMode {
  try {
    const saved = localStorage.getItem(
      ASSET_MANAGER_LAYOUT_STORAGE_KEY,
    ) as AssetLayoutMode;
    if (
      saved === "list" ||
      saved === "small" ||
      saved === "medium" ||
      saved === "large"
    ) {
      return saved;
    }
  } catch {
    // Ignore localStorage errors
  }
  return fallback;
}

export function saveAssetLayoutMode(mode: AssetLayoutMode): void {
  try {
    localStorage.setItem(ASSET_MANAGER_LAYOUT_STORAGE_KEY, mode);
  } catch {
    // Ignore localStorage errors
  }
}
