import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { AnchorPoint } from '../../raceday/column_definition';

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
  standalone: false
})
export class ReorderDialogComponent {
  @Input() visible = false;
  @Input() set data(value: ReorderDialogData | null) {
    if (value) {
      this.availableValues = value.availableValues.map(v => ({ ...v }));
      this.columnSlots = value.columnSlots.map(s => ({ ...s }));
      this.columnLayouts = JSON.parse(JSON.stringify(value.columnLayouts));

      // Initialize slots in layout if missing
      this.columnSlots.forEach(slot => {
        if (!this.columnLayouts[slot.key]) {
          this.columnLayouts[slot.key] = { [AnchorPoint.CenterCenter]: slot.key };
        }
      });
    }
  }

  @Output() save = new EventEmitter<ReorderDialogResult>();
  @Output() cancel = new EventEmitter<void>();

  availableValues: { key: string; label: string }[] = [];
  columnSlots: { key: string; label: string }[] = [];
  columnLayouts: { [columnKey: string]: { [A in AnchorPoint]?: string } } = {};
  anchorOptions = Object.values(AnchorPoint);

  get slotDropLists(): string[] {
    const ids: string[] = [];
    this.columnSlots.forEach(slot => {
      this.anchorOptions.forEach(opt => {
        ids.push(`slot-${slot.key}-${opt}`);
      });
    });
    ids.push('slot-add-new');
    return ids;
  }


  // Track which slot is being previewed or detail-edited if needed
  selectedSlotKey: string | null = null;

  dropColumn(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.columnSlots, event.previousIndex, event.currentIndex);
  }

  onValueDrop(slotKey: string, anchor: AnchorPoint, propertyName: string) {
    if (!this.columnLayouts[slotKey]) {
      this.columnLayouts[slotKey] = {};
    }
    this.columnLayouts[slotKey][anchor] = propertyName;
  }

  clearAnchor(slotKey: string, anchor: AnchorPoint) {
    if (this.columnLayouts[slotKey]) {
      delete this.columnLayouts[slotKey][anchor];
    }
  }

  removeColumn(slotKey: string) {
    this.columnSlots = this.columnSlots.filter(s => s.key !== slotKey);
    delete this.columnLayouts[slotKey];
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
  }


  getLabel(key: string): string {
    const val = this.availableValues.find(v => v.key === key);
    return val ? val.label : key;
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
}

