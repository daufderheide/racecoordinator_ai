import { Component, EventEmitter, Output } from '@angular/core';

export type ScreenType = 'race-screen' | 'extra-screen';

@Component({
  selector: 'app-screen-selector',
  templateUrl: './screen-selector.component.html',
  styleUrls: ['./screen-selector.component.css'],
  standalone: false
})
export class ScreenSelectorComponent {
  @Output() screenSelected = new EventEmitter<ScreenType>();
  @Output() cancelled = new EventEmitter<void>();

  selectScreen(screenType: ScreenType) {
    this.screenSelected.emit(screenType);
  }

  cancel() {
    this.cancelled.emit();
  }
}
