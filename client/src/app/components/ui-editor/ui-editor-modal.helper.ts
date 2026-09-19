import { CustomUI } from "@app/models/custom-ui";
import { Theme } from "@app/models/theme";

export function openSuccessModal(
  comp: any,
  params?: { title?: string; message?: string; params?: any },
  collapseThemeId: string | null = null,
  focusThemeId: string | null = null,
): void {
  comp.themeToCollapseAfterSuccess = collapseThemeId;
  comp.themeToFocusAfterSuccess = focusThemeId;
  comp.successModalTitle = params?.title || "";
  comp.successModalMessage = params?.message || "";
  comp.successModalParams = params?.params || {};
  comp.showSuccessModal = true;
}

export function acknowledgeSuccessModal(comp: any): void {
  comp.showSuccessModal = false;
  comp.successModalTitle = "";
  comp.successModalMessage = "";
  comp.successModalParams = {};
  comp.themeToCollapseAfterSuccess = null;
  comp.editingState.themes.forEach((t: Theme) => {
    comp.sectionsExpanded[`theme_${t.entity_id}`] = false;
  });
  const focusThemeId = comp.themeToFocusAfterSuccess;
  comp.themeToFocusAfterSuccess = null;
  if (focusThemeId) {
    comp.focusThemeNameInput?.(focusThemeId);
  }
  comp.saveExpanderState();
  comp.cdr.markForCheck();
}

export function openDeleteThemeModal(comp: any, theme: Theme): void {
  comp.themeToDelete = theme;
  comp.deleteThemeParams = { name: theme.name };
  comp.showDeleteConfirm = true;
  comp.cdr.markForCheck();
}

export function cancelDeleteThemeModal(comp: any): void {
  comp.showDeleteConfirm = false;
  comp.themeToDelete = null;
  comp.deleteThemeParams = {};
}

export function openDeleteCustomUiModal(comp: any, ui: CustomUI): void {
  comp.uiToDelete = ui;
  comp.deleteUiParams = { name: ui.name };
  comp.showDeleteUiConfirm = true;
  comp.cdr.markForCheck();
}

export function cancelDeleteCustomUiModal(comp: any): void {
  comp.showDeleteUiConfirm = false;
  comp.uiToDelete = null;
  comp.cdr.markForCheck();
}

export function getUnsavedReasonsHelper(comp: any): string[] {
  const reasons: string[] = [];
  if (comp.isAnyThemeNameInvalid()) {
    reasons.push("DISCARD_REASON_THEME_NAME_INVALID");
  }
  if (comp.isAnyCustomUiNameInvalid()) {
    reasons.push("DISCARD_REASON_CUSTOM_UI_NAME_INVALID");
  }

  if (comp.isSaving) {
    reasons.push("DISCARD_REASON_SAVING");
  } else if (reasons.length === 0 && comp.hasChanges()) {
    reasons.push("DISCARD_REASON_EXIT_TOO_QUICKLY");
  }

  return reasons;
}

export function focusUiEditorElement(id: string): void {
  setTimeout(() => {
    const el = document.getElementById(id);
    if (el) (el as HTMLInputElement).focus();
  }, 150);
}

export function openReplicateLaneModalHelper(comp: any, ui?: CustomUI): void {
  comp.replicateTargetUi = ui || comp.activeCustomUi;
  comp.replicateBindingMode =
    comp.currentSelectedWidget?.customSettings?.["bindingMode"] || "lane";
  comp.replicateSourceIndex = Number(
    comp.currentSelectedWidget?.customSettings?.["targetIndex"] ?? 0,
  );
  comp.replicateDefaultCount = comp.track?.lanes?.length || 4;
  comp.showReplicateLaneModal = true;
}

export function confirmReplicateLanesHelper(comp: any, options: any): void {
  comp.showReplicateLaneModal = false;
  comp.onReplicateLanes(options, comp.replicateTargetUi);
}
