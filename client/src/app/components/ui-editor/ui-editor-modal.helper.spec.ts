import { CustomUI } from "@app/models/custom-ui";
import { Theme } from "@app/models/theme";

import {
  acknowledgeSuccessModal,
  cancelDeleteCustomUiModal,
  cancelDeleteThemeModal,
  getUnsavedReasonsHelper,
  openDeleteCustomUiModal,
  openDeleteThemeModal,
  openSuccessModal,
} from "./ui-editor-modal.helper";

describe("ui-editor-modal.helper", () => {
  let ctx: any;
  let sampleTheme: Theme;
  let sampleUi: CustomUI;

  beforeEach(() => {
    sampleTheme = {
      entity_id: "t1",
      name: "Custom Theme",
      is_default: false,
      slots: {},
      audio_slots: {},
    };

    sampleUi = {
      entity_id: "u1",
      name: "Custom UI",
      is_default: false,
    };

    ctx = {
      showSuccessModal: false,
      successModalTitle: "",
      successModalMessage: "",
      successModalParams: {},
      themeToCollapseAfterSuccess: null,
      showDeleteConfirm: false,
      themeToDelete: null,
      deleteThemeParams: {},
      showDeleteUiConfirm: false,
      uiToDelete: null,
      deleteUiParams: {},
      editingState: {
        themes: [sampleTheme],
      },
      sectionsExpanded: {
        theme_t1: true,
      },
      saveExpanderState: jasmine.createSpy("saveExpanderState"),
      cdr: {
        markForCheck: jasmine.createSpy("markForCheck"),
      },
    };
  });

  it("should open success modal with parameters", () => {
    openSuccessModal(
      ctx,
      { title: "Success", message: "Saved successfully", params: { x: 1 } },
      "t1",
    );
    expect(ctx.showSuccessModal).toBeTrue();
    expect(ctx.successModalTitle).toBe("Success");
    expect(ctx.successModalMessage).toBe("Saved successfully");
    expect(ctx.successModalParams).toEqual({ x: 1 });
    expect(ctx.themeToCollapseAfterSuccess).toBe("t1");
  });

  it("should acknowledge success modal and collapse theme", () => {
    ctx.showSuccessModal = true;
    acknowledgeSuccessModal(ctx);
    expect(ctx.showSuccessModal).toBeFalse();
    expect(ctx.sectionsExpanded["theme_t1"]).toBeFalse();
    expect(ctx.saveExpanderState).toHaveBeenCalled();
    expect(ctx.cdr.markForCheck).toHaveBeenCalled();
  });

  it("should open and cancel delete theme modal", () => {
    openDeleteThemeModal(ctx, sampleTheme);
    expect(ctx.showDeleteConfirm).toBeTrue();
    expect(ctx.themeToDelete).toBe(sampleTheme);
    expect(ctx.deleteThemeParams).toEqual({ name: "Custom Theme" });
    expect(ctx.cdr.markForCheck).toHaveBeenCalled();

    cancelDeleteThemeModal(ctx);
    expect(ctx.showDeleteConfirm).toBeFalse();
    expect(ctx.themeToDelete).toBeNull();
  });

  it("should open and cancel delete custom UI modal", () => {
    openDeleteCustomUiModal(ctx, sampleUi);
    expect(ctx.showDeleteUiConfirm).toBeTrue();
    expect(ctx.uiToDelete).toBe(sampleUi);
    expect(ctx.deleteUiParams).toEqual({ name: "Custom UI" });
    expect(ctx.cdr.markForCheck).toHaveBeenCalled();

    cancelDeleteCustomUiModal(ctx);
    expect(ctx.showDeleteUiConfirm).toBeFalse();
    expect(ctx.uiToDelete).toBeNull();
  });

  it("should return unsaved reasons correctly based on component state", () => {
    const comp: any = {
      isAnyThemeNameInvalid: () => true,
      isAnyCustomUiNameInvalid: () => true,
      isSaving: true,
      hasChanges: () => true,
    };
    let reasons = getUnsavedReasonsHelper(comp);
    expect(reasons).toContain("DISCARD_REASON_THEME_NAME_INVALID");
    expect(reasons).toContain("DISCARD_REASON_CUSTOM_UI_NAME_INVALID");
    expect(reasons).toContain("DISCARD_REASON_SAVING");

    comp.isSaving = false;
    comp.isAnyThemeNameInvalid = () => false;
    comp.isAnyCustomUiNameInvalid = () => false;
    reasons = getUnsavedReasonsHelper(comp);
    expect(reasons).toEqual(["DISCARD_REASON_EXIT_TOO_QUICKLY"]);

    comp.hasChanges = () => false;
    reasons = getUnsavedReasonsHelper(comp);
    expect(reasons).toEqual([]);
  });
});
