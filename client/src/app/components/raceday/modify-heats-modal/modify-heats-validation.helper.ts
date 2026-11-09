import { Race } from "@app/models/race";
import { RaceParticipant } from "@app/models/race_participant";
import { Heat } from "@app/race/heat";
import { TranslationService } from "@app/services/translation.service";

import {
  getParticipantName,
  isPlaceholderParticipant,
  isStepUpParticipant,
} from "./modify-heats-modal.utils";

export function validateGroupSequence(_heats: Heat[]): {
  isValid: boolean;
  expected?: number;
  found?: number;
} {
  return { isValid: true };
}

export function validateStartedHeatsNotModified(
  localHeats: Heat[],
  originalHeats: Heat[],
  isHeatStarted: (h: Heat) => boolean,
  translationService: TranslationService,
): string | null {
  for (const localH of localHeats) {
    const originalH = originalHeats.find((h) => h.objectId === localH.objectId);
    if (originalH && isHeatStarted(originalH)) {
      const localDrivers = localH.heatDrivers.filter(
        (d) => !isPlaceholderParticipant(d.participant),
      );
      const originalDrivers = originalH.heatDrivers.filter(
        (d) => !isPlaceholderParticipant(d.participant),
      );
      if (localDrivers.length !== originalDrivers.length) {
        return translationService.translate("RD_ERR_STARTED_HEAT_MODIFIED");
      }
      for (let i = 0; i < localDrivers.length; i++) {
        const localDhd = localDrivers[i];
        const originalDhd = originalDrivers.find(
          (d) => d.laneIndex === localDhd.laneIndex,
        );
        if (
          !originalDhd ||
          localDhd.participant.objectId !== originalDhd.participant.objectId
        ) {
          return translationService.translate("RD_ERR_STARTED_HEAT_MODIFIED");
        }
      }
    }
  }
  return null;
}

export function validateStartedParticipantsNotRemoved(
  originalHeats: Heat[],
  localParticipants: RaceParticipant[],
  isHeatStarted: (h: Heat) => boolean,
  translationService: TranslationService,
): string | null {
  for (const originalH of originalHeats) {
    if (isHeatStarted(originalH)) {
      for (const dhd of originalH.heatDrivers) {
        if (isPlaceholderParticipant(dhd.participant)) {
          continue;
        }
        const stillInRace = localParticipants.some(
          (p) => p.objectId === dhd.participant.objectId,
        );
        if (!stillInRace) {
          return translationService.translate(
            "RD_ERR_STARTED_PARTICIPANT_REMOVED",
          );
        }
      }
    }
  }
  return null;
}

export function validateGroups(
  localHeats: Heat[],
  race: Race,
  translationService: TranslationService,
): string | null {
  if (!race.group_options?.enabled) {
    return null;
  }
  const participantGroups = new Map<string, number>();
  for (const h of localHeats) {
    for (const dhd of h.heatDrivers) {
      const p = dhd.participant;
      if (isPlaceholderParticipant(p)) continue;

      if (
        participantGroups.has(p.objectId) &&
        participantGroups.get(p.objectId) !== h.group
      ) {
        return translationService.translate(
          "RD_ERR_PARTICIPANT_MULTIPLE_GROUPS",
          {
            participant: getParticipantName(p),
            group1: participantGroups.get(p.objectId)! + 1,
            group2: h.group + 1,
          },
        );
      }
      participantGroups.set(p.objectId, h.group);
    }
  }

  if (localHeats.some((h) => h.group < 0)) {
    return translationService.translate("RD_ERR_GROUP_MIN_VALUE");
  }

  const seqResult = validateGroupSequence(localHeats);
  if (!seqResult.isValid) {
    return translationService.translate("RD_ERR_GROUP_NON_SEQUENTIAL", {
      found: seqResult.found,
      expected: seqResult.expected,
    });
  }
  return null;
}

export function validateStepUpHeats(
  localHeats: Heat[],
  race: Race,
  translationService: TranslationService,
): string | null {
  if (!race.step_up || race.step_up <= 0) {
    return null;
  }
  const stepUp = race.step_up;
  const stepMap = new Map<number, Heat[]>();
  for (const h of localHeats) {
    const step = h.step || 1;
    if (!stepMap.has(step)) {
      stepMap.set(step, []);
    }
    stepMap.get(step)!.push(h);
  }

  const sortedSteps = Array.from(stepMap.keys()).sort((a, b) => a - b);
  if (sortedSteps.length <= 1) {
    return null;
  }

  const step1Heats = stepMap.get(sortedSteps[0]) || [];
  const step1Drivers = new Set<string>();
  for (const h of step1Heats) {
    for (const dhd of h.heatDrivers) {
      if (isStepUpParticipant(dhd.participant)) {
        return translationService.translate("RD_ERR_STEP_UP_IN_STEP_ONE");
      }
      if (!isPlaceholderParticipant(dhd.participant)) {
        step1Drivers.add(dhd.participant.objectId);
      }
    }
  }
  if (step1Drivers.size < 2) {
    return translationService.translate(
      "RD_ERR_STEP_UP_BOTTOM_STEP_MIN_DRIVERS",
    );
  }

  for (let sIdx = 1; sIdx < sortedSteps.length; sIdx++) {
    const stepNum = sortedSteps[sIdx];
    const stepHeats = stepMap.get(stepNum) || [];
    for (const h of stepHeats) {
      const stepUpCount = h.heatDrivers.filter((dhd) =>
        isStepUpParticipant(dhd.participant),
      ).length;
      if (stepUpCount !== stepUp) {
        return translationService.translate("RD_ERR_STEP_UP_COUNT_MISMATCH", {
          step: stepNum,
          expected: stepUp,
          found: stepUpCount,
        });
      }
    }
  }
  return null;
}

export function getModifyHeatsValidationError(
  localHeats: Heat[],
  originalHeats: Heat[],
  localParticipants: RaceParticipant[],
  race: Race | undefined,
  isHeatStarted: (h: Heat) => boolean,
  translationService: TranslationService,
): string | null {
  const heatModError = validateStartedHeatsNotModified(
    localHeats,
    originalHeats,
    isHeatStarted,
    translationService,
  );
  if (heatModError) return heatModError;

  const partRemovalError = validateStartedParticipantsNotRemoved(
    originalHeats,
    localParticipants,
    isHeatStarted,
    translationService,
  );
  if (partRemovalError) return partRemovalError;

  if (race) {
    const groupError = validateGroups(localHeats, race, translationService);
    if (groupError) return groupError;

    const stepUpError = validateStepUpHeats(
      localHeats,
      race,
      translationService,
    );
    if (stepUpError) return stepUpError;
  }

  return null;
}
