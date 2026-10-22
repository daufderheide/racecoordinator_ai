import { Injectable, NgZone, OnDestroy } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { LoggerService } from "@app/services/logger.service";

@Injectable({
  providedIn: "root",
})
export class WakeLockService implements OnDestroy {
  private sentinel: WakeLockSentinel | null = null;
  private shouldBeActive = false;
  private isActiveSubject = new BehaviorSubject<boolean>(false);
  public isActive$: Observable<boolean> = this.isActiveSubject.asObservable();

  private boundVisibilityChange: () => void;

  constructor(
    private logger: LoggerService,
    private ngZone: NgZone,
  ) {
    this.boundVisibilityChange = () => this.handleVisibilityChange();

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", this.boundVisibilityChange);
    }
  }

  public get isSupported(): boolean {
    return (
      typeof navigator !== "undefined" &&
      "wakeLock" in navigator &&
      navigator.wakeLock !== undefined
    );
  }

  public get isActive(): boolean {
    return this.isActiveSubject.value;
  }

  public async request(): Promise<boolean> {
    this.shouldBeActive = true;

    if (!this.isSupported) {
      this.logger.debug(
        "WakeLockService: Screen Wake Lock API is not supported in this browser.",
      );
      return false;
    }

    if (this.sentinel && !this.sentinel.released) {
      return true;
    }

    try {
      const sentinel = await navigator.wakeLock.request("screen");
      this.sentinel = sentinel;

      sentinel.addEventListener("release", () => {
        this.logger.debug(
          "WakeLockService: Screen wake lock released by system/browser.",
        );
        if (this.sentinel === sentinel) {
          this.sentinel = null;
        }
        this.ngZone.run(() => {
          this.isActiveSubject.next(false);
        });
      });

      this.ngZone.run(() => {
        this.isActiveSubject.next(true);
      });
      this.logger.debug(
        "WakeLockService: Screen wake lock acquired successfully.",
      );
      return true;
    } catch (e) {
      this.logger.debug(
        "WakeLockService: Failed to acquire screen wake lock",
        e,
      );
      return false;
    }
  }

  public async release(): Promise<void> {
    this.shouldBeActive = false;

    if (this.sentinel) {
      try {
        await this.sentinel.release();
      } catch (e) {
        this.logger.debug(
          "WakeLockService: Error releasing screen wake lock",
          e,
        );
      } finally {
        this.sentinel = null;
        this.ngZone.run(() => {
          this.isActiveSubject.next(false);
        });
      }
    }
  }

  private handleVisibilityChange(): void {
    if (
      typeof document !== "undefined" &&
      document.visibilityState === "visible" &&
      this.shouldBeActive &&
      (!this.sentinel || this.sentinel.released)
    ) {
      this.logger.debug(
        "WakeLockService: Tab visible again, re-acquiring screen wake lock.",
      );
      void this.request();
    }
  }

  ngOnDestroy(): void {
    if (typeof document !== "undefined") {
      document.removeEventListener(
        "visibilitychange",
        this.boundVisibilityChange,
      );
    }
    void this.release();
  }
}
