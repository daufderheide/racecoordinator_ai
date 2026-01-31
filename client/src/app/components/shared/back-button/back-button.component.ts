import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-back-button',
  templateUrl: './back-button.component.html',
  styleUrls: ['./back-button.component.css'],
  standalone: false
})
export class BackButtonComponent {
  @Input() label: string = 'BACK';
  @Input() route: string = '/raceday-setup';
  @Input() queryParams: any = {};

  constructor(private router: Router) { }

  onBack() {
    sessionStorage.setItem('skipIntro', 'true');
    this.router.navigate([this.route], { queryParams: this.queryParams });
  }
}
