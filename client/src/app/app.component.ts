import { Component } from '@angular/core';
import { ChildrenOutletContexts } from '@angular/router';
import { slideInAnimation } from './utils/animations';

@Component({
  selector: 'app-root',
  template: `
    <div class="app-route-container" [@routeAnimations]="getRouteAnimationData()">
      <router-outlet></router-outlet>
    </div>
  `,
  animations: [slideInAnimation],
  styles: [`
    .app-route-container {
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
  `],
  standalone: false
})
export class AppComponent {
  constructor(private contexts: ChildrenOutletContexts) { }

  getRouteAnimationData() {
    return this.contexts.getContext('primary')?.route?.snapshot?.data?.['animation'];
  }
}
