import { Injectable, OnDestroy } from "@angular/core";
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  Router,
} from "@angular/router";
import { BehaviorSubject, Subscription } from "rxjs";
import { filter } from "rxjs/operators";

@Injectable({
  providedIn: "root",
})
export class NavigationService implements OnDestroy {
  private history: string[] = [];
  private direction: "forward" | "backward" = "forward";
  private previousUrl: string | null = null;
  private lastEditedMap = new Map<string, string>();

  private currentIndex = 0;
  private maxIndex = 0;
  private isPopState = false;
  private popStateTargetIndex: number | null = null;

  public canGoBack$ = new BehaviorSubject<boolean>(false);
  public canGoForward$ = new BehaviorSubject<boolean>(false);

  private routerSub?: Subscription;
  private readonly boundPopStateListener: (e: PopStateEvent) => void;

  constructor(private router: Router) {
    this.boundPopStateListener = (event: PopStateEvent) => {
      this.isPopState = true;
      if (event.state && typeof event.state.appHistoryIndex === "number") {
        this.popStateTargetIndex = event.state.appHistoryIndex;
      } else {
        this.popStateTargetIndex = null;
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("popstate", this.boundPopStateListener);

      if (
        window.history &&
        window.history.state &&
        typeof window.history.state.appHistoryIndex === "number"
      ) {
        this.currentIndex = window.history.state.appHistoryIndex;
        this.maxIndex = this.currentIndex;
      } else if (window.history && window.history.replaceState) {
        window.history.replaceState(
          { ...window.history.state, appHistoryIndex: 0 },
          "",
        );
      }
    }

    if (this.router.events) {
      this.routerSub = this.router.events
        .pipe(
          filter(
            (event) =>
              event instanceof NavigationEnd ||
              event instanceof NavigationCancel ||
              event instanceof NavigationError,
          ),
        )
        .subscribe((event: any) => {
          if (event instanceof NavigationEnd) {
            this.handleNavigationEnd(event.urlAfterRedirects);
          } else {
            this.isPopState = false;
            this.popStateTargetIndex = null;
            this.updateCanNavigateState();
          }
        });
    }
  }

  ngOnDestroy() {
    if (typeof window !== "undefined") {
      window.removeEventListener("popstate", this.boundPopStateListener);
    }

    if (this.routerSub) {
      this.routerSub.unsubscribe();
    }
  }

  private handleNavigationEnd(url: string) {
    const prev = this.history[this.history.length - 1] || null;

    if (
      this.history.length > 1 &&
      this.history[this.history.length - 2] === url
    ) {
      // Navigating back
      this.direction = "backward";
      this.history.pop();
    } else {
      // Navigating forward
      this.direction = "forward";
      this.history.push(url);
    }
    this.previousUrl = prev;

    if (this.isPopState) {
      if (this.popStateTargetIndex !== null) {
        this.currentIndex = this.popStateTargetIndex;
      } else if (this.direction === "backward") {
        this.currentIndex = Math.max(0, this.currentIndex - 1);
      } else {
        this.currentIndex = Math.min(this.maxIndex, this.currentIndex + 1);
      }
    } else {
      if (this.history.length > 1) {
        this.currentIndex++;
        this.maxIndex = this.currentIndex;
      } else {
        this.currentIndex = 0;
        this.maxIndex = 0;
      }
      if (typeof window !== "undefined" && window.history?.replaceState) {
        window.history.replaceState(
          { ...window.history.state, appHistoryIndex: this.currentIndex },
          "",
        );
      }
    }
    this.updateCanNavigateState();

    this.isPopState = false;
    this.popStateTargetIndex = null;
  }

  private updateCanNavigateState() {
    this.canGoBack$.next(this.currentIndex > 0);
    this.canGoForward$.next(this.currentIndex < this.maxIndex);
  }

  public getDirection(): "forward" | "backward" {
    return this.direction;
  }

  public getPreviousUrl(): string | null {
    return this.previousUrl;
  }

  public canGoBack(): boolean {
    return this.canGoBack$.value;
  }

  public canGoForward(): boolean {
    return this.canGoForward$.value;
  }

  public goBack(): void {
    if (typeof window !== "undefined" && this.canGoBack()) {
      window.history.back();
    }
  }

  public goForward(): void {
    if (typeof window !== "undefined" && this.canGoForward()) {
      window.history.forward();
    }
  }

  public resetHistory(): void {
    this.history = [];
    this.currentIndex = 0;
    this.maxIndex = 0;
    this.previousUrl = null;
    this.direction = "forward";
    this.updateCanNavigateState();
  }

  public setLastEditedId(type: string, id: string) {
    this.lastEditedMap.set(type, id);
  }

  public getLastEditedId(type: string): string | null {
    return this.lastEditedMap.get(type) || null;
  }

  public clearLastEditedId(type: string) {
    this.lastEditedMap.delete(type);
  }
}
