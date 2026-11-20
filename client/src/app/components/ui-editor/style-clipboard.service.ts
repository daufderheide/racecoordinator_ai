import { Injectable, signal } from "@angular/core";

import { StyleCopy } from "./style-copy.utils";

const STORAGE_KEY = "rcai.layoutEditor.styleClipboard";

/**
 * The copied widget style (phase 5a). Kept for the whole app session, so a
 * style copied in one layout can be pasted in another, and in
 * sessionStorage so a page reload doesn't lose it. Never stored in a layout.
 */
@Injectable({ providedIn: "root" })
export class StyleClipboardService {
  readonly copied = signal<StyleCopy | null>(StyleClipboardService.load());

  set(copy: StyleCopy | null): void {
    this.copied.set(copy);
    try {
      if (copy) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(copy));
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // storage blocked: the copy still works for this page
    }
  }

  private static load(): StyleCopy | null {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      return parsed && parsed.values && parsed.widgetType ? parsed : null;
    } catch {
      return null;
    }
  }
}
