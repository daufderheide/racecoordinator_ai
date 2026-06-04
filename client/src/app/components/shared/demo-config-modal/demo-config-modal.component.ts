import { Component, effect, input, OnInit, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DataService } from "@app/data.service";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { IDemoConfig } from "@app/proto/antigravity";

@Component({
  standalone: true,
  selector: "app-demo-config-modal",
  template: `
    @if (visible()) {
      <div class="modal-overlay">
        <div class="modal-content demo-config-modal">
          <div class="modal-header">
            <h2>{{ "RDS_DEMO_CONFIG_TITLE" | translate }}</h2>
            <button class="close-btn" (click)="onCancel()">&times;</button>
          </div>
          <div class="modal-body">
            <div class="config-grid">
              <div class="config-group">
                <label>{{ "RDS_DEMO_MIN_LAP_TIME" | translate }}</label>
                <input
                  type="number"
                  step="0.001"
                  [(ngModel)]="uiConfig.minLapTime"
                />
              </div>
              <div class="config-group">
                <label>{{ "RDS_DEMO_MAX_LAP_TIME" | translate }}</label>
                <input
                  type="number"
                  step="0.001"
                  [(ngModel)]="uiConfig.maxLapTime"
                />
              </div>
              <div class="config-group">
                <label>{{ "RDS_DEMO_MIN_REFUEL_TIME" | translate }}</label>
                <input
                  type="number"
                  step="0.001"
                  [(ngModel)]="uiConfig.minRefuelTime"
                />
              </div>
              <div class="config-group">
                <label>{{ "RDS_DEMO_MAX_REFUEL_TIME" | translate }}</label>
                <input
                  type="number"
                  step="0.001"
                  [(ngModel)]="uiConfig.maxRefuelTime"
                />
              </div>
              <div class="config-group">
                <label>{{ "RDS_DEMO_NUM_SEGMENTS" | translate }}</label>
                <input type="number" [(ngModel)]="uiConfig.numSegments" />
              </div>
              <div class="config-group">
                <label>{{
                  "RDS_DEMO_MIN_LAPS_BETWEEN_PITS" | translate
                }}</label>
                <input
                  type="number"
                  [(ngModel)]="uiConfig.minLapsBetweenPits"
                />
              </div>
              <div class="config-group">
                <label>{{
                  "RDS_DEMO_MAX_LAPS_BETWEEN_PITS" | translate
                }}</label>
                <input
                  type="number"
                  [(ngModel)]="uiConfig.maxLapsBetweenPits"
                />
              </div>
              <div class="config-group">
                <label>{{ "RDS_DEMO_MIN_REACTION_TIME" | translate }}</label>
                <input
                  type="number"
                  step="0.001"
                  [(ngModel)]="uiConfig.minReactionTime"
                />
              </div>
              <div class="config-group">
                <label>{{ "RDS_DEMO_MAX_REACTION_TIME" | translate }}</label>
                <input
                  type="number"
                  step="0.001"
                  [(ngModel)]="uiConfig.maxReactionTime"
                />
              </div>
              <div class="config-group">
                <label>{{ "RDS_DEMO_MIN_PIT_ENTRY_OFFSET" | translate }}</label>
                <input
                  type="number"
                  step="0.001"
                  [(ngModel)]="uiConfig.minPitEntryOffset"
                />
              </div>
              <div class="config-group">
                <label>{{ "RDS_DEMO_MAX_PIT_ENTRY_OFFSET" | translate }}</label>
                <input
                  type="number"
                  step="0.001"
                  [(ngModel)]="uiConfig.maxPitEntryOffset"
                />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="modal-btn reset" (click)="onReset()">
              {{ "RDS_DEMO_BTN_RESET_DEFAULTS" | translate }}
            </button>
            <div class="spacer"></div>
            <button class="modal-btn cancel" (click)="onCancel()">
              {{ "RDS_BTN_CANCEL" | translate }}
            </button>
            <button class="modal-btn confirm" (click)="onConfirm()">
              {{ "GEN_OK" | translate }}
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
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
      }
      .modal-content {
        background: #0a0a12;
        border: 1px solid #00f0ff;
        border-radius: 8px;
        width: 600px;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 0 50px rgba(0, 240, 255, 0.2);
      }
      .modal-header {
        padding: 15px 20px;
        border-bottom: 1px solid rgba(0, 240, 255, 0.3);
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: rgba(0, 240, 255, 0.05);
      }
      .modal-header h2 {
        margin: 0;
        color: #00f0ff;
        font-size: 1.25rem;
        text-transform: uppercase;
        letter-spacing: 1px;
        font-family: "Orbitron", sans-serif;
      }
      .close-btn {
        background: none;
        border: none;
        color: #00f0ff;
        font-size: 24px;
        cursor: pointer;
        opacity: 0.7;
      }
      .close-btn:hover {
        opacity: 1;
      }
      .modal-body {
        padding: 20px;
        overflow-y: auto;
        background: radial-gradient(circle at center, #1a1a24 0%, #0a0a12 100%);
      }
      .config-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
      }
      .config-group {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      .config-group label {
        font-size: 11px;
        color: #00f0ff;
        text-transform: uppercase;
        letter-spacing: 1px;
        opacity: 0.8;
      }
      .config-group input {
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid #444;
        border-radius: 4px;
        padding: 10px 12px;
        color: #fff;
        font-size: 14px;
        transition: all 0.2s;
      }
      .config-group input:focus {
        outline: none;
        border-color: #00f0ff;
        box-shadow: 0 0 10px rgba(0, 240, 255, 0.3);
        background: rgba(0, 240, 255, 0.05);
      }
      .modal-footer {
        padding: 15px 20px;
        border-top: 1px solid rgba(0, 240, 255, 0.3);
        display: flex;
        gap: 15px;
        align-items: center;
        background: rgba(0, 240, 255, 0.05);
      }
      .spacer {
        flex: 1;
      }
      .modal-btn {
        padding: 10px 20px;
        border-radius: 4px;
        font-weight: 700;
        cursor: pointer;
        border: 1px solid transparent;
        transition: all 0.2s;
        text-transform: uppercase;
        letter-spacing: 1px;
        font-size: 12px;
      }
      .modal-btn.confirm {
        background: #00f0ff;
        color: #000;
      }
      .modal-btn.confirm:hover {
        background: #33f3ff;
        box-shadow: 0 0 15px rgba(0, 240, 255, 0.5);
      }
      .modal-btn.cancel {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(255, 255, 255, 0.2);
        color: #fff;
      }
      .modal-btn.cancel:hover {
        background: rgba(255, 255, 255, 0.15);
        border-color: #fff;
      }
      .modal-btn.reset {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
        border-color: rgba(239, 68, 68, 0.3);
      }
      .modal-btn.reset:hover {
        background: rgba(239, 68, 68, 0.2);
        border-color: #ef4444;
        box-shadow: 0 0 10px rgba(239, 68, 68, 0.3);
      }
    `,
  ],
  imports: [FormsModule, TranslatePipe],
})
export class DemoConfigModalComponent implements OnInit {
  visible = input(false);
  initialConfig = input<IDemoConfig | undefined>();

  cancel = output<void>();
  confirm = output<IDemoConfig>();

  config: IDemoConfig = {};
  uiConfig: any = {};

  constructor(private dataService: DataService) {
    effect(() => {
      if (this.visible()) {
        this.resetToInitial();
      }
    });
  }

  ngOnInit() {
    this.resetToInitial();
  }

  resetToInitial() {
    const initial = this.initialConfig();
    this.loadConfig(initial || this.dataService.getDefaultDemoConfig());
  }

  loadConfig(config: IDemoConfig) {
    this.config = { ...config };
    this.uiConfig = {
      minLapTime: (config.minLapTimeMs || 0) / 1000,
      maxLapTime: (config.maxLapTimeMs || 0) / 1000,
      minRefuelTime: (config.minRefuelTimeMs || 0) / 1000,
      maxRefuelTime: (config.maxRefuelTimeMs || 0) / 1000,
      numSegments: config.numSegments,
      minLapsBetweenPits: config.minLapsBetweenPits,
      maxLapsBetweenPits: config.maxLapsBetweenPits,
      minReactionTime: (config.minReactionTimeMs || 0) / 1000,
      maxReactionTime: (config.maxReactionTimeMs || 0) / 1000,
      minPitEntryOffset: (config.minPitEntryOffsetMs || 0) / 1000,
      maxPitEntryOffset: (config.maxPitEntryOffsetMs || 0) / 1000,
    };
  }

  onReset() {
    this.loadConfig(this.dataService.getDefaultDemoConfig());
  }

  onCancel() {
    this.cancel.emit();
  }

  onConfirm() {
    this.config.minLapTimeMs = (this.uiConfig.minLapTime || 0) * 1000;
    this.config.maxLapTimeMs = (this.uiConfig.maxLapTime || 0) * 1000;
    this.config.minRefuelTimeMs = (this.uiConfig.minRefuelTime || 0) * 1000;
    this.config.maxRefuelTimeMs = (this.uiConfig.maxRefuelTime || 0) * 1000;
    this.config.numSegments = this.uiConfig.numSegments;
    this.config.minLapsBetweenPits = this.uiConfig.minLapsBetweenPits;
    this.config.maxLapsBetweenPits = this.uiConfig.maxLapsBetweenPits;
    this.config.minReactionTimeMs = (this.uiConfig.minReactionTime || 0) * 1000;
    this.config.maxReactionTimeMs = (this.uiConfig.maxReactionTime || 0) * 1000;
    this.config.minPitEntryOffsetMs =
      (this.uiConfig.minPitEntryOffset || 0) * 1000;
    this.config.maxPitEntryOffsetMs =
      (this.uiConfig.maxPitEntryOffset || 0) * 1000;

    this.confirm.emit(this.config);
  }
}
