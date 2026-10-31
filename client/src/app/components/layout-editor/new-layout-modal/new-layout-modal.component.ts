import { CommonModule } from "@angular/common";
import { Component, HostListener, input, output } from "@angular/core";
import { TranslatePipe } from "@app/pipes/translate.pipe";

export interface LayoutTemplateOption {
  id: string;
  name: string;
}

@Component({
  selector: "app-new-layout-modal",
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    @if (visible()) {
      <div
        id="new-layout-modal-backdrop"
        class="modal-backdrop"
        (click)="onBackdropClick($event)"
      >
        <div
          id="new-layout-modal-content"
          class="modal-content"
          (click)="$event.stopPropagation()"
        >
          <div class="modal-header">
            <h2 class="modal-title">{{ "LE_NEW_LAYOUT_TITLE" | translate }}</h2>
            <button
              type="button"
              class="close-btn"
              (click)="onCancel()"
              [title]="'COMMON_CLOSE' | translate"
            >
              <span class="material-icons">close</span>
            </button>
          </div>

          <div class="modal-body">
            <p class="modal-message">
              {{ "LE_NEW_LAYOUT_TEMPLATE_PROMPT" | translate }}
            </p>

            <div class="template-options-list">
              @for (opt of options(); track opt.id) {
                <button
                  type="button"
                  class="template-option-btn"
                  [attr.data-template-id]="opt.id"
                  (click)="onSelectTemplate(opt.id)"
                >
                  <span class="template-option-name">{{ opt.name }}</span>
                  <span class="material-icons template-option-arrow"
                    >chevron_right</span
                  >
                </button>
              }
            </div>
          </div>

          <div class="modal-actions">
            <button
              type="button"
              id="btn-cancel-new-layout"
              class="btn btn-secondary"
              (click)="onCancel()"
            >
              {{ "COMMON_CANCEL" | translate }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.65);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        backdrop-filter: blur(4px);
      }
      .modal-content {
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 12px;
        padding: 24px;
        width: 90%;
        max-width: 460px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
        color: #f8fafc;
      }
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      .modal-title {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #f8fafc;
      }
      .close-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: transparent;
        border: 1px solid transparent;
        color: #94a3b8;
        border-radius: 6px;
        cursor: pointer;
        padding: 4px;
        transition: all 0.2s;
      }
      .close-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #f8fafc;
      }
      .close-btn .material-icons {
        font-size: 20px;
      }
      .modal-message {
        margin: 0 0 16px 0;
        font-size: 0.875rem;
        color: #94a3b8;
        line-height: 1.4;
      }
      .template-options-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .template-option-btn {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        padding: 12px 16px;
        background: #0f172a;
        border: 1px solid #334155;
        border-radius: 8px;
        cursor: pointer;
        color: #f8fafc;
        text-align: left;
        font-size: 0.9375rem;
        font-weight: 500;
        transition: all 0.15s ease;
        outline: none;
      }
      .template-option-btn:hover,
      .template-option-btn:focus-visible {
        background: rgba(56, 189, 248, 0.12);
        border-color: #38bdf8;
        box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.25);
      }
      .template-option-btn:active {
        transform: scale(0.99);
      }
      .template-option-name {
        flex: 1;
        color: #f8fafc;
      }
      .template-option-arrow {
        color: #64748b;
        font-size: 20px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition:
          color 0.15s ease,
          transform 0.15s ease;
      }
      .template-option-btn:hover .template-option-arrow,
      .template-option-btn:focus-visible .template-option-arrow {
        color: #38bdf8;
        transform: translateX(3px);
      }
      .modal-actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 20px;
      }
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
      }
      .btn-secondary {
        background: #334155;
        color: #f8fafc;
      }
      .btn-secondary:hover {
        background: #475569;
      }
    `,
  ],
})
export class NewLayoutModalComponent {
  visible = input<boolean>(false);
  options = input<LayoutTemplateOption[]>([]);
  selectedTemplateId = input<string>("default_ui_layout_rc_ai");

  confirm = output<string>();
  cancel = output<void>();

  onSelectTemplate(templateId: string): void {
    this.confirm.emit(templateId);
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onCancel();
    }
  }

  @HostListener("window:keydown", ["$event"])
  handleKeyDown(event: KeyboardEvent): void {
    if (!this.visible()) return;
    if (event.key === "Escape") {
      event.preventDefault();
      this.onCancel();
    } else if (event.key === "Enter") {
      event.preventDefault();
      this.onSelectTemplate(
        this.selectedTemplateId() || "default_ui_layout_rc_ai",
      );
    }
  }
}
