import { ChangeDetectorRef } from "@angular/core";
import { isObservable, Observable } from "rxjs";
import { TranslationService } from "@app/services/translation.service";
import { formatUnsavedChangesMessage } from "@app/utils/unsaved-changes.helper";

export interface EditorLifecycleConfig {
  cdr?: ChangeDetectorRef;
  translationService?: TranslationService;
  getUnsavedReasons?: () => string[];
  onRevert?: () => void;
  undoManager?: any;
  hasChanges?: () => boolean;
  isSaveValid?: () => boolean;
  isSaving?: () => boolean;
  onAutoSave?: () => Promise<any> | Observable<any>;
  autoSaveOnDiscard?: boolean;
  logger?: any;
}

/**
 * Encapsulates the lifecycle, deactivation guard handling, discard confirmation dialog,
 * auto-save scheduling, and promise resolution across Race Coordinator AI entity and tool editors.
 */
export class EditorLifecycleHelper {
  showDiscardConfirm = false;
  pendingDeactivate: ((value: boolean) => void) | null = null;
  isNavigationApproved = false;
  activeSavePromise: Promise<any> | null = null;

  constructor(private config: EditorLifecycleConfig = {}) {}

  get isSaving(): boolean {
    return this.activeSavePromise !== null;
  }

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
   * Schedules an auto-save operation. If a save is already in-flight, it chains
   * onto the active promise and executes a follow-up save if changes remain.
   */
  scheduleAutoSave(
    saveFn?: () => Promise<any> | Observable<any>,
  ): Promise<any> {
    const fnToRun = saveFn || this.config.onAutoSave;
    if (!fnToRun) {
      return Promise.resolve();
    }
    if (this.config.isSaveValid && !this.config.isSaveValid()) {
      return Promise.resolve();
    }

    if (this.activeSavePromise) {
      const currentPromise = this.activeSavePromise;
      return currentPromise.then(
        (): Promise<any> => {
          if (this.activeSavePromise === currentPromise) {
            this.activeSavePromise = null;
          }
          if (
            this.config.hasChanges?.() &&
            (!this.config.isSaveValid || this.config.isSaveValid())
          ) {
            return this.scheduleAutoSave(fnToRun);
          }
          return Promise.resolve();
        },
        (err: any): Promise<any> => {
          if (this.activeSavePromise === currentPromise) {
            this.activeSavePromise = null;
          }
          return Promise.reject(err);
        },
      );
    }

    let isSyncDone = false;
    let saveResult: any;
    try {
      saveResult = fnToRun();
    } catch (err) {
      return Promise.reject(err);
    }

    let promise: Promise<any>;
    if (isObservable(saveResult)) {
      promise = new Promise<any>((resolve, reject) => {
        saveResult.subscribe({
          next: resolve,
          error: reject,
          complete: () => {
            isSyncDone = true;
          },
        });
      });
    } else if (
      saveResult instanceof Promise ||
      (saveResult && typeof saveResult.then === "function")
    ) {
      promise = saveResult;
    } else {
      isSyncDone = true;
      promise = Promise.resolve(saveResult);
    }

    const stillSaving = this.config.isSaving
      ? this.config.isSaving()
      : !isSyncDone;
    if (!stillSaving) {
      this.activeSavePromise = null;
      promise.catch(() => {});
      return promise;
    }

    const trackedPromise = promise.finally(() => {
      if (this.activeSavePromise === trackedPromise) {
        this.activeSavePromise = null;
      }
    });

    this.activeSavePromise = trackedPromise;
    trackedPromise.catch(() => {});
    return trackedPromise;
  }

  /**
   * Prompts the discard confirmation dialog and returns a Promise resolving to true (discard/allow navigation)
   * or false (stay on page). Automatically awaits in-flight saves and attempts a final auto-save before prompting.
   */
  async confirmDiscard(): Promise<boolean> {
    if (this.config.undoManager?.commitState) {
      this.config.undoManager.commitState();
    }

    if (
      this.config.autoSaveOnDiscard &&
      this.config.hasChanges &&
      !this.config.hasChanges()
    ) {
      return true;
    }

    if (this.activeSavePromise) {
      try {
        await this.activeSavePromise;
      } catch (e) {
        this.config.logger?.error?.("In-flight save failed before discard", e);
      }
      if (this.config.hasChanges && !this.config.hasChanges()) {
        return true;
      }
    }

    if (
      this.config.autoSaveOnDiscard &&
      this.config.onAutoSave &&
      (!this.config.isSaveValid || this.config.isSaveValid()) &&
      this.config.hasChanges &&
      this.config.hasChanges()
    ) {
      try {
        await this.scheduleAutoSave(this.config.onAutoSave);
        if (!this.config.hasChanges()) {
          return true;
        }
      } catch (e) {
        this.config.logger?.error?.(
          "Final auto-save failed before navigation",
          e,
        );
      }
    }

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
    this.activeSavePromise = null;
  }
}
