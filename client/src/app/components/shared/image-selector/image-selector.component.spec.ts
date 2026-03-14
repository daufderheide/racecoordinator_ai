import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ImageSelectorComponent } from './image-selector.component';
import { DataService } from 'src/app/data.service';
import { ChangeDetectorRef, Component, Input, Output, EventEmitter, Pipe, PipeTransform } from '@angular/core';
import { of, throwError } from 'rxjs';
import { ImageSelectorHarness } from './image-selector.harness';

@Component({ selector: 'app-item-selector', template: '', standalone: false })
class MockItemSelectorComponent {
  @Input() items: any[] = [];
  @Input() visible: boolean = false;
  @Input() title: string = '';
  @Input() itemType: string = 'image';
  @Input() backButtonRoute: string | null = null;
  @Input() backButtonQueryParams: any = {};
  @Output() select = new EventEmitter<any>();
  @Output() close = new EventEmitter<void>();
}

@Pipe({ name: 'translate', standalone: false })
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string { return value; }
}

@Pipe({ name: 'avatarUrl', standalone: false })
class MockAvatarUrlPipe implements PipeTransform {
  transform(value: string): string { return value; }
}

describe('ImageSelectorComponent', () => {
  let component: ImageSelectorComponent;
  let fixture: ComponentFixture<ImageSelectorComponent>;
  let harness: ImageSelectorHarness;
  let mockDataService: any;

  beforeEach(async () => {
    mockDataService = jasmine.createSpyObj('DataService', ['uploadAsset']);

    await TestBed.configureTestingModule({
      declarations: [
        ImageSelectorComponent,
        MockItemSelectorComponent,
        MockTranslatePipe,
        MockAvatarUrlPipe
      ],
      providers: [
        { provide: DataService, useValue: mockDataService },
        ChangeDetectorRef
      ]
    }).compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(ImageSelectorComponent);
    component = fixture.componentInstance;
    harness = await TestbedHarnessEnvironment.harnessForFixture(fixture, ImageSelectorHarness);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should handle drag over and leave', () => {
    const event = new DragEvent('dragover');
    spyOn(event, 'preventDefault');
    spyOn(event, 'stopPropagation');

    component.onDragOver(event);
    expect(component.isDragging).toBeTrue();
    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.stopPropagation).toHaveBeenCalled();

    const leaveEvent = new DragEvent('dragleave');
    component.onDragLeave(leaveEvent);
    expect(component.isDragging).toBeFalse();
  });

  it('should handle drop and upload file', fakeAsync(() => {
    const file = new File(['upload-content'], 'test.png', { type: 'image/png' });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    const dropEvent = new DragEvent('drop', { dataTransfer });

    const mockAsset = { url: '/assets/test.png' };
    mockDataService.uploadAsset.and.returnValue(of(mockAsset));

    spyOn(component.imageUrlChange, 'emit');
    spyOn(component.uploadStarted, 'emit');
    spyOn(component.uploadFinished, 'emit');

    spyOn(window as any, 'FileReader').and.callFake(function () {
      return {
        readAsDataURL: jasmine.createSpy('readAsDataURL').and.callFake(function (this: any) {
          setTimeout(() => { if (this.onload) this.onload({ target: { result: 'data:img' } }); });
        }),
        readAsArrayBuffer: jasmine.createSpy('readAsArrayBuffer').and.callFake(function (this: any) {
          setTimeout(() => { if (this.onload) this.onload({ target: { result: new ArrayBuffer(0) } }); });
        }),
        onload: null
      };
    });

    component.onDrop(dropEvent);
    tick(); // Process both readers

    expect(component.uploadStarted.emit).toHaveBeenCalled();
    expect(mockDataService.uploadAsset).toHaveBeenCalled();
    expect(component.imageUrl).toBe(mockAsset.url);
    expect(component.imageUrlChange.emit).toHaveBeenCalledWith(mockAsset.url);
    expect(component.uploadFinished.emit).toHaveBeenCalled();
    expect(component.isUploading).toBeFalse();
  }));

  it('should handle upload error', fakeAsync(() => {
    const file = new File(['content'], 'test.png', { type: 'image/png' });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    const dropEvent = new DragEvent('drop', { dataTransfer });

    mockDataService.uploadAsset.and.returnValue(throwError(() => new Error('Upload failed')));
    spyOn(console, 'error');
    spyOn(component.uploadFinished, 'emit');

    spyOn(window as any, 'FileReader').and.callFake(function () {
      return {
        readAsDataURL: jasmine.createSpy('readAsDataURL').and.callFake(function (this: any) {
          setTimeout(() => { if (this.onload) this.onload({ target: { result: 'data:' } }); });
        }),
        readAsArrayBuffer: jasmine.createSpy('readAsArrayBuffer').and.callFake(function (this: any) {
          setTimeout(() => { if (this.onload) this.onload({ target: { result: new ArrayBuffer(0) } }); });
        }),
        onload: null
      };
    });

    component.onDrop(dropEvent);
    tick();

    expect(component.isUploading).toBeFalse();
    expect(component.uploadFinished.emit).toHaveBeenCalled();
  }));

  it('should open and close selector', async () => {
    await harness.clickPreviewToOpenSelector();
    expect(component.showSelector).toBeTrue();
    component.closeSelector();
    expect(component.showSelector).toBeFalse();
  });

  it('should handle asset selection', () => {
    spyOn(component.imageUrlChange, 'emit');
    const asset = { url: '/assets/selected.png' };

    component.onAssetSelected(asset);

    expect(component.imageUrl).toBe(asset.url);
    expect(component.imageUrlChange.emit).toHaveBeenCalledWith(asset.url);
    expect(component.showSelector).toBeFalse();
  });
});
