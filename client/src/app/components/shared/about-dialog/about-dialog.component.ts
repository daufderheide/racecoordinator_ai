import { Component, input, output } from "@angular/core";
import { effect, signal } from "@angular/core";
import * as QRCode from "qrcode";
import { TranslatePipe } from "@app/pipes/translate.pipe";

@Component({
  standalone: true,
  selector: "app-about-dialog",
  template: `
    @if (visible()) {
      <div class="modal-backdrop">
        <div class="modal-content">
          <h2 class="modal-title">{{ "RDS_ABOUT_TITLE" | translate }}</h2>
          <div class="version-info">
            <p>
              {{
                "RDS_ABOUT_CLIENT_VERSION"
                  | translate: { version: clientVersion() }
              }}
            </p>
            <p>
              {{
                "RDS_ABOUT_SERVER_VERSION"
                  | translate: { version: serverVersion() }
              }}
            </p>
            @if (serverIp()) {
              <p>
                {{
                  "RDS_ABOUT_SERVER_ADDRESS"
                    | translate: { ip: serverIp(), port: serverPort() }
                }}
              </p>
              <div class="qr-container">
                <p class="qr-text">{{ "RDS_ABOUT_SCAN_QR" | translate }}</p>
                @if (qrCodeUrl()) {
                  <img [src]="qrCodeUrl()" alt="QR Code" class="qr-code" />
                }
              </div>
            }
          </div>
          <div class="modal-actions">
            <button class="btn-confirm" (click)="onClose()">
              {{ "RDS_ABOUT_CLOSE" | translate }}
            </button>
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
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
      }
      .modal-content {
        background: #2b2b2b;
        color: #fff;
        padding: 30px;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
        min-width: 400px;
        text-align: center;
        border: 1px solid #444;
      }
      .modal-title {
        margin-top: 0;
        color: #ffa500;
        font-size: 1.8rem;
        margin-bottom: 25px;
      }
      .version-info {
        margin: 25px 0;
        font-size: 1.2rem;
        line-height: 1.6;
      }
      .version-info p {
        margin: 10px 0;
      }
      .qr-container {
        margin-top: 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .qr-text {
        font-size: 1rem;
        color: #ccc;
        margin-bottom: 10px;
      }
      .qr-code {
        width: 150px;
        height: 150px;
        border-radius: 8px;
        border: 4px solid #fff;
      }
      .modal-actions {
        display: flex;
        justify-content: center;
        margin-top: 30px;
      }
      button {
        padding: 12px 30px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
        font-size: 1.1rem;
        transition: all 0.2s;
      }
      .btn-confirm {
        background: #ffa500;
        color: #000;
      }
      .btn-confirm:hover {
        background: #ffb733;
        transform: translateY(-2px);
      }
    `,
  ],
  imports: [TranslatePipe],
})
export class AboutDialogComponent {
  visible = input(false);
  clientVersion = input("");
  serverVersion = input("");
  serverIp = input("");
  serverPort = input(7070);

  qrCodeUrl = signal<string>("");

  close = output<void>();

  constructor() {
    effect(() => {
      const ip = this.serverIp();
      if (ip) {
        const port = window.location.port;
        const url = `${window.location.protocol}//${ip}${port ? ":" + port : ""}`;
        QRCode.toDataURL(url, { margin: 1, width: 200 })
          .then((dataUrl) => this.qrCodeUrl.set(dataUrl))
          .catch((err) => console.error("QR Code generation failed", err));
      }
    });
  }

  onClose() {
    this.close.emit();
  }
}
