import {
  ArrangeAction,
  MIN_TO_DISTRIBUTE,
} from "@app/components/ui-editor/arrange.utils";
import { CommonModule } from "@angular/common";
import {
  Component,
  computed,
  input,
  output,
  signal,
  ViewEncapsulation,
} from "@angular/core";
import { TranslatePipe } from "@app/pipes/translate.pipe";

import { PanelTheme, readPanelTheme } from "./inspector-shell.component";

export interface MultiSelectItem {
  id: string;
  name: string;
  icon: string;
  locked?: boolean;
}

/**
 * The panel while several widgets are selected (phase 4c-1): how many, which
 * ones (click a name to make it the main one, × to drop it), and a way back
 * to one widget. Align / distribute tools come in 4c-3.
 */
@Component({
  selector: "app-inspector-multi",
  standalone: true,
  styleUrls: ["./inspector-kit.css"],
  // same global kit styles as the shell
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div
      id="help-widget-inspector"
      class="widget-inspector-panel kit-panel kit-multi"
      [attr.data-panel-theme]="theme()"
    >
      <div class="kit-head">
        <div class="kit-head-top">
          <h2 class="kit-head-title">{{ "UE_INSPECTOR_TITLE" | translate }}</h2>
          <button
            type="button"
            class="kit-icon-btn"
            id="kit-copy-style"
            [title]="'UE_STYLE_COPY' | translate"
            [attr.aria-label]="'UE_STYLE_COPY' | translate"
            (click)="copyStyle.emit()"
          >
            <span class="material-icons">format_paint</span>
          </button>
          <button
            type="button"
            class="kit-icon-btn"
            id="kit-paste-style"
            [class.kit-has-dot]="canPasteStyle()"
            [disabled]="!canPasteStyle()"
            [title]="'UE_STYLE_PASTE_ALL' | translate"
            [attr.aria-label]="'UE_STYLE_PASTE_ALL' | translate"
            (click)="pasteStyle.emit()"
          >
            <span class="material-icons">content_paste</span>
          </button>
          <button
            type="button"
            class="kit-icon-btn kit-danger"
            id="kit-multi-delete"
            [title]="'UE_MULTI_DELETE_TITLE' | translate"
            [attr.aria-label]="'UE_MULTI_DELETE_TITLE' | translate"
            (click)="deleteAll.emit()"
          >
            <span class="material-icons">delete</span>
          </button>
        </div>
        <div class="kit-head-widget">
          <span class="kit-head-icon"
            ><span class="material-icons">select_all</span></span
          >
          <div class="kit-head-name">
            <span class="inspector-widget-subtitle" id="kit-multi-count">{{
              "UE_MULTI_COUNT" | translate: { count: items().length }
            }}</span>
            <small>{{ "UE_MULTI_HINT" | translate }}</small>
          </div>
        </div>
      </div>

      <div class="kit-body inspector-body">
        <div class="kit-arrange" id="kit-multi-arrange">
          @for (group of toolGroups; track group.labelKey) {
            <div class="kit-arrange-group" [attr.data-group]="group.id">
              <span class="kit-arrange-label">{{
                group.labelKey | translate
              }}</span>
              <div class="kit-buttons">
                @for (tool of group.tools; track tool.action) {
                  <button
                    type="button"
                    class="kit-icon-btn"
                    [attr.data-arrange]="tool.action"
                    [attr.aria-label]="tool.labelKey | translate"
                    [title]="tool.labelKey | translate"
                    [disabled]="isDisabled(tool.action)"
                    (click)="arrange.emit(tool.action)"
                  >
                    <span class="material-icons" aria-hidden="true">{{
                      tool.icon
                    }}</span>
                  </button>
                }
              </div>
            </div>
          }
          @if (lockedCount() > 0) {
            <p class="kit-arrange-note" id="kit-multi-locked-note">
              <span class="material-icons" aria-hidden="true">lock</span>
              {{ "UE_MULTI_LOCKED_NOTE" | translate: { count: lockedCount() } }}
            </p>
          }
        </div>
        <ul class="kit-multi-list" role="list">
          @for (item of items(); track item.id) {
            <li
              class="kit-multi-row"
              [class.is-main]="item.id === mainId()"
              [attr.data-id]="item.id"
            >
              <button
                type="button"
                class="kit-multi-name"
                [attr.aria-pressed]="item.id === mainId()"
                [title]="'UE_MULTI_MAKE_MAIN' | translate"
                (click)="makeMain.emit(item.id)"
              >
                <span class="material-icons" aria-hidden="true">{{
                  item.icon
                }}</span>
                <span class="kit-multi-label">{{ item.name }}</span>
                @if (item.locked) {
                  <span
                    class="material-icons kit-multi-lock"
                    [title]="'UE_KIT_LOCKED' | translate"
                    >lock</span
                  >
                }
                @if (item.id === mainId()) {
                  <span class="kit-multi-main">{{
                    "UE_MULTI_MAIN" | translate
                  }}</span>
                }
              </button>
              <button
                type="button"
                class="kit-icon-btn"
                [attr.data-remove]="item.id"
                [attr.aria-label]="
                  ('UE_MULTI_REMOVE' | translate) + ' ' + item.name
                "
                [title]="'UE_MULTI_REMOVE' | translate"
                (click)="remove.emit(item.id)"
              >
                <span class="material-icons" aria-hidden="true">close</span>
              </button>
            </li>
          }
        </ul>
        <div class="kit-multi-actions">
          <button
            type="button"
            class="kit-link"
            id="kit-multi-keep-main"
            (click)="keepMain.emit()"
          >
            {{ "UE_MULTI_KEEP_MAIN" | translate }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class InspectorMultiComponent {
  items = input<MultiSelectItem[]>([]);
  mainId = input<string | null>(null);

  makeMain = output<string>();
  remove = output<string>();
  keepMain = output<void>();
  deleteAll = output<void>();
  arrange = output<ArrangeAction>();
  canPasteStyle = input(false);
  copyStyle = output<void>();
  pasteStyle = output<void>();

  /** Locked widgets stay put while aligning (they still count for the box). */
  lockedCount = computed(() => this.items().filter((i) => i.locked).length);

  isDisabled(action: ArrangeAction): boolean {
    const n = this.items().length;
    if (action === "distributeX" || action === "distributeY") {
      return n < MIN_TO_DISTRIBUTE;
    }
    return n < 2;
  }

  readonly toolGroups: {
    id: string;
    labelKey: string;
    tools: { action: ArrangeAction; icon: string; labelKey: string }[];
  }[] = [
    {
      id: "align",
      labelKey: "UE_MULTI_ALIGN",
      tools: [
        {
          action: "left",
          icon: "align_horizontal_left",
          labelKey: "UE_MULTI_ALIGN_LEFT",
        },
        {
          action: "centre",
          icon: "align_horizontal_center",
          labelKey: "UE_MULTI_ALIGN_CENTRE",
        },
        {
          action: "right",
          icon: "align_horizontal_right",
          labelKey: "UE_MULTI_ALIGN_RIGHT",
        },
        {
          action: "top",
          icon: "align_vertical_top",
          labelKey: "UE_MULTI_ALIGN_TOP",
        },
        {
          action: "middle",
          icon: "align_vertical_center",
          labelKey: "UE_MULTI_ALIGN_MIDDLE",
        },
        {
          action: "bottom",
          icon: "align_vertical_bottom",
          labelKey: "UE_MULTI_ALIGN_BOTTOM",
        },
      ],
    },
    {
      id: "spread",
      labelKey: "UE_MULTI_SPACE_SIZE",
      tools: [
        {
          action: "distributeX",
          icon: "horizontal_distribute",
          labelKey: "UE_MULTI_DISTRIBUTE_X",
        },
        {
          action: "distributeY",
          icon: "vertical_distribute",
          labelKey: "UE_MULTI_DISTRIBUTE_Y",
        },
        {
          action: "sameWidth",
          icon: "width_normal",
          labelKey: "UE_MULTI_SAME_WIDTH",
        },
        {
          action: "sameHeight",
          icon: "height",
          labelKey: "UE_MULTI_SAME_HEIGHT",
        },
      ],
    },
  ];

  theme = signal<PanelTheme>(readPanelTheme());
}
