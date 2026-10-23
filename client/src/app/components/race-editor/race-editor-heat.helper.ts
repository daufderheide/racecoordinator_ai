import { ChangeDetectorRef } from "@angular/core";
import { DataService } from "@app/data.service";
import { Track } from "@app/models/track";
import { LoggerService } from "@app/services/logger.service";

export interface RaceHeatHost {
  editingRace: any;
  tracks: Track[];
  driverCount: number;
  generatedHeats: any[];
  customRotationAssets: any[];
  selectedCustomRotationAssetId: string;
  customSequenceText: string;
  dataService: DataService;
  logger: LoggerService;
  cdr: ChangeDetectorRef;
  onInputChange(): void;
  captureState(): void;
  saveDriverCount(): void;
  loadHeats(): void;
  filteredCustomRotationAssets: any[];
  syncSelectedCustomRotationAsset(): void;
}

export class RaceEditorHeatHelper {
  static getCustomRotationSequenceString(editingRace: any): string {
    return (editingRace?.custom_rotation_sequence || []).join(", ");
  }

  static syncSequenceTextFromModel(host: RaceHeatHost): void {
    host.customSequenceText = this.getCustomRotationSequenceString(
      host.editingRace,
    );
    host.cdr.markForCheck();
    host.cdr.detectChanges();
  }

  static onCustomSequenceChange(host: RaceHeatHost): void {
    if (!host.editingRace) return;
    const value = host.customSequenceText;
    const parts = value.split(",").map((s) => s.trim());
    const sequence: number[] = [];

    for (const part of parts) {
      if (part === "") continue;
      if (!/^\d+$/.test(part)) {
        sequence.push(NaN);
      } else {
        sequence.push(parseInt(part, 10));
      }
    }

    host.editingRace.custom_rotation_sequence = sequence;
    host.editingRace.customRotationSequence = sequence;
    host.onInputChange();
    host.loadHeats();
  }

  static getGroupIndices(editingRace: any): number[] {
    const max = Math.max(1, editingRace?.group_options?.max_groups || 1);
    return Array.from({ length: max }, (_, i) => i);
  }

  static getGroupNameInput(editingRace: any, index: number): string {
    return editingRace?.group_options?.names?.[index] || "";
  }

  static setGroupNameInput(
    editingRace: any,
    index: number,
    value: string,
    captureState: () => void,
  ): void {
    if (!editingRace?.group_options) {
      return;
    }
    if (!editingRace.group_options.names) {
      editingRace.group_options.names = [];
    }
    editingRace.group_options.names[index] = value;
    captureState();
  }

  static onRotationTypeChange(host: RaceHeatHost): void {
    host.logger.debug(
      "Rotation type changed to:",
      host.editingRace?.heat_rotation_type,
    );
    host.captureState();
    host.loadHeats();
  }

  static onLaneSelected(host: RaceHeatHost, laneIndex: number): void {
    if (host.editingRace && host.editingRace.solo_lane_index !== laneIndex) {
      host.editingRace.solo_lane_index = laneIndex;
      host.captureState();
      host.loadHeats();
    }
  }

  static onDriverCountChange(host: RaceHeatHost): void {
    host.logger.debug("Driver count changed to:", host.driverCount);
    host.saveDriverCount();
    host.loadHeats();
  }

  static loadCustomRotationAssets(host: RaceHeatHost): void {
    host.dataService.listAssets().subscribe({
      next: (assets) => {
        host.customRotationAssets = (assets || []).filter(
          (a) => a.type === "custom_rotation",
        );
        setTimeout(() => {
          host.syncSelectedCustomRotationAsset();
          host.cdr.detectChanges();
        }, 0);
      },
      error: (err) => host.logger.error("Failed to load assets", err),
    });
  }

  static getFilteredCustomRotationAssets(
    tracks: Track[],
    customRotationAssets: any[],
    editingRace: any,
  ): any[] {
    const track = tracks.find(
      (t) => t.entity_id === editingRace?.track_entity_id,
    );
    const numLanes = track?.lanes?.length || 0;
    return (customRotationAssets || []).filter((a) => a.numLanes === numLanes);
  }

  static syncSelectedCustomRotationAsset(host: RaceHeatHost): void {
    if (!host.editingRace || host.editingRace.heat_rotation_type !== "Custom") {
      host.selectedCustomRotationAssetId = "";
      return;
    }

    const filtered = host.filteredCustomRotationAssets;

    if (host.editingRace.custom_rotation_asset_id) {
      if (
        host.customRotationAssets.length === 0 ||
        filtered.some(
          (a) =>
            a.model?.entityId === host.editingRace.custom_rotation_asset_id,
        )
      ) {
        host.selectedCustomRotationAssetId =
          host.editingRace.custom_rotation_asset_id;
        return;
      }
    }

    const currentRotationsJson = JSON.stringify(
      host.editingRace.custom_rotations || [],
    );
    let match = host.customRotationAssets.find(
      (a) => JSON.stringify(a.customRotations || []) === currentRotationsJson,
    );

    if (
      !match ||
      !filtered.some((a) => a.model?.entityId === match.model?.entityId)
    ) {
      if (filtered.length > 0) {
        match = filtered[0];
        host.editingRace.custom_rotation_asset_id = match.model?.entityId;
        host.selectedCustomRotationAssetId = match.model?.entityId || "";
      } else {
        host.editingRace.custom_rotation_asset_id = undefined;
        host.selectedCustomRotationAssetId = "";
      }
    } else {
      host.selectedCustomRotationAssetId = match.model?.entityId || "";
      host.editingRace.custom_rotation_asset_id = match.model?.entityId;
    }
  }

  static onCustomRotationAssetChange(host: RaceHeatHost): void {
    if (host.editingRace) {
      host.editingRace.custom_rotation_asset_id =
        host.selectedCustomRotationAssetId || undefined;
      delete host.editingRace.custom_rotations;
      host.captureState();
    }
  }

  static loadHeats(host: RaceHeatHost): void {
    host.logger.debug(
      "loadHeats called - entity_id:",
      host.editingRace?.entity_id,
      "driverCount:",
      host.driverCount,
      "trackId:",
      host.editingRace?.track_entity_id,
      "rotationType:",
      host.editingRace?.heat_rotation_type,
    );

    if (
      !host.editingRace ||
      host.driverCount <= 0 ||
      !host.editingRace.track_entity_id ||
      !host.editingRace.heat_rotation_type
    ) {
      host.logger.debug("Clearing heats - missing required data");
      host.generatedHeats = [];
      return;
    }

    host.logger.debug("Calling previewHeats with:", {
      trackId: host.editingRace.track_entity_id,
      rotationType: host.editingRace.heat_rotation_type,
      driverCount: host.driverCount,
      soloLaneIndex: host.editingRace.solo_lane_index,
      customSequence: host.editingRace.custom_rotation_sequence,
      heatTimesThrough: host.editingRace.heat_times_through,
      reverseHeats: host.editingRace.reverse_heats,
      groupOptions: host.editingRace.group_options,
    });

    host.dataService
      .previewHeats(
        host.editingRace.track_entity_id,
        host.editingRace.heat_rotation_type,
        host.driverCount,
        host.editingRace.solo_lane_index,
        host.editingRace.custom_rotation_sequence,
        host.editingRace.custom_rotation_asset_id,
        host.editingRace.custom_rotations,
        host.editingRace.heat_times_through,
        host.editingRace.reverse_heats,
        host.editingRace.group_options,
      )
      .subscribe({
        next: (response) => {
          host.logger.debug("Preview heats response:", response);
          host.generatedHeats = [...(response.heats || [])];
          host.cdr.markForCheck();
          host.cdr.detectChanges();
        },
        error: (error: any) => {
          host.logger.error("Failed to preview heats", error);
          host.generatedHeats = [];
          host.cdr.detectChanges();
        },
      });
  }
}
