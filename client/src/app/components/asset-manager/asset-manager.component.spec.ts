import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AssetManagerComponent } from './asset-manager.component';
import { FormsModule } from '@angular/forms';
import { DataService } from 'src/app/data.service';
import { TranslationService } from 'src/app/services/translation.service';
import { Router } from '@angular/router';
import { Pipe, PipeTransform } from '@angular/core';
import { mockDataService, mockTranslationService, mockRouter } from 'src/app/testing/unit-test-mocks';
import { ConnectionMonitorService, ConnectionState } from 'src/app/services/connection-monitor.service';
import { BehaviorSubject, of } from 'rxjs';

@Pipe({
  name: 'translate',
  standalone: false
})
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

describe('AssetManagerComponent', () => {
  let component: AssetManagerComponent;
  let fixture: ComponentFixture<AssetManagerComponent>;
  let mockConnectionMonitor: jasmine.SpyObj<ConnectionMonitorService>;
  let connectionStateSubject: BehaviorSubject<ConnectionState>;

  beforeEach(async () => {
    // Reset mock calls before each test to ensure isolation
    mockDataService.listAssets.calls.reset();
    mockDataService.deleteAsset.calls.reset();
    mockDataService.renameAsset.calls.reset();
    mockDataService.getDrivers.calls.reset();
    mockDataService.uploadAsset.calls.reset();
    mockDataService.getCurrentDatabase.calls.reset();
    mockTranslationService.translate.calls.reset();
    mockRouter.navigate.calls.reset();

    connectionStateSubject = new BehaviorSubject<ConnectionState>(ConnectionState.CONNECTED);
    mockConnectionMonitor = jasmine.createSpyObj('ConnectionMonitorService', ['startMonitoring', 'stopMonitoring', 'checkConnection']);
    Object.defineProperty(mockConnectionMonitor, 'connectionState$', { get: () => connectionStateSubject.asObservable() });
    mockConnectionMonitor.checkConnection.and.returnValue(of(true));

    await TestBed.configureTestingModule({
      declarations: [AssetManagerComponent, MockTranslatePipe],
      imports: [FormsModule],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: Router, useValue: mockRouter },
        { provide: ConnectionMonitorService, useValue: mockConnectionMonitor }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AssetManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should filter assets by type', () => {
    component.assets = [
      { id: '1', name: 'Img1', type: 'image', size: '100 B', url: '', editMode: false },
      { id: '2', name: 'Snd1', type: 'sound', size: '100 B', url: '', editMode: false }
    ];

    component.setFilterType('image');
    expect(component.filterType).toBe('image');
    expect(component.filteredAssets.length).toBe(1);
    expect(component.filteredAssets[0].type).toBe('image');

    component.setFilterType('sound');
    expect(component.filterType).toBe('sound');
    expect(component.filteredAssets.length).toBe(1);
    expect(component.filteredAssets[0].type).toBe('sound');
  });

  it('should filter assets by name', () => {
    component.assets = [
      { id: '1', name: 'RaceTrack', type: 'image', size: '100 B', url: '', editMode: false },
      { id: '2', name: 'CarSound', type: 'sound', size: '100 B', url: '', editMode: false }
    ];

    component.filterName = 'Race';
    expect(component.filteredAssets.length).toBe(1);
    expect(component.filteredAssets[0].name).toBe('RaceTrack');
  });

  it('should delete an asset', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    component.assets = [
      { id: '1', name: 'ToDelete', type: 'image', size: '100 B', url: '', editMode: false }
    ];

    component.onDelete('1');

    expect(mockDataService.deleteAsset).toHaveBeenCalledWith('1');
    expect(mockDataService.listAssets).toHaveBeenCalled();
  });

  it('should rename an asset', () => {
    component.assets = [
      { id: '1', name: 'OldName', type: 'image', size: '100 B', url: '', editMode: false }
    ];
    const asset = component.assets[0];

    // Start editing
    component.startEditing('1');
    expect(asset.editMode).toBeTrue();

    // Save
    const newName = 'NewName';
    component.saveName('1', newName);

    expect(mockDataService.renameAsset).toHaveBeenCalledWith('1', newName);
    // Note: In real component, listAssets() is called on success which refreshes the list
    // verification of name change depends on mock behavior or manual update in component
    // current component implementation calls loadAssets() on success.
    expect(mockDataService.listAssets).toHaveBeenCalled();
  });
});
