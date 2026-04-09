import { Component, OnInit } from "@angular/core";
import { ChildrenOutletContexts, Router } from "@angular/router";
import { slideInAnimation } from "src/app/utils/animations";

import { AnalyticsService } from "./analytics.service";
import { DataService } from "./data.service";

@Component({
  selector: "app-root",
  template: `
    <div
      class="app-route-container"
      [@routeAnimations]="getRouteAnimationData()"
    >
      <router-outlet></router-outlet>
    </div>
  `,
  animations: [slideInAnimation],
  styles: [
    `
      .app-route-container {
        width: 100%;
        height: 100%;
        overflow: hidden;
      }
    `,
  ],
  standalone: false,
})
export class AppComponent implements OnInit {
  constructor(
    private contexts: ChildrenOutletContexts,
    private dataService: DataService,
    private router: Router,
    private analyticsService: AnalyticsService,
  ) {}

  ngOnInit() {
    console.log("AppComponent: Initializing application...");
    this.analyticsService.initTracking();
    this.dataService.connectToRaceDataSocket();

    this.dataService.getRaceUpdate().subscribe((update) => {
      console.log("AppComponent: Received Race Update");
      // Removed forced navigation to /raceday to allow other components to handle updates
    });
  }

  getRouteAnimationData() {
    return this.contexts.getContext("primary")?.route?.snapshot?.data?.[
      "animation"
    ];
  }
}
