import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
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

  public goBack(): void {
    this.navigationService?.goBack?.();
  }

  public goForward(): void {
    this.navigationService?.goForward?.();
  }
}
