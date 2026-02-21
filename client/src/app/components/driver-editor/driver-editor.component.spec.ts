
import { ComponentFixture, TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { DriverEditorComponent } from './driver-editor.component';
import { DataService } from 'src/app/data.service';
import { TranslationService } from 'src/app/services/translation.service';
import { ConnectionMonitorService } from '../../services/connection-monitor.service';
import { Router, ActivatedRoute } from '@angular/router';
import { of, BehaviorSubject, throwError } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Driver } from 'src/app/models/driver';

// Mock Child Components
@Component({ selector: 'app-back-button', template: '', standalone: false })
class MockBackButtonComponent {
  @Input() route: string | null = null;
  @Input() queryParams: any = {};
  @Input() label: string = '';
  @Input() confirm: boolean = false;
  @Input() confirmTitle: string = '';
  @Input() confirmMessage: string = '';
}

@Component({ selector: 'app-audio-selector', template: '', standalone: false })
class MockAudioSelectorComponent {
  @Input() label: string = '';
  @Input() type: any;
  @Output() typeChange = new EventEmitter<any>();
  @Input() url: any;
  @Output() urlChange = new EventEmitter<any>();
  @Input() text: any;
  @Output() textChange = new EventEmitter<any>();
  @Input() assets: any[] = [];
  @Input() backButtonRoute: string | null = null;
  @Input() backButtonQueryParams: any = {};
}

@Component({ selector: 'app-image-selector', template: '', standalone: false })
class MockImageSelectorComponent {
  @Input() label?: string;
  @Input() imageUrl?: string;
  @Input() assets: any[] = [];
  @Output() imageUrlChange = new EventEmitter<string>();
  @Output() uploadStarted = new EventEmitter<void>();
  @Output() uploadFinished = new EventEmitter<void>();
}

@Component({ selector: 'app-item-selector', template: '', standalone: false })
class MockItemSelectorComponent {
  @Input() items: any[] = [];
  @Input() visible: boolean = false;
  @Output() select = new EventEmitter<any>();
  @Output() close = new EventEmitter<void>();
  @Input() itemType: string = 'image';
  @Input() backButtonRoute: string | null = null;
  @Input() backButtonQueryParams: any = {};
  @Input() title: string = '';
}

@Component({ selector: 'app-undo-redo-controls', template: '', standalone: false })
class MockUndoRedoControlsComponent {
  @Input() manager: any;
}

import { Pipe, PipeTransform } from '@angular/core';
@Pipe({ name: 'translate', standalone: false })
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string { return value; }
}

@Pipe({ name: 'avatarUrl', standalone: false })
class MockAvatarUrlPipe implements PipeTransform {
  transform(value: string): string { return value; }
}

describe('DriverEditorComponent', () => {
  let component: DriverEditorComponent;
  let fixture: ComponentFixture<DriverEditorComponent>;
  let mockDataService: any;
  let mockTranslationService: any;
  let mockConnectionMonitor: any;
  let mockRouter: any;
  let mockActivatedRoute: any;

  beforeEach(async () => {
    mockDataService = jasmine.createSpyObj('DataService', ['getDrivers', 'listAssets', 'createDriver', 'updateDriver', 'deleteDriver', 'uploadAsset']);
    mockTranslationService = jasmine.createSpyObj('TranslationService', ['translate']);
    mockConnectionMonitor = {
      connectionState$: new BehaviorSubject('CONNECTED'),
      startMonitoring: jasmine.createSpy('startMonitoring')
    };
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockActivatedRoute = {
      snapshot: {
        queryParamMap: {
          get: jasmine.createSpy('get').and.returnValue('new')
        }
      }
    };

    // Default mock returns
    mockDataService.getDrivers.and.returnValue(of([]));
    mockDataService.listAssets.and.returnValue(of([]));
    mockTranslationService.translate.and.callFake((key: string) => key);

    await TestBed.configureTestingModule({
      declarations: [
        DriverEditorComponent,
        MockBackButtonComponent,
        MockAudioSelectorComponent,
        MockItemSelectorComponent,
        MockUndoRedoControlsComponent,
        MockImageSelectorComponent,
        MockTranslatePipe,
        MockAvatarUrlPipe
      ],
      imports: [FormsModule],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: ConnectionMonitorService, useValue: mockConnectionMonitor },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DriverEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // Helper to setup driver state for change tracking and undo/redo
  function setupDriver(driver: Driver) {
    component.selectDriver(driver);
    component.allDrivers = [driver];
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should throw error when no ID provided', () => {
    mockActivatedRoute.snapshot.queryParamMap.get.and.returnValue(null);
    expect(() => component.loadData()).toThrowError('Driver Editor: No entity ID provided.');
  });

  it('should initialize with new driver when "new" ID provided', () => {
    mockActivatedRoute.snapshot.queryParamMap.get.and.returnValue('new');
    component.loadData();
    expect(component.editingDriver).toBeDefined();
    expect(component.editingDriver?.entity_id).toBe('new');
    // element implicitly has 'any' type error on private access, so skipping explicit initialState check if not needed
    // verify hasChanges is false
    expect(component.hasChanges()).toBeFalse();
  });

  it('should load driver when valid ID is provided', () => {
    const mockDriver = { entity_id: 'd1', name: 'Test Driver', nickname: 'TD' };
    mockDataService.getDrivers.and.returnValue(of([mockDriver]));
    mockActivatedRoute.snapshot.queryParamMap.get.and.returnValue('d1');

    component.loadData();

    expect(component.editingDriver?.entity_id).toBe('d1');
    expect(component.editingDriver?.name).toBe('Test Driver');
    expect(component.hasChanges()).toBeFalse();
  });

  it('should save new driver', () => {
    const newDriver = { entity_id: 'new_id', name: 'New Driver' };
    const initial = new Driver('new', 'New Driver', '');
    setupDriver(initial);

    // Simulate change
    component.editingDriver!.name = 'New Driver Name';

    mockDataService.createDriver.and.returnValue(of(newDriver));

    component.updateDriver();

    expect(mockDataService.createDriver).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/driver-editor'], { queryParams: { id: 'new_id' } });
  });

  it('should stay on page and keep original ID when save as new fails', () => {
    const driver = new Driver('d1', 'Original', 'Orig');
    setupDriver(driver);

    mockDataService.createDriver.and.returnValue(throwError(() => ({ status: 409, error: 'Conflict' })));
    spyOn(window, 'alert');

    component.saveAsNew();

    expect(mockDataService.createDriver).toHaveBeenCalled();
    expect(component.editingDriver?.entity_id).toBe('d1');
    expect(component.isSaving).toBeFalse();
    expect(window.alert).toHaveBeenCalled();
  });

  it('should update existing driver', () => {
    const driver = new Driver('d1', 'Updated Driver', '');
    setupDriver(driver);

    // Make a change
    component.editingDriver!.name = 'Changed Name';

    mockDataService.updateDriver.and.returnValue(of({}));

    component.updateDriver();

    expect(mockDataService.updateDriver).toHaveBeenCalledWith('d1', jasmine.any(Object));
  });

  it('should delete driver and navigate back', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    const driver = new Driver('d1', 'Driver to Delete', '');
    setupDriver(driver);

    mockDataService.deleteDriver.and.returnValue(of({}));

    component.deleteDriver();

    expect(mockDataService.deleteDriver).toHaveBeenCalledWith('d1');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/driver-manager']);
  });

  it('should not delete if confirm is cancelled', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    const driver = new Driver('d1', '', '');
    setupDriver(driver);

    component.deleteDriver();

    expect(mockDataService.deleteDriver).not.toHaveBeenCalled();
  });

  // Undo/Redo Tests
  it('should track changes and support undo/redo', () => {
    const initial = new Driver('d1', 'Start', '');
    setupDriver(initial);

    // 1. Capture state (simulating focus/before change)
    component.onInputFocus();

    // 2. Make change
    component.editingDriver!.name = 'Change 1';

    // 3. Blur (simulating commit)
    component.onInputBlur();
    // undoStack should have 'Start'
    expect(component.undoManager.undoStackItems.length).toBe(1);
    expect(component.undoManager.undoStackItems[0].name).toBe('Start');

    // 4. Undo
    component.undo();
    expect(component.editingDriver!.name).toBe('Start');
    expect(component.undoManager.redoStackItems.length).toBe(1);
    expect(component.undoManager.redoStackItems[0].name).toBe('Change 1');

    // 5. Redo
    component.redo();
    expect(component.editingDriver!.name).toBe('Change 1');
    expect(component.undoManager.undoStackItems.length).toBe(1);
  });

  it('should validate uniqueness', () => {
    const driver = new Driver('d1', 'MyName', 'MyNick');
    setupDriver(driver);

    component.allDrivers = [
      new Driver('d1', 'MyName', 'MyNick'),
      new Driver('d2', 'ExistingName', 'ExistingNick')
    ];

    // Valid
    expect(component.isNameUnique()).toBeTrue();

    // Duplicate Name
    component.editingDriver!.name = 'ExistingName';
    expect(component.isNameUnique()).toBeFalse();

    // Duplicate Nickname
    component.editingDriver!.name = 'MyName'; // Reset name
    component.editingDriver!.nickname = 'ExistingNick';
    expect(component.isNicknameUnique()).toBeFalse();

    // Self is not duplicate
    component.editingDriver!.nickname = 'MyNick';
    expect(component.isNicknameUnique()).toBeTrue();
  });
  it('should preserve undo stack after save', () => {
    const driver = new Driver('d1', 'Start', '');
    setupDriver(driver);

    // Make change and push to stack
    component.editingDriver!.name = 'Changed';
    component.captureState(); // Capture AFTER change

    mockDataService.updateDriver.and.returnValue(of({ entity_id: 'd1' }));

    // Save
    component.updateDriver();

    // Verify stack is preserved
    expect(component.undoManager.undoStackItems.length).toBe(1);
    expect(component.undoManager.undoStackItems[0].name).toBe('Start');

    // Verify hasChanges matches DB (Clean)
    expect(component.hasChanges()).toBeFalse();

    // Undo
    component.undo();

    // Verify dirty after undo (because it differs from saved 'Changed' state)
    // Note: After save, resetTracking was called. Current state = Saved 'Changed'.
    // Initial State = Saved 'Changed'.
    // Stack has 'Start'.
    // Undo -> Editing Driver = 'Start'.
    // 'Start' != 'Changed' (Initial). So hasChanges() -> TRUE.
    expect(component.editingDriver!.name).toBe('Start');
    expect(component.hasChanges()).toBeTrue();
  });

  it('should preserve entity_id on undo (context safety)', () => {
    const driver = new Driver('d1', 'Start', '');
    setupDriver(driver);

    // Simulate "Save as New" causing ID change to 'd2'
    component.editingDriver!.entity_id = 'd2';
    component.editingDriver!.name = 'New Name';

    // Snapshot was 'd1', current is now 'd2'. Capture commits 'd1'.
    component.captureState();

    // Undo
    component.undo();

    // Name should revert to 'Start'
    expect(component.editingDriver!.name).toBe('Start');

    // ID should STAY 'd2' (current context)
    expect(component.editingDriver!.entity_id).toBe('d2');
  });
  it('should debounce text input changes for undo history', fakeAsync(() => {
    const driver = new Driver('d1', 'Start', '');
    setupDriver(driver);

    // Simulate focus
    component.onInputFocus();

    // Type "A"
    component.editingDriver!.name = 'A';
    component.onInputChange(); // Trigger debounce subject

    // Should NOT have saved yet (debounce 500ms)
    tick(200);
    expect(component.undoManager.undoStackItems.length).toBe(0);

    // Type "AB" before debounce hits
    component.editingDriver!.name = 'AB';
    component.onInputChange(); // Reset debounce timer

    tick(200);
    expect(component.undoManager.undoStackItems.length).toBe(0);

    // Wait for full debounce (total > 500ms from last input)
    tick(500);

    // Should now have saved the SNAPSHOT state ('Start')
    expect(component.undoManager.undoStackItems.length).toBe(1);
    expect(component.undoManager.undoStackItems[0].name).toBe('Start');

    // Snapshot should now be 'AB'
    // Accessing private _snapshot on UndoManager via bracket notation if needed, but checking behavior is safer
    // Trigger another change to see if it captures 'AB'
    component.editingDriver!.name = 'ABC';
    component.onInputChange();
    tick(500);
    // Stack should now have 'AB'
    expect(component.undoManager.undoStackItems[1].name).toBe('AB');

    // Undo should go to 'AB'
    component.undo();
    expect(component.editingDriver!.name).toBe('AB');

    component.undo();
    expect(component.editingDriver!.name).toBe('Start');

    discardPeriodicTasks();
  }));
});

