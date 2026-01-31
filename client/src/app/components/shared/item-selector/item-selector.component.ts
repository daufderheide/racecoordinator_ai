import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-item-selector',
  standalone: false,
  templateUrl: './item-selector.component.html',
  styleUrls: ['./item-selector.component.css']
})
export class ItemSelectorComponent {
  @Input() visible = false;
  @Input() title = 'SELECT ITEM';
  @Input() items: any[] = [];

  @Output() select = new EventEmitter<any>();
  @Output() close = new EventEmitter<void>();

  onSelect(item: any) {
    this.select.emit(item);
  }

  onClose() {
    this.close.emit();
  }
}
