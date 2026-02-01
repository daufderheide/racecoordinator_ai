import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-item-selector',
  standalone: false,
  templateUrl: './item-selector.component.html',
  styleUrls: ['./item-selector.component.css']
})
export class ItemSelectorComponent {
  @Input() visible = false;
  @Input() title?: string;
  @Input() items: any[] = [];
  searchTerm: string = '';

  @Input() itemType: 'image' | 'sound' = 'image';

  @Input() backButtonRoute: string | null = null;
  @Input() backButtonQueryParams: any = {};
  @Input() backButtonLabel?: string;

  get filteredItems() {
    if (!this.searchTerm) {
      return this.items;
    }
    const lowerTerm = this.searchTerm.toLowerCase();
    return this.items.filter(item => item.name && item.name.toLowerCase().includes(lowerTerm));
  }

  @Output() select = new EventEmitter<any>();
  @Output() close = new EventEmitter<void>();

  constructor(private router: Router) { }

  onBack() {
    if (this.backButtonRoute) {
      sessionStorage.setItem('skipIntro', 'true');
      this.router.navigate([this.backButtonRoute], { queryParams: this.backButtonQueryParams });
    }
    this.close.emit();
  }

  onSelect(item: any) {
    this.select.emit(item);
  }

  onClose() {
    this.close.emit();
  }
}
