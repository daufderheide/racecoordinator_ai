import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DatabaseManagerComponent } from './database-manager.component';
import { DataService } from '../../data.service';
import { Router } from '@angular/router';
import { ChangeDetectorRef, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { TranslationService } from '../../services/translation.service';
import { mockTranslationService, mockRouter } from '../../testing/unit-test-mocks';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../pipes/translate.pipe';

describe('DatabaseManagerComponent', () => {
  let component: DatabaseManagerComponent;
  let fixture: ComponentFixture<DatabaseManagerComponent>;
  let mockDataService: jasmine.SpyObj<DataService>;

  const mockDatabases = [
    { name: 'db1', driverCount: 10, trackCount: 2, raceCount: 5, assetCount: 20, sizeBytes: 1024000 },
    { name: 'db2', driverCount: 5, trackCount: 1, raceCount: 0, assetCount: 5, sizeBytes: 512000 }
  ];

  const mockCurrentDatabase = { name: 'db1' };

  beforeEach(async () => {
    mockDataService = jasmine.createSpyObj('DataService', [
      'getDatabases',
      'getCurrentDatabase',
      'switchDatabase',
      'createDatabase',
      'copyDatabase',
      'resetDatabase',
      'deleteDatabase',
      'exportDatabase',
      'importDatabase'
    ]);

    mockDataService.getDatabases.and.returnValue(of(mockDatabases));
    mockDataService.getCurrentDatabase.and.returnValue(of(mockCurrentDatabase));
    mockDataService.switchDatabase.and.returnValue(of({ name: 'db2' }));
    mockDataService.createDatabase.and.returnValue(of({ name: 'newDB', driverCount: 0, trackCount: 0, raceCount: 0, assetCount: 0, sizeBytes: 0 }));
    mockDataService.copyDatabase.and.returnValue(of({ name: 'copyDB', driverCount: 10, trackCount: 2, raceCount: 5, assetCount: 20, sizeBytes: 1024000 }));
    mockDataService.resetDatabase.and.returnValue(of({ name: 'db1', driverCount: 0, trackCount: 0, raceCount: 0, assetCount: 0, sizeBytes: 0 }));
    mockDataService.deleteDatabase.and.returnValue(of(null));
    mockDataService.exportDatabase.and.stub();
    mockDataService.importDatabase.and.returnValue(of({ name: 'importedDB', driverCount: 1, trackCount: 1, raceCount: 1, assetCount: 1, sizeBytes: 100 }));

    // Reset router spy
    mockRouter.navigate.calls.reset();

    await TestBed.configureTestingModule({
      declarations: [DatabaseManagerComponent, TranslatePipe],
      imports: [FormsModule],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: Router, useValue: mockRouter },
        { provide: TranslationService, useValue: mockTranslationService },
        ChangeDetectorRef
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DatabaseManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load databases and current database on init', () => {
    expect(mockDataService.getDatabases).toHaveBeenCalled();
    expect(mockDataService.getCurrentDatabase).toHaveBeenCalled();
    expect(component.databases).toEqual(mockDatabases);
    expect(component.currentDatabaseName).toEqual('db1');
    expect(component.selectedDatabase).toEqual(mockDatabases[0]);
  });

  it('should handle error during initial load', () => {
    mockDataService.getDatabases.and.returnValue(throwError(() => new Error('Error')));
    component.initialLoad();
    expect(component.loading).toBeFalse();
    expect(component.showAckModal).toBeTrue();
    expect(component.ackModalMessage).toBe('DBM_ERR_LOAD_INFO');
  });

  it('should select a database', () => {
    component.selectDatabase(mockDatabases[1]);
    expect(component.selectedDatabase).toEqual(mockDatabases[1]);
  });

  describe('useDatabase', () => {
    it('should not switch if already on current database', () => {
      component.selectedDatabase = mockDatabases[0]; // db1 (current)
      component.useDatabase();
      expect(component.showConfirmModal).toBeFalse();
    });

    it('should open confirm modal if selecting different database', () => {
      component.selectedDatabase = mockDatabases[1]; // db2
      component.useDatabase();
      expect(component.showConfirmModal).toBeTrue();
      expect(component.confirmModalTitle).toBe('DBM_CONFIRM_SWITCH_TITLE');
    });

    it('should call switchDatabase when confirmed', () => {
      component.selectedDatabase = mockDatabases[1];
      component.useDatabase();
      component.onConfirm();

      expect(mockDataService.switchDatabase).toHaveBeenCalledWith('db2');
      expect(component.currentDatabaseName).toBe('db2');
    });

    it('should handle error during switch', () => {
      mockDataService.switchDatabase.and.returnValue(throwError(() => new Error('Error')));
      component.selectedDatabase = mockDatabases[1];
      component.useDatabase();
      component.onConfirm();

      expect(component.loading).toBeFalse();
      expect(component.showAckModal).toBeTrue();
      expect(component.ackModalMessage).toBe('DBM_ERR_SWITCH');
    });
  });

  describe('createDatabase', () => {
    it('should open input modal', () => {
      component.createDatabase();
      expect(component.showInputModal).toBeTrue();
      expect(component.inputModalTitle).toBe('DBM_PROMPT_CREATE_TITLE');
    });

    it('should call createDatabase when input confirmed', () => {
      component.createDatabase();
      component.inputValue = 'newDB';
      component.onInputConfirm();

      expect(mockDataService.createDatabase).toHaveBeenCalledWith('newDB');
      expect(component.currentDatabaseName).toBe('newDB');
      expect(component.selectedDatabase.name).toBe('newDB');
    });

    it('should handle conflict error (409)', () => {
      mockDataService.createDatabase.and.returnValue(throwError(() => ({ status: 409 })));
      component.createDatabase();
      component.inputValue = 'existingDB';
      component.onInputConfirm();

      expect(component.loading).toBeFalse();
      expect(component.showAckModal).toBeTrue();
      expect(component.ackModalMessage).toBe('DBM_ERR_EXISTS');
    });

    it('should handle general error', () => {
      mockDataService.createDatabase.and.returnValue(throwError(() => new Error('Error')));
      component.createDatabase();
      component.inputValue = 'newDB';
      component.onInputConfirm();

      expect(component.loading).toBeFalse();
      expect(component.showAckModal).toBeTrue();
      expect(component.ackModalMessage).toBe('DBM_ERR_CREATE');
    });
  });

  describe('copyDatabase', () => {
    it('should return if no database selected', () => {
      component.selectedDatabase = null;
      component.copyDatabase();
      expect(component.showInputModal).toBeFalse();
    });

    it('should show error if copying inactive database', () => {
      component.selectedDatabase = mockDatabases[1]; // inactive
      component.copyDatabase();
      expect(component.showAckModal).toBeTrue();
      expect(component.ackModalMessage).toBe('DBM_ERR_COPY_INACTIVE');
    });

    it('should open input modal for active database', () => {
      component.selectedDatabase = mockDatabases[0]; // active
      component.copyDatabase();
      expect(component.showInputModal).toBeTrue();
      expect(component.inputModalTitle).toBe('DBM_PROMPT_COPY_TITLE');
    });

    it('should call copyDatabase when input confirmed', () => {
      component.selectedDatabase = mockDatabases[0];
      component.copyDatabase();
      component.inputValue = 'copyDB';
      component.onInputConfirm();

      expect(mockDataService.copyDatabase).toHaveBeenCalledWith('copyDB');
      expect(component.showAckModal).toBeTrue();
      expect(component.ackModalMessage).toBe('DBM_SUCCESS_COPY');
    });

    it('should handle conflict error (409)', () => {
      mockDataService.copyDatabase.and.returnValue(throwError(() => ({ status: 409 })));
      component.selectedDatabase = mockDatabases[0];
      component.copyDatabase();
      component.inputValue = 'copyDB';
      component.onInputConfirm();

      expect(component.loading).toBeFalse();
      expect(component.showAckModal).toBeTrue();
      expect(component.ackModalMessage).toBe('DBM_ERR_EXISTS');
    });
  });

  describe('resetDatabase', () => {
    it('should return if no database selected', () => {
      component.selectedDatabase = null;
      component.resetDatabase();
      expect(component.showConfirmModal).toBeFalse();
    });

    it('should show error if resetting inactive database', () => {
      component.selectedDatabase = mockDatabases[1];
      component.resetDatabase();
      expect(component.showAckModal).toBeTrue();
      expect(component.ackModalMessage).toBe('DBM_ERR_RESET_INACTIVE');
    });

    it('should require double confirmation', () => {
      component.selectedDatabase = mockDatabases[0];
      component.resetDatabase();

      // First confirm
      expect(component.showConfirmModal).toBeTrue();
      expect(component.confirmModalTitle).toBe('DBM_CONFIRM_RESET_TITLE');
      expect(component.confirmModalMessage).toBe('DBM_CONFIRM_RESET_MSG_1');

      component.onConfirm();

      // Second confirm
      expect(component.showConfirmModal).toBeTrue();
      expect(component.confirmModalTitle).toBe('DBM_CONFIRM_RESET_TITLE');
      expect(component.confirmModalMessage).toBe('DBM_CONFIRM_RESET_MSG_2');

      component.onConfirm();

      expect(mockDataService.resetDatabase).toHaveBeenCalled();
      expect(component.showAckModal).toBeTrue();
      expect(component.ackModalMessage).toBe('DBM_SUCCESS_RESET');
    });
  });

  describe('deleteDatabase', () => {
    it('should return if no database selected', () => {
      component.selectedDatabase = null;
      component.deleteDatabase();
      expect(component.showConfirmModal).toBeFalse();
    });

    it('should show error if deleting active database', () => {
      component.selectedDatabase = mockDatabases[0]; // active
      component.deleteDatabase();
      expect(component.showAckModal).toBeTrue();
      expect(component.ackModalMessage).toBe('DBM_ERR_DELETE_ACTIVE');
    });

    it('should show confirm modal for inactive database', () => {
      component.selectedDatabase = mockDatabases[1];
      component.deleteDatabase();
      expect(component.showConfirmModal).toBeTrue();
      expect(component.confirmModalTitle).toBe('DBM_CONFIRM_DELETE_TITLE');
    });

    it('should call deleteDatabase when confirmed', () => {
      component.selectedDatabase = mockDatabases[1];
      component.deleteDatabase();
      component.onConfirm();

      expect(mockDataService.deleteDatabase).toHaveBeenCalledWith('db2');
      // After delete, it reloads and selects the current database if none selected
      expect(component.selectedDatabase).toEqual(mockDatabases[0]);
      expect(component.showAckModal).toBeTrue();
      expect(component.ackModalMessage).toBe('DBM_SUCCESS_DELETE');
    });
  });

  it('should navigate back', () => {
    component.onBack();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/raceday-setup']);
  });

  it('should handle cancel confirm', () => {
    component.showConfirmModal = true;
    component.onCancelConfirm();
    expect(component.showConfirmModal).toBeFalse();
  });

  it('should handle cancel input', () => {
    component.showInputModal = true;
    component.onCancelInput();
    expect(component.showInputModal).toBeFalse();
  });

  it('should handle error during import', () => {
    mockDataService.importDatabase.and.returnValue(throwError(() => new Error('Error')));
    const event = { target: { files: [{ name: 'db.zip' }], value: 'test' } };
    component.onFileSelected(event);
    component.inputValue = 'importedDB';
    component.onInputConfirm();

    expect(component.loading).toBeFalse();
    expect(component.showAckModal).toBeTrue();
    expect(component.ackModalMessage).toBe('DBM_ERR_IMPORT');
  });

  it('should handle success during import', () => {
    const event = { target: { files: [{ name: 'db.zip' }], value: 'test' } };
    component.onFileSelected(event);
    component.inputValue = 'importedDB';
    component.onInputConfirm();

    expect(mockDataService.importDatabase).toHaveBeenCalledWith('importedDB', event.target.files[0] as any);
    expect(component.showAckModal).toBeTrue();
    expect(component.ackModalMessage).toBe('DBM_SUCCESS_IMPORT');
  });
});
