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
