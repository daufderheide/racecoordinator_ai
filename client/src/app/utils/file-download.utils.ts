export interface SaveFileOptions {
  suggestedName: string;
  data: string | Blob | Uint8Array;
  mimeType: string;
  description?: string;
  extension?: string;
}

/**
 * Standardized Save As utility using the File System Access API (showSaveFilePicker)
 * when available, falling back to a blob download.
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

      const handle = await (window as any).showSaveFilePicker({
        suggestedName,
        types,
      });
      const writable = await handle.createWritable();
      await writable.write(data);
      await writable.close();
      return true;
    } catch (err: any) {
      if (err?.name === "AbortError") {
        return false;
      }
      // If picker fails for any other reason, fall through to fallback download
    }
  }

  // Fallback blob download
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }
  const blob =
    data instanceof Blob ? data : new Blob([data as any], { type: mimeType });
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
