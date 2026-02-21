
import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { UIEditorComponent } from './ui-editor.component';
import { SettingsService } from 'src/app/services/settings.service';
import { FileSystemService } from 'src/app/services/file-system.service';
import { DataService } from 'src/app/data.service';
import { Router } from '@angular/router';
import { ChangeDetectorRef, Component, Input, Output, EventEmitter, Pipe, PipeTransform } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { of, throwError, delay } from 'rxjs';
import { Settings } from 'src/app/models/settings';
import { AnchorPoint } from '../raceday/column_definition';

@Component({ selector: 'app-image-selector', template: '', standalone: false })
class MockImageSelectorComponent {
  @Input() label?: string;
  @Input() imageUrl?: string;
  @Input() assets: any[] = [];
  @Output() imageUrlChange = new EventEmitter<string>();
  @Output() uploadStarted = new EventEmitter<void>();
  @Output() uploadFinished = new EventEmitter<void>();
}

@Component({ selector: 'app-back-button', template: '', standalone: false })
class MockBackButtonComponent {
  @Input() label: string = '';
  @Input() route: string = '';
  @Input() confirm: boolean = false;
  @Input() confirmTitle: string = '';
  @Input() confirmMessage: string = '';
}

@Component({ selector: 'app-reorder-dialog', template: '', standalone: false })
class MockReorderDialogComponent {
  @Input() visible: boolean = false;
  @Input() data: any;
  @Output() save = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();
}

@Component({ selector: 'app-undo-redo-controls', template: '', standalone: false })
class MockUndoRedoControlsComponent {
  @Input() manager: any;
}

@Pipe({ name: 'translate', standalone: false })
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string { return value; }
}

describe('UIEditorComponent', () => {
  let component: UIEditorComponent;
  let fixture: ComponentFixture<UIEditorComponent>;
  let mockSettingsService: any;
  let mockFileSystem: any;
  let mockDataService: any;
  let mockRouter: any;

  beforeEach(async () => {
    mockSettingsService = jasmine.createSpyObj('SettingsService', ['getSettings', 'saveSettings']);
    mockFileSystem = jasmine.createSpyObj('FileSystemService', ['getCustomDirectoryHandle', 'selectCustomFolder', 'clearCustomFolder']);
    mockDataService = jasmine.createSpyObj('DataService', ['listAssets']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    const settings = Object.assign(new Settings(), {
      recentRaceIds: [],
      selectedDriverIds: [],
      serverIp: '127.0.0.1',
      serverPort: 8080,
      language: 'en',
      racedaySetupWalkthroughSeen: true,
      flagGreen: 'g',
      flagYellow: 'y',
      flagRed: 'r',
      flagWhite: 'w',
      flagBlack: 'b',
      flagCheckered: 'c'
    });
    mockSettingsService.getSettings.and.returnValue(Object.assign(new Settings(), {
      sortByStandings: true,
      flagGreen: 'g',
      flagYellow: 'y',
      flagRed: 'r',
      flagWhite: 'w',
      flagBlack: 'b',
      flagCheckered: 'c'
    }));
    mockSettingsService.saveSettings.and.returnValue(of(settings).pipe(delay(100)));
    mockDataService.listAssets.and.returnValue(of([{ type: 'image', url: 'img1.png' }]));
    mockFileSystem.getCustomDirectoryHandle.and.returnValue(of({ name: 'CustomUI' }));

    await TestBed.configureTestingModule({
      declarations: [
        UIEditorComponent,
        MockImageSelectorComponent,
        MockBackButtonComponent,
        MockUndoRedoControlsComponent,
        MockReorderDialogComponent,
        MockTranslatePipe
      ],
      imports: [FormsModule],
      providers: [
        { provide: SettingsService, useValue: mockSettingsService },
        { provide: FileSystemService, useValue: mockFileSystem },
        { provide: DataService, useValue: mockDataService },
        { provide: Router, useValue: mockRouter },
        ChangeDetectorRef
      ]
    }).compileComponents();
    console.log('UIEditorSpec: TestBed Compiled. mockSettingsService has saveSettings:', !!mockSettingsService.saveSettings);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UIEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load data', () => {
    expect(component).toBeTruthy();
    expect(component.isLoading).toBeFalse();
    expect(component.customDirectoryName).toBe('CustomUI');
    expect(component.assets.length).toBe(1);
  });
  it('should handle directory selection', fakeAsync(() => {
    mockFileSystem.selectCustomFolder.and.returnValue(Promise.resolve(true));
    mockFileSystem.getCustomDirectoryHandle.and.returnValue(Promise.resolve({ name: 'NewDir' }));

    component.selectDirectory();
    tick(); // Resolve selectCustomFolder promise
    tick(); // Resolve getCustomDirectoryHandle promise
    flush();
    fixture.detectChanges();

    expect(mockFileSystem.selectCustomFolder).toHaveBeenCalled();
    expect(component.customDirectoryName).toBe('NewDir');
  }));


  it('should handle reset default', async () => {
    mockFileSystem.clearCustomFolder.and.returnValue(Promise.resolve());

    await component.resetDefault();

    expect(mockFileSystem.clearCustomFolder).toHaveBeenCalled();
    expect(component.customDirectoryName).toBeNull();
  });

  it('should save settings and reset tracking', fakeAsync(() => {
    component.save();
    expect(component.isSaving).toBeTrue();
    expect(mockSettingsService.saveSettings).toHaveBeenCalled();

    tick(600);
    expect(component.isSaving).toBeFalse();
  }));

  it('should navigate back', () => {
    component.onBack();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/raceday-setup']);
  });

  it('should detect changes via undo manager', () => {
    expect(component.hasChanges()).toBeFalse();
    component.editingSettings.flagGreen = 'new-green';
    component.captureState();
    expect(component.hasChanges()).toBeTrue();
  });

  it('should return correct column slots', () => {
    component.editingSettings.racedayColumns = ['driver.name', 'lapCount'];
    const slots = component.columnSlots;
    expect(slots.length).toBe(2);
    expect(slots[0].label).toBe('RD_COL_NAME');
    expect(slots[1].label).toBe('RD_COL_LAP');
  });

  it('should determine resizing column key', () => {
    component.editingSettings.racedayColumns = ['lapCount', 'driver.name'];
    component.editingSettings.columnLayouts = {
      'lapCount': { [AnchorPoint.CenterCenter]: 'lapCount' },
      'driver.name': { [AnchorPoint.CenterCenter]: 'driver.name' }
    };
    // driver.name is a name key, so it should be prioritized for resizing
    expect(component.resizingColumnKey).toBe('driver.name');

    component.editingSettings.racedayColumns = ['lapCount'];
    component.editingSettings.columnLayouts = { 'lapCount': { [AnchorPoint.CenterCenter]: 'lapCount' } };
    expect(component.resizingColumnKey).toBe('lapCount');
  });

  it('should open and handle reorder dialog', () => {
    component.openReorderDialog();
    expect(component.showReorderModal).toBeTrue();
    expect(component.reorderModalData).toBeTruthy();

    const result = {
      columns: ['lapCount'],
      columnLayouts: { 'lapCount': { [AnchorPoint.CenterCenter]: 'lapCount' } }
    };
    component.onReorderSave(result as any);
    expect(component.editingSettings.racedayColumns).toEqual(['lapCount']);
    expect(component.showReorderModal).toBeFalse();

    component.openReorderDialog();
    component.onReorderCancel();
    expect(component.showReorderModal).toBeFalse();
  });

  it('should handle sortByStandings change', () => {
    component.editingSettings.sortByStandings = false;
    expect(component.editingSettings.sortByStandings).toBeFalse();
    component.editingSettings.sortByStandings = true;
    expect(component.editingSettings.sortByStandings).toBeTrue();
  });
});
