import {
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Subscription } from "rxjs";
import { DriverStationComponent } from "@app/components/driver-station/driver-station.component";
import { RacedayHeatDriversComponent } from "@app/components/raceday/components/raceday-heat-drivers/raceday-heat-drivers.component";
import { AcknowledgementModalComponent } from "@app/components/shared/acknowledgement-modal/acknowledgement-modal.component";
import { DataService } from "@app/data.service";
import { Track } from "@app/models/track";
import { Heat } from "@app/race/heat";
import { AuthService } from "@app/services/auth.service";
import { RaceService } from "@app/services/race.service";
import { RaceConnectionService } from "@app/services/race-connection.service";
import { ViewerRaceEndedHandler } from "@app/utils/viewer-race-ended-handler";

@Component({
  standalone: true,
  selector: "app-driver-view",
  templateUrl: "./driver-view.component.html",
  styleUrls: ["./driver-view.component.css"],
  imports: [
    DriverStationComponent,
    RacedayHeatDriversComponent,
    AcknowledgementModalComponent,
  ],
})
export class DriverViewComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  protected viewerRaceEndedHandler!: ViewerRaceEndedHandler;

  get showAckModal(): boolean {
    return this.viewerRaceEndedHandler?.showAckModal ?? false;
  }
  set showAckModal(v: boolean) {
    if (this.viewerRaceEndedHandler)
      this.viewerRaceEndedHandler.showAckModal = v;
  }
  get ackModalTitle(): string {
    return this.viewerRaceEndedHandler?.ackModalTitle ?? "";
  }
  set ackModalTitle(v: string) {
    if (this.viewerRaceEndedHandler)
      this.viewerRaceEndedHandler.ackModalTitle = v;
  }
  get ackModalMessage(): string {
    return this.viewerRaceEndedHandler?.ackModalMessage ?? "";
  }
  set ackModalMessage(v: string) {
    if (this.viewerRaceEndedHandler)
      this.viewerRaceEndedHandler.ackModalMessage = v;
  }
  get ackModalButtonText(): string {
    return (
      this.viewerRaceEndedHandler?.ackModalButtonText ?? "ACK_MODAL_BTN_OK"
    );
  }
  set ackModalButtonText(v: string) {
    if (this.viewerRaceEndedHandler)
      this.viewerRaceEndedHandler.ackModalButtonText = v;
  }
  get raceHasEnded(): boolean {
    return this.viewerRaceEndedHandler?.raceHasEnded ?? false;
  }
  set raceHasEnded(v: boolean) {
    if (this.viewerRaceEndedHandler)
      this.viewerRaceEndedHandler.raceHasEnded = v;
  }

  onAcknowledgeModal() {
    const raceHasEnded = this.raceHasEnded;
    this.showAckModal = false;
    if (raceHasEnded) {
      this.router.navigate(["/raceday-setup"]);
    }
  }

  protected driverId: string = "";
  protected isRacingInCurrentHeat: boolean = false;
  protected laneIndex: number = 0;
  protected heats: Heat[] = [];
  protected currentHeat?: Heat;
  protected track?: Track;
  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private dataService: DataService,
    private raceService: RaceService,
    private raceConnectionService: RaceConnectionService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.raceConnectionService.connect();

    this.viewerRaceEndedHandler = new ViewerRaceEndedHandler(
      this.dataService,
      this.authService,
      this.cdr,
      {
        onlyForViewer: true,
        skipRaceStartedAck: true,
        onRaceStarted: () => {
          this.loadData();
        },
      },
    );
    this.viewerRaceEndedHandler.startListening();

    this.subscriptions.push(
      this.route.params.subscribe((params) => {
        this.driverId = params["driverId"] || "";
        this.loadData();
      }),
    );

    this.subscriptions.push(
      this.raceService.currentHeat$.subscribe(() => {
        this.loadData();
        this.cdr.detectChanges();
      }),
    );

    this.subscriptions.push(
      this.raceService.selectedRace$.subscribe(() => {
        this.loadData();
        this.cdr.detectChanges();
      }),
    );
  }

  ngOnDestroy() {
    if (this.viewerRaceEndedHandler) {
      this.viewerRaceEndedHandler.stopListening();
    }
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  private loadData() {
    const race = this.raceService.getRace();
    if (race) {
      this.track = race.track;
      this.heats = this.raceService.getHeats() || [];
      this.currentHeat = this.raceService.getCurrentHeat();
      this.checkDriverStatus();
    }
  }

  private checkDriverStatus() {
    this.isRacingInCurrentHeat = false;
    if (this.currentHeat && this.driverId) {
      const driverDataIndex = this.currentHeat.heatDrivers.findIndex((hd) => {
        const entityId = hd.actualDriver?.entity_id || hd.driver?.entity_id;
        const teamId = hd.participant?.team?.entity_id;
        return (
          entityId === this.driverId || (teamId && teamId === this.driverId)
        );
      });

      if (driverDataIndex >= 0) {
        this.isRacingInCurrentHeat = true;
        this.laneIndex = driverDataIndex;
      }
    }
  }
}
