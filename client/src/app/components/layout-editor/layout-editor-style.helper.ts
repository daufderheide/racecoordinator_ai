import { canDuplicate } from "@app/components/ui-editor/duplicate.utils";
import {
  copyStyle as copyWidgetStyle,
  pasteStyle as pasteWidgetStyle,
} from "@app/components/ui-editor/style-copy.utils";
import {
  handleDuplicateWidgets,
  handlePasteStyle,
} from "@app/components/ui-editor/ui-editor-widget.helper";

/**
 * Copy / paste style (phase 5a) and duplicate (phase 5c) for the Layout
 * Editor. `comp` is the LayoutEditorComponent, as in
 * layout-editor-actions.helper.ts.
 */

/** A Layout Editor shortcut for copy / paste style or duplicate. */
export type EditShortcut = "copyStyle" | "pasteStyle" | "duplicate";

function isTyping(event: KeyboardEvent): boolean {
  const t = event.target as HTMLElement | null;
  return (
    !!t &&
    (t.tagName === "INPUT" ||
      t.tagName === "TEXTAREA" ||
      t.tagName === "SELECT" ||
      t.isContentEditable)
  );
}

/**
 * Ctrl+Alt+C / Ctrl+Alt+V copy / paste style; Ctrl+D duplicates. AltGr
 * reports Ctrl+Alt too, so it is skipped: typing é / ć must not trigger
 * this. Nothing while typing in a field.
 */
export function editShortcut(event: KeyboardEvent): EditShortcut | null {
  if (!(event.ctrlKey || event.metaKey) || isTyping(event)) return null;
  if (event.altKey) {
    if (event.getModifierState?.("AltGraph")) return null;
    if (event.code === "KeyC") return "copyStyle";
    if (event.code === "KeyV") return "pasteStyle";
    return null;
  }
  return !event.shiftKey && event.code === "KeyD" ? "duplicate" : null;
}

/** Copy the main selected widget's style. */
export function copyStyleInEditor(comp: any): void {
  const widget = comp.currentSelectedWidget;
  if (!widget) return;
  const copy = copyWidgetStyle(comp.getInspectorSchema(widget), widget);
  if (!copy) return;
  comp.styleClipboard.set(copy);
  comp.racedayComp?.showCanvasNote?.("UE_STYLE_COPIED");
  comp.cdr.markForCheck();
}

/**
 * Paste the copied style on the selection. One widget goes through the
 * normal change path, so a grid column passes it on to every lane; several
 * are one undo step.
 */
export function pasteStyleInEditor(comp: any): void {
  const copy = comp.styleClipboard.copied();
  if (!copy) {
    comp.racedayComp?.showCanvasNote?.("UE_STYLE_NOTHING");
    return;
  }
  const ids: string[] = comp.selectedWidgetIds;
  if (!ids.length) return;
  let changed = 0;
  if (ids.length === 1) {
    const widget = comp.currentSelectedWidget;
    if (!widget) return;
    changed = pasteWidgetStyle(copy, comp.getInspectorSchema(widget), widget);
    if (changed) comp.onWidgetInspectorChange(widget);
  } else {
    changed = handlePasteStyle(
      comp,
      copy,
      ids,
      (w) => comp.getInspectorSchema(w),
      comp.editingLayout ?? undefined,
    );
  }
  if (changed) comp.racedayComp?.showCanvasNote?.("UE_STYLE_PASTED");
  comp.cdr.markForCheck();
}

/** The selected ids that can be duplicated (not grid columns, menu bar, countdown). */
export function duplicableIds(widgets: any[], ids: string[]): string[] {
  const byId = new Map<string, any>(widgets.map((w: any) => [w.id, w]));
  return ids.filter((id) => canDuplicate(byId.get(id)));
}

/**
 * Duplicate the selection, as one undo step. The copies are selected
 * afterwards; the copy of the main widget is main.
 */
export function duplicateInEditor(comp: any): void {
  const ids: string[] = comp.selectedWidgetIds;
  if (!ids.length || !comp.editingLayout) return;
  const sources = duplicableIds(comp.getLayoutWidgets(), ids);
  if (!sources.length) {
    comp.racedayComp?.showCanvasNote?.("UE_DUPLICATE_NOT_POSSIBLE");
    return;
  }
  const newIds = handleDuplicateWidgets(comp, sources, comp.editingLayout);
  if (!newIds.length) return;
  const mainIndex = Math.max(0, sources.indexOf(comp.selectedWidgetId));
  const main = newIds[mainIndex];
  comp.applySelection({
    main,
    extras: newIds.filter((id: string) => id !== main),
  });
  comp.racedayComp?.showCanvasNote?.("UE_DUPLICATED");
}
