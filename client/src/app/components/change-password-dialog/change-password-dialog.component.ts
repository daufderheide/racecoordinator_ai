import { CommonModule } from "@angular/common";
import {
  ChangeDetectorRef,
  Component,
  effect,
  inject,
  input,
  output,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { AcknowledgementModalComponent } from "@app/components/shared/acknowledgement-modal/acknowledgement-modal.component";
import { AuthService } from "@app/services/auth.service";

@Component({
  standalone: true,
  selector: "app-change-password-dialog",
  imports: [CommonModule, FormsModule, AcknowledgementModalComponent],
  template: `
    @if (visible()) {
      <div class="overlay">
        <div class="dialog">
          <h2>Change Director Password</h2>
          <div class="form-group">
            <label>New Password</label>
            <div class="password-input-wrapper">
              <input
                [type]="showPassword ? 'text' : 'password'"
                [(ngModel)]="newPassword"
                (keyup.enter)="submit()"
              />
              <button
                type="button"
                class="toggle-password-btn"
                (click)="showPassword = !showPassword"
                [title]="showPassword ? 'Hide password' : 'Show password'"
              >
                <span class="material-icons">
                  {{ showPassword ? "visibility_off" : "visibility" }}
                </span>
              </button>
            </div>
          </div>
          @if (errorMsg) {
            <div class="error-msg">{{ errorMsg }}</div>
          }
          <div class="actions">
            <button class="btn-cancel" (click)="closeDialog()">Cancel</button>
            <button class="btn-submit" (click)="submit()">Save</button>
          </div>
        </div>
      </div>
    }

    <app-acknowledgement-modal
      [visible]="showFailureModal"
      [title]="'Change Password Failed'"
      [message]="'Failed to change password. See console for details.'"
      (acknowledge)="showFailureModal = false"
    ></app-acknowledgement-modal>
  `,
  styles: [
    `
      .overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 3000;
      }
      .dialog {
        background: #2a2a2a;
        padding: 25px;
        border-radius: 8px;
        width: 350px;
        color: #fff;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
      }
      h2 {
        margin-top: 0;
        margin-bottom: 20px;
        font-size: 1.3rem;
        color: #ffa500;
      }
      .form-group {
        margin-bottom: 15px;
      }
      label {
        display: block;
        margin-bottom: 5px;
        font-size: 0.9rem;
      }
      .password-input-wrapper {
        position: relative;
        display: flex;
        align-items: center;
        width: 100%;
      }
      input {
        width: 100%;
        padding: 8px;
        padding-right: 40px;
        border: 1px solid #555;
        background: #111;
        color: #fff;
        border-radius: 4px;
        box-sizing: border-box;
      }
      .toggle-password-btn {
        position: absolute;
        right: 8px;
        background: transparent;
        border: none;
        color: #aaa;
        cursor: pointer;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color 0.2s;
      }
      .toggle-password-btn:hover {
        color: #ffa500;
      }
      .toggle-password-btn .material-icons {
        font-size: 1.2rem;
      }
      .error-msg {
        color: #ff4444;
        margin-bottom: 15px;
        font-size: 0.9rem;
      }
      .actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 20px;
      }
      button {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
      }
      .btn-cancel {
        background: #555;
        color: #fff;
      }
      .btn-cancel:hover {
        background: #666;
      }
      .btn-submit {
        background: #ffa500;
        color: #000;
      }
      .btn-submit:hover {
        background: #ffb732;
      }
    `,
  ],
})
export class ChangePasswordDialogComponent {
  visible = input<boolean>(false);
  close = output<void>();

  newPassword = "";
  errorMsg = "";
  showPassword = false;
  showFailureModal = false;

  authService = inject(AuthService);
  cdr = inject(ChangeDetectorRef);

  constructor() {
    effect(() => {
      if (this.visible()) {
        this.authService.getDirectorPassword().subscribe((pwd) => {
          this.newPassword = pwd;
          this.cdr.detectChanges();
        });
        this.showPassword = false;
      }
    });
  }

  submit() {
    this.errorMsg = "";
    this.authService
      .changeDirectorPassword(this.newPassword)
      .subscribe((success) => {
        if (success) {
          this.closeDialog();
        } else {
          this.showFailureModal = true;
          this.errorMsg = "Failed to change password. See console for details.";
          this.cdr.detectChanges();
        }
      });
  }

  closeDialog() {
    this.newPassword = "";
    this.errorMsg = "";
    this.showPassword = false;
    this.close.emit();
  }
}
