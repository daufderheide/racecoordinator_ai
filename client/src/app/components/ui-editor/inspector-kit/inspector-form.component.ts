import { CommonModule } from "@angular/common";
import { Component, computed, inject, input, output } from "@angular/core";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { FontService } from "@app/services/font.service";
import { shadowFor } from "@app/utils/widget-style.utils";
import { TranslationService } from "@app/services/translation.service";

import {
  defaultFor,
  fieldKeys,
  fieldMatches,
  fieldSource,
  FOLDER_META,
  FOLDER_ORDER,
  InspectorActions,
  InspectorContext,
  InspectorField,
  InspectorFolder,
  InspectorFolderId,
  InspectorGroup,
  InspectorOption,
  InspectorSchema,
  isFieldChanged,
  isFieldVisible,
  registryDefaults,
  resetFieldWhereStored,
  TextPartField,
  writeFieldKey,
} from "./inspector-schema";
import { folderSummary } from "./inspector-summary";
import { KitColorComponent } from "./kit-color.component";
import { KitImageComponent } from "./kit-image.component";
import { KitStepperComponent } from "./kit-stepper.component";

export interface GeometryChange {
  prop: "x" | "y" | "width" | "height";
  value: number;
}

/** The settings a text part can have. */
export type TextPartKey = keyof TextPartField["keys"];

export interface ResetEvent {
  /** Translation key of what was reset (field label or folder name). */
  labelKey: string;
  /** Literal name, when the field has no translation key. */
  label?: string;
}

/** Folders opened per widget type, remembered while the editor is open. */
const openFolders = new Map<string, Set<InspectorFolderId>>();
/** Text parts opened per widget type. */
const openParts = new Map<string, Set<string>>();

/** Forget which folders and text parts were open (used by tests). */
export function resetInspectorFormMemory(): void {
  openFolders.clear();
  openParts.clear();
}

interface VisibleFolder {
  folder: InspectorFolder;
  groups: InspectorGroup[];
  open: boolean;
  changed: number;
}

/**
 * Draws a widget's settings from its schema: folders in a fixed order,
 * groups, label-left rows, changed dots and resets, search and smart
 * visibility. It changes `settings` in place and emits `settingsChange`, the same way
 * the existing inspectors do, so undo and saving work as before.
 */
@Component({
  standalone: true,
  selector: "app-inspector-form",
  templateUrl: "./inspector-form.component.html",
  imports: [
    CommonModule,
    TranslatePipe,
    KitStepperComponent,
    KitColorComponent,
    KitImageComponent,
  ],
})
export class InspectorFormComponent {
  schema = input.required<InspectorSchema>();
  settings = input.required<Record<string, any>>();
  widget = input<any>(null);
  query = input("");
  onlyChanged = input(false);
  /** Number of lanes on the track (for limits such as a target lane). */
  totalLanes = input(4);
  /** Editor data some embedded parts work on (Lane View columns). */
  globalSettings = input<any>(null);
  customUi = input<any>(null);
  availableColumns = input<{ key: string; label: string }[]>([]);
  isPracticeMode = input(false);
  /** Lane Column: the inset clicked on the canvas, the open tab, editor handlers. */
  selectedAnchor = input<string | null>(null);
  selectionToken = input(0);
  activeTab = input<string | null>(null);
  actions = input<InspectorActions | null>(null);
  widthLocked = input(false);
  heightLocked = input(false);
  /** Bumped by the shell after any change so computed values refresh. */
  revision = input(0);

  settingsChange = output<void>();
  geometryChange = output<GeometryChange>();
  reset = output<ResetEvent>();

  private translation = inject(TranslationService);
  fontService = inject(FontService);
  keepRatio = false;
  private localRevision = 0;

  readonly meta = FOLDER_META;

  defaults = computed(() => registryDefaults(this.schema().widgetType));

  private t = (key: string) => this.translation.translate(key);

  folders(): VisibleFolder[] {
    // Read the inputs so Angular re-renders when they change.
    this.revision();
    const schema = this.schema();
    const settings = this.settings() || {};
    const query = this.query();
    const onlyChanged = this.onlyChanged();
    const filtering = !!query.trim() || onlyChanged;
    const opened = this.openSet();
    const result: VisibleFolder[] = [];
    for (const id of FOLDER_ORDER) {
      const folder = schema.folders.find((f) => f.id === id);
      if (!folder) continue;
      const groups = folder.groups
        .map((g) => ({
          ...g,
          fields: g.fields.filter(
            (f) =>
              isFieldVisible(f, settings, this.context()) &&
              fieldMatches(f, query, this.t) &&
              (!onlyChanged || this.isChanged(f)),
          ),
        }))
        .filter((g) => g.fields.length > 0);
      if (filtering && groups.length === 0) continue;
      result.push({
        folder,
        groups,
        open: filtering || opened.has(id),
        changed: folder.groups
          .flatMap((g) => g.fields)
          .filter((f) => this.isChanged(f)).length,
      });
    }
    return result;
  }

  hasResults(): boolean {
    return this.folders().length > 0;
  }

  private openSet(): Set<InspectorFolderId> {
    const type = this.schema().widgetType;
    if (!openFolders.has(type)) openFolders.set(type, new Set(["content"]));
    return openFolders.get(type)!;
  }

  toggleFolder(id: InspectorFolderId): void {
    const set = this.openSet();
    if (set.has(id)) set.delete(id);
    else set.add(id);
  }

  summary(folder: InspectorFolder): string {
    // fields stored on the widget itself are summarised from there
    const view = { ...(this.settings() || {}) };
    for (const field of folder.groups.flatMap((g) => g.fields)) {
      if (field.on === "widget" || field.on === "both") {
        for (const key of fieldKeys(field)) view[key] = this.widget()?.[key];
      }
    }
    return folderSummary(folder, view, this.widget(), this.t);
  }

  isChanged(field: InspectorField): boolean {
    if (field.type === "geometry") return false;
    return isFieldChanged(field, this.source(field), this.defaults());
  }

  isHit(field: InspectorField): boolean {
    return !!this.query().trim() && fieldMatches(field, this.query(), this.t);
  }

  /** Label split around the search term so it can be highlighted. */
  /** A field's label: its literal text when it has one, else the translation. */
  labelOf(field: InspectorField): string {
    return field.label ?? this.t(field.labelKey);
  }

  /** A field's help text, if any (literal or translated). */
  helpOf(field: InspectorField): string {
    return field.help ?? (field.helpKey ? this.t(field.helpKey) : "");
  }

  labelParts(label: string): { text: string; hit: boolean }[] {
    const q = this.query().trim().toLowerCase();
    const i = q ? label.toLowerCase().indexOf(q) : -1;
    if (i < 0) return [{ text: label, hit: false }];
    return [
      { text: label.slice(0, i), hit: false },
      { text: label.slice(i, i + q.length), hit: true },
      { text: label.slice(i + q.length), hit: false },
    ].filter((p) => p.text);
  }

  context(): InspectorContext {
    return {
      widget: this.widget(),
      totalLanes: this.totalLanes() || 4,
      globalSettings: this.globalSettings(),
      customUi: this.customUi(),
      availableColumns: this.availableColumns(),
      isPracticeMode: this.isPracticeMode(),
      selectedAnchor: this.selectedAnchor(),
      selectionToken: this.selectionToken(),
      activeTab: this.activeTab(),
      actions: this.actions() || undefined,
    };
  }

  value(field: InspectorField): any {
    if (field.read) {
      return field.read(this.settings() || {});
    }
    if (!("key" in field)) return undefined;
    const v = this.source(field)?.[field.key];
    return v === undefined || v === null
      ? defaultFor(field, field.key, this.defaults())
      : v;
  }

  /** Letter spacing for the sample chip, or nothing when not set. */
  partSpacing(field: TextPartField): string | null {
    if (!field.keys.spacing) return null;
    const v = this.partValue(field, "spacing");
    return v === undefined || v === null || v === "" ? null : `${v}px`;
  }

  partValue(field: TextPartField, part: TextPartKey): any {
    const key = field.keys[part];
    if (!key) return undefined;
    const v = this.source(field)?.[key];
    return v === undefined || v === null
      ? defaultFor(field, key, this.defaults())
      : v;
  }

  /**
   * Whether an option is the current value. Older inspectors stored some numbers
   * as text ("2"), so 2 and "2" count as the same choice.
   */
  isOption(field: InspectorField, o: InspectorOption): boolean {
    const v = this.value(field);
    if (v === undefined || v === null) return false;
    return String(v) === String(o.value);
  }

  optionLabel(o: InspectorOption): string {
    return o.labelKey ? this.t(o.labelKey) : (o.label ?? String(o.value));
  }

  partColorVisible(field: TextPartField): boolean {
    return (
      !field.colorVisibleWhen || field.colorVisibleWhen(this.settings() || {})
    );
  }

  /** Called by an embedded part after it changed the widget or the editor data. */
  private readonly embedNotify = () => {
    this.localRevision++;
    this.settingsChange.emit();
  };

  /** Inputs for an embedded part (see EmbedField). */
  embedInputs(): Record<string, unknown> {
    return {
      settings: this.settings(),
      widget: this.widget(),
      context: this.context(),
      notify: this.embedNotify,
    };
  }

  /** Stores a field's value: through its `write` when it has one, else its key. */
  setField(field: InspectorField, value: any): void {
    const s = this.settings();
    if (!s) return;
    if (field.write) {
      field.write(s, value, this.context());
      this.localRevision++;
      this.settingsChange.emit();
      return;
    }
    if ("key" in field) this.setKey(field, field.key, value);
  }

  /** The object a field reads from (customSettings or the widget itself). */
  source(field: InspectorField): Record<string, any> {
    return fieldSource(field, this.settings(), this.widget());
  }

  private setKey(field: InspectorField, key: string, value: any): void {
    writeFieldKey(field, this.settings(), this.widget(), key, value);
    this.localRevision++;
    this.settingsChange.emit();
  }

  maxFor(field: InspectorField): number {
    if (field.type !== "stepper") return 100;
    return field.maxFrom ? field.maxFrom(this.context()) : field.max;
  }

  set(key: string, value: any): void {
    const s = this.settings();
    if (!s) return;
    s[key] = value;
    this.localRevision++;
    this.settingsChange.emit();
  }

  setPart(field: TextPartField, part: TextPartKey, value: any): void {
    const key = field.keys[part];
    if (key) this.setKey(field, key, value);
  }

  toggle(key: string, current: boolean): void {
    this.set(key, !current);
  }

  resetOne(field: InspectorField): void {
    resetFieldWhereStored(
      field,
      this.settings(),
      this.widget(),
      this.defaults(),
    );
    this.settingsChange.emit();
    this.reset.emit({ labelKey: field.labelKey, label: field.label });
  }

  resetFolder(folder: InspectorFolder): void {
    for (const field of folder.groups.flatMap((g) => g.fields)) {
      if (this.isChanged(field))
        resetFieldWhereStored(
          field,
          this.settings(),
          this.widget(),
          this.defaults(),
        );
    }
    this.settingsChange.emit();
    this.reset.emit({ labelKey: FOLDER_META[folder.id].labelKey });
  }

  // ----- text parts -----

  partKey(field: TextPartField): string {
    return this.schema().widgetType + ":" + field.id;
  }

  isPartOpen(field: TextPartField): boolean {
    if (this.query().trim() && this.isHit(field)) return true;
    return openParts.get(this.schema().widgetType)?.has(field.id) ?? false;
  }

  togglePart(field: TextPartField): void {
    const type = this.schema().widgetType;
    if (!openParts.has(type)) openParts.set(type, new Set());
    const set = openParts.get(type)!;
    if (set.has(field.id)) set.delete(field.id);
    else set.add(field.id);
  }

  partSample(field: TextPartField): string {
    if (field.sampleSetting && this.settings()?.[field.sampleSetting]) {
      return String(this.settings()[field.sampleSetting]);
    }
    if (field.sampleKey) return this.t(field.sampleKey);
    return field.sample ?? this.labelOf(field);
  }

  partMeta(field: TextPartField): string {
    const font = this.partValue(field, "font") || this.t("UE_KIT_THEME_FONT");
    const size = this.partValue(field, "size");
    return size ? `${font} · ${size}px` : font;
  }

  // ----- geometry -----

  geometry(field: InspectorField, index: 0 | 1): number {
    const w = this.widget();
    if (!w || field.type !== "geometry") return 0;
    const props = field.pair === "position" ? ["x", "y"] : ["width", "height"];
    return Number(w[props[index]] ?? 0);
  }

  geometryDisabled(field: InspectorField, index: 0 | 1): boolean {
    if (field.type !== "geometry") return false;
    if (field.pair === "position")
      return index === 0 ? this.widthLocked() : this.heightLocked();
    return index === 0 ? this.widthLocked() : this.heightLocked();
  }

  onGeometry(field: InspectorField, index: 0 | 1, event: Event): void {
    if (field.type !== "geometry") return;
    const el = event.target as HTMLInputElement;
    const value = Number(el.value);
    if (isNaN(value)) return;
    if (field.pair === "position") {
      this.geometryChange.emit({ prop: index === 0 ? "x" : "y", value });
      return;
    }
    const w = this.widget();
    if (this.keepRatio && w?.width && w?.height) {
      const ratio = w.height / w.width;
      if (index === 0) {
        this.geometryChange.emit({ prop: "width", value });
        this.geometryChange.emit({
          prop: "height",
          value: Math.round(value * ratio),
        });
      } else {
        this.geometryChange.emit({ prop: "height", value });
        this.geometryChange.emit({
          prop: "width",
          value: Math.round(value / ratio),
        });
      }
      return;
    }
    this.geometryChange.emit({ prop: index === 0 ? "width" : "height", value });
  }

  // ----- tiles -----

  tileStyle(demo: "border" | "shadow", value: any): Record<string, string> {
    if (demo === "border") {
      return value === "none"
        ? { border: "0" }
        : { border: `2px ${value} currentColor` };
    }
    const shadow = shadowFor(value);
    return shadow
      ? { boxShadow: shadow, background: "currentColor", opacity: "0.85" }
      : { border: "1px solid currentColor" };
  }

  trackField = (_: number, f: InspectorField) => f.id;
}
