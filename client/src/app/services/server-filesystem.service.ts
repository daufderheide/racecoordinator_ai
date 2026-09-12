import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { DataService } from "@app/data.service";
import { LoggerService } from "@app/services/logger.service";

export interface ServerDirectoriesResponse {
  customUiDirectory?: string;
  customWidgetDirectory?: string;
  isLocalhost: boolean;
}

export interface ChooseFolderResult {
  success: boolean;
  path?: string;
  name?: string;
  cancelled?: boolean;
  error?: string;
}

export interface DiscoveredWidgetDirServer {
  name: string;
  relativePath: string;
  group?: string;
  subgroup?: string;
}

export interface HasCustomUiFilesResponse {
  exists: boolean;
  files: string[];
}

@Injectable({
  providedIn: "root",
})
export class ServerFileSystemService {
  constructor(
    private http: HttpClient,
    private dataService: DataService,
    private logger: LoggerService,
  ) {}

  private get baseUrl(): string {
    return this.dataService?.serverUrl || "http://localhost:7070";
  }

  async getDirectories(): Promise<ServerDirectoriesResponse> {
    try {
      return await firstValueFrom(
        this.http.get<ServerDirectoriesResponse>(
          `${this.baseUrl}/api/filesystem/directories`,
        ),
      );
    } catch (err) {
      this.logger.debug("Failed to get server directories", err);
      return { isLocalhost: false };
    }
  }

  async chooseFolder(
    type: "ui" | "widgets",
    title?: string,
  ): Promise<ChooseFolderResult> {
    try {
      return await firstValueFrom(
        this.http.post<ChooseFolderResult>(
          `${this.baseUrl}/api/filesystem/choose-folder`,
          { type, title },
        ),
      );
    } catch (err: any) {
      this.logger.error("Error choosing folder on server", err);
      return {
        success: false,
        error: err?.error?.error || err?.message || "Failed to choose folder",
      };
    }
  }

  async setDirectory(
    type: "ui" | "widgets",
    path: string,
  ): Promise<ChooseFolderResult> {
    try {
      return await firstValueFrom(
        this.http.post<ChooseFolderResult>(
          `${this.baseUrl}/api/filesystem/set-directory`,
          { type, path },
        ),
      );
    } catch (err: any) {
      this.logger.error("Error setting directory on server", err);
      return {
        success: false,
        error: err?.error?.error || err?.message || "Failed to set directory",
      };
    }
  }

  async clearDirectory(type: "ui" | "widgets"): Promise<boolean> {
    try {
      await firstValueFrom(
        this.http.post(`${this.baseUrl}/api/filesystem/clear-directory`, {
          type,
        }),
      );
      return true;
    } catch (err) {
      this.logger.error("Error clearing directory on server", err);
      return false;
    }
  }

  async listWidgets(): Promise<DiscoveredWidgetDirServer[]> {
    try {
      return (
        (await firstValueFrom(
          this.http.get<DiscoveredWidgetDirServer[]>(
            `${this.baseUrl}/api/filesystem/widgets/list`,
          ),
        )) || []
      );
    } catch (err) {
      this.logger.debug("Failed to list widgets from server", err);
      return [];
    }
  }

  async getWidgetFile(path: string, file: string): Promise<string> {
    const url = `${this.baseUrl}/api/filesystem/widgets/file?path=${encodeURIComponent(
      path || "",
    )}&file=${encodeURIComponent(file)}`;
    return firstValueFrom(this.http.get(url, { responseType: "text" }));
  }

  async writeWidgetFile(
    path: string,
    file: string,
    content: string,
  ): Promise<boolean> {
    try {
      await firstValueFrom(
        this.http.post(`${this.baseUrl}/api/filesystem/widgets/write-file`, {
          path,
          file,
          content,
        }),
      );
      return true;
    } catch (err) {
      this.logger.error("Error writing widget file to server", err);
      return false;
    }
  }

  async deleteWidgetDir(path: string): Promise<boolean> {
    try {
      await firstValueFrom(
        this.http.post(`${this.baseUrl}/api/filesystem/widgets/delete-dir`, {
          path,
        }),
      );
      return true;
    } catch (err) {
      this.logger.error("Error deleting widget directory on server", err);
      return false;
    }
  }

  async hasCustomFiles(
    filename?: string,
    subfolder?: string,
  ): Promise<HasCustomUiFilesResponse> {
    try {
      const params = new URLSearchParams();
      if (filename) params.set("filename", filename);
      if (subfolder) params.set("subfolder", subfolder);
      const query = params.toString() ? `?${params.toString()}` : "";
      return await firstValueFrom(
        this.http.get<HasCustomUiFilesResponse>(
          `${this.baseUrl}/api/filesystem/custom-ui/has-files${query}`,
        ),
      );
    } catch (err) {
      this.logger.debug("Failed to check custom UI files on server", err);
      return { exists: false, files: [] };
    }
  }

  async getCustomFile(filename: string, subfolder?: string): Promise<string> {
    const params = new URLSearchParams();
    params.set("filename", filename);
    if (subfolder) params.set("subfolder", subfolder);
    const url = `${this.baseUrl}/api/filesystem/custom-ui/file?${params.toString()}`;
    return firstValueFrom(this.http.get(url, { responseType: "text" }));
  }

  async appendCustomUiFile(
    filename: string,
    content: string,
    subfolder?: string,
  ): Promise<boolean> {
    try {
      await firstValueFrom(
        this.http.post(`${this.baseUrl}/api/filesystem/custom-ui/append-file`, {
          filename,
          content,
          subfolder,
        }),
      );
      return true;
    } catch (err) {
      this.logger.error("Error appending custom UI file on server", err);
      return false;
    }
  }

  async deleteCustomUiFile(
    filename: string,
    subfolder?: string,
  ): Promise<boolean> {
    try {
      await firstValueFrom(
        this.http.post(`${this.baseUrl}/api/filesystem/custom-ui/delete-file`, {
          filename,
          subfolder,
        }),
      );
      return true;
    } catch (err) {
      this.logger.error("Error deleting custom UI file on server", err);
      return false;
    }
  }
}
