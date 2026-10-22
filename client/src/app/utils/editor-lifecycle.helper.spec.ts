import { ChangeDetectorRef } from "@angular/core";
import { TranslationService } from "@app/services/translation.service";

import {
  EditorLifecycleConfig,
  EditorLifecycleHelper,
} from "./editor-lifecycle.helper";

describe("EditorLifecycleHelper", () => {
  let helper: EditorLifecycleHelper;
  let mockCdr: jasmine.SpyObj<ChangeDetectorRef>;
  let mockTranslationService: jasmine.SpyObj<TranslationService>;
  let revertSpy: jasmine.Spy;

  beforeEach(() => {
    mockCdr = jasmine.createSpyObj<ChangeDetectorRef>("ChangeDetectorRef", [
      "markForCheck",
      "detectChanges",
    ]);
    mockTranslationService = jasmine.createSpyObj<TranslationService>(
      "TranslationService",
      ["translate"],
    );
    mockTranslationService.translate.and.callFake((key: string) => `[${key}]`);
    revertSpy = jasmine.createSpy("onRevert");
  });

  describe("default configuration", () => {
    beforeEach(() => {
      helper = new EditorLifecycleHelper();
    });

    it("should initialize with default state", () => {
      expect(helper.showDiscardConfirm).toBeFalse();
      expect(helper.pendingDeactivate).toBeNull();
      expect(helper.isNavigationApproved).toBeFalse();
      expect(helper.discardMessage).toBe("");
    });

    it("should open discard confirm and resolve false on cancel", async () => {
      const promise = helper.confirmDiscard();
      expect(helper.showDiscardConfirm).toBeTrue();
      expect(helper.pendingDeactivate).toBeTruthy();

      helper.onCancelDiscard();
      expect(helper.showDiscardConfirm).toBeFalse();
      expect(helper.pendingDeactivate).toBeNull();

      const result = await promise;
      expect(result).toBeFalse();
    });

    it("should open discard confirm and resolve true on confirm", async () => {
      const promise = helper.confirmDiscard();
      expect(helper.showDiscardConfirm).toBeTrue();

      helper.onConfirmDiscard();
      expect(helper.showDiscardConfirm).toBeFalse();
      expect(helper.isNavigationApproved).toBeTrue();
      expect(helper.pendingDeactivate).toBeNull();

      const result = await promise;
      expect(result).toBeTrue();
    });

    it("should safely handle onCancelDiscard when no pending deactivate exists", () => {
      expect(() => helper.onCancelDiscard()).not.toThrow();
      expect(helper.showDiscardConfirm).toBeFalse();
    });

    it("should safely handle onConfirmDiscard when no pending deactivate exists", () => {
      expect(() => helper.onConfirmDiscard()).not.toThrow();
      expect(helper.showDiscardConfirm).toBeFalse();
      expect(helper.isNavigationApproved).toBeTrue();
    });

    it("should reset state", () => {
      helper.showDiscardConfirm = true;
      helper.isNavigationApproved = true;
      helper.pendingDeactivate = () => {};

      helper.reset();

      expect(helper.showDiscardConfirm).toBeFalse();
      expect(helper.pendingDeactivate).toBeNull();
      expect(helper.isNavigationApproved).toBeFalse();
    });
  });

  describe("configured lifecycle", () => {
    let unsavedReasons: string[];

    beforeEach(() => {
      unsavedReasons = ["REASON_ONE", "REASON_TWO"];
      const config: EditorLifecycleConfig = {
        cdr: mockCdr,
        translationService: mockTranslationService,
        getUnsavedReasons: () => unsavedReasons,
        onRevert: revertSpy,
      };
      helper = new EditorLifecycleHelper(config);
    });

    it("should format discard message using translation service and reasons", () => {
      const message = helper.discardMessage;
      expect(message).toContain("[REASON_ONE]");
      expect(message).toContain("[REASON_TWO]");
    });

    it("should trigger cdr methods on confirmDiscard", () => {
      helper.confirmDiscard();
      expect(mockCdr.markForCheck).toHaveBeenCalled();
      expect(mockCdr.detectChanges).toHaveBeenCalled();
    });

    it("should invoke onRevert callback on onConfirmDiscard", async () => {
      const promise = helper.confirmDiscard();
      helper.onConfirmDiscard();

      expect(revertSpy).toHaveBeenCalled();
      expect(mockCdr.detectChanges).toHaveBeenCalled();
      const result = await promise;
      expect(result).toBeTrue();
    });

    it("should prefer custom revert callback over default onRevert", async () => {
      const customSpy = jasmine.createSpy("customRevert");
      const promise = helper.confirmDiscard();
      helper.onConfirmDiscard(customSpy);

      expect(customSpy).toHaveBeenCalled();
      expect(revertSpy).not.toHaveBeenCalled();
      const result = await promise;
      expect(result).toBeTrue();
    });
  });

  describe("auto-save scheduling and deactivation", () => {
    let mockUndoManager: { commitState: jasmine.Spy };
    let mockLogger: { error: jasmine.Spy };

    beforeEach(() => {
      mockUndoManager = { commitState: jasmine.createSpy("commitState") };
      mockLogger = { error: jasmine.createSpy("error") };
    });

    it("should schedule and execute an auto-save operation", async () => {
      let saved = false;
      helper = new EditorLifecycleHelper({
        cdr: mockCdr,
        onAutoSave: () => {
          saved = true;
          return Promise.resolve();
        },
      });

      expect(helper.isSaving).toBeFalse();
      await helper.scheduleAutoSave();
      expect(saved).toBeTrue();
      expect(helper.isSaving).toBeFalse();
    });

    it("should chain in-flight save and execute follow-up save if changes remain", async () => {
      let saveCount = 0;
      let hasChanges = true;
      let resolveFirstSave: () => void = () => {};

      const firstPromise = new Promise<void>((resolve) => {
        resolveFirstSave = resolve;
      });

      helper = new EditorLifecycleHelper({
        cdr: mockCdr,
        hasChanges: () => hasChanges,
        isSaveValid: () => true,
      });

      // First save
      const p1 = helper.scheduleAutoSave(() => {
        saveCount++;
        return firstPromise;
      });
      expect(helper.isSaving).toBeTrue();

      // Second save triggered while first is in flight
      const p2 = helper.scheduleAutoSave(() => {
        saveCount++;
        hasChanges = false;
        return Promise.resolve();
      });

      // Finish first save
      resolveFirstSave();
      await p1;
      await p2;

      expect(saveCount).toBe(2);
      expect(helper.isSaving).toBeFalse();
    });

    it("should exit immediately without modal if hasChanges returns false and autoSaveOnDiscard is true", async () => {
      helper = new EditorLifecycleHelper({
        cdr: mockCdr,
        undoManager: mockUndoManager,
        hasChanges: () => false,
        autoSaveOnDiscard: true,
      });

      const canDeactivate = await helper.confirmDiscard();
      expect(mockUndoManager.commitState).toHaveBeenCalled();
      expect(canDeactivate).toBeTrue();
      expect(helper.showDiscardConfirm).toBeFalse();
    });

    it("should prompt discard confirmation modal directly when autoSaveOnDiscard is false even if hasChanges is false", async () => {
      helper = new EditorLifecycleHelper({
        cdr: mockCdr,
        undoManager: mockUndoManager,
        hasChanges: () => false,
        autoSaveOnDiscard: false,
      });

      const promise = helper.confirmDiscard();
      expect(mockUndoManager.commitState).toHaveBeenCalled();
      expect(helper.showDiscardConfirm).toBeTrue();

      helper.onConfirmDiscard();
      const result = await promise;
      expect(result).toBeTrue();
    });

    it("should handle synchronous saves without leaving stale activeSavePromise", () => {
      let isSaving = false;
      helper = new EditorLifecycleHelper({
        isSaving: () => isSaving,
      });

      const syncSaveSpy = jasmine.createSpy("syncSave").and.callFake(() => {
        isSaving = false;
        return Promise.resolve("done");
      });

      helper.scheduleAutoSave(syncSaveSpy);
      expect(helper.isSaving).toBeFalse();
      expect(helper.activeSavePromise).toBeNull();
      expect(syncSaveSpy).toHaveBeenCalledTimes(1);

      helper.scheduleAutoSave(syncSaveSpy);
      expect(syncSaveSpy).toHaveBeenCalledTimes(2);
    });

    it("should await in-flight save during confirmDiscard and exit cleanly if changes cleared", async () => {
      let dirty = true;
      let inFlightFinished = false;

      helper = new EditorLifecycleHelper({
        cdr: mockCdr,
        undoManager: mockUndoManager,
        hasChanges: () => dirty,
      });

      const inFlightSave = new Promise<void>((resolve) => {
        setTimeout(() => {
          inFlightFinished = true;
          dirty = false;
          resolve();
        }, 15);
      });

      helper.activeSavePromise = inFlightSave;

      const canDeactivate = await helper.confirmDiscard();
      expect(inFlightFinished).toBeTrue();
      expect(canDeactivate).toBeTrue();
      expect(helper.showDiscardConfirm).toBeFalse();
    });

    it("should trigger onAutoSave during confirmDiscard and approve deactivation if save clears changes", async () => {
      let dirty = true;

      helper = new EditorLifecycleHelper({
        cdr: mockCdr,
        undoManager: mockUndoManager,
        hasChanges: () => dirty,
        isSaveValid: () => true,
        autoSaveOnDiscard: true,
        onAutoSave: () => {
          dirty = false;
          return Promise.resolve();
        },
      });

      const canDeactivate = await helper.confirmDiscard();
      expect(canDeactivate).toBeTrue();
      expect(helper.showDiscardConfirm).toBeFalse();
    });

    it("should display modal if final auto-save fails", async () => {
      helper = new EditorLifecycleHelper({
        cdr: mockCdr,
        undoManager: mockUndoManager,
        hasChanges: () => true,
        isSaveValid: () => true,
        autoSaveOnDiscard: true,
        onAutoSave: () => Promise.reject(new Error("Network Error")),
        logger: mockLogger,
      });

      const promise = helper.confirmDiscard();
      await Promise.resolve();
      await Promise.resolve();

      expect(helper.showDiscardConfirm).toBeTrue();
      expect(mockLogger.error).toHaveBeenCalled();

      helper.onConfirmDiscard();
      const result = await promise;
      expect(result).toBeTrue();
    });

    it("should display modal if isSaveValid returns false", async () => {
      helper = new EditorLifecycleHelper({
        cdr: mockCdr,
        undoManager: mockUndoManager,
        hasChanges: () => true,
        isSaveValid: () => false,
        autoSaveOnDiscard: true,
        onAutoSave: jasmine.createSpy("onAutoSave"),
      });

      const promise = helper.confirmDiscard();
      expect(helper.showDiscardConfirm).toBeTrue();

      helper.onCancelDiscard();
      const result = await promise;
      expect(result).toBeFalse();
    });
  });
});
