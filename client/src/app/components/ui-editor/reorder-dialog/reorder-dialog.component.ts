import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
  moveItemInArray,
  ɵɵCdkScrollable,
} from "@angular/cdk/drag-drop";
import {
  ApplicationRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  effect,
  input,
  OnDestroy,
  OnInit,
  output,
  ViewEncapsulation,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Subject } from "rxjs";
import { debounceTime } from "rxjs/operators";
import { AnchorPoint } from "@app/components/raceday/column_definition";
import { BackButtonComponent } from "@app/components/shared/back-button/back-button.component";
import { ColumnPreviewComponent } from "@app/components/ui-editor/column-preview/column-preview.component";
import { ColumnVisibility, Settings } from "@app/models/settings";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { TranslationService } from "@app/services/translation.service";
import { ConfirmationModalComponent } from "@app/components/shared/confirmation-modal/confirmation-modal.component";

export interface ReorderDialogData {
  availableValues: { key: string; label: string }[];
  columnSlots: { key: string; label: string }[];
  columnLayouts: { [columnKey: string]: { [A in AnchorPoint]?: string } };
  columnVisibility: { [columnKey: string]: ColumnVisibility };
  screenName: string;
}

export interface ReorderDialogResult {
  columns: string[];
  columnLayouts: { [columnKey: string]: { [A in AnchorPoint]?: string } };
  columnVisibility: { [columnKey: string]: ColumnVisibility };
}

@Component({
  standalone: true,
  selector: "app-reorder-dialog",
  templateUrl: "./reorder-dialog.component.html",
  styleUrls: ["./reorder-dialog.component.css"],
  changeDetection: ChangeDetectionStrategy.Default,
  encapsulation: ViewEncapsulation.None,
  imports: [
    BackButtonComponent,
    CdkDropList,
    ɵɵCdkScrollable,
    CdkDrag,
    CdkDragHandle,
    FormsModule,
    ColumnPreviewComponent,
    TranslatePipe,
    ConfirmationModalComponent,
  ],
})
export class ReorderDialogComponent implements OnInit, OnDestroy {
  visible = input(false);
  data = input<ReorderDialogData | null>(null);

  save = output<ReorderDialogResult>();
  cancel = output<void>();

  private _visible = false;
  private autoSaveSubject = new Subject<void>();
  private destroy$ = new Subject<void>();

  // Saving state (like Driver Editor)
  isSaving: boolean = false;
  isAutoSaving: boolean = false;

  constructor(
    public cdr: ChangeDetectorRef,
    private appRef: ApplicationRef,
    private translationService: TranslationService,
  ) {
    effect(() => {
      const visible = this.visible();
      if (visible && !this._visible) {
        this.initialStateSet = false;
      }
      this._visible = visible;
    });

    effect(() => {
      const data = this.data();
      if (data) {
        this.initialStateSet = false;
        this.undoStack = [];
        this.redoStack = [];

        // Store screen name
        this.screenName = data.screenName || "";

        this.availableValues = [...data.availableValues].sort((a, b) => {
          const labelA =
            this.translationService.translate(a.label || a.key) || "";
          const labelB =
            this.translationService.translate(b.label || b.key) || "";
          return labelA.localeCompare(labelB, undefined, {
            sensitivity: "base",
          });
        });
        this.availableValuesMap = new Map(
          this.availableValues.map((v) => [v.key, v]),
        );

        const newSlots = data.columnSlots.map((s) => ({ ...s }));
        const newLayouts = JSON.parse(JSON.stringify(data.columnLayouts || {}));
        const newVisibility = JSON.parse(
          JSON.stringify(data.columnVisibility || {}),
        );

        // Initialize items if missing or empty. Every slot MUST have at least one anchor filled.
        newSlots.forEach((slot) => {
          if (
            !newLayouts[slot.key] ||
            Object.keys(newLayouts[slot.key]).length === 0
          ) {
            const layout = newLayouts[slot.key] || {};
            newLayouts[slot.key] = {
              ...layout,
              [AnchorPoint.CenterCenter]: slot.key,
            };
          }
          if (!newVisibility[slot.key]) {
            newVisibility[slot.key] = ColumnVisibility.Always;
          }
        });

        this.columnSlots = newSlots;
        this.columnLayouts = newLayouts;
        this.columnVisibility = newVisibility;

        // Store initial state for change detection (only once) - AFTER defaults applied
        if (!this.initialStateSet) {
          this.originalState = {
            slots: this.columnSlots.map((s) => s.key),
            layouts: JSON.stringify(this.columnLayouts),
            visibility: JSON.stringify(this.columnVisibility),
          };
          this.initialStateSet = true;
        }

        this.hasUnsavedChanges = false;

        this.updateDropListIds();
        this.cdr.markForCheck();
      }
    });
  }

  ngOnInit() {
    // Auto-save on changes (debounced like Driver Editor)
    this.autoSaveSubject.pipe(debounceTime(300)).subscribe(() => {
      this.triggerAutoSave();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.autoSaveSubject.complete();
  }

  private triggerAutoSave() {
    if (this.hasChanges()) {
      this.isAutoSaving = true;
      this.isSaving = true;
      this.onSave();
      // Reset saving state after a brief delay
      setTimeout(() => {
        this.isAutoSaving = false;
        this.isSaving = false;
        this.cdr.markForCheck();
      }, 500);
    }
  }

  availableValues: { key: string; label: string }[] = [];
  availableValuesMap = new Map<string, { key: string; label: string }>();
  columnSlots: { key: string; label: string }[] = [];
  columnLayouts: { [columnKey: string]: { [A in AnchorPoint]?: string } } = {};
  columnVisibility: { [columnKey: string]: ColumnVisibility } = {};
  anchorOptions = Object.values(AnchorPoint);
  visibilityOptions = Object.values(ColumnVisibility);
  cachedDropListIds: string[] = [];
  screenName: string = "";
  showLastValueConfirm = false;
  pendingLastValueClear: { slotKey: string; anchor: AnchorPoint } | null = null;

  // Track initial state for change detection
  private initialState: {
    slots: string[];
    layouts: string;
    visibility: string;
  } | null = null;
  private originalState: {
    slots: string[];
    layouts: string;
    visibility: string;
  } | null = null;
  private hasUnsavedChanges = false;
  private initialStateSet = false;

  // Undo/Redo state tracking
  private undoStack: {
    slots: { key: string; label: string }[];
    layouts: { [key: string]: any };
    visibility: { [key: string]: ColumnVisibility };
  }[] = [];
  private redoStack: {
    slots: { key: string; label: string }[];
    layouts: { [key: string]: any };
    visibility: { [key: string]: ColumnVisibility };
  }[] = [];
  private maxUndoStackSize = 50;

  private updateDropListIds() {
    const ids: string[] = [];
    this.columnSlots.forEach((slot) => {
      this.anchorOptions.forEach((opt) => {
        ids.push(`slot-${slot.key}-${opt}`);
      });
    });
    ids.push("slot-add-new");
    this.cachedDropListIds = ids;
  }

  // Track which slot is being previewed or detail-edited if needed
  selectedSlotKey: string | null = null;

  dropColumn(event: CdkDragDrop<string[]>) {
    const newSlots = [...this.columnSlots];
    moveItemInArray(newSlots, event.previousIndex, event.currentIndex);
    this.columnSlots = newSlots;
    this.updateDropListIds();

    // Capture state before reindexing
    this.markChanges();

    this.reindexAllSegments();
    this.cdr.detectChanges();
  }

  onValueDrop(slotKey: string, anchor: AnchorPoint, propertyName: string) {
    // Push current state to undo stack BEFORE modifying
    this.markChanges();

    // Then modify the state
    const newLayouts = { ...this.columnLayouts };
    newLayouts[slotKey] = {
      ...(newLayouts[slotKey] || {}),
      [anchor]: propertyName,
    };
    this.columnLayouts = newLayouts;

    if (propertyName.startsWith("segmentTime")) {
      this.reindexAllSegments();
    }

    this.cdr.detectChanges();
  }

  clearAnchor(slotKey: string, anchor: AnchorPoint) {
    if (this.columnLayouts[slotKey]) {
      const currentLayout = this.columnLayouts[slotKey];
      const activeKeys = Object.keys(currentLayout).filter(
        (key) => !!currentLayout[key as AnchorPoint],
      );

      // Check if this is the last value in the slot
      // Only show confirmation if the anchor actually has a value
      if (activeKeys.length === 1 && activeKeys[0] === anchor && currentLayout[anchor]) {
        this.pendingLastValueClear = { slotKey, anchor };
        this.showLastValueConfirm = true;
        this.cdr.detectChanges();
        return;
      }

      // Push current state to undo stack BEFORE removing
      this.markChanges();

      const newLayouts = { ...this.columnLayouts };
      const newSlotLayout = { ...newLayouts[slotKey] };
      const clearedProp = newSlotLayout[anchor];
      delete newSlotLayout[anchor];
      newLayouts[slotKey] = newSlotLayout;
      this.columnLayouts = newLayouts;

      if (clearedProp?.startsWith("segmentTime")) {
        this.reindexAllSegments();
      }
      this.cdr.detectChanges();
    }
  }

  onConfirmLastValueClear() {
    if (this.pendingLastValueClear) {
      this.removeColumn(this.pendingLastValueClear.slotKey);
    }
    this.onCancelLastValueClear();
  }

  onCancelLastValueClear() {
    this.showLastValueConfirm = false;
    this.pendingLastValueClear = null;
    this.cdr.markForCheck();
  }

  removeColumn(slotKey: string) {
    // Push current state to undo stack BEFORE removing
    this.markChanges();

    const isSegment = slotKey.startsWith("segmentTime");
    this.columnSlots = this.columnSlots.filter((s) => s.key !== slotKey);

    const newLayouts = { ...this.columnLayouts };
    delete newLayouts[slotKey];
    this.columnLayouts = newLayouts;

    const newVisibility = { ...this.columnVisibility };
    delete newVisibility[slotKey];
    this.columnVisibility = newVisibility;

    if (isSegment) {
      this.reindexSegments();
    }

    this.updateDropListIds();
    this.cdr.markForCheck();
  }

  private reindexSegments() {
    const segmentSlots = this.columnSlots.filter((s) =>
      s.key.startsWith("segmentTime"),
    );
    if (segmentSlots.length === 0) return;

    const newSlots = [...this.columnSlots];
    const newLayouts = { ...this.columnLayouts };
    const newVisibility = { ...this.columnVisibility };

    segmentSlots.forEach((slot, index) => {
      const oldKey = slot.key;
      const newKey = index === 0 ? "segmentTime" : `segmentTime_${index}`;

      if (oldKey !== newKey) {
        // Update slot key
        const slotIdx = newSlots.findIndex((s) => s.key === oldKey);
        newSlots[slotIdx] = { ...newSlots[slotIdx], key: newKey };

        // Update layouts root key
        if (newLayouts[oldKey]) {
          newLayouts[newKey] = newLayouts[oldKey];
          delete newLayouts[oldKey];
        }

        // Update visibility
        if (newVisibility[oldKey]) {
          newVisibility[newKey] = newVisibility[oldKey];
          delete newVisibility[oldKey];
        }
      }

      // ALWAYS update the property names inside the layout for segment columns
      // to match their current index, regardless of whether the slot key changed.
      // This is crucial because a removal shifted the logical indices.
      // Re-indexing of internal segment properties is now handled by reindexAllSegments()
    });

    this.columnSlots = newSlots;
    this.columnLayouts = newLayouts;
    this.columnVisibility = newVisibility;

    this.reindexAllSegments();
    this.markChanges();
  }

  private reindexAllSegments() {
    const newLayouts = { ...this.columnLayouts };

    // Predetermined order of anchors for consistent indexing within a column
    const anchorOrder = [
      AnchorPoint.TopLeft,
      AnchorPoint.TopCenter,
      AnchorPoint.TopRight,
      AnchorPoint.CenterLeft,
      AnchorPoint.CenterCenter,
      AnchorPoint.CenterRight,
      AnchorPoint.BottomLeft,
      AnchorPoint.BottomCenter,
      AnchorPoint.BottomRight,
    ];

    this.columnSlots.forEach((slot) => {
      const layout = newLayouts[slot.key];
      if (layout) {
        let segmentCounter = 0; // Reset counter for each column
        const newSlotLayout = { ...layout };
        anchorOrder.forEach((anchor) => {
          const prop = newSlotLayout[anchor];
          if (prop && prop.split("_")[0] === "segmentTime") {
            const newProp =
              segmentCounter === 0
                ? "segmentTime"
                : `segmentTime_${segmentCounter}`;
            newSlotLayout[anchor] = newProp;
            segmentCounter++;
          }
        });
        newLayouts[slot.key] = newSlotLayout;
      }
    });

    this.columnLayouts = newLayouts;
  }

  onAddColumnDrop(event: CdkDragDrop<any>) {
    const propertyKey = event.item.data;
    if (!propertyKey) return;

    // Push current state to undo stack BEFORE modifying
    this.markChanges();

    // Create a unique key for the new slot
    let baseKey = propertyKey;
    let newKey = baseKey;
    let counter = 1;
    while (this.columnSlots.some((s) => s.key === newKey)) {
      newKey = `${baseKey}_${counter++}`;
    }

    const label = this.getLabel(propertyKey);
    this.columnSlots = [...this.columnSlots, { key: newKey, label: label }];

    const newLayouts = { ...this.columnLayouts };
    // For segmentTime, the property name should match the unique key to preserve indexing
    const targetProperty = propertyKey === "segmentTime" ? newKey : propertyKey;
    newLayouts[newKey] = { [AnchorPoint.CenterCenter]: targetProperty };
    this.columnLayouts = newLayouts;

    const newVisibility = { ...this.columnVisibility };
    newVisibility[newKey] = ColumnVisibility.Always;
    this.columnVisibility = newVisibility;

    this.updateDropListIds();
    this.reindexAllSegments();
    this.cdr.markForCheck();
  }

  getLabel(key: string): string {
    // Special case for builtin imagesets
    if (key === "imageset_fuel-gauge-builtin") {
      return "RD_COL_FUEL_GAUGE";
    }

    const baseKey = key.split("_")[0];
    const val = this.availableValuesMap.get(baseKey);
    let label = val ? val.label : key;

    if (key.startsWith("segmentTime")) {
      const parts = key.split("_");
      if (parts.length > 1) {
        const index = parseInt(parts[1], 10) + 1;
        return `${this.translationService.translate(label)} ${index}`;
      }
    }
    return label;
  }

  getColumnLabel(slotKey: string): string {
    const layout = this.columnLayouts[slotKey];
    if (layout) {
      const centerProp = layout[AnchorPoint.CenterCenter];
      if (centerProp) {
        return this.getLabel(centerProp);
      }
    }

    const slot = this.columnSlots.find((s) => s.key === slotKey);
    return slot ? slot.label : slotKey;
  }

  onSave() {
    this.save.emit({
      columns: this.columnSlots.map((c) => c.key),
      columnLayouts: this.columnLayouts,
      columnVisibility: this.columnVisibility,
    });
    // Reset change tracking after save
    this.hasUnsavedChanges = false;
    // Update originalState to match current saved state
    // This ensures undo/redo properly track against the last saved state
    this.originalState = {
      slots: this.columnSlots.map((s) => s.key),
      layouts: JSON.stringify(this.columnLayouts),
      visibility: JSON.stringify(this.columnVisibility),
    };
    // Force UI update
    this.cdr.markForCheck();
  }

  hasChanges(): boolean {
    if (!this.originalState) return false;

    const currentSlots = this.columnSlots.map((s) => s.key);
    const currentLayouts = JSON.stringify(this.columnLayouts);
    const currentVisibility = JSON.stringify(this.columnVisibility);

    const slotsDiffer =
      JSON.stringify(currentSlots) !== JSON.stringify(this.originalState.slots);
    const layoutsDiffer = currentLayouts !== this.originalState.layouts;
    const visibilityDiffer =
      currentVisibility !== this.originalState.visibility;

    return slotsDiffer || layoutsDiffer || visibilityDiffer;
  }

  // Mark that changes have been made and trigger auto-save
  markChanges() {
    this.hasUnsavedChanges = true;
    this.pushState();
    // Trigger auto-save (like Driver Editor)
    this.autoSaveSubject.next();
  }

  // Push current state to undo stack
  private pushState() {
    const state = {
      slots: JSON.parse(JSON.stringify(this.columnSlots)),
      layouts: JSON.parse(JSON.stringify(this.columnLayouts)),
      visibility: JSON.parse(JSON.stringify(this.columnVisibility)),
    };

    this.undoStack.push(state);

    // Limit stack size
    if (this.undoStack.length > this.maxUndoStackSize) {
      this.undoStack.shift();
    }

    // Clear redo stack on new change
    this.redoStack = [];
  }

  // Undo last action
  undo(): void {
    if (this.undoStack.length === 0) return;

    // Save current state to redo stack
    const currentState = {
      slots: JSON.parse(JSON.stringify(this.columnSlots)),
      layouts: JSON.parse(JSON.stringify(this.columnLayouts)),
      visibility: JSON.parse(JSON.stringify(this.columnVisibility)),
    };
    this.redoStack.push(currentState);

    // Restore previous state with new references
    const previousState = this.undoStack.pop()!;

    // Create new array references to trigger change detection
    this.columnSlots = [...previousState.slots];
    this.columnLayouts = { ...previousState.layouts };
    this.columnVisibility = { ...previousState.visibility };

    this.updateDropListIds();

    // Check if we're back to original state
    this.hasUnsavedChanges = this.hasChanges();

    // Force full application change detection
    this.appRef.tick();
  }

  // Redo last undone action
  redo(): void {
    if (this.redoStack.length === 0) return;

    // Save current state to undo stack
    const currentState = {
      slots: JSON.parse(JSON.stringify(this.columnSlots)),
      layouts: JSON.parse(JSON.stringify(this.columnLayouts)),
      visibility: JSON.parse(JSON.stringify(this.columnVisibility)),
    };
    this.undoStack.push(currentState);

    // Restore next state
    const nextState = this.redoStack.pop()!;
    this.columnSlots = nextState.slots;
    this.columnLayouts = nextState.layouts;
    this.columnVisibility = nextState.visibility;

    this.updateDropListIds();

    // Check against current saved state
    this.hasUnsavedChanges = this.hasChanges();
    this.cdr.markForCheck();
  }

  // Check if current state differs from initial state
  private checkStateDiffersFromInitial(): boolean {
    if (!this.initialState) return false;

    const currentSlots = this.columnSlots.map((s) => s.key);
    const currentLayouts = JSON.stringify(this.columnLayouts);
    const currentVisibility = JSON.stringify(this.columnVisibility);

    return (
      JSON.stringify(currentSlots) !==
        JSON.stringify(this.initialState.slots) ||
      currentLayouts !== this.initialState.layouts ||
      currentVisibility !== this.initialState.visibility
    );
  }

  // Check if undo is available
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  // Check if redo is available
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  onReset() {
    // Calculate what the reset state would be
    const newSlots = Settings.DEFAULT_COLUMNS.map((key) => ({
      key,
      label: this.getLabel(key),
    }));
    const newLayouts = JSON.parse(JSON.stringify(new Settings().columnLayouts));
    const newVisibility = JSON.parse(
      JSON.stringify(new Settings().columnVisibility),
    );

    // Check if reset would actually change anything
    const slotsSame =
      JSON.stringify(newSlots.map((s) => s.key)) ===
      JSON.stringify(this.columnSlots.map((s) => s.key));

    // For layouts, sort keys before comparing since object key order matters in JSON.stringify
    const sortKeys = (obj: any) => {
      const sorted: any = {};
      Object.keys(obj)
        .sort()
        .forEach((k) => {
          sorted[k] = obj[k];
        });
      return sorted;
    };
    const layoutsSame =
      JSON.stringify(sortKeys(newLayouts)) ===
      JSON.stringify(sortKeys(this.columnLayouts));

    // For visibility, normalize both sides by adding default "Always" for missing keys
    const normalizeVisibility = (vis: any, slots: any[]) => {
      const normalized: any = {};
      slots.forEach((s) => {
        normalized[s.key] = vis[s.key] || ColumnVisibility.Always;
      });
      return JSON.stringify(normalized);
    };
    const normalizedNewVis = normalizeVisibility(newVisibility, newSlots);
    const normalizedCurrVis = normalizeVisibility(
      this.columnVisibility,
      this.columnSlots,
    );
    const visibilitySame = normalizedNewVis === normalizedCurrVis;

    if (slotsSame && layoutsSame && visibilitySame) {
      // No changes needed, don't modify state
      return;
    }

    // Save current state to undo stack before resetting
    const currentState = {
      slots: JSON.parse(JSON.stringify(this.columnSlots)),
      layouts: JSON.parse(JSON.stringify(this.columnLayouts)),
      visibility: JSON.parse(JSON.stringify(this.columnVisibility)),
    };
    this.undoStack.push(currentState);

    // Clear redo stack
    this.redoStack = [];

    this.columnSlots = newSlots;
    this.columnLayouts = newLayouts;
    this.columnVisibility = newVisibility;

    // Add "Always" visibility for any slots not in default settings
    newSlots.forEach((slot) => {
      if (!this.columnVisibility[slot.key]) {
        this.columnVisibility[slot.key] = ColumnVisibility.Always;
      }
    });

    this.updateDropListIds();

    // Trigger auto-save
    this.markChanges();
  }

  onCancel() {
    // Like Driver Editor's onBackClicked() - save if dirty before closing
    if (this.hasChanges()) {
      this.isSaving = true;
      this.onSave();
      // Give save a moment to process before closing
      setTimeout(() => {
        this.cancel.emit();
      }, 100);
    } else {
      this.cancel.emit();
    }
  }

  trackByKey(index: number, item: any): string {
    return item.key;
  }

  trackByAnchor(index: number, item: any): string {
    return item;
  }

  get isResetDisabled(): boolean {
    // Calculate what the reset state would be
    const newSlots = Settings.DEFAULT_COLUMNS.map((key) => ({
      key,
      label: this.getLabel(key),
    }));
    const newLayouts = JSON.parse(JSON.stringify(new Settings().columnLayouts));
    const newVisibility = JSON.parse(
      JSON.stringify(new Settings().columnVisibility),
    );

    // Check if reset would actually change anything
    const slotsSame =
      JSON.stringify(newSlots.map((s) => s.key)) ===
      JSON.stringify(this.columnSlots.map((s) => s.key));

    // For layouts, sort keys before comparing since object key order matters in JSON.stringify
    const sortKeys = (obj: any) => {
      const sorted: any = {};
      Object.keys(obj)
        .sort()
        .forEach((k) => {
          sorted[k] = obj[k];
        });
      return sorted;
    };
    const layoutsSame =
      JSON.stringify(sortKeys(newLayouts)) ===
      JSON.stringify(sortKeys(this.columnLayouts));

    // For visibility, normalize both sides by adding default "Always" for missing keys
    const normalizeVisibility = (vis: any, slots: any[]) => {
      const normalized: any = {};
      slots.forEach((s) => {
        normalized[s.key] = vis[s.key] || ColumnVisibility.Always;
      });
      return JSON.stringify(normalized);
    };
    const normalizedNewVis = normalizeVisibility(newVisibility, newSlots);
    const normalizedCurrVis = normalizeVisibility(
      this.columnVisibility,
      this.columnSlots,
    );
    const visibilitySame = normalizedNewVis === normalizedCurrVis;

    return slotsSame && layoutsSame && visibilitySame;
  }

  onDone() {
    // Like Driver Editor - save if dirty then close
    if (this.hasChanges()) {
      this.isSaving = true;
      this.onSave();
    }
    this.cancel.emit();
  }

  trackByIndex(index: number, _row: any): number {
    return index;
  }
}
