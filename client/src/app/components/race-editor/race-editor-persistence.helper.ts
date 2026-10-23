import { Location } from "@angular/common";
import { ChangeDetectorRef } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Subscription } from "rxjs";
import { UndoManager } from "@app/components/shared/undo-redo-controls/undo-manager";
import { DataService } from "@app/data.service";
import { Theme } from "@app/models/theme";
import { Track } from "@app/models/track";
import { LoggerService } from "@app/services/logger.service";
import { NavigationService } from "@app/services/navigation.service";
import { TranslationService } from "@app/services/translation.service";
import { deepCopy } from "@app/utils/clone.utils";
import { EditorLifecycleHelper } from "@app/utils/editor-lifecycle.helper";
import {
  getNextSelectionAfterDelete,
  isEntityNameUnique,
} from "@app/utils/editor-utils";

import { RaceEditorNormalizationHelper } from "./race-editor-normalization.helper";

export interface RacePersistenceHost {
  editingRace: any;
  selectedRace: any;
  selectedRaceId?: string;
  originalRace: any;
  allRaces: any[];
  races: any[];
  tracks: Track[];
  themes: Theme[];
  isEditMode: boolean;
  isPreservingEditModeOnNavigation: boolean;
  transitionToReadOnlyOnSave: boolean;
  isSaving: boolean;
  isAutoSaving: boolean;
  isLoading: boolean;
  driverCount: number;
  defaultRaceName: string;
  navigateBackOnSave: boolean;
  subscriptions: Subscription[];
  undoManager: UndoManager<any>;
  lifecycle: EditorLifecycleHelper;
  dataService: DataService;
  navigationService: NavigationService;
  translationService: TranslationService;
  logger: LoggerService;
  router: Router;
  route: ActivatedRoute;
  location: Location;
  cdr: ChangeDetectorRef;
  isNavigationApproved: boolean;
  showDeleteConfirm: boolean;
  isRotationInvalid: boolean;
  updateRaceSelectItems(): void;
  loadHeats(): void;
  selectRace(race: any): void;
  syncSelectedCustomRotationAsset(): void;
  syncSequenceTextFromModel(): void;
  focusNameInput(): void;
  onBack(): void;
  showError(title: string, message: string): void;
  isDirtyState(): boolean;
  getDefaultThemeId(): string;
  enforceFuelRules(): void;
  syncHeatPositionPoints(): void;
  isNameDuplicate(): boolean;
}

export class RaceEditorPersistenceHelper {
  static selectRace(host: RacePersistenceHost, race: any): void {
    host.selectedRace = race;
    host.selectedRaceId = race.entity_id;
    host.editingRace = RaceEditorNormalizationHelper.normalizeRace(
      race,
      host.themes,
    );
    host.originalRace = deepCopy(host.editingRace);
    host.undoManager.initialize(host.editingRace);
    host.enforceFuelRules();
    host.syncHeatPositionPoints();
    host.syncSelectedCustomRotationAsset();
    if (host.driverCount > 0) {
      host.loadHeats();
    }
    host.syncSequenceTextFromModel();
    if (host.isPreservingEditModeOnNavigation) {
      host.isPreservingEditModeOnNavigation = false;
      host.isEditMode = true;
      host.defaultRaceName = host.editingRace.name;
      host.focusNameInput();
    } else {
      host.isEditMode = false;
    }
    host.cdr.detectChanges();
  }

  static isNameDuplicate(editingRace: any, races: any[]): boolean {
    if (!editingRace?.name) {
      return false;
    }
    return !isEntityNameUnique(
      editingRace.name,
      editingRace.entity_id,
      races,
      true,
    );
  }

  static generateUniqueName(
    baseName: string,
    allRaces: any[],
    forceSuffix: boolean = false,
  ): string {
    const pattern = /(_\d+)$/;
    const base = (baseName || "").replace(pattern, "").trim();

    let counter = forceSuffix ? 1 : 0;
    while (true) {
      const candidate = counter === 0 ? base : `${base}_${counter}`;
      const exists = (allRaces || []).some(
        (r) =>
          (r.name || "").trim().toLowerCase() ===
          candidate.trim().toLowerCase(),
      );
      if (!exists && candidate.trim() !== "") {
        return candidate;
      }
      counter++;
    }
  }

  static canSaveAsNew(editingRace: any): boolean {
    if (!editingRace?.name || !editingRace?.theme_id) {
      return false;
    }
    return true;
  }

  static canUpdate(host: RacePersistenceHost): boolean {
    if (!host.isDirtyState()) {
      return false;
    }
    return (
      !host.isNameDuplicate() &&
      !host.isRotationInvalid &&
      !!host.editingRace?.theme_id
    );
  }

  static getUpdateTooltip(host: RacePersistenceHost): string {
    if (!host.isDirtyState()) {
      return "RE_TOOLTIP_NO_CHANGES";
    }
    if (host.isNameDuplicate()) {
      return "RE_TOOLTIP_NAME_EXISTS";
    }
    if (host.isRotationInvalid) {
      return host.editingRace.heat_rotation_type === "Custom"
        ? "RE_TOOLTIP_INVALID_CUSTOM_ROTATION"
        : "RE_TOOLTIP_INVALID_ROTATION";
    }
    return "";
  }

  static startNewRace(host: RacePersistenceHost): void {
    host.isSaving = true;
    const trackId = host.tracks.length > 0 ? host.tracks[0].entity_id : "";
    const themeId = host.getDefaultThemeId();
    const payload = RaceEditorNormalizationHelper.createDefaultRaceTemplate(
      trackId,
      themeId,
    );
    const defaultName =
      host.translationService.translate("RM_DEFAULT_RACE_NAME") || "New Race";
    payload.name = this.generateUniqueName(defaultName, host.allRaces, false);
    delete payload.entity_id;
    delete payload.id;
    delete payload._id;

    host.subscriptions.push(
      host.dataService.createRace(payload).subscribe({
        next: (created) => {
          host.isSaving = false;
          host.isEditMode = true;
          host.isPreservingEditModeOnNavigation = true;
          const savedRace = {
            ...payload,
            ...created,
            entity_id: created?.entity_id || payload?.entity_id,
          };
          host.navigationService.setLastEditedId("race", savedRace.entity_id);
          host.editingRace = savedRace;
          host.originalRace = deepCopy(savedRace);
          host.selectedRace = savedRace;
          host.selectedRaceId = savedRace.entity_id;
          host.defaultRaceName = savedRace.name;
          host.undoManager.resetTracking(host.editingRace);
          host.syncSelectedCustomRotationAsset();
          host.syncSequenceTextFromModel();
          host.loadHeats();

          const idx = host.allRaces.findIndex(
            (r) => r.entity_id === created.entity_id,
          );
          if (idx >= 0) {
            host.allRaces[idx] = deepCopy(created);
          } else {
            host.allRaces.push(deepCopy(created));
          }
          host.updateRaceSelectItems();
          host.cdr.detectChanges();
          host.focusNameInput();

          host.router.navigate([], {
            queryParams: {
              id: created.entity_id,
              driverCount: host.driverCount,
            },
            queryParamsHandling: "merge",
            replaceUrl: true,
          });
        },
        error: (error: any) => {
          host.logger.error("Failed to create new race", error);
          host.isSaving = false;
          host.cdr.detectChanges();
        },
      }),
    );
  }

  static deleteRace(host: RacePersistenceHost): void {
    if (!host.editingRace || host.editingRace.entity_id === "new") return;
    host.showDeleteConfirm = true;
  }

  static onConfirmDelete(host: RacePersistenceHost): void {
    host.showDeleteConfirm = false;
    if (!host.editingRace || host.editingRace.entity_id === "new") return;
    host.isSaving = true;
    const idToDelete = host.editingRace.entity_id;
    host.dataService.deleteRace(idToDelete).subscribe({
      next: () => {
        host.isSaving = false;
        host.isEditMode = false;
        const nextRace = getNextSelectionAfterDelete(host.allRaces, idToDelete);
        host.allRaces = host.allRaces.filter((r) => r.entity_id !== idToDelete);
        host.updateRaceSelectItems();
        if (nextRace) {
          host.selectRace(nextRace);
          host.router.navigate([], {
            relativeTo: host.route,
            queryParams: { id: nextRace.entity_id },
            queryParamsHandling: "merge",
            replaceUrl: true,
          });
        } else {
          this.startNewRace(host);
        }
        host.cdr.detectChanges();
      },
      error: (err) => {
        host.logger.error("Failed to delete race", err);
        host.isSaving = false;
        host.cdr.detectChanges();
      },
    });
  }

  static autoSaveRace(host: RacePersistenceHost): Promise<any> {
    if (!host.editingRace) return Promise.resolve();
    if (!host.editingRace.name?.trim() || host.isNameDuplicate())
      return Promise.resolve();
    if (host.isRotationInvalid) return Promise.resolve();
    return host.lifecycle.scheduleAutoSave(() => this.updateRace(host, true));
  }

  static updateRace(
    host: RacePersistenceHost,
    isAutoSave: boolean = false,
  ): Promise<any> {
    if (!host.editingRace || host.isSaving) return Promise.resolve();
    const wasNew = host.editingRace.entity_id === "new";
    if (!wasNew && !host.isDirtyState()) return Promise.resolve();

    if (!host.editingRace.name?.trim()) {
      if (!isAutoSave) {
        alert(host.translationService.translate("RE_ERROR_NAME_REQUIRED"));
      }
      return Promise.resolve();
    }
    if (host.isNameDuplicate()) {
      if (!isAutoSave) {
        alert(host.translationService.translate("RE_ERROR_NAME_EXISTS"));
      }
      return Promise.resolve();
    }

    host.isSaving = true;
    host.isAutoSaving = isAutoSave;
    return this.saveRaceData(host, wasNew, isAutoSave);
  }

  static saveRaceData(
    host: RacePersistenceHost,
    wasNew: boolean,
    isAutoSave: boolean,
  ): Promise<any> {
    const payload = RaceEditorNormalizationHelper.buildRacePayload(
      host.editingRace,
    );
    host.logger.debug("Updating race with payload:", payload);

    const obs = wasNew
      ? host.dataService.createRace(payload)
      : host.dataService.updateRace(host.editingRace.entity_id, payload);

    return new Promise((resolve, reject) => {
      host.subscriptions.push(
        obs.subscribe({
          next: (result) => {
            this.handleSaveSuccess(host, result, wasNew, isAutoSave);
            resolve(result);
          },
          error: (err) => {
            this.handleSaveError(host, err, isAutoSave);
            reject(err);
          },
        }),
      );
    });
  }

  static handleSaveSuccess(
    host: RacePersistenceHost,
    result: any,
    wasNew: boolean,
    isAutoSave: boolean,
  ): void {
    host.isSaving = false;
    host.isAutoSaving = false;
    const savedEntityId = result?.entity_id || host.editingRace.entity_id;
    host.navigationService.setLastEditedId("race", savedEntityId);

    if (wasNew && result?.entity_id) {
      host.editingRace.entity_id = result.entity_id;
    }

    if (wasNew) {
      host.isEditMode = true;
      host.isPreservingEditModeOnNavigation = true;
      host.defaultRaceName = host.editingRace.name;
    } else if (!isAutoSave || host.transitionToReadOnlyOnSave) {
      host.isEditMode = false;
      host.transitionToReadOnlyOnSave = false;
    }

    host.originalRace = deepCopy(host.editingRace);
    host.undoManager.resetTracking(host.editingRace);
    host.selectedRace = deepCopy(host.editingRace);
    host.selectedRaceId = host.editingRace.entity_id;

    const idx = host.allRaces.findIndex(
      (r) => r.entity_id === host.editingRace.entity_id,
    );
    if (idx >= 0) {
      host.allRaces[idx] = deepCopy(host.editingRace);
    } else {
      host.allRaces.push(deepCopy(host.editingRace));
    }
    host.updateRaceSelectItems();
    host.cdr.detectChanges();
    if (wasNew) {
      host.focusNameInput();
    }

    if (host.navigateBackOnSave) {
      host.onBack();
    } else if (wasNew) {
      this.handleNewRaceNavigation(host, savedEntityId, isAutoSave);
    }
  }

  static handleNewRaceNavigation(
    host: RacePersistenceHost,
    entityId: string,
    isAutoSave: boolean,
  ): void {
    if (isAutoSave) {
      const url = host.router.serializeUrl(
        host.router.createUrlTree([], {
          queryParams: {
            id: entityId,
            driverCount: host.driverCount,
            from: host.route.snapshot.queryParamMap.get("from"),
            returnUrl: host.route.snapshot.queryParamMap.get("returnUrl"),
          },
        }),
      );
      host.location.replaceState(url);
    } else {
      host.router.navigate([], {
        relativeTo: host.route,
        queryParams: { id: entityId, driverCount: host.driverCount },
        queryParamsHandling: "merge",
        replaceUrl: true,
      });
    }
  }

  static handleSaveError(
    host: RacePersistenceHost,
    error: any,
    isAutoSave: boolean,
  ): void {
    host.logger.error("Failed to save race", error);
    if (!isAutoSave) {
      host.showError(
        "Error Saving Race",
        error.error || error.message || "Unknown error",
      );
    }
    host.isSaving = false;
    host.isAutoSaving = false;
    this.loadRaces(host);
    host.cdr.detectChanges();
  }

  static saveAsNew(host: RacePersistenceHost): void {
    if (!host.editingRace || !this.canSaveAsNew(host.editingRace)) return;

    host.isSaving = true;
    const newName = this.generateUniqueName(
      host.editingRace.name,
      host.allRaces,
      true,
    );
    const payload = RaceEditorNormalizationHelper.buildRacePayload(
      host.editingRace,
    );
    payload.name = newName;
    delete payload.entity_id;
    delete payload.id;
    delete payload._id;

    host.defaultRaceName = newName;
    host.focusNameInput();

    host.subscriptions.push(
      host.dataService.createRace(payload).subscribe({
        next: (created) => {
          host.isSaving = false;
          host.isEditMode = true;
          host.isPreservingEditModeOnNavigation = true;
          host.navigationService.setLastEditedId("race", created.entity_id);
          host.editingRace = created;
          host.originalRace = deepCopy(created);
          host.selectedRace = created;
          host.selectedRaceId = created.entity_id;
          host.defaultRaceName = created.name;
          host.undoManager.resetTracking(host.editingRace);
          host.loadHeats();
          const idx = host.allRaces.findIndex(
            (r) => r.entity_id === created.entity_id,
          );
          if (idx >= 0) {
            host.allRaces[idx] = deepCopy(created);
          } else {
            host.allRaces.push(deepCopy(created));
          }
          host.updateRaceSelectItems();
          host.cdr.detectChanges();
          host.focusNameInput();
          host.router.navigate([], {
            queryParams: {
              id: created.entity_id,
              driverCount: host.driverCount,
            },
            queryParamsHandling: "merge",
            replaceUrl: true,
          });
        },
        error: (error: any) => {
          host.logger.error("Failed to save as new race", error);
          host.showError(
            "Error Saving Race",
            error.error || error.message || "Unknown error",
          );
          host.isSaving = false;
          this.loadRaces(host);
          host.cdr.detectChanges();
        },
      }),
    );
  }

  static loadRaces(host: RacePersistenceHost): void {
    host.dataService.getRaces().subscribe({
      next: (races) => {
        host.allRaces = deepCopy(races || []);
        host.updateRaceSelectItems();
        if (
          host.editingRace?.entity_id &&
          host.editingRace.entity_id !== "new"
        ) {
          const found = host.allRaces.find(
            (r) => r.entity_id === host.editingRace.entity_id,
          );
          if (found) {
            host.selectedRace = found;
            host.selectedRaceId = found.entity_id;
          }
        }
      },
      error: (error: any) => {
        host.logger.error("Failed to load races", error);
        host.allRaces = [];
        host.updateRaceSelectItems();
      },
    });
  }

  static loadRace(host: RacePersistenceHost, id: string): void {
    host.isNavigationApproved = false;
    host.isLoading = true;
    host.dataService.getRaces().subscribe({
      next: (races) => {
        host.allRaces = deepCopy(races || []);
        host.updateRaceSelectItems();
        const race = races.find((r: any) => r.entity_id === id);
        if (race) {
          host.selectRace(race);
        } else if (races.length > 0) {
          host.selectRace(races[0]);
        } else {
          this.startNewRace(host);
          return;
        }
        const isNew = host.route.snapshot.queryParamMap.get("isNew") === "true";
        if (isNew) {
          host.isEditMode = true;
          host.defaultRaceName = host.editingRace.name;
          host.focusNameInput();
        }
        host.isLoading = false;
        setTimeout(() => host.cdr.detectChanges(), 0);
      },
      error: (error: any) => {
        host.logger.error("Failed to load race", error);
        host.isLoading = false;
        host.cdr.detectChanges();
      },
    });
  }
}
