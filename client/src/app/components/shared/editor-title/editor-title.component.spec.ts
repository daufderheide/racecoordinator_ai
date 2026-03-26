import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { EditorTitleComponent } from './editor-title.component';
import { Router } from '@angular/router';
import { TranslationService } from 'src/app/services/translation.service';
import { EditorTitleHarness } from './testing/editor-title.harness';
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({ selector: 'app-back-button', template: '', standalone: false })
class MockBackButtonComponent {
  @Input() route: string = '';
  @Input() queryParams: any = {};
  @Input() label: string = '';
  @Input() confirm: boolean = false;
  @Input() confirmTitle: string = '';
  @Input() confirmMessage: string = '';
}

@Component({ selector: 'app-toolbar', template: '<button id="help-track-btn" (click)="help.emit()"></button>', standalone: false })
class MockToolbarComponent {
  @Input() showUndo: boolean = true;
  @Input() showRedo: boolean = true;
  @Input() showHelp: boolean = true;
  @Input() showAdd: boolean = false;
  @Input() showDelete: boolean = false;
  @Input() showCopy: boolean = false;
  @Input() isSaving: boolean = false;
  @Input() undoManager: any;
  @Output() help = new EventEmitter<void>();
  @Output() add = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();
  @Output() copy = new EventEmitter<void>();
}

import { Pipe, PipeTransform } from '@angular/core';
@Pipe({ name: 'translate', standalone: false })
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string { return value; }
}

describe('EditorTitleComponent', () => {
  let component: EditorTitleComponent;
  let fixture: ComponentFixture<EditorTitleComponent>;
  let harness: EditorTitleHarness;
  let mockRouter: any;
  let mockTranslationService: any;

  beforeEach(async () => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockTranslationService = jasmine.createSpyObj('TranslationService', ['translate']);
    mockTranslationService.translate.and.callFake((key: string) => key);

    await TestBed.configureTestingModule({
      declarations: [
        EditorTitleComponent,
        MockBackButtonComponent,
        MockToolbarComponent,
        MockTranslatePipe
      ],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: TranslationService, useValue: mockTranslationService }
      ]
    }).compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(EditorTitleComponent);
    component = fixture.componentInstance;
    component.titleKey = 'TEST_TITLE';
    harness = await TestbedHarnessEnvironment.harnessForFixture(fixture, EditorTitleHarness);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display title', async () => {
    fixture.detectChanges();
    expect(await harness.getTitle()).toBe('TEST_TITLE');
  });

  it('should emit help event on click', async () => {
    spyOn(component.help, 'emit');
    await harness.clickHelp();
    expect(component.help.emit).toHaveBeenCalled();
  });
});
