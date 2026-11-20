import { CommonModule } from "@angular/common";
import {
  Component,
  effect,
  ElementRef,
  HostListener,
  inject,
  input,
  OnDestroy,
  output,
  signal,
  untracked,
  viewChild,
  ViewEncapsulation,
} from "@angular/core";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { TranslationService } from "@app/services/translation.service";

import {
  GeometryChange,
  InspectorFormComponent,
  ResetEvent,
} from "./inspector-form.component";
import {
  allFields,
  fieldSource,
  InspectorSchema,
  isFieldChanged,
  registryDefaults,
} from "./inspector-schema";

export type PanelTheme = "yellow" | "dark";
export const PANEL_THEME_STORAGE_KEY = "rcai.layoutEditor.panelTheme";

/** Reads the stored panel colour; yellow unless the user chose dark. */
export function readPanelTheme(): PanelTheme {
  try {
    return localStorage.getItem(PANEL_THEME_STORAGE_KEY) === "dark"
      ? "dark"
      : "yellow";
  } catch {
    return "yellow";
  }
}

/**
 * The redesigned Widget Configuration panel: header, search, "changed only"
 * filter, folders and the yellow / dark colour switch. Widgets with a schema
 * get the new form; the others show their existing inspector (projected
 * content) as one "All settings" folder.
 */
@Component({
  standalone: true,
  selector: "app-inspector-shell",
  templateUrl: "./inspector-shell.component.html",
  styleUrls: ["./inspector-kit.css"],
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, TranslatePipe, InspectorFormComponent],
})
export class InspectorShellComponent implements OnDestroy {
  widget = input.required<any>();
  schema = input<InspectorSchema | null>(null);
  displayName = input("");
  typeLabelKey = input("");
  /** Number of lanes on the track, for limits such as a target lane. */
  totalLanes = input(4);
  /** Editor data some embedded parts work on (Lane View columns). */
  globalSettings = input<any>(null);
  customUi = input<any>(null);
  availableColumns = input<{ key: string; label: string }[]>([]);
  isPracticeMode = input(false);
  widthLocked = input(false);
  heightLocked = input(false);
  canNavigate = input(true);

  /** Emits the widget whose settings were changed (the same object the form edited). */
  widgetChange = output<any>();
  geometryChange = output<GeometryChange>();
  deleteWidget = output<void>();
  previous = output<void>();
  next = output<void>();
  undo = output<void>();

  private translation = inject(TranslationService);
  private searchInput = viewChild<ElementRef<HTMLInputElement>>("search");

  theme = signal<PanelTheme>(readPanelTheme());
  query = signal("");
  onlyChanged = signal(false);
  allSettingsOpen = signal(true);
  toast = signal<{ message: string; undo: boolean } | null>(null);
  private toastTimer: any = null;

  /**
   * The settings object the form edits. Some widgets (Branding Image, QR Code)
   * are created without customSettings; the form needs an object to write into,
   * so it is added here and saved with the first change.
   */
  /** Widget id + type the schema's onOpen last ran for. */
  private openedFor = "";

  constructor() {
    // A schema's onOpen (fill defaults, migrate old values) runs once per
    // selected widget, like the old inspectors did when they opened.
    effect(() => {
      const w = this.widget();
      const schema = this.schema();
      untracked(() => this.runOnOpen(w, schema));
    });
  }

  private runOnOpen(w: any, schema: InspectorSchema | null): void {
    const key = w && schema ? `${w.id}|${schema.widgetType}` : "";
    if (!key || key === this.openedFor) return;
    this.openedFor = key;
    if (!schema?.onOpen) return;
    const changed = schema.onOpen(this.formSettings(), {
      widget: w,
      totalLanes: this.totalLanes() || 4,
    });
    if (changed) this.widgetChange.emit(w);
  }

  formSettings(): Record<string, any> {
    const w = this.widget();
    if (!w) return {};
    if (!w.customSettings) w.customSettings = {};
    return w.customSettings;
  }

  changedCount(): number {
    const schema = this.schema();
    const settings = this.widget()?.customSettings;
    if (!schema || !settings) return 0;
    const defaults = registryDefaults(schema.widgetType);
    return allFields(schema).filter(
      (f) =>
        f.type !== "geometry" &&
        isFieldChanged(f, fieldSource(f, settings, this.widget()), defaults),
    ).length;
  }

  toggleTheme(): void {
    const next: PanelTheme = this.theme() === "dark" ? "yellow" : "dark";
    this.theme.set(next);
    try {
      localStorage.setItem(PANEL_THEME_STORAGE_KEY, next);
    } catch {
      // Private mode or blocked storage: the switch still works for this visit.
    }
  }

  onSearch(value: string): void {
    this.query.set(value);
  }

  clearSearch(): void {
    this.query.set("");
    const el = this.searchInput()?.nativeElement;
    if (el) el.value = "";
  }

  onReset(event: ResetEvent): void {
    const name = this.translation.translate(event.labelKey);
    this.showToast(
      this.translation.translate("UE_KIT_RESET_DONE", { name }),
      true,
    );
  }

  onUndo(): void {
    this.undo.emit();
    this.hideToast();
  }

  showToast(message: string, undo: boolean): void {
    this.toast.set({ message, undo });
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.hideToast(), 4000);
  }

  hideToast(): void {
    clearTimeout(this.toastTimer);
    this.toast.set(null);
  }

  /** "/" jumps to search unless you are typing somewhere; Esc clears it. */
  @HostListener("document:keydown", ["$event"])
  onKey(event: KeyboardEvent): void {
    const el = this.searchInput()?.nativeElement;
    if (!el) return;
    const active = document.activeElement as HTMLElement | null;
    const typing =
      !!active &&
      (/^(INPUT|SELECT|TEXTAREA)$/.test(active.tagName) ||
        active.isContentEditable);
    if (event.key === "/" && !typing) {
      event.preventDefault();
      el.focus();
    } else if (event.key === "Escape" && active === el) {
      this.clearSearch();
      el.blur();
    }
  }

  ngOnDestroy(): void {
    clearTimeout(this.toastTimer);
  }
}
