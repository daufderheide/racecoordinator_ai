import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from "@angular/cdk/drag-drop";
import {
  ChangeDetectorRef,
  Component,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { forkJoin, Subscription } from "rxjs";
import { EditorTitleComponent } from "@app/components/shared/editor-title/editor-title.component";
import { UndoManager } from "@app/components/shared/undo-redo-controls/undo-manager";
import { DataService } from "@app/data.service";
import { DirtyComponent } from "@app/interfaces/dirty-component";
import { Event, EventRaceItem } from "@app/models/event";
import { Race } from "@app/models/race";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { LoggerService } from "@app/services/logger.service";

@Component({
  standalone: true,
  selector: "app-event-editor",
  templateUrl: "./event-editor.component.html",
  styleUrls: ["./event-editor.component.css"],
  imports: [EditorTitleComponent, TranslatePipe, FormsModule, DragDropModule],
})
export class EventEditorComponent implements OnInit, OnDestroy, DirtyComponent {
  isNavigationApproved = false;

  editingEvent: Event = {
    name: "",
    description: "",
    auto_advance_time: 0,
    races: [],
  };

  existingEvents: Event[] = [];
  availableRaces: Race[] = [];

  isLoading = true;
  isSaving = false;
  scale = 1;
  showAddRaceModal = false;
  selectedRaceToAddId = "";

  undoManager: UndoManager<Event>;
  private subscriptions: Subscription[] = [];

  private dataService = inject(DataService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private logger = inject(LoggerService);

  constructor() {
    this.undoManager = new UndoManager<Event>(
      {
        clonner: (e) => this.cloneEvent(e),
        equalizer: (a, b) => this.areEventsEqual(a, b),
        applier: (e) => {
          const currentId = this.editingEvent?.entity_id;
          this.editingEvent = e;
          if (currentId && this.editingEvent) {
            this.editingEvent.entity_id = currentId;
          }
        },
      },
      () => this.editingEvent,
    );

    this.subscriptions.push(
      this.undoManager.stateCommitted$.subscribe(() => {
        this.autoSaveEvent();
      }),
    );
  }

  ngOnInit(): void {
    this.updateScale();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
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

  private cloneEvent(e: Event): Event {
    if (!e) {
      return { name: "", description: "", auto_advance_time: 0, races: [] };
    }
    return {
      entity_id: e.entity_id,
      name: e.name,
      description: e.description || "",
      auto_advance_time: e.auto_advance_time || 0,
      races: (e.races || []).map((r: any) => ({
        raceId: r.raceId || r.race_id || "",
        maxDrivers:
          r.maxDrivers !== undefined
            ? r.maxDrivers
            : r.max_drivers !== undefined
              ? r.max_drivers
              : 0,
      })),
    };
  }

  private areEventsEqual(a: Event, b: Event): boolean {
    if (!a || !b) return a === b;
    if (a.name !== b.name) return false;
    if ((a.description || "") !== (b.description || "")) return false;
    if ((a.auto_advance_time || 0) !== (b.auto_advance_time || 0)) return false;
    const racesA = a.races || [];
    const racesB = b.races || [];
    if (racesA.length !== racesB.length) return false;
    for (let i = 0; i < racesA.length; i++) {
      if (this.getItemRaceId(racesA[i]) !== this.getItemRaceId(racesB[i]))
        return false;
      if (
        this.getItemMaxDrivers(racesA[i]) !== this.getItemMaxDrivers(racesB[i])
      )
        return false;
    }
    return true;
  }

  loadData(): void {
    this.isLoading = true;
    const eventId = this.route.snapshot.queryParamMap.get("id");

    forkJoin({
      events: this.dataService.getEvents(),
      races: this.dataService.getRaces(),
    }).subscribe({
      next: (result) => {
        this.existingEvents = result.events || [];
        this.availableRaces = result.races || [];

        if (eventId && eventId !== "new") {
          const found = this.existingEvents.find(
            (e) => e.entity_id === eventId,
          );
          if (found) {
            this.editingEvent = this.cloneEvent(found);
          } else {
            this.editingEvent = {
              name: "New Event",
              description: "",
              auto_advance_time: 0,
              races: [],
            };
          }
        } else {
          this.editingEvent = {
            name: "New Event",
            description: "",
            auto_advance_time: 0,
            races: [],
          };
        }

        this.undoManager.initialize(this.editingEvent);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.logger.error("Failed to load event editor data", err);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  onInputChange(): void {
    this.undoManager.captureState();
  }

  isDuplicateName(): boolean {
    if (!this.editingEvent.name) return false;
    const trimmed = this.editingEvent.name.trim().toLowerCase();
    return this.existingEvents.some(
      (e) =>
        e.entity_id !== this.editingEvent.entity_id &&
        (e.name || "").trim().toLowerCase() === trimmed,
    );
  }

  isConfigValid(): boolean {
    if (!this.editingEvent.name || !this.editingEvent.name.trim()) return false;
    if (this.isDuplicateName()) return false;
    if (!this.editingEvent.races || this.editingEvent.races.length === 0)
      return false;
    return true;
  }

  isDirtyState(): boolean {
    return this.undoManager ? this.undoManager.hasChanges() : false;
  }

  hasChanges(): boolean {
    return this.isDirtyState();
  }

  autoSaveEvent(): void {
    if (!this.isConfigValid() || this.isSaving) return;
    this.isSaving = true;

    const op = this.editingEvent.entity_id
      ? this.dataService.updateEvent(
          this.editingEvent.entity_id,
          this.editingEvent,
        )
      : this.dataService.createEvent(this.editingEvent);

    op.subscribe({
      next: (saved) => {
        if (saved) {
          this.editingEvent = this.cloneEvent(saved);
          this.undoManager.resetTracking(this.editingEvent);
        }
        this.isSaving = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.logger.error("Failed to auto-save event", err);
        this.isSaving = false;
        this.cdr.detectChanges();
      },
    });
  }

  saveEvent(): void {
    this.autoSaveEvent();
  }

  saveAsNew(): void {
    if (!this.isConfigValid() || this.isSaving) return;
    this.isSaving = true;

    const newCopy: Event = {
      ...this.cloneEvent(this.editingEvent),
      entity_id: undefined,
      name: `${this.editingEvent.name} (Copy)`,
    };

    this.dataService.createEvent(newCopy).subscribe({
      next: (saved) => {
        this.isSaving = false;
        this.isNavigationApproved = true;
        this.editingEvent = this.cloneEvent(saved);
        this.undoManager.resetTracking(this.editingEvent);
        this.router.navigate(["/event-manager"]);
      },
      error: (err) => {
        this.logger.error("Failed to copy event", err);
        this.isSaving = false;
        this.cdr.detectChanges();
      },
    });
  }

  cancel(): void {
    this.isNavigationApproved = true;
    this.router.navigate(["/event-manager"]);
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
    if (!item || typeof item !== "object") return 0;
    return item.maxDrivers !== undefined
      ? item.maxDrivers
      : item.max_drivers !== undefined
        ? item.max_drivers
        : 0;
  }

  setMaxDrivers(item: any, val: number | string): void {
    if (!item) return;
    const num = typeof val === "number" ? val : parseInt(val, 10) || 0;
    item.maxDrivers = num;
    item.max_drivers = num;
    this.onInputChange();
  }

  openAddRaceModal(): void {
    if (this.availableRaces.length > 0) {
      this.selectedRaceToAddId = this.getRaceId(this.availableRaces[0]);
    } else {
      this.selectedRaceToAddId = "";
    }
    this.showAddRaceModal = true;
  }

  closeAddRaceModal(): void {
    this.showAddRaceModal = false;
  }

  confirmAddRace(): void {
    if (!this.selectedRaceToAddId) return;
    this.editingEvent.races.push({
      raceId: this.selectedRaceToAddId,
      maxDrivers: 0, // Default to Unlimited
    });
    this.showAddRaceModal = false;
    this.onInputChange();
  }

  removeRace(index: number): void {
    this.editingEvent.races.splice(index, 1);
    this.onInputChange();
  }

  dropRace(event: CdkDragDrop<any[]>): void {
    moveItemInArray(
      this.editingEvent.races,
      event.previousIndex,
      event.currentIndex,
    );
    this.onInputChange();
  }

  getRaceName(raceId: string): string {
    if (!raceId) return "";
    const race = this.availableRaces.find((r) => r.entity_id === raceId);
    return race ? race.name : raceId;
  }

  toggleUnlimited(item: EventRaceItem): void {
    const current = this.getItemMaxDrivers(item);
    const newVal = current === 0 ? 4 : 0;
    this.setMaxDrivers(item, newVal);
  }
}
