import { Component, Input, Output, EventEmitter } from '@angular/core';
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
  @Input() confirm: boolean = false;
  @Input() confirmTitle: string = 'CD_CONFIRM_EXIT_TITLE'; // Default title (Exit Race) or generic
  @Input() confirmMessage: string = 'CD_CONFIRM_EXIT_MESSAGE'; // Default message

  @Output() back = new EventEmitter<void>();

  showModal = false;

  constructor(private router: Router) { }

  onBack() {
    if (this.confirm) {
      this.showModal = true;
    } else {
      this.proceed();
    }
  }

  onModalConfirm() {
    this.showModal = false;
    this.proceed();
  }

  onModalCancel() {
    this.showModal = false;
  }

  private proceed() {
    if (this.back.observed) {
      this.back.emit();
    } else {
      sessionStorage.setItem('skipIntro', 'true');
      this.router.navigate([this.route], { queryParams: this.queryParams });
    }
  }
}
