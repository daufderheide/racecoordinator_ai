import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RacedaySetupComponent } from './raceday-setup.component';
import { FileSystemService } from 'src/app/services/file-system.service';
import { Compiler, Injector, ChangeDetectorRef } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';

describe('RacedaySetupComponent', () => {
  let component: RacedaySetupComponent;
  let fixture: ComponentFixture<RacedaySetupComponent>;
  let mockFileSystemService: jasmine.SpyObj<FileSystemService>;
  let mockContainer: jasmine.SpyObj<any>;

  beforeEach(() => {
    mockFileSystemService = jasmine.createSpyObj('FileSystemService', ['selectCustomFolder', 'hasCustomFiles', 'getCustomFile']);
    mockContainer = jasmine.createSpyObj('ViewContainerRef', ['clear', 'createComponent']);

    TestBed.configureTestingModule({
      declarations: [RacedaySetupComponent],
      providers: [
        { provide: FileSystemService, useValue: mockFileSystemService },
        { provide: Compiler, useValue: { compileModuleAsync: () => Promise.resolve({ create: () => ({ componentFactoryResolver: { resolveComponentFactory: () => { } } }) }) } },
        { provide: Injector, useValue: {} },
        { provide: ChangeDetectorRef, useValue: { detectChanges: () => { } } }
      ],
      imports: [SharedModule]
    }).compileComponents();

    fixture = TestBed.createComponent(RacedaySetupComponent);
    component = fixture.componentInstance;

    // Mock the ViewContainerRef
    component.container = mockContainer;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load default UI when no custom files are present', async () => {
    mockFileSystemService.hasCustomFiles.and.returnValue(Promise.resolve(false));
    spyOn(component, 'loadDefaultComponent').and.callThrough();

    await component.ngOnInit();

    expect(mockFileSystemService.hasCustomFiles).toHaveBeenCalled();
    expect(component.loadDefaultComponent).toHaveBeenCalled();
    expect(mockContainer.clear).toHaveBeenCalled();
    // Verify default component creation
    expect(mockContainer.createComponent).toHaveBeenCalled();
  });

  it('should load default UI when custom file loading fails', async () => {
    mockFileSystemService.hasCustomFiles.and.returnValue(Promise.resolve(true));
    mockFileSystemService.getCustomFile.and.throwError('Read error');
    spyOn(component, 'loadDefaultComponent').and.callThrough();
    spyOn(component, 'loadCustomComponent').and.callThrough();
    spyOn(console, 'error'); // Suppress error log

    await component.ngOnInit();

    expect(mockFileSystemService.hasCustomFiles).toHaveBeenCalled();
    expect(component.loadCustomComponent).toHaveBeenCalled();
    // Should catch error and fall back
    expect(component.loadDefaultComponent).toHaveBeenCalled();
    expect(mockContainer.createComponent).toHaveBeenCalled();
    expect(component.error).toContain('Read error');
  });

  it('should load custom UI when selected and files exist', async () => {
    mockFileSystemService.hasCustomFiles.and.returnValue(Promise.resolve(true));
    mockFileSystemService.getCustomFile.and.returnValue(Promise.resolve('<div>Custom</div>'));
    spyOn(component, 'loadDefaultComponent');
    spyOn(component, 'loadCustomComponent').and.callThrough();

    // We need to mock the compiler flow a bit more for this to pass without errors if we check internals,
    // but verifying loadCustomComponent is called and loadDefaultComponent is NOT called is the main check.

    // Deeper mock for createDynamicComponentClass / Compiler to avoid runtime errors in test
    // We can spy on createDynamicComponentClass to simplify
    spyOn<any>(component, 'createDynamicComponentClass').and.returnValue({} as any);
    // Mock compiler to return a factory that works with our spy
    const mockFactory = { create: jasmine.createSpy().and.returnValue({ componentFactoryResolver: { resolveComponentFactory: jasmine.createSpy() } }) };
    (component as any).compiler = { compileModuleAsync: jasmine.createSpy().and.returnValue(Promise.resolve(mockFactory)) };

    await component.ngOnInit();

    expect(mockFileSystemService.hasCustomFiles).toHaveBeenCalled();
    expect(component.loadCustomComponent).toHaveBeenCalled();
    expect(component.loadDefaultComponent).not.toHaveBeenCalled();
    expect(mockFileSystemService.getCustomFile).toHaveBeenCalledWith('raceday-setup.component.html');
  });

  it('should show permission button if permission error occurs', async () => {
    mockFileSystemService.hasCustomFiles.and.returnValue(Promise.resolve(true));
    mockFileSystemService.getCustomFile.and.callFake(() => Promise.reject(new Error('Permission denied')));

    spyOn(component, 'loadDefaultComponent').and.callThrough();

    await component.ngOnInit();

    expect(component.showPermissionButton).toBeTrue();
    expect(component.error).toContain('Permission needed');
    expect(component.loadDefaultComponent).toHaveBeenCalled();
  });

  it('should retry loading custom component when permission is granted', async () => {
    // Initial state: error shown
    component.showPermissionButton = true;
    component.error = 'Permission needed';

    // Setup for success on retry
    mockFileSystemService.hasCustomFiles.and.returnValue(Promise.resolve(true));
    mockFileSystemService.getCustomFile.and.returnValue(Promise.resolve('<div>Custom</div>'));

    spyOn(component, 'loadCustomComponent').and.callThrough();
    // Use our incomplete mock for deeper calls since we just want to verify flow
    spyOn<any>(component, 'createDynamicComponentClass').and.returnValue({} as any);
    (component as any).compiler = { compileModuleAsync: () => Promise.resolve({ create: () => ({ componentFactoryResolver: { resolveComponentFactory: () => { } } }) }) };

    await component.grantPermission();

    expect(component.showPermissionButton).toBeFalse();
    expect(component.error).toBeNull();
    expect(component.loadCustomComponent).toHaveBeenCalled();
    expect(mockContainer.clear).toHaveBeenCalled();
  });
});
