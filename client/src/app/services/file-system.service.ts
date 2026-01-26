import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FileSystemService {
  private readonly DB_NAME = 'race-coordinator-fs';
  private readonly STORE_NAME = 'handles';
  private readonly HANDLE_KEY = 'raceday-setup-dir';
  private dbPromise: Promise<IDBDatabase>;

  constructor() {
    this.dbPromise = this.initDB();
  }

  private initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, 1);

      request.onerror = (event) => {
        console.error('IndexedDB error:', event);
        reject('IndexedDB failed to open');
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
        const transaction = db.transaction([this.STORE_NAME], 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.put(handle, this.HANDLE_KEY);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      return true;
    } catch (err) {
      console.error('Error selecting folder:', err);
      return false;
    }
  }

  async clearCustomFolder(): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.delete(this.HANDLE_KEY);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getCustomDirectoryHandle(): Promise<FileSystemDirectoryHandle | undefined> {
    const db = await this.dbPromise;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readonly');
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

  async hasCustomFiles(): Promise<boolean> {
    const handle = await this.getCustomDirectoryHandle();
    if (!handle) return false;

    // Verify permission
    const permission = await this.verifyPermission(handle, false);
    if (!permission) return false;

    try {
      // Check for required files
      await handle.getFileHandle('raceday-setup.component.html');
      return true;
    } catch {
      return false;
    }
  }

  async getCustomFile(filename: string): Promise<string> {
    const handle = await this.getCustomDirectoryHandle();
    if (!handle) throw new Error('No custom directory configured');

    const permission = await this.verifyPermission(handle, true);
    if (!permission) throw new Error('Permission denied');

    const fileHandle = await handle.getFileHandle(filename);
    const file = await fileHandle.getFile();
    return file.text();
  }

  private async verifyPermission(handle: FileSystemDirectoryHandle, readWrite: boolean): Promise<boolean> {
    const options: FileSystemHandlePermissionDescriptor = {};
    if (readWrite) {
      options.mode = 'readwrite';
    }
    if ((await handle.queryPermission(options)) === 'granted') {
      return true;
    }
    if ((await handle.requestPermission(options)) === 'granted') {
      return true;
    }
    return false;
  }
}
