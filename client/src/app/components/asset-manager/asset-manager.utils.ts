import {
  IAudioSetEntry,
  ICustomRotation,
  IImageSetEntry,
} from "@app/proto/antigravity";

// Interface matching the mock/view needs, mapped from Protobuf
export interface AssetView {
  id: string;
  name: string;
  type:
    | "image"
    | "sound"
    | "audio"
    | "image_set"
    | "audio_set"
    | "custom_rotation"
    | "csv";
  size: string;
  url: string;
  editMode?: boolean;
  selected?: boolean;
  images?: IImageSetEntry[];
  audioEntries?: IAudioSetEntry[];
  numLanes?: number;
  customRotations?: ICustomRotation[];
  currentPreviewIndex?: number;
  hasError?: boolean;
}

export function parseAssetSize(sizeStr: string): number {
  if (!sizeStr) return 0;

  // Handle IEC units (KiB, MiB) by converting to JEDEC-like (KB, MB) for the parser
  const normalized = sizeStr.replace("iB", "B");

  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  const parts = normalized.split(" ");
  if (parts.length !== 2) return 0;

  const value = parseFloat(parts[0]);
  const unit = parts[1].toUpperCase();
  const power = units.indexOf(unit);

  if (power === -1) return 0;
  return value * Math.pow(1024, power);
}

export function formatAssetBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function formatAssetTooltip(bytes: number): string {
  const mb = (bytes / (1024 * 1024)).toFixed(2);
  return `${bytes.toLocaleString()} bytes (${mb} MB)`;
}
