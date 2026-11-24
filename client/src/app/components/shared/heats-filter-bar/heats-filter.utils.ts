import { TranslationService } from "@app/services/translation.service";

export interface HeatLike {
  group?: number | null;
  step?: number | null;
}

export interface AvailableGroup {
  index: number;
  name: string;
  count: number;
}

export interface AvailableStep {
  step: number;
  name: string;
  count: number;
}

export function getAvailableSteps<T extends HeatLike>(
  heats: T[],
  translationService: TranslationService,
): AvailableStep[] {
  if (!heats || heats.length === 0) return [];
  const stepSet = new Set<number>();
  for (const h of heats) {
    stepSet.add(h.step || 1);
  }
  const sortedSteps = Array.from(stepSet).sort((a, b) => a - b);
  return sortedSteps.map((s) => ({
    step: s,
    name: translationService.translate("RD_FILTER_STEP_N", { n: s }),
    count: heats.filter((h) => (h.step || 1) === s).length,
  }));
}

export function filterHeatsByGroupAndStep<T extends HeatLike>(
  heats: T[],
  selectedGroup: number | null,
  selectedStep: number | null,
): T[] {
  if (!heats || heats.length === 0) return [];
  if (selectedGroup === null && selectedStep === null) return heats;
  return heats.filter((h) => {
    if (selectedGroup !== null && (h.group ?? 0) !== selectedGroup) {
      return false;
    }
    if (selectedStep !== null && (h.step || 1) !== selectedStep) {
      return false;
    }
    return true;
  });
}

export function getAvailableGroupsForRotation<T extends HeatLike>(
  heats: T[],
  translationService: TranslationService,
): AvailableGroup[] {
  if (!heats || heats.length === 0) return [];
  const maxGroup = Math.max(0, ...heats.map((h) => h.group ?? 0));
  const groups: AvailableGroup[] = [];
  for (let i = 0; i <= maxGroup; i++) {
    const name = translationService.translate("RD_FILTER_GROUP_N", {
      n: i + 1,
    });
    const count = heats.filter((h) => (h.group ?? 0) === i).length;
    groups.push({ index: i, name, count });
  }
  return groups;
}

export function getRotationGroupOptions<T extends HeatLike>(
  heats: T[],
  translationService: TranslationService,
): { index: number; name: string }[] {
  const maxGroup =
    heats && heats.length > 0
      ? Math.max(0, ...heats.map((h) => h.group ?? 0))
      : 0;
  const numOptions = Math.max(4, maxGroup + 2);
  const options: { index: number; name: string }[] = [];
  for (let i = 0; i < numOptions; i++) {
    options.push({
      index: i,
      name: translationService.translate("RD_FILTER_GROUP_N", { n: i + 1 }),
    });
  }
  return options;
}

export interface HeatDividerInfo {
  show: boolean;
  stepChanged: boolean;
  groupChanged: boolean;
  stepNumber?: number;
  groupIndex?: number;
  stepLabel?: string;
  groupLabel?: string;
}

export function getHeatDividerInfo<T extends HeatLike>(
  heats: T[],
  index: number,
  hasStepUps: boolean,
  hasGroups: boolean,
  translationService: TranslationService,
  getGroupName?: (groupIndex: number) => string,
  showStepDividers: boolean = true,
  showGroupDividers: boolean = true,
): HeatDividerInfo | null {
  if (!heats || index <= 0 || index >= heats.length) {
    return null;
  }
  if (!showStepDividers && !showGroupDividers) {
    return null;
  }
  const prev = heats[index - 1];
  const curr = heats[index];
  if (!prev || !curr) {
    return null;
  }

  const prevStep = prev.step || 1;
  const currStep = curr.step || 1;
  const stepChanged = hasStepUps && showStepDividers && prevStep !== currStep;

  const prevGroup = prev.group ?? 0;
  const currGroup = curr.group ?? 0;
  const groupChanged =
    hasGroups && showGroupDividers && prevGroup !== currGroup;

  if (!stepChanged && !groupChanged) {
    return null;
  }

  const stepLabel = stepChanged
    ? translationService.translate("RD_STEP_LADDER_STEP", { step: currStep })
    : undefined;

  let groupLabel: string | undefined;
  if (groupChanged) {
    const customName = getGroupName ? getGroupName(currGroup) : undefined;
    groupLabel =
      customName ||
      translationService.translate("RD_FILTER_GROUP_N", { n: currGroup + 1 });
  }

  return {
    show: true,
    stepChanged,
    groupChanged,
    stepNumber: currStep,
    groupIndex: currGroup,
    stepLabel,
    groupLabel,
  };
}

export const SHOW_DIVIDERS_STORAGE_KEY = "rc_show_heat_dividers";
export const SHOW_GROUP_DIVIDERS_STORAGE_KEY = "rc_show_group_heat_dividers";
export const SHOW_STEP_DIVIDERS_STORAGE_KEY = "rc_show_step_heat_dividers";

export function loadShowGroupDividersPreference(): boolean {
  try {
    if (typeof localStorage !== "undefined") {
      const val = localStorage.getItem(SHOW_GROUP_DIVIDERS_STORAGE_KEY);
      if (val !== null) {
        return val !== "false";
      }
      const legacy = localStorage.getItem(SHOW_DIVIDERS_STORAGE_KEY);
      if (legacy !== null) {
        return legacy !== "false";
      }
    }
  } catch {
    // Ignore storage errors in test or restricted environments
  }
  return true;
}

export function saveShowGroupDividersPreference(show: boolean): void {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(SHOW_GROUP_DIVIDERS_STORAGE_KEY, String(show));
    }
  } catch {
    // Ignore storage errors
  }
}

export function loadShowStepDividersPreference(): boolean {
  try {
    if (typeof localStorage !== "undefined") {
      const val = localStorage.getItem(SHOW_STEP_DIVIDERS_STORAGE_KEY);
      if (val !== null) {
        return val !== "false";
      }
      const legacy = localStorage.getItem(SHOW_DIVIDERS_STORAGE_KEY);
      if (legacy !== null) {
        return legacy !== "false";
      }
    }
  } catch {
    // Ignore storage errors in test or restricted environments
  }
  return true;
}

export function saveShowStepDividersPreference(show: boolean): void {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(SHOW_STEP_DIVIDERS_STORAGE_KEY, String(show));
    }
  } catch {
    // Ignore storage errors
  }
}

export function loadShowDividersPreference(): boolean {
  return loadShowGroupDividersPreference() && loadShowStepDividersPreference();
}

export function saveShowDividersPreference(show: boolean): void {
  saveShowGroupDividersPreference(show);
  saveShowStepDividersPreference(show);
}
