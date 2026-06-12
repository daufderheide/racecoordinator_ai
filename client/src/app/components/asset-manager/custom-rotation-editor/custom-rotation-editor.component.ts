import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from "@angular/cdk/drag-drop";
import { CommonModule } from "@angular/common";
import {
  ChangeDetectorRef,
  Component,
  HostListener,
  input,
  OnDestroy,
  OnInit,
  output,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { Subscription } from "rxjs";
import { ConfirmationModalComponent } from "@app/components/shared/confirmation-modal/confirmation-modal.component";
import { EditorTitleComponent } from "@app/components/shared/editor-title/editor-title.component";
import {
  UndoEventType,
  UndoManager,
} from "@app/components/shared/undo-redo-controls/undo-manager";
import { DataService } from "@app/data.service";
import { DirtyComponent } from "@app/interfaces/dirty-component";
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
import {
  checkLaneEquality,
  LaneEqualityResult,
} from "@app/utils/lane-equality";

import { parseAndValidateImportFile } from "./rotation-import.utils";

interface LocalRotation extends ICustomRotation {
  isExpanded?: boolean;
  isEqual?: boolean;
  equalityReport?: any[];
}

interface CustomRotationState {
  assetName: string;
  selectedTrackId: string;
  numLanes: number;
  rotations: ICustomRotation[];
}

@Component({
  standalone: true,
  selector: "app-custom-rotation-editor",
  templateUrl: "./custom-rotation-editor.component.html",
  styleUrls: ["./custom-rotation-editor.component.css"],
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    DragDropModule,
    EditorTitleComponent,
    ConfirmationModalComponent,
  ],
})
export class CustomRotationEditorComponent
  implements OnInit, OnDestroy, DirtyComponent
{
  isNavigationApproved = false;
  showDiscardConfirm = false;
  private pendingDeactivate: ((value: boolean) => void) | null = null;
  private isReverting = false;
  readonly assetId = input<string>();
  readonly assetName = input<string>("");
  readonly numLanes = input<number>(4);
  readonly rotations = input<ICustomRotation[]>([]);

  internalAssetId?: string;
  internalAssetName: string = "";
  internalNumLanes: number = 4;
  internalRotations: LocalRotation[] = [];
  equalityReport: any[] | null = null;
  reportRotationIdx: number = -1;
  importSummary: any[] | null = null;
  allAssets: IAssetMessage[] = [];
  private rotationEqualityCache = new Map<
    ICustomRotation,
    { signature: string; result: LaneEqualityResult }
  >();

  tracks: ITrackModel[] = [];
  selectedTrackId: string = "";
  selectedTrack?: ITrackModel;

  readonly saved = output<IAssetMessage>();
  readonly cancelled = output<void>();

  savingCount = 0;
  private pendingSave = false;
  private pendingNavigateBack = false;

  get isSaving(): boolean {
    return this.savingCount > 0;
  }

  isLoading = false;

  lastSavedAsset?: IAssetMessage;
  scale = 1;
  virtualDrivers: { id: number; name: string }[] = [];
  numVirtualDrivers: number = 10;

  updateVirtualDriversList() {
    this.virtualDrivers = [];
    for (let i = 1; i <= this.numVirtualDrivers; i++) {
      this.virtualDrivers.push({ id: i, name: `Driver ${i}` });
    }
  }

  onNumVirtualDriversChange() {
    if (
      this.numVirtualDrivers === null ||
      this.numVirtualDrivers === undefined ||
      this.numVirtualDrivers < 1
    ) {
      this.numVirtualDrivers = 1;
    }
    this.updateVirtualDriversList();
    this.cdr.detectChanges();
  }

  // Undo Manager
  undoManager!: UndoManager<CustomRotationState>;
  private subscriptions: Subscription[] = [];

  // Drag and drop connection IDs
  heatDropListIds: string[] = ["driver-pool"];
  connectedTo: string[] = ["driver-pool"];

  constructor(
    private dataService: DataService,
    private translationService: TranslationService,
    private cdr: ChangeDetectorRef,
    private logger: LoggerService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.undoManager = new UndoManager<CustomRotationState>(
      {
        clonner: (state) => ({
          assetName: state.assetName,
          selectedTrackId: state.selectedTrackId,
          numLanes: state.numLanes,
          rotations: deepCopy(state.rotations),
        }),
        equalizer: (a, b) => {
          if (
            a.assetName !== b.assetName ||
            a.selectedTrackId !== b.selectedTrackId ||
            a.numLanes !== b.numLanes
          ) {
            return false;
          }
          if (a.rotations.length !== b.rotations.length) {
            return false;
          }
          return a.rotations.every((rot, rotIdx) => {
            const otherRot = b.rotations[rotIdx];
            if (rot.numDrivers !== otherRot.numDrivers) {
              return false;
            }
            const heats = rot.heats || [];
            const otherHeats = otherRot.heats || [];
            if (heats.length !== otherHeats.length) {
              return false;
            }
            return heats.every((heat, heatIdx) => {
              const otherHeat = otherHeats[heatIdx];
              if (heat.group !== otherHeat.group) {
                return false;
              }
              const lanes = heat.driverIndices || [];
              const otherLanes = otherHeat.driverIndices || [];
              if (lanes.length !== otherLanes.length) {
                return false;
              }
              return lanes.every((drv, laneIdx) => drv === otherLanes[laneIdx]);
            });
          });
        },
        applier: (state) => {
          this.internalAssetName = state.assetName;
          this.selectedTrackId = state.selectedTrackId;
          this.internalNumLanes = state.numLanes;

          // Map back while keeping expanded status if it exists
          const oldMap = new Map<number, boolean>();
          this.internalRotations.forEach((r) => {
            if (r.numDrivers !== undefined && r.numDrivers !== null) {
              oldMap.set(r.numDrivers, !!r.isExpanded);
            }
          });

          this.internalRotations = deepCopy(state.rotations).map((r: any) => ({
            ...r,
            isExpanded:
              r.numDrivers !== undefined && r.numDrivers !== null
                ? oldMap.has(r.numDrivers)
                  ? oldMap.get(r.numDrivers)
                  : true
                : true,
          }));

          this.selectedTrack = this.tracks.find(
            (t: any) =>
              (t.entity_id || t.model?.entityId) === this.selectedTrackId,
          );
          this.validateAllRotationsLaneEquality();
          this.updateDropListConnections();
        },
      },
      () => ({
        assetName: this.internalAssetName,
        selectedTrackId: this.selectedTrackId,
        numLanes: this.internalNumLanes,
        rotations: this.internalRotations,
      }),
    );
  }

  @HostListener("window:resize")
  onResize() {
    this.updateScale();
  }

  @HostListener("window:keydown", ["$event"])
  handleKeyboardEvent(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key === "z") {
      event.preventDefault();
      if (event.shiftKey) {
        this.undoManager.redo();
      } else {
        this.undoManager.undo();
      }
    }
    if ((event.metaKey || event.ctrlKey) && event.key === "y") {
      event.preventDefault();
      this.undoManager.redo();
    }
  }

  private updateScale() {
    const targetWidth = 1600;
    const targetHeight = 900;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const scaleX = windowWidth / targetWidth;
    const scaleY = windowHeight / targetHeight;

    this.scale = Math.min(scaleX, scaleY);
  }

  ngOnInit() {
    if (this.route.queryParamMap) {
      this.subscriptions.push(
        this.route.queryParamMap.subscribe((paramMap) => {
          if (this.isReverting) {
            this.isReverting = false;
            return;
          }
          const isEditorRoute =
            !this.router.url ||
            this.router.url === "/" ||
            this.router.url.startsWith("/custom-rotation-editor") ||
            this.router.url.includes("mock");
          if (!isEditorRoute) {
            return;
          }
          const nextId = paramMap.get("id");
          const currentId = this.internalAssetId;
          if (
            currentId &&
            nextId !== currentId &&
            this.hasChanges() &&
            !this.isNavigationApproved
          ) {
            this.confirmDiscard().then((confirmed) => {
              if (confirmed) {
                this.loadAssetData();
              } else {
                this.isReverting = true;
                this.router.navigate([], {
                  relativeTo: this.route,
                  queryParams: {
                    id: currentId,
                    from: this.route.snapshot.queryParamMap.get("from"),
                    returnUrl:
                      this.route.snapshot.queryParamMap.get("returnUrl"),
                  },
                  queryParamsHandling: "merge",
                });
              }
            });
          } else {
            this.loadAssetData();
          }
        }),
      );
    } else {
      this.loadAssetData();
    }
  }

  private loadAssetData() {
    this.isNavigationApproved = false;
    const idParam = this.route.snapshot.queryParamMap.get("id");

    this.isLoading = true;
    this.cdr.detectChanges();
    this.dataService.listAssets().subscribe({
      next: (assets) => {
        this.allAssets = assets || [];
        const asset = this.allAssets.find((a) => a.model?.entityId === idParam);
        if (asset) {
          this.internalAssetId = asset.model?.entityId || undefined;
          this.internalAssetName = asset.name || "";
          this.internalNumLanes = asset.numLanes || 4;
          this.internalRotations = deepCopy(asset.customRotations || []).map(
            (r: any) => ({
              ...r,
              isExpanded: true,
            }),
          );
        } else {
          this.fallbackToInputs();
          if (!idParam || idParam === "new") {
            this.internalAssetName = this.generateUniqueName();
          }
        }
        this.isLoading = false;
        this.initEditorState();
      },
      error: (err) => {
        this.logger.error("Failed to load custom rotation asset", err);
        this.fallbackToInputs();
        this.isLoading = false;
        this.initEditorState();
      },
    });
  }

  private fallbackToInputs() {
    this.internalAssetId = this.assetId();
    this.internalAssetName = this.assetName();
    this.internalNumLanes = this.numLanes();

    this.internalRotations = deepCopy(this.rotations()).map((r: any) => ({
      ...r,
      isExpanded: true,
    }));
  }

  generateUniqueName(): string {
    let index = 1;
    let candidate = `New Custom Rotation ${index}`;
    while (
      this.allAssets.some(
        (a) =>
          a.type === "custom_rotation" &&
          a.name?.trim().toLowerCase() === candidate.toLowerCase() &&
          a.model?.entityId !== this.internalAssetId,
      )
    ) {
      index++;
      candidate = `New Custom Rotation ${index}`;
    }
    return candidate;
  }

  isNameUnique(): boolean {
    const trimmed = (this.internalAssetName || "").trim();
    if (!trimmed) {
      return false;
    }
    return !this.allAssets.some(
      (a) =>
        a.type === "custom_rotation" &&
        a.name?.trim().toLowerCase() === trimmed.toLowerCase() &&
        a.model?.entityId !== this.internalAssetId,
    );
  }

  get isNameInvalid(): boolean {
    const trimmed = (this.internalAssetName || "").trim();
    return !trimmed || !this.isNameUnique();
  }

  isConfigValid(): boolean {
    return (
      !this.isNameInvalid &&
      this.internalRotations.length > 0 &&
      !this.hasValidationErrors()
    );
  }

  isDirtyState(): boolean {
    return this.undoManager?.hasChanges() ?? false;
  }

  hasChanges(): boolean {
    return this.isDirtyState();
  }

  confirmDiscard(): Promise<boolean> {
    this.showDiscardConfirm = true;
    this.cdr.markForCheck();
    this.cdr.detectChanges();
    return new Promise((resolve) => {
      this.pendingDeactivate = resolve;
    });
  }

  onConfirmDiscard() {
    this.showDiscardConfirm = false;
    this.isNavigationApproved = true;
    if (this.pendingDeactivate) {
      this.pendingDeactivate(true);
      this.pendingDeactivate = null;
    }
  }

  onCancelDiscard() {
    this.showDiscardConfirm = false;
    if (this.pendingDeactivate) {
      this.pendingDeactivate(false);
      this.pendingDeactivate = null;
    }
  }

  private initEditorState() {
    let maxDriverId = 10;
    this.internalRotations.forEach((rot) => {
      if (rot.numDrivers && rot.numDrivers > maxDriverId) {
        maxDriverId = rot.numDrivers;
      }
      rot.heats?.forEach((heat) => {
        heat.driverIndices?.forEach((id) => {
          if (id && id > maxDriverId) {
            maxDriverId = id;
          }
        });
      });
    });
    this.numVirtualDrivers = maxDriverId;
    this.updateVirtualDriversList();

    this.updateScale();
    this.loadTracks();

    this.subscriptions.push(
      this.undoManager.stateCommitted$.subscribe((event) => {
        if (event.type === "undo" || event.type === "redo") {
          this.autoSave(event.type);
          this.cdr.detectChanges();
        }
      }),
    );
    this.cdr.detectChanges();
  }

  ngOnDestroy() {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  loadTracks() {
    this.dataService.getTracks().subscribe({
      next: (tracks) => {
        this.tracks = tracks;
        if (this.tracks.length > 0) {
          if (!this.internalAssetId) {
            this.selectedTrack = this.tracks[0];
          } else {
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

        this.undoManager.initialize({
          assetName: this.internalAssetName,
          selectedTrackId: this.selectedTrackId,
          numLanes: this.internalNumLanes,
          rotations: this.internalRotations,
        });

        this.validateAllRotationsLaneEquality();
        this.updateDropListConnections();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.logger.error("Failed to load tracks", err);
      },
    });
  }

  updateDropListConnections() {
    this.heatDropListIds = ["driver-pool"];
    this.internalRotations.forEach((rot, rotIdx) => {
      if (rot.isExpanded) {
        rot.heats?.forEach((h, hIdx) => {
          for (let lIdx = 0; lIdx < this.internalNumLanes; lIdx++) {
            this.heatDropListIds.push(
              `rot-${rotIdx}-heat-${hIdx}-lane-${lIdx}`,
            );
          }
        });
      }
    });
    this.connectedTo = [...this.heatDropListIds];
  }

  toggleExpander(rotation: LocalRotation) {
    rotation.isExpanded = !rotation.isExpanded;
    this.updateDropListConnections();
  }

  onAssetNameChange() {
    if (!this.internalAssetName.trim()) return;
    this.undoManager.captureState();
    this.autoSave();
  }

  onTrackChange() {
    this.selectedTrack = this.tracks.find(
      (t: any) => (t.entity_id || t.model?.entityId) === this.selectedTrackId,
    );
    if (this.selectedTrack) {
      this.internalNumLanes = this.selectedTrack.lanes?.length || 0;
      this.onNumLanesChange();
      this.updateDropListConnections();
      this.undoManager.captureState();
      this.autoSave();
    }
  }

  onNumDriversChange() {
    this.undoManager.captureState();
    this.autoSave();
  }

  onHeatGroupChange(
    rotation: ICustomRotation,
    heat: ICustomHeat,
    value: number,
  ) {
    heat.group = value - 1;
    this.undoManager.captureState();
    this.autoSave();
  }

  addRotation() {
    const newRot: any = {
      numDrivers: this.internalNumLanes,
      heats: [],
      isExpanded: true,
    };
    this.internalRotations.push(newRot);
    this.addHeat(newRot, false);
    this.updateDropListConnections();
    this.undoManager.captureState();
    this.autoSave();
  }

  removeRotation(index: number) {
    this.internalRotations.splice(index, 1);
    this.updateDropListConnections();
    this.undoManager.captureState();
    this.autoSave();
  }

  addHeat(rotation: ICustomRotation, triggerAutoSave = true) {
    if (!rotation.heats) {
      rotation.heats = [];
    }
    const driverIndices = new Array(this.internalNumLanes).fill(0);
    rotation.heats.push({
      driverIndices,
      group: 0,
    });
    this.updateDropListConnections();
    this.undoManager.captureState();
    if (triggerAutoSave) {
      this.autoSave();
    }
  }

  removeHeat(rotation: ICustomRotation, index: number) {
    if (rotation.heats) {
      rotation.heats.splice(index, 1);
      this.updateDropListConnections();
      this.undoManager.captureState();
      this.autoSave();
    }
  }

  dropHeat(rotation: ICustomRotation, event: CdkDragDrop<ICustomHeat[]>) {
    if (rotation.heats) {
      moveItemInArray(rotation.heats, event.previousIndex, event.currentIndex);
      this.undoManager.captureState();
      this.autoSave();
    }
  }

  onNumLanesChange() {
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

  onDrop(event: CdkDragDrop<any>) {
    const fromId = event.previousContainer.id;
    const toId = event.container.id;

    if (fromId === "driver-pool" && toId.startsWith("rot-")) {
      const parts = toId.split("-");
      const rotIdx = parseInt(parts[1], 10);
      const heatIdx = parseInt(parts[3], 10);
      const laneIdx = parseInt(parts[5], 10);

      const rotation = this.internalRotations[rotIdx];
      const heat = rotation.heats?.[heatIdx];
      if (heat && heat.driverIndices) {
        const driverId = event.item.data.id;
        heat.driverIndices[laneIdx] = driverId;
        this.undoManager.captureState();
        this.autoSave();
      }
    } else if (fromId.startsWith("rot-") && toId.startsWith("rot-")) {
      const fromParts = fromId.split("-");
      const fromRotIdx = parseInt(fromParts[1], 10);
      const fromHeatIdx = parseInt(fromParts[3], 10);
      const fromLaneIdx = parseInt(fromParts[5], 10);

      const parts = toId.split("-");
      const rotIdx = parseInt(parts[1], 10);
      const heatIdx = parseInt(parts[3], 10);
      const laneIdx = parseInt(parts[5], 10);

      if (fromRotIdx === rotIdx) {
        const rotation = this.internalRotations[rotIdx];
        const fromHeat = rotation.heats?.[fromHeatIdx];
        const toHeat = rotation.heats?.[heatIdx];

        if (
          fromHeat &&
          toHeat &&
          fromHeat.driverIndices &&
          toHeat.driverIndices
        ) {
          const temp = fromHeat.driverIndices[fromLaneIdx];
          fromHeat.driverIndices[fromLaneIdx] = toHeat.driverIndices[laneIdx];
          toHeat.driverIndices[laneIdx] = temp;
          this.undoManager.captureState();
          this.autoSave();
        }
      }
    } else if (fromId.startsWith("rot-") && toId === "driver-pool") {
      const fromParts = fromId.split("-");
      const fromRotIdx = parseInt(fromParts[1], 10);
      const fromHeatIdx = parseInt(fromParts[3], 10);
      const fromLaneIdx = parseInt(fromParts[5], 10);

      const rotation = this.internalRotations[fromRotIdx];
      const heat = rotation.heats?.[fromHeatIdx];
      if (heat && heat.driverIndices) {
        heat.driverIndices[fromLaneIdx] = 0;
        this.undoManager.captureState();
        this.autoSave();
      }
    }
  }

  private handlePendingActions() {
    if (this.pendingSave) {
      this.pendingSave = false;
      if (this.pendingNavigateBack) {
        this.pendingNavigateBack = false;
        this.save();
      } else {
        this.autoSave();
      }
    } else if (this.pendingNavigateBack) {
      this.pendingNavigateBack = false;
      if (this.lastSavedAsset) {
        this.saved.emit(this.lastSavedAsset);
      }
      this.navigateBack();
    }
  }

  save() {
    this.validateAllRotationsLaneEquality();
    if (!this.isConfigValid()) {
      return;
    }

    if (this.isSaving) {
      this.pendingSave = true;
      this.pendingNavigateBack = true;
      return;
    }

    this.savingCount++;
    this.cdr.detectChanges();
    this.dataService
      .saveCustomRotation(
        this.internalAssetName,
        this.internalNumLanes,
        this.internalRotations,
        this.internalAssetId || this.assetId(),
      )
      .subscribe({
        next: (asset) => {
          this.savingCount--;
          this.lastSavedAsset = asset;
          const assetId = asset.model?.entityId;
          if (assetId) {
            this.internalAssetId = assetId;
          }
          this.undoManager.resetTracking({
            assetName: this.internalAssetName,
            selectedTrackId: this.selectedTrackId,
            numLanes: this.internalNumLanes,
            rotations: this.internalRotations,
          });
          this.saved.emit(asset);

          if (this.pendingSave || this.pendingNavigateBack) {
            this.handlePendingActions();
          } else {
            this.navigateBack();
          }
        },
        error: (err) => {
          this.logger.error("Failed to save custom rotation", err);
          this.savingCount--;
          this.cdr.detectChanges();
          this.handlePendingActions();
        },
      });
  }

  autoSave(triggeredBy: UndoEventType = "push") {
    this.validateAllRotationsLaneEquality();
    if (!this.isConfigValid()) {
      return;
    }

    if (this.isSaving) {
      this.pendingSave = true;
      return;
    }

    this.savingCount++;
    this.cdr.detectChanges();

    this.dataService
      .saveCustomRotation(
        this.internalAssetName,
        this.internalNumLanes,
        this.internalRotations,
        this.internalAssetId || this.assetId(),
      )
      .subscribe({
        next: (asset) => {
          this.savingCount--;
          this.lastSavedAsset = asset;
          const assetId = asset.model?.entityId;
          if (assetId) {
            this.internalAssetId = assetId;
          }
          this.undoManager.resetTracking({
            assetName: this.internalAssetName,
            selectedTrackId: this.selectedTrackId,
            numLanes: this.internalNumLanes,
            rotations: this.internalRotations,
          });
          this.cdr.detectChanges();
          this.handlePendingActions();
        },
        error: (err) => {
          this.logger.error("Failed to auto-save custom rotation", err);
          this.savingCount--;
          this.cdr.detectChanges();

          if (triggeredBy === "push") {
            this.undoManager.undo();
            this.undoManager.clearRedo();
          }
          this.handlePendingActions();
        },
      });
  }

  navigateBack() {
    this.isNavigationApproved = true;
    this.router.navigate(["/asset-manager"], {
      queryParams: {
        from: this.route.snapshot.queryParamMap.get("from"),
        returnUrl: this.route.snapshot.queryParamMap.get("returnUrl"),
      },
    });
  }

  cancel() {
    if (this.lastSavedAsset) {
      this.saved.emit(this.lastSavedAsset);
    } else {
      this.cancelled.emit();
    }
    this.navigateBack();
  }

  getLaneArray() {
    return new Array(this.internalNumLanes).fill(0).map((_, i) => i);
  }

  getDriverGroupConflicts(rotation: ICustomRotation): Set<number> {
    const driverToGroups = new Map<number, Set<number>>();
    rotation.heats?.forEach((heat) => {
      const group = heat.group || 0;
      heat.driverIndices?.forEach((driverId) => {
        if (driverId && driverId > 0) {
          if (!driverToGroups.has(driverId)) {
            driverToGroups.set(driverId, new Set<number>());
          }
          driverToGroups.get(driverId)!.add(group);
        }
      });
    });

    const conflictingDrivers = new Set<number>();
    driverToGroups.forEach((groups, driverId) => {
      if (groups.size > 1) {
        conflictingDrivers.add(driverId);
      }
    });
    return conflictingDrivers;
  }

  heatHasGroupConflict(rotation: ICustomRotation, heatIdx: number): boolean {
    const heat = rotation.heats?.[heatIdx];
    if (!heat || !heat.driverIndices) {
      return false;
    }
    const conflicts = this.getDriverGroupConflicts(rotation);
    return heat.driverIndices.some(
      (driverId) => driverId > 0 && conflicts.has(driverId),
    );
  }

  driverHasGroupConflict(rotation: ICustomRotation, driverId: number): boolean {
    if (!driverId || driverId <= 0) return false;
    const conflicts = this.getDriverGroupConflicts(rotation);
    return conflicts.has(driverId);
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
    return this.internalRotations.some((rot) => {
      const hasLaneConflict =
        rot.heats?.some((_, idx) => this.heatHasError(rot, idx)) ?? false;
      if (hasLaneConflict) return true;

      const conflicts = this.getDriverGroupConflicts(rot);
      return conflicts.size > 0;
    });
  }

  private getRotationSignature(rotation: ICustomRotation): string {
    const heatsSig = (rotation.heats || [])
      .map((h) => (h.driverIndices || []).join(","))
      .join("|");
    return `${rotation.numDrivers || 0}:${this.internalNumLanes}:${heatsSig}`;
  }

  private checkRotationLaneEqualityDirect(
    rotation: ICustomRotation,
  ): LaneEqualityResult {
    const numDrivers = rotation.numDrivers ?? 0;
    const driverIds: string[] = [];
    for (let d = 1; d <= numDrivers; d++) {
      driverIds.push(d.toString());
    }
    const heats = (rotation.heats || []).map((h) =>
      (h.driverIndices || []).map((idx) =>
        idx && idx > 0 ? idx.toString() : null,
      ),
    );
    return checkLaneEquality(
      this.internalNumLanes,
      driverIds,
      heats,
      undefined,
      this.translationService,
    );
  }

  isRotationEqual(rotation: ICustomRotation): boolean {
    const sig = this.getRotationSignature(rotation);
    let cached = this.rotationEqualityCache.get(rotation);
    if (!cached || cached.signature !== sig) {
      const res = this.checkRotationLaneEqualityDirect(rotation);
      cached = { signature: sig, result: res };
      this.rotationEqualityCache.set(rotation, cached);

      const localRot = rotation as LocalRotation;
      localRot.isEqual = res.allEqual;
      localRot.equalityReport = res.reports;
    }
    return cached.result.allEqual;
  }

  validateRotationLaneEquality(rotation: LocalRotation) {
    const sig = this.getRotationSignature(rotation);
    const result = this.checkRotationLaneEqualityDirect(rotation);
    rotation.isEqual = result.allEqual;
    rotation.equalityReport = result.reports;
    this.rotationEqualityCache.set(rotation, { signature: sig, result });
  }

  validateAllRotationsLaneEquality() {
    this.internalRotations.forEach((rot) => {
      this.validateRotationLaneEquality(rot);
    });
  }

  showEqualityReport(rotation: ICustomRotation, idx: number) {
    this.reportRotationIdx = idx;
    const sig = this.getRotationSignature(rotation);
    let cached = this.rotationEqualityCache.get(rotation);
    if (!cached || cached.signature !== sig) {
      const res = this.checkRotationLaneEqualityDirect(rotation);
      cached = { signature: sig, result: res };
      this.rotationEqualityCache.set(rotation, cached);

      const localRot = rotation as LocalRotation;
      localRot.isEqual = res.allEqual;
      localRot.equalityReport = res.reports;
    }
    this.equalityReport = cached.result.reports;
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
      const existingDriverCounts = this.internalRotations
        .map((r) => r.numDrivers)
        .filter((d): d is number => d !== undefined && d !== null);

      const res = await parseAndValidateImportFile(
        file,
        this.internalNumLanes,
        existingDriverCounts,
      );

      if (res.success && res.newRotations) {
        this.internalRotations.push(...res.newRotations);
      }
      results.push({
        success: res.success,
        key: res.key,
        params: res.params,
      });
    }

    this.importSummary = results;
    input.value = "";
    this.updateDropListConnections();
    this.undoManager.captureState();
    this.autoSave();
    this.cdr.detectChanges();
  }

  closeImportSummary() {
    this.importSummary = null;
  }

  async exportSingleRotation(rotation: LocalRotation) {
    const numDrivers = rotation.numDrivers || 0;
    const numLanes = this.internalNumLanes;
    const fileName = `${this.internalAssetName}_L${numLanes}_D${numDrivers}.json`;

    const exportObj = {
      Version: "1.0",
      NumDrivers: numDrivers,
      NumLanes: numLanes,
      Heats:
        rotation.heats?.map((h) => ({
          Drivers: h.driverIndices,
          Group: h.group !== undefined && h.group !== null ? h.group + 1 : 1,
        })) || [],
    };

    const jsonContent = JSON.stringify(exportObj, null, 2);
    this.downloadFile(fileName, jsonContent);
    this.logger.info(`Exported rotation for ${numDrivers} drivers completed`);
  }

  async exportRotations() {
    const numLanes = this.internalNumLanes;
    const fileName = `${this.internalAssetName}_L${numLanes}_Asset.json`;

    const exportObj = {
      Version: "1.0",
      IsAsset: true,
      AssetName: this.internalAssetName,
      NumLanes: numLanes,
      Rotations: this.internalRotations.map((rotation) => ({
        NumDrivers: rotation.numDrivers || 0,
        Heats:
          rotation.heats?.map((h) => ({
            Drivers: h.driverIndices,
            Group: h.group !== undefined && h.group !== null ? h.group + 1 : 1,
          })) || [],
      })),
    };

    const jsonContent = JSON.stringify(exportObj, null, 2);
    this.downloadFile(fileName, jsonContent);
    this.logger.info("Export asset process completed");
  }

  private downloadFile(fileName: string, content: string) {
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 5000);
  }
}
