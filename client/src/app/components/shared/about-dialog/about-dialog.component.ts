import {
  AfterViewInit,
  Component,
  Directive,
  effect,
  ElementRef,
  input,
  NgZone,
  OnDestroy,
  output,
  signal,
} from "@angular/core";
import * as QRCode from "qrcode";
import { TranslatePipe } from "@app/pipes/translate.pipe";

import { GRIEVING_FAMILIES_BANNER_BASE64 } from "./banner-image";

export type AboutTab = "info" | "charity" | "credits";

@Directive({
  standalone: true,
  selector: "[appCreditsScroll]",
})
export class CreditsScrollDirective implements AfterViewInit, OnDestroy {
  isPlaying = input<boolean>(true);
  speed = input<number>(2);
  isRewinding = input<boolean>(false);

  private anim?: Animation;
  private rafId?: number;
  private readonly animDuration = 40000;

  constructor(
    private el: ElementRef<HTMLElement>,
    private ngZone: NgZone,
  ) {
    effect(() => {
      this.isPlaying();
      this.speed();
      this.isRewinding();
      this.updateAnimation();
    });
  }

  ngAfterViewInit() {
    this.initAnimation();
  }

  private initAnimation() {
    if (!this.el.nativeElement) return;
    this.anim = this.el.nativeElement.animate(
      [{ transform: "translateY(0)" }, { transform: "translateY(-100%)" }],
      {
        duration: this.animDuration,
        iterations: Infinity,
        easing: "linear",
      },
    );
    this.updateAnimation();
  }

  private updateAnimation() {
    if (!this.anim) return;
    const dir = this.isRewinding() ? -1 : 1;
    this.anim.playbackRate = this.speed() * dir;

    if (this.isPlaying()) {
      if (this.anim.playState !== "running") {
        this.anim.play();
      }
      this.startLoopCheck();
    } else {
      if (this.anim.playState !== "paused") {
        this.anim.pause();
      }
      this.stopLoopCheck();
    }
  }

  private startLoopCheck() {
    this.stopLoopCheck();
    this.ngZone.runOutsideAngular(() => {
      const check = () => {
        const time = this.anim?.currentTime
          ? Number(this.anim.currentTime)
          : null;
        if (
          this.anim &&
          this.isRewinding() &&
          time !== null &&
          !isNaN(time) &&
          time <= 10
        ) {
          this.anim.currentTime = this.animDuration;
        }
        if (this.isPlaying()) {
          this.rafId = requestAnimationFrame(check);
        }
      };
      this.rafId = requestAnimationFrame(check);
    });
  }

  private stopLoopCheck() {
    if (this.rafId !== undefined) {
      cancelAnimationFrame(this.rafId);
      this.rafId = undefined;
    }
  }

  ngOnDestroy() {
    this.stopLoopCheck();
    this.anim?.cancel();
  }
}

@Component({
  standalone: true,
  selector: "app-about-dialog",
  template: `
    @if (visible()) {
      <div class="modal-backdrop">
        <div
          class="modal-content"
          [class.credits-mode]="activeTab() === 'credits'"
        >
          <h2 class="modal-title">{{ "RDS_ABOUT_TITLE" | translate }}</h2>

          <!-- Navigation Tabs -->
          <div class="dialog-tabs" role="tablist">
            <button
              class="tab-btn"
              [class.active]="activeTab() === 'info'"
              (click)="selectTab('info')"
              type="button"
              role="tab"
              [attr.aria-selected]="activeTab() === 'info'"
            >
              {{ "RDS_ABOUT_TAB_INFO" | translate }}
            </button>
            <button
              class="tab-btn"
              [class.active]="activeTab() === 'charity'"
              (click)="selectTab('charity')"
              type="button"
              role="tab"
              [attr.aria-selected]="activeTab() === 'charity'"
            >
              {{ "RDS_ABOUT_TAB_CHARITY" | translate }}
            </button>
            <button
              class="tab-btn"
              [class.active]="activeTab() === 'credits'"
              (click)="selectTab('credits')"
              type="button"
              role="tab"
              [attr.aria-selected]="activeTab() === 'credits'"
            >
              {{ "RDS_ABOUT_TAB_CREDITS" | translate }}
            </button>
          </div>

          <!-- Tab 1: Version & Connection Info -->
          @if (activeTab() === "info") {
            <div class="tab-panel version-info">
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

              <!-- Open Source Software Card -->
              <div class="opensource-card">
                <h4>{{ "RDS_ABOUT_OPEN_SOURCE_HEADING" | translate }}</h4>
                <p class="opensource-desc">
                  {{ "RDS_ABOUT_OPEN_SOURCE_DESC" | translate }}
                </p>
                <div class="github-buttons-wrapper">
                  <a
                    [href]="githubRepoUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="github-btn"
                  >
                    {{ "RDS_ABOUT_GITHUB_REPO_BTN" | translate }}
                  </a>
                  <a
                    [href]="githubIssuesUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="github-btn github-btn-secondary"
                  >
                    {{ "RDS_ABOUT_GITHUB_ISSUES_BTN" | translate }}
                  </a>
                </div>
              </div>
            </div>
          }

          <!-- Tab 2: Charity & Mission Info -->
          @if (activeTab() === "charity") {
            <div class="tab-panel charity-info">
              <!-- Top Banner Image linking to firstcandle.org -->
              <a
                href="https://firstcandle.org"
                target="_blank"
                rel="noopener noreferrer"
                class="banner-link"
                title="Visit firstcandle.org"
              >
                <img
                  [src]="bannerImage"
                  alt="Forget-Me-Nots - First Candle Dedication"
                  class="charity-banner-img"
                />
              </a>

              <!-- Dedication Caption -->
              <p class="dedication-caption">
                {{ "RDS_CHARITY_DEDICATION" | translate }}
              </p>

              <div class="charity-card">
                <h3>{{ "RDS_CHARITY_HEADING" | translate }}</h3>
                <p class="charity-desc">
                  {{ "RDS_CHARITY_DESCRIPTION" | translate }}
                </p>
                <a
                  href="https://firstcandle.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="website-link-btn"
                >
                  {{ "RDS_CHARITY_VISIT_WEBSITE" | translate }}
                </a>
              </div>

              <!-- Direct PayPal Donation Section -->
              <div class="donate-section">
                <h4 class="donate-heading">
                  {{ "RDS_CHARITY_DONATE_HEADING" | translate }}
                </h4>
                <p class="donate-sub">
                  {{ "RDS_CHARITY_DONATE_SUB" | translate }}
                </p>
                <div class="donate-qr-wrapper">
                  <a
                    [href]="donateUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="donate-link"
                    title="Donate via PayPal"
                  >
                    @if (donateQrCodeUrl()) {
                      <img
                        [src]="donateQrCodeUrl()"
                        alt="Donate via PayPal QR Code"
                        class="donate-qr-code"
                      />
                    }
                  </a>
                </div>
              </div>
            </div>
          }

          <!-- Tab 3: Movie-Style Credits -->
          @if (activeTab() === "credits") {
            <div class="tab-panel credits-panel">
              <div class="credits-viewport">
                <div class="credits-overlay-top"></div>
                <div
                  class="credits-content"
                  appCreditsScroll
                  [isPlaying]="isCreditsPlaying()"
                  [speed]="creditSpeed()"
                  [isRewinding]="isRewinding()"
                >
                  <div class="movie-header">
                    <h1 class="movie-title">
                      {{ "RDS_CREDITS_HEADING" | translate }}
                    </h1>
                    <div class="movie-sub">
                      {{ "RDS_CREDITS_SUBTITLE" | translate }}
                    </div>
                  </div>

                  <div class="credit-section">
                    <div class="credit-role">CREATOR & LEAD DEVELOPER</div>
                    <div class="credit-name highlight">
                      Dave 'Bad Cheese' Aufderheide
                    </div>
                  </div>

                  <div class="credit-section">
                    <div class="credit-role">CONTRIBUTORS</div>
                    <div class="credit-name">AV-Git-Account</div>
                    <div class="credit-name">BigBadBuzz</div>
                    <div class="credit-name">crxed9</div>
                    <div class="credit-name">Dopamine</div>
                    <div class="credit-name">luizvaldetaro</div>
                    <div class="credit-name">mark h</div>
                    <div class="credit-name">Rinkrat99</div>
                    <div class="credit-name">Slot'n 77</div>
                  </div>

                  <div class="credit-section">
                    <div class="credit-role">SPECIAL THANKS</div>
                    <div class="credit-name">All the folks on SlotForum</div>
                    <div class="credit-name">Dieter Gugel</div>
                    <div class="credit-name">
                      Gene Stalnecker aka SwamperGene
                    </div>
                    <div class="credit-name">Rick Fields</div>
                    <div class="credit-name">Ryk Weiss</div>
                    <div class="credit-name">SlingshotX</div>
                    <div class="credit-name">The Viasue Pit Crew</div>
                  </div>

                  <div class="credit-section">
                    <div class="credit-role">AI PAIRING ASSISTANT</div>
                    <div class="credit-name">
                      Antigravity AI (Google DeepMind)
                    </div>
                  </div>

                  <div class="credit-section">
                    <div class="credit-role">TECHNOLOGY STACK</div>
                    <div class="credit-name">Angular & RxJS</div>
                    <div class="credit-name">Java 21 & Spring Boot</div>
                    <div class="credit-name">SQLite Embedded Database</div>
                  </div>

                  <div class="credit-section">
                    <div class="credit-role">SUPPORT & MISSION</div>
                    <div class="credit-name">
                      First Candle & Community Racing Programs
                    </div>
                  </div>

                  <div class="credits-end">
                    <p>— THANK YOU FOR RACING WITH US —</p>
                  </div>
                </div>
                <div class="credits-overlay-bottom"></div>
              </div>

              <!-- Controls Toolbar -->
              <div class="credits-controls">
                <button
                  class="ctrl-btn"
                  (click)="togglePlayPause()"
                  type="button"
                >
                  {{
                    (isCreditsPlaying()
                      ? "RDS_CREDITS_PAUSE"
                      : "RDS_CREDITS_PLAY"
                    ) | translate
                  }}
                </button>
                <button
                  class="ctrl-btn"
                  [class.active]="isRewinding()"
                  (click)="toggleRewind()"
                  type="button"
                >
                  {{
                    (isRewinding()
                      ? "RDS_CREDITS_FORWARD"
                      : "RDS_CREDITS_REWIND"
                    ) | translate
                  }}
                </button>
                <button class="ctrl-btn" (click)="toggleSpeed()" type="button">
                  {{
                    "RDS_CREDITS_SPEED" | translate: { speed: creditSpeed() }
                  }}
                </button>
              </div>
            </div>
          }

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
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
      }
      .modal-content {
        background: #2b2b2b;
        color: #fff;
        padding: 24px 28px;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
        width: 520px;
        max-width: 92vw;
        max-height: 88vh;
        overflow-y: auto;
        text-align: center;
        border: 1px solid #444;
        transition: all 0.3s ease;
      }
      .modal-content.credits-mode {
        background: #181818;
        border-color: #555;
      }
      .modal-title {
        margin-top: 0;
        color: #ffa500;
        font-size: 1.8rem;
        margin-bottom: 16px;
      }
      /* Tab Navigation */
      .dialog-tabs {
        display: flex;
        gap: 8px;
        justify-content: center;
        margin-bottom: 16px;
        border-bottom: 1px solid #444;
        padding-bottom: 12px;
      }
      .tab-btn {
        background: transparent;
        color: #aaa;
        padding: 8px 14px;
        border: 1px solid #444;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.95rem;
        transition: all 0.2s ease;
      }
      .tab-btn:hover {
        color: #fff;
        border-color: #666;
      }
      .tab-btn.active {
        background: #ffa500;
        color: #000;
        font-weight: bold;
        border-color: #ffa500;
      }
      .tab-panel {
        min-height: 280px;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
      }

      /* Version Info */
      .version-info {
        font-size: 1rem;
        line-height: 1.5;
        justify-content: flex-start;
      }
      .version-info .version-line {
        margin: 4px 0;
      }
      .qr-container {
        margin-top: 10px;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .qr-text {
        font-size: 0.9rem;
        color: #ccc;
        margin-bottom: 6px;
      }
      .qr-code {
        width: 110px;
        height: 110px;
        border-radius: 6px;
        border: 2px solid #fff;
      }

      /* Open Source Card */
      .opensource-card {
        background: #222;
        border: 1px solid #444;
        border-radius: 10px;
        padding: 10px 14px;
        margin-top: 10px;
      }
      .opensource-card h4 {
        margin: 0 0 4px 0;
        color: #ffa500;
        font-size: 1.05rem;
      }
      .opensource-desc {
        font-size: 0.85rem;
        color: #ccc;
        line-height: 1.35;
        margin: 0 0 8px 0;
      }
      .github-buttons-wrapper {
        display: flex;
        gap: 8px;
        justify-content: center;
        flex-wrap: wrap;
      }
      .github-btn {
        display: inline-block;
        padding: 6px 14px;
        background: #ffa500;
        color: #000;
        font-weight: bold;
        text-decoration: none;
        border-radius: 6px;
        font-size: 0.82rem;
        transition: all 0.2s ease;
      }
      .github-btn:hover {
        background: #ffb733;
        transform: translateY(-1px);
      }
      .github-btn-secondary {
        background: #383838;
        color: #fff;
        border: 1px solid #555;
      }
      .github-btn-secondary:hover {
        background: #484848;
        color: #ffa500;
        border-color: #ffa500;
      }

      /* Charity & Mission Tab */
      .charity-info {
        padding-right: 0;
        justify-content: flex-start;
      }
      .banner-link {
        display: block;
        border-radius: 8px;
        overflow: hidden;
        margin: 0 0 8px 0;
        transition: transform 0.2s ease;
      }
      .banner-link:hover {
        transform: scale(1.015);
      }
      .charity-banner-img {
        width: 100%;
        height: 105px;
        object-fit: cover;
        display: block;
        border-radius: 8px;
        border: 1px solid #555;
      }
      .dedication-caption {
        font-style: italic;
        color: #ffb703;
        font-size: 0.9rem;
        line-height: 1.35;
        margin: 4px 0 8px 0;
        text-align: center;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
      }
      .charity-card {
        background: #333;
        border: 1px solid #555;
        border-radius: 10px;
        padding: 10px 14px;
        margin: 6px 0;
      }
      .charity-card h3 {
        margin: 0 0 4px 0;
        color: #ffa500;
        font-size: 1.1rem;
      }
      .charity-desc {
        font-size: 0.88rem;
        color: #ddd;
        line-height: 1.35;
        margin-bottom: 8px;
      }
      .website-link-btn {
        display: inline-block;
        padding: 5px 14px;
        background: #ffa500;
        color: #000;
        font-weight: bold;
        text-decoration: none;
        border-radius: 6px;
        font-size: 0.85rem;
        transition: all 0.2s;
      }
      .website-link-btn:hover {
        background: #ffb733;
        transform: translateY(-1px);
      }

      /* PayPal Donation Section */
      .donate-section {
        background: #222;
        border: 1px solid #444;
        border-radius: 10px;
        padding: 10px 14px;
        margin-top: 6px;
      }
      .donate-heading {
        margin: 0 0 4px 0;
        color: #ffa500;
        font-size: 1.05rem;
      }
      .donate-sub {
        font-size: 0.82rem;
        color: #ccc;
        margin: 0 0 6px 0;
        line-height: 1.3;
      }
      .donate-qr-wrapper {
        display: flex;
        justify-content: center;
      }
      .donate-link {
        display: inline-block;
        transition: transform 0.2s;
      }
      .donate-link:hover {
        transform: scale(1.04);
      }
      .donate-qr-code {
        width: 85px;
        height: 85px;
        border-radius: 6px;
        border: 2px solid #fff;
      }

      /* Movie Credits Viewport */
      .credits-panel {
        justify-content: flex-start;
      }
      .credits-viewport {
        height: 280px;
        overflow: hidden;
        position: relative;
        background: #050505;
        border-radius: 8px;
        border: 1px solid #333;
        box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.8);
      }
      .credits-overlay-top,
      .credits-overlay-bottom {
        position: absolute;
        left: 0;
        right: 0;
        height: 40px;
        z-index: 10;
        pointer-events: none;
      }
      .credits-overlay-top {
        top: 0;
        background: linear-gradient(to bottom, #050505 0%, transparent 100%);
      }
      .credits-overlay-bottom {
        bottom: 0;
        background: linear-gradient(to top, #050505 0%, transparent 100%);
      }
      .credits-content {
        padding: 280px 20px 40px 20px;
      }
      .movie-header {
        margin-bottom: 30px;
      }
      .movie-title {
        color: #ffb703;
        font-size: 1.6rem;
        letter-spacing: 2px;
        text-transform: uppercase;
        margin: 0;
        text-shadow: 0 0 10px rgba(255, 183, 3, 0.4);
      }
      .movie-sub {
        color: #888;
        font-size: 0.85rem;
        letter-spacing: 3px;
        margin-top: 5px;
        text-transform: uppercase;
      }
      .credit-section {
        margin-bottom: 24px;
      }
      .credit-role {
        color: #888;
        font-size: 0.8rem;
        letter-spacing: 2px;
        text-transform: uppercase;
        margin-bottom: 4px;
      }
      .credit-name {
        color: #eee;
        font-size: 1.05rem;
        font-weight: 500;
      }
      .credit-name.highlight {
        color: #fff;
        font-size: 1.2rem;
        font-weight: bold;
      }
      .credits-end {
        margin-top: 40px;
        color: #ffb703;
        font-size: 0.85rem;
        letter-spacing: 2px;
      }

      /* Credits Controls Toolbar */
      .credits-controls {
        display: flex;
        justify-content: center;
        gap: 8px;
        margin-top: 12px;
      }
      .ctrl-btn {
        background: #252525;
        color: #ffa500;
        border: 1px solid #444;
        border-radius: 4px;
        padding: 6px 12px;
        font-size: 0.85rem;
        cursor: pointer;
        transition: all 0.2s;
      }
      .ctrl-btn:hover {
        background: #333;
        color: #ffb733;
        border-color: #666;
      }
      .ctrl-btn.active {
        background: #ffa500;
        color: #000;
        font-weight: bold;
        border-color: #ffa500;
      }

      .modal-actions {
        display: flex;
        justify-content: center;
        margin-top: 16px;
      }
      button {
        padding: 10px 24px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
        font-size: 1rem;
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
  imports: [TranslatePipe, CreditsScrollDirective],
})
export class AboutDialogComponent {
  visible = input(false);
  clientVersion = input("");
  serverVersion = input("");
  serverIp = input("");
  serverPort = input(7070);

  activeTab = signal<AboutTab>("info");
  isCreditsPlaying = signal<boolean>(true);
  creditSpeed = signal<number>(2);
  isRewinding = signal<boolean>(false);

  qrCodeUrl = signal<string>("");
  readonly bannerImage = GRIEVING_FAMILIES_BANNER_BASE64;
  readonly githubRepoUrl = "https://github.com/daufderheide/racecoordinator_ai";
  readonly githubIssuesUrl =
    "https://github.com/daufderheide/racecoordinator_ai/issues";
  readonly donateUrl =
    "https://www.paypal.com/donate/?business=daufderh@hotmail.com&currency_code=USD";
  donateQrCodeUrl = signal<string>("");

  close = output<void>();

  constructor(private el: ElementRef<HTMLElement>) {
    QRCode.toDataURL(this.donateUrl, { margin: 1, width: 180 })
      .then((dataUrl) => this.donateQrCodeUrl.set(dataUrl))
      .catch((err) => console.error("Donate QR Code generation failed", err));

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

  selectTab(tab: AboutTab) {
    this.activeTab.set(tab);
    if (tab === "credits") {
      this.isRewinding.set(false);
      this.isCreditsPlaying.set(true);
    }
    setTimeout(() => {
      const modalEl = this.el.nativeElement.querySelector(".modal-content");
      if (modalEl) {
        modalEl.scrollTop = 0;
      }
    }, 0);
  }

  togglePlayPause() {
    this.isCreditsPlaying.update((val) => !val);
  }

  toggleSpeed() {
    this.creditSpeed.update((spd) => (spd === 2 ? 4 : spd === 4 ? 1 : 2));
  }

  toggleRewind() {
    this.isRewinding.update((val) => !val);
    this.isCreditsPlaying.set(true);
  }

  onClose() {
    this.close.emit();
  }
}
