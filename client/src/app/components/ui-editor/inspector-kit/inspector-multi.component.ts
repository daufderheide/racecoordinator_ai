import { CommonModule } from "@angular/common";
import {
  Component,
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

  theme = signal<PanelTheme>(readPanelTheme());
}
