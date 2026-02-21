import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { AnchorPoint } from '../../raceday/column_definition';

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
  'driver.nickname': 'RD_COL_NICKNAME'
};

@Component({
  selector: 'app-column-preview',
  templateUrl: './column-preview.component.html',
  styleUrls: ['./column-preview.component.css'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
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
    return PREVIEW_LABELS[baseKey] || prop;
  }

  getColumnLabel(columnKey: string): string {
    const layout = this.columnLayouts[columnKey];
    if (layout) {
      const centerProp = layout[AnchorPoint.CenterCenter];
      if (centerProp) {
        return this.getLabel(centerProp);
      }
    }

    // Fallback to the slot label if center is empty
    const slot = this.columnSlotsMap.get(columnKey);
    return slot ? slot.label : columnKey;
  }
}
