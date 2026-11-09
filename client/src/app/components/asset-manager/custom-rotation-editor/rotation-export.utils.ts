import { ICustomRotation } from "@app/proto/antigravity";
import { TranslationService } from "@app/services/translation.service";
import { deepCopy } from "@app/utils/clone.utils";
import { saveFileAs } from "@app/utils/file-download.utils";
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
    .map(
      (h) =>
        `${(h.driverIndices || []).join(",")}:${h.group || 0}:${h.isStepUpBoundary ? 1 : 0}:${h.step || 1}`,
    )
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
  const driverNames = new Map<string, string>();
  for (let d = 1; d <= numDrivers; d++) {
    driverIds.push(d.toString());
  }

  const stepUpIndices = new Set<number>();
  (rotation.heats || []).forEach((h) => {
    (h.driverIndices || []).forEach((idx) => {
      if (idx !== undefined && idx !== null && idx < 0) {
        stepUpIndices.add(idx);
      }
    });
  });
  const sortedStepUps = Array.from(stepUpIndices).sort((a, b) => b - a);
  for (const sIdx of sortedStepUps) {
    const idStr = sIdx.toString();
    driverIds.push(idStr);
    const stepUpNum = -sIdx;
    driverNames.set(idStr, `Step-Up ${stepUpNum}`);
  }

  const heats = (rotation.heats || []).map((h) =>
    (h.driverIndices || []).map((idx) =>
      idx && idx !== 0 ? idx.toString() : null,
    ),
  );
  return checkLaneEquality(
    numLanes,
    driverIds,
    heats,
    driverNames,
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
      if (!!heat.isStepUpBoundary !== !!otherHeat.isStepUpBoundary) {
        return false;
      }
      if ((heat.step || 1) !== (otherHeat.step || 1)) {
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

export function downloadJsonFile(
  fileName: string,
  content: string,
): Promise<boolean> {
  return saveFileAs({
    suggestedName: fileName,
    data: content,
    mimeType: "application/json",
    description: "JSON Files",
    extension: ".json",
  });
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
        IsStepUpBoundary: !!h.isStepUpBoundary,
        Step: h.step || 1,
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
          IsStepUpBoundary: !!h.isStepUpBoundary,
          Step: h.step || 1,
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

export function assignCustomRotationStepNumbers(
  rotation: ICustomRotation,
): void {
  const heats = rotation.heats || [];
  const groupSteps = new Map<number, number>();

  for (const h of heats) {
    const group = h.group || 0;
    const currentStep = groupSteps.get(group) || 1;
    h.step = currentStep;
    if (h.isStepUpBoundary) {
      groupSteps.set(group, currentStep + 1);
    }
  }
}

export function rotationHasStepUps(rotation: ICustomRotation): boolean {
  if (!rotation.heats) return false;
  return rotation.heats.some(
    (h) =>
      !!h.isStepUpBoundary ||
      (h.driverIndices || []).some(
        (idx) => idx !== undefined && idx !== null && idx < 0,
      ),
  );
}

export function heatHasStepUpInStepOne(
  rotation: ICustomRotation,
  heatIdx: number,
): boolean {
  const heat = rotation.heats?.[heatIdx];
  if (!heat || !heat.driverIndices) {
    return false;
  }
  const step = heat.step || 1;
  if (step === 1) {
    return heat.driverIndices.some(
      (idx) => idx !== undefined && idx !== null && idx < 0,
    );
  }
  return false;
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
    (idx) => idx !== undefined && idx !== null && idx !== 0,
  );
  const unique = new Set(assigned);
  if (assigned.length !== unique.size) {
    return true;
  }

  if (heatHasStepUpInStepOne(rotation, heatIdx)) {
    return true;
  }

  return false;
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
