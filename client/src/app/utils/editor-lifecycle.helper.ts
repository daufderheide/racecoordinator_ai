import { ChangeDetectorRef } from "@angular/core";
import { TranslationService } from "@app/services/translation.service";
import { formatUnsavedChangesMessage } from "@app/utils/unsaved-changes.helper";

export interface EditorLifecycleConfig {
  cdr?: ChangeDetectorRef;
  translationService?: TranslationService;
  getUnsavedReasons?: () => string[];
  onRevert?: () => void;
}

/**
 * Encapsulates the lifecycle, deactivation guard handling, discard confirmation dialog,
 * and promise resolution across Race Coordinator AI entity and tool editors.
 */
export class EditorLifecycleHelper {
  showDiscardConfirm = false;
  pendingDeactivate: ((value: boolean) => void) | null = null;
  isNavigationApproved = false;

  constructor(private config: EditorLifecycleConfig = {}) {}

  /**
   * Formatted discard message including specific validation or unsaved reasons.
   */
  get discardMessage(): string {
    if (!this.config.translationService) {
      return "";
    }
    const reasons = this.config.getUnsavedReasons
      ? this.config.getUnsavedReasons()
      : [];
    return formatUnsavedChangesMessage(this.config.translationService, reasons);
  }

  /**
   * Prompts the discard confirmation dialog and returns a Promise resolving to true (discard)
   * or false (stay on page).
   */
  confirmDiscard(): Promise<boolean> {
    this.showDiscardConfirm = true;
    this.config.cdr?.markForCheck();
    this.config.cdr?.detectChanges();
    return new Promise<boolean>((resolve) => {
      this.pendingDeactivate = resolve;
    });
  }

  /**
   * Called when user confirms discarding unsaved changes.
   * Runs optional revert callback, marks navigation approved, and resolves pending promise.
   */
  onConfirmDiscard(customRevert?: () => void): void {
    this.showDiscardConfirm = false;
    if (customRevert) {
      customRevert();
    } else if (this.config.onRevert) {
      this.config.onRevert();
    }
    this.isNavigationApproved = true;
    if (this.pendingDeactivate) {
      this.pendingDeactivate(true);
      this.pendingDeactivate = null;
    }
    this.config.cdr?.detectChanges();
  }

  /**
   * Called when user cancels discarding changes.
   * Closes the confirmation dialog and resolves pending promise with false.
   */
  onCancelDiscard(): void {
    this.showDiscardConfirm = false;
    if (this.pendingDeactivate) {
      this.pendingDeactivate(false);
      this.pendingDeactivate = null;
    }
  }

  /**
   * Resets lifecycle flags (e.g. after successful save or route change).
   */
  reset(): void {
    this.showDiscardConfirm = false;
    this.pendingDeactivate = null;
    this.isNavigationApproved = false;
  }
}
