
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ImageSelectorComponent } from './image-selector.component';
import { DataService } from 'src/app/data.service';
import { ChangeDetectorRef, Component, Input, Output, EventEmitter, Pipe, PipeTransform } from '@angular/core';
import { of, throwError } from 'rxjs';

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

  beforeEach(() => {
    fixture = TestBed.createComponent(ImageSelectorComponent);
    component = fixture.componentInstance;
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

  it('should handle drop and upload file', (done) => {
    const file = new File([''], 'test.png', { type: 'image/png' });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    const dropEvent = new DragEvent('drop', { dataTransfer });

    const mockAsset = { url: '/assets/test.png' };
    mockDataService.uploadAsset.and.returnValue(of(mockAsset));

    spyOn(component.imageUrlChange, 'emit');
    spyOn(component.uploadStarted, 'emit');
    spyOn(component.uploadFinished, 'emit');

    // Mock FileReader behavior for drop and upload
    const mockReader: any = {
      readAsDataURL: jasmine.createSpy('readAsDataURL').and.callFake(function (this: any) {
        this.onload({ target: { result: 'data:image/png;base64,' } });
      }),
      readAsArrayBuffer: jasmine.createSpy('readAsArrayBuffer').and.callFake(function (this: any) {
        this.onload({ target: { result: new ArrayBuffer(0) } });
      })
    };
    spyOn(window as any, 'FileReader').and.returnValue(mockReader);

    component.onDrop(dropEvent);

    expect(component.uploadStarted.emit).toHaveBeenCalled();
    expect(mockDataService.uploadAsset).toHaveBeenCalled();

    fixture.whenStable().then(() => {
      expect(component.imageUrl).toBe(mockAsset.url);
      expect(component.imageUrlChange.emit).toHaveBeenCalledWith(mockAsset.url);
      expect(component.uploadFinished.emit).toHaveBeenCalled();
      expect(component.isUploading).toBeFalse();
      done();
    });
  });

  it('should handle upload error', (done) => {
    const file = new File([''], 'test.png', { type: 'image/png' });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    const dropEvent = new DragEvent('drop', { dataTransfer });

    mockDataService.uploadAsset.and.returnValue(throwError(() => new Error('Upload failed')));

    spyOn(component.uploadFinished, 'emit');

    const mockReader: any = {
      readAsDataURL: jasmine.createSpy('readAsDataURL').and.callFake(function (this: any) {
        this.onload({ target: { result: 'data:' } });
      }),
      readAsArrayBuffer: jasmine.createSpy('readAsArrayBuffer').and.callFake(function (this: any) {
        this.onload({ target: { result: new ArrayBuffer(0) } });
      })
    };
    spyOn(window as any, 'FileReader').and.returnValue(mockReader);

    component.onDrop(dropEvent);

    fixture.whenStable().then(() => {
      expect(component.isUploading).toBeFalse();
      expect(component.uploadFinished.emit).toHaveBeenCalled();
      done();
    });
  });

  it('should open and close selector', () => {
    component.openSelector();
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
