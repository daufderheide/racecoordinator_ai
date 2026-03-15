import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { HelpOverlayComponent } from './help-overlay.component';
import { HelpService, GuideStep } from '../../../services/help.service';
import { TranslationService } from '../../../services/translation.service';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { BehaviorSubject } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';
import { HelpOverlayHarness } from './testing/help-overlay.harness';

describe('HelpOverlayComponent', () => {
  let component: HelpOverlayComponent;
  let fixture: ComponentFixture<HelpOverlayComponent>;
  let harness: HelpOverlayHarness;
  let helpServiceMock: any;
  let translationServiceMock: any;
  let isVisibleSubject: BehaviorSubject<boolean>;
  let currentStepSubject: BehaviorSubject<GuideStep | null>;
  let hasNextSubject: BehaviorSubject<boolean>;
  let hasPreviousSubject: BehaviorSubject<boolean>;

  beforeEach(async () => {
    isVisibleSubject = new BehaviorSubject<boolean>(false);
    currentStepSubject = new BehaviorSubject<GuideStep | null>(null);
    hasNextSubject = new BehaviorSubject<boolean>(false);
    hasPreviousSubject = new BehaviorSubject<boolean>(false);

    helpServiceMock = {
      isVisible$: isVisibleSubject.asObservable(),
      currentStep$: currentStepSubject.asObservable(),
      hasNext$: hasNextSubject.asObservable(),
      hasPrevious$: hasPreviousSubject.asObservable(),
      steps: [],
      currentStepIndex: 0,
      nextStep: jasmine.createSpy('nextStep'),
      previousStep: jasmine.createSpy('previousStep'),
      endGuide: jasmine.createSpy('endGuide')
    };

    translationServiceMock = {
      translate: jasmine.createSpy('translate').and.callFake((key: string) => key)
    };

    await TestBed.configureTestingModule({
      declarations: [HelpOverlayComponent, TranslatePipe],
      providers: [
        { provide: HelpService, useValue: helpServiceMock },
        { provide: TranslationService, useValue: translationServiceMock },
        ChangeDetectorRef
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HelpOverlayComponent);
    component = fixture.componentInstance;
    harness = await TestbedHarnessEnvironment.harnessForFixture(fixture, HelpOverlayHarness);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not be visible initially', async () => {
    expect(component.isVisible).toBeFalse();
    expect(await harness.isVisible()).toBeFalse();
  });

  it('should become visible when service emits true', async () => {
    isVisibleSubject.next(true);
    fixture.detectChanges();
    expect(component.isVisible).toBeTrue();
    expect(await harness.isVisible()).toBeTrue();
  });

  it('should display step title and content', fakeAsync(() => {
    isVisibleSubject.next(true);
    const step: GuideStep = {
      title: 'Test Title',
      content: 'Test Content',
      targetId: 'test-target'
    };
    currentStepSubject.next(step);
    tick(); // Wait for setTimeout in subscription and position update
    fixture.detectChanges();

    // The harness methods return promises, which we can await via fakeAsync tick loop or directly. 
    // Given we are in fakeAsync, we can just resolve promises using tick().
    let title = '';
    let content = '';
    harness.getTitle().then(t => title = t);
    harness.getContent().then(c => content = c);
    tick();

    expect(title).toContain('Test Title');
    expect(content).toContain('Test Content');
  }));

  it('should call nextStep on next button click', fakeAsync(() => {
    isVisibleSubject.next(true);
    currentStepSubject.next({ title: 'Step 1', content: 'Content' });
    hasNextSubject.next(true);
    tick();
    fixture.detectChanges();

    harness.clickNext();
    tick();
    expect(helpServiceMock.nextStep).toHaveBeenCalled();
  }));

  it('should call previousStep on back button click', fakeAsync(() => {
    isVisibleSubject.next(true);
    currentStepSubject.next({ title: 'Step 2', content: 'Content' });
    hasPreviousSubject.next(true);
    tick();
    fixture.detectChanges();

    harness.clickPrevious();
    tick();
    expect(helpServiceMock.previousStep).toHaveBeenCalled();
  }));

  it('should call endGuide on finish button click', fakeAsync(() => {
    isVisibleSubject.next(true);
    currentStepSubject.next({ title: 'Last Step', content: 'Content' });
    hasNextSubject.next(false); // Last step
    tick();
    fixture.detectChanges();

    harness.clickFinish();
    tick();
    expect(helpServiceMock.endGuide).toHaveBeenCalled();
  }));

  it('should calculate position correctly for target element', fakeAsync(() => {
    // Create a dummy target element in the DOM
    const target = document.createElement('div');
    target.id = 'test-target';
    target.style.position = 'absolute';
    target.style.top = '100px';
    target.style.left = '100px';
    target.style.width = '50px';
    target.style.height = '50px';
    document.body.appendChild(target);

    isVisibleSubject.next(true);
    const step: GuideStep = {
      title: 'Targeted Step',
      content: 'Check Position',
      targetId: 'test-target',
      position: 'bottom'
    };
    currentStepSubject.next(step);

    // Trigger change detection and wait for async updates 
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(component.highlightStyle).toBeTruthy();
    // highlight should match target rect
    expect(component.highlightStyle.top).toBe('100px');
    expect(component.highlightStyle.left).toBe('100px');
    expect(component.highlightStyle.width).toBe('50px');
    expect(component.highlightStyle.height).toBe('50px');

    // Popover should be below target (bottom + margin 15)
    // 100 (top) + 50 (height) + 15 (margin) = 165
    expect(component.popoverStyle.top).toBe('165px');

    // Clean up
    document.body.removeChild(target);
  }));

  it('should fallback to center if target not found', fakeAsync(() => {
    isVisibleSubject.next(true);
    const step: GuideStep = {
      title: 'No Target Step',
      content: 'Center Me',
      targetId: 'non-existent-id'
    };
    currentStepSubject.next(step);
    tick();
    fixture.detectChanges();

    expect(component.highlightStyle).toBeNull();
    expect(component.popoverStyle.top).toBe('50%');
    expect(component.popoverStyle.left).toBe('50%');
  }));
});
