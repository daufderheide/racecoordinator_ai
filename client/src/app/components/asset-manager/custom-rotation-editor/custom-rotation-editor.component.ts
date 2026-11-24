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
import {
  CustomOptionComponent,
  CustomSelectComponent,
} from "@app/components/shared/custom-select/custom-select.component";
import { EditorTitleComponent } from "@app/components/shared/editor-title/editor-title.component";
import {
  AvailableGroup,
  AvailableStep,
} from "@app/components/shared/heats-filter-bar/heats-filter.utils";
import { HeatsFilterBarComponent } from "@app/components/shared/heats-filter-bar/heats-filter-bar.component";
import {
  UndoEventType,
  UndoManager,
} from "@app/components/shared/undo-redo-controls/undo-manager";
import { DataService } from "@app/data.service";
import { AutoSelectDefaultDirective } from "@app/directives/auto-select-default.directive";
import { DirtyComponent } from "@app/interfaces/dirty-component";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import {
  IAssetMessage,
  ICustomHeat,
  ICustomRotation,
  ITrackModel,
} from "@app/proto/antigravity";
import { HelpLinkService } from "@app/services/help-link.service";
import { LoggerService } from "@app/services/logger.service";
import { SettingsService } from "@app/services/settings.service";
import { TranslationService } from "@app/services/translation.service";
import { deepCopy } from "@app/utils/clone.utils";
import { EditorLifecycleHelper } from "@app/utils/editor-lifecycle.helper";
import { LaneEqualityResult } from "@app/utils/lane-equality";

import {
  adjustHeatLanes,
  buildHeatDropListIds,
  calculateMaxDriverAndStepUp,
  calculateWindowScale,
  exportRotationsAssetHelper,
  exportSingleRotationHelper,
  generateStepUpDrivers,
  generateUniqueRotationAssetName,
  generateVirtualDrivers,
  getOriginalHeatDisplay,
  getRotationUnsavedReasons,
  handleRotationDrop,
  initializeRotationOriginalHeatNumbers,
  insertRotationSorted,
  isRotationNameUnique,
  restoreRotationsWithExpandedState,
  StepUpDriver,
  syncRotationDriverCounts,
  VirtualDriver,
} from "./rotation-editor.utils";
import { RotationEqualityManager } from "./rotation-equality.helper";
import {
  areCustomRotationStatesEqual,
  areRotationsSorted,
  assignCustomRotationStepNumbers,
  checkRotationLaneEqualityDirect,
  cloneCustomRotationState,
  CustomRotationState,
  driverHasGroupConflict,
  findNextAvailableDriverCount,
  getDriverGroupConflicts,
  hasValidationErrors,
  heatHasError,
  heatHasGroupConflict,
  heatHasStepUpInStepOne,
  LocalRotation,
  rotationHasStepUps,
  sortRotationsByDrivers,
} from "./rotation-export.utils";
import {
  filterRotationHeats,
  getRotationAvailableGroups,
  getRotationAvailableSteps,
  getRotationDriverGroupBadge,
  getRotationDriverStepBadge,
  getRotationGroupOptions,
  hasRotationGroupFilter,
  hasRotationStepFilter,
} from "./rotation-filter.helper";
import {
  getContrastTextColor,
  RotationHighlightManager,
} from "./rotation-highlight.helper";
import { processImportFiles } from "./rotation-import.utils";

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
    CustomSelectComponent,
    CustomOptionComponent,
    AutoSelectDefaultDirective,
    HeatsFilterBarComponent,
  ],
})
export class CustomRotationEditorComponent
  implements OnInit, OnDestroy, DirtyComponent
{
  lifecycle!: EditorLifecycleHelper;

  get showDiscardConfirm(): boolean {
    return this.lifecycle.showDiscardConfirm;
  }
  set showDiscardConfirm(val: boolean) {
    this.lifecycle.showDiscardConfirm = val;
  }

  get isNavigationApproved(): boolean {
    return this.lifecycle.isNavigationApproved;
  }
  set isNavigationApproved(val: boolean) {
    this.lifecycle.isNavigationApproved = val;
  }

  get pendingDeactivate(): ((value: boolean) => void) | null {
    return this.lifecycle.pendingDeactivate;
  }
  set pendingDeactivate(val: ((value: boolean) => void) | null) {
    this.lifecycle.pendingDeactivate = val;
  }
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
  private equalityManager = new RotationEqualityManager();
  private highlightManager = new RotationHighlightManager(this.cdr);

  tracks: ITrackModel[] = [];
  selectedTrackId: string = "";
  selectedTrack?: ITrackModel;

  readonly saved = output<IAssetMessage>();
  readonly cancelled = output<void>();
  defaultRotationName: string = "";
  isNew: boolean = false;

  focusNameInput() {
    setTimeout(() => {
      const el = document.getElementById(
        "custom-rotation-name-input",
      ) as HTMLInputElement;
      if (el) {
        el.focus();
        el.select();
      }
    }, 0);
  }

  savingCount = 0;
  private pendingSave = false;
  private pendingNavigateBack = false;

  get isSaving(): boolean {
    return this.savingCount > 0;
  }

  isLoading = false;
  isAutoSaving = false;

  lastSavedAsset?: IAssetMessage;
  scale = 1;
  virtualDrivers: VirtualDriver[] = [];
  numVirtualDrivers: number = 10;
  stepUpDrivers: StepUpDriver[] = [];
  numStepUpDrivers: number = 3;

  zoomLevel = 100;

  updateVirtualDriversList() {
    this.virtualDrivers = generateVirtualDrivers(this.numVirtualDrivers);
  }

  onNumVirtualDriversChange() {
    this.numVirtualDrivers = Math.max(1, this.numVirtualDrivers || 1);
    this.updateVirtualDriversList();
    this.cdr.detectChanges();
  }

  updateStepUpDriversList() {
    this.stepUpDrivers = generateStepUpDrivers(this.numStepUpDrivers);
  }

  onNumStepUpDriversChange() {
    this.numStepUpDrivers = Math.max(1, this.numStepUpDrivers || 1);
    this.updateStepUpDriversList();
    this.cdr.detectChanges();
  }

  // Undo Manager
  undoManager!: UndoManager<CustomRotationState>;
  private subscriptions: Subscription[] = [];

  // Drag and drop connection IDs
  heatDropListIds: string[] = ["driver-pool", "step-up-pool"];
  connectedTo: string[] = ["driver-pool", "step-up-pool"];

  constructor(
    private dataService: DataService,
    private settingsService: SettingsService,
    private translationService: TranslationService,
    private cdr: ChangeDetectorRef,
    private logger: LoggerService,
    private router: Router,
    private route: ActivatedRoute,
    private helpLinkService: HelpLinkService,
  ) {
    this.undoManager = new UndoManager<CustomRotationState>(
      {
        clonner: cloneCustomRotationState,
        equalizer: areCustomRotationStatesEqual,
        applier: (state) => {
          this.internalAssetName = state.assetName;
          this.selectedTrackId = state.selectedTrackId;
          this.internalNumLanes = state.numLanes;
          this.internalRotations = restoreRotationsWithExpandedState(
            state.rotations,
            this.internalRotations,
          );
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

    this.lifecycle = new EditorLifecycleHelper({
      cdr: this.cdr,
      translationService: this.translationService,
      getUnsavedReasons: () => this.getUnsavedReasons(),
    });
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
    this.scale = calculateWindowScale(window.innerWidth, window.innerHeight);
  }

  ngOnInit() {
    this.subscriptions.push(
      this.undoManager.stateCommitted$.subscribe((event) => {
        if (
          event.type === "undo" ||
          event.type === "redo" ||
          event.type === "push"
        ) {
          this.autoSave(event.type);
          this.cdr.detectChanges();
        }
      }),
    );

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
          initializeRotationOriginalHeatNumbers(this.internalRotations);
          this.sortRotationsByDrivers();
        } else {
          this.fallbackToInputs();
          if (!idParam || idParam === "new") {
            this.internalAssetName = this.generateUniqueName();
          }
        }
        this.isLoading = false;
        this.initEditorState();
        this.isNew =
          this.route.snapshot.queryParamMap?.get("isNew") === "true" ||
          !idParam ||
          idParam === "new";
        if (this.isNew) {
          this.defaultRotationName = this.internalAssetName;
          this.focusNameInput();
        }
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
    initializeRotationOriginalHeatNumbers(this.internalRotations);
    this.sortRotationsByDrivers();
  }

  generateUniqueName(baseName: string = "New Custom Rotation Set"): string {
    return generateUniqueRotationAssetName(
      baseName,
      this.allAssets,
      this.internalAssetId,
    );
  }

  saveAsNew() {
    const base = this.internalAssetName || "New Custom Rotation Set";
    const newName = this.generateUniqueName(base);
    this.internalAssetId = undefined;
    this.internalAssetName = newName;
    this.defaultRotationName = newName;
    this.isNew = true;
    this.save();
    this.focusNameInput();
  }

  openLearnMore(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.helpLinkService.openHelp("custom-rotations");
  }

  isNameUnique = (): boolean =>
    isRotationNameUnique(
      this.internalAssetName,
      this.allAssets,
      this.internalAssetId,
    );

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

  isDirtyState = (): boolean => this.undoManager?.hasChanges() ?? false;
  hasChanges = (): boolean => this.isDirtyState();

  getUnsavedReasons = (): string[] =>
    getRotationUnsavedReasons(
      this.internalAssetName,
      this.isNameUnique(),
      this.internalRotations,
      this.hasValidationErrors(),
      this.isSaving,
      this.isDirtyState(),
    );

  get discardMessage(): string {
    return this.lifecycle.discardMessage;
  }

  confirmDiscard(): Promise<boolean> {
    return this.lifecycle.confirmDiscard();
  }

  onConfirmDiscard() {
    this.lifecycle.onConfirmDiscard();
  }

  onCancelDiscard() {
    this.lifecycle.onCancelDiscard();
  }

  private initEditorState() {
    initializeRotationOriginalHeatNumbers(this.internalRotations);
    this.internalRotations.forEach((rot) =>
      assignCustomRotationStepNumbers(rot),
    );
    const limits = calculateMaxDriverAndStepUp(this.internalRotations);
    this.numVirtualDrivers = Math.max(10, limits.maxDriverId);
    this.updateVirtualDriversList();
    this.numStepUpDrivers = Math.max(
      Math.max(1, (this.internalNumLanes || 4) - 1),
      limits.maxStepUpId,
    );
    this.updateStepUpDriversList();

    this.updateScale();
    this.loadTracks();

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
    this.heatDropListIds = buildHeatDropListIds(
      this.internalRotations,
      this.internalNumLanes,
    );
    this.connectedTo = [...this.heatDropListIds];
  }

  toggleExpander(rotation: LocalRotation) {
    rotation.isExpanded = !rotation.isExpanded;
    this.updateDropListConnections();
  }

  onInputChange() {
    this.undoManager.onInputChange();
    this.cdr.detectChanges();
  }

  onInputFocus() {
    this.undoManager.onInputFocus();
  }

  onInputBlur() {
    this.undoManager.onInputBlur();
    this.cdr.detectChanges();
  }

  captureState() {
    this.undoManager.captureState();
    this.cdr.detectChanges();
  }

  onAssetNameChange() {
    if (!this.internalAssetName.trim()) return;
    this.captureState();
  }

  onTrackChange() {
    this.selectedTrack = this.tracks.find(
      (t: any) => (t.entity_id || t.model?.entityId) === this.selectedTrackId,
    );
    if (this.selectedTrack) {
      this.internalNumLanes = this.selectedTrack.lanes?.length || 0;
      this.onNumLanesChange();
      this.updateDropListConnections();
      this.captureState();
    }
  }

  onNumDriversChange() {
    this.captureState();
  }

  sortRotationsByDrivers() {
    sortRotationsByDrivers(this.internalRotations);
    this.updateDropListConnections();
  }

  isRotationsSorted(): boolean {
    return areRotationsSorted(this.internalRotations);
  }

  sortRotations() {
    if (this.internalRotations.length <= 1) {
      return;
    }
    this.sortRotationsByDrivers();
    this.validateAllRotationsLaneEquality();
    this.captureState();
  }

  onHeatGroupChange(
    rotation: ICustomRotation,
    heat: ICustomHeat,
    value: number,
  ) {
    heat.group = value - 1;
    assignCustomRotationStepNumbers(rotation);
    this.captureState();
  }

  onHeatGroupSelectChange(
    rotation: ICustomRotation,
    heat: ICustomHeat,
    newGroup: any,
  ) {
    const groupIndex = Number(newGroup);
    if (heat.group === groupIndex) return;
    heat.group = groupIndex;
    assignCustomRotationStepNumbers(rotation);
    this.captureState();
  }

  readonly hasRotationGroupFilter = hasRotationGroupFilter;
  readonly hasRotationStepFilter = hasRotationStepFilter;
  readonly getFilteredHeats = filterRotationHeats;

  getRotationAvailableGroups(rotation: LocalRotation): AvailableGroup[] {
    return getRotationAvailableGroups(rotation, this.translationService);
  }

  getRotationAvailableSteps(rotation: LocalRotation): AvailableStep[] {
    return getRotationAvailableSteps(rotation, this.translationService);
  }

  getRotationGroupOptions(
    rotation: LocalRotation,
  ): { index: number; name: string }[] {
    return getRotationGroupOptions(rotation, this.translationService);
  }

  getHeatIndex(rotation: ICustomRotation, heat: ICustomHeat): number {
    return (rotation.heats || []).indexOf(heat);
  }

  setRotationGroupFilter(rotation: LocalRotation, group: number | null): void {
    rotation.selectedGroup = group;
  }

  setRotationStepFilter(rotation: LocalRotation, step: number | null): void {
    rotation.selectedStep = step;
  }

  clearRotationFilters(rotation: LocalRotation): void {
    rotation.selectedGroup = null;
    rotation.selectedStep = null;
  }

  getDriverGroupBadge = (driverId: number): string | null =>
    getRotationDriverGroupBadge(this.internalRotations, driverId);

  getDriverStepBadge = (driverId: number): string | null =>
    getRotationDriverStepBadge(this.internalRotations, driverId);

  toggleStepUpBoundary(rotation: ICustomRotation, heat: ICustomHeat) {
    heat.isStepUpBoundary = !heat.isStepUpBoundary;
    assignCustomRotationStepNumbers(rotation);
    this.captureState();
  }

  addRotation() {
    const candidate = findNextAvailableDriverCount(
      this.internalRotations,
      this.internalNumLanes,
    );

    if (candidate > this.numVirtualDrivers) {
      this.numVirtualDrivers = candidate;
      this.updateVirtualDriversList();
    }

    const newRot: LocalRotation = {
      numDrivers: candidate,
      description: "",
      heats: [],
      isExpanded: true,
    };
    insertRotationSorted(this.internalRotations, newRot);
    this.addHeat(newRot, false);
    this.updateDropListConnections();
    this.captureState();
  }

  removeRotation(index: number) {
    this.internalRotations.splice(index, 1);
    this.updateDropListConnections();
    this.captureState();
  }

  addHeat(rotation: ICustomRotation, triggerAutoSave = true) {
    if (!rotation.heats) {
      rotation.heats = [];
    }
    const driverIndices = new Array(this.internalNumLanes).fill(0);
    rotation.heats.push({
      driverIndices,
      group: 0,
      isStepUpBoundary: false,
      step: 1,
    });
    assignCustomRotationStepNumbers(rotation);
    this.updateDropListConnections();
    if (triggerAutoSave) {
      this.captureState();
    } else {
      this.undoManager.captureState();
    }
  }

  removeHeat(rotation: ICustomRotation, index: number) {
    if (rotation.heats) {
      rotation.heats.splice(index, 1);
      assignCustomRotationStepNumbers(rotation);
      this.updateDropListConnections();
      this.captureState();
    }
  }

  dropHeat(rotation: LocalRotation, event: CdkDragDrop<ICustomHeat[]>) {
    if (rotation.heats && event.previousIndex !== event.currentIndex) {
      const filtered = this.getFilteredHeats(rotation);
      const prevHeat = filtered[event.previousIndex];
      const targetHeat = filtered[event.currentIndex];
      const realPrevIndex = rotation.heats.indexOf(prevHeat);
      const realTargetIndex = rotation.heats.indexOf(targetHeat);
      if (realPrevIndex !== -1 && realTargetIndex !== -1) {
        moveItemInArray(rotation.heats, realPrevIndex, realTargetIndex);
        assignCustomRotationStepNumbers(rotation);
        this.updateDropListConnections();
        this.captureState();
      }
    }
  }

  onNumLanesChange() {
    this.numStepUpDrivers = Math.max(1, (this.internalNumLanes || 4) - 1);
    this.updateStepUpDriversList();
    adjustHeatLanes(this.internalRotations, this.internalNumLanes);
  }

  onDrop(event: CdkDragDrop<any>) {
    if (handleRotationDrop(event, this.internalRotations)) {
      this.captureState();
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

  private syncRotationDriverCounts() {
    syncRotationDriverCounts(this.internalRotations);
  }

  isDriverHighlighted(driverId: number): boolean {
    return this.highlightManager.isDriverHighlighted(driverId);
  }

  getDriverHighlightColor(driverId: number): string | null {
    return this.highlightManager.getDriverHighlightColor(driverId);
  }

  toggleDriverHighlight(driverId: number, event?: MouseEvent): void {
    this.highlightManager.toggleDriverHighlight(driverId, event);
  }

  clearDriverHighlights(): void {
    this.highlightManager.clearDriverHighlights();
  }

  hasHighlightedDrivers(): boolean {
    return this.highlightManager.hasHighlightedDrivers();
  }

  isHeatHighlighted(heat: ICustomHeat): boolean {
    return this.highlightManager.isHeatHighlighted(heat);
  }

  getHeatHighlightColors(heat: ICustomHeat): string[] {
    return this.highlightManager.getHeatHighlightColors(heat);
  }

  getContrastTextColor(color: string): string {
    return getContrastTextColor(color);
  }

  getOriginalHeatDisplay(heat: ICustomHeat): string {
    return getOriginalHeatDisplay(heat);
  }

  removeFromHeat(
    rotation: ICustomRotation,
    heat: ICustomHeat,
    laneIdx: number,
  ): void {
    if (heat.driverIndices && heat.driverIndices[laneIdx] !== 0) {
      heat.driverIndices[laneIdx] = 0;
      this.validateRotationLaneEquality(rotation as LocalRotation);
      this.captureState();
    }
  }

  save() {
    this.syncRotationDriverCounts();
    this.sortRotationsByDrivers();
    this.validateAllRotationsLaneEquality();
    if (!this.isConfigValid()) {
      return;
    }

    if (this.isSaving) {
      this.pendingSave = true;
      this.pendingNavigateBack = true;
      return;
    }

    this.isAutoSaving = false;
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
    this.syncRotationDriverCounts();
    this.validateAllRotationsLaneEquality();
    if (!this.isConfigValid()) {
      return;
    }

    if (this.isSaving) {
      this.pendingSave = true;
      return;
    }

    this.isAutoSaving = true;
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

  readonly getDriverGroupConflicts = getDriverGroupConflicts;
  readonly heatHasGroupConflict = heatHasGroupConflict;
  readonly driverHasGroupConflict = driverHasGroupConflict;
  readonly heatHasError = heatHasError;
  readonly rotationHasStepUps = rotationHasStepUps;
  readonly heatHasStepUpInStepOne = heatHasStepUpInStepOne;

  hasValidationErrors(): boolean {
    return hasValidationErrors(this.internalRotations);
  }

  private checkRotationLaneEqualityDirect(
    rotation: ICustomRotation,
  ): LaneEqualityResult {
    return checkRotationLaneEqualityDirect(
      rotation,
      this.internalNumLanes,
      this.translationService,
    );
  }

  isRotationEqual(rotation: ICustomRotation): boolean {
    return this.equalityManager.isRotationEqual(
      rotation,
      this.internalNumLanes,
      this.translationService,
      (rot) => this.checkRotationLaneEqualityDirect(rot),
    );
  }

  validateRotationLaneEquality(rotation: LocalRotation): void {
    this.equalityManager.validateRotationLaneEquality(
      rotation,
      this.internalNumLanes,
      this.translationService,
      (rot) => this.checkRotationLaneEqualityDirect(rot),
    );
  }

  validateAllRotationsLaneEquality(): void {
    this.equalityManager.validateAllRotationsLaneEquality(
      this.internalRotations,
      this.internalNumLanes,
      this.translationService,
      (rot) => this.checkRotationLaneEqualityDirect(rot),
    );
  }

  showEqualityReport(rotation: ICustomRotation, idx: number): void {
    this.reportRotationIdx = idx;
    this.equalityReport = this.equalityManager.getEqualityReport(
      rotation,
      this.internalNumLanes,
      this.translationService,
      (rot) => this.checkRotationLaneEqualityDirect(rot),
    );
  }

  closeReport(): void {
    this.equalityReport = null;
    this.reportRotationIdx = -1;
  }

  async onImportFiles(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const { results, maxDriverId, maxStepUpId } = await processImportFiles(
      Array.from(input.files),
      this.internalRotations,
      this.internalNumLanes,
    );

    this.sortRotationsByDrivers();
    if (maxDriverId > this.numVirtualDrivers) {
      this.numVirtualDrivers = maxDriverId;
      this.updateVirtualDriversList();
    }
    if (maxStepUpId > this.numStepUpDrivers) {
      this.numStepUpDrivers = maxStepUpId;
      this.updateStepUpDriversList();
    }
    this.importSummary = results;
    input.value = "";
    this.updateDropListConnections();
    this.captureState();
  }

  closeImportSummary() {
    this.importSummary = null;
  }

  async exportSingleRotation(rotation: LocalRotation) {
    await exportSingleRotationHelper(
      this.internalAssetName,
      this.internalNumLanes,
      rotation,
      this.logger,
    );
  }

  async exportRotations() {
    await exportRotationsAssetHelper(
      this.internalAssetName,
      this.internalNumLanes,
      this.internalRotations,
      this.logger,
    );
  }
}
