import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HelpOverlayComponent } from './help-overlay.component';
import { HelpService, GuideStep } from '../../../services/help.service';
import { BehaviorSubject } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';

describe('HelpOverlayComponent', () => {
  let component: HelpOverlayComponent;
  let fixture: ComponentFixture<HelpOverlayComponent>;
  let helpServiceMock: any;
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

    await TestBed.configureTestingModule({
      declarations: [HelpOverlayComponent],
      providers: [
        { provide: HelpService, useValue: helpServiceMock },
        ChangeDetectorRef
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HelpOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not be visible initially', () => {
    expect(component.isVisible).toBeFalse();
    const overlayElement = fixture.nativeElement.querySelector('.help-overlay-container');
    expect(overlayElement).toBeFalsy();
  });

  it('should become visible when service emits true', () => {
    isVisibleSubject.next(true);
    fixture.detectChanges();
    expect(component.isVisible).toBeTrue();
    const overlayElement = fixture.nativeElement.querySelector('.help-overlay-container');
    expect(overlayElement).toBeTruthy();
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

    const titleElement = fixture.nativeElement.querySelector('.popover-header h3');
    const contentElement = fixture.nativeElement.querySelector('.popover-content p');

    expect(titleElement.textContent).toContain('Test Title');
    expect(contentElement.textContent).toContain('Test Content');
  }));

  it('should call nextStep on next button click', fakeAsync(() => {
    isVisibleSubject.next(true);
    currentStepSubject.next({ title: 'Step 1', content: 'Content' });
    hasNextSubject.next(true);
    tick();
    fixture.detectChanges();

    const nextBtn = fixture.nativeElement.querySelector('.btn-next');
    nextBtn.click();
    expect(helpServiceMock.nextStep).toHaveBeenCalled();
  }));

  it('should call previousStep on back button click', fakeAsync(() => {
    isVisibleSubject.next(true);
    currentStepSubject.next({ title: 'Step 2', content: 'Content' });
    hasPreviousSubject.next(true);
    tick();
    fixture.detectChanges();

    const prevBtn = fixture.nativeElement.querySelector('.btn-prev');
    prevBtn.click();
    expect(helpServiceMock.previousStep).toHaveBeenCalled();
  }));

  it('should call endGuide on finish button click', fakeAsync(() => {
    isVisibleSubject.next(true);
    currentStepSubject.next({ title: 'Last Step', content: 'Content' });
    hasNextSubject.next(false); // Last step
    tick();
    fixture.detectChanges();

    const finishBtn = fixture.nativeElement.querySelector('.btn-finish');
    finishBtn.click();
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
