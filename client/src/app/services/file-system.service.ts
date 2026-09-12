import { Injectable } from "@angular/core";
import { ServerFileSystemService } from "@app/services/server-filesystem.service";

export interface DiscoveredWidgetDir {
  name: string;
  relativePath?: string;
  group?: string;
  subgroup?: string;
  handle?: FileSystemDirectoryHandle;
}

@Injectable({
  providedIn: "root",
})
export class FileSystemService {
  private readonly DB_NAME = "race-coordinator-fs";
  private readonly STORE_NAME = "handles";
  private readonly HANDLE_KEY = "raceday-setup-dir";
  private readonly WIDGETS_HANDLE_KEY = "custom-widgets-dir";
  private dbPromise: Promise<IDBDatabase>;

  private serverCustomUiPath?: string;
  private serverCustomUiName?: string;
  private serverCustomWidgetPath?: string;
  private serverCustomWidgetName?: string;
  private isLocalhost: boolean = false;

  constructor(private serverFileSystem: ServerFileSystemService) {
    this.dbPromise = this.initDB();
    this.initServerDirectories().catch(() => {});
  }

  async initServerDirectories(): Promise<void> {
    try {
      const dirs = await this.serverFileSystem.getDirectories();
      this.isLocalhost = dirs.isLocalhost;
      if (dirs.customUiDirectory) {
        this.serverCustomUiPath = dirs.customUiDirectory;
        this.serverCustomUiName = this.extractFolderName(
          dirs.customUiDirectory,
        );
      }
      if (dirs.customWidgetDirectory) {
        this.serverCustomWidgetPath = dirs.customWidgetDirectory;
        this.serverCustomWidgetName = this.extractFolderName(
          dirs.customWidgetDirectory,
        );
      }
    } catch {
      // Offline fallback
    }
  }

  private extractFolderName(fullPath: string): string {
    if (!fullPath) return "";
    const cleaned = fullPath.replace(/[\/\\]+$/, "");
    const parts = cleaned.split(/[\/\\]/);
    return parts[parts.length - 1] || cleaned;
  }

  getServerCustomUiPath(): string | undefined {
    return this.serverCustomUiPath;
  }

  getServerCustomWidgetPath(): string | undefined {
    return this.serverCustomWidgetPath;
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
    if (this.isLocalhost || typeof window.showDirectoryPicker !== "function") {
      const res = await this.serverFileSystem.chooseFolder("ui");
      if (res.success && res.path) {
        this.serverCustomUiPath = res.path;
        this.serverCustomUiName = res.name || this.extractFolderName(res.path);
        return true;
      }
      if (res.cancelled) {
        return false;
      }
    }

    if (typeof window.showDirectoryPicker === "function") {
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

    return false;
  }

  async setCustomFolder(path: string): Promise<boolean> {
    const res = await this.serverFileSystem.setDirectory("ui", path);
    if (res.success && res.path) {
      this.serverCustomUiPath = res.path;
      this.serverCustomUiName = res.name || this.extractFolderName(res.path);
      return true;
    }
    return false;
  }

  async clearCustomFolder(): Promise<void> {
    this.serverCustomUiPath = undefined;
    this.serverCustomUiName = undefined;
    await this.serverFileSystem.clearDirectory("ui");

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
    if (this.serverCustomUiPath) {
      return {
        name: this.serverCustomUiName || "custom-ui",
      } as any;
    }

    const db = await this.dbPromise;

    return new Promise((resolve, _reject) => {
      const transaction = db.transaction([this.STORE_NAME], "readonly");
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(this.HANDLE_KEY);

      request.onsuccess = () => {
        resolve(request.result as FileSystemDirectoryHandle);
      };

      request.onerror = () => {
        resolve(undefined);
      };
    });
  }

  async selectCustomWidgetFolder(): Promise<boolean> {
    if (this.isLocalhost || typeof window.showDirectoryPicker !== "function") {
      const res = await this.serverFileSystem.chooseFolder("widgets");
      if (res.success && res.path) {
        this.serverCustomWidgetPath = res.path;
        this.serverCustomWidgetName =
          res.name || this.extractFolderName(res.path);
        return true;
      }
      if (res.cancelled) {
        return false;
      }
    }

    if (typeof window.showDirectoryPicker === "function") {
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

    return false;
  }

  async setCustomWidgetFolder(path: string): Promise<boolean> {
    const res = await this.serverFileSystem.setDirectory("widgets", path);
    if (res.success && res.path) {
      this.serverCustomWidgetPath = res.path;
      this.serverCustomWidgetName =
        res.name || this.extractFolderName(res.path);
      return true;
    }
    return false;
  }

  async clearCustomWidgetFolder(): Promise<void> {
    this.serverCustomWidgetPath = undefined;
    this.serverCustomWidgetName = undefined;
    await this.serverFileSystem.clearDirectory("widgets");

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
    if (this.serverCustomWidgetPath) {
      return {
        name: this.serverCustomWidgetName || "custom-widgets",
      } as any;
    }

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

  async getCustomWidgetDirectories(): Promise<DiscoveredWidgetDir[]> {
    if (this.serverCustomWidgetPath) {
      const serverWidgets = await this.serverFileSystem.listWidgets();
      return serverWidgets.map((w) => ({
        name: w.name,
        relativePath: w.relativePath,
        group: w.group,
        subgroup: w.subgroup,
      }));
    }

    const handle = await this.getCustomWidgetDirectoryHandle();
    if (!handle) return [];

    const permission = await this.verifyPermission(handle, false);
    if (!permission) return [];

    const results: DiscoveredWidgetDir[] = [];
    try {
      for await (const entry of (handle as any).values()) {
        if (entry.kind === "directory") {
          const topDir = entry as FileSystemDirectoryHandle;
          const hasManifestAtTop = await this.checkEntryHasFile(
            topDir,
            "widget.json",
          );

          if (hasManifestAtTop) {
            results.push({
              name: topDir.name,
              relativePath: topDir.name,
              group: "custom-root",
              handle: topDir,
            });
          } else {
            const groupName = topDir.name;
            const childDirs = await this.getDirectoryChildren(topDir);

            if (childDirs.length === 0) {
              results.push({
                name: topDir.name,
                relativePath: topDir.name,
                group: "custom-root",
                handle: topDir,
              });
            } else {
              for (const childDir of childDirs) {
                const hasManifestAtChild = await this.checkEntryHasFile(
                  childDir,
                  "widget.json",
                );

                if (hasManifestAtChild) {
                  results.push({
                    name: childDir.name,
                    relativePath: `${groupName}/${childDir.name}`,
                    group: groupName,
                    handle: childDir,
                  });
                } else {
                  const subgroupName = childDir.name;
                  const subChildDirs =
                    await this.getDirectoryChildren(childDir);
                  for (const subChildDir of subChildDirs) {
                    const hasManifestAtSub = await this.checkEntryHasFile(
                      subChildDir,
                      "widget.json",
                    );
                    if (hasManifestAtSub) {
                      results.push({
                        name: subChildDir.name,
                        relativePath: `${groupName}/${subgroupName}/${subChildDir.name}`,
                        group: groupName,
                        subgroup: subgroupName,
                        handle: subChildDir,
                      });
                    }
                  }
                }
              }
            }
          }
        }
      }
    } catch (err) {
      console.error("Error listing widget directories:", err);
    }
    return results;
  }

  private async checkEntryHasFile(
    dir: FileSystemDirectoryHandle,
    filename: string,
  ): Promise<boolean> {
    if (!dir || typeof dir.getFileHandle !== "function") return false;
    try {
      await dir.getFileHandle(filename);
      return true;
    } catch {
      return false;
    }
  }

  private async getDirectoryChildren(
    dir: FileSystemDirectoryHandle,
  ): Promise<FileSystemDirectoryHandle[]> {
    if (!dir || typeof (dir as any).values !== "function") return [];
    const children: FileSystemDirectoryHandle[] = [];
    try {
      for await (const item of (dir as any).values()) {
        if (item.kind === "directory") {
          children.push(item as FileSystemDirectoryHandle);
        }
      }
    } catch {
      // Ignored
    }
    return children;
  }

  private async resolveWidgetDirectory(
    baseHandle: FileSystemDirectoryHandle,
    relativePath: string,
    create: boolean = false,
  ): Promise<FileSystemDirectoryHandle> {
    if (!relativePath) return baseHandle;
    const segments = relativePath.split(/[\/\\]/).filter((s) => s.length > 0);
    let current = baseHandle;
    for (const segment of segments) {
      current = create
        ? await current.getDirectoryHandle(segment, { create: true })
        : await current.getDirectoryHandle(segment);
    }
    return current;
  }

  async getWidgetFile(widgetPath: string, filename: string): Promise<string> {
    if (this.serverCustomWidgetPath) {
      return await this.serverFileSystem.getWidgetFile(widgetPath, filename);
    }

    const handle = await this.getCustomWidgetDirectoryHandle();
    if (!handle) throw new Error("No custom widget directory configured");

    const permission = await this.verifyPermission(handle, false);
    if (!permission) throw new Error("Permission denied");

    const widgetDir = await this.resolveWidgetDirectory(
      handle,
      widgetPath,
      false,
    );
    const fileHandle = await widgetDir.getFileHandle(filename);
    const file = await fileHandle.getFile();
    return file.text();
  }

  async hasWidgetFile(widgetPath: string, filename: string): Promise<boolean> {
    if (this.serverCustomWidgetPath) {
      try {
        const content = await this.serverFileSystem.getWidgetFile(
          widgetPath,
          filename,
        );
        return content !== undefined && content !== null;
      } catch {
        return false;
      }
    }

    const handle = await this.getCustomWidgetDirectoryHandle();
    if (!handle) return false;

    const permission = await this.verifyPermission(handle, false);
    if (!permission) return false;

    try {
      const widgetDir = await this.resolveWidgetDirectory(
        handle,
        widgetPath,
        false,
      );
      await widgetDir.getFileHandle(filename);
      return true;
    } catch {
      return false;
    }
  }

  async writeWidgetFile(
    widgetPath: string,
    filename: string,
    content: string,
  ): Promise<void> {
    if (this.serverCustomWidgetPath) {
      const ok = await this.serverFileSystem.writeWidgetFile(
        widgetPath,
        filename,
        content,
      );
      if (!ok) {
        throw new Error(`Failed to write widget file ${filename} to server`);
      }
      return;
    }

    const handle = await this.getCustomWidgetDirectoryHandle();
    if (!handle) throw new Error("No custom widget directory configured");

    const permission = await this.verifyPermission(handle, true);
    if (!permission) throw new Error("Permission denied");

    const targetDir = widgetPath
      ? await this.resolveWidgetDirectory(handle, widgetPath, true)
      : handle;
    const fileHandle = await targetDir.getFileHandle(filename, {
      create: true,
    });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  }

  async deleteWidgetDirectory(
    directoryName: string,
    recursive: boolean = true,
  ): Promise<void> {
    if (this.serverCustomWidgetPath) {
      await this.serverFileSystem.deleteWidgetDir(directoryName);
      return;
    }

    const handle = await this.getCustomWidgetDirectoryHandle();
    if (!handle) return;

    const permission = await this.verifyPermission(handle, true);
    if (!permission) return;

    try {
      const segments = directoryName.split("/").filter((s) => s.length > 0);
      if (segments.length === 0) return;

      const targetFolderName = segments.pop()!;
      let parentDir = handle;
      for (const segment of segments) {
        parentDir = await parentDir.getDirectoryHandle(segment);
      }
      await parentDir.removeEntry(targetFolderName, { recursive });
    } catch (err: any) {
      if (err.name !== "NotFoundError") {
        console.error(`Error deleting widget directory ${directoryName}:`, err);
      }
    }
  }

  async hasCustomFiles(
    filename?: string,
    subfolder?: string,
  ): Promise<boolean> {
    if (this.serverCustomUiPath) {
      const res = await this.serverFileSystem.hasCustomFiles(
        filename,
        subfolder,
      );
      return res.exists;
    }

    const handle = await this.getCustomDirectoryHandle();
    if (!handle) return false;

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
    if (this.serverCustomUiPath) {
      return await this.serverFileSystem.getCustomFile(filename, subfolder);
    }

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
    if (this.serverCustomUiPath) {
      await this.serverFileSystem.appendCustomUiFile(
        filename,
        content,
        subfolder,
      );
      return;
    }

    const handle = await this.getCustomDirectoryHandle();
    if (!handle) return;

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

      const file = await fileHandle.getFile();
      await writable.seek(file.size);

      await writable.write(content);
      await writable.close();
    } catch (err) {
      console.error(`Error appending to file ${filename}:`, err);
    }
  }

  async deleteFile(filename: string, subfolder?: string): Promise<void> {
    if (this.serverCustomUiPath) {
      await this.serverFileSystem.deleteCustomUiFile(filename, subfolder);
      return;
    }

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
