import { CdkDragDrop } from "@angular/cdk/drag-drop";
import { IAssetMessage } from "@app/proto/antigravity";

import { LocalRotation } from "./rotation-export.utils";

export interface VirtualDriver {
  id: number;
  name: string;
}

export interface StepUpDriver {
  id: number;
  stepUpIndex: number;
  name: string;
}

export function generateVirtualDrivers(count: number): VirtualDriver[] {
  const list: VirtualDriver[] = [];
  for (let i = 1; i <= count; i++) {
    list.push({ id: i, name: `Driver ${i}` });
  }
  return list;
}

export function generateStepUpDrivers(count: number): StepUpDriver[] {
  const list: StepUpDriver[] = [];
  for (let i = 1; i <= count; i++) {
    list.push({
      id: -i,
      stepUpIndex: i,
      name: `Step-Up ${i}`,
    });
  }
  return list;
}

export function buildHeatDropListIds(
  rotations: LocalRotation[],
  numLanes: number,
): string[] {
  const ids = ["driver-pool", "step-up-pool"];
  rotations.forEach((rot, rotIdx) => {
    if (rot.isExpanded) {
      rot.heats?.forEach((h, hIdx) => {
        for (let lIdx = 0; lIdx < numLanes; lIdx++) {
          ids.push(`rot-${rotIdx}-heat-${hIdx}-lane-${lIdx}`);
        }
      });
    }
  });
  return ids;
}

export function adjustHeatLanes(
  rotations: LocalRotation[],
  numLanes: number,
): void {
  rotations.forEach((rot) => {
    rot.heats?.forEach((heat) => {
      const currentIndices = heat.driverIndices || [];
      if (currentIndices.length < numLanes) {
        heat.driverIndices = [
          ...currentIndices,
          ...new Array(numLanes - currentIndices.length).fill(0),
        ];
      } else if (currentIndices.length > numLanes) {
        heat.driverIndices = currentIndices.slice(0, numLanes);
      }
    });
  });
}

export function generateUniqueRotationAssetName(
  baseName: string = "New Custom Rotation",
  allAssets: IAssetMessage[],
  currentAssetId?: string,
): string {
  const pattern = /(_\d+|\s+\d+)$/;
  const base = baseName.replace(pattern, "");
  let index = 1;
  let candidate = `${base} ${index}`;
  while (
    allAssets.some(
      (a) =>
        a.type === "custom_rotation" &&
        a.name?.trim().toLowerCase() === candidate.toLowerCase() &&
        (!currentAssetId || a.model?.entityId !== currentAssetId),
    )
  ) {
    index++;
    candidate = `${base} ${index}`;
  }
  return candidate;
}

export function handleRotationDrop(
  event: CdkDragDrop<any>,
  internalRotations: LocalRotation[],
): boolean {
  const fromId = event.previousContainer.id;
  const toId = event.container.id;

  if (
    (fromId === "driver-pool" || fromId === "step-up-pool") &&
    toId.startsWith("rot-")
  ) {
    const parts = toId.split("-");
    const rotIdx = parseInt(parts[1], 10);
    const heatIdx = parseInt(parts[3], 10);
    const laneIdx = parseInt(parts[5], 10);

    const rotation = internalRotations[rotIdx];
    const heat = rotation?.heats?.[heatIdx];
    if (heat && heat.driverIndices) {
      const driverId = event.item.data.id;
      heat.driverIndices[laneIdx] = driverId;
      return true;
    }
  } else if (fromId.startsWith("rot-") && toId.startsWith("rot-")) {
    const fromParts = fromId.split("-");
    const fromRotIdx = parseInt(fromParts[1], 10);
    const fromHeatIdx = parseInt(fromParts[3], 10);
    const fromLaneIdx = parseInt(fromParts[5], 10);

    const parts = toId.split("-");
    const rotIdx = parseInt(parts[1], 10);
    const heatIdx = parseInt(parts[3], 10);
    const laneIdx = parseInt(parts[5], 10);

    if (fromRotIdx === rotIdx) {
      const rotation = internalRotations[rotIdx];
      const fromHeat = rotation?.heats?.[fromHeatIdx];
      const toHeat = rotation?.heats?.[heatIdx];

      if (
        fromHeat &&
        toHeat &&
        fromHeat.driverIndices &&
        toHeat.driverIndices
      ) {
        const temp = fromHeat.driverIndices[fromLaneIdx];
        fromHeat.driverIndices[fromLaneIdx] = toHeat.driverIndices[laneIdx];
        toHeat.driverIndices[laneIdx] = temp;
        return true;
      }
    }
  } else if (
    fromId.startsWith("rot-") &&
    (toId === "driver-pool" || toId === "step-up-pool")
  ) {
    const fromParts = fromId.split("-");
    const fromRotIdx = parseInt(fromParts[1], 10);
    const fromHeatIdx = parseInt(fromParts[3], 10);
    const fromLaneIdx = parseInt(fromParts[5], 10);

    const rotation = internalRotations[fromRotIdx];
    const heat = rotation?.heats?.[fromHeatIdx];
    if (heat && heat.driverIndices) {
      heat.driverIndices[fromLaneIdx] = 0;
      return true;
    }
  }
  return false;
}
