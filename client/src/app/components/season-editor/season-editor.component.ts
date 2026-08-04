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
import { Subscription } from "rxjs";
import { EditorTitleComponent } from "@app/components/shared/editor-title/editor-title.component";
import { UndoManager } from "@app/components/shared/undo-redo-controls/undo-manager";
import { DataService } from "@app/data.service";
import { DirtyComponent } from "@app/interfaces/dirty-component";
import { Season } from "@app/models/season";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { LoggerService } from "@app/services/logger.service";
import { NavigationService } from "@app/services/navigation.service";

@Component({
  standalone: true,
  selector: "app-season-editor",
  templateUrl: "./season-editor.component.html",
  styleUrls: ["./season-editor.component.css"],
  imports: [EditorTitleComponent, TranslatePipe, FormsModule],
})
export class SeasonEditorComponent implements OnInit, OnDestroy, DirtyComponent {
  isNavigationApproved = false;

  editingSeason: Season = {
    name: "",
    drops: 0,
    races: [],
  };

  existingSeasons: Season[] = [];

  isLoading = true;
  isSaving = false;
  scale = 1;

  undoManager: UndoManager<Season>;
  private subscriptions: Subscription[] = [];

  private dataService = inject(DataService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private logger = inject(LoggerService);
  private navigationService = inject(NavigationService);

  constructor() {
    this.undoManager = new UndoManager<Season>(
      {
        clonner: (s) => this.cloneSeason(s),
        equalizer: (a, b) => this.areSeasonsEqual(a, b),
        applier: (s) => {
          const currentId = this.editingSeason?.entity_id;
          this.editingSeason = s;
          if (currentId && this.editingSeason) {
            this.editingSeason.entity_id = currentId;
          }
        },
      },
      () => this.editingSeason,
    );

    this.subscriptions.push(
      this.undoManager.stateCommitted$.subscribe(() => {
        this.cdr.markForCheck();
      }),
    );
  }

  get isDirty(): boolean {
    return this.undoManager.canUndo();
  }

  hasChanges(): boolean {
    return this.undoManager.canUndo();
  }

  ngOnInit(): void {
    this.updateScale();
    const seasonId = this.route.snapshot.queryParams["id"];

    this.dataService.getSeasons().subscribe({
      next: (seasons) => {
        this.existingSeasons = seasons;
        if (seasonId) {
          const target = seasons.find((s) => s.entity_id === seasonId);
          if (target) {
            this.editingSeason = this.cloneSeason(target);
          }
        }
        this.undoManager.initialize(this.cloneSeason(this.editingSeason));
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.logger.error("Failed to load seasons in editor", err);
        this.undoManager.initialize(this.cloneSeason(this.editingSeason));
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  @HostListener("window:resize")
  onResize(): void {
    this.updateScale();
  }

  private updateScale(): void {
    const baseWidth = 1920;
    const baseHeight = 1080;
    const scaleX = window.innerWidth / baseWidth;
    const scaleY = window.innerHeight / baseHeight;
    this.scale = Math.min(scaleX, scaleY);
  }

  captureState(): void {
    this.undoManager.captureState();
    this.cdr.markForCheck();
  }

  get isNameDuplicate(): boolean {
    if (!this.editingSeason || !this.editingSeason.name) return false;
    const currentName = this.editingSeason.name.trim().toLowerCase();
    return this.existingSeasons.some(
      (s) =>
        s.name.trim().toLowerCase() === currentName &&
        s.entity_id !== this.editingSeason.entity_id,
    );
  }

  get isFormValid(): boolean {
    if (!this.editingSeason || !this.editingSeason.name || this.editingSeason.name.trim() === "") {
      return false;
    }
    if (this.isNameDuplicate) {
      return false;
    }
    if (this.editingSeason.drops === undefined || this.editingSeason.drops < 0) {
      return false;
    }
    return true;
  }

  onSave(): void {
    if (!this.isFormValid || this.isSaving) return;

    this.isSaving = true;
    const payload: Season = {
      ...this.editingSeason,
      name: this.editingSeason.name.trim(),
      drops: Number(this.editingSeason.drops) || 0,
    };

    const request = payload.entity_id
      ? this.dataService.updateSeason(payload.entity_id, payload)
      : this.dataService.createSeason(payload);

    request.subscribe({
      next: (savedSeason) => {
        this.isSaving = false;
        this.undoManager.initialize(this.cloneSeason(this.editingSeason));
        this.isNavigationApproved = true;
        this.router.navigate(["/season-manager"], {
          queryParams: { id: savedSeason.entity_id || payload.entity_id },
        });
      },
      error: (err) => {
        this.logger.error("Failed to save season", err);
        this.isSaving = false;
        this.cdr.detectChanges();
      },
    });
  }

  onCancel(): void {
    this.isNavigationApproved = true;
    this.router.navigate(["/season-manager"]);
  }

  onUndo(): void {
    this.undoManager.undo();
  }

  onRedo(): void {
    this.undoManager.redo();
  }

  private cloneSeason(season: Season): Season {
    return JSON.parse(JSON.stringify(season));
  }

  private areSeasonsEqual(a: Season, b: Season): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
  }
}
