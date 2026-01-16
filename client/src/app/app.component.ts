import { Component } from '@angular/core';
import { ChildrenOutletContexts } from '@angular/router';
import { slideInAnimation } from './utils/animations';

@Component({
  selector: 'app-root',
  template: `
    <h1 style="text-align:center; font-family:sans-serif; color:#444;">Java + Angular App Wrapper</h1>
    <nav style="text-align:center; margin-bottom: 20px;">
      <a routerLink="/" style="margin: 0 10px; text-decoration: none; color: blue;">Home</a>
      <a routerLink="/raceday-setup" style="margin: 0 10px; text-decoration: none; color: blue;">Raceday Setup</a>
    </nav>
    <div [@routeAnimations]="getRouteAnimationData()">
      <router-outlet></router-outlet>
    </div>
  `,
  animations: [slideInAnimation],
  styles: [],
  standalone: false
})
export class AppComponent {
  constructor(private contexts: ChildrenOutletContexts) { }

  getRouteAnimationData() {
    return this.contexts.getContext('primary')?.route?.snapshot?.data?.['animation'];
  }
}
