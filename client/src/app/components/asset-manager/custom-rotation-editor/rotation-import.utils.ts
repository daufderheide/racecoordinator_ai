import { ICustomHeat } from "@app/proto/antigravity";

import {
  assignCustomRotationStepNumbers,
  LocalRotation,
} from "./rotation-export.utils";

export interface ImportResult {
  success: boolean;
  key: string;
  params?: any;
  newRotations?: LocalRotation[];
}

export function isRc1Rotation(version: any): boolean {
  if (version === undefined || version === null) {
    return true;
  }
  const str = String(version).trim();
  if (str === "") {
    return true;
  }
  const parsed = parseFloat(str);
  if (isNaN(parsed) || parsed < 1) {
    return true;
  }
  return false;
}

export function parseImportHeats(
  jsonHeats: any[],
  isRc1: boolean,
): ICustomHeat[] {
  return jsonHeats.map((h: any) => {
    const jsonDrivers = h.Drivers !== undefined ? h.Drivers : h.drivers;
    let drivers = jsonDrivers || [];
    drivers = drivers.map((d: any) => {
      if (d === null || d === undefined) {
        return 0;
      }
      const val = Number(d);
      if (isNaN(val)) {
        return 0;
      }
      if (isRc1) {
        // In RC1, driver indices are 0-based: 0, 1, 2, ... -> 1, 2, 3, ...
        // -1 represents an empty lane (0). Custom step-up rotations from RC1 are not supported;
        // all negative driver indices are treated as empty lanes (0).
        if (val < 0) {
          return 0;
        }
        return val + 1;
      }
      return val;
    });

    let group = 0;
    const jsonGroup = h.Group !== undefined ? h.Group : h.group;
    if (jsonGroup !== undefined && jsonGroup !== null) {
      const val = Number(jsonGroup);
      if (!isNaN(val)) {
        group = isRc1 ? val : val - 1;
      }
    }
    if (group < 0) {
      group = 0;
    }

    const isStepUpBoundary = isRc1
      ? false
      : h.IsStepUpBoundary !== undefined
        ? !!h.IsStepUpBoundary
        : !!(h.isStepUpBoundary || h.is_step_up_boundary);

    const stepVal = isRc1
      ? 1
      : h.Step !== undefined
        ? Number(h.Step)
        : Number(h.step);
    const step = !isNaN(stepVal) && stepVal > 0 ? stepVal : 1;

    return {
      driverIndices: drivers,
      group: group,
      isStepUpBoundary: isStepUpBoundary,
      step: step,
    };
  });
}

function importWholeAsset(
  fileName: string,
  json: any,
  isRc1: boolean,
  internalNumLanes: number,
  existingDriverCounts: number[],
): ImportResult {
  const jsonNumLanes =
    json.NumLanes !== undefined ? json.NumLanes : json.numLanes;
  if (jsonNumLanes !== undefined && jsonNumLanes !== internalNumLanes) {
    return {
      success: false,
      key: "AM_IMPORT_ERR_LANES",
      params: {
        file: fileName,
        expected: internalNumLanes,
        found: jsonNumLanes,
      },
    };
  }

  const rotations = json.Rotations || json.rotations || [];
  let importedCount = 0;
  let duplicateCount = 0;
  const newRotations: LocalRotation[] = [];
  const batchDriverCounts = [...existingDriverCounts];

  const fileBaseName = fileName.replace(/\.[^/.]+$/, "");
  for (const rot of rotations) {
    const rotNumDrivers =
      rot.NumDrivers !== undefined ? rot.NumDrivers : rot.numDrivers;
    const rotHeats = rot.Heats !== undefined ? rot.Heats : rot.heats;

    if (rotNumDrivers === undefined || rotHeats === undefined) {
      continue;
    }
    if (batchDriverCounts.includes(rotNumDrivers)) {
      duplicateCount++;
      continue;
    }

    const rotDescription =
      rot.Description !== undefined ? rot.Description : rot.description;
    const description =
      rotDescription !== undefined &&
      rotDescription !== null &&
      String(rotDescription).trim() !== ""
        ? String(rotDescription).trim()
        : fileBaseName;

    const rotVersion = rot.Version !== undefined ? rot.Version : rot.version;
    const isRotRc1 =
      rotVersion !== undefined ? isRc1Rotation(rotVersion) : isRc1;

    const heats = parseImportHeats(rotHeats, isRotRc1);
    const newRot: LocalRotation = {
      numDrivers: rotNumDrivers,
      description: description,
      heats: heats,
      isExpanded: true,
    };
    assignCustomRotationStepNumbers(newRot);
    newRotations.push(newRot);
    batchDriverCounts.push(rotNumDrivers);
    importedCount++;
  }

  if (importedCount === 0 && duplicateCount > 0) {
    return {
      success: false,
      key: "AM_IMPORT_ERR_DUPLICATE",
      params: { file: fileName, count: duplicateCount },
    };
  }

  return {
    success: true,
    key: "AM_IMPORT_SUCCESS",
    params: { file: fileName },
    newRotations,
  };
}

function importSingleRotation(
  fileName: string,
  json: any,
  isRc1: boolean,
  internalNumLanes: number,
  existingDriverCounts: number[],
): ImportResult {
  const jsonNumDrivers =
    json.NumDrivers !== undefined ? json.NumDrivers : json.numDrivers;
  const jsonNumLanes =
    json.NumLanes !== undefined ? json.NumLanes : json.numLanes;
  const jsonHeats = json.Heats !== undefined ? json.Heats : json.heats;

  if (
    jsonNumDrivers === undefined ||
    jsonNumLanes === undefined ||
    jsonHeats === undefined
  ) {
    return {
      success: false,
      key: "AM_IMPORT_ERR_MISSING_FIELDS",
      params: { file: fileName },
    };
  }

  if (jsonNumLanes !== internalNumLanes) {
    return {
      success: false,
      key: "AM_IMPORT_ERR_LANES",
      params: {
        file: fileName,
        expected: internalNumLanes,
        found: jsonNumLanes,
      },
    };
  }

  if (existingDriverCounts.includes(jsonNumDrivers)) {
    return {
      success: false,
      key: "AM_IMPORT_ERR_DUPLICATE",
      params: { file: fileName, count: jsonNumDrivers },
    };
  }

  const rotVersion = json.Version !== undefined ? json.Version : json.version;
  const isRotRc1 = rotVersion !== undefined ? isRc1Rotation(rotVersion) : isRc1;

  const heats: ICustomHeat[] = parseImportHeats(jsonHeats, isRotRc1);
  const fileBaseName = fileName.replace(/\.[^/.]+$/, "");
  const jsonDescription =
    json.Description !== undefined ? json.Description : json.description;
  const description =
    jsonDescription !== undefined &&
    jsonDescription !== null &&
    String(jsonDescription).trim() !== ""
      ? String(jsonDescription).trim()
      : fileBaseName;

  const newRot: LocalRotation = {
    numDrivers: jsonNumDrivers,
    description: description,
    heats: heats,
    isExpanded: true,
  };
  assignCustomRotationStepNumbers(newRot);

  return {
    success: true,
    key: "AM_IMPORT_SUCCESS",
    params: { file: fileName },
    newRotations: [newRot],
  };
}

export async function parseAndValidateImportFile(
  file: File,
  internalNumLanes: number,
  existingDriverCounts: number[],
): Promise<ImportResult> {
  try {
    const text = await file.text();
    let json: any;

    try {
      json = JSON.parse(text);
    } catch (e) {
      try {
        const sanitized = text
          .replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"')
          .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
        json = JSON.parse(sanitized);
      } catch (_) {
        throw e;
      }
    }

    const rootVersion =
      json.Version !== undefined ? json.Version : json.version;
    const isRc1 = isRc1Rotation(rootVersion);

    const isAsset = json.IsAsset !== undefined ? json.IsAsset : json.isAsset;
    const assetName =
      json.AssetName !== undefined ? json.AssetName : json.assetName;
    const rotations =
      json.Rotations !== undefined ? json.Rotations : json.rotations;

    if (
      isAsset === true ||
      (assetName !== undefined && rotations !== undefined)
    ) {
      return importWholeAsset(
        file.name,
        json,
        isRc1,
        internalNumLanes,
        existingDriverCounts,
      );
    }
    return importSingleRotation(
      file.name,
      json,
      isRc1,
      internalNumLanes,
      existingDriverCounts,
    );
  } catch (e) {
    return {
      success: false,
      key: "AM_IMPORT_ERR_INVALID_JSON",
      params: { file: file.name },
    };
  }
}
