import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { Router } from "@angular/router";
import { of } from "rxjs";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { FullscreenService } from "@app/services/fullscreen.service";
import { NavigationService } from "@app/services/navigation.service";

@Component({
  standalone: true,
  selector: "app-browser-navigation",
  templateUrl: "./browser-navigation.component.html",
  styleUrls: ["./browser-navigation.component.css"],
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "[style.display]": 'isFullscreen() ? "inline-flex" : "none"',
  },
})
export class BrowserNavigationComponent {
  private fullscreenService = inject(FullscreenService, { optional: true });
  private navigationService = inject(NavigationService, { optional: true });
  private router = inject(Router, { optional: true });

  mode = input<"navigation" | "close" | undefined>(undefined);

  public effectiveMode = computed<"navigation" | "close">(() => {
    const explicit = this.mode();
    if (explicit) {
      return explicit;
    }
    const currentUrl =
      this.router?.url ||
      (typeof window !== "undefined"
        ? (window.location?.pathname || "") + (window.location?.search || "")
        : "");
    // TODO(aufderheide): Likely we want to put this into the page itself
    // rather than have this component understand which pages need the injection.
    if (currentUrl.includes("results")) {
      return "close";
    }
    return "navigation";
  });

  public isCloseMode = computed(() => this.effectiveMode() === "close");

  public isFullscreen = toSignal(
    this.fullscreenService?.isFullscreen$ || of(false),
    {
      initialValue: this.fullscreenService?.isFullscreen?.() ?? false,
    },
  );

  public canGoBack = toSignal(this.navigationService?.canGoBack$ || of(false), {
    initialValue: this.navigationService?.canGoBack?.() ?? false,
  });

  public canGoForward = toSignal(
    this.navigationService?.canGoForward$ || of(false),
    {
      initialValue: this.navigationService?.canGoForward?.() ?? false,
    },
  );

  closeClick = output<void>();

  public goBack(): void {
    this.navigationService?.goBack?.();
  }

  public goForward(): void {
    this.navigationService?.goForward?.();
  }

  public closeWindow(): void {
    this.closeClick.emit();
    if (typeof document !== "undefined" && document.fullscreenElement) {
      try {
        document.exitFullscreen();
      } catch (e) {
        // ignore
      }
    }
    if (typeof window !== "undefined") {
      try {
        window.close();
      } catch (e) {
        // ignore
      }
    }
  }
}
