import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { inject, Injectable } from "@angular/core";
import { Driver } from "@app/models/driver";
import { Race } from "@app/models/race";
import { RaceParticipant } from "@app/models/race_participant";
import { Team } from "@app/models/team";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { Heat } from "@app/race/heat";
import { ParticipantValidationService } from "@app/services/participant-validation.service";
import { TranslationService } from "@app/services/translation.service";

import {
  createParticipantFromDriver,
  createParticipantFromTeam,
  getParticipantName,
  isDriver,
} from "./modify-heats-modal.utils";

export interface DropContext {
  localHeats: Heat[];
  localParticipants: RaceParticipant[];
  allDrivers: Driver[];
  allTeams: Team[];
  race: Race;
  isHeatStarted: (heat: Heat) => boolean;
  isParticipantInStartedHeat: (participant: RaceParticipant) => boolean;
}

export interface DropResult {
  updatedHeats: Heat[];
  updatedParticipants: RaceParticipant[];
  error?: { title: string; message: string };
  actionTaken: boolean;
}

@Injectable({
  providedIn: "root",
})
export class ModifyHeatsService {
  private validationService = inject(ParticipantValidationService);
  private translationService = inject(TranslationService);
  private pendingState: {
    heats: Heat[];
    participants: RaceParticipant[];
  } | null = null;

  public saveState(heats: Heat[], participants: RaceParticipant[]) {
    this.pendingState = {
      heats: heats,
      participants: [...participants],
    };
  }

  public restoreState(): {
    heats: Heat[];
    participants: RaceParticipant[];
  } | null {
    const state = this.pendingState;
    this.pendingState = null;
    return state;
  }

  handleDrop(event: CdkDragDrop<any>, context: DropContext): DropResult {
    const fromId = event.previousContainer.id;
    const toId = event.container.id;
    let updatedHeats = [...context.localHeats];
    let updatedParticipants = [...context.localParticipants];

    if (fromId === toId) {
      if (toId === "driver-pool") {
        const item = event.item.data as RaceParticipant;
        const fromIdx = updatedParticipants.findIndex(
          (p) => p.objectId === item.objectId,
        );

        const driverPool = event.container.data as RaceParticipant[];
        let toIdx = -1;
        if (event.currentIndex < driverPool.length) {
          const targetItem = driverPool[event.currentIndex];
          toIdx = updatedParticipants.findIndex(
            (p) => p.objectId === targetItem.objectId,
          );
        } else {
          // Dragged to the end: find the last non-placeholder in updatedParticipants
          for (let i = updatedParticipants.length - 1; i >= 0; i--) {
            const p = updatedParticipants[i];
            const isPlaceholder =
              (p.driver?.entity_id === "EMPTY_LANE" ||
                (p.driver as any)?.entityId === "EMPTY_LANE") &&
              !p.team;
            if (!isPlaceholder) {
              toIdx = i;
              break;
            }
          }
          if (toIdx === -1) {
            toIdx = updatedParticipants.length - 1;
          }
        }

        if (fromIdx !== -1 && toIdx !== -1) {
          moveItemInArray(updatedParticipants, fromIdx, toIdx);
        }
        return { updatedHeats, updatedParticipants, actionTaken: true };
      }
      return { updatedHeats, updatedParticipants, actionTaken: false };
    }

    const resolution = this.resolveParticipant(event, context);
    if (resolution.error) {
      return {
        updatedHeats,
        updatedParticipants,
        actionTaken: false,
        error: resolution.error,
      };
    }
    const participant = resolution.participant!;

    if (toId.startsWith("heat-")) {
      return this.handleHeatDrop(
        toId,
        fromId,
        participant,
        context,
        updatedHeats,
        updatedParticipants,
      );
    } else if (toId === "driver-pool") {
      return this.handlePoolDrop(
        fromId,
        participant,
        updatedHeats,
        updatedParticipants,
        event,
      );
    } else if (toId === "database-drivers") {
      return this.handleDatabaseDrop(
        fromId,
        participant,
        context,
        updatedHeats,
        updatedParticipants,
      );
    }

    return { updatedHeats, updatedParticipants, actionTaken: false };
  }

  private resolveParticipant(
    event: CdkDragDrop<any>,
    context: DropContext,
  ): {
    participant?: RaceParticipant;
    error?: { title: string; message: string };
  } {
    const fromId = event.previousContainer.id;
    const data = event.item.data;

    if (fromId === "database-drivers") {
      const isDrv = isDriver(data);
      const newParticipant = isDrv
        ? createParticipantFromDriver(data as Driver)
        : createParticipantFromTeam(data as Team);
      const validationResult = this.validationService.validate(
        [...context.localParticipants, newParticipant],
        context.allTeams,
        context.allDrivers,
      );

      if (!validationResult.isValid) {
        return {
          error: {
            title: "RDS_ERR_VALIDATION_TITLE",
            message: this.validationService.getErrorMessage(
              validationResult,
              this.translationService,
            ),
          },
        };
      }
      return { participant: newParticipant };
    }
    return { participant: data as RaceParticipant };
  }

  private handleHeatDrop(
    toId: string,
    fromId: string,
    participant: RaceParticipant,
    context: DropContext,
    heats: Heat[],
    participants: RaceParticipant[],
  ): DropResult {
    const parts = toId.split("-");
    const toHIdx = parseInt(parts[1], 10);
    const toLIdx = parseInt(parts[3], 10);

    if (context.isHeatStarted(heats[toHIdx])) {
      return {
        updatedHeats: heats,
        updatedParticipants: participants,
        actionTaken: false,
      };
    }

    const existingOccupant = this.getDriverInLane(heats, toHIdx, toLIdx);
    const fromHIdx = fromId.startsWith("heat-")
      ? parseInt(fromId.split("-")[1], 10)
      : -1;

    // Group Validation
    if (context.race.group_options?.enabled) {
      const groupError = this.validateGroups(
        participant,
        existingOccupant,
        toHIdx,
        fromHIdx,
        heats,
      );
      if (groupError) {
        return {
          updatedHeats: heats,
          updatedParticipants: participants,
          actionTaken: false,
          error: groupError,
        };
      }
    }

    if (fromId === "database-drivers") {
      participants.push(participant);
    }

    if (fromHIdx !== -1) {
      const fromLIdx = parseInt(fromId.split("-")[3], 10);
      const isAlreadyInHeat = heats[toHIdx].heatDrivers.some(
        (dhd) => dhd.participant.objectId === participant.objectId,
      );
      if (isAlreadyInHeat && fromHIdx !== toHIdx) {
        return {
          updatedHeats: heats,
          updatedParticipants: participants,
          actionTaken: false,
        };
      }

      if (existingOccupant) {
        this.removeDriverFromHeat(heats, fromHIdx, fromLIdx);
        this.removeDriverFromHeat(heats, toHIdx, toLIdx);
        this.addDriverToHeat(heats, toHIdx, toLIdx, participant);
        this.addDriverToHeat(heats, fromHIdx, fromLIdx, existingOccupant);
      } else {
        this.removeDriverFromHeat(heats, fromHIdx, fromLIdx);
        this.addDriverToHeat(heats, toHIdx, toLIdx, participant);
      }
    } else {
      if (
        !heats[toHIdx].heatDrivers.some(
          (dhd) => dhd.participant.objectId === participant.objectId,
        )
      ) {
        if (existingOccupant) this.removeDriverFromHeat(heats, toHIdx, toLIdx);
        this.addDriverToHeat(heats, toHIdx, toLIdx, participant);
      }
    }

    return {
      updatedHeats: heats,
      updatedParticipants: participants,
      actionTaken: true,
    };
  }

  private validateGroups(
    participant: RaceParticipant,
    existingOccupant: RaceParticipant | null,
    toHIdx: number,
    fromHIdx: number,
    heats: Heat[],
  ): { title: string; message: string } | null {
    const targetGroup = heats[toHIdx].group;
    const findOtherGroupHeat = (p: RaceParticipant) =>
      heats.find(
        (h, idx) =>
          idx !== toHIdx &&
          idx !== fromHIdx &&
          h.heatDrivers.some((d) => d.participant.objectId === p.objectId),
      );

    const otherHeat = findOtherGroupHeat(participant);
    if (otherHeat && otherHeat.group !== targetGroup) {
      return {
        title: "RDS_ERR_VALIDATION_TITLE",
        message: this.translationService.translate(
          "RD_ERR_PARTICIPANT_MULTIPLE_GROUPS",
          {
            participant: getParticipantName(participant),
            group1: otherHeat.group + 1,
            group2: targetGroup + 1,
          },
        ),
      };
    }

    if (existingOccupant && fromHIdx !== -1) {
      const fromTargetGroup = heats[fromHIdx].group;
      const otherHeatForOccupant = findOtherGroupHeat(existingOccupant);
      if (
        otherHeatForOccupant &&
        otherHeatForOccupant.group !== fromTargetGroup
      ) {
        return {
          title: "RDS_ERR_VALIDATION_TITLE",
          message: this.translationService.translate(
            "RD_ERR_PARTICIPANT_MULTIPLE_GROUPS",
            {
              participant: getParticipantName(existingOccupant),
              group1: otherHeatForOccupant.group + 1,
              group2: fromTargetGroup + 1,
            },
          ),
        };
      }
    }
    return null;
  }

  private handlePoolDrop(
    fromId: string,
    participant: RaceParticipant,
    heats: Heat[],
    participants: RaceParticipant[],
    event: CdkDragDrop<any>,
  ): DropResult {
    if (fromId === "database-drivers") {
      const driverPool = event.container.data as RaceParticipant[];
      let toIdx = -1;
      if (event.currentIndex < driverPool.length) {
        const targetItem = driverPool[event.currentIndex];
        toIdx = participants.findIndex(
          (p) => p.objectId === targetItem.objectId,
        );
      } else {
        // Find the first placeholder or the end of the array
        toIdx = participants.length;
        for (let i = 0; i < participants.length; i++) {
          const p = participants[i];
          const isPlaceholder =
            (p.driver?.entity_id === "EMPTY_LANE" ||
              (p.driver as any)?.entityId === "EMPTY_LANE") &&
            !p.team;
          if (isPlaceholder) {
            toIdx = i;
            break;
          }
        }
      }
      if (toIdx !== -1) {
        participants.splice(toIdx, 0, participant);
      } else {
        participants.push(participant);
      }
    } else if (fromId.startsWith("heat-")) {
      this.removeDriverFromHeat(
        heats,
        parseInt(fromId.split("-")[1], 10),
        parseInt(fromId.split("-")[3], 10),
      );
    } else {
      return {
        updatedHeats: heats,
        updatedParticipants: participants,
        actionTaken: false,
      };
    }
    return {
      updatedHeats: heats,
      updatedParticipants: participants,
      actionTaken: true,
    };
  }

  private handleDatabaseDrop(
    fromId: string,
    participant: RaceParticipant,
    context: DropContext,
    heats: Heat[],
    participants: RaceParticipant[],
  ): DropResult {
    if (fromId !== "driver-pool" && !fromId.startsWith("heat-")) {
      return {
        updatedHeats: heats,
        updatedParticipants: participants,
        actionTaken: false,
      };
    }

    if (context.isParticipantInStartedHeat(participant)) {
      return {
        updatedHeats: heats,
        updatedParticipants: participants,
        actionTaken: false,
        error: {
          title: "RDS_ERR_VALIDATION_TITLE",
          message: this.translationService.translate(
            "RD_ERR_PARTICIPANT_IN_STARTED_HEAT",
            {
              participant: participant.driver.name,
            },
          ),
        },
      };
    }

    const updatedParticipants = participants.filter(
      (p) => p.objectId !== participant.objectId,
    );
    heats.forEach((h) => {
      if (!context.isHeatStarted(h)) {
        h.heatDrivers = h.heatDrivers.filter(
          (dhd) => dhd.participant.objectId !== participant.objectId,
        );
      }
    });

    return {
      updatedHeats: heats,
      updatedParticipants: updatedParticipants,
      actionTaken: true,
    };
  }

  private getDriverInLane(
    heats: Heat[],
    heatIdx: number,
    laneIdx: number,
  ): RaceParticipant | null {
    const dhd = heats[heatIdx].heatDrivers.find(
      (d: DriverHeatData) => d.laneIndex === laneIdx,
    );
    return dhd ? dhd.participant : null;
  }

  private removeDriverFromHeat(
    heats: Heat[],
    heatIdx: number,
    laneIdx: number,
  ) {
    const heat = heats[heatIdx];
    heat.heatDrivers = heat.heatDrivers.filter(
      (d: DriverHeatData) => d.laneIndex !== laneIdx,
    );
  }

  private addDriverToHeat(
    heats: Heat[],
    heatIdx: number,
    laneIdx: number,
    participant: RaceParticipant,
  ) {
    const heat = heats[heatIdx];
    const newDhd = new DriverHeatData(
      `new-dhd-${Date.now()}-${Math.random()}`,
      participant,
      laneIdx,
    );
    heat.heatDrivers.push(newDhd);
  }
}
