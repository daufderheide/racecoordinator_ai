import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface GuideStep {
  targetId?: string; // ID of the element to highlight. If null/undefined, it's a general modal.
  selector?: string; // CSS selector of the element to highlight.
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'; // Preferred position relative to target
}

@Injectable({
  providedIn: 'root'
})
export class HelpService {
  steps: GuideStep[] = [];
  currentStepIndex = 0;

  private _isVisible = new BehaviorSubject<boolean>(false);
  isVisible$ = this._isVisible.asObservable();

  private _currentStep = new BehaviorSubject<GuideStep | null>(null);
  currentStep$ = this._currentStep.asObservable();

  private _hasNext = new BehaviorSubject<boolean>(false);
  hasNext$ = this._hasNext.asObservable();

  private _hasPrevious = new BehaviorSubject<boolean>(false);
  hasPrevious$ = this._hasPrevious.asObservable();

  constructor() { }

  startGuide(steps: GuideStep[]) {
    if (!steps || steps.length === 0) return;
    this.steps = steps;
    this.currentStepIndex = 0;
    this.updateState();
    this._isVisible.next(true);
  }

  nextStep() {
    if (this.currentStepIndex < this.steps.length - 1) {
      this.currentStepIndex++;
      this.updateState();
    } else {
      this.endGuide();
    }
  }

  previousStep() {
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
      this.updateState();
    }
  }

  endGuide() {
    this._isVisible.next(false);
    this._currentStep.next(null);
    this.steps = [];
    this.currentStepIndex = 0;
  }

  private updateState() {
    const step = this.steps[this.currentStepIndex];
    this._currentStep.next(step);
    this._hasNext.next(this.currentStepIndex < this.steps.length - 1);
    this._hasPrevious.next(this.currentStepIndex > 0);
  }
}
