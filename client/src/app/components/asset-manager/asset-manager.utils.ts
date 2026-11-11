import { normalizeAssetType } from "@app/models/asset";
import {
  IAssetMessage,
  IAudioSetEntry,
  ICustomRotation,
  IImageSetEntry,
  ISaveAudioSetEntry,
  ISaveImageSetEntry,
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

export function readAssetFile(
  file: File,
): Promise<{ name: string; type: string; data: Uint8Array }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const arrayBuffer = e.target.result;
      const bytes = new Uint8Array(arrayBuffer);
      const isImage =
        (file.type && file.type.startsWith("image/")) ||
        /\.(png|jpe?g|gif|webp|svg)$/i.test(file.name);
      const type = isImage ? "image" : "audio";
      resolve({ name: file.name, type, data: bytes });
    };
    reader.onerror = (e) => reject(e);
    reader.readAsArrayBuffer(file);
  });
}

export function isCsvAsset(asset?: {
  type?: string;
  name?: string;
  url?: string;
}): boolean {
  if (!asset) {
    return false;
  }
  if (asset.type === "custom_rotation") {
    return false;
  }
  const name = (asset.name || "").toLowerCase();
  const url = (asset.url || "").toLowerCase();
  return asset.type === "csv" || name.endsWith(".csv") || url.endsWith(".csv");
}

export function calculateTotalAssetBytes(assets: AssetView[]): number {
  return (assets || []).reduce(
    (sum, asset) => sum + parseAssetSize(asset.size),
    0,
  );
}

export function formatTotalAssetSize(assets: AssetView[]): string {
  return formatAssetBytes(calculateTotalAssetBytes(assets));
}

export function toImageSetEditorEntries(
  images?: IImageSetEntry[],
): ISaveImageSetEntry[] {
  return (images || []).map((img) => ({
    percentage: img.percentage,
    url: img.url,
    name: img.name,
    data: new Uint8Array(),
  }));
}

export function toAudioSetEditorEntries(
  entries?: IAudioSetEntry[],
): ISaveAudioSetEntry[] {
  return (entries || []).map((entry) => ({
    timeSeconds: entry.timeSeconds,
    url: entry.url,
    name: entry.name,
    data: new Uint8Array(),
    type: entry.type || "preset",
    text: entry.text || "",
    percentage:
      (entry as any).percentage != null
        ? (entry as any).percentage
        : Math.round(entry.timeSeconds || 0),
    triggerMode:
      entry.triggerMode || (entry as any).trigger_mode || "remaining",
  }));
}

export function mapServerAssetsToViews(
  serverAssets: IAssetMessage[],
  getAssetUrl: (a: IAssetMessage) => string,
): AssetView[] {
  if (!serverAssets) return [];
  return serverAssets.map((a) => {
    let type: any = a.type;
    if (a.customRotations && a.customRotations.length > 0) {
      type = "custom_rotation";
    } else if (a.audioEntries && a.audioEntries.length > 0) {
      type = "audio_set";
    } else if (a.images && a.images.length > 0) {
      type = "image_set";
    } else {
      type = normalizeAssetType(type);
    }

    return {
      id: a.model?.entityId || "",
      name: a.name || "Unknown",
      type: type,
      size: a.size || "0 B",
      url: getAssetUrl(a),
      editMode: false,
      selected: false,
      images: a.images || [],
      audioEntries: a.audioEntries || [],
      numLanes: a.numLanes ?? undefined,
      customRotations: a.customRotations || [],
      currentPreviewIndex: 0,
    };
  });
}
