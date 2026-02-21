import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { AnchorPoint } from '../../raceday/column_definition';
import { TranslationService } from '../../../services/translation.service';

export interface ReorderDialogData {
  availableValues: { key: string; label: string }[];
  columnSlots: { key: string; label: string }[];
  columnLayouts: { [columnKey: string]: { [A in AnchorPoint]?: string } };
}

export interface ReorderDialogResult {
  columns: string[];
  columnLayouts: { [columnKey: string]: { [A in AnchorPoint]?: string } };
}

@Component({
  selector: 'app-reorder-dialog',
  templateUrl: './reorder-dialog.component.html',
  styleUrls: ['./reorder-dialog.component.css'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReorderDialogComponent {
  @Input() visible = false;
  @Input() set data(value: ReorderDialogData | null) {
    if (value) {
      this.availableValues = value.availableValues.map(v => ({
        ...v,
        translatedLabel: this.translationService.translate(v.label).toUpperCase()
      }));

      // Alphabetize available values list by translated label
      this.availableValues.sort((a, b) => a.translatedLabel.localeCompare(b.translatedLabel));

      // Build faster lookup map
      this.availableValuesMap.clear();
      this.availableValues.forEach(v => this.availableValuesMap.set(v.key, v));

      this.columnSlots = value.columnSlots.map(s => ({ ...s }));
      this.columnLayouts = JSON.parse(JSON.stringify(value.columnLayouts));

      // Initialize slots in layout if missing
      this.columnSlots.forEach(slot => {
        if (!this.columnLayouts[slot.key]) {
          this.columnLayouts[slot.key] = { [AnchorPoint.CenterCenter]: slot.key };
        }
      });
      this.updateDropListIds();
      this.cdr.markForCheck();
    }
  }

  constructor(private cdr: ChangeDetectorRef, private translationService: TranslationService) { }

  @Output() save = new EventEmitter<ReorderDialogResult>();
  @Output() cancel = new EventEmitter<void>();

  availableValues: { key: string; label: string; translatedLabel: string }[] = [];
  availableValuesMap = new Map<string, { key: string; label: string; translatedLabel: string }>();
  columnSlots: { key: string; label: string }[] = [];
  columnLayouts: { [columnKey: string]: { [A in AnchorPoint]?: string } } = {};
  anchorOptions = Object.values(AnchorPoint);
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
    moveItemInArray(this.columnSlots, event.previousIndex, event.currentIndex);
    this.updateDropListIds();
    this.cdr.markForCheck();
  }

  onValueDrop(slotKey: string, anchor: AnchorPoint, propertyName: string) {
    if (!this.columnLayouts[slotKey]) {
      this.columnLayouts[slotKey] = {};
    }
    this.columnLayouts[slotKey][anchor] = propertyName;
    this.cdr.markForCheck();
  }

  clearAnchor(slotKey: string, anchor: AnchorPoint) {
    if (this.columnLayouts[slotKey]) {
      delete this.columnLayouts[slotKey][anchor];
      this.cdr.markForCheck();
    }
  }

  removeColumn(slotKey: string) {
    this.columnSlots = this.columnSlots.filter(s => s.key !== slotKey);
    delete this.columnLayouts[slotKey];
    this.updateDropListIds();
    this.cdr.markForCheck();
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
    this.columnSlots.push({ key: newKey, label: label });
    this.columnLayouts[newKey] = { [AnchorPoint.CenterCenter]: propertyKey };
    this.updateDropListIds();
    this.cdr.markForCheck();
  }


  getLabel(key: string): string {
    const val = this.availableValuesMap.get(key);
    return val ? val.label : key;
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
      columnLayouts: this.columnLayouts
    });
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

