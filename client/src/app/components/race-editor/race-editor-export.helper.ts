import { firstValueFrom } from "rxjs";
import { saveFileAs } from "@app/utils/file-download.utils";

export interface RaceExportHost {
  selectedRace: any;
  selectedRaceId?: string;
  isSaving: boolean;
  dataService: any;
  logger: any;
  cdr: any;
  showError(title: string, message: string): void;
  showAckModal: boolean;
  ackModalTitle: string;
  ackModalMessage: string;
  loadRaces(): void;
  selectRace(race: any): void;
  showConfigConflictModal: boolean;
  configConflictExistingName: string;
  configConflictSuggestedName: string;
  pendingImportFile: File | null;
}

export class RaceEditorExportHelper {
  static async exportRaceConfig(host: RaceExportHost): Promise<void> {
    if (!host.selectedRace?.entity_id) {
      return;
    }
    const raceId = host.selectedRace.entity_id;
    const raceName = (host.selectedRace.name || "Race").trim();
    const sanitized = raceName.replace(/[^a-zA-Z0-9_-]/g, "_");
    const suggestedName = `${sanitized}.rccfg.json`;

    try {
      const blob = await firstValueFrom(
        host.dataService.exportRaceConfigBlob(raceId),
      );
      await saveFileAs({
        suggestedName,
        data: blob as Blob,
        mimeType: "application/json",
        description: "Race Configuration Files",
        extension: ".json",
      });
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        host.logger.error("Failed to export race configuration", err);
        host.showError(
          "RE_EXPORT_CONFIG_ERROR_TITLE",
          "RE_EXPORT_CONFIG_ERROR_MSG",
        );
      }
    }
  }

  static triggerImport(fileInput: HTMLInputElement): void {
    if (fileInput) {
      fileInput.value = "";
      fileInput.click();
    }
  }

  static async handleFileSelected(
    host: RaceExportHost,
    event: Event,
  ): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) {
      return;
    }

    try {
      const created = await firstValueFrom(
        host.dataService.importRaceConfig(file),
      );
      host.loadRaces();
      if (created) {
        host.selectRace(created);
      }
      host.ackModalTitle = "RE_IMPORT_CONFIG_SUCCESS_TITLE";
      host.ackModalMessage = "RE_IMPORT_CONFIG_SUCCESS_MSG";
      host.showAckModal = true;
      host.cdr.detectChanges();
    } catch (err: any) {
      if (err?.status === 409 && err.error?.conflict) {
        host.pendingImportFile = file;
        host.configConflictExistingName = err.error.existing_name || "";
        host.configConflictSuggestedName = err.error.suggested_name || "";
        host.showConfigConflictModal = true;
        host.cdr.detectChanges();
        return;
      }
      host.logger.error("Failed to import race configuration", err);
      host.showError(
        "RE_IMPORT_CONFIG_ERROR_TITLE",
        err?.error?.message || err?.message || "RE_IMPORT_CONFIG_ERROR_MSG",
      );
    }
  }

  static async resolveConflict(
    host: RaceExportHost,
    resolution: "OVERWRITE" | "AUTO_RENAME" | "CANCEL",
  ): Promise<void> {
    host.showConfigConflictModal = false;
    const file = host.pendingImportFile;
    host.pendingImportFile = null;

    if (resolution === "CANCEL" || !file) {
      host.cdr.detectChanges();
      return;
    }

    try {
      const created = await firstValueFrom(
        host.dataService.importRaceConfig(file, resolution),
      );
      host.loadRaces();
      if (created) {
        host.selectRace(created);
      }
      host.ackModalTitle = "RE_IMPORT_CONFIG_SUCCESS_TITLE";
      host.ackModalMessage = "RE_IMPORT_CONFIG_SUCCESS_MSG";
      host.showAckModal = true;
      host.cdr.detectChanges();
    } catch (err: any) {
      host.logger.error("Failed to resolve import conflict", err);
      host.showError(
        "RE_IMPORT_CONFIG_ERROR_TITLE",
        err?.error?.message || err?.message || "RE_IMPORT_CONFIG_ERROR_MSG",
      );
    }
  }
}
