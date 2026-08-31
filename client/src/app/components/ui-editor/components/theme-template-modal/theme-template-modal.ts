import { CommonModule } from "@angular/common";
import { Component, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslatePipe } from "@app/pipes/translate.pipe";

export type ThemeTemplateType =
  | "default"
  | "practice"
  | "leaderboard"
  | "blank";

@Component({
  selector: "app-theme-template-modal",
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
    @if (visible()) {
      <div class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h2>{{ "UE_ADD_THEME_TITLE" | translate }}</h2>
            <button class="icon-btn" (click)="onCancel()">
              <span class="material-icons">close</span>
            </button>
          </div>

          <div class="modal-body">
            <p>{{ "UE_ADD_THEME_PROMPT" | translate }}</p>

            <div class="template-options">
              <label class="template-option">
                <input
                  type="radio"
                  name="templateType"
                  [(ngModel)]="selectedTemplate"
                  value="default"
                />
                <div class="template-details">
                  <span class="template-name">{{
                    "UE_TEMPLATE_DEFAULT_NAME" | translate
                  }}</span>
                  <span class="template-desc">{{
                    "UE_TEMPLATE_DEFAULT_DESC" | translate
                  }}</span>
                </div>
              </label>

              <label class="template-option">
                <input
                  type="radio"
                  name="templateType"
                  [(ngModel)]="selectedTemplate"
                  value="practice"
                />
                <div class="template-details">
                  <span class="template-name">{{
                    "UE_TEMPLATE_PRACTICE_NAME" | translate
                  }}</span>
                  <span class="template-desc">{{
                    "UE_TEMPLATE_PRACTICE_DESC" | translate
                  }}</span>
                </div>
              </label>

              <label class="template-option">
                <input
                  type="radio"
                  name="templateType"
                  [(ngModel)]="selectedTemplate"
                  value="leaderboard"
                />
                <div class="template-details">
                  <span class="template-name">{{
                    "UE_TEMPLATE_LEADERBOARD_NAME" | translate
                  }}</span>
                  <span class="template-desc">{{
                    "UE_TEMPLATE_LEADERBOARD_DESC" | translate
                  }}</span>
                </div>
              </label>

              <label class="template-option">
                <input
                  type="radio"
                  name="templateType"
                  [(ngModel)]="selectedTemplate"
                  value="blank"
                />
                <div class="template-details">
                  <span class="template-name">{{
                    "UE_TEMPLATE_BLANK_NAME" | translate
                  }}</span>
                  <span class="template-desc">{{
                    "UE_TEMPLATE_BLANK_DESC" | translate
                  }}</span>
                </div>
              </label>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="onCancel()">
              {{ "CANCEL" | translate }}
            </button>
            <button class="btn btn-primary" (click)="onConfirm()">
              {{ "OK" | translate }}
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
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        backdrop-filter: blur(4px);
      }
      .modal-content {
        background: var(--bg-surface);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        width: 100%;
        max-width: 500px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
        display: flex;
        flex-direction: column;
      }
      .modal-header {
        padding: 16px 20px;
        border-bottom: 1px solid var(--border-color);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .modal-header h2 {
        margin: 0;
        font-size: 1.25rem;
        color: var(--text-primary);
      }
      .modal-body {
        padding: 20px;
        color: var(--text-secondary);
      }
      .template-options {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-top: 15px;
      }
      .template-option {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 12px;
        border: 1px solid var(--border-color);
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
      }
      .template-option:hover {
        background: var(--bg-surface-hover);
        border-color: var(--primary-color);
      }
      .template-option input[type="radio"] {
        margin-top: 4px;
      }
      .template-details {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .template-name {
        color: var(--text-primary);
        font-weight: 500;
      }
      .template-desc {
        color: var(--text-secondary);
        font-size: 0.9rem;
      }
      .modal-footer {
        padding: 16px 20px;
        border-top: 1px solid var(--border-color);
        display: flex;
        justify-content: flex-end;
        gap: 12px;
      }
      .icon-btn {
        background: none;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      }
      .icon-btn:hover {
        background: var(--bg-surface-hover);
        color: var(--text-primary);
      }
      .btn {
        padding: 8px 16px;
        border-radius: 4px;
        font-weight: 500;
        cursor: pointer;
        border: none;
        transition: all 0.2s;
      }
      .btn-primary {
        background: var(--primary-color);
        color: white;
      }
      .btn-primary:hover {
        background: var(--primary-color-hover);
      }
      .btn-secondary {
        background: var(--bg-surface);
        border: 1px solid var(--border-color);
        color: var(--text-primary);
      }
      .btn-secondary:hover {
        background: var(--bg-surface-hover);
      }
    `,
  ],
})
export class ThemeTemplateModalComponent {
  visible = input<boolean>(false);
  confirm = output<ThemeTemplateType>();
  cancel = output<void>();

  selectedTemplate: ThemeTemplateType = "default";

  onConfirm() {
    this.confirm.emit(this.selectedTemplate);
  }

  onCancel() {
    this.cancel.emit();
  }
}
