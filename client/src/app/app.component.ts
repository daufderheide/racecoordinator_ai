import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import {
  ChildrenOutletContexts,
  NavigationEnd,
  Router,
  RouterOutlet,
} from "@angular/router";
import { filter } from "rxjs/operators";
import { slideInAnimation } from "@app/utils/animations";

import { AnalyticsService } from "./analytics.service";
import { LockOverlayComponent } from "./components/lock-overlay/lock-overlay.component";
import { HelpOverlayComponent } from "./components/shared/help-overlay/help-overlay.component";
import { DataService } from "./data.service";
import { AuthService } from "./services/auth.service";
import { FileSystemService } from "./services/file-system.service";
import { LoggerService } from "./services/logger.service";
import { NavigationService } from "./services/navigation.service";
import { SettingsService } from "./services/settings.service";
import { ThemeService } from "./services/theme.service";

@Component({
  standalone: true,
  selector: "app-root",
  template: `
    <div class="app-route-container" [@routeAnimations]="routeAnimationData">
      <router-outlet></router-outlet>
    </div>
    <app-help-overlay></app-help-overlay>
    <app-lock-overlay></app-lock-overlay>
  `,
  animations: [slideInAnimation],
  styles: [
    `
      .app-route-container {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background-color: #000;
      }
    `,
  ],
  imports: [RouterOutlet, HelpOverlayComponent, LockOverlayComponent],
})
export class AppComponent implements OnInit {
  private navigationCounter = 0;
  private currentRandomType: string = "slide";
  protected routeAnimationData: string | null = null;

  constructor(
    private contexts: ChildrenOutletContexts,
    private dataService: DataService,
    private router: Router,
    private analyticsService: AnalyticsService,
    private settingsService: SettingsService,
    private navigationService: NavigationService,
    private themeService: ThemeService,
    private logger: LoggerService,
    private fileSystemService: FileSystemService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    this.logger.info("AppComponent: Initializing application...");

    // Initialize file logging if a handle is available
    if (!(window as any).isPlaywright) {
      this.fileSystemService.getCustomDirectoryHandle().then((handle) => {
        if (handle) {
          this.logger.registerFileLogging(this.fileSystemService);
          this.logger.info("AppComponent: File logging registered");
        }
      });
    }

    this.analyticsService.initTracking();
    this.dataService.connectToRaceDataSocket();

    // Initialize log levels from settings
    const settings = this.settingsService.getSettings();
    if (settings.clientLogLevel) {
      this.logger.setLevel(settings.clientLogLevel as any);
    }
    if (settings.serverLogLevel && !(window as any).isPlaywright) {
      this.dataService.setServerLogLevel(settings.serverLogLevel).subscribe({
        error: (err) =>
          this.logger.error("Failed to initialize server log level", err),
      });
    }

    this.themeService.initialize().then(() => {
      this.logger.debug("AppComponent: ThemeService initialized");
    });

    this.dataService.getSystemState().subscribe((state) => {
      if (state) {
        if (state.resourceLockState === "IDLE") {
          // If we are on raceday (but not setup) and the race ends, go back to splash
          if (
            this.router.url.includes("raceday") &&
            !this.router.url.includes("raceday-setup")
          ) {
            this.router.navigate(["/raceday-setup"]);
          }
        }
      }
    });

    this.dataService.getRaceUpdate().subscribe((_update) => {
      this.logger.debug("AppComponent: Received Race Update");
      // Removed forced navigation to /raceday to allow other components to handle updates
    });

    // Initial random selection and animation state
    this.selectRandomTransition();
    this.routeAnimationData = this.calculateRouteAnimationData();

    // Pick a random transition once per navigation to stabilize the animation
    let lastPath = this.router.url.split("?")[0];
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd,
        ),
      )
      .subscribe((event) => {
        const newPath = event.urlAfterRedirects.split("?")[0];
        if (newPath !== lastPath) {
          lastPath = newPath;
          this.navigationCounter++;
          this.selectRandomTransition();
          this.routeAnimationData = this.calculateRouteAnimationData();
        }
      });
  }
  private selectRandomTransition() {
    const transitions = ["slide", "zoom", "blur", "fade"];
    const randomIndex = Math.floor(Math.random() * transitions.length);
    this.currentRandomType = transitions[randomIndex];
  }

  public calculateRouteAnimationData() {
    const settings = this.settingsService.getSettings();
    const transition = settings.pageTransition || "slide";

    if (transition === "none") {
      return null;
    }

    const routePath =
      this.router.url.split("?")[0].replace(/^\//, "").replace(/\//g, "-") ||
      "home";
    let type = transition;

    if (transition === "random") {
      type = this.currentRandomType;
    }

    // Return unique state string to ensure the animation triggers on every navigation
    const direction = this.navigationService.getDirection();
    return `${type}:${direction}:${routePath}:${this.navigationCounter}`;
  }
}
