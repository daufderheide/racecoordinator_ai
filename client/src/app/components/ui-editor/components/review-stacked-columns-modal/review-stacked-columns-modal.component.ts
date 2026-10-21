import { CommonModule } from "@angular/common";
import { Component, inject, input, output } from "@angular/core";
import { StackedColumnIssue } from "@app/components/raceday/utils/lane-grid-repair.helper";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { TranslationService } from "@app/services/translation.service";

@Component({
  selector: "app-review-stacked-columns-modal",
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    @if (visible()) {
      <div class="modal-overlay" (click)="onCancel()">
        <div
          class="modal-content review-modal-content"
          (click)="$event.stopPropagation()"
        >
          <div class="modal-header">
            <div class="title-with-icon">
              <span class="material-icons warning-icon">layers_clear</span>
              <h2>{{ "UE_STACKED_COLUMNS_MODAL_TITLE" | translate }}</h2>
            </div>
            <button
              type="button"
              class="icon-btn close-btn"
              (click)="onCancel()"
              [title]="'UE_MIGRATION_DISMISS_BTN' | translate"
            >
              <span class="material-icons">close</span>
            </button>
          </div>

          <div class="modal-body">
            <p class="modal-prompt">
              {{ "UE_STACKED_COLUMNS_MODAL_PROMPT" | translate }}
            </p>

            @if (layoutName()) {
              <div class="layout-target-badge">
                <span class="badge-label"
                  >{{ "UE_MODAL_TARGET_LAYOUT" | translate }}:</span
                >
                <span class="badge-value">{{ layoutName() }}</span>
              </div>
            }

            <div class="issues-list">
              @for (issue of issues(); track issue.id) {
                <div class="issue-card">
                  <div class="issue-card-header">
                    <div class="issue-title">
                      <span class="material-icons column-icon"
                        >view_column</span
                      >
                      <span class="column-name">{{
                        issue.columnLabel | translate
                      }}</span>
                    </div>
                    <span
                      class="lane-badge"
                      [class.header-badge]="issue.isHeader"
                    >
                      @if (issue.isHeader) {
                        {{ "UE_STACKED_COLUMNS_BADGE_HEADER" | translate }}
                      } @else {
                        {{
                          "DR_LABEL_LANE"
                            | translate: { lane: issue.laneIndex + 1 }
                        }}
                      }
                    </span>
                  </div>

                  <div class="issue-details">
                    <div class="detail-row">
                      <span class="material-icons detail-icon remove-icon"
                        >delete</span
                      >
                      <span class="detail-text">
                        @if (issue.duplicateWidgets.length === 1) {
                          {{
                            "UE_STACKED_COLUMNS_DUPLICATES_TO_REMOVE_ONE"
                              | translate
                          }}
                        } @else {
                          {{
                            "UE_STACKED_COLUMNS_DUPLICATES_TO_REMOVE"
                              | translate
                                : { count: issue.duplicateWidgets.length }
                          }}
                        }
                      </span>
                    </div>

                    @if (issue.hasInsetsToMerge) {
                      <div class="detail-row insets-merge-row">
                        <span class="material-icons detail-icon merge-icon"
                          >auto_fix_high</span
                        >
                        <span class="detail-text">
                          {{
                            "UE_STACKED_COLUMNS_INSETS_MERGED"
                              | translate
                                : { insets: formatInsets(issue.insetsToMerge) }
                          }}
                        </span>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          </div>

          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              (click)="onCancel()"
            >
              {{ "COMMON_CANCEL" | translate }}
            </button>
            <button
              type="button"
              class="btn btn-primary btn-fix"
              id="ue-btn-confirm-fix-stacked-columns"
              (click)="onFix()"
            >
              <span class="material-icons">auto_fix_high</span>
              {{ "UE_STACKED_COLUMNS_CONFIRM_FIX_BTN" | translate }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        backdrop-filter: blur(4px);
      }

      .review-modal-content {
        background: #181b20;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 12px;
        width: 90%;
        max-width: 620px;
        max-height: 85vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 16px 36px rgba(0, 0, 0, 0.6);
        color: #f3f4f6;
        animation: modalFadeIn 0.2s ease-out;
      }

      @keyframes modalFadeIn {
        from {
          opacity: 0;
          transform: scale(0.96);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }

      .title-with-icon {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .warning-icon {
        color: #f59e0b;
        font-size: 24px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .modal-header h2 {
        margin: 0;
        font-size: 1.15rem;
        font-weight: 600;
        color: #f9fafb;
      }

      .close-btn {
        background: transparent;
        border: 1px solid transparent;
        border-radius: 6px;
        color: #9ca3af;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 6px;
        transition:
          background 0.15s,
          color 0.15s;
      }

      .close-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #f3f4f6;
      }

      .modal-body {
        padding: 20px;
        overflow-y: auto;
        flex: 1;
      }

      .modal-prompt {
        font-size: 0.9rem;
        line-height: 1.45;
        color: #9ca3af;
        margin: 0 0 14px 0;
      }

      .layout-target-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 6px;
        padding: 4px 10px;
        font-size: 0.8rem;
        margin-bottom: 14px;
      }

      .badge-label {
        color: #9ca3af;
      }

      .badge-value {
        color: #38bdf8;
        font-weight: 600;
      }

      .issues-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .issue-card {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 8px;
        padding: 12px 16px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .issue-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .issue-title {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .column-icon {
        color: #38bdf8;
        font-size: 18px;
      }

      .column-name {
        font-weight: 600;
        font-size: 0.95rem;
        color: #f3f4f6;
      }

      .lane-badge {
        background: rgba(56, 189, 248, 0.15);
        color: #38bdf8;
        border: 1px solid rgba(56, 189, 248, 0.3);
        border-radius: 4px;
        padding: 2px 8px;
        font-size: 0.75rem;
        font-weight: 600;
      }

      .lane-badge.header-badge {
        background: rgba(168, 85, 247, 0.15);
        color: #c084fc;
        border-color: rgba(168, 85, 247, 0.3);
      }

      .issue-details {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding-left: 26px;
      }

      .detail-row {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.85rem;
        color: #d1d5db;
      }

      .detail-icon {
        font-size: 16px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .remove-icon {
        color: #ef4444;
      }

      .merge-icon {
        color: #10b981;
      }

      .insets-merge-row {
        color: #a7f3d0;
      }

      .modal-footer {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 10px;
        padding: 14px 20px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
      }

      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease;
        border: 1px solid transparent;
      }

      .btn-secondary {
        background: rgba(255, 255, 255, 0.08);
        color: #d1d5db;
        border-color: rgba(255, 255, 255, 0.12);
      }

      .btn-secondary:hover {
        background: rgba(255, 255, 255, 0.14);
        color: #f3f4f6;
      }

      .btn-primary {
        background: #0284c7;
        color: #ffffff;
      }

      .btn-primary:hover {
        background: #0369a1;
      }

      .btn-fix {
        background: #10b981;
      }

      .btn-fix:hover {
        background: #059669;
      }
    `,
  ],
})
export class ReviewStackedColumnsModalComponent {
  private translationService = inject(TranslationService);

  public visible = input<boolean>(false);
  public issues = input<StackedColumnIssue[]>([]);
  public layoutName = input<string>("");
  public availableColumns = input<{ key: string; label: string }[]>([]);

  public fix = output<void>();
  public cancel = output<void>();

  public onFix(): void {
    this.fix.emit();
  }

  public onCancel(): void {
    this.cancel.emit();
  }

  public formatInsets(insets: Record<string, string>): string {
    if (!insets) return "";
    return Object.entries(insets)
      .map(([anchor, key]) => {
        const anchorKey = `UE_ANCHOR_${anchor}`;
        const translatedAnchor = this.translationService.translate(anchorKey);
        const anchorLabel =
          translatedAnchor && translatedAnchor !== anchorKey
            ? translatedAnchor
            : anchor;
        const normalizedKey = key.startsWith("lane-col:")
          ? key.substring("lane-col:".length)
          : key;
        const colDef = this.availableColumns().find(
          (c) => c.key === normalizedKey,
        );
        const keyLabel = colDef
          ? this.translationService.translate(colDef.label)
          : this.translationService.translate(normalizedKey);
        return `${anchorLabel} (${keyLabel})`;
      })
      .join(", ");
  }
}
