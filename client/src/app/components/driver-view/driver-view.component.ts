import {
  ChangeDetectorRef,
  Component,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Subscription } from "rxjs";
import { DriverStationComponent } from "@app/components/driver-station/driver-station.component";
import { RacedayHeatDriversComponent } from "@app/components/raceday/components/raceday-heat-drivers/raceday-heat-drivers.component";
import { AcknowledgementModalComponent } from "@app/components/shared/acknowledgement-modal/acknowledgement-modal.component";
import { BrowserNavigationComponent } from "@app/components/shared/browser-navigation/browser-navigation.component";
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
    BrowserNavigationComponent,
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
      const returnUrl =
        this.route.snapshot.queryParamMap.get("returnUrl") || "/raceday-setup";
      this.router.navigateByUrl(returnUrl);
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
    this.raceConnectionService.disconnect();
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  @HostListener("window:pagehide")
  onPageHide() {
    this.raceConnectionService.disconnect();
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
      const targetId = decodeURIComponent(this.driverId);
      const driverDataIndex = this.currentHeat.heatDrivers.findIndex((hd) => {
        const actualEntityId = hd.actualDriver?.entity_id;
        const actualName = hd.actualDriver?.name;
        const driverEntityId = hd.driver?.entity_id;
        const driverName = hd.driver?.name;
        const driverNickname = hd.driver?.nickname;
        const teamEntityId = hd.participant?.team?.entity_id;
        const teamName = hd.participant?.team?.name;
        const participantId = hd.participant?.objectId;
        const hdObjectId = hd.objectId;

        return (
          (actualEntityId && actualEntityId === targetId) ||
          (actualName && actualName === targetId) ||
          (driverEntityId && driverEntityId === targetId) ||
          (driverName && driverName === targetId) ||
          (driverNickname && driverNickname === targetId) ||
          (teamEntityId && teamEntityId === targetId) ||
          (teamName && teamName === targetId) ||
          (participantId && participantId === targetId) ||
          (hdObjectId && hdObjectId === targetId)
        );
      });

      if (driverDataIndex >= 0) {
        this.isRacingInCurrentHeat = true;
        this.laneIndex = driverDataIndex;
      }
    }
  }
}
