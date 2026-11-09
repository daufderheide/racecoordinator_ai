import { ChangeDetectorRef } from "@angular/core";
import { DomSanitizer, SafeStyle } from "@angular/platform-browser";
import { Driver } from "@app/models/driver";
import { RaceParticipant } from "@app/models/race_participant";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { Heat } from "@app/race/heat";
import { TranslationService } from "@app/services/translation.service";

import {
  allocateHighlightColor,
  calculateHeatCardHoverAction,
  calculateHeatDropAction,
  collectHeatCardBounds,
  createParticipantFromDriver,
  getHeatHighlightColors as extractHeatHighlightColors,
  getParticipantKey,
  getParticipantMeta,
  HeatDropAction,
  isStepUpParticipant,
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
