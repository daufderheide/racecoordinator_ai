import { Driver } from "@app/models/driver";
import { DriverLabel } from "@app/models/driver-label";
import { Team } from "@app/models/team";
import { ParticipantValidationService } from "@app/services/participant-validation.service";
import { TranslationService } from "@app/services/translation.service";
import { naturalSortCompare } from "@app/utils/sorting.utils";

export type Participant = Driver | Team;

export function isDriver(
  participant: Participant | undefined,
): participant is Driver {
  return (
    !!participant &&
    (participant instanceof Driver || "nickname" in participant)
  );
}

export function isTeam(
  participant: Participant | undefined,
): participant is Team {
  return (
    !!participant && (participant instanceof Team || "driverIds" in participant)
  );
}

export function getDriver(
  participant: Participant | undefined,
): Driver | undefined {
  return participant instanceof Driver ? participant : undefined;
}

export function getTeam(
  participant: Participant | undefined,
): Team | undefined {
  return participant instanceof Team ? participant : undefined;
}

export function getParticipantUniqueId(participant: Participant): string {
  return (isDriver(participant) ? "d_" : "t_") + participant.entity_id;
}

export function getParticipantAvatarUrl(
  participant: Participant,
  serverUrl: string,
): string {
  if (!participant.avatarUrl) return "";
  if (participant.avatarUrl.startsWith("/")) {
    return `${serverUrl}${participant.avatarUrl}`;
  }
  return participant.avatarUrl;
}

export function getLocalizedName(
  participant: Participant,
  translationService: TranslationService,
): string {
  if (
    (participant.name === "Empty" || participant.name === "Unknown") &&
    (!participant.entity_id ||
      participant.entity_id === "" ||
      participant.entity_id === "empty")
  ) {
    return translationService.translate("RD_EMPTY_LANE");
  }
  return participant.name || "";
}

export function getLocalizedNickname(
  participant: Participant,
  translationService: TranslationService,
): string {
  if (isDriver(participant)) {
    if (
      (participant.nickname === "Empty" ||
        participant.name === "Empty" ||
        participant.name === "Unknown") &&
      (!participant.entity_id ||
        participant.entity_id === "" ||
        participant.entity_id === "empty")
    ) {
      return translationService.translate("RD_EMPTY_LANE");
    }
    return participant.nickname || participant.name || "";
  }
  return "";
}

export function getLocalizedTeamMembers(
  participant: Participant,
  translationService: TranslationService,
): string {
  if (isTeam(participant)) {
    return `${participant.driverIds.length} ${translationService.translate("RDS_TEAM_DRIVERS")}`;
  }
  return "";
}

export function participantHasLabel(
  participant: Participant,
  labelId: string,
  allDrivers: Driver[],
): boolean {
  if (!labelId) return true;
  if ((participant?.labelIds || []).includes(labelId)) {
    return true;
  }
  if (isDriver(participant)) {
    return false;
  }
  const team = participant as Team;
  if (!team.driverIds || team.driverIds.length === 0) return false;
  return team.driverIds.some((dId) => {
    const d = allDrivers.find(
      (driver) =>
        driver.entity_id === dId ||
        driver.entity_id === dId.replace(/^d_/, "") ||
        driver.entity_id === `d_${dId}`,
    );
    return !!d && (d.labelIds || []).includes(labelId);
  });
}

export function getParticipantLabels(
  participant: Participant,
  allDrivers: Driver[],
  driverLabels: DriverLabel[],
): DriverLabel[] {
  const ids = new Set(participant?.labelIds || []);
  if (!isDriver(participant)) {
    const team = participant as Team;
    (team.driverIds || []).forEach((dId) => {
      const d = allDrivers.find(
        (driver) =>
          driver.entity_id === dId ||
          driver.entity_id === dId.replace(/^d_/, "") ||
          driver.entity_id === `d_${dId}`,
      );
      (d?.labelIds || []).forEach((lId) => ids.add(lId));
    });
  }
  return driverLabels.filter((l) => ids.has(l.entity_id));
}

export function naturalSortParticipants(
  a: Participant,
  b: Participant,
): number {
  return naturalSortCompare(a.name || "", b.name || "");
}

export function sortFilteredParticipants(
  participants: Participant[],
  lowerQuery: string,
  translationService: TranslationService,
): Participant[] {
  return [...participants].sort((a, b) => {
    const aName = getLocalizedName(a, translationService).toLowerCase();
    const aNick = getLocalizedNickname(a, translationService).toLowerCase();
    const bName = getLocalizedName(b, translationService).toLowerCase();
    const bNick = getLocalizedNickname(b, translationService).toLowerCase();

    const aExact = aName === lowerQuery || aNick === lowerQuery;
    const bExact = bName === lowerQuery || bNick === lowerQuery;
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;

    const aStarts =
      aName.startsWith(lowerQuery) || aNick.startsWith(lowerQuery);
    const bStarts =
      bName.startsWith(lowerQuery) || bNick.startsWith(lowerQuery);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;

    return 0;
  });
}

export function filterParticipants(
  pool: Participant[],
  labelIds: string[],
  matchMode: "any" | "all",
  searchQuery: string,
  allDrivers: Driver[],
  translationService: TranslationService,
): Participant[] {
  let filtered = pool;
  if (labelIds.length > 0) {
    filtered = filtered.filter((p) => {
      if (matchMode === "all") {
        return labelIds.every((id) => participantHasLabel(p, id, allDrivers));
      }
      return labelIds.some((id) => participantHasLabel(p, id, allDrivers));
    });
  }
  if (!searchQuery) return filtered;
  const lowerQuery = searchQuery.trim().toLowerCase();
  if (!lowerQuery) return filtered;
  const matches = filtered.filter((p) => {
    const name = getLocalizedName(p, translationService).toLowerCase();
    const nickname = getLocalizedNickname(p, translationService).toLowerCase();
    return name.includes(lowerQuery) || nickname.includes(lowerQuery);
  });
  return sortFilteredParticipants(matches, lowerQuery, translationService);
}

export function computeUnselectedParticipants(
  selectedParticipants: Participant[],
  allDrivers: Driver[],
  allTeams: Team[],
): Participant[] {
  const selectedDriverIds = new Set<string>();
  const selectedTeamIds = new Set<string>();

  selectedParticipants.forEach((p) => {
    if (isDriver(p)) {
      selectedDriverIds.add(p.entity_id);
    } else if (isTeam(p)) {
      selectedTeamIds.add(p.entity_id);
      p.driverIds.forEach((id) => selectedDriverIds.add(id));
    }
  });

  const availableDrivers = allDrivers.filter((d) => {
    return !selectedDriverIds.has(d.entity_id);
  });

  const availableTeams = allTeams.filter((t) => {
    if (selectedTeamIds.has(t.entity_id)) return false;
    return !t.driverIds.some((dId) => selectedDriverIds.has(dId));
  });

  return [...availableDrivers, ...availableTeams].sort((a, b) =>
    naturalSortParticipants(a, b),
  );
}

export function extractEligibleTeamsForAddAll(
  unselectedTeams: Participant[],
  currentSelected: Participant[],
  driversBeingAdded: Participant[],
  validationService: ParticipantValidationService,
  allTeams: Team[],
  allDrivers: Driver[],
): Participant[] {
  const selectedDriverIds = new Set<string>();
  const selectedTeamIds = new Set<string>();

  const recordDriverId = (id: string) => {
    if (!id) return;
    const raw = id.replace(/^d_/, "");
    selectedDriverIds.add(id);
    selectedDriverIds.add(raw);
    selectedDriverIds.add(`d_${raw}`);
  };

  [...currentSelected, ...driversBeingAdded].forEach((p) => {
    if (isDriver(p)) {
      recordDriverId(p.entity_id);
    } else if (isTeam(p)) {
      selectedTeamIds.add(p.entity_id);
      (p.driverIds || []).forEach((id) => recordDriverId(id));
    }
  });

  const eligibleTeams: Participant[] = [];
  for (const team of unselectedTeams) {
    if (!isTeam(team) || selectedTeamIds.has(team.entity_id)) continue;
    const hasConflict = (team.driverIds || []).some((dId) =>
      selectedDriverIds.has(dId),
    );
    if (hasConflict) continue;

    const potentialParticipants = [
      ...currentSelected,
      ...driversBeingAdded,
      ...eligibleTeams,
      team,
    ];
    const validationResult = validationService.validate(
      potentialParticipants,
      allTeams,
      allDrivers,
    );
    if (validationResult.isValid) {
      eligibleTeams.push(team);
      selectedTeamIds.add(team.entity_id);
      (team.driverIds || []).forEach((id) => recordDriverId(id));
    }
  }

  return eligibleTeams;
}

export function randomizeParticipantsList(
  participants: Participant[],
): Participant[] {
  const shuffled = [...participants];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function navigateParticipantList(
  list: Participant[],
  currentParticipant: Participant | null,
  currentIndex: number,
  isDown: boolean,
): { nextIndex: number; selected: Participant | null } {
  if (list.length === 0) {
    return { nextIndex: 0, selected: null };
  }

  let idx = -1;
  if (currentParticipant) {
    idx = list.findIndex(
      (p) =>
        getParticipantUniqueId(p) ===
        getParticipantUniqueId(currentParticipant),
    );
  }
  if (idx === -1) {
    idx = Math.min(Math.max(0, currentIndex), list.length - 1);
  }

  const nextIndex = isDown
    ? Math.min(idx + 1, list.length - 1)
    : Math.max(idx - 1, 0);

  return { nextIndex, selected: list[nextIndex] || null };
}
