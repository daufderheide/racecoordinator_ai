import { CdkDrag, CdkDragDrop, CdkDropList } from "@angular/cdk/drag-drop";
import { ChangeDetectorRef } from "@angular/core";
import { DomSanitizer, SafeStyle } from "@angular/platform-browser";
import { DriverConverter } from "@app/converters/driver.converter";
import { HeatConverter } from "@app/converters/heat.converter";
import { TeamConverter } from "@app/converters/team.converter";
import { Driver } from "@app/models/driver";
import { Race } from "@app/models/race";
import { RaceParticipant } from "@app/models/race_participant";
import { Team } from "@app/models/team";
import { Track } from "@app/models/track";
import { IHeat, IRaceParticipant } from "@app/proto/antigravity";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { Heat } from "@app/race/heat";
import { TranslationService } from "@app/services/translation.service";

import {
  allocateHighlightColor,
  assignStepNumbers,
  calculateHeatCardHoverAction,
  calculateHeatDropAction,
  cloneHeat,
  collectHeatCardBounds,
  convertHeatsToProto,
  convertParticipantsToProto,
  createParticipantFromDriver,
  createParticipantFromTeam,
  executeHeatReorder,
  getHeatHighlightColors as extractHeatHighlightColors,
  getParticipantKey,
  getParticipantMeta,
  getParticipantName,
  HeatCardBounds,
  HeatDropAction,
  isDriver,
  isPlaceholderParticipant,
  isStepUpParticipant,
  isTeam,
} from "./modify-heats-modal.utils";

export class DriverHighlightManager {
  readonly highlightedDrivers = new Map<string, string>();

  constructor(private cdr: ChangeDetectorRef) {}

  isDriverHighlighted(
    participant: RaceParticipant | null | undefined,
  ): boolean {
    if (!participant) return false;
    const key = getParticipantKey(participant);
    return key !== "" && this.highlightedDrivers.has(key);
  }

  getDriverHighlightColor(
    participant: RaceParticipant | null | undefined,
  ): string | null {
    if (!participant) return null;
    const key = getParticipantKey(participant);
    return key !== "" ? (this.highlightedDrivers.get(key) ?? null) : null;
  }

  toggleDriverHighlight(
    participant: RaceParticipant | null | undefined,
    event?: MouseEvent,
  ): void {
    if (event) {
      event.stopPropagation();
      if (event.button !== 0) return;
    }
    if (!participant) return;
    const key = getParticipantKey(participant);
    if (!key) return;

    if (this.highlightedDrivers.has(key)) {
      this.highlightedDrivers.delete(key);
    } else {
      const usedColors = new Set(
        Array.from(this.highlightedDrivers.values()).map((c) =>
          c.toLowerCase(),
        ),
      );
      const color = allocateHighlightColor(usedColors);
      this.highlightedDrivers.set(key, color);
    }
    this.cdr.markForCheck();
  }

  clearDriverHighlights(): void {
    this.highlightedDrivers.clear();
    this.cdr.markForCheck();
  }

  hasHighlightedDrivers(): boolean {
    return this.highlightedDrivers.size > 0;
  }

  isHeatHighlighted(heat: Heat): boolean {
    if (this.highlightedDrivers.size === 0) return false;
    return heat.heatDrivers.some((dhd) =>
      this.isDriverHighlighted(dhd.participant),
    );
  }

  getHeatHighlightColors(heat: Heat): string[] {
    if (this.highlightedDrivers.size === 0) return [];
    return extractHeatHighlightColors(heat, (p) =>
      this.getDriverHighlightColor(p),
    );
  }

  removeDriver(key: string): void {
    if (key && this.highlightedDrivers.has(key)) {
      this.highlightedDrivers.delete(key);
    }
  }
}

export function createStepUpPool(stepUp: number): RaceParticipant[] {
  if (stepUp <= 0) {
    return [];
  }
  const pool: RaceParticipant[] = [];
  for (let s = 0; s < stepUp; s++) {
    const p = createParticipantFromDriver(
      new Driver(`Step-Up ${s + 1}`, `Step-Up ${s + 1}`, `STEP_UP_${s}`),
    );
    p.objectId = `STEP_UP_${s}`;
    p.isStepUp = true;
    p.stepUpIndex = s + 1;
    pool.push(p);
  }
  return pool;
}

export function getDropdownArrowBg(
  sanitizer: DomSanitizer,
  color: string,
): SafeStyle {
  const encodedColor = encodeURIComponent(color);
  const svg = `data:image/svg+xml;utf8,<svg fill="%23${encodedColor.replace(/^%23/, "")}" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/><path d="M0 0h24v24H0z" fill="none"/></svg>`;
  return sanitizer.bypassSecurityTrustStyle(`url('${svg}')`);
}

export function getHeatDriverMeta(
  dhd: DriverHeatData,
  translationService: TranslationService,
): string {
  if (dhd.participant && dhd.participant.team) {
    const actual = dhd.actualDriver;
    if (actual && !actual.isEmpty()) {
      return actual.nickname || actual.name;
    }
    return (
      dhd.participant.driver?.nickname || dhd.participant.driver?.name || ""
    );
  }
  return getParticipantMeta(dhd.participant, translationService);
}

export function calculateStepUpPool(
  localHeats: Heat[],
  configuredStepUp: number,
  trackLanes: number,
  isStepUpEnabled: boolean,
): RaceParticipant[] {
  let count = configuredStepUp || 0;
  if (isStepUpEnabled) {
    count = Math.max(count, trackLanes - 1);
    for (const h of localHeats) {
      for (const dhd of h.heatDrivers || []) {
        if (isStepUpParticipant(dhd.participant)) {
          if (
            dhd.participant.stepUpIndex &&
            dhd.participant.stepUpIndex > count
          ) {
            count = dhd.participant.stepUpIndex;
          }
          const match =
            dhd.participant.objectId?.match(/step_up_(\d+)/i) ||
            dhd.participant.driver?.entity_id?.match(/step_up_(\d+)/i);
          if (match) {
            const idx = parseInt(match[1], 10) + 1;
            if (idx > count) count = idx;
          }
        }
      }
    }
  }
  return createStepUpPool(count);
}

export function applyTeammateChange(
  heats: Heat[],
  heatIdx: number,
  dhd: DriverHeatData,
  selectedDriverId: string,
  allDrivers: Driver[],
): boolean {
  const driver = allDrivers.find((d) => d.entity_id === selectedDriverId);
  if (!driver) return false;
  const newDhd = new DriverHeatData(
    dhd.objectId,
    dhd.participant,
    dhd.laneIndex,
    driver,
  );
  const heat = heats[heatIdx];
  if (!heat) return false;
  heat.heatDrivers = heat.heatDrivers.map((d) =>
    d.laneIndex === dhd.laneIndex ? newDhd : d,
  );
  return true;
}

export function resolveHeatCardHover(
  index: number,
  event: MouseEvent,
  lastStartedIdx: number,
  heat: Heat,
  isHeatStarted: (h: Heat) => boolean,
): { action: HeatDropAction; hoveredHeatIdx: number } {
  const cardEl = event.currentTarget as HTMLElement;
  if (!cardEl) return { action: null, hoveredHeatIdx: -1 };
  const action = calculateHeatCardHoverAction(
    index,
    cardEl.getBoundingClientRect(),
    event.clientX,
    lastStartedIdx,
    heat,
    isHeatStarted,
  );
  return {
    action,
    hoveredHeatIdx: action?.type === "swap" ? action.targetIndex : -1,
  };
}

export function resolveHeatDropFromPoint(
  pointerX: number,
  pointerY: number,
  heats: Heat[],
  lastStartedIdx: number,
  isHeatStarted: (h: Heat) => boolean,
): { action: HeatDropAction; hoveredHeatIdx: number } {
  const cards = collectHeatCardBounds(heats, isHeatStarted);
  const action = calculateHeatDropAction(
    pointerX,
    pointerY,
    cards,
    lastStartedIdx,
  );
  return {
    action,
    hoveredHeatIdx: action?.type === "swap" ? action.targetIndex : -1,
  };
}

export function handleUndoRedoKey(
  event: KeyboardEvent,
  undoManager: { undo: () => void; redo: () => void },
): void {
  if (!event.metaKey && !event.ctrlKey) return;
  if (event.key === "z") {
    event.preventDefault();
    if (event.shiftKey) {
      undoManager.redo();
    } else {
      undoManager.undo();
    }
  } else if (event.key === "y") {
    event.preventDefault();
    undoManager.redo();
  }
}

export function handleHeatHoverAction(
  index: number,
  isDraggingHeat: boolean,
  localHeats: Heat[],
  lastStartedIdx: number,
  isHeatStarted: (h: Heat) => boolean,
): { action: HeatDropAction; hoveredHeatIdx: number } {
  if (!isDraggingHeat || index === -1) {
    return { action: null, hoveredHeatIdx: -1 };
  }
  if (index > lastStartedIdx && !isHeatStarted(localHeats[index])) {
    return {
      action: { type: "swap", targetIndex: index },
      hoveredHeatIdx: index,
    };
  }
  return { action: null, hoveredHeatIdx: -1 };
}

export function getCustomGroupName(
  race: Race | undefined,
  groupIdx: number,
): string {
  if (!race || !race.group_options?.enabled) return "";
  const names = race.group_options.names;
  if (
    groupIdx !== undefined &&
    groupIdx !== null &&
    names &&
    names[groupIdx] &&
    names[groupIdx].trim() !== ""
  ) {
    return names[groupIdx].trim();
  }
  return "";
}

export function isStepUpEnabledHelper(
  race: Race | undefined,
  localHeats: Heat[],
): boolean {
  if (race?.step_up && race.step_up > 0) return true;
  if (race?.heat_rotation_type === "Custom") return true;
  return localHeats.some(
    (h) =>
      h.isStepUpBoundary ||
      (h.step && h.step > 1) ||
      h.heatDrivers?.some((d) => isStepUpParticipant(d.participant)),
  );
}

export function resolveHeatDropReorder(
  draggedHeat: Heat | undefined,
  dropPoint: { x: number; y: number } | undefined,
  currentAction: HeatDropAction,
  localHeats: Heat[],
  lastStartedIdx: number,
  isHeatStarted: (h: Heat) => boolean,
): { reordered: boolean; newHeats: Heat[] } {
  let action = currentAction;
  if (!action && dropPoint) {
    const cards = collectHeatCardBounds(localHeats, isHeatStarted);
    action = calculateHeatDropAction(
      dropPoint.x,
      dropPoint.y,
      cards,
      lastStartedIdx,
    );
  }
  if (!action || !draggedHeat) {
    return { reordered: false, newHeats: localHeats };
  }

  const fromIdx = localHeats.findIndex(
    (h) => h.objectId === draggedHeat.objectId,
  );
  if (fromIdx === -1) {
    return { reordered: false, newHeats: localHeats };
  }

  return executeHeatReorder(localHeats, fromIdx, action, lastStartedIdx);
}

export function canEnterHeatsGridPredicate(
  drag: CdkDrag<any>,
  _drop?: CdkDropList<any>,
): boolean {
  return !!(
    drag.data &&
    typeof drag.data === "object" &&
    "heatDrivers" in drag.data
  );
}

export function canEnterDriverDropListPredicate(
  drag: CdkDrag<any>,
  _drop?: CdkDropList<any>,
): boolean {
  return !(
    drag.data &&
    typeof drag.data === "object" &&
    "heatDrivers" in drag.data
  );
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

export function getAvailableGroups(
  race: Race | undefined,
  heats: Heat[],
  translationService: TranslationService,
): AvailableGroup[] {
  if (!race?.group_options?.enabled) {
    return [];
  }
  const maxGroups = Math.max(
    race.group_options.max_groups || 1,
    ...heats.map((h) => (h.group ?? 0) + 1),
  );
  const groups: AvailableGroup[] = [];
  for (let i = 0; i < maxGroups; i++) {
    const customName = getCustomGroupName(race, i);
    const name =
      customName ||
      translationService.translate("RD_FILTER_GROUP_N", { n: i + 1 });
    const count = heats.filter((h) => h.group === i).length;
    groups.push({ index: i, name, count });
  }
  return groups;
}

export function getAvailableSteps(
  heats: Heat[],
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

export function filterHeatsByGroupAndStep(
  heats: Heat[],
  selectedGroup: number | null,
  selectedStep: number | null,
): Heat[] {
  if (!heats || heats.length === 0) return [];
  if (selectedGroup === null && selectedStep === null) return heats;
  return heats.filter((h) => {
    if (selectedGroup !== null && h.group !== selectedGroup) {
      return false;
    }
    if (selectedStep !== null && (h.step || 1) !== selectedStep) {
      return false;
    }
    return true;
  });
}

export function isHeatIncompatibleWithDraggedParticipant(
  heat: Heat,
  participant: RaceParticipant | null | undefined,
  localHeats: Heat[],
  isStepUpEnabled: boolean,
  groupEnabled: boolean,
): boolean {
  if (!participant) return false;

  // Step-Up placeholder is NOT allowed in Step 1
  if (isStepUpEnabled && isStepUpParticipant(participant)) {
    if ((heat.step || 1) === 1) {
      return true;
    }
  }

  // Regular drivers cannot be placed into a different group if already assigned to a group
  if (
    groupEnabled &&
    !isPlaceholderParticipant(participant) &&
    !isStepUpParticipant(participant)
  ) {
    const existingOtherGroupHeat = localHeats.find(
      (h) =>
        h.group !== heat.group &&
        h.heatDrivers?.some(
          (d) =>
            !isPlaceholderParticipant(d.participant) &&
            !isStepUpParticipant(d.participant) &&
            d.participant.objectId === participant.objectId,
        ),
    );
    if (existingOtherGroupHeat) {
      return true;
    }
  }

  return false;
}

export function getHeatValidationWarning(
  heat: Heat,
  localHeats: Heat[],
  race: Race | undefined,
  isStepUpEnabled: boolean,
  translationService: TranslationService,
): string | null {
  if (!heat) return null;

  // Check step-up in step 1
  if (isStepUpEnabled && (heat.step || 1) === 1) {
    if (heat.heatDrivers?.some((d) => isStepUpParticipant(d.participant))) {
      return translationService.translate("RD_ERR_STEP_UP_IN_STEP_ONE");
    }
  }

  // Check step-up count mismatch in step > 1
  if (
    isStepUpEnabled &&
    race?.step_up &&
    race.step_up > 0 &&
    (heat.step || 1) > 1 &&
    race.heat_rotation_type !== "Custom"
  ) {
    const stepUpCount = (heat.heatDrivers || []).filter((d) =>
      isStepUpParticipant(d.participant),
    ).length;
    if (stepUpCount !== race.step_up) {
      return translationService.translate("RD_ERR_STEP_UP_COUNT_MISMATCH", {
        step: heat.step || 1,
        expected: race.step_up,
        found: stepUpCount,
      });
    }
  }

  // Check group conflict for drivers in this heat
  if (race?.group_options?.enabled) {
    for (const dhd of heat.heatDrivers || []) {
      const p = dhd.participant;
      if (isPlaceholderParticipant(p) || isStepUpParticipant(p)) continue;
      const otherGroupHeat = localHeats.find(
        (h) =>
          h.group !== heat.group &&
          h.heatDrivers?.some(
            (d) =>
              !isPlaceholderParticipant(d.participant) &&
              !isStepUpParticipant(d.participant) &&
              d.participant.objectId === p.objectId,
          ),
      );
      if (otherGroupHeat) {
        return translationService.translate(
          "RD_ERR_PARTICIPANT_MULTIPLE_GROUPS",
          {
            participant: getParticipantName(p),
            group1: otherGroupHeat.group + 1,
            group2: heat.group + 1,
          },
        );
      }
    }
  }

  return null;
}

export function getParticipantGroupBadge(
  participant: RaceParticipant | null | undefined,
  localHeats: Heat[],
  race: Race | undefined,
): string | null {
  if (!participant || !race?.group_options?.enabled) return null;
  if (isPlaceholderParticipant(participant) || isStepUpParticipant(participant))
    return null;

  const heat = localHeats.find((h) =>
    h.heatDrivers?.some(
      (d) =>
        !isPlaceholderParticipant(d.participant) &&
        !isStepUpParticipant(d.participant) &&
        d.participant.objectId === participant.objectId,
    ),
  );
  if (!heat) return null;
  const custom = getCustomGroupName(race, heat.group);
  return custom || `G${heat.group + 1}`;
}

export function getParticipantStepBadge(
  participant: RaceParticipant | null | undefined,
  localHeats: Heat[],
  isStepUpEnabled: boolean,
): string | null {
  if (!participant || !isStepUpEnabled) return null;
  if (isPlaceholderParticipant(participant) || isStepUpParticipant(participant))
    return null;

  const heat = localHeats.find((h) =>
    h.heatDrivers?.some(
      (d) =>
        !isPlaceholderParticipant(d.participant) &&
        !isStepUpParticipant(d.participant) &&
        d.participant.objectId === participant.objectId,
    ),
  );
  if (!heat) return null;
  return `S${heat.step || 1}`;
}

export function resolveDraggedParticipant(
  participant: RaceParticipant | Driver | Team | null | undefined,
): RaceParticipant | null {
  if (!participant) return null;
  if (
    participant instanceof RaceParticipant ||
    "driver" in participant ||
    "team" in participant ||
    "rank" in participant
  ) {
    return participant as RaceParticipant;
  }
  if (isDriver(participant)) {
    return createParticipantFromDriver(participant);
  }
  if (isTeam(participant)) {
    return createParticipantFromTeam(participant);
  }
  return null;
}

export class HeatDragDropController {
  isDraggingHeat = false;
  heatDropAction: HeatDropAction = null;
  hoveredHeatIdx = -1;

  get activeInsertSlot(): number {
    return this.heatDropAction?.type === "insert"
      ? this.heatDropAction.slotIndex
      : -1;
  }

  onDragStarted(): void {
    this.isDraggingHeat = true;
    this.heatDropAction = null;
    this.hoveredHeatIdx = -1;
  }

  onDragEnded(): void {
    this.isDraggingHeat = false;
    this.heatDropAction = null;
    this.hoveredHeatIdx = -1;
  }

  isHeatSwapHighlight(
    index: number,
    heat: Heat,
    isHeatStarted: (h: Heat) => boolean,
  ): boolean {
    if (isHeatStarted(heat)) return false;
    return (
      this.heatDropAction?.type === "swap" &&
      this.heatDropAction.targetIndex === index
    );
  }

  updateCardHover(
    index: number,
    event: MouseEvent,
    lastStartedIdx: number,
    heat: Heat,
    isHeatStarted: (h: Heat) => boolean,
  ): void {
    const res = resolveHeatCardHover(
      index,
      event,
      lastStartedIdx,
      heat,
      isHeatStarted,
    );
    this.heatDropAction = res.action;
    this.hoveredHeatIdx = res.hoveredHeatIdx;
  }

  updatePointHover(
    pointerX: number,
    pointerY: number,
    heats: Heat[],
    lastStartedIdx: number,
    isHeatStarted: (h: Heat) => boolean,
  ): void {
    const res = resolveHeatDropFromPoint(
      pointerX,
      pointerY,
      heats,
      lastStartedIdx,
      isHeatStarted,
    );
    this.heatDropAction = res.action;
    this.hoveredHeatIdx = res.hoveredHeatIdx;
  }

  onHover(
    index: number,
    heats: Heat[],
    lastStartedIdx: number,
    isHeatStarted: (h: Heat) => boolean,
  ): void {
    const res = handleHeatHoverAction(
      index,
      this.isDraggingHeat,
      heats,
      lastStartedIdx,
      isHeatStarted,
    );
    this.heatDropAction = res.action;
    this.hoveredHeatIdx = res.hoveredHeatIdx;
  }

  handleDrop(
    event: CdkDragDrop<Heat[]>,
    heats: Heat[],
    lastStartedIdx: number,
    isHeatStarted: (h: Heat) => boolean,
    cardBoundsGetter?: () => HeatCardBounds[],
  ): { reordered: boolean; newHeats: Heat[] } {
    this.isDraggingHeat = false;
    let action = this.heatDropAction;
    if (!action && event.dropPoint) {
      const cards = cardBoundsGetter
        ? cardBoundsGetter()
        : collectHeatCardBounds(heats, isHeatStarted);
      action = calculateHeatDropAction(
        event.dropPoint.x,
        event.dropPoint.y,
        cards,
        lastStartedIdx,
      );
    }
    this.heatDropAction = null;
    this.hoveredHeatIdx = -1;
    if (!action) return { reordered: false, newHeats: heats };

    const draggedHeat = event.item?.data as Heat;
    if (!draggedHeat) return { reordered: false, newHeats: heats };

    const fromIdx = heats.findIndex((h) => h.objectId === draggedHeat.objectId);
    if (fromIdx === -1) return { reordered: false, newHeats: heats };

    return executeHeatReorder(heats, fromIdx, action, lastStartedIdx);
  }
}

export function addHeatToState(
  localHeats: Heat[],
  selectedGroup: number | null,
  selectedStep: number | null,
  stepUpConfig?: number,
  isStepUpEnabled?: boolean,
): Heat {
  const newHeatNumber = localHeats.length + 1;
  const newHeat = new Heat(`new-heat-${Date.now()}`, newHeatNumber, [], []);
  if (selectedGroup !== null) {
    newHeat.group = selectedGroup;
  }
  if (selectedStep !== null) {
    newHeat.step = selectedStep;
  }
  localHeats.push(newHeat);
  if (isStepUpEnabled) {
    assignStepNumbers(localHeats, stepUpConfig);
  }
  return newHeat;
}

export function removeHeatFromState(
  localHeats: Heat[],
  index: number,
  isHeatStarted: (h: Heat) => boolean,
  stepUpConfig?: number,
  isStepUpEnabled?: boolean,
): boolean {
  if (
    index < 0 ||
    index >= localHeats.length ||
    isHeatStarted(localHeats[index])
  ) {
    return false;
  }
  localHeats.splice(index, 1);
  localHeats.forEach((h, i) => (h.heatNumber = i + 1));
  if (isStepUpEnabled) {
    assignStepNumbers(localHeats, stepUpConfig);
  }
  return true;
}

export function removeDriverFromHeatState(
  localHeats: Heat[],
  heatIdx: number,
  laneIdx: number,
  isHeatStarted: (h: Heat) => boolean,
): boolean {
  const heat = localHeats[heatIdx];
  if (!heat || isHeatStarted(heat)) return false;
  const dhd = heat.heatDrivers.find((d) => d.laneIndex === laneIdx);
  if (!dhd || !dhd.participant || isPlaceholderParticipant(dhd.participant)) {
    return false;
  }
  heat.heatDrivers = heat.heatDrivers.filter((d) => d.laneIndex !== laneIdx);
  return true;
}

export function cloneInitialHeats(heats: Heat[]): Heat[] {
  return heats.map((h) => {
    const cloned = cloneHeat(h);
    if (cloned.originalHeatNumber === undefined) {
      cloned.originalHeatNumber = h.originalHeatNumber ?? h.heatNumber;
    }
    return cloned;
  });
}

export function getDriverHeatDataInLaneHelper(
  localHeats: Heat[],
  heatIdx: number,
  laneIdx: number,
): DriverHeatData | null {
  const dhd = localHeats[heatIdx]?.heatDrivers?.find(
    (d: DriverHeatData) => d.laneIndex === laneIdx,
  );
  if (!dhd || isPlaceholderParticipant(dhd.participant)) {
    return null;
  }
  return dhd;
}

export function mapRegeneratedHeatsFromProto(protoHeats: IHeat[]): Heat[] {
  return protoHeats.map((hProto: IHeat) => {
    const heat = HeatConverter.fromProto(hProto);
    heat.originalHeatNumber = heat.heatNumber;
    return cloneHeat(heat);
  });
}

export function loadAndRegisterDrivers(driversRaw: any[]): Driver[] {
  return (driversRaw as any[]).map((d) => {
    const driver = DriverConverter.fromJSON(d);
    DriverConverter.register(driver);
    return driver;
  });
}

export function loadAndRegisterTeams(teamsRaw: any[]): Team[] {
  return (teamsRaw as any[]).map((t) => {
    const team = TeamConverter.fromJSON(t);
    TeamConverter.register(team);
    return team;
  });
}

export function buildSavePayload(
  localHeats: Heat[],
  track: Track | undefined,
  isHeatStarted: (h: Heat) => boolean,
  localParticipants: RaceParticipant[],
): { protoHeats: IHeat[]; protoParticipants: IRaceParticipant[] } {
  return {
    protoHeats: convertHeatsToProto(localHeats, track!, isHeatStarted),
    protoParticipants: convertParticipantsToProto(localParticipants),
  };
}

export { convertParticipantsToProto } from "./modify-heats-modal.utils";
