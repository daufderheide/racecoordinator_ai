import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { ValidationResult } from "@app/services/participant-validation.service";

import {
  extractEligibleTeamsForAddAll,
  navigateParticipantList,
  Participant,
  randomizeParticipantsList,
} from "./raceday-setup-participant.helper";

export class RacedaySetupSelectionHelper {
  static handleEnterKey(
    host: any,
    event?: KeyboardEvent,
    inputElem?: HTMLInputElement,
  ): boolean {
    if (host.isAnyModalOrDropdownOpen() || !host.selectedParticipantItem) {
      return false;
    }

    if (
      RacedaySetupSelectionHelper.isParticipantInRacing(
        host,
        host.selectedParticipantItem,
      )
    ) {
      if (event) event.preventDefault();
      if (event && (event.shiftKey || event.ctrlKey)) {
        host.removeAllFilteredRacingParticipants(inputElem);
      } else {
        host.removeActiveRacingParticipant(inputElem);
      }
      return true;
    }

    if (
      RacedaySetupSelectionHelper.isParticipantInAvailable(
        host,
        host.selectedParticipantItem,
      )
    ) {
      if (event) event.preventDefault();
      if (event && (event.shiftKey || event.ctrlKey)) {
        host.addAllFilteredAvailableParticipants(inputElem);
      } else {
        host.addActiveAvailableParticipant(inputElem);
      }
      return true;
    }

    return false;
  }

  static handleArrowKey(host: any, event: KeyboardEvent): boolean {
    if (host.isAnyModalOrDropdownOpen()) {
      return false;
    }

    const participant =
      host.selectedParticipantItem || host.clickedParticipantItem;
    if (!participant) {
      return false;
    }

    const isDown = event.key === "ArrowDown";
    if (
      RacedaySetupSelectionHelper.isParticipantInAvailable(host, participant)
    ) {
      event.preventDefault();
      RacedaySetupSelectionHelper.navigateAvailableParticipants(
        host,
        participant,
        isDown,
      );
      return true;
    }

    if (RacedaySetupSelectionHelper.isParticipantInRacing(host, participant)) {
      event.preventDefault();
      RacedaySetupSelectionHelper.navigateRacingParticipants(
        host,
        participant,
        isDown,
      );
      return true;
    }

    return false;
  }

  static selectParticipant(
    host: any,
    participant: Participant,
    index?: number,
  ): void {
    host.selectedParticipantItem = participant;
    host.clickedParticipantItem = participant;
    if (index !== undefined) {
      if (host.isParticipantInAvailable(participant)) {
        host.availableActiveIndex = index;
      } else if (host.isParticipantInRacing(participant)) {
        host.racingActiveIndex = index;
      }
    } else {
      const availIdx = host.filteredAvailableParticipants.findIndex(
        (p: Participant) =>
          p.entity_id === participant.entity_id &&
          host.isDriver(p) === host.isDriver(participant),
      );
      if (availIdx !== -1) {
        host.availableActiveIndex = availIdx;
      } else {
        const racingIdx = host.filteredRacingParticipants.findIndex(
          (p: Participant) =>
            p.entity_id === participant.entity_id &&
            host.isDriver(p) === host.isDriver(participant),
        );
        if (racingIdx !== -1) {
          host.racingActiveIndex = racingIdx;
        }
      }
    }
  }

  static isParticipantSelected(host: any, participant: Participant): boolean {
    if (!host.selectedParticipantItem) return false;
    return (
      host.selectedParticipantItem.entity_id === participant.entity_id &&
      host.isDriver(host.selectedParticipantItem) === host.isDriver(participant)
    );
  }

  static toggleParticipantSelection(
    host: any,
    participant: Participant,
    isSelected: boolean,
    forcedFocusElem?: HTMLInputElement,
  ): void {
    let added = false;
    host.updateListWithRefresh(
      () => {
        if (isSelected) {
          host.selectedParticipants = host.selectedParticipants.filter(
            (p: Participant) =>
              !(
                p.entity_id === participant.entity_id &&
                host.isDriver(p) === host.isDriver(participant)
              ),
          );
        } else {
          const potentialParticipants = [
            ...host.selectedParticipants,
            participant,
          ];
          const validationResult = host.validationService.validate(
            potentialParticipants,
            host.allTeams,
            host.allDrivers,
          );

          if (!validationResult.isValid) {
            host.showParticipantValidationError(validationResult);
            return;
          }

          host.selectedParticipants = [
            ...host.selectedParticipants,
            participant,
          ];
          added = true;
        }
        host.updateUnselectedParticipants();
      },
      forcedFocusElem,
      () => {
        if (added) {
          host.scrollRacingParticipantIntoView(participant);
        }
      },
    );
  }

  static showParticipantValidationError(
    host: any,
    validationResult: ValidationResult,
  ): void {
    host.errorTitle = "RDS_ERR_VALIDATION_TITLE";
    host.errorMessage = host.validationService.getErrorMessage(
      validationResult,
      host.translationService,
    );
    host.errorMessageParams = {};
    host.showErrorModal = true;
    host.cdr.detectChanges();
  }

  static updateAvailableActiveItem(host: any): void {
    const remainingAvail = host.filteredAvailableParticipants.length;
    if (host.availableActiveIndex >= remainingAvail) {
      host.availableActiveIndex = Math.max(0, remainingAvail - 1);
    }
    host.selectedParticipantItem =
      remainingAvail > 0
        ? host.filteredAvailableParticipants[host.availableActiveIndex] || null
        : null;
    host.clickedParticipantItem = host.selectedParticipantItem;
    host.cdr.detectChanges();
  }

  static addAllParticipants(host: any, inputElem?: HTMLInputElement): void {
    const unselectedDrivers = host.filteredAvailableParticipants.filter(
      (p: Participant) => host.isDriver(p),
    );
    const unselectedTeams = host.filteredAvailableParticipants.filter(
      (p: Participant) => host.isTeam(p),
    );

    if (unselectedDrivers.length === 0 && unselectedTeams.length === 0) {
      return;
    }

    let participantsToAdd: Participant[] = [];

    if (unselectedDrivers.length > 0) {
      const potentialParticipants = [
        ...host.selectedParticipants,
        ...unselectedDrivers,
      ];
      const validationResult = host.validationService.validate(
        potentialParticipants,
        host.allTeams,
        host.allDrivers,
      );

      if (!validationResult.isValid) {
        host.showParticipantValidationError(validationResult);
        return;
      }

      participantsToAdd = [...unselectedDrivers];
    }

    const eligibleTeams = extractEligibleTeamsForAddAll(
      unselectedTeams,
      host.selectedParticipants,
      participantsToAdd,
      host.validationService,
      host.allTeams,
      host.allDrivers,
    );
    participantsToAdd.push(...eligibleTeams);

    if (participantsToAdd.length === 0) {
      if (unselectedTeams.length > 0) {
        const potentialParticipants = [
          ...host.selectedParticipants,
          unselectedTeams[0],
        ];
        const validationResult = host.validationService.validate(
          potentialParticipants,
          host.allTeams,
          host.allDrivers,
        );
        if (!validationResult.isValid) {
          host.showParticipantValidationError(validationResult);
        }
      }
      return;
    }

    host.updateListWithRefresh(() => {
      host.selectedParticipants = [
        ...host.selectedParticipants,
        ...participantsToAdd,
      ];
      host.updateUnselectedParticipants();
    }, inputElem);

    host.updateAvailableActiveItem();
  }

  static removeAllFilteredRacingParticipants(
    host: any,
    inputElem?: HTMLInputElement,
  ): void {
    if (!host.racingSearchQuery && host.selectedRacingLabelIds.length === 0) {
      host.removeAllParticipants();
      return;
    }

    const filteredSet = new Set(
      host.filteredRacingParticipants.map(
        (p: Participant) => p.entity_id + (host.isDriver(p) ? "_d" : "_t"),
      ),
    );

    const remainingParticipants = host.selectedParticipants.filter(
      (p: Participant) => {
        const id = p.entity_id + (host.isDriver(p) ? "_d" : "_t");
        return !filteredSet.has(id);
      },
    );

    host.updateListWithRefresh(() => {
      host.selectedParticipants = remainingParticipants;
      host.updateUnselectedParticipants();
    }, inputElem);

    const remainingRacing = host.filteredRacingParticipants.length;
    if (host.racingActiveIndex >= remainingRacing) {
      host.racingActiveIndex = Math.max(0, remainingRacing - 1);
    }
    host.selectedParticipantItem =
      remainingRacing > 0
        ? host.filteredRacingParticipants[host.racingActiveIndex] || null
        : null;
    host.clickedParticipantItem = host.selectedParticipantItem;
    host.cdr.detectChanges();
  }

  static onAvailableSearchKeydown(
    host: any,
    event: KeyboardEvent,
    inputElem?: HTMLInputElement,
  ): void {
    const list = host.filteredAvailableParticipants;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (list.length > 0) {
        host.availableActiveIndex = Math.min(
          host.availableActiveIndex + 1,
          list.length - 1,
        );
        host.selectedParticipantItem = list[host.availableActiveIndex] || null;
        host.clickedParticipantItem = host.selectedParticipantItem;
        host.scrollActiveAvailableItemIntoView();
      }
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (list.length > 0) {
        host.availableActiveIndex = Math.max(host.availableActiveIndex - 1, 0);
        host.selectedParticipantItem = list[host.availableActiveIndex] || null;
        host.clickedParticipantItem = host.selectedParticipantItem;
        host.scrollActiveAvailableItemIntoView();
      }
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (host.handleEnterKey(event, inputElem)) {
        return;
      }
      if (event.shiftKey || event.ctrlKey) {
        host.addAllFilteredAvailableParticipants(inputElem);
      } else {
        host.addActiveAvailableParticipant(inputElem);
      }
    } else if (event.key === "Escape") {
      event.preventDefault();
      host.availableSearchQuery = "";
      host.availableActiveIndex = 0;
      host.clickedParticipantItem = null;
      host.selectedParticipantItem = null;
    }
  }

  static onRacingSearchKeydown(
    host: any,
    event: KeyboardEvent,
    inputElem?: HTMLInputElement,
  ): void {
    const list = host.filteredRacingParticipants;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (list.length > 0) {
        host.racingActiveIndex = Math.min(
          host.racingActiveIndex + 1,
          list.length - 1,
        );
        host.selectedParticipantItem = list[host.racingActiveIndex] || null;
        host.clickedParticipantItem = host.selectedParticipantItem;
        host.scrollActiveRacingItemIntoView();
      }
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (list.length > 0) {
        host.racingActiveIndex = Math.max(host.racingActiveIndex - 1, 0);
        host.selectedParticipantItem = list[host.racingActiveIndex] || null;
        host.clickedParticipantItem = host.selectedParticipantItem;
        host.scrollActiveRacingItemIntoView();
      }
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (host.handleEnterKey(event, inputElem)) {
        return;
      }
      if (event.shiftKey || event.ctrlKey) {
        host.removeAllFilteredRacingParticipants(inputElem);
      } else {
        host.removeActiveRacingParticipant(inputElem);
      }
    } else if (event.key === "Escape") {
      event.preventDefault();
      host.racingSearchQuery = "";
      host.racingActiveIndex = 0;
      host.clickedParticipantItem = null;
      host.selectedParticipantItem = null;
    }
  }

  static addActiveAvailableParticipant(
    host: any,
    inputElem?: HTMLInputElement,
  ): void {
    const participants = host.filteredAvailableParticipants;
    if (participants.length === 0) return;

    let index = -1;
    if (host.selectedParticipantItem) {
      index = participants.findIndex(
        (p: Participant) =>
          p.entity_id === host.selectedParticipantItem!.entity_id &&
          host.isDriver(p) === host.isDriver(host.selectedParticipantItem!),
      );
    }
    if (index === -1) {
      index = Math.min(
        Math.max(0, host.availableActiveIndex),
        participants.length - 1,
      );
    }
    host.availableActiveIndex = index;
    let participant: Participant | null = null;
    if (index !== -1 && participants[index]) {
      participant = participants[index];
    } else if (
      host.selectedParticipantItem &&
      host.isParticipantInAvailable(host.selectedParticipantItem)
    ) {
      participant = host.selectedParticipantItem;
    }
    if (!participant) return;

    host.toggleParticipantSelection(participant, false, inputElem);
    host.updateAvailableActiveItem();
    host.scrollActiveAvailableItemIntoView();
  }

  static removeActiveRacingParticipant(
    host: any,
    inputElem?: HTMLInputElement,
  ): void {
    const participants = host.filteredRacingParticipants;
    if (participants.length === 0) return;

    let index = -1;
    if (host.selectedParticipantItem) {
      index = participants.findIndex(
        (p: Participant) =>
          p.entity_id === host.selectedParticipantItem!.entity_id &&
          host.isDriver(p) === host.isDriver(host.selectedParticipantItem!),
      );
    }
    if (index === -1) {
      index = Math.min(
        Math.max(0, host.racingActiveIndex),
        participants.length - 1,
      );
    }
    host.racingActiveIndex = index;
    let participant: Participant | null = null;
    if (index !== -1 && participants[index]) {
      participant = participants[index];
    } else if (
      host.selectedParticipantItem &&
      host.isParticipantInRacing(host.selectedParticipantItem)
    ) {
      participant = host.selectedParticipantItem;
    }
    if (!participant) return;

    host.toggleParticipantSelection(participant, true, inputElem);

    const remaining = host.filteredRacingParticipants.length;
    if (host.racingActiveIndex >= remaining) {
      host.racingActiveIndex = Math.max(0, remaining - 1);
    }
    host.selectedParticipantItem =
      remaining > 0
        ? host.filteredRacingParticipants[host.racingActiveIndex] || null
        : null;
    host.clickedParticipantItem = host.selectedParticipantItem;
    host.cdr.detectChanges();
    host.scrollActiveRacingItemIntoView();
  }

  static drop(host: any, event: CdkDragDrop<Participant[]>): void {
    if (event.previousContainer === event.container) {
      if (
        event.container.id === "selected-list" &&
        event.isPointerOverContainer
      ) {
        if (host.racingSearchQuery) return;
        const updated = [...host.selectedParticipants];
        moveItemInArray(updated, event.previousIndex, event.currentIndex);
        host.selectedParticipants = updated;
        host.saveSettings();
      }
    } else {
      if (event.container.id === "selected-list") {
        const participant = event.previousContainer.data[
          event.previousIndex
        ] as Participant;
        if (!participant) return;

        const potentialParticipants = [...host.selectedParticipants];
        const targetIndex = event.currentIndex;
        if (targetIndex >= 0 && targetIndex <= potentialParticipants.length) {
          potentialParticipants.splice(targetIndex, 0, participant);
        } else {
          potentialParticipants.push(participant);
        }

        const validationResult = host.validationService.validate(
          potentialParticipants,
          host.allTeams,
          host.allDrivers,
        );

        if (!validationResult.isValid) {
          host.errorTitle = "RDS_ERR_VALIDATION_TITLE";
          host.errorMessage = host.validationService.getErrorMessage(
            validationResult,
            host.translationService,
          );
          host.errorMessageParams = {};
          host.showErrorModal = true;
          host.cdr.detectChanges();
          return;
        }

        host.updateListWithRefresh(
          () => {
            const updated = [...host.selectedParticipants];
            if (targetIndex >= 0 && targetIndex <= updated.length) {
              updated.splice(targetIndex, 0, participant);
            } else {
              updated.push(participant);
            }
            host.selectedParticipants = updated;
            host.updateUnselectedParticipants();
          },
          undefined,
          () => {
            host.scrollRacingParticipantIntoView(participant);
          },
        );
      } else if (event.container.id === "available-list") {
        const participant = host.selectedParticipants[event.previousIndex];
        if (!participant) return;

        host.updateListWithRefresh(() => {
          host.selectedParticipants = host.selectedParticipants.filter(
            (p: Participant) =>
              !(
                p.entity_id === participant.entity_id &&
                host.isDriver(p) === host.isDriver(participant)
              ),
          );
          host.updateUnselectedParticipants();
        });
      }
    }
  }

  static navigateAvailableParticipants(
    host: any,
    participant: Participant,
    isDown: boolean,
  ): void {
    const res = navigateParticipantList(
      host.filteredAvailableParticipants,
      participant,
      host.availableActiveIndex,
      isDown,
    );
    host.availableActiveIndex = res.nextIndex;
    host.selectedParticipantItem = res.selected;
    host.clickedParticipantItem = res.selected;
    host.cdr.detectChanges();
    host.scrollActiveAvailableItemIntoView();
  }

  static navigateRacingParticipants(
    host: any,
    participant: Participant,
    isDown: boolean,
  ): void {
    const res = navigateParticipantList(
      host.filteredRacingParticipants,
      participant,
      host.racingActiveIndex,
      isDown,
    );
    host.racingActiveIndex = res.nextIndex;
    host.selectedParticipantItem = res.selected;
    host.clickedParticipantItem = res.selected;
    host.cdr.detectChanges();
    host.scrollActiveRacingItemIntoView();
  }

  static isParticipantInRacing(host: any, participant: Participant): boolean {
    return host.filteredRacingParticipants.some(
      (p: Participant) =>
        p.entity_id === participant.entity_id &&
        host.isDriver(p) === host.isDriver(participant),
    );
  }

  static isParticipantInAvailable(
    host: any,
    participant: Participant,
  ): boolean {
    return host.filteredAvailableParticipants.some(
      (p: Participant) =>
        p.entity_id === participant.entity_id &&
        host.isDriver(p) === host.isDriver(participant),
    );
  }

  static onAvailableLabelFilterChange(
    host: any,
    filter: string | string[] | { value: string | string[] },
  ): void {
    const val =
      filter && typeof filter === "object" && "value" in filter
        ? (filter as any).value
        : filter;
    host.selectedAvailableLabelIds = Array.isArray(val)
      ? val.filter((id: string) => !!id)
      : val
        ? [val]
        : [];
    host.cdr.detectChanges();
  }

  static onRacingLabelFilterChange(
    host: any,
    filter: string | string[] | { value: string | string[] },
  ): void {
    const val =
      filter && typeof filter === "object" && "value" in filter
        ? (filter as any).value
        : filter;
    host.selectedRacingLabelIds = Array.isArray(val)
      ? val.filter((id: string) => !!id)
      : val
        ? [val]
        : [];
    host.cdr.detectChanges();
  }

  static toggleAvailableLabelMatchMode(host: any): void {
    host.availableLabelMatchMode =
      host.availableLabelMatchMode === "any" ? "all" : "any";
    host.cdr.detectChanges();
  }

  static toggleRacingLabelMatchMode(host: any): void {
    host.racingLabelMatchMode =
      host.racingLabelMatchMode === "any" ? "all" : "any";
    host.cdr.detectChanges();
  }

  static clearAvailableLabelFilter(host: any): void {
    host.selectedAvailableLabelIds = [];
    host.cdr.detectChanges();
  }

  static clearRacingLabelFilter(host: any): void {
    host.selectedRacingLabelIds = [];
    host.cdr.detectChanges();
  }

  static onAvailableSearchQueryChange(host: any): void {
    host.availableActiveIndex = 0;
    if (host.availableSearchQuery?.trim()) {
      const active = host.filteredAvailableParticipants[0];
      host.selectedParticipantItem = active || null;
      host.clickedParticipantItem = host.selectedParticipantItem;
    } else {
      host.clickedParticipantItem = null;
      host.selectedParticipantItem = null;
    }
  }

  static onRacingSearchQueryChange(host: any): void {
    host.racingActiveIndex = 0;
    if (host.racingSearchQuery?.trim()) {
      const active = host.filteredRacingParticipants[0];
      host.selectedParticipantItem = active || null;
      host.clickedParticipantItem = host.selectedParticipantItem;
    } else {
      host.clickedParticipantItem = null;
      host.selectedParticipantItem = null;
    }
  }

  static removeAllParticipants(host: any): void {
    host.updateListWithRefresh(() => {
      host.selectedParticipants = [];
      host.updateUnselectedParticipants();
      host.selectedParticipantItem = null;
      host.clickedParticipantItem = null;
    });
  }

  static randomizeParticipants(host: any): void {
    host.updateListWithRefresh(() => {
      host.selectedParticipants = randomizeParticipantsList(
        host.selectedParticipants,
      );
    });
  }
}
