import {
  AvailableGroup,
  AvailableStep,
  filterHeatsByGroupAndStep,
  getAvailableGroupsForRotation,
  getAvailableSteps,
  getRotationGroupOptions as getSharedRotationGroupOptions,
} from "@app/components/shared/heats-filter-bar/heats-filter.utils";
import { ICustomHeat, ICustomRotation } from "@app/proto/antigravity";
import { TranslationService } from "@app/services/translation.service";

import { LocalRotation, rotationHasStepUps } from "./rotation-export.utils";

export function hasRotationGroupFilter(
  rotation: LocalRotation | ICustomRotation,
): boolean {
  return (rotation.heats || []).some((h) => (h.group || 0) > 0);
}

export function hasRotationStepFilter(
  rotation: LocalRotation | ICustomRotation,
): boolean {
  return rotationHasStepUps(rotation);
}

export function getRotationAvailableGroups(
  rotation: LocalRotation | ICustomRotation,
  translationService: TranslationService,
): AvailableGroup[] {
  return getAvailableGroupsForRotation(
    rotation.heats || [],
    translationService,
  );
}

export function getRotationAvailableSteps(
  rotation: LocalRotation | ICustomRotation,
  translationService: TranslationService,
): AvailableStep[] {
  return getAvailableSteps(rotation.heats || [], translationService);
}

export function getRotationGroupOptions(
  rotation: LocalRotation | ICustomRotation,
  translationService: TranslationService,
): { index: number; name: string }[] {
  return getSharedRotationGroupOptions(
    rotation.heats || [],
    translationService,
  );
}

export function filterRotationHeats(
  rotation: LocalRotation | ICustomRotation,
): ICustomHeat[] {
  const localRot = rotation as LocalRotation;
  return filterHeatsByGroupAndStep(
    rotation.heats || [],
    localRot.selectedGroup ?? null,
    localRot.selectedStep ?? null,
  );
}

export function getActiveRotation(
  rotations: LocalRotation[],
): LocalRotation | undefined {
  return rotations.find((r) => r.isExpanded) || rotations[0];
}

export function getRotationDriverGroupBadge(
  rotations: LocalRotation[],
  driverId: number | null | undefined,
): string | null {
  if (!driverId || driverId <= 0) return null;
  const activeRot = getActiveRotation(rotations);
  if (!activeRot || !hasRotationGroupFilter(activeRot)) return null;

  const heat = activeRot.heats?.find((h) =>
    h.driverIndices?.includes(driverId),
  );
  if (!heat) return null;
  return `G${(heat.group || 0) + 1}`;
}

export function getRotationDriverStepBadge(
  rotations: LocalRotation[],
  driverId: number | null | undefined,
): string | null {
  if (!driverId || driverId <= 0) return null;
  const activeRot = getActiveRotation(rotations);
  if (!activeRot || !hasRotationStepFilter(activeRot)) return null;

  const heat = activeRot.heats?.find((h) =>
    h.driverIndices?.includes(driverId),
  );
  if (!heat) return null;
  return `S${heat.step || 1}`;
}
