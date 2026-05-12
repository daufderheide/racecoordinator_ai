import { Component, input, output } from "@angular/core";
import { TranslatePipe } from "@app/pipes/translate.pipe";

@Component({
  standalone: true,
  selector: "app-confirmation-modal",
  template: `
    @if (visible()) {
      <div id="confirmation-modal-backdrop" class="modal-backdrop" [class]="className()">
        <div id="confirmation-modal-content" class="modal-content">
          <h2 class="modal-title">{{ title() | translate }}</h2>
          <p class="modal-message">
            {{ message() | translate: $any(messageParams() || {}) }}
          </p>
          <div class="modal-actions">
            <button class="btn-cancel" (click)="onCancel()">
              {{ cancelText() | translate }}
            </button>
            <button class="btn-confirm" (click)="onConfirm()">
              {{ confirmText() | translate }}
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
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 3000;
      }
      .modal-content {
        background: #2b2b2b;
        color: #fff;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        min-width: 300px;
        text-align: center;
        border: 1px solid #444;
      }
      .modal-title {
        margin-top: 0;
        color: #ffa500;
      }
      .modal-message {
        margin: 20px 0;
        font-size: 1.1em;
        white-space: pre-line;
      }
      .modal-actions {
        display: flex;
        justify-content: center;
        gap: 15px;
      }
      button {
        padding: 10px 20px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
        font-size: 1em;
      }
      .btn-cancel {
        background: #444;
        color: #fff;
      }
      .btn-cancel:hover {
        background: #555;
      }
      .btn-confirm {
        background: #ffa500;
        color: #000;
      }
      .btn-confirm:hover {
        background: #ffb733;
      }
    `,
  ],
  imports: [TranslatePipe],
})
export class ConfirmationModalComponent {
  visible = input(false);
  title = input("");
  message = input("");
  messageParams = input<any>({});
  cancelText = input("NO");
  confirmText = input("YES");
  className = input("");

  cancel = output<void>();
  confirm = output<void>();

  onCancel() {
    this.cancel.emit();
  }

  onConfirm() {
    this.confirm.emit();
  }
}
