import { Component, OnInit } from "@angular/core";
import {
  ChildrenOutletContexts,
  NavigationEnd,
  Router,
  RouterOutlet,
} from "@angular/router";
import { filter } from "rxjs/operators";
import { slideInAnimation } from "@app/utils/animations";

import { HelpOverlayComponent } from "./components/shared/help-overlay/help-overlay.component";
import { DataService } from "./data.service";
import { AnalyticsService } from "./services/analytics.service";
import { FileSystemService } from "./services/file-system.service";
import { LoggerService } from "./services/logger.service";
import { NavigationService } from "./services/navigation.service";
import { SettingsService } from "./services/settings.service";
import { ThemeService } from "./services/theme.service";

@Component({
  standalone: true,
  selector: "app-root",
  template: `
    <div
      class="app-route-container"
      [@routeAnimations]="getRouteAnimationData()"
    >
      <router-outlet></router-outlet>
    </div>
    <app-help-overlay></app-help-overlay>
  `,
  animations: [slideInAnimation],
  styles: [
    `
      .app-route-container {
        width: 100%;
        height: 100%;
        overflow: hidden;
        background-color: #000;
      }
    `,
  ],
  imports: [RouterOutlet, HelpOverlayComponent],
})
export class AppComponent implements OnInit {
  private navigationCounter = 0;
  private currentRandomType: string = "slide";

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

    this.dataService.getRaceUpdate().subscribe((_update) => {
      this.logger.debug("AppComponent: Received Race Update");
      // Removed forced navigation to /raceday to allow other components to handle updates
    });

    // Pick a random transition once per navigation to stabilize the animation
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.navigationCounter++;
        this.selectRandomTransition();
      });

    // Initial random selection
    this.selectRandomTransition();
  }

  private selectRandomTransition() {
    const transitions = ["slide", "zoom", "blur", "fade"];
    const randomIndex = Math.floor(Math.random() * transitions.length);
    this.currentRandomType = transitions[randomIndex];
  }

  getRouteAnimationData() {
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
