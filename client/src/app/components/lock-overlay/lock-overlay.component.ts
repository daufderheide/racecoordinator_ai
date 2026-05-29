import { CommonModule } from "@angular/common";
import { Component, inject, OnInit } from "@angular/core";
import { DataService } from "@app/data.service";
import { Role } from "@app/models/role";
import { AuthService } from "@app/services/auth.service";

@Component({
  standalone: true,
  selector: "app-lock-overlay",
  imports: [CommonModule],
  template: `
    @if (isLocked) {
      <div class="overlay">
        <div class="dialog">
          <span class="material-icons lock-icon">lock</span>
          <h2>System Locked</h2>
          <p>
            The system is currently locked because someone is using the
            <strong>{{ lockStateString }}</strong
            >.
          </p>
          <p>
            Locked by: <strong>{{ ownerId }}</strong>
          </p>
          <p class="hint">Please wait until they are finished.</p>
          @if (isAdmin) {
            <div style="margin-top: 20px;">
              <button class="btn-dismiss" (click)="dismissLock()">
                Dismiss (Admin override)
              </button>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [
    `
      .overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.85);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 4000; /* High z-index to cover everything */
        backdrop-filter: blur(5px);
      }
      .dialog {
        background: #2a2a2a;
        padding: 40px;
        border-radius: 12px;
        width: 450px;
        color: #fff;
        text-align: center;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8);
        border: 2px solid #ff4444;
      }
      .lock-icon {
        font-size: 4rem;
        color: #ff4444;
        margin-bottom: 20px;
      }
      h2 {
        margin-top: 0;
        margin-bottom: 20px;
        font-size: 1.8rem;
        color: #ff4444;
      }
      p {
        font-size: 1.1rem;
        margin-bottom: 15px;
        line-height: 1.5;
      }
      .hint {
        color: #aaa;
        font-size: 0.95rem;
        margin-top: 20px;
      }
      .btn-dismiss {
        background: rgba(40, 40, 40, 0.8);
        border: 1px solid #555;
        color: #ddd;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1rem;
      }
      .btn-dismiss:hover {
        background: #555;
      }
    `,
  ],
})
export class LockOverlayComponent implements OnInit {
  isLocked = false;
  lockStateString = "";
  ownerId = "";
  isAdmin = false;

  dataService = inject(DataService);
  authService = inject(AuthService);

  ngOnInit() {
    this.authService.currentRole$.subscribe((role) => {
      this.isAdmin = role === Role.ADMIN;
    });

    this.dataService.getSystemState().subscribe((state) => {
      if (!state) return;

      const resourceLockState = state.resourceLockState;
      const owner = state.ownerId || "Unknown";

      // If idle, unlock
      if (!resourceLockState || resourceLockState === "IDLE") {
        this.isLocked = false;
        return;
      }

      // If RACE_RUNNING, it's not a global lockout.
      // Only lock out for TRACK_EDITOR or RACE_EDITOR
      if (resourceLockState === "RACE_RUNNING") {
        this.isLocked = false;
        return;
      }

      // Admins have the ability to break locks by interacting with the UI anyway,
      // so we can give them a 'Dismiss' button or just let them see the overlay
      // but have a button to hide it locally.

      this.isLocked = true;
      this.ownerId = owner;

      if (resourceLockState === "TRACK_EDITOR") {
        this.lockStateString = "Track Editor";
      } else {
        this.lockStateString = resourceLockState;
      }
    });
  }

  dismissLock() {
    this.isLocked = false;
  }
}
