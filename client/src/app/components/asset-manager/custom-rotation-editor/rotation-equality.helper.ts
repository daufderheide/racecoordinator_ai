import { ICustomRotation } from "@app/proto/antigravity";
import { TranslationService } from "@app/services/translation.service";
import { LaneEqualityResult } from "@app/utils/lane-equality";

import {
  checkRotationLaneEqualityDirect,
  getRotationSignature,
  LocalRotation,
} from "./rotation-export.utils";

export type LaneEqualityChecker = (
  rotation: ICustomRotation,
  numLanes: number,
  translationService: TranslationService,
) => LaneEqualityResult;

export class RotationEqualityManager {
  private cache = new Map<
    ICustomRotation,
    { signature: string; result: LaneEqualityResult }
  >();

  isRotationEqual(
    rotation: ICustomRotation,
    numLanes: number,
    translationService: TranslationService,
    checker: LaneEqualityChecker = checkRotationLaneEqualityDirect,
  ): boolean {
    const sig = getRotationSignature(rotation, numLanes);
    let cached = this.cache.get(rotation);
    if (!cached || cached.signature !== sig) {
      const res = checker(rotation, numLanes, translationService);
      cached = { signature: sig, result: res };
      this.cache.set(rotation, cached);

      const localRot = rotation as LocalRotation;
      localRot.isEqual = res.allEqual;
      localRot.equalityReport = res.reports;
    }
    return cached.result.allEqual;
  }

  validateRotationLaneEquality(
    rotation: LocalRotation,
    numLanes: number,
    translationService: TranslationService,
    checker: LaneEqualityChecker = checkRotationLaneEqualityDirect,
  ): void {
    const sig = getRotationSignature(rotation, numLanes);
    const result = checker(rotation, numLanes, translationService);
    rotation.isEqual = result.allEqual;
    rotation.equalityReport = result.reports;
    this.cache.set(rotation, { signature: sig, result });
  }

  validateAllRotationsLaneEquality(
    rotations: LocalRotation[],
    numLanes: number,
    translationService: TranslationService,
    checker: LaneEqualityChecker = checkRotationLaneEqualityDirect,
  ): void {
    rotations.forEach((rot) => {
      this.validateRotationLaneEquality(
        rot,
        numLanes,
        translationService,
        checker,
      );
    });
  }

  getEqualityReport(
    rotation: ICustomRotation,
    numLanes: number,
    translationService: TranslationService,
    checker: LaneEqualityChecker = checkRotationLaneEqualityDirect,
  ): any[] {
    const sig = getRotationSignature(rotation, numLanes);
    let cached = this.cache.get(rotation);
    if (!cached || cached.signature !== sig) {
      const res = checker(rotation, numLanes, translationService);
      cached = { signature: sig, result: res };
      this.cache.set(rotation, cached);

      const localRot = rotation as LocalRotation;
      localRot.isEqual = res.allEqual;
      localRot.equalityReport = res.reports;
    }
    return cached.result.reports;
  }

  clearCache(): void {
    this.cache.clear();
  }
}
