export enum AssetType {
  IMAGE = "image",
  IMAGE_SET = "image_set",
  AUDIO = "audio",
  AUDIO_SET = "audio_set",
  CUSTOM_ROTATION = "custom_rotation",
}

export function normalizeAssetType(type: string | undefined | null): AssetType {
  if (!type) {
    return AssetType.IMAGE;
  }
  const lower = type.toLowerCase();
  if (lower === "sound" || lower === "audio") {
    return AssetType.AUDIO;
  }
  if (lower === "image_set") {
    return AssetType.IMAGE_SET;
  }
  if (lower === "audio_set") {
    return AssetType.AUDIO_SET;
  }
  if (lower === "custom_rotation") {
    return AssetType.CUSTOM_ROTATION;
  }
  return AssetType.IMAGE;
}

export type AssetLayoutMode = "list" | "small" | "medium" | "large";

export function compareAssetsByTypeThenName(
  a: { type?: string; name?: string },
  b: { type?: string; name?: string },
  defaultType?: string,
): number {
  const typeA = normalizeAssetType(a?.type || defaultType).toLowerCase();
  const typeB = normalizeAssetType(b?.type || defaultType).toLowerCase();
  const typeCompare = typeA.localeCompare(typeB);
  if (typeCompare !== 0) {
    return typeCompare;
  }
  const nameA = a?.name || "";
  const nameB = b?.name || "";
  const nameCompare = nameA.localeCompare(nameB, undefined, {
    sensitivity: "base",
    numeric: true,
  });
  if (nameCompare !== 0) {
    return nameCompare;
  }
  return nameA.localeCompare(nameB);
}
