import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { AnchorPoint } from '../../raceday/column_definition';
import { TranslationService } from '../../../services/translation.service';
import { Settings, ColumnVisibility } from '../../../models/settings';
import { ScreenType } from '../../screen-selector/screen-selector.component';

export interface ReorderDialogData {
  availableValues: { key: string; label: string }[];
  columnSlots: { key: string; label: string }[];
  columnLayouts: { [columnKey: string]: { [A in AnchorPoint]?: string } };
  columnVisibility: { [columnKey: string]: ColumnVisibility };
}

export interface ReorderDialogResult {
  columns: string[];
  columnLayouts: { [columnKey: string]: { [A in AnchorPoint]?: string } };
  columnVisibility: { [columnKey: string]: ColumnVisibility };
}

@Component({
  selector: 'app-reorder-dialog',
  templateUrl: './reorder-dialog.component.html',
  styleUrls: ['./reorder-dialog.component.css'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.Default
})
export class ReorderDialogComponent {
  @Input() visible = false;
  @Input() screenType: ScreenType = 'race-screen';
  @Input() set data(value: ReorderDialogData | null) {
    if (value) {
      this.availableValues = value.availableValues.map(v => ({
        ...v,
        translatedLabel: this.translationService.translate(v.label).toUpperCase()
      }));

      // Alphabetize available values list by translated label, but keep image sets at the bottom
      this.availableValues.sort((a, b) => {
        const aIsImageSet = a.key.startsWith('imageset_');
        const bIsImageSet = b.key.startsWith('imageset_');
        if (aIsImageSet && !bIsImageSet) return 1;
        if (!aIsImageSet && bIsImageSet) return -1;
        return a.translatedLabel.localeCompare(b.translatedLabel);
      });

      // Build faster lookup map
      this.availableValuesMap.clear();
      this.availableValues.forEach(v => this.availableValuesMap.set(v.key, v));

      const newSlots = value.columnSlots.map(s => ({ ...s }));
      const newLayouts = JSON.parse(JSON.stringify(value.columnLayouts || {}));
      const newVisibility = JSON.parse(JSON.stringify(value.columnVisibility || {}));

      // Initialize items if missing or empty. Every slot MUST have at least one anchor filled.
      newSlots.forEach(slot => {
        const layout = newLayouts[slot.key] || {};
        // If the layout is completely empty, or specifically has no primary CenterCenter value
        if (Object.keys(layout).length === 0 || !layout[AnchorPoint.CenterCenter]) {
          newLayouts[slot.key] = { ...layout, [AnchorPoint.CenterCenter]: slot.key };
        }
        if (!newVisibility[slot.key]) {
          newVisibility[slot.key] = ColumnVisibility.Always;
        }
      });

      this.columnSlots = newSlots;
      this.columnLayouts = newLayouts;
      this.columnVisibility = newVisibility;

      this.reindexAllSegments();
      this.updateDropListIds();
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    }
  }

  constructor(
    public cdr: ChangeDetectorRef,
    private translationService: TranslationService
  ) { }

  @Output() save = new EventEmitter<ReorderDialogResult>();
  @Output() cancel = new EventEmitter<void>();

  availableValues: { key: string; label: string; translatedLabel: string }[] = [];
  availableValuesMap = new Map<string, { key: string; label: string; translatedLabel: string }>();
  columnSlots: { key: string; label: string }[] = [];
  columnLayouts: { [columnKey: string]: { [A in AnchorPoint]?: string } } = {};
  columnVisibility: { [columnKey: string]: ColumnVisibility } = {};
  anchorOptions = Object.values(AnchorPoint);
  visibilityOptions = Object.values(ColumnVisibility);
  cachedDropListIds: string[] = [];

  private updateDropListIds() {
    const ids: string[] = [];
    this.columnSlots.forEach(slot => {
      this.anchorOptions.forEach(opt => {
        ids.push(`slot-${slot.key}-${opt}`);
      });
    });
    ids.push('slot-add-new');
    this.cachedDropListIds = ids;
  }



  // Track which slot is being previewed or detail-edited if needed
  selectedSlotKey: string | null = null;

  dropColumn(event: CdkDragDrop<string[]>) {
    const newSlots = [...this.columnSlots];
    moveItemInArray(newSlots, event.previousIndex, event.currentIndex);
    this.columnSlots = newSlots;
    this.updateDropListIds();
    this.reindexAllSegments();
    this.cdr.markForCheck();
  }

  onValueDrop(slotKey: string, anchor: AnchorPoint, propertyName: string) {
    const newLayouts = { ...this.columnLayouts };
    newLayouts[slotKey] = { ...(newLayouts[slotKey] || {}), [anchor]: propertyName };
    this.columnLayouts = newLayouts;

    if (propertyName.startsWith('segmentTime')) {
      this.reindexAllSegments();
    }
    this.cdr.markForCheck();
  }

  clearAnchor(slotKey: string, anchor: AnchorPoint) {
    if (this.columnLayouts[slotKey]) {
      const newLayouts = { ...this.columnLayouts };
      const newSlotLayout = { ...newLayouts[slotKey] };
      const clearedProp = newSlotLayout[anchor];
      delete newSlotLayout[anchor];
      newLayouts[slotKey] = newSlotLayout;
      this.columnLayouts = newLayouts;

      if (clearedProp?.startsWith('segmentTime')) {
        this.reindexAllSegments();
      }
      this.cdr.markForCheck();
    }
  }

  removeColumn(slotKey: string) {
    const isSegment = slotKey.startsWith('segmentTime');
    this.columnSlots = this.columnSlots.filter(s => s.key !== slotKey);

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
    const segmentSlots = this.columnSlots.filter(s => s.key.startsWith('segmentTime'));
    if (segmentSlots.length === 0) return;

    const newSlots = [...this.columnSlots];
    const newLayouts = { ...this.columnLayouts };
    const newVisibility = { ...this.columnVisibility };

    segmentSlots.forEach((slot, index) => {
      const oldKey = slot.key;
      const newKey = index === 0 ? 'segmentTime' : `segmentTime_${index}`;

      if (oldKey !== newKey) {
        // Update slot key
        const slotIdx = newSlots.findIndex(s => s.key === oldKey);
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
  }

  private reindexAllSegments() {
    const newLayouts = { ...this.columnLayouts };

    // Predetermined order of anchors for consistent indexing within a column
    const anchorOrder = [
      AnchorPoint.TopLeft, AnchorPoint.TopCenter, AnchorPoint.TopRight,
      AnchorPoint.CenterLeft, AnchorPoint.CenterCenter, AnchorPoint.CenterRight,
      AnchorPoint.BottomLeft, AnchorPoint.BottomCenter, AnchorPoint.BottomRight
    ];

    this.columnSlots.forEach(slot => {
      const layout = newLayouts[slot.key];
      if (layout) {
        let segmentCounter = 0; // Reset counter for each column
        const newSlotLayout = { ...layout };
        anchorOrder.forEach(anchor => {
          const prop = newSlotLayout[anchor];
          if (prop && prop.split('_')[0] === 'segmentTime') {
            const newProp = segmentCounter === 0 ? 'segmentTime' : `segmentTime_${segmentCounter}`;
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

    // Create a unique key for the new slot
    let baseKey = propertyKey;
    let newKey = baseKey;
    let counter = 1;
    while (this.columnSlots.some(s => s.key === newKey)) {
      newKey = `${baseKey}_${counter++}`;
    }

    const label = this.getLabel(propertyKey);
    this.columnSlots = [...this.columnSlots, { key: newKey, label: label }];

    const newLayouts = { ...this.columnLayouts };
    // For segmentTime, the property name should match the unique key to preserve indexing
    const targetProperty = propertyKey === 'segmentTime' ? newKey : propertyKey;
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
    const baseKey = key.split('_')[0];
    const val = this.availableValuesMap.get(baseKey);
    let label = val ? val.label : key;

    if (key.startsWith('segmentTime')) {
      const parts = key.split('_');
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

    const slot = this.columnSlots.find(s => s.key === slotKey);
    return slot ? slot.label : slotKey;
  }

  onSave() {
    this.save.emit({
      columns: this.columnSlots.map(c => c.key),
      columnLayouts: this.columnLayouts,
      columnVisibility: this.columnVisibility
    });
  }

  onReset() {
    this.columnSlots = Settings.DEFAULT_COLUMNS.map(key => ({
      key,
      label: this.getLabel(key)
    }));
    this.columnLayouts = JSON.parse(JSON.stringify(new Settings().columnLayouts));
    this.columnVisibility = JSON.parse(JSON.stringify(new Settings().columnVisibility));
    this.updateDropListIds();
    this.cdr.markForCheck();
  }

  onCancel() {
    this.cancel.emit();
  }

  trackByKey(index: number, item: any): string {
    return item.key;
  }

  trackByAnchor(index: number, item: any): string {
    return item;
  }

  trackByIndex(index: number): number {
    return index;
  }
}

