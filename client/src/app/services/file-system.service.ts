import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class FileSystemService {
  private readonly DB_NAME = "race-coordinator-fs";
  private readonly STORE_NAME = "handles";
  private readonly HANDLE_KEY = "raceday-setup-dir";
  private readonly WIDGETS_HANDLE_KEY = "custom-widgets-dir";
  private dbPromise: Promise<IDBDatabase>;

  constructor() {
    this.dbPromise = this.initDB();
  }

  private initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, 1);

      request.onerror = (event) => {
        console.error("IndexedDB error:", event);
        reject("IndexedDB failed to open");
      };

      request.onsuccess = (event) => {
        resolve((event.target as IDBOpenDBRequest).result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME);
        }
      };
    });
  }

  async selectCustomFolder(): Promise<boolean> {
    try {
      const handle = await window.showDirectoryPicker();
      const db = await this.dbPromise;

      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([this.STORE_NAME], "readwrite");
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.put(handle, this.HANDLE_KEY);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      return true;
    } catch (err) {
      console.error("Error selecting folder:", err);
      return false;
    }
  }

  async clearCustomFolder(): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], "readwrite");
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.delete(this.HANDLE_KEY);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getCustomDirectoryHandle(): Promise<
    FileSystemDirectoryHandle | undefined
  > {
    const db = await this.dbPromise;

    return new Promise((resolve, _reject) => {
      const transaction = db.transaction([this.STORE_NAME], "readonly");
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(this.HANDLE_KEY);

      request.onsuccess = () => {
        resolve(request.result as FileSystemDirectoryHandle);
      };

      request.onerror = () => {
        // It's okay if not found, usually returns undefined
        resolve(undefined);
      };
    });
  }

  async selectCustomWidgetFolder(): Promise<boolean> {
    try {
      const handle = await window.showDirectoryPicker();
      const db = await this.dbPromise;

      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([this.STORE_NAME], "readwrite");
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.put(handle, this.WIDGETS_HANDLE_KEY);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      return true;
    } catch (err) {
      console.error("Error selecting custom widget folder:", err);
      return false;
    }
  }

  async clearCustomWidgetFolder(): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], "readwrite");
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.delete(this.WIDGETS_HANDLE_KEY);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getCustomWidgetDirectoryHandle(): Promise<
    FileSystemDirectoryHandle | undefined
  > {
    const db = await this.dbPromise;

    return new Promise((resolve, _reject) => {
      const transaction = db.transaction([this.STORE_NAME], "readonly");
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(this.WIDGETS_HANDLE_KEY);

      request.onsuccess = () => {
        resolve(request.result as FileSystemDirectoryHandle);
      };

      request.onerror = () => {
        resolve(undefined);
      };
    });
  }

  async getCustomWidgetDirectories(): Promise<
    { name: string; handle: FileSystemDirectoryHandle }[]
  > {
    const handle = await this.getCustomWidgetDirectoryHandle();
    if (!handle) return [];

    const permission = await this.verifyPermission(handle, false);
    if (!permission) return [];

    const results: { name: string; handle: FileSystemDirectoryHandle }[] = [];
    try {
      for await (const entry of (handle as any).values()) {
        if (entry.kind === "directory") {
          results.push({
            name: entry.name,
            handle: entry as FileSystemDirectoryHandle,
          });
        }
      }
    } catch (err) {
      console.error("Error listing widget directories:", err);
    }
    return results;
  }

  async getWidgetFile(
    widgetFolderName: string,
    filename: string,
  ): Promise<string> {
    const handle = await this.getCustomWidgetDirectoryHandle();
    if (!handle) throw new Error("No custom widget directory configured");

    const permission = await this.verifyPermission(handle, false);
    if (!permission) throw new Error("Permission denied");

    const widgetDir = await handle.getDirectoryHandle(widgetFolderName);
    const fileHandle = await widgetDir.getFileHandle(filename);
    const file = await fileHandle.getFile();
    return file.text();
  }

  async hasWidgetFile(
    widgetFolderName: string,
    filename: string,
  ): Promise<boolean> {
    const handle = await this.getCustomWidgetDirectoryHandle();
    if (!handle) return false;

    const permission = await this.verifyPermission(handle, false);
    if (!permission) return false;

    try {
      const widgetDir = await handle.getDirectoryHandle(widgetFolderName);
      await widgetDir.getFileHandle(filename);
      return true;
    } catch {
      return false;
    }
  }

  async writeWidgetFile(
    widgetFolderName: string,
    filename: string,
    content: string,
  ): Promise<void> {
    const handle = await this.getCustomWidgetDirectoryHandle();
    if (!handle) throw new Error("No custom widget directory configured");

    const permission = await this.verifyPermission(handle, true);
    if (!permission) throw new Error("Permission denied");

    const targetDir = widgetFolderName
      ? await handle.getDirectoryHandle(widgetFolderName, { create: true })
      : handle;
    const fileHandle = await targetDir.getFileHandle(filename, {
      create: true,
    });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  }

  async hasCustomFiles(
    filename?: string,
    subfolder?: string,
  ): Promise<boolean> {
    const handle = await this.getCustomDirectoryHandle();
    if (!handle) return false;

    // Verify permission
    const permission = await this.verifyPermission(handle, false);
    if (!permission) return false;

    let targetDir = handle;
    if (subfolder) {
      try {
        targetDir = await handle.getDirectoryHandle(subfolder);
      } catch {
        return false;
      }
    }

    if (filename) {
      try {
        await targetDir.getFileHandle(filename);
        return true;
      } catch {
        return false;
      }
    }

    try {
      // Check for any of the supported files
      const supported = [
        "raceday-setup.component.html",
        "raceday.component.html",
        "race-results.component.html",
        "driver-results.component.html",
      ];
      for (const file of supported) {
        try {
          await targetDir.getFileHandle(file);
          return true;
        } catch {
          // Continue to next file
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  async getCustomFile(filename: string, subfolder?: string): Promise<string> {
    const handle = await this.getCustomDirectoryHandle();
    if (!handle) throw new Error("No custom directory configured");

    const permission = await this.verifyPermission(handle, false);
    if (!permission) throw new Error("Permission denied");

    let targetDir = handle;
    if (subfolder) {
      targetDir = await handle.getDirectoryHandle(subfolder);
    }

    const fileHandle = await targetDir.getFileHandle(filename);
    const file = await fileHandle.getFile();
    return file.text();
  }

  async appendToFile(
    filename: string,
    content: string,
    subfolder?: string,
  ): Promise<void> {
    const handle = await this.getCustomDirectoryHandle();
    if (!handle) return; // Silent fail if no directory configured

    const permission = await this.verifyPermission(handle, true);
    if (!permission) return;

    try {
      let targetDir = handle;
      if (subfolder) {
        targetDir = await handle.getDirectoryHandle(subfolder, {
          create: true,
        });
      }

      const fileHandle = await targetDir.getFileHandle(filename, {
        create: true,
      });
      const writable = await fileHandle.createWritable({
        keepExistingData: true,
      });

      // Seek to the end to append
      const file = await fileHandle.getFile();
      await writable.seek(file.size);

      await writable.write(content);
      await writable.close();
    } catch (err) {
      console.error(`Error appending to file ${filename}:`, err);
    }
  }

  async deleteFile(filename: string, subfolder?: string): Promise<void> {
    const handle = await this.getCustomDirectoryHandle();
    if (!handle) return;

    const permission = await this.verifyPermission(handle, true);
    if (!permission) return;

    try {
      let targetDir = handle;
      if (subfolder) {
        targetDir = await handle.getDirectoryHandle(subfolder);
      }
      await targetDir.removeEntry(filename);
    } catch (err: any) {
      if (err.name !== "NotFoundError") {
        console.error(`Error deleting file ${filename}:`, err);
      }
    }
  }

  private async verifyPermission(
    handle: FileSystemDirectoryHandle,
    readWrite: boolean,
  ): Promise<boolean> {
    const options: FileSystemHandlePermissionDescriptor = {};
    if (readWrite) {
      options.mode = "readwrite";
    }
    if ((await handle.queryPermission(options)) === "granted") {
      return true;
    }
    if ((await handle.requestPermission(options)) === "granted") {
      return true;
    }
    return false;
  }
}
