import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { AnchorPoint } from '../../raceday/column_definition';
import { ColumnVisibility } from '../../../models/settings';

// TODO(aufderheide): This may be the third time this list appears in code
const PREVIEW_LABELS: { [key: string]: string } = {
  'lapCount': 'RD_COL_LAP',
  'lastLapTime': 'RD_COL_LAP_TIME',
  'medianLapTime': 'RD_COL_MEDIAN_LAP',
  'averageLapTime': 'RD_COL_AVG_LAP',
  'bestLapTime': 'RD_COL_BEST_LAP',
  'gapLeader': 'RD_COL_GAP_LEADER',
  'gapPosition': 'RD_COL_GAP_POSITION',
  'reactionTime': 'RD_COL_REACTION_TIME',
  'participant.team.name': 'RD_COL_TEAM',
  'driver.name': 'RD_COL_NAME',
  'driver.nickname': 'RD_COL_NICKNAME',
  'driver.avatarUrl': 'RD_COL_AVATAR',
  'participant.fuelLevel': 'RD_COL_FUEL_LEVEL',
  'fuelCapacity': 'RD_COL_FUEL_CAPACITY',
  'fuelPercentage': 'RD_COL_FUEL_PERCENTAGE'
};

@Component({
  selector: 'app-column-preview',
  templateUrl: './column-preview.component.html',
  styleUrls: ['./column-preview.component.css'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.Default
})
export class ColumnPreviewComponent {
  @Input() resizingColumnKey: string | null = null;

  private columnSlotsMap = new Map<string, { key: string; label: string }>();
  private _columnSlots: { key: string; label: string }[] = [];
  @Input() set columnSlots(value: { key: string; label: string }[]) {
    this._columnSlots = value;
    this.columnSlotsMap.clear();
    value.forEach(s => this.columnSlotsMap.set(s.key, s));
  }
  get columnSlots() { return this._columnSlots; }

  @Input() columnLayouts: { [columnKey: string]: { [A in AnchorPoint]?: string } } = {};
  @Input() columnVisibility: { [columnKey: string]: ColumnVisibility } = {};

  anchorOptions = Object.values(AnchorPoint);

  trackByKey(index: number, item: any): string {
    return item.key;
  }

  trackByAnchor(index: number, item: any): string {
    return item;
  }

  getLabel(prop: string | undefined): string {
    if (!prop) return '';
    const baseKey = prop.split('_')[0];

    // If it's a known static column, use the label key
    if (PREVIEW_LABELS[baseKey]) {
      return PREVIEW_LABELS[baseKey];
    }

    // If it's an image set, try to find it in column slots to get the name
    // TODO(aufderheide): I'm not sure we want this or not.  As long as it's not showing the 
    // uuid prefix for the asset it might be okay.
    if (prop.startsWith('imageset_')) {
      const slot = this.columnSlots.find(s => s.key === prop);
      if (slot) return slot.label;
    }

    return prop;
  }

  getColumnLabel(columnKey: string): string {
    const centerProp = this.getAnchorValue(columnKey, AnchorPoint.CenterCenter);
    if (centerProp) {
      return this.getLabel(centerProp);
    }

    // Fallback to the slot label if center is truly empty
    const slot = this.columnSlotsMap.get(columnKey);
    return slot ? slot.label : columnKey;
  }

  getAnchorValue(slotKey: string, anchor: string): string | undefined {
    const layout = this.columnLayouts[slotKey];
    const val = layout ? layout[anchor as AnchorPoint] : undefined;
    if (val) return val;

    // Fallback: Default to CenterCenter showing the slot key if NO layout exists 
    // or if CenterCenter is specifically missing/empty
    if (anchor === AnchorPoint.CenterCenter) {
      return slotKey;
    }
    return undefined;
  }

  isOptional(columnKey: string): boolean {
    const visibility = this.columnVisibility[columnKey];
    return visibility !== undefined && visibility !== ColumnVisibility.Always;
  }
}
