import { CdkDragDrop } from "@angular/cdk/drag-drop";
import { ActivatedRoute, Router } from "@angular/router";
import { forkJoin, Subscription } from "rxjs";
import { UndoManager } from "@app/components/shared/undo-redo-controls/undo-manager";
import { DataService } from "@app/data.service";
import { Driver } from "@app/models/driver";
import { Race } from "@app/models/race";
import { RaceParticipant } from "@app/models/race_participant";
import { Team } from "@app/models/team";
import { Track } from "@app/models/track";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { Heat } from "@app/race/heat";
import { TranslationService } from "@app/services/translation.service";

import { ModifyHeatsService } from "./modify-heats.service";
import { performLaneCheck } from "./modify-heats-lane-check.helper";
import {
  assignStepNumbers,
  HeatCardBounds,
  ModifyHeatsState,
} from "./modify-heats-modal.utils";
import {
  applyTeammateChange,
  HeatDragDropController,
  loadAndRegisterDrivers,
  loadAndRegisterTeams,
  removeDriverFromHeatState,
  removeHeatFromState,
} from "./modify-heats-ui.helper";
import { executeModifyHeatsSave } from "./modify-heats-validation.helper";

export interface AutoSaveConfig {
  localHeats: Heat[];
  localParticipants: RaceParticipant[];
  track: Track;
  isHeatStarted: (h: Heat) => boolean;
  dataService: DataService;
  undoManager: UndoManager<ModifyHeatsState>;
  onSuccess: () => void;
  onFailure: () => void;
  onComplete: () => void;
}

export function executeAutoSave(cfg: AutoSaveConfig): void {
  executeModifyHeatsSave(
    cfg.localHeats,
    cfg.track,
    cfg.isHeatStarted,
    cfg.localParticipants,
    cfg.dataService,
    () => {
      cfg.undoManager.resetTracking({
        heats: cfg.localHeats,
        participants: cfg.localParticipants,
      });
      cfg.onSuccess();
    },
    cfg.onFailure,
    cfg.onComplete,
  );
}

export interface LoadDataCallbacks {
  setAllDrivers: (drivers: Driver[]) => void;
  setAllTeams: (teams: Team[]) => void;
  onLoaded: (savedState: boolean) => void;
  onError: (err: any, savedState: boolean) => void;
}

export function loadModifyHeatsData(
  dataService: DataService,
  savedState: boolean,
  callbacks: LoadDataCallbacks,
): Subscription {
  return forkJoin({
    drivers: dataService.getDrivers(),
    teams: dataService.getTeams(),
  }).subscribe({
    next: (result: any) => {
      callbacks.setAllDrivers(loadAndRegisterDrivers(result.drivers));
      callbacks.setAllTeams(loadAndRegisterTeams(result.teams));
      callbacks.onLoaded(savedState);
    },
    error: (err: any) => {
      callbacks.onError(err, savedState);
    },
  });
}

export function extractParticipantMeta(
  p: RaceParticipant,
  translationService: TranslationService,
): string {
  const isTeam = p.team !== undefined;
  const count = isTeam ? p.team?.driverIds?.length || 0 : 0;
  const rank = p.rankValue ? `#${p.rankValue}` : "";
  const seed = p.seed ? `S${p.seed}` : "";
  const badges = [seed, rank].filter(Boolean).join(" ");
  if (isTeam) {
    return (
      `${count} ${translationService.translate("RD_DRIVERS_COUNT")}` +
      (badges ? ` • ${badges}` : "")
    );
  }
  const nickname = p.driver?.nickname ? `"${p.driver.nickname}"` : "";
  return [nickname, badges].filter(Boolean).join(" • ");
}

export function handleTeammateChange(
  localHeats: Heat[],
  heatIdx: number,
  dhd: DriverHeatData,
  eventOrValue: any,
  allDrivers: Driver[],
): boolean {
  const selectedDriverId =
    typeof eventOrValue === "string"
      ? eventOrValue
      : ((eventOrValue?.target as HTMLSelectElement)?.value ?? eventOrValue);
  return applyTeammateChange(
    localHeats,
    heatIdx,
    dhd,
    selectedDriverId,
    allDrivers,
  );
}

export function handleStepChange(heat: Heat, newStep: number): void {
  heat.step = Math.max(1, Number(newStep) || 1);
}

export function handleToggleStepUpBoundary(
  heat: Heat,
  localHeats: Heat[],
  isStepUpEnabled: boolean,
  stepUp?: number,
): void {
  heat.isStepUpBoundary = !heat.isStepUpBoundary;
  if (isStepUpEnabled) {
    assignStepNumbers(localHeats, stepUp);
  }
}

export function handleGroupChange(heat: Heat, newValue: number): boolean {
  const oldGroup = heat.group;
  const newGroupIndex = newValue - 1;
  if (newGroupIndex === oldGroup) return false;
  heat.group = newGroupIndex;
  return true;
}

export function handleExitConfirm(
  route: ActivatedRoute,
  router: Router,
  closeOutput: { emit: (val: boolean) => void },
): void {
  closeOutput.emit(false);
  const returnUrl = route.snapshot.queryParamMap.get("returnUrl") || "/raceday";
  router.navigateByUrl(returnUrl);
}

export function navigateToEditorHelper(
  path: string,
  route: ActivatedRoute,
  router: Router,
  modifyHeatsService: ModifyHeatsService,
  localHeats: Heat[],
  localParticipants: RaceParticipant[],
): void {
  modifyHeatsService.saveState(localHeats, localParticipants);
  const returnUrl =
    route.snapshot.queryParamMap.get("returnUrl") || router.url.split("?")[0];
  router.navigate([path], {
    queryParams: { from: "modify-heats", returnUrl },
  });
}

export function handleHeatMouseMove(
  index: number,
  event: MouseEvent,
  controller: HeatDragDropController,
  localHeats: Heat[],
  lastStartedIdx: number,
  isHeatStarted: (h: Heat) => boolean,
): void {
  if (controller.isDraggingHeat) {
    controller.updateCardHover(
      index,
      event,
      lastStartedIdx,
      localHeats[index],
      isHeatStarted,
    );
  }
}

export function handlePointMouseMove(
  clientX: number,
  clientY: number,
  controller: HeatDragDropController,
  localHeats: Heat[],
  lastStartedIdx: number,
  isHeatStarted: (h: Heat) => boolean,
): void {
  if (controller.isDraggingHeat) {
    controller.updatePointHover(
      clientX,
      clientY,
      localHeats,
      lastStartedIdx,
      isHeatStarted,
    );
  }
}

export function executeLaneCheck(
  localParticipants: RaceParticipant[],
  localHeats: Heat[],
  track: Track | undefined,
  translationService: TranslationService,
  isStepUpEnabled: boolean,
  race: Race | undefined,
): { allEqual: boolean; reports: any[] } {
  return performLaneCheck(
    localParticipants,
    localHeats,
    track || ({ lanes: [] } as any as Track),
    translationService,
    isStepUpEnabled,
    race,
  );
}

export function removeHeatHelper(
  localHeats: Heat[],
  index: number,
  isHeatStarted: (h: Heat) => boolean,
  stepUp: number | undefined,
  isStepUpEnabled: boolean,
): boolean {
  return removeHeatFromState(
    localHeats,
    index,
    isHeatStarted,
    stepUp,
    isStepUpEnabled,
  );
}

export function removeDriverFromHeatHelper(
  localHeats: Heat[],
  heatIdx: number,
  laneIdx: number,
  isHeatStarted: (h: Heat) => boolean,
): boolean {
  return removeDriverFromHeatState(localHeats, heatIdx, laneIdx, isHeatStarted);
}

export function handleHeatDropHelper(
  event: CdkDragDrop<Heat[]>,
  controller: HeatDragDropController,
  localHeats: Heat[],
  lastStartedIdx: number,
  isHeatStarted: (h: Heat) => boolean,
  boundsSupplier: () => HeatCardBounds[],
  isStepUpEnabled: boolean,
  stepUp: number | undefined,
): Heat[] | null {
  const result = controller.handleDrop(
    event,
    localHeats,
    lastStartedIdx,
    isHeatStarted,
    boundsSupplier,
  );
  if (result.reordered) {
    if (isStepUpEnabled) {
      assignStepNumbers(result.newHeats, stepUp);
    }
    return result.newHeats;
  }
  return null;
}
