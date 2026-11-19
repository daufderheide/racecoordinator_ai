import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DataService } from "@app/data.service";
import {
  ClubImportItem,
  ClubImportNight,
  ClubImportOption,
  ClubImportPreview,
  ClubImportResult,
  ClubNightResolution,
} from "@app/models/club-package.model";
import { LocalDatePipe } from "@app/pipes/local-date.pipe";
import { TranslatePipe } from "@app/pipes/translate.pipe";

export type ClubItemKind = "drivers" | "tracks" | "raceClasses";

/**
 * Club Race Import: preview a club package, choose how its championship,
 * race nights, drivers, tracks and race classes are merged, then import it.
 * https://github.com/daufderheide/racecoordinator_ai/issues/972
 */
@Component({
  standalone: true,
  selector: "app-club-import-modal",
  templateUrl: "./club-import-modal.component.html",
  styleUrls: ["./club-package.css"],
  imports: [CommonModule, FormsModule, TranslatePipe, LocalDatePipe],
})
export class ClubImportModalComponent {
  visible = input(false);

  close = output<void>();
  imported = output<ClubImportResult>();

  step: "upload" | "preview" | "summary" = "upload";
  isLoading = false;
  isDragging = false;
  errorMessage: string | null = null;
  preview: ClubImportPreview | null = null;
  result: ClubImportResult | null = null;

  readonly kinds: { kind: ClubItemKind; titleKey: string }[] = [
    { kind: "drivers", titleKey: "CRI_SECTION_DRIVERS" },
    { kind: "tracks", titleKey: "CRI_SECTION_TRACKS" },
    { kind: "raceClasses", titleKey: "CRI_SECTION_RACE_CLASSES" },
  ];

  constructor(
    private dataService: DataService,
    private cdr: ChangeDetectorRef,
  ) {}

  onClose(): void {
    if (this.isLoading) return;
    this.reset();
    this.close.emit();
  }

  reset(): void {
    this.step = "upload";
    this.preview = null;
    this.result = null;
    this.errorMessage = null;
    this.isDragging = false;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(): void {
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) this.loadPreview(file);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.loadPreview(file);
    input.value = "";
  }

  loadPreview(file: File): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.cdr.detectChanges();
    this.dataService.previewClubImport(file).subscribe({
      next: (preview) => {
        this.preview = preview;
        this.step = "preview";
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        const key = typeof err?.error === "string" ? err.error : "";
        this.errorMessage = key.startsWith("CRI_")
          ? key
          : "CRI_ERR_NOT_A_CLUB_PACKAGE";
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  items(kind: ClubItemKind): ClubImportItem[] {
    return this.preview?.[kind] ?? [];
  }

  existingOptions(kind: ClubItemKind): ClubImportOption[] {
    return this.preview?.existing?.[kind] ?? [];
  }

  /** The "use" choice of an item: "new" or the id of an existing item. */
  targetOf(item: ClubImportItem): string {
    return item.resolution === "CREATE" || !item.existingId
      ? "new"
      : item.existingId;
  }

  setTarget(kind: ClubItemKind, item: ClubImportItem, target: string): void {
    if (target === "new") {
      item.resolution = "CREATE";
      return;
    }
    item.existingId = target;
    item.existingName =
      this.existingOptions(kind).find((o) => o.id === target)?.name ?? "";
    if (item.resolution === "CREATE") item.resolution = "MATCH";
  }

  setUpdate(item: ClubImportItem, update: boolean): void {
    item.resolution = update ? "UPDATE" : "MATCH";
  }

  nightOptions(night: ClubImportNight): ClubNightResolution[] {
    if (night.status === "NEW") return ["ADD", "SKIP"];
    return ["UPDATE", "SKIP"];
  }

  get nightsToImport(): number {
    return (this.preview?.raceNights ?? []).filter(
      (n) => n.resolution !== "SKIP",
    ).length;
  }

  countStatus(status: string): number {
    return (this.preview?.raceNights ?? []).filter((n) => n.status === status)
      .length;
  }

  setSeasonTarget(target: string): void {
    const season = this.preview?.season;
    if (!season) return;
    if (target === "new") {
      season.resolution = "CREATE";
      return;
    }
    season.resolution = "MERGE";
    season.existingId = target;
    season.existingName =
      this.preview?.existing?.seasons?.find((s) => s.id === target)?.name ?? "";
  }

  seasonTarget(): string {
    const season = this.preview?.season;
    return season?.resolution === "MERGE" && season.existingId
      ? season.existingId
      : "new";
  }

  matchLabelKey(item: ClubImportItem): string {
    if (item.resolution === "CREATE" || !item.existingId)
      return "CRI_MATCH_NEW";
    return item.matchType === "CLUB_ID"
      ? "CRI_MATCH_CLUB_ID"
      : "CRI_MATCH_NAME";
  }

  commit(): void {
    const p = this.preview;
    if (!p || this.isLoading) return;
    this.isLoading = true;
    this.errorMessage = null;
    this.cdr.detectChanges();
    this.dataService
      .commitClubImport({
        packageData: p.packageData,
        season: p.season,
        drivers: p.drivers,
        tracks: p.tracks,
        raceClasses: p.raceClasses,
        raceNights: p.raceNights,
      })
      .subscribe({
        next: (result) => {
          this.result = result;
          this.step = "summary";
          this.isLoading = false;
          this.imported.emit(result);
          this.cdr.detectChanges();
        },
        error: () => {
          this.errorMessage = "CRI_ERR_COMMIT_FAILED";
          this.isLoading = false;
          this.cdr.detectChanges();
        },
      });
  }
}
