import { Race } from "@app/models/race";
import { RaceParticipant } from "@app/models/race_participant";
import { Track } from "@app/models/track";
import { Heat } from "@app/race/heat";
import { TranslationService } from "@app/services/translation.service";
import {
  checkLaneEquality,
  LaneEqualityReportItem,
} from "@app/utils/lane-equality";

import {
  assignStepNumbers,
  getParticipantName,
  inferBoundariesFromDrivers,
  isPlaceholderParticipant,
  isStepUpParticipant,
} from "./modify-heats-modal.utils";
import { getCustomGroupName } from "./modify-heats-ui.helper";

export function performLaneCheck(
  localParticipants: RaceParticipant[],
  localHeats: Heat[],
  track: Track,
  translationService: TranslationService,
  isStepUpEnabled?: boolean,
  race?: Race,
): { allEqual: boolean; reports: LaneEqualityReportItem[] } {
  const isStepUp =
    isStepUpEnabled ??
    ((race?.step_up != null && race.step_up > 0) ||
      localHeats.some(
        (h) =>
          h.isStepUpBoundary ||
          (h.step != null && h.step > 1) ||
          h.heatDrivers?.some((d) => isStepUpParticipant(d.participant)),
      ));

  if (!isStepUp) {
    return performStandardLaneCheck(
      localParticipants,
      localHeats,
      track,
      translationService,
    );
  }

  const hasGroups =
    !!race?.group_options?.enabled ||
    localHeats.some((h) => (h.group || 0) > 0);

  return performPartitionedLaneCheck(
    localParticipants,
    localHeats,
    track,
    translationService,
    isStepUp,
    hasGroups,
    race,
  );
}

function performStandardLaneCheck(
  localParticipants: RaceParticipant[],
  localHeats: Heat[],
  track: Track,
  translationService: TranslationService,
): { allEqual: boolean; reports: LaneEqualityReportItem[] } {
  const activeParticipants = localParticipants.filter(
    (p) => !isPlaceholderParticipant(p),
  );
  const driverIds = activeParticipants.map((p) => p.objectId);
  const driverNames = new Map<string, string>();
  activeParticipants.forEach((p) => {
    driverNames.set(p.objectId, getParticipantName(p, translationService));
  });

  const heats = localHeats.map((h) =>
    track.lanes.map((_, laneIdx) => {
      const dhd = h.heatDrivers.find((d) => d.laneIndex === laneIdx);
      return dhd &&
        dhd.participant &&
        !isPlaceholderParticipant(dhd.participant)
        ? dhd.participant.objectId
        : null;
    }),
  );

  return checkLaneEquality(
    track.lanes.length,
    driverIds,
    heats,
    driverNames,
    translationService,
  );
}

function performPartitionedLaneCheck(
  localParticipants: RaceParticipant[],
  localHeats: Heat[],
  track: Track,
  translationService: TranslationService,
  isStepUp: boolean,
  hasGroups: boolean,
  race?: Race,
): { allEqual: boolean; reports: LaneEqualityReportItem[] } {
  if (isStepUp) {
    inferBoundariesFromDrivers(localHeats);
    assignStepNumbers(localHeats, race?.step_up);
  }

  const buckets = partitionHeats(localHeats, isStepUp);
  const registeredParticipantIds = new Set(
    localParticipants.map((p) => p.objectId),
  );
  const reports: LaneEqualityReportItem[] = [];
  let allEqual = true;

  for (const bucket of buckets.values()) {
    const prefix = getBucketPrefix(
      bucket,
      hasGroups,
      isStepUp,
      buckets.size,
      race,
      translationService,
    );
    const result = evaluateStepBucket(
      bucket.heats,
      track,
      localHeats,
      registeredParticipantIds,
      translationService,
      prefix,
    );
    if (!result.allEqual) {
      allEqual = false;
      reports.push(...result.reports);
    }
  }

  if (allEqual && reports.length === 0) {
    return { allEqual: true, reports: [{ key: "AM_REPORT_ALL_EQUAL" }] };
  }
  return { allEqual: false, reports };
}

function partitionHeats(
  localHeats: Heat[],
  isStepUp: boolean,
): Map<string, { group: number; step: number; heats: Heat[] }> {
  const buckets = new Map<
    string,
    { group: number; step: number; heats: Heat[] }
  >();
  for (const h of localHeats) {
    const grp = h.group || 0;
    const stp = isStepUp ? h.step || 1 : 0;
    const key = `${grp}_${stp}`;
    if (!buckets.has(key)) {
      buckets.set(key, { group: grp, step: stp, heats: [] });
    }
    buckets.get(key)!.heats.push(h);
  }
  return buckets;
}

function getBucketPrefix(
  bucket: { group: number; step: number },
  hasGroups: boolean,
  isStepUp: boolean,
  bucketCount: number,
  race?: Race,
  translationService?: TranslationService,
): string {
  const { group, step } = bucket;
  if (hasGroups && isStepUp) {
    const groupName =
      getCustomGroupName(race, group) ||
      (translationService
        ? translationService.translate("DR_LABEL_GROUP", { group: group + 1 })
        : `Group ${group + 1}`);
    const stepName = translationService
      ? translationService.translate("RD_STEP_LADDER_STEP", { step })
      : `Step ${step}`;
    return `${groupName}, ${stepName}`;
  }
  if (hasGroups) {
    return (
      getCustomGroupName(race, group) ||
      (translationService
        ? translationService.translate("DR_LABEL_GROUP", { group: group + 1 })
        : `Group ${group + 1}`)
    );
  }
  if (isStepUp && bucketCount > 1) {
    return translationService
      ? translationService.translate("RD_STEP_LADDER_STEP", { step })
      : `Step ${step}`;
  }
  return "";
}

function checkStepEmptyHeats(
  stepHeats: Heat[],
  track: Track,
  localHeats: Heat[],
  prefix: string,
  reports: LaneEqualityReportItem[],
): boolean {
  let hasEmpty = false;
  for (const heat of stepHeats) {
    const isHeatEmpty = track.lanes.every((_, laneIdx) => {
      const dhd = heat.heatDrivers.find((d) => d.laneIndex === laneIdx);
      return (
        !dhd || !dhd.participant || isPlaceholderParticipant(dhd.participant)
      );
    });
    if (isHeatEmpty) {
      hasEmpty = true;
      reports.push({
        key: "AM_REPORT_EMPTY_HEAT",
        params: { heat: heat.heatNumber || localHeats.indexOf(heat) + 1 },
        prefix: prefix || undefined,
      });
    }
  }
  return hasEmpty;
}

interface StepDriversResult {
  stepDriverIds: string[];
  stepDriverNames: Map<string, string>;
  hasDuplicatesOrInvalid: boolean;
}

function collectAndValidateStepDrivers(
  stepHeats: Heat[],
  track: Track,
  localHeats: Heat[],
  registeredParticipantIds: Set<string>,
  translationService: TranslationService,
  prefix: string,
  reports: LaneEqualityReportItem[],
): StepDriversResult {
  const stepDriverIdSet = new Set<string>();
  const stepDriverIds: string[] = [];
  const stepDriverNames = new Map<string, string>();
  let hasDuplicatesOrInvalid = false;

  for (const heat of stepHeats) {
    const heatNum = heat.heatNumber || localHeats.indexOf(heat) + 1;
    const seenInThisHeat = new Set<string>();

    for (const laneIdx of track.lanes.keys()) {
      const dhd = heat.heatDrivers.find((d) => d.laneIndex === laneIdx);
      if (
        !dhd ||
        !dhd.participant ||
        isPlaceholderParticipant(dhd.participant)
      ) {
        continue;
      }
      const p = dhd.participant;
      const isStepUpPart = isStepUpParticipant(p);

      if (!isStepUpPart && !registeredParticipantIds.has(p.objectId)) {
        hasDuplicatesOrInvalid = true;
        reports.push({
          key: "AM_REPORT_INVALID_DRIVER",
          params: {
            heat: heatNum,
            driver: getParticipantName(p, translationService) || p.objectId,
          },
          prefix: prefix || undefined,
        });
      }

      const participantId = isStepUpPart
        ? `STEP_UP_${p.stepUpIndex || 1}`
        : p.objectId;

      if (seenInThisHeat.has(participantId)) {
        hasDuplicatesOrInvalid = true;
        reports.push({
          key: "AM_REPORT_LANE_DIFF",
          params: {
            lane: laneIdx + 1,
            d1: getParticipantName(p, translationService),
            count1: 2,
            heat1: translationService
              ? translationService.translate("AM_LABEL_HEAT_PLURAL")
              : "heats",
            d2: "",
            count2: 0,
            heat2: translationService
              ? translationService.translate("AM_LABEL_HEAT_PLURAL")
              : "heats",
          },
          prefix: prefix || undefined,
        });
      }
      seenInThisHeat.add(participantId);

      if (!stepDriverIdSet.has(participantId)) {
        stepDriverIdSet.add(participantId);
        stepDriverIds.push(participantId);
        stepDriverNames.set(
          participantId,
          getParticipantName(p, translationService),
        );
      }
    }
  }

  return { stepDriverIds, stepDriverNames, hasDuplicatesOrInvalid };
}

function checkStepMultiHeatEquality(
  stepHeats: Heat[],
  track: Track,
  localHeats: Heat[],
  stepDriverIds: string[],
  stepDriverNames: Map<string, string>,
  translationService: TranslationService,
  prefix: string,
  reports: LaneEqualityReportItem[],
): boolean {
  const stepGrid = stepHeats.map((h) =>
    track.lanes.map((_, laneIdx) => {
      const dhd = h.heatDrivers.find((d) => d.laneIndex === laneIdx);
      if (
        !dhd ||
        !dhd.participant ||
        isPlaceholderParticipant(dhd.participant)
      ) {
        return null;
      }
      const p = dhd.participant;
      return isStepUpParticipant(p)
        ? `STEP_UP_${p.stepUpIndex || 1}`
        : p.objectId;
    }),
  );

  const stepResult = checkLaneEquality(
    track.lanes.length,
    stepDriverIds,
    stepGrid,
    stepDriverNames,
    translationService,
  );

  if (!stepResult.allEqual) {
    for (const r of stepResult.reports) {
      if (
        r.key === "AM_REPORT_ALL_EQUAL" ||
        r.key === "AM_REPORT_EMPTY_HEAT" ||
        r.key === "AM_REPORT_INVALID_DRIVER"
      ) {
        continue;
      }
      if (r.params?.heat != null) {
        const localIdx = r.params.heat - 1;
        const actualHeat = stepHeats[localIdx];
        r.params.heat =
          actualHeat?.heatNumber || localHeats.indexOf(actualHeat) + 1;
      }
      if (prefix) {
        r.prefix = prefix;
      }
      reports.push(r);
    }
    return false;
  }
  return true;
}

function evaluateStepBucket(
  stepHeats: Heat[],
  track: Track,
  localHeats: Heat[],
  registeredParticipantIds: Set<string>,
  translationService: TranslationService,
  prefix: string,
): { allEqual: boolean; reports: LaneEqualityReportItem[] } {
  const reports: LaneEqualityReportItem[] = [];
  let allEqual = true;

  if (checkStepEmptyHeats(stepHeats, track, localHeats, prefix, reports)) {
    allEqual = false;
  }

  const { stepDriverIds, stepDriverNames, hasDuplicatesOrInvalid } =
    collectAndValidateStepDrivers(
      stepHeats,
      track,
      localHeats,
      registeredParticipantIds,
      translationService,
      prefix,
      reports,
    );

  if (hasDuplicatesOrInvalid) {
    allEqual = false;
  }

  if (stepDriverIds.length === 0) {
    allEqual = false;
    if (!reports.some((r) => r.key === "AM_REPORT_EMPTY_HEAT")) {
      reports.push({
        key: "AM_REPORT_NO_DRIVERS",
        prefix: prefix || undefined,
      });
    }
    return { allEqual, reports };
  }

  if (stepHeats.length > 1) {
    const multiHeatEqual = checkStepMultiHeatEquality(
      stepHeats,
      track,
      localHeats,
      stepDriverIds,
      stepDriverNames,
      translationService,
      prefix,
      reports,
    );
    if (!multiHeatEqual) {
      allEqual = false;
    }
  }

  return { allEqual, reports };
}
