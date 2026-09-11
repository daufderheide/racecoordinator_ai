import { CommonModule } from "@angular/common";
import { Component, computed, input, output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslatePipe } from "@app/pipes/translate.pipe";

import {
  TEMPLATE_VARIABLES,
  TemplateVariable,
} from "./template-variables.data";

export { TemplateVariable } from "./template-variables.data";

@Component({
  selector: "app-template-variables-modal",
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
    @if (visible()) {
      <div class="modal-overlay" (click)="onOverlayClick($event)">
        <div class="modal-dialog">
          <div class="modal-header">
            <div class="header-title">
              <span class="material-icons header-icon">code</span>
              <h2>{{ "UE_VAR_MODAL_TITLE" | translate }}</h2>
            </div>
            <button
              class="icon-btn"
              (click)="onClose()"
              [title]="'COMMON_CLOSE' | translate"
            >
              <span class="material-icons">close</span>
            </button>
          </div>

          <div class="modal-toolbar">
            <div class="search-box">
              <span class="material-icons search-icon">search</span>
              <input
                type="text"
                class="search-input"
                [placeholder]="'UE_VAR_SEARCH_PLACEHOLDER' | translate"
                [ngModel]="searchQuery()"
                (ngModelChange)="searchQuery.set($event)"
                autocomplete="off"
                data-dashlane-ignore="true"
                data-1p-ignore="true"
                data-lpignore="true"
                data-bwignore="true"
                data-form-type="other"
              />
              @if (searchQuery()) {
                <button
                  class="clear-search-btn"
                  (click)="searchQuery.set('')"
                  [title]="'COMMON_CLEAR' | translate"
                >
                  <span class="material-icons">clear</span>
                </button>
              }
            </div>

            <div class="category-tabs">
              <button
                class="category-tab"
                [class.active]="selectedCategory() === 'all'"
                (click)="selectedCategory.set('all')"
              >
                {{ "UE_VAR_CAT_ALL" | translate }}
              </button>
              <button
                class="category-tab"
                [class.active]="selectedCategory() === 'standings'"
                (click)="selectedCategory.set('standings')"
              >
                {{ "UE_VAR_CAT_STANDINGS" | translate }}
              </button>
              <button
                class="category-tab"
                [class.active]="selectedCategory() === 'heats'"
                (click)="selectedCategory.set('heats')"
              >
                {{ "UE_VAR_CAT_HEATS" | translate }}
              </button>
              <button
                class="category-tab"
                [class.active]="selectedCategory() === 'heatDriver'"
                (click)="selectedCategory.set('heatDriver')"
              >
                {{ "UE_VAR_CAT_HEAT_DRIVER" | translate }}
              </button>
              <button
                class="category-tab"
                [class.active]="selectedCategory() === 'laps'"
                (click)="selectedCategory.set('laps')"
              >
                {{ "UE_VAR_CAT_LAPS" | translate }}
              </button>
              <button
                class="category-tab"
                [class.active]="selectedCategory() === 'driverSummaries'"
                (click)="selectedCategory.set('driverSummaries')"
              >
                {{ "UE_VAR_CAT_SUMMARIES" | translate }}
              </button>
              <button
                class="category-tab"
                [class.active]="selectedCategory() === 'season'"
                (click)="selectedCategory.set('season')"
              >
                {{ "UE_VAR_CAT_SEASON" | translate }}
              </button>
              <button
                class="category-tab"
                [class.active]="selectedCategory() === 'race'"
                (click)="selectedCategory.set('race')"
              >
                {{ "UE_VAR_CAT_RACE" | translate }}
              </button>
            </div>
          </div>

          <div class="modal-body">
            <div class="tip-banner">
              <span class="material-icons tip-icon">lightbulb</span>
              <div class="tip-text">
                <div>
                  <strong>{{ "UE_VAR_TIP_TITLE" | translate }}:</strong>
                  {{ "UE_VAR_TIP_DESC" | translate }}
                </div>
                <div style="margin-top: 6px;">
                  {{ "UE_VAR_TIP_REUPLOAD" | translate }}
                </div>
              </div>
            </div>

            <div class="variables-grid">
              @for (v of filteredVariables(); track v.expression) {
                <div class="variable-card">
                  <div class="variable-top">
                    <span class="var-badge category-badge">{{
                      v.categoryKey | translate
                    }}</span>
                    <span class="var-badge type-badge">{{ v.type }}</span>
                  </div>
                  <div class="expression-row">
                    <code class="var-expression">{{ v.expression }}</code>
                    <button
                      class="copy-btn"
                      (click)="copyVariable(v.expression)"
                      [title]="'UE_VAR_COPY_TOOLTIP' | translate"
                    >
                      @if (copiedVar() === v.expression) {
                        <span class="material-icons copied-icon">check</span>
                        <span class="copied-text">{{
                          "UE_VAR_COPIED" | translate
                        }}</span>
                      } @else {
                        <span class="material-icons">content_copy</span>
                        <span>{{ "UE_VAR_COPY" | translate }}</span>
                      }
                    </button>
                  </div>
                  <div class="var-desc">{{ v.descriptionKey | translate }}</div>
                  <div class="var-example">
                    <span class="example-label"
                      >{{ "UE_VAR_EXAMPLE" | translate }}:</span
                    >
                    <code>{{ v.example }}</code>
                  </div>
                </div>
              }
              @if (filteredVariables().length === 0) {
                <div class="no-results">
                  <span class="material-icons empty-icon">search_off</span>
                  <p>{{ "UE_VAR_NO_RESULTS" | translate }}</p>
                </div>
              }
            </div>
          </div>

          <div class="modal-footer">
            <div class="footer-left">
              <span class="count-badge"
                >{{ filteredVariables().length }}
                {{ "UE_VAR_COUNT_LABEL" | translate }}</span
              >
            </div>
            <div class="footer-actions">
              <button class="btn btn-secondary" (click)="onClose()">
                {{ "COMMON_CLOSE" | translate }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1050;
        backdrop-filter: blur(4px);
        animation: fadeIn 0.2s ease-out;
      }
      .modal-dialog {
        background: var(--bg-surface, #1e293b);
        border: 1px solid var(--border-color, #334155);
        border-radius: 12px;
        width: 95vw;
        max-width: 1200px;
        max-height: 85vh;
        display: flex;
        flex-direction: column;
        box-shadow:
          0 20px 25px -5px rgba(0, 0, 0, 0.5),
          0 10px 10px -5px rgba(0, 0, 0, 0.04);
        overflow: hidden;
      }
      .modal-header {
        padding: 16px 20px;
        border-bottom: 1px solid var(--border-color, #334155);
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: var(--bg-surface-elevated, #0f172a);
      }
      .header-title {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .header-icon {
        color: var(--primary-color, #3b82f6);
        font-size: 24px;
      }
      .modal-header h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--text-primary, #f8fafc);
      }
      .modal-toolbar {
        padding: 16px 20px 12px 20px;
        border-bottom: 1px solid var(--border-color, #334155);
        display: flex;
        flex-direction: column;
        gap: 12px;
        background: var(--bg-surface, #1e293b);
      }
      .search-box {
        position: relative;
        display: flex;
        align-items: center;
      }
      .search-icon {
        position: absolute;
        left: 12px;
        color: var(--text-secondary, #94a3b8);
        pointer-events: none;
      }
      .search-input {
        width: 100%;
        padding: 10px 40px 10px 38px;
        border-radius: 6px;
        border: 1px solid var(--border-color, #334155);
        background: var(--bg-main, #0f172a);
        color: var(--text-primary, #f8fafc);
        font-size: 0.95rem;
        outline: none;
        transition: border-color 0.2s;
      }
      .search-input:focus {
        border-color: var(--primary-color, #3b82f6);
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25);
      }
      .clear-search-btn {
        position: absolute;
        right: 8px;
        background: none;
        border: none;
        color: var(--text-secondary, #94a3b8);
        cursor: pointer;
        padding: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .clear-search-btn:hover {
        color: var(--text-primary, #f8fafc);
      }
      .category-tabs {
        display: flex;
        gap: 8px;
        overflow-x: auto;
        padding-bottom: 4px;
      }
      .category-tab {
        padding: 6px 12px;
        border-radius: 6px;
        border: 1px solid var(--border-color, #334155);
        background: var(--bg-surface, #1e293b);
        color: var(--text-secondary, #94a3b8);
        font-size: 0.85rem;
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.2s;
      }
      .category-tab:hover {
        background: var(--bg-surface-hover, #334155);
        color: var(--text-primary, #f8fafc);
      }
      .category-tab.active {
        background: var(--primary-color, #3b82f6);
        border-color: var(--primary-color, #3b82f6);
        color: #ffffff;
        font-weight: 500;
      }
      .modal-body {
        padding: 16px 20px;
        overflow-y: auto;
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .tip-banner {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 12px 16px;
        background: rgba(59, 130, 246, 0.1);
        border: 1px solid rgba(59, 130, 246, 0.3);
        border-radius: 8px;
        color: var(--text-secondary, #94a3b8);
        font-size: 0.88rem;
        line-height: 1.4;
      }
      .tip-icon {
        color: #f59e0b;
        font-size: 20px;
        margin-top: 1px;
        flex-shrink: 0;
      }
      .tip-text strong {
        color: var(--text-primary, #f8fafc);
      }
      .variables-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
        gap: 12px;
      }
      .variable-card {
        background: var(--bg-surface-elevated, #0f172a);
        border: 1px solid var(--border-color, #334155);
        border-radius: 8px;
        padding: 12px 14px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        transition:
          border-color 0.2s,
          transform 0.1s;
      }
      .variable-card:hover {
        border-color: var(--border-hover, #475569);
      }
      .variable-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .var-badge {
        font-size: 0.75rem;
        font-weight: 600;
        padding: 2px 8px;
        border-radius: 4px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .category-badge {
        background: rgba(148, 163, 184, 0.15);
        color: var(--text-secondary, #94a3b8);
      }
      .type-badge {
        background: rgba(59, 130, 246, 0.15);
        color: #60a5fa;
      }
      .expression-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }
      .var-expression {
        font-family:
          ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 0.92rem;
        font-weight: 600;
        color: #38bdf8;
        background: rgba(56, 189, 248, 0.1);
        padding: 4px 8px;
        border-radius: 4px;
        word-break: break-all;
      }
      .copy-btn {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 10px;
        font-size: 0.8rem;
        font-weight: 500;
        background: var(--bg-surface, #1e293b);
        border: 1px solid var(--border-color, #334155);
        color: var(--text-secondary, #94a3b8);
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
        flex-shrink: 0;
      }
      .copy-btn:hover {
        background: var(--bg-surface-hover, #334155);
        color: var(--text-primary, #f8fafc);
        border-color: var(--primary-color, #3b82f6);
      }
      .copy-btn .material-icons {
        font-size: 14px;
      }
      .copied-icon {
        color: #10b981 !important;
      }
      .copied-text {
        color: #10b981;
      }
      .var-desc {
        color: var(--text-secondary, #cbd5e1);
        font-size: 0.86rem;
        line-height: 1.35;
      }
      .var-example {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.8rem;
        color: var(--text-tertiary, #64748b);
      }
      .var-example code {
        font-family: ui-monospace, SFMono-Regular, monospace;
        color: var(--text-secondary, #94a3b8);
      }
      .no-results {
        grid-column: 1 / -1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px;
        color: var(--text-secondary, #94a3b8);
        gap: 12px;
      }
      .empty-icon {
        font-size: 48px;
        opacity: 0.5;
      }
      .modal-footer {
        padding: 14px 20px;
        border-top: 1px solid var(--border-color, #334155);
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: var(--bg-surface-elevated, #0f172a);
      }
      .count-badge {
        font-size: 0.85rem;
        color: var(--text-secondary, #94a3b8);
      }
      .icon-btn {
        background: none;
        border: none;
        color: var(--text-secondary, #94a3b8);
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      }
      .icon-btn:hover {
        background: var(--bg-surface-hover, #334155);
        color: var(--text-primary, #f8fafc);
      }
      .btn {
        padding: 8px 16px;
        border-radius: 6px;
        font-weight: 500;
        font-size: 0.9rem;
        cursor: pointer;
        border: none;
        transition: all 0.2s;
      }
      .btn-secondary {
        background: var(--bg-surface, #1e293b);
        border: 1px solid var(--border-color, #334155);
        color: var(--text-primary, #f8fafc);
      }
      .btn-secondary:hover {
        background: var(--bg-surface-hover, #334155);
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
    `,
  ],
})
export class TemplateVariablesModalComponent {
  visible = input<boolean>(false);
  close = output<void>();

  searchQuery = signal("");
  selectedCategory = signal("all");
  copiedVar = signal<string | null>(null);

  readonly variables: TemplateVariable[] = TEMPLATE_VARIABLES;

  filteredVariables = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const cat = this.selectedCategory();

    return this.variables.filter((v) => {
      if (
        cat !== "all" &&
        v.category !== cat &&
        (cat !== "heats" ||
          (v.category !== "heats" && v.category !== "heatDriver"))
      ) {
        if (
          cat === "heats" &&
          (v.category === "heats" || v.category === "heatDriver")
        ) {
          // allow heats tab
        } else {
          return false;
        }
      }
      if (!q) {
        return true;
      }
      return (
        v.expression.toLowerCase().includes(q) ||
        v.type.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q) ||
        v.example.toLowerCase().includes(q)
      );
    });
  });

  copyVariable(expression: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(expression).then(() => {
        this.copiedVar.set(expression);
        setTimeout(() => {
          if (this.copiedVar() === expression) {
            this.copiedVar.set(null);
          }
        }, 2000);
      });
    }
  }

  onOverlayClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains("modal-overlay")) {
      this.onClose();
    }
  }

  onClose() {
    this.close.emit();
  }
}
