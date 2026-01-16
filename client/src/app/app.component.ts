import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <h1 style="text-align:center; font-family:sans-serif; color:#444;">Java + Angular App Wrapper</h1>
    <nav style="text-align:center; margin-bottom: 20px;">
      <a routerLink="/" style="margin: 0 10px; text-decoration: none; color: blue;">Home</a>
      <a routerLink="/raceday-setup" style="margin: 0 10px; text-decoration: none; color: blue;">Raceday Setup</a>
    </nav>
    <router-outlet></router-outlet>
  `,
  styles: [],
  standalone: false
})
export class AppComponent { }
