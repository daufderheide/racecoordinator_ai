import { Component, input, output } from "@angular/core";
import { TranslatePipe } from "@app/pipes/translate.pipe";

/** Answer to "a race format with this name already exists". */
export type FormatConflictChoice = "USE_MINE" | "SAVE_COPY" | "REPLACE_MINE";

/**
 * Asks what to do when an imported race format has the same name as one in the
 * Race Editor. Uses the same three choices and words as the race import dialog.
 */
@Component({
  standalone: true,
  selector: "app-format-conflict-modal",
  imports: [TranslatePipe],
  template: `
    @if (visible()) {
      <div class="fcm-backdrop" (click)="choose.emit('USE_MINE')">
        <div
          id="config-conflict-modal-content"
          class="fcm-dialog"
          role="dialog"
          aria-labelledby="fcm-title"
          (click)="$event.stopPropagation()"
        >
          <div class="fcm-header">
            <span class="material-icons fcm-icon">warning</span>
            <div>
              <h2 id="fcm-title">
                {{ "RE_IMPORT_CONFLICT_TITLE" | translate }}
              </h2>
              <p>
                {{ "RPM_FORMAT_EXISTS" | translate: { name: existingName() } }}
              </p>
            </div>
          </div>
          <div class="fcm-choices">
            <button
              type="button"
              class="fcm-choice"
              id="fcm-use-mine"
              (click)="choose.emit('USE_MINE')"
            >
              <span class="material-icons">check_circle</span>
              <span>
                <b>{{ "RPM_FORMAT_USE_MINE" | translate }}</b>
                <small>{{ "RE_IMPORT_USE_MINE_HINT" | translate }}</small>
              </span>
            </button>
            <button
              type="button"
              class="fcm-choice"
              id="fcm-save-copy"
              (click)="choose.emit('SAVE_COPY')"
            >
              <span class="material-icons">add_circle</span>
              <span>
                <b>{{ "RPM_FORMAT_SAVE_COPY" | translate }}</b>
                <small>{{
                  "RE_IMPORT_SAVE_COPY_HINT"
                    | translate: { name: suggestedName() }
                }}</small>
              </span>
            </button>
            <button
              type="button"
              class="fcm-choice danger"
              id="fcm-replace-mine"
              (click)="choose.emit('REPLACE_MINE')"
            >
              <span class="material-icons">published_with_changes</span>
              <span>
                <b>{{ "RPM_FORMAT_REPLACE_MINE" | translate }}</b>
                <small>{{ "RPM_FORMAT_REPLACE_MINE_HINT" | translate }}</small>
              </span>
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .fcm-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 3000;
    }
    .fcm-dialog {
      width: 90vw;
      max-width: 560px;
      background: #1e1e1e;
      color: #e2e8f0;
      border: 1px solid #334155;
      border-radius: 14px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.6);
      padding: 18px 20px 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .fcm-header {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }
    .fcm-icon {
      color: #f59e0b;
      font-size: 26px;
    }
    h2 {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 600;
      color: #f8fafc;
    }
    p {
      margin: 4px 0 0;
      color: #cbd5e1;
      font-size: 0.875rem;
    }
    .fcm-choices {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .fcm-choice {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      width: 100%;
      text-align: left;
      padding: 10px 12px;
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 8px;
      color: inherit;
      font: inherit;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .fcm-choice .material-icons {
      color: #38bdf8;
    }
    .fcm-choice b {
      display: block;
      color: #f8fafc;
      font-size: 0.9rem;
      font-weight: 600;
    }
    .fcm-choice small {
      color: #94a3b8;
      font-size: 0.78rem;
    }
    .fcm-choice:hover,
    .fcm-choice:focus-visible {
      border-color: #38bdf8;
      background: rgba(56, 189, 248, 0.08);
      outline: none;
    }
    .fcm-choice.danger .material-icons {
      color: #f87171;
    }
    .fcm-choice.danger:hover,
    .fcm-choice.danger:focus-visible {
      border-color: #f87171;
      background: rgba(239, 68, 68, 0.08);
    }
  `,
})
export class FormatConflictModalComponent {
  visible = input(false);
  existingName = input("");
  suggestedName = input("");
  choose = output<FormatConflictChoice>();
}
