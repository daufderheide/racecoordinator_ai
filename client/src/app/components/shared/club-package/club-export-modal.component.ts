import { CommonModule } from "@angular/common";
import {
  ChangeDetectorRef,
  Component,
  effect,
  input,
  output,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { firstValueFrom } from "rxjs";
import { DataService } from "@app/data.service";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { saveFileAs } from "@app/utils/file-download.utils";

/**
 * Club Race Export: asks for the championship name and saves the season as a
 * club package file. https://github.com/daufderheide/racecoordinator_ai/issues/972
 */
@Component({
  standalone: true,
  selector: "app-club-export-modal",
  templateUrl: "./club-export-modal.component.html",
  styleUrls: ["./club-package.css"],
  imports: [CommonModule, FormsModule, TranslatePipe],
})
export class ClubExportModalComponent {
  visible = input(false);
  seasonId = input<string | undefined>(undefined);
  seasonName = input("");
  raceNightCount = input(0);

  close = output<void>();
  exported = output<{ name: string }>();

  championshipName = "";
  isExporting = false;
  errorMessage: string | null = null;

  constructor(
    private dataService: DataService,
    private cdr: ChangeDetectorRef,
  ) {
    effect(() => {
      if (this.visible()) {
        this.championshipName = this.seasonName() || "";
        this.errorMessage = null;
      }
    });
  }

  get canExport(): boolean {
    return (
      !this.isExporting &&
      !!this.seasonId() &&
      this.championshipName.trim().length > 0
    );
  }

  onClose(): void {
    if (this.isExporting) return;
    this.close.emit();
  }

  async onExport(): Promise<void> {
    const seasonId = this.seasonId();
    if (!this.canExport || !seasonId) return;
    const name = this.championshipName.trim();
    this.isExporting = true;
    this.errorMessage = null;
    this.cdr.detectChanges();
    try {
      const saved = await saveFileAs({
        suggestedName: `${name.replace(/[^A-Za-z0-9._ -]/g, "_")}.rcclub.json`,
        data: () =>
          firstValueFrom(this.dataService.exportClubPackage(seasonId, name)),
        mimeType: "application/json",
        description: "Race Coordinator AI club package",
        extension: ".json",
      });
      if (saved) {
        this.exported.emit({ name });
        this.close.emit();
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        this.errorMessage = "CRE_ERR_EXPORT_FAILED";
      }
    } finally {
      this.isExporting = false;
      this.cdr.detectChanges();
    }
  }
}
