import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-manager-header',
  templateUrl: './manager-header.component.html',
  styleUrls: ['./manager-header.component.css'],
  standalone: false
})
export class ManagerHeaderComponent {
  @Input() title: string = '';
  @Input() backTargetUrl: string = '/raceday-setup';
  @Input() showActions: boolean = true;
  @Input() showAdd: boolean = true;
  @Input() showEdit: boolean = true;
  @Input() showHelp: boolean = true;
  @Input() showDelete: boolean = true;
  @Input() showCopy: boolean = false;
  @Input() isSaving: boolean = false;

  @Output() add = new EventEmitter<void>();
  @Output() edit = new EventEmitter<void>();
  @Output() copy = new EventEmitter<void>();
  @Output() help = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();

  onAdd() {
    this.add.emit();
  }

  onEdit() {
    this.edit.emit();
  }

  onHelp() {
    this.help.emit();
  }

  onDelete() {
    this.delete.emit();
  }

  onCopy() {
    this.copy.emit();
  }
}
