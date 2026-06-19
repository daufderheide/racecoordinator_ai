import { ChangeDetectorRef } from "@angular/core";
import { Subscription } from "rxjs";
import { DataService } from "@app/data.service";
import { Role } from "@app/models/role";
import { AuthService } from "@app/services/auth.service";

export class ViewerRaceEndedHandler {
  public showAckModal = false;
  public ackModalTitle = "";
  public ackModalMessage = "";
  public ackModalButtonText = "ACK_MODAL_BTN_OK";
  public raceHasEnded = false;

  private subscription?: Subscription;

  constructor(
    private dataService: DataService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private options?: {
      onlyForViewer?: boolean;
      onRaceStarted?: () => void;
      onRaceEnded?: () => void;
    },
  ) {}

  public startListening() {
    const onlyForViewer = this.options?.onlyForViewer ?? true;

    this.subscription = this.dataService.getSystemState().subscribe((state) => {
      if (onlyForViewer && this.authService.currentRole !== Role.VIEWER) {
        return;
      }

      if (state) {
        if (state.resourceLockState === "IDLE") {
          this.raceHasEnded = true;
          this.ackModalTitle = "RD_RACE_ENDED_TITLE";
          this.ackModalMessage = "RD_RACE_ENDED_MESSAGE";
          this.ackModalButtonText = "RD_RACE_ENDED_BTN_OK";
          this.showAckModal = true;
          if (this.options?.onRaceEnded) {
            this.options.onRaceEnded();
          }
          this.cdr.markForCheck();
        } else if (state.resourceLockState === "RACE_RUNNING") {
          if (this.raceHasEnded) {
            this.raceHasEnded = false;
            this.ackModalTitle = "RD_RACE_STARTED_TITLE";
            this.ackModalMessage = "RD_RACE_STARTED_MESSAGE";
            this.ackModalButtonText = "RD_RACE_STARTED_BTN_OK";
            this.showAckModal = true;
            this.dataService.updateRaceSubscription(true);
            if (this.options?.onRaceStarted) {
              this.options.onRaceStarted();
            }
            this.cdr.markForCheck();
          }
        }
      }
    });
  }

  public stopListening() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = undefined;
    }
  }

  public acknowledge() {
    this.showAckModal = false;
    this.cdr.markForCheck();
  }
}
