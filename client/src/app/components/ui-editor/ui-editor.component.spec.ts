
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { UIEditorComponent } from './ui-editor.component';
import { SettingsService } from 'src/app/services/settings.service';
import { FileSystemService } from 'src/app/services/file-system.service';
import { DataService } from 'src/app/data.service';
import { Router } from '@angular/router';
import { ChangeDetectorRef, Component, Input, Output, EventEmitter, Pipe, PipeTransform } from '@angular/core';
import { of, throwError } from 'rxjs';
import { Settings } from 'src/app/models/settings';

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

    const settings = new Settings([], [], '127.0.0.1', 8080, 'en', true, 'g', 'y', 'r', 'w', 'b', 'c');
    mockSettingsService.getSettings.and.returnValue(settings);
    mockDataService.listAssets.and.returnValue(of([{ type: 'image', url: 'img1.png' }]));
    mockFileSystem.getCustomDirectoryHandle.and.returnValue(of({ name: 'CustomUI' }));

    await TestBed.configureTestingModule({
      declarations: [
        UIEditorComponent,
        MockImageSelectorComponent,
        MockBackButtonComponent,
        MockUndoRedoControlsComponent,
        MockTranslatePipe
      ],
      providers: [
        { provide: SettingsService, useValue: mockSettingsService },
        { provide: FileSystemService, useValue: mockFileSystem },
        { provide: DataService, useValue: mockDataService },
        { provide: Router, useValue: mockRouter },
        ChangeDetectorRef
      ]
    }).compileComponents();
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

  it('should handle directory selection', async () => {
    mockFileSystem.selectCustomFolder.and.returnValue(Promise.resolve(true));
    mockFileSystem.getCustomDirectoryHandle.and.returnValue(of({ name: 'NewDir' }));

    await component.selectDirectory();

    expect(mockFileSystem.selectCustomFolder).toHaveBeenCalled();
    expect(component.customDirectoryName).toBe('NewDir');
  });

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
});
