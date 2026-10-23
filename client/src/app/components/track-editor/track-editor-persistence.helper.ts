import { Location } from "@angular/common";
import { ChangeDetectorRef } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Subscription } from "rxjs";
import { UndoManager } from "@app/components/shared/undo-redo-controls/undo-manager";
import { TrackEditorCrudHelper } from "@app/components/track-editor/track-editor-crud.helper";
import { TrackStateHelper } from "@app/components/track-editor/track-state.helper";
import { DataService } from "@app/data.service";
import { Lane } from "@app/models/lane";
import {
  ArduinoConfig,
  BartConfig,
  PhidgetConfig,
  Track,
  TrackmateConfig,
} from "@app/models/track";
import { LoggerService } from "@app/services/logger.service";
import { NavigationService } from "@app/services/navigation.service";
import { TranslationService } from "@app/services/translation.service";
import { getNextSelectionAfterDelete } from "@app/utils/editor-utils";

export interface TrackPersistenceHost {
  editingTrack?: Track;
  selectedTrack?: Track;
  selectedTrackId?: string;
  originalTrack: Track | null;
  allTracks: Track[];
  trackName: string;
  defaultTrackName: string;
  numTrackSections: number;
  trackScale: number;
  lanes: Lane[];
  arduinoConfigs: ArduinoConfig[];
  trackmateConfigs: TrackmateConfig[];
  phidgetConfigs: PhidgetConfig[];
  bartConfigs: BartConfig[];
  isEditMode: boolean;
  isPreservingEditModeOnNavigation: boolean;
  transitionToReadOnlyOnSave: boolean;
  isSaving: boolean;
  isAutoSaving: boolean;
  isDirty: boolean;
  isLoading: boolean;
  navigateBackOnSave: boolean;
  isDestroyed: boolean;
  subscriptions: Subscription[];
  undoManager: UndoManager<Track>;
  dataService: DataService;
  navigationService: NavigationService;
  translationService: TranslationService;
  logger: LoggerService;
  router: Router;
  route: ActivatedRoute;
  location: Location;
  cdr: ChangeDetectorRef;
  isNavigationApproved: boolean;
  isReverting: boolean;
  isSwitchingSelection: boolean;
  updateTrackSelectItems(): void;
  createSnapshot(): Track;
  cloneTrack(track: Track): Track;
  focusNameInput(): void;
  onBack(): void;
  isDirtyState(): boolean;
  hasChanges(): boolean;
  confirmDiscard(): Promise<boolean>;
  loadData(): void;
  autoSaveTrack(): Promise<any>;
  applyTrackToState(track: Track): void;
  selectTrack(track: Track): void;
  startNewTrack(): void;
  updateHelpSteps(): void;
}

export class TrackEditorPersistenceHelper {
  static saveTrackData(
    host: TrackPersistenceHost,
    isSaveAsNew: boolean,
    isAutoSave: boolean,
  ): Promise<any> {
    const finalTrack = host.createSnapshot();
    const wasNew = isSaveAsNew || finalTrack.entity_id === "new";
    const payload = TrackEditorCrudHelper.buildTrackSavePayload(finalTrack);

    const obs = wasNew
      ? host.dataService.createTrack({ ...payload, entity_id: "new" })
      : host.dataService.updateTrack(payload.entity_id, payload);

    return new Promise((resolve, reject) => {
      host.subscriptions.push(
        obs.subscribe({
          next: (result) => {
            const merged = {
              ...payload,
              ...result,
              entity_id: result?.entity_id || payload?.entity_id,
            };
            TrackEditorPersistenceHelper.handleSaveSuccess(
              host,
              merged,
              wasNew,
              isAutoSave,
            );
            resolve(merged);
          },
          error: (err) => {
            TrackEditorPersistenceHelper.handleSaveError(host, err, isAutoSave);
            reject(err);
          },
        }),
      );
    });
  }

  static handleSaveSuccess(
    host: TrackPersistenceHost,
    result: any,
    wasNew: boolean,
    isAutoSave: boolean,
  ): void {
    host.isSaving = false;
    host.isAutoSaving = false;
    if (wasNew) {
      host.isEditMode = true;
      host.isPreservingEditModeOnNavigation = true;
      host.defaultTrackName = result.name;
      host.trackName = result.name;
    } else if (!isAutoSave || host.transitionToReadOnlyOnSave) {
      host.isEditMode = false;
      host.transitionToReadOnlyOnSave = false;
    }
    host.navigationService.setLastEditedId("track", result.entity_id);

    host.editingTrack = new Track({
      entity_id: result.entity_id,
      name: result.name,
      num_track_sections: result.num_track_sections ?? 100,
      track_scale: result.track_scale ?? host.trackScale ?? 1.0,
      lanes: result.lanes || host.lanes || [],
      has_digital_fuel: result.has_digital_fuel ?? false,
      arduino_configs: result.arduino_configs || host.arduinoConfigs,
      has_per_lane_relays: result.has_per_lane_relays ?? false,
      has_main_relay: result.has_main_relay ?? false,
      trackmate_configs: result.trackmate_configs || host.trackmateConfigs,
      phidget_configs: result.phidget_configs || host.phidgetConfigs,
      bart_configs: result.bart_configs || host.bartConfigs,
    });

    host.selectedTrack = host.cloneTrack(host.editingTrack);
    host.originalTrack = host.cloneTrack(host.editingTrack);
    host.selectedTrackId = host.editingTrack.entity_id;
    host.isDirty = false;

    const idx = host.allTracks.findIndex(
      (t) => t.entity_id === result.entity_id,
    );
    if (idx >= 0) {
      host.allTracks[idx] = host.cloneTrack(host.editingTrack);
    } else {
      host.allTracks.push(host.cloneTrack(host.editingTrack));
    }
    host.updateTrackSelectItems();

    if (!isAutoSave) {
      host.trackName = host.editingTrack.name;
    }
    TrackEditorPersistenceHelper.syncSavedConfigsWithState(host);

    if (wasNew) {
      host.undoManager.updateHistory((t) => {
        (t as any).entity_id = result.entity_id;
        (t as any).name = result.name;
        return t;
      });
    }

    if (host.editingTrack) {
      host.undoManager.resetTracking(host.createSnapshot());
    }

    if (!host.isDestroyed) {
      host.cdr.detectChanges();
    }

    if (wasNew) {
      host.focusNameInput();
    }

    if (host.navigateBackOnSave) {
      host.navigateBackOnSave = false;
      host.onBack();
    } else if (wasNew) {
      TrackEditorPersistenceHelper.handleNewTrackNavigation(
        host,
        result.entity_id,
        isAutoSave,
      );
    }

    if (host.isDirtyState()) {
      host.autoSaveTrack();
    }
  }

  static syncSavedConfigsWithState(host: TrackPersistenceHost): void {
    if (!host.editingTrack || !host.editingTrack.lanes) return;
    const newLanesJson = JSON.stringify(host.editingTrack.lanes);
    if (newLanesJson !== JSON.stringify(host.lanes)) {
      host.lanes = host.editingTrack.lanes.map(
        (l) =>
          new Lane(
            l.entity_id,
            l.foreground_color,
            l.background_color,
            l.length,
          ),
      );
    }
    const synced = TrackStateHelper.syncInterfaceConfigsFromTrack(
      host.editingTrack,
      {
        arduinoConfigs: host.arduinoConfigs,
        trackmateConfigs: host.trackmateConfigs,
        phidgetConfigs: host.phidgetConfigs,
        bartConfigs: host.bartConfigs,
      },
    );
    host.arduinoConfigs = synced.arduinoConfigs;
    host.trackmateConfigs = synced.trackmateConfigs;
    host.phidgetConfigs = synced.phidgetConfigs;
    host.bartConfigs = synced.bartConfigs;
  }

  static handleSaveError(
    host: TrackPersistenceHost,
    err: any,
    isAutoSave: boolean,
  ): void {
    host.logger.error("Failed to save track", err);
    if (!host.isDestroyed && !isAutoSave) {
      if (err?.status === 409) {
        alert(host.translationService.translate("TE_ERROR_NAME_EXISTS"));
      } else {
        alert(host.translationService.translate("TE_ERROR_SAVE_FAILED"));
      }
    }
    host.isSaving = false;
    host.isAutoSaving = false;
  }

  static handleNewTrackNavigation(
    host: TrackPersistenceHost,
    newId: string,
    isAutoSave: boolean,
  ): void {
    if (isAutoSave) {
      const url = host.router.serializeUrl(
        host.router.createUrlTree(["/track-editor"], {
          queryParams: {
            id: newId,
            from: host.route.snapshot.queryParamMap.get("from"),
            returnUrl: host.route.snapshot.queryParamMap.get("returnUrl"),
          },
        }),
      );
      host.location.replaceState(url);
    } else {
      host.router.navigate(["/track-editor"], {
        queryParams: {
          id: newId,
          from: host.route.snapshot.queryParamMap.get("from"),
          returnUrl: host.route.snapshot.queryParamMap.get("returnUrl"),
        },
        replaceUrl: true,
      });
    }
  }

  static persistNewTrack(
    host: TrackPersistenceHost,
    trackToCreate: Track,
  ): void {
    const payload = TrackEditorCrudHelper.buildTrackSavePayload(trackToCreate);

    host.dataService.createTrack(payload).subscribe({
      next: (created) => {
        host.isLoading = false;
        const merged = {
          ...payload,
          ...created,
          entity_id: created?.entity_id || payload?.entity_id,
        };
        TrackEditorPersistenceHelper.handleSaveSuccess(
          host,
          merged,
          true,
          false,
        );
      },
      error: (err) => {
        host.logger.error("Failed to create track", err);
        host.isLoading = false;
        host.editingTrack = trackToCreate;
        host.applyTrackToState(trackToCreate);
        if (!host.isDestroyed) {
          host.cdr.detectChanges();
        }
        host.focusNameInput();
      },
    });
  }

  static deleteTrack(host: TrackPersistenceHost): void {
    if (!host.editingTrack || host.editingTrack.entity_id === "new") return;
    host.isSaving = true;
    const idToDelete = host.editingTrack.entity_id;
    host.dataService.deleteTrack(idToDelete).subscribe({
      next: () => {
        host.isSaving = false;
        host.isEditMode = false;
        const nextTrack = getNextSelectionAfterDelete(
          host.allTracks,
          idToDelete,
        );
        host.allTracks = host.allTracks.filter(
          (t) => t.entity_id !== idToDelete,
        );
        host.updateTrackSelectItems();
        if (nextTrack) {
          host.selectTrack(nextTrack);
          host.router.navigate([], {
            relativeTo: host.route,
            queryParams: { id: nextTrack.entity_id },
            queryParamsHandling: "merge",
            replaceUrl: true,
          });
        } else {
          host.startNewTrack();
        }
        host.cdr.detectChanges();
      },
      error: (err) => {
        host.logger.error("Failed to delete track", err);
        host.isSaving = false;
        host.cdr.detectChanges();
      },
    });
  }

  static loadTracksData(host: TrackPersistenceHost): void {
    host.isLoading = true;
    host.subscriptions.push(
      host.dataService.getTracks().subscribe({
        next: (tracks) => {
          host.allTracks = tracks;
          host.updateTrackSelectItems();

          const idParam = host.route.snapshot.queryParamMap.get("id");
          if (idParam === "new") {
            host.startNewTrack();
            return;
          } else if (idParam) {
            const found = host.allTracks.find((t) => t.entity_id === idParam);
            if (found) {
              host.selectTrack(found);
              host.isEditMode = false;
            } else if (host.allTracks.length > 0) {
              host.selectTrack(host.allTracks[0]);
              host.isEditMode = false;
            } else {
              host.startNewTrack();
              return;
            }
          } else {
            const lastEdited = host.navigationService.getLastEditedId("track");
            const found = lastEdited
              ? host.allTracks.find((t) => t.entity_id === lastEdited)
              : undefined;
            if (found) {
              host.selectTrack(found);
              host.isEditMode = false;
            } else if (host.allTracks.length > 0) {
              host.selectTrack(host.allTracks[0]);
              host.isEditMode = false;
            } else {
              host.startNewTrack();
              return;
            }
          }

          const isNew =
            host.route.snapshot.queryParamMap.get("isNew") === "true";
          if (
            host.isPreservingEditModeOnNavigation ||
            (isNew && host.editingTrack)
          ) {
            host.isPreservingEditModeOnNavigation = false;
            host.isEditMode = true;
            host.defaultTrackName = host.editingTrack?.name || "";
            host.trackName = host.editingTrack?.name || "";
            host.focusNameInput();
          }

          host.isLoading = false;
          host.updateHelpSteps();
          if (!host.isDestroyed) {
            host.cdr.detectChanges();
          }
        },
        error: (err) => {
          host.logger.error("Failed to load tracks", err);
          host.isLoading = false;
          if (!host.isDestroyed) {
            host.cdr.detectChanges();
          }
        },
      }),
    );
  }

  static setupRouteSubscription(
    host: TrackPersistenceHost,
  ): Subscription | null {
    if (!host.route.queryParamMap) {
      host.loadData();
      return null;
    }

    return host.route.queryParamMap.subscribe((paramMap) => {
      if (host.isReverting) {
        host.isReverting = false;
        return;
      }
      const isEditorRoute =
        !host.router.url ||
        host.router.url === "/" ||
        host.router.url.startsWith("/track-editor") ||
        host.router.url.includes("mock");
      if (!isEditorRoute) {
        return;
      }
      if (host.isSwitchingSelection) {
        host.isSwitchingSelection = false;
        return;
      }
      const nextId = paramMap.get("id");
      if (nextId && nextId !== "new") {
        host.navigationService.setLastEditedId("track", nextId);
      }
      const currentId = host.editingTrack?.entity_id;
      if (
        currentId &&
        nextId !== currentId &&
        host.hasChanges() &&
        !host.isNavigationApproved
      ) {
        host.confirmDiscard().then((confirmed) => {
          if (confirmed) {
            host.loadData();
          } else {
            host.isReverting = true;
            host.router.navigate([], {
              relativeTo: host.route,
              queryParams: {
                id: currentId,
                from: host.route.snapshot.queryParamMap.get("from"),
                returnUrl: host.route.snapshot.queryParamMap.get("returnUrl"),
              },
              queryParamsHandling: "merge",
            });
          }
        });
      } else {
        host.loadData();
      }
    });
  }
}
