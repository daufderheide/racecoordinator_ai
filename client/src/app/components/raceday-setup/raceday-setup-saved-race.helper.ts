import { forkJoin, map, Observable } from "rxjs";
import { DataService } from "@app/data.service";

export interface ISavedRace {
  filename: string;
  isDemo: boolean;
  corrupt?: boolean;
}

export function fetchSavedRaces(
  dataService: DataService,
): Observable<ISavedRace[]> {
  return forkJoin({
    normal: dataService.getSavedRaces(false),
    demo: dataService.getSavedRaces(true),
  }).pipe(
    map((result) => {
      const normalList = result.normal
        .filter(
          (f) =>
            !f.filename.startsWith("autosave_") &&
            !f.filename.toLowerCase().includes("autosave"),
        )
        .map((f) => ({
          filename: f.filename,
          isDemo: false,
          corrupt: f.corrupt,
        }));
      const demoList = result.demo
        .filter(
          (f) =>
            !f.filename.startsWith("autosave_") &&
            !f.filename.toLowerCase().includes("autosave"),
        )
        .map((f) => ({
          filename: f.filename,
          isDemo: true,
          corrupt: f.corrupt,
        }));
      return [...normalList, ...demoList];
    }),
  );
}

export function prepareInlineRename(file: ISavedRace): {
  filename: string;
  initialName: string;
} {
  let name = file.filename;
  if (name.toLowerCase().endsWith(".json")) {
    name = name.substring(0, name.length - 5);
  }
  return { filename: file.filename, initialName: name };
}

export function normalizeSaveFilename(rawName: string): string {
  let normalized = rawName.trim();
  if (!normalized.toLowerCase().endsWith(".json")) {
    normalized += ".json";
  }
  return normalized;
}

export class RacedaySetupSavedRaceHelper {
  static loadSavedRaces(host: any): void {
    host.isFileDropdownOpen = false;
    fetchSavedRaces(host.dataService).subscribe({
      next: (races) => {
        host.savedRaces = races;
        host.showLoadRaceModal = true;
        host.selectedSavedRace = null;
        host.cdr.detectChanges();
      },
      error: (err: any) => console.error("Failed to get saved races:", err),
    });
  }

  static selectSavedRace(host: any, file: ISavedRace): void {
    if (file.corrupt) return;
    host.selectedSavedRace = file;
  }

  static startInlineRename(
    host: any,
    event: MouseEvent,
    file: ISavedRace,
  ): void {
    event.stopPropagation();
    if (file.corrupt) return;
    const prep = prepareInlineRename(file);
    host.editingSaveFilename = prep.filename;
    host.editingSaveNewName = prep.initialName;
    host.cdr.detectChanges();
  }

  static saveInlineRename(host: any, file: ISavedRace): void {
    if (!host.editingSaveNewName || !host.editingSaveNewName.trim()) {
      host.cancelInlineRename();
      return;
    }
    const normalized = normalizeSaveFilename(host.editingSaveNewName);
    if (normalized === file.filename) {
      host.cancelInlineRename();
      return;
    }
    const oldFilename = file.filename;
    host.dataService
      .renameSavedRace(oldFilename, normalized, file.isDemo)
      .subscribe({
        next: () => {
          file.filename = normalized;
          host.savedRaces = [...host.savedRaces];
          if (host.selectedSavedRace?.filename === oldFilename) {
            host.selectedSavedRace = file;
          }
          host.cancelInlineRename();
        },
        error: (err: any) => {
          console.error("Failed to rename saved race:", err);
          host.errorTitle = "Error";
          host.errorMessage =
            typeof err?.error === "string" && err.error.trim()
              ? err.error
              : err?.message || "Failed to rename saved race";
          host.showErrorModal = true;
          host.cancelInlineRename();
        },
      });
  }

  static cancelInlineRename(host: any): void {
    host.editingSaveFilename = null;
    host.editingSaveNewName = "";
    host.cdr.detectChanges();
  }

  static closeLoadRaceModal(host: any): void {
    host.showLoadRaceModal = false;
    host.showDeleteSavedRaceConfirm = false;
    host.savedRaceToDelete = null;
  }

  static confirmLoadRace(host: any): void {
    if (!host.selectedSavedRace) return;
    host.dataService
      .loadRace(host.selectedSavedRace.filename, host.selectedSavedRace.isDemo)
      .subscribe({
        next: () => {
          host.closeLoadRaceModal();
          host.router.navigate(["/raceday"]);
        },
        error: (err: any) => console.error("Failed to load race:", err),
      });
  }

  static deleteSavedRace(host: any, event: MouseEvent, file: ISavedRace): void {
    event.stopPropagation();
    host.savedRaceToDelete = file;
    host.showDeleteSavedRaceConfirm = true;
  }

  static onCancelDeleteSavedRace(host: any): void {
    host.showDeleteSavedRaceConfirm = false;
    host.savedRaceToDelete = null;
  }

  static onConfirmDeleteSavedRace(host: any): void {
    host.showDeleteSavedRaceConfirm = false;
    const file = host.savedRaceToDelete;
    host.savedRaceToDelete = null;
    if (!file) return;

    host.dataService.deleteSavedRace(file.filename, file.isDemo).subscribe({
      next: () => {
        host.savedRaces = host.savedRaces.filter(
          (r: ISavedRace) => r.filename !== file.filename,
        );
        if (host.selectedSavedRace?.filename === file.filename) {
          host.selectedSavedRace = null;
        }
        host.cdr.detectChanges();
      },
      error: (err: any) => console.error("Failed to delete race:", err),
    });
  }
}
