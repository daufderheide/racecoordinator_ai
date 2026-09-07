import { Injectable } from "@angular/core";
import { CanDeactivate } from "@angular/router";
import { Observable } from "rxjs";
import { DirtyComponent } from "@app/interfaces/dirty-component";
import { TranslationService } from "@app/services/translation.service";
import { formatUnsavedChangesMessage } from "@app/utils/unsaved-changes.helper";

@Injectable({
  providedIn: "root",
})
export class DirtyCheckGuard implements CanDeactivate<DirtyComponent> {
  constructor(private translationService: TranslationService) {}

  canDeactivate(
    component: DirtyComponent,
  ): Observable<boolean> | Promise<boolean> | boolean {
    if (component.hasChanges() && !component.isNavigationApproved) {
      if ((component as any).confirmDiscard) {
        return (component as any).confirmDiscard();
      }

      const reasons = component.getUnsavedReasons?.() || [];
      const message = formatUnsavedChangesMessage(
        this.translationService,
        reasons,
      );
      return confirm(message);
    }
    return true;
  }
}
