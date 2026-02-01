export { };

declare global {
  interface Window {
    showDirectoryPicker(): Promise<FileSystemDirectoryHandle>;
  }

  // Add missing permission descriptor if it doesn't exist
  // We can't check existence easily in d.ts, so we might need to rely on the error or use a different name if it collides.
  // The error said "Cannot find name", so this one SHOULD be fine to define.
  interface FileSystemHandlePermissionDescriptor {
    mode?: 'read' | 'readwrite';
  }

  // Augment existing FileSystemHandle
  interface FileSystemHandle {
    // These are likely existing as readonly, so we don't need to redeclare them unless we are creating a fresh type.
    // If we are augmenting, we just add missing methods.
    // kind: 'file' | 'directory'; 
    // name: string;

    // queryPermission and requestPermission seem missing from the built-in type if strict mode complained.
    queryPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
    requestPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
  }

  // Augment existing FileSystemDirectoryHandle
  interface FileSystemDirectoryHandle {
    // If these keys are missing, add them. 
    // getDirectoryHandle/getFileHandle might be there but missing options?
    // Let's assume built-in types are sparse.

    // Changing return type logic or redeclaring might cause issues if signatures differ.
    // Using loose types to avoid conflict if possible, or exact matches.

    // keys, values, entries are iterators.
    values(): AsyncIterableIterator<FileSystemHandle>;
    entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
    [Symbol.asyncIterator](): AsyncIterableIterator<[string, FileSystemHandle]>;
  }

  // FileSystemFileHandle might be fine, but createWritable was likely missing or WriteParams conflict.
  interface FileSystemFileHandle {
    createWritable(options?: { keepExistingData?: boolean }): Promise<FileSystemWritableFileStream>;
  }

  interface FileSystemWritableFileStream extends WritableStream {
    write(data: any): Promise<void>;
    seek(position: number): Promise<void>;
    truncate(size: number): Promise<void>;
  }
}
