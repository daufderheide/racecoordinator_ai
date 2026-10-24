import { normalizeAssetType } from "@app/models/asset";
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

export function getAssetBytesByType(assets: AssetView[], type: string): number {
  const targetType = normalizeAssetType(type);
  return assets
    .filter((a) => normalizeAssetType(a.type) === targetType)
    .reduce((sum, a) => sum + parseAssetSize(a.size), 0);
}

export function calculateAssetUsagePercent(
  bytes: number,
  totalBytes: number,
): number {
  return totalBytes === 0 ? 0 : (bytes / totalBytes) * 100;
}

export function getAssetCountByType(assets: AssetView[], type: string): number {
  if (type === "sound" || type === "audio") {
    return assets.filter((a) => a.type === "sound" || a.type === "audio")
      .length;
  }
  return assets.filter((a) => a.type === type).length;
}

export function sortAudioSetEntries(
  entries: IAudioSetEntry[],
): IAudioSetEntry[] {
  return [...entries].sort((a, b) => {
    const modeA = a.triggerMode || (a as any).trigger_mode || "remaining";
    const modeB = b.triggerMode || (b as any).trigger_mode || "remaining";
    if (modeA !== modeB) {
      return modeA === "elapsed" ? -1 : 1;
    }
    const valA =
      Number(a.timeSeconds != null ? a.timeSeconds : a.percentage) || 0;
    const valB =
      Number(b.timeSeconds != null ? b.timeSeconds : b.percentage) || 0;
    return modeA === "elapsed" ? valA - valB : valB - valA;
  });
}

export interface ListGridDimensions {
  cols: number;
  rows: number;
}

export function calculateListGridDimensions(
  availableWidth: number,
  availableHeight: number,
  itemCount: number,
  options: {
    colMinWidth?: number;
    rowHeight?: number;
    gap?: number;
    paddingBottom?: number;
  } = {},
): ListGridDimensions {
  const colMinWidth = options.colMinWidth ?? 240;
  const rowHeight = options.rowHeight ?? 38;
  const gap = options.gap ?? 6;
  const paddingBottom = options.paddingBottom ?? 20;

  const cols = Math.max(
    1,
    Math.floor((availableWidth + gap) / (colMinWidth + gap)),
  );
  const usableHeight = Math.max(rowHeight, availableHeight - paddingBottom);
  const visibleRows = Math.max(
    1,
    Math.floor((usableHeight + gap) / (rowHeight + gap)),
  );

  const minRowsToFit = Math.ceil(itemCount / cols);
  const rows = Math.max(visibleRows, minRowsToFit, 1);

  return { cols, rows };
}
