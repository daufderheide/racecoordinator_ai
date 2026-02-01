
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
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

@Component({ selector: 'app-item-selector', template: '', standalone: false })
class MockItemSelectorComponent {
  @Input() items: any[] = [];
  @Input() visible: boolean = false;
  @Output() select = new EventEmitter<any>();
  @Output() close = new EventEmitter<void>();
  @Input() itemType: string = 'image';
  @Input() backButtonRoute: string | null = null;
  @Input() backButtonQueryParams: any = {};
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

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should throw error when no ID provided', () => {
    mockActivatedRoute.snapshot.queryParamMap.get.and.returnValue(null);
    expect(() => component.loadData()).toThrowError('Driver Editor: No entity ID provided.');
  });

  it('should throw error inside loadDataInternal when invalid ID provided', () => {
    mockActivatedRoute.snapshot.queryParamMap.get.and.returnValue('unknown');
    const rawDrivers = [{ entity_id: 'd1' }];
    expect(() => (component as any).loadDataInternal(rawDrivers, [])).toThrowError('Driver Editor: Invalid entity ID "unknown".');
  });

  it('should initialize with new driver when "new" ID provided', () => {
    mockActivatedRoute.snapshot.queryParamMap.get.and.returnValue('new');
    component.loadData();
    expect(component.editingDriver).toBeDefined();
    expect(component.editingDriver?.entity_id).toBe('new');
    expect(component.selectedDriver).toBeUndefined();
  });

  it('should load driver when valid ID is provided', () => {
    const mockDriver = { entity_id: 'd1', name: 'Test Driver' };
    mockDataService.getDrivers.and.returnValue(of([mockDriver]));
    mockActivatedRoute.snapshot.queryParamMap.get.and.returnValue('d1');

    component.loadData();

    expect(component.editingDriver?.entity_id).toBe('d1');
    expect(component.editingDriver?.name).toBe('Test Driver');
  });

  it('should save new driver', () => {
    const newDriver = { entity_id: 'new_id', name: 'New Driver' };
    component.editingDriver = new Driver('new', 'New Driver', '');
    mockDataService.createDriver.and.returnValue(of(newDriver));

    component.updateDriver();

    expect(mockDataService.createDriver).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/driver-editor'], { queryParams: { id: 'new_id' } });
  });

  it('should stay on page and keep original ID when save as new fails', () => {
    component.editingDriver = new Driver('d1', 'Original', 'Orig');
    mockDataService.createDriver.and.returnValue(throwError(() => ({ status: 409, error: 'Conflict' })));
    spyOn(window, 'alert');

    component.saveAsNew();

    expect(mockDataService.createDriver).toHaveBeenCalled();
    expect(component.editingDriver?.entity_id).toBe('d1');
    expect(component.isSaving).toBeFalse();
    expect(window.alert).toHaveBeenCalled();
  });

  it('should update existing driver', () => {
    component.editingDriver = new Driver('d1', 'Updated Driver', '');
    mockDataService.updateDriver.and.returnValue(of({}));

    component.updateDriver();

    expect(mockDataService.updateDriver).toHaveBeenCalledWith('d1', jasmine.any(Object));
  });

  it('should delete driver and navigate back', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    component.editingDriver = new Driver('d1', 'Driver to Delete', '');
    mockDataService.deleteDriver.and.returnValue(of({}));

    component.deleteDriver();

    expect(mockDataService.deleteDriver).toHaveBeenCalledWith('d1');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/driver-manager']);
  });

  it('should not delete if confirm is cancelled', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    component.editingDriver = new Driver('d1', '', '');

    component.deleteDriver();

    expect(mockDataService.deleteDriver).not.toHaveBeenCalled();
  });
});
