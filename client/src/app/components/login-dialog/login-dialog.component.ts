import { Component, inject, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { AuthService } from "@app/services/auth.service";

@Component({
  standalone: true,
  selector: "app-login-dialog",
  imports: [FormsModule],
  template: `
    @if (visible()) {
      <div class="modal-backdrop">
        <div class="modal-content">
          <h2 class="modal-title">Director Login</h2>
          <div class="login-form">
            <p>
              Enter the Director password to access Race Control and Settings.
            </p>
            <input
              type="password"
              [(ngModel)]="password"
              placeholder="Password"
              (keyup.enter)="onSubmit()"
              class="form-input"
            />
            @if (errorMessage) {
              <p class="error-message">{{ errorMessage }}</p>
            }
          </div>
          <div class="modal-actions">
            <button class="btn-cancel" (click)="onClose()">Cancel</button>
            <button class="btn-confirm" (click)="onSubmit()">Login</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 3000;
      }
      .modal-content {
        background: #2b2b2b;
        color: #fff;
        padding: 30px;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.8);
        min-width: 350px;
        text-align: center;
        border: 1px solid #444;
      }
      .modal-title {
        margin-top: 0;
        color: #ffa500;
        font-size: 1.5rem;
        margin-bottom: 20px;
      }
      .login-form {
        margin: 20px 0;
        font-size: 1rem;
        line-height: 1.5;
        text-align: left;
      }
      .form-input {
        width: 100%;
        padding: 10px;
        margin-top: 15px;
        border-radius: 6px;
        border: 1px solid #555;
        background: #1e1e1e;
        color: #fff;
        font-size: 1.1rem;
        box-sizing: border-box;
      }
      .form-input:focus {
        outline: none;
        border-color: #ffa500;
      }
      .error-message {
        color: #ff4444;
        margin-top: 10px;
        font-size: 0.9rem;
      }
      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 15px;
        margin-top: 25px;
      }
      button {
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
        font-size: 1rem;
        transition: all 0.2s;
      }
      .btn-cancel {
        background: #555;
        color: #fff;
      }
      .btn-cancel:hover {
        background: #666;
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
})
export class LoginDialogComponent {
  private authService = inject(AuthService);

  visible = input(false);
  close = output<void>();

  password = "";
  errorMessage = "";

  onClose() {
    this.password = "";
    this.errorMessage = "";
    this.close.emit();
  }

  onSubmit() {
    this.errorMessage = "";
    this.authService.loginAsDirector(this.password).subscribe((success) => {
      if (success) {
        this.onClose();
      } else {
        this.errorMessage = "Invalid password.";
      }
    });
  }
}
