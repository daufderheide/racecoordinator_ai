import { ChangeDetectorRef } from "@angular/core";
import { DomSanitizer, SafeStyle } from "@angular/platform-browser";
import { Driver } from "@app/models/driver";
import { RaceParticipant } from "@app/models/race_participant";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { Heat } from "@app/race/heat";
import { TranslationService } from "@app/services/translation.service";

import {
  allocateHighlightColor,
  createParticipantFromDriver,
  getHeatHighlightColors as extractHeatHighlightColors,
  getParticipantKey,
  getParticipantMeta,
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
