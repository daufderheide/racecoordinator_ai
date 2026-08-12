import { CommonModule } from "@angular/common";
import { Component, effect, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslatePipe } from "@app/pipes/translate.pipe";

export interface PdfExportOptions {
  includeBackground: boolean;
  saveAsDefault: boolean;
}

@Component({
  standalone: true,
  selector: "app-pdf-export-dialog",
  template: `
    @if (visible()) {
      <div id="pdf-export-modal-backdrop" class="modal-backdrop">
        <div id="pdf-export-modal-content" class="modal-content">
          <h2 class="modal-title">{{ "PDF_EXPORT_TITLE" | translate }}</h2>

          <div class="options-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                [(ngModel)]="includeBackground"
                id="pdf-include-background-checkbox"
              />
              <span>{{ "PDF_EXPORT_RENDER_BACKGROUNDS" | translate }}</span>
            </label>
            <p class="help-text">
              {{ "PDF_EXPORT_RENDER_BACKGROUNDS_HELP" | translate }}
            </p>

            <label class="checkbox-label default-checkbox">
              <input
                type="checkbox"
                [(ngModel)]="saveAsDefault"
                id="pdf-save-default-checkbox"
              />
              <span>{{ "PDF_EXPORT_REMEMBER_DEFAULT" | translate }}</span>
            </label>
          </div>

          <div class="modal-actions">
            <button class="btn-cancel" (click)="onCancel()">
              {{ "CANCEL" | translate }}
            </button>
            <button class="btn-confirm" (click)="onExport()">
              {{ "RD_MENU_EXPORT_PDF" | translate }}
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
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 3000;
      }
      .modal-content {
        background: #1e293b;
        color: #f8fafc;
        padding: 24px;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
        width: 400px;
        max-width: 90vw;
        border: 1px solid #334155;
      }
      .modal-title {
        margin-top: 0;
        margin-bottom: 16px;
        color: #38bdf8;
        font-size: 1.35rem;
        font-weight: 600;
      }
      .options-group {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 24px;
        text-align: left;
      }
      .checkbox-label {
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        font-size: 1rem;
        user-select: none;
      }
      .checkbox-label input[type="checkbox"] {
        width: 18px;
        height: 18px;
        accent-color: #38bdf8;
        cursor: pointer;
      }
      .default-checkbox {
        margin-top: 8px;
        font-size: 0.9rem;
        color: #94a3b8;
      }
      .help-text {
        margin: 0 0 4px 28px;
        font-size: 0.825rem;
        color: #94a3b8;
        line-height: 1.3;
      }
      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
      }
      button {
        padding: 10px 18px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.95rem;
        transition: background-color 0.15s ease;
      }
      .btn-cancel {
        background: #334155;
        color: #f1f5f9;
      }
      .btn-cancel:hover {
        background: #475569;
      }
      .btn-confirm {
        background: #0284c7;
        color: #ffffff;
      }
      .btn-confirm:hover {
        background: #0369a1;
      }
    `,
  ],
  imports: [CommonModule, FormsModule, TranslatePipe],
})
export class PdfExportDialogComponent {
  visible = input(false);
  defaultIncludeBackground = input(true);

  confirm = output<PdfExportOptions>();
  cancel = output<void>();

  includeBackground = true;
  saveAsDefault = false;

  constructor() {
    effect(() => {
      if (this.visible()) {
        this.includeBackground = this.defaultIncludeBackground();
        this.saveAsDefault = false;
      }
    });
  }

  onCancel() {
    this.cancel.emit();
  }

  onExport() {
    this.confirm.emit({
      includeBackground: this.includeBackground,
      saveAsDefault: this.saveAsDefault,
    });
  }
}
