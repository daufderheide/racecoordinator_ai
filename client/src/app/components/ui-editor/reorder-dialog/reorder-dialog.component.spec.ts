// Force refresh for unit tests
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReorderDialogComponent, ReorderDialogData } from './reorder-dialog.component';
import { TranslationService } from '../../../services/translation.service';
import { ChangeDetectorRef, Pipe, PipeTransform, Component, Input } from '@angular/core';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { AnchorPoint } from '../../raceday/column_definition';
import { ColumnVisibility, Settings } from '../../../models/settings';
import { of } from 'rxjs';

@Pipe({ name: 'translate', standalone: false })
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string { return value; }
}

@Component({ selector: 'app-column-preview', template: '', standalone: false })
class MockColumnPreviewComponent {
  @Input() columnSlots: any[] = [];
  @Input() columnLayouts: any = {};
}

describe('ReorderDialogComponent', () => {
  let component: ReorderDialogComponent;
  let fixture: ComponentFixture<ReorderDialogComponent>;
  let mockTranslationService: jasmine.SpyObj<TranslationService>;

  const mockData: ReorderDialogData = {
    availableValues: [
      { key: 'lapCount', label: 'RD_COL_LAP' },
      { key: 'driver.name', label: 'RD_COL_NAME' },
    ],
    columnSlots: [
      { key: 'slot1', label: 'RD_COL_NAME' }
    ],
    columnLayouts: {
      'slot1': { [AnchorPoint.CenterCenter]: 'driver.name' }
    },
    columnVisibility: {
      'slot1': ColumnVisibility.Always
    }
  };

  beforeEach(async () => {
    mockTranslationService = jasmine.createSpyObj('TranslationService', ['translate']);
    mockTranslationService.translate.and.callFake((key) => key);

    await TestBed.configureTestingModule({
      declarations: [ReorderDialogComponent, MockTranslatePipe, MockColumnPreviewComponent],
      imports: [DragDropModule],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService },
        ChangeDetectorRef
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ReorderDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize data and alphabetize available values', () => {
    component.data = mockData;
    expect(component.availableValues.length).toBe(2);
    // driver.name (RD_COL_NAME) should come after lapCount (RD_COL_LAP) because R comes after L? No, RD_COL_LAP comes before RD_COL_NAME.
    // Wait, "RD_COL_LAP" vs "RD_COL_NAME". alphabetically "L" comes before "N".
    expect(component.availableValues[0].key).toBe('lapCount');
    expect(component.availableValues[1].key).toBe('driver.name');

    // Test reverse to be sure
    component.data = {
      ...mockData,
      availableValues: [
        { key: 'z', label: 'Z' },
        { key: 'a', label: 'A' }
      ]
    };
    expect(component.availableValues[0].key).toBe('a');
    expect(component.availableValues[1].key).toBe('z');
  });

  it('should handle drop column (reorder)', () => {
    component.data = {
      ...mockData,
      columnSlots: [
        { key: 's1', label: 'L1' },
        { key: 's2', label: 'L2' }
      ]
    };
    const event = {
      previousIndex: 0,
      currentIndex: 1
    } as CdkDragDrop<string[]>;

    component.dropColumn(event);
    expect(component.columnSlots[0].key).toBe('s2');
    expect(component.columnSlots[1].key).toBe('s1');
  });

  it('should handle value drop on anchor', () => {
    component.data = mockData;
    component.onValueDrop('slot1', AnchorPoint.TopLeft, 'lapCount');
    expect(component.columnLayouts['slot1']![AnchorPoint.TopLeft]).toBe('lapCount');
  });

  it('should clear anchor', () => {
    component.data = mockData;
    component.onValueDrop('slot1', AnchorPoint.TopLeft, 'lapCount');
    expect(component.columnLayouts['slot1']![AnchorPoint.TopLeft]).toBe('lapCount');

    component.clearAnchor('slot1', AnchorPoint.TopLeft);
    expect(component.columnLayouts['slot1']![AnchorPoint.TopLeft]).toBeUndefined();
  });

  it('should remove column', () => {
    component.data = mockData;
    expect(component.columnSlots.length).toBe(1);
    component.removeColumn('slot1');
    expect(component.columnSlots.length).toBe(0);
    expect(component.columnLayouts['slot1']).toBeUndefined();
  });

  it('should handle add column drop', () => {
    component.data = mockData;
    const event = {
      item: { data: 'lapCount' }
    } as CdkDragDrop<any>;

    component.onAddColumnDrop(event);
    expect(component.columnSlots.length).toBe(2);
    expect(component.columnSlots[1].key).toBe('lapCount'); // Since slot1 exists
    expect(component.columnLayouts['lapCount']).toEqual({ [AnchorPoint.CenterCenter]: 'lapCount' });
  });

  it('should handle add column drop with duplicate keys', () => {
    component.data = {
      ...mockData,
      columnSlots: [{ key: 'lapCount', label: 'L' }]
    };
    const event = {
      item: { data: 'lapCount' }
    } as CdkDragDrop<any>;

    component.onAddColumnDrop(event);
    expect(component.columnSlots.length).toBe(2);
    expect(component.columnSlots[1].key).toBe('lapCount_1');
    expect(component.columnVisibility['lapCount_1']).toBe(ColumnVisibility.Always);
  });

  it('should emit save on onSave', () => {
    spyOn(component.save, 'emit');
    component.data = mockData;
    component.onSave();
    expect(component.save.emit).toHaveBeenCalledWith({
      columns: ['slot1'],
      columnLayouts: mockData.columnLayouts,
      columnVisibility: mockData.columnVisibility
    });
  });

  it('should initialize visibility if missing', () => {
    component.data = {
      ...mockData,
      columnVisibility: {}
    };
    expect(component.columnVisibility['slot1']).toBe(ColumnVisibility.Always);
  });

  it('should handle visibility changes', () => {
    component.data = mockData;
    component.columnVisibility['slot1'] = ColumnVisibility.FuelRaceOnly;
    // Template would handle this via ngModel, but we check the state
    expect(component.columnVisibility['slot1']).toBe(ColumnVisibility.FuelRaceOnly);
  });

  it('should handle remove column and delete its visibility', () => {
    component.data = mockData;
    expect(component.columnVisibility['slot1']).toBeDefined();
    component.removeColumn('slot1');
    expect(component.columnVisibility['slot1']).toBeUndefined();
  });

  it('should emit cancel on onCancel', () => {
    spyOn(component.cancel, 'emit');
    component.onCancel();
    expect(component.cancel.emit).toHaveBeenCalled();
  });

  it('should reset to defaults when onReset is called', () => {
    // 1. Initialize with some non-default data
    component.data = {
      availableValues: [
        { key: 'lapCount', label: 'L' },
        { key: 'driver.nickname', label: 'N' },
        { key: 'lastLapTime', label: 'T' },
        { key: 'gapLeader', label: 'G' },
        { key: 'imageset_fuel-gauge-builtin', label: 'F' }
      ],
      columnSlots: [{ key: 'custom_slot', label: 'Custom' }],
      columnLayouts: { 'custom_slot': { [AnchorPoint.TopLeft]: 'lapCount' } },
      columnVisibility: { 'custom_slot': ColumnVisibility.NonFuelRaceOnly }
    };

    expect(component.columnSlots.length).toBe(1);
    expect(component.columnSlots[0].key).toBe('custom_slot');

    // 2. Call reset
    component.onReset();

    // 3. Verify it matches DEFAULT_COLUMNS and Settings defaults
    expect(component.columnSlots.length).toBe(Settings.DEFAULT_COLUMNS.length);
    expect(component.columnSlots[0].key).toBe('driver.nickname');
    expect(component.columnSlots[1].key).toBe('imageset_fuel-gauge-builtin');
    expect(component.columnSlots[2].key).toBe('lapCount');

    // Verify layout reset (from new Settings())
    expect(component.columnLayouts['driver.nickname']).toEqual({
      [AnchorPoint.CenterCenter]: 'driver.nickname',
      [AnchorPoint.BottomCenter]: 'participant.team.name'
    });
    expect(component.columnLayouts['custom_slot']).toBeUndefined();

    // Verify visibility reset
    expect(component.columnVisibility['imageset_fuel-gauge-builtin']).toBe(ColumnVisibility.FuelRaceOnly);
    expect(component.columnVisibility['custom_slot']).toBeUndefined();
  });
});
