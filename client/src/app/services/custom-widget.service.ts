import { HttpClient } from "@angular/common/http";
import { Injectable, Type } from "@angular/core";
import { BehaviorSubject, firstValueFrom } from "rxjs";
import { CustomWidgetBaseComponent } from "@app/components/shared/custom-widget-base/custom-widget-base.component";
import { WIDGET_REGISTRY } from "@app/components/ui-editor/widget-registry";
import {
  CustomWidgetDefinition,
  CustomWidgetManifest,
} from "@app/models/custom-widget.model";

import { DynamicComponentService } from "./dynamic-component.service";
import { DiscoveredWidgetDir, FileSystemService } from "./file-system.service";
import { LoggerService } from "./logger.service";

export const STARTER_WIDGET_FOLDERS = [
  "sample-telemetry-gauge",
  "sample-lap-delta",
  "sample-sponsor-banner",
  "sample-detailed-leaderboard",
];

@Injectable({
  providedIn: "root",
})
export class CustomWidgetService {
  private customWidgetsSubject = new BehaviorSubject<CustomWidgetDefinition[]>(
    [],
  );
  public customWidgets$ = this.customWidgetsSubject.asObservable();

  private widgetDefinitions = new Map<string, CustomWidgetDefinition>();

  constructor(
    private fileSystem: FileSystemService,
    private dynamicComponentService: DynamicComponentService,
    private logger: LoggerService,
    private http: HttpClient,
  ) {
    this.reloadCustomWidgets().catch((err) => {
      this.logger.error(
        "CustomWidgetService: Error in auto-initialization",
        err,
      );
    });
  }

  async initialize(): Promise<void> {
    await this.reloadCustomWidgets();
  }

  isCustomWidget(widgetType: string | undefined): boolean {
    if (!widgetType) return false;
    return widgetType.startsWith("custom:");
  }

  getCustomWidgets(): CustomWidgetDefinition[] {
    return Array.from(this.widgetDefinitions.values());
  }

  getWidgetDefinition(
    widgetType: string | undefined,
  ): CustomWidgetDefinition | undefined {
    if (!widgetType) return undefined;
    const key = widgetType.startsWith("custom:")
      ? widgetType
      : `custom:${widgetType}`;
    return this.widgetDefinitions.get(key);
  }

  getWidgetComponent(widgetType: string | undefined): Type<any> | undefined {
    const def = this.getWidgetDefinition(widgetType);
    return def?.componentType;
  }

  async reloadCustomWidgets(): Promise<void> {
    const handle = await this.fileSystem.getCustomWidgetDirectoryHandle();
    if (!handle) {
      this.clearCustomWidgets();
      return;
    }

    const directories = await this.fileSystem.getCustomWidgetDirectories();
    const newDefinitions = new Map<string, CustomWidgetDefinition>();

    for (const dir of directories) {
      try {
        const loaded = await this.loadSingleWidget(dir);
        if (loaded) {
          newDefinitions.set(loaded.key, loaded.def);
          this.registerInWidgetRegistry(loaded.key, loaded.def.manifest);
        }
      } catch (err: any) {
        this.logger.error(
          `Error loading custom widget directory ${dir.name}:`,
          err,
        );
      }
    }

    this.widgetDefinitions = newDefinitions;
    this.customWidgetsSubject.next(Array.from(newDefinitions.values()));
  }

  private async loadSingleWidget(
    dir: DiscoveredWidgetDir,
  ): Promise<{ key: string; def: CustomWidgetDefinition } | null> {
    const widgetPath = dir.relativePath || dir.name;
    const hasManifest = await this.fileSystem.hasWidgetFile(
      widgetPath,
      "widget.json",
    );
    if (!hasManifest) {
      return null;
    }

    const manifestRaw = await this.fileSystem.getWidgetFile(
      widgetPath,
      "widget.json",
    );
    const manifest: CustomWidgetManifest = JSON.parse(manifestRaw);
    if (!manifest.id) {
      manifest.id = dir.name;
    }

    const { html, error: templateError } = await this.readWidgetTemplate(
      widgetPath,
      manifest.id,
    );
    const css = await this.readWidgetCss(widgetPath, manifest.id);
    const tsCode = await this.readWidgetTs(widgetPath, manifest.id);

    let componentType: Type<any> | undefined;
    let error = templateError;

    if (html !== undefined && !error) {
      try {
        componentType =
          await this.dynamicComponentService.createDynamicComponent(
            CustomWidgetBaseComponent,
            html,
            css,
            tsCode,
          );
      } catch (compErr: any) {
        this.logger.error(
          `Failed to compile custom widget ${manifest.id}:`,
          compErr,
        );
        error = compErr?.message || String(compErr);
      }
    }

    const widgetKey = `custom:${manifest.id}`;
    const def: CustomWidgetDefinition = {
      folderName: dir.name,
      relativePath: widgetPath,
      group: manifest.group || dir.group || "custom-root",
      subgroup: manifest.subgroup || dir.subgroup,
      manifest,
      componentType,
      error,
      html: html || "",
      css,
      tsCode,
    };
    return { key: widgetKey, def };
  }

  private async readWidgetTemplate(
    widgetPath: string,
    manifestId: string,
  ): Promise<{ html?: string; error?: string }> {
    if (await this.fileSystem.hasWidgetFile(widgetPath, "widget.html")) {
      return {
        html: await this.fileSystem.getWidgetFile(widgetPath, "widget.html"),
      };
    }
    if (
      await this.fileSystem.hasWidgetFile(widgetPath, "widget.component.html")
    ) {
      return {
        html: await this.fileSystem.getWidgetFile(
          widgetPath,
          "widget.component.html",
        ),
      };
    }
    const error = `Missing widget.html in widget '${widgetPath}'`;
    this.logger.error(`Custom widget ${manifestId}: ${error}`);
    return { error };
  }

  private async readWidgetCss(
    widgetPath: string,
    manifestId: string,
  ): Promise<string> {
    try {
      if (await this.fileSystem.hasWidgetFile(widgetPath, "widget.css")) {
        return await this.fileSystem.getWidgetFile(widgetPath, "widget.css");
      }
      if (
        await this.fileSystem.hasWidgetFile(widgetPath, "widget.component.css")
      ) {
        return await this.fileSystem.getWidgetFile(
          widgetPath,
          "widget.component.css",
        );
      }
    } catch (cssErr) {
      this.logger.warn(`Error reading CSS for widget ${manifestId}:`, cssErr);
    }
    return "";
  }

  private async readWidgetTs(
    widgetPath: string,
    manifestId: string,
  ): Promise<string> {
    try {
      if (await this.fileSystem.hasWidgetFile(widgetPath, "widget.ts")) {
        return await this.fileSystem.getWidgetFile(widgetPath, "widget.ts");
      }
      if (
        await this.fileSystem.hasWidgetFile(widgetPath, "widget.component.ts")
      ) {
        return await this.fileSystem.getWidgetFile(
          widgetPath,
          "widget.component.ts",
        );
      }
    } catch (tsErr) {
      this.logger.warn(
        `Error reading TypeScript for widget ${manifestId}:`,
        tsErr,
      );
    }
    return "";
  }

  private registerInWidgetRegistry(
    widgetKey: string,
    manifest: CustomWidgetManifest,
  ): void {
    WIDGET_REGISTRY[widgetKey] = {
      defaultSettings: () => {
        const defaults: Record<string, any> = {};
        if (manifest.defaultSettings) {
          Object.assign(defaults, manifest.defaultSettings);
        }
        if (manifest.settingsSchema) {
          for (const field of manifest.settingsSchema) {
            if (
              defaults[field.key] === undefined &&
              field.default !== undefined
            ) {
              defaults[field.key] = field.default;
            }
            if (
              field.colorKey &&
              defaults[field.colorKey] === undefined &&
              field.colorDefault !== undefined
            ) {
              defaults[field.colorKey] = field.colorDefault;
            }
          }
        }
        return defaults;
      },
    };
  }

  private clearCustomWidgets(): void {
    for (const key of Array.from(this.widgetDefinitions.keys())) {
      delete WIDGET_REGISTRY[key];
    }
    this.widgetDefinitions.clear();
    this.customWidgetsSubject.next([]);
  }

  async exportStarterWidgets(): Promise<{
    success: boolean;
    count: number;
    directory?: string;
    error?: string;
  }> {
    const handle = await this.fileSystem.getCustomWidgetDirectoryHandle();
    if (!handle) {
      return {
        success: false,
        count: 0,
        error: "No custom widget directory selected",
      };
    }

    let count = 0;
    try {
      // Delete existing sample folder first to ensure the new ones completely replace the previous ones
      await this.fileSystem.deleteWidgetDirectory("sample", true);

      // Clean up legacy starter widget folders that were exported directly to the root before grouping
      for (const folder of STARTER_WIDGET_FOLDERS) {
        await this.fileSystem.deleteWidgetDirectory(folder, true);
      }

      for (const folder of STARTER_WIDGET_FOLDERS) {
        const files = ["widget.json", "widget.html", "widget.css", "widget.ts"];

        for (const file of files) {
          try {
            const content = await firstValueFrom(
              this.http.get(`assets/sample-widgets/${folder}/${file}`, {
                responseType: "text",
              }),
            );
            if (content) {
              await this.fileSystem.writeWidgetFile(
                `sample/${folder}`,
                file,
                content,
              );
            }
          } catch (fileErr) {
            // Optional files like .ts or .css might not exist for some samples
            this.logger.debug(
              `Sample file ${folder}/${file} not found or skipped`,
              fileErr,
            );
          }
        }
        count++;
      }

      // Also export README.md into the sample folder
      try {
        const readmeContent = await firstValueFrom(
          this.http.get("assets/sample-widgets/README.md", {
            responseType: "text",
          }),
        );
        if (readmeContent) {
          await this.fileSystem.writeWidgetFile(
            "sample",
            "README.md",
            readmeContent,
          );
        }
      } catch (readmeErr) {
        this.logger.debug("Sample README.md not found or skipped", readmeErr);
      }

      await this.reloadCustomWidgets();
      return { success: true, count, directory: handle.name };
    } catch (err: any) {
      this.logger.error("Failed to update sample widgets", err);
      return { success: false, count, error: err?.message || String(err) };
    }
  }

  async updateSampleWidgets(): Promise<{
    success: boolean;
    count: number;
    directory?: string;
    error?: string;
  }> {
    return this.exportStarterWidgets();
  }
}
