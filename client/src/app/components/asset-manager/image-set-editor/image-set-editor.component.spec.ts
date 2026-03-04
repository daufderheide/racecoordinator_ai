
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ImageSetEditorComponent } from './image-set-editor.component';
import { DataService } from 'src/app/data.service';
import { TranslationService } from 'src/app/services/translation.service';
import { ChangeDetectorRef, Component, Input, Output, EventEmitter, Pipe, PipeTransform, SimpleChange } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

@Component({ selector: 'app-image-selector', template: '', standalone: false })
class MockImageSelectorComponent {
  @Input() imageUrl?: string;
  @Input() assets: any[] = [];
  @Input() size: string = 'medium';
  @Output() imageUrlChange = new EventEmitter<string>();
}

@Pipe({ name: 'translate', standalone: false })
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string { return value; }
}

describe('ImageSetEditorComponent', () => {
  let component: ImageSetEditorComponent;
  let fixture: ComponentFixture<ImageSetEditorComponent>;
  let mockDataService: any;
  let mockTranslationService: any;

  beforeEach(async () => {
    mockDataService = jasmine.createSpyObj('DataService', ['saveImageSet']);
    mockTranslationService = jasmine.createSpyObj('TranslationService', ['translate']);
    mockTranslationService.translate.and.callFake((key: string) => key);

    await TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [
        ImageSetEditorComponent,
        MockImageSelectorComponent,
        MockTranslatePipe
      ],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: TranslationService, useValue: mockTranslationService },
        ChangeDetectorRef
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ImageSetEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should reset form only when transitioning to visible', () => {
    component.name = 'Dirty Name';
    component.entries = [{ name: 'dirty', percentage: 10, url: '', data: new Uint8Array() }];

    // Simulate property change from hidden to visible
    component.ngOnChanges({
      visible: new SimpleChange(false, true, true)
    });

    expect(component.name).toBe('');
    expect(component.entries.length).toBe(0);
  });

  it('should NOT reset form if visible changes but was already true', () => {
    component.name = 'Persisted Name';
    component.entries = [{ name: 'img.png', percentage: 100, url: 'data:...', data: new Uint8Array() }];

    // Simulate some other update while visible
    component.ngOnChanges({
      visible: new SimpleChange(true, true, false)
    });

    expect(component.name).toBe('Persisted Name');
    expect(component.entries.length).toBe(1);
  });

  it('should distribute percentages evenly for dropped files', (done) => {
    const files = [
      new File([''], 'alpha.png', { type: 'image/png' }),
      new File([''], 'gamma.png', { type: 'image/png' }),
      new File([''], 'beta.png', { type: 'image/png' })
    ];

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

    // Call handleFiles directly or simulate drop
    const fileList = {
      0: files[0],
      1: files[1],
      2: files[2],
      length: 3,
      item: (i: number) => files[i]
    } as unknown as FileList;

    component.handleFiles(fileList);

    // Wait for async processing
    setTimeout(() => {
      expect(component.entries.length).toBe(3);

      // Expected Sort Order: alpha, beta, gamma
      expect(component.entries[0].name).toBe('alpha.png');
      expect(component.entries[1].name).toBe('beta.png');
      expect(component.entries[2].name).toBe('gamma.png');

      // Percentages: round((0/2)*100)=0, round((1/2)*100)=50, round((2/2)*100)=100
      expect(component.entries[0].percentage).toBe(0);
      expect(component.entries[1].percentage).toBe(50);
      expect(component.entries[2].percentage).toBe(100);
      done();
    }, 100);
  });



  it('should call saveImageSet on save', () => {
    component.name = 'Test Set';
    component.entries = [{ name: 'img1.png', percentage: 100, url: 'url1', data: new Uint8Array() }];
    mockDataService.saveImageSet.and.returnValue(of({}));

    component.onSave();

    expect(mockDataService.saveImageSet).toHaveBeenCalledWith('Test Set', component.entries, undefined);
  });

  it('should add entry and recalculate percentages', () => {
    component.entries = [{ name: 'img1.png', percentage: 100, url: 'url1', data: new Uint8Array() }];
    component.addEntry();

    expect(component.entries.length).toBe(2);
    expect(component.entries[0].percentage).toBe(0);
    expect(component.entries[1].percentage).toBe(100);
  });

  it('should remove entry and recalculate percentages', () => {
    component.entries = [
      { name: 'img1.png', percentage: 0, url: 'url1', data: new Uint8Array() },
      { name: 'img2.png', percentage: 50, url: 'url2', data: new Uint8Array() },
      { name: 'img3.png', percentage: 100, url: 'url3', data: new Uint8Array() }
    ];

    component.removeEntry(1); // Remove middle one

    expect(component.entries.length).toBe(2);
    expect(component.entries[0].percentage).toBe(0);
    expect(component.entries[1].percentage).toBe(100);
    expect(component.entries[1].name).toBe('img3.png');
  });

  it('should reset form with initialEntries', () => {
    component.initialName = 'Original Name';
    component.initialEntries = [{ name: 'orig.png', percentage: 100, url: 'orig_url', data: new Uint8Array() }];

    component.resetForm();

    expect(component.name).toBe('Original Name');
    expect(component.entries.length).toBe(1);
    expect(component.entries[0].name).toBe('orig.png');
  });

  it('should validate name and entries on save', () => {
    spyOn(window, 'alert');
    component.name = '';
    component.entries = [];

    component.onSave();

    expect(window.alert).toHaveBeenCalled();
    expect(mockDataService.saveImageSet).not.toHaveBeenCalled();
  });

  it('should handle internal drop logic with ID prefix stripping', () => {
    const url = '/assets/123_library_image.png';
    component.handleInternalDrop(url);

    expect(component.entries.length).toBe(1);
    expect(component.entries[0].name).toBe('library_image.png');
    expect(component.entries[0].url).toBe(url);
  });

  it('should handle save error correctly', () => {
    spyOn(window, 'alert');
    spyOn(console, 'error');
    component.name = 'Valid Name';
    component.entries = [{ name: 'img1.png', percentage: 100, url: 'url1', data: new Uint8Array() }];
    mockDataService.saveImageSet.and.returnValue(throwError(() => new Error('Save Failed')));

    component.onSave();

    expect(component.isSaving).toBeFalse();
    expect(window.alert).toHaveBeenCalledWith('Error: Save Failed');
  });
});
