import { TestBed } from "@angular/core/testing";
import { DirtyComponent } from "@app/interfaces/dirty-component";
import { TranslationService } from "@app/services/translation.service";
import { mockTranslationService } from "@app/testing/unit-test-mocks";

import { DirtyCheckGuard } from "./dirty-check.guard";

describe("DirtyCheckGuard", () => {
  let guard: DirtyCheckGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DirtyCheckGuard,
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    });
    guard = TestBed.inject(DirtyCheckGuard);
  });

  it("should allow deactivation if component has no changes", () => {
    const component: DirtyComponent = {
      hasChanges: () => false,
      isNavigationApproved: false,
    };
    expect(guard.canDeactivate(component)).toBeTrue();
  });

  it("should allow deactivation if navigation is approved", () => {
    const component: DirtyComponent = {
      hasChanges: () => true,
      isNavigationApproved: true,
    };
    expect(guard.canDeactivate(component)).toBeTrue();
  });

  it("should delegate to confirmDiscard if provided by component", () => {
    const component: DirtyComponent & { confirmDiscard: () => boolean } = {
      hasChanges: () => true,
      isNavigationApproved: false,
      confirmDiscard: jasmine.createSpy("confirmDiscard").and.returnValue(true),
    };
    expect(guard.canDeactivate(component)).toBeTrue();
    expect(component.confirmDiscard).toHaveBeenCalled();
  });

  it("should fallback to window.confirm with formatted unsaved reasons", () => {
    const confirmSpy = spyOn(window, "confirm").and.returnValue(true);
    const component: DirtyComponent = {
      hasChanges: () => true,
      isNavigationApproved: false,
      getUnsavedReasons: () => ["DISCARD_REASON_DRIVER_NAME_EMPTY"],
    };
    expect(guard.canDeactivate(component)).toBeTrue();
    expect(confirmSpy).toHaveBeenCalledWith(
      jasmine.stringMatching(/DISCARD_REASON_DRIVER_NAME_EMPTY/),
    );
  });

  it("should fallback to window.confirm when getUnsavedReasons is not defined", () => {
    const confirmSpy = spyOn(window, "confirm").and.returnValue(false);
    const component: DirtyComponent = {
      hasChanges: () => true,
      isNavigationApproved: false,
    };
    expect(guard.canDeactivate(component)).toBeFalse();
    expect(confirmSpy).toHaveBeenCalled();
  });
});
