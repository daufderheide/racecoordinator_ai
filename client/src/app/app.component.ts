import { Component, OnInit } from "@angular/core";
import {
  ChildrenOutletContexts,
  NavigationEnd,
  Router,
  RouterOutlet,
} from "@angular/router";
import { filter } from "rxjs/operators";
import { slideInAnimation } from "src/app/utils/animations";

import { AnalyticsService } from "./analytics.service";
import { DataService } from "./data.service";
import { NavigationService } from "./services/navigation.service";
import { SettingsService } from "./services/settings.service";
import { ThemeService } from "./services/theme.service";
import { HelpOverlayComponent } from "./components/shared/help-overlay/help-overlay.component";

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
  ) {}

  ngOnInit() {
    console.log("AppComponent: Initializing application...");
    this.analyticsService.initTracking();
    this.dataService.connectToRaceDataSocket();

    this.themeService.initialize().then(() => {
      console.log("AppComponent: ThemeService initialized");
    });

    this.dataService.getRaceUpdate().subscribe((_update) => {
      console.log("AppComponent: Received Race Update");
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
