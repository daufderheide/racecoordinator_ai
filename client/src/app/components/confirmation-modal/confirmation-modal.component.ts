import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-confirmation-modal',
  standalone: false,
  template: `
    <div class="modal-backdrop" *ngIf="visible">
      <div class="modal-content">
        <h2 class="modal-title">{{ title | translate }}</h2>
        <p class="modal-message">{{ message | translate }}</p>
        <div class="modal-actions">
          <button class="btn-cancel" (click)="onCancel()">{{ cancelText | translate }}</button>
          <button class="btn-confirm" (click)="onConfirm()">{{ confirmText | translate }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
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
      z-index: 1000;
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
  `]
})
export class ConfirmationModalComponent {
  @Input() visible = false;
  @Input() title = '';
  @Input() message = '';
  @Input() cancelText = 'NO';
  @Input() confirmText = 'YES';

  @Output() cancel = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();

  onCancel() {
    this.cancel.emit();
  }

  onConfirm() {
    this.confirm.emit();
  }
}
