import { CommonModule } from "@angular/common";
import { Component, input, output, ViewEncapsulation } from "@angular/core";
import { AcknowledgementModalComponent } from "@app/components/shared/acknowledgement-modal/acknowledgement-modal.component";
import { ConfirmationModalComponent } from "@app/components/shared/confirmation-modal/confirmation-modal.component";

/**
 * Hosts all raceday confirmation and acknowledgement modals.
 * The parent component drives visibility via input() flags and reacts to
 * confirm/cancel events via output() emitters.
 */
@Component({
  standalone: true,
  selector: "app-raceday-modals",
  templateUrl: "./raceday-modals.component.html",
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    AcknowledgementModalComponent,
    ConfirmationModalComponent,
  ],
})
export class RacedayModalsComponent {
  // Acknowledgement modal (interface alerts, race ended/started)
  showAckModal = input<boolean>(false);
  ackModalTitle = input<string>("");
  ackModalMessage = input<string>("");
  ackModalButtonText = input<string>("ACK_MODAL_BTN_OK");
  acknowledge = output<void>();

  // Exit confirmation modal
  showExitConfirmation = input<boolean>(false);
  exitModalTitle = input<string>("RD_CONFIRM_EXIT_TITLE");
  exitModalMessage = input<string>("RD_CONFIRM_EXIT_MESSAGE");
  exitConfirmText = input<string>("RD_CONFIRM_EXIT_BTN_LEAVE");
  exitCancelText = input<string>("RD_CONFIRM_EXIT_BTN_STAY");
  exitConfirm = output<void>();
  exitCancel = output<void>();

  // Skip heat confirmation modal
  showSkipHeatConfirmation = input<boolean>(false);
  skipHeatModalTitle = input<string>("RD_CONFIRM_SKIP_HEAT_TITLE");
  skipHeatModalMessage = input<string>("RD_CONFIRM_SKIP_HEAT_MESSAGE");
  skipHeatConfirmText = input<string>("GEN_YES");
  skipHeatCancelText = input<string>("GEN_NO");
  skipHeatConfirm = output<void>();
  skipHeatCancel = output<void>();

  // Skip race confirmation modal
  showSkipRaceConfirmation = input<boolean>(false);
  skipRaceModalTitle = input<string>("RD_CONFIRM_SKIP_RACE_TITLE");
  skipRaceModalMessage = input<string>("RD_CONFIRM_SKIP_RACE_MESSAGE");
  skipRaceConfirmText = input<string>("GEN_YES");
  skipRaceCancelText = input<string>("GEN_NO");
  skipRaceConfirm = output<void>();
  skipRaceCancel = output<void>();

  // Restart heat confirmation modal
  showRestartHeatConfirmation = input<boolean>(false);
  restartHeatModalTitle = input<string>("RD_CONFIRM_RESTART_HEAT_TITLE");
  restartHeatModalMessage = input<string>("RD_CONFIRM_RESTART_HEAT_MESSAGE");
  restartHeatConfirmText = input<string>("GEN_YES");
  restartHeatCancelText = input<string>("GEN_NO");
  restartHeatConfirm = output<void>();
  restartHeatCancel = output<void>();

  // Defer heat confirmation modal
  showDeferHeatConfirmation = input<boolean>(false);
  deferHeatModalTitle = input<string>("RD_CONFIRM_DEFER_HEAT_TITLE");
  deferHeatModalMessage = input<string>("RD_CONFIRM_DEFER_HEAT_MESSAGE");
  deferHeatConfirmText = input<string>("GEN_YES");
  deferHeatCancelText = input<string>("GEN_NO");
  deferHeatConfirm = output<void>();
  deferHeatCancel = output<void>();
}
