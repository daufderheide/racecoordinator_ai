import { firstValueFrom } from "rxjs";
import { PdfExportOptions } from "@app/components/shared/pdf-export-dialog/pdf-export-dialog.component";
import { saveFileAs } from "@app/utils/file-download.utils";

export class RacedayExportHelper {
  static saveRace(host: any): void {
    if (host.isSaveDisabled) return;
    host.saveRaceName = host.race?.name || "";
    host.showSaveRaceDialog = true;
    host.cdr?.markForCheck();
  }

  static onSaveRaceConfirm(host: any, name: string): void {
    host.showSaveRaceDialog = false;
    const trimmed = typeof name === "string" ? name.trim() : "";
    host.dataService?.saveRace(trimmed || undefined).subscribe({
      next: (response: any) => {
        host.ackModalTitle =
          host.translationService?.translate("RD_SAVE_SUCCESS") ??
          "Save Success";
        host.ackModalMessage = response;
        host.showAckModal = true;
        host.cdr?.markForCheck();
      },
      error: (err: any) => {
        host.ackModalTitle =
          host.translationService?.translate("RD_SAVE_ERROR") ?? "Save Error";
        host.ackModalMessage = err.error || err.message;
        host.showAckModal = true;
        host.cdr?.markForCheck();
      },
    });
  }

  static onSaveRaceCancel(host: any): void {
    host.showSaveRaceDialog = false;
    host.cdr?.markForCheck();
  }

  static getExportTimestamp(host: any): Date {
    if (host.viewerRaceEndedHandler?.raceHasEnded) {
      const stats = (host.race as any)?.statistics;
      if (stats?.endTime) {
        return new Date(stats.endTime);
      }
    }
    return new Date();
  }

  static exportToPdf(host: any): void {
    host.defaultIncludeBackground =
      host.settingsService?.getSettings()?.exportPdfBackgrounds ?? true;
    host.showPdfExportDialog = true;
    host.cdr?.detectChanges();
  }

  static onPdfExportConfirm(host: any, options: PdfExportOptions): void {
    host.showPdfExportDialog = false;
    host.cdr?.detectChanges();
    if (options.saveAsDefault) {
      const settings = host.settingsService?.getSettings();
      if (settings) {
        settings.exportPdfBackgrounds = options.includeBackground;
        host.settingsService.saveSettings(settings);
      }
    }
    const timestamp = RacedayExportHelper.getExportTimestamp(host);
    const raceName = host.race?.name || "Race";
    host.printService?.print(
      `${raceName}-RaceDay`,
      false,
      timestamp,
      options.includeBackground,
    );
  }

  static onPdfExportCancel(host: any): void {
    host.showPdfExportDialog = false;
    host.cdr?.detectChanges();
  }

  static async exportToCsv(host: any): Promise<void> {
    try {
      const timestamp = RacedayExportHelper.getExportTimestamp(host);
      const timeStr = host.printService?.formatExportTimestamp(timestamp) ?? "";
      const raceName = host.race?.name || "Race";
      const suggestedName = `${raceName}-RaceDay${timeStr}.csv`;

      const saved = await saveFileAs({
        suggestedName,
        data: async () => {
          const csvData: string = await firstValueFrom(
            host.dataService.exportRaceToCsv(),
          );
          if (!csvData || csvData.trim().length === 0) {
            host.logger?.error("Failed to export CSV: received empty data");
            return null;
          }
          return csvData;
        },
        mimeType: "text/csv;charset=utf-8",
        description: "CSV Files",
        extension: ".csv",
      });
      if (saved) {
        host.logger?.debug("CSV Exported successfully");
      }
    } catch (err: any) {
      host.logger?.error("Failed to export CSV", err);
    }
  }

  static async exportToXls(host: any): Promise<void> {
    try {
      const timestamp = RacedayExportHelper.getExportTimestamp(host);
      const timeStr = host.printService?.formatExportTimestamp(timestamp) ?? "";
      const raceName = host.race?.name || "Race";
      const suggestedName = `${raceName}-RaceDay${timeStr}.xlsx`;

      const saved = await saveFileAs({
        suggestedName,
        data: async () => {
          const template =
            host.settingsService?.getSettings()?.customExportTemplateBase64;
          const xlsData: Blob = await firstValueFrom(
            host.dataService.exportRaceToXls(template),
          );

          if (!xlsData || xlsData.size === 0) {
            host.logger?.error("Failed to export XLS: received empty blob");
            return null;
          }
          return xlsData;
        },
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        description: "Excel Files",
        extension: ".xlsx",
      });
      if (saved) {
        host.logger?.debug("XLS Exported successfully");
      }
    } catch (err: any) {
      if (err?.error instanceof Blob) {
        try {
          const text = await err.error.text();
          host.logger?.error("Failed to export XLS:", text, err);
        } catch (_) {
          host.logger?.error("Failed to export XLS", err);
        }
      } else {
        host.logger?.error("Failed to export XLS", err);
      }
    }
  }
}
