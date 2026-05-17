import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from "@angular/cdk/drag-drop";
import { CommonModule } from "@angular/common";
import {
  ChangeDetectorRef,
  Component,
  input,
  OnInit,
  output,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DataService } from "@app/data.service";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import {
  IAssetMessage,
  ICustomHeat,
  ICustomRotation,
  ITrackModel,
} from "@app/proto/antigravity";
import { LoggerService } from "@app/services/logger.service";
import { TranslationService } from "@app/services/translation.service";
import { deepCopy } from "@app/utils/clone.utils";

@Component({
  standalone: true,
  selector: "app-custom-rotation-editor",
  templateUrl: "./custom-rotation-editor.component.html",
  styleUrls: ["./custom-rotation-editor.component.css"],
  imports: [CommonModule, FormsModule, TranslatePipe, DragDropModule],
})
export class CustomRotationEditorComponent implements OnInit {
  readonly assetId = input<string>();
  readonly assetName = input<string>("");
  readonly numLanes = input<number>(4);
  readonly rotations = input<ICustomRotation[]>([]);

  internalAssetName: string = "";
  internalNumLanes: number = 4;
  internalRotations: ICustomRotation[] = [];
  equalityReport: any[] | null = null;
  reportRotationIdx: number = -1;
  importSummary: any[] | null = null;

  tracks: ITrackModel[] = [];
  selectedTrackId: string = "";
  selectedTrack?: ITrackModel;

  readonly saved = output<IAssetMessage>();
  readonly cancelled = output<void>();

  isSaving: boolean = false;

  constructor(
    private dataService: DataService,
    private translationService: TranslationService,
    private cdr: ChangeDetectorRef,
    private logger: LoggerService,
  ) {}

  ngOnInit() {
    this.internalAssetName = this.assetName();
    this.internalNumLanes = this.numLanes();
    this.internalRotations = deepCopy(this.rotations());

    this.loadTracks();
    if (this.internalRotations.length === 0) {
      this.addRotation();
    }
  }

  loadTracks() {
    this.dataService.getTracks().subscribe({
      next: (tracks) => {
        this.tracks = tracks;
        // If we have an existing numLanes, try to find a track that matches it
        // or just select the first one if we're new
        if (this.tracks.length > 0) {
          if (!this.assetId()) {
            // New rotation: select first track as default
            this.selectedTrack = this.tracks[0];
          } else {
            // Existing rotation: find first matching track by lane count
            const match = this.tracks.find(
              (t) => t.lanes?.length === this.internalNumLanes,
            );
            this.selectedTrack = match || this.tracks[0];
          }

          this.selectedTrackId =
            (this.selectedTrack as any)?.entity_id ||
            this.selectedTrack?.model?.entityId ||
            "";
          const trackLanes = this.selectedTrack?.lanes?.length || 4;

          if (trackLanes !== this.internalNumLanes) {
            this.internalNumLanes = trackLanes;
            this.onNumLanesChange();
          }
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.logger.error("Failed to load tracks", err);
      },
    });
  }

  onTrackChange() {
    this.selectedTrack = this.tracks.find(
      (t: any) => (t.entity_id || t.model?.entityId) === this.selectedTrackId,
    );
    if (this.selectedTrack) {
      this.internalNumLanes = this.selectedTrack.lanes?.length || 0;
      this.onNumLanesChange();
    }
  }

  addRotation() {
    this.internalRotations.push({
      numDrivers: this.internalNumLanes,
      heats: [],
    });
    this.addHeat(this.internalRotations[this.internalRotations.length - 1]);
  }

  removeRotation(index: number) {
    this.internalRotations.splice(index, 1);
  }

  addHeat(rotation: ICustomRotation) {
    if (!rotation.heats) {
      rotation.heats = [];
    }
    const driverIndices = new Array(this.internalNumLanes).fill(0);
    rotation.heats.push({
      driverIndices,
    });
  }

  removeHeat(rotation: ICustomRotation, index: number) {
    if (rotation.heats) {
      rotation.heats.splice(index, 1);
    }
  }

  dropHeat(rotation: ICustomRotation, event: CdkDragDrop<ICustomHeat[]>) {
    if (rotation.heats) {
      moveItemInArray(rotation.heats, event.previousIndex, event.currentIndex);
    }
  }

  onNumLanesChange() {
    // Adjust all heats to have the correct number of lanes
    this.internalRotations.forEach((rot) => {
      rot.heats?.forEach((heat) => {
        const currentIndices = heat.driverIndices || [];
        if (currentIndices.length < this.internalNumLanes) {
          heat.driverIndices = [
            ...currentIndices,
            ...new Array(this.internalNumLanes - currentIndices.length).fill(0),
          ];
        } else if (currentIndices.length > this.internalNumLanes) {
          heat.driverIndices = currentIndices.slice(0, this.internalNumLanes);
        }
      });
    });
  }

  save() {
    if (!this.internalAssetName || this.hasValidationErrors()) {
      return;
    }

    this.isSaving = true;
    this.dataService
      .saveCustomRotation(
        this.internalAssetName,
        this.internalNumLanes,
        this.internalRotations,
        this.assetId(),
      )
      .subscribe({
        next: (asset) => {
          this.isSaving = false;
          this.saved.emit(asset);
        },
        error: (err) => {
          this.logger.error("Failed to save custom rotation", err);
          this.isSaving = false;
        },
      });
  }

  cancel() {
    this.cancelled.emit();
  }

  getLaneArray() {
    return new Array(this.internalNumLanes).fill(0).map((_, i) => i);
  }

  heatHasError(rotation: ICustomRotation, heatIdx: number): boolean {
    const heat = rotation.heats?.[heatIdx];
    if (!heat || !heat.driverIndices) {
      return false;
    }

    const assigned = heat.driverIndices.filter(
      (idx) => idx !== undefined && idx !== null && idx > 0,
    );
    const unique = new Set(assigned);
    return assigned.length !== unique.size;
  }

  hasValidationErrors(): boolean {
    return this.internalRotations.some((rot) =>
      rot.heats?.some((_, idx) => this.heatHasError(rot, idx)),
    );
  }

  isRotationEqual(rotation: ICustomRotation): boolean {
    const numDrivers = rotation.numDrivers ?? 0;
    const numHeats = rotation.heats?.length || 0;
    const numLanes = this.internalNumLanes;

    if (numDrivers <= 0 || numHeats === 0 || numLanes <= 0) return false;

    const driverLaneCounts = new Map<number, number[]>();
    const laneTotals = new Array(numLanes).fill(0);

    for (let d = 1; d <= numDrivers; d++) {
      driverLaneCounts.set(d, new Array(numLanes).fill(0));
    }

    rotation.heats?.forEach((heat) => {
      heat.driverIndices?.forEach((driverIdx, laneIdx) => {
        if (
          driverIdx !== undefined &&
          driverIdx !== null &&
          driverIdx > 0 &&
          driverIdx <= numDrivers
        ) {
          laneTotals[laneIdx]++;
          const counts = driverLaneCounts.get(driverIdx);
          if (counts && laneIdx < numLanes) {
            counts[laneIdx]++;
          }
        }
      });
    });

    let totalHeats = 0;
    for (let l = 0; l < numLanes; l++) {
      const total = laneTotals[l];
      if (total % numDrivers !== 0) return false;
      const expected = total / numDrivers;
      totalHeats += total;
      for (let d = 1; d <= numDrivers; d++) {
        if (driverLaneCounts.get(d)![l] !== expected) return false;
      }
    }

    return totalHeats > 0;
  }

  showEqualityReport(rotation: ICustomRotation, idx: number) {
    const numDrivers = rotation.numDrivers ?? 0;
    const numHeats = rotation.heats?.length || 0;
    const numLanes = this.internalNumLanes;
    const reports: any[] = [];

    this.reportRotationIdx = idx;

    if (numDrivers <= 0) {
      this.equalityReport = [{ key: "AM_REPORT_NO_DRIVERS" }];
      return;
    }
    if (numHeats === 0) {
      this.equalityReport = [{ key: "AM_REPORT_NO_DRIVERS" }];
      return;
    }

    const driverLaneCounts = new Map<number, number[]>();
    const laneTotals = new Array(numLanes).fill(0);

    for (let d = 1; d <= numDrivers; d++) {
      driverLaneCounts.set(d, new Array(numLanes).fill(0));
    }

    let allEqual = true;
    let totalAssignments = 0;

    rotation.heats?.forEach((heat, hIdx) => {
      heat.driverIndices?.forEach((driverIdx, laneIdx) => {
        if (driverIdx && driverIdx > 0) {
          if (driverIdx <= numDrivers) {
            laneTotals[laneIdx]++;
            const counts = driverLaneCounts.get(driverIdx);
            if (counts && laneIdx < numLanes) {
              counts[laneIdx]++;
            }
          } else {
            allEqual = false;
            reports.push({
              key: "AM_REPORT_INVALID_DRIVER",
              params: { heat: hIdx + 1, driver: driverIdx },
            });
          }
        }
      });
    });

    for (let l = 0; l < numLanes; l++) {
      totalAssignments += laneTotals[l];
      for (let d1 = 1; d1 <= numDrivers; d1++) {
        const count1 = driverLaneCounts.get(d1)![l];
        for (let d2 = 1; d2 <= numDrivers; d2++) {
          if (d1 === d2) continue;
          const count2 = driverLaneCounts.get(d2)![l];
          if (count1 !== count2) {
            allEqual = false;
            reports.push({
              key: "AM_REPORT_LANE_DIFF",
              params: {
                lane: l + 1,
                d1: d1,
                count1: count1,
                heat1: this.translationService.translate(
                  count1 === 1
                    ? "AM_LABEL_HEAT_SINGULAR"
                    : "AM_LABEL_HEAT_PLURAL",
                ),
                d2: d2,
                count2: count2,
                heat2: this.translationService.translate(
                  count2 === 1
                    ? "AM_LABEL_HEAT_SINGULAR"
                    : "AM_LABEL_HEAT_PLURAL",
                ),
              },
            });
          }
        }
      }
    }

    if (totalAssignments === 0) {
      allEqual = false;
      reports.push({ key: "AM_REPORT_NO_DRIVERS" });
    }

    if (allEqual && reports.length === 0) {
      this.equalityReport = [{ key: "AM_REPORT_ALL_EQUAL" }];
    } else {
      this.equalityReport = reports;
    }
  }

  closeReport() {
    this.equalityReport = null;
    this.reportRotationIdx = -1;
  }

  async onImportFiles(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const files = Array.from(input.files);
    const results: any[] = [];

    for (const file of files) {
      try {
        const text = await file.text();
        let json: any;

        try {
          json = JSON.parse(text);
        } catch (e) {
          // Fallback: Handle single quotes or unquoted keys
          // This allows for JS-style objects that aren't strictly valid JSON
          try {
            const sanitized = text
              .replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"') // Convert single quotes to double quotes
              .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":'); // Quote unquoted keys
            json = JSON.parse(sanitized);
          } catch (_) {
            // If even the sanitized version fails, throw the original error
            throw e;
          }
        }

        // Validation
        if (
          json.NumDrivers === undefined ||
          json.NumLanes === undefined ||
          json.Heats === undefined
        ) {
          results.push({
            success: false,
            key: "AM_IMPORT_ERR_MISSING_FIELDS",
            params: { file: file.name },
          });
          continue;
        }

        if (json.NumLanes !== this.internalNumLanes) {
          results.push({
            success: false,
            key: "AM_IMPORT_ERR_LANES",
            params: {
              file: file.name,
              expected: this.internalNumLanes,
              found: json.NumLanes,
            },
          });
          continue;
        }

        if (
          this.internalRotations.some((r) => r.numDrivers === json.NumDrivers)
        ) {
          results.push({
            success: false,
            key: "AM_IMPORT_ERR_DUPLICATE",
            params: { file: file.name, count: json.NumDrivers },
          });
          continue;
        }

        // Process Heats
        const heats: ICustomHeat[] = json.Heats.map((h: any) => {
          let drivers = h.Drivers || [];
          // If the file is 0-indexed, we need to convert to 1-indexed.
          // We assume it's 0-indexed if max(drivers) < NumDrivers AND min(drivers) >= 0
          // and we only increment if they don't already have a driver equal to NumDrivers.
          // Actually, let's just look for '0'. If '0' is present, we increment everything by 1.
          // This is a common convention in these JSON rotation files.
          const hasZero = drivers.some((d: number) => d === 0);
          if (hasZero) {
            drivers = drivers.map((d: number) => d + 1);
          }

          return {
            driverIndices: drivers,
          };
        });

        this.internalRotations.push({
          numDrivers: json.NumDrivers,
          heats: heats,
        });

        results.push({
          success: true,
          key: "AM_IMPORT_SUCCESS",
          params: { file: file.name },
        });
      } catch (e) {
        results.push({
          success: false,
          key: "AM_IMPORT_ERR_INVALID_JSON",
          params: { file: file.name },
        });
      }
    }

    this.importSummary = results;
    input.value = ""; // Reset input
    this.cdr.detectChanges();
  }

  closeImportSummary() {
    this.importSummary = null;
  }

  async exportRotations() {
    for (const rotation of this.internalRotations) {
      const numDrivers = rotation.numDrivers || 0;
      const numLanes = this.internalNumLanes;
      const fileName = `${this.internalAssetName}_L${numLanes}_D${numDrivers}.json`;

      const exportObj = {
        NumDrivers: numDrivers,
        NumLanes: numLanes,
        Heats:
          rotation.heats?.map((h) => ({
            Drivers: h.driverIndices,
          })) || [],
      };

      const jsonContent = JSON.stringify(exportObj, null, 2);
      this.downloadFile(fileName, jsonContent);

      // Add a small delay to help browsers handle multiple downloads
      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    this.logger.info("Export process completed");
  }

  private downloadFile(fileName: string, content: string) {
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }
}
