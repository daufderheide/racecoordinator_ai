import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { Observable } from 'rxjs';
import { DirtyComponent } from '../interfaces/dirty-component';
import { TranslationService } from '../services/translation.service';

@Injectable({
  providedIn: 'root'
})
export class DirtyCheckGuard implements CanDeactivate<DirtyComponent> {

  constructor(private translationService: TranslationService) { }

  canDeactivate(
    component: DirtyComponent
  ): Observable<boolean> | Promise<boolean> | boolean {
    if (component.hasChanges() && !component.isNavigationApproved) {
      // Keys from en.json (e.g. UE_CONFIRM_DISCARD_MESSAGE)
      // Since this is generic, we might need a way to get the specific key
      // or just use a generic one if available.
      // Looking at en.json, we have:
      // "UE_CONFIRM_DISCARD_MESSAGE": "You have unsaved changes. Are you sure you want to discard them?"

      const message = this.translationService.translate('UE_CONFIRM_DISCARD_MESSAGE');
      return confirm(message);
    }
    return true;
  }
}
