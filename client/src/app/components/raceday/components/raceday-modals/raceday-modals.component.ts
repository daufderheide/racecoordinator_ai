import { CommonModule } from "@angular/common";
import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewEncapsulation,
} from "@angular/core";
import { AcknowledgementModalComponent } from "@app/components/shared/acknowledgement-modal/acknowledgement-modal.component";
import { ConfirmationModalComponent } from "@app/components/shared/confirmation-modal/confirmation-modal.component";

/**
 * Hosts all raceday confirmation and acknowledgement modals.
 * The parent component drives visibility via @Input() flags and reacts to
 * confirm/cancel events via @Output() emitters.
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
  @Input() showAckModal = false;
  @Input() ackModalTitle = "";
  @Input() ackModalMessage = "";
  @Input() ackModalButtonText = "ACK_MODAL_BTN_OK";
  @Output() acknowledge = new EventEmitter<void>();

  // Exit confirmation modal
  @Input() showExitConfirmation = false;
  @Input() exitModalTitle = "RD_CONFIRM_EXIT_TITLE";
  @Input() exitModalMessage = "RD_CONFIRM_EXIT_MESSAGE";
  @Input() exitConfirmText = "RD_CONFIRM_EXIT_BTN_LEAVE";
  @Input() exitCancelText = "RD_CONFIRM_EXIT_BTN_STAY";
  @Output() exitConfirm = new EventEmitter<void>();
  @Output() exitCancel = new EventEmitter<void>();

  // Skip heat confirmation modal
  @Input() showSkipHeatConfirmation = false;
  @Input() skipHeatModalTitle = "RD_CONFIRM_SKIP_HEAT_TITLE";
  @Input() skipHeatModalMessage = "RD_CONFIRM_SKIP_HEAT_MESSAGE";
  @Input() skipHeatConfirmText = "GEN_YES";
  @Input() skipHeatCancelText = "GEN_NO";
  @Output() skipHeatConfirm = new EventEmitter<void>();
  @Output() skipHeatCancel = new EventEmitter<void>();

  // Skip race confirmation modal
  @Input() showSkipRaceConfirmation = false;
  @Input() skipRaceModalTitle = "RD_CONFIRM_SKIP_RACE_TITLE";
  @Input() skipRaceModalMessage = "RD_CONFIRM_SKIP_RACE_MESSAGE";
  @Input() skipRaceConfirmText = "GEN_YES";
  @Input() skipRaceCancelText = "GEN_NO";
  @Output() skipRaceConfirm = new EventEmitter<void>();
  @Output() skipRaceCancel = new EventEmitter<void>();

  // Restart heat confirmation modal
  @Input() showRestartHeatConfirmation = false;
  @Input() restartHeatModalTitle = "RD_CONFIRM_RESTART_HEAT_TITLE";
  @Input() restartHeatModalMessage = "RD_CONFIRM_RESTART_HEAT_MESSAGE";
  @Input() restartHeatConfirmText = "GEN_YES";
  @Input() restartHeatCancelText = "GEN_NO";
  @Output() restartHeatConfirm = new EventEmitter<void>();
  @Output() restartHeatCancel = new EventEmitter<void>();

  // Defer heat confirmation modal
  @Input() showDeferHeatConfirmation = false;
  @Input() deferHeatModalTitle = "RD_CONFIRM_DEFER_HEAT_TITLE";
  @Input() deferHeatModalMessage = "RD_CONFIRM_DEFER_HEAT_MESSAGE";
  @Input() deferHeatConfirmText = "GEN_YES";
  @Input() deferHeatCancelText = "GEN_NO";
  @Output() deferHeatConfirm = new EventEmitter<void>();
  @Output() deferHeatCancel = new EventEmitter<void>();
}
