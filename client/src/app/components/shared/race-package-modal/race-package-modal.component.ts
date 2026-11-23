import { CommonModule } from "@angular/common";
import {
  ChangeDetectorRef,
  Component,
  effect,
  input,
  OnInit,
  output,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { catchError, firstValueFrom, of } from "rxjs";
import {
  CustomOptionComponent,
  CustomSelectComponent,
} from "@app/components/shared/custom-select/custom-select.component";
import { DataService } from "@app/data.service";
import {
  DriverImportMapping,
  DriverResolution,
  RacePackageCommitRequest,
  RacePackagePreview,
  RacePackageResult,
} from "@app/models/race-package.model";
import { Season } from "@app/models/season";
import { LocalDatePipe } from "@app/pipes/local-date.pipe";
import { TranslatePipe } from "@app/pipes/translate.pipe";

/** What to do when the race is already in Race History. */
export type DuplicateChoice = "REPLACE" | "KEEP_BOTH";
/** What to do when a race format with the same name is already in the Race Editor. */
export type FormatChoice = "USE_MINE" | "SAVE_COPY" | "REPLACE_MINE";

/** Picker value that means "create a new driver/team" instead of linking. */
export const NEW_PARTICIPANT = "__new__";

interface LocalOption {
  value: string;
  label: string;
}

/**
 * One-screen import dialog for a race package (.rcpack).
 *
 * Every decision is shown only when it matters: the duplicate choice only for a
 * race that's already in Race History, the race format choice only when a format
 * with that name exists, and the driver list opens by itself when a driver isn't
 * matched by name. A local driver can only be used once.
 */
@Component({
  standalone: true,
  selector: "app-race-package-modal",
  templateUrl: "./race-package-modal.component.html",
  styleUrls: ["./race-package-modal.component.css"],
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    LocalDatePipe,
    CustomSelectComponent,
    CustomOptionComponent,
  ],
})
export class RacePackageModalComponent implements OnInit {
  readonly NEW_PARTICIPANT = NEW_PARTICIPANT;

  visible = input(false);
  preview = input<RacePackagePreview | null>(null);
  targetSeasonId = input<string | undefined>(undefined);
  seasons = input<Season[]>([]);

  close = output<void>();
  committed = output<RacePackageResult>();

  duplicateChoice: DuplicateChoice = "REPLACE";
  formatChoice: FormatChoice = "USE_MINE";
  saveFormat = true;
  raceName = "";
  selectedSeasonId = "";
  showDrivers = false;
  /** Picker value per source driver: a local id, NEW_PARTICIPANT, or "" (not picked yet). */
  picks: { [sourceDriverId: string]: string } = {};
  newNames: { [sourceDriverId: string]: string } = {};
  localDrivers: any[] = [];
  localTeams: any[] = [];
  isCommitting = false;
  errorMessage: string | null = null;

  constructor(
    private dataService: DataService,
    private cdr: ChangeDetectorRef,
  ) {
    effect(() => {
      const p = this.preview();
      if (p) {
        this.initFromPreview(p);
      }
      const seasonId = this.targetSeasonId();
      if (seasonId) {
        this.selectedSeasonId = seasonId;
      }
    });
  }

  ngOnInit(): void {
    if (typeof this.dataService?.getDrivers === "function") {
      this.dataService
        .getDrivers()
        .pipe(catchError(() => of([])))
        .subscribe((drivers) => {
          this.localDrivers = drivers || [];
          this.cdr.markForCheck();
        });
    }
    if (typeof this.dataService?.getTeams === "function") {
      this.dataService
        .getTeams()
        .pipe(catchError(() => of([])))
        .subscribe((teams) => {
          this.localTeams = teams || [];
          this.cdr.markForCheck();
        });
    }
  }

  initFromPreview(preview: RacePackagePreview): void {
    this.duplicateChoice = "REPLACE";
    this.formatChoice = "USE_MINE";
    this.saveFormat = true;
    this.errorMessage = null;
    this.picks = {};
    this.newNames = {};
    for (const m of preview.driver_mappings || []) {
      this.picks[m.source_driver_id] = m.matched_local_driver_id
        ? this.localValue(m.source_driver_id, m.matched_local_driver_id)
        : NEW_PARTICIPANT;
      this.newNames[m.source_driver_id] = m.source_driver_name || "";
    }
    // Open the list when anything isn't an exact name match, so it gets a look.
    this.showDrivers = (preview.driver_mappings || []).some(
      (m) => m.match_type !== "EXACT_NAME",
    );
    this.raceName = this.defaultRaceName();
    this.cdr.detectChanges();
  }

  // ---------- race and race format ----------

  get hasDuplicate(): boolean {
    return !!this.preview()?.duplicate_race;
  }

  get hasFormatConflict(): boolean {
    return !!this.preview()?.config_conflict;
  }

  /** The name is taken from the existing race format when that format is used or replaced. */
  get isNameLocked(): boolean {
    return this.hasFormatConflict && this.formatChoice !== "SAVE_COPY";
  }

  private defaultRaceName(): string {
    const p = this.preview();
    if (!p) return "";
    if (this.hasFormatConflict) {
      return this.formatChoice === "SAVE_COPY"
        ? p.suggested_config_name ||
            (p.existing_config_name || p.manifest?.race_name || "") + " (1)"
        : p.existing_config_name || p.manifest?.race_name || "";
    }
    return p.manifest?.race_name || "";
  }

  onFormatChoiceChange(choice: FormatChoice): void {
    this.formatChoice = choice;
    this.raceName = this.defaultRaceName();
    this.cdr.detectChanges();
  }

  onDuplicateChoiceChange(choice: DuplicateChoice): void {
    this.duplicateChoice = choice;
    this.cdr.detectChanges();
  }

  // ---------- drivers ----------

  isTeam(sourceDriverId: string): boolean {
    return !!sourceDriverId && sourceDriverId.startsWith("t_");
  }

  /** Team targets are sent with the "t_" prefix the server expects. */
  private localValue(sourceDriverId: string, localId: string): string {
    if (!this.isTeam(sourceDriverId) || localId.startsWith("t_")) {
      return localId;
    }
    return "t_" + localId;
  }

  localOptions(sourceDriverId: string): LocalOption[] {
    if (this.isTeam(sourceDriverId)) {
      return this.localTeams.map((t) => ({
        value: "t_" + (t.entity_id || t.id),
        label: t.name,
      }));
    }
    return this.localDrivers.map((d) => ({
      value: d.entity_id || d.id,
      label: d.nickname ? `${d.name} (${d.nickname})` : d.name,
    }));
  }

  /** Name of the other package driver already linked to this local driver, or null. */
  usedBy(localValue: string, sourceDriverId: string): string | null {
    const mappings = this.preview()?.driver_mappings || [];
    for (const m of mappings) {
      if (
        m.source_driver_id !== sourceDriverId &&
        this.picks[m.source_driver_id] === localValue
      ) {
        return m.source_driver_name;
      }
    }
    return null;
  }

  onPickChange(sourceDriverId: string, value: string): void {
    this.picks[sourceDriverId] = value;
    this.cdr.detectChanges();
  }

  onNewNameChange(sourceDriverId: string, name: string): void {
    this.newNames[sourceDriverId] = name;
  }

  toggleDrivers(): void {
    this.showDrivers = !this.showDrivers;
    this.cdr.detectChanges();
  }

  matchBadgeKey(m: DriverImportMapping): string {
    if (m.match_type === "EXACT_NAME") return "RPM_MATCH_SAME_NAME";
    if (m.match_type === "EXACT_NICKNAME") return "RPM_MATCH_SAME_NICKNAME";
    return "RPM_MATCH_NOT_FOUND";
  }

  get linkedCount(): number {
    return Object.values(this.picks).filter(
      (v) => v !== "" && v !== NEW_PARTICIPANT,
    ).length;
  }

  get newCount(): number {
    return Object.values(this.picks).filter((v) => v === NEW_PARTICIPANT)
      .length;
  }

  /** Rows still waiting for a choice, or using a local driver twice. */
  get unresolvedCount(): number {
    const mappings = this.preview()?.driver_mappings || [];
    return mappings.filter((m) => {
      const v = this.picks[m.source_driver_id];
      if (!v) return true;
      if (v === NEW_PARTICIPANT) {
        return !(this.newNames[m.source_driver_id] || "").trim();
      }
      return this.usedBy(v, m.source_driver_id) !== null;
    }).length;
  }

  get canImport(): boolean {
    return (
      !this.isCommitting &&
      this.unresolvedCount === 0 &&
      this.raceName.trim().length > 0
    );
  }

  // ---------- commit ----------

  buildRequest(p: RacePackagePreview): RacePackageCommitRequest {
    let configAction: RacePackageCommitRequest["config_action"];
    if (this.hasFormatConflict) {
      configAction =
        this.formatChoice === "USE_MINE"
          ? "USE_EXISTING"
          : this.formatChoice === "REPLACE_MINE"
            ? "OVERWRITE"
            : "CREATE_NEW";
    } else {
      configAction = this.saveFormat ? "CREATE_NEW" : "SKIP";
    }

    const resolutions: DriverResolution[] = (p.driver_mappings || []).map(
      (m) => {
        const v = this.picks[m.source_driver_id];
        return v === NEW_PARTICIPANT
          ? {
              source_driver_id: m.source_driver_id,
              action: "CREATE_NEW",
              new_driver_name: (this.newNames[m.source_driver_id] || "").trim(),
            }
          : {
              source_driver_id: m.source_driver_id,
              action: "LINK",
              target_driver_id: v,
            };
      },
    );

    const name = this.raceName.trim();
    return {
      temp_package_token: p.temp_package_token,
      duplicate_action:
        this.hasDuplicate && this.duplicateChoice === "REPLACE"
          ? "OVERWRITE"
          : "CREATE_COPY",
      config_action: configAction,
      race_name: name || undefined,
      custom_config_name: name || undefined,
      driver_resolutions: resolutions,
      season_id: this.selectedSeasonId || undefined,
    };
  }

  async onCommit(): Promise<void> {
    const p = this.preview();
    if (!p || !this.canImport) return;

    this.isCommitting = true;
    this.errorMessage = null;
    try {
      const result = await firstValueFrom(
        this.dataService.commitRacePackage(this.buildRequest(p)),
      );
      this.isCommitting = false;
      this.committed.emit(result);
      this.close.emit();
    } catch (err: any) {
      this.isCommitting = false;
      this.errorMessage =
        err?.error?.message || err?.message || "RPM_ERR_COMMIT_FAILED";
      this.cdr.detectChanges();
    }
  }

  onClose(): void {
    if (!this.isCommitting) {
      this.close.emit();
    }
  }
}
