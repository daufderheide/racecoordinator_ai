import { moveItemInArray } from "@angular/cdk/drag-drop";
import {
  UndoEventType,
  UndoManager,
} from "@app/components/shared/undo-redo-controls/undo-manager";
import { Driver } from "@app/models/driver";
import { Race } from "@app/models/race";
import { RaceParticipant } from "@app/models/race_participant";
import { Team } from "@app/models/team";
import { Track } from "@app/models/track";
import { IHeat, IRaceParticipant } from "@app/proto/antigravity";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { Heat } from "@app/race/heat";
import { TranslationService } from "@app/services/translation.service";
import { checkLaneEquality } from "@app/utils/lane-equality";
import { naturalSortCompare } from "@app/utils/sorting.utils";

export interface ModifyHeatsState {
  heats: Heat[];
  participants: RaceParticipant[];
}

export function areModifyHeatsStatesEqual(
  a: ModifyHeatsState,
  b: ModifyHeatsState,
): boolean {
  const heatsMatch =
    a.heats.length === b.heats.length &&
    a.heats.every((h, i) => {
      const otherH = b.heats[i];
      return (
        h.objectId === otherH.objectId &&
        h.group === otherH.group &&
        h.heatDrivers.length === otherH.heatDrivers.length &&
        h.heatDrivers.every((dhd, j) => {
          const otherDhd = otherH.heatDrivers[j];
          return (
            dhd.laneIndex === otherDhd.laneIndex &&
            dhd.participant.objectId === otherDhd.participant.objectId
          );
        })
      );
    });

  const participantsMatch =
    a.participants.length === b.participants.length &&
    a.participants.every((p, i) => p.objectId === b.participants[i].objectId);

  return heatsMatch && participantsMatch;
}

export function filterDriverPool(
  localParticipants: RaceParticipant[],
): RaceParticipant[] {
  return localParticipants.filter((p) => {
    const isPlaceholder = Driver.isEmpty(p.driver) && !p.team;
    return !isPlaceholder;
  });
}

export function filterDatabaseParticipants(
  localParticipants: RaceParticipant[],
  allDrivers: Driver[],
  allTeams: Team[],
): {
  databaseDrivers: Driver[];
  databaseTeams: Team[];
  databaseParticipants: (Driver | Team)[];
} {
  const participantDriverIds = new Set<string>();
  const participantTeamIds = new Set<string>();

  localParticipants.forEach((p) => {
    const dId = p.driver?.entity_id;
    if (dId && dId !== "EMPTY_LANE") {
      participantDriverIds.add(dId);
    }
    const team = p.team;
    const tId = team?.entity_id;
    if (tId && team) {
      participantTeamIds.add(tId);
      const driverIds = team.driverIds || (team as any).driver_ids || [];
      driverIds.forEach((id: string) => participantDriverIds.add(id));
    }
  });

  const databaseDrivers = allDrivers.filter((d) => {
    const id = d.entity_id;
    return id && id !== "EMPTY_LANE" && !participantDriverIds.has(id);
  });

  const databaseTeams = allTeams.filter((t) => {
    const id = t.entity_id || t.objectId || (t as any).entityId;
    if (id && participantTeamIds.has(id)) return false;
    const driverIds = (t as any).driver_ids || t.driverIds || [];
    return !driverIds.some((dId: string) => participantDriverIds.has(dId));
  });

  const databaseParticipants: (Driver | Team)[] = [
    ...databaseDrivers,
    ...databaseTeams,
  ];
  databaseParticipants.sort((a, b) => naturalSortCompare(a.name, b.name));

  return { databaseDrivers, databaseTeams, databaseParticipants };
}

export function buildDropListConnections(
  heatCount: number,
  laneCount: number,
): string[] {
  const ids: string[] = ["driver-pool", "database-drivers"];
  for (let hIdx = 0; hIdx < heatCount; hIdx++) {
    for (let lIdx = 0; lIdx < laneCount; lIdx++) {
      ids.push(`heat-${hIdx}-lane-${lIdx}`);
    }
  }
  return ids;
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
  const id = driver.entity_id;
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
    0,
    0,
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
    0,
    0,
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

export function getParticipantKey(
  participant: RaceParticipant | null | undefined,
): string {
  if (!participant) return "";
  return participant.objectId || participant.driver?.entity_id || "";
}

export const DRIVER_HIGHLIGHT_PALETTE: readonly string[] = [
  "#f59e0b", // Amber
  "#06b6d4", // Electric Cyan
  "#ec4899", // Neon Pink
  "#10b981", // Emerald Green
  "#a855f7", // Vivid Purple
  "#f97316", // Radiant Orange
  "#3b82f6", // Electric Blue
  "#84cc16", // Lime Green
  "#f43f5e", // Crimson Rose
  "#14b8a6", // Teal
  "#eab308", // Golden Yellow
  "#7c3aed", // Deep Violet
  "#fb7185", // Coral Pink
  "#38bdf8", // Sky Blue
  "#34d399", // Mint Green
  "#d946ef", // Vibrant Magenta
];

export function allocateHighlightColor(usedColors: Set<string>): string {
  const normalized = new Set(
    Array.from(usedColors).map((c) => c.toLowerCase()),
  );
  for (const color of DRIVER_HIGHLIGHT_PALETTE) {
    if (!normalized.has(color.toLowerCase())) {
      return color;
    }
  }
  let index = usedColors.size;
  while (true) {
    const hue = Math.round((index * 137.508) % 360);
    const generated = `hsl(${hue}, 90%, 55%)`;
    if (!normalized.has(generated.toLowerCase())) {
      return generated;
    }
    index++;
  }
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
        model: { entityId: p.driver.entity_id },
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
        if (!dhd.participant || Driver.isEmpty(dhd.participant.driver)) {
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
        if (!p || Driver.isEmpty(p.driver)) continue;

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

export type HeatDropAction =
  | { type: "swap"; targetIndex: number }
  | { type: "insert"; slotIndex: number }
  | null;

export interface HeatCardRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
}

export interface HeatCardBounds {
  index: number;
  rect: DOMRect | HeatCardRect;
  started?: boolean;
}

export function calculateHeatDropAction(
  pointerX: number,
  pointerY: number,
  cards: HeatCardBounds[],
  lastStartedIdx: number = -1,
): HeatDropAction {
  if (!cards || cards.length === 0) return null;

  // Group cards into rows based on vertical alignment (cards with similar top within 30px)
  const sorted = [...cards].sort(
    (a, b) => a.rect.top - b.rect.top || a.rect.left - b.rect.left,
  );
  const rows: HeatCardBounds[][] = [];
  for (const card of sorted) {
    const existingRow = rows.find(
      (r) => Math.abs(r[0].rect.top - card.rect.top) < 30,
    );
    if (existingRow) {
      existingRow.push(card);
    } else {
      rows.push([card]);
    }
  }

  for (const row of rows) {
    row.sort((a, b) => a.rect.left - b.rect.left);
  }

  // Find the row that best matches pointerY
  let bestRow = rows[0];
  let minRowDist = Infinity;
  for (const row of rows) {
    const rowTop = row[0].rect.top;
    const rowBottom = row[0].rect.bottom;
    if (pointerY >= rowTop - 25 && pointerY <= rowBottom + 25) {
      bestRow = row;
      minRowDist = 0;
      break;
    }
    const rowCenterY = (rowTop + rowBottom) / 2;
    const dist = Math.abs(pointerY - rowCenterY);
    if (dist < minRowDist) {
      minRowDist = dist;
      bestRow = row;
    }
  }

  // In bestRow, determine action based on pointerX
  const firstCard = bestRow[0];
  const lastCard = bestRow[bestRow.length - 1];

  // If pointer is to the left of the first card in the row
  if (pointerX < firstCard.rect.left) {
    const slotIdx = firstCard.index;
    return slotIdx > lastStartedIdx
      ? { type: "insert", slotIndex: slotIdx }
      : null;
  }

  // If pointer is to the right of the last card in the row
  if (pointerX > lastCard.rect.right) {
    const slotIdx = lastCard.index + 1;
    return slotIdx > lastStartedIdx
      ? { type: "insert", slotIndex: slotIdx }
      : null;
  }

  // Check each card and gap in the row
  for (let i = 0; i < bestRow.length; i++) {
    const card = bestRow[i];
    const width = card.rect.width;

    // Check inside card
    if (pointerX >= card.rect.left && pointerX <= card.rect.right) {
      if (pointerX < card.rect.left + width * 0.2) {
        // Left 20% -> Insert before this card
        const slotIdx = card.index;
        return slotIdx > lastStartedIdx
          ? { type: "insert", slotIndex: slotIdx }
          : null;
      }
      if (pointerX > card.rect.right - width * 0.2) {
        // Right 20% -> Insert after this card
        const slotIdx = card.index + 1;
        return slotIdx > lastStartedIdx
          ? { type: "insert", slotIndex: slotIdx }
          : null;
      }
      // Middle 60% -> Swap with this card
      if (card.index > lastStartedIdx && !card.started) {
        return { type: "swap", targetIndex: card.index };
      }
      return null;
    }

    // Check gap between this card and the next card in the row
    if (i < bestRow.length - 1) {
      const nextCard = bestRow[i + 1];
      if (pointerX > card.rect.right && pointerX < nextCard.rect.left) {
        // Between card and nextCard -> slot index is nextCard.index
        const slotIdx = nextCard.index;
        return slotIdx > lastStartedIdx
          ? { type: "insert", slotIndex: slotIdx }
          : null;
      }
    }
  }

  return null;
}

export function executeHeatReorder(
  heats: Heat[],
  fromIdx: number,
  action: HeatDropAction,
  lastStartedIdx: number = -1,
): { reordered: boolean; newHeats: Heat[] } {
  if (!action || fromIdx < 0 || fromIdx >= heats.length) {
    return { reordered: false, newHeats: heats };
  }

  const heatToMove = heats[fromIdx];
  if (fromIdx <= lastStartedIdx || heatToMove.started) {
    return { reordered: false, newHeats: heats };
  }

  const updatedHeats = [...heats];

  if (action.type === "swap") {
    const toIdx = action.targetIndex;
    if (toIdx === fromIdx || toIdx < 0 || toIdx >= updatedHeats.length) {
      return { reordered: false, newHeats: heats };
    }
    const targetHeat = updatedHeats[toIdx];
    if (toIdx <= lastStartedIdx || targetHeat.started) {
      return { reordered: false, newHeats: heats };
    }

    const temp = updatedHeats[fromIdx];
    updatedHeats[fromIdx] = updatedHeats[toIdx];
    updatedHeats[toIdx] = temp;
  } else if (action.type === "insert") {
    const slotIdx = action.slotIndex;
    if (
      slotIdx <= lastStartedIdx ||
      slotIdx < 0 ||
      slotIdx > updatedHeats.length
    ) {
      return { reordered: false, newHeats: heats };
    }

    const targetIdx = fromIdx < slotIdx ? slotIdx - 1 : slotIdx;
    if (targetIdx === fromIdx) {
      return { reordered: false, newHeats: heats };
    }

    moveItemInArray(updatedHeats, fromIdx, targetIdx);
  }

  // Renumber heats to maintain order
  updatedHeats.forEach((h, i) => (h.heatNumber = i + 1));
  return { reordered: true, newHeats: updatedHeats };
}

export function isParticipantInStartedHeat(
  participant: RaceParticipant,
  heats: Heat[],
  isHeatStarted: (heat: Heat) => boolean,
): boolean {
  for (const heat of heats) {
    if (isHeatStarted(heat)) {
      const isInHeat = heat.heatDrivers?.some(
        (dhd) => dhd.participant.objectId === participant.objectId,
      );
      if (isInHeat) {
        return true;
      }
    }
  }
  return false;
}

export function getLastStartedHeatIndex(
  heats: Heat[],
  isHeatStarted: (heat: Heat) => boolean,
): number {
  let lastStartedIdx = -1;
  for (let i = 0; i < heats.length; i++) {
    if (isHeatStarted(heats[i])) {
      lastStartedIdx = i;
    }
  }
  return lastStartedIdx;
}

export function calculateHeatCardHoverAction(
  index: number,
  rect: DOMRect,
  clientX: number,
  lastStartedIdx: number,
  targetHeat: Heat,
  isHeatStarted: (heat: Heat) => boolean,
): HeatDropAction {
  const x = clientX - rect.left;
  const ratio = rect.width > 0 ? x / rect.width : 0.5;

  if (ratio < 0.2) {
    if (index > lastStartedIdx) {
      return { type: "insert", slotIndex: index };
    }
  } else if (ratio > 0.8) {
    if (index + 1 > lastStartedIdx) {
      return { type: "insert", slotIndex: index + 1 };
    }
  } else {
    if (!isHeatStarted(targetHeat) && index > lastStartedIdx) {
      return { type: "swap", targetIndex: index };
    }
  }
  return null;
}

export function collectHeatCardBounds(
  heats: Heat[],
  isHeatStarted: (heat: Heat) => boolean,
): HeatCardBounds[] {
  const cardEls = Array.from(
    document.querySelectorAll(
      ".heats-grid .heat-card:not(.cdk-drag-placeholder):not(.cdk-drag-preview)",
    ),
  ) as HTMLElement[];

  const bounds: HeatCardBounds[] = [];
  for (const el of cardEls) {
    const idxAttr = el.getAttribute("data-heat-idx");
    const idx = idxAttr ? parseInt(idxAttr, 10) : -1;
    if (idx !== -1 && idx < heats.length) {
      bounds.push({
        index: idx,
        rect: el.getBoundingClientRect(),
        started: isHeatStarted(heats[idx]),
      });
    }
  }
  return bounds;
}

export function performLaneCheck(
  localParticipants: RaceParticipant[],
  localHeats: Heat[],
  track: Track,
  translationService: TranslationService,
): { allEqual: boolean; reports: any[] } {
  const activeParticipants = localParticipants.filter(
    (p) => p.driver && !p.driver.isEmpty(),
  );
  const driverIds = activeParticipants.map((p) => p.objectId);
  const driverNames = new Map<string, string>();
  activeParticipants.forEach((p) => {
    driverNames.set(p.objectId, getParticipantName(p));
  });

  const heats = localHeats.map((h) =>
    track.lanes.map((_, laneIdx) => {
      const dhd = h.heatDrivers.find((d) => d.laneIndex === laneIdx);
      return dhd &&
        dhd.participant &&
        dhd.participant.driver &&
        !dhd.participant.driver.isEmpty()
        ? dhd.participant.objectId
        : null;
    }),
  );

  const result = checkLaneEquality(
    track.lanes.length,
    driverIds,
    heats,
    driverNames,
    translationService,
  );
  return { allEqual: result.allEqual, reports: result.reports };
}

export function revertSaveFailure(
  triggeredBy: UndoEventType,
  undoManager: UndoManager<ModifyHeatsState>,
): void {
  if (triggeredBy === "undo") {
    undoManager.redo();
    undoManager.popUndo();
  } else if (triggeredBy === "redo") {
    undoManager.undo();
    undoManager.popRedo();
  } else {
    undoManager.undo();
    undoManager.clearRedo();
  }
}

export function getContrastTextColor(hexColor: string): string {
  if (!hexColor) return "#0f172a";
  let color = hexColor.trim();
  if (color.startsWith("#")) {
    color = color.substring(1);
    if (color.length === 3) {
      color = color
        .split("")
        .map((c) => c + c)
        .join("");
    }
    const r = parseInt(color.substring(0, 2), 16) || 0;
    const g = parseInt(color.substring(2, 4), 16) || 0;
    const b = parseInt(color.substring(4, 6), 16) || 0;
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? "#0f172a" : "#ffffff";
  }
  const hslMatch = color.match(/hsl\(\s*\d+\s*,\s*\d+%\s*,\s*(\d+)%\s*\)/i);
  if (hslMatch) {
    const lightness = parseInt(hslMatch[1], 10);
    return lightness >= 50 ? "#0f172a" : "#ffffff";
  }
  return "#0f172a";
}
