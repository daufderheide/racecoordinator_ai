import { Injectable, NgZone, OnDestroy } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class FullscreenService implements OnDestroy {
  private isFullscreenSubject = new BehaviorSubject<boolean>(false);
  public isFullscreen$: Observable<boolean> =
    this.isFullscreenSubject.asObservable();

  private overrideValue: boolean | null = null;
  private mediaQueryList: MediaQueryList | null = null;
  private readonly boundCheckFullscreen: () => void;
  private readonly boundMediaChange: (e: MediaQueryListEvent) => void;

  constructor(private ngZone: NgZone) {
    this.boundCheckFullscreen = () => this.checkFullscreen();
    this.boundMediaChange = () => this.checkFullscreen();

    if (typeof window !== "undefined" && typeof document !== "undefined") {
      document.addEventListener("fullscreenchange", this.boundCheckFullscreen);
      document.addEventListener(
        "webkitfullscreenchange",
        this.boundCheckFullscreen,
      );
      document.addEventListener(
        "mozfullscreenchange",
        this.boundCheckFullscreen,
      );
      document.addEventListener(
        "MSFullscreenChange",
        this.boundCheckFullscreen,
      );
      document.addEventListener("visibilitychange", this.boundCheckFullscreen);
      window.addEventListener("resize", this.boundCheckFullscreen);
      window.addEventListener("focus", this.boundCheckFullscreen);

      if (window.matchMedia) {
        this.mediaQueryList = window.matchMedia("(display-mode: fullscreen)");
        if (this.mediaQueryList.addEventListener) {
          this.mediaQueryList.addEventListener("change", this.boundMediaChange);
        } else if ((this.mediaQueryList as any).addListener) {
          (this.mediaQueryList as any).addListener(this.boundMediaChange);
        }
      }

      if ((window as any).isPlaywright) {
        (window as any).fullscreenService = this;
      }
    }

    this.checkFullscreen();
  }

  ngOnDestroy() {
    if (typeof window !== "undefined" && typeof document !== "undefined") {
      document.removeEventListener(
        "fullscreenchange",
        this.boundCheckFullscreen,
      );
      document.removeEventListener(
        "webkitfullscreenchange",
        this.boundCheckFullscreen,
      );
      document.removeEventListener(
        "mozfullscreenchange",
        this.boundCheckFullscreen,
      );
      document.removeEventListener(
        "MSFullscreenChange",
        this.boundCheckFullscreen,
      );
      document.removeEventListener(
        "visibilitychange",
        this.boundCheckFullscreen,
      );
      window.removeEventListener("resize", this.boundCheckFullscreen);
      window.removeEventListener("focus", this.boundCheckFullscreen);

      if (this.mediaQueryList) {
        if (this.mediaQueryList.removeEventListener) {
          this.mediaQueryList.removeEventListener(
            "change",
            this.boundMediaChange,
          );
        } else if ((this.mediaQueryList as any).removeListener) {
          (this.mediaQueryList as any).removeListener(this.boundMediaChange);
        }
      }
    }
  }

  public isFullscreen(): boolean {
    if (this.overrideValue !== null) {
      return this.overrideValue;
    }
    return this.detectBrowserFullscreen();
  }

  public setFullscreenOverride(value: boolean | null) {
    this.overrideValue = value;
    this.updateState();
  }

  public checkFullscreen() {
    this.updateState();
  }

  private updateState() {
    const active = this.isFullscreen();
    if (this.isFullscreenSubject.value !== active) {
      this.ngZone.run(() => {
        this.isFullscreenSubject.next(active);
      });
    }
  }

  private detectBrowserFullscreen(): boolean {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return false;
    }

    const doc = document as any;
    const win = window as any;

    const hasFullscreenElement = !!(
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement
    );

    // In Playwright tests, the headless window geometry matches screen bounds by default.
    // Only consider fullscreen if explicitly active via Fullscreen API or override.
    if (win.isPlaywright) {
      return hasFullscreenElement;
    }

    // 1. HTML5 Fullscreen API (e.g. document.documentElement.requestFullscreen())
    if (hasFullscreenElement) {
      return true;
    }

    // 2. Firefox window.fullScreen property
    if (win.fullScreen) {
      return true;
    }

    // 3. Check browser display mode (OS fullscreen / PWA fullscreen)
    const isDisplayModeFullscreen = !!(
      win.matchMedia && win.matchMedia("(display-mode: fullscreen)").matches
    );

    if (isDisplayModeFullscreen) {
      // Check if the browser's native toolbar (tabs, URL bar, back/forward buttons) is HIDDEN.
      // When the browser toolbar is showing, outerHeight is significantly larger than innerHeight (by ~70-100px).
      // When the browser toolbar is hidden, outerHeight equals innerHeight (toolbar height <= 15px).
      if (
        typeof win.outerHeight === "number" &&
        typeof win.innerHeight === "number" &&
        win.outerHeight > 0
      ) {
        const toolbarHeight = win.outerHeight - win.innerHeight;
        return toolbarHeight <= 15;
      }

      return true;
    }

    return false;
  }

  public async requestFullscreen(): Promise<void> {
    if (typeof document === "undefined") return;
    const docEl = document.documentElement as any;
    if (docEl.requestFullscreen) {
      await docEl.requestFullscreen();
    } else if (docEl.webkitRequestFullscreen) {
      await docEl.webkitRequestFullscreen();
    } else if (docEl.mozRequestFullScreen) {
      await docEl.mozRequestFullScreen();
    } else if (docEl.msRequestFullscreen) {
      await docEl.msRequestFullscreen();
    }
    this.checkFullscreen();
  }

  public async exitFullscreen(): Promise<void> {
    if (typeof document === "undefined") return;
    const doc = document as any;
    if (doc.exitFullscreen) {
      await doc.exitFullscreen();
    } else if (doc.webkitExitFullscreen) {
      await doc.webkitExitFullscreen();
    } else if (doc.mozCancelFullScreen) {
      await doc.mozCancelFullScreen();
    } else if (doc.msExitFullscreen) {
      await doc.msExitFullscreen();
    }
    this.checkFullscreen();
  }

  public async toggleFullscreen(): Promise<void> {
    if (this.isFullscreen()) {
      await this.exitFullscreen();
    } else {
      await this.requestFullscreen();
    }
  }
}
