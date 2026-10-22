export interface SaveFileOptions {
  suggestedName: string;
  data:
    | string
    | Blob
    | Uint8Array
    | (() => Promise<string | Blob | Uint8Array | null | undefined>)
    | Promise<string | Blob | Uint8Array | null | undefined>;
  mimeType: string;
  description?: string;
  extension?: string;
}

/**
 * Standardized Save As utility using the File System Access API (showSaveFilePicker)
 * when available, falling back to a blob download.
 *
 * Supports passing either direct data (string, Blob, Uint8Array) or an async data producer.
 * When an async producer is passed, showSaveFilePicker is invoked immediately to capture
 * the user gesture before the browser's transient activation window expires.
 *
 * @param options configuration options for the file save
 * @returns Promise<boolean> true if saved or initiated download, false if user cancelled
 */
export async function saveFileAs(options: SaveFileOptions): Promise<boolean> {
  const { suggestedName, data, mimeType, description, extension } = options;
  const ext =
    extension ||
    (suggestedName.includes(".") ? "." + suggestedName.split(".").pop() : "");

  if (
    typeof window !== "undefined" &&
    typeof (window as any).showSaveFilePicker === "function"
  ) {
    let handle: any;
    try {
      const pickerMime = mimeType.split(";")[0].trim();
      const types = ext
        ? [
            {
              description: description || "Files",
              accept: { [pickerMime]: [ext] },
            },
          ]
        : undefined;

      handle = await (window as any).showSaveFilePicker({
        suggestedName,
        types,
      });
    } catch (err: any) {
      if (err?.name === "AbortError") {
        return false;
      }
      // If picker fails for any other reason, fall through to fallback download
    }

    if (handle) {
      let resolvedData: any = data;
      if (typeof resolvedData === "function") {
        resolvedData = await resolvedData();
      } else if (resolvedData instanceof Promise) {
        resolvedData = await resolvedData;
      }

      if (
        !resolvedData ||
        (resolvedData instanceof Blob && resolvedData.size === 0)
      ) {
        return false;
      }

      const writable = await handle.createWritable();
      await writable.write(resolvedData);
      await writable.close();
      return true;
    }
  }

  // Fallback blob download
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }
  let resolvedData: any = data;
  if (typeof resolvedData === "function") {
    resolvedData = await resolvedData();
  } else if (resolvedData instanceof Promise) {
    resolvedData = await resolvedData;
  }

  if (
    !resolvedData ||
    (resolvedData instanceof Blob && resolvedData.size === 0)
  ) {
    return false;
  }

  const blob =
    resolvedData instanceof Blob
      ? resolvedData
      : new Blob([resolvedData as any], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = suggestedName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
  return true;
}
