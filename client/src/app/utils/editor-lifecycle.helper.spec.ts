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
});
