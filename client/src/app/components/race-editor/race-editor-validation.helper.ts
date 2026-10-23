import { ChangeDetectorRef } from "@angular/core";
import { Subscription } from "rxjs";
import { UndoManager } from "@app/components/shared/undo-redo-controls/undo-manager";
import { DataService } from "@app/data.service";
import { Track } from "@app/models/track";
import {
  ConnectionMonitorService,
  ConnectionState,
} from "@app/services/connection-monitor.service";
import { LoggerService } from "@app/services/logger.service";
import { TranslationService } from "@app/services/translation.service";

export interface RaceValidationHost {
  isLoading: boolean;
  editingRace: any;
  originalRace: any;
  tracks: Track[];
  isSaving: boolean;
  showResetConfirmation: boolean;
  showResetSuccess: boolean;
  resetRaceName: string;
  undoManager: UndoManager<any>;
  dataService: DataService;
  translationService: TranslationService;
  logger: LoggerService;
  cdr: ChangeDetectorRef;
  isAdmin(): boolean;
  isNameDuplicate(): boolean;
  isRotationInvalid: boolean;
  isNameInvalid: boolean;
  isDirtyState(): boolean;
}

export interface RaceConnectionHost {
  isConnectionLost: boolean;
  isSaving: boolean;
  isAutoSaving: boolean;
  isLoading: boolean;
  cdr: ChangeDetectorRef;
  connectionSubscription: Subscription | null;
  connectionMonitor: ConnectionMonitorService;
  handleConnectionLoss(): void;
}

export class RaceEditorValidationHelper {
  static isNameInvalid(
    isLoading: boolean,
    editingRace: any,
    isNameDuplicate: () => boolean,
  ): boolean {
    if (isLoading || !editingRace) return false;
    return !editingRace.name?.trim() || isNameDuplicate();
  }

  static isRotationInvalid(editingRace: any, tracks: Track[]): boolean {
    if (!editingRace) return false;

    if (editingRace.heat_rotation_type === "CustomRoundRobin") {
      const seq = editingRace.custom_rotation_sequence;
      if (!seq || seq.length === 0) return true;

      const track = (tracks || []).find(
        (t) => t.entity_id === editingRace.track_entity_id,
      );
      const numLanes = track?.lanes?.length || 0;

      const uniqueLanes = new Set<number>();
      for (const lane of seq) {
        if (isNaN(lane)) return true;
        if (lane < 0 || (numLanes > 0 && lane > numLanes)) return true;
        if (lane > 0) {
          if (uniqueLanes.has(lane)) return true;
          uniqueLanes.add(lane);
        }
      }
      return false;
    }

    if (editingRace.heat_rotation_type === "Custom") {
      return (
        (!editingRace.custom_rotations ||
          editingRace.custom_rotations.length === 0) &&
        !editingRace.custom_rotation_asset_id
      );
    }

    return false;
  }

  static currentTrackHasPerLaneRelays(
    editingRace: any,
    tracks: Track[],
  ): boolean {
    if (!editingRace || !editingRace.track_entity_id) return false;
    const track = (tracks || []).find(
      (t) => t.entity_id === editingRace.track_entity_id,
    );
    return track ? !!track.has_per_lane_relays : false;
  }

  static isConfigValid(host: RaceValidationHost): boolean {
    return (
      !host.isNameInvalid &&
      !host.isRotationInvalid &&
      !!host.editingRace?.track_entity_id &&
      !!host.editingRace?.heat_rotation_type
    );
  }

  static isDirtyState(
    undoManager: UndoManager<any>,
    editingRace: any,
    originalRace: any,
  ): boolean {
    const umChanges = undoManager.hasChanges();
    const manualChanges =
      JSON.stringify(editingRace) !== JSON.stringify(originalRace);
    return umChanges || manualChanges;
  }

  static getUnsavedReasons(host: RaceValidationHost): string[] {
    const reasons: string[] = [];
    if (!host.editingRace) return reasons;

    const nameTrimmed = host.editingRace.name?.trim() || "";
    if (!nameTrimmed) {
      reasons.push("DISCARD_REASON_RACE_NAME_EMPTY");
    } else if (host.isNameDuplicate()) {
      reasons.push("DISCARD_REASON_RACE_NAME_DUPLICATE");
    }

    if (!host.editingRace.track_entity_id) {
      reasons.push("DISCARD_REASON_RACE_NO_TRACK");
    }
    if (!host.editingRace.heat_rotation_type) {
      reasons.push("DISCARD_REASON_RACE_NO_ROTATION");
    } else if (host.isRotationInvalid) {
      reasons.push("DISCARD_REASON_RACE_ROTATION_INVALID");
    }

    if (host.isSaving) {
      reasons.push("DISCARD_REASON_SAVING");
    } else if (reasons.length === 0 && host.isDirtyState()) {
      reasons.push("DISCARD_REASON_EXIT_TOO_QUICKLY");
    }

    return reasons;
  }

  static getResetTooltip(
    isAdmin: boolean,
    translationService: TranslationService,
  ): string {
    if (!isAdmin) {
      return translationService.translate("RM_RESET_ADMIN_ONLY_TOOLTIP");
    }
    return translationService.translate("RM_BTN_RESET_RECORDS");
  }

  static onResetRecords(host: RaceValidationHost, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (!host.isAdmin() || !host.editingRace?.entity_id) {
      return;
    }
    host.showResetConfirmation = true;
  }

  static onConfirmReset(host: RaceValidationHost): void {
    host.showResetConfirmation = false;
    if (!host.editingRace?.entity_id) {
      return;
    }
    const raceId = host.editingRace.entity_id;
    host.resetRaceName = host.editingRace.name || "";
    host.dataService.resetRaceRecords(raceId).subscribe({
      next: () => {
        host.showResetSuccess = true;
        host.cdr.detectChanges();
      },
      error: (err) => {
        host.logger.error("Failed to reset race records:", err);
        host.cdr.detectChanges();
      },
    });
  }

  static monitorConnection(host: RaceConnectionHost): Subscription {
    return host.connectionMonitor.connectionState$.subscribe((state) => {
      host.isConnectionLost = state === ConnectionState.DISCONNECTED;
      if (host.isConnectionLost) {
        host.handleConnectionLoss();
      }
    });
  }

  static handleConnectionLoss(host: RaceConnectionHost): void {
    if (!host.isConnectionLost) {
      return;
    }
    if (host.isSaving) {
      host.isSaving = false;
      host.isAutoSaving = false;
    }
    if (host.isLoading) {
      host.isLoading = false;
    }
    host.cdr.detectChanges();
  }
}
