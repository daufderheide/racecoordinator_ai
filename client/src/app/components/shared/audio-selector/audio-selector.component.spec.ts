
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AudioSelectorComponent } from './audio-selector.component';
import { DataService } from 'src/app/data.service';
import { TranslationService } from 'src/app/services/translation.service';
import { FormsModule } from '@angular/forms';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { of } from 'rxjs';

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

describe('AudioSelectorComponent', () => {
  let component: AudioSelectorComponent;
  let fixture: ComponentFixture<AudioSelectorComponent>;
  let mockDataService: any;
  let mockTranslationService: any;

  beforeEach(async () => {
    mockDataService = jasmine.createSpyObj('DataService', ['uploadAsset']);
    mockTranslationService = jasmine.createSpyObj('TranslationService', ['translate']);
    mockDataService.serverUrl = 'http://localhost:8080';

    await TestBed.configureTestingModule({
      declarations: [AudioSelectorComponent, MockItemSelectorComponent, MockTranslatePipe],
      imports: [FormsModule],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: TranslationService, useValue: mockTranslationService }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AudioSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit type change', () => {
    spyOn(component.typeChange, 'emit');
    component.onTypeChange('tts');
    expect(component.type).toBe('tts');
    expect(component.typeChange.emit).toHaveBeenCalledWith('tts');
  });

  it('should emit url change', () => {
    spyOn(component.urlChange, 'emit');
    component.onUrlChange('new-url');
    expect(component.url).toBe('new-url');
    expect(component.urlChange.emit).toHaveBeenCalledWith('new-url');
  });

  it('should emit text change', () => {
    spyOn(component.textChange, 'emit');
    component.onTextChange('hello');
    expect(component.text).toBe('hello');
    expect(component.textChange.emit).toHaveBeenCalledWith('hello');
  });

  it('should open and close item selector', () => {
    component.openItemSelector();
    expect(component.showItemSelector).toBeTrue();

    component.closeItemSelector();
    expect(component.showItemSelector).toBeFalse();
  });

  it('should handle asset selection', () => {
    spyOn(component.urlChange, 'emit');
    spyOn(component.typeChange, 'emit');

    component.type = 'tts';
    component.onAssetSelected({ url: 'asset-url' });

    expect(component.url).toBe('asset-url');
    expect(component.urlChange.emit).toHaveBeenCalledWith('asset-url');
    expect(component.type).toBe('preset');
    expect(component.typeChange.emit).toHaveBeenCalledWith('preset');
    expect(component.showItemSelector).toBeFalse();
  });

  it('should play preset audio', () => {
    component.type = 'preset';
    component.url = 'test.mp3';

    const mockAudio = jasmine.createSpyObj('Audio', ['play']);
    mockAudio.play.and.returnValue(Promise.resolve());
    spyOn(window, 'Audio').and.returnValue(mockAudio);

    component.play();

    expect(window.Audio).toHaveBeenCalled();
    expect(mockAudio.play).toHaveBeenCalled();
  });

  // Note: Testing TTS relies on window.speechSynthesis which might need more complex mocking
  // for a robust test environment, but this covers the basic logic paths.
});
