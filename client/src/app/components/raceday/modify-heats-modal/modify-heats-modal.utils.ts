import { Driver } from "@app/models/driver";
import { Race } from "@app/models/race";
import { RaceParticipant } from "@app/models/race_participant";
import { Team } from "@app/models/team";
import { Track } from "@app/models/track";
import { IHeat, IRaceParticipant } from "@app/proto/antigravity";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { Heat } from "@app/race/heat";
import { TranslationService } from "@app/services/translation.service";

export interface ModifyHeatsState {
  heats: Heat[];
  participants: RaceParticipant[];
}

export function cloneHeat(heat: Heat): Heat {
  const clonedDrivers = heat.heatDrivers.map((dhd: DriverHeatData) => {
    if (!dhd) return null;
    const newDhd = new DriverHeatData(
      dhd.objectId,
      dhd.participant,
      dhd.laneIndex,
      dhd.actualDriver,
    );
    newDhd.reactionTime = dhd.reactionTime;
    newDhd.addLapTime(0, 0, 0, 0, 0, dhd.lapTimes.length, "", false);
    return newDhd;
  });
  const validDrivers = clonedDrivers.filter(
    (d: DriverHeatData | null): d is DriverHeatData => d !== null,
  );
  const newHeat = new Heat(
    heat.objectId,
    heat.heatNumber,
    validDrivers,
    [...heat.standings],
    heat.started,
  );
  newHeat.group = heat.group;
  return newHeat;
}

export function createParticipantFromDriver(driver: Driver): RaceParticipant {
  const id = driver.entity_id || driver.objectId || (driver as any).entityId;
  return new RaceParticipant(
    `new-driver-${id}-${Math.random().toString(36).substring(7)}`,
    driver,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    100,
  );
}

export function createParticipantFromTeam(team: Team): RaceParticipant {
  const id = team.entity_id || team.objectId || (team as any).entityId;
  return new RaceParticipant(
    `new-team-${id}-${Math.random().toString(36).substring(7)}`,
    new Driver("EMPTY_LANE", "Empty", "Empty"),
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    100,
    team,
  );
}

export function isDriver(data: any): data is Driver {
  return (
    data instanceof Driver || ("nickname" in data && !("driverIds" in data))
  );
}

export function isTeam(data: any): data is Team {
  return data instanceof Team || "driverIds" in data;
}

export function getParticipantName(participant: RaceParticipant): string {
  if (participant.team) {
    return participant.team.name;
  }
  return participant.driver.name;
}

export function getParticipantMeta(
  p: RaceParticipant,
  translationService: TranslationService,
): string {
  if (p.team) {
    return `${p.team.driverIds.length} ${translationService.translate("RDS_TEAM_DRIVERS")}`;
  }
  return p.driver.nickname || p.driver.name;
}

export function getDatabaseItemTrackId(item: Driver | Team): string {
  const prefix = isDriver(item) ? "driver_" : "team_";
  const id =
    (item as any).entity_id ||
    (item as any).objectId ||
    (item as any).entityId ||
    "";
  return prefix + id;
}

export function getParticipantAvatar(
  participant: RaceParticipant,
): string | undefined {
  if (participant.team) {
    return participant.team.avatarUrl;
  }
  return participant.driver.avatarUrl;
}

export function validateGroupSequence(_heats: Heat[]): {
  isValid: boolean;
  expected?: number;
  found?: number;
} {
  return { isValid: true };
}

export function convertHeatsToProto(
  heats: Heat[],
  track: Track,
  isHeatStarted: (h: Heat) => boolean,
): IHeat[] {
  return heats.map((h: Heat) => {
    const heatDrivers: any[] = [];
    const laneCount = track?.lanes?.length || 0;
    for (let i = 0; i < laneCount; i++) {
      const dhd = h.heatDrivers.find((d) => d.laneIndex === i);
      if (dhd) {
        heatDrivers.push({
          objectId: dhd.objectId,
          driver: { objectId: dhd.participant.objectId } as any,
        });
      } else {
        heatDrivers.push({
          objectId: `empty-lane-${i}-${h.objectId}`,
          driver: { objectId: "" } as any,
        });
      }
    }

    return {
      objectId: h.objectId,
      heatNumber: h.heatNumber,
      heatDrivers: heatDrivers,
      started: isHeatStarted(h),
      standings: h.standings,
      group: h.group,
    } as IHeat;
  });
}

export function convertParticipantsToProto(
  participants: RaceParticipant[],
): IRaceParticipant[] {
  return participants.map((p: RaceParticipant) => {
    const proto: IRaceParticipant = {
      objectId: p.objectId,
      driver: {
        name: p.driver.name,
        nickname: p.driver.nickname,
        avatarUrl: p.driver.avatarUrl,
        model: { entityId: p.driver.entity_id || p.driver.objectId },
      },
      seed: p.seed,
    };
    if (p.team) {
      proto.team = {
        name: p.team.name,
        avatarUrl: p.team.avatarUrl,
        model: { entityId: p.team.entity_id || p.team.objectId },
        driverIds: p.team.driverIds,
      };
    }
    return proto;
  });
}

export function getModifyHeatsValidationError(
  localHeats: Heat[],
  originalHeats: Heat[],
  localParticipants: RaceParticipant[],
  race: Race | undefined,
  isHeatStarted: (h: Heat) => boolean,
  translationService: TranslationService,
): string | null {
  // 1. Check if any started heat was modified
  for (const localH of localHeats) {
    const originalH = originalHeats.find((h) => h.objectId === localH.objectId);
    if (originalH && isHeatStarted(originalH)) {
      if (localH.heatDrivers.length !== originalH.heatDrivers.length) {
        return translationService.translate("RD_ERR_STARTED_HEAT_MODIFIED");
      }
      for (let i = 0; i < localH.heatDrivers.length; i++) {
        const localDhd = localH.heatDrivers[i];
        const originalDhd = originalH.heatDrivers.find(
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

  // 2. Check if any participant who was in a started heat was removed from the race
  for (const originalH of originalHeats) {
    if (isHeatStarted(originalH)) {
      for (const dhd of originalH.heatDrivers) {
        // Skip empty lanes
        if (
          !dhd.participant ||
          dhd.participant.driver.objectId === "EMPTY_LANE"
        ) {
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

  // 3. Group Validation
  if (race && race.group_options && race.group_options.enabled) {
    const participantGroups = new Map<string, number>();
    for (const h of localHeats) {
      for (const dhd of h.heatDrivers) {
        const p = dhd.participant;
        if (!p || p.objectId === "EMPTY_LANE" || p.objectId === "") continue;

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
  }

  return null;
}
