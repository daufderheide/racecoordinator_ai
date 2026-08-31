import { ICustomRotation } from "@app/proto/antigravity";
import { TranslationService } from "@app/services/translation.service";
import { deepCopy } from "@app/utils/clone.utils";
import {
  checkLaneEquality,
  LaneEqualityResult,
} from "@app/utils/lane-equality";

export interface LocalRotation extends ICustomRotation {
  isExpanded?: boolean;
  isEqual?: boolean;
  equalityReport?: any[];
}

export function getRotationSignature(
  rotation: ICustomRotation,
  numLanes: number,
): string {
  const heatsSig = (rotation.heats || [])
    .map((h) => (h.driverIndices || []).join(","))
    .join("|");
  return `${rotation.numDrivers || 0}:${numLanes}:${heatsSig}`;
}

export function checkRotationLaneEqualityDirect(
  rotation: ICustomRotation,
  numLanes: number,
  translationService: TranslationService,
): LaneEqualityResult {
  const numDrivers = rotation.numDrivers ?? 0;
  const driverIds: string[] = [];
  for (let d = 1; d <= numDrivers; d++) {
    driverIds.push(d.toString());
  }
  const heats = (rotation.heats || []).map((h) =>
    (h.driverIndices || []).map((idx) =>
      idx && idx > 0 ? idx.toString() : null,
    ),
  );
  return checkLaneEquality(
    numLanes,
    driverIds,
    heats,
    undefined,
    translationService,
  );
}

export interface CustomRotationState {
  assetName: string;
  selectedTrackId: string;
  numLanes: number;
  rotations: ICustomRotation[];
}

export function cloneCustomRotationState(
  state: CustomRotationState,
): CustomRotationState {
  return {
    assetName: state.assetName,
    selectedTrackId: state.selectedTrackId,
    numLanes: state.numLanes,
    rotations: deepCopy(state.rotations),
  };
}

export function areCustomRotationStatesEqual(
  a: CustomRotationState,
  b: CustomRotationState,
): boolean {
  if (
    a.assetName !== b.assetName ||
    a.selectedTrackId !== b.selectedTrackId ||
    a.numLanes !== b.numLanes
  ) {
    return false;
  }
  if (a.rotations.length !== b.rotations.length) {
    return false;
  }
  return a.rotations.every((rot, rotIdx) => {
    const otherRot = b.rotations[rotIdx];
    if (rot.numDrivers !== otherRot.numDrivers) {
      return false;
    }
    const heats = rot.heats || [];
    const otherHeats = otherRot.heats || [];
    if (heats.length !== otherHeats.length) {
      return false;
    }
    return heats.every((heat, heatIdx) => {
      const otherHeat = otherHeats[heatIdx];
      if (heat.group !== otherHeat.group) {
        return false;
      }
      const lanes = heat.driverIndices || [];
      const otherLanes = otherHeat.driverIndices || [];
      if (lanes.length !== otherLanes.length) {
        return false;
      }
      return lanes.every((drv, laneIdx) => drv === otherLanes[laneIdx]);
    });
  });
}

export function downloadJsonFile(fileName: string, content: string): void {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 5000);
}

export function buildSingleRotationExportJson(
  assetName: string,
  numLanes: number,
  rotation: ICustomRotation,
): { fileName: string; jsonContent: string } {
  const numDrivers = rotation.numDrivers || 0;
  const fileName = `${assetName}_L${numLanes}_D${numDrivers}.json`;

  const exportObj = {
    Version: "1.0",
    NumDrivers: numDrivers,
    NumLanes: numLanes,
    Heats:
      rotation.heats?.map((h) => ({
        Drivers: h.driverIndices,
        Group: h.group !== undefined && h.group !== null ? h.group + 1 : 1,
      })) || [],
  };

  return {
    fileName,
    jsonContent: JSON.stringify(exportObj, null, 2),
  };
}

export function buildRotationsAssetExportJson(
  assetName: string,
  numLanes: number,
  rotations: ICustomRotation[],
): { fileName: string; jsonContent: string } {
  const fileName = `${assetName}_L${numLanes}_Asset.json`;

  const exportObj = {
    Version: "1.0",
    IsAsset: true,
    AssetName: assetName,
    NumLanes: numLanes,
    Rotations: rotations.map((rotation) => ({
      NumDrivers: rotation.numDrivers || 0,
      Heats:
        rotation.heats?.map((h) => ({
          Drivers: h.driverIndices,
          Group: h.group !== undefined && h.group !== null ? h.group + 1 : 1,
        })) || [],
    })),
  };

  return {
    fileName,
    jsonContent: JSON.stringify(exportObj, null, 2),
  };
}

export function getDriverGroupConflicts(
  rotation: ICustomRotation,
): Set<number> {
  const driverToGroups = new Map<number, Set<number>>();
  rotation.heats?.forEach((heat) => {
    const group = heat.group || 0;
    heat.driverIndices?.forEach((driverId) => {
      if (driverId && driverId > 0) {
        if (!driverToGroups.has(driverId)) {
          driverToGroups.set(driverId, new Set<number>());
        }
        driverToGroups.get(driverId)!.add(group);
      }
    });
  });

  const conflictingDrivers = new Set<number>();
  driverToGroups.forEach((groups, driverId) => {
    if (groups.size > 1) {
      conflictingDrivers.add(driverId);
    }
  });
  return conflictingDrivers;
}

export function heatHasGroupConflict(
  rotation: ICustomRotation,
  heatIdx: number,
): boolean {
  const heat = rotation.heats?.[heatIdx];
  if (!heat || !heat.driverIndices) {
    return false;
  }
  const conflicts = getDriverGroupConflicts(rotation);
  return heat.driverIndices.some(
    (driverId) => driverId > 0 && conflicts.has(driverId),
  );
}

export function driverHasGroupConflict(
  rotation: ICustomRotation,
  driverId: number,
): boolean {
  if (!driverId || driverId <= 0) return false;
  const conflicts = getDriverGroupConflicts(rotation);
  return conflicts.has(driverId);
}

export function heatHasError(
  rotation: ICustomRotation,
  heatIdx: number,
): boolean {
  const heat = rotation.heats?.[heatIdx];
  if (!heat || !heat.driverIndices) {
    return false;
  }

  const assigned = heat.driverIndices.filter(
    (idx) => idx !== undefined && idx !== null && idx > 0,
  );
  const unique = new Set(assigned);
  return assigned.length !== unique.size;
}

export function hasValidationErrors(rotations: ICustomRotation[]): boolean {
  return rotations.some((rot) => {
    const hasLaneConflict =
      rot.heats?.some((_, idx) => heatHasError(rot, idx)) ?? false;
    if (hasLaneConflict) return true;

    const conflicts = getDriverGroupConflicts(rot);
    return conflicts.size > 0;
  });
}
