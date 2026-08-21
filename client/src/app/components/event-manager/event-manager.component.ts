import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { forkJoin, Subscription } from "rxjs";
import { ConfirmationModalComponent } from "@app/components/shared/confirmation-modal/confirmation-modal.component";
import { ManagerHeaderComponent } from "@app/components/shared/manager-header/manager-header.component";
import { DataService } from "@app/data.service";
import { Event } from "@app/models/event";
import { Race } from "@app/models/race";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import {
  ConnectionMonitorService,
  ConnectionState,
} from "@app/services/connection-monitor.service";
import { GuideStep } from "@app/services/help.service";
import { LoggerService } from "@app/services/logger.service";
import { NavigationService } from "@app/services/navigation.service";
import { RaceConnectionService } from "@app/services/race-connection.service";
import { SettingsService } from "@app/services/settings.service";
import { TranslationService } from "@app/services/translation.service";
import { naturalSortCompare } from "@app/utils/sorting.utils";

@Component({
  standalone: true,
  selector: "app-event-manager",
  templateUrl: "./event-manager.component.html",
  styleUrls: ["./event-manager.component.css"],
  imports: [
    ManagerHeaderComponent,
    ConfirmationModalComponent,
    TranslatePipe,
    FormsModule,
  ],
})
export class EventManagerComponent implements OnInit, OnDestroy {
  @ViewChild(ManagerHeaderComponent) header!: ManagerHeaderComponent;
  events: Event[] = [];
  races: Race[] = [];
  selectedEvent?: Event;
  isLoading: boolean = true;
  isSaving: boolean = false;
  scale: number = 1;
  searchQuery: string = "";
  showDeleteConfirmation: boolean = false;

  @ViewChildren("eventRow") eventRows!: QueryList<ElementRef>;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dataService = inject(DataService);
  private cdr = inject(ChangeDetectorRef);
  private logger = inject(LoggerService);
  private navigationService = inject(NavigationService);
  private settingsService = inject(SettingsService);
  private translationService = inject(TranslationService);
  private connectionMonitor = inject(ConnectionMonitorService);
  private raceConnectionService = inject(RaceConnectionService);

  private connectionSub?: Subscription;

  get filteredEvents(): Event[] {
    let filtered = this.events;
    if (this.searchQuery && this.searchQuery.trim() !== "") {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = this.events.filter(
        (e) =>
          (e.name && e.name.toLowerCase().includes(query)) ||
          (e.description && e.description.toLowerCase().includes(query)),
      );
    }
    return filtered.sort((a, b) =>
      naturalSortCompare(a.name || "", b.name || ""),
    );
  }

  ngOnInit(): void {
    this.updateScale();
    this.loadData();

    this.connectionSub = this.connectionMonitor.connectionState$.subscribe(
      (state) => {
        if (state === ConnectionState.DISCONNECTED) {
          this.logger.warn("Connection lost in EventManagerComponent");
        }
      },
    );
  }

  ngOnDestroy(): void {
    if (this.connectionSub) {
      this.connectionSub.unsubscribe();
    }
  }

  @HostListener("window:resize")
  onResize(): void {
    this.updateScale();
  }

  private updateScale(): void {
    const baseWidth = 1600;
    const baseHeight = 900;
    const scaleX = window.innerWidth / baseWidth;
    const scaleY = window.innerHeight / baseHeight;
    this.scale = Math.min(scaleX, scaleY);
  }

  loadData(): void {
    this.isLoading = true;
    forkJoin({
      events: this.dataService.getEvents(),
      races: this.dataService.getRaces(),
    }).subscribe({
      next: (result) => {
        this.events = (result.events || []).sort((a, b) =>
          naturalSortCompare(a.name || "", b.name || ""),
        );
        this.races = result.races || [];

        const lastEdited = this.navigationService.getLastEditedId("event");
        let selectedId =
          this.route.snapshot.queryParamMap.get("id") ||
          this.route.snapshot.queryParamMap.get("selectedId");

        if (lastEdited) {
          selectedId = lastEdited;
          this.navigationService.clearLastEditedId("event");
          this.router.navigate([], {
            queryParams: { id: lastEdited },
            queryParamsHandling: "merge",
            replaceUrl: true,
          });
        }

        if (selectedId) {
          const found = this.events.find((e) => e.entity_id === selectedId);
          if (found) {
            this.selectedEvent = found;
          } else if (this.events.length > 0) {
            this.selectedEvent = this.filteredEvents[0] || this.events[0];
          }
        } else if (this.events.length > 0 && !this.selectedEvent) {
          this.selectedEvent = this.filteredEvents[0] || this.events[0];
        }

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.logger.error("Failed to load event manager data", err);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  selectEvent(event: Event): void {
    this.selectedEvent = event;
  }

  createNewEvent(): void {
    this.router.navigate(["/event-editor"], {
      queryParams: { id: "new" },
    });
  }

  updateEvent(): void {
    if (this.selectedEvent && this.selectedEvent.entity_id) {
      this.router.navigate(["/event-editor"], {
        queryParams: { id: this.selectedEvent.entity_id },
      });
    }
  }

  deleteEvent(): void {
    if (!this.selectedEvent) return;
    this.showDeleteConfirmation = true;
  }

  onConfirmDelete(): void {
    if (!this.selectedEvent || !this.selectedEvent.entity_id) return;
    this.showDeleteConfirmation = false;
    this.isSaving = true;
    this.dataService.deleteEvent(this.selectedEvent.entity_id).subscribe({
      next: () => {
        this.isSaving = false;
        this.selectedEvent = undefined;
        this.loadData();
      },
      error: (err) => {
        this.logger.error("Failed to delete event", err);
        this.isSaving = false;
      },
    });
  }

  onCancelDelete(): void {
    this.showDeleteConfirmation = false;
  }

  getRaceId(r: any): string {
    if (!r) return "";
    return r.entity_id || "";
  }

  getItemRaceId(item: any): string {
    if (!item) return "";
    return item.raceId || item.race_id || "";
  }

  getItemMaxDrivers(item: any): number {
    if (!item) return 0;
    return item.maxDrivers !== undefined
      ? item.maxDrivers
      : item.max_drivers !== undefined
        ? item.max_drivers
        : 0;
  }

  getRace(raceId: string): Race | undefined {
    if (!raceId) return undefined;
    return this.races.find((r) => r.entity_id === raceId);
  }

  getRaceName(raceId: string): string {
    if (!raceId) return "";
    const race = this.getRace(raceId);
    return race ? race.name : raceId;
  }

  formatEnumDisplay(value: string | undefined): string {
    if (!value) return "";
    return value
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }

  getRaceFinishMethod(raceId: string): string {
    const race: any = this.getRace(raceId);
    if (!race) return "";
    const fm =
      race.heat_scoring?.finish_method || race.heat_scoring?.finishMethod;
    return this.formatEnumDisplay(fm);
  }

  getRaceFinishValue(raceId: string): string {
    const race: any = this.getRace(raceId);
    if (!race) return "";
    const val =
      race.heat_scoring?.finish_value !== undefined
        ? race.heat_scoring?.finish_value
        : race.heat_scoring?.finishValue;
    if (val === 0 || val === "0") {
      return this.translationService.translate("GEN_INFINITE");
    }
    return val !== undefined && val !== null ? String(val) : "";
  }

  getDeleteMessage(): string {
    return (
      this.translationService.translate("EM_CONFIRM_DELETE_MSG", {
        name: this.selectedEvent?.name || "",
      }) ||
      `Are you sure you want to delete event "${this.selectedEvent?.name}"?`
    );
  }

  getHelpSteps(): GuideStep[] {
    return [
      {
        title: this.translationService.translate("EM_HELP_WELCOME_TITLE"),
        content: this.translationService.translate("EM_HELP_WELCOME_CONTENT"),
        position: "center",
      },
      {
        selector: "#event-list-container",
        title: this.translationService.translate("EM_HELP_LIST_TITLE"),
        content: this.translationService.translate("EM_HELP_LIST_CONTENT"),
        position: "right",
      },
      {
        selector: "#event-search-bar",
        title: this.translationService.translate("EM_HELP_SEARCH_TITLE"),
        content: this.translationService.translate("EM_HELP_SEARCH_CONTENT"),
        position: "right",
      },
      {
        selector: "#event-detail-name",
        title: this.translationService.translate("EM_HELP_NAME_TITLE"),
        content: this.translationService.translate("EM_HELP_NAME_CONTENT"),
        position: "bottom",
      },
      {
        selector: "#event-detail-description",
        title: this.translationService.translate("EM_HELP_DESCRIPTION_TITLE"),
        content: this.translationService.translate(
          "EM_HELP_DESCRIPTION_CONTENT",
        ),
        position: "bottom",
      },
      {
        selector: "#event-detail-auto-advance",
        title: this.translationService.translate("EM_HELP_AUTO_ADVANCE_TITLE"),
        content: this.translationService.translate(
          "EM_HELP_AUTO_ADVANCE_CONTENT",
        ),
        position: "bottom",
      },
      {
        selector: "#event-detail-races",
        title: this.translationService.translate("EM_HELP_RACES_TITLE"),
        content: this.translationService.translate("EM_HELP_RACES_CONTENT"),
        position: "left",
      },
    ];
  }
}
