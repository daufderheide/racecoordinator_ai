import { CdkDrag } from "@angular/cdk/drag-drop";
import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { Subscription } from "rxjs";
import { DataService } from "@app/data.service";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { SystemState } from "@app/proto/antigravity";

@Component({
  standalone: true,
  selector: "app-replay-status",
  imports: [CommonModule, CdkDrag, TranslatePipe],
  template: `
    @if (isReplayMode) {
      <div class="replay-status-container" cdkDrag>
        <div class="status-header">
          <span class="status-title">{{ "LOG_REPLAY_TITLE" | translate }}</span>
          <span class="status-badge" [class.finished]="isFinished">
            {{
              isFinished
                ? ("LOG_REPLAY_FINISHED" | translate)
                : ("LOG_REPLAY_PLAYING" | translate)
            }}
          </span>
        </div>
        <div class="progress-section">
          <div class="progress-bar-bg">
            <div
              class="progress-bar-fill"
              [style.width.%]="progressPercent"
            ></div>
          </div>
          <div class="progress-text">
            <span>{{
              "LOG_REPLAY_LINE"
                | translate: { processed: linesProcessed, total: totalLines }
            }}</span>
            <span class="log-time">{{ currentLogTime }}</span>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .replay-status-container {
        position: absolute;
        top: 20px;
        left: 20px;
        background-color: rgba(30, 30, 30, 0.9);
        border: 1px solid #444;
        border-radius: 8px;
        padding: 12px 16px;
        width: 300px;
        z-index: 9999;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        color: #e0e0e0;
        font-family:
          -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica,
          Arial, sans-serif;
        cursor: move;
      }
      .replay-status-container:active {
        cursor: grabbing;
      }
      .status-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      .status-title {
        font-weight: 600;
        font-size: 14px;
        color: #fff;
      }
      .status-badge {
        font-size: 10px;
        font-weight: bold;
        padding: 2px 6px;
        border-radius: 4px;
        background-color: #007bff;
        color: white;
      }
      .status-badge.finished {
        background-color: #28a745;
      }
      .progress-section {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .progress-bar-bg {
        width: 100%;
        height: 6px;
        background-color: #333;
        border-radius: 3px;
        overflow: hidden;
      }
      .progress-bar-fill {
        height: 100%;
        background-color: #007bff;
        transition: width 0.2s ease-out;
      }
      .progress-text {
        display: flex;
        justify-content: space-between;
        font-size: 11px;
        color: #aaa;
      }
      .log-time {
        font-family: monospace;
      }
    `,
  ],
})
export class ReplayStatusComponent implements OnInit, OnDestroy {
  isReplayMode = false;
  linesProcessed = 0;
  totalLines = 0;
  currentLogTime = "";
  isFinished = false;

  private subscription?: Subscription;

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.subscription = this.dataService
      .getSystemState()
      .subscribe((state: SystemState | null) => {
        if (state) {
          this.isReplayMode = !!state.isReplayMode;
          if (state.logReplayStatus) {
            this.linesProcessed = state.logReplayStatus.linesProcessed || 0;
            this.totalLines = state.logReplayStatus.totalLines || 0;
            this.currentLogTime = state.logReplayStatus.currentLogTime || "";
            this.isFinished = !!state.logReplayStatus.isFinished;
          }
        }
      });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  get progressPercent(): number {
    if (this.totalLines === 0) return 0;
    return Math.min(
      100,
      Math.max(0, (this.linesProcessed / this.totalLines) * 100),
    );
  }
}
