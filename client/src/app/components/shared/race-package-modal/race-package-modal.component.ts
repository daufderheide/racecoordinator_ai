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
  DriverResolution,
  RacePackageCommitRequest,
  RacePackagePreview,
  RacePackageResult,
} from "@app/models/race-package.model";
import { Season } from "@app/models/season";
import { LocalDatePipe } from "@app/pipes/local-date.pipe";
import { TranslatePipe } from "@app/pipes/translate.pipe";

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
  visible = input(false);
  preview = input<RacePackagePreview | null>(null);
  targetSeasonId = input<string | undefined>(undefined);
  seasons = input<Season[]>([]);

  close = output<void>();
  committed = output<RacePackageResult>();

  currentStep: 1 | 2 = 1;
  showDriverDetails = false;

  duplicateAction: "OVERWRITE" | "CREATE_COPY" | "SKIP" = "CREATE_COPY";
  configAction:
    | "CREATE_NEW"
    | "AUTO_RENAME"
    | "OVERWRITE"
    | "USE_EXISTING"
    | "SKIP" = "CREATE_NEW";
  raceName: string = "";
  customConfigName: string = "";
  selectedSeasonId: string = "";
  driverResolutions: { [sourceDriverId: string]: DriverResolution } = {};
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
        this.initResolutions(p);
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
        });
    }
    if (typeof this.dataService?.getTeams === "function") {
      this.dataService
        .getTeams()
        .pipe(catchError(() => of([])))
        .subscribe((teams) => {
          this.localTeams = teams || [];
        });
    }
  }

  isTeam(sourceDriverId: string): boolean {
    return !!sourceDriverId && sourceDriverId.startsWith("t_");
  }

  initResolutions(preview: RacePackagePreview): void {
    this.driverResolutions = {};
    this.duplicateAction = "CREATE_COPY";
    this.configAction = "CREATE_NEW";
    this.currentStep = 1;
    this.showDriverDetails = false;

    if (preview.duplicate_race || preview.config_conflict) {
      this.raceName =
        preview.suggested_config_name ||
        (preview.existing_config_name
          ? preview.existing_config_name + " (1)"
          : (preview.manifest?.race_name || "") + " (1)");
    } else {
      this.raceName =
        preview.existing_config_name || preview.manifest?.race_name || "";
    }
    this.customConfigName = this.raceName;

    if (preview.driver_mappings) {
      for (const m of preview.driver_mappings) {
        this.driverResolutions[m.source_driver_id] = {
          source_driver_id: m.source_driver_id,
          action: m.suggested_action || "CREATE_NEW",
          target_driver_id: m.matched_local_driver_id || "",
          new_driver_name: m.source_driver_name || "",
        };
      }
    }
    this.cdr.detectChanges();
  }

  goToStep(step: 1 | 2): void {
    if (step === 2 && this.duplicateAction === "SKIP") {
      return;
    }
    this.currentStep = step;
    this.cdr.detectChanges();
  }

  toggleDriverDetails(): void {
    this.showDriverDetails = !this.showDriverDetails;
    this.cdr.detectChanges();
  }

  get allDriversMatched(): boolean {
    const mappings = this.preview()?.driver_mappings;
    if (!mappings || mappings.length === 0) return true;
    return mappings.every(
      (m) => m.match_type === "EXACT_NAME" || m.match_type === "EXACT_NICKNAME",
    );
  }

  get matchedDriversCount(): number {
    const mappings = this.preview()?.driver_mappings;
    if (!mappings) return 0;
    return mappings.filter(
      (m) => m.match_type === "EXACT_NAME" || m.match_type === "EXACT_NICKNAME",
    ).length;
  }

  get newDriversCount(): number {
    const mappings = this.preview()?.driver_mappings;
    if (!mappings) return 0;
    return mappings.length - this.matchedDriversCount;
  }

  onDuplicateActionChange(action: "OVERWRITE" | "CREATE_COPY" | "SKIP"): void {
    this.duplicateAction = action;
    const p = this.preview();
    if (action === "SKIP") {
      this.configAction = "SKIP";
    } else if (action === "CREATE_COPY") {
      this.configAction = "CREATE_NEW";
      if (p) {
        this.raceName =
          p.suggested_config_name ||
          (p.existing_config_name
            ? p.existing_config_name + " (1)"
            : (p.manifest?.race_name || "") + " (1)");
        this.customConfigName = this.raceName;
      }
    } else if (action === "OVERWRITE") {
      this.configAction = p?.config_conflict ? "OVERWRITE" : "CREATE_NEW";
      if (p) {
        this.raceName = p.existing_race_name || p.manifest?.race_name || "";
        this.customConfigName = this.raceName;
      }
    }
    this.cdr.detectChanges();
  }

  onConfigActionChange(
    action:
      | "CREATE_NEW"
      | "AUTO_RENAME"
      | "OVERWRITE"
      | "USE_EXISTING"
      | "SKIP",
  ): void {
    this.configAction = action;
    this.customConfigName = this.raceName;
    this.cdr.detectChanges();
  }

  onRaceNameChange(name: string): void {
    this.raceName = name;
    this.customConfigName = name;
  }

  onActionChange(sourceDriverId: string, action: "LINK" | "CREATE_NEW"): void {
    if (this.driverResolutions[sourceDriverId]) {
      this.driverResolutions[sourceDriverId].action = action;
      if (
        action === "LINK" &&
        !this.driverResolutions[sourceDriverId].target_driver_id
      ) {
        const mapping = this.preview()?.driver_mappings.find(
          (m) => m.source_driver_id === sourceDriverId,
        );
        if (mapping?.matched_local_driver_id) {
          this.driverResolutions[sourceDriverId].target_driver_id =
            mapping.matched_local_driver_id;
        } else if (this.isTeam(sourceDriverId) && this.localTeams.length > 0) {
          this.driverResolutions[sourceDriverId].target_driver_id =
            this.localTeams[0].entity_id || this.localTeams[0].id;
        } else if (this.localDrivers.length > 0) {
          this.driverResolutions[sourceDriverId].target_driver_id =
            this.localDrivers[0].entity_id || this.localDrivers[0].id;
        }
      }
    }
  }

  onTargetDriverChange(sourceDriverId: string, targetDriverId: string): void {
    if (this.driverResolutions[sourceDriverId]) {
      this.driverResolutions[sourceDriverId].target_driver_id = targetDriverId;
    }
  }

  onNewNameChange(sourceDriverId: string, newName: string): void {
    if (this.driverResolutions[sourceDriverId]) {
      this.driverResolutions[sourceDriverId].new_driver_name = newName;
    }
  }

  getResolution(sourceDriverId: string): DriverResolution | undefined {
    return this.driverResolutions[sourceDriverId];
  }

  async onCommit(): Promise<void> {
    const p = this.preview();
    if (!p) return;

    this.isCommitting = true;
    this.errorMessage = null;

    const resolutionsList: DriverResolution[] = Object.values(
      this.driverResolutions,
    );

    const effectiveRaceName = (
      this.raceName ||
      this.customConfigName ||
      ""
    ).trim();
    const request: RacePackageCommitRequest = {
      temp_package_token: p.temp_package_token,
      duplicate_action: this.duplicateAction,
      config_action: this.configAction,
      race_name: effectiveRaceName || undefined,
      custom_config_name: effectiveRaceName || undefined,
      driver_resolutions:
        this.duplicateAction === "SKIP" ? [] : resolutionsList,
      season_id: this.selectedSeasonId ? this.selectedSeasonId : undefined,
    };

    try {
      const result = await firstValueFrom(
        this.dataService.commitRacePackage(request),
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
